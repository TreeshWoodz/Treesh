import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**(p.devices['iPhone 13'] if sys.argv[1:]==['m'] else {'viewport':{'width':1400,'height':850}}))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        await pg.evaluate("""()=>{ const s=SONG_BY_ID['chelly-banqz-shake-it-some-mo']; playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); }""")
        await pg.wait_for_timeout(2500)
        for mode in ['normal','karaoke']:
            if mode=='karaoke':
                await pg.evaluate("()=>{ const b=document.querySelector('[data-act=\"toggle-karaoke\"]'); if(b) b.click(); }"); await pg.wait_for_timeout(1500)
            acts = await pg.evaluate("()=>[...new Set([...document.querySelectorAll('#np [data-t], #np [data-act*=\"lyric\"], #np [data-kar-i], #np [data-ki]')].map(e=>e.dataset.act||e.className.slice(0,40)))]")
            print(mode, acts)
            ln = pg.locator('#np [data-act="lyric-seek"]').nth(12) if mode=='normal' else pg.locator('#kstage-scroll .k-line').nth(20)
            if await ln.count():
                t = await ln.get_attribute('data-t') or await ln.get_attribute('data-k'); bb=await ln.bounding_box()
                await (ln.tap() if sys.argv[1:]==['m'] else ln.click()); await pg.wait_for_timeout(600)
                print(mode,'tap t', t, 'ct', await pg.evaluate("()=>audio.currentTime"), bb)
        await pg.screenshot(path='/tmp/kar.png')
        await b.close()
asyncio.run(main())
