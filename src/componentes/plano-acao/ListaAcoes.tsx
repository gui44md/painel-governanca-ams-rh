import { FORNECEDORES } from '@/config/catalogo'
import { ROTULOS_INDICADOR_ACAO, ROTULOS_STATUS_ACAO } from '@/config/plano-acao'
import { DATA_REFERENCIA } from '@/config/referencia'
import { EtiquetaTom } from '@/componentes/ui/EtiquetaTom'
import { formatarData } from '@/lib/formatacao'
import { situacaoPrazo } from '@/lib/plano-acao'
import type { Acao } from '@/tipos/plano-acao'

const NOME_FORNECEDOR = new Map(FORNECEDORES.map((f) => [f.id, f.nome]))

interface ListaAcoesProps {
  acoes: readonly Acao[]
  aoAbrir: (id: string) => void
}

/** Visão em lista do plano de ação, ordenada por prazo. */
export function ListaAcoes({ acoes, aoAbrir }: ListaAcoesProps) {
  const ordenadas = acoes.toSorted((a, b) => a.prazo.getTime() - b.prazo.getTime())
  return (
    <ul className="divide-y divide-borda">
      {ordenadas.map((acao) => {
        const prazo = situacaoPrazo(acao, DATA_REFERENCIA)
        return (
          <li key={acao.id}>
            <button
              type="button"
              onClick={() => aoAbrir(acao.id)}
              className="-mx-2 grid w-full gap-1 rounded-lg px-2 py-3 text-left hover:bg-fundo md:grid-cols-[1fr_9rem_9rem_11rem] md:items-center md:gap-4"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-texto">{acao.titulo}</span>
                <span className="block truncate text-xs text-texto-suave">
                  <span className="font-mono">{acao.id}</span> · {ROTULOS_INDICADOR_ACAO[acao.indicador]}
                  {acao.fornecedorId && ` · ${NOME_FORNECEDOR.get(acao.fornecedorId)}`} · {acao.responsavel}
                </span>
              </span>
              <span className="text-xs text-texto">{ROTULOS_STATUS_ACAO[acao.status]}</span>
              <span className="text-xs text-texto-suave tabular-nums">Prazo {formatarData(acao.prazo)}</span>
              <EtiquetaTom tom={prazo.tom} texto={prazo.texto} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
