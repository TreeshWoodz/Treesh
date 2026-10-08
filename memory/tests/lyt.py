import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
THEMES = sys.argv[2].split(',') if len(sys.argv)>2 else ['classic','chat','neon','type','note','term','comic','pola']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**(p.devices['iPhone 13'] if MOBILE else {'viewport':{'width':1400,'height':850}}))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        pg.on('console', lambda m: print('CONSOLE', m.text) if m.type in ('warning','error') else None)
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        await pg.evaluate("""()=>{ const s=SONG_BY_ID['chelly-banqz-shake-it-some-mo']; playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); }""")
        await pg.wait_for_timeout(2500)
        await pg.evaluate("()=>{ audio.currentTime=40; }"); await pg.wait_for_timeout(1500)
        for t in THEMES:
            await pg.evaluate(f"()=>{{ lytSet('{t}',true); }}"); await pg.wait_for_timeout(1800)
            info = await pg.evaluate("()=>{ const c=document.getElementById('np-lyrics'); return {lyt:c&&c.dataset.lyt, rows:c&&c.querySelectorAll('[data-line-wrap]').length, vis:c&&[...c.querySelectorAll('[data-line-wrap]')].filter(x=>x.offsetParent).length, act:c&&(c.querySelector('.lyt-act .np-line')||{}).textContent, typing:!!document.getElementById('lyt-typing'), ct:audio.currentTime.toFixed(1)} }")
            print(t, info)
            await pg.screenshot(path=f'/tmp/lyt_{"m" if MOBILE else "d"}_{t}.png')
        await b.close()
asyncio.run(main())
