import type { Fornecedor, FornecedorId, SistemaId, SistemaRh } from '@/tipos/catalogo'
import type { ChamadoAnalisado } from './analise'
import {
  percentualRespostaNoPrazo,
  percentualSlaCumprido,
  resumirIndicadores,
  taxaReincidencia,
  type ResumoIndicadores,
} from './indicadores'

export interface DesempenhoFornecedor {
  fornecedorId: FornecedorId
  resumo: ResumoIndicadores
  respostaNoPrazo: number | null
}

export function desempenhoFornecedores(
  lista: readonly ChamadoAnalisado[],
  instante: Date,
  fornecedores: readonly Fornecedor[],
): DesempenhoFornecedor[] {
  return fornecedores.map(({ id }) => {
    const doFornecedor = lista.filter((c) => c.fornecedorId === id)
    return {
      fornecedorId: id,
      resumo: resumirIndicadores(doFornecedor, instante),
      respostaNoPrazo: percentualRespostaNoPrazo(doFornecedor),
    }
  })
}

export type EixoRadar = 'sla' | 'resposta' | 'qualidade' | 'satisfacao' | 'agilidade'

export const ROTULOS_EIXO_RADAR: Record<EixoRadar, string> = {
  sla: 'SLA cumprido',
  resposta: '1ª resposta no prazo',
  qualidade: 'Sem reincidência',
  satisfacao: 'Satisfação',
  agilidade: 'Agilidade (MTTR)',
}

/** Rótulos curtos para os eixos do radar caberem em telas estreitas. */
export const ROTULOS_CURTOS_EIXO_RADAR: Record<EixoRadar, string> = {
  sla: 'SLA',
  resposta: '1ª resposta',
  qualidade: 'Qualidade',
  satisfacao: 'Satisfação',
  agilidade: 'Agilidade',
}

export type LinhaRadar = { eixo: EixoRadar; rotulo: string; rotuloCurto: string } & Partial<
  Record<FornecedorId, number>
>

/**
 * Converte os indicadores para uma escala comum de 0 a 100 em que "maior é
 * melhor", para comparar fornecedores no mesmo radar:
 * - SLA e 1ª resposta: o próprio percentual;
 * - Qualidade: 100 − reincidência;
 * - Satisfação: nota 1→0 e 5→100;
 * - Agilidade: o menor MTTR entre os fornecedores vale 100; os demais, proporcionalmente.
 */
export function linhasRadar(desempenhos: readonly DesempenhoFornecedor[]): LinhaRadar[] {
  const mttrs = desempenhos.flatMap((d) => (d.resumo.mttrHoras ? [d.resumo.mttrHoras] : []))
  const melhorMttr = mttrs.length ? Math.min(...mttrs) : null

  const pontuar: Record<EixoRadar, (d: DesempenhoFornecedor) => number | null> = {
    sla: (d) => d.resumo.percentualSla,
    resposta: (d) => d.respostaNoPrazo,
    qualidade: (d) => (d.resumo.taxaReincidencia === null ? null : 1 - d.resumo.taxaReincidencia),
    satisfacao: (d) => (d.resumo.satisfacao === null ? null : (d.resumo.satisfacao - 1) / 4),
    agilidade: (d) => (d.resumo.mttrHoras && melhorMttr ? melhorMttr / d.resumo.mttrHoras : null),
  }

  return (Object.keys(pontuar) as EixoRadar[]).map((eixo) => {
    const linha: LinhaRadar = { eixo, rotulo: ROTULOS_EIXO_RADAR[eixo], rotuloCurto: ROTULOS_CURTOS_EIXO_RADAR[eixo] }
    for (const desempenho of desempenhos) {
      const valor = pontuar[eixo](desempenho)
      if (valor !== null) linha[desempenho.fornecedorId] = Math.round(valor * 1000) / 10
    }
    return linha
  })
}

export interface PontoVelocidadeQualidade {
  sistemaId: SistemaId
  fornecedorId: FornecedorId
  /** % resolvido no prazo (eixo X). */
  noPrazo: number
  /** % de reincidência (eixo Y). */
  reincidencia: number
  volume: number
}

/**
 * Um ponto por sistema de RH: velocidade (% no prazo) × qualidade
 * (reincidência). Mostra que cumprir prazo não é o mesmo que resolver bem.
 */
export function pontosVelocidadeQualidade(
  lista: readonly ChamadoAnalisado[],
  sistemas: readonly SistemaRh[],
  volumeMinimo = 5,
): PontoVelocidadeQualidade[] {
  return sistemas.flatMap((sistema) => {
    const doSistema = lista.filter((c) => c.sistemaId === sistema.id && c.tipo !== 'evolutiva')
    const noPrazo = percentualSlaCumprido(doSistema)
    const reincidencia = taxaReincidencia(doSistema)
    if (doSistema.length < volumeMinimo || noPrazo === null || reincidencia === null) return []
    return [{ sistemaId: sistema.id, fornecedorId: sistema.fornecedorId, noPrazo, reincidencia, volume: doSistema.length }]
  })
}

export interface CausaRecorrente {
  categoria: string
  quantidade: number
  reincidentes: number
}

/** Categorias com mais chamados do fornecedor (incidentes e requisições), com quantos reincidiram. */
export function rankingCausas(
  lista: readonly ChamadoAnalisado[],
  fornecedorId: FornecedorId,
  limite = 5,
): CausaRecorrente[] {
  const porCategoria = Map.groupBy(
    lista.filter((c) => c.fornecedorId === fornecedorId && c.tipo !== 'evolutiva'),
    (c) => c.categoria,
  )
  return [...porCategoria.entries()]
    .map(([categoria, chamados]) => ({
      categoria,
      quantidade: chamados.length,
      reincidentes: chamados.filter((c) => c.reincidente).length,
    }))
    .toSorted((a, b) => b.quantidade - a.quantidade || b.reincidentes - a.reincidentes)
    .slice(0, limite)
}
