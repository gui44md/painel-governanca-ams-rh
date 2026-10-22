import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { INDICADORES_WIDGET } from '@/config/dashboards'
import { useAnimacaoGraficos } from '@/hooks/useAnimacaoGraficos'
import { COR_FORNECEDOR, ESTILO_GRAFICO, RAMPA_AZUL } from '@/config/graficos'
import { APARENCIA_STATUS } from '@/config/status-visual'
import { cores } from '@/config/tema'
import { TooltipGrafico } from '@/componentes/graficos/TooltipGrafico'
import { EtiquetaTom } from '@/componentes/ui/EtiquetaTom'
import { cx } from '@/lib/classes'
import { formatarIndicador, type DadosWidget, type PontoWidget } from '@/lib/dashboard/agregacao'
import { situacaoMeta } from '@/lib/dashboard/meta'
import type { FornecedorId } from '@/tipos/catalogo'
import type { Widget } from '@/tipos/dashboard'
import type { StatusSla } from '@/tipos/sla'

interface ConteudoWidgetProps {
  widget: Widget
  dados: DadosWidget
}

const ehPercentual = (widget: Widget) => INDICADORES_WIDGET[widget.indicador].formato === 'percentual'

/** Percentuais vão ao gráfico em 0–100 para eixos legíveis. */
const paraGrafico = (widget: Widget, valor: number | null) =>
  valor === null ? null : ehPercentual(widget) ? Math.round(valor * 1000) / 10 : Math.round(valor * 10) / 10

const corDoPonto = (widget: Widget, ponto: PontoWidget, indice: number) =>
  widget.agrupamento === 'fornecedor'
    ? COR_FORNECEDOR[ponto.chave as FornecedorId]
    : widget.tipo === 'rosca'
      ? RAMPA_AZUL[indice % RAMPA_AZUL.length]!
      : ESTILO_GRAFICO.linha

function tooltipDoPonto(widget: Widget) {
  return function ConteudoTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload?: unknown }[] }) {
    const ponto = payload?.[0]?.payload as PontoWidget | undefined
    return (
      <TooltipGrafico
        ativo={Boolean(active && ponto)}
        titulo={ponto?.rotulo}
        linhas={
          ponto
            ? [
                { rotulo: INDICADORES_WIDGET[widget.indicador].rotulo, valor: formatarIndicador(widget.indicador, ponto.valor) },
                { rotulo: 'Chamados na base', valor: String(ponto.base) },
              ]
            : []
        }
      />
    )
  }
}

const EIXO = { fontSize: 11, fill: ESTILO_GRAFICO.eixo }

/** Cor de status em hexadecimal (atributos SVG não leem variáveis CSS de forma confiável). */
const COR_DO_TOM: Record<StatusSla, string> = {
  'no-prazo': cores.noPrazo,
  'em-risco': cores.emRisco,
  estourado: cores.estourado,
  concluido: cores.concluido,
}

function LinhaMeta({ widget }: { widget: Widget }) {
  if (widget.meta === null) return null
  return <ReferenceLine y={paraGrafico(widget, widget.meta) ?? 0} stroke={ESTILO_GRAFICO.meta} strokeDasharray="4 4" />
}

function Kpi({ widget, dados }: ConteudoWidgetProps) {
  const situacao = situacaoMeta(widget.indicador, dados.valor, widget.meta)
  return (
    <div className="flex h-full flex-col justify-center gap-1">
      <p className="text-3xl font-bold tracking-tight text-primaria">{formatarIndicador(widget.indicador, dados.valor)}</p>
      {situacao ? <EtiquetaTom tom={situacao.tom} texto={situacao.texto} /> : <p className="text-xs text-texto-suave">{dados.base} chamados na base</p>}
    </div>
  )
}

