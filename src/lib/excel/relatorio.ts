import { COLUNAS_IMPORTACAO } from '@/config/excel'
import { ROTULOS_ESTADO, ROTULOS_TIPO } from '@/config/chamados'
import { ROTULOS_INDICADOR_ACAO, ROTULOS_STATUS_ACAO } from '@/config/plano-acao'
import { NOME_COMPLETO_SISTEMA } from '@/config/projeto'
import type { Fornecedor, SistemaRh } from '@/tipos/catalogo'
import type { Acao } from '@/tipos/plano-acao'
import type { StatusSla } from '@/tipos/sla'
import type { ChamadoAnalisado } from '../analise'
import { formatarDataHora, formatarMesAno } from '../formatacao'
import type { DesempenhoFornecedor } from '../fornecedores'
import { resumirIndicadores } from '../indicadores'
import { situacaoPrazo } from '../plano-acao'
import type { PontoMensal } from '../series'
import { apresentarSla } from '../sla/apresentacao'
import { cabecalho, data, numero, texto, type Celula, type DefinicaoAba } from './abas'

export interface CatalogoRelatorio {
  fornecedores: readonly Fornecedor[]
  sistemas: readonly SistemaRh[]
}

const simNao = (valor: boolean) => (valor ? 'Sim' : 'Não')

/** Status da meta de SLA para colorir a célula: atingiu, perto (até 5 p.p. abaixo) ou abaixo. */
export function tomDaMeta(valor: number | null, meta: number): StatusSla | undefined {
  if (valor === null) return undefined
  if (valor >= meta) return 'no-prazo'
  return valor >= meta - 0.05 ? 'em-risco' : 'estourado'
}

/**
 * Base de chamados em tabela plana, uma linha por chamado: serve para o
 * relatório e como fonte para o Power BI (CONCEITO.md, seção 8.2).
 */
export function abaChamados(lista: readonly ChamadoAnalisado[], agora: Date, catalogo: CatalogoRelatorio): DefinicaoAba {
  const sistema = new Map(catalogo.sistemas.map((s) => [s.id, s.nome]))
  const fornecedor = new Map(catalogo.fornecedores.map((f) => [f.id, f.nome]))
  const linhas = lista
    .toSorted((a, b) => a.abertoEm.getTime() - b.abertoEm.getTime())
    .map((c): Celula[] => {
      const sla = apresentarSla(c, agora)
      return [
        texto(c.id),
        texto(ROTULOS_TIPO[c.tipo]),
        texto(c.titulo),
        texto(sistema.get(c.sistemaId) ?? c.sistemaId),
        texto(fornecedor.get(c.fornecedorId) ?? c.fornecedorId),
        texto(c.prioridade),
        texto(c.sla?.prioridadeEfetiva ?? c.prioridade),
        data(c.abertoEm),
        data(c.resolvidoEm),
        texto(ROTULOS_ESTADO[c.estado]),
        texto(sla.rotulo.split(' · ')[0] ?? sla.rotulo, sla.tom),
        numero(c.sla ? c.sla.fracaoConsumida : null, 'percentual'),
        texto(simNao(c.reincidente)),
        numero(c.satisfacao),
        texto(c.categoria),
      ]
    })
  return {
    nome: 'Chamados',
    linhas: [
      cabecalho([
        'ID do chamado',
        'Tipo',
        'Título',
        'Sistema de RH',
        'Fornecedor',
        'Prioridade informada',
        'Prioridade efetiva',
        'Abertura',
        'Resolução',
        'Status',
        'Situação do SLA',
        '% do prazo consumido',
        'Reincidente',
        'Nota de satisfação',
        'Categoria',
      ]),
      ...linhas,
    ],
    larguras: [16, 12, 52, 24, 20, 12, 12, 17, 17, 20, 24, 12, 12, 12, 34],
    linhaCabecalho: 0,
    filtro: true,
  }
}

export interface EntradaResumo {
  desempenhos: readonly DesempenhoFornecedor[]
  todos: readonly ChamadoAnalisado[]
  instante: Date
  meta: number
  descricaoPeriodo: string
  descricaoFiltros: string
  geradoEm: Date
}

/** KPIs por fornecedor, com linha de total (aba "Resumo"). */
export function abaResumo(entrada: EntradaResumo, catalogo: CatalogoRelatorio): DefinicaoAba {
  const nome = new Map(catalogo.fornecedores.map((f) => [f.id, f.nome]))
  const linhaDe = (rotulo: string, r: ReturnType<typeof resumirIndicadores>, estilo?: 'total'): Celula[] => [
    texto(rotulo, estilo),
    numero(r.volume, 'inteiro', estilo),
    numero(r.percentualSla, 'percentual', tomDaMeta(r.percentualSla, entrada.meta) ?? estilo),
    numero(r.mttrHoras, 'decimal', estilo),
    numero(r.taxaReincidencia, 'percentual', estilo),
    numero(r.satisfacao, 'decimal', estilo),
    numero(r.chamadosEmAberto, 'inteiro', estilo),
    numero(r.backlogEvolutivas.quantidade, 'inteiro', estilo),
  ]
  return {
    nome: 'Resumo',
    linhas: [
      [texto(`Relatório de SLA – ${NOME_COMPLETO_SISTEMA}`, 'titulo')],
      [texto(`Período: ${entrada.descricaoPeriodo} · ${entrada.descricaoFiltros}`, 'subtitulo')],
      [texto(`Gerado em ${formatarDataHora(entrada.geradoEm)} · Meta de SLA: ${Math.round(entrada.meta * 100)}% · Dados fictícios`, 'subtitulo')],
      [],
      cabecalho(['Fornecedor', 'Chamados', 'SLA cumprido', 'MTTR (h)', 'Reincidência', 'Satisfação (1–5)', 'Em aberto', 'Evolutivas em aberto']),
      ...entrada.desempenhos.map((d) => linhaDe(nome.get(d.fornecedorId) ?? d.fornecedorId, d.resumo)),
      linhaDe('Total', resumirIndicadores(entrada.todos, entrada.instante), 'total'),
    ],
    larguras: [24, 12, 14, 12, 14, 16, 12, 20],
    linhaCabecalho: 4,
    filtro: false,
  }
}

