import { COLUNAS_IMPORTACAO, type CampoImportacao, type ColunaImportacao } from '@/config/excel'
import { normalizarTexto } from '../lista-chamados'

/** Para cada campo do modelo, o índice da coluna da planilha (ou `null` se não mapeado). */
export type Mapeamento = Record<CampoImportacao, number | null>

/** "Dt. Abertura:" → "dt abertura"; "Nº Chamado" → "n chamado". */
export function normalizarCabecalho(cabecalho: string): string {
  return normalizarTexto(cabecalho.replace(/º/g, ''))
    .replace(/[^a-z0-9?]+/g, ' ')
    .trim()
}

const contemPalavras = (texto: string, trecho: string) => ` ${texto} `.includes(` ${trecho} `)

/** Quão bem o cabeçalho corresponde à coluna do modelo: 3 = nome exato, 1 = contém o nome, 0 = nada. */
function pontuar(cabecalho: string, coluna: ColunaImportacao): number {
  const normalizado = normalizarCabecalho(cabecalho)
  if (!normalizado) return 0
  const nomes = [coluna.rotulo, ...coluna.sinonimos].map(normalizarCabecalho)
  if (nomes.includes(normalizado)) return 3
  return nomes.some((nome) => nome.length >= 4 && (contemPalavras(normalizado, nome) || contemPalavras(nome, normalizado)))
    ? 1
    : 0
}

/**
 * Sugere a correspondência entre os cabeçalhos da planilha e os campos do
 * modelo (ex.: "Dt Abertura" → Data e hora de abertura). As melhores
 * correspondências são atribuídas primeiro e cada coluna é usada uma vez só.
 */
export function sugerirMapeamento(cabecalhos: readonly string[]): Mapeamento {
  const candidatos = COLUNAS_IMPORTACAO.flatMap((coluna) =>
    cabecalhos.map((cabecalho, indice) => ({ campo: coluna.campo, indice, pontos: pontuar(cabecalho, coluna) })),
  )
    .filter((c) => c.pontos > 0)
    .toSorted((a, b) => b.pontos - a.pontos || a.indice - b.indice)

  const mapeamento = Object.fromEntries(COLUNAS_IMPORTACAO.map((c) => [c.campo, null])) as Mapeamento
  const usadas = new Set<number>()
  for (const { campo, indice } of candidatos) {
    if (mapeamento[campo] !== null || usadas.has(indice)) continue
    mapeamento[campo] = indice
    usadas.add(indice)
  }
  return mapeamento
}

/** Campos obrigatórios que ficaram sem coluna. */
export function camposObrigatoriosFaltando(mapeamento: Mapeamento): ColunaImportacao[] {
  return COLUNAS_IMPORTACAO.filter((coluna) => coluna.obrigatoria && mapeamento[coluna.campo] === null)
}
