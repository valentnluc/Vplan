from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from main import app
from database import init_db

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    init_db()


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_campos():
    response = client.get("/api/campos")
    assert response.status_code == 200
    campos = response.json()
    assert len(campos) == 7
    ids = [c["id"] for c in campos]
    assert "01" in ids
    assert "07" in ids


def test_estrategica_crud():
    # 1. Create
    payload = {
        "campo_id": "03",
        "titulo": "Hito Estratégico de Prueba",
        "fecha_inicio": "2026-09-01",
        "fecha_target": "2026-12-31",
        "estado": "en_progreso",
        "orden": 1,
    }
    create_res = client.post("/api/estrategica", json=payload)
    assert create_res.status_code == 201
    created_hito = create_res.json()
    hito_id = created_hito["id"]
    assert created_hito["titulo"] == payload["titulo"]
    assert created_hito["campo"]["id"] == "03"

    # 2. List
    list_res = client.get("/api/estrategica")
    assert list_res.status_code == 200
    all_hitos = list_res.json()
    assert any(h["id"] == hito_id for h in all_hitos)

    # 3. Patch
    patch_res = client.patch(
        f"/api/estrategica/{hito_id}",
        json={"titulo": "Hito Estratégico Modificado", "estado": "completado"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["titulo"] == "Hito Estratégico Modificado"
    assert patch_res.json()["estado"] == "completado"

    # 4. Delete
    del_res = client.delete(f"/api/estrategica/{hito_id}")
    assert del_res.status_code == 200
    assert del_res.json() == {"deleted": True}


def test_tactica_crud_and_desglosar():
    # 1. Create tactical milestone
    payload = {
        "campo_id": "03",
        "titulo": "Entregable Táctico de Prueba",
        "fecha_limite": "2026-10-15",
        "progreso_manual": 0.5,
        "estado": "en_progreso",
    }
    create_res = client.post("/api/tactica", json=payload)
    assert create_res.status_code == 201
    hito_tactico = create_res.json()
    tactico_id = hito_tactico["id"]
    assert hito_tactico["titulo"] == payload["titulo"]

    # 2. Desglosar
    desglosar_res = client.post(f"/api/tactica/{tactico_id}/desglosar")
    assert desglosar_res.status_code == 201
    subtareas = desglosar_res.json()
    assert len(subtareas) == 3
    assert all("Entregable Táctico de Prueba" in st["titulo"] for st in subtareas)

    # 3. Cleanup subtareas and tactico
    for st in subtareas:
        client.delete(f"/api/trinchera/tareas/{st['id']}")

    del_res = client.delete(f"/api/tactica/{tactico_id}")
    assert del_res.status_code == 200


def test_trinchera_captura_and_calendar():
    # 1. Quick Capture
    payload = {
        "campo_id": "01",
        "titulo": "Sesión de gimnasio fuerza",
        "duracion_min": 60,
        "es_deep_work": False,
        "tipo_circadiano": "ejercicio",
        "importancia": "alta",
    }
    cap_res = client.post("/api/trinchera/captura", json=payload)
    assert cap_res.status_code == 201
    tarea = cap_res.json()
    tarea_id = tarea["id"]
    assert tarea["titulo"] == payload["titulo"]
    assert tarea["completada"] is False

    # 2. Verify in pendientes
    pend_res = client.get("/api/trinchera/pendientes")
    assert pend_res.status_code == 200
    pendientes = pend_res.json()
    assert any(t["id"] == tarea_id for t in pendientes)

    # 3. Schedule task (Agendar)
    agendar_payload = {
        "tarea_id": tarea_id,
        "fecha_agendada": "2026-08-25",
        "franja_agendada": "17:30",
    }
    ag_res = client.post("/api/calendar/agendar-tarea", json=agendar_payload)
    assert ag_res.status_code == 200
    agendada = ag_res.json()
    assert agendada["fecha_agendada"] == "2026-08-25"
    assert agendada["franja_agendada"] == "17:30"
    assert agendada["google_event_id"] is not None

    # 4. Desagendar
    desag_res = client.post(
        "/api/calendar/desagendar-tarea",
        json={"tarea_id": tarea_id},
    )
    assert desag_res.status_code == 200
    desagendada = desag_res.json()
    assert desagendada["fecha_agendada"] is None
    assert desagendada["google_event_id"] is None

    # 5. Delete tarea
    del_res = client.delete(f"/api/trinchera/tareas/{tarea_id}")
    assert del_res.status_code == 200


def test_workspace_endpoints():
    # 1. Check status
    status_res = client.get("/api/workspace/status")
    assert status_res.status_code == 200
    assert "is_configured" in status_res.json()

    # 2. Configure workspace
    cfg_payload = {
        "web_app_url": "https://script.google.com/macros/s/mock-test-id/exec",
        "api_key": "vplan_secret_key",
    }
    cfg_res = client.post("/api/workspace/configure", json=cfg_payload)
    assert cfg_res.status_code == 200
    assert cfg_res.json()["saved"] is True

    # 3. Verify updated status
    status_after = client.get("/api/workspace/status")
    assert status_after.json()["is_configured"] is True
    assert status_after.json()["web_app_url"] == cfg_payload["web_app_url"]

    # 4. Clean up test config
    client.post("/api/workspace/configure", json={"web_app_url": "", "api_key": "vplan_secret_key"})


