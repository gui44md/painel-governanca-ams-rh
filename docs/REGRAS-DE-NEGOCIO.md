# Regras de negócio e decisões de cálculo

Este documento registra como cada número do painel é calculado e as decisões que o conceito deixava em aberto. Todas as regras estão em funções puras em `src/lib`, com testes no Vitest.

## Data de referência

O "agora" da simulação é fixo: **27/10/2026, 17h** (`src/config/referencia.ts`). Os dados cobrem de 01/05/2026 até essa data. Isso deixa indicadores, insights e alertas idênticos em toda demonstração.

## Motor de SLA (`src/lib/sla/motor.ts`)

| Regra | Implementação |
| --- | --- |
| Prazos por prioridade | Tabela da seção 9 em `src/config/sla.ts` |
| Horário útil | Seg. a sex., 8h às 18h, sem feriados nacionais. P1 conta 24x7 |
| Relógio | Corre em "Aberto" e "Em atendimento"; **pausa** em "Aguardando usuário"; **para** em "Resolvido" |
| Reabertura | O relógio volta a correr no mesmo chamado |
| Status | Abaixo de 80% do prazo: no prazo. De 80% a 100%: em risco. Acima de 100%: estourado. Resolvido: concluído |
| Cumprido | Chamado resolvido com tempo consumido ≤ prazo |
| Regra de RH | Chamados de Folha abertos nos **5 dias corridos** antes do fechamento (incluindo o dia) sobem uma prioridade |
| Fechamento da folha | Último dia útil do mês |
| Evolutivas | **Não têm SLA contratual**: são melhorias com data de entrega negociada, acompanhadas pelo backlog |

## Indicadores (`src/lib/indicadores.ts`)

| Indicador | Fórmula | Observação |
| --- | --- | --- |
| % SLA cumprido | Resolvidos no prazo ÷ resolvidos | Só incidentes e requisições |
| MTTR | Média de (resolução − abertura), em horas corridas | Só incidentes e requisições; inclui tempo pausado |
| Taxa de reincidência | Reincidentes ÷ incidentes e requisições | Ver regra abaixo |
| Chamados em aberto | Incidentes e requisições não resolvidos no instante | Indicador de estoque |
| Backlog de evolutivas | Evolutivas não entregues no instante, com idade média em dias | Indicador de estoque |
| Satisfação | Média das notas de 1 a 5 | Ignora quem não avaliou |
| Aderência ao plano de ação | Ações concluídas até o prazo ÷ total de ações | Usado na Fase 4 |

Indicadores de fluxo usam os chamados **abertos no período filtrado**. Indicadores de estoque olham o instante final do período.

## Reincidência (`src/lib/reincidencia.ts`)

Um incidente ou requisição é reincidente quando:

1. foi **reaberto** pelo usuário depois de resolvido; ou
2. **repete** um chamado anterior: mesmo sistema e mesma causa raiz, aberto até **15 dias** depois da resolução do anterior.

A causa raiz combina a categoria do problema, o local ou grupo afetado e a origem técnica registrada pelo fornecedor. A detecção roda sobre a base completa, antes dos filtros, para enxergar chamados anteriores ao período escolhido.

## Dados fictícios (`src/dados`)

- Gerados por `gerarBaseFicticia()` com semente fixa: a base é sempre a mesma.
- Cada chamado tem a própria semente, então ajustar um parâmetro em `perfis.ts` não embaralha a base inteira.
- O atendimento é simulado com o próprio motor de SLA, então prazos e históricos são coerentes por construção.
- `cenario-demonstracao.ts` adiciona chamados escritos à mão para o roteiro: a sequência do terminal de Juiz de Fora e os chamados de Folha às vésperas do fechamento.
- `npm run dados:resumo` mostra os números da base no terminal.

### Insights plantados (verificados em `gerador-chamados.test.ts`)

| Insight | Como foi plantado |
| --- | --- |
| Beta Tech tem o melhor SLA, mas a pior reincidência em Ponto | Resolve rápido, mas encerra 62% dos incidentes de Ponto com contorno paliativo; 60% deles voltam |
| Alfa Sistemas estoura SLA na semana de fechamento | Chance de estouro de 32% no fechamento contra 6% no resto do mês |
| Backlog de evolutivas da Gama cresce há 3 meses | A partir de agosto, a demanda de evolutivas sobe 60% e só 12% são entregues |
| Mais chamados de Ponto às segundas e após troca de escala | Fatores de 1,9× às segundas e 1,5× nos dias 1, 2, 16 e 17 |
| Mais chamados de Folha perto do fechamento | Fator de 2,4× na janela de fechamento |

## Telas (Fase 3)

### Visão geral

