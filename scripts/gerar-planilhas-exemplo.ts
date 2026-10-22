/**
 * Gera as duas planilhas de exemplo da importação (CONCEITO.md, seção 8.1):
 * o relatório mensal que a Beta Tech enviaria, em versão limpa e com erros
 * propositais. Uso: `npm run planilhas:exemplo`.
 *
 * Os cabeçalhos imitam os de um fornecedor ("Nº Chamado", "Dt Abertura"...),
 * para a demonstração mostrar o mapeamento automático de colunas.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { ROTULOS_ESTADO, ROTULOS_TIPO } from '@/config/chamados'
import { CONTEXTO_ANALISE, gerarBaseFicticia } from '@/dados/base-ficticia'
import { MODELOS_POR_SISTEMA, VARIAVEIS, type NomeVariavel } from '@/dados/gerador/modelos-chamados'
import { criarAleatorio } from '@/lib/aleatorio'
import { analisarChamados } from '@/lib/analise'
import { comHora } from '@/lib/datas'
import { cabecalho, data, numero, texto, type Celula, type DefinicaoAba } from '@/lib/excel/abas'
import { sugerirMapeamento } from '@/lib/excel/mapeamento'
import { gerarXlsx, lerPlanilha } from '@/lib/excel/planilha'
import { fraseResumo, validarLinhas } from '@/lib/excel/validacao'
import type { Prioridade, TipoChamado } from '@/tipos/chamado'

const PASTA = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'exemplos')
const { agora } = CONTEXTO_ANALISE
const aleatorio = criarAleatorio(2026_10)

const CABECALHOS = ['Nº Chamado', 'Tipo', 'Assunto', 'Sistema', 'Empresa', 'Criticidade', 'Dt Abertura', 'Dt Fechamento', 'Situação', 'Reaberto', 'Nota']

interface Linha {
  id: string
  tipo: TipoChamado
  titulo: string
  sistema: string
  empresa: string
  prioridade: Prioridade | string
  abertura: Date | string
  resolucao: Date | string | null
  status: string
  reaberto: string
  nota: number | string | null
}

const celulas = (l: Linha): Celula[] => [
  texto(l.id),
  texto(ROTULOS_TIPO[l.tipo]),
  texto(l.titulo),
  texto(l.sistema),
  texto(l.empresa),
  texto(l.prioridade),
  l.abertura instanceof Date ? data(l.abertura) : texto(l.abertura),
  l.resolucao instanceof Date ? data(l.resolucao) : texto(l.resolucao),
  texto(l.status),
  texto(l.reaberto),
  typeof l.nota === 'number' ? numero(l.nota) : texto(l.nota),
]

function preencher(textoModelo: string): string {
  return textoModelo.replace(/\{(\w+)\}/g, (_, nome: string) =>
    nome === 'mes' ? 'outubro' : aleatorio.escolher(VARIAVEIS[nome as NomeVariavel] ?? ['']),
  )
}

/** Chamados novos de outubro, de Ponto Eletrônico e Portal do Colaborador. */
function chamadosNovos(quantidade: number): Linha[] {
  const sistemas = SISTEMAS_RH.filter((s) => s.fornecedorId === 'beta')
  const contadores = { incidente: 901, requisicao: 601, evolutiva: 101 }
  return Array.from({ length: quantidade }, () => {
    const sistema = aleatorio.escolher(sistemas)
    const modelo = aleatorio.escolher(MODELOS_POR_SISTEMA[sistema.id].filter((m) => m.tipo !== 'evolutiva'))
    let dia = aleatorio.inteiro(1, 23)
    while ([0, 6].includes(new Date(2026, 9, dia).getDay()) || dia === 12) dia++
    const abertura = comHora(new Date(2026, 9, dia), aleatorio.inteiro(8, 16), aleatorio.escolher([0, 10, 20, 30, 40, 50]))
    const resolvido = aleatorio.chance(0.9)
    const resolucao = new Date(abertura.getTime() + aleatorio.inteiro(1, 6) * 3_600_000)
    const prefixo = modelo.tipo === 'incidente' ? 'INC' : 'REQ'
    return {
      id: `${prefixo}-2026-${String(contadores[modelo.tipo]++).padStart(4, '0')}`,
      tipo: modelo.tipo,
      titulo: preencher(modelo.titulo).replace(/^./, (c) => c.toUpperCase()),
      sistema: sistema.nome,
      empresa: 'Beta Tech',
      prioridade: aleatorio.escolherPonderado(modelo.prioridades),
      abertura,
      resolucao: resolvido ? resolucao : null,
      status: resolvido ? 'Resolvido' : 'Em atendimento',
      reaberto: 'Não',
      nota: resolvido ? aleatorio.escolherPonderado([[5, 4], [4, 4], [3, 1]] as const) : null,
    }
  })
}

