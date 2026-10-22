/**
 * Cores da identidade visual em formato hexadecimal, para uso onde classes
 * Tailwind não alcançam (ex.: atributos SVG do Recharts).
 * Fonte única de verdade visual: src/index.css (@theme). Mantidas em sincronia
 * pelo teste tema.test.ts.
 */
export const cores = {
  primaria: '#00305e',
  primariaEscura: '#00213f',
  primariaMedia: '#2f5a85',
  primariaClara: '#e6edf5',
  destaque: '#ffc20e',
  destaqueClaro: '#fff4cf',

  fundo: '#f4f6f9',
  superficie: '#ffffff',
  texto: '#1f2933',
  textoSuave: '#52606d',
  borda: '#e1e6ec',
  menuTexto: '#b8c7d9',

  noPrazo: '#1e9e5a',
  noPrazoTexto: '#146c3e',
  noPrazoFundo: '#e8f6ee',
  emRisco: '#e8730c',
  emRiscoTexto: '#9a4a06',
  emRiscoFundo: '#fdf0e4',
  estourado: '#d64545',
  estouradoTexto: '#a62f2f',
  estouradoFundo: '#fbeaea',
  concluido: '#64748b',
  concluidoTexto: '#475569',
  concluidoFundo: '#eef1f5',

  fornecedorAlfa: '#1c5cab',
  fornecedorBeta: '#c2477a',
  fornecedorGama: '#7a6a00',
  grade: '#e9edf2',
} as const

export type NomeCor = keyof typeof cores
