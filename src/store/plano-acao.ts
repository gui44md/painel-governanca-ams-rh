import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DATA_REFERENCIA } from '@/config/referencia'
import { criarPlanoInicial } from '@/dados/plano-acao-inicial'
import { proximoId } from '@/lib/identificadores'
import { reviverDatas } from '@/lib/persistencia'
import {
  moverAcao as moverAcaoPura,
  registrarReuniao as registrarReuniaoPura,
  type DadosReuniao,
  type RascunhoAcao,
} from '@/lib/plano-acao'
import type { Acao, Reuniao, StatusAcao } from '@/tipos/plano-acao'

interface EstadoPlano {
  acoes: Acao[]
  reunioes: Reuniao[]
  /** Cria a ação e devolve o ID. O rascunho já deve estar validado. */
  criarAcao: (rascunho: RascunhoAcao) => string
  atualizarAcao: (id: string, rascunho: RascunhoAcao) => void
  moverAcao: (id: string, status: StatusAcao) => void
  excluirAcao: (id: string) => void
  registrarReuniao: (dados: DadosReuniao) => string
  excluirReuniao: (id: string) => void
  restaurarExemplos: () => void
}

/** "Agora" da simulação: datas de criação e conclusão ficam coerentes com os dados. */
const agora = () => DATA_REFERENCIA

function exigirPrazo(rascunho: RascunhoAcao): Date {
  if (!rascunho.prazo) throw new Error('A ação precisa de um prazo.')
  return rascunho.prazo
}

/** Plano de ação e atas de reunião, salvos no navegador (localStorage). */
export const usePlanoAcao = create<EstadoPlano>()(
  persist(
    (set, get) => ({
      ...criarPlanoInicial(),

      criarAcao: (rascunho) => {
        const id = proximoId('ACA', get().acoes.map((a) => a.id))
        const acao: Acao = {
          ...rascunho,
          id,
          titulo: rascunho.titulo.trim(),
          responsavel: rascunho.responsavel.trim(),
          prazo: exigirPrazo(rascunho),
          criadaEm: agora(),
          concluidaEm: rascunho.status === 'concluida' ? agora() : null,
        }
        set((estado) => ({ acoes: [...estado.acoes, acao] }))
        return id
      },

      atualizarAcao: (id, rascunho) =>
        set((estado) => ({
          acoes: estado.acoes.map((acao) =>
            acao.id === id
              ? moverAcaoPura(
                  {
                    ...acao,
                    ...rascunho,
                    status: acao.status,
                    titulo: rascunho.titulo.trim(),
                    responsavel: rascunho.responsavel.trim(),
                    prazo: exigirPrazo(rascunho),
                  },
                  rascunho.status,
                  agora(),
                )
              : acao,
          ),
        })),

      moverAcao: (id, status) =>
        set((estado) => ({
          acoes: estado.acoes.map((acao) => (acao.id === id ? moverAcaoPura(acao, status, agora()) : acao)),
        })),

      excluirAcao: (id) =>
        set((estado) => ({
          acoes: estado.acoes.filter((acao) => acao.id !== id),
          reunioes: estado.reunioes.map((r) => ({ ...r, acoesIds: r.acoesIds.filter((acaoId) => acaoId !== id) })),
        })),

      registrarReuniao: (dados) => {
        const resultado = registrarReuniaoPura(get().acoes, get().reunioes, dados, agora())
        set({ acoes: resultado.acoes, reunioes: resultado.reunioes })
        return resultado.reuniaoId
      },

      excluirReuniao: (id) => set((estado) => ({ reunioes: estado.reunioes.filter((r) => r.id !== id) })),

      restaurarExemplos: () => set(criarPlanoInicial()),
    }),
    {
      name: 'painel-ams:plano-acao',
      version: 1,
      storage: createJSONStorage(() => localStorage, { reviver: reviverDatas }),
      partialize: ({ acoes, reunioes }) => ({ acoes, reunioes }),
    },
  ),
)
