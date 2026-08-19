# Especificación de Requerimientos de Software (PRD)
## Sistema de Gestión Integrada: 7 Campos &bull; 3 Horizontes &bull; 3 Franjas Circadianas

---

## 1. Visión General del Producto

### 1.1. Propósito
Construir un **Centro de Mando Personal** unificado, sobrio y de alto rendimiento que resuelva la desconexión entre la visión a largo plazo y la ejecución diaria. 

El sistema implementa el principio de **"ir de menos a más"** mediante **3 pestañas secuenciales**:
1. **Estratégica (3 Años / "El Todo")**: Visión macro de los 7 campos de vida y hoja de ruta multianual (estilo Primavera P6 / ClickUp simplificado).
2. **Táctica (3 Meses)**: Horizonte trimestral con fechas duras, dependencias y desglose de entregables (estilo Notion Calendar / Gantt ágil).
3. **Trinchera (Semana / Hoy)**: Captura ágil de fricción cero y time-blocking circadiano en 3 franjas horarias sincronizado bidireccionalmente con Google Calendar (estilo Todoist + Notion Calendar).

---

## 2. Principios de Diseño Visual & UI Estándar

### 2.1. Simplicidad y Minimalismo
* **Estética sobria y funcional**: Inspirada en interfaces utilitarias (tipo Linear / Obsidian / Vercel). Sin gradientes pesados, sin sombras excesivas, sin decoraciones superfluas.
* **Uso del color como dato, no como adorno**: El fondo y las tarjetas se mantienen en tonos neutros oscuros estándar (`bg-slate-950`, `bg-slate-900`, `border-slate-800`). Los 7 colores HEX se aplican **exclusivamente como acentos funcionales** (bordes laterales sutiles `border-l-4`, etiquetas pequeñas o badges de identificación).
* **Alta densidad y lectura limpia**: Tipografía estándar del sistema (`font-sans`), tamaños de texto compactos (`text-xs`, `text-sm`), espaciados consistentes (`gap-2`, `gap-3`, `p-3`, `p-4`).

### 2.2. Uso Estricto de Clases Estándar de Tailwind CSS
* Toda la interfaz debe construirse con **utilidades nativas de Tailwind CSS**, evitando escribir CSS personalizado o dependencias de estilos complejas.
* Patrones estándar de Tailwind a utilizar:
  * **Layouts**: `flex`, `grid`, `grid-cols-*`, `space-y-*`, `gap-*`.
  * **Contenedores y Cards**: `bg-slate-900 border border-slate-800 rounded-xl p-3`.
  * **Inputs**: `bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500`.
  * **Botones**: `px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition`.
  * **Badges y Tags**: `px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300`.

---

## 3. Dominio y Taxonomía del Sistema

### 3.1. Los 7 Campos de Vida (Configuración Inmutable)

| ID | Nombre del Campo | Color HEX | Tipo de Flujo | Descripción / Estándar |
| :--- | :--- | :--- | :--- | :--- |
| `01` | **Salud** | `#a4e136` | Continuo / Cadencia | Construir un cuerpo fuerte y sano para sostener el resto de la vida (SLA: 4x gym/sem + nutrición). |
| `02` | **Bienestar** | `#38ad02` | Continuo / Cadencia | Mantener claridad mental y una vida que no esté dominada por la urgencia. |
| `03` | **Carrera y Educación** | `#0a1b9b` | Hitos Discretos | Ser un mejor profesional (Carrera Ingeniería Civil UTN FRRo, Cost Analyst Edilizia). |
| `04` | **Finanzas** | `#367ec0` | Hitos Discretos | Dar estabilidad al presente y libertad al futuro (Reserva, activos, inversiones). |
| `05` | **Relaciones** | `#ff7b09` | Continuo / Cadencia | Cuidar y nutrir mis vínculos importantes (Familia, amigos, pareja). |
| `06` | **Ocio y Creatividad** | `#ffdf24` | Hitos Discretos | Crear por placer, no por productividad (Software propio, música/bajo, diseño). |
| `07` | **Sistemas y Entorno** | `#e22929` | Continuo / Cadencia | Reducir fricción para que hacer lo correcto resulte más fácil (Automatizaciones, orden del hogar). |

