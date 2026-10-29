/* ---------- competição: nível (XP), desafios do mês, medalhas e recordes ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
.lvl{display:inline-flex;align-items:center;gap:3px;font:800 11px/1 var(--body);padding:3px 6px;border-radius:7px;background:var(--lc,var(--accent));color:#000;vertical-align:2px;margin-left:5px;letter-spacing:.02em}
.lvcard{background:var(--ink);color:#fff;border-color:transparent;gap:14px}
:root:not([data-theme="light"]) .lvcard{border-color:color-mix(in srgb,var(--accent) 22%,transparent)}
.lvtop{display:flex;align-items:center;gap:14px}
.lvbadge{width:64px;height:64px;flex:none;display:grid;place-items:center;clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);background:var(--lc,var(--accent));color:#000}
.lvbadge b{font:800 28px/1 var(--display)}
.lvtop .t{min-width:0;flex:1}.lvtop .t small{color:#A3A8B2;font-size:12.5px;display:block}
.lvtop .t strong{font:800 24px/1 var(--display);text-transform:uppercase;letter-spacing:.02em;display:block;margin:2px 0}
.xpbar{height:10px;border-radius:9px;background:#2A2B30;overflow:hidden}.xpbar i{display:block;height:100%;background:var(--lc,var(--accent));border-radius:9px;transition:width .5s}
.xpl{display:flex;justify-content:space-between;color:#A3A8B2;font-size:12.5px;font-variant-numeric:tabular-nums}
.lvcard details{color:#D5D8DE;font-size:14px}.lvcard summary{cursor:pointer;color:var(--accent);font-weight:700}
.lvcard ul{margin:8px 0 0;padding-left:18px;line-height:1.6}
.ch{gap:10px}
.ch-h{display:flex;gap:12px;align-items:flex-start}
.ch-i{width:46px;height:46px;border-radius:14px;background:var(--accent-soft);display:grid;place-items:center;font-size:24px;flex:none}
.ch-h .t{flex:1;min-width:0}.ch-h .t b{display:block;font-size:16px}.ch-h .t small{color:var(--muted);font-size:13px}
.ch .bar{height:10px}.ch .bar i{background:var(--accent)}
.ch.done .bar i{background:var(--green)}
.ch-f{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13.5px}
.ch-f .v{font-variant-numeric:tabular-nums;font-weight:700}
.medals{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px}
.medal{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;padding:12px 6px;border-radius:16px;background:var(--surface2)}
.medal span{font-size:30px;line-height:1}.medal b{font-size:12px;line-height:1.25}.medal small{color:var(--muted);font-size:11px}
.rk{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--line)}.rk:first-child{border-top:0}
.rk .pos{width:26px;text-align:center;font:800 18px var(--display);color:var(--muted)}
.rk.top .pos{color:var(--accent)}
.rk .t{flex:1;min-width:0}.rk .t b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rk .v{font:800 18px var(--display);font-variant-numeric:tabular-nums}
.rk.me{background:var(--accent-soft);border-radius:12px;padding-inline:8px;border-top-color:transparent}
.prban{display:flex;align-items:center;gap:8px;background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 22%,transparent),transparent);border-left:3px solid var(--accent);border-radius:10px;padding:8px 10px;font-weight:700;font-size:14px}
.soc-seg{overflow-x:auto;scrollbar-width:none}.soc-seg::-webkit-scrollbar{display:none}
.soc-seg button{flex:1 0 auto;padding-inline:10px}
.card.lvmini{display:flex;flex-direction:row;align-items:center;gap:12px;padding:12px 14px;cursor:pointer}
.lvmini .lvbadge{width:40px;height:40px}.lvmini .lvbadge b{font-size:18px}
.lvmini .t{flex:1;min-width:0}.lvmini .t b{display:block;font-size:15px}.lvmini .t small{color:var(--muted);font-size:12.5px}
.lvmini .xpbar{background:var(--surface2);height:7px;margin-top:6px}
.lvup{text-align:center;align-items:center;gap:14px;display:flex;flex-direction:column;padding:8px 0}
.lvup .lvbadge{width:110px;height:110px}.lvup .lvbadge b{font-size:48px}
@media (prefers-reduced-motion:no-preference){.lvup .lvbadge{animation:lvpop .6s cubic-bezier(.3,1.6,.5,1)}}
@keyframes lvpop{from{transform:scale(.3) rotate(-20deg);opacity:0}to{transform:none;opacity:1}}
</style>`);

/* --- níveis --- */
const TIERS=[[1,'Bronze','#D08B4F'],[5,'Prata','#C9CED6'],[10,'Ouro','#E9B640'],[15,'Platina','#7FD6C8'],[20,'Diamante','#7FB2FF'],[30,'Lenda','#FF7A59']];
const xpFor=L=>50*L*(L-1);
function lvOf(xp){xp=Math.max(0,xp|0);let L=1;while(xpFor(L+1)<=xp)L++;const t=[...TIERS].reverse().find(x=>L>=x[0]);return{L,xp,from:xpFor(L),to:xpFor(L+1),tier:t[1],color:t[2]}}
function lvTag(xp){if(xp==null)return'';const v=lvOf(xp);return`<span class="lvl" style="--lc:${v.color}" title="Nível ${v.L} · ${v.tier}">Nv ${v.L}</span>`}
function lvBadge(v){return`<span class="lvbadge" style="--lc:${v.color}" aria-hidden="true"><b>${v.L}</b></span>`}

