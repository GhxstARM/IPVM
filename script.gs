// ===== Configuración de Nombres de Hojas =====
var NOMBRE_HOJA_GASTOS = 'Gastos';
var NOMBRE_HOJA_INGRESOS = 'Ingresos';
var NOMBRE_HOJA_PASTOR = 'Pastor';
var NOMBRE_HOJA_EVENTOS = 'Eventos';

// ===== Utilidades y Normalización =====

function normalizarEncabezado(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function encabezados(hoja) {
  var ultimaCol = hoja.getLastColumn();
  if (!ultimaCol) return [];
  return hoja.getRange(1, 1, 1, ultimaCol).getValues()[0].map(normalizarEncabezado);
}

function indice(headers, candidatos) {
  for (var i = 0; i < candidatos.length; i++) {
    var idx = headers.indexOf(normalizarEncabezado(candidatos[i]));
    if (idx >= 0) return idx;
  }
  return -1;
}

function obtenerHoja(ss, tipo) {
  var nombre = '';
  if (tipo === 'gastos') nombre = NOMBRE_HOJA_GASTOS;
  else if (tipo === 'ingresos') nombre = NOMBRE_HOJA_INGRESOS;
  else if (tipo === 'pastor') nombre = NOMBRE_HOJA_PASTOR;
  else if (tipo === 'eventos') nombre = NOMBRE_HOJA_EVENTOS;
  else nombre = tipo;

  var hoja = ss.getSheetByName(nombre);
  if (!hoja) {
    hoja = ss.insertSheet(nombre);
  }
  return hoja;
}

function asegurarEncabezados(hoja, tipo) {
  if (hoja.getLastRow() === 0) {
    if (tipo === 'gastos') {
      hoja.appendRow(['ID Gasto', 'Gasto', 'Fecha', 'Razón', 'Monto', 'Última Actualización']);
    } else if (tipo === 'ingresos') {
      hoja.appendRow(['ID Ingreso', 'Fecha', 'Tipo Ingreso', 'Descripción', 'Monto', 'Última Actualización']);
    } else if (tipo === 'pastor') {
      hoja.appendRow(['Fecha', 'Mensaje']);
    } else if (tipo === 'eventos') {
      hoja.appendRow(['ID', 'Título', 'Fecha', 'Hora', 'Descripción']);
    }
  }
}

function indicesHoja(hoja, tipo) {
  asegurarEncabezados(hoja, tipo);
  var headers = encabezados(hoja);
  return {
    id: indice(headers, ['id', tipo === 'gastos' ? 'id gasto' : 'id ingreso']),
    fecha: indice(headers, ['fecha']),
    monto: indice(headers, ['monto']),
    gasto: indice(headers, ['gasto', 'categoria', 'razon', 'destino']),
    razon: indice(headers, ['destino', 'razon', 'descripcion']),
    tipoIngreso: indice(headers, ['tipo ingreso', 'tipo']),
    descripcion: indice(headers, ['descripcion', 'razon', 'concepto']),
    actualizadoEn: indice(headers, ['ultima actualizacion', 'actualizado', 'actualizado en', 'ultima modificacion', 'fecha actualizacion', 'timestamp', 'updatedat']),
  };
}

function asegurarId(hoja, tipo) {
  asegurarEncabezados(hoja, tipo);
  var headers = encabezados(hoja);
  var id = indice(headers, ['id', tipo === 'gastos' ? 'id gasto' : 'id ingreso']);
  if (id < 0) {
    // Si no existe columna ID, se asume la primera columna
    return 0;
  }
  return id;
}

function fechaISO(valor, zona) {
  if (!valor) return '';
  if (valor instanceof Date) {
    if (isNaN(valor.getTime())) return '';
    return Utilities.formatDate(valor, zona, 'yyyy-MM-dd');
  }
  var texto = String(valor).trim();
  var m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.exec(texto);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  var iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  return iso ? iso[0] : '';
}

function fechaHoraISO(valor, zona) {
  if (!valor) return '';
  if (valor instanceof Date) {
    if (isNaN(valor.getTime())) return '';
    return Utilities.formatDate(valor, zona, "yyyy-MM-dd'T'HH:mm:ss'Z'");
  }
  var texto = String(valor).trim();
  if (!texto) return '';
  var d = new Date(texto);
  return !isNaN(d.getTime()) ? d.toISOString() : '';
}

function fechaReal(valor) {
  if (valor instanceof Date) return valor;
  var texto = String(valor || '').trim();
  if (!texto) return new Date();
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.exec(texto);
  if (!m) return new Date();
  var fecha = texto.indexOf('-') === 4
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
    : new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
  if (isNaN(fecha.getTime())) return new Date();
  return fecha;
}

function respuesta(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== MÓDULO 1: FINANZAS (GASTOS E INGRESOS) =====

function leerRegistros(ss, tipo) {
  var hoja = ss.getSheetByName(tipo === 'gastos' ? NOMBRE_HOJA_GASTOS : NOMBRE_HOJA_INGRESOS);
  if (!hoja || hoja.getLastRow() < 2 || !hoja.getLastColumn()) return [];

  var lastRow = hoja.getLastRow();
  var lastCol = hoja.getLastColumn();
  var data = hoja.getRange(1, 1, lastRow, lastCol).getValues();
  var idx = indicesHoja(hoja, tipo);
  var zona = ss.getSpreadsheetTimeZone();
  var salida = [];

  for (var r = 1; r < data.length; r++) {
    var fila = data[r];
    var monto = idx.monto >= 0 ? Number(fila[idx.monto]) : NaN;
    if (idx.monto < 0 || fila[idx.monto] === '' || isNaN(monto)) continue;

    var actualizadoVal = idx.actualizadoEn >= 0 ? fechaHoraISO(fila[idx.actualizadoEn], zona) : '';

    if (tipo === 'gastos') {
      salida.push({
        id: idx.id >= 0 ? fila[idx.id] : r,
        gasto: idx.gasto >= 0 ? String(fila[idx.gasto] || 'Otros') : 'Otros',
        fecha: idx.fecha >= 0 ? fechaISO(fila[idx.fecha], zona) : '',
        razon: idx.razon >= 0 ? String(fila[idx.razon] || '') : '',
        monto: monto,
        actualizadoEn: actualizadoVal
      });
    } else {
      var tipoIngresoVal = idx.tipoIngreso >= 0 ? String(fila[idx.tipoIngreso] || '') : '';
      salida.push({
        id: idx.id >= 0 ? fila[idx.id] : r,
        fecha: idx.fecha >= 0 ? fechaISO(fila[idx.fecha], zona) : '',
        tipoIngreso: tipoIngresoVal,
        tipo: tipoIngresoVal, // compatibilidad con frontends que lean .tipo
        descripcion: idx.descripcion >= 0 ? String(fila[idx.descripcion] || '') : '',
        monto: monto,
        actualizadoEn: actualizadoVal
      });
    }
  }
  return salida;
}

function guardarRegistro(ss, tipo, operacion, id, registro) {
  var hoja = obtenerHoja(ss, tipo);
  var idCol = asegurarId(hoja, tipo);
  var idx = indicesHoja(hoja, tipo);
  var lastCol = Math.max(hoja.getLastColumn(), 5);
  var filaNum = -1;

  if (operacion !== 'create') {
    if (id === undefined || id === null || id === '') throw new Error('Falta el ID del registro.');
    var ids = hoja.getRange(2, idCol + 1, Math.max(hoja.getLastRow() - 1, 0), 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        filaNum = i + 2;
        break;
      }
    }
    if (filaNum < 0) throw new Error('No se encontró el registro con ID ' + id + '.');
  }

  if (operacion === 'delete') {
    hoja.deleteRow(filaNum);
    return { success: true };
  }

  var monto = Number(registro.monto);
  if (!isFinite(monto) || monto <= 0) throw new Error('El monto debe ser mayor que cero.');

  var fecha = fechaReal(registro.fecha);
  var esGasto = tipo === 'gastos';
  var values = {};

  if (idx.fecha >= 0) values[idx.fecha] = fecha;
  if (idx.monto >= 0) values[idx.monto] = monto;

  if (esGasto) {
    if (idx.gasto >= 0) values[idx.gasto] = String(registro.gasto || 'Otros');
    var razon = String(registro.razon || registro.destino || registro.descripcion || '').trim();
    if (idx.razon >= 0) values[idx.razon] = razon || 'Gasto registrado';
  } else {
    var rawTipo = String(registro.tipoIngreso || registro.tipo || 'Online').trim().toLowerCase();
    var tipoFinal = rawTipo.indexOf('pres') >= 0 ? 'Presencial' : 'Online';
    var desc = String(registro.descripcion || registro.concepto || registro.razon || 'Ingreso registrado').trim();

    if (idx.tipoIngreso >= 0) values[idx.tipoIngreso] = tipoFinal;
    if (idx.descripcion >= 0) values[idx.descripcion] = desc;
  }

  if (idx.actualizadoEn >= 0) {
    values[idx.actualizadoEn] = new Date();
  }

  var newId = id;
  if (operacion === 'create') {
    var idsExistentes = hoja.getLastRow() > 1
      ? hoja.getRange(2, idCol + 1, hoja.getLastRow() - 1, 1).getValues()
      : [];
    newId = idsExistentes.reduce(function(max, row) {
      return Math.max(max, Number(row[0]) || 0);
    }, 0) + 1;

    var nuevaFila = new Array(lastCol).fill('');
    nuevaFila[idCol] = newId;
    Object.keys(values).forEach(function(k) {
      if (Number(k) >= 0) nuevaFila[Number(k)] = values[k];
    });
    hoja.appendRow(nuevaFila);
    filaNum = hoja.getLastRow();
  } else {
    Object.keys(values).forEach(function(k) {
      if (Number(k) >= 0) hoja.getRange(filaNum, Number(k) + 1).setValue(values[k]);
    });
  }

  if (idx.fecha >= 0) hoja.getRange(filaNum, idx.fecha + 1).setNumberFormat('dd-mm-yyyy');
  if (idx.actualizadoEn >= 0) hoja.getRange(filaNum, idx.actualizadoEn + 1).setNumberFormat('dd-mm-yyyy hh:mm:ss');

  return { success: true, id: newId };
}

// ===== MÓDULO 2: MENSAJE PASTORAL =====

function leerPastor(ss) {
  var hoja = ss.getSheetByName(NOMBRE_HOJA_PASTOR);
  if (!hoja || hoja.getLastRow() < 2) return { mensaje: '', fecha: '' };

  var lastRow = hoja.getLastRow();
  var lastCol = hoja.getLastColumn();
  var headers = hoja.getRange(1, 1, 1, lastCol).getValues()[0].map(normalizarEncabezado);
  var valores = hoja.getRange(lastRow, 1, 1, lastCol).getValues()[0];

  var idxMensaje = indice(headers, ['mensaje', 'texto', 'contenido', 'palabras']);
  var idxFecha = indice(headers, ['fecha', 'timestamp', 'actualizado']);
  var zona = ss.getSpreadsheetTimeZone();

  var mensaje = idxMensaje >= 0 ? String(valores[idxMensaje] || '').trim() : String(valores[1] || '').trim();
  var fecha = '';
  if (idxFecha >= 0 && valores[idxFecha]) {
    var vFecha = valores[idxFecha];
    fecha = vFecha instanceof Date ? Utilities.formatDate(vFecha, zona, 'yyyy-MM-dd HH:mm:ss') : String(vFecha);
  }

  return { mensaje: mensaje, fecha: fecha };
}

function guardarPastor(ss, mensajeTexto) {
  var hoja = obtenerHoja(ss, 'pastor');
  asegurarEncabezados(hoja, 'pastor');

  var headers = encabezados(hoja);
  var idxFecha = indice(headers, ['fecha', 'timestamp', 'actualizado']);
  var idxMensaje = indice(headers, ['mensaje', 'texto', 'contenido']);

  var lastCol = Math.max(hoja.getLastColumn(), 2);
  var fila = new Array(lastCol).fill('');

  var fechaActual = new Date();
  var texto = String(mensajeTexto || '').trim();

  fila[idxFecha >= 0 ? idxFecha : 0] = fechaActual;
  fila[idxMensaje >= 0 ? idxMensaje : 1] = texto;

  hoja.appendRow(fila);
  var ultimaFila = hoja.getLastRow();
  hoja.getRange(ultimaFila, (idxFecha >= 0 ? idxFecha : 0) + 1).setNumberFormat('dd-mm-yyyy hh:mm:ss');

  return { success: true, message: 'Mensaje pastoral guardado correctamente' };
}

// ===== MÓDULO 3: EVENTOS =====

function leerEventos(ss) {
  var hoja = ss.getSheetByName(NOMBRE_HOJA_EVENTOS);
  if (!hoja || hoja.getLastRow() < 2) return [];

  var lastRow = hoja.getLastRow();
  var lastCol = hoja.getLastColumn();
  var data = hoja.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0].map(normalizarEncabezado);

  var idxId = indice(headers, ['id', 'idevento']);
  var idxTitulo = indice(headers, ['titulo', 'nombre', 'evento']);
  var idxFecha = indice(headers, ['fecha']);
  var idxHora = indice(headers, ['hora']);
  var idxDesc = indice(headers, ['descripcion', 'detalle', 'mensaje']);
  var idxLugar = indice(headers, ['lugar', 'ubicacion']);
  var idxEtiqueta = indice(headers, ['etiqueta', 'tag']);
  var idxColor = indice(headers, ['color']);

  var zona = ss.getSpreadsheetTimeZone();
  var eventos = [];

  for (var r = 1; r < data.length; r++) {
    var fila = data[r];
    var idVal = idxId >= 0 ? String(fila[idxId] || '') : ('ev-' + r);
    var tituloVal = idxTitulo >= 0 ? String(fila[idxTitulo] || '') : '';
    if (!tituloVal && !idVal) continue;

    var fechaVal = idxFecha >= 0 ? fechaISO(fila[idxFecha], zona) : '';
    var horaVal = '';
    if (idxHora >= 0) {
      var rawHora = fila[idxHora];
      if (rawHora instanceof Date) {
        horaVal = Utilities.formatDate(rawHora, zona, 'HH:mm');
      } else {
        horaVal = String(rawHora || '').trim();
      }
    }

    var ev = {
      id: idVal || ('ev-' + r),
      titulo: tituloVal,
      fecha: fechaVal,
      hora: horaVal,
      descripcion: idxDesc >= 0 ? String(fila[idxDesc] || '') : ''
    };

    if (idxLugar >= 0 && fila[idxLugar]) ev.lugar = String(fila[idxLugar]);
    if (idxEtiqueta >= 0 && fila[idxEtiqueta]) ev.etiqueta = String(fila[idxEtiqueta]);
    if (idxColor >= 0 && fila[idxColor]) ev.color = String(fila[idxColor]);

    eventos.push(ev);
  }

  return eventos;
}

