import { Plus } from 'lucide-react'
import { TIPOS_WIDGET } from '@/config/dashboards'
import type { TipoWidget } from '@/tipos/dashboard'

const TIPOS = Object.keys(TIPOS_WIDGET) as TipoWidget[]

/** Formato do dado arrastado da galeria para a grade. */
export const FORMATO_ARRASTE = 'application/x-painel-widget'

interface GaleriaWidgetsProps {
  /** Avisa a grade qual tipo está sendo arrastado (para o tamanho do espaço reservado). */
  aoIniciarArraste: (tipo: TipoWidget) => void
  /** Alternativa ao arraste (teclado, toque): adiciona no fim do dashboard. */
  aoAdicionar: (tipo: TipoWidget) => void
}

/** Galeria de widgets (CONCEITO.md, seção 7): arraste para a grade ou clique para adicionar. */
export function GaleriaWidgets({ aoIniciarArraste, aoAdicionar }: GaleriaWidgetsProps) {
  return (
    <section aria-labelledby="titulo-galeria" className="flex flex-col gap-2">
      <h2 id="titulo-galeria" className="text-xs font-semibold tracking-wide text-texto-suave uppercase">
        Galeria de widgets
      </h2>
      <p className="text-xs text-texto-suave">Arraste para a grade ou clique em +.</p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-1">
        {TIPOS.map((tipo) => {
          const { rotulo, descricao, icone: Icone } = TIPOS_WIDGET[tipo]
          return (
            <li key={tipo}>
              <div
                draggable
                onDragStart={(evento) => {
                  evento.dataTransfer.setData(FORMATO_ARRASTE, tipo)
                  // Firefox só inicia o arraste com algum dado em texto.
                  evento.dataTransfer.setData('text/plain', rotulo)
                  evento.dataTransfer.effectAllowed = 'copy'
                  aoIniciarArraste(tipo)
                }}
                className="group flex cursor-grab items-center gap-2 rounded-lg bg-superficie p-2 ring-1 ring-borda transition-shadow hover:ring-primaria/40 active:cursor-grabbing"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primaria-clara text-primaria">
                  <Icone aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-texto">{rotulo}</span>
                  <span className="block truncate text-xs text-texto-suave">{descricao}</span>
                </span>
                <button
                  type="button"
                  onClick={() => aoAdicionar(tipo)}
                  aria-label={`Adicionar ${rotulo}`}
                  title={`Adicionar ${rotulo}`}
                  className="rounded-md p-1 text-texto-suave hover:bg-primaria-clara hover:text-primaria"
                >
                  <Plus aria-hidden className="size-4" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
