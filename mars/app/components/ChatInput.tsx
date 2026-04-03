'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowUp, Square, Check, Zap, Cpu, Sparkles, Eye, Layers, Image as ImageIcon, FileText, File, X, PenLine, Monitor, Globe } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/lib/models';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Lazy-load the canvas drawer so it doesn't bloat the initial bundle
const CanvasDrawer = dynamic(() => import('./CanvasDrawer').catch(err => {
  console.error("Failed to load CanvasDrawer", err);
  return () => null;
}), { ssr: false });

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
  webSearchMode?: boolean;
  onToggleWebSearch?: () => void;
  linkUrl?: string;
  setLinkUrl?: (url: string) => void;
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
  webSearchMode = false,
  onToggleWebSearch,
  linkUrl = '',
  setLinkUrl = () => { },
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
      icon: <ImageIcon size={14} className="text-blue-400" />,
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
        
        {/* Link Input Field */}
        <AnimatePresence>
          {linkUrl && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="mb-2 flex items-center gap-2 px-1"
            >
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-1.5 max-w-full">
                <Globe size={14} className="text-blue-400" />
                <span className="text-[11px] text-blue-300 font-medium truncate max-w-[250px]">
                  {linkUrl}
                </span>
                <button
                  onClick={() => setLinkUrl('')}
                  className="p-1 rounded-full hover:bg-blue-500/20 text-blue-400/60 hover:text-blue-300 transition-all"
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
          className={`relative flex items-center gap-1 p-1.5 bg-[#141414] rounded-[28px] border transition-all duration-300 ease-out w-full min-h-[50px] ${hasContent ? 'border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.02)]' : 'border-white/5'
            }`}
        >
          {/* Attachment Button */}
          <div ref={attachRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => { setShowAttachMenu(!showAttachMenu); }}
              className={`flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all ${showAttachMenu ? 'text-white bg-white/10' : 'text-white/25 hover:text-white/70 hover:bg-white/5'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="sm:scale-110">
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

          {/* Model Intelligence Toolbar */}
          <div className="flex items-center gap-0.5 sm:gap-1 border-white/5 sm:border-x px-1 sm:px-1.5 mx-0.5">
            <button
              type="button"
              onClick={handleToggleCanvas}
              title="Toggle Code Preview"
              className={`flex items-center justify-center h-8 w-8 rounded-full transition-all shrink-0 border ${isCanvasMode
                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25'
                  : 'text-white/20 border-transparent hover:text-white/60 hover:bg-white/5'
                }`}
            >
              <Monitor size={14} />
            </button>

            <button
              type="button"
              onClick={onToggleWebSearch}
              title="Toggle Web Search"
              className={`flex items-center justify-center h-8 w-8 rounded-full transition-all shrink-0 border ${webSearchMode
                  ? 'text-blue-400 bg-blue-400/10 border-blue-400/25'
                  : 'text-white/20 border-transparent hover:text-white/60 hover:bg-white/5'
                }`}
            >
              <Globe size={14} />
            </button>
          </div>

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
            onPaste={(e) => {
              const pastedText = e.clipboardData.getData('text');
              const urlRegex = /(https?:\/\/[^\s]+)/g;
              const matches = pastedText.match(urlRegex);
              if (matches && matches.length > 0 && !linkUrl) {
                const firstUrl = matches[0];
                setLinkUrl(firstUrl);
                // If the entire pasted text is just the URL, clear the textarea
                if (pastedText.trim() === firstUrl) {
                  e.preventDefault();
                } else {
                  // If it's a mix, let it paste but maybe strip it? 
                  // For now, just let it paste other text if it's there.
                }
              }
            }}
            placeholder="Send message to Mars AI..."
            className="flex-1 min-w-0 bg-transparent border-none text-[#E0E0E0] text-sm placeholder-white/20 outline-none ring-0 focus:ring-0 focus:outline-none py-2.5 px-2 resize-none leading-normal overflow-y-auto"
          />

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full bg-white text-black transition-all"
            >
              <Square size={12} fill="currentColor" className="sm:scale-110" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!safeValue.trim() && !attachment}
              className={`flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full transition-all duration-300 ${hasContent
                  ? 'bg-white text-black rotate-0 scale-100'
                  : 'bg-white/10 text-white/20 rotate-[-45deg] scale-90 opacity-40'
                }`}
            >
              <ArrowUp size={14} strokeWidth={3} className="sm:scale-110" />
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
