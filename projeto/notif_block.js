/* ---------- notificações: sininho, lembretes, rede social e descanso ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
.bell{position:relative;border:0;background:var(--surface);width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:var(--fg);flex:none;border:1px solid var(--cardline)}
.bell svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.bell b{position:absolute;top:-3px;right:-3px;min-width:19px;height:19px;padding:0 5px;border-radius:10px;background:var(--red);color:#fff;font:700 11px/19px var(--body);text-align:center;border:2px solid var(--bg)}
.top-r{display:flex;align-items:center;gap:10px}
.nt{display:flex;gap:11px;align-items:flex-start;padding:11px 0;border:0;border-top:1px solid var(--line);background:none;text-align:left;width:100%;font:inherit;color:inherit}
.nt:first-child{border-top:0}
.nt .tx{flex:1;min-width:0;line-height:1.35}
.nt .tx small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.nt .q{color:var(--muted);overflow-wrap:anywhere}
.nt.new .tx::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent);margin-right:6px;vertical-align:1px}
.swr{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid var(--line)}
.swr:first-of-type{border-top:0}
.swr .t{min-width:0}.swr .t b{font-weight:600;display:block}.swr .t small{color:var(--muted);font-size:13px}
.sw{appearance:none;-webkit-appearance:none;flex:none;width:48px;height:28px;border-radius:99px;background:var(--surface2);position:relative;cursor:pointer;transition:background .2s;border:0;padding:0;margin:0}
.sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgb(0 0 0 / .3);transition:transform .2s}
.sw:checked{background:var(--accent)}.sw:checked::after{transform:translateX(20px)}
.days{display:flex;gap:5px;flex-wrap:wrap}
.days button{width:36px;height:34px;border-radius:10px;border:0;background:var(--surface2);font:700 13px var(--body);color:var(--muted)}
.days button[aria-pressed="true"]{background:var(--fg);color:var(--bg)}
.ntime{width:auto;max-width:120px;text-align:center;font-variant-numeric:tabular-nums}
</style>`);
const NT={unread:0,list:null,uid:null,ch:null,maxId:0};
const NDEF={water:true,meals:true,train:true,trainTime:'18:00',trainDays:'12345',streak:true,social:true,rest:true};
function nPrefs(){const p=S.profile;p.notif=Object.assign({},NDEF,p.notif||{});return p.notif}
function nSave(){store.mark('profile');nPush()}

/* --- estado do dia para os lembretes do Android --- */
function nState(){const t=today(),d=S.days[t],st=streak();
  const meals=d&&d.meals?MEALS.filter(([k])=>(d.meals[k]||[]).length).length:0;
  return{date:t,water:d?d.water||0:0,waterGoal:goals().water||2500,meals,trained:Object.values(S.sessions).some(s=>s.date===t),dayOn:st.on,streak:st.n,logged:!!(SOC&&SOC.user),prefs:nPrefs()}}
let nPushT=null;
function nPush(){if(!NATIVE||!NATIVE.notifState)return;clearTimeout(nPushT);nPushT=setTimeout(()=>{try{NATIVE.notifState(JSON.stringify(nState()))}catch(e){}},300)}
{const _r=render;render=function(){_r.apply(this,arguments);nPush()}}
setInterval(nPush,60000);

/* --- aviso de fim do descanso com a tela bloqueada --- */
let nRestEnd=0;
setInterval(()=>{if(!NATIVE||!NATIVE.restAlarm)return;
  if(REST&&!REST.over){if(REST.end!==nRestEnd){nRestEnd=REST.end;try{NATIVE.restAlarm(REST.end,nPrefs().rest!==false)}catch(e){}}}
  else if(nRestEnd){nRestEnd=0;try{NATIVE.restCancel()}catch(e){}}},500);

/* --- sininho --- */
function nBell(){let b=$('#bell');
  if(!(SOC&&SOC.user)){if(b)b.hidden=true;return}
  if(!b){const sy=$('#sync');const w=document.createElement('div');w.className='top-r';sy.parentNode.insertBefore(w,sy);w.appendChild(sy);
    w.insertAdjacentHTML('beforeend',`<button class="bell" id="bell" aria-label="Notificações"><svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/></svg><b hidden></b></button>`);
    b=$('#bell');b.addEventListener('click',nOpen)}
  b.hidden=false;const badge=b.querySelector('b');badge.hidden=!NT.unread;badge.textContent=NT.unread>9?'9+':NT.unread;
  b.setAttribute('aria-label',NT.unread?`Notificações, ${NT.unread} novas`:'Notificações')}
