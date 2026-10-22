import { describe, expect, it } from 'vitest'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { CALENDARIO_UTIL } from '@/config/sla'
import { CONTEXTO_ANALISE, gerarBaseFicticia } from '@/dados/base-ficticia'
import { analisarChamados } from './analise'
import { alertaFechamento, detectarInsights } from './insights'
import { criarChamado } from './teste/fabrica'

const { agora } = CONTEXTO_ANALISE
const catalogo = { fornecedores: FORNECEDORES, sistemas: SISTEMAS_RH }
const base = analisarChamados(gerarBaseFicticia(), CONTEXTO_ANALISE)

describe('detectarInsights na base fictícia', () => {
  const insights = detectarInsights(base, base, agora, catalogo, CALENDARIO_UTIL)

  it('o primeiro insight é a reincidência da Beta Tech em Ponto Eletrônico', () => {
    const [principal] = insights
    expect(principal?.tipo).toBe('reincidencia-oculta')
    expect(principal?.fornecedorId).toBe('beta')
    expect(principal?.sistemaId).toBe('ponto')
    expect(principal?.texto).toMatch(/^Beta Tech cumpre \d+% do SLA, mas \d+% dos chamados de Ponto Eletrônico reabrem/)
    expect(principal?.destino).toEqual({ caminho: '/fornecedores', filtros: { fornecedorId: 'beta' } })
  })

  it('traz os insights secundários da Alfa e da Gama', () => {
    expect(insights.map((i) => i.id)).toEqual(
      expect.arrayContaining(['estouro-no-fechamento:alfa', 'backlog-crescente:gama']),
    )
    const gama = insights.find((i) => i.id === 'backlog-crescente:gama')!
    expect(gama.texto).toMatch(/cresce há 3 meses/)
    expect(gama.destino.parametros).toEqual({ tipo: 'evolutiva', estado: 'abertos' })
  })

  it('não inventa insight sem dados', () => {
    expect(detectarInsights([], [], agora, catalogo, CALENDARIO_UTIL)).toEqual([])
  })
})

describe('alertaFechamento', () => {
  it('avisa a 3 dias do fechamento com chamados de Folha abertos', () => {
    const alerta = alertaFechamento(base, agora, CALENDARIO_UTIL)
    expect(alerta?.dias).toBe(3)
    expect(alerta?.texto).toMatch(/^Fechamento da folha em 3 dias: \d+ chamados de Folha em aberto\.$/)
  })

  it('usa singular e "amanhã" quando cabe', () => {
    const vespera = new Date(2026, 9, 29, 10)
    const lista = analisarChamados(
      [criarChamado({ sistemaId: 'folha', abertoEm: new Date(2026, 9, 29, 9) })],
      { ...CONTEXTO_ANALISE, agora: vespera },
    )
    expect(alertaFechamento(lista, vespera, CALENDARIO_UTIL)?.texto).toBe(
      'Fechamento da folha amanhã: 1 chamado de Folha em aberto.',
    )
  })

  it('não aparece longe do fechamento', () => {
    expect(alertaFechamento(base, new Date(2026, 9, 14, 10), CALENDARIO_UTIL)).toBeNull()
  })
})
