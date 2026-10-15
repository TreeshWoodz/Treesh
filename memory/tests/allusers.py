import asyncio, json, sys, time
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
TAG='m' if MOBILE else 'd'
now=int(time.time()*1000); D=864e5
iso=lambda ms:time.strftime('%Y-%m-%dT%H:%M:%S.000Z',time.gmtime(ms/1000))
def build():
    users={}; profiles={}; mod={"us1":{"role":"admin"},"um1":{"role":"moderator"}}
    def add(i,email,uname=None,name=None,joined=10,seen=1,confirmed=True):
        users[email]={"id":i,"email":email,"password":"secret123","confirmed":confirmed,"created_at":iso(now-joined*D),"last_sign_in_at":iso(now-seen*D) if seen is not None else None}
        if uname: profiles[i]={"id":i,"username":uname,"display_name":name or uname.title(),"created_at":iso(now-joined*D)}
    add("us1","s@test.com","staffy","Staff S",400,0.01)
    add("um1","m@test.com","modder","Mod M",300,0.5)
    add("ua1","a@test.com","alice","Alice A",2,0.2)          # new + active
    add("ub1","b@test.com","bobby","Bobby B",500,120)        # old + inactive
    add("uz1","zed@test.com","zedd","Zed Z",90,40)           # inactive
    add("uv1","v@test.com","vee","Vee Verified",60,3)        # verified
    add("ux1","banned@test.com","badguy","Bad Guy",30,2)     # banned
    add("uq1","quiet@test.com","quiet","Quiet Q",20,1)       # muted
    add("un1","nosetup@test.com",None,None,1,0.1)            # setup not finished, new
    add("un2","unconf@test.com",None,None,15,None,False)     # setup not finished, never seen, unconfirmed
    for k in range(52): add("uf%d"%k,"fill%d@test.com"%k,"fill%02d"%k,"Filler %02d"%k,100+k,1+k*0.5)
    mod["uv1"]={"verified":True,"verified_icon":"11"}
    mod["ux1"]={"banned_until":iso(now+3*D),"ban_reason":"spam"}
    mod["uq1"]={"muted_until":iso(now+2*D),"mute_reason":"x","frozen":{"username":"quiet"}}
    return {"users":users,"profiles":profiles,"files":{},"mod":mod}
def init(dbv, uid, email):
    sess={"access_token":"tok_"+uid,"refresh_token":"ref_"+uid,"user":{"id":uid,"email":email}}
    return "if(!localStorage.getItem('__mock_seeded')){ localStorage.setItem('__mock_seeded','1'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_push',JSON.stringify({asked:true})); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Staff',username:'%s',usernameSynced:'%s',birthday:'1990-01-01'})); localStorage.setItem('__mock_sb_db',JSON.stringify(%s)); localStorage.setItem('__mock_sb_session',JSON.stringify(%s)); }" % (uid, uid, json.dumps(dbv), json.dumps(sess))
ok=0; bad=0
def chk(n,c,x=''):
    global ok,bad
    if c: ok+=1; print('PASS',n,x)
    else: bad+=1; print('FAIL',n,x)
async def newpage(b,p,script):
    ctx = await (b.new_context(**p.devices['iPhone 13']) if MOBILE else b.new_context(viewport={'width':1400,'height':850}))
    await ctx.add_init_script(script); pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
    await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(4500); return ctx, pg