*Nota sobre tipos de flujo:*
* **Hitos Discretos**: Tienen fecha de inicio, fin, porcentaje de completitud y entregables tangibles.
* **Continuo / Cadencia (Evergreen)**: Tienen objetivos de frecuencia semanal/mensual (SLA) y líneas de base estables.

---

### 3.2. Las 3 Franjas Horarias Circadianas

| Franja | Horario Sugerido | Enfoque Cognitivo | Tipo de Tareas / Campos Recomendados |
| :--- | :--- | :--- | :--- |
| **Franja 1 (Mañana)** | 10:30 – 12:30 | **Arranque y Operativo Ágil** | Tareas cortas, correos, trámites, coordinación (`07`, `04`, `05`). |
| *Pausa Almuerzo* | 12:30 – 14:30 | *Recarga y Digestión* | Almuerzo proteico, desconexión y descanso (`01`, `02`). |
| **Franja 2 (Tarde 1)** | 14:30 – 17:30 | **Foco Primario (Deep Work)** | Bloque continuo para cálculo estructural, programación, TPs complejos (`03`, `06`). |
| **Franja 3 (Tarde 2)** | 17:30 – 19:30 | **Foco Secundario / Físico** | Entrenamiento de fuerza (`01`), consultas universitarias fijas o cierre del día (`07`). |

---

## 4. Arquitectura Técnica

### 4.1. Stack Tecnológico
* **Frontend**:
  * **Framework**: React 18+ con Vite y TypeScript.
  * **Estilos**: Tailwind CSS (utilidades estándar, sin frameworks CSS pesados).
  * **Iconos**: `lucide-react` (iconos limpios y ligeros).
  * **Drag & Drop**: `@dnd-kit/core` y `@dnd-kit/sortable` (o HTML5 drag & drop nativo para mínima sobrecarga).
  * **Estado & Cache**: Zustand + TanStack Query v5 (o estado reactivo simple en React).
* **Backend**:
  * **Framework**: Python 3.11+ con FastAPI y Pydantic v2.
  * **Persistencia**: SQLite local (`sqlite3` / SQLAlchemy).
  * **Integración**: `google-api-python-client` para Google Calendar API v3.

---

## 5. Modelo de Datos (Esquema Relacional SQLite)

```sql
-- 1. CAMPOS (7 Registros estáticos)
CREATE TABLE campos (
    id VARCHAR(2) PRIMARY KEY, -- '01'..'07'
    nombre VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7) NOT NULL,
    tipo_flujo VARCHAR(20) NOT NULL, -- 'hitos' o 'continuo'
    google_calendar_id VARCHAR(255) NOT NULL,
    descripcion TEXT
);

-- 2. HITOS ESTRATÉGICOS (3 AÑOS)
CREATE TABLE hitos_estrategicos (
    id VARCHAR(36) PRIMARY KEY,
    campo_id VARCHAR(2) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_target DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'en_progreso',
    orden INT DEFAULT 0,
    FOREIGN KEY (campo_id) REFERENCES campos(id)
);

-- 3. HITOS TÁCTICOS (3 MESES)
CREATE TABLE hitos_tacticos (
    id VARCHAR(36) PRIMARY KEY,
    hito_estrategico_id VARCHAR(36) NULL,
    campo_id VARCHAR(2) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    fecha_limite DATE NOT NULL,
    progreso_manual FLOAT DEFAULT 0.0,
    dependencia_hito_id VARCHAR(36) NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    FOREIGN KEY (hito_estrategico_id) REFERENCES hitos_estrategicos(id),
    FOREIGN KEY (campo_id) REFERENCES campos(id)
);

-- 4. TAREAS TRINCHERA (SEMANAL / DIARIA)
CREATE TABLE tareas (
    id VARCHAR(36) PRIMARY KEY,
    hito_tactico_id VARCHAR(36) NULL,
    campo_id VARCHAR(2) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    duracion_min INT DEFAULT 60,
    es_deep_work BOOLEAN DEFAULT FALSE,
    fecha_agendada DATE NULL,
    franja_agendada VARCHAR(20) NULL, -- 'f1_manana', 'f2_tarde1', 'f3_tarde2'
    google_event_id VARCHAR(255) NULL,
    completada BOOLEAN DEFAULT FALSE,
    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hito_tactico_id) REFERENCES hitos_tacticos(id),
    FOREIGN KEY (campo_id) REFERENCES campos(id)
);
```

