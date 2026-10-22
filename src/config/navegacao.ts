import {
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Ticket,
  type LucideIcon,
} from 'lucide-react'

export interface SecaoNavegacao {
  caminho: string
  rotulo: string
  /** Frase curta exibida como dica no menu e no cabeçalho da página. */
  descricao: string
  icone: LucideIcon
  /** Fase do roteiro (CONCEITO.md, seção 14) em que a tela é entregue. */
  fase: number
}

/** As 7 seções do menu lateral (CONCEITO.md, seção 6). */
export const SECOES: readonly SecaoNavegacao[] = [
  {
    caminho: '/',
    rotulo: 'Visão geral',
    descricao: 'KPIs, tendência de SLA e insights da operação',
    icone: LayoutDashboard,
    fase: 3,
  },
  {
    caminho: '/chamados',
    rotulo: 'Chamados',
    descricao: 'Incidentes, requisições e evolutivas com prazo de SLA',
    icone: Ticket,
    fase: 3,
  },
  {
    caminho: '/fornecedores',
    rotulo: 'Fornecedores',
    descricao: 'Comparativo de desempenho dos fornecedores de AMS',
    icone: Building2,
    fase: 3,
  },
  {
    caminho: '/plano-de-acao',
    rotulo: 'Plano de ação',
    descricao: 'Ações, responsáveis e registro de reuniões',
    icone: ListChecks,
    fase: 4,
  },
  {
    caminho: '/homologacao',
    rotulo: 'Homologação',
    descricao: 'Roteiros de teste e liberação para produção',
    icone: ClipboardCheck,
    fase: 4,
  },
  {
    caminho: '/construtor',
    rotulo: 'Construtor de dashboards',
    descricao: 'Monte painéis próprios arrastando widgets',
    icone: LayoutGrid,
    fase: 6,
  },
  {
    caminho: '/excel',
    rotulo: 'Importar / Exportar Excel',
    descricao: 'Planilhas de chamados e relatório mensal de SLA',
    icone: FileSpreadsheet,
    fase: 5,
  },
]

export function secaoPorCaminho(caminho: string): SecaoNavegacao | undefined {
  return SECOES.find((secao) => secao.caminho === caminho)
}
