import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { DATA_REFERENCIA, INICIO_DADOS } from '@/config/referencia'
import { dadosDoWidget, type ContextoWidget, type DadosWidget } from '@/lib/dashboard/agregacao'
import { useChamados } from '@/store/chamados'
import { useFiltros } from '@/store/filtros'
import type { Widget } from '@/tipos/dashboard'

/** Base analisada + filtros do topo, usados como padrão pelos widgets. */
export function useContextoWidget(): ContextoWidget {
  const analisados = useChamados((estado) => estado.analisados)
  const filtrosGlobais = useFiltros(
    useShallow(({ periodo, sistemaId, fornecedorId }) => ({ periodo, sistemaId, fornecedorId })),
  )
  return useMemo(
    () => ({
      analisados,
      filtrosGlobais,
      agora: DATA_REFERENCIA,
      inicioDados: INICIO_DADOS,
      sistemas: SISTEMAS_RH,
      fornecedores: FORNECEDORES,
    }),
    [analisados, filtrosGlobais],
  )
}

/** Dados do widget; recalcula quando a configuração, a base ou os filtros mudam. */
export function useDadosWidget(widget: Widget): DadosWidget {
  const contexto = useContextoWidget()
  return useMemo(() => dadosDoWidget(widget, contexto), [widget, contexto])
}
