import { describe, expect, it } from 'vitest'
import { criarAleatorio } from './aleatorio'

describe('criarAleatorio', () => {
  it('é determinístico para a mesma semente', () => {
    const a = criarAleatorio(42)
    const b = criarAleatorio(42)
    expect(Array.from({ length: 5 }, () => a.proximo())).toEqual(Array.from({ length: 5 }, () => b.proximo()))
  })

  it('sementes diferentes geram sequências diferentes', () => {
    expect(criarAleatorio(1).proximo()).not.toBe(criarAleatorio(2).proximo())
  })

  it('respeita os intervalos', () => {
    const aleatorio = criarAleatorio(7)
    for (let i = 0; i < 500; i++) {
      const inteiro = aleatorio.inteiro(1, 5)
      expect(inteiro).toBeGreaterThanOrEqual(1)
      expect(inteiro).toBeLessThanOrEqual(5)
      const real = aleatorio.entre(10, 20)
      expect(real).toBeGreaterThanOrEqual(10)
      expect(real).toBeLessThan(20)
    }
  })

  it('escolhe respeitando os pesos', () => {
    const aleatorio = criarAleatorio(3)
    const sorteios = Array.from({ length: 2000 }, () =>
      aleatorio.escolherPonderado([
        ['a', 9],
        ['b', 1],
      ] as const),
    )
    const proporcaoA = sorteios.filter((s) => s === 'a').length / sorteios.length
    expect(proporcaoA).toBeGreaterThan(0.85)
    expect(proporcaoA).toBeLessThan(0.95)
  })

  it('poisson tem média próxima de lambda', () => {
    const aleatorio = criarAleatorio(11)
    const amostras = Array.from({ length: 3000 }, () => aleatorio.poisson(2.5))
    const media = amostras.reduce((a, b) => a + b, 0) / amostras.length
    expect(media).toBeGreaterThan(2.3)
    expect(media).toBeLessThan(2.7)
  })

  it('rejeita listas vazias e pesos nulos', () => {
    const aleatorio = criarAleatorio(1)
    expect(() => aleatorio.escolher([])).toThrow()
    expect(() => aleatorio.escolherPonderado([['a', 0]])).toThrow()
  })
})
