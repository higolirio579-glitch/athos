/* ---------- Privacidade: perfil privado, pedidos para seguir, mensagens, termos ---------- */
const LEGAL_V='2026-10';
const LEGAL_EMAIL='athos.app01@gmail.com';
const LEGAL_DATE='29 de outubro de 2026';
function legalContact(){return LEGAL_EMAIL?`pelo e-mail <b>${esc(LEGAL_EMAIL)}</b>`:'pelo botão “Denunciar” no app ou pelo contato informado na página do ATHOS'}
function legalHtml(k){
  if(k==='termos')return`<h2>Termos de uso do ATHOS</h2><p class="small muted">Atualizado em ${LEGAL_DATE}</p>
<h3>1. O que é o ATHOS</h3><p>O ATHOS é um aplicativo gratuito para registrar treinos, dieta, corridas e acompanhar a evolução, com uma rede social para treinar junto com amigos. Ele é mantido por Higo Lirio, pessoa física, no Brasil.</p>
<h3>2. Quem pode usar</h3><p>É preciso ter <b>13 anos ou mais</b>. Quem tem menos de 18 anos só pode usar com autorização dos pais ou responsáveis. Cada pessoa pode ter uma conta, com dados verdadeiros.</p>
<h3>3. Não é orientação médica</h3><p>Calorias, macros, sugestões de carga, planos e respostas da inteligência artificial são <b>estimativas</b> e não substituem médico, nutricionista ou educador físico. Antes de começar dieta ou treino intenso, procure um profissional. Você treina por sua conta e risco.</p>
<h3>4. Regras da rede social</h3><p>Não é permitido: ofender, ameaçar ou assediar; publicar conteúdo sexual, violento, discriminatório ou ilegal; fingir ser outra pessoa; fazer spam ou propaganda; publicar foto ou dado de outra pessoa sem autorização; trapacear em desafios e rankings. Você é responsável pelo que publica.</p>
<h3>5. Moderação</h3><p>Você pode bloquear e denunciar pessoas e posts. O ATHOS pode remover conteúdo, zerar pontos obtidos com trapaça e suspender ou excluir contas que desrespeitem estas regras.</p>
<h3>6. Seu conteúdo</h3><p>Os treinos, fotos e textos continuam sendo seus. Ao publicar, você permite que o ATHOS os mostre para as pessoas que você escolheu (público, seguidores ou só você).</p>
<h3>7. O serviço</h3><p>O ATHOS é oferecido gratuitamente, do jeito que está, e pode ter falhas, ficar fora do ar ou mudar de funções. Recomendamos manter o app atualizado. Funções pagas, se existirem no futuro, serão avisadas antes e serão opcionais.</p>
<h3>8. Encerrar a conta</h3><p>Você pode excluir sua conta quando quiser, em Configurações → Conta. Isso apaga seus dados do servidor, como explicado na Política de privacidade.</p>
<h3>9. Mudanças e lei</h3><p>Se estes termos mudarem, avisaremos no app. Valem as leis do Brasil. Dúvidas: ${legalContact()}.</p>`;
  return`<h2>Política de privacidade do ATHOS</h2><p class="small muted">Atualizado em ${LEGAL_DATE} · Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018)</p>
<h3>Quem cuida dos seus dados</h3><p>Higo Lirio, responsável pelo ATHOS. Contato ${legalContact()}.</p>
<h3>Quais dados guardamos</h3><p><b>Conta:</b> nome, e-mail e senha (a senha é guardada de forma cifrada; ninguém consegue lê-la).<br><b>Perfil:</b> foto, cidade, bio, ID de 7 números, nível e medalhas.<br><b>Saúde e corpo:</b> treinos, cargas, refeições, água, peso, medidas e fotos de evolução. São dados sensíveis, guardados só com o seu consentimento.<br><b>Atividades:</b> corridas, caminhadas e pedais com distância, tempo, passos e o trajeto do GPS (a localização só é usada enquanto você grava uma atividade).<br><b>Rede social:</b> posts, curtidas, comentários, mensagens, quem você segue, clubes, desafios, denúncias e bloqueios.<br><b>Uso:</b> quando você abriu o app pela última vez, status online (pode ser escondido) e quantas vezes usou a IA no dia.</p>
<h3>Para que usamos</h3><p>Para o app funcionar: guardar e sincronizar seus registros, mostrar sua evolução, fazer a rede social, os rankings e as notificações. <b>Não vendemos seus dados e não mostramos anúncios.</b></p>
<h3>Quem vê o quê</h3><p>Treinos, dieta, peso, medidas e fotos de evolução são <b>só seus</b>. Posts aparecem para quem você escolher em cada um. Com o perfil privado, só quem você aceitar vê seus posts. Seu perfil (nome e foto) aparece para quem procura seu nome ou ID e para quem já tem ligação com você.</p>
<h3>Serviços que ajudam o ATHOS</h3><p><b>Supabase</b>: servidor onde ficam a conta e os dados. <b>Google Gemini e Groq</b>: só quando você usa a inteligência artificial, recebem o texto e as fotos que você mandou para ela responder. <b>Open Food Facts</b>: recebe só o código de barras lido. <b>GitHub</b>: hospeda o site e as atualizações. <b>Gmail</b>: envia os códigos de confirmação. Alguns desses serviços ficam fora do Brasil.</p>
<h3>Por quanto tempo</h3><p>Enquanto sua conta existir. As fotos de evolução guardadas na nuvem ficam numa pasta privada, no máximo 20: ao chegar em 20, as 10 mais antigas saem da nuvem; e são apagadas se você ficar 30 dias sem abrir o app (elas continuam no seu celular). Ao excluir a conta, apagamos perfil, posts, mensagens, registros e fotos do servidor em até 1 dia.</p>
<h3>Seus direitos</h3><p>Você pode ver, corrigir, baixar (backup em Configurações) e apagar seus dados, além de retirar o consentimento excluindo a conta. Para qualquer pedido sobre seus dados, fale ${legalContact()}.</p>
<h3>Segurança</h3><p>Usamos conexão cifrada, regras no servidor para que cada pessoa só acesse o que é dela, e confirmação de e-mail por código. Nenhum sistema é 100% seguro; se acontecer um incidente que afete você, avisaremos.</p>
<h3>Menores de idade</h3><p>O ATHOS é para quem tem 13 anos ou mais. Menores de 18 precisam da autorização dos pais ou responsáveis.</p>`}
function legalOpen(k){document.querySelectorAll('.legalx').forEach(x=>x.remove());
  const w=document.createElement('div');w.className='legalx';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');
  w.innerHTML=`<div class="legalx-in"><button class="icon-btn legalx-c" aria-label="Fechar">✕</button><div class="legalx-b">${legalHtml(k)}</div><button class="btn primary block legalx-ok">Entendi</button></div>`;
  document.body.appendChild(w);const close=()=>w.remove();w.querySelector('.legalx-c').onclick=close;w.querySelector('.legalx-ok').onclick=close;w.onclick=e=>{if(e.target===w)close()}}
