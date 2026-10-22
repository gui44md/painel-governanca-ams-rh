import type { FornecedorId } from '@/tipos/catalogo'
import { cores } from './tema'

/** Cor fixa de cada fornecedor: a cor segue a entidade, nunca a posição no ranking. */
export const COR_FORNECEDOR: Record<FornecedorId, string> = {
  alfa: cores.fornecedorAlfa,
  beta: cores.fornecedorBeta,
  gama: cores.fornecedorGama,
}

/** Mesmas cores como classes Tailwind (literais, para o Tailwind detectar). */
export const CLASSE_FUNDO_FORNECEDOR: Record<FornecedorId, string> = {
  alfa: 'bg-fornecedor-alfa',
  beta: 'bg-fornecedor-beta',
  gama: 'bg-fornecedor-gama',
}

/**
 * Rampa ordinal de um só matiz (azul da marca), do mais forte ao mais claro.
 * Usada em categorias sem cor própria (prioridade, sistema, tipo). Validada:
 * luminosidade monotônica, degraus visíveis e o tom mais claro com 2,1:1.
 */
export const RAMPA_AZUL = ['#00305e', '#104281', '#1c5cab', '#2a78d6', '#5598e7', '#86b6ef'] as const

/** Especificações de marca comuns a todos os gráficos. */
export const ESTILO_GRAFICO = {
  grade: cores.grade,
  eixo: cores.textoSuave,
  linha: cores.primaria,
  espessuraLinha: 2,
  raioMarcador: 4,
  espessuraBarra: 20,
  /** Arredonda só a ponta da barra; a base fica reta. */
  raioBarraHorizontal: [0, 4, 4, 0] as [number, number, number, number],
  /** Linha de meta: neutra (cores de status são reservadas para status). */
  meta: cores.texto,
  destaquePeriodo: cores.destaqueClaro,
  fonte: 12,
  /** Animação de entrada sutil. */
  duracaoAnimacao: 500,
} as const
