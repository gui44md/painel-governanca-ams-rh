import { describe, expect, it } from 'vitest'
import { CALENDARIO_UTIL } from '@/config/sla'
import {
  dataFechamentoFolha,
  diasAteFechamento,
  estaNaJanelaDeFechamento,
  proximoFechamentoFolha,
} from './calendario-rh'

describe('dataFechamentoFolha', () => {
  it('é o último dia útil do mês', () => {
    expect(dataFechamentoFolha(2026, 9, CALENDARIO_UTIL)).toEqual(new Date(2026, 9, 30)) // sexta
    expect(dataFechamentoFolha(2026, 4, CALENDARIO_UTIL)).toEqual(new Date(2026, 4, 29)) // 31 é domingo
  })
})

describe('proximoFechamentoFolha', () => {
  it('usa o fechamento do mês se ainda não passou', () => {
    expect(proximoFechamentoFolha(new Date(2026, 9, 27, 17), CALENDARIO_UTIL)).toEqual(new Date(2026, 9, 30))
  })

  it('usa o mês seguinte se o fechamento já passou', () => {
    expect(proximoFechamentoFolha(new Date(2026, 4, 30), CALENDARIO_UTIL)).toEqual(new Date(2026, 5, 30))
  })
})

describe('diasAteFechamento', () => {
  it('conta dias de calendário até o fechamento', () => {
    expect(diasAteFechamento(new Date(2026, 9, 27, 17), CALENDARIO_UTIL)).toBe(3)
    expect(diasAteFechamento(new Date(2026, 9, 30, 9), CALENDARIO_UTIL)).toBe(0)
  })
})

describe('estaNaJanelaDeFechamento', () => {
  it('inclui os 5 dias anteriores e o próprio fechamento', () => {
    expect(estaNaJanelaDeFechamento(new Date(2026, 9, 25), CALENDARIO_UTIL, 5)).toBe(true)
    expect(estaNaJanelaDeFechamento(new Date(2026, 9, 30, 15), CALENDARIO_UTIL, 5)).toBe(true)
    expect(estaNaJanelaDeFechamento(new Date(2026, 9, 24, 23), CALENDARIO_UTIL, 5)).toBe(false)
  })
})
