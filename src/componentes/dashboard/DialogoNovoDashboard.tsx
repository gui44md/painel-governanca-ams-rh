import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { FORNECEDORES } from '@/config/catalogo'
import { Botao } from '@/componentes/ui/Botao'
import { CampoTexto } from '@/componentes/ui/Campo'
import { CampoSelecao, type OpcaoSelecao } from '@/componentes/ui/CampoSelecao'
import { Modal } from '@/componentes/ui/Modal'
import { cx } from '@/lib/classes'
import { MODELOS_DASHBOARD, type IdModelo } from '@/lib/dashboard/modelos'
import { TAMANHO_MAXIMO_NOME, validarNomeDashboard } from '@/lib/dashboard/operacoes'
import type { FornecedorId } from '@/tipos/catalogo'

const EM_BRANCO = 'em-branco'
type Origem = IdModelo | typeof EM_BRANCO

const OPCOES_FORNECEDOR: OpcaoSelecao<FornecedorId>[] = FORNECEDORES.map((f) => ({ valor: f.id, rotulo: f.nome }))

interface DialogoNovoDashboardProps {
  aberto: boolean
  /** Modelo já escolhido ao abrir (pelos cartões de modelo). */
  modeloInicial: IdModelo | null
  aoFechar: () => void
  aoCriar: (nome: string, opcoes: { modeloId?: IdModelo; fornecedorId?: FornecedorId }) => void
}

function nomeSugerido(origem: Origem, fornecedorId: FornecedorId): string {
  if (origem === EM_BRANCO) return ''
  if (origem === 'reuniao-fornecedor') return `Reunião mensal com ${FORNECEDORES.find((f) => f.id === fornecedorId)?.nome}`
  return MODELOS_DASHBOARD.find((m) => m.id === origem)?.nome ?? ''
}

/** "Novo dashboard" (CONCEITO.md, seção 7, passo 1): nome e, opcionalmente, um modelo de partida. */
export function DialogoNovoDashboard({ aberto, modeloInicial, aoFechar, aoCriar }: DialogoNovoDashboardProps) {
  const [origem, setOrigem] = useState<Origem>(modeloInicial ?? EM_BRANCO)
  const [fornecedorId, setFornecedorId] = useState<FornecedorId>('beta')
  const [nome, setNome] = useState(nomeSugerido(modeloInicial ?? EM_BRANCO, 'beta'))
  const [nomeEditado, setNomeEditado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const escolherOrigem = (nova: Origem, fornecedor = fornecedorId) => {
    setOrigem(nova)
    if (!nomeEditado) setNome(nomeSugerido(nova, fornecedor))
  }

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    const problema = validarNomeDashboard(nome)
    setErro(problema)
    if (problema) return
    aoCriar(nome, origem === EM_BRANCO ? {} : { modeloId: origem, fornecedorId })
  }

  const opcoes: { id: Origem; nome: string; descricao: string }[] = [
    { id: EM_BRANCO, nome: 'Em branco', descricao: 'Comece do zero arrastando widgets.' },
    ...MODELOS_DASHBOARD,
  ]

  return (
    <Modal aberto={aberto} titulo="Novo dashboard" aoFechar={aoFechar}>
      <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-medium text-texto-suave">Começar de</legend>
          {opcoes.map((opcao) => (
            <label
              key={opcao.id}
              className={cx(
                'flex cursor-pointer items-start gap-3 rounded-lg p-3 ring-1 transition-colors',
                origem === opcao.id ? 'bg-primaria-clara ring-primaria/40' : 'ring-borda hover:bg-fundo',
              )}
            >
              <input
                type="radio"
                name="origem"
                checked={origem === opcao.id}
                onChange={() => escolherOrigem(opcao.id)}
                className="mt-1 size-4 accent-primaria"
              />
              <span>
                <span className="block text-sm font-semibold text-texto">{opcao.nome}</span>
                <span className="block text-xs text-texto-suave">{opcao.descricao}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {origem === 'reuniao-fornecedor' && (
          <CampoSelecao
            rotulo="Fornecedor da reunião"
            valor={fornecedorId}
            opcoes={OPCOES_FORNECEDOR}
            aoMudar={(novo) => {
              setFornecedorId(novo)
              escolherOrigem(origem, novo)
            }}
          />
        )}
        <CampoTexto
          rotulo="Nome do dashboard"
          obrigatorio
          maxLength={TAMANHO_MAXIMO_NOME}
          value={nome}
          placeholder="Ex.: Reunião mensal com Beta Tech"
          onChange={(e) => {
            setNome(e.target.value)
            setNomeEditado(true)
          }}
          erro={erro ?? undefined}
        />
        <div className="flex gap-2">
          <Botao type="submit" icone={Plus}>
            Criar dashboard
          </Botao>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
        </div>
      </form>
    </Modal>
  )
}
