from __future__ import annotations

import uuid
from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Tarea
from schemas import CapturaPayload, TareaSchema, TareaUpdate

router = APIRouter(tags=["trinchera"])


@router.get("/trinchera/pendientes", response_model=List[TareaSchema])
def get_pendientes(db: Session = Depends(get_db)) -> List[Tarea]:
    """
    Return all tareas that are not completed and have no scheduled date,
    ordered by orden ascending.
    """
    return (
        db.query(Tarea)
        .options(joinedload(Tarea.campo))
        .filter(Tarea.completada == False, Tarea.fecha_agendada == None)  # noqa: E711, E712
        .order_by(Tarea.orden)
        .all()
    )


@router.get("/trinchera/semana", response_model=List[TareaSchema])
def get_semana(
    start_date: str = Query(..., description="ISO date string (YYYY-MM-DD) for the first day of the week"),
    db: Session = Depends(get_db),
) -> List[Tarea]:
    """
    Return all tareas scheduled within 7 days starting from start_date (inclusive).
    """
    try:
        week_start = date.fromisoformat(start_date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid start_date format: '{start_date}'. Expected YYYY-MM-DD.",
        )
    week_end = week_start + timedelta(days=6)
    return (
        db.query(Tarea)
        .options(joinedload(Tarea.campo))
        .filter(
            Tarea.fecha_agendada >= week_start,
            Tarea.fecha_agendada <= week_end,
        )
        .order_by(Tarea.fecha_agendada, Tarea.franja_agendada, Tarea.orden)
        .all()
    )


@router.post(
    "/trinchera/captura",
    response_model=TareaSchema,
    status_code=status.HTTP_201_CREATED,
)
def captura_tarea(
    payload: CapturaPayload,
    db: Session = Depends(get_db),
) -> Tarea:
    """
    Quick-capture a new tarea. campo_id defaults to '07' (Sistemas y Entorno)
    if not provided, acting as an inbox.
    """
    campo_id = payload.campo_id or "07"
    tarea = Tarea(
        id=str(uuid.uuid4()),
        hito_tactico_id=payload.hito_tactico_id,
        campo_id=campo_id,
        titulo=payload.titulo,
        duracion_min=payload.duracion_min if payload.duracion_min is not None else 60,
        es_deep_work=payload.es_deep_work if payload.es_deep_work is not None else False,
        fecha_agendada=payload.fecha_agendada,
        completada=False,
        orden=0,
    )
    db.add(tarea)
    db.commit()
    db.refresh(tarea)
    return (
        db.query(Tarea)
        .options(joinedload(Tarea.campo))
        .filter(Tarea.id == tarea.id)
        .one()
    )


@router.patch("/trinchera/tareas/{tarea_id}", response_model=TareaSchema)
def update_tarea(
    tarea_id: str,
    payload: TareaUpdate,
    db: Session = Depends(get_db),
) -> Tarea:
    """Partially update any field of a tarea (completada, orden, fechas, etc.)."""
    tarea = db.query(Tarea).filter(Tarea.id == tarea_id).first()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tarea, field, value)

    db.commit()
    db.refresh(tarea)
    return (
        db.query(Tarea)
        .options(joinedload(Tarea.campo))
        .filter(Tarea.id == tarea_id)
        .one()
    )


@router.delete("/trinchera/tareas/{tarea_id}", status_code=200)
def delete_tarea(
    tarea_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Permanently delete a tarea."""
    tarea = db.query(Tarea).filter(Tarea.id == tarea_id).first()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    db.delete(tarea)
    db.commit()
    return {"deleted": True}
