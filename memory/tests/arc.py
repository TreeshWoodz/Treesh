import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**(p.devices['iPhone 13'] if MOBILE else {'viewport':{'width':1400,'height':850}}))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        await pg.evaluate("()=>{ state.view='game'; state.gameTab='games'; renderView(true); }"); await pg.wait_for_timeout(1200)
        await pg.locator('[data-testid="games-arcade"]').scroll_into_view_if_needed(); await pg.wait_for_timeout(800)
        sfx = 'm' if MOBILE else 'd'
        await pg.screenshot(path=f'/tmp/arc_{sfx}_all.png')
        cnt = lambda: pg.evaluate("()=>[...document.querySelectorAll('#arf-grid [data-testid^=game-open-]')].map(e=>e.dataset.key).join(',')")
        print('all', await cnt())
        for f in ['updated','new','soon','most','az']:
            await pg.locator(f'[data-testid="arcade-filter-{f}"]').click(); await pg.wait_for_timeout(400); print(f, await cnt(), await pg.locator('[data-testid="arcade-empty"]').count())
        await pg.locator('[data-testid="arcade-filter-all"]').click(); await pg.wait_for_timeout(300)
        await pg.locator('[data-testid="arcade-filter-age"]').click(); await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'/tmp/arc_{sfx}_age.png')
        await pg.locator('[data-testid="arcade-age-13plus"]').click(); await pg.wait_for_timeout(400); print('13+', await cnt())
        await pg.locator('[data-testid="arcade-filter-age"]').click(); await pg.wait_for_timeout(300); await pg.locator('[data-testid="arcade-age-6plus"]').click(); await pg.wait_for_timeout(300); print('6+', await cnt())
        await pg.locator('[data-testid="arcade-filter-age"]').click(); await pg.wait_for_timeout(300); await pg.locator('[data-testid="arcade-age-any"]').click(); await pg.wait_for_timeout(300)
        await pg.locator('[data-testid="arcade-search"]').fill('caught'); await pg.wait_for_timeout(300); print('q caught', await cnt())
        await pg.locator('[data-testid="arcade-search"]').fill('zzz'); await pg.wait_for_timeout(300); print('q zzz empty', await pg.locator('[data-testid="arcade-empty"]').count())
        await pg.screenshot(path=f'/tmp/arc_{sfx}_empty.png')
        await pg.locator('[data-testid="arcade-empty-reset"]').click(); await pg.wait_for_timeout(300); print('reset', await cnt())
        print('dgc soon?', await pg.locator('[data-testid="game-soon-badge-dgc"]').count(), 'notify chip', await pg.locator('[data-testid="game-notify-dgc"]').count())
        await pg.locator('[data-testid="game-open-dgc"]').scroll_into_view_if_needed()
        await pg.screenshot(path=f'/tmp/arc_{sfx}_dgc.png')
        await pg.evaluate("()=>openGameInfo('dgc')"); await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'/tmp/arc_{sfx}_info.png')
        print('play btn', await pg.locator('[data-testid="game-info-play-dgc"]').count())
        await pg.locator('[data-testid="game-info-play-dgc"]').click(); await pg.wait_for_timeout(1500)
        print('frame', await pg.evaluate("()=>state.gameFrame&&state.gameFrame.url"), await pg.evaluate("()=>localStorage.getItem('treesh_arcade_plays')"))
        await pg.screenshot(path=f'/tmp/arc_{sfx}_frame.png')
        await pg.evaluate("()=>{ closeGameFrame&&closeGameFrame(); }")
        await b.close()
asyncio.run(main())