/** SLA mês a mês contra a meta. */
export function abaSlaPorMes(pontos: readonly PontoMensal[], meta: number): DefinicaoAba {
  return {
    nome: 'SLA por mês',
    linhas: [
      cabecalho(['Mês', 'Resolvidos', 'SLA cumprido', 'Meta', 'Situação']),
      ...pontos.map((p): Celula[] => {
        const tom = tomDaMeta(p.valor, meta)
        const situacao = p.valor === null ? 'Sem resolvidos' : p.valor >= meta ? 'Meta atingida' : 'Abaixo da meta'
        return [
          texto(formatarMesAno(p.inicioDoMes)),
          numero(p.base),
          numero(p.valor, 'percentual', tom),
          numero(meta, 'percentual'),
          texto(situacao, tom),
        ]
      }),
    ],
    larguras: [20, 12, 14, 10, 18],
    linhaCabecalho: 0,
    filtro: true,
  }
}

/** Plano de ação com a situação do prazo. */
export function abaPlanoAcao(acoes: readonly Acao[], agora: Date, catalogo: CatalogoRelatorio): DefinicaoAba {
  const nome = new Map(catalogo.fornecedores.map((f) => [f.id, f.nome]))
  return {
    nome: 'Plano de ação',
    linhas: [
      cabecalho(['ID', 'Ação', 'Indicador', 'Fornecedor', 'Responsável', 'Prazo', 'Status', 'Situação do prazo', 'Concluída em']),
      ...acoes
        .toSorted((a, b) => a.prazo.getTime() - b.prazo.getTime())
        .map((acao): Celula[] => {
          const prazo = situacaoPrazo(acao, agora)
          return [
            texto(acao.id),
            texto(acao.titulo),
            texto(ROTULOS_INDICADOR_ACAO[acao.indicador]),
            texto(acao.fornecedorId ? (nome.get(acao.fornecedorId) ?? acao.fornecedorId) : 'Geral'),
            texto(acao.responsavel),
            data(acao.prazo, 'data'),
            texto(ROTULOS_STATUS_ACAO[acao.status]),
            texto(prazo.texto, prazo.tom),
            data(acao.concluidaEm, 'data'),
          ]
        }),
    ],
    larguras: [10, 56, 22, 20, 36, 12, 14, 24, 14],
    linhaCabecalho: 0,
    filtro: true,
  }
}

export interface EntradaRelatorio extends EntradaResumo {
  /** Chamados do recorte filtrado. */
  chamados: readonly ChamadoAnalisado[]
  slaMensal: readonly PontoMensal[]
  acoes: readonly Acao[]
}

/** Relatório mensal de SLA com as 4 abas da seção 8.2. */
export function relatorioSla(entrada: EntradaRelatorio, catalogo: CatalogoRelatorio): DefinicaoAba[] {
  return [
    abaResumo(entrada, catalogo),
    abaChamados(entrada.chamados, entrada.geradoEm, catalogo),
    abaSlaPorMes(entrada.slaMensal, entrada.meta),
    abaPlanoAcao(entrada.acoes, entrada.geradoEm, catalogo),
  ]
}

/** Planilha modelo para importação: cabeçalhos, duas linhas de exemplo e instruções. */
export function modeloImportacao(): DefinicaoAba[] {
  const exemplo2 = ['REQ-2026-0459', 'Requisição', 'Cadastrar dependente no plano de saúde', 'Benefícios', 'Alfa Sistemas', 'P3', '05/10/2026 14:00', '', 'Em atendimento', 'Não', '']
  return [
    {
      nome: 'Chamados',
      linhas: [
        cabecalho(COLUNAS_IMPORTACAO.map((c) => c.rotulo)),
        COLUNAS_IMPORTACAO.map((c) => texto(c.exemplo)),
        exemplo2.map((valor) => texto(valor || null)),
      ],
      larguras: COLUNAS_IMPORTACAO.map((c) => Math.max(14, c.rotulo.length + 4)),
      linhaCabecalho: 0,
      filtro: false,
    },
    {
      nome: 'Instruções',
      linhas: [
        [texto('Como preencher a planilha de chamados', 'titulo')],
        [texto('Uma linha por chamado. IDs já existentes atualizam o chamado; os novos são incluídos.', 'subtitulo')],
        [],
        cabecalho(['Coluna', 'Obrigatória', 'Valores aceitos', 'Exemplo']),
        ...COLUNAS_IMPORTACAO.map((c) => [texto(c.rotulo), texto(simNao(c.obrigatoria)), texto(c.aceita), texto(c.exemplo)]),
      ],
      larguras: [26, 12, 70, 36],
      linhaCabecalho: 3,
      filtro: false,
    },
  ]
}
