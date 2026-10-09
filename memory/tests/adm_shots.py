import asyncio, json, sys, time
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
U=lambda i,e:{"id":i,"email":e,"password":"secret123","confirmed":True}
now=int(time.time()*1000)
iso=lambda ms:time.strftime('%Y-%m-%dT%H:%M:%S.000Z',time.gmtime(ms/1000))
DB={"users":{"a@test.com":U("ua1","a@test.com"),"b@test.com":U("ub1","b@test.com"),"s@test.com":U("us1","s@test.com"),"c@test.com":U("uc1","c@test.com"),"m@test.com":U("um1","m@test.com")},
 "profiles":{"ua1":{"id":"ua1","username":"alice","display_name":"Alice A","created_at":iso(now-2*864e5)},"ub1":{"id":"ub1","username":"bobby","display_name":"Bobby B","created_at":iso(now-20*864e5)},"us1":{"id":"us1","username":"staffy","display_name":"Staff S","created_at":iso(now-90*864e5)},"uc1":{"id":"uc1","username":"carla","display_name":"Carla C","created_at":iso(now-5*864e5)},"um1":{"id":"um1","username":"modder","display_name":"Mod M","created_at":iso(now-40*864e5)}},
 "files":{},
 "mod":{"us1":{"role":"admin"},"um1":{"role":"moderator"},"ub1":{"banned_until":iso(now+3*864e5),"ban_reason":"Spam"},"uc1":{"muted_until":iso(now+864e5),"mute_reason":"Rude bio","verified":True}},
 "modlog":[{"actor":"us1","target":"ub1","action":"ban","detail":{"until":iso(now+3*864e5),"reason":"Spam"},"created_at":iso(now-3600e3)},{"actor":"um1","target":"uc1","action":"mute","detail":{"until":iso(now+864e5),"reason":"Rude bio"},"created_at":iso(now-7200e3)},{"actor":"us1","target":"uc1","action":"verify","detail":{},"created_at":iso(now-3*864e5)},{"actor":"um1","target":"ua1","action":"edit","detail":{"bio":""},"created_at":iso(now-9*864e5)}]}
SESS={"access_token":"tok_us1","refresh_token":"ref_us1","user":{"id":"us1","email":"s@test.com"}}
INIT="if(!localStorage.getItem('__mock_seeded')){ localStorage.setItem('__mock_seeded','1'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Staff S',username:'staffy',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s); localStorage.setItem('__mock_sb_session',%s); }"%(json.dumps(json.dumps(DB)),json.dumps(json.dumps(SESS)))
TAG=sys.argv[1] if len(sys.argv)>1 else 'cur'
async def run(p,dev,name):
    b = await p.chromium.launch(executable_path=EXE)
    ctx = await (b.new_context(**p.devices['iPhone 13']) if dev=='m' else b.new_context(viewport={'width':1400,'height':850}))
    await ctx.add_init_script(INIT)
    pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(5000)
    print(name,'role', await pg.evaluate("()=>stRole()"))
    await pg.evaluate("()=>{ document.querySelector('[data-act=\"mod-dash\"]')? document.querySelector('[data-act=\"mod-dash\"]').click() : modDashOpen(); }"); await pg.wait_for_timeout(1800)
    await pg.screenshot(path=f'/app/memory/tests/adm_{TAG}_dash_{dev}.jpg', quality=40)
    print(name,'stats', await pg.evaluate("()=>[...document.querySelectorAll('[data-testid$=-value]')].map(e=>e.closest('[data-testid]').dataset.testid+'='+e.textContent)"))
    await pg.click('[data-testid=admin-nav-activity]'); await pg.wait_for_timeout(600)
    await pg.click('[data-testid=filter-chip-ban]'); await pg.wait_for_timeout(400)
    print(name,'ban filter', await pg.evaluate("()=>document.querySelector('[data-testid=admin-log-count]').textContent"))
    await pg.screenshot(path=f'/app/memory/tests/adm_{TAG}_log_{dev}.jpg', quality=40)
    await pg.click('[data-testid=admin-nav-suspended]'); await pg.wait_for_timeout(500)
    await pg.click('[data-testid=people-row-bobby] .adm-row-main'); await pg.wait_for_timeout(1500)
    await pg.screenshot(path=f'/app/memory/tests/adm_{TAG}_pane_{dev}.jpg', quality=40)
    await pg.click('[data-testid=mod-quick-action-mute]'); await pg.wait_for_timeout(300)
    await pg.click('[data-testid=mod-mute-dur-1h]'); await pg.wait_for_timeout(200)
    await pg.click('[data-testid=mod-mute-submit]'); await pg.wait_for_timeout(1500)
    print(name,'after mute', await pg.evaluate("()=>[!!document.querySelector('[data-testid=mod-chip-muted]'), document.querySelector('[data-testid=admin-nav-count-muted]')&&document.querySelector('[data-testid=admin-nav-count-muted]').textContent]"))
    await pg.fill('[data-testid=admin-quick-search-input]','car'); await pg.wait_for_timeout(900)
    print(name,'search', await pg.evaluate("()=>[...document.querySelectorAll('[data-testid=admin-search-results] [data-testid^=people-row-]')].map(e=>e.dataset.testid)"))
    await pg.click('[data-testid=admin-dashboard-close-btn]'); await pg.wait_for_timeout(500)
    await pg.evaluate("()=>{ sxOpenProfile('bobby'); }"); await pg.wait_for_timeout(2000)
    await pg.evaluate("()=>{ const b=document.querySelector('[data-act=\"mod-open\"]'); if(b) b.click(); }"); await pg.wait_for_timeout(1200)
    await pg.screenshot(path=f'/app/memory/tests/adm_{TAG}_sheet_{dev}.jpg', quality=40)
    await pg.click('[data-testid=mod-quick-action-profile]'); await pg.wait_for_timeout(400)
    print(name,'sheet panel', await pg.evaluate("()=>[!!document.querySelector('#modal2 [data-testid=mod-panel-profile]'), !!document.querySelector('#modal2 [data-testid=mod-name-input]')]"))
    print(name,'errors', errs[:4])
    await b.close()
async def main():
    async with async_playwright() as p:
        await run(p,'d','desk'); await run(p,'m','mob')
asyncio.run(main())
