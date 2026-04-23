import { Zap, FlaskConical } from "lucide-react";
import { motion } from "framer-motion";
import { CountUpValue } from "@/components/dashboard/CountUpValue";

export function ElectrolyzerCard({ efficiency, rate, running }: { efficiency: number; rate: number; running: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 }}
      className="glass-card glass-card-hover p-5 micro-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hydrogen Production Unit</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Electrolyzer · PEM Stack</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          running
            ? "bg-[color-mix(in_oklab,var(--neon-green)_15%,transparent)] text-[var(--neon-green)] border border-[color-mix(in_oklab,var(--neon-green)_40%,transparent)]"
            : "bg-muted text-muted-foreground border border-border"
        }`}>
          <span className={`size-1.5 rounded-full ${running ? "bg-[var(--neon-green)] animate-pulse-glow" : "bg-muted-foreground"}`} />
          {running ? "Running" : "Idle"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-muted/40 p-3 border border-border">
          <p className="text-[11px] uppercase text-muted-foreground tracking-wider">Efficiency</p>
          <p className="font-mono-data text-2xl font-bold text-glow-cyan tabular-nums"><CountUpValue value={efficiency} suffix="%" /></p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3 border border-border">
          <p className="text-[11px] uppercase text-muted-foreground tracking-wider">Production</p>
          <p className="font-mono-data text-2xl font-bold text-glow-green tabular-nums"><CountUpValue value={rate} /><span className="text-xs font-normal text-muted-foreground"> kg/hr</span></p>
        </div>
      </div>

      {/* Animated flow: energy -> hydrogen */}
      <div className="relative rounded-xl bg-background/50 border border-border p-3 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg grid place-items-center bg-[color-mix(in_oklab,var(--neon-yellow)_18%,transparent)] text-[var(--neon-yellow)]">
              <Zap className="size-4" />
            </div>
            <span className="text-xs font-medium">Energy</span>
          </div>

          <div className="relative flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-flow rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, var(--neon-cyan), transparent)" }} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">H₂</span>
            <div className="size-8 rounded-lg grid place-items-center bg-[color-mix(in_oklab,var(--neon-green)_18%,transparent)] text-[var(--neon-green)]">
              <FlaskConical className="size-4" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
