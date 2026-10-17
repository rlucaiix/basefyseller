# Basefy Seller — repositório e Vercel

## O que está preparado

O mesmo aplicativo usa o Lovable Cloud existente: não criar outro banco, importar usuários, executar migrações novamente ou editar `src/integrations`. Produtos, vendas, configurações, quiz e conteúdos continuam vinculados à mesma conta.

- `vite.config.ts`: prévia e publicação Lovable, preservadas.
- `vite.vercel.config.ts`: publicação independente com TanStack Start e Nitro, preset `vercel`.
- `vercel.json`: instalação reprodutível com Bun, comando `build:vercel` e saída `.vercel/output`.
- `.env.example`: nomes das duas variáveis públicas necessárias, sem credenciais.
- `scripts/check-deploy-env.mjs`: usa a conexão e chave públicas do projeto atual como fallback quando as variáveis faltam; bloqueia valores inválidos ou chaves privadas. A configuração Vite aplica o mesmo fallback para incorporá-lo ao aplicativo.
- `bun.lock`: manter no repositório para instalar as mesmas versões.
- Imagens e PDFs do site estão em `public/assets/`, com caminhos `/assets/...`. Não precisam de upload ou serviço de mídia externo na Vercel. O favicon usa `/assets/basefy-seller-icon-64.png`; o ícone Apple usa `/assets/basefy-seller-apple-touch-icon.png`; o manifesto define o nome Basefy Seller e os ícones de 192 e 512 pixels.
- `bun run check:assets` confere existência, nomes exatos e SHA-256 dos arquivos antes da compilação. Relatório completo em `AUDITORIA_ASSETS.md`.

## 1. Revisar o repositório antes de conectar

**Bloqueio do editor:** `.gitignore` é protegido nesta sessão e não pôde ser alterado. No repositório/localmente, acrescentar:

```gitignore
.vercel/
.env
.env.*
!.env.example
*.tsbuildinfo
```

Não enviar `.env`, credenciais, `node_modules`, `.vercel`, `.output` ou arquivos gerados de compilação. Arquivos já rastreados não deixam de ser rastreados apenas por entrarem no `.gitignore`: conferir a lista de arquivos no repositório antes da conexão. As chaves do navegador são públicas, mas nenhuma chave privada deve ser enviada.

## 2. Conectar à Vercel

1. Importar o repositório GitHub na Vercel; selecionar a raiz deste projeto.
2. Usar Node.js **22.x** (22.12 ou posterior), compatível com Vite 8, e Bun para instalação conforme `vercel.json`.
3. Manter Framework Preset **Other**, sem substituir pela configuração de um aplicativo Vite estático.
4. O projeto atual pode compilar sem cadastro manual dessas variáveis: há fallback público no código. Para sobrescrever o fallback, em Settings → Environment Variables, cadastrar para Production e, se desejado, Preview:
   - `VITE_SUPABASE_URL`: URL pública de conexão do Lovable Cloud existente, nunca a URL da prévia ou um endereço local.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: chave **pública** do mesmo projeto.
5. Manter Install Command `bun install --frozen-lockfile`, Build Command `bun run build:vercel`, Output Directory `.vercel/output`.
6. Reimplantar após mudar variáveis `VITE_*`: elas são incorporadas durante a compilação.

Não configurar chaves service-role ou privadas. Este app acessa os dados da conta pelo navegador, com as regras de acesso existentes. Não adicionar rewrites de todas as URLs para `index.html`: Nitro gera a função e o roteamento da Vercel, inclusive para acessos diretos e recarregamentos.

## 3. Autenticação nos dois domínios — pendência externa

O código de login é e-mail/senha, independente do login Google/Lovable. No cadastro, a confirmação retorna para o domínio onde a pessoa se cadastrou (`/auth`); na recuperação, retorna para `/reset-password` nesse mesmo domínio.

As ferramentas desta sessão não permitem consultar ou alterar Site URL e Redirect URLs. Antes de considerar os e-mails prontos para produção, a configuração hospedada precisa permitir:

- Site URL: `https://basefyseller.vercel.app`.
- Redirect URLs: `https://basefyseller.vercel.app/**` e `https://basefyseller.lovable.app/**`, mantendo também as prévias Lovable já permitidas.
- Confirmação de e-mail ativa; cadastro habilitado; nenhuma inscrição anônima.

