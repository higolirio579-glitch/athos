// ATHOS — Edge Function "ai": IA para usuários logados, sem chave no app.
// Segredos necessários: GEMINI_KEY e/ou GROQ_KEY. Limite: 20 usos por pessoa por dia.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const LIMIT = 20;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
class AiErr extends Error { constructor(public code: string) { super(code); } }
const stripThink = (t: string) => String(t || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

type Turn = { role: "user" | "assistant"; content: string };

/* ----- Gemini ----- */
const GEM = "https://generativelanguage.googleapis.com/v1beta/models";
let gemModels: string[] | null = null, gemAt = 0;
async function gemList(key: string): Promise<string[]> {
  if (gemModels && Date.now() - gemAt < 6 * 3600e3) return gemModels;
  const r = await fetch(GEM + "?pageSize=1000", { headers: { "x-goog-api-key": key } });
  if (!r.ok) throw new AiErr(r.status === 429 ? "rate_limited" : "upstream_error");
  const j = await r.json();
  const ver = (n: string) => { const m = n.match(/gemini-(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
  gemModels = (j.models || [])
    .filter((m: any) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m: any) => String(m.name).replace(/^models\//, ""))
    .filter((n: string) => /^gemini-.*flash/.test(n) && !/(tts|image|live|audio|embed|exp|native|transcrib|translat|omni|computer)/.test(n))
    .sort((a: string, b: string) => (ver(b) - (/preview/.test(b) ? .05 : 0)) - (ver(a) - (/preview/.test(a) ? .05 : 0)))
    .slice(0, 8);
  gemAt = Date.now();
  return gemModels!;
}
async function callGemini(key: string, turns: Turn[], imgs: string[], json: boolean, quick: boolean) {
  const ms = await gemList(key);
  const lite = ms.filter((m) => /lite/.test(m)), full = ms.filter((m) => !/lite/.test(m));
  const order = quick ? [...lite, ...full] : [...full, ...lite];
  const contents = turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: String(t.content) }] as any[] }));
  if (imgs.length) { const last = contents[contents.length - 1]; last.parts = [...imgs.map((d) => ({ inline_data: { mime_type: "image/jpeg", data: d } })), ...last.parts]; }
  const body: any = { contents, generationConfig: { temperature: 0.4 } };
  if (json) body.generationConfig.responseMimeType = "application/json";
  let last = "upstream_error";
  for (const m of order.slice(0, 4)) {
    const r = await fetch(`${GEM}/${m}:generateContent`, { method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) {
      const j = await r.json(); const c = j.candidates && j.candidates[0];
      const t = c && c.content ? (c.content.parts || []).map((p: any) => p.text || "").join("") : "";
      if (t.trim()) return { text: t, used: "Gemini · " + m };
      if ((j.promptFeedback && j.promptFeedback.blockReason) || (c && c.finishReason === "SAFETY")) throw new AiErr("refused");
      last = "empty_completion"; continue;
    }
    last = r.status === 429 ? "rate_limited" : "upstream_error";
    if (![429, 404, 500, 503, 504].includes(r.status)) break;
  }
  throw new AiErr(last);
}

/* ----- Groq ----- */
const GROQ = "https://api.groq.com/openai/v1";
const GROQ_VISION = ["qwen/qwen3.8-27b", "meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"];
const GROQ_TEXT = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "llama-3.3-70b-versatile", "openai/gpt-oss-20b"];
let groqIds: Set<string> | null = null;
async function groqRaw(key: string, model: string, messages: any[], json: boolean) {
  const body: any = { model, messages, temperature: 0.4, max_completion_tokens: 4096 };
  if (json) body.response_format = { type: "json_object" };
  const send = () => fetch(GROQ + "/chat/completions", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let r = await send();
  if (r.status === 400 && json) { delete body.response_format; r = await send(); }
  if (r.ok) { const j = await r.json(); const t = stripThink(j.choices?.[0]?.message?.content); if (!t) throw new AiErr("empty_completion"); return t; }
  throw new AiErr(r.status === 429 ? "rate_limited" : "upstream_error");
}
const groqMsgs = (turns: Turn[], imgs: string[]) => turns.map((t, i) => {
  const role = t.role === "assistant" ? "assistant" : "user";
  if (i === turns.length - 1 && imgs.length) return { role, content: [{ type: "text", text: String(t.content) }, ...imgs.map((d) => ({ type: "image_url", image_url: { url: "data:image/jpeg;base64," + d } }))] };
  return { role, content: String(t.content) };
});
function parseLoose(t: string): any {
  t = stripThink(t);
  try { return JSON.parse(t); } catch (_) { /* segue */ }
  const a = t.search(/[\[{]/), b = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (_) { /* segue */ } }
  throw new AiErr("invalid_json");
}
async function callGroq(key: string, turns: Turn[], imgs: string[], json: boolean) {
  if (!groqIds) {
    const r = await fetch(GROQ + "/models", { headers: { Authorization: "Bearer " + key } });
    if (!r.ok) throw new AiErr("upstream_error");
    groqIds = new Set(((await r.json()).data || []).map((m: any) => m.id));
  }
  const model = imgs.length ? GROQ_VISION.find((m) => groqIds!.has(m)) : GROQ_TEXT.find((m) => groqIds!.has(m));
  if (!model) throw new AiErr("upstream_error");
  if (imgs.length <= 3) return { text: await groqRaw(key, model, groqMsgs(turns, imgs), json), used: "Groq · " + model };
  const merged: Record<string, any> = {}; const n = Math.ceil(imgs.length / 3);
  for (let k = 0; k < n; k++) {
    const tt = turns.slice(); const last = tt[tt.length - 1];
    tt[tt.length - 1] = { ...last, content: `${last.content}\n\n(Você está vendo a parte ${k + 1} de ${n} das fotos; responda só com o que aparece nelas.)` };
    const o = parseLoose(await groqRaw(key, model, groqMsgs(tt, imgs.slice(k * 3, k * 3 + 3)), true));
    for (const [kk, v] of Object.entries(o || {})) { if (Array.isArray(v)) merged[kk] = (merged[kk] || []).concat(v); else if (!(kk in merged)) merged[kk] = v; }
  }
  return { text: JSON.stringify(merged), used: "Groq · " + model };
}

/* ----- entrada ----- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return out({ code: "invalid_request" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("Authorization") || "";
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: u } = await userClient.auth.getUser();
  if (!u || !u.user) return out({ code: "not_logged" }, 401);
  const uid = u.user.id;

  let p: any;
  try { p = await req.json(); } catch (_) { return out({ code: "invalid_request" }, 400); }
  const turns: Turn[] = Array.isArray(p.turns) ? p.turns.filter((t: any) => t && typeof t.content === "string").slice(-12) : [];
  const imgs: string[] = Array.isArray(p.images) ? p.images.filter((s: any) => typeof s === "string").slice(0, 6) : [];
  if (!turns.length || turns[turns.length - 1].role !== "user") return out({ code: "invalid_request" }, 400);
  if (JSON.stringify(turns).length > 60000 || imgs.reduce((a, s) => a + s.length, 0) > 9_000_000) return out({ code: "prompt_too_large" }, 413);

  const admin = createClient(url, service);
  const { data: left, error: e1 } = await admin.rpc("ai_take", { p_user: uid, p_limit: LIMIT });
  if (e1) return out({ code: "upstream_error" }, 500);
  if (left < 0) return out({ code: "user_limit", limit: LIMIT }, 429);

  const gk = Deno.env.get("GEMINI_KEY"), qk = Deno.env.get("GROQ_KEY");
  const errs: string[] = [];
  for (const prov of [gk ? "gemini" : "", qk ? "groq" : ""].filter(Boolean)) {
    try {
      const r = prov === "gemini" ? await callGemini(gk!, turns, imgs, !!p.json, !!p.quick) : await callGroq(qk!, turns, imgs, !!p.json);
      return out({ text: r.text, used: r.used, remaining: left, limit: LIMIT });
    } catch (e) {
      const code = e instanceof AiErr ? e.code : "upstream_error";
      if (code === "refused") { await admin.rpc("ai_give_back", { p_user: uid }); return out({ code }, 422); }
      errs.push(code);
    }
  }
  await admin.rpc("ai_give_back", { p_user: uid });
  if (!gk && !qk) return out({ code: "server_not_configured" }, 503);
  return out({ code: errs.length && errs.every((c) => c === "rate_limited") ? "rate_limited" : "upstream_error" }, 503);
});
