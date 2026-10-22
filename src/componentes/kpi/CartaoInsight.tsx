import { Link } from 'react-router-dom'
import { ArrowRight, Lightbulb, Plus } from 'lucide-react'
import { Botao } from '@/componentes/ui/Botao'
import { useAbrirDestino } from '@/hooks/useAbrirDestino'
import { cx } from '@/lib/classes'
import type { Insight } from '@/lib/insights'
import { linkSugestaoAcao } from '@/lib/rotas-plano'

interface CartaoInsightProps {
  insight: Insight
  /** O insight principal ganha mais destaque visual. */
  principal?: boolean
}

/** Uma frase e um botão (CONCEITO.md, seção 4: insights como cartões de destaque). */
export function CartaoInsight({ insight, principal = false }: CartaoInsightProps) {
  const abrirDestino = useAbrirDestino()
  return (
    <article
      className={cx(
        'animate-entrada flex flex-col gap-3 rounded-xl p-4 ring-1 sm:flex-row sm:items-center sm:gap-4',
        principal
          ? 'bg-primaria text-white shadow-md ring-primaria sm:p-5'
          : 'bg-superficie text-texto shadow-sm ring-borda',
      )}
    >
      <span
        className={cx(
          'flex size-10 shrink-0 items-center justify-center rounded-lg',
          principal ? 'bg-destaque text-primaria' : 'bg-destaque-claro text-primaria',
        )}
      >
        <Lightbulb aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cx('text-xs font-semibold tracking-wide uppercase', principal ? 'text-destaque' : 'text-texto-suave')}>
          {principal ? 'Insight em destaque' : 'Ponto de atenção'}
        </p>
        <p className={cx('mt-0.5 font-medium', principal ? 'text-base sm:text-lg' : 'text-sm')}>{insight.texto}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
        <Link
          to={linkSugestaoAcao(insight.id)}
          className={cx(
            'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium hover:underline',
            principal ? 'text-white' : 'text-primaria',
          )}
        >
          <Plus aria-hidden className="size-3.5" />
          Criar ação
        </Link>
        <Botao
          variante={principal ? 'secundario' : 'fantasma'}
          tamanho={principal ? 'md' : 'sm'}
          onClick={() => abrirDestino(insight.destino)}
          className={cx(principal && 'ring-0')}
        >
          {insight.rotuloAcao}
          <ArrowRight aria-hidden className="size-4" />
        </Botao>
      </div>
    </article>
  )
}
