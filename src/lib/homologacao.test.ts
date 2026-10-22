import { describe, expect, it } from 'vitest'
import type { CasoTeste, Homologacao, ResultadoCaso } from '@/tipos/homologacao'
import {
  adicionarCaso,
  decidirHomologacao,
  decisoesPossiveis,
  etapaHomologacao,
  progressoHomologacao,
  reabrirHomologacao,
  registrarResultado,
} from './homologacao'

const AGORA = new Date(2026, 9, 27, 17)

const homologacao = (...resultados: ResultadoCaso[]): Homologacao => ({
  id: 'HML-001',
  titulo: 'Correção do adicional noturno',
  tipo: 'correcao',
  sistemaId: 'folha',
  fornecedorId: 'alfa',
  chamadoId: null,
  recebidaEm: new Date(2026, 9, 20),
  casos: resultados.map(
    (resultado, i): CasoTeste => ({ id: `HML-001-${i + 1}`, passo: `Passo ${i + 1}`, esperado: 'Ok', obtido: '', resultado }),
  ),
  decisao: 'pendente',
  decididaEm: null,
  observacao: '',
})

describe('progressoHomologacao', () => {
  it('conta executados, aprovados e reprovados', () => {
    expect(progressoHomologacao(homologacao('aprovado', 'reprovado', 'pendente', 'pendente'))).toEqual({
      total: 4,
      executados: 2,
      aprovados: 1,
      reprovados: 1,
      pendentes: 2,
      fracao: 0.5,
    })
  })

  it('sem casos, o progresso é zero', () => {
    expect(progressoHomologacao(homologacao()).fracao).toBe(0)
  })
})

describe('etapaHomologacao', () => {
  it('acompanha o andamento até a decisão', () => {
    expect(etapaHomologacao(homologacao('pendente', 'pendente'))).toBe('aguardando')
    expect(etapaHomologacao(homologacao('aprovado', 'pendente'))).toBe('em-teste')
    expect(etapaHomologacao(homologacao('aprovado', 'reprovado'))).toBe('pronta-para-decidir')
    expect(etapaHomologacao({ ...homologacao('aprovado'), decisao: 'liberada' })).toBe('liberada')
  })
})

describe('decisão final', () => {
  it('só libera com todos os casos aprovados', () => {
    expect(decisoesPossiveis(homologacao('aprovado', 'pendente')).liberar).toEqual({
      permitido: false,
      motivo: 'Falta 1 caso para executar.',
    })
    expect(decisoesPossiveis(homologacao('pendente', 'pendente')).liberar.motivo).toBe('Faltam 2 casos para executar.')
    expect(decisoesPossiveis(homologacao('aprovado', 'aprovado')).liberar.permitido).toBe(true)
  })

  it('devolve quando há caso reprovado, mesmo com pendentes', () => {
    const possiveis = decisoesPossiveis(homologacao('reprovado', 'pendente'))
    expect(possiveis.devolver.permitido).toBe(true)
    expect(possiveis.liberar).toEqual({ permitido: false, motivo: 'Há casos reprovados.' })
  })

  it('registra a decisão com data e exige justificativa ao devolver', () => {
    const liberada = decidirHomologacao(homologacao('aprovado'), 'liberada', '', AGORA)
    expect(liberada).toMatchObject({ decisao: 'liberada', decididaEm: AGORA })
    expect(() => decidirHomologacao(homologacao('reprovado'), 'devolvida', '  ', AGORA)).toThrow(/motivo/)
    expect(() => decidirHomologacao(homologacao('pendente'), 'liberada', '', AGORA)).toThrow()
  })

  it('depois de decidida, não aceita novos resultados até ser reaberta', () => {
    const liberada = decidirHomologacao(homologacao('aprovado'), 'liberada', '', AGORA)
    expect(registrarResultado(liberada, 'HML-001-1', { resultado: 'reprovado' })).toBe(liberada)
    const reaberta = reabrirHomologacao(liberada)
    expect(reaberta.decisao).toBe('pendente')
    expect(registrarResultado(reaberta, 'HML-001-1', { resultado: 'reprovado' }).casos[0]?.resultado).toBe('reprovado')
  })
})

describe('adicionarCaso', () => {
  it('cria o próximo caso como pendente', () => {
    const atualizada = adicionarCaso(homologacao('aprovado', 'aprovado'), ' Novo passo ', 'Esperado')
    expect(atualizada.casos.at(-1)).toEqual({
      id: 'HML-001-3',
      passo: 'Novo passo',
      esperado: 'Esperado',
      obtido: '',
      resultado: 'pendente',
    })
  })

  it('exige passo e resultado esperado', () => {
    expect(() => adicionarCaso(homologacao(), '', 'x')).toThrow()
  })
})
