'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const SolarPreloader = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          // THE EXIT: Radial Expansion (Solar Flare)
          // No delay, instant transition into the site
          gsap.to(".grid-tile", {
            scale: 4,
            opacity: 0,
            duration: 0.7,
            stagger: {
              grid: [10, 10],
              from: "center",
              amount: 0.3
            },
            ease: "power4.in"
          });

          gsap.to(".content-wrapper", {
            scale: 2,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => setComplete(true)
          });
        }
      });

      // 1. Instant SVG Orbit Drawing
      tl.fromTo(".orbit", 
        { strokeDasharray: 400, strokeDashoffset: 400, opacity: 0 },
        { strokeDashoffset: 0, opacity: 0.3, duration: 1, stagger: 0.1, ease: "power2.out" }
      );

      // 2. Planet Alignment (Sharp dots)
      tl.fromTo(".planet", 
        { scale: 0 },
        { scale: 1, duration: 0.4, stagger: 0.05, ease: "back.out(2)" },
        "-=0.8"
      );

      // 3. Text "Signal" Reveal
      tl.fromTo(".mars-title", 
        { y: 10, opacity: 0, filter: "blur(5px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" },
        "-=0.5"
      );

      // 4. Constant Subtle Rotation (Background)
      gsap.to(".orrery-group", {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: "none"
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (complete) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden font-mono bg-[#050505]">
      
      {/* Background Grid - Minimalist space coordinates */}
      <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none opacity-20">
        {[...Array(100)].map((_, i) => (
          <div key={i} className="grid-tile border-[0.2px] border-white/10" />
        ))}
      </div>

      <div className="content-wrapper relative z-10 flex flex-col items-center">
        {/* Minimalist Solar System Orrery SVG */}
        <svg width="240" height="240" viewBox="0 0 200 200" className="mb-6">
          <g className="orrery-group" transform="translate(100, 100)">
            {/* Orbits */}
            <circle className="orbit" r="30" fill="none" stroke="white" strokeWidth="0.5" />
            <circle className="orbit" r="55" fill="none" stroke="white" strokeWidth="0.5" />
            <circle className="orbit" r="85" fill="none" stroke="white" strokeWidth="0.5" />
            
            {/* Planets (Sharp Vector Points) */}
            <circle className="planet" cx="30" cy="0" r="1.5" fill="white" />
            <circle className="planet" cx="-40" cy="38" r="2" fill="#ff4d00" /> {/* Mars Accent */}
            <circle className="planet" cx="60" cy="-60" r="2.5" fill="white" />
            
            {/* Sun/Core */}
            <circle cx="0" cy="0" r="1" fill="white" className="animate-ping" />
          </g>
        </svg>

        <div className="text-center">
          <h1 className="mars-title text-4xl md:text-6xl font-bold text-white tracking-[0.8em] uppercase ml-[0.8em]">
            Mars
          </h1>
          <div className="mt-4 text-[10px] tracking-[0.4em] text-white/40 uppercase">
            Orbital_Sync_Active
          </div>
        </div>
      </div>

      {/* Frame UI */}
      <div className="absolute top-6 left-6 text-[9px] text-white/30 space-y-1">
        <div>SYS_REF: SOL_04</div>
        <div>RAD_DIST: 227.9M KM</div>
      </div>

      {/* Crosshair Scanner */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-white/5" />
        <div className="absolute top-0 left-1/2 h-full w-[0.5px] bg-white/5" />
      </div>
    </div>
  );
};

export default SolarPreloader;