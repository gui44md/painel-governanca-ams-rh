import type { FormatoKpi, IdKpi } from '@/config/kpis'
import type { IntervaloDatas } from '@/tipos/filtros'
import type { ChamadoAnalisado } from './analise'
import { chaveMes } from './datas'
import { formatarHoras, formatarNumero, formatarPercentual, formatarPontosPercentuais } from './formatacao'
import {
  backlogEvolutivas,
  chamadosEmAberto,
  mttrHoras,
  percentualSlaCumprido,
  taxaReincidencia,
  variacao,
} from './indicadores'

export interface ValorKpi {
  /** Valor no período filtrado. */
  valor: number | null
  /** Valor no último mês do período e no mês anterior, para a seta de tendência. */
  mesAtual: number | null
  mesAnterior: number | null
  variacao: number | null
  /** Idade média em dias (só para o backlog de evolutivas). */
  idadeMediaDias?: number | null
}

const fimDoMes = (data: Date) => new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59, 999)

/** Instante em que os indicadores de estoque são medidos: fim do período, sem passar do "agora". */
export function instanteDeMedicao(intervalo: IntervaloDatas, agora: Date): Date {
  return new Date(Math.min(intervalo.fim.getTime(), agora.getTime()))
}

function valoresDoRecorte(fluxo: readonly ChamadoAnalisado[], estoque: readonly ChamadoAnalisado[], instante: Date) {
  const backlog = backlogEvolutivas(estoque, instante)
  return {
    sla: percentualSlaCumprido(fluxo),
    abertos: chamadosEmAberto(estoque, instante),
    mttr: mttrHoras(fluxo),
    reincidencia: taxaReincidencia(fluxo),
    backlogEvolutivas: backlog.quantidade,
    idadeBacklog: backlog.idadeMediaDias,
  }
}

/**
 * KPIs da Visão geral. O valor principal cobre o período filtrado; a tendência
 * compara o último mês do período com o mês anterior.
 * @param doPeriodo chamados abertos no período (indicadores de fluxo)
 * @param semPeriodo mesmo recorte sem limite de período (indicadores de estoque)
 */
export function calcularKpis(
  doPeriodo: readonly ChamadoAnalisado[],
  semPeriodo: readonly ChamadoAnalisado[],
  intervalo: IntervaloDatas,
  agora: Date,
): Record<IdKpi, ValorKpi> {
  const instante = instanteDeMedicao(intervalo, agora)
  const anterior = new Date(instante.getFullYear(), instante.getMonth() - 1, 1)
  const abertosNoMes = (mes: Date) => semPeriodo.filter((chamado) => chaveMes(chamado.abertoEm) === chaveMes(mes))

  const periodo = valoresDoRecorte(doPeriodo, semPeriodo, instante)
  const atual = valoresDoRecorte(abertosNoMes(instante), semPeriodo, instante)
  const passado = valoresDoRecorte(abertosNoMes(anterior), semPeriodo, fimDoMes(anterior))

  const montar = (id: Exclude<IdKpi, never>): ValorKpi => ({
    valor: periodo[id],
    mesAtual: atual[id],
    mesAnterior: passado[id],
    variacao: variacao(atual[id], passado[id]),
  })

  return {
    sla: montar('sla'),
    abertos: montar('abertos'),
    mttr: montar('mttr'),
    reincidencia: montar('reincidencia'),
    backlogEvolutivas: { ...montar('backlogEvolutivas'), idadeMediaDias: periodo.idadeBacklog },
  }
}

export type DirecaoTendencia = 'melhorou' | 'piorou' | 'estavel'

/** Interpreta a variação considerando se subir é bom ou ruim. */
export function direcaoTendencia(
  diferenca: number | null,
  melhorQuando: 'maior' | 'menor',
  tolerancia = 1e-9,
): DirecaoTendencia | null {
  if (diferenca === null) return null
  if (Math.abs(diferenca) <= tolerancia) return 'estavel'
  const subiu = diferenca > 0
  return subiu === (melhorQuando === 'maior') ? 'melhorou' : 'piorou'
}

/** Valor principal do card: "95,3%", "67 h" ou "12". */
export function formatarValorKpi(valor: number | null, formato: FormatoKpi): string {
  if (formato === 'percentual') return formatarPercentual(valor)
  if (formato === 'horas') return formatarHoras(valor)
  return formatarNumero(valor)
}

/** Tamanho da variação, sem sinal (a seta mostra a direção): "2,1 p.p.", "5 h", "3". */
export function formatarVariacaoKpi(variacao: number, formato: FormatoKpi): string {
  if (formato === 'percentual') return formatarPontosPercentuais(variacao)
  if (formato === 'horas') return formatarHoras(Math.abs(variacao))
  return formatarNumero(Math.abs(variacao))
}
