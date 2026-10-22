import { APARENCIA_STATUS } from '@/config/status-visual'
import { cx } from '@/lib/classes'
import type { StatusSla } from '@/tipos/sla'

interface EtiquetaTomProps {
  tom: StatusSla
  texto: string
  className?: string
}

/**
 * Texto curto com a cor e o ícone de um status (no prazo, em risco, estourado,
 * concluído), para situações que não são SLA de chamado: prazo de ação,
 * decisão de homologação...
 */
export function EtiquetaTom({ tom, texto, className }: EtiquetaTomProps) {
  const { icone: Icone, classeTexto } = APARENCIA_STATUS[tom]
  return (
    <span className={cx('inline-flex items-center gap-1 text-xs font-medium', classeTexto, className)}>
      <Icone aria-hidden className="size-3.5 shrink-0" />
      {texto}
    </span>
  )
}
