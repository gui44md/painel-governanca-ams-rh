import { describe, expect, it } from 'vitest'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { INICIO_DADOS } from '@/config/referencia'
import { CALENDARIO_UTIL, DIAS_ELEVACAO_FECHAMENTO } from '@/config/sla'
import { CONTEXTO_ANALISE, gerarBaseFicticia } from '@/dados/base-ficticia'
import { analisarChamados, type ChamadoAnalisado } from '@/lib/analise'
import { diasAteFechamento, estaNaJanelaDeFechamento } from '@/lib/calendario-rh'
import { backlogEvolutivas, chamadosEmAberto, percentualSlaCumprido, taxaReincidencia } from '@/lib/indicadores'
import { ehDiaUtil } from '@/lib/sla/relogio'
import type { FornecedorId, SistemaId } from '@/tipos/catalogo'

const { agora } = CONTEXTO_ANALISE
const base = gerarBaseFicticia()
const chamados = analisarChamados(base, CONTEXTO_ANALISE)

const doFornecedor = (id: FornecedorId) => chamados.filter((c) => c.fornecedorId === id)
const doSistema = (id: SistemaId) => chamados.filter((c) => c.sistemaId === id)
const fimDoMes = (mes: number) => new Date(2026, mes, 0, 23, 59)
const maiorPor = <T extends string>(ids: readonly T[], valor: (id: T) => number | null) =>
  ids.toSorted((a, b) => (valor(b) ?? -1) - (valor(a) ?? -1))[0]

describe('integridade da base fictícia', () => {
  it('é determinística', () => {
    expect(JSON.stringify(gerarBaseFicticia())).toBe(JSON.stringify(base))
  })

  it('tem cerca de 600 chamados no período simulado', () => {
    expect(base.length).toBeGreaterThan(550)
    expect(base.length).toBeLessThan(700)
    for (const chamado of base) {
      expect(chamado.abertoEm.getTime()).toBeGreaterThanOrEqual(INICIO_DADOS.getTime())
      expect(chamado.abertoEm.getTime()).toBeLessThanOrEqual(agora.getTime())
    }
  })

  it('usa IDs únicos no formato TIPO-ANO-NÚMERO', () => {
    const ids = base.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^(INC|REQ|EVO)-2026-\d{4}$/)
  })

  it('tem histórico cronológico e coerente com a resolução', () => {
    for (const chamado of base) {
      const { historico } = chamado
      expect(historico[0]?.estado).toBe('aberto')
      expect(historico[0]?.em).toEqual(chamado.abertoEm)
      for (let i = 1; i < historico.length; i++) {
        expect(historico[i]!.em.getTime()).toBeGreaterThanOrEqual(historico[i - 1]!.em.getTime())
      }
      expect(historico.at(-1)!.em.getTime()).toBeLessThanOrEqual(agora.getTime())
      const resolvido = historico.at(-1)!.estado === 'resolvido'
      expect(chamado.resolvidoEm).toEqual(resolvido ? historico.at(-1)!.em : null)
    }
  })

  it('só avalia e classifica a solução de chamados resolvidos', () => {
    for (const chamado of base) {
      if (chamado.resolvidoEm === null) {
        expect(chamado.satisfacao).toBeNull()
        expect(chamado.solucao).toBeNull()
      } else if (chamado.satisfacao !== null) {
        expect([1, 2, 3, 4, 5]).toContain(chamado.satisfacao)
      }
    }
  })

  it('só evolutivas têm requisito e análise de impacto', () => {
    for (const chamado of base) {
      expect(Boolean(chamado.evolutiva)).toBe(chamado.tipo === 'evolutiva')
    }
  })

  it('cobre todos os sistemas, fornecedores e status de SLA em aberto', () => {
    for (const sistema of SISTEMAS_RH) expect(doSistema(sistema.id).length).toBeGreaterThan(30)
    const statusAbertos = new Set(chamados.filter((c) => c.emAberto && c.sla).map((c) => c.sla!.status))
    expect(statusAbertos).toEqual(new Set(['no-prazo', 'em-risco', 'estourado']))
  })
})

