
/* ---------- gravador de atividades com GPS (app Android) ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
#run{position:fixed;inset:0;z-index:31;background:var(--bg);display:flex;flex-direction:column}
.r-h{padding-top:env(safe-area-inset-top,0px);border-bottom:1px solid var(--line);flex:none}
.r-h .wrap{display:flex;align-items:center;gap:10px;padding-block:8px}
.r-h .ttl{flex:1;min-width:0}.r-h h2{font-size:21px}
.r-map{position:relative;flex:1 1 auto;min-height:max(200px,34vh)}
#runMap{position:absolute;inset:0;background:var(--surface2)}
#run .r-map{position:absolute;inset:0;min-height:0}
#run{--r-card:#121315}
.r-fabs{position:absolute;right:14px;top:14px;z-index:500;display:flex;flex-direction:column;gap:10px}
.r-fab{width:50px;height:50px;border-radius:50%;border:0;background:rgb(10 10 11 / .88);color:#F2F2F0;display:grid;place-items:center;box-shadow:0 4px 14px rgb(0 0 0 / .35)}
.r-fab svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.r-fab[aria-pressed=true]{background:var(--accent);color:#000}
.r-exp{position:absolute;right:12px;top:10px;width:40px;height:40px;border:0;border-radius:50%;background:transparent;color:var(--muted);display:grid;place-items:center}
.r-exp svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.r-body{position:relative;flex:1 1 auto;min-height:0}
#cdown{position:fixed;inset:0;z-index:1000;background:radial-gradient(circle at 50% 45%,rgba(233,182,64,.22),rgba(0,0,0,0) 62%),#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;color:#F2F2F0;animation:cdIn .2s ease-out}
#cdown.out{opacity:0;transition:opacity .25s}
#cdown .cd-t{font:700 18px var(--body);color:#8C929C;margin:0}
#cdown .cd-n{height:300px;width:100%;display:grid;place-items:center;overflow:visible}
#cdown .cd-n b{font:800 220px/1 var(--display);color:var(--accent);animation:cdPop 1s ease-out both;filter:drop-shadow(0 0 34px rgba(233,182,64,.45))}
#cdown .cd-n b.go{font-size:120px;color:#F2F2F0}
#cdown .cd-h{font:600 17px var(--body);color:#8C929C;margin:0}
#cdown .cd-x{position:absolute;bottom:calc(32px + env(safe-area-inset-bottom,0px));min-width:160px;background:#16171A;color:#F2F2F0;border:1.5px solid #2A2C31}
@keyframes cdIn{from{opacity:0}}
@keyframes cdPop{0%{transform:scale(1.5);opacity:0}25%{transform:scale(1);opacity:1}85%{opacity:1}100%{transform:scale(.85);opacity:.15}}
@media (prefers-reduced-motion:reduce){#cdown .cd-n b{animation:none}}
.mtypes{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.mtype{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:10px;border-radius:16px;border:2px solid var(--line);background:var(--surface);color:var(--fg);text-align:left;font:inherit}
.mtype[aria-pressed=true]{border-color:var(--accent)}
.mtype i{display:block;width:100%;aspect-ratio:16/10;border-radius:10px;margin-bottom:4px}
.mtype small{color:var(--muted);font-size:12.5px}
.mt-osm i{background:linear-gradient(135deg,#2a2d33 0 30%,#3a3e46 30% 34%,#2a2d33 34% 62%,#3a3e46 62% 66%,#2a2d33 66%)}
.mt-sat i{background:radial-gradient(circle at 30% 40%,#4d6b3a,transparent 40%),radial-gradient(circle at 75% 70%,#2f4a2a,transparent 45%),linear-gradient(135deg,#3d5a34,#24381f)}
.mt-hyb i{background:linear-gradient(135deg,transparent 0 46%,#e8e2c8 46% 50%,transparent 50%),radial-gradient(circle at 30% 40%,#4d6b3a,transparent 40%),linear-gradient(135deg,#3d5a34,#24381f)}
.mt-topo i{background:repeating-radial-gradient(circle at 60% 60%,#d9c9a3 0 6px,#c4b088 6px 8px)}
#run .r-stats{position:absolute;left:12px;right:12px;bottom:12px;z-index:600;background:var(--r-card);border:1px solid var(--line);border-radius:20px;padding:14px 16px 12px;box-shadow:0 10px 30px rgb(0 0 0 / .45);gap:8px;max-width:none}
#run .r-stats>.grid3:nth-child(4),#run .r-stats>#rSplit{display:none}
#run .r-big .num{font-size:64px}
#run[data-mode=num] .r-map{visibility:hidden}
#run[data-mode=num] .r-stats{inset:0;border-radius:0;border:0;box-shadow:none;justify-content:space-evenly;padding:20px 22px;background:var(--bg)}
#run[data-mode=num] .r-big{justify-content:center}
#run[data-mode=num] .r-big .num{font-size:120px}#run[data-mode=num] .r-big .r-unit{font-size:40px}
#run[data-mode=num] .r-stats>.grid3:nth-child(3) .stat .num{font-size:52px}
#run[data-mode=num] .r-stats>.grid3:nth-child(4){display:grid}
#run[data-mode=num] .r-stats>#rSplit{display:block;text-align:center;font-size:16px}
#run[data-mode=num] .r-stats .stat{text-align:center}
.r-wait{position:absolute;left:12px;top:12px;z-index:500;background:var(--surface);color:var(--fg);padding:6px 10px;border-radius:9px;font-weight:600;font-size:13px;box-shadow:0 2px 8px rgb(0 0 0 / .15)}
.r-stats{display:flex;flex-direction:column;gap:12px;padding-block:12px;flex:none}
.r-big{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.r-big .num{font-size:100px;line-height:.82;letter-spacing:-.01em}.r-big .r-unit{font-size:30px;color:var(--muted)}
.r-stats>.grid3:nth-child(3) .stat .num{font-size:34px}.r-stats>.grid3:nth-child(3) .stat small{font-size:13.5px}.r-stats>.grid3:nth-child(4) .stat .num{font-size:24px;color:var(--muted)}
.r-ctl{flex:none;background:var(--surface);border-top:1px solid var(--line);padding:10px max(16px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
.r-ctl{background:#000;border-top:0}
.r-ctl .in{max-width:420px;margin:0 auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px}
.r-side{display:flex;flex-direction:column;align-items:center;gap:6px}.r-side small{font-size:13px;font-weight:600;color:var(--muted)}
.r-round{width:58px;height:58px;border-radius:50%;border:1.5px solid #2A2C31;background:#16171A;color:#F2F2F0;display:grid;place-items:center}
.r-round svg{width:24px;height:24px;fill:currentColor;stroke:none}
.r-round .w{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.r-round[aria-pressed=true]{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,#2A2C31)}
.r-round[aria-pressed=false] .w{opacity:.25}
.r-mid{display:grid;place-items:center}
.r-go{position:relative;width:88px;height:88px;border-radius:50%;border:0;background:radial-gradient(circle at 35% 30%,#F6CF6A,var(--accent) 55%,#B8862A);color:#000;display:grid;place-items:center;box-shadow:0 8px 28px rgba(233,182,64,.35),inset 0 -3px 0 rgba(0,0,0,.18)}
.r-go svg{width:34px;height:34px;fill:currentColor}
.r-go .i-play{display:none;margin-left:3px}.r-go.paused .i-play{display:block}.r-go.paused .i-pause{display:none}
.r-go:before{content:"";position:absolute;inset:-8px;border-radius:50%;border:2px solid var(--accent);opacity:.55;animation:rgoPulse 2.2s ease-out infinite}
.r-go.paused:before{animation:none;opacity:.25;border-color:#8C929C}
.r-go:active{transform:scale(.96)}
@keyframes rgoPulse{0%{transform:scale(.94);opacity:.6}100%{transform:scale(1.22);opacity:0}}
@media (prefers-reduced-motion:reduce){.r-go:before{animation:none}}
#run .r-stats>.grid3:nth-child(3) .stat:nth-child(3) .num{color:var(--accent)}
#run .r-stats{border-top:2px solid color-mix(in srgb,var(--accent) 55%,transparent)}
.leaflet-container{font-family:var(--body);background:var(--surface2)}
:root[data-theme="dark"] .tl-osm{filter:invert(1) hue-rotate(180deg) brightness(.85) contrast(.9)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .tl-osm{filter:invert(1) hue-rotate(180deg) brightness(.85) contrast(.9)}}
@media (max-height:700px){#run .r-big .num{font-size:52px}.r-stats>.grid3:nth-child(3) .stat .num{font-size:28px}#run[data-mode=num] .r-big .num{font-size:96px}}
</style>`);
const RUN={on:false,type:'run',n:0,pts:[],st:null,map:null,line:null,dot:null,follow:true,poll:null,first:true};
window.RUNAPI=!!(NATIVE&&NATIVE.runStart);
const PERMW={};let permN=0;
window.androidPermDone=(id,res)=>{const f=PERMW[id];if(f){delete PERMW[id];f(res||{})}};
function askPerms(){return new Promise(r=>{const id='p'+(++permN);PERMW[id]=r;try{NATIVE.runPermissions(id)}catch(e){delete PERMW[id];r({})}})}
const accentColor=()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#1F4FDE';
function osmLayer(){return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap',className:'tl-osm'})}
const ESRI='https://server.arcgisonline.com/ArcGIS/rest/services/';
const MAPT=[['osm','Padrão','Ruas, no tema do app'],['sat','Satélite','Foto aérea'],['hyb','Híbrido','Foto aérea com nomes das ruas'],['topo','Relevo','Morros e subidas']];
const mapType=()=>{const v=lsGet('athos.mapType');return MAPT.some(m=>m[0]===v)?v:'osm'};
function mapLayer(t){
  if(t==='sat')return L.tileLayer(ESRI+'World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'© Esri'});
  if(t==='hyb')return L.layerGroup([L.tileLayer(ESRI+'World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'© Esri'}),L.tileLayer(ESRI+'Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}),L.tileLayer(ESRI+'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19})]);
  if(t==='topo')return L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'© OpenTopoMap · © OpenStreetMap'});
  return osmLayer()}
function setMapType(t){lsSet('athos.mapType',t);if(RUN.map){try{RUN.map.removeLayer(RUN.tiles)}catch(e){}RUN.tiles=mapLayer(t).addTo(RUN.map);try{RUN.tiles.bringToBack()}catch(e){}}const b=$('#rLayer');if(b)b.setAttribute('aria-pressed',t!=='osm')}
function mapTypeSheet(){const cur=mapType();
  openSheet('Tipo de mapa',`<div class="mtypes">${MAPT.map(m=>`<button class="mtype mt-${m[0]}" data-mt="${m[0]}" aria-pressed="${cur===m[0]}"><i aria-hidden="true"></i><b>${m[1]}</b><small>${m[2]}</small></button>`).join('')}</div>`,(b,el)=>{
    b.onclick=e=>{const x=e.target.closest('[data-mt]');if(!x)return;setMapType(x.dataset.mt);closeSheet(el);document.body.classList.add('locked')}})}
function estSteps(type,dist){if(type==='bike')return 0;const h=(S.profile.height||170)/100;return dist/(type==='run'?h*0.65:h*0.415)}
const voiceOn=()=>lsGet('ficha.voice')!==false;

/* contagem 3, 2, 1 antes de começar a gravar */
function runCountdown(type){return new Promise(res=>{
  const el=document.createElement('div');el.id='cdown';el.setAttribute('role','dialog');el.setAttribute('aria-label','Contagem para começar');
  el.innerHTML=`<p class="cd-t">${esc(RUN_T[type]||'Atividade')}</p><div class="cd-n" aria-live="assertive"><b>3</b></div><p class="cd-h">Prepare-se</p><button class="btn cd-x" type="button">Cancelar</button>`;
  document.body.appendChild(el);let n=3,tm=null,done=false;const b=el.querySelector('.cd-n');
  const end=ok=>{if(done)return;done=true;clearTimeout(tm);el.classList.add('out');setTimeout(()=>el.remove(),250);res(ok)};
  el.querySelector('.cd-x').onclick=()=>end(false);
  const tick=()=>{n--;if(n>0){b.innerHTML=`<b>${n}</b>`;tm=setTimeout(tick,1000)}else{b.innerHTML='<b class="go">VAI!</b>';el.querySelector('.cd-h').textContent='Gravando';try{NATIVE&&NATIVE.vibrate&&NATIVE.vibrate()}catch(e){}tm=setTimeout(()=>end(true),650)}};
  tm=setTimeout(tick,1000)})}
