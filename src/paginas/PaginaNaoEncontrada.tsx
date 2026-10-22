import { Link } from 'react-router-dom'
import { House, TrainTrack } from 'lucide-react'
import { Card } from '@/componentes/ui/Card'

export default function PaginaNaoEncontrada() {
  return (
    <Card className="mx-auto max-w-md text-center">
      <div className="flex flex-col items-center gap-4 py-6">
        <TrainTrack aria-hidden className="size-10 text-primaria" />
        <div>
          <p className="text-lg font-bold text-primaria">Página não encontrada</p>
          <p className="mt-1 text-sm text-texto-suave">Este endereço saiu dos trilhos.</p>
        </div>
        <Link
          to="/"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primaria px-4 text-sm font-medium text-white hover:bg-primaria-escura"
        >
          <House aria-hidden className="size-4" />
          Voltar para a visão geral
        </Link>
      </div>
    </Card>
  )
}
