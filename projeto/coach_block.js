/* ---------- Coach ATHOS: a IA do app, com os seus dados e a biblioteca ATHOS ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
.coach-card{display:flex;flex-direction:column;gap:10px;background:radial-gradient(120% 140% at 100% 0%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 60%),var(--surface);border:1px solid color-mix(in srgb,var(--accent) 35%,var(--cardline))}
.coach-card .hd{display:flex;align-items:center;gap:12px}
.coach-av{width:46px;height:46px;border-radius:15px;background:#0b0b0b;display:grid;place-items:center;flex:none;border:1px solid color-mix(in srgb,var(--accent) 50%,transparent);overflow:hidden}
.coach-av img{width:38px;height:38px}
.coach-card .hd b{display:block;font:800 18px var(--display);text-transform:uppercase;letter-spacing:.03em}.coach-card .hd small{color:var(--muted);font-size:13px}
.cq{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}.cq::-webkit-scrollbar{display:none}
.cq button{flex:none;border:1px solid var(--cardline);background:var(--surface2);color:var(--fg);border-radius:99px;padding:8px 12px;font:600 13px var(--body);white-space:nowrap}
.coachS{height:96%;max-height:96%!important}.coachS .sheet-h{padding:10px 12px;border-bottom:1px solid var(--line);justify-content:flex-start;gap:10px}.coachS .sheet-h h2{display:none}
.coachS .sheet-b{padding-top:0;padding-bottom:0;gap:0;flex:1}
.cch{display:flex;align-items:center;gap:10px;flex:1;min-width:0}.cch .t{display:flex;flex-direction:column;min-width:0}.cch b{font:800 18px var(--display);text-transform:uppercase}.cch small{color:var(--muted);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cbox{display:flex;flex-direction:column;gap:10px;padding:14px 0;flex:1}
.cm{max-width:88%;padding:10px 13px;border-radius:18px;font-size:15px;line-height:1.45;overflow-wrap:anywhere}
.cm.u{align-self:flex-end;background:var(--accent);color:#141414;border-bottom-right-radius:6px}
.cm.a{align-self:flex-start;background:var(--surface);border:1px solid var(--cardline);border-bottom-left-radius:6px}
.cm.a p{margin:0 0 6px}.cm.a p:last-child{margin:0}.cm.a ul,.cm.a ol{margin:4px 0 6px;padding-left:20px}.cm.a li{margin:2px 0}
.cm.a .src{display:block;margin-top:6px;font-size:11.5px;color:var(--muted)}
.cm.typing{color:var(--muted)}.cm.typing i{display:inline-block;width:7px;height:7px;border-radius:50%;background:currentColor;margin:0 2px;animation:cdot 1.2s infinite}.cm.typing i:nth-child(2){animation-delay:.2s}.cm.typing i:nth-child(3){animation-delay:.4s}
@keyframes cdot{0%,80%,100%{opacity:.25}40%{opacity:1}}
.cfch{align-self:flex-start;display:flex;gap:8px;flex-wrap:wrap;margin-top:-4px}
.ccomp{position:sticky;bottom:0;background:var(--bg);margin:0 -16px;padding:8px 12px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px;z-index:3}
.ccomp .row{display:flex;gap:8px;align-items:flex-end;flex-wrap:nowrap}
.ccomp textarea{flex:1;min-height:44px;max-height:120px;height:44px;border-radius:22px;padding:11px 16px;resize:none;line-height:1.3}
.ccomp .snd{width:44px;height:44px;border-radius:50%;border:0;background:var(--accent);color:#000;display:grid;place-items:center;flex:none}
.ccomp .snd svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.ccomp small{color:var(--muted);font-size:11.5px;text-align:center}
.cpers{display:flex;flex-direction:column;gap:8px}
.cpers button{display:flex;align-items:center;gap:12px;text-align:left;border:1px solid var(--cardline);background:var(--surface);color:inherit;border-radius:16px;padding:12px 14px;font:inherit}
.cpers button[aria-pressed=true]{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}
.cpers .e{font-size:28px;flex:none}.cpers b{display:block;font-size:15.5px}.cpers small{color:var(--muted);font-size:13px}
.cwel{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:18px 6px 6px}.cwel .coach-av{width:72px;height:72px;border-radius:22px}.cwel .coach-av img{width:58px;height:58px}
.cwel h3{font:800 24px var(--display);text-transform:uppercase;margin:4px 0 0}.cwel p{color:var(--muted);margin:0;font-size:14.5px}
.csug{display:flex;flex-direction:column;gap:8px;width:100%;margin-top:8px}.csug button{border:1px solid var(--cardline);background:var(--surface);color:var(--fg);border-radius:14px;padding:11px 14px;font:600 14px var(--body);text-align:left}
</style>`);

const COACH_PERS=[
  ['motivador','🔥','Motivador','Energia lá em cima, "bora, monstro!" e muito incentivo.','Fale com MUITA energia e motivação, como um personal brasileiro empolgado: frases curtas, "bora!", "vamo que vamo", elogie cada conquista. Use 1 ou 2 emojis por resposta.'],
  ['tecnico','🧠','Técnico','Explica o porquê com base em ciência e números, com calma.','Fale como um treinador técnico e calmo: explique o porquê com base em evidências, use números e referências práticas (séries, %, g/kg). Sem exageros e sem gíria.'],
  ['parceiro','😎','Parceiro de treino','Amigo da academia: leve, descontraído e sincero.','Fale como um parceiro de treino gente boa: descontraído, linguagem do dia a dia, sincero e próximo. Pode usar gírias leves.'],
  ['durao','🪖','Linha dura','Direto, exigente e sem desculpas (mas com respeito).','Fale como um treinador linha dura: direto, exigente, sem aceitar desculpa, cobra disciplina e constância. Nunca ofenda nem humilhe; seja firme e respeitoso.'],
  ['zoeiro','😂','Zoeiro','Bem-humorado e cheio de piada, mas ajuda de verdade.','Fale de forma bem-humorada, com piadas leves e zoeira saudável sobre academia, mas sempre entregue a resposta útil e correta. Nunca zombe do corpo da pessoa.']];
const coachPers=()=>COACH_PERS.find(p=>p[0]===(S.profile.coachStyle||''))||null;
const COACH={hist:null,busy:false};
function coachKey(){return'athos.coach.'+((typeof SOC!=='undefined'&&SOC&&SOC.user&&SOC.user.id)||'x')}
function coachHist(){if(COACH.hist&&COACH.hist.k===coachKey())return COACH.hist.list;let l=[];try{l=JSON.parse(localStorage.getItem(coachKey())||'[]')}catch(e){}COACH.hist={k:coachKey(),list:l};return l}
function coachSave(){try{localStorage.setItem(coachKey(),JSON.stringify(coachHist().slice(-40)))}catch(e){}}
const coachLogo=()=>{const i=document.querySelector('.brand img');return`<span class="coach-av">${i?`<img src="${i.src}" alt="">`:'🏋️'}</span>`};

/* --- o que o Coach sabe sobre você (sem nome, sem e-mail) --- */
function coachContext(){const p=S.profile,g=goals(),td=today(),t=dayTotals(td),w=curWeight(),st=streak();
  const d=new Date();const L=[];
  L.push(`Hoje: ${d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}, ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}.`);
  L.push(`Perfil: ${p.sex==='f'?'mulher':p.sex==='m'?'homem':'sexo não informado'}${p.age?', '+p.age+' anos':''}${p.height?', '+p.height+' cm':''}${w?', '+fmtD(w)+' kg':''}${p.targetWeight?', meta de peso '+p.targetWeight+' kg':''}; objetivo: ${(GOALS[p.goal]||['não definido'])[0]}.`);
  L.push(`Metas do dia: ${fmtN(g.kcal)} kcal, proteína ${fmtN(g.p)} g, carbo ${fmtN(g.c)} g, gordura ${fmtN(g.f)} g, água ${fmtN(g.water||0)} ml.`);
  const day=S.days[td]||{};L.push(`Comido hoje: ${fmtN(t.kcal)} kcal, proteína ${fmtN(t.p)} g, carbo ${fmtN(t.c)} g, gordura ${fmtN(t.f)} g; água ${fmtN(day.water||0)} ml. Faltam ${fmtN(Math.max(0,g.kcal-t.kcal))} kcal e ${fmtN(Math.max(0,g.p-t.p))} g de proteína.`);
  L.push(`Sequência: ${st.n} dia(s)${st.on?' (hoje já registrou)':''}.`);
  const ws=weekOf(td);const wk=sessList().filter(s=>s.date>=ws);L.push(`Nesta semana: ${wk.length} atividade(s).`);
  const ss=sessList().slice(0,6);
  if(ss.length){L.push('Últimas atividades:');for(const s of ss){if(s.run){L.push(`- ${s.date} ${s.run.type==='bike'?'pedal':s.run.type==='walk'?'caminhada':'corrida'} ${km2(s.run.dist||0)} km em ${Math.round((s.run.moving||0)/60)} min`);continue}
    const x=sessStats(s);L.push(`- ${s.date} "${s.name||'Treino'}": ${x.sets} séries, ${fmtN(x.vol)} kg de volume, ${x.dur>0?Math.round(x.dur/60000)+' min, ':''}${(()=>{let k=s.kcal;try{k=k||sessKcal(s).kcal}catch(e){}return k>0?'~'+fmtN(k)+' kcal':''})()}; `+(s.exercises||[]).slice(0,8).map(e=>{const b=bestSet(e);return`${e.name} ${b?setTxt(e.type,b,e.name):''}`}).join('; '))}}
  else L.push('Ainda não registrou treinos.');
  const names=[...new Set(sessList().flatMap(s=>(s.exercises||[]).filter(e=>e.type!=='t').map(e=>e.name)))].slice(0,12);
  if(names.length)L.push('Recordes de carga: '+names.map(n=>`${n} ${fmtD(bestKg(n))} kg`).join('; ')+'.');
  const tp=p.templates||[];if(tp.length){L.push('Fichas salvas:');for(const x of tp.slice(0,8))L.push(`- "${x.name}": `+(x.exercises||[]).map(e=>`${e.name} ${e.sets}x${e.reps}`).join(', '))}
  const nx=typeof nextTemplate==='function'?nextTemplate():null;if(nx)L.push(`Próxima ficha sugerida pelo app: "${nx.name}".`);
  return L.join('\n').slice(0,5000)}

