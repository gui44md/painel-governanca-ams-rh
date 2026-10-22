import { describe, expect, it } from 'vitest'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import type { FiltrosGlobais } from '@/tipos/filtros'
import { criarChamado } from './teste/fabrica'
import {
  aplicarFiltros,
  contarFiltrosAtivos,
  descreverFiltros,
  normalizarFiltros,
  sistemasDisponiveis,
} from './filtros'

describe('aplicarFiltros', () => {
  const chamados = [
    criarChamado({ id: 'A', sistemaId: 'ponto', fornecedorId: 'beta', abertoEm: new Date(2026, 8, 30, 23) }),
    criarChamado({ id: 'B', sistemaId: 'portal', fornecedorId: 'beta', abertoEm: new Date(2026, 9, 1, 8) }),
    criarChamado({ id: 'C', sistemaId: 'folha', fornecedorId: 'alfa', abertoEm: new Date(2026, 9, 5) }),
  ]
  const outubro = { inicio: new Date(2026, 9, 1), fim: new Date(2026, 9, 31, 23, 59) }

  it('sem filtros retorna tudo', () => {
    expect(aplicarFiltros(chamados, { sistemaId: null, fornecedorId: null })).toHaveLength(3)
  })

  it('filtra por fornecedor, sistema e período de abertura', () => {
    const ids = (lista: { id: string }[]) => lista.map((c) => c.id)
    expect(ids(aplicarFiltros(chamados, { sistemaId: null, fornecedorId: 'beta' }))).toEqual(['A', 'B'])
    expect(ids(aplicarFiltros(chamados, { sistemaId: 'ponto', fornecedorId: null }))).toEqual(['A'])
    expect(ids(aplicarFiltros(chamados, { sistemaId: null, fornecedorId: 'beta' }, outubro))).toEqual(['B'])
  })
})

const PADRAO: FiltrosGlobais = { periodo: 'tudo', sistemaId: null, fornecedorId: null }

describe('sistemasDisponiveis', () => {
  it('retorna todos os sistemas quando nenhum fornecedor está selecionado', () => {
    expect(sistemasDisponiveis(SISTEMAS_RH, null)).toHaveLength(6)
  })

  it('retorna apenas os sistemas sustentados pelo fornecedor', () => {
    expect(sistemasDisponiveis(SISTEMAS_RH, 'beta').map((s) => s.id)).toEqual(['ponto', 'portal'])
  })
})

describe('normalizarFiltros', () => {
  it('mantém sistema e fornecedor compatíveis', () => {
    const filtros: FiltrosGlobais = { ...PADRAO, sistemaId: 'ponto', fornecedorId: 'beta' }
    expect(normalizarFiltros(filtros, SISTEMAS_RH)).toBe(filtros)
  })

  it('limpa o sistema quando o fornecedor não o sustenta', () => {
    const filtros: FiltrosGlobais = { ...PADRAO, sistemaId: 'folha', fornecedorId: 'beta' }
    expect(normalizarFiltros(filtros, SISTEMAS_RH)).toEqual({ ...filtros, sistemaId: null })
  })

  it('não altera nada quando falta sistema ou fornecedor', () => {
    const soSistema: FiltrosGlobais = { ...PADRAO, sistemaId: 'folha' }
    expect(normalizarFiltros(soSistema, SISTEMAS_RH)).toBe(soSistema)
  })
})

describe('descreverFiltros', () => {
  const catalogo = {
    periodos: [{ id: 'tudo' as const, rotulo: 'Todo o período' }],
    sistemas: SISTEMAS_RH,
    fornecedores: FORNECEDORES,
  }

  it('descreve o estado inicial', () => {
    expect(descreverFiltros(PADRAO, catalogo)).toEqual([
      'Todo o período',
      'Todos os sistemas',
      'Todos os fornecedores',
    ])
  })

  it('usa os nomes completos do catálogo', () => {
    const filtros: FiltrosGlobais = { ...PADRAO, sistemaId: 'ponto', fornecedorId: 'beta' }
    expect(descreverFiltros(filtros, catalogo)).toEqual(['Todo o período', 'Ponto Eletrônico', 'Beta Tech'])
  })
})

describe('contarFiltrosAtivos', () => {
  it('conta apenas o que difere do padrão', () => {
    expect(contarFiltrosAtivos(PADRAO, PADRAO)).toBe(0)
    expect(contarFiltrosAtivos({ periodo: 'mes:2026-10', sistemaId: 'ponto', fornecedorId: null }, PADRAO)).toBe(2)
  })
})
