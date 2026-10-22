import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DATA_REFERENCIA } from '@/config/referencia'
import { criarHomologacoesIniciais } from '@/dados/homologacoes-iniciais'
import {
  adicionarCaso as adicionarCasoPuro,
  decidirHomologacao,
  reabrirHomologacao,
  registrarResultado as registrarResultadoPuro,
} from '@/lib/homologacao'
import { reviverDatas } from '@/lib/persistencia'
import type { CasoTeste, DecisaoHomologacao, Homologacao } from '@/tipos/homologacao'
import { useChamados } from './chamados'

interface EstadoHomologacao {
  homologacoes: Homologacao[]
  registrarResultado: (id: string, casoId: string, alteracao: Partial<Pick<CasoTeste, 'resultado' | 'obtido'>>) => void
  adicionarCaso: (id: string, passo: string, esperado: string) => void
  /** Lança erro se a decisão não for permitida (ex.: liberar com caso reprovado). */
  decidir: (id: string, decisao: Exclude<DecisaoHomologacao, 'pendente'>, observacao: string) => void
  reabrir: (id: string) => void
  restaurarExemplos: () => void
}

const iniciais = () => criarHomologacoesIniciais(useChamados.getState().chamados)

/** Homologações em andamento e decididas, salvas no navegador (localStorage). */
export const useHomologacao = create<EstadoHomologacao>()(
  persist(
    (set) => {
      const alterar = (id: string, transformar: (h: Homologacao) => Homologacao) =>
        set((estado) => ({ homologacoes: estado.homologacoes.map((h) => (h.id === id ? transformar(h) : h)) }))

      return {
        homologacoes: iniciais(),
        registrarResultado: (id, casoId, alteracao) => alterar(id, (h) => registrarResultadoPuro(h, casoId, alteracao)),
        adicionarCaso: (id, passo, esperado) => alterar(id, (h) => adicionarCasoPuro(h, passo, esperado)),
        decidir: (id, decisao, observacao) =>
          alterar(id, (h) => decidirHomologacao(h, decisao, observacao, DATA_REFERENCIA)),
        reabrir: (id) => alterar(id, reabrirHomologacao),
        restaurarExemplos: () => set({ homologacoes: iniciais() }),
      }
    },
    {
      name: 'painel-ams:homologacao',
      version: 1,
      storage: createJSONStorage(() => localStorage, { reviver: reviverDatas }),
      partialize: ({ homologacoes }) => ({ homologacoes }),
    },
  ),
)
