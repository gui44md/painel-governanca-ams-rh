import { useState } from 'react'
import { Check } from 'lucide-react'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { INDICADORES_WIDGET, ROTULOS_AGRUPAMENTO, TIPOS_WIDGET } from '@/config/dashboards'
import { Botao } from '@/componentes/ui/Botao'
import { CampoAreaTexto, CampoTexto } from '@/componentes/ui/Campo'
import { CampoSelecao, type OpcaoSelecao } from '@/componentes/ui/CampoSelecao'
import { useCatalogoFiltros } from '@/hooks/useCatalogoFiltros'
import { metaDoCampo, metaParaCampo, unidadeDaMeta } from '@/lib/dashboard/meta'
import { sistemasDisponiveis } from '@/lib/filtros'
import type { FornecedorId, SistemaId } from '@/tipos/catalogo'
import type { AgrupamentoWidget, IndicadorWidget, TipoWidget, Widget } from '@/tipos/dashboard'
import type { PeriodoId } from '@/tipos/filtros'
import { QuadroWidget } from './QuadroWidget'

const HERDAR = 'herdar'

const OPCOES_TIPO: OpcaoSelecao<TipoWidget>[] = (Object.keys(TIPOS_WIDGET) as TipoWidget[]).map((tipo) => ({
  valor: tipo,
  rotulo: TIPOS_WIDGET[tipo].rotulo,
}))

const OPCOES_AGRUPAMENTO: OpcaoSelecao<AgrupamentoWidget>[] = (Object.keys(ROTULOS_AGRUPAMENTO) as AgrupamentoWidget[]).map(
  (valor) => ({ valor, rotulo: ROTULOS_AGRUPAMENTO[valor] }),
)

const OPCOES_FORNECEDOR: OpcaoSelecao<FornecedorId | typeof HERDAR>[] = [
  { valor: HERDAR, rotulo: 'Seguir o filtro do topo' },
  ...FORNECEDORES.map((f) => ({ valor: f.id, rotulo: f.nome })),
]

interface ConfiguracaoWidgetProps {
  widget: Widget
  aoAlterar: (alteracao: Partial<Widget>) => void
  aoConcluir: () => void
}

/**
 * Configuração do widget (CONCEITO.md, seção 7): indicador, agrupamento,
 * filtro opcional e meta. Cada mudança vai direto para o dashboard, então a
 * grade e a pré-visualização atualizam na hora.
 */
export function ConfiguracaoWidget({ widget, aoAlterar, aoConcluir }: ConfiguracaoWidgetProps) {
  const definicao = TIPOS_WIDGET[widget.tipo]
  const catalogo = useCatalogoFiltros()
  const [metaTexto, setMetaTexto] = useState(metaParaCampo(widget.indicador, widget.meta))
  const [metaDoIndicador, setMetaDoIndicador] = useState(widget.indicador)

  // Se o indicador mudou (e a meta padrão junto), atualiza o campo.
  if (metaDoIndicador !== widget.indicador) {
    setMetaDoIndicador(widget.indicador)
    setMetaTexto(metaParaCampo(widget.indicador, widget.meta))
  }

  const alterarFiltro = (parcial: Partial<Widget['filtro']>) => aoAlterar({ filtro: { ...widget.filtro, ...parcial } })

  const opcoesIndicador: OpcaoSelecao<IndicadorWidget>[] = definicao.indicadores.map((valor) => ({
    valor,
    rotulo: INDICADORES_WIDGET[valor].rotulo,
  }))
  const opcoesPeriodo: OpcaoSelecao<PeriodoId | typeof HERDAR>[] = [
    { valor: HERDAR, rotulo: 'Seguir o filtro do topo' },
    ...catalogo.periodos.map((p) => ({ valor: p.id, rotulo: p.rotulo })),
  ]
  const opcoesSistema: OpcaoSelecao<SistemaId | typeof HERDAR>[] = [
    { valor: HERDAR, rotulo: 'Seguir o filtro do topo' },
    ...sistemasDisponiveis(SISTEMAS_RH, widget.filtro.fornecedorId).map((s) => ({ valor: s.id, rotulo: s.nome })),
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="h-56">
        <QuadroWidget widget={widget} editavel={false} previa />
      </div>
      <p className="text-xs text-texto-suave">Pré-visualização com os dados fictícios. A grade também atualiza na hora.</p>

      <CampoTexto rotulo="Título" value={widget.titulo} onChange={(e) => aoAlterar({ titulo: e.target.value })} />
      <CampoSelecao rotulo="Tipo de widget" valor={widget.tipo} opcoes={OPCOES_TIPO} aoMudar={(tipo) => aoAlterar({ tipo })} />

      {definicao.usaIndicador && (
        <CampoSelecao
          rotulo={`Indicador · ${INDICADORES_WIDGET[widget.indicador].dica}`}
          valor={widget.indicador}
          opcoes={opcoesIndicador}
          aoMudar={(indicador) => aoAlterar({ indicador })}
        />
      )}
      {definicao.usaAgrupamento && (
        <CampoSelecao
          rotulo="Agrupar por"
          valor={widget.agrupamento}
          opcoes={OPCOES_AGRUPAMENTO}
          aoMudar={(agrupamento) => aoAlterar({ agrupamento })}
        />
      )}

      {definicao.usaIndicador && (
        <fieldset className="flex flex-col gap-3 rounded-lg p-3 ring-1 ring-borda">
          <legend className="px-1 text-xs font-semibold text-texto-suave">Filtro do widget (opcional)</legend>
          <CampoSelecao
            rotulo="Período"
            valor={widget.filtro.periodo ?? HERDAR}
            opcoes={opcoesPeriodo}
            aoMudar={(v) => alterarFiltro({ periodo: v === HERDAR ? null : v })}
          />
          <CampoSelecao
            rotulo="Fornecedor"
            valor={widget.filtro.fornecedorId ?? HERDAR}
            opcoes={OPCOES_FORNECEDOR}
            aoMudar={(v) => {
              const fornecedorId = v === HERDAR ? null : v
              const sistemaCompativel = SISTEMAS_RH.find((s) => s.id === widget.filtro.sistemaId)?.fornecedorId === fornecedorId
              alterarFiltro({ fornecedorId, sistemaId: !fornecedorId || sistemaCompativel ? widget.filtro.sistemaId : null })
            }}
          />
          <CampoSelecao
            rotulo="Sistema de RH"
            valor={widget.filtro.sistemaId ?? HERDAR}
            opcoes={opcoesSistema}
            aoMudar={(v) => alterarFiltro({ sistemaId: v === HERDAR ? null : v })}
          />
        </fieldset>
      )}

      {definicao.usaMeta && (
        <CampoTexto
          rotulo={`Meta${unidadeDaMeta(widget.indicador) ? ` (${unidadeDaMeta(widget.indicador)})` : ''}`}
          inputMode="decimal"
          value={metaTexto}
          placeholder="Sem meta"
          dica="Desenha a linha de referência e colore o valor. Deixe vazio para não usar."
          onChange={(e) => {
            setMetaTexto(e.target.value)
            const meta = metaDoCampo(widget.indicador, e.target.value)
            if (meta !== null || !e.target.value.trim()) aoAlterar({ meta })
          }}
        />
      )}

      {widget.tipo === 'texto' && (
        <CampoAreaTexto rotulo="Texto" rows={7} value={widget.texto} onChange={(e) => aoAlterar({ texto: e.target.value })} />
      )}

      <Botao icone={Check} onClick={aoConcluir} className="self-start">
        Concluir
      </Botao>
    </div>
  )
}
