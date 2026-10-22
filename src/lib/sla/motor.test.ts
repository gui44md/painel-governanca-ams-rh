import { describe, expect, it } from 'vitest'
import { CALENDARIO_UTIL } from '@/config/sla'
import { criarChamado } from '@/lib/teste/fabrica'
import { avaliarSla, elevarPrioridade, estadoAtual, prioridadeEfetiva, type ContextoSla } from './motor'

// Outubro de 2026: 13 = terça, 9 = sexta, 12 = feriado. Fechamento da folha: 30/10.
const d = (dia: number, hora = 0, minuto = 0) => new Date(2026, 9, dia, hora, minuto)
const contexto = (agora: Date): ContextoSla => ({ agora, calendario: CALENDARIO_UTIL })

describe('prioridade', () => {
  it('eleva uma prioridade, sem passar de P1', () => {
    expect(elevarPrioridade('P3')).toBe('P2')
    expect(elevarPrioridade('P1')).toBe('P1')
  })

  it('eleva chamados de Folha abertos nos 5 dias antes do fechamento', () => {
    const naJanela = { sistemaId: 'folha' as const, prioridade: 'P3' as const, abertoEm: d(26, 10) }
    expect(prioridadeEfetiva(naJanela, CALENDARIO_UTIL)).toEqual({ prioridade: 'P2', elevado: true })
  })

  it('não eleva fora da janela nem em outros sistemas', () => {
    expect(prioridadeEfetiva({ sistemaId: 'folha', prioridade: 'P3', abertoEm: d(14, 10) }, CALENDARIO_UTIL))
      .toEqual({ prioridade: 'P3', elevado: false })
    expect(prioridadeEfetiva({ sistemaId: 'ponto', prioridade: 'P3', abertoEm: d(26, 10) }, CALENDARIO_UTIL))
      .toEqual({ prioridade: 'P3', elevado: false })
  })
})

