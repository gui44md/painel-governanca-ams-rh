import { useId, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cx } from '@/lib/classes'

interface DicaProps {
  /** Texto curto da explicação (CONCEITO.md, seção 4: explicações ficam em tooltips). */
  texto: string
  /** Elemento que dispara a dica; por padrão, um ícone de informação. */
  children?: ReactNode
  posicao?: 'acima' | 'abaixo'
  /** Use `fim` perto da borda direita da tela para a dica não vazar. */
  alinhamento?: 'centro' | 'inicio' | 'fim'
  className?: string
}

const CLASSES_ALINHAMENTO = {
  centro: 'left-1/2 -translate-x-1/2',
  inicio: 'left-0',
  fim: 'right-0',
} as const

/** Tooltip acessível: aparece no hover e no foco do teclado. */
export function Dica({ texto, children, posicao = 'acima', alinhamento = 'centro', className }: DicaProps) {
  const id = useId()
  return (
    <span className={cx('group relative inline-flex', className)}>
      {children ?? (
        <button
          type="button"
          aria-describedby={id}
          aria-label="Mais informações"
          className="inline-flex rounded-full text-texto-suave hover:text-primaria"
        >
          <Info aria-hidden className="size-4" />
        </button>
      )}
      <span
        id={id}
        role="tooltip"
        className={cx(
          'pointer-events-none absolute z-50 w-max max-w-60 rounded-md bg-texto px-2.5 py-1.5',
          CLASSES_ALINHAMENTO[alinhamento],
          'text-xs font-normal text-white opacity-0 shadow-lg transition-opacity',
          'group-focus-within:opacity-100 group-hover:opacity-100',
          posicao === 'acima' ? 'bottom-full mb-2' : 'top-full mt-2',
        )}
      >
        {texto}
      </span>
    </span>
  )
}
