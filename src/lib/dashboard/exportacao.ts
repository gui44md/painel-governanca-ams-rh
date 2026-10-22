import { INDICADORES_WIDGET, ROTULOS_AGRUPAMENTO, TIPOS_WIDGET } from '@/config/dashboards'
import type { Dashboard, IndicadorWidget } from '@/tipos/dashboard'
import { cabecalho, numero, texto, type Celula, type DefinicaoAba, type FormatoCelula } from '../excel/abas'
import { formatarDataHora } from '../formatacao'
import type { DadosWidget } from './agregacao'
import { widgetsEmOrdem } from './operacoes'

const TAMANHO_NOME_ABA = 31

/** Nome de aba válido no Excel: sem : \ / ? * [ ], até 31 caracteres e sem repetir. */
export function nomeDeAba(titulo: string, usados: Set<string>): string {
  const base =
    titulo
      .replace(/[:\\/?*[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, TAMANHO_NOME_ABA)
      .trim() || 'Widget'
  let nome = base
  for (let n = 2; usados.has(nome.toLowerCase()); n++) {
    const sufixo = ` (${n})`
    nome = `${base.slice(0, TAMANHO_NOME_ABA - sufixo.length)}${sufixo}`
  }
  usados.add(nome.toLowerCase())
  return nome
}

function formatoDe(indicador: IndicadorWidget): FormatoCelula {
  const formato = INDICADORES_WIDGET[indicador].formato
  return formato === 'percentual' ? 'percentual' : formato === 'numero' ? 'inteiro' : 'decimal'
}

/**
 * Dados dos widgets em Excel (CONCEITO.md, seção 7): uma aba "Resumo" com o
 * valor de cada widget e uma aba por widget com os valores por categoria.
 */
export function abasDoDashboard(dashboard: Dashboard, dados: ReadonlyMap<string, DadosWidget>, geradoEm: Date): DefinicaoAba[] {
  const usados = new Set<string>(['resumo'])
  const comDados = widgetsEmOrdem(dashboard)
    .map(({ widget }) => widget)
    .filter((w) => TIPOS_WIDGET[w.tipo].usaIndicador && dados.has(w.id))

  const resumo: DefinicaoAba = {
    nome: 'Resumo',
    linhas: [
      [texto(dashboard.nome, 'titulo')],
      [texto(`Gerado em ${formatarDataHora(geradoEm)} · Dados fictícios`, 'subtitulo')],
      [],
      cabecalho(['Widget', 'Indicador', 'Recorte', 'Valor', 'Meta']),
      ...comDados.map((w): Celula[] => [
        texto(w.titulo),
        texto(INDICADORES_WIDGET[w.indicador].rotulo),
        texto(dados.get(w.id)!.recorte),
        numero(dados.get(w.id)!.valor, formatoDe(w.indicador)),
        numero(w.meta, formatoDe(w.indicador)),
      ]),
    ],
    larguras: [40, 24, 28, 12, 12],
    linhaCabecalho: 3,
    filtro: false,
  }

  const porWidget = comDados
    .filter((w) => TIPOS_WIDGET[w.tipo].usaAgrupamento)
    .map(
      (w): DefinicaoAba => ({
        nome: nomeDeAba(w.titulo, usados),
        linhas: [
          cabecalho([ROTULOS_AGRUPAMENTO[w.agrupamento], INDICADORES_WIDGET[w.indicador].rotulo, 'Chamados na base']),
          ...dados.get(w.id)!.pontos.map((p) => [texto(p.rotulo), numero(p.valor, formatoDe(w.indicador)), numero(p.base)]),
        ],
        larguras: [24, 18, 16],
        linhaCabecalho: 0,
        filtro: true,
      }),
    )

  return [resumo, ...porWidget]
}
