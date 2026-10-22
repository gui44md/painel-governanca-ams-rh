import type { Chamado, EstadoChamado } from '@/tipos/chamado'

/** Monta um chamado mínimo para testes; o histórico é gerado a partir de `passos`. */
export function criarChamado(
  dados: Partial<Chamado> & { passos?: [EstadoChamado, Date][] } = {},
): Chamado {
  const abertoEm = dados.abertoEm ?? new Date(2026, 9, 13, 9, 0)
  const passos = dados.passos ?? []
  const historico = dados.historico ?? [
    { estado: 'aberto' as const, em: abertoEm },
    ...passos.map(([estado, em]) => ({ estado, em })),
  ]
  const ultimaResolucao = [...historico].reverse().find((evento) => evento.estado === 'resolvido')
  const resolvido = historico.at(-1)?.estado === 'resolvido'

  return {
    id: 'INC-2026-0001',
    tipo: 'incidente',
    titulo: 'Chamado de teste',
    descricao: '',
    sistemaId: 'ponto',
    fornecedorId: 'beta',
    prioridade: 'P2',
    categoria: 'Teste',
    causa: 'teste',
    resolvidoEm: resolvido ? (ultimaResolucao?.em ?? null) : null,
    reaberto: false,
    solucao: null,
    satisfacao: null,
    ...dados,
    abertoEm,
    historico,
  }
}
