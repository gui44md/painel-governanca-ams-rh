# Painel de Governança AMS – Sistemas RH

Conceito do sistema · 21/10/2026 · Guilherme

> Projeto conceitual com dados 100% fictícios, criado para o processo seletivo de Estágio em Tecnologia da Informação – Sistemas RH da MRS Logística. Não é um sistema oficial da empresa.

## 1. Visão geral

O Painel de Governança AMS é um sistema web que simula a rotina da área de TI – Sistemas RH: acompanhar os fornecedores de AMS (Application Management Services) que sustentam os sistemas corporativos de RH, medir se eles cumprem os SLAs contratados, identificar problemas nos dados e transformar isso em planos de ação.

O contexto é a MRS Logística, concessionária da Malha Sudeste, com sede em Juiz de Fora, que administra 1.643 km de ferrovia em Minas Gerais, Rio de Janeiro e São Paulo. Uma operação desse porte depende de sistemas de RH funcionando sem falhas: folha, ponto de equipes em escala, benefícios e treinamentos obrigatórios de segurança. Quando um desses sistemas falha, o impacto chega a milhares de colaboradores.

**Pergunta central que o sistema responde:** os fornecedores de AMS estão entregando o que o contrato prevê? Onde está o problema e o que vamos fazer sobre ele?

## 2. Relação com a vaga

| Atividade da vaga | Onde aparece no sistema |
| --- | --- |
| Acompanhar fornecedores de AMS, indicadores, SLAs e planos de ação | Visão geral, Fornecedores, Plano de ação |
| Elaborar e atualizar dashboards e relatórios gerenciais | Construtor de dashboards e exportação para Excel |
| Controlar chamados, incidentes, requisições e evolutivas | Tela de Chamados |
| Documentar processos e fluxos | Detalhe do chamado (histórico) e fluxo de atendimento |
| Reuniões com fornecedores e registro de ações | Plano de ação (ata e responsáveis) |
| Levantamento de requisitos e análise de impacto | Chamados do tipo Evolutiva, com campo de impacto |
| Testes funcionais, validação e homologação | Aba de Homologação |
| Automação e melhoria contínua | Motor de SLA automático, alertas de risco e detecção de reincidência |
| Análise de dados para tomada de decisão | Insights destacados e construtor de dashboards |
| Excel avançado e Power BI (desejáveis) | Importação e exportação de planilhas compatíveis com Excel e Power BI |

## 3. Cenário fictício

**Sistemas de RH acompanhados**

- Folha de Pagamento
- Ponto Eletrônico (inclui equipes de operação em escala)
- Benefícios
- Recrutamento e Seleção
- Treinamentos e SST (Saúde e Segurança do Trabalho)
- Portal do Colaborador

**Fornecedores de AMS (nomes inventados)**

- Alfa Sistemas: sustentação de Folha e Benefícios
- Beta Tech: sustentação de Ponto Eletrônico e Portal do Colaborador
- Gama Consultoria: sustentação de Recrutamento e Treinamentos

**Tipos de chamado:** Incidente, Requisição e Evolutiva (melhoria).

**Período simulado:** 6 meses, com cerca de 600 chamados.

**Exemplos de chamados realistas**

- "Erro no cálculo de adicional noturno na folha de outubro"
- "Batidas de ponto não sincronizadas no terminal de Juiz de Fora"
- "Colaborador sem acesso ao holerite no Portal"
- "Evolutiva: incluir novo benefício de auxílio-creche"
- "Certificado de treinamento de segurança não registrado no histórico"

## 4. Princípio de design: 100% visual

O sistema deve ser entendido olhando, não lendo. Regras:

- Cada tela abre com números grandes (cards de KPI) e gráficos; tabelas ficam abaixo, como detalhe.
- Status sempre com cor + ícone + texto curto (nunca só cor), para acessibilidade.
- Barras de prazo de SLA em cada chamado, mostrando visualmente quanto do tempo já foi consumido.
- Insights aparecem como cartões de destaque com uma frase e um botão "Ver detalhes".
- Nenhum bloco de texto longo na interface. Explicações ficam em tooltips.
- Animações sutis na entrada de gráficos e cards, sem exagero.
- Totalmente responsivo: desktop, tablet e celular.

