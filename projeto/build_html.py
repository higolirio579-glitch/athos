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
rep("  try{await DOWNLOADS.save(","  if(!DOWNLOADS&&NATIVE){NATIVE.saveFile(`athos-backup-${today()}.json`,data);return}\n  if(!DOWNLOADS&&window.WEBAPP){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=`athos-backup-${today()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);toast('Backup baixado');return}\n  try{await DOWNLOADS.save(")
# botão voltar do Android
rep("/* ---------- início ---------- */",
    "window.androidBack=function(){if($('#authGate')&&!$('#authGate').hidden){if(/signup|forgot|reset|verify/.test(ACC.view)){setView('login');return true}return false}if(sheets.length){closeSheet();return true}if(!$('#session').hidden){closeActive();return true}if(S.tab!=='hoje'){go('hoje');return true}return false};\nwindow.androidSaved=function(ok){toast(ok?'Backup salvo':'Backup não foi salvo')};\n/* ---------- início ---------- */")
CSP_DBG="""<script>document.addEventListener('securitypolicyviolation',function(e){try{var a=JSON.parse(localStorage.getItem('athos.csp')||'[]');a.push(e.violatedDirective+' '+e.blockedURI);localStorage.setItem('athos.csp',JSON.stringify(a.slice(-20)));}catch(x){}})</script>"""  # só registra (em silêncio) o que a regra bloqueou, para diagnóstico
head='''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://shvphmajljvlnqlhryfw.supabase.co https://*.openstreetmap.org https://*.openfoodfacts.org https://cdn.jsdelivr.net; media-src 'self' blob: data: https://shvphmajljvlnqlhryfw.supabase.co; font-src 'self' data:; connect-src 'self' blob: data: https://shvphmajljvlnqlhryfw.supabase.co wss://shvphmajljvlnqlhryfw.supabase.co https://higolirio579-glitch.github.io https://world.openfoodfacts.org https://generativelanguage.googleapis.com https://api.groq.com; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'">'''+CSP_DBG+'''<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><script>try{if(window.Android&&Android.isDark())document.documentElement.setAttribute('data-theme','dark');else document.documentElement.setAttribute('data-theme','light')}catch(e){}</script><style>:root{color-scheme:light}body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>
'''
open('android/assets/index.html','w',encoding='utf8').write(head+src+'\n</body></html>\n')
print('ok',len(src))

# ---------- IA grátis com Gemini (só no APK) ----------
n=src.count('Usa um pouco do seu limite de uso do Claude.')
assert n==3, n
src=src.replace('Usa um pouco do seu limite de uso do Claude.','${aiNote()}')
rep("`<p class=\"hint\">Libere o uso do Claude nesta página para gerar planos alimentares.</p>`",
    "`<p class=\"hint\">${AIHOST?'Entre na aba Social para usar a IA grátis e gerar planos alimentares.':'Libere o uso do Claude nesta página para gerar planos alimentares.'}</p>`")
rep("  /* cartão Seus dados removido */","  /* IA, conta e notificações ficam em Configurações */")
rep("  case'rate_limited':return'Seu limite de uso do Claude foi atingido. Tente mais tarde.';",
    "  case'rate_limited':return AIHOST?'Limite grátis da IA atingido por agora. Tente mais tarde ou conecte a segunda IA no Perfil.':'Seu limite de uso do Claude foi atingido. Tente mais tarde.';\n  case'bad_key':return'A chave da IA não funcionou. Confira em Perfil.';\n  case'user_limit':return'Você já usou seus 20 usos de IA de hoje. Amanhã tem mais! Para usar além disso, conecte sua própria chave no Perfil.';\n  case'server_not_configured':return'A IA do ATHOS ainda não está configurada no servidor.';\n  case'offline':return'Sem conexão com a internet.';")
AI_JS=open('ai_block.js',encoding='utf8').read()
RUN_JS=open('run_block.js',encoding='utf8').read()
SOC_JS=open('social_block.js',encoding='utf8').read()
ACC_JS=open('account_block.js',encoding='utf8').read()
UPD_JS=open('update_block.js',encoding='utf8').read()
NOT_JS=open('notif_block.js',encoding='utf8').read()
TOUR_JS=open('tour_block.js',encoding='utf8').read()
MUS_JS=open('music_block.js',encoding='utf8').read()
CFG_JS=open('settings_block.js',encoding='utf8').read()
CHC_JS=open('chatclub_block.js',encoding='utf8').read()
COA_JS=open('coach_block.js',encoding='utf8').read()
PRV_JS=open('privacy_block.js',encoding='utf8').read()
PPC_JS=open('ppcloud_block.js',encoding='utf8').read()
CMP_JS=open('compete_block.js',encoding='utf8').read()
rep("window.androidBack=function(){",AI_JS+RUN_JS+SOC_JS+ACC_JS+UPD_JS+NOT_JS+TOUR_JS+MUS_JS+CFG_JS+CMP_JS+PPC_JS+PRV_JS+CHC_JS+COA_JS+"window.androidBack=function(){if(window.updBlocking&&window.updBlocking())return true;if(window.tourBack&&window.tourBack())return true;if($('#authGate')&&!$('#authGate').hidden){if(/signup|forgot|reset|verify/.test(ACC.view)){setView('login');return true}return false}if(sheets.length){closeSheet();return true}if($('#run')&&!$('#run').hidden){ACT.runMin();return true}")
head=head.replace('</head>','<style>#splash{position:fixed;inset:0;z-index:80;background:#ECEEF2;color:#111214;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;opacity:0;animation:splIn .3s ease .4s forwards}#splash b{font:800 44px/1 "Barlow Condensed","Arial Narrow",system-ui,sans-serif;letter-spacing:.16em;padding-left:.16em}#splash i{width:30px;height:30px;border-radius:50%;border:3px solid rgb(128 128 128 / .25);border-top-color:#DDA623;animation:splSp .8s linear infinite}@media (prefers-color-scheme:dark){#splash{background:#000;color:#F2F2F0}#splash i{border-top-color:#E9B640}}@keyframes splIn{to{opacity:1}}@keyframes splSp{to{transform:rotate(360deg)}}</style><script>(function(){var d=document.createElement("div");d.id="splash";d.setAttribute("aria-hidden","true");d.innerHTML="<b>ATHOS</b><i></i>";document.documentElement.appendChild(d);window.splashOff=function(){var e=document.getElementById("splash");if(e)e.remove()};setTimeout(window.splashOff,15000)})()</script><link rel="stylesheet" href="leaflet/leaflet.css"><script src="leaflet/leaflet.js"></script><script src="supabase/supabase.js"></script></head>')
rep("const DEF_PROFILE={name:'Higo',","const DEF_PROFILE={name:'',")
open('android/assets/index.html','w',encoding='utf8').write(head+src+'\n</body></html>\n')
print('ai ok',len(src))
