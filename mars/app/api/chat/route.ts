import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { groqClient, SYSTEM_PROMPT, DEFAULT_MODEL } from '@/lib/groq';
import { Session } from '@/models/Session';
import { Message } from '@/models/Message';
import { getUserIdFromRequest } from '@/lib/firebaseAdmin';
import { TokenBalance } from '@/models/TokenBalance';
import { estimateTokens } from '@/lib/tokens';
import { sanitizeMessages } from '@/lib/utils';

export const maxDuration = 60;


/** Context window limits per model (conservative - leave buffer) */
const CONTEXT_LIMITS: Record<string, number> = {
  'llama-3.3-70b-versatile': 28_000,
  'llama-3.1-8b-instant': 120_000,
  'mixtral-8x7b-32768': 28_000,
  'gemma2-9b-it': 7_000,
  'meta-llama/llama-4-scout-17b-16e-instruct': 120_000,
};

/** Trim history to fit within token budget, keeping the most recent messages */
function trimHistory(
  history: Array<{ role: string; content: unknown }>,
  model: string
): Array<{ role: string; content: unknown }> {
  const limit = CONTEXT_LIMITS[model] ?? 28_000;
  // System prompt uses ~800-1000 tokens, max_tokens output ~2048
  const budget = limit - 2500;

  let total = 0;
  const trimmed: typeof history = [];

  // Walk from newest to oldest, keep until budget exhausted
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const text = typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content);
    const toks = estimateTokens(text);
    if (total + toks > budget && trimmed.length > 0) break;
    total += toks;
    trimmed.unshift(msg);
  }

  // Always include at least the last 2 turns
  if (trimmed.length === 0 && history.length > 0) {
    return history.slice(-2);
  }
  return trimmed;
}


