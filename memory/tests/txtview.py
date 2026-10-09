import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
LIVE={'songs':'/tmp/live_songs.dot.html','lyrics':'/tmp/live_lyrics.dot.html','icons':'/tmp/live_icons.dot.html'}
TITLES=sys.argv[1].split('|') if len(sys.argv)>1 else ['Cherry','Billion $ Bitch (Remix)']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width':1400,'height':850})
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        async def live(route):
            k=[x for x in LIVE if ('/content/'+x) in route.request.url][0]
            await route.fulfill(status=200, content_type='text/html', body=open(LIVE[k],encoding='utf-8').read())
        await pg.route('**/content/songs*', live); await pg.route('**/content/lyrics*', live); await pg.route('**/content/icons*', live)
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('treesh_lyt','\"chat\"');}"); await pg.reload(); await pg.wait_for_timeout(3500)
        for title in TITLES:
            r = await pg.evaluate("""(t)=>{ const s=SONGS.find(x=>x.title===t); if(!s) return null; playSong(s,[s]); try{ audio.pause(); }catch(e){} state.npOpen=true; state.showLyrics=true; renderNP(); return {id:s.id, artist:s.artist, ids:s.artistIds, feat:s.featuring, main:wcMainId(s)}; }""", title)
            print('====', title, r)
            if not r: continue
            await pg.wait_for_timeout(1500)
            rows = await pg.evaluate("""()=>{ const c=document.getElementById('np-lyrics'); return [...c.querySelectorAll('[data-line-wrap]')].map(w=>({sec:w.classList.contains('lyt-sec'), who:w.dataset.who||'', name:(w.querySelector('.wc-name')||{}).textContent||'', av:(w.querySelector('.wc-av b')||{}).textContent||'', img:!!w.querySelector('.wc-av img'), text:((w.querySelector('.np-line')||{}).textContent||'').trim().slice(0,60)})); }""")
            last=None
            for x in rows:
                if x['sec']:
                    print('   [hidden]', x['text']); continue
                k=(x['who'],x['name'])
                if k!=last: print('  >', x['name'], '| who', x['who'], '| avatar', x['av'], 'img' if x['img'] else 'letter'); last=k
                print('      ', x['text'])
            bad=[x for x in rows if not x['sec'] and x['text'].startswith('[')]
            print('BRACKET BUBBLES:', bad)
            start = await pg.evaluate("()=>{ const s=document.querySelector('[data-testid=lyt-chat-start]'); return s&&{name:s.querySelector('b').textContent, avs:[...s.querySelectorAll('.wc-av')].map(a=>(a.querySelector('b')||{}).textContent+(a.querySelector('img')?'+img':''))}; }")
            print('START', start)
            await pg.screenshot(path='/tmp/txt_%s.png' % ''.join(c for c in title if c.isalnum()))
        await b.close()
asyncio.run(main())
