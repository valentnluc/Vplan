from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Campo
from schemas import CampoSchema

router = APIRouter(tags=["campos"])


@router.get("/campos", response_model=List[CampoSchema])
def list_campos(db: Session = Depends(get_db)) -> List[Campo]:
    """Return all 7 life campos."""
    return db.query(Campo).order_by(Campo.id).all()
