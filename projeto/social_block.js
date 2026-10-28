
/* ---------- rede social (Supabase) — APK e versão web ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
body .tabbar nav{grid-template-columns:repeat(6,1fr)}
.tab{position:relative}.tab .dot{position:absolute;top:4px;left:calc(50% + 6px);min-width:16px;height:16px;padding:0 4px;border-radius:9px;background:var(--red);color:#fff;font:700 10px/16px var(--body)}
.av{width:40px;height:40px;border-radius:50%;flex:none;display:grid;place-items:center;font:700 15px var(--display);color:#fff;overflow:hidden;background:var(--muted)}
.av img{width:100%;height:100%;object-fit:cover}.av.lg{width:72px;height:72px;font-size:26px}.av.sm{width:30px;height:30px;font-size:12px}
.post .who{display:flex;gap:10px;align-items:center;min-width:0}.post .who .t{flex:1;min-width:0;display:flex;flex-direction:column}
.post .who b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.post .who small{color:var(--muted);font-size:12.5px}
.post .body{white-space:pre-wrap;overflow-wrap:anywhere}
.post .photo{border-radius:12px;overflow:hidden;background:var(--surface2)}.post .photo img{display:block;width:100%;max-height:420px;object-fit:cover}
.post .acts{display:flex;gap:8px;border-top:1px solid var(--line);padding-top:10px}
.post .acts button{flex:1;border:0;background:var(--surface2);border-radius:10px;min-height:40px;font-weight:600;color:var(--fg)}
.post .acts button[aria-pressed="true"]{background:color-mix(in srgb,var(--red) 16%,transparent);color:var(--red)}
.post .route{height:180px}
.cmt{display:flex;gap:8px;align-items:flex-start}.cmt .bub{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:7px 10px;min-width:0;flex:1}
.cmt .bub b{font-size:13.5px}.cmt .bub p{overflow-wrap:anywhere;white-space:pre-wrap}
.chat{display:flex;flex-direction:column;gap:6px}.msg{max-width:80%;padding:8px 11px;border-radius:14px;background:var(--surface);border:1px solid var(--line);overflow-wrap:anywhere;white-space:pre-wrap;align-self:flex-start}
.msg.me{align-self:flex-end;background:var(--accent);color:var(--accent-ink);border-color:transparent}.msg small{display:block;font-size:11px;opacity:.7;margin-top:2px}
.msg .who{font-size:12px;font-weight:700;opacity:.8;display:block}
.sendbar{position:sticky;bottom:0;background:var(--bg);display:flex;gap:8px;padding-top:8px}.sendbar textarea{min-height:44px;height:44px;flex:1}
.badge{background:var(--red);color:#fff;border-radius:9px;padding:0 6px;font-size:11px;font-weight:700;margin-left:4px}
.soc-seg{overflow-x:auto}.soc-seg button{white-space:nowrap}
</style>`);
document.querySelector('.tabbar nav').insertAdjacentHTML('beforeend',`<button class="tab" data-tab="social"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M15.5 4.8a3.4 3.4 0 0 1 0 6.4M18 14.8c1.8.7 3 2.5 3.5 5.2"/></svg>Social<span class="dot" id="socDot" hidden></span></button>`);

const SB_URL='https://shvphmajljvlnqlhryfw.supabase.co',SB_KEY='sb_publishable_hQy8kXAfgKEUaRpXuGmiUA_UI6O3FBR';
const SOC={sb:null,user:null,me:null,sub:'feed',feedMode:'seguindo',feed:null,loading:false,prof:{},likeN:{},myLikes:new Set(),cmtN:{},following:new Set(),followers:0,
  convs:null,unread:0,openConv:null,clubs:null,myClubs:new Set(),people:null,pq:'',rank:null,authMode:'entrar',err:'',inbox:null};
function once(k,fn){if(SOC['_'+k])return;SOC['_'+k]=1;Promise.resolve().then(fn).finally(()=>{SOC['_'+k]=0})}
async function sbq(p){const r=await p;if(r.error)throw r.error;return r.data}
function sbErr(e){const m=String((e&&(e.message||e.error_description))||e||'');
  if(/Invalid login/i.test(m))return'E-mail ou senha incorretos.';if(/already registered|already exists/i.test(m))return'Já existe uma conta com esse e-mail. Use “Entrar”.';
  if(/Password should be/i.test(m))return'A senha precisa ter pelo menos 6 caracteres.';if(/valid email|invalid format/i.test(m))return'Esse e-mail não parece válido.';
  if(/rate limit/i.test(m))return'Muitas tentativas. Espere alguns minutos.';if(/Failed to fetch|NetworkError|network/i.test(m))return'Sem conexão com a internet.';
  if(/bloqueado/i.test(m))return'Não é possível falar com essa pessoa.';if(/username/i.test(m))return'Nome de usuário inválido ou já em uso (3 a 24 letras minúsculas, números, _ ou .).';
  return'Algo deu errado: '+m.slice(0,120)}
const avColor=id=>{let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))%360;return`hsl(${h} 45% 45%)`};
function avatar(p,cls=''){p=p||{};const n=(p.name||'?').trim();const ini=n.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
  return`<span class="av ${cls}" style="background:${avColor(p.id||n)}">${p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="" loading="lazy">`:esc(ini)}</span>`}
function ago(ts){const s=(Date.now()-new Date(ts).getTime())/1000;if(s<60)return'agora';if(s<3600)return Math.floor(s/60)+' min';if(s<86400)return Math.floor(s/3600)+' h';if(s<7*86400)return Math.floor(s/86400)+' d';return new Date(ts).toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}
async function loadProfiles(ids){const need=[...new Set(ids)].filter(i=>i&&!SOC.prof[i]);if(!need.length)return;for(const p of await sbq(SOC.sb.from('profiles').select('*').in('id',need)))SOC.prof[p.id]=p}
const pName=id=>(SOC.prof[id]&&SOC.prof[id].name)||'Atleta';

/* ----- sessão ----- */
function sbInit(){
  if(!window.supabase||!window.supabase.createClient)return;
  SOC.sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  SOC.sb.auth.onAuthStateChange((ev,sess)=>{const u=sess?sess.user:null;const changed=(u&&u.id)!==(SOC.user&&SOC.user.id);SOC.user=u;try{aiActivate()}catch(e){}if(changed){if(u)socBoot();else socReset()}schedule()});
}
function socReset(){Object.assign(SOC,{me:null,feed:null,prof:{},likeN:{},myLikes:new Set(),cmtN:{},following:new Set(),convs:null,unread:0,clubs:null,myClubs:new Set(),people:null,rank:null});if(SOC.inbox){try{SOC.sb.removeChannel(SOC.inbox)}catch(e){}SOC.inbox=null}drawDot()}
async function socBoot(){
  try{const uid=SOC.user.id;
    let me=(await sbq(SOC.sb.from('profiles').select('*').eq('id',uid)))[0];
    if(!me){me=(await sbq(SOC.sb.from('profiles').insert({id:uid,name:(SOC.user.user_metadata&&SOC.user.user_metadata.name)||S.profile.name||'Atleta'}).select()))[0]}
    SOC.me=me;SOC.prof[uid]=me;
    SOC.following=new Set((await sbq(SOC.sb.from('follows').select('following').eq('follower',uid))).map(r=>r.following));
    const {count}=await SOC.sb.from('follows').select('*',{count:'exact',head:true}).eq('following',uid);SOC.followers=count||0;
    schedule();loadFeed();loadConvs();
    if(!SOC.inbox)SOC.inbox=SOC.sb.channel('inbox').on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},onNewMessage).subscribe();
  }catch(e){SOC.err=sbErr(e);schedule()}
}