function coachSystem(kb){const ps=coachPers()||COACH_PERS[0];
  return`Você é o COACH ATHOS, o treinador virtual do app ATHOS (treino, dieta, corrida e rede social). Responda SEMPRE em português do Brasil.
PERSONALIDADE: ${ps[4]}
REGRAS:
- Use os DADOS DO USUÁRIO abaixo para responder de forma personalizada (cite cargas, datas e números reais quando ajudar). Se faltar um dado, diga o que a pessoa pode registrar no app.
- Use a BIBLIOTECA ATHOS como referência principal; não contradiga ela.
- Seja prático e curto (até ~180 palavras), com listas quando ajudar. Termine com uma ação clara para hoje quando fizer sentido.
- Você NÃO é médico nem nutricionista: em dor forte, lesão, doença, remédios, gravidez, dieta muito restritiva (menos de 1.200 kcal) ou sinais de transtorno alimentar, oriente procurar um profissional. Nunca oriente anabolizantes, hormônios ou remédios para emagrecer.
- Se a pessoa pedir para MONTAR um treino ou uma ficha, responda normalmente e, no FINAL, inclua exatamente um bloco <ficha>{"nome":"...","exercicios":[{"nome":"Supino reto","grupo":"Peito","series":3,"reps":"8-12","tipo":"peso"}]}</ficha> (tipo "tempo" para exercícios em minutos, com reps = minutos). Grupos válidos: Peito, Costas, Pernas, Glúteos, Ombros, Bíceps, Tríceps, Abdômen, Cardio, Outros.
- Não invente funções que o ATHOS não tem.

DADOS DO USUÁRIO:
${coachContext()}
${kb&&kb.length?`\nBIBLIOTECA ATHOS (trechos relevantes):\n${kb.map(k=>`[${k.title}] ${k.body}`).join('\n')}`:''}`}

