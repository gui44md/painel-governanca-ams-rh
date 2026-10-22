import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAnimacaoGraficos } from '@/hooks/useAnimacaoGraficos'
import { ESTILO_GRAFICO } from '@/config/graficos'
import { cores } from '@/config/tema'
import { formatarMesAno, formatarMesCurto, formatarNumero, formatarPercentual } from '@/lib/formatacao'
import type { PontoMensal } from '@/lib/series'
import { DadosEmTabela } from '@/componentes/ui/DadosEmTabela'
import { TooltipGrafico } from './TooltipGrafico'

interface GraficoSlaMensalProps {
  pontos: readonly PontoMensal[]
  meta: number
  /** Meses (AAAA-MM) do período filtrado, destacados com uma faixa. */
  destaque?: { de: string; ate: string }
}

interface LinhaGrafico {
  chave: string
  rotulo: string
  titulo: string
  valor: number | null
  base: number
}

/** SLA cumprido por mês, com linha de meta (CONCEITO.md, seção 6.1). */
export function GraficoSlaMensal({ pontos, meta, destaque }: GraficoSlaMensalProps) {
  const animacao = useAnimacaoGraficos()
  const dados: LinhaGrafico[] = pontos.map((ponto) => ({
    chave: ponto.mes,
    rotulo: formatarMesCurto(ponto.inicioDoMes),
    titulo: formatarMesAno(ponto.inicioDoMes),
    valor: ponto.valor === null ? null : Math.round(ponto.valor * 1000) / 10,
    base: ponto.base,
  }))
  const valores = dados.flatMap((d) => (d.valor === null ? [] : [d.valor]))
  const minimo = Math.min(meta * 100 - 5, ...valores)
  const piso = Math.max(0, Math.floor(minimo / 5) * 5)
  const ticks = Array.from({ length: (100 - piso) / 5 + 1 }, (_, i) => piso + i * 5)
  const ultimoComValor = dados.findLastIndex((d) => d.valor !== null)
  const rotuloDe = (chave?: string) => dados.find((d) => d.chave === chave)?.rotulo
  const faixa = destaque && destaque.de !== dados[0]?.chave ? [rotuloDe(destaque.de), rotuloDe(destaque.ate)] : null

  return (
    <div>
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded-full bg-primaria" />
          SLA cumprido no mês
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="w-4 border-t-2 border-dashed border-texto" />
          Meta {formatarPercentual(meta, 0)}
        </li>
        {faixa && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-sm bg-destaque-claro ring-1 ring-destaque" />
            Período filtrado
          </li>
        )}
      </ul>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 20, right: 16, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={ESTILO_GRAFICO.grade} />
            {faixa?.[0] && faixa[1] && (
              <ReferenceArea x1={faixa[0]} x2={faixa[1]} fill={ESTILO_GRAFICO.destaquePeriodo} fillOpacity={0.7} />
            )}
            <XAxis
              dataKey="rotulo"
              tickLine={false}
              axisLine={{ stroke: ESTILO_GRAFICO.grade }}
              tick={{ fontSize: ESTILO_GRAFICO.fonte, fill: ESTILO_GRAFICO.eixo }}
            />
            <YAxis
              domain={[piso, 100]}
              ticks={ticks}
              tickFormatter={(valor: number) => `${valor}%`}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: ESTILO_GRAFICO.fonte, fill: ESTILO_GRAFICO.eixo }}
            />
            <ReferenceLine y={meta * 100} stroke={ESTILO_GRAFICO.meta} strokeDasharray="4 4" />
            <Tooltip
              cursor={{ stroke: ESTILO_GRAFICO.grade, strokeWidth: 1 }}
              content={({ active, payload }) => {
                const linha = payload?.[0]?.payload as LinhaGrafico | undefined
                return (
                  <TooltipGrafico
                    ativo={Boolean(active && linha)}
                    titulo={linha?.titulo}
                    linhas={
                      linha
                        ? [
                            { rotulo: 'SLA cumprido', valor: linha.valor === null ? '—' : `${formatarNumero(linha.valor, 1)}%`, cor: ESTILO_GRAFICO.linha },
                            { rotulo: 'Chamados resolvidos', valor: String(linha.base) },
                          ]
                        : []
                    }
                  />
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke={ESTILO_GRAFICO.linha}
              strokeWidth={ESTILO_GRAFICO.espessuraLinha}
              strokeLinecap="round"
              strokeLinejoin="round"
              connectNulls
              dot={{ r: ESTILO_GRAFICO.raioMarcador, fill: ESTILO_GRAFICO.linha, stroke: cores.superficie, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: cores.destaque, stroke: ESTILO_GRAFICO.linha, strokeWidth: 2 }}
              {...animacao}
            >
              <LabelList
                dataKey="valor"
                content={({ x, y, value, index }) =>
                  index === ultimoComValor && typeof value === 'number' ? (
                    <text x={Number(x)} y={Number(y) - 12} textAnchor="end" fontSize={12} fontWeight={600} fill={cores.texto}>
                      {formatarNumero(value, 1)}%
                    </text>
                  ) : null
                }
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DadosEmTabela
        legenda="SLA cumprido por mês"
        colunas={['Mês', 'SLA cumprido', 'Resolvidos']}
        linhas={dados.map((d) => [d.titulo, d.valor === null ? '—' : `${formatarNumero(d.valor, 1)}%`, String(d.base)])}
      />
    </div>
  )
}
