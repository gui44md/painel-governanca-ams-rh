import { create } from 'zustand'

export type TomAviso = 'sucesso' | 'erro' | 'informacao'

export interface Aviso {
  id: number
  texto: string
  tom: TomAviso
}

interface EstadoAvisos {
  avisos: Aviso[]
  avisar: (texto: string, tom?: TomAviso) => void
  remover: (id: number) => void
}

const DURACAO_MS = 4500
let proximo = 1

/** Mensagens rápidas de confirmação ("Ação criada", "Planilha importada"...). */
export const useAvisos = create<EstadoAvisos>()((set, get) => ({
  avisos: [],
  avisar: (texto, tom = 'sucesso') => {
    const id = proximo++
    set((estado) => ({ avisos: [...estado.avisos, { id, texto, tom }] }))
    setTimeout(() => get().remover(id), DURACAO_MS)
  },
  remover: (id) => set((estado) => ({ avisos: estado.avisos.filter((aviso) => aviso.id !== id) })),
}))
