/**
 * inicioService.ts
 * Comunicación con el backend Express (conectado a Google Sheets)
 */

import { API_URL as API_BASE } from '../config'

export const API_URL = `${API_BASE}/api/pastoral`

export interface MensajeInicio {
  mensaje: string
}

const MENSAJE_PASTORAL_PREDETERMINADO =
  'Les doy la bienvenida a todos quienes buscan un lugar de paz, crecimiento y comunidad. ' +
  'Somos un ministerio familiar que ama a Dios y a su creación. Esta comunidad es un hogar abierto ' +
  'para toda persona que desea encontrar sentido y propósito en la fe. Juntos construimos una comunidad ' +
  'más justa, solidaria y esperanzadora. Los esperamos cada domingo a las 10:00 hrs.'

/** Devuelve el mensaje pastoral vigente o, si no se puede leer, el predeterminado. */
export async function getMensajeInicio(): Promise<MensajeInicio> {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: { mensaje?: string } = await res.json()
    if (data.mensaje && data.mensaje.trim()) return { mensaje: data.mensaje }
  } catch {
    // Se usa el mensaje predeterminado.
  }
  return { mensaje: MENSAJE_PASTORAL_PREDETERMINADO }
}

export async function guardarMensajeInicio(data: MensajeInicio): Promise<void> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) throw new Error('No se pudo guardar el mensaje pastoral en Google Sheets')
}
