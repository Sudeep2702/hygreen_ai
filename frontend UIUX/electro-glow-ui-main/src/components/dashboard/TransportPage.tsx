import { motion } from "framer-motion";
import { GitCompareArrows } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { ModelConfidenceBadge } from "@/components/dashboard/ModelConfidenceBadge";
import { PanelActions } from "@/components/dashboard/PanelActions";
import { PanelSkeleton } from "@/components/dashboard/PanelSkeleton";
import { VirtualizedTable } from "@/components/dashboard/VirtualizedTable";
import { usePlantState } from "@/hooks/usePlantState";
import { useSyntheticDatasets, useTransportOptimization } from "@/hooks/useOperationsData";

type TransportRecord = {
  shipmentId: string;
  sku: string;
  bestRoute: string;
  recommendedOrigin: string;
  recommendedDestination: string;
  destinationSector: string;
  transportMode: string;
  distanceKm: number;
  h2VolumeKg: number;
  sectorUrgency: number;
  costIndex: number;
  safetyRisk: number;
  riskScore: number;
  score: number;
  confidence: number;
};

const STORAGE_TYPES = [
  {
    name: "Compressed Gas",
    detail: "700 bar tube logistics",
    boilOffLossPct: 0.35,
    carbonIntensity: 1.42,
  },
  {
    name: "Liquid H2",
    detail: "Cryogenic -253°C distribution",
    boilOffLossPct: 1.75,
    carbonIntensity: 1.66,
  },
  {
    name: "Metal Hydride",
    detail: "Dense safe storage medium",
    boilOffLossPct: 0.06,
    carbonIntensity: 1.21,
  },
] as const;

const SECTOR_URGENCY: Record<string, number> = {
  "Steel Plant": 0.92,
  "Fertilizer Unit": 0.78,
  "EV Refueling Hub": 0.88,
  "Remote Microgrid": 0.72,
  "Shipping Terminal": 0.7,
  "Industrial Heat Hub": 0.82,
};

const DESTINATION_SECTORS = Object.keys(SECTOR_URGENCY);

function riskColor(risk: number) {
  if (risk > 75) {
    return "#ff6b35";
  }
  if (risk > 45) {
    return "#ffb703";
  }
  return "#00e5ff";
}

function modeColor(mode: string) {
  if (mode.includes("Liquid")) {
    return "#57ff8c";
  }
  if (mode.includes("Pipeline")) {
    return "#4dd0ff";
  }
  if (mode.includes("Ammonia")) {
    return "#ffd166";
  }
  return "#00e5ff";
}

function inferSector(index: number, sku: string) {
  if (sku.includes("11")) {
    return "EV Refueling Hub";
  }
  if (sku.includes("12")) {
    return "Steel Plant";
  }
  return DESTINATION_SECTORS[index % DESTINATION_SECTORS.length];
}

function inferMode(distanceKm: number, h2VolumeKg: number, destinationSector: string, costIndex: number, safetyRisk: number) {
  if (destinationSector === "Shipping Terminal" && distanceKm > 650) {
    return "Ammonia Carrier (for shipping sector)";
  }
  if (distanceKm < 300 && h2VolumeKg < 1800 && safetyRisk < 60) {
    return "Tube Trailer (compressed 700 bar)";
  }
  if (h2VolumeKg > 3200 && distanceKm < 850 && costIndex < 260) {
    return "Pipeline";
  }
  if (distanceKm >= 500 || h2VolumeKg > 2200) {
    return "Liquid H2 Tanker (-253°C)";
  }
  return "Tube Trailer (compressed 700 bar)";
}

