import asyncio,sys,json
from playwright.async_api import async_playwright
URL='http://localhost:3000/games/frea.html'
async def main(jobs):
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        for j in jobs:
            pg=await b.new_page(viewport={'width':j.get('w',1280),'height':j.get('h',720)})
            await pg.goto(URL+j.get('q',''));await pg.wait_for_timeout(2600)
            for js in j.get('pre',[]):await pg.evaluate(js)
            await pg.evaluate(j['start']);await pg.wait_for_timeout(1400)
            await pg.mouse.click(j.get('w',1280)//2,j.get('h',720)//2);await pg.wait_for_timeout(j.get('wait',5000))
            for js in j.get('post',[]):await pg.evaluate(js);await pg.wait_for_timeout(300)
            await pg.screenshot(path=j['out'],type='jpeg',quality=j.get('qual',60))
            await pg.close()
        await b.close()
asyncio.run(main(json.loads(sys.argv[1])))
