export const NOME_SISTEMA = 'Painel de Governança AMS'
export const AREA_SISTEMA = 'Sistemas RH'
export const NOME_COMPLETO_SISTEMA = `${NOME_SISTEMA} – ${AREA_SISTEMA}`

export const AVISO_PROJETO_FICTICIO =
  'Projeto conceitual com dados fictícios, desenvolvido para processo seletivo. Não é um sistema oficial da MRS Logística.'

/** Caminho da logo oficial, servida a partir de /public sem nenhuma alteração. */
export const CAMINHO_LOGO = `${import.meta.env.BASE_URL}logo-mrs.svg`

/** Permite publicar uma versão sem a logo (ver README, seção de publicação). */
export const EXIBIR_LOGO = import.meta.env.VITE_OCULTAR_LOGO !== 'true'
