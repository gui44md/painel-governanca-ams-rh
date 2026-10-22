import { describe, expect, it } from 'vitest'
import { CALENDARIO_UTIL } from '@/config/sla'
import { analisarChamados } from './analise'
import {
  agruparPorEstado,
  contarCriteriosAtivos,
  CRITERIOS_PADRAO,
  escreverCriterios,
  filtrarChamados,
  lerCriterios,
  normalizarTexto,
  ordenarChamados,
  paginar,
} from './lista-chamados'
import { criarChamado } from './teste/fabrica'

const AGORA = new Date(2026, 9, 27, 17)
const d = (dia: number, hora = 9) => new Date(2026, 9, dia, hora)

const lista = analisarChamados(
  [
    criarChamado({ id: 'A', titulo: 'Sincronização do terminal', abertoEm: d(13), passos: [['resolvido', d(13, 11)]] }),
    criarChamado({ id: 'B', titulo: 'Outro problema', abertoEm: d(14), passos: [['resolvido', d(14, 11)]] }),
    criarChamado({ id: 'C', tipo: 'evolutiva', titulo: 'Nova tela', abertoEm: d(20), causa: 'evo' }),
    criarChamado({ id: 'D', prioridade: 'P3', titulo: 'Relatório', abertoEm: d(27, 10), causa: 'rel' }),
    criarChamado({ id: 'E', titulo: 'Quase estourando', abertoEm: d(27, 8), causa: 'outra' }),
  ],
  { agora: AGORA, calendario: CALENDARIO_UTIL, janelaReincidenciaDias: 15 },
)
const ids = (itens: { id: string }[]) => itens.map((c) => c.id)

describe('filtrarChamados', () => {
  it('sem critérios retorna tudo', () => {
    expect(filtrarChamados(lista, CRITERIOS_PADRAO)).toHaveLength(5)
  })

  it('busca por ID, título ou descrição, ignorando acentos', () => {
    expect(ids(filtrarChamados(lista, { ...CRITERIOS_PADRAO, busca: 'sincronizacao' }))).toEqual(['A'])
    expect(ids(filtrarChamados(lista, { ...CRITERIOS_PADRAO, busca: ' RELATORIO ' }))).toEqual(['D'])
    const comId = [{ ...lista[0]!, id: 'INC-2026-0458' }]
    expect(ids(filtrarChamados(comId, { ...CRITERIOS_PADRAO, busca: '0458' }))).toEqual(['INC-2026-0458'])
  })

  it('filtra por tipo, prioridade, estado e reincidência', () => {
    expect(ids(filtrarChamados(lista, { ...CRITERIOS_PADRAO, tipo: 'evolutiva' }))).toEqual(['C'])
    expect(ids(filtrarChamados(lista, { ...CRITERIOS_PADRAO, prioridade: 'P3' }))).toEqual(['D'])
    expect(ids(filtrarChamados(lista, { ...CRITERIOS_PADRAO, estado: 'abertos' }))).toEqual(['C', 'D', 'E'])
    expect(ids(filtrarChamados(lista, { ...CRITERIOS_PADRAO, estado: 'resolvido' }))).toEqual(['A', 'B'])
    // B repete A (mesmo sistema e causa, 1 dia depois)
    expect(ids(filtrarChamados(lista, { ...CRITERIOS_PADRAO, somenteReincidentes: true }))).toEqual(['B'])
  })
})

describe('ordenarChamados', () => {
  it('mais recentes primeiro', () => {
    expect(ids(ordenarChamados(lista, 'recentes'))).toEqual(['D', 'E', 'C', 'B', 'A'])
  })

  it('por consumo de SLA: abertos mais críticos primeiro, resolvidos por último', () => {
    expect(ids(ordenarChamados(lista, 'consumo-sla'))).toEqual(['E', 'D', 'C', 'B', 'A'])
  })
})

describe('agruparPorEstado', () => {
  it('separa nas colunas do kanban', () => {
    const grupos = agruparPorEstado(lista)
    expect(ids(grupos.resolvido)).toEqual(['A', 'B'])
    expect(ids(grupos.aberto)).toEqual(['C', 'D', 'E'])
    expect(grupos['aguardando-usuario']).toEqual([])
  })
})

describe('critérios na URL', () => {
  it('ida e volta preservam os filtros e omitem os padrões', () => {
    const criterios = { ...CRITERIOS_PADRAO, busca: 'ponto', tipo: 'incidente' as const, somenteReincidentes: true }
    const parametros = escreverCriterios(criterios)
    expect(parametros.toString()).toBe('busca=ponto&tipo=incidente&reincidentes=1')
    expect(lerCriterios(parametros)).toEqual(criterios)
  })

  it('ignora valores inválidos e preserva outros parâmetros', () => {
    expect(lerCriterios(new URLSearchParams('tipo=xyz&prioridade=P9&ordem=foo'))).toEqual(CRITERIOS_PADRAO)
    expect(escreverCriterios(CRITERIOS_PADRAO, new URLSearchParams('chamado=A')).toString()).toBe('chamado=A')
  })

  it('conta filtros ativos', () => {
    expect(contarCriteriosAtivos(CRITERIOS_PADRAO)).toBe(0)
    expect(contarCriteriosAtivos({ ...CRITERIOS_PADRAO, tipo: 'incidente', somenteReincidentes: true })).toBe(2)
  })
})

describe('utilitários', () => {
  it('normaliza texto', () => {
    expect(normalizarTexto('  Ação  ')).toBe('acao')
  })

  it('pagina com limites seguros', () => {
    const itens = Array.from({ length: 23 }, (_, i) => i)
    expect(paginar(itens, 3, 10)).toEqual({ itens: [20, 21, 22], pagina: 3, totalPaginas: 3 })
    expect(paginar(itens, 99, 10).pagina).toBe(3)
    expect(paginar([], 1, 10)).toEqual({ itens: [], pagina: 1, totalPaginas: 1 })
  })
})