/* ----- feed ----- */
async function loadFeed(){
  if(!SOC.user)return;SOC.loading=true;schedule();
  try{let qy=SOC.sb.from('posts').select('*').order('created_at',{ascending:false}).limit(40);
    qy=SOC.feedMode==='seguindo'?qy.in('user_id',[SOC.user.id,...SOC.following]):qy.eq('visibility','public');
    const posts=await sbq(qy);await countsFor(posts);await loadProfiles(posts.map(p=>p.user_id));SOC.feed=posts;SOC.err=''}
  catch(e){SOC.err=sbErr(e)}SOC.loading=false;schedule();
}
async function countsFor(posts){const ids=posts.map(p=>p.id);if(!ids.length)return;
  const lk=await sbq(SOC.sb.from('likes').select('post_id,user_id').in('post_id',ids));const cm=await sbq(SOC.sb.from('comments').select('post_id').in('post_id',ids));
  for(const id of ids){SOC.likeN[id]=0;SOC.cmtN[id]=0}for(const l of lk){SOC.likeN[l.post_id]++;if(l.user_id===SOC.user.id)SOC.myLikes.add(l.post_id)}for(const c of cm)SOC.cmtN[c.post_id]++}
const VIS={public:'Público',followers:'Seguidores',private:'Só eu'};
function postStats(p){const s=p.stats||{};
  if(p.kind==='run'){const r={type:s.type||'run',dist:s.dist||0,moving:s.moving||0};return`<div class="grid3"><div class="stat"><span class="num">${km2(r.dist)}</span><small>km</small></div><div class="stat"><span class="num">${speedOrPace(r).replace('/km','')}</span><small>${r.type==='bike'?'velocidade':'ritmo /km'}</small></div><div class="stat"><span class="num">${fmtDur(r.moving*1000).replace(/^00:/,'')}</span><small>tempo</small></div>${s.steps?`<div class="stat"><span class="num">${fmtN(s.steps)}</span><small>passos</small></div>`:''}${s.elev?`<div class="stat"><span class="num">+${fmtN(s.elev)}</span><small>m subida</small></div>`:''}</div>`}
  if(p.kind==='workout'){if(s.checkin)return`<p class="small muted">Check-in · ${fmtN(s.dur||0)} min</p>`;
    return`<div class="grid3"><div class="stat"><span class="num">${fmtN(s.sets||0)}</span><small>séries</small></div><div class="stat"><span class="num">${fmtN(s.vol||0)}</span><small>kg de volume</small></div><div class="stat"><span class="num">${fmtN(s.dur||0)}</span><small>min</small></div></div>${(s.ex||[]).length?`<p class="small muted">${s.ex.map(e=>esc(e.n)+(e.best?` (${fmtD(e.best)} kg)`:'')).join(' · ')}</p>`:''}${(s.prs||[]).length?`<div class="chips">${s.prs.map(x=>`<span class="chip pr">Recorde: ${esc(x)}</span>`).join('')}</div>`:''}`}
  return'';
}
function postCard(p,full){const a=SOC.prof[p.user_id]||{id:p.user_id};const mine=p.user_id===(SOC.user&&SOC.user.id);
  return`<article class="card post" data-post="${p.id}"><div class="who"><button class="av-btn" data-act="socProfile" data-id="${p.user_id}" style="border:0;background:none;padding:0">${avatar(a)}</button><div class="t"><b>${esc(a.name||'Atleta')}</b><small>${ago(p.created_at)}${a.city?' · '+esc(a.city):''} · ${VIS[p.visibility]||''}</small></div><button class="icon-btn" data-act="socPostMenu" data-id="${p.id}" aria-label="Opções do post">⋯</button></div>
  ${p.title?`<h3>${esc(p.title)}</h3>`:''}${p.body?`<p class="body">${esc(p.body)}</p>`:''}${postStats(p)}
  ${p.route&&p.route.length>1?`<div class="route" ${full?'id="socMap"':''}>${routeSvg(p.route)}</div>`:''}${p.photo_url?`<div class="photo"><img src="${esc(p.photo_url)}" alt="Foto do post" loading="lazy"></div>`:''}
  <div class="acts"><button data-act="socLike" data-id="${p.id}" aria-pressed="${SOC.myLikes.has(p.id)}">♥ ${SOC.likeN[p.id]||0}</button>${full?'':`<button data-act="socOpenPost" data-id="${p.id}">Comentar · ${SOC.cmtN[p.id]||0}</button>`}</div></article>`}

