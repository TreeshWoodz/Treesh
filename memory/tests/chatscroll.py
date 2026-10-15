import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
LIVE={'songs':'/tmp/live_songs.dot.html','lyrics':'/tmp/live_lyrics.dot.html','icons':'/tmp/live_icons.dot.html'}
MOB='m' in sys.argv[1:]; T='m' if MOB else 'd'
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
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_seen','1'); localStorage.setItem('treesh_lyt','\"chat\"'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3500)
        async def run(title, start, secs, shot_at=None):
            d = await pg.evaluate("""(T)=>{ const s=SONGS.find(x=>x.title===T); playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); const L=s.lyrics; const d=[]; L.forEach((l,i)=>{ const x=lyDuoLine(s,l); if(x&&x.parts.length) d.push([i,l.t,lyAllAlt(l)]); }); return d; }""", title)
            await pg.wait_for_timeout(2500)
            await pg.evaluate("(t)=>{ audio.muted=true; audio.currentTime=t; audio.play(); }", start)
            prev=None; jumps=[]; shots=0; n=int(secs*10)
            for k in range(n):
                r = await pg.evaluate("()=>{ const c=document.getElementById('np-lyrics'); return [audio.currentTime, c.scrollTop, c.scrollHeight-c.clientHeight]; }")
                if prev and prev[1]-r[1]>30: jumps.append((round(r[0],2),prev[1],r[1],r[2]))
                if shot_at and shots<len(shot_at) and r[0]>=shot_at[shots]:
                    await pg.screenshot(path=f'/tmp/chatscroll_{title[:6].replace(" ","_")}_{shots}_{T}.png'); shots+=1
                prev=r; await pg.wait_for_timeout(100)
            await pg.evaluate("()=>audio.pause()")
            return d, jumps
        d, j = await run('Talk About Me', 90.5, 14, [94.3, 101.5])
        chk('Talk About Me: no scroll jump when a whole (2nd artist) line arrives', not j, j[:6])
        st = await pg.evaluate("""()=>{ const c=document.getElementById('np-lyrics'); const cr=c.getBoundingClientRect(); const vis=[...c.querySelectorAll('.wc-row')].filter(w=>w.getClientRects().length&&!w.classList.contains('lyt-fut')); const last=vis[vis.length-1]; const lr=last.getBoundingClientRect();
            const rr=c.querySelector('.lyt-rr'); return {lastAlt:last.classList.contains('ly-alt-row'), lastName:(last.querySelector('.wc-name')||{}).textContent, inView:lr.bottom<=cr.bottom+4&&lr.top>=cr.top-4, rrOnLast:!!(rr&&last.contains(rr)), gap:c.scrollHeight-c.clientHeight-c.scrollTop}; }""")
        chk('newest bubble visible at the bottom', st['inView'] and st['gap']<=4, st)
        chk('read receipt under the newest bubble', st['rrOnLast'], st)
        ty = await pg.evaluate("""()=>{ const s=curSong(), L=s.lyrics; const i=L.findIndex(l=>lyAllAlt(l)&&lyDuoLine(s,l)); const by=wcLineBy(s,L,i); return by&&by.n; }""")
        chk('typing dots for a whole (2nd artist) line come from the 2nd artist', ty and ty!='SAVIONCE', ty)
        d, j = await run('Cherry', 61.5, 12, [66.0, 71.2])
        chk('Cherry: no back-and-forth scroll when the 2nd artist bubble lands', not j, j[:6])
        alts = await pg.evaluate("()=>[...document.querySelectorAll('#np-lyrics .ly-alt-row')].map(w=>w.dataset.lineWrap)")
        chk('no duplicate 2nd-artist bubbles', len(alts)==len(set(alts)), alts)
        # refreshLyricLine (fav / note badge) keeps one alt bubble and the line list in order
        r = await pg.evaluate("""()=>{ const s=curSong(), L=s.lyrics; const i=L.findIndex(l=>/last drop \\(Last drop\\)/.test(l.text)); refreshLyricLine(i); const rows=document.querySelectorAll('#np-lyrics .ly-alt-row[data-line-wrap="'+i+'"]').length; const bad=state.lyricLines.filter(el=>el.closest('.ly-alt-row')).length; const main=document.querySelector('#np-lyrics [data-line-wrap="'+i+'"]'); return {rows, bad, chat:main.classList.contains('wc-row')}; }""")
        chk('refreshLyricLine: still one alt bubble, list not shifted', r['rows']==1 and r['bad']==0 and r['chat'], r)
        # user scroll pauses the follow
        await pg.evaluate("(t)=>{ audio.currentTime=t; audio.play(); }", 75)
        await pg.wait_for_timeout(1500)
        await pg.mouse.move(200,400); await pg.evaluate("()=>{ const c=document.getElementById('np-lyrics'); c.dispatchEvent(new WheelEvent('wheel',{deltaY:-400,bubbles:true})); c.scrollTop=Math.max(0,c.scrollTop-500); }")
        await pg.wait_for_timeout(1500)
        g = await pg.evaluate("()=>{ const c=document.getElementById('np-lyrics'); return c.scrollHeight-c.clientHeight-c.scrollTop; }")
        chk('reading back (user scroll) is not yanked down', g>200, g)
        await pg.evaluate("()=>audio.pause()")
        # classic theme still centres the active line
        await pg.evaluate("()=>{ lytSet('classic',true); }"); await pg.wait_for_timeout(500)
        await pg.evaluate("(t)=>{ _lyricUserScrollUntil=0; audio.currentTime=t; state.currentTime=t; updateLyricHighlight(true); }", 66.5); await pg.wait_for_timeout(900)
        cen = await pg.evaluate("""()=>{ const s=curSong(), L=s.lyrics, t=state.currentTime; let idx=-1; for(let i=0;i<L.length;i++){ if(L[i].t<=t+0.15) idx=i; else break; } const el=state.lyricLines[idx], c=document.getElementById('np-lyrics'); const cr=c.getBoundingClientRect(), er=el.getBoundingClientRect(); return Math.abs((er.top+er.height/2)-(cr.top+cr.height/2)); }""")
        chk('classic: active line centred', cen<60, cen)
        await pg.evaluate("()=>{ lytSet('chat',true); }")
        print('RESULT', ok, 'pass', bad, 'fail')
        await b.close()
asyncio.run(main())
