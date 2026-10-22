import { describe, expect, it } from 'vitest'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { INICIO_DADOS } from '@/config/referencia'
import { CONTEXTO_ANALISE, gerarBaseFicticia } from '@/dados/base-ficticia'
import type { Widget } from '@/tipos/dashboard'
import { analisarChamados } from '../analise'
import { aplicarFiltros } from '../filtros'
import { backlogEvolutivas, percentualSlaCumprido, taxaReincidencia } from '../indicadores'
import { calcularIndicador, dadosDoWidget, formatarIndicador, type ContextoWidget } from './agregacao'

const { agora } = CONTEXTO_ANALISE
const analisados = analisarChamados(gerarBaseFicticia(), CONTEXTO_ANALISE)
const contexto: ContextoWidget = {
  analisados,
  filtrosGlobais: { periodo: 'tudo', sistemaId: null, fornecedorId: null },
  agora,
  inicioDados: INICIO_DADOS,
  sistemas: SISTEMAS_RH,
  fornecedores: FORNECEDORES,
}

const widget = (dados: Partial<Widget>): Widget => ({
  id: 'w-1',
  tipo: 'barras',
  titulo: '',
  indicador: 'sla',
  agrupamento: 'fornecedor',
  filtro: { periodo: null, sistemaId: null, fornecedorId: null },
  meta: null,
  texto: '',
  ...dados,
})

describe('dadosDoWidget', () => {
  it('bate com os indicadores das outras telas', () => {
    const dados = dadosDoWidget(widget({}), contexto)
    expect(dados.valor).toBe(percentualSlaCumprido(analisados))
    const beta = dados.pontos.find((p) => p.chave === 'beta')
    expect(beta?.valor).toBe(percentualSlaCumprido(analisados.filter((c) => c.fornecedorId === 'beta')))
    expect(dados.pontos.map((p) => p.rotulo)).toEqual(['Alfa Sistemas', 'Beta Tech', 'Gama Consultoria'])
  })

  it('agrupa por mês dentro do período, com rótulos curtos', () => {
    const dados = dadosDoWidget(widget({ agrupamento: 'mes', indicador: 'volume' }), contexto)
    expect(dados.pontos.map((p) => p.rotulo)).toEqual(['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'])
    expect(dados.pontos.reduce((soma, p) => soma + (p.valor ?? 0), 0)).toBe(analisados.length)
  })

  it('o filtro do widget tem prioridade sobre o global', () => {
    const comFiltroGlobal = { ...contexto, filtrosGlobais: { ...contexto.filtrosGlobais, fornecedorId: 'alfa' as const } }
    const dados = dadosDoWidget(
      widget({ indicador: 'reincidencia', agrupamento: 'sistema', filtro: { periodo: null, sistemaId: null, fornecedorId: 'beta' } }),
      comFiltroGlobal,
    )
    expect(dados.recorte).toBe('Beta Tech')
    expect(dados.valor).toBe(taxaReincidencia(analisados.filter((c) => c.fornecedorId === 'beta')))
    // Agrupado por sistema, só aparecem os sistemas da Beta.
    expect(dados.pontos.map((p) => p.chave)).toEqual(['ponto', 'portal'])
  })

  it('sem filtro próprio, herda o global (inclusive o período)', () => {
    const outubro = { ...contexto, filtrosGlobais: { periodo: 'mes:2026-10' as const, sistemaId: 'folha' as const, fornecedorId: null } }
    const dados = dadosDoWidget(widget({ indicador: 'volume', agrupamento: 'mes' }), outubro)
    const esperado = aplicarFiltros(analisados, { sistemaId: 'folha', fornecedorId: null }, { inicio: new Date(2026, 9, 1), fim: agora })
    expect(dados.valor).toBe(esperado.length)
    expect(dados.pontos).toHaveLength(1)
    expect(dados.recorte).toBe('Folha')
  })

  it('backlog é medido no fim de cada mês, sobre toda a base do recorte', () => {
    const dados = dadosDoWidget(widget({ indicador: 'backlog', agrupamento: 'mes', filtro: { periodo: null, sistemaId: null, fornecedorId: 'gama' } }), contexto)
    const gama = analisados.filter((c) => c.fornecedorId === 'gama')
    expect(dados.valor).toBe(backlogEvolutivas(gama, agora).quantidade)
    expect(dados.pontos.at(-2)?.valor).toBe(backlogEvolutivas(gama, new Date(2026, 8, 30, 23, 59, 59, 999)).quantidade)
  })

  it('agrupa por prioridade efetiva e por tipo', () => {
    expect(dadosDoWidget(widget({ agrupamento: 'prioridade', indicador: 'volume' }), contexto).pontos.map((p) => p.chave)).toEqual([
      'P1',
      'P2',
      'P3',
      'P4',
    ])
    expect(dadosDoWidget(widget({ agrupamento: 'tipo', indicador: 'volume' }), contexto).pontos.map((p) => p.rotulo)).toEqual([
      'Incidente',
      'Requisição',
      'Evolutiva',
    ])
  })
})

describe('calcularIndicador e formatarIndicador', () => {
  it('formata cada indicador no seu formato', () => {
    expect(formatarIndicador('sla', 0.953)).toBe('95,3%')
    expect(formatarIndicador('mttr', 67.1)).toBe('67 h')
    expect(formatarIndicador('satisfacao', 4.12)).toBe('4,1')
    expect(formatarIndicador('volume', 12)).toBe('12')
    expect(formatarIndicador('volume', null)).toBe('—')
  })

  it('volume de uma lista vazia é zero; percentuais ficam sem valor', () => {
    expect(calcularIndicador('volume', [], agora)).toBe(0)
    expect(calcularIndicador('sla', [], agora)).toBeNull()
  })
})
