import { describe, expect, it } from 'vitest'
import { dataDoCampo } from './datas'
import { proximoId } from './identificadores'
import { reviverDatas } from './persistencia'

describe('proximoId', () => {
  it('continua a partir do maior número existente', () => {
    expect(proximoId('ACA', ['ACA-001', 'ACA-007', 'REU-020'])).toBe('ACA-008')
    expect(proximoId('REU', [])).toBe('REU-001')
  })
})

describe('reviverDatas', () => {
  it('devolve datas ISO como Date e mantém o resto', () => {
    const data = new Date(2026, 9, 27, 17)
    const lido = JSON.parse(JSON.stringify({ data, texto: '2026-10-27', n: 1 }), reviverDatas)
    expect(lido.data).toEqual(data)
    expect(lido.texto).toBe('2026-10-27')
    expect(lido.n).toBe(1)
  })
})

describe('dataDoCampo', () => {
  it('converte o valor do campo de data para o fim do dia local', () => {
    expect(dataDoCampo('2026-10-30')).toEqual(new Date(2026, 9, 30, 23, 59))
  })

  it('rejeita valores inválidos', () => {
    expect(dataDoCampo('')).toBeNull()
    expect(dataDoCampo('2026-02-31')).toBeNull()
  })
})
