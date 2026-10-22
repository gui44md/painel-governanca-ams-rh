import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { PREFIXOS_ID } from '@/config/chamados'
import { type CalendarioUtil, DIAS_ELEVACAO_FECHAMENTO, TABELA_SLA } from '@/config/sla'
import { criarAleatorio, type Aleatorio } from '@/lib/aleatorio'
import { estaNaJanelaDeFechamento } from '@/lib/calendario-rh'
import { adicionarDias, adicionarMinutos, comHora, inicioDoDia } from '@/lib/datas'
import { prioridadeEfetiva } from '@/lib/sla/motor'
import { avancarMinutos, ehDiaUtil } from '@/lib/sla/relogio'
import type { FornecedorId, SistemaId, SistemaRh } from '@/tipos/catalogo'
import type { Chamado, EventoHistorico, Prioridade, TipoChamado, TipoSolucao } from '@/tipos/chamado'
import { CENARIO_DEMONSTRACAO } from './cenario-demonstracao'
import {
  MODELOS_POR_SISTEMA,
  ORIGENS_TECNICAS,
  VARIAVEIS,
  type ModeloChamado,
  type NomeVariavel,
} from './modelos-chamados'
import { ATENDIMENTO, PERFIS, PESOS_TIPO, SAZONALIDADE, TAXA_DIARIA } from './perfis'

export interface OpcoesGerador {
  semente: number
  inicio: Date
  agora: Date
  calendario: CalendarioUtil
}

/** Chamado antes da simulação do atendimento. */
interface Rascunho {
  modelo: ModeloChamado
  valores: Partial<Record<NomeVariavel, string>>
  /** Origem técnica do problema; se ele voltar, volta com a mesma origem. */
  origem: string
  sistemaId: SistemaId
  fornecedorId: FornecedorId
  prioridade: Prioridade
  abertoEm: Date
  /** O problema voltou depois de um atendimento anterior. */
  ehRetorno: boolean
  /**
   * Semente própria do chamado: o atendimento de cada chamado usa uma sequência
   * aleatória independente, então ajustar um parâmetro não embaralha a base toda.
   */
  semente: number
}

/** Semente do chamado de retorno, derivada da semente do original. */
const derivarSemente = (semente: number) => (Math.imul(semente ^ 0x5bd1e995, 0x9e3779b1) + 1) >>> 0

interface Simulacao {
  chamado: Omit<Chamado, 'id'>
  /** Quando o mesmo problema volta a ser aberto, se voltar. */
  retornoEm: Date | null
}

const formatoMes = new Intl.DateTimeFormat('pt-BR', { month: 'long' })
const NOMES_FORNECEDOR = new Map(FORNECEDORES.map((f) => [f.id, f.nome]))

const HORAS_DE_ABERTURA: readonly (readonly [number, number])[] = [
  [8, 2],
  [9, 4],
  [10, 4],
  [11, 3],
  [12, 1],
  [13, 2],
  [14, 4],
  [15, 4],
  [16, 3],
  [17, 2],
]

/**
 * Gera a base fictícia de chamados (≈ 600 em 6 meses) seguindo os perfis dos
 * fornecedores e os padrões sazonais. Determinístico para a mesma semente.
 */
export function gerarChamados(opcoes: OpcoesGerador): Chamado[] {
  const gerador = new GeradorChamados(opcoes)
  return gerador.gerar()
}

class GeradorChamados {
  private readonly aleatorio: Aleatorio
  private readonly opcoes: OpcoesGerador

  constructor(opcoes: OpcoesGerador) {
    this.opcoes = opcoes
    this.aleatorio = criarAleatorio(opcoes.semente)
  }

