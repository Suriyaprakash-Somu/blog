"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(errorData.message || res.statusText);
    } catch {
      throw new Error(res.statusText);
    }
  }

  return res.json();
}

export function LandingNewsletter() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      const res = await fetchJson<{ success: boolean; message: string }>("/api/public/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (res.success) {
        toast.success("You're on the list!", {
          description: "Our newsletter is launching soon. We'll be in touch.",
        });
        setEmail("");
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      toast.error("Subscription failed", {
        description: "Something went wrong. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <section className="py-12 lg:py-16 relative overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full rounded-[3rem] bg-background/50 backdrop-blur-3xl p-10 shadow-2xl border border-white/10 md:p-16 lg:p-20 relative overflow-hidden group"
          >
            {/* Background decors */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none transition-transform group-hover:scale-110 duration-700" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-secondary/10 blur-[100px] pointer-events-none transition-transform group-hover:scale-110 duration-700" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <div className="space-y-4">
                 <h2 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl text-foreground">
                  Stay <span className="text-primary italic">Ahead</span>
                </h2>
                <p className="text-muted-foreground text-lg md:text-xl leading-relaxed font-medium">
                  Join 15,000+ researchers and students. Get our weekly digest
                  containing deep-dive articles and new historical findings.
                </p>
              </div>

              <form
                className="mx-auto mt-10 flex max-w-lg flex-col gap-4 sm:flex-row"
                onSubmit={handleSubscribe}
              >
                <div className="relative flex-1">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="h-14 w-full rounded-full bg-muted/30 border-2 border-transparent focus:border-primary/50 px-8 text-lg font-medium transition-all"
                    required
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 rounded-full px-10 text-lg font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Wait
                    </>
                  ) : (
                    <>
                      Subscribe
                      <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60 font-medium pt-4">
                <span className="h-1 w-1 rounded-full bg-primary" />
                No spam. Unsubscribe anytime.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
