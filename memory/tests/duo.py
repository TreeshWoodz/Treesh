import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
LIVE={'songs':'/tmp/live_songs.dot.html','lyrics':'/tmp/live_lyrics.dot.html','icons':'/tmp/live_icons.dot.html'}
MOB='m' in sys.argv[1:]
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
        T='m' if MOB else 'd'
        r = await pg.evaluate("""()=>{ const s=SONGS.find(x=>x.title==='Cherry'); playSong(s,[s]); try{ audio.pause(); }catch(e){} state.npOpen=true; state.showLyrics=true; renderNP();
          const L=s.lyrics; const i=L.findIndex(l=>/last drop \\(Last drop\\)/.test(l.text)); return {i, sec:L[i].sec, duo:lyDuo(s,L[i].sec), pt:lyPT(s,L,i), t:L[i].t, html:(document.querySelector('#np-lyrics [data-line-wrap="'+i+'"] .np-line')||{}).innerHTML, v1:parseSection('Verse 1: Marc Q',s)}; }""")
        print(json.dumps(r)[:900])
        i=r['i']; chk('duo detected', r['duo'] and r['duo']['a']['name']=='Marq C' and r['duo']['a']['main'] and r['duo']['b']['name']=='Chelly Banqz', r['duo'])
        chk('alt span in classic', 'class="ly-alt"' in (r['html'] or '') and 'Last drop' in r['html'])
        chk('verse 1 label maps to Marq C', any(a['name']=='Marq C' for a in r['v1']['artists']), r['v1'])
        ts=r['pt'][0][0]
        for tt,want in [(r['t']+0.3,'a'),(ts+0.2,'b')]:
            w = await pg.evaluate("(t)=>{ state.currentTime=t; updateLyricHighlight(true); const b=document.getElementById('np-performer'); return {who:b.dataset.who, names:[...b.querySelectorAll('[data-act=perf-artist]')].map(p=>p.dataset.name+':'+p.classList.contains('ly-speak'))}; }", tt)
            chk(f'pill speaker {want} at {tt:.2f}', w['who']==want, w)
            await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'/tmp/duo_classic_{want}_{T}.png')
        # line w/o parens in duo section -> a
        w = await pg.evaluate("()=>{ const s=curSong(), L=s.lyrics; const i=L.findIndex(l=>/All summer long/.test(l.text)); state.currentTime=L[i].t+0.5; updateLyricHighlight(true); return document.getElementById('np-performer').dataset.who; }")
        chk('no-paren line in duo -> 1st artist', w=='a', w)
        # chat theme
        await pg.evaluate("()=>{ lytSet('chat',true); }"); await pg.wait_for_timeout(600)
        r2 = await pg.evaluate("""(i)=>{ const c=document.getElementById('np-lyrics'); const s=curSong(), L=s.lyrics; state.currentTime=L[i].t+0.2; updateLyricHighlight(true); const rows=[...c.querySelectorAll('[data-line-wrap="'+i+'"]')]; const a=rows.map(w=>({alt:w.classList.contains('ly-alt-row'), name:(w.querySelector('.wc-name')||{}).textContent, text:(w.querySelector('.np-line')||{}).textContent, fut:w.classList.contains('lyt-fut')})); return a; }""", i)
        print(r2)
        chk('chat: main bubble from Marq C without parens', r2 and r2[0]['name']=='Marq C' and '(' not in r2[0]['text'] and 'last drop' in r2[0]['text'], r2)
        chk('chat: alt bubble from Chelly, hidden before its time', len(r2)>1 and r2[1]['alt'] and r2[1]['name']=='Chelly Banqz' and r2[1]['text'].strip()=='Last drop' and r2[1]['fut'], r2)
        r3 = await pg.evaluate("(a)=>{ state.currentTime=a; updateLyricHighlight(true); const w=document.querySelector('.ly-alt-row'); return !w.classList.contains('lyt-fut'); }", ts+0.3)
        chk('chat: alt bubble shows at its time', r3)
        await pg.wait_for_timeout(700); await pg.screenshot(path=f'/tmp/duo_chat_{T}.png')
        for th in ['comic','neon','term','pola','type','note']:
            await pg.evaluate("(th)=>{ lytSet(th,true); }", th); await pg.wait_for_timeout(500)
            h = await pg.evaluate("(i)=>{ const b=document.querySelector('#np-lyrics [data-line-wrap=\"'+i+'\"] .ly-alt'); return b?getComputedStyle(b).color:null; }", i)
            chk(f'theme {th} tints alt', h is not None, h)
            if th in ('comic','neon'): await pg.screenshot(path=f'/tmp/duo_{th}_{T}.png')
        await pg.evaluate("()=>lytSet('classic',true)")
        print('RESULT', ok, bad)
        await b.close()
asyncio.run(main())
