import type { Acao, Reuniao } from '@/tipos/plano-acao'

/**
 * Plano de ação pré-carregado (CONCEITO.md, seção 6.4). Pessoas e reuniões
 * são fictícias. Datas em torno do "agora" da simulação (27/10/2026).
 */

const em = (mes: number, dia: number, hora = 23, minuto = 59) => new Date(2026, mes - 1, dia, hora, minuto)

const PESSOAS = {
  coordenadora: 'Carla Mendes (Coordenação Sistemas RH)',
  analista: 'Rafael Souza (Analista Sistemas RH)',
  contratos: 'Juliana Prado (Gestão de Contratos)',
  estagio: 'Estagiário TI – Sistemas RH',
  beta: 'Marcos Lima (Beta Tech)',
  alfa: 'Patrícia Gomes (Alfa Sistemas)',
  gama: 'Eduardo Reis (Gama Consultoria)',
} as const

const ACOES: Acao[] = [
  {
    id: 'ACA-001',
    titulo: 'Reunião de causa raiz com Beta Tech sobre sincronismo de ponto',
    descricao: 'Chamados de sincronismo de terminais de ponto voltam em até 15 dias. Pedir análise de causa raiz e plano de correção definitiva.',
    indicador: 'reincidencia',
    fornecedorId: 'beta',
    sistemaId: 'ponto',
    responsavel: PESSOAS.coordenadora,
    prazo: em(10, 30),
    status: 'em-andamento',
    criadaEm: em(10, 22, 15),
    concluidaEm: null,
    origem: { tipo: 'reuniao', referencia: 'REU-002' },
  },
  {
    id: 'ACA-002',
    titulo: 'Revisar critério de encerramento de chamados no contrato',
    descricao: 'Incluir no contrato de AMS que incidentes só são encerrados com correção definitiva ou plano de causa raiz aprovado.',
    indicador: 'reincidencia',
    fornecedorId: null,
    sistemaId: null,
    responsavel: PESSOAS.contratos,
    prazo: em(11, 13),
    status: 'a-fazer',
    criadaEm: em(10, 22, 15),
    concluidaEm: null,
    origem: { tipo: 'reuniao', referencia: 'REU-002' },
  },
  {
    id: 'ACA-003',
    titulo: 'Homologar correção do terminal de ponto de Juiz de Fora',
    descricao: 'Executar o roteiro de testes da correção definitiva antes de liberar para produção.',
    indicador: 'reincidencia',
    fornecedorId: 'beta',
    sistemaId: 'ponto',
    responsavel: PESSOAS.estagio,
    prazo: em(11, 4),
    status: 'a-fazer',
    criadaEm: em(10, 22, 15),
    concluidaEm: null,
    origem: { tipo: 'reuniao', referencia: 'REU-002' },
  },
  {
    id: 'ACA-004',
    titulo: 'Plano de capacidade da Alfa para a semana de fechamento',
    descricao: 'Estouros de SLA concentrados nos 5 dias antes do fechamento da folha. Alfa deve reforçar a equipe nesse período.',
    indicador: 'sla',
    fornecedorId: 'alfa',
    sistemaId: 'folha',
    responsavel: PESSOAS.alfa,
    prazo: em(10, 23),
    status: 'em-andamento',
    criadaEm: em(10, 15, 11),
    concluidaEm: null,
    origem: { tipo: 'reuniao', referencia: 'REU-001' },
  },
  {
    id: 'ACA-005',
    titulo: 'Repriorizar backlog de evolutivas com a Gama',
    descricao: 'Definir com a área de Recrutamento quais evolutivas entram primeiro e acordar novas datas de entrega.',
    indicador: 'backlogEvolutivas',
    fornecedorId: 'gama',
    sistemaId: 'recrutamento',
    responsavel: PESSOAS.analista,
    prazo: em(11, 6),
    status: 'a-fazer',
    criadaEm: em(10, 20, 10),
    concluidaEm: null,
    origem: { tipo: 'manual' },
  },
  {
    id: 'ACA-006',
    titulo: 'Corrigir alerta de vencimento de NR para gestores',
    descricao: 'Gestores não recebiam alerta de reciclagem de NR vencida.',
    indicador: 'satisfacao',
    fornecedorId: 'gama',
    sistemaId: 'treinamentos',
    responsavel: PESSOAS.gama,
    prazo: em(10, 15),
    status: 'concluida',
    criadaEm: em(9, 28, 9),
    concluidaEm: em(10, 9, 16),
    origem: { tipo: 'manual' },
  },
  {
    id: 'ACA-007',
    titulo: 'Publicar orientação sobre acesso ao holerite no Portal',
    descricao: 'Reduzir chamados de acesso a documentos no início do mês.',
    indicador: 'abertos',
    fornecedorId: 'beta',
    sistemaId: 'portal',
    responsavel: PESSOAS.analista,
    prazo: em(9, 18),
    status: 'concluida',
    criadaEm: em(9, 4, 10),
    concluidaEm: em(9, 22, 14),
    origem: { tipo: 'manual' },
  },
]

