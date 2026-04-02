import connectToDatabase from '@/lib/mongodb';
import { groqClient, SYSTEM_PROMPT, DEFAULT_MODEL } from '@/lib/groq';
import { Session } from '@/models/Session';
import { Message } from '@/models/Message';

export const maxDuration = 60;

/** Rough token estimator: ~4 chars per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

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
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { message, image, sessionId, model } = body;

  try {
    if (!message && !image && !sessionId) {
      return new Response(
        JSON.stringify({ error: 'message or image, and sessionId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await connectToDatabase();

    const session = await Session.findById(sessionId);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let dbContent: string;
    let actualContent: unknown;

    if (image) {
      actualContent = [
        { type: 'text', text: message || '' },
        { type: 'image_url', image_url: { url: image } },
      ];
      dbContent = JSON.stringify(actualContent);
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
          if (Array.isArray(parsedContent)) hasVisionContext = true;
        }
      } catch { /* keep string */ }
      return { role: m.role as 'user' | 'assistant', content: parsedContent };
    });

    let selectedModel = model || session.model || DEFAULT_MODEL;
    if (image || hasVisionContext) {
      selectedModel = 'meta-llama/llama-4-scout-17b-16e-instruct';
    }

    // Trim to context window — only send recent messages
    const trimmedMessages = trimHistory(allMessages, selectedModel);

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...trimmedMessages,
    ];

    // Estimate input tokens for usage reporting
    const inputText = messages.map(m =>
      typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    ).join(' ');
    const estimatedInputTokens = estimateTokens(inputText);

    const completion = await groqClient.chat.completions.create({
      model: selectedModel,
      messages: messages as Parameters<typeof groqClient.chat.completions.create>[0]['messages'],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

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

          await Message.create({ sessionId, role: 'assistant', content: fullResponse });
          await Session.findByIdAndUpdate(sessionId, { updatedAt: new Date() });

          // Emit usage metadata before DONE
          const usageMeta = {
            model: selectedModel,
            promptTokens: promptTokens || estimatedInputTokens,
            completionTokens: completionTokens || estimateTokens(fullResponse),
            totalTokens: (promptTokens || estimatedInputTokens) + (completionTokens || estimateTokens(fullResponse)),
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
