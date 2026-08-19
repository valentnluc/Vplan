from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Campo
# ---------------------------------------------------------------------------

class CampoSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    color_hex: str
    tipo_flujo: str
    google_calendar_id: str
    descripcion: Optional[str] = None


# ---------------------------------------------------------------------------
# Hito Estratégico
# ---------------------------------------------------------------------------

class HitoEstrategicoCreate(BaseModel):
    campo_id: str
    titulo: str
    fecha_inicio: date
    fecha_target: date
    estado: Optional[str] = "en_progreso"
    orden: Optional[int] = 0


class HitoEstrategicoUpdate(BaseModel):
    titulo: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_target: Optional[date] = None
    estado: Optional[str] = None
    orden: Optional[int] = None


class HitoEstrategicoSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    campo_id: str
    titulo: str
    fecha_inicio: date
    fecha_target: date
    estado: str
    orden: int
    campo: Optional[CampoSchema] = None


# ---------------------------------------------------------------------------
# Hito Táctico
# ---------------------------------------------------------------------------

class HitoTacticoCreate(BaseModel):
    hito_estrategico_id: Optional[str] = None
    campo_id: str
    titulo: str
    fecha_limite: date
    progreso_manual: Optional[float] = 0.0
    dependencia_hito_id: Optional[str] = None
    estado: Optional[str] = "pendiente"


class HitoTacticoUpdate(BaseModel):
    hito_estrategico_id: Optional[str] = None
    campo_id: Optional[str] = None
    titulo: Optional[str] = None
    fecha_limite: Optional[date] = None
    progreso_manual: Optional[float] = None
    dependencia_hito_id: Optional[str] = None
    estado: Optional[str] = None


class HitoTacticoSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hito_estrategico_id: Optional[str] = None
    campo_id: str
    titulo: str
    fecha_limite: date
    progreso_manual: float
    dependencia_hito_id: Optional[str] = None
    estado: str
    campo: Optional[CampoSchema] = None


# ---------------------------------------------------------------------------
# Tarea
# ---------------------------------------------------------------------------

class TareaCreate(BaseModel):
    hito_tactico_id: Optional[str] = None
    campo_id: str
    titulo: str
    duracion_min: Optional[int] = 60
    es_deep_work: Optional[bool] = False
    fecha_agendada: Optional[date] = None
    franja_agendada: Optional[str] = None
    orden: Optional[int] = 0


class TareaUpdate(BaseModel):
    """All fields optional for PATCH semantics."""
    hito_tactico_id: Optional[str] = None
    campo_id: Optional[str] = None
    titulo: Optional[str] = None
    duracion_min: Optional[int] = None
    es_deep_work: Optional[bool] = None
    fecha_agendada: Optional[date] = None
    franja_agendada: Optional[str] = None
    google_event_id: Optional[str] = None
    completada: Optional[bool] = None
    orden: Optional[int] = None


class TareaSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hito_tactico_id: Optional[str] = None
    campo_id: str
    titulo: str
    duracion_min: int
    es_deep_work: bool
    fecha_agendada: Optional[date] = None
    franja_agendada: Optional[str] = None
    google_event_id: Optional[str] = None
    completada: bool
    orden: int
    created_at: Optional[datetime] = None
    campo: Optional[CampoSchema] = None


# ---------------------------------------------------------------------------
# Calendar / Captura payloads
# ---------------------------------------------------------------------------

class CapturaPayload(BaseModel):
    titulo: str
    campo_id: Optional[str] = None
    hito_tactico_id: Optional[str] = None
    duracion_min: Optional[int] = 60
    es_deep_work: Optional[bool] = False
    fecha_agendada: Optional[date] = None


class AgendarPayload(BaseModel):
    tarea_id: str
    fecha_agendada: date
    franja_agendada: str


class DesagendarPayload(BaseModel):
    tarea_id: str
