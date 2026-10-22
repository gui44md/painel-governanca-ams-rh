import { SISTEMAS_RH } from '@/config/catalogo'
import { ITENS_POR_COLUNA_KANBAN, ROTULOS_ESTADO } from '@/config/chamados'
import { BarraSla } from '@/componentes/ui/BarraSla'
import { EtiquetaPrioridade } from '@/componentes/ui/EtiquetaPrioridade'
import type { ChamadoAnalisado } from '@/lib/analise'
import { agruparPorEstado, prioridadeExibida } from '@/lib/lista-chamados'
import type { EstadoChamado } from '@/tipos/chamado'
import { MarcadorReincidente } from './MarcadorReincidente'

const SISTEMA = new Map(SISTEMAS_RH.map((s) => [s.id, s.nomeCurto]))
const COLUNAS = Object.keys(ROTULOS_ESTADO) as EstadoChamado[]

interface KanbanChamadosProps {
  chamados: readonly ChamadoAnalisado[]
  aoAbrir: (id: string) => void
}

/** Quadro por status do atendimento: Aberto → Em atendimento → Aguardando usuário → Resolvido. */
export function KanbanChamados({ chamados, aoAbrir }: KanbanChamadosProps) {
  const grupos = agruparPorEstado(chamados)
  return (
    <div tabIndex={0} role="region" aria-label="Quadro de chamados por status" className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-[56rem] grid-cols-4 gap-3">
        {COLUNAS.map((estado) => {
          const itens = grupos[estado]
          const visiveis = itens.slice(0, ITENS_POR_COLUNA_KANBAN)
          return (
            <section key={estado} aria-label={`${ROTULOS_ESTADO[estado]}: ${itens.length} chamados`} className="flex flex-col rounded-xl bg-fundo p-2">
              <header className="flex items-center justify-between px-1 pt-1 pb-2">
                <h3 className="text-sm font-semibold text-primaria">{ROTULOS_ESTADO[estado]}</h3>
                <span className="rounded-full bg-superficie px-2 py-0.5 text-xs font-semibold text-texto ring-1 ring-borda">
                  {itens.length}
                </span>
              </header>
              <ul tabIndex={0} aria-label={`Chamados: ${ROTULOS_ESTADO[estado]}`} className="flex max-h-[34rem] flex-col gap-2 overflow-y-auto">
                {visiveis.map((chamado) => (
                  <li key={chamado.id}>
                    <button
                      type="button"
                      onClick={() => aoAbrir(chamado.id)}
                      className="flex w-full flex-col gap-2 rounded-lg bg-superficie p-3 text-left shadow-sm ring-1 ring-borda hover:ring-primaria/40"
                    >
                      <span className="flex items-center gap-1.5 text-xs text-texto-suave">
                        <span className="font-mono">{chamado.id}</span>
                        {chamado.reincidente && <MarcadorReincidente />}
                        <span className="ml-auto">
                          <EtiquetaPrioridade prioridade={prioridadeExibida(chamado)} elevada={chamado.sla?.elevadoPorFechamento} />
                        </span>
                      </span>
                      <span className="line-clamp-2 text-sm font-medium text-texto">{chamado.titulo}</span>
                      <span className="text-xs text-texto-suave">{SISTEMA.get(chamado.sistemaId)}</span>
                      <BarraSla chamado={chamado} compacta />
                    </button>
                  </li>
                ))}
                {itens.length === 0 && <li className="px-1 py-4 text-center text-xs text-texto-suave">Nenhum chamado</li>}
              </ul>
              {itens.length > visiveis.length && (
                <p className="px-1 pt-2 text-xs text-texto-suave">
                  +{itens.length - visiveis.length} chamados. Use os filtros para refinar.
                </p>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
