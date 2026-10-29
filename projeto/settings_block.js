/* ---------- Configurações (engrenagem no topo) ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
.gear{position:relative;border:1px solid var(--cardline);background:var(--surface);width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:var(--fg);flex:none}
.gear svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.cfg-h{font:800 15px var(--display);text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:10px 2px -4px}
.cfg-h:first-child{margin-top:0}
.cfg .card{background:var(--surface)}
.cfg-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.cfg-row .t{min-width:0}.cfg-row .t b{display:block;font-weight:600}.cfg-row .t small{color:var(--muted);font-size:13px}
.okdot{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:13px}
.okdot i{width:8px;height:8px;border-radius:50%;background:var(--muted)}
.okdot.on{color:var(--green)}.okdot.on i{background:var(--green)}
.okdot.off{color:var(--warn)}.okdot.off i{background:var(--warn)}
.cfg-link{width:100%;margin-top:4px}
</style>`);
/* --- tema: automático, escuro ou claro --- */
function cfgTheme(){try{return localStorage.getItem('athos.theme')||'auto'}catch(e){return'auto'}}
function applyTheme(t){t=t||cfgTheme();const root=document.documentElement;let dark;
  if(t==='auto'){if(NATIVE&&NATIVE.isDark){dark=!!NATIVE.isDark();root.setAttribute('data-theme',dark?'dark':'light')}else{root.removeAttribute('data-theme');dark=matchMedia('(prefers-color-scheme: dark)').matches}}
  else{dark=t==='dark';root.setAttribute('data-theme',t)}
  try{NATIVE&&NATIVE.setBars&&NATIVE.setBars(dark)}catch(e){}
  const mc=document.querySelectorAll('meta[name="theme-color"]');mc.forEach(m=>{if(t!=='auto'){m.setAttribute('content',dark?'#000000':'#EEEFF1');m.removeAttribute('media')}})}
applyTheme();

/* --- botão de engrenagem --- */
const GEAR='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
function cfgGear(){if($('#gear'))return;const sy=$('#sync');if(!sy)return;let w=sy.closest('.top-r');
  if(!w){w=document.createElement('div');w.className='top-r';sy.parentNode.insertBefore(w,sy);w.appendChild(sy)}
  sy.insertAdjacentHTML('afterend',`<button class="gear" id="gear" aria-label="Configurações">${GEAR}</button>`);$('#gear').addEventListener('click',cfgOpen)}
cfgGear();

/* --- conteúdo --- */
const CFG={el:null};
function cfgMusic(){if(!NATIVE||!NATIVE.musicState)return'';let st={};try{st=JSON.parse(NATIVE.musicState())}catch(e){}
  return`<div class="card"><div class="cfg-row"><span class="t"><b>Nome e capa da música</b><small>Mostra a música do YouTube Music, Spotify e outros no treino e na corrida.</small></span>
   <span class="okdot ${st.perm?'on':'off'}"><i></i>${st.perm?'Liberado':'Desligado'}</span></div>
   ${st.perm?`<p class="hint">Tudo certo. Os controles ⏮ ⏯ ⏭ aparecem no treino e na corrida.</p>`:`<button class="btn primary" data-act="cfgMusicPerm">Liberar nome da música</button><p class="hint">Os botões ⏮ ⏯ ⏭ funcionam mesmo sem isso.</p>`}
   <label class="swr" style="border-top:1px solid var(--line);margin-top:4px;padding-top:12px"><span class="t"><b>Mini player flutuante</b><small>Botões de música pelo app todo enquanto toca. Arraste para mudar de lugar.</small></span><input type="checkbox" class="sw" data-cfg="mfab" ${mfOn()?'checked':''}></label></div>`}
function cfgTraining(){const p=S.profile;
  return`<div class="card"><h3>Descanso entre séries</h3><div class="chips">${[45,60,90,120,180].map(s=>`<button class="chip" data-act="restDef" data-s="${s}" aria-pressed="${p.rest===s}">${s<60?s+' s':(s/60).toLocaleString('pt-BR')+' min'}</button>`).join('')}</div>
   ${NATIVE&&NATIVE.runStart?`<label class="swr" style="border-top:1px solid var(--line);margin-top:4px;padding-top:12px"><span class="t"><b>Voz na corrida</b><small>Fala a distância e o ritmo a cada quilômetro</small></span><input type="checkbox" class="sw" data-cfg="voice" ${lsGet('ficha.voice')!==false?'checked':''}></label>`:''}</div>`}
