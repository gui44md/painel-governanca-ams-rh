import { describe, expect, it } from 'vitest'
import { idDoMes, listarMeses, opcoesPeriodo, resolverPeriodo } from './periodo'

const INICIO = new Date(2026, 4, 1)
const REFERENCIA = new Date(2026, 9, 27, 17, 0)

describe('listarMeses', () => {
  it('lista o primeiro dia de cada mês do intervalo', () => {
    const meses = listarMeses(INICIO, REFERENCIA)
    expect(meses).toHaveLength(6)
    expect(meses[0]).toEqual(new Date(2026, 4, 1))
    expect(meses[5]).toEqual(new Date(2026, 9, 1))
  })

  it('atravessa a virada do ano', () => {
    const meses = listarMeses(new Date(2025, 10, 20), new Date(2026, 1, 3))
    expect(meses.map(idDoMes)).toEqual(['mes:2025-11', 'mes:2025-12', 'mes:2026-01', 'mes:2026-02'])
  })
})

describe('opcoesPeriodo', () => {
  it('traz os atalhos e os meses do mais recente ao mais antigo', () => {
    const opcoes = opcoesPeriodo(INICIO, REFERENCIA)
    expect(opcoes.map((o) => o.id)).toEqual([
      'tudo',
      'ultimos-3-meses',
      'mes:2026-10',
      'mes:2026-09',
      'mes:2026-08',
      'mes:2026-07',
      'mes:2026-06',
      'mes:2026-05',
    ])
    expect(opcoes[0]?.rotulo).toBe('Todo o período (6 meses)')
    expect(opcoes[2]?.rotulo).toBe('Outubro de 2026')
  })
})

describe('resolverPeriodo', () => {
  it('"tudo" cobre o período simulado inteiro', () => {
    expect(resolverPeriodo('tudo', INICIO, REFERENCIA)).toEqual({ inicio: INICIO, fim: REFERENCIA })
  })

  it('"últimos 3 meses" começa no 1º dia de dois meses antes da referência', () => {
    const { inicio, fim } = resolverPeriodo('ultimos-3-meses', INICIO, REFERENCIA)
    expect(inicio).toEqual(new Date(2026, 7, 1))
    expect(fim).toEqual(REFERENCIA)
  })

  it('um mês completo vai do dia 1 ao último instante do mês', () => {
    const { inicio, fim } = resolverPeriodo('mes:2026-06', INICIO, REFERENCIA)
    expect(inicio).toEqual(new Date(2026, 5, 1))
    expect(fim).toEqual(new Date(2026, 5, 30, 23, 59, 59, 999))
  })

  it('o mês corrente termina na data de referência', () => {
    const { fim } = resolverPeriodo('mes:2026-10', INICIO, REFERENCIA)
    expect(fim).toEqual(REFERENCIA)
  })

  it('nunca começa antes do início dos dados', () => {
    const { inicio } = resolverPeriodo('ultimos-3-meses', new Date(2026, 8, 15), REFERENCIA)
    expect(inicio).toEqual(new Date(2026, 8, 15))
  })

  it('identificadores inválidos caem no período completo', () => {
    expect(resolverPeriodo('mes:2026-13', INICIO, REFERENCIA)).toEqual({ inicio: INICIO, fim: REFERENCIA })
    expect(resolverPeriodo('mes:abc', INICIO, REFERENCIA)).toEqual({ inicio: INICIO, fim: REFERENCIA })
  })
})
