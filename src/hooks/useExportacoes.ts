import { useCallback, useState } from 'react'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { DATA_REFERENCIA, INICIO_DADOS } from '@/config/referencia'
import { META_SLA } from '@/config/sla'
import type { ChamadoAnalisado } from '@/lib/analise'
import { baixarArquivo, nomeDeArquivo, TIPO_CSV, TIPO_XLSX } from '@/lib/arquivos'
import { descreverFiltros } from '@/lib/filtros'
import { desempenhoFornecedores } from '@/lib/fornecedores'
import { instanteDeMedicao } from '@/lib/kpis'
import { slaPorMes } from '@/lib/series'
import { useAvisos } from '@/store/avisos'
import { useChamados } from '@/store/chamados'
import { useFiltros } from '@/store/filtros'
import { usePlanoAcao } from '@/store/plano-acao'
import { useCatalogoFiltros } from './useCatalogoFiltros'
import { useChamadosFiltrados } from './useChamadosFiltrados'

const CATALOGO = { fornecedores: FORNECEDORES, sistemas: SISTEMAS_RH }

/** A biblioteca de Excel só é baixada quando o usuário exporta algo. */
const carregarExcel = () =>
  Promise.all([import('@/lib/excel/planilha'), import('@/lib/excel/relatorio')]).then(([planilha, relatorio]) => ({
    ...planilha,
    ...relatorio,
  }))

export type IdExportacao = 'relatorio' | 'recorte' | 'base-xlsx' | 'base-csv' | 'modelo'

/** Exportações em Excel (CONCEITO.md, seção 8.2), com aviso de sucesso ou erro. */
export function useExportacoes() {
  const { doPeriodo, semPeriodo, intervalo } = useChamadosFiltrados()
  const todos = useChamados((estado) => estado.analisados)
  const acoes = usePlanoAcao((estado) => estado.acoes)
  const filtros = useFiltros()
  const catalogoFiltros = useCatalogoFiltros()
  const avisar = useAvisos((estado) => estado.avisar)
  const [gerando, setGerando] = useState<IdExportacao | null>(null)

  const executar = useCallback(
    async (id: IdExportacao, gerar: (excel: Awaited<ReturnType<typeof carregarExcel>>) => string) => {
      setGerando(id)
      try {
        const nome = gerar(await carregarExcel())
        avisar(`Arquivo ${nome} gerado.`)
      } catch (erro) {
        console.error(erro)
        avisar('Não foi possível gerar o arquivo. Tente novamente.', 'erro')
      } finally {
        setGerando(null)
      }
    },
    [avisar],
  )

  const [periodo, ...recorte] = descreverFiltros(filtros, catalogoFiltros)

  const exportarRelatorio = () =>
    executar('relatorio', (excel) => {
      const instante = instanteDeMedicao(intervalo, DATA_REFERENCIA)
      const abas = excel.relatorioSla(
        {
          desempenhos: desempenhoFornecedores(doPeriodo, instante, FORNECEDORES),
          todos: doPeriodo,
          instante,
          meta: META_SLA,
          descricaoPeriodo: periodo ?? '',
          descricaoFiltros: recorte.join(' · '),
          geradoEm: DATA_REFERENCIA,
          chamados: doPeriodo,
          slaMensal: slaPorMes(semPeriodo, INICIO_DADOS, DATA_REFERENCIA),
          acoes: filtros.fornecedorId ? acoes.filter((a) => !a.fornecedorId || a.fornecedorId === filtros.fornecedorId) : acoes,
        },
        CATALOGO,
      )
      const nome = `${nomeDeArquivo(`relatorio-sla ${periodo ?? ''}`, DATA_REFERENCIA)}.xlsx`
      baixarArquivo(excel.gerarXlsx(abas), nome, TIPO_XLSX)
      return nome
    })

  /** "Exportar o que estou vendo": a lista recebida (já filtrada pela tela). */
  const exportarLista = (lista: readonly ChamadoAnalisado[], descricao = 'chamados recorte') =>
    executar('recorte', (excel) => {
      const nome = `${nomeDeArquivo(descricao, DATA_REFERENCIA)}.xlsx`
      baixarArquivo(excel.gerarXlsx([excel.abaChamados(lista, DATA_REFERENCIA, CATALOGO)]), nome, TIPO_XLSX)
      return nome
    })

  const exportarBase = (formato: 'xlsx' | 'csv') =>
    executar(formato === 'xlsx' ? 'base-xlsx' : 'base-csv', (excel) => {
      const aba = excel.abaChamados(todos, DATA_REFERENCIA, CATALOGO)
      const nome = `${nomeDeArquivo('base-chamados-power-bi', DATA_REFERENCIA)}.${formato}`
      if (formato === 'xlsx') baixarArquivo(excel.gerarXlsx([aba]), nome, TIPO_XLSX)
      else baixarArquivo(excel.gerarCsv(aba), nome, TIPO_CSV)
      return nome
    })

  const baixarModelo = () =>
    executar('modelo', (excel) => {
      const nome = 'modelo-importacao-chamados.xlsx'
      baixarArquivo(excel.gerarXlsx(excel.modeloImportacao()), nome, TIPO_XLSX)
      return nome
    })

  return {
    gerando,
    quantidadeRecorte: doPeriodo.length,
    quantidadeBase: todos.length,
    exportarRelatorio,
    exportarRecorte: () => exportarLista(doPeriodo),
    exportarLista,
    exportarBase,
    baixarModelo,
  }
}
