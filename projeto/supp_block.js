/* ---------- suplementos: o que você toma, lembrete no horário, "Tomei" entra na dieta e conta sequência ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
.supp-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line)}
.supp-row:first-of-type{border-top:0}
.supp-row .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.supp-row .t b{font-size:16px}.supp-row .t small{color:var(--muted);font-size:13.5px}
.supp-row .st{color:var(--accent-tx);font-weight:700}
.supp-tk{flex:none;min-width:84px;height:44px;border-radius:14px;border:1.5px solid var(--accent);background:transparent;color:var(--accent-tx);font:800 15px var(--body)}
.supp-tk[aria-pressed=true]{background:var(--accent);color:#000}
.card.supp-due{display:flex;flex-direction:row;align-items:center;text-align:left;gap:12px;border:1.5px solid var(--accent);background:color-mix(in srgb,var(--accent) 10%,var(--surface))}
.card.supp-due .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.supp-due b{font-size:16px}.supp-due small{color:var(--muted)}
.supp-ed{display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid var(--line)}
.supp-ed:first-child{border-top:0}.supp-ed .t{flex:1;min-width:0}.supp-ed small{color:var(--muted);display:block}
.supp-times{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.supp-times input{width:118px;min-height:44px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);color:var(--fg);font:600 16px var(--body);padding:0 10px}
.supp-chk{display:flex;align-items:center;gap:12px;margin-top:6px;text-align:left;cursor:pointer}.supp-chk input{width:22px;height:22px;flex:none;accent-color:var(--accent)}.supp-chk span{display:flex;flex-direction:column;font-weight:600}.supp-chk small{color:var(--muted);font-weight:400;font-size:13.5px}
.supp-mac{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.supp-mac .fld input{min-width:0}
</style>`);

const SUPP_PRE=[
  {name:'Creatina',kcal:0,p:0,c:0,f:0},
  {name:'Whey protein',kcal:120,p:24,c:3,f:1.5,hint:'Valores de 1 dose típica. Confira o rótulo do seu.'},
  {name:'Multivitamínico',kcal:0,p:0,c:0,f:0},
  {name:'Ômega 3',kcal:10,p:0,c:0,f:1},
  {name:'Vitamina D',kcal:0,p:0,c:0,f:0},
  {name:'Pré-treino',kcal:5,p:0,c:1,f:0},
  {name:'Colágeno',kcal:36,p:9,c:0,f:0,hint:'Valores de 1 dose típica. Confira o rótulo do seu.'},
  {name:'Hipercalórico',kcal:380,p:20,c:70,f:3,hint:'Valores de 1 dose típica. Confira o rótulo do seu.'},
];
const suppList=()=>Array.isArray(S.profile.supps)?S.profile.supps:[];
const suppNow=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const suppHm=t=>{const m=String(t||'').match(/^(\d{1,2}):(\d{2})$/);return m?(+m[1])*60+(+m[2]):-1};
function suppTaken(date,id){const d=S.days[date];return!!(d&&d.supp&&d.supp[id])}
function suppMealFor(ts){const d=new Date(ts),m=d.getHours()*60+d.getMinutes();return m<630?'cafe':m<900?'almoco':m<1110?'lanche':m<1290?'jantar':'ceia'}
function suppStreak(id){let n=0;const d=new Date();if(!suppTaken(today(),id))d.setDate(d.getDate()-1);
  for(let i=0;i<730;i++){const k=d.toISOString?suppYmd(d):'';if(!suppTaken(k,id))break;n++;d.setDate(d.getDate()-1)}return n}
function suppYmd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function suppMark(id,on,ts){
  const s=suppList().find(x=>x.id===id);if(!s)return;const date=suppYmd(new Date(ts||Date.now())),d=ensureDay(date);d.supp=d.supp||{};
  // tira o item da dieta que este suplemento colocou hoje (se houver)
  for(const[k]of MEALS){const L=d.meals[k]||[];const i=L.findIndex(it=>it.suppId===id);if(i>=0)L.splice(i,1)}
  if(on){d.supp[id]=ts||Date.now();
    if(num(s.kcal)>0||num(s.p)>0||num(s.c)>0||num(s.f)>0)d.meals[suppMealFor(d.supp[id])].push({id:newId('f'),name:s.name+(s.dose?' ('+s.dose+')':''),suppId:id,kcal:r1(num(s.kcal)),p:r1(num(s.p)),c:r1(num(s.c)),f:r1(num(s.f))})}
  else delete d.supp[id];
  store.mark('d-'+date);suppPush();
}
function suppNext(s){const now=suppNow(),T=(s.times||[]).map(suppHm).filter(m=>m>=0).sort((a,b)=>a-b);if(!T.length)return'';const n=T.find(m=>m>now);const m=n!=null?n:T[0];return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function suppDue(){const t=today(),now=suppNow();return suppList().filter(s=>!suppTaken(t,s.id)&&(s.times||[]).some(x=>{const m=suppHm(x);return m>=0&&m<=now&&now-m<=240}))}

/* cartão na Dieta */
function suppCard(){
  const L=suppList(),t=today();
  if(!L.length)return`<div class="card"><div class="card-h"><h3>Suplementos</h3></div><p class="hint">Guarde o que você toma, como creatina ou whey. O app lembra no horário e, ao marcar Tomei, as calorias entram no seu dia.</p><button class="btn primary block" data-act="suppEdit">Adicionar suplemento</button></div>`;
  return`<div class="card"><div class="card-h"><h3>Suplementos</h3><button class="btn sm soft" data-act="suppEdit">Editar</button></div>${L.map(s=>{const on=suppTaken(t,s.id),st=suppStreak(s.id),nx=suppNext(s);
    return`<div class="supp-row"><span class="t"><b>${esc(s.name)}</b><small>${[s.dose?esc(s.dose):'',nx&&!on?'lembrete às '+nx:'',num(s.kcal)>0?fmtN(s.kcal)+' kcal':''].filter(Boolean).join(' · ')||'Sem horário'}${st>1?` · <span class="st">${st} dias seguidos</span>`:''}</small></span><button class="supp-tk" data-act="suppTk" data-id="${esc(s.id)}" aria-pressed="${on}">${on?'Tomado':'Tomei'}</button></div>`}).join('')}</div>`;
}
/* aviso na tela Hoje quando passou da hora */
function suppDueCard(){const D=suppDue();if(!D.length)return'';const s=D[0];
  return`<div class="card supp-due"><span class="t"><b>Hora de tomar: ${esc(s.name)}</b><small>${s.dose?esc(s.dose)+' · ':''}${D.length>1?'e mais '+(D.length-1)+' esperando':'marque quando tomar'}</small></span><button class="supp-tk" data-act="suppTk" data-id="${esc(s.id)}" aria-pressed="false">Tomei</button></div>`}

