import re,sys
src=open('app_base.html',encoding='utf8').read()
def rep(old,new):
    global src
    n=src.count(old)
    if n!=1: sys.exit(f'match {n}x: {old[:70]}')
    src=src.replace(old,new)
# fontes locais no lugar do Google Fonts
src=re.sub(r'<link rel="preconnect"[^>]*>\n<link rel="preconnect"[^>]*>\n<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\n','',src)
ff=''.join(f'@font-face{{font-family:"Barlow";font-weight:{w};font-style:normal;font-display:swap;src:url(fonts/barlow-latin-{w}-normal.woff2) format("woff2")}}\n' for w in (400,500,600,700))
ff+=''.join(f'@font-face{{font-family:"Barlow Condensed";font-weight:{w};font-style:normal;font-display:swap;src:url(fonts/barlow-condensed-latin-{w}-normal.woff2) format("woff2")}}\n' for w in (500,600,700,800))
rep('<style>\n/* Layout','<style>\n'+ff+'/* Layout')
# armazenamento nativo (arquivo dentro do app)
rep("function lsGet(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}",
    "const NATIVE=window.Android||null;\nfunction lsGet(k){try{return JSON.parse((NATIVE?NATIVE.getItem(k):localStorage.getItem(k))||'null')}catch(e){return null}}")
rep("function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}",
    "function lsSet(k,v){try{const s=JSON.stringify(v);if(NATIVE)NATIVE.setItem(k,s);else localStorage.setItem(k,s)}catch(e){}}")
rep("function saveLocal(){clearTimeout(lsTimer);lsTimer=setTimeout(()=>lsSet(LKEY,{profile:S.profile,days:S.days,sessions:S.sessions}),300)}",
    "function flushLocal(){clearTimeout(lsTimer);lsTimer=null;lsSet(LKEY,{profile:S.profile,days:S.days,sessions:S.sessions})}\nfunction saveLocal(){clearTimeout(lsTimer);lsTimer=setTimeout(flushLocal,300)}\ndocument.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){if(lsTimer)flushLocal();saveActive()}});")
# tela ligada e vibração
rep("async function getWake(){try{","async function getWake(){if(NATIVE){try{NATIVE.keepAwake(true)}catch(e){}return}try{")
rep("function releaseWake(){try{","function releaseWake(){if(NATIVE){try{NATIVE.keepAwake(false)}catch(e){}return}try{")
rep("try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}","try{if(NATIVE)NATIVE.vibrate();else navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}")
# backup
rep("<div class=\"btns\">${DOWNLOADS?'<button class=\"btn\" data-act=\"export\">Exportar backup</button>':''}",
    "<div class=\"btns\">${DOWNLOADS||NATIVE||window.WEBAPP?'<button class=\"btn\" data-act=\"export\">Exportar backup</button>':''}")
rep("  try{await DOWNLOADS.save(","  if(!DOWNLOADS&&NATIVE){NATIVE.saveFile(`athos-backup-${today()}.json`,data);return}\n  if(!DOWNLOADS&&window.WEBAPP){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=`athos-backup-${today()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);toast('Backup baixado');return}\n  try{await DOWNLOADS.save(")
rep("${store.mode==='db'?'Tudo fica salvo na sua conta do Claude: abre em qualquer aparelho com os mesmos treinos, cargas, peso e refeições.':",
    "${store.mode==='db'?'Tudo fica salvo na sua conta do Claude: abre em qualquer aparelho com os mesmos treinos, cargas, peso e refeições.':window.WEBAPP?'Seus treinos ficam salvos neste aparelho, dentro do navegador. Exporte um backup de vez em quando: se você limpar os dados do Safari, eles vão junto.':NATIVE?'Tudo fica salvo neste celular, dentro do app. Exporte um backup de vez em quando: se você desinstalar o app, os dados vão junto. Para trazer os dados da versão no Claude, exporte o backup lá e importe aqui.':")
# botão voltar do Android
rep("/* ---------- início ---------- */",
    "window.androidBack=function(){if($('#authGate')&&!$('#authGate').hidden){if(/signup|forgot|reset|verify/.test(ACC.view)){setView('login');return true}return false}if(sheets.length){closeSheet();return true}if(!$('#session').hidden){closeActive();return true}if(S.tab!=='hoje'){go('hoje');return true}return false};\nwindow.androidSaved=function(ok){toast(ok?'Backup salvo':'Backup não foi salvo')};\n/* ---------- início ---------- */")
