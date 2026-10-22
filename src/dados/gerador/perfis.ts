import type { FornecedorId, SistemaId } from '@/tipos/catalogo'
import type { TipoChamado } from '@/tipos/chamado'

/**
 * Parâmetros que descrevem o comportamento de cada fornecedor fictício.
 * É aqui que os insights da seção 10 do conceito são "plantados": o gerador
 * só segue estes perfis, e os insights aparecem quando os indicadores são
 * calculados sobre os dados gerados.
 */
export interface PerfilFornecedor {
  /** Fração do prazo de solução consumida em um atendimento normal. */
  fracaoSolucao: readonly [number, number]
  /** Chance de estourar o SLA fora dos picos. */
  chanceEstouro: number
  /** Chance de estourar o SLA na semana de fechamento da folha (Folha e Benefícios). */
  chanceEstouroFechamento: number
  /** Chance de encerrar um incidente com contorno, sem corrigir a causa. */
  chancePaliativa: Partial<Record<SistemaId, number>> & { padrao: number }
  /** Chance de o problema voltar (novo chamado) após um contorno paliativo. */
  chanceRetornoPaliativa: number
  /** Nota média de satisfação antes de penalidades (estouro, reincidência). */
  satisfacaoBase: number
  /** Duração das evolutivas, em dias. */
  duracaoEvolutivaDias: readonly [number, number]
  /**
   * A partir desta data, só esta fração das evolutivas é entregue: o backlog
   * passa a crescer (insight secundário da Gama Consultoria).
   */
  gargaloEvolutivas?: { aPartirDe: Date; fracaoEntregue: number; fatorDemanda: number }
}

export const PERFIS: Record<FornecedorId, PerfilFornecedor> = {
  // Insight secundário: estoura SLA principalmente na semana de fechamento da folha.
  alfa: {
    fracaoSolucao: [0.25, 0.85],
    chanceEstouro: 0.06,
    chanceEstouroFechamento: 0.32,
    chancePaliativa: { padrao: 0.08 },
    chanceRetornoPaliativa: 0.35,
    satisfacaoBase: 4.0,
    duracaoEvolutivaDias: [12, 45],
  },
  // Insight principal: melhor SLA, mas encerra Ponto com contorno e o problema volta.
  beta: {
    fracaoSolucao: [0.12, 0.55],
    chanceEstouro: 0.03,
    chanceEstouroFechamento: 0.03,
    chancePaliativa: { ponto: 0.62, padrao: 0.1 },
    chanceRetornoPaliativa: 0.6,
    satisfacaoBase: 4.4,
    duracaoEvolutivaDias: [10, 40],
  },
  // Insight secundário: backlog de evolutivas cresce nos últimos 3 meses.
  gama: {
    fracaoSolucao: [0.3, 0.9],
    chanceEstouro: 0.1,
    chanceEstouroFechamento: 0.1,
    chancePaliativa: { padrao: 0.08 },
    chanceRetornoPaliativa: 0.35,
    satisfacaoBase: 4.2,
    duracaoEvolutivaDias: [15, 45],
    gargaloEvolutivas: { aPartirDe: new Date(2026, 7, 1), fracaoEntregue: 0.12, fatorDemanda: 1.6 },
  },
}

/** Chamados abertos por dia útil, por sistema, antes dos fatores sazonais. */
export const TAXA_DIARIA: Record<SistemaId, number> = {
  folha: 0.76,
  ponto: 0.88,
  beneficios: 0.48,
  portal: 0.6,
  recrutamento: 0.46,
  treinamentos: 0.54,
}

/** Distribuição dos tipos de chamado por fornecedor. */
export const PESOS_TIPO: Record<FornecedorId, readonly (readonly [TipoChamado, number])[]> = {
  alfa: [
    ['incidente', 60],
    ['requisicao', 31],
    ['evolutiva', 9],
  ],
  beta: [
    ['incidente', 62],
    ['requisicao', 30],
    ['evolutiva', 8],
  ],
  gama: [
    ['incidente', 52],
    ['requisicao', 32],
    ['evolutiva', 16],
  ],
}

/** Padrões sazonais (CONCEITO.md, seção 10). */
export const SAZONALIDADE = {
  /** Fins de semana e feriados: Ponto segue com a operação 24x7; o resto quase para. */
  foraDeDiaUtil: { ponto: 0.35, padrao: 0.06 },
  /** Mais chamados de Ponto às segundas-feiras. */
  pontoSegunda: 1.9,
  /** Dias do mês em que há troca de escala das equipes de operação. */
  diasTrocaEscala: [1, 2, 16, 17] as readonly number[],
  pontoTrocaEscala: 1.5,
  /** Folha e Benefícios perto do fechamento. */
  folhaFechamento: 2.4,
  beneficiosFechamento: 1.4,
  /** Portal recebe mais dúvidas logo após a publicação do holerite. */
  diasPosHolerite: [1, 2, 3, 4, 5] as readonly number[],
  portalPosHolerite: 1.5,
  /** Chance de um incidente de Ponto ser aberto fora do expediente (turnos da operação). */
  pontoForaDoExpediente: 0.15,
}

/** Probabilidades gerais do atendimento. */
export const ATENDIMENTO = {
  chancePausa: 0.3,
  pausaHoras: [1, 26] as const,
  /** Parte das pausas dura dias (usuário demora a enviar evidências). */
  chancePausaLonga: 0.5,
  pausaLongaDias: [3, 14] as const,
  chanceRespostaAtrasada: 0.04,
  chanceRetornoDefinitiva: 0.02,
  chanceReaberturaDefinitiva: 0.02,
  chanceReaberturaPaliativa: 0.06,
  chanceAvaliacao: 0.82,
}
