/**
 * Ferramenta de desenvolvimento: no console do navegador, rode
 * `await auditarAcessibilidade()` para checar a tela aberta contra as regras
 * WCAG 2.1 A/AA com o axe-core. Só existe em `npm run dev`.
 */

declare global {
  interface Window {
    auditarAcessibilidade?: () => Promise<number>
  }
}

const REGRAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']

export function registrarAuditoria(): void {
  window.auditarAcessibilidade = async () => {
    const { default: axe } = await import('axe-core')
    const { violations } = await axe.run(document, { runOnly: { type: 'tag', values: REGRAS } })
    if (violations.length === 0) {
      console.info('✅ Nenhuma violação de acessibilidade nesta tela.')
    } else {
      console.table(
        violations.map((v) => ({
          impacto: v.impact,
          regra: v.id,
          descricao: v.help,
          ocorrencias: v.nodes.length,
          exemplo: v.nodes[0]?.target.join(' '),
        })),
      )
    }
    return violations.length
  }
}
