import asyncio, json, sys
from playwright.async_api import async_playwright

SEED = """()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"""
LOG = """()=>{ window.__ev=[]; const rec=(n)=>window.addEventListener(n,e=>{ const t=e.target; window.__ev.push(n+(e.defaultPrevented?'[PD]':'')+' '+((t&&t.closest&&t.closest('[data-testid]'))?t.closest('[data-testid]').dataset.testid:(t&&t.tagName))); },false);
  ['touchstart','touchend','pointerdown','pointerup','click'].forEach(rec); }"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell")
        dev = p.devices['iPhone 13']
        ctx = await b.new_context(**dev)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/')
        await pg.evaluate(SEED)
        await pg.reload(); await pg.wait_for_timeout(3500)
        await pg.evaluate(LOG)
        async def tap(sel, label):
            await pg.evaluate("()=>window.__ev=[]")
            el = pg.locator(sel).first
            if await el.count()==0: print(label,'MISSING'); return
            await el.tap(); await pg.wait_for_timeout(700)
            print(label, await pg.evaluate("()=>window.__ev"))
        await tap('[data-testid="nav-mobile-game"]','nav-game')
        print('view', await pg.evaluate("()=>state.view"))
        # find game card
        cards = await pg.evaluate("()=>[...document.querySelectorAll('[data-act=\"game-open\"],[data-act=\"game-info\"]')].slice(0,5).map(e=>e.outerHTML.slice(0,160))")
        print(cards)
        await pg.evaluate("()=>openGameInfo('chainz')"); await pg.wait_for_timeout(800)
        await tap('[data-testid="game-info-close"]','info-close')
        print('modal children after 1 tap', await pg.evaluate("()=>document.getElementById('modal').childElementCount"))
        await pg.evaluate("()=>openGameFrame('chainz')"); await pg.wait_for_timeout(1500)
        await tap('[data-testid="game-frame-close"]','frame-close')
        print('frame after 1 tap', await pg.evaluate("()=>!!state.gameFrame"))
        await pg.screenshot(path='/tmp/r1.png')
        await b.close()
asyncio.run(main())
