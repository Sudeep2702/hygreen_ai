import datetime
import threading
import time

from ai.optimizer import decide
from ai.predictor import predictor
from analytics.carbon import calculate
from core.state import state
from plant.energy import generate_energy
from plant.hydrogen import produce
from plant.storage import store
from plant.transport import distribute


_tick_lock = threading.Lock()
_last_tick_at = 0.0


def advance_state(current_state=state):
    hour = datetime.datetime.now().hour

    current_state.energy = generate_energy()
    current_state.predicted_energy = predictor.predict_energy(hour + 1)
    current_state.demand = predictor.predict_demand(hour)

    current_state.decision = decide(current_state)

    hydrogen = 0.0

    if current_state.decision == "PRODUCE":
        hydrogen = produce(current_state.energy, current_state.efficiency)
        store(current_state, hydrogen)
        current_state.transport = "Idle"
    elif current_state.decision == "DISTRIBUTE":
        distribute(current_state)
    else:
        current_state.transport = "Idle"

    current_state.hydrogen = hydrogen
    current_state.carbon += calculate(hydrogen)

    data_slice = predictor.select_data_window(hour)
    current_state.ml["model_confidence"] = data_slice.confidence
    current_state.ml["selected_data_window"] = {
        "window_start": data_slice.window_start,
        "window_end": data_slice.window_end,
        "selected_rows": data_slice.selected_rows,
    }
    current_state.ml["demand_forecast"] = predictor.forecast_demand(30)
    current_state.ml["production_risk"] = predictor.production_risk_scores(limit=20)
    current_state.ml["transport_recommendations"] = predictor.transport_recommendations(limit=40)
    current_state.ml["dataset_overview"] = predictor.dataset_overview()
    current_state.production_locations = predictor.production_locations()
    current_state.transport_routes = predictor.transport_map_routes(limit=20)

    current_state.logs.insert(0, f"{current_state.decision} | Energy: {current_state.energy} kW")
    current_state.logs = current_state.logs[:5]

    current_state.history.append(
        {
            "time": time.time(),
            "energy": current_state.energy,
            "hydrogen": hydrogen,
        }
    )
    current_state.history = current_state.history[-30:]

    return current_state


def sync_state(interval_seconds=2.0, current_state=state):
    global _last_tick_at

    with _tick_lock:
        now = time.time()
        if not current_state.history or now - _last_tick_at >= interval_seconds:
            advance_state(current_state)
            _last_tick_at = now

        return current_state
