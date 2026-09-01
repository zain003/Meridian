export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="relative flex flex-col items-center max-w-xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium tracking-wide uppercase rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Meridian Project Hub
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
          let&apos;s begin
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-md leading-relaxed">
          The fixed point your team&apos;s work revolves around. High-velocity project management and deterministic automation.
        </p>
      </div>
    </main>
  );
}
