from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("vplan.apps_script")

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "..", "workspace_config.json")
DEFAULT_SECRET_KEY = "vplan_secret_key"


class GoogleAppsScriptService:
    """Service to interact with the Google Apps Script Web App Gateway."""

    def __init__(self) -> None:
        self.config_path = os.path.abspath(CONFIG_FILE)
        self._load_config()

    def _load_config(self) -> None:
        self.web_app_url: str = ""
        self.api_key: str = DEFAULT_SECRET_KEY
        self.is_configured: bool = False

        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.web_app_url = data.get("web_app_url", "").strip()
                    self.api_key = data.get("api_key", DEFAULT_SECRET_KEY).strip()
                    self.is_configured = bool(self.web_app_url)
            except Exception as e:
                logger.error(f"Error loading workspace config: {e}")

    def save_config(self, web_app_url: str, api_key: str = DEFAULT_SECRET_KEY) -> dict:
        self.web_app_url = web_app_url.strip()
        self.api_key = api_key.strip() if api_key else DEFAULT_SECRET_KEY
        self.is_configured = bool(self.web_app_url)

        config_data = {
            "web_app_url": self.web_app_url,
            "api_key": self.api_key,
            "is_configured": self.is_configured,
        }
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(config_data, f, indent=2)

        return config_data

    def get_config(self) -> dict:
        self._load_config()
        return {
            "web_app_url": self.web_app_url,
            "api_key": self.api_key,
            "is_configured": self.is_configured,
        }

    def _send_action(self, action: str, payload: dict, custom_url: Optional[str] = None, custom_key: Optional[str] = None) -> dict:
        url = (custom_url or self.web_app_url).strip()
        key = (custom_key or self.api_key).strip()

        if not url:
            return {"success": False, "error": "Debes ingresar la URL de la Aplicación Web de Google Apps Script"}

        if "script.googleusercontent.com" in url:
            return {
                "success": False,
                "error": "La URL pegada es una redirección temporal de Google. Debes copiar la 'URL de la aplicación web' que empieza con 'https://script.google.com/macros/s/...' y termina en '/exec'.",
            }

        body = {
            "api_key": key,
            "action": action,
            "payload": payload,
        }

        try:
            # Google Apps Script redirects with 302, follow_redirects=True is required
            with httpx.Client(timeout=15.0, follow_redirects=True) as client:
                response = client.post(url, json=body)
                if response.status_code == 200:
                    try:
                        return response.json()
                    except Exception:
                        return {"success": True, "raw_response": response.text}
                elif response.status_code in (404, 405):
                    return {
                        "success": False,
                        "status_code": response.status_code,
                        "error": "No se pudo acceder al script (HTTP " + str(response.status_code) + "). Verifica que la implementación esté configurada con acceso para 'Cualquier usuario' (Anyone) y termine en /exec.",
                    }
                else:
                    return {
                        "success": False,
                        "status_code": response.status_code,
                        "error": f"Error HTTP {response.status_code} desde Google Apps Script.",
                    }
        except httpx.TimeoutException:
            return {"success": False, "error": "Tiempo de espera agotado al conectar con Google (Timeout)."}
        except Exception as e:
            logger.error(f"Apps Script communication error: {e}")
            return {"success": False, "error": str(e)}

    # ── Test Connection ────────────────────────────────────────────────────────
    def test_connection(self, custom_url: Optional[str] = None, custom_key: Optional[str] = None) -> dict:
        return self._send_action("test_connection", {}, custom_url=custom_url, custom_key=custom_key)

    # ── 1. Estratégico ➔ Google Sheets 'V - Estrategico' ──────────────────────
    def sync_estrategico(self, hito: dict) -> dict:
        return self._send_action("sync_estrategico", hito)

    def delete_estrategico(self, hito_id: str) -> dict:
        return self._send_action("delete_estrategico", {"id": hito_id})

    def sync_all_estrategicos(self, hitos: List[dict]) -> dict:
        return self._send_action("sync_all_estrategicos", {"hitos": hitos})

    # ── 2. Táctico ➔ Google Calendar 'V - Tactico' ───────────────────────────
    def sync_tactico(self, hito_tactico: dict) -> dict:
        return self._send_action("sync_tactico", hito_tactico)

    def delete_tactico(self, google_event_id: str) -> dict:
        return self._send_action("delete_tactico", {"google_event_id": google_event_id})

    # ── 3. Trinchera ➔ Google Tasks 'V - Tareas' ──────────────────────────────
    def sync_tarea(self, tarea: dict) -> dict:
        return self._send_action("sync_tarea", tarea)

    def toggle_tarea(self, google_task_id: str, completada: bool) -> dict:
        return self._send_action("toggle_tarea", {"google_task_id": google_task_id, "completada": completada})

    def delete_tarea(self, google_task_id: str) -> dict:
        return self._send_action("delete_tarea", {"google_task_id": google_task_id})

    # ── 4. Pull State from Google Workspace ───────────────────────────────────
    def get_workspace_state(self) -> dict:
        return self._send_action("get_workspace_state", {})


# Singleton instance
workspace_service = GoogleAppsScriptService()

