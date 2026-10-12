import asyncio, sys, json
from playwright.async_api import async_playwright
sys.path.insert(0, '/app/memory/tests')
from light_audit import EXE  # noqa
# python3 vpprobe.py [sat_px] [page]  -> iPhone 13 + simulated status bar; header bottom vs sticky tab tops after scrolling, root heights
SAT = sys.argv[1] if len(sys.argv) > 1 else '47'
ONLY = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else ''
PROBE = """()=>{ const hb=document.querySelector('.gl-main > header'); const h=hb?hb.getBoundingClientRect():null; const out={hdrBottom:h&&Math.round(h.bottom), innerH:innerHeight, body:Math.round(document.body.getBoundingClientRect().height), scrollY:Math.round(scrollY), nav:(()=>{const n=document.getElementById('mobile-nav'); if(!n) return null; const r=n.getBoundingClientRect(); return [Math.round(r.top),Math.round(r.bottom)];})(), stick:[], cls:document.documentElement.className.split(' ').filter(c=>/ios-pwa|vp-lie/.test(c)), appH:document.documentElement.style.getPropertyValue('--app-h'), full:document.documentElement.style.getPropertyValue('--app-full'), hdrH:document.documentElement.style.getPropertyValue('--hdr-h'), navH:document.documentElement.style.getPropertyValue('--nav-h'), ixtabs:(()=>{const t=document.querySelector('.ixp-tabs'); if(!t) return null; const r=t.getBoundingClientRect(); return [Math.round(r.top),Math.round(r.bottom)];})(), bodyMin:getComputedStyle(document.body).minHeight};
  document.querySelectorAll('#view *').forEach(e=>{ const cs=getComputedStyle(e); if(cs.position!=='sticky'||cs.top==='auto') return; const r=e.getBoundingClientRect(); if(r.height<2) return; out.stick.push({c:(e.getAttribute('data-testid')||'')+'.'+[...e.classList].slice(0,3).join('.'), top:cs.top, y:Math.round(r.top), h:Math.round(r.height), under:h?Math.round(h.bottom-r.top):0}); });
  return out; }"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        dev = dict(p.devices['iPhone 13']); PWA = '--pwa' in sys.argv; LIE = '--lie' in sys.argv
        if PWA: dev.update(viewport={'width': 390, 'height': 844 - (int(SAT) if LIE else 0)}, screen={'width': 390, 'height': 844})
        ctx = await b.new_context(**dev)
        if PWA: await ctx.add_init_script("Object.defineProperty(Navigator.prototype,'standalone',{get(){return true;}})")
        await ctx.add_init_script("localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_icon_note_7255','true'); localStorage.setItem('treesh_push',JSON.stringify({asked:true})); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));")
        await ctx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{ document.documentElement.style.setProperty('--sat','%spx'); document.documentElement.style.setProperty('--sab','34px'); })" % SAT)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sattest.html'); await pg.wait_for_timeout(3000)
        print('boot', json.dumps(await pg.evaluate(PROBE)))
        for v in ['settings', 'game', 'instrum', 'studios']:
            if ONLY and v != ONLY: continue
            await pg.evaluate(f"navigate('{v}')"); await pg.wait_for_timeout(1200)
            await pg.evaluate("window.scrollTo(0,600)"); await pg.wait_for_timeout(500)
            r = await pg.evaluate(PROBE)
            print(v, json.dumps(r))
            await pg.screenshot(path=f'/tmp/vp_{v}.jpg', quality=40)
        print('errors', errs[:5])
        await b.close()
asyncio.run(main())
