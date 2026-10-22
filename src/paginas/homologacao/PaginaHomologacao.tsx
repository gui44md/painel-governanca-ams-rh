import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleCheck, ExternalLink, FlaskConical, Hourglass, Undo2 } from 'lucide-react'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { ROTULOS_TIPO_ENTREGA } from '@/config/homologacao'
import { BarraProgressoHomologacao } from '@/componentes/homologacao/BarraProgressoHomologacao'
import { EtiquetaEtapa } from '@/componentes/homologacao/EtiquetaEtapa'
import { PainelDecisao } from '@/componentes/homologacao/PainelDecisao'
import { RoteiroTestes } from '@/componentes/homologacao/RoteiroTestes'
import { Card } from '@/componentes/ui/Card'
import { EstadoVazio } from '@/componentes/ui/EstadoVazio'
import { IndicadorResumo } from '@/componentes/ui/IndicadorResumo'
import { CONSULTA_DESKTOP, useMediaQuery } from '@/hooks/useMediaQuery'
import { cx } from '@/lib/classes'
import { formatarData } from '@/lib/formatacao'
import { etapaHomologacao, progressoHomologacao } from '@/lib/homologacao'
import { useAvisos } from '@/store/avisos'
import { useFiltros } from '@/store/filtros'
import { useHomologacao } from '@/store/homologacao'

const NOME_FORNECEDOR = new Map(FORNECEDORES.map((f) => [f.id, f.nome]))
const NOME_SISTEMA = new Map(SISTEMAS_RH.map((s) => [s.id, s.nome]))
const ID_DETALHE = 'detalhe-homologacao'

