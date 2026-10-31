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
  go:'<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
  chat:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  lock:'<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  star:'<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  photo:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="12" cy="12" r="3.5"/></svg>'};
function tourSteps(){const and=!!NATIVE;return[
  {tab:'hoje',ic:'logo',t:'Bem-vindo ao ATHOS',h:`<p>Treino, dieta, corrida e seus amigos num app só. Em 2 minutos eu te mostro tudo, inclusive as novidades.</p>`},
  {tab:'perfil',ic:'target',t:'Comece pelas metas',h:`<p>No <b>Perfil</b>, toque em <b>Editar</b> nas Metas diárias e coloque idade, altura, peso e objetivo.</p><p>O ATHOS calcula suas calorias, proteína, carbo, gordura e água.</p>`},
  {tab:'hoje',ic:'hoje',t:'A tela Hoje',h:`<ul><li>As <b>bolinhas da semana</b> acendem nos dias com treino ou refeição. É a sua sequência 🔥.</li><li>O <b>anel dourado</b> mostra as calorias que restam. Embaixo: <b>+ Refeição</b>, <b>+ Água</b> e <b>+ Peso</b>.</li><li><b>Treino de hoje</b> já sugere a próxima ficha.</li></ul>`},
  {tab:'treino',ic:'treino',t:'Seus treinos',h:`<ul><li><b>Começar agora</b>: Musculação, Check-in${and?', Correr, Caminhar e Pedalar':''} com um toque.</li><li><b>+ Criar</b> monta sua ficha do zero, com IA, por foto ou por modelo pronto.</li><li>Cada ficha tem <b>Iniciar</b>. Pode até colar uma <b>playlist</b> nela.</li></ul>`},
  {tab:'treino',ic:'go',t:'Durante o treino',h:`<ul><li>Anote carga e repetições e toque em <b>✓</b> em cada série. O <b>descanso</b> começa sozinho.</li><li>Exercício por tempo? Toque em <b>⏱</b> para o cronômetro.</li><li>Ao finalizar, o <b>relatório</b> mostra as 🔥 <b>calorias gastas</b> e o seu progresso.</li><li>💡 A <b>sugestão de carga</b> mostra quanto colocar hoje. Toque em <b>Usar</b>.</li><li>▶ <b>Como fazer</b> mostra a execução de cada exercício.</li>${and?'<li>Controle a <b>música</b> do YouTube Music ou do Spotify sem sair do app.</li>':''}</ul>`},
  ...(and?[{tab:'treino',ic:'run',t:'Corrida com GPS',h:`<p>Toque em <b>Correr</b>, <b>Caminhar</b> ou <b>Pedalar</b>.</p><ul><li>Mapa, ritmo por km e passos.</li><li>Funciona com a <b>tela bloqueada</b> e fala o ritmo a cada km.</li></ul>`}]:[]),
  {tab:'dieta',ic:'dieta',t:'Sua dieta',h:`<ul><li>Toque no <b>+</b> de cada refeição para adicionar.</li><li><b>Ler código de barras</b>: aponte a câmera para a embalagem e o alimento entra sozinho.</li><li>Com a IA: <b>foto do prato</b> (tire na hora ou escolha da galeria) ou <b>descrever</b> o que comeu.</li><li>Toque na refeição para ver os alimentos ou <b>repetir a de ontem</b>.</li></ul>`},
  {tab:'evolucao',ic:'evolucao',t:'Sua evolução',h:`<ul><li><b>Resumo</b> compara sua semana com a anterior.</li><li><b>Corpo</b>: medidas (cintura, braço…) e <b>fotos de antes e depois</b>, guardadas numa pasta privada da sua conta (até 20).</li><li><b>Peso</b>, <b>Força</b>, <b>Corrida</b> e <b>Calorias</b> com gráficos.</li></ul>`},
  {tab:'perfil',ic:'target',t:'Nível e medalhas',h:`<ul><li>Cada treino, corrida e dia ativo dá <b>XP</b>. Suba de <b>Bronze</b> até <b>Lenda</b>.</li><li>Complete os <b>desafios do mês</b> e ganhe <b>medalhas</b>, que aparecem no seu Perfil.</li></ul>`},
  {tab:'social',ic:'social',t:'Treine com amigos',h:`<ul><li>Ache amigos pelo <b>nome</b> ou pelo <b>ID</b>. O seu fica em Social → Eu.</li><li>No topo do feed, as <b>bolinhas</b> mostram quem treinou hoje. O ponto verde é quem está <b>online</b>.</li><li><b>Dois toques</b> na foto ou no mapa para curtir.</li><li><b>Compartilhar</b> gera um card bonito para os stories do Instagram e do WhatsApp.</li><li>Na aba <b>Desafios</b>: ranking e medalhas do mês.</li></ul>`},
  {tab:'social',ic:'chat',t:'Chat e clubes',h:`<ul><li>No <b>Chat</b>: mande <b>fotos</b>, <b>áudios</b> (segure o 🎤), <b>emojis</b> e seu <b>treino</b> pelo +. Segure uma mensagem para <b>reagir</b>, <b>responder</b> ou apagar.</li><li><b>Clubes</b> têm chat, mural, ranking e <b>meta da semana</b>. Para entrar, peça e o criador aceita.</li><li>Em ⚙ → Privacidade: <b>perfil privado</b> e quem pode te mandar mensagem.</li></ul>`},
  {tab:'hoje',ic:'bell',t:'Fique por dentro',h:`<ul><li>O <b>sininho</b> mostra curtidas, comentários, seguidores, mensagens e recordes dos amigos.</li><li>A <b>engrenagem ⚙</b> abre as Configurações: notificações, tema, música, privacidade e mais.</li><li>O <b>☰</b> recolhe a barra de baixo.</li></ul>`},
  {tab:'hoje',ic:'go',t:'Tudo pronto!',h:`<p>Seus dados ficam salvos na sua conta, em qualquer aparelho. Para rever este tutorial: <b>⚙ Configurações → Ajuda</b>.</p><p>Bora configurar suas metas e começar?</p>`,last:true}]}