export function TransportPage() {
  const plantState = usePlantState();
  const { transportDataset } = useSyntheticDatasets();
  const transportQuery = useTransportOptimization();
  const backendRecommendations = plantState.data?.ml?.transport_recommendations ?? [];

  if ((!plantState.data && transportQuery.isLoading) || (!backendRecommendations.length && !transportQuery.data)) {
    return (
      <AppShell title="Transport Optimization">
        <PanelSkeleton rows={8} />
      </AppShell>
    );
  }

  const recommendations: TransportRecord[] = backendRecommendations.length
    ? backendRecommendations.map((row) => ({
        shipmentId: row.shipment_id,
        sku: row.sku,
        bestRoute: row.best_route,
        recommendedOrigin: row.origin,
        recommendedDestination: row.destination,
        destinationSector: row.destination_sector,
        transportMode: row.transport_mode,
        distanceKm: row.distance_km,
        h2VolumeKg: row.h2_volume_kg,
        sectorUrgency: row.sector_urgency,
        costIndex: row.cost_index,
        safetyRisk: row.safety_risk,
        riskScore: row.risk_score,
        score: row.score,
        confidence: row.confidence,
      }))
    : (transportQuery.data?.result ?? []).map((row, index) => {
        const destinationSector = inferSector(index, row.sku);
        const distanceKm = Number((220 + row.riskScore * 15).toFixed(1));
        const h2VolumeKg = Number((900 + row.score * 32).toFixed(1));
        const sectorUrgency = SECTOR_URGENCY[destinationSector] ?? 0.75;
        const costIndex = Number((distanceKm / 20 + h2VolumeKg / 140 + row.riskScore * 0.45).toFixed(2));
        const safetyRisk = Number((row.riskScore * 0.9).toFixed(2));

        return {
          shipmentId: row.shipmentId,
          sku: row.sku,
          bestRoute: row.bestRoute,
          recommendedOrigin: row.recommendedOrigin,
          recommendedDestination: row.recommendedDestination,
          destinationSector,
          transportMode: inferMode(distanceKm, h2VolumeKg, destinationSector, costIndex, safetyRisk),
          distanceKm,
          h2VolumeKg,
          sectorUrgency,
          costIndex,
          safetyRisk,
          riskScore: row.riskScore,
          score: row.score,
          confidence: row.confidence,
        };
      });

  const confidence = plantState.data?.ml?.model_confidence ?? transportQuery.data?.modelConfidence ?? 0.8;

  const exportRows = recommendations.map((row) => ({
    shipment_id: row.shipmentId,
    sku: row.sku,
    best_route: row.bestRoute,
    origin: row.recommendedOrigin,
    destination: row.recommendedDestination,
    destination_sector: row.destinationSector,
    transport_mode: row.transportMode,
    distance_km: Number(row.distanceKm.toFixed(2)),
    h2_volume_kg: Number(row.h2VolumeKg.toFixed(2)),
    sector_urgency: Number(row.sectorUrgency.toFixed(3)),
    cost_index: Number(row.costIndex.toFixed(2)),
    safety_risk: Number(row.safetyRisk.toFixed(2)),
    risk_score: Number(row.riskScore.toFixed(2)),
    score: Number(row.score.toFixed(2)),
    confidence_pct: Number((row.confidence * 100).toFixed(2)),
  }));

  return (
    <AppShell title="Transport Optimization">
      <motion.section
        id="panel-transport-comparison"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {recommendations.slice(0, 3).map((route) => (
          <motion.div
            key={route.shipmentId}
            whileHover={{ y: -3 }}
            className="glass-card p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Green H2 Distribution Route</p>
              <span className="rounded-full border border-[color-mix(in_oklab,var(--neon-cyan)_45%,transparent)] bg-[color-mix(in_oklab,var(--neon-cyan)_20%,transparent)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--neon-cyan)]">
                ML Recommended
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <GitCompareArrows className="size-4 text-[var(--neon-cyan)]" />
              <span>{route.recommendedOrigin} to {route.recommendedDestination}</span>
            </div>
            <p className="mt-2 font-mono-data text-base" style={{ color: modeColor(route.transportMode) }}>{route.transportMode}</p>
            <p className="text-xs text-muted-foreground">Sector: {route.destinationSector}</p>
            <p className="text-xs text-muted-foreground">Distance {route.distanceKm.toFixed(0)} km | Volume {route.h2VolumeKg.toFixed(0)} kg</p>
            <p className="mt-1 text-xs text-muted-foreground">Shipment {route.shipmentId} | SKU {route.sku}</p>
          </motion.div>
        ))}
      </motion.section>

      <motion.section
        id="panel-storage-types"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {STORAGE_TYPES.map((storage) => (
          <div key={storage.name} className="glass-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{storage.name}</p>
            <p className="mt-1 text-sm text-foreground/90">{storage.detail}</p>
            <p className="mt-3 font-mono-data text-xl text-[var(--neon-cyan)]">{storage.boilOffLossPct.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">Boil-off loss</p>
            <p className="mt-2 font-mono-data text-lg text-[var(--neon-green)]">{storage.carbonIntensity.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">kg CO2 per kg H2 delivered</p>
          </div>
        ))}
      </motion.section>

      <motion.section
        id="panel-transport-table"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="mt-4 glass-card p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Shipment Route Scoring</h2>
            <p className="text-sm">Mode decision uses distance, H2 volume, urgency, cost, and safety risk</p>
          </div>
          <div className="flex items-center gap-2">
            <ModelConfidenceBadge confidence={confidence} />
            <PanelActions
              panelId="panel-transport-table"
              csvName="transport-recommendations"
              pngName="transport-recommendations"
              rows={exportRows}
            />
          </div>
        </div>

        <VirtualizedTable
          rows={recommendations}
          columns={[
            {
              key: "shipmentId",
              label: "Shipment",
              width: "col-span-2",
              render: (row) => (
                <div>
                  <span className="font-mono-data">{row.shipmentId}</span>
                  <p className="text-[10px] text-muted-foreground">{row.sku}</p>
                </div>
              ),
            },
            {
              key: "transportMode",
              label: "Transport Mode",
              width: "col-span-3",
              render: (row) => (
                <span className="text-[11px]" style={{ color: modeColor(row.transportMode) }}>
                  {row.transportMode}
                </span>
              ),
            },
            {
              key: "destinationSector",
              label: "Destination Sector",
              width: "col-span-2",
              render: (row) => <span>{row.destinationSector}</span>,
            },
            {
              key: "recommendedDestination",
              label: "Destination",
              width: "col-span-2",
              render: (row) => <span>{row.recommendedDestination}</span>,
            },
            {
              key: "riskScore",
              label: "Risk",
              width: "col-span-1",
              render: (row) => (
                <span className="font-mono-data" style={{ color: riskColor(row.riskScore) }}>
                  {row.riskScore.toFixed(0)}
                </span>
              ),
            },
            {
              key: "costIndex",
              label: "Cost",
              width: "col-span-1",
              render: (row) => <span className="font-mono-data">{row.costIndex.toFixed(0)}</span>,
            },
            {
              key: "confidence",
              label: "Conf",
              width: "col-span-1",
              render: (row) => <span className="font-mono-data">{(row.confidence * 100).toFixed(0)}%</span>,
            },
          ]}
        />

        <p className="mt-2 text-xs text-muted-foreground">
          Synthetic transport records loaded: {(plantState.data?.ml?.dataset_overview?.transport_rows ?? transportDataset.length).toLocaleString()}
        </p>
      </motion.section>
    </AppShell>
  );
}
