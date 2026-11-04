-- ATHOS: limites do banco para não travar por excesso de conexões/consultas presas.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez. NÃO apaga nem muda dados.
-- O app e as Edge Functions falam com o banco por HTTP (PostgREST), que já passa pelo pooler do Supabase;
-- então o que protege o banco são estes tempos-limite (aplicados a cada conexão que o PostgREST usa).

-- 1) Antes de mudar: veja os valores de hoje
select rolname, rolconfig from pg_roles
where rolname in ('anon','authenticated','authenticator','service_role','postgres') order by rolname;

-- 2) Consulta que demora demais é cortada (evita uma consulta lenta segurar conexão do pool)
alter role anon          set statement_timeout = '5s';
alter role authenticated set statement_timeout = '10s';
alter role service_role  set statement_timeout = '60s';   -- limpeza diária e IA

-- 3) Transação aberta e parada é encerrada (conexão ociosa "presa" dentro de transação)
alter role anon          set idle_in_transaction_session_timeout = '15s';
alter role authenticated set idle_in_transaction_session_timeout = '15s';
alter role service_role  set idle_in_transaction_session_timeout = '30s';

-- 4) Espera por trava (lock) também tem limite
alter role anon          set lock_timeout = '5s';
alter role authenticated set lock_timeout = '5s';
alter role service_role  set lock_timeout = '15s';

-- 5) Faz o PostgREST ler as configurações novas
notify pgrst, 'reload config';

-- 6) Conferência: conexões abertas agora, por estado (muita "idle in transaction" é sinal de problema)
select usename, state, count(*) from pg_stat_activity where datname = current_database() group by 1, 2 order by 3 desc;
