import { PREFIXOS_ID, ROTULOS_ESTADO, ROTULOS_TIPO } from '@/config/chamados'
import { COLUNAS_IMPORTACAO, type CampoImportacao } from '@/config/excel'
import { TABELA_SLA } from '@/config/sla'
import type { Fornecedor, SistemaRh } from '@/tipos/catalogo'
import type { Chamado, EstadoChamado, EventoHistorico, Prioridade, TipoChamado } from '@/tipos/chamado'
import { formatarDataHora } from '../formatacao'
import { normalizarTexto } from '../lista-chamados'
import { lerDataHora } from './datas-excel'
import type { Mapeamento } from './mapeamento'

export type NivelProblema = 'erro' | 'alerta'

export interface ProblemaLinha {
  campo: CampoImportacao
  nivel: NivelProblema
  mensagem: string
}

/** Novo = ID ainda não existe; atualizado = substitui um chamado da base; ignorado = tem erro. */
export type SituacaoLinha = 'novo' | 'atualizado' | 'ignorado'

export interface LinhaValidada {
  /** Número da linha na planilha (o cabeçalho é a linha 1). */
  numero: number
  /** Valor de cada campo como texto, para a pré-visualização. */
  valores: Record<CampoImportacao, string>
  problemas: ProblemaLinha[]
  situacao: SituacaoLinha
  chamado: Chamado | null
}

export interface ResumoValidacao {
  total: number
  validas: number
  comAlerta: number
  comErro: number
  novos: number
  atualizados: number
  ignorados: number
}

export interface ResultadoValidacao {
  linhas: LinhaValidada[]
  resumo: ResumoValidacao
}

export interface ContextoValidacao {
  idsExistentes: ReadonlySet<string>
  agora: Date
  sistemas: readonly SistemaRh[]
  fornecedores: readonly Fornecedor[]
  nomeArquivo: string
}

const chave = (texto: string) => normalizarTexto(texto)

const TIPOS = new Map<string, TipoChamado>(
  (Object.entries(ROTULOS_TIPO) as [TipoChamado, string][]).flatMap(([tipo, rotulo]) => [
    [chave(rotulo), tipo],
    [chave(PREFIXOS_ID[tipo]), tipo],
  ]),
)

const PRIORIDADES = new Map<string, Prioridade>(
  (Object.keys(TABELA_SLA) as Prioridade[]).flatMap((p) => [
    [chave(p), p],
    [p.slice(1), p],
    [chave(TABELA_SLA[p].rotulo), p],
  ]),
)

const ESTADOS = new Map<string, EstadoChamado>([
  ...(Object.entries(ROTULOS_ESTADO) as [EstadoChamado, string][]).map(([estado, rotulo]) => [chave(rotulo), estado] as const),
  ['em andamento', 'em-atendimento'],
  ['aguardando', 'aguardando-usuario'],
  ['pendente usuario', 'aguardando-usuario'],
])

const SIM_NAO = new Map([
  ['sim', true],
  ['s', true],
  ['true', true],
  ['1', true],
  ['nao', false],
  ['n', false],
  ['false', false],
  ['0', false],
  ['', false],
])

const PADRAO_ID = /^(INC|REQ|EVO)-\d{4}-\d{4}$/
const CAMPOS_DE_DATA: ReadonlySet<CampoImportacao> = new Set(['abertura', 'resolucao'])

/** Valor da célula como texto legível (datas do Excel viram dd/mm/aaaa hh:mm). */
function textoDaCelula(valor: unknown, campo: CampoImportacao): string {
  if (valor === null || valor === undefined) return ''
  if (CAMPOS_DE_DATA.has(campo) && (typeof valor === 'number' || valor instanceof Date)) {
    const data = lerDataHora(valor)
    return data ? formatarDataHora(data) : String(valor)
  }
  if (valor instanceof Date) return formatarDataHora(valor)
  return String(valor).trim()
}

const linhaVazia = (linha: readonly unknown[]) => linha.every((celula) => celula === null || String(celula ?? '').trim() === '')

/**
 * Valida as linhas da planilha (CONCEITO.md, seção 8.1, passo 3): cada
 * problema traz o campo, a gravidade e uma explicação curta. Linhas com erro
 * são ignoradas; alertas não impedem a importação.
 */
