"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function IsometricHeroSVG() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

      // Build out the machine and tracks
      gsap.set(".machine-part", {
        opacity: 0,
        scaleY: 0,
        transformOrigin: "bottom",
      });
      gsap.set(".track", { opacity: 0, scale: 0.9 });

      tl.to(".track", { opacity: 0.8, scale: 1, duration: 1, stagger: 0.2 }).to(
        ".machine-part",
        { opacity: 1, scaleY: 1, duration: 0.8, stagger: 0.1 },
        "-=0.5",
      );

      // Continuous loop for raw data going INTO the processor
      gsap.to(".raw-data", {
        keyframes: [
          { x: -450, y: -225, opacity: 0, duration: 0 },
          { x: -400, y: -200, opacity: 1, duration: 0.5 },
          { x: -150, y: -75, opacity: 1, duration: 2 },
          { x: -100, y: -50, opacity: 0, duration: 0.5 },
        ],
        ease: "none",
        repeat: -1,
        stagger: 0.75,
      });

      // Machine Processing (Pulsing lights, shaking slightly)
      gsap.to(".processing-core", {
        opacity: 0.4,
        scale: 1.1,
        duration: 0.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        transformOrigin: "center",
      });

      gsap.to(".processing-light", {
        opacity: 0.2,
        duration: 0.2,
        yoyo: true,
        repeat: -1,
        stagger: 0.1,
        ease: "steps(1)",
      });

      // Refined Outputs coming OUT of the processor
      gsap.to(".refined-data", {
        keyframes: [
          { x: 50, y: 25, opacity: 0, scale: 0.5, duration: 0 },
          { x: 100, y: 50, opacity: 1, scale: 1, duration: 0.5 },
          { x: 300, y: 150, opacity: 1, duration: 2 },
          { x: 350, y: 175, opacity: 0, duration: 0.5 },
        ],
        ease: "none",
        repeat: -1,
        stagger: 1,
      });
    }, svgRef);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1000 800"
      className="w-full h-full drop-shadow-2xl"
      aria-hidden="true"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="machine-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="track-grad-in" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            stopColor="hsl(var(--muted-foreground))"
            stopOpacity="0.1"
          />
          <stop
            offset="100%"
            stopColor="hsl(var(--muted-foreground))"
            stopOpacity="0.4"
          />
        </linearGradient>
        <linearGradient id="track-grad-out" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
          <stop
            offset="100%"
            stopColor="hsl(var(--accent))"
            stopOpacity="0.6"
          />
        </linearGradient>

        {/* Templates for Items */}
        {/* Raw Data: Messy polygon */}
        <g id="raw-item">
          <path
            d="M0,10 L-15,-5 L-5,-20 L15,-10 Z"
            fill="hsl(var(--secondary))"
            fillOpacity="0.7"
            stroke="hsl(var(--secondary-foreground))"
            strokeWidth="1"
          />
          <path
            d="M-5,-20 L15,-10 L20,-25 L0,-35 Z"
            fill="hsl(var(--secondary))"
            fillOpacity="0.4"
          />
          <path
            d="M0,10 L15,-10 L20,-25 L5,-5 Z"
            fill="hsl(var(--secondary))"
            fillOpacity="0.9"
          />
          <circle cx="0" cy="-15" r="4" fill="hsl(var(--destructive))" />
        </g>

        {/* Refined Data: Perfect glowing cube / book stack */}
        <g id="refined-item">
          <path d="M0,15 L-25,-2 L0,-20 L25,-2 Z" fill="white" />
          <path
            d="M-25,-2 L0,15 L0,30 L-25,12 Z"
            fill="hsl(var(--primary))"
            fillOpacity="0.3"
          />
          <path d="M0,15 L25,-2 L25,12 L0,30 Z" fill="hsl(var(--primary))" />
          <path
            d="M0,-2 L-20,-15 L0,-28 L20,-15 Z"
            fill="white"
            fillOpacity="0.8"
          />
          <path
            d="M-20,-15 L0,-2 L0,8 L-20,-5 Z"
            fill="hsl(var(--accent))"
            fillOpacity="0.4"
          />
          <path d="M0,-2 L20,-15 L20,-5 L0,8 Z" fill="hsl(var(--accent))" />
        </g>
      </defs>

      {/* Global Translate to Center */}
      <g transform="translate(500, 400)">
        {/* INBOUND TRACK (Left -> Center) */}
        {/* Using isometric angles (approx 30 deg). Moving from top-left to center-down */}
        {/* Vector: [-2, -1] is up-left. [2, 1] is down-right (iso-x axis). */}
        <g className="track">
          {/* Main conveyor belt incoming */}
          <path
            d="M-100,-50 L-400,-200 L-450,-175 L-150,-25 Z"
            fill="url(#track-grad-in)"
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity="0.3"
            strokeWidth="1"
          />
          {/* Support legs */}
          <path
            d="M-200,-100 L-200,50 L-180,60 L-180,-90 Z"
            fill="hsl(var(--muted-foreground))"
            fillOpacity="0.2"
          />
          <path
            d="M-350,-175 L-350,-25 L-330,-15 L-330,-165 Z"
            fill="hsl(var(--muted-foreground))"
            fillOpacity="0.2"
          />
        </g>

        {/* OUTBOUND TRACK (Center -> Right) */}
        <g className="track">
          {/* Main conveyor belt outgoing */}
          <path
            d="M50,25 L350,175 L300,200 L0,50 Z"
            fill="url(#track-grad-out)"
            stroke="hsl(var(--accent))"
            strokeOpacity="0.5"
            strokeWidth="2"
          />
          {/* Support legs */}
          <path
            d="M150,75 L150,225 L170,235 L170,85 Z"
            fill="hsl(var(--muted-foreground))"
            fillOpacity="0.2"
          />
          <path
            d="M300,150 L300,300 L320,310 L320,160 Z"
            fill="hsl(var(--muted-foreground))"
            fillOpacity="0.2"
          />
        </g>

        {/* --- INCOMING RAW DATA ELEMENTS --- */}
        {/* GSAP will animate their transform: translate values */}
        <g className="raw-data">
          <use href="#raw-item" />
        </g>
        <g className="raw-data">
          <use href="#raw-item" />
          <circle cx="10" cy="-30" r="3" fill="hsl(var(--accent))" />
        </g>
        <g className="raw-data">
          <use href="#raw-item" />
        </g>
        <g className="raw-data">
          <use href="#raw-item" transform="scale(1.2)" />
        </g>

        {/* --- REFINED OUTGOING DATA ELEMENTS --- */}
        <g className="refined-data">
          <use href="#refined-item" />
        </g>
        <g className="refined-data">
          <use href="#refined-item" />
        </g>
        <g className="refined-data">
          <use href="#refined-item" />
        </g>

        {/* --- CENTRAL PROCESSOR MACHINE --- */}
        {/* Back walls of the machine */}
        <g className="machine-part">
          <path
            d="M0,-100 L-100,-50 L-100,80 L0,130 Z"
            fill="url(#machine-grad)"
            fillOpacity="0.9"
          />
          <path
            d="M0,-100 L100,-50 L100,80 L0,130 Z"
            fill="url(#machine-grad)"
            fillOpacity="0.6"
          />
          <path
            d="M0,130 L-100,80 L0,30 L100,80 Z"
            fill="hsl(var(--background))"
          />
        </g>

        {/* Input Port (Left side) */}
        <path
          className="machine-part"
          d="M-60,-30 L-100,-50 L-100,-10 L-60,10 Z"
          fill="#111"
        />

        {/* Output Port (Right side) */}
        <path
          className="machine-part"
          d="M60,-30 L100,-50 L100,-10 L60,10 Z"
          fill="#111"
        />

        {/* Front Core / Window showing processing */}
        <g className="machine-part">
          <path d="M0,-50 L-50,-25 L0,0 L50,-25 Z" fill="white" />
          <path
            d="M-50,-25 L0,0 L0,50 L-50,25 Z"
            fill="black"
            fillOpacity="0.8"
          />
          <path
            d="M0,0 L50,-25 L50,25 L0,50 Z"
            fill="black"
            fillOpacity="0.6"
          />

          {/* Glowing Core Inside */}
          <path
            className="processing-core"
            d="M0,-20 L-20,-10 L0,0 L20,-10 Z"
            fill="hsl(var(--accent))"
          />
          <ellipse
            className="processing-core"
            cx="0"
            cy="15"
            rx="15"
            ry="7.5"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="3"
          />
        </g>

        {/* Roof / Top structure */}
        <g className="machine-part">
          <path
            d="M0,-150 L-100,-100 L0,-50 L100,-100 Z"
            fill="url(#machine-grad)"
          />
          {/* Satellite / Antenna */}
          <path
            d="M0,-100 L0,-180"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="4"
          />
          <circle
            cx="0"
            cy="-180"
            r="8"
            fill="hsl(var(--destructive))"
            className="processing-light"
          />
          <circle cx="0" cy="-100" r="15" fill="hsl(var(--primary))" />
          <path
            d="M-20,-110 L0,-120 L20,-110 L0,-100 Z"
            fill="white"
            fillOpacity="0.5"
          />
        </g>

        {/* Panel Lights */}
        <circle
          cx="-50"
          cy="50"
          r="3"
          fill="hsl(var(--destructive))"
          className="processing-light"
        />
        <circle
          cx="-35"
          cy="60"
          r="3"
          fill="#10b981"
          className="processing-light"
        />
        <circle
          cx="-20"
          cy="70"
          r="3"
          fill="hsl(var(--accent))"
          className="processing-light"
        />
        <circle
          cx="20"
          cy="70"
          r="3"
          fill="#10b981"
          className="processing-light"
        />
        <circle
          cx="35"
          cy="60"
          r="3"
          fill="hsl(var(--accent))"
          className="processing-light"
        />
      </g>
    </svg>
  );
}
