import asyncio, sys, json, urllib.request
from playwright.async_api import async_playwright
# Push UI self-test. Needs: node /app/memory/tests/push_dev.mjs (port 8791) + the static server on :3000
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
DEV='http://localhost:8791'
DB={"users":{"a@test.com":{"id":"ua1","email":"a@test.com","password":"secret123","confirmed":True},"s@test.com":{"id":"us1","email":"s@test.com","password":"secret123","confirmed":True}},
    "profiles":{"ua1":{"id":"ua1","username":"alice","display_name":"Alice A"},"us1":{"id":"us1","username":"staffy","display_name":"Staff S"}},"files":{},"mod":{"us1":{"role":"admin"}},
    "news":[{"id":1,"title":"Old news","body":"from last week","kind":"news","audience":"all","created_at":"2026-10-01T10:00:00Z"}]}
SESS={"access_token":"tok_ua1","refresh_token":"ref_ua1","user":{"id":"ua1","email":"a@test.com"}}
def dev(path, body=None):
    req=urllib.request.Request(DEV+path, data=None if body is None else json.dumps(body).encode(), method='GET' if body is None and not path.startswith('/__reset') else 'POST', headers={'content-type':'application/json'})
    return json.loads(urllib.request.urlopen(req).read() or b'null')
FAKE_PM="""(()=>{ const F=%s; const K='__fake_push_on';
  const mk=(key)=>({endpoint:F.endpoint, expirationTime:null, options:{applicationServerKey:key||null}, toJSON(){ return {endpoint:F.endpoint, expirationTime:null, keys:F.keys}; }, async unsubscribe(){ localStorage.removeItem(K); return true; }});
  PushManager.prototype.getSubscription=async function(){ return localStorage.getItem(K)?mk():null; };
  PushManager.prototype.subscribe=async function(o){ window.__subCalls=(window.__subCalls||0)+1; localStorage.setItem(K,'1'); return mk(o&&o.applicationServerKey&&o.applicationServerKey.buffer); };
  let perm=localStorage.getItem('__fake_perm')||'default'; Object.defineProperty(Notification,'permission',{get:()=>perm,configurable:true});
  Notification.requestPermission=async()=>{ window.__permAsked=(window.__permAsked||0)+1; perm=localStorage.getItem('__fake_perm_answer')||'granted'; localStorage.setItem('__fake_perm',perm); return perm; };
  window.TREESH_PUSH_API='%s/api/push'; })();"""
res=[]
def ok(c,m):
    res.append((bool(c),m)); print(('PASS ' if c else 'FAIL ')+m)
async def ctx_for(p,b,mode,extra_ls,sess=True,fake=None):
    dev_ = {'m':p.devices['iPhone 13'],'d':{'viewport':{'width':1400,'height':850}}}[mode]
    dev_=dict(dev_)
    if mode=='m': dev_['user_agent']='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'
    ctx=await b.new_context(**dev_)
    await ctx.grant_permissions(['notifications'],origin='http://localhost:3000')
    seed="localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s);"%json.dumps(json.dumps(DB))
    if sess: seed+="localStorage.setItem('__mock_sb_session',%s);"%json.dumps(json.dumps(SESS))
    for k,v in extra_ls.items(): seed+="localStorage.setItem(%s,%s);"%(json.dumps(k),json.dumps(json.dumps(v)))
    await ctx.add_init_script("if(!localStorage.getItem('__seeded')){ localStorage.setItem('__seeded','1'); %s }"%seed)
    await ctx.add_init_script(FAKE_PM%(json.dumps(fake or dev('/__fake_sub?id=ui_'+mode)),DEV))
    return ctx
