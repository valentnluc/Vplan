/**
 * ==============================================================================
 * 🎯 VPlan OS - Google Workspace Cloud Gateway API
 * ==============================================================================
 * Conecta:
 * 1. Google Sheets   ➔ Hoja "V - Estrategico" (Hitos Estratégicos a 3 Años)
 * 2. Google Calendar ➔ Calendario "V - Tactico" (Hitos Tácticos / Entregables)
 * 3. Google Tasks    ➔ Lista "V - Tareas" (Tareas de Trinchera)
 * ==============================================================================
 */

var DEFAULT_SECRET_KEY = "vplan_secret_key";
var SHEET_NAME = "V - Estrategico";
var TAB_HITOS_ESTRATEGICOS = "Hitos_Estrategicos";
var CALENDAR_NAME = "V - Tactico";
var TASKS_LIST_NAME = "V - Tareas";

// Mapeo de colores de los 7 Campos de Vida a Google Calendar Event Color IDs (1 a 11)
var CAMPO_COLOR_MAP = {
  "01": "2",  // Salud -> Verde claro (Sage)
  "02": "10", // Bienestar -> Albahaca / Verde oscuro (Basil)
  "03": "9",  // Carrera y Educación -> Azul oscuro (Blueberry)
  "04": "7",  // Finanzas -> Cian (Peacock)
  "05": "6",  // Relaciones -> Naranja (Tangerine)
  "06": "5",  // Ocio y Creatividad -> Amarillo (Banana)
  "07": "11"  // Sistemas y Entorno -> Rojo (Tomato)
};

// ── Cliente Universal de Google Tasks (compatible con o sin servicio avanzado) ──
var TaskClient = {
  getHeaders: function() {
    return {
      "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
      "Content-Type": "application/json"
    };
  },
  listTaskLists: function() {
    if (typeof Tasks !== "undefined" && Tasks.Tasklists) {
      return Tasks.Tasklists.list().items || [];
    }
    var url = "https://tasks.googleapis.com/tasks/v1/users/@me/lists";
    var res = UrlFetchApp.fetch(url, { headers: this.getHeaders(), muteHttpExceptions: true });
    return JSON.parse(res.getContentText()).items || [];
  },
  insertTaskList: function(title) {
    if (typeof Tasks !== "undefined" && Tasks.Tasklists) {
      return Tasks.Tasklists.insert({ title: title });
    }
    var url = "https://tasks.googleapis.com/tasks/v1/users/@me/lists";
    var res = UrlFetchApp.fetch(url, {
      method: "post",
      headers: this.getHeaders(),
      payload: JSON.stringify({ title: title }),
      muteHttpExceptions: true
    });
    return JSON.parse(res.getContentText());
  },
  listTasks: function(listId) {
    if (typeof Tasks !== "undefined" && Tasks.Tasks) {
      return Tasks.Tasks.list(listId, { showCompleted: true, showHidden: true }).items || [];
    }
    var url = "https://tasks.googleapis.com/tasks/v1/lists/" + encodeURIComponent(listId) + "/tasks?showCompleted=true&showHidden=true";
    var res = UrlFetchApp.fetch(url, { headers: this.getHeaders(), muteHttpExceptions: true });
    return JSON.parse(res.getContentText()).items || [];
  },
  insertTask: function(taskResource, listId) {
    if (typeof Tasks !== "undefined" && Tasks.Tasks) {
      return Tasks.Tasks.insert(taskResource, listId);
    }
    var url = "https://tasks.googleapis.com/tasks/v1/lists/" + encodeURIComponent(listId) + "/tasks";
    var res = UrlFetchApp.fetch(url, {
      method: "post",
      headers: this.getHeaders(),
      payload: JSON.stringify(taskResource),
      muteHttpExceptions: true
    });
    return JSON.parse(res.getContentText());
  },
  patchTask: function(taskResource, listId, taskId) {
    if (typeof Tasks !== "undefined" && Tasks.Tasks) {
      return Tasks.Tasks.patch(taskResource, listId, taskId);
    }
    var url = "https://tasks.googleapis.com/tasks/v1/lists/" + encodeURIComponent(listId) + "/tasks/" + encodeURIComponent(taskId);
    var res = UrlFetchApp.fetch(url, {
      method: "patch",
      headers: this.getHeaders(),
      payload: JSON.stringify(taskResource),
      muteHttpExceptions: true
    });
    return JSON.parse(res.getContentText());
  },
  deleteTask: function(listId, taskId) {
    if (typeof Tasks !== "undefined" && Tasks.Tasks) {
      Tasks.Tasks.remove(listId, taskId);
      return true;
    }
    var url = "https://tasks.googleapis.com/tasks/v1/lists/" + encodeURIComponent(listId) + "/tasks/" + encodeURIComponent(taskId);
    UrlFetchApp.fetch(url, {
      method: "delete",
      headers: this.getHeaders(),
      muteHttpExceptions: true
    });
    return true;
  }
};

