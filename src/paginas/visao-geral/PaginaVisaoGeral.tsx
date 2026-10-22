import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CircleCheck } from 'lucide-react'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { KPIS } from '@/config/kpis'
import { DATA_REFERENCIA, INICIO_DADOS } from '@/config/referencia'
import { CALENDARIO_UTIL, META_SLA } from '@/config/sla'
import { ListaChamadosCompacta } from '@/componentes/chamados/ListaChamadosCompacta'
import { GraficoBarrasHorizontais } from '@/componentes/graficos/GraficoBarrasHorizontais'
import { GraficoSlaMensal } from '@/componentes/graficos/GraficoSlaMensal'
import { AlertaCalendario } from '@/componentes/kpi/AlertaCalendario'
import { CartaoInsight } from '@/componentes/kpi/CartaoInsight'
import { Card } from '@/componentes/ui/Card'
import { CardKpi } from '@/componentes/ui/CardKpi'
import { EstadoVazio } from '@/componentes/ui/EstadoVazio'
import { useChamadosFiltrados } from '@/hooks/useChamadosFiltrados'
import { chaveMes } from '@/lib/datas'
import { formatarMesCurto, formatarNumero } from '@/lib/formatacao'
import { alertaFechamento, detectarInsights } from '@/lib/insights'
import { calcularKpis, instanteDeMedicao } from '@/lib/kpis'
import { ordenarChamados } from '@/lib/lista-chamados'
import { contarPor, slaPorMes } from '@/lib/series'
import { useFiltros } from '@/store/filtros'
import type { SistemaId } from '@/tipos/catalogo'

const CATALOGO = { fornecedores: FORNECEDORES, sistemas: SISTEMAS_RH }
const QUANTIDADE_EM_ATENCAO = 5

export default function PaginaVisaoGeral() {
  const { doPeriodo, semPeriodo, intervalo } = useChamadosFiltrados()
  const sistemaSelecionado = useFiltros((estado) => estado.sistemaId)
  const definirSistema = useFiltros((estado) => estado.definirSistema)

  const dados = useMemo(() => {
    const instante = instanteDeMedicao(intervalo, DATA_REFERENCIA)
    const mesAnterior = new Date(instante.getFullYear(), instante.getMonth() - 1, 1)
    return {
      kpis: calcularKpis(doPeriodo, semPeriodo, intervalo, DATA_REFERENCIA),
      rotuloMesAnterior: formatarMesCurto(mesAnterior).toLowerCase(),
      insights: detectarInsights(doPeriodo, semPeriodo, instante, CATALOGO, CALENDARIO_UTIL),
      alerta: alertaFechamento(semPeriodo, DATA_REFERENCIA, CALENDARIO_UTIL),
      slaMensal: slaPorMes(semPeriodo, INICIO_DADOS, DATA_REFERENCIA),
      porSistema: contarPor(
        doPeriodo,
        (c) => c.sistemaId,
        SISTEMAS_RH.map((s) => s.id),
      )
        .map(({ chave, quantidade }) => ({
          chave,
          rotulo: SISTEMAS_RH.find((s) => s.id === chave)!.nomeCurto,
          valor: quantidade,
        }))
        .toSorted((a, b) => b.valor - a.valor),
      emAtencao: ordenarChamados(
        semPeriodo.filter((c) => c.emAberto && c.sla),
        'consumo-sla',
      ).slice(0, QUANTIDADE_EM_ATENCAO),
    }
  }, [doPeriodo, semPeriodo, intervalo])

  const [principal, ...secundarios] = dados.insights

  return (
    <div className="flex flex-col gap-6">
      {(dados.alerta || principal) && (
        <section aria-label="Destaques" className="flex flex-col gap-3">
          {dados.alerta && <AlertaCalendario alerta={dados.alerta} />}
          {principal && <CartaoInsight insight={principal} principal />}
        </section>
      )}

      <section aria-labelledby="titulo-kpis" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <h2 id="titulo-kpis" className="sr-only">
          Indicadores principais
        </h2>
        {KPIS.map((definicao, ordem) => (
          <CardKpi
            key={definicao.id}
            definicao={definicao}
            valor={dados.kpis[definicao.id]}
            rotuloMesAnterior={dados.rotuloMesAnterior}
            ordem={ordem}
            complemento={
              definicao.id === 'backlogEvolutivas' && dados.kpis.backlogEvolutivas.idadeMediaDias != null
                ? `Idade média: ${formatarNumero(dados.kpis.backlogEvolutivas.idadeMediaDias)} dias`
                : undefined
            }
          />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card titulo="SLA cumprido por mês" className="lg:col-span-2">
          <GraficoSlaMensal
            pontos={dados.slaMensal}
            meta={META_SLA}
            destaque={{ de: chaveMes(intervalo.inicio), ate: chaveMes(intervalo.fim) }}
          />
        </Card>
        <Card titulo="Chamados por sistema de RH">
          <GraficoBarrasHorizontais<SistemaId>
            dados={dados.porSistema}
            medida="Chamados"
            selecionada={sistemaSelecionado}
            aoSelecionar={(sistemaId) => definirSistema(sistemaId === sistemaSelecionado ? null : sistemaId)}
          />
          <p className="mt-2 text-xs text-texto-suave">Clique em uma barra para filtrar o sistema.</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          titulo="Chamados que pedem atenção agora"
          acao={
            <Link
              to={{ pathname: '/chamados', search: '?estado=abertos&ordem=consumo-sla' }}
              className="inline-flex items-center gap-1 text-xs font-medium text-primaria hover:underline"
            >
              Ver todos <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          }
        >
          {dados.emAtencao.length ? (
            <ListaChamadosCompacta chamados={dados.emAtencao} />
          ) : (
            <EstadoVazio icone={CircleCheck} titulo="Nenhum chamado em aberto no recorte" />
          )}
        </Card>
        <Card titulo="Outros pontos de atenção">
          {secundarios.length ? (
            <div className="flex flex-col gap-3">
              {secundarios.map((insight) => (
                <CartaoInsight key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <EstadoVazio
              icone={CircleCheck}
              titulo="Nada fora do padrão"
              descricao="Nenhum outro desvio relevante nos fornecedores para este recorte."
            />
          )}
        </Card>
      </div>
    </div>
  )
}
