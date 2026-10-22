import { APARENCIA_STATUS } from '@/config/status-visual'
import { cx } from '@/lib/classes'
import type { StatusSla } from '@/tipos/sla'

interface EtiquetaStatusProps {
  status: StatusSla
  className?: string
}

/** Status de SLA com cor + ícone + texto, nunca só cor. */
export function EtiquetaStatus({ status, className }: EtiquetaStatusProps) {
  const { rotulo, descricao, icone: Icone, classesEtiqueta } = APARENCIA_STATUS[status]
  return (
    <span
      title={descricao}
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        classesEtiqueta,
        className,
      )}
    >
      <Icone aria-hidden className="size-3.5" />
      {rotulo}
    </span>
  )
}