/** Medidor semicircular: arco preenchido até o valor, marca na meta. */
function Medidor({ widget, dados }: ConteudoWidgetProps) {
  const escala = INDICADORES_WIDGET[widget.indicador].escalaMaxima ?? 1
  const fracao = Math.min(1, Math.max(0, (dados.valor ?? 0) / escala))
  const situacao = situacaoMeta(widget.indicador, dados.valor, widget.meta)
  const cor = situacao ? COR_DO_TOM[situacao.tom] : cores.primaria
  const ponto = (f: number, raio: number) => [60 - raio * Math.cos(Math.PI * f), 60 - raio * Math.sin(Math.PI * f)] as const
  const [fx, fy] = ponto(fracao, 46)
  const meta = widget.meta === null ? null : Math.min(1, widget.meta / escala)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1">
      <svg viewBox="0 0 120 68" className="w-full max-w-56" role="img" aria-label={`${INDICADORES_WIDGET[widget.indicador].rotulo}: ${formatarIndicador(widget.indicador, dados.valor)}`}>
        <path d="M 14 60 A 46 46 0 0 1 106 60" fill="none" stroke={cores.grade} strokeWidth={12} strokeLinecap="round" />
        {dados.valor !== null && fracao > 0 && (
          <path
            d={`M 14 60 A 46 46 0 0 1 ${fx.toFixed(2)} ${fy.toFixed(2)}`}
            fill="none"
            stroke={cor}
            strokeWidth={12}
            strokeLinecap="round"
          />
        )}
        {meta !== null && (() => {
          const [x1, y1] = ponto(meta, 36)
          const [x2, y2] = ponto(meta, 56)
          return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={cores.texto} strokeWidth={2} />
        })()}
        <text x={60} y={56} textAnchor="middle" fontSize={17} fontWeight={700} fill={cores.primaria}>
          {formatarIndicador(widget.indicador, dados.valor)}
        </text>
      </svg>
      {situacao && <EtiquetaTom tom={situacao.tom} texto={situacao.texto} />}
    </div>
  )
}

/** Pontos prontos para o gráfico, memorizados: o Recharts só reanima quando os dados mudam de fato. */
function usePontosGrafico(widget: Widget, dados: DadosWidget) {
  return useMemo(() => dados.pontos.map((p) => ({ ...p, grafico: paraGrafico(widget, p.valor) })), [widget, dados])
}

