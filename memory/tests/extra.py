import asyncio
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
async def setup(pg):
    await pg.goto('http://localhost:3000/')
    await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}")
    await pg.reload(); await pg.wait_for_timeout(3000)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        errs=[]
        # --- Mobile: non-chat style, no video btn; empty pick toast; cancel flow ---
        ctx = await b.new_context(accept_downloads=True, **p.devices['iPhone 13'])
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(('m',str(e))))
        await setup(pg)
        sid='chelly-banqz-shake-it-some-mo'
        # 1) non-chat style: lyt='classic'
        await pg.evaluate(f"()=>{{openLyricStudio('{sid}'); state.studio.picked=[10,11,12].map(i=>studioPickEntry('{sid}',i)); state.studio.lyt='classic'; openLyricStudio('{sid}');}}")
        await pg.wait_for_timeout(1200)
        print('non-chat: video count =', await pg.locator('[data-testid^=card-video]').count())
        # 2) chat style, empty picked -> toast
        await pg.evaluate(f"()=>{{openLyricStudio('{sid}'); state.studio.picked=[]; state.studio.lyt='chat'; openLyricStudio('{sid}');}}")
        await pg.wait_for_timeout(1200)
        print('chat empty: video count =', await pg.locator('[data-testid^=card-video]').count())
        if await pg.locator('[data-testid=card-video]').count():
            await pg.locator('[data-testid=card-video]').click(force=True)
            await pg.wait_for_timeout(800)
            toast = await pg.evaluate("()=>{const t=document.querySelector('.toast,[class*=toast]'); return t&&t.textContent}")
            print('empty-pick toast:', toast, 'clip-root exists?', await pg.locator('#clip-root').count())
        # 3) cancel during recording, then start another
        await pg.evaluate(f"()=>{{openLyricStudio('{sid}'); state.studio.picked=[10,11,12].map(i=>studioPickEntry('{sid}',i)); state.studio.lyt='chat'; openLyricStudio('{sid}');}}")
        await pg.wait_for_timeout(1200)
        await pg.locator('[data-testid=card-video]').click(force=True)
        await pg.wait_for_timeout(3500)
        print('rec status before cancel:', await pg.locator('[data-testid=clip-status]').text_content())
        await pg.locator('[data-testid=clip-cancel]').click(force=True); await pg.wait_for_timeout(600)
        print('after cancel #clip-root=', await pg.locator('#clip-root').count())
        # restart
        await pg.locator('[data-testid=card-video]').click(force=True); await pg.wait_for_timeout(2500)
        print('restart ok, status:', await pg.locator('[data-testid=clip-status]').text_content())
        await pg.locator('[data-testid=clip-cancel]').click(force=True); await pg.wait_for_timeout(400)
        # --- Voice perf CSS: mobile ---
        await pg.evaluate("()=>voiceOpen()"); await pg.wait_for_timeout(600)
        css_m = await pg.evaluate("()=>{const bd=document.querySelector('#voice-ov .vx-bd'); const bl=document.querySelector('.vx-blob'); return {bd: bd&&getComputedStyle(bd).backdropFilter, blob: bl&&getComputedStyle(bl).filter};}")
        print('mobile voice CSS:', css_m)
        await pg.evaluate("()=>{const b=document.querySelector('[data-testid=voice-close-button]'); b&&b.click();}")
        await ctx.close()
        # --- Desktop: non-touch voice visuals, download regression ---
        ctx = await b.new_context(viewport={'width':1400,'height':850})
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(('d',str(e))))
        await setup(pg)
        await pg.evaluate("()=>voiceOpen()"); await pg.wait_for_timeout(600)
        css_d = await pg.evaluate("()=>{const bd=document.querySelector('#voice-ov .vx-bd'); const bl=document.querySelector('.vx-blob'); return {bd: bd&&getComputedStyle(bd).backdropFilter, blob: bl&&getComputedStyle(bl).filter};}")
        print('desktop voice CSS:', css_d)
        await pg.evaluate("()=>{const b=document.querySelector('[data-testid=voice-close-button]'); b&&b.click();}")
        # regression: classic download
        await pg.evaluate(f"()=>{{openLyricStudio('{sid}'); state.studio.picked=[10,11].map(i=>studioPickEntry('{sid}',i)); state.studio.lyt='classic'; openLyricStudio('{sid}');}}")
        await pg.wait_for_timeout(1200)
        print('classic download btn count:', await pg.locator('[data-testid=card-download-side]').count())
        # check icons: no lucide CDN
        reqs=[]; pg.on('request', lambda r: reqs.append(r.url) if 'lucide' in r.url else None)
        await pg.wait_for_timeout(300)
        print('lucide requests:', [r for r in reqs if 'lucide' in r])
        print('PAGEERRORS:', errs)
        await b.close()
asyncio.run(main())
