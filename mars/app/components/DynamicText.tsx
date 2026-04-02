'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import phrases from '../data/dynamic-phrases.json';

type Phrase = {
  text: string;
  color: string;
  weight: 'black' | 'light';
};

interface DynamicTextProps {
  className?: string;
  interval?: number; // ms between transitions
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_MAP = {
  sm: 'text-sm md:text-base',
  md: 'text-2xl md:text-3xl',
  lg: 'text-4xl md:text-6xl',
  xl: 'text-[clamp(2.5rem,8vw,6rem)]',
};

export default function DynamicText({
  className = '',
  interval = 2400,
  size = 'xl',
}: DynamicTextProps) {
  const [index, setIndex] = useState(0);
  const all: Phrase[] = phrases.phrases as Phrase[];

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % all.length);
    }, interval);
    return () => clearInterval(id);
  }, [interval, all.length]);

  const current = all[index];

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${SIZE_MAP[size]} ${className}`}
      style={{ minHeight: '1.2em' }}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 40, opacity: 0, filter: 'blur(8px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -40, opacity: 0, filter: 'blur(8px)' }}
          transition={{
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            color: current.color,
            fontWeight: current.weight === 'black' ? 900 : 300,
            fontStyle: current.weight === 'light' ? 'italic' : 'normal',
            letterSpacing: current.weight === 'black' ? '-0.03em' : '0.01em',
            display: 'block',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {current.text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
