# Acesso por e-mail nos dois domínios

## Implementado e verificado
- E-mail/senha ativado no Lovable Cloud; Google desativado. Confirmação de e-mail permanece ativa (configuração hospedada consultada).
- `/auth`: Entrar, Criar conta, recuperação por e-mail. Senhas de pelo menos 8 caracteres; cadastro não presume uma sessão antes da confirmação.
- Links de confirmação: `window.location.origin + '/auth'`.
- Links de recuperação: `window.location.origin + '/reset-password'`.
- `/reset-password`: valida link/sessão de recuperação, define a senha sem `current_password`, e segue para `/inicio`.
- Contas Google existentes: usar “Esqueci minha senha” com o mesmo e-mail para definir a senha da conta existente, sem criar outra conta.
- Nenhuma tabela ou regra de RLS foi alterada. Os arquivos gerados em `src/integrations` não foram editados manualmente.
- A revisão de publicação, arquivos e pendências atuais está em `DEPLOY_INDEPENDENTE.md`.

## Configuração externa pendente
As ferramentas disponíveis nesta sessão não permitem consultar ou alterar **Site URL** ou **Redirect URLs**. Esses valores não foram alterados nem verificados.

Na configuração de URLs da autenticação do Lovable Cloud:
- **Site URL:** `https://basefyseller.vercel.app`
- Adicionar **Redirect URL:** `https://basefyseller.vercel.app/**`
- Manter as URLs Lovable já existentes, incluindo `https://basefyseller.lovable.app/**` e a URL da prévia quando aplicável.
- Manter a confirmação de e-mail ativa.

Na Vercel, manter as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do mesmo projeto Lovable Cloud. Não usar chave privada no navegador. Não foi realizado deploy na Vercel nesta tarefa.

## Testes executados
- Vitest: 19 testes passaram (9 de autenticação, 9 de precificação, 1 de roteamento).
- Navegador local, sem respostas simuladas: botão Começar agora abre `/auth`; credenciais incorretas retornam mensagem em português; senha de 7 caracteres é rejeitada; formulário de recuperação abre; link expirado mostra aviso e botão de retorno; sessão real existente vai para `/inicio` e permanece após recarregar.
- Tela de acesso em 390 × 844: sem estouro horizontal; nenhum erro de execução observado.
- Compilação automática: build OK.

## Ainda não testado
Cadastro com confirmação entregue por e-mail e recuperação completa com link recebido em uma caixa real, incluindo alteração de senha. Nenhuma senha de usuário existente foi alterada para testar. Os fluxos publicados nos domínios Lovable/Vercel permanecem sem verificação até configurar os redirecionamentos e atualizar as publicações.