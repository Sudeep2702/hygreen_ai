import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileText } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { CountUpValue } from "@/components/dashboard/CountUpValue";
import { ModelConfidenceBadge } from "@/components/dashboard/ModelConfidenceBadge";
import { PanelSkeleton } from "@/components/dashboard/PanelSkeleton";
import { usePlantState } from "@/hooks/usePlantState";
import { exportAsCsv, exportNodeAsPdf } from "@/lib/export";

type ProjectionMode = "optimistic" | "base" | "pessimistic";

const sectorOrder = [
  "Transportation",
  "Steel",
  "Fertilizer",
  "Heating",
  "Microgrids",
] as const;

const sectorStyle: Record<(typeof sectorOrder)[number], string> = {
  Transportation: "#00e5ff",
  Steel: "#57ff8c",
  Fertilizer: "#ffd166",
  Heating: "#4dd0ff",
  Microgrids: "#ff6b35",
};

const sectorAliases: Record<string, (typeof sectorOrder)[number]> = {
  "EV Refueling Hub": "Transportation",
  "Shipping Terminal": "Transportation",
  "Steel Plant": "Steel",
  "Fertilizer Unit": "Fertilizer",
  "Industrial Heat Hub": "Heating",
  "Remote Microgrid": "Microgrids",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ImpactPage() {
  const plantState = usePlantState();
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>("base");

  const data = plantState.data;
  if (!data) {
    return (
      <AppShell title="Impact & Decarbonization">
        <PanelSkeleton rows={8} />
      </AppShell>
    );
  }

  const recommendations = data.ml?.transport_recommendations ?? [];
  const confidence = data.ml?.model_confidence ?? 0.82;

  const co2AvoidedTonnes = data.carbon;
  const equivalentGreyH2Kg = (co2AvoidedTonnes * 1000) / 10;
  const boeDisplaced = equivalentGreyH2Kg * 0.019;

  const h2DeliveredKgh = Math.max(1, data.hydrogen);
  const h2DemandKgh = Math.max(1, data.demand);
  const energyIndependencePct = clamp((h2DeliveredKgh / h2DemandKgh) * 100, 0, 100);

  const waterConsumedLph = h2DeliveredKgh * 9.2;
  const waterRecycledLph = waterConsumedLph * 0.64;
  const waterRecyclePct = clamp((waterRecycledLph / waterConsumedLph) * 100, 0, 100);

  const sectorProgress = useMemo(() => {
    const counts = {
      Transportation: 0,
      Steel: 0,
      Fertilizer: 0,
      Heating: 0,
      Microgrids: 0,
    } as Record<(typeof sectorOrder)[number], number>;

    recommendations.forEach((rec) => {
      const sectorName = sectorAliases[rec.destination_sector] ?? "Transportation";
      counts[sectorName] += 1;
    });

    return sectorOrder.map((sector, index) => {
      const loadFactor = counts[sector] / Math.max(1, recommendations.length);
      const base = 42 + index * 5;
      const confidenceLift = confidence * 20;
      const progress = clamp(base + loadFactor * 45 + confidenceLift, 24, 98);

      return {
        sector,
        progress,
        color: sectorStyle[sector],
      };
    });
  }, [confidence, recommendations]);

  const avgTransportRisk = recommendations.length
    ? recommendations.reduce((sum, rec) => sum + rec.risk_score, 0) / recommendations.length
    : 28;

  const greenIntensityNow = clamp(1.1 + avgTransportRisk * 0.018 + (1 - confidence) * 0.7, 0.9, 3.2);

  const carbonIntensityData = Array.from({ length: 12 }, (_, i) => {
    const month = `M${i + 1}`;
    const trend = greenIntensityNow + Math.cos(i / 2.8) * 0.22 - i * 0.03;
    return {
      month,
      greenH2: clamp(trend, 0.75, 3.5),
      greyH2: 10,
      blueH2: 4,
    };
  });

  const annualBase = Math.max(300, co2AvoidedTonnes * 365);

  const projectionMultipliers: Record<ProjectionMode, number[]> = {
    optimistic: [1, 1.32, 1.78, 2.37, 3.05],
    base: [1, 1.2, 1.46, 1.76, 2.08],
    pessimistic: [1, 1.11, 1.24, 1.39, 1.56],
  };

  const projectionData = projectionMultipliers[projectionMode].map((multiplier, index) => ({
    year: `Y${index + 1}`,
    reductionTonnes: annualBase * multiplier,
  }));

  const exportRows = [
    {
      metric: "CO2 Avoided (tonnes)",
      value: Number(co2AvoidedTonnes.toFixed(2)),
    },
    {
      metric: "Equivalent fossil H2 production displaced (kg)",
      value: Number(equivalentGreyH2Kg.toFixed(2)),
    },
    {
      metric: "Fossil fuel replacement (barrels oil equivalent)",
      value: Number(boeDisplaced.toFixed(2)),
    },
    {
      metric: "Water consumed (L/hr)",
      value: Number(waterConsumedLph.toFixed(2)),
    },
    {
      metric: "Water recycled (L/hr)",
      value: Number(waterRecycledLph.toFixed(2)),
    },
    {
      metric: "Energy independence score (%)",
      value: Number(energyIndependencePct.toFixed(2)),
    },
    {
      metric: "Green H2 carbon intensity (kg CO2/kg H2)",
      value: Number(greenIntensityNow.toFixed(2)),
    },
    {
      metric: "Projection scenario",
      value: projectionMode,
    },
    ...projectionData.map((point) => ({
      metric: `${point.year} projected CO2 reduction (tonnes)`,
      value: Number(point.reductionTonnes.toFixed(2)),
    })),
  ];

  return (
    <AppShell title="Impact & Decarbonization">
      <motion.section
        id="panel-impact-overview"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-4"
      >
        <div className="glass-card p-4 xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">CO2 avoided vs fossil equivalent</p>
            <ModelConfidenceBadge confidence={confidence} />
          </div>
          <p className="font-mono-data text-4xl text-[var(--neon-green)]">
            <CountUpValue value={co2AvoidedTonnes} decimals={2} />
            <span className="ml-1 text-base text-muted-foreground">tonnes CO2</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Equivalent fossil hydrogen production displaced:
            <span className="ml-1 font-mono-data text-[var(--neon-cyan)]">
              <CountUpValue value={equivalentGreyH2Kg} decimals={0} /> kg H2 @ grey benchmark
            </span>
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Fossil replacement volume</p>
          <p className="mt-2 font-mono-data text-3xl text-[var(--neon-cyan)]">
            <CountUpValue value={boeDisplaced} decimals={1} />
          </p>
          <p className="text-xs text-muted-foreground">barrels of oil equivalent displaced</p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Energy independence score</p>
          <p className="mt-2 font-mono-data text-3xl text-[var(--neon-green)]">
            <CountUpValue value={energyIndependencePct} decimals={1} suffix="%" />
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--neon-green)]"
              style={{ width: `${energyIndependencePct}%` }}
            />
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <div className="glass-card p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sector Decarbonization Progress</h2>
              <p className="text-lg font-semibold">Demand-side transition progress by sector</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportAsCsv("impact-metrics", exportRows)}
                className="micro-hover inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px]"
              >
                <Download className="size-3" /> CSV
              </button>
              <button
                onClick={() => {
                  void exportNodeAsPdf("panel-impact-report", "impact-report");
                }}
                className="micro-hover inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px]"
              >
                <FileText className="size-3" /> PDF
              </button>
            </div>
          </div>

          <div id="panel-impact-report" className="space-y-3">
            {sectorProgress.map((sector) => (
              <div key={sector.sector}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{sector.sector}</span>
                  <span className="font-mono-data" style={{ color: sector.color }}>{sector.progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${sector.progress}%`, background: sector.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Electrolysis Water Balance</h2>
          <p className="mt-2 text-xs text-muted-foreground">Electrolysis uses pure water with recycling loop</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Consumed</p>
            <p className="font-mono-data text-2xl text-[var(--neon-cyan)]">
              <CountUpValue value={waterConsumedLph} decimals={0} /> L/hr
            </p>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Recycled</p>
            <p className="font-mono-data text-2xl text-[var(--neon-green)]">
              <CountUpValue value={waterRecycledLph} decimals={0} /> L/hr
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[var(--neon-green)]" style={{ width: `${waterRecyclePct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Recycle ratio {waterRecyclePct.toFixed(1)}%</p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-4 glass-card p-5"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Carbon Intensity Benchmark</h2>
        <p className="mb-2 text-sm">Green H2 vs grey and blue hydrogen references</p>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={carbonIntensityData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="month" stroke="#8ba6b8" />
              <YAxis stroke="#8ba6b8" domain={[0, 11]} />
              <Tooltip
                contentStyle={{
                  background: "#111318",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                }}
              />
              <ReferenceLine y={10} stroke="#ff6b35" strokeDasharray="6 4" label="Grey H2 (10)" />
              <ReferenceLine y={4} stroke="#ffd166" strokeDasharray="6 4" label="Blue H2 (4)" />
              <Line type="monotone" dataKey="greenH2" stroke="#00e5ff" strokeWidth={2.8} dot={false} name="Green H2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass-card p-5"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">5-Year CO2 Reduction Projection</h2>
            <p className="text-sm">Scenario forecast with optimistic/base/pessimistic pathways</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1 text-xs">
            {(["optimistic", "base", "pessimistic"] as ProjectionMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setProjectionMode(mode)}
                className={`rounded-md px-2 py-1 uppercase tracking-wider ${projectionMode === mode ? "bg-[color-mix(in_oklab,var(--neon-cyan)_25%,transparent)] text-[var(--neon-cyan)]" : "text-muted-foreground"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="gradProjection" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#57ff8c" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#57ff8c" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="year" stroke="#8ba6b8" />
              <YAxis stroke="#8ba6b8" />
              <Tooltip
                contentStyle={{
                  background: "#111318",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                }}
              />
              <Area type="monotone" dataKey="reductionTonnes" stroke="#57ff8c" strokeWidth={2.4} fill="url(#gradProjection)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.section>
    </AppShell>
  );
}
