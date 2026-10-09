import asyncio, json, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
DB={"users":{"a@test.com":{"id":"ua1","email":"a@test.com","password":"secret123","confirmed":True}},"profiles":{"ua1":{"id":"ua1","username":"alice","display_name":"Alice A"}},"files":{}}
SESS={"access_token":"tok_ua1","refresh_token":"ref_ua1","user":{"id":"ua1","email":"a@test.com"}}
TAG=sys.argv[1] if len(sys.argv)>1 else 'cur'
async def run(p,dev):
    b = await p.chromium.launch(executable_path=EXE)
    ctx = await (b.new_context(**p.devices['iPhone 13']) if dev=='m' else b.new_context(viewport={'width':1400,'height':850}))
    await ctx.add_init_script("if(!localStorage.getItem('__mock_seeded')){ localStorage.setItem('__mock_seeded','1'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Alice A',username:'alice',usernameSynced:'alice',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s); localStorage.setItem('__mock_sb_session',%s); }"%(json.dumps(json.dumps(DB)),json.dumps(json.dumps(SESS))))
    pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(5000)
    await pg.evaluate("()=>openProfile()"); await pg.wait_for_timeout(1200)
    await pg.screenshot(path=f'/app/memory/tests/pftop_{TAG}_{dev}.jpg', quality=40)
    print(dev, await pg.evaluate("()=>[...document.querySelectorAll('#profile-panel button,#profile-panel label')].filter(e=>e.getBoundingClientRect().top<420&&e.offsetParent).map(e=>(e.dataset.testid||'')+'|'+(e.dataset.act||'')+'|'+(e.textContent||'').trim().slice(0,20))"))
    await pg.evaluate("()=>{ const b=document.querySelector('#profile [data-act=\"settings-edit-profile\"]'); b&&b.click(); }"); await pg.wait_for_timeout(1000)
    await pg.screenshot(path=f'/app/memory/tests/pfedit_{TAG}_{dev}.jpg', quality=40)
    print(dev,'edit banner', await pg.evaluate("()=>{ const r=document.querySelector('[data-testid=profile-banner-edit]').getBoundingClientRect(); return [r.width,r.height]; }"), 'style card', await pg.evaluate("()=>!!document.querySelector('[data-testid=profile-edit-style-button]')"))
    await pg.evaluate("()=>{ const b=document.querySelector('[data-testid=settings-cancel-profile-button]'); b&&b.click(); }"); await pg.wait_for_timeout(700)
    print(dev,'view banner', await pg.evaluate("()=>{ const r=document.querySelector('[data-testid=profile-banner]').getBoundingClientRect(); return [r.width,r.height]; }"))
    await pg.evaluate("()=>{ document.querySelector('[data-act=pf-preview]').click(); }"); await pg.wait_for_timeout(1500)
    print(dev,'visitor banner', await pg.evaluate("()=>{ const r=document.querySelector('#sx-root .sx-banner').getBoundingClientRect(); return [r.width,r.height, !!document.querySelector('[data-testid=profile-preview-bar]'), document.querySelector('#sx-root [data-testid=uprof-name]')&&document.querySelector('#sx-root [data-testid=uprof-name]').textContent]; }"))
    await pg.screenshot(path=f'/app/memory/tests/pfprev_{TAG}_{dev}.jpg', quality=40)
    print(dev,'errors', errs[:4])
    await b.close()
async def main():
    async with async_playwright() as p:
        await run(p,'m'); await run(p,'d')
asyncio.run(main())
