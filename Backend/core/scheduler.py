import time

from core.simulation import sync_state

def run():
    while True:
        sync_state()
        time.sleep(2)
