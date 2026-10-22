import { describe, expect, it } from 'vitest'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { INICIO_DADOS } from '@/config/referencia'
import { CONTEXTO_ANALISE, gerarBaseFicticia } from '@/dados/base-ficticia'
import type { Dashboard } from '@/tipos/dashboard'
import { analisarChamados } from '../analise'
import { dadosDoWidget } from './agregacao'
import { abasDoDashboard, nomeDeAba } from './exportacao'
import { widgetsDoModelo } from './modelos'

describe('nomeDeAba', () => {
  it('remove caracteres proibidos, limita a 31 e evita repetição', () => {
    const usados = new Set<string>()
    expect(nomeDeAba('SLA [Beta]: mês/mês', usados)).toBe('SLA Beta mês mês')
    expect(nomeDeAba('SLA [Beta]: mês/mês', usados)).toBe('SLA Beta mês mês (2)')
    expect(nomeDeAba('x'.repeat(40), usados)).toHaveLength(31)
  })
})

describe('abasDoDashboard', () => {
  it('gera o resumo e uma aba por widget com agrupamento', () => {
    const { agora } = CONTEXTO_ANALISE
    const dashboard: Dashboard = {
      id: 'DSH-001',
      nome: 'Reunião mensal com Beta Tech',
      ...widgetsDoModelo('reuniao-fornecedor'),
      criadoEm: agora,
      atualizadoEm: agora,
      modeloId: 'reuniao-fornecedor',
    }
    const contexto = {
      analisados: analisarChamados(gerarBaseFicticia(), CONTEXTO_ANALISE),
      filtrosGlobais: { periodo: 'tudo' as const, sistemaId: null, fornecedorId: null },
      agora,
      inicioDados: INICIO_DADOS,
      sistemas: SISTEMAS_RH,
      fornecedores: FORNECEDORES,
    }
    const dados = new Map(dashboard.widgets.map((w) => [w.id, dadosDoWidget(w, contexto)]))
    const abas = abasDoDashboard(dashboard, dados, agora)
    // Resumo + linha (SLA por mês) + barras (reincidência por sistema) + tabela (volume por prioridade)
    expect(abas.map((a) => a.nome)).toEqual([
      'Resumo',
      'SLA cumprido por mês',
      'Reincidência por sistema de RH',
      'Volume de chamados por priorida',
    ])
    // 7 widgets com indicador: o cartão de texto fica de fora.
    expect(abas[0]!.linhas.length - abas[0]!.linhaCabecalho - 1).toBe(7)
  })
})