function GraficoLinha({ widget, dados }: ConteudoWidgetProps) {
  const animacao = useAnimacaoGraficos()
  const pontos = usePontosGrafico(widget, dados)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={pontos} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke={ESTILO_GRAFICO.grade} />
        <XAxis dataKey="rotulo" tickLine={false} axisLine={{ stroke: ESTILO_GRAFICO.grade }} tick={EIXO} />
        <YAxis tickLine={false} axisLine={false} tick={EIXO} domain={['auto', 'auto']} tickFormatter={(v: number) => (ehPercentual(widget) ? `${v}%` : String(v))} />
        <LinhaMeta widget={widget} />
        <Tooltip cursor={{ stroke: ESTILO_GRAFICO.grade }} content={tooltipDoPonto(widget)} />
        <Line
          type="monotone"
          dataKey="grafico"
          stroke={ESTILO_GRAFICO.linha}
          strokeWidth={ESTILO_GRAFICO.espessuraLinha}
          connectNulls
          dot={{ r: ESTILO_GRAFICO.raioMarcador, fill: ESTILO_GRAFICO.linha, stroke: cores.superficie, strokeWidth: 2 }}
          activeDot={{ r: 6, fill: cores.destaque, stroke: ESTILO_GRAFICO.linha, strokeWidth: 2 }}
          {...animacao}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function GraficoBarras({ widget, dados }: ConteudoWidgetProps) {
  const animacao = useAnimacaoGraficos()
  const pontos = usePontosGrafico(widget, dados)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={pontos} margin={{ top: 18, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke={ESTILO_GRAFICO.grade} />
        <XAxis dataKey="rotulo" tickLine={false} axisLine={{ stroke: ESTILO_GRAFICO.grade }} tick={EIXO} interval={0} />
        <YAxis tickLine={false} axisLine={false} tick={EIXO} tickFormatter={(v: number) => (ehPercentual(widget) ? `${v}%` : String(v))} />
        <LinhaMeta widget={widget} />
        <Tooltip cursor={{ fill: cores.fundo }} content={tooltipDoPonto(widget)} />
        <Bar dataKey="grafico" maxBarSize={24} radius={[4, 4, 0, 0]} {...animacao}>
          {pontos.map((p, i) => (
            <Cell key={p.chave} fill={corDoPonto(widget, p, i)} />
          ))}
          <LabelList
            dataKey="valor"
            position="top"
            fontSize={11}
            fontWeight={600}
            fill={cores.texto}
            formatter={(v: unknown) => (typeof v === 'number' ? formatarIndicador(widget.indicador, v) : '')}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function GraficoRosca({ widget, dados }: ConteudoWidgetProps) {
  const animacao = useAnimacaoGraficos()
  const fatias = useMemo(() => dados.pontos.filter((p) => (p.valor ?? 0) > 0), [dados])
  const total = fatias.reduce((soma, p) => soma + (p.valor ?? 0), 0)
  return (
    <div className="flex h-full min-h-0 items-center gap-3">
      <div className="h-full min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={fatias}
              dataKey="valor"
              nameKey="rotulo"
              innerRadius="58%"
              outerRadius="90%"
              paddingAngle={1}
              stroke={cores.superficie}
              strokeWidth={2}
              {...animacao}
            >
              {fatias.map((p) => (
                <Cell key={p.chave} fill={corDoPonto(widget, p, dados.pontos.indexOf(p))} />
              ))}
            </Pie>
            <Tooltip content={tooltipDoPonto(widget)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex max-w-[45%] flex-col gap-1 text-xs">
        {fatias.map((p) => (
          <li key={p.chave} className="flex items-center gap-1.5 text-texto-suave">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: corDoPonto(widget, p, dados.pontos.indexOf(p)) }} />
            <span className="truncate">{p.rotulo}</span>
            <span className="ml-auto pl-2 font-semibold text-texto tabular-nums">
              {total ? `${Math.round(((p.valor ?? 0) / total) * 100)}%` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Tabela({ widget, dados }: ConteudoWidgetProps) {
  // Em contagens, a base é o próprio valor: a coluna seria repetida.
  const mostrarBase = INDICADORES_WIDGET[widget.indicador].formato !== 'numero'
  return (
    <div tabIndex={0} role="region" aria-label={`Tabela: ${widget.titulo}`} className="h-full overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-superficie text-xs text-texto-suave">
          <tr className="border-b border-borda">
            <th scope="col" className="py-1.5 pr-2 font-medium">Categoria</th>
            <th scope="col" className="py-1.5 pr-2 text-right font-medium">{INDICADORES_WIDGET[widget.indicador].rotulo}</th>
            {mostrarBase && <th scope="col" className="py-1.5 text-right font-medium">Base</th>}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {dados.pontos.map((p) => {
            const situacao = situacaoMeta(widget.indicador, p.valor, widget.meta)
            return (
              <tr key={p.chave} className="border-b border-borda/60 last:border-0">
                <td className="py-1.5 pr-2">{p.rotulo}</td>
                <td className={cx('py-1.5 pr-2 text-right font-semibold', situacao ? APARENCIA_STATUS[situacao.tom].classeTexto : 'text-texto')}>
                  {formatarIndicador(widget.indicador, p.valor)}
                </td>
                {mostrarBase && <td className="py-1.5 text-right text-texto-suave">{p.base}</td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Desenha o widget conforme o tipo. Os dados já vêm calculados. */
export function ConteudoWidget({ widget, dados }: ConteudoWidgetProps) {
  switch (widget.tipo) {
    case 'kpi':
      return <Kpi widget={widget} dados={dados} />
    case 'medidor':
      return <Medidor widget={widget} dados={dados} />
    case 'linha':
      return <GraficoLinha widget={widget} dados={dados} />
    case 'barras':
      return <GraficoBarras widget={widget} dados={dados} />
    case 'rosca':
      return <GraficoRosca widget={widget} dados={dados} />
    case 'tabela':
      return <Tabela widget={widget} dados={dados} />
    case 'texto':
      return (
        <p tabIndex={0} className="h-full overflow-auto text-sm whitespace-pre-line text-texto">
          {widget.texto}
        </p>
      )
  }
}
