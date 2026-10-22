import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useAnimacaoGraficos } from '@/hooks/useAnimacaoGraficos'
import { COR_FORNECEDOR, ESTILO_GRAFICO } from '@/config/graficos'
import { cores } from '@/config/tema'
import type { LinhaRadar } from '@/lib/fornecedores'
import { formatarNumero } from '@/lib/formatacao'
import type { Fornecedor, FornecedorId } from '@/tipos/catalogo'
import { DadosEmTabela } from '@/componentes/ui/DadosEmTabela'
import { LegendaSeries } from './LegendaSeries'
import { TooltipGrafico } from './TooltipGrafico'

interface GraficoRadarFornecedoresProps {
  linhas: readonly LinhaRadar[]
  fornecedores: readonly Fornecedor[]
  destaque?: FornecedorId | null
}

/** Os fornecedores lado a lado nos mesmos indicadores, em escala 0–100 (maior é melhor). */
export function GraficoRadarFornecedores({ linhas, fornecedores, destaque }: GraficoRadarFornecedoresProps) {
  const animacao = useAnimacaoGraficos()
  const esmaecido = (id: FornecedorId) => Boolean(destaque && destaque !== id)
  const valor = (linha: LinhaRadar, id: FornecedorId) => {
    const v = linha[id]
    return typeof v === 'number' ? formatarNumero(v, 0) : '—'
  }

  return (
    <div>
      <LegendaSeries
        className="mb-2"
        itens={fornecedores.map((f) => ({ id: f.id, rotulo: f.nome, cor: COR_FORNECEDOR[f.id], esmaecida: esmaecido(f.id) }))}
      />
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={linhas as LinhaRadar[]} outerRadius="68%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke={ESTILO_GRAFICO.grade} />
            <PolarAngleAxis dataKey="rotuloCurto" tick={{ fontSize: 11, fill: cores.texto }} />
            <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={false} axisLine={false} />
            {fornecedores.map((f) => (
              <Radar
                key={f.id}
                name={f.nome}
                dataKey={f.id}
                stroke={COR_FORNECEDOR[f.id]}
                strokeWidth={destaque === f.id ? 3 : ESTILO_GRAFICO.espessuraLinha}
                strokeOpacity={esmaecido(f.id) ? 0.35 : 1}
                fill={COR_FORNECEDOR[f.id]}
                fillOpacity={destaque === f.id ? 0.18 : esmaecido(f.id) ? 0.02 : 0.08}
                dot={{ r: 3, fillOpacity: esmaecido(f.id) ? 0.35 : 1 }}
                {...animacao}
              />
            ))}
            <Tooltip
              content={({ active, payload }) => {
                const linha = payload?.[0]?.payload as LinhaRadar | undefined
                return (
                  <TooltipGrafico
                    ativo={Boolean(active && linha)}
                    titulo={linha?.rotulo}
                    linhas={
                      linha
                        ? fornecedores.map((f) => ({ rotulo: f.nome, valor: valor(linha, f.id), cor: COR_FORNECEDOR[f.id] }))
                        : []
                    }
                  />
                )
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <DadosEmTabela
        legenda="Comparativo de fornecedores (0 a 100, maior é melhor)"
        colunas={['Indicador', ...fornecedores.map((f) => f.nome)]}
        linhas={linhas.map((linha) => [linha.rotulo, ...fornecedores.map((f) => valor(linha, f.id))])}
      />
    </div>
  )
}
