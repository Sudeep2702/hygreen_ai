class SystemState:
    def __init__(self):
        self.energy = 0
        self.predicted_energy = 0
        self.demand = 0

        self.hydrogen = 0
        self.storage = 500
        self.capacity = 1000

        self.efficiency = 0.85
        self.decision = "IDLE"

        self.transport = "Idle"
        self.carbon = 0

        self.logs = []
        self.history = []

        # ML + operations intelligence (non-breaking additions)
        self.ml = {
            "model_confidence": 0.0,
            "selected_data_window": {"window_start": 0, "window_end": 0, "selected_rows": 0},
            "demand_forecast": [],
            "production_risk": [],
            "transport_recommendations": [],
            "dataset_overview": {},
        }

        # Geospatial operations data for production + logistics map views
        self.production_locations = []
        self.transport_routes = []

state = SystemState()