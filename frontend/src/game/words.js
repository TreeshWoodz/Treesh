/* Chainz word engine: built-in association bank + live Datamuse (cached in IndexedDB) */
const BAD = new Set("sex sexy porn fuck shit bitch nigger nigga cunt dick cock pussy rape rapist whore slut fag faggot bastard ass asshole tits boob boobs penis vagina anal nazi".split(" "));

let BANK = null;
let loading = null;
let cacheAdapter = null; // { get(k), put({k, w, t}) }
let fetchImpl = (u) => fetch(u);
const mem = new Map(); // prompt -> Promise<Set>
const realMem = new Map();
let online = typeof navigator === "undefined" ? true : navigator.onLine !== false;
let onlineEnabled = true;

export function configureWords({ cache, fetcher, useOnline } = {}) {
  if (cache) cacheAdapter = cache;
  if (fetcher) fetchImpl = fetcher;
  if (typeof useOnline === "boolean") onlineEnabled = useOnline;
}
if (typeof window !== "undefined") {
  window.addEventListener("online", () => { online = true; });
  window.addEventListener("offline", () => { online = false; });
}
export const isOnline = () => online && onlineEnabled;

export function norm(w) {
  return String(w || "").toLowerCase().replace(/[^a-z]/g, "");
}

export function buildBank(j) {
  const V = j.v;
  const assoc = new Map();
  const add = (a, b) => {
    let s = assoc.get(a);
    if (!s) { s = new Set(); assoc.set(a, s); }
    s.add(b);
  };
  const promptSet = new Set();
  Object.keys(j.a).forEach((k) => {
    const p = V[+k];
    promptSet.add(p);
    j.a[k].forEach((i) => { const w = V[i]; add(p, w); add(w, p); });
  });
  const comp = new Map();
  Object.keys(j.c || {}).forEach((k) => {
    const p = V[+k];
    const list = j.c[k].map((n) => (n >= 0 ? { w: V[n], full: p + V[n], side: "R" } : { w: V[-n - 1], full: V[-n - 1] + p, side: "L" }));
    comp.set(p, list);
    // reverse direction so the answer word can also look up the pair
    list.forEach((x) => {
      let r = comp.get(x.w);
      if (!r) { r = []; comp.set(x.w, r); }
      if (!r.some((y) => y.w === p)) r.push({ w: p, full: x.full, side: x.side === "R" ? "L" : "R" });
    });
  });
  const prompts = [...promptSet].filter((p) => (assoc.get(p) || new Set()).size >= 10 && p.length >= 3 && !BAD.has(p));
  const compPrompts = [...comp.keys()].filter((p) => promptSet.has(p) && comp.get(p).filter((x) => promptSet.has(x.w)).length >= 3);
  const orig = (j.o || []).map((i) => V[i]).filter((p) => prompts.includes(p));
  return { vocab: new Set(V), assoc, prompts, promptSet: new Set(prompts), comp, compPrompts, orig };
}

export async function loadBank(url) {
  if (BANK) return BANK;
  if (!loading) {
    loading = (async () => {
      // single-file build: the bank is inlined as <script type="application/json" id="chainz-bank-data">
      const inline = typeof document !== "undefined" && document.getElementById("chainz-bank-data");
      if (inline && inline.textContent.length > 100) {
        BANK = buildBank(JSON.parse(inline.textContent));
        return BANK;
      }
      const res = await fetchImpl(url);
      if (!res.ok) throw new Error("bank http " + res.status);
      const j = await res.json();
      BANK = buildBank(j);
      return BANK;
    })();
    loading.catch(() => { loading = null; });
  }
  return loading;
}
export const bank = () => BANK;

/* ---------- small helpers ---------- */
export const cap = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);
function variants(w) {
  const v = new Set([w]);
  if (w.endsWith("ies") && w.length > 4) v.add(w.slice(0, -3) + "y");
  if (w.endsWith("es") && w.length > 4) v.add(w.slice(0, -2));
  if (w.endsWith("s") && w.length > 3) v.add(w.slice(0, -1));
  if (!w.endsWith("s")) v.add(w + "s");
  return [...v];
}
export function tooClose(prompt, word) {
  if (word === prompt) return true;
  if (word.startsWith(prompt) && word.length - prompt.length <= 3 && prompt.length >= 3) return true;
  if (prompt.startsWith(word) && prompt.length - word.length <= 3 && word.length >= 3) return true;
  const stem = (x) => x.replace(/(ies|es|s|ing|ed|er)$/, "");
  return stem(word) === stem(prompt) && Math.min(word.length, prompt.length) >= 3;
}

/* ---------- Datamuse (online) ---------- */
const DM = "https://api.datamuse.com/words";
async function dm(params, timeoutMs) {
  const qs = Object.entries(params).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = setTimeout(() => ctrl && ctrl.abort(), timeoutMs || 6000);
  try {
    const r = await fetchImpl(DM + "?" + qs, ctrl ? { signal: ctrl.signal } : undefined);
    if (!r.ok) return [];
    return await r.json();
  } catch (e) {
    return [];
  } finally {
    clearTimeout(t);
  }
}