describe('avaliarSla', () => {
  it('não se aplica a evolutivas', () => {
    expect(avaliarSla(criarChamado({ tipo: 'evolutiva' }), contexto(d(20)))).toBeNull()
  })

  it('P2 em horário útil: 4h de 8h consumidas = no prazo', () => {
    const chamado = criarChamado({ abertoEm: d(13, 9), passos: [['em-atendimento', d(13, 9, 30)]] })
    const sla = avaliarSla(chamado, contexto(d(13, 13)))!
    expect(sla.limiteMinutos).toBe(480)
    expect(sla.consumidoMinutos).toBe(240)
    expect(sla.fracaoConsumida).toBe(0.5)
    expect(sla.status).toBe('no-prazo')
    expect(sla.cumprido).toBeNull()
    expect(sla.prazoEm).toEqual(d(13, 17))
  })

  it('fica em risco ao atingir 80% e estourado acima de 100%', () => {
    const chamado = criarChamado({ abertoEm: d(13, 8) })
    expect(avaliarSla(chamado, contexto(d(13, 14, 24)))!.status).toBe('em-risco') // 80%
    expect(avaliarSla(chamado, contexto(d(13, 16)))!.status).toBe('em-risco') // 100%
    expect(avaliarSla(chamado, contexto(d(13, 16, 1)))!.status).toBe('estourado')
  })

  it('P1 conta 24x7, inclusive de madrugada', () => {
    const chamado = criarChamado({ prioridade: 'P1', abertoEm: d(9, 22) })
    const sla = avaliarSla(chamado, contexto(d(10, 1)))!
    expect(sla.modo).toBe('24x7')
    expect(sla.consumidoMinutos).toBe(180)
    expect(sla.prazoEm).toEqual(d(10, 2))
  })

  it('não conta noite, fim de semana nem feriado para P2', () => {
    const chamado = criarChamado({ abertoEm: d(9, 16) })
    const sla = avaliarSla(chamado, contexto(d(13, 10)))!
    expect(sla.consumidoMinutos).toBe(4 * 60) // 2h na sexta + 2h na terça
  })

  it('pausa o relógio em "Aguardando usuário"', () => {
    const chamado = criarChamado({
      abertoEm: d(13, 8),
      passos: [
        ['em-atendimento', d(13, 8, 30)],
        ['aguardando-usuario', d(13, 10)],
        ['em-atendimento', d(13, 15)],
      ],
    })
    const sla = avaliarSla(chamado, contexto(d(13, 16)))!
    expect(sla.consumidoMinutos).toBe(180) // 8h–10h e 15h–16h
    expect(sla.pausadoMinutos).toBe(300)
    expect(sla.prazoEm).toEqual(d(14, 11)) // 5h restantes a partir das 16h: 16h–18h + 8h–11h
  })

  it('indica quando o chamado está pausado agora', () => {
    const chamado = criarChamado({ abertoEm: d(13, 8), passos: [['aguardando-usuario', d(13, 9)]] })
    const sla = avaliarSla(chamado, contexto(d(13, 17)))!
    expect(sla.pausado).toBe(true)
    expect(sla.consumidoMinutos).toBe(60)
  })

  it('resolvido dentro do prazo: concluído e cumprido', () => {
    const chamado = criarChamado({
      abertoEm: d(13, 9),
      passos: [
        ['em-atendimento', d(13, 9, 20)],
        ['resolvido', d(13, 12)],
      ],
    })
    const sla = avaliarSla(chamado, contexto(d(20)))!
    expect(sla.status).toBe('concluido')
    expect(sla.cumprido).toBe(true)
    expect(sla.consumidoMinutos).toBe(180)
    expect(sla.respostaNoPrazo).toBe(true)
  })

  it('resolvido depois do prazo: concluído mas não cumprido', () => {
    const chamado = criarChamado({ abertoEm: d(13, 9), passos: [['resolvido', d(14, 12)]] })
    const sla = avaliarSla(chamado, contexto(d(20)))!
    expect(sla.status).toBe('concluido')
    expect(sla.cumprido).toBe(false)
  })

  it('reabertura volta a contar no mesmo SLA', () => {
    const chamado = criarChamado({
      abertoEm: d(13, 9),
      passos: [
        ['resolvido', d(13, 12)],
        ['em-atendimento', d(14, 9)],
        ['resolvido', d(14, 16)],
      ],
    })
    const sla = avaliarSla(chamado, contexto(d(20)))!
    expect(sla.consumidoMinutos).toBe(3 * 60 + 7 * 60)
    expect(sla.cumprido).toBe(false)
  })

  it('primeira resposta fora do prazo é sinalizada', () => {
    const chamado = criarChamado({ abertoEm: d(13, 9), passos: [['em-atendimento', d(13, 10, 30)]] })
    expect(avaliarSla(chamado, contexto(d(13, 11)))!.respostaNoPrazo).toBe(false)
  })

  it('usa a prioridade elevada no fechamento da folha', () => {
    const chamado = criarChamado({ sistemaId: 'folha', prioridade: 'P3', abertoEm: d(27, 9) })
    const sla = avaliarSla(chamado, contexto(d(27, 10)))!
    expect(sla.prioridadeEfetiva).toBe('P2')
    expect(sla.elevadoPorFechamento).toBe(true)
    expect(sla.limiteMinutos).toBe(480)
  })

  it('ignora eventos posteriores ao "agora"', () => {
    const chamado = criarChamado({ abertoEm: d(13, 9), passos: [['resolvido', d(13, 12)]] })
    const sla = avaliarSla(chamado, contexto(d(13, 10)))!
    expect(sla.status).toBe('no-prazo')
    expect(sla.consumidoMinutos).toBe(60)
  })
})

describe('estadoAtual', () => {
  it('retorna o último estado até o momento informado', () => {
    const chamado = criarChamado({ abertoEm: d(13, 9), passos: [['em-atendimento', d(13, 10)]] })
    expect(estadoAtual(chamado, d(13, 9, 30))).toBe('aberto')
    expect(estadoAtual(chamado, d(13, 11))).toBe('em-atendimento')
  })
})
