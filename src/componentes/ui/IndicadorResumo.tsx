import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/classes'

interface IndicadorResumoProps {
  rotulo: string
  valor: string
  icone: LucideIcon
  /** Classe de cor do ícone (o texto fica sempre nas cores de texto). */
  classeIcone?: string
}

/** Número de apoio, menor que o CardKpi, para o topo das telas de detalhe. */
export function IndicadorResumo({ rotulo, valor, icone: Icone, classeIcone = 'text-primaria' }: IndicadorResumoProps) {
  return (
    <div className="animate-entrada flex items-center gap-3 rounded-xl bg-superficie p-3 shadow-sm ring-1 ring-borda sm:p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fundo">
        <Icone aria-hidden className={cx('size-5', classeIcone)} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-primaria">{valor}</p>
        <p className="text-xs leading-snug text-texto-suave">{rotulo}</p>
      </div>
    </div>
  )
}
