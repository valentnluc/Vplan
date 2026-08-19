from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import HitoTactico, Tarea
from schemas import (
    HitoTacticoCreate,
    HitoTacticoSchema,
    HitoTacticoUpdate,
    TareaSchema,
)

router = APIRouter(tags=["tactica"])


@router.get("/tactica", response_model=List[HitoTacticoSchema])
def list_hitos_tacticos(db: Session = Depends(get_db)) -> List[HitoTactico]:
    """List all tactical milestones with their campo data."""
    return (
        db.query(HitoTactico)
        .options(joinedload(HitoTactico.campo))
        .order_by(HitoTactico.campo_id, HitoTactico.fecha_limite)
        .all()
    )


@router.post(
    "/tactica",
    response_model=HitoTacticoSchema,
    status_code=status.HTTP_201_CREATED,
)
def create_hito_tactico(
    payload: HitoTacticoCreate,
    db: Session = Depends(get_db),
) -> HitoTactico:
    """Create a new tactical milestone."""
    hito = HitoTactico(
        id=str(uuid.uuid4()),
        hito_estrategico_id=payload.hito_estrategico_id,
        campo_id=payload.campo_id,
        titulo=payload.titulo,
        fecha_limite=payload.fecha_limite,
        progreso_manual=payload.progreso_manual or 0.0,
        dependencia_hito_id=payload.dependencia_hito_id,
        estado=payload.estado or "pendiente",
    )
    db.add(hito)
    db.commit()
    db.refresh(hito)
    return (
        db.query(HitoTactico)
        .options(joinedload(HitoTactico.campo))
        .filter(HitoTactico.id == hito.id)
        .one()
    )


@router.patch("/tactica/{hito_id}", response_model=HitoTacticoSchema)
def update_hito_tactico(
    hito_id: str,
    payload: HitoTacticoUpdate,
    db: Session = Depends(get_db),
) -> HitoTactico:
    """Partially update a tactical milestone."""
    hito = db.query(HitoTactico).filter(HitoTactico.id == hito_id).first()
    if not hito:
        raise HTTPException(status_code=404, detail="Hito táctico no encontrado")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hito, field, value)

    db.commit()
    db.refresh(hito)
    return (
        db.query(HitoTactico)
        .options(joinedload(HitoTactico.campo))
        .filter(HitoTactico.id == hito_id)
        .one()
    )


@router.delete("/tactica/{hito_id}", status_code=200)
def delete_hito_tactico(
    hito_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Delete a tactical milestone."""
    hito = db.query(HitoTactico).filter(HitoTactico.id == hito_id).first()
    if not hito:
        raise HTTPException(status_code=404, detail="Hito táctico no encontrado")
    db.delete(hito)
    db.commit()
    return {"deleted": True}


@router.post(
    "/tactica/{hito_id}/desglosar",
    response_model=List[TareaSchema],
    status_code=status.HTTP_201_CREATED,
)
def desglosar_hito_tactico(
    hito_id: str,
    db: Session = Depends(get_db),
) -> List[Tarea]:
    """
    Generate 3 child tareas from a tactical milestone.
    Auto-titled as '{hito.titulo} — Parte 1/2/3'.
    """
    hito = (
        db.query(HitoTactico)
        .options(joinedload(HitoTactico.campo))
        .filter(HitoTactico.id == hito_id)
        .first()
    )
    if not hito:
        raise HTTPException(status_code=404, detail="Hito táctico no encontrado")

    nuevas_tareas: list[Tarea] = []
    for parte in range(1, 4):
        tarea = Tarea(
            id=str(uuid.uuid4()),
            hito_tactico_id=hito_id,
            campo_id=hito.campo_id,
            titulo=f"{hito.titulo} — Parte {parte}",
            duracion_min=60,
            es_deep_work=False,
            completada=False,
            orden=parte,
        )
        db.add(tarea)
        nuevas_tareas.append(tarea)

    db.commit()
    for t in nuevas_tareas:
        db.refresh(t)

    # Re-query with campo loaded
    ids = [t.id for t in nuevas_tareas]
    return (
        db.query(Tarea)
        .options(joinedload(Tarea.campo))
        .filter(Tarea.id.in_(ids))
        .order_by(Tarea.orden)
        .all()
    )
