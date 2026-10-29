/* ---------- atualização OBRIGATÓRIA do APK ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
#updGate{position:fixed;inset:0;z-index:200;background:var(--bg);overflow:auto;display:flex;flex-direction:column;justify-content:center;
  padding:calc(env(safe-area-inset-top,0px) + 24px) max(20px,env(safe-area-inset-right,0px)) calc(env(safe-area-inset-bottom,0px) + 24px) max(20px,env(safe-area-inset-left,0px))}
#updGate .in{max-width:420px;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:14px}
#updGate .lg{width:84px;height:84px;border-radius:22px;align-self:center;box-shadow:0 10px 30px rgb(0 0 0 / .3)}
#updGate h1{text-align:center;font-size:34px}
#updGate .sub{text-align:center;color:var(--muted)}
#updGate ul{margin:0;padding-left:20px;line-height:1.55}
#updGate .bar{height:10px;border-radius:9px;background:var(--surface2);overflow:hidden}
#updGate .bar i{display:block;height:100%;background:var(--accent);transition:width .2s}
</style>`);
const UPD={url:'https://higolirio579-glitch.github.io/athos/versao.json',checked:0,info:null,state:'idle',pct:0,el:null};
function updMine(){try{return NATIVE&&NATIVE.appVersion?NATIVE.appVersion():0}catch(e){return 0}}
function updSaved(){try{return JSON.parse(localStorage.getItem('athos.upd')||'null')}catch(e){return null}}
async function updCheck(force){
  if(!NATIVE||!NATIVE.updateDownload)return'web';
  if(!force&&Date.now()-UPD.checked<15*60e3)return'skip';
  UPD.checked=Date.now();
  try{
    const r=await fetch(UPD.url+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)return'error';
    const v=await r.json();const mine=updMine();
    if(!v||!(v.code>mine)||!v.apk){try{localStorage.removeItem('athos.upd')}catch(e){}if(UPD.el)updHide();return'none'}
    UPD.info=v;try{localStorage.setItem('athos.upd',JSON.stringify(v))}catch(e){}
    updShow();return'new';
  }catch(e){return'error'}
}
function updBody(){
  const v=UPD.info||{};const notes=(v.notas||[]).map(n=>`<li>${esc(n)}</li>`).join('');const logo=(document.querySelector('.brand img')||{}).src||'';
  let main='';
  if(UPD.state==='idle'||UPD.state==='error')main=`${UPD.state==='error'?`<p style="color:var(--red);text-align:center">Não deu para baixar. Confira a internet e tente de novo.</p>`:''}<button class="btn primary block" data-upd="go" style="min-height:52px;font-size:16px">Atualizar agora</button>`;
  else if(UPD.state==='down')main=`<div class="bar"><i style="width:${UPD.pct<0?100:UPD.pct}%"></i></div><p class="sub" id="updPct">Baixando… ${UPD.pct>=0?UPD.pct+'%':''}</p>`;
  else if(UPD.state==='perm')main=`<p>O Android vai pedir para <b>permitir instalar apps do ATHOS</b>. Ative a chave e volte aqui.</p><button class="btn primary block" data-upd="install" style="min-height:52px">Instalar</button>`;
  else main=`<p class="sub">Pronto. Toque em <b>Instalar</b> e depois em <b>Atualizar</b>. Seus dados continuam salvos na sua conta.</p><button class="btn primary block" data-upd="install" style="min-height:52px;font-size:16px">Instalar</button><button class="btn block" data-upd="go">Baixar de novo</button>`;
  return`<div class="in">${logo?`<img class="lg" src="${logo}" alt="">`:''}<h1>Atualize o ATHOS</h1><p class="sub">A versão <b>${esc(v.nome||'')}</b> é obrigatória para continuar usando o app.</p>${notes?`<div class="card"><b>O que mudou</b><ul>${notes}</ul></div>`:''}${main}</div>`}
function updDraw(){if(UPD.el&&UPD.el.isConnected)UPD.el.innerHTML=updBody()}
function updShow(){if(!UPD.info)return;
  if(UPD.el&&UPD.el.isConnected){updDraw();return}
  const el=document.createElement('div');el.id='updGate';el.setAttribute('role','alertdialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Atualização obrigatória');
  document.body.appendChild(el);UPD.el=el;document.body.classList.add('locked');updDraw();
  el.addEventListener('click',e=>{const a=e.target.closest('[data-upd]');if(!a)return;const k=a.dataset.upd;
    if(k==='go'){UPD.state='down';UPD.pct=0;updDraw();NATIVE.updateDownload(UPD.info.apk);return}
    if(k==='install'){const r=NATIVE.updateInstall();if(r==='need_permission'){UPD.state='perm';updDraw()}else if(r==='missing'){UPD.state='idle';updDraw()}}})}
function updHide(){if(UPD.el){UPD.el.remove();UPD.el=null}if(!sheets.length&&$('#session').hidden&&(!$('#authGate')||$('#authGate').hidden))document.body.classList.remove('locked')}
window.updBlocking=()=>!!(UPD.el&&UPD.el.isConnected);
window.androidUpd=function(ev,v){
  if(ev==='progress'){UPD.pct=v;if(UPD.state!=='down'){UPD.state='down';updDraw()}const i=UPD.el&&UPD.el.querySelector('.bar i'),p=UPD.el&&UPD.el.querySelector('#updPct');if(i)i.style.width=(v<0?100:v)+'%';if(p)p.textContent='Baixando… '+(v>=0?v+'%':'')}
  else if(ev==='done'){UPD.state='ready';updShow();updDraw();try{NATIVE.updateInstall()==='need_permission'&&(UPD.state='perm',updDraw())}catch(e){}}
  else if(ev==='error'){UPD.state='error';updShow();updDraw()}
};
window.androidResume=function(){if(UPD.state==='perm'){UPD.state='ready';updDraw()}updCheck(false)};
/* já bloqueia ao abrir se a última verificação disse que existe versão nova (vale até sem internet) */
{const s=updSaved();if(s&&s.code>updMine()&&NATIVE&&NATIVE.updateDownload){UPD.info=s;setTimeout(updShow,50)}}
setTimeout(()=>updCheck(true),1500);
setInterval(()=>{if(!document.hidden)updCheck(false)},60e3);
