import { MS_POR_DIA, MS_POR_HORA } from './datas'
import type { ChamadoAnalisado } from './analise'
import type { Chamado } from '@/tipos/chamado'

/**
 * Indicadores da seção 9 do conceito. Todos são funções puras sobre listas já
 * filtradas e retornam `null` quando não há base para o cálculo (evita mostrar
 * "0%" quando, na verdade, não existe nenhum chamado).
 */

const media = (valores: readonly number[]): number | null =>
  valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : null

const razao = (parte: number, total: number): number | null => (total ? parte / total : null)

const naoEvolutivas = <T extends Pick<Chamado, 'tipo'>>(lista: readonly T[]) =>
  lista.filter((chamado) => chamado.tipo !== 'evolutiva')

/** % SLA cumprido: resolvidos no prazo ÷ total de resolvidos (só tipos com SLA). */
export function percentualSlaCumprido(lista: readonly ChamadoAnalisado[]): number | null {
  const cumprimentos = lista.flatMap((chamado) =>
    chamado.sla && chamado.sla.cumprido !== null ? [chamado.sla.cumprido] : [],
  )
  return razao(cumprimentos.filter(Boolean).length, cumprimentos.length)
}

/** MTTR: média, em horas corridas, entre abertura e resolução (incidentes e requisições). */
export function mttrHoras(lista: readonly ChamadoAnalisado[]): number | null {
  const resolvidos = naoEvolutivas(lista).filter((chamado) => !chamado.emAberto && chamado.resolvidoEm)
  return media(resolvidos.map((chamado) => (chamado.resolvidoEm!.getTime() - chamado.abertoEm.getTime()) / MS_POR_HORA))
}

/** % de chamados cuja primeira resposta saiu dentro do prazo (dos que já tiveram resposta). */
export function percentualRespostaNoPrazo(lista: readonly ChamadoAnalisado[]): number | null {
  const respostas = lista.flatMap((chamado) =>
    chamado.sla && chamado.sla.respostaNoPrazo !== null ? [chamado.sla.respostaNoPrazo] : [],
  )
  return razao(respostas.filter(Boolean).length, respostas.length)
}

/** Taxa de reincidência: reabertos ou repetidos ÷ total de incidentes e requisições. */
export function taxaReincidencia(lista: readonly ChamadoAnalisado[]): number | null {
  const base = naoEvolutivas(lista)
  return razao(base.filter((chamado) => chamado.reincidente).length, base.length)
}

/** Satisfação: média das notas de 1 a 5 dos chamados avaliados. */
export function satisfacaoMedia(lista: readonly Pick<Chamado, 'satisfacao'>[]): number | null {
  return media(lista.flatMap((chamado) => (chamado.satisfacao === null ? [] : [chamado.satisfacao])))
}

/** O chamado estava em aberto naquele instante? */
export function estavaEmAberto(chamado: Pick<Chamado, 'abertoEm' | 'resolvidoEm'>, instante: Date): boolean {
  return (
    chamado.abertoEm.getTime() <= instante.getTime() &&
    (chamado.resolvidoEm === null || chamado.resolvidoEm.getTime() > instante.getTime())
  )
}

/** Incidentes e requisições em aberto no instante. */
export function chamadosEmAberto(lista: readonly Chamado[], instante: Date): number {
  return naoEvolutivas(lista).filter((chamado) => estavaEmAberto(chamado, instante)).length
}

export interface Backlog {
  quantidade: number
  /** Idade média, em dias, dos itens em aberto no instante. */
  idadeMediaDias: number | null
}

/** Backlog: itens em aberto no instante, com idade média. */
export function backlog(lista: readonly Chamado[], instante: Date): Backlog {
  const abertos = lista.filter((chamado) => estavaEmAberto(chamado, instante))
  return {
    quantidade: abertos.length,
    idadeMediaDias: media(abertos.map((chamado) => (instante.getTime() - chamado.abertoEm.getTime()) / MS_POR_DIA)),
  }
}

export function backlogEvolutivas(lista: readonly Chamado[], instante: Date): Backlog {
  return backlog(
    lista.filter((chamado) => chamado.tipo === 'evolutiva'),
    instante,
  )
}

export interface AcaoParaAderencia {
  prazo: Date
  concluidaEm: Date | null
}

/** Aderência ao plano de ação: ações concluídas no prazo ÷ total de ações. */
export function aderenciaPlanoAcao(acoes: readonly AcaoParaAderencia[]): number | null {
  const noPrazo = acoes.filter((acao) => acao.concluidaEm && acao.concluidaEm.getTime() <= acao.prazo.getTime())
  return razao(noPrazo.length, acoes.length)
}

export interface ResumoIndicadores {
  volume: number
  percentualSla: number | null
  mttrHoras: number | null
  taxaReincidencia: number | null
  satisfacao: number | null
  chamadosEmAberto: number
  backlogEvolutivas: Backlog
}

/**
 * Indicadores de fluxo (SLA, MTTR, reincidência, satisfação, volume) sobre a
 * lista; indicadores de estoque (abertos, backlog) no `instante` informado.
 */
export function resumirIndicadores(lista: readonly ChamadoAnalisado[], instante: Date): ResumoIndicadores {
  return {
    volume: lista.length,
    percentualSla: percentualSlaCumprido(lista),
    mttrHoras: mttrHoras(lista),
    taxaReincidencia: taxaReincidencia(lista),
    satisfacao: satisfacaoMedia(lista),
    chamadosEmAberto: chamadosEmAberto(lista, instante),
    backlogEvolutivas: backlogEvolutivas(lista, instante),
  }
}

/** Diferença entre o valor atual e o anterior (`null` se faltar algum). */
export function variacao(atual: number | null, anterior: number | null): number | null {
  return atual === null || anterior === null ? null : atual - anterior
}
