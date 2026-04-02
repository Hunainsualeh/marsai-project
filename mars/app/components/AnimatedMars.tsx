import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedMars() {
  return (
    <div className="relative w-32 h-32 md:w-44 md:h-44 mx-auto mb-6 flex items-center justify-center">
      {/* Glow effect behind the planet */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff3e00]/20 to-[#ff8c00]/20 blur-3xl"
      />

      {/* Orbiting ring 1 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-dashed border-[#ff4500]/20"
      />

      {/* Orbiting ring 2 */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2 md:inset-4 rounded-full border border-[#ff4500]/10"
      >
        <div className="absolute top-0 right-1/4 w-1.5 h-1.5 bg-[#00FF41] rounded-full shadow-[0_0_8px_#00FF41]" />
      </motion.div>

      {/* The Mars Planet SVG */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 md:w-32 md:h-32 relative z-10"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,69,0,0.5)]">
          {/* Base planet */}
          <circle cx="50" cy="50" r="48" fill="url(#marsGradient)" />
          
          {/* Craters / Texture */}
          <ellipse cx="30" cy="40" rx="12" ry="8" fill="#B32400" fillOpacity="0.4" />
          <ellipse cx="70" cy="65" rx="15" ry="10" fill="#B32400" fillOpacity="0.3" />
          <ellipse cx="55" cy="25" rx="8" ry="5" fill="#B32400" fillOpacity="0.5" />
          <circle cx="80" cy="35" r="4" fill="#B32400" fillOpacity="0.4" />
          <circle cx="20" cy="65" r="6" fill="#B32400" fillOpacity="0.4" />

          {/* Latitude lines for tech feel */}
          <path d="M 5 50 Q 50 65 95 50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
          <path d="M 15 30 Q 50 40 85 30" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
          <path d="M 15 70 Q 50 80 85 70" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />

          {/* Core glow */}
          <circle cx="50" cy="50" r="48" fill="url(#innerGlow)" />

          <defs>
            <radialGradient id="marsGradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(30 30) rotate(45) scale(80)">
              <stop stopColor="#FF5722" />
              <stop offset="0.7" stopColor="#D84315" />
              <stop offset="1" stopColor="#8D2908" />
            </radialGradient>
            <radialGradient id="innerGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) scale(48)">
              <stop stopColor="transparent" offset="0.6" />
              <stop stopColor="#0A0A0A" offset="1" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}
