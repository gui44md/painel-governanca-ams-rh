import type { FornecedorId, SistemaId } from './catalogo'
import type { PeriodoId } from './filtros'

/** Galeria de widgets (CONCEITO.md, seção 7). */
export type TipoWidget = 'kpi' | 'linha' | 'barras' | 'rosca' | 'tabela' | 'medidor' | 'texto'

export type IndicadorWidget = 'sla' | 'mttr' | 'volume' | 'reincidencia' | 'satisfacao' | 'backlog'

export type AgrupamentoWidget = 'mes' | 'sistema' | 'fornecedor' | 'prioridade' | 'tipo'

/** Filtro próprio do widget; `null` herda o filtro global do topo. */
export interface FiltroWidget {
  periodo: PeriodoId | null
  sistemaId: SistemaId | null
  fornecedorId: FornecedorId | null
}

export interface Widget {
  id: string
  tipo: TipoWidget
  titulo: string
  indicador: IndicadorWidget
  agrupamento: AgrupamentoWidget
  filtro: FiltroWidget
  /** Valor de referência (fração para percentuais, horas para MTTR...). */
  meta: number | null
  /** Conteúdo do cartão de texto. */
  texto: string
}

/** Posição na grade de 12 colunas. */
export interface PosicaoWidget {
  i: string
  x: number
  y: number
  w: number
  h: number
}

export interface Dashboard {
  /** Ex.: DSH-002 */
  id: string
  nome: string
  widgets: Widget[]
  layout: PosicaoWidget[]
  criadoEm: Date
  atualizadoEm: Date
  modeloId: string | null
}