/**
 * Endpoint GET: Health check y test rápido desde navegador
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "ok",
      service: "VPlan Cloud Gateway",
      version: "1.0.0",
      sheet: SHEET_NAME,
      calendar: CALENDAR_NAME,
      tasks: TASKS_LIST_NAME,
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Endpoint POST: Recibe acciones desde VPlan
 */
function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "{}";
    var body = JSON.parse(rawData);

    // Validar clave de seguridad
    var providedKey = body.api_key || (e.parameter ? e.parameter.api_key : "");
    var secretKey = PropertiesService.getScriptProperties().getProperty("API_KEY") || DEFAULT_SECRET_KEY;

    if (providedKey && secretKey && providedKey !== secretKey) {
      return jsonResponse({ success: false, error: "Clave de API inválida" }, 401);
    }

    var action = body.action || "test_connection";
    var payload = body.payload || {};
    var result = {};

    switch (action) {
      case "test_connection":
        result = handleTestConnection();
        break;

      // ── 1. Hitos Estratégicos ➔ Google Sheets ───────────────────────────────
      case "sync_estrategico":
        result = handleSyncEstrategico(payload);
        break;

      case "delete_estrategico":
        result = handleDeleteEstrategico(payload);
        break;

      case "sync_all_estrategicos":
        result = handleSyncAllEstrategicos(payload);
        break;

      // ── 2. Hitos Tácticos ➔ Google Calendar ────────────────────────────────
      case "sync_tactico":
        result = handleSyncTactico(payload);
        break;

      case "delete_tactico":
        result = handleDeleteTactico(payload);
        break;

      // ── 3. Tareas ➔ Google Tasks ───────────────────────────────────────────
      case "sync_tarea":
        result = handleSyncTarea(payload);
        break;

      case "toggle_tarea":
        result = handleToggleTarea(payload);
        break;

      case "delete_tarea":
        result = handleDeleteTarea(payload);
        break;

      case "get_workspace_state":
        result = handleGetWorkspaceState();
        break;

      default:
        return jsonResponse({ success: false, error: "Acción no reconocida: " + action }, 400);
    }

    return jsonResponse({ success: true, action: action, data: result });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString(), stack: err.stack }, 500);
  }
}

function jsonResponse(obj, status) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// 🛠️ 1. GESTIÓN DE RECURSOS (Crear/Obtener Contenedores V - *)
// ==============================================================================

function getOrCreateSheet() {
  var files = DriveApp.getFilesByName(SHEET_NAME);
  var spreadsheet;
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    spreadsheet = SpreadsheetApp.create(SHEET_NAME);
  }

  var sheet = spreadsheet.getSheetByName(TAB_HITOS_ESTRATEGICOS);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(TAB_HITOS_ESTRATEGICOS);
    var headers = ["ID", "Campo ID", "Campo Nombre", "Título", "Fecha Inicio", "Fecha Target", "Estado", "Orden", "Última Actualización"];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#111111");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return { spreadsheet: spreadsheet, sheet: sheet };
}

function getOrCreateCalendar() {
  var cals = CalendarApp.getCalendarsByName(CALENDAR_NAME);
  if (cals.length > 0) {
    return cals[0];
  }
  return CalendarApp.createCalendar(CALENDAR_NAME, {
    summary: "Entregables e hitos tácticos del Framework VPlan",
    timeZone: "America/Argentina/Buenos_Aires"
  });
}

function getOrCreateTasksList() {
  var taskLists = TaskClient.listTaskLists();
  for (var i = 0; i < taskLists.length; i++) {
    if (taskLists[i].title === TASKS_LIST_NAME) {
      return taskLists[i].id;
    }
  }
  var newList = TaskClient.insertTaskList(TASKS_LIST_NAME);
  return newList.id;
}

