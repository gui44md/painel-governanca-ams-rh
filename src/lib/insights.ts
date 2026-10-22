import { REGRAS_INSIGHTS } from '@/config/insights'
import { type CalendarioUtil, DIAS_ELEVACAO_FECHAMENTO, JANELA_REINCIDENCIA_DIAS } from '@/config/sla'
import type { Fornecedor, FornecedorId, SistemaId, SistemaRh } from '@/tipos/catalogo'
import type { FiltrosGlobais } from '@/tipos/filtros'
import type { ChamadoAnalisado } from './analise'
import { diasAteFechamento, estaNaJanelaDeFechamento } from './calendario-rh'
import { formatarPercentual } from './formatacao'
import { backlogEvolutivas, chamadosEmAberto, percentualSlaCumprido, taxaReincidencia } from './indicadores'

export type TipoInsight = 'reincidencia-oculta' | 'estouro-no-fechamento' | 'backlog-crescente'

/** Para onde o botão do insight leva, já com os filtros aplicados. */
export interface DestinoInsight {
  caminho: string
  filtros: Partial<Pick<FiltrosGlobais, 'sistemaId' | 'fornecedorId'>>
  /** Parâmetros de URL da tela de destino (ex.: filtros locais de Chamados). */
  parametros?: Record<string, string>
}

export interface Insight {
  id: string
  tipo: TipoInsight
  fornecedorId: FornecedorId
  sistemaId?: SistemaId
  /** Frase curta exibida no cartão. */
  texto: string
  rotuloAcao: string
  destino: DestinoInsight
}

export interface CatalogoInsights {
  fornecedores: readonly Fornecedor[]
  sistemas: readonly SistemaRh[]
}

const R = REGRAS_INSIGHTS

/**
 * "O SLA parece bom, mas o problema volta": fornecedor com SLA acima do
 * aceitável e um sistema com reincidência alta.
 */
function reincidenciaOculta(lista: readonly ChamadoAnalisado[], catalogo: CatalogoInsights): Insight[] {
  return catalogo.fornecedores.flatMap((fornecedor) => {
    const doFornecedor = lista.filter((c) => c.fornecedorId === fornecedor.id)
    const sla = percentualSlaCumprido(doFornecedor)
    if (sla === null || sla < R.slaConsideradoBom) return []

    const piores = catalogo.sistemas
      .filter((s) => s.fornecedorId === fornecedor.id)
      .map((sistema) => {
        const doSistema = doFornecedor.filter((c) => c.sistemaId === sistema.id && c.tipo !== 'evolutiva')
        return { sistema, taxa: doSistema.length >= R.volumeMinimo ? taxaReincidencia(doSistema) : null }
      })
      .filter((item): item is { sistema: SistemaRh; taxa: number } => item.taxa !== null && item.taxa >= R.reincidenciaAlta)
      .toSorted((a, b) => b.taxa - a.taxa)

    const pior = piores[0]
    if (!pior) return []
    return [
      {
        id: `reincidencia-oculta:${fornecedor.id}:${pior.sistema.id}`,
        tipo: 'reincidencia-oculta' as const,
        fornecedorId: fornecedor.id,
        sistemaId: pior.sistema.id,
        texto: `${fornecedor.nome} cumpre ${formatarPercentual(sla, 0)} do SLA, mas ${formatarPercentual(pior.taxa, 0)} dos chamados de ${pior.sistema.nome} reabrem em até ${JANELA_REINCIDENCIA_DIAS} dias.`,
        rotuloAcao: 'Investigar',
        destino: { caminho: '/fornecedores', filtros: { fornecedorId: fornecedor.id } },
      },
    ]
  })
}

/** Estouros de SLA concentrados na semana de fechamento da folha. */
function estouroNoFechamento(
  lista: readonly ChamadoAnalisado[],
  catalogo: CatalogoInsights,
  calendario: CalendarioUtil,
): Insight[] {
  return catalogo.fornecedores.flatMap((fornecedor) => {
    const estouros = lista.filter((c) => c.fornecedorId === fornecedor.id && c.sla?.cumprido === false)
    if (estouros.length < R.estourosMinimos) return []
    const noFechamento = estouros.filter((c) =>
      estaNaJanelaDeFechamento(c.abertoEm, calendario, DIAS_ELEVACAO_FECHAMENTO),
    ).length
    const parcela = noFechamento / estouros.length
    if (parcela < R.parcelaEstourosNoFechamento) return []
    return [
      {
        id: `estouro-no-fechamento:${fornecedor.id}`,
        tipo: 'estouro-no-fechamento' as const,
        fornecedorId: fornecedor.id,
        texto: `${fornecedor.nome}: ${formatarPercentual(parcela, 0)} dos estouros de SLA acontecem na semana de fechamento da folha.`,
        rotuloAcao: 'Ver fornecedor',
        destino: { caminho: '/fornecedores', filtros: { fornecedorId: fornecedor.id } },
      },
    ]
  })
}

