"""
Lightweight SQLite storage for experiment and demo runs.
"""
import json
import os
import sqlite3
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Tuple

from config.settings import RESULTS_DB_PATH, LLM_PROVIDER, MODEL_NAME


SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL,
    provider TEXT,
    model TEXT,
    config_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    size INTEGER,
    method TEXT,
    trial INTEGER,
    score REAL,
    completeness REAL,
    consistency REAL,
    reasoning REAL,
    success INTEGER,
    tokens INTEGER,
    time REAL,
    response TEXT,
    variables_found INTEGER,
    assignments TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    size INTEGER,
    method TEXT,
    mean_score REAL,
    std_score REAL,
    min_score REAL,
    max_score REAL,
    success_rate REAL,
    mean_tokens REAL,
    total_tokens INTEGER,
    mean_time REAL,
    total_time REAL,
    num_trials INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
);
"""


def _connect() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(RESULTS_DB_PATH), exist_ok=True)
    conn = sqlite3.connect(RESULTS_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, coldef: str) -> None:
    cols = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
    if column not in cols:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {coldef}")


def _backfill_provider_model(conn: sqlite3.Connection) -> None:
    """Fill missing provider/model with current defaults for legacy rows."""
    conn.execute(
        """
        UPDATE sessions
        SET provider = COALESCE(provider, ?),
            model    = COALESCE(model, ?)
        WHERE (provider IS NULL OR provider = '')
           OR (model IS NULL OR model = '')
        """,
        (LLM_PROVIDER, MODEL_NAME),
    )


def init_db() -> None:
    """Ensure tables exist."""
    with _connect() as conn:
        conn.executescript(SCHEMA)
        # Lightweight migrations for legacy DBs missing newer columns
        _ensure_column(conn, "sessions", "provider", "TEXT")
        _ensure_column(conn, "sessions", "model", "TEXT")
        _ensure_column(conn, "sessions", "config_json", "TEXT")
        _backfill_provider_model(conn)
        # conditions table is created above; no extra columns yet
        conn.commit()


def create_session(mode: str, provider: str, model: str, config: Dict[str, Any]) -> int:
    """Insert a session record and return its id."""
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO sessions (mode, provider, model, config_json, created_at) VALUES (?, ?, ?, ?, ?)",
            (mode, provider, model, json.dumps(config), datetime.utcnow().isoformat()),
        )
        conn.commit()
        return int(cur.lastrowid)


def insert_trial(
    session_id: int,
    size: Optional[int],
    method: str,
    trial_num: int,
    result: Dict[str, Any],
    response_text: Optional[str] = None,
) -> None:
    """Insert a single trial row."""
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO trials (
                session_id, size, method, trial, score, completeness, consistency,
                reasoning, success, tokens, time, response, variables_found, assignments, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                size,
                method,
                trial_num,
                result.get("score"),
                result.get("completeness"),
                result.get("consistency"),
                result.get("reasoning"),
                int(result.get("success", False)),
                result.get("tokens"),
                result.get("time"),
                response_text or result.get("response"),
                result.get("variables_found"),
                json.dumps(result.get("assignments")),
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()


def insert_condition(session_id: int, size: int, method: str, stats: Dict[str, Any]) -> None:
    """Insert aggregated condition stats (per size+method)."""
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO conditions (
                session_id, size, method,
                mean_score, std_score, min_score, max_score,
                success_rate, mean_tokens, total_tokens,
                mean_time, total_time, num_trials, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                size,
                method,
                stats["scores"]["mean"],
                stats["scores"]["std"],
                stats["scores"]["min"],
                stats["scores"]["max"],
                stats["success_rate"],
                stats["tokens"]["mean"],
                stats["tokens"]["total"],
                stats["time"]["mean"],
                stats["time"]["total"],
                stats["num_trials"],
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()


def fetch_summary(limit_sessions: int = 10) -> Dict[str, Any]:
    """Aggregate basic stats for API/visuals (experiment sessions only)."""
    with _connect() as conn:
        sessions = conn.execute(
            """
            SELECT id, mode, provider, model, created_at
            FROM sessions
            WHERE mode = 'experiment'
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit_sessions,),
        ).fetchall()

        method_summary = conn.execute(
            """
            SELECT CASE WHEN t.method LIKE 'det%' THEN 'det' ELSE t.method END AS method,
                   COUNT(*) AS runs,
                   AVG(t.score) AS avg_score,
                   AVG(t.success) * 100.0 AS success_rate,
                   AVG(t.tokens) AS avg_tokens,
                   AVG(t.time) AS avg_time
            FROM trials t
            JOIN sessions s ON s.id = t.session_id
            WHERE s.mode = 'experiment'
            GROUP BY 1
            ORDER BY avg_score DESC
            """
        ).fetchall()

        size_summary = conn.execute(
            """
            SELECT t.size, 
                   CASE WHEN t.method LIKE 'det%' THEN 'det' ELSE t.method END AS method,
                   AVG(t.score) AS avg_score,
                   AVG(t.success) * 100.0 AS success_rate
            FROM trials t
            JOIN sessions s ON s.id = t.session_id
            WHERE s.mode = 'experiment'
            GROUP BY t.size, 2
            ORDER BY t.size, 2
            """
        ).fetchall()

        return {
            "sessions": [dict(r) for r in sessions],
            "method_summary": [dict(r) for r in method_summary],
            "size_summary": [dict(r) for r in size_summary],
        }


