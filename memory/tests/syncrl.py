import asyncio, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
DB={"users":{"a@test.com":{"id":"ua1","email":"a@test.com","password":"secret123","confirmed":True}},"profiles":{"ua1":{"id":"ua1","username":"alice","display_name":"Alice A"}},"files":{}}
SESS={"access_token":"tok_ua1","refresh_token":"ref_ua1","user":{"id":"ua1","email":"a@test.com"}}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**p.devices['iPhone 13'])
        await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){ sessionStorage.setItem('seeded','1'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s); localStorage.setItem('__mock_sb_session',%s); }"%(json.dumps(json.dumps(DB)),json.dumps(json.dumps(SESS))))
        pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(5000)
        await pg.mouse.click(200,300); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{ window.__mark=1; sessionStorage.removeItem('treesh_sb_rl'); openLyricStudio('chelly-banqz-shake-it-some-mo'); }"); await pg.wait_for_timeout(800)
        await pg.evaluate("()=>sbReload()"); await pg.wait_for_timeout(1500)
        print('after sbReload', await pg.evaluate("()=>[window.__mark, _sbRLWait, [...document.querySelectorAll('#ntb-root .ntb .ntb-t')].map(x=>x.textContent), !!document.querySelector('[data-testid=\"notification-banner-action-refresh\"]'), !!document.querySelector('#modal [data-studio-root]')]"))
        await pg.evaluate("()=>{ Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}); document.dispatchEvent(new Event('visibilitychange')); }")
        await pg.wait_for_timeout(4000)
        print('after hidden', await pg.evaluate("()=>[window.__mark||0, typeof _sbRLWait!=='undefined'?_sbRLWait:null, ntAll().filter(x=>x.kind==='sync').length]"))
        print('errors', errs[:4])
        await b.close()
asyncio.run(main())