/* --- pontos de cada atividade --- */
function sessKind(s){if(s.run)return s.run.type==='walk'?'walk':s.run.type==='bike'?'bike':'run';return s.checkin?'checkin':'workout'}
function sessPoints(s){const k=sessKind(s);
  if(k==='workout')return 50+Math.min(50,10*(s.prs||[]).length);
  if(k==='checkin')return 25;
  const km=(s.run.dist||0)/1000;return Math.min(300,Math.round(20+km*(k==='run'?10:k==='walk'?6:4)))}
function xpRows(){const rows=[];const days=new Set();
  for(const s of Object.values(S.sessions)){if(!s||!s.date)continue;const k=sessKind(s);
    rows.push({ref:'s:'+s.id,day:s.date,kind:k,km:s.run?Math.round((s.run.dist||0)/10)/100:0,points:sessPoints(s)});days.add(s.date)}
  for(const d of Object.keys(S.days)){if(isActive(d))days.add(d)}
  for(const d of days)rows.push({ref:'d:'+d,day:d,kind:'day',km:0,points:10});
  return rows}
function myLocalXp(){return xpRows().reduce((a,r)=>a+r.points,0)}

/* --- envio para a nuvem --- */
const XP={sent:null,uid:null,busy:false,medals:null,lastL:null};
function xpKey(){return'athos.xp.'+(SOC.user?SOC.user.id:'')}
function xpLoadSent(){if(XP.uid===SOC.user.id&&XP.sent)return;XP.uid=SOC.user.id;try{XP.sent=new Set(JSON.parse(localStorage.getItem(xpKey())||'[]'))}catch(e){XP.sent=new Set()}}
function xpSaveSent(){try{localStorage.setItem(xpKey(),JSON.stringify([...XP.sent]))}catch(e){}}
async function xpSync(){if(!SOC.user||XP.busy)return;XP.busy=true;
  try{xpLoadSent();const todo=xpRows().filter(r=>!XP.sent.has(r.ref));
    for(let i=0;i<todo.length;i+=100){const part=todo.slice(i,i+100).map(r=>({...r,user_id:SOC.user.id}));
      const {error}=await SOC.sb.from('activity_log').upsert(part,{onConflict:'user_id,ref',ignoreDuplicates:true});if(error)throw error;
      part.forEach(r=>XP.sent.add(r.ref));xpSaveSent()}
    await medalCheck();
    if(todo.length||XP.lastL==null)await xpRefresh();
  }catch(e){}finally{XP.busy=false}}
