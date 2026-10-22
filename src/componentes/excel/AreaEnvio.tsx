import { useId, useRef, useState, type DragEvent } from 'react'
import { CircleAlert, Download, FileSpreadsheet, LoaderCircle, Upload } from 'lucide-react'
import { TAMANHO_MAXIMO_ARQUIVO_MB } from '@/config/excel'
import { Botao } from '@/componentes/ui/Botao'
import { cx } from '@/lib/classes'

const EXEMPLOS = [
  { arquivo: 'chamados-fornecedor-outubro.xlsx', rotulo: 'Planilha de exemplo (sem erros)' },
  { arquivo: 'chamados-fornecedor-outubro-com-erros.xlsx', rotulo: 'Planilha de exemplo com erros propositais' },
]

interface AreaEnvioProps {
  lendo: boolean
  erro: string | null
  aoEscolher: (arquivo: File) => void
  aoBaixarModelo: () => void
  gerandoModelo: boolean
}

/** Passo 1: arrastar e soltar (ou escolher) um .xlsx/.csv. */
export function AreaEnvio({ lendo, erro, aoEscolher, aoBaixarModelo, gerandoModelo }: AreaEnvioProps) {
  const idEntrada = useId()
  const entradaRef = useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = useState(false)

  const soltar = (evento: DragEvent) => {
    evento.preventDefault()
    setArrastando(false)
    const arquivo = evento.dataTransfer.files[0]
    if (arquivo) aoEscolher(arquivo)
  }

  return (
    <div className="flex flex-col gap-4">
      <label
        htmlFor={idEntrada}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={soltar}
        className={cx(
          'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          arrastando ? 'border-primaria bg-primaria-clara' : 'border-borda bg-fundo hover:border-primaria/50',
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-superficie text-primaria shadow-sm">
          {lendo ? <LoaderCircle aria-hidden className="size-6 animate-spin" /> : <Upload aria-hidden className="size-6" />}
        </span>
        <span className="font-semibold text-primaria">
          {lendo ? 'Lendo a planilha…' : 'Arraste a planilha aqui ou clique para escolher'}
        </span>
        <span className="text-sm text-texto-suave">.xlsx ou .csv, até {TAMANHO_MAXIMO_ARQUIVO_MB} MB</span>
        <input
          ref={entradaRef}
          id={idEntrada}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          disabled={lendo}
          onChange={(e) => {
            const arquivo = e.target.files?.[0]
            if (arquivo) aoEscolher(arquivo)
            e.target.value = ''
          }}
        />
      </label>

      {erro && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-estourado-fundo p-3 text-sm font-medium text-estourado-texto">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {erro}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Botao variante="secundario" icone={Download} onClick={aoBaixarModelo} disabled={gerandoModelo}>
          Baixar planilha modelo
        </Botao>
        <ul className="flex flex-col gap-1 text-sm">
          {EXEMPLOS.map(({ arquivo, rotulo }) => (
            <li key={arquivo}>
              <a
                href={`${import.meta.env.BASE_URL}exemplos/${arquivo}`}
                download
                className="inline-flex items-center gap-1.5 text-primaria hover:underline"
              >
                <FileSpreadsheet aria-hidden className="size-4" />
                {rotulo}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
