import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**(p.devices['iPhone 13'] if MOBILE else {'viewport':{'width':1400,'height':850}}))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        multi = await pg.evaluate("()=>SONGS.filter(s=>lytMulti(s)).map(s=>s.id)")
        print('multi', len(multi), multi[:5], 'duetOn', await pg.evaluate("()=>duetOn()"))
        sid = multi[0]
        await pg.evaluate(f"""()=>{{ const s=SONG_BY_ID['{sid}']; playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); }}""")
        await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{ audio.currentTime=25; }"); await pg.wait_for_timeout(3000)
        await pg.evaluate("()=>{ lytSet('type',true); }"); await pg.wait_for_timeout(2500)
        await pg.evaluate("()=>{ lytSet('neon',true); }"); await pg.wait_for_timeout(2500)
        print('toasts newsong', await pg.evaluate("()=>[...document.querySelectorAll('body *')].filter(e=>e.children.length===0&&/New song discovered/.test(e.textContent)).length"), 'log', await pg.evaluate("()=>(state.stars.log||[]).filter(x=>x.r==='New song discovered').length"), 'saved', await pg.evaluate(f"()=>!!(JSON.parse(localStorage.getItem('treesh_stars')).newSongs||{{}})['{sid}']"))
        print('k-duo lines (off)', await pg.evaluate("()=>document.querySelectorAll('#np-lyrics .k-duo').length"))
        await pg.evaluate("()=>{ lytSet('classic',true); }"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=f'/tmp/duet_{"m" if MOBILE else "d"}_off.png')
        await pg.evaluate("()=>lytOpen()"); await pg.wait_for_timeout(700)
        print('duet toggle', await pg.locator('[data-testid="lyt-duet-toggle"]').count())
        await pg.locator('[data-testid="lyt-duet-toggle"]').click(force=True); await pg.wait_for_timeout(800)
        print('k-duo lines (on)', await pg.evaluate("()=>document.querySelectorAll('#np-lyrics .k-duo').length"), await pg.evaluate("()=>localStorage.getItem('treesh_duet_colors')"))
        await pg.locator('[data-testid="lyt-close"]').click(force=True); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'/tmp/duet_{"m" if MOBILE else "d"}_on.png')
        for t in ['chat','type','note','comic','pola','term']:
            await pg.evaluate(f"()=>{{ lytSet('{t}',true); }}"); await pg.wait_for_timeout(1500)
            await pg.screenshot(path=f'/tmp/nobox_{"m" if MOBILE else "d"}_{t}.png')
        await b.close()
asyncio.run(main())
