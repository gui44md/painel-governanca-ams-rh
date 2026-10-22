import { ArrowUp } from 'lucide-react'
import { CLASSES_PRIORIDADE } from '@/config/chamados'
import { TABELA_SLA } from '@/config/sla'
import { cx } from '@/lib/classes'
import type { Prioridade } from '@/tipos/chamado'

interface EtiquetaPrioridadeProps {
  prioridade: Prioridade
  /** A prioridade subiu pela regra do fechamento da folha. */
  elevada?: boolean
  className?: string
}

export function EtiquetaPrioridade({ prioridade, elevada = false, className }: EtiquetaPrioridadeProps) {
  const rotulo = TABELA_SLA[prioridade].rotulo
  const dica = elevada ? `${prioridade} ${rotulo} (elevada pela regra do fechamento da folha)` : `${prioridade} ${rotulo}`
  return (
    <span
      title={dica}
      className={cx(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        CLASSES_PRIORIDADE[prioridade],
        className,
      )}
    >
      {elevada && <ArrowUp aria-hidden className="size-3" />}
      {prioridade}
      <span className="sr-only">
        {' '}
        {rotulo}
        {elevada && ', elevada pela regra do fechamento da folha'}
      </span>
    </span>
  )
}
