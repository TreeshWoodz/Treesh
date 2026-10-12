import asyncio, sys, json
from playwright.async_api import async_playwright
# Profile sheet/full modes probe. python3 pfmode.py m|d [theme] [--sat]  -> /tmp/pfmode/<vp>_*.jpg + rect report
sys.path.insert(0, '/app/memory/tests')
from light_audit import DB, EXE  # noqa

R = """()=>{ const q=s=>document.querySelector(s); const box=el=>{ if(!el) return null; const r=el.getBoundingClientRect(), cs=getComputedStyle(el); return cs.display==='none'?'hidden':[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)].join(',')+' z'+cs.zIndex; };
  const top=(x,y)=>{ const e=document.elementFromPoint(x,y); return e?(e.closest('[data-testid]')||e).getAttribute('data-testid')||e.tagName:''; };
  return { vw:innerWidth, vh:innerHeight, header:box(q('#app .gl-main > header')), nav:box(q('#mobile-nav')), aside:box(q('#app aside.nav-glass')), player:box(q('#player')),
    pfPanel:box(q('#profile-panel')), pfBack:box(q('[data-testid="profile-module-backdrop"]')), sxRoot:box(q('#sx-root')), sxPanel:box(q('#sx-root .sx-panel')),
    full:!!q('#profile-panel.is-max, #sx-root.is-max'), atTop:top(innerWidth/2,(q('#app .gl-main > header')||{getBoundingClientRect:()=>({top:0,bottom:20})}).getBoundingClientRect().bottom-8),
    atNav:q('#mobile-nav')?top(innerWidth/2,innerHeight-20):'', pg:(q('#profile-panel')||q('#sx-root .sx-panel')||{dataset:{}}).dataset.pg||'', fsBtn:!!q('[data-testid="profile-fullscreen-toggle"],[data-testid="uprof-fullscreen-toggle"]') }; }"""

async def main():
    vp = sys.argv[1]; theme = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else 'dark'; sat = '--sat' in sys.argv
    import os; os.makedirs('/tmp/pfmode', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**(dict(p.devices['iPhone 13']) if vp == 'm' else {'viewport': {'width': 1400, 'height': 860}}))
        sess = {"access_token": "tok_ua1", "refresh_token": "r", "user": {"id": "ua1", "email": "x@test.com"}}
        seed = "localStorage.setItem('treesh_theme','\"%s\"'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_push',JSON.stringify({asked:true})); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s); localStorage.setItem('__mock_sb_session',%s);" % (theme, json.dumps(json.dumps(DB)), json.dumps(json.dumps(sess)))
        await ctx.add_init_script("if(!sessionStorage.getItem('__seeded')){ sessionStorage.setItem('__seeded','1'); localStorage.clear(); %s }" % seed)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/' + ('_sattest.html' if sat else '_sbtest.html')); await pg.wait_for_timeout(3000)
        await pg.reload(); await pg.wait_for_timeout(2500)
        if sat: await pg.evaluate("document.documentElement.style.setProperty('--sat','47px')")
        steps = [('own', "openProfile()"), ('own_max', "document.querySelector('[data-testid=\"profile-fullscreen-toggle\"]')?.click()"),
                 ('own_back', "document.querySelector('[data-testid=\"profile-fullscreen-toggle\"]')?.click()"), ('own_close', "closeProfile()"), ('own_cta', "openProfile(); setTimeout(()=>{ const s=document.getElementById('profile-scroll'); s.scrollTop=9999; setTimeout(()=>document.querySelector('[data-testid=\"profile-see-stats\"]').click(),300); },500)"), ('own_cta_close', "closeProfile()"),
                 ('them', "sxOpenProfile('chellyoance')"), ('them_max', "document.querySelector('[data-testid=\"uprof-fullscreen-toggle\"]')?.click()"),
                 ('them_back', "document.querySelector('[data-testid=\"uprof-fullscreen-toggle\"]')?.click()"), ('them_close', "sxClose()"), ('them_cta', "sxOpenProfile('chellyoance'); setTimeout(()=>document.querySelector('[data-testid=\"uprof-see-stats\"]').click(),900)"), ('them_nav', "document.querySelector('#mobile-nav [data-act], #app aside.nav-glass [data-act]').click()"), ('scrolled', "window.scrollTo(0,500); setTimeout(()=>openProfile(),300)")]
        for name, js in steps:
            await pg.evaluate("()=>{ %s }" % js); await pg.wait_for_timeout(1700 if 'cta' in name else 1300)
            print(name, json.dumps(await pg.evaluate(R)))
            if not name.endswith('close'): await pg.screenshot(path=f'/tmp/pfmode/{vp}_{theme}_{name}.jpg', quality=45)
        print('errors', errs)
        await b.close()
asyncio.run(main())
