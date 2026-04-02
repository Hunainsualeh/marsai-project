'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eraser, Trash2, Download, Paperclip, Minus, Plus, Pen } from 'lucide-react';

interface CanvasDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (dataUrl: string, fileName: string) => void;
}

const COLORS = ['#FFFFFF', '#F87171', '#FBBF24', '#34D399', '#60A5FA', '#C084FC', '#FB7185', '#000000'];

export default function CanvasDrawer({ isOpen, onClose, onAttach }: CanvasDrawerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#FFFFFF');
  const [size, setSize] = useState(3);

  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Get canvas context helper
  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  // Init canvas with black background
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Set canvas size to element size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [isOpen]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const pos = getPos(e, canvas);

    ctx.beginPath();
    ctx.lineWidth = tool === 'eraser' ? size * 4 : size;
    ctx.strokeStyle = tool === 'eraser' ? '#111111' : color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPos.current = pos;
  }, [isDrawing, tool, color, size]);

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleAttach = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onAttach(dataUrl, `canvas-sketch-${Date.now()}.png`);
    onClose();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `mars-canvas-${Date.now()}.png`;
    link.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed bottom-0 left-0 right-0 z-[160] mx-auto max-w-3xl px-4 pb-4"
          >
            <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Pen size={14} className="text-white/40" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Canvas Sketch</span>
                  <span className="text-[9px] bg-white/5 border border-white/8 rounded-full px-2 py-0.5 text-white/25 font-mono uppercase tracking-widest">
                    Send to Visionary AI
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/5 transition-all"
                    title="Download"
                  >
                    <Download size={13} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04]">
                {/* Tool select */}
                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/8 rounded-full p-0.5">
                  <button
                    onClick={() => setTool('pen')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${tool === 'pen' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    <Pen size={11} />
                    Pen
                  </button>
                  <button
                    onClick={() => setTool('eraser')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${tool === 'eraser' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    <Eraser size={11} />
                    Erase
                  </button>
                </div>

                {/* Color swatches */}
                <div className="flex items-center gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setColor(c); setTool('pen'); }}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${color === c && tool === 'pen' ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                {/* Size */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => setSize(s => Math.max(1, s - 1))}
                    className="p-1 rounded-full text-white/30 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Minus size={12} />
                  </button>
                  <div className="flex items-center justify-center">
                    <div
                      className="rounded-full bg-white transition-all"
                      style={{ width: Math.min(20, size * 2 + 4), height: Math.min(20, size * 2 + 4) }}
                    />
                  </div>
                  <button
                    onClick={() => setSize(s => Math.min(20, s + 1))}
                    className="p-1 rounded-full text-white/30 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Clear */}
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/8 text-[10px] font-bold uppercase tracking-wider text-white/30 hover:text-red-400 hover:border-red-400/30 transition-all"
                >
                  <Trash2 size={11} />
                  Clear
                </button>
              </div>

              {/* Canvas */}
              <div className="relative" style={{ height: 280 }}>
                <canvas
                  ref={canvasRef}
                  className="w-full h-full cursor-crosshair touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                {/* Empty state hint */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-[11px] font-mono text-white/[0.06] uppercase tracking-widest">Draw something...</span>
                </div>
              </div>

              {/* Attach footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <p className="text-[9px] text-white/20 font-mono">
                  Sketch will be sent as image to the Vision model for analysis
                </p>
                <button
                  onClick={handleAttach}
                  className="flex items-center gap-2 px-5 py-2 bg-white text-black rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all"
                >
                  <Paperclip size={12} />
                  Attach Sketch
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
