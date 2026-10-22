import type { CasoTeste, DecisaoHomologacao, Homologacao, ResultadoCaso } from '@/tipos/homologacao'

export interface ProgressoHomologacao {
  total: number
  executados: number
  aprovados: number
  reprovados: number
  pendentes: number
  /** Executados ÷ total (0–1). */
  fracao: number
}

export function progressoHomologacao(homologacao: Pick<Homologacao, 'casos'>): ProgressoHomologacao {
  const contar = (resultado: ResultadoCaso) => homologacao.casos.filter((c) => c.resultado === resultado).length
  const total = homologacao.casos.length
  const aprovados = contar('aprovado')
  const reprovados = contar('reprovado')
  const executados = aprovados + reprovados
  return { total, executados, aprovados, reprovados, pendentes: total - executados, fracao: total ? executados / total : 0 }
}

export type EtapaHomologacao = 'aguardando' | 'em-teste' | 'pronta-para-decidir' | DecisaoHomologacao

/** Em que pé está a homologação, para a lista e os indicadores do topo. */
export function etapaHomologacao(homologacao: Homologacao): Exclude<EtapaHomologacao, 'pendente'> {
  if (homologacao.decisao !== 'pendente') return homologacao.decisao
  const { executados, total } = progressoHomologacao(homologacao)
  if (executados === 0) return 'aguardando'
  return executados === total ? 'pronta-para-decidir' : 'em-teste'
}

export interface DecisoesPossiveis {
  liberar: { permitido: boolean; motivo?: string }
  devolver: { permitido: boolean; motivo?: string }
}

/**
 * Regras da decisão final: só libera para produção com todos os casos
 * aprovados; devolve ao fornecedor se algum caso foi reprovado.
 */
export function decisoesPossiveis(homologacao: Homologacao): DecisoesPossiveis {
  if (homologacao.decisao !== 'pendente') {
    const motivo = 'A homologação já foi decidida.'
    return { liberar: { permitido: false, motivo }, devolver: { permitido: false, motivo } }
  }
  const { total, aprovados, reprovados, pendentes } = progressoHomologacao(homologacao)
  return {
    liberar:
      total > 0 && aprovados === total
        ? { permitido: true }
        : {
            permitido: false,
            motivo:
              reprovados > 0
                ? 'Há casos reprovados.'
                : pendentes === 1
                  ? 'Falta 1 caso para executar.'
                  : `Faltam ${pendentes} casos para executar.`,
          },
    devolver: reprovados > 0 ? { permitido: true } : { permitido: false, motivo: 'Nenhum caso foi reprovado.' },
  }
}

export function registrarResultado(
  homologacao: Homologacao,
  casoId: string,
  alteracao: Partial<Pick<CasoTeste, 'resultado' | 'obtido'>>,
): Homologacao {
  if (homologacao.decisao !== 'pendente') return homologacao
  return {
    ...homologacao,
    casos: homologacao.casos.map((caso) => (caso.id === casoId ? { ...caso, ...alteracao } : caso)),
  }
}

export function decidirHomologacao(
  homologacao: Homologacao,
  decisao: Exclude<DecisaoHomologacao, 'pendente'>,
  observacao: string,
  agora: Date,
): Homologacao {
  const regra = decisoesPossiveis(homologacao)[decisao === 'liberada' ? 'liberar' : 'devolver']
  if (!regra.permitido) throw new Error(regra.motivo)
  if (decisao === 'devolvida' && !observacao.trim()) {
    throw new Error('Explique ao fornecedor o motivo da devolução.')
  }
  return { ...homologacao, decisao, decididaEm: agora, observacao: observacao.trim() }
}

/** Desfaz a decisão (ex.: liberada por engano), mantendo os resultados dos testes. */
export function reabrirHomologacao(homologacao: Homologacao): Homologacao {
  return { ...homologacao, decisao: 'pendente', decididaEm: null, observacao: '' }
}

export function adicionarCaso(homologacao: Homologacao, passo: string, esperado: string): Homologacao {
  if (!passo.trim() || !esperado.trim()) throw new Error('Informe o passo e o resultado esperado.')
  const proximo = Math.max(0, ...homologacao.casos.map((c) => Number(c.id.split('-').at(-1)) || 0)) + 1
  const caso: CasoTeste = {
    id: `${homologacao.id}-${proximo}`,
    passo: passo.trim(),
    esperado: esperado.trim(),
    obtido: '',
    resultado: 'pendente',
  }
  return { ...homologacao, casos: [...homologacao.casos, caso] }
}
