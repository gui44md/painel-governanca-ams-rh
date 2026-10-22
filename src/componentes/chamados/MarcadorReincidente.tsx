import { Repeat } from 'lucide-react'
import { JANELA_REINCIDENCIA_DIAS } from '@/config/sla'

/** Ícone + texto acessível para chamados reincidentes. */
export function MarcadorReincidente() {
  return (
    <span
      title={`Reincidente: reaberto ou repetido em até ${JANELA_REINCIDENCIA_DIAS} dias`}
      className="inline-flex text-primaria"
    >
      <Repeat aria-hidden className="size-3.5" />
      <span className="sr-only">Reincidente</span>
    </span>
  )
}
