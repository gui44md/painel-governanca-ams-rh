import type { IndicadorAcao, StatusAcao } from '@/tipos/plano-acao'

export const ROTULOS_STATUS_ACAO: Record<StatusAcao, string> = {
  'a-fazer': 'A fazer',
  'em-andamento': 'Em andamento',
  concluida: 'Concluída',
}

export const ROTULOS_INDICADOR_ACAO: Record<IndicadorAcao, string> = {
  sla: 'SLA cumprido',
  abertos: 'Chamados abertos',
  mttr: 'MTTR',
  reincidencia: 'Reincidência',
  backlogEvolutivas: 'Backlog de evolutivas',
  satisfacao: 'Satisfação',
}

/** Prazo sugerido para ações novas, em dias a partir de hoje. */
export const PRAZO_PADRAO_ACAO_DIAS = 14

/** A ação fica "em risco" quando faltam até estes dias para o prazo. */
export const DIAS_ALERTA_PRAZO_ACAO = 3

/** Responsável usado nas ações criadas a partir da ata, até alguém assumir. */
export const RESPONSAVEL_A_DEFINIR = 'A definir'
