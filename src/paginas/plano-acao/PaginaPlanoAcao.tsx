import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarPlus,
  CircleCheck,
  Clock,
  Gauge,
  Kanban,
  Lightbulb,
  List,
  ListTodo,
  Plus,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react'
import { FORNECEDORES } from '@/config/catalogo'
import { DATA_REFERENCIA } from '@/config/referencia'
import { CartaoReuniao } from '@/componentes/plano-acao/CartaoReuniao'
import { FormularioAcao } from '@/componentes/plano-acao/FormularioAcao'
import { FormularioReuniao } from '@/componentes/plano-acao/FormularioReuniao'
import { ListaAcoes } from '@/componentes/plano-acao/ListaAcoes'
import { QuadroAcoes } from '@/componentes/plano-acao/QuadroAcoes'
import { Botao } from '@/componentes/ui/Botao'
import { Card } from '@/componentes/ui/Card'
import { ControleSegmentado } from '@/componentes/ui/ControleSegmentado'
import { Dica } from '@/componentes/ui/Dica'
import { DialogoConfirmacao } from '@/componentes/ui/DialogoConfirmacao'
import { EstadoVazio } from '@/componentes/ui/EstadoVazio'
import { IndicadorResumo } from '@/componentes/ui/IndicadorResumo'
import { PainelLateral } from '@/componentes/ui/PainelLateral'
import { useSugestoesAcao } from '@/hooks/useSugestoesAcao'
import { formatarPercentual } from '@/lib/formatacao'
import { rascunhoVazio, resumirPlano, sugestoesPendentes, type RascunhoAcao } from '@/lib/plano-acao'
import { useAvisos } from '@/store/avisos'
import { useFiltros } from '@/store/filtros'
import { usePlanoAcao } from '@/store/plano-acao'

type Confirmacao = { tipo: 'excluir'; id: string } | { tipo: 'restaurar' } | null

const OPCOES_VISAO = [
  { valor: 'kanban', rotulo: 'Kanban', icone: Kanban },
  { valor: 'lista', rotulo: 'Lista', icone: List },
] as const

const NOVA = 'nova'

