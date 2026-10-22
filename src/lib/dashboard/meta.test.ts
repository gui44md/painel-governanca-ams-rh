import { describe, expect, it } from 'vitest'
import { metaDoCampo, metaParaCampo, situacaoMeta, unidadeDaMeta } from './meta'

describe('situacaoMeta', () => {
  it('maior é melhor (SLA)', () => {
    expect(situacaoMeta('sla', 0.96, 0.95)).toEqual({ tom: 'no-prazo', texto: 'Meta 95,0% · atingida' })
    expect(situacaoMeta('sla', 0.92, 0.95)?.tom).toBe('em-risco')
    expect(situacaoMeta('sla', 0.85, 0.95)?.tom).toBe('estourado')
  })

  it('menor é melhor (reincidência)', () => {
    expect(situacaoMeta('reincidencia', 0.08, 0.1)?.tom).toBe('no-prazo')
    expect(situacaoMeta('reincidencia', 0.31, 0.1)?.tom).toBe('estourado')
  })

  it('satisfação usa a escala de 1 a 5', () => {
    expect(situacaoMeta('satisfacao', 3.9, 4)).toEqual({ tom: 'em-risco', texto: 'Meta 4,0 · perto' })
  })

  it('sem valor ou sem meta, não há situação', () => {
    expect(situacaoMeta('sla', null, 0.95)).toBeNull()
    expect(situacaoMeta('sla', 0.9, null)).toBeNull()
  })
})

describe('campo de meta', () => {
  it('mostra percentuais em 0–100 com vírgula', () => {
    expect(metaParaCampo('sla', 0.95)).toBe('95')
    expect(metaParaCampo('reincidencia', 0.125)).toBe('12,5')
    expect(metaParaCampo('satisfacao', 4)).toBe('4')
    expect(metaParaCampo('sla', null)).toBe('')
  })

  it('lê o campo de volta para o valor interno', () => {
    expect(metaDoCampo('sla', '95')).toBe(0.95)
    expect(metaDoCampo('reincidencia', '12,5')).toBe(0.125)
    expect(metaDoCampo('mttr', '24')).toBe(24)
    expect(metaDoCampo('sla', '')).toBeNull()
    expect(metaDoCampo('sla', 'abc')).toBeNull()
  })

  it('informa a unidade', () => {
    expect(unidadeDaMeta('sla')).toBe('%')
    expect(unidadeDaMeta('mttr')).toBe('h')
    expect(unidadeDaMeta('volume')).toBe('')
  })
})
