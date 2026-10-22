import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Minimize2 } from 'lucide-react'
import { DATA_REFERENCIA } from '@/config/referencia'
import { AVISO_PROJETO_FICTICIO } from '@/config/projeto'
import { useCatalogoFiltros } from '@/hooks/useCatalogoFiltros'
import { useFundoInerte } from '@/hooks/useFundoInerte'
import { descreverFiltros } from '@/lib/filtros'
import { formatarData } from '@/lib/formatacao'
import { useFiltros } from '@/store/filtros'
import type { Dashboard } from '@/tipos/dashboard'
import { GradeDashboard } from './GradeDashboard'

interface ModoApresentacaoProps {
  dashboard: Dashboard
  aoSair: () => void
}

/** Tela cheia, sem menus, para reunião (CONCEITO.md, seção 7). Esc sai. */
export function ModoApresentacao({ dashboard, aoSair }: ModoApresentacaoProps) {
  const telaRef = useRef<HTMLDivElement>(null)
  const filtros = useFiltros()
  const catalogo = useCatalogoFiltros()
  useFundoInerte(true)

  useEffect(() => {
    const tela = telaRef.current
    let entrouEmTelaCheia = false
    tela
      ?.requestFullscreen?.()
      .then(() => {
        entrouEmTelaCheia = true
      })
      // Sem permissão para tela cheia (ex.: dentro de um iframe): segue ocupando a janela.
      .catch(() => undefined)
    const aoMudarTelaCheia = () => {
      if (entrouEmTelaCheia && !document.fullscreenElement) aoSair()
    }
    const aoTeclar = (evento: KeyboardEvent) => evento.key === 'Escape' && !document.fullscreenElement && aoSair()
    document.addEventListener('fullscreenchange', aoMudarTelaCheia)
    document.addEventListener('keydown', aoTeclar)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('fullscreenchange', aoMudarTelaCheia)
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
    }
  }, [aoSair])

  return createPortal(
    <div
      ref={telaRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Apresentação: ${dashboard.nome}`}
      className="fixed inset-0 z-[80] overflow-y-auto bg-fundo"
    >
      <div aria-hidden className="trilho" />
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 p-4 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primaria sm:text-3xl">{dashboard.nome}</h1>
            <p className="text-sm text-texto-suave">
              {descreverFiltros(filtros, catalogo).join(' · ')} · dados até {formatarData(DATA_REFERENCIA)}
            </p>
          </div>
          <button
            type="button"
            onClick={aoSair}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-superficie px-4 text-sm font-medium text-primaria ring-1 ring-borda hover:bg-primaria-clara"
          >
            <Minimize2 aria-hidden className="size-4" />
            Sair da apresentação (Esc)
          </button>
        </div>
        <GradeDashboard dashboard={dashboard} editavel={false} />
        <p className="text-xs text-texto-suave">{AVISO_PROJETO_FICTICIO}</p>
      </div>
    </div>,
    document.body,
  )
}