- **KPIs:** o número grande cobre o período filtrado. A **seta de tendência** compara o último mês do período com o mês anterior: SLA, MTTR e reincidência pelos chamados abertos em cada mês; abertos e backlog no fim de cada mês. A cor da seta indica se a mudança é boa ou ruim (subir SLA é bom; subir MTTR é ruim).
- **Insights** (`src/lib/insights.ts`, limiares em `src/config/insights.ts`), sempre calculados a partir dos dados:
  - *Reincidência oculta*: fornecedor com SLA ≥ 90% e um sistema (≥ 15 chamados) com reincidência ≥ 20%.
  - *Estouro no fechamento*: ≥ 60% dos estouros (mínimo de 5) na semana de fechamento da folha.
  - *Backlog crescente*: backlog de evolutivas maior a cada fim de mês, por 3 meses seguidos.
- **Alerta de calendário:** aparece a até 5 dias do fechamento da folha, se houver chamados de Folha em aberto.
- **SLA por mês:** a linha mostra sempre os 6 meses, para dar contexto de tendência; o período filtrado aparece como uma faixa amarela.

### Chamados

- Filtros locais (busca, tipo, prioridade, status, só reincidentes, ordenação), visão (tabela ou kanban), página e chamado aberto ficam **na URL**. Qualquer recorte vira um link.
- A prioridade exibida é a **efetiva** (com a seta ↑ quando subiu pela regra do fechamento).
- "Mais perto de estourar" ordena os abertos pela fração do prazo consumida.

### Fornecedores

- A comparação mostra **sempre os três fornecedores** (respeitando período e sistema). O fornecedor escolhido no filtro do topo fica **em destaque**, sem esconder os demais.
- **Radar:** escala comum de 0 a 100, maior é melhor. SLA e 1ª resposta = percentual; Qualidade = 100 − reincidência; Satisfação = nota de 1 → 0 a 5 → 100; Agilidade = menor MTTR vale 100.
- **Velocidade x Qualidade:** um ponto por sistema de RH (cor = fornecedor). A zona amarela é "rápido, mas o problema volta".

### Cores dos gráficos

- Cada fornecedor tem um matiz fixo (`--color-fornecedor-*`), validado para daltonismo em todos os pares e com contraste ≥ 3:1. As cores de status ficam reservadas para status.
- A linha principal usa o azul MRS: o amarelo da marca tem contraste de 1,6:1 sobre branco, abaixo do mínimo de 3:1 para elementos gráficos. O amarelo marca destaques (período filtrado, zona de atenção, ponto ativo).

## Plano de ação e Homologação (Fase 4)

### Plano de ação (`src/lib/plano-acao.ts`)

- **Aderência ao plano** segue a seção 9: ações concluídas até o prazo ÷ total de ações. Ações em aberto ainda dentro do prazo também contam no total, então a aderência só sobe quando as ações são entregues.
- **Situação do prazo** usa as mesmas cores e ícones do SLA: vence em mais de 3 dias = no prazo; até 3 dias = em risco; vencida = atrasada; concluída depois do prazo = "com atraso".
- **Sugestões**: cada insight e cada KPI que piorou contra o mês anterior vira uma ação pré-preenchida (título, indicador, fornecedor, sistema, prazo de 14 dias). A sugestão some da lista quando já existe uma ação com aquela origem.
- **Reunião**: as "novas ações" da ata viram ações *A fazer* com responsável *A definir* e prazo de 14 dias, ligadas à reunião.
- O filtro de fornecedor do topo vale para o plano; ações sem fornecedor (gerais) aparecem sempre.

### Homologação (`src/lib/homologacao.ts`)

- **Liberar para produção** só com **todos** os casos aprovados.
- **Devolver ao fornecedor** exige ao menos um caso reprovado e uma observação explicando o motivo.
- Depois da decisão, o roteiro fica bloqueado; "Reabrir" desfaz a decisão e mantém os resultados.
- Etapas: aguardando testes → em teste → pronta para decisão → liberada ou devolvida.

### Persistência

Ações, reuniões e homologações ficam no `localStorage` do navegador (`painel-ams:plano-acao` e `painel-ams:homologacao`). As datas são restauradas como `Date` na leitura. "Restaurar dados de exemplo" volta ao estado original da demonstração.

## Excel (Fase 5)

### Importação (`src/lib/excel`)

