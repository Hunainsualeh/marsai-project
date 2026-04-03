'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Settings,
  X,
  MessageSquare,
  Loader2,
  PanelLeftClose,
  PanelLeft,
  Clock,
  ChevronRight,
  LogOut,
  Pin,
  PinOff,
} from 'lucide-react';

interface Session {
  _id: string;
  title: string;
  model: string;
  updatedAt: string;
  isPinned?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  activeSessionId: string | null;
}

function groupSessions(sessions: Session[]) {
  const now = Date.now();
  const pinned: Session[] = [];
  const today: Session[] = [];
  const yesterday: Session[] = [];
  const older: Session[] = [];

  sessions.forEach((s) => {
    if (s.isPinned) {
      pinned.push(s);
      return;
    }
    const diff = now - new Date(s.updatedAt).getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) today.push(s);
    else if (hours < 48) yesterday.push(s);
    else older.push(s);
  });

  const sortByDate = (a: Session, b: Session) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

  return { 
    pinned: pinned.sort(sortByDate),
    today: today.sort(sortByDate), 
    yesterday: yesterday.sort(sortByDate), 
    older: older.sort(sortByDate) 
  };
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getModelShortName(model: string) {
  if (model.includes('llama-3.3')) return 'Logic';
  if (model.includes('8b-instant')) return 'Reflex';
  if (model.includes('mixtral')) return 'Nexus';
  if (model.includes('gemma')) return 'Poly';
  if (model.includes('scout') || model.includes('vision')) return 'Vision';
  return 'AI';
}

