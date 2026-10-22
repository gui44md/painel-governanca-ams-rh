import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DATA_REFERENCIA } from '@/config/referencia'
import { widgetsDoModelo, type IdModelo } from '@/lib/dashboard/modelos'
import {
  adicionarWidget as adicionarWidgetPuro,
  atualizarLayout as atualizarLayoutPuro,
  atualizarWidget as atualizarWidgetPuro,
  duplicarWidget as duplicarWidgetPuro,
  removerWidget as removerWidgetPuro,
} from '@/lib/dashboard/operacoes'
import { proximoId } from '@/lib/identificadores'
import { reviverDatas } from '@/lib/persistencia'
import type { FornecedorId } from '@/tipos/catalogo'
import type { Dashboard, PosicaoWidget, TipoWidget, Widget } from '@/tipos/dashboard'

interface OpcoesCriacao {
  modeloId?: IdModelo
  fornecedorId?: FornecedorId
}

interface EstadoDashboards {
  dashboards: Dashboard[]
  criar: (nome: string, opcoes?: OpcoesCriacao) => string
  renomear: (id: string, nome: string) => void
  excluir: (id: string) => void
  /** Devolve o ID do widget criado, para abrir a configuração logo após soltar. */
  adicionarWidget: (id: string, tipo: TipoWidget, posicao?: { x: number; y: number }) => string
  duplicarWidget: (id: string, widgetId: string) => string
  removerWidget: (id: string, widgetId: string) => void
  atualizarWidget: (id: string, widgetId: string, alteracao: Partial<Widget>) => void
  atualizarLayout: (id: string, layout: readonly PosicaoWidget[]) => void
  restaurarExemplos: () => void
}

const agora = () => DATA_REFERENCIA

function novoDashboard(id: string, nome: string, opcoes: OpcoesCriacao = {}): Dashboard {
  const conteudo = opcoes.modeloId ? widgetsDoModelo(opcoes.modeloId, opcoes) : { widgets: [], layout: [] }
  return { id, nome: nome.trim(), ...conteudo, criadoEm: agora(), atualizadoEm: agora(), modeloId: opcoes.modeloId ?? null }
}

const EXEMPLOS = () => [
  novoDashboard('DSH-001', 'Reunião mensal com Beta Tech', { modeloId: 'reuniao-fornecedor', fornecedorId: 'beta' }),
]

/** Dashboards do usuário ("Meus dashboards"), salvos no navegador. */
export const useDashboards = create<EstadoDashboards>()(
  persist(
    (set, get) => {
      const alterar = (id: string, transformar: (d: Dashboard) => Dashboard) =>
        set((estado) => ({ dashboards: estado.dashboards.map((d) => (d.id === id ? transformar(d) : d)) }))

      /** Executa uma operação que devolve o dashboard e o ID de um widget. */
      const comWidget = (id: string, operacao: (d: Dashboard) => { dashboard: Dashboard; widgetId: string }) => {
        const atual = get().dashboards.find((d) => d.id === id)
        if (!atual) return ''
        const { dashboard, widgetId } = operacao(atual)
        alterar(id, () => dashboard)
        return widgetId
      }

      return {
        dashboards: EXEMPLOS(),
        criar: (nome, opcoes) => {
          const id = proximoId('DSH', get().dashboards.map((d) => d.id))
          set((estado) => ({ dashboards: [...estado.dashboards, novoDashboard(id, nome, opcoes)] }))
          return id
        },
        renomear: (id, nome) => alterar(id, (d) => ({ ...d, nome: nome.trim(), atualizadoEm: agora() })),
        excluir: (id) => set((estado) => ({ dashboards: estado.dashboards.filter((d) => d.id !== id) })),
        adicionarWidget: (id, tipo, posicao) => comWidget(id, (d) => adicionarWidgetPuro(d, tipo, agora(), posicao)),
        duplicarWidget: (id, widgetId) => comWidget(id, (d) => duplicarWidgetPuro(d, widgetId, agora())),
        removerWidget: (id, widgetId) => alterar(id, (d) => removerWidgetPuro(d, widgetId, agora())),
        atualizarWidget: (id, widgetId, alteracao) => alterar(id, (d) => atualizarWidgetPuro(d, widgetId, alteracao, agora())),
        atualizarLayout: (id, layout) => alterar(id, (d) => atualizarLayoutPuro(d, layout, agora())),
        restaurarExemplos: () => set({ dashboards: EXEMPLOS() }),
      }
    },
    {
      name: 'painel-ams:dashboards',
      version: 1,
      storage: createJSONStorage(() => localStorage, { reviver: reviverDatas }),
      partialize: ({ dashboards }) => ({ dashboards }),
    },
  ),
)
