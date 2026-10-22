import { useState } from 'react'
import { LayoutGrid, LayoutTemplate, Plus } from 'lucide-react'
import { TIPOS_WIDGET } from '@/config/dashboards'
import { Botao } from '@/componentes/ui/Botao'
import { Card } from '@/componentes/ui/Card'
import { EstadoVazio } from '@/componentes/ui/EstadoVazio'
import { formatarDataHora } from '@/lib/formatacao'
import { MODELOS_DASHBOARD, type IdModelo } from '@/lib/dashboard/modelos'
import type { FornecedorId } from '@/tipos/catalogo'
import type { Dashboard } from '@/tipos/dashboard'
import { DialogoNovoDashboard } from './DialogoNovoDashboard'

interface ListaDashboardsProps {
  dashboards: readonly Dashboard[]
  aoAbrir: (id: string) => void
  aoCriar: (nome: string, opcoes: { modeloId?: IdModelo; fornecedorId?: FornecedorId }) => void
}

/** "Meus dashboards" e os modelos prontos para começar. */
export function ListaDashboards({ dashboards, aoAbrir, aoCriar }: ListaDashboardsProps) {
  // `chave` reinicia o diálogo a cada abertura, com o modelo escolhido.
  const [dialogo, setDialogo] = useState<{ chave: number; modelo: IdModelo | null } | null>(null)
  const abrirDialogo = (modelo: IdModelo | null) => setDialogo({ chave: Date.now(), modelo })
  const ordenados = dashboards.toSorted((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime())

  return (
    <div className="flex flex-col gap-6">
      <Card
        titulo="Meus dashboards"
        acao={
          <Botao tamanho="sm" icone={Plus} onClick={() => abrirDialogo(null)}>
            Novo dashboard
          </Botao>
        }
      >
        {ordenados.length === 0 ? (
          <EstadoVazio icone={LayoutGrid} titulo="Nenhum dashboard salvo" descricao="Crie um em branco ou comece de um modelo." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ordenados.map((dashboard) => {
              const icones = [...new Set(dashboard.widgets.map((w) => w.tipo))].slice(0, 5)
              return (
                <li key={dashboard.id}>
                  <button
                    type="button"
                    onClick={() => aoAbrir(dashboard.id)}
                    className="flex h-full w-full flex-col gap-3 rounded-lg p-4 text-left ring-1 ring-borda transition-shadow hover:shadow-md hover:ring-primaria/40"
                  >
                    <span className="flex gap-1.5" aria-hidden>
                      {icones.map((tipo) => {
                        const Icone = TIPOS_WIDGET[tipo].icone
                        return (
                          <span key={tipo} className="flex size-7 items-center justify-center rounded-md bg-primaria-clara text-primaria">
                            <Icone className="size-3.5" />
                          </span>
                        )
                      })}
                    </span>
                    <span className="font-semibold text-primaria">{dashboard.nome}</span>
                    <span className="mt-auto text-xs text-texto-suave">
                      {dashboard.widgets.length} widgets · atualizado em {formatarDataHora(dashboard.atualizadoEm)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card titulo="Modelos prontos">
        <ul className="grid gap-3 md:grid-cols-3">
          {MODELOS_DASHBOARD.map((modelo) => (
            <li key={modelo.id} className="flex flex-col gap-3 rounded-lg p-4 ring-1 ring-borda">
              <span className="flex size-9 items-center justify-center rounded-lg bg-destaque-claro text-primaria">
                <LayoutTemplate aria-hidden className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-primaria">{modelo.nome}</p>
                <p className="mt-0.5 text-sm text-texto-suave">{modelo.descricao}</p>
              </div>
              <Botao variante="secundario" tamanho="sm" className="mt-auto self-start" onClick={() => abrirDialogo(modelo.id)}>
                Usar modelo
              </Botao>
            </li>
          ))}
        </ul>
      </Card>

      {dialogo && (
        <DialogoNovoDashboard
          key={dialogo.chave}
          aberto
          modeloInicial={dialogo.modelo}
          aoFechar={() => setDialogo(null)}
          aoCriar={(nome, opcoes) => {
            setDialogo(null)
            aoCriar(nome, opcoes)
          }}
        />
      )}
    </div>
  )
}
