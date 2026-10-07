import os,asyncio,json
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/root/pw'
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader'])
        pg=await b.new_page(viewport={'width':1280,'height':720});errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/games/frea.html');await pg.wait_for_timeout(2500)
        await pg.evaluate("window.__zenSandbox=true;FreaArenas.start('zen','living')");await pg.wait_for_timeout(2500)
        r=await pg.evaluate("""(function(){var A=__zenPlayApi,P=A.player(),o={};['candle','heart','star','discoball','present','orb'].forEach(function(t){var q=A.spawn(t);o[t]={y0:q?q.ceny:null,dx:q?Math.round(q.cenx-P.cx):null,q:q};});window._o=o;return Object.keys(o).map(function(k){return k+':'+o[k].dx;});})()""")
        print('spawn dx',r)
        await pg.wait_for_timeout(2500)
        r=await pg.evaluate("Object.keys(_o).map(function(k){var q=_o[k].q;return k+':'+Math.round(_o[k].y0)+'->'+Math.round(q.ceny);})")
        print('fall',r)
        for m in ['hns']:
            await pg.goto('http://localhost:3000/games/frea.html?hnsrole=hider');await pg.wait_for_timeout(2500)
            await pg.evaluate("localStorage.setItem('frea_hns_map','graveyard');FreaModes.start('hns')");await pg.wait_for_timeout(1400)
            await pg.mouse.click(640,360);await pg.wait_for_timeout(6000)
            print('hns',await pg.evaluate("JSON.stringify({t:FreaHnsMaps.current(),obj:FreaModes.dbg().player._objType})"))
        await pg.evaluate("FreaModes.start('flappy')");await pg.wait_for_timeout(1400);await pg.mouse.click(640,360);await pg.wait_for_timeout(3800)
        v=await pg.evaluate("(function(){FreaArcade3.flap();return FreaModes.dbg().player.vy})()");print('flap vy',v)
        await pg.evaluate("FreaModes.start('cards')");await pg.wait_for_timeout(1400);await pg.mouse.click(640,360);await pg.wait_for_timeout(4500)
        for i in range(25):
            st=await pg.evaluate("(function(){var K=FreaArcade3.state().K;return {turn:K.turn,me:K.seats.indexOf(FreaModes.dbg().player),n:K.hands.map(h=>h.length),over:K.over}})()")
            if st['over']:break
            if st['turn']==st['me']:
                ok=await pg.query_selector('#fc-ui .fc-card.ok')
                if ok:
                    await ok.click();await pg.wait_for_timeout(300)
                    pk=await pg.query_selector('[data-testid=cards-pick-cyan]')
                    if pk and await pk.is_visible(): await pk.click()
                else: await pg.click('[data-testid=cards-draw-btn]')
            await pg.wait_for_timeout(900)
        print('cards',st)
        await pg.evaluate("FreaModes.start('crumb')");await pg.wait_for_timeout(1400);await pg.mouse.click(640,360);await pg.wait_for_timeout(12000)
        print('crumb planks',await pg.evaluate("FreaArcade3.state().C.planks.length"))
        print('errs',errs[:5])
        await b.close()
asyncio.run(main())
