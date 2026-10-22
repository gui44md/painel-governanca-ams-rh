import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { DATA_REFERENCIA, INICIO_DADOS } from '@/config/referencia'
import type { ChamadoAnalisado } from '@/lib/analise'
import { aplicarFiltros } from '@/lib/filtros'
import { resolverPeriodo } from '@/lib/periodo'
import { useChamados } from '@/store/chamados'
import { useFiltros } from '@/store/filtros'
import type { IntervaloDatas } from '@/tipos/filtros'

export interface ChamadosFiltrados {
  /** Chamados abertos no período, do sistema e fornecedor escolhidos. */
  doPeriodo: ChamadoAnalisado[]
  /** Mesmo recorte de sistema e fornecedor, sem limitar o período (para backlog e estoque). */
  semPeriodo: ChamadoAnalisado[]
  intervalo: IntervaloDatas
}

interface Opcoes {
  /**
   * Telas de comparação (Fornecedores) mostram todos os fornecedores; o
   * selecionado no topo só fica em destaque.
   */
  ignorarFornecedor?: boolean
}

/** Aplica os filtros globais do topo sobre a base analisada. */
export function useChamadosFiltrados({ ignorarFornecedor = false }: Opcoes = {}): ChamadosFiltrados {
  const analisados = useChamados((estado) => estado.analisados)
  const { periodo, sistemaId, fornecedorId } = useFiltros(
    useShallow(({ periodo, sistemaId, fornecedorId }) => ({ periodo, sistemaId, fornecedorId })),
  )
  const fornecedorAplicado = ignorarFornecedor ? null : fornecedorId

  return useMemo(() => {
    const intervalo = resolverPeriodo(periodo, INICIO_DADOS, DATA_REFERENCIA)
    const recorte = { sistemaId, fornecedorId: fornecedorAplicado }
    const semPeriodo = aplicarFiltros(analisados, recorte)
    return { doPeriodo: aplicarFiltros(semPeriodo, recorte, intervalo), semPeriodo, intervalo }
  }, [analisados, periodo, sistemaId, fornecedorAplicado])
}
