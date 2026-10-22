import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { escreverCriterios, lerCriterios, type CriteriosChamados } from '@/lib/lista-chamados'

export type VisaoChamados = 'tabela' | 'kanban'

/**
 * Estado da tela de Chamados guardado na URL: filtros locais, visão, página e
 * chamado aberto. Assim qualquer recorte pode ser compartilhado como link.
 */
export function useEstadoTelaChamados() {
  const [parametros, setParametros] = useSearchParams()

  const criterios = useMemo(() => lerCriterios(parametros), [parametros])
  const visao: VisaoChamados = parametros.get('visao') === 'kanban' ? 'kanban' : 'tabela'
  const pagina = Number(parametros.get('pagina') ?? '1')
  const chamadoAberto = parametros.get('chamado')

  /** `noHistorico`: cria uma entrada no histórico (o "voltar" desfaz a ação). */
  const atualizar = useCallback(
    (alterar: (copia: URLSearchParams) => URLSearchParams, noHistorico = false) =>
      setParametros((atuais) => alterar(new URLSearchParams(atuais)), { replace: !noHistorico }),
    [setParametros],
  )

  const definirCriterios = useCallback(
    (parcial: Partial<CriteriosChamados>) =>
      atualizar((p) => {
        const novos = escreverCriterios({ ...lerCriterios(p), ...parcial }, p)
        novos.delete('pagina')
        return novos
      }),
    [atualizar],
  )

  const definirVisao = useCallback(
    (nova: VisaoChamados) =>
      atualizar((p) => {
        if (nova === 'tabela') p.delete('visao')
        else p.set('visao', nova)
        return p
      }),
    [atualizar],
  )

  const definirPagina = useCallback(
    (nova: number) => {
      atualizar((p) => {
        if (nova <= 1) p.delete('pagina')
        else p.set('pagina', String(nova))
        return p
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [atualizar],
  )

  // Abrir um chamado entra no histórico, para o "voltar" do navegador fechar o painel.
  const abrirChamado = useCallback(
    (id: string | null) =>
      atualizar((p) => {
        if (id) p.set('chamado', id)
        else p.delete('chamado')
        return p
      }, true),
    [atualizar],
  )

  return { criterios, visao, pagina, chamadoAberto, definirCriterios, definirVisao, definirPagina, abrirChamado }
}
