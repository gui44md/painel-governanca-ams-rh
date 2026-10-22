import { COR_FORNECEDOR } from '@/config/graficos'
import type { CausaRecorrente } from '@/lib/fornecedores'
import type { Fornecedor } from '@/tipos/catalogo'

interface RankingCausasProps {
  fornecedor: Fornecedor
  causas: readonly CausaRecorrente[]
}

/** Categorias com mais chamados do fornecedor; a parte escura da barra são os reincidentes. */
export function RankingCausas({ fornecedor, causas }: RankingCausasProps) {
  const maximo = Math.max(1, ...causas.map((c) => c.quantidade))
  const cor = COR_FORNECEDOR[fornecedor.id]

  return (
    <section aria-label={`Causas mais recorrentes: ${fornecedor.nome}`} className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primaria">
        <span aria-hidden className="size-2.5 rounded-full" style={{ background: cor }} />
        {fornecedor.nome}
      </h3>
      {causas.length === 0 ? (
        <p className="text-sm text-texto-suave">Sem chamados no recorte.</p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {causas.map((causa, posicao) => (
            <li key={causa.categoria} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-texto">
                  <span className="mr-1.5 text-xs text-texto-suave tabular-nums">{posicao + 1}.</span>
                  {causa.categoria}
                </span>
                <span className="shrink-0 text-xs text-texto-suave tabular-nums">
                  <strong className="text-texto">{causa.quantidade}</strong>
                  {causa.reincidentes > 0 && ` · ${causa.reincidentes} reinc.`}
                </span>
              </div>
              <div
                aria-hidden
                className="mt-1 flex h-2 overflow-hidden rounded-full bg-grade"
                style={{ width: `${(causa.quantidade / maximo) * 100}%` }}
              >
                <span className="h-full" style={{ width: `${(causa.reincidentes / causa.quantidade) * 100}%`, background: cor }} />
                <span className="h-full flex-1 border-l-2 border-superficie" style={{ background: cor, opacity: 0.35 }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
