/** Limiares usados para transformar indicadores em insights (CONCEITO.md, seções 6.1 e 10). */
export const REGRAS_INSIGHTS = {
  /** SLA a partir do qual o fornecedor "parece bem" no contrato. */
  slaConsideradoBom: 0.9,
  /** Reincidência de um sistema que merece investigação. */
  reincidenciaAlta: 0.2,
  /** Volume mínimo para não tirar conclusão de poucos chamados. */
  volumeMinimo: 15,
  /** Parte dos estouros na semana de fechamento que indica gargalo de capacidade. */
  parcelaEstourosNoFechamento: 0.6,
  estourosMinimos: 5,
  /** Meses seguidos de crescimento do backlog de evolutivas. */
  mesesDeCrescimento: 3,
  /** O alerta de calendário aparece quando faltam até estes dias para o fechamento. */
  diasAlertaFechamento: 5,
} as const