## 5. Identidade visual MRS

### Logo

- Usar a logo oficial da MRS Logística, obtida em fonte oficial da empresa (site institucional ou material de imprensa), sem alterar proporções, cores ou forma.
- Posição: canto superior esquerdo do menu lateral, com respiro adequado ao redor.
- Ao lado ou abaixo da logo, o nome do sistema: "Painel de Governança AMS – Sistemas RH".
- No rodapé, aviso fixo e discreto: "Projeto conceitual com dados fictícios, desenvolvido para processo seletivo. Não é um sistema oficial da MRS Logística."
- Uso restrito à demonstração na entrevista. Não publicar o sistema com a logo em sites abertos ou redes sociais sem autorização da empresa.

### Cores

A marca da MRS usa um azul escuro como cor principal e tons de amarelo como destaque. Os códigos abaixo são aproximações e devem ser conferidos com a logo oficial antes do desenvolvimento.

| Papel | Cor | Uso |
| --- | --- | --- |
| Primária | Azul MRS escuro (aprox. `#00305E`) | Menu lateral, cabeçalhos, botões principais |
| Destaque | Amarelo MRS (aprox. `#FFC20E`) | Item de menu ativo, destaques, linha do gráfico principal |
| Fundo | Cinza muito claro (`#F4F6F9`) | Fundo das telas |
| Superfície | Branco (`#FFFFFF`) | Cards e tabelas |
| Texto | Grafite (`#1F2933`) | Texto principal |

### Cores de status (separadas da marca)

Como o amarelo é cor da marca, o status "em risco" usa laranja, para não confundir destaque com alerta.

| Status | Cor | Ícone |
| --- | --- | --- |
| No prazo | Verde (`#1E9E5A`) | Check |
| Em risco (80% do prazo) | Laranja (`#E8730C`) | Relógio |
| SLA estourado | Vermelho (`#D64545`) | Alerta |
| Concluído | Cinza azulado (`#64748B`) | Arquivo |

**Tipografia:** sans-serif limpa e legível (ex.: Inter ou Roboto), até confirmar a fonte institucional. Números dos KPIs em peso forte e tamanho grande.

**Elementos gráficos:** referências discretas à ferrovia, como uma linha fina em amarelo que lembra trilhos no topo dos cards ou uma linha do tempo em formato de trilho no histórico do chamado. Sutil, sem virar decoração excessiva.

## 6. Estrutura de telas

Menu lateral fixo (recolhível no celular) com 7 seções:

1. Visão geral
2. Chamados
3. Fornecedores
4. Plano de ação
5. Homologação
6. Construtor de dashboards
7. Importar / Exportar Excel

Filtros globais no topo: período, sistema de RH e fornecedor. Ao mudar um filtro, todas as telas se atualizam.

### 6.1 Visão geral

- 5 cards de KPI: % de SLA cumprido, chamados abertos, MTTR (tempo médio de resolução), taxa de reincidência e backlog de evolutivas.
- Cada card com seta de tendência comparando com o mês anterior.
- Gráfico de linha: SLA cumprido por mês, com linha de meta (ex.: 95%).
- Gráfico de barras: chamados por sistema de RH.
- Cartão de insight em destaque: "Beta Tech cumpre 94% do SLA, mas 31% dos chamados de Ponto Eletrônico reabrem em até 15 dias." Botão "Investigar" leva à tela de Fornecedores já filtrada.
- Alerta de calendário de RH: "Fechamento da folha em 3 dias: 4 chamados de Folha em aberto."

### 6.2 Chamados

