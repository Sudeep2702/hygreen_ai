def store(state, hydrogen):
    state.storage = min(state.capacity, state.storage + hydrogen)