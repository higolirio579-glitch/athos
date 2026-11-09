# ATHOS: instruções para o Claude

App de treino, dieta, corrida e rede social do Higo. Ele é o dono, fala português do Brasil e prefere respostas curtas e diretas.

## Regras do dono (sempre)
- **Não publicar nada sem autorização dele.** Isso vale para atualização do app, do site e mudanças no Supabase. O fluxo é: fazer, mandar fotos ou APK de teste e perguntar antes.
- **Toda mudança de layout, design ou função vem com o aviso de novidades atualizado**, em `projeto/tour_block.js`, com `NEWS_V`, `NEWS_ORDER` e `newsByVer`.
- **Mudanças no Supabase quem aplica é o Higo.** Escreva o arquivo `.sql` e explique o passo a passo; ele roda no SQL Editor.
- Nada de recomendar dose de suplemento nem conselho médico no app.

## Como o projeto é montado
- O código fica em `projeto/`. O app é um HTML único: `app_base.html` mais os blocos `*_block.js`, juntados por `build_html.py`.
  - `python3 build_html.py` gera `android/assets/index.html`, que é o app Android em WebView.
  - `python3 build_web.py` gera `web/index.html`, que é o site e a versão de iPhone.
- **Android:** fica em `projeto/android/`, com Java em `src/br/higo/ficha/`. O pacote é `br.higo.ficha`, a versão fica em `AndroidManifest.xml` (`versionCode` e `versionName`) e o User-Agent fica em `MainActivity.java` (`ATHOS/x.y.z`).
- **APK sem Gradle:** `aapt package -m` → `javac -source 8 -target 8` com `sdk/android.jar` → `dalvik-exchange --dex --min-sdk-version=24` → `aapt add classes.dex` → `zipalign -f 4` → `apksigner sign --ks <chave.jks> --ks-key-alias ficha`.
  - A chave e a senha ficam com o Higo e **nunca vão para o repositório**.
  - Essas ferramentas existem na sessão na nuvem; no Windows seria preciso instalar o Android build-tools.
- **Supabase:** projeto `shvphmajljvlnqlhryfw`. Usa RLS, funções `security definer` e as Edge Functions `ai` (`edge_ai.ts`) e `limpeza-fotos` (`edge_limpeza.ts`).

## Como publicar uma versão (só com o OK do Higo)
1. Aumente `versionCode` e `versionName` e o User-Agent. Rode os dois builds e gere e assine o APK.
2. **Repositório `higolirio579-glitch/athos`, branch `main`:**
   - copie `projeto/web/index.html` para `index.html` e o APK para `ATHOS.apk`;
   - atualize `versao.json` com `code`, `nome`, `notas` e `apk` = `https://higolirio579-glitch.github.io/athos/ATHOS.apk`.
3. **Repositório `athos-app/ATHOS-app.github.io`:** copie o mesmo `index.html` e o mesmo `ATHOS.apk`. O `versao.json` é igual, mas com `apk` = `https://athos-app.github.io/ATHOS.apk`.
4. Espere o GitHub Pages publicar os dois. Se travar na fila, um commit vazio novo destrava. Confira os dois `versao.json` no ar.

O app procura atualização primeiro em `athos-app.github.io` e usa o endereço antigo como reserva. A página de download é https://athos-app.github.io/baixar/.

## Estado atual
- **Versão no ar:** 2.5.12 (versionCode 49), com contador de passos, suplementos, painel de moderador, cardio na máquina, contagem 3-2-1, corrida com mapa em tela cheia e tipos de mapa, e correção do sync que apagava o perfil em aparelho novo.
- **SQL já aplicado:** `moderacao.sql`. A conta do Higo é moderadora.
- **SQL escrito mas NÃO aplicado:**
  - `db_limites.sql`, com tempos-limite do banco. O Higo preferiu deixar para depois.
  - `seguranca_rpc.sql`, que fecha funções auxiliares para visitantes. Está na branch `seguranca-rpc`.
- **Edge Functions refeitas e não publicadas:** `edge_ai.ts` e `edge_limpeza.ts` reaproveitando o cliente. Estão na branch `db-conexoes`.
- **Pendente de segurança:** varredura completa com o Claude Security, que precisa de "Dynamic workflows" no Claude Code.
