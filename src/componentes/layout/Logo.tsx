import { useState } from 'react'
import { AREA_SISTEMA, CAMINHO_LOGO, EXIBIR_LOGO, NOME_SISTEMA } from '@/config/projeto'

/**
 * Logo oficial (public/logo-mrs.svg, versão amarela da Sala de Imprensa)
 * exibida sem alterações, direto sobre o menu azul.
 * Se o arquivo não existir ou a logo estiver desativada, mostra só o nome.
 */
export function Logo() {
  const [falhouAoCarregar, setFalhouAoCarregar] = useState(false)
  const exibirImagem = EXIBIR_LOGO && !falhouAoCarregar

  return (
    <div className="flex flex-col gap-3">
      {exibirImagem && (
        <img
          src={CAMINHO_LOGO}
          alt="MRS Logística"
          className="h-12 w-auto max-w-full self-start object-contain"
          onError={() => setFalhouAoCarregar(true)}
        />
      )}
      <div className="leading-tight">
        <p className="text-[15px] font-bold text-white">{NOME_SISTEMA}</p>
        <p className="text-xs font-semibold tracking-wide text-destaque uppercase">{AREA_SISTEMA}</p>
      </div>
    </div>
  )
}
