import { describe, expect, it } from 'vitest'
import { atendeAA, luminanciaRelativa, razaoContraste } from './contraste'

describe('luminanciaRelativa', () => {
  it('retorna 0 para preto e 1 para branco', () => {
    expect(luminanciaRelativa('#000000')).toBe(0)
    expect(luminanciaRelativa('#ffffff')).toBe(1)
  })

  it('rejeita cores fora do formato #rrggbb', () => {
    expect(() => luminanciaRelativa('#fff')).toThrow('Cor inválida')
    expect(() => luminanciaRelativa('azul')).toThrow('Cor inválida')
  })
})

describe('razaoContraste', () => {
  it('vai de 1 (cores iguais) a 21 (preto e branco)', () => {
    expect(razaoContraste('#00305e', '#00305e')).toBe(1)
    expect(razaoContraste('#000000', '#ffffff')).toBe(21)
  })

  it('não depende da ordem das cores', () => {
    expect(razaoContraste('#ffffff', '#00305e')).toBeCloseTo(razaoContraste('#00305e', '#ffffff'))
  })
})

describe('atendeAA', () => {
  it('exige 4,5:1 para texto comum e 3:1 para gráficos', () => {
    // Laranja de status sobre branco: ~3,05:1
    expect(atendeAA('#e8730c', '#ffffff', 'texto')).toBe(false)
    expect(atendeAA('#e8730c', '#ffffff', 'grafico')).toBe(true)
  })
})
