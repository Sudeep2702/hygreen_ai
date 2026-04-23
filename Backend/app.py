from flask import Flask
from flask_cors import CORS
from api.routes import api

app = Flask(__name__)
CORS(app)

app.register_blueprint(api)

if __name__ == "__main__":
    from core.scheduler import run
    import threading

    threading.Thread(target=run, daemon=True).start()
    app.run(debug=True)
