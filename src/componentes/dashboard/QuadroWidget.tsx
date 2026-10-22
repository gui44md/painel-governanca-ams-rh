import { Copy, GripVertical, Settings2, Trash2 } from 'lucide-react'
import { TIPOS_WIDGET } from '@/config/dashboards'
import { useDadosWidget } from '@/hooks/useDadosWidget'
import { cx } from '@/lib/classes'
import type { Widget } from '@/tipos/dashboard'
import { ConteudoWidget } from './ConteudoWidget'

/** Classe da alça: só ela inicia o arraste, para os botões e gráficos continuarem clicáveis. */
export const CLASSE_ALCA_ARRASTE = 'alca-arraste-widget'

interface QuadroWidgetProps {
  widget: Widget
  editavel: boolean
  /** Na pré-visualização da configuração, a região ganha outro nome para não duplicar a da grade. */
  previa?: boolean
  selecionado?: boolean
  aoConfigurar?: () => void
  aoDuplicar?: () => void
  aoExcluir?: () => void
}

function BotaoFerramenta({ rotulo, icone: Icone, aoClicar, perigo }: { rotulo: string; icone: typeof Copy; aoClicar?: () => void; perigo?: boolean }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      title={rotulo}
      aria-label={rotulo}
      className={cx(
        'rounded-md p-1.5 text-texto-suave transition-colors hover:bg-fundo',
        perigo ? 'hover:text-estourado-texto' : 'hover:text-primaria',
      )}
    >
      <Icone aria-hidden className="size-4" />
    </button>
  )
}

/** Moldura do widget: título, recorte, ferramentas de edição e o conteúdo. */
export function QuadroWidget({ widget, editavel, previa = false, selecionado = false, aoConfigurar, aoDuplicar, aoExcluir }: QuadroWidgetProps) {
  const dados = useDadosWidget(widget)
  const semDados = widget.tipo !== 'texto' && dados.base === 0
  const { usaIndicador } = TIPOS_WIDGET[widget.tipo]

  return (
    <section
      aria-label={previa ? `Pré-visualização: ${widget.titulo}` : widget.titulo}
      className={cx(
        'group flex h-full flex-col overflow-hidden rounded-xl bg-superficie shadow-sm ring-1 transition-shadow',
        selecionado ? 'ring-2 ring-primaria' : 'ring-borda',
      )}
    >
      <div aria-hidden className="trilho shrink-0" />
      <header className="relative flex items-start gap-1 px-3 pt-2">
        {editavel && (
          <span
            data-sem-exportar
            className={cx(CLASSE_ALCA_ARRASTE, '-ml-1 mt-0.5 cursor-grab rounded p-0.5 text-texto-suave hover:bg-fundo active:cursor-grabbing')}
            title="Arraste para mover"
          >
            <GripVertical aria-hidden className="size-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-primaria">{widget.titulo}</h3>
          {usaIndicador && <p className="truncate text-xs text-texto-suave">{dados.recorte}</p>}
        </div>
        {editavel && (
          <div
            data-sem-exportar
            className={cx(
              // Flutua sobre o canto do título para não roubar espaço dele.
              'absolute top-1 right-1 flex rounded-md bg-superficie/95 shadow-sm ring-1 ring-borda transition-opacity',
              'group-focus-within:opacity-100 group-hover:opacity-100',
              // Com mouse, as ferramentas aparecem ao passar sobre o widget; em telas de toque, sempre.
              !selecionado && '[@media(hover:hover)]:opacity-0',
            )}
          >
            <BotaoFerramenta rotulo="Configurar widget" icone={Settings2} aoClicar={aoConfigurar} />
            <BotaoFerramenta rotulo="Duplicar widget" icone={Copy} aoClicar={aoDuplicar} />
            <BotaoFerramenta rotulo="Excluir widget" icone={Trash2} aoClicar={aoExcluir} perigo />
          </div>
        )}
      </header>
      <div className="min-h-0 flex-1 px-3 pt-1 pb-3">
        {semDados ? (
          <p className="flex h-full items-center justify-center text-center text-xs text-texto-suave">Sem chamados neste recorte.</p>
        ) : (
          <ConteudoWidget widget={widget} dados={dados} />
        )}
      </div>
    </section>
  )
}
