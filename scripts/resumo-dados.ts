/**
 * Mostra no terminal os números da base fictícia e os insights plantados.
 * Útil para revisar os dados antes da demonstração: `npm run dados:resumo`.
 */
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { CALENDARIO_UTIL, DIAS_ELEVACAO_FECHAMENTO } from '@/config/sla'
import { CONTEXTO_ANALISE, gerarBaseFicticia } from '@/dados/base-ficticia'
import { analisarChamados, type ChamadoAnalisado } from '@/lib/analise'
import { estaNaJanelaDeFechamento } from '@/lib/calendario-rh'
import { comHora } from '@/lib/datas'
import { backlogEvolutivas, chamadosEmAberto, resumirIndicadores } from '@/lib/indicadores'
import { listarMeses } from '@/lib/periodo'

const pct = (valor: number | null) => (valor === null ? '—' : `${(valor * 100).toFixed(1)}%`)
const num = (valor: number | null, casas = 1) => (valor === null ? '—' : valor.toFixed(casas))

const { agora } = CONTEXTO_ANALISE
const chamados = analisarChamados(gerarBaseFicticia(), CONTEXTO_ANALISE)

function linha(rotulo: string, lista: ChamadoAnalisado[]) {
  const r = resumirIndicadores(lista, agora)
  return {
    rotulo,
    volume: r.volume,
    sla: pct(r.percentualSla),
    mttrH: num(r.mttrHoras),
    reincid: pct(r.taxaReincidencia),
    satisf: num(r.satisfacao, 2),
    abertos: r.chamadosEmAberto,
    backlogEvo: r.backlogEvolutivas.quantidade,
  }
}

console.log(`\nBase fictícia: ${chamados.length} chamados até ${agora.toLocaleString('pt-BR')}\n`)
console.table([
  linha('Todos', chamados),
  ...FORNECEDORES.map((f) => linha(f.nome, chamados.filter((c) => c.fornecedorId === f.id))),
])

console.log('\nPor sistema de RH')
console.table(SISTEMAS_RH.map((s) => linha(s.nome, chamados.filter((c) => c.sistemaId === s.id))))

console.log('\nTipos:', {
  incidente: chamados.filter((c) => c.tipo === 'incidente').length,
  requisicao: chamados.filter((c) => c.tipo === 'requisicao').length,
  evolutiva: chamados.filter((c) => c.tipo === 'evolutiva').length,
})

const estourosAlfa = chamados.filter((c) => c.fornecedorId === 'alfa' && c.sla?.cumprido === false)
const estourosAlfaNoFechamento = estourosAlfa.filter((c) =>
  estaNaJanelaDeFechamento(c.abertoEm, CALENDARIO_UTIL, DIAS_ELEVACAO_FECHAMENTO),
)
console.log(
  `\nAlfa: ${estourosAlfaNoFechamento.length} de ${estourosAlfa.length} estouros na semana de fechamento (${pct(
    estourosAlfaNoFechamento.length / estourosAlfa.length,
  )})`,
)

const evolutivasGama = chamados.filter((c) => c.fornecedorId === 'gama')
console.log('\nBacklog de evolutivas da Gama no fim de cada mês')
console.table(
  listarMeses(chamados.at(0)!.abertoEm, agora).map((mes) => {
    const fim = new Date(Math.min(new Date(mes.getFullYear(), mes.getMonth() + 1, 0, 23, 59).getTime(), agora.getTime()))
    return { mes: mes.toLocaleDateString('pt-BR', { month: 'short' }), backlog: backlogEvolutivas(evolutivasGama, fim).quantidade }
  }),
)

const porDiaDaSemana = [0, 1, 2, 3, 4, 5, 6].map(
  (dia) => chamados.filter((c) => c.sistemaId === 'ponto' && c.abertoEm.getDay() === dia).length,
)
console.log('\nPonto por dia da semana (dom→sáb):', porDiaDaSemana.join(' · '))

const folhaAbertos = chamados.filter((c) => c.sistemaId === 'folha')
console.log(`Folha em aberto agora: ${chamadosEmAberto(folhaAbertos, agora)}`)
console.log(`Chamados de hoje: ${chamados.filter((c) => c.abertoEm >= comHora(agora, 0)).length}\n`)

const abertos = chamados.filter((c) => c.emAberto && c.sla)
console.log(
  'Em aberto por status de SLA:',
  Object.fromEntries(['no-prazo', 'em-risco', 'estourado'].map((s) => [s, abertos.filter((c) => c.sla!.status === s).length])),
  '| pausados:',
  abertos.filter((c) => c.sla!.pausado).length,
)
