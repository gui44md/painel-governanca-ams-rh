import { createPortal } from 'react-dom'
import { useEffect, useId, useRef } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useFundoInerte } from '@/hooks/useFundoInerte'
import { Botao } from './Botao'

interface DialogoConfirmacaoProps {
  aberto: boolean
  titulo: string
  descricao: string
  rotuloConfirmar: string
  /** Ações destrutivas (excluir, devolver) usam o botão de perigo. */
  destrutivo?: boolean
  aoConfirmar: () => void
  aoCancelar: () => void
}

/** Confirmação antes de ações irreversíveis (CONCEITO.md, seção 12: prevenção de erros). */
export function DialogoConfirmacao({
  aberto,
  titulo,
  descricao,
  rotuloConfirmar,
  destrutivo = false,
  aoConfirmar,
  aoCancelar,
}: DialogoConfirmacaoProps) {
  const idTitulo = useId()
  const idDescricao = useId()
  const cancelarRef = useRef<HTMLButtonElement>(null)
  useFundoInerte(aberto)

  useEffect(() => {
    if (!aberto) return
    // O foco começa em "Cancelar": a opção segura.
    cancelarRef.current?.focus()
    // Captura o Esc antes do painel lateral que pode estar aberto por baixo.
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return
      evento.stopPropagation()
      aoCancelar()
    }
    document.addEventListener('keydown', aoTeclar, true)
    return () => document.removeEventListener('keydown', aoTeclar, true)
  }, [aberto, aoCancelar])

  if (!aberto) return null
  // Portal no <body>: elementos com transform (animações) não podem virar a referência do `fixed`.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-texto/50" onClick={aoCancelar} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idDescricao}
        className="animate-entrada relative w-full max-w-md rounded-xl bg-superficie p-5 shadow-2xl"
      >
        <div className="flex gap-3">
          {destrutivo && (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-estourado-fundo text-estourado-texto">
              <TriangleAlert aria-hidden className="size-5" />
            </span>
          )}
          <div>
            <h2 id={idTitulo} className="font-bold text-primaria">
              {titulo}
            </h2>
            <p id={idDescricao} className="mt-1 text-sm text-texto">
              {descricao}
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelarRef}
            type="button"
            onClick={aoCancelar}
            className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-texto ring-1 ring-borda ring-inset hover:bg-fundo"
          >
            Cancelar
          </button>
          <Botao variante={destrutivo ? 'perigo' : 'primario'} onClick={aoConfirmar}>
            {rotuloConfirmar}
          </Botao>
        </div>
      </div>
    </div>,
    document.body,
  )
}
