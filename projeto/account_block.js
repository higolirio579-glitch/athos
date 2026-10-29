
/* ---------- conta ATHOS: cadastro obrigatório, código por e-mail e dados na nuvem ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
#authGate{position:fixed;inset:0;z-index:90;background:var(--bg);overflow:auto;padding:calc(env(safe-area-inset-top,0px) + 28px) max(20px,env(safe-area-inset-right,0px)) calc(env(safe-area-inset-bottom,0px) + 28px) max(20px,env(safe-area-inset-left,0px))}
#authGate .in{max-width:400px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
#authGate .hero{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:8px 0 6px}
#authGate .hero img{width:88px;height:88px;border-radius:22px;box-shadow:0 10px 30px rgb(0 0 0 / .25)}
#authGate .hero h1{font-size:40px;letter-spacing:.14em}
#authGate .hero p{color:var(--muted);max-width:30ch}
#authGate h2{font-size:26px}
#authGate .fld input{font-size:17px;padding:12px 13px;border-radius:12px}
#authGate .pw{position:relative}#authGate .pw input{padding-right:64px}
#authGate .pw button{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:none;color:var(--accent-tx);font-weight:700;font-size:13.5px;padding:8px}
#authGate .btn.primary{min-height:52px;font-size:16.5px;border-radius:14px}
#authGate .link{border:0;background:none;color:var(--accent-tx);font-weight:700;padding:6px;font-size:15px}
#authGate .alt{text-align:center;color:var(--muted);font-size:15px}
#authGate .err{background:color-mix(in srgb,var(--red) 12%,transparent);color:var(--red);border-radius:12px;padding:10px 12px;font-weight:600;font-size:14px}
#authGate .ok{background:color-mix(in srgb,var(--green) 13%,transparent);color:var(--green);border-radius:12px;padding:10px 12px;font-weight:600;font-size:14px}
#authGate .code{font:700 30px/1 var(--display);letter-spacing:.45em;text-align:center;padding:14px 8px;font-variant-numeric:tabular-nums}
#authGate .terms{font-size:13.5px;color:var(--muted)}#authGate .terms input{width:20px;height:20px;flex:none;margin-top:1px}
#authGate .meter{height:5px;border-radius:9px;background:var(--surface2);overflow:hidden}#authGate .meter i{display:block;height:100%;transition:width .2s}
.sync.wait b{background:var(--warn)}
</style>`);

const ACC={view:'login',email:'',name:'',err:'',ok:'',busy:false,cool:0,ready:false};
const SYNC={meta:Object.assign({uid:null,pend:{},last:null},lsGet('athos.sync')||{}),timer:null,pushing:false,pulling:false};
const saveMeta=()=>lsSet('athos.sync',SYNC.meta);
const logoSrc=()=>{const i=document.querySelector('.brand img');return i?i.src:''};
function accErr(e){const m=String((e&&(e.message||e.error_description||e.code))||e||'');
  if(/Invalid login/i.test(m))return'E-mail ou senha incorretos.';
  if(/not confirmed/i.test(m))return'Seu e-mail ainda não foi confirmado.';
  if(/already registered|already exists/i.test(m))return'Já existe uma conta com esse e-mail. Toque em “Entrar”.';
  if(/expired|invalid.*(otp|token)|otp.*invalid|token.*(invalid|expired)/i.test(m))return'Código inválido ou vencido. Confira os números ou peça um novo.';
  if(/Password should|weak/i.test(m))return'Senha fraca: use pelo menos 8 caracteres, misturando letras e números.';
  if(/valid email|invalid format|email address .* invalid/i.test(m))return'Esse e-mail não parece válido.';
  if(/not authorized/i.test(m))return'O servidor de e-mail do app ainda não está liberado para esse endereço. Avise o administrador do ATHOS.';
  if(/rate limit|too many|security purposes/i.test(m))return'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
  if(/Failed to fetch|NetworkError|network|offline/i.test(m))return'Sem conexão com a internet.';
  if(/same.*password|different from the old/i.test(m))return'A nova senha precisa ser diferente da antiga.';
  return'Não deu certo: '+m.slice(0,140)}

/* ----- sincronização ----- */
function syncKeys(){const k=['profile'];for(const d in S.days)k.push('d-'+d);for(const s in S.sessions)k.push(s);return k}
function syncChip(){const el=$('#sync');if(!el||!SOC.user)return;const n=Object.keys(SYNC.meta.pend).length;el.classList.toggle('on',!n);el.classList.toggle('wait',!!n);
  el.querySelector('span').textContent=n?(navigator.onLine===false?'Sem internet · '+n+' para enviar':'Sincronizando…'):'Salvo na conta'}
function schedulePush(ms){clearTimeout(SYNC.timer);SYNC.timer=setTimeout(pushPending,ms==null?1500:ms);syncChip()}
async function pushPending(){
  if(!SOC.user||SYNC.pushing)return;const keys=Object.keys(SYNC.meta.pend);if(!keys.length){syncChip();return}
  SYNC.pushing=true;const stamp={...SYNC.meta.pend};
  try{
    for(let i=0;i<keys.length;i+=40){const part=keys.slice(i,i+40);
      const rows=part.map(k=>{const d=store.dataFor(k);return{user_id:SOC.user.id,key:k,data:d?JSON.parse(JSON.stringify(d)):null,deleted:!d}});
      const r=await SOC.sb.from('user_data').upsert(rows,{onConflict:'user_id,key'});if(r.error)throw r.error;
      for(const k of part)if(SYNC.meta.pend[k]===stamp[k])delete SYNC.meta.pend[k];saveMeta()}
  }catch(e){SYNC.pushing=false;syncChip();setTimeout(()=>schedulePush(0),20000);return}
  SYNC.pushing=false;syncChip();if(Object.keys(SYNC.meta.pend).length)schedulePush(500);
}
function applyRow(r){
  if(SYNC.meta.pend[r.key])return false;const k=r.key,d=r.data;
  if(k==='profile'){if(r.deleted||!d)return false;const p=clone(d);delete p.kind;delete p.ts;S.profile={...clone(DEF_PROFILE),...p};return true}
  if(k.startsWith('d-')){const date=k.slice(2);if(r.deleted||!d)delete S.days[date];else S.days[date]=d;return true}
  if(r.deleted||!d)delete S.sessions[k];else S.sessions[k]=d;return true;
}
async function pullAll(full){
  if(!SOC.user||SYNC.pulling)return;SYNC.pulling=true;
  try{let from=0,changed=false,maxT=SYNC.meta.last;
    for(;;){let q=SOC.sb.from('user_data').select('key,data,deleted,updated_at').eq('user_id',SOC.user.id).order('updated_at',{ascending:true}).range(from,from+499);
      if(!full&&SYNC.meta.last)q=q.gt('updated_at',SYNC.meta.last);
      const r=await q;if(r.error)throw r.error;for(const row of r.data){if(applyRow(row))changed=true;if(!maxT||row.updated_at>maxT)maxT=row.updated_at}
      if(r.data.length<500)break;from+=500}
    SYNC.meta.last=maxT;saveMeta();if(changed){flushLocal();schedule()}
  }catch(e){}
  SYNC.pulling=false;
}
function wipeLocal(){S.profile=clone(DEF_PROFILE);S.days={};S.sessions={};S.active=null;saveActive();flushLocal();SYNC.meta={uid:null,pend:{},last:null};saveMeta()}
async function onAccount(u){
  if(!u){$('#sync').classList.remove('on','wait');$('#sync span').textContent='Neste aparelho';return}
  if(SYNC.meta.uid&&SYNC.meta.uid!==u.id){S.profile=clone(DEF_PROFILE);S.days={};S.sessions={};S.active=null;saveActive();flushLocal();SYNC.meta={uid:u.id,pend:{},last:null}}
  else if(!SYNC.meta.uid){const now=Date.now();const hasLocal=Object.keys(S.days).length||Object.keys(S.sessions).length||(S.profile.templates||[]).length||S.profile.age;
    SYNC.meta={uid:u.id,pend:{},last:null};if(hasLocal)for(const k of syncKeys())SYNC.meta.pend[k]=now}
  saveMeta();await pullAll(!SYNC.meta.last);
  if(!S.profile.name){S.profile.name=(u.user_metadata&&u.user_metadata.name)||(SOC.me&&SOC.me.name)||'';if(S.profile.name)store.mark('profile')}
  pushPending();render();
}
{const _mark=store.mark.bind(store);store.mark=function(key,delay){_mark(key,delay);if(SOC.user){SYNC.meta.pend[key]=Date.now();saveMeta();schedulePush()}}}
window.addEventListener('online',()=>schedulePush(0));
document.addEventListener('visibilitychange',()=>{if(!SOC.user)return;if(document.visibilityState==='visible'){pullAll(false);schedulePush(0)}else{if(Object.keys(SYNC.meta.pend).length)pushPending()}});

/* ----- tela de cadastro ----- */
function gateEl(){let g=$('#authGate');if(!g){g=document.createElement('section');g.id='authGate';g.setAttribute('aria-label','Entrar no ATHOS');document.body.appendChild(g);g.addEventListener('click',gateClick);g.addEventListener('submit',e=>{e.preventDefault();gateSubmit()});g.addEventListener('input',gateInput)}return g}
function pwField(id,label,ac,ph){return`<label class="fld"><span>${label}</span><div class="pw"><input id="${id}" type="password" autocomplete="${ac}" placeholder="${ph||''}" required><button type="button" data-g="eye" data-for="${id}">Mostrar</button></div></label>`}
function msg(){return(ACC.err?`<p class="err" role="alert">${esc(ACC.err)}</p>`:'')+(ACC.ok?`<p class="ok" role="status">${esc(ACC.ok)}</p>`:'')}
function drawGate(){
  const g=gateEl();const busy=ACC.busy?'disabled':'';let h='';
  const hero=`<div class="hero">${logoSrc()?`<img src="${logoSrc()}" alt="">`:''}<h1>ATHOS</h1><p>Treino, dieta e corrida, com seus amigos.</p></div>`;
  if(ACC.view==='loading')h=`${hero}${thinking('Abrindo…')}`;
  else if(ACC.view==='offline')h=`${hero}<p class="err">Sem conexão. Conecte à internet para entrar ou criar sua conta.</p><button class="btn primary block" data-g="retry">Tentar de novo</button>`;
  else if(ACC.view==='login')h=`${hero}<form class="in" style="gap:12px" novalidate><h2>Entrar</h2>${msg()}
    <label class="fld"><span>E-mail</span><input id="gEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" value="${esc(ACC.email)}" placeholder="voce@email.com" required></label>
    ${pwField('gPass','Senha','current-password')}
    <div style="text-align:right;margin-top:-4px"><button type="button" class="link" data-g="v" data-v="forgot">Esqueci minha senha</button></div>
    <button class="btn primary block" type="submit" ${busy}>${ACC.busy?'Entrando…':'Entrar'}</button></form>
    <p class="alt">Não tem conta? <button class="link" data-g="v" data-v="signup">Criar conta</button></p>`;
  else if(ACC.view==='signup')h=`${hero}<form class="in" style="gap:12px" novalidate><h2>Criar conta</h2>${msg()}
    <label class="fld"><span>Nome</span><input id="gName" autocomplete="name" value="${esc(ACC.name)}" placeholder="Como quer ser chamado" required maxlength="60"></label>
    <label class="fld"><span>E-mail</span><input id="gEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" value="${esc(ACC.email)}" placeholder="voce@email.com" required></label>
    ${pwField('gPass','Senha','new-password','Mínimo 8 caracteres')}<div class="meter" aria-hidden="true"><i id="gMeter" style="width:0"></i></div><small class="muted" id="gMeterL">Use letras e números.</small>
    ${pwField('gPass2','Confirmar senha','new-password')}
    <label class="check terms" style="align-items:flex-start"><input type="checkbox" id="gTerms"><span>Tenho 13 anos ou mais (se tenho menos de 18, meus pais ou responsáveis autorizaram) e aceito os <a href="#" data-legal="termos" style="color:var(--accent);font-weight:700">Termos de uso</a> e a <a href="#" data-legal="privacidade" style="color:var(--accent);font-weight:700">Política de privacidade</a>.</span></label>
    <button class="btn primary block" type="submit" ${busy}>${ACC.busy?'Criando…':'Criar conta'}</button></form>
    <p class="alt">Já tem conta? <button class="link" data-g="v" data-v="login">Entrar</button></p>`;
  else if(ACC.view==='verify')h=`${hero}<form class="in" style="gap:12px" novalidate><h2>Confirme seu e-mail</h2>
    <p>Enviamos um código para <b>${esc(ACC.email)}</b>. Digite abaixo. Se não chegar em 1 minuto, olhe o spam.</p>${msg()}
    <input id="gCode" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="••••••" aria-label="Código de confirmação">
    <button class="btn primary block" type="submit" ${busy}>${ACC.busy?'Confirmando…':'Confirmar'}</button></form>
    <p class="alt"><button class="link" data-g="resend" ${ACC.cool>0?'disabled':''}>${ACC.cool>0?`Reenviar código em ${ACC.cool}s`:'Reenviar código'}</button> · <button class="link" data-g="v" data-v="signup">Trocar e-mail</button></p>
    <p class="hint" style="text-align:center">Recebeu um <b>link</b> em vez de código? Toque nele no e-mail e depois volte aqui.</p><button class="btn block" data-g="v" data-v="login">Já confirmei, quero entrar</button>`;
  else if(ACC.view==='forgot')h=`${hero}<form class="in" style="gap:12px" novalidate><h2>Recuperar senha</h2><p class="muted">Vamos mandar um código para o seu e-mail.</p>${msg()}
    <label class="fld"><span>E-mail</span><input id="gEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" value="${esc(ACC.email)}" required></label>
    <button class="btn primary block" type="submit" ${busy}>${ACC.busy?'Enviando…':'Enviar código'}</button></form>
    <p class="alt"><button class="link" data-g="v" data-v="login">Voltar para entrar</button></p>`;
  else if(ACC.view==='reset')h=`${hero}<form class="in" style="gap:12px" novalidate><h2>Nova senha</h2><p>Digite o código enviado para <b>${esc(ACC.email)}</b> e escolha uma nova senha.</p>${msg()}
    <input id="gCode" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="••••••" aria-label="Código">
    ${pwField('gPass','Nova senha','new-password','Mínimo 8 caracteres')}${pwField('gPass2','Confirmar nova senha','new-password')}
    <button class="btn primary block" type="submit" ${busy}>${ACC.busy?'Salvando…':'Salvar nova senha'}</button></form>
    <p class="alt"><button class="link" data-g="resend" ${ACC.cool>0?'disabled':''}>${ACC.cool>0?`Reenviar código em ${ACC.cool}s`:'Reenviar código'}</button> · <button class="link" data-g="v" data-v="login">Cancelar</button></p>`;
  g.innerHTML=`<div class="in">${h}</div>`;g.hidden=false;document.body.classList.add('locked');
}
function keepDraw(){const g=$('#authGate');const vals={};if(g)g.querySelectorAll('input').forEach(i=>{if(i.id)vals[i.id]=i.type==='checkbox'?i.checked:i.value});drawGate();for(const id in vals){const i=$('#'+id);if(i){if(i.type==='checkbox')i.checked=vals[id];else i.value=vals[id]}}}
function hideGate(){const g=$('#authGate');if(g)g.hidden=true;if(!sheets.length&&$('#session').hidden&&(!$('#run')||$('#run').hidden))document.body.classList.remove('locked')}
function setView(v){ACC.view=v;ACC.err='';ACC.ok='';drawGate();const f=$('#authGate input');if(f&&!/verify|reset/.test(v))setTimeout(()=>{try{f.focus()}catch(e){}},50);if(/verify|reset/.test(v))setTimeout(()=>{const c=$('#gCode');if(c)c.focus()},50)}
let coolT=null;function startCool(){ACC.cool=60;clearInterval(coolT);coolT=setInterval(()=>{ACC.cool--;const b=$('#authGate [data-g=resend]');if(b){b.disabled=ACC.cool>0;b.textContent=ACC.cool>0?`Reenviar código em ${ACC.cool}s`:'Reenviar código'}if(ACC.cool<=0)clearInterval(coolT)},1000)}
function pwScore(p){let s=0;if(p.length>=8)s++;if(p.length>=12)s++;if(/[a-z]/i.test(p)&&/\d/.test(p))s++;if(/[^a-z0-9]/i.test(p))s++;return s}
function gateInput(e){if(e.target.id==='gPass'&&$('#gMeter')){const s=pwScore(e.target.value);const c=['var(--red)','var(--red)','var(--warn)','var(--green)','var(--green)'][s];$('#gMeter').style.cssText=`width:${s*25}%;background:${c}`;$('#gMeterL').textContent=['Muito curta','Fraca','Razoável','Boa','Forte'][s]}
  if(e.target.id==='gCode')e.target.value=e.target.value.replace(/\D/g,'').slice(0,8)}
function gateClick(e){const b=e.target.closest('[data-g]');if(!b)return;const k=b.dataset.g;
  if(k==='v'){const em=$('#gEmail');if(em)ACC.email=em.value.trim();setView(b.dataset.v)}
  else if(k==='eye'){const i=$('#'+b.dataset.for);i.type=i.type==='password'?'text':'password';b.textContent=i.type==='password'?'Mostrar':'Ocultar'}
  else if(k==='retry')boot()
  else if(k==='resend')resend()}
async function resend(){if(ACC.cool>0)return;ACC.err='';ACC.ok='';
  try{const r=ACC.view==='reset'?await SOC.sb.auth.resetPasswordForEmail(ACC.email):await SOC.sb.auth.resend({type:'signup',email:ACC.email});if(r.error)throw r.error;ACC.ok='Código reenviado.';startCool()}
  catch(e){ACC.err=accErr(e)}drawGate()}
async function gateSubmit(){
  if(ACC.busy)return;const v=ACC.view;const val=id=>{const x=$('#'+id);return x?x.value:''};ACC.err='';ACC.ok='';
  const email=(val('gEmail')||ACC.email).trim().toLowerCase();if(val('gEmail'))ACC.email=email;
  const fail=t=>{ACC.err=t;ACC.busy=false;keepDraw()};
  const pass=val('gPass'),pass2=val('gPass2'),code=val('gCode'),nm=val('gName').trim(),terms=!!($('#gTerms')&&$('#gTerms').checked);
  if(v==='login'){if(!email||!pass)return fail('Preencha e-mail e senha.');ACC.busy=true;keepDraw();
    const r=await SOC.sb.auth.signInWithPassword({email,password:pass});ACC.busy=false;
    if(r.error){if(/not confirmed/i.test(r.error.message||'')){await SOC.sb.auth.resend({type:'signup',email});ACC.view='verify';ACC.ok='Mandamos um novo código para confirmar seu e-mail.';startCool();return drawGate()}return fail(accErr(r.error))}return}
  if(v==='signup'){const name=nm;ACC.name=name;const p=pass;
    if(!name)return fail('Digite seu nome.');if(!/^\S+@\S+\.\S+$/.test(email))return fail('Digite um e-mail válido.');if(p.length<8)return fail('A senha precisa ter pelo menos 8 caracteres.');
    if(p!==pass2)return fail('As senhas não são iguais.');if(!terms)return fail('Para criar a conta, confirme a idade e aceite os Termos de uso e a Política de privacidade.');
    ACC.busy=true;keepDraw();const r=await SOC.sb.auth.signUp({email,password:p,options:{data:{name}}});ACC.busy=false;
    if(r.error)return fail(accErr(r.error));
    if(r.data&&r.data.user&&Array.isArray(r.data.user.identities)&&!r.data.user.identities.length)return fail('Já existe uma conta com esse e-mail. Toque em “Entrar”.');
    if(r.data&&r.data.session){S.profile.name=name;store.mark('profile');return}
    ACC.view='verify';startCool();return drawGate()}
  if(v==='verify'){const t=code;if(t.length<6)return fail('Digite o código que chegou no seu e-mail.');ACC.busy=true;keepDraw();
    const r=await SOC.sb.auth.verifyOtp({email:ACC.email,token:t,type:'signup'});ACC.busy=false;if(r.error)return fail(accErr(r.error));if(ACC.name){S.profile.name=ACC.name;store.mark('profile')}return}
  if(v==='forgot'){if(!/^\S+@\S+\.\S+$/.test(email))return fail('Digite um e-mail válido.');ACC.busy=true;keepDraw();const r=await SOC.sb.auth.resetPasswordForEmail(email);ACC.busy=false;
    if(r.error)return fail(accErr(r.error));ACC.view='reset';ACC.ok='Se existir uma conta com esse e-mail, o código chega em instantes.';startCool();return drawGate()}
  if(v==='reset'){const t=code,p=pass;if(t.length<6)return fail('Digite o código do e-mail.');if(p.length<8)return fail('A senha precisa ter pelo menos 8 caracteres.');if(p!==pass2)return fail('As senhas não são iguais.');
    ACC.busy=true;keepDraw();ACC.resetting=true;const r=await SOC.sb.auth.verifyOtp({email:ACC.email,token:t,type:'recovery'});if(r.error){ACC.resetting=false;return fail(accErr(r.error))}
    const u=await SOC.sb.auth.updateUser({password:p});ACC.busy=false;ACC.resetting=false;if(u.error)return fail(accErr(u.error));toast('Senha alterada!');hideGate();const usr=u.data&&u.data.user;if(usr&&SYNC.meta.uid!==usr.id){ACC.ready=true;onAccount(usr)}return}
}
async function accountLogout(){
  if(Object.keys(SYNC.meta.pend).length){toast('Enviando seus dados…');await pushPending()}
  if(Object.keys(SYNC.meta.pend).length){openSheet('Ainda há dados para enviar',`<p>Algumas alterações ainda não foram para a sua conta (sem internet?). Se sair agora, elas serão perdidas neste aparelho.</p><div class="btns"><button class="btn" data-close>Ficar</button><button class="btn danger" data-s="out">Sair mesmo assim</button></div>`,(b,el)=>{b.querySelector('[data-s=out]').onclick=async()=>{closeSheet(el);wipeLocal();await SOC.sb.auth.signOut()}});return}
  wipeLocal();await SOC.sb.auth.signOut();
}
function deleteAccount(){openSheet('Excluir minha conta',`<p>Isso apaga <b>para sempre</b> sua conta, seus treinos, refeições, corridas, posts, comentários e mensagens.</p><label class="fld"><span>Para confirmar, digite EXCLUIR</span><input id="delC" autocapitalize="characters"></label><button class="btn danger block" data-s="del">Excluir conta</button>`,(b,el)=>{
  b.querySelector('[data-s=del]').onclick=async()=>{if(b.querySelector('#delC').value.trim().toUpperCase()!=='EXCLUIR'){toast('Digite EXCLUIR para confirmar');return}
    try{const r=await SOC.sb.rpc('delete_my_account');if(r.error)throw r.error;closeSheet(el);wipeLocal();await SOC.sb.auth.signOut();toast('Conta excluída')}catch(e){toast(accErr(e))}}})}
Object.assign(ACT,{socLogout:()=>confirmSheet('Sair da conta neste aparelho? Seus dados continuam salvos na conta.','Sair',accountLogout),accDelete:deleteAccount,accSync:()=>{pullAll(true);schedulePush(0);toast('Sincronizando…')}});

function accCard(){if(!SOC.user)return'';const n=Object.keys(SYNC.meta.pend).length;
  return`<div class="card"><h3>Sua conta</h3><p class="small muted">${esc(SOC.user.email||'')}</p><p class="hint">${n?`${n} alteração${n>1?'ões':''} esperando internet para ir para a nuvem.`:'Tudo salvo na nuvem. Entre com este e-mail em outro celular e seus treinos, refeições e corridas aparecem lá.'}</p>
  <div class="btns"><button class="btn" data-act="accSync">Sincronizar agora</button><button class="btn" data-act="socLogout">Sair da conta</button></div><button class="btn danger" data-act="accDelete">Excluir minha conta</button></div>`}
/* ----- início ----- */
function boot(){
  if(!SOC.sb){if(window.supabase&&window.supabase.createClient)sbInit();if(!SOC.sb){ACC.view='offline';drawGate();return}}
  ACC.view='loading';drawGate();
  SOC.sb.auth.onAuthStateChange((ev,sess)=>{const u=sess?sess.user:null;
    if(ev==='PASSWORD_RECOVERY')return;
    if(u&&!ACC.resetting){hideGate();if(SYNC.meta.uid!==u.id||!ACC.ready){ACC.ready=true;setTimeout(()=>onAccount(u),0)}}
    else if(!u){const first=!ACC.ready;ACC.ready=true;const g=$('#authGate');if(ev==='SIGNED_OUT'||ACC.view==='loading'){ACC.view='login';ACC.err='';ACC.ok='';drawGate()}else if(!g||g.hidden)drawGate();if(first||ev==='SIGNED_OUT')onAccount(null)}});
}
boot();
