import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col selection:bg-primary/30">
      <Navbar />
      <main className="flex-1 w-full flex flex-col pt-16">{children}</main>
      <Footer />
    </div>
  );
}
