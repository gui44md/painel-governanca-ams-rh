import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { ROTULOS_TIPO } from '@/config/chamados'
import { BarraSla } from '@/componentes/ui/BarraSla'
import { EtiquetaPrioridade } from '@/componentes/ui/EtiquetaPrioridade'
import type { ChamadoAnalisado } from '@/lib/analise'
import { prioridadeExibida } from '@/lib/lista-chamados'
import { MarcadorReincidente } from './MarcadorReincidente'

const SISTEMA = new Map(SISTEMAS_RH.map((s) => [s.id, s.nomeCurto]))
const FORNECEDOR = new Map(FORNECEDORES.map((f) => [f.id, f.nome]))

interface TabelaChamadosProps {
  chamados: readonly ChamadoAnalisado[]
  aoAbrir: (id: string) => void
}

/** Tabela no desktop; no celular vira lista de cartões (CONCEITO.md, seção 12). */
export function TabelaChamados({ chamados, aoAbrir }: TabelaChamadosProps) {
  return (
    <>
      <table className="hidden w-full table-fixed text-left text-sm md:table">
        <caption className="sr-only">Chamados no recorte</caption>
        <thead>
          <tr className="border-b border-borda text-xs text-texto-suave">
            <th scope="col" className="w-32 py-2 pr-3 font-medium">ID</th>
            <th scope="col" className="py-2 pr-3 font-medium">Título</th>
            <th scope="col" className="w-28 py-2 pr-3 font-medium">Sistema</th>
            <th scope="col" className="hidden w-36 py-2 pr-3 font-medium xl:table-cell">Fornecedor</th>
            <th scope="col" className="w-24 py-2 pr-3 font-medium">Prioridade</th>
            <th scope="col" className="w-44 py-2 font-medium lg:w-56">Prazo do SLA</th>
          </tr>
        </thead>
        <tbody>
          {chamados.map((chamado) => (
            <tr
              key={chamado.id}
              onClick={() => aoAbrir(chamado.id)}
              className="cursor-pointer border-b border-borda/70 last:border-0 hover:bg-fundo"
            >
              <td className="py-3 pr-3 align-top font-mono text-xs whitespace-nowrap text-texto-suave">{chamado.id}</td>
              <td className="py-3 pr-3 align-top">
                <button
                  type="button"
                  onClick={(evento) => {
                    evento.stopPropagation()
                    aoAbrir(chamado.id)
                  }}
                  className="block w-full truncate text-left font-medium text-texto hover:text-primaria"
                >
                  {chamado.titulo}
                </button>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-texto-suave">
                  {ROTULOS_TIPO[chamado.tipo]}
                  {chamado.reincidente && <MarcadorReincidente />}
                </span>
              </td>
              <td className="py-3 pr-3 align-top whitespace-nowrap">{SISTEMA.get(chamado.sistemaId)}</td>
              <td className="hidden py-3 pr-3 align-top whitespace-nowrap xl:table-cell">
                {FORNECEDOR.get(chamado.fornecedorId)}
              </td>
              <td className="py-3 pr-3 align-top">
                <EtiquetaPrioridade prioridade={prioridadeExibida(chamado)} elevada={chamado.sla?.elevadoPorFechamento} />
              </td>
              <td className="py-3 align-top">
                <BarraSla chamado={chamado} compacta />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col gap-2 md:hidden">
        {chamados.map((chamado) => (
          <li key={chamado.id}>
            <button
              type="button"
              onClick={() => aoAbrir(chamado.id)}
              className="flex w-full flex-col gap-2 rounded-lg p-3 text-left ring-1 ring-borda hover:bg-fundo"
            >
              <span className="flex items-center gap-2 text-xs text-texto-suave">
                <span className="font-mono">{chamado.id}</span>
                {chamado.reincidente && <MarcadorReincidente />}
                <span className="ml-auto">
                  <EtiquetaPrioridade prioridade={prioridadeExibida(chamado)} elevada={chamado.sla?.elevadoPorFechamento} />
                </span>
              </span>
              <span className="text-sm font-medium text-texto">{chamado.titulo}</span>
              <span className="text-xs text-texto-suave">
                {SISTEMA.get(chamado.sistemaId)} · {FORNECEDOR.get(chamado.fornecedorId)}
              </span>
              <BarraSla chamado={chamado} compacta />
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
