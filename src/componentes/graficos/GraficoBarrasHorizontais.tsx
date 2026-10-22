import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAnimacaoGraficos } from '@/hooks/useAnimacaoGraficos'
import { ESTILO_GRAFICO } from '@/config/graficos'
import { cores } from '@/config/tema'
import { DadosEmTabela } from '@/componentes/ui/DadosEmTabela'
import { TooltipGrafico } from './TooltipGrafico'

export interface BarraHorizontal<Chave extends string = string> {
  chave: Chave
  rotulo: string
  valor: number
}

interface GraficoBarrasHorizontaisProps<Chave extends string> {
  dados: readonly BarraHorizontal<Chave>[]
  /** Nome da medida, para o tooltip e a tabela (ex.: "Chamados"). */
  medida: string
  /** Barra em destaque (as demais ficam esmaecidas). */
  selecionada?: Chave | null
  /** Clicar numa barra aplica o filtro correspondente. */
  aoSelecionar?: (chave: Chave) => void
}

/** Uma série em barras horizontais, valor na ponta de cada barra. */
export function GraficoBarrasHorizontais<Chave extends string>({
  dados,
  medida,
  selecionada,
  aoSelecionar,
}: GraficoBarrasHorizontaisProps<Chave>) {
  const animacao = useAnimacaoGraficos()
  const altura = dados.length * 38 + 12
  return (
    <div>
      <div className="w-full" style={{ height: altura }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados as BarraHorizontal<Chave>[]} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 0 }}>
            <XAxis type="number" hide domain={[0, 'dataMax']} />
            <YAxis
              type="category"
              dataKey="rotulo"
              width={96}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: ESTILO_GRAFICO.fonte, fill: cores.texto }}
            />
            <Tooltip
              cursor={{ fill: cores.fundo }}
              content={({ active, payload }) => {
                const barra = payload?.[0]?.payload as BarraHorizontal | undefined
                return (
                  <TooltipGrafico
                    ativo={Boolean(active && barra)}
                    titulo={barra?.rotulo}
                    linhas={barra ? [{ rotulo: medida, valor: String(barra.valor), cor: ESTILO_GRAFICO.linha }] : []}
                  />
                )
              }}
            />
            <Bar
              dataKey="valor"
              barSize={ESTILO_GRAFICO.espessuraBarra}
              radius={ESTILO_GRAFICO.raioBarraHorizontal}
              {...animacao}
              cursor={aoSelecionar ? 'pointer' : undefined}
              onClick={aoSelecionar ? (_, indice) => aoSelecionar(dados[indice]!.chave) : undefined}
            >
              {dados.map((barra) => (
                <Cell
                  key={barra.chave}
                  fill={ESTILO_GRAFICO.linha}
                  fillOpacity={selecionada && selecionada !== barra.chave ? 0.3 : 1}
                />
              ))}
              <LabelList dataKey="valor" position="right" fontSize={12} fontWeight={600} fill={cores.texto} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DadosEmTabela
        legenda={medida}
        colunas={['Categoria', medida]}
        linhas={dados.map((d) => [d.rotulo, String(d.valor)])}
      />
    </div>
  )
}
