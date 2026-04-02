'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Cpu, Sparkles, Eye, Layers, AlertTriangle, ArrowRight } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/lib/models';
import { TokenTracker } from './TokenTracker';

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: string;
  onSwitchModel: (modelId: string) => void;
}

function getModelIcon(id: string) {
  if (id.includes('llama-3.3')) return <Cpu size={14} className="text-blue-400" />;
  if (id.includes('8b-instant')) return <Zap size={14} className="text-yellow-400" />;
  if (id.includes('mixtral')) return <Sparkles size={14} className="text-purple-400" />;
  if (id.includes('gemma')) return <Layers size={14} className="text-emerald-400" />;
  if (id.includes('scout') || id.includes('vision')) return <Eye size={14} className="text-rose-400" />;
  return <Cpu size={14} />;
}

function TokenBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  const isCritical = pct >= 85;
  const isWarning = pct >= 60;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          style={{ backgroundColor: isCritical ? '#EF4444' : isWarning ? '#F59E0B' : color }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">
          {pct}% used
        </span>
        <span className="text-[9px] font-mono text-white/40">
          {(total - used).toLocaleString()} remaining
        </span>
      </div>
    </div>
  );
}

export default function UsageModal({ isOpen, onClose, currentModel, onSwitchModel }: UsageModalProps) {
  const [usageData, setUsageData] = useState<Record<string, { tokens: number; messages: number }>>({});

  useEffect(() => {
    if (!isOpen) return;
    // Load usage for all models
    const data: Record<string, { tokens: number; messages: number }> = {};
    AVAILABLE_MODELS.forEach((m) => {
      const u = TokenTracker.getUsage(m.id);
      data[m.id] = { tokens: u.tokens, messages: u.messages };
    });
    setUsageData(data);
  }, [isOpen]);

  const currentModelInfo = AVAILABLE_MODELS.find(m => m.id === currentModel);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Mission Status</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Active model summary */}
            {currentModelInfo && (
              <div className="px-5 py-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    {getModelIcon(currentModel)}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{currentModelInfo.badge}</div>
                    <div className="text-[10px] text-white/30 font-mono">{currentModelInfo.name}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xl font-black text-white">
                      {(currentModelInfo.dailyTokenLimit - (usageData[currentModel]?.tokens ?? 0)).toLocaleString()}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/25">tokens left today</div>
                  </div>
                </div>
                <TokenBar
                  used={usageData[currentModel]?.tokens ?? 0}
                  total={currentModelInfo.dailyTokenLimit}
                  color={currentModelInfo.color}
                />
                {(usageData[currentModel]?.messages ?? 0) > 0 && (
                  <div className="mt-2 text-[9px] font-mono text-white/20">
                    {usageData[currentModel]?.messages} messages • {(usageData[currentModel]?.tokens ?? 0).toLocaleString()} tokens used today
                  </div>
                )}
              </div>
            )}

            {/* All models overview */}
            <div className="px-5 py-3">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-3">All Processors</div>
              <div className="space-y-2.5">
                {AVAILABLE_MODELS.map((m) => {
                  const used = usageData[m.id]?.tokens ?? 0;
                  const pct = Math.min(100, Math.round((used / m.dailyTokenLimit) * 100));
                  const isCurrent = m.id === currentModel;
                  const isCritical = pct >= 85;

                  return (
                    <div key={m.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${isCurrent ? 'bg-white/5 border border-white/8' : 'hover:bg-white/[0.02]'}`}>
                      <div className="p-1.5 rounded-lg bg-black border border-white/8 shrink-0">
                        {getModelIcon(m.id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-[11px] font-bold ${isCurrent ? 'text-white' : 'text-white/50'}`}>{m.badge}</span>
                          {isCritical && <AlertTriangle size={10} className="text-red-400 shrink-0" />}
                          <span className="text-[9px] font-mono text-white/25 ml-auto">{(m.dailyTokenLimit - used).toLocaleString()}</span>
                        </div>
                        <div className="w-full h-0.5 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: isCritical ? '#EF4444' : m.color,
                            }}
                          />
                        </div>
                      </div>
                      {!isCurrent && (
                        <button
                          onClick={() => { onSwitchModel(m.id); onClose(); }}
                          className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/8 transition-all shrink-0"
                        >
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer note */}
            <div className="px-5 py-3 border-t border-white/[0.04]">
              <p className="text-[9px] text-white/15 font-mono leading-relaxed">
                Token counts are estimated and reset daily at midnight UTC. Switch models freely — limits are independent.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
