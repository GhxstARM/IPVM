var NOMBRE_HOJA = 'Gastos';
var NOMBRE_HOJA_INGRESOS = 'Ingresos';

function normalizarEncabezado(valor) {
  return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
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
  var nombre = tipo === 'gastos' ? NOMBRE_HOJA : NOMBRE_HOJA_INGRESOS;
  var hoja = ss.getSheetByName(nombre);
  if (!hoja) throw new Error('No existe la hoja "' + nombre + '".');
  return hoja;
}

function indicesHoja(hoja, tipo) {
  var headers = encabezados(hoja);
  var idx = {
    id: indice(headers, ['id', tipo === 'gastos' ? 'id gasto' : 'id ingreso']),
    fecha: indice(headers, ['fecha']),
    monto: indice(headers, ['monto']),
    gasto: indice(headers, ['gasto', 'categoria', 'razon', 'destino']),
    razon: indice(headers, ['destino', 'razon', 'descripcion']),
    tipoIngreso: indice(headers, ['tipo ingreso', 'tipo']),
    descripcion: indice(headers, ['descripcion', 'razon']),
    actualizadoEn: indice(headers, ['ultima actualizacion', 'actualizado', 'actualizado en', 'ultima modificacion', 'fecha actualizacion', 'timestamp', 'updatedat']),
  };
  return idx;
}

function asegurarId(hoja, tipo) {
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(tipo === 'gastos'
      ? ['ID Gasto', 'Gasto', 'Fecha', 'Razón', 'Monto']
      : ['ID Ingreso', 'Fecha', 'Tipo Ingreso', 'Descripción', 'Monto']);
  }
  var headers = encabezados(hoja);
  var id = indice(headers, ['id', tipo === 'gastos' ? 'id gasto' : 'id ingreso']);
  if (id < 0) throw new Error('La hoja debe tener una columna ID.');
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
  var texto = String(valor || '').trim();
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.exec(texto);
  if (!m) throw new Error('Fecha inválida.');
  var fecha = texto.indexOf('-') === 4
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
    : new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
  if (isNaN(fecha.getTime())) throw new Error('Fecha inválida.');
  return fecha;
}

function leerRegistros(ss, tipo) {
  var hoja = obtenerHoja(ss, tipo);
  var lastRow = hoja.getLastRow();
  var lastCol = hoja.getLastColumn();
  if (lastRow < 2 || !lastCol) return [];
  var data = hoja.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0].map(normalizarEncabezado);
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
      salida.push({
        id: idx.id >= 0 ? fila[idx.id] : r,
        fecha: idx.fecha >= 0 ? fechaISO(fila[idx.fecha], zona) : '',
        tipoIngreso: idx.tipoIngreso >= 0 ? String(fila[idx.tipoIngreso] || '') : '',
        descripcion: idx.descripcion >= 0 ? String(fila[idx.descripcion] || '') : '',
        monto: monto,
        actualizadoEn: actualizadoVal
      });
    }
  }
  return salida;
}

function leerPastor(ss) {
  var hoja = ss.getSheetByName('Pastor');
  if (!hoja || hoja.getLastRow() < 2) return {};
  var lastRow = hoja.getLastRow();
  var lastCol = hoja.getLastColumn();
  var headers = hoja.getRange(1, 1, 1, lastCol).getValues()[0].map(normalizarEncabezado);
  var valores = hoja.getRange(lastRow, 1, 1, lastCol).getValues()[0];
  var salida = {};
  headers.forEach(function(k, i) { if (k) salida[k] = String(valores[i] || '').trim(); });
  return salida;
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var accion = e && e.parameter ? e.parameter.action : '';
    if (accion === 'transparencia' || accion === 'gestion') {
      return respuesta({ success: true, gastos: leerRegistros(ss, 'gastos'), ingresos: leerRegistros(ss, 'ingresos') });
    }
    if (accion === 'pastor') return respuesta({ success: true, data: leerPastor(ss) });
    return respuesta({ success: true, message: 'Apps Script activo' });
  } catch (error) { return respuesta({ success: false, error: error.message }); }
}

