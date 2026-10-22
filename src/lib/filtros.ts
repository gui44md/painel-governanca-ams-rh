import type { Fornecedor, FornecedorId, SistemaRh } from '@/tipos/catalogo'
import type { Chamado } from '@/tipos/chamado'
import type { FiltrosGlobais, IntervaloDatas } from '@/tipos/filtros'
import type { OpcaoPeriodo } from './periodo'

/** Filtra por sistema e fornecedor e, se informado, pela data de abertura no intervalo. */
export function aplicarFiltros<T extends Pick<Chamado, 'sistemaId' | 'fornecedorId' | 'abertoEm'>>(
  chamados: readonly T[],
  filtros: Pick<FiltrosGlobais, 'sistemaId' | 'fornecedorId'>,
  intervalo?: IntervaloDatas,
): T[] {
  return chamados.filter(
    (chamado) =>
      (!filtros.sistemaId || chamado.sistemaId === filtros.sistemaId) &&
      (!filtros.fornecedorId || chamado.fornecedorId === filtros.fornecedorId) &&
      (!intervalo ||
        (chamado.abertoEm.getTime() >= intervalo.inicio.getTime() &&
          chamado.abertoEm.getTime() <= intervalo.fim.getTime())),
  )
}

/** Sistemas que podem ser escolhidos dado o fornecedor selecionado (todos, se nenhum). */
export function sistemasDisponiveis(
  sistemas: readonly SistemaRh[],
  fornecedorId: FornecedorId | null,
): SistemaRh[] {
  return fornecedorId ? sistemas.filter((s) => s.fornecedorId === fornecedorId) : [...sistemas]
}

/**
 * Garante uma combinação coerente: se o sistema escolhido não é sustentado pelo
 * fornecedor escolhido, o filtro de sistema é limpo.
 */
export function normalizarFiltros(filtros: FiltrosGlobais, sistemas: readonly SistemaRh[]): FiltrosGlobais {
  if (!filtros.sistemaId || !filtros.fornecedorId) return filtros
  const sistema = sistemas.find((s) => s.id === filtros.sistemaId)
  return sistema?.fornecedorId === filtros.fornecedorId ? filtros : { ...filtros, sistemaId: null }
}

export interface CatalogoFiltros {
  periodos: readonly OpcaoPeriodo[]
  sistemas: readonly SistemaRh[]
  fornecedores: readonly Fornecedor[]
}

/** Descrição legível dos filtros aplicados, na ordem período → sistema → fornecedor. */
export function descreverFiltros(filtros: FiltrosGlobais, catalogo: CatalogoFiltros): string[] {
  const periodo = catalogo.periodos.find((p) => p.id === filtros.periodo)?.rotulo
  const sistema = catalogo.sistemas.find((s) => s.id === filtros.sistemaId)?.nome
  const fornecedor = catalogo.fornecedores.find((f) => f.id === filtros.fornecedorId)?.nome
  return [periodo, sistema ?? 'Todos os sistemas', fornecedor ?? 'Todos os fornecedores'].filter(
    (texto): texto is string => Boolean(texto),
  )
}

/** Quantos filtros estão diferentes do estado inicial (para o selo "Filtros (n)"). */
export function contarFiltrosAtivos(filtros: FiltrosGlobais, padrao: FiltrosGlobais): number {
  return (Object.keys(padrao) as (keyof FiltrosGlobais)[]).filter((chave) => filtros[chave] !== padrao[chave])
    .length
}
