import { useMemo } from 'react'
import { Info } from 'lucide-react'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { REGRAS_INSIGHTS } from '@/config/insights'
import { DATA_REFERENCIA } from '@/config/referencia'
import { META_SLA } from '@/config/sla'
import { CardFornecedor, type AlertaReincidencia } from '@/componentes/fornecedores/CardFornecedor'
import { RankingCausas } from '@/componentes/fornecedores/RankingCausas'
import { GraficoRadarFornecedores } from '@/componentes/graficos/GraficoRadarFornecedores'
import { GraficoVelocidadeQualidade } from '@/componentes/graficos/GraficoVelocidadeQualidade'
import { Card } from '@/componentes/ui/Card'
import { Dica } from '@/componentes/ui/Dica'
import { useAbrirDestino } from '@/hooks/useAbrirDestino'
import { useChamadosFiltrados } from '@/hooks/useChamadosFiltrados'
import { desempenhoFornecedores, linhasRadar, pontosVelocidadeQualidade, rankingCausas } from '@/lib/fornecedores'
import { instanteDeMedicao } from '@/lib/kpis'
import { useFiltros } from '@/store/filtros'
import type { FornecedorId } from '@/tipos/catalogo'

export default function PaginaFornecedores() {
  const { doPeriodo, intervalo } = useChamadosFiltrados({ ignorarFornecedor: true })
  const destaque = useFiltros((estado) => estado.fornecedorId)
  const definirFornecedor = useFiltros((estado) => estado.definirFornecedor)
  const abrirDestino = useAbrirDestino()

  const dados = useMemo(() => {
    const desempenhos = desempenhoFornecedores(doPeriodo, instanteDeMedicao(intervalo, DATA_REFERENCIA), FORNECEDORES)
    const pontos = pontosVelocidadeQualidade(doPeriodo, SISTEMAS_RH)
    const alertas = new Map<FornecedorId, AlertaReincidencia>()
    for (const ponto of pontos.toSorted((a, b) => a.reincidencia - b.reincidencia)) {
      if (ponto.reincidencia < REGRAS_INSIGHTS.reincidenciaAlta) continue
      alertas.set(ponto.fornecedorId, {
        sistema: SISTEMAS_RH.find((s) => s.id === ponto.sistemaId)!,
        taxa: ponto.reincidencia,
        quantidade: doPeriodo.filter((c) => c.sistemaId === ponto.sistemaId && c.reincidente).length,
      })
    }
    return {
      desempenhos,
      radar: linhasRadar(desempenhos),
      pontos,
      alertas,
      causas: new Map(FORNECEDORES.map((f) => [f.id, rankingCausas(doPeriodo, f.id)])),
    }
  }, [doPeriodo, intervalo])

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-start gap-2 text-sm text-texto-suave">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        Comparação dos três fornecedores no período e no sistema filtrados. Use “Destacar” para focar em um deles.
      </p>

      <section aria-label="Fornecedores" className="grid gap-4 lg:grid-cols-3">
        {FORNECEDORES.map((fornecedor, i) => (
          <CardFornecedor
            key={fornecedor.id}
            fornecedor={fornecedor}
            sistemas={SISTEMAS_RH.filter((s) => s.fornecedorId === fornecedor.id)}
            desempenho={dados.desempenhos[i]!}
            emDestaque={destaque === fornecedor.id}
            alerta={dados.alertas.get(fornecedor.id) ?? null}
            aoAlternarDestaque={() => definirFornecedor(destaque === fornecedor.id ? null : fornecedor.id)}
            aoVerReincidentes={(alerta) =>
              abrirDestino({
                caminho: '/chamados',
                filtros: { fornecedorId: fornecedor.id, sistemaId: alerta.sistema.id },
                parametros: { reincidentes: '1' },
              })
            }
          />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          titulo="Velocidade x Qualidade"
          acao={<Dica texto="Cada ponto é um sistema de RH. Mais à direita = mais rápido; mais alto = o problema volta mais." alinhamento="fim" />}
        >
          <GraficoVelocidadeQualidade
            pontos={dados.pontos}
            fornecedores={FORNECEDORES}
            sistemas={SISTEMAS_RH}
            metaSla={META_SLA}
            limiteReincidencia={REGRAS_INSIGHTS.reincidenciaAlta}
            destaque={destaque}
          />
        </Card>
        <Card
          titulo="Comparativo nos mesmos indicadores"
          acao={<Dica texto="Escala de 0 a 100 em que maior é melhor. Agilidade: o menor MTTR vale 100." alinhamento="fim" />}
        >
          <GraficoRadarFornecedores linhas={dados.radar} fornecedores={FORNECEDORES} destaque={destaque} />
        </Card>
      </div>

      <Card titulo="Causas mais recorrentes por fornecedor">
        <div className="grid gap-6 md:grid-cols-3">
          {FORNECEDORES.map((fornecedor) => (
            <RankingCausas key={fornecedor.id} fornecedor={fornecedor} causas={dados.causas.get(fornecedor.id) ?? []} />
          ))}
        </div>
        <p className="mt-4 text-xs text-texto-suave">
          Comprimento da barra = chamados da categoria. Parte forte = chamados reincidentes; parte clara = demais.
        </p>
      </Card>
    </div>
  )
}
