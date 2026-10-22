import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { RotateCcw, X } from 'lucide-react'
import { SECOES } from '@/config/navegacao'
import { DialogoConfirmacao } from '@/componentes/ui/DialogoConfirmacao'
import { CONSULTA_DESKTOP, useMediaQuery } from '@/hooks/useMediaQuery'
import { cx } from '@/lib/classes'
import { Logo } from './Logo'

interface MenuLateralProps {
  /** Só tem efeito abaixo de `lg`, onde o menu vira gaveta. */
  aberto: boolean
  aoFechar: () => void
}

export function MenuLateral({ aberto, aoFechar }: MenuLateralProps) {
  const ehDesktop = useMediaQuery(CONSULTA_DESKTOP)
  const visivel = ehDesktop || aberto
  const botaoFecharRef = useRef<HTMLButtonElement>(null)
  const [confirmandoRestauracao, setConfirmandoRestauracao] = useState(false)

  useEffect(() => {
    if (ehDesktop || !aberto) return
    botaoFecharRef.current?.focus()
    const aoTeclar = (evento: KeyboardEvent) => evento.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, ehDesktop, aoFechar])

  return (
    <>
      {!ehDesktop && aberto && (
        <div aria-hidden className="fixed inset-0 z-30 bg-texto/50 backdrop-blur-[1px]" onClick={aoFechar} />
      )}

      <aside
        id="menu-lateral"
        aria-label="Menu principal"
        inert={!visivel}
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-primaria transition-transform duration-200',
          'lg:translate-x-0',
          visivel ? 'translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full',
        )}
      >
        <div className="flex items-start justify-between gap-2 px-5 pt-6 pb-5">
          <Logo />
          <button
            ref={botaoFecharRef}
            type="button"
            onClick={aoFechar}
            aria-label="Fechar menu"
            className="-mr-2 rounded-lg p-2 text-menu-texto hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <div aria-hidden className="trilho mx-5 opacity-60" />

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {SECOES.map(({ caminho, rotulo, icone: Icone }) => (
              <li key={caminho}>
                <NavLink
                  to={caminho}
                  end={caminho === '/'}
                  onClick={aoFechar}
                  className={({ isActive }) =>
                    cx(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      'focus-visible:outline-destaque',
                      isActive
                        ? 'bg-white/10 text-white before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-destaque'
                        : 'text-menu-texto hover:bg-white/5 hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icone aria-hidden className={cx('size-5 shrink-0', isActive && 'text-destaque')} />
                      {rotulo}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <button
            type="button"
            onClick={() => setConfirmandoRestauracao(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-menu-texto hover:bg-white/5 hover:text-white focus-visible:outline-destaque"
          >
            <RotateCcw aria-hidden className="size-4" />
            Restaurar demonstração
          </button>
        </div>
      </aside>

      <DialogoConfirmacao
        aberto={confirmandoRestauracao}
        titulo="Restaurar a demonstração?"
        descricao="Importações, ações, reuniões, homologações e dashboards criados ou alterados voltam aos dados de exemplo. Os filtros voltam ao início."
        rotuloConfirmar="Restaurar"
        aoCancelar={() => setConfirmandoRestauracao(false)}
        aoConfirmar={() => {
          setConfirmandoRestauracao(false)
          aoFechar()
          void import('@/store/restaurar-demonstracao').then((m) => m.restaurarDemonstracao())
        }}
      />
    </>
  )
}
