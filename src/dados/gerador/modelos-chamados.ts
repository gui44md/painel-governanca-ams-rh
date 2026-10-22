import type { SistemaId } from '@/tipos/catalogo'
import type { Prioridade, TipoChamado } from '@/tipos/chamado'

/**
 * Modelos de chamados fictícios por sistema de RH. Os marcadores entre chaves
 * ({unidade}, {grupo}...) são preenchidos pelo gerador e, junto com a origem
 * técnica sorteada, compõem a causa raiz: "sincronismo no terminal de Juiz de
 * Fora por infraestrutura" é diferente de "... de Santos por parametrização"
 * para a detecção de reincidência.
 */
export interface ModeloChamado {
  tipo: TipoChamado
  titulo: string
  descricao: string
  /** Categoria legível do problema (vira `Chamado.categoria`). */
  causa: string
  prioridades: readonly (readonly [Prioridade, number])[]
  /** Frequência relativa dentro do mesmo sistema e tipo. */
  peso: number
  /** Contorno típico quando o fornecedor não corrige a causa. */
  contorno?: string
  requisito?: string
  impacto?: string
}

export const VARIAVEIS = {
  unidade: [
    'Juiz de Fora',
    'Barra do Piraí',
    'Belo Horizonte',
    'Volta Redonda',
    'Conselheiro Lafaiete',
    'Santos',
    'Barra Mansa',
    'Jeceaba',
    'Sarzedo',
    'Japeri',
  ],
  grupo: [
    'maquinistas',
    'manutenção de via',
    'oficina de locomotivas',
    'Centro de Controle Operacional',
    'administrativo',
    'jovens aprendizes',
    'pátio de manobras',
  ],
  beneficio: ['plano de saúde', 'vale-alimentação', 'vale-refeição', 'plano odontológico', 'seguro de vida'],
  documento: ['holerite', 'informe de rendimentos', 'aviso de férias', 'espelho de ponto', 'extrato de benefícios'],
  vaga: [
    'maquinista',
    'mecânico de locomotivas',
    'técnico de segurança do trabalho',
    'eletricista de manutenção',
    'operador de pátio',
    'estágio em engenharia',
  ],
  nr: ['NR-10', 'NR-11', 'NR-12', 'NR-20', 'NR-33', 'NR-35'],
} as const

export type NomeVariavel = keyof typeof VARIAVEIS

/** Origem técnica registrada pelo fornecedor ao encerrar o chamado. */
export const ORIGENS_TECNICAS = [
  'parametrização',
  'integração entre sistemas',
  'dados cadastrais',
  'perfil de acesso',
  'infraestrutura',
  'regra de negócio',
  'versão do sistema',
  'carga de dados',
] as const

const P1_P2: ModeloChamado['prioridades'] = [
  ['P1', 1],
  ['P2', 3],
]
const P2_P3: ModeloChamado['prioridades'] = [
  ['P2', 2],
  ['P3', 3],
]
const P3_P4: ModeloChamado['prioridades'] = [
  ['P3', 3],
  ['P4', 2],
]
const EVOLUTIVA: ModeloChamado['prioridades'] = [
  ['P3', 2],
  ['P4', 3],
]

