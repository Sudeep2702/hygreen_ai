import { useQuery } from "@tanstack/react-query";
import type { BackendPlantState } from "@/types/operations";

type PlantState = BackendPlantState;

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

function buildFallbackState(): PlantState {
  const now = Math.floor(Date.now() / 1000);
  const history = Array.from({ length: 24 }, (_, index) => {
    const t = now - (23 - index) * 30;
    const energy = 230 + Math.sin(index / 3) * 26 + (index % 4) * 4;
    const hydrogen = 86 + Math.cos(index / 4) * 8;
    return { time: t, energy, hydrogen };
  });

  return {
    energy: 262,
    predicted_energy: 270,
    demand: 124,
    efficiency: 0.81,
    hydrogen: 93,
    storage: 312,
    capacity: 420,
    transport: "Dispatching",
    carbon: 18.4,
    decision: "Load balancing with predictive dispatch",
    logs: ["PRODUCE | Energy: 262 kW"],
    history,
    ml: {
      model_confidence: 0.82,
      selected_data_window: {
        window_start: 44000,
        window_end: 50000,
        selected_rows: 6000,
      },
      demand_forecast: Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        forecast: 420 + Math.sin(i / 3) * 30,
        lower: 380 + Math.sin(i / 3) * 20,
        upper: 460 + Math.sin(i / 3) * 35,
        anomaly: i % 11 === 0,
      })),
      production_risk: [
        { machine_id: "M-014", failure_probability: 0.76, predicted_oee: 0.67, confidence: 0.86 },
        { machine_id: "M-022", failure_probability: 0.63, predicted_oee: 0.71, confidence: 0.82 },
      ],
      transport_recommendations: [
        {
          shipment_id: "SHP-100201",
          sku: "SKU-H2-114",
          best_route: "R-042",
          origin: "Mumbai",
          destination: "Pune",
          destination_sector: "EV Refueling Hub",
          transport_mode: "Tube Trailer (compressed 700 bar)",
          distance_km: 186.2,
          h2_volume_kg: 1650,
          sector_urgency: 0.88,
          cost_index: 118.5,
          safety_risk: 29.4,
          risk_score: 33.2,
          score: 87.4,
          confidence: 0.88,
        },
      ],
      dataset_overview: {
        demand_rows: 50000,
        production_rows: 50000,
        transport_rows: 50000,
        ml_models: ["demand_random_forest", "production_oee_random_forest", "transport_route_random_forest"],
      },
    },
    production_locations: [
      {
        site_id: "SITE-1",
        name: "Mumbai Electrolyzer Park",
        city: "Mumbai",
        lat: 19.076,
        lng: 72.8777,
        capacity_kw: 480,
        utilization: 0.82,
        status: "stable",
      },
    ],
    transport_routes: [
      {
        route_id: "R-042",
        origin: "Mumbai",
        destination: "Pune",
        origin_lat: 19.076,
        origin_lng: 72.8777,
        destination_lat: 18.5204,
        destination_lng: 73.8567,
        status: "on-time",
        shipment_id: "SHP-100201",
      },
    ],
  };
}

async function fetchPlantState(): Promise<PlantState> {
  try {
    const response = await fetch(`${apiBaseUrl}/state`);
    if (!response.ok) {
      throw new Error("Backend state request failed");
    }
    return await response.json();
  } catch {
    return buildFallbackState();
  }
}

export function usePlantState() {
  return useQuery({
    queryKey: ["plant-state"],
    queryFn: fetchPlantState,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
