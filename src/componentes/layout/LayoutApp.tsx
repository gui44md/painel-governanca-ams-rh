import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigation } from 'react-router-dom'
import { Menu, SlidersHorizontal } from 'lucide-react'
import { secaoPorCaminho } from '@/config/navegacao'
import { NOME_COMPLETO_SISTEMA, NOME_SISTEMA } from '@/config/projeto'
import { Carregando } from '@/componentes/ui/Carregando'
import { cx } from '@/lib/classes'
import { BarraFiltros } from './BarraFiltros'
import { MenuLateral } from './MenuLateral'
import { RegiaoAvisos } from './RegiaoAvisos'
import { Rodape } from './Rodape'

export function LayoutApp() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const fecharMenu = useCallback(() => setMenuAberto(false), [])
  const secao = secaoPorCaminho(useLocation().pathname)
  const navegacao = useNavigation()

  // Título da aba por tela: ajuda a se localizar entre abas e no leitor de tela.
  useEffect(() => {
    document.title = secao ? `${secao.rotulo} · ${NOME_SISTEMA}` : NOME_COMPLETO_SISTEMA
  }, [secao])

  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-destaque px-4 py-2 font-medium text-primaria focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      <MenuLateral aberto={menuAberto} aoFechar={fecharMenu} />

      <div className="flex min-h-dvh flex-col lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-borda bg-fundo/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              aria-expanded={menuAberto}
              aria-controls="menu-lateral"
              className="-ml-2 rounded-lg p-2 text-primaria hover:bg-primaria-clara lg:hidden"
            >
              <Menu aria-hidden className="size-6" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-primaria sm:text-xl">
                {secao?.rotulo ?? NOME_COMPLETO_SISTEMA}
              </h1>
              {secao && <p className="hidden truncate text-sm text-texto-suave sm:block">{secao.descricao}</p>}
            </div>

            <button
              type="button"
              onClick={() => setFiltrosAbertos((aberto) => !aberto)}
              aria-expanded={filtrosAbertos}
              aria-controls="filtros-globais"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primaria ring-1 ring-borda ring-inset hover:bg-primaria-clara sm:hidden"
            >
              <SlidersHorizontal aria-hidden className="size-4" />
              Filtros
            </button>
          </div>

          <div
            id="filtros-globais"
            role="search"
            aria-label="Filtros globais"
            className={cx('px-4 pb-4 sm:block sm:px-6 lg:px-8', filtrosAbertos ? 'block' : 'hidden')}
          >
            <BarraFiltros />
          </div>
        </header>

        <main id="conteudo" tabIndex={-1} className="flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-8">
          {navegacao.state === 'loading' ? <Carregando /> : <Outlet />}
        </main>

        <Rodape />
      </div>

      <RegiaoAvisos />
    </div>
  )
}
