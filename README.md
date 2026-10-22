# Painel de Governança AMS – Sistemas RH

> **Projeto conceitual com dados 100% fictícios**, desenvolvido para o processo seletivo de Estágio em TI – Sistemas RH da MRS Logística. **Não é um sistema oficial da MRS Logística.** Fornecedores, chamados, pessoas e números são inventados.

Sistema web que simula a rotina de TI – Sistemas RH: acompanhar os fornecedores de AMS (Application Management Services) que sustentam os sistemas de RH, medir se cumprem os SLAs, identificar problemas nos dados e transformar isso em plano de ação.

**Pergunta central:** os fornecedores de AMS estão entregando o que o contrato prevê? Onde está o problema e o que vamos fazer sobre ele?

**Demonstração online:** https://gui44md.github.io/painel-governanca-ams-rh/

O insight que a demonstração revela: a Beta Tech tem o melhor SLA (97%), mas 31% dos chamados de Ponto Eletrônico voltam em até 15 dias, porque são encerrados com contorno paliativo, sem corrigir a causa.

---

## Telas

| Tela | O que faz |
| --- | --- |
| **Visão geral** | 5 KPIs com tendência mês a mês, SLA por mês contra a meta, chamados por sistema, insight em destaque, alerta de fechamento da folha e chamados perto de estourar |
| **Chamados** | Busca e filtros, tabela ou kanban, barra de prazo do SLA em cada chamado e detalhe com linha do tempo, reincidência e análise de impacto (evolutivas) |
| **Fornecedores** | Card por fornecedor, radar comparativo, gráfico Velocidade x Qualidade e ranking de causas |
| **Plano de ação** | Ações em kanban ou lista, sugestões criadas a partir dos insights e indicadores, registro de reuniões com decisões e ações |
| **Homologação** | Roteiro de casos de teste, progresso, liberar para produção ou devolver ao fornecedor |
| **Construtor de dashboards** | Arrastar widgets para uma grade, configurar indicador, agrupamento, filtro e meta; modelos prontos, modo apresentação, exportação PNG e Excel |
| **Importar / Exportar Excel** | Importação em 4 passos com mapeamento automático e validação; relatório mensal de SLA, base para Power BI e planilha modelo |

Filtros globais (período, fornecedor, sistema de RH) no topo valem para todas as telas.

## Destaques técnicos

- **Motor de SLA** com horário útil, feriados, P1 24x7, pausa em "Aguardando usuário" e a regra de RH que sobe a prioridade da Folha perto do fechamento.
- **Cálculos em funções puras** (`src/lib`), separadas da interface, com **28 arquivos de teste e mais de 250 testes** no Vitest. Os insights da demonstração também são testados: se alguém mudar o gerador e quebrar a história, os testes acusam.
- **Insights calculados, não escritos**: as frases da tela vêm dos dados.
- **Dados fictícios determinísticos**: gerador com semente fixa, padrões sazonais (Folha no fechamento, Ponto às segundas) e um cenário roteirizado para a demonstração.
- **Acessibilidade**: status sempre com cor + ícone + texto, contraste WCAG AA verificado em teste, navegação por teclado, modais com foco controlado e fundo inerte. Auditado com axe-core (WCAG 2.1 AA) em todas as telas e estados: zero violações.
- **Responsivo** de 375 px a desktop: menu em gaveta, tabelas que viram cartões e dashboards empilhados no celular.
- **Leve**: cada tela carrega sob demanda; a biblioteca de Excel (~320 kB comprimidos) só é baixada ao importar ou exportar.

As regras de cálculo e as decisões de projeto estão em [docs/REGRAS-DE-NEGOCIO.md](docs/REGRAS-DE-NEGOCIO.md). A especificação original está em [docs/CONCEITO.md](docs/CONCEITO.md).

## Stack

| Camada | Tecnologia |
| --- | --- |
| Interface | React 19 + TypeScript + Vite |
| Estilo | Tailwind CSS 4 (cores da identidade como tokens) |
| Gráficos | Recharts |
| Construtor de dashboards | react-grid-layout |
| Excel | SheetJS (versão `xlsx-js-style`, que grava cores e formatação) |
| Estado | Zustand (com persistência em `localStorage`) |
| Rotas | React Router |
| Testes | Vitest |
| Ícones | Lucide |

---

## Como rodar

