
/* ---------- IA grátis no app Android: Gemini (principal) + Groq (reserva) ---------- */
const AIHOST=!!(NATIVE||window.WEBAPP);
const aiNote=()=>!AIHOST?'Usa um pouco do seu limite de uso do Claude.':(gemOn()||groqOn())?'Usa sua própria chave de IA e precisa de internet.':`Usa 1 dos seus ${SRV_LIMIT} usos de IA de hoje e precisa de internet.`;
const SRV_LIMIT=20;
const srvOn=()=>{try{return!!(SOC.sb&&SOC.user)}catch(e){return false}};
let AI=(AIHOST&&lsGet('ficha.ai'))||{};
const HTTP={};let httpN=0;
window.androidHttpDone=(id,status,text)=>{const r=HTTP[id];if(r){delete HTTP[id];r({status,text})}};
function nativeHttp(url,body,headers){if(!NATIVE)return fetch(url,{method:body==null?'GET':'POST',headers:{...(headers||{}),...(body==null?{}:{'Content-Type':'application/json'})},body:body==null?undefined:JSON.stringify(body)}).then(async r=>({status:r.status,text:await r.text()})).catch(()=>({status:-1,text:''}));return new Promise(res=>{const id='h'+(++httpN);HTTP[id]=res;try{NATIVE.http(id,url,body==null?null:JSON.stringify(body),JSON.stringify(headers||{}))}catch(e){delete HTTP[id];res({status:-1,text:''})}})}
const stripThink=t=>String(t||'').replace(/<think>[\s\S]*?<\/think>/gi,'').trim();

