import * as React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-foreground px-4 py-12 selection:bg-primary/20 selection:text-primary">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[200px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand header */}
      <div className="relative z-10 mb-8 flex flex-col items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-2.5 group transition-transform duration-150 active:scale-95"
        >
          <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            <Compass className="size-5 text-white stroke-[2]" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            Meridian
          </span>
        </Link>
        <p className="text-xs text-muted-foreground font-normal">
          The fixed point your team&apos;s work revolves around
        </p>
      </div>

      {/* Auth Card Content */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} Meridian. Engineered for high-velocity teams.
      </div>
    </div>
  );
}
