/**
 * Gerador pseudoaleatório com semente (mulberry32). A mesma semente produz
 * sempre a mesma sequência, então os dados fictícios são idênticos em toda
 * execução e os testes conseguem verificar os insights plantados.
 */
export interface Aleatorio {
  /** Número em [0, 1). */
  proximo(): number
  /** Número real em [min, max). */
  entre(min: number, max: number): number
  /** Inteiro em [min, max], inclusive. */
  inteiro(min: number, max: number): number
  chance(probabilidade: number): boolean
  escolher<T>(itens: readonly T[]): T
  escolherPonderado<T>(opcoes: readonly (readonly [T, number])[]): T
  /** Amostra de uma distribuição de Poisson (quantidade de eventos com média `lambda`). */
  poisson(lambda: number): number
}

export function criarAleatorio(semente: number): Aleatorio {
  let estado = semente >>> 0

  const proximo = () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const aleatorio: Aleatorio = {
    proximo,
    entre: (min, max) => min + proximo() * (max - min),
    inteiro: (min, max) => Math.floor(min + proximo() * (max - min + 1)),
    chance: (probabilidade) => proximo() < probabilidade,
    escolher: (itens) => {
      if (!itens.length) throw new Error('Não é possível escolher em uma lista vazia.')
      return itens[Math.floor(proximo() * itens.length)]!
    },
    escolherPonderado: (opcoes) => {
      const total = opcoes.reduce((soma, [, peso]) => soma + peso, 0)
      if (total <= 0) throw new Error('A soma dos pesos deve ser positiva.')
      let sorteio = proximo() * total
      for (const [valor, peso] of opcoes) {
        sorteio -= peso
        if (sorteio < 0) return valor
      }
      return opcoes.at(-1)![0]
    },
    poisson: (lambda) => {
      // Algoritmo de Knuth: adequado para médias pequenas como as diárias.
      const limite = Math.exp(-lambda)
      let k = 0
      let produto = proximo()
      while (produto > limite) {
        k++
        produto *= proximo()
      }
      return k
    },
  }
  return aleatorio
}
