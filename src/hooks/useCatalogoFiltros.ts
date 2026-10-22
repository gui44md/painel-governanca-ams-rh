import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { DATA_REFERENCIA, INICIO_DADOS } from '@/config/referencia'
import type { CatalogoFiltros } from '@/lib/filtros'
import { opcoesPeriodo } from '@/lib/periodo'

const CATALOGO: CatalogoFiltros = {
  periodos: opcoesPeriodo(INICIO_DADOS, DATA_REFERENCIA),
  sistemas: SISTEMAS_RH,
  fornecedores: FORNECEDORES,
}

/** Opções disponíveis para os filtros globais (estáticas durante a sessão). */
export function useCatalogoFiltros(): CatalogoFiltros {
  return CATALOGO
}
