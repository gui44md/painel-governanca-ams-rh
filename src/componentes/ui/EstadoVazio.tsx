import type { ReactNode } from 'react'
import { SearchX, type LucideIcon } from 'lucide-react'

interface EstadoVazioProps {
  titulo: string
  descricao?: string
  icone?: LucideIcon
  acao?: ReactNode
}

export function EstadoVazio({ titulo, descricao, icone: Icone = SearchX, acao }: EstadoVazioProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <Icone aria-hidden className="size-8 text-texto-suave" />
      <p className="font-semibold text-texto">{titulo}</p>
      {descricao && <p className="max-w-sm text-sm text-texto-suave">{descricao}</p>}
      {acao}
    </div>
  )
}
