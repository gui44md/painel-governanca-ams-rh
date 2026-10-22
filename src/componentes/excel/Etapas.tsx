import { Check } from 'lucide-react'
import { cx } from '@/lib/classes'

interface EtapasProps {
  etapas: readonly string[]
  /** Índice da etapa atual (as anteriores aparecem como concluídas). */
  atual: number
}

/** Indicador de progresso em passos (stepper). */
export function Etapas({ etapas, atual }: EtapasProps) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Etapas da importação">
      {etapas.map((etapa, indice) => {
        const concluida = indice < atual
        const ativa = indice === atual
        return (
          <li key={etapa} aria-current={ativa ? 'step' : undefined} className="flex flex-col gap-2">
            <span
              aria-hidden
              className={cx('h-1 rounded-full', concluida ? 'bg-primaria' : ativa ? 'bg-destaque' : 'bg-grade')}
            />
            <span className="flex items-center gap-1.5 text-xs font-medium sm:text-sm">
              <span
                className={cx(
                  'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  concluida && 'bg-primaria text-white',
                  ativa && 'bg-destaque text-primaria',
                  !concluida && !ativa && 'bg-fundo text-texto-suave ring-1 ring-borda',
                )}
              >
                {concluida ? <Check aria-hidden className="size-3" /> : indice + 1}
              </span>
              <span className={cx('hidden sm:inline', ativa ? 'text-primaria' : 'text-texto-suave')}>{etapa}</span>
              <span className="sr-only">{concluida ? ' (concluída)' : ativa ? ' (atual)' : ''}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