export function validarLinhas(
  linhas: readonly (readonly unknown[])[],
  mapeamento: Mapeamento,
  contexto: ContextoValidacao,
): ResultadoValidacao {
  const primeiraOcorrencia = new Map<string, number>()
  const validadas: LinhaValidada[] = []

  linhas.forEach((linha, indice) => {
    if (linhaVazia(linha)) return
    const numero = indice + 2
    const bruto = (campo: CampoImportacao) => {
      const coluna = mapeamento[campo]
      return coluna === null ? null : (linha[coluna] ?? null)
    }
    const valores = Object.fromEntries(
      COLUNAS_IMPORTACAO.map((c) => [c.campo, textoDaCelula(bruto(c.campo), c.campo)]),
    ) as Record<CampoImportacao, string>

    const problemas: ProblemaLinha[] = []
    const erro = (campo: CampoImportacao, mensagem: string) => problemas.push({ campo, nivel: 'erro', mensagem })
    const alerta = (campo: CampoImportacao, mensagem: string) => problemas.push({ campo, nivel: 'alerta', mensagem })

    // ID
    const id = valores.id.toUpperCase()
    if (!id) erro('id', 'Campo obrigatório.')
    else {
      const anterior = primeiraOcorrencia.get(id)
      if (anterior) erro('id', `ID duplicado na planilha (também na linha ${anterior}).`)
      else primeiraOcorrencia.set(id, numero)
      if (!PADRAO_ID.test(id)) alerta('id', 'ID fora do padrão TIPO-AAAA-NNNN.')
    }

    // Tipo, título
    const tipo = TIPOS.get(chave(valores.tipo))
    if (!valores.tipo) erro('tipo', 'Campo obrigatório.')
    else if (!tipo) erro('tipo', 'Tipo desconhecido: use Incidente, Requisição ou Evolutiva.')
    if (!valores.titulo) erro('titulo', 'Campo obrigatório.')

    // Sistema e fornecedor
    const sistema = contexto.sistemas.find(
      (s) => chave(s.nome) === chave(valores.sistema) || chave(s.nomeCurto) === chave(valores.sistema),
    )
    if (!valores.sistema) erro('sistema', 'Campo obrigatório.')
    else if (!sistema) erro('sistema', 'Sistema não cadastrado.')
    let fornecedor = contexto.fornecedores.find((f) => chave(f.nome) === chave(valores.fornecedor))
    if (valores.fornecedor && !fornecedor) erro('fornecedor', 'Fornecedor não cadastrado.')
    if (!valores.fornecedor && sistema) {
      fornecedor = contexto.fornecedores.find((f) => f.id === sistema.fornecedorId)
      alerta('fornecedor', `Fornecedor não informado: usado ${fornecedor?.nome}, responsável pelo sistema.`)
    } else if (fornecedor && sistema && fornecedor.id !== sistema.fornecedorId) {
      const responsavel = contexto.fornecedores.find((f) => f.id === sistema.fornecedorId)?.nome
      alerta('fornecedor', `O sistema é sustentado pela ${responsavel}.`)
    }

    // Prioridade
    const prioridade = PRIORIDADES.get(chave(valores.prioridade))
    if (!valores.prioridade) erro('prioridade', 'Campo obrigatório.')
    else if (!prioridade) erro('prioridade', 'Prioridade desconhecida: use P1, P2, P3 ou P4.')

    // Datas
    const abertura = lerDataHora(bruto('abertura'))
    if (!valores.abertura) erro('abertura', 'Campo obrigatório.')
    else if (!abertura) erro('abertura', 'Data inválida: use dd/mm/aaaa hh:mm.')
    else if (abertura.getTime() > contexto.agora.getTime()) erro('abertura', 'Data no futuro.')

    let resolucao = valores.resolucao ? lerDataHora(bruto('resolucao')) : null
    if (valores.resolucao && !resolucao) erro('resolucao', 'Data inválida: use dd/mm/aaaa hh:mm.')
    else if (resolucao && abertura && resolucao.getTime() < abertura.getTime()) {
      erro('resolucao', 'Resolução anterior à abertura.')
    } else if (resolucao && resolucao.getTime() > contexto.agora.getTime()) erro('resolucao', 'Data no futuro.')

    // Status
    const estado = ESTADOS.get(chave(valores.status))
    if (!valores.status) erro('status', 'Campo obrigatório.')
    else if (!estado) erro('status', 'Status desconhecido: use Aberto, Em atendimento, Aguardando usuário ou Resolvido.')
    else if (estado === 'resolvido' && !valores.resolucao) erro('resolucao', 'Chamado resolvido sem data de resolução.')
    else if (estado !== 'resolvido' && resolucao) {
      alerta('resolucao', 'Há data de resolução, mas o status não é Resolvido: a data foi ignorada.')
      resolucao = null
    }

    // Reaberto e satisfação
    const reaberto = SIM_NAO.get(chave(valores.reaberto))
    if (reaberto === undefined) alerta('reaberto', 'Valor não reconhecido: considerado "Não".')
    let satisfacao: number | null = null
    if (valores.satisfacao) {
      const nota = Number(valores.satisfacao.replace(',', '.'))
      if (Number.isInteger(nota) && nota >= 1 && nota <= 5) satisfacao = nota
      else alerta('satisfacao', 'Nota fora da escala de 1 a 5: ignorada.')
    }

    const temErro = problemas.some((p) => p.nivel === 'erro')
    const chamado =
      !temErro && tipo && sistema && fornecedor && prioridade && abertura && estado
        ? montarChamado({
            id,
            tipo,
            titulo: valores.titulo,
            sistema,
            fornecedor,
            prioridade,
            abertura,
            resolucao: estado === 'resolvido' ? resolucao : null,
            estado,
            reaberto: reaberto ?? false,
            satisfacao: estado === 'resolvido' ? satisfacao : null,
            contexto,
          })
        : null

    validadas.push({
      numero,
      valores,
      problemas,
      situacao: !chamado ? 'ignorado' : contexto.idsExistentes.has(id) ? 'atualizado' : 'novo',
      chamado,
    })
  })

  const contar = (filtro: (l: LinhaValidada) => boolean) => validadas.filter(filtro).length
  return {
    linhas: validadas,
    resumo: {
      total: validadas.length,
      validas: contar((l) => l.chamado !== null),
      comAlerta: contar((l) => l.chamado !== null && l.problemas.length > 0),
      comErro: contar((l) => l.chamado === null),
      novos: contar((l) => l.situacao === 'novo'),
      atualizados: contar((l) => l.situacao === 'atualizado'),
      ignorados: contar((l) => l.situacao === 'ignorado'),
    },
  }
}