  gerar(): Chamado[] {
    const fila = this.abrirChamadosDoPeriodo()
    const simulados: Omit<Chamado, 'id'>[] = []

    // A fila cresce durante o laço: problemas que voltam viram novos chamados.
    for (let i = 0; i < fila.length; i++) {
      const rascunho = fila[i]!
      const { chamado, retornoEm } = this.simular(rascunho)
      simulados.push(chamado)
      const retorno = retornoEm && this.rascunhoDeRetorno(rascunho, retornoEm)
      if (retorno) fila.push(retorno)
    }

    const cenario = CENARIO_DEMONSTRACAO.filter((chamado) => chamado.abertoEm.getTime() <= this.opcoes.agora.getTime())
    return atribuirIds([...simulados, ...cenario])
  }

  // ── Abertura ──────────────────────────────────────────────────────────────

  private abrirChamadosDoPeriodo(): Rascunho[] {
    const { inicio, agora } = this.opcoes
    const rascunhos: Rascunho[] = []
    for (let dia = inicioDoDia(inicio); dia.getTime() <= agora.getTime(); dia = adicionarDias(dia, 1)) {
      for (const sistema of SISTEMAS_RH) {
        const quantidade = this.aleatorio.poisson(TAXA_DIARIA[sistema.id] * this.fatorDoDia(sistema.id, dia))
        for (let n = 0; n < quantidade; n++) {
          const rascunho = this.novoRascunho(sistema, dia)
          if (rascunho.abertoEm.getTime() <= agora.getTime()) rascunhos.push(rascunho)
        }
      }
    }
    return rascunhos
  }

  private fatorDoDia(sistemaId: SistemaId, dia: Date): number {
    const { calendario } = this.opcoes
    const s = SAZONALIDADE
    const naJanelaDeFechamento = estaNaJanelaDeFechamento(dia, calendario, DIAS_ELEVACAO_FECHAMENTO)

    let fator = ehDiaUtil(dia, calendario)
      ? 1
      : sistemaId === 'ponto'
        ? s.foraDeDiaUtil.ponto
        : s.foraDeDiaUtil.padrao

    if (sistemaId === 'ponto') {
      if (dia.getDay() === 1) fator *= s.pontoSegunda
      if (s.diasTrocaEscala.includes(dia.getDate())) fator *= s.pontoTrocaEscala
    }
    if (sistemaId === 'folha' && naJanelaDeFechamento) fator *= s.folhaFechamento
    if (sistemaId === 'beneficios' && naJanelaDeFechamento) fator *= s.beneficiosFechamento
    if (sistemaId === 'portal' && s.diasPosHolerite.includes(dia.getDate())) fator *= s.portalPosHolerite
    return fator
  }

  private novoRascunho(sistema: SistemaRh, dia: Date): Rascunho {
    const tipo = this.sortearTipo(sistema.fornecedorId, dia)
    const candidatos = MODELOS_POR_SISTEMA[sistema.id].filter((modelo) => modelo.tipo === tipo)
    const modelo = this.aleatorio.escolherPonderado(candidatos.map((m) => [m, m.peso] as const))
    return {
      modelo,
      valores: this.sortearValores(modelo),
      origem: this.aleatorio.escolher(ORIGENS_TECNICAS),
      sistemaId: sistema.id,
      fornecedorId: sistema.fornecedorId,
      prioridade: this.aleatorio.escolherPonderado(modelo.prioridades),
      abertoEm: this.horaDeAbertura(this.aleatorio, dia, sistema.id, tipo),
      ehRetorno: false,
      semente: this.aleatorio.inteiro(0, 0xffffffff),
    }
  }

  private sortearTipo(fornecedorId: FornecedorId, dia: Date): TipoChamado {
    const gargalo = PERFIS[fornecedorId].gargaloEvolutivas
    const demandaExtra = gargalo && dia.getTime() >= gargalo.aPartirDe.getTime() ? gargalo.fatorDemanda : 1
    return this.aleatorio.escolherPonderado(
      PESOS_TIPO[fornecedorId].map(([tipo, peso]) => [tipo, tipo === 'evolutiva' ? peso * demandaExtra : peso] as const),
    )
  }

