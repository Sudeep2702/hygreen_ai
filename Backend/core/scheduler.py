import time
import datetime
from core.state import state
from plant.energy import generate_energy
from plant.hydrogen import produce
from plant.storage import store
from plant.transport import distribute
from ai.predictor import predictor
from ai.optimizer import decide
from analytics.carbon import calculate

def run():
    tick = 0
    while True:
        tick += 1
        hour = datetime.datetime.now().hour

        # Energy + ML
        state.energy = generate_energy()
        state.predicted_energy = predictor.predict_energy(hour+1)
        state.demand = predictor.predict_demand(hour)

        # Decision
        state.decision = decide(state)

        hydrogen = 0

        if state.decision == "PRODUCE":
            hydrogen = produce(state.energy, state.efficiency)
            store(state, hydrogen)

        elif state.decision == "DISTRIBUTE":
            distribute(state)

        # Update hydrogen production
        state.hydrogen = hydrogen

        # Carbon
        state.carbon += calculate(hydrogen)

        # ML intelligence + geospatial map payloads
        data_slice = predictor.select_data_window(hour)
        state.ml["model_confidence"] = data_slice.confidence
        state.ml["selected_data_window"] = {
            "window_start": data_slice.window_start,
            "window_end": data_slice.window_end,
            "selected_rows": data_slice.selected_rows,
        }

        if tick % 3 == 0:
            state.ml["demand_forecast"] = predictor.forecast_demand(30)
            state.ml["production_risk"] = predictor.production_risk_scores(limit=20)
            state.ml["transport_recommendations"] = predictor.transport_recommendations(limit=40)
            state.ml["dataset_overview"] = predictor.dataset_overview()
            state.production_locations = predictor.production_locations()
            state.transport_routes = predictor.transport_map_routes(limit=20)

        # Logs
        state.logs.insert(0, f"{state.decision} | Energy: {state.energy} kW")

        # Graph data
        state.history.append({
            "time": time.time(),
            "energy": state.energy,
            "hydrogen": hydrogen
        })

        if len(state.history) > 30:
            state.history.pop(0)

        time.sleep(2)