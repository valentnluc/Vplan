# 🚀 Guía Rápida: Despliegue de Google Apps Script Gateway para VPlan

En menos de **3 minutos**, tendrás conectada tu cuenta de Google para sincronizar automáticamente:
- 📊 **Google Sheets**: Hoja `V - Estrategico` (Hitos Estratégicos a 3 Años)
- 📅 **Google Calendar**: Calendario `V - Tactico` (Entregables Tácticos con colores de campos)
- ✅ **Google Tasks**: Lista `V - Tareas` (Tareas de Trinchera)

---

## 📋 Pasos de Despliegue (3 Clics)

### 1. Crear el Proyecto en Google Apps Script
1. Abre tu navegador e ingresa a **[script.google.com](https://script.google.com)** (con tu cuenta de Google).
2. Haz clic en el botón azul **"Nuevo proyecto"** (arriba a la izquierda).
3. Nombra el proyecto como **`VPlan Cloud Gateway`** (haciendo clic en "Proyecto sin título" arriba).

### 2. Pegar el Código
1. En el editor, borra cualquier código existente y pega el contenido completo de [`docs/apps_script/Code.gs`](apps_script/Code.gs).
2. En el menú lateral izquierdo, haz clic en el ícono **+** al lado de **Servicios** (Services).
3. Busca **Tasks API** (Google Tasks API), selecciónalo y haz clic en **Añadir** (Add).
4. Haz clic en el ícono de **Guardar** (disquete o `Ctrl + S`).

### 3. Implementar como Aplicación Web (Web App)
1. Arriba a la derecha, haz clic en el botón azul **"Implementar" (Deploy)** > **"Nueva implementación" (New deployment)**.
2. En el engranaje ⚙️ (Seleccionar tipo), elige **"Aplicación web" (Web app)**.
3. Configura exactamente estas 3 opciones:
   - **Descripción**: `VPlan v1`
   - **Ejecutar como (Execute as)**: **Yo (tu_correo@gmail.com)** *(opción por defecto)*
   - **Quién tiene acceso (Who has access)**: **Cualquier usuario (Anyone)**
4. Haz clic en **Implementar (Deploy)**.
5. Google te pedirá autorizar permisos la primera vez:
   - Haz clic en **"Revisar permisos"**.
   - Selecciona tu cuenta de Google.
   - Si ves la advertencia de *"Google no ha verificado esta app"*, haz clic en **"Avanzado"** (o *Advanced*) > **"Ir a VPlan Cloud Gateway (no seguro)"**.
   - Haz clic en **"Permitir"**.
6. **¡Listo!** Copia la **URL de la aplicación web** que te entrega (termina en `/exec`).

---

## 🔗 Vincular la URL en VPlan

1. Abre VPlan en tu navegador: **[http://localhost:5173](http://localhost:5173)**.
2. En la barra superior (Header), haz clic en el botón **`⚪ CONECTAR GOOGLE`** (o `GOOGLE SYNC`).
3. Pega la **URL de la aplicación web** que copiaste.
4. (Opcional) La API Key por defecto es `vplan_secret_key`.
5. Haz clic en **"PROBAR Y GUARDAR"**.

Verás el estado en verde **`🟢 CONECTADO`** y automáticamente se crearán en tu cuenta de Google:
- La hoja de cálculo **`V - Estrategico`** en Google Drive.
- El calendario secundario **`V - Tactico`** en Google Calendar.
- La lista de tareas **`V - Tareas`** en Google Tasks.

A partir de ese momento, **todas las creaciones, ediciones y eliminaciones en VPlan se sincronizarán solas en tiempo real**.