{const _vd=VIEWS.dieta;VIEWS.dieta=function(){let h=_vd.apply(this,arguments);const k='<div class="card"><div class="card-h"><h3>Plano alimentar</h3></div>';const i=h.indexOf(k);return i>=0?h.slice(0,i)+suppCard()+h.slice(i):h+suppCard()}}
{const _vh=VIEWS.hoje;VIEWS.hoje=function(){let h=_vh.apply(this,arguments);const due=suppDueCard();if(!due)return h;const kc=kcalCard(today());const i=h.indexOf(kc);return i>=0?h.slice(0,i+kc.length)+due+h.slice(i+kc.length):due+h}}

/* editar a lista */
function suppEditSheet(){
  openSheet('Seus suplementos','',(b,el)=>{
    const draw=()=>{const L=suppList();b.innerHTML=`${L.length?L.map(s=>`<div class="supp-ed"><span class="t"><b>${esc(s.name)}</b><small>${[s.dose?esc(s.dose):'',(s.times||[]).join(', '),s.remind===false?'sem lembrete':''].filter(Boolean).join(' · ')||'Sem horário'}</small></span><button class="btn sm" data-e="${esc(s.id)}">Editar</button></div>`).join(''):'<p class="hint">Nenhum suplemento ainda.</p>'}
      <button class="btn primary block" data-e="new" style="margin-top:12px">Adicionar suplemento</button>
      <p class="hint">O ATHOS só lembra do que você já toma. Para saber se um suplemento é para você e quanto tomar, fale com um nutricionista ou médico.</p>`};
    draw();
    b.onclick=e=>{const x=e.target.closest('[data-e]');if(!x)return;closeSheet(el);suppFormSheet(x.dataset.e==='new'?null:x.dataset.e)};
  });
}
function suppFormSheet(id){
  const cur=id?suppList().find(s=>s.id===id):null;
  const f=cur?clone(cur):{id:newId('sp'),name:'',dose:'',times:['08:00'],kcal:0,p:0,c:0,f:0,remind:true};
  openSheet(cur?'Editar suplemento':'Novo suplemento','',(b,el)=>{
    const draw=()=>{b.innerHTML=`${cur?'':`<div class="chips" id="spPre">${SUPP_PRE.map((x,i)=>`<button class="chip" data-pre="${i}">${esc(x.name)}</button>`).join('')}</div>`}
      <label class="fld"><span>Nome</span><input id="spN" maxlength="40" value="${esc(f.name)}" placeholder="Ex.: Creatina"></label>
      <label class="fld"><span>Quanto você toma</span><input id="spD" maxlength="30" value="${esc(f.dose)}" placeholder="Ex.: 1 scoop, 2 cápsulas"></label>
      <p class="eyebrow" style="margin:6px 0 -4px">Horários</p>
      <div class="supp-times">${f.times.map((t,i)=>`<input type="time" data-t="${i}" value="${esc(t)}" aria-label="Horário ${i+1}">${f.times.length>1?`<button class="btn sm" data-rt="${i}" aria-label="Tirar horário">×</button>`:''}`).join('')}${f.times.length<4?'<button class="btn sm soft" data-at="1">+ horário</button>':''}</div>
      <label class="supp-chk"><input type="checkbox" id="spR" ${f.remind!==false?'checked':''}><span>Lembrar no horário<small>${NATIVE?'Notificação no celular, com o botão Tomei':'Aviso na tela Hoje quando passar da hora'}</small></span></label>
      <p class="eyebrow" style="margin:8px 0 -4px">Por dose, se tiver calorias</p>
      <div class="supp-mac"><label class="fld"><span>kcal</span><input data-m="kcal" inputmode="decimal" value="${f.kcal||''}" placeholder="0"></label><label class="fld"><span>Prot. (g)</span><input data-m="p" inputmode="decimal" value="${f.p||''}" placeholder="0"></label><label class="fld"><span>Carb. (g)</span><input data-m="c" inputmode="decimal" value="${f.c||''}" placeholder="0"></label><label class="fld"><span>Gord. (g)</span><input data-m="f" inputmode="decimal" value="${f.f||''}" placeholder="0"></label></div>
      <p class="hint" id="spH">${esc(f._hint||'Quando você marcar Tomei, esses valores entram na dieta do dia.')}</p>
      <button class="btn primary block" data-s="save">Salvar</button>${cur?'<button class="btn danger block" data-s="del">Remover suplemento</button>':''}`};
    const read=()=>{const g=q=>b.querySelector(q);f.name=g('#spN').value.trim();f.dose=g('#spD').value.trim();f.remind=g('#spR').checked;
      f.times=[...b.querySelectorAll('[data-t]')].map(x=>x.value).filter(Boolean);b.querySelectorAll('[data-m]').forEach(x=>f[x.dataset.m]=num(String(x.value).replace(',','.'))||0)};
    draw();
    b.onclick=e=>{
      const pr=e.target.closest('[data-pre]');if(pr){read();const x=SUPP_PRE[+pr.dataset.pre];Object.assign(f,{name:x.name,kcal:x.kcal,p:x.p,c:x.c,f:x.f,_hint:x.hint||''});draw();return}
      if(e.target.closest('[data-at]')){read();f.times.push('20:00');draw();return}
      const rt=e.target.closest('[data-rt]');if(rt){read();f.times.splice(+rt.dataset.rt,1);draw();return}
      const s=e.target.closest('[data-s]');if(!s)return;
      if(s.dataset.s==='del'){confirmSheet(`Remover ${cur.name}? O histórico de dias tomados continua guardado.`,'Remover',()=>{S.profile.supps=suppList().filter(x=>x.id!==id);store.mark('profile');suppPush();closeSheet(el);render();toast('Suplemento removido')});return}
      read();if(!f.name){toast('Dê um nome ao suplemento.');return}
      delete f._hint;const L=suppList().slice();const i=L.findIndex(x=>x.id===f.id);if(i>=0)L[i]=f;else L.push(f);
      S.profile.supps=L;store.mark('profile');suppPush();closeSheet(el);render();toast(cur?'Suplemento salvo':`${f.name} adicionado`)};
  });
}

