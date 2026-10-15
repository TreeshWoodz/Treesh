import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
TAG='m' if MOBILE else 'd'
TXT = "[Intro]\nYeah yeah\n\n[Hook: Chelly]\nWe up all night\nLights on bright\n\n[Verse 1: Chelly]\nFirst line here\nSecond line here\nThird one\n\n[Hook: Sav]\nWe up all night\nLights on bright\n\n[Verse 2: Sav]\nThird line\nFourth line\n\n[Bridge]\nSlow it down\n\n[Hook]\nWe up all night\n\n[Outro]\nBye"
ok=0; bad=0
def chk(n,c,x=''):
    global ok,bad
    if c: ok+=1; print('PASS',n,x)
    else: bad+=1; print('FAIL',n,x)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**(p.devices['iPhone 13'] if MOBILE else {'viewport':{'width':1400,'height':850}}))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_seen','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); ['treesh_lsv_group','treesh_lsv_layout','treesh_lsv_zoom'].forEach(k=>localStorage.removeItem(k));}"); await pg.reload(); await pg.wait_for_timeout(3000)
        await pg.evaluate("()=>{ openLyricBlank(null); state.ls.title='Zoom test'; }"); await pg.wait_for_timeout(1000)
        await pg.evaluate("(t)=>{ const ta=document.getElementById('ls-write'); ta.value=lsMdToTa(t); ta.dispatchEvent(new Event('input',{bubbles:true})); }", TXT)
        await pg.locator('[data-testid=ls-verses-open]').click(); await pg.wait_for_timeout(900)
        tr = pg.locator('[data-testid=lsv-track]')
        if not MOBILE:
            await tr.hover(position={'x':300,'y':200}); await pg.mouse.wheel(0,600); await pg.wait_for_timeout(300)
            chk('mouse wheel scrolls sideways', await pg.evaluate("()=>document.querySelector('#lsv .lsv-track').scrollLeft")>200)
            await pg.keyboard.down('Control'); await pg.mouse.wheel(0,120); await pg.keyboard.up('Control'); await pg.wait_for_timeout(300)
            z = await pg.evaluate("()=>state.lsv.zoom"); chk('ctrl+wheel zooms out gently', 0.7<z<1, z)
        else:
            cdp = await ctx.new_cdp_session(pg)
            box = await tr.bounding_box(); cx=box['x']+box['width']/2; cy=box['y']+box['height']/2
            async def touch(t, pts): await cdp.send('Input.dispatchTouchEvent', {'type':t,'touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
            await touch('touchStart',[(cx-100,cy),(cx+100,cy)])
            for k in range(1,8): await touch('touchMove',[(cx-100+k*11,cy),(cx+100-k*11,cy)]); await pg.wait_for_timeout(30)
            await touch('touchEnd',[]); await pg.wait_for_timeout(300)
            z = await pg.evaluate("()=>state.lsv.zoom"); chk('pinch in zooms out', z<0.7, z)
            await pg.screenshot(path=f'/tmp/lsvz_{TAG}_pinch.png')
        if MOBILE:
            chk('mobile hides +/- (pinch instead)', not await pg.locator('[data-testid=lsv-zoom-in]').is_visible())
            await pg.evaluate("()=>lsvAct('lsv-zoom',{dataset:{d:'1'}})")
        else: await pg.locator('[data-testid=lsv-zoom-in]').click()
        await pg.wait_for_timeout(200)
        z2 = await pg.evaluate("()=>state.lsv.zoom"); chk('zoom in button', z2>z, (z,z2))
        await pg.locator('[data-testid=lsv-zoom-fit]').click(); await pg.wait_for_timeout(400)
        r = await pg.evaluate("()=>{ const t=document.querySelector('#lsv .lsv-track'); return [t.scrollWidth,t.clientWidth,state.lsv.zoom, document.querySelector('[data-testid=lsv-zoom-value]').textContent] }")
        chk('fit shows all side by side', r[0]<=r[1]+2 or r[2]==0.35, r)
        await pg.screenshot(path=f'/tmp/lsvz_{TAG}_fit.png')
        await pg.locator('[data-testid=lsv-layout-grid]').click(); await pg.wait_for_timeout(800)
        n = await pg.evaluate("()=>document.querySelectorAll('#lsv .lsv-flow path').length")
        chk('grid draws connections between all sections', n==7, n)
        await pg.locator('[data-testid=lsv-zoom-fit]').click(); await pg.wait_for_timeout(600)
        r = await pg.evaluate("()=>{ const t=document.querySelector('#lsv .lsv-track'); return [t.scrollHeight,t.clientHeight,state.lsv.zoom] }")
        chk('grid fit', r[0]<=r[1]+2 or r[2]==0.35, r)
        # connector endpoints line up with cards at this zoom
        al = await pg.evaluate("""()=>{ const zl=document.querySelector('#lsv .lsv-z'), svg=zl.querySelector('.lsv-links'); const p=svg.querySelector('.lsv-flow path'); const bb=p.getBoundingClientRect(); const c0=zl.querySelector('[data-testid=lsv-card-0]').getBoundingClientRect(); return {pathL:Math.round(bb.left), card0R:Math.round(c0.right), pathT:Math.round(bb.top), c0T:Math.round(c0.top), c0B:Math.round(c0.bottom)}; }""")
        chk('links aligned with cards when zoomed', abs(al['pathL']-al['card0R'])<14 or (al['pathT']>=al['c0T']-4 and al['pathT']<=al['c0B']+14), al)
        await pg.screenshot(path=f'/tmp/lsvz_{TAG}_grid.png')
        if not MOBILE:
            await pg.locator('[data-testid=lsv-card-1]').hover(); await pg.wait_for_timeout(300)
            k = await pg.evaluate("()=>[document.querySelectorAll('#lsv .lsv-card.is-kin').length, document.querySelectorAll('#lsv .lsv-kinl path').length]")
            chk('hover shows related hooks', k[0]==3 and k[1]==2, k)
            await pg.screenshot(path=f'/tmp/lsvz_{TAG}_kin.png')
        await pg.evaluate("()=>{ lsvAct('lsv-zoom',{dataset:{d:'1'}}); lsvAct('lsv-zoom',{dataset:{d:'1'}}); }"); await pg.wait_for_timeout(300)
        await pg.locator('[data-testid=lsv-group-artist]').click(); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'/tmp/lsvz_{TAG}_gridartist.png')
        await pg.locator('[data-testid=lsv-close]').click(); await pg.wait_for_timeout(500)
        await pg.locator('[data-testid=ls-verses-open]').click(); await pg.wait_for_timeout(700)
        chk('layout + zoom remembered', await pg.evaluate("()=>state.lsv.layout==='grid' && Math.abs(state.lsv.zoom-+localStorage.getItem('treesh_lsv_zoom'))<.01"))
        await b.close()
    print('RESULT',ok,'pass',bad,'fail')
asyncio.run(main())
