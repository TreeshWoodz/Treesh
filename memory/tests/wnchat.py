import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
LIVE = {'songs':open('/tmp/live_songs.html').read(),'lyrics':open('/tmp/live_lyrics.html').read(),'icons':open('/tmp/live_icons.html').read()}
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
        ids = await pg.evaluate("()=>SONGS.filter(s=>/cherry|billion/i.test(s.title)).map(s=>({id:s.id,t:s.title,a:s.artist,ids:s.artistIds,f:s.featuring,n:(s.lyrics||[]).length}))")
        print(json.dumps(ids, indent=0))
        rem = next(x['id'] for x in ids if 'Remix' in x['t'])
        print(await pg.evaluate(f"()=>wcLines(SONG_BY_ID['{rem}']).map((l,i)=>i+' '+l.t+' ['+l.sec+'] '+l.text+' by='+JSON.stringify(wcLineBy(SONG_BY_ID['{rem}'],wcLines(SONG_BY_ID['{rem}']),i))).join('\\n')"))
        ch = next(x['id'] for x in ids if x['t']=='Cherry')
        await pg.evaluate(f"""()=>{{ lytSet('chat',true); const s=SONG_BY_ID['{ch}']; playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); }}""")
        await pg.wait_for_timeout(2500)
        rows = await pg.evaluate("()=>[...document.querySelectorAll('#np-lyrics .wc-row')].map(r=>(r.querySelector('.wc-name')||{}).textContent+' | '+((r.querySelector('.wc-av img')||{}).src||'INI:'+(r.querySelector('.wc-av b')||{}).textContent)+' | '+(r.querySelector('.np-line')||{}).textContent).slice(0,60).join('\\n')")
        print(rows)
        await pg.screenshot(path='/tmp/wnchat_cherry.png')
        await b.close()
asyncio.run(main())
