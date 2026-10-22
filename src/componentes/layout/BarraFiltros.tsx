import { useMemo } from 'react'
import { CalendarDays, RotateCcw } from 'lucide-react'
import { DATA_REFERENCIA } from '@/config/referencia'
import { Botao } from '@/componentes/ui/Botao'
import { CampoSelecao, type OpcaoSelecao } from '@/componentes/ui/CampoSelecao'
import { Dica } from '@/componentes/ui/Dica'
import { useCatalogoFiltros } from '@/hooks/useCatalogoFiltros'
import { contarFiltrosAtivos, sistemasDisponiveis } from '@/lib/filtros'
import { formatarData } from '@/lib/formatacao'
import { FILTROS_INICIAIS, useFiltros } from '@/store/filtros'
import type { FornecedorId, SistemaId } from '@/tipos/catalogo'
import type { PeriodoId } from '@/tipos/filtros'

const TODOS = 'todos'
type ValorSistema = SistemaId | typeof TODOS
type ValorFornecedor = FornecedorId | typeof TODOS

/** Filtros globais do topo: mudar qualquer um atualiza todas as telas. */
export function BarraFiltros() {
  const catalogo = useCatalogoFiltros()
  const { periodo, sistemaId, fornecedorId, definirPeriodo, definirSistema, definirFornecedor, limparFiltros } =
    useFiltros()

  const opcoesPeriodo = useMemo<OpcaoSelecao<PeriodoId>[]>(
    () => catalogo.periodos.map(({ id, rotulo }) => ({ valor: id, rotulo })),
    [catalogo.periodos],
  )

  const opcoesSistema = useMemo<OpcaoSelecao<ValorSistema>[]>(
    () => [
      { valor: TODOS, rotulo: 'Todos os sistemas' },
      ...sistemasDisponiveis(catalogo.sistemas, fornecedorId).map((s) => ({ valor: s.id, rotulo: s.nome })),
    ],
    [catalogo.sistemas, fornecedorId],
  )

  const opcoesFornecedor = useMemo<OpcaoSelecao<ValorFornecedor>[]>(
    () => [
      { valor: TODOS, rotulo: 'Todos os fornecedores' },
      ...catalogo.fornecedores.map((f) => ({ valor: f.id, rotulo: f.nome })),
    ],
    [catalogo.fornecedores],
  )

  const filtrosAtivos = contarFiltrosAtivos({ periodo, sistemaId, fornecedorId }, FILTROS_INICIAIS)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:items-end">
      <CampoSelecao
        rotulo="Período"
        valor={periodo}
        opcoes={opcoesPeriodo}
        aoMudar={definirPeriodo}
        className="lg:w-64"
      />
      <CampoSelecao
        rotulo="Fornecedor"
        valor={fornecedorId ?? TODOS}
        opcoes={opcoesFornecedor}
        aoMudar={(valor) => definirFornecedor(valor === TODOS ? null : valor)}
        className="lg:w-56"
      />
      <CampoSelecao
        rotulo="Sistema de RH"
        valor={sistemaId ?? TODOS}
        opcoes={opcoesSistema}
        aoMudar={(valor) => definirSistema(valor === TODOS ? null : valor)}
        className="lg:w-56"
      />

      <div className="flex items-center justify-between gap-3 sm:col-span-3 lg:ml-auto lg:h-10">
        <Dica texto="Fim do período simulado" posicao="abaixo" alinhamento="fim">
          <span tabIndex={0} className="inline-flex items-center gap-1.5 rounded-md text-xs text-texto-suave">
            <CalendarDays aria-hidden className="size-4" />
            Dados até {formatarData(DATA_REFERENCIA)}
          </span>
        </Dica>
        {filtrosAtivos > 0 && (
          <Botao variante="fantasma" tamanho="sm" icone={RotateCcw} onClick={limparFiltros}>
            Limpar filtros ({filtrosAtivos})
          </Botao>
        )}
      </div>
    </div>
  )
}
