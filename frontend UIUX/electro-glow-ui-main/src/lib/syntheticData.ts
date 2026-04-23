import type {
  CityNode,
  DemandDataRow,
  FleetTruck,
  ProductionDataRow,
  TransportDataRow,
  TruckEvent,
  TruckStatus,
} from "@/types/operations";

const INDIAN_CITIES: CityNode[] = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
];

const DRIVERS = [
  "Aarav Sharma",
  "Rohan Nair",
  "Ishita Rao",
  "Meera Kapoor",
  "Vikram Singh",
  "Kunal Das",
  "Ananya Iyer",
  "Siddharth Jain",
];

const CARGO_TYPES = [
  "H2 Cylinders",
  "Fuel Cell Stack",
  "PEM Membranes",
  "Electrolyzer Spares",
  "Cooling Modules",
  "Pressure Valves",
  "Industrial Gas Mix",
  "Compressor Kits",
];

const SKUS = ["SKU-H2-101", "SKU-H2-113", "SKU-FC-221", "SKU-PEM-415", "SKU-CMP-502", "SKU-TRN-335"];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pickOne<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length) % arr.length];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function generateDemandDataset(size = 12000): DemandDataRow[] {
  const rows: DemandDataRow[] = [];
  const base = 380;

  for (let i = 0; i < size; i += 1) {
    const seasonality = 1 + 0.15 * Math.sin((2 * Math.PI * i) / 30);
    const promotion = seededRandom(i * 5.11) > 0.88 ? 1 : 0;
    const noise = (seededRandom(i * 1.77) - 0.5) * 45;

    const lag1 = rows[i - 1]?.demand ?? base;
    const lag7 = rows[i - 7]?.demand ?? base;
    const rollingWindow = rows.slice(Math.max(0, i - 7), i);
    const rollingAvg7 =
      rollingWindow.length > 0
        ? rollingWindow.reduce((sum, row) => sum + row.demand, 0) / rollingWindow.length
        : base;

    const demand = clamp(
      base * seasonality + lag1 * 0.18 + lag7 * 0.11 + rollingAvg7 * 0.22 + promotion * 42 + noise,
      120,
      980,
    );

    rows.push({
      day: i + 1,
      demand,
      lag1,
      lag7,
      rollingAvg7,
      seasonality,
      promotion,
    });
  }

  return rows;
}

export function generateProductionDataset(size = 12000): ProductionDataRow[] {
  const rows: ProductionDataRow[] = [];
  const machinePool = Array.from({ length: 180 }, (_, i) => `M-${String(i + 1).padStart(3, "0")}`);

  for (let i = 0; i < size; i += 1) {
    const machineId = machinePool[i % machinePool.length];
    const drift = 0.02 * Math.sin(i / 40);
    const downtimeHours = clamp(0.5 + seededRandom(i * 2.91) * 7.5 + drift * 10, 0.1, 12);
    const defectRate = clamp(0.005 + seededRandom(i * 4.72) * 0.12 + drift, 0.001, 0.3);
    const maintenanceFlag = seededRandom(i * 8.03) > 0.9 ? 1 : 0;
    const throughput = clamp(55 + seededRandom(i * 9.19) * 130 - downtimeHours * 1.8, 20, 220);
    const oeeBaseline = clamp(0.82 - defectRate * 0.8 - downtimeHours * 0.02 + maintenanceFlag * 0.03, 0.3, 0.97);

    rows.push({
      recordId: i + 1,
      machineId,
      downtimeHours,
      defectRate,
      maintenanceFlag,
      throughput,
      oeeBaseline,
    });
  }

  return rows;
}

