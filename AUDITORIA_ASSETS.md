# Auditoria de imagens — Basefy Seller

## Resultado

- 7 capas do banner, 44 páginas ilustradas do conteúdo e 7 PDFs originais copiados para `public/assets/`.
- Logo enviada `IMG_0874.png` preservada byte-for-byte em `public/assets/basefy-seller-logo.png`, substituindo apenas o B nos cabeçalhos público, de login e interno.
- Ícones derivados dessa mesma logo em 64, 180, 192 e 512 pixels; favicon e apple-touch-icon locais, com `public/manifest.webmanifest` para o atalho. Favicon antigo removido.
- 63 arquivos conferidos por tamanho e SHA-256; as 51 imagens WebP e os 7 PDFs originais permanecem sem recompressão ou mudança de aparência.
- Referências ativas do banner e conteúdo usam `/assets/` com os nomes e maiúsculas exatos.
- Logo BS é a imagem enviada; “Basefy Seller” continua como texto. Ícones de interface são SVGs gerados pelas bibliotecas locais, incluídos na compilação. Fundos são gradientes CSS, sem imagens externas.
- Os ponteiros históricos em `src/assets/module-banners/` não são mais importados ou usados pelo site; permanecem apenas como origem dos arquivos, sem apagar mídia de versões anteriores.
- Fotos de perfil são dados individuais (`user_metadata.avatar_url`), não imagens estáticas do projeto. A conta usada na conferência não exibia foto externa. URLs de fotos de outros usuários não foram exportadas nem substituídas; essa dependência individual permanece, preservando a funcionalidade e privacidade das contas.
- A fonte Inter continua carregada pelo Google Fonts: não é uma imagem e foi mantida para preservar exatamente o escopo solicitado.

## Verificação

- Servidor estático independente, sem infraestrutura Lovable: todos os 63 arquivos retornaram HTTP 200 com SHA-256 idêntico ao inventário.
- Chromium decodificou todas as 56 imagens WebP/PNG nesse servidor.
- Navegador com conta conectada: lista de conteúdo e leitor carregaram arquivos locais com as URLs antigas bloqueadas; download aponta ao PDF local; nenhum erro de execução.
- 56 testes passaram. `bun run check:assets` verifica os arquivos automaticamente antes das compilações normal e Vercel.
- `git ls-files public/assets` confirma 63 arquivos incluídos; nenhuma regra de exclusão afeta a logo ou o manifesto.
- Simulação realizada para a camada de arquivos estáticos e navegação na prévia. Não equivale a uma implantação real ou compilação executada na Vercel, que continua dependendo da conexão do repositório e das variáveis de ambiente.

## Inventário

