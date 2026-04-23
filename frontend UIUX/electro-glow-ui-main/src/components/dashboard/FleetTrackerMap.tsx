import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { FleetTruck, ProductionLocation, TransportMapRoute } from "@/types/operations";

const STATUS_COLOR = {
  "on-time": "#00e5ff",
  delayed: "#ffb703",
  critical: "#ff6b35",
} as const;

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

function utilizationColor(site: ProductionLocation["status"]) {
  return site === "high-load" ? "#ff6b35" : "#00e5ff";
}

type FleetTrackerMapProps = {
  mapRoutes: TransportMapRoute[];
  productionSites: ProductionLocation[];
  showCorridors: boolean;
  showFleet: boolean;
  showSites: boolean;
  trucks: FleetTruck[];
  onSelectSite: (siteId: string) => void;
  onSelectTruck: (truckId: string) => void;
};

export function FleetTrackerMap({
  mapRoutes,
  onSelectSite,
  onSelectTruck,
  productionSites,
  showCorridors,
  showFleet,
  showSites,
  trucks,
}: FleetTrackerMapProps) {
  return (
    <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
              click: () => onSelectSite(site.site_id),
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
                click: () => onSelectTruck(truck.truckId),
              }}
            />
          ))}
        </MarkerClusterGroup>
      )}
    </MapContainer>
  );
}
