import { useState, type ReactNode } from 'react'
import { BarChart3, Database, Download, FileSpreadsheet, LoaderCircle, Filter, Undo2, type LucideIcon } from 'lucide-react'
import { AreaEnvio } from '@/componentes/excel/AreaEnvio'
import { Etapas } from '@/componentes/excel/Etapas'
import { PassoConfirmacao } from '@/componentes/excel/PassoConfirmacao'
import { PassoMapeamento } from '@/componentes/excel/PassoMapeamento'
import { PassoValidacao } from '@/componentes/excel/PassoValidacao'
import { Botao } from '@/componentes/ui/Botao'
import { Card } from '@/componentes/ui/Card'
import { DialogoConfirmacao } from '@/componentes/ui/DialogoConfirmacao'
import { useExportacoes, type IdExportacao } from '@/hooks/useExportacoes'
import { useImportacao, type PassoImportacao } from '@/hooks/useImportacao'
import { useAvisos } from '@/store/avisos'
import { useChamados } from '@/store/chamados'

const ETAPAS = ['Enviar arquivo', 'Mapear colunas', 'Validar dados', 'Confirmar'] as const
const INDICE_ETAPA: Record<PassoImportacao, number> = { envio: 0, mapeamento: 1, validacao: 2, confirmacao: 3, concluido: 4 }

interface CartaoExportacaoProps {
  icone: LucideIcon
  titulo: string
  descricao: ReactNode
  children: ReactNode
}

function CartaoExportacao({ icone: Icone, titulo, descricao, children }: CartaoExportacaoProps) {
  return (
    <article className="flex flex-col gap-3 rounded-lg p-4 ring-1 ring-borda">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primaria-clara text-primaria">
          <Icone aria-hidden className="size-5" />
        </span>
        <div>
          <h3 className="font-semibold text-primaria">{titulo}</h3>
          <p className="mt-0.5 text-sm text-texto-suave">{descricao}</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">{children}</div>
    </article>
  )
}

function BotaoExportar({ id, gerando, rotulo, aoClicar }: { id: IdExportacao; gerando: IdExportacao | null; rotulo: string; aoClicar: () => void }) {
  const ocupado = gerando === id
  return (
    <Botao variante="secundario" tamanho="sm" icone={ocupado ? LoaderCircle : Download} disabled={gerando !== null} onClick={aoClicar}>
      {ocupado ? 'Gerando…' : rotulo}
    </Botao>
  )
}

export default function PaginaExcel() {
  const importacao = useImportacao()
  const exportacoes = useExportacoes()
  const importados = useChamados((s) => s.importados.length)
  const desfazerImportacoes = useChamados((s) => s.desfazerImportacoes)
  const avisar = useAvisos((s) => s.avisar)
  const [confirmandoDesfazer, setConfirmandoDesfazer] = useState(false)

  const { passo, planilha, mapeamento, sugestao, resultado, nomeArquivo } = importacao

  return (
    <div className="flex flex-col gap-6">
      <Card
        titulo="Importar planilha de chamados"
        acao={
          importados > 0 && (
            <Botao variante="fantasma" tamanho="sm" icone={Undo2} onClick={() => setConfirmandoDesfazer(true)}>
              Desfazer importações ({importados})
            </Botao>
          )
        }
      >
        <div className="flex flex-col gap-6">
          <Etapas etapas={ETAPAS} atual={INDICE_ETAPA[passo]} />

          {passo === 'envio' && (
            <AreaEnvio
              lendo={importacao.lendo}
              erro={importacao.erro}
              aoEscolher={importacao.carregarArquivo}
              aoBaixarModelo={exportacoes.baixarModelo}
              gerandoModelo={exportacoes.gerando === 'modelo'}
            />
          )}
          {passo === 'mapeamento' && planilha && mapeamento && sugestao && (
            <PassoMapeamento
              planilha={planilha}
              nomeArquivo={nomeArquivo ?? ''}
              mapeamento={mapeamento}
              sugestao={sugestao}
              aoAlterar={importacao.alterarMapeamento}
              aoVoltar={importacao.reiniciar}
              aoAvancar={importacao.validar}
            />
          )}
          {passo === 'validacao' && resultado && (
            <PassoValidacao
              resultado={resultado}
              aoVoltar={() => importacao.irPara('mapeamento')}
              aoAvancar={() => importacao.irPara('confirmacao')}
            />
          )}
          {(passo === 'confirmacao' || passo === 'concluido') && resultado && (
            <PassoConfirmacao
              resumo={resultado.resumo}
              nomeArquivo={nomeArquivo ?? ''}
              concluido={passo === 'concluido'}
              aoVoltar={() => importacao.irPara('validacao')}
              aoConfirmar={importacao.confirmar}
              aoReiniciar={importacao.reiniciar}
            />
          )}
        </div>
      </Card>

      <Card titulo="Exportar para Excel e Power BI">
        <div className="grid gap-4 md:grid-cols-2">
          <CartaoExportacao
            icone={BarChart3}
            titulo="Relatório mensal de SLA"
            descricao="Abas Resumo (KPIs por fornecedor), Chamados, SLA por mês e Plano de ação. Cabeçalhos formatados, filtros ativados e cores de status. Respeita os filtros do topo."
          >
            <BotaoExportar id="relatorio" gerando={exportacoes.gerando} rotulo="Baixar relatório (.xlsx)" aoClicar={exportacoes.exportarRelatorio} />
          </CartaoExportacao>
          <CartaoExportacao
            icone={Filter}
            titulo="O que estou vendo"
            descricao={`Os ${exportacoes.quantidadeRecorte} chamados do recorte atual (período, sistema e fornecedor do topo). Na tela de Chamados, o botão Exportar também leva os filtros da lista.`}
          >
            <BotaoExportar id="recorte" gerando={exportacoes.gerando} rotulo="Exportar recorte (.xlsx)" aoClicar={exportacoes.exportarRecorte} />
          </CartaoExportacao>
          <CartaoExportacao
            icone={Database}
            titulo="Base para Power BI"
            descricao={`Todos os ${exportacoes.quantidadeBase} chamados em uma tabela plana, uma linha por chamado, com SLA e reincidência já calculados.`}
          >
            <BotaoExportar id="base-xlsx" gerando={exportacoes.gerando} rotulo=".xlsx" aoClicar={() => exportacoes.exportarBase('xlsx')} />
            <BotaoExportar id="base-csv" gerando={exportacoes.gerando} rotulo=".csv (separado por ;)" aoClicar={() => exportacoes.exportarBase('csv')} />
          </CartaoExportacao>
          <CartaoExportacao
            icone={FileSpreadsheet}
            titulo="Planilha modelo"
            descricao="Colunas esperadas na importação, com exemplos e uma aba de instruções."
          >
            <BotaoExportar id="modelo" gerando={exportacoes.gerando} rotulo="Baixar modelo" aoClicar={exportacoes.baixarModelo} />
          </CartaoExportacao>
        </div>
      </Card>

      <DialogoConfirmacao
        aberto={confirmandoDesfazer}
        destrutivo
        titulo="Desfazer as importações?"
        descricao={`Os ${importados} chamados importados saem da base e os indicadores voltam aos dados de exemplo.`}
        rotuloConfirmar="Desfazer"
        aoCancelar={() => setConfirmandoDesfazer(false)}
        aoConfirmar={() => {
          desfazerImportacoes()
          setConfirmandoDesfazer(false)
          importacao.reiniciar()
          avisar('Importações desfeitas. A base voltou aos dados de exemplo.', 'informacao')
        }}
      />
    </div>
  )
}
