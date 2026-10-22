/** Cálculos de contraste conforme WCAG 2.x (https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio). */

const HEX_VALIDO = /^#([0-9a-f]{6})$/i

function canalLinear(valor8bits: number): number {
  const c = valor8bits / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Luminância relativa de uma cor no formato `#rrggbb`. */
export function luminanciaRelativa(hex: string): number {
  const correspondencia = HEX_VALIDO.exec(hex)
  if (!correspondencia?.[1]) {
    throw new Error(`Cor inválida: "${hex}". Use o formato #rrggbb.`)
  }
  const valor = correspondencia[1]
  const [r, g, b] = [0, 2, 4].map((i) => canalLinear(parseInt(valor.slice(i, i + 2), 16)))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

/** Razão de contraste entre duas cores, de 1 (igual) a 21 (preto × branco). */
export function razaoContraste(corA: string, corB: string): number {
  const [clara, escura] = [luminanciaRelativa(corA), luminanciaRelativa(corB)].sort((a, b) => b - a)
  return (clara! + 0.05) / (escura! + 0.05)
}

export type UsoDaCor = 'texto' | 'texto-grande' | 'grafico'

const MINIMO_AA: Record<UsoDaCor, number> = {
  texto: 4.5,
  'texto-grande': 3,
  grafico: 3,
}

/** Indica se o par de cores atende ao nível AA para o uso informado. */
export function atendeAA(corFrente: string, corFundo: string, uso: UsoDaCor = 'texto'): boolean {
  return razaoContraste(corFrente, corFundo) >= MINIMO_AA[uso]
}
