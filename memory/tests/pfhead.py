import asyncio
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        pg = await (await b.new_context(**p.devices['iPhone 13'])).new_page()
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3000)
        await pg.locator('[data-testid="nav-mobile-profile"]').tap(); await pg.wait_for_timeout(1200)
        print(await pg.evaluate("""()=>{ const p=document.getElementById('profile-panel'); const bs=[...p.querySelectorAll('button')].filter(b=>{const r=b.getBoundingClientRect(); return r.top<80&&r.width>0;}); return bs.map(b=>{const r=b.getBoundingClientRect(); return [b.dataset.testid||b.dataset.act, Math.round(r.left), Math.round(r.right), b.parentElement.className.slice(0,80), getComputedStyle(b).position]; }); }"""))
        await b.close()
asyncio.run(main())
