import React from "react";

interface MarqueeItem {
    icon: string;
    text: string;
    prompt?: string;
    color?: string;
}

interface MarqueeProps {
    items: MarqueeItem[];
    direction?: "left" | "right";
    speed?: string;
    onItemClick?: (prompt: string) => void;
}

const Marquee: React.FC<MarqueeProps> = ({ items, direction = "left", speed = "30s", onItemClick }) => {
    const displayItems = [...items, ...items, ...items];

    return (
        <div className="flex overflow-hidden select-none py-3">
            <div
                className={`flex min-w-full shrink-0 items-center justify-around gap-4 ${direction === "left" ? "animate-marquee" : "animate-marquee-reverse"
                    }`}
                style={{ animationDuration: speed }}
            >
                {displayItems.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => onItemClick && onItemClick(item.prompt || item.text)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full border ${item.color || 'border-white/10'} bg-white/5 backdrop-blur-md text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 whitespace-nowrap shadow-lg hover:scale-105 active:scale-95`}
                    >
                        <span className="opacity-70">{item.icon}</span>
                        <span className="text-sm font-medium tracking-wide">{item.text}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Marquee;