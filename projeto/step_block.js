/* ---------- passos do dia (sensor do Android; no iPhone mostra o que veio do Android pela conta) ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
.card.stepc{display:flex;flex-direction:row;align-items:center;gap:16px;width:100%;text-align:left;font:inherit;color:var(--fg);cursor:pointer}
.stepc .ring{position:relative;flex:none;width:78px;height:78px}
.stepc .ring svg{width:78px;height:78px;transform:rotate(-90deg)}
.stepc .ring i{position:absolute;inset:0;display:grid;place-items:center;font-style:normal;font-size:26px}
.stepc .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.stepc .t small{color:var(--muted);font-size:13.5px}
.stepc .n{font:800 40px/1 var(--display)}.stepc .n span{font-size:16px;color:var(--muted);font-weight:700;margin-left:6px}
.stepc .ok{color:var(--accent-tx);font-weight:700}
.st-bars{display:flex;align-items:flex-end;gap:8px;height:150px;margin:6px 0 4px}
.st-bars div{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}
.st-bars i{width:100%;border-radius:8px 8px 3px 3px;background:var(--surface2);min-height:4px}
.st-bars i.hit{background:var(--accent)}
.st-bars small{font-size:12px;color:var(--muted)}
.st-bars b{font-size:11.5px;color:var(--muted);font-weight:600}
.st-goal{display:flex;gap:8px;flex-wrap:wrap}
</style>`);

const STEP={info:null,asked:false};
const stepGoal=()=>Math.max(1000,num(S.profile.stepGoal)||8000);
const stepYmd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const stepsOn=date=>{const d=S.days[date];return d&&num(d.steps)>0?num(d.steps):0};
function stepKm(n){const h=num(S.profile.height)||170;return n*h*0.00415/1000}
function stepKcal(n){const kg=num(curWeight())||75;return Math.round(n*kg*0.0005)}
const stepAndroid=()=>!!(NATIVE&&NATIVE.stepsGet);

/* lê o sensor (Android) e grava os totais em cada dia, para sincronizar com a conta */
function stepSync(){
  if(!stepAndroid())return;
  try{const o=JSON.parse(NATIVE.stepsGet()||'{}');STEP.info=o;let ch=false;
    const days=o.days||{},min=stepYmd(new Date(Date.now()-40*864e5));
    for(const k in days){if(k<min)continue;const n=Math.round(num(days[k]));if(n>stepsOn(k)){const d=ensureDay(k);d.steps=n;store.mark('d-'+k);ch=true}}
    return ch}catch(e){return false}
}
window.stepsPermDone=function(){stepSync();render()};

function stepCard(){
  const t=today(),n=stepsOn(t),g=stepGoal(),pct=Math.min(1,n/g),hit=n>=g;
  if(stepAndroid()){
    const I=STEP.info||{};
    if(I.sensor===false)return'';
    if(I.perm===false)return`<button class="card stepc" data-act="stepAsk"><span class="ring"><i aria-hidden="true">👟</i></span><span class="t"><b>Contador de passos</b><small>Toque para permitir que o ATHOS conte seus passos do dia. Ele usa o sensor do celular e quase não gasta bateria.</small></span></button>`;
  }else if(!Object.values(S.days).some(d=>d&&num(d.steps)>0))return'';
  const r=34,C=2*Math.PI*r;
  return`<button class="card stepc" data-act="stepSheet" aria-label="Passos de hoje: ${fmtN(n)} de ${fmtN(g)}"><span class="ring"><svg viewBox="0 0 78 78" aria-hidden="true"><circle cx="39" cy="39" r="${r}" fill="none" stroke="var(--surface2)" stroke-width="8"/><circle cx="39" cy="39" r="${r}" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(C*pct).toFixed(1)} ${C.toFixed(1)}"/></svg><i aria-hidden="true">👟</i></span>
    <span class="t"><span class="n">${fmtN(n)}<span>passos</span></span><small>${hit?'<span class="ok">Meta batida!</span>':`faltam ${fmtN(g-n)} para ${fmtN(g)}`} · ${fmtD(Math.round(stepKm(n)*10)/10)} km · ${fmtN(stepKcal(n))} kcal</small>${stepAndroid()?'':'<small>Contados pelo app no Android</small>'}</span></button>`;
}
{const _vh=VIEWS.hoje;VIEWS.hoje=function(){const h=_vh.apply(this,arguments),sc=stepCard();if(!sc)return h;const kc=kcalCard(today()),i=h.indexOf(kc);return i>=0?h.slice(0,i+kc.length)+sc+h.slice(i+kc.length):sc+h}}

function stepSheet(){
  const L=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);L.push(stepYmd(d))}
  const g=stepGoal(),mx=Math.max(g,...L.map(stepsOn)),hits=L.filter(k=>stepsOn(k)>=g).length,avg=Math.round(L.reduce((a,k)=>a+stepsOn(k),0)/7);
  const wd=['dom','seg','ter','qua','qui','sex','sáb'];
  openSheet('Passos',`<div class="st-bars" role="img" aria-label="Passos nos últimos 7 dias">${L.map(k=>{const n=stepsOn(k),dt=new Date(k+'T12:00');return`<div><b>${n?(n>=1000?fmtD(Math.round(n/100)/10)+'k':n):''}</b><i class="${n>=g?'hit':''}" style="height:${Math.round(n/mx*100)}%"></i><small>${k===today()?'hoje':wd[dt.getDay()]}</small></div>`}).join('')}</div>
    <p class="hint">Média de ${fmtN(avg)} passos por dia nos últimos 7 dias. Você bateu a meta em ${hits} ${hits===1?'dia':'dias'}.</p>
    <p class="eyebrow" style="margin:10px 0 -2px">Meta diária</p>
    <div class="st-goal">${[6000,8000,10000,12000].map(v=>`<button class="chip" data-g="${v}" aria-pressed="${v===g}">${fmtN(v)}</button>`).join('')}</div>
    <p class="hint">Distância e calorias são estimativas pela sua altura e pelo seu peso. ${stepAndroid()?'Os passos são contados pelo sensor do celular, mesmo com o app fechado. Ao abrir, o ATHOS atualiza o total.':'Os passos vêm do app no Android, pela sua conta.'}</p>`,(b,el)=>{
    b.onclick=e=>{const x=e.target.closest('[data-g]');if(!x)return;S.profile.stepGoal=+x.dataset.g;store.mark('profile');closeSheet(el);render();toast('Meta de passos: '+fmtN(+x.dataset.g))}});
}

Object.assign(ACT,{stepAsk:()=>{try{NATIVE.stepsAsk()}catch(e){}},stepSheet:()=>{stepSync();stepSheet()}});
setTimeout(()=>{if(stepSync())render();else if(stepAndroid())render()},2000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&stepAndroid()){stepSync();render()}});
setInterval(()=>{if(document.visibilityState==='visible'&&stepAndroid()&&STEP.info&&STEP.info.perm&&stepSync())render()},120000);
