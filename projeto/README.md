# ATHOS — código-fonte

App de treino, dieta, corrida e rede social. Este diretório gera o **APK Android** e a **versão web** (a raiz deste repositório é o que o GitHub Pages publica).

## Arquivos
- `app_base.html` — app base (treino, dieta, evolução, perfil).
- `ai_block.js` — IA (servidor do ATHOS + chave própria opcional Gemini/Groq).
- `run_block.js` — gravação de corrida com GPS (só Android).
- `social_block.js` — rede social (feed, curtidas, comentários, chat, clubes).
- `account_block.js` — cadastro obrigatório, código por e-mail e sincronização dos dados na conta.
- `build_html.py` / `build_web.py` — juntam tudo em `android/assets/index.html` e `web/index.html`.
- `android/` — projeto Android (Java, manifesto, ícones, fontes, Leaflet e Supabase).
- `social_schema.sql`, `ai_usage.sql`, `user_data.sql` — banco do Supabase (rodar no SQL Editor, nessa ordem).
- `edge_ai.ts` — Edge Function `ai` do Supabase (segredos `GEMINI_KEY` e `GROQ_KEY`).

## Gerar
1. Coloque `ficha.jks` (chave de assinatura, **não** suba para o GitHub) nesta pasta e o `android.jar` em `sdk/`.
2. `ATHOS_KS_PASS='senha' ./build_apk.sh` → gera `ATHOS.apk` e `web/index.html`.
3. Para atualizar o site: copie `web/index.html` para a raiz do repositório e faça commit.

Use sempre a **mesma** `ficha.jks`: só assim o APK novo instala por cima do antigo.
