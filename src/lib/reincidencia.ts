import { MS_POR_DIA } from './datas'
import type { Chamado } from '@/tipos/chamado'

export interface InfoReincidencia {
  /** O próprio chamado foi reaberto pelo usuário depois de resolvido. */
  reaberto: boolean
  /** ID do chamado anterior (mesmo sistema e mesma causa) que este repete. */
  repeticaoDe: string | null
}

export function ehReincidente(info: InfoReincidencia | null): boolean {
  return Boolean(info && (info.reaberto || info.repeticaoDe))
}

const chaveCausa = (chamado: Pick<Chamado, 'sistemaId' | 'causa'>) =>
  `${chamado.sistemaId}|${chamado.causa.trim().toLowerCase()}`

/**
 * Detecta reincidência (CONCEITO.md, seção 9): chamado reaberto, ou repetido
 * (mesmo sistema e mesma causa aberto até `janelaDias` após a resolução de um
 * chamado anterior). Evolutivas não entram: são melhorias, não falhas.
 * Retorna um mapa por ID com a informação de cada incidente/requisição.
 */
export function detectarReincidencias(
  chamados: readonly Chamado[],
  janelaDias: number,
): Map<string, InfoReincidencia> {
  const janelaMs = janelaDias * MS_POR_DIA
  const ordenados = chamados
    .filter((chamado) => chamado.tipo !== 'evolutiva')
    .toSorted((a, b) => a.abertoEm.getTime() - b.abertoEm.getTime())

  const anterioresPorCausa = new Map<string, Chamado[]>()
  const resultado = new Map<string, InfoReincidencia>()

  for (const chamado of ordenados) {
    const chave = chaveCausa(chamado)
    const anteriores = anterioresPorCausa.get(chave) ?? []
    const abertura = chamado.abertoEm.getTime()

    let origem: Chamado | null = null
    for (const anterior of anteriores) {
      const resolucao = anterior.resolvidoEm?.getTime()
      if (resolucao === undefined || resolucao > abertura || abertura - resolucao > janelaMs) continue
      if (!origem || resolucao > origem.resolvidoEm!.getTime()) origem = anterior
    }

    resultado.set(chamado.id, { reaberto: chamado.reaberto, repeticaoDe: origem?.id ?? null })
    anteriores.push(chamado)
    anterioresPorCausa.set(chave, anteriores)
  }

  return resultado
}
