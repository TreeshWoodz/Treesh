import asyncio, sys, json, time
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**(p.devices['iPhone 13'] if MOBILE else {'viewport':{'width':1280,'height':800}}))
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: print('PAGEERR', e))
        pg.on('console', lambda m: print('CONSOLE', m.text) if 'res' in m.text.lower() else None)
        await pg.goto('http://localhost:3000/')
        await pg.evaluate("""()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));
          localStorage.setItem('treesh_resume', JSON.stringify({id:'chelly-banqz-shake-it-some-mo',t:64.2,q:['chelly-banqz-shake-it-some-mo'],b:null,at:Date.now()})); }""")
        await pg.reload(); await pg.wait_for_timeout(4000)
        st="()=>({song:(curSong()||{}).title, ct:+(audio.currentTime||0).toFixed(1), rs:audio.readyState, paused:audio.paused, cur:state.currentTime, mini:(document.getElementById('mini-prog')||{style:{}}).style.width, miniTxt:(document.querySelector('#mini')||{}).innerText, res:localStorage.getItem('treesh_resume')})"
        print('startup', await pg.evaluate(st))
        btn = pg.locator('#mini [data-act="toggle-play"], #mini [data-testid*="play"]').first
        print('btn', await btn.count())
        if await btn.count():
            if MOBILE: await btn.tap()
            else: await btn.click()
        await pg.wait_for_timeout(3000)
        print('after play', await pg.evaluate(st))
        await pg.screenshot(path='/tmp/res.png')
        await b.close()
asyncio.run(main())
