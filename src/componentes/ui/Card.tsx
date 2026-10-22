import type { ReactNode } from 'react'
import { cx } from '@/lib/classes'

interface CardProps {
  titulo?: ReactNode
  /** Elemento à direita do título (botão, dica, filtro). */
  acao?: ReactNode
  /** Linha amarela que lembra trilhos no topo do card. */
  comTrilho?: boolean
  className?: string
  id?: string
  children: ReactNode
}

export function Card({ titulo, acao, comTrilho = true, className, id, children }: CardProps) {
  return (
    <section
      id={id}
      className={cx(
        'animate-entrada scroll-mt-40 overflow-hidden rounded-xl bg-superficie shadow-sm ring-1 ring-borda',
        className,
      )}
    >
      {comTrilho && <div aria-hidden className="trilho" />}
      <div className="p-4 sm:p-5">
        {(titulo || acao) && (
          <header className="mb-3 flex items-start justify-between gap-3">
            {titulo && <h2 className="text-sm font-semibold text-primaria">{titulo}</h2>}
            {acao}
          </header>
        )}
        {children}
      </div>
    </section>
  )
}