---

## 6. Especificaciones de UX/UI por Pantalla (Simplicidad con Tailwind)

### 6.1. Header Global
* Contenedor: `bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between`.
* Selector de 3 pestañas estilo píldora:
  * Contenedor: `flex bg-slate-950 p-1 rounded-lg border border-slate-800 space-x-1`.
  * Botón activo: `bg-slate-800 text-slate-100 font-semibold px-3 py-1.5 rounded text-xs`.
  * Botón inactivo: `text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded text-xs transition`.

---

### 6.2. Pestaña 1: Estratégica ("El Todo" — 3 Años)
* **Grilla Superior (7 Cards)**:
  * Layout: `grid grid-cols-7 gap-3`.
  * Card de Campo: `bg-slate-900 border border-slate-800 rounded-lg p-3 relative flex flex-col justify-between`.
  * Indicador de color: Una línea sutil superior de 2px (`h-0.5`) o borde con el color HEX correspondiente.
* **Timeline Macro (Gantt Simple)**:
  * Construido con `grid grid-cols-6` estándar de Tailwind para los semestres.
  * Barras de proyecto horizontales simples con `bg-slate-800 border` y texto blanco legible.

---

### 6.3. Pestaña 2: Táctica (Horizonte Cercano — 3 Meses)
* **Vista Trimestral en 3 Columnas**:
  * Layout: `grid grid-cols-3 gap-4`.
  * Columnas: `bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3`.
* **Tarjetas de Hito**:
  * `p-3 bg-slate-950 border-l-4 border-y border-r border-slate-800 rounded-r-lg`. El `border-l` lleva el color del campo.
  * Barra de progreso estándar: `w-full bg-slate-800 h-1.5 rounded-full overflow-hidden` con relleno `bg-blue-500`.

---

### 6.4. Pestaña 3: Trinchera (Ejecución Diaria & Semanal — Split 2 Columnas)

#### **Panel Izquierdo: Task Stream (Estilo Todoist)**
* Contenedor: `w-1/3 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col`.
* Input de captura rápida:
  * `w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500`.
  * Parser de prefijos: `[01]` a `[07]`, `#hito`, `!fecha`, `~tiempo`.
* Tarjetas de tarea:
  * `p-2.5 bg-slate-950 border-l-4 border-y border-r border-slate-800 rounded-r-lg flex items-center justify-between cursor-grab hover:border-slate-700 transition`.

#### **Panel Derecho: Time-Blocker (3 Franjas Horarias)**
* Contenedor: `flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col`.
* Grilla de 5 o 7 días: `grid grid-cols-5 gap-2.5`.
* Cada día contiene 3 Drop Zones simples:
  * `bg-slate-950 border border-dashed border-slate-800 rounded-lg p-2 min-h-[70px] space-y-1.5`.
  * Evento agendado dentro de la franja: `p-2 bg-slate-900 border-l-4 border border-slate-800 rounded text-xs text-slate-100 flex items-center justify-between`.

---

## 7. Criterios de Rendimiento y Microinteracciones

1. **Cero Retraso Visual (Optimistic UI)**: Arrastrar o tildar una tarea actualiza el DOM inmediatamente en 0ms; la sincronización de red con Google Calendar se ejecuta en segundo plano.
2. **Atajos de Teclado**:
   * `1`, `2`, `3`: Cambio de pestaña.
   * `Cmd/Ctrl + K` o `C`: Foco inmediato en el input de captura.
3. **Cero Modales Innecesarios**: Todo el flujo diario se opera directamente en la pantalla principal.

---

## 8. Contrato de API Backend (FastAPI)

* `GET /api/campos`: Lista de los 7 campos.
* `GET /api/estrategica`: Hitos macro a 3 años.
* `GET /api/tactica`: Hitos trimestrales a 3 meses.
* `POST /api/tactica/{id}/desglosar`: Genera tareas hijas a partir de un hito.
* `GET /api/trinchera/pendientes`: Tareas sin agendar.
* `POST /api/trinchera/captura`: Captura rápida de tarea.
* `POST /api/calendar/agendar-tarea`: Recibe `{ tarea_id, fecha, franja }`, crea el evento en Google Calendar y vincula el `google_event_id`.
* `POST /api/calendar/desagendar-tarea`: Remueve el evento en Google Calendar.

