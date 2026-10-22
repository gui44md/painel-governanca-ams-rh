import { CircleCheck, FlaskConical, Gavel, Hourglass, Undo2, type LucideIcon } from 'lucide-react'
import type { EtapaHomologacao } from '@/lib/homologacao'
import type { TipoEntrega } from '@/tipos/homologacao'

export const ROTULOS_TIPO_ENTREGA: Record<TipoEntrega, string> = {
  correcao: 'Correção',
  evolutiva: 'Evolutiva',
}

type Etapa = Exclude<EtapaHomologacao, 'pendente'>

/** Etapa da homologação: sempre ícone + texto, cor só como reforço. */
export const APARENCIA_ETAPA: Record<Etapa, { rotulo: string; icone: LucideIcon; classes: string }> = {
  aguardando: { rotulo: 'Aguardando testes', icone: Hourglass, classes: 'bg-fundo text-texto-suave ring-borda' },
  'em-teste': { rotulo: 'Em teste', icone: FlaskConical, classes: 'bg-primaria-clara text-primaria ring-primaria/20' },
  'pronta-para-decidir': {
    rotulo: 'Pronta para decisão',
    icone: Gavel,
    classes: 'bg-destaque-claro text-primaria ring-destaque',
  },
  liberada: {
    rotulo: 'Liberada para produção',
    icone: CircleCheck,
    classes: 'bg-no-prazo-fundo text-no-prazo-texto ring-no-prazo/30',
  },
  devolvida: {
    rotulo: 'Devolvida ao fornecedor',
    icone: Undo2,
    classes: 'bg-estourado-fundo text-estourado-texto ring-estourado/30',
  },
}
