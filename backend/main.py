from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import campos, estrategica, tactica, trinchera, calendar as cal_router

app = FastAPI(
    title="Centro de Mando Personal",
    description="API backend for the Personal Command Center — 7 life campos, strategic/tactical milestones, and daily task management.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    """Initialize the database and seed default data on application start."""
    init_db()


app.include_router(campos.router, prefix="/api")
app.include_router(estrategica.router, prefix="/api")
app.include_router(tactica.router, prefix="/api")
app.include_router(trinchera.router, prefix="/api")
app.include_router(cal_router.router, prefix="/api")


@app.get("/health", tags=["meta"])
def health() -> dict:
    """Basic health check endpoint."""
    return {"status": "ok"}
