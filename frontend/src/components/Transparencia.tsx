interface GastoCategoria {
  categoria: string
  icon: string
  monto: number
  porcentaje: number
}

const gastos: GastoCategoria[] = [
  { categoria: 'Acción social y olla común', icon: '🤝', monto: 850000, porcentaje: 42 },
  { categoria: 'Servicios básicos (luz/agua/gas)', icon: '💡', monto: 480000, porcentaje: 24 },
  { categoria: 'Aseo y mantención', icon: '🧹', monto: 320000, porcentaje: 16 },
  { categoria: 'Material litúrgico', icon: '📖', monto: 220000, porcentaje: 11 },
  { categoria: 'Gastos administrativos', icon: '🗂️', monto: 140000, porcentaje: 7 },
]

const totalRecaudado = 2400000
const totalGastado = gastos.reduce((s, g) => s + g.monto, 0)
const saldo = totalRecaudado - totalGastado

/** Formato CLP: $1.450.000 */
function formatCLP(n: number) {
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return `${n < 0 ? '-' : ''}$${formatted}`
}

const ultimasTransacciones = [
  { fecha: '29 sep', desc: 'Colecta dominical', tipo: 'ingreso', monto: 385000 },
  { fecha: '26 sep', desc: 'Pago servicio eléctrico', tipo: 'gasto', monto: -152000 },
  { fecha: '22 sep', desc: 'Colecta dominical', tipo: 'ingreso', monto: 410000 },
  { fecha: '20 sep', desc: 'Materiales catequesis', tipo: 'gasto', monto: -87000 },
  { fecha: '15 sep', desc: 'Donación familia González', tipo: 'ingreso', monto: 250000 },
  { fecha: '12 sep', desc: 'Olla común — 20 familias', tipo: 'gasto', monto: -280000 },
]

export default function Transparencia() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
          📊 Rendición de Cuentas
        </h2>
        <p className="text-stone-500 text-sm">Período: Septiembre 2026 · Montos en Pesos Chilenos (CLP)</p>
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Total Recaudado',
            value: formatCLP(totalRecaudado),
            icon: '💰',
            sub: 'Colectas + ofrendas y donaciones',
            color: 'bg-green-50 border-green-200',
            valueColor: 'text-green-700',
          },
          {
            label: 'Total Gastado',
            value: formatCLP(totalGastado),
            icon: '📤',
            sub: 'Todos los egresos del período',
            color: 'bg-rose-50 border-rose-200',
            valueColor: 'text-rose-700',
          },
          {
            label: 'Saldo Disponible',
            value: formatCLP(saldo),
            icon: '🏦',
            sub: 'Reserva para el próximo período',
            color: 'bg-sky-50 border-sky-200',
            valueColor: 'text-sky-700',
          },
        ].map(({ label, value, icon, sub, color, valueColor }) => (
          <div key={label} className={`border rounded-2xl p-5 space-y-1 ${color}`}>
            <p className="text-sm font-medium text-stone-500 flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              {label}
            </p>
            <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
            <p className="text-xs text-stone-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Desglose de gastos */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
        <h3 className="font-bold text-stone-800 text-lg">Desglose de Gastos por Categoría</h3>
        <ul className="space-y-4">
          {gastos.map(({ categoria, icon, monto, porcentaje }) => (
            <li key={categoria} className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-700 font-medium">
                  {icon} {categoria}
                </span>
                <span className="font-semibold text-stone-800">
                  {formatCLP(monto)}
                  <span className="text-stone-400 font-normal ml-1.5">({porcentaje}%)</span>
                </span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Últimas transacciones */}
      <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h3 className="font-bold text-stone-800 text-lg">Últimos Movimientos</h3>
        </div>
        <ul className="divide-y divide-stone-100">
          {ultimasTransacciones.map(({ fecha, desc, tipo, monto }) => (
            <li
              key={`${fecha}-${desc}`}
              className="flex items-center justify-between px-6 py-3 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{tipo === 'ingreso' ? '🟢' : '🔴'}</span>
                <div>
                  <p className="text-sm font-medium text-stone-700">{desc}</p>
                  <p className="text-xs text-stone-400">{fecha} 2026</p>
                </div>
              </div>
              <span className={`text-sm font-bold ${monto > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                {monto > 0 ? '+' : ''}{formatCLP(monto)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-stone-400 text-center">
        Los antecedentes son registrados y procesados por la secretaría parroquial. Última actualización: 1 oct 2026.
      </p>
    </div>
  )
}
