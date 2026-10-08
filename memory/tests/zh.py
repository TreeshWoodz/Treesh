import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
async def drag(cdp, pg, x, y0, y1, steps, dt, dx=0):
    await cdp.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[{'x':x,'y':y0}]})
    for i in range(1, steps+1):
        await cdp.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':[{'x':x+dx*i/steps,'y':y0+(y1-y0)*i/steps}]})
        await pg.wait_for_timeout(dt)
    r = await pg.evaluate("()=>{const e=document.querySelector('.zh-sheet'); if(!e) return null; const b=e.getBoundingClientRect(); return [Math.round(b.left),Math.round(b.top),e.style.transform]}")
    await cdp.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
    return r
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        import sys as _s
        dev={'m':p.devices['iPhone 13'],'l':p.devices['iPhone 13 landscape'],'t':p.devices['iPad (gen 7)']}[_s.argv[1] if len(_s.argv)>1 else 'm']
        ctx = await b.new_context(**dev)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3000)
        cdp = await ctx.new_cdp_session(pg)
        rect = "()=>{const e=document.querySelector('.zh-sheet'); if(!e) return null; const b=e.getBoundingClientRect(); return [Math.round(b.left),Math.round(b.top),Math.round(b.width),getComputedStyle(e).transform,e.style.transform,document.getElementById('zh-root').className]}"
        await pg.evaluate("()=>zhOpen()"); await pg.wait_for_timeout(800)
        print('open', await pg.evaluate(rect))
        print('during slow drag', await drag(cdp, pg, 200, 120, 190, 8, 40))
        await pg.wait_for_timeout(120); print('snap 120ms', await pg.evaluate(rect))
        for t in [250,80,80,80,80,200]:
            await pg.wait_for_timeout(t); print('snap +', await pg.evaluate("()=>{const e=document.querySelector('.zh-sheet'); const c=getComputedStyle(e); return [c.opacity, c.transform, c.animationName, e.style.animation]}"))
        await pg.screenshot(path='/tmp/zh_after_snap.png')
        print('during diag drag', await drag(cdp, pg, 200, 120, 200, 8, 30, dx=6))
        await pg.wait_for_timeout(700); print('after diag', await pg.evaluate(rect))
        print('during flick', await drag(cdp, pg, 200, 120, 260, 4, 12))
        for t in [60,150,300]:
            await pg.wait_for_timeout(t); print('flick +',t, await pg.evaluate(rect))
        await pg.screenshot(path='/tmp/zh_after_flick.png')
        await pg.evaluate("()=>zhOpen()"); await pg.wait_for_timeout(100); print('reopen 100ms', await pg.evaluate(rect)); await pg.wait_for_timeout(700); print('reopen', await pg.evaluate(rect))
        # drag from body content (scroll at top)
        print('body drag', await drag(cdp, pg, 200, 420, 520, 8, 30))
        await pg.wait_for_timeout(700); print('after body drag', await pg.evaluate(rect))
        await b.close()
asyncio.run(main())
