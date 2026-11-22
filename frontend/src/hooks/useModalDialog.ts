import { useEffect } from 'react'

/**
 * Comportamiento común para diálogos modales:
 * - Cierra al presionar la tecla Escape (salvo si `bloqueado` está activo).
 * - Bloquea el desplazamiento del documento mientras el modal está abierto.
 */
export function useModalDialog(onClose: () => void, bloqueado = false): void {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !bloqueado) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, bloqueado])
}
