import asyncio, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**p.devices['iPhone 13'])
        await ctx.add_init_script("""localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('treesh_eco_ask','1');
window.__sc=0; const _cr=CanvasRenderingContext2D.prototype.clearRect; CanvasRenderingContext2D.prototype.clearRect=function(){ if(this.canvas&&this.canvas.id==='stars') window.__sc++; return _cr.apply(this,arguments); };""")
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.wait_for_timeout(4000)
        async def st(tag):
            a = await pg.evaluate("()=>window.__sc"); await pg.wait_for_timeout(1000); b2 = await pg.evaluate("()=>window.__sc")
            print(tag, await pg.evaluate("()=>({cv:document.documentElement.classList.contains('cv-hide'), app:getComputedStyle(document.getElementById('app')).visibility, eco:!!state.eco})"), 'star frames/s', b2-a)
        await st('home')
        await pg.evaluate("()=>{ const s=SONGS[0]; playSong(s,[s]); state.npOpen=true; renderNP(); syncScrollLock(); }"); await pg.wait_for_timeout(1500)
        await st('np open')
        await pg.evaluate("()=>{ closeNP&&closeNP(); }"); await pg.wait_for_timeout(1500)
        await st('np closed')
        await b.close()
asyncio.run(main())
