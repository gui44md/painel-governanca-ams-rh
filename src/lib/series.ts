import type { ChamadoAnalisado } from './analise'
import { chaveMes } from './datas'
import { percentualSlaCumprido } from './indicadores'
import { listarMeses } from './periodo'

export interface PontoMensal {
  /** AAAA-MM */
  mes: string
  inicioDoMes: Date
  valor: number | null
  /** Quantos chamados entraram no cálculo (para o tooltip). */
  base: number
}

/** Aplica um cálculo aos chamados abertos em cada mês entre `inicio` e `fim`. */
export function serieMensal(
  lista: readonly ChamadoAnalisado[],
  inicio: Date,
  fim: Date,
  calcular: (chamadosDoMes: ChamadoAnalisado[]) => number | null,
): PontoMensal[] {
  const porMes = Map.groupBy(lista, (chamado) => chaveMes(chamado.abertoEm))
  return listarMeses(inicio, fim).map((inicioDoMes) => {
    const doMes = porMes.get(chaveMes(inicioDoMes)) ?? []
    return { mes: chaveMes(inicioDoMes), inicioDoMes, valor: calcular(doMes), base: doMes.length }
  })
}

/** % de SLA cumprido mês a mês (base = chamados resolvidos com SLA). */
export function slaPorMes(lista: readonly ChamadoAnalisado[], inicio: Date, fim: Date): PontoMensal[] {
  const resolvidosComSla = lista.filter((chamado) => chamado.sla && chamado.sla.cumprido !== null)
  return serieMensal(resolvidosComSla, inicio, fim, percentualSlaCumprido)
}

export interface Contagem<Chave extends string> {
  chave: Chave
  quantidade: number
}

/** Conta itens por chave, mantendo a ordem de `chaves` (inclusive as que têm zero). */
export function contarPor<T, Chave extends string>(
  lista: readonly T[],
  chaveDe: (item: T) => Chave,
  chaves: readonly Chave[],
): Contagem<Chave>[] {
  const contagem = new Map<Chave, number>()
  for (const item of lista) contagem.set(chaveDe(item), (contagem.get(chaveDe(item)) ?? 0) + 1)
  return chaves.map((chave) => ({ chave, quantidade: contagem.get(chave) ?? 0 }))
}
