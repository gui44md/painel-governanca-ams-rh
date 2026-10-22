import { ROTULOS_ESTADO } from '@/config/chamados'
import { cx } from '@/lib/classes'
import { formatarDataHora } from '@/lib/formatacao'
import type { EstadoChamado, EventoHistorico } from '@/tipos/chamado'

const COR_ESTACAO: Record<EstadoChamado, string> = {
  aberto: 'bg-primaria',
  'em-atendimento': 'bg-primaria-media',
  'aguardando-usuario': 'bg-em-risco',
  resolvido: 'bg-concluido',
}

/** Histórico de status desenhado como estações ao longo de um trilho. */
export function LinhaDoTempo({ eventos }: { eventos: readonly EventoHistorico[] }) {
  return (
    <ol className="relative flex flex-col gap-4 pl-8">
      <span aria-hidden className="trilho-vertical absolute top-2 bottom-2 left-[7px]" />
      {eventos.map((evento, indice) => (
        <li key={`${evento.estado}-${evento.em.getTime()}-${indice}`} className="relative">
          <span
            aria-hidden
            className={cx(
              'absolute top-1 -left-[29px] size-3.5 rounded-full ring-[3px] ring-superficie',
              COR_ESTACAO[evento.estado],
            )}
          />
          <p className="text-sm font-semibold text-texto">{ROTULOS_ESTADO[evento.estado]}</p>
          <p className="text-xs text-texto-suave tabular-nums">{formatarDataHora(evento.em)}</p>
          {evento.nota && <p className="mt-1 text-sm text-texto">{evento.nota}</p>}
        </li>
      ))}
    </ol>
  )
}
