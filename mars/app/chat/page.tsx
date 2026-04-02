'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUp,
  Bot,
  User,
  Square,
  Code,
  BookOpen,
  Lightbulb,
  Search,
  Loader2,
  ArrowLeft,
  X,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import ChatInput from '@/app/components/ChatInput';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';
import Timeline, { TimelineNode } from '@/app/components/Timeline';
import AnimatedMars from '@/app/components/AnimatedMars';
import Marquee from '@/app/components/marquee';
import UsageModal from '@/app/components/UsageModal';
import { TokenTracker } from '@/app/components/TokenTracker';
import { AVAILABLE_MODELS } from '@/lib/models';
import DynamicText from '@/app/components/DynamicText';

const BG_COLOR = "#000000";
const GRID_STYLE = {
  backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
  backgroundSize: '100px 100px'
};

interface ChatMessage {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  status?: string;
  label?: string;
}

const MARQUEE_ITEMS_1 = [
  { icon: '📝', text: 'Draft an email', prompt: 'Help me draft an email' },
  { icon: '💻', text: 'Refactor code', prompt: 'Help me refactor this piece of code' },
  { icon: '🔍', text: 'Explain a concept', prompt: 'Explain a complex concept in simple terms' },
  { icon: '💡', text: 'Brainstorm ideas', prompt: 'Help me brainstorm creative ideas' },
  { icon: '📊', text: 'Analyze data', prompt: 'Help me analyze this data' },
];

const MARQUEE_ITEMS_2 = [
  { icon: '🧪', text: 'Write tests', prompt: 'Write unit tests for this module' },
  { icon: '📖', text: 'Summarize text', prompt: 'Summarize the following text' },
  { icon: '🎨', text: 'Design review', prompt: 'Review this UI design' },
  { icon: '⚡', text: 'Optimize logic', prompt: 'Optimize this algorithm' },
  { icon: '🌍', text: 'Translate string', prompt: 'Translate this text' },
];

const MARQUEE_ITEMS_3 = [
  { icon: '🚀', text: 'Build landing page', prompt: 'Write code for a landing page' },
  { icon: '🐞', text: 'Debug error', prompt: 'Help me debug this error' },
  { icon: '📚', text: 'Create documentation', prompt: 'Generate documentation for my code' },
  { icon: '🧠', text: 'Neural reasoning', prompt: 'Use absolute logic to solve this' },
  { icon: '🎭', text: 'Creative story', prompt: 'Write me a short creative story' },
];

