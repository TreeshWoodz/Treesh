# Playlist sort & filters (local build, guest profile, catalog from /content).
import asyncio, sys, json
from playwright.async_api import async_playwright
EXE = "/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
fails = []
def ok(c, m):
    print(('  ok   ' if c else '  FAIL ') + m)
    if not c: fails.append(m)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(viewport={'width': 1400, 'height': 900})
        await ctx.add_init_script("""(()=>{ if(localStorage.getItem('__s')) return; localStorage.setItem('__s','1'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); })()""")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/', wait_until='domcontentloaded'); await pg.wait_for_timeout(4500)
        info = await pg.evaluate("""()=>{ const L=vis(SONGS).slice(0,12); const ids=L.map(s=>s.id); createPlaylist('Test mix', ids); const pl=state.playlists[0];
            ids.forEach((id,i)=>{ state.playCounts[id]=(i*7)%5; }); try{ LS.set('treesh_playcounts',state.playCounts); }catch(e){}
            navigate('playlist', pl.id); return {id:pl.id, ids, added:!!pl.added}; }""")
        await pg.wait_for_timeout(800)
        pid = info['id']; ids = info['ids']
        ok(info['added'], 'new playlist records when songs were added')
        order = lambda: pg.evaluate("()=>[...document.querySelectorAll('[data-testid=playlist-song-list] > [data-rid]')].map(e=>e.dataset.rid)")
        ok(await order() == ids, 'custom order by default')
        ok(await pg.locator('[data-rhandle]').count() == len(ids), 'drag handles in custom order')
        # sort by title
        await pg.click('[data-testid=playlist-sort-btn]'); await pg.wait_for_timeout(250)
        ok(await pg.locator('[data-testid=playlist-pop-sort] [data-testid^=playlist-sort-opt-]').count() == 7, 'sort menu has 7 options')
        await pg.click('[data-testid=playlist-sort-opt-title]'); await pg.wait_for_timeout(300)
        titles = await pg.evaluate("()=>[...document.querySelectorAll('[data-testid=playlist-song-list] > [data-rid]')].map(e=>SONG_BY_ID[e.dataset.rid].title)")
        ok(titles == sorted(titles, key=lambda t: t.lower()) or titles == await pg.evaluate("(t)=>t.slice().sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}))", titles), 'Title A-Z sorts (%s...)' % titles[:3])
        ok(await pg.locator('[data-rhandle]').count() == 0, 'no drag handles when sorted')
        ok(await pg.locator('[data-testid=playlist-sort-note]').count() == 1, 'sorted-by note with actions')
        ok(await pg.evaluate("(id)=>plById(id).sort", pid) == 'title', 'sort saved on the playlist')
        await pg.click('[data-testid=playlist-sort-reverse]'); await pg.wait_for_timeout(250)
        t2 = await pg.evaluate("()=>[...document.querySelectorAll('[data-testid=playlist-song-list] > [data-rid]')].map(e=>SONG_BY_ID[e.dataset.rid].title)")
        ok(t2 == titles[::-1], 'reverse flips the order'); ok((await pg.inner_text('[data-testid=playlist-sort-label]')).startswith('Title Z'), 'label says Z-A')
        # play exactly what you see
        await pg.evaluate("()=>{ state.shuffle=true; }")
        await pg.click('[data-testid=playlist-play]'); await pg.wait_for_timeout(500)
        q = await pg.evaluate("()=>({first:curSong()&&curSong().title, q:(state.queue||[]).map(s=>s.title), sh:state.shuffle})")
        ok(q['first'] == t2[0] and q['q'][:len(t2)] == t2 and not q['sh'], 'Play plays the sorted list in order, shuffle off (%s)' % q['first'])
        try: await pg.evaluate("()=>{ audio.pause(); }")
        except Exception: pass
        # most played meta
        await pg.click('[data-testid=playlist-sort-btn]'); await pg.wait_for_timeout(200); await pg.click('[data-testid=playlist-sort-opt-played]'); await pg.wait_for_timeout(300)
        pcs = await pg.evaluate("()=>[...document.querySelectorAll('[data-testid=playlist-song-list] > [data-rid]')].map(e=>playCount(e.dataset.rid))")
        ok(pcs == sorted(pcs, reverse=True), 'Most played sorts by plays %s' % pcs)
        ok(await pg.locator('.pls-meta').count() == len(ids), 'each row shows its play count')
        # filters
        await pg.fill('[data-testid=playlist-search]', ''); await pg.type('[data-testid=playlist-search]', SONG := (await pg.evaluate("(id)=>SONG_BY_ID[id].title.slice(0,5)", ids[3])))
        await pg.wait_for_timeout(400)
        n = await pg.locator('[data-testid=playlist-song-list] > [data-rid]').count()
        ok(n >= 1 and await pg.locator('[data-testid=playlist-filter-count]').count() == 1, 'search filters (%d) and shows count' % n)
        ok(await pg.evaluate("()=>document.activeElement&&document.activeElement.id==='pls-q'"), 'search keeps focus while typing')
        ctxl = await pg.evaluate("(id)=>resolveCtxList('pl:'+id).length", pid); ok(ctxl == n, 'play list = what you see (%d)' % ctxl)
        await pg.click('[data-testid=playlist-search-clear]'); await pg.wait_for_timeout(300)
        ok(await pg.locator('[data-testid=playlist-song-list] > [data-rid]').count() == len(ids), 'clear search restores all')
        await pg.click('[data-testid=playlist-filter-unplayed]'); await pg.wait_for_timeout(300)
        up = await pg.evaluate("()=>[...document.querySelectorAll('[data-testid=playlist-song-list] > [data-rid]')].map(e=>playCount(e.dataset.rid))")
        ok(len(up) > 0 and all(x == 0 for x in up), 'Unplayed shows only unplayed %s' % up)
        await pg.click('[data-testid=playlist-filter-unplayed]'); await pg.wait_for_timeout(200)
        if await pg.locator('[data-testid=playlist-filter-artist]').count():
            await pg.click('[data-testid=playlist-filter-artist]'); await pg.wait_for_timeout(250)
            art = await pg.inner_text('[data-testid=playlist-artist-opt-0] .flex-1'); await pg.click('[data-testid=playlist-artist-opt-0]'); await pg.wait_for_timeout(300)
            arts = await pg.evaluate("()=>[...document.querySelectorAll('[data-testid=playlist-song-list] > [data-rid]')].map(e=>plsArtists(SONG_BY_ID[e.dataset.rid]).join('|'))")
            ok(len(arts) > 0 and all(art.lower() in a.lower() for a in arts), 'Artist filter (%s): %d songs' % (art, len(arts)))
            ok((await pg.inner_text('[data-testid=playlist-filter-artist]')).strip() == art, 'artist chip shows the name')
        if await pg.locator('[data-testid=playlist-filter-tag]').count():
            await pg.click('[data-testid=playlist-filters-clear]'); await pg.wait_for_timeout(200)
            await pg.click('[data-testid=playlist-filter-tag]'); await pg.wait_for_timeout(250)
            await pg.click('[data-testid=playlist-tag-opt-g-0]'); await pg.wait_for_timeout(300)
            g = await pg.evaluate("()=>plsFil(plsCur()).tag"); gs = await pg.evaluate("()=>[...document.querySelectorAll('[data-testid=playlist-song-list] > [data-rid]')].map(e=>SONG_BY_ID[e.dataset.rid].genre)")
            ok(len(gs) > 0 and all(x.lower() == g[2:].lower() for x in gs), 'Genre filter %s -> %s' % (g, gs))
        if await pg.locator('[data-testid=playlist-filter-clean]').count():
            await pg.click('[data-testid=playlist-filters-clear]'); await pg.wait_for_timeout(200); await pg.click('[data-testid=playlist-filter-clean]'); await pg.wait_for_timeout(300)
            ok(await pg.evaluate("()=>[...document.querySelectorAll('[data-testid=playlist-song-list] > [data-rid]')].every(e=>!SONG_BY_ID[e.dataset.rid].explicit)"), 'Hide explicit')
        await pg.click('[data-testid=playlist-filters-clear]'); await pg.wait_for_timeout(200)
        # empty state
        await pg.fill('[data-testid=playlist-search]', 'zzzzqqq'); await pg.wait_for_timeout(400)
        ok(await pg.locator('[data-testid=playlist-filter-empty]').count() == 1, 'no-match state')
        await pg.click('[data-testid=playlist-filter-empty-clear]'); await pg.wait_for_timeout(300)
        # shuffle uses what you see
        await pg.fill('[data-testid=playlist-search]', SONG); await pg.wait_for_timeout(400); seen = await order()
        await pg.click('[data-testid=playlist-shuffle]'); await pg.wait_for_timeout(400)
        qq = await pg.evaluate("()=>(state.base||state.queue||[]).map(s=>s.id)")
        ok(set(qq) == set(seen), 'Shuffle plays only the filtered songs')
        try: await pg.evaluate("()=>{ audio.pause(); }")
        except Exception: pass
        # filters reset when leaving, sort remembered
        await pg.evaluate("()=>navigate('library')"); await pg.wait_for_timeout(400); await pg.evaluate("(id)=>navigate('playlist',id)", pid); await pg.wait_for_timeout(500)
        ok(await pg.input_value('[data-testid=playlist-search]') == '' and await pg.locator('[data-testid=playlist-filter-count]').count() == 0, 'filters reset after leaving')
        ok((await pg.inner_text('[data-testid=playlist-sort-label]')) == 'Most played', 'sort remembered for this playlist')
        ok('treesh_playlists' in await pg.evaluate("()=>Object.keys(sbKT())"), 'playlist change is tracked for account sync')
        # save this order
        sorted_ids = await order(); await pg.click('[data-testid=playlist-sort-save]'); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("(id)=>plById(id).songIds", pid) == sorted_ids and await pg.evaluate("(id)=>plById(id).sort", pid) == 'custom', 'Save this order -> custom order')
        ok(await pg.locator('[data-rhandle]').count() == len(ids), 'drag handles back')
        # back to custom
        await pg.click('[data-testid=playlist-sort-btn]'); await pg.wait_for_timeout(200); await pg.click('[data-testid=playlist-sort-opt-added]'); await pg.wait_for_timeout(300)
        await pg.click('[data-testid=playlist-sort-custom]'); await pg.wait_for_timeout(300)
        ok(await order() == sorted_ids and await pg.evaluate("(id)=>plById(id).sort", pid) == 'custom', 'Back to custom order')
        # recently added: add a song, it goes first
        new_id = await pg.evaluate("(id)=>{ const pl=plById(id); const s=vis(SONGS).find(x=>!pl.songIds.includes(x.id)); pl.songIds.push(s.id); savePl(); renderView(); return s.id; }", pid)
        await pg.click('[data-testid=playlist-sort-btn]'); await pg.wait_for_timeout(200); await pg.click('[data-testid=playlist-sort-opt-added]'); await pg.wait_for_timeout(300)
        ok((await order())[0] == new_id, 'Recently added: newest song first')
        # escape closes menu only
        await pg.click('[data-testid=playlist-sort-btn]'); await pg.wait_for_timeout(200); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        ok(await pg.locator('#pls-pop').count() == 0 and await pg.evaluate("()=>state.view") == 'playlist', 'Escape closes the menu')
        # duration
        await pg.click('[data-testid=playlist-sort-btn]'); await pg.wait_for_timeout(200); await pg.click('[data-testid=playlist-sort-opt-duration]')
        await pg.wait_for_timeout(9000)
        ds = await pg.evaluate("()=>[...document.querySelectorAll('[data-testid=playlist-song-list] > [data-rid]')].map(e=>plsDur(SONG_BY_ID[e.dataset.rid]))")
        known = [d for d in ds if d]
        ok(len(known) >= len(ds) - 2 and known == sorted(known), 'Duration sort measured %d/%d, ascending %s' % (len(known), len(ds), ds))
        # drag reorder keeps hidden songs
        r = await pg.evaluate("""(id)=>{ const pl=plById(id); pl.sort='custom'; const before=pl.songIds.slice(); REORDER_CBS.pl([before[2],before[0]]); return {before, after:plById(id).songIds}; }""", pid)
        b4 = r['before']; ok(r['after'][0] == b4[2] and r['after'][2] == b4[0] and len(r['after']) == len(b4), 'reorder of shown songs keeps the others')
        ok(not errs, 'no page errors %s' % errs[:3])
        await b.close()
    print('\n%d failed' % len(fails)); sys.exit(1 if fails else 0)
asyncio.run(main())
