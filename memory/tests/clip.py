import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(accept_downloads=True, **(p.devices['iPhone 13'] if MOBILE else {'viewport':{'width':1400,'height':850}}))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        pg.on('console', lambda m: print('CONSOLE', m.text) if m.type in ('warning','error') and 'tailwind' not in m.text else None)
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3000)
        sid = sys.argv[2] if len(sys.argv)>2 else 'chelly-banqz-shake-it-some-mo'
        await pg.evaluate(f"()=>{{ const id='{sid}'; openLyricStudio(id); state.studio.picked=[10,11,12].map(i=>studioPickEntry(id,i)); state.studio.lyt='chat'; openLyricStudio(id); }}"); await pg.wait_for_timeout(1500)
        sel = '[data-testid="card-video"]' if MOBILE else '[data-testid="card-video-side"]'
        print('video btn', await pg.locator(sel).count(), await pg.locator('[data-testid^="card-video"]').count())
        await pg.locator(sel).click(); await pg.wait_for_timeout(4000)
        print('status', await pg.locator('[data-testid="clip-status"]').text_content())
        await pg.screenshot(path='/tmp/clip_rec.png')
        for i in range(12):
            await pg.wait_for_timeout(1500)
            if await pg.locator('[data-testid="clip-video"]').count(): break
        print('video', await pg.locator('[data-testid="clip-video"]').count(), await pg.evaluate("()=>_clip&&{size:_clip.blob&&_clip.blob.size,type:_clip.blob&&_clip.blob.type,ext:_clip.ext,audio:_clip.audioOk,items:_clip.items.length,t0:_clip.t0}"))
        await pg.wait_for_timeout(1500)
        print('dur', await pg.evaluate("()=>{const v=document.querySelector('[data-testid=clip-video]'); return v&&[v.duration,v.videoWidth,v.videoHeight,v.readyState]}"))
        await pg.screenshot(path='/tmp/clip_done.png')
        async with pg.expect_download() as dl:
            await pg.locator('[data-testid="clip-save"]').click()
        d = await dl.value; await d.save_as('/tmp/clip_out.'+(await pg.evaluate("()=>_clip.ext")))
        print('saved', d.suggested_filename)
        await pg.locator('[data-testid="clip-close"]').click(); await pg.wait_for_timeout(400)
        print('closed', await pg.locator('#clip-root').count())
        await b.close()
asyncio.run(main())
