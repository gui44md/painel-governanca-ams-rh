import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '@/lib/classes'

export interface OpcaoSelecao<T extends string> {
  valor: T
  rotulo: string
}

interface CampoSelecaoProps<T extends string> {
  rotulo: string
  valor: T
  opcoes: readonly OpcaoSelecao<T>[]
  aoMudar: (valor: T) => void
  className?: string
}

export function CampoSelecao<T extends string>({
  rotulo,
  valor,
  opcoes,
  aoMudar,
  className,
}: CampoSelecaoProps<T>) {
  const id = useId()
  return (
    <div className={cx('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={id} className="text-xs font-medium text-texto-suave">
        {rotulo}
      </label>
      <div className="relative">
        <select
          id={id}
          value={valor}
          onChange={(evento) => aoMudar(evento.target.value as T)}
          className={cx(
            'h-10 w-full appearance-none truncate rounded-lg bg-superficie pr-9 pl-3 text-sm text-texto',
            'ring-1 ring-borda ring-inset transition-shadow hover:ring-primaria/40',
          )}
        >
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-texto-suave"
        />
      </div>
    </div>
  )
}
