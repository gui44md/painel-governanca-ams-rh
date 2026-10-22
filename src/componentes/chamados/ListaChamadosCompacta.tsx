import { Link } from 'react-router-dom'
import { SISTEMAS_RH } from '@/config/catalogo'
import type { ChamadoAnalisado } from '@/lib/analise'
import { prioridadeExibida } from '@/lib/lista-chamados'
import { BarraSla } from '@/componentes/ui/BarraSla'
import { EtiquetaPrioridade } from '@/componentes/ui/EtiquetaPrioridade'

const NOME_CURTO = new Map(SISTEMAS_RH.map((s) => [s.id, s.nomeCurto]))

/** Lista curta de chamados com barra de SLA; cada item abre o detalhe na tela de Chamados. */
export function ListaChamadosCompacta({ chamados }: { chamados: readonly ChamadoAnalisado[] }) {
  return (
    <ul className="divide-y divide-borda">
      {chamados.map((chamado) => (
        <li key={chamado.id}>
          <Link
            to={{ pathname: '/chamados', search: `?chamado=${chamado.id}` }}
            className="-mx-2 flex flex-col gap-2 rounded-lg px-2 py-3 hover:bg-fundo sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-xs text-texto-suave">
                <span className="font-mono">{chamado.id}</span>
                <span aria-hidden>·</span>
                {NOME_CURTO.get(chamado.sistemaId)}
                <EtiquetaPrioridade
                  prioridade={prioridadeExibida(chamado)}
                  elevada={chamado.sla?.elevadoPorFechamento}
                />
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-texto">{chamado.titulo}</p>
            </div>
            <BarraSla chamado={chamado} compacta className="sm:w-44" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
