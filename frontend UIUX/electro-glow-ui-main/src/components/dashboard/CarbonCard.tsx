import { Leaf, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { CountUpValue } from "@/components/dashboard/CountUpValue";

export function CarbonCard({ tons }: { tons: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      className="glass-card glass-card-hover p-5 relative overflow-hidden micro-hover"
    >
      <div className="absolute -top-10 -right-10 size-32 rounded-full bg-[var(--neon-green)]/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-9 rounded-xl bg-[color-mix(in_oklab,var(--neon-green)_18%,transparent)] grid place-items-center text-[var(--neon-green)]">
            <Leaf className="size-5" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider">Carbon Savings</h2>
        </div>
        <p className="font-mono-data text-5xl font-bold text-glow-green tabular-nums"><CountUpValue value={tons} decimals={2} /><span className="text-2xl font-normal"> t</span></p>
        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
          <TrendingDown className="size-3.5 text-[var(--neon-green)]" />
          CO₂ saved compared to fossil fuels
        </p>
      </div>
    </motion.div>
  );
}
