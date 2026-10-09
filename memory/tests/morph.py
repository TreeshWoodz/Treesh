import asyncio, sys, json
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        mode=sys.argv[1] if len(sys.argv)>1 else 'm'
        dev = {'m':p.devices['iPhone 13'],'d':{'viewport':{'width':1400,'height':850}}}[mode]
        ctx = await b.new_context(**dev)
        await ctx.add_init_script("localStorage.setItem('treesh_whatsnew_off','true');localStorage.setItem('treesh_eco_ask','1');if(!localStorage.getItem('treesh_profile'))localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));")
        pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/'); await pg.wait_for_timeout(5000)
        # studio: theme / font / color changes keep the same nodes and scroll
        await pg.evaluate("()=>{ const id='chelly-banqz-shake-it-some-mo'; openLyricStudio(id); state.studio.picked=[10,11].map(i=>studioPickEntry(id,i)); openLyricStudio(id); }"); await pg.wait_for_timeout(1200)
        await pg.evaluate("()=>{ window.__bd=document.querySelector('#modal [data-act=\"modal-backdrop\"]'); window.__cv=document.getElementById('lyric-canvas'); const sc=document.getElementById('lyric-studio-scroll')||document.querySelector('#modal .st-opts'); window.__sc=sc; if(sc) sc.scrollTop=400; window.__img=document.querySelector('#modal img'); }")
        await pg.click('[data-testid="card-style-classic"]'); await pg.wait_for_timeout(500)
        r=[]
        for sel in ['[data-testid="card-theme-2"]','[data-testid="card-theme-4"]','[data-testid="card-bg-mode-cover"]','[data-testid="card-bg-mode-theme"]']:
            try:
                await pg.click(sel, timeout=3000); await pg.wait_for_timeout(350)
                r.append(await pg.evaluate("(s)=>{ const sc=document.getElementById('lyric-studio-scroll')||document.querySelector('#modal .st-opts'); return [s, document.querySelector('#modal [data-act=\"modal-backdrop\"]')===window.__bd, document.getElementById('lyric-canvas')===window.__cv, sc===window.__sc, sc&&Math.round(sc.scrollTop), !!document.querySelector('[data-testid=\"lyric-card-style-card\"]'), document.querySelectorAll('[data-testid=\"lyric-card-style-card\"]').length, document.querySelector('#modal img')===window.__img]; }", sel))
            except Exception as e: r.append([sel,'ERR',str(e)[:80]])
        for x in r: print('studio', x)
        await pg.click('[data-testid="card-style-chat"]'); await pg.wait_for_timeout(500)
        print('chat', await pg.evaluate("()=>[document.querySelector('#modal [data-act=\"modal-backdrop\"]')===window.__bd, document.querySelectorAll('[data-act=\"lc-clip\"]').length, document.querySelector('[data-testid=\"card-style-chat\"]').getAttribute('aria-pressed'), [...document.querySelectorAll('[data-testid=\"lyric-card-bg-card\"]')].map(e=>e.classList.contains('hidden'))]"))
        await pg.click('[data-testid="card-style-classic"]'); await pg.wait_for_timeout(500)
        print('classic', await pg.evaluate("()=>[document.querySelectorAll('[data-act=\"lc-clip\"]').length, [...document.querySelectorAll('[data-testid=\"lyric-card-bg-card\"]')].map(e=>e.classList.contains('hidden')), document.querySelector('[data-testid=\"lyric-card-style-name\"]').textContent]"))
        await pg.screenshot(path='/app/memory/tests/morph_studio_%s.jpg'%mode, quality=40, type='jpeg')
        await pg.evaluate("()=>closeModal()"); await pg.wait_for_timeout(500)
        # home: like a song keeps page nodes
        await pg.evaluate("()=>{ window.__h=document.querySelector('#view').firstElementChild; window.__imgs=[...document.querySelectorAll('#view img')].slice(0,5); window.__hdr=document.querySelector('#app header'); }")
        await pg.evaluate("()=>{ const s=SONGS[0]; toggleFav(s.id); }") if await pg.evaluate("()=>typeof toggleFav==='function'") else None
        await pg.evaluate("()=>{ refreshDynamic(); renderShell(); renderView(); }"); await pg.wait_for_timeout(400)
        print('home', await pg.evaluate("()=>[document.querySelector('#view').firstElementChild===window.__h, window.__imgs.filter(i=>i.isConnected).length+'/'+window.__imgs.length, document.querySelector('#app header')===window.__hdr, !!document.querySelector('[data-testid=\"header-notifications-bell-btn\"]'), document.querySelectorAll('[data-testid=\"header-notifications-bell-btn\"]').length]"))
        views=['artists','library','playlists','settings','studios','game','favorites']
        for v in views:
            await pg.evaluate(f"()=>navigate('{v}')"); await pg.wait_for_timeout(700)
            n0=await pg.evaluate("()=>document.querySelectorAll('#view *').length")
            await pg.evaluate("()=>{ window.__f=document.querySelector('#view').firstElementChild; renderView(); renderView(); }"); await pg.wait_for_timeout(200)
            print('view', v, n0, await pg.evaluate("()=>[document.querySelectorAll('#view *').length, document.querySelector('#view').firstElementChild===window.__f]"))
        for t in ['appearance','voice','account','system']:
            await pg.evaluate(f"()=>{{ state.settingsTab='{t}'; navigate('settings'); }}"); await pg.wait_for_timeout(500)
            await pg.evaluate("()=>{ renderView(); }"); await pg.wait_for_timeout(150)
        await pg.screenshot(path='/app/memory/tests/morph_settings_%s.jpg'%mode, quality=40, type='jpeg')
        await pg.evaluate("()=>navigate('artist','13')"); await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{ window.__ph=document.querySelector('.ar-hero-photo'); renderView(); }"); await pg.wait_for_timeout(300)
        print('artist', await pg.evaluate("()=>[document.querySelector('.ar-hero-photo')===window.__ph, document.querySelector('.ar-hero-bg').dataset.fit, document.querySelector('.ar-hero-photo').style.objectPosition]"))
        print('errors', errs[:5])
        await b.close()
asyncio.run(main())
