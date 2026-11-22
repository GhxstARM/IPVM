/**
 * Configuración global del frontend.
 *
 * En desarrollo, define `VITE_API_URL` (ej. http://192.168.1.10:3000) si pruebas
 * desde el celular. Si no existe, se asume el mismo host que sirve el frontend.
 */
export const API_URL: string =
  import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3000`
