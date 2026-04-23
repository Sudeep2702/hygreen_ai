export type DemandDataRow = {
  day: number;
  demand: number;
  lag1: number;
  lag7: number;
  rollingAvg7: number;
  seasonality: number;
  promotion: number;
};

export type ProductionDataRow = {
  recordId: number;
  machineId: string;
  downtimeHours: number;
  defectRate: number;
  maintenanceFlag: number;
  throughput: number;
  oeeBaseline: number;
};

export type TransportDataRow = {
  routeId: string;
  origin: string;
  destination: string;
  distanceKm: number;
  delayRate: number;
  trafficIndex: number;
  fuelEfficiency: number;
  shipmentId: string;
  sku: string;
};

export type DemandForecastPoint = {
  dayAhead: number;
  forecast: number;
  lower: number;
  upper: number;
  anomaly: boolean;
};

export type ProductionRiskPoint = {
  machineId: string;
  failureProbability: number;
  predictedOee: number;
  confidence: number;
};

export type TransportRecommendation = {
  shipmentId: string;
  sku: string;
  bestRoute: string;
  recommendedOrigin: string;
  recommendedDestination: string;
  transportMode?: string;
  destinationSector?: string;
  distanceKm?: number;
  h2VolumeKg?: number;
  sectorUrgency?: number;
  costIndex?: number;
  safetyRisk?: number;
  riskScore: number;
  score: number;
  confidence: number;
};

export type ModelOutput<T> = {
  modelConfidence: number;
  generatedAt: number;
  result: T;
};

export type CityNode = {
  name: string;
  lat: number;
  lng: number;
};

export type TruckStatus = "on-time" | "delayed" | "critical";

export type FleetTruck = {
  truckId: string;
  driver: string;
  origin: string;
  destination: string;
  cargo: string;
  speedKph: number;
  etaMinutes: number;
  fuelLevel: number;
  status: TruckStatus;
  lat: number;
  lng: number;
  heading: number;
  route: CityNode[];
  progress: number;
};

export type TruckEvent = {
  id: string;
  truckId: string;
  message: string;
  timestamp: number;
  status: TruckStatus;
};

export type BackendDemandForecastPoint = {
  day: number;
  forecast: number;
  lower: number;
  upper: number;
  anomaly: boolean;
};

export type BackendProductionRisk = {
  machine_id: string;
  failure_probability: number;
  predicted_oee: number;
  confidence: number;
};

export type BackendTransportRecommendation = {
  shipment_id: string;
  sku: string;
  best_route: string;
  origin: string;
  destination: string;
  destination_sector: string;
  transport_mode: string;
  distance_km: number;
  h2_volume_kg: number;
  sector_urgency: number;
  cost_index: number;
  safety_risk: number;
  risk_score: number;
  score: number;
  confidence: number;
};

export type ProductionLocation = {
  site_id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  capacity_kw: number;
  utilization: number;
  status: "stable" | "high-load";
};

export type TransportMapRoute = {
  route_id: string;
  origin: string;
  destination: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  status: TruckStatus;
  shipment_id: string;
};

export type BackendPlantState = {
  energy: number;
  predicted_energy: number;
  demand: number;
  hydrogen: number;
  storage: number;
  capacity: number;
  efficiency: number;
  decision: string;
  transport: string;
  carbon: number;
  logs: string[];
  history: Array<{ time: number; energy: number; hydrogen: number }>;
  ml: {
    model_confidence: number;
    selected_data_window: {
      window_start: number;
      window_end: number;
      selected_rows: number;
    };
    demand_forecast: BackendDemandForecastPoint[];
    production_risk: BackendProductionRisk[];
    transport_recommendations: BackendTransportRecommendation[];
    dataset_overview: {
      demand_rows: number;
      production_rows: number;
      transport_rows: number;
      ml_models: string[];
    };
  };
  production_locations: ProductionLocation[];
  transport_routes: TransportMapRoute[];
};