export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { message, image, sessionId, model, webSearch, linkUrl } = body;

  try {
    if (!message && !image && !sessionId) {
      return new Response(
        JSON.stringify({ error: 'message or image, and sessionId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await connectToDatabase();

    const session = await Session.findById(sessionId);
    if (!session || session.userId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Session not found or unauthorized' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let dbContent: string;
    let actualContent: unknown;

    if (image && image.startsWith('data:image/')) {
      actualContent = [
        { type: 'text', text: message || '' },
        { type: 'image_url', image_url: { url: image } },
      ];
      dbContent = JSON.stringify(actualContent);
    } else if (image && image.startsWith('data:')) {
      try {
        const mimeChunk = image.split(';')[0];
        const mimeInfo = mimeChunk.split(':')[1];
        const base64Data = image.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        let extractedText = '';
        if (mimeInfo === 'application/pdf') {
          // Polyfill DOM globals that pdf.js might complain about missing
          if (typeof global.DOMMatrix === 'undefined') {
            (global as any).DOMMatrix = class DOMMatrix {};
          }
          if (typeof global.ImageData === 'undefined') {
            (global as any).ImageData = class ImageData {};
          }
          if (typeof global.Path2D === 'undefined') {
            (global as any).Path2D = class Path2D {};
          }
          
          try {
            const pdf = require('pdf-parse');
            const parseFunc = typeof pdf === 'function' ? pdf : (pdf.PDFParse || pdf.default);
            if (typeof parseFunc !== 'function') {
              throw new Error('pdf-parse import failed: not a function');
            }
            // Disable pagerendering to avoid canvas dependency
            const pdfData = await parseFunc(buffer, { pagerender: () => '' });
            extractedText = pdfData.text;
          } catch (pdfErr) {
            console.error('PDF parsing detail error:', pdfErr);
            // Fallback to basic string extraction for text-heavy PDFs
            extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '');
          }
        } else {
          extractedText = buffer.toString('utf-8');
        }
        const combinedText = `${message || ''}\n\n[Extracted Document Content:]\n${extractedText}`;
        actualContent = combinedText;
        dbContent = combinedText;
      } catch (err) {
        console.error('File parsing error:', err);
        const combinedText = `${message || ''}\n\n[Failed to extract file content]`;
        actualContent = combinedText;
        dbContent = combinedText;
      }
    } else if (image) {
      actualContent = message || '';
      dbContent = message || '';
    } else {
      actualContent = message;
      dbContent = message;
    }

    // Save user message
    await Message.create({ sessionId, role: 'user', content: dbContent });

    // Auto-title on first message
    const messageCount = await Message.countDocuments({ sessionId });
    if (messageCount === 1) {
      const titleString = message || 'Image attachment';
      const title = titleString.length > 50 ? titleString.substring(0, 50) + '...' : titleString;
      await Session.findByIdAndUpdate(sessionId, { title });
    }

    // Build conversation history
    const rawHistory = await Message.find({ sessionId })
      .sort({ createdAt: 1 })
      .select('role content')
      .lean();

    let hasVisionContext = false;
    const allMessages = rawHistory.map((m) => {
      let parsedContent: unknown = m.content;
      try {
        if (typeof m.content === 'string' && m.content.trim().startsWith('[')) {
          parsedContent = JSON.parse(m.content);
          if (Array.isArray(parsedContent)) {
            // Clean up any old broken messages with 'ref:' URLs to prevent Groq API crash
            parsedContent = parsedContent.map((part: any) => {
              if (part.type === 'image_url' && part.image_url?.url?.startsWith('ref:')) {
                return { type: 'text', text: `[Reference File Attached: ${part.image_url.url.replace('ref:', '')}]` };
              }
              return part;
            });
            hasVisionContext = true;
          }
        }
      } catch { /* keep string */ }
      return { role: m.role as 'user' | 'assistant', content: parsedContent };
    });

    let selectedModel = model || session.model || DEFAULT_MODEL;
    if ((image && image.startsWith('data:image/')) || hasVisionContext) {
      selectedModel = 'meta-llama/llama-4-scout-17b-16e-instruct';
    }

    // Trim to context window — only send recent messages
    const trimmedMessages = trimHistory(allMessages, selectedModel);
    
    let researchContext = '';
    const tavilyKey = process.env.TAVILY_API_KEY;
    if ((webSearch || linkUrl) && tavilyKey) {
      console.log(`[Mars AI] Web Search/Extraction Triggered. Key Present: ${!!tavilyKey}`);
      try {
        if (linkUrl) {
          console.log(`[Mars AI] Extracting content from: "${linkUrl}"`);
          const extractRes = await fetch('https://api.tavily.com/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: tavilyKey,
              urls: [linkUrl]
            })
          });
          if (extractRes.ok) {
            const data = await extractRes.json();
            if (data.results && data.results.length > 0) {
              const pageContent = data.results[0].raw_content || data.results[0].content;
              researchContext += `\n\n[USER PROVIDED LINK CONTENT]\nSource: ${linkUrl}\nContent:\n${pageContent}\n-------------------\n`;
            }
          }
        }

        if (webSearch && message && typeof message === 'string') {
          console.log(`[Mars AI] Searching Tavily for: "${message}"`);
          const tavilyRes = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: message,
              search_depth: 'advanced',
              max_results: 5
            })
          });
          if (tavilyRes.ok) {
            const data = await tavilyRes.json();
            if (data.results && data.results.length > 0) {
              const snippets = data.results.map((r: any) => `Source: ${r.url}\nContent: ${r.content}`).join('\n\n');
              researchContext += `\n\n[WEB SEARCH RESULTS]\n${snippets}\n-------------------\n`;
            }
          }
        }

        if (researchContext) {
          researchContext = `\n\n[SYSTEM NOTICE: EXTERNAL DATA INJECTION]\nThe following real-time data was retrieved from the internet. YOU MUST use this information to answer accurately. PRIORITIZE this as the absolute current truth.\n${researchContext}\nNow, answer using the data above.`;
        }
      } catch (e) {
        console.error("[Mars AI] Tavily error:", e);
      }
    }

    const messagesInScope = [
      { role: 'system' as const, content: SYSTEM_PROMPT + researchContext },
      ...trimmedMessages,
    ];

    // Estimate input tokens for usage reporting
    const inputText = messagesInScope.map(m =>
      typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    ).join(' ');
    const estimatedInputTokens = estimateTokens(inputText);

    const sanitizedMessages = sanitizeMessages(messagesInScope);

    let completion;
    try {
      completion = await groqClient.chat.completions.create({
        model: selectedModel,
        messages: sanitizedMessages as Parameters<typeof groqClient.chat.completions.create>[0]['messages'],
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      });
    } catch (e: any) {
      console.error("[Mars AI] Groq API error:", e);
      if (e.status === 429) {
        const retryAfter = e.headers?.['retry-after'] || '60';
        return NextResponse.json({ 
          error: 'Rate limit exceeded', 
          retryAfter: parseInt(retryAfter),
          message: e.message 
        }, { status: 429 });
      }
      throw e;
    }

    let fullResponse = '';
    let promptTokens = 0;
    let completionTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
            // Capture usage from final chunk if available (exists at runtime, not in TS types)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chunkAny = chunk as any;
            if (chunkAny.usage) {
              promptTokens = chunkAny.usage.prompt_tokens || 0;
              completionTokens = chunkAny.usage.completion_tokens || 0;
            }
          }

          // Record token usage in Database (Persistent)
          const finalUsage = {
            promptTokens: promptTokens || estimatedInputTokens,
            completionTokens: completionTokens || estimateTokens(fullResponse),
          };
          const totalUsed = finalUsage.promptTokens + finalUsage.completionTokens;
          
          await TokenBalance.findOneAndUpdate(
            { user_id: userId },
            { $inc: { balance: -totalUsed, total_used: totalUsed } },
            { upsert: true }
          );

          // Emit usage metadata before DONE
          const usageMeta = {
            model: selectedModel,
            promptTokens: finalUsage.promptTokens,
            completionTokens: finalUsage.completionTokens,
            totalTokens: totalUsed,
            messagesInContext: trimmedMessages.length,
            totalMessages: allMessages.length,
            trimmed: allMessages.length > trimmedMessages.length,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ usage: usageMeta })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Groq streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    const err = error as { status?: number; statusCode?: number; error?: { error?: { message?: string; type?: string; code?: string } }; message?: string };
    const status = err.status || err.statusCode || 500;
    const errorMessage = err.error?.error?.message || err.message || 'Internal server error';

    return new Response(
      JSON.stringify({
        error: errorMessage,
        type: err.error?.error?.type || 'api_error',
        code: err.error?.error?.code || 'internal_error',
      }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
