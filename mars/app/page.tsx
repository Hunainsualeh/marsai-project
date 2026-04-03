"use client";

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  ChevronRight,
  Cpu,
  ArrowRight,
  Layers,
  Zap,
  Code,
  BookOpen,
  Lightbulb,
  Search,
  Sparkles,
  Radio,
} from 'lucide-react';
import { gsap } from 'gsap';
import PillNav from './components/navbar';
import DynamicText from './components/DynamicText';

const BG_COLOR = "#000000";
const GRID_STYLE = {
  backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
  backgroundSize: '100px 100px'
};

const navItems = [
  { label: 'Home', href: '#hero' },
  { label: 'Moto', href: '#Moto' },
  { label: 'Core', href: '#sensory-architecture' },
  { label: 'Chat', href: '/chat' }
];

const QUICK_PROMPTS = [
  { icon: <Code size={20} />, label: 'Summarize code', desc: 'Break down complex logic instantly', prompt: 'Help me summarize and explain a piece of code' },
  { icon: <BookOpen size={20} />, label: 'Write a story', desc: 'Creative fiction on demand', prompt: 'Write me a short creative story' },
  { icon: <Search size={20} />, label: 'Explain concepts', desc: 'Complex ideas made simple', prompt: 'Explain a complex concept in simple terms' },
  { icon: <Lightbulb size={20} />, label: 'Brainstorm', desc: 'Unlock creative thinking', prompt: 'Help me brainstorm creative ideas' },
];