async def rows(pg): return await pg.locator('[data-testid=adu-list] .adu-row').count()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx, pg = await newpage(b,p,init(build(),'us1','s@test.com'))
        await pg.evaluate("()=>stLoad(true)"); await pg.wait_for_timeout(600)
        await pg.evaluate("()=>admOpen()"); await pg.wait_for_timeout(1500)
        nav = pg.locator('[data-testid=admin-nav-users]')
        chk('All users in the rail', await nav.count()==1)
        chk('rail shows total accounts', (await pg.locator('[data-testid=admin-nav-count-users]').text_content() or '').strip()=='62')
        await nav.click(); await pg.wait_for_timeout(900)
        chk('header total', (await pg.locator('[data-testid=adu-total]').text_content()).strip()=='62')
        chk('first page is 50', await rows(pg)==50, await rows(pg))
        chk('newest first', (await pg.locator('[data-testid=adu-list] .adu-row').first.get_attribute('data-testid'))=='adu-row-un1')
        chk('emails shown to admins', await pg.locator('[data-testid=adu-email-alice]').count()==1)
        chk('setup-not-finished pill', await pg.locator('[data-testid=adu-row-un1] [data-testid=adu-pill-setup]').count()==1)
        chk('active dot on active people', await pg.locator('[data-testid=adu-seen-alice].is-on').count()==1)
        await pg.screenshot(path=f'/tmp/adu_{TAG}_list.png')
        await pg.locator('[data-testid=adu-load-more]').click(); await pg.wait_for_timeout(800)
        chk('load more shows everyone', await rows(pg)==62 and await pg.locator('[data-testid=adu-load-more]').count()==0, await rows(pg))
        exp={'all':62,'active':59,'inactive':3,'new':2,'setup':2,'banned':1,'muted':1,'verified':1,'staff':2}
        got={k:(await pg.locator(f'[data-testid=adu-filter-{k}-count]').text_content()).strip() for k in exp}
        chk('filter counts', all(got[k]==str(v) for k,v in exp.items()), got)
        for k in ['inactive','setup','banned','staff','new']:
            await pg.locator(f'[data-testid=adu-filter-{k}]').click(); await pg.wait_for_timeout(500)
            n=await rows(pg); chk(f'filter {k} lists {exp[k]}', n==exp[k], n)
        ids = await pg.evaluate("()=>[...document.querySelectorAll('[data-testid=adu-list] .adu-row')].map(x=>x.dataset.testid)")
        chk('new = joined in the last 7 days', sorted(ids)==['adu-row-alice','adu-row-un1'], ids)
        await pg.locator('[data-testid=adu-filter-all]').click(); await pg.wait_for_timeout(500)
        await pg.select_option('[data-testid=adu-sort]','old'); await pg.wait_for_timeout(600)
        chk('oldest first', (await pg.locator('[data-testid=adu-list] .adu-row').first.get_attribute('data-testid'))=='adu-row-bobby')
        await pg.select_option('[data-testid=adu-sort]','seen'); await pg.wait_for_timeout(600)
        chk('last active first', (await pg.locator('[data-testid=adu-list] .adu-row').first.get_attribute('data-testid'))=='adu-row-us1' or (await pg.locator('[data-testid=adu-list] .adu-row').first.get_attribute('data-testid'))=='adu-row-staffy')
        await pg.select_option('[data-testid=adu-sort]','az'); await pg.wait_for_timeout(600)
        chk('A-Z', (await pg.locator('[data-testid=adu-list] .adu-row').first.get_attribute('data-testid'))=='adu-row-alice')
        chk('sort remembered', await pg.evaluate("()=>localStorage.getItem('treesh_adu_sort')") in ('"az"','az'))
        await pg.locator('[data-testid=adu-filter-text]').click(); await pg.keyboard.type('fill0', delay=60); await pg.wait_for_timeout(900)
        chk('text box narrows the list', await rows(pg)==10, await rows(pg))
        chk('focus stays in the text box', await pg.evaluate("()=>document.activeElement&&document.activeElement.id==='adu-t'"))
        await pg.keyboard.type('7', delay=60); await pg.wait_for_timeout(800)
        chk('keeps typing', await rows(pg)==1 and await pg.evaluate("()=>document.activeElement.value")=='fill07')
        await pg.fill('[data-testid=adu-filter-text]','unconf@'); await pg.wait_for_timeout(800)
        chk('admins can find by email', await rows(pg)==1)
        await pg.locator('[data-testid=adu-filter-reset]').click(); await pg.wait_for_timeout(700)
        chk('clear filters', await rows(pg)==50 and await pg.locator('[data-testid=adu-filter-text]').input_value()=='')
        # setup-not-finished account pane + delete
        await pg.locator('[data-testid=adu-filter-setup]').click(); await pg.wait_for_timeout(600)
        await pg.locator('[data-testid=adu-row-un2] .adm-row-main').click(); await pg.wait_for_timeout(700)
        chk('account pane opens', await pg.locator('[data-testid=adu-raw-pane]').is_visible())
        chk('pane shows email + not confirmed', 'unconf@test.com' in (await pg.locator('[data-testid=adu-raw-email]').text_content()) and 'Not yet' in (await pg.locator('[data-testid=adu-raw-confirmed]').text_content()))
        await pg.screenshot(path=f'/tmp/adu_{TAG}_raw.png')
        await pg.locator('[data-testid=adu-raw-delete]').click(); await pg.wait_for_timeout(300)
        await pg.locator('[data-testid=adu-raw-delete-confirm]').click(); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("()=>{ const d=JSON.parse(localStorage.getItem('__mock_sb_db')); return ['unconf@test.com' in d.users, Object.keys(d.users).length]; }")
        chk('deleted from the database', r[0] is False and r[1]==61, r)
        chk('list + counts refresh', await rows(pg)==1 and (await pg.locator('[data-testid=adu-filter-setup-count]').text_content()).strip()=='1')
        chk('pane closed', not await pg.locator('#adm-pane.is-open').count())
        # normal account opens the usual Moderate panel
        await pg.locator('[data-testid=adu-filter-all]').click(); await pg.wait_for_timeout(600)
        await pg.locator('[data-testid=adu-row-alice] .adm-row-main').click(); await pg.wait_for_timeout(1200)
        chk('person opens Moderate panel', await pg.locator('#adm-pane [data-testid=moderation-sheet]').count()==1)
        chk('row highlighted', await pg.locator('[data-testid=adu-row-alice].on').count()==1)
        await pg.screenshot(path=f'/tmp/adu_{TAG}_pane.png')
        await pg.locator('[data-testid=admin-pane-back]').click(); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>document.documentElement.classList.add('theme-light')"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f'/tmp/adu_{TAG}_light.png')
        await ctx.close()
        # moderator: no emails, can't delete
        ctx, pg = await newpage(b,p,init(build(),'um1','m@test.com'))
        await pg.evaluate("()=>stLoad(true)"); await pg.wait_for_timeout(600)
        await pg.evaluate("()=>admOpen('users')"); await pg.wait_for_timeout(1500)
        chk('moderator sees the list', await rows(pg)==50)
        chk('moderators never see emails', await pg.locator('[data-testid^=adu-email-]').count()==0 and await pg.evaluate("()=>_adm.u.rows.every(x=>x.email==null)"))
        await pg.fill('[data-testid=adu-filter-text]','unconf@'); await pg.wait_for_timeout(800)
        chk('moderators can\u2019t search by email', await rows(pg)==0)
        await pg.fill('[data-testid=adu-filter-text]',''); await pg.wait_for_timeout(700)
        await pg.locator('[data-testid=adu-filter-setup]').click(); await pg.wait_for_timeout(600)
        await pg.locator('[data-testid=adu-row-un1] .adm-row-main').click(); await pg.wait_for_timeout(700)
        chk('moderator: delete locked', await pg.locator('[data-testid=adu-raw-locked]').count()==1 and await pg.locator('[data-testid=adu-raw-delete]').count()==0)
        await ctx.close(); await b.close()
    print('RESULT',ok,'pass',bad,'fail')
asyncio.run(main())
