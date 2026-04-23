import math
from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression


CITY_COORDS = {
    "Mumbai": (19.076, 72.8777),
    "Delhi": (28.6139, 77.2090),
    "Bangalore": (12.9716, 77.5946),
    "Chennai": (13.0827, 80.2707),
    "Hyderabad": (17.3850, 78.4867),
    "Pune": (18.5204, 73.8567),
    "Kolkata": (22.5726, 88.3639),
    "Ahmedabad": (23.0225, 72.5714),
}

TRANSPORT_MODES = [
    "Tube Trailer (compressed 700 bar)",
    "Liquid H2 Tanker (-253°C)",
    "Pipeline",
    "Ammonia Carrier (for shipping sector)",
]

DESTINATION_SECTORS = [
    "Steel Plant",
    "Fertilizer Unit",
    "EV Refueling Hub",
    "Remote Microgrid",
    "Shipping Terminal",
    "Industrial Heat Hub",
]

SECTOR_URGENCY = {
    "Steel Plant": 0.92,
    "Fertilizer Unit": 0.78,
    "EV Refueling Hub": 0.88,
    "Remote Microgrid": 0.72,
    "Shipping Terminal": 0.7,
    "Industrial Heat Hub": 0.82,
}


@dataclass
class DataSelectionSlice:
    window_start: int
    window_end: int
    selected_rows: int
    confidence: float


