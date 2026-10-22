import { chaveData } from './datas'
import { normalizarTexto } from './lista-chamados'

export const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const TIPO_CSV = 'text/csv;charset=utf-8'

/** Dispara o download de um arquivo gerado no navegador. */
export function baixarArquivo(conteudo: Uint8Array | string, nome: string, tipo: string): void {
  const dados = typeof conteudo === 'string' ? conteudo : new Uint8Array(conteudo)
  const url = URL.createObjectURL(new Blob([dados], { type: tipo }))
  const link = Object.assign(document.createElement('a'), { href: url, download: nome })
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Download de uma imagem gerada como data URL (ex.: PNG do dashboard). */
export function baixarDataUrl(dataUrl: string, nome: string): void {
  const link = Object.assign(document.createElement('a'), { href: dataUrl, download: nome })
  document.body.append(link)
  link.click()
  link.remove()
}

/** Nome de arquivo seguro: "Relatório SLA", 27/10/2026 → "relatorio-sla-2026-10-27". */
export function nomeDeArquivo(base: string, data: Date): string {
  const slug = normalizarTexto(base)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug}-${chaveData(data)}`
}

/**
 * Texto de um CSV: tenta UTF-8 e, se houver bytes inválidos, usa Windows-1252
 * (padrão do Excel em português ao salvar "CSV separado por vírgulas").
 */
export function decodificarTexto(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

export type FormatoArquivo = 'xlsx' | 'csv'

/** Formato pelo nome do arquivo, ou `null` se não for aceito. */
export function formatoDoArquivo(nome: string): FormatoArquivo | null {
  const extensao = nome.toLowerCase().split('.').at(-1)
  if (extensao === 'xlsx' || extensao === 'xls') return 'xlsx'
  if (extensao === 'csv') return 'csv'
  return null
}
