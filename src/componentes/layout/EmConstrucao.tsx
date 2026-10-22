import { Construction, Filter } from 'lucide-react'
import { secaoPorCaminho } from '@/config/navegacao'
import { Card } from '@/componentes/ui/Card'
import { useCatalogoFiltros } from '@/hooks/useCatalogoFiltros'
import { useChamadosFiltrados } from '@/hooks/useChamadosFiltrados'
import { descreverFiltros } from '@/lib/filtros'
import { useFiltros } from '@/store/filtros'

/**
 * Marcador temporário das telas que chegam nas próximas fases. Já reage aos
 * filtros globais, para validar que o estado é compartilhado entre telas.
 */
export function EmConstrucao({ caminho }: { caminho: string }) {
  const secao = secaoPorCaminho(caminho)
  const catalogo = useCatalogoFiltros()
  const periodo = useFiltros((estado) => estado.periodo)
  const sistemaId = useFiltros((estado) => estado.sistemaId)
  const fornecedorId = useFiltros((estado) => estado.fornecedorId)
  const filtros = descreverFiltros({ periodo, sistemaId, fornecedorId }, catalogo)
  const quantidade = useChamadosFiltrados().doPeriodo.length
  const Icone = secao?.icone ?? Construction

  return (
    <Card className="mx-auto max-w-xl text-center">
      <div className="flex flex-col items-center gap-4 py-6">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primaria-clara text-primaria">
          <Icone aria-hidden className="size-7" />
        </span>
        <div>
          <p className="text-lg font-bold text-primaria">{secao?.rotulo}</p>
          {secao && (
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-destaque-claro px-3 py-1 text-xs font-medium text-primaria">
              <Construction aria-hidden className="size-3.5" />
              Disponível na fase {secao.fase}
            </p>
          )}
        </div>
        <ul aria-label="Filtros aplicados" className="flex flex-wrap justify-center gap-2">
          {filtros.map((filtro) => (
            <li
              key={filtro}
              className="inline-flex items-center gap-1.5 rounded-full bg-fundo px-3 py-1 text-xs text-texto-suave ring-1 ring-borda"
            >
              <Filter aria-hidden className="size-3" />
              {filtro}
            </li>
          ))}
        </ul>
        <p className="text-sm text-texto-suave">
          <strong className="text-2xl font-bold text-primaria tabular-nums">{quantidade}</strong> chamados no recorte
        </p>
      </div>
    </Card>
  )
}
