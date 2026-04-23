import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/dashboard/AppShell";
import { ModelConfidenceBadge } from "@/components/dashboard/ModelConfidenceBadge";
import { PanelActions } from "@/components/dashboard/PanelActions";
import { PanelSkeleton } from "@/components/dashboard/PanelSkeleton";
import { VirtualizedTable } from "@/components/dashboard/VirtualizedTable";
import { useProductionRisk, useSyntheticDatasets } from "@/hooks/useOperationsData";
import { usePlantState } from "@/hooks/usePlantState";

function machineHealthColor(risk: number) {
  if (risk > 0.72) {
    return "#ff6b35";
  }
  if (risk > 0.45) {
    return "#ffb703";
  }
  return "#00e5ff";
}

export function ProductionPage() {
  const plantState = usePlantState();
  const { productionDataset } = useSyntheticDatasets();
  const productionRisk = useProductionRisk();
  const backendRisk = plantState.data?.ml?.production_risk ?? [];

  if ((!plantState.data && productionRisk.isLoading) || (!backendRisk.length && !productionRisk.data)) {
    return (
      <AppShell title="Production Intelligence">
        <PanelSkeleton rows={8} />
      </AppShell>
    );
  }

  const riskRows = backendRisk.length
    ? backendRisk.map((row) => ({
        machineId: row.machine_id,
        failureProbability: row.failure_probability,
        predictedOee: row.predicted_oee,
        confidence: row.confidence,
      }))
    : productionRisk.data?.result ?? [];

  const topMachines = riskRows.slice(0, 12);
  const confidence = plantState.data?.ml?.model_confidence ?? productionRisk.data?.modelConfidence ?? 0.82;

  const ganttData = topMachines.slice(0, 8).map((machine, index) => ({
    machineId: machine.machineId,
    start: 2 + index * 3,
    duration: 4 + (machine.failureProbability * 8),
  }));

  const exportRows = riskRows.map((row) => ({
    machine_id: row.machineId,
    failure_probability_pct: Number((row.failureProbability * 100).toFixed(2)),
    predicted_oee_pct: Number((row.predictedOee * 100).toFixed(2)),
    confidence_pct: Number((row.confidence * 100).toFixed(2)),
  }));

  return (
    <AppShell title="Production Intelligence">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.section
          id="panel-factory-floor"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 xl:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Factory Floor Map</h2>
              <p className="text-lg font-semibold">Interactive machine health overlay</p>
            </div>
            <div className="flex items-center gap-2">
              <ModelConfidenceBadge confidence={confidence} />
              <PanelActions
                panelId="panel-factory-floor"
                csvName="production-risk"
                pngName="factory-floor"
                rows={exportRows}
              />
            </div>
          </div>

          <svg viewBox="0 0 900 360" className="h-[280px] w-full rounded-xl border border-white/10 bg-[#0d1117] p-2">
            <rect x="20" y="20" width="860" height="320" rx="20" fill="#10161f" stroke="rgba(255,255,255,0.08)" />
            <rect x="40" y="40" width="190" height="120" rx="12" fill="#0f1f2a" />
            <rect x="250" y="40" width="190" height="120" rx="12" fill="#131d29" />
            <rect x="460" y="40" width="190" height="120" rx="12" fill="#131d29" />
            <rect x="670" y="40" width="190" height="120" rx="12" fill="#1b1720" />
            <rect x="40" y="190" width="250" height="130" rx="12" fill="#102329" />
            <rect x="310" y="190" width="250" height="130" rx="12" fill="#181f2c" />
            <rect x="580" y="190" width="280" height="130" rx="12" fill="#1a1821" />

            {topMachines.map((machine, index) => {
              const col = index % 4;
              const row = Math.floor(index / 4);
              const x = 90 + col * 200;
              const y = 90 + row * 120;
              const fill = machineHealthColor(machine.failureProbability);

              return (
                <g key={machine.machineId}>
                  <circle cx={x} cy={y} r="16" fill={fill} opacity="0.9" />
                  <circle cx={x} cy={y} r="26" fill={fill} opacity="0.2" />
                  <text x={x + 24} y={y + 5} fill="#d9f6ff" fontSize="12" fontFamily="IBM Plex Mono">
                    {machine.machineId}
                  </text>
                </g>
              );
            })}
          </svg>
        </motion.section>

        <motion.section
          id="panel-production-gantt"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-5"
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Scheduled Runs</h2>
            <PanelActions
              panelId="panel-production-gantt"
              csvName="production-gantt"
              pngName="production-gantt"
              rows={ganttData.map((row) => ({ ...row }))}
            />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ganttData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis type="number" stroke="#7f97aa" />
                <YAxis dataKey="machineId" type="category" width={66} stroke="#7f97aa" />
                <Tooltip
                  contentStyle={{
                    background: "#111318",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                  }}
                />
                <Bar dataKey="start" stackId="a" fill="transparent" />
                <Bar dataKey="duration" stackId="a" fill="#00e5ff" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mt-4 glass-card p-4"
      >
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Machine Failure Probability Table</h2>
        <VirtualizedTable
          rows={riskRows}
          columns={[
            {
              key: "machineId",
              label: "Machine",
              width: "col-span-3",
              render: (row) => <span className="font-mono-data">{row.machineId}</span>,
            },
            {
              key: "failureProbability",
              label: "Failure Risk",
              width: "col-span-3",
              render: (row) => (
                <span className="font-mono-data" style={{ color: machineHealthColor(row.failureProbability) }}>
                  {(row.failureProbability * 100).toFixed(1)}%
                </span>
              ),
            },
            {
              key: "predictedOee",
              label: "Pred OEE",
              width: "col-span-3",
              render: (row) => <span className="font-mono-data">{(row.predictedOee * 100).toFixed(1)}%</span>,
            },
            {
              key: "confidence",
              label: "Confidence",
              width: "col-span-3",
              render: (row) => <span className="font-mono-data">{(row.confidence * 100).toFixed(1)}%</span>,
            },
          ]}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Synthetic production records loaded: {(plantState.data?.ml?.dataset_overview?.production_rows ?? productionDataset.length).toLocaleString()}
        </p>
      </motion.section>
    </AppShell>
  );
}
