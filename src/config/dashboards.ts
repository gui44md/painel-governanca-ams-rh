import {
  ChartColumn,
  ChartLine,
  ChartPie,
  Gauge,
  Hash,
  Table2,
  Type,
  type LucideIcon,
} from 'lucide-react'
import type { AgrupamentoWidget, IndicadorWidget, TipoWidget } from '@/tipos/dashboard'

export interface DefinicaoTipoWidget {
  rotulo: string
  descricao: string
  icone: LucideIcon
  /** Tamanho ao soltar na grade e tamanho mínimo, em colunas × linhas. */
  tamanho: { w: number; h: number }
  minimo: { w: number; h: number }
  usaIndicador: boolean
  usaAgrupamento: boolean
  usaMeta: boolean
  /** Indicadores que fazem sentido neste tipo (rosca só para valores que somam). */
  indicadores: readonly IndicadorWidget[]
  agrupamentoPadrao: AgrupamentoWidget
}

const TODOS_INDICADORES: readonly IndicadorWidget[] = ['sla', 'mttr', 'volume', 'reincidencia', 'satisfacao', 'backlog']

export const TIPOS_WIDGET: Record<TipoWidget, DefinicaoTipoWidget> = {
  kpi: {
    rotulo: 'Card de KPI',
    descricao: 'Um número grande',
    icone: Hash,
    tamanho: { w: 3, h: 2 },
    minimo: { w: 2, h: 2 },
    usaIndicador: true,
    usaAgrupamento: false,
    usaMeta: true,
    indicadores: TODOS_INDICADORES,
    agrupamentoPadrao: 'mes',
  },
  linha: {
    rotulo: 'Gráfico de linha',
    descricao: 'Evolução mês a mês',
    icone: ChartLine,
    tamanho: { w: 6, h: 4 },
    minimo: { w: 3, h: 3 },
    usaIndicador: true,
    usaAgrupamento: true,
    usaMeta: true,
    indicadores: TODOS_INDICADORES,
    agrupamentoPadrao: 'mes',
  },
  barras: {
    rotulo: 'Gráfico de barras',
    descricao: 'Comparar categorias',
    icone: ChartColumn,
    tamanho: { w: 6, h: 4 },
    minimo: { w: 3, h: 3 },
    usaIndicador: true,
    usaAgrupamento: true,
    usaMeta: true,
    indicadores: TODOS_INDICADORES,
    agrupamentoPadrao: 'sistema',
  },
  rosca: {
    rotulo: 'Pizza / rosca',
    descricao: 'Partes de um total',
    icone: ChartPie,
    tamanho: { w: 4, h: 4 },
    minimo: { w: 3, h: 3 },
    usaIndicador: true,
    usaAgrupamento: true,
    usaMeta: false,
    // Percentuais e médias não somam: em rosca, só contagens.
    indicadores: ['volume', 'backlog'],
    agrupamentoPadrao: 'fornecedor',
  },
  tabela: {
    rotulo: 'Tabela',
    descricao: 'Valores por categoria',
    icone: Table2,
    tamanho: { w: 6, h: 4 },
    minimo: { w: 3, h: 3 },
    usaIndicador: true,
    usaAgrupamento: true,
    usaMeta: true,
    indicadores: TODOS_INDICADORES,
    agrupamentoPadrao: 'fornecedor',
  },
  medidor: {
    rotulo: 'Medidor de meta',
    descricao: 'Valor contra a meta',
    icone: Gauge,
    tamanho: { w: 3, h: 4 },
    minimo: { w: 3, h: 3 },
    usaIndicador: true,
    usaAgrupamento: false,
    usaMeta: true,
    // Medidor precisa de escala fechada.
    indicadores: ['sla', 'reincidencia', 'satisfacao'],
    agrupamentoPadrao: 'mes',
  },
  texto: {
    rotulo: 'Cartão de texto',
    descricao: 'Pauta, observações',
    icone: Type,
    tamanho: { w: 4, h: 3 },
    minimo: { w: 2, h: 2 },
    usaIndicador: false,
    usaAgrupamento: false,
    usaMeta: false,
    indicadores: [],
    agrupamentoPadrao: 'mes',
  },
}

export type FormatoIndicador = 'percentual' | 'horas' | 'numero' | 'nota'

export interface DefinicaoIndicador {
  rotulo: string
  formato: FormatoIndicador
  melhorQuando: 'maior' | 'menor'
  /** Meta sugerida ao escolher o indicador. */
  metaPadrao: number | null
  /** Fim da escala, para o medidor (percentuais = 1; nota = 5). */
  escalaMaxima: number | null
  dica: string
}

export const INDICADORES_WIDGET: Record<IndicadorWidget, DefinicaoIndicador> = {
  sla: {
    rotulo: 'SLA cumprido',
    formato: 'percentual',
    melhorQuando: 'maior',
    metaPadrao: 0.95,
    escalaMaxima: 1,
    dica: 'Resolvidos no prazo ÷ resolvidos',
  },
  mttr: {
    rotulo: 'MTTR',
    formato: 'horas',
    melhorQuando: 'menor',
    metaPadrao: null,
    escalaMaxima: null,
    dica: 'Tempo médio de resolução, em horas',
  },
  volume: {
    rotulo: 'Volume de chamados',
    formato: 'numero',
    melhorQuando: 'menor',
    metaPadrao: null,
    escalaMaxima: null,
    dica: 'Chamados abertos no período',
  },
  reincidencia: {
    rotulo: 'Reincidência',
    formato: 'percentual',
    melhorQuando: 'menor',
    metaPadrao: 0.1,
    escalaMaxima: 1,
    dica: 'Reabertos ou repetidos em até 15 dias',
  },
  satisfacao: {
    rotulo: 'Satisfação',
    formato: 'nota',
    melhorQuando: 'maior',
    metaPadrao: 4,
    escalaMaxima: 5,
    dica: 'Média das notas de 1 a 5',
  },
  backlog: {
    rotulo: 'Backlog de evolutivas',
    formato: 'numero',
    melhorQuando: 'menor',
    metaPadrao: null,
    escalaMaxima: null,
    dica: 'Evolutivas não entregues',
  },
}

export const ROTULOS_AGRUPAMENTO: Record<AgrupamentoWidget, string> = {
  mes: 'Mês',
  sistema: 'Sistema de RH',
  fornecedor: 'Fornecedor',
  prioridade: 'Prioridade',
  tipo: 'Tipo de chamado',
}

/** Mesmos agrupamentos para usar no meio de frases: "SLA cumprido por sistema de RH". */
export const AGRUPAMENTO_NA_FRASE: Record<AgrupamentoWidget, string> = {
  mes: 'mês',
  sistema: 'sistema de RH',
  fornecedor: 'fornecedor',
  prioridade: 'prioridade',
  tipo: 'tipo de chamado',
}

/** Grade do construtor: 12 colunas, linhas de 64 px. */
export const GRADE_DASHBOARD = {
  colunas: 12,
  alturaLinha: 64,
  margem: [16, 16] as const,
  /** Abaixo desta largura, os widgets são empilhados (sem arrastar). */
  larguraMinimaEdicao: 768,
}