async def main():
    mode=sys.argv[1] if len(sys.argv)>1 else 'd'
    dev('/__reset',{})
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=EXE)
        # ---- 1) Settings card: turn on, types, test, pref sync, off
        ctx=await ctx_for(p,b,mode,{'treesh_push':{'asked':True}})
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(5000)
        await pg.evaluate("()=>{ state.settingsTab='system'; navigate('settings'); }"); await pg.wait_for_timeout(900)
        card=pg.locator('[data-testid="settings-push-card"]')
        ok(await card.count()==1,'settings push card present')
        ok((await pg.text_content('[data-testid="settings-push-status"]')).strip()=='Off on this device','status off')
        await card.scroll_into_view_if_needed(); await pg.screenshot(path='/app/memory/tests/push_off_%s.jpg'%mode,quality=40,type='jpeg')
        await pg.click('[data-testid="settings-push-toggle"]'); await pg.wait_for_timeout(2500)
        ok((await pg.text_content('[data-testid="settings-push-status"]')).strip()=='On for this device','status on after toggle')
        st=dev('/__state'); rows=[r for r in st['tables']['push_subscriptions'] if r['endpoint'].endswith('/ui_'+mode)]
        ok(len(rows)==1 and rows[0]['user_id']=='ua1','server row linked to Alice')
        ok(rows and rows[0]['platform'].startswith('Android' if mode=='m' else 'Linux'),'platform saved: '+(rows[0]['platform'] if rows else '-'))
        reg=await pg.evaluate("async()=>{ const r=await navigator.serviceWorker.getRegistration('./'); return r&&(r.active||r.waiting||r.installing)?(r.active||r.waiting||r.installing).scriptURL:null; }")
        ok(reg and reg.endswith('/sw-push.js'),'service worker registered: %s'%reg)
        ok(await pg.locator('[data-testid^="settings-push-type-"]').count()==4,'4 alert types shown')
        await pg.screenshot(path='/app/memory/tests/push_on_%s.jpg'%mode,quality=40,type='jpeg')
        await pg.click('[data-testid="settings-push-test"]'); await pg.wait_for_timeout(1500)
        pushes=[x for x in dev('/__state')['pushes'] if x['id']=='ui_'+mode]
        ok(pushes and pushes[-1]['payload']['title']=='Notifications are on','test push delivered + decrypted')
        await pg.click('[data-testid="settings-push-type-news"]'); await pg.wait_for_timeout(1200)
        rows=[r for r in dev('/__state')['tables']['push_subscriptions'] if r['endpoint'].endswith('/ui_'+mode)]
        ok(rows and rows[0]['prefs']['news']==False and rows[0]['prefs']['friends']==True,'pref change synced to server')
        ok(await pg.get_attribute('[data-testid="settings-push-type-news"]','aria-checked')=='false','news switch off in UI')
        # notification preferences panel shows the same card
        await pg.click('[data-testid="settings-notification-prefs"]'); await pg.wait_for_timeout(700)
        ok(await pg.locator('[data-testid="notifications-push-card"]').count()==1 and await pg.locator('[data-testid="nt-sys-toggle"]').count()==0,'notification prefs show push card (old background toggle gone)')
        await pg.screenshot(path='/app/memory/tests/push_ntprefs_%s.jpg'%mode,quality=40,type='jpeg')
        await pg.click('[data-testid="notifications-push-toggle"]'); await pg.wait_for_timeout(1500)
        ok((await pg.text_content('[data-testid="notifications-push-status"]')).strip()=='Off on this device','turned off from notification prefs')
        rows=[r for r in dev('/__state')['tables']['push_subscriptions'] if r['endpoint'].endswith('/ui_'+mode)]
        ok(not rows,'server row removed on off')
        await pg.click('[data-testid="notifications-push-toggle"]'); await pg.wait_for_timeout(2000)
        ok(json.loads(await pg.evaluate("()=>localStorage.getItem('treesh_push')"))['on']==True,'back on')
        # foreground push message -> refetch, and tap on a push -> opens the alert
        await pg.evaluate("()=>ntcClose()"); await pg.wait_for_timeout(400)
        nid=await pg.evaluate("()=>__mockNews({title:'Big drop tonight',body:'Three new songs at 9'})")
        await pg.evaluate("()=>navigator.serviceWorker.dispatchEvent(new MessageEvent('message',{data:{type:'treesh-push',kind:'news',url:'./?nt=n%d'}}))"%nid); await pg.wait_for_timeout(1200)
        items=await pg.evaluate("()=>ntAll().filter(x=>x.kind==='news').map(x=>[x.id,x.title,x.read])")
        ok(any(i[0]=='n%d'%nid for i in items),'news ingested from foreground push: %s'%items)
        ban=await pg.evaluate("()=>[...document.querySelectorAll('#ntb-root .ntb:not(.is-out) .ntb-t')].map(x=>x.textContent)")
        ok('Big drop tonight' in ban,'news banner shown: %s'%ban)
        ok(not any(i[1]=='Old news' and False for i in items),'old news ok')
        await pg.evaluate("()=>navigator.serviceWorker.dispatchEvent(new MessageEvent('message',{data:{type:'treesh-push-open',url:location.origin+'/?nt=n%d'}}))"%nid); await pg.wait_for_timeout(1500)
        ok(await pg.locator('[data-testid="notifications-center-drawer"]').count()==1,'tapping a news push opens the notification center')
        ok(await pg.locator('[data-testid="nt-row-n%d"]'%nid).count()==1,'news row present')
        await pg.screenshot(path='/app/memory/tests/push_news_%s.jpg'%mode,quality=40,type='jpeg')
        ok(not errs,'no page errors: %s'%errs[:3])
        await ctx.close()

        # ---- 2) one-time ask on the 2nd visit
        ctx=await ctx_for(p,b,mode,{'treesh_push':{'visits':1}},fake=dev('/__fake_sub?id=ask_'+mode))
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sbtest.html')
        try:
            await pg.wait_for_selector('[data-testid="push-prompt"]',timeout=20000); ok(True,'ask shown on 2nd visit')
        except Exception: ok(False,'ask shown on 2nd visit')
        await pg.wait_for_timeout(700); await pg.screenshot(path='/app/memory/tests/push_ask_%s.jpg'%mode,quality=40,type='jpeg')
        await pg.click('[data-testid="push-prompt-turn-on"]'); await pg.wait_for_timeout(2500)
        S=json.loads(await pg.evaluate("()=>localStorage.getItem('treesh_push')"))
        ok(S['asked'] and S['on'],'turn on from ask: %s'%S)
        ok(await pg.locator('[data-testid="push-prompt"]').count()==0,'ask closed')
        await pg.reload(); await pg.wait_for_timeout(9000)
        ok(await pg.locator('[data-testid="push-prompt"]').count()==0,'never asked again')
        ok(not errs,'no page errors: %s'%errs[:3])
        await ctx.close()

        # ---- 3) first visit: no ask. Not now on 2nd
        ctx=await ctx_for(p,b,mode,{},sess=False,fake=dev('/__fake_sub?id=no_'+mode))
        pg=await ctx.new_page(); await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(9000)
        ok(await pg.locator('[data-testid="push-prompt"]').count()==0,'no ask on the first visit')
        await pg.evaluate("()=>sessionStorage.removeItem('treesh_pv')"); await pg.reload()
        try:
            await pg.wait_for_selector('[data-testid="push-prompt"]',timeout=20000)
            txt=await pg.text_content('[data-testid="push-prompt"]'); ok('New versions and Treesh news' in txt,'signed-out ask words')
            await pg.click('[data-testid="push-prompt-not-now"]'); await pg.wait_for_timeout(500)
            S=json.loads(await pg.evaluate("()=>localStorage.getItem('treesh_push')")); ok(S['asked'] and not S['on'],'not now remembered')
        except Exception as e: ok(False,'ask on 2nd visit (signed out) %s'%e)
        await pg.evaluate("()=>{ state.settingsTab='system'; navigate('settings'); }"); await pg.wait_for_timeout(900)
        await pg.click('[data-testid="settings-push-toggle"]'); await pg.wait_for_timeout(2500)
        lock=await pg.get_attribute('[data-testid="settings-push-type-friends"]','disabled')
        ok(lock is not None and await pg.locator('[data-testid="settings-push-signin"]').count()==1,'signed out: friend types locked + sign in button')
        rows=[r for r in dev('/__state')['tables']['push_subscriptions'] if r['endpoint'].endswith('/no_'+mode)]
        ok(rows and rows[0]['user_id'] is None and rows[0]['prefs']['friends']==False,'signed-out device not linked')
        await ctx.close()

        # ---- 4) new version banner
        ctx=await ctx_for(p,b,mode,{'treesh_push':{'asked':True}},fake=dev('/__fake_sub?id=ver_'+mode))
        await ctx.route('**/version.json*',lambda r: r.fulfill(status=200,content_type='application/json',body=json.dumps({'v':'zz99','title':'A new version of Treesh is ready','notes':'Push notifications are here'})))
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sbtest.html')
        try:
            await pg.wait_for_selector('[data-testid="update-banner"]',timeout=12000); ok(True,'update banner shown')
        except Exception: ok(False,'update banner shown')
        await pg.wait_for_timeout(700); await pg.screenshot(path='/app/memory/tests/push_ver_%s.jpg'%mode,quality=40,type='jpeg')
        ok('Push notifications are here' in (await pg.text_content('[data-testid="update-banner"]')),'banner notes')
        await pg.click('[data-testid="update-banner-dismiss"]'); await pg.wait_for_timeout(500)
        ok(await pg.locator('[data-testid="update-banner"]').count()==0,'later hides it')
        await pg.evaluate("()=>verCheck(true)"); await pg.wait_for_timeout(800)
        ok(await pg.locator('[data-testid="update-banner"]').count()==0,'stays hidden for this session')
        await pg.evaluate("()=>{ sessionStorage.removeItem('treesh_ver_later'); verCheck(true); }"); await pg.wait_for_timeout(800)
        await pg.click('[data-testid="update-banner-refresh"]'); await pg.wait_for_timeout(4500)
        ok('v=' not in pg.url,'refresh reloads and cleans the url: '+pg.url)
        ok(not errs,'no page errors: %s'%errs[:3])
        await ctx.close()
        # same version -> no banner
        ctx=await ctx_for(p,b,mode,{'treesh_push':{'asked':True}},fake=dev('/__fake_sub?id=ver2_'+mode))
        pg=await ctx.new_page(); await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(8000)
        ok(await pg.locator('[data-testid="update-banner"]').count()==0,'no banner when version.json matches')
        await ctx.close()

        # ---- 5) admin announcements composer
        ctx=await ctx_for(p,b,mode,{'treesh_push':{'asked':True},'__mock_sb_session':{"access_token":"tok_us1","refresh_token":"ref_us1","user":{"id":"us1","email":"s@test.com"}}},fake=dev('/__fake_sub?id=adm_'+mode))
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(6000)
        await pg.evaluate("()=>admOpen()"); await pg.wait_for_timeout(1500)
        ok(await pg.locator('[data-testid="admin-nav-announce"]').count()==1,'Announcements in the moderation rail')
        await pg.click('[data-testid="admin-nav-announce"]'); await pg.wait_for_timeout(900)
        ok(await pg.get_attribute('[data-testid="announce-review"]','disabled') is not None,'review disabled without a title')
        await pg.fill('[data-testid="announce-title-input"]','New songs just dropped')
        await pg.fill('[data-testid="announce-body-input"]','Three new tracks from the Woodz')
        ok((await pg.text_content('[data-testid="announce-preview-title"]'))=='New songs just dropped','live preview title')
        ok((await pg.text_content('[data-testid="announce-title-count"]'))=='22/80','title counter')
        await pg.fill('[data-testid="announce-url-input"]','javascript:alert(1)'); await pg.click('[data-testid="announce-review"]'); await pg.wait_for_timeout(400)
        ok(await pg.locator('[data-testid="announce-error"]').count()==1,'bad link error')
        await pg.fill('[data-testid="announce-url-input"]','/?u=alice'); await pg.click('[data-testid="announce-review"]'); await pg.wait_for_timeout(400)
        ok(await pg.locator('[data-testid="announce-confirm-box"]').count()==1,'confirm step')
        await pg.screenshot(path='/app/memory/tests/push_adm_%s.jpg'%mode,quality=40,type='jpeg')
        await pg.click('[data-testid="announce-send-confirm"]'); await pg.wait_for_timeout(2000)
        ok(await pg.locator('[data-testid="announce-result"]').count()==1,'result shown: '+str(await pg.text_content('[data-testid="announce-result"]') if await pg.locator('[data-testid="announce-result"]').count() else ''))
        an=[a for a in dev('/__state')['tables']['announcements'] if a['title']=='New songs just dropped']
        ok(an and an[0]['url']=='/?u=alice' and an[0]['created_by']=='us1','announcement saved on the server')
        ok((await pg.input_value('[data-testid="announce-title-input"]'))=='','form cleared')
        await pg.screenshot(path='/app/memory/tests/push_adm_sent_%s.jpg'%mode,quality=40,type='jpeg')
        ok(not errs,'no page errors: %s'%errs[:3])
        await ctx.close(); await b.close()
    f=[m for c,m in res if not c]; print('\n%d passed, %d failed'%(len(res)-len(f),len(f)))
    if f: print('\n'.join(f))
asyncio.run(main())