async function xpRefresh(){try{const r=await SOC.sb.from('profiles').select('xp').eq('id',SOC.user.id).single();if(r.data){SOC.me=Object.assign(SOC.me||{},{xp:r.data.xp});SOC.prof[SOC.user.id]=Object.assign(SOC.prof[SOC.user.id]||{},{xp:r.data.xp});
  const v=lvOf(r.data.xp);let seen=null;try{seen=+localStorage.getItem('athos.lvl.'+SOC.user.id)||null}catch(e){}
  if(seen&&v.L>seen)lvUpSheet(v);try{localStorage.setItem('athos.lvl.'+SOC.user.id,v.L)}catch(e){}XP.lastL=v.L;render()}}catch(e){}}
function lvUpSheet(v){openSheet('Subiu de nível!',`<div class="lvup" style="--lc:${v.color}">${lvBadge(v)}<h2 style="font:800 30px var(--display);text-transform:uppercase;margin:0">Nível ${v.L}</h2><p>Você agora é <b>${v.tier}</b>. Continue treinando para chegar ao nível ${v.L+1}.</p></div><button class="btn primary block" data-close>Bora!</button>`);try{NATIVE&&NATIVE.vibrate&&NATIVE.vibrate()}catch(e){}}

/* --- desafios do mês --- */
const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const CHS=[
  {id:'km50',t:'50 km no mês',d:'Some 50 km correndo ou caminhando.',m:'km',goal:50,u:'km',i:'🏃'},
  {id:'treinos16',t:'16 treinos no mês',d:'Finalize 16 treinos (check-in também conta).',m:'workouts',goal:16,u:'treinos',i:'🏋️'},
  {id:'dias20',t:'20 dias ativos',d:'Registre treino, corrida ou refeição em 20 dias diferentes.',m:'days',goal:20,u:'dias',i:'🔥'},
  {id:'run10',t:'Uma corrida de 10 km',d:'Complete uma única corrida de 10 km ou mais.',m:'long_run',goal:10,u:'km',i:'🎯'},
  {id:'pedal100',t:'100 km de pedal',d:'Some 100 km pedalando.',m:'bike_km',goal:100,u:'km',i:'🚴'}];
function monthRange(d){d=d||new Date();const y=d.getFullYear(),m=d.getMonth();const z=n=>String(n).padStart(2,'0');
  return{key:`${y}-${z(m+1)}`,from:`${y}-${z(m+1)}-01`,to:`${y}-${z(m+1)}-${z(new Date(y,m+1,0).getDate())}`,name:MESES[m],left:new Date(y,m+1,0).getDate()-d.getDate()}}
function chValue(c,mr){const rows=xpRows().filter(r=>r.day>=mr.from&&r.day<=mr.to);
  switch(c.m){case'km':return rows.filter(r=>r.kind==='run'||r.kind==='walk').reduce((a,r)=>a+r.km,0);
    case'bike_km':return rows.filter(r=>r.kind==='bike').reduce((a,r)=>a+r.km,0);
    case'long_run':return Math.max(0,...rows.filter(r=>r.kind==='run').map(r=>r.km));
    case'workouts':return rows.filter(r=>r.kind==='workout'||r.kind==='checkin').length;
    case'days':return new Set(rows.map(r=>r.day)).size;default:return 0}}
const fmtV=(c,v)=>c.u==='km'?fmtD(Math.floor(v*10)/10):fmtN(Math.floor(v));
const CH={joined:null,loading:false,boards:{}};
async function chLoad(){if(!SOC.user||CH.loading)return;CH.loading=true;
  try{const mr=monthRange();const [j,md]=await Promise.all([sbq(SOC.sb.from('challenge_members').select('key').eq('user_id',SOC.user.id).like('key',mr.key+':%')),sbq(SOC.sb.from('medals').select('*').eq('user_id',SOC.user.id).order('created_at',{ascending:false}))]);
    CH.joined=new Set(j.map(x=>x.key));XP.medals=md;
    await Promise.all(CHS.filter(c=>CH.joined.has(mr.key+':'+c.id)).map(c=>chBoard(c,mr,true)));
  }catch(e){CH.joined=CH.joined||new Set();XP.medals=XP.medals||[]}finally{CH.loading=false;render()}}
