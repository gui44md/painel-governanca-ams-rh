import type { ReactNode } from 'react'

export interface LinhaTooltip {
  rotulo: string
  valor: string
  /** Cor da marca da série ao lado do texto (o texto fica sempre na cor de texto). */
  cor?: string
}

interface TooltipGraficoProps {
  ativo: boolean
  titulo?: ReactNode
  linhas: readonly LinhaTooltip[]
}

/** Caixa de dica padronizada para todos os gráficos. */
export function TooltipGrafico({ ativo, titulo, linhas }: TooltipGraficoProps) {
  if (!ativo || linhas.length === 0) return null
  return (
    <div className="rounded-lg bg-superficie px-3 py-2 text-xs shadow-lg ring-1 ring-borda">
      {titulo && <p className="mb-1 font-semibold text-texto">{titulo}</p>}
      <ul className="flex flex-col gap-0.5">
        {linhas.map((linha) => (
          <li key={linha.rotulo} className="flex items-center gap-2 text-texto-suave">
            {linha.cor && <span aria-hidden className="size-2.5 rounded-full" style={{ background: linha.cor }} />}
            <span>{linha.rotulo}</span>
            <span className="ml-auto pl-3 font-semibold text-texto tabular-nums">{linha.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
