import type { EstadoChamado, Prioridade, TipoChamado, TipoSolucao } from '@/tipos/chamado'

export const ROTULOS_TIPO: Record<TipoChamado, string> = {
  incidente: 'Incidente',
  requisicao: 'Requisição',
  evolutiva: 'Evolutiva',
}

/** Prefixo do ID do chamado por tipo (ex.: INC-2026-0458). */
export const PREFIXOS_ID: Record<TipoChamado, string> = {
  incidente: 'INC',
  requisicao: 'REQ',
  evolutiva: 'EVO',
}

export const ROTULOS_ESTADO: Record<EstadoChamado, string> = {
  aberto: 'Aberto',
  'em-atendimento': 'Em atendimento',
  'aguardando-usuario': 'Aguardando usuário',
  resolvido: 'Resolvido',
}

export const ROTULOS_SOLUCAO: Record<TipoSolucao, string> = {
  definitiva: 'Correção definitiva',
  paliativa: 'Contorno paliativo',
}

export const PRIORIDADES: readonly Prioridade[] = ['P1', 'P2', 'P3', 'P4']

/**
 * Prioridade é ordinal: escala do azul da marca, do mais forte (P1) ao mais
 * leve (P4). Não usa cores de status, que ficam reservadas para o SLA.
 */
export const CLASSES_PRIORIDADE: Record<Prioridade, string> = {
  P1: 'bg-primaria text-white',
  P2: 'bg-primaria-media text-white',
  P3: 'bg-primaria-clara text-primaria',
  P4: 'bg-superficie text-texto-suave ring-1 ring-inset ring-borda',
}

/** Quantos chamados por página na tabela e por coluna no kanban. */
export const ITENS_POR_PAGINA = 20
export const ITENS_POR_COLUNA_KANBAN = 25