async function runBegin(type){
  if(RUN.on){openRun();return}
  if(S.active){toast('Finalize o treino de academia em andamento primeiro');return}
  const p=await askPerms();
  if(!p.loc){openSheet('Permissão de localização',`<p>Sem acesso à localização o app não consegue desenhar o percurso nem medir a distância.</p><p class="hint">Abra as configurações do Android › Apps › ATHOS › Permissões › Localização e escolha “Permitir durante o uso do app”.</p><button class="btn primary block" data-close>Entendi</button>`);return}
  if(!NATIVE.gpsOn()){openSheet('Ligue a localização',`<p>O GPS do celular está desligado. Ligue a localização para gravar o percurso.</p><div class="btns"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-s="go">Abrir configurações</button></div>`,(b,el)=>{b.querySelector('[data-s=go]').onclick=()=>{closeSheet(el);NATIVE.openLocationSettings()}});return}
  if(!(await runCountdown(type)))return;
  if(!NATIVE.runStart(type,voiceOn())){toast('Não consegui iniciar o GPS. Tente de novo.');return}
  RUN.on=true;RUN.type=type;RUN.st=null;
  if(!p.fine)toast('Localização aproximada: a distância pode sair imprecisa. Permita a localização precisa.');
  else if(!p.steps&&type!=='bike')toast('Sem permissão de atividade física: os passos serão estimados pela distância.');
  openRun();clearInterval(RUN.poll);RUN.poll=setInterval(runPoll,1000);
}
function runEl(){let el=$('#run');if(!el){el=document.createElement('section');el.id='run';el.hidden=true;document.body.appendChild(el)}return el}
function openRun(){
  const el=runEl(),bike=RUN.type==='bike';el.hidden=false;document.body.classList.add('locked');$('#activebar').hidden=true;
  el.innerHTML=`<header class="r-h"><div class="wrap"><button class="icon-btn" data-act="runMin" aria-label="Minimizar">⌄</button><div class="ttl"><p class="eyebrow" id="rGps">Procurando GPS</p><h2>${RUN_T[RUN.type]}</h2></div></div></header>
  <div class="r-body"><div class="r-map"><div id="runMap"></div><div class="r-fabs"><button class="r-fab" data-act="runLayer" id="rLayer" aria-label="Trocar tipo de mapa"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg></button><button class="r-fab" data-act="runCenter" aria-label="Centralizar no meu local"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></button></div><div class="r-wait" id="rWait">Procurando sinal do GPS… fique em lugar aberto.</div></div>
  <div class="wrap r-stats"><button class="r-exp" data-act="runMode" aria-label="Alternar números grandes e mapa"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button>
    <div class="r-big"><span class="num" id="rDist">0,00</span><span class="num r-unit">km</span><span class="chip warn" id="rPaused" hidden>Pausado</span></div>
    <div class="grid3"><div class="stat"><span class="num" id="rTime">00:00</span><small>tempo</small></div><div class="stat"><span class="num" id="rPace">—</span><small>${bike?'km/h médio':'ritmo médio'}</small></div><div class="stat"><span class="num" id="rNow">—</span><small>${bike?'km/h agora':'ritmo agora'}</small></div></div>
    <div class="grid3">${bike?'':`<div class="stat"><span class="num" id="rSteps">0</span><small id="rStepsL">passos</small></div><div class="stat"><span class="num" id="rCad">—</span><small>passos/min</small></div>`}<div class="stat"><span class="num" id="rElev">+0</span><small>m de subida</small></div></div>
    <p class="small muted" id="rSplit">${bike?'':'Parcial aparece a cada quilômetro.'}</p>
  </div></div>
  <div class="r-ctl"><div class="in">
    <div class="r-side"><button class="r-round" id="rVoice" data-act="runVoice" aria-pressed="${voiceOn()}" aria-label="Voz"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="w" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg></button><small>Voz</small></div>
    <div class="r-mid"><button class="r-go" id="rPause" data-act="runPause" aria-label="Pausar"><svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="3.6" height="14" rx="1.2"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.2"/></svg><svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l10.6-6.8a1 1 0 0 0 0-1.72L9.5 4.34A1 1 0 0 0 8 5.2z"/></svg></button></div>
    <div class="r-side"><button class="r-round" data-act="runFinish" aria-label="Finalizar"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.2"/></svg></button><small>Finalizar</small></div>
  </div></div>`;
  initRunMap();RUN.n=0;RUN.pts=[];RUN.first=true;runPoll();
}
function initRunMap(){
  if(RUN.map){try{RUN.map.remove()}catch(e){}RUN.map=null}
  if(!window.L){$('#runMap').innerHTML='<p class="hint" style="padding:16px">Mapa indisponível.</p>';return}
  RUN.map=L.map('runMap',{zoomControl:false}).setView([-14.2,-51.9],4);RUN.map.attributionControl.setPrefix(false);
  RUN.tiles=mapLayer(mapType()).addTo(RUN.map);{const b=$('#rLayer');if(b)b.setAttribute('aria-pressed',mapType()!=='osm')}RUN.lcase=L.polyline([],{color:'#000',weight:9,opacity:.35}).addTo(RUN.map);RUN.line=L.polyline([],{color:accentColor(),weight:6,opacity:1}).addTo(RUN.map);RUN.dot=null;RUN.follow=true;
  RUN.map.on('dragstart',()=>{RUN.follow=false});setTimeout(()=>{try{RUN.map.invalidateSize()}catch(e){}},120);
}
function runPoll(){
  if(!RUN.on)return;let st;try{st=JSON.parse(NATIVE.runState(RUN.n))}catch(e){return}
  if(!st.active){RUN.on=false;clearInterval(RUN.poll);const el=$('#run');if(el){el.hidden=true;el.innerHTML=''}document.body.classList.remove('locked');render();runRecoverCheck(true);return}
  RUN.st=st;RUN.type=st.type||RUN.type;
  if(st.pts&&st.pts.length){for(const p of st.pts)RUN.pts.push(p);RUN.n=st.n;if(RUN.line)(RUN.lcase&&RUN.lcase.setLatLngs(RUN.pts),RUN.line.setLatLngs(RUN.pts))}
  drawRun();
}
function rTxt(id,t){const e=document.getElementById(id);if(e&&e.textContent!==t)e.textContent=t}
function drawRun(){
  const st=RUN.st;if(!st)return;const ab=$('#abTime');if(ab)ab.textContent=fmtDur(st.moving*1000);
  const el=$('#run');if(!el||el.hidden)return;const bike=RUN.type==='bike';
  rTxt('rDist',km2(st.dist));rTxt('rTime',fmtDur(st.moving*1000));
  rTxt('rPace',bike?fmtD(st.moving?st.dist/st.moving*3.6:0):fmtPace(st.dist>20?st.moving/(st.dist/1000):0));
  rTxt('rNow',bike?fmtD(st.speed*3.6):(st.speed>0.5&&!st.paused?fmtPace(1000/st.speed):'—'));
  if(!bike){rTxt('rSteps',fmtN(st.hasSteps?st.steps:estSteps(RUN.type,st.dist)));rTxt('rStepsL',st.hasSteps?'passos':'passos (estimados)');rTxt('rCad',st.hasSteps&&st.cad?String(st.cad):'—')}
  rTxt('rElev','+'+fmtN(st.elev));
  rTxt('rGps',st.starting?'Iniciando…':!st.fix?'Sem sinal de GPS':(st.acc<=10?'GPS bom':st.acc<=25?'GPS ok':'GPS fraco')+` · ±${Math.round(st.acc)} m`);
  const w=$('#rWait');if(w)w.hidden=RUN.pts.length>0;
  const pz=$('#rPaused');if(pz){pz.hidden=!(st.paused||st.auto);pz.textContent=st.paused?'Pausado':'Pausa automática'}
  {const g=$('#rPause');if(g){g.classList.toggle('paused',!!st.paused);g.setAttribute('aria-label',st.paused?'Retomar':'Pausar')}}
  if(!bike&&st.splits&&st.splits.length){const sp=st.splits,k=sp.length-1,t=sp[k][1]-(k?sp[k-1][1]:0);rTxt('rSplit',`Km ${sp[k][0]} em ${fmtPace(t)} · média ${fmtPace(st.moving/(st.dist/1000))}/km`)}
  if(RUN.map&&RUN.pts.length){const lp=RUN.pts[RUN.pts.length-1];
    if(!RUN.dot)RUN.dot=L.circleMarker(lp,{radius:8,color:'#fff',weight:3,fillColor:accentColor(),fillOpacity:1}).addTo(RUN.map);else RUN.dot.setLatLng(lp);
    if(RUN.first){RUN.map.setView(lp,17);RUN.first=false}else if(RUN.follow)RUN.map.panTo(lp,{animate:true})}
}
function runMinimize(){const el=$('#run');if(el)el.hidden=true;if(!sheets.length)document.body.classList.remove('locked');if(RUN.map){try{RUN.map.remove()}catch(e){}RUN.map=null;RUN.dot=null}render()}
function finishRun(save){
  let fin=null;try{const t=NATIVE.runStop();fin=t?JSON.parse(t):null}catch(e){}
  RUN.on=false;clearInterval(RUN.poll);const el=$('#run');if(el){el.hidden=true;el.innerHTML=''}if(RUN.map){try{RUN.map.remove()}catch(e){}RUN.map=null}
  document.body.classList.remove('locked');
  if(save&&fin)saveRun(fin);else{try{NATIVE.runClear()}catch(e){}render();toast('Atividade descartada')}
}
function bestEffort(full,D){let best=Infinity,i=0;for(let j=0;j<full.length;j++){while(i+1<j&&full[j][4]-full[i+1][4]>=D)i++;if(full[j][4]-full[i][4]>=D)best=Math.min(best,full[j][3]-full[i][3])}return isFinite(best)&&best>0?Math.round(best):null}
function saveRun(f){
  if((f.dist||0)<30&&(f.moving||0)<30){try{NATIVE.runClear()}catch(e){}render();toast('Atividade muito curta: não foi salva.');return}
  const type=f.type||'run',full=f.pts||[];const kept=[];let lastD=-1e9;
  for(const p of full){if(p[4]-lastD>=8){kept.push([+(+p[0]).toFixed(5),+(+p[1]).toFixed(5)]);lastD=p[4]}}
  if(full.length>1){const l=full[full.length-1];kept.push([+(+l[0]).toFixed(5),+(+l[1]).toFixed(5)])}
  const w=curWeight()||70;
  const r={type,dist:Math.round(f.dist),moving:Math.round(f.moving),elapsed:Math.round(f.elapsed),steps:Math.round(f.hasSteps?f.steps:estSteps(type,f.dist)),stepsEst:!f.hasSteps,
    elev:Math.round(f.elev||0),kcal:Math.round(w*f.dist/1000*(type==='run'?1.0:type==='walk'?0.55:0.3)),splits:(f.splits||[]).map(s=>[s[0],Math.round(s[1]),s[2],Math.round(s[3])]),pts:kept,
    best1k:type==='bike'?null:bestEffort(full,1000),best5k:type==='bike'?null:bestEffort(full,5000)};
  const prev=sessList().filter(s=>s.run&&s.run.type===type).map(s=>s.run);const prs=[];
  if(prev.length){
    if(r.dist>Math.max(...prev.map(x=>x.dist)))prs.push({l:'Maior distância',v:km2(r.dist)+' km'});
    const p1=prev.map(x=>x.best1k).filter(Boolean),p5=prev.map(x=>x.best5k).filter(Boolean);
    if(r.best1k&&p1.length&&r.best1k<Math.min(...p1))prs.push({l:'Melhor 1 km',v:fmtPace(r.best1k)});
    if(r.best5k&&p5.length&&r.best5k<Math.min(...p5))prs.push({l:'Melhor 5 km',v:fmtDur(r.best5k*1000).replace(/^00:/,'')});
  }
  r.prs=prs;
  const start=f.start||Date.now()-r.elapsed*1000;
  const s={id:newId('s'),date:ymd(new Date(start)),ts:start,end:f.end||Date.now(),name:RUN_T[type]||'Atividade',exercises:[],run:r};
  S.sessions[s.id]=s;store.mark(s.id,0);flushLocal();try{NATIVE.runClear()}catch(e){}
  render();runDetail(s,true);
}
function runRecoverCheck(died){
  let f=null;try{const t=NATIVE.runRecovered();f=t?JSON.parse(t):null}catch(e){}
  if(!f){if(died)toast('A gravação foi interrompida.');return}
  const nm=(RUN_T[f.type]||'Atividade').toLowerCase();
  openSheet('Atividade interrompida',`<p>Uma ${esc(nm)} de ${km2(f.dist||0)} km foi interrompida antes de ser salva (o Android pode ter fechado o app).</p><div class="btns"><button class="btn danger" data-s="no">Descartar</button><button class="btn primary" data-s="yes">Salvar</button></div>`,(b,el)=>{
    b.onclick=e=>{const x=e.target.closest('[data-s]');if(!x)return;closeSheet(el);if(x.dataset.s==='yes')saveRun(f);else{try{NATIVE.runClear()}catch(err){}}}});
}
window.mountRouteMap=function(box,pts){
  if(!window.L||!box||!pts||pts.length<2)return;box.innerHTML='';
  const m=L.map(box,{zoomControl:false});m.attributionControl.setPrefix(false);osmLayer().addTo(m);
  const pl=(L.polyline(pts,{color:'#000',weight:8,opacity:.35}).addTo(m),L.polyline(pts,{color:accentColor(),weight:5}).addTo(m));
  L.circleMarker(pts[0],{radius:6,color:'#fff',weight:2,fillColor:'#1B8A50',fillOpacity:1}).addTo(m);
  L.circleMarker(pts[pts.length-1],{radius:6,color:'#fff',weight:2,fillColor:'#C9372C',fillOpacity:1}).addTo(m);
  m.fitBounds(pl.getBounds(),{padding:[18,18]});setTimeout(()=>{try{m.invalidateSize();m.fitBounds(pl.getBounds(),{padding:[18,18]})}catch(e){}},150);
};
{
  const _render=render;
  render=function(){_render();const ab=$('#activebar');if(!ab)return;
    if(RUN.on){const vis=$('#run')&&!$('#run').hidden;ab.hidden=!!vis;ab.firstElementChild.textContent=(RUN_T[RUN.type]||'Atividade')+' em andamento';if(RUN.st)$('#abTime').textContent=fmtDur(RUN.st.moving*1000)}
    else ab.firstElementChild.textContent='Treino em andamento'};
  const _open=ACT.openActive,_start=ACT.start;
  Object.assign(ACT,{
    openActive:()=>{if(RUN.on)openRun();else _open()},
    start:el=>{if(RUN.on){toast('Finalize a atividade com GPS primeiro');return}_start(el)},
    runStart:el=>runBegin(el.dataset.type||'run'),
    runMin:runMinimize,
    runPause:()=>{if(!RUN.st)return;if(RUN.st.paused)NATIVE.runResume();else NATIVE.runPause();runPoll()},
    runVoice:el=>{const v=!voiceOn();lsSet('ficha.voice',v);try{NATIVE.runVoice(v)}catch(e){}el.setAttribute('aria-pressed',v);toast(v?'Voz ligada':'Voz desligada')},
    runMode:()=>{const el=$('#run');if(!el)return;el.dataset.mode=el.dataset.mode==='num'?'map':'num';if(el.dataset.mode==='map')setTimeout(()=>{try{RUN.map.invalidateSize()}catch(e){}},60)},
    runLayer:()=>mapTypeSheet(),
    runCenter:()=>{RUN.follow=true;if(RUN.map&&RUN.pts.length)RUN.map.setView(RUN.pts[RUN.pts.length-1],Math.max(RUN.map.getZoom(),16))},
    runFinish:()=>openSheet('Finalizar atividade?',`<p>${RUN.st?`${km2(RUN.st.dist)} km em ${fmtDur(RUN.st.moving*1000).replace(/^00:/,'')}.`:''} Salvar no histórico?</p><div class="btns"><button class="btn" data-close>Continuar gravando</button></div><div class="btns"><button class="btn danger" data-s="no">Descartar</button><button class="btn primary" data-s="yes">Salvar</button></div>`,(b,el)=>{
      b.onclick=e=>{const x=e.target.closest('[data-s]');if(!x)return;if(x.dataset.s==='no'){b.innerHTML=`<p>Descartar esta atividade? O percurso gravado será perdido.</p><div class="btns"><button class="btn" data-close>Voltar</button><button class="btn danger" data-s="really">Descartar</button></div>`;return}
        closeSheet(el);finishRun(x.dataset.s!=='really')}})
  });
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&RUN.on)runPoll()});
setTimeout(()=>{if(!window.RUNAPI)return;try{if(NATIVE.runActive()){RUN.on=true;const st=JSON.parse(NATIVE.runState(0));RUN.type=st.type||'run';RUN.st=st;clearInterval(RUN.poll);RUN.poll=setInterval(runPoll,1000);render();openRun();return}}catch(e){}runRecoverCheck(false)},350);
