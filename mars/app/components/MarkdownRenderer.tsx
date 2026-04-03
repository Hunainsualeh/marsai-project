'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Check, Download, Play, Code2, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load the canvas so it doesn't bloat initial render
const CodeCanvas = dynamic(() => import('./CodeCanvas')
  .catch((err) => {
    // If a chunk fails to load typically due to a stale build on mobile, force a hard reload
    if (err?.message?.includes('Failed to load chunk') || err?.name === 'ChunkLoadError') {
      window.location.reload();
    }
    console.error("Failed to load CodeCanvas", err);
    return () => <div className="p-4 text-red-400 border border-red-500/20 rounded bg-red-500/10">Failed to load live preview canvas. Please refresh the page.</div>;
  }), { 
  ssr: false,
  loading: () => <div className="p-8 flex justify-center items-center"><div className="animate-spin w-6 h-6 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full" /></div>
});

interface MarkdownRendererProps {
  content: string;
  canvasMode?: boolean;
}

// Languages that can be previewed live
const PREVIEWABLE = new Set(['html', 'css', 'javascript', 'js', 'jsx', 'tsx', 'typescript', 'ts', 'vue', 'react']);

function extractVFS(content: string) {
  const files: Record<string, string> = {};
  const blockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  let htmlCount = 0, cssCount = 0, jsCount = 0, tsCount = 0;
  while ((match = blockRegex.exec(content)) !== null) {
    const lang = match[1].toLowerCase();
    const code = match[2];
    if (lang === 'html') { files[htmlCount === 0 ? 'index.html' : `index${htmlCount}.html`] = code; htmlCount++; }
    else if (lang === 'css') { files[cssCount === 0 ? 'style.css' : `style${cssCount}.css`] = code; cssCount++; }
    else if (['js', 'javascript'].includes(lang)) { files[jsCount === 0 ? 'script.js' : `script${jsCount}.js`] = code; jsCount++; }
    else if (['ts', 'typescript'].includes(lang)) { files[tsCount === 0 ? 'script.ts' : `script${tsCount}.ts`] = code; tsCount++; }
    else if (['jsx', 'tsx', 'react'].includes(lang)) { files[jsCount === 0 ? 'App.jsx' : `App${jsCount}.jsx`] = code; jsCount++; }
  }
  return files;
}

function CodeBlock({ language, code, canvasMode, allFiles }: { language: string; code: string; canvasMode?: boolean; allFiles?: Record<string, string> }) {
  const canPreview = PREVIEWABLE.has(language.toLowerCase());
  const [copied, setCopied] = useState(false);
  // When canvasMode is active, auto-open preview for previewable code
  const [showCanvas, setShowCanvas] = useState(() => !!(canvasMode && canPreview));
  const [canvasOpen, setCanvasOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippet.${language || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const langColor: Record<string, string> = {
    html: '#F97316', css: '#60A5FA', javascript: '#FCD34D', js: '#FCD34D',
    jsx: '#61DAFB', tsx: '#61DAFB', typescript: '#60A5FA', ts: '#60A5FA',
    python: '#34D399', vue: '#4ADE80', bash: '#A78BFA', shell: '#A78BFA',
  };
  const accentColor = langColor[language.toLowerCase()] ?? '#888';

  return (
    <>
      <div className="relative mt-4 mb-4 rounded-xl overflow-hidden border border-[#1E1E1E] bg-[#09090B]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-[#1E1E1E]">
          <div className="flex items-center gap-2">
            {/* Traffic lights */}
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            </div>
            <span
              className="text-[10px] font-black uppercase tracking-widest ml-1"
              style={{ color: accentColor }}
            >
              {language}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Live Preview button */}
            {canPreview && (
              <button
                onClick={() => setShowCanvas(!showCanvas)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all ${
                  showCanvas
                    ? 'bg-[#1E1E1E] border-[#333] text-white/60 hover:text-white hover:bg-[#252525]'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300'
                }`}
              >
                {showCanvas ? <Code2 size={10} /> : <Play size={10} fill="currentColor" />}
                {showCanvas ? 'Close Preview' : 'Live Preview'}
              </button>
            )}

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-1.5 text-white/25 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title="Download"
            >
              <Download size={13} />
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-1.5 text-white/25 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title="Copy"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>

            {/* Open in full Canvas modal */}
            {canPreview && (
              <button
                onClick={() => setCanvasOpen(true)}
                className="p-1.5 text-white/25 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Expand to Fullscreen"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Syntax highlighted code */}
        {!showCanvas && (
          <div className="overflow-x-auto text-sm">
            <SyntaxHighlighter
              style={vscDarkPlus as Record<string, React.CSSProperties>}
              language={language}
              PreTag="div"
              wrapLongLines={true}
              customStyle={{ margin: 0, padding: '16px', background: 'transparent', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              codeTagProps={{ style: { fontFamily: 'Fira Code, Cascadia Code, JetBrains Mono, monospace', fontSize: '12.5px', lineHeight: '1.65', whiteSpace: 'pre-wrap' } }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        )}

        {/* Inline Code Canvas preview (below the code) */}
        {showCanvas && canPreview && (
          <CodeCanvas
            code={code}
            language={language}
            files={allFiles && Object.keys(allFiles).length > 1 ? allFiles : undefined}
            inline={true}
          />
        )}
      </div>

      {/* Full-screen Code Canvas modal */}
      {canvasOpen && (
        <CodeCanvas
          code={code}
          language={language}
          files={allFiles && Object.keys(allFiles).length > 1 ? allFiles : undefined}
          onClose={() => setCanvasOpen(false)}
          inline={false}
        />
      )}
    </>
  );
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, canvasMode }) => {
  const allFiles = React.useMemo(() => extractVFS(content), [content]);

  return (
    <div className="prose prose-invert max-w-none break-words leading-relaxed text-[#D1D5DB] [overflow-wrap:anywhere] [word-break:break-word]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match?.[1] || '';
            const codeString = String(children).replace(/\\n$/, '');

            if (!inline) {
              if (match) {
                return <CodeBlock language={language} code={codeString} canvasMode={canvasMode} allFiles={allFiles} />;
              }
            }

            return (
              <code
                className="bg-[#1A1A1A] text-[#00FF41] px-1.5 py-0.5 rounded-md font-mono text-[0.9em] break-words [overflow-wrap:anywhere] whitespace-pre-wrap"
                {...props}
              >
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="mb-4 text-[#D1D5DB] text-[15px]">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 text-[#D1D5DB] space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 text-[#D1D5DB] space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-1 text-[#D1D5DB]">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">
              {children}
            </a>
          ),
          h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4 text-white tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-3 text-white tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mt-6 mb-2 text-white">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#333] pl-4 italic text-[#888] my-4">{children}</blockquote>
          ),
          pre: ({ children }) => (
            <pre className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-4 my-4 whitespace-pre-wrap break-words overflow-x-hidden">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[#222] px-4 py-2 text-left text-white font-bold bg-[#111]">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-[#1A1A1A] px-4 py-2 text-[#D1D5DB]">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
