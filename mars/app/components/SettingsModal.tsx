'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Check, AlertTriangle, Sparkles, Layers, Zap, Database, Loader2, Archive, RotateCcw } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'core' | 'interface' | 'data' | 'tokens' | 'memory'>('core');
  const [tokens, setTokens] = useState<{ balance: number; total_used: number; nextReset: number; totalUsers: number; sharePerUser: number } | null>(null);
  const [deletedSessions, setDeletedSessions] = useState<any[]>([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  React.useEffect(() => {
    if (!tokens?.nextReset) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = tokens.nextReset - now;

      if (distance < 0) {
        setTimeLeft('RESETING...');
        fetchTokens();
        return;
      }

      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [tokens?.nextReset]);

  React.useEffect(() => {
    if (isOpen && activeTab === 'tokens') {
      fetchTokens();
    }
    if (isOpen && activeTab === 'memory') {
      fetchTrash();
    }
  }, [isOpen, activeTab]);

  const fetchTrash = async () => {
    setLoadingTrash(true);
    try {
      const res = await fetch('/api/sessions?trash=true');
      if (res.ok) setDeletedSessions(await res.json());
    } catch (err) {
      console.error('Failed to fetch trash:', err);
    } finally {
      setLoadingTrash(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: false })
      });
      if (res.ok) {
        setDeletedSessions(prev => prev.filter(s => s._id !== id));
        window.dispatchEvent(new CustomEvent('mars:refresh-sessions'));
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}?permanent=true`, { method: 'DELETE' });
      if (res.ok) {
        setDeletedSessions(prev => prev.filter(s => s._id !== id));
      }
    } catch (err) {
      console.error('Failed to purge session:', err);
    }
  };

  const fetchTokens = async () => {
    setLoadingTokens(true);
    try {
      const res = await fetch('/api/user/tokens');
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
    } finally {
      setLoadingTokens(false);
    }
  };

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
            className="relative z-10 w-full max-w-4xl h-auto md:h-[600px] max-h-[90vh] bg-[#0D0D0D] border border-[#1E1E1E] rounded-3xl overflow-hidden shadow-[0_0_100px_-20px_rgba(0,0,0,1)] flex flex-col md:flex-row"
          >
            {/* Sidebar Navigation */}
            <div className="w-full md:w-[240px] bg-[#0A0A0A] border-r border-[#1A1A1A] flex flex-col">
              <div className="p-6">
                  <div className="flex items-center gap-2.5 mb-6 md:mb-8">
                    <div className="w-8 h-8 bg-white flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                      <Sparkles size={16} className="text-black" />
                    </div>
                    <span className="text-sm font-black tracking-widest uppercase italic">Mars AI</span>
                  </div>

                <nav className="flex flex-row md:flex-col gap-1">
                  {[
                    { id: 'core', label: 'Core System', icon: <Zap size={16} /> },
                    { id: 'interface', label: 'Interface', icon: <Layers size={16} /> },
                    { id: 'tokens', label: 'Intelligence', icon: <Database size={16} /> },
                    { id: 'memory', label: 'Memory', icon: <Archive size={16} /> },
                    { id: 'data', label: 'Persistence', icon: <Trash2 size={16} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                        className={`
                          flex-1 md:w-full flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all
                          ${activeTab === tab.id
                            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                            : 'text-[#555] hover:text-[#888] hover:bg-white/5'
                          }
                        `}
                      >
                        {tab.icon}
                        <span className="hidden xs:inline md:inline">{tab.label}</span>
                      </button>
                  ))}
                </nav>
              </div>

              <div className="mt-auto p-6 border-t border-[#1A1A1A] hidden md:block">
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
                    {activeTab === 'tokens' && 'Intelligence Hub'}
                    {activeTab === 'memory' && 'Memory Vault'}
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

                     {activeTab === 'tokens' && (
                      <div className="space-y-8">
                        <div className="p-8 rounded-[2rem] border border-[#1A1A1A] bg-[#0A0A0A] relative overflow-hidden group">
                          {/* Background Glow */}
                          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/[0.02] blur-[100px] rounded-full" />
                          
                          <div className="relative flex flex-col md:flex-row items-center gap-12">
                            {/* Left: Circular Load */}
                            <div className="relative shrink-0">
                              <svg className="w-40 h-40 transform -rotate-90">
                                <circle
                                  cx="80"
                                  cy="80"
                                  r="74"
                                  stroke="currentColor"
                                  strokeWidth="6"
                                  fill="transparent"
                                  className="text-white/[0.03]"
                                />
                                <motion.circle
                                  cx="80"
                                  cy="80"
                                  r="74"
                                  stroke="currentColor"
                                  strokeWidth="6"
                                  fill="transparent"
                                  strokeDasharray={465}
                                  initial={{ strokeDashoffset: 465 }}
                                  animate={{ strokeDashoffset: 465 - (465 * (tokens ? (tokens.balance / (tokens.sharePerUser || 100000)) : 1)) }}
                                  transition={{ duration: 1.5, ease: "easeOut" }}
                                  className="text-white"
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black tracking-tighter">
                                  {tokens ? Math.round((tokens.balance / (tokens.sharePerUser || 100000)) * 100) : 100}%
                                </span>
                                <span className="text-[10px] text-[#444] font-bold uppercase tracking-[0.2em] mt-1">Neural Load</span>
                              </div>
                            </div>

                            {/* Right: Credit Intelligence */}
                            <div className="flex-1 w-full space-y-6">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444] mb-2">Available Credits</h4>
                                  <div className="flex items-baseline gap-3">
                                    <span className="text-5xl font-black tracking-tighter tabular-nums">
                                      {loadingTokens ? '---' : tokens?.balance.toLocaleString() ?? '100,000'}
                                    </span>
                                    <span className="text-xs font-bold text-[#333] uppercase tracking-[0.2em]">Tokens</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 min-w-[120px]">
                                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/80 mb-2">Neural Reset</div>
                                  <div className="text-3xl font-black font-mono tracking-tight tabular-nums text-white/90">
                                    {timeLeft || '00:00:00'}
                                  </div>
                                </div>
                              </div>

                              <div className="h-[1px] w-full bg-white/[0.03]" />

                              <div className="grid grid-cols-2 gap-8">
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#333] mb-1">Total Consumed</div>
                                  <div className="text-xl font-black font-mono tabular-nums">
                                    {tokens?.total_used.toLocaleString() ?? '0'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#333] mb-1">Daily Cap</div>
                                  <div className="text-xl font-black font-mono tabular-nums">
                                    {(tokens?.sharePerUser || 1000000).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                           <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#222]">Network Diagnostics</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-6 rounded-[1.5rem] border border-[#1A1A1A] bg-[#080808] hover:border-white/5 transition-colors">
                                 <div className="text-[9px] font-black uppercase tracking-widest text-[#444] mb-2">Global Node Count</div>
                                 <div className="text-lg font-black tracking-tight text-white/90">{tokens?.totalUsers ?? '1'} Active Users</div>
                              </div>
                              <div className="p-6 rounded-[1.5rem] border border-[#1A1A1A] bg-[#080808] hover:border-white/5 transition-colors">
                                 <div className="text-[9px] font-black uppercase tracking-widest text-[#444] mb-2">Distribution Model</div>
                                 <div className="text-lg font-black tracking-tight text-white/90">Equal Share</div>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'memory' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 mb-6">
                           <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                           <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">
                              Warning: Archived missions are retained until purged manually.
                           </p>
                        </div>

                        {loadingTrash ? (
                           <div className="flex items-center justify-center py-12">
                              <Loader2 size={24} className="animate-spin text-[#333]" />
                           </div>
                        ) : deletedSessions.length === 0 ? (
                           <div className="flex flex-col items-center justify-center py-20 opacity-20">
                              <Archive size={40} strokeWidth={1} className="mb-4" />
                              <div className="text-[10px] font-black uppercase tracking-widest">Memory Vault is Empty</div>
                           </div>
                        ) : (
                          <div className="space-y-2">
                             {deletedSessions.map((session) => (
                                <div key={session._id} className="group flex items-center justify-between p-4 rounded-2xl border border-[#1A1A1A] bg-[#090909] hover:border-[#333] transition-all">
                                   <div className="min-w-0">
                                      <div className="text-sm font-bold text-white/80 truncate">{session.title}</div>
                                      <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest mt-0.5">
                                         Deleted {new Date(session.updatedAt).toLocaleDateString()}
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                      <button
                                         onClick={() => handleRestore(session._id)}
                                         className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center gap-2"
                                         title="Restore Mission"
                                      >
                                         <RotateCcw size={14} />
                                         <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Restore</span>
                                      </button>
                                      <button
                                         onClick={() => handlePermanentDelete(session._id)}
                                         className="p-2 rounded-xl hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-all flex items-center gap-2"
                                         title="Purge Forever"
                                      >
                                         <Trash2 size={14} />
                                         <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Purge</span>
                                      </button>
                                   </div>
                                </div>
                             ))}
                          </div>
                        )}
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