async function coachKB(q){try{const r=await SOC.sb.rpc('coach_search',{q:String(q).slice(0,300)});return r.data||[]}catch(e){return[]}}

/* --- texto da IA → HTML simples e seguro --- */
function coachMd(t){const lines=esc(t).split(/\n/);let h='',list=null;
  const fmt=s=>s.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<i>$2</i>');
  const close=()=>{if(list){h+=`</${list}>`;list=null}};
  for(const ln of lines){const ul=ln.match(/^\s*[-•*]\s+(.*)/),ol=ln.match(/^\s*\d+[.)]\s+(.*)/);
    if(ul){if(list!=='ul'){close();h+='<ul>';list='ul'}h+=`<li>${fmt(ul[1])}</li>`;continue}
    if(ol){if(list!=='ol'){close();h+='<ol>';list='ol'}h+=`<li>${fmt(ol[1])}</li>`;continue}
    close();if(ln.trim())h+=`<p>${fmt(ln.replace(/^#+\s*/,''))}</p>`}
  close();return h}
function coachFicha(t){const m=String(t).match(/<ficha>([\s\S]*?)<\/ficha>/i);if(!m)return{text:t,ficha:null};let f=null;try{f=JSON.parse(m[1])}catch(e){try{f=parseLoose(m[1])}catch(_){}}
  return{text:t.replace(m[0],'').trim(),ficha:f&&Array.isArray(f.exercicios)&&f.exercicios.length?f:null}}

