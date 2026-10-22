import { cx } from '@/lib/classes'

export interface ItemLegenda {
  id: string
  rotulo: string
  cor: string
  /** Série esmaecida quando outra está em destaque. */
  esmaecida?: boolean
}

/** Legenda em HTML: sempre presente com duas ou mais séries. */
export function LegendaSeries({ itens, className }: { itens: readonly ItemLegenda[]; className?: string }) {
  return (
    <ul className={cx('flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave', className)}>
      {itens.map((item) => (
        <li key={item.id} className={cx('flex items-center gap-1.5', item.esmaecida && 'opacity-50')}>
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: item.cor }} />
          {item.rotulo}
        </li>
      ))}
    </ul>
  )
}
