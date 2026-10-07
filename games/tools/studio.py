import os,asyncio
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/root/pw'
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader'])
        pg=await b.new_page(viewport={'width':1280,'height':800});errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/games/frea.html');await pg.wait_for_timeout(2500)
        await pg.evaluate("FreaBalls.open(false)");await pg.wait_for_timeout(800)
        await pg.click('[data-testid=ball-style-neon]');await pg.wait_for_timeout(500)
        await pg.screenshot(path='st1.jpg',type='jpeg',quality=50)
        await pg.click('[data-testid=studio-tab-hoop]');await pg.click('[data-testid=hoop-style-gold]');await pg.wait_for_timeout(400)
        await pg.screenshot(path='st2.jpg',type='jpeg',quality=50)
        print(errs[:5])
        await b.close()
asyncio.run(main())