/** Live related-word set for a prompt (Datamuse), cached in memory + IndexedDB for 30 days. */
export function onlineAssoc(prompt) {
  prompt = norm(prompt);
  if (!prompt) return Promise.resolve(new Set());
  if (mem.has(prompt)) return mem.get(prompt);
  const p = (async () => {
    if (cacheAdapter) {
      try {
        const hit = await cacheAdapter.get("a:" + prompt);
        if (hit && hit.w && Date.now() - hit.t < 30 * 864e5) return new Set(hit.w);
      } catch (e) { /* noop */ }
    }
    if (!isOnline()) return null;
    const lists = await Promise.all([
      dm({ ml: prompt, max: 250 }),
      dm({ rel_trg: prompt, max: 120 }),
      dm({ rc: prompt, max: 60 }),
      dm({ lc: prompt, max: 60 }),
      dm({ rel_syn: prompt, max: 60 }),
      dm({ rel_jjb: prompt, max: 40 }),
      dm({ rel_jja: prompt, max: 40 }),
      dm({ rel_gen: prompt, max: 30 }),
      dm({ rel_spc: prompt, max: 30 }),
      dm({ rel_com: prompt, max: 30 }),
      dm({ rel_par: prompt, max: 30 }),
    ]);
    const s = new Set();
    lists.forEach((l) => (l || []).forEach((it) => {
      const w = String(it.word || "");
      if (/^[a-z]{2,16}$/.test(w) && !BAD.has(w)) s.add(w);
    }));
    if (s.size && cacheAdapter) { try { await cacheAdapter.put({ k: "a:" + prompt, w: [...s], t: Date.now() }); } catch (e) { /* noop */ } }
    return s;
  })();
  mem.set(prompt, p);
  p.then((r) => { if (r === null) mem.delete(prompt); });
  return p;
}

/** Is this a real English word? (bank vocabulary, then Datamuse spelling lookup) */
export async function isRealWord(w) {
  w = norm(w);
  if (w.length < 2) return false;
  if (BAD.has(w)) return false;
  if (BANK && variants(w).some((x) => BANK.vocab.has(x))) return true;
  if (realMem.has(w)) return realMem.get(w);
  if (cacheAdapter) {
    try { const hit = await cacheAdapter.get("r:" + w); if (hit) return !!hit.ok; } catch (e) { /* noop */ }
  }
  if (!isOnline()) return false;
  const res = await dm({ sp: w, md: "f", max: 1 }, 3500);
  let ok = false;
  if (res && res[0] && res[0].word === w) {
    const f = ((res[0].tags || []).find((t) => t.startsWith("f:")) || "f:0").slice(2);
    ok = parseFloat(f) >= 0.05;
  }
  realMem.set(w, ok);
  if (cacheAdapter) { try { await cacheAdapter.put({ k: "r:" + w, ok, t: Date.now() }); } catch (e) { /* noop */ } }
  return ok;
}

function overlap(a, b) {
  if (!a || !b) return 0;
  let n = 0;
  const [x, y] = a.size < b.size ? [a, b] : [b, a];
  x.forEach((v) => { if (y.has(v)) n++; });
  return n;
}

function withTimeout(p, ms, fallback) {
  return Promise.race([p, new Promise((r) => setTimeout(() => r(fallback), ms))]);
}