/* ----- telas ----- */
function vSocial(){
  let h=`<div class="row between" style="padding-top:4px"><div><p class="eyebrow">Comunidade</p><h1>Social</h1></div>${SOC.user?'<button class="btn primary sm" data-act="socNewPost">+ Postar</button>':''}</div>`;
  if(!SOC.sb)return h+`<div class="empty"><b>Rede indisponível</b><span>Não consegui carregar a conexão com a rede. Verifique a internet e abra o app de novo.</span></div>`;
  if(!SOC.user)return h+socLoginHtml();
  const tabs=[['feed','Feed'],['msgs','Mensagens'],['clubes','Clubes'],['pessoas','Pessoas'],['eu','Eu']];
  h+=`<div class="seg soc-seg" role="group">${tabs.map(([k,l])=>`<button data-act="socSub" data-k="${k}" aria-pressed="${SOC.sub===k}">${l}${k==='msgs'&&SOC.unread?`<span class="badge">${SOC.unread}</span>`:''}</button>`).join('')}</div>`;
  if(SOC.err)h+=`<p class="chip warn" style="align-self:flex-start">${esc(SOC.err)}</p>`;
  return h+({feed:socFeedHtml,msgs:socMsgsHtml,clubes:socClubsHtml,pessoas:socPeopleHtml,eu:socMeHtml}[SOC.sub]||socFeedHtml)();
}
function socLoginHtml(){const c=SOC.authMode==='criar';
  return`<div class="card"><h3>${c?'Criar conta':'Entrar na rede'}</h3><p class="hint">Poste seus treinos e corridas, curta e comente os dos amigos, converse e participe de clubes.</p>
  <div class="seg"><button data-act="socAuthMode" data-k="entrar" aria-pressed="${!c}">Entrar</button><button data-act="socAuthMode" data-k="criar" aria-pressed="${c}">Criar conta</button></div>
  ${c?`<label class="fld"><span>Seu nome</span><input id="sName" value="${esc(S.profile.name||'')}" autocomplete="name"></label>`:''}
  <label class="fld"><span>E-mail</span><input id="sEmail" type="email" autocomplete="email" autocapitalize="off"></label>
  <label class="fld"><span>Senha${c?' (mínimo 6 caracteres)':''}</span><input id="sPass" type="password" autocomplete="${c?'new-password':'current-password'}"></label>
  ${c?`<label class="check" style="align-items:flex-start"><input type="checkbox" id="sTerms"><span class="small">Entendo que meus posts, fotos e percursos ficam guardados no servidor da rede (Supabase), que eu escolho quem vê cada post (público, seguidores ou só eu) e que posso apagar meus posts quando quiser. Os percursos escondem os primeiros e os últimos 200 m.</span></label>`:''}
  <button class="btn primary block" data-act="socAuth">${c?'Criar conta':'Entrar'}</button></div>`}
function socFeedHtml(){
  let h=`<div class="chips"><button class="chip" data-act="socFeedMode" data-k="seguindo" aria-pressed="${SOC.feedMode==='seguindo'}">Seguindo</button><button class="chip" data-act="socFeedMode" data-k="descobrir" aria-pressed="${SOC.feedMode==='descobrir'}">Descobrir</button><button class="chip" data-act="socReload">Atualizar</button></div>`;
  if(SOC.loading&&!SOC.feed)return h+thinking('Carregando o feed…');
  if(!SOC.feed||!SOC.feed.length)return h+`<div class="empty"><b>${SOC.feedMode==='seguindo'?'Seu feed está vazio':'Nenhum post público ainda'}</b><span>${SOC.feedMode==='seguindo'?'Siga pessoas na aba Pessoas ou poste sua primeira atividade.':'Seja o primeiro a postar em público.'}</span><button class="btn primary" data-act="socNewPost">Postar uma atividade</button></div>`;
  return h+SOC.feed.map(p=>postCard(p)).join('');
}
function socMsgsHtml(){
  if(!SOC.convs)return thinking('Carregando conversas…');
  if(!SOC.convs.length)return`<div class="empty"><b>Nenhuma conversa ainda</b><span>Abra o perfil de alguém e toque em “Mensagem”, ou entre num clube para falar no chat do grupo.</span></div>`;
  return`<div class="card"><div class="list">${SOC.convs.map(c=>`<button class="li" data-act="socChat" data-id="${c.id}"><span class="row" style="flex-wrap:nowrap;min-width:0">${c.is_group?`<span class="av" style="background:var(--accent)">${esc((c.name||'G')[0].toUpperCase())}</span>`:avatar(SOC.prof[c.other])}<span class="t"><b>${esc(c.title)}${c.unread?'<span class="badge">'+c.unread+'</span>':''}</b><small>${c.last?esc((c.last.user_id===SOC.user.id?'Você: ':'')+c.last.body.slice(0,60)):'Sem mensagens'}</small></span></span><span class="small muted">${c.last?ago(c.last.created_at):''}</span></button>`).join('')}</div></div>`;
}
function socClubsHtml(){
  if(!SOC.clubs){once('clubs',loadClubs);return thinking('Carregando clubes…')}
  return`<button class="btn primary" data-act="socNewClub">+ Criar clube</button>${SOC.clubs.length?`<div class="card"><div class="list">${SOC.clubs.map(c=>`<button class="li" data-act="socClub" data-id="${c.id}"><span class="t"><b>${esc(c.name)}</b><small>${c.n} membro${c.n===1?'':'s'}${SOC.myClubs.has(c.id)?' · você participa':''}</small></span><span class="muted">›</span></button>`).join('')}</div></div>`:`<div class="empty"><b>Nenhum clube ainda</b><span>Crie um clube para a sua academia ou grupo de corrida. Cada clube tem chat e ranking semanal.</span></div>`}`;
}
function socPeopleHtml(){
  if(!SOC.people)once('people',()=>socSearch(SOC.pq));
  return`<input id="socQ" type="search" placeholder="Buscar pessoas pelo nome" value="${esc(SOC.pq)}" aria-label="Buscar pessoas">${!SOC.people?thinking('Buscando…'):SOC.people.length?`<div class="card"><div class="list">${SOC.people.map(p=>`<div class="li"><button class="row" data-act="socProfile" data-id="${p.id}" style="border:0;background:none;padding:0;flex-wrap:nowrap;min-width:0;text-align:left;color:inherit">${avatar(p)}<span class="t"><b>${esc(p.name)}</b><small>${esc(p.city||'')}</small></span></button>${p.id===SOC.user.id?'<span class="chip">Você</span>':`<button class="btn sm ${SOC.following.has(p.id)?'':'primary'}" data-act="socFollow" data-id="${p.id}">${SOC.following.has(p.id)?'Seguindo':'Seguir'}</button>`}</div>`).join('')}</div></div>`:'<p class="hint">Ninguém encontrado com esse nome.</p>'}`;
}
function socMeHtml(){const m=SOC.me||{};
  if(!SOC.rank)once('rank',()=>loadRank());
  return`<div class="card"><div class="row">${avatar(m,'lg')}<div class="t" style="flex:1;min-width:0"><h2>${esc(m.name||'')}</h2><p class="small muted">${esc(m.city||'')}${m.username?' · @'+esc(m.username):''}</p></div></div>${m.bio?`<p>${esc(m.bio)}</p>`:''}
   <div class="grid3"><div class="stat"><span class="num">${SOC.following.size}</span><small>seguindo</small></div><div class="stat"><span class="num">${SOC.followers}</span><small>seguidores</small></div></div>
   <div class="btns"><button class="btn" data-act="socEditMe">Editar perfil</button><button class="btn" data-act="socProfile" data-id="${m.id}">Meus posts</button></div></div>
   <div class="card"><h3>Ranking da semana</h3><p class="hint">Você e quem você segue, desde segunda.</p>${rankHtml(SOC.rank)}</div>
   <div class="card"><p class="hint">Conectado como ${esc(SOC.user.email||'')}.</p><button class="btn danger" data-act="socLogout">Sair da conta</button></div>`;
}
function rankHtml(r){if(!r)return thinking('Calculando…');if(!r.length)return'<p class="hint">Ninguém postou atividades nesta semana ainda.</p>';
  return`<div class="list">${r.map((x,i)=>`<div class="li"><span class="row" style="flex-wrap:nowrap;min-width:0"><b class="num" style="width:22px">${i+1}</b>${avatar(SOC.prof[x.user_id],'sm')}<span class="t"><b>${esc(pName(x.user_id))}</b><small>${x.atividades} corrida(s) · ${x.treinos} treino(s)</small></span></span><b class="num" style="font-size:19px">${fmtD(+x.km)} km</b></div>`).join('')}</div>`}
