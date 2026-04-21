"use client";

import { SleekBackground } from "@/components/landing/SleekBackground";
import { motion } from "framer-motion";
import { GraduationCap, ShieldCheck, Zap } from "lucide-react";
import { CTAManager } from "@/components/banner/CTAManager";

interface AboutContentProps {
  siteName: string;
}

export default function AboutContent({ siteName }: AboutContentProps) {
  return (
    <SleekBackground>
      <div className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden border-b border-white/5">
        <div className="container relative z-10 px-4 md:px-6 mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-6"
            >
              <GraduationCap className="size-3" />
              <span>Our Mission</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-5xl md:text-7xl font-black tracking-tight mb-8"
            >
              About {siteName}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium"
            >
              A modern content platform delivering insightful stories, analysis, 
              and curated collections for the intellectually curious.
            </motion.p>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-16 lg:py-24 mx-auto max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="rounded-[2.5rem] border border-white/5 bg-background/50 p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h2 className="text-3xl font-bold mb-6 relative z-10">The Core Promise</h2>
              <p className="text-lg text-muted-foreground leading-relaxed relative z-10">
                {siteName} is built for readers who value depth, context, and clarity.
                We bring together quality content, expert perspectives, and a seamless
                reading experience — all in one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl border border-white/5 bg-background/30 backdrop-blur-xl">
                 <ShieldCheck className="size-8 text-primary mb-4" />
                 <h3 className="font-bold mb-2">Verified Data</h3>
                 <p className="text-sm text-muted-foreground">Checked against global reputed sources.</p>
              </div>
              <div className="p-6 rounded-3xl border border-white/5 bg-background/30 backdrop-blur-xl">
                 <Zap className="size-8 text-primary mb-4" />
                 <h3 className="font-bold mb-2">Instant Insight</h3>
                 <p className="text-sm text-muted-foreground">Deep dives made for rapid consumption.</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-[3rem] border border-white/5 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/15 aspect-square relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-20 group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute inset-0 flex items-center justify-center p-12 text-center text-2xl font-black italic tracking-tighter opacity-70">
               "Decoding India, one dimension at a time."
            </div>
            {/* Added decorative ring */}
            <div className="absolute inset-0 border-[20px] border-white/5 rounded-full scale-75 animate-pulse" />
          </motion.div>
        </div>
      </div>
      
      <div className="pb-16">
        <CTAManager slot="about-bottom" />
      </div>
    </SleekBackground>
  );
}
