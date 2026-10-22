import type { FornecedorId, SistemaId } from './catalogo'

export type ResultadoCaso = 'pendente' | 'aprovado' | 'reprovado'

/** Um passo do roteiro de testes (CONCEITO.md, seção 6.5). */
export interface CasoTeste {
  id: string
  passo: string
  esperado: string
  obtido: string
  resultado: ResultadoCaso
}

export type TipoEntrega = 'correcao' | 'evolutiva'

export type DecisaoHomologacao = 'pendente' | 'liberada' | 'devolvida'

export interface Homologacao {
  /** Ex.: HML-003 */
  id: string
  titulo: string
  tipo: TipoEntrega
  sistemaId: SistemaId
  fornecedorId: FornecedorId
  /** Chamado de origem, quando existe. */
  chamadoId: string | null
  recebidaEm: Date
  casos: CasoTeste[]
  decisao: DecisaoHomologacao
  decididaEm: Date | null
  /** Justificativa da decisão (obrigatória ao devolver). */
  observacao: string
}
