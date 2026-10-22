import type { StatusSla } from '@/tipos/sla'
import { formatarIndicador } from './agregacao'
import { INDICADORES_WIDGET } from '@/config/dashboards'
import type { IndicadorWidget } from '@/tipos/dashboard'

export interface SituacaoMeta {
  tom: StatusSla
  texto: string
}

/** Tolerância (fração da escala, ou do valor da meta) para considerar "perto da meta". */
const TOLERANCIA = 0.05

/**
 * Compara o valor com a meta considerando se o indicador é "maior é melhor"
 * (SLA, satisfação) ou "menor é melhor" (reincidência, MTTR).
 */
export function situacaoMeta(indicador: IndicadorWidget, valor: number | null, meta: number | null): SituacaoMeta | null {
  if (valor === null || meta === null) return null
  const { melhorQuando, escalaMaxima } = INDICADORES_WIDGET[indicador]
  const folga = (escalaMaxima ?? Math.abs(meta)) * TOLERANCIA
  const diferenca = melhorQuando === 'maior' ? valor - meta : meta - valor
  const rotuloMeta = `Meta ${formatarIndicador(indicador, meta)}`
  if (diferenca >= 0) return { tom: 'no-prazo', texto: `${rotuloMeta} · atingida` }
  if (diferenca >= -folga) return { tom: 'em-risco', texto: `${rotuloMeta} · perto` }
  return { tom: 'estourado', texto: `${rotuloMeta} · abaixo` }
}

/** Unidade mostrada ao lado do campo de meta. */
export function unidadeDaMeta(indicador: IndicadorWidget): string {
  const formato = INDICADORES_WIDGET[indicador].formato
  return formato === 'percentual' ? '%' : formato === 'horas' ? 'h' : formato === 'nota' ? 'de 5' : ''
}

/** Valor interno → texto do campo (percentuais em 0–100). */
export function metaParaCampo(indicador: IndicadorWidget, meta: number | null): string {
  if (meta === null) return ''
  const valor = INDICADORES_WIDGET[indicador].formato === 'percentual' ? meta * 100 : meta
  return String(Math.round(valor * 10) / 10).replace('.', ',')
}

/** Texto do campo → valor interno; vazio ou inválido = sem meta. */
export function metaDoCampo(indicador: IndicadorWidget, texto: string): number | null {
  const limpo = texto.trim().replace(',', '.')
  if (!limpo) return null
  const numero = Number(limpo)
  if (!Number.isFinite(numero) || numero < 0) return null
  return INDICADORES_WIDGET[indicador].formato === 'percentual' ? numero / 100 : numero
}
