"use client";

import { SleekBackground } from "@/components/landing/SleekBackground";
import { Shield, Lock, EyeOff, Database, Server, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";

interface PrivacyContentProps {
    siteName: string;
}

export default function PrivacyContent({ siteName }: PrivacyContentProps) {
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
                            <Shield className="h-3 w-3" />
                            <span>Trust & Security</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8">
                            Privacy Policy
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium">
                            At {siteName}, your privacy is not an afterthought—it's a foundational principle.
                            We believe your data belongs to you. We do not sell it, rent it, or trade it.
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
                                Navigation
                            </h3>
                            <nav className="flex flex-col gap-4">
                                {[
                                    { id: "collection", label: "Data Collection", icon: Database },
                                    { id: "usage", label: "How We Use Data", icon: EyeOff },
                                    { id: "security", label: "Security Practices", icon: Lock },
                                    { id: "infrastructure", label: "Infrastructure", icon: Server },
                                    { id: "updates", label: "Policy Updates", icon: RefreshCw },
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
                                <p className="text-xs font-bold text-primary leading-relaxed uppercase tracking-wider">
                                    Our promise: Your reading habits are never monetized. Period.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Body */}
                    <div className="md:col-span-8 space-y-16">
                        {[
                            {
                                id: "collection",
                                step: 1,
                                title: "Data Collection",
                                content: (
                                    <>
                                        <p>
                                            We only collect the absolute minimum amount of information necessary to provide you with an exceptional reading and interaction experience on our platform.
                                        </p>
                                        <ul className="space-y-3">
                                            <li><strong className="text-foreground">Account Information:</strong> If you choose to create an account, we collect your name, email address, and authentication credentials.</li>
                                            <li><strong className="text-foreground">Usage Data:</strong> We monitor aggregated performance metrics and platform stability to ensure fast loading times.</li>
                                            <li><strong className="text-foreground">Cookies:</strong> We use essential cookies to maintain your login session and remember your core preferences.</li>
                                        </ul>
                                    </>
                                )
                            },
                            {
                                id: "usage",
                                step: 2,
                                title: "How We Use Data",
                                content: (
                                    <>
                                        <p className="mb-8">
                                            <strong className="text-primary font-bold">We do not sell user data under any circumstances.</strong> Every piece of data we collect is utilized strictly for service delivery and optimization.
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {[
                                                { title: "Service Delivery", desc: "Authorizing access, delivering content, and saving your preferences." },
                                                { title: "Platform Improvement", desc: "Identifying bugs, optimizing databases, and ensuring performance." },
                                                { title: "Communication", desc: "Sending security alerts, platform updates, and instructions." },
                                                { title: "Compliance", desc: "Protecting against malicious activity and unauthorized access." },
                                            ].map((box) => (
                                                <div key={box.title} className="p-6 rounded-2xl border border-white/5 bg-background/30 backdrop-blur-xl group hover:border-primary/30 transition-colors">
                                                    <h4 className="font-bold text-foreground mb-2">{box.title}</h4>
                                                    <p className="text-sm m-0 leading-relaxed text-muted-foreground">{box.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )
                            },
                            {
                                id: "security",
                                step: 3,
                                title: "Security Practices",
                                content: (
                                    <p>
                                        We implement robust, industry-standard security protocols to safeguard your information.
                                        All data transmitted between your browser and our servers is secured using modern TLS encryption. Sensitive credentials, such as passwords, are heavily hashed and salted using industry-best algorithms.
                                    </p>
                                )
                            },
                            {
                                id: "infrastructure",
                                step: 4,
                                title: "Infrastructure",
                                content: (
                                    <p>
                                        To provide our services reliably on a global scale, we utilize trusted cloud infrastructure providers. 
                                        These providers act solely as data processors and are strictly prohibited from mining or utilizing your data for any independent commercial purpose.
                                    </p>
                                )
                            },
                            {
                                id: "updates",
                                step: 5,
                                title: "Policy Updates",
                                content: (
                                    <>
                                        <p>
                                            As {siteName} evolves, we may periodically update this Privacy Policy. Rest assured, our core commitment to not selling your data will never change.
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
                                <div className="prose prose-invert max-w-none text-muted-foreground text-lg leading-relaxed">
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
