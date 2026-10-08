import asyncio, sys
from playwright.async_api import async_playwright
import shots
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/lib/chromium/chromium',args=['--autoplay-policy=no-user-gesture-required','--mute-audio'])
        for dev in ['d','m']:
            ctx=await b.new_context(**shots.DEV[dev]); await ctx.add_init_script(shots.SEED); pg=await ctx.new_page()
            await pg.goto(shots.BASE); await pg.wait_for_function("typeof navigate==='function'&&SONGS.length>0"); await pg.wait_for_timeout(1500)
            await pg.evaluate(shots.PREP)
            await pg.evaluate("async()=>{ navigate('library'); await new Promise(r=>setTimeout(r,500)); mkStart(); await new Promise(r=>setTimeout(r,500)); mkAddWidget('lyric'); await new Promise(r=>setTimeout(r,500)); __act('mk-done'); const s=__song(); playSong(s,[s]); }")
            await pg.wait_for_timeout(2500)
            r=await pg.evaluate("()=>{ const w=document.querySelector('[data-testid=mk-widget-lyric]'); if(!w) return 'none'; const blk=w.closest('[data-mk-id]')||w.parentElement; const win=w.querySelector('.ly2-win'); return {w:Math.round(w.getBoundingClientRect().height), win:Math.round(win.getBoundingClientRect().height), blk:Math.round(blk.getBoundingClientRect().height), blkCls:blk.className.slice(0,120), lines:w.querySelectorAll('.ly2-l').length}; }")
            print(dev, r)
            await pg.evaluate("()=>document.querySelector('[data-testid=mk-widget-lyric]').scrollIntoView({block:'start'})")
            await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'/tmp/ly_{dev}.png')
            await ctx.close()
        await b.close()
asyncio.run(main())
