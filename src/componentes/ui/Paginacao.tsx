import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Botao } from './Botao'

interface PaginacaoProps {
  pagina: number
  totalPaginas: number
  totalItens: number
  aoMudar: (pagina: number) => void
}

export function Paginacao({ pagina, totalPaginas, totalItens, aoMudar }: PaginacaoProps) {
  if (totalPaginas <= 1) return null
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3 pt-4">
      <p className="text-xs text-texto-suave">
        Página {pagina} de {totalPaginas} · {totalItens} chamados
      </p>
      <div className="flex gap-2">
        <Botao
          variante="secundario"
          tamanho="sm"
          icone={ChevronLeft}
          disabled={pagina <= 1}
          onClick={() => aoMudar(pagina - 1)}
        >
          Anterior
        </Botao>
        <Botao variante="secundario" tamanho="sm" disabled={pagina >= totalPaginas} onClick={() => aoMudar(pagina + 1)}>
          Próxima
          <ChevronRight aria-hidden className="size-3.5" />
        </Botao>
      </div>
    </nav>
  )
}