document.head.insertAdjacentHTML('beforeend',`<style>
.legalx{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}
.legalx-in{position:relative;background:var(--bg);color:var(--fg);width:100%;max-width:560px;max-height:92%;border-radius:22px 22px 0 0;padding:18px 18px calc(16px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px}
.legalx-b{overflow:auto;flex:1;line-height:1.5;font-size:14.5px}.legalx-b h2{font:800 22px var(--display);text-transform:uppercase;margin:0 36px 2px 0}.legalx-b h3{font:700 16px var(--display);text-transform:uppercase;letter-spacing:.03em;margin:16px 0 4px}.legalx-b p{margin:0 0 6px}
.legalx-c{position:absolute;top:12px;right:12px}
</style>`);
document.addEventListener('click',e=>{const a=e.target.closest('[data-legal]');if(!a)return;e.preventDefault();e.stopPropagation();legalOpen(a.dataset.legal)},true);
document.addEventListener('change',e=>{if(e.target&&e.target.id==='gTerms'){try{localStorage.setItem('athos.termsOk',e.target.checked?LEGAL_V:'')}catch(_){}}});

/* quem já tinha conta aceita os termos uma vez */
let legalAsked=false;
function legalCheck(){if(!SOC||!SOC.user||!S.profile||legalAsked)return;if(S.profile.termsV===LEGAL_V)return;
  let ok='';try{ok=localStorage.getItem('athos.termsOk')||''}catch(e){}
  if(ok===LEGAL_V){S.profile.termsV=LEGAL_V;try{store.mark('profile')}catch(e){}saveLocal();return}
  if(document.querySelector('.legalx')||document.getElementById('legalAsk'))return;
  if(typeof sheets!=='undefined'&&sheets.length)return;
  {const se=document.getElementById('session');if(se&&!se.hidden)return}if(document.querySelector('.tour,#tour,.tourx'))return;
  if(document.getElementById('authGate')&&!document.getElementById('authGate').hidden)return;
  legalAsked=true;
  const el=openSheet('Termos e privacidade',`<div id="legalAsk"><p>O ATHOS agora tem <b>Termos de uso</b> e <b>Política de privacidade</b>, explicando quais dados guardamos e como você controla quem vê o quê.</p>
   <div class="btns"><button class="btn" data-legal="termos">Ler os termos</button><button class="btn" data-legal="privacidade">Ler a privacidade</button></div>
   <label class="check" style="align-items:flex-start;margin-top:6px"><input type="checkbox" id="lgAge"><span>Tenho 13 anos ou mais (se tenho menos de 18, meus pais ou responsáveis autorizaram) e aceito os termos e a política.</span></label>
   <button class="btn primary block" data-s="ok">Continuar</button></div>`,(b,w)=>{
    b.querySelector('[data-s=ok]').onclick=()=>{if(!b.querySelector('#lgAge').checked){toast('Marque a caixa para continuar');return}
      S.profile.termsV=LEGAL_V;try{store.mark('profile')}catch(e){}saveLocal();closeSheet(w);toast('Obrigado!')}})}
