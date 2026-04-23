type ModelConfidenceBadgeProps = {
  confidence: number;
};

export function ModelConfidenceBadge({ confidence }: ModelConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-[color-mix(in_oklab,var(--color-accent)_20%,transparent)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
      Model Confidence {pct}%
    </span>
  );
}
