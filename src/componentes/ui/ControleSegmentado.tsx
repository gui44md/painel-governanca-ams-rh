import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/classes'

export interface OpcaoSegmento<T extends string> {
  valor: T
  rotulo: string
  icone?: LucideIcon
}

interface ControleSegmentadoProps<T extends string> {
  rotulo: string
  valor: T
  opcoes: readonly OpcaoSegmento<T>[]
  aoMudar: (valor: T) => void
}

/** Alternância entre poucas opções (ex.: tabela ou kanban). */
export function ControleSegmentado<T extends string>({ rotulo, valor, opcoes, aoMudar }: ControleSegmentadoProps<T>) {
  return (
    <div role="group" aria-label={rotulo} className="inline-flex rounded-lg bg-fundo p-1 ring-1 ring-borda ring-inset">
      {opcoes.map(({ valor: opcao, rotulo: texto, icone: Icone }) => {
        const ativo = opcao === valor
        return (
          <button
            key={opcao}
            type="button"
            aria-pressed={ativo}
            onClick={() => aoMudar(opcao)}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
              ativo ? 'bg-superficie text-primaria shadow-sm' : 'text-texto-suave hover:text-primaria',
            )}
          >
            {Icone && <Icone aria-hidden className="size-4" />}
            {texto}
          </button>
        )
      })}
    </div>
  )
}