function guardarEvento(ss, data) {
  var hoja = obtenerHoja(ss, 'eventos');
  asegurarEncabezados(hoja, 'eventos');

  var headers = encabezados(hoja);
  var idxId = indice(headers, ['id', 'idevento']);
  var idxTitulo = indice(headers, ['titulo', 'nombre', 'evento']);
  var idxFecha = indice(headers, ['fecha']);
  var idxHora = indice(headers, ['hora']);
  var idxDesc = indice(headers, ['descripcion', 'detalle', 'mensaje']);

  var lastCol = Math.max(hoja.getLastColumn(), 5);
  var nuevaFila = new Array(lastCol).fill('');

  var evId = data.id || ('ev-' + Date.now());
  nuevaFila[idxId >= 0 ? idxId : 0] = evId;
  nuevaFila[idxTitulo >= 0 ? idxTitulo : 1] = String(data.titulo || '').trim();
  nuevaFila[idxFecha >= 0 ? idxFecha : 2] = String(data.fecha || '').trim();
  nuevaFila[idxHora >= 0 ? idxHora : 3] = String(data.hora || '').trim();
  nuevaFila[idxDesc >= 0 ? idxDesc : 4] = String(data.descripcion || '').trim();

  hoja.appendRow(nuevaFila);
  return { success: true, id: evId, message: 'Evento guardado correctamente' };
}

