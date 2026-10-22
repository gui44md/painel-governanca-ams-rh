import { detectarReincidencias, ehReincidente, type InfoReincidencia } from './reincidencia'
import { avaliarSla, estadoAtual, type ContextoSla, type ResultadoSla } from './sla/motor'
import type { Chamado, EstadoChamado } from '@/tipos/chamado'

export interface ChamadoAnalisado extends Chamado {
  /** Estado no "agora" da análise. */
  estado: EstadoChamado
  emAberto: boolean
  /** `null` para evolutivas, que não têm SLA. */
  sla: ResultadoSla | null
  /** `null` para evolutivas, que não entram na reincidência. */
  reincidencia: InfoReincidencia | null
  reincidente: boolean
}

export interface ContextoAnalise extends ContextoSla {
  janelaReincidenciaDias: number
}

/**
 * Junta cada chamado com o resultado do motor de SLA e da detecção de
 * reincidência. Deve rodar sobre a base completa (antes dos filtros), para que
 * a reincidência enxergue chamados anteriores ao período filtrado.
 */
export function analisarChamados(chamados: readonly Chamado[], contexto: ContextoAnalise): ChamadoAnalisado[] {
  const reincidencias = detectarReincidencias(chamados, contexto.janelaReincidenciaDias)
  return chamados.map((chamado) => {
    const estado = estadoAtual(chamado, contexto.agora)
    const reincidencia = reincidencias.get(chamado.id) ?? null
    return {
      ...chamado,
      estado,
      emAberto: estado !== 'resolvido',
      sla: avaliarSla(chamado, contexto),
      reincidencia,
      reincidente: ehReincidente(reincidencia),
    }
  })
}
