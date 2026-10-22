export type CampoImportacao =
  | 'id'
  | 'tipo'
  | 'titulo'
  | 'sistema'
  | 'fornecedor'
  | 'prioridade'
  | 'abertura'
  | 'resolucao'
  | 'status'
  | 'reaberto'
  | 'satisfacao'

export interface ColunaImportacao {
  campo: CampoImportacao
  /** Cabeçalho da planilha modelo (CONCEITO.md, seção 8.1). */
  rotulo: string
  exemplo: string
  obrigatoria: boolean
  /** Outros nomes comuns nas planilhas dos fornecedores, usados no mapeamento automático. */
  sinonimos: readonly string[]
  /** Valores aceitos, para a aba de instruções do modelo. */
  aceita: string
}

export const COLUNAS_IMPORTACAO: readonly ColunaImportacao[] = [
  {
    campo: 'id',
    rotulo: 'ID do chamado',
    exemplo: 'INC-2026-0458',
    obrigatoria: true,
    sinonimos: ['id', 'nº chamado', 'n chamado', 'numero do chamado', 'numero', 'chamado', 'ticket', 'protocolo', 'codigo'],
    aceita: 'Identificador único. Padrão TIPO-AAAA-NNNN (INC, REQ ou EVO).',
  },
  {
    campo: 'tipo',
    rotulo: 'Tipo',
    exemplo: 'Incidente',
    obrigatoria: true,
    sinonimos: ['tipo de chamado', 'tipo chamado', 'natureza', 'classificacao'],
    aceita: 'Incidente, Requisição ou Evolutiva.',
  },
  {
    campo: 'titulo',
    rotulo: 'Título',
    exemplo: 'Erro no cálculo de adicional noturno',
    obrigatoria: true,
    sinonimos: ['assunto', 'resumo', 'titulo do chamado', 'descricao curta', 'descricao'],
    aceita: 'Texto livre.',
  },
  {
    campo: 'sistema',
    rotulo: 'Sistema de RH',
    exemplo: 'Folha de Pagamento',
    obrigatoria: true,
    sinonimos: ['sistema', 'modulo', 'aplicacao', 'sistema rh', 'produto'],
    aceita: 'Um dos sistemas cadastrados (nome completo ou curto).',
  },
  {
    campo: 'fornecedor',
    rotulo: 'Fornecedor',
    exemplo: 'Alfa Sistemas',
    obrigatoria: false,
    sinonimos: ['empresa', 'fornecedor ams', 'prestador', 'responsavel'],
    aceita: 'Alfa Sistemas, Beta Tech ou Gama Consultoria. Se vazio, usa o responsável pelo sistema.',
  },
  {
    campo: 'prioridade',
    rotulo: 'Prioridade',
    exemplo: 'P2',
    obrigatoria: true,
    sinonimos: ['criticidade', 'severidade', 'prio', 'urgencia'],
    aceita: 'P1, P2, P3 ou P4 (também Crítica, Alta, Média, Baixa).',
  },
  {
    campo: 'abertura',
    rotulo: 'Data e hora de abertura',
    exemplo: '03/10/2026 08:15',
    obrigatoria: true,
    sinonimos: ['dt abertura', 'data abertura', 'data de abertura', 'aberto em', 'abertura', 'data hora abertura', 'criado em'],
    aceita: 'dd/mm/aaaa hh:mm (ou data do Excel).',
  },
  {
    campo: 'resolucao',
    rotulo: 'Data e hora de resolução',
    exemplo: '03/10/2026 11:40',
    obrigatoria: false,
    sinonimos: [
      'dt resolucao',
      'data resolucao',
      'data de resolucao',
      'resolvido em',
      'dt fechamento',
      'data fechamento',
      'fechamento',
      'encerrado em',
      'encerramento',
    ],
    aceita: 'dd/mm/aaaa hh:mm. Obrigatória quando o status é Resolvido.',
  },
  {
    campo: 'status',
    rotulo: 'Status',
    exemplo: 'Resolvido',
    obrigatoria: true,
    sinonimos: ['situacao', 'estado', 'status do chamado'],
    aceita: 'Aberto, Em atendimento, Aguardando usuário ou Resolvido.',
  },
  {
    campo: 'reaberto',
    rotulo: 'Reaberto',
    exemplo: 'Não',
    obrigatoria: false,
    sinonimos: ['reabertura', 'foi reaberto', 'reaberto?'],
    aceita: 'Sim ou Não.',
  },
  {
    campo: 'satisfacao',
    rotulo: 'Nota de satisfação',
    exemplo: '4',
    obrigatoria: false,
    sinonimos: ['nota', 'satisfacao', 'nota satisfacao', 'csat', 'avaliacao', 'nota do usuario'],
    aceita: 'Número inteiro de 1 a 5.',
  },
]

/** Linhas exibidas na pré-visualização da validação. */
export const LINHAS_PREVIA_IMPORTACAO = 20

/** Tamanho máximo aceito para o arquivo enviado. */
export const TAMANHO_MAXIMO_ARQUIVO_MB = 5