async function loadRank(club){try{const r=await sbq(SOC.sb.rpc('weekly_ranking',club?{p_club:club}:{}));await loadProfiles(r.map(x=>x.user_id));if(club)return r;SOC.rank=r;schedule()}catch(e){if(club)throw e;SOC.rank=[];schedule()}}

/* ----- pessoas e perfis ----- */
let pqT=null;
async function socSearch(qs){SOC.pq=qs;try{let qy=SOC.sb.from('profiles').select('*').order('created_at',{ascending:false}).limit(30);if(qs.trim())qy=qy.ilike('name','%'+qs.trim().replace(/[%_]/g,'')+'%');const r=await sbq(qy);for(const p of r)SOC.prof[p.id]=p;SOC.people=r}catch(e){SOC.people=[];SOC.err=sbErr(e)}schedule()}
document.addEventListener('input',e=>{if(e.target.id==='socQ'){const v=e.target.value;clearTimeout(pqT);pqT=setTimeout(()=>socSearch(v),350)}});
async function socToggleFollow(id){const on=SOC.following.has(id);
  try{if(on){await sbq(SOC.sb.from('follows').delete().eq('follower',SOC.user.id).eq('following',id));SOC.following.delete(id)}else{await sbq(SOC.sb.from('follows').insert({follower:SOC.user.id,following:id}));SOC.following.add(id)}SOC.rank=null;render()}
  catch(e){toast(sbErr(e))}}
async function socProfileSheet(id){
  await loadProfiles([id]).catch(()=>{});const p=SOC.prof[id]||{id,name:'Atleta'};const mine=id===SOC.user.id;
  openSheet(p.name||'Perfil',`<div class="row">${avatar(p,'lg')}<div class="t" style="flex:1;min-width:0"><h2>${esc(p.name||'')}</h2><p class="small muted">${esc(p.city||'')}</p></div></div>${p.bio?`<p>${esc(p.bio)}</p>`:''}
   ${mine?'':`<div class="btns"><button class="btn ${SOC.following.has(id)?'':'primary'}" data-s="follow">${SOC.following.has(id)?'Deixar de seguir':'Seguir'}</button><button class="btn" data-s="dm">Mensagem</button></div>`}
   <div id="pPosts">${thinking('Carregando posts…')}</div>${mine?'':'<div class="btns"><button class="btn sm danger" data-s="block">Bloquear</button><button class="btn sm" data-s="report">Denunciar perfil</button></div>'}`,async(b,el)=>{
    b.onclick=async e=>{const x=e.target.closest('[data-s]');if(!x)return;
      if(x.dataset.s==='follow'){await socToggleFollow(id);x.textContent=SOC.following.has(id)?'Deixar de seguir':'Seguir';x.classList.toggle('primary',!SOC.following.has(id))}
      if(x.dataset.s==='dm'){try{const conv=await sbq(SOC.sb.rpc('start_dm',{other:id}));closeSheet(el);await loadConvs();socChatSheet(conv)}catch(err){toast(sbErr(err))}}
      if(x.dataset.s==='block')confirmSheet(`Bloquear ${p.name}? Vocês deixam de se ver e de conversar.`,'Bloquear',async()=>{try{await sbq(SOC.sb.from('blocks').insert({blocker:SOC.user.id,blocked:id}));await SOC.sb.from('follows').delete().eq('follower',SOC.user.id).eq('following',id);SOC.following.delete(id);closeSheet(el);loadFeed();toast('Pessoa bloqueada')}catch(err){toast(sbErr(err))}});
      if(x.dataset.s==='report')socReport({user_id:id});
    };
    try{const posts=await sbq(SOC.sb.from('posts').select('*').eq('user_id',id).order('created_at',{ascending:false}).limit(20));await countsFor(posts);for(const q of posts)socPostCache[q.id]=q;
      const box=b.querySelector('#pPosts');if(box)box.innerHTML=posts.length?posts.map(q=>postCard(q)).join(''):'<p class="hint">Nenhum post que você possa ver.</p>'}
    catch(err){const box=b.querySelector('#pPosts');if(box)box.innerHTML=`<p class="hint">${esc(sbErr(err))}</p>`}
  });
}
const socPostCache={};
function findPost(id){return(SOC.feed||[]).find(p=>p.id===id)||socPostCache[id]}
function socReport(target){openSheet('Denunciar',`<label class="fld"><span>O que aconteceu?</span><textarea id="rpR" placeholder="Ex.: conteúdo ofensivo, spam, perfil falso"></textarea></label><button class="btn primary block" data-s="send">Enviar denúncia</button>`,(b,el)=>{b.querySelector('[data-s=send]').onclick=async()=>{try{await sbq(SOC.sb.from('reports').insert({...target,reporter:SOC.user.id,reason:b.querySelector('#rpR').value.trim().slice(0,500)}));closeSheet(el);toast('Denúncia enviada')}catch(e){toast(sbErr(e))}}})}

/* ----- post: detalhe, curtir, comentar ----- */
async function socLike(id,btn){const on=SOC.myLikes.has(id);
  if(on){SOC.myLikes.delete(id);SOC.likeN[id]=Math.max(0,(SOC.likeN[id]||1)-1)}else{SOC.myLikes.add(id);SOC.likeN[id]=(SOC.likeN[id]||0)+1}
  document.querySelectorAll(`[data-act=socLike][data-id="${id}"]`).forEach(b=>{b.setAttribute('aria-pressed',!on);b.textContent='♥ '+SOC.likeN[id]});
  try{if(on)await sbq(SOC.sb.from('likes').delete().eq('post_id',id).eq('user_id',SOC.user.id));else await sbq(SOC.sb.from('likes').insert({post_id:id,user_id:SOC.user.id}))}catch(e){toast(sbErr(e))}}
