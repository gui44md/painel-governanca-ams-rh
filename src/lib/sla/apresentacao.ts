import { ROTULOS_ESTADO } from '@/config/chamados'
import type { StatusSla } from '@/tipos/sla'
import type { ChamadoAnalisado } from '../analise'
import { formatarDataCurta, formatarDuracao, formatarPercentual } from '../formatacao'

export interface ApresentacaoSla {
  /** Define cor e ícone (sempre acompanhados do rótulo). */
  tom: StatusSla
  rotulo: string
  /** Complemento curto: tempo consumido, pausa, data de entrega. */
  detalhe: string
  /** Fração do prazo consumida (0–1+), ou `null` quando não há barra (evolutivas). */
  fracao: number | null
}

const ROTULO_STATUS_ABERTO: Record<Exclude<StatusSla, 'concluido'>, string> = {
  'no-prazo': 'No prazo',
  'em-risco': 'Em risco',
  estourado: 'SLA estourado',
}

/** Texto e tom da barra de prazo de um chamado. */
export function apresentarSla(chamado: ChamadoAnalisado, agora: Date): ApresentacaoSla {
  const { sla, evolutiva } = chamado

  if (!sla) {
    if (!chamado.emAberto && chamado.resolvidoEm) {
      return { tom: 'concluido', rotulo: 'Entregue', detalhe: formatarDataCurta(chamado.resolvidoEm), fracao: null }
    }
    const previsao = evolutiva?.entregaPrevista
    const atrasada = previsao !== undefined && previsao.getTime() < agora.getTime()
    return {
      tom: atrasada ? 'estourado' : 'no-prazo',
      rotulo: atrasada ? 'Entrega atrasada' : 'Sem SLA',
      detalhe: previsao ? `Entrega prevista ${formatarDataCurta(previsao)}` : 'Evolutiva',
      fracao: null,
    }
  }

  const tempo = `${formatarDuracao(sla.consumidoMinutos)} de ${formatarDuracao(sla.limiteMinutos)}${
    sla.modo === '24x7' ? ' corridas' : ' úteis'
  }`

  if (!chamado.emAberto) {
    return {
      tom: sla.cumprido ? 'concluido' : 'estourado',
      rotulo: sla.cumprido ? 'Resolvido no prazo' : 'Resolvido fora do prazo',
      detalhe: tempo,
      fracao: sla.fracaoConsumida,
    }
  }

  const tom = sla.status as Exclude<StatusSla, 'concluido'>
  return {
    tom,
    rotulo: `${ROTULO_STATUS_ABERTO[tom]} · ${formatarPercentual(sla.fracaoConsumida, 0)}`,
    detalhe: sla.pausado ? `Pausado: ${ROTULOS_ESTADO['aguardando-usuario'].toLowerCase()}` : tempo,
    fracao: sla.fracaoConsumida,
  }
}