/** Chamados da base que o fornecedor informa como resolvidos (viram "atualizados"). */
function chamadosAtualizados(quantidade: number): Linha[] {
  const base = analisarChamados(gerarBaseFicticia(), CONTEXTO_ANALISE)
  const sistema = new Map(SISTEMAS_RH.map((s) => [s.id, s.nome]))
  return base
    .filter((c) => c.fornecedorId === 'beta' && c.tipo !== 'evolutiva' && c.abertoEm < new Date(2026, 9, 20))
    .slice(-quantidade)
    .map((c) => ({
      id: c.id,
      tipo: c.tipo,
      titulo: c.titulo,
      sistema: sistema.get(c.sistemaId) ?? '',
      empresa: 'Beta Tech',
      prioridade: c.prioridade,
      abertura: c.abertoEm,
      resolucao: c.resolvidoEm ?? comHora(agora, 11),
      status: ROTULOS_ESTADO.resolvido,
      reaberto: c.reaberto ? 'Sim' : 'Não',
      nota: c.satisfacao ?? 4,
    }))
}

const limpas: Linha[] = [...chamadosNovos(24), ...chamadosAtualizados(6)].toSorted(
  (a, b) => new Date(a.abertura).getTime() - new Date(b.abertura).getTime(),
)

/** Mesmas linhas, com os erros que a seção 8.1 cita e alguns alertas. */
function comErros(linhas: Linha[]): Linha[] {
  const copia = linhas.map((l) => ({ ...l }))
  const em = (i: number, alteracao: Partial<Linha>) => Object.assign(copia[i]!, alteracao)
  em(2, { abertura: '31/09/2026 10:00' }) // data inválida
  em(5, { prioridade: 'Urgente' }) // prioridade desconhecida
  em(9, { id: copia[8]!.id }) // ID duplicado
  em(12, { sistema: 'Ponto Mobile' }) // sistema não cadastrado
  em(15, { resolucao: '01/10/2026 08:00', abertura: '02/10/2026 09:00' }) // resolução antes da abertura
  em(18, { status: 'Fechado' }) // status desconhecido
  em(21, { titulo: '' }) // campo obrigatório vazio
  em(24, { nota: 7 }) // alerta: nota fora da escala
  em(26, { empresa: '' }) // alerta: fornecedor inferido pelo sistema
  return copia
}

function aba(linhas: Linha[]): DefinicaoAba {
  return {
    nome: 'Chamados outubro',
    linhas: [cabecalho(CABECALHOS), ...linhas.map(celulas)],
    larguras: [16, 12, 56, 24, 14, 12, 17, 17, 16, 10, 8],
    linhaCabecalho: 0,
    filtro: true,
  }
}

function conferir(nome: string, conteudo: Uint8Array, esperado: { comErro: number; atualizados: number }) {
  const planilha = lerPlanilha(conteudo.buffer as ArrayBuffer)
  const mapeamento = sugerirMapeamento(planilha.cabecalhos)
  const { resumo } = validarLinhas(planilha.linhas, mapeamento, {
    idsExistentes: new Set(gerarBaseFicticia().map((c) => c.id)),
    agora,
    sistemas: SISTEMAS_RH,
    fornecedores: FORNECEDORES,
    nomeArquivo: nome,
  })
  console.log(`${nome}: ${fraseResumo(resumo)} (${resumo.comAlerta} com alerta)`)
  if (Object.values(mapeamento).some((coluna) => coluna === null)) throw new Error(`${nome}: colunas não mapeadas`)
  if (resumo.comErro !== esperado.comErro || resumo.atualizados !== esperado.atualizados) {
    throw new Error(`${nome}: resultado diferente do esperado ${JSON.stringify(esperado)}`)
  }
}

mkdirSync(PASTA, { recursive: true })
const arquivos: [string, Linha[], { comErro: number; atualizados: number }][] = [
  ['chamados-fornecedor-outubro.xlsx', limpas, { comErro: 0, atualizados: 6 }],
  // Um dos erros cai numa linha de atualização: ela é ignorada, então ficam 5 atualizados.
  ['chamados-fornecedor-outubro-com-erros.xlsx', comErros(limpas), { comErro: 7, atualizados: 5 }],
]
for (const [nome, linhas, esperado] of arquivos) {
  const conteudo = gerarXlsx([aba(linhas)])
  writeFileSync(join(PASTA, nome), conteudo)
  conferir(nome, conteudo, esperado)
}
