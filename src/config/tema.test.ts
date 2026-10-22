import { describe, expect, it } from 'vitest'
import { atendeAA } from '@/lib/cores/contraste'
import cssBruto from '../index.css?raw'
import { cores, type NomeCor } from './tema'

const paraKebab = (nome: string) => nome.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`)

function tokensDoCss(css: string): Map<string, string> {
  const tokens = new Map<string, string>()
  for (const [, nome, valor] of css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)) {
    tokens.set(nome!, valor!.toLowerCase())
  }
  return tokens
}

describe('tokens de cor', () => {
  const tokensCss = tokensDoCss(cssBruto)

  it('tema.ts e index.css têm exatamente os mesmos tokens e valores', () => {
    const tokensTs = new Map(Object.entries(cores).map(([nome, valor]) => [paraKebab(nome), valor]))
    expect(Object.fromEntries(tokensTs)).toEqual(Object.fromEntries(tokensCss))
  })

  it('mantém as cores da seção 5 do conceito', () => {
    expect(cores.primaria).toBe('#00305e')
    expect(cores.destaque).toBe('#ffc20e')
    expect(cores.fundo).toBe('#f4f6f9')
    expect(cores.texto).toBe('#1f2933')
    expect(cores.noPrazo).toBe('#1e9e5a')
    expect(cores.emRisco).toBe('#e8730c')
    expect(cores.estourado).toBe('#d64545')
    expect(cores.concluido).toBe('#64748b')
  })
})

describe('contraste WCAG AA dos pares usados na interface', () => {
  const paresDeTexto: [NomeCor, NomeCor][] = [
    ['texto', 'fundo'],
    ['texto', 'superficie'],
    ['textoSuave', 'fundo'],
    ['textoSuave', 'superficie'],
    ['superficie', 'primaria'],
    ['menuTexto', 'primaria'],
    ['destaque', 'primaria'],
    ['primaria', 'destaque'],
    ['primaria', 'destaqueClaro'],
    ['noPrazoTexto', 'noPrazoFundo'],
    ['emRiscoTexto', 'emRiscoFundo'],
    ['estouradoTexto', 'estouradoFundo'],
    ['concluidoTexto', 'concluidoFundo'],
  ]

  it.each(paresDeTexto)('%s sobre %s atende 4,5:1', (frente, fundo) => {
    expect(atendeAA(cores[frente], cores[fundo], 'texto')).toBe(true)
  })

  const coresDeStatus: NomeCor[] = ['noPrazo', 'emRisco', 'estourado', 'concluido']

  it.each(coresDeStatus)('%s atende 3:1 como elemento gráfico sobre a superfície', (cor) => {
    expect(atendeAA(cores[cor], cores.superficie, 'grafico')).toBe(true)
  })
})
