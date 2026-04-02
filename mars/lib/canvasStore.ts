import { create } from 'zustand';

export interface ConsoleLog {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  messages: any[];
  timestamp: number;
}

interface CanvasState {
  // Virtual File System
  files: Record<string, string>;
  activeFile: string;
  setFiles: (files: Record<string, string>) => void;
  updateFile: (filename: string, content: string) => void;
  setActiveFile: (filename: string) => void;

  // Console Proxy State
  logs: ConsoleLog[];
  addLog: (log: Omit<ConsoleLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;

  // View Layout State
  panelLayout: number[];
  setPanelLayout: (layout: number[]) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  // VFS Initial State
  files: {
    'index.html': '<!-- HTML goes here -->\n',
    'style.css': '/* CSS styles go here */\n',
    'script.js': '// JavaScript logic goes here\n'
  },
  activeFile: 'index.html',

  setFiles: (files) => set({ files }),
  
  updateFile: (filename, content) => set((state) => ({
    files: { ...state.files, [filename]: content }
  })),
  
  setActiveFile: (filename) => set({ activeFile: filename }),

  // Console State
  logs: [],
  addLog: (log) => set((state) => ({
    logs: [
      ...state.logs, 
      { ...log, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }
    ]
  })),
  clearLogs: () => set({ logs: [] }),

  // Layout State (Code | Preview Split)
  panelLayout: [50, 50],
  setPanelLayout: (panelLayout) => set({ panelLayout }),
}));
