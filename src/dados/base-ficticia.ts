import { DATA_REFERENCIA, INICIO_DADOS } from '@/config/referencia'
import { CALENDARIO_UTIL, JANELA_REINCIDENCIA_DIAS } from '@/config/sla'
import type { ContextoAnalise } from '@/lib/analise'
import type { Chamado } from '@/tipos/chamado'
import { gerarChamados } from './gerador/gerador-chamados'

/** Semente fixa: a base é idêntica em toda execução e em toda demonstração. */
export const SEMENTE_DADOS = 20261027

export const CONTEXTO_ANALISE: ContextoAnalise = {
  agora: DATA_REFERENCIA,
  calendario: CALENDARIO_UTIL,
  janelaReincidenciaDias: JANELA_REINCIDENCIA_DIAS,
}

export function gerarBaseFicticia(): Chamado[] {
  return gerarChamados({
    semente: SEMENTE_DADOS,
    inicio: INICIO_DADOS,
    agora: DATA_REFERENCIA,
    calendario: CALENDARIO_UTIL,
  })
}
