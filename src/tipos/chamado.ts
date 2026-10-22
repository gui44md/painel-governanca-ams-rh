import type { FornecedorId, SistemaId } from './catalogo'

export type TipoChamado = 'incidente' | 'requisicao' | 'evolutiva'

export type Prioridade = 'P1' | 'P2' | 'P3' | 'P4'

/** Colunas do kanban de chamados (CONCEITO.md, seção 6.2). */
export type EstadoChamado = 'aberto' | 'em-atendimento' | 'aguardando-usuario' | 'resolvido'

/** Como o fornecedor encerrou o chamado. Contorno paliativo não corrige a causa. */
export type TipoSolucao = 'definitiva' | 'paliativa'

export interface EventoHistorico {
  estado: EstadoChamado
  em: Date
  nota?: string
}

export interface DetalheEvolutiva {
  requisito: string
  impacto: string
  /** Data de entrega acordada com o fornecedor. */
  entregaPrevista: Date
}

export interface Chamado {
  /** Ex.: INC-2026-0458, REQ-2026-0123, EVO-2026-0031. */
  id: string
  tipo: TipoChamado
  titulo: string
  descricao: string
  sistemaId: SistemaId
  fornecedorId: FornecedorId
  /** Prioridade informada na abertura (o motor de SLA pode elevá-la). */
  prioridade: Prioridade
  /** Categoria do problema, legível (ex.: "Sincronismo de terminal de ponto"). Usada nos rankings. */
  categoria: string
  /**
   * Causa raiz detalhada (categoria + local + origem técnica). Usada para
   * detectar repetição: mesmo sistema + mesma causa em até 15 dias.
   */
  causa: string
  abertoEm: Date
  /** Momento da última resolução; `null` enquanto estiver em aberto. */
  resolvidoEm: Date | null
  /** Linha do tempo em ordem cronológica; o primeiro evento é sempre `aberto`. */
  historico: EventoHistorico[]
  /** O usuário reabriu o chamado depois de resolvido. */
  reaberto: boolean
  solucao: TipoSolucao | null
  /** Nota de 1 a 5; `null` quando o usuário não avaliou. */
  satisfacao: number | null
  evolutiva?: DetalheEvolutiva
}