/* ---------- novidades de cada versão (para quem já usa o app) ----------
   Ao lançar mudança visível: troque NEWS_V e os passos de newsSteps(), e atualize tourSteps(). */
const NEWS_V='2.4.1';
const NEWS_ORDER=['2.2','2.2.1','2.3','2.4','2.4.1'];
/* passos de cada versão; quem pulou versões vê tudo o que perdeu */
function newsByVer(v){
  if(v==='2.2')return news22().slice(1);
  if(v==='2.2.1')return[{tab:'dieta',ic:'photo',t:'Foto do prato na hora',h:`<p>No <b>+</b> da refeição → <b>Foto</b>: agora dá para <b>tirar a foto na hora</b> com a câmera, além de escolher da galeria. A IA identifica os alimentos e as porções.</p>`}];
  if(v==='2.3')return[{tab:'social',ic:'chat',t:'Chat completo',h:`<ul><li>📷 <b>Fotos</b>: toque na câmera dentro da caixa de mensagem (tira na hora ou escolhe da galeria).</li><li>🎤 <b>Áudio</b>: <b>segure</b> o microfone, fale e solte. Arraste para a esquerda para cancelar.</li><li>😊 <b>Emojis</b>: toque na carinha para abrir o painel, com os seus mais usados. Mandou só emoji? Ele aparece <b>grande</b>.</li><li>✍️ Veja quando a pessoa está <b>digitando…</b></li><li><b>Segure</b> uma mensagem para reagir, responder ou apagar.</li></ul>`}];
  if(v==='2.4')return[{tab:'treino',ic:'evolucao',t:'Relatório do treino',h:`<ul><li>Ao <b>finalizar</b> o treino aparece o <b>relatório</b>: 🔥 <b>calorias gastas</b>, duração, volume e intensidade.</li><li>Compara com o <b>último treino igual</b>: volume, séries, tempo e a força em cada exercício (▲ subiu, ▼ caiu).</li><li>Mostra os <b>músculos trabalhados</b>, recordes, XP e a sua <b>semana</b>.</li><li>No <b>Hoje</b>, o card de calorias mostra quanto você gastou treinando. Treinos antigos: toque no treino → <b>Ver relatório</b>.</li></ul>`}];
  if(v==='2.4.1')return[{tab:'treino',ic:'go',t:'Cronômetro no treino',h:`<ul><li>Exercícios por tempo (prancha, pular corda, esteira…) ganharam o botão <b>⏱</b> em cada série: toque e a contagem regressiva começa na tela.</li><li>Dá para <b>pausar</b>, <b>±15 s</b> ou <b>parar e salvar</b>. No fim apita, vibra e marca a série sozinho.</li><li>A coluna <b>KM</b> agora só aparece em cardio de distância (corrida, caminhada, esteira, bike…). O resto é só minutos.</li></ul>`}];
  return[]}
function newsSteps(){let seen='';try{seen=localStorage.getItem('athos.news')||''}catch(e){}if(S.profile.newsV)seen=S.profile.newsV;
  const from=NEWS_ORDER.indexOf(seen)+1;const vs=NEWS_ORDER.slice(from);
  const steps=vs.flatMap(newsByVer);
  const intro={ic:'star',t:vs.length===1?'Novidade do ATHOS '+vs[0]:'Novidades do ATHOS',h:`<p>${steps.length>2?'Separei em 1 minuto o que mudou. Bora?':'Uma melhoria rápida para você.'}</p>`};
  return[intro,...steps.map((x,k)=>({...x,last:k===steps.length-1}))]}
