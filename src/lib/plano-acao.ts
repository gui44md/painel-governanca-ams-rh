import {
  DIAS_ALERTA_PRAZO_ACAO,
  PRAZO_PADRAO_ACAO_DIAS,
  RESPONSAVEL_A_DEFINIR,
  ROTULOS_INDICADOR_ACAO,
} from '@/config/plano-acao'
import type { Fornecedor, SistemaRh } from '@/tipos/catalogo'
import type { Acao, IndicadorAcao, OrigemAcao, Reuniao, StatusAcao } from '@/tipos/plano-acao'
import type { StatusSla } from '@/tipos/sla'
import { adicionarDias, comHora, diasDeCalendarioEntre } from './datas'
import { formatarDataCurta } from './formatacao'
import { proximoId } from './identificadores'
import { aderenciaPlanoAcao } from './indicadores'
import type { Insight } from './insights'

export function acaoAtrasada(acao: Pick<Acao, 'status' | 'prazo'>, agora: Date): boolean {
  return acao.status !== 'concluida' && acao.prazo.getTime() < agora.getTime()
}

export interface SituacaoPrazo {
  /** Reaproveita as cores e ícones de status do SLA. */
  tom: StatusSla
  texto: string
}

/** Situação do prazo da ação, em texto curto: "Vence em 3 dias", "Atrasada há 4 dias"... */
export function situacaoPrazo(acao: Pick<Acao, 'status' | 'prazo' | 'concluidaEm'>, agora: Date): SituacaoPrazo {
  if (acao.status === 'concluida') {
    const noPrazo = !acao.concluidaEm || acao.concluidaEm.getTime() <= acao.prazo.getTime()
    const quando = acao.concluidaEm ? ` em ${formatarDataCurta(acao.concluidaEm)}` : ''
    return { tom: noPrazo ? 'concluido' : 'estourado', texto: `Concluída${quando}${noPrazo ? '' : ' (com atraso)'}` }
  }
  const dias = diasDeCalendarioEntre(agora, acao.prazo)
  if (acaoAtrasada(acao, agora)) {
    const atraso = Math.max(1, -dias)
    return { tom: 'estourado', texto: `Atrasada há ${atraso} ${atraso === 1 ? 'dia' : 'dias'}` }
  }
  if (dias === 0) return { tom: 'em-risco', texto: 'Vence hoje' }
  const texto = `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  return { tom: dias <= DIAS_ALERTA_PRAZO_ACAO ? 'em-risco' : 'no-prazo', texto }
}

/** Muda o status da ação, registrando (ou limpando) a data de conclusão. */
export function moverAcao(acao: Acao, status: StatusAcao, agora: Date): Acao {
  if (acao.status === status) return acao
  return { ...acao, status, concluidaEm: status === 'concluida' ? agora : null }
}

export interface ResumoPlano {
  total: number
  porStatus: Record<StatusAcao, number>
  atrasadas: number
  /** Concluídas no prazo ÷ total (CONCEITO.md, seção 9). */
  aderencia: number | null
}

export function resumirPlano(acoes: readonly Acao[], agora: Date): ResumoPlano {
  const porStatus: Record<StatusAcao, number> = { 'a-fazer': 0, 'em-andamento': 0, concluida: 0 }
  for (const acao of acoes) porStatus[acao.status]++
  return {
    total: acoes.length,
    porStatus,
    atrasadas: acoes.filter((acao) => acaoAtrasada(acao, agora)).length,
    aderencia: aderenciaPlanoAcao(acoes),
  }
}

/** Dados que o formulário edita. */
export type RascunhoAcao = Pick<
  Acao,
  'titulo' | 'descricao' | 'indicador' | 'fornecedorId' | 'sistemaId' | 'responsavel' | 'status' | 'origem'
> & { prazo: Date | null }

export type ErrosAcao = Partial<Record<'titulo' | 'responsavel' | 'prazo', string>>

const TAMANHO_MINIMO_TITULO = 5

/** Prevenção de erros (CONCEITO.md, seção 12): valida antes de salvar. */
export function validarAcao(rascunho: RascunhoAcao): ErrosAcao {
  const erros: ErrosAcao = {}
  if (rascunho.titulo.trim().length < TAMANHO_MINIMO_TITULO) {
    erros.titulo = `Descreva a ação em pelo menos ${TAMANHO_MINIMO_TITULO} caracteres.`
  }
  if (!rascunho.responsavel.trim()) erros.responsavel = 'Informe quem é o responsável.'
  if (!rascunho.prazo) erros.prazo = 'Informe uma data de prazo válida.'
  return erros
}

export const temErros = (erros: ErrosAcao) => Object.keys(erros).length > 0

export function prazoPadrao(agora: Date): Date {
  return comHora(adicionarDias(agora, PRAZO_PADRAO_ACAO_DIAS), 23, 59)
}

export function rascunhoVazio(agora: Date): RascunhoAcao {
  return {
    titulo: '',
    descricao: '',
    indicador: 'sla',
    fornecedorId: null,
    sistemaId: null,
    responsavel: '',
    status: 'a-fazer',
    origem: { tipo: 'manual' },
    prazo: prazoPadrao(agora),
  }
}

export interface SugestaoAcao {
  /** Mesmo ID do insight, ou `indicador:<id>`. */
  id: string
  /** Por que a ação é sugerida (frase do insight ou do indicador). */
  motivo: string
  rascunho: RascunhoAcao
}

const TITULO_POR_INSIGHT: Record<Insight['tipo'], (fornecedor: string, sistema?: string) => string> = {
  'reincidencia-oculta': (f, s) => `Análise de causa raiz com ${f} sobre reincidência em ${s ?? 'sistemas'}`,
  'estouro-no-fechamento': (f) => `Plano de capacidade da ${f} para a semana de fechamento da folha`,
  'backlog-crescente': (f) => `Repriorizar o backlog de evolutivas com a ${f}`,
}

const INDICADOR_POR_INSIGHT: Record<Insight['tipo'], IndicadorAcao> = {
  'reincidencia-oculta': 'reincidencia',
  'estouro-no-fechamento': 'sla',
  'backlog-crescente': 'backlogEvolutivas',
}

/** Transforma um insight em uma ação pré-preenchida (CONCEITO.md, seção 6.4). */
export function sugerirAcaoDeInsight(
  insight: Insight,
  agora: Date,
  catalogo: { fornecedores: readonly Fornecedor[]; sistemas: readonly SistemaRh[] },
): SugestaoAcao {
  const fornecedor = catalogo.fornecedores.find((f) => f.id === insight.fornecedorId)?.nome ?? 'fornecedor'
  const sistema = catalogo.sistemas.find((s) => s.id === insight.sistemaId)?.nome
  const origem: OrigemAcao = { tipo: 'insight', referencia: insight.id }
  return {
    id: insight.id,
    motivo: insight.texto,
    rascunho: {
      ...rascunhoVazio(agora),
      titulo: TITULO_POR_INSIGHT[insight.tipo](fornecedor, sistema),
      descricao: insight.texto,
      indicador: INDICADOR_POR_INSIGHT[insight.tipo],
      fornecedorId: insight.fornecedorId,
      sistemaId: insight.sistemaId ?? null,
      origem,
    },
  }
}

/** Ação pré-preenchida para um indicador que piorou. */
export function sugerirAcaoDeIndicador(indicador: IndicadorAcao, motivo: string, agora: Date): SugestaoAcao {
  return {
    id: `indicador:${indicador}`,
    motivo,
    rascunho: {
      ...rascunhoVazio(agora),
      titulo: `Plano de melhoria: ${ROTULOS_INDICADOR_ACAO[indicador]}`,
      descricao: motivo,
      indicador,
      origem: { tipo: 'indicador', referencia: indicador },
    },
  }
}

/** Sugestões que ainda não viraram ação (compara pela origem). */
export function sugestoesPendentes(sugestoes: readonly SugestaoAcao[], acoes: readonly Acao[]): SugestaoAcao[] {
  const referencias = new Set(acoes.flatMap((a) => ('referencia' in a.origem ? [String(a.origem.referencia)] : [])))
  return sugestoes.filter((s) => {
    const origem = s.rascunho.origem
    return !('referencia' in origem) || !referencias.has(String(origem.referencia))
  })
}

/** Linhas de um campo de texto (uma por linha), sem vazias. */
export function linhasDoTexto(texto: string): string[] {
  return texto
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean)
}

export interface DadosReuniao {
  titulo: string
  data: Date
  fornecedorId: Reuniao['fornecedorId']
  participantes: string[]
  decisoes: string[]
  /** Ações já existentes acompanhadas na reunião. */
  acoesExistentes: string[]
  /** Títulos de ações novas, criadas a partir da ata. */
  novasAcoes: string[]
}

export type ErrosReuniao = Partial<Record<'titulo' | 'participantes' | 'decisoes', string>>

export function validarReuniao(dados: DadosReuniao): ErrosReuniao {
  const erros: ErrosReuniao = {}
  if (!dados.titulo.trim()) erros.titulo = 'Dê um título para a reunião.'
  if (dados.participantes.length === 0) erros.participantes = 'Informe ao menos um participante.'
  if (dados.decisoes.length === 0 && dados.novasAcoes.length === 0) {
    erros.decisoes = 'Registre ao menos uma decisão ou ação.'
  }
  return erros
}

/**
 * Registra a ata: cria as ações novas (responsável a definir, prazo padrão)
 * e liga todas à reunião.
 */
export function registrarReuniao(
  acoes: readonly Acao[],
  reunioes: readonly Reuniao[],
  dados: DadosReuniao,
  agora: Date,
): { acoes: Acao[]; reunioes: Reuniao[]; reuniaoId: string } {
  const reuniaoId = proximoId('REU', reunioes.map((r) => r.id))
  const ids = acoes.map((a) => a.id)
  const novas: Acao[] = dados.novasAcoes.map((titulo) => {
    const id = proximoId('ACA', ids)
    ids.push(id)
    return {
      ...rascunhoVazio(agora),
      id,
      titulo,
      fornecedorId: dados.fornecedorId,
      responsavel: RESPONSAVEL_A_DEFINIR,
      prazo: prazoPadrao(agora),
      criadaEm: agora,
      concluidaEm: null,
      origem: { tipo: 'reuniao', referencia: reuniaoId },
    }
  })
  const reuniao: Reuniao = {
    id: reuniaoId,
    titulo: dados.titulo.trim(),
    data: dados.data,
    fornecedorId: dados.fornecedorId,
    participantes: dados.participantes,
    decisoes: dados.decisoes,
    acoesIds: [...dados.acoesExistentes, ...novas.map((a) => a.id)],
  }
  return { acoes: [...acoes, ...novas], reunioes: [...reunioes, reuniao], reuniaoId }
}
