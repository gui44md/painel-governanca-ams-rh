import { describe, expect, it } from 'vitest'
import { decodificarTexto, formatoDoArquivo, nomeDeArquivo } from './arquivos'

describe('arquivos', () => {
  it('monta nomes de arquivo sem acentos nem espaços', () => {
    expect(nomeDeArquivo('Relatório de SLA – Outubro', new Date(2026, 9, 27))).toBe('relatorio-de-sla-outubro-2026-10-27')
  })

  it('reconhece os formatos aceitos', () => {
    expect(formatoDoArquivo('Chamados Outubro.XLSX')).toBe('xlsx')
    expect(formatoDoArquivo('base.csv')).toBe('csv')
    expect(formatoDoArquivo('foto.png')).toBeNull()
  })

  it('lê CSV em UTF-8 e em Windows-1252', () => {
    expect(decodificarTexto(new TextEncoder().encode('Situação').buffer as ArrayBuffer)).toBe('Situação')
    // "Situação" em Windows-1252: ç = 0xE7, ã = 0xE3
    const latin1 = new Uint8Array([0x53, 0x69, 0x74, 0x75, 0x61, 0xe7, 0xe3, 0x6f])
    expect(decodificarTexto(latin1.buffer)).toBe('Situação')
  })
})
