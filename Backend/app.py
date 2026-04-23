from flask import Flask
from flask_cors import CORS
from api.routes import api
from core.scheduler import run
import threading

app = Flask(__name__)
CORS(app)

app.register_blueprint(api)

# Run simulation in background
threading.Thread(target=run, daemon=True).start()

if __name__ == "__main__":
    app.run(debug=True)