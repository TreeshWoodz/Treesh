import os
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/root/pw'
import asyncio,sys
from playwright.async_api import async_playwright
URL='http://localhost:3000/games/frea.html'
MODES=sys.argv[1].split(',')
HIDE="var s=document.createElement('style');s.textContent='*{visibility:hidden!important}#c{visibility:visible!important}';document.head.appendChild(s);"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        for m in MODES:
            pg=await b.new_page(viewport={'width':1040,'height':780})
            q='?hnsrole=hider' if m=='hns' else ''
            await pg.goto(URL+q);await pg.wait_for_timeout(2500)
            await pg.evaluate("localStorage.setItem('frea_hns_map','mansion');try{FreaModeSettings.set('hoops','format','timed')}catch(e){}")
            if m=='zen':await pg.evaluate("window.__zenSandbox=true;FreaArenas.start('zen','sakura')")
            elif m=='house':await pg.evaluate("FreaModes.start('zen')");
            else:await pg.evaluate("FreaModes.start('%s')"%m)
            await pg.wait_for_timeout(1500)
            if m=='house':
                await pg.click('[data-testid=zen-choose-house]');await pg.wait_for_timeout(2500)
                try:await pg.click('[data-testid=house-welcome-ok]',timeout=2000)
                except Exception:pass
                await pg.wait_for_timeout(1500)
            else:
                await pg.mouse.click(520,390);await pg.wait_for_timeout(6500 if m!='hns' else 4200)
                await pg.evaluate(HIDE);await pg.wait_for_timeout(400)
            clip=None
            if m not in ('house',):
                try:
                    pos=await pg.evaluate("(function(){var d=FreaModes.dbg(),c=FreaSpectate.cam(),p=d.player;return [(p.cx-c.x)/c.W*1040,(p.cy-c.y)/c.H*780]})()")
                    cw,ch=640,480;x=max(0,min(1040-cw,pos[0]-cw/2));y=max(0,min(780-ch,pos[1]-ch*0.62))
                    clip={'x':x,'y':y,'width':cw,'height':ch}
                except Exception as e:print('noclip',m,e)
            await pg.screenshot(path='/app/games/tools/cov_%s.png'%m,clip=clip)
            await pg.close();print('ok',m,flush=True)
        await b.close()
asyncio.run(main())
