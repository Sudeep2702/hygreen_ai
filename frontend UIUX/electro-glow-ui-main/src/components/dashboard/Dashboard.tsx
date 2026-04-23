import { motion } from "framer-motion";
import { Activity, BrainCircuit, Gauge, Leaf } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { AIPanel } from "@/components/dashboard/AIPanel";
import { CarbonCard } from "@/components/dashboard/CarbonCard";
import { ChartPanel, type ChartPoint } from "@/components/dashboard/ChartPanel";
import { ElectrolyzerCard } from "@/components/dashboard/ElectrolyzerCard";
import { EnergyCard } from "@/components/dashboard/EnergyCard";
import { PanelSkeleton } from "@/components/dashboard/PanelSkeleton";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { StorageTank } from "@/components/dashboard/StorageTank";
import { TransportCard } from "@/components/dashboard/TransportCard";
import { useDemandForecast, useProductionRisk, useTransportOptimization } from "@/hooks/useOperationsData";
import { usePlantState } from "@/hooks/usePlantState";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const fmtTime = (timestamp: number) =>
  new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export function Dashboard() {
  const plantQuery = usePlantState();
  const demandForecast = useDemandForecast();
  const productionRisk = useProductionRisk();
  const transportOpt = useTransportOptimization();

  const data = plantQuery.data;

  if (!data || plantQuery.isLoading) {
    return (
      <AppShell title="Hydrogen Dashboard">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={3} />
          <div className="md:col-span-2 xl:col-span-4">
            <PanelSkeleton rows={6} />
          </div>
        </div>
      </AppShell>
    );
  }

  const solar = data.energy * 0.4;
  const wind = data.energy * 0.3;
  const hydro = data.energy * 0.3;
  const storagePercent = (data.storage / data.capacity) * 100;
  const distance = data.transport === "Dispatching" ? 50 : 120;
  const eta = 95;
  const carbon = data.carbon;

  const backendDemand = data.ml?.demand_forecast ?? [];
  const demandResult = backendDemand.length
    ? backendDemand.map((row: { day: number; forecast: number; lower: number; upper: number; anomaly: boolean }) => ({
        dayAhead: row.day,
        forecast: row.forecast,
        lower: row.lower,
        upper: row.upper,
        anomaly: row.anomaly,
      }))
    : demandForecast.data?.result ?? [];
  const demandConfidence = data.ml?.model_confidence ?? demandForecast.data?.modelConfidence ?? 0.82;

  const series: ChartPoint[] = data.history.map((h: { time: number; energy: number; hydrogen: number }, index: number) => {
    const demandPoint = demandResult[index % Math.max(1, demandResult.length)];
    return {
      t: fmtTime(h.time),
      energy: h.energy,
      hydrogen: h.hydrogen,
      lower: demandPoint?.lower,
      upper: demandPoint?.upper,
      anomaly: demandPoint?.anomaly ? h.energy : undefined,
    };
  });

  const totalEnergy = data.energy;
  const efficiency = data.efficiency * 100;
  const productionRate = data.hydrogen;

  const backendRiskMachine = data.ml?.production_risk?.[0];
  const backendRoute = data.ml?.transport_recommendations?.[0];

  const riskyMachine = backendRiskMachine
    ? {
        machineId: backendRiskMachine.machine_id,
        failureProbability: backendRiskMachine.failure_probability,
      }
    : productionRisk.data?.result[0];

  const bestRoute = backendRoute
    ? {
        shipmentId: backendRoute.shipment_id,
        bestRoute: backendRoute.best_route,
        riskScore: backendRoute.risk_score,
      }
    : transportOpt.data?.result[0];

  const projectedDemand = demandResult[29]?.forecast ?? demandResult[0]?.forecast ?? 0;
  const selectedRows = data.ml?.selected_data_window?.selected_rows ?? 0;

  const decisions = [
    { text: `Decision: ${data.decision}`, active: true },
    {
      text:
        storagePercent > 85
          ? "Storage near capacity; intake balancing enabled"
          : "Storage levels nominal",
      active: storagePercent > 85,
    },
    {
      text:
        data.transport === "Dispatching"
          ? "Dispatch initiated and tanker routing active"
          : "Awaiting dispatch threshold",
      active: data.transport === "Dispatching",
    },
    {
      text: bestRoute
        ? `Route ${bestRoute.bestRoute} recommended for ${bestRoute.shipmentId}`
        : "Route model warming up",
      active: Boolean(bestRoute),
    },
  ];

  const historyEnergy = data.history.map((point: { energy: number }) => point.energy);
  const historyHydrogen = data.history.map((point: { hydrogen: number }) => point.hydrogen);

  const insights = [
    `Demand model projects ${projectedDemand.toFixed(0)} units in 30 days with ${(demandConfidence * 100).toFixed(0)}% confidence using ${selectedRows.toLocaleString()} selected rows.`,
    riskyMachine
      ? `${riskyMachine.machineId} has ${(riskyMachine.failureProbability * 100).toFixed(1)}% failure probability. Prioritize preventive maintenance.`
      : "Production scoring is refreshing from synthetic + live telemetry.",
    bestRoute
      ? `${bestRoute.shipmentId} should use ${bestRoute.bestRoute} to reduce risk score to ${bestRoute.riskScore.toFixed(1)}.`
      : "Transport optimization model is selecting route candidates.",
  ];

  return (
    <AppShell title="Hydrogen Dashboard">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
        <motion.section
          variants={staggerItem}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-white/8 bg-black/20 p-4 md:grid-cols-3"
        >
          <div className="glass-card p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Gauge className="size-3 text-[var(--neon-cyan)]" /> Total Energy
            </div>
            <Sparkline values={historyEnergy} color="var(--neon-cyan)" />
          </div>
          <div className="glass-card p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="size-3 text-[var(--neon-green)]" /> Hydrogen Output
            </div>
            <Sparkline values={historyHydrogen} color="var(--neon-green)" />
          </div>
          <div className="glass-card p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Leaf className="size-3 text-[var(--neon-yellow)]" /> Carbon Reduction
            </div>
            <Sparkline values={historyHydrogen.map((v: number, i: number) => v * 0.16 + i)} color="var(--neon-yellow)" />
          </div>
        </motion.section>

        <motion.section variants={staggerItem} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <EnergyCard
            sources={[
              { key: "solar", label: "Solar Energy", value: solar },
              { key: "wind", label: "Wind Energy", value: wind },
              { key: "hydro", label: "Hydropower", value: hydro },
            ]}
          />
          <ElectrolyzerCard efficiency={efficiency} rate={productionRate} running={totalEnergy > 80} />
          <StorageTank percent={storagePercent} capacity={data.capacity} />
          <TransportCard delivering={data.transport === "Dispatching"} distance={distance} eta={eta} />
        </motion.section>

        <motion.section variants={staggerItem} className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <AIPanel decisions={decisions} confidence={demandConfidence} />
          </div>
          <div className="xl:col-span-2">
            <CarbonCard tons={carbon} />
          </div>
        </motion.section>

        <motion.section variants={staggerItem} className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <div className="xl:col-span-3">
            <ChartPanel data={series} confidence={demandConfidence} />
          </div>
          <div className="glass-card p-5 xl:col-span-1" id="panel-ai-insights">
            <div className="mb-3 flex items-center gap-2">
              <BrainCircuit className="size-4 text-[var(--neon-cyan)]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">AI Insights</h3>
            </div>
            <ul className="space-y-2 text-sm text-foreground/90">
              {insights.map((insight) => (
                <li key={insight} className="micro-hover rounded-lg border border-white/8 bg-black/25 p-2">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </motion.section>
      </motion.div>
    </AppShell>
  );
}