1. **Enviar arquivo:** .xlsx ou .csv (até 5 MB). CSV em UTF-8 ou Windows-1252, separado por `;` ou `,` (detectado automaticamente).
2. **Mapear colunas:** a primeira linha preenchida é o cabeçalho. Cada campo do modelo é comparado ao nome da coluna e a sinônimos comuns ("Nº Chamado", "Dt Abertura", "Criticidade", "Situação", "Empresa"...), em `src/config/excel.ts`. As correspondências exatas são atribuídas primeiro e cada coluna é usada uma vez.
3. **Validar dados:**

   | Problema | Gravidade |
   | --- | --- |
   | Campo obrigatório vazio; data inválida ou no futuro; prioridade, tipo, status ou sistema desconhecidos; ID duplicado na planilha; resolução antes da abertura; resolvido sem data de resolução | **Erro**: a linha é ignorada |
   | Fornecedor vazio (usa o responsável pelo sistema) ou diferente do responsável; nota fora de 1 a 5; "Reaberto" não reconhecido; ID fora do padrão; data de resolução com status em aberto | **Alerta**: a linha entra |

4. **Confirmar:** IDs que já existem **substituem** o chamado da base; os demais entram como novos. Todas as telas recalculam SLA, reincidência, KPIs e insights.

A planilha não traz o histórico completo. O chamado entra com abertura, status e resolução. "Aguardando usuário" é registrado no momento da importação, para não esconder tempo de SLA já consumido. Como não há causa raiz, a causa usada na reincidência é o próprio título.

Importações ficam no `localStorage` (`painel-ams:importacoes`) e podem ser desfeitas.

### Exportação

- **Relatório mensal de SLA:** abas Resumo, Chamados, SLA por mês e Plano de ação. Respeita os filtros do topo. Cabeçalho na cor da marca, larguras ajustadas, filtro do Excel ativado e cores de status: SLA ≥ meta verde; até 5 p.p. abaixo laranja; abaixo disso vermelho.
- **O que estou vendo:** na tela de Chamados, exporta exatamente a lista filtrada; na tela de Excel, o recorte dos filtros do topo.
- **Base para Power BI:** todos os chamados em tabela plana (.xlsx ou .csv com `;` e BOM).
- Datas são gravadas como data do Excel (sem deslocamento de fuso). A biblioteca de Excel só é carregada quando o usuário importa ou exporta.

### Planilhas de exemplo

`npm run planilhas:exemplo` gera, em `public/exemplos`, o relatório mensal fictício da Beta Tech com cabeçalhos "do fornecedor":

| Arquivo | Resultado esperado |
| --- | --- |
| `chamados-fornecedor-outubro.xlsx` | 24 novos, 6 atualizados, 0 erros |
| `chamados-fornecedor-outubro-com-erros.xlsx` | 18 novos, 5 atualizados, 7 ignorados por erro, 2 alertas |

O script valida as próprias planilhas e falha se o resultado mudar.

## Construtor de dashboards (Fase 6)

### Como os números são calculados (`src/lib/dashboard/agregacao.ts`)

- Cada widget usa **as mesmas funções de indicadores** das outras telas: um número no dashboard bate com a Visão geral.
- **Filtro do widget** (período, fornecedor, sistema) tem prioridade. Campo em "Seguir o filtro do topo" herda o filtro global, então um dashboard sem filtros próprios reage à barra do topo.
- **Agrupar por mês** usa os meses do período; o backlog é medido no fim de cada mês. Agrupar por sistema, com um fornecedor filtrado, mostra só os sistemas dele. A prioridade é a efetiva.
- **Meta**: linha de referência nos gráficos e cor (atingida / perto / abaixo) em cards, medidor e tabela. "Perto" = até 5% da escala (5 p.p. para percentuais; 0,25 na nota de satisfação). Indicadores "menor é melhor" (reincidência, MTTR) invertem a comparação.

### Regras de cada widget (`src/config/dashboards.ts`)

| Widget | Indicadores | Observação |
| --- | --- | --- |
| Card de KPI, Linha, Barras, Tabela | Todos | Barras agrupadas por fornecedor usam a cor fixa de cada um |
| Pizza / rosca | Só volume e backlog | Percentuais e médias não somam, então não fazem sentido em partes de um todo |
| Medidor de meta | SLA, reincidência, satisfação | Precisa de escala fechada (0–100% ou 1–5) |
| Cartão de texto | — | Pauta, checklist, observações |

### Uso

- Arrastar da galeria para a grade (ou clicar em +) cria o widget e abre a configuração; a grade e a pré-visualização atualizam a cada mudança.
- Mover pela alça (⋮⋮), redimensionar pelo canto, duplicar e excluir (com confirmação). Abaixo de 768 px de largura os widgets são empilhados.
- Modelos: *Reunião mensal com fornecedor* (pergunta o fornecedor), *Visão executiva para gestão* e *Acompanhamento de fechamento de folha*.
- Modo apresentação em tela cheia (Esc sai). Exporta PNG da grade (sem os botões de edição) e Excel (aba Resumo + uma aba por widget com agrupamento).
- Dashboards ficam no `localStorage` (`painel-ams:dashboards`). O exemplo *Reunião mensal com Beta Tech* já vem criado.
