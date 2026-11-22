/** Esqueleto de carga de la vista de Transparencia. */
export default function TransparenciaSkeleton() {
  return (
    <div
      className="page space-y-8 animate-pulse"
      aria-busy="true"
      aria-label="Cargando datos financieros"
    >
      {/* Encabezado */}
      <div className="space-y-2.5">
        <div className="h-3.5 w-36 rounded bg-amber-100" />
        <div className="h-9 w-72 rounded-xl bg-stone-200" />
        <div className="h-4 w-56 rounded-lg bg-stone-100" />
      </div>

      {/* Barra de filtros */}
      <div className="card flex flex-wrap gap-3 p-5">
        <div className="h-10 w-40 rounded-xl bg-stone-100" />
        <div className="h-10 w-48 rounded-xl bg-stone-100" />
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-stone-200" />
              <div className="h-9 w-9 rounded-xl bg-stone-100" />
            </div>
            <div className="h-8 w-36 rounded-lg bg-stone-200" />
            <div className="h-3 w-40 rounded bg-stone-100" />
          </div>
        ))}
      </div>

      {/* Desglose por categoría */}
      <div className="card space-y-5 p-6">
        <div className="h-5 w-52 rounded bg-stone-200" />
        <ul className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-36 rounded bg-stone-200" />
                <div className="h-4 w-24 rounded bg-stone-200" />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-stone-200"
                  style={{ width: `${20 * i}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Últimos movimientos */}
      <div className="card overflow-hidden">
        <div className="border-b border-stone-100 px-6 py-4">
          <div className="h-5 w-44 rounded bg-stone-200" />
        </div>
        <ul className="divide-y divide-stone-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-xl bg-stone-100" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-44 rounded bg-stone-200" />
                  <div className="h-3 w-24 rounded bg-stone-100" />
                </div>
              </div>
              <div className="h-4 w-20 rounded bg-stone-200" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
