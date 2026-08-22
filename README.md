# 🎯 Centro de Mando Personal
> **Sistema de Gestión Integrada: 7 Campos de Vida • 3 Horizontes Temporales • 3 Franjas Circadianas**

Centro de Mando Personal unificado, sobrio y de alto rendimiento diseñado bajo el principio de **"ir de menos a más"** para alinear la visión a largo plazo con la ejecución diaria de fricción cero.

---

## 🏛️ Las 3 Pestañas Secuenciales

1. **Estratégica (3 Años / "El Todo")**:
   - Visión macro de los 7 campos de vida en cards funcionales.
   - Timeline Macro Gantt semestral (S1 2025 – S2 2027) con cálculo de barras y asignación por campo.
2. **Táctica (3 Meses)**:
   - Vista trimestral en 3 columnas para el horizonte cercano.
   - Hitos con barras de progreso interactivas y botón **Desglosar** para generar automáticamente subtareas accionables.
3. **Trinchera (Semana / Hoy)**:
   - **Task Stream**: Captura rápida con parser dinámico (`[01]–[07]`, `~min`, `!fecha`, `#hito`, `**deep**`), filtros y lista draggable.
   - **Time-Blocker**: Grilla de 7 días (Lunes a Domingo) × 3 franjas circadianas con drag & drop a 60 FPS (@dnd-kit) y sincronización con calendario.

---

## 🧬 Los 7 Campos de Vida

| ID | Nombre | Color HEX | Tipo de Flujo | Enfoque |
|:---|:---|:---|:---|:---|
| `01` | **Salud** | `#a4e136` | Continuo / Cadencia | Fuerza física, nutrición y descanso |
| `02` | **Bienestar** | `#38ad02` | Continuo / Cadencia | Claridad mental y equilibrio |
| `03` | **Carrera y Educación** | `#0a1b9b` | Hitos Discretos | Desarrollo profesional y estudio |
| `04` | **Finanzas** | `#367ec0` | Hitos Discretos | Estabilidad, ahorro e inversiones |
| `05` | **Relaciones** | `#ff7b09` | Continuo / Cadencia | Familia, amigos y pareja |
| `06` | **Ocio y Creatividad** | `#ffdf24` | Hitos Discretos | Software propio, arte y disfrute |
| `07` | **Sistemas y Entorno** | `#e22929` | Continuo / Cadencia | Organización, automatizaciones y reducción de fricción |

---

## ⏱️ Las 3 Franjas Circadianas

| Franja | Horario Sugerido | Enfoque Cognitivo | Campos Recomendados |
|:---|:---|:---|:---|
| **F1 (Mañana)** | 10:30 – 12:30 | **Arranque y Operativo Ágil** | `07`, `04`, `05` |
| **F2 (Tarde 1)** | 14:30 – 17:30 | **Foco Primario (Deep Work)** | `03`, `06` |
| **F3 (Tarde 2)** | 17:30 – 19:30 | **Foco Secundario / Físico** | `01`, `07` |

---

## ⌨️ Atajos de Teclado

- `1`: Ir a pestaña **Estratégica**
- `2`: Ir a pestaña **Táctica**
- `3`: Ir a pestaña **Trinchera**
- `Ctrl + K` / `Cmd + K` o `C`: Foco inmediato en el input de captura rápida

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Estilos**: Tailwind CSS (estética sobria dark slate-950/900)
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Estado y Caché**: Zustand + TanStack Query v5 (Optimistic UI en 0 ms)
- **Iconografía**: `lucide-react`

### Backend
- **Framework**: Python 3.8+ / 3.11+ con FastAPI
- **Validación**: Pydantic v2
- **Persistencia**: SQLAlchemy + SQLite local
- **Calendario**: Servicio modular (`MockCalendarService` in-memory + adaptador `GoogleCalendarService` OAuth2/API v3)

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/<tu-usuario>/<tu-repo>.git
cd centro-mando
```

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
API disponible en: `http://localhost:8000` (Docs Swagger en `http://localhost:8000/docs`).

### 3. Frontend (React + Vite)
```bash
cd ../frontend
npm install
npm run dev
```
Aplicación disponible en: `http://localhost:5173`.
