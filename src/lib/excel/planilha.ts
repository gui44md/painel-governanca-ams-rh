import XLSX from 'xlsx-js-style'
import { cores } from '@/config/tema'
import type { StatusSla } from '@/tipos/sla'
import type { Celula, DefinicaoAba, EstiloCelula, FormatoCelula } from './abas'
import { dataParaSerial } from './datas-excel'

/**
 * Leitura e escrita de .xlsx/.csv com a biblioteca SheetJS (versão
 * xlsx-js-style, que grava cores e negrito nas células).
 */

/** Marca de ordem de bytes: faz o Excel abrir o CSV como UTF-8. */
const BOM = String.fromCharCode(0xfeff)

const rgb = (hex: string) => hex.replace('#', '').toUpperCase()
const borda = { style: 'thin', color: { rgb: rgb(cores.borda) } }

const STATUS: Record<StatusSla, { fundo: string; texto: string }> = {
  'no-prazo': { fundo: cores.noPrazoFundo, texto: cores.noPrazoTexto },
  'em-risco': { fundo: cores.emRiscoFundo, texto: cores.emRiscoTexto },
  estourado: { fundo: cores.estouradoFundo, texto: cores.estouradoTexto },
  concluido: { fundo: cores.concluidoFundo, texto: cores.concluidoTexto },
}

function estiloXlsx(estilo: EstiloCelula | undefined): Record<string, unknown> | undefined {
  switch (estilo) {
    case undefined:
      return { border: { bottom: borda } }
    case 'titulo':
      return { font: { bold: true, sz: 14, color: { rgb: rgb(cores.primaria) } } }
    case 'subtitulo':
      return { font: { sz: 10, color: { rgb: rgb(cores.textoSuave) } } }
    case 'cabecalho':
      return {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: rgb(cores.primaria) } },
        alignment: { vertical: 'center', wrapText: true },
        border: { bottom: { style: 'medium', color: { rgb: rgb(cores.destaque) } } },
      }
    case 'total':
      return { font: { bold: true }, fill: { patternType: 'solid', fgColor: { rgb: rgb(cores.primariaClara) } } }
    default: {
      const { fundo, texto } = STATUS[estilo]
      return {
        font: { bold: true, color: { rgb: rgb(texto) } },
        fill: { patternType: 'solid', fgColor: { rgb: rgb(fundo) } },
        border: { bottom: borda },
      }
    }
  }
}

const FORMATOS: Partial<Record<FormatoCelula, string>> = {
  inteiro: '0',
  decimal: '0.0',
  percentual: '0.0%',
  data: 'dd/mm/yyyy',
  dataHora: 'dd/mm/yyyy hh:mm',
}

function celulaXlsx({ valor, formato, estilo }: Celula): XLSX.CellObject {
  const s = estiloXlsx(estilo)
  if (valor === null || valor === '') return { t: 's', v: '', s } as XLSX.CellObject
  if (valor instanceof Date) return { t: 'n', v: dataParaSerial(valor), z: FORMATOS[formato ?? 'dataHora'], s } as XLSX.CellObject
  if (typeof valor === 'number') return { t: 'n', v: valor, z: FORMATOS[formato ?? 'decimal'], s } as XLSX.CellObject
  return { t: 's', v: valor, s } as XLSX.CellObject
}

function planilhaXlsx(aba: DefinicaoAba): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {}
  const colunas = Math.max(1, ...aba.linhas.map((l) => l.length))
  aba.linhas.forEach((linha, r) =>
    linha.forEach((celula, c) => {
      ws[XLSX.utils.encode_cell({ r, c })] = celulaXlsx(celula)
    }),
  )
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, aba.linhas.length - 1), c: colunas - 1 } })
  ws['!cols'] = aba.larguras.map((wch) => ({ wch }))
  if (aba.filtro && aba.linhas.length > aba.linhaCabecalho + 1) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: aba.linhaCabecalho, c: 0 },
        e: { r: aba.linhas.length - 1, c: colunas - 1 },
      }),
    }
  }
  return ws
}

export function criarPastaDeTrabalho(abas: readonly DefinicaoAba[]): XLSX.WorkBook {
  const pasta = XLSX.utils.book_new()
  for (const aba of abas) XLSX.utils.book_append_sheet(pasta, planilhaXlsx(aba), aba.nome)
  return pasta
}

/** Conteúdo do .xlsx em memória (usado no navegador e no script das planilhas de exemplo). */
export function gerarXlsx(abas: readonly DefinicaoAba[]): Uint8Array {
  return new Uint8Array(XLSX.write(criarPastaDeTrabalho(abas), { type: 'array', bookType: 'xlsx', compression: true }))
}

/** CSV com ponto e vírgula e BOM, como o Excel em português espera. */
export function gerarCsv(aba: DefinicaoAba): string {
  return `${BOM}${XLSX.utils.sheet_to_csv(planilhaXlsx(aba), { FS: ';' })}`
}

export interface PlanilhaLida {
  aba: string
  cabecalhos: string[]
  /** Linhas de dados (sem o cabeçalho), com os valores brutos das células. */
  linhas: unknown[][]
}

/** Separador mais provável de um CSV: ";" (Excel em português) ou ",". */
export function detectarSeparador(textoCsv: string): ';' | ',' {
  const primeira = textoCsv.split(/\r?\n/, 1)[0] ?? ''
  return (primeira.match(/;/g)?.length ?? 0) >= (primeira.match(/,/g)?.length ?? 0) ? ';' : ','
}

/**
 * Lê a primeira aba: a primeira linha preenchida vira cabeçalho. Datas do
 * .xlsx chegam como número serial e são convertidas na validação.
 */
export function lerPlanilha(conteudo: ArrayBuffer | string): PlanilhaLida {
  const pasta =
    typeof conteudo === 'string'
      ? XLSX.read(conteudo.replace(BOM, ''), { type: 'string', raw: true, FS: detectarSeparador(conteudo) })
      : XLSX.read(conteudo, { type: 'array' })
  const aba = pasta.SheetNames[0]
  if (!aba) throw new Error('O arquivo não tem nenhuma planilha.')
  const todas = XLSX.utils.sheet_to_json<unknown[]>(pasta.Sheets[aba]!, { header: 1, raw: true, defval: null, blankrows: false })
  const indiceCabecalho = todas.findIndex((linha) => linha.some((c) => c !== null && String(c).trim() !== ''))
  if (indiceCabecalho < 0) throw new Error('A planilha está vazia.')
  return {
    aba,
    cabecalhos: todas[indiceCabecalho]!.map((c) => (c === null ? '' : String(c).trim())),
    linhas: todas.slice(indiceCabecalho + 1),
  }
}
