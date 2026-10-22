const LOCALIDADE = 'pt-BR'

/** Exibido quando um indicador não tem base de cálculo. */
export const VALOR_AUSENTE = '—'

const formatoMesAno = new Intl.DateTimeFormat(LOCALIDADE, { month: 'long', year: 'numeric' })
const formatoMesCurto = new Intl.DateTimeFormat(LOCALIDADE, { month: 'short' })
const formatoData = new Intl.DateTimeFormat(LOCALIDADE, { day: '2-digit', month: '2-digit', year: 'numeric' })
const formatoDataCurta = new Intl.DateTimeFormat(LOCALIDADE, { day: '2-digit', month: '2-digit' })
const formatoHora = new Intl.DateTimeFormat(LOCALIDADE, { hour: '2-digit', minute: '2-digit' })

export function capitalizar(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase(LOCALIDADE) + texto.slice(1)
}

/** Ex.: "Outubro de 2026". */
export function formatarMesAno(data: Date): string {
  return capitalizar(formatoMesAno.format(data))
}

/** Ex.: "Out" (eixos de gráfico). */
export function formatarMesCurto(data: Date): string {
  return capitalizar(formatoMesCurto.format(data).replace('.', ''))
}

/** Ex.: "27/10/2026". */
export function formatarData(data: Date): string {
  return formatoData.format(data)
}

/** Ex.: "27/10". */
export function formatarDataCurta(data: Date): string {
  return formatoDataCurta.format(data)
}

/** Ex.: "27/10/2026 17:00". */
export function formatarDataHora(data: Date): string {
  return `${formatoData.format(data)} ${formatoHora.format(data)}`
}

export function formatarNumero(valor: number | null, casas = 0): string {
  if (valor === null) return VALOR_AUSENTE
  return valor.toLocaleString(LOCALIDADE, { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

/** Fração em percentual: 0,953 → "95,3%". */
export function formatarPercentual(fracao: number | null, casas = 1): string {
  if (fracao === null) return VALOR_AUSENTE
  return `${formatarNumero(fracao * 100, casas)}%`
}

/** Diferença entre percentuais em pontos percentuais: 0,021 → "2,1 p.p.". */
export function formatarPontosPercentuais(diferenca: number, casas = 1): string {
  return `${formatarNumero(Math.abs(diferenca) * 100, casas)} p.p.`
}

/** Horas com uma casa abaixo de 10 h: 6,5 → "6,5 h"; 67,1 → "67 h". */
export function formatarHoras(horas: number | null): string {
  if (horas === null) return VALOR_AUSENTE
  return `${formatarNumero(horas, horas < 10 ? 1 : 0)} h`
}

/** Duração legível a partir de minutos: 200 → "3h 20min"; 3000 → "2d 2h". */
export function formatarDuracao(minutos: number): string {
  const total = Math.max(0, Math.round(minutos))
  const dias = Math.floor(total / 1440)
  const horas = Math.floor((total % 1440) / 60)
  const resto = total % 60
  if (dias > 0) return horas > 0 ? `${dias}d ${horas}h` : `${dias}d`
  if (horas > 0) return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`
  return `${resto}min`
}
