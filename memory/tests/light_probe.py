import asyncio, sys, json
from playwright.async_api import async_playwright
# For each light-mode contrast issue in a state, finds the ancestor that sets the bad text colour and the CSS rules behind it.
# python3 light_probe.py m|d state[,state2] [maxRatio=2]
sys.path.insert(0, '/app/memory/tests')
from light_audit import S, DB, EXE, SCAN  # noqa

MARK = """(a)=>{ const [root, maxR] = a; const r = scanLight(root); const out = []; let n = 0;
  const all = [...document.querySelectorAll('*')];
  for (const i of r.issues) { if (i.ratio > maxR) continue;
    const leaf = all.find(e => { try { return e.matches(i.path.split(' > ').pop().replace(/\\[[^\\]]*\\]$/,'').replace(/\\.([^.]*[:\\/\\[\\]][^.]*)/g,'')) && (e.value || e.textContent || '').trim().startsWith(i.txt.replace('[field] ','').slice(0,10)); } catch (x) { return false; } });
    if (!leaf) { out.push({ txt: i.txt, miss: true }); continue; }
    const c = getComputedStyle(leaf).color; let src = leaf;
    while (src.parentElement && getComputedStyle(src.parentElement).color === c) src = src.parentElement;
    src.setAttribute('data-probe', String(n)); out.push({ id: n++, txt: i.txt.slice(0, 28), fg: i.fg, bg: i.bg, leaf: leaf.tagName.toLowerCase() + '.' + [...leaf.classList].join('.'), src: src.tagName.toLowerCase() + '.' + [...src.classList].join('.') + (src.id ? '#' + src.id : ''), same: src === leaf });
  } return out; }"""

async def main():
    vp = sys.argv[1]; names = sys.argv[2].split(','); maxr = float(sys.argv[3]) if len(sys.argv) > 3 else 2.0
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        opts = dict(p.devices['iPhone 13']) if vp == 'm' else {'viewport': {'width': 1400, 'height': 860}}
        for name in names:
            st = next(s for s in S if s[0] == name)
            ctx = await b.new_context(**opts)
            need = st[3]
            sess = None if need == 'out' else {"access_token": "tok_us1" if need == 'admin' else "tok_ua1", "refresh_token": "r", "user": {"id": "us1" if need == 'admin' else "ua1", "email": "x@test.com"}}
            seed = "localStorage.setItem('treesh_theme','\"light\"'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_push',JSON.stringify({asked:true})); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s);" % json.dumps(json.dumps(DB))
            if sess: seed += "localStorage.setItem('__mock_sb_session',%s);" % json.dumps(json.dumps(sess))
            await ctx.add_init_script("if(!sessionStorage.getItem('__seeded')){ sessionStorage.setItem('__seeded','1'); localStorage.clear(); %s }" % seed)
            pg = await ctx.new_page(); await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(3000)
            await pg.reload(); await pg.wait_for_timeout(2600)
            await pg.evaluate("()=>{ try{ %s }catch(e){} }" % st[1]); await pg.wait_for_timeout(1700)
            await pg.evaluate(SCAN); found = await pg.evaluate(MARK, [st[2], maxr])
            cdp = await ctx.new_cdp_session(pg); await cdp.send('DOM.enable'); await cdp.send('CSS.enable')
            doc = await cdp.send('DOM.getDocument', {'depth': -1})
            print('=====', name)
            seen = set()
            for f in found:
                if f.get('miss'): print('  ? not found', f['txt']); continue
                key = f['src']
                if key in seen: continue
                seen.add(key)
                try:
                    doc = await cdp.send('DOM.getDocument', {'depth': -1})
                    q = await cdp.send('DOM.querySelector', {'nodeId': doc['root']['nodeId'], 'selector': f'[data-probe="{f["id"]}"]'})
                    ms = await cdp.send('CSS.getMatchedStylesForNode', {'nodeId': q['nodeId']})
                except Exception as e: ms = {}
                rules = []
                for m in ms.get('matchedCSSRules', []):
                    props = [pp for pp in m['rule']['style']['cssProperties'] if pp['name'] == 'color' and pp.get('value')]
                    if props: rules.append(m['rule']['selectorList']['text'][:110] + ' => ' + props[-1]['value'])
                print(f"  '{f['txt']}' {f['fg']} on {f['bg']} | leaf {f['leaf'][:60]} | src {f['src'][:70]}")
                for rr in rules[-3:]: print('      ', rr)
            await ctx.close()
        await b.close()
asyncio.run(main())
