import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { CircleAlert } from 'lucide-react'
import { cx } from '@/lib/classes'

const CLASSES_ENTRADA =
  'w-full rounded-lg bg-superficie px-3 text-sm text-texto ring-1 ring-inset placeholder:text-texto-suave/80 hover:ring-primaria/40'

interface PropsCampo {
  rotulo: string
  /** Mensagem de validação; deixa o campo em vermelho e é lida pelo leitor de tela. */
  erro?: string
  dica?: string
  obrigatorio?: boolean
  className?: string
}

interface MolduraProps extends PropsCampo {
  children: (atributos: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string; className: string }) => ReactNode
}

/** Rótulo, dica e mensagem de erro em volta de qualquer campo de formulário. */
function MolduraCampo({ rotulo, erro, dica, obrigatorio, className, children }: MolduraProps) {
  const id = useId()
  const idAjuda = `${id}-ajuda`
  return (
    <div className={cx('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={id} className="text-xs font-medium text-texto-suave">
        {rotulo}
        {obrigatorio && <span className="text-estourado-texto"> *</span>}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(erro),
        'aria-describedby': erro || dica ? idAjuda : undefined,
        className: cx(CLASSES_ENTRADA, erro ? 'ring-2 ring-estourado' : 'ring-borda'),
      })}
      {erro ? (
        <p id={idAjuda} className="flex items-center gap-1 text-xs font-medium text-estourado-texto">
          <CircleAlert aria-hidden className="size-3.5 shrink-0" />
          {erro}
        </p>
      ) : (
        dica && (
          <p id={idAjuda} className="text-xs text-texto-suave">
            {dica}
          </p>
        )
      )}
    </div>
  )
}

export function CampoTexto({
  rotulo,
  erro,
  dica,
  obrigatorio,
  className,
  ...entrada
}: PropsCampo & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <MolduraCampo rotulo={rotulo} erro={erro} dica={dica} obrigatorio={obrigatorio} className={className}>
      {(atributos) => <input {...entrada} {...atributos} className={cx(atributos.className, 'h-10')} />}
    </MolduraCampo>
  )
}

export function CampoAreaTexto({
  rotulo,
  erro,
  dica,
  obrigatorio,
  className,
  ...entrada
}: PropsCampo & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <MolduraCampo rotulo={rotulo} erro={erro} dica={dica} obrigatorio={obrigatorio} className={className}>
      {(atributos) => <textarea rows={3} {...entrada} {...atributos} className={cx(atributos.className, 'py-2')} />}
    </MolduraCampo>
  )
}
