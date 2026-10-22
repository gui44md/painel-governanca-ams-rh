import { AGRUPAMENTO_NA_FRASE, GRADE_DASHBOARD, INDICADORES_WIDGET, TIPOS_WIDGET } from '@/config/dashboards'
import type { Dashboard, PosicaoWidget, TipoWidget, Widget } from '@/tipos/dashboard'
import { proximoId } from '../identificadores'

/** Título sugerido a partir da configuração: "SLA cumprido por mês". */
export function tituloAutomatico(widget: Pick<Widget, 'tipo' | 'indicador' | 'agrupamento'>): string {
  const tipo = TIPOS_WIDGET[widget.tipo]
  if (!tipo.usaIndicador) return 'Observações'
  const indicador = INDICADORES_WIDGET[widget.indicador].rotulo
  return tipo.usaAgrupamento ? `${indicador} por ${AGRUPAMENTO_NA_FRASE[widget.agrupamento]}` : indicador
}

/**
 * Mantém o widget coerente com o tipo: rosca só aceita contagens, medidor só
 * escalas fechadas. Se o título era automático, acompanha a mudança.
 */
export function normalizarWidget(widget: Widget, anterior?: Widget): Widget {
  const tipo = TIPOS_WIDGET[widget.tipo]
  const indicador = tipo.indicadores.length && !tipo.indicadores.includes(widget.indicador) ? tipo.indicadores[0]! : widget.indicador
  const mudouIndicador = anterior && anterior.indicador !== indicador
  const meta = !tipo.usaMeta ? null : mudouIndicador ? INDICADORES_WIDGET[indicador].metaPadrao : widget.meta
  const normalizado = { ...widget, indicador, meta }
  // O título só acompanha a configuração se ainda for o automático e o usuário não o editou agora.
  const editouTitulo = anterior !== undefined && widget.titulo !== anterior.titulo
  const tituloEraAutomatico =
    !widget.titulo.trim() || !anterior || (!editouTitulo && anterior.titulo === tituloAutomatico(anterior))
  return tituloEraAutomatico && tipo.usaIndicador ? { ...normalizado, titulo: tituloAutomatico(normalizado) } : normalizado
}

export function novoWidget(tipo: TipoWidget, id: string, parcial: Partial<Widget> = {}): Widget {
  const definicao = TIPOS_WIDGET[tipo]
  const indicador = parcial.indicador ?? definicao.indicadores[0] ?? 'sla'
  const base: Widget = {
    id,
    tipo,
    titulo: '',
    indicador,
    agrupamento: definicao.agrupamentoPadrao,
    filtro: { periodo: null, sistemaId: null, fornecedorId: null },
    meta: definicao.usaMeta && tipo !== 'kpi' ? INDICADORES_WIDGET[indicador].metaPadrao : null,
    texto: tipo === 'texto' ? 'Escreva aqui a pauta ou as observações da reunião.' : '',
    ...parcial,
  }
  return normalizarWidget(base)
}

/** Linha logo abaixo do último widget. */
export function proximaLinhaLivre(layout: readonly PosicaoWidget[]): number {
  return layout.reduce((max, p) => Math.max(max, p.y + p.h), 0)
}

const proximoIdWidget = (dashboard: Dashboard) => proximoId('w', dashboard.widgets.map((w) => w.id))

export function adicionarWidget(
  dashboard: Dashboard,
  tipo: TipoWidget,
  agora: Date,
  posicao?: { x: number; y: number },
): { dashboard: Dashboard; widgetId: string } {
  const id = proximoIdWidget(dashboard)
  const { w, h } = TIPOS_WIDGET[tipo].tamanho
  const x = Math.min(posicao?.x ?? 0, GRADE_DASHBOARD.colunas - w)
  const y = posicao?.y ?? proximaLinhaLivre(dashboard.layout)
  return {
    widgetId: id,
    dashboard: {
      ...dashboard,
      widgets: [...dashboard.widgets, novoWidget(tipo, id)],
      layout: [...dashboard.layout, { i: id, x, y, w, h }],
      atualizadoEm: agora,
    },
  }
}

export function duplicarWidget(dashboard: Dashboard, widgetId: string, agora: Date): { dashboard: Dashboard; widgetId: string } {
  const original = dashboard.widgets.find((w) => w.id === widgetId)
  const posicao = dashboard.layout.find((p) => p.i === widgetId)
  if (!original || !posicao) return { dashboard, widgetId }
  const id = proximoIdWidget(dashboard)
  return {
    widgetId: id,
    dashboard: {
      ...dashboard,
      widgets: [...dashboard.widgets, { ...structuredClone(original), id, titulo: `${original.titulo} (cópia)` }],
      layout: [...dashboard.layout, { ...posicao, i: id, y: proximaLinhaLivre(dashboard.layout) }],
      atualizadoEm: agora,
    },
  }
}

export function removerWidget(dashboard: Dashboard, widgetId: string, agora: Date): Dashboard {
  return {
    ...dashboard,
    widgets: dashboard.widgets.filter((w) => w.id !== widgetId),
    layout: dashboard.layout.filter((p) => p.i !== widgetId),
    atualizadoEm: agora,
  }
}

export function atualizarWidget(dashboard: Dashboard, widgetId: string, alteracao: Partial<Widget>, agora: Date): Dashboard {
  return {
    ...dashboard,
    widgets: dashboard.widgets.map((w) => (w.id === widgetId ? normalizarWidget({ ...w, ...alteracao, id: w.id }, w) : w)),
    atualizadoEm: agora,
  }
}

/** Aplica posições vindas da grade, ignorando itens desconhecidos e respeitando os tamanhos mínimos. */
export function atualizarLayout(dashboard: Dashboard, layout: readonly PosicaoWidget[], agora: Date): Dashboard {
  const tipos = new Map(dashboard.widgets.map((w) => [w.id, w.tipo]))
  const novo = layout.flatMap(({ i, x, y, w, h }) => {
    const tipo = tipos.get(i)
    if (!tipo) return []
    const { minimo } = TIPOS_WIDGET[tipo]
    return [{ i, x, y, w: Math.max(w, minimo.w), h: Math.max(h, minimo.h) }]
  })
  return { ...dashboard, layout: novo, atualizadoEm: agora }
}

/** Ordem de leitura (de cima para baixo, da esquerda para a direita), para telas estreitas. */
export function widgetsEmOrdem(dashboard: Dashboard): { widget: Widget; posicao: PosicaoWidget }[] {
  const posicoes = new Map(dashboard.layout.map((p) => [p.i, p]))
  return dashboard.widgets
    .flatMap((widget) => {
      const posicao = posicoes.get(widget.id)
      return posicao ? [{ widget, posicao }] : []
    })
    .toSorted((a, b) => a.posicao.y - b.posicao.y || a.posicao.x - b.posicao.x)
}

export const TAMANHO_MAXIMO_NOME = 60

export function validarNomeDashboard(nome: string): string | null {
  const limpo = nome.trim()
  if (limpo.length < 3) return 'Dê um nome com pelo menos 3 caracteres.'
  if (limpo.length > TAMANHO_MAXIMO_NOME) return `Use no máximo ${TAMANHO_MAXIMO_NOME} caracteres.`
  return null
}
