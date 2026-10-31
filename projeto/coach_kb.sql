-- ATHOS: biblioteca do Coach ATHOS (base de conhecimento consultada antes de responder)
-- Rode inteiro no SQL Editor do Supabase. Pode rodar de novo: apaga e recria o conteúdo padrão.

create table if not exists public.coach_kb (
  id bigint generated always as identity primary key,
  topic text not null,
  title text not null,
  body text not null check (char_length(body) <= 1500),
  tags text not null default '',
  tsv tsvector generated always as (to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(tags, '') || ' ' || coalesce(body, ''))) stored
);
create index if not exists coach_kb_tsv on public.coach_kb using gin (tsv);
alter table public.coach_kb enable row level security;
drop policy if exists "biblioteca visível" on public.coach_kb;
create policy "biblioteca visível" on public.coach_kb for select to authenticated using (true);

-- busca: até 5 trechos mais parecidos com a pergunta
create or replace function public.coach_search(q text) returns table (topic text, title text, body text)
language sql stable security definer set search_path = public as $$
  with w as (
    select string_agg(x, ' | ') as qq from (
      select distinct lower(t) as x from regexp_split_to_table(regexp_replace(coalesce(q, ''), '[^[:alnum:]À-ÿ ]', ' ', 'g'), '\s+') as t
      where char_length(t) >= 3 limit 20) s)
  select k.topic, k.title, k.body from public.coach_kb k, w
  where auth.uid() is not null and w.qq is not null and k.tsv @@ to_tsquery('portuguese', w.qq)
  order by ts_rank(k.tsv, to_tsquery('portuguese', w.qq)) desc
  limit 5;
$$;
revoke execute on function public.coach_search(text) from public, anon;
grant execute on function public.coach_search(text) to authenticated;

delete from public.coach_kb;
insert into public.coach_kb (topic, title, tags, body) values
-- ===== como usar o ATHOS =====
('app', 'Como começar um treino no ATHOS', 'iniciar treino ficha começar musculação',
 'Na aba Treino, toque em Iniciar na sua ficha ou em Musculação para um treino livre. Anote carga e repetições e toque em ✓ em cada série: o descanso começa sozinho. Ao finalizar, aparece o Relatório do treino com calorias gastas e progresso.'),
('app', 'Criar ou importar uma ficha', 'criar ficha importar foto ia modelo pronto',
 'Na aba Treino, toque em + Criar: do zero, com IA (diga objetivo e dias), por foto da ficha da academia ou por modelo pronto (Push, Pull, Legs, Full body). Cada ficha pode ter uma playlist.'),
('app', 'Sugestão de carga no ATHOS', 'sugestão carga progressão usar subir peso',
 'Durante o treino, o 💡 mostra quanto colocar hoje com base no último treino: se você fez todas as repetições do topo da faixa sem ir à falha, sugere subir a carga; se não bateu o mínimo, manter. Toque em Usar para preencher.'),
('app', 'Cronômetro dos exercícios por tempo', 'cronômetro timer prancha pular corda tempo',
 'Em exercícios por tempo (prancha, pular corda, esteira), toque em ⏱ na série: a contagem regressiva aparece na tela, com pausar e ±15 s. No fim apita, vibra e marca a série. KM só aparece em cardio de distância.'),
('app', 'Registrar refeições e código de barras', 'dieta refeição código de barras foto prato calorias',
 'Na aba Dieta, toque no + da refeição: busque o alimento, leia o código de barras da embalagem, tire foto do prato (a IA estima as porções) ou descreva o que comeu. Toque na refeição para repetir a de ontem.'),
('app', 'Corrida com GPS', 'corrida gps correr caminhar pedalar ritmo',
 'Na aba Treino, toque em Correr, Caminhar ou Pedalar. O ATHOS grava mapa, ritmo por km e passos, funciona com a tela bloqueada e fala o ritmo a cada km.'),
('app', 'XP, níveis, desafios e medalhas', 'xp nível medalha desafio ranking',
 'Cada treino, corrida e dia ativo dá XP. Os desafios do mês (50 km, 16 treinos, 20 dias ativos...) dão medalhas. O servidor confere tudo, então não dá para trapacear.'),
('app', 'Fotos de evolução e medidas', 'foto evolução antes depois medidas corpo',
 'Em Evolução → Corpo, registre medidas a cada 2 a 4 semanas e tire fotos sempre no mesmo lugar e luz. As fotos ficam numa pasta privada da conta (até 20).'),
('app', 'Privacidade no ATHOS', 'privado perfil mensagem seguir bloquear',
 'Em ⚙ → Privacidade: perfil privado (você aprova quem segue), quem pode te mandar mensagem e status online. Treinos, dieta e peso são só seus.'),
-- ===== princípios de treino =====
('treino', 'Sobrecarga progressiva', 'progressão carga travou estagnou platô subir',
 'Para evoluir, aumente algo ao longo das semanas: carga, repetições ou séries. Método simples (dupla progressão): escolha uma faixa, por exemplo 8–12. Quando fizer 12 em todas as séries com boa técnica, suba 2–5% da carga e volte para 8. Se travar 2–3 semanas: durma melhor, coma proteína suficiente, troque a variação do exercício ou faça uma semana mais leve (deload).'),
