import type { FornecedorId, SistemaId } from './catalogo'

/** `tudo`, `ultimos-3-meses` ou um mês específico no formato `mes:AAAA-MM`. */
export type PeriodoId = 'tudo' | 'ultimos-3-meses' | `mes:${string}`

export interface IntervaloDatas {
  inicio: Date
  fim: Date
}

export interface FiltrosGlobais {
  periodo: PeriodoId
  sistemaId: SistemaId | null
  fornecedorId: FornecedorId | null
}
