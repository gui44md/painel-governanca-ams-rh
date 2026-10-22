import { describe, expect, it } from 'vitest'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import type { Acao } from '@/tipos/plano-acao'
import type { Insight } from './insights'
import {
  acaoAtrasada,
  linhasDoTexto,
  moverAcao,
  prazoPadrao,
  registrarReuniao,
  rascunhoVazio,
  resumirPlano,
  situacaoPrazo,
  sugerirAcaoDeIndicador,
  sugerirAcaoDeInsight,
  sugestoesPendentes,
  temErros,
  validarAcao,
  validarReuniao,
} from './plano-acao'

const AGORA = new Date(2026, 9, 27, 17)
const d = (mes: number, dia: number) => new Date(2026, mes - 1, dia, 23, 59)

const acao = (dados: Partial<Acao> = {}): Acao => ({
  id: 'ACA-001',
  titulo: 'Ação de teste',
  descricao: '',
  indicador: 'sla',
  fornecedorId: null,
  sistemaId: null,
  responsavel: 'Carla',
  prazo: d(10, 30),
  status: 'a-fazer',
  criadaEm: d(10, 1),
  concluidaEm: null,
  origem: { tipo: 'manual' },
  ...dados,
})

describe('prazo das ações', () => {
  it('ação aberta com prazo vencido está atrasada; concluída nunca', () => {
    expect(acaoAtrasada(acao({ prazo: d(10, 20) }), AGORA)).toBe(true)
    expect(acaoAtrasada(acao({ prazo: d(10, 20), status: 'concluida' }), AGORA)).toBe(false)
  })

  it('descreve a situação do prazo com tom de status', () => {
    expect(situacaoPrazo(acao({ prazo: d(11, 10) }), AGORA)).toEqual({ tom: 'no-prazo', texto: 'Vence em 14 dias' })
    expect(situacaoPrazo(acao({ prazo: d(10, 28) }), AGORA)).toEqual({ tom: 'em-risco', texto: 'Vence em 1 dia' })
    expect(situacaoPrazo(acao({ prazo: d(10, 27) }), AGORA)).toEqual({ tom: 'em-risco', texto: 'Vence hoje' })
    expect(situacaoPrazo(acao({ prazo: d(10, 23) }), AGORA)).toEqual({ tom: 'estourado', texto: 'Atrasada há 4 dias' })
  })

  it('descreve ações concluídas no prazo e com atraso', () => {
    expect(situacaoPrazo(acao({ status: 'concluida', concluidaEm: d(10, 25) }), AGORA)).toEqual({
      tom: 'concluido',
      texto: 'Concluída em 25/10',
    })
    expect(situacaoPrazo(acao({ status: 'concluida', prazo: d(10, 20), concluidaEm: d(10, 25) }), AGORA).tom).toBe(
      'estourado',
    )
  })
})

describe('moverAcao', () => {
  it('registra a data ao concluir e limpa ao reabrir', () => {
    const concluida = moverAcao(acao(), 'concluida', AGORA)
    expect(concluida.concluidaEm).toEqual(AGORA)
    expect(moverAcao(concluida, 'em-andamento', AGORA).concluidaEm).toBeNull()
  })

  it('não altera se o status é o mesmo', () => {
    const original = acao()
    expect(moverAcao(original, 'a-fazer', AGORA)).toBe(original)
  })
})

describe('resumirPlano', () => {
  it('conta por status, atrasadas e aderência', () => {
    const resumo = resumirPlano(
      [
        acao({ status: 'concluida', prazo: d(10, 20), concluidaEm: d(10, 19) }),
        acao({ status: 'concluida', prazo: d(10, 20), concluidaEm: d(10, 22) }),
        acao({ status: 'em-andamento', prazo: d(10, 23) }),
        acao({ status: 'a-fazer', prazo: d(11, 10) }),
      ],
      AGORA,
    )
    expect(resumo.porStatus).toEqual({ 'a-fazer': 1, 'em-andamento': 1, concluida: 2 })
    expect(resumo.atrasadas).toBe(1)
    expect(resumo.aderencia).toBe(0.25)
  })
})

