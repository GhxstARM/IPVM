export interface ServiceError {
  message: string
  status?: number
}

function esServiceError(err: unknown): err is ServiceError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  )
}

/** Obtiene un mensaje legible de cualquier valor capturado en un `catch`. */
export function extraerMensaje(err: unknown, fallback: string): string {
  return esServiceError(err) && err.message ? err.message : fallback
}
