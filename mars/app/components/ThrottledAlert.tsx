'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, RotateCcw, Zap, Target, Layers, Cpu } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/lib/models';

interface ThrottledAlertProps {
  retryAfter: number;
  onClose: () => void;
  onSwitchModel: (modelId: string) => void;
  currentModel: string;
}

export default function ThrottledAlert({
  retryAfter,
  onClose,
  onSwitchModel,
  currentModel,
}: ThrottledAlertProps) {
  const [timeLeft, setTimeLeft] = useState(retryAfter);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModelIcon = (id: string) => {
    if (id.includes('llama-3.3')) return <Target size={12} />;
    if (id.includes('8b-instant')) return <Zap size={12} />;
    if (id.includes('mixtral')) return <Layers size={12} />;
    return <Cpu size={12} />;
  };

  const currentLabel = AVAILABLE_MODELS.find(m => m.id === currentModel)?.name || 'Logic Core';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="w-full max-w-2xl mx-auto mb-6 relative group"
      >
        <div className="absolute inset-0 bg-amber-500/5 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative bg-[#0A0A0A] border border-amber-500/20 p-5 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <AlertCircle size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-widest text-white/90">
                  Throttled. Recovery in <span className="text-amber-500 font-mono italic">{formatTime(timeLeft)}</span>
                </span>
                <span className="text-[10px] font-bold text-[#444] uppercase tracking-wider">
                  Org limit reached for <span className="text-white/40">{currentModel.split('-')[1]?.toUpperCase() || 'CORE'}</span>
                </span>
              </div>
            </div>
            <button
               onClick={onClose}
               className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all"
            >
               <X size={14} />
            </button>
          </div>

          {/* Model Switcher */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#333]">Switch & Retry:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(AVAILABLE_MODELS as unknown as any[]).filter(m => m.id !== currentModel).map((model) => (
                <button
                  key={model.id}
                  onClick={() => onSwitchModel(model.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all active:scale-[0.98]"
                >
                  {getModelIcon(model.id)}
                  {model.shortName || model.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -z-10 rounded-full translate-x-12 -translate-y-12" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
