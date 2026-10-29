/* ---------- Fotos de evolução na nuvem ----------
   Pasta privada "progresso" (só o dono vê). Até 20 fotos por conta: ao chegar em 20,
   as 10 mais antigas saem da nuvem (continuam no aparelho onde estão).
   Quem fica 30 dias sem abrir o app perde as fotos da nuvem (limpeza diária no servidor). */
const PPC={busy:false,again:false,n:null,touched:0};
const PPC_MAX=20,PPC_DROP=10;
function ppcOn(){return!!(typeof SOC!=='undefined'&&SOC&&SOC.sb&&SOC.user)}
function ppcPath(id){return SOC.user.id+'/'+id+'.jpg'}
function ppcNote(empty){if(!ppcOn())return'As fotos ficam só neste aparelho.';
  const n=PPC.n==null?'':` (${PPC.n} de ${PPC_MAX})`;
  return empty?`Ficam neste aparelho e numa pasta privada da sua conta, que só você vê. A nuvem guarda até ${PPC_MAX} fotos: ao chegar em ${PPC_MAX}, as ${PPC_DROP} mais antigas saem da nuvem, mas continuam neste aparelho. Se ficar 30 dias sem abrir o ATHOS, as fotos da nuvem são apagadas.`
    :`Só você vê. ☁ na nuvem${n}; ao chegar em ${PPC_MAX}, as ${PPC_DROP} mais antigas saem da nuvem. 30 dias sem abrir o app apaga as da nuvem.`}
function ppcBlob(d){const b=atob(d.split(',')[1]);const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return new Blob([a],{type:'image/jpeg'})}
function ppcData(bl){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(bl)})}
function ppcTell(n){PPC.n=n;try{NATIVE&&NATIVE.ppCloud&&NATIVE.ppCloud(n)}catch(e){}}
async function ppcTouch(force){if(!ppcOn())return;const now=Date.now();if(!force&&now-PPC.touched<3600e3)return;PPC.touched=now;try{await SOC.sb.rpc('touch_active')}catch(e){}}
async function ppcRows(){const r=await SOC.sb.from('progress_photos').select('id,taken,created_at').eq('user_id',SOC.user.id).order('created_at',{ascending:true});if(r.error)throw r.error;return r.data||[]}
async function ppcUpload(it){const data=await ppGet(it.id);if(!data)return false;
  const up=await SOC.sb.storage.from('progresso').upload(ppcPath(it.id),ppcBlob(data),{contentType:'image/jpeg',upsert:false});
  if(up.error&&!/exist|duplicate/i.test(up.error.message||''))throw up.error;
  const ins=await SOC.sb.from('progress_photos').insert({user_id:SOC.user.id,id:it.id,taken:it.date});
  if(ins.error&&!/duplicate|23505/i.test((ins.error.message||'')+(ins.error.code||''))){await SOC.sb.storage.from('progresso').remove([ppcPath(it.id)]).catch(()=>{});throw ins.error}
  it.c=1;return true}
/* chegou em 20: as 10 mais antigas saem da nuvem */
async function ppcRotate(rows){if(rows.length<PPC_MAX)return rows;const old=rows.slice(0,PPC_DROP),ids=old.map(x=>x.id);
  const rm=await SOC.sb.storage.from('progresso').remove(ids.map(ppcPath));if(rm.error)throw rm.error;
  const del=await SOC.sb.from('progress_photos').delete().eq('user_id',SOC.user.id).in('id',ids);if(del.error)throw del.error;
  ppIdx().forEach(it=>{if(ids.includes(it.id))it.c=-1});ppSaveIdx();
  toast(`Sua nuvem chegou a ${PPC_MAX} fotos: as ${PPC_DROP} mais antigas saíram da nuvem (continuam neste aparelho).`);
  return rows.slice(PPC_DROP)}
async function ppcSync(loud){if(!ppcOn())return;if(PPC.busy){PPC.again=true;return}PPC.busy=true;
  try{ppcTouch();let rows=await ppcRows();const L=ppIdx();let ch=false;
    /* baixa as da nuvem que não estão neste aparelho (celular novo, por exemplo) */
    for(const r of rows){const it=L.find(z=>z.id===r.id);if(it){if(it.c!==1){it.c=1;ch=true}continue}
      const d=await SOC.sb.storage.from('progresso').download(ppcPath(r.id));if(d.error||!d.data)continue;
      await ppPut(r.id,await ppcData(d.data));L.push({id:r.id,date:r.taken,c:1,u:SOC.user.id});ch=true}
    /* as que estavam na nuvem e sumiram de lá (outro aparelho girou ou a limpeza dos 30 dias) */
    for(const it of L)if(it.c===1&&!rows.find(r=>r.id===it.id)){it.c=-1;ch=true}
    /* envia as novas, da mais antiga para a mais nova */
    const pend=L.filter(it=>!it.c).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
    for(const it of pend){rows=await ppcRotate(rows);if(await ppcUpload(it)){rows.push({id:it.id,taken:it.date});ch=true}}
    rows=await ppcRotate(rows);
    if(ch)ppSaveIdx();ppcTell(rows.length);
    if(loud&&pend.length)toast('Foto guardada na sua nuvem privada');
    if(S.tab==='evolucao'&&!sheets.length)render()}
  catch(e){if(loud)toast('A foto ficou no aparelho. Envio para a nuvem quando a internet voltar.')}
  finally{PPC.busy=false;if(PPC.again){PPC.again=false;setTimeout(()=>ppcSync(),500)}}}
/* apagar a foto também apaga da nuvem */
{const _del=ppDel;ppDel=async function(id){await _del(id);if(!ppcOn())return;try{await SOC.sb.storage.from('progresso').remove([ppcPath(id)]);await SOC.sb.from('progress_photos').delete().eq('user_id',SOC.user.id).eq('id',id);ppcSync()}catch(e){}}}
/* quando entra na conta e quando volta para o app */
{let last=null;setInterval(()=>{const u=ppcOn()?SOC.user.id:null;if(u!==last){last=u;PP.list=null;if(u){ppcTouch(true);ppcSync()}}},3000)}
{const _r=window.androidResume;window.androidResume=function(){try{_r&&_r()}catch(e){}ppcTouch()}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')ppcTouch()});
