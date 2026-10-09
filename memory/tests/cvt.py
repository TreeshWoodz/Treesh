import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        for mob in (True, False):
            ctx = await b.new_context(**(p.devices['iPhone 13'] if mob else {'viewport':{'width':1400,'height':850}}))
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
            await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_asked','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3000)
            cv = "()=>document.documentElement.classList.contains('cv-hide')"
            print('mobile' if mob else 'desktop', 'idle', await pg.evaluate(cv))
            await pg.evaluate("()=>{ const s=SONGS[0]; playSong(s,[s]); state.npOpen=true; renderNP(); }"); await pg.wait_for_timeout(1500)
            print(' np open', await pg.evaluate(cv), await pg.evaluate("()=>getComputedStyle(document.getElementById('app')).visibility"))
            await pg.evaluate("()=>{ const r=document.querySelector('#np [data-np-root]'); r.style.transform='translate3d(0,40px,0)'; }"); await pg.wait_for_timeout(100)
            print(' drag moved ->', await pg.evaluate(cv))
            await pg.evaluate("()=>{ const r=document.querySelector('#np [data-np-root]'); r.style.transform=''; }"); await pg.wait_for_timeout(2000)
            print(' rehidden', await pg.evaluate(cv))
            await pg.evaluate("()=>closeNP()"); await pg.wait_for_timeout(120)
            print(' closing', await pg.evaluate(cv)); await pg.wait_for_timeout(800)
            print(' closed', await pg.evaluate(cv))
            await pg.evaluate("()=>{ try{ openProfile(); }catch(e){ console.log(e) } }"); await pg.wait_for_timeout(1800)
            print(' profile', await pg.evaluate(cv), await pg.evaluate("()=>{ const p=document.getElementById('profile'); const c=p&&p.firstElementChild; return c? (c.getBoundingClientRect().height+' '+getComputedStyle(c).backgroundColor):'none' }"))
            await ctx.close()
        await b.close()
asyncio.run(main())