async function chBoard(c,mr,quiet){const key=mr.key+':'+c.id;
  try{const b=await sbq(SOC.sb.rpc('challenge_board',{p_key:key,p_metric:c.m,p_from:mr.from,p_to:mr.to}));await loadProfiles(b.map(x=>x.user_id));CH.boards[key]=b;if(!quiet)render();return b}catch(e){return null}}
async function medalCheck(){if(!SOC.user)return;const mr=monthRange();
  if(!XP.medals){try{XP.medals=await sbq(SOC.sb.from('medals').select('*').eq('user_id',SOC.user.id))}catch(e){return}}
  const have=new Set(XP.medals.map(m=>m.key));
  for(const c of CHS){const key=mr.key+':'+c.id;if(have.has(key))continue;if(chValue(c,mr)<c.goal)continue;
    const row={user_id:SOC.user.id,key,title:`${c.t} · ${mr.name}`,icon:c.i};
    try{const {error}=await SOC.sb.from('medals').insert(row);if(!error){XP.medals.unshift({...row,created_at:new Date().toISOString()});
      openSheet('Medalha conquistada!',`<div class="lvup"><span style="font-size:72px;line-height:1">${c.i}</span><h2 style="font:800 26px var(--display);text-transform:uppercase;margin:0">${esc(c.t)}</h2><p>Você completou o desafio de ${mr.name} e ganhou <b>+200 XP</b>.</p></div><button class="btn primary block" data-close>Valeu!</button>`)}}catch(e){}}}

function lvCardHtml(){const xp=SOC.me&&SOC.me.xp!=null?SOC.me.xp:myLocalXp();const v=lvOf(xp);const p=Math.round((xp-v.from)/(v.to-v.from)*100);
  return`<div class="card lvcard" style="--lc:${v.color}"><div class="lvtop">${lvBadge(v)}<div class="t"><small>Seu nível</small><strong>Nível ${v.L} · ${v.tier}</strong><small>${fmtN(xp)} XP no total</small></div></div>
  <div><div class="xpbar"><i style="width:${p}%"></i></div><div class="xpl" style="margin-top:6px"><span>${fmtN(xp-v.from)} / ${fmtN(v.to-v.from)} XP</span><span>faltam ${fmtN(v.to-xp)} para o nível ${v.L+1}</span></div></div>
  <details><summary>Como ganhar XP</summary><ul><li>Treino finalizado: <b>50 XP</b> (+10 por recorde)</li><li>Check-in: <b>25 XP</b></li><li>Corrida: <b>20 XP + 10 por km</b> · caminhada 6/km · pedal 4/km</li><li>Cada dia ativo (treino ou refeição): <b>10 XP</b></li><li>Medalha de desafio: <b>200 XP</b></li></ul></details></div>`}
function chCardHtml(c,mr){const key=mr.key+':'+c.id,v=chValue(c,mr),done=v>=c.goal,joined=CH.joined&&CH.joined.has(key);const p=Math.min(100,v/c.goal*100);
  const b=CH.boards[key];let pos='';if(joined&&b){const i=b.findIndex(x=>x.user_id===SOC.user.id);pos=i>=0?`${i+1}º de ${b.length}`:''}
  return`<div class="card ch${done?' done':''}"><div class="ch-h"><span class="ch-i" aria-hidden="true">${c.i}</span><span class="t"><b>${esc(c.t)}</b><small>${esc(c.d)}</small></span></div>
  <div class="bar"><i style="width:${p}%"></i></div>
  <div class="ch-f"><span class="v">${fmtV(c,v)} / ${fmtN(c.goal)} ${c.u}</span>${done?'<span class="chip ok">Concluído 🏅</span>':''}</div>
  <div class="btns">${joined?`<button class="btn sm" data-act="chRank" data-id="${c.id}">Ranking${pos?' · '+pos:''}</button><button class="btn sm danger" data-act="chLeave" data-id="${c.id}">Sair</button>`:`<button class="btn sm primary" data-act="chJoin" data-id="${c.id}">Participar e disputar</button>`}</div></div>`}