head='''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><script>try{if(window.Android&&Android.isDark())document.documentElement.setAttribute('data-theme','dark');else document.documentElement.setAttribute('data-theme','light')}catch(e){}</script><style>:root{color-scheme:light}body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>
'''
open('android/assets/index.html','w',encoding='utf8').write(head+src+'\n</body></html>\n')
print('ok',len(src))

# ---------- IA grátis com Gemini (só no APK) ----------
n=src.count('Usa um pouco do seu limite de uso do Claude.')
assert n==4, n
src=src.replace('Usa um pouco do seu limite de uso do Claude.','${aiNote()}')
rep("`<p class=\"hint\">Libere o uso do Claude nesta página para gerar planos alimentares.</p>`",
    "`<p class=\"hint\">${AIHOST?'Entre na aba Social para usar a IA grátis e gerar planos alimentares.':'Libere o uso do Claude nesta página para gerar planos alimentares.'}</p>`")
rep("  html+=`<h2 style=\"margin-top:6px\">Meus treinos</h2>`;",
    "  if(AIHOST&&!SAMPLE)html+=`<p class=\"hint\">Entre na aba Social para usar a IA grátis (montar treinos e importar a ficha por foto).</p>`;\n  html+=`<h2 style=\"margin-top:6px\">Meus treinos</h2>`;")
rep("  html+=`<div class=\"card\"><h3>Seus dados</h3>","  if(AIHOST)html+=aiCard();\n  html+=`<div class=\"card\"><h3>Seus dados</h3>")
rep("  case'rate_limited':return'Seu limite de uso do Claude foi atingido. Tente mais tarde.';",
    "  case'rate_limited':return AIHOST?'Limite grátis da IA atingido por agora. Tente mais tarde ou conecte a segunda IA no Perfil.':'Seu limite de uso do Claude foi atingido. Tente mais tarde.';\n  case'bad_key':return'A chave da IA não funcionou. Confira em Perfil.';\n  case'user_limit':return'Você já usou seus 20 usos de IA de hoje. Amanhã tem mais! Para usar além disso, conecte sua própria chave no Perfil.';\n  case'server_not_configured':return'A IA do ATHOS ainda não está configurada no servidor.';\n  case'offline':return'Sem conexão com a internet.';")
AI_JS=open('ai_block.js',encoding='utf8').read()
RUN_JS=open('run_block.js',encoding='utf8').read()
SOC_JS=open('social_block.js',encoding='utf8').read()
ACC_JS=open('account_block.js',encoding='utf8').read()
rep("window.androidBack=function(){",AI_JS+RUN_JS+SOC_JS+ACC_JS+"window.androidBack=function(){if($('#authGate')&&!$('#authGate').hidden){if(/signup|forgot|reset|verify/.test(ACC.view)){setView('login');return true}return false}if(sheets.length){closeSheet();return true}if($('#run')&&!$('#run').hidden){ACT.runMin();return true}")
head=head.replace('</head>','<link rel="stylesheet" href="leaflet/leaflet.css"><script src="leaflet/leaflet.js"></script><script src="supabase/supabase.js"></script></head>')
rep("const DEF_PROFILE={name:'Higo',","const DEF_PROFILE={name:'',")
rep("'Seus treinos ficam salvos neste aparelho, dentro do navegador. Exporte um backup de vez em quando: se você limpar os dados do Safari, eles vão junto.'","'Seus dados ficam salvos na sua conta ATHOS e sincronizam sozinhos entre aparelhos. O backup em arquivo é opcional.'")
import re as _re
_m=_re.search(r"NATIVE\?'Tudo fica salvo neste celular, dentro do app\.[^']*'",src);assert _m
src=src.replace(_m.group(0),"NATIVE?'Seus dados ficam salvos na sua conta ATHOS e sincronizam sozinhos entre aparelhos. O backup em arquivo é opcional.'")
open('android/assets/index.html','w',encoding='utf8').write(head+src+'\n</body></html>\n')
print('ai ok',len(src))
