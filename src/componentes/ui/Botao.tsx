import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/classes'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo'
type Tamanho = 'md' | 'sm'

const CLASSES_VARIANTE: Record<Variante, string> = {
  primario: 'bg-primaria text-white hover:bg-primaria-escura shadow-sm',
  secundario: 'bg-superficie text-primaria ring-1 ring-inset ring-borda hover:bg-primaria-clara',
  fantasma: 'text-texto-suave hover:bg-primaria-clara hover:text-primaria',
  perigo: 'bg-estourado-texto text-white hover:bg-estourado-texto/90 shadow-sm',
}

const CLASSES_TAMANHO: Record<Tamanho, string> = {
  md: 'h-10 px-4 text-sm gap-2',
  sm: 'h-8 px-3 text-xs gap-1.5',
}

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanho?: Tamanho
  icone?: LucideIcon
  children?: ReactNode
}

export function Botao({
  variante = 'primario',
  tamanho = 'md',
  icone: Icone,
  className,
  type = 'button',
  children,
  ...props
}: BotaoProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        CLASSES_VARIANTE[variante],
        CLASSES_TAMANHO[tamanho],
        className,
      )}
      {...props}
    >
      {Icone && <Icone aria-hidden className={tamanho === 'sm' ? 'size-3.5' : 'size-4'} />}
      {children}
    </button>
  )
}
