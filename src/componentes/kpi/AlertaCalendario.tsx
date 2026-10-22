import { ArrowRight, CalendarClock } from 'lucide-react'
import { Botao } from '@/componentes/ui/Botao'
import { useAbrirDestino } from '@/hooks/useAbrirDestino'
import type { AlertaFechamento, DestinoInsight } from '@/lib/insights'

const DESTINO_FOLHA_ABERTOS: DestinoInsight = {
  caminho: '/chamados',
  filtros: { sistemaId: 'folha', fornecedorId: null },
  parametros: { estado: 'abertos', ordem: 'consumo-sla' },
}

/** Alerta do calendário de RH: fechamento da folha próximo com chamados abertos. */
export function AlertaCalendario({ alerta }: { alerta: AlertaFechamento }) {
  const abrirDestino = useAbrirDestino()
  return (
    <div
      role="status"
      className="animate-entrada flex flex-col gap-3 rounded-xl bg-em-risco-fundo p-4 ring-1 ring-em-risco/30 sm:flex-row sm:items-center"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-superficie text-em-risco-texto">
        <CalendarClock aria-hidden className="size-5" />
      </span>
      <p className="flex-1 text-sm font-medium text-texto">
        <span className="font-semibold text-em-risco-texto">Calendário de RH · </span>
        {alerta.texto}
      </p>
      <Botao
        variante="secundario"
        tamanho="sm"
        className="self-start sm:self-center"
        onClick={() => abrirDestino(DESTINO_FOLHA_ABERTOS)}
      >
        Ver chamados de Folha
        <ArrowRight aria-hidden className="size-3.5" />
      </Botao>
    </div>
  )
}
