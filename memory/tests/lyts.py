import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
STY = sys.argv[2].split(',') if len(sys.argv)>2 else ['chat','neon','type','note','term','comic','pola']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**(p.devices['iPhone 13'] if MOBILE else {'viewport':{'width':1400,'height':850}}))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        pg.on('console', lambda m: print('CONSOLE', m.text) if m.type in ('warning','error') and 'tailwind' not in m.text else None)
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_seen','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        await pg.evaluate("""()=>{ const s=SONG_BY_ID['chelly-banqz-shake-it-some-mo']; playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); }""")
        await pg.wait_for_timeout(2000)
        btn = pg.locator('[data-testid="lyt-open-button"]:visible, [data-testid="lyt-open-button-d"]:visible').first
        print('lyt btn', await btn.count())
        await btn.click(); await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'/tmp/lyts_{"m" if MOBILE else "d"}_sheet.png')
        await pg.locator('[data-testid="lyt-opt-chat"]').click(); await pg.wait_for_timeout(500)
        await pg.locator('[data-testid="lyt-pin-toggle"]').click(); await pg.wait_for_timeout(400)
        await pg.locator('[data-testid="lyt-opt-neon"]').click(); await pg.wait_for_timeout(500)
        print('after pin', await pg.evaluate("()=>({all:localStorage.getItem('treesh_lyt'), pins:localStorage.getItem('treesh_lyt_song'), cur:document.getElementById('np-lyrics').dataset.lyt})"))
        await pg.screenshot(path=f'/tmp/lyts_{"m" if MOBILE else "d"}_sheet2.png')
        await pg.locator('[data-testid="lyt-close"]').click(); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{ openLyricStudio('chelly-banqz-shake-it-some-mo'); const id='chelly-banqz-shake-it-some-mo'; state.studio.picked=[10,11,12,13].map(i=>studioPickEntry(id,i)); openLyricStudio(id); }"); await pg.wait_for_timeout(1500)
        print('style card', await pg.locator('[data-testid="lyric-card-style-card"]').count())
        for t in STY:
            el = pg.locator(f'[data-testid="card-style-{t}"]')
            if not await el.count(): print('no tile', t); continue
            await el.click(); await pg.wait_for_timeout(1600)
            await pg.screenshot(path=f'/tmp/lcs_{"m" if MOBILE else "d"}_{t}.png')
            data = await pg.evaluate("()=>document.getElementById('lyric-canvas').toDataURL('image/jpeg',.6)")
            import base64; open(f'/tmp/lcc_{t}.jpg','wb').write(base64.b64decode(data.split(',')[1]))
            print(t, 'hidden bg', await pg.evaluate("()=>{const e=document.querySelector('[data-testid=\"lyric-card-bg-card\"]'); return e?e.classList.contains('hidden'):'none'}"))
        await b.close()
asyncio.run(main())
