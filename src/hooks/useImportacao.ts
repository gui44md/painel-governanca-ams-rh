import { useCallback, useState } from 'react'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { TAMANHO_MAXIMO_ARQUIVO_MB, type CampoImportacao } from '@/config/excel'
import { DATA_REFERENCIA } from '@/config/referencia'
import { decodificarTexto, formatoDoArquivo } from '@/lib/arquivos'
import { sugerirMapeamento, type Mapeamento } from '@/lib/excel/mapeamento'
import type { PlanilhaLida } from '@/lib/excel/planilha'
import { validarLinhas, type ResultadoValidacao } from '@/lib/excel/validacao'
import { useAvisos } from '@/store/avisos'
import { useChamados } from '@/store/chamados'

export type PassoImportacao = 'envio' | 'mapeamento' | 'validacao' | 'confirmacao' | 'concluido'

interface EstadoImportacao {
  passo: PassoImportacao
  nomeArquivo: string | null
  planilha: PlanilhaLida | null
  /** Sugestão automática, para marcar na tela o que foi sugerido. */
  sugestao: Mapeamento | null
  mapeamento: Mapeamento | null
  resultado: ResultadoValidacao | null
  erro: string | null
  lendo: boolean
}

const INICIAL: EstadoImportacao = {
  passo: 'envio',
  nomeArquivo: null,
  planilha: null,
  sugestao: null,
  mapeamento: null,
  resultado: null,
  erro: null,
  lendo: false,
}

/** Fluxo de importação em 4 passos (CONCEITO.md, seção 8.1). */
export function useImportacao() {
  const [estado, setEstado] = useState<EstadoImportacao>(INICIAL)
  const chamados = useChamados((s) => s.chamados)
  const importar = useChamados((s) => s.importar)
  const avisar = useAvisos((s) => s.avisar)

  const carregarArquivo = useCallback(async (arquivo: File) => {
    const formato = formatoDoArquivo(arquivo.name)
    if (!formato) {
      setEstado({ ...INICIAL, erro: 'Formato não aceito. Envie um arquivo .xlsx ou .csv.' })
      return
    }
    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_MB * 1024 * 1024) {
      setEstado({ ...INICIAL, erro: `Arquivo maior que ${TAMANHO_MAXIMO_ARQUIVO_MB} MB.` })
      return
    }
    setEstado({ ...INICIAL, lendo: true, nomeArquivo: arquivo.name })
    try {
      const { lerPlanilha } = await import('@/lib/excel/planilha')
      const bytes = await arquivo.arrayBuffer()
      const planilha = lerPlanilha(formato === 'csv' ? decodificarTexto(bytes) : bytes)
      if (planilha.linhas.length === 0) throw new Error('A planilha não tem linhas de dados abaixo do cabeçalho.')
      const sugestao = sugerirMapeamento(planilha.cabecalhos)
      setEstado({ ...INICIAL, passo: 'mapeamento', nomeArquivo: arquivo.name, planilha, sugestao, mapeamento: sugestao })
    } catch (erro) {
      setEstado({
        ...INICIAL,
        erro: erro instanceof Error ? erro.message : 'Não foi possível ler o arquivo.',
      })
    }
  }, [])

  const alterarMapeamento = useCallback(
    (campo: CampoImportacao, coluna: number | null) =>
      setEstado((atual) => (atual.mapeamento ? { ...atual, mapeamento: { ...atual.mapeamento, [campo]: coluna } } : atual)),
    [],
  )

  const validar = useCallback(() => {
    setEstado((atual) => {
      if (!atual.planilha || !atual.mapeamento) return atual
      const resultado = validarLinhas(atual.planilha.linhas, atual.mapeamento, {
        idsExistentes: new Set(chamados.map((c) => c.id)),
        agora: DATA_REFERENCIA,
        sistemas: SISTEMAS_RH,
        fornecedores: FORNECEDORES,
        nomeArquivo: atual.nomeArquivo ?? 'planilha',
      })
      return { ...atual, passo: 'validacao', resultado }
    })
  }, [chamados])

  const irPara = useCallback((passo: PassoImportacao) => setEstado((atual) => ({ ...atual, passo })), [])

  const confirmar = useCallback(() => {
    const validos = estado.resultado?.linhas.flatMap((l) => (l.chamado ? [l.chamado] : [])) ?? []
    if (validos.length === 0) return
    importar(validos)
    const { novos = 0, atualizados = 0 } = estado.resultado?.resumo ?? {}
    avisar(`Importação concluída: ${novos} chamados novos e ${atualizados} atualizados. Indicadores atualizados.`)
    setEstado((atual) => ({ ...atual, passo: 'concluido' }))
  }, [estado.resultado, importar, avisar])

  const reiniciar = useCallback(() => setEstado(INICIAL), [])

  return { ...estado, carregarArquivo, alterarMapeamento, validar, irPara, confirmar, reiniciar }
}
