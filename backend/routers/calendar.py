from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Tarea
from schemas import AgendarPayload, DesagendarPayload, TareaSchema
from services.calendar_service import get_calendar_service

router = APIRouter(tags=["calendar"])


@router.post("/calendar/agendar-tarea", response_model=TareaSchema)
def agendar_tarea(
    payload: AgendarPayload,
    db: Session = Depends(get_db),
) -> Tarea:
    """
    Schedule a tarea on the calendar:
    1. Creates a Google Calendar event (or mock event).
    2. Persists fecha_agendada, franja_agendada, and google_event_id on the tarea.
    """
    tarea = (
        db.query(Tarea)
        .options(joinedload(Tarea.campo))
        .filter(Tarea.id == payload.tarea_id)
        .first()
    )
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    calendar_service = get_calendar_service()

    # If already scheduled elsewhere, remove the old event first
    if tarea.google_event_id:
        calendar_service.delete_event(tarea.google_event_id)

    event_id = calendar_service.create_event(
        tarea_id=tarea.id,
        titulo=tarea.titulo,
        campo_id=tarea.campo_id,
        fecha=payload.fecha_agendada,
        franja=payload.franja_agendada,
    )

    tarea.fecha_agendada = payload.fecha_agendada
    tarea.franja_agendada = payload.franja_agendada
    tarea.google_event_id = event_id

    db.commit()
    db.refresh(tarea)
    return (
        db.query(Tarea)
        .options(joinedload(Tarea.campo))
        .filter(Tarea.id == tarea.id)
        .one()
    )


@router.post("/calendar/desagendar-tarea", response_model=TareaSchema)
def desagendar_tarea(
    payload: DesagendarPayload,
    db: Session = Depends(get_db),
) -> Tarea:
    """
    Remove a tarea from the calendar:
    1. Deletes the Google Calendar event if one exists.
    2. Clears fecha_agendada, franja_agendada, and google_event_id.
    """
    tarea = (
        db.query(Tarea)
        .options(joinedload(Tarea.campo))
        .filter(Tarea.id == payload.tarea_id)
        .first()
    )
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if tarea.google_event_id:
        calendar_service = get_calendar_service()
        calendar_service.delete_event(tarea.google_event_id)

    tarea.fecha_agendada = None
    tarea.franja_agendada = None
    tarea.google_event_id = None

    db.commit()
    db.refresh(tarea)
    return (
        db.query(Tarea)
        .options(joinedload(Tarea.campo))
        .filter(Tarea.id == tarea.id)
        .one()
    )
