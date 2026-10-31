# ATHOS: como continuar numa sessão nova

**Situação em 30/10/2026, 23:45:** a versão 2.5.1 está no ar (versionCode 38).

Às 23:53 a sessão antiga faz sozinha a "IA mais rápida" e lança a 2.5.2 (versionCode 39). Antes de mexer em qualquer coisa, confira em `versao.json` qual versão está no ar.

## Onde está tudo

**Código:** repositório GitHub `higolirio579-glitch/athos`, pasta `projeto/`.
- Base do app: `app_base.html`.
- Blocos JS no formato `*_block.js`.
- SQL em `*.sql`.
- Edge Functions: `edge_ai.ts` (IA) e `edge_limpeza.ts` (limpeza de fotos).
- Projeto Android: `android/`.

**Site (iPhone):** https://higolirio579-glitch.github.io/athos/. Ele é publicado pela raiz do repositório: `index.html`, `ATHOS.apk` e `versao.json`.

**Supabase:** projeto `shvphmajljvlnqlhryfw`. As mudanças são feitas pelo navegador, no SQL Editor ou em Edge Functions.

**Chave de assinatura:** NÃO está no GitHub. O Higo tem o arquivo `ATHOS-chave-assinatura.jks` e precisa anexá-lo na sessão nova. Alias e senha foram passados a ele junto com o arquivo.

## Como gerar uma versão

1. Rode `python3 build_html.py` (gera o index.html do APK) e `python3 build_web.py` (gera o site).
2. Atualize o `versionCode` e o `versionName` no `AndroidManifest.xml` e o "ATHOS/x.y" no `MainActivity.java`.
3. Gere o APK: `aapt package` → `javac -source 8` → `dalvik-exchange --dex` → `aapt add` → `zipalign` → `apksigner` (com a chave .jks). O android.jar usado é o do SDK 34.
4. Para lançar, copie `index.html`, `ATHOS.apk` e `versao.json` (com `code`, `nome` e `notas`) para a raiz do repositório e faça o push.

## Regras do Higo

- **Publicação:** não publicar nada sem a autorização dele. "Pode lançar", "lance" ou "já manda" contam como autorização.
- **Tutorial:** toda mudança visível também atualiza o tutorial. Isso fica em `tour_block.js`: `NEWS_V`, `NEWS_ORDER`, `newsByVer` e `tourSteps`.
- **Chaves de API e senhas:** nunca pedir nem digitar no chat. Ele mesmo cola direto no Supabase.

## IA

**Motores:** Gemini → Groq → NVIDIA → Cloudflare, limite de 20 usos por pessoa por dia.

**Validade da chave NVIDIA:** 6 meses, até mais ou menos abril de 2027.

**Coach ATHOS:**
- Código em `coach_block.js`: bolinha flutuante arrastável, personalidades, botão "salvar como ficha".
- Biblioteca: tabela `coach_kb` com 44 textos e a busca `coach_search`.

## Ideias pendentes

- **Resposta da IA aparecendo enquanto é escrita (streaming)**, no Coach.
- **Se a 2.5.2 não tiver saído:** desligar o "pensamento" do Gemini, colocar o Groq primeiro para texto, timeout de 12 s por motor e fotos com 1024 px.