const App = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [creating, setCreating] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const [cursorVisible, setCursorVisible] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth cursor follower
  useEffect(() => {
    const target = { x: -200, y: -200 };
    const current = { x: -200, y: -200 };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      setCursorVisible(true);
    };
    const onLeave = () => setCursorVisible(false);

    const tick = () => {
      // Lerp toward target
      current.x += (target.x - current.x) * 0.12;
      current.y += (target.y - current.y) * 0.12;
      rotationRef.current += 0.6; // degrees per frame

      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate(${current.x - 44}px, ${current.y - 44}px) rotate(${rotationRef.current}deg)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // GSAP entrance animations
  useEffect(() => {
    // Clean fade-up entrance — no delay since preloader is gone
    const heroAnims = document.querySelectorAll('.hero-anim');
    if (heroAnims.length > 0) {
      gsap.fromTo(
        heroAnims,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.15 }
      );
    }

    if (heroRef.current) {
      // Premium magnetic hover on headline — scale + subtle glow, no skew
      const titleLines = Array.from(heroRef.current.querySelectorAll('h1 span'));
      titleLines.forEach(line => {
        const el = line as HTMLElement;
        el.addEventListener('mouseenter', () => {
          gsap.to(el, { scale: 1.03, duration: 0.5, ease: 'power2.out' });
        });
        el.addEventListener('mousemove', (e: Event) => {
          const me = e as MouseEvent;
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (me.clientX - cx) / rect.width;
          const dy = (me.clientY - cy) / rect.height;
          gsap.to(el, {
            x: dx * 12,
            y: dy * 6,
            duration: 0.4,
            ease: 'power2.out',
            overwrite: true,
          });
        });
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { scale: 1, x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
        });
      });
    }

    if (cardsRef.current) {
      gsap.fromTo(
        cardsRef.current.querySelectorAll('.prompt-card'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.09, delay: 0.4, ease: 'power3.out' }
      );
    }
  }, []);

  const handleQuickPrompt = async (prompt: string) => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat?s=${data._id}&prompt=${encodeURIComponent(prompt)}`);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-[100dvh] text-white font-sans selection:bg-white selection:text-black overflow-x-hidden" style={{ backgroundColor: BG_COLOR }}>

      {/* ── Circular Cursor Ring ── */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-[88px] h-[88px] pointer-events-none z-[9999] will-change-transform"
        style={{ opacity: cursorVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 88 88" width="88" height="88">
          <defs>
            <path id="circle-path" d="M 44,44 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" />
          </defs>
          {/* Glowing ring */}
          <circle cx="44" cy="44" r="34" fill="none" stroke="rgba(251,146,60,0.25)" strokeWidth="1" />
          <circle cx="44" cy="44" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          {/* Dot */}
          <circle cx="44" cy="44" r="2.5" fill="rgba(251,146,60,0.9)" />
          {/* Circular text */}
          <text
            fontSize="7.5"
            fontFamily="monospace"
            fontWeight="700"
            letterSpacing="3.5"
            fill="rgba(255,255,255,0.55)"
            textAnchor="start"
          >
            <textPath href="#circle-path">
              MARS·AI · UNRESTRICTED · MISSION ·&nbsp;
            </textPath>
          </text>
        </svg>
      </div>

      {/* ── Navigation ── */}
      <div className="fixed w-full z-50 flex justify-center pt-4">
        <PillNav
          logo="/mars-logo.svg"
          logoAlt="Mars AI"
          items={navItems}

          initialLoadAnimation={false}
          className="hero-anim"
        />
      </div>

      {/* ── Hero Section ── */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505] text-white px-6">

        {/* Ambient glow */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-orange-500/10 blur-[130px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-blue-600/8 blur-[130px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_75%)]" />
        </div>

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={GRID_STYLE} />

        {/* Content */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.18, delayChildren: 0.2 } }
          }}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-5xl w-full text-center"
        >
          {/* Status badge */}
          <motion.div
            variants={{ hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
            className="flex justify-center mb-8 hero-anim"
          >
            <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md text-[11px] font-bold tracking-[0.25em] uppercase text-orange-400">
              System Status: Unrestricted
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={{ hidden: { y: 24, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } } }}
            className="mb-8 flex flex-col items-center gap-1 hero-anim select-none"
          >
            <span className="text-3xl md:text-5xl font-light tracking-tight text-white/50 italic" style={{ fontFamily: 'Georgia, serif' }}>
              Introducing
            </span>
            <span className="text-[clamp(5rem,14vw,10rem)] font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/30">
              MARS<span className="text-orange-500">.</span>AI
            </span>
          </motion.h1>

          {/* Dynamic rotating phrases */}
          <motion.div
            variants={{ hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
            className="mb-6 hero-anim"
          >
            <DynamicText size="xl" interval={2600} />
          </motion.div>

          {/* Subtext */}
          <motion.div
            variants={{ hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
            className="max-w-xl mx-auto mb-14 hero-anim"
          >
            <p className="text-base md:text-lg text-zinc-500 leading-relaxed font-light">
              Cognition without borders. A sovereign intelligence layer designed for{' '}
              <span className="text-white italic">radical honesty</span>{' '}and the pursuit of unfiltered human inquiry.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={{ hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 hero-anim"
          >

          </motion.div>
        </motion.div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[3px] h-[3px] bg-white/15 rounded-full"
              style={{
                top: `${(i * 37 + 13) % 100}%`,
                left: `${(i * 53 + 7) % 100}%`,
                animation: `floatParticle ${12 + (i % 8) * 2}s ${(i % 5) * 1.2}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>

        {/* Gradient blend to next section */}
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
      </section>

      {/* particle keyframe */}
      <style>{`
        @keyframes floatParticle {
          0% { transform: translate(0, 0) scale(1); opacity: 0.15; }
          50% { opacity: 0.4; }
          100% { transform: translate(${12}px, ${-18}px) scale(1.4); opacity: 0.1; }
        }
      `}</style>

      {/* Quick Prompt Section */}
      <section id="Moto" className="py-32 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-full text-[10px] font-bold uppercase tracking-[0.3em] text-[#555] mb-6">
              <Sparkles size={12} />
              Quick Access
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Jump Right In</h2>
            <p className="text-[#555] text-lg max-w-md mx-auto">
              <b>Mars AI</b> is built as a space for open conversation and fearless thinking. It encourages people to explore ideas, question perspectives, and express their thoughts without unnecessary limits. The goal is simple: create an environment where curiosity thrives, dialogue stays open, and every voice has the freedom to share ideas and engage in meaningful discussion.

            </p>
          </div>

          <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item.label}
                onClick={() => handleQuickPrompt(item.prompt)}
                disabled={creating}
                className="prompt-card group relative flex items-start gap-5 p-8 bg-[#0A0A0A] border border-[#1A1A1A]
                           rounded-2xl text-left hover:border-[#333] hover:bg-[#0D0D0D]
                           transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_8px_40px_-12px_rgba(255,255,255,0.06)]"
              >
                <div className="w-12 h-12 bg-[#111] border border-[#1E1E1E] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#1A1A1A] group-hover:border-[#333] transition-all duration-300">
                  <div className="text-[#555] group-hover:text-white transition-colors duration-300">
                    {item.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#ccc] group-hover:text-white transition-colors mb-1">
                    {item.label}
                  </h3>
                  <p className="text-sm text-[#444] group-hover:text-[#666] transition-colors">
                    {item.desc}
                  </p>
                </div>
                <ArrowRight size={18} className="absolute top-8 right-8 text-[#222] group-hover:text-[#555] transition-all duration-300 group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sensory Architecture */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
        .hero-anim { opacity: 0; }
      `}</style>
      <section id="sensory-architecture" className="py-0 px-0">
        <div className="grid grid-cols-1 md:grid-cols-3 border-b-2 border-white/10">

          {/* Card 1: MARS CORE (Instinct) */}
          <div className="relative group h-[500px] border-r-2 border-white/10 overflow-hidden cursor-crosshair">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-700" />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 border border-white/20 rounded-full animate-ping opacity-20 group-hover:opacity-100 group-hover:scale-150 transition-all duration-1000" />
              <div className="absolute w-16 h-16 border-2 border-white/40 rounded-full group-hover:border-white transition-colors" />
            </div>

            <div className="absolute bottom-12 left-12 right-12 z-10">
              <div className="mb-6 flex gap-2">
                <div className="h-1 w-8 bg-white" />
                <div className="h-1 w-2 bg-white/20" />
              </div>
              <div className="text-[11px] uppercase font-black tracking-widest mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
                State: Instinct
              </div>
              <div className="text-5xl font-black italic tracking-tighter leading-tight">
                MARS <br /> CORE
              </div>
              <p className="mt-4 text-sm opacity-0 group-hover:opacity-60 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 text-white/60">
                The central processing hub for unrestricted thought. No middleware, just raw cognitive power.
              </p>
            </div>
          </div>

          {/* Card 2: NEURAL PRISM (Multimodal) */}
          <div className="relative group h-[500px] border-r-2 border-white/10 overflow-hidden bg-[#0a0a0a]">
            <div className="absolute inset-0 opacity-20 group-hover:opacity-100 transition-opacity duration-1000">
              {/* Decorative Grid Lines */}
              {[...Array(10)].map((_, i) => (
                <div key={i} className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ top: `${i * 10}%` }} />
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative transform group-hover:rotate-180 transition-transform duration-[2000ms] ease-in-out">
                <Sparkles className="w-24 h-24 text-white opacity-10 group-hover:opacity-100" strokeWidth={0.5} />
              </div>
            </div>

            <div className="absolute bottom-12 left-12 right-12 z-10">
              <div className="text-[11px] uppercase font-black tracking-widest mb-4 opacity-40 group-hover:opacity-100">
                Mode: Spectral
              </div>
              <div className="text-5xl font-black italic tracking-tighter leading-tight">
                NEURAL <br /> PRISM
              </div>
              <p className="mt-4 text-sm opacity-0 group-hover:opacity-60 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 text-white/60">
                Refracting complex prompts into multi-dimensional reasoning. Infinite perspectives, zero filtering.
              </p>
            </div>
          </div>

          {/* Card 3: UNFILTERED FLOW (Absolute) */}
          <div className="relative group h-[500px] overflow-hidden bg-white text-black">
            <div className="absolute inset-0 overflow-hidden opacity-5 group-hover:opacity-30 transition-opacity">
              <div className="whitespace-nowrap text-9xl font-black italic animate-marquee flex flex-col gap-0 select-none">
                <span>FLOW FLOW FLOW FLOW FLOW FLOW FLOW</span>
                <span className="ml-[-100px]">FLOW FLOW FLOW FLOW FLOW FLOW FLOW</span>
                <span>FLOW FLOW FLOW FLOW FLOW FLOW FLOW</span>
                <span className="ml-[-50px]">FLOW FLOW FLOW FLOW FLOW FLOW FLOW</span>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
              <Radio size={80} strokeWidth={1} className="opacity-20 group-hover:opacity-100" />
            </div>

            <div className="absolute bottom-12 left-12 right-12 z-10">
              <div className="text-[11px] uppercase font-black tracking-widest mb-4 opacity-40">
                Output: Kinetic
              </div>
              <div className="text-5xl font-black italic tracking-tighter leading-tight">
                UNFILTERED <br /> FLOW
              </div>
              <p className="mt-4 text-sm opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 font-medium">
                Real-time delivery of raw intelligence. Seamless transitions between logic and creativity.
              </p>
            </div>
          </div>

        </div>
      </section>
      {/* Floating Action Button */}
      <div className="fixed bottom-10 left-0 w-full flex justify-center z-[100] pointer-events-none px-6">
        <Link href="/chat" className="pointer-events-auto bg-white text-black px-10 py-5 rounded-full flex items-center space-x-6 shadow-[0_20px_80px_-20px_rgba(255,255,255,0.4)] transition-all duration-300 transform hover:scale-105 active:scale-95 group overflow-hidden border-2 border-transparent hover:border-white hover:bg-black hover:text-white">
          <div className="relative w-6 h-6 overflow-hidden">
            <MessageSquare size={24} className="absolute inset-0 transition-transform duration-300 group-hover:-translate-y-full" />
            <MessageSquare size={24} className="absolute inset-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0" />
          </div>
          <div className="flex flex-col items-start font-black uppercase tracking-tighter leading-none">
            <span className="text-[9px] opacity-40 mb-1"></span>
            <span className="text-lg">Start chat</span>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white group-hover:bg-white group-hover:text-black transition-colors shrink-0">
            <ChevronRight size={20} />
          </div>
        </Link>
      </div>

      {/* Footer */}
      <footer className="py-16 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-[#333] font-mono uppercase tracking-widest">
            Mars AI v1.0 • Developed by Hunain
          </span>
          <span className="text-[11px] text-[#222] font-mono">
            Built for #UnfilteredThoughts
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
