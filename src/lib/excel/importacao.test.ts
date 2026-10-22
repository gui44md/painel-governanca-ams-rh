import { describe, expect, it } from 'vitest'
import { FORNECEDORES, SISTEMAS_RH } from '@/config/catalogo'
import { criarChamado } from '../teste/fabrica'
import { dataParaSerial, lerDataHora, serialParaData } from './datas-excel'
import { camposObrigatoriosFaltando, normalizarCabecalho, sugerirMapeamento } from './mapeamento'
import { fraseResumo, incorporarChamados, validarLinhas, type ContextoValidacao } from './validacao'

describe('datas do Excel', () => {
  it('converte serial ↔ data local sem deslocar fuso', () => {
    const data = new Date(2026, 9, 3, 8, 15)
    expect(dataParaSerial(data)).toBeCloseTo(46298.34375)
    expect(serialParaData(46298.34375)).toEqual(data)
  })

  it('lê textos em formato brasileiro e ISO', () => {
    expect(lerDataHora('03/10/2026 08:15')).toEqual(new Date(2026, 9, 3, 8, 15))
    expect(lerDataHora('3/10/2026')).toEqual(new Date(2026, 9, 3))
    expect(lerDataHora('2026-10-03T08:15:00')).toEqual(new Date(2026, 9, 3, 8, 15))
  })

  it('rejeita datas impossíveis e valores estranhos', () => {
    expect(lerDataHora('31/09/2026 10:00')).toBeNull()
    expect(lerDataHora('03/10/2026 25:00')).toBeNull()
    expect(lerDataHora('ontem')).toBeNull()
    expect(lerDataHora(12)).toBeNull()
    expect(lerDataHora(null)).toBeNull()
  })
})

describe('mapeamento de colunas', () => {
  it('normaliza cabeçalhos', () => {
    expect(normalizarCabecalho(' Nº Chamado ')).toBe('n chamado')
    expect(normalizarCabecalho('Dt. Abertura:')).toBe('dt abertura')
  })

  it('reconhece o modelo e os nomes usados pelos fornecedores', () => {
    const mapeamento = sugerirMapeamento([
      'Nº Chamado',
      'Assunto',
      'Dt Abertura',
      'Dt Fechamento',
      'Criticidade',
      'Sistema',
      'Situação',
      'Tipo',
      'Nota',
      'Coluna extra',
    ])
    expect(mapeamento).toEqual({
      id: 0,
      titulo: 1,
      abertura: 2,
      resolucao: 3,
      prioridade: 4,
      sistema: 5,
      status: 6,
      tipo: 7,
      satisfacao: 8,
      fornecedor: null,
      reaberto: null,
    })
    expect(camposObrigatoriosFaltando(mapeamento)).toEqual([])
  })

  it('aponta campos obrigatórios sem coluna', () => {
    const faltando = camposObrigatoriosFaltando(sugerirMapeamento(['ID do chamado', 'Título']))
    expect(faltando.map((c) => c.campo)).toEqual(['tipo', 'sistema', 'prioridade', 'abertura', 'status'])
  })
})