describe('insight principal: Beta Tech tem o melhor SLA, mas a pior reincidência em Ponto', () => {
  const ids = FORNECEDORES.map((f) => f.id)

  it('Beta Tech tem o maior % de SLA cumprido', () => {
    expect(maiorPor(ids, (id) => percentualSlaCumprido(doFornecedor(id)))).toBe('beta')
    expect(percentualSlaCumprido(doFornecedor('beta'))).toBeGreaterThan(0.93)
  })

  it('Beta Tech tem a maior taxa de reincidência', () => {
    expect(maiorPor(ids, (id) => taxaReincidencia(doFornecedor(id)))).toBe('beta')
  })

  it('Ponto Eletrônico é o sistema com mais reincidência, perto de 31%', () => {
    const sistemas = SISTEMAS_RH.map((s) => s.id)
    expect(maiorPor(sistemas, (id) => taxaReincidencia(doSistema(id)))).toBe('ponto')
    expect(taxaReincidencia(doSistema('ponto'))).toBeGreaterThan(0.26)
    expect(taxaReincidencia(doSistema('ponto'))).toBeLessThan(0.36)
  })

  it('a explicação está nos dados: a maioria dos reincidentes de Ponto vem de contorno paliativo', () => {
    const porId = new Map(chamados.map((c) => [c.id, c]))
    const repeticoes = doSistema('ponto').filter((c) => c.reincidencia?.repeticaoDe)
    const origensPaliativas = repeticoes.filter((c) => porId.get(c.reincidencia!.repeticaoDe!)?.solucao === 'paliativa')
    expect(origensPaliativas.length / repeticoes.length).toBeGreaterThan(0.7)
  })

  it('a sequência roteirizada do terminal de Juiz de Fora é detectada como reincidência', () => {
    const sequencia = chamados
      .filter((c) => c.causa === 'Sincronismo de terminal de ponto · Juiz de Fora · infraestrutura')
      .toSorted((a, b) => a.abertoEm.getTime() - b.abertoEm.getTime())
    expect(sequencia.length).toBeGreaterThanOrEqual(5)
    const ultimo = sequencia.at(-1)!
    expect(ultimo.emAberto).toBe(true)
    expect(ultimo.reincidencia?.repeticaoDe).toBe(sequencia.at(-2)!.id)
  })
})

describe('insights secundários', () => {
  it('Alfa Sistemas tem o pior SLA, e a maioria dos estouros é na semana de fechamento', () => {
    const ids = FORNECEDORES.map((f) => f.id)
    expect(ids.toSorted((a, b) => percentualSlaCumprido(doFornecedor(a))! - percentualSlaCumprido(doFornecedor(b))!)[0])
      .toBe('alfa')
    const estouros = doFornecedor('alfa').filter((c) => c.sla?.cumprido === false)
    const noFechamento = estouros.filter((c) =>
      estaNaJanelaDeFechamento(c.abertoEm, CALENDARIO_UTIL, DIAS_ELEVACAO_FECHAMENTO),
    )
    expect(noFechamento.length / estouros.length).toBeGreaterThan(0.6)
  })

  it('o backlog de evolutivas da Gama Consultoria cresce há 3 meses', () => {
    const gama = doFornecedor('gama')
    const [jul, ago, set] = [7, 8, 9].map((mes) => backlogEvolutivas(gama, fimDoMes(mes)).quantidade)
    const out = backlogEvolutivas(gama, agora).quantidade
    expect(ago).toBeGreaterThan(jul!)
    expect(set).toBeGreaterThan(ago!)
    expect(out).toBeGreaterThan(set!)
  })
})

describe('padrões sazonais', () => {
  const porDiaUtil = (lista: ChamadoAnalisado[], filtro: (data: Date) => boolean) => {
    const dias = new Set<string>()
    for (let d = new Date(INICIO_DADOS); d <= agora; d.setDate(d.getDate() + 1)) {
      if (ehDiaUtil(d, CALENDARIO_UTIL) && filtro(d)) dias.add(d.toDateString())
    }
    return lista.filter((c) => dias.has(c.abertoEm.toDateString())).length / dias.size
  }

  it('Ponto recebe mais chamados às segundas-feiras', () => {
    const ponto = doSistema('ponto')
    const segunda = porDiaUtil(ponto, (d) => d.getDay() === 1)
    const demais = porDiaUtil(ponto, (d) => d.getDay() !== 1)
    expect(segunda / demais).toBeGreaterThan(1.4)
  })

  it('Folha recebe mais chamados perto do fechamento', () => {
    const folha = doSistema('folha')
    const janela = (d: Date) => estaNaJanelaDeFechamento(d, CALENDARIO_UTIL, DIAS_ELEVACAO_FECHAMENTO)
    expect(porDiaUtil(folha, janela) / porDiaUtil(folha, (d) => !janela(d))).toBeGreaterThan(1.5)
  })
})

describe('alerta de calendário de RH', () => {
  it('a 3 dias do fechamento há chamados de Folha em aberto', () => {
    expect(diasAteFechamento(agora, CALENDARIO_UTIL)).toBe(3)
    expect(chamadosEmAberto(doSistema('folha'), agora)).toBeGreaterThanOrEqual(4)
  })
})
