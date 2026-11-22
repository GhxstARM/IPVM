/** Caché en memoria de la vista pública de Transparencia. */

const DURACION_MS = 60 * 1000;

let cache = { data: null, ts: 0 };

/** Devuelve los datos si siguen vigentes; si no, `null`. */
function obtenerVigente() {
  return cache.data && Date.now() - cache.ts < DURACION_MS ? cache.data : null;
}

/** Último valor guardado aunque esté vencido (sirve de respaldo si Sheets falla). */
function obtenerUltimo() {
  return cache.data;
}

function guardar(data) {
  cache = { data, ts: Date.now() };
}

/** Fuerza la recarga en la próxima consulta (tras crear, editar o eliminar registros). */
function invalidar() {
  cache.ts = 0;
}

module.exports = { obtenerVigente, obtenerUltimo, guardar, invalidar };
