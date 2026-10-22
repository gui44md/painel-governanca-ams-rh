import { describe, expect, it } from 'vitest'
import { criarChamado } from './teste/fabrica'
import { detectarReincidencias, ehReincidente } from './reincidencia'

const d = (dia: number, hora = 9) => new Date(2026, 9, dia, hora)

const resolvido = (id: string, abertura: number, resolucao: number, extra = {}) =>
  criarChamado({ id, abertoEm: d(abertura), passos: [['resolvido', d(resolucao)]], causa: 'sincronismo', ...extra })

describe('detectarReincidencias', () => {
  it('marca repetição de mesmo sistema e causa em até 15 dias após a resolução', () => {
    const original = resolvido('A', 1, 2)
    const repetido = resolvido('B', 10, 11)
    const info = detectarReincidencias([repetido, original], 15)
    expect(info.get('A')).toEqual({ reaberto: false, repeticaoDe: null })
    expect(info.get('B')).toEqual({ reaberto: false, repeticaoDe: 'A' })
  })

  it('não marca depois da janela de 15 dias', () => {
    const info = detectarReincidencias([resolvido('A', 1, 2), resolvido('B', 18, 19)], 15)
    expect(info.get('B')?.repeticaoDe).toBeNull()
  })

  it('não marca se o anterior ainda não estava resolvido', () => {
    const info = detectarReincidencias([resolvido('A', 1, 12), resolvido('B', 10, 11)], 15)
    expect(info.get('B')?.repeticaoDe).toBeNull()
  })

  it('exige mesmo sistema e mesma causa (sem diferenciar maiúsculas)', () => {
    const chamados = [
      resolvido('A', 1, 2),
      resolvido('B', 5, 6, { sistemaId: 'folha' }),
      resolvido('C', 5, 6, { causa: 'outra' }),
      resolvido('D', 7, 8, { causa: ' Sincronismo ' }),
    ]
    const info = detectarReincidencias(chamados, 15)
    expect(info.get('B')?.repeticaoDe).toBeNull()
    expect(info.get('C')?.repeticaoDe).toBeNull()
    expect(info.get('D')?.repeticaoDe).toBe('A')
  })

  it('aponta para a resolução mais recente', () => {
    const info = detectarReincidencias([resolvido('A', 1, 2), resolvido('B', 3, 4), resolvido('C', 6, 7)], 15)
    expect(info.get('C')?.repeticaoDe).toBe('B')
  })

  it('ignora evolutivas', () => {
    const info = detectarReincidencias([resolvido('A', 1, 2), resolvido('B', 3, 4, { tipo: 'evolutiva' })], 15)
    expect(info.has('B')).toBe(false)
  })

  it('carrega a marcação de reaberto do próprio chamado', () => {
    const info = detectarReincidencias([resolvido('A', 1, 2, { reaberto: true })], 15)
    expect(ehReincidente(info.get('A') ?? null)).toBe(true)
  })
})

describe('ehReincidente', () => {
  it('é falso sem reabertura nem repetição', () => {
    expect(ehReincidente({ reaberto: false, repeticaoDe: null })).toBe(false)
    expect(ehReincidente(null)).toBe(false)
  })
})
