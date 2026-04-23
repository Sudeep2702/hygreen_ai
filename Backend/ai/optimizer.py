def decide(state):
    if state.storage > 900:
        return "SLOW_PRODUCTION"

    if state.energy > 200 and state.storage < state.capacity:
        return "PRODUCE"

    if state.demand > 120:
        return "DISTRIBUTE"

    return "IDLE"