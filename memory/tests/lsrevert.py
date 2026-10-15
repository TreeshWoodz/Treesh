import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
LIVE={'songs':'/tmp/live_songs.dot.html','lyrics':'/tmp/live_lyrics.dot.html','icons':'/tmp/live_icons.dot.html'}
MOB=len(sys.argv)>1 and sys.argv[1]=='m'
ok=0; bad=0
def chk(n,c,x=''):
    global ok,bad
    if c: ok+=1; print('PASS',n)
    else: bad+=1; print('FAIL',n,x)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**(p.devices['iPhone 13'] if MOB else {'viewport':{'width':1400,'height':850}}))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        async def live(route):
            k=[x for x in LIVE if ('/content/'+x) in route.request.url][0]
            await route.fulfill(status=200, content_type='text/html', body=open(LIVE[k],encoding='utf-8').read())
        await pg.route('**/content/songs*', live); await pg.route('**/content/lyrics*', live); await pg.route('**/content/icons*', live)
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_seen','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        sid = await pg.evaluate("()=>{ const s=SONGS.find(x=>x.title==='Cherry'); openLyricSync(s.id); return s.id; }"); await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{ if(state.ls.mode!=='write') lsSetMode('write'); }"); await pg.wait_for_timeout(400)
        d0 = await pg.evaluate("(id)=>SONG_BY_ID[id]._ly0.slice(0,4).map(l=>[l.t,l.text])", sid)
        # edit text of line 1 and bold a word, save
        await pg.evaluate("""()=>{ const ta=document.getElementById('ls-write'); const v=ta.value; ta.value=v.replace('I got a point to prove','I got a **point** to prove it'); ta.dispatchEvent(new Event('input',{bubbles:true})); lsSave(); }"""); await pg.wait_for_timeout(300)
        # custom timing on line "I got something to say..." (sync)
        await pg.evaluate("()=>lsSetMode('sync')"); await pg.wait_for_timeout(400)
        await pg.evaluate("""()=>{ const it=state.ls.items.find(x=>x.type==='line'&&/something to say/.test(x.text)); it.t=8.88; const it2=state.ls.items.find(x=>x.type==='line'&&/point/.test(x.text)); it2.t=6.06; lsSave(); }"""); await pg.wait_for_timeout(300)
        r = await pg.evaluate("(id)=>SONG_BY_ID[id].lyrics.slice(0,3).map(l=>[l.t,l.text,l.md2||''])", sid)
        chk('edits saved', r[0][1]=='I got a point to prove it' and r[0][0]==6.06 and r[1][0]==8.88, r)
        chk('revert timestamps button in sync', await pg.locator('[data-testid=ls-revert-timestamps]').count()==1)
        await pg.screenshot(path=f'/tmp/rev_sync_{"m" if MOB else "d"}.png')
        # revert timestamps
        await pg.locator('[data-testid=ls-revert-timestamps]').click(); await pg.wait_for_timeout(400)
        chk('confirm shows', 'timestamps' in (await pg.locator('[data-testid=confirm-title]').inner_text()).lower())
        await pg.locator('[data-testid=confirm-ok]').click(); await pg.wait_for_timeout(500)
        r = await pg.evaluate("(id)=>SONG_BY_ID[id].lyrics.slice(0,3).map(l=>[l.t,l.text,l.md2||''])", sid)
        chk('timestamps reverted, text kept', r[0][0]==d0[0][0] and r[1][0]==d0[1][0] and r[0][1]=='I got a point to prove it' and '**point**' in r[0][2], [r,d0])
        # add custom timing again, then revert lyrics: text back, timing kept
        await pg.evaluate("""()=>{ const it=state.ls.items.find(x=>x.type==='line'&&/something to say/.test(x.text)); it.t=8.88; lsSave(); lsSetMode('write'); }"""); await pg.wait_for_timeout(400)
        chk('revert lyrics button in write', await pg.locator('[data-testid=ls-revert-lyrics]').count()==1)
        await pg.locator('[data-testid=ls-revert-lyrics]').click(); await pg.wait_for_timeout(400)
        await pg.locator('[data-testid=confirm-ok]').click(); await pg.wait_for_timeout(500)
        r = await pg.evaluate("(id)=>({L:SONG_BY_ID[id].lyrics.slice(0,3).map(l=>[l.t,l.text,l.md2||'']), ed:!!state.lyricEdits[id], v:document.getElementById('ls-write').value.split('\\n')[1]})", sid)
        chk('lyrics reverted, my timing kept', r['L'][0][1]==d0[0][1] and r['L'][0][2]=='' and r['L'][1][0]==8.88 and r['ed'] and r['v']==d0[0][1], [r,d0])
        await pg.screenshot(path=f'/tmp/rev_write_{"m" if MOB else "d"}.png')
        # now revert timestamps -> fully default -> edits removed
        await pg.evaluate("()=>lsSetMode('sync')"); await pg.wait_for_timeout(300)
        await pg.locator('[data-testid=ls-revert-timestamps]').click(); await pg.wait_for_timeout(300); await pg.locator('[data-testid=confirm-ok]').click(); await pg.wait_for_timeout(500)
        r = await pg.evaluate("(id)=>({ed:!!state.lyricEdits[id], same:SONG_BY_ID[id].lyrics===SONG_BY_ID[id]._ly0, ls:JSON.parse(localStorage.getItem('treesh_lyric_edits')||'{}')[id]})", sid)
        chk('fully default -> edits removed', not r['ed'] and r['same'] and not r['ls'], r)
        # nothing to revert
        await pg.locator('[data-testid=ls-revert-timestamps]').click(); await pg.wait_for_timeout(300)
        chk('nothing to revert -> no confirm', await pg.locator('[data-testid=confirm-title]').count()==0)
        print('RESULT', ok, bad)
        await b.close()
asyncio.run(main())
