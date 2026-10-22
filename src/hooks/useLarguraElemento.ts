import { useCallback, useState } from 'react'

/**
 * Largura de um elemento em pixels, atualizada pelo ResizeObserver.
 * Mede na montagem e a cada mudança, sem esperar requestAnimationFrame (que
 * não roda em abas em segundo plano). Retorna 0 até a primeira medição.
 */
export function useLarguraElemento<T extends HTMLElement>(): [(elemento: T | null) => void, number] {
  const [largura, setLargura] = useState(0)

  const ref = useCallback((elemento: T | null) => {
    if (!elemento) return
    const medir = () => setLargura(Math.round(elemento.getBoundingClientRect().width))
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(elemento)
    // React 19: a função retornada pelo callback ref é chamada ao desmontar.
    return () => observador.disconnect()
  }, [])

  return [ref, largura]
}
