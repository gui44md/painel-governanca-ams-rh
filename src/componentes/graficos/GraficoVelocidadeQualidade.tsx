import {
  CartesianGrid,
  LabelList,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { useAnimacaoGraficos } from '@/hooks/useAnimacaoGraficos'
import { COR_FORNECEDOR, ESTILO_GRAFICO } from '@/config/graficos'
import { cores } from '@/config/tema'
import type { PontoVelocidadeQualidade } from '@/lib/fornecedores'
import { formatarNumero } from '@/lib/formatacao'
import type { Fornecedor, FornecedorId, SistemaRh } from '@/tipos/catalogo'
import { DadosEmTabela } from '@/componentes/ui/DadosEmTabela'
import { LegendaSeries } from './LegendaSeries'
import { TooltipGrafico } from './TooltipGrafico'

interface GraficoVelocidadeQualidadeProps {
  pontos: readonly PontoVelocidadeQualidade[]
  fornecedores: readonly Fornecedor[]
  sistemas: readonly SistemaRh[]
  /** Meta de SLA e limite de reincidência alta, em fração (0–1). */
  metaSla: number
  limiteReincidencia: number
  destaque?: FornecedorId | null
}

interface PontoGrafico {
  x: number
  y: number
  rotulo: string
  nome: string
  fornecedor: string
  volume: number
}

/**
 * Velocidade × Qualidade (CONCEITO.md, seção 6.3): eixo X = % no prazo,
 * eixo Y = reincidência. Pontos no canto superior direito são rápidos, mas o
 * problema volta: cumprir prazo não é o mesmo que resolver bem.
 */
export function GraficoVelocidadeQualidade({
  pontos,
  fornecedores,
  sistemas,
  metaSla,
  limiteReincidencia,
  destaque,
}: GraficoVelocidadeQualidadeProps) {
  const animacao = useAnimacaoGraficos()
  const nomeSistema = new Map(sistemas.map((s) => [s.id, s]))
  const paraGrafico = (p: PontoVelocidadeQualidade): PontoGrafico => ({
    x: Math.round(p.noPrazo * 1000) / 10,
    y: Math.round(p.reincidencia * 1000) / 10,
    rotulo: nomeSistema.get(p.sistemaId)?.nomeCurto ?? p.sistemaId,
    nome: nomeSistema.get(p.sistemaId)?.nome ?? p.sistemaId,
    fornecedor: fornecedores.find((f) => f.id === p.fornecedorId)?.nome ?? '',
    volume: p.volume,
  })

  const todos = pontos.map(paraGrafico)
  const pisoX = Math.min(80, Math.floor(Math.min(...todos.map((p) => p.x), 100) / 5) * 5)
  const tetoY = Math.max(limiteReincidencia * 100 + 10, Math.ceil(Math.max(...todos.map((p) => p.y), 0) / 10) * 10)
  const esmaecido = (id: FornecedorId) => Boolean(destaque && destaque !== id)
  // Pontos no último quarto do eixo X recebem o rótulo à esquerda.
  const limiteRotuloDireita = 100 - (100 - pisoX) / 4

  return (
    <div>
      <LegendaSeries
        className="mb-2"
        itens={fornecedores.map((f) => ({ id: f.id, rotulo: f.nome, cor: COR_FORNECEDOR[f.id], esmaecida: esmaecido(f.id) }))}
      />
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 56, bottom: 20, left: -4 }}>
            <CartesianGrid stroke={ESTILO_GRAFICO.grade} />
            <ReferenceArea
              x1={metaSla * 100 - 5}
              x2={100}
              y1={limiteReincidencia * 100}
              y2={tetoY}
              fill={cores.destaqueClaro}
              fillOpacity={0.8}
              label={{ value: 'Rápido, mas o problema volta', position: 'insideTopLeft', fontSize: 11, fill: cores.texto }}
            />
            <XAxis
              type="number"
              dataKey="x"
              domain={[pisoX, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: ESTILO_GRAFICO.fonte, fill: ESTILO_GRAFICO.eixo }}
              tickLine={false}
              axisLine={{ stroke: ESTILO_GRAFICO.grade }}
              label={{ value: 'Resolvidos no prazo (velocidade)', position: 'insideBottom', offset: -12, fontSize: 11, fill: ESTILO_GRAFICO.eixo }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, tetoY]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: ESTILO_GRAFICO.fonte, fill: ESTILO_GRAFICO.eixo }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            {/* Área fixa dos pontos (~raio 6px): o tamanho não codifica dado. */}
            <ZAxis range={[120, 120]} />
            <ReferenceLine y={limiteReincidencia * 100} stroke={ESTILO_GRAFICO.meta} strokeDasharray="4 4" />
            <ReferenceLine x={metaSla * 100} stroke={ESTILO_GRAFICO.meta} strokeDasharray="4 4" />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const ponto = payload?.[0]?.payload as PontoGrafico | undefined
                return (
                  <TooltipGrafico
                    ativo={Boolean(active && ponto)}
                    titulo={ponto && `${ponto.nome} · ${ponto.fornecedor}`}
                    linhas={
                      ponto
                        ? [
                            { rotulo: 'No prazo', valor: `${formatarNumero(ponto.x, 1)}%` },
                            { rotulo: 'Reincidência', valor: `${formatarNumero(ponto.y, 1)}%` },
                            { rotulo: 'Chamados', valor: String(ponto.volume) },
                          ]
                        : []
                    }
                  />
                )
              }}
            />
            {fornecedores.map((f) => (
              <Scatter
                key={f.id}
                name={f.nome}
                data={pontos.filter((p) => p.fornecedorId === f.id).map(paraGrafico)}
                fill={COR_FORNECEDOR[f.id]}
                fillOpacity={esmaecido(f.id) ? 0.35 : 1}
                stroke={cores.superficie}
                strokeWidth={2}
                shape="circle"
                {...animacao}
              >
                <LabelList
                  dataKey="rotulo"
                  content={({ x, y, value }) => {
                    // Perto da borda direita, o rótulo vai para a esquerda do ponto para não ser cortado.
                    const naBorda = (todos.find((p) => p.rotulo === value)?.x ?? 0) >= limiteRotuloDireita
                    return (
                      <text
                        x={Number(x) + (naBorda ? -10 : 10)}
                        y={Number(y)}
                        dy={4}
                        textAnchor={naBorda ? 'end' : 'start'}
                        fontSize={11}
                        fill={cores.texto}
                      >
                        {String(value)}
                      </text>
                    )
                  }}
                />
              </Scatter>
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-texto-suave">
        Linhas tracejadas: meta de SLA e limite de reincidência alta. Reincidência = reaberto ou repetido em até 15 dias.
      </p>
      <DadosEmTabela
        legenda="Velocidade x Qualidade por sistema"
        colunas={['Sistema', 'Fornecedor', 'No prazo', 'Reincidência', 'Chamados']}
        linhas={todos.map((p) => [p.nome, p.fornecedor, `${formatarNumero(p.x, 1)}%`, `${formatarNumero(p.y, 1)}%`, String(p.volume)])}
      />
    </div>
  )
}
