import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Minus, Plus } from 'lucide-react'
import type { DefinicaoKpi } from '@/config/kpis'
import { cx } from '@/lib/classes'
import { direcaoTendencia, formatarValorKpi, formatarVariacaoKpi, type ValorKpi } from '@/lib/kpis'
import { linkSugestaoAcao } from '@/lib/rotas-plano'
import { Dica } from './Dica'

interface CardKpiProps {
  definicao: DefinicaoKpi
  valor: ValorKpi
  /** Nome do mês de comparação, ex.: "set". */
  rotuloMesAnterior: string
  /** Linha extra abaixo do valor (ex.: idade média do backlog). */
  complemento?: string
  /** Atraso da animação de entrada, para os cards surgirem em sequência. */
  ordem?: number
}

const CLASSES_TENDENCIA = {
  melhorou: 'text-no-prazo-texto',
  piorou: 'text-estourado-texto',
  estavel: 'text-texto-suave',
} as const

const DESCRICAO_TENDENCIA = { melhorou: 'Melhorou', piorou: 'Piorou', estavel: 'Estável' } as const

/** Número grande com seta de tendência contra o mês anterior. */
export function CardKpi({ definicao, valor, rotuloMesAnterior, complemento, ordem = 0 }: CardKpiProps) {
  const direcao = direcaoTendencia(valor.variacao, definicao.melhorQuando)
  const Seta = valor.variacao === null || direcao === 'estavel' ? Minus : valor.variacao > 0 ? ArrowUp : ArrowDown

  return (
    <article
      className="animate-entrada flex flex-col gap-2 overflow-hidden rounded-xl bg-superficie p-4 shadow-sm ring-1 ring-borda"
      style={{ animationDelay: `${ordem * 60}ms` }}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-texto-suave">{definicao.rotulo}</h3>
        <Dica texto={definicao.dica} alinhamento="fim" />
      </header>
      <p className="text-3xl font-bold tracking-tight text-primaria">
        {formatarValorKpi(valor.valor, definicao.formato)}
      </p>
      {complemento && <p className="-mt-1 text-xs text-texto-suave">{complemento}</p>}
      <p className={cx('mt-auto flex items-center gap-1 text-xs font-medium', direcao && CLASSES_TENDENCIA[direcao])}>
        <Seta aria-hidden className="size-3.5" />
        {direcao && valor.variacao !== null ? (
          <>
            <span className="sr-only">{DESCRICAO_TENDENCIA[direcao]}:</span>
            {direcao === 'estavel' ? 'Estável' : formatarVariacaoKpi(valor.variacao, definicao.formato)}
            <span className="font-normal text-texto-suave">vs {rotuloMesAnterior}</span>
          </>
        ) : (
          <span className="font-normal text-texto-suave">Sem base para comparar</span>
        )}
      </p>
      {direcao === 'piorou' && (
        <Link
          to={linkSugestaoAcao(`indicador:${definicao.id}`)}
          className="-mb-1 inline-flex items-center gap-1 self-start text-xs font-medium text-primaria hover:underline"
        >
          <Plus aria-hidden className="size-3.5" />
          Criar ação
          <span className="sr-only"> para {definicao.rotulo}</span>
        </Link>
      )}
    </article>
  )
}