describe('validarLinhas', () => {
  const CABECALHO = [
    'ID do chamado',
    'Tipo',
    'Título',
    'Sistema de RH',
    'Fornecedor',
    'Prioridade',
    'Data e hora de abertura',
    'Data e hora de resolução',
    'Status',
    'Reaberto',
    'Nota de satisfação',
  ]
  const mapeamento = sugerirMapeamento(CABECALHO)
  const contexto: ContextoValidacao = {
    idsExistentes: new Set(['INC-2026-0001']),
    agora: new Date(2026, 9, 27, 17),
    sistemas: SISTEMAS_RH,
    fornecedores: FORNECEDORES,
    nomeArquivo: 'teste.xlsx',
  }
  const valida = ['INC-2026-0900', 'Incidente', 'Erro no holerite', 'Folha de Pagamento', 'Alfa Sistemas', 'P2', '03/10/2026 08:15', '03/10/2026 11:40', 'Resolvido', 'Não', '4']
  const com = (indice: number, valor: unknown) => valida.map((v, i) => (i === indice ? valor : v))
  const erros = (linha: unknown[]) => validarLinhas([linha], mapeamento, contexto).linhas[0]!.problemas

  it('uma linha correta vira um chamado novo', () => {
    const { linhas, resumo } = validarLinhas([valida], mapeamento, contexto)
    expect(linhas[0]!.problemas).toEqual([])
    expect(linhas[0]!.situacao).toBe('novo')
    expect(linhas[0]!.chamado).toMatchObject({
      id: 'INC-2026-0900',
      tipo: 'incidente',
      sistemaId: 'folha',
      fornecedorId: 'alfa',
      prioridade: 'P2',
      abertoEm: new Date(2026, 9, 3, 8, 15),
      resolvidoEm: new Date(2026, 9, 3, 11, 40),
      satisfacao: 4,
    })
    expect(resumo).toMatchObject({ total: 1, validas: 1, novos: 1, ignorados: 0 })
  })

  it('aceita datas como número serial do Excel', () => {
    expect(erros(com(6, 46298.34375))).toEqual([])
  })

  it('ID existente na base é atualizado', () => {
    expect(validarLinhas([com(0, 'INC-2026-0001')], mapeamento, contexto).linhas[0]!.situacao).toBe('atualizado')
  })

  it.each([
    [6, '31/09/2026 10:00', 'abertura', 'Data inválida: use dd/mm/aaaa hh:mm.'],
    [5, 'Urgente', 'prioridade', 'Prioridade desconhecida: use P1, P2, P3 ou P4.'],
    [3, 'Folha Pagto', 'sistema', 'Sistema não cadastrado.'],
    [1, 'Problema', 'tipo', 'Tipo desconhecido: use Incidente, Requisição ou Evolutiva.'],
    [2, '', 'titulo', 'Campo obrigatório.'],
    [7, '02/10/2026 10:00', 'resolucao', 'Resolução anterior à abertura.'],
    [6, '30/10/2026 10:00', 'abertura', 'Data no futuro.'],
    [8, 'Fechado', 'status', 'Status desconhecido: use Aberto, Em atendimento, Aguardando usuário ou Resolvido.'],
  ])('coluna %i = %j gera erro em %s', (indice, valor, campo, mensagem) => {
    expect(erros(com(indice, valor))).toContainEqual({ campo, nivel: 'erro', mensagem })
  })

  it('detecta ID duplicado na planilha', () => {
    const { linhas, resumo } = validarLinhas([valida, valida], mapeamento, contexto)
    expect(linhas[1]!.problemas).toContainEqual({
      campo: 'id',
      nivel: 'erro',
      mensagem: 'ID duplicado na planilha (também na linha 2).',
    })
    expect(resumo).toMatchObject({ validas: 1, comErro: 1, ignorados: 1 })
  })

  it('resolvido exige data de resolução', () => {
    expect(erros(com(7, ''))).toContainEqual({
      campo: 'resolucao',
      nivel: 'erro',
      mensagem: 'Chamado resolvido sem data de resolução.',
    })
  })

  it('alertas não impedem a importação', () => {
    const linha = com(4, '')
    linha[10] = '7'
    const resultado = validarLinhas([linha], mapeamento, contexto)
    expect(resultado.linhas[0]!.problemas.map((p) => [p.campo, p.nivel])).toEqual([
      ['fornecedor', 'alerta'],
      ['satisfacao', 'alerta'],
    ])
    expect(resultado.linhas[0]!.chamado).toMatchObject({ fornecedorId: 'alfa', satisfacao: null })
    expect(resultado.resumo.comAlerta).toBe(1)
  })

  it('avisa quando o fornecedor não sustenta o sistema', () => {
    expect(erros(com(4, 'Beta Tech'))).toContainEqual({
      campo: 'fornecedor',
      nivel: 'alerta',
      mensagem: 'O sistema é sustentado pela Alfa Sistemas.',
    })
  })

  it('aceita sinônimos de prioridade, status e tipo', () => {
    const linha = [...valida]
    linha[1] = 'requisicao'
    linha[5] = 'Alta'
    linha[8] = 'Em atendimento'
    linha[7] = ''
    const { linhas } = validarLinhas([linha], mapeamento, contexto)
    expect(linhas[0]!.chamado).toMatchObject({ tipo: 'requisicao', prioridade: 'P2', resolvidoEm: null })
    expect(linhas[0]!.chamado!.historico.map((e) => e.estado)).toEqual(['aberto', 'em-atendimento'])
  })

  it('ignora linhas totalmente vazias e numera pela planilha', () => {
    const { linhas } = validarLinhas([[null, '', null], valida], mapeamento, contexto)
    expect(linhas).toHaveLength(1)
    expect(linhas[0]!.numero).toBe(3)
  })
})

describe('incorporarChamados', () => {
  it('substitui IDs existentes e acrescenta os novos, em ordem de abertura', () => {
    const base = [
      criarChamado({ id: 'A', abertoEm: new Date(2026, 9, 1) }),
      criarChamado({ id: 'B', abertoEm: new Date(2026, 9, 5) }),
    ]
    const importados = [
      criarChamado({ id: 'B', titulo: 'Atualizado', abertoEm: new Date(2026, 9, 5) }),
      criarChamado({ id: 'C', abertoEm: new Date(2026, 9, 3) }),
    ]
    const resultado = incorporarChamados(base, importados)
    expect(resultado.map((c) => c.id)).toEqual(['A', 'C', 'B'])
    expect(resultado.find((c) => c.id === 'B')?.titulo).toBe('Atualizado')
  })
})

describe('fraseResumo', () => {
  it('resume a importação no formato do conceito, com plural correto', () => {
    expect(fraseResumo({ novos: 412, atualizados: 8, ignorados: 3 })).toBe(
      '412 chamados novos, 8 atualizados, 3 ignorados por erro',
    )
    expect(fraseResumo({ novos: 1, atualizados: 1, ignorados: 1 })).toBe('1 chamado novo, 1 atualizado, 1 ignorado por erro')
  })
})
