import { Archive, CircleCheck, Clock, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { StatusSla } from '@/tipos/sla'

export interface AparenciaStatus {
  rotulo: string
  /** Explicação curta, exibida como dica. */
  descricao: string
  icone: LucideIcon
  /** Classes completas (literais) para o Tailwind detectar. */
  classesEtiqueta: string
  classeCorBase: string
  classeTexto: string
}

/** Status sempre com cor + ícone + texto (CONCEITO.md, seções 4 e 5). */
export const APARENCIA_STATUS: Record<StatusSla, AparenciaStatus> = {
  'no-prazo': {
    rotulo: 'No prazo',
    descricao: 'Menos de 80% do prazo de SLA consumido',
    icone: CircleCheck,
    classesEtiqueta: 'bg-no-prazo-fundo text-no-prazo-texto ring-no-prazo/30',
    classeCorBase: 'bg-no-prazo',
    classeTexto: 'text-no-prazo-texto',
  },
  'em-risco': {
    rotulo: 'Em risco',
    descricao: 'Entre 80% e 100% do prazo de SLA consumido',
    icone: Clock,
    classesEtiqueta: 'bg-em-risco-fundo text-em-risco-texto ring-em-risco/30',
    classeCorBase: 'bg-em-risco',
    classeTexto: 'text-em-risco-texto',
  },
  estourado: {
    rotulo: 'SLA estourado',
    descricao: 'Prazo de SLA ultrapassado',
    icone: TriangleAlert,
    classesEtiqueta: 'bg-estourado-fundo text-estourado-texto ring-estourado/30',
    classeCorBase: 'bg-estourado',
    classeTexto: 'text-estourado-texto',
  },
  concluido: {
    rotulo: 'Concluído',
    descricao: 'Chamado encerrado',
    icone: Archive,
    classesEtiqueta: 'bg-concluido-fundo text-concluido-texto ring-concluido/30',
    classeCorBase: 'bg-concluido',
    classeTexto: 'text-concluido-texto',
  },
}
