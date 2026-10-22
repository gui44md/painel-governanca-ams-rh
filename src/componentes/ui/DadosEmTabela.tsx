import { Table2 } from 'lucide-react'

interface DadosEmTabelaProps {
  legenda: string
  colunas: readonly string[]
  linhas: readonly (readonly string[])[]
}

/** Os números do gráfico em tabela, para leitor de tela e para quem prefere ler. */
export function DadosEmTabela({ legenda, colunas, linhas }: DadosEmTabelaProps) {
  return (
    <details className="group mt-3 text-sm">
      <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded text-xs font-medium text-texto-suave hover:text-primaria">
        <Table2 aria-hidden className="size-3.5" />
        <span className="group-open:hidden">Ver dados em tabela</span>
        <span className="hidden group-open:inline">Ocultar tabela</span>
      </summary>
      <div tabIndex={0} role="region" aria-label={legenda} className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">{legenda}</caption>
          <thead>
            <tr className="border-b border-borda text-texto-suave">
              {colunas.map((coluna) => (
                <th key={coluna} scope="col" className="py-1.5 pr-3 font-medium">
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {linhas.map((linha) => (
              <tr key={linha.join('|')} className="border-b border-borda/60 last:border-0">
                {linha.map((celula, i) => (
                  <td key={i} className="py-1.5 pr-3">
                    {celula}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
