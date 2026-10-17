# Roadmap
- [ ] Preparar arquivos do repositório e Vercel, revisar login e testar os fluxos existentes; documentar pendências externas sem publicar automaticamente.
- [x] Acelerar navegação: reutilizar validação de identidade e quiz por 30 segundos, antecipar páginas do menu e remover espera mínima/animação da troca; 20 testes passaram.
- [x] Banner contínuo com as sete capas enviadas, 87% mais leves: imagens, movimento, pausa e ausência de estouro verificados em 394, 820 e 1280 px.
- [ ] Medir menus com a conta real após o quiz — a sessão disponível ainda está em /onboarding; não alterar respostas pessoais para testar.
- [x] Trocar Google por e-mail/senha e adicionar recuperação: 19 testes passaram; senha incorreta, link expirado e sessão existente verificados no navegador.
- [ ] Configurar Site URL e Redirect URLs no Lovable Cloud para os dois domínios — bloqueado: as ferramentas disponíveis não expõem essas configurações; confirmar cadastro e recuperação com e-mails reais depois disso.
- [ ] Preparar publicação independente no Vercel com login por e-mail, testes e DEPLOY_INDEPENDENTE.md (Google foi removido).
- [x] Área de Conteúdo: capítulos do guia dentro do app (leitor de páginas)
- [x] Perfil editável (nome, bio) e link de vendedor com compartilhamento rápido (em Configurações)
- [ ] Botão Sair no topo do celular e foto de perfil enviada pelo usuário
- [ ] Fase 2: análise de produto, criador de anúncio, atendimento, jornada, realtime, privacidade/termos

## Feito (17/out)
- Quiz de boas-vindas (nome, apelido, idade, objetivo, nível) com tela final "E aí! Pronto para começar?"; obrigatório na 1ª entrada, salvo na conta (settings.onboarded) e testado no celular.
- Login por e-mail/senha substitui Google sem alterar usuários, dados ou regras de acesso; confirmação de e-mail ativa e Google desativado no Lovable Cloud.

## Pendente
- Botão "Sair" no topo do celular.
- Foto de perfil enviada pelo usuário (hoje vem do Google).
