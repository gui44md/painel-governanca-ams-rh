import { useCallback, useSyncExternalStore } from 'react'

/** Acompanha uma media query CSS (ex.: `(min-width: 1024px)`). */
export function useMediaQuery(consulta: string): boolean {
  const assinar = useCallback(
    (aoMudar: () => void) => {
      const lista = window.matchMedia(consulta)
      lista.addEventListener('change', aoMudar)
      return () => lista.removeEventListener('change', aoMudar)
    },
    [consulta],
  )
  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(consulta).matches,
    () => false,
  )
}

/** Mesmo ponto de quebra `lg` do Tailwind, em que o menu lateral fica fixo. */
export const CONSULTA_DESKTOP = '(min-width: 1024px)'
