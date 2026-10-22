import type { Prioridade, TipoChamado } from '@/tipos/chamado'

export type ModoRelogio = '24x7' | 'horario-util'

export interface CalendarioUtil {
  /** Hora de início e fim do expediente (8h às 18h). */
  inicioHora: number
  fimHora: number
  /** Dias da semana úteis, no padrão `Date.getDay()` (0 = domingo). */
  diasDaSemana: readonly number[]
  /** Feriados no formato AAAA-MM-DD. */
  feriados: ReadonlySet<string>
}

export interface RegraSla {
  rotulo: string
  exemplo: string
  respostaMinutos: number
  solucaoMinutos: number
  modo: ModoRelogio
}

/** SLA contratado fictício (CONCEITO.md, seção 9). */
export const TABELA_SLA: Record<Prioridade, RegraSla> = {
  P1: { rotulo: 'Crítica', exemplo: 'Folha não processa', respostaMinutos: 30, solucaoMinutos: 4 * 60, modo: '24x7' },
  P2: {
    rotulo: 'Alta',
    exemplo: 'Ponto não sincroniza em uma unidade',
    respostaMinutos: 60,
    solucaoMinutos: 8 * 60,
    modo: 'horario-util',
  },
  P3: {
    rotulo: 'Média',
    exemplo: 'Erro em relatório de benefícios',
    respostaMinutos: 4 * 60,
    solucaoMinutos: 24 * 60,
    modo: 'horario-util',
  },
  P4: {
    rotulo: 'Baixa',
    exemplo: 'Ajuste de texto no Portal',
    respostaMinutos: 8 * 60,
    solucaoMinutos: 40 * 60,
    modo: 'horario-util',
  },
}

/** Fração do prazo a partir da qual o chamado fica "em risco". */
export const LIMIAR_RISCO = 0.8

/**
 * O SLA contratado vale para incidentes e requisições. Evolutivas são melhorias
 * com data de entrega negociada e são acompanhadas pelo backlog.
 */
export const TIPOS_COM_SLA: readonly TipoChamado[] = ['incidente', 'requisicao']

/** Chamados de Folha abertos nestes dias antes do fechamento sobem uma prioridade. */
export const DIAS_ELEVACAO_FECHAMENTO = 5

/** Janela para considerar um chamado como repetição de outro. */
export const JANELA_REINCIDENCIA_DIAS = 15

/** Meta de SLA cumprido usada nos gráficos (ex.: 95%). */
export const META_SLA = 0.95

export const CALENDARIO_UTIL: CalendarioUtil = {
  inicioHora: 8,
  fimHora: 18,
  diasDaSemana: [1, 2, 3, 4, 5],
  feriados: new Set([
    '2026-01-01',
    '2026-02-16',
    '2026-02-17',
    '2026-04-03',
    '2026-04-21',
    '2026-05-01',
    '2026-06-04',
    '2026-09-07',
    '2026-10-12',
    '2026-11-02',
    '2026-11-15',
    '2026-11-20',
    '2026-12-25',
  ]),
}