('treino', 'Carga travou no supino ou em outro exercício', 'travou platô estagnado supino não sobe',
 'Causas mais comuns: pouco descanso entre séries (use 2–3 min nos compostos), poucas calorias ou proteína, sono ruim, técnica inconsistente e treinar sempre na mesma faixa. Soluções: deload de 1 semana com 60–70% da carga, variar (supino inclinado, halteres, pausa no peito), trabalhar tríceps e ombro, e microprogressão de 1 kg.'),
('treino', 'RIR: repetições na reserva', 'rir falha intensidade reserva',
 'RIR é quantas repetições ainda sobravam. RIR 0 = falha. Para hipertrofia, a maioria das séries entre RIR 1 e 3 funciona bem; falha total só em algumas séries e em exercícios seguros (máquinas, isoladores).'),
('treino', 'Volume semanal para hipertrofia', 'volume séries por semana músculo hipertrofia',
 'Referência para ganhar massa: 10 a 20 séries efetivas por grupo muscular por semana, divididas em 2 ou mais treinos. Iniciantes evoluem com menos (6–10). Mais não é sempre melhor: se a força cai e o corpo não recupera, reduza.'),
('treino', 'Descanso entre séries', 'descanso intervalo tempo entre séries',
 'Compostos pesados (agachamento, supino, terra, remada): 2 a 3 min. Isoladores (rosca, elevação lateral, tríceps): 60 a 90 s. Descanso curto demais reduz as repetições e o ganho.'),
('treino', 'Frequência e divisão de treino', 'divisão abc fullbody push pull legs quantos dias',
 '2–3 dias por semana: full body. 4 dias: superior/inferior. 5–6 dias: push/pull/legs. O melhor é o que você consegue manter, treinando cada músculo pelo menos 2 vezes por semana.'),
('treino', 'Aquecimento', 'aquecer aquecimento antes treino',
 '5 minutos de cardio leve e 2 a 3 séries de aproximação no primeiro exercício (por exemplo 50% e 75% da carga com poucas repetições). Não precisa alongar estático longo antes de treinar força.'),
('treino', 'Deload: semana leve', 'deload descanso semana leve cansaço',
 'A cada 6 a 10 semanas, ou quando a força cai e o corpo está esgotado, faça uma semana com 50–70% das séries ou da carga. Você volta mais forte.'),
('treino', 'Treino rápido de 30 minutos', '30 minutos treino rápido pouco tempo',
 'Use compostos e superséries: 3 a 4 exercícios, 3 séries de 8–12, descanso de 60–90 s, alternando grupos (ex.: agachamento + remada, supino + stiff). Termine com 5 min de abdômen ou corda se sobrar tempo.'),
('treino', 'Treinar em casa sem equipamento', 'casa sem equipamento peso corporal',
 'Flexão, agachamento, afundo, ponte de glúteo, prancha, barra fixa se tiver, e burpee. Progrida fazendo mais repetições, mais devagar (3 s na descida) ou variações mais difíceis.'),
('treino', 'Abdômen definido', 'abdômen barriga definir trincado',
 'Abdômen aparece com gordura baixa, e isso vem da dieta (déficit calórico). Treine abdômen 2–3x por semana com progressão (prancha, elevação de pernas, abdominal na polia), mas não existe perder gordura localizada.'),
-- ===== técnica de exercícios =====
('tecnica', 'Supino reto: técnica', 'supino peito técnica barra',
 'Escápulas juntas e para baixo, pés firmes, leve arco. Barra desce na linha do mamilo, cotovelos a uns 45–70° do tronco, encosta no peito sem quicar. Use segurança (barras de proteção ou alguém para ajudar) em cargas pesadas.'),
('tecnica', 'Agachamento: técnica', 'agachamento perna quadríceps técnica',
 'Pés na largura dos ombros, pontas levemente para fora. Desça empurrando o quadril para trás e para baixo, joelhos acompanhando a direção dos pés, coluna neutra, peito alto. Desça até onde mantém a coluna neutra.'),
('tecnica', 'Levantamento terra: técnica', 'terra deadlift costas lombar',
 'Barra perto da canela, coluna neutra, empurre o chão com as pernas e estenda o quadril no final. Nunca arredonde a lombar com carga. Comece leve e aprenda o movimento.'),
('tecnica', 'Remada curvada: técnica', 'remada costas dorsal técnica',
 'Tronco inclinado uns 45°, coluna neutra, puxe a barra em direção ao umbigo levando os cotovelos para trás. Controle a descida.'),
('tecnica', 'Puxada e barra fixa', 'puxada barra fixa costas dorsal',
 'Peito alto, puxe com os cotovelos para baixo até a barra perto do peito. Sem jogar o corpo. Para progredir na barra fixa: negativas lentas ou elástico.'),
('tecnica', 'Desenvolvimento de ombro', 'desenvolvimento ombro militar',
 'Abdômen firme, sem arquear a lombar. Empurre até quase estender os braços acima da cabeça. Halteres permitem um caminho mais natural para o ombro.'),