setTimeout(()=>setInterval(legalCheck,4000),6000);

/* perfil privado e mensagens */
async function privSet(upd,msg){if(!SOC.user)return;
  try{const r=await sbq(SOC.sb.from('profiles').update(upd).eq('id',SOC.user.id).select());if(r&&r[0]){SOC.me=Object.assign(SOC.me||{},r[0]);SOC.prof[SOC.user.id]=SOC.me}toast(msg)}catch(e){toast(sbErr(e))}
  render()}

/* pedidos para seguir */
async function reqSheet(){if(!SOC.user)return;
  const el=openSheet('Pedidos para seguir',`<div id="rqL">${thinking('Carregando…')}</div>`,async(b,w)=>{
    const box=b.querySelector('#rqL');
    const draw=async()=>{try{const rows=await sbq(SOC.sb.from('follow_requests').select('requester,created_at').eq('target',SOC.user.id).order('created_at',{ascending:false}));
        SOC.reqIn=rows.length;await loadProfiles(rows.map(r=>r.requester));
        box.innerHTML=rows.length?rows.map(r=>{const p=SOC.prof[r.requester]||{id:r.requester,name:'Atleta'};return`<div class="li" style="gap:10px"><button class="row" data-act="socProfile" data-id="${p.id}" style="border:0;background:none;padding:0;flex:1;min-width:0;flex-wrap:nowrap;text-align:left">${avatar(p,'sm')}<span class="t"><b>${esc(p.name||'Atleta')}</b><small>${p.public_id?'ID '+esc(fmtId(p.public_id))+' · ':''}${ago(r.created_at)}</small></span></button><button class="btn sm primary" data-ok="${r.requester}">Aceitar</button><button class="btn sm" data-no="${r.requester}">Recusar</button></div>`}).join('')
          :`<div class="empty"><b>Nenhum pedido</b><span>Quando alguém pedir para seguir seu perfil privado, aparece aqui.</span></div>`}
      catch(e){box.innerHTML=`<p class="hint">${esc(sbErr(e))}</p>`}};
    box.onclick=async e=>{const ok=e.target.closest('[data-ok]'),no=e.target.closest('[data-no]');
      try{if(ok){ok.disabled=true;await sbq(SOC.sb.rpc('approve_follow',{p_requester:ok.dataset.ok}));SOC.followers=(SOC.followers||0)+1;toast('Pedido aceito')}
        else if(no){no.disabled=true;await sbq(SOC.sb.from('follow_requests').delete().eq('requester',no.dataset.no).eq('target',SOC.user.id));toast('Pedido recusado')}
        else return;await draw()}catch(err){toast(sbErr(err))}};
    await draw()})}
Object.assign(ACT,{reqSheet:()=>reqSheet(),legalOpen:el=>legalOpen(el.dataset.k)});
{const _r=window.androidResume;window.androidResume=function(){try{_r&&_r()}catch(e){}legalAsked=false}}
{const _o=window.androidOpen;window.androidOpen=function(o){if(o==='clubes'){const t=()=>{if(SOC&&SOC.user){go('social');SOC.sub='clubes';SOC.clubs=null;loadClubs();render()}else setTimeout(t,800)};t();return}if(o==='pedidos'){const t=()=>{if(SOC&&SOC.user){go('social');reqSheet()}else setTimeout(t,800)};t();return}return _o&&_o(o)}}
