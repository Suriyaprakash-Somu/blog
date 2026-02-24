"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export function LandingNewsletter() {
  return (
    <section className="border-t bg-muted/30 py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[800px] flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="w-full rounded-3xl bg-background p-8 shadow-sm border md:p-12 lg:p-16 relative overflow-hidden"
          >
            {/* Background decors */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Stay Ahead in Your Research
              </h2>
              <p className="text-muted-foreground md:text-lg leading-relaxed">
                Join 15,000+ researchers and students. Get our weekly digest
                containing deep-dive articles, new historical findings, and
                comprehensive market analysis directly in your inbox.
              </p>

              <form
                className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="relative flex-1">
                  <Input
                    type="email"
                    placeholder="Enter your academic or personal email"
                    className="h-12 w-full rounded-xl bg-muted/50 pl-4 pr-12 focus-visible:ring-primary"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 rounded-xl px-8 shadow-sm"
                >
                  Subscribe
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
