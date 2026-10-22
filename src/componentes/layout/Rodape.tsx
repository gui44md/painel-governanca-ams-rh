import { TriangleAlert } from 'lucide-react'
import { AVISO_PROJETO_FICTICIO } from '@/config/projeto'

/** Aviso fixo e discreto de projeto fictício (CONCEITO.md, seção 5). */
export function Rodape() {
  return (
    <footer className="border-t border-borda bg-superficie/70 px-4 py-3 sm:px-6 lg:px-8">
      <p className="flex items-start gap-2 text-xs text-texto-suave">
        <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
        {AVISO_PROJETO_FICTICIO}
      </p>
    </footer>
  )
}