- Lista com filtros por tipo, prioridade, status, sistema e fornecedor, além de busca por texto.
- Cada linha: ID, título, sistema, fornecedor, prioridade (etiqueta colorida) e barra de prazo do SLA.
- Alternância entre visualização em tabela e em quadro kanban (Aberto, Em atendimento, Aguardando usuário, Resolvido).
- Detalhe do chamado em painel lateral: descrição, linha do tempo de status, tempo consumido do SLA, se é reincidente (com link para o chamado original) e, para evolutivas, campos de requisito e análise de impacto.

### 6.3 Fornecedores

- Um card por fornecedor com SLA, MTTR, reincidência, satisfação dos usuários (nota fictícia de 1 a 5) e volume de chamados.
- Gráfico de radar comparando os 3 fornecedores nos mesmos indicadores.
- Gráfico de dispersão "Velocidade x Qualidade": eixo X = % no prazo, eixo Y = reincidência. Deixa claro que cumprir prazo não é o mesmo que resolver bem.
- Ranking de causas mais recorrentes por fornecedor.

### 6.4 Plano de ação

- Ações em quadro kanban (A fazer, Em andamento, Concluída) ou lista.
- Cada ação: título, indicador relacionado, fornecedor, responsável, prazo e status.
- Possibilidade de criar uma ação direto de um insight ou de um indicador ruim.
- Registro de reunião simples: data, participantes, decisões e ações geradas.
- Exemplos pré-carregados: "Reunião de causa raiz com Beta Tech sobre sincronismo de ponto", "Revisar critério de encerramento de chamados no contrato", "Homologar correção do terminal de ponto de Juiz de Fora".

### 6.5 Homologação

- Lista de correções e evolutivas aguardando validação.
- Para cada uma: roteiro de casos de teste (passo, resultado esperado, resultado obtido, aprovado ou reprovado).
- Barra de progresso da homologação e decisão final: liberar para produção ou devolver ao fornecedor.
- Exemplo: teste da correção do cálculo de adicional noturno, com 5 casos (horário comum, virada de dia, feriado, escala 12x36, afastamento).

## 7. Construtor de dashboards

Seção onde o usuário monta seu próprio painel, como faria no Power BI, mas de forma simples e visual.

**Como funciona**

1. O usuário clica em "Novo dashboard" e dá um nome (ex.: "Reunião mensal com Beta Tech").
2. Uma galeria de widgets aparece à esquerda: card de KPI, gráfico de linha, barras, pizza/rosca, tabela, medidor (gauge) de meta e cartão de texto.
3. O usuário arrasta o widget para uma grade e, ao soltar, abre um painel de configuração:
   - **Indicador:** SLA cumprido, MTTR, volume de chamados, reincidência, satisfação, backlog.
   - **Agrupar por:** mês, sistema de RH, fornecedor, prioridade ou tipo de chamado.
   - **Filtro:** opcional, por fornecedor, sistema ou período.
   - **Meta:** valor opcional para desenhar linha de referência.
4. A pré-visualização atualiza na hora, com os dados fictícios.
5. Widgets podem ser redimensionados, movidos, duplicados e excluídos.
6. O dashboard é salvo e aparece na lista "Meus dashboards".

**Recursos extras**

- Modelos prontos: "Reunião mensal com fornecedor", "Visão executiva para gestão" e "Acompanhamento de fechamento de folha". O usuário começa de um modelo e ajusta.
- Modo apresentação: tela cheia, sem menus, ideal para reunião.
- Exportar dashboard: como imagem (PNG) ou os dados dos widgets em Excel.

**Por que isso importa para a vaga:** a área elabora e atualiza dashboards e relatórios gerenciais o tempo todo. Mostrar que você entende o que é um bom indicador, como agrupá-lo e para quem ele serve vale mais do que só ter um dashboard fixo.

## 8. Importação e exportação de Excel

### 8.1 Importação

Permite carregar uma planilha de chamados (como a que um fornecedor de AMS envia mensalmente) e incorporá-la ao sistema.