  private sortearValores(modelo: ModeloChamado): Rascunho['valores'] {
    const texto = `${modelo.titulo} ${modelo.descricao}`
    const valores: Rascunho['valores'] = {}
    for (const nome of Object.keys(VARIAVEIS) as NomeVariavel[]) {
      if (texto.includes(`{${nome}}`)) valores[nome] = this.aleatorio.escolher(VARIAVEIS[nome])
    }
    return valores
  }

  private horaDeAbertura(a: Aleatorio, dia: Date, sistemaId: SistemaId, tipo: TipoChamado): Date {
    const minuto = a.inteiro(0, 59)
    if (!ehDiaUtil(dia, this.opcoes.calendario)) return comHora(dia, a.inteiro(7, 21), minuto)
    if (sistemaId === 'ponto' && tipo === 'incidente' && a.chance(SAZONALIDADE.pontoForaDoExpediente)) {
      return comHora(dia, a.inteiro(0, 23), minuto)
    }
    return comHora(dia, a.escolherPonderado(HORAS_DE_ABERTURA), minuto)
  }

  /** O usuário volta a abrir o mesmo problema no primeiro dia útil a partir de `retornoEm`. */
  private rascunhoDeRetorno(original: Rascunho, retornoEm: Date): Rascunho | null {
    let dia = inicioDoDia(retornoEm)
    while (!ehDiaUtil(dia, this.opcoes.calendario)) dia = adicionarDias(dia, 1)
    const semente = derivarSemente(original.semente)
    let abertoEm = this.horaDeAbertura(criarAleatorio(semente), dia, original.sistemaId, original.modelo.tipo)
    if (abertoEm.getTime() <= retornoEm.getTime()) abertoEm = retornoEm
    if (abertoEm.getTime() > this.opcoes.agora.getTime()) return null
    return { ...original, abertoEm, ehRetorno: true, semente }
  }

  // ── Atendimento ───────────────────────────────────────────────────────────

  private simular(rascunho: Rascunho): Simulacao {
    const aleatorio = criarAleatorio(rascunho.semente)
    return rascunho.modelo.tipo === 'evolutiva'
      ? this.simularEvolutiva(rascunho, aleatorio)
      : this.simularComSla(rascunho, aleatorio)
  }

