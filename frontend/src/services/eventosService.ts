/**
 * eventosService.ts
 * Comunicación con el backend Express (conectado a Google Sheets)
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
export const API_URL = `${API_BASE}/api/eventos`

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

export async function getEventos(): Promise<Evento[]> {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      return data
    }
  } catch (error) {
    console.error('Error al obtener eventos desde Google Sheets:', error)
  }
  return []
}

export async function crearEvento(data: Omit<Evento, 'id'>): Promise<Evento> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw { message: 'No se pudo publicar el evento en Google Sheets' }
  }

  const result = await res.json()
  return {
    id: result.id || `ev-${Date.now()}`,
    ...data,
  }
}

export async function eliminarEvento(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    throw { message: 'No se pudo eliminar el evento en Google Sheets' }
  }
}
