# Two devices, one Treesh account (fake Supabase shared by copying __mock_sb_db between browser contexts).
# A customizes the profile Space; B (open with an older copy) keeps using Treesh and syncs; then A syncs again.
import asyncio, json, sys
from playwright.async_api import async_playwright
EXE = "/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
URL = 'http://localhost:3000/_sbtest.html'
DB = {"users": {"a@test.com": {"id": "ua1", "email": "a@test.com", "password": "secret123", "confirmed": True}}, "profiles": {"ua1": {"id": "ua1", "username": "alice", "display_name": "Alice A"}}, "files": {}}
SESS = {"access_token": "tok_ua1", "refresh_token": "ref_ua1", "user": {"id": "ua1", "email": "a@test.com"}}
SEED = """(()=>{ if(localStorage.getItem('__seeded')) return; localStorage.setItem('__seeded','1'); localStorage.setItem('treesh_whatsnew_off','true');
  localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Alice A',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db', %s); localStorage.setItem('__mock_sb_session', %s); })()""" % (json.dumps(json.dumps(DB)), json.dumps(json.dumps(SESS)))
fails = []
def ok(c, m):
    print(('  ok   ' if c else '  FAIL ') + m)
    if not c: fails.append(m)
async def db_copy(src, dst):
    d = await src.evaluate("localStorage.getItem('__mock_sb_db')")
    await dst.evaluate("d=>localStorage.setItem('__mock_sb_db',d)", d)
async def idle(pg, ms=300):
    await pg.wait_for_function("()=>!_sbBusy", timeout=20000); await pg.wait_for_timeout(ms)
async def push(pg):
    await idle(pg, 0); await pg.wait_for_timeout(1200); await pg.evaluate("async()=>{ _sbDirty=true; await sbPush(); }"); await idle(pg)
