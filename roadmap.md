# Roadmap
- [x] Melhorar resposta dos cliques sem alterar aparência ou segurança: isolar atualizações de dados do menu, antecipar páginas em momentos ociosos, priorizar imagens visíveis e eliminar transição da ampliação; seis trocas de menu e leitor verificados com sessão real, sem erros ou estouro; 56 testes passaram.
- [x] Reauditar imagens locais para GitHub/Vercel e usar IMG_0874.png como logo da página, favicon e ícone de atalho: 63 arquivos locais rastreados, HTTP 200 e SHA-256 conferidos em servidor independente, 56 imagens decodificadas e páginas públicas/conectadas verificadas; 56 testes passaram.
- [x] Implementar cadastro por chave de uso único e vínculo atômico permanente; sete contas legadas autorizadas e administrador configurado.
- [x] Implementar autorização de login, login seguro por chave e gestão administrativa; segurança revisada e validação limitada por chave, sem bloqueio global compartilhado, com limpeza de tickets expirados.
- [ ] Verificar transações e concorrência das chaves em ambiente isolado e cadastro com links reais — bloqueado: conexão de testes não possui acesso ao esquema de autenticação; confirmação de e-mail requer links recebidos. A conta conectada não é administradora; acesso restrito à gestão foi verificado.
- [x] Corrigir falta de variáveis na Vercel com fallback público compartilhado entre verificação e Vite; comando preservado, 14 testes passaram e configuração Vite recebeu os dois valores sem variáveis cadastradas; implantação real na Vercel permanece externa.
- [x] Auditar e materializar 51 imagens WebP e 7 PDFs atuais em public/assets, preservar favicon e corrigir referências; 59 arquivos validados com SHA-256 e HTTP 200 em servidor independente; 39 testes passaram. Fotos externas individuais permanecem como dados da conta, sem exportação de dados privados.
- [x] Reforçar lilás, gradientes e superfícies foscas; ampliar acessos rápidos e substituir pausa por Conteúdo no banner; verificado com conta conectada em 394, 820 e 1280 px, sem erros ou estouro.
- [x] Preparar configurações Vercel, exemplo de variáveis e guia DEPLOY_INDEPENDENTE.md; revisar sessão, menus, produto/venda e conteúdo com leitura após recarregar, sem publicar automaticamente.
- [x] Acelerar navegação: reutilizar validação de identidade e quiz por 30 segundos, antecipar páginas do menu e remover espera mínima/animação da troca; 20 testes passaram.
- [x] Banner contínuo com as sete capas enviadas, 87% mais leves: imagens, movimento, pausa e ausência de estouro verificados em 394, 820 e 1280 px.
- [x] Verificar os oito menus com a conta real após o quiz; todos abriram, sem erros de execução.
- [x] Trocar Google por e-mail/senha e adicionar recuperação: 19 testes passaram; senha incorreta, link expirado e sessão existente verificados no navegador.
- [ ] Configurar Site URL e Redirect URLs no Lovable Cloud para os dois domínios — bloqueado: as ferramentas disponíveis não expõem essas configurações; confirmar cadastro e recuperação com e-mails reais depois disso.
- [x] Preparar publicação independente no Vercel com login por e-mail, testes e DEPLOY_INDEPENDENTE.md (Google foi removido).
- [ ] Ajustar .gitignore no repositório — arquivo protegido no editor; padrões necessários documentados no guia.
- [ ] Conectar repositório e variáveis na Vercel; executar primeira compilação e teste publicado — exige acesso/configuração externa, sem publicação automática.
- [ ] Validar login por senha, confirmação e recuperação com e-mails reais — depende dos links recebidos pelo usuário e URLs hospedadas.
- [x] Área de Conteúdo: capítulos do guia dentro do app (leitor de páginas)
- [x] Perfil editável (nome, bio) e link de vendedor com compartilhamento rápido (em Configurações)
- [x] Botão Sair no topo do celular.

## Escopo futuro (não incluído na revisão de publicação)
- Foto de perfil enviada pelo usuário.
- Fase 2: análise de produto, criador de anúncio, atendimento, jornada, realtime, privacidade/termos.

## Feito (17/out)
- Quiz de boas-vindas (nome, apelido, idade, objetivo, nível) com tela final "E aí! Pronto para começar?"; obrigatório na 1ª entrada, salvo na conta (settings.onboarded) e testado no celular.
- Login por e-mail/senha substitui Google sem alterar usuários, dados ou regras de acesso; confirmação de e-mail ativa e Google desativado no Lovable Cloud.