/* ----- Gemini ----- */
const GEM='https://generativelanguage.googleapis.com/v1beta/models';
const gemOn=()=>!!(AI.key&&AI.models&&AI.models.length);
async function gemModels(key){
  const r=await nativeHttp(GEM+'?pageSize=1000',null,{'x-goog-api-key':key});
  if(r.status<0)throw{code:'offline'};
  if([400,401,403].includes(r.status))throw{code:'bad_key'};
  if(r.status!==200)throw{code:'upstream_error'};
  const j=JSON.parse(r.text);
  const ver=n=>{const m=n.match(/gemini-(\d+(?:\.\d+)?)/);return m?parseFloat(m[1]):0};
  return(j.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')).map(m=>String(m.name).replace(/^models\//,''))
    .filter(n=>/^gemini-.*flash/.test(n)&&!/(tts|image|live|audio|embed|exp|native|transcrib|translat|omni|computer)/.test(n))
    .sort((a,b)=>(ver(b)-(/preview/.test(b)?.05:0))-(ver(a)-(/preview/.test(a)?.05:0))).slice(0,8);
}
function gemOrder(quick){const ms=AI.models||[];const lite=ms.filter(m=>/lite/.test(m)),full=ms.filter(m=>!/lite/.test(m));return quick?[...lite,...full]:[...full,...lite]}
async function callGemini(turns,b64s,json,quick){
  const contents=turns.map(t=>({role:t.role==='assistant'?'model':'user',parts:[{text:String(t.content)}]}));
  if(b64s.length){const last=contents[contents.length-1];last.parts=[...b64s.map(d=>({inline_data:{mime_type:'image/jpeg',data:d}})),...last.parts]}
  const body={contents,generationConfig:{temperature:0.4}};if(json)body.generationConfig.responseMimeType='application/json';
  let last={code:'upstream_error'};
  for(const m of gemOrder(quick).slice(0,4)){
    const r=await nativeHttp(`${GEM}/${m}:generateContent`,body,{'x-goog-api-key':AI.key});
    if(r.status===200){let j;try{j=JSON.parse(r.text)}catch(e){throw{code:'upstream_error'}}
      const c=j.candidates&&j.candidates[0];const t=c&&c.content?(c.content.parts||[]).map(p=>p.text||'').join(''):'';
      if(!t.trim()){if((j.promptFeedback&&j.promptFeedback.blockReason)||(c&&c.finishReason==='SAFETY'))throw{code:'refused'};last={code:'empty_completion'};continue}
      AI.used='Gemini · '+m;return t}
    if(r.status<0)throw{code:'offline'};
    if(r.status===401||r.status===403||(r.status===400&&/api[ _-]?key/i.test(r.text)))throw{code:'bad_key'};
    last=r.status===429?{code:'rate_limited'}:{code:'upstream_error'};
    if(![429,404,500,503,504].includes(r.status))break;
  }
  throw last;
}

/* ----- Groq (API compatível com OpenAI) ----- */
const GROQ='https://api.groq.com/openai/v1';
const groqOn=()=>!!(AI.groq&&AI.groq.key&&(AI.groq.text||AI.groq.vision));
const GROQ_VISION=['qwen/qwen3.8-27b','meta-llama/llama-4-scout-17b-16e-instruct','meta-llama/llama-4-maverick-17b-128e-instruct'];
const GROQ_TEXT=['openai/gpt-oss-120b','qwen/qwen3.8-27b','llama-3.3-70b-versatile','openai/gpt-oss-20b'];
const groqHdr=key=>({'Authorization':'Bearer '+key});
async function groqRaw(key,model,messages,json,maxTok,probe){
  const body={model,messages,temperature:0.4,max_completion_tokens:maxTok||4096};if(json)body.response_format={type:'json_object'};
  let r=await nativeHttp(GROQ+'/chat/completions',body,groqHdr(key));
  if(r.status===400&&json&&/response_format|json/i.test(r.text)){delete body.response_format;r=await nativeHttp(GROQ+'/chat/completions',body,groqHdr(key))}
  if(r.status===200){let j;try{j=JSON.parse(r.text)}catch(e){throw{code:'upstream_error'}}const t=stripThink(j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content);if(!t){if(probe)return'ok';throw{code:'empty_completion'}}return t}
  if(r.status<0)throw{code:'offline'};if(r.status===401||r.status===403)throw{code:'bad_key'};if(r.status===429)throw{code:'rate_limited'};
  if(r.status===400&&/image|vision|content type|multimodal/i.test(r.text))throw{code:'images_unavailable'};
  throw{code:'upstream_error',status:r.status};
}
function groqMsgs(turns,b64s){
  return turns.map((t,i)=>{const role=t.role==='assistant'?'assistant':'user';
    if(i===turns.length-1&&b64s.length)return{role,content:[{type:'text',text:String(t.content)},...b64s.map(d=>({type:'image_url',image_url:{url:'data:image/jpeg;base64,'+d}}))]};
    return{role,content:String(t.content)}});
}
async function callGroq(turns,b64s,json){
  const g=AI.groq;const model=b64s.length?g.vision:(g.text||g.vision);if(!model)throw{code:'images_unavailable'};
  if(b64s.length<=3){const t=await groqRaw(g.key,model,groqMsgs(turns,b64s),json);AI.used='Groq · '+model;return t}
  // mais de 3 fotos: lê em partes de 3 e junta as listas
  const parts=[];for(let i=0;i<b64s.length;i+=3)parts.push(b64s.slice(i,i+3));const merged={};
  for(let k=0;k<parts.length;k++){
    const tt=turns.slice();const last=tt[tt.length-1];tt[tt.length-1]={...last,content:`${last.content}\n\n(Você está vendo a parte ${k+1} de ${parts.length} das fotos; responda só com o que aparece nelas.)`};
    const o=parseLoose(await groqRaw(g.key,model,groqMsgs(tt,parts[k]),true));
    for(const[key,v]of Object.entries(o||{})){if(Array.isArray(v))merged[key]=(merged[key]||[]).concat(v);else if(!(key in merged))merged[key]=v}
  }
  AI.used='Groq · '+model;return JSON.stringify(merged);
}
async function groqSetup(key){
  const r=await nativeHttp(GROQ+'/models',null,groqHdr(key));
  if(r.status<0)throw{code:'offline'};if(r.status===401||r.status===403)throw{code:'bad_key'};if(r.status!==200)throw{code:'upstream_error'};
  const ids=new Set(((JSON.parse(r.text).data)||[]).map(m=>m.id));
  const text=GROQ_TEXT.find(m=>ids.has(m))||null;let vision=null;
  if(text)await groqRaw(key,text,[{role:'user',content:'Responda apenas: ok'}],false,800,true);
  const tiny=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#d22';x.fillRect(0,0,64,64);return c.toDataURL('image/jpeg',.8).split(',')[1]})();
  for(const m of GROQ_VISION.filter(m=>ids.has(m))){
    try{await groqRaw(key,m,groqMsgs([{role:'user',content:'Qual é a cor desta imagem? Responda com uma palavra.'}],[tiny]),false,800,true);vision=m;break}
    catch(e){if(e.code==='bad_key'||e.code==='offline')throw e}
  }
  if(!text&&!vision)throw{code:'no_models'};
  return{key,text,vision,checked:Date.now()};
}

/* ----- IA do ATHOS (servidor, sem chave) ----- */
async function callServer(turns,b64s,json,quick){
  let res;try{res=await SOC.sb.functions.invoke('ai',{body:{turns,images:b64s,json:!!json,quick:!!quick}})}catch(e){throw{code:'offline'}}
  const{data,error}=res;
  if(error){let code='upstream_error';try{const ctx=error.context;if(ctx&&ctx.json){const j=await ctx.json();code=j.code||code}else if(/fetch|network/i.test(error.message||''))code='offline'}catch(e){}
    if(code==='user_limit'){AI.srvLeft=0;lsSet('ficha.ai',AI)}
    throw{code:code==='not_logged'?'not_granted':code}}
  if(!data||typeof data.text!=='string')throw{code:'upstream_error'};
  AI.srvLeft=data.remaining;AI.srvDay=today();lsSet('ficha.ai',AI);AI.used='IA do ATHOS · '+(data.used||'');return data.text;
}
async function srvRemaining(){try{const r=await sbq(SOC.sb.from('ai_usage').select('n').eq('user_id',SOC.user.id).eq('day',today()));AI.srvLeft=SRV_LIMIT-((r[0]&&r[0].n)||0);AI.srvDay=today();lsSet('ficha.ai',AI);render()}catch(e){}}
/* ----- roteador: chave própria (Gemini, Groq) e depois a IA do ATHOS ----- */
async function imgToB64(file){
  const url=URL.createObjectURL(file);
  try{const img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=url});
    const s=Math.min(1,1280/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*s));c.height=Math.max(1,Math.round(img.naturalHeight*s));
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',0.85).split(',')[1]}
  catch(e){throw{code:'image_rejected'}}finally{URL.revokeObjectURL(url)}
}
async function aiCall(input,opts,json){
  opts=opts||{};
  const turns=typeof input==='string'?[{role:'user',content:input}]:input;
  let imgs=opts.images;imgs=imgs?(imgs instanceof Blob?[imgs]:[...imgs]):[];
  const b64s=[];for(const im of imgs)b64s.push(await imgToB64(im));
  const quick=opts.modelTier==='quick'&&!b64s.length;
  const provs=[];if(gemOn())provs.push('gemini');if(groqOn()&&(!b64s.length||AI.groq.vision))provs.push('groq');if(srvOn())provs.push('server');
  if(!provs.length)throw{code:b64s.length?'images_unavailable':'not_granted'};
  const errs=[];
  for(const p of provs){
    try{return p==='gemini'?await callGemini(turns,b64s,json,quick):p==='groq'?await callGroq(turns,b64s,json):await callServer(turns,b64s,json,quick)}
    catch(e){if(e.code==='offline'||e.code==='refused'||e.code==='image_rejected')throw e;errs.push(e)}
  }
  if(errs.some(e=>e.code==='user_limit')&&errs.every(e=>e.code==='user_limit'||e.code==='rate_limited'))throw{code:'user_limit'};
  if(errs.every(e=>e.code==='rate_limited'))throw{code:'rate_limited'};
  throw errs.find(e=>e.code==='bad_key')||errs[errs.length-1];
}
function parseLoose(t){t=stripThink(t);try{return JSON.parse(t)}catch(e){}const f=t.match(/```(?:json)?\s*([\s\S]*?)```/);if(f){try{return JSON.parse(f[1])}catch(e){}}const a=t.search(/[\[{]/),b=Math.max(t.lastIndexOf('}'),t.lastIndexOf(']'));if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1))}catch(e){}}throw{code:'invalid_json',text:t}}
function aiSample(){const f=async(input,opts)=>({text:await aiCall(input,opts,false),truncated:false});f.json=async(input,opts)=>parseLoose(await aiCall(input,opts,true));f.limits=async()=>({maxPromptBytes:262144,images:{maxCount:6,maxInputBytes:20e6,mediaTypes:['image/jpeg','image/png','image/webp']}});return f}
const aiOn=()=>gemOn()||groqOn()||srvOn();
function aiActivate(){SAMPLE=aiOn()?aiSample():null;SAMPLE_IMG=!!(gemOn()||(groqOn()&&AI.groq.vision)||srvOn());MAXIMG=SAMPLE_IMG?6:1}
function saveAI(){lsSet('ficha.ai',AI);aiActivate();render()}

