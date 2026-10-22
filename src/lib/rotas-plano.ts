/** Link que abre o plano de ação com o formulário pré-preenchido pela sugestão. */
export function linkSugestaoAcao(idSugestao: string): { pathname: string; search: string } {
  return { pathname: '/plano-de-acao', search: `?${new URLSearchParams({ sugestao: idSugestao })}` }
}
