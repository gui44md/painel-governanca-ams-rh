import { Link } from 'react-router-dom'
import { ArrowLeft, CircleCheck, FilePlus2, LayoutDashboard, RefreshCw, Upload } from 'lucide-react'
import { Botao } from '@/componentes/ui/Botao'
import { fraseResumo, type ResumoValidacao } from '@/lib/excel/validacao'

interface PassoConfirmacaoProps {
  resumo: ResumoValidacao
  nomeArquivo: string
  concluido: boolean
  aoVoltar: () => void
  aoConfirmar: () => void
  aoReiniciar: () => void
}

/** Passo 4: resumo e confirmação; depois, o estado de importação concluída. */
export function PassoConfirmacao({ resumo, nomeArquivo, concluido, aoVoltar, aoConfirmar, aoReiniciar }: PassoConfirmacaoProps) {
  if (concluido) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-no-prazo-fundo text-no-prazo-texto">
          <CircleCheck aria-hidden className="size-6" />
        </span>
        <p className="text-lg font-bold text-primaria">Importação concluída</p>
        <p className="max-w-md text-sm text-texto">
          {fraseResumo(resumo)}. Indicadores, gráficos e insights de todas as telas já consideram os novos dados.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primaria px-4 text-sm font-medium text-white hover:bg-primaria-escura"
          >
            <LayoutDashboard aria-hidden className="size-4" />
            Ver visão geral
          </Link>
          <Botao variante="secundario" icone={Upload} onClick={aoReiniciar}>
            Importar outra planilha
          </Botao>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 rounded-lg bg-primaria-clara p-4">
        <FilePlus2 aria-hidden className="mt-0.5 size-5 shrink-0 text-primaria" />
        <div>
          <p className="font-semibold text-primaria">{fraseResumo(resumo)}.</p>
          <p className="mt-1 text-sm text-texto">
            De <strong>{nomeArquivo}</strong>. Chamados com ID já existente substituem os dados atuais. A importação fica salva
            neste navegador e pode ser desfeita.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Botao variante="secundario" icone={ArrowLeft} onClick={aoVoltar}>
          Voltar
        </Botao>
        <Botao icone={RefreshCw} onClick={aoConfirmar} disabled={resumo.validas === 0}>
          Confirmar importação
        </Botao>
      </div>
    </div>
  )
}
