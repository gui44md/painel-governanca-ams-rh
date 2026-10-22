import { useEffect } from 'react'

/** Quantas camadas modais estão abertas (painéis podem abrir diálogos por cima). */
let camadasAbertas = 0

/**
 * Enquanto uma camada modal está aberta, o restante da aplicação (#root) fica
 * inerte: teclado e leitor de tela não "escapam" para trás do diálogo. As
 * camadas são renderizadas em portal no <body>, fora do #root.
 */
export function useFundoInerte(aberto: boolean): void {
  useEffect(() => {
    if (!aberto) return
    const raiz = document.getElementById('root')
    camadasAbertas++
    if (raiz) raiz.inert = true
    return () => {
      camadasAbertas = Math.max(0, camadasAbertas - 1)
      if (raiz && camadasAbertas === 0) raiz.inert = false
    }
  }, [aberto])
}