function guardarRegistro(ss, tipo, operacion, id, registro) {
  var hoja = obtenerHoja(ss, tipo);
  var idCol = asegurarId(hoja, tipo);
  var idx = indicesHoja(hoja, tipo);
  var lastCol = hoja.getLastColumn();
  var filaNum = -1;
  if (operacion !== 'create') {
    if (id === undefined || id === null || id === '') throw new Error('Falta el ID del registro.');
    var ids = hoja.getRange(2, idCol + 1, Math.max(hoja.getLastRow() - 1, 0), 1).getValues();
    for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) { filaNum = i + 2; break; }
    if (filaNum < 0) throw new Error('No se encontró el registro con ID ' + id + '.');
  }
  if (operacion === 'delete') { hoja.deleteRow(filaNum); return { success: true }; }
  var monto = Number(registro.monto);
  if (!isFinite(monto) || monto <= 0) throw new Error('El monto debe ser mayor que cero.');
  var fecha = fechaReal(registro.fecha);
  var esGasto = tipo === 'gastos';
  var values = {};
  values[idx.fecha] = fecha;
  values[idx.monto] = monto;
  if (esGasto) {
    if (idx.gasto >= 0) values[idx.gasto] = String(registro.gasto || 'Otros');
    if (idx.razon >= 0) values[idx.razon] = String(registro.razon || '').trim();
    if (!String(registro.razon || '').trim()) throw new Error('La razón o destino es obligatoria.');
  } else {
    if (idx.tipoIngreso >= 0) values[idx.tipoIngreso] = String(registro.tipoIngreso || '').trim();
    if (idx.descripcion >= 0) values[idx.descripcion] = String(registro.descripcion || '').trim();
    if (!['presencial', 'online'].includes(String(registro.tipoIngreso || '').toLowerCase())) throw new Error('El tipo de ingreso debe ser Presencial u Online.');
    if (!String(registro.descripcion || '').trim()) throw new Error('La descripción es obligatoria.');
  }
  if (idx.fecha < 0 || idx.monto < 0) throw new Error('Faltan las columnas Fecha o Monto en la hoja.');
  if (idx.actualizadoEn >= 0) {
    values[idx.actualizadoEn] = new Date();
  }
  var newId = id;
  if (operacion === 'create') {
    var idsExistentes = hoja.getLastRow() > 1 ? hoja.getRange(2, idCol + 1, hoja.getLastRow() - 1, 1).getValues() : [];
    newId = idsExistentes.reduce(function(max, row) { return Math.max(max, Number(row[0]) || 0); }, 0) + 1;
    var nuevaFila = new Array(lastCol).fill('');
    nuevaFila[idCol] = newId;
    Object.keys(values).forEach(function(k) { if (Number(k) >= 0) nuevaFila[Number(k)] = values[k]; });
    hoja.appendRow(nuevaFila);
    filaNum = hoja.getLastRow();
  } else {
    Object.keys(values).forEach(function(k) { if (Number(k) >= 0) hoja.getRange(filaNum, Number(k) + 1).setValue(values[k]); });
  }
  if (idx.fecha >= 0) hoja.getRange(filaNum, idx.fecha + 1).setNumberFormat('dd-mm-yyyy');
  if (idx.actualizadoEn >= 0) hoja.getRange(filaNum, idx.actualizadoEn + 1).setNumberFormat('dd-mm-yyyy hh:mm:ss');
  return { success: true, id: newId };
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var data = JSON.parse(e.postData.contents || '{}');
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (data.action === 'gestion') {
      if (!['gastos', 'ingresos'].includes(data.type)) throw new Error('Tipo de registro inválido.');
      return respuesta(guardarRegistro(ss, data.type, data.operation, data.id, data.record || {}));
    }
    // Compatibilidad con la carga de boletas existente.
    var registro = data.record || data;
    var legacy = { gasto: registro.gasto || 'Otros', fecha: registro.fecha, razon: registro.razon, monto: registro.monto };
    return respuesta(guardarRegistro(ss, 'gastos', 'create', null, legacy));
  } catch (error) { return respuesta({ success: false, error: error.message }); }
  finally { try { lock.releaseLock(); } catch (ignored) {} }
}