export default function Sidebar({
  isOpen,
  onToggle,
  onOpenSettings,
  activeSessionId,
}: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    const handler = () => fetchSessions();
    window.addEventListener('mars:refresh-sessions', handler);
    return () => window.removeEventListener('mars:refresh-sessions', handler);
  }, [fetchSessions]);

  const handleNewChat = () => {
    if (isCreating) return;
    setIsCreating(true);
    router.push('/chat');
    if (window.innerWidth < 1024) onToggle();
    setTimeout(() => setIsCreating(false), 1000);
  };

  const confirmLogout = async () => {
    try {
      sessionStorage.removeItem('mars_welcome_shown');
      await logout();
      router.replace('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, session: Session) => {
    e.preventDefault();
    e.stopPropagation();
    const newPinned = !session.isPinned;
    
    // Optimistic update
    setSessions(prev => prev.map(s => s._id === session._id ? { ...s, isPinned: newPinned } : s));

    try {
      await fetch(`/api/sessions/${session._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: newPinned })
      });
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      // Rollback on error
      setSessions(prev => prev.map(s => s._id === session._id ? { ...s, isPinned: !newPinned } : s));
    }
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    const id = sessionToDelete._id;
    setDeletingId(id);
    setSessionToDelete(null);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s._id !== id));
        if (activeSessionId === id) router.push('/chat');
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const { pinned, today, yesterday, older } = groupSessions(sessions);

  const SessionItem = ({ session }: { session: Session }) => {
    const isActive = activeSessionId === session._id;
    return (
      <div className={`group relative rounded-xl transition-all duration-200 ${isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}>
        <Link
          href={`/chat?s=${session._id}`}
          className="flex items-start gap-3 px-3 py-2.5 w-full"
        >
          <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-white/5'}`}>
            <MessageSquare size={11} className={isActive ? 'text-white' : 'text-white/40'} />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <div className={`text-[12px] font-medium leading-tight truncate ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>
              {session.title}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/20">{getModelShortName(session.model)}</span>
              <span className="text-white/10">·</span>
              <span className="text-[9px] text-white/20">{timeAgo(session.updatedAt)}</span>
            </div>
          </div>
        </Link>
        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => handleTogglePin(e, session)}
            className={`p-1.5 rounded-lg transition-all ${session.isPinned ? 'text-white bg-white/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
          >
            {session.isPinned ? <Pin size={11} fill="currentColor" /> : <Pin size={11} />}
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSessionToDelete(session); }}
            disabled={deletingId === session._id}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all"
          >
            {deletingId === session._id
              ? <Loader2 size={11} className="animate-spin" />
              : <Trash2 size={11} />
            }
          </button>
        </div>
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white/50 rounded-full" />
        )}
      </div>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="flex items-center gap-2 px-3 py-2">
      <Clock size={9} className="text-white/15" />
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/15">{label}</span>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 260 : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed lg:relative z-40 h-dvh flex flex-col overflow-hidden shrink-0"
      >
        <div className="flex flex-col h-full w-[260px] bg-[#080808] border-r border-white/[0.06]">

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-5 pb-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/mars-logo.svg"
                alt="Mars AI Logo"
                width={28}
                height={28}
                className="drop-shadow-[0_0_8px_rgba(255,107,53,0.6)] group-hover:drop-shadow-[0_0_14px_rgba(255,107,53,0.9)] transition-all duration-300"
              />
              <span className="text-[13px] font-black uppercase tracking-[0.15em] text-white/80 group-hover:text-white transition-colors">Mars AI</span>
            </Link>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/5 transition-all"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          {/* New Chat */}
          <div className="px-3 pb-3">
            <button
              onClick={handleNewChat}
              disabled={isCreating}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 active:scale-[0.98] transition-all relative overflow-hidden shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
            >
              {isCreating
                ? <Loader2 size={14} className="animate-spin shrink-0" />
                : <Plus size={14} className="shrink-0" />
              }
              <span>{isCreating ? 'Resetting...' : 'New Mission'}</span>
              {isCreating && (
                <motion.div
                  className="absolute bottom-0 left-0 h-[2px] bg-black/20"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1 }}
                />
              )}
            </button>
          </div>

          {/* Sessions */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-white/5">
            {loading ? (
              <div className="space-y-1.5 px-1 pt-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-white/[0.03] rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <MessageSquare size={16} className="text-white/20" />
                </div>
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest text-center">No missions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pinned.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-3 py-2">
                       <Pin size={9} className="text-white/40" />
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Pinned Protocols</span>
                    </div>
                    <div className="space-y-0.5">{pinned.map(s => <SessionItem key={s._id} session={s} />)}</div>
                  </div>
                )}
                {today.length > 0 && (
                  <div>
                    <SectionLabel label="Today" />
                    <div className="space-y-0.5">{today.map(s => <SessionItem key={s._id} session={s} />)}</div>
                  </div>
                )}
                {yesterday.length > 0 && (
                  <div>
                    <SectionLabel label="Yesterday" />
                    <div className="space-y-0.5">{yesterday.map(s => <SessionItem key={s._id} session={s} />)}</div>
                  </div>
                )}
                {older.length > 0 && (
                  <div>
                    <SectionLabel label="Older" />
                    <div className="space-y-0.5">{older.map(s => <SessionItem key={s._id} session={s} />)}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-3 border-t border-white/[0.04] space-y-1">
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Settings size={14} />
                <span className="text-[11px] font-bold uppercase tracking-widest">Settings</span>
              </div>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => setIsLoggingOut(true)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <LogOut size={14} />
                <span className="text-[11px] font-bold uppercase tracking-widest">Sign Out</span>
              </div>
            </button>
            <div className="text-center mt-3 text-[8px] text-white/10 font-mono tracking-widest uppercase">
              Mars AI v2.0 — Auth: {user?.displayName || user?.email ? (user.displayName || user.email?.split('@')[0])?.toUpperCase() : 'USER'}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Collapsed state — icon buttons */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="fixed top-4 left-4 z-50 flex flex-col gap-2"
          >
            <button
              onClick={onToggle}
              className="p-2.5 rounded-xl bg-[#111] border border-white/[0.08] hover:bg-[#1A1A1A] hover:border-white/[0.15] text-white/40 hover:text-white transition-all"
              aria-label="Open sidebar"
            >
              <PanelLeft size={17} />
            </button>
            <button
              onClick={handleNewChat}
              disabled={isCreating}
              className="p-2.5 rounded-xl bg-white text-black hover:bg-white/90 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
              aria-label="New chat"
            >
              {isCreating ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
            </button>
            <button
              onClick={() => setIsLoggingOut(true)}
              className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
              aria-label="Sign out"
            >
              <LogOut size={17} className="ml-0.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {sessionToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSessionToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-[#0F0F0F] border border-white/10 p-6 rounded-2xl shadow-2xl"
            >
              <button
                onClick={() => setSessionToDelete(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={14} />
              </button>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-white mb-1">Archive Mission?</h2>
                  <p className="text-xs text-white/40 leading-relaxed max-w-[200px] mx-auto">
                    "<span className="text-white/60">{sessionToDelete.title}</span>" will be moved to the <span className="text-white">Memory Vault</span>.
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setSessionToDelete(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-white/60 hover:text-white border border-white/8 text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(239,68,68,0.3)]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {isLoggingOut && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoggingOut(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-[#0F0F0F] border border-white/10 p-6 rounded-2xl shadow-2xl"
            >
              <button
                onClick={() => setIsLoggingOut(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={14} />
              </button>
              <div className="flex flex-col items-center text-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <LogOut size={24} className="text-red-400 ml-1" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-white mb-2">Disconnect Core?</h2>
                  <p className="text-sm text-white/70 leading-relaxed max-w-[240px] mx-auto">
                    You will need to <span className="text-white font-semibold">re-authenticate</span> to regain access.
                  </p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setIsLoggingOut(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[11px] font-bold uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(239,68,68,0.3)]"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
