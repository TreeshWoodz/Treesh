import asyncio
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        for name, dev in [('desktop',{'viewport':{'width':1400,'height':4000}}), ('mobile', p.devices['iPhone 13'])]:
            ctx = await b.new_context(**dev)
            pg = await ctx.new_page()
            await pg.goto('http://localhost:3000/support.html', wait_until='networkidle')
            await pg.wait_for_timeout(2500)
            # Trigger any lazy load by scrolling
            await pg.evaluate("()=>{ for(let y=0;y<document.body.scrollHeight;y+=400) window.scrollTo(0,y); window.scrollTo(0,0); }")
            await pg.wait_for_timeout(2500)
            await pg.evaluate("()=>Array.from(document.querySelectorAll('img')).forEach(i=>{ if(i.loading==='lazy') i.loading='eager'; if(!i.src && i.dataset.src) i.src=i.dataset.src; })")
            await pg.wait_for_timeout(2000)
            res = await pg.evaluate("""()=>{ const ks=['search','search-top','lyric-themes','lyt-chat','lyric-card','arcade','arcade-filters','dgc']; const out={}; for(const k of ks){ const imgs=[...document.querySelectorAll(`img[data-shot="${k}"], [data-shot="${k}"] img`)]; out[k]={count:imgs.length, broken:imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src||i.dataset.src)}; } return out; }""")
            print(name, res)
            await ctx.close()
        await b.close()
asyncio.run(main())
