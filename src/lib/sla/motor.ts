import {
  type CalendarioUtil,
  DIAS_ELEVACAO_FECHAMENTO,
  LIMIAR_RISCO,
  type ModoRelogio,
  type RegraSla,
  TABELA_SLA,
  TIPOS_COM_SLA,
} from '@/config/sla'
import { estaNaJanelaDeFechamento } from '@/lib/calendario-rh'
import type { Chamado, EstadoChamado, EventoHistorico, Prioridade } from '@/tipos/chamado'
import type { StatusSla } from '@/tipos/sla'
import { avancarMinutos, minutosEntre } from './relogio'

export interface ContextoSla {
  /** "Agora" da avaliação: chamados em aberto são medidos até este instante. */
  agora: Date
  calendario: CalendarioUtil
  tabela?: Record<Prioridade, RegraSla>
}

export interface ResultadoSla {
  prioridadeEfetiva: Prioridade
  /** Subiu de prioridade pela regra do fechamento da folha. */
  elevadoPorFechamento: boolean
  modo: ModoRelogio
  limiteMinutos: number
  consumidoMinutos: number
  /** Tempo parado em "Aguardando usuário" (não conta no SLA), em minutos corridos. */
  pausadoMinutos: number
  /** 0,5 = metade do prazo consumido; acima de 1 = estourado. */
  fracaoConsumida: number
  status: StatusSla
  /** Para chamados resolvidos: foi resolvido dentro do prazo? `null` se ainda aberto. */
  cumprido: boolean | null
  /** Data limite projetada considerando pausas até agora. */
  prazoEm: Date
  primeiraRespostaEm: Date | null
  /** Primeira resposta dentro do prazo? `null` se ainda não houve resposta. */
  respostaNoPrazo: boolean | null
  /** Está parado em "Aguardando usuário" neste momento. */
  pausado: boolean
}

interface Segmento {
  estado: EstadoChamado
  inicio: Date
  fim: Date
}

const ORDEM_PRIORIDADE: readonly Prioridade[] = ['P1', 'P2', 'P3', 'P4']
const ESTADOS_COM_RELOGIO: ReadonlySet<EstadoChamado> = new Set(['aberto', 'em-atendimento'])

/** Uma prioridade acima (P1 continua P1). */
export function elevarPrioridade(prioridade: Prioridade): Prioridade {
  return ORDEM_PRIORIDADE[Math.max(0, ORDEM_PRIORIDADE.indexOf(prioridade) - 1)]!
}

/**
 * Regra de RH: chamados de Folha de Pagamento abertos nos dias que antecedem o
 * fechamento sobem uma prioridade automaticamente.
 */
export function prioridadeEfetiva(
  chamado: Pick<Chamado, 'sistemaId' | 'prioridade' | 'abertoEm'>,
  calendario: CalendarioUtil,
): { prioridade: Prioridade; elevado: boolean } {
  const elevar =
    chamado.sistemaId === 'folha' &&
    chamado.prioridade !== 'P1' &&
    estaNaJanelaDeFechamento(chamado.abertoEm, calendario, DIAS_ELEVACAO_FECHAMENTO)
  return elevar
    ? { prioridade: elevarPrioridade(chamado.prioridade), elevado: true }
    : { prioridade: chamado.prioridade, elevado: false }
}

export function temSla(chamado: Pick<Chamado, 'tipo'>): boolean {
  return TIPOS_COM_SLA.includes(chamado.tipo)
}

/** Divide o histórico em trechos contínuos de um mesmo estado, até `agora`. */
export function segmentosDoHistorico(historico: readonly EventoHistorico[], agora: Date): Segmento[] {
  const eventos = historico.filter((evento) => evento.em.getTime() <= agora.getTime())
  return eventos.map((evento, indice) => ({
    estado: evento.estado,
    inicio: evento.em,
    fim: eventos[indice + 1]?.em ?? (evento.estado === 'resolvido' ? evento.em : agora),
  }))
}