**Fluxo em 4 passos visuais (stepper)**

1. **Enviar arquivo:** área de arrastar e soltar para .xlsx ou .csv, com botão "Baixar planilha modelo".
2. **Mapear colunas:** o sistema lê o cabeçalho e sugere a correspondência automaticamente (ex.: "Dt Abertura" → Data de abertura). O usuário confirma ou ajusta por listas suspensas.
3. **Validar dados:** pré-visualização das primeiras linhas, com contagem de linhas válidas, alertas e erros. Erros destacados em vermelho na célula, com explicação (data inválida, prioridade desconhecida, ID duplicado, sistema não cadastrado).
4. **Confirmar:** resumo do que será importado ("412 chamados novos, 8 atualizados, 3 ignorados por erro"). Após confirmar, todos os indicadores e dashboards se atualizam.

**Colunas da planilha modelo**

| Coluna | Exemplo |
| --- | --- |
| ID do chamado | INC-2026-0458 |
| Tipo | Incidente / Requisição / Evolutiva |
| Título | Erro no cálculo de adicional noturno |
| Sistema de RH | Folha de Pagamento |
| Fornecedor | Alfa Sistemas |
| Prioridade | P1 / P2 / P3 / P4 |
| Data e hora de abertura | 03/10/2026 08:15 |
| Data e hora de resolução | 03/10/2026 11:40 |
| Status | Resolvido |
| Reaberto | Sim / Não |
| Nota de satisfação | 1 a 5 |

**Arquivos de exemplo incluídos:** 2 planilhas fictícias para a demonstração, uma limpa e outra com erros propositais, para mostrar a validação funcionando na frente da gestora.

### 8.2 Exportação

- Relatório mensal de SLA em Excel, com abas separadas: Resumo (KPIs por fornecedor), Chamados (base completa filtrada), SLA por mês e Plano de ação.
- Cabeçalhos formatados, colunas ajustadas, filtros já ativados e cores de status nas células.
- Exportação da tela atual com os filtros aplicados ("exportar o que estou vendo").
- Base estruturada pronta para ser usada como fonte em Power BI.

## 9. Indicadores e regras de cálculo

**SLA contratado fictício** (horário útil, seg. a sex., 8h às 18h; P1 conta 24x7)

| Prioridade | Exemplo | 1ª resposta | Solução |
| --- | --- | --- | --- |
| P1 Crítica | Folha não processa | 30 min | 4 h |
| P2 Alta | Ponto não sincroniza em uma unidade | 1 h | 8 h úteis |
| P3 Média | Erro em relatório de benefícios | 4 h | 24 h úteis |
| P4 Baixa | Ajuste de texto no Portal | 8 h | 40 h úteis |

**Regras do motor de SLA**

- Calcula automaticamente prazo, tempo consumido e status de cada chamado.
- "Em risco" ao atingir 80% do prazo; "estourado" acima de 100%.
- O tempo em "Aguardando usuário" pausa o relógio do SLA.
- Regra de RH: chamados de Folha de Pagamento abertos nos 5 dias que antecedem o fechamento sobem uma prioridade automaticamente.

**Indicadores**

- **% SLA cumprido:** chamados resolvidos no prazo ÷ total resolvidos.
- **MTTR:** média do tempo entre abertura e resolução.
- **Taxa de reincidência:** chamados reabertos ou repetidos (mesmo sistema e mesma causa em até 15 dias) ÷ total.
- **Backlog:** chamados e evolutivas em aberto, com idade média.
- **Satisfação:** média das notas de 1 a 5.
- **Aderência ao plano de ação:** ações concluídas no prazo ÷ total de ações.

## 10. Dados fictícios e o insight plantado

Os dados são gerados por um script, com padrões realistas: mais chamados de Folha perto do fechamento, mais chamados de Ponto em segundas-feiras e após trocas de escala.

