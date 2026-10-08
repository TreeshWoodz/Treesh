import asyncio
from playwright.async_api import async_playwright
import shots
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/lib/chromium/chromium')
        ctx=await b.new_context(viewport={'width':1440,'height':900}); await ctx.add_init_script(shots.SEED); pg=await ctx.new_page()
        await pg.goto(shots.BASE); await pg.wait_for_function("typeof navigate==='function'&&SONGS.length>0"); await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>openProfile('favorites')"); await pg.wait_for_timeout(1200)
        print(await pg.evaluate("()=>{ const e=document.querySelector('[data-testid=profile-top-artist]'); if(!e) return 'none'; const g=e.parentElement; return g.className+' | '+getComputedStyle(g).gridTemplateColumns+' | parent:'+g.parentElement.className.slice(0,80)+' | match:'+g.matches('.sp-page .sp-info .grid'); }"))
        await b.close()
asyncio.run(main())
