import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, FileSpreadsheet, ImageDown, Info, LoaderCircle, Presentation, Trash2 } from 'lucide-react'
import { DATA_REFERENCIA } from '@/config/referencia'
import { cores } from '@/config/tema'
import { Botao } from '@/componentes/ui/Botao'
import { DialogoConfirmacao } from '@/componentes/ui/DialogoConfirmacao'
import { PainelLateral } from '@/componentes/ui/PainelLateral'
import { useContextoWidget } from '@/hooks/useDadosWidget'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { baixarArquivo, baixarDataUrl, nomeDeArquivo, TIPO_XLSX } from '@/lib/arquivos'
import { dadosDoWidget } from '@/lib/dashboard/agregacao'
import { TAMANHO_MAXIMO_NOME, validarNomeDashboard } from '@/lib/dashboard/operacoes'
import { useAvisos } from '@/store/avisos'
import { useDashboards } from '@/store/dashboards'
import type { Dashboard, TipoWidget } from '@/tipos/dashboard'
import { ConfiguracaoWidget } from './ConfiguracaoWidget'
import { GaleriaWidgets } from './GaleriaWidgets'
import { GradeDashboard } from './GradeDashboard'
import { ModoApresentacao } from './ModoApresentacao'

/** Largura a partir da qual a configuração fica numa coluna ao lado da grade. */
const CONSULTA_TELA_LARGA = '(min-width: 1280px)'

type Exportando = 'png' | 'excel' | null

interface EditorDashboardProps {
  dashboard: Dashboard
  aoVoltar: () => void
}

