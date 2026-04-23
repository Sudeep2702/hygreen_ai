import random
import datetime

def generate_energy():
    hour = datetime.datetime.now().hour

    solar = max(0, (hour-6)*20) if 6 <= hour <= 18 else 0
    wind = random.randint(40, 80)
    hydro = 80

    return solar + wind + hydro