import { INDICADORES_WIDGET } from '@/config/dashboards'
import { PRIORIDADES, ROTULOS_TIPO } from '@/config/chamados'
import type { Fornecedor, SistemaRh } from '@/tipos/catalogo'
import type { TipoChamado } from '@/tipos/chamado'
import type { AgrupamentoWidget, IndicadorWidget, Widget } from '@/tipos/dashboard'
import type { FiltrosGlobais } from '@/tipos/filtros'
import type { ChamadoAnalisado } from '../analise'
import { chaveMes } from '../datas'
import { aplicarFiltros } from '../filtros'
import { formatarMesCurto, formatarNumero } from '../formatacao'
import {
  backlogEvolutivas,
  mttrHoras,
  percentualSlaCumprido,
  satisfacaoMedia,
  taxaReincidencia,
} from '../indicadores'
import { formatarValorKpi, instanteDeMedicao } from '../kpis'
import { prioridadeExibida } from '../lista-chamados'
import { listarMeses, resolverPeriodo } from '../periodo'

export interface ContextoWidget {
  analisados: readonly ChamadoAnalisado[]
  /** Filtros do topo, herdados quando o widget não define os seus. */
  filtrosGlobais: FiltrosGlobais
  agora: Date
  inicioDados: Date
  sistemas: readonly SistemaRh[]
  fornecedores: readonly Fornecedor[]
}

export interface PontoWidget {
  chave: string
  rotulo: string
  valor: number | null
  /** Quantos chamados entraram no cálculo. */
  base: number
}

export interface DadosWidget {
  /** Valor do indicador no recorte inteiro (cards, medidor, total). */
  valor: number | null
  pontos: PontoWidget[]
  base: number
  /** Descrição curta do recorte usado, para o subtítulo do widget. */
  recorte: string
}

/** Calcula um indicador sobre uma lista. O backlog é medido no `instante`. */
export function calcularIndicador(indicador: IndicadorWidget, lista: readonly ChamadoAnalisado[], instante: Date): number | null {
  switch (indicador) {
    case 'sla':
      return percentualSlaCumprido(lista)
    case 'mttr':
      return mttrHoras(lista)
    case 'volume':
      return lista.length
    case 'reincidencia':
      return taxaReincidencia(lista)
    case 'satisfacao':
      return satisfacaoMedia(lista)
    case 'backlog':
      return backlogEvolutivas(lista, instante).quantidade
  }
}

export function formatarIndicador(indicador: IndicadorWidget, valor: number | null): string {
  const { formato } = INDICADORES_WIDGET[indicador]
  return formato === 'nota' ? formatarNumero(valor, 1) : formatarValorKpi(valor, formato)
}

const fimDoMes = (data: Date) => new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59, 999)
const ehEstoque = (indicador: IndicadorWidget) => indicador === 'backlog'

interface Grupo {
  chave: string
  rotulo: string
  /** Chamados abertos no período que pertencem ao grupo. */
  fluxo: ChamadoAnalisado[]
  /** Mesmo grupo sem limite de período (para indicadores de estoque). */
  estoque: ChamadoAnalisado[]
  instante: Date
}

function agrupar(
  agrupamento: AgrupamentoWidget,
  fluxo: readonly ChamadoAnalisado[],
  estoque: readonly ChamadoAnalisado[],
  intervalo: { inicio: Date; fim: Date },
  instante: Date,
  contexto: ContextoWidget,
): Grupo[] {
  const porChave = <K extends string>(rotulos: readonly (readonly [K, string])[], chaveDe: (c: ChamadoAnalisado) => K) =>
    rotulos.map(([chave, rotulo]) => ({
      chave,
      rotulo,
      fluxo: fluxo.filter((c) => chaveDe(c) === chave),
      estoque: estoque.filter((c) => chaveDe(c) === chave),
      instante,
    }))

  switch (agrupamento) {
    case 'mes':
      return listarMeses(intervalo.inicio, intervalo.fim).map((mes) => ({
        chave: chaveMes(mes),
        rotulo: formatarMesCurto(mes),
        fluxo: fluxo.filter((c) => chaveMes(c.abertoEm) === chaveMes(mes)),
        estoque: [...estoque],
        instante: new Date(Math.min(fimDoMes(mes).getTime(), instante.getTime())),
      }))
    case 'sistema':
      return porChave(
        contexto.sistemas.map((s) => [s.id, s.nomeCurto] as const),
        (c) => c.sistemaId,
      )
    case 'fornecedor':
      return porChave(
        contexto.fornecedores.map((f) => [f.id, f.nome] as const),
        (c) => c.fornecedorId,
      )
    case 'prioridade':
      return porChave(
        PRIORIDADES.map((p) => [p, p] as const),
        prioridadeExibida,
      )
    case 'tipo':
      return porChave(Object.entries(ROTULOS_TIPO) as [TipoChamado, string][], (c) => c.tipo)
  }
}

/**
 * Dados de um widget: aplica o filtro do widget (ou herda o global), calcula
 * o indicador no recorte e por grupo. Mesmas funções de indicadores das
 * outras telas, então os números batem com a Visão geral.
 */
export function dadosDoWidget(widget: Widget, contexto: ContextoWidget): DadosWidget {
  const { filtrosGlobais, agora } = contexto
  const recorte = {
    sistemaId: widget.filtro.sistemaId ?? filtrosGlobais.sistemaId,
    fornecedorId: widget.filtro.fornecedorId ?? filtrosGlobais.fornecedorId,
  }
  const intervalo = resolverPeriodo(widget.filtro.periodo ?? filtrosGlobais.periodo, contexto.inicioDados, agora)
  const instante = instanteDeMedicao(intervalo, agora)
  const estoque = aplicarFiltros(contexto.analisados, recorte)
  const fluxo = aplicarFiltros(estoque, recorte, intervalo)
  const base = ehEstoque(widget.indicador) ? estoque : fluxo

  // Ao filtrar um fornecedor, agrupar por sistema mostra só os sistemas dele.
  const sistemas = recorte.fornecedorId ? contexto.sistemas.filter((s) => s.fornecedorId === recorte.fornecedorId) : contexto.sistemas
  const grupos = agrupar(widget.agrupamento, fluxo, estoque, intervalo, instante, { ...contexto, sistemas })
  const nomeSistema = contexto.sistemas.find((s) => s.id === recorte.sistemaId)?.nomeCurto
  const nomeFornecedor = contexto.fornecedores.find((f) => f.id === recorte.fornecedorId)?.nome

  return {
    valor: calcularIndicador(widget.indicador, base, instante),
    base: base.length,
    pontos: grupos.map((grupo) => {
      const lista = ehEstoque(widget.indicador) ? grupo.estoque : grupo.fluxo
      return {
        chave: grupo.chave,
        rotulo: grupo.rotulo,
        valor: calcularIndicador(widget.indicador, lista, grupo.instante),
        base: ehEstoque(widget.indicador) ? backlogEvolutivas(lista, grupo.instante).quantidade : lista.length,
      }
    }),
    recorte: [nomeFornecedor, nomeSistema].filter(Boolean).join(' · ') || 'Todos os fornecedores',
  }
}
