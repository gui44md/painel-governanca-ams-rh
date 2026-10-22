export type IdKpi = 'sla' | 'abertos' | 'mttr' | 'reincidencia' | 'backlogEvolutivas'

export type FormatoKpi = 'percentual' | 'horas' | 'numero'

export interface DefinicaoKpi {
  id: IdKpi
  rotulo: string
  /** Como o número é calculado; aparece como dica no card. */
  dica: string
  formato: FormatoKpi
  /** Define a cor da seta de tendência: subir é bom ou ruim? */
  melhorQuando: 'maior' | 'menor'
}

/** Os 5 cards da Visão geral (CONCEITO.md, seção 6.1). */
export const KPIS: readonly DefinicaoKpi[] = [
  {
    id: 'sla',
    rotulo: 'SLA cumprido',
    dica: 'Chamados resolvidos no prazo ÷ chamados resolvidos (incidentes e requisições).',
    formato: 'percentual',
    melhorQuando: 'maior',
  },
  {
    id: 'abertos',
    rotulo: 'Chamados abertos',
    dica: 'Incidentes e requisições ainda não resolvidos no fim do período.',
    formato: 'numero',
    melhorQuando: 'menor',
  },
  {
    id: 'mttr',
    rotulo: 'MTTR',
    dica: 'Tempo médio entre abertura e resolução, em horas corridas.',
    formato: 'horas',
    melhorQuando: 'menor',
  },
  {
    id: 'reincidencia',
    rotulo: 'Reincidência',
    dica: 'Chamados reabertos ou repetidos (mesmo sistema e causa em até 15 dias) ÷ total.',
    formato: 'percentual',
    melhorQuando: 'menor',
  },
  {
    id: 'backlogEvolutivas',
    rotulo: 'Backlog de evolutivas',
    dica: 'Melhorias ainda não entregues no fim do período.',
    formato: 'numero',
    melhorQuando: 'menor',
  },
]
