from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from database import Base



class Campo(Base):
    __tablename__ = "campos"

    id: str = Column(String(2), primary_key=True)  # '01'..'07'
    nombre: str = Column(String(100), nullable=False)
    color_hex: str = Column(String(7), nullable=False)
    tipo_flujo: str = Column(String(20), default="continuo")  # 'continuo' | 'hitos'
    google_calendar_id: str = Column(String(255), default="primary")
    descripcion: str | None = Column(Text, nullable=True)

    # Relationships
    hitos_estrategicos = relationship("HitoEstrategico", back_populates="campo")
    hitos_tacticos = relationship("HitoTactico", back_populates="campo")
    tareas = relationship("Tarea", back_populates="campo")


class HitoEstrategico(Base):
    __tablename__ = "hitos_estrategicos"

    id: str = Column(String(36), primary_key=True)
    campo_id: str = Column(String(2), ForeignKey("campos.id"), nullable=False)
    titulo: str = Column(String(255), nullable=False)
    fecha_inicio: datetime = Column(Date, nullable=False)
    fecha_target: datetime = Column(Date, nullable=False)
    estado: str = Column(String(20), default="en_progreso")  # 'en_progreso' | 'completado' | 'pausado'
    orden: int = Column(Integer, default=0)

    # Relationships
    campo = relationship("Campo", back_populates="hitos_estrategicos")
    hitos_tacticos = relationship("HitoTactico", back_populates="hito_estrategico")


class HitoTactico(Base):
    __tablename__ = "hitos_tacticos"

    id: str = Column(String(36), primary_key=True)
    hito_estrategico_id: str | None = Column(
        String(36), ForeignKey("hitos_estrategicos.id"), nullable=True
    )
    campo_id: str = Column(String(2), ForeignKey("campos.id"), nullable=False)
    titulo: str = Column(String(255), nullable=False)
    fecha_limite: datetime = Column(Date, nullable=False)
    hora_limite: str | None = Column(String(10), nullable=True)
    progreso_manual: float = Column(Float, default=0.0)
    dependencia_hito_id: str | None = Column(String(36), nullable=True)
    estado: str = Column(String(20), default="pendiente")

    # Relationships
    campo = relationship("Campo", back_populates="hitos_tacticos")
    hito_estrategico = relationship("HitoEstrategico", back_populates="hitos_tacticos")
    tareas = relationship("Tarea", back_populates="hito_tactico")


class Tarea(Base):
    __tablename__ = "tareas"

    id: str = Column(String(36), primary_key=True)
    hito_tactico_id: str | None = Column(
        String(36), ForeignKey("hitos_tacticos.id"), nullable=True
    )
    campo_id: str = Column(String(2), ForeignKey("campos.id"), nullable=False)
    titulo: str = Column(String(255), nullable=False)
    descripcion: str | None = Column(Text, nullable=True)
    duracion_min: int = Column(Integer, default=60)
    es_deep_work: bool = Column(Boolean, default=False)
    tipo_circadiano: str | None = Column(String(30), default="trabajo_pesado")
    importancia: str | None = Column(String(10), default="media")
    fecha_agendada: datetime | None = Column(Date, nullable=True)
    hora_inicio: str | None = Column(String(10), nullable=True)
    franja_agendada: str | None = Column(String(20), nullable=True)
    google_event_id: str | None = Column(String(255), nullable=True)
    completada: bool = Column(Boolean, default=False)
    orden: int = Column(Integer, default=0)
    created_at: datetime = Column(DateTime, server_default=func.now())

    # Relationships
    campo = relationship("Campo", back_populates="tareas")
    hito_tactico = relationship("HitoTactico", back_populates="tareas")