function socOpenPost(id){const p=findPost(id);if(!p)return;
  openSheet('Post',`${postCard(p,true)}<h3>Comentários</h3><div id="cmts" style="display:flex;flex-direction:column;gap:8px">${thinking('Carregando…')}</div>
   <div class="sendbar"><textarea id="cmtIn" placeholder="Escreva um comentário" maxlength="1000"></textarea><button class="btn primary" data-s="send">Enviar</button></div>`,async(b,el)=>{
    if(window.mountRouteMap&&p.route&&p.route.length>1)setTimeout(()=>window.mountRouteMap(b.querySelector('#socMap'),p.route),80);
    const box=b.querySelector('#cmts');let list=[];
    const draw=()=>{box.innerHTML=list.length?list.map(c=>`<div class="cmt">${avatar(SOC.prof[c.user_id],'sm')}<div class="bub"><b>${esc(pName(c.user_id))}</b> <small class="muted">${ago(c.created_at)}</small><p>${esc(c.body)}</p>${c.user_id===SOC.user.id||p.user_id===SOC.user.id?`<button class="btn sm danger" data-del="${c.id}" style="min-height:26px;padding:0 6px">Apagar</button>`:''}</div></div>`).join(''):'<p class="hint">Nenhum comentário ainda.</p>';SOC.cmtN[id]=list.length};
    try{list=await sbq(SOC.sb.from('comments').select('*').eq('post_id',id).order('created_at'));await loadProfiles(list.map(c=>c.user_id));draw()}catch(e){box.innerHTML=`<p class="hint">${esc(sbErr(e))}</p>`}
    const ch=SOC.sb.channel('post-'+id).on('postgres_changes',{event:'INSERT',schema:'public',table:'comments',filter:'post_id=eq.'+id},async pl=>{if(!document.body.contains(el)){SOC.sb.removeChannel(ch);return}if(list.some(c=>c.id===pl.new.id))return;await loadProfiles([pl.new.user_id]);list.push(pl.new);draw()}).subscribe();
    b.onclick=async e=>{const d=e.target.closest('[data-del]');if(d){try{await sbq(SOC.sb.from('comments').delete().eq('id',d.dataset.del));list=list.filter(c=>c.id!==d.dataset.del);draw()}catch(err){toast(sbErr(err))}return}
      if(e.target.closest('[data-s=send]')){const t=b.querySelector('#cmtIn');const body=t.value.trim();if(!body)return;t.value='';
        try{const c=(await sbq(SOC.sb.from('comments').insert({post_id:id,user_id:SOC.user.id,body}).select()))[0];if(!list.some(x=>x.id===c.id))list.push(c);draw();box.lastElementChild&&box.lastElementChild.scrollIntoView({block:'nearest'})}catch(err){t.value=body;toast(sbErr(err))}}};
  });
}
function socPostMenu(id){const p=findPost(id);if(!p)return;const mine=p.user_id===SOC.user.id;
  openSheet('Opções do post',mine?`<button class="btn danger block" data-s="del">Apagar post</button>`:`<button class="btn block" data-s="report">Denunciar post</button><button class="btn danger block" data-s="block">Bloquear ${esc(pName(p.user_id))}</button>`,(b,el)=>{
    b.onclick=e=>{const x=e.target.closest('[data-s]');if(!x)return;closeSheet(el);
      if(x.dataset.s==='del')confirmSheet('Apagar este post? Curtidas e comentários também somem.','Apagar',async()=>{try{await sbq(SOC.sb.from('posts').delete().eq('id',id));SOC.feed=(SOC.feed||[]).filter(q=>q.id!==id);render();toast('Post apagado')}catch(err){toast(sbErr(err))}});
      if(x.dataset.s==='report')socReport({post_id:id});
      if(x.dataset.s==='block')socProfileSheet(p.user_id)}});
}

/* ----- postar ----- */
function hav(a,b){const R=6371000,toR=Math.PI/180,dLa=(b[0]-a[0])*toR,dLo=(b[1]-a[1])*toR;const x=Math.sin(dLa/2)**2+Math.cos(a[0]*toR)*Math.cos(b[0]*toR)*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function trimRoute(pts,m){if(!pts||pts.length<2)return null;if(!m)return pts;const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+hav(pts[i-1],pts[i]));const tot=cum[cum.length-1];const out=pts.filter((_,i)=>cum[i]>=m&&cum[i]<=tot-m);return out.length>1?out:null}
/* abre a foto já reduzida (evita estourar a memória com fotos grandes de câmera) */
async function decodePhoto(file,max){
  if(window.createImageBitmap){
    try{const probe=await createImageBitmap(file);const w=probe.width,h=probe.height;
      const k=Math.min(1,max/Math.max(w,h));if(k>=1)return probe;probe.close&&probe.close();
      return await createImageBitmap(file,{resizeWidth:Math.round(w*k),resizeHeight:Math.round(h*k),resizeQuality:'high'})}catch(e){}
  }
  const url=URL.createObjectURL(file);
  try{return await new Promise((ok,no)=>{const i=new Image();i.decoding='async';i.onload=()=>ok(i);i.onerror=()=>no(new Error('decode'));i.src=url})}
  finally{setTimeout(()=>URL.revokeObjectURL(url),1000)}
}
async function shrinkPhoto(file,opt){opt=opt||{};const max=opt.square?512:1280;
  let img;try{img=await decodePhoto(file,opt.square?1024:max)}catch(e){throw new Error('foto_ilegivel')}
  const W=img.naturalWidth||img.width,H=img.naturalHeight||img.height;if(!W||!H)throw new Error('foto_ilegivel');
  const c=document.createElement('canvas'),g=c.getContext('2d');
  if(opt.square){const side=Math.min(W,H),out=Math.min(max,side);c.width=c.height=out;g.drawImage(img,(W-side)/2,(H-side)/2,side,side,0,0,out,out)}
  else{const k=Math.min(1,max/Math.max(W,H));c.width=Math.round(W*k);c.height=Math.round(H*k);g.drawImage(img,0,0,c.width,c.height)}
  try{img.close&&img.close()}catch(e){}
  let q=0.85,blob=null;
  for(let t=0;t<4;t++){blob=await new Promise(r=>c.toBlob(r,'image/jpeg',q));if(!blob)break;if(blob.size<1500000)break;q-=0.15}
  c.width=c.height=0;
  if(!blob)throw new Error('foto_ilegivel');return blob}
function photoErr(e){const m=String((e&&e.message)||e||'');
  if(m==='foto_ilegivel')return'Não consegui abrir essa foto. Tente outra, de preferência JPG ou PNG.';
  if(/exceeded|too large|payload/i.test(m))return'A foto ficou grande demais. Tente outra.';
  if(/row-level security|JWT|not authorized|Unauthorized|403/i.test(m))return'Sua sessão expirou. Saia da conta e entre de novo.';
  return sbErr(e)}
