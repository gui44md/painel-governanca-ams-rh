export const MS_POR_MINUTO = 60_000
export const MS_POR_HORA = 60 * MS_POR_MINUTO
export const MS_POR_DIA = 24 * MS_POR_HORA

export function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate())
}

export function comHora(data: Date, hora: number, minuto = 0): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), hora, minuto)
}

/** Soma dias de calendário preservando o horário local. */
export function adicionarDias(data: Date, dias: number): Date {
  const resultado = new Date(data)
  resultado.setDate(resultado.getDate() + dias)
  return resultado
}

export function adicionarMinutos(data: Date, minutos: number): Date {
  return new Date(data.getTime() + minutos * MS_POR_MINUTO)
}

export function minutosEntreDatas(inicio: Date, fim: Date): number {
  return (fim.getTime() - inicio.getTime()) / MS_POR_MINUTO
}

/** Chave estável AAAA-MM-DD no horário local. */
export function chaveData(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

/** Chave AAAA-MM do mês da data. */
export function chaveMes(data: Date): string {
  return chaveData(data).slice(0, 7)
}

/** Valor de `<input type="date">` (AAAA-MM-DD) → fim daquele dia no horário local. */
export function dataDoCampo(valor: string): Date | null {
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (!correspondencia) return null
  const [ano, mes, dia] = correspondencia.slice(1).map(Number) as [number, number, number]
  const data = new Date(ano, mes - 1, dia, 23, 59)
  return data.getMonth() === mes - 1 ? data : null
}

/** Diferença em dias de calendário entre as datas (ignora o horário). */
export function diasDeCalendarioEntre(inicio: Date, fim: Date): number {
  return Math.round((inicioDoDia(fim).getTime() - inicioDoDia(inicio).getTime()) / MS_POR_DIA)
}
