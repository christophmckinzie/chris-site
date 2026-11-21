import os

import dotenv
from flask import Flask, abort, jsonify, request, send_from_directory, url_for
from werkzeug.security import safe_join

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "..", "web", "dist")

# weather.py reads its icons from a relative "static/" path and the map is saved
# there too, so always run from this folder no matter where the server was started.
os.chdir(BASE_DIR)
dotenv.load_dotenv(os.path.join(BASE_DIR, ".env"))

import weather  # noqa: E402  (needs the chdir and .env above)

app = Flask(__name__)


@app.route("/api/generate-weather-map", methods=["POST"])
def generate_weather_map():
    """
    Builds the weather-along-route folium map, saves it to static/map.html
    and returns its URL.
    """
    data = request.get_json(silent=True) or {}
    try:
        start, end, date = data["start"], data["end"], data["date"]
    except KeyError:
        return jsonify({"error": "start, end and date are required"}), 400

    try:
        w = weather.WeatherMapping(start, end, date)
        m = w.create_map()
        m.save(os.path.join(BASE_DIR, "static", "map.html"))
    except Exception:
        app.logger.exception("weather map generation failed")
        return jsonify({"error": "could not generate map"}), 500

    return jsonify({"map_url": url_for("static", filename="map.html")})


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def spa(path):
    """
    Serves the built Solid app. Real files (JS, CSS, images) are returned as-is;
    anything else gets index.html so /quiz and /weather-routing work on reload.
    """
    if path.startswith("api/"):
        abort(404)
    if not os.path.isfile(os.path.join(DIST_DIR, "index.html")):
        return "Frontend not built yet. Run `npm run build` in web/.", 503
    if path:
        candidate = safe_join(DIST_DIR, path)
        if candidate and os.path.isfile(candidate):
            return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, "index.html")


if __name__ == "__main__":
    app.run(
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG") == "1",
    )
