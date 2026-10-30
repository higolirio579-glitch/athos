// ATHOS — Edge Function "limpeza-fotos": roda 1x por dia (pg_cron).
// 1) Apaga da pasta privada "progresso" as fotos de quem ficou 30 dias sem abrir o app (ou excluiu a conta).
// 2) Apaga da pasta "fotos" as fotos sem dono (conta excluída, post apagado, foto de perfil trocada).
// 3) Apaga da pasta "chat" fotos e áudios de mensagens apagadas.
// Protegida por um segredo gerado e guardado dentro do banco (athos_private.settings). "Verify JWT" desligado.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

Deno.serve(async (req) => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: ok } = await admin.rpc("cron_secret_ok", { s: req.headers.get("x-cron") || "" });
  if (ok !== true) return new Response("forbidden", { status: 403 });
  const { data: folders, error } = await admin.rpc("pp_expired");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  let files = 0, users = 0;
  for (const row of folders || []) {
    const folder = String(row.folder || "");
    if (!/^[0-9a-f-]{36}$/.test(folder)) continue;
    const { data: list } = await admin.storage.from("progresso").list(folder, { limit: 1000 });
    const paths = (list || []).map((f) => `${folder}/${f.name}`);
    if (paths.length) {
      const { error: e2 } = await admin.storage.from("progresso").remove(paths);
      if (!e2) files += paths.length;
    }
    await admin.from("progress_photos").delete().eq("user_id", folder);
    users++;
  }
  let orphans = 0;
  const { data: orf } = await admin.rpc("fotos_orphans");
  const names = (orf || []).map((r: any) => String(r.name)).filter(Boolean);
  for (let i = 0; i < names.length; i += 100) {
    const { error: e3 } = await admin.storage.from("fotos").remove(names.slice(i, i + 100));
    if (!e3) orphans += Math.min(100, names.length - i);
  }
  let chat = 0;
  const { data: corf } = await admin.rpc("chat_orphans");
  const cn = (corf || []).map((r: any) => String(r.name)).filter(Boolean);
  for (let i = 0; i < cn.length; i += 100) {
    const { error: e4 } = await admin.storage.from("chat").remove(cn.slice(i, i + 100));
    if (!e4) chat += Math.min(100, cn.length - i);
  }
  return new Response(JSON.stringify({ users, files, orphans, chat }), { headers: { "Content-Type": "application/json" } });
});
