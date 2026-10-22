import type { ReactNode } from 'react'
import { ArrowRight, Repeat, Star } from 'lucide-react'
import { CLASSE_FUNDO_FORNECEDOR } from '@/config/graficos'
import { Botao } from '@/componentes/ui/Botao'
import { cx } from '@/lib/classes'
import type { DesempenhoFornecedor } from '@/lib/fornecedores'
import { formatarHoras, formatarNumero, formatarPercentual } from '@/lib/formatacao'
import type { Fornecedor, SistemaRh } from '@/tipos/catalogo'

export interface AlertaReincidencia {
  sistema: SistemaRh
  taxa: number
  quantidade: number
}

interface CardFornecedorProps {
  fornecedor: Fornecedor
  sistemas: readonly SistemaRh[]
  desempenho: DesempenhoFornecedor
  emDestaque: boolean
  alerta: AlertaReincidencia | null
  aoAlternarDestaque: () => void
  aoVerReincidentes: (alerta: AlertaReincidencia) => void
}

function Metrica({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-texto-suave">{rotulo}</dt>
      <dd className="text-xl font-bold text-primaria">{children}</dd>
    </div>
  )
}

/** Resumo de um fornecedor: SLA, MTTR, reincidência, satisfação e volume (CONCEITO.md, seção 6.3). */
export function CardFornecedor({
  fornecedor,
  sistemas,
  desempenho,
  emDestaque,
  alerta,
  aoAlternarDestaque,
  aoVerReincidentes,
}: CardFornecedorProps) {
  const { resumo } = desempenho
  return (
    <article
      className={cx(
        'animate-entrada flex flex-col gap-4 overflow-hidden rounded-xl bg-superficie p-4 shadow-sm ring-1 transition-shadow sm:p-5',
        emDestaque ? 'ring-2 ring-primaria' : 'ring-borda',
      )}
    >
      <header className="flex items-start gap-3">
        <span aria-hidden className={cx('mt-1.5 size-3 shrink-0 rounded-full', CLASSE_FUNDO_FORNECEDOR[fornecedor.id])} />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-primaria">{fornecedor.nome}</h2>
          <p className="text-xs text-texto-suave">{sistemas.map((s) => s.nome).join(' · ')}</p>
        </div>
        <Botao variante={emDestaque ? 'primario' : 'secundario'} tamanho="sm" aria-pressed={emDestaque} onClick={aoAlternarDestaque}>
          {emDestaque ? 'Em destaque' : 'Destacar'}
        </Botao>
      </header>

      {resumo.volume === 0 ? (
        <p className="text-sm text-texto-suave">Sem chamados no recorte selecionado.</p>
      ) : (
        <dl className="grid grid-cols-3 gap-x-3 gap-y-3">
          <Metrica rotulo="SLA cumprido">{formatarPercentual(resumo.percentualSla, 0)}</Metrica>
          <Metrica rotulo="MTTR">{formatarHoras(resumo.mttrHoras)}</Metrica>
          <Metrica rotulo="Reincidência">{formatarPercentual(resumo.taxaReincidencia, 0)}</Metrica>
          <Metrica rotulo="Satisfação">
            <span className="inline-flex items-center gap-1">
              <Star aria-hidden className="size-4 fill-destaque text-destaque" />
              {formatarNumero(resumo.satisfacao, 1)}
            </span>
          </Metrica>
          <Metrica rotulo="Chamados">{resumo.volume}</Metrica>
          <Metrica rotulo="Evolutivas abertas">{resumo.backlogEvolutivas.quantidade}</Metrica>
        </dl>
      )}

      {alerta && (
        <div className="mt-auto flex flex-col gap-2 rounded-lg bg-destaque-claro p-3 ring-1 ring-destaque">
          <p className="flex items-start gap-2 text-sm text-texto">
            <Repeat aria-hidden className="mt-0.5 size-4 shrink-0 text-primaria" />
            <span>
              <strong>{formatarPercentual(alerta.taxa, 0)}</strong> de reincidência em {alerta.sistema.nome}, apesar do SLA.
            </span>
          </p>
          <Botao variante="secundario" tamanho="sm" className="self-start" onClick={() => aoVerReincidentes(alerta)}>
            Ver {alerta.quantidade} chamados reincidentes
            <ArrowRight aria-hidden className="size-3.5" />
          </Botao>
        </div>
      )}
    </article>
  )
}
