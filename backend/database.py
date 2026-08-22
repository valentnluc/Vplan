from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.orm import Session
from typing import Generator
import uuid
from datetime import date

DATABASE_URL = "sqlite:///./centro_mando.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables and seed initial data if not already present."""
    # Import models to ensure they are registered with Base
    from models import Campo, HitoEstrategico, HitoTactico, Tarea  # noqa: F401

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        _seed_campos(db)
        _seed_demo_data(db)
    finally:
        db.close()


def _seed_campos(db: Session) -> None:
    from models import Campo

    if db.query(Campo).count() > 0:
        return

    campos_data = [
        {
            "id": "01",
            "nombre": "Salud",
            "color_hex": "#a4e136",
            "tipo_flujo": "continuo",
            "google_calendar_id": "primary",
            "descripcion": "Salud física y mental, ejercicio, alimentación y descanso.",
        },
        {
            "id": "02",
            "nombre": "Bienestar",
            "color_hex": "#38ad02",
            "tipo_flujo": "continuo",
            "google_calendar_id": "primary",
            "descripcion": "Bienestar emocional, mindfulness y equilibrio personal.",
        },
        {
            "id": "03",
            "nombre": "Carrera y Educación",
            "color_hex": "#0a1b9b",
            "tipo_flujo": "hitos",
            "google_calendar_id": "primary",
            "descripcion": "Desarrollo profesional, formación y aprendizaje continuo.",
        },
        {
            "id": "04",
            "nombre": "Finanzas",
            "color_hex": "#367ec0",
            "tipo_flujo": "hitos",
            "google_calendar_id": "primary",
            "descripcion": "Gestión financiera, ahorro, inversiones y presupuesto.",
        },
        {
            "id": "05",
            "nombre": "Relaciones",
            "color_hex": "#ff7b09",
            "tipo_flujo": "continuo",
            "google_calendar_id": "primary",
            "descripcion": "Relaciones personales, familia, amigos y comunidad.",
        },
        {
            "id": "06",
            "nombre": "Ocio y Creatividad",
            "color_hex": "#ffdf24",
            "tipo_flujo": "hitos",
            "google_calendar_id": "primary",
            "descripcion": "Hobbies, proyectos creativos, descanso activo y disfrute.",
        },
        {
            "id": "07",
            "nombre": "Sistemas y Entorno",
            "color_hex": "#e22929",
            "tipo_flujo": "continuo",
            "google_calendar_id": "primary",
            "descripcion": "Organización del hogar, productividad, herramientas y entorno de vida.",
        },
    ]

    for data in campos_data:
        db.add(Campo(**data))
    db.commit()


def _seed_demo_data(db: Session) -> None:
    from models import HitoEstrategico, HitoTactico, Tarea

    if db.query(HitoEstrategico).count() > 0:
        return

    # --- Hitos Estratégicos ---
    he1_id = str(uuid.uuid4())
    he2_id = str(uuid.uuid4())

    he1 = HitoEstrategico(
        id=he1_id,
        campo_id="03",
        titulo="Completar curso de FastAPI avanzado",
        fecha_inicio=date(2026, 8, 1),
        fecha_target=date(2026, 10, 31),
        estado="en_progreso",
        orden=1,
    )
    he2 = HitoEstrategico(
        id=he2_id,
        campo_id="04",
        titulo="Construir fondo de emergencia 6 meses",
        fecha_inicio=date(2026, 8, 1),
        fecha_target=date(2026, 12, 31),
        estado="en_progreso",
        orden=1,
    )
    db.add_all([he1, he2])
    db.commit()

    # --- Hitos Tácticos ---
    ht1_id = str(uuid.uuid4())
    ht2_id = str(uuid.uuid4())
    ht3_id = str(uuid.uuid4())

    ht1 = HitoTactico(
        id=ht1_id,
        hito_estrategico_id=he1_id,
        campo_id="03",
        titulo="Módulos 1-5: Fundamentos y DB",
        fecha_limite=date(2026, 9, 15),
        progreso_manual=0.2,
        estado="en_progreso",
    )
    ht2 = HitoTactico(
        id=ht2_id,
        hito_estrategico_id=he1_id,
        campo_id="03",
        titulo="Módulos 6-10: Auth y Deployment",
        fecha_limite=date(2026, 10, 31),
        progreso_manual=0.0,
        dependencia_hito_id=ht1_id,
        estado="pendiente",
    )
    ht3 = HitoTactico(
        id=ht3_id,
        hito_estrategico_id=he2_id,
        campo_id="04",
        titulo="Reducir gastos variables un 20%",
        fecha_limite=date(2026, 9, 30),
        progreso_manual=0.1,
        estado="en_progreso",
    )
    db.add_all([ht1, ht2, ht3])
    db.commit()

    # --- Tareas ---
    tareas = [
        Tarea(
            id=str(uuid.uuid4()),
            hito_tactico_id=ht1_id,
            campo_id="03",
            titulo="Ver lección 1: Intro a FastAPI",
            duracion_min=45,
            es_deep_work=True,
            completada=False,
            orden=1,
        ),
        Tarea(
            id=str(uuid.uuid4()),
            hito_tactico_id=ht1_id,
            campo_id="03",
            titulo="Practicar rutas y modelos Pydantic",
            duracion_min=90,
            es_deep_work=True,
            completada=False,
            orden=2,
        ),
        Tarea(
            id=str(uuid.uuid4()),
            hito_tactico_id=ht3_id,
            campo_id="04",
            titulo="Revisar extracto bancario del mes",
            duracion_min=30,
            es_deep_work=False,
            completada=False,
            orden=1,
        ),
        Tarea(
            id=str(uuid.uuid4()),
            campo_id="01",
            titulo="Salir a correr 30 minutos",
            duracion_min=30,
            es_deep_work=False,
            completada=False,
            orden=1,
        ),
        Tarea(
            id=str(uuid.uuid4()),
            campo_id="07",
            titulo="Organizar escritorio y archivos del PC",
            duracion_min=60,
            es_deep_work=False,
            completada=False,
            orden=2,
        ),
    ]
    db.add_all(tareas)
    db.commit()
