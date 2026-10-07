import os,asyncio
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/root/pw'
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader'])
        pg=await b.new_page(viewport={'width':1280,'height':720});errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/games/frea.html');await pg.wait_for_timeout(2500)
        await pg.evaluate("window.__zenSandbox=true;FreaArenas.start('zen','living')");await pg.wait_for_timeout(2500)
        r=await pg.evaluate("""(function(){var A=__zenPlayApi;var t=A.spawn('tv');return !!t})()""")
        await pg.wait_for_timeout(1500)
        names=await pg.evaluate("__zenPlay().actionsFor('tv')")
        print(r,names)
        await pg.evaluate("""(function(){var tv=FreaModes.dbg().platforms.filter(p=>p.deco==='tv').pop();__zenPlayApi.open(tv);})()""")
        await pg.wait_for_timeout(500)
        btn=await pg.query_selector('text=Watch & chill')
        if btn: await btn.click()
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path='zi.jpg',type='jpeg',quality=50)
        print(errs[:4])
        await b.close()
asyncio.run(main())
