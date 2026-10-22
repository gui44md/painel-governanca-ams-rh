import { useAvisos } from './avisos'
import { useChamados } from './chamados'
import { useDashboards } from './dashboards'
import { useFiltros } from './filtros'
import { useHomologacao } from './homologacao'
import { usePlanoAcao } from './plano-acao'

/**
 * Volta tudo ao estado inicial da demonstração: importações, plano de ação,
 * homologações, dashboards e filtros. Carregado sob demanda pelo menu, para
 * não trazer as stores de todas as telas no carregamento inicial.
 */
export function restaurarDemonstracao(): void {
  // Importações primeiro: as homologações de exemplo apontam para chamados da base original.
  useChamados.getState().desfazerImportacoes()
  usePlanoAcao.getState().restaurarExemplos()
  useHomologacao.getState().restaurarExemplos()
  useDashboards.getState().restaurarExemplos()
  useFiltros.getState().limparFiltros()
  useAvisos.getState().avisar('Demonstração restaurada: dados de exemplo e filtros iniciais.', 'informacao')
}
