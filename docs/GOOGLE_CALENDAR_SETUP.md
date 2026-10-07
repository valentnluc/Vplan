# 📅 Guía de Configuración: Sincronización con Google Calendar

VPlan (Centro de Mando Personal) incluye soporte nativo y modular para **Google Calendar API v3** y un **MockCalendarService** automático para desarrollo local y pruebas sin configuración previa.

---

## ⚙️ Modos de Funcionamiento

1. **Modo Desarrollo (Mock Automático)**:
   - Si no existe el archivo `credentials.json` en la carpeta `backend/`, el sistema utiliza `MockCalendarService`.
   - Permite agendar, desagendar y probar toda la interfaz y lógica circadiana en memoria sin requerir credenciales externas.

2. **Modo Producción (Google Calendar Real)**:
   - Al colocar `credentials.json` en la raíz del `backend/`, el sistema activa automáticamente `GoogleCalendarService`.
   - Se abrirá una ventana del navegador la primera vez para autorizar la cuenta de Google y se guardará el token en `backend/token.json`.

---

## 🚀 Pasos para Configurar Google Calendar Real

### 1. Crear un Proyecto en Google Cloud Console
1. Ingresa a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto (ej. `VPlan - Centro de Mando`).

### 2. Habilitar la Google Calendar API
1. En el menú de navegación, ve a **APIs y Servicios** > **Biblioteca**.
2. Busca `Google Calendar API`.
3. Haz clic en **Habilitar**.

### 3. Configurar la Pantalla de Consentimiento OAuth
1. Ve a **APIs y Servicios** > **Pantalla de consentimiento de OAuth**.
2. Selecciona **Externo** (o **Interno** si usas Google Workspace).
3. Completa los campos requeridos:
   - Nombre de la aplicación: `VPlan`
   - Correo electrónico de soporte: tu correo.
4. En **Permisos / Scopes**, agrega:
   - `https://www.googleapis.com/auth/calendar`
5. En **Usuarios de prueba**, añade tu cuenta de Gmail.

### 4. Crear Credenciales OAuth 2.0
1. Ve a **APIs y Servicios** > **Credenciales**.
2. Haz clic en **Crear credenciales** > **ID de cliente de OAuth**.
3. Tipo de aplicación: **App de escritorio (Desktop App)**.
4. Nombre: `VPlan Desktop Client`.
5. Haz clic en **Crear** y descarga el archivo JSON.

### 5. Instalar Credenciales en el Backend
1. Renombra el archivo descargado a `credentials.json`.
2. Muévelo dentro del directorio `backend/`:
   ```
   backend/
   ├── credentials.json  <-- AQUÍ
   ├── database.py
   ├── main.py
   └── ...
   ```

### 6. Primera Autenticación
1. Inicia el backend (`python -m uvicorn main:app --reload`).
2. Al agendar tu primera tarea o invocar el servicio de calendario, se abrirá tu navegador para iniciar sesión y aceptar los permisos de Google.
3. Se generará automáticamente el archivo `token.json` con los tokens de acceso y refresco para futuras ejecuciones transparentes.
