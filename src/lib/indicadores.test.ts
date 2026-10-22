import { describe, expect, it } from 'vitest'
import { CALENDARIO_UTIL } from '@/config/sla'
import type { Chamado } from '@/tipos/chamado'
import { analisarChamados } from './analise'
import {
  aderenciaPlanoAcao,
  backlog,
  backlogEvolutivas,
  chamadosEmAberto,
  estavaEmAberto,
  mttrHoras,
  percentualSlaCumprido,
  resumirIndicadores,
  satisfacaoMedia,
  taxaReincidencia,
  variacao,
} from './indicadores'
import { criarChamado } from './teste/fabrica'

const d = (dia: number, hora = 9) => new Date(2026, 9, dia, hora)
const AGORA = d(20, 12)

const analisar = (chamados: Chamado[]) =>
  analisarChamados(chamados, { agora: AGORA, calendario: CALENDARIO_UTIL, janelaReincidenciaDias: 15 })

// Terça 13/10. P2 = 8h úteis.
const noPrazo = criarChamado({ id: 'A', abertoEm: d(13, 9), passos: [['resolvido', d(13, 12)]], satisfacao: 5 })
const foraDoPrazo = criarChamado({ id: 'B', abertoEm: d(13, 9), passos: [['resolvido', d(15, 9)]], satisfacao: 2 })
const repetido = criarChamado({ id: 'C', abertoEm: d(14, 9), passos: [['resolvido', d(14, 15)]] })
const emAberto = criarChamado({ id: 'D', abertoEm: d(19, 9), causa: 'outra' })
const evolutiva = criarChamado({ id: 'E', tipo: 'evolutiva', abertoEm: d(1, 9), causa: 'nova-funcao' })

const lista = analisar([noPrazo, foraDoPrazo, repetido, emAberto, evolutiva])

describe('percentualSlaCumprido', () => {
  it('considera só resolvidos com SLA', () => {
    // A (3h) e C (6h) no prazo; B (16h úteis) fora. D aberto e E evolutiva não entram.
    expect(percentualSlaCumprido(lista)).toBeCloseTo(2 / 3)
  })

  it('retorna null sem resolvidos', () => {
    expect(percentualSlaCumprido(analisar([emAberto]))).toBeNull()
  })
})

describe('mttrHoras', () => {
  it('é a média em horas corridas entre abertura e resolução', () => {
    expect(mttrHoras(lista)).toBeCloseTo((3 + 48 + 6) / 3)
  })
})

describe('taxaReincidencia', () => {
  it('divide reincidentes pelo total de incidentes e requisições', () => {
    // C repete A (mesma causa, aberto 1 dia depois da resolução). Base: A, B, C, D.
    expect(lista.find((c) => c.id === 'C')?.reincidente).toBe(true)
    expect(taxaReincidencia(lista)).toBeCloseTo(1 / 4)
  })
})

describe('satisfacaoMedia', () => {
  it('ignora quem não avaliou', () => {
    expect(satisfacaoMedia(lista)).toBe(3.5)
    expect(satisfacaoMedia([])).toBeNull()
  })
})

describe('estoque em um instante', () => {
  it('estavaEmAberto respeita abertura e resolução', () => {
    expect(estavaEmAberto(foraDoPrazo, d(14))).toBe(true)
    expect(estavaEmAberto(foraDoPrazo, d(16))).toBe(false)
    expect(estavaEmAberto(emAberto, d(18))).toBe(false)
  })

  it('chamadosEmAberto não conta evolutivas', () => {
    expect(chamadosEmAberto(lista, AGORA)).toBe(1)
  })

  it('backlog de evolutivas traz quantidade e idade média', () => {
    expect(backlogEvolutivas(lista, AGORA)).toEqual({ quantidade: 1, idadeMediaDias: 19.125 })
    expect(backlog([], AGORA)).toEqual({ quantidade: 0, idadeMediaDias: null })
  })
})

describe('aderenciaPlanoAcao', () => {
  it('conta ações concluídas até o prazo', () => {
    const acoes = [
      { prazo: d(10), concluidaEm: d(9) },
      { prazo: d(10), concluidaEm: d(12) },
      { prazo: d(10), concluidaEm: null },
      { prazo: d(10, 9), concluidaEm: d(10, 9) },
    ]
    expect(aderenciaPlanoAcao(acoes)).toBe(0.5)
    expect(aderenciaPlanoAcao([])).toBeNull()
  })
})

describe('resumirIndicadores', () => {
  it('reúne todos os indicadores', () => {
    const resumo = resumirIndicadores(lista, AGORA)
    expect(resumo.volume).toBe(5)
    expect(resumo.chamadosEmAberto).toBe(1)
    expect(resumo.backlogEvolutivas.quantidade).toBe(1)
  })
})

describe('variacao', () => {
  it('subtrai o anterior do atual', () => {
    expect(variacao(0.9, 0.85)).toBeCloseTo(0.05)
    expect(variacao(null, 0.85)).toBeNull()
  })
})
