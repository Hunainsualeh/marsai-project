'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowUp, Square, Check, Zap, Cpu, Sparkles, Eye, Layers, Image, FileText, File, X, PenLine, Monitor } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/lib/models';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Lazy-load the canvas drawer so it doesn't bloat the initial bundle
const CanvasDrawer = dynamic(() => import('./CanvasDrawer'), { ssr: false });

interface ChatInputProps {
  inputValue?: string;
  setInputValue?: (value: string) => void;
  onSend?: () => void;
  isStreaming?: boolean;
  onStop?: () => void;
  attachment?: string | null;
  attachmentName?: string | null;
  onRemoveAttachment?: () => void;
  onFileSelect?: (file: File) => void;
  onCanvasAttach?: (dataUrl: string, fileName: string) => void;
  currentModel?: string;
  onModelChange?: (modelId: string) => void;
  codeCanvasMode?: boolean;
  onToggleCodeCanvas?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputValue = '',
  setInputValue = () => { },
  onSend = () => { },
  isStreaming = false,
  onStop = () => { },
  attachment = null,
  attachmentName = null,
  onRemoveAttachment = () => { },
  onFileSelect = () => { },
  onCanvasAttach,
  currentModel = 'llama-3.3-70b-versatile',
  onModelChange = () => { },
  codeCanvasMode = false,
  onToggleCodeCanvas,
}) => {
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [localCanvasMode, setLocalCanvasMode] = useState(false);
  const attachRef = useRef<HTMLDivElement>(null);

  // Code canvas mode: use prop handler if provided, else local state
  const isCanvasMode = onToggleCodeCanvas ? codeCanvasMode : localCanvasMode;
  const handleToggleCanvas = onToggleCodeCanvas ?? (() => setLocalCanvasMode(v => !v));

  const safeValue = inputValue ?? '';

  // Auto-grow textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, []);

  useEffect(() => { resizeTextarea(); }, [safeValue, resizeTextarea]);

  // Close attach menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setShowAttachMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openFilePicker = (accept: string) => {
    setShowAttachMenu(false);
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = accept;
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) onFileSelect(files[0]);
    };
    fileInput.click();
  };

  const hasContent = safeValue.length > 0 || !!attachment;

  const attachOptions = [
    {
      label: 'Image', sub: 'JPG, PNG, WEBP, GIF',
      icon: <Image size={14} className="text-blue-400" />,
      action: () => openFilePicker('image/*'),
    },
    {
      label: 'Document', sub: 'PDF, DOCX, TXT',
      icon: <FileText size={14} className="text-amber-400" />,
      action: () => openFilePicker('.pdf,.doc,.docx,.txt'),
    },
    {
      label: 'Any File', sub: 'All file types',
      icon: <File size={14} className="text-purple-400" />,
      action: () => openFilePicker('*'),
    },
    {
      label: 'Canvas Sketch', sub: 'Draw & send to Vision AI',
      icon: <PenLine size={14} className="text-emerald-400" />,
      action: () => { setShowAttachMenu(false); setShowCanvas(true); },
    },
  ];

  return (
    <>
      <div className="w-full px-4 sm:px-6 pb-2">
        {/* Attachment Preview */}
        <AnimatePresence>
          {attachment && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="mb-2 flex items-center gap-2 px-1"
            >
              <div className="relative flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 max-w-fit">
                {attachment.startsWith('data:image') ? (
                  <img src={attachment} alt="preview" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <FileText size={18} className="text-white/40" />
                  </div>
                )}
                <span className="text-[11px] text-white/50 font-medium max-w-[160px] truncate">
                  {attachmentName || 'Attachment'}
                </span>
                <button
                  onClick={onRemoveAttachment}
                  className="p-1 rounded-full bg-black/40 text-white/40 hover:text-white hover:bg-black/60 transition-all"
                >
                  <X size={11} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Pill */}
        <motion.form
          initial={{ scaleX: 0.15, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.15 }}
          style={{ transformOrigin: 'center' }}
          onSubmit={(e) => {
            e.preventDefault();
            if (isStreaming) onStop();
            else if (safeValue.trim() || attachment) onSend();
          }}
          className={`relative flex items-end gap-1 sm:gap-2 p-1.5 bg-[#141414] rounded-[28px] border transition-all duration-300 ease-out w-full ${hasContent ? 'border-white/25' : 'border-white/8'
            }`}
        >
          {/* Attachment Button */}
          <div ref={attachRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => { setShowAttachMenu(!showAttachMenu); }}
              className={`p-2 rounded-full transition-colors ${showAttachMenu ? 'text-white bg-white/10' : 'text-white/30 hover:text-white/70 hover:bg-white/5'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <AnimatePresence>
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 mb-3 w-[230px] bg-[#0D0D0D] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] z-[100]"
                >
                  <div className="px-4 py-2.5 border-b border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Attach</span>
                  </div>
                  <div className="p-1.5">
                    {attachOptions.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={opt.action}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all text-left"
                      >
                        <div className="p-1.5 rounded-lg bg-black border border-white/10 shrink-0">{opt.icon}</div>
                        <div>
                          <div className="text-[11px] font-bold text-white/70">{opt.label}</div>
                          <div className="text-[9px] text-white/25 font-bold uppercase tracking-wider">{opt.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Code Canvas Toggle — always visible */}
          <button
            type="button"
            onClick={handleToggleCanvas}
            title={isCanvasMode
              ? 'Code Canvas ON — code responses auto-preview. Click to disable.'
              : 'Code Canvas — enable live preview for code responses'}
            className={`p-2 rounded-full transition-all shrink-0 border ${isCanvasMode
                ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25 hover:bg-emerald-400/20'
                : 'text-white/30 border-transparent hover:text-white/60 hover:bg-white/5 hover:border-white/10'
              }`}
          >
            <Monitor size={15} />
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={safeValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isStreaming && (safeValue.trim() || attachment)) onSend();
              }
            }}
            placeholder="Send message..."
            className="flex-1 min-w-0 bg-transparent border-none text-[#E0E0E0] text-sm placeholder-white/20 outline-none ring-0 focus:ring-0 focus:outline-none py-2 px-1 resize-none leading-relaxed overflow-y-auto"
          />

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="shrink-0 p-2.5 rounded-full bg-white text-black transition-all"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!safeValue.trim() && !attachment}
              className={`shrink-0 p-2.5 rounded-full transition-all duration-300 ${hasContent
                  ? 'bg-white text-black rotate-0 scale-100'
                  : 'bg-white/10 text-white/25 rotate-[-45deg] scale-90 opacity-50'
                }`}
            >
              <ArrowUp size={17} strokeWidth={3} />
            </button>
          )}
        </motion.form>
      </div>

      {/* Canvas Drawer */}
      <CanvasDrawer
        isOpen={showCanvas}
        onClose={() => setShowCanvas(false)}
        onAttach={(dataUrl, fileName) => {
          if (onCanvasAttach) {
            onCanvasAttach(dataUrl, fileName);
          } else {
            // Fallback: convert dataUrl to File and use onFileSelect
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const f = new Blob([blob], { type: 'image/png' });
                const fileObj = Object.assign(f, { name: fileName, lastModified: Date.now() }) as File;
                onFileSelect(fileObj);
              });
          }
        }}
      />
    </>
  );
};

export default ChatInput;