class Predictor:
    def __init__(self):
        self.rng = np.random.default_rng(42)
        self._init_energy_models()
        self._build_large_datasets()
        self._fit_ml_models()

    def _init_energy_models(self):
        hours = np.array([0, 4, 8, 10, 12, 14, 16, 18, 20, 23]).reshape(-1, 1)
        y_energy = np.array([40, 70, 130, 190, 245, 220, 170, 120, 75, 45])
        y_demand = np.array([55, 60, 80, 110, 145, 155, 138, 120, 95, 70])

        self.energy_model = LinearRegression().fit(hours, y_energy)
        self.demand_hour_model = LinearRegression().fit(hours, y_demand)

    def _build_large_datasets(self):
        n = 50000

        demand = []
        base = 420
        for i in range(n):
            seasonality = 1 + 0.14 * math.sin((2 * math.pi * i) / 30)
            promo = 1 if self.rng.random() > 0.9 else 0
            lag1 = demand[i - 1]["demand"] if i > 0 else base
            lag7 = demand[i - 7]["demand"] if i > 6 else base
            rolling = np.mean([d["demand"] for d in demand[max(0, i - 7):i]]) if i > 0 else base
            noise = self.rng.normal(0, 22)
            val = float(np.clip(base * seasonality + lag1 * 0.22 + lag7 * 0.1 + rolling * 0.2 + promo * 36 + noise, 100, 1100))
            demand.append(
                {
                    "day": i + 1,
                    "demand": val,
                    "lag1": lag1,
                    "lag7": lag7,
                    "rolling7": rolling,
                    "seasonality": seasonality,
                    "promotion": promo,
                }
            )

        self.demand_rows = demand

        machine_ids = [f"M-{str(i).zfill(3)}" for i in range(1, 241)]
        production = []
        for i in range(n):
            machine = machine_ids[i % len(machine_ids)]
            downtime = float(np.clip(0.5 + self.rng.random() * 8 + 0.12 * math.sin(i / 40), 0.1, 13))
            defect = float(np.clip(0.004 + self.rng.random() * 0.12, 0.001, 0.35))
            maintenance = int(self.rng.random() > 0.88)
            throughput = float(np.clip(68 + self.rng.random() * 120 - downtime * 2.0, 18, 230))
            oee = float(np.clip(0.84 - defect * 0.8 - downtime * 0.018 + maintenance * 0.03, 0.25, 0.98))
            production.append(
                {
                    "machine_id": machine,
                    "downtime": downtime,
                    "defect": defect,
                    "maintenance": maintenance,
                    "throughput": throughput,
                    "oee": oee,
                }
            )

        self.production_rows = production

        cities = list(CITY_COORDS.keys())
        transport = []
        for i in range(n):
            origin = cities[i % len(cities)]
            destination = cities[(i * 3 + 5) % len(cities)]
            if origin == destination:
                destination = cities[(i + 1) % len(cities)]

            lat1, lng1 = CITY_COORDS[origin]
            lat2, lng2 = CITY_COORDS[destination]
            distance = float(np.clip(math.hypot(lat1 - lat2, lng1 - lng2) * 95, 130, 2200))
            traffic = float(np.clip(0.2 + self.rng.random(), 0.0, 1.0))
            delay = float(np.clip(0.04 + traffic * 0.4 + self.rng.random() * 0.2, 0.02, 0.95))
            fuel_eff = float(np.clip(2.1 + self.rng.random() * 5.8 - traffic * 1.4, 1.4, 8.2))
            destination_sector = DESTINATION_SECTORS[(i * 5 + 3) % len(DESTINATION_SECTORS)]
            sector_urgency = SECTOR_URGENCY[destination_sector]
            h2_volume = float(np.clip(900 + self.rng.random() * 5000 + distance * 0.4, 800, 7000))
            cost_index = float(np.clip((distance / 20) + traffic * 25 + h2_volume / 140, 30, 460))
            safety_risk = float(np.clip(delay * 85 + traffic * 22 + (h2_volume / 7000) * 28, 5, 98))

            transport.append(
                {
                    "route_id": f"R-{str((i % 420) + 1).zfill(3)}",
                    "origin": origin,
                    "destination": destination,
                    "distance": distance,
                    "traffic": traffic,
                    "delay": delay,
                    "fuel_eff": fuel_eff,
                    "destination_sector": destination_sector,
                    "sector_urgency": sector_urgency,
                    "h2_volume_kg": h2_volume,
                    "cost_index": cost_index,
                    "safety_risk": safety_risk,
                    "shipment_id": f"SHP-{str(i + 1).zfill(6)}",
                    "sku": f"SKU-H2-{100 + (i % 60)}",
                }
            )

        self.transport_rows = transport

    def _fit_ml_models(self):
        demand_tail = self.demand_rows[-8000:]
        x_demand = np.array([
            [r["lag1"], r["lag7"], r["rolling7"], r["seasonality"] * 100, r["promotion"]]
            for r in demand_tail
        ])
        y_demand = np.array([r["demand"] for r in demand_tail])
        self.demand_model = RandomForestRegressor(n_estimators=160, random_state=42, n_jobs=-1)
        self.demand_model.fit(x_demand, y_demand)
        self._demand_error = float(np.mean(np.abs(self.demand_model.predict(x_demand) - y_demand)))

        prod_tail = self.production_rows[-12000:]
        x_prod = np.array([[r["downtime"], r["defect"], r["maintenance"], r["throughput"]] for r in prod_tail])
        y_prod = np.array([r["oee"] for r in prod_tail])
        self.production_model = RandomForestRegressor(n_estimators=180, random_state=42, n_jobs=-1)
        self.production_model.fit(x_prod, y_prod)

        tr_tail = self.transport_rows[-12000:]
        x_tr = np.array([[r["delay"], r["distance"], r["traffic"], r["fuel_eff"]] for r in tr_tail])
        y_tr = np.array([100 - r["delay"] * 45 - (r["distance"] / 2000) * 18 - r["traffic"] * 20 + r["fuel_eff"] * 6 for r in tr_tail])
        self.transport_model = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
        self.transport_model.fit(x_tr, y_tr)

        self._mode_to_int = {name: i for i, name in enumerate(TRANSPORT_MODES)}
        self._int_to_mode = {i: name for name, i in self._mode_to_int.items()}

        x_mode = []
        y_mode = []
        for row in tr_tail:
            mode = self._determine_transport_mode(row)
            x_mode.append(
                [
                    row["distance"],
                    row["h2_volume_kg"],
                    row["sector_urgency"],
                    row["cost_index"],
                    row["safety_risk"],
                ]
            )
            y_mode.append(self._mode_to_int[mode])

        self.transport_mode_model = RandomForestClassifier(n_estimators=220, random_state=42, n_jobs=-1)
        self.transport_mode_model.fit(np.array(x_mode), np.array(y_mode))

    def _determine_transport_mode(self, row):
        distance = row["distance"]
        volume = row["h2_volume_kg"]
        urgency = row["sector_urgency"]
        cost = row["cost_index"]
        safety = row["safety_risk"]
        sector = row["destination_sector"]

        if sector == "Shipping Terminal" and distance > 650:
            return "Ammonia Carrier (for shipping sector)"

        if distance < 300 and volume < 1800 and urgency >= 0.8:
            return "Tube Trailer (compressed 700 bar)"

        if volume > 3200 and distance < 850 and safety < 75 and cost < 260:
            return "Pipeline"

        if distance >= 500 or volume > 2200:
            return "Liquid H2 Tanker (-253°C)"

        return "Tube Trailer (compressed 700 bar)"

    def _predict_transport_mode(self, row):
        features = np.array(
            [[
                row["distance"],
                row["h2_volume_kg"],
                row["sector_urgency"],
                row["cost_index"],
                row["safety_risk"],
            ]]
        )
        mode_idx = int(self.transport_mode_model.predict(features)[0])
        return self._int_to_mode[mode_idx]

    def predict_energy(self, hour):
        return float(max(0, self.energy_model.predict([[hour % 24]])[0]))

    def predict_demand(self, hour):
        base = float(self.demand_hour_model.predict([[hour % 24]])[0])
        trend = float(self.demand_rows[-1]["demand"] * 0.2 + self.demand_rows[-7]["demand"] * 0.12)
        return float(max(10, base + trend * 0.02))

    def forecast_demand(self, days=30):
        recent = self.demand_rows[-7:]
        lag1 = recent[-1]["demand"]
        lag7 = recent[0]["demand"]
        rolling7 = float(np.mean([r["demand"] for r in recent]))

        points = []
        for day in range(1, days + 1):
            season = 1 + 0.16 * math.sin((2 * math.pi * day) / 30)
            promo = 1 if day % 8 == 0 else 0
            pred = float(self.demand_model.predict([[lag1, lag7, rolling7, season * 100, promo]])[0])
            ci = self._demand_error * (0.8 + day / 60)

            points.append(
                {
                    "day": day,
                    "forecast": round(pred, 2),
                    "lower": round(max(80, pred - ci), 2),
                    "upper": round(min(1400, pred + ci), 2),
                    "anomaly": abs(pred - rolling7) > self._demand_error * 2.2,
                }
            )

            lag7 = lag1
            lag1 = pred
            rolling7 = (rolling7 * 6 + pred) / 7

        return points

    def select_data_window(self, current_hour):
        end_idx = len(self.demand_rows)
        window = 6000 if 7 <= current_hour <= 20 else 3500
        start_idx = max(0, end_idx - window)

        confidence = 0.76 if window == 6000 else 0.71
        return DataSelectionSlice(
            window_start=start_idx,
            window_end=end_idx,
            selected_rows=window,
            confidence=confidence,
        )

    def production_risk_scores(self, limit=12):
        machine_scores = {}
        for row in self.production_rows[-20000:]:
            machine_scores.setdefault(row["machine_id"], []).append(row)

        scored = []
        for machine_id, rows in machine_scores.items():
            sample = rows[-30:]
            x = np.array([[r["downtime"], r["defect"], r["maintenance"], r["throughput"]] for r in sample])
            pred_oee = float(np.mean(self.production_model.predict(x)))
            avg_downtime = float(np.mean([r["downtime"] for r in sample]))
            avg_defect = float(np.mean([r["defect"] for r in sample]))
            maint = float(np.mean([r["maintenance"] for r in sample]))

            risk_signal = avg_downtime * 0.3 + avg_defect * 4 + maint * 0.2 - pred_oee * 0.8
            failure_prob = 1 / (1 + math.exp(-(risk_signal - 1.7)))
            confidence = float(np.clip(0.57 + len(sample) / 130 - avg_defect * 0.4, 0.5, 0.93))

            scored.append(
                {
                    "machine_id": machine_id,
                    "failure_probability": round(float(np.clip(failure_prob, 0.03, 0.98)), 4),
                    "predicted_oee": round(float(np.clip(pred_oee, 0.25, 0.98)), 4),
                    "confidence": round(confidence, 4),
                }
            )

        scored.sort(key=lambda x: x["failure_probability"], reverse=True)
        return scored[:limit]

    def transport_recommendations(self, limit=20):
        grouped = {}
        for row in self.transport_rows[-30000:]:
            grouped.setdefault(row["shipment_id"], []).append(row)

        recs = []
        for shipment_id, options in list(grouped.items())[:limit * 2]:
            best = None
            best_score = -1e9
            for option in options:
                score = float(
                    self.transport_model.predict([[option["delay"], option["distance"], option["traffic"], option["fuel_eff"]]])[0]
                )
                if score > best_score:
                    best_score = score
                    best = option

            risk = float(np.clip(best["delay"] * 70 + best["traffic"] * 20 + (1 / best["fuel_eff"]) * 10, 5, 100))
            recommended_mode = self._predict_transport_mode(best)
            recs.append(
                {
                    "shipment_id": shipment_id,
                    "sku": best["sku"],
                    "best_route": best["route_id"],
                    "origin": best["origin"],
                    "destination": best["destination"],
                    "destination_sector": best["destination_sector"],
                    "transport_mode": recommended_mode,
                    "distance_km": round(best["distance"], 1),
                    "h2_volume_kg": round(best["h2_volume_kg"], 1),
                    "sector_urgency": round(best["sector_urgency"], 3),
                    "cost_index": round(best["cost_index"], 2),
                    "safety_risk": round(best["safety_risk"], 2),
                    "risk_score": round(risk, 2),
                    "score": round(float(np.clip(best_score, 10, 100)), 2),
                    "confidence": round(float(np.clip(0.56 + best["fuel_eff"] / 10 - best["delay"] / 2, 0.5, 0.95)), 4),
                }
            )

        recs.sort(key=lambda x: x["score"], reverse=True)
        return recs[:limit]

    def production_locations(self):
        sites = [
            ("Mumbai Electrolyzer Park", "Mumbai", 480),
            ("Delhi Green H2 Hub", "Delhi", 420),
            ("Bangalore PEM Plant", "Bangalore", 510),
            ("Chennai Coastal Plant", "Chennai", 460),
            ("Hyderabad Storage Yard", "Hyderabad", 390),
            ("Pune Industrial Stack", "Pune", 355),
        ]

        rows = []
        for idx, (name, city, capacity) in enumerate(sites):
            lat, lng = CITY_COORDS[city]
            utilization = float(np.clip(0.68 + 0.08 * math.sin(idx + len(self.demand_rows) / 1200), 0.45, 0.96))
            rows.append(
                {
                    "site_id": f"SITE-{idx+1}",
                    "name": name,
                    "city": city,
                    "lat": lat,
                    "lng": lng,
                    "capacity_kw": capacity,
                    "utilization": round(utilization, 3),
                    "status": "stable" if utilization < 0.85 else "high-load",
                }
            )

        return rows

    def transport_map_routes(self, limit=18):
        routes = []
        for rec in self.transport_recommendations(limit=limit):
            lat1, lng1 = CITY_COORDS[rec["origin"]]
            lat2, lng2 = CITY_COORDS[rec["destination"]]
            status = "on-time"
            if rec["risk_score"] > 75:
                status = "critical"
            elif rec["risk_score"] > 50:
                status = "delayed"

            routes.append(
                {
                    "route_id": rec["best_route"],
                    "origin": rec["origin"],
                    "destination": rec["destination"],
                    "origin_lat": lat1,
                    "origin_lng": lng1,
                    "destination_lat": lat2,
                    "destination_lng": lng2,
                    "status": status,
                    "shipment_id": rec["shipment_id"],
                }
            )
        return routes

    def dataset_overview(self):
        return {
            "demand_rows": len(self.demand_rows),
            "production_rows": len(self.production_rows),
            "transport_rows": len(self.transport_rows),
            "ml_models": [
                "demand_random_forest",
                "production_oee_random_forest",
                "transport_route_random_forest",
                "transport_mode_random_forest_classifier",
            ],
        }


predictor = Predictor()
