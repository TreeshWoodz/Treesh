import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
LIVE={'songs':'/tmp/live_songs.dot.html','lyrics':'/tmp/live_lyrics.dot.html','icons':'/tmp/live_icons.dot.html'}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width':1400,'height':850})
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        pg.on('console', lambda m: print('CONSOLE', m.text) if m.type=='error' else None)
        async def live(route):
            k=[x for x in LIVE if ('/content/'+x) in route.request.url][0]
            await route.fulfill(status=200, content_type='text/html', body=open(LIVE[k],encoding='utf-8').read())
        await pg.route('**/content/songs*', live); await pg.route('**/content/lyrics*', live); await pg.route('**/content/icons*', live)
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_seen','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        sid = await pg.evaluate("()=>{ const s=SONGS.find(x=>x.title==='Cherry'); openLyricSync(s.id); return s.id; }"); await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{ if(state.ls.mode!=='write') lsSetMode('write'); }"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("""()=>{ const ta=document.getElementById('ls-write'); return {ce:ta.isContentEditable, rt:!!ta._rt, v:ta.value.slice(0,200), lines:ta.value.split('\\n').length, rev:!!document.querySelector('[data-testid=ls-revert-lyrics]')}; }""")
        print('INIT', r)
        # select a word "point" in line 2 and bold it via the toolbar
        await pg.locator('[data-testid=ls-markup-toggle]').click(); await pg.wait_for_timeout(300)
        r = await pg.evaluate("""()=>{ const ta=document.getElementById('ls-write'); const v=ta.value; const i=v.indexOf('point'); ta.focus(); ta.setSelectionRange(i,i+5); return [i, ta.selectionStart, ta.selectionEnd, getSelection().toString()]; }""")
        print('SEL', r)
        await pg.locator('[data-testid=ls-md-bold]').click(); await pg.wait_for_timeout(200)
        r = await pg.evaluate("""()=>{ const ta=document.getElementById('ls-write'); return {v:ta.value.split('\\n').slice(0,3), html:ta.children[1].innerHTML, on:document.querySelector('[data-testid=ls-md-bold]').getAttribute('aria-pressed')}; }""")
        print('BOLD', r)
        # caret in word "prove" (no selection) -> italic; underline "something", strike "listen"
        await pg.evaluate("""()=>{ const ta=document.getElementById('ls-write'); const v=ta.value; const i=v.indexOf('prove'); ta.focus(); ta.setSelectionRange(i+2,i+2); }""")
        await pg.locator('[data-testid=ls-md-italic]').click(); await pg.wait_for_timeout(150)
        await pg.evaluate("""()=>{ const ta=document.getElementById('ls-write'); const v=ta.value; const i=v.indexOf('something'); ta.focus(); ta.setSelectionRange(i,i+9); }""")
        await pg.locator('[data-testid=ls-md-underline]').click(); await pg.wait_for_timeout(150)
        await pg.evaluate("""()=>{ const ta=document.getElementById('ls-write'); const v=ta.value; const i=v.indexOf('listen'); ta.focus(); ta.setSelectionRange(i,i+6); }""")
        await pg.keyboard.press('Control+Shift+X'); await pg.wait_for_timeout(150)
        # type at the end of line 2 with keyboard
        await pg.evaluate("""()=>{ const ta=document.getElementById('ls-write'); const v=ta.value; const i=v.indexOf('\\n', v.indexOf('prove')); ta.focus(); ta.setSelectionRange(i,i); }""")
        await pg.keyboard.type(' yes f**k'); await pg.wait_for_timeout(200)
        r = await pg.evaluate("""()=>{ const ta=document.getElementById('ls-write'); return ta.value.split('\\n').slice(0,4); }""")
        print('VAL', r)
        await pg.screenshot(path='/tmp/rt_write.png')
        await pg.evaluate("()=>lsSave()"); await pg.wait_for_timeout(400)
        r = await pg.evaluate("()=>{ const s=SONG_BY_ID[state.ls.songId]; return s.lyrics.slice(0,4).map(l=>({t:l.t,text:l.text,md2:l.md2,sec:l.sec})); }")
        print('SAVED', json.dumps(r, indent=0))
        # close and reopen, check value roundtrip
        await pg.evaluate("()=>{ state.ls.dirty=false; closeLS(); }"); await pg.wait_for_timeout(500)
        await pg.evaluate("(id)=>openLyricSync(id)", sid); await pg.wait_for_timeout(1200)
        await pg.evaluate("()=>{ if(state.ls.mode!=='write') lsSetMode('write'); }"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("""()=>{ const ta=document.getElementById('ls-write'); return {v:ta.value.split('\\n').slice(0,4), h:ta.children[1].innerHTML+' | '+ta.children[2].innerHTML}; }""")
        print('REOPEN', r)
        # sync mode fields
        await pg.evaluate("()=>lsSetMode('sync')"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("""()=>{ const f=document.querySelector('#ls-lines [data-ls-text="2"]')||document.querySelector('#ls-lines .ls-rt1'); return {tag:f&&f.tagName, v:f&&f.value, h:f&&f.innerHTML, ts:!!document.querySelector('[data-testid=ls-revert-timestamps]')}; }""")
        print('SYNC', r)
        await pg.screenshot(path='/tmp/rt_sync.png')
        # player
        await pg.evaluate("()=>{ state.ls.dirty=false; closeLS(); }"); await pg.wait_for_timeout(400)
        r = await pg.evaluate("""(id)=>{ const s=SONG_BY_ID[id]; playSong(s,[s]); try{ audio.pause(); }catch(e){} state.npOpen=true; state.showLyrics=true; renderNP(); const b=document.querySelector('#np-lyrics [data-line-wrap="1"] .np-line'); return b&&b.innerHTML.slice(0,300); }""", sid)
        print('PLAYER', r)
        await pg.wait_for_timeout(800)
        await pg.screenshot(path='/tmp/rt_np.png')
        await b.close()
asyncio.run(main())
