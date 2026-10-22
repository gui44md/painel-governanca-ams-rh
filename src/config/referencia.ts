import type { PeriodoId } from '@/tipos/filtros'

/**
 * Datas fixas da simulação. Usar um "hoje" fixo deixa os indicadores, insights e
 * alertas idênticos em toda demonstração, independentemente do dia em que o
 * sistema é aberto.
 */

/** Primeiro dia do período simulado (6 meses: maio a outubro de 2026). */
export const INICIO_DADOS = new Date(2026, 4, 1, 0, 0, 0)

/** "Agora" da simulação: terça-feira, 27/10/2026, 17h. */
export const DATA_REFERENCIA = new Date(2026, 9, 27, 17, 0, 0)

export const PERIODO_PADRAO: PeriodoId = 'tudo'