function cfgLook(){const t=cfgTheme();const o=[['auto','Automático'],['dark','Escuro'],['light','Claro']];
  return`<div class="card"><h3>Tema</h3><div class="seg" role="group" aria-label="Tema">${o.map(([k,l])=>`<button data-act="cfgTheme" data-k="${k}" aria-pressed="${t===k}">${l}</button>`).join('')}</div><p class="hint">Automático segue o modo escuro do celular.</p></div>`}
function cfgAbout(){const v=NATIVE&&NATIVE.appVersionName?NATIVE.appVersionName():'';
  return`<div class="card"><div class="cfg-row"><span class="t"><b>ATHOS ${esc(v||'')}</b><small>${NATIVE?'App para Android':'Versão web: atualiza sozinha'}</small></span>${NATIVE&&NATIVE.updateDownload?`<button class="btn sm" data-act="cfgUpdate">Procurar atualização</button>`:''}</div></div>`}
function cfgHtml(){let h='<div class="cfg view" style="padding:0;gap:12px">';
  if(SOC&&SOC.user&&typeof accCard==='function')h+=`<p class="cfg-h">Conta</p>${accCard()}`;
  const nc=typeof nCard==='function'?nCard():'';if(nc)h+=`<p class="cfg-h">Notificações</p>${nc.replace('<h3>Notificações</h3>','')}`;
  const mu=cfgMusic();if(mu)h+=`<p class="cfg-h">Música</p>${mu}`;
  h+=`<p class="cfg-h">Treino</p>${cfgTraining()}`;
  h+=`<p class="cfg-h">Aparência</p>${cfgLook()}`;
  if(typeof AIHOST!=='undefined'&&AIHOST&&typeof aiCard==='function')h+=`<p class="cfg-h">Inteligência artificial</p>${aiCard()}`;
  h+=`<p class="cfg-h">Ajuda</p><div class="card"><button class="btn block" data-act="cfgTour">Ver o tutorial de novo</button></div>`;
  h+=`<p class="cfg-h">Sobre</p>${cfgAbout()}<p class="hint" style="text-align:center">Estimativas de calorias e macros são aproximadas e não substituem nutricionista ou médico.</p></div>`;
  return h}
function cfgDraw(){if(!CFG.el||!CFG.el.isConnected)return;const b=CFG.el.querySelector('.sheet-b');if(!b)return;const y=b.scrollTop;b.innerHTML=cfgHtml();b.scrollTop=y}
function cfgOpen(){CFG.el=openSheet('Configurações',cfgHtml(),(b,el)=>{el.querySelector('.sheet').style.maxHeight='96%'})}
{const _r=render;render=function(){_r.apply(this,arguments);cfgDraw()}}
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.cfg==='mfab'){try{localStorage.setItem('athos.mfab',t.checked?'1':'0')}catch(_){}mfTick();return}if(t.dataset&&t.dataset.cfg==='voice'){lsSet('ficha.voice',t.checked);try{NATIVE.runVoice&&NATIVE.runVoice(t.checked)}catch(_){}}});
window.addEventListener('focus',()=>setTimeout(cfgDraw,400));
Object.assign(ACT,{
  cfgTheme:el=>{try{localStorage.setItem('athos.theme',el.dataset.k)}catch(e){}applyTheme(el.dataset.k);render()},
  cfgMusicPerm:()=>{try{muPermSheet()}catch(e){NATIVE.musicPerm()}},
  cfgTour:()=>{closeSheet(CFG.el);tourStart()},
  cfgUpdate:async el=>{el.disabled=true;el.textContent='Procurando…';const r=await updCheck(true);el.disabled=false;el.textContent='Procurar atualização';
    if(r==='none')toast('Você já está na versão mais nova');else if(r==='error')toast('Não consegui verificar. Confira a internet.')},
  cfgOpen:()=>cfgOpen()});
/* Perfil fica só com dados e metas */
{const _vp=VIEWS.perfil;VIEWS.perfil=function(){let h=_vp.apply(this,arguments);const k='<div class="card"><h3>Descanso entre séries</h3>';const i=h.indexOf(k);
  if(i>=0){const j=h.indexOf('</div></div>',i);if(j>0)h=h.slice(0,i)+h.slice(j+12)}
  h=h.replace('<p class="hint" style="text-align:center">Estimativas de calorias e macros são aproximadas e não substituem nutricionista ou médico.</p>','');
  return h+`<button class="btn block cfg-link" data-act="cfgOpen">${GEAR.replace('<svg ','<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2" ')} Configurações</button>`}}
