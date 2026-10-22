export type FornecedorId = 'alfa' | 'beta' | 'gama'

export type SistemaId = 'folha' | 'ponto' | 'beneficios' | 'recrutamento' | 'treinamentos' | 'portal'

export interface Fornecedor {
  id: FornecedorId
  nome: string
}

export interface SistemaRh {
  id: SistemaId
  nome: string
  /** Versão curta para eixos de gráfico e telas pequenas. */
  nomeCurto: string
  /** Fornecedor de AMS responsável pela sustentação do sistema. */
  fornecedorId: FornecedorId
}
