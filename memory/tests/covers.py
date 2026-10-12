import asyncio, sys, json
from playwright.async_api import async_playwright
sys.path.insert(0, '/app/memory/tests')
from light_audit import EXE  # noqa
# python3 covers.py [m|d] -> for each view: song covers (img with a song's coverArt) and what tapping them does (song-open or not)
VP = sys.argv[1] if len(sys.argv) > 1 else 'd'
PROBE = """(where)=>{ const bySrc={}; SONGS.forEach(s=>{ if(s.coverArt) (bySrc[s.coverArt]=bySrc[s.coverArt]||[]).push(s.id); });
  const out={}; document.querySelectorAll(where+' img').forEach(im=>{ const src=im.getAttribute('src')||im.currentSrc||''; if(!bySrc[src]) return; const r=im.getBoundingClientRect(); if(r.width<20) return;
    const hit=im.closest('[data-act]'); const act=hit?hit.dataset.act:'-'; let p=im, tid=''; while(p&&!tid){ tid=p.getAttribute&&p.getAttribute('data-testid')||''; if(!tid) p=p.parentElement; }
    const k=act+' | '+(tid||'?').replace(/[-_][0-9a-z]{6,}$/,'-#').replace(/\\d+$/,'#'); out[k]=(out[k]||0)+1; }); return out; }"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**(dict(p.devices['iPhone 13']) if VP == 'm' else {'viewport': {'width': 1400, 'height': 900}}))
        await ctx.add_init_script("localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_icon_note_7255','true'); localStorage.setItem('treesh_push',JSON.stringify({asked:true})); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));")
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(3500)
        await pg.evaluate("(()=>{ const ids=SONGS.slice(0,6).map(s=>s.id); ids.forEach(id=>{ try{ if(!isFav(id)) toggleFav(id); }catch(e){} }); try{ state.playlists=[{id:'pl1',name:'Mix',songIds:ids,added:{}}]; savePl(); }catch(e){} })()")
        await pg.evaluate("playSong(SONGS[0],SONGS.slice(0,8)); setTimeout(()=>{ try{ togglePlay(); }catch(e){} },300)"); await pg.wait_for_timeout(800)
        views = [('library', ''), ('picks', ''), ('favorites', ''), ('playlist', 'pl1'), ('artist', None), ('playlists', '')]
        for v, prm in views:
            if prm is None: prm = await pg.evaluate("(SONGS[0].artistIds||[])[0]||''")
            await pg.evaluate(f"navigate('{v}','{prm}')"); await pg.wait_for_timeout(1200)
            print(v, json.dumps(await pg.evaluate(PROBE, '#view'), indent=0))
        print('mini', json.dumps(await pg.evaluate(PROBE, '#mini')))
        print('sidebar', json.dumps(await pg.evaluate(PROBE, 'aside')))
        await pg.evaluate("state.queueOpen=true; renderQueue()"); await pg.wait_for_timeout(700)
        print('queue', json.dumps(await pg.evaluate(PROBE, '#queue')))
        await pg.evaluate("state.queueOpen=false; renderQueue(); state.searchQuery='a'; openSearch()"); await pg.wait_for_timeout(900)
        await pg.fill('input[type=search], #searchlay input', 'pink'); await pg.wait_for_timeout(900)
        print('search', json.dumps(await pg.evaluate(PROBE, '#searchlay')))
        print('errors', errs[:4])
        await b.close()
asyncio.run(main())
