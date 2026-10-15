import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
LIVE={'songs':'/tmp/live_songs.dot.html','lyrics':'/tmp/live_lyrics.dot.html','icons':'/tmp/live_icons.dot.html'}
MOB='m' in sys.argv[1:]
VERB='v' in sys.argv[1:]
SONG=([a for a in sys.argv[1:] if a not in ('m','d','v')] or ['Cherry'])[0]
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
        info = await pg.evaluate("""(t)=>{ const s=SONGS.find(x=>x.title===t); playSong(s,[s]); try{ audio.pause(); }catch(e){} state.npOpen=true; state.showLyrics=true; renderNP();
          const L=s.lyrics; const out=[]; L.forEach((l,i)=>{ const x=lyDuoLine(s,l); if(x&&x.parts.length) out.push([i,l.t,l.text,lyPT(s,L,i)]); }); return {lyt:document.getElementById('np-lyrics').dataset.lyt, prog:document.getElementById('np-lyrics').classList.contains('lyt-progressive'), n:L.length, duo:out}; }""", SONG)
        print(json.dumps(info)[:1500])
        await pg.evaluate("()=>{ window.__T=0; Object.defineProperty(audio,'currentTime',{configurable:true,get(){return window.__T;},set(v){window.__T=v;}}); }")
        await pg.wait_for_timeout(800)
        # step time through every duo line, sample scroll position
        jumps=[]; hist=[]
        for (i,t0,txt,pt) in info['duo'][:8]:
            t=max(0,t0-1.0); end=(pt[-1][1] if pt else t0+3)+1.0
            while t<end:
                r = await pg.evaluate("(t)=>{ window.__T=t; audio.dispatchEvent(new Event('timeupdate')); const c=document.getElementById('np-lyrics'); return [c.scrollTop, c.scrollHeight-c.clientHeight]; }", t)
                await pg.wait_for_timeout(70)
                r2 = await pg.evaluate("()=>{ const c=document.getElementById('np-lyrics'); const vis=[...c.children].filter(x=>x.offsetParent!==null||getComputedStyle(x).display!=='none').length; return [c.scrollTop, c.scrollHeight-c.clientHeight, c.scrollHeight, c.clientHeight, vis, c.children.length]; }")
                if VERB and info['duo'].index([i,t0,txt,pt])<2: print('  t',round(t,2),'i',i,'pre',r,'post',r2)
                hist.append((round(t,2),i,r2[0],r2[1]))
                if len(hist)>1 and hist[-2][2]-r2[0]>40: jumps.append((round(t,2),i,txt[:40],hist[-2][2],r2[0],r2[1]))
                t+=0.25
        print('JUMPS', len(jumps))
        for j in jumps[:20]: print(' ', j)
        await pg.screenshot(path=f'/tmp/chatjump_{"m" if MOB else "d"}.png')
        await b.close()
asyncio.run(main())
