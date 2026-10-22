import { useEffect, useState } from 'react'
import { Repeat, RotateCcw } from 'lucide-react'
import { PRIORIDADES, ROTULOS_ESTADO, ROTULOS_TIPO } from '@/config/chamados'
import { TABELA_SLA } from '@/config/sla'
import { Botao } from '@/componentes/ui/Botao'
import { CampoBusca } from '@/componentes/ui/CampoBusca'
import { CampoSelecao, type OpcaoSelecao } from '@/componentes/ui/CampoSelecao'
import { cx } from '@/lib/classes'
import {
  contarCriteriosAtivos,
  CRITERIOS_PADRAO,
  type CriteriosChamados,
  type FiltroEstado,
  type OrdemChamados,
} from '@/lib/lista-chamados'
import type { EstadoChamado, Prioridade, TipoChamado } from '@/tipos/chamado'

const TODOS = 'todos'

const OPCOES_TIPO: OpcaoSelecao<TipoChamado | typeof TODOS>[] = [
  { valor: TODOS, rotulo: 'Todos os tipos' },
  ...(Object.entries(ROTULOS_TIPO) as [TipoChamado, string][]).map(([valor, rotulo]) => ({ valor, rotulo })),
]

const OPCOES_PRIORIDADE: OpcaoSelecao<Prioridade | typeof TODOS>[] = [
  { valor: TODOS, rotulo: 'Todas' },
  ...PRIORIDADES.map((p) => ({ valor: p, rotulo: `${p} · ${TABELA_SLA[p].rotulo}` })),
]

const OPCOES_ESTADO: OpcaoSelecao<FiltroEstado | typeof TODOS>[] = [
  { valor: TODOS, rotulo: 'Todos' },
  { valor: 'abertos', rotulo: 'Em aberto (não resolvidos)' },
  ...(Object.entries(ROTULOS_ESTADO) as [EstadoChamado, string][]).map(([valor, rotulo]) => ({ valor, rotulo })),
]

const OPCOES_ORDEM: OpcaoSelecao<OrdemChamados>[] = [
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'consumo-sla', rotulo: 'Mais perto de estourar' },
]

const ATRASO_BUSCA_MS = 250

interface FiltrosChamadosProps {
  criterios: CriteriosChamados
  aoMudar: (parcial: Partial<CriteriosChamados>) => void
}

/** Filtros locais da tela de Chamados (sistema, fornecedor e período ficam na barra global). */
export function FiltrosChamados({ criterios, aoMudar }: FiltrosChamadosProps) {
  // A busca é digitada localmente e só vai para a URL após uma pausa.
  const [busca, setBusca] = useState(criterios.busca)
  useEffect(() => {
    if (busca === criterios.busca) return
    const espera = setTimeout(() => aoMudar({ busca }), ATRASO_BUSCA_MS)
    return () => clearTimeout(espera)
  }, [busca, criterios.busca, aoMudar])

  const ativos = contarCriteriosAtivos(criterios)
  const nulo = <T,>(valor: T | typeof TODOS) => (valor === TODOS ? null : valor)

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-[minmax(14rem,1.6fr)_repeat(4,minmax(0,1fr))_auto] xl:items-end">
      <CampoBusca
        rotulo="Buscar"
        valor={busca}
        aoMudar={setBusca}
        placeholder="ID, título ou causa"
        className="col-span-2 md:col-span-3 xl:col-span-1"
      />
      <CampoSelecao rotulo="Tipo" valor={criterios.tipo ?? TODOS} opcoes={OPCOES_TIPO} aoMudar={(v) => aoMudar({ tipo: nulo(v) })} />
      <CampoSelecao
        rotulo="Prioridade"
        valor={criterios.prioridade ?? TODOS}
        opcoes={OPCOES_PRIORIDADE}
        aoMudar={(v) => aoMudar({ prioridade: nulo(v) })}
      />
      <CampoSelecao
        rotulo="Status"
        valor={criterios.estado ?? TODOS}
        opcoes={OPCOES_ESTADO}
        aoMudar={(v) => aoMudar({ estado: nulo(v) })}
      />
      <CampoSelecao rotulo="Ordenar por" valor={criterios.ordem} opcoes={OPCOES_ORDEM} aoMudar={(ordem) => aoMudar({ ordem })} />
      <div className="col-span-2 flex items-end gap-2 md:col-span-1">
        <button
          type="button"
          aria-pressed={criterios.somenteReincidentes}
          onClick={() => aoMudar({ somenteReincidentes: !criterios.somenteReincidentes })}
          className={cx(
            'inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap ring-1 transition-colors ring-inset',
            criterios.somenteReincidentes
              ? 'bg-primaria text-white ring-primaria'
              : 'bg-superficie text-texto ring-borda hover:bg-primaria-clara',
          )}
        >
          <Repeat aria-hidden className="size-4" />
          Só reincidentes
        </button>
        {ativos > 0 && (
          <Botao
            variante="fantasma"
            icone={RotateCcw}
            aria-label={`Limpar ${ativos} filtros da lista`}
            onClick={() => {
              setBusca('')
              aoMudar({ ...CRITERIOS_PADRAO, ordem: criterios.ordem })
            }}
          >
            <span className="xl:sr-only">Limpar</span>
          </Botao>
        )}
      </div>
    </div>
  )
}
