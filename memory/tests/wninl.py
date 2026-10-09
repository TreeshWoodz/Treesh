import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
LIVE = {'songs':open('/tmp/live_songs.html').read(),'lyrics':open('/tmp/live_lyrics.html').read(),'icons':open('/tmp/live_icons.html').read()}
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
SID = sys.argv[2] if len(sys.argv)>2 else 'marq-c-cherry'
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
        pg.on('console', lambda m: print('CONSOLE', m.text) if m.type in ('error',) else None)
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('treesh_game_opts', JSON.stringify({rounds:3}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        await pg.evaluate(f"""()=>{{ lytSet('chat',true); const s=SONG_BY_ID['{SID}']; playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); }}""")
        await pg.wait_for_timeout(2500)
        await pg.evaluate("()=>{ audio.currentTime=30; audio.play().catch(()=>{}); }"); await pg.wait_for_timeout(1500)
        btn = '[data-testid="lyt-wn-play-button"]' if MOBILE else '[data-testid="lyt-wn-play-button-d"]'
        print('btn visible', await pg.locator(btn).is_visible(), 'cta', await pg.locator('[data-testid="lyt-chat-play-wn"]').count())
        t0 = await pg.evaluate("()=>({t:audio.currentTime, paused:audio.paused})"); print('before', t0)
        await pg.click(btn); await pg.wait_for_timeout(1200)
        info = await pg.evaluate("""()=>{ const r=document.querySelector('[data-testid="game-inline"]'); const reg=document.getElementById('np-lyric-region'); const anc=[]; let e=reg; while(e&&e!==document.body){ const cs=getComputedStyle(e); if(cs.transform!=='none'||cs.filter!=='none'||cs.backdropFilter!=='none'||cs.willChange.includes('transform')||cs.contain!=='none') anc.push((e.id||e.className.slice(0,40))+' t='+cs.transform+' f='+cs.filter+' bf='+cs.backdropFilter+' wc='+cs.willChange+' c='+cs.contain); e=e.parentElement; }
          return {inline:!!r, inRegion:!!(r&&r.parentNode===reg), npOn:!!document.querySelector('.np-wn-on'), modal:document.getElementById('modal').children.length, paused:audio.paused, name:(document.querySelector('[data-testid="game-artist-name"]')||{}).textContent, foot:getComputedStyle(document.querySelector('.np9-lyr-foot')).display, rect:r&&r.getBoundingClientRect().toJSON(), anc, hist:history.state} }""")
        print(json.dumps(info, indent=0))
        await pg.wait_for_timeout(6000)
        await pg.screenshot(path=f'/tmp/wninl_{"m" if MOBILE else "d"}_1.png')
        rows = await pg.evaluate("()=>[...document.querySelectorAll('#wc-thread .wc-row')].map(r=>((r.querySelector('.wc-name')||{}).textContent||'me')+' | '+((r.querySelector('.wc-av img')||{}).src?'IMG':'INI:'+(r.querySelector('.wc-av b')||{}).textContent)+' | '+(r.querySelector('.wc-b,.wc-emoji')||r).textContent.trim().slice(0,60)).join('\\n')")
        print(rows)
        # rerender NP while game runs: the game must survive
        await pg.evaluate("()=>renderNP()"); await pg.wait_for_timeout(500)
        print('after renderNP', await pg.evaluate("()=>({inline:!!document.querySelector('#np-lyric-region > [data-testid=\"game-inline\"]'), npOn:!!document.querySelector('.np-wn-on'), game:!!state.game})"))
        for i in range(30):
            st = await pg.evaluate("()=>state.game&&state.game.phase")
            if st=='input': await pg.evaluate("()=>submitAnswer('','')")
            elif st=='done': await pg.evaluate("()=>gameNext()")
            elif st=='end': break
            await pg.wait_for_timeout(1500)
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'/tmp/wninl_{"m" if MOBILE else "d"}_2.png')
        print('end card', await pg.locator('[data-testid="game-end-card"]').count())
        # play again stays inline
        await pg.click('[data-testid="game-again"]'); await pg.wait_for_timeout(1500)
        print('again', await pg.evaluate("()=>({inline:!!document.querySelector('#np-lyric-region > [data-testid=\"game-inline\"]'), modal:document.getElementById('modal').children.length, game:!!(state.game&&state.game.inline)})"))
        # back button ends it and music resumes
        await pg.evaluate("()=>history.back()"); await pg.wait_for_timeout(1200)
        print('after back', await pg.evaluate("()=>({inline:!!document.querySelector('[data-testid=\"game-inline\"]'), game:!!state.game, npOn:!!document.querySelector('.np-wn-on'), paused:audio.paused, t:audio.currentTime, np:state.npOpen, lyrics:getComputedStyle(document.getElementById('np-lyrics')).visibility})"))
        # start again and close with the header button
        await pg.click(btn); await pg.wait_for_timeout(1500)
        await pg.click('[data-testid="game-inline"] [data-testid="game-close-button"]'); await pg.wait_for_timeout(800)
        print('after close', await pg.evaluate("()=>({inline:!!document.querySelector('[data-testid=\"game-inline\"]'), game:!!state.game, paused:audio.paused, hist:history.state})"))
        await pg.screenshot(path=f'/tmp/wninl_{"m" if MOBILE else "d"}_3.png')
        await b.close()
asyncio.run(main())
