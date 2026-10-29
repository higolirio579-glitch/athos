/* ---------- música no treino: YouTube Music, Spotify e outros players ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
.mu{display:flex;align-items:center;gap:12px;background:var(--ink);color:#fff;border-radius:18px;padding:10px 10px 10px 10px;min-width:0;border:1px solid var(--ink2)}
.mu .art{width:48px;height:48px;border-radius:10px;flex:none;background:#26272B center/cover no-repeat;display:grid;place-items:center;color:var(--accent)}
.mu .art svg{width:22px;height:22px;fill:currentColor}
.mu .tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.mu .tx b{font-weight:700;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mu .tx small{color:#A3A8B2;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mu .tx button{border:0;background:none;color:var(--accent);font:700 12.5px var(--body);padding:0;text-align:left}
.mu .ctl{display:flex;align-items:center;gap:2px;flex:none}
.mu .ctl button{width:40px;height:40px;border:0;border-radius:50%;background:none;color:#fff;display:grid;place-items:center}
.mu .ctl button.pp{background:var(--accent);color:#000;width:44px;height:44px}
.mu .ctl svg{width:20px;height:20px;fill:currentColor}
.mu-pl{display:flex;align-items:center;gap:8px;border:0;background:var(--accent-soft);color:var(--accent-tx);font:700 13.5px var(--body);border-radius:12px;padding:9px 12px;width:100%;justify-content:center}
.mu-pl svg{width:16px;height:16px;fill:currentColor}
.r-stats .mwrap{margin-top:6px}
.mwrap{display:flex;flex-direction:column;gap:8px}
</style>`);
const MU={st:null,t:null};
const MI={
  note:'<svg viewBox="0 0 24 24"><path d="M9 17.5V5l11-2v12.5a2.5 2.5 0 1 1-2-2.45V7.2l-7 1.3v9a2.5 2.5 0 1 1-2-2.45z"/></svg>',
  prev:'<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM9.5 12L19 5v14z"/></svg>',
  next:'<svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM14.5 12L5 19V5z"/></svg>',
  play:'<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
  pause:'<svg viewBox="0 0 24 24"><path d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z"/></svg>'};
const MAPP={'com.google.android.apps.youtube.music':'YouTube Music','com.spotify.music':'Spotify','com.google.android.youtube':'YouTube','deezer.android.app':'Deezer','com.amazon.mp3':'Amazon Music','com.apple.android.music':'Apple Music','com.soundcloud.android':'SoundCloud'};
function muPoll(){if(!NATIVE||!NATIVE.musicState)return null;try{MU.st=JSON.parse(NATIVE.musicState())}catch(e){MU.st=null}return MU.st}
function muInner(){const st=MU.st||{};const playing=!!st.playing;
  let tx;
  if(st.title)tx=`<b>${esc(st.title)}</b><small>${esc(st.artist||MAPP[st.pkg]||'')}</small>`;
  else if(!st.perm)tx=`<b>${playing||st.active?'Música tocando':'Música'}</b><button data-mu="perm">Mostrar o nome da música</button>`;
  else tx=`<b>Nenhuma música tocando</b><small>Abra o YouTube Music ou o Spotify</small>`;
  const art=st.art?`style="background-image:url('${st.art}')"`:'';
  return`<span class="art" ${art}>${st.art?'':MI.note}</span><span class="tx">${tx}</span>
   <span class="ctl"><button data-mu="prev" aria-label="Música anterior">${MI.prev}</button><button class="pp" data-mu="toggle" aria-label="${playing?'Pausar':'Tocar'}">${playing?MI.pause:MI.play}</button><button data-mu="next" aria-label="Próxima música">${MI.next}</button></span>`}
musicCard=function(a){const pl=a&&a.music?`<button class="mu-pl" data-mu="pl" data-url="${esc(a.music)}">${MI.play} Tocar a playlist do treino no ${musicApp(a.music)}</button>`:'';
  if(!NATIVE||!NATIVE.musicState)return pl?`<div class="mwrap">${pl}</div>`:'';
  muPoll();return`<div class="mwrap"><div class="mu" role="group" aria-label="Música">${muInner()}</div>${pl}</div>`};
function muDraw(){const els=document.querySelectorAll('.mu');if(!els.length)return false;muPoll();const h=muInner();els.forEach(e=>{if(e.innerHTML!==h)e.innerHTML=h});return true}
setInterval(()=>{if(document.hidden)return;muDraw()},2000);
function muOpen(url){if(!url)return;if(NATIVE&&NATIVE.openUrl)NATIVE.openUrl(url);else window.open(url,'_blank','noopener')}
function muPermSheet(){openSheet('Mostrar a música tocando',`<p>Para mostrar o nome e a capa da música, o Android precisa liberar o ATHOS a ver o player que está tocando.</p>
  <ol class="tips"><li>Toque em <b>Abrir configurações</b> e ative o <b>ATHOS</b>.</li><li>Se aparecer <b>“Configuração restrita”</b>: abra os <b>detalhes do app ATHOS</b>, toque nos <b>⋮</b> no canto de cima e em <b>Permitir configurações restritas</b>. Depois repita o passo 1.</li></ol>
  <p class="hint">O ATHOS só lê o nome da música, o artista e a capa. Ele não lê suas notificações nem mensagens. Os botões ⏮ ⏯ ⏭ funcionam mesmo sem isso.</p>
  <div class="btns"><button class="btn primary" data-s="open">Abrir configurações</button><button class="btn" data-s="app">Detalhes do app</button></div>`,(b,el)=>{
    b.addEventListener('click',e=>{const x=e.target.closest('[data-s]');if(!x)return;if(x.dataset.s==='open')NATIVE.musicPerm();else NATIVE.appSettings();closeSheet(el)})})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-mu]');if(!b)return;e.preventDefault();const k=b.dataset.mu;
  if(k==='perm'){muPermSheet();return}
  if(k==='pl'){muOpen(b.dataset.url);return}
  if(NATIVE&&NATIVE.musicKey){NATIVE.musicKey(k);try{NATIVE.vibrate&&0}catch(_){}setTimeout(muDraw,350);setTimeout(muDraw,1200)}});
/* também na tela da corrida */
{const _or=openRun;openRun=function(){_or.apply(this,arguments);const r=document.querySelector('#run .r-stats');if(r&&NATIVE&&NATIVE.musicState&&!r.querySelector('.mwrap'))r.insertAdjacentHTML('beforeend',musicCard(null))}}
window.addEventListener('focus',()=>setTimeout(muDraw,300));

