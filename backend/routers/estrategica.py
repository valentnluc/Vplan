from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import HitoEstrategico
from schemas import (
    HitoEstrategicoCreate,
    HitoEstrategicoSchema,
    HitoEstrategicoUpdate,
)

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
    db: Session = Depends(get_db),
) -> HitoEstrategico:
    """Create a new strategic milestone."""
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
    db: Session = Depends(get_db),
) -> HitoEstrategico:
    """Partially update a strategic milestone."""
    hito = db.query(HitoEstrategico).filter(HitoEstrategico.id == hito_id).first()
    if not hito:
        raise HTTPException(status_code=404, detail="Hito estratégico no encontrado")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hito, field, value)

    db.commit()
    db.refresh(hito)
    return (
        db.query(HitoEstrategico)
        .options(joinedload(HitoEstrategico.campo))
        .filter(HitoEstrategico.id == hito_id)
        .one()
    )


@router.delete("/estrategica/{hito_id}", status_code=200)
def delete_hito_estrategico(
    hito_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Delete a strategic milestone."""
    hito = db.query(HitoEstrategico).filter(HitoEstrategico.id == hito_id).first()
    if not hito:
        raise HTTPException(status_code=404, detail="Hito estratégico no encontrado")
    db.delete(hito)
    db.commit()
    return {"deleted": True}