function chHtml(){const mr=monthRange();if(CH.joined===null&&!CH.loading)chLoad();
  let h=lvCardHtml();
  h+=`<h2 style="margin-top:10px">Desafios de ${mr.name}</h2><p class="hint" style="margin-top:-6px">${mr.left?`Faltam ${mr.left} dia${mr.left>1?'s':''}.`:'Último dia!'} Completou, ganhou medalha. Participando, você entra no ranking com quem também entrou.</p>`;
  h+=CHS.map(c=>chCardHtml(c,mr)).join('');
  const md=XP.medals||[];
  h+=`<h2 style="margin-top:10px">Minhas medalhas</h2>${md.length?`<div class="medals">${md.map(m=>`<div class="medal"><span aria-hidden="true">${esc(m.icon||'🏅')}</span><b>${esc(m.title)}</b><small>${esc(dlabel(String(m.created_at).slice(0,10),{day:'numeric',month:'short'}))}</small></div>`).join('')}</div>`:`<div class="empty"><b>Nenhuma medalha ainda</b><span>Complete um desafio do mês para ganhar a primeira.</span></div>`}`;
  return h}
async function chRank(id){const c=CHS.find(x=>x.id===id),mr=monthRange();
  openSheet(c.t,`<div id="rkL">${thinking('Carregando ranking…')}</div>`,async(b)=>{const list=await chBoard(c,mr,true);const box=b.querySelector('#rkL');
    if(!list){box.innerHTML='<p class="hint">Não consegui carregar o ranking. Confira a internet.</p>';return}
    box.innerHTML=list.length?`<p class="hint">${list.length} participante${list.length>1?'s':''} · meta ${fmtN(c.goal)} ${c.u}</p><div>${list.map((x,i)=>{const pr=SOC.prof[x.user_id]||{id:x.user_id};
      return`<div class="rk${i<3?' top':''}${x.user_id===SOC.user.id?' me':''}"><span class="pos">${i<3?['🥇','🥈','🥉'][i]:i+1}</span>${avatar(pr,'sm')}<span class="t"><b>${esc(pr.name||'Atleta')}${lvTag(pr.xp)}</b></span><span class="v">${fmtV(c,+x.value)}</span></div>`}).join('')}</div>`:'<p class="hint">Ninguém participando ainda.</p>'})}
Object.assign(ACT,{
  chJoin:async el=>{const mr=monthRange(),key=mr.key+':'+el.dataset.id;el.disabled=true;
    try{await sbq(SOC.sb.from('challenge_members').insert({user_id:SOC.user.id,key}));CH.joined.add(key);await xpSync();await chBoard(CHS.find(c=>c.id===el.dataset.id),mr,true);toast('Você entrou no desafio!');render()}catch(e){el.disabled=false;toast(sbErr(e))}},
  chLeave:el=>{const mr=monthRange(),key=mr.key+':'+el.dataset.id;confirmSheet('Sair deste desafio? Você sai do ranking, mas ainda pode ganhar a medalha.','Sair',async()=>{try{await sbq(SOC.sb.from('challenge_members').delete().eq('user_id',SOC.user.id).eq('key',key));CH.joined.delete(key);delete CH.boards[key];render()}catch(e){toast(sbErr(e))}})},
  chRank:el=>chRank(el.dataset.id),
  goChallenges:()=>{SOC.sub='desafios';go('social')}});

