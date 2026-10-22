import { useId } from 'react'
import { Search, X } from 'lucide-react'
import { cx } from '@/lib/classes'

interface CampoBuscaProps {
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
  placeholder?: string
  className?: string
}

export function CampoBusca({ rotulo, valor, aoMudar, placeholder, className }: CampoBuscaProps) {
  const id = useId()
  return (
    <div className={cx('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={id} className="text-xs font-medium text-texto-suave">
        {rotulo}
      </label>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texto-suave"
        />
        <input
          id={id}
          type="search"
          value={valor}
          placeholder={placeholder}
          onChange={(evento) => aoMudar(evento.target.value)}
          className="h-10 w-full rounded-lg bg-superficie pr-9 pl-9 text-sm text-texto ring-1 ring-borda ring-inset placeholder:text-texto-suave/80 hover:ring-primaria/40 [&::-webkit-search-cancel-button]:hidden"
        />
        {valor && (
          <button
            type="button"
            onClick={() => aoMudar('')}
            aria-label="Limpar busca"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-texto-suave hover:text-primaria"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
