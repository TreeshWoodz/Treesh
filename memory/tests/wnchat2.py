import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
LIVE = {'songs':open('/tmp/live_songs.html').read(),'lyrics':open('/tmp/live_lyrics.html').read(),'icons':open('/tmp/live_icons.html').read()}
SID = sys.argv[1]; T=float(sys.argv[2]); MOBILE=len(sys.argv)>3 and sys.argv[3]=='m'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**(p.devices['iPhone 13'] if MOBILE else {'viewport':{'width':1400,'height':850}}))
        for k,v in LIVE.items():
            def mk(v):
                async def h(route): await route.fulfill(status=200, body=v, headers={'content-type':'text/html'})
                return h
            await ctx.route(f'**/content/{k}', mk(v))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        await pg.evaluate(f"""()=>{{ lytSet('chat',true); const s=SONG_BY_ID['{SID}']; playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); }}""")
        await pg.wait_for_timeout(2500)
        await pg.evaluate(f"()=>{{ audio.currentTime={T}; }}"); await pg.wait_for_timeout(2500)
        rows = await pg.evaluate("()=>{ const w=document.querySelector('#np-lyrics [data-line-wrap=\"20\"]'); const v=document.querySelector('#np-lyrics [data-line-wrap=\"19\"]'); return (v?v.outerHTML:'none')+'\\n-----\\n'+(w?w.outerHTML:'none'); }")
        print(rows, await pg.evaluate("()=>audio.currentTime"))
        await pg.screenshot(path=f'/tmp/wnchat_{SID}.png')
        await b.close()
asyncio.run(main())
