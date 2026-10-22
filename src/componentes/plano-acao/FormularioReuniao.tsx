import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { FORNECEDORES } from '@/config/catalogo'
import { Botao } from '@/componentes/ui/Botao'
import { CampoAreaTexto, CampoTexto } from '@/componentes/ui/Campo'
import { CampoSelecao, type OpcaoSelecao } from '@/componentes/ui/CampoSelecao'
import { chaveData } from '@/lib/datas'
import { linhasDoTexto, validarReuniao, type DadosReuniao, type ErrosReuniao } from '@/lib/plano-acao'
import type { FornecedorId } from '@/tipos/catalogo'
import type { Acao } from '@/tipos/plano-acao'

const NENHUM = 'nenhum'
const OPCOES_FORNECEDOR: OpcaoSelecao<FornecedorId | typeof NENHUM>[] = [
  { valor: NENHUM, rotulo: 'Reunião interna' },
  ...FORNECEDORES.map((f) => ({ valor: f.id, rotulo: f.nome })),
]

interface FormularioReuniaoProps {
  /** Data e hora sugeridas (o "agora" da simulação). */
  agora: Date
  acoesAbertas: readonly Acao[]
  aoSalvar: (dados: DadosReuniao) => void
  aoCancelar: () => void
}

const paraCampoDataHora = (data: Date) =>
  `${chaveData(data)}T${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`

/** Registro simples de reunião: data, participantes, decisões e ações geradas (CONCEITO.md, seção 6.4). */
export function FormularioReuniao({ agora, acoesAbertas, aoSalvar, aoCancelar }: FormularioReuniaoProps) {
  const [titulo, setTitulo] = useState('')
  const [dataTexto, setDataTexto] = useState(paraCampoDataHora(agora))
  const [fornecedorId, setFornecedorId] = useState<FornecedorId | null>(null)
  const [participantes, setParticipantes] = useState('')
  const [decisoes, setDecisoes] = useState('')
  const [novasAcoes, setNovasAcoes] = useState('')
  const [acompanhadas, setAcompanhadas] = useState<string[]>([])
  const [erros, setErros] = useState<ErrosReuniao>({})

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    const data = new Date(dataTexto)
    const dados: DadosReuniao = {
      titulo,
      data: Number.isNaN(data.getTime()) ? agora : data,
      fornecedorId,
      participantes: linhasDoTexto(participantes),
      decisoes: linhasDoTexto(decisoes),
      acoesExistentes: acompanhadas,
      novasAcoes: linhasDoTexto(novasAcoes),
    }
    const novosErros = validarReuniao(dados)
    setErros(novosErros)
    if (Object.keys(novosErros).length === 0) aoSalvar(dados)
  }

  const alternar = (id: string) =>
    setAcompanhadas((atuais) => (atuais.includes(id) ? atuais.filter((a) => a !== id) : [...atuais, id]))

  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
      <CampoTexto
        rotulo="Título"
        obrigatorio
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        erro={erros.titulo}
        placeholder="Ex.: Reunião mensal com Gama Consultoria"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto rotulo="Data e hora" type="datetime-local" value={dataTexto} onChange={(e) => setDataTexto(e.target.value)} />
        <CampoSelecao
          rotulo="Fornecedor"
          valor={fornecedorId ?? NENHUM}
          opcoes={OPCOES_FORNECEDOR}
          aoMudar={(v) => setFornecedorId(v === NENHUM ? null : v)}
        />
      </div>
      <CampoAreaTexto
        rotulo="Participantes"
        obrigatorio
        dica="Um por linha."
        value={participantes}
        onChange={(e) => setParticipantes(e.target.value)}
        erro={erros.participantes}
      />
      <CampoAreaTexto
        rotulo="Decisões"
        dica="Uma por linha."
        value={decisoes}
        onChange={(e) => setDecisoes(e.target.value)}
        erro={erros.decisoes}
      />
      <CampoAreaTexto
        rotulo="Novas ações"
        dica="Uma por linha. Viram ações “A fazer” com responsável a definir e prazo de 14 dias."
        value={novasAcoes}
        onChange={(e) => setNovasAcoes(e.target.value)}
      />
      {acoesAbertas.length > 0 && (
        <fieldset>
          <legend className="mb-1 text-xs font-medium text-texto-suave">Ações em aberto acompanhadas na reunião</legend>
          <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg p-2 ring-1 ring-borda">
            {acoesAbertas.map((acao) => (
              <label key={acao.id} className="flex items-start gap-2 rounded p-1 text-sm text-texto hover:bg-fundo">
                <input
                  type="checkbox"
                  checked={acompanhadas.includes(acao.id)}
                  onChange={() => alternar(acao.id)}
                  className="mt-0.5 size-4 accent-primaria"
                />
                <span>
                  <span className="font-mono text-xs text-texto-suave">{acao.id}</span> {acao.titulo}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="flex gap-2 border-t border-borda pt-4">
        <Botao type="submit" icone={Save}>
          Registrar reunião
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}
