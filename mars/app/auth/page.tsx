"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Globe } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

const STOMP_WORDS = [
    "NEURAL", "COMPUTE", "LOGIC", "SYNTHESIS", "AWARE",
    "INSIGHT", "EVOLVE", "ANALYZE", "CONNECT", "MARS-AI"
];

function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/chat';

    const { user, loading, error, signInWithGoogle, loginWithEmail, signUpWithEmail, clearError } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const [wordIndex, setWordIndex] = useState(0);
    const [terminalId, setTerminalId] = useState('-------');
    const [submitting, setSubmitting] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    // Redirect if already authenticated
    useEffect(() => {
        if (!loading && user) {
            router.replace(redirect);
        }
    }, [user, loading, router, redirect]);

    // Generate terminal ID on client only to avoid hydration mismatch
    useEffect(() => {
        setTerminalId(Math.random().toString(36).substring(7).toUpperCase());
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setWordIndex((prev) => (prev + 1) % STOMP_WORDS.length);
        }, 450);
        return () => clearInterval(interval);
    }, []);

    const toggleMode = () => {
        setIsAnimating(true);
        clearError();
        setTimeout(() => {
            setIsLogin(!isLogin);
            setIsAnimating(false);
        }, 300);
    };

    /** Write the auth cookie immediately so proxy.ts sees it before redirecting */
    const setAuthCookie = async () => {
        const { getIdToken } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        if (auth.currentUser) {
            const token = await getIdToken(auth.currentUser);
            document.cookie = `__firebase_auth=${token}; path=/; max-age=3600; SameSite=Strict`;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isLogin) {
                await loginWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password, name);
            }
            router.replace(redirect);
        } catch {
            // error is surfaced via useAuth error state
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogle = async () => {
        setSubmitting(true);
        try {
            await signInWithGoogle();
            await setAuthCookie();
            router.replace(redirect);
        } catch {
            // error is surfaced via useAuth error state
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-400 selection:text-black overflow-hidden flex flex-col md:flex-row">

            {/* LEFT COLUMN: MASKED KINETIC TYPOGRAPHY */}
            <div className="relative w-full md:w-1/2 h-64 md:h-screen bg-[#f0f0f0] overflow-hidden flex items-center justify-center border-b-8 md:border-b-0 md:border-r-8 border-black">

                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                <div className="relative z-10 w-4/5 h-32 md:h-48 bg-black flex items-center justify-center overflow-hidden transform rotate-[-2deg] shadow-[10px_10px_0px_0px_rgba(254,240,138,1)]">
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="relative overflow-hidden h-full flex items-center">
                            <span className="text-[8vw] md:text-[6vw] font-black italic tracking-[calc(-0.05em)] uppercase leading-none text-white animate-stomp-scale inline-block">
                                {STOMP_WORDS[wordIndex]}
                            </span>
                        </div>
                    </div>
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-400" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-400" />
                </div>

                <div className="absolute top-0 w-full bg-black text-white py-1.5 overflow-hidden flex border-b-2 border-yellow-400">
                    <div className="whitespace-nowrap font-black italic text-[10px] tracking-widest animate-marquee uppercase">
                        MARS AI NEURAL NETWORK // COGNITIVE PROTOCOLS ACTIVE // SYSTEM OPTIMAL // MARS AI NEURAL NETWORK // COGNITIVE PROTOCOLS ACTIVE // SYSTEM OPTIMAL //
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: AUTH FORM */}
            <div className={`w-full md:w-1/2 flex items-center justify-center p-8 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <div className="w-full max-w-md">

                    <div className="mb-10">
                        <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-[0.85] mb-4">
                            {isLogin ? 'SECURE\nACCESS' : 'INITIALIZE\nLINK'}
                        </h2>
                        <p className="text-gray-500 font-bold tracking-tight uppercase text-xs">
                            {isLogin ? "New to the network?" : "Already in the system?"}{' '}
                            <button
                                onClick={toggleMode}
                                className="text-yellow-400 hover:text-white underline decoration-2 underline-offset-4 transition-all font-black"
                            >
                                {isLogin ? 'INITIALIZE LINK' : 'SECURE ACCESS'}
                            </button>
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-4 border-2 border-red-500 bg-red-500/10 p-3 flex items-start justify-between gap-2">
                            <p className="text-red-400 text-xs font-black uppercase tracking-wider leading-relaxed">
                                {error.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim()}
                            </p>
                            <button onClick={clearError} className="text-red-400 hover:text-white font-black text-sm leading-none shrink-0">✕</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="relative">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Full Name</label>
                                <div className="relative flex items-center group">
                                    <User className="absolute left-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="NAME.SURNAME"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black border-2 border-white/20 focus:border-yellow-400 p-4 pl-12 outline-none text-lg font-black transition-all placeholder:text-white/10"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Authentication Email</label>
                            <div className="relative flex items-center group">
                                <Mail className="absolute left-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    placeholder="USER@KINETIC.NET"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black border-2 border-white/20 focus:border-yellow-400 p-4 pl-12 outline-none text-lg font-black transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Secure Passkey</label>
                            <div className="relative flex items-center group">
                                <Lock className="absolute left-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black border-2 border-white/20 focus:border-yellow-400 p-4 pl-12 outline-none text-lg font-black transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            id="auth-submit-btn"
                            className="group relative w-full bg-white text-black py-5 mt-6 overflow-hidden active:scale-[0.97] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3 font-black italic text-2xl uppercase tracking-tighter">
                                {submitting ? 'PROCESSING...' : isLogin ? 'EXECUTE LOGIN' : 'ESTABLISH LINK'}
                                {!submitting && <ArrowRight className="group-hover:translate-x-2 transition-transform" strokeWidth={3} />}
                            </div>
                            <div className="absolute inset-0 bg-yellow-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        </button>
                    </form>

                    {/* Google OAuth */}
                    <div className="mt-6">
                        <button
                            id="auth-google-btn"
                            onClick={handleGoogle}
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-3 border-2 border-white/10 py-4 hover:border-white hover:bg-white hover:text-black transition-all font-black italic uppercase text-sm group disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Globe size={20} className="group-hover:rotate-[360deg] transition-transform duration-700" />
                            Authenticate with Google
                        </button>
                    </div>

                    <div className="mt-12 opacity-20 text-center border-t border-white/10 pt-6">
                        <p className="text-[9px] font-black uppercase tracking-[0.5em]">
                            TERMINAL ID: {terminalId} // KINETIC-V3
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
        .animate-stomp-scale {
          animation: stomp-scale 0.45s cubic-bezier(0.12, 0, 0.39, 0) infinite alternate;
        }
        @keyframes stomp-scale {
          0% { transform: scale(0.95); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
}

export default function AuthPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white font-black italic text-2xl animate-pulse">
                    LOADING CORE...
                </div>
            </div>
        }>
            <AuthForm />
        </React.Suspense>
    );
}