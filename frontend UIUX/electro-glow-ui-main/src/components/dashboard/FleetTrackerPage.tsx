import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AppShell } from "@/components/dashboard/AppShell";
import { generateFleetTrucks, generateTruckEvents } from "@/lib/syntheticData";
import { usePlantState } from "@/hooks/usePlantState";
import type { FleetTruck, ProductionLocation, TruckEvent } from "@/types/operations";

const STATUS_COLOR = {
  "on-time": "#00e5ff",
  delayed: "#ffb703",
  critical: "#ff6b35",
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function makeTruckIcon(heading: number, status: FleetTruck["status"]) {
  const fill = STATUS_COLOR[status];
  return L.divIcon({
    html: `<div style="transform: rotate(${heading}deg); width:30px; height:30px; display:grid; place-items:center;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 8h11v8H3z" fill="${fill}" opacity="0.95"/>
        <path d="M14 10h4l3 3v3h-7z" fill="${fill}" opacity="0.75"/>
        <circle cx="7" cy="18" r="2" fill="#0A0C10"/>
        <circle cx="17" cy="18" r="2" fill="#0A0C10"/>
      </svg>
    </div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function advanceTruck(truck: FleetTruck): FleetTruck {
  const segmentCount = truck.route.length - 1;
  const speedFactor = clamp(truck.speedKph / 1600, 0.01, 0.09);
  const nextProgress = truck.progress + speedFactor;
  const wrappedProgress = nextProgress > 1 ? nextProgress - 1 : nextProgress;

  const exactIndex = wrappedProgress * segmentCount;
  const segmentIndex = Math.floor(exactIndex);
  const segmentT = exactIndex - segmentIndex;

  const from = truck.route[segmentIndex];
  const to = truck.route[(segmentIndex + 1) % truck.route.length];

  const lat = lerp(from.lat, to.lat, segmentT);
  const lng = lerp(from.lng, to.lng, segmentT);
  const heading = (Math.atan2(to.lng - from.lng, to.lat - from.lat) * 180) / Math.PI;

  return {
    ...truck,
    progress: wrappedProgress,
    lat,
    lng,
    heading,
    etaMinutes: Math.max(5, truck.etaMinutes - 2),
    fuelLevel: clamp(truck.fuelLevel - 0.6, 5, 100),
  };
}

function buildEvent(truck: FleetTruck): TruckEvent {
  const labels = {
    "on-time": "maintaining schedule",
    delayed: "reported traffic delay",
    critical: "triggered critical alert",
  } as const;

  return {
    id: crypto.randomUUID(),
    truckId: truck.truckId,
    message: `${truck.truckId} ${labels[truck.status]} on ${truck.origin} -> ${truck.destination}`,
    timestamp: Date.now(),
    status: truck.status,
  };
}

function utilizationColor(site: ProductionLocation["status"]) {
  return site === "high-load" ? "#ff6b35" : "#00e5ff";
}

export function FleetTrackerPage() {
  const plantState = usePlantState();
  const [trucks, setTrucks] = useState<FleetTruck[]>(() => generateFleetTrucks(60));
  const [events, setEvents] = useState<TruckEvent[]>(() => generateTruckEvents(generateFleetTrucks(60), 120));
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [showFleet, setShowFleet] = useState(true);
  const [showSites, setShowSites] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);

  const productionSites = plantState.data?.production_locations ?? [];
  const mapRoutes = plantState.data?.transport_routes ?? [];

  const selectedTruck = useMemo(
    () => trucks.find((truck) => truck.truckId === selectedTruckId) ?? null,
    [selectedTruckId, trucks],
  );

  const selectedSite = useMemo(
    () => productionSites.find((site) => site.site_id === selectedSiteId) ?? null,
    [selectedSiteId, productionSites],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTrucks((prev) => {
        const updated = prev.map(advanceTruck);
        const eventTruck = updated[Math.floor(Math.random() * updated.length)];
        setEvents((old) => [buildEvent(eventTruck), ...old].slice(0, 160));
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const datasetOverview = plantState.data?.ml?.dataset_overview;
  const confidence = Math.round((plantState.data?.ml?.model_confidence ?? 0.82) * 100);
  const selectedRows = plantState.data?.ml?.selected_data_window?.selected_rows ?? 0;

  return (
    <AppShell title="Fleet Tracker">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4"
      >
        <div className="glass-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Model Confidence</p>
          <p className="font-mono-data text-3xl text-[var(--neon-cyan)]">{confidence}%</p>
        </div>
        <div className="glass-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">ML Selected Rows</p>
          <p className="font-mono-data text-3xl text-[var(--neon-green)]">{selectedRows.toLocaleString()}</p>
        </div>
        <div className="glass-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Production Rows</p>
          <p className="font-mono-data text-3xl text-[var(--neon-cyan)]">{(datasetOverview?.production_rows ?? 50000).toLocaleString()}</p>
        </div>
        <div className="glass-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Transport Rows</p>
          <p className="font-mono-data text-3xl text-[var(--neon-cyan)]">{(datasetOverview?.transport_rows ?? 50000).toLocaleString()}</p>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden p-3"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Integrated Operations Map</h2>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setShowSites((v) => !v)}
                className="micro-hover rounded-full border border-white/15 bg-white/5 px-3 py-1"
              >
                Sites
              </button>
              <button
                onClick={() => setShowCorridors((v) => !v)}
                className="micro-hover rounded-full border border-white/15 bg-white/5 px-3 py-1"
              >
                Corridors
              </button>
              <button
                onClick={() => setShowFleet((v) => !v)}
                className="micro-hover rounded-full border border-white/15 bg-white/5 px-3 py-1"
              >
                Fleet
              </button>
            </div>
          </div>

          <div className="h-[68vh] overflow-hidden rounded-xl border border-white/10">
            <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
              <TileLayer
                attribution='&copy; Stadia Maps, &copy; OpenMapTiles, &copy; OpenStreetMap contributors'
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
              />

              {showSites &&
                productionSites.map((site) => (
                  <CircleMarker
                    key={site.site_id}
                    center={[site.lat, site.lng]}
                    radius={10 + site.utilization * 4}
                    pathOptions={{
                      color: utilizationColor(site.status),
                      fillColor: utilizationColor(site.status),
                      fillOpacity: 0.35,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedSiteId(site.site_id),
                    }}
                  >
                    <Tooltip direction="top" sticky>
                      {site.name} | {(site.utilization * 100).toFixed(0)}%
                    </Tooltip>
                  </CircleMarker>
                ))}

              {showCorridors &&
                mapRoutes.map((route) => (
                  <Polyline
                    key={`${route.route_id}-${route.shipment_id}`}
                    positions={[
                      [route.origin_lat, route.origin_lng],
                      [route.destination_lat, route.destination_lng],
                    ]}
                    pathOptions={{
                      color: STATUS_COLOR[route.status],
                      weight: route.status === "critical" ? 4 : 2.8,
                      opacity: 0.75,
                      dashArray: route.status === "on-time" ? undefined : "8 6",
                    }}
                  />
                ))}

              {showFleet && (
                <MarkerClusterGroup chunkedLoading>
                  {trucks.map((truck) => (
                    <Marker
                      key={truck.truckId}
                      position={[truck.lat, truck.lng]}
                      icon={makeTruckIcon(truck.heading, truck.status)}
                      eventHandlers={{
                        click: () => setSelectedTruckId(truck.truckId),
                      }}
                    />
                  ))}
                </MarkerClusterGroup>
              )}
            </MapContainer>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-card flex h-[calc(68vh+3.25rem)] flex-col p-4"
        >
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Event Feed</h2>
          <div className="space-y-2 overflow-y-auto pr-1">
            {events.map((event) => (
              <div key={event.id} className="micro-hover rounded-lg border border-white/10 bg-black/25 p-2 text-xs">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono-data" style={{ color: STATUS_COLOR[event.status] }}>
                    {event.truckId}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p>{event.message}</p>
              </div>
            ))}
          </div>
        </motion.aside>
      </div>

      <Drawer open={Boolean(selectedTruck) || Boolean(selectedSite)} onOpenChange={(open) => !open && (setSelectedTruckId(null), setSelectedSiteId(null))}>
        <DrawerContent className="border-white/10 bg-[#0f1218]">
          {selectedTruck && (
            <>
              <DrawerHeader>
                <DrawerTitle className="font-mono-data text-[var(--neon-cyan)]">{selectedTruck.truckId} - Driver {selectedTruck.driver}</DrawerTitle>
                <DrawerDescription>
                  {selectedTruck.origin} to {selectedTruck.destination} | Cargo: {selectedTruck.cargo}
                </DrawerDescription>
              </DrawerHeader>

              <div className="grid grid-cols-1 gap-3 px-4 pb-5 md:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs text-muted-foreground">Live ETA Countdown</p>
                  <p className="font-mono-data text-2xl text-[var(--neon-cyan)]">{selectedTruck.etaMinutes} min</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs text-muted-foreground">Speed</p>
                  <p className="font-mono-data text-2xl">{selectedTruck.speedKph.toFixed(0)} kph</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 md:col-span-2">
                  <p className="mb-1 text-xs text-muted-foreground">Fuel Gauge</p>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selectedTruck.fuelLevel}%`,
                        background: selectedTruck.fuelLevel < 25 ? "#ff6b35" : "#00e5ff",
                      }}
                    />
                  </div>
                  <p className="mt-1 font-mono-data text-sm">{selectedTruck.fuelLevel.toFixed(1)}%</p>
                </div>
              </div>
            </>
          )}

          {selectedSite && (
            <>
              <DrawerHeader>
                <DrawerTitle className="font-mono-data text-[var(--neon-green)]">{selectedSite.name}</DrawerTitle>
                <DrawerDescription>
                  {selectedSite.city} | Capacity {selectedSite.capacity_kw} kW
                </DrawerDescription>
              </DrawerHeader>
              <div className="grid grid-cols-1 gap-3 px-4 pb-5 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs text-muted-foreground">Utilization</p>
                  <p className="font-mono-data text-2xl text-[var(--neon-cyan)]">{(selectedSite.utilization * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-mono-data text-2xl" style={{ color: utilizationColor(selectedSite.status) }}>
                    {selectedSite.status}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs text-muted-foreground">Coordinates</p>
                  <p className="font-mono-data text-sm">{selectedSite.lat.toFixed(3)}, {selectedSite.lng.toFixed(3)}</p>
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </AppShell>
  );
}
