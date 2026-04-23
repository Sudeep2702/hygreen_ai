import { Sun, Wind, Droplets, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { CountUpValue } from "@/components/dashboard/CountUpValue";

type Source = { key: "solar" | "wind" | "hydro"; label: string; value: number };

const META: Record<Source["key"], { Icon: LucideIcon; color: string; emoji: string }> = {
  solar: { Icon: Sun, color: "var(--neon-yellow)", emoji: "☀️" },
  wind: { Icon: Wind, color: "var(--neon-blue)", emoji: "🌬️" },
  hydro: { Icon: Droplets, color: "var(--neon-teal)", emoji: "💧" },
};

export function EnergyCard({ sources }: { sources: Source[] }) {
  const total = sources.reduce((s, x) => s + x.value, 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-card glass-card-hover p-5 micro-hover"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Energy Input</h2>
          <p className="font-mono-data text-2xl font-bold mt-1"><CountUpValue value={total} /> <span className="text-sm font-normal text-muted-foreground">kW total</span></p>
        </div>
        <span className="text-xs px-2 py-1 rounded-md bg-[color-mix(in_oklab,var(--neon-green)_12%,transparent)] text-[var(--neon-green)]">Renewable</span>
      </div>

      <div className="space-y-4">
        {sources.map(s => {
          const m = META[s.key];
          const pct = Math.min(100, (s.value / 150) * 100);
          return (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="size-7 rounded-lg grid place-items-center"
                    style={{ background: `color-mix(in oklab, ${m.color} 18%, transparent)`, color: m.color }}
                  >
                    <m.Icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                <span className="font-mono-data text-sm font-bold tabular-nums" style={{ color: m.color }}>
                  <CountUpValue value={s.value} /> kW
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${m.color}, color-mix(in oklab, ${m.color} 60%, white))`,
                    boxShadow: `0 0 12px ${m.color}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
