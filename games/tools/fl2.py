import os,asyncio
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/root/pw'
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader'])
        pg=await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto('http://localhost:3000/games/frea.html');await pg.wait_for_timeout(2500)
        await pg.evaluate("FreaModes.start('flappy')");await pg.wait_for_timeout(1400);await pg.mouse.click(640,360)
        for i in range(14):
            await pg.wait_for_timeout(400)
            print(await pg.evaluate("(function(){var d=FreaModes.dbg(),p=d.player;FreaArcade3.flap();return [d.state,Math.round(p.y),p.vy.toFixed(1),!!p._out,FreaArcade3.state().F.score[p.name]]})()"))
        await b.close()
asyncio.run(main())
