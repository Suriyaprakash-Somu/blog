import Link from "next/link";
import { ThemeSwitch } from "@/components/theme-switch";

export function PublicHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Livestock Manager
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