function aiCard(){
  const g=gemOn(),q=groqOn();
  const chip=(on,txt)=>`<span class="chip ${on?'ok':''}">${on?txt:'Desligada'}</span>`;
  const s=srvOn();if(s&&AI.srvDay!==today())srvRemaining();const left=AI.srvDay===today()&&AI.srvLeft!=null?AI.srvLeft:SRV_LIMIT;
  return`<div class="card"><div class="card-h"><h3>Inteligência artificial</h3>${chip(g||q||s,'Ativa')}</div>
  <p class="hint">Liga a foto do prato, a descrição de refeições, a montagem de treinos, a ficha por fotos e o plano alimentar.</p>
  <div class="picked"><div class="row between"><b>IA do ATHOS</b>${s?`<span class="chip ok">${left} de ${SRV_LIMIT} hoje</span>`:'<span class="chip">Desligada</span>'}</div>
  <p class="small">${s?`Grátis e sem chave: cada pessoa tem ${SRV_LIMIT} usos por dia, que renovam à meia-noite.`:`Entre na aba Social para usar a IA grátis, sem chave (${SRV_LIMIT} usos por dia).`}</p>${s?'':'<button class="btn primary" data-tab="social">Entrar na rede</button>'}</div>
  <details><summary class="small" style="cursor:pointer;font-weight:600">Usar minha própria chave (opcional, para ter mais usos)</summary><div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
  <div class="picked" style="background:var(--surface);border-color:var(--line)"><div class="row between"><b>1. Gemini (Google)</b>${chip(g,'Ativa')}</div>
  ${g?`<p class="small muted">Modelo: ${esc(gemOrder(false)[0])} · lê fotos</p><div class="btns"><button class="btn sm danger" data-act="aiRemove">Remover chave</button></div>`
  :`<p class="small">Crie a chave em <a href="https://aistudio.google.com/apikey" style="color:var(--accent-tx);font-weight:600">aistudio.google.com/apikey</a> (conta Google) e toque em “Create API key”.</p>
  <label class="fld"><span>Chave do Gemini</span><input id="aiKey" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="AIza…"></label><button class="btn primary" data-act="aiSave">Conectar Gemini</button>`}</div>
  <div class="picked" style="background:var(--surface);border-color:var(--line)"><div class="row between"><b>2. Groq (reserva)</b>${chip(q,AI.groq&&AI.groq.vision?'Ativa · lê fotos':'Ativa · só texto')}</div>
  ${q?`<p class="small muted">${AI.groq.vision?'Fotos: '+esc(AI.groq.vision)+' (até 3 por vez; mais fotos são lidas em partes)':'Este modelo não leu a foto de teste: fotos ficam só com o Gemini.'}${AI.groq.text?'<br>Texto: '+esc(AI.groq.text):''}</p><div class="btns"><button class="btn sm danger" data-act="groqRemove">Remover chave</button></div>`
  :`<p class="small">Crie a chave em <a href="https://console.groq.com/keys" style="color:var(--accent-tx);font-weight:600">console.groq.com/keys</a> (entre com Google ou e-mail) e toque em “Create API Key”.</p>
  <label class="fld"><span>Chave do Groq</span><input id="groqKey" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="gsk_…"></label><button class="btn primary" data-act="groqSave">Conectar Groq</button>`}</div>
  ${g||q?'<button class="btn" data-act="aiTest">Testar minha chave</button>':''}</div></details>
  <p class="hint">Nos planos grátis, cada serviço limita os pedidos por dia, e o Google pode usar o que você envia para melhorar os produtos dele. As chaves ficam guardadas só neste aparelho e não vão no backup.</p></div>`;
}
Object.assign(ACT,{
  aiSave:async el=>{const key=($('#aiKey').value||'').trim();if(key.length<20){toast('Cole a chave completa do Gemini');return}
    el.disabled=true;el.textContent='Conectando…';
    try{const models=await gemModels(key);if(!models.length){toast('Essa chave não tem nenhum modelo grátis disponível.');el.disabled=false;el.textContent='Conectar Gemini';return}
      AI.key=key;AI.models=models;AI.checked=Date.now();saveAI();toast('Gemini conectado')}
    catch(e){toast(aiMsg(e)||'Não consegui conectar.');el.disabled=false;el.textContent='Conectar Gemini'}},
  aiRemove:()=>confirmSheet('Remover a chave do Gemini deste celular?','Remover',()=>{delete AI.key;delete AI.models;saveAI()}),
  groqSave:async el=>{const key=($('#groqKey').value||'').trim();if(key.length<20){toast('Cole a chave completa do Groq');return}
    el.disabled=true;el.textContent='Conectando e testando foto…';
    try{AI.groq=await groqSetup(key);saveAI();toast(AI.groq.vision?'Groq conectado: lê fotos':'Groq conectado (só texto)')}
    catch(e){toast(e.code==='no_models'?'Nenhum modelo do Groq respondeu com essa chave.':(aiMsg(e)||'Não consegui conectar.'));el.disabled=false;el.textContent='Conectar Groq'}},
  groqRemove:()=>confirmSheet('Remover a chave do Groq deste celular?','Remover',()=>{delete AI.groq;saveAI()}),
  aiTest:async el=>{el.disabled=true;el.textContent='Testando…';const res=[];
    if(gemOn()){try{const ms=await gemModels(AI.key);if(ms.length){AI.models=ms;AI.checked=Date.now()}await callGemini([{role:'user',content:'Responda apenas: ok'}],[],false,true);res.push('Gemini ok')}catch(e){res.push('Gemini: '+(e.code==='rate_limited'?'limite do dia atingido':e.code==='bad_key'?'chave inválida':'falhou'))}}
    if(groqOn()){try{await groqRaw(AI.groq.key,AI.groq.text||AI.groq.vision,[{role:'user',content:'Responda apenas: ok'}],false,800,true);res.push('Groq ok')}catch(e){res.push('Groq: '+(e.code==='rate_limited'?'limite atingido':e.code==='bad_key'?'chave inválida':'falhou'))}}
    lsSet('ficha.ai',AI);toast(res.join(' · ')||'Nenhuma IA conectada');render()}
});
if(AIHOST){aiActivate();if(gemOn()&&Date.now()-(AI.checked||0)>7*864e5)gemModels(AI.key).then(ms=>{if(ms.length){AI.models=ms;AI.checked=Date.now();lsSet('ficha.ai',AI)}}).catch(()=>{})}
