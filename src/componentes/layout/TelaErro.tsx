import { useEffect } from 'react'
import { Link, useRouteError } from 'react-router-dom'
import { House, RotateCw, TriangleAlert } from 'lucide-react'
import { Botao } from '@/componentes/ui/Botao'

/**
 * Exibida no lugar da tela quando algo falha ao carregar ou renderizar (por
 * exemplo, após uma nova versão publicada com o app aberto). O erro técnico
 * vai para o console; o usuário recebe uma saída clara.
 */
export function TelaErro() {
  const erro = useRouteError()
  useEffect(() => console.error(erro), [erro])

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-estourado-fundo text-estourado-texto">
        <TriangleAlert aria-hidden className="size-6" />
      </span>
      <div>
        <h1 className="text-lg font-bold text-primaria">Não foi possível abrir esta tela</h1>
        <p className="mt-1 text-sm text-texto-suave">
          Recarregue a página. Seus dashboards, ações e importações continuam salvos neste navegador.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Botao icone={RotateCw} onClick={() => window.location.reload()}>
          Recarregar
        </Botao>
        <Link
          to="/"
          className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-primaria ring-1 ring-borda ring-inset hover:bg-primaria-clara"
        >
          <House aria-hidden className="size-4" />
          Visão geral
        </Link>
      </div>
    </div>
  )
}
