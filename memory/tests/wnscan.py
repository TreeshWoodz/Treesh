import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
LIVE = {'songs':open('/tmp/live_songs.html').read(),'lyrics':open('/tmp/live_lyrics.html').read(),'icons':open('/tmp/live_icons.html').read()}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**p.devices['iPhone 13'])
        for k,v in LIVE.items():
            def mk(v):
                async def h(route): await route.fulfill(status=200, body=v, headers={'content-type':'text/html'})
                return h
            await ctx.route(f'**/content/{k}', mk(v))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        # all songs: any wcLines text with a bracket?
        print(await pg.evaluate("()=>SONGS.flatMap(s=>wcLines(s).filter(l=>/\\[|\\]/.test(l.text)).map(l=>s.id+': '+l.text)).slice(0,40)"))
        await b.close()
asyncio.run(main())