// Histórico dos meses anteriores: dá base real para a aderência ao plano.
const concluida = (
  id: string,
  titulo: string,
  dados: Pick<Acao, 'indicador' | 'fornecedorId' | 'sistemaId' | 'responsavel'>,
  criadaEm: Date,
  prazo: Date,
  concluidaEm: Date,
): Acao => ({ id, titulo, descricao: '', ...dados, prazo, status: 'concluida', criadaEm, concluidaEm, origem: { tipo: 'manual' } })

const HISTORICO: Acao[] = [
  concluida(
    'ACA-008',
    'Ajustar regra de hora reduzida noturna na folha',
    { indicador: 'sla', fornecedorId: 'alfa', sistemaId: 'folha', responsavel: PESSOAS.analista },
    em(6, 1, 9),
    em(6, 15),
    em(6, 12, 17),
  ),
  concluida(
    'ACA-009',
    'Orientar a central de atendimento sobre acesso ao Portal',
    { indicador: 'satisfacao', fornecedorId: 'beta', sistemaId: 'portal', responsavel: PESSOAS.coordenadora },
    em(6, 24, 10),
    em(7, 10),
    em(7, 8, 15),
  ),
  concluida(
    'ACA-010',
    'Definir SLA de resposta para chamados de Recrutamento',
    { indicador: 'mttr', fornecedorId: 'gama', sistemaId: 'recrutamento', responsavel: PESSOAS.contratos },
    em(7, 14, 9),
    em(7, 31),
    em(8, 5, 11),
  ),
  concluida(
    'ACA-011',
    'Revisar cadastro de escalas 12x36 das equipes de pátio',
    { indicador: 'abertos', fornecedorId: 'beta', sistemaId: 'ponto', responsavel: PESSOAS.analista },
    em(8, 3, 14),
    em(8, 20),
    em(8, 18, 16),
  ),
  concluida(
    'ACA-012',
    'Criar checklist de fechamento da folha com a Alfa',
    { indicador: 'sla', fornecedorId: 'alfa', sistemaId: 'folha', responsavel: PESSOAS.coordenadora },
    em(8, 26, 10),
    em(9, 10),
    em(9, 9, 18),
  ),
]

const REUNIOES: Reuniao[] = [
  {
    id: 'REU-001',
    titulo: 'Alinhamento de fechamento da folha com Alfa Sistemas',
    data: em(10, 15, 10),
    fornecedorId: 'alfa',
    participantes: [PESSOAS.coordenadora, PESSOAS.analista, PESSOAS.alfa],
    decisoes: [
      'Alfa reforça a equipe de sustentação nos 5 dias antes do fechamento.',
      'Chamados de Folha abertos nessa janela sobem uma prioridade (regra já no contrato).',
    ],
    acoesIds: ['ACA-004'],
  },
  {
    id: 'REU-002',
    titulo: 'Reunião mensal com Beta Tech – outubro',
    data: em(10, 22, 14),
    fornecedorId: 'beta',
    participantes: [PESSOAS.coordenadora, PESSOAS.analista, PESSOAS.estagio, PESSOAS.beta],
    decisoes: [
      'SLA da Beta Tech dentro da meta, mas reincidência em Ponto Eletrônico acima de 30%.',
      'Beta Tech vai apresentar análise de causa raiz do sincronismo dos terminais.',
      'Chamados de Ponto só serão encerrados com evidência de correção definitiva.',
    ],
    acoesIds: ['ACA-001', 'ACA-002', 'ACA-003'],
  },
]

/** Cópias novas a cada chamada, para "restaurar exemplos" não compartilhar referências. */
export function criarPlanoInicial(): { acoes: Acao[]; reunioes: Reuniao[] } {
  return structuredClone({ acoes: [...ACOES, ...HISTORICO], reunioes: REUNIOES })
}
