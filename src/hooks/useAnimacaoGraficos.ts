import { ESTILO_GRAFICO } from '@/config/graficos'
import { useMediaQuery } from './useMediaQuery'

/**
 * Propriedades de animação dos gráficos (Recharts anima via JavaScript, fora do
 * alcance do CSS). Respeita "reduzir movimento" do sistema operacional.
 */
export function useAnimacaoGraficos(): { isAnimationActive: boolean; animationDuration: number } {
  const reduzir = useMediaQuery('(prefers-reduced-motion: reduce)')
  return { isAnimationActive: !reduzir, animationDuration: ESTILO_GRAFICO.duracaoAnimacao }
}
