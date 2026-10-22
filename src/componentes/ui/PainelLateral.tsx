import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useFundoInerte } from '@/hooks/useFundoInerte'

interface PainelLateralProps {
  aberto: boolean
  titulo: ReactNode
  /** Linha acima do título (ex.: ID do chamado). */
  sobretitulo?: ReactNode
  aoFechar: () => void
  children: ReactNode
}

/** Painel que desliza da direita, para detalhes sem sair da lista. */
export function PainelLateral({ aberto, titulo, sobretitulo, aoFechar, children }: PainelLateralProps) {
  const idTitulo = useId()
  const painelRef = useRef<HTMLDivElement>(null)
  const focoAnteriorRef = useRef<HTMLElement | null>(null)
  useFundoInerte(aberto)

  useEffect(() => {
    if (!aberto) return
    focoAnteriorRef.current = document.activeElement as HTMLElement | null
    painelRef.current?.focus()
    const aoTeclar = (evento: KeyboardEvent) => evento.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', aoTeclar)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
      focoAnteriorRef.current?.focus()
    }
  }, [aberto, aoFechar])

  if (!aberto) return null

  // Portal no <body>: elementos com transform (animações) não podem virar a referência do `fixed`.
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div aria-hidden className="absolute inset-0 bg-texto/40 backdrop-blur-[1px]" onClick={aoFechar} />
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="animate-entrada relative flex h-full w-full max-w-xl flex-col bg-superficie shadow-2xl focus:outline-none"
      >
        <div aria-hidden className="trilho" />
        <div className="flex items-start gap-3 border-b border-borda px-5 py-4">
          <div className="min-w-0 flex-1">
            {sobretitulo}
            <h2 id={idTitulo} className="text-lg leading-snug font-bold text-primaria">
              {titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar detalhes"
            className="-mr-2 rounded-lg p-2 text-texto-suave hover:bg-fundo hover:text-primaria"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
