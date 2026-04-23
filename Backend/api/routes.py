from flask import Blueprint, jsonify
from core.state import state

api = Blueprint("api", __name__)

@api.route("/state")
def get_state():
    return jsonify({
        "energy": state.energy,
        "predicted_energy": state.predicted_energy,
        "demand": state.demand,
        "hydrogen": state.hydrogen,
        "storage": state.storage,
        "capacity": state.capacity,
        "decision": state.decision,
        "transport": state.transport,
        "carbon": state.carbon,
        "logs": state.logs[:5],
        "history": state.history,
        "ml": state.ml,
        "production_locations": state.production_locations,
        "transport_routes": state.transport_routes,
    })