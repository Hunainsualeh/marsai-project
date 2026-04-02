'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const Preloader = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (containerRef.current && textRef.current && barRef.current) {
      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(() => setComplete(true), 500);
        }
      });

      // Split text-like reveal
      tl.fromTo(textRef.current,
        { opacity: 0, letterSpacing: '1em', filter: 'blur(10px)' },
        { opacity: 1, letterSpacing: '0.2em', filter: 'blur(0px)', duration: 1.5, ease: 'expo.out' }
      );

      // Bar progress
      tl.fromTo(barRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.2, ease: 'power4.inOut' },
        "-=1.0"
      );

      // Exit reveal
      tl.to(containerRef.current, {
        yPercent: -100,
        duration: 1,
        ease: 'power4.inOut',
        delay: 0.2
      });

      tl.to(containerRef.current, {
        display: 'none',
        duration: 0
      });
    }
  }, []);

  if (complete) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Pulse */}
      <div className="absolute inset-0 bg-white/5 opacity-10 blur-3xl animate-pulse" />

      <div className="relative z-10 flex flex-col items-center">
        <h1
          ref={textRef}
          className="text-6xl md:text-8xl font-black text-white tracking-[0.2em] mb-8 select-none"
        >
          MARS
        </h1>

        <div className="w-64 h-[2px] bg-white/10 relative overflow-hidden">
          <div
            ref={barRef}
            className="absolute inset-0 bg-white origin-left"
          />
        </div>

        <div className="mt-6 text-[10px] font-mono text-white/30 uppercase tracking-[0.5em] animate-pulse">
          Initializing Engine...
        </div>
      </div>

      {/* Scanning Line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="w-full h-[50dvh] bg-gradient-to-b from-transparent via-white/20 to-transparent absolute top-[-50dvh] animate-[scan_3s_linear_infinite]" />
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(200dvh); }
        }
      `}</style>
    </div>
  );
};

export default Preloader;