interface DadosChamado {
  id: string
  tipo: TipoChamado
  titulo: string
  sistema: SistemaRh
  fornecedor: Fornecedor
  prioridade: Prioridade
  abertura: Date
  resolucao: Date | null
  estado: EstadoChamado
  reaberto: boolean
  satisfacao: number | null
  contexto: ContextoValidacao
}

/**
 * A planilha não traz o histórico completo. O chamado entra com abertura,
 * status atual e resolução. "Aguardando usuário" é registrado no momento da
 * importação, para não esconder tempo de SLA que já passou.
 */
function montarChamado(dados: DadosChamado): Chamado {
  const nota = `Importado de ${dados.contexto.nomeArquivo}`
  const historico: EventoHistorico[] = [{ estado: 'aberto', em: dados.abertura, nota }]
  if (dados.estado === 'em-atendimento') historico.push({ estado: 'em-atendimento', em: dados.abertura })
  if (dados.estado === 'aguardando-usuario') {
    historico.push({ estado: 'aguardando-usuario', em: dados.contexto.agora, nota: 'Status informado na planilha' })
  }
  if (dados.estado === 'resolvido' && dados.resolucao) {
    historico.push({ estado: 'resolvido', em: dados.resolucao, nota: 'Resolução informada na planilha' })
  }
  return {
    id: dados.id,
    tipo: dados.tipo,
    titulo: dados.titulo,
    descricao: nota,
    sistemaId: dados.sistema.id,
    fornecedorId: dados.fornecedor.id,
    prioridade: dados.prioridade,
    categoria: dados.titulo,
    causa: `${dados.titulo} · importado`,
    abertoEm: dados.abertura,
    resolvidoEm: dados.estado === 'resolvido' ? dados.resolucao : null,
    historico,
    reaberto: dados.reaberto,
    solucao: null,
    satisfacao: dados.satisfacao,
  }
}

/** Incorpora os chamados importados: IDs existentes são substituídos, os novos entram na base. */
export function incorporarChamados(base: readonly Chamado[], importados: readonly Chamado[]): Chamado[] {
  const porId = new Map(base.map((c) => [c.id, c]))
  for (const chamado of importados) porId.set(chamado.id, chamado)
  return [...porId.values()].toSorted((a, b) => a.abertoEm.getTime() - b.abertoEm.getTime())
}

const plural = (n: number, singular: string, pluralTexto: string) => `${n} ${n === 1 ? singular : pluralTexto}`

/** Frase do resumo da importação: "32 chamados novos, 8 atualizados, 5 ignorados por erro". */
export function fraseResumo(resumo: Pick<ResumoValidacao, 'novos' | 'atualizados' | 'ignorados'>): string {
  return [
    plural(resumo.novos, 'chamado novo', 'chamados novos'),
    plural(resumo.atualizados, 'atualizado', 'atualizados'),
    plural(resumo.ignorados, 'ignorado por erro', 'ignorados por erro'),
  ].join(', ')
}
