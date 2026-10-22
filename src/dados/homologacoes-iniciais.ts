import type { Chamado } from '@/tipos/chamado'
import type { CasoTeste, Homologacao, ResultadoCaso } from '@/tipos/homologacao'

/** Homologações pré-carregadas (CONCEITO.md, seção 6.5). Datas em torno de 27/10/2026. */

const em = (mes: number, dia: number, hora = 10) => new Date(2026, mes - 1, dia, hora)

type Passo = [passo: string, esperado: string, obtido?: string, resultado?: ResultadoCaso]

const casos = (id: string, passos: Passo[]): CasoTeste[] =>
  passos.map(([passo, esperado, obtido = '', resultado = 'pendente'], i) => ({
    id: `${id}-${i + 1}`,
    passo,
    esperado,
    obtido,
    resultado,
  }))

/** Chamado mais recente com o título informado (os IDs vêm do gerador). */
function chamadoPorTitulo(chamados: readonly Chamado[], titulo: string): string | null {
  const encontrados = chamados.filter((c) => c.titulo === titulo)
  return encontrados.toSorted((a, b) => b.abertoEm.getTime() - a.abertoEm.getTime())[0]?.id ?? null
}

export function criarHomologacoesIniciais(chamados: readonly Chamado[]): Homologacao[] {
  return [
    {
      id: 'HML-001',
      titulo: 'Correção do cálculo de adicional noturno',
      tipo: 'correcao',
      sistemaId: 'folha',
      fornecedorId: 'alfa',
      chamadoId: chamadoPorTitulo(chamados, 'Erro no cálculo de adicional noturno na folha de outubro'),
      recebidaEm: em(10, 27, 15),
      // Exemplo do conceito: 5 casos. Três executados; os dois últimos ficam para a demonstração.
      casos: casos('HML-001', [
        [
          'Jornada das 22h às 5h em dia útil',
          '7h noturnas com adicional de 20% e hora reduzida de 52min30s',
          'Adicional e hora reduzida corretos',
          'aprovado',
        ],
        [
          'Jornada das 20h às 4h, atravessando a meia-noite',
          'Adicional só das 22h às 4h, dividido entre os dois dias',
          'Horas divididas corretamente na virada do dia',
          'aprovado',
        ],
        [
          'Jornada noturna em feriado (12/10)',
          'Adicional noturno somado ao adicional de feriado',
          'Os dois adicionais aparecem no holerite',
          'aprovado',
        ],
        ['Escala 12x36 das 19h às 7h', 'Adicional sobre 22h às 7h (prorrogação após as 5h)'],
        ['Colaborador afastado por atestado durante o período', 'Sem adicional noturno nos dias de afastamento'],
      ]),
      decisao: 'pendente',
      decididaEm: null,
      observacao: '',
    },
    {
      id: 'HML-002',
      titulo: 'Correção definitiva do sincronismo do terminal de Juiz de Fora',
      tipo: 'correcao',
      sistemaId: 'ponto',
      fornecedorId: 'beta',
      chamadoId: chamadoPorTitulo(chamados, 'Batidas de ponto não sincronizadas no terminal de Juiz de Fora'),
      recebidaEm: em(10, 26, 9),
      casos: casos('HML-002', [
        [
          'Registrar 50 batidas com o terminal offline e reconectar',
          'Todas as batidas sincronizadas em até 5 minutos',
          '50 de 50 batidas sincronizadas em 3 minutos',
          'aprovado',
        ],
        [
          'Reiniciar o terminal durante a coleta',
          'Nenhuma batida perdida após o reinício',
          '12 batidas perdidas após o reinício',
          'reprovado',
        ],
        ['Batidas na troca de turno das 6h', 'Batidas de entrada e saída no turno correto'],
        ['Monitorar 48h sem intervenção manual', 'Nenhuma falha de sincronismo no período'],
      ]),
      decisao: 'pendente',
      decididaEm: null,
      observacao: '',
    },
    {
      id: 'HML-003',
      titulo: 'Evolutiva: incluir novo benefício de auxílio-creche',
      tipo: 'evolutiva',
      sistemaId: 'beneficios',
      fornecedorId: 'alfa',
      chamadoId: chamadoPorTitulo(chamados, 'Evolutiva: incluir novo benefício de auxílio-creche'),
      recebidaEm: em(10, 14),
      casos: casos('HML-003', [
        ['Cadastrar dependente de 3 anos', 'Colaborador elegível ao auxílio-creche', 'Elegível', 'aprovado'],
        ['Cadastrar dependente de 7 anos', 'Colaborador não elegível (acima do limite de idade)', 'Não elegível', 'aprovado'],
        ['Solicitar reembolso com comprovante', 'Reembolso lançado na folha do mês seguinte', 'Rubrica gerada', 'aprovado'],
        ['Solicitar acima do limite da faixa', 'Reembolso limitado ao teto da faixa', 'Valor limitado ao teto', 'aprovado'],
      ]),
      decisao: 'liberada',
      decididaEm: em(10, 20, 16),
      observacao: 'Todos os casos aprovados. Liberado para produção na janela de 21/10.',
    },
    {
      id: 'HML-004',
      titulo: 'Correção do alerta de NR vencida para gestores',
      tipo: 'correcao',
      sistemaId: 'treinamentos',
      fornecedorId: 'gama',
      chamadoId: null,
      recebidaEm: em(10, 23, 11),
      casos: casos('HML-004', [
        ['Colaborador com NR-35 vencida ontem', 'Gestor recebe alerta no mesmo dia'],
        ['Colaborador com NR-10 vencendo em 30 dias', 'Gestor recebe aviso de reciclagem'],
        ['Colaborador desligado com NR vencida', 'Nenhum alerta enviado'],
      ]),
      decisao: 'pendente',
      decididaEm: null,
      observacao: '',
    },
  ]
}