NOTIMER = "()=>{ sbSchedule=function(){}; clearTimeout(_sbTimer); _sbTimer=0; }"
SPACE = "()=>{ const p=Object.assign({},state.profile); p.space=spNorm({theme:'sunset',bg:{type:'color',color:'#ff3366'},card:{style:'glass',radius:12}}); state.profile=p; LS.set('treesh_profile',p); }"
async def space(pg): return await pg.evaluate("()=>{ const s=(LS.get('treesh_profile',{})||{}).space; return s?(s.theme||'')+'/'+((s.bg||{}).color||''):'default'; }")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        A = await (await b.new_context(viewport={'width': 1200, 'height': 800})).new_page(); await A.context.add_init_script(SEED)
        B = await (await b.new_context(viewport={'width': 1200, 'height': 800})).new_page(); await B.context.add_init_script(SEED)
        for pg, n in ((A, 'A'), (B, 'B')): pg.on('pageerror', lambda e, n=n: print('PAGEERR', n, e))
        print('1) both devices signed in, synced'); await A.goto(URL); await A.wait_for_timeout(4000); await A.evaluate(NOTIMER); await idle(A); await push(A)
        await B.goto('http://localhost:3000/terms.html'); await db_copy(A, B); await B.goto(URL); await B.wait_for_timeout(4500); await B.evaluate(NOTIMER); await idle(B); await db_copy(B, A)
        print('2) A styles the profile Space and syncs'); await A.evaluate(SPACE); await push(A); ok(await space(A) == 'sunset/#ff3366', 'A has the new Space')
        await db_copy(A, B)
        print('3) B (still open with the old copy) plays music / earns stars, then syncs')
        await B.evaluate("()=>{ LS.set('treesh_test_activity',{plays:Date.now()}); }"); await push(B); await db_copy(B, A)
        cloud = await A.evaluate("()=>{ const d=JSON.parse(localStorage.getItem('__mock_sb_db')); const ls=d.user_data.ua1.data.localStorage; return {space:((JSON.parse(ls.treesh_profile||'{}').space)||{}).theme||'default', act:!!ls.treesh_test_activity}; }")
        ok(cloud['space'] == 'sunset', 'cloud still has A\u2019s Space after B synced (got %s)' % cloud['space'])
        ok(cloud['act'], 'cloud has B\u2019s activity too')
        print('4) A comes back to Treesh'); r = await A.evaluate("()=>sbPull({restore:true})"); await idle(A)
        ok(await space(A) == 'sunset/#ff3366', 'A keeps its Space (pull=%s, got %s)' % (r, await space(A)))
        ok(await A.evaluate("()=>!!LS.get('treesh_test_activity',null)"), 'A received B\u2019s activity')
        print('5) B comes back to Treesh'); await db_copy(A, B); r = await B.evaluate("()=>sbPull({restore:true})"); await idle(B)
        ok(await space(B) == 'sunset/#ff3366', 'B now shows A\u2019s Space (pull=%s, got %s)' % (r, await space(B)))
        print('6) both edit different things before syncing')
        await A.evaluate("()=>{ LS.set('treesh_test_a','fromA'); }"); await B.evaluate("()=>{ LS.set('treesh_test_b','fromB'); }")
        await push(A); await db_copy(A, B); await push(B); await db_copy(B, A); r = await A.evaluate("()=>sbPull({restore:true})"); await idle(A)
        both = await A.evaluate("()=>[LS.get('treesh_test_a',null),LS.get('treesh_test_b',null)]")
        ok(both == ['fromA', 'fromB'], 'both edits survive (%s)' % both)
        print('7) the same thing edited on both: the newer edit wins')
        await A.evaluate("()=>{ LS.set('treesh_test_same','old-A'); }"); await B.wait_for_timeout(50); await B.evaluate("()=>{ LS.set('treesh_test_same','new-B'); }")
        await push(A); await db_copy(A, B); await push(B); await db_copy(B, A); await A.evaluate("()=>sbPull({restore:true})"); await idle(A)
        ok(await A.evaluate("()=>LS.get('treesh_test_same',null)") == 'new-B', 'newer edit wins on A')
        print('8) a key removed on one device stays removed')
        await A.evaluate("()=>{ localStorage.removeItem('treesh_test_a'); }"); await push(A); await db_copy(A, B)
        await B.evaluate("()=>{ LS.set('treesh_test_activity',{plays:2}); }"); await push(B); await db_copy(B, A); await A.evaluate("()=>sbPull({restore:true})"); await idle(A)
        ok(await A.evaluate("()=>LS.get('treesh_test_a',null)") is None, 'removed key not brought back by the other device')
        print('9) A sets a banner, B (open, old copy) adds a font; both sync')
        await A.evaluate("async()=>{ await assetPut('profile_banner','data:image/png;base64,QkFOTkVSLUE='); state.profileBanner='data:image/png;base64,QkFOTkVSLUE='; }"); await push(A); await db_copy(A, B)
        await B.evaluate("async()=>{ await assetPut('custom_font','data:font/woff2;base64,Rk9OVC1C'); }"); await push(B); await db_copy(B, A)
        files = await A.evaluate("()=>{ const d=JSON.parse(localStorage.getItem('__mock_sb_db')); let l=[]; try{ l=JSON.parse((d.texts||{})['ua1/assets.json']||'[]'); }catch(e){ l='bad'; } return Array.isArray(l)?l.map(a=>a.id+'='+String(a.value).slice(-8)).sort():l; }")
        ok(isinstance(files, list) and any(x.startswith('profile_banner=') and x.endswith('SLUE=') for x in files) and any(x.startswith('custom_font=') for x in files), 'account keeps A\u2019s banner and B\u2019s font (%s)' % files)
        await A.evaluate("()=>sbPull({restore:true})"); await idle(A)
        av = await A.evaluate("async()=>[(await assetGet('profile_banner'))||'', (await assetGet('custom_font'))||'']")
        ok(av[0].endswith('SLUE=') and av[1].endswith('Rk9OVC1C'), 'A has its banner and B\u2019s font')
        print('10) a device that synced before this update (no merge history) still can\u2019t undo the Space')
        await A.evaluate("()=>{ const p=Object.assign({},state.profile); p.space=spNorm({theme:'ocean',bg:{type:'color',color:'#0077ff'}}); state.profile=p; LS.set('treesh_profile',p); }"); await push(A); await db_copy(A, B)
        await B.evaluate("()=>{ localStorage.removeItem('treesh_sb_base'); localStorage.removeItem('treesh_sb_kt'); _sbKT=null; LS.set('treesh_test_activity',{plays:3}); }"); await push(B); await db_copy(B, A)
        cloud = await A.evaluate("()=>{ const d=JSON.parse(localStorage.getItem('__mock_sb_db')); return ((JSON.parse(d.user_data.ua1.data.localStorage.treesh_profile||'{}').space)||{}).theme||'default'; }")
        ok(cloud == 'ocean', 'cloud keeps A\u2019s newest Space after the legacy device synced (got %s)' % cloud)
        ok(await space(B) == 'ocean/#0077ff', 'legacy device picked up the newest Space')
        print('11) signing in on a brand-new device brings everything')
        C = await (await b.new_context(viewport={'width': 1200, 'height': 800})).new_page(); await C.goto('http://localhost:3000/terms.html')
        await db_copy(A, C); await C.evaluate("()=>{ localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Guest',birthday:'2001-01-01'})); localStorage.setItem('__mock_sb_session', %s); }" % json.dumps(json.dumps(SESS)))
        await C.goto(URL); await C.wait_for_timeout(6000); await idle(C)
        ok(await space(C) == 'ocean/#0077ff', 'new device shows the account Space (got %s)' % await space(C))
        ok(await C.evaluate("async()=>((await assetGet('profile_banner'))||'').endsWith('SLUE=')"), 'new device has the banner')
        await b.close()
    print('\n%d failed' % len(fails)); sys.exit(1 if fails else 0)
asyncio.run(main())