export default function PaginaPlanoAcao() {
  const [parametros, setParametros] = useSearchParams()
  const { acoes, reunioes, criarAcao, atualizarAcao, moverAcao, excluirAcao, registrarReuniao, restaurarExemplos } =
    usePlanoAcao()
  const fornecedorFiltro = useFiltros((estado) => estado.fornecedorId)
  const avisar = useAvisos((estado) => estado.avisar)
  const todasSugestoes = useSugestoesAcao()
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null)

  const visao = parametros.get('visao') === 'lista' ? 'lista' : 'kanban'
  const editando = parametros.get('editar')
  const idSugestao = parametros.get('sugestao')
  const novaReuniao = parametros.get('reuniao') === NOVA

  const atualizarParametros = useCallback(
    (alterar: (p: URLSearchParams) => void) =>
      setParametros((atuais) => {
        const novos = new URLSearchParams(atuais)
        alterar(novos)
        return novos
      }),
    [setParametros],
  )
  const fecharPainel = useCallback(
    () =>
      atualizarParametros((p) => {
        p.delete('editar')
        p.delete('sugestao')
        p.delete('reuniao')
      }),
    [atualizarParametros],
  )
  const abrirAcao = (id: string) => atualizarParametros((p) => p.set('editar', id))

  // O filtro de fornecedor do topo também vale aqui; ações sem fornecedor aparecem sempre.
  const visiveis = useMemo(
    () => acoes.filter((a) => !fornecedorFiltro || !a.fornecedorId || a.fornecedorId === fornecedorFiltro),
    [acoes, fornecedorFiltro],
  )
  const resumo = resumirPlano(visiveis, DATA_REFERENCIA)
  const sugestoes = sugestoesPendentes(todasSugestoes, acoes)
  const porId = useMemo(() => new Map(acoes.map((a) => [a.id, a])), [acoes])
  const reunioesOrdenadas = reunioes.toSorted((a, b) => b.data.getTime() - a.data.getTime())

  const acaoEmEdicao = editando && editando !== NOVA ? porId.get(editando) : undefined
  const sugestaoAtiva = idSugestao ? todasSugestoes.find((s) => s.id === idSugestao) : undefined
  const formularioAberto = Boolean(acaoEmEdicao || editando === NOVA || sugestaoAtiva)
  const inicialFormulario: RascunhoAcao = acaoEmEdicao ?? sugestaoAtiva?.rascunho ?? rascunhoVazio(DATA_REFERENCIA)

  const salvarAcao = (rascunho: RascunhoAcao) => {
    if (acaoEmEdicao) {
      atualizarAcao(acaoEmEdicao.id, rascunho)
      avisar(`Ação ${acaoEmEdicao.id} atualizada.`)
    } else {
      avisar(`Ação ${criarAcao(rascunho)} criada.`)
    }
    fecharPainel()
  }

  const confirmar = () => {
    if (confirmacao?.tipo === 'excluir') {
      excluirAcao(confirmacao.id)
      avisar(`Ação ${confirmacao.id} excluída.`)
      fecharPainel()
    } else if (confirmacao?.tipo === 'restaurar') {
      restaurarExemplos()
      avisar('Plano de ação restaurado com os dados de exemplo.', 'informacao')
    }
    setConfirmacao(null)
  }

  const nomeFornecedorFiltro = FORNECEDORES.find((f) => f.id === fornecedorFiltro)?.nome

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Resumo do plano" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <IndicadorResumo
          rotulo="Ações em aberto"
          valor={String(resumo.porStatus['a-fazer'] + resumo.porStatus['em-andamento'])}
          icone={ListTodo}
        />
        <IndicadorResumo rotulo="Atrasadas" valor={String(resumo.atrasadas)} icone={Clock} classeIcone="text-estourado" />
        <IndicadorResumo rotulo="Concluídas" valor={String(resumo.porStatus.concluida)} icone={CircleCheck} classeIcone="text-no-prazo" />
        <IndicadorResumo rotulo="Aderência ao plano" valor={formatarPercentual(resumo.aderencia, 0)} icone={Gauge} />
      </section>

      {sugestoes.length > 0 && (
        <Card
          titulo="Sugestões a partir dos dados"
          acao={<Dica texto="Insights e indicadores que pioraram e ainda não têm ação no plano." alinhamento="fim" />}
        >
          <ul className="divide-y divide-borda">
            {sugestoes.map((sugestao) => (
              <li key={sugestao.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span className="flex flex-1 items-start gap-2 text-sm text-texto">
                  {sugestao.rascunho.origem.tipo === 'insight' ? (
                    <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-primaria" />
                  ) : (
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-em-risco-texto" />
                  )}
                  {sugestao.motivo}
                </span>
                <Botao
                  variante="secundario"
                  tamanho="sm"
                  icone={Plus}
                  className="self-start sm:self-center"
                  onClick={() => atualizarParametros((p) => p.set('sugestao', sugestao.id))}
                >
                  Criar ação
                </Botao>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        titulo="Ações"
        acao={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ControleSegmentado
              rotulo="Visualização"
              valor={visao}
              opcoes={OPCOES_VISAO}
              aoMudar={(nova) => atualizarParametros((p) => (nova === 'kanban' ? p.delete('visao') : p.set('visao', nova)))}
            />
            <Botao tamanho="sm" icone={Plus} onClick={() => atualizarParametros((p) => p.set('editar', NOVA))}>
              Nova ação
            </Botao>
          </div>
        }
      >
        {nomeFornecedorFiltro && (
          <p className="mb-3 text-xs text-texto-suave">
            Mostrando ações da {nomeFornecedorFiltro} e ações gerais (filtro de fornecedor do topo).
          </p>
        )}
        {visiveis.length === 0 ? (
          <EstadoVazio titulo="Nenhuma ação no plano" descricao="Crie uma ação ou parta de uma sugestão acima." />
        ) : visao === 'kanban' ? (
          <QuadroAcoes acoes={visiveis} aoAbrir={abrirAcao} aoMover={moverAcao} />
        ) : (
          <ListaAcoes acoes={visiveis} aoAbrir={abrirAcao} />
        )}
      </Card>

      <Card
        titulo="Reuniões com fornecedores"
        acao={
          <Botao
            variante="secundario"
            tamanho="sm"
            icone={CalendarPlus}
            onClick={() => atualizarParametros((p) => p.set('reuniao', NOVA))}
          >
            Registrar reunião
          </Botao>
        }
      >
        {reunioesOrdenadas.length === 0 ? (
          <EstadoVazio titulo="Nenhuma reunião registrada" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {reunioesOrdenadas.map((reuniao) => (
              <CartaoReuniao key={reuniao.id} reuniao={reuniao} acoes={porId} aoAbrirAcao={abrirAcao} />
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Botao variante="fantasma" tamanho="sm" icone={RotateCcw} onClick={() => setConfirmacao({ tipo: 'restaurar' })}>
          Restaurar dados de exemplo
        </Botao>
      </div>

      <PainelLateral
        aberto={formularioAberto}
        aoFechar={fecharPainel}
        sobretitulo={acaoEmEdicao && <p className="font-mono text-xs text-texto-suave">{acaoEmEdicao.id}</p>}
        titulo={acaoEmEdicao ? 'Editar ação' : 'Nova ação'}
      >
        {formularioAberto && (
          <FormularioAcao
            key={editando ?? idSugestao ?? ''}
            inicial={inicialFormulario}
            motivo={sugestaoAtiva?.motivo}
            aoSalvar={salvarAcao}
            aoCancelar={fecharPainel}
            aoExcluir={acaoEmEdicao ? () => setConfirmacao({ tipo: 'excluir', id: acaoEmEdicao.id }) : undefined}
          />
        )}
      </PainelLateral>

      <PainelLateral aberto={novaReuniao} aoFechar={fecharPainel} titulo="Registrar reunião">
        {novaReuniao && (
          <FormularioReuniao
            agora={DATA_REFERENCIA}
            acoesAbertas={acoes.filter((a) => a.status !== 'concluida')}
            aoCancelar={fecharPainel}
            aoSalvar={(dados) => {
              const id = registrarReuniao(dados)
              const novas = dados.novasAcoes.length
              avisar(`Reunião ${id} registrada${novas ? ` com ${novas} ${novas === 1 ? 'ação nova' : 'ações novas'}` : ''}.`)
              fecharPainel()
            }}
          />
        )}
      </PainelLateral>

      <DialogoConfirmacao
        aberto={confirmacao !== null}
        destrutivo
        titulo={confirmacao?.tipo === 'excluir' ? `Excluir a ação ${confirmacao.id}?` : 'Restaurar os dados de exemplo?'}
        descricao={
          confirmacao?.tipo === 'excluir'
            ? 'A ação sai do plano e das atas de reunião. Isso não pode ser desfeito.'
            : 'As ações e reuniões criadas ou alteradas por você serão substituídas pelos exemplos originais.'
        }
        rotuloConfirmar={confirmacao?.tipo === 'excluir' ? 'Excluir ação' : 'Restaurar'}
        aoConfirmar={confirmar}
        aoCancelar={() => setConfirmacao(null)}
      />
    </div>
  )
}
