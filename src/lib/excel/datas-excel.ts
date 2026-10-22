import { MS_POR_DIA } from '../datas'

/** Dias entre 30/12/1899 (dia zero do Excel) e 01/01/1970. */
const DIAS_ATE_1970 = 25569

/**
 * Número serial do Excel → data no horário local. O Excel não guarda fuso:
 * 46298,34375 é "03/10/2026 08:15" para quem abre a planilha, em qualquer lugar.
 */
export function serialParaData(serial: number): Date {
  const utc = new Date(Math.round((serial - DIAS_ATE_1970) * MS_POR_DIA))
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(), utc.getUTCHours(), utc.getUTCMinutes())
}

/** Data local → número serial do Excel (inverso de `serialParaData`). */
export function dataParaSerial(data: Date): number {
  const utc = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate(), data.getHours(), data.getMinutes())
  return utc / MS_POR_DIA + DIAS_ATE_1970
}

function montar(ano: number, mes: number, dia: number, hora = 0, minuto = 0): Date | null {
  if (hora > 23 || minuto > 59) return null
  const data = new Date(ano, mes - 1, dia, hora, minuto)
  // Rejeita datas que o JavaScript "corrigiria", como 31/09 → 01/10.
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia ? data : null
}

const PADRAO_BR = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T]+(\d{1,2}):(\d{2})(?::\d{2})?)?$/
const PADRAO_ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?$/

/**
 * Lê uma data/hora vinda de uma célula: número serial do Excel, `Date`,
 * "dd/mm/aaaa hh:mm" ou "aaaa-mm-dd hh:mm". Retorna `null` se for inválida.
 */
export function lerDataHora(valor: unknown): Date | null {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor
  // Seriais plausíveis: de 1950 a 2100.
  if (typeof valor === 'number') return valor > 18264 && valor < 73051 ? serialParaData(valor) : null
  if (typeof valor !== 'string') return null
  const texto = valor.trim()
  const br = PADRAO_BR.exec(texto)
  if (br) {
    const [, dia, mes, ano, hora, minuto] = br.map(Number) as number[]
    return montar(ano!, mes!, dia!, Number.isNaN(hora) ? 0 : hora, Number.isNaN(minuto) ? 0 : minuto)
  }
  const iso = PADRAO_ISO.exec(texto)
  if (iso) {
    const [, ano, mes, dia, hora, minuto] = iso.map(Number) as number[]
    return montar(ano!, mes!, dia!, Number.isNaN(hora) ? 0 : hora, Number.isNaN(minuto) ? 0 : minuto)
  }
  return null
}
