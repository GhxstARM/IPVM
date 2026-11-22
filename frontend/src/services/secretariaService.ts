import { API_URL } from '../config'

interface RespuestaLogin {
  success?: boolean
  token?: string
  error?: string
}

/** Inicia sesión de Secretaría y devuelve el token de sesión. */
export async function loginSecretaria(password: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/secretaria/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const data: RespuestaLogin = await response.json()
  if (!response.ok || !data.success || !data.token) {
    throw new Error(data.error || 'Contraseña incorrecta.')
  }
  return data.token
}

/** Invalida la sesión en el servidor. Un fallo de red no impide cerrar sesión localmente. */
export async function logoutSecretaria(token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/secretaria/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    // La sesión local se descarta igualmente.
  }
}