/* --- recordes nas corridas (melhor 1 km, 5 km e maior distância) --- */
function runPRs(s){if(!s.run)return[];const r=s.run,prev=Object.values(S.sessions).filter(x=>x.run&&x.id!==s.id&&x.run.type===r.type&&(x.ts||0)<(s.ts||Date.now()));const out=[];
  const best=(f,lo)=>{const v=prev.map(x=>x.run[f]).filter(Boolean);return v.length?(lo?Math.min(...v):Math.max(...v)):null};
  if(r.type==='run'){const b1=best('best1k',true);if(r.best1k&&(!b1||r.best1k<b1))out.push('Melhor 1 km');const b5=best('best5k',true);if(r.best5k&&(!b5||r.best5k<b5))out.push('Melhor 5 km')}
  const bd=best('dist');if(prev.length&&r.dist>(bd||0)&&r.dist>=1000)out.push(r.type==='bike'?'Maior pedal':r.type==='walk'?'Maior caminhada':'Maior corrida');
  return out}
{const _stp=sessToPost;sessToPost=function(s){const p=_stp(s);if(s.run){p.stats.prs=runPRs(s)}return p}}
{const _ps=postStats;postStats=function(p){let h=_ps(p);const prs=(p.stats||{}).prs||[];
  if(prs.length&&p.kind==='run')h+=`<div class="chips">${prs.map(x=>`<span class="chip pr">Recorde: ${esc(x)}</span>`).join('')}</div>`;
  return(prs.length?`<div class="prban">🏆 ${prs.length>1?prs.length+' novos recordes':'Novo recorde'}!</div>`:'')+h}}
{const _pc=postCard;postCard=function(p,full){const h=_pc(p,full);const a=SOC.prof[p.user_id];if(!a||a.xp==null)return h;const nm=`<b>${esc(a.name||'Atleta')}</b>`;const i=h.indexOf(nm);return i<0?h:h.slice(0,i)+`<b>${esc(a.name||'Atleta')}${lvTag(a.xp)}</b>`+h.slice(i+nm.length)}}

/* --- aba Desafios na rede social --- */
{const _vs=vSocial;vSocial=function(){let h=_vs();if(!SOC.user)return h;
  h=h.replace(`<button data-act="socSub" data-k="msgs"`,`<button data-act="socSub" data-k="desafios" aria-pressed="${SOC.sub==='desafios'}">Desafios</button><button data-act="socSub" data-k="msgs"`).replace('>Mensagens<','>Chat<');
  if(SOC.sub==='desafios'){const i=h.indexOf('</div>',h.indexOf('soc-seg'))+6;const errI=h.indexOf('<p class="chip warn"',i);const cut=errI>=0?h.indexOf('</p>',errI)+4:i;h=h.slice(0,cut)+chHtml()}
  return h};VIEWS.social=vSocial}

/* --- nível na tela Hoje --- */
{const _vh=VIEWS.hoje;VIEWS.hoje=function(){const h=_vh.apply(this,arguments);if(!SOC.user||!SOC.me||SOC.me.xp==null)return h;const xp=SOC.me.xp,v=lvOf(xp),p=Math.round((xp-v.from)/(v.to-v.from)*100);
  const card=`<button class="card lvmini" data-act="goChallenges" style="--lc:${v.color};text-align:left;width:100%;font:inherit;color:inherit">${lvBadge(v)}<span class="t"><b>Nível ${v.L} · ${v.tier}</b><small>Faltam ${fmtN(v.to-xp)} XP para o nível ${v.L+1} · ver desafios</small><span class="xpbar" style="display:block"><i style="width:${p}%"></i></span></span></button>`;
  const k='<div class="card khero">';const i=h.indexOf(k);if(i<0)return h+card;const j=h.indexOf('<div class="card"',i+k.length);return j<0?h+card:h.slice(0,j)+card+h.slice(j)}}

/* sincroniza XP ao entrar e de tempos em tempos */
let xpUid=null;setInterval(()=>{const id=SOC.user?SOC.user.id:null;if(id!==xpUid){xpUid=id;CH.joined=null;CH.boards={};XP.medals=null;XP.lastL=null;XP.sent=null;if(id)setTimeout(xpSync,4000)}else if(id)xpSync()},30000);
setInterval(()=>{const id=SOC.user?SOC.user.id:null;if(id&&id!==xpUid){xpUid=id;CH.joined=null;XP.sent=null;XP.lastL=null;setTimeout(xpSync,4000)}},2000);