def fetch_trials(session_id: int) -> List[Dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM trials WHERE session_id = ? ORDER BY trial ASC", (session_id,)
        ).fetchall()
        return [dict(r) for r in rows]


def fetch_conditions(session_id: int) -> List[Dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM conditions WHERE session_id = ? ORDER BY size, method", (session_id,)
        ).fetchall()
        return [dict(r) for r in rows]


def fetch_model_overview() -> List[Dict[str, Any]]:
    """Aggregate across all sessions grouped by provider/model."""
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT s.provider,
                   s.model,
                   COUNT(t.id) AS total_trials,
                   AVG(t.score) AS avg_score,
                   AVG(t.success) * 100.0 AS success_rate,
                   AVG(t.tokens) AS avg_tokens,
                   MAX(s.created_at) AS last_run
            FROM trials t
            JOIN sessions s ON s.id = t.session_id
            WHERE s.mode = 'experiment'
            GROUP BY s.provider, s.model
            ORDER BY last_run DESC
            """
        ).fetchall()
        return [dict(r) for r in rows]


def fetch_model_trials(provider: str, model: str) -> List[Dict[str, Any]]:
    """Return all trials for a given provider/model across sessions."""
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT t.*, s.created_at AS session_created
            FROM trials t
            JOIN sessions s ON s.id = t.session_id
            WHERE s.provider = ? AND s.model = ? AND s.mode = 'experiment'
            ORDER BY s.created_at, t.trial
            """,
            (provider, model),
        ).fetchall()
        return [dict(r) for r in rows]


def fetch_model_method_summary(provider: str, model: str) -> List[Dict[str, Any]]:
    """Aggregate per-method stats for a given model across sessions."""
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT CASE WHEN t.method LIKE 'det%' THEN 'det' ELSE t.method END AS method,
                   COUNT(*) AS runs,
                   AVG(t.score) AS avg_score,
                   AVG(t.success) * 100.0 AS success_rate,
                   AVG(t.tokens) AS avg_tokens,
                   AVG(t.time) AS avg_time
            FROM trials t
            JOIN sessions s ON s.id = t.session_id
            WHERE s.provider = ? AND s.model = ? AND s.mode = 'experiment'
            GROUP BY 1
            ORDER BY avg_score DESC
            """,
            (provider, model),
        ).fetchall()
        return [dict(r) for r in rows]


def fetch_sessions_by_model(provider: str, model: str) -> List[Dict[str, Any]]:
    """List experiment sessions for a provider/model."""
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, mode, provider, model, created_at
            FROM sessions
            WHERE mode = 'experiment' AND provider = ? AND model = ?
            ORDER BY created_at DESC
            """,
            (provider, model),
        ).fetchall()
        return [dict(r) for r in rows]


def fetch_model_sessions_detailed(provider: str, model: str) -> List[Dict[str, Any]]:
    """Fetch detailed performance stats for each session of a model, splitting by method."""
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT s.id, s.created_at, 
                   COUNT(t.id) as total_trials,
                   AVG(t.score) as avg_score,
                   AVG(t.success) * 100.0 as success_rate,
                   AVG(CASE WHEN t.method LIKE 'det%' THEN t.score END) as det_score,
                   AVG(CASE WHEN t.method LIKE 'det%' THEN t.success END) * 100.0 as det_success,
                   AVG(CASE WHEN t.method = 'linear' THEN t.score END) as linear_score,
                   AVG(CASE WHEN t.method = 'linear' THEN t.success END) * 100.0 as linear_success
            FROM sessions s
            LEFT JOIN trials t ON s.id = t.session_id
            WHERE s.provider = ? AND s.model = ? AND s.mode = 'experiment'
            GROUP BY s.id
            ORDER BY s.created_at DESC
            """,
            (provider, model),
        ).fetchall()
        return [dict(r) for r in rows]


def fetch_model_size_summary(provider: str, model: str) -> List[Dict[str, Any]]:
    """Aggregate per-size and per-method stats for a model across all its experiments."""
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT t.size, 
                   CASE WHEN t.method LIKE 'det%' THEN 'det' ELSE t.method END AS method,
                   AVG(t.score) AS avg_score,
                   AVG(t.success) * 100.0 AS success_rate,
                   AVG(t.tokens) AS avg_tokens,
                   AVG(t.time) AS avg_time
            FROM trials t
            JOIN sessions s ON s.id = t.session_id
            WHERE s.provider = ? AND s.model = ? AND s.mode = 'experiment'
            GROUP BY t.size, 2
            ORDER BY t.size, 2
            """,
            (provider, model),
        ).fetchall()
        return [dict(r) for r in rows]


def fetch_session_size_summary(session_id: int) -> List[Dict[str, Any]]:
    """Aggregate per-size and per-method stats for a specific session."""
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT t.size, 
                   CASE WHEN t.method LIKE 'det%' THEN 'det' ELSE t.method END AS method,
                   AVG(t.score) AS avg_score,
                   AVG(t.success) * 100.0 AS success_rate,
                   AVG(t.tokens) AS avg_tokens,
                   AVG(t.time) AS avg_time
            FROM trials t
            WHERE t.session_id = ?
            GROUP BY t.size, 2
            ORDER BY t.size, 2
            """,
            (session_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def delete_session(session_id: int) -> None:
    """Delete a session and all associated trials/conditions."""
    with _connect() as conn:
        conn.execute("DELETE FROM trials WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM conditions WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
