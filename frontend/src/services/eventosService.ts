/**
 * eventosService.ts
 * Toda la lógica de comunicación con el backend para la entidad Evento.
 * Los componentes nunca llaman a fetch directamente; usan estas funciones.
 *
 * Para activar el backend real: asigna la URL de Make.com / Google Sheets a API_URL.
 * Si API_URL está vacía, opera con persistencia local (localStorage) para pruebas funcionales.
 */

// ── Configuración ────────────────────────────────────────────────────────────
export const API_URL = ''

// ── Tipos públicos ───────────────────────────────────────────────────────────
export interface Evento {
  id: string
  titulo: string
  fecha: string
  hora: string
  descripcion: string
  lugar?: string
  etiqueta?: string
  color?: string
}

export interface ServiceError {
  message: string
  status?: number
}

const STORAGE_KEY = 'ipvm_eventos_lista'

const EVENTOS_INICIALES: Evento[] = [
  {
    id: '1',
    titulo: 'Liturgia Dominical',
    fecha: '2026-10-25',
    hora: '10:00',
    descripcion:
      'Celebración eucarística central de la semana. Todos los feligreses son bienvenidos. Se realizará la colecta dominical para las obras sociales de la parroquia.',
    lugar: 'Templo principal — Av. Los Libertadores 842',
    etiqueta: 'Liturgia',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: '2',
    titulo: 'Catequesis Infantil',
    fecha: '2026-10-25',
    hora: '11:30',
    descripcion:
      'Encuentro formativo para niños y niñas de 6 a 12 años. Se trabajará sobre los valores del respeto y la solidaridad mediante dinámicas grupales y reflexión bíblica.',
    lugar: 'Sala de catequesis — Primer piso',
    etiqueta: 'Formación',
    color: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  {
    id: '3',
    titulo: 'Misa Vespertina Familiar',
    fecha: '2026-10-25',
    hora: '19:00',
    descripcion:
      'Segunda celebración del día, orientada a familias. Incluye canto litúrgico y reflexión breve. Al finalizar se realizará compartido comunitario en el patio parroquial.',
    lugar: 'Templo principal — Av. Los Libertadores 842',
    etiqueta: 'Liturgia',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
]

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

function getEventosLocales(): Evento[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as Evento[]
    }
    // Inicializar con eventos por defecto
    localStorage.setItem(STORAGE_KEY, JSON.stringify(EVENTOS_INICIALES))
    return EVENTOS_INICIALES
  } catch {
    return EVENTOS_INICIALES
  }
}

function setEventosLocales(eventos: Evento[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos))
  } catch {
    // Si storage está restringido
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * GET todos los eventos.
 */
export async function getEventos(): Promise<Evento[]> {
  if (API_URL) {
    const res = await fetch(API_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      throw buildError('No se pudieron cargar los eventos desde el servidor.', res.status)
    }

    return parseJSON<Evento[]>(res)
  }

  // Fallback local
  return getEventosLocales()
}

/**
 * POST para crear un nuevo evento.
 */
export async function crearEvento(
  data: Omit<Evento, 'id'>,
): Promise<Evento> {
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
      throw buildError('No se pudo publicar el evento en el servidor.', res.status)
    }

    return parseJSON<Evento>(res)
  }

  // Fallback local
  const nuevo: Evento = {
    id: `ev-${Date.now()}`,
    lugar: data.lugar || 'Templo principal',
    etiqueta: data.etiqueta || 'Comunidad',
    color: data.color || 'bg-amber-100 text-amber-800 border-amber-200',
    ...data,
  }
  const actuales = getEventosLocales()
  setEventosLocales([nuevo, ...actuales])
  return nuevo
}

/**
 * DELETE un evento por id.
 */
export async function eliminarEvento(id: string): Promise<void> {
  if (API_URL) {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' })

    if (!res.ok) {
      throw buildError('No se pudo eliminar el evento en el servidor.', res.status)
    }
    return
  }

  // Fallback local
  const actuales = getEventosLocales()
  const filtrados = actuales.filter((ev) => ev.id !== id)
  setEventosLocales(filtrados)
}