async function uploadPhoto(file,folder,opt){const blob=await shrinkPhoto(file,opt);const path=`${SOC.user.id}/${folder||'p'}-${Date.now()}.jpg`;
  let last=null;
  for(let t=0;t<2;t++){try{await sbq(SOC.sb.storage.from('fotos').upload(path,blob,{contentType:'image/jpeg',upsert:false,cacheControl:'31536000'}));last=null;break}catch(e){if(t&&/exists|Duplicate/i.test(String(e&&e.message))){last=null;break}last=e;if(/row-level|JWT|exceeded|too large/i.test(String(e&&e.message)))break;await new Promise(r=>setTimeout(r,1200))}}
  if(last)throw last;
  return SOC.sb.storage.from('fotos').getPublicUrl(path).data.publicUrl}
function photoPath(url){const k='/object/public/fotos/';const i=String(url||'').indexOf(k);return i<0?null:decodeURIComponent(url.slice(i+k.length).split('?')[0])}
function sessToPost(s){
  if(s.run){const r=s.run;return{kind:'run',title:s.name,stats:{type:r.type,dist:r.dist,moving:r.moving,steps:r.stepsEst?null:r.steps,elev:r.elev,kcal:r.kcal,best1k:r.best1k},route:r.pts}}
  const x=sessStats(s);if(s.checkin)return{kind:'workout',title:s.name,stats:{checkin:true,dur:Math.round(x.dur/60000)}};
  return{kind:'workout',title:s.name,stats:{sets:x.sets,vol:Math.round(x.vol),dur:Math.round(x.dur/60000),ex:(s.exercises||[]).slice(0,8).map(e=>({n:e.name,best:e.type==='w'?Math.max(0,...e.sets.map(t=>num(t.kg))):null})),prs:(s.prs||[]).map(p=>p.name)}};
}
function socNewPost(preId){
  if(!SOC.user){toast('Entre na aba Social para postar');go('social');return}
  const recent=sessList().slice(0,15);let sel=preId||(recent[0]&&!recent[0].posted?recent[0].id:'');let photo=null;
  openSheet('Novo post','',(b,el)=>{
    const draw=()=>{const s=S.sessions[sel];b.innerHTML=`<label class="fld"><span>Atividade</span><select id="npS"><option value="">Só texto (sem atividade)</option>${recent.map(r=>`<option value="${r.id}" ${r.id===sel?'selected':''}>${esc(r.name)} · ${esc(dlabel(r.date,{day:'numeric',month:'short'}))}${r.posted?' (já postado)':''}</option>`).join('')}</select></label>
      ${s?`<div class="card" style="gap:6px">${postStats({kind:sessToPost(s).kind,stats:sessToPost(s).stats})}</div>`:''}
      <label class="fld"><span>Título</span><input id="npT" maxlength="120" value="${esc(s?s.name:'')}"></label>
      <label class="fld"><span>Legenda</span><textarea id="npB" maxlength="2000" placeholder="Como foi o treino?"></textarea></label>
      <div class="btns"><button class="btn" data-s="photo">${photo?'Trocar foto':'Adicionar foto'}</button>${photo?'<span class="chip ok">Foto escolhida</span>':''}</div>
      <label class="fld"><span>Quem pode ver</span><select id="npV"><option value="followers">Seguidores</option><option value="public">Público (todo mundo da rede)</option><option value="private">Só eu</option></select></label>
      ${s&&s.run?'<label class="check"><input type="checkbox" id="npZ" checked>Esconder o início e o fim do percurso (200 m)</label>':''}
      <button class="btn primary block" data-s="send">Postar</button>`};
    draw();
    b.onchange=e=>{if(e.target.id==='npS'){sel=e.target.value;draw()}};
    b.onclick=async e=>{const x=e.target.closest('[data-s]');if(!x)return;
      if(x.dataset.s==='photo'){const f=await pickPhoto();if(f){photo=f;const t=b.querySelector('#npT').value,bd=b.querySelector('#npB').value;draw();b.querySelector('#npT').value=t;b.querySelector('#npB').value=bd}return}
      if(x.dataset.s==='send'){const s=S.sessions[sel];const body=b.querySelector('#npB').value.trim(),title=b.querySelector('#npT').value.trim();if(!s&&!body&&!photo){toast('Escreva algo ou escolha uma atividade');return}
        x.disabled=true;x.textContent='Postando…';
        try{const base=s?sessToPost(s):{kind:'text',stats:{}};const row={user_id:SOC.user.id,kind:base.kind,title:title||null,body:body||null,stats:base.stats,visibility:b.querySelector('#npV').value,route:null,photo_url:null};
          if(base.route){const z=b.querySelector('#npZ');row.route=trimRoute(base.route,z&&z.checked?200:0)}
          if(photo)row.photo_url=await uploadPhoto(photo,'post');
          const p=(await sbq(SOC.sb.from('posts').insert(row).select()))[0];
          if(s){s.posted=p.id;store.mark(s.id)}SOC.likeN[p.id]=0;SOC.cmtN[p.id]=0;SOC.feed=[p,...(SOC.feed||[])];SOC.sub='feed';closeSheet(el);go('social');toast('Postado!')}
        catch(err){x.disabled=false;x.textContent='Postar';toast(photoErr(err))}}};
  });
}

/* ----- mensagens ----- */
async function loadConvs(){
  if(!SOC.user)return;
  try{const mem=await sbq(SOC.sb.from('conversation_members').select('conversation_id,user_id,last_read'));
    const ids=[...new Set(mem.map(m=>m.conversation_id))];if(!ids.length){SOC.convs=[];SOC.unread=0;drawDot();schedule();return}
    const convs=await sbq(SOC.sb.from('conversations').select('*').in('id',ids).order('last_at',{ascending:false}));
    const msgs=await sbq(SOC.sb.from('messages').select('*').in('conversation_id',ids).order('created_at',{ascending:false}).limit(300));
    const others=mem.filter(m=>m.user_id!==SOC.user.id);await loadProfiles(others.map(m=>m.user_id));
    let tot=0;SOC.convs=convs.map(c=>{const mine=mem.find(m=>m.conversation_id===c.id&&m.user_id===SOC.user.id);const other=(others.find(m=>m.conversation_id===c.id)||{}).user_id;const cm=msgs.filter(m=>m.conversation_id===c.id);
      const unread=cm.filter(m=>m.user_id!==SOC.user.id&&mine&&new Date(m.created_at)>new Date(mine.last_read)).length;tot+=unread;
      return{...c,other,title:c.is_group?(c.name||'Grupo'):pName(other),last:cm[0]||null,unread,lastRead:mine&&mine.last_read}});
    SOC.unread=tot;drawDot();schedule()}
  catch(e){SOC.convs=SOC.convs||[];SOC.err=sbErr(e);schedule()}
}
function drawDot(){const d=$('#socDot');if(!d)return;d.hidden=!SOC.unread;d.textContent=SOC.unread>9?'9+':String(SOC.unread||'')}
async function onNewMessage(pl){const m=pl.new;if(SOC.openConv&&SOC.openConv.id===m.conversation_id){SOC.openConv.push(m);return}
  if(m.user_id===SOC.user.id)return;await loadProfiles([m.user_id]).catch(()=>{});toast(`${pName(m.user_id)}: ${m.body.slice(0,60)}`);try{NATIVE&&NATIVE.vibrate()}catch(e){}loadConvs()}
