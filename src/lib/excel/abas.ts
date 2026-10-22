import type { StatusSla } from '@/tipos/sla'

/** Representação neutra de uma planilha, testável sem a biblioteca de Excel. */

export type EstiloCelula = 'titulo' | 'subtitulo' | 'cabecalho' | 'total' | StatusSla

export type FormatoCelula = 'texto' | 'inteiro' | 'decimal' | 'percentual' | 'data' | 'dataHora'

export interface Celula {
  valor: string | number | Date | null
  formato?: FormatoCelula
  estilo?: EstiloCelula
}

export interface DefinicaoAba {
  nome: string
  linhas: Celula[][]
  /** Largura de cada coluna, em caracteres. */
  larguras: number[]
  /** Índice da linha de cabeçalho da tabela (para o autofiltro). */
  linhaCabecalho: number
  /** Ativa o filtro do Excel no cabeçalho da tabela. */
  filtro: boolean
}

export const texto = (valor: string | null, estilo?: EstiloCelula): Celula => ({ valor, formato: 'texto', estilo })
export const numero = (valor: number | null, formato: FormatoCelula = 'inteiro', estilo?: EstiloCelula): Celula => ({
  valor,
  formato,
  estilo,
})
export const data = (valor: Date | null, formato: 'data' | 'dataHora' = 'dataHora'): Celula => ({ valor, formato })
export const cabecalho = (rotulos: readonly string[]): Celula[] => rotulos.map((r) => texto(r, 'cabecalho'))
