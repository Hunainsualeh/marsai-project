'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ChevronDown, Check, Cpu, Zap, Layers, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/app/components/Sidebar';
import SettingsModal from '@/app/components/SettingsModal';
import { useRouter } from 'next/navigation';
import { AVAILABLE_MODELS } from '@/lib/models';

const BG_COLOR = "#000000";
const GRID_STYLE = {
  backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
  backgroundSize: '100px 100px'
};

function ChatLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get('s');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState('llama-3.3-70b-versatile');
  const [inputStyle, setInputStyle] = useState('kinetic');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);

  // Close model selector on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModelSelector(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getModelBadge = (id: string) => {
    const icons: Record<string, React.ReactNode> = {
      'llama-3.3-70b-versatile': <Cpu size={11} className="text-blue-400" />,
      'llama-3.1-8b-instant': <Zap size={11} className="text-yellow-400" />,
      'mixtral-8x7b-32768': <Sparkles size={11} className="text-purple-400" />,
      'gemma2-9b-it': <Layers size={11} className="text-emerald-400" />,
      'meta-llama/llama-4-scout-17b-16e-instruct': <Eye size={11} className="text-rose-400" />,
    };
    const m = AVAILABLE_MODELS.find(x => x.id === id);
    return { label: m?.badge ?? 'Engine', icon: icons[id] ?? <Cpu size={11} /> };
  };

  const badge = getModelBadge(currentModel);



  return (
    <div className="flex h-dvh overflow-hidden relative" style={{ backgroundColor: BG_COLOR }}>
      {/* Global Background Grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={GRID_STYLE}></div>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
        activeSessionId={activeSessionId}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Floating Header — Home Link (top-right) + Model Selector (top-left) */}
        <div className="absolute top-4 right-6 z-50">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#111]/80 backdrop-blur-md border border-[#222] rounded-full text-[11px] font-bold uppercase tracking-widest text-[#888] hover:text-white hover:border-[#333] transition-all"
          >
            <Sparkles size={12} />
            <span className="hidden sm:inline">Mars AI</span>
          </Link>
        </div>

        {/* Model Selector — top-left floating, spaced to avoid sidebar toggle */}
        <div ref={modelRef} className={`absolute top-4 ${sidebarOpen ? 'left-4' : 'left-[72px]'} z-50 transition-all duration-300`}>
          <button
            onClick={() => setShowModelSelector(!showModelSelector)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all backdrop-blur-md ${
              showModelSelector
                ? 'bg-white text-black border-white'
                : 'bg-[#111]/80 text-[#888] border-[#222] hover:text-white hover:border-[#333]'
            }`}
          >
            {badge.icon}
            <span className="hidden sm:inline whitespace-nowrap">{badge.label}</span>
            <ChevronDown size={10} className={`transition-transform duration-200 ${showModelSelector ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showModelSelector && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-2 w-[260px] sm:w-[300px] bg-[#0D0D0D] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-[100]"
              >
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Select Engine</span>
                  <span className="text-[8px] font-mono text-white/15">Independent limits</span>
                </div>
                <div className="p-1.5 max-h-[320px] overflow-y-auto">
                  {AVAILABLE_MODELS.map((model) => {
                    const b = getModelBadge(model.id);
                    const isActive = currentModel === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => { setCurrentModel(model.id); setShowModelSelector(false); }}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                          isActive ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className={`mt-0.5 p-1.5 rounded-lg border shrink-0 ${
                          isActive ? 'bg-white text-black border-white' : 'bg-black border-white/10'
                        }`}>
                          {b.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[11px] font-black uppercase tracking-tight ${
                              isActive ? 'text-white' : 'text-white/50'
                            }`}>{model.badge}</span>
                            {isActive && <Check size={11} className="text-white shrink-0" strokeWidth={3} />}
                          </div>
                          <div className="text-[9px] text-white/25 font-bold mt-0.5 leading-snug pr-2">{model.description}</div>
                          <div className="text-[8px] font-mono text-white/15 mt-0.5">
                            {(model.dailyTokenLimit / 1000).toFixed(0)}K tokens/day
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.02]">
                  <p className="text-[8px] font-mono text-white/20 leading-relaxed">
                    ⚠️ Image generation unavailable. Llama 4 Scout can <em>analyze</em> uploaded images.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {typeof children === 'object' && React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            currentModel,
            onModelChange: setCurrentModel,
            inputStyle,
            sidebarOpen,
            onOpenSettings: () => setSettingsOpen(true),
          })
          : children}
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentModel={currentModel}
        onModelChange={setCurrentModel}
        inputStyle={inputStyle}
        onInputStyleChange={setInputStyle}
      />
    </div>
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex h-dvh items-center justify-center bg-[#050505]">
        <div className="w-6 h-6 border-2 border-[#333] border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ChatLayoutInner>{children}</ChatLayoutInner>
    </Suspense>
  );
}
