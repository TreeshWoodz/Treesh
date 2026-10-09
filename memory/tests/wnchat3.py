import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
LIVE = {'songs':open('/tmp/live_songs.dot.html').read(),'lyrics':open('/tmp/live_lyrics.dot.html').read(),'icons':open('/tmp/live_icons.dot.html').read()}
ROWS="()=>[...document.querySelectorAll('#np-lyrics .wc-row, #np-lyrics .lyt-sec')].map(r=>r.classList.contains('lyt-sec')?'SEC '+r.textContent.trim().slice(0,40)+' vis='+(getComputedStyle(r).display!=='none'):(r.querySelector('.wc-name')||{}).textContent+' | '+((r.querySelector('.wc-av img')||{}).src?'IMG':'INI:'+(r.querySelector('.wc-av b')||{}).textContent)+' | '+((r.querySelector('.np-line')||{}).textContent||'').slice(0,50)).join('\\n')"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width':1400,'height':850})
        for k,v in LIVE.items():
            def mk(v):
                async def h(route): await route.fulfill(status=200, body=v, headers={'content-type':'text/html'})
                return h
            await ctx.route(f'**/content/{k}', mk(v))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        for t in ['Billion $ Bitch (Remix)','Pretty In My Hands']:
            sid = await pg.evaluate(f"()=>SONGS.find(s=>s.title==={json.dumps(t)}).id")
            await pg.evaluate(f"""()=>{{ lytSet('chat',true); const s=SONG_BY_ID['{sid}']; playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); }}""")
            await pg.wait_for_timeout(2000)
            print('=====',t); print(await pg.evaluate(ROWS))
        # game for Cherry
        sid = await pg.evaluate("()=>SONGS.find(s=>s.title==='Cherry').id")
        print('crew', await pg.evaluate(f"()=>{{ state.npOpen=false; startGame('{sid}'); return wcCrew(state.game).map(p=>p.artist+'|'+wcWho(p)); }}"))
        await pg.wait_for_timeout(6000)
        print(await pg.evaluate("()=>[...document.querySelectorAll('[data-game-root] .wc-row.is-a')].map(r=>(r.dataset.who)+' '+((r.querySelector('.wc-name')||{}).textContent||'')+' '+((r.querySelector('.wc-b')||{}).textContent||'').slice(0,40)).join('\\n')"))
        await pg.screenshot(path='/tmp/wn_cherry_game.png')
        await b.close()
asyncio.run(main())
