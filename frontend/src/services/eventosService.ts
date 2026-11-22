/**
 * eventosService.ts
 * Comunicación con el backend Express (conectado a Google Sheets)
 */

import { API_URL as API_BASE } from '../config'

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

export type NuevoEvento = Omit<Evento, 'id'>

/** Devuelve los eventos publicados; ante cualquier fallo de red retorna una lista vacía. */
export async function getEventos(): Promise<Evento[]> {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: unknown = await res.json()
    if (Array.isArray(data)) return data as Evento[]
  } catch {
    // La UI muestra el estado vacío; no hay nada que recuperar aquí.
  }
  return []
}

export async function crearEvento(data: NuevoEvento): Promise<Evento> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) throw new Error('No se pudo publicar el evento en Google Sheets')

  const result: { id?: string } = await res.json()
  return {
    id: result.id || `ev-${Date.now()}`,
    ...data,
  }
}

export async function eliminarEvento(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('No se pudo eliminar el evento en Google Sheets')
}
