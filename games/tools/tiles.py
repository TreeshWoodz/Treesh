import os,asyncio
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/root/pw'
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader'])
        pg=await b.new_page(viewport={'width':1280,'height':800})
        await pg.goto('http://localhost:3000/games/frea.html');await pg.wait_for_timeout(5000)
        r=await pg.evaluate("""[...document.querySelectorAll('.mode-chip[data-mode]')].map(c=>{var i=c.querySelector('img');return c.dataset.mode+':'+(i?(i.src.slice(0,22)+'..'+i.src.length):'noimg')})""")
        print(r)
        await pg.evaluate("var m=document.querySelector('#mode-modal,[data-testid=mode-picker-modal]');if(m)m.classList.add('open');")
        await b.close()
asyncio.run(main())
