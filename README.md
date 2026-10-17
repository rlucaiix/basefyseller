# Basefyseller

Planner de precificação, produtos, vendas, metas e conteúdo guiado, com login por e-mail e senha e dados por conta no Lovable Cloud.

## Publicação independente

Consulte [DEPLOY_INDEPENDENTE.md](./DEPLOY_INDEPENDENTE.md) para conectar o repositório à Vercel preservando o banco e os usuários. A configuração está em `vercel.json` e `vite.vercel.config.ts`; os nomes das variáveis públicas estão em `.env.example`. Antes de enviar o repositório, conclua a revisão de `.gitignore` descrita no guia.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://basefyseller.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cc07b8fd-ee3a-4563-907b-4ba818e3a5f7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