As opções de e-mail disponíveis ficam em **More → Cloud → Users → Auth settings → Email**. Se os campos de URL não aparecerem na interface Cloud da sua conta, solicitar a configuração ao suporte Lovable; não há ferramenta disponível aqui para contornar essa limitação. Evitar permitir qualquer domínio com um curinga global.

Contas criadas anteriormente pelo Google permanecem no mesmo banco: usar “Esqueci minha senha” com o mesmo e-mail para definir uma senha; não criar uma segunda conta. Não alteramos senhas existentes durante os testes.

## 4. Comandos locais

```sh
bun install --frozen-lockfile
# As duas variáveis públicas são opcionais para o projeto conectado atual.
bun run check:deploy
bun run test
bun run build:vercel
```

`check:deploy` verifica os valores fornecidos ou o fallback público sem imprimi-los; não substitui a confirmação de conectividade, da chave correta ou das URLs de e-mail. O verificador isolado não carrega `.env`; a configuração Vite carrega os arquivos de ambiente do modo selecionado, prioriza as variáveis do ambiente e usa o fallback apenas para valores ausentes ou vazios. Nenhuma chave privada é usada. O comando `build:vercel` permanece igual.

## 5. Resultados da revisão de 17/10/2026

- Lovable Cloud: autenticação e banco respondendo normalmente.
- Navegador com sessão real: todos os oito destinos do menu abriram, conteúdo exibiu as páginas, sessão foi mantida e `/auth` redirecionou para `/inicio`.
- Corrigido retorno indevido para `/inicio` ao recarregar uma página privada: a hidratação inicial da sessão não cancela mais sua validação em andamento.
- Produto temporário criado, editado, salvo e lido novamente após recarregar.
- Venda temporária de R$ 14,90, custo R$ 5,00 e taxa 4,99%: comissão R$ 0,74 e lucro R$ 9,16 conferidos na interface após recarregar.
- Venda e produtos temporários excluídos pelo app; as exclusões foram conferidas. Nenhum exemplo foi mantido como dado real.
- Credenciais incorretas e link de recuperação expirado mostram mensagens claras em português.
- Tela de acesso em 394 × 674: sem estouro horizontal. Nenhum erro de execução observado nesses testes.
- Filas offline isoladas por conta; versão original persistida após mesclar edições/recarregar; dados antigos não são reenviados sob outra conta. Operações legadas sem dono explícito permanecem guardadas, mas não são reenviadas automaticamente.

## 6. O que ainda precisa ser validado fora desta sessão

### Verificação do endereço real em 17/10/2026, 20:45 UTC

`https://basefyseller.vercel.app` responde e as páginas `/`, `/auth` e `/reset-password` abrem. O acesso anônimo a `/calculadora` volta corretamente para `/auth`. Porém, a implantação atual não contém 20 dos 78 arquivos do inventário, incluindo logo, ícones, capítulos 7/8 e capas 7/8; `/manifest.webmanifest` retorna 404. Também foram observados erros React 520/422 no navegador. Esses arquivos estão presentes no código atual e passam a verificação local: sincronizar a versão atual e fazer uma nova implantação antes de repetir a auditoria. Não foi possível confirmar a versão/commit remoto ou executar a atualização porque nenhuma conexão Vercel/GitHub está disponível nesta sessão.

- Primeira compilação e execução **na Vercel**, depois de conectar o repositório e cadastrar as variáveis. A compilação Vercel não foi executada nesta sessão; a configuração foi preparada usando o preset do Nitro instalado.
- Login bem-sucedido com e-mail/senha digitados: a conta conectada foi testada com sua sessão existente, sem acessar ou alterar sua senha.
- Cadastro → recebimento → confirmação real por e-mail nos dois domínios.
- Esqueci minha senha → recebimento → link real → nova senha → login nos dois domínios. Não tratamos teste de link expirado como prova desse fluxo completo.
- Ajuste de `.gitignore` e revisão dos arquivos rastreados antes de enviar o repositório.

Não houve publicação automática, envio de e-mails de teste ou criação de outro banco. A migração `0004_cleanup_deleted_account_access.sql` remove autorizações e papéis quando a conta é excluída, preservando chaves consumidas e histórico; não altera as políticas de acesso. O cadastro preserva erros reais do serviço de e-mail, mesmo se a checagem adicional da chave falhar. Esta revisão cobre o aplicativo existente; não implementa funcionalidades futuras de análise de produtos, criador de anúncios, atendimento, jornada, realtime ou páginas jurídicas.