import type { ReactNode } from 'react'
import { Repeat, Star, TriangleAlert, Wrench } from 'lucide-react'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { ROTULOS_ESTADO, ROTULOS_SOLUCAO, ROTULOS_TIPO } from '@/config/chamados'
import { JANELA_REINCIDENCIA_DIAS, TABELA_SLA } from '@/config/sla'
import { BarraSla } from '@/componentes/ui/BarraSla'
import { EtiquetaPrioridade } from '@/componentes/ui/EtiquetaPrioridade'
import type { ChamadoAnalisado } from '@/lib/analise'
import { formatarData, formatarDataHora, formatarDuracao } from '@/lib/formatacao'
import { LinhaDoTempo } from './LinhaDoTempo'

interface DetalheChamadoProps {
  chamado: ChamadoAnalisado
  /** Chamados que repetiram este depois (mesma causa em até 15 dias). */
  repeticoesPosteriores: readonly ChamadoAnalisado[]
  aoAbrirChamado: (id: string) => void
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-texto-suave uppercase">{titulo}</h3>
      {children}
    </section>
  )
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-texto-suave">{rotulo}</dt>
      <dd className="text-sm font-medium text-texto">{children}</dd>
    </div>
  )
}

function LinkChamado({ id, aoAbrir }: { id: string; aoAbrir: (id: string) => void }) {
  return (
    <button type="button" onClick={() => aoAbrir(id)} className="font-mono font-semibold text-primaria underline-offset-2 hover:underline">
      {id}
    </button>
  )
}