/** Backlog de evolutivas crescendo há N meses seguidos (medido no fim de cada mês). */
function backlogCrescente(
  lista: readonly ChamadoAnalisado[],
  catalogo: CatalogoInsights,
  instante: Date,
): Insight[] {
  const marcos = Array.from({ length: R.mesesDeCrescimento + 1 }, (_, i) => {
    const mesesAtras = R.mesesDeCrescimento - i
    return mesesAtras === 0 ? instante : new Date(instante.getFullYear(), instante.getMonth() - mesesAtras + 1, 0, 23, 59)
  })

  return catalogo.fornecedores.flatMap((fornecedor) => {
    const doFornecedor = lista.filter((c) => c.fornecedorId === fornecedor.id)
    const serie = marcos.map((marco) => backlogEvolutivas(doFornecedor, marco).quantidade)
    const cresceu = serie.every((valor, i) => i === 0 || valor > serie[i - 1]!)
    if (!cresceu) return []

    const abertasPorSistema = Map.groupBy(
      doFornecedor.filter((c) => c.tipo === 'evolutiva' && c.emAberto),
      (c) => c.sistemaId,
    )
    const principal = [...abertasPorSistema.entries()].toSorted((a, b) => b[1].length - a[1].length)[0]
    const nomeSistema = catalogo.sistemas.find((s) => s.id === principal?.[0])?.nome
    return [
      {
        id: `backlog-crescente:${fornecedor.id}`,
        tipo: 'backlog-crescente' as const,
        fornecedorId: fornecedor.id,
        texto:
          `Backlog de evolutivas da ${fornecedor.nome} cresce há ${R.mesesDeCrescimento} meses: de ${serie[0]} para ${serie.at(-1)}` +
          (nomeSistema ? `, com risco para melhorias em ${nomeSistema}.` : '.'),
        rotuloAcao: 'Ver evolutivas',
        destino: {
          caminho: '/chamados',
          filtros: { fornecedorId: fornecedor.id },
          parametros: { tipo: 'evolutiva', estado: 'abertos' },
        },
      },
    ]
  })
}

/**
 * Insights detectados nos dados, em ordem de importância para a demonstração.
 * @param doPeriodo chamados do período (fluxo)
 * @param semPeriodo mesmo recorte sem limite de período (backlog ao longo dos meses)
 */
export function detectarInsights(
  doPeriodo: readonly ChamadoAnalisado[],
  semPeriodo: readonly ChamadoAnalisado[],
  instante: Date,
  catalogo: CatalogoInsights,
  calendario: CalendarioUtil,
): Insight[] {
  return [
    ...reincidenciaOculta(doPeriodo, catalogo),
    ...estouroNoFechamento(doPeriodo, catalogo, calendario),
    ...backlogCrescente(semPeriodo, catalogo, instante),
  ]
}

export interface AlertaFechamento {
  dias: number
  abertosFolha: number
  texto: string
}

/** Alerta de calendário de RH: fechamento próximo com chamados de Folha em aberto. */
export function alertaFechamento(
  lista: readonly ChamadoAnalisado[],
  agora: Date,
  calendario: CalendarioUtil,
): AlertaFechamento | null {
  const dias = diasAteFechamento(agora, calendario)
  const abertosFolha = chamadosEmAberto(
    lista.filter((c) => c.sistemaId === 'folha'),
    agora,
  )
  if (dias > R.diasAlertaFechamento || abertosFolha === 0) return null
  const quando = dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`
  const plural = abertosFolha === 1 ? 'chamado de Folha em aberto' : 'chamados de Folha em aberto'
  return { dias, abertosFolha, texto: `Fechamento da folha ${quando}: ${abertosFolha} ${plural}.` }
}
