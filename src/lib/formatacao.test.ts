import { describe, expect, it } from 'vitest'
import {
  capitalizar,
  formatarData,
  formatarDataHora,
  formatarDuracao,
  formatarHoras,
  formatarMesAno,
  formatarMesCurto,
  formatarNumero,
  formatarPercentual,
  formatarPontosPercentuais,
} from './formatacao'

describe('datas', () => {
  it('capitaliza apenas a primeira letra', () => {
    expect(capitalizar('outubro de 2026')).toBe('Outubro de 2026')
    expect(capitalizar('')).toBe('')
  })

  it('formata mês e ano em português', () => {
    expect(formatarMesAno(new Date(2026, 2, 15))).toBe('Março de 2026')
    expect(formatarMesCurto(new Date(2026, 9, 1))).toBe('Out')
  })

  it('formata datas no padrão brasileiro', () => {
    expect(formatarData(new Date(2026, 9, 3))).toBe('03/10/2026')
    expect(formatarDataHora(new Date(2026, 9, 3, 8, 15))).toBe('03/10/2026 08:15')
  })
})

describe('números', () => {
  it('usa vírgula decimal e traço quando não há valor', () => {
    expect(formatarNumero(1234.5, 1)).toBe('1.234,5')
    expect(formatarNumero(null)).toBe('—')
  })

  it('formata percentuais e pontos percentuais', () => {
    expect(formatarPercentual(0.953)).toBe('95,3%')
    expect(formatarPercentual(0.31, 0)).toBe('31%')
    expect(formatarPercentual(null)).toBe('—')
    expect(formatarPontosPercentuais(-0.021)).toBe('2,1 p.p.')
  })

  it('formata horas e durações', () => {
    expect(formatarHoras(6.54)).toBe('6,5 h')
    expect(formatarHoras(67.1)).toBe('67 h')
    expect(formatarDuracao(45)).toBe('45min')
    expect(formatarDuracao(200)).toBe('3h 20min')
    expect(formatarDuracao(120)).toBe('2h')
    expect(formatarDuracao(3000)).toBe('2d 2h')
  })
})