/* ---------- validators ---------- */
/** Returns { ok, reason, source, full? } */
export async function validate(mode, promptRaw, answerRaw, opts = {}) {
  const prompt = norm(promptRaw);
  const w = norm(answerRaw);
  const minLen = opts.minLen || 2;
  if (!w) return { ok: false, reason: "Type a word first" };
  if (w.length < minLen) return { ok: false, reason: `At least ${minLen} letters` };
  if (BAD.has(w)) return { ok: false, reason: "Keep it clean" };
  if (opts.used && opts.used.has(w)) return { ok: false, reason: "Already used!", used: true };

  if (mode === "letter") {
    const need = prompt.slice(-1);
    if (w[0] !== need) return { ok: false, reason: `Must start with “${need.toUpperCase()}”` };
    if (w === prompt) return { ok: false, reason: "Same word!" };
    const real = await withTimeout(isRealWord(w), 3800, false);
    return real ? { ok: true, source: "dict" } : { ok: false, reason: "Not in the dictionary" };
  }

  if (mode === "compound") {
    if (w === prompt) return { ok: false, reason: "Same word!" };
    const list = (BANK && BANK.comp.get(prompt)) || [];
    const hit = list.find((x) => x.w === w);
    if (hit) return { ok: true, source: "bank", full: hit.full };
    if (isOnline()) {
      const [a, b] = await withTimeout(Promise.all([
        dm({ sp: prompt + w, md: "f", max: 1 }, 3500),
        dm({ sp: w + prompt, md: "f", max: 1 }, 3500),
      ]), 3800, [[], []]);
      const good = (r, target) => r && r[0] && r[0].word === target;
      if (good(a, prompt + w)) return { ok: true, source: "online", full: prompt + w };
      if (good(b, w + prompt)) return { ok: true, source: "online", full: w + prompt };
    }
    return { ok: false, reason: "That’s not a compound word" };
  }

  // association modes
  if (tooClose(prompt, w)) return { ok: false, reason: "Too close to the prompt" };
  const bankHas = (a, b) => {
    if (!BANK) return false;
    const s = BANK.assoc.get(a);
    return !!(s && variants(b).some((x) => s.has(x)));
  };
  if (bankHas(prompt, w) || variants(w).some((x) => bankHas(x, prompt))) return { ok: true, source: "bank" };
  // shared-neighbour check: words that live in the same "word web" (music ~ guitar)
  if (BANK && overlap(BANK.assoc.get(prompt), BANK.assoc.get(w)) >= 5) return { ok: true, source: "bank-web" };
  if (isOnline()) {
    const s1 = await withTimeout(onlineAssoc(prompt), 3500, null);
    if (s1 && variants(w).some((x) => s1.has(x))) return { ok: true, source: "online" };
    const s2 = await withTimeout(onlineAssoc(w), 3000, null);
    if (s2 && variants(prompt).some((x) => s2.has(x))) return { ok: true, source: "online" };
    if (s1 && s2 && overlap(s1, s2) >= 25) return { ok: true, source: "online-web" };
    if (s1 === null && s2 === null) return { ok: false, reason: "Nope! (offline check)" };
  }
  return { ok: false, reason: "Not linked. Try another" };
}

/* ---------- prompt selection ---------- */
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

export function startWord(mode, rnd) {
  const B = BANK;
  if (mode === "compound") { const good = B.compPrompts.filter((p) => B.comp.get(p).length >= 6); return pick(good.length ? good : B.compPrompts, rnd); }
  if (mode === "letter") return pick(B.orig.length ? B.orig : B.prompts, rnd);
  return pick(B.orig.length ? B.orig : B.prompts, rnd);
}

/** After a correct answer, choose the next prompt (usually the answer itself = a true chain). */
export function nextPrompt(mode, answer, usedPrompts, usedWords, rnd) {
  const B = BANK;
  const a = norm(answer);
  const fresh = (p) => !usedPrompts.has(p) && !usedWords.has(p);
  if (mode === "letter") return a;
  if (mode === "compound") {
    const list = B.comp.get(a);
    if (list && list.filter((x) => !usedWords.has(x.w)).length >= 2 && !usedPrompts.has(a)) return a;
    const rel = (list || []).map((x) => x.w).filter((p) => B.comp.has(p) && B.comp.get(p).length >= 3 && fresh(p));
    if (rel.length) return pick(rel, rnd);
    const any = B.compPrompts.filter(fresh);
    return pick(any.length ? any : B.compPrompts, rnd);
  }
  if (B.promptSet.has(a) && !usedPrompts.has(a)) return a;
  const rel = [...(B.assoc.get(a) || [])].filter((p) => B.promptSet.has(p) && fresh(p));
  if (rel.length) return pick(rel, rnd);
  const any = B.prompts.filter(fresh);
  return pick(any.length ? any : B.prompts, rnd);
}

/** Candidate answers for hints / lifelines (bank only, instant). */
export function answersFor(mode, promptRaw, used) {
  const B = BANK;
  const p = norm(promptRaw);
  used = used || new Set();
  if (mode === "compound") {
    const all = ((B.comp.get(p)) || []).map((x) => x.w).filter((w) => !used.has(w));
    const common = all.filter((w) => B.promptSet.has(w));
    return common.length ? common : all;
  }
  if (mode === "letter") {
    const L = p.slice(-1);
    return B.prompts.filter((w) => w[0] === L && !used.has(w) && w !== p);
  }
  const s = B.assoc.get(p);
  if (!s) return [];
  const all = [...s].filter((w) => !used.has(w) && !tooClose(p, w) && w.length >= 3);
  // prefer common words (those that are prompts themselves)
  const common = all.filter((w) => B.promptSet.has(w));
  return common.length >= 3 ? common : all;
}

export function decoys(mode, promptRaw, n, rnd) {
  const B = BANK;
  const p = norm(promptRaw);
  const bad = new Set(answersFor(mode, p, new Set()));
  const pool = mode === "letter" ? B.prompts.filter((w) => w[0] !== p.slice(-1)) : B.prompts;
  const out = new Set();
  let guard = 0;
  while (out.size < n && guard++ < 400) {
    const w = pick(pool, rnd);
    if (w !== p && !bad.has(w) && !(B.assoc.get(p) || new Set()).has(w)) out.add(w);
  }
  return [...out];
}