| Arquivo local | Bytes | Dimensões | SHA-256 |
|---|---:|---|---|
| `/assets/Capitulo-00-Por-que-a-Basefy.pdf` | 346107 | PDF | `ecd7ffa1663dcf985167ec34aff55d8b3e03713426abe18d940bcd57fb2e1ae2` |
| `/assets/Capitulo-00-Por-que-a-Basefy-01.webp` | 24110 | 911 × 1288 | `fe8a105d3daea38a1e6252b85248f0ee43f1a78bbc7b2a4f75270d8c1a187cab` |
| `/assets/Capitulo-00-Por-que-a-Basefy-02.webp` | 72822 | 911 × 1288 | `09304702051b0d818dd7e2aca1d5854f0ceba48c02b6263d5baa9b4ed28db042` |
| `/assets/Capitulo-00-Por-que-a-Basefy-03.webp` | 63982 | 911 × 1288 | `75f8fef7e587dd55e58db9ea6d7329b3a323c3030f008d8261ad68112c0d4639` |
| `/assets/Capitulo-01-Sua-conta-e-seu-perfil.pdf` | 3117817 | PDF | `cf78d45e689ab35654e94d12485c53ac9a1bf71fc33ecbc4f54f3c9d5978e656` |
| `/assets/Capitulo-01-Sua-conta-e-seu-perfil-01.webp` | 29154 | 911 × 1288 | `3d0315ae9c0a9ef812a41fadc16d4d3a8681b9d0ddc6ec4e9123a5444ff6114b` |
| `/assets/Capitulo-01-Sua-conta-e-seu-perfil-02.webp` | 41278 | 911 × 1288 | `c4c0facb694bdf5b72ee7aead8a8fc1a5c104bd22ef76a27379bb1d146269cf0` |
| `/assets/Capitulo-01-Sua-conta-e-seu-perfil-03.webp` | 45096 | 911 × 1288 | `5caf8a50f3ecde04bfe3c9ea8fb9a0423fa4252f87bb270b789451b35dc98861` |
| `/assets/Capitulo-01-Sua-conta-e-seu-perfil-04.webp` | 88812 | 911 × 1288 | `50a0059f402f243daeba005b1347f0c4381331000ab1ab9773e84d220385c3dc` |
| `/assets/Capitulo-01-Sua-conta-e-seu-perfil-05.webp` | 49150 | 911 × 1288 | `ba1a25ac59745d189bdb2db8ebbb3464bc833b24af81dc43f5f03964a3f71710` |
| `/assets/Capitulo-01-Sua-conta-e-seu-perfil-06.webp` | 64160 | 911 × 1288 | `c958c20d4df56114debec58db0685c1b373d1be2b811c0c073c8b470e721edea` |
| `/assets/Capitulo-01-Sua-conta-e-seu-perfil-07.webp` | 70544 | 911 × 1288 | `59e00537b598c593991b5008f60d27b69528fff3902da0f94d062680765d45b1` |
| `/assets/Capitulo-01-Sua-conta-e-seu-perfil-08.webp` | 53296 | 911 × 1288 | `69ac35c033a2c89ff1cbb1a17158a2976dd0a3fd09e592c07f21f57ac64e4e2f` |
| `/assets/Capitulo-02-O-produto-certo.pdf` | 307294 | PDF | `d798c8b9093c2d14445bc86ddf878e6f176b1930f5fa85a538353e288384b485` |
| `/assets/Capitulo-02-O-produto-certo-01.webp` | 22266 | 911 × 1288 | `2a7d765e5542331ce462927b1e8db8212cdf2a7d0544866e67843c9671ff56dc` |
| `/assets/Capitulo-02-O-produto-certo-02.webp` | 67988 | 911 × 1288 | `9215c292fc1ffe639114c26be5757e5cfb4cd3a8a2a0167ff37fbc9ad1f65fe8` |
| `/assets/Capitulo-02-O-produto-certo-03.webp` | 55046 | 911 × 1288 | `46c69b0bedfbc600589ecbf928a62c37ba6b6d3bd150e12359b8e336a252f089` |
| `/assets/Capitulo-03-O-anuncio-que-vende.pdf` | 1377301 | PDF | `a76121e38d7ba22dc8c18843f10395d0cd953996cff3a1655196b0be06d278d4` |
| `/assets/Capitulo-03-O-anuncio-que-vende-01.webp` | 33802 | 911 × 1288 | `385adb86f1e6fc751f260739246362a6cc6299aef12fa4a49bab84b40d2990b1` |
| `/assets/Capitulo-03-O-anuncio-que-vende-02.webp` | 55692 | 911 × 1288 | `1ee8137a65900a98c709991e9c41db9c62aeba1724540ca2b82d6af4b203c69f` |
| `/assets/Capitulo-03-O-anuncio-que-vende-03.webp` | 41652 | 911 × 1288 | `153716b3527e6cd802d05efd94f0b6b32f9d2426d980622f3b55d21fc47a7e77` |
| `/assets/Capitulo-03-O-anuncio-que-vende-04.webp` | 68988 | 911 × 1288 | `4d6efea9e88379ead9bc38b9dca4352667fde3be2b389a7f0c0aa9f23e778811` |
| `/assets/Capitulo-03-O-anuncio-que-vende-05.webp` | 73336 | 911 × 1288 | `4a054af69804ec35c239583a353987f600085d68ea99a375b1de600063fc8d8c` |
| `/assets/Capitulo-03-O-anuncio-que-vende-06.webp` | 58978 | 911 × 1288 | `5ed0f75f14cecaf2ed3f8455bbbdddcb9a46a0c96cfe871de42ff2fc3ee6b27c` |
| `/assets/Capitulo-03-O-anuncio-que-vende-07.webp` | 48816 | 911 × 1288 | `789f2650075a9c1dd2d672671ba03fc84c51e6a38f8a0f8b262fe7533374e8d0` |
| `/assets/Capitulo-03-O-anuncio-que-vende-08.webp` | 56916 | 911 × 1288 | `e2c16802ecf36e7c1aabd97babf6408059a48a7033f51fa8788606415af22556` |
| `/assets/Capitulo-03-O-anuncio-que-vende-09.webp` | 44264 | 911 × 1288 | `519cc1030310275c7fcc520d4f77899d17e5e535de5dd7770c7c3bfe2feec00f` |
| `/assets/Capitulo-04-Preco-e-lucro.pdf` | 410258 | PDF | `cafeeabe124ca51e43550303f26fce2d8c71f19df8384fe2847792226c6d7761` |
| `/assets/Capitulo-04-Preco-e-lucro-01.webp` | 22938 | 911 × 1288 | `60b7bf89093061278b1cc8df5192dd3d0a291cb919a6ac3b7e4e667edb781428` |
| `/assets/Capitulo-04-Preco-e-lucro-02.webp` | 43472 | 911 × 1288 | `9c0d943f279286e620541b23f5de3b4b169838e0a586c3b749107827e4f39eeb` |
| `/assets/Capitulo-04-Preco-e-lucro-03.webp` | 51344 | 911 × 1288 | `7d6ace6a4aa6d7ee7c3a8085129e95a7b7cf940717f9b3977cbdb765ff1b84b8` |
| `/assets/Capitulo-04-Preco-e-lucro-04.webp` | 75396 | 911 × 1288 | `44766ad33d7a0a9b86f6c905f0d1a8bb92928fafc040395afc9ef01bb59d7ee3` |
| `/assets/Capitulo-05-Vender-sem-anuncio-pago.pdf` | 404833 | PDF | `6cf286c374c27ad87d39686af84862926ef1361095ffc9fb5efcec40178831ec` |
| `/assets/Capitulo-05-Vender-sem-anuncio-pago-01.webp` | 30630 | 911 × 1288 | `0055f08778e95b91c731b1111ceef708591ad29a4efb4dfb76bbe4bf2ac26aa7` |
| `/assets/Capitulo-05-Vender-sem-anuncio-pago-02.webp` | 67618 | 911 × 1288 | `9f022df1493a92739566f0372a3a7cccf66df776bbf167db1bbef2c9d8581e0d` |
| `/assets/Capitulo-05-Vender-sem-anuncio-pago-03.webp` | 71822 | 911 × 1288 | `cc0b9ab417085fb5954098bc1a1e698460522d785ce7f88c76c67636dfe1b2e8` |
| `/assets/Capitulo-05-Vender-sem-anuncio-pago-04.webp` | 62526 | 911 × 1288 | `57d23fb253212bc4a3f09cb0968a444340de19896040bb3f285d63d0fdc1f889` |
| `/assets/Capitulo-05-Vender-sem-anuncio-pago-05.webp` | 65128 | 911 × 1288 | `da596587d02d3f4f71f3bca0ee7ccbc830595eb952d344db5553eed56ba43731` |
| `/assets/Basefy-Resumao.pdf` | 4054717 | PDF | `9048263daf5657fc3afe0bb05e775dfc972b212a7c23b184eddbaa5d942c047d` |
| `/assets/Basefy-Resumao-01.webp` | 59642 | 911 × 1288 | `53a677c4b12a33177e72b17df30c81c1749a86d14211ac80eaf0f6ba8a0b0bdf` |
| `/assets/Basefy-Resumao-02.webp` | 78250 | 911 × 1288 | `c3d6eaa1cc84aab3d06535c48d7f7bf12efe7dd067a081b14c4ef21916a39b0f` |
| `/assets/Basefy-Resumao-03.webp` | 67012 | 911 × 1288 | `f636faa701b2c6fd9d7a2c9656f9c74b16a20588c87e5133ca5b743a9766031e` |
| `/assets/Basefy-Resumao-04.webp` | 74422 | 911 × 1288 | `8167e02d6bd7eba51bda7cf340bf255e3f3c44debb9906ba47b8b6266768f104` |
| `/assets/Basefy-Resumao-05.webp` | 65158 | 911 × 1288 | `b4479f6f040eda2a72d498581aca5de7bef5ef6c7472417c3b1c88c116434df6` |
| `/assets/Basefy-Resumao-06.webp` | 64162 | 911 × 1288 | `818eb65d7bb3ad5583de3648cb894382d705b307f4e17d2b093b8694da20723d` |
| `/assets/Basefy-Resumao-07.webp` | 70514 | 911 × 1288 | `59ca5e868dd8cc98f636e78d861f6864b925aafa7cf7295b434331be2357d66a` |
| `/assets/Basefy-Resumao-08.webp` | 66556 | 911 × 1288 | `b97446dcf879a259f37b503a435bf58b17e86d6f6bcf7ff201f6757afd385391` |
| `/assets/Basefy-Resumao-09.webp` | 69004 | 911 × 1288 | `2b428b5cf1ee73d23b62dcb48680bbabdc623fc3c975588ad2964f80db48747d` |
| `/assets/Basefy-Resumao-10.webp` | 69646 | 911 × 1288 | `0074ea9143ea9fb57e5f105f26848c9889aeee04b396e8a7bcdac2259a0859fd` |
| `/assets/Basefy-Resumao-11.webp` | 52266 | 911 × 1288 | `1396c427645fdac49dec5c5726fd8e7574eae50447cab67098cedf5fc1196082` |
| `/assets/Basefy-Resumao-12.webp` | 20102 | 911 × 1288 | `8c30a6295d0f9b001a4e1ef82f6f06e6f9a40aa03778752e6233745d0d122d16` |
| `/assets/Modulo-00-Por-que-a-Basefy.webp` | 75466 | 1080 × 1620 | `334b6e7badfdab46d42fa6a616bf9f2c8582cc244b95471057c726edd190a01c` |
| `/assets/Modulo-01-Sua-conta-e-seu-perfil.webp` | 94318 | 1080 × 1620 | `28aef82bd2237673d7a193a1fd3102345b335ccb54fce84a862d92297d6a7650` |
| `/assets/Modulo-02-O-produto-certo.webp` | 94886 | 1080 × 1620 | `50b0bc6310658dd98d1abb4af434fc4a701cfb7ec1d7a95136048af87413f30e` |
| `/assets/Modulo-03-O-anuncio-que-vende.webp` | 84858 | 1080 × 1620 | `26f10be4187180660e1404d74a8acc307f17d605dcd8197ca139570b75dec152` |
| `/assets/Modulo-04-Preco-e-lucro.webp` | 58110 | 1080 × 1620 | `a32eabfa74b0b8620fac753778dba95af2c2e345fc4df160581223de4779c4f5` |
| `/assets/Modulo-05-Vender-sem-anuncio-pago.webp` | 66850 | 1080 × 1620 | `97642904d0daef1ce800f61fea028218474ebadf583dd6d0e70febb0a4c8aeef` |
| `/assets/Modulo-06-Depois-da-venda.webp` | 75128 | 1080 × 1620 | `9f5ba24a0e45daa16e2cfeaa42bfc3db903e8b1177e2647af3c78110270651b9` |
Os cinco PNGs da logo e dos ícones têm nomes, dimensões e hashes exatos registrados em `scripts/assets-manifest.json`, junto das 58 mídias originais acima.
