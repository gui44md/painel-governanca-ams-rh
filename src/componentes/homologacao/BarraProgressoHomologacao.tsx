import { cx } from '@/lib/classes'
import type { ProgressoHomologacao } from '@/lib/homologacao'

interface BarraProgressoHomologacaoProps {
  progresso: ProgressoHomologacao
  /** Mostra o texto com as contagens abaixo da barra. */
  comLegenda?: boolean
  className?: string
}

/**
 * Barra segmentada: aprovados (verde), reprovados (vermelho) e pendentes
 * (cinza), separados por um vão de 2px. A legenda em texto dá as contagens.
 */
export function BarraProgressoHomologacao({ progresso, comLegenda = false, className }: BarraProgressoHomologacaoProps) {
  const { total, executados, aprovados, reprovados, pendentes } = progresso
  const largura = (n: number) => `${total ? (n / total) * 100 : 0}%`
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <div
        role="progressbar"
        aria-label="Casos de teste executados"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={executados}
        aria-valuetext={`${executados} de ${total} casos executados: ${aprovados} aprovados, ${reprovados} reprovados`}
        className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full"
      >
        {aprovados > 0 && <span className="h-full bg-no-prazo" style={{ width: largura(aprovados) }} />}
        {reprovados > 0 && <span className="h-full bg-estourado" style={{ width: largura(reprovados) }} />}
        {pendentes > 0 && <span className="h-full flex-1 bg-grade" />}
      </div>
      {comLegenda && (
        <p className="text-xs text-texto-suave">
          <strong className="text-texto">
            {executados} de {total}
          </strong>{' '}
          casos executados · {aprovados} aprovados · {reprovados} reprovados
        </p>
      )}
    </div>
  )
}
