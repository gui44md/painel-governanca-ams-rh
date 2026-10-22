import { describe, expect, it } from 'vitest'
import { CALENDARIO_UTIL } from '@/config/sla'
import { analisarChamados } from './analise'
import { calcularKpis, direcaoTendencia, formatarValorKpi, formatarVariacaoKpi, instanteDeMedicao } from './kpis'
import { criarChamado } from './teste/fabrica'

const AGORA = new Date(2026, 9, 27, 17)

// Setembro: 2 chamados, 1 no prazo. Outubro: 2 chamados no prazo, 1 aberto.
const chamados = analisarChamados(
  [
    criarChamado({ id: 'S1', abertoEm: new Date(2026, 8, 15, 9), passos: [['resolvido', new Date(2026, 8, 15, 11)]] }),
    criarChamado({ id: 'S2', abertoEm: new Date(2026, 8, 16, 9), passos: [['resolvido', new Date(2026, 8, 18, 9)]] }),
    criarChamado({ id: 'O1', abertoEm: new Date(2026, 9, 13, 9), passos: [['resolvido', new Date(2026, 9, 13, 10)]] }),
    criarChamado({ id: 'O2', abertoEm: new Date(2026, 9, 14, 9), passos: [['resolvido', new Date(2026, 9, 14, 12)]] }),
    criarChamado({ id: 'O3', abertoEm: new Date(2026, 9, 27, 9), causa: 'outra' }),
  ],
  { agora: AGORA, calendario: CALENDARIO_UTIL, janelaReincidenciaDias: 15 },
)

describe('instanteDeMedicao', () => {
  it('é o fim do período, sem passar do agora', () => {
    expect(instanteDeMedicao({ inicio: new Date(2026, 8, 1), fim: new Date(2026, 8, 30) }, AGORA)).toEqual(
      new Date(2026, 8, 30),
    )
    expect(instanteDeMedicao({ inicio: new Date(2026, 9, 1), fim: new Date(2026, 9, 31) }, AGORA)).toEqual(AGORA)
  })
})

describe('calcularKpis', () => {
  const intervalo = { inicio: new Date(2026, 4, 1), fim: AGORA }
  const kpis = calcularKpis(chamados, chamados, intervalo, AGORA)

  it('calcula o SLA do período e a tendência de outubro contra setembro', () => {
    expect(kpis.sla.valor).toBeCloseTo(3 / 4)
    expect(kpis.sla.mesAtual).toBe(1)
    expect(kpis.sla.mesAnterior).toBe(0.5)
    expect(kpis.sla.variacao).toBeCloseTo(0.5)
  })

  it('mede chamados abertos no fim de cada mês', () => {
    expect(kpis.abertos.valor).toBe(1)
    expect(kpis.abertos.mesAnterior).toBe(0)
  })
})

describe('direcaoTendencia', () => {
  it('considera se subir é bom ou ruim', () => {
    expect(direcaoTendencia(0.02, 'maior')).toBe('melhorou')
    expect(direcaoTendencia(0.02, 'menor')).toBe('piorou')
    expect(direcaoTendencia(-3, 'menor')).toBe('melhorou')
    expect(direcaoTendencia(0, 'maior')).toBe('estavel')
    expect(direcaoTendencia(null, 'maior')).toBeNull()
  })
})

describe('formatação dos KPIs', () => {
  it('formata valor e variação conforme o tipo', () => {
    expect(formatarValorKpi(0.953, 'percentual')).toBe('95,3%')
    expect(formatarValorKpi(67.1, 'horas')).toBe('67 h')
    expect(formatarValorKpi(12, 'numero')).toBe('12')
    expect(formatarValorKpi(null, 'numero')).toBe('—')
    expect(formatarVariacaoKpi(-0.021, 'percentual')).toBe('2,1 p.p.')
    expect(formatarVariacaoKpi(-4.2, 'horas')).toBe('4,2 h')
    expect(formatarVariacaoKpi(-3, 'numero')).toBe('3')
  })
})
