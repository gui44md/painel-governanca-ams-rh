import { PRIORIDADES } from '@/config/chamados'
import type { EstadoChamado, Prioridade, TipoChamado } from '@/tipos/chamado'
import type { ChamadoAnalisado } from './analise'

export type FiltroEstado = EstadoChamado | 'abertos'
export type OrdemChamados = 'recentes' | 'consumo-sla'

/** Filtros locais da tela de Chamados (os globais vêm da barra do topo). */
export interface CriteriosChamados {
  busca: string
  tipo: TipoChamado | null
  prioridade: Prioridade | null
  estado: FiltroEstado | null
  somenteReincidentes: boolean
  ordem: OrdemChamados
}

export const CRITERIOS_PADRAO: CriteriosChamados = {
  busca: '',
  tipo: null,
  prioridade: null,
  estado: null,
  somenteReincidentes: false,
  ordem: 'recentes',
}

const TIPOS: readonly TipoChamado[] = ['incidente', 'requisicao', 'evolutiva']
const ESTADOS: readonly FiltroEstado[] = ['abertos', 'aberto', 'em-atendimento', 'aguardando-usuario', 'resolvido']
const ORDENS: readonly OrdemChamados[] = ['recentes', 'consumo-sla']

/** Minúsculas e sem acentos, para a busca encontrar "sincronizacao" em "sincronização". */
export function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

/** Prioridade usada pelo SLA (pode ter sido elevada pela regra do fechamento). */
export function prioridadeExibida(chamado: ChamadoAnalisado): Prioridade {
  return chamado.sla?.prioridadeEfetiva ?? chamado.prioridade
}

export function filtrarChamados(
  lista: readonly ChamadoAnalisado[],
  criterios: CriteriosChamados,
): ChamadoAnalisado[] {
  const termo = normalizarTexto(criterios.busca)
  return lista.filter((chamado) => {
    if (criterios.tipo && chamado.tipo !== criterios.tipo) return false
    if (criterios.prioridade && prioridadeExibida(chamado) !== criterios.prioridade) return false
    if (criterios.estado === 'abertos' && !chamado.emAberto) return false
    if (criterios.estado && criterios.estado !== 'abertos' && chamado.estado !== criterios.estado) return false
    if (criterios.somenteReincidentes && !chamado.reincidente) return false
    if (termo) {
      const texto = normalizarTexto(`${chamado.id} ${chamado.titulo} ${chamado.descricao} ${chamado.categoria}`)
      if (!texto.includes(termo)) return false
    }
    return true
  })
}

/**
 * "Mais recentes" ordena pela abertura. "Consumo de SLA" coloca primeiro os
 * chamados em aberto mais próximos de estourar, depois os resolvidos.
 */
export function ordenarChamados(lista: readonly ChamadoAnalisado[], ordem: OrdemChamados): ChamadoAnalisado[] {
  const recentes = (a: ChamadoAnalisado, b: ChamadoAnalisado) => b.abertoEm.getTime() - a.abertoEm.getTime()
  if (ordem === 'recentes') return lista.toSorted(recentes)
  const urgencia = (c: ChamadoAnalisado) => (c.emAberto ? (c.sla?.fracaoConsumida ?? -1) : -2)
  return lista.toSorted((a, b) => urgencia(b) - urgencia(a) || recentes(a, b))
}

export function agruparPorEstado(lista: readonly ChamadoAnalisado[]): Record<EstadoChamado, ChamadoAnalisado[]> {
  const grupos: Record<EstadoChamado, ChamadoAnalisado[]> = {
    aberto: [],
    'em-atendimento': [],
    'aguardando-usuario': [],
    resolvido: [],
  }
  for (const chamado of lista) grupos[chamado.estado].push(chamado)
  return grupos
}

const valorDaLista = <T extends string>(valor: string | null, permitidos: readonly T[]): T | null =>
  valor && (permitidos as readonly string[]).includes(valor) ? (valor as T) : null

/** Lê os filtros da URL; valores desconhecidos são ignorados. */
export function lerCriterios(parametros: URLSearchParams): CriteriosChamados {
  return {
    busca: parametros.get('busca') ?? '',
    tipo: valorDaLista(parametros.get('tipo'), TIPOS),
    prioridade: valorDaLista(parametros.get('prioridade'), PRIORIDADES),
    estado: valorDaLista(parametros.get('estado'), ESTADOS),
    somenteReincidentes: parametros.get('reincidentes') === '1',
    ordem: valorDaLista(parametros.get('ordem'), ORDENS) ?? CRITERIOS_PADRAO.ordem,
  }
}

/** Escreve os filtros na URL, omitindo os valores padrão. */
export function escreverCriterios(criterios: CriteriosChamados, base?: URLSearchParams): URLSearchParams {
  const parametros = new URLSearchParams(base)
  const definir = (chave: string, valor: string | null) =>
    valor ? parametros.set(chave, valor) : parametros.delete(chave)
  definir('busca', criterios.busca.trim() || null)
  definir('tipo', criterios.tipo)
  definir('prioridade', criterios.prioridade)
  definir('estado', criterios.estado)
  definir('reincidentes', criterios.somenteReincidentes ? '1' : null)
  definir('ordem', criterios.ordem === CRITERIOS_PADRAO.ordem ? null : criterios.ordem)
  return parametros
}

export function contarCriteriosAtivos(criterios: CriteriosChamados): number {
  return [
    criterios.busca.trim(),
    criterios.tipo,
    criterios.prioridade,
    criterios.estado,
    criterios.somenteReincidentes || null,
  ].filter(Boolean).length
}

export interface Pagina<T> {
  itens: T[]
  pagina: number
  totalPaginas: number
}

/** Página `pagina` (começando em 1), corrigida para o intervalo válido. */
export function paginar<T>(lista: readonly T[], pagina: number, porPagina: number): Pagina<T> {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina))
  const atual = Math.min(Math.max(1, Math.floor(pagina) || 1), totalPaginas)
  return { itens: lista.slice((atual - 1) * porPagina, atual * porPagina), pagina: atual, totalPaginas }
}