/* ---------- mini player flutuante (aparece só com música tocando) ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
#mfab{position:fixed;z-index:24;display:flex;align-items:center;gap:2px;padding:5px;border-radius:30px;background:var(--ink);border:1px solid var(--ink2);color:#fff;
  box-shadow:0 10px 28px -8px rgb(0 0 0 / .55);touch-action:none;user-select:none;-webkit-user-select:none;transition:opacity .25s,transform .25s}
#mfab[hidden]{display:none}
#mfab.drag{transition:none;opacity:.92}
#mfab .fa{width:38px;height:38px;border-radius:50%;flex:none;background:#26272B center/cover no-repeat;display:grid;place-items:center;color:var(--accent);border:0;padding:0}
#mfab .fa svg{width:18px;height:18px;fill:currentColor}
#mfab .fa.spin{animation:mfspin 8s linear infinite}
@keyframes mfspin{to{transform:rotate(360deg)}}
#mfab button.k{width:34px;height:38px;border:0;background:none;color:#fff;display:grid;place-items:center;padding:0;border-radius:50%}
#mfab button.k svg{width:17px;height:17px;fill:currentColor}
#mfab button.k.pp{width:38px;background:var(--accent);color:#000}
#mftip{position:fixed;z-index:24;max-width:min(260px,70vw);background:var(--ink);color:#fff;border:1px solid var(--ink2);border-radius:14px;padding:8px 12px;font-size:13px;line-height:1.35;box-shadow:0 10px 28px -8px rgb(0 0 0 / .55)}
#mftip b{display:block;font-size:14px}#mftip small{color:#A3A8B2}
#mfx{position:fixed;z-index:23;left:50%;bottom:calc(100px + env(safe-area-inset-bottom,0px));width:58px;height:58px;margin-left:-29px;border-radius:50%;background:rgb(0 0 0 / .7);border:2px solid rgb(255 255 255 / .35);color:#fff;display:grid;place-items:center;font-size:22px;font-weight:700;transform:scale(.6);opacity:0;transition:transform .2s,opacity .2s,background .2s;pointer-events:none}
#mfx.show{opacity:1;transform:scale(1)}#mfx.hot{background:var(--red);border-color:var(--red);transform:scale(1.18)}
#mfab.gone{opacity:0;transform:translateY(80px) scale(.6)}
body.locked #mfab,body.touring #mfab,body.locked #mftip{display:none}
@media (prefers-reduced-motion:reduce){#mfab .fa.spin{animation:none}}
</style>`);
const MF={el:null,last:0,pos:null,tipT:null,dismissed:false,quiet:0};
function mfOn(){try{return localStorage.getItem('athos.mfab')!=='0'}catch(e){return true}}
function mfPos(){if(MF.pos)return MF.pos;try{MF.pos=JSON.parse(localStorage.getItem('athos.mfpos')||'null')}catch(e){}return MF.pos||(MF.pos={side:'r',bottom:96})}
function mfPlace(){const el=MF.el;if(!el)return;const p=mfPos();const max=window.innerHeight-el.offsetHeight-60;const b=Math.max(70,Math.min(max,p.bottom));
  el.style.top='auto';el.style.bottom=`calc(${b}px + env(safe-area-inset-bottom,0px))`;
  if(p.side==='l'){el.style.left='max(12px,env(safe-area-inset-left,0px))';el.style.right='auto'}else{el.style.right='max(12px,env(safe-area-inset-right,0px))';el.style.left='auto'}}
function mfBuild(){if(MF.el)return MF.el;const el=document.createElement('div');el.id='mfab';el.hidden=true;el.setAttribute('role','group');el.setAttribute('aria-label','Música');document.body.appendChild(el);MF.el=el;
  let sx=0,sy=0,ox=0,oy=0,moved=false,down=false,id=null,onArt=false;
  el.addEventListener('pointerdown',e=>{if(e.target.closest('button.k'))return;down=true;moved=false;onArt=!!e.target.closest('.fa');id=e.pointerId;const r=el.getBoundingClientRect();sx=e.clientX;sy=e.clientY;ox=r.left;oy=r.top;try{el.setPointerCapture(id)}catch(_){}});
  el.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(!moved&&Math.hypot(dx,dy)<7)return;
    if(!moved){moved=true;el.classList.add('drag');mfTip(false);mfX().classList.add('show')}el.style.left=Math.max(4,Math.min(innerWidth-el.offsetWidth-4,ox+dx))+'px';el.style.right='auto';el.style.top=Math.max(40,Math.min(innerHeight-el.offsetHeight/2,oy+dy))+'px';el.style.bottom='auto';mfX().classList.toggle('hot',mfHot())});
  const up=e=>{if(!down)return;down=false;el.classList.remove('drag');try{el.releasePointerCapture(id)}catch(_){}
    if(moved){const x=mfX();const hot=mfHot();x.classList.remove('show','hot');if(hot){mfDismiss();return}const r=el.getBoundingClientRect();MF.pos={side:r.left+r.width/2<innerWidth/2?'l':'r',bottom:Math.round(innerHeight-r.bottom)};try{localStorage.setItem('athos.mfpos',JSON.stringify(MF.pos))}catch(_){}mfPlace()}
    else if(onArt)mfTip(true)};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('click',e=>{const b=e.target.closest('button.k');if(!b)return;e.stopPropagation();NATIVE.musicKey(b.dataset.k);setTimeout(mfTick,350);setTimeout(mfTick,1200)});
  return el}
function mfX(){let x=$('#mfx');if(!x){x=document.createElement('div');x.id='mfx';x.setAttribute('aria-hidden','true');x.textContent='✕';document.body.appendChild(x)}return x}
function mfHot(){const el=MF.el,r=el.getBoundingClientRect(),x=mfX().getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;
  return r.bottom>innerHeight-8||Math.hypot(cx-(x.left+x.width/2),cy-(x.top+x.height/2))<90}
function mfDismiss(){const el=MF.el;MF.dismissed=true;MF.quiet=0;el.classList.add('gone');try{NATIVE.vibrate&&0}catch(e){}
  setTimeout(()=>{el.hidden=true;el.classList.remove('gone');mfPlace()},260);toast('Mini player escondido. Ele volta quando você tocar música de novo.')}
function mfTip(show){let t=$('#mftip');clearTimeout(MF.tipT);if(!show){if(t)t.remove();return}const st=MU.st||{};
  if(!t){t=document.createElement('div');t.id='mftip';document.body.appendChild(t)}
  t.innerHTML=st.title?`<b>${esc(st.title)}</b><small>${esc(st.artist||MAPP[st.pkg]||'')}</small>`:`<b>Música tocando</b><small>Libere o nome da música em ⚙ Configurações</small>`;
  const r=MF.el.getBoundingClientRect();t.style.bottom=(innerHeight-r.top+8)+'px';if(mfPos().side==='l'){t.style.left=r.left+'px';t.style.right='auto'}else{t.style.right=(innerWidth-r.right)+'px';t.style.left='auto'}
  MF.tipT=setTimeout(()=>mfTip(false),3200)}
function mfTick(){if(!NATIVE||!NATIVE.musicState)return;const st=muPoll()||{};const on=!!(st.playing||st.active);if(on)MF.last=Date.now();
  if(MF.dismissed){if(on){MF.quiet=0}else if(++MF.quiet>=3){MF.dismissed=false;MF.last=0}if(MF.dismissed){if(MF.el)MF.el.hidden=true;return}}
  const show=mfOn()&&(on||Date.now()-MF.last<90000)&&MF.last>0;const el=mfBuild();
  if(!show){el.hidden=true;mfTip(false);return}
  const playing=!!st.playing||!!st.active;
  const h=`<button class="fa${playing&&st.art?' spin':''}" aria-label="Ver música" ${st.art?`style="background-image:url('${st.art}')"`:''}>${st.art?'':MI.note}</button><button class="k" data-k="prev" aria-label="Música anterior">${MI.prev}</button><button class="k pp" data-k="toggle" aria-label="${playing?'Pausar':'Tocar'}">${playing?MI.pause:MI.play}</button><button class="k" data-k="next" aria-label="Próxima música">${MI.next}</button>`;
  if(el.dataset.h!==h){el.innerHTML=h;el.dataset.h=h}
  if(el.hidden){el.hidden=false;mfPlace()}}
if(NATIVE&&NATIVE.musicState){setInterval(()=>{if(!document.hidden)mfTick()},2000);setTimeout(mfTick,1500);window.addEventListener('resize',mfPlace)}
