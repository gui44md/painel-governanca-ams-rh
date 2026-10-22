import { ROTULOS_STATUS_ACAO } from '@/config/plano-acao'
import type { Acao, StatusAcao } from '@/tipos/plano-acao'
import { CartaoAcao } from './CartaoAcao'

const COLUNAS = Object.keys(ROTULOS_STATUS_ACAO) as StatusAcao[]

interface QuadroAcoesProps {
  acoes: readonly Acao[]
  aoAbrir: (id: string) => void
  aoMover: (id: string, status: StatusAcao) => void
}

/** Kanban do plano de ação: A fazer → Em andamento → Concluída. */
export function QuadroAcoes({ acoes, aoAbrir, aoMover }: QuadroAcoesProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {COLUNAS.map((status) => {
        const daColuna = acoes
          .filter((a) => a.status === status)
          .toSorted((a, b) =>
            status === 'concluida'
              ? (b.concluidaEm?.getTime() ?? 0) - (a.concluidaEm?.getTime() ?? 0)
              : a.prazo.getTime() - b.prazo.getTime(),
          )
        return (
          <section
            key={status}
            aria-label={`${ROTULOS_STATUS_ACAO[status]}: ${daColuna.length} ações`}
            className="flex flex-col gap-2 rounded-xl bg-fundo p-2"
          >
            <header className="flex items-center justify-between px-1 pt-1">
              <h3 className="text-sm font-semibold text-primaria">{ROTULOS_STATUS_ACAO[status]}</h3>
              <span className="rounded-full bg-superficie px-2 py-0.5 text-xs font-semibold text-texto ring-1 ring-borda">
                {daColuna.length}
              </span>
            </header>
            {daColuna.map((acao) => (
              <CartaoAcao
                key={acao.id}
                acao={acao}
                aoAbrir={() => aoAbrir(acao.id)}
                aoMover={(novo) => aoMover(acao.id, novo)}
              />
            ))}
            {daColuna.length === 0 && <p className="px-1 py-4 text-center text-xs text-texto-suave">Nenhuma ação</p>}
          </section>
        )
      })}
    </div>
  )
}