/* Android: agenda os lembretes e recebe os "Tomei" tocados na notificação */
let suppPT=null;
function suppPush(){if(!NATIVE||!NATIVE.suppSet)return;clearTimeout(suppPT);suppPT=setTimeout(()=>{try{const t=today();NATIVE.suppSet(JSON.stringify({date:t,done:suppList().filter(s=>suppTaken(t,s.id)).map(s=>s.id),list:suppList().map(s=>({id:s.id,name:s.name,dose:s.dose||'',times:s.times||[],remind:s.remind!==false}))}))}catch(e){}},300)}
function suppPull(){if(!NATIVE||!NATIVE.suppPending)return;try{const L=JSON.parse(NATIVE.suppPending()||'[]');let n=0;for(const x of L){if(!x||!x.id)continue;const d=suppYmd(new Date(x.ts||Date.now()));if(!suppTaken(d,x.id)){suppMark(x.id,true,x.ts);n++}}if(n){render();toast(n===1?'Suplemento marcado como tomado':n+' suplementos marcados como tomados')}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){suppPull();render()}});
setTimeout(()=>{suppPull();suppPush()},2500);
let suppDueKey='';setInterval(()=>{if(document.visibilityState!=='visible')return;const k=suppDue().map(s=>s.id).join(',');if(k!==suppDueKey){suppDueKey=k;render()}},60000);
Object.assign(ACT,{suppEdit:()=>suppEditSheet(),suppTk:el=>{const id=el.dataset.id,on=!suppTaken(today(),id);suppMark(id,on);render();if(on){const s=suppList().find(x=>x.id===id);toast(`${s?s.name:'Suplemento'} tomado`+(s&&num(s.kcal)>0?` · ${fmtN(s.kcal)} kcal na dieta`:''))}}});
