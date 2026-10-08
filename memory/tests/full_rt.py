import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
async def main():
    errs=[]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**(p.devices['iPhone 13'] if MOBILE else {'viewport':{'width':1400,'height':850}}))
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: (errs.append(str(e)), print('PAGEERR', e)))
        pg.on('console', lambda m: print('CON', m.type, m.text) if m.type in ('error',) else None)
        await pg.goto('http://localhost:3000/')
        await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}")
        await pg.reload(); await pg.wait_for_timeout(3500)

        # ---------- no-box CSS check for all non-classic themes ----------
        await pg.evaluate("""()=>{ const s=SONG_BY_ID['chelly-banqz-shake-it-some-mo']; playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); }""")
        await pg.wait_for_timeout(1500)
        for t in ['chat','neon','type','note','term','comic','pola']:
            await pg.evaluate(f"()=>lytSet('{t}',true)"); await pg.wait_for_timeout(600)
            info = await pg.evaluate("""()=>{ const r=document.querySelector('#np-lyric-region'); const l=document.querySelector('#np-lyrics'); if(!r||!l) return null; const brb=getComputedStyle(r,'::before').background; const bg=getComputedStyle(l).backgroundColor; return {rb:brb, lb:bg}; }""")
            print(f'nobox {t}', info)

        # ---------- lyric card disclaimer for chat style ----------
        await pg.evaluate("()=>{ state.npOpen=false; renderNP(); }"); await pg.wait_for_timeout(300)
        await pg.evaluate("""()=>{ const id='chelly-banqz-shake-it-some-mo'; openLyricStudio(id); state.studio.picked=[10,11,12,13].map(i=>studioPickEntry(id,i)); openLyricStudio(id); }""")
        await pg.wait_for_timeout(900)
        has_chat = await pg.locator('[data-testid="card-style-chat"]').count()
        print('card-style-chat present', has_chat)
        if has_chat:
            await pg.locator('[data-testid="card-style-chat"]').click(force=True); await pg.wait_for_timeout(1200)
            # Check canvas pixel data for a dark pill near bottom containing text
            dis = await pg.evaluate("""()=>{ const c=document.querySelector('#lyric-canvas'); if(!c) return null; const ctx=c.getContext('2d'); const h=c.height, w=c.width; const img=ctx.getImageData(0, Math.floor(h*0.88), w, Math.floor(h*0.1)); let dark=0; for(let i=0;i<img.data.length;i+=4){ const r=img.data[i],g=img.data[i+1],bl=img.data[i+2],a=img.data[i+3]; if(a>200 && r<80 && g<80 && bl<80) dark++; } return {w,h,darkPixels:dark}; }""")
            print('disclaimer pixels', dis)
            # Change style to classic to verify no disclaimer
            if await pg.locator('[data-testid="card-style-classic"]').count():
                await pg.locator('[data-testid="card-style-classic"]').click(force=True); await pg.wait_for_timeout(800)
                dis2 = await pg.evaluate("""()=>{ const c=document.querySelector('#lyric-canvas'); const ctx=c.getContext('2d'); const h=c.height, w=c.width; const img=ctx.getImageData(0, Math.floor(h*0.88), w, Math.floor(h*0.1)); let dark=0; for(let i=0;i<img.data.length;i+=4){ const r=img.data[i],g=img.data[i+1],bl=img.data[i+2],a=img.data[i+3]; if(a>200 && r<80 && g<80 && bl<80) dark++; } return dark; }""")
                print('classic disclaimer pixels', dis2)
            await pg.evaluate("()=>{ try{ closeLyricStudio&&closeLyricStudio() }catch(e){} }")

        # ---------- DGC tile check ----------
        await pg.evaluate("()=>{ state.view='game'; state.gameTab='games'; renderView(true); }"); await pg.wait_for_timeout(1200)
        await pg.locator('[data-testid="games-arcade"]').scroll_into_view_if_needed(); await pg.wait_for_timeout(400)
        print('count label', await pg.locator('[data-testid="games-arcade-count"]').text_content())
        tile = await pg.evaluate("""()=>{ const t=document.querySelector('[data-testid="game-open-dgc"]'); if(!t) return null; return {html: t.innerHTML.substr(0,300), hasImg: !!t.querySelector('img, canvas, svg, .dgc-mask, [class*=mask]')}; }""")
        print('dgc tile', tile)

        # ---------- Notify-me generic for coming-soon game ----------
        await pg.evaluate("()=>{ GAME_BY_KEY['sonoku'].soon=true; renderView(true); }"); await pg.wait_for_timeout(800)
        notify = await pg.locator('[data-testid="game-notify-sonoku"]').count()
        print('sonoku notify chip', notify)
        if notify:
            await pg.locator('[data-testid="game-notify-sonoku"]').evaluate("e=>e.scrollIntoView({block:'center'})"); await pg.wait_for_timeout(200)
            await pg.evaluate("()=>document.querySelector('[data-testid=\"game-notify-sonoku\"]').click()"); await pg.wait_for_timeout(400)
            print('notify storage after click', await pg.evaluate("()=>localStorage.getItem('treesh_game_notify')"))
            # Info modal switch
            await pg.evaluate("()=>openGameInfo('sonoku')"); await pg.wait_for_timeout(600)
            print('info notify switch', await pg.locator('[data-testid="game-info-notify-sonoku"]').count())
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # reset soon
        await pg.evaluate("()=>{ GAME_BY_KEY['sonoku'].soon=false; renderView(true); }"); await pg.wait_for_timeout(300)

        # ---------- Search home with recent + trending + jumps ----------
        await pg.evaluate("()=>localStorage.setItem('treesh_recent_searches', JSON.stringify(['black barbie','pink']))")
        if MOBILE: await pg.evaluate("()=>openSearch()")
        else: await pg.keyboard.press('Control+k')
        await pg.wait_for_timeout(900)
        home_info = await pg.evaluate("""()=>({
          recent: document.querySelectorAll('[data-testid^=search-recent-]').length,
          recentDel: document.querySelectorAll('[data-testid^=search-recent-del-]').length,
          trend: document.querySelectorAll('[data-testid^=search-trend-]').length,
          jumpArcade: !!document.querySelector('[data-testid=search-jump-arcade]'),
          jumpLyt: !!document.querySelector('[data-testid=search-jump-lyt]'),
          jumpUsers: !!document.querySelector('[data-testid=search-jump-users]'),
          jumpSettings: !!document.querySelector('[data-testid=search-jump-settings]'),
        })""")
        print('home info', home_info)
        # qqqzzzx no results
        await pg.locator('#search-input').fill('qqqzzzx'); await pg.wait_for_timeout(500)
        print('no results', await pg.locator('[data-testid="search-no-results"]').count())
        # Esc closes
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        print('closed', await pg.locator('[data-testid="search-overlay"]').count())

        # ---------- Support page ----------
        pg2 = await ctx.new_page()
        await pg2.goto('http://localhost:3000/support.html'); await pg2.wait_for_timeout(1500)
        shots = await pg2.evaluate("""()=>{ const ks=['search','search-top','lyric-themes','lyt-chat','lyric-card','arcade','arcade-filters','dgc']; const out={}; for(const k of ks){ const imgs=[...document.querySelectorAll(`img[data-shot="${k}"], [data-shot="${k}"] img`)]; out[k]={count:imgs.length, broken:imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)}; } return out; }""")
        print('support shots', shots)
        txt = await pg2.evaluate("""()=>document.body.innerText""")
        for kw in ['Ctrl+K','lyric theme','Color lines by singer','Text Messages',"Don't Get Caught",'Notify']:
            print('kw', kw, kw.lower() in txt.lower())
        # Check FAQ for coming soon mentions
        for g in ['Bronze Blitz','Ebonics','Sonoku']:
            cs = (g.lower() in txt.lower()) and ('coming soon' in txt.lower().split(g.lower())[-1][:200] if g.lower() in txt.lower() else False)
            print('faq coming-soon', g, cs)

        print('ERRS', errs)
        await b.close()
asyncio.run(main())
