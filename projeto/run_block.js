
/* ---------- gravador de atividades com GPS (app Android) ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
#run{position:fixed;inset:0;z-index:31;background:var(--bg);display:flex;flex-direction:column}
.r-h{padding-top:env(safe-area-inset-top,0px);border-bottom:1px solid var(--line);flex:none}
.r-h .wrap{display:flex;align-items:center;gap:10px;padding-block:8px}
.r-h .ttl{flex:1;min-width:0}.r-h h2{font-size:21px}
.r-map{position:relative;flex:1 1 auto;min-height:170px}
#runMap{position:absolute;inset:0;background:var(--surface2)}
.r-center{position:absolute;right:12px;bottom:12px;z-index:500}
.r-wait{position:absolute;left:12px;top:12px;z-index:500;background:var(--surface);color:var(--fg);padding:6px 10px;border-radius:9px;font-weight:600;font-size:13px;box-shadow:0 2px 8px rgb(0 0 0 / .15)}
.r-stats{display:flex;flex-direction:column;gap:12px;padding-block:12px;flex:none}
.r-big{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.r-big .num{font-size:76px;line-height:.85}.r-big .r-unit{font-size:26px}
.r-stats .stat .num{font-size:28px}
.r-ctl{flex:none;background:var(--surface);border-top:1px solid var(--line);padding:10px max(16px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
.r-ctl .in{max-width:580px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.r-ctl .btn{min-height:56px;font-size:17px}
.leaflet-container{font-family:var(--body);background:var(--surface2)}
:root[data-theme="dark"] .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.85) contrast(.9)}
@media (max-height:640px){.r-big .num{font-size:58px}.r-stats{gap:8px;padding-block:8px}}
</style>`);
const RUN={on:false,type:'run',n:0,pts:[],st:null,map:null,line:null,dot:null,follow:true,poll:null,first:true};
window.RUNAPI=!!(NATIVE&&NATIVE.runStart);
const PERMW={};let permN=0;
window.androidPermDone=(id,res)=>{const f=PERMW[id];if(f){delete PERMW[id];f(res||{})}};
function askPerms(){return new Promise(r=>{const id='p'+(++permN);PERMW[id]=r;try{NATIVE.runPermissions(id)}catch(e){delete PERMW[id];r({})}})}
const accentColor=()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#1F4FDE';
function osmLayer(){return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'})}
function estSteps(type,dist){if(type==='bike')return 0;const h=(S.profile.height||170)/100;return dist/(type==='run'?h*0.65:h*0.415)}
const voiceOn=()=>lsGet('ficha.voice')!==false;

async function runBegin(type){
  if(RUN.on){openRun();return}
  if(S.active){toast('Finalize o treino de academia em andamento primeiro');return}
  const p=await askPerms();
  if(!p.loc){openSheet('Permissão de localização',`<p>Sem acesso à localização o app não consegue desenhar o percurso nem medir a distância.</p><p class="hint">Abra as configurações do Android › Apps › ATHOS › Permissões › Localização e escolha “Permitir durante o uso do app”.</p><button class="btn primary block" data-close>Entendi</button>`);return}
  if(!NATIVE.gpsOn()){openSheet('Ligue a localização',`<p>O GPS do celular está desligado. Ligue a localização para gravar o percurso.</p><div class="btns"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-s="go">Abrir configurações</button></div>`,(b,el)=>{b.querySelector('[data-s=go]').onclick=()=>{closeSheet(el);NATIVE.openLocationSettings()}});return}
  if(!NATIVE.runStart(type,voiceOn())){toast('Não consegui iniciar o GPS. Tente de novo.');return}
  RUN.on=true;RUN.type=type;RUN.st=null;
  if(!p.fine)toast('Localização aproximada: a distância pode sair imprecisa. Permita a localização precisa.');
  else if(!p.steps&&type!=='bike')toast('Sem permissão de atividade física: os passos serão estimados pela distância.');
  openRun();clearInterval(RUN.poll);RUN.poll=setInterval(runPoll,1000);
}
function runEl(){let el=$('#run');if(!el){el=document.createElement('section');el.id='run';el.hidden=true;document.body.appendChild(el)}return el}
function openRun(){
  const el=runEl(),bike=RUN.type==='bike';el.hidden=false;document.body.classList.add('locked');$('#activebar').hidden=true;
  el.innerHTML=`<header class="r-h"><div class="wrap"><button class="icon-btn" data-act="runMin" aria-label="Minimizar">⌄</button><div class="ttl"><p class="eyebrow" id="rGps">Procurando GPS</p><h2>${RUN_T[RUN.type]}</h2></div><button class="chip" id="rVoice" data-act="runVoice" aria-pressed="${voiceOn()}">Voz ${voiceOn()?'ligada':'desligada'}</button></div></header>
  <div class="r-map"><div id="runMap"></div><button class="btn sm r-center" data-act="runCenter">Centralizar</button><div class="r-wait" id="rWait">Procurando sinal do GPS… fique em lugar aberto.</div></div>
  <div class="wrap r-stats">
    <div class="r-big"><span class="num" id="rDist">0,00</span><span class="num r-unit">km</span><span class="chip warn" id="rPaused" hidden>Pausado</span></div>
    <div class="grid3"><div class="stat"><span class="num" id="rTime">00:00</span><small>tempo</small></div><div class="stat"><span class="num" id="rPace">—</span><small>${bike?'km/h médio':'ritmo médio'}</small></div><div class="stat"><span class="num" id="rNow">—</span><small>${bike?'km/h agora':'ritmo agora'}</small></div></div>
    <div class="grid3">${bike?'':`<div class="stat"><span class="num" id="rSteps">0</span><small id="rStepsL">passos</small></div><div class="stat"><span class="num" id="rCad">—</span><small>passos/min</small></div>`}<div class="stat"><span class="num" id="rElev">+0</span><small>m de subida</small></div></div>
    <p class="small muted" id="rSplit">${bike?'':'Parcial aparece a cada quilômetro.'}</p>
  </div>
  <div class="r-ctl"><div class="in"><button class="btn" id="rPause" data-act="runPause">Pausar</button><button class="btn primary" data-act="runFinish">Finalizar</button></div></div>`;
  initRunMap();RUN.n=0;RUN.pts=[];RUN.first=true;runPoll();
}
function initRunMap(){
  if(RUN.map){try{RUN.map.remove()}catch(e){}RUN.map=null}
  if(!window.L){$('#runMap').innerHTML='<p class="hint" style="padding:16px">Mapa indisponível.</p>';return}
  RUN.map=L.map('runMap',{zoomControl:false}).setView([-14.2,-51.9],4);RUN.map.attributionControl.setPrefix(false);
  osmLayer().addTo(RUN.map);RUN.line=L.polyline([],{color:accentColor(),weight:5,opacity:.95}).addTo(RUN.map);RUN.dot=null;RUN.follow=true;
  RUN.map.on('dragstart',()=>{RUN.follow=false});setTimeout(()=>{try{RUN.map.invalidateSize()}catch(e){}},120);
}
function runPoll(){
  if(!RUN.on)return;let st;try{st=JSON.parse(NATIVE.runState(RUN.n))}catch(e){return}
  if(!st.active){RUN.on=false;clearInterval(RUN.poll);const el=$('#run');if(el){el.hidden=true;el.innerHTML=''}document.body.classList.remove('locked');render();runRecoverCheck(true);return}
  RUN.st=st;RUN.type=st.type||RUN.type;
  if(st.pts&&st.pts.length){for(const p of st.pts)RUN.pts.push(p);RUN.n=st.n;if(RUN.line)RUN.line.setLatLngs(RUN.pts)}
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
  rTxt('rPause',st.paused?'Retomar':'Pausar');
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
  const pl=L.polyline(pts,{color:accentColor(),weight:4}).addTo(m);
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
    runVoice:el=>{const v=!voiceOn();lsSet('ficha.voice',v);try{NATIVE.runVoice(v)}catch(e){}el.setAttribute('aria-pressed',v);el.textContent='Voz '+(v?'ligada':'desligada')},
    runCenter:()=>{RUN.follow=true;if(RUN.map&&RUN.pts.length)RUN.map.setView(RUN.pts[RUN.pts.length-1],Math.max(RUN.map.getZoom(),16))},
    runFinish:()=>openSheet('Finalizar atividade?',`<p>${RUN.st?`${km2(RUN.st.dist)} km em ${fmtDur(RUN.st.moving*1000).replace(/^00:/,'')}.`:''} Salvar no histórico?</p><div class="btns"><button class="btn" data-close>Continuar gravando</button></div><div class="btns"><button class="btn danger" data-s="no">Descartar</button><button class="btn primary" data-s="yes">Salvar</button></div>`,(b,el)=>{
      b.onclick=e=>{const x=e.target.closest('[data-s]');if(!x)return;if(x.dataset.s==='no'){b.innerHTML=`<p>Descartar esta atividade? O percurso gravado será perdido.</p><div class="btns"><button class="btn" data-close>Voltar</button><button class="btn danger" data-s="really">Descartar</button></div>`;return}
        closeSheet(el);finishRun(x.dataset.s!=='really')}})
  });
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&RUN.on)runPoll()});
setTimeout(()=>{if(!window.RUNAPI)return;try{if(NATIVE.runActive()){RUN.on=true;const st=JSON.parse(NATIVE.runState(0));RUN.type=st.type||'run';RUN.st=st;clearInterval(RUN.poll);RUN.poll=setInterval(runPoll,1000);render();openRun();return}}catch(e){}runRecoverCheck(false)},350);
