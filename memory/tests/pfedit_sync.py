import asyncio, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
DB={"users":{"a@test.com":{"id":"ua1","email":"a@test.com","password":"secret123","confirmed":True}},"profiles":{"ua1":{"id":"ua1","username":"alice","display_name":"Alice A"}},"files":{}}
SESS={"access_token":"tok_ua1","refresh_token":"ref_ua1","user":{"id":"ua1","email":"a@test.com"}}
LOG="()=>{ const l=window.__mockLog.slice(window.__m0||0); window.__m0=window.__mockLog.length; return l.filter(x=>!/^select|^rpc:(my_status|my_notifications|my_friends|staff_report_count|username_available)/.test(x)).map(x=>x.slice(0,140)); }"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**p.devices['iPhone 13'])
        await ctx.add_init_script("if(!localStorage.getItem('__mock_seeded')){ localStorage.setItem('__mock_seeded','1'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Alice A',username:'alice',usernameSynced:'alice',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s); localStorage.setItem('__mock_sb_session',%s); }"%(json.dumps(json.dumps(DB)),json.dumps(json.dumps(SESS))))
        pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(6000)
        print('boot', await pg.evaluate(LOG))
        await pg.evaluate("()=>{ openProfile(); }"); await pg.wait_for_timeout(900)
        await pg.evaluate("()=>{ const b=document.querySelector('#profile [data-act=\"settings-edit-profile\"]'); b&&b.click(); }"); await pg.wait_for_timeout(900)
        print('edit open', await pg.evaluate("()=>[state.settingsEditProfile, !!document.getElementById('set-nick')]"), await pg.evaluate(LOG))
        await pg.fill('#set-nick','Alice Edited'); await pg.fill('#set-bio','new bio here'); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{ const c=document.createElement('canvas'); c.width=60; c.height=20; c.getContext('2d').fillRect(0,0,60,20); pfBannerApply(c.toDataURL('image/jpeg',.7)); }"); await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{ const b=document.querySelector('[data-act=\"tl-pick\"]'); b&&b.click(); }"); await pg.wait_for_timeout(700)
        await pg.evaluate("()=>{ const b=document.querySelector('[data-act=\"tl-tog\"]'); b&&b.click(); }"); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{ const b=document.querySelector('[data-act=\"tl-save\"]'); b&&b.click(); }"); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{ LS.set('treesh_fav_ids',(LS.get('treesh_fav_ids',[])||[])); try{ toggleFav(SONGS[0].id); }catch(e){} }")
        await pg.wait_for_timeout(5000)
        print('while editing', await pg.evaluate("()=>[state.settingsEditProfile, (state.profile.talents||{}).main, state.profile.nickname]"), await pg.evaluate(LOG))
        await pg.evaluate("()=>{ const b=document.querySelector('[data-act=\"save-profile\"]'); b&&b.click(); }"); await pg.wait_for_timeout(5000)
        print('after save', await pg.evaluate(LOG))
        print('errors', errs[:4])
        await b.close()
asyncio.run(main())
