import json, re, asyncio, aiohttp, sys
orig = json.load(open('/app/tools/orig_bank.json'))
API = "https://api.datamuse.com/words"
ALPHA = re.compile(r'^[a-z]{2,14}$')
BAD = set("""sex sexy porn fuck shit bitch nigger nigga cunt dick cock pussy rape rapist whore slut fag faggot bastard damn ass asshole tits boob boobs penis vagina anal nazi kill""".split())

def clean(w):
    return w.lower().strip()

def freq(item):
    for t in item.get('tags', []) or []:
        if t.startswith('f:'):
            try: return float(t[2:])
            except Exception: return 0
    return 0

sem = asyncio.Semaphore(20)
async def q(session, params):
    async with sem:
        for attempt in range(3):
            try:
                async with session.get(API, params=params, timeout=aiohttp.ClientTimeout(total=20)) as r:
                    return await r.json()
            except Exception:
                await asyncio.sleep(1)
        return []

async def word_freq(session, words):
    out = {}
    async def one(w):
        res = await q(session, {'sp': w, 'md': 'f', 'max': 1})
        out[w] = freq(res[0]) if res and res[0].get('word') == w else 0
    await asyncio.gather(*[one(w) for w in words])
    return out

async def main():
    async with aiohttp.ClientSession() as session:
        # candidate prompts = original keys + single-word original answers
        cands = set(clean(k) for k in orig)
        for v in orig.values():
            for w in v:
                w = clean(w)
                if ALPHA.match(w): cands.add(w)
        cands = {c for c in cands if ALPHA.match(c) and c not in BAD}
        print('candidates', len(cands), file=sys.stderr)
        fr = await word_freq(session, sorted(cands))
        orig_keys = set(clean(k) for k in orig)
        prompts = sorted([c for c in cands if c in orig_keys or (fr.get(c, 0) >= 6 and len(c) >= 3)])
        print('prompts', len(prompts), file=sys.stderr)
        assoc = {}
        compounds = {}
        async def build(p):
            ml, trg, rc, lc, sp1, sp2 = await asyncio.gather(
                q(session, {'ml': p, 'max': 70, 'md': 'f'}),
                q(session, {'rel_trg': p, 'max': 45, 'md': 'f'}),
                q(session, {'rc': p, 'max': 30, 'md': 'f'}),
                q(session, {'lc': p, 'max': 30, 'md': 'f'}),
                q(session, {'sp': p + '?*', 'max': 300, 'md': 'f'}),
                q(session, {'sp': '*?' + p, 'max': 300, 'md': 'f'}),
            )
            s = set()
            for lst, minf in ((ml, 0.8), (trg, 0.8), (rc, 1.5), (lc, 1.5)):
                for it in lst or []:
                    w = it.get('word', '')
                    if ALPHA.match(w) and w not in BAD and w != p and freq(it) >= minf and not (w.startswith(p) and len(w) - len(p) <= 2):
                        s.add(w)
            assoc[p] = s
            comp = set()
            for it in sp1 or []:
                w = it.get('word', '')
                if ALPHA.match(w) and freq(it) >= 0.3:
                    rest = w[len(p):]
                    if len(rest) >= 3: comp.add(('R', rest, w))
            for it in sp2 or []:
                w = it.get('word', '')
                if ALPHA.match(w) and freq(it) >= 0.3:
                    rest = w[:-len(p)]
                    if len(rest) >= 3: comp.add(('L', rest, w))
            compounds[p] = comp
        await asyncio.gather(*[build(p) for p in prompts])
        # merge original curated answers
        for k, v in orig.items():
            k = clean(k)
            assoc.setdefault(k, set())
            for w in v:
                w = clean(w)
                if ALPHA.match(w) and w != k: assoc[k].add(w)
        vocab_all = set(prompts)
        for p in assoc: vocab_all |= assoc[p]
        # compound: keep only if the other part is a known word (vocab)
        comp_out = {}
        for p, comp in compounds.items():
            keep = sorted({(side, rest) for side, rest, w in comp if rest in vocab_all and rest not in BAD})
            if keep: comp_out[p] = keep
        vocab = sorted(vocab_all | {x[1] for v in comp_out.values() for x in v})
        idx = {w: i for i, w in enumerate(vocab)}
        out = {
            'v': vocab,
            'a': {str(idx[p]): sorted(idx[w] for w in s) for p, s in assoc.items() if len(s) >= 6},
            'c': {str(idx[p]): sorted((idx[r] if sd == 'R' else -(idx[r] + 1)) for sd, r in ws) for p, ws in comp_out.items() if len(ws) >= 2},
            'o': sorted(idx[clean(k)] for k in orig if clean(k) in idx),
        }
        json.dump(out, open('/app/tools/chainz-bank.json', 'w'), separators=(',', ':'))
        print('vocab', len(vocab), 'assoc prompts', len(out['a']), 'compound prompts', len(out['c']), file=sys.stderr)

asyncio.run(main())
