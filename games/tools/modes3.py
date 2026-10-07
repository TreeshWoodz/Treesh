import os,asyncio,sys
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/root/pw'
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader'])
        for m in sys.argv[1].split(','):
            pg=await b.new_page(viewport={'width':1280,'height':720});errs=[]
            pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto('http://localhost:3000/games/frea.html');await pg.wait_for_timeout(2500)
            if m=='lobby':
                await pg.screenshot(path='m_lobby.jpg',type='jpeg',quality=45);print(m,errs[:3]);continue
            await pg.evaluate("FreaModes.start('%s')"%m);await pg.wait_for_timeout(1500)
            await pg.mouse.click(640,300);await pg.wait_for_timeout(4200)
            if m=='flappy':
                for i in range(12):
                    await pg.mouse.click(640,300);await pg.wait_for_timeout(260)
            else: await pg.wait_for_timeout(3000)
            await pg.screenshot(path='m_%s.jpg'%m,type='jpeg',quality=45)
            print(m,errs[:3],await pg.evaluate("FreaModes.dbg().state"))
            await pg.close()
        await b.close()
asyncio.run(main())