function socChatSheet(convId){
  const c=(SOC.convs||[]).find(x=>x.id===convId)||{id:convId,title:'Conversa',is_group:false};
  openSheet(c.title,`<div class="chat" id="chatBox">${thinking('Carregando…')}</div><div class="sendbar"><textarea id="chatIn" placeholder="Mensagem" maxlength="2000"></textarea><button class="btn primary" data-s="send">Enviar</button></div>`,async(b,el)=>{
    const box=b.querySelector('#chatBox');let list=[];
    const draw=()=>{box.innerHTML=list.length?list.map(m=>{const me=m.user_id===SOC.user.id;return`<div class="msg ${me?'me':''}">${c.is_group&&!me?`<span class="who">${esc(pName(m.user_id))}</span>`:''}${esc(m.body)}<small>${new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small></div>`}).join(''):'<p class="hint">Diga oi!</p>';
      const sb=b;sb.scrollTop=sb.scrollHeight};
    SOC.openConv={id:convId,push:async m=>{if(!document.body.contains(el)){SOC.openConv=null;return}if(list.some(x=>x.id===m.id))return;await loadProfiles([m.user_id]).catch(()=>{});list.push(m);draw();markRead()}};
    const markRead=()=>SOC.sb.from('conversation_members').update({last_read:new Date().toISOString()}).eq('conversation_id',convId).eq('user_id',SOC.user.id).then(()=>{});
    try{list=(await sbq(SOC.sb.from('messages').select('*').eq('conversation_id',convId).order('created_at',{ascending:false}).limit(100))).reverse();await loadProfiles(list.map(m=>m.user_id));draw();markRead();if(c.unread){SOC.unread=Math.max(0,SOC.unread-c.unread);c.unread=0;drawDot()}}
    catch(e){box.innerHTML=`<p class="hint">${esc(sbErr(e))}</p>`}
    const send=async()=>{const t=b.querySelector('#chatIn');const body=t.value.trim();if(!body)return;t.value='';
      try{const m=(await sbq(SOC.sb.from('messages').insert({conversation_id:convId,user_id:SOC.user.id,body}).select()))[0];if(!list.some(x=>x.id===m.id)){list.push(m);draw()}}catch(err){t.value=body;toast(sbErr(err))}};
    b.querySelector('[data-s=send]').onclick=send;
    b.querySelector('#chatIn').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
    const obs=new MutationObserver(()=>{if(!document.body.contains(el)){SOC.openConv=null;obs.disconnect();loadConvs()}});obs.observe($('#sheets'),{childList:true});
  });
}

/* ----- clubes ----- */
async function loadClubs(){try{const clubs=await sbq(SOC.sb.from('clubs').select('*').order('created_at',{ascending:false}).limit(100));const mem=await sbq(SOC.sb.from('club_members').select('club_id,user_id'));
  SOC.myClubs=new Set(mem.filter(m=>m.user_id===SOC.user.id).map(m=>m.club_id));SOC.clubs=clubs.map(c=>({...c,n:mem.filter(m=>m.club_id===c.id).length})).sort((a,b)=>(SOC.myClubs.has(b.id)-SOC.myClubs.has(a.id))||b.n-a.n)}
  catch(e){SOC.clubs=[];SOC.err=sbErr(e)}schedule()}
function socNewClub(){openSheet('Criar clube',`<label class="fld"><span>Nome</span><input id="ncN" maxlength="60" placeholder="Ex.: Academia Força Total"></label><label class="fld"><span>Descrição</span><textarea id="ncD" maxlength="500" placeholder="Quem pode entrar, horários de treino, objetivo do grupo…"></textarea></label><button class="btn primary block" data-s="ok">Criar</button>`,(b,el)=>{
  b.querySelector('[data-s=ok]').onclick=async()=>{const name=b.querySelector('#ncN').value.trim();if(name.length<2){toast('Dê um nome ao clube');return}
    try{const c=(await sbq(SOC.sb.from('clubs').insert({name,description:b.querySelector('#ncD').value.trim()||null,owner:SOC.user.id}).select()))[0];closeSheet(el);SOC.clubs=null;await loadClubs();loadConvs();socClubSheet(c.id)}catch(e){toast(sbErr(e))}}})}
function socClubSheet(id){const c=(SOC.clubs||[]).find(x=>x.id===id);if(!c)return;const inC=SOC.myClubs.has(id),own=c.owner===SOC.user.id;
  openSheet(c.name,`${c.description?`<p>${esc(c.description)}</p>`:''}<p class="small muted">${c.n} membro${c.n===1?'':'s'}</p>
   <div class="btns">${inC?'<button class="btn primary" data-s="chat">Abrir chat do clube</button>':'<button class="btn primary" data-s="join">Entrar no clube</button>'}${inC&&!own?'<button class="btn" data-s="leave">Sair</button>':''}${own?'<button class="btn danger" data-s="del">Apagar clube</button>':''}</div>
   <div class="card"><h3>Ranking da semana</h3><div id="crk">${thinking('Calculando…')}</div></div>`,async(b,el)=>{
    loadRank(id).then(r=>{const x=b.querySelector('#crk');if(x)x.innerHTML=rankHtml(r)}).catch(e=>{const x=b.querySelector('#crk');if(x)x.innerHTML=`<p class="hint">${esc(sbErr(e))}</p>`});
    b.onclick=async e=>{const x=e.target.closest('[data-s]');if(!x)return;
      try{if(x.dataset.s==='join'){await sbq(SOC.sb.from('club_members').insert({club_id:id,user_id:SOC.user.id}));closeSheet(el);await loadClubs();await loadConvs();toast('Você entrou no clube');socClubSheet(id)}
        if(x.dataset.s==='leave'){await sbq(SOC.sb.from('club_members').delete().eq('club_id',id).eq('user_id',SOC.user.id));closeSheet(el);loadClubs();loadConvs()}
        if(x.dataset.s==='chat'){const cv=await sbq(SOC.sb.from('conversations').select('id').eq('club_id',id));if(!cv.length){toast('Chat ainda não disponível');return}closeSheet(el);await loadConvs();socChatSheet(cv[0].id)}
        if(x.dataset.s==='del')confirmSheet(`Apagar o clube “${c.name}” e o chat dele?`,'Apagar',async()=>{try{await sbq(SOC.sb.from('clubs').delete().eq('id',id));closeSheet(el);SOC.clubs=null;loadClubs();loadConvs()}catch(err){toast(sbErr(err))}})}
      catch(err){toast(sbErr(err))}};
  })}

