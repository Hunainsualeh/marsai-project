'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Check, Download, Play, Code2, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load the canvas so it doesn't bloat initial render
const CodeCanvas = dynamic(() => import('./CodeCanvas'), { ssr: false });

interface MarkdownRendererProps {
  content: string;
  canvasMode?: boolean;
}

// Languages that can be previewed live
const PREVIEWABLE = new Set(['html', 'css', 'javascript', 'js', 'jsx', 'tsx', 'typescript', 'ts', 'vue', 'react']);

function CodeBlock({ language, code, canvasMode }: { language: string; code: string; canvasMode?: boolean }) {
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
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-white/[0.04] border-white/10 text-white/40 hover:text-white hover:border-white/25'
                }`}
              >
                {showCanvas ? <Code2 size={10} /> : <Play size={10} fill="currentColor" />}
                {showCanvas ? 'Code Only' : 'Live Preview'}
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
                title="Open in Code Canvas"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Syntax highlighted code */}
        <div className={`overflow-x-auto text-sm ${showCanvas ? 'border-b border-[#1E1E1E]' : ''}`}>
          <SyntaxHighlighter
            style={vscDarkPlus as Record<string, React.CSSProperties>}
            language={language}
            PreTag="div"
            customStyle={{ margin: 0, padding: '16px', background: 'transparent' }}
            codeTagProps={{ style: { fontFamily: 'Fira Code, Cascadia Code, JetBrains Mono, monospace', fontSize: '12.5px', lineHeight: '1.65' } }}
          >
            {code}
          </SyntaxHighlighter>
        </div>

        {/* Inline Code Canvas preview (below the code) */}
        {showCanvas && canPreview && (
          <CodeCanvas
            code={code}
            language={language}
            inline={true}
          />
        )}
      </div>

      {/* Full-screen Code Canvas modal */}
      {canvasOpen && (
        <CodeCanvas
          code={code}
          language={language}
          onClose={() => setCanvasOpen(false)}
          inline={false}
        />
      )}
    </>
  );
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, canvasMode }) => {
  return (
    <div className="prose prose-invert max-w-none break-words leading-relaxed text-[#D1D5DB]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match?.[1] || '';
            const codeString = String(children).replace(/\\n$/, '');

            if (!inline && match) {
              // Intercept the bespoke RENDER_CANVAS JSON payload
              if (language === 'json') {
                try {
                  const parsed = JSON.parse(codeString);
                  if (parsed.action === 'RENDER_CANVAS' && parsed.files) {
                    return <div className="my-4"><CodeCanvas files={parsed.files} inline={true} /></div>;
                  }
                } catch (e) {
                  // Fallthrough to normal JSON code block rendering if it fails to parse or lacks the signature
                }
              }
              return <CodeBlock language={language} code={codeString} canvasMode={canvasMode} />;
            }

            return (
              <code
                className="bg-[#1A1A1A] text-[#00FF41] px-1.5 py-0.5 rounded-md font-mono text-[0.9em]"
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
