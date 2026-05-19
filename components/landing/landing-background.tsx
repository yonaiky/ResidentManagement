export function LandingBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0a12] text-slate-100">
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-full -translate-x-1/2 bg-gradient-to-t from-violet-950/30 to-transparent" />
      {children}
    </div>
  );
}
