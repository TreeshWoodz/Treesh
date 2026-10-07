import os,asyncio
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/root/pw'
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader'])
        pg=await b.new_page(viewport={'width':1280,'height':760});errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/games/frea.html');await pg.wait_for_timeout(2500)
        await pg.evaluate("FreaModes.start('zen')");await pg.wait_for_timeout(1200)
        await pg.screenshot(path='zc1.jpg',type='jpeg',quality=50)
        await pg.click('[data-testid=zen-choose-house]');await pg.wait_for_timeout(2500)
        try: await pg.click('[data-testid=house-welcome-ok]',timeout=1500)
        except Exception: pass
        await pg.wait_for_timeout(800)
        await pg.click('[data-testid=house-party-btn]');await pg.wait_for_timeout(1500)
        await pg.click('[data-testid=house-goals-btn]');await pg.wait_for_timeout(600)
        await pg.screenshot(path='zc2.jpg',type='jpeg',quality=50)
        print(errs[:4])
        await b.close()
asyncio.run(main())
