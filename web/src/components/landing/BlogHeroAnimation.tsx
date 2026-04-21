"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Shield, Zap, Globe, Cpu, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const cards = [
    { icon: Globe, label: "Global Presence", color: "text-blue-500", pos: "top-10 left-10", delay: 0 },
    { icon: Shield, label: "Verified Data", color: "text-emerald-500", pos: "top-40 right-10", delay: 0.2 },
    { icon: Cpu, label: "Deep Insights", color: "text-purple-500", pos: "bottom-10 left-20", delay: 0.4 },
    { icon: Search, label: "Precise Research", color: "text-amber-500", pos: "bottom-32 right-12", delay: 0.6 },
];

export function BlogHeroAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse tracking with springs for smoothness
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 20, stiffness: 100 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    // Transform mouse coordinates to rotation
    // Assuming a container size of roughly 500x500
    const rotateX = useTransform(springY, [-250, 250], [10, -10]);
    const rotateY = useTransform(springX, [-250, 250], [-10, 10]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full h-full flex items-center justify-center [perspective:1200px] cursor-crosshair group/stage"
        >
            {/* 3D Stage Wrap */}
            <motion.div
                style={{ rotateX, rotateY }}
                className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]"
            >
                {/* Central Core */}
                <motion.div
                    className="relative z-20 w-48 h-48 flex items-center justify-center"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    {/* Inner Glowing Core */}
                    <div className="absolute inset-0 bg-primary/20 blur-[60px] animate-pulse" />
                    <motion.div
                        className="relative w-32 h-32 rounded-full border-4 border-primary/40 bg-background/50 backdrop-blur-3xl flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary),0.3)] overflow-hidden"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-accent/20" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Zap className="size-12 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),1)]" />
                        </motion.div>
                    </motion.div>

                    {/* Orbital Rings - 3D Tilted */}
                    {[0, 45, 90, 135].map((angle, i) => (
                        <motion.div
                            key={angle}
                            className="absolute border border-primary/10 rounded-full"
                            style={{
                                width: `${320 + i * 45}px`,
                                height: `${320 + i * 45}px`,
                                rotateX: 75,
                                rotateY: angle,
                            }}
                            animate={{ rotateZ: 360 }}
                            transition={{ duration: 18 + i * 6, repeat: Infinity, ease: "linear" }}
                        />
                    ))}
                </motion.div>

                {/* Floating 3D Cards */}
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        className={cn(
                            "absolute z-30 p-5 rounded-[2rem] border border-white/10 bg-background/40 backdrop-blur-2xl shadow-2xl flex items-center gap-4 transition-colors hover:bg-background/80 hover:border-primary/50 cursor-pointer",
                            card.pos
                        )}
                        initial={{ opacity: 0, z: -100, rotateY: 20 }}
                        animate={{
                            opacity: 1,
                            z: 0,
                            rotateY: 0,
                            y: [0, -20, 0],
                        }}
                        whileHover={{
                            scale: 1.1,
                            z: 80,
                            rotateX: 10,
                            transition: { duration: 0.3 }
                        }}
                        transition={{
                            opacity: { duration: 0.8, delay: card.delay },
                            z: { duration: 0.8, delay: card.delay },
                            y: { duration: 5 + i, delay: card.delay, repeat: Infinity, ease: "easeInOut" },
                        }}
                    >
                        <div className={cn("p-3 rounded-2xl bg-white/5 shadow-inner", card.color)}>
                            <card.icon className="size-7" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Node 0{i + 1}</span>
                            <span className="text-lg font-black tracking-tight whitespace-nowrap">{card.label}</span>
                        </div>

                        {/* Glow Effect on Card Hover */}
                        <div className="absolute inset-0 rounded-[2rem] bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                ))}

                {/* Particles Source */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 [transform:translateZ(-50px)]">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.circle
                            key={i}
                            r="1.5"
                            fill="hsl(var(--primary))"
                            initial={{ opacity: 0 }}
                            animate={{
                                cx: ["50%", `${Math.random() * 100}%`],
                                cy: ["50%", `${Math.random() * 100}%`],
                                opacity: [0, 0.8, 0],
                                scale: [0, 1.2, 0],
                            }}
                            transition={{
                                duration: 4 + Math.random() * 5,
                                repeat: Infinity,
                                delay: Math.random() * 8,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </svg>
            </motion.div>

            {/* Scanning Beam */}
            <motion.div
                className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent z-40"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />

            {/* Decorative Corner Elements */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/20" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/20" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/20" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/20" />
        </div>
    );
}
