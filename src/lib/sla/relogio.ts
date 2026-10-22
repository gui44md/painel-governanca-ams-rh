import type { CalendarioUtil, ModoRelogio } from '@/config/sla'
import { adicionarDias, adicionarMinutos, chaveData, comHora, inicioDoDia, minutosEntreDatas } from '@/lib/datas'

/**
 * Relógio do SLA: mede e projeta tempo em 24x7 (P1) ou em horário útil
 * (seg. a sex., 8h às 18h, sem feriados) para as demais prioridades.
 */

export function ehDiaUtil(data: Date, calendario: CalendarioUtil): boolean {
  return calendario.diasDaSemana.includes(data.getDay()) && !calendario.feriados.has(chaveData(data))
}

/** Expediente do dia da data informada, ou `null` se não for dia útil. */
function expedienteDoDia(data: Date, calendario: CalendarioUtil): { inicio: Date; fim: Date } | null {
  if (!ehDiaUtil(data, calendario)) return null
  return { inicio: comHora(data, calendario.inicioHora), fim: comHora(data, calendario.fimHora) }
}

/** Minutos de relógio entre duas datas. Retorna 0 se `fim` não for posterior a `inicio`. */
export function minutosEntre(inicio: Date, fim: Date, modo: ModoRelogio, calendario: CalendarioUtil): number {
  if (fim.getTime() <= inicio.getTime()) return 0
  if (modo === '24x7') return minutosEntreDatas(inicio, fim)

  let total = 0
  for (let dia = inicioDoDia(inicio); dia.getTime() < fim.getTime(); dia = adicionarDias(dia, 1)) {
    const expediente = expedienteDoDia(dia, calendario)
    if (!expediente) continue
    const de = Math.max(expediente.inicio.getTime(), inicio.getTime())
    const ate = Math.min(expediente.fim.getTime(), fim.getTime())
    if (ate > de) total += minutosEntreDatas(new Date(de), new Date(ate))
  }
  return total
}

/** Data em que `minutos` de relógio terão passado a partir de `inicio`. */
export function avancarMinutos(inicio: Date, minutos: number, modo: ModoRelogio, calendario: CalendarioUtil): Date {
  if (minutos <= 0) return inicio
  if (modo === '24x7') return adicionarMinutos(inicio, minutos)

  let cursor = inicio
  let restante = minutos
  // Limite de segurança: nenhum prazo do contrato passa de alguns meses.
  for (let iteracao = 0; iteracao < 3650; iteracao++) {
    const expediente = expedienteDoDia(cursor, calendario)
    if (expediente && cursor.getTime() < expediente.fim.getTime()) {
      const de = cursor.getTime() < expediente.inicio.getTime() ? expediente.inicio : cursor
      const disponivel = minutosEntreDatas(de, expediente.fim)
      if (restante <= disponivel) return adicionarMinutos(de, restante)
      restante -= disponivel
    }
    cursor = inicioDoDia(adicionarDias(cursor, 1))
  }
  throw new Error('Não foi possível projetar o prazo: intervalo grande demais.')
}
