import { describe, expect, it } from 'vitest'
import { CALENDARIO_UTIL } from '@/config/sla'
import { analisarChamados } from './analise'
import { contarPor, serieMensal, slaPorMes } from './series'
import { criarChamado } from './teste/fabrica'

const AGORA = new Date(2026, 9, 27, 17)
const chamados = analisarChamados(
  [
    criarChamado({ id: 'A', abertoEm: new Date(2026, 7, 4, 9), passos: [['resolvido', new Date(2026, 7, 4, 10)]] }),
    criarChamado({ id: 'B', abertoEm: new Date(2026, 9, 6, 9), passos: [['resolvido', new Date(2026, 9, 9, 9)]] }),
    criarChamado({ id: 'C', abertoEm: new Date(2026, 9, 27, 9), sistemaId: 'folha', causa: 'x' }),
  ],
  { agora: AGORA, calendario: CALENDARIO_UTIL, janelaReincidenciaDias: 15 },
)

describe('serieMensal', () => {
  it('cria um ponto por mês, inclusive meses sem chamados', () => {
    const serie = serieMensal(chamados, new Date(2026, 7, 1), AGORA, (doMes) => doMes.length)
    expect(serie.map((p) => [p.mes, p.valor])).toEqual([
      ['2026-08', 1],
      ['2026-09', 0],
      ['2026-10', 2],
    ])
  })
})

describe('slaPorMes', () => {
  it('calcula o SLA mensal com a base de resolvidos', () => {
    const serie = slaPorMes(chamados, new Date(2026, 7, 1), AGORA)
    expect(serie.map((p) => p.valor)).toEqual([1, null, 0])
    expect(serie.map((p) => p.base)).toEqual([1, 0, 1])
  })
})

describe('contarPor', () => {
  it('conta na ordem informada, com zeros', () => {
    expect(contarPor(chamados, (c) => c.sistemaId, ['folha', 'ponto', 'portal'] as const)).toEqual([
      { chave: 'folha', quantidade: 1 },
      { chave: 'ponto', quantidade: 2 },
      { chave: 'portal', quantidade: 0 },
    ])
  })
})
