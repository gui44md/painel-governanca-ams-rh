import { useState } from 'react'
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { COLUNAS_IMPORTACAO, LINHAS_PREVIA_IMPORTACAO, type CampoImportacao } from '@/config/excel'
import { Botao } from '@/componentes/ui/Botao'
import { IndicadorResumo } from '@/componentes/ui/IndicadorResumo'
import { cx } from '@/lib/classes'
import type { LinhaValidada, ResultadoValidacao } from '@/lib/excel/validacao'

const COLUNAS_PREVIA: readonly CampoImportacao[] = ['id', 'tipo', 'titulo', 'sistema', 'prioridade', 'abertura', 'resolucao', 'status', 'satisfacao']
const ROTULO = new Map(COLUNAS_IMPORTACAO.map((c) => [c.campo, c.rotulo]))

const ROTULO_SITUACAO = { novo: 'Novo', atualizado: 'Atualiza', ignorado: 'Ignorado' } as const
const CLASSE_SITUACAO = {
  novo: 'bg-no-prazo-fundo text-no-prazo-texto',
  atualizado: 'bg-primaria-clara text-primaria',
  ignorado: 'bg-estourado-fundo text-estourado-texto',
} as const

function Celula({ linha, campo }: { linha: LinhaValidada; campo: CampoImportacao }) {
  const problema = linha.problemas.find((p) => p.campo === campo && p.nivel === 'erro') ?? linha.problemas.find((p) => p.campo === campo)
  const valor = linha.valores[campo]
  if (!problema) return <td className="max-w-56 truncate px-2 py-2">{valor}</td>
  const erro = problema.nivel === 'erro'
  const Icone = erro ? CircleAlert : TriangleAlert
  return (
    <td
      title={problema.mensagem}
      className={cx(
        'max-w-56 px-2 py-2 font-medium',
        erro ? 'bg-estourado-fundo text-estourado-texto' : 'bg-em-risco-fundo text-em-risco-texto',
      )}
    >
      <span className="flex items-center gap-1">
        <Icone aria-hidden className="size-3.5 shrink-0" />
        <span className="truncate">{valor || '(vazio)'}</span>
      </span>
      <span className="sr-only">{`${erro ? 'Erro' : 'Alerta'}: ${problema.mensagem}`}</span>
    </td>
  )
}

interface PassoValidacaoProps {
  resultado: ResultadoValidacao
  aoVoltar: () => void
  aoAvancar: () => void
}

/** Passo 3: pré-visualização com erros destacados na célula e explicados (CONCEITO.md, seção 8.1). */
export function PassoValidacao({ resultado, aoVoltar, aoAvancar }: PassoValidacaoProps) {
  const [soProblemas, setSoProblemas] = useState(resultado.resumo.comErro + resultado.resumo.comAlerta > 0)
  const { resumo } = resultado
  const filtradas = soProblemas ? resultado.linhas.filter((l) => l.problemas.length > 0) : resultado.linhas
  const visiveis = filtradas.slice(0, LINHAS_PREVIA_IMPORTACAO)
  const problemas = resultado.linhas.flatMap((l) => l.problemas.map((p) => ({ ...p, numero: l.numero })))

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Resultado da validação" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <IndicadorResumo rotulo="Linhas válidas" valor={String(resumo.validas)} icone={CircleCheck} classeIcone="text-no-prazo" />
        <IndicadorResumo rotulo="Válidas com alertas" valor={String(resumo.comAlerta)} icone={TriangleAlert} classeIcone="text-em-risco" />
        <IndicadorResumo rotulo="Com erro (serão ignoradas)" valor={String(resumo.comErro)} icone={CircleAlert} classeIcone="text-estourado" />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 text-sm text-texto">
          <input
            type="checkbox"
            checked={soProblemas}
            onChange={(e) => setSoProblemas(e.target.checked)}
            className="size-4 accent-primaria"
          />
          Mostrar só linhas com problema
        </label>
        <p className="text-xs text-texto-suave">
          Exibindo {visiveis.length} de {filtradas.length} linhas.
          Passe o mouse na célula para ver o motivo.
        </p>
      </div>

      <div tabIndex={0} role="region" aria-label="Pré-visualização da planilha" className="overflow-x-auto rounded-lg ring-1 ring-borda">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">Pré-visualização da planilha com erros e alertas destacados</caption>
          <thead className="bg-fundo text-texto-suave">
            <tr>
              <th scope="col" className="px-2 py-2 font-medium">Linha</th>
              <th scope="col" className="px-2 py-2 font-medium">Situação</th>
              {COLUNAS_PREVIA.map((campo) => (
                <th key={campo} scope="col" className="px-2 py-2 font-medium whitespace-nowrap">
                  {ROTULO.get(campo)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {visiveis.map((linha) => (
              <tr key={linha.numero}>
                <td className="px-2 py-2 text-texto-suave tabular-nums">{linha.numero}</td>
                <td className="px-2 py-2">
                  <span className={cx('rounded px-1.5 py-0.5 font-semibold whitespace-nowrap', CLASSE_SITUACAO[linha.situacao])}>
                    {ROTULO_SITUACAO[linha.situacao]}
                  </span>
                </td>
                {COLUNAS_PREVIA.map((campo) => (
                  <Celula key={campo} linha={linha} campo={campo} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {problemas.length > 0 && (
        <details className="group rounded-lg bg-fundo p-3 text-sm" open={problemas.length <= 12}>
          <summary className="cursor-pointer font-semibold text-primaria">
            {problemas.length} {problemas.length === 1 ? 'problema encontrado' : 'problemas encontrados'}
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {problemas.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                {p.nivel === 'erro' ? (
                  <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-estourado-texto" />
                ) : (
                  <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-em-risco-texto" />
                )}
                <span>
                  <strong>Linha {p.numero}</strong> · {ROTULO.get(p.campo)}: {p.mensagem}
                  <span className="sr-only"> ({p.nivel})</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex gap-2">
        <Botao variante="secundario" icone={ArrowLeft} onClick={aoVoltar}>
          Ajustar colunas
        </Botao>
        <Botao onClick={aoAvancar} disabled={resumo.validas === 0}>
          Continuar
          <ArrowRight aria-hidden className="size-4" />
        </Botao>
      </div>
    </div>
  )
}