  private simularComSla(r: Rascunho, a: Aleatorio): Simulacao {
    const { calendario, agora } = this.opcoes
    const perfil = PERFIS[r.fornecedorId]
    const { prioridade } = prioridadeEfetiva(r, calendario)
    const regra = TABELA_SLA[prioridade]
    const avancar = (de: Date, minutos: number) => avancarMinutos(de, minutos, regra.modo, calendario)

    const naSemanaDeFechamento =
      (r.sistemaId === 'folha' || r.sistemaId === 'beneficios') &&
      estaNaJanelaDeFechamento(r.abertoEm, calendario, DIAS_ELEVACAO_FECHAMENTO)
    const chanceEstouro = naSemanaDeFechamento ? perfil.chanceEstouroFechamento : perfil.chanceEstouro

    const respostaMinutos =
      (a.chance(ATENDIMENTO.chanceRespostaAtrasada) ? a.entre(1.05, 1.8) : a.entre(0.1, 0.85)) * regra.respostaMinutos
    const fracaoSolucao = a.chance(chanceEstouro) ? a.entre(1.05, 1.9) : a.entre(...perfil.fracaoSolucao)
    const consumo = Math.max(fracaoSolucao * regra.solucaoMinutos, respostaMinutos + 10)

    const historico: EventoHistorico[] = [
      { estado: 'aberto', em: r.abertoEm },
      {
        estado: 'em-atendimento',
        em: avancar(r.abertoEm, respostaMinutos),
        nota: `Atribuído à sustentação da ${NOMES_FORNECEDOR.get(r.fornecedorId)}`,
      },
    ]

    let resolucao: Date
    if (prioridade !== 'P1' && a.chance(ATENDIMENTO.chancePausa)) {
      const consumidoAntesDaPausa = a.entre(respostaMinutos, consumo)
      const inicioPausa = avancar(r.abertoEm, consumidoAntesDaPausa)
      const horasDePausa = a.chance(ATENDIMENTO.chancePausaLonga)
        ? a.entre(...ATENDIMENTO.pausaLongaDias) * 24
        : a.entre(...ATENDIMENTO.pausaHoras)
      const fimPausa = adicionarMinutos(inicioPausa, horasDePausa * 60)
      historico.push(
        { estado: 'aguardando-usuario', em: inicioPausa, nota: 'Aguardando evidências do usuário' },
        { estado: 'em-atendimento', em: fimPausa, nota: 'Evidências recebidas' },
      )
      resolucao = avancar(fimPausa, consumo - consumidoAntesDaPausa)
    } else {
      resolucao = avancar(r.abertoEm, consumo)
    }

    const chancePaliativa = perfil.chancePaliativa[r.sistemaId] ?? perfil.chancePaliativa.padrao
    const solucao: TipoSolucao =
      r.modelo.tipo === 'incidente' && a.chance(chancePaliativa) ? 'paliativa' : 'definitiva'
    historico.push({ estado: 'resolvido', em: resolucao, nota: notaDeResolucao(solucao, r.modelo) })

    let consumoTotal = consumo
    const chanceReabertura =
      solucao === 'paliativa' ? ATENDIMENTO.chanceReaberturaPaliativa : ATENDIMENTO.chanceReaberturaDefinitiva
    if (a.chance(chanceReabertura)) {
      const reabertura = adicionarMinutos(resolucao, a.entre(0.5, 5) * 24 * 60)
      const extra = a.entre(0.1, 0.4) * regra.solucaoMinutos
      consumoTotal += extra
      historico.push(
        { estado: 'em-atendimento', em: reabertura, nota: 'Reaberto pelo usuário: o problema voltou a ocorrer' },
        { estado: 'resolvido', em: avancar(reabertura, extra), nota: notaDeResolucao(solucao, r.modelo) },
      )
    }

    const visivel = historico.filter((evento) => evento.em.getTime() <= agora.getTime())
    const ultimo = visivel.at(-1)!
    const resolvido = ultimo.estado === 'resolvido'
    const reaberto = visivel.some((_, i) => i > 0 && visivel[i - 1]!.estado === 'resolvido')

    const chanceRetorno = solucao === 'paliativa' ? perfil.chanceRetornoPaliativa : ATENDIMENTO.chanceRetornoDefinitiva
    const retornoEm =
      resolvido && r.modelo.tipo === 'incidente' && a.chance(chanceRetorno)
        ? adicionarMinutos(ultimo.em, a.entre(0.5, 13) * 24 * 60)
        : null

    const satisfacao =
      resolvido && a.chance(ATENDIMENTO.chanceAvaliacao)
        ? notaDeSatisfacao(a, perfil.satisfacaoBase, {
            estourou: consumoTotal > regra.solucaoMinutos,
            ehRetorno: r.ehRetorno,
            reaberto,
          })
        : null

    return {
      chamado: {
        ...camposBasicos(r),
        resolvidoEm: resolvido ? ultimo.em : null,
        historico: visivel,
        reaberto,
        solucao: resolvido ? solucao : null,
        satisfacao,
      },
      retornoEm,
    }
  }

