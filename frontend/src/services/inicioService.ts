/**
 * inicioService.ts
 * Lógica de comunicación con el backend para el mensaje pastoral de la página de inicio.
 *
 * Para activar el backend real: asigna la URL de Make.com / Google Sheets a API_URL.
 * Si API_URL está vacía, opera en modo local persistente (localStorage) para permitir pruebas inmediatas.
 */

// ── Configuración ────────────────────────────────────────────────────────────
export const API_URL = ''

// ── Tipos públicos ───────────────────────────────────────────────────────────
export interface MensajeInicio {
  mensaje: string
}

export interface ServiceError {
  message: string
  status?: number
}

const STORAGE_KEY = 'ipvm_mensaje_pastoral'

// ── Mensaje pastoral por defecto ─────────────────────────────────────────────
const MENSAJE_PASTORAL_PREDETERMINADO =
  'Les doy la bienvenida a todos quienes buscan un lugar de paz, crecimiento y comunidad. ' +
  'Somos un ministerio familiar que ama a Dios y a su creación. Esta comunidad es un hogar abierto ' +
  'para toda persona que desea encontrar sentido y propósito en la fe. Juntos construimos una comunidad ' +
  'más justa, solidaria y esperanzadora. Los esperamos cada domingo a las 10:00 hrs.'

// ── Helpers internos ─────────────────────────────────────────────────────────
function buildError(message: string, status?: number): ServiceError {
  return { message, status }
}

async function parseJSON<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw buildError(`Respuesta inesperada del servidor (${res.status})`, res.status)
  }
  return res.json() as Promise<T>
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * GET el mensaje pastoral actual.
 * Si API_URL está configurada, consulta el backend.
 * Si no, lee de localStorage (con fallback al mensaje predeterminado).
 */
export async function getMensajeInicio(): Promise<MensajeInicio> {
  if (API_URL) {
    const res = await fetch(API_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      throw buildError('No se pudo cargar el mensaje pastoral desde el servidor.', res.status)
    }

    return parseJSON<MensajeInicio>(res)
  }

  // Fallback local
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (guardado) {
      return { mensaje: guardado }
    }
  } catch {
    // Si localStorage está restringido
  }

  return { mensaje: MENSAJE_PASTORAL_PREDETERMINADO }
}

/**
 * POST para actualizar el mensaje pastoral.
 * Si API_URL está configurada, envía al backend.
 * Si no, persiste localmente en localStorage.
 */
export async function guardarMensajeInicio(data: MensajeInicio): Promise<void> {
  if (API_URL) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      throw buildError('No se pudo guardar el mensaje pastoral en el servidor.', res.status)
    }
    return
  }

  // Fallback local
  try {
    localStorage.setItem(STORAGE_KEY, data.mensaje)
  } catch {
    throw buildError('No se pudo guardar el mensaje pastoral localmente.')
  }
}