/* --- tela do Coach --- */
function coachOpen(q){
  if(typeof SOC==='undefined'||!SOC.user){toast('Entre na sua conta para usar o Coach ATHOS');return}
  if(!coachPers()){coachPersSheet(()=>coachOpen(q));return}
  const el=openSheet('Coach ATHOS',`<div class="cbox" id="cbox"></div><div class="ccomp"><div class="row"><textarea id="cin" rows="1" placeholder="Pergunte ao Coach…" maxlength="800"></textarea><button class="snd" data-c="send" aria-label="Enviar"><svg viewBox="0 0 24 24"><path d="M5 12h13M12 5l7 7-7 7"/></svg></button></div><small id="cuse">O Coach dá orientação geral e não substitui médico ou nutricionista.</small></div>`,(b,el)=>{
    el.querySelector('.sheet').classList.add('coachS');const hd=el.querySelector('.sheet-h');
    const drawHd=()=>{const ps=coachPers();hd.innerHTML=`<button class="icon-btn" data-close aria-label="Fechar">←</button><span class="cch">${coachLogo()}<span class="t"><b>Coach ATHOS</b><small>${ps?ps[1]+' '+esc(ps[2]):''}${typeof AI!=='undefined'&&AI.srvDay===today()&&AI.srvLeft!=null?` · ${AI.srvLeft} perguntas hoje`:''}</small></span></span><button class="icon-btn" data-c="menu" aria-label="Opções">⋯</button>`};drawHd();
    const box=b.querySelector('#cbox'),ta=b.querySelector('#cin');
    const sug=['O que eu treino hoje?','Quanto falta de proteína hoje?','Por que minha carga travou?','Monta um treino de 30 min para hoje','Como está minha evolução?'];
    const draw=()=>{const H=coachHist();
      if(!H.length){box.innerHTML=`<div class="cwel">${coachLogo()}<h3>Fala, atleta!</h3><p>Sou o Coach ATHOS. Conheço seus treinos, cargas, dieta e metas. Pergunta aí:</p><div class="csug">${sug.map(s=>`<button data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`;return}
      box.innerHTML=H.map((m,i)=>m.r==='u'?`<div class="cm u">${esc(m.t)}</div>`:`<div class="cm a">${coachMd(m.t)}${m.err?'':''}</div>${m.f?`<div class="cfch"><button class="btn sm primary" data-c="savef" data-i="${i}">💾 Salvar como ficha “${esc(m.f.nome||'Treino do Coach')}”</button></div>`:''}`).join('')+(COACH.busy?`<div class="cm a typing"><i></i><i></i><i></i></div>`:'');
      b.scrollTop=b.scrollHeight};
    draw();
    const grow=()=>{ta.style.height='44px';ta.style.height=Math.min(120,ta.scrollHeight)+'px'};ta.addEventListener('input',grow);
    const ask=async q=>{q=String(q||'').trim();if(!q||COACH.busy)return;const H=coachHist();H.push({r:'u',t:q});coachSave();COACH.busy=true;draw();
      try{const kb=await coachKB(q+' '+(H.slice(-3,-1).map(m=>m.t).join(' ')));
        const past=H.slice(-9,-1).map(m=>({role:m.r==='u'?'user':'assistant',content:m.t}));
        const turns=[{role:'user',content:coachSystem(kb)+'\n\nResponda à conversa a seguir.'},{role:'assistant',content:'Entendido! Sou o Coach ATHOS.'},...past,{role:'user',content:q}];
        const raw=stripThink(await aiCall(turns,{},false));const{text,ficha}=coachFicha(raw);
        H.push({r:'a',t:text||'Não consegui responder agora.',f:ficha||undefined})}
      catch(e){H.push({r:'a',t:'⚠️ '+(typeof aiMsg==='function'?aiMsg(e):'Não consegui responder agora. Tente de novo.')})}
      COACH.busy=false;coachSave();draw();drawHd()};
    const send=()=>{const q=ta.value;ta.value='';grow();ask(q)};
    el.addEventListener('click',e=>{const x=e.target.closest('[data-c],[data-q]');if(!x||!el.contains(x))return;
      if(x.dataset.q){ask(x.dataset.q);return}
      const k=x.dataset.c;if(k==='send')send();
      if(k==='menu')openSheet('Coach ATHOS',`<div class="mact" style="display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--cardline);border-radius:18px;overflow:hidden"><button class="btn ghost" data-m="pers" style="justify-content:flex-start">🎭 Mudar a personalidade</button><button class="btn ghost" data-m="clear" style="justify-content:flex-start">🧹 Apagar a conversa</button></div><p class="hint">A conversa fica só neste aparelho. Para responder, o Coach envia suas metas, treinos e dieta (sem nome nem e-mail) para o serviço de IA.</p>`,(mb,mw)=>{
        mb.onclick=ev=>{const m=ev.target.closest('[data-m]');if(!m)return;closeSheet(mw);
          if(m.dataset.m==='pers')coachPersSheet(()=>{drawHd()});
          if(m.dataset.m==='clear')confirmSheet('Apagar toda a conversa com o Coach?','Apagar',()=>{coachHist().length=0;coachSave();draw()})}});
      if(k==='savef'){const m=coachHist()[+x.dataset.i];if(!m||!m.f)return;const f=m.f;
        const G=typeof GROUPS!=='undefined'?GROUPS:['Outros'];
        const tpl={id:newId('t'),name:String(f.nome||'Treino do Coach').slice(0,60),exercises:f.exercicios.slice(0,20).map(x2=>{const tempo=/tempo|min/i.test(String(x2.tipo||''));return{name:String(x2.nome||'Exercício').slice(0,60),group:G.includes(x2.grupo)?x2.grupo:'Outros',type:tempo?'t':'w',sets:Math.max(1,Math.min(10,parseInt(x2.series)||3)),reps:String(x2.reps||(tempo?'10':'8-12')).slice(0,12)}})};
        S.profile.templates.push(tpl);store.mark('profile');saveLocal();x.disabled=true;x.textContent='✓ Ficha salva na aba Treino';toast('Ficha salva! Está na aba Treino.');render()}});
    ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!('ontouchstart' in window)){e.preventDefault();send()}});
    if(q)ask(q);
  });
  return el}
function coachPersSheet(done){const cur=(coachPers()||[])[0];
  openSheet('Escolha o seu Coach',`<p class="hint" style="margin-top:-6px">Como você quer que o Coach ATHOS fale com você? Dá para trocar quando quiser.</p><div class="cpers">${COACH_PERS.map(p=>`<button data-p="${p[0]}" aria-pressed="${cur===p[0]}"><span class="e">${p[1]}</span><span><b>${esc(p[2])}</b><small>${esc(p[3])}</small></span></button>`).join('')}</div>`,(b,el)=>{
    b.onclick=e=>{const x=e.target.closest('[data-p]');if(!x)return;S.profile.coachStyle=x.dataset.p;store.mark('profile');saveLocal();closeSheet(el);toast('Coach '+(coachPers()||[])[2]+' ativado');render();done&&done()}})}

/* --- card no Hoje --- */
function coachCard(){if(typeof SOC==='undefined'||!SOC.user)return'';const ps=coachPers();
  return`<div class="card coach-card"><div class="hd">${coachLogo()}<span style="flex:1;min-width:0"><b>Coach ATHOS</b><small>${ps?ps[1]+' '+esc(ps[2])+' · ':''}pergunte sobre treino, dieta e evolução</small></span><button class="btn sm primary" data-act="coachOpen">Abrir</button></div>
   <div class="cq">${['O que eu treino hoje?','Quanto falta de proteína?','Monta um treino de 30 min'].map(s=>`<button data-act="coachAsk" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`}

/* --- bolinha flutuante do Coach (arrastável, gruda na borda, posição salva) --- */
document.head.insertAdjacentHTML('beforeend',`<style>
#coachFab{position:fixed;z-index:29;width:62px;height:62px;border-radius:50%;padding:0;border:0;background:transparent;touch-action:none;-webkit-tap-highlight-color:transparent;left:0;top:0;transition:transform .32s cubic-bezier(.3,.8,.25,1.2),opacity .2s;will-change:transform;user-select:none;-webkit-user-select:none}
#coachFab.drag{transition:none}#coachFab.drag .cf-in{transform:scale(1.08)}
#coachFab[hidden]{display:block;opacity:0;pointer-events:none}
#coachFab .cf-in{position:absolute;inset:0;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#2a2416,#0b0b0b 70%);border:2px solid var(--accent);box-shadow:0 8px 24px rgba(0,0,0,.55),0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent);transition:transform .15s}
#coachFab .cf-in{overflow:hidden}#coachFab .cf-in img{width:100%;height:100%;object-fit:cover;border-radius:50%;transform:scale(1.12);pointer-events:none}
#coachFab::before{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid var(--accent);opacity:0;animation:cfRing 3.2s ease-out infinite;pointer-events:none}
@keyframes cfRing{0%{transform:scale(.85);opacity:.55}70%,100%{transform:scale(1.25);opacity:0}}
#coachFab .cf-b{position:absolute;right:-4px;bottom:-2px;min-width:24px;height:20px;padding:0 5px;border-radius:10px;background:var(--accent);color:#141414;font:800 11px/20px var(--body);letter-spacing:.02em;border:2px solid var(--bg);pointer-events:none}
#coachFab:active .cf-in{transform:scale(.94)}
.cf-tip{position:fixed;z-index:29;background:var(--surface);border:1px solid var(--accent);color:var(--fg);border-radius:14px;padding:9px 12px;font:600 13.5px var(--body);box-shadow:0 8px 24px rgba(0,0,0,.5);max-width:210px;animation:cfTip .3s ease-out}
@keyframes cfTip{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion:reduce){#coachFab::before{animation:none}#coachFab{transition:opacity .2s}}
</style>`);
const CFAB={el:null,x:null,y:null};
function cfabSize(){return 62}
function cfabClamp(x,y){const W=innerWidth,H=innerHeight,sz=cfabSize(),m=10;
  const top=Math.max(m,(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat'))||0)+70),bot=H-sz-90;
  return[Math.min(Math.max(m,x),W-sz-m),Math.min(Math.max(top,y),Math.max(top,bot))]}
function cfabPlace(snap){const el=CFAB.el;if(!el)return;let x=CFAB.x,y=CFAB.y;const sz=cfabSize();
  if(x==null){x=innerWidth-sz-12;y=innerHeight-sz-170}
  if(snap)x=x+sz/2<innerWidth/2?12:innerWidth-sz-12;
  [x,y]=cfabClamp(x,y);CFAB.x=x;CFAB.y=y;el.style.transform=`translate(${x}px,${y}px)`}
function cfabSave(){try{localStorage.setItem('athos.coachFab',JSON.stringify({r:CFAB.x+cfabSize()/2>innerWidth/2,y:CFAB.y/innerHeight}))}catch(e){}}
function cfabLoad(){try{const o=JSON.parse(localStorage.getItem('athos.coachFab')||'null');if(o){CFAB.y=o.y*innerHeight;CFAB.x=o.r?innerWidth:0}}catch(e){}}
function cfabVisible(){if(typeof SOC==='undefined'||!SOC.user)return false;
  if(sheets.length||document.body.classList.contains('touring'))return false;
  const s=$('#session'),r=$('#run'),g=$('#authGate');if((s&&!s.hidden)||(r&&!r.hidden)||(g&&!g.hidden))return false;
  if(document.getElementById('tour')||document.getElementById('xtimer'))return false;return true}
function cfabSync(){if(!CFAB.el)return;const v=cfabVisible();if(CFAB.el.hidden===v)CFAB.el.hidden=!v;if(!v){const t=document.querySelector('.cf-tip');t&&t.remove()}}
function cfabInit(){if(CFAB.el)return;const b=document.createElement('button');b.id='coachFab';b.setAttribute('aria-label','Abrir o Coach ATHOS');b.hidden=true;
  const i=document.querySelector('.brand img');b.innerHTML=`<span class="cf-in">${i?`<img src="${i.src}" alt="">`:'🏋️'}</span><span class="cf-b">IA</span>`;
  document.body.appendChild(b);CFAB.el=b;cfabLoad();cfabPlace(true);
  let st=null;
  b.addEventListener('pointerdown',e=>{st={px:e.clientX,py:e.clientY,x:CFAB.x,y:CFAB.y,moved:false,id:e.pointerId};try{b.setPointerCapture(e.pointerId)}catch(_){}});
  b.addEventListener('pointermove',e=>{if(!st)return;const dx=e.clientX-st.px,dy=e.clientY-st.py;
    if(!st.moved&&Math.hypot(dx,dy)<8)return;if(!st.moved){st.moved=true;b.classList.add('drag');const t=document.querySelector('.cf-tip');t&&t.remove()}
    CFAB.x=st.x+dx;CFAB.y=st.y+dy;const[x,y]=cfabClamp(CFAB.x,CFAB.y);b.style.transform=`translate(${x}px,${y}px)`});
  const end=e=>{if(!st)return;const m=st.moved;st=null;b.classList.remove('drag');
    if(m){cfabPlace(true);cfabSave();try{NATIVE&&NATIVE.vibrate&&NATIVE.vibrate(10)}catch(_){}}else{const t=document.querySelector('.cf-tip');t&&t.remove();coachOpen()}};
  b.addEventListener('pointerup',end);b.addEventListener('pointercancel',()=>{if(st&&st.moved){cfabPlace(true);cfabSave()}st=null;b.classList.remove('drag')});
  b.addEventListener('click',e=>e.preventDefault());
  addEventListener('resize',()=>{cfabLoad();cfabPlace(true)});
  setInterval(cfabSync,400);cfabSync();
  /* dica na primeira vez */
  let tipped=false;try{tipped=!!localStorage.getItem('athos.coachTip')}catch(e){}
  if(!tipped)setTimeout(()=>{if(!cfabVisible()||document.querySelector('.cf-tip'))return;try{localStorage.setItem('athos.coachTip','1')}catch(e){}
    const t=document.createElement('div');t.className='cf-tip';t.textContent='Sou o Coach ATHOS! Toque para perguntar. Segure e arraste para me mudar de lugar.';document.body.appendChild(t);
    const r=t.getBoundingClientRect(),right=CFAB.x>innerWidth/2;t.style.top=Math.max(70,CFAB.y-r.height-12)+'px';t.style[right?'right':'left']='12px';
    t.onclick=()=>t.remove();setTimeout(()=>t.remove(),7000)},2500)}
setTimeout(cfabInit,600);
Object.assign(ACT,{coachOpen:()=>coachOpen(),coachAsk:el=>coachOpen(el.dataset.q),coachPers:()=>coachPersSheet()});

/* --- Configurações: personalidade --- */
{const _c=cfgHtml;cfgHtml=function(){const h=_c.apply(this,arguments);const ps=coachPers();
  const sec=`<p class="cfg-h">Coach ATHOS</p><div class="card"><div class="cfg-row"><span class="t"><b>Personalidade</b><small>${ps?ps[1]+' '+esc(ps[2])+' — '+esc(ps[3]):'Ainda não escolhida'}</small></span><button class="btn sm" data-act="coachPers">Mudar</button></div></div>`;
  const i=h.indexOf('<p class="cfg-h">Treino</p>');return i>=0?h.slice(0,i)+sec+h.slice(i):h+sec}}