export default function PaginaHomologacao() {
  const [parametros, setParametros] = useSearchParams()
  const { homologacoes, registrarResultado, adicionarCaso, decidir, reabrir } = useHomologacao()
  const { sistemaId, fornecedorId } = useFiltros()
  const avisar = useAvisos((estado) => estado.avisar)
  const ehDesktop = useMediaQuery(CONSULTA_DESKTOP)

  // Pendentes primeiro, depois as decididas mais recentes.
  const lista = useMemo(
    () =>
      homologacoes
        .filter((h) => (!sistemaId || h.sistemaId === sistemaId) && (!fornecedorId || h.fornecedorId === fornecedorId))
        .toSorted(
          (a, b) =>
            Number(a.decisao !== 'pendente') - Number(b.decisao !== 'pendente') ||
            b.recebidaEm.getTime() - a.recebidaEm.getTime(),
        ),
    [homologacoes, sistemaId, fornecedorId],
  )
  const contagem = useMemo(() => {
    const etapas = lista.map(etapaHomologacao)
    const contar = (...alvo: string[]) => etapas.filter((e) => alvo.includes(e)).length
    return {
      aguardando: contar('aguardando', 'em-teste', 'pronta-para-decidir'),
      emTeste: contar('em-teste', 'pronta-para-decidir'),
      liberadas: contar('liberada'),
      devolvidas: contar('devolvida'),
    }
  }, [lista])

  const selecionada = lista.find((h) => h.id === parametros.get('item')) ?? lista[0]
  const selecionar = (id: string) =>
    setParametros(
      (atuais) => {
        const novos = new URLSearchParams(atuais)
        novos.set('item', id)
        return novos
      },
      { replace: true },
    )

  const executar = (acao: () => void, sucesso: string) => {
    try {
      acao()
      avisar(sucesso)
    } catch (erro) {
      avisar(erro instanceof Error ? erro.message : 'Não foi possível concluir a operação.', 'erro')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Resumo das homologações" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <IndicadorResumo rotulo="Aguardando validação" valor={String(contagem.aguardando)} icone={Hourglass} />
        <IndicadorResumo rotulo="Com testes em andamento" valor={String(contagem.emTeste)} icone={FlaskConical} />
        <IndicadorResumo rotulo="Liberadas para produção" valor={String(contagem.liberadas)} icone={CircleCheck} classeIcone="text-no-prazo" />
        <IndicadorResumo rotulo="Devolvidas ao fornecedor" valor={String(contagem.devolvidas)} icone={Undo2} classeIcone="text-estourado" />
      </section>

      {lista.length === 0 || !selecionada ? (
        <Card>
          <EstadoVazio titulo="Nenhuma homologação no recorte" descricao="Ajuste os filtros de sistema ou fornecedor do topo." />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <Card titulo="Entregas para validar" comTrilho={false}>
            <ul className="-mx-2 flex flex-col gap-1">
              {lista.map((h) => {
                const ativa = h.id === selecionada.id
                return (
                  <li key={h.id}>
                    <button
                      type="button"
                      aria-current={ativa ? 'true' : undefined}
                      onClick={() => {
                        selecionar(h.id)
                        // No celular o detalhe fica abaixo da lista: leva o usuário até ele.
                        if (!ehDesktop) document.getElementById(ID_DETALHE)?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className={cx(
                        'flex w-full flex-col gap-2 rounded-lg px-2 py-3 text-left transition-colors',
                        ativa ? 'bg-primaria-clara ring-1 ring-primaria/30' : 'hover:bg-fundo',
                      )}
                    >
                      <span className="text-xs text-texto-suave">
                        <span className="font-mono">{h.id}</span> · {ROTULOS_TIPO_ENTREGA[h.tipo]} · {NOME_SISTEMA.get(h.sistemaId)}
                      </span>
                      <span className="text-sm font-semibold text-texto">{h.titulo}</span>
                      <BarraProgressoHomologacao progresso={progressoHomologacao(h)} />
                      <EtiquetaEtapa homologacao={h} className="self-start" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card
            id={ID_DETALHE}
            titulo={
              <span className="flex flex-col gap-1">
                <span className="text-xs font-normal text-texto-suave">
                  <span className="font-mono">{selecionada.id}</span> · {ROTULOS_TIPO_ENTREGA[selecionada.tipo]} ·{' '}
                  {NOME_SISTEMA.get(selecionada.sistemaId)} · {NOME_FORNECEDOR.get(selecionada.fornecedorId)}
                </span>
                <span className="text-base">{selecionada.titulo}</span>
              </span>
            }
            acao={<EtiquetaEtapa homologacao={selecionada} />}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <BarraProgressoHomologacao progresso={progressoHomologacao(selecionada)} comLegenda />
                <p className="flex flex-wrap gap-x-4 text-xs text-texto-suave">
                  <span>Recebida em {formatarData(selecionada.recebidaEm)}</span>
                  {selecionada.chamadoId && (
                    <Link
                      to={{ pathname: '/chamados', search: `?chamado=${selecionada.chamadoId}` }}
                      className="inline-flex items-center gap-1 font-medium text-primaria hover:underline"
                    >
                      Chamado de origem {selecionada.chamadoId}
                      <ExternalLink aria-hidden className="size-3" />
                    </Link>
                  )}
                </p>
              </div>

              <section aria-labelledby="titulo-roteiro" className="flex flex-col gap-3">
                <h3 id="titulo-roteiro" className="text-xs font-semibold tracking-wide text-texto-suave uppercase">
                  Roteiro de testes
                </h3>
                <RoteiroTestes
                  casos={selecionada.casos}
                  bloqueado={selecionada.decisao !== 'pendente'}
                  aoRegistrar={(casoId, alteracao) => registrarResultado(selecionada.id, casoId, alteracao)}
                  aoAdicionar={(passo, esperado) =>
                    executar(() => adicionarCaso(selecionada.id, passo, esperado), 'Caso de teste adicionado.')
                  }
                />
              </section>

              <section aria-labelledby="titulo-decisao" className="flex flex-col gap-3 border-t border-borda pt-5">
                <h3 id="titulo-decisao" className="text-xs font-semibold tracking-wide text-texto-suave uppercase">
                  Decisão final
                </h3>
                <PainelDecisao
                  key={selecionada.id}
                  homologacao={selecionada}
                  nomeFornecedor={NOME_FORNECEDOR.get(selecionada.fornecedorId) ?? 'fornecedor'}
                  aoDecidir={(decisao, observacao) => {
                    // Fixa a seleção: a lista se reordena após a decisão.
                    selecionar(selecionada.id)
                    executar(
                      () => decidir(selecionada.id, decisao, observacao),
                      decisao === 'liberada' ? `${selecionada.id} liberada para produção.` : `${selecionada.id} devolvida ao fornecedor.`,
                    )
                  }}
                  aoReabrir={() => {
                    selecionar(selecionada.id)
                    executar(() => reabrir(selecionada.id), `${selecionada.id} reaberta para novos testes.`)
                  }}
                />
              </section>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
