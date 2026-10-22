import type { IdKpi } from '@/config/kpis'
import type { FornecedorId, SistemaId } from './catalogo'

/** Colunas do kanban do plano de ação (CONCEITO.md, seção 6.4). */
export type StatusAcao = 'a-fazer' | 'em-andamento' | 'concluida'

/** Indicador que a ação pretende melhorar. */
export type IndicadorAcao = IdKpi | 'satisfacao'

export type OrigemAcao =
  | { tipo: 'manual' }
  | { tipo: 'insight'; referencia: string }
  | { tipo: 'indicador'; referencia: IndicadorAcao }
  | { tipo: 'reuniao'; referencia: string }

export interface Acao {
  /** Ex.: ACA-007 */
  id: string
  titulo: string
  descricao: string
  indicador: IndicadorAcao
  fornecedorId: FornecedorId | null
  sistemaId: SistemaId | null
  responsavel: string
  prazo: Date
  status: StatusAcao
  criadaEm: Date
  concluidaEm: Date | null
  origem: OrigemAcao
}

export interface Reuniao {
  /** Ex.: REU-002 */
  id: string
  titulo: string
  data: Date
  fornecedorId: FornecedorId | null
  participantes: string[]
  decisoes: string[]
  /** Ações geradas ou acompanhadas nesta reunião. */
  acoesIds: string[]
}
