import { useId } from 'react'
import { ArrowLeft, ArrowRight, CircleAlert, Sparkles } from 'lucide-react'
import { COLUNAS_IMPORTACAO, type CampoImportacao, type ColunaImportacao } from '@/config/excel'
import { Botao } from '@/componentes/ui/Botao'
import { lerDataHora } from '@/lib/excel/datas-excel'
import { camposObrigatoriosFaltando, type Mapeamento } from '@/lib/excel/mapeamento'
import type { PlanilhaLida } from '@/lib/excel/planilha'
import { formatarDataHora } from '@/lib/formatacao'

interface PassoMapeamentoProps {
  planilha: PlanilhaLida
  nomeArquivo: string
  mapeamento: Mapeamento
  sugestao: Mapeamento
  aoAlterar: (campo: CampoImportacao, coluna: number | null) => void
  aoVoltar: () => void
  aoAvancar: () => void
}

const NAO_IMPORTAR = '-1'

const CAMPOS_DE_DATA: ReadonlySet<CampoImportacao> = new Set(['abertura', 'resolucao'])

/** Primeiro valor preenchido da coluna, como exemplo do que será importado. */
function exemploDaColuna(planilha: PlanilhaLida, coluna: number | null, campo: CampoImportacao): string {
  if (coluna === null) return ''
  const valor = planilha.linhas.find((l) => l[coluna] !== null && String(l[coluna]).trim() !== '')?.[coluna]
  if (valor === undefined || valor === null) return ''
  // Datas do Excel chegam como número serial: mostra como o usuário vê na planilha.
  const comoData = CAMPOS_DE_DATA.has(campo) && typeof valor === 'number' ? lerDataHora(valor) : null
  return comoData ? formatarDataHora(comoData) : String(valor)
}

function LinhaCampo({
  coluna,
  planilha,
  selecionada,
  sugerida,
  aoAlterar,
}: {
  coluna: ColunaImportacao
  planilha: PlanilhaLida
  selecionada: number | null
  sugerida: boolean
  aoAlterar: (coluna: number | null) => void
}) {
  const id = useId()
  return (
    <li className="grid gap-2 py-3 md:grid-cols-[14rem_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-4">
      <label htmlFor={id} className="text-sm font-medium text-texto">
        {coluna.rotulo}
        {coluna.obrigatoria && <span className="text-estourado-texto"> *</span>}
      </label>
      <div className="flex items-center gap-2">
        <select
          id={id}
          value={selecionada ?? NAO_IMPORTAR}
          onChange={(e) => aoAlterar(e.target.value === NAO_IMPORTAR ? null : Number(e.target.value))}
          className="h-10 min-w-0 flex-1 rounded-lg bg-superficie px-3 text-sm text-texto ring-1 ring-borda ring-inset"
        >
          <option value={NAO_IMPORTAR}>Não importar</option>
          {planilha.cabecalhos.map((cabecalho, indice) => (
            <option key={indice} value={indice}>
              {cabecalho || `Coluna ${indice + 1}`}
            </option>
          ))}
        </select>
        {sugerida && selecionada !== null && (
          <span title="Correspondência sugerida automaticamente" className="inline-flex items-center gap-1 text-xs font-medium text-primaria">
            <Sparkles aria-hidden className="size-3.5" />
            Sugerido
          </span>
        )}
      </div>
      <p className="truncate text-xs text-texto-suave">
        {selecionada !== null ? <>Ex.: {exemploDaColuna(planilha, selecionada, coluna.campo) || '(vazio)'}</> : coluna.aceita}
      </p>
    </li>
  )
}

/** Passo 2: confirmar ou ajustar a correspondência entre colunas (CONCEITO.md, seção 8.1). */
export function PassoMapeamento({ planilha, nomeArquivo, mapeamento, sugestao, aoAlterar, aoVoltar, aoAvancar }: PassoMapeamentoProps) {
  const faltando = camposObrigatoriosFaltando(mapeamento)
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-texto-suave">
        <strong className="text-texto">{nomeArquivo}</strong> · aba “{planilha.aba}” · {planilha.linhas.length} linhas ·{' '}
        {planilha.cabecalhos.length} colunas. Confira a correspondência sugerida.
      </p>
      <ul className="divide-y divide-borda">
        {COLUNAS_IMPORTACAO.map((coluna) => (
          <LinhaCampo
            key={coluna.campo}
            coluna={coluna}
            planilha={planilha}
            selecionada={mapeamento[coluna.campo]}
            sugerida={mapeamento[coluna.campo] === sugestao[coluna.campo]}
            aoAlterar={(indice) => aoAlterar(coluna.campo, indice)}
          />
        ))}
      </ul>
      {faltando.length > 0 && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-estourado-fundo p-3 text-sm text-estourado-texto">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          Escolha uma coluna para: {faltando.map((c) => c.rotulo).join(', ')}.
        </p>
      )}
      <div className="flex gap-2">
        <Botao variante="secundario" icone={ArrowLeft} onClick={aoVoltar}>
          Trocar arquivo
        </Botao>
        <Botao onClick={aoAvancar} disabled={faltando.length > 0}>
          Validar dados
          <ArrowRight aria-hidden className="size-4" />
        </Botao>
      </div>
    </div>
  )
}
