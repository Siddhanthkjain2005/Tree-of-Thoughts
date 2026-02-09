"""
Simple Flask app to view experiment/demo results stored in SQLite.

Run:
    python3 -m webapp.server
Then open http://localhost:5000/
"""
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS

from core import storage

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app, resources={r"/api/*": {"origins": "*"}}, allow_headers=["Content-Type", "Authorization", "ngrok-skip-browser-warning"])


@app.route("/api/summary")
def api_summary():
    storage.init_db()
    summary = storage.fetch_summary()
    
    # Generate stats in words
    methods = summary.get("method_summary", [])
    if methods:
        top_method = methods[0]
        stats_text = f"The {top_method['method'].upper()} method is currently leading with an average score of {top_method['avg_score']:.1f}% " \
                     f"and a success rate of {top_method['success_rate']:.1f}%. "
        if len(methods) > 1:
            bottom_method = methods[-1]
            stats_text += f"Compared to {bottom_method['method'].upper()} which scores {bottom_method['avg_score']:.1f}%."
    else:
        stats_text = "No experimental data available yet."
    
    summary["stats_in_words"] = stats_text
    return jsonify(summary)


@app.route("/api/sessions/<int:session_id>/summary")
def api_session_summary(session_id: int):
    storage.init_db()
    return jsonify({
        "size_summary": storage.fetch_session_size_summary(session_id)
    })


@app.route("/api/sessions/<int:session_id>", methods=["DELETE"])
def api_delete_session(session_id: int):
    storage.init_db()
    storage.delete_session(session_id)
    return jsonify({"status": "deleted", "id": session_id})


@app.route("/api/trials/<int:session_id>")
def api_trials(session_id: int):
    storage.init_db()
    return jsonify({"trials": storage.fetch_trials(session_id)})


@app.route("/api/conditions/<int:session_id>")
def api_conditions(session_id: int):
    storage.init_db()
    return jsonify({"conditions": storage.fetch_conditions(session_id)})


@app.route("/api/models")
def api_models():
    storage.init_db()
    return jsonify({"models": storage.fetch_model_overview()})


@app.route("/api/model/<provider>/<path:model>/trials")
def api_model_trials(provider: str, model: str):
    storage.init_db()
    return jsonify({"trials": storage.fetch_model_trials(provider, model)})


@app.route("/api/model/<provider>/<path:model>/methods")
def api_model_methods(provider: str, model: str):
    storage.init_db()
    return jsonify({"methods": storage.fetch_model_method_summary(provider, model)})


@app.route("/api/model/<provider>/<path:model>/sessions")
def api_model_sessions(provider: str, model: str):
    storage.init_db()
    return jsonify({
        "sessions": storage.fetch_model_sessions_detailed(provider, model),
        "size_summary": storage.fetch_model_size_summary(provider, model)
    })


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