describe('validarAcao', () => {
  it('exige título, responsável e prazo', () => {
    const erros = validarAcao({ ...rascunhoVazio(AGORA), titulo: 'abc', prazo: null })
    expect(Object.keys(erros).sort()).toEqual(['prazo', 'responsavel', 'titulo'])
    expect(temErros(erros)).toBe(true)
  })

  it('aceita uma ação completa', () => {
    const erros = validarAcao({ ...rascunhoVazio(AGORA), titulo: 'Revisar contrato', responsavel: 'Juliana' })
    expect(temErros(erros)).toBe(false)
  })

  it('o prazo padrão é daqui a 14 dias, no fim do dia', () => {
    expect(prazoPadrao(AGORA)).toEqual(new Date(2026, 10, 10, 23, 59))
  })
})

describe('sugestões de ação', () => {
  const insight: Insight = {
    id: 'reincidencia-oculta:beta:ponto',
    tipo: 'reincidencia-oculta',
    fornecedorId: 'beta',
    sistemaId: 'ponto',
    texto: 'Beta Tech cumpre 97% do SLA, mas 31% dos chamados de Ponto Eletrônico reabrem.',
    rotuloAcao: 'Investigar',
    destino: { caminho: '/fornecedores', filtros: {} },
  }
  const catalogo = { fornecedores: FORNECEDORES, sistemas: SISTEMAS_RH }

  it('um insight vira uma ação pré-preenchida', () => {
    const { rascunho } = sugerirAcaoDeInsight(insight, AGORA, catalogo)
    expect(rascunho.titulo).toBe('Análise de causa raiz com Beta Tech sobre reincidência em Ponto Eletrônico')
    expect(rascunho.indicador).toBe('reincidencia')
    expect(rascunho.fornecedorId).toBe('beta')
    expect(rascunho.origem).toEqual({ tipo: 'insight', referencia: insight.id })
  })

  it('um indicador ruim vira uma ação de melhoria', () => {
    const { rascunho, id } = sugerirAcaoDeIndicador('mttr', 'MTTR subiu 3,3 h', AGORA)
    expect(id).toBe('indicador:mttr')
    expect(rascunho.titulo).toBe('Plano de melhoria: MTTR')
  })

  it('some da lista depois de virar ação', () => {
    const sugestao = sugerirAcaoDeInsight(insight, AGORA, catalogo)
    expect(sugestoesPendentes([sugestao], [])).toHaveLength(1)
    expect(sugestoesPendentes([sugestao], [acao({ origem: sugestao.rascunho.origem })])).toHaveLength(0)
  })
})

describe('linhasDoTexto', () => {
  it('separa por linha e descarta vazias', () => {
    expect(linhasDoTexto(' Carla \n\n Marcos (Beta Tech)\n')).toEqual(['Carla', 'Marcos (Beta Tech)'])
  })
})

describe('registrarReuniao', () => {
  const dados = {
    titulo: ' Reunião mensal com Gama ',
    data: AGORA,
    fornecedorId: 'gama' as const,
    participantes: ['Carla', 'Eduardo (Gama)'],
    decisoes: ['Repriorizar evolutivas'],
    acoesExistentes: ['ACA-001'],
    novasAcoes: ['Enviar nova data de entrega', 'Revisar escopo da triagem por CNH'],
  }

  it('cria as ações novas e liga tudo à reunião', () => {
    const resultado = registrarReuniao([acao()], [], dados, AGORA)
    expect(resultado.reuniaoId).toBe('REU-001')
    expect(resultado.acoes.map((a) => a.id)).toEqual(['ACA-001', 'ACA-002', 'ACA-003'])
    expect(resultado.acoes[1]).toMatchObject({
      titulo: 'Enviar nova data de entrega',
      fornecedorId: 'gama',
      responsavel: 'A definir',
      status: 'a-fazer',
      origem: { tipo: 'reuniao', referencia: 'REU-001' },
    })
    expect(resultado.reunioes[0]).toMatchObject({ titulo: 'Reunião mensal com Gama', acoesIds: ['ACA-001', 'ACA-002', 'ACA-003'] })
  })

  it('valida título, participantes e conteúdo', () => {
    expect(validarReuniao(dados)).toEqual({})
    expect(Object.keys(validarReuniao({ ...dados, titulo: '', participantes: [], decisoes: [], novasAcoes: [] })).sort()).toEqual([
      'decisoes',
      'participantes',
      'titulo',
    ])
  })
})