// ==============================================================================
// 📋 2. HANDLERS DE ACCIONES
// ==============================================================================

function handleTestConnection() {
  var sheetObj = getOrCreateSheet();
  var cal = getOrCreateCalendar();
  var taskListId = getOrCreateTasksList();

  return {
    message: "Conexión exitosa con Google Workspace",
    sheet_url: sheetObj.spreadsheet.getUrl(),
    sheet_name: SHEET_NAME,
    calendar_id: cal.getId(),
    calendar_name: CALENDAR_NAME,
    tasks_list_id: taskListId,
    tasks_list_name: TASKS_LIST_NAME
  };
}

function handleSyncEstrategico(payload) {
  var sheetObj = getOrCreateSheet();
  var sheet = sheetObj.sheet;
  var data = sheet.getDataRange().getValues();
  var id = payload.id;
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    payload.id,
    payload.campo_id || "",
    payload.campo_nombre || "",
    payload.titulo || "",
    payload.fecha_inicio || "",
    payload.fecha_target || "",
    payload.estado || "en_progreso",
    payload.orden || 0,
    new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { id: id, synced: true, sheet_name: SHEET_NAME };
}

function handleDeleteEstrategico(payload) {
  var sheetObj = getOrCreateSheet();
  var sheet = sheetObj.sheet;
  var data = sheet.getDataRange().getValues();
  var id = payload.id;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { id: id, deleted: true };
    }
  }
  return { id: id, deleted: false, message: "No encontrado en Sheet" };
}

