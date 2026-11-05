/* ---------- painel de moderador (só aparece para moderadores; o banco confere de novo em cada ação) ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
.card.modcard{display:flex;flex-direction:row;align-items:center;gap:14px;width:100%;text-align:left;font:inherit;color:var(--fg);border:1.5px solid var(--accent);cursor:pointer}
.card.modcard .t{flex:1;display:flex;flex-direction:column;gap:2px}.modcard b{font-size:16px}.modcard small{color:var(--muted)}
.card.modcard .n{min-width:44px;height:44px;padding:0 10px;border-radius:22px;background:var(--accent);color:#000;font:800 24px/44px var(--display);text-align:center}
#mod{position:fixed;inset:0;z-index:35;background:var(--bg);display:flex;flex-direction:column}
#mod .m-h{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 16px 10px;border-bottom:1px solid var(--line)}
#mod .m-h h2{flex:1;font-size:22px}
#mod .m-b{flex:1;overflow:auto;padding:16px 16px calc(24px + env(safe-area-inset-bottom,0px));max-width:720px;width:100%;margin:0 auto;box-sizing:border-box;display:flex;flex-direction:column;gap:14px}
#mod .m-b>*,#modList>*{flex:none}
#modList{display:flex;flex-direction:column;gap:14px}
.m-hero{display:flex;align-items:baseline;gap:12px;padding:6px 2px 2px}
.m-hero .big{font:800 88px/.85 var(--display);color:var(--accent)}
.m-hero .big.zero{color:var(--muted)}
.m-hero span{font-weight:600;color:var(--muted);max-width:16ch}
.m-tabs{display:flex;gap:8px;overflow:auto}
.m-tabs button{flex:none;border:1.5px solid var(--line);background:var(--surface);color:var(--fg);font:700 14.5px var(--body);padding:9px 14px;border-radius:999px}
.m-tabs button[aria-pressed=true]{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.m-rep{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px}
.m-rep.done{border-left-color:var(--line);opacity:.8}
.m-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13.5px;color:var(--muted)}
.m-kind{background:var(--surface2);color:var(--fg);font-weight:700;padding:3px 9px;border-radius:8px}
.m-who{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.m-who b{font-size:16px}
.m-flag{font-size:12.5px;font-weight:700;padding:2px 8px;border-radius:8px;background:color-mix(in srgb,var(--red) 16%,transparent);color:var(--red)}
.m-quote{margin:0;padding:10px 12px;border-radius:12px;background:var(--surface2);white-space:pre-wrap;word-break:break-word;font-size:15px;max-height:9.5em;overflow:auto}
.m-quote.gone{color:var(--muted);font-style:italic}
.m-photo{width:100%;max-height:260px;object-fit:cover;border-radius:12px}
.m-why{font-size:14.5px}.m-why small{color:var(--muted)}
.m-act{display:flex;gap:8px;flex-wrap:wrap}.m-act .btn{flex:1 1 auto;min-height:44px}
.m-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.m-stats div{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px}
.m-stats b{display:block;font:800 40px/1 var(--display)}.m-stats small{color:var(--muted);font-size:13.5px}
.m-bars{display:flex;align-items:flex-end;gap:5px;height:110px;padding-top:8px}
.m-bars i{flex:1;background:var(--accent);border-radius:5px 5px 2px 2px;min-height:3px}
.m-empty{text-align:center;color:var(--muted);padding:40px 10px}
.m-empty b{display:block;font:800 30px/1.1 var(--display);color:var(--fg);margin-bottom:6px}
</style>`);

const MOD={is:false,checked:null,open:0,tab:'den',st:'aberta',busy:false};
const MOD_KIND={post:'Post',comment:'Comentário',message:'Mensagem',club:'Clube',user:'Perfil'};
async function modCheck(){
  if(!SOC.sb||!SOC.user){MOD.is=false;MOD.checked=null;return}
  if(MOD.checked===SOC.user.id)return;MOD.checked=SOC.user.id;
  try{const r=await SOC.sb.rpc('is_mod');MOD.is=r.data===true}catch(e){MOD.is=false}
  if(MOD.is){modCount();render()}
}
async function modCount(){try{const r=await SOC.sb.rpc('mod_stats');if(!r.error&&r.data){MOD.open=r.data.denuncias_abertas||0;MOD.stats=r.data}}catch(e){}}
setInterval(modCheck,3000);
function modCard(){if(!MOD.is)return'';return`<button class="card modcard" data-act="modOpen"><span class="t"><b>Painel de moderador</b><small>${MOD.open?'Denúncias esperando sua decisão':'Nenhuma denúncia aberta'}</small></span><span class="n">${fmtN(MOD.open)}</span></button>`}
{const _vp=VIEWS.perfil;VIEWS.perfil=function(){return modCard()+_vp.apply(this,arguments)}}

function modErr(e){const m=String((e&&(e.message||e.code))||e||'');
  if(/sem_permissao/.test(m))return'Sua conta não é moderadora.';
  if(/nao_pode_suspender_moderador/.test(m))return'Não dá para suspender um moderador.';
  if(/function .* does not exist|Could not find the function|PGRST202/i.test(m))return'O painel ainda não foi ativado no banco. Rode o arquivo moderacao.sql no Supabase.';
  if(/Failed to fetch|network/i.test(m))return'Sem internet.';
  return'Não deu certo: '+m.slice(0,120)}
async function modRpc(fn,args){const r=await SOC.sb.rpc(fn,args||{});if(r.error)throw r.error;return r.data}
function modWhen(t){const d=new Date(t),s=(Date.now()-d)/1000;if(s<3600)return`há ${Math.max(1,Math.round(s/60))} min`;if(s<86400)return`há ${Math.round(s/3600)} h`;return d.toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}
function modUntil(t){if(!t)return'';const d=new Date(t);if(!isFinite(d)||d.getFullYear()>9000)return'para sempre';return'até '+d.toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}

function modOpen(){
  let el=$('#mod');if(!el){el=document.createElement('section');el.id='mod';el.setAttribute('aria-label','Painel de moderador');document.body.appendChild(el);el.addEventListener('click',modClick)}
  el.hidden=false;document.body.classList.add('locked');modDraw();modLoad();
}
function modClose(){const el=$('#mod');if(el){el.hidden=true;el.innerHTML=''}document.body.classList.remove('locked');modCount().then(render)}
function modDraw(body){
  const el=$('#mod');if(!el)return;
  const tabs=[['den','Denúncias'],['sus','Suspensos'],['num','Números']];
  el.innerHTML=`<header class="m-h"><button class="icon-btn" data-m="close" aria-label="Voltar">‹</button><h2>Moderação</h2><button class="icon-btn" data-m="reload" aria-label="Atualizar">↻</button></header>
  <div class="m-b"><div class="m-hero"><span class="big${MOD.open?'':' zero'}">${fmtN(MOD.open)}</span><span>${MOD.open===1?'denúncia esperando você':'denúncias esperando você'}</span></div>
  <div class="m-tabs" role="tablist">${tabs.map(([k,n])=>`<button role="tab" data-m="tab" data-k="${k}" aria-pressed="${MOD.tab===k}">${n}</button>`).join('')}</div>
  ${MOD.tab==='den'?`<div class="m-tabs">${[['aberta','Abertas'],['resolvida','Resolvidas'],['descartada','Descartadas'],['todas','Todas']].map(([k,n])=>`<button data-m="st" data-k="${k}" aria-pressed="${MOD.st===k}">${n}</button>`).join('')}</div>`:''}
  <div id="modList">${body||thinking('Carregando…')}</div></div>`;
}
function modRepHtml(r){
  const open=r.status==='aberta',gone=!r.preview;
  return`<article class="m-rep${open?'':' done'}" data-id="${r.id}">
    <div class="m-top"><span class="m-kind">${MOD_KIND[r.kind]||'Conteúdo'}</span><span>${modWhen(r.created_at)}</span>${r.reporter_name?`<span>denunciado por ${esc(r.reporter_name)}</span>`:''}${!open?`<span>· ${esc(r.action||r.status)}</span>`:''}</div>
    <div class="m-who"><b>${esc(r.author_name||'Conta apagada')}</b>${r.author_public_id?`<small class="muted">ID ${esc(String(r.author_public_id).replace(/^(\d{3})(\d{4})$/,'$1 $2'))}</small>`:''}${r.author_reports>1?`<span class="m-flag">${fmtN(r.author_reports)} denúncias</span>`:''}${r.author_banned_until&&new Date(r.author_banned_until)>new Date()?`<span class="m-flag">suspenso ${esc(modUntil(r.author_banned_until))}</span>`:''}</div>
    ${r.photo?`<img class="m-photo" src="${esc(r.photo)}" alt="Foto do post denunciado" loading="lazy">`:''}
    <p class="m-quote${gone?' gone':''}">${gone?'O conteúdo já foi apagado.':esc(r.preview)}</p>
    <p class="m-why"><small>Motivo:</small> ${r.reason?esc(r.reason):'<span class="muted">não informado</span>'}</p>
    ${open?`<div class="m-act">${r.kind!=='user'&&!gone?`<button class="btn danger" data-m="del" data-id="${r.id}">Apagar ${({post:'post',comment:'comentário',message:'mensagem',club:'clube'})[r.kind]||'conteúdo'}</button>`:''}${r.author_id?`<button class="btn" data-m="ban" data-id="${r.id}" data-u="${r.author_id}" data-n="${esc(r.author_name||'')}">Suspender conta</button>`:''}<button class="btn soft" data-m="ok" data-id="${r.id}">Descartar</button></div>`:''}
  </article>`;
}
async function modLoad(){
  const box=()=>$('#modList');
  try{
    if(MOD.tab==='den'){const L=await modRpc('mod_reports',{p_status:MOD.st});MOD.list=L||[];
      if(MOD.st==='aberta')MOD.open=MOD.list.length>=200?MOD.open:MOD.list.length;
      modDraw(MOD.list.length?MOD.list.map(modRepHtml).join(''):`<div class="m-empty"><b>Tudo limpo</b>${MOD.st==='aberta'?'Nenhuma denúncia esperando. Quando alguém denunciar, aparece aqui.':'Nada nesta lista.'}</div>`)}
    else if(MOD.tab==='sus'){const L=await modRpc('mod_banned');
      modDraw(L&&L.length?L.map(u=>`<article class="m-rep"><div class="m-who"><b>${esc(u.name||'Atleta')}</b><small class="muted">ID ${esc(String(u.public_id||'').replace(/^(\d{3})(\d{4})$/,'$1 $2'))}</small><span class="m-flag">${esc(modUntil(u.banned_until))}</span></div>${u.ban_reason?`<p class="m-why"><small>Motivo:</small> ${esc(u.ban_reason)}</p>`:''}<div class="m-act"><button class="btn" data-m="unban" data-u="${u.id}" data-n="${esc(u.name||'')}">Tirar suspensão</button></div></article>`).join(''):`<div class="m-empty"><b>Ninguém suspenso</b>Contas que você suspender aparecem aqui.</div>`)}
    else{const s=await modRpc('mod_stats');MOD.stats=s;MOD.open=s.denuncias_abertas||0;const days=s.novos_por_dia||[],mx=Math.max(1,...days.map(d=>d.n));
      modDraw(`<div class="m-stats"><div><b>${fmtN(s.usuarios)}</b><small>contas no total</small></div><div><b>${fmtN(s.novos_7d)}</b><small>novas em 7 dias (${fmtN(s.novos_hoje)} hoje)</small></div><div><b>${fmtN(s.posts_7d)}</b><small>posts em 7 dias</small></div><div><b>${fmtN(s.mensagens_7d)}</b><small>mensagens em 7 dias</small></div><div><b>${fmtN(s.clubes)}</b><small>clubes</small></div><div><b>${fmtN(s.suspensos)}</b><small>contas suspensas</small></div></div>
      <div class="card"><h3>Contas novas por dia</h3><div class="m-bars" role="img" aria-label="Contas novas nos últimos 14 dias">${days.map(d=>`<i style="height:${Math.round(d.n/mx*100)}%" title="${esc(d.d)}: ${d.n}"></i>`).join('')||'<p class="hint">Sem contas novas nos últimos 14 dias.</p>'}</div><p class="hint">Últimos 14 dias.</p></div>`)}
  }catch(e){if(box())box().innerHTML=`<div class="m-empty"><b>Não carregou</b>${esc(modErr(e))}</div>`}
}
function modBanSheet(uid,name){
  const opts=[[1,'1 dia'],[7,'7 dias'],[30,'30 dias'],[-1,'Para sempre']];let days=7;
  openSheet('Suspender '+(name||'conta'),`<p class="hint">A conta continua entrando no app, mas não consegue postar, comentar, mandar mensagem nem criar clube.</p><div class="chips" id="mbD">${opts.map(([d,l])=>`<button class="chip" data-d="${d}" aria-pressed="${d===days}">${l}</button>`).join('')}</div><label class="fld"><span>Motivo (só moderadores veem)</span><input id="mbR" maxlength="300" placeholder="Ex.: spam, ofensas"></label><button class="btn danger block" data-s="go">Suspender conta</button>`,(b,el)=>{
    b.onclick=async e=>{const c=e.target.closest('[data-d]');if(c){days=+c.dataset.d;b.querySelectorAll('#mbD .chip').forEach(x=>x.setAttribute('aria-pressed',x===c));return}
      if(e.target.closest('[data-s=go]')){try{await modRpc('mod_suspend',{p_user:uid,p_days:days,p_reason:b.querySelector('#mbR').value.trim()||null});closeSheet(el);document.body.classList.add('locked');toast('Conta suspensa');modLoad()}catch(err){toast(modErr(err))}}}});
}
async function modClick(e){
  const b=e.target.closest('[data-m]');if(!b||MOD.busy)return;const m=b.dataset.m;
  if(m==='close')return modClose();
  if(m==='reload'){modDraw();return modLoad()}
  if(m==='tab'){MOD.tab=b.dataset.k;modDraw();return modLoad()}
  if(m==='st'){MOD.st=b.dataset.k;modDraw();return modLoad()}
  if(m==='ban')return modBanSheet(b.dataset.u,b.dataset.n);
  if(m==='unban')return confirmSheet(`Tirar a suspensão de ${b.dataset.n||'esta conta'}?`,'Tirar suspensão',async()=>{try{await modRpc('mod_suspend',{p_user:b.dataset.u,p_days:0});document.body.classList.add('locked');toast('Suspensão retirada');modLoad()}catch(err){toast(modErr(err))}});
  if(m==='del'||m==='ok'){const act=m==='del'?'apagar':'descartar';
    const run=async()=>{MOD.busy=true;try{await modRpc('mod_resolve',{p_report:b.dataset.id,p_action:act});toast(act==='apagar'?'Conteúdo apagado':'Denúncia descartada');document.body.classList.add('locked');await modLoad()}catch(err){toast(modErr(err))}MOD.busy=false};
    if(act==='apagar')confirmSheet('Apagar este conteúdo para todo mundo? Não dá para desfazer.','Apagar',run);else run()}
}
Object.assign(ACT,{modOpen});
window.modBack=function(){const el=$('#mod');if(el&&!el.hidden&&!sheets.length){modClose();return true}return false};
