import { APARENCIA_ETAPA } from '@/config/homologacao'
import { cx } from '@/lib/classes'
import { etapaHomologacao } from '@/lib/homologacao'
import type { Homologacao } from '@/tipos/homologacao'

export function EtiquetaEtapa({ homologacao, className }: { homologacao: Homologacao; className?: string }) {
  const { rotulo, icone: Icone, classes } = APARENCIA_ETAPA[etapaHomologacao(homologacao)]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        classes,
        className,
      )}
    >
      <Icone aria-hidden className="size-3.5" />
      {rotulo}
    </span>
  )
}
