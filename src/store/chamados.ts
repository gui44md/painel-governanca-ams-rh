import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CONTEXTO_ANALISE, gerarBaseFicticia } from '@/dados/base-ficticia'
import { analisarChamados, type ChamadoAnalisado } from '@/lib/analise'
import { incorporarChamados } from '@/lib/excel/validacao'
import { reviverDatas } from '@/lib/persistencia'
import type { Chamado } from '@/tipos/chamado'

interface EstadoChamados {
  /** Chamados importados de planilhas (salvos no navegador). */
  importados: Chamado[]
  /** Base fictícia + importados (IDs importados substituem os da base). */
  chamados: Chamado[]
  /** Chamados com SLA e reincidência calculados; recalculado a cada mudança. */
  analisados: ChamadoAnalisado[]
  /** Incorpora chamados validados; todos os indicadores e telas se atualizam. */
  importar: (novos: readonly Chamado[]) => void
  desfazerImportacoes: () => void
}

const BASE = gerarBaseFicticia()

function montar(importados: Chamado[]) {
  const chamados = importados.length ? incorporarChamados(BASE, importados) : BASE
  return { importados, chamados, analisados: analisarChamados(chamados, CONTEXTO_ANALISE) }
}

/** Base de chamados da aplicação: fictícia + importações de planilhas (CONCEITO.md, seção 8.1). */
export const useChamados = create<EstadoChamados>()(
  persist(
    (set, get) => ({
      ...montar([]),
      importar: (novos) => set(montar(incorporarChamados(get().importados, novos))),
      desfazerImportacoes: () => set(montar([])),
    }),
    {
      name: 'painel-ams:importacoes',
      version: 1,
      storage: createJSONStorage(() => localStorage, { reviver: reviverDatas }),
      partialize: ({ importados }) => ({ importados }),
      // Ao carregar do navegador, recalcula a base com os importados salvos.
      merge: (salvo, atual) => ({ ...atual, ...montar((salvo as Partial<EstadoChamados>)?.importados ?? []) }),
    },
  ),
)
