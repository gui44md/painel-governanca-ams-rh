import { describe, expect, it } from 'vitest'
import type { CalendarioUtil } from '@/config/sla'
import { avancarMinutos, ehDiaUtil, minutosEntre } from './relogio'

const CALENDARIO: CalendarioUtil = {
  inicioHora: 8,
  fimHora: 18,
  diasDaSemana: [1, 2, 3, 4, 5],
  feriados: new Set(['2026-10-12']),
}

// Outubro de 2026: dia 9 é sexta, 12 é segunda (feriado), 13 é terça.
const d = (dia: number, hora = 0, minuto = 0) => new Date(2026, 9, dia, hora, minuto)

describe('ehDiaUtil', () => {
  it('considera seg. a sex., exceto feriados', () => {
    expect(ehDiaUtil(d(9), CALENDARIO)).toBe(true)
    expect(ehDiaUtil(d(10), CALENDARIO)).toBe(false) // sábado
    expect(ehDiaUtil(d(12), CALENDARIO)).toBe(false) // feriado
  })
})

describe('minutosEntre', () => {
  it('em 24x7 conta o tempo corrido', () => {
    expect(minutosEntre(d(9, 17), d(10, 9), '24x7', CALENDARIO)).toBe(16 * 60)
  })

  it('em horário útil conta só o expediente', () => {
    expect(minutosEntre(d(13, 9), d(13, 11, 30), 'horario-util', CALENDARIO)).toBe(150)
  })

  it('ignora fim de semana e feriado', () => {
    // Sexta 17h → terça 9h = 1h (sexta) + 1h (terça)
    expect(minutosEntre(d(9, 17), d(13, 9), 'horario-util', CALENDARIO)).toBe(120)
  })

  it('ignora o que acontece fora do expediente', () => {
    expect(minutosEntre(d(13, 19), d(14, 7), 'horario-util', CALENDARIO)).toBe(0)
    expect(minutosEntre(d(13, 6), d(13, 9), 'horario-util', CALENDARIO)).toBe(60)
  })

  it('retorna 0 quando o fim não é posterior ao início', () => {
    expect(minutosEntre(d(13, 10), d(13, 9), 'horario-util', CALENDARIO)).toBe(0)
  })
})

describe('avancarMinutos', () => {
  it('em 24x7 soma o tempo corrido', () => {
    expect(avancarMinutos(d(9, 22), 4 * 60, '24x7', CALENDARIO)).toEqual(d(10, 2))
  })

  it('pula noite, fim de semana e feriado', () => {
    // Sexta 16h + 8h úteis = 2h na sexta + 6h na terça (segunda é feriado)
    expect(avancarMinutos(d(9, 16), 8 * 60, 'horario-util', CALENDARIO)).toEqual(d(13, 14))
  })

  it('começa a contar no início do expediente se aberto antes das 8h', () => {
    expect(avancarMinutos(d(13, 6), 60, 'horario-util', CALENDARIO)).toEqual(d(13, 9))
  })

  it('é o inverso de minutosEntre', () => {
    const inicio = d(8, 15, 20)
    const fim = avancarMinutos(inicio, 1234, 'horario-util', CALENDARIO)
    expect(minutosEntre(inicio, fim, 'horario-util', CALENDARIO)).toBeCloseTo(1234)
  })
})
