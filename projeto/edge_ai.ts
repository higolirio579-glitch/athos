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
/* prazo por motor: se passar, pula para o próximo */
const sig = (deadline: number) => AbortSignal.timeout(Math.max(800, deadline - Date.now()));
const late = (deadline: number) => { if (Date.now() > deadline - 300) throw new AiErr("timeout"); };

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
async function callGemini(key: string, turns: Turn[], imgs: string[], json: boolean, quick: boolean, deadline: number, fast = true) {
  const ms = await gemList(key);
  const lite = ms.filter((m) => /lite/.test(m)), full = ms.filter((m) => !/lite/.test(m));
  const order = quick ? [...lite, ...full] : [...full, ...lite];
  const contents = turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: String(t.content) }] as any[] }));
  if (imgs.length) { const last = contents[contents.length - 1]; last.parts = [...imgs.map((d) => ({ inline_data: { mime_type: "image/jpeg", data: d } })), ...last.parts]; }
  const body: any = { contents, generationConfig: { temperature: 0.4 } };
  if (json) body.generationConfig.responseMimeType = "application/json";
  let last = "upstream_error";
  for (const m of order.slice(0, 4)) {
    late(deadline);
    const b2: any = { ...body, generationConfig: { ...body.generationConfig } };
    // resposta direta, sem "pensar" antes (bem mais rápido); se o modelo não aceitar, manda sem
    if (fast) b2.generationConfig.thinkingConfig = /gemini-2\./.test(m) ? { thinkingBudget: 0 } : { thinkingLevel: "minimal" };
    const go = (bb: any) => fetch(`${GEM}/${m}:generateContent`, { method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify(bb), signal: sig(deadline) });
    let r = await go(b2);
    if (r.status === 400 && fast) { delete b2.generationConfig.thinkingConfig; late(deadline); r = await go(b2); }
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
async function groqRaw(key: string, model: string, messages: any[], json: boolean, deadline: number) {
  const body: any = { model, messages, temperature: 0.4, max_completion_tokens: 4096 };
  if (/gpt-oss/.test(model)) body.reasoning_effort = "low";
  if (json) body.response_format = { type: "json_object" };
  const send = () => fetch(GROQ + "/chat/completions", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: sig(deadline) });
  let r = await send();
  if (r.status === 400 && body.reasoning_effort) { delete body.reasoning_effort; late(deadline); r = await send(); }
  if (r.status === 400 && json) { delete body.response_format; late(deadline); r = await send(); }
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
async function callGroq(key: string, turns: Turn[], imgs: string[], json: boolean, deadline: number) {
  if (!groqIds) {
    const r = await fetch(GROQ + "/models", { headers: { Authorization: "Bearer " + key }, signal: sig(deadline) });
    if (!r.ok) throw new AiErr("upstream_error");
    groqIds = new Set(((await r.json()).data || []).map((m: any) => m.id));
  }
  const model = imgs.length ? GROQ_VISION.find((m) => groqIds!.has(m)) : GROQ_TEXT.find((m) => groqIds!.has(m));
  if (!model) throw new AiErr("upstream_error");
  if (imgs.length <= 3) return { text: await groqRaw(key, model, groqMsgs(turns, imgs), json, deadline), used: "Groq · " + model };
  const merged: Record<string, any> = {}; const n = Math.ceil(imgs.length / 3);
  for (let k = 0; k < n; k++) {
    const tt = turns.slice(); const last = tt[tt.length - 1];
    tt[tt.length - 1] = { ...last, content: `${last.content}\n\n(Você está vendo a parte ${k + 1} de ${n} das fotos; responda só com o que aparece nelas.)` };
    const o = parseLoose(await groqRaw(key, model, groqMsgs(tt, imgs.slice(k * 3, k * 3 + 3)), true, deadline));
    for (const [kk, v] of Object.entries(o || {})) { if (Array.isArray(v)) merged[kk] = (merged[kk] || []).concat(v); else if (!(kk in merged)) merged[kk] = v; }
  }
  return { text: JSON.stringify(merged), used: "Groq · " + model };
}

/* ----- NVIDIA NIM e Cloudflare Workers AI (formato OpenAI) ----- */
const NV = "https://integrate.api.nvidia.com/v1";
const NV_TEXT = ["nvidia/nemotron-3.5-lightning-30b-a3b", "nvidia/nemotron-3-super-120b-a12b", "google/gemma-4-31b-it", "nvidia/llama-3.1-nemotron-70b-instruct", "meta/llama-3.3-70b-instruct", "nvidia/nemotron-nano-3-30b-a3b", "google/gemma-3-12b-it", "mistralai/mistral-7b-instruct-v0.3", "mistralai/mistral-large-2-instruct"];
const NV_VISION = ["nvidia/nemotron-3.5-super-vl-120b-a12b", "meta/llama-3.2-90b-vision-instruct", "meta/llama-3.2-11b-vision-instruct"];
let nvIds: Set<string> | null = null, nvAt = 0;
let lastHttp = "";
const nvOk: Record<string, string> = {};
async function compatRaw(url: string, key: string, model: string, messages: any[], json: boolean, deadline: number) {
  late(deadline);
  const body: any = { model, messages, temperature: 0.4, max_tokens: 4096 };
  if (json) body.response_format = { type: "json_object" };
  const send = () => fetch(url, { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: sig(deadline) });
  let r = await send();
  if ((r.status === 400 || r.status === 422) && json) { delete body.response_format; late(deadline); r = await send(); }
  if (r.ok) { const j = await r.json(); const t = stripThink(j.choices?.[0]?.message?.content || j.result?.response || ""); if (!t) throw new AiErr("empty_completion"); return t; }
  try { lastHttp = `${model} HTTP ${r.status} ${(await r.text()).slice(0, 160)}`; } catch (_) { lastHttp = `${model} HTTP ${r.status}`; }
  throw new AiErr(r.status === 429 ? "rate_limited" : "upstream_error");
}
async function callCompat(name: string, url: string, key: string, model: string, turns: Turn[], imgs: string[], json: boolean, deadline: number, perCall = 3) {
  if (imgs.length <= perCall) return { text: await compatRaw(url, key, model, groqMsgs(turns, imgs), json, deadline), used: name + " · " + model };
  const merged: Record<string, any> = {}; const n = Math.ceil(imgs.length / perCall);
  for (let k = 0; k < n; k++) {
    const tt = turns.slice(); const last = tt[tt.length - 1];
    tt[tt.length - 1] = { ...last, content: `${last.content}\n\n(Você está vendo a parte ${k + 1} de ${n} das fotos; responda só com o que aparece nelas.)` };
    const o = parseLoose(await compatRaw(url, key, model, groqMsgs(tt, imgs.slice(k * perCall, k * perCall + perCall)), true, deadline));
    for (const [kk, v] of Object.entries(o || {})) { if (Array.isArray(v)) merged[kk] = (merged[kk] || []).concat(v); else if (!(kk in merged)) merged[kk] = v; }
  }
  return { text: JSON.stringify(merged), used: name + " · " + model };
}
async function callNvidia(key: string, turns: Turn[], imgs: string[], json: boolean, deadline: number) {
  if (!nvIds || Date.now() - nvAt > 6 * 3600e3) {
    try { const r = await fetch(NV + "/models", { headers: { Authorization: "Bearer " + key }, signal: AbortSignal.timeout(4000) }); if (r.ok) { nvIds = new Set(((await r.json()).data || []).map((m: any) => m.id)); nvAt = Date.now(); } } catch (_) { /* segue */ }
  }
  const kind = imgs.length ? "v" : "t", list = imgs.length ? NV_VISION : NV_TEXT;
  let cands = nvIds ? list.filter((m) => nvIds!.has(m)) : list.slice();
  if (!cands.length) cands = list.slice();
  if (nvOk[kind]) cands = [nvOk[kind], ...cands.filter((m) => m !== nvOk[kind])];
  let last = "upstream_error";
  for (const m of cands.slice(0, 6)) {
    try { const r = await callCompat("NVIDIA", NV + "/chat/completions", key, m, turns, imgs, json, deadline, 1); nvOk[kind] = m; return r; }
    catch (e) { last = e instanceof AiErr ? e.code : "upstream_error"; if (nvOk[kind] === m) delete nvOk[kind]; if (last === "rate_limited" || Date.now() > deadline - 500) break; }
  }
  throw new AiErr(last);
}
const CF_TEXT = "@cf/meta/llama-3.3-70b-instruct-fp8-fast", CF_VISION = "@cf/meta/llama-4-scout-17b-16e-instruct";
async function callCloudflare(acc: string, key: string, turns: Turn[], imgs: string[], json: boolean, deadline: number) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${acc}/ai/v1/chat/completions`;
  return await callCompat("Cloudflare", url, key, imgs.length ? CF_VISION : CF_TEXT, turns, imgs, json, deadline, 1);
}

/* ----- todos os motores, na ordem de preferência ----- */
type Prov = { id: string; run: (turns: Turn[], imgs: string[], json: boolean, quick: boolean, deadline: number, fast?: boolean) => Promise<{ text: string; used: string }> };
function providers(): Prov[] {
  const gk = Deno.env.get("GEMINI_KEY"), qk = Deno.env.get("GROQ_KEY"), nk = Deno.env.get("NVIDIA_KEY");
  const ca = Deno.env.get("CF_ACCOUNT_ID"), ct = Deno.env.get("CF_AI_TOKEN");
  const out: Prov[] = [];
  if (gk) out.push({ id: "gemini", run: (t, i, j, q, d, f) => callGemini(gk, t, i, j, q, d, f !== false) });
  if (qk) out.push({ id: "groq", run: (t, i, j, _q, d) => callGroq(qk, t, i, j, d) });
  if (nk) out.push({ id: "nvidia", run: (t, i, j, _q, d) => callNvidia(nk, t, i, j, d) });
  if (ca && ct) out.push({ id: "cloudflare", run: (t, i, j, _q, d) => callCloudflare(ca, ct, t, i, j, d) });
  return out;
}
/* ordem por tarefa: texto → Groq primeiro (o mais rápido); foto → Gemini (Flash-Lite primeiro) */
function ordered(imgs: string[]): Prov[] {
  const all = providers();
  if (imgs.length) return all;
  const g = all.find((p) => p.id === "groq");
  return g ? [g, ...all.filter((p) => p !== g)] : all;
}
/* tempo máximo por motor antes de pular para o próximo; o último tem mais folga */
const budget = (imgs: string[], last: boolean) => last ? 40000 : imgs.length ? 22000 : 12000;
async function runChain(provs: Prov[], turns: Turn[], imgs: string[], json: boolean, quick: boolean, errs: string[], legacy = false) {
  for (let k = 0; k < provs.length; k++) {
    const pv = provs[k];
    const deadline = Date.now() + (legacy ? 60000 : budget(imgs, k === provs.length - 1));
    try { return await pv.run(turns, imgs, json, legacy ? quick : (quick || imgs.length > 0), deadline, !legacy); }
    catch (e) {
      const code = e instanceof AiErr ? e.code : (String((e as any)?.name || "").includes("Timeout") ? "timeout" : "upstream_error");
      if (code === "refused") throw e;
      errs.push(pv.id + ":" + code);
    }
  }
  return null;
}

/* ----- entrada ----- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return out({ code: "invalid_request" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (req.headers.get("x-cron")) {
    const adm = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: ok } = await adm.rpc("cron_secret_ok", { s: req.headers.get("x-cron") || "" });
    if (ok !== true) return out({ code: "forbidden" }, 403);
    let tb: any = {}; try { tb = await req.json(); } catch (_) { /* sem corpo */ }
    if (tb && tb.bench) {
      // mede um pedido real: "old" = jeito antigo (Gemini completo pensando primeiro), "new" = jeito novo
      const legacy = tb.bench === "old";
      const tt: Turn[] = [{ role: "user", content: String(tb.prompt || "Monte um treino de peito e tríceps de 45 minutos para intermediário, com séries e repetições.").slice(0, 4000) }];
      const errs: string[] = []; const t0 = Date.now();
      try {
        const r = await runChain(legacy ? providers() : ordered([]), tt, [], !!tb.json, false, errs, legacy);
        return out({ bench: tb.bench, ms: Date.now() - t0, used: r ? r.used : null, chars: r ? r.text.length : 0, errs });
      } catch (e) { return out({ bench: tb.bench, ms: Date.now() - t0, error: String(e).slice(0, 120), errs }); }
    }
    const res: Record<string, string> = {};
    for (const pv of providers()) {
      const t0 = Date.now();
      try { const r = await pv.run([{ role: "user", content: "Responda só com a palavra: OK" }], [], false, false, Date.now() + 20000); res[pv.id] = `ok ${Date.now() - t0}ms · ${r.used} · ${r.text.slice(0, 20)}`; }
      catch (e) { res[pv.id] = "erro: " + (e instanceof AiErr ? e.code : String(e).slice(0, 80)) + " · " + lastHttp; }
    }
    return out({ test: res });
  }
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

  const provs = ordered(imgs);
  const errs: string[] = [];
  try {
    const r = await runChain(provs, turns, imgs, !!p.json, !!p.quick, errs);
    if (r) return out({ text: r.text, used: r.used, remaining: left, limit: LIMIT });
  } catch (e) {
    if (e instanceof AiErr && e.code === "refused") { await admin.rpc("ai_give_back", { p_user: uid }); return out({ code: "refused" }, 422); }
  }
  await admin.rpc("ai_give_back", { p_user: uid });
  if (!provs.length) return out({ code: "server_not_configured" }, 503);
  return out({ code: errs.length && errs.every((c) => c.endsWith(":rate_limited")) ? "rate_limited" : "upstream_error" }, 503);
});
