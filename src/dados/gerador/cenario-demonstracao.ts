import type { Chamado, EstadoChamado } from '@/tipos/chamado'

/**
 * Chamados escritos à mão que dão rosto aos insights durante a demonstração
 * (CONCEITO.md, seções 6.1, 6.4 e 13). Eles passam pelo mesmo motor de SLA e
 * pela mesma detecção de reincidência que o restante da base.
 */

type Evento = [EstadoChamado, Date, string?]

interface DadosRoteirizados
  extends Pick<
    Chamado,
    'tipo' | 'titulo' | 'descricao' | 'sistemaId' | 'fornecedorId' | 'prioridade' | 'categoria' | 'causa'
  > {
  eventos: Evento[]
  solucao?: Chamado['solucao']
  satisfacao?: number
}

const em = (mes: number, dia: number, hora: number, minuto = 0) => new Date(2026, mes - 1, dia, hora, minuto)

function roteirizado(dados: DadosRoteirizados): Omit<Chamado, 'id'> {
  const { eventos, solucao = null, satisfacao = null, ...campos } = dados
  const historico = eventos.map(([estado, data, nota]) => ({ estado, em: data, ...(nota ? { nota } : {}) }))
  const ultimo = historico.at(-1)!
  return {
    ...campos,
    abertoEm: historico[0]!.em,
    resolvidoEm: ultimo.estado === 'resolvido' ? ultimo.em : null,
    historico,
    reaberto: false,
    solucao,
    satisfacao,
  }
}

// ── Insight principal: o terminal de Juiz de Fora volta a falhar a cada ~2 semanas ──

const SINCRONISMO_JF = {
  tipo: 'incidente',
  titulo: 'Batidas de ponto não sincronizadas no terminal de Juiz de Fora',
  descricao: 'Marcações do turno da madrugada não chegaram ao sistema; equipe de operação sem registro.',
  sistemaId: 'ponto',
  fornecedorId: 'beta',
  prioridade: 'P2',
  categoria: 'Sincronismo de terminal de ponto',
  causa: 'Sincronismo de terminal de ponto · Juiz de Fora · infraestrutura',
} as const

const ATRIBUIDO_BETA = 'Atribuído à sustentação da Beta Tech'
const CONTORNO_JF = 'Contorno aplicado: reinício do serviço de coleta do terminal. Causa raiz não tratada.'

const sincronismoResolvido = (inicio: Date, resposta: Date, resolucao: Date, satisfacao: number) =>
  roteirizado({
    ...SINCRONISMO_JF,
    eventos: [
      ['aberto', inicio],
      ['em-atendimento', resposta, ATRIBUIDO_BETA],
      ['resolvido', resolucao, CONTORNO_JF],
    ],
    solucao: 'paliativa',
    satisfacao,
  })

const SEQUENCIA_JUIZ_DE_FORA = [
  sincronismoResolvido(em(9, 8, 7, 40), em(9, 8, 8, 10), em(9, 8, 10, 30), 4),
  sincronismoResolvido(em(9, 21, 7, 20), em(9, 21, 8, 5), em(9, 21, 9, 50), 3),
  sincronismoResolvido(em(10, 5, 7, 35), em(10, 5, 8, 0), em(10, 5, 9, 40), 2),
  sincronismoResolvido(em(10, 19, 7, 15), em(10, 19, 8, 5), em(10, 19, 9, 30), 2),
  roteirizado({
    ...SINCRONISMO_JF,
    eventos: [
      ['aberto', em(10, 27, 10, 30)],
      ['em-atendimento', em(10, 27, 10, 50), ATRIBUIDO_BETA],
    ],
  }),
]

// ── Alerta de calendário: chamados de Folha abertos às vésperas do fechamento (30/10) ──

const ATRIBUIDO_ALFA = 'Atribuído à sustentação da Alfa Sistemas'

const FOLHA_NO_FECHAMENTO = [
  roteirizado({
    tipo: 'incidente',
    titulo: 'Erro no cálculo de adicional noturno na folha de outubro',
    descricao: 'Adicional noturno calculado abaixo do esperado para o grupo de maquinistas em escala 12x36.',
    sistemaId: 'folha',
    fornecedorId: 'alfa',
    prioridade: 'P2',
    categoria: 'Cálculo de adicional noturno',
    causa: 'Cálculo de adicional noturno · maquinistas · regra de negócio',
    eventos: [
      ['aberto', em(10, 27, 13, 40)],
      ['em-atendimento', em(10, 27, 13, 55), ATRIBUIDO_ALFA],
    ],
  }),
  roteirizado({
    tipo: 'incidente',
    titulo: 'Divergência de desconto de INSS no holerite de oficina de locomotivas',
    descricao: 'Desconto previdenciário diferente da tabela vigente.',
    sistemaId: 'folha',
    fornecedorId: 'alfa',
    prioridade: 'P3',
    categoria: 'Cálculo de encargos',
    causa: 'Cálculo de encargos · oficina de locomotivas · parametrização',
    eventos: [
      ['aberto', em(10, 26, 14, 0)],
      ['em-atendimento', em(10, 26, 15, 10), ATRIBUIDO_ALFA],
    ],
  }),
  roteirizado({
    tipo: 'requisicao',
    titulo: 'Reprocessar folha complementar de outubro',
    descricao: 'Gerar folha complementar após acordo coletivo.',
    sistemaId: 'folha',
    fornecedorId: 'alfa',
    prioridade: 'P3',
    categoria: 'Folha complementar',
    causa: 'Folha complementar · regra de negócio',
    eventos: [
      ['aberto', em(10, 27, 14, 30)],
      ['em-atendimento', em(10, 27, 15, 0), ATRIBUIDO_ALFA],
    ],
  }),
  roteirizado({
    tipo: 'incidente',
    titulo: 'Relatório de provisão de férias com valores zerados',
    descricao: 'Relatório gerencial de provisão retorna valores zerados para o administrativo.',
    sistemaId: 'folha',
    fornecedorId: 'alfa',
    prioridade: 'P4',
    categoria: 'Relatório de provisão',
    causa: 'Relatório de provisão · administrativo · carga de dados',
    eventos: [
      ['aberto', em(10, 26, 9, 0)],
      ['em-atendimento', em(10, 26, 10, 0), ATRIBUIDO_ALFA],
      ['aguardando-usuario', em(10, 26, 15, 0), 'Aguardando relatório de exemplo do usuário'],
    ],
  }),
]

export const CENARIO_DEMONSTRACAO: readonly Omit<Chamado, 'id'>[] = [
  ...SEQUENCIA_JUIZ_DE_FORA,
  ...FOLHA_NO_FECHAMENTO,
]
