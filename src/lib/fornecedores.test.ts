import { describe, expect, it } from 'vitest'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { CONTEXTO_ANALISE, gerarBaseFicticia } from '@/dados/base-ficticia'
import { analisarChamados } from './analise'
import {
  desempenhoFornecedores,
  linhasRadar,
  pontosVelocidadeQualidade,
  rankingCausas,
  type DesempenhoFornecedor,
} from './fornecedores'

const resumo = (sobrescrever: Partial<DesempenhoFornecedor['resumo']>): DesempenhoFornecedor['resumo'] => ({
  volume: 10,
  percentualSla: 0.9,
  mttrHoras: 10,
  taxaReincidencia: 0.1,
  satisfacao: 4,
  chamadosEmAberto: 0,
  backlogEvolutivas: { quantidade: 0, idadeMediaDias: null },
  ...sobrescrever,
})

describe('linhasRadar', () => {
  const linhas = linhasRadar([
    { fornecedorId: 'alfa', resumo: resumo({ mttrHoras: 20, satisfacao: 5 }), respostaNoPrazo: 0.8 },
    { fornecedorId: 'beta', resumo: resumo({ taxaReincidencia: 0.31, satisfacao: 1 }), respostaNoPrazo: 1 },
  ])
  const valor = (eixo: string, id: 'alfa' | 'beta') => linhas.find((l) => l.eixo === eixo)?.[id]

  it('normaliza todos os eixos para 0–100, maior é melhor', () => {
    expect(valor('sla', 'alfa')).toBe(90)
    expect(valor('resposta', 'alfa')).toBe(80)
    expect(valor('qualidade', 'beta')).toBe(69)
    expect(valor('satisfacao', 'alfa')).toBe(100)
    expect(valor('satisfacao', 'beta')).toBe(0)
  })

  it('agilidade: o menor MTTR vale 100', () => {
    expect(valor('agilidade', 'beta')).toBe(100)
    expect(valor('agilidade', 'alfa')).toBe(50)
  })

  it('omite eixos sem dado', () => {
    const [sla] = linhasRadar([{ fornecedorId: 'gama', resumo: resumo({ percentualSla: null }), respostaNoPrazo: null }])
    expect(sla).toEqual({ eixo: 'sla', rotulo: 'SLA cumprido', rotuloCurto: 'SLA' })
  })
})

describe('na base fictícia', () => {
  const base = analisarChamados(gerarBaseFicticia(), CONTEXTO_ANALISE)

  it('o desempenho tem um item por fornecedor', () => {
    expect(desempenhoFornecedores(base, CONTEXTO_ANALISE.agora, FORNECEDORES).map((d) => d.fornecedorId)).toEqual([
      'alfa',
      'beta',
      'gama',
    ])
  })

  it('no gráfico Velocidade x Qualidade, Ponto tem prazo alto e a maior reincidência', () => {
    const pontos = pontosVelocidadeQualidade(base, SISTEMAS_RH)
    expect(pontos).toHaveLength(6)
    const ponto = pontos.find((p) => p.sistemaId === 'ponto')!
    expect(ponto.noPrazo).toBeGreaterThan(0.9)
    expect(Math.max(...pontos.map((p) => p.reincidencia))).toBe(ponto.reincidencia)
  })

  it('a causa mais recorrente da Beta é o sincronismo de terminal de ponto', () => {
    const [primeira] = rankingCausas(base, 'beta')
    expect(primeira?.categoria).toBe('Sincronismo de terminal de ponto')
    expect(primeira!.reincidentes).toBeGreaterThan(10)
  })
})