function ChatPageInner({
  currentModel,
  inputStyle,
  sidebarOpen = false,
  onModelChange = () => { },
}: {
  currentModel?: string;
  inputStyle?: string;
  sidebarOpen?: boolean;
  onModelChange?: (modelId: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('s');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [error, setError] = useState<{ message: string; type?: string; code?: string } | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [usageModalOpen, setUsageModalOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const skipNextFetchRef = useRef(false);
  const lastFailedMsgRef = useRef<string>(''); // stores text of last rate-limited message

  const [codeCanvasMode, setCodeCanvasMode] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  const scrollToMessage = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el && scrollRef.current) {
      const containerTop = scrollRef.current.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const relativeTop = elTop - containerTop + scrollRef.current.scrollTop - 40;

      scrollRef.current.scrollTo({
        top: relativeTop,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    let cancelled = false;
    const loadSession = async () => {
      setLoadingSession(true);
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        if (!cancelled) setLoadingSession(false);
      }
    };

    loadSession();
    return () => { cancelled = true; };
  }, [sessionId]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const processImageFile = (file: File) => {
    setAttachmentName(file.name);
    if (file.type.startsWith('image/')) {
      // Process image: resize and convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxSize) { height *= maxSize / width; width = maxSize; }
          } else {
            if (height > maxSize) { width *= maxSize / height; height = maxSize; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setAttachment(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // Non-image: store file name as context marker
      setAttachment(`file:${file.name}`);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) processImageFile(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSend = async (overridePrompt?: string) => {
    const text = overridePrompt || input.trim();
    if ((!text && !attachment) || isStreaming) return;

    setError(null);
    setIsStreaming(true); // Move this up to prevent duplicate clicks during setup
    let currentSessionId = sessionId;

    if (!currentSessionId) {
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: currentModel }),
        });
        if (res.ok) {
          const data = await res.json();
          currentSessionId = data._id;
          skipNextFetchRef.current = true;
          router.replace(`/chat?s=${data._id}`);
          window.dispatchEvent(new CustomEvent('mars:refresh-sessions'));
        } else {
          setIsStreaming(false);
          return;
        }
      } catch {
        setIsStreaming(false);
        return;
      }
    }

    const userMsg: ChatMessage = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: attachment
        ? JSON.stringify([{ type: 'text', text }, { type: 'image_url', image_url: { url: attachment } }])
        : text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const sentAttachment = attachment;
    setAttachment(null);
    setAttachmentName(null);

    const assistantId = `temp-${Date.now() + 1}`;
    setMessages((prev) => [
      ...prev,
      { _id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          image: sentAttachment,
          sessionId: currentSessionId,
          model: currentModel,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errData;
        try {
          errData = await res.json();
        } catch {
          errData = { error: `API error: ${res.status}` };
        }

        if (res.status === 429) {
          const msg = errData.error || '';
          const mMatch = msg.match(/(\d+)m/);
          const sMatch = msg.match(/(\d+\.?\d*)s/);
          const m = mMatch ? parseInt(mMatch[1]) : 0;
          const s = sMatch ? parseFloat(sMatch[1]) : 0;
          const totalSecs = m * 60 + Math.ceil(s);

          setCountdown(totalSecs > 0 ? totalSecs : 60);
          setError({
            message: msg || 'Rate limit reached. Please wait a moment.',
            type: 'rate_limit',
            code: errData.code,
          });

          // Store failed message so model-switch can auto-retry
          lastFailedMsgRef.current = text;

          // Remove the blank assistant bubble — don't show 'Sorry'
          setMessages(prev => prev.filter(m => m._id !== assistantId));
        }
        throw new Error(errData.error || `API error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader available');

      let buffer = '';
      let usageMeta: { model?: string; totalTokens?: number } = {};
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m._id === assistantId
                      ? { ...m, content: m.content + parsed.content, status: undefined, label: undefined }
                      : m
                  )
                );
              }
              // Capture usage metadata emitted before [DONE]
              if (parsed.usage) {
                usageMeta = parsed.usage;
              }
            } catch { /* skip */ }
          }
        }
      }
      // Record token usage in tracker
      if (usageMeta.model && usageMeta.totalTokens) {
        TokenTracker.addUsage(usageMeta.model, usageMeta.totalTokens);
      }
      window.dispatchEvent(new CustomEvent('mars:refresh-sessions'));
    } catch (err) {
      // Abort: normal stop — no message needed
      if (err instanceof Error && err.name === 'AbortError') return;
      // Rate limit: bubble already removed above, don't overwrite
      if (error?.type === 'rate_limit') return;
      // Generic error
      setMessages((prev) =>
        prev.map((m) =>
          m._id === assistantId
            ? { ...m, content: m.content || '⚠️ Something went wrong. Please try again.' }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    handleSend(prompt);
  };

  // Canvas sketch attach handler — sets attachment and auto-selects vision model
  const handleCanvasAttach = (dataUrl: string, fileName: string) => {
    setAttachment(dataUrl);
    setAttachmentName(fileName);
    // Auto-switch to vision model for canvas sketches
    const visionModel = 'meta-llama/llama-4-scout-17b-16e-instruct';
    if (currentModel !== visionModel) {
      onModelChange(visionModel);
    }
  };

  if (!sessionId && messages.length === 0) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-8 md:gap-12 relative overflow-hidden h-full">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-30" />

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 lg:hidden">
          <Link href="/" className="p-2 rounded-lg bg-[#111] border border-[#222] text-[#888] hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
        </div>

        {/* Center Section: Mars and Title */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center px-6"
        >
          <AnimatedMars />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-0">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-[#555] tracking-tight mb-3">
              MARS AI
            </h1>
            <DynamicText size="md" interval={2200} className="max-w-sm mx-auto" />
          </motion.div>
        </motion.div>

        {/* Bottom Section: Marquee and Input */}
        <div
          className="relative w-full p-6 pb-12 z-10 flex flex-col items-center bg-gradient-to-t from-black via-black/80 to-transparent"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onPaste={handlePaste}
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[1200px] overflow-visible mb-8 flex flex-col gap-0 pointer-events-auto"
          >
            <Marquee items={MARQUEE_ITEMS_1} direction="left" speed="80s" onItemClick={handleQuickPrompt} />
            <Marquee items={MARQUEE_ITEMS_2} direction="right" speed="70s" onItemClick={handleQuickPrompt} />
          </motion.div>

          <AnimatePresence>
            {error && error.type === 'rate_limit' && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                className="w-full max-w-3xl mb-4 relative px-4"
              >
                <div className="flex items-center justify-between gap-4 p-4 bg-[#0A0A0A] border border-[#F59E0B]/30 rounded-full shadow-[0_20px_50px_-20px_rgba(245,158,11,0.2)] backdrop-blur-2xl">
                  <div className="flex items-center gap-3 px-2 flex-1">
                    <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/20">
                      <Bot size={16} className="text-[#F59E0B]" />
                    </div>
                    <p className="text-xs md:text-sm text-[#888] font-medium leading-tight">
                      Mission throttled. Resume with full model in <span className="text-white font-bold">{formatTime(countdown)}</span>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pr-2">
                    <button
                      onClick={() => setError(null)}
                      className="px-4 py-1.5 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20 rounded-full text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest transition-all"
                    >
                      Dismiss
                    </button>
                    <button onClick={() => setError(null)} className="p-2 text-[#444] hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                {/* Visual Connection Pin */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-[#F59E0B]/20 rounded-full blur-[1px]" />
              </motion.div>
            )}
          </AnimatePresence>

          {isDragging && (
            <div className="absolute inset-0 bg-[#00FF41]/5 border-2 border-dashed border-[#00FF41]/50 rounded-xl flex items-center justify-center z-50 backdrop-blur-sm m-4 pointer-events-none">
              <span className="text-[#00FF41] font-bold tracking-widest text-sm uppercase bg-[#0A0A0A]/80 px-4 py-2 rounded-lg">Drop Image Here</span>
            </div>
          )}

          <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
            {attachment && inputStyle === 'classic' && (
              <div className="mb-3 flex items-center gap-2 p-2 bg-[#1A1A1A] border border-[#333] rounded-lg max-w-fit pr-3 shadow-lg">
                <img src={attachment} alt="attachment preview" className="w-12 h-12 object-cover rounded-md" />
                <button onClick={() => setAttachment(null)} className="p-1.5 bg-[#222] text-[#888] hover:text-white hover:bg-red-500/20 rounded-md transition-colors ml-2">
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="w-full">
              {inputStyle === 'classic' ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative flex items-end gap-2 p-1.5 bg-[#0D0D0D] border border-[#1E1E1E] rounded-2xl focus-within:border-[#333] transition-all duration-300"
                >
                  <textarea
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Mars AI... (Paste images)"
                    rows={1}
                    className="flex-1 bg-transparent text-[#E0E0E0] px-4 py-3 text-sm placeholder-[#333] resize-none outline-none leading-relaxed max-h-[160px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) processImageFile(file);
                      };
                      input.click();
                    }}
                    className="p-2 text-[#888] hover:text-white rounded-lg transition-colors mb-1"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() && !attachment}
                    className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0 mb-0.5 mr-0.5 ${input.trim() || attachment ? 'bg-white text-black hover:bg-[#E0E0E0]' : 'bg-[#1A1A1A] text-[#333] opacity-50'}`}
                  >
                    <ArrowUp size={18} strokeWidth={2.5} />
                  </button>
                </form>
              ) : (
                <ChatInput
                  inputValue={input}
                  setInputValue={setInput}
                  onSend={() => handleSend()}
                  isStreaming={isStreaming}
                  onStop={handleStop}
                  attachment={attachment}
                  onRemoveAttachment={() => setAttachment(null)}
                  onFileSelect={processImageFile}
                  currentModel={currentModel}
                  onModelChange={onModelChange}
                />
              )}
            </div>
            <div className="text-center mt-3 text-[10px] text-[#222] font-mono tracking-widest uppercase">
              Enter to send • Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timelineNodes: TimelineNode[] = messages.map(m => ({ id: m._id, role: m.role as 'user' | 'assistant' }));

  return (
    <div className="flex flex-col h-full overflow-hidden relative" style={{ backgroundColor: BG_COLOR }}>
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={GRID_STYLE}></div>
      <Timeline nodes={timelineNodes} onNodeClick={scrollToMessage} />
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-20 pb-20 md:px-0">
        <div className="max-w-3xl mx-auto space-y-6">
          {loadingSession ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-[#333]" />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg._id}
                  id={`msg-${msg._id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index > messages.length - 3 ? 0.05 : 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-[#111] border border-[#1E1E1E] flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={15} className="text-[#555]" />
                    </div>
                  )}
                  <div className={`max-w-[85%] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#E0E0E0] text-[#0A0A0A] rounded-2xl rounded-tr-md px-5 py-3.5' : 'bg-transparent text-[#D0D0D0] rounded-2xl w-full'}`}>
                    {msg.role === 'assistant' ? (
                      msg.content ? <MarkdownRenderer content={msg.content} canvasMode={codeCanvasMode} /> : (
                        <span className="flex items-center gap-1.5 h-[52px]">
                          <span className="w-1.5 h-1.5 bg-[#333] rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-[#333] rounded-full animate-bounce [animation-delay:0.1s]" />
                          <span className="w-1.5 h-1.5 bg-[#333] rounded-full animate-bounce [animation-delay:0.2s]" />
                        </span>
                      )
                    ) : (
                      (() => {
                        // Render user messages — detect image attachment JSON
                        try {
                          if (msg.content.trim().startsWith('[')) {
                            const parsed = JSON.parse(msg.content);
                            if (Array.isArray(parsed)) {
                              return (
                                <div className="space-y-2">
                                  {parsed.map((item: { type: string; text?: string; image_url?: { url: string } }, i: number) => {
                                    if (item.type === 'image_url' && item.image_url) return (
                                      <img key={i} src={item.image_url.url} alt="Attachment" className="max-w-[220px] rounded-xl border border-black/10 shadow-md block" />
                                    );
                                    if (item.type === 'text' && item.text) return <div key={i}>{item.text}</div>;
                                    return null;
                                  })}
                                </div>
                              );
                            }
                          }
                        } catch { /* plain text fallback */ }
                        return <div>{msg.content}</div>;
                      })()
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-[#E0E0E0] flex items-center justify-center shrink-0 mt-0.5">
                      <User size={15} className="text-[#0A0A0A]" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {isStreaming && (
            <div className="flex items-center gap-2 text-[11px] text-[#444] font-mono uppercase tracking-[0.2em] pl-12 bg-gradient-to-r from-transparent via-[#F59E0B]/5 to-transparent py-2">
              <Loader2 size={12} className="animate-spin text-[#F59E0B]" />
              <span className="animate-pulse">Initializing Mission Protocols...</span>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#111] bg-[#050505] px-4 py-3 pb-6 relative" onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave} onPaste={handlePaste}>
        <div className="max-w-3xl mx-auto w-full relative">
          <AnimatePresence>
            {error && error.type === 'rate_limit' && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute -top-[90px] left-0 right-0 z-50 px-2"
              >
                <div className="w-full bg-[#0A0A0A] border border-[#F59E0B]/30 rounded-2xl p-3 shadow-[0_-20px_50px_-20px_rgba(245,158,11,0.2)] backdrop-blur-2xl">
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <Bot size={13} className="text-[#F59E0B] shrink-0" />
                      <p className="text-[11px] text-[#888] font-medium">
                        Throttled. Recovery in <span className="text-white font-bold">{formatTime(countdown)}</span>
                      </p>
                    </div>
                    <button onClick={() => setError(null)} className="p-1 hover:bg-white/5 rounded-full transition-colors shrink-0">
                      <X size={13} className="text-[#444] hover:text-white" />
                    </button>
                  </div>
                  {/* Switch model row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mr-1">Switch &amp; Retry:</span>
                    {AVAILABLE_MODELS
                      .filter(m => m.id !== currentModel)
                      .slice(0, 4)
                      .map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            onModelChange(m.id);
                            setError(null);
                            // Auto-retry the throttled message with the new model
                            if (lastFailedMsgRef.current) {
                              setTimeout(() => handleSend(lastFailedMsgRef.current), 80);
                              lastFailedMsgRef.current = '';
                            }
                          }}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-wider text-white/50 hover:text-white transition-all"
                        >
                          {m.badge}
                        </button>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {inputStyle === 'classic' ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className={`relative flex items-end gap-2 p-1.5 bg-[#0D0D0D] rounded-2xl border transition-all duration-300 ${input.length > 0 || attachment ? 'border-[#333]' : 'border-[#1A1A1A]'}`}>
              <textarea value={input} onChange={handleTextareaChange} onKeyDown={handleKeyDown} placeholder="Message Mars AI..." rows={1} autoFocus className="flex-1 bg-transparent text-[#E0E0E0] px-4 py-3 text-sm resize-none outline-none leading-relaxed max-h-[160px]" />
              <div className="flex items-center gap-1 mb-0.5 mr-0.5">
                <button type="button" onClick={() => {/* ... */ }} className="p-2 text-[#888] hover:text-white rounded-lg"><ImageIcon size={18} /></button>
                {isStreaming ? (
                  <button type="button" onClick={handleStop} className="p-2.5 rounded-xl bg-[#222] text-white"><Square size={16} fill="currentColor" /></button>
                ) : (
                  <button type="submit" disabled={!input.trim() && !attachment} className="p-2.5 rounded-xl bg-white text-black"><ArrowUp size={18} strokeWidth={2.5} /></button>
                )}
              </div>
            </form>
          ) : (
            <ChatInput
              inputValue={input}
              setInputValue={setInput}
              onSend={() => handleSend()}
              isStreaming={isStreaming}
              onStop={handleStop}
              attachment={attachment}
              attachmentName={attachmentName}
              onRemoveAttachment={() => { setAttachment(null); setAttachmentName(null); }}
              onFileSelect={processImageFile}
              onCanvasAttach={handleCanvasAttach}
              currentModel={currentModel}
              onModelChange={onModelChange}
              codeCanvasMode={codeCanvasMode}
              onToggleCodeCanvas={() => setCodeCanvasMode(v => !v)}
            />
          )}
        </div>
      </div>

      {/* Usage Modal */}
      <UsageModal
        isOpen={usageModalOpen}
        onClose={() => setUsageModalOpen(false)}
        currentModel={currentModel ?? 'llama-3.3-70b-versatile'}
        onSwitchModel={(id) => { onModelChange(id); }}
      />
    </div>
  );
}

export default function ChatPage(props: Record<string, unknown>) {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-[#333]" /></div>}>
      <ChatPageInner
        currentModel={props.currentModel as string | undefined}
        onModelChange={props.onModelChange as (id: string) => void | undefined}
        inputStyle={props.inputStyle as string | undefined}
      />
    </Suspense>
  );
}