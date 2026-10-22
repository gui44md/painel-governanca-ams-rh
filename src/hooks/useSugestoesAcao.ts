import { useMemo } from 'react'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { KPIS } from '@/config/kpis'
import { DATA_REFERENCIA } from '@/config/referencia'
import { CALENDARIO_UTIL } from '@/config/sla'
import { formatarMesCurto } from '@/lib/formatacao'
import { detectarInsights } from '@/lib/insights'
import { calcularKpis, direcaoTendencia, formatarVariacaoKpi, instanteDeMedicao } from '@/lib/kpis'
import { sugerirAcaoDeIndicador, sugerirAcaoDeInsight, type SugestaoAcao } from '@/lib/plano-acao'
import { useChamadosFiltrados } from './useChamadosFiltrados'

const CATALOGO = { fornecedores: FORNECEDORES, sistemas: SISTEMAS_RH }

/**
 * Ações sugeridas a partir dos insights e dos indicadores que pioraram no
 * recorte atual (CONCEITO.md, seção 6.4: criar ação de um insight ou indicador ruim).
 */
export function useSugestoesAcao(): SugestaoAcao[] {
  const { doPeriodo, semPeriodo, intervalo } = useChamadosFiltrados()

  return useMemo(() => {
    const instante = instanteDeMedicao(intervalo, DATA_REFERENCIA)
    const deInsights = detectarInsights(doPeriodo, semPeriodo, instante, CATALOGO, CALENDARIO_UTIL).map((insight) =>
      sugerirAcaoDeInsight(insight, DATA_REFERENCIA, CATALOGO),
    )
    const kpis = calcularKpis(doPeriodo, semPeriodo, intervalo, DATA_REFERENCIA)
    const mesAnterior = formatarMesCurto(new Date(instante.getFullYear(), instante.getMonth() - 1, 1)).toLowerCase()
    const deIndicadores = KPIS.flatMap((definicao) => {
      const { variacao } = kpis[definicao.id]
      if (variacao === null || direcaoTendencia(variacao, definicao.melhorQuando) !== 'piorou') return []
      const sentido = variacao > 0 ? 'subiu' : 'caiu'
      const motivo = `${definicao.rotulo} ${sentido} ${formatarVariacaoKpi(variacao, definicao.formato)} em relação a ${mesAnterior}.`
      return [sugerirAcaoDeIndicador(definicao.id, motivo, DATA_REFERENCIA)]
    })
    return [...deInsights, ...deIndicadores]
  }, [doPeriodo, semPeriodo, intervalo])
}
