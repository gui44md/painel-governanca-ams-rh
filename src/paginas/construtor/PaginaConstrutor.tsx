import { useSearchParams } from 'react-router-dom'
import { EditorDashboard } from '@/componentes/dashboard/EditorDashboard'
import { ListaDashboards } from '@/componentes/dashboard/ListaDashboards'
import { useAvisos } from '@/store/avisos'
import { useDashboards } from '@/store/dashboards'

/** Construtor de dashboards (CONCEITO.md, seção 7). O dashboard aberto fica na URL. */
export default function PaginaConstrutor() {
  const [parametros, setParametros] = useSearchParams()
  const dashboards = useDashboards((s) => s.dashboards)
  const criar = useDashboards((s) => s.criar)
  const avisar = useAvisos((s) => s.avisar)

  const abertoId = parametros.get('dashboard')
  const aberto = dashboards.find((d) => d.id === abertoId)
  const abrir = (id: string | null) => setParametros(id ? { dashboard: id } : {})

  if (aberto) return <EditorDashboard key={aberto.id} dashboard={aberto} aoVoltar={() => abrir(null)} />

  return (
    <ListaDashboards
      dashboards={dashboards}
      aoAbrir={abrir}
      aoCriar={(nome, opcoes) => {
        const id = criar(nome, opcoes)
        avisar(`Dashboard "${nome.trim()}" criado.`)
        abrir(id)
      }}
    />
  )
}
