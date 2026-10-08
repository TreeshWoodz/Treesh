import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        dev = {'m':p.devices['iPhone 13'],'s':p.devices['iPhone SE'],'t':p.devices['iPad (gen 7)'],'d':{'viewport':{'width':1400,'height':850}}}[sys.argv[1] if len(sys.argv)>1 else 'm']
        ctx = await b.new_context(**dev)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3000)
        info = "()=>{ const r=e=>{ if(!e) return null; const b=e.getBoundingClientRect(); const c=getComputedStyle(e); return [Math.round(b.top),Math.round(b.bottom),Math.round(b.left),Math.round(b.width),c.zIndex,c.position]; }; const hd=document.querySelector('#app header'); const nv=document.getElementById('mobile-nav'); return {hdr:r(hd), hdrSel:hd&&hd.className.slice(0,80), nav:r(nv), navSel:nv&&(nv.className||'').slice(0,80), panel:r(document.getElementById('profile-panel')), banner:r(document.querySelector('[data-testid=profile-banner]')), root:r(document.getElementById('profile')), vh:innerHeight} }"
        print('before', await pg.evaluate(info))
        await pg.evaluate("()=>openProfile()"); await pg.wait_for_timeout(1200)
        print('open', await pg.evaluate(info))
        await pg.screenshot(path='/tmp/pf_open_'+(sys.argv[1] if len(sys.argv)>1 else 'm')+'.png')
        await b.close()
asyncio.run(main())
