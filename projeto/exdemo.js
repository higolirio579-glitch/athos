/* ---------- demonstração dos exercícios (imagens: Free Exercise DB, domínio público) ---------- */
const EXDEMO_BASE='https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';
const EXDEMO={
'Supino reto (barra)':['Barbell_Bench_Press_-_Medium_Grip',['Escápulas juntas e para baixo, pés firmes no chão.','Desça a barra até a linha do peito, cotovelos a uns 45° do corpo.','Empurre sem tirar o quadril do banco.']],
'Supino reto (halteres)':['Dumbbell_Bench_Press',['Comece com os halteres na altura do peito.','Empurre para cima aproximando os halteres no topo.','Desça devagar, controlando o peso.']],
'Supino inclinado (barra)':['Barbell_Incline_Bench_Press_-_Medium_Grip',['Banco entre 30° e 45°.','Desça a barra na parte de cima do peito.','Mantenha as escápulas presas no banco.']],
'Supino inclinado (halteres)':['Incline_Dumbbell_Press',['Banco entre 30° e 45°.','Desça até sentir o alongamento no peito.','Suba sem bater um halter no outro.']],
'Supino declinado':['Decline_Barbell_Bench_Press',['Prenda bem as pernas no apoio.','Desça a barra na parte de baixo do peito.','Peça ajuda para tirar e devolver a barra.']],
'Crucifixo (halteres)':['Dumbbell_Flyes',['Cotovelos levemente dobrados o tempo todo.','Abra os braços até sentir o peito alongar.','Feche como se abraçasse uma árvore.']],
'Crossover':['Cable_Crossover',['Um pé à frente e tronco levemente inclinado.','Puxe as alças em arco até se encontrarem na frente.','Volte devagar, sem deixar o peso bater.']],
'Peck deck (voador)':['Butterfly',['Ajuste o banco para as mãos ficarem na altura do peito.','Feche apertando o peito, sem usar os ombros.','Volte controlando até sentir o alongamento.']],
'Flexão de braço':['Pushups',['Corpo reto da cabeça aos pés, abdômen firme.','Mãos um pouco mais abertas que os ombros.','Desça até o peito quase tocar o chão.']],
'Puxada frontal':['Wide-Grip_Lat_Pulldown',['Peito para cima e leve inclinação para trás.','Puxe a barra até a parte de cima do peito.','Leve os cotovelos para baixo e para trás.']],
'Barra fixa':['Pullups',['Comece com os braços estendidos.','Puxe até o queixo passar da barra.','Evite balançar o corpo.']],
'Remada curvada (barra)':['Bent_Over_Barbell_Row',['Tronco inclinado à frente, costas retas.','Puxe a barra em direção ao umbigo.','Aperte as escápulas no topo.']],
'Remada baixa':['Seated_Cable_Rows',['Costas retas e joelhos levemente dobrados.','Puxe o triângulo até a barriga.','Não balance o tronco para ajudar.']],
'Remada unilateral (halter)':['One-Arm_Dumbbell_Row',['Apoie joelho e mão no banco, costas retas.','Puxe o halter em direção ao quadril.','Desça até esticar o braço.']],
'Remada cavalinho':['T-Bar_Row_with_Handle',['Joelhos dobrados e costas retas.','Puxe a pegada até encostar no peito.','Aperte as costas no topo.']],
'Pulldown (corda)':['Rope_Straight-Arm_Pulldown',['Braços quase estendidos o tempo todo.','Leve a corda até as coxas em arco.','Sinta o trabalho nas costas, não nos braços.']],
'Levantamento terra':['Barbell_Deadlift',['Barra perto da canela, costas retas.','Suba empurrando o chão com as pernas.','Mantenha a barra colada ao corpo.']],
'Hiperextensão lombar':['Hyperextensions_Back_Extensions',['Apoie o quadril na almofada.','Desça com as costas retas.','Suba até alinhar o tronco com as pernas, sem passar.']],
'Agachamento livre':['Barbell_Full_Squat',['Pés na largura dos ombros, pontas levemente para fora.','Desça como se fosse sentar, joelhos na direção dos pés.','Peito para cima e calcanhares no chão.']],
'Leg press 45°':['Leg_Press',['Costas e quadril colados no encosto.','Desça até os joelhos formarem uns 90°.','Não trave os joelhos no topo.']],
'Agachamento hack':['Hack_Squat',['Costas apoiadas e pés à frente na plataforma.','Desça controlando até uns 90°.','Suba empurrando com o pé inteiro.']],
'Cadeira extensora':['Leg_Extensions',['Ajuste o rolo logo acima do tornozelo.','Estique as pernas e segure 1 segundo no topo.','Desça devagar.']],
'Mesa flexora':['Lying_Leg_Curls',['Quadril colado no banco.','Traga o rolo em direção ao glúteo.','Volte controlando, sem deixar cair.']],
'Cadeira flexora':['Seated_Leg_Curl',['Ajuste o apoio em cima das coxas.','Puxe o rolo para baixo e para trás.','Volte devagar.']],
'Stiff':['Stiff-Legged_Barbell_Deadlift',['Joelhos levemente dobrados e fixos.','Desça a barra rente às pernas levando o quadril para trás.','Sinta o alongamento atrás da coxa.']],
'Afundo (passada)':['Dumbbell_Lunges',['Dê um passo largo à frente.','Desça até o joelho de trás quase tocar o chão.','Tronco reto e joelho da frente alinhado com o pé.']],
'Agachamento búlgaro':['Split_Squat_with_Dumbbells',['Pé de trás apoiado em um banco.','Desça na vertical com o tronco firme.','Empurre com o calcanhar da perna da frente.']],
'Cadeira adutora':['Thigh_Adductor',['Costas apoiadas no encosto.','Feche as pernas apertando a parte interna da coxa.','Abra devagar.']],
'Panturrilha em pé':['Standing_Calf_Raises',['Pontas dos pés na plataforma.','Suba o máximo possível e segure 1 segundo.','Desça até alongar bem.']],
'Panturrilha sentado':['Seated_Calf_Raise',['Apoio em cima dos joelhos.','Suba na ponta dos pés.','Desça devagar até alongar.']],
'Elevação pélvica':['Barbell_Hip_Thrust',['Costas apoiadas no banco, barra no quadril.','Suba o quadril até alinhar com o tronco.','Aperte o glúteo no topo.']],
'Cadeira abdutora':['Thigh_Abductor',['Costas apoiadas e quadril no fundo do banco.','Abra as pernas com força no glúteo.','Feche controlando.']],
'Glúteo na polia':['One-Legged_Cable_Kickback',['Tornozeleira presa na polia baixa.','Leve a perna para trás sem arquear a lombar.','Aperte o glúteo no fim do movimento.']],
'Desenvolvimento (halteres)':['Dumbbell_Shoulder_Press',['Halteres na altura das orelhas.','Empurre para cima sem bater um no outro.','Abdômen firme, sem arquear as costas.']],
'Desenvolvimento militar (barra)':['Standing_Military_Press',['Barra na altura do queixo.','Empurre para cima passando perto do rosto.','Glúteo e abdômen contraídos.']],
'Elevação lateral':['Side_Lateral_Raise',['Cotovelos levemente dobrados.','Suba os braços até a altura dos ombros.','Desça devagar, sem balançar.']],
'Elevação frontal':['Front_Dumbbell_Raise',['Suba o halter à frente até a altura dos ombros.','Tronco parado, sem usar impulso.','Desça controlando.']],
'Crucifixo invertido':['Reverse_Flyes',['Tronco inclinado à frente, costas retas.','Abra os braços para os lados.','Aperte a parte de trás dos ombros.']],
'Face pull':['Face_Pull',['Corda na altura do rosto.','Puxe em direção aos olhos abrindo os cotovelos.','Aperte as escápulas no fim.']],
'Encolhimento':['Barbell_Shrug',['Braços estendidos segurando o peso.','Suba os ombros em direção às orelhas.','Segure 1 segundo e desça. Não gire os ombros.']],
'Rosca direta (barra)':['Barbell_Curl',['Cotovelos colados ao corpo.','Suba a barra sem balançar o tronco.','Desça até esticar os braços.']],
'Rosca alternada':['Dumbbell_Alternate_Bicep_Curl',['Um braço de cada vez.','Gire a palma para cima enquanto sobe.','Cotovelo parado ao lado do corpo.']],
'Rosca martelo':['Hammer_Curls',['Palmas viradas uma para a outra.','Suba sem mexer os cotovelos.','Desça controlando.']],
'Rosca Scott':['Preacher_Curl',['Braços apoiados no banco Scott.','Suba até contrair o bíceps.','Desça devagar, sem esticar com tranco.']],
'Rosca na polia':['Standing_Biceps_Cable_Curl',['Cotovelos fixos ao lado do corpo.','Suba a barra até o peito.','Volte devagar mantendo a tensão.']],
'Rosca concentrada':['Concentration_Curls',['Cotovelo apoiado na parte interna da coxa.','Suba o halter em direção ao ombro.','Desça até esticar o braço.']],
'Tríceps pulley (barra)':['Triceps_Pushdown',['Cotovelos colados ao corpo.','Empurre a barra até esticar os braços.','Volte só até a altura do peito.']],
'Tríceps corda':['Triceps_Pushdown_-_Rope_Attachment',['Cotovelos fixos ao lado do corpo.','Empurre e abra a corda no final.','Volte devagar.']],
'Tríceps testa':['EZ-Bar_Skullcrusher',['Deitado, braços apontando para o teto.','Dobre só os cotovelos levando a barra até a testa.','Estique de volta sem abrir os cotovelos.']],
'Tríceps francês':['Standing_Dumbbell_Triceps_Extension',['Halter atrás da cabeça com as duas mãos.','Estique os braços para cima.','Cotovelos apontados para frente, perto da cabeça.']],
'Mergulho (paralelas)':['Dips_-_Triceps_Version',['Tronco reto para focar no tríceps.','Desça até os cotovelos formarem 90°.','Suba estendendo os braços.']],
'Tríceps coice':['Tricep_Dumbbell_Kickback',['Tronco inclinado, braço paralelo ao chão.','Estique o cotovelo para trás.','Só o antebraço se mexe.']],
'Abdominal supra':['Crunches',['Joelhos dobrados e pés no chão.','Suba tirando só as escápulas do chão.','Não puxe a cabeça com as mãos.']],
'Abdominal infra':['Reverse_Crunch',['Deitado, joelhos dobrados no alto.','Leve os joelhos em direção ao peito tirando o quadril do chão.','Desça devagar.']],
'Abdominal na polia':['Cable_Crunch',['Ajoelhado, corda ao lado da cabeça.','Enrole o tronco levando os cotovelos aos joelhos.','O quadril fica parado.']],
'Elevação de pernas':['Hanging_Leg_Raise',['Pendurado na barra, sem balançar.','Suba as pernas até a altura do quadril ou mais.','Desça controlando.']],
'Prancha':['Plank',['Antebraços no chão, cotovelos abaixo dos ombros.','Corpo reto, sem subir nem baixar o quadril.','Respire e mantenha o abdômen firme.']],
'Esteira':['Running_Treadmill',['Comece devagar por 3 a 5 minutos.','Passos naturais, sem segurar no apoio.','Use a inclinação para aumentar a intensidade.']],
'Bicicleta ergométrica':['Bicycling_Stationary',['Banco na altura do quadril.','Joelho quase estendido com o pedal embaixo.','Mantenha um ritmo constante.']],
'Escada':['Stairmaster',['Corpo ereto, sem se apoiar demais.','Pise com o pé inteiro no degrau.','Comece em ritmo leve.']],
'Elíptico':['Elliptical_Trainer',['Postura reta e olhar à frente.','Empurre e puxe os braços junto com as pernas.','Varie a resistência.']],
'Corrida na rua':['Trail_Running_Walking',['Aqueça caminhando 5 minutos.','Passadas curtas, pisando embaixo do corpo.','Use a gravação com GPS da aba Treino.']],
'Pular corda':['Rope_Jumping',['Cotovelos perto do corpo, giro pelos punhos.','Saltos baixos na ponta dos pés.','Comece com séries curtas.']]
};
function exDemo(name){
  const d=EXDEMO[name],q=encodeURIComponent(name.replace(/\s*\(.*?\)\s*/g,' ').trim()+' execução correta');
  const yt=`https://www.youtube.com/results?search_query=${q}`;
  const img=d?`<div class="demo"><img src="${EXDEMO_BASE}${d[0]}/0.jpg" alt="${esc(name)}: posição inicial" loading="eager"><img src="${EXDEMO_BASE}${d[0]}/1.jpg" alt="${esc(name)}: posição final" class="b" loading="eager"><span class="demo-l">Início</span></div>`:'';
  openSheet(name,`${img}${d?`<h3>Dicas de execução</h3><ul class="tips">${d[1].map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:`<p class="hint">Ainda não tenho a demonstração desse exercício aqui no app. Veja vídeos de como fazer no YouTube.</p>`}
   <a class="btn primary block" href="${yt}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>Ver vídeos no YouTube</a>
   ${d?`<p class="hint small">Imagens: Free Exercise DB (domínio público).</p>`:''}`,(b,el)=>{
    const box=b.querySelector('.demo');if(!box)return;const lb=box.querySelector('.demo-l');let on=false;
    const t=setInterval(()=>{if(!el.isConnected){clearInterval(t);return}on=!on;box.classList.toggle('alt',on);lb.textContent=on?'Fim':'Início'},1100)});
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-demo]');if(!b)return;e.preventDefault();e.stopPropagation();exDemo(b.dataset.demo)},true);