/** Montagem do dashboard: galeria, grade, configuração, apresentação e exportação. */
export function EditorDashboard({ dashboard, aoVoltar }: EditorDashboardProps) {
  const acoes = useDashboards()
  const avisar = useAvisos((s) => s.avisar)
  const contexto = useContextoWidget()
  const telaLarga = useMediaQuery(CONSULTA_TELA_LARGA)
  const gradeRef = useRef<HTMLDivElement>(null)

  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [tipoArrastado, setTipoArrastado] = useState<TipoWidget | null>(null)
  const [apresentando, setApresentando] = useState(false)
  const [exportando, setExportando] = useState<Exportando>(null)
  const [confirmacao, setConfirmacao] = useState<{ tipo: 'widget'; id: string } | { tipo: 'dashboard' } | null>(null)
  const [nome, setNome] = useState(dashboard.nome)
  const [erroNome, setErroNome] = useState<string | null>(null)

  const selecionado = dashboard.widgets.find((w) => w.id === selecionadoId) ?? null
  const fecharConfiguracao = useCallback(() => setSelecionadoId(null), [])
  const sairDaApresentacao = useCallback(() => setApresentando(false), [])

  const salvarNome = () => {
    const problema = validarNomeDashboard(nome)
    setErroNome(problema)
    if (!problema && nome.trim() !== dashboard.nome) acoes.renomear(dashboard.id, nome)
  }

  // Ao soltar ou adicionar, abre a configuração do widget novo (CONCEITO.md, seção 7, passo 3).
  const adicionar = (tipo: TipoWidget, posicao?: { x: number; y: number }) => {
    const id = acoes.adicionarWidget(dashboard.id, tipo, posicao)
    setSelecionadoId(id)
    setTipoArrastado(null)
  }

  const exportarPng = async () => {
    if (!gradeRef.current) return
    setExportando('png')
    try {
      const { toPng } = await import('html-to-image')
      const imagem = await toPng(gradeRef.current, {
        backgroundColor: cores.fundo,
        pixelRatio: 2,
        // Sem alças de redimensionamento nem botões de edição na imagem.
        filter: (no) => !(no instanceof HTMLElement && (no.classList.contains('react-resizable-handle') || no.dataset.semExportar !== undefined)),
      })
      const nomeArquivo = `${nomeDeArquivo(dashboard.nome, DATA_REFERENCIA)}.png`
      baixarDataUrl(imagem, nomeArquivo)
      avisar(`Imagem ${nomeArquivo} gerada.`)
    } catch (erro) {
      console.error(erro)
      avisar('Não foi possível gerar a imagem.', 'erro')
    } finally {
      setExportando(null)
    }
  }

  const exportarExcel = async () => {
    setExportando('excel')
    try {
      const [{ gerarXlsx }, { abasDoDashboard }] = await Promise.all([
        import('@/lib/excel/planilha'),
        import('@/lib/dashboard/exportacao'),
      ])
      const dados = new Map(dashboard.widgets.map((w) => [w.id, dadosDoWidget(w, contexto)]))
      const nomeArquivo = `${nomeDeArquivo(dashboard.nome, DATA_REFERENCIA)}.xlsx`
      baixarArquivo(gerarXlsx(abasDoDashboard(dashboard, dados, DATA_REFERENCIA)), nomeArquivo, TIPO_XLSX)
      avisar(`Arquivo ${nomeArquivo} gerado.`)
    } catch (erro) {
      console.error(erro)
      avisar('Não foi possível gerar o arquivo.', 'erro')
    } finally {
      setExportando(null)
    }
  }

  const confirmar = () => {
    if (confirmacao?.tipo === 'widget') {
      acoes.removerWidget(dashboard.id, confirmacao.id)
      if (selecionadoId === confirmacao.id) setSelecionadoId(null)
    } else if (confirmacao?.tipo === 'dashboard') {
      acoes.excluir(dashboard.id)
      avisar(`Dashboard "${dashboard.nome}" excluído.`)
      aoVoltar()
    }
    setConfirmacao(null)
  }

  const configuracao = selecionado && (
    <ConfiguracaoWidget
      key={selecionado.id}
      widget={selecionado}
      aoAlterar={(alteracao) => acoes.atualizarWidget(dashboard.id, selecionado.id, alteracao)}
      aoConcluir={fecharConfiguracao}
    />
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl bg-superficie p-4 shadow-sm ring-1 ring-borda xl:flex-row xl:items-center">
        <Botao variante="fantasma" tamanho="sm" icone={ArrowLeft} onClick={aoVoltar} className="self-start xl:self-center">
          Meus dashboards
        </Botao>
        <div className="min-w-0 flex-1">
          <label htmlFor="nome-dashboard" className="sr-only">
            Nome do dashboard
          </label>
          <input
            id="nome-dashboard"
            value={nome}
            maxLength={TAMANHO_MAXIMO_NOME}
            onChange={(e) => setNome(e.target.value)}
            onBlur={salvarNome}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            aria-invalid={Boolean(erroNome)}
            className="w-full rounded-md bg-transparent px-2 py-1 text-lg font-bold text-primaria hover:bg-fundo focus:bg-fundo"
          />
          {erroNome && <p className="px-2 text-xs font-medium text-estourado-texto">{erroNome}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao tamanho="sm" icone={Presentation} onClick={() => setApresentando(true)} disabled={!dashboard.widgets.length}>
            Apresentar
          </Botao>
          <Botao
            variante="secundario"
            tamanho="sm"
            icone={exportando === 'png' ? LoaderCircle : ImageDown}
            disabled={exportando !== null || !dashboard.widgets.length}
            onClick={exportarPng}
          >
            PNG
          </Botao>
          <Botao
            variante="secundario"
            tamanho="sm"
            icone={exportando === 'excel' ? LoaderCircle : FileSpreadsheet}
            disabled={exportando !== null || !dashboard.widgets.length}
            onClick={exportarExcel}
          >
            Excel
          </Botao>
          <Botao variante="fantasma" tamanho="sm" icone={Trash2} onClick={() => setConfirmacao({ tipo: 'dashboard' })} aria-label="Excluir dashboard" />
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-texto-suave">
        <Info aria-hidden className="mt-px size-3.5 shrink-0" />
        Widgets sem filtro próprio seguem os filtros do topo. Tudo é salvo automaticamente neste navegador.
      </p>

      {/* Enquanto um widget é configurado em tela larga, a galeria dá lugar ao painel e a grade mantém o espaço. */}
      <div className={selecionado && telaLarga ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]' : 'grid gap-4 xl:grid-cols-[15rem_minmax(0,1fr)]'}>
        {!(selecionado && telaLarga) && (
          <aside className="xl:sticky xl:top-48 xl:self-start">
            <GaleriaWidgets aoIniciarArraste={setTipoArrastado} aoAdicionar={(tipo) => adicionar(tipo)} />
          </aside>
        )}

        <div ref={gradeRef} className="min-w-0 rounded-xl bg-fundo">
          <GradeDashboard
            dashboard={dashboard}
            editavel
            selecionadoId={selecionadoId}
            tipoArrastado={tipoArrastado}
            aoConfigurar={setSelecionadoId}
            aoDuplicar={(id) => setSelecionadoId(acoes.duplicarWidget(dashboard.id, id))}
            aoExcluir={(id) => setConfirmacao({ tipo: 'widget', id })}
            aoMudarLayout={(layout) => acoes.atualizarLayout(dashboard.id, layout)}
            aoSoltar={(posicao) => tipoArrastado && adicionar(tipoArrastado, posicao)}
          />
        </div>

        {selecionado && telaLarga && (
          <aside aria-label="Configuração do widget" className="rounded-xl bg-superficie p-4 shadow-sm ring-1 ring-borda xl:sticky xl:top-48 xl:max-h-[calc(100dvh-13rem)] xl:self-start xl:overflow-y-auto">
            <h2 className="mb-3 text-sm font-semibold text-primaria">Configurar widget</h2>
            {configuracao}
          </aside>
        )}
      </div>

      {!telaLarga && (
        <PainelLateral aberto={Boolean(selecionado)} aoFechar={fecharConfiguracao} titulo="Configurar widget">
          {configuracao}
        </PainelLateral>
      )}

      {apresentando && <ModoApresentacao dashboard={dashboard} aoSair={sairDaApresentacao} />}

      <DialogoConfirmacao
        aberto={confirmacao !== null}
        destrutivo
        titulo={confirmacao?.tipo === 'dashboard' ? `Excluir "${dashboard.nome}"?` : 'Excluir este widget?'}
        descricao={
          confirmacao?.tipo === 'dashboard'
            ? 'O dashboard e todos os widgets serão apagados deste navegador.'
            : 'O widget sai do dashboard. Você pode adicioná-lo de novo pela galeria.'
        }
        rotuloConfirmar="Excluir"
        aoCancelar={() => setConfirmacao(null)}
        aoConfirmar={confirmar}
      />
    </div>
  )
}
