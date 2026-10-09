import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
DB={"users":{"a@test.com":{"id":"ua1","email":"a@test.com","password":"secret123","confirmed":True},"b@test.com":{"id":"ub1","email":"b@test.com","password":"secret123","confirmed":True},"s@test.com":{"id":"us1","email":"s@test.com","password":"secret123","confirmed":True}},
    "profiles":{"ua1":{"id":"ua1","username":"alice","display_name":"Alice A"},"ub1":{"id":"ub1","username":"bobby","display_name":"Bobby B"},"us1":{"id":"us1","username":"staffy","display_name":"Staff S"}},"files":{},"mod":{"us1":{"role":"admin"}}}
SESS={"access_token":"tok_ua1","refresh_token":"ref_ua1","user":{"id":"ua1","email":"a@test.com"}}
STATE="""()=>{ const r=document.getElementById('ntb-root'); return {bell:!!document.querySelector('[data-testid="header-notifications-bell-btn"]'),badge:(document.querySelector('[data-testid="notifications-unread-badge"]')||{}).textContent,badgeHidden:(document.querySelector('[data-testid="notifications-unread-badge"]')||{}).hidden,
 banners:r?[...r.querySelectorAll('.ntb:not(.is-out)')].map(b=>b.querySelector('.ntb-t').textContent):[], items:ntAll().map(x=>[x.src,x.kind,x.read,x.done||'',(ntCopy(x).p||'').slice(0,50)]).slice(0,8), ok:!!state._ntOk, live:!!_ntCh, chans:window.__mockChans?__mockChans():null, user:!!sbUser()}; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        mode=sys.argv[1] if len(sys.argv)>1 else 'm'
        dev = {'m':p.devices['iPhone 13'],'d':{'viewport':{'width':1400,'height':850}}}[mode]
        ctx = await b.new_context(**dev)
        await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){ sessionStorage.setItem('seeded','1'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s); localStorage.setItem('__mock_sb_session',%s); }"%(json.dumps(json.dumps(DB)),json.dumps(json.dumps(SESS))))
        pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(6000)
        print('boot', await pg.evaluate(STATE))
        nav=await pg.evaluate("()=>{ const a=document.querySelector('[data-testid=\"nav-profile-avatar\"]'); const r=a&&a.getBoundingClientRect(); return [r&&Math.round(r.width), !!document.querySelector('[data-testid=\"nav-profile-name\"]'), (document.querySelector('[data-testid=\"nav-mobile-profile\"]')||{}).innerText]; }")
        print('nav', nav)
        await pg.evaluate("()=>__mockAs('ub1','send_friend_request',{target:'ua1'})"); await pg.wait_for_timeout(900)
        print('req', await pg.evaluate(STATE))
        await pg.screenshot(path='/app/memory/tests/nt_banner_%s.jpg'%mode, quality=40, type='jpeg')
        await pg.click('[data-testid="notification-banner-action-accept"]'); await pg.wait_for_timeout(800)
        print('accepted', await pg.evaluate(STATE), await pg.evaluate("()=>JSON.parse(localStorage.getItem('__mock_sb_db')).friendships"))
        await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>__mockAs('ub1','remove_friend',{other:'ua1'})"); await pg.wait_for_timeout(900)
        await pg.evaluate("()=>__mockAs('us1','staff_set_verified',{target:'ua1',on_off:true,icon:'check'})"); await pg.wait_for_timeout(900)
        print('removed+staff', await pg.evaluate(STATE))
        await pg.screenshot(path='/app/memory/tests/nt_banner2_%s.jpg'%mode, quality=40, type='jpeg')
        await pg.evaluate("()=>{ toast('Added to Liked','Some song'); toast('Theme changed'); }"); await pg.wait_for_timeout(300)
        await pg.click('[data-testid="header-notifications-bell-btn"]'); await pg.wait_for_timeout(900)
        geo=await pg.evaluate("()=>{ const r=e=>{ if(!e) return null; const b=e.getBoundingClientRect(); return [Math.round(b.top),Math.round(b.bottom),Math.round(b.left),Math.round(b.right)]; }; return {panel:r(document.querySelector('[data-testid=\"notifications-center-drawer\"]')),hdr:r(document.querySelector('#app header')),nav:r(document.getElementById('mobile-nav')),rows:document.querySelectorAll('.nt-row-wrap').length,secs:[...document.querySelectorAll('.nt-sec-h')].map(h=>h.textContent)}; }")
        print('center', geo)
        await pg.screenshot(path='/app/memory/tests/nt_center_%s.jpg'%mode, quality=40, type='jpeg')
        await pg.click('[data-testid="notifications-tab-online"]'); await pg.wait_for_timeout(300)
        print('online rows', await pg.evaluate("()=>document.querySelectorAll('.nt-row-wrap').length"))
        await pg.fill('[data-testid="notifications-search-input"]','verified'); await pg.wait_for_timeout(300)
        print('search rows', await pg.evaluate("()=>[...document.querySelectorAll('.nt-row-t')].map(x=>x.textContent)"))
        await pg.click('[data-testid="notifications-search-clear"]'); await pg.click('[data-testid="notifications-tab-all"]'); await pg.wait_for_timeout(300)
        await pg.click('[data-testid="notifications-mark-all-read-btn"]'); await pg.wait_for_timeout(300)
        print('after read all', await pg.evaluate(STATE), await pg.evaluate("()=>JSON.parse(localStorage.getItem('__mock_sb_db')).notifs.map(n=>[n.id,n.kind,n.read])"))
        await pg.click('[data-testid="notifications-preferences-btn"]'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='/app/memory/tests/nt_prefs_%s.jpg'%mode, quality=40, type='jpeg')
        await pg.click('[data-testid="nt-dnd-seg-1h"]'); await pg.wait_for_timeout(300)
        print('dnd', await pg.evaluate("()=>[ntDnd(), document.querySelector('[data-testid=\"header-notifications-bell-btn\"]').className.includes('is-dnd')]"))
        await pg.click('[data-testid="notifications-prefs-back"]'); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>__mockAs('ub1','send_friend_request',{target:'ua1'})"); await pg.wait_for_timeout(900)
        print('dnd banner?', await pg.evaluate(STATE))
        await pg.click('[data-testid="notifications-close-btn"]'); await pg.wait_for_timeout(500)
        print('closed', await pg.evaluate("()=>[!!document.getElementById('nt-root'), state.ntOpen]"))
        print('errors', errs)
        await b.close()
asyncio.run(main())
