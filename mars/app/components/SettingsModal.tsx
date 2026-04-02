'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Check, AlertTriangle, Sparkles, Layers, Zap, Database, Loader2 } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/lib/models';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: string;
  onModelChange: (modelId: string) => void;
  inputStyle: string;
  onInputStyleChange: (style: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  currentModel,
  onModelChange,
  inputStyle,
  onInputStyleChange,
}: SettingsModalProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [activeTab, setActiveTab] = useState<'core' | 'interface' | 'data'>('core');

  const handleClearHistory = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }

    setClearing(true);
    try {
      // Fetch all sessions and delete them
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const sessions = await res.json();
        await Promise.all(
          sessions.map((s: { _id: string }) =>
            fetch(`/api/sessions/${s._id}`, { method: 'DELETE' })
          )
        );
      }
      setConfirmClear(false);
      onClose();
      window.location.href = '/chat';
    } catch (err) {
      console.error('Failed to clear history:', err);
    } finally {
      setClearing(false);
    }
  };

  // Close on Escape
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10 w-full max-w-4xl h-[600px] bg-[#0D0D0D] border border-[#1E1E1E] rounded-3xl overflow-hidden shadow-[0_0_100px_-20px_rgba(0,0,0,1)] flex flex-col md:flex-row"
          >
            {/* Sidebar Navigation */}
            <div className="w-full md:w-[240px] bg-[#0A0A0A] border-r border-[#1A1A1A] flex flex-col">
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-8">
                  <div className="w-8 h-8 bg-white flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <Sparkles size={16} className="text-black" />
                  </div>
                  <span className="text-sm font-black tracking-widest uppercase italic">Mars AI</span>
                </div>

                <nav className="space-y-1">
                  {[
                    { id: 'core', label: 'Core System', icon: <Zap size={16} /> },
                    { id: 'interface', label: 'Interface', icon: <Layers size={16} /> },
                    { id: 'data', label: 'Persistence', icon: <Database size={16} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                        ${activeTab === tab.id
                          ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                          : 'text-[#555] hover:text-[#888] hover:bg-white/5'
                        }
                      `}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="mt-auto p-6 border-t border-[#1A1A1A]">
                <div className="text-[10px] text-[#222] font-mono leading-relaxed">
                  MOD_VER: 2.4.1 <br />
                  AUTH: HUNAIN
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0D0D0D]">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-[#1A1A1A]">
                <div>
                   <h2 className="text-xl font-black uppercase tracking-tighter">
                    {activeTab === 'core' && 'Core Engine'}
                    {activeTab === 'interface' && 'User Interface'}
                    {activeTab === 'data' && 'Persistence Layer'}
                  </h2>
                  <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest mt-1">System Configuration</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/5 text-[#444] hover:text-white transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'core' && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[#333] mb-4">Select Processing Unit</h3>
                          <div className="grid grid-cols-1 gap-2">
                            {AVAILABLE_MODELS.map((model) => (
                              <button
                                key={model.id}
                                onClick={() => onModelChange(model.id)}
                                className={`
                                  w-full flex items-center justify-between px-6 py-5 rounded-2xl
                                  border transition-all duration-300 group relative overflow-hidden
                                  ${currentModel === model.id
                                    ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                    : 'bg-transparent border-[#1A1A1A] text-[#888] hover:border-[#333] hover:text-white'
                                  }
                                `}
                              >
                                <div className="relative z-10">
                                  <div className="text-sm font-black uppercase tracking-tight">{model.name}</div>
                                  <div className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${currentModel === model.id ? 'opacity-60' : 'opacity-30'}`}>{model.description}</div>
                                </div>
                                {currentModel === model.id && (
                                  <Check size={16} className="text-black shrink-0 relative z-10" strokeWidth={4} />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'interface' && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                           <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[#333] mb-4">Communication Interface</h3>
                           <div className="grid grid-cols-1 gap-2">
                            {[
                              { id: 'kinetic', name: 'Kinetic Focus', description: 'Dynamic movement with minimal borders. Default Mars UX.' },
                              { id: 'classic', name: 'Classic Terminal', description: 'Standard multi-line expanding input for heavy data entry.' }
                            ].map((style) => (
                              <button
                                key={style.id}
                                onClick={() => onInputStyleChange(style.id)}
                                className={`
                                  w-full flex items-center justify-between px-6 py-5 rounded-2xl
                                  border transition-all duration-300 group
                                  ${inputStyle === style.id
                                    ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                    : 'bg-transparent border-[#1A1A1A] text-[#888] hover:border-[#333] hover:text-white'
                                  }
                                `}
                              >
                                <div>
                                  <div className="text-sm font-black uppercase tracking-tight">{style.name}</div>
                                  <div className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${inputStyle === style.id ? 'opacity-60' : 'opacity-30'}`}>{style.description}</div>
                                </div>
                                {inputStyle === style.id && (
                                  <Check size={16} className="text-black shrink-0" strokeWidth={4} />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'data' && (
                      <div className="space-y-6">
                         <div className="p-8 border-2 border-dashed border-red-500/20 rounded-3xl bg-red-500/[0.02]">
                            <div className="flex items-start gap-5">
                               <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-red-500/20">
                                  <AlertTriangle size={24} className="text-red-500" />
                               </div>
                               <div>
                                  <h3 className="text-lg font-black uppercase tracking-tight text-red-500">Purge History</h3>
                                  <p className="text-xs text-[#555] font-bold uppercase tracking-widest mt-2 leading-relaxed">
                                    Deleting mission logs is permanent. <br /> All sessions and data will be erased from the core.
                                  </p>
                                  
                                  <button
                                    onClick={handleClearHistory}
                                    disabled={clearing}
                                    className={`
                                      mt-8 flex items-center gap-3 px-8 py-3.5 rounded-full border font-black uppercase tracking-[0.2em] text-xs
                                      transition-all duration-300
                                      ${confirmClear
                                        ? 'bg-red-500 text-white border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]'
                                        : 'bg-transparent border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500'
                                      }
                                    `}
                                  >
                                    {clearing ? 'Purging...' : confirmClear ? 'Confirm Purge' : 'Initialize Purge'}
                                    {clearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                  </button>
                               </div>
                            </div>
                         </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
