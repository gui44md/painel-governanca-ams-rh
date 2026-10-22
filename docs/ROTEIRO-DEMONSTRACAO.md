# Roteiro de demonstração (5 minutos)

Roteiro da seção 13 do conceito, com os cliques e os números que aparecem na tela. Os dados são fictícios e determinísticos: com a demonstração restaurada, os números são sempre estes.

## Antes de começar

1. Abra o sistema no Chrome, em tela cheia (F11), e feche outras abas.
2. No menu lateral, clique em **Restaurar demonstração**: desfaz qualquer ensaio anterior.
3. Deixe aberta em outra aba a planilha `public/exemplos/chamados-fornecedor-outubro-com-erros.xlsx` (ou tenha o arquivo à mão para arrastar).
4. Confira se a logo aparece no menu (arquivo `public/logo-mrs.svg`).

---

## 1. Abertura (30 s)

> "Me coloquei no lugar de estagiário da área, acompanhando os fornecedores de AMS dos sistemas de RH: folha, ponto, benefícios, recrutamento, treinamentos e portal. São 6 meses de chamados fictícios, cerca de 640, com três fornecedores."

Tela: **Visão geral**.

## 2. Visão geral (1 min)

Mostre, de cima para baixo:

| O que aparece | Número | O que dizer |
| --- | --- | --- |
| Alerta de calendário de RH | Fechamento em 3 dias, 7 chamados de Folha abertos | "O sistema cruza o calendário de RH com os chamados. Perto do fechamento, chamado de Folha sobe de prioridade automaticamente." |
| SLA cumprido | 93,1% | "No geral, o SLA parece bom." |
| Reincidência | 18,0% | "Mas quase 1 em cada 5 chamados volta." |
| **Insight em destaque** | *Beta Tech cumpre 97% do SLA, mas 31% dos chamados de Ponto Eletrônico reabrem em até 15 dias* | "Esse insight não está escrito na tela: ele é calculado a partir dos dados." |

Clique em **Investigar**.

## 3. Investigação (1 min)

Tela: **Fornecedores**, já com a Beta Tech em destaque.

1. Card da Beta: **SLA 97%**, mas **reincidência 26%**; o card avisa *31% de reincidência em Ponto Eletrônico, apesar do SLA*.
2. Gráfico **Velocidade x Qualidade**: o ponto *Ponto* fica sozinho na zona amarela, "rápido, mas o problema volta".
   > "Cumprir prazo não é o mesmo que resolver bem."
3. Ranking de causas: a 1ª da Beta é **Sincronismo de terminal de ponto**, com 38 reincidentes.
4. Clique em **Ver 73 chamados reincidentes**: abre a tela de Chamados filtrada.
5. Abra o primeiro chamado (*Batidas de ponto não sincronizadas no terminal de Juiz de Fora*):
   - *Repete o chamado INC-2026-0376* (mesmo sistema e causa em até 15 dias);
   - SLA **em risco · 81%**;
   - clique no chamado original: a solução foi **contorno paliativo**, "Causa raiz não tratada".
   > "A explicação está nos dados: a Beta encerra rápido com contorno, sem corrigir a causa."

## 4. Ação (1 min)

1. Tela **Plano de ação**: em *Sugestões a partir dos dados*, clique em **Criar ação** no insight da Beta. O formulário já vem preenchido (título, indicador Reincidência, Beta Tech, Ponto Eletrônico, prazo de 14 dias). Informe o responsável e salve.
2. Mostre a ata **Reunião mensal com Beta Tech – outubro**: decisões e ações geradas (causa raiz, critério de encerramento no contrato, homologar a correção).
3. Tela **Homologação**, item *Correção do cálculo de adicional noturno*:
   - 3 de 5 casos já aprovados;
   - aprove ao vivo **Escala 12x36** e **Afastamento**;
   - **Liberar para produção** fica disponível só agora; confirme.
   - Se perguntarem sobre reprovação: o item *Correção definitiva do sincronismo do terminal de Juiz de Fora* tem um caso reprovado e só permite **Devolver ao fornecedor**, com justificativa obrigatória.

## 5. Ferramentas da área (1 min)

1. Tela **Importar / Exportar Excel**: arraste a planilha **com erros**.
   - **Mapear colunas**: as 11 colunas "do fornecedor" (Nº Chamado, Dt Abertura, Criticidade, Situação...) são reconhecidas sozinhas.
   - **Validar dados**: 23 válidas, 2 com alerta, **7 com erro**, destacados na célula (data 31/09, prioridade "Urgente", ID duplicado, sistema "Ponto Mobile"...).
   - **Confirmar**: *18 chamados novos, 5 atualizados, 7 ignorados por erro*. Os indicadores de todas as telas se atualizam.
2. Tela **Construtor de dashboards**: abra *Reunião mensal com Beta Tech*. Arraste um **Medidor de meta** da galeria: a configuração abre sozinha. Mostre o **modo apresentação**.
3. Volte ao Excel e clique em **Baixar relatório (.xlsx)**: abas Resumo, Chamados, SLA por mês e Plano de ação, com cores de status e filtros.

## 6. Fechamento (30 s)

Sugestão do que dizer sobre os primeiros meses na área:

- **Validar os indicadores com o time**: confirmar as regras de SLA do contrato real, a janela de reincidência e o que conta como resolvido.
- **Automatizar o que hoje é manual**: a consolidação mensal das planilhas dos fornecedores e o relatório de SLA.
- **Reuniões com fornecedor guiadas por dados**: além do SLA, acompanhar reincidência e causa raiz.
- **Documentar processos e fluxos**: critérios de homologação, encerramento de chamados e o calendário de RH.

---

## Para estudar antes da entrevista

Explique cada indicador com a fórmula e o porquê (detalhes em [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md)):

| Indicador | Fórmula | Por que importa |
| --- | --- | --- |
| % SLA cumprido | Resolvidos no prazo ÷ resolvidos | Mede o cumprimento do contrato |
| MTTR | Média de (resolução − abertura), em horas | Mede a rapidez real, independente do prazo |
| Reincidência | Reabertos ou repetidos em 15 dias ÷ total | Mede se o problema foi resolvido de verdade |
| Backlog de evolutivas | Melhorias não entregues, com idade média | Mostra risco para melhorias planejadas |
| Satisfação | Média das notas de 1 a 5 | Percepção do usuário de RH |
| Aderência ao plano | Ações concluídas no prazo ÷ total | Mede se a gestão cumpre o que combina |

### Perguntas prováveis

- **"Como o SLA é calculado?"** Horário útil (seg. a sex., 8h às 18h, sem feriados); P1 conta 24x7. O relógio pausa em "Aguardando usuário". Em risco a partir de 80% do prazo.
- **"Por que evolutivas não têm SLA?"** São melhorias com data de entrega negociada; misturá-las ao SLA de incidentes distorceria o indicador. Elas aparecem no backlog.
- **"Como você sabe que é reincidência?"** Chamado reaberto, ou novo chamado com mesmo sistema e mesma causa raiz aberto até 15 dias depois da resolução do anterior.
- **"Os números são confiáveis?"** Os cálculos estão em funções puras, separadas da interface, com mais de 250 testes automatizados. Os insights da demonstração também são testados.
- **"Por que não usar só o Power BI?"** A exportação gera a base pronta para o Power BI; o sistema mostra o raciocínio de governança (regras de SLA, reincidência, plano de ação, homologação), que o Power BI sozinho não define.
