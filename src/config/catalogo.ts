import type { Fornecedor, SistemaRh } from '@/tipos/catalogo'

/** Fornecedores de AMS fictícios (CONCEITO.md, seção 3). */
export const FORNECEDORES: readonly Fornecedor[] = [
  { id: 'alfa', nome: 'Alfa Sistemas' },
  { id: 'beta', nome: 'Beta Tech' },
  { id: 'gama', nome: 'Gama Consultoria' },
]

/** Sistemas de RH acompanhados e o fornecedor que sustenta cada um. */
export const SISTEMAS_RH: readonly SistemaRh[] = [
  { id: 'folha', nome: 'Folha de Pagamento', nomeCurto: 'Folha', fornecedorId: 'alfa' },
  { id: 'beneficios', nome: 'Benefícios', nomeCurto: 'Benefícios', fornecedorId: 'alfa' },
  { id: 'ponto', nome: 'Ponto Eletrônico', nomeCurto: 'Ponto', fornecedorId: 'beta' },
  { id: 'portal', nome: 'Portal do Colaborador', nomeCurto: 'Portal', fornecedorId: 'beta' },
  { id: 'recrutamento', nome: 'Recrutamento e Seleção', nomeCurto: 'Recrutamento', fornecedorId: 'gama' },
  { id: 'treinamentos', nome: 'Treinamentos e SST', nomeCurto: 'Treinamentos', fornecedorId: 'gama' },
]
