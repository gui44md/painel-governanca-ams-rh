import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DestinoInsight } from '@/lib/insights'
import { useFiltros } from '@/store/filtros'

/** Aplica os filtros do destino e navega até a tela, já com o recorte pronto. */
export function useAbrirDestino(): (destino: DestinoInsight) => void {
  const navegar = useNavigate()
  const aplicarRecorte = useFiltros((estado) => estado.aplicarRecorte)

  return useCallback(
    (destino: DestinoInsight) => {
      aplicarRecorte(destino.filtros)
      const busca = destino.parametros ? `?${new URLSearchParams(destino.parametros)}` : ''
      navegar({ pathname: destino.caminho, search: busca })
      window.scrollTo({ top: 0 })
    },
    [aplicarRecorte, navegar],
  )
}
