/* ---------- Chat e clubes (visual novo e mais opções) ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
/* lista de conversas */
.cx-top{display:flex;flex-direction:column;gap:10px}
.cx-search{position:relative}.cx-search input{padding-left:38px}.cx-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:18px;height:18px;stroke:var(--muted);fill:none;stroke-width:2}
.cx-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}.cx-chips::-webkit-scrollbar{display:none}
.cx-chip{border:1px solid var(--cardline);background:var(--surface);color:var(--fg);border-radius:99px;padding:7px 13px;font:600 13px var(--body);white-space:nowrap;flex:none}
.cx-chip[aria-pressed=true]{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.cvl{display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--cardline);border-radius:20px;overflow:hidden}
.cv{display:flex;align-items:center;gap:12px;padding:12px 14px;border:0;background:none;color:inherit;font:inherit;text-align:left;width:100%;position:relative}
.cv+.cv{border-top:1px solid var(--line)}
.cv:active{background:var(--surface2)}
.cv .avw{position:relative;flex:none}.cv .av{width:50px;height:50px;font-size:18px}
.cv .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.cv .t b{display:flex;align-items:center;gap:6px;font-size:15.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cv .t small{color:var(--muted);font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cv.unr .t small{color:var(--fg);font-weight:600}
.cv .r{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex:none}
.cv .r time{font-size:12px;color:var(--muted)}.cv.unr .r time{color:var(--accent);font-weight:700}
.cv .nb{min-width:20px;height:20px;border-radius:10px;background:var(--accent);color:#000;font:800 11.5px/20px var(--body);text-align:center;padding:0 6px}
.cv .mut{font-size:12px;opacity:.6}
.ctile{display:grid;place-items:center;border-radius:16px;color:#fff;flex:none;font-size:24px;line-height:1}
/* conversa */
.chatS{height:96%;max-height:96%!important}
.chatS .sheet-h{padding:10px 12px;border-bottom:1px solid var(--line);gap:10px;justify-content:flex-start}
.chatS .sheet-h h2{display:none}
.chh{display:flex;align-items:center;gap:10px;flex:1;min-width:0;border:0;background:none;color:inherit;font:inherit;text-align:left;padding:0}
.chh .av,.chh .ctile{width:42px;height:42px;font-size:16px}
.chh .t{min-width:0;display:flex;flex-direction:column}.chh .t b{font:700 17px var(--display);text-transform:uppercase;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chh .t small{font-size:12.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chh .t small.on{color:var(--green)}
.chatS .sheet-b{padding-top:0;padding-bottom:0;gap:0;flex:1}
.chpin{position:sticky;top:0;z-index:2;margin:0 -16px;padding:9px 16px;background:color-mix(in srgb,var(--accent) 14%,var(--bg));border-bottom:1px solid var(--line);font-size:13.5px;display:flex;gap:8px;align-items:flex-start}
.chbox{display:flex;flex-direction:column;gap:2px;padding:12px 0 8px;flex:1}
.chday{align-self:center;margin:12px 0 8px;font:700 11.5px var(--body);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);background:var(--surface);border:1px solid var(--cardline);padding:4px 10px;border-radius:99px}
.cmr{display:flex;gap:7px;align-items:flex-end;max-width:84%;margin-top:6px}.cmr.cont{margin-top:1px}
.cmr.me{align-self:flex-end;flex-direction:row-reverse}
.cmr .mav{width:28px;flex:none}.cmr .mav .av{width:28px;height:28px;font-size:11px}
.bb{position:relative;padding:8px 11px 6px;border-radius:18px;background:var(--surface);border:1px solid var(--cardline);overflow-wrap:anywhere;white-space:pre-wrap;font-size:15px;line-height:1.35;min-width:56px;cursor:pointer;-webkit-user-select:none;user-select:none}
.cmr:not(.me) .bb{border-bottom-left-radius:6px}.cmr.me .bb{border-bottom-right-radius:6px;background:var(--accent);color:#141414;border-color:transparent}
.cmr.cont:not(.me) .bb{border-top-left-radius:6px}.cmr.cont.me .bb{border-top-right-radius:6px}
.bb .who{display:block;font:700 12.5px var(--body);margin-bottom:2px}
.bb .tm{float:right;margin:6px 0 -2px 10px;font-size:10.5px;opacity:.65;white-space:nowrap}
.bb .q{display:block;border-left:3px solid currentColor;padding:3px 8px;margin:0 0 5px;border-radius:6px;background:rgba(127,127,127,.15);font-size:13px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px}
.bb .q b{display:block;font-size:12px}
.shr{display:flex;gap:10px;align-items:center;padding:4px 2px;min-width:200px}
.shr .ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:rgba(0,0,0,.18);flex:none}
.cmr:not(.me) .shr .ic{background:var(--surface2)}
.shr b{display:block;font:800 15px var(--display);text-transform:uppercase}.shr small{font-size:12.5px;opacity:.8}
.rx{display:flex;gap:4px;flex-wrap:wrap;margin-top:-6px;position:relative;z-index:1;padding:0 8px}.cmr.me+.rxw .rx,.rxw.me .rx{justify-content:flex-end}
.rx span{background:var(--surface2);border:2px solid var(--bg);border-radius:99px;padding:1px 6px;font-size:12.5px}
.rx span.mine{background:color-mix(in srgb,var(--accent) 30%,var(--surface2))}
.rxw{display:flex}.rxw.me{justify-content:flex-end}.rxw:not(.me){padding-left:35px}
.seen{align-self:flex-end;font-size:11.5px;color:var(--muted);margin:2px 4px 0}
.chcomp{position:sticky;bottom:0;background:var(--bg);margin:0 -16px;padding:8px 12px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px}
.chrep{display:flex;align-items:center;gap:8px;background:var(--surface);border-left:3px solid var(--accent);border-radius:10px;padding:6px 10px;font-size:13px}
.chrep span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chin{display:flex;gap:8px;align-items:flex-end}
.chin textarea{flex:1;min-height:44px;max-height:120px;height:44px;border-radius:22px;padding:11px 16px;resize:none;line-height:1.3}
.rbtn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex:none;border:1px solid var(--cardline);background:var(--surface);color:var(--fg);font-size:20px}
.rbtn.send{background:var(--accent);border-color:var(--accent);color:#000}.rbtn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.emrow{display:flex;justify-content:space-between;gap:4px;background:var(--surface);border:1px solid var(--cardline);border-radius:99px;padding:6px 8px}
.emrow button{font-size:28px;border:0;background:none;padding:4px 6px;border-radius:50%;line-height:1}.emrow button[aria-pressed=true]{background:var(--surface2)}
.mact{display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--cardline);border-radius:18px;overflow:hidden}
.mact button{display:flex;align-items:center;gap:12px;padding:14px 16px;border:0;background:none;color:inherit;font:600 15px var(--body);text-align:left}.mact button+button{border-top:1px solid var(--line)}
.mact button.danger{color:var(--red)}
.mprev{background:var(--surface);border-radius:14px;padding:10px 12px;font-size:14px;max-height:90px;overflow:hidden;color:var(--muted)}
/* clubes */
.clg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.clc{position:relative;border:1px solid var(--cardline);background:var(--surface);border-radius:20px;overflow:hidden;text-align:left;color:inherit;font:inherit;padding:0;display:flex;flex-direction:column}
.clc .bn{height:62px;position:relative}
.clc .bn .ctile{position:absolute;left:12px;bottom:-20px;width:46px;height:46px;font-size:24px;border:3px solid var(--surface);border-radius:15px}
.clc .bd{padding:26px 12px 12px;display:flex;flex-direction:column;gap:3px;min-width:0}
.clc .bd b{font:800 16px var(--display);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.clc .bd small{color:var(--muted);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.clc .tag{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.55);color:#fff;font:700 11px var(--body);padding:3px 8px;border-radius:99px;backdrop-filter:blur(4px)}
.clc .tag.hot{background:var(--accent);color:#000}
.clsec{font:800 15px var(--display);text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:6px 2px -2px}
.clubS .sheet-h{position:absolute;top:0;right:0;z-index:3;background:none}.clubS .sheet-h h2{display:none}.clubS .sheet-h .icon-btn{background:rgba(0,0,0,.5);color:#fff;border-color:transparent}.clubS .sheet-b{padding-top:0}.clubS .bn{border-radius:26px 26px 0 0}
.clh{margin:0 -16px;position:relative}
.clh .bn{height:120px}
.clh .ctile{position:absolute;left:16px;top:78px;width:76px;height:76px;font-size:40px;border:4px solid var(--bg);border-radius:22px}
.clh .in{padding:44px 16px 4px;display:flex;flex-direction:column;gap:4px}
.clh h2{font:800 28px/1.05 var(--display);text-transform:uppercase;margin:0}
.clh .meta{color:var(--muted);font-size:13.5px}
.avs{display:flex;align-items:center}.avs .av{width:28px;height:28px;font-size:11px;border:2px solid var(--bg);margin-left:-8px}.avs .av:first-child{margin-left:0}
.avs small{margin-left:8px;color:var(--muted);font-size:13px}
.clbtns{display:flex;gap:8px;flex-wrap:wrap}.clbtns .btn{flex:1;min-width:0}
.clnote{display:flex;gap:10px;background:color-mix(in srgb,var(--accent) 12%,var(--surface));border:1px solid color-mix(in srgb,var(--accent) 40%,transparent);border-radius:16px;padding:12px 14px;font-size:14px}
.clnote b{display:block;font:800 13px var(--display);text-transform:uppercase;letter-spacing:.05em;color:var(--accent);margin-bottom:2px}
.goal{display:flex;flex-direction:column;gap:6px}.goal .bar{height:10px;border-radius:9px;background:var(--surface2);overflow:hidden}.goal .bar i{display:block;height:100%;background:var(--accent);border-radius:9px}
.goal .row{justify-content:space-between}
.cltabs{display:flex;gap:4px;background:var(--surface);border:1px solid var(--cardline);border-radius:14px;padding:4px;position:sticky;top:-2px;z-index:2}
.cltabs button{flex:1;border:0;background:none;color:var(--muted);font:700 13.5px var(--body);padding:9px 4px;border-radius:10px}
.cltabs button[aria-selected=true]{background:var(--fg);color:var(--bg)}
.mbr{display:flex;align-items:center;gap:10px;padding:10px 0}.mbr+.mbr{border-top:1px solid var(--line)}
.mbr .t{flex:1;min-width:0}.mbr .t b{display:block}.mbr .t small{color:var(--muted);font-size:12.5px}
.crown{font-size:11px;background:var(--accent);color:#000;border-radius:99px;padding:1px 7px;font-weight:800;margin-left:6px;vertical-align:2px}
.pick{display:flex;flex-wrap:wrap;gap:6px}.pick button{width:44px;height:44px;border-radius:12px;border:2px solid transparent;background:var(--surface);font-size:22px}
.pick button[aria-pressed=true]{border-color:var(--accent)}
.pick.col button{border-radius:50%;width:38px;height:38px}.pick.col button[aria-pressed=true]{border-color:var(--fg);box-shadow:0 0 0 2px var(--bg) inset}
</style>`);

/* ---------- utilidades ---------- */
const CL_KINDS=[['academia','Academia','🏋️'],['corrida','Corrida','🏃'],['ciclismo','Ciclismo','🚴'],['crossfit','Crossfit','🤸'],['luta','Luta','🥊'],['funcional','Funcional','⚡'],['outro','Outro','⭐']];
const CL_ICONS=['🏋️','🏃','🚴','💪','🔥','⚡','🥊','🤸','🏊','⛰️','🏆','🦁','🐺','🦅','⚔️','🛡️'];
const CL_COLORS=['#E9B640','#E5484D','#F76B15','#30A46C','#0090FF','#8E4EC6','#D6409F','#12A594'];
const CH_EMO=['❤️','🔥','💪','👏','😂','😮'];
const clKind=k=>CL_KINDS.find(x=>x[0]===k)||CL_KINDS[CL_KINDS.length-1];
const clColor=c=>c&&/^#[0-9a-fA-F]{6}$/.test(c.color||'')?c.color:CL_COLORS[Math.abs([...String(c&&c.id||'x')].reduce((a,ch)=>a*31+ch.charCodeAt(0)|0,7))%CL_COLORS.length];
const clIcon=c=>(c&&c.icon)||clKind(c&&c.kind)[2];
const clBanner=c=>{const k=clColor(c);return`background:radial-gradient(120% 140% at 85% 0%,${k} 0%,color-mix(in srgb,${k} 55%,#000) 55%,#0b0b0b 100%)`};
const clTile=(c,size)=>`<span class="ctile" style="background:${clColor(c)};${size?`width:${size}px;height:${size}px;font-size:${Math.round(size*.5)}px`:''}">${esc(clIcon(c))}</span>`;
const hm=ts=>new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
function dayKey(ts){const d=new Date(ts);return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()}
function dayLbl(ts){const d=new Date(ts),n=new Date();const y=new Date(n);y.setDate(n.getDate()-1);
  if(dayKey(d)===dayKey(n))return'Hoje';if(dayKey(d)===dayKey(y))return'Ontem';
  return d.toLocaleDateString('pt-BR',{weekday:(n-d)<6*864e5?'long':undefined,day:'numeric',month:'short',year:d.getFullYear()!==n.getFullYear()?'numeric':undefined})}
function cvTime(ts){if(!ts)return'';const d=new Date(ts),n=new Date();if(dayKey(d)===dayKey(n))return hm(ts);const diff=(n-d)/864e5;
  if(diff<2&&dayLbl(ts)==='Ontem')return'Ontem';if(diff<7)return d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','');return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
function msgPreview(m){if(!m)return'Sem mensagens ainda';const who=m.user_id===SOC.user.id?'Você: ':'';
  if(m.kind==='share')return who+'💪 '+((m.meta&&m.meta.t)||'Treino compartilhado');return who+String(m.body||'')}
function convClub(c){return c&&c.club_id&&(SOC.clubs||[]).find(x=>x.id===c.club_id)}
const SVG_SEARCH='<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const SVG_SEND='<svg viewBox="0 0 24 24"><path d="M5 12h13M12 5l7 7-7 7"/></svg>';
const SVG_PLUS='<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
const SVG_DOTS='<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor;stroke:none"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';

/* ---------- lista de conversas ---------- */
SOC.chatF=SOC.chatF||'todas';
socMsgsHtml=function(){
  if(!SOC.convs)return thinking('Carregando conversas…');
  if(!SOC.clubs)once('clubs',loadClubs);
  if(!SOC.convs.length)return`<div class="empty"><b>Nenhuma conversa ainda</b><span>Abra o perfil de alguém e toque em “Mensagem”, ou entre num clube para conversar com o grupo.</span></div><button class="btn primary block" data-act="socSub" data-k="pessoas">Encontrar pessoas</button>`;
  const f=SOC.chatF,nU=SOC.convs.filter(c=>c.unread).length;
  const L=SOC.convs.filter(c=>f==='naolidas'?c.unread:f==='grupos'?c.is_group:f==='privadas'?!c.is_group:true);
  const row=c=>{const cl=convClub(c),p=SOC.prof[c.other];const on=!c.is_group&&p&&presTxt(p)==='Online';
    const pic=c.is_group?clTile(cl||{id:c.id,name:c.name},50):avatar(p);
    return`<button class="cv${c.unread?' unr':''}" data-act="socChat" data-id="${c.id}" data-name="${esc((c.title||'').toLowerCase())}"><span class="avw">${pic}${on?'<i class="ond"></i>':''}</span>
      <span class="t"><b>${esc(c.title)}${c.muted?'<span class="mut" title="Silenciada">🔕</span>':''}</b><small>${esc(msgPreview(c.last).slice(0,80))}</small></span>
      <span class="r"><time>${cvTime(c.last?c.last.created_at:c.last_at)}</time>${c.unread?`<span class="nb">${c.unread>99?'99+':c.unread}</span>`:'<span style="height:20px"></span>'}</span></button>`};
  return`<div class="cx-top"><label class="cx-search">${SVG_SEARCH}<input id="chatQ" type="search" placeholder="Buscar conversa" autocomplete="off"></label>
    <div class="cx-chips">${[['todas','Todas'],['naolidas',`Não lidas${nU?' ('+nU+')':''}`],['privadas','Pessoas'],['grupos','Clubes']].map(([k,l])=>`<button class="cx-chip" data-act="chatF" data-k="${k}" aria-pressed="${f===k}">${l}</button>`).join('')}</div></div>
    ${L.length?`<div class="cvl" id="cvList">${L.map(row).join('')}</div>`:`<div class="empty"><b>Nada aqui</b><span>${f==='naolidas'?'Você leu todas as mensagens.':'Nenhuma conversa nesse filtro.'}</span></div>`}`};
document.addEventListener('input',e=>{if(e.target.id==='chatQ'){const q=e.target.value.trim().toLowerCase();document.querySelectorAll('#cvList .cv').forEach(b=>{b.hidden=!!q&&!b.dataset.name.includes(q)})}
  if(e.target.id==='clubQ'){const q=e.target.value.trim().toLowerCase();document.querySelectorAll('.clc[data-name]').forEach(b=>{b.hidden=!!q&&!b.dataset.name.includes(q)})}});

/* ---------- conversa ---------- */
socChatSheet=function(convId){
  const c=(SOC.convs||[]).find(x=>x.id===convId)||{id:convId,title:'Conversa',is_group:false};
  const cl=convClub(c),p=SOC.prof[c.other];
  const el=openSheet(c.title,`${cl&&cl.notice?`<div class="chpin"><span>📌</span><span><b>Aviso do clube:</b> ${esc(cl.notice)}</span></div>`:''}<div class="chbox" id="chatBox">${thinking('Carregando…')}</div>
    <div class="chcomp"><div id="chRep"></div><div class="chin"><button class="rbtn" data-s="plus" aria-label="Compartilhar treino">${SVG_PLUS}</button><textarea id="chatIn" rows="1" placeholder="Mensagem" maxlength="2000"></textarea><button class="rbtn send" data-s="send" aria-label="Enviar">${SVG_SEND}</button></div></div>`,async(b,el)=>{
    const sh=el.querySelector('.sheet');sh.classList.add('chatS');
    const hd=el.querySelector('.sheet-h');
    const sub=()=>{if(c.is_group){const n=cl?cl.n:null;return`<small>${n?n+' membro'+(n===1?'':'s'):'Grupo'}${c.muted?' · 🔕 silenciada':''}</small>`}
      const t=p?presTxt(p):'';return`<small class="${t==='Online'?'on':''}">${t?esc(t):'Toque para ver o perfil'}${c.muted?' · 🔕':''}</small>`};
    const drawHd=()=>{hd.innerHTML=`<button class="icon-btn" data-close aria-label="Voltar">←</button><button class="chh" data-s="who">${c.is_group?clTile(cl||{id:c.id},42):avatar(p)}<span class="t"><b>${esc(c.title)}</b>${sub()}</span></button><button class="icon-btn" data-s="menu" aria-label="Opções">${SVG_DOTS}</button>`};drawHd();
    const box=b.querySelector('#chatBox');let list=[],rx={},otherRead=c.otherRead||null,reply=null;
    const byId=id=>list.find(m=>m.id===id);
    const bodyHtml=m=>{if(m.kind==='share'){const x=m.meta||{};return`<span class="shr"><span class="ic">${esc(x.i||'💪')}</span><span><b>${esc(x.t||'Treino')}</b><small>${esc(x.sub||'')}${x.d?' · '+esc(dlabel(x.d,{day:'numeric',month:'short'})):''}</small></span></span>`}return esc(m.body)};
    const draw=()=>{if(!list.length){box.innerHTML=`<div class="empty" style="margin:auto 0"><b>${c.is_group?'Comece a conversa do clube':'Diga oi! 👋'}</b><span>${c.is_group?'Combine treinos, mande desafios e motive a galera.':'Mande uma mensagem ou compartilhe seu último treino com o +.'}</span></div>`;return}
      let h='',pd='',pu='',pt=0;const myLast=[...list].reverse().find(m=>m.user_id===SOC.user.id);
      for(const m of list){const t=new Date(m.created_at).getTime(),dk=dayKey(m.created_at);
        if(dk!==pd){h+=`<span class="chday">${esc(dayLbl(m.created_at))}</span>`;pu='';}
        const me=m.user_id===SOC.user.id,cont=pu===m.user_id&&t-pt<5*60e3;
        const q=m.reply_to?byId(m.reply_to):null;
        const r=rx[m.id]||[];const agg={};r.forEach(x=>{agg[x.emoji]=(agg[x.emoji]||0)+1});
        h+=`<div class="cmr${me?' me':''}${cont?' cont':''}" data-mid="${m.id}">${c.is_group&&!me?`<span class="mav">${cont?'':avatar(SOC.prof[m.user_id],'sm')}</span>`:''}<div class="bb" data-s="msg" data-id="${m.id}">${c.is_group&&!me&&!cont?`<span class="who" style="color:${avColor(m.user_id)}">${esc(pName(m.user_id))}</span>`:''}${q?`<span class="q" data-s="jump" data-id="${q.id}"><b>${esc(q.user_id===SOC.user.id?'Você':pName(q.user_id))}</b>${esc(q.kind==='share'?'💪 '+((q.meta&&q.meta.t)||'Treino'):q.body)}</span>`:m.reply_to?'<span class="q">Mensagem apagada</span>':''}${bodyHtml(m)}<span class="tm">${hm(m.created_at)}</span></div></div>`;
        if(r.length)h+=`<div class="rxw${me?' me':''}"><div class="rx">${Object.entries(agg).map(([e,n])=>`<span class="${r.some(x=>x.emoji===e&&x.user_id===SOC.user.id)?'mine':''}">${e}${n>1?' '+n:''}</span>`).join('')}</div></div>`;
        if(!c.is_group&&me&&m===myLast&&otherRead&&new Date(otherRead)>=new Date(m.created_at))h+=`<span class="seen">Visto ✓✓</span>`;
        pd=dk;pu=m.user_id;pt=t}
      box.innerHTML=h;b.scrollTop=b.scrollHeight};
    const drawRep=()=>{const r=b.querySelector('#chRep');r.innerHTML=reply?`<div class="chrep"><span><b>${esc(reply.user_id===SOC.user.id?'Você':pName(reply.user_id))}</b> · ${esc(reply.kind==='share'?'💪 '+((reply.meta&&reply.meta.t)||'Treino'):reply.body)}</span><button class="icon-btn" data-s="unrep" aria-label="Cancelar resposta" style="width:28px;height:28px">✕</button></div>`:''};
    const loadRx=async()=>{const ids=list.map(m=>m.id);if(!ids.length)return;try{const r=await sbq(SOC.sb.from('message_reactions').select('*').in('message_id',ids));rx={};r.forEach(x=>{(rx[x.message_id]=rx[x.message_id]||[]).push(x)})}catch(e){}};
    const markRead=()=>SOC.sb.from('conversation_members').update({last_read:new Date().toISOString()}).eq('conversation_id',convId).eq('user_id',SOC.user.id).then(()=>{});
    SOC.openConv={id:convId,push:async m=>{if(!document.body.contains(el)){SOC.openConv=null;return}if(list.some(x=>x.id===m.id))return;await loadProfiles([m.user_id]).catch(()=>{});list.push(m);if(m.user_id!==SOC.user.id)otherRead=new Date().toISOString();draw();markRead()}};
    try{list=(await sbq(SOC.sb.from('messages').select('*').eq('conversation_id',convId).order('created_at',{ascending:false}).limit(150))).reverse();
      await loadProfiles(list.map(m=>m.user_id));await loadRx();
      if(!c.is_group){try{const mm=await sbq(SOC.sb.from('conversation_members').select('user_id,last_read').eq('conversation_id',convId));const o=mm.find(x=>x.user_id!==SOC.user.id);if(o)otherRead=o.last_read}catch(e){}}
      draw();markRead();if(c.unread){SOC.unread=Math.max(0,SOC.unread-c.unread);c.unread=0;drawDot()}}
    catch(e){box.innerHTML=`<p class="hint">${esc(sbErr(e))}</p>`}
    const ta=b.querySelector('#chatIn');
    const grow=()=>{ta.style.height='44px';ta.style.height=Math.min(120,ta.scrollHeight)+'px'};ta.addEventListener('input',grow);
    const sendRow=async row=>{try{const m=(await sbq(SOC.sb.from('messages').insert({conversation_id:convId,user_id:SOC.user.id,...row}).select()))[0];if(!list.some(x=>x.id===m.id)){list.push(m);draw()}return true}catch(err){toast(sbErr(err));return false}};
    const send=async()=>{const body=ta.value.trim();if(!body)return;ta.value='';grow();const rp=reply;reply=null;drawRep();
      if(!await sendRow({body,reply_to:rp?rp.id:null})){ta.value=body;reply=rp;drawRep()}};
    b.querySelector('[data-s=send]').onclick=send;
    ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!('ontouchstart' in window)){e.preventDefault();send()}});
    const react=async(m,e)=>{const mine=(rx[m.id]||[]).find(x=>x.user_id===SOC.user.id);
      try{if(mine&&mine.emoji===e){await sbq(SOC.sb.from('message_reactions').delete().eq('message_id',m.id).eq('user_id',SOC.user.id));rx[m.id]=(rx[m.id]||[]).filter(x=>x!==mine)}
        else if(mine){await sbq(SOC.sb.from('message_reactions').update({emoji:e}).eq('message_id',m.id).eq('user_id',SOC.user.id));mine.emoji=e}
        else{await sbq(SOC.sb.from('message_reactions').insert({message_id:m.id,user_id:SOC.user.id,emoji:e}));(rx[m.id]=rx[m.id]||[]).push({message_id:m.id,user_id:SOC.user.id,emoji:e})}
        draw()}catch(err){toast(sbErr(err))}};
    const msgMenu=m=>{const me=m.user_id===SOC.user.id;const mine=(rx[m.id]||[]).find(x=>x.user_id===SOC.user.id);
      openSheet('Mensagem',`<div class="mprev">${m.kind==='share'?'💪 '+esc((m.meta&&m.meta.t)||'Treino'):esc(m.body)}</div><div class="emrow">${CH_EMO.map(e=>`<button data-e="${e}" aria-pressed="${!!mine&&mine.emoji===e}">${e}</button>`).join('')}</div>
        <div class="mact"><button data-a="rep">↩️ Responder</button>${m.kind!=='share'?'<button data-a="copy">📋 Copiar texto</button>':''}${!me?'<button data-a="rep2">🚩 Denunciar mensagem</button>':''}${me?'<button data-a="del" class="danger">🗑️ Apagar para todos</button>':''}</div><p class="small muted" style="text-align:center">${esc(new Date(m.created_at).toLocaleString('pt-BR',{dateStyle:'medium',timeStyle:'short'}))}</p>`,(mb,mw)=>{
        mb.onclick=async e=>{const em=e.target.closest('[data-e]'),a=e.target.closest('[data-a]');
          if(em){closeSheet(mw);react(m,em.dataset.e);return}if(!a)return;closeSheet(mw);
          if(a.dataset.a==='rep'){reply=m;drawRep();ta.focus()}
          if(a.dataset.a==='copy'){try{await navigator.clipboard.writeText(m.body);toast('Texto copiado')}catch(_){toast('Não consegui copiar')}}
          if(a.dataset.a==='rep2')socReport({user_id:m.user_id,reason:null});
          if(a.dataset.a==='del')confirmSheet('Apagar esta mensagem para todos?','Apagar',async()=>{try{await sbq(SOC.sb.from('messages').delete().eq('id',m.id));list=list.filter(x=>x.id!==m.id);draw();loadConvs()}catch(err){toast(sbErr(err))}})}})};
    const shareMenu=()=>{const ss=Object.values(S.sessions||{}).filter(s=>s&&s.date).sort((a,b)=>(b.end||b.ts||0)-(a.end||a.ts||0)||(a.date<b.date?1:-1)).slice(0,6);
      openSheet('Compartilhar no chat',ss.length?`<p class="hint">Escolha o treino ou a corrida para mandar.</p><div class="mact">${ss.map(s=>`<button data-sid="${esc(s.id)}"><span style="font-size:22px">${s.run?(s.run.type==='bike'?'🚴':s.run.type==='walk'?'🚶':'🏃'):'🏋️'}</span><span style="flex:1;min-width:0"><b style="display:block">${esc(s.name||(s.run?'Corrida':'Treino'))}</b><small class="muted">${esc(dlabel(s.date,{day:'numeric',month:'short'}))} · ${esc(sessSub(s,true))}</small></span></button>`).join('')}</div>`
        :`<div class="empty"><b>Nenhum treino ainda</b><span>Finalize um treino ou corrida e depois compartilhe aqui.</span></div>`,(sb2,sw)=>{
        sb2.onclick=async e=>{const x=e.target.closest('[data-sid]');if(!x)return;const s=S.sessions[x.dataset.sid];if(!s)return;closeSheet(sw);
          const t=s.name||(s.run?(s.run.type==='bike'?'Pedal':s.run.type==='walk'?'Caminhada':'Corrida'):'Treino');
          await sendRow({body:'💪 '+t,kind:'share',meta:{t,sub:sessSub(s,true),i:s.run?(s.run.type==='bike'?'🚴':s.run.type==='walk'?'🚶':'🏃'):'🏋️',d:s.date}})}})};
    const optMenu=()=>{const prof=!c.is_group&&c.other;
      openSheet('Opções',`<div class="mact">${prof?'<button data-o="prof">👤 Ver perfil</button>':''}${cl?'<button data-o="club">🏟️ Ver clube</button>':''}<button data-o="mute">${c.muted?'🔔 Ativar notificações':'🔕 Silenciar notificações'}</button>${prof?'<button data-o="report">🚩 Denunciar</button><button data-o="block" class="danger">⛔ Bloquear</button>':''}</div>`,(ob,ow)=>{
        ob.onclick=async e=>{const o=e.target.closest('[data-o]');if(!o)return;closeSheet(ow);const k=o.dataset.o;
          if(k==='prof')socProfileSheet(c.other);
          if(k==='club'){closeSheet(el);socClubSheet(cl.id)}
          if(k==='report')socReport({user_id:c.other});
          if(k==='block')confirmSheet(`Bloquear ${pName(c.other)}? Vocês deixam de se ver e de conversar.`,'Bloquear',async()=>{try{await sbq(SOC.sb.from('blocks').insert({blocker:SOC.user.id,blocked:c.other}));await SOC.sb.from('follows').delete().eq('follower',SOC.user.id).eq('following',c.other);SOC.following.delete(c.other);closeSheet(el);toast('Pessoa bloqueada')}catch(err){toast(sbErr(err))}});
          if(k==='mute'){try{await sbq(SOC.sb.from('conversation_members').update({muted:!c.muted}).eq('conversation_id',convId).eq('user_id',SOC.user.id).select());c.muted=!c.muted;drawHd();toast(c.muted?'Conversa silenciada':'Notificações ativadas')}catch(err){toast(sbErr(err))}}}})};
    el.addEventListener('click',e=>{const x=e.target.closest('[data-s]');if(!x||!el.contains(x))return;const k=x.dataset.s;
      if(k==='who'){if(c.is_group){if(cl){closeSheet(el);socClubSheet(cl.id)}}else if(c.other)socProfileSheet(c.other)}
      if(k==='menu')optMenu();if(k==='plus')shareMenu();if(k==='unrep'){reply=null;drawRep()}
      if(k==='jump'){e.stopPropagation();const r=box.querySelector(`[data-mid="${x.dataset.id}"]`);if(r){r.scrollIntoView({block:'center',behavior:'smooth'});r.animate([{opacity:.3},{opacity:1}],{duration:700})}return}
      if(k==='msg'){const m=byId(+x.dataset.id)||byId(x.dataset.id);if(m)msgMenu(m)}});
    /* dois toques: ❤️ */
    let lastTap=0,lastId=null;box.addEventListener('pointerup',e=>{const x=e.target.closest('.bb');if(!x)return;const now=Date.now();if(lastId===x.dataset.id&&now-lastTap<300){const m=byId(+x.dataset.id)||byId(x.dataset.id);if(m){e.stopPropagation();react(m,'❤️')}lastTap=0;return}lastTap=now;lastId=x.dataset.id});
    const obs=new MutationObserver(()=>{if(!document.body.contains(el)){SOC.openConv=null;obs.disconnect();loadConvs()}});obs.observe($('#sheets'),{childList:true});
  });
  return el};

/* ---------- clubes: lista ---------- */
SOC.clubK=SOC.clubK||'';
socClubsHtml=function(){
  if(!SOC.clubs){once('clubs',loadClubs);return thinking('Carregando clubes…')}
  const k=SOC.clubK,F=SOC.clubs.filter(c=>!k||c.kind===k);
  const mine=F.filter(c=>SOC.myClubs.has(c.id)||c.owner===SOC.user.id),other=F.filter(c=>!mine.includes(c));
  const card=c=>{const own=c.owner===SOC.user.id,pend=own&&c.pend&&c.pend.length,req=SOC.clubReq&&SOC.clubReq.has(c.id);const kd=clKind(c.kind);
    return`<button class="clc" data-act="socClub" data-id="${c.id}" data-name="${esc((c.name+' '+(c.city||'')+' '+kd[1]).toLowerCase())}"><span class="bn" style="${clBanner(c)}">${clTile(c)}${pend?`<span class="tag hot">${pend} pedido${pend>1?'s':''}</span>`:own?'<span class="tag">Criador</span>':req?'<span class="tag">Pedido enviado</span>':''}</span>
      <span class="bd"><b>${esc(c.name)}</b><small>${esc(kd[1])}${c.city?' · '+esc(c.city):''}</small><small>👥 ${c.n} membro${c.n===1?'':'s'}</small></span></button>`};
  return`<div class="cx-top"><div class="row" style="gap:8px;flex-wrap:nowrap"><label class="cx-search" style="flex:1">${SVG_SEARCH}<input id="clubQ" type="search" placeholder="Buscar clube ou cidade" autocomplete="off"></label><button class="btn primary" data-act="socNewClub" style="flex:none">+ Criar</button></div>
    <div class="cx-chips"><button class="cx-chip" data-act="clubK" data-k="" aria-pressed="${!k}">Todos</button>${CL_KINDS.map(([id,l,i])=>`<button class="cx-chip" data-act="clubK" data-k="${id}" aria-pressed="${k===id}">${i} ${l}</button>`).join('')}</div></div>
    ${mine.length?`<p class="clsec">Meus clubes</p><div class="clg">${mine.map(card).join('')}</div>`:''}
    ${other.length?`<p class="clsec">Descobrir</p><div class="clg">${other.map(card).join('')}</div>`:''}
    ${!SOC.clubs.length?`<div class="empty"><b>Nenhum clube ainda</b><span>Crie o clube da sua academia ou do seu grupo de corrida: chat, ranking da semana, meta coletiva e mural.</span></div>`:!F.length?'<div class="empty"><b>Nenhum clube desse tipo</b><span>Que tal criar o primeiro?</span></div>':''}`};

/* ---------- clubes: criar e editar ---------- */
socNewClub=function(edit){const c=edit||{};let icon=c.icon||'🏋️',color=clColor(c.id?c:{color:'#E9B640'}),kind=c.kind||'academia';
  openSheet(edit?'Editar clube':'Criar clube',`<div class="clh" style="margin-top:-2px"><div class="bn" id="ncBn" style="${clBanner({color})};height:90px;border-radius:18px;margin:0 16px"></div></div>
   <label class="fld"><span>Nome</span><input id="ncN" maxlength="60" value="${esc(c.name||'')}" placeholder="Ex.: Academia Força Total"></label>
   <div class="fld"><span>Tipo</span><div class="cx-chips" id="ncK" style="flex-wrap:wrap">${CL_KINDS.map(([id,l,i])=>`<button class="cx-chip" data-k="${id}" aria-pressed="${kind===id}">${i} ${l}</button>`).join('')}</div></div>
   <div class="fld"><span>Ícone</span><div class="pick" id="ncI">${CL_ICONS.map(i=>`<button data-i="${i}" aria-pressed="${icon===i}">${i}</button>`).join('')}</div></div>
   <div class="fld"><span>Cor</span><div class="pick col" id="ncC">${CL_COLORS.map(k=>`<button data-c="${k}" aria-pressed="${color===k}" style="background:${k}" aria-label="Cor ${k}"></button>`).join('')}</div></div>
   <label class="fld"><span>Cidade (opcional)</span><input id="ncCity" maxlength="60" value="${esc(c.city||'')}" placeholder="Ex.: Campinas"></label>
   <label class="fld"><span>Descrição</span><textarea id="ncD" maxlength="500" placeholder="Sobre o que é o clube, horários, onde treinam…">${esc(c.description||'')}</textarea></label>
   <label class="fld"><span>Meta da semana em km (opcional)</span><input id="ncG" inputmode="decimal" value="${c.goal_km||''}" placeholder="Ex.: 100 (soma de todos os membros)"></label>
   ${edit?`<label class="fld"><span>Aviso fixado no topo (opcional)</span><textarea id="ncNo" maxlength="300" placeholder="Ex.: Treino coletivo sábado às 8h no parque">${esc(c.notice||'')}</textarea></label>
   <label class="fld"><span>Regras (opcional)</span><textarea id="ncR" maxlength="1000" placeholder="Ex.: respeito sempre, nada de propaganda">${esc(c.rules||'')}</textarea></label>`:''}
   <p class="hint">Para entrar no clube, a pessoa pede e você aceita.</p>
   <button class="btn primary block" data-s="ok">${edit?'Salvar':'Criar clube'}</button>`,(b,el)=>{
    const bn=b.querySelector('#ncBn');
    b.onclick=async e=>{const k=e.target.closest('#ncK [data-k]'),i=e.target.closest('#ncI [data-i]'),cc=e.target.closest('#ncC [data-c]');
      if(k){kind=k.dataset.k;b.querySelectorAll('#ncK [data-k]').forEach(x=>x.setAttribute('aria-pressed',x===k));if(!edit&&!b.dataset.iconSet){icon=clKind(kind)[2];b.querySelectorAll('#ncI [data-i]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.i===icon))}return}
      if(i){icon=i.dataset.i;b.dataset.iconSet=1;b.querySelectorAll('#ncI [data-i]').forEach(x=>x.setAttribute('aria-pressed',x===i));return}
      if(cc){color=cc.dataset.c;bn.style.cssText=clBanner({color})+';height:90px;border-radius:18px;margin:0 16px';b.querySelectorAll('#ncC [data-c]').forEach(x=>x.setAttribute('aria-pressed',x===cc));return}
      if(!e.target.closest('[data-s=ok]'))return;
      const name=b.querySelector('#ncN').value.trim();if(name.length<2){toast('Dê um nome ao clube');return}
      const g=num(b.querySelector('#ncG').value);
      const row={name,description:b.querySelector('#ncD').value.trim()||null,icon,color,kind,city:b.querySelector('#ncCity').value.trim()||null,goal_km:g>0?Math.min(100000,g):null};
      if(edit){row.notice=b.querySelector('#ncNo').value.trim()||null;row.rules=b.querySelector('#ncR').value.trim()||null}
      try{let id=c.id;if(edit)await sbq(SOC.sb.from('clubs').update(row).eq('id',c.id).select());else{id=(await sbq(SOC.sb.from('clubs').insert({...row,owner:SOC.user.id}).select()))[0].id}
        closeSheet(el);if(edit)sheets.slice().forEach(s=>{if(s.dataset.club===c.id)closeSheet(s)});SOC.clubs=null;await loadClubs();loadConvs();toast(edit?'Clube atualizado':'Clube criado!');socClubSheet(id)}
      catch(err){toast(sbErr(err))}}})};

/* ---------- clubes: página ---------- */
socClubSheet=function(id,tab){const c=(SOC.clubs||[]).find(x=>x.id===id);if(!c)return;
  const inC=SOC.myClubs.has(id),own=c.owner===SOC.user.id,req=SOC.clubReq&&SOC.clubReq.has(id),kd=clKind(c.kind);
  tab=tab||(inC?'mural':'sobre');
  const tabs=inC?[['mural','Mural'],['ranking','Ranking'],['membros','Membros'],['sobre','Sobre']]:[['sobre','Sobre']];
  const el=openSheet(c.name,`<div class="clh"><div class="bn" style="${clBanner(c)}"></div>${clTile(c)}<div class="in"><h2>${esc(c.name)}</h2><span class="meta">${kd[2]} ${esc(kd[1])}${c.city?' · 📍 '+esc(c.city):''}</span><div class="avs" id="clAvs"></div></div></div>
    <div class="clbtns">${inC?`<button class="btn primary" data-s="chat">💬 Chat</button><button class="btn" data-s="invite">📣 Convidar</button>`:req?'<button class="btn" data-s="unreq">⏳ Pedido enviado · cancelar</button>':'<button class="btn primary" data-s="join">Pedir para entrar</button>'}
      ${own?'<button class="btn" data-s="edit">✏️ Editar</button>':''}</div>
    ${!inC&&!req?'<p class="hint" style="margin-top:-4px">O criador do clube aceita os pedidos. Depois você entra no chat, no ranking e no mural.</p>':''}
    ${c.notice&&inC?`<div class="clnote"><span>📌</span><span><b>Aviso</b>${esc(c.notice)}</span></div>`:''}
    ${own&&c.pend&&c.pend.length?`<div class="card"><h3>Pedidos para entrar (${c.pend.length})</h3><div id="cpd"></div></div>`:''}
    ${inC&&c.goal_km?`<div class="card goal" id="clGoal"><div class="row"><b>🎯 Meta da semana</b><span class="small muted">${fmtD(c.goal_km)} km</span></div><div class="bar"><i style="width:0"></i></div><small class="muted">Calculando…</small></div>`:''}
    ${tabs.length>1?`<div class="cltabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" data-t="${k}" aria-selected="${tab===k}">${l}</button>`).join('')}</div>`:''}
    <div id="clBody">${thinking('Carregando…')}</div>`,async(b,el)=>{
    el.dataset.club=id;el.querySelector('.sheet').style.maxHeight='96%';el.querySelector('.sheet').classList.add('clubS');
    const ids=[...new Set([...(c.mem||[]),...(c.pend||[]).map(r=>r.user_id),c.owner])];await loadProfiles(ids).catch(()=>{});
    const av=b.querySelector('#clAvs');if(av)av.innerHTML=(c.mem||[]).slice(0,6).map(u=>avatar(SOC.prof[u],'sm')).join('')+`<small>${c.n} membro${c.n===1?'':'s'}</small>`;
    const pd=b.querySelector('#cpd');if(pd)pd.innerHTML=c.pend.map(r=>{const p=SOC.prof[r.user_id]||{id:r.user_id,name:'Atleta'};return`<div class="mbr">${avatar(p,'sm')}<span class="t"><b>${esc(p.name||'Atleta')}</b><small>${p.public_id?'ID '+esc(fmtId(p.public_id))+' · ':''}pediu ${ago(r.created_at)}</small></span><button class="btn sm primary" data-s="cok" data-u="${r.user_id}">Aceitar</button><button class="btn sm" data-s="cno" data-u="${r.user_id}">Recusar</button></div>`}).join('');
    let rank=null;const getRank=async()=>{if(rank)return rank;try{rank=await loadRank(id)||[]}catch(e){rank=[]}return rank};
    if(inC&&c.goal_km)getRank().then(r=>{const g=b.querySelector('#clGoal');if(!g)return;const km=r.reduce((a,x)=>a+(+x.km||0),0);const p=Math.min(100,Math.round(km/c.goal_km*100));
      g.querySelector('.bar i').style.width=p+'%';g.querySelector('small').textContent=p>=100?`🏆 Meta batida! ${fmtD(km)} km juntos nesta semana.`:`${fmtD(km)} de ${fmtD(c.goal_km)} km · faltam ${fmtD(Math.max(0,c.goal_km-km))} km (${p}%)`});
    const body=b.querySelector('#clBody');
    const show=async t=>{tab=t;b.querySelectorAll('.cltabs [data-t]').forEach(x=>x.setAttribute('aria-selected',x.dataset.t===t));body.innerHTML=thinking('Carregando…');
      if(t==='sobre'){const ow=SOC.prof[c.owner]||{name:'Atleta'};
        body.innerHTML=`<div class="card">${c.description?`<p style="white-space:pre-wrap">${esc(c.description)}</p>`:'<p class="hint">Sem descrição.</p>'}
          <div class="mbr" style="border-top:1px solid var(--line);margin-top:4px">${avatar(ow,'sm')}<span class="t"><b>${esc(ow.name||'Atleta')}<span class="crown">CRIADOR</span></b><small>Criado em ${esc(new Date(c.created_at).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'}))}</small></span></div></div>
          ${c.rules?`<div class="card"><h3>📜 Regras</h3><p style="white-space:pre-wrap">${esc(c.rules)}</p></div>`:''}
          <div class="btns">${inC&&!own?'<button class="btn" data-s="leave">Sair do clube</button>':''}${!own?'<button class="btn sm" data-s="report">🚩 Denunciar clube</button>':''}${own?'<button class="btn danger" data-s="del">Apagar clube</button>':''}</div>`}
      if(t==='ranking'){const r=await getRank();body.innerHTML=`<div class="card"><h3>🏆 Ranking da semana</h3>${rankHtml(r||[])}</div>`}
      if(t==='membros'){const L=(c.mem||[]).slice().sort((a,b)=>(b===c.owner)-(a===c.owner)||pName(a).localeCompare(pName(b)));
        body.innerHTML=`<div class="card">${L.map(u=>{const p=SOC.prof[u]||{id:u,name:'Atleta'};const t=presTxt(p);return`<div class="mbr"><button class="row" data-act="socProfile" data-id="${u}" style="border:0;background:none;padding:0;flex:1;min-width:0;flex-wrap:nowrap;text-align:left;color:inherit">${avatar(p,'sm')}<span class="t"><b>${esc(p.name||'Atleta')}${u===c.owner?'<span class="crown">CRIADOR</span>':''}</b><small>${u===SOC.user.id?'Você':t?esc(t):p.public_id?'ID '+esc(fmtId(p.public_id)):''}</small></span></button>${own&&u!==SOC.user.id?`<button class="btn sm" data-s="ckick" data-u="${u}">Remover</button>`:''}</div>`}).join('')}</div>`}
      if(t==='mural'){try{const mem=(c.mem||[]);const posts=mem.length?await sbq(SOC.sb.from('posts').select('*').in('user_id',mem).order('created_at',{ascending:false}).limit(25)):[];
          await loadProfiles(posts.map(q=>q.user_id));await countsFor(posts);for(const q of posts)socPostCache[q.id]=q;
          body.innerHTML=posts.length?posts.map(q=>postCard(q)).join(''):`<div class="empty"><b>O mural está vazio</b><span>Os treinos e corridas que os membros postam aparecem aqui.</span></div>`}
        catch(err){body.innerHTML=`<p class="hint">${esc(sbErr(err))}</p>`}}};
    show(tab);
    const again=async(m,t)=>{closeSheet(el);SOC.clubs=null;await loadClubs();if(m)toast(m);socClubSheet(id,t)};
    b.addEventListener('click',async e=>{const tb=e.target.closest('.cltabs [data-t]');if(tb){show(tb.dataset.t);return}
      const x=e.target.closest('[data-s]');if(!x||!b.contains(x))return;const s=x.dataset.s;
      try{if(s==='join'){await sbq(SOC.sb.from('club_requests').insert({club_id:id,user_id:SOC.user.id}));await again('Pedido enviado. O criador do clube vai aceitar ou recusar.')}
        if(s==='unreq'){await sbq(SOC.sb.from('club_requests').delete().eq('club_id',id).eq('user_id',SOC.user.id));await again('Pedido cancelado')}
        if(s==='cok'){x.disabled=true;await sbq(SOC.sb.rpc('approve_club_member',{p_club:id,p_user:x.dataset.u}));loadConvs();await again('Pessoa aceita no clube',tab)}
        if(s==='cno'){x.disabled=true;await sbq(SOC.sb.from('club_requests').delete().eq('club_id',id).eq('user_id',x.dataset.u));await again('Pedido recusado',tab)}
        if(s==='ckick'){const u=x.dataset.u;confirmSheet(`Remover ${pName(u)} do clube?`,'Remover',async()=>{try{await sbq(SOC.sb.from('club_members').delete().eq('club_id',id).eq('user_id',u));await again('Removido do clube','membros')}catch(err){toast(sbErr(err))}})}
        if(s==='leave')confirmSheet(`Sair do clube “${c.name}”? Para voltar, vai precisar pedir de novo.`,'Sair',async()=>{try{await sbq(SOC.sb.from('club_members').delete().eq('club_id',id).eq('user_id',SOC.user.id));closeSheet(el);SOC.clubs=null;loadClubs();loadConvs();toast('Você saiu do clube')}catch(err){toast(sbErr(err))}});
        if(s==='del')confirmSheet(`Apagar o clube “${c.name}” e o chat dele? Não dá para desfazer.`,'Apagar',async()=>{try{await sbq(SOC.sb.from('clubs').delete().eq('id',id));closeSheet(el);SOC.clubs=null;loadClubs();loadConvs();toast('Clube apagado')}catch(err){toast(sbErr(err))}});
        if(s==='edit')socNewClub(c);
        if(s==='report')socReport({user_id:c.owner,reason:null});
        if(s==='chat'){const cv=await sbq(SOC.sb.from('conversations').select('id').eq('club_id',id));if(!cv.length){toast('Chat ainda não disponível');return}closeSheet(el);await loadConvs();socChatSheet(cv[0].id)}
        if(s==='invite'){const txt=`Bora treinar comigo! Entre no clube “${c.name}” no ATHOS: abra Social → Clubes e procure por “${c.name}”.`;
          try{if(navigator.share){await navigator.share({title:'ATHOS',text:txt});return}}catch(_){return}
          try{await navigator.clipboard.writeText(txt);toast('Convite copiado. Cole no WhatsApp!')}catch(_){toast(txt)}}}
      catch(err){toast(sbErr(err))}});
  });
  return el};
Object.assign(ACT,{chatF:el=>{SOC.chatF=el.dataset.k;render()},clubK:el=>{SOC.clubK=el.dataset.k;render()},socNewClub:()=>socNewClub()});