**Insight principal plantado:** a Beta Tech tem o melhor SLA dos três fornecedores, mas a pior reincidência em Ponto Eletrônico. A explicação nos dados: chamados encerrados rapidamente com contorno paliativo, sem correção da causa. É isso que a demonstração revela.

**Insights secundários:**

- Alfa Sistemas estoura SLA principalmente na semana de fechamento da folha (problema de capacidade em picos).
- Backlog de evolutivas da Gama Consultoria cresce há 3 meses (risco para melhorias planejadas em Recrutamento).

## 11. Arquitetura técnica

| Camada | Tecnologia | Motivo |
| --- | --- | --- |
| Interface | React + TypeScript + Vite | Padrão de mercado, tipagem segura |
| Estilo | Tailwind CSS | Consistência com os tokens da identidade visual |
| Gráficos | Recharts | Gráficos responsivos e animados |
| Construtor de dashboards | react-grid-layout | Arrastar, soltar e redimensionar widgets |
| Excel | SheetJS (xlsx) | Leitura e geração de .xlsx no navegador |
| Estado | Zustand | Estado global simples para filtros e dados |
| Persistência | localStorage | Salvar dashboards e importações sem back-end |
| Testes | Vitest | Testes do motor de SLA e dos cálculos de indicadores |
| Publicação | Vercel ou GitHub Pages, com repositório no GitHub | Link para demonstração |

**Organização do código:** cálculos (SLA, indicadores, reincidência) ficam em funções puras separadas da interface, com testes automatizados. Isso deixa o sistema confiável e fácil de explicar.

## 12. Usabilidade e acessibilidade (IHC)

- **Visibilidade do status:** barras de SLA, indicadores de carregamento e mensagens de sucesso na importação.
- **Prevenção de erros:** validação antes de importar e confirmação antes de excluir.
- **Reconhecimento em vez de memorização:** filtros sempre visíveis, rótulos claros, modelos prontos de dashboard.
- **Consistência:** mesmas cores, ícones e componentes em todas as telas.
- **Acessibilidade:** contraste adequado (WCAG AA), navegação por teclado, status nunca indicados só por cor.
- **Responsividade:** menu recolhível, cards empilhados e tabelas viram lista no celular.

## 13. Roteiro de demonstração (5 minutos)

1. **Abertura (30s):** "Me coloquei no lugar de estagiário da área, acompanhando os fornecedores de AMS dos sistemas de RH."
2. **Visão geral (1 min):** o SLA parece bom, mas o cartão de insight aponta a reincidência da Beta Tech.
3. **Investigação (1 min):** Fornecedores → gráfico Velocidade x Qualidade → Chamados filtrados de Ponto Eletrônico reincidentes.
4. **Ação (1 min):** criar uma ação no Plano de ação e mostrar a homologação da correção.
5. **Ferramentas da área (1 min):** importar a planilha com erros (validação funcionando), montar um widget no construtor e exportar o relatório em Excel.
6. **Fechamento (30s):** o que eu faria nos primeiros meses e como esse raciocínio se aplica ao dia a dia real da área.

## 14. Fases de desenvolvimento

1. **Base:** identidade visual (cores, tipografia, logo), layout com menu e filtros globais.
2. **Dados e motor de SLA:** gerador de dados fictícios, cálculos de indicadores e testes.
3. **Telas principais:** Visão geral, Chamados e Fornecedores.
4. **Ação:** Plano de ação e Homologação.
5. **Excel:** importação com validação e exportação de relatórios.
6. **Construtor de dashboards:** galeria de widgets, configuração, modelos e modo apresentação.
7. **Acabamento:** responsividade, acessibilidade, animações e revisão do roteiro de demonstração.

## 15. Cuidados

- Todos os dados, chamados, fornecedores e números são fictícios.
- O sistema não representa processos, contratos ou ferramentas reais da MRS.
- A logo é usada apenas para contextualizar a demonstração e com aviso de projeto não oficial.
- Antes da entrevista, estudar cada indicador para conseguir explicar como foi calculado e por que importa.