export function estadoAtual(chamado: Pick<Chamado, 'historico'>, agora: Date): EstadoChamado {
  const anteriores = chamado.historico.filter((evento) => evento.em.getTime() <= agora.getTime())
  return anteriores.at(-1)?.estado ?? 'aberto'
}

function classificar(fracao: number, resolvido: boolean): StatusSla {
  if (resolvido) return 'concluido'
  if (fracao > 1) return 'estourado'
  if (fracao >= LIMIAR_RISCO) return 'em-risco'
  return 'no-prazo'
}

/**
 * Motor de SLA: calcula prazo, tempo consumido e status de um chamado.
 * O relógio só corre em "Aberto" e "Em atendimento"; "Aguardando usuário"
 * pausa e "Resolvido" para. Retorna `null` para evolutivas (sem SLA).
 */
export function avaliarSla(chamado: Chamado, contexto: ContextoSla): ResultadoSla | null {
  if (!temSla(chamado)) return null

  const { agora, calendario } = contexto
  const tabela = contexto.tabela ?? TABELA_SLA
  const { prioridade, elevado } = prioridadeEfetiva(chamado, calendario)
  const regra = tabela[prioridade]
  const medir = (inicio: Date, fim: Date) => minutosEntre(inicio, fim, regra.modo, calendario)

  const segmentos = segmentosDoHistorico(chamado.historico, agora)
  const ativos = segmentos.filter((segmento) => ESTADOS_COM_RELOGIO.has(segmento.estado))
  const consumidoMinutos = ativos.reduce((total, segmento) => total + medir(segmento.inicio, segmento.fim), 0)
  const pausadoMinutos = segmentos
    .filter((segmento) => segmento.estado === 'aguardando-usuario')
    .reduce((total, segmento) => total + minutosEntre(segmento.inicio, segmento.fim, '24x7', calendario), 0)

  const estado = estadoAtual(chamado, agora)
  const resolvido = estado === 'resolvido'
  const fracaoConsumida = consumidoMinutos / regra.solucaoMinutos

  const primeiraRespostaEm = chamado.historico.find((evento) => evento.estado !== 'aberto')?.em ?? null
  const respostaVisivel = primeiraRespostaEm && primeiraRespostaEm.getTime() <= agora.getTime()

  return {
    prioridadeEfetiva: prioridade,
    elevadoPorFechamento: elevado,
    modo: regra.modo,
    limiteMinutos: regra.solucaoMinutos,
    consumidoMinutos,
    pausadoMinutos,
    fracaoConsumida,
    status: classificar(fracaoConsumida, resolvido),
    cumprido: resolvido ? consumidoMinutos <= regra.solucaoMinutos : null,
    prazoEm: projetarPrazo(ativos, segmentos.at(-1)?.fim ?? chamado.abertoEm, regra, calendario),
    primeiraRespostaEm: respostaVisivel ? primeiraRespostaEm : null,
    respostaNoPrazo: respostaVisivel ? medir(chamado.abertoEm, primeiraRespostaEm) <= regra.respostaMinutos : null,
    pausado: estado === 'aguardando-usuario',
  }
}

/** Percorre os trechos com relógio até esgotar o prazo; se não esgotar, projeta a partir do fim. */
function projetarPrazo(
  ativos: readonly Segmento[],
  ultimoInstante: Date,
  regra: RegraSla,
  calendario: CalendarioUtil,
): Date {
  let restante = regra.solucaoMinutos
  for (const segmento of ativos) {
    const duracao = minutosEntre(segmento.inicio, segmento.fim, regra.modo, calendario)
    if (duracao >= restante) return avancarMinutos(segmento.inicio, restante, regra.modo, calendario)
    restante -= duracao
  }
  return avancarMinutos(ultimoInstante, restante, regra.modo, calendario)
}
