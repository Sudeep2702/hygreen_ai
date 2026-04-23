def distribute(state):
    if state.storage > 100:
        state.transport = "Dispatching"
        state.storage -= 50
    else:
        state.transport = "Idle"