/* ----- meu perfil ----- */
function socEditMe(){const m=SOC.me||{};let up=null;
  openSheet('Editar perfil',`<div class="row" style="flex-wrap:nowrap"><span id="emAv">${avatar(m,'lg')}</span><div style="display:flex;flex-direction:column;gap:4px;min-width:0"><button class="btn" data-s="photo">Trocar foto</button><small class="muted" id="emSt" aria-live="polite"></small></div></div><label class="fld"><span>Nome</span><input id="emN" maxlength="60" value="${esc(m.name||'')}"></label><label class="fld"><span>Cidade</span><input id="emC" maxlength="60" value="${esc(m.city||'')}"></label><label class="fld"><span>Bio</span><textarea id="emB" maxlength="280">${esc(m.bio||'')}</textarea></label><button class="btn primary block" data-s="save">Salvar</button>`,(b,el)=>{
    const st=b.querySelector('#emSt'),pb=b.querySelector('[data-s=photo]');
    const setAv=src=>{const a=b.querySelector('#emAv .av');if(a)a.innerHTML=`<img src="${esc(src)}" alt="">`};
    async function sendPhoto(file){
      const old=SOC.me&&SOC.me.avatar_url,prev=URL.createObjectURL(file);setAv(prev);
      pb.disabled=true;pb.textContent='Enviando…';st.textContent='Enviando a foto…';st.style.color='';
      try{const url=await uploadPhoto(file,'avatar',{square:true});
        const row=(await sbq(SOC.sb.from('profiles').update({avatar_url:url}).eq('id',SOC.user.id).select()))[0];
        if(!row)throw new Error('Não consegui salvar a foto no perfil.');
        SOC.me=row;SOC.prof[SOC.user.id]=row;st.textContent='Foto atualizada';toast('Foto de perfil atualizada');render();
        const op=photoPath(old);if(op&&op.startsWith(SOC.user.id+'/'))SOC.sb.storage.from('fotos').remove([op]).catch(()=>{});
      }catch(err){if(old)setAv(old);else{const a=b.querySelector('#emAv');if(a)a.innerHTML=avatar(SOC.me||m,'lg')}st.textContent=photoErr(err);st.style.color='var(--red)';throw err}
      finally{pb.disabled=false;pb.textContent='Trocar foto';setTimeout(()=>URL.revokeObjectURL(prev),4000)}}
    b.onclick=async e=>{const x=e.target.closest('[data-s]');if(!x)return;
      if(x.dataset.s==='photo'){const f=await pickPhoto();if(!f)return;up=sendPhoto(f);up.catch(()=>{});return}
      if(x.dataset.s==='save'){x.disabled=true;x.textContent='Salvando…';
        try{if(up){try{await up}catch(_){} }
          const upd={name:b.querySelector('#emN').value.trim()||'Atleta',city:b.querySelector('#emC').value.trim()||null,bio:b.querySelector('#emB').value.trim()||null};
          SOC.me=(await sbq(SOC.sb.from('profiles').update(upd).eq('id',SOC.user.id).select()))[0];SOC.prof[SOC.user.id]=SOC.me;closeSheet(el);render();toast('Perfil salvo')}
        catch(err){x.disabled=false;x.textContent='Salvar';toast(sbErr(err))}}};
  })}

/* ----- ligar ao app ----- */
VIEWS.social=vSocial;
Object.assign(ACT,{
  socSub:el=>{SOC.sub=el.dataset.k;SOC.err='';if(SOC.sub==='msgs')loadConvs();if(SOC.sub==='clubes')loadClubs();if(SOC.sub==='eu')SOC.rank=null;render()},
  socAuthMode:el=>{SOC.authMode=el.dataset.k;render()},
  socAuth:async el=>{const c=SOC.authMode==='criar';const email=($('#sEmail').value||'').trim(),password=$('#sPass').value||'';
    if(!email||!password){toast('Preencha e-mail e senha');return}if(c&&!$('#sTerms').checked){toast('Marque a caixa para concordar com o uso dos dados');return}
    el.disabled=true;el.textContent=c?'Criando…':'Entrando…';
    try{if(c){const name=($('#sName').value||'').trim()||'Atleta';const r=await SOC.sb.auth.signUp({email,password,options:{data:{name}}});if(r.error)throw r.error;if(!r.data.session)toast('Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.')}
      else{const r=await SOC.sb.auth.signInWithPassword({email,password});if(r.error)throw r.error}}
    catch(e){toast(sbErr(e));el.disabled=false;el.textContent=c?'Criar conta':'Entrar'}},
  socLogout:()=>confirmSheet('Sair da conta da rede neste aparelho? Seus treinos continuam salvos no app.','Sair',async()=>{await SOC.sb.auth.signOut();render()}),
  socFeedMode:el=>{SOC.feedMode=el.dataset.k;SOC.feed=null;loadFeed()},
  socReload:()=>{SOC.feed=null;loadFeed()},
  socNewPost:()=>socNewPost(),
  socLike:el=>socLike(el.dataset.id,el),
  socOpenPost:el=>socOpenPost(el.dataset.id),
  socPostMenu:el=>socPostMenu(el.dataset.id),
  socProfile:el=>socProfileSheet(el.dataset.id),
  socFollow:el=>socToggleFollow(el.dataset.id),
  socChat:el=>socChatSheet(el.dataset.id),
  socNewClub,socClub:el=>socClubSheet(el.dataset.id),socEditMe,
  socShare:el=>socNewPost(el.dataset.id)
});
// botão “Postar na rede” nos resumos de atividade
{const addShare=s=>{const el=sheets[sheets.length-1];if(!el||!s)return;const b=el.querySelector('.sheet-b');if(!b||b.querySelector('[data-act=socShare]'))return;
   b.insertAdjacentHTML('afterbegin',`<button class="btn soft block" data-act="socShare" data-id="${s.id}">${s.posted?'Postar de novo na rede':'Postar na rede'}</button>`)};
 const _rd=runDetail;runDetail=function(s,fresh){_rd(s,fresh);addShare(s)};
 const _sd=sessDetail;sessDetail=function(id){_sd(id);const s=S.sessions[id];if(s&&!s.run)addShare(s)};
 const _sm=summarySheet;summarySheet=function(s){_sm(s);addShare(s)};
 document.addEventListener('click',e=>{const x=e.target.closest('[data-act=socShare]');if(x){const el=x.closest('.wrapS');if(el)closeSheet(el)}},true);}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&SOC.user){loadConvs();if(S.tab==='social'&&SOC.sub==='feed')loadFeed()}});
sbInit();