function news22(){return[
  {ic:'star',t:'Novidades do ATHOS',h:`<p>Separei em 1 minuto o que mudou. Bora?</p>`},
  {tab:'social',ic:'chat',t:'Chat novo',h:`<ul><li>Visual novo, com <b>dia</b> e <b>hora</b> de cada mensagem e <b>Visto ✓✓</b>.</li><li>Toque numa mensagem para <b>reagir</b> (❤️🔥💪), <b>responder</b>, copiar ou <b>apagar</b>. Dois toques = ❤️.</li><li>O <b>+</b> manda seu último treino ou corrida no chat.</li><li>No <b>⋮</b>: silenciar, ver perfil, denunciar ou bloquear.</li></ul>`},
  {tab:'social',ic:'social',t:'Clubes de verdade',h:`<ul><li>Clubes com <b>ícone</b>, <b>cor</b>, tipo e cidade.</li><li>Dentro do clube: <b>Mural</b> com os treinos da galera, <b>Ranking</b>, <b>Membros</b> e <b>Meta da semana</b> em km.</li><li>Para entrar, você <b>pede</b> e o criador <b>aceita</b>. Quem cria pode fixar um <b>aviso</b> e escrever as <b>regras</b>.</li></ul>`},
  {tab:'social',ic:'lock',t:'Sua privacidade',h:`<ul><li>Em <b>⚙ → Privacidade</b>: <b>perfil privado</b> (você aprova quem segue) e <b>quem pode te mandar mensagem</b>.</li><li>Seu perfil só aparece para quem tem ligação com você ou procura seu nome ou ID.</li><li><b>Termos de uso</b> e <b>Política de privacidade</b> ficam em ⚙ → Ajuda.</li></ul>`},
  {tab:'evolucao',ic:'photo',t:'Fotos de evolução na nuvem',h:`<ul><li>As fotos de antes e depois agora ficam também numa <b>pasta privada da sua conta</b>: trocou de celular, elas voltam.</li><li>A nuvem guarda até <b>20</b>. Ao chegar em 20, as 10 mais antigas saem de lá (continuam no celular).</li><li>Se ficar <b>30 dias</b> sem abrir o app, as da nuvem são apagadas. Avisamos antes.</li></ul>`},
  {tab:'perfil',ic:'target',t:'Desafios mais justos',h:`<p>Agora o servidor confere o <b>XP</b>, os <b>km</b> e as <b>medalhas</b>. Ninguém consegue trapacear no ranking.</p>`,last:true}]}
const TOUR={i:0,steps:null,news:false};
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
   <button class="btn primary next" data-t="next">${s.last?(TOUR.news?'Entendi!':'Configurar metas'):TOUR.i?'Próximo':'Começar'}</button></div></div>`;
  el.querySelector('.next').focus()}
function tourStart(){TOUR.news=false;TOUR.steps=tourSteps();TOUR.i=0;tourDraw()}
function newsStart(){TOUR.news=true;TOUR.steps=newsSteps();TOUR.i=0;tourDraw()}
function newsMark(){S.profile.newsV=NEWS_V;try{store.mark('profile')}catch(e){}try{localStorage.setItem('athos.news',NEWS_V)}catch(e){}}
function tourEnd(goSetup){const el=$('#tour');if(el)el.remove();document.body.classList.remove('touring');document.querySelectorAll('.tab.spot').forEach(t=>t.classList.remove('spot'));
  newsMark();if(TOUR.news){TOUR.news=false;go('hoje');return}
  S.profile.tourDone=true;S.profile.tourV=2;store.mark('profile');try{localStorage.setItem('athos.tour','2')}catch(e){}
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
  let seen=false;try{seen=localStorage.getItem('athos.tour')==='2'}catch(e){}
  if(!seen&&S.profile.tourV!==2&&!sheets.length&&!S.active)tourStart();
  else newsTick=setInterval(newsCheck,1500);
},1000);
/* quem já usava o app vê só as novidades da versão nova, uma vez */
let newsTick=null;
function newsCheck(){if($('#tour')||sheets.length||S.active)return;const gate=$('#authGate');if(gate&&!gate.hidden)return;
  let seen='';try{seen=localStorage.getItem('athos.news')||''}catch(e){}
  clearInterval(newsTick);newsTick=null;
  if(seen!==NEWS_V&&S.profile.newsV!==NEWS_V)newsStart()}
/* botão para rever no Perfil */
/* o botão aparece em Configurações */
ACT.tourAgain=()=>tourStart();
ACT.newsAgain=()=>newsStart();
