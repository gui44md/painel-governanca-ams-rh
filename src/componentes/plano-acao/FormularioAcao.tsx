import { useRef, useState, type FormEvent } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { ROTULOS_INDICADOR_ACAO, ROTULOS_STATUS_ACAO } from '@/config/plano-acao'
import { Botao } from '@/componentes/ui/Botao'
import { CampoAreaTexto, CampoTexto } from '@/componentes/ui/Campo'
import { CampoSelecao, type OpcaoSelecao } from '@/componentes/ui/CampoSelecao'
import { chaveData, dataDoCampo } from '@/lib/datas'
import { sistemasDisponiveis } from '@/lib/filtros'
import { temErros, validarAcao, type ErrosAcao, type RascunhoAcao } from '@/lib/plano-acao'
import type { FornecedorId, SistemaId } from '@/tipos/catalogo'
import type { IndicadorAcao, StatusAcao } from '@/tipos/plano-acao'

const NENHUM = 'nenhum'

const OPCOES_INDICADOR: OpcaoSelecao<IndicadorAcao>[] = (
  Object.entries(ROTULOS_INDICADOR_ACAO) as [IndicadorAcao, string][]
).map(([valor, rotulo]) => ({ valor, rotulo }))

const OPCOES_STATUS: OpcaoSelecao<StatusAcao>[] = (Object.entries(ROTULOS_STATUS_ACAO) as [StatusAcao, string][]).map(
  ([valor, rotulo]) => ({ valor, rotulo }),
)

const OPCOES_FORNECEDOR: OpcaoSelecao<FornecedorId | typeof NENHUM>[] = [
  { valor: NENHUM, rotulo: 'Todos / não se aplica' },
  ...FORNECEDORES.map((f) => ({ valor: f.id, rotulo: f.nome })),
]

interface FormularioAcaoProps {
  inicial: RascunhoAcao
  /** Texto que explica de onde veio a sugestão (insight ou indicador). */
  motivo?: string
  aoSalvar: (rascunho: RascunhoAcao) => void
  aoCancelar: () => void
  aoExcluir?: () => void
}

/** Criação e edição de ação, com validação antes de salvar. */
export function FormularioAcao({ inicial, motivo, aoSalvar, aoCancelar, aoExcluir }: FormularioAcaoProps) {
  const [rascunho, setRascunho] = useState(inicial)
  const [prazoTexto, setPrazoTexto] = useState(inicial.prazo ? chaveData(inicial.prazo) : '')
  const [erros, setErros] = useState<ErrosAcao>({})
  const formularioRef = useRef<HTMLFormElement>(null)

  const alterar = (parcial: Partial<RascunhoAcao>) => setRascunho((atual) => ({ ...atual, ...parcial }))

  const opcoesSistema: OpcaoSelecao<SistemaId | typeof NENHUM>[] = [
    { valor: NENHUM, rotulo: 'Todos / não se aplica' },
    ...sistemasDisponiveis(SISTEMAS_RH, rascunho.fornecedorId).map((s) => ({ valor: s.id, rotulo: s.nome })),
  ]

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    const final = { ...rascunho, prazo: dataDoCampo(prazoTexto) }
    const novosErros = validarAcao(final)
    setErros(novosErros)
    if (temErros(novosErros)) {
      // Leva o foco ao primeiro campo com problema.
      requestAnimationFrame(() => formularioRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    aoSalvar(final)
  }

  return (
    <form ref={formularioRef} noValidate onSubmit={enviar} className="flex flex-col gap-4">
      {motivo && (
        <p className="rounded-lg bg-destaque-claro p-3 text-sm text-texto ring-1 ring-destaque">
          <strong className="text-primaria">Origem: </strong>
          {motivo}
        </p>
      )}
      <CampoTexto
        rotulo="Título da ação"
        obrigatorio
        value={rascunho.titulo}
        onChange={(e) => alterar({ titulo: e.target.value })}
        erro={erros.titulo}
      />
      <CampoAreaTexto
        rotulo="Descrição"
        value={rascunho.descricao}
        onChange={(e) => alterar({ descricao: e.target.value })}
        dica="O que será feito e qual resultado se espera."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelecao
          rotulo="Indicador relacionado"
          valor={rascunho.indicador}
          opcoes={OPCOES_INDICADOR}
          aoMudar={(indicador) => alterar({ indicador })}
        />
        <CampoSelecao rotulo="Status" valor={rascunho.status} opcoes={OPCOES_STATUS} aoMudar={(status) => alterar({ status })} />
        <CampoSelecao
          rotulo="Fornecedor"
          valor={rascunho.fornecedorId ?? NENHUM}
          opcoes={OPCOES_FORNECEDOR}
          aoMudar={(valor) => {
            const fornecedorId = valor === NENHUM ? null : valor
            const sistemaValido = SISTEMAS_RH.find((s) => s.id === rascunho.sistemaId)?.fornecedorId === fornecedorId
            alterar({ fornecedorId, sistemaId: sistemaValido ? rascunho.sistemaId : null })
          }}
        />
        <CampoSelecao
          rotulo="Sistema de RH"
          valor={rascunho.sistemaId ?? NENHUM}
          opcoes={opcoesSistema}
          aoMudar={(valor) => alterar({ sistemaId: valor === NENHUM ? null : valor })}
        />
        <CampoTexto
          rotulo="Responsável"
          obrigatorio
          value={rascunho.responsavel}
          onChange={(e) => alterar({ responsavel: e.target.value })}
          erro={erros.responsavel}
          placeholder="Nome e área"
        />
        <CampoTexto
          rotulo="Prazo"
          obrigatorio
          type="date"
          value={prazoTexto}
          onChange={(e) => setPrazoTexto(e.target.value)}
          erro={erros.prazo}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-borda pt-4">
        <Botao type="submit" icone={Save}>
          Salvar ação
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
        {aoExcluir && (
          <Botao variante="fantasma" icone={Trash2} onClick={aoExcluir} className="ml-auto text-estourado-texto">
            Excluir
          </Botao>
        )}
      </div>
    </form>
  )
}
