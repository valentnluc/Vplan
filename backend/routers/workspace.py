from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
from models import HitoEstrategico, HitoTactico, Tarea, Campo
from services.google_apps_script_service import workspace_service

router = APIRouter(prefix="/workspace", tags=["workspace"])


class WorkspaceConfigurePayload(BaseModel):
    web_app_url: str
    api_key: Optional[str] = "vplan_secret_key"


class WorkspaceTestPayload(BaseModel):
    web_app_url: Optional[str] = None
    api_key: Optional[str] = None


@router.get("/status")
def get_workspace_status():
    """Returns the current Google Workspace configuration and connection status."""
    config = workspace_service.get_config()
    return {
        "is_configured": config["is_configured"],
        "web_app_url": config["web_app_url"],
        "api_key": config["api_key"],
    }


@router.post("/configure")
def configure_workspace(payload: WorkspaceConfigurePayload):
    """Saves the Google Apps Script Web App URL and secret API Key."""
    result = workspace_service.save_config(payload.web_app_url, payload.api_key or "vplan_secret_key")
    return {"saved": True, "config": result}


@router.post("/test")
def test_workspace(payload: WorkspaceTestPayload):
    """Sends a ping test to Google Apps Script and verifies Sheet, Calendar and Tasks containers."""
    res = workspace_service.test_connection(payload.web_app_url, payload.api_key)
    return res


@router.post("/sync-all")
def sync_all_workspace(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Triggers an automatic full sync of all local data into Google Workspace."""
    if not workspace_service.is_configured:
        raise HTTPException(status_code=400, detail="Google Workspace no está configurado")

    # 1. Gather all strategic hitos
    estrategicos = db.query(HitoEstrategico).all()
    campos_map = {c.id: c.nombre for c in db.query(Campo).all()}
    
    estrategicos_data = [
        {
            "id": h.id,
            "campo_id": h.campo_id,
            "campo_nombre": campos_map.get(h.campo_id, ""),
            "titulo": h.titulo,
            "fecha_inicio": h.fecha_inicio.isoformat() if h.fecha_inicio else "",
            "fecha_target": h.fecha_target.isoformat() if h.fecha_target else "",
            "estado": h.estado,
            "orden": h.orden,
        }
        for h in estrategicos
    ]

    # 2. Gather all tactical hitos
    tacticos = db.query(HitoTactico).all()
    tacticos_data = [
        {
            "id": ht.id,
            "titulo": ht.titulo,
            "campo_id": ht.campo_id,
            "fecha_limite": ht.fecha_limite.isoformat() if ht.fecha_limite else "",
            "hora_limite": ht.hora_limite or "10:00",
            "google_event_id": ht.id,
        }
        for ht in tacticos
    ]

    # 3. Gather all pending tasks
    tareas = db.query(Tarea).all()
    tareas_data = [
        {
            "id": t.id,
            "titulo": t.titulo,
            "campo_id": t.campo_id,
            "duracion_min": t.duracion_min,
            "descripcion": t.descripcion,
            "completada": t.completada,
            "fecha_agendada": t.fecha_agendada.isoformat() if t.fecha_agendada else None,
            "google_task_id": t.google_event_id,
        }
        for t in tareas
    ]

    def _do_full_sync():
        workspace_service.sync_all_estrategicos(estrategicos_data)
        for ht in tacticos_data:
            workspace_service.sync_tactico(ht)
        for tr in tareas_data:
            workspace_service.sync_tarea(tr)

    background_tasks.add_task(_do_full_sync)

    return {
        "syncing": True,
        "estrategicos_count": len(estrategicos_data),
        "tacticos_count": len(tacticos_data),
        "tareas_count": len(tareas_data),
    }


@router.post("/pull")
def pull_workspace_changes(db: Session = Depends(get_db)):
    """
    Pulls changes from Google Workspace (Tasks completed in mobile, Calendar events, Sheets)
    and reconciles them with the local database.
    """
    if not workspace_service.is_configured:
        raise HTTPException(status_code=400, detail="Google Workspace no está configurado")

    res = workspace_service.get_workspace_state()
    if not res.get("success") and "data" not in res:
        return {"success": False, "error": res.get("error", "No se pudo obtener estado de Google")}

    data = res.get("data", res)
    updated_tasks = 0
    updated_tacticos = 0
    updated_estrategicos = 0

    # 1. Reconcile Tasks (completed status from Google Tasks)
    google_tasks = data.get("tasks", [])
    for gt in google_tasks:
        vplan_id = gt.get("vplan_id")
        gt_id = gt.get("google_task_id")
        gt_status = gt.get("status")  # "completed" | "needsAction"

        tarea = None
        if vplan_id:
            tarea = db.query(Tarea).filter(Tarea.id == vplan_id).first()
        if not tarea and gt_id:
            tarea = db.query(Tarea).filter(Tarea.google_event_id == gt_id).first()

        if tarea:
            is_completed_in_google = (gt_status == "completed")
            if tarea.completada != is_completed_in_google:
                tarea.completada = is_completed_in_google
                updated_tasks += 1

    # 2. Reconcile Strategic Milestones from Google Sheet
    sheet_rows = data.get("sheet_rows", [])
    for row in sheet_rows:
        row_id = row.get("id")
        if row_id:
            hito_est = db.query(HitoEstrategico).filter(HitoEstrategico.id == row_id).first()
            if hito_est:
                if row.get("titulo") and hito_est.titulo != row["titulo"]:
                    hito_est.titulo = row["titulo"]
                    updated_estrategicos += 1

    db.commit()

    return {
        "success": True,
        "updated_tasks": updated_tasks,
        "updated_tacticos": updated_tacticos,
        "updated_estrategicos": updated_estrategicos,
        "message": f"Sincronización bidireccional completada: {updated_tasks} tareas actualizadas.",
    }

