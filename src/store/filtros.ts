import { create } from 'zustand'
import { SISTEMAS_RH } from '@/config/catalogo'
import { PERIODO_PADRAO } from '@/config/referencia'
import { normalizarFiltros } from '@/lib/filtros'
import type { FornecedorId, SistemaId } from '@/tipos/catalogo'
import type { FiltrosGlobais, PeriodoId } from '@/tipos/filtros'

export const FILTROS_INICIAIS: FiltrosGlobais = {
  periodo: PERIODO_PADRAO,
  sistemaId: null,
  fornecedorId: null,
}

interface EstadoFiltros extends FiltrosGlobais {
  definirPeriodo: (periodo: PeriodoId) => void
  definirSistema: (sistemaId: SistemaId | null) => void
  definirFornecedor: (fornecedorId: FornecedorId | null) => void
  /** Aplica de uma vez o recorte de sistema e/ou fornecedor (ex.: ao seguir um insight). */
  aplicarRecorte: (recorte: Partial<Pick<FiltrosGlobais, 'sistemaId' | 'fornecedorId'>>) => void
  limparFiltros: () => void
}

/**
 * Filtros globais do topo (período, sistema de RH e fornecedor).
 * Todas as telas leem daqui, então mudar um filtro atualiza tudo.
 */
export const useFiltros = create<EstadoFiltros>()((set) => ({
  ...FILTROS_INICIAIS,
  definirPeriodo: (periodo) => set({ periodo }),
  definirSistema: (sistemaId) => set({ sistemaId }),
  definirFornecedor: (fornecedorId) =>
    set((estado) =>
      normalizarFiltros(
        { periodo: estado.periodo, sistemaId: estado.sistemaId, fornecedorId },
        SISTEMAS_RH,
      ),
    ),
  aplicarRecorte: (recorte) =>
    set((estado) =>
      normalizarFiltros(
        { periodo: estado.periodo, sistemaId: estado.sistemaId, fornecedorId: estado.fornecedorId, ...recorte },
        SISTEMAS_RH,
      ),
    ),
  limparFiltros: () => set(FILTROS_INICIAIS),
}))