**Pré-requisito:** [Node.js](https://nodejs.org/) 22.12 ou superior.

```bash
npm install
```

```bash
npm run dev
```

Abra http://localhost:5173.

### Logo

A logo oficial não vem no repositório. Para exibi-la, salve em `public/logo-mrs.svg`, sem alterações, a versão amarela publicada na [Sala de Imprensa da MRS](https://www.mrs.com.br/sala-de-imprensa/) (`Logo-amarela.svg`); ela aparece direto sobre o menu azul. Sem o arquivo, o menu mostra só o nome do sistema.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Roda os testes uma vez |
| `npm run test:watch` | Testes em modo observação |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificação de tipos do TypeScript |
| `npm run build` | Typecheck + build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run dados:resumo` | Mostra no terminal os números da base fictícia e dos insights |
| `npm run planilhas:exemplo` | Gera e confere as 2 planilhas de exemplo em `public/exemplos/` |

### Auditoria de acessibilidade

Com `npm run dev` rodando, abra qualquer tela e rode no console do navegador:

```js
await auditarAcessibilidade()
```

A função aplica as regras WCAG 2.1 A/AA do axe-core e lista as violações (só existe em desenvolvimento).

### Dados e demonstração

- **"Agora" fixo**: a simulação vai de 01/05/2026 a 27/10/2026, 17h. Os números são os mesmos em qualquer dia.
- Ações, homologações, dashboards e importações ficam salvos **no navegador** (`localStorage`). Cada navegador tem os próprios dados.
- **Restaurar demonstração**, no rodapé do menu, volta tudo ao estado inicial.
- Roteiro de 5 minutos, com os cliques e os números esperados: [docs/ROTEIRO-DEMONSTRACAO.md](docs/ROTEIRO-DEMONSTRACAO.md).

### Estrutura

```
src/
├── config/      constantes de domínio: SLA, catálogo, cores, KPIs, widgets
├── tipos/       tipos de domínio (Chamado, Acao, Homologacao, Dashboard...)
├── lib/         regras puras + testes: SLA, indicadores, reincidência, insights,
│                Excel (mapeamento, validação, relatório), dashboards
├── dados/       gerador de dados fictícios, cenário da demonstração, exemplos
├── store/       estado global (Zustand) com persistência
├── hooks/       ligação entre stores, filtros e telas
├── componentes/ interface: ui, layout, gráficos, chamados, dashboard, excel...
└── paginas/     as 7 telas
scripts/         resumo dos dados e geração das planilhas de exemplo
docs/            conceito, regras de negócio e roteiro de demonstração
public/exemplos/ planilhas de exemplo (limpa e com erros)
.github/         workflow de publicação no GitHub Pages
```

---

## Publicação

O painel está publicado no **GitHub Pages**:

**https://gui44md.github.io/painel-governanca-ams-rh/**

O site público sai **sem a logo**: o arquivo `public/logo-mrs.svg` fica fora do repositório (`.gitignore`) e o build do Pages usa `VITE_OCULTAR_LOGO=true`. Assim o uso da logo continua restrito à demonstração local, como pede o conceito. A página também pede para buscadores não a indexarem.

### Como funciona

O workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) roda a cada `git push` na `main` (ou manualmente, em **Actions → Publicar no GitHub Pages → Run workflow**):

1. instala as dependências e roda `lint` e testes;
2. gera o build com `CAMINHO_BASE=/painel-governanca-ams-rh/`, o prefixo do site no Pages (`vite.config.ts` usa como `base` e o roteador como `basename`);
3. copia `index.html` para `404.html`, para que links diretos como `/chamados` abram a aplicação;
4. publica a pasta `dist`.

Para repetir em outro repositório: em **Settings → Pages**, escolha **Source: GitHub Actions**. No plano gratuito do GitHub, o Pages exige repositório público.

Para conferir o build do Pages na sua máquina (no PowerShell, defina antes `$env:CAMINHO_BASE = '/painel-governanca-ams-rh/'`; no Git Bash, prefixe `MSYS_NO_PATHCONV=1` para o caminho não ser convertido):

```bash
CAMINHO_BASE=/painel-governanca-ams-rh/ npm run build
```

```bash
CAMINHO_BASE=/painel-governanca-ams-rh/ npm run preview
```

### Alternativa: Vercel

Útil para manter o repositório privado. O `vercel.json` já faz todas as rotas abrirem a aplicação (SPA) e pede para buscadores não indexarem o site.

1. Entre em [vercel.com](https://vercel.com) com a conta do GitHub.
2. **Add New… → Project** e escolha o repositório.
3. A Vercel detecta **Vite** sozinha (build `npm run build`, saída `dist`). Não defina `CAMINHO_BASE`: na Vercel o site fica na raiz.
4. Em **Environment Variables**, adicione `VITE_OCULTAR_LOGO` = `true` para publicar sem a logo.
5. Clique em **Deploy**. A cada `git push` na `main`, a Vercel publica uma nova versão.

Para mostrar o sistema só a quem tiver o link certo, use **Settings → Deployment Protection** na Vercel (as opções variam conforme o plano).

---

## Limitações conhecidas

- Não há back-end: os dados ficam no navegador de quem usa.
- A planilha importada não traz o histórico de cada chamado; o chamado entra com abertura, status e resolução.
- Calendário de feriados fixo para 2026.

## Aviso

Projeto conceitual com dados fictícios, desenvolvido para processo seletivo. Não é um sistema oficial da MRS Logística. A logo, quando exibida, é usada apenas para contextualizar a demonstração.
