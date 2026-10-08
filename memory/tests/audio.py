import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
SEED = """()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"""
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**(p.devices['iPhone 13'] if MOBILE else {'viewport':{'width':1280,'height':800}}))
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate(SEED); await pg.reload(); await pg.wait_for_timeout(3500)
        sid = await pg.evaluate("""()=>{ const s=SONGS.find(x=>(x.lyrics||[]).filter(l=>typeof l.t==='number'&&l.t>0).length>10); playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); return s.id+' '+s.title; }""")
        print('song', sid)
        await pg.wait_for_timeout(4000)
        st = "()=>({ct:+audio.currentTime.toFixed(2), paused:audio.paused, seek:(document.getElementById('np-seek')||{}).value, mini:(document.getElementById('mini-prog')||{style:{}}).style.width, ae:document.activeElement&&document.activeElement.id})"
        print('after 4s', await pg.evaluate(st))
        seek = pg.locator('#np-seek')
        if await seek.count():
            bb = await seek.bounding_box()
            if MOBILE: await pg.touchscreen.tap(bb['x']+bb['width']*0.5, bb['y']+bb['height']/2)
            else: await pg.mouse.click(bb['x']+bb['width']*0.5, bb['y']+bb['height']/2)
            await pg.wait_for_timeout(300); print('after seek tap', await pg.evaluate(st))
            await pg.wait_for_timeout(3000); print('3s later', await pg.evaluate(st))
        # lyric tap
        info = await pg.evaluate("""()=>{ const b=[...document.querySelectorAll('#np-lyrics [data-act="lyric-seek"],#np-lyrics [data-act="lyric-detail"]')]; return b.slice(0,40).map(x=>x.dataset.act+':'+x.dataset.t).join(' '); }""")
        print('lines', info[:400])
        ln = pg.locator('#np-lyrics [data-act="lyric-seek"], #np-lyrics [data-act="lyric-detail"]').nth(8)
        if await ln.count():
            t = await ln.get_attribute('data-t'); await ln.scroll_into_view_if_needed()
            if MOBILE: await ln.tap()
            else: await ln.click()
            await pg.wait_for_timeout(500); print('lyric tap target t', t, await pg.evaluate(st))
        await pg.wait_for_timeout(3000)
        print('before reload', await pg.evaluate(st), await pg.evaluate("()=>localStorage.getItem('treesh_resume')||Object.keys(localStorage).filter(k=>/res/.test(k)).join(',')"))
        await pg.reload(); await pg.wait_for_timeout(4000)
        print('after reload', await pg.evaluate("()=>({song:(curSong()||{}).title, ct:audio.currentTime, src:!!audio.src, mini:!!document.querySelector('#mini [data-testid]'), dur:state.duration, cur:state.currentTime})"))
        await pg.screenshot(path='/tmp/a1.png')
        await b.close()
asyncio.run(main())
