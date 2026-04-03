import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';

export default function WelcomeModal() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (!sessionStorage.getItem('mars_welcome_shown')) {
        setIsOpen(true);
      }
    }
  }, [loading, user]);

  const handleDismiss = () => {
    sessionStorage.setItem('mars_welcome_shown', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleDismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[95%] sm:w-full max-w-lg bg-black border-2 border-yellow-400 p-6 sm:p-8 rounded-none shadow-[10px_10px_0px_0px_rgba(254,240,138,1)] max-h-[90vh] overflow-y-auto"
          >
            <div className="absolute top-3 right-3">
              <button
                onClick={handleDismiss}
                className="p-1 text-yellow-400/50 hover:text-yellow-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-start text-left gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">
                <CheckCircle2 size={12} />
                Access Granted
              </div>

              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-[0.85] text-white">
                WELCOME <br />
                <span className="text-yellow-400">TO MARS AI</span>
              </h2>

              <p className="text-white/70 text-sm leading-relaxed mt-2 border-l-2 border-yellow-400 pl-4 py-1">
                <b className="text-white">Mars AI</b> is built as a space for open conversation and fearless thinking. It encourages people to explore ideas, question perspectives, and express their thoughts without unnecessary limits.
              </p>

              <p className="text-white/70 text-sm leading-relaxed border-l-2 border-yellow-400 pl-4 py-1">
                The goal is simple: create an environment where curiosity thrives, dialogue stays open, and every voice has the freedom to share ideas and engage in meaningful discussion.
              </p>

              <div className="w-full mt-4">
                <button
                  onClick={handleDismiss}
                  className="group w-full py-4 bg-white hover:bg-gray-100 text-black text-sm font-black italic uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex justify-center items-center gap-2 border border-white"
                >
                  Enter Chat
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
