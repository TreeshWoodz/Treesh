import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
LIVE = {'songs':open('/tmp/live_songs.html').read(),'lyrics':open('/tmp/live_lyrics.html').read(),'icons':open('/tmp/live_icons.html').read()}
TG = sys.argv[1] if len(sys.argv)>1 else '20,21'
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
        await pg.evaluate("""(tg)=>{ const _p=wcPickTargets; wcPickTargets=()=>tg.split(',').map(Number); startGame('prettyboyquen-billion-bitch-remix'); wcPickTargets=_p; }""", TG)
        for i in range(14):
            await pg.wait_for_timeout(2500)
            st = await pg.evaluate("()=>({ph:state.game&&state.game.phase, r:state.game&&state.game.round, t:(window._wnA||{}).currentTime})")
            if st['ph']=='input':
                await pg.evaluate("()=>{ submitAnswer('',''); }")
            if st['ph']=='done':
                await pg.evaluate("()=>gameNext()")
            if st['ph']=='end': break
        rows = await pg.evaluate("()=>[...document.querySelectorAll('#wc-thread > *')].map(r=>r.className.split(' ')[0]+' | '+((r.querySelector('.wc-name')||{}).textContent||'')+' | '+(r.querySelector('.wc-b,.wc-emoji')||r).textContent.trim().slice(0,90)).join('\\n')")
        print(rows)
        await b.close()
asyncio.run(main())
