import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PanelActions } from "@/components/dashboard/PanelActions";
import { ModelConfidenceBadge } from "@/components/dashboard/ModelConfidenceBadge";

export type ChartPoint = {
  t: string;
  energy: number;
  hydrogen: number;
  lower?: number;
  upper?: number;
  anomaly?: number;
};

export function ChartPanel({ data, confidence = 0.9 }: { data: ChartPoint[]; confidence?: number }) {
  const exportRows = data.map((point) => ({
    timestamp: point.t,
    energy: point.energy,
    hydrogen: point.hydrogen,
    lower: point.lower ?? "",
    upper: point.upper ?? "",
    anomaly: point.anomaly ?? "",
  }));

  return (
    <motion.div
      id="panel-system-analytics"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25 }}
      className="glass-card glass-card-hover p-5 micro-hover"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">System Analytics</h2>
          <p className="text-lg font-bold mt-0.5">Energy Input vs Hydrogen Output</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <ModelConfidenceBadge confidence={confidence} />
          <PanelActions panelId="panel-system-analytics" csvName="system-analytics" pngName="system-analytics" rows={exportRows} />
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradEnergy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradH2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--neon-green)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--neon-green)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
            <XAxis dataKey="t" stroke="oklch(0.7 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.7 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.21 0.025 260)",
                border: "1px solid oklch(1 0 0 / 12%)",
                borderRadius: 12,
                fontSize: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              labelStyle={{ color: "oklch(0.7 0.02 260)" }}
            />
            <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#gradBand)" />
            <Area type="monotone" dataKey="lower" stroke="transparent" fill="var(--background)" />
            <Area type="monotone" dataKey="energy" stroke="var(--neon-cyan)" strokeWidth={2.4} fill="url(#gradEnergy)" />
            <Area type="monotone" dataKey="hydrogen" stroke="var(--neon-green)" strokeWidth={2.4} fill="url(#gradH2)" />
            <Scatter dataKey="anomaly" fill="var(--danger)" shape="circle" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
