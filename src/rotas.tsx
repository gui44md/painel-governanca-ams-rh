import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { LayoutApp } from '@/componentes/layout/LayoutApp'
import { TelaErro } from '@/componentes/layout/TelaErro'
import { Carregando } from '@/componentes/ui/Carregando'

type ModuloPagina = Promise<{ default: React.ComponentType }>

/**
 * Cada tela é carregada sob demanda: gráficos, grade de widgets e Excel
 * só são baixados quando o usuário abre a seção que os usa.
 */
const sobDemanda =
  (importar: () => ModuloPagina): RouteObject['lazy'] =>
  async () => ({ Component: (await importar()).default })

export const roteador = createBrowserRouter([
  {
    Component: LayoutApp,
    HydrateFallback: Carregando,
    // Falha no próprio layout: tela de erro ocupa tudo.
    ErrorBoundary: TelaErro,
    children: [
      {
        // Falha numa tela: o menu e os filtros continuam disponíveis.
        ErrorBoundary: TelaErro,
        children: [
          { index: true, lazy: sobDemanda(() => import('@/paginas/visao-geral/PaginaVisaoGeral')) },
          { path: 'chamados', lazy: sobDemanda(() => import('@/paginas/chamados/PaginaChamados')) },
          { path: 'fornecedores', lazy: sobDemanda(() => import('@/paginas/fornecedores/PaginaFornecedores')) },
          { path: 'plano-de-acao', lazy: sobDemanda(() => import('@/paginas/plano-acao/PaginaPlanoAcao')) },
          { path: 'homologacao', lazy: sobDemanda(() => import('@/paginas/homologacao/PaginaHomologacao')) },
          { path: 'construtor', lazy: sobDemanda(() => import('@/paginas/construtor/PaginaConstrutor')) },
          { path: 'excel', lazy: sobDemanda(() => import('@/paginas/excel/PaginaExcel')) },
          { path: '*', lazy: sobDemanda(() => import('@/paginas/PaginaNaoEncontrada')) },
        ],
      },
    ],
  },
])
