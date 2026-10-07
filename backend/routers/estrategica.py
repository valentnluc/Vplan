from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import HitoEstrategico, Campo
from schemas import (
    HitoEstrategicoCreate,
    HitoEstrategicoSchema,
    HitoEstrategicoUpdate,
)
from services.google_apps_script_service import workspace_service

router = APIRouter(tags=["estrategica"])


@router.get("/estrategica", response_model=List[HitoEstrategicoSchema])
def list_hitos_estrategicos(db: Session = Depends(get_db)) -> List[HitoEstrategico]:
    """List all strategic milestones with their campo data."""
    return (
        db.query(HitoEstrategico)
        .options(joinedload(HitoEstrategico.campo))
        .order_by(HitoEstrategico.campo_id, HitoEstrategico.orden)
        .all()
    )


@router.post(
    "/estrategica",
    response_model=HitoEstrategicoSchema,
    status_code=status.HTTP_201_CREATED,
)
def create_hito_estrategico(
    payload: HitoEstrategicoCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> HitoEstrategico:
    """Create a new strategic milestone and sync to V - Estrategico."""
    hito = HitoEstrategico(
        id=str(uuid.uuid4()),
        campo_id=payload.campo_id,
        titulo=payload.titulo,
        fecha_inicio=payload.fecha_inicio,
        fecha_target=payload.fecha_target,
        estado=payload.estado or "en_progreso",
        orden=payload.orden or 0,
    )
    db.add(hito)
    db.commit()
    db.refresh(hito)

    campo = db.query(Campo).filter(Campo.id == hito.campo_id).first()
    campo_nombre = campo.nombre if campo else ""

    # Background sync to Google Sheets 'V - Estrategico'
    background_tasks.add_task(
        workspace_service.sync_estrategico,
        {
            "id": hito.id,
            "campo_id": hito.campo_id,
            "campo_nombre": campo_nombre,
            "titulo": hito.titulo,
            "fecha_inicio": hito.fecha_inicio.isoformat() if hito.fecha_inicio else "",
            "fecha_target": hito.fecha_target.isoformat() if hito.fecha_target else "",
            "estado": hito.estado,
            "orden": hito.orden,
        },
    )

    # Re-query with eager load to populate nested campo
    return (
        db.query(HitoEstrategico)
        .options(joinedload(HitoEstrategico.campo))
        .filter(HitoEstrategico.id == hito.id)
        .one()
    )


@router.patch("/estrategica/{hito_id}", response_model=HitoEstrategicoSchema)
def update_hito_estrategico(
    hito_id: str,
    payload: HitoEstrategicoUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> HitoEstrategico:
    """Partially update a strategic milestone and sync to V - Estrategico."""
    hito = db.query(HitoEstrategico).filter(HitoEstrategico.id == hito_id).first()
    if not hito:
        raise HTTPException(status_code=404, detail="Hito estratégico no encontrado")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hito, field, value)

    db.commit()
    db.refresh(hito)

    campo = db.query(Campo).filter(Campo.id == hito.campo_id).first()
    campo_nombre = campo.nombre if campo else ""

    # Background sync
    background_tasks.add_task(
        workspace_service.sync_estrategico,
        {
            "id": hito.id,
            "campo_id": hito.campo_id,
            "campo_nombre": campo_nombre,
            "titulo": hito.titulo,
            "fecha_inicio": hito.fecha_inicio.isoformat() if hito.fecha_inicio else "",
            "fecha_target": hito.fecha_target.isoformat() if hito.fecha_target else "",
            "estado": hito.estado,
            "orden": hito.orden,
        },
    )

    return (
        db.query(HitoEstrategico)
        .options(joinedload(HitoEstrategico.campo))
        .filter(HitoEstrategico.id == hito_id)
        .one()
    )


@router.delete("/estrategica/{hito_id}", status_code=200)
def delete_hito_estrategico(
    hito_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> dict:
    """Delete a strategic milestone and delete from V - Estrategico."""
    hito = db.query(HitoEstrategico).filter(HitoEstrategico.id == hito_id).first()
    if not hito:
        raise HTTPException(status_code=404, detail="Hito estratégico no encontrado")
    db.delete(hito)
    db.commit()

    background_tasks.add_task(workspace_service.delete_estrategico, hito_id)

    return {"deleted": True}
