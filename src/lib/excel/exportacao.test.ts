import XLSX from 'xlsx-js-style'
import { describe, expect, it } from 'vitest'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { INICIO_DADOS } from '@/config/referencia'
import { META_SLA } from '@/config/sla'
import { CONTEXTO_ANALISE, gerarBaseFicticia } from '@/dados/base-ficticia'
import { criarPlanoInicial } from '@/dados/plano-acao-inicial'
import { analisarChamados } from '../analise'
import { desempenhoFornecedores } from '../fornecedores'
import { slaPorMes } from '../series'
import { lerDataHora } from './datas-excel'
import { sugerirMapeamento } from './mapeamento'
import { detectarSeparador, gerarCsv, gerarXlsx, lerPlanilha } from './planilha'
import { abaChamados, modeloImportacao, relatorioSla, tomDaMeta } from './relatorio'
import { validarLinhas } from './validacao'

const { agora } = CONTEXTO_ANALISE
const catalogo = { fornecedores: FORNECEDORES, sistemas: SISTEMAS_RH }
const chamados = analisarChamados(gerarBaseFicticia(), CONTEXTO_ANALISE)

const relatorio = relatorioSla(
  {
    desempenhos: desempenhoFornecedores(chamados, agora, FORNECEDORES),
    todos: chamados,
    instante: agora,
    meta: META_SLA,
    descricaoPeriodo: 'Todo o período',
    descricaoFiltros: 'Todos os sistemas e fornecedores',
    geradoEm: agora,
    chamados,
    slaMensal: slaPorMes(chamados, INICIO_DADOS, agora),
    acoes: criarPlanoInicial().acoes,
  },
  catalogo,
)

describe('relatório mensal de SLA', () => {
  it('tem as 4 abas da seção 8.2', () => {
    expect(relatorio.map((a) => a.nome)).toEqual(['Resumo', 'Chamados', 'SLA por mês', 'Plano de ação'])
  })

  it('o resumo traz uma linha por fornecedor e o total', () => {
    const resumo = relatorio[0]!
    const tabela = resumo.linhas.slice(resumo.linhaCabecalho + 1).map((l) => l[0]?.valor)
    expect(tabela).toEqual(['Alfa Sistemas', 'Beta Tech', 'Gama Consultoria', 'Total'])
  })

  it('a aba de chamados tem uma linha por chamado e filtro ativado', () => {
    const aba = relatorio[1]!
    expect(aba.linhas).toHaveLength(chamados.length + 1)
    expect(aba.filtro).toBe(true)
    expect(aba.linhas[0]!.every((c) => c.estilo === 'cabecalho')).toBe(true)
  })

  it('a situação do SLA leva a cor de status', () => {
    const estilos = new Set(relatorio[1]!.linhas.slice(1).map((l) => l[10]?.estilo))
    expect(estilos).toEqual(new Set(['no-prazo', 'em-risco', 'estourado', 'concluido']))
  })

  it('colore a meta: atingiu, perto ou abaixo', () => {
    expect(tomDaMeta(0.96, 0.95)).toBe('no-prazo')
    expect(tomDaMeta(0.92, 0.95)).toBe('em-risco')
    expect(tomDaMeta(0.85, 0.95)).toBe('estourado')
    expect(tomDaMeta(null, 0.95)).toBeUndefined()
  })
})

describe('arquivo .xlsx gerado', () => {
  const lido = XLSX.read(gerarXlsx(relatorio), { type: 'array' })

  it('abre no Excel com as mesmas abas, larguras e filtro', () => {
    expect(lido.SheetNames).toEqual(['Resumo', 'Chamados', 'SLA por mês', 'Plano de ação'])
    const aba = lido.Sheets.Chamados!
    expect(aba['!autofilter']?.ref).toMatch(/^A1:O\d+$/)
    expect(aba.A1?.v).toBe('ID do chamado')
  })

  it('grava datas como data do Excel (sem deslocar fuso)', () => {
    const primeira = relatorio[1]!.linhas[1]![7]!.valor as Date
    expect(lerDataHora(lido.Sheets.Chamados!.H2?.v)).toEqual(new Date(primeira.getFullYear(), primeira.getMonth(), primeira.getDate(), primeira.getHours(), primeira.getMinutes()))
  })
})

describe('modelo de importação', () => {
  it('o modelo gerado é reconhecido e validado sem erros', () => {
    const planilha = lerPlanilha(gerarXlsx(modeloImportacao()).buffer as ArrayBuffer)
    const mapeamento = sugerirMapeamento(planilha.cabecalhos)
    expect(Object.values(mapeamento).every((indice) => indice !== null)).toBe(true)
    const { resumo } = validarLinhas(planilha.linhas, mapeamento, {
      idsExistentes: new Set(),
      agora,
      sistemas: SISTEMAS_RH,
      fornecedores: FORNECEDORES,
      nomeArquivo: 'modelo.xlsx',
    })
    expect(resumo).toMatchObject({ total: 2, validas: 2, comErro: 0 })
  })
})

describe('CSV', () => {
  it('usa ponto e vírgula e BOM para o Excel em português', () => {
    const csv = gerarCsv(abaChamados(chamados.slice(0, 2), agora, catalogo))
    expect(csv.startsWith('﻿ID do chamado;Tipo;')).toBe(true)
  })

  it('detecta o separador e lê CSV sem converter datas por conta própria', () => {
    expect(detectarSeparador('a;b;c\n1;2;3')).toBe(';')
    expect(detectarSeparador('a,b,c\n1,2,3')).toBe(',')
    const lida = lerPlanilha('﻿Nº Chamado;Dt Abertura\nINC-2026-0901;03/10/2026 08:15\n')
    expect(lida.cabecalhos).toEqual(['Nº Chamado', 'Dt Abertura'])
    expect(lida.linhas).toEqual([['INC-2026-0901', '03/10/2026 08:15']])
  })

  it('rejeita planilha vazia', () => {
    expect(() => lerPlanilha('')).toThrow()
  })
})