function handleSyncAllEstrategicos(payload) {
  var hitos = payload.hitos || [];
  var sheetObj = getOrCreateSheet();
  var sheet = sheetObj.sheet;
  
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 9).clearContent();
  }

  var rows = hitos.map(function(h) {
    return [
      h.id,
      h.campo_id || "",
      h.campo_nombre || "",
      h.titulo || "",
      h.fecha_inicio || "",
      h.fecha_target || "",
      h.estado || "en_progreso",
      h.orden || 0,
      new Date().toISOString()
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }

  return { total_synced: rows.length, sheet_name: SHEET_NAME };
}

function handleSyncTactico(payload) {
  var cal = getOrCreateCalendar();
  var eventId = payload.google_event_id;
  var titulo = "[TÁCTICO] " + (payload.titulo || "Entregable");
  var fechaStr = payload.fecha_limite; // YYYY-MM-DD
  var horaStr = payload.hora_limite || "10:00";
  var campoId = payload.campo_id || "03";
  var colorId = CAMPO_COLOR_MAP[campoId] || "9";

  var fechaParts = fechaStr.split("-");
  var horaParts = horaStr.split(":");
  var year = parseInt(fechaParts[0], 10);
  var month = parseInt(fechaParts[1], 10) - 1;
  var day = parseInt(fechaParts[2], 10);
  var hour = parseInt(horaParts[0], 10);
  var minute = parseInt(horaParts[1], 10);

  var startDate = new Date(year, month, day, hour, minute);
  var endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  var desc = "VPlan Hito Táctico\nCampo: [" + campoId + "]\nID: " + payload.id;

  var event;
  if (eventId) {
    try {
      event = cal.getEventById(eventId);
    } catch (e) {
      event = null;
    }
  }

  if (event) {
    event.setTitle(titulo);
    event.setTime(startDate, endDate);
    event.setDescription(desc);
    event.setColor(colorId);
    return { google_event_id: event.getId(), updated: true };
  } else {
    event = cal.createEvent(titulo, startDate, endDate, {
      description: desc
    });
    event.setColor(colorId);
    return { google_event_id: event.getId(), created: true };
  }
}

function handleDeleteTactico(payload) {
  var eventId = payload.google_event_id;
  if (!eventId) return { deleted: false, message: "Sin event_id" };
  
  var cal = getOrCreateCalendar();
  try {
    var ev = cal.getEventById(eventId);
    if (ev) {
      ev.deleteEvent();
      return { deleted: true };
    }
  } catch (e) {
    return { deleted: false, error: e.toString() };
  }
  return { deleted: false, message: "Evento no encontrado" };
}

function handleSyncTarea(payload) {
  var listId = getOrCreateTasksList();
  var taskId = payload.google_task_id;
  var titulo = payload.titulo || "Tarea VPlan";
  var campoId = payload.campo_id || "07";
  var duracionMin = payload.duracion_min || 60;
  
  var notes = "Campo: [" + campoId + "] | Duración: " + duracionMin + "m\nID VPlan: " + payload.id;
  if (payload.descripcion) notes += "\n\n" + payload.descripcion;

  var taskResource = {
    title: titulo,
    notes: notes,
    status: payload.completada ? "completed" : "needsAction"
  };

  if (payload.fecha_agendada) {
    taskResource.due = payload.fecha_agendada + "T00:00:00.000Z";
  }

  if (taskId) {
    try {
      var updated = TaskClient.patchTask(taskResource, listId, taskId);
      if (updated && updated.id) {
        return { google_task_id: updated.id, updated: true };
      }
    } catch (e) {
      // Fallback a crear
    }
  }

  var created = TaskClient.insertTask(taskResource, listId);
  return { google_task_id: created ? created.id : null, created: true };
}

function handleToggleTarea(payload) {
  var taskId = payload.google_task_id;
  if (!taskId) return { toggled: false, message: "Sin task_id" };

  var listId = getOrCreateTasksList();
  var status = payload.completada ? "completed" : "needsAction";
  var taskResource = { status: status };
  
  if (payload.completada) {
    taskResource.completed = new Date().toISOString();
  }

  var updated = TaskClient.patchTask(taskResource, listId, taskId);
  return { google_task_id: updated ? updated.id : taskId, status: status, toggled: true };
}

function handleDeleteTarea(payload) {
  var taskId = payload.google_task_id;
  if (!taskId) return { deleted: false, message: "Sin task_id" };

  var listId = getOrCreateTasksList();
  try {
    TaskClient.deleteTask(listId, taskId);
    return { deleted: true };
  } catch (e) {
    return { deleted: false, error: e.toString() };
  }
}

function handleGetWorkspaceState() {
  var listId = getOrCreateTasksList();
  var tasks = TaskClient.listTasks(listId);
  var cal = getOrCreateCalendar();
  
  var now = new Date();
  var startRange = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  var endRange = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  var calEvents = cal.getEvents(startRange, endRange);

  var eventsData = calEvents.map(function(ev) {
    var desc = ev.getDescription() || "";
    var idMatch = desc.match(/ID: ([\w-]+)/);
    var vplanId = idMatch ? idMatch[1] : "";
    return {
      google_event_id: ev.getId(),
      vplan_id: vplanId,
      title: ev.getTitle(),
      start_time: ev.getStartTime().toISOString(),
      end_time: ev.getEndTime().toISOString()
    };
  });

  var sheetObj = getOrCreateSheet();
  var sheetData = sheetObj.sheet.getDataRange().getValues();
  var sheetRows = [];
  for (var i = 1; i < sheetData.length; i++) {
    var row = sheetData[i];
    if (row[0]) {
      sheetRows.push({
        id: String(row[0]),
        campo_id: String(row[1] || "03"),
        campo_nombre: String(row[2] || ""),
        titulo: String(row[3] || ""),
        fecha_inicio: row[4] instanceof Date ? Utilities.formatDate(row[4], "America/Argentina/Buenos_Aires", "yyyy-MM-dd") : String(row[4] || ""),
        fecha_target: row[5] instanceof Date ? Utilities.formatDate(row[5], "America/Argentina/Buenos_Aires", "yyyy-MM-dd") : String(row[5] || ""),
        estado: String(row[6] || "en_progreso"),
        orden: Number(row[7] || 0)
      });
    }
  }

  var tasksData = tasks.map(function(t) {
    var notes = t.notes || "";
    var idMatch = notes.match(/ID VPlan: ([\w-]+)/);
    var vplanId = idMatch ? idMatch[1] : "";
    return {
      google_task_id: t.id,
      vplan_id: vplanId,
      title: t.title,
      notes: notes,
      status: t.status,
      due: t.due || null,
      completed: t.completed || null
    };
  });

  return {
    sheet_rows: sheetRows,
    calendar_events: eventsData,
    tasks: tasksData
  };
}
