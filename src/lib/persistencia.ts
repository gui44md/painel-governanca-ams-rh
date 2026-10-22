const DATA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/

/**
 * `JSON.parse` devolve datas como texto; este reviver as transforma de volta
 * em `Date` ao ler do localStorage.
 */
export function reviverDatas(_chave: string, valor: unknown): unknown {
  return typeof valor === 'string' && DATA_ISO.test(valor) ? new Date(valor) : valor
}
