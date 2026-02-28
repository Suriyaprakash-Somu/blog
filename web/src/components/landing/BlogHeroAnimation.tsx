"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

export function BlogHeroAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);

    // Outer orbit nodes representing news sources
    const sourceNodes = [
        { x: 10, y: 30, color: "hsl(var(--primary))", delay: 0, floatDuration: 4.5, floatDelay: 0.2 },
        { x: 85, y: 15, color: "hsl(var(--accent))", delay: 0.5, floatDuration: 5.2, floatDelay: 0.5 },
        { x: 90, y: 75, color: "hsl(var(--destructive))", delay: 1, floatDuration: 4.8, floatDelay: 1.2 },
        { x: 20, y: 85, color: "#10b981", delay: 1.5, floatDuration: 5.5, floatDelay: 0.8 },
        { x: 5, y: 60, color: "hsl(var(--secondary-foreground))", delay: 2, floatDuration: 4.2, floatDelay: 1.5 },
    ];

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-square max-w-[500px] flex items-center justify-center p-8"
            aria-hidden="true"
        >
            {/* Central Hub representing the Blog/Portal */}
            <motion.div
                className="relative z-20 w-32 h-32 rounded-3xl border border-border/80 dark:border-border bg-background/90 dark:bg-muted/30 backdrop-blur-xl shadow-2xl flex items-center justify-center overflow-hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 dark:from-primary/10 dark:to-accent/10" />

                {/* Pulsing inner core */}
                <motion.div
                    className="absolute z-10 w-20 h-24 rounded-xl bg-background/80 dark:bg-background/40 flex flex-col items-start justify-center p-3 gap-1.5 shadow-inner border border-border/60"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    {Array.from({ length: 10 }).map((_, i) => {
                        const node = sourceNodes[i % sourceNodes.length];
                        if (!node) return null;

                        // Add some randomness to the width to look like different length text lines
                        const widthClass = i % 3 === 0 ? "w-[80%]" : i % 2 === 0 ? "w-[60%]" : "w-full";
                        return (
                            <motion.div
                                key={`hub-line-${i}`}
                                className={`h-1.5 rounded-full ${widthClass} origin-left mix-blend-normal dark:mix-blend-screen brightness-110`}
                                style={{ backgroundColor: node.color }}
                                animate={{
                                    scaleX: [0.1, 1, 1, 0.1],
                                    opacity: [0.4, 1, 1, 0]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: node.delay + (i * 0.15), // offset slightly
                                    ease: "easeInOut"
                                }}
                            />
                        );
                    })}
                </motion.div>

                {/* Glowing ring */}
                <motion.div
                    className="absolute inset-0 border-2 border-primary/40 dark:border-primary/50 rounded-3xl z-20 mix-blend-normal dark:mix-blend-screen"
                    animate={{ rotate: 360, scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>

            {/* Connection Lines from Sources to Center */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {sourceNodes.map((node, i) => (
                    <motion.g
                        key={`connection-${i}`}
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                            duration: node.floatDuration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: node.floatDelay
                        }}
                    >
                        {/* Base line */}
                        <motion.line
                            x1={`${node.x}%`}
                            y1={`${node.y}%`}
                            x2="50%"
                            y2="50%"
                            className="stroke-muted-foreground/30"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, delay: 0.5 + Math.random() }}
                        />
                        {/* Standard SVG line data packet */}
                        <motion.circle
                            cx="50%"
                            cy="50%"
                            r="3"
                            fill={node.color}
                            filter="url(#glow)"
                            initial={{ opacity: 0 }}
                            animate={{
                                cx: [`${node.x}%`, "50%"],
                                cy: [`${node.y}%`, "50%"],
                                opacity: [0, 1, 1, 0],
                                scale: [0.5, 1.2, 0.5]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: node.delay,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.g>
                ))}
            </svg>

            {/* Floating Source Nodes */}
            {sourceNodes.map((node, i) => (
                <motion.div
                    key={`node-${i}`}
                    className="absolute z-30 flex items-center gap-2"
                    style={{
                        left: `${node.x}%`,
                        top: `${node.y}%`,
                    }}
                    initial={{ scale: 0, opacity: 0, x: "-50%", y: "-50%" }}
                    animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.1, type: "spring" }}
                >
                    <motion.div
                        className="w-10 h-10 rounded-xl border border-border/80 dark:border-border bg-background/90 dark:bg-muted/50 backdrop-blur-md shadow-lg flex items-center justify-center relative overflow-hidden group"
                        animate={{
                            y: [0, -6, 0],
                            rotate: [0, 2, -2, 0]
                        }}
                        transition={{
                            duration: node.floatDuration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: node.floatDelay
                        }}
                    >
                        {/* Little article/news lines inside the node */}
                        <div className="flex flex-col gap-1 w-5">
                            <div className="h-[2px] rounded-full w-full opacity-60 dark:opacity-80 dark:mix-blend-screen" style={{ backgroundColor: node.color }} />
                            <div className="h-[2px] rounded-full w-[70%] opacity-40 dark:opacity-60 mix-blend-normal dark:mix-blend-screen bg-foreground dark:bg-white" />
                            <div className="h-[2px] rounded-full w-[80%] opacity-40 dark:opacity-60 mix-blend-normal dark:mix-blend-screen bg-foreground dark:bg-white" />
                        </div>

                        <div
                            className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                            style={{ background: `radial-gradient(circle at center, ${node.color}, transparent)` }}
                        />
                    </motion.div>
                </motion.div>
            ))}

            {/* Decorative background grid and rings */}
            <div className="absolute inset-0 border border-border/10 dark:border-border/20 rounded-full scale-[1.2] opacity-20 dark:opacity-40 pointer-events-none" />
            <div className="absolute inset-0 border border-border/10 dark:border-border/20 rounded-full scale-[0.8] opacity-30 dark:opacity-50 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.primary.DEFAULT/0.05)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,theme(colors.primary.DEFAULT/0.1)_0%,transparent_70%)] pointer-events-none" />
        </div>
    );
}