export const MODELOS_POR_SISTEMA: Record<SistemaId, readonly ModeloChamado[]> = {
  folha: [
    {
      tipo: 'incidente',
      titulo: 'Erro no cálculo de adicional noturno na folha de {mes}',
      descricao: 'Adicional noturno calculado abaixo do esperado para o grupo de {grupo}.',
      causa: 'Cálculo de adicional noturno',
      prioridades: P2_P3,
      peso: 3,
      contorno: 'lançamento manual da diferença',
    },
    {
      tipo: 'incidente',
      titulo: 'Folha não processa para o grupo de {grupo}',
      descricao: 'Processamento da folha interrompido com erro de cálculo de encargos.',
      causa: 'Processamento da folha',
      prioridades: [
        ['P1', 3],
        ['P2', 1],
      ],
      peso: 2,
      contorno: 'reprocessamento manual do lote',
    },
    {
      tipo: 'incidente',
      titulo: 'Divergência de desconto de INSS no holerite de {grupo}',
      descricao: 'Desconto previdenciário diferente da tabela vigente.',
      causa: 'Cálculo de encargos',
      prioridades: P2_P3,
      peso: 2,
    },
    {
      tipo: 'incidente',
      titulo: 'Relatório de provisão de férias com valores zerados',
      descricao: 'Relatório gerencial de provisão retorna valores zerados para {grupo}.',
      causa: 'Relatório de provisão',
      prioridades: P3_P4,
      peso: 1,
    },
    {
      tipo: 'requisicao',
      titulo: 'Incluir rubrica de periculosidade para {grupo}',
      descricao: 'Parametrizar nova rubrica conforme laudo atualizado.',
      causa: 'Parametrização de rubrica',
      prioridades: P2_P3,
      peso: 2,
    },
    {
      tipo: 'requisicao',
      titulo: 'Reprocessar folha complementar de {mes}',
      descricao: 'Gerar folha complementar após acordo coletivo.',
      causa: 'Folha complementar',
      prioridades: P2_P3,
      peso: 1,
    },
    {
      tipo: 'evolutiva',
      titulo: 'Evolutiva: integrar folha ao novo plano de contas contábil',
      descricao: 'Adequar a interface contábil da folha ao novo plano de contas.',
      causa: 'Novo plano de contas',
      prioridades: EVOLUTIVA,
      peso: 1,
      requisito: 'Mapear rubricas para as novas contas contábeis e gerar o arquivo no layout atualizado.',
      impacto: 'Afeta o fechamento contábil mensal; exige homologação conjunta com Controladoria.',
    },
    {
      tipo: 'evolutiva',
      titulo: 'Evolutiva: simulador de rescisão para o RH',
      descricao: 'Permitir simular verbas rescisórias antes do desligamento.',
      causa: 'Simulador de rescisão',
      prioridades: EVOLUTIVA,
      peso: 1,
      requisito: 'Tela de simulação com as mesmas regras do cálculo oficial, sem gravar lançamentos.',
      impacto: 'Baixo risco: não altera o cálculo oficial; reduz retrabalho do RH em desligamentos.',
    },
  ],
  beneficios: [
    {
      tipo: 'incidente',
      titulo: 'Erro em relatório de benefícios de {beneficio}',
      descricao: 'Relatório mensal com totais divergentes da fatura do fornecedor.',
      causa: 'Relatório de benefícios',
      prioridades: P2_P3,
      peso: 2,
    },
    {
      tipo: 'incidente',
      titulo: '{beneficio} não creditado para admitidos do mês',
      descricao: 'Novos colaboradores sem crédito no primeiro mês.',
      causa: 'Crédito de benefício',
      prioridades: P2_P3,
      peso: 2,
      contorno: 'crédito avulso manual',
    },
    {
      tipo: 'requisicao',
      titulo: 'Cadastrar dependente no {beneficio}',
      descricao: 'Inclusão de dependente com documentação já validada pelo RH.',
      causa: 'Cadastro de dependente',
      prioridades: P3_P4,
      peso: 3,
    },
    {
      tipo: 'evolutiva',
      titulo: 'Evolutiva: incluir novo benefício de auxílio-creche',
      descricao: 'Criar o benefício de auxílio-creche com regras de elegibilidade.',
      causa: 'Auxílio-creche',
      prioridades: EVOLUTIVA,
      peso: 1,
      requisito: 'Elegibilidade por idade do dependente, reembolso mensal com comprovante e limite por faixa.',
      impacto: 'Gera nova rubrica na Folha e novo fluxo no Portal; depende de aprovação do Jurídico.',
    },
  ],
  ponto: [
    {
      tipo: 'incidente',
      titulo: 'Batidas de ponto não sincronizadas no terminal de {unidade}',
      descricao: 'Marcações do turno não chegaram ao sistema; equipe de operação sem registro.',
      causa: 'Sincronismo de terminal de ponto',
      prioridades: P1_P2,
      peso: 4,
      contorno: 'reinício do serviço de coleta do terminal',
    },
    {
      tipo: 'incidente',
      titulo: 'Marcação duplicada após troca de escala em {unidade}',
      descricao: 'Escala nova gerou marcações duplicadas e horas extras indevidas.',
      causa: 'Troca de escala',
      prioridades: P2_P3,
      peso: 2,
      contorno: 'exclusão manual das marcações duplicadas',
    },
    {
      tipo: 'incidente',
      titulo: 'Escala 12x36 calculando horas extras incorretamente para {grupo}',
      descricao: 'Jornada 12x36 sendo tratada como jornada comercial.',
      causa: 'Cálculo de escala 12x36',
      prioridades: P2_P3,
      peso: 2,
      contorno: 'ajuste manual do banco de horas',
    },
    {
      tipo: 'incidente',
      titulo: 'Terminal biométrico sem comunicação em {unidade}',
      descricao: 'Terminal offline; colaboradores registrando ponto em formulário.',
      causa: 'Comunicação de terminal',
      prioridades: P1_P2,
      peso: 2,
      contorno: 'liberação de marcação manual pelo gestor',
    },
    {
      tipo: 'requisicao',
      titulo: 'Ajuste de escala da equipe de {grupo} em {unidade}',
      descricao: 'Atualizar escala de revezamento conforme novo quadro de turnos.',
      causa: 'Ajuste de escala',
      prioridades: P3_P4,
      peso: 3,
    },
    {
      tipo: 'requisicao',
      titulo: 'Liberar acesso ao espelho de ponto para gestor de {unidade}',
      descricao: 'Novo gestor precisa aprovar as ocorrências da equipe.',
      causa: 'Acesso de gestor',
      prioridades: P3_P4,
      peso: 2,
    },
    {
      tipo: 'evolutiva',
      titulo: 'Evolutiva: alerta de interjornada para equipes de operação',
      descricao: 'Alertar o gestor quando o descanso entre jornadas ficar abaixo do mínimo legal.',
      causa: 'Alerta de interjornada',
      prioridades: EVOLUTIVA,
      peso: 1,
      requisito: 'Alerta diário por e-mail e no painel do gestor com os colaboradores em risco.',
      impacto: 'Reduz passivo trabalhista; depende de dados de escala corretos.',
    },
  ],
  portal: [
    {
      tipo: 'incidente',
      titulo: 'Colaborador sem acesso ao {documento} no Portal',
      descricao: 'Documento indisponível ou com erro ao abrir.',
      causa: 'Acesso a documentos',
      prioridades: P2_P3,
      peso: 4,
      contorno: 'envio do documento por e-mail',
    },
    {
      tipo: 'incidente',
      titulo: 'Lentidão ao abrir {documento} no Portal',
      descricao: 'Tempo de carregamento acima de 30 segundos no horário de pico.',
      causa: 'Desempenho do Portal',
      prioridades: P3_P4,
      peso: 2,
      contorno: 'limpeza de cache do servidor',
    },
    {
      tipo: 'requisicao',
      titulo: 'Ajuste de texto no Portal: página de {documento}',
      descricao: 'Corrigir orientação desatualizada exibida ao colaborador.',
      causa: 'Ajuste de conteúdo',
      prioridades: [['P4', 1]],
      peso: 2,
    },
    {
      tipo: 'requisicao',
      titulo: 'Publicar comunicado de {beneficio} no Portal',
      descricao: 'Publicar comunicado aprovado pela Comunicação Interna.',
      causa: 'Publicação de comunicado',
      prioridades: P3_P4,
      peso: 2,
    },
    {
      tipo: 'evolutiva',
      titulo: 'Evolutiva: assinatura eletrônica do aviso de férias',
      descricao: 'Colaborador assina o aviso de férias pelo Portal.',
      causa: 'Assinatura de férias',
      prioridades: EVOLUTIVA,
      peso: 1,
      requisito: 'Assinatura com validade jurídica e trilha de auditoria; aviso no celular.',
      impacto: 'Elimina papel nas unidades; exige integração com a Folha para o cálculo de férias.',
    },
  ],
  recrutamento: [
    {
      tipo: 'incidente',
      titulo: 'Vaga de {vaga} não publicada no portal de carreiras',
      descricao: 'Vaga aprovada não aparece para candidatos externos.',
      causa: 'Publicação de vaga',
      prioridades: P2_P3,
      peso: 2,
    },
    {
      tipo: 'incidente',
      titulo: 'Erro ao anexar currículo na vaga de {vaga}',
      descricao: 'Candidatos recebem erro ao enviar arquivo PDF.',
      causa: 'Anexo de currículo',
      prioridades: P2_P3,
      peso: 2,
    },
    {
      tipo: 'requisicao',
      titulo: 'Criar etapa de teste técnico no processo de {vaga}',
      descricao: 'Incluir etapa de avaliação técnica antes da entrevista final.',
      causa: 'Configuração de processo seletivo',
      prioridades: P3_P4,
      peso: 2,
    },
    {
      tipo: 'evolutiva',
      titulo: 'Evolutiva: triagem automática por requisito de CNH',
      descricao: 'Filtrar candidatos de vagas operacionais pela categoria de CNH.',
      causa: 'Triagem por CNH',
      prioridades: EVOLUTIVA,
      peso: 1,
      requisito: 'Campo obrigatório de CNH e filtro automático por categoria exigida na vaga.',
      impacto: 'Reduz triagem manual em vagas de operação; altera o formulário de candidatura.',
    },
    {
      tipo: 'evolutiva',
      titulo: 'Evolutiva: integração com agendamento de exame admissional',
      descricao: 'Agendar exame admissional direto do processo seletivo.',
      causa: 'Exame admissional',
      prioridades: EVOLUTIVA,
      peso: 1,
      requisito: 'Integração com a clínica credenciada e retorno do resultado ao processo.',
      impacto: 'Encurta o tempo de admissão; depende da API da clínica parceira.',
    },
    {
      tipo: 'evolutiva',
      titulo: 'Evolutiva: painel de diversidade nos processos seletivos',
      descricao: 'Indicadores de diversidade por etapa do funil de seleção.',
      causa: 'Painel de diversidade',
      prioridades: EVOLUTIVA,
      peso: 1,
      requisito: 'Dados autodeclarados, anonimizados, agregados por etapa e por vaga.',
      impacto: 'Exige revisão de LGPD; sem impacto nos processos em andamento.',
    },
  ],
  treinamentos: [
    {
      tipo: 'incidente',
      titulo: 'Certificado de treinamento de segurança não registrado no histórico',
      descricao: 'Treinamento de {nr} concluído, mas sem registro no histórico do colaborador.',
      causa: 'Registro de certificado',
      prioridades: P2_P3,
      peso: 3,
      contorno: 'registro manual do certificado',
    },
    {
      tipo: 'incidente',
      titulo: '{nr} vencida não aparece no alerta do gestor',
      descricao: 'Alerta de reciclagem não disparado para colaboradores com {nr} vencida.',
      causa: 'Alerta de vencimento de NR',
      prioridades: P2_P3,
      peso: 2,
    },
    {
      tipo: 'requisicao',
      titulo: 'Cadastrar turma de reciclagem de {nr} em {unidade}',
      descricao: 'Abrir turma presencial com instrutor credenciado.',
      causa: 'Cadastro de turma',
      prioridades: P3_P4,
      peso: 3,
    },
    {
      tipo: 'evolutiva',
      titulo: 'Evolutiva: trilha de integração para novos maquinistas',
      descricao: 'Trilha obrigatória com etapas teóricas e práticas.',
      causa: 'Trilha de integração',
      prioridades: EVOLUTIVA,
      peso: 1,
      requisito: 'Etapas sequenciais, liberação pelo instrutor e certificado ao final.',
      impacto: 'Afeta a habilitação para operar; exige validação da área de Segurança.',
    },
    {
      tipo: 'evolutiva',
      titulo: 'Evolutiva: aplicativo offline para treinamentos em campo',
      descricao: 'Registrar presença em treinamentos sem conexão nas unidades remotas.',
      causa: 'Treinamento offline',
      prioridades: EVOLUTIVA,
      peso: 1,
      requisito: 'Registro offline com sincronização posterior e assinatura do instrutor.',
      impacto: 'Reduz certificados não registrados; exige dispositivos nas unidades.',
    },
  ],
}
