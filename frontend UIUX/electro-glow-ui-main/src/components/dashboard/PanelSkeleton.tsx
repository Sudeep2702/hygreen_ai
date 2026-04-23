export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 h-4 w-40 rounded bg-white/8 animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-white/6 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
