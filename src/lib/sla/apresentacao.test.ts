import { describe, expect, it } from 'vitest'
import { CALENDARIO_UTIL } from '@/config/sla'
import { analisarChamados } from '../analise'
import { criarChamado } from '../teste/fabrica'
import { apresentarSla } from './apresentacao'

const d = (dia: number, hora = 9, minuto = 0) => new Date(2026, 9, dia, hora, minuto)
const analisar = (agora: Date, ...chamados: Parameters<typeof criarChamado>[0][]) =>
  analisarChamados(chamados.map(criarChamado), { agora, calendario: CALENDARIO_UTIL, janelaReincidenciaDias: 15 })

describe('apresentarSla', () => {
  it('chamado aberto no prazo mostra percentual e tempo consumido', () => {
    const [chamado] = analisar(d(13, 13), { abertoEm: d(13, 9) })
    expect(apresentarSla(chamado!, d(13, 13))).toEqual({
      tom: 'no-prazo',
      rotulo: 'No prazo · 50%',
      detalhe: '4h de 8h úteis',
      fracao: 0.5,
    })
  })

  it('chamado em risco e pausado avisa a pausa', () => {
    const [chamado] = analisar(d(13, 17), {
      abertoEm: d(13, 8),
      passos: [['aguardando-usuario', d(13, 15)]],
    })
    const resultado = apresentarSla(chamado!, d(13, 17))
    expect(resultado.tom).toBe('em-risco')
    expect(resultado.detalhe).toBe('Pausado: aguardando usuário')
  })

  it('P1 informa horas corridas', () => {
    const [chamado] = analisar(d(13, 10), { abertoEm: d(13, 9), prioridade: 'P1' })
    expect(apresentarSla(chamado!, d(13, 10)).detalhe).toBe('1h de 4h corridas')
  })

  it('resolvido fora do prazo fica com tom de estouro', () => {
    const [chamado] = analisar(d(20), { abertoEm: d(13, 9), passos: [['resolvido', d(15, 9)]] })
    expect(apresentarSla(chamado!, d(20))).toMatchObject({ tom: 'estourado', rotulo: 'Resolvido fora do prazo' })
  })

  it('resolvido no prazo fica concluído', () => {
    const [chamado] = analisar(d(20), { abertoEm: d(13, 9), passos: [['resolvido', d(13, 10)]] })
    expect(apresentarSla(chamado!, d(20))).toMatchObject({ tom: 'concluido', rotulo: 'Resolvido no prazo' })
  })

  it('evolutiva mostra a data de entrega e sinaliza atraso', () => {
    const evolutiva = {
      tipo: 'evolutiva' as const,
      abertoEm: d(1),
      evolutiva: { requisito: '', impacto: '', entregaPrevista: d(20, 18) },
    }
    const [noPrazo] = analisar(d(15), evolutiva)
    expect(apresentarSla(noPrazo!, d(15))).toEqual({
      tom: 'no-prazo',
      rotulo: 'Sem SLA',
      detalhe: 'Entrega prevista 20/10',
      fracao: null,
    })
    const [atrasada] = analisar(d(27), evolutiva)
    expect(apresentarSla(atrasada!, d(27))).toMatchObject({ tom: 'estourado', rotulo: 'Entrega atrasada' })
  })
})