  private simularEvolutiva(r: Rascunho, a: Aleatorio): Simulacao {
    const { agora } = this.opcoes
    const perfil = PERFIS[r.fornecedorId]
    const gargalo = perfil.gargaloEvolutivas
    const noGargalo = gargalo && r.abertoEm.getTime() >= gargalo.aPartirDe.getTime()
    const entregue = !noGargalo || a.chance(gargalo.fracaoEntregue)

    const historico: EventoHistorico[] = [
      { estado: 'aberto', em: r.abertoEm },
      { estado: 'em-atendimento', em: adicionarDias(r.abertoEm, a.entre(1, 5)), nota: 'Análise de impacto iniciada' },
    ]
    if (entregue) {
      const entrega = comHora(adicionarDias(r.abertoEm, a.inteiro(...perfil.duracaoEvolutivaDias)), 17, a.inteiro(0, 59))
      historico.push({ estado: 'resolvido', em: entrega, nota: 'Entregue em produção após homologação' })
    }

    const visivel = historico.filter((evento) => evento.em.getTime() <= agora.getTime())
    const ultimo = visivel.at(-1)!
    const resolvido = ultimo.estado === 'resolvido'

    return {
      chamado: {
        ...camposBasicos(r),
        resolvidoEm: resolvido ? ultimo.em : null,
        historico: visivel,
        reaberto: false,
        solucao: resolvido ? 'definitiva' : null,
        satisfacao:
          resolvido && a.chance(ATENDIMENTO.chanceAvaliacao)
            ? notaDeSatisfacao(a, perfil.satisfacaoBase, { estourou: false, ehRetorno: false, reaberto: false })
            : null,
        evolutiva: {
          requisito: r.modelo.requisito ?? '',
          impacto: r.modelo.impacto ?? '',
          entregaPrevista: comHora(adicionarDias(r.abertoEm, a.inteiro(20, 45)), 18),
        },
      },
      retornoEm: null,
    }
  }

}

function notaDeSatisfacao(
  a: Aleatorio,
  base: number,
  { estourou, ehRetorno, reaberto }: { estourou: boolean; ehRetorno: boolean; reaberto: boolean },
): number {
  const nota = base + a.entre(-0.9, 0.9) - (estourou ? 1.6 : 0) - (ehRetorno ? 1.3 : 0) - (reaberto ? 0.8 : 0)
  return Math.min(5, Math.max(1, Math.round(nota)))
}

function preencher(texto: string, valores: Rascunho['valores'], abertoEm: Date): string {
  return texto
    .replaceAll('{mes}', formatoMes.format(abertoEm))
    .replace(/\{(\w+)\}/g, (marcador, nome: NomeVariavel) => valores[nome] ?? marcador)
    .replace(/^./, (letra) => letra.toLocaleUpperCase('pt-BR'))
}

type CamposBasicos = Pick<
  Chamado,
  'tipo' | 'titulo' | 'descricao' | 'sistemaId' | 'fornecedorId' | 'prioridade' | 'categoria' | 'causa' | 'abertoEm'
>

function camposBasicos(r: Rascunho): CamposBasicos {
  return {
    tipo: r.modelo.tipo,
    titulo: preencher(r.modelo.titulo, r.valores, r.abertoEm),
    descricao: preencher(r.modelo.descricao, r.valores, r.abertoEm),
    sistemaId: r.sistemaId,
    fornecedorId: r.fornecedorId,
    prioridade: r.prioridade,
    categoria: r.modelo.causa,
    causa: [r.modelo.causa, ...Object.values(r.valores), r.origem].join(' · '),
    abertoEm: r.abertoEm,
  }
}

function notaDeResolucao(solucao: TipoSolucao, modelo: ModeloChamado): string {
  return solucao === 'paliativa'
    ? `Contorno aplicado: ${modelo.contorno ?? 'ajuste manual'}. Causa raiz não tratada.`
    : 'Correção aplicada e validada com o usuário'
}

/** Ordena por abertura e numera por tipo: INC-2026-0001, REQ-2026-0001... */
function atribuirIds(chamados: Omit<Chamado, 'id'>[]): Chamado[] {
  const contadores = new Map<string, number>()
  return chamados
    .toSorted((a, b) => a.abertoEm.getTime() - b.abertoEm.getTime())
    .map((chamado) => {
      const chave = `${PREFIXOS_ID[chamado.tipo]}-${chamado.abertoEm.getFullYear()}`
      const numero = (contadores.get(chave) ?? 0) + 1
      contadores.set(chave, numero)
      return { id: `${chave}-${String(numero).padStart(4, '0')}`, ...chamado }
    })
}
