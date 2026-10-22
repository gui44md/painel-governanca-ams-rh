import { useState, type FormEvent } from 'react'
import { CircleCheck, CircleX, Plus } from 'lucide-react'
import { Botao } from '@/componentes/ui/Botao'
import { CampoTexto } from '@/componentes/ui/Campo'
import { cx } from '@/lib/classes'
import type { CasoTeste, ResultadoCaso } from '@/tipos/homologacao'

interface RoteiroTestesProps {
  casos: readonly CasoTeste[]
  /** Depois da decisão, o roteiro fica só para leitura. */
  bloqueado: boolean
  aoRegistrar: (casoId: string, alteracao: Partial<Pick<CasoTeste, 'resultado' | 'obtido'>>) => void
  aoAdicionar: (passo: string, esperado: string) => void
}

const BOTOES: { resultado: Exclude<ResultadoCaso, 'pendente'>; rotulo: string; icone: typeof CircleCheck; ativo: string }[] = [
  { resultado: 'aprovado', rotulo: 'Aprovado', icone: CircleCheck, ativo: 'bg-no-prazo-fundo text-no-prazo-texto ring-no-prazo' },
  { resultado: 'reprovado', rotulo: 'Reprovado', icone: CircleX, ativo: 'bg-estourado-fundo text-estourado-texto ring-estourado' },
]

/** Roteiro de casos de teste: passo, resultado esperado, resultado obtido e aprovação (CONCEITO.md, seção 6.5). */
export function RoteiroTestes({ casos, bloqueado, aoRegistrar, aoAdicionar }: RoteiroTestesProps) {
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {casos.map((caso, indice) => (
          <li key={caso.id} className="rounded-lg p-3 ring-1 ring-borda">
            <div className="grid gap-3 md:grid-cols-[2rem_1fr_1fr]">
              <span className="flex size-7 items-center justify-center rounded-full bg-primaria-clara text-xs font-bold text-primaria">
                {indice + 1}
              </span>
              <div>
                <p className="text-xs font-medium text-texto-suave">Passo</p>
                <p className="text-sm text-texto">{caso.passo}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-texto-suave">Resultado esperado</p>
                <p className="text-sm text-texto">{caso.esperado}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 md:ml-11 md:flex-row md:items-end">
              <CampoTexto
                key={`${caso.id}-${caso.obtido}`}
                rotulo="Resultado obtido"
                defaultValue={caso.obtido}
                disabled={bloqueado}
                placeholder="O que aconteceu no teste"
                onBlur={(e) => e.target.value !== caso.obtido && aoRegistrar(caso.id, { obtido: e.target.value })}
                className="flex-1"
              />
              <div role="group" aria-label={`Resultado do caso ${indice + 1}`} className="flex gap-2">
                {BOTOES.map(({ resultado, rotulo, icone: Icone, ativo }) => {
                  const selecionado = caso.resultado === resultado
                  return (
                    <button
                      key={resultado}
                      type="button"
                      disabled={bloqueado}
                      aria-pressed={selecionado}
                      onClick={() => aoRegistrar(caso.id, { resultado: selecionado ? 'pendente' : resultado })}
                      className={cx(
                        'inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium ring-1 transition-colors ring-inset',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                        selecionado ? ativo : 'bg-superficie text-texto-suave ring-borda hover:bg-fundo',
                      )}
                    >
                      <Icone aria-hidden className="size-4" />
                      {rotulo}
                    </button>
                  )
                })}
              </div>
            </div>
          </li>
        ))}
      </ol>
      {!bloqueado && <NovoCaso aoAdicionar={aoAdicionar} />}
    </div>
  )
}

function NovoCaso({ aoAdicionar }: { aoAdicionar: (passo: string, esperado: string) => void }) {
  const [aberto, setAberto] = useState(false)
  const [passo, setPasso] = useState('')
  const [esperado, setEsperado] = useState('')
  const [erro, setErro] = useState('')

  if (!aberto) {
    return (
      <Botao variante="fantasma" tamanho="sm" icone={Plus} className="self-start" onClick={() => setAberto(true)}>
        Adicionar caso de teste
      </Botao>
    )
  }

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!passo.trim() || !esperado.trim()) {
      setErro('Preencha o passo e o resultado esperado.')
      return
    }
    aoAdicionar(passo, esperado)
    setPasso('')
    setEsperado('')
    setErro('')
    setAberto(false)
  }

  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-3 rounded-lg bg-fundo p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <CampoTexto rotulo="Passo" value={passo} onChange={(e) => setPasso(e.target.value)} erro={erro && !passo.trim() ? erro : undefined} />
        <CampoTexto
          rotulo="Resultado esperado"
          value={esperado}
          onChange={(e) => setEsperado(e.target.value)}
          erro={erro && !esperado.trim() ? erro : undefined}
        />
      </div>
      <div className="flex gap-2">
        <Botao type="submit" tamanho="sm" icone={Plus}>
          Adicionar
        </Botao>
        <Botao variante="secundario" tamanho="sm" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}
