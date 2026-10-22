import type { FornecedorId } from '@/tipos/catalogo'
import type { Dashboard, PosicaoWidget, TipoWidget, Widget } from '@/tipos/dashboard'
import { novoWidget } from './operacoes'

/** Modelos prontos (CONCEITO.md, seção 7): o usuário começa de um deles e ajusta. */
export type IdModelo = 'reuniao-fornecedor' | 'visao-executiva' | 'fechamento-folha'

export interface DefinicaoModelo {
  id: IdModelo
  nome: string
  descricao: string
  /** Pergunta qual fornecedor ao criar (modelo de reunião). */
  pedeFornecedor: boolean
}

export const MODELOS_DASHBOARD: readonly DefinicaoModelo[] = [
  {
    id: 'reuniao-fornecedor',
    nome: 'Reunião mensal com fornecedor',
    descricao: 'KPIs do fornecedor, SLA mês a mês, reincidência por sistema e pauta.',
    pedeFornecedor: true,
  },
  {
    id: 'visao-executiva',
    nome: 'Visão executiva para gestão',
    descricao: 'Medidor de SLA, comparação entre fornecedores e volume por sistema.',
    pedeFornecedor: false,
  },
  {
    id: 'fechamento-folha',
    nome: 'Acompanhamento de fechamento de folha',
    descricao: 'Folha de Pagamento: SLA, volume por prioridade e checklist.',
    pedeFornecedor: false,
  },
]

type Item = [tipo: TipoWidget, posicao: Omit<PosicaoWidget, 'i'>, widget?: Partial<Widget>]

function montar(itens: Item[]): Pick<Dashboard, 'widgets' | 'layout'> {
  const widgets = itens.map(([tipo, , parcial], i) => novoWidget(tipo, `w-${String(i + 1).padStart(3, '0')}`, parcial))
  return { widgets, layout: itens.map(([, posicao], i) => ({ i: widgets[i]!.id, ...posicao })) }
}

const SEM_FILTRO = { periodo: null, sistemaId: null, fornecedorId: null }

export function widgetsDoModelo(id: IdModelo, opcoes: { fornecedorId?: FornecedorId } = {}): Pick<Dashboard, 'widgets' | 'layout'> {
  switch (id) {
    case 'reuniao-fornecedor': {
      const filtro = { ...SEM_FILTRO, fornecedorId: opcoes.fornecedorId ?? 'beta' }
      return montar([
        ['kpi', { x: 0, y: 0, w: 3, h: 2 }, { indicador: 'sla', filtro, meta: 0.95 }],
        ['kpi', { x: 3, y: 0, w: 3, h: 2 }, { indicador: 'mttr', filtro }],
        ['kpi', { x: 6, y: 0, w: 3, h: 2 }, { indicador: 'reincidencia', filtro, meta: 0.1 }],
        ['kpi', { x: 9, y: 0, w: 3, h: 2 }, { indicador: 'satisfacao', filtro, meta: 4 }],
        ['linha', { x: 0, y: 2, w: 6, h: 4 }, { indicador: 'sla', agrupamento: 'mes', filtro }],
        ['barras', { x: 6, y: 2, w: 6, h: 4 }, { indicador: 'reincidencia', agrupamento: 'sistema', filtro, meta: 0.2 }],
        ['tabela', { x: 0, y: 6, w: 6, h: 4 }, { indicador: 'volume', agrupamento: 'prioridade', filtro }],
        [
          'texto',
          { x: 6, y: 6, w: 6, h: 4 },
          {
            titulo: 'Pauta da reunião',
            texto:
              '1. Resultado de SLA do mês\n2. Reincidência: causa raiz e plano de correção definitiva\n3. Evolutivas em andamento\n4. Ações acordadas e responsáveis',
          },
        ],
      ])
    }
    case 'visao-executiva':
      return montar([
        ['medidor', { x: 0, y: 0, w: 3, h: 4 }, { indicador: 'sla', meta: 0.95 }],
        ['kpi', { x: 3, y: 0, w: 3, h: 2 }, { indicador: 'volume' }],
        ['kpi', { x: 6, y: 0, w: 3, h: 2 }, { indicador: 'reincidencia', meta: 0.1 }],
        ['kpi', { x: 9, y: 0, w: 3, h: 2 }, { indicador: 'satisfacao', meta: 4 }],
        ['kpi', { x: 3, y: 2, w: 3, h: 2 }, { indicador: 'mttr' }],
        ['kpi', { x: 6, y: 2, w: 3, h: 2 }, { indicador: 'backlog' }],
        ['kpi', { x: 9, y: 2, w: 3, h: 2 }, { indicador: 'sla', titulo: 'SLA do mês', filtro: { ...SEM_FILTRO, periodo: 'mes:2026-10' }, meta: 0.95 }],
        ['barras', { x: 0, y: 4, w: 6, h: 4 }, { indicador: 'sla', agrupamento: 'fornecedor', meta: 0.95 }],
        ['rosca', { x: 6, y: 4, w: 6, h: 4 }, { indicador: 'volume', agrupamento: 'fornecedor' }],
        ['linha', { x: 0, y: 8, w: 12, h: 4 }, { indicador: 'volume', agrupamento: 'mes' }],
      ])
    case 'fechamento-folha': {
      const filtro = { ...SEM_FILTRO, sistemaId: 'folha' as const }
      return montar([
        ['kpi', { x: 0, y: 0, w: 3, h: 2 }, { indicador: 'sla', filtro, meta: 0.95 }],
        ['kpi', { x: 3, y: 0, w: 3, h: 2 }, { indicador: 'volume', titulo: 'Chamados de Folha no mês', filtro: { ...filtro, periodo: 'mes:2026-10' } }],
        ['kpi', { x: 6, y: 0, w: 3, h: 2 }, { indicador: 'mttr', filtro }],
        ['kpi', { x: 9, y: 0, w: 3, h: 2 }, { indicador: 'satisfacao', filtro, meta: 4 }],
        ['linha', { x: 0, y: 2, w: 8, h: 4 }, { indicador: 'sla', agrupamento: 'mes', filtro }],
        ['rosca', { x: 8, y: 2, w: 4, h: 4 }, { indicador: 'volume', agrupamento: 'prioridade', filtro }],
        ['barras', { x: 0, y: 6, w: 6, h: 4 }, { indicador: 'volume', agrupamento: 'mes', filtro }],
        [
          'texto',
          { x: 6, y: 6, w: 6, h: 4 },
          {
            titulo: 'Checklist do fechamento',
            texto:
              '• Chamados P1 e P2 de Folha resolvidos\n• Rubricas novas homologadas\n• Folha complementar processada\n• Alfa com equipe reforçada até o fechamento',
          },
        ],
      ])
    }
  }
}
