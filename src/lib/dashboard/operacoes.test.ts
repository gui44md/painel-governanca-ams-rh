import { describe, expect, it } from 'vitest'
import { TIPOS_WIDGET } from '@/config/dashboards'
import type { Dashboard } from '@/tipos/dashboard'
import { MODELOS_DASHBOARD, widgetsDoModelo } from './modelos'
import {
  adicionarWidget,
  atualizarLayout,
  atualizarWidget,
  duplicarWidget,
  novoWidget,
  proximaLinhaLivre,
  removerWidget,
  tituloAutomatico,
  validarNomeDashboard,
  widgetsEmOrdem,
} from './operacoes'

const AGORA = new Date(2026, 9, 27, 17)
const vazio: Dashboard = {
  id: 'DSH-001',
  nome: 'Teste',
  widgets: [],
  layout: [],
  criadoEm: AGORA,
  atualizadoEm: AGORA,
  modeloId: null,
}

describe('widgets', () => {
  it('novo widget recebe padrões coerentes com o tipo', () => {
    expect(novoWidget('linha', 'w-1')).toMatchObject({ indicador: 'sla', agrupamento: 'mes', meta: 0.95, titulo: 'SLA cumprido por mês' })
    expect(novoWidget('rosca', 'w-2')).toMatchObject({ indicador: 'volume', meta: null, titulo: 'Volume de chamados por fornecedor' })
    expect(novoWidget('kpi', 'w-3')).toMatchObject({ meta: null, titulo: 'SLA cumprido' })
  })

  it('título automático acompanha a configuração', () => {
    expect(tituloAutomatico({ tipo: 'barras', indicador: 'reincidencia', agrupamento: 'sistema' })).toBe('Reincidência por sistema de RH')
    expect(tituloAutomatico({ tipo: 'texto', indicador: 'sla', agrupamento: 'mes' })).toBe('Observações')
  })
})

describe('operações no dashboard', () => {
  it('adiciona no ponto em que foi solto, ou abaixo do último', () => {
    const { dashboard, widgetId } = adicionarWidget(vazio, 'barras', AGORA, { x: 9, y: 2 })
    expect(widgetId).toBe('w-001')
    // Barras têm 6 colunas: x é ajustado para caber nas 12.
    expect(dashboard.layout[0]).toEqual({ i: 'w-001', x: 6, y: 2, w: 6, h: 4 })
    const segundo = adicionarWidget(dashboard, 'kpi', AGORA)
    expect(segundo.dashboard.layout[1]).toMatchObject({ i: 'w-002', x: 0, y: 6 })
    expect(proximaLinhaLivre(segundo.dashboard.layout)).toBe(8)
  })

  it('duplica com a mesma configuração, abaixo de tudo', () => {
    const base = adicionarWidget(vazio, 'linha', AGORA).dashboard
    const { dashboard, widgetId } = duplicarWidget(base, 'w-001', AGORA)
    expect(widgetId).toBe('w-002')
    expect(dashboard.widgets[1]).toMatchObject({ indicador: 'sla', agrupamento: 'mes', titulo: 'SLA cumprido por mês (cópia)' })
    expect(dashboard.layout[1]).toMatchObject({ y: 4, w: 6, h: 4 })
  })

  it('remove widget e posição', () => {
    const base = adicionarWidget(vazio, 'kpi', AGORA).dashboard
    expect(removerWidget(base, 'w-001', AGORA)).toMatchObject({ widgets: [], layout: [] })
  })

  it('rosca não aceita percentual e medidor não aceita MTTR', () => {
    const base = adicionarWidget(vazio, 'linha', AGORA).dashboard
    const rosca = atualizarWidget(base, 'w-001', { tipo: 'rosca' }, AGORA).widgets[0]!
    expect(rosca).toMatchObject({ tipo: 'rosca', indicador: 'volume', meta: null })
    const medidor = atualizarWidget(base, 'w-001', { tipo: 'medidor', indicador: 'mttr' }, AGORA).widgets[0]!
    expect(medidor.indicador).toBe('sla')
  })

  it('trocar o indicador atualiza título automático e meta padrão, mas preserva título editado', () => {
    const base = adicionarWidget(vazio, 'linha', AGORA).dashboard
    const trocado = atualizarWidget(base, 'w-001', { indicador: 'satisfacao' }, AGORA).widgets[0]!
    expect(trocado).toMatchObject({ titulo: 'Satisfação por mês', meta: 4 })
    const editado = atualizarWidget(base, 'w-001', { titulo: 'Meu gráfico' }, AGORA)
    expect(atualizarWidget(editado, 'w-001', { indicador: 'mttr' }, AGORA).widgets[0]!.titulo).toBe('Meu gráfico')
  })

  it('layout respeita tamanho mínimo e ignora itens desconhecidos', () => {
    const base = adicionarWidget(vazio, 'linha', AGORA).dashboard
    const novo = atualizarLayout(base, [{ i: 'w-001', x: 1, y: 0, w: 1, h: 1 }, { i: 'fantasma', x: 0, y: 0, w: 2, h: 2 }], AGORA)
    expect(novo.layout).toEqual([{ i: 'w-001', x: 1, y: 0, w: TIPOS_WIDGET.linha.minimo.w, h: TIPOS_WIDGET.linha.minimo.h }])
  })

  it('ordena para leitura em telas estreitas', () => {
    let d = vazio
    d = adicionarWidget(d, 'kpi', AGORA, { x: 6, y: 0 }).dashboard
    d = adicionarWidget(d, 'kpi', AGORA, { x: 0, y: 0 }).dashboard
    d = adicionarWidget(d, 'linha', AGORA, { x: 0, y: 2 }).dashboard
    expect(widgetsEmOrdem(d).map((item) => item.widget.id)).toEqual(['w-002', 'w-001', 'w-003'])
  })

  it('valida o nome', () => {
    expect(validarNomeDashboard('  ')).not.toBeNull()
    expect(validarNomeDashboard('Reunião com Beta')).toBeNull()
  })
})

describe('modelos', () => {
  it.each(MODELOS_DASHBOARD.map((m) => m.id))('o modelo %s gera layout válido e sem sobreposição', (id) => {
    const { widgets, layout } = widgetsDoModelo(id)
    expect(layout.map((p) => p.i)).toEqual(widgets.map((w) => w.id))
    for (const p of layout) expect(p.x + p.w).toBeLessThanOrEqual(12)
    for (let a = 0; a < layout.length; a++) {
      for (let b = a + 1; b < layout.length; b++) {
        const [p, q] = [layout[a]!, layout[b]!]
        const sobrepoe = p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h
        expect(sobrepoe, `${p.i} × ${q.i}`).toBe(false)
      }
    }
  })

  it('o modelo de reunião usa o fornecedor escolhido', () => {
    const { widgets } = widgetsDoModelo('reuniao-fornecedor', { fornecedorId: 'gama' })
    const comIndicador = widgets.filter((w) => w.tipo !== 'texto')
    expect(comIndicador.every((w) => w.filtro.fornecedorId === 'gama')).toBe(true)
  })
})
