"use client";

import { SleekBackground } from "@/components/landing/SleekBackground";
import { Scale, FileText, AlertTriangle, Activity, Settings, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";

interface TermsContentProps {
    siteName: string;
}

export default function TermsContent({ siteName }: TermsContentProps) {
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
                            <Scale className="h-3 w-3" />
                            <span>Legal Agreement</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8">
                            Terms of Service
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium">
                            These terms govern your access to and use of {siteName}.
                            By using our services, you agree to these transparent, fair-use guidelines designed
                            to keep our community safe and our platform reliable.
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
                                    { id: "acceptance", label: "Acceptance of Terms", icon: UserCheck },
                                    { id: "license", label: "Use License", icon: FileText },
                                    { id: "conduct", label: "User Conduct", icon: AlertTriangle },
                                    { id: "availability", label: "Service Availability", icon: Activity },
                                    { id: "modifications", label: "Modifications", icon: Settings },
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
                                    This agreement establishes your legal rights and obligations while using the platform.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Body */}
                    <div className="md:col-span-8 space-y-16">
                        {[
                            {
                                id: "acceptance",
                                step: 1,
                                title: "Acceptance of Terms",
                                content: (
                                    <p>
                                        By accessing, browsing, or utilizing the {siteName} platform in any capacity, you acknowledge that you have read, understood, and proactively agree to be bound by these Terms of Service.
                                        If you do not agree with any provision stated herein, you are expressly prohibited from using our services.
                                    </p>
                                )
                            },
                            {
                                id: "license",
                                step: 2,
                                title: "Use License",
                                content: (
                                    <>
                                        <p>
                                            We grant you a personal, worldwide, royalty-free, and non-exclusive license to use the software provided to you as part of the services.
                                        </p>
                                        <ul className="mt-6 space-y-3">
                                            <li>You may not copy, modify, distribute, sell, or lease any part of our services or included software.</li>
                                            <li>You may not reverse engineer or attempt to extract the source code of our software architecture.</li>
                                        </ul>
                                    </>
                                )
                            },
                            {
                                id: "conduct",
                                step: 3,
                                title: "User Conduct & Content",
                                content: (
                                    <>
                                        <p className="mb-8">
                                            We strive to maintain a safe, respectful, and legally compliant environment for all users reading and interacting with content on {siteName}.
                                        </p>
                                        <div className="p-8 rounded-[2rem] border border-destructive/20 bg-destructive/5 group/warn hover:bg-destructive/10 transition-colors">
                                            <h4 className="font-bold text-destructive mb-4 flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4" /> Prohibited Activities
                                            </h4>
                                            <ul className="text-sm text-muted-foreground m-0 space-y-3 font-medium">
                                                <li>Engaging in illegal activities or promoting dangerous acts.</li>
                                                <li>Utilizing automated scripts or bots to extract data (scraping) without explicit API access.</li>
                                                <li>Attempting to probe, scan, or test the vulnerability of any system or network.</li>
                                                <li>Interfering with, or disrupting, the access of any user, host, or network.</li>
                                            </ul>
                                        </div>
                                    </>
                                )
                            },
                            {
                                id: "availability",
                                step: 4,
                                title: "Service Availability & Liability",
                                content: (
                                    <p>
                                        While our engineering team works diligently to ensure 99.9% uptime, the {siteName} platform and its associated services are securely provided on an "as is" and "as available" basis.
                                        {siteName} shall not be liable for any indirect, incidental, special, or consequential damages resulting from your access to or use of the services.
                                    </p>
                                )
                            },
                            {
                                id: "modifications",
                                step: 5,
                                title: "Modifications to Terms",
                                content: (
                                    <>
                                        <p>
                                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
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
