import { useMemo } from 'react'
import { GridLayout, type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import { MousePointerClick } from 'lucide-react'
import { GRADE_DASHBOARD, TIPOS_WIDGET } from '@/config/dashboards'
import { useLarguraElemento } from '@/hooks/useLarguraElemento'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { widgetsEmOrdem } from '@/lib/dashboard/operacoes'
import type { Dashboard, PosicaoWidget, TipoWidget } from '@/tipos/dashboard'
import { CLASSE_ALCA_ARRASTE, QuadroWidget } from './QuadroWidget'

const ID_SOLTANDO = '__novo-widget__'

interface GradeDashboardProps {
  dashboard: Dashboard
  editavel: boolean
  selecionadoId?: string | null
  /** Tipo sendo arrastado da galeria (define o tamanho do espaço reservado). */
  tipoArrastado?: TipoWidget | null
  aoConfigurar?: (widgetId: string) => void
  aoDuplicar?: (widgetId: string) => void
  aoExcluir?: (widgetId: string) => void
  aoMudarLayout?: (layout: PosicaoWidget[]) => void
  aoSoltar?: (posicao: { x: number; y: number }) => void
}

const paraPosicoes = (layout: Layout): PosicaoWidget[] =>
  layout.filter((item) => item.i !== ID_SOLTANDO).map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))

/**
 * Grade de 12 colunas (react-grid-layout): mover pela alça, redimensionar pelo
 * canto e soltar widgets vindos da galeria. Em telas estreitas os widgets são
 * empilhados na ordem de leitura.
 */
export function GradeDashboard({
  dashboard,
  editavel,
  selecionadoId,
  tipoArrastado,
  aoConfigurar,
  aoDuplicar,
  aoExcluir,
  aoMudarLayout,
  aoSoltar,
}: GradeDashboardProps) {
  const [containerRef, width] = useLarguraElemento<HTMLDivElement>()
  // Empilha pela largura da tela (celular), não da coluna: abrir a configuração não desliga a grade.
  const estreita = !useMediaQuery(`(min-width: ${GRADE_DASHBOARD.larguraMinimaEdicao}px)`)
  const tamanhoSoltando = TIPOS_WIDGET[tipoArrastado ?? 'kpi'].tamanho

  const layout = useMemo<Layout>(() => {
    const tipos = new Map(dashboard.widgets.map((w) => [w.id, w.tipo]))
    return dashboard.layout.map((p) => {
      const minimo = TIPOS_WIDGET[tipos.get(p.i) ?? 'kpi'].minimo
      return { ...p, minW: minimo.w, minH: minimo.h }
    })
  }, [dashboard.layout, dashboard.widgets])

  const quadro = (widgetId: string) => {
    const widget = dashboard.widgets.find((w) => w.id === widgetId)
    if (!widget) return null
    return (
      <QuadroWidget
        widget={widget}
        editavel={editavel}
        selecionado={selecionadoId === widget.id}
        aoConfigurar={() => aoConfigurar?.(widget.id)}
        aoDuplicar={() => aoDuplicar?.(widget.id)}
        aoExcluir={() => aoExcluir?.(widget.id)}
      />
    )
  }

  const vazio = dashboard.widgets.length === 0

  return (
    <div ref={containerRef} className="relative min-h-80 w-full">
      <h2 className="sr-only">Widgets do dashboard</h2>
      {vazio && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-borda p-6 text-center text-sm text-texto-suave">
          <MousePointerClick aria-hidden className="size-8" />
          {editavel ? 'Arraste um widget da galeria para cá, ou clique em + na galeria.' : 'Este dashboard ainda não tem widgets.'}
        </div>
      )}
      {estreita ? (
        <div className="flex flex-col gap-4">
          {widgetsEmOrdem(dashboard).map(({ widget, posicao }) => (
            <div key={widget.id} style={{ height: Math.max(posicao.h, 3) * GRADE_DASHBOARD.alturaLinha }}>
              {quadro(widget.id)}
            </div>
          ))}
        </div>
      ) : (
        width > 0 && (
          <GridLayout
            width={width}
            layout={layout}
            style={{ minHeight: vazio ? 320 : undefined }}
            gridConfig={{
              cols: GRADE_DASHBOARD.colunas,
              rowHeight: GRADE_DASHBOARD.alturaLinha,
              margin: GRADE_DASHBOARD.margem,
              containerPadding: [0, 0],
            }}
            dragConfig={{ enabled: editavel, handle: `.${CLASSE_ALCA_ARRASTE}` }}
            resizeConfig={{ enabled: editavel }}
            dropConfig={{ enabled: editavel, defaultItem: tamanhoSoltando, onDragOver: () => tamanhoSoltando }}
            droppingItem={{ i: ID_SOLTANDO, x: 0, y: 0, ...tamanhoSoltando }}
            onDragStop={(novo) => aoMudarLayout?.(paraPosicoes(novo))}
            onResizeStop={(novo) => aoMudarLayout?.(paraPosicoes(novo))}
            onDrop={(_, item) => item && aoSoltar?.({ x: item.x, y: item.y })}
          >
            {dashboard.layout.map((p) => (
              <div key={p.i}>{quadro(p.i)}</div>
            ))}
          </GridLayout>
        )
      )}
    </div>
  )
}