('tecnica', 'Elevação lateral', 'elevação lateral ombro deltoide',
 'Carga leve, cotovelos levemente flexionados, suba até a altura dos ombros liderando com os cotovelos. Sem balançar o corpo.'),
('tecnica', 'Rosca bíceps e tríceps', 'rosca bíceps tríceps braço',
 'Cotovelos parados ao lado do corpo, sem balanço. Controle a descida (2–3 s). Para tríceps na polia, cotovelos colados e estenda totalmente.'),
('tecnica', 'Leg press', 'leg press perna',
 'Lombar e quadril encostados no banco o tempo todo. Desça até onde o quadril não descola. Não trave os joelhos no topo.'),
('tecnica', 'Prancha', 'prancha abdômen core',
 'Corpo em linha reta da cabeça aos pés, glúteo e abdômen contraídos, sem deixar o quadril cair. Melhor 3 séries bem feitas de 30–60 s do que uma longa e torta.'),
('tecnica', 'Corrida para iniciantes', 'correr corrida iniciante intervalado',
 'Comece alternando: 1 min correndo e 2 min caminhando, por 20–30 min, 3x por semana. Aumente o tempo correndo aos poucos, no máximo 10% de volume por semana. Ritmo em que você ainda consegue falar.'),
-- ===== nutrição =====
('nutricao', 'Quanta proteína comer', 'proteína gramas por quilo whey',
 'Para quem treina: 1,6 a 2,2 g de proteína por kg de peso por dia, dividida em 3 a 5 refeições com 25–40 g cada. Fontes: frango, ovos, carne, peixe, iogurte, queijo, feijão com arroz, whey. O ATHOS já calcula a sua meta.'),
('nutricao', 'Emagrecer: déficit calórico', 'emagrecer perder peso gordura déficit',
 'Perder gordura exige comer menos calorias do que gasta. Um déficit de 300 a 500 kcal por dia (0,5 a 1% do peso por semana) preserva músculo, ainda mais com treino de força e proteína alta. Evite dietas muito restritivas.'),
('nutricao', 'Ganhar massa: superávit', 'ganhar massa bulking engordar hipertrofia',
 'Para ganhar músculo, coma um pouco acima do gasto: 200 a 400 kcal por dia, mirando ganhar 0,25 a 0,5% do peso por mês. Mais que isso vira gordura.'),
('nutricao', 'Pré e pós-treino', 'pré-treino pós-treino comer antes depois',
 'Pré-treino (1–2 h antes): carboidrato e um pouco de proteína (ex.: pão com ovo, banana com iogurte). Pós-treino: refeição normal com proteína e carboidrato. O total do dia importa mais que o horário.'),
('nutricao', 'Água e hidratação', 'água hidratação beber',
 'Referência: cerca de 35 ml por kg por dia, mais em dias quentes e de treino. Urina clara é um bom sinal. O ATHOS calcula sua meta de água.'),
('nutricao', 'Creatina', 'creatina suplemento',
 'É o suplemento com mais evidência para força e massa: 3 a 5 g por dia, todos os dias, em qualquer horário, sem precisar de fase de saturação. Quem tem problema nos rins deve falar com o médico antes.'),
('nutricao', 'Whey protein', 'whey suplemento proteína',
 'Whey é só uma forma prática de proteína. Não é obrigatório: se você bate a meta de proteína com comida, não precisa.'),
('nutricao', 'Comida brasileira do dia a dia', 'arroz feijão frango refeição prato',
 'Arroz, feijão, uma carne magra e salada é um ótimo prato. Ajuste a quantidade de arroz pela meta de calorias e capriche na proteína.'),
-- ===== recuperação e segurança =====
('recuperacao', 'Sono e recuperação', 'sono dormir recuperação descanso',
 '7 a 9 horas de sono melhoram força, hipertrofia e controle do apetite. Dormir mal é uma das maiores causas de estagnação.'),
('recuperacao', 'Dor muscular tardia', 'dor muscular dolorido dia seguinte',
 'Dor 24–72 h depois de um treino novo é normal e passa. Movimento leve ajuda. Dor aguda, pontada, dor na articulação ou que piora não é normal: pare o exercício e procure um profissional.'),
('seguranca', 'Lesão e dor: quando parar', 'lesão dor machucado articulação joelho ombro lombar',
 'Dor forte, inchaço, formigamento ou dor na articulação: pare o exercício e procure um médico ou fisioterapeuta. O Coach ATHOS não diagnostica lesões.'),
('seguranca', 'Coach ATHOS não substitui profissionais', 'médico nutricionista personal saúde doença remédio',
 'O Coach dá orientações gerais de treino e alimentação. Para doenças, remédios, gravidez, lesões, dietas muito restritivas ou transtornos alimentares, procure médico, nutricionista ou educador físico.'),
('seguranca', 'Anabolizantes e remédios para emagrecer', 'anabolizante bomba esteroide remédio emagrecer',
 'O Coach ATHOS não orienta uso de anabolizantes, hormônios ou remédios para emagrecer. Isso tem riscos sérios e precisa de acompanhamento médico.');
