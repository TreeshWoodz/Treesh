import asyncio, sys, json
from playwright.async_api import async_playwright
# Prints an outline of the DOM under a root after running some JS. python3 dom_outline.py m|d "<js to open>" "<root selector>" [depth] [theme]
sys.path.insert(0, '/app/memory/tests')
from light_audit import DB, EXE  # noqa

OUT = """(a)=>{ const [sel, depth] = a; const root = document.querySelector(sel); if (!root) return 'no root ' + sel;
  const lines = []; const walk = (e, d) => { if (d > depth) return; const t = e.getAttribute('data-testid'); const c = [...e.classList].filter(x => !/[:\\[\\/]/.test(x)).slice(0, 5).join('.');
    const r = e.getBoundingClientRect(); const txt = e.children.length ? '' : (e.textContent || '').trim().slice(0, 30);
    lines.push('  '.repeat(d) + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (c ? '.' + c : '') + (t ? ' [' + t + ']' : '') + ' ' + Math.round(r.top) + ',' + Math.round(r.height) + (txt ? ' "' + txt + '"' : ''));
    [...e.children].forEach(k => walk(k, d + 1)); }; walk(root, 0); return lines.join('\\n'); }"""

async def main():
    vp, js, sel = sys.argv[1], sys.argv[2], sys.argv[3]; depth = int(sys.argv[4]) if len(sys.argv) > 4 else 4; theme = sys.argv[5] if len(sys.argv) > 5 else 'dark'
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**(dict(p.devices['iPhone 13']) if vp == 'm' else {'viewport': {'width': 1400, 'height': 860}}))
        sess = {"access_token": "tok_ua1", "refresh_token": "r", "user": {"id": "ua1", "email": "x@test.com"}}
        seed = "localStorage.setItem('treesh_theme','\"%s\"'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_push',JSON.stringify({asked:true})); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s); localStorage.setItem('__mock_sb_session',%s);" % (theme, json.dumps(json.dumps(DB)), json.dumps(json.dumps(sess)))
        await ctx.add_init_script("if(!sessionStorage.getItem('__seeded')){ sessionStorage.setItem('__seeded','1'); localStorage.clear(); %s }" % seed)
        pg = await ctx.new_page(); await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(3000)
        await pg.reload(); await pg.wait_for_timeout(2500)
        await pg.evaluate("async()=>{ %s }" % js); await pg.wait_for_timeout(1800)
        print(await pg.evaluate(OUT, [sel, depth]))
        if len(sys.argv) > 6: await pg.screenshot(path=sys.argv[6])
        await b.close()
asyncio.run(main())
