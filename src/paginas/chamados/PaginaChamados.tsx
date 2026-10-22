import { useCallback, useMemo } from 'react'
import { Clock, Download, Inbox, Kanban, List, LoaderCircle, Repeat, TriangleAlert } from 'lucide-react'
import { ITENS_POR_PAGINA, ROTULOS_TIPO } from '@/config/chamados'
import { DetalheChamado } from '@/componentes/chamados/DetalheChamado'
import { FiltrosChamados } from '@/componentes/chamados/FiltrosChamados'
import { KanbanChamados } from '@/componentes/chamados/KanbanChamados'
import { TabelaChamados } from '@/componentes/chamados/TabelaChamados'
import { Botao } from '@/componentes/ui/Botao'
import { Card } from '@/componentes/ui/Card'
import { ControleSegmentado } from '@/componentes/ui/ControleSegmentado'
import { EstadoVazio } from '@/componentes/ui/EstadoVazio'
import { IndicadorResumo } from '@/componentes/ui/IndicadorResumo'
import { PainelLateral } from '@/componentes/ui/PainelLateral'
import { Paginacao } from '@/componentes/ui/Paginacao'
import { useChamadosFiltrados } from '@/hooks/useChamadosFiltrados'
import { useEstadoTelaChamados, type VisaoChamados } from '@/hooks/useEstadoTelaChamados'
import { useExportacoes } from '@/hooks/useExportacoes'
import { filtrarChamados, ordenarChamados, paginar } from '@/lib/lista-chamados'
import { useChamados } from '@/store/chamados'

const OPCOES_VISAO = [
  { valor: 'tabela', rotulo: 'Tabela', icone: List },
  { valor: 'kanban', rotulo: 'Kanban', icone: Kanban },
] as const satisfies readonly { valor: VisaoChamados; rotulo: string; icone: typeof List }[]

export default function PaginaChamados() {
  const { doPeriodo } = useChamadosFiltrados()
  const todos = useChamados((estado) => estado.analisados)
  const tela = useEstadoTelaChamados()
  const { exportarLista, gerando } = useExportacoes()
  const { criterios, abrirChamado } = tela

  const lista = useMemo(
    () => ordenarChamados(filtrarChamados(doPeriodo, criterios), criterios.ordem),
    [doPeriodo, criterios],
  )
  const resumo = useMemo(
    () => ({
      abertos: lista.filter((c) => c.emAberto).length,
      emRisco: lista.filter((c) => c.emAberto && (c.sla?.status === 'em-risco' || c.sla?.status === 'estourado')).length,
      reincidentes: lista.filter((c) => c.reincidente).length,
    }),
    [lista],
  )
  const pagina = paginar(lista, tela.pagina, ITENS_POR_PAGINA)

  // O detalhe procura na base inteira, para links vindos de outras telas funcionarem com qualquer filtro.
  const selecionado = tela.chamadoAberto ? todos.find((c) => c.id === tela.chamadoAberto) : undefined
  const repeticoes = useMemo(
    () => (selecionado ? todos.filter((c) => c.reincidencia?.repeticaoDe === selecionado.id) : []),
    [todos, selecionado],
  )
  const fecharDetalhe = useCallback(() => abrirChamado(null), [abrirChamado])

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Resumo da lista" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <IndicadorResumo rotulo="Chamados na lista" valor={String(lista.length)} icone={Inbox} />
        <IndicadorResumo rotulo="Em aberto" valor={String(resumo.abertos)} icone={Clock} />
        <IndicadorResumo
          rotulo="Em risco ou estourados"
          valor={String(resumo.emRisco)}
          icone={TriangleAlert}
          classeIcone="text-estourado"
        />
        <IndicadorResumo rotulo="Reincidentes" valor={String(resumo.reincidentes)} icone={Repeat} />
      </section>

      <Card comTrilho={false}>
        <FiltrosChamados criterios={criterios} aoMudar={tela.definirCriterios} />
      </Card>

      <Card
        titulo={`${lista.length} chamados`}
        acao={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Botao
              variante="secundario"
              tamanho="sm"
              icone={gerando === 'recorte' ? LoaderCircle : Download}
              disabled={lista.length === 0 || gerando !== null}
              onClick={() => exportarLista(lista, 'chamados-lista')}
              title="Exporta para Excel exatamente a lista filtrada"
            >
              Exportar
            </Botao>
            <ControleSegmentado rotulo="Visualização" valor={tela.visao} opcoes={OPCOES_VISAO} aoMudar={tela.definirVisao} />
          </div>
        }
      >
        {lista.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum chamado encontrado"
            descricao="Ajuste a busca, os filtros da lista ou os filtros globais do topo."
          />
        ) : tela.visao === 'kanban' ? (
          <KanbanChamados chamados={lista} aoAbrir={abrirChamado} />
        ) : (
          <>
            <TabelaChamados chamados={pagina.itens} aoAbrir={abrirChamado} />
            <Paginacao
              pagina={pagina.pagina}
              totalPaginas={pagina.totalPaginas}
              totalItens={lista.length}
              aoMudar={tela.definirPagina}
            />
          </>
        )}
      </Card>

      <PainelLateral
        aberto={Boolean(selecionado)}
        aoFechar={fecharDetalhe}
        sobretitulo={
          selecionado && (
            <p className="text-xs text-texto-suave">
              <span className="font-mono">{selecionado.id}</span> · {ROTULOS_TIPO[selecionado.tipo]}
            </p>
          )
        }
        titulo={selecionado?.titulo}
      >
        {selecionado && (
          <DetalheChamado chamado={selecionado} repeticoesPosteriores={repeticoes} aoAbrirChamado={abrirChamado} />
        )}
      </PainelLateral>
    </div>
  )
}
