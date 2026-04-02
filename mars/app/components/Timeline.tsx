import React from 'react';

export interface TimelineNode {
  id: string;
  role: 'user' | 'assistant' | 'system';
}

interface TimelineProps {
  nodes: TimelineNode[];
  onNodeClick: (id: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ nodes, onNodeClick }) => {
  if (!nodes || nodes.length < 3) return null; // Hide if chat is very short

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-1.5 p-3 bg-[#0A0A0A]/50 backdrop-blur-md rounded-full border border-[#1A1A1A]">
      <div className="text-[9px] uppercase tracking-widest font-mono text-[#555] mb-2 rotating-text opacity-50" style={{ writingMode: 'vertical-rl' }}>
        Timeline
      </div>
      
      <div className="w-[1px] h-4 bg-gradient-to-b from-transparent to-[#333] mb-1" />

      {nodes.map((node, i) => (
        <button
          key={node.id}
          onClick={() => onNodeClick(node.id)}
          className="group relative flex items-center justify-center w-6 h-6 outline-none"
          aria-label={`Go to ${node.role} message`}
        >
          {/* Subtle line connecting nodes */}
          {i !== nodes.length - 1 && (
            <div className="absolute top-1/2 w-[1px] h-full bg-[#222] -z-10" />
          )}
          
          <div className={`
            w-1.5 h-1.5 rounded-full transition-all duration-300
            ${node.role === 'user' 
              ? 'bg-[#E0E0E0] group-hover:scale-150 group-hover:bg-white' 
              : 'bg-[#333] group-hover:scale-150 group-hover:bg-[#E0E0E0]'
            }
          `} />

          {/* Tooltip */}
          <div className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="bg-[#111] text-[#E0E0E0] text-[10px] uppercase tracking-wider font-mono px-2 py-1 rounded border border-[#222] whitespace-nowrap">
              {node.role === 'user' ? 'User' : 'Mars AI'}
            </div>
          </div>
        </button>
      ))}

      <div className="w-[1px] h-4 bg-gradient-to-t from-transparent to-[#333] mt-1" />
    </div>
  );
};

export default Timeline;