export function generateTransportDataset(size = 12000): TransportDataRow[] {
  const rows: TransportDataRow[] = [];

  for (let i = 0; i < size; i += 1) {
    const origin = pickOne(INDIAN_CITIES, i * 1.1);
    let destination = pickOne(INDIAN_CITIES, i * 1.8);
    if (destination.name === origin.name) {
      destination = pickOne(INDIAN_CITIES, i * 2.3 + 17);
    }

    const distanceKm = clamp(
      Math.hypot(origin.lat - destination.lat, origin.lng - destination.lng) * 95,
      140,
      2200,
    );
    const trafficIndex = clamp(0.2 + seededRandom(i * 3.7), 0, 1);
    const delayRate = clamp(0.04 + trafficIndex * 0.4 + seededRandom(i * 7.2) * 0.25, 0.02, 0.92);
    const fuelEfficiency = clamp(2.2 + seededRandom(i * 4.4) * 5.8 - trafficIndex * 1.5, 1.4, 8.2);

    rows.push({
      routeId: `R-${String((i % 320) + 1).padStart(3, "0")}`,
      origin: origin.name,
      destination: destination.name,
      distanceKm,
      delayRate,
      trafficIndex,
      fuelEfficiency,
      shipmentId: `SHP-${String(i + 1).padStart(5, "0")}`,
      sku: pickOne(SKUS, i * 9.9),
    });
  }

  return rows;
}

function bearing(from: CityNode, to: CityNode) {
  return (Math.atan2(to.lng - from.lng, to.lat - from.lat) * 180) / Math.PI;
}

export function generateFleetTrucks(size = 60): FleetTruck[] {
  const trucks: FleetTruck[] = [];

  for (let i = 0; i < size; i += 1) {
    const origin = pickOne(INDIAN_CITIES, i * 5.4);
    let destination = pickOne(INDIAN_CITIES, i * 7.2);
    if (destination.name === origin.name) {
      destination = pickOne(INDIAN_CITIES, i * 7.9 + 99);
    }

    const midpoint: CityNode = {
      name: `Mid-${i + 1}`,
      lat: (origin.lat + destination.lat) / 2 + (seededRandom(i * 2.1) - 0.5) * 2.2,
      lng: (origin.lng + destination.lng) / 2 + (seededRandom(i * 3.1) - 0.5) * 2.2,
    };

    const progress = seededRandom(i * 4.2);
    const lat = origin.lat + (midpoint.lat - origin.lat) * progress;
    const lng = origin.lng + (midpoint.lng - origin.lng) * progress;

    const statusRoll = seededRandom(i * 11.1);
    const status: TruckStatus = statusRoll > 0.87 ? "critical" : statusRoll > 0.62 ? "delayed" : "on-time";

    trucks.push({
      truckId: `TRK-${String(i + 1).padStart(3, "0")}`,
      driver: pickOne(DRIVERS, i * 12.7),
      origin: origin.name,
      destination: destination.name,
      cargo: pickOne(CARGO_TYPES, i * 8.5),
      speedKph: clamp(32 + seededRandom(i * 10.2) * 55, 25, 96),
      etaMinutes: Math.floor(clamp(40 + seededRandom(i * 2.8) * 780, 25, 960)),
      fuelLevel: clamp(18 + seededRandom(i * 6.4) * 78, 8, 100),
      status,
      lat,
      lng,
      heading: bearing(origin, midpoint),
      route: [origin, midpoint, destination],
      progress,
    });
  }

  return trucks;
}

export function generateTruckEvents(trucks: FleetTruck[], count = 120): TruckEvent[] {
  const verbs = ["departed", "hit traffic", "completed delivery", "stopped for fuel", "cleared checkpoint"];

  return Array.from({ length: count }, (_, i) => {
    const truck = trucks[i % trucks.length];
    const status = truck.status;
    const timestamp = Date.now() - i * 45_000;
    const message = `${truck.truckId} ${pickOne(verbs, i * 1.9)} on ${truck.origin} -> ${truck.destination}`;

    return {
      id: `event-${i + 1}`,
      truckId: truck.truckId,
      message,
      timestamp,
      status,
    };
  });
}

export function getIndianCities() {
  return INDIAN_CITIES;
}
