import { useState } from 'react'
import { CircleCheck, RotateCcw, Undo2 } from 'lucide-react'
import { APARENCIA_ETAPA } from '@/config/homologacao'
import { Botao } from '@/componentes/ui/Botao'
import { CampoAreaTexto } from '@/componentes/ui/Campo'
import { DialogoConfirmacao } from '@/componentes/ui/DialogoConfirmacao'
import { cx } from '@/lib/classes'
import { formatarDataHora } from '@/lib/formatacao'
import { decisoesPossiveis } from '@/lib/homologacao'
import type { DecisaoHomologacao, Homologacao } from '@/tipos/homologacao'

type Decisao = Exclude<DecisaoHomologacao, 'pendente'>

interface PainelDecisaoProps {
  homologacao: Homologacao
  nomeFornecedor: string
  aoDecidir: (decisao: Decisao, observacao: string) => void
  aoReabrir: () => void
}

/** Decisão final: liberar para produção ou devolver ao fornecedor (CONCEITO.md, seção 6.5). */
export function PainelDecisao({ homologacao, nomeFornecedor, aoDecidir, aoReabrir }: PainelDecisaoProps) {
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState('')
  const [confirmando, setConfirmando] = useState<Decisao | null>(null)
  const possiveis = decisoesPossiveis(homologacao)

  if (homologacao.decisao !== 'pendente') {
    const { rotulo, icone: Icone, classes } = APARENCIA_ETAPA[homologacao.decisao]
    return (
      <div className={cx('flex flex-col gap-3 rounded-lg p-4 ring-1 ring-inset', classes)}>
        <p className="flex items-center gap-2 font-semibold">
          <Icone aria-hidden className="size-5" />
          {rotulo}
          {homologacao.decididaEm && (
            <span className="text-xs font-normal text-texto-suave">em {formatarDataHora(homologacao.decididaEm)}</span>
          )}
        </p>
        {homologacao.observacao && <p className="text-sm text-texto">{homologacao.observacao}</p>}
        <Botao variante="secundario" tamanho="sm" icone={RotateCcw} className="self-start" onClick={aoReabrir}>
          Reabrir homologação
        </Botao>
      </div>
    )
  }

  const pedirConfirmacao = (decisao: Decisao) => {
    if (decisao === 'devolvida' && !observacao.trim()) {
      setErro('Explique ao fornecedor o motivo da devolução.')
      return
    }
    setErro('')
    setConfirmando(decisao)
  }

  return (
    <div className="flex flex-col gap-3">
      <CampoAreaTexto
        rotulo="Observação para o registro"
        dica="Obrigatória ao devolver: o fornecedor precisa saber o que corrigir."
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        erro={erro}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-col gap-1">
          <Botao icone={CircleCheck} disabled={!possiveis.liberar.permitido} onClick={() => pedirConfirmacao('liberada')}>
            Liberar para produção
          </Botao>
          {possiveis.liberar.motivo && <p className="text-xs text-texto-suave">{possiveis.liberar.motivo}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <Botao
            variante="perigo"
            icone={Undo2}
            disabled={!possiveis.devolver.permitido}
            onClick={() => pedirConfirmacao('devolvida')}
          >
            Devolver ao fornecedor
          </Botao>
          {possiveis.devolver.motivo && <p className="text-xs text-texto-suave">{possiveis.devolver.motivo}</p>}
        </div>
      </div>

      <DialogoConfirmacao
        aberto={confirmando !== null}
        destrutivo={confirmando === 'devolvida'}
        titulo={confirmando === 'liberada' ? 'Liberar para produção?' : `Devolver para a ${nomeFornecedor}?`}
        descricao={
          confirmando === 'liberada'
            ? 'Todos os casos foram aprovados. A entrega segue para a janela de implantação.'
            : 'A entrega volta para correção com a sua observação. Os resultados dos testes ficam registrados.'
        }
        rotuloConfirmar={confirmando === 'liberada' ? 'Liberar' : 'Devolver'}
        aoCancelar={() => setConfirmando(null)}
        aoConfirmar={() => {
          if (confirmando) aoDecidir(confirmando, observacao)
          setConfirmando(null)
          setObservacao('')
        }}
      />
    </div>
  )
}
