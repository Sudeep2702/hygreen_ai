from flask import Blueprint, jsonify
from core.simulation import sync_state

api = Blueprint("api", __name__)

@api.route("/state")
def get_state():
    current_state = sync_state()
    return jsonify({
        "energy": current_state.energy,
        "predicted_energy": current_state.predicted_energy,
        "demand": current_state.demand,
        "hydrogen": current_state.hydrogen,
        "storage": current_state.storage,
        "capacity": current_state.capacity,
        "efficiency": current_state.efficiency,
        "decision": current_state.decision,
        "transport": current_state.transport,
        "carbon": current_state.carbon,
        "logs": current_state.logs[:5],
        "history": current_state.history,
        "ml": current_state.ml,
        "production_locations": current_state.production_locations,
        "transport_routes": current_state.transport_routes,
    })


@api.route("/health")
def health():
    return jsonify({"status": "ok"})
