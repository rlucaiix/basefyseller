# Basefy Seller: plano de construção

O Planner de Precificação é a base do app (fórmulas, tabelas, fichas, meta, controle de vendas e fechamento). O guia "Como vender na Basefy" e o Manual Mestre servem de guia, e o Adendo Master define as regras obrigatórias.

## Visual
- Fundo quase preto, roxo da Basefy, texto branco/lilás, cartões com efeito de vidro e fonte Inter (como pede o manual).
- No computador: menu lateral. No celular: barra de navegação inferior, uma coluna e cartões no lugar de tabelas.

## Fase 1: base, conta e precificação (esta entrega)
1. **Lovable Cloud**: login por e-mail, recuperação de senha e páginas privadas. Cada conta vê só os próprios dados.
2. **Configurações**: taxa padrão de 4,99%, taxa de destaque de 7,49% e tarifa de R$ 1,00 paga pelo comprador (fica fora do lucro). Também exportação dos dados em JSON e exclusão da conta com confirmação.
3. **Produtos**: cadastro único (tipo produto/dinâmico/serviço, fornecedor, custo por unidade, custo por venda, preço da concorrência, meu preço). Todos os outros módulos usam este cadastro.
4. **Calculadora / Ficha de precificação**: comissão, valor recebido, lucro, margem, preço de equilíbrio (arredondado para cima), preço para um lucro desejado e preço para uma margem desejada. Ela também alterna entre comum e destaque, compara preços, aceita vírgula e avisa sobre prejuízo.
5. **Tabelas rápidas**: tabela de taxas e de preço mínimo, geradas pelas mesmas fórmulas do Planner.
6. **Vendas**: registro com uma "foto" do cálculo no momento da venda (preço, modalidade, taxa, custo, comissão, lucro). Status: registrada, concluída, cancelada ou reembolsada. Filtros por período, produto, modalidade e status.
7. **Meta do mês**: meta de lucro, vendas necessárias (arredondadas para cima), vendas por dia, acompanhamento semanal e histórico das metas.
8. **Fechamento do mês e Início**: faturamento, taxas, custos, lucro, ticket médio, produto campeão e progresso da meta, tudo calculado a partir das vendas reais. Quando ainda não há dados, aparece uma orientação no lugar dos números.
9. **Salvamento automático**: salva sozinho após a digitação e mostra o estado (Salvando, Salvo, Pendente ou Erro com botão de tentar de novo). Sem internet, as alterações ficam guardadas no aparelho e são enviadas quando a conexão volta. Vendas novas não duplicam.

## Fase 2 (próximas mensagens)
- Análise de produto (5 critérios de 0 a 2, com justificativas e alertas).
- Criador de anúncio (rascunho a partir do produto, checklist, copiar e marcar como publicado, respeitando as regras do guia).
- Conteúdo (ganchos, roteiros, legendas), modelos de atendimento e Minha jornada com progresso real.
- Sincronização ao vivo entre aparelhos e aviso de conflito de edição.
- Páginas de privacidade e termos.

## Detalhes técnicos
- Tabelas: profiles, settings, products, sales (com valores fixados no momento da venda, client_id único para não duplicar e version para controlar edições), monthly_goals e goal_weeks. Todas com GRANTs, RLS por auth.uid() e campos created_at e updated_at.
- Fórmulas centralizadas em `src/lib/pricing.ts`, com testes vitest. O teste obrigatório: R$ 14,90, custo de R$ 5,00 e taxa de 4,99% dão comissão de R$ 0,74 e lucro de R$ 9,16, e o cálculo se refaz com 7,49%.
- Dados lidos com TanStack Query, fila offline no localStorage e páginas privadas em `_authenticated/`.
- Sem integração com a Basefy, sem publicação automática e sem IA paga.