/** Conteúdo do painel lateral de um chamado (CONCEITO.md, seção 6.2). */
export function DetalheChamado({ chamado, repeticoesPosteriores, aoAbrirChamado }: DetalheChamadoProps) {
  const sistema = SISTEMAS_RH.find((s) => s.id === chamado.sistemaId)
  const fornecedor = FORNECEDORES.find((f) => f.id === chamado.fornecedorId)
  const { sla, reincidencia, evolutiva } = chamado

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaPrioridade prioridade={sla?.prioridadeEfetiva ?? chamado.prioridade} elevada={sla?.elevadoPorFechamento} />
        <span className="rounded-md bg-fundo px-2 py-0.5 text-xs font-medium text-texto ring-1 ring-borda">
          {ROTULOS_ESTADO[chamado.estado]}
        </span>
        {chamado.reincidente && (
          <span className="inline-flex items-center gap-1 rounded-md bg-destaque-claro px-2 py-0.5 text-xs font-semibold text-primaria">
            <Repeat aria-hidden className="size-3.5" />
            Reincidente
          </span>
        )}
      </div>

      {(reincidencia?.repeticaoDe || chamado.reaberto || repeticoesPosteriores.length > 0) && (
        <div className="flex gap-3 rounded-lg bg-destaque-claro p-3 text-sm text-texto ring-1 ring-destaque">
          <Repeat aria-hidden className="mt-0.5 size-4 shrink-0 text-primaria" />
          <div className="flex flex-col gap-1">
            {reincidencia?.repeticaoDe && (
              <p>
                Repete o chamado <LinkChamado id={reincidencia.repeticaoDe} aoAbrir={aoAbrirChamado} />: mesmo sistema e mesma
                causa em até {JANELA_REINCIDENCIA_DIAS} dias.
              </p>
            )}
            {chamado.reaberto && <p>Foi reaberto pelo usuário depois de resolvido.</p>}
            {repeticoesPosteriores.length > 0 && (
              <p>
                O problema voltou em{' '}
                {repeticoesPosteriores.map((r, i) => (
                  <span key={r.id}>
                    {i > 0 && ', '}
                    <LinkChamado id={r.id} aoAbrir={aoAbrirChamado} />
                  </span>
                ))}
                .
              </p>
            )}
          </div>
        </div>
      )}

      <Secao titulo={sla ? 'Prazo de SLA' : 'Entrega'}>
        <BarraSla chamado={chamado} />
        <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-3">
          {sla ? (
            <>
              <Dado rotulo="Prioridade">
                {sla.prioridadeEfetiva} · {TABELA_SLA[sla.prioridadeEfetiva].rotulo}
                {sla.elevadoPorFechamento && <span className="block text-xs font-normal text-texto-suave">Era {chamado.prioridade}; subiu pelo fechamento da folha</span>}
              </Dado>
              <Dado rotulo="Prazo">{formatarDataHora(sla.prazoEm)}</Dado>
              <Dado rotulo="Tempo consumido">
                {formatarDuracao(sla.consumidoMinutos)} de {formatarDuracao(sla.limiteMinutos)}
                {sla.modo === '24x7' ? ' (24x7)' : ' úteis'}
              </Dado>
              <Dado rotulo="Pausado (aguardando usuário)">
                {sla.pausadoMinutos > 0 ? formatarDuracao(sla.pausadoMinutos) : 'Sem pausas'}
              </Dado>
              <Dado rotulo="1ª resposta">
                {sla.primeiraRespostaEm ? (
                  <>
                    {formatarDataHora(sla.primeiraRespostaEm)}
                    <span className="block text-xs font-normal text-texto-suave">
                      {sla.respostaNoPrazo ? 'Dentro do prazo' : 'Fora do prazo'} ({formatarDuracao(TABELA_SLA[sla.prioridadeEfetiva].respostaMinutos)})
                    </span>
                  </>
                ) : (
                  'Aguardando'
                )}
              </Dado>
            </>
          ) : (
            evolutiva && <Dado rotulo="Entrega prevista">{formatarData(evolutiva.entregaPrevista)}</Dado>
          )}
        </dl>
      </Secao>

      <Secao titulo="Descrição">
        <p className="text-sm text-texto">{chamado.descricao}</p>
      </Secao>

      {evolutiva && (
        <Secao titulo="Requisito e análise de impacto">
          <dl className="flex flex-col gap-3">
            <Dado rotulo="Requisito">
              <span className="font-normal">{evolutiva.requisito}</span>
            </Dado>
            <Dado rotulo="Impacto">
              <span className="font-normal">{evolutiva.impacto}</span>
            </Dado>
          </dl>
        </Secao>
      )}

      <Secao titulo="Informações">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Dado rotulo="Tipo">{ROTULOS_TIPO[chamado.tipo]}</Dado>
          <Dado rotulo="Abertura">{formatarDataHora(chamado.abertoEm)}</Dado>
          <Dado rotulo="Sistema">{sistema?.nome}</Dado>
          <Dado rotulo="Fornecedor">{fornecedor?.nome}</Dado>
          <Dado rotulo="Categoria">{chamado.categoria}</Dado>
          <Dado rotulo="Causa raiz">
            <span className="font-normal">{chamado.causa}</span>
          </Dado>
          {chamado.solucao && (
            <Dado rotulo="Solução">
              <span className="inline-flex items-center gap-1">
                {chamado.solucao === 'paliativa' ? (
                  <TriangleAlert aria-hidden className="size-3.5 text-em-risco-texto" />
                ) : (
                  <Wrench aria-hidden className="size-3.5 text-texto-suave" />
                )}
                {ROTULOS_SOLUCAO[chamado.solucao]}
              </span>
            </Dado>
          )}
          {chamado.satisfacao !== null && (
            <Dado rotulo="Satisfação do usuário">
              <span className="inline-flex items-center gap-1">
                <Star aria-hidden className="size-3.5 fill-destaque text-destaque" />
                {chamado.satisfacao} de 5
              </span>
            </Dado>
          )}
        </dl>
      </Secao>

      <Secao titulo="Linha do tempo">
        <LinhaDoTempo eventos={chamado.historico} />
      </Secao>
    </div>
  )
}
