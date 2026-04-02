'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import Editor, { useMonaco, loader } from '@monaco-editor/react';
import { useDebounce } from 'use-debounce';
import {
  Play, Code2, RotateCcw, Maximize2, Minimize2, Copy, Check, X,
  Monitor, Layout, TerminalSquare, AlertTriangle, FileCode
} from 'lucide-react';
import { useCanvasStore } from '@/lib/canvasStore';
import { buildSandboxDoc } from '@/lib/sandboxCompiler';

// Configure Monaco to use UNPKG instead of JSDelivr to bypass regional network blocks (fixes 'Monaco initialization: [object Event]' error)
loader.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.43.0/min/vs' } });

interface CodeCanvasProps {
  code?: string;
  language?: string;
  files?: Record<string, string>; // The new VFS JSON format
  onClose?: () => void;
  inline?: boolean;
}

export default function CodeCanvas({ code = '', language = 'text', files, onClose, inline = false }: CodeCanvasProps) {
  const store = useCanvasStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isExpanded, setIsExpanded] = useState(!inline);
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Tabs / Active View
  const vfsFiles = files ? Object.keys(files) : [];
  const isVFSMode = !!files && vfsFiles.length > 0;
  const [activeTab, setActiveTab] = useState(isVFSMode ? vfsFiles[0] : 'code');
  const [consoleOpen, setConsoleOpen] = useState(false);

  // Derived state for the actual code being edited
  const [localCode, setLocalCode] = useState(isVFSMode ? files[activeTab] : code);
  
  // Update local wrapper when tabs switch
  useEffect(() => {
    if (isVFSMode) setLocalCode(store.files[activeTab] || '');
  }, [activeTab, isVFSMode, store.files]);

  // Sync incoming files to Zustand store on mount
  useEffect(() => {
    if (isVFSMode) {
      store.setFiles(files);
      store.setActiveFile(vfsFiles[0]);
    }
  }, [files]);

  // Debounce the compiled srcDoc compilation (500ms reactive typing)
  const [debouncedVFS] = useDebounce(store.files, 500);
  const [debouncedCode] = useDebounce(localCode, 500);

  const previewDoc = useCallback(() => {
    if (isVFSMode) {
      return buildSandboxDoc(debouncedVFS);
    }
    // Fallback basic wrapper for standard markdown snippet rendering logic
    const isHtml = language.toLowerCase() === 'html' || language.toLowerCase() === 'vue';
    return `<!DOCTYPE html><html lang="en"><body>${isHtml ? debouncedCode : `<pre style="color:white;padding:12px;font-family:monospace">${debouncedCode}</pre>`}</body></html>`;
  }, [isVFSMode, debouncedVFS, debouncedCode, language]);

  // Proxy Message Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CANVAS_CONSOLE') {
        store.addLog(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorChange = (value: string | undefined) => {
    const val = value || '';
    setLocalCode(val);
    if (isVFSMode) {
      store.updateFile(activeTab, val);
    }
  };

  const getLanguageExt = (filename: string) => {
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.js') || filename.endsWith('.ts')) return 'javascript';
    if (filename.endsWith('.html')) return 'html';
    return language.toLowerCase();
  };

  const content = (
    <div className={`flex flex-col bg-[#0A0A0A] border border-[#1E1E1E] ${inline ? 'rounded-xl h-[400px]' : 'rounded-xl h-[85vh]'} overflow-hidden shadow-2xl`}>
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#111] border-b border-[#1E1E1E]">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#34D399]">
            {isVFSMode ? 'Live Canvas IDE' : language.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isVFSMode && (
            <button
              onClick={() => { setConsoleOpen(!consoleOpen); setPreviewKey(k => k + 1); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all ${consoleOpen ? 'bg-[#3B82F6]/20 text-[#60A5FA]' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80'}`}
            >
              <TerminalSquare size={12} />
              Console {store.logs.length > 0 && `(${store.logs.length})`}
            </button>
          )}
          <button onClick={() => setPreviewKey(k => k + 1)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <RotateCcw size={14} />
          </button>
          <button onClick={handleCopy} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
          {!inline && (
            <button onClick={() => setIsExpanded(e => !e)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all hidden md:flex">
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden relative border-b border-[#1E1E1E]">
        <PanelGroup orientation="horizontal">
          
          {/* Left Panel: Code VS Code style */}
          <Panel defaultSize={50} minSize={20} className="bg-[#1E1E1E] flex flex-col">
            {isVFSMode && (
              <div className="flex flex-row bg-[#111] overflow-x-auto border-b border-[#2D2D2D] scrollbar-hide">
                {Object.keys(store.files).map(file => (
                  <button
                    key={file}
                    onClick={() => setActiveTab(file)}
                    className={`flex items-center gap-2 px-4 py-2 border-r border-[#2D2D2D] text-[11px] font-mono whitespace-nowrap transition-all
                      ${activeTab === file ? 'bg-[#1E1E1E] text-white border-t-2 border-t-[#3B82F6]' : 'bg-[#181818] text-[#888] hover:bg-[#252525] border-t-2 border-t-transparent'}`}
                  >
                    <FileCode size={12} />
                    {file}
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 w-full pt-2">
              <Editor
                height="100%"
                language={getLanguageExt(isVFSMode ? activeTab : 'default')}
                theme="vs-dark"
                value={localCode}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'Fira Code, Cascadia Code, JetBrains Mono, monospace',
                  padding: { top: 12 },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  roundedSelection: false,
                }}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-[6px] bg-[#222] hover:bg-[#3B82F6] active:bg-[#3B82F6] transition-colors flex items-center justify-center cursor-col-resize z-10" />

          {/* Right Panel: Web Preview & Console */}
          <Panel defaultSize={50} minSize={20} className="bg-white flex flex-col relative h-full">
            <div className="flex-1 h-full w-full relative">
              <iframe
                key={previewKey}
                ref={iframeRef}
                srcDoc={previewDoc()}
                sandbox="allow-scripts allow-modals allow-popups"
                className="w-full h-full border-none bg-white"
                title="Sandbox Preview"
              />
            </div>
            
            {/* Custom Terminal UI overlay */}
            <AnimatePresence>
              {consoleOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '40%', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="absolute bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-[#333] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20 flex flex-col"
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#252525] border-b border-[#333]">
                    <span className="text-[10px] font-mono font-bold text-[#A3A3A3] uppercase tracking-wider">Browser Console</span>
                    <button onClick={() => store.clearLogs()} className="text-[10px] text-[#A3A3A3] hover:text-white px-2 rounded hover:bg-[#333]">Clear</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 font-mono text-xs flex flex-col">
                    {store.logs.length === 0 ? (
                      <div className="text-[#666] italic p-2">Waiting for console output...</div>
                    ) : (
                      store.logs.map((log) => (
                        <div key={log.id} className={`p-1.5 mb-1 rounded border-l-2 font-mono break-all ${
                          log.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-400' :
                          log.type === 'warn' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-300' :
                          log.type === 'info' ? 'bg-blue-500/10 border-blue-500 text-blue-300' :
                          'bg-transparent border-[#444] text-[#D4D4D4]'
                        }`}>
                          <span className="text-[#666] mr-2 text-[9px] select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          {log.messages.join(' ')}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );

  if (!inline) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${isExpanded ? 'max-w-[100vw] h-[100vh] rounded-none' : 'max-w-6xl'} shadow-2xl transition-all`}
          >
            {content}
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return content;
}
