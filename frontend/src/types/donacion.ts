export interface ResultadoDonacion {
  estado: 'aprobada' | 'rechazada' | 'anulada' | 'error'
  monto?: string
  orden?: string
}

export const ESTADOS_DONACION: readonly ResultadoDonacion['estado'][] = [
  'aprobada',
  'rechazada',
  'anulada',
  'error',
]
