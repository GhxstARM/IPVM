export type TipoRegistro = 'gastos' | 'ingresos'

export interface Gasto {
  id: number | string
  gasto: string
  /** YYYY-MM-DD */
  fecha: string
  razon: string
  monto: number
  actualizadoEn?: string
}

export interface Ingreso {
  id: number | string
  /** YYYY-MM-DD */
  fecha: string
  tipoIngreso?: string
  descripcion: string
  monto: number
  actualizadoEn?: string
}

export type Registro = Gasto | Ingreso

/** Categorías de gasto disponibles al registrar boletas. */
export const CATEGORIAS_GASTO = [
  'Alimentación',
  'Transporte',
  'Salud',
  'Servicios básicos',
  'Hogar',
  'Entretenimiento',
  'Educación',
  'Trabajo',
  'Otros',
] as const
