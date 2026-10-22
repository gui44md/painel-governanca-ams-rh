/** Próximo ID sequencial com prefixo: ["ACA-001", "ACA-007"] → "ACA-008". */
export function proximoId(prefixo: string, existentes: readonly string[], digitos = 3): string {
  const padrao = new RegExp(`^${prefixo}-(\\d+)$`)
  const maior = existentes.reduce((max, id) => {
    const numero = Number(padrao.exec(id)?.[1] ?? 0)
    return numero > max ? numero : max
  }, 0)
  return `${prefixo}-${String(maior + 1).padStart(digitos, '0')}`
}
