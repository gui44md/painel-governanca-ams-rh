import { LoaderCircle } from 'lucide-react'

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-texto-suave">
      <LoaderCircle aria-hidden className="size-5 animate-spin text-primaria" />
      {texto}
    </div>
  )
}
