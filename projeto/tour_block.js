/* ---------- tutorial de primeira entrada ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
#tour{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;justify-content:flex-start;padding:calc(env(safe-area-inset-top,0px) + 70px) 16px 0}
#tour .tscrim{position:absolute;inset:0;background:rgb(0 0 0 / .62)}
#tour .tc{position:relative;max-width:420px;width:100%;margin:0 auto;background:var(--ink);color:#fff;border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);border-radius:26px;padding:22px 20px 18px;
  display:flex;flex-direction:column;gap:12px;box-shadow:0 24px 60px -20px rgb(0 0 0 / .7);animation:tIn .3s cubic-bezier(.3,.7,.2,1)}
@keyframes tIn{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
#tour .ti{width:64px;height:64px;border-radius:20px;background:var(--accent);color:#000;display:grid;place-items:center}
#tour .ti svg{width:34px;height:34px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
#tour .ti img{width:64px;height:64px;border-radius:18px}
#tour .ts{font:600 13px var(--body);color:#A3A8B2}
#tour h2{font:800 30px/1 var(--display);text-transform:uppercase;letter-spacing:.02em;color:#fff;margin:0}
#tour p{color:#D5D8DE;font-size:15.5px;line-height:1.5;margin:0}
#tour ul{margin:0;padding-left:18px;color:#D5D8DE;font-size:15px;line-height:1.5;display:flex;flex-direction:column;gap:4px}
#tour ul b{color:#fff}
#tour .tb{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px}
#tour .dots{display:flex;gap:5px}
#tour .dots i{width:7px;height:7px;border-radius:9px;background:#3A3C42;transition:width .25s,background .25s}
#tour .dots i.on{width:20px;background:var(--accent)}
#tour .skip{border:0;background:none;color:#A3A8B2;font:600 14px var(--body);padding:10px 4px}
#tour .next{min-width:132px}
body.touring .tabbar{z-index:61;transform:none!important;opacity:1!important;pointer-events:none}
body.touring .tbfab{opacity:0!important}
body.touring .tab.spot{color:#000;background:var(--accent);border-radius:16px}
body.touring .tab.spot::after{width:0}
@media (prefers-reduced-motion:reduce){#tour .tc{animation:none}}
</style>`);
const TI={
  logo:()=>`<img src="${(document.querySelector('.brand img')||{}).src||''}" alt="">`,
  target:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
  hoje:'<svg viewBox="0 0 24 24"><path d="M3.5 15a8.5 8.5 0 1 1 17 0"/><path d="M12 15l4.5-4.5"/><path d="M8 19h8"/></svg>',
  treino:'<svg viewBox="0 0 24 24"><path d="M2.5 9.5v5M6 6.5v11M18 6.5v11M21.5 9.5v5M6 12h12"/></svg>',
  run:'<svg viewBox="0 0 24 24"><circle cx="15" cy="4.5" r="2"/><path d="M8 21l3-6 3 2 1 5M6 12l3-4 4 1 2 4 3 1"/></svg>',
  dieta:'<svg viewBox="0 0 24 24"><path d="M6 3v7a2.5 2.5 0 0 0 5 0V3M8.5 12.5V21M17.5 21V3c-2.2 1-3.5 4-3.5 7.5 0 2 1 3 3.5 3"/></svg>',
  evolucao:'<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
  social:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.7.8 2.7 2.6 3 5.2"/></svg>',
  bell:'<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/></svg>',
  go:'<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>'};
function tourSteps(){const and=!!NATIVE;return[
  {tab:'hoje',ic:'logo',t:'Bem-vindo ao ATHOS',h:`<p>Seu app de treino, dieta e corrida, com seus amigos. Em 1 minuto eu te mostro onde fica cada coisa.</p>`},
  {tab:'perfil',ic:'target',t:'Comece pelas metas',h:`<p>No <b>Perfil</b>, toque em <b>Editar dados e metas</b> e coloque idade, altura, peso e objetivo.</p><p>Com isso o ATHOS calcula suas calorias, proteína, carbo, gordura e água do dia.</p>`},
  {tab:'hoje',ic:'hoje',t:'A tela Hoje',h:`<ul><li>O <b>anel dourado</b> mostra quantas calorias ainda restam.</li><li>A <b>chama</b> no topo conta os dias seguidos com treino ou refeição registrada.</li><li>Também dá pra marcar a <b>água</b> e o <b>peso</b> por aqui.</li></ul>`},
  {tab:'treino',ic:'treino',t:'Seus treinos',h:`<ul><li><b>+ Novo treino</b> monta sua ficha, ou adicione um <b>modelo pronto</b>.</li><li>Toque em <b>Iniciar</b>, anote carga e repetições e marque <b>✓</b> em cada série.</li><li>O <b>descanso</b> começa sozinho e avisa quando acabar.</li><li>Recordes aparecem com destaque no final.</li></ul>`},
  ...(and?[{tab:'treino',ic:'run',t:'Corrida com GPS',h:`<p>Na aba Treino, em <b>Corrida, caminhada e pedal</b>, toque para gravar com GPS.</p><ul><li>Mapa do percurso, ritmo por km e passos.</li><li>Funciona com a <b>tela bloqueada</b> e fala o ritmo a cada km.</li></ul>`}]:[]),
  {tab:'dieta',ic:'dieta',t:'Sua dieta',h:`<ul><li>Em cada refeição, toque em <b>+ Adicionar</b> e busque o alimento.</li><li>Com a IA dá pra <b>tirar foto do prato</b> ou <b>descrever</b> o que comeu (20 usos grátis por dia).</li><li>Registre a <b>água</b> no fim da página.</li></ul>`},
  {tab:'evolucao',ic:'evolucao',t:'Sua evolução',h:`<p>Gráficos do <b>peso</b>, da <b>carga de cada exercício</b>, das calorias e o calendário de atividade. Quanto mais você registra, mais completo fica.</p>`},
  {tab:'social',ic:'social',t:'Treine com amigos',h:`<ul><li>Poste seus treinos e corridas e veja o <b>feed</b> de quem você segue.</li><li>Curta, comente e converse no <b>chat</b>.</li><li>Entre em <b>clubes</b> e dispute o ranking da semana.</li></ul>`},
  {tab:'social',ic:'bell',t:'Fique por dentro',h:`<ul><li>O <b>sininho</b> no topo mostra curtidas, comentários, seguidores e mensagens.</li>${and?'<li>Lembretes de água, refeições e treino chegam no celular. Ajuste tudo em <b>Perfil → Notificações</b>.</li>':''}<li>O botão <b>☰</b> na barra de baixo recolhe o menu.</li></ul>`},
  {tab:'perfil',ic:'go',t:'Tudo pronto!',h:`<p>Seus dados ficam salvos na sua conta e aparecem em qualquer aparelho.</p><p>Bora configurar suas metas e começar?</p>`,last:true}]}
const TOUR={i:0,steps:null};
function tourDraw(){const s=TOUR.steps[TOUR.i],n=TOUR.steps.length;let el=$('#tour');
  if(!el){el=document.createElement('div');el.id='tour';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');document.body.appendChild(el);
    el.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(!b)return;const k=b.dataset.t;
      if(k==='skip')tourEnd(false);else if(k==='back'){TOUR.i=Math.max(0,TOUR.i-1);tourDraw()}else if(TOUR.steps[TOUR.i].last)tourEnd(true);else{TOUR.i++;tourDraw()}})}
  document.body.classList.add('touring');if(s.tab&&S.tab!==s.tab&&VIEWS[s.tab])go(s.tab);
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('spot',t.dataset.tab===s.tab&&TOUR.i>0));
  const ic=typeof TI[s.ic]==='function'?TI[s.ic]():TI[s.ic];
  el.setAttribute('aria-label',s.t);
  el.innerHTML=`<div class="tscrim"></div><div class="tc"><div class="ti">${ic}</div><span class="ts">Passo ${TOUR.i+1} de ${n}</span><h2>${esc(s.t)}</h2>${s.h}
   <div class="tb">${TOUR.i?`<button class="skip" data-t="back">Voltar</button>`:`<button class="skip" data-t="skip">Pular</button>`}<span class="dots">${TOUR.steps.map((_,j)=>`<i class="${j===TOUR.i?'on':''}"></i>`).join('')}</span>
   <button class="btn primary next" data-t="next">${s.last?'Configurar metas':TOUR.i?'Próximo':'Começar'}</button></div></div>`;
  el.querySelector('.next').focus()}
function tourStart(){TOUR.steps=tourSteps();TOUR.i=0;tourDraw()}
function tourEnd(goSetup){const el=$('#tour');if(el)el.remove();document.body.classList.remove('touring');document.querySelectorAll('.tab.spot').forEach(t=>t.classList.remove('spot'));
  S.profile.tourDone=true;store.mark('profile');try{localStorage.setItem('athos.tour','1')}catch(e){}
  if(goSetup){go('perfil');try{ACT.profileSheet()}catch(e){}}else go('hoje')}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#tour'))tourEnd(false)});
window.tourBack=function(){if(!$('#tour'))return false;if(TOUR.i>0){TOUR.i--;tourDraw()}else tourEnd(false);return true};
/* mostra uma vez, depois do login e da sincronização */
let tourWait=0;
const tourTick=setInterval(()=>{
  const gate=$('#authGate');if(gate&&!gate.hidden){tourWait=0;return}
  if(!(SOC&&SOC.user))return;
  if(++tourWait<3)return;
  clearInterval(tourTick);
  let seen=false;try{seen=localStorage.getItem('athos.tour')==='1'}catch(e){}
  if(!seen&&!S.profile.tourDone&&!sheets.length&&!S.active)tourStart();
},1000);
/* botão para rever no Perfil */
{const _vp=VIEWS.perfil;VIEWS.perfil=function(){const h=_vp.apply(this,arguments);return h+`<button class="btn block" data-act="tourAgain" style="margin-top:-2px">Ver o tutorial de novo</button>`}}
ACT.tourAgain=()=>tourStart();
