import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFundoInerte } from '@/hooks/useFundoInerte'

interface ModalProps {
  aberto: boolean
  titulo: string
  aoFechar: () => void
  children: ReactNode
}

/** Janela modal centralizada (no <body>, para não sofrer com transforms dos cards). */
export function Modal({ aberto, titulo, aoFechar, children }: ModalProps) {
  const idTitulo = useId()
  const caixaRef = useRef<HTMLDivElement>(null)
  useFundoInerte(aberto)

  useEffect(() => {
    if (!aberto) return
    const focoAnterior = document.activeElement as HTMLElement | null
    caixaRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
    const aoTeclar = (evento: KeyboardEvent) => evento.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      focoAnterior?.focus()
    }
  }, [aberto, aoFechar])

  if (!aberto) return null
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-texto/50" onClick={aoFechar} />
      <div
        ref={caixaRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="animate-entrada relative w-full max-w-lg overflow-hidden rounded-xl bg-superficie shadow-2xl"
      >
        <div aria-hidden className="trilho" />
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <h2 id={idTitulo} className="font-bold text-primaria">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="-mr-2 rounded-lg p-2 text-texto-suave hover:bg-fundo hover:text-primaria"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="px-5 pt-3 pb-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
