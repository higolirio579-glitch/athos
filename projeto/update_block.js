/* ---------- atualização automática do APK ---------- */
const UPD={url:'https://higolirio579-glitch.github.io/athos/versao.json',checked:0,info:null,skip:0,state:'idle',pct:0,el:null};
function updMine(){try{return NATIVE&&NATIVE.appVersion?NATIVE.appVersion():0}catch(e){return 0}}
async function updCheck(force){
  if(!NATIVE||!NATIVE.updateDownload)return'web';
  if(!force&&Date.now()-UPD.checked<6*3600e3)return'skip';
  UPD.checked=Date.now();
  try{
    const r=await fetch(UPD.url+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)return'error';
    const v=await r.json();const mine=updMine();
    if(!v||!(v.code>mine)||!v.apk)return'none';
    UPD.info=v;if(UPD.skip===v.code&&!force)return'new';
    updShow();return'new';
  }catch(e){return'error'}
}
function updBody(){
  const v=UPD.info||{};const notes=(v.notas||[]).map(n=>`<li>${esc(n)}</li>`).join('');
  const bar=`<div style="height:8px;border-radius:6px;background:var(--line);overflow:hidden;margin:14px 0 6px"><div style="height:100%;width:${UPD.pct<0?100:UPD.pct}%;background:var(--accent);transition:width .2s${UPD.pct<0?';opacity:.5':''}"></div></div>`;
  let main='';
  if(UPD.state==='idle'||UPD.state==='error')main=`${UPD.state==='error'?`<p style="color:var(--red);margin:10px 0 0">Não deu para baixar. Confira a internet e tente de novo.</p>`:''}<div class="btns" style="margin-top:16px"><button class="btn primary block" data-upd="go">Atualizar agora</button><button class="btn block" data-upd="later">Depois</button></div>`;
  else if(UPD.state==='down')main=`${bar}<p style="margin:0;color:var(--muted)">Baixando… ${UPD.pct>=0?UPD.pct+'%':''}</p>`;
  else if(UPD.state==='perm')main=`<p style="margin:12px 0 0">O Android vai pedir para <b>permitir instalar apps do ATHOS</b>. Ative a chave e volte aqui.</p><div class="btns" style="margin-top:14px"><button class="btn primary block" data-upd="install">Instalar</button></div>`;
  else main=`<p style="margin:12px 0 0;color:var(--muted)">Pronto. Toque em <b>Instalar</b> e depois em <b>Atualizar</b>. Seus dados continuam salvos na sua conta.</p><div class="btns" style="margin-top:14px"><button class="btn primary block" data-upd="install">Instalar</button></div>`;
  return `<p style="margin:0">A versão <b>${esc(v.nome||'')}</b> do ATHOS está disponível.</p>${notes?`<ul style="margin:10px 0 0;padding-left:20px;line-height:1.5">${notes}</ul>`:''}${main}`;
}
function updDraw(){if(UPD.el&&UPD.el.isConnected){const b=UPD.el.querySelector('.sheet-b');if(b)b.innerHTML=updBody()}}
function updShow(){
  if(UPD.el&&UPD.el.isConnected){updDraw();return}
  UPD.el=openSheet('Nova versão do ATHOS',updBody(),(b,w)=>{
    w.style.zIndex=95;
    b.addEventListener('click',e=>{const a=e.target.closest('[data-upd]');if(!a)return;const k=a.dataset.upd;
      if(k==='later'){UPD.skip=UPD.info.code;closeSheet(UPD.el);return}
      if(k==='go'){UPD.state='down';UPD.pct=0;updDraw();NATIVE.updateDownload(UPD.info.apk);return}
      if(k==='install'){const r=NATIVE.updateInstall();if(r==='need_permission'){UPD.state='perm';updDraw()}else if(r==='missing'){UPD.state='idle';updDraw()}}
    });
  });
}
window.androidUpd=function(ev,v){
  if(ev==='progress'){UPD.pct=v;if(UPD.state!=='down')UPD.state='down';const b=UPD.el&&UPD.el.querySelector('.sheet-b');if(b){const bar=b.querySelector('div>div[style*="width"]'),p=b.querySelector('p[style*="muted"]');if(bar){bar.style.width=(v<0?100:v)+'%'}if(p)p.textContent='Baixando… '+(v>=0?v+'%':'');else updDraw()}}
  else if(ev==='done'){UPD.state='ready';updShow();updDraw();try{NATIVE.updateInstall()==='need_permission'&&(UPD.state='perm',updDraw())}catch(e){}}
  else if(ev==='error'){UPD.state='error';updShow();updDraw()}
};
window.androidResume=function(){if(UPD.state==='perm'){UPD.state='ready';updDraw()}updCheck(false)};
setTimeout(()=>updCheck(true),3500);
