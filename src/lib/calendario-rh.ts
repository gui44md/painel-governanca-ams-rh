import type { CalendarioUtil } from '@/config/sla'
import { adicionarDias, diasDeCalendarioEntre, inicioDoDia } from './datas'
import { ehDiaUtil } from './sla/relogio'

/** Fechamento da folha: último dia útil do mês. */
export function dataFechamentoFolha(ano: number, mes: number, calendario: CalendarioUtil): Date {
  let dia = new Date(ano, mes + 1, 0)
  while (!ehDiaUtil(dia, calendario)) dia = adicionarDias(dia, -1)
  return dia
}

/** Próximo fechamento da folha a partir da data (inclui o próprio dia). */
export function proximoFechamentoFolha(data: Date, calendario: CalendarioUtil): Date {
  const doMes = dataFechamentoFolha(data.getFullYear(), data.getMonth(), calendario)
  return inicioDoDia(data).getTime() <= doMes.getTime()
    ? doMes
    : dataFechamentoFolha(data.getFullYear(), data.getMonth() + 1, calendario)
}

/** Dias de calendário até o próximo fechamento (0 = fecha hoje). */
export function diasAteFechamento(data: Date, calendario: CalendarioUtil): number {
  return diasDeCalendarioEntre(data, proximoFechamentoFolha(data, calendario))
}

/**
 * A data está nos `diasAntes` dias que antecedem o fechamento (incluindo o
 * próprio dia do fechamento)?
 */
export function estaNaJanelaDeFechamento(data: Date, calendario: CalendarioUtil, diasAntes: number): boolean {
  return diasAteFechamento(data, calendario) <= diasAntes
}
