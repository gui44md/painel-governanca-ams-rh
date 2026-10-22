import { CalendarDays, CheckSquare, Users } from 'lucide-react'
import { FORNECEDORES } from '@/config/catalogo'
import { CLASSE_FUNDO_FORNECEDOR } from '@/config/graficos'
import { cx } from '@/lib/classes'
import { formatarDataHora } from '@/lib/formatacao'
import type { Acao, Reuniao } from '@/tipos/plano-acao'

const NOME_FORNECEDOR = new Map(FORNECEDORES.map((f) => [f.id, f.nome]))

interface CartaoReuniaoProps {
  reuniao: Reuniao
  acoes: ReadonlyMap<string, Acao>
  aoAbrirAcao: (id: string) => void
}

/** Ata resumida: data, participantes, decisões e ações geradas. */
export function CartaoReuniao({ reuniao, acoes, aoAbrirAcao }: CartaoReuniaoProps) {
  return (
    <article className="flex flex-col gap-3 rounded-lg p-4 ring-1 ring-borda">
      <header>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-texto-suave">
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden className="size-3.5" />
            {formatarDataHora(reuniao.data)}
          </span>
          {reuniao.fornecedorId && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className={cx('size-2 rounded-full', CLASSE_FUNDO_FORNECEDOR[reuniao.fornecedorId])} />
              {NOME_FORNECEDOR.get(reuniao.fornecedorId)}
            </span>
          )}
          <span className="font-mono">{reuniao.id}</span>
        </p>
        <h3 className="mt-1 font-semibold text-primaria">{reuniao.titulo}</h3>
      </header>

      <div>
        <p className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-texto-suave">
          <Users aria-hidden className="size-3.5" /> Participantes
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {reuniao.participantes.map((pessoa) => (
            <li key={pessoa} className="rounded-full bg-fundo px-2.5 py-0.5 text-xs text-texto ring-1 ring-borda">
              {pessoa}
            </li>
          ))}
        </ul>
      </div>

      {reuniao.decisoes.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-texto-suave">Decisões</p>
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-texto">
            {reuniao.decisoes.map((decisao) => (
              <li key={decisao}>{decisao}</li>
            ))}
          </ul>
        </div>
      )}

      {reuniao.acoesIds.length > 0 && (
        <div>
          <p className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-texto-suave">
            <CheckSquare aria-hidden className="size-3.5" /> Ações geradas
          </p>
          <ul className="flex flex-col gap-1">
            {reuniao.acoesIds.map((id) => {
              const acao = acoes.get(id)
              if (!acao) return null
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => aoAbrirAcao(id)}
                    className="text-left text-sm text-primaria underline-offset-2 hover:underline"
                  >
                    <span className="font-mono text-xs">{id}</span> {acao.titulo}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </article>
  )
}