function eliminarEvento(ss, id) {
  var hoja = ss.getSheetByName(NOMBRE_HOJA_EVENTOS);
  if (!hoja || hoja.getLastRow() < 2) throw new Error('No hay eventos registrados para eliminar.');

  var headers = encabezados(hoja);
  var idxId = indice(headers, ['id', 'idevento']);
  var idCol = idxId >= 0 ? idxId : 0;

  var ids = hoja.getRange(2, idCol + 1, hoja.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(id).trim()) {
      hoja.deleteRow(i + 2);
      return { success: true, message: 'Evento eliminado correctamente' };
    }
  }

  throw new Error('Evento no encontrado con ID: ' + id);
}

// ===== CONTROLADORES PRINCIPALES (doGet / doPost) =====

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var accion = (e && e.parameter && e.parameter.action) ? String(e.parameter.action).trim() : '';

    // 1. Lectura de Transparencia o Gestión de Finanzas
    if (accion === 'transparencia' || accion === 'gestion') {
      return respuesta({
        success: true,
        gastos: leerRegistros(ss, 'gastos'),
        ingresos: leerRegistros(ss, 'ingresos')
      });
    }

    // 2. Lectura del Mensaje Pastoral
    if (accion === 'pastor') {
      var pastorData = leerPastor(ss);
      return respuesta({
        success: true,
        data: pastorData,
        mensaje: pastorData.mensaje || ''
      });
    }

    // 3. Lectura de Eventos
    if (accion === 'eventos') {
      return respuesta({
        success: true,
        eventos: leerEventos(ss)
      });
    }

    // Respuesta por defecto si no se especificó acción
    return respuesta({
      success: true,
      message: 'Apps Script IPVM activo',
      accion: accion
    });
  } catch (error) {
    return respuesta({ success: false, error: error.message });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var data = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : '{}');
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. GESTIÓN FINANZAS (Secretaría CRUD)
    if (data.action === 'gestion') {
      if (!['gastos', 'ingresos'].includes(data.type)) {
        throw new Error('Tipo de registro inválido para gestión: ' + data.type);
      }
      return respuesta(guardarRegistro(ss, data.type, data.operation, data.id, data.record || {}));
    }

    // 2. GUARDAR MENSAJE PASTORAL
    if (data.tipo === 'pastor' || data.action === 'pastor') {
      var mensajeTexto = data.mensaje !== undefined ? data.mensaje : (data.record && data.record.mensaje);
      return respuesta(guardarPastor(ss, mensajeTexto));
    }

    // 3. GUARDAR NUEVO EVENTO
    if (data.tipo === 'evento' || data.action === 'evento') {
      var eventoData = data.record || data;
      return respuesta(guardarEvento(ss, eventoData));
    }

    // 4. ELIMINAR EVENTO
    if (data.tipo === 'eliminar_evento' || data.action === 'eliminar_evento') {
      var idEvento = data.id || (data.record && data.record.id);
      if (!idEvento) throw new Error('Falta el ID del evento a eliminar.');
      return respuesta(eliminarEvento(ss, idEvento));
    }

    // 5. CARGA DE BOLETA / GASTO INDIVIDUAL (desde módulo OCR o subida manual)
    if (data.tipo === 'gasto' || data.action === 'gasto') {
      var gastoData = data.record || data;
      var registroGasto = {
        gasto: gastoData.gasto || 'Otros',
        fecha: gastoData.fecha || '',
        razon: gastoData.razon || gastoData.descripcion || '',
        monto: gastoData.monto
      };
      return respuesta(guardarRegistro(ss, 'gastos', 'create', null, registroGasto));
    }

    // 6. COMPATIBILIDAD CON CARGA LEGACY (si llega un objeto directo con monto)
    var regLegacy = data.record || data;
    if (regLegacy && regLegacy.monto !== undefined && regLegacy.monto !== null && regLegacy.monto !== '') {
      var legacy = {
        gasto: regLegacy.gasto || 'Otros',
        fecha: regLegacy.fecha || '',
        razon: regLegacy.razon || regLegacy.descripcion || '',
        monto: regLegacy.monto
      };
      return respuesta(guardarRegistro(ss, 'gastos', 'create', null, legacy));
    }

    return respuesta({
      success: false,
      error: 'Acción o tipo no reconocido: ' + (data.tipo || data.action || 'desconocido')
    });
  } catch (error) {
    return respuesta({ success: false, error: error.message });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignored) {}
  }
}