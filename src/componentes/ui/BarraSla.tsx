import { DATA_REFERENCIA } from '@/config/referencia'
import { APARENCIA_STATUS } from '@/config/status-visual'
import type { ChamadoAnalisado } from '@/lib/analise'
import { cx } from '@/lib/classes'
import { apresentarSla } from '@/lib/sla/apresentacao'

interface BarraSlaProps {
  chamado: ChamadoAnalisado
  /** Esconde o detalhe (tempo consumido) para caber em listas estreitas. */
  compacta?: boolean
  className?: string
}

/**
 * Barra de prazo do SLA: mostra quanto do prazo já foi consumido, sempre com
 * ícone e texto além da cor (CONCEITO.md, seção 4).
 */
export function BarraSla({ chamado, compacta = false, className }: BarraSlaProps) {
  const { tom, rotulo, detalhe, fracao } = apresentarSla(chamado, DATA_REFERENCIA)
  const { icone: Icone, classeCorBase, classeTexto } = APARENCIA_STATUS[tom]
  const percentual = fracao === null ? null : Math.round(fracao * 100)

  return (
    <div className={cx('flex min-w-0 flex-col gap-1', className)}>
      {percentual !== null && (
        <div
          role="progressbar"
          aria-label="Prazo de SLA consumido"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(percentual, 100)}
          aria-valuetext={`${percentual}% do prazo consumido`}
          className="relative h-1.5 w-full overflow-hidden rounded-full bg-grade"
        >
          <div
            className={cx('h-full rounded-full transition-[width] duration-500', classeCorBase)}
            style={{ width: `${Math.min(percentual, 100)}%` }}
          />
          {/* Marca dos 80%: a partir daqui o chamado fica "em risco". */}
          <span aria-hidden className="absolute inset-y-0 left-[80%] w-px bg-superficie" />
        </div>
      )}
      <p className={cx('flex min-w-0 items-center gap-1 text-xs font-medium', classeTexto)}>
        <Icone aria-hidden className="size-3.5 shrink-0" />
        <span className="truncate">{rotulo}</span>
        {!compacta && <span className="truncate font-normal text-texto-suave">· {detalhe}</span>}
      </p>
    </div>
  )
}
