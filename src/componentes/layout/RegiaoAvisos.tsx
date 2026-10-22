import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { cx } from '@/lib/classes'
import { useAvisos, type TomAviso } from '@/store/avisos'

const APARENCIA: Record<TomAviso, { icone: typeof Info; classes: string }> = {
  sucesso: { icone: CircleCheck, classes: 'text-no-prazo-texto' },
  erro: { icone: CircleAlert, classes: 'text-estourado-texto' },
  informacao: { icone: Info, classes: 'text-primaria' },
}

/** Avisos no canto da tela, anunciados ao leitor de tela. */
export function RegiaoAvisos() {
  const { avisos, remover } = useAvisos()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
    >
      {avisos.map(({ id, texto, tom }) => {
        const { icone: Icone, classes } = APARENCIA[tom]
        return (
          <div
            key={id}
            role={tom === 'erro' ? 'alert' : 'status'}
            className="animate-entrada pointer-events-auto flex w-full items-start gap-3 rounded-xl bg-superficie p-3 shadow-lg ring-1 ring-borda"
          >
            <Icone aria-hidden className={cx('mt-0.5 size-5 shrink-0', classes)} />
            <p className="flex-1 text-sm text-texto">{texto}</p>
            <button
              type="button"
              onClick={() => remover(id)}
              aria-label="Fechar aviso"
              className="rounded p-0.5 text-texto-suave hover:text-primaria"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
