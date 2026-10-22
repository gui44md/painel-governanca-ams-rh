import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { roteador } from './rotas'
import './index.css'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('Elemento #root não encontrado em index.html')

// Só em desenvolvimento: `await auditarAcessibilidade()` no console do navegador.
if (import.meta.env.DEV) void import('./dev/auditoria-acessibilidade').then((m) => m.registrarAuditoria())

createRoot(raiz).render(
  <StrictMode>
    <RouterProvider router={roteador} />
  </StrictMode>,
)