async function nCount(){if(!SOC.user)return;try{const r=await SOC.sb.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',SOC.user.id).eq('read',false);NT.unread=r.count||0;nBell()}catch(e){}}
function nLine(n){const who=`<b>${esc(pName(n.actor_id))}</b>`;
  if(n.kind==='like')return`${who} curtiu seu post`;
  if(n.kind==='comment')return`${who} comentou: <span class="q">“${esc(n.body||'')}”</span>`;
  if(n.kind==='follow')return`${who} começou a seguir você`;
  if(n.kind==='pr')return`🏆 ${who} bateu um recorde${n.body?`: <span class="q">${esc(n.body)}</span>`:''}`;
  return`${who} mandou uma mensagem: <span class="q">${esc(n.body||'')}</span>`}
function nOpen(){
  openSheet('Notificações',`<div id="ntL">${thinking('Carregando…')}</div>`,async(b,el)=>{
    const box=b.querySelector('#ntL');
    try{const list=await sbq(SOC.sb.from('notifications').select('*').eq('user_id',SOC.user.id).order('id',{ascending:false}).limit(60));
      await loadProfiles(list.map(n=>n.actor_id).filter(Boolean));
      box.innerHTML=list.length?`<div>${list.map(n=>`<button class="nt${n.read?'':' new'}" data-k="${n.kind}" data-post="${n.post_id||''}" data-conv="${n.conversation_id||''}" data-actor="${n.actor_id||''}">${avatar(SOC.prof[n.actor_id],'sm')}<span class="tx">${nLine(n)}<small>${ago(n.created_at)}</small></span></button>`).join('')}</div>`
        :`<div class="empty"><b>Nada por aqui ainda</b><span>Quando curtirem, comentarem, seguirem você ou mandarem mensagem, aparece aqui.</span></div>`;
      if(list.some(n=>!n.read)){await SOC.sb.from('notifications').update({read:true}).eq('user_id',SOC.user.id).eq('read',false);NT.unread=0;nBell()}
      if(list[0]&&NATIVE&&NATIVE.notifSetAfter)try{NATIVE.notifSetAfter(list[0].id)}catch(e){}
    }catch(e){box.innerHTML=`<p class="hint">${esc(sbErr(e))}</p>`}
    box.addEventListener('click',e=>{const it=e.target.closest('.nt');if(!it)return;closeSheet(el);nGoto(it.dataset.k,it.dataset.post,it.dataset.conv,it.dataset.actor)});
  })}
async function nGoto(kind,post,conv,actor){
  if(kind==='message'&&conv){go('social');socChatSheet(conv);return}
  if(kind==='follow'&&actor){go('social');socProfileSheet(actor);return}
  if(post){go('social');if(!findPost(post)){try{const p=await sbq(SOC.sb.from('posts').select('*').eq('id',post).single());socPostCache[post]=p;await loadProfiles([p.user_id])}catch(e){toast('Esse post não está mais disponível');return}}socOpenPost(post)}
}
window.androidOpen=function(o){if(!o)return;
  if(o.startsWith('chat:')){const id=o.slice(5);const t=()=>{if(SOC&&SOC.user){go('social');socChatSheet(id)}else setTimeout(t,800)};t();return}
  if(o==='treino'&&S.active){try{ACT.openActive()}catch(e){go('treino')}return}
  if(VIEWS[o])go(o)};

/* --- login/logout: tempo real e registro do aparelho --- */
async function nLogin(u){
  try{if(NT.ch){SOC.sb.removeChannel(NT.ch);NT.ch=null}}catch(e){}
  if(!u){NT.unread=0;nBell();return}
  nCount();
  NT.ch=SOC.sb.channel('notif-'+u.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${u.id}`},pl=>{
    NT.unread++;nBell();const n=pl.new;if(n.kind!=='message'){loadProfiles([n.actor_id]).then(()=>{const d=document.createElement('div');d.innerHTML=nLine(n);toast(d.textContent)}).catch(()=>{})}}).subscribe();
  if(NATIVE&&NATIVE.notifKey){try{const k=NATIVE.notifKey();await SOC.sb.rpc('notif_register',{p_key:k});
    const r=await SOC.sb.from('notifications').select('id').eq('user_id',u.id).order('id',{ascending:false}).limit(1);if(r.data&&r.data[0])NATIVE.notifSetAfter(r.data[0].id)}catch(e){}
    let asked=false;try{asked=localStorage.getItem('athos.notifAsked')==='1'}catch(e){}
    if(!asked&&!NATIVE.notifAllowed()){try{localStorage.setItem('athos.notifAsked','1')}catch(e){}setTimeout(()=>NATIVE.notifPermission(),2500)}}
  nPush()}
async function nLogout(){if(!NATIVE||!NATIVE.notifKey)return;try{await SOC.sb.rpc('notif_unregister',{p_key:NATIVE.notifKey()})}catch(e){}try{NATIVE.notifResetKey()}catch(e){}}
setInterval(()=>{const id=SOC&&SOC.user?SOC.user.id:null;if(id===NT.uid)return;const was=NT.uid;NT.uid=id;
  if(id)nLogin(SOC.user);else{nLogin(null);if(was)nLogout()}nPush()},1500);
setTimeout(()=>{try{const o=NATIVE&&NATIVE.takeOpen&&NATIVE.takeOpen();if(o)window.androidOpen(o)}catch(e){}},1200);

/* --- cartão de configurações no Perfil (só no app Android) --- */
window.androidNotifPerm=function(ok){toast(ok?'Notificações ativadas':'Ative as notificações do ATHOS nas configurações do Android');render()};
function nCard(){if(!NATIVE||!NATIVE.notifState)return'';const n=nPrefs();let ok=true;try{ok=NATIVE.notifAllowed()}catch(e){}
  const sw=(k,t,s)=>`<label class="swr"><span class="t"><b>${t}</b><small>${s}</small></span><input type="checkbox" class="sw" data-nk="${k}" ${n[k]?'checked':''}></label>`;
  const DL=['S','T','Q','Q','S','S','D'];
  return`<div class="card"><h3>Notificações</h3>${ok?'':`<div class="picked"><b>As notificações estão desligadas</b><span class="hint">Ative para receber lembretes, mensagens e o aviso do descanso.</span><button class="btn primary" data-act="notifAsk">Ativar notificações</button></div>`}
  <div>${sw('water','Beber água','A cada 2h e meia, das 9h às 21h, se faltar água')}
  ${sw('meals','Refeições','Às 12h30 e às 20h, se faltar registrar')}
  ${sw('train','Hora do treino','No horário e nos dias abaixo, se ainda não treinou')}
  ${n.train?`<div style="display:flex;flex-direction:column;gap:10px;padding:2px 0 12px"><input type="time" class="ntime" id="nTime" value="${esc(n.trainTime)}" aria-label="Horário do treino"><div class="days" role="group" aria-label="Dias de treino">${DL.map((l,i)=>`<button data-act="notifDay" data-d="${i+1}" aria-pressed="${n.trainDays.includes(String(i+1))}" aria-label="${['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'][i]}">${l}</button>`).join('')}</div></div>`:''}
  ${sw('streak','Sequência em risco','Às 21h, se o dia ainda não tiver registro')}
  ${sw('social','Rede social','Curtidas, comentários, seguidores e mensagens')}
  ${sw('rest','Fim do descanso','Vibra quando o descanso acaba, mesmo com a tela bloqueada')}</div>
  <p class="hint">Os lembretes podem chegar alguns minutos depois do horário, conforme a economia de bateria do celular.</p></div>`}
/* o cartão aparece em Configurações */
Object.assign(ACT,{notifAsk:()=>NATIVE&&NATIVE.notifPermission(),
  notifDay:el=>{const n=nPrefs(),d=el.dataset.d;n.trainDays=n.trainDays.includes(d)?n.trainDays.replace(d,''):[...n.trainDays+d].sort().join('');nSave();render()}});
document.addEventListener('change',e=>{const t=e.target;
  if(t.dataset&&t.dataset.nk){const n=nPrefs();n[t.dataset.nk]=t.checked;nSave();
    if(t.checked&&NATIVE&&NATIVE.notifAllowed&&!NATIVE.notifAllowed())NATIVE.notifPermission();if(t.dataset.nk==='train')render()}
  else if(t.id==='nTime'&&t.value){nPrefs().trainTime=t.value;nSave()}});
