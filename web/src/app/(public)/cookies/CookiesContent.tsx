"use client";

import { SleekBackground } from "@/components/landing/SleekBackground";
import { Cookie, Shield, BarChart, Settings, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";

interface CookiesContentProps {
    siteName: string;
}

export default function CookiesContent({ siteName }: CookiesContentProps) {
    return (
        <SleekBackground>
            {/* Hero Section */}
            <div className="relative overflow-hidden border-b border-white/5">
                <div className="container relative mx-auto px-4 py-20 md:py-32 max-w-7xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-3xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary mb-6 text-xs font-bold uppercase tracking-widest">
                            <Cookie className="h-3 w-3" />
                            <span>Transparency & Control</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8">
                            Cookie Policy
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium">
                            We use cookies transparently—not to track you across the internet, but simply to keep you logged in, remember your theme preferences, and ensure {siteName} runs smoothly.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-16 lg:py-24 max-w-7xl">
                <div className="grid md:grid-cols-12 gap-12">
                    {/* Table of Contents - Desktop */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="hidden md:block md:col-span-4"
                    >
                        <div className="sticky top-24 p-8 rounded-[2rem] border border-white/5 bg-background/40 backdrop-blur-2xl">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">
                                Chapters
                            </h3>
                            <nav className="flex flex-col gap-4">
                                {[
                                    { id: "what-are-cookies", label: "What Are Cookies?", icon: Cookie },
                                    { id: "how-we-use", label: "How We Use Them", icon: BarChart },
                                    { id: "managing", label: "Managing Cookies", icon: Settings },
                                    { id: "third-party", label: "Third-Party Providers", icon: Shield },
                                ].map((item) => (
                                    <a 
                                        key={item.id}
                                        href={`#${item.id}`} 
                                        className="group text-sm font-bold text-muted-foreground hover:text-primary transition-all flex items-center gap-3"
                                    >
                                        <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" /> 
                                        {item.label}
                                    </a>
                                ))}
                            </nav>

                            <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                                <p className="text-xs font-bold text-primary flex items-center gap-3 leading-relaxed">
                                    <Smartphone className="h-4 w-4 shrink-0" />
                                    Essential cookies are required for platform security and authentication.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Body */}
                    <div className="md:col-span-8 space-y-16">
                        {[
                            {
                                id: "what-are-cookies",
                                step: 1,
                                title: "What Are Cookies?",
                                content: (
                                    <p>
                                        Cookies are small text files automatically stored on your browser or device by websites you visit. They serve crucial functions, primarily helping the website remember your device over time, saving you the hassle of logging in repeatedly or resetting your preferences.
                                    </p>
                                )
                            },
                            {
                                id: "how-we-use",
                                step: 2,
                                title: "How We Use Cookies",
                                content: (
                                    <>
                                        <p className="mb-8 font-medium">
                                            Unlike platforms that rely on targeted advertising, our use of cookies is fundamentally aligned with providing you a better, faster, and more secure reading experience.
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {[
                                                { icon: Shield, title: "Essential Security", desc: "Issuing secure tokens to keep you authenticated and protect against CSRF attacks." },
                                                { icon: Settings, title: "Preferences", desc: "Remembering UI choices like Dark Mode so your experience remains consistent." },
                                                { icon: BarChart, title: "Aggregated Analytics", desc: "Privacy-respecting metrics to measure content engagement without individual tracking.", full: true },
                                            ].map((box) => (
                                                <div key={box.title} className={`p-6 rounded-3xl border border-white/5 bg-background/30 backdrop-blur-xl group hover:border-primary/30 transition-colors ${box.full ? 'sm:col-span-2' : ''}`}>
                                                    <box.icon className="h-8 w-8 text-primary mb-4" />
                                                    <h4 className="font-bold text-foreground mb-2">{box.title}</h4>
                                                    <p className="text-sm m-0 leading-relaxed text-muted-foreground">{box.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )
                            },
                            {
                                id: "managing",
                                step: 3,
                                title: "Managing Cookies",
                                content: (
                                    <p>
                                        You retain ultimate control over your browser. You can configure your browser settings to refuse some or all cookies. 
                                        However, disabling essential cookies will break core functionality like logging in or participating in discussions.
                                    </p>
                                )
                            },
                            {
                                id: "third-party",
                                step: 4,
                                title: "Third-Party Providers",
                                content: (
                                    <>
                                        <p>
                                            To deliver {siteName} at scale, we occasionally integrate with infrastructure partners. 
                                            We categorically do not permit our service providers to resell your analytical data or inject cross-site trackers on our platform.
                                        </p>
                                        <div className="mt-12 pt-8 border-t border-white/5 font-bold text-xs uppercase tracking-widest text-primary">
                                            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </>
                                )
                            }
                        ].map((section) => (
                            <motion.section 
                                key={section.id}
                                id={section.id} 
                                role="article"
                                aria-label={section.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                className="scroll-mt-24 p-10 rounded-[2.5rem] border border-white/5 bg-background/40 backdrop-blur-2xl group hover:bg-background/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                                        {section.step}
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tight group-hover:text-primary transition-colors">
                                        {section.title}
                                    </h2>
                                </div>
                                <div className="prose prose-invert max-w-none text-muted-foreground text-lg leading-relaxed font-medium">
                                    {section.content}
                                </div>
                            </motion.section>
                        ))}
                    </div>
                </div>
            </div>
        </SleekBackground>
    );
}
