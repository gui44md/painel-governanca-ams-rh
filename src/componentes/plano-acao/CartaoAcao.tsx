import { useId } from 'react'
import { UserRound } from 'lucide-react'
import { FORNECEDORES } from '@/config/catalogo'
import { CLASSE_FUNDO_FORNECEDOR } from '@/config/graficos'
import { ROTULOS_INDICADOR_ACAO, ROTULOS_STATUS_ACAO } from '@/config/plano-acao'
import { DATA_REFERENCIA } from '@/config/referencia'
import { EtiquetaTom } from '@/componentes/ui/EtiquetaTom'
import { cx } from '@/lib/classes'
import { situacaoPrazo } from '@/lib/plano-acao'
import type { Acao, StatusAcao } from '@/tipos/plano-acao'

const NOME_FORNECEDOR = new Map(FORNECEDORES.map((f) => [f.id, f.nome]))
const STATUS = Object.entries(ROTULOS_STATUS_ACAO) as [StatusAcao, string][]

interface CartaoAcaoProps {
  acao: Acao
  aoAbrir: () => void
  aoMover: (status: StatusAcao) => void
}

/** Cartão do kanban do plano de ação. Mover de coluna usa um seletor (acessível por teclado). */
export function CartaoAcao({ acao, aoAbrir, aoMover }: CartaoAcaoProps) {
  const idSeletor = useId()
  const prazo = situacaoPrazo(acao, DATA_REFERENCIA)
  return (
    <article className="flex flex-col gap-2 rounded-lg bg-superficie p-3 shadow-sm ring-1 ring-borda">
      <p className="flex items-center gap-1.5 text-xs text-texto-suave">
        <span className="font-mono">{acao.id}</span>
        <span aria-hidden>·</span>
        <span className="rounded bg-primaria-clara px-1.5 py-0.5 font-medium text-primaria">
          {ROTULOS_INDICADOR_ACAO[acao.indicador]}
        </span>
      </p>
      <button type="button" onClick={aoAbrir} className="text-left text-sm font-semibold text-texto hover:text-primaria">
        {acao.titulo}
      </button>
      <div className="flex flex-col gap-1 text-xs text-texto-suave">
        {acao.fornecedorId && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className={cx('size-2 rounded-full', CLASSE_FUNDO_FORNECEDOR[acao.fornecedorId])} />
            {NOME_FORNECEDOR.get(acao.fornecedorId)}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <UserRound aria-hidden className="size-3.5" />
          <span className="truncate">{acao.responsavel}</span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-borda pt-2">
        <EtiquetaTom tom={prazo.tom} texto={prazo.texto} />
        <label htmlFor={idSeletor} className="sr-only">
          Mover {acao.id} para
        </label>
        <select
          id={idSeletor}
          value={acao.status}
          onChange={(e) => aoMover(e.target.value as StatusAcao)}
          className="h-7 rounded-md bg-fundo px-1.5 text-xs text-texto ring-1 ring-borda ring-inset"
        >
          {STATUS.map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </div>
    </article>
  )
}
