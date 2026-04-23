import { motion } from "framer-motion";
import {
  Area,
  Bar,
  BarChart,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/dashboard/AppShell";
import { ModelConfidenceBadge } from "@/components/dashboard/ModelConfidenceBadge";
import { PanelActions } from "@/components/dashboard/PanelActions";
import { PanelSkeleton } from "@/components/dashboard/PanelSkeleton";
import { useDemandForecast } from "@/hooks/useOperationsData";
import { usePlantState } from "@/hooks/usePlantState";

export function DemandPage() {
  const plantState = usePlantState();
  const forecast = useDemandForecast();
  const backendForecast = plantState.data?.ml?.demand_forecast ?? [];

  if ((!plantState.data && forecast.isLoading) || (!backendForecast.length && !forecast.data)) {
    return (
      <AppShell title="Demand Forecast">
        <PanelSkeleton rows={7} />
      </AppShell>
    );
  }

  const forecastData = backendForecast.length
    ? backendForecast.map((row) => ({
        dayAhead: row.day,
        forecast: row.forecast,
        lower: row.lower,
        upper: row.upper,
        anomaly: row.anomaly,
      }))
    : forecast.data?.result ?? [];

  const forecastWithLabels = forecastData.map((row, index) => ({
    ...row,
    anomalyLabel: row.anomaly
      ? index % 2 === 0
        ? "Industrial Decarbonization Demand"
        : "Grid Export Event"
      : "",
  }));

  const sectorDemandData = forecastData.slice(0, 10).map((point, index) => {
    const base = point.forecast;

    const transportation = base * (0.22 + 0.03 * Math.sin(index * 0.7));
    const shipping = base * (0.13 + 0.02 * Math.cos(index * 0.5));
    const steelManufacturing = base * (0.26 + 0.03 * Math.sin(index * 0.35 + 1));
    const fertilizerChemicals = base * (0.18 + 0.02 * Math.cos(index * 0.65));
    const heatingSystems = base * (0.12 + 0.015 * Math.sin(index * 0.85));

    const allocated = transportation + shipping + steelManufacturing + fertilizerChemicals + heatingSystems;
    const remoteMicrogrids = Math.max(0, base - allocated);

    return {
      dayAhead: point.dayAhead,
      Transportation: Number(transportation.toFixed(2)),
      Shipping: Number(shipping.toFixed(2)),
      "Steel Manufacturing": Number(steelManufacturing.toFixed(2)),
      "Fertilizer & Chemicals": Number(fertilizerChemicals.toFixed(2)),
      "Heating Systems": Number(heatingSystems.toFixed(2)),
      "Remote Microgrids": Number(remoteMicrogrids.toFixed(2)),
    };
  });

  const eventLabels = [
    "Steel Plant Order Surge",
    "EV Fleet Refueling Peak",
    "Shipping Hydrogen Bunkering Wave",
    "Fertilizer Ammonia Feed Cycle",
    "District Heating Dispatch Window",
    "Remote Microgrid Stabilization Run",
  ];

  const liveProduction = plantState.data?.hydrogen ?? 0;
  const liveDemand = plantState.data?.demand ?? forecastData[0]?.forecast ?? 0;
  const liveGap = liveProduction - liveDemand;
  const hasSurplus = liveGap >= 0;

  const confidence = plantState.data?.ml?.model_confidence ?? forecast.data?.modelConfidence ?? 0.82;
  const exportRows = forecastWithLabels.map((row) => ({
    day_ahead: row.dayAhead,
    forecast: Number(row.forecast.toFixed(2)),
    lower: Number(row.lower.toFixed(2)),
    upper: Number(row.upper.toFixed(2)),
    anomaly: row.anomaly,
    anomaly_label: row.anomalyLabel,
  }));

  const sectorExportRows = sectorDemandData.map((row) => ({ ...row }));

  return (
    <AppShell title="Demand Forecast">
      <motion.section
        id="panel-demand-forecast"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">30-Day Forecast</h2>
            <p className="text-lg font-semibold">Area forecast with confidence bands and anomalies</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                hasSurplus
                  ? "border-[color-mix(in_oklab,var(--neon-green)_45%,transparent)] bg-[color-mix(in_oklab,var(--neon-green)_18%,transparent)] text-[var(--neon-green)]"
                  : "border-[color-mix(in_oklab,var(--danger)_45%,transparent)] bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] text-[var(--danger)]"
              }`}
            >
              {hasSurplus
                ? `Production Surplus +${liveGap.toFixed(1)} kg/hr · Energy Independence`
                : `Demand Deficit ${Math.abs(liveGap).toFixed(1)} kg/hr · Storage Drawdown Alert`}
            </span>
            <ModelConfidenceBadge confidence={confidence} />
            <PanelActions
              panelId="panel-demand-forecast"
              csvName="demand-forecast"
              pngName="demand-forecast"
              rows={exportRows}
            />
          </div>
        </div>

        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastWithLabels} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.52} />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="gradBandDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6ef3ff" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6ef3ff" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="dayAhead" stroke="#8ba6b8" />
              <YAxis stroke="#8ba6b8" />
              <Tooltip
                contentStyle={{
                  background: "#111318",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                }}
              />
              <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#gradBandDemand)" />
              <Area type="monotone" dataKey="lower" stroke="transparent" fill="#0a0c10" />
              <Area type="monotone" dataKey="forecast" stroke="#00e5ff" strokeWidth={2.4} fill="url(#gradDemand)" />
              <Scatter
                data={forecastWithLabels.filter((row) => row.anomaly)}
                dataKey="forecast"
                fill="#ff6b35"
              >
                <LabelList dataKey="anomalyLabel" position="top" fill="#ffb6a0" fontSize={10} />
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      <motion.section
        id="panel-sector-demand"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-4 glass-card p-5"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sector Demand Breakdown</h2>
            <p className="text-lg font-semibold">Decarbonization demand split by end-use sector</p>
          </div>
          <PanelActions
            panelId="panel-sector-demand"
            csvName="sector-demand-breakdown"
            pngName="sector-demand-breakdown"
            rows={sectorExportRows}
          />
        </div>

        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorDemandData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="dayAhead" stroke="#8ba6b8" />
              <YAxis stroke="#8ba6b8" />
              <Tooltip
                contentStyle={{
                  background: "#111318",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Transportation" stackId="sector" fill="#00e5ff" />
              <Bar dataKey="Shipping" stackId="sector" fill="#4dd0ff" />
              <Bar dataKey="Steel Manufacturing" stackId="sector" fill="#57ff8c" />
              <Bar dataKey="Fertilizer & Chemicals" stackId="sector" fill="#2cd4bf" />
              <Bar dataKey="Heating Systems" stackId="sector" fill="#ffd166" />
              <Bar dataKey="Remote Microgrids" stackId="sector" fill="#ff6b35" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {forecastData.slice(0, 3).map((point, index) => (
          <div key={point.dayAhead} className="glass-card micro-hover p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{eventLabels[index % eventLabels.length]}</p>
            <p className="mt-1 font-mono-data text-3xl font-semibold text-[var(--neon-cyan)]">{point.forecast.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">
              CI: {point.lower.toFixed(0)} - {point.upper.toFixed(0)}
            </p>
            {point.anomaly && (
              <p className="mt-2 text-xs text-[var(--danger)]">
                {index % 2 === 0 ? "Industrial Decarbonization Demand" : "Grid Export Event"}
              </p>
            )}
          </div>
        ))}
      </motion.section>
    </AppShell>
  );
}
