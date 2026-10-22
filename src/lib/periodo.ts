import type { IntervaloDatas, PeriodoId } from '@/tipos/filtros'
import { formatarMesAno } from './formatacao'

export interface OpcaoPeriodo {
  id: PeriodoId
  rotulo: string
}

const PREFIXO_MES = 'mes:'

const inicioDoMes = (ano: number, mes: number) => new Date(ano, mes, 1, 0, 0, 0, 0)
const fimDoMes = (ano: number, mes: number) => new Date(ano, mes + 1, 0, 23, 59, 59, 999)
const menorData = (a: Date, b: Date) => (a.getTime() <= b.getTime() ? a : b)
const maiorData = (a: Date, b: Date) => (a.getTime() >= b.getTime() ? a : b)

export function idDoMes(data: Date): PeriodoId {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  return `${PREFIXO_MES}${data.getFullYear()}-${mes}`
}

/** Primeiro dia de cada mês entre `inicio` e `fim` (inclusive), em ordem cronológica. */
export function listarMeses(inicio: Date, fim: Date): Date[] {
  const meses: Date[] = []
  let cursor = inicioDoMes(inicio.getFullYear(), inicio.getMonth())
  while (cursor.getTime() <= fim.getTime()) {
    meses.push(cursor)
    cursor = inicioDoMes(cursor.getFullYear(), cursor.getMonth() + 1)
  }
  return meses
}

/** Opções do filtro de período: atalhos primeiro, depois os meses do mais recente ao mais antigo. */
export function opcoesPeriodo(inicioDados: Date, referencia: Date): OpcaoPeriodo[] {
  const totalMeses = listarMeses(inicioDados, referencia).length
  const meses = listarMeses(inicioDados, referencia)
    .reverse()
    .map((mes) => ({ id: idDoMes(mes), rotulo: formatarMesAno(mes) }))

  return [
    { id: 'tudo', rotulo: `Todo o período (${totalMeses} meses)` },
    { id: 'ultimos-3-meses', rotulo: 'Últimos 3 meses' },
    ...meses,
  ]
}

function interpretarMes(id: string): { ano: number; mes: number } | null {
  const correspondencia = /^mes:(\d{4})-(\d{2})$/.exec(id)
  if (!correspondencia) return null
  const ano = Number(correspondencia[1])
  const mes = Number(correspondencia[2]) - 1
  return mes >= 0 && mes <= 11 ? { ano, mes } : null
}

/**
 * Converte um período escolhido no filtro em um intervalo de datas, sempre
 * limitado ao período simulado (`inicioDados` até `referencia`).
 * Identificadores desconhecidos caem no período completo.
 */
export function resolverPeriodo(id: PeriodoId, inicioDados: Date, referencia: Date): IntervaloDatas {
  const completo = { inicio: inicioDados, fim: referencia }

  if (id === 'ultimos-3-meses') {
    const inicio = inicioDoMes(referencia.getFullYear(), referencia.getMonth() - 2)
    return { inicio: maiorData(inicio, inicioDados), fim: referencia }
  }

  const mes = interpretarMes(id)
  if (mes) {
    return {
      inicio: maiorData(inicioDoMes(mes.ano, mes.mes), inicioDados),
      fim: menorData(fimDoMes(mes.ano, mes.mes), referencia),
    }
  }

  return completo
}
