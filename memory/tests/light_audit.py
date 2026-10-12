import asyncio, sys, json, os
from playwright.async_api import async_playwright
# Light-theme audit: opens every page / modal / sheet in light mode, scans contrast + dark surfaces, saves screenshots.
# python3 light_audit.py d|m [name-filter] [--sat]  (--sat: simulates a 47px iOS status bar to catch content hidden under it)   -> /tmp/light_audit/<vp>/*.jpg + results.json
EXE = "/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
SCAN = open('/app/memory/tests/light_scan.js').read()
DB = {"users": {"a@test.com": {"id": "ua1", "email": "a@test.com", "password": "secret123", "confirmed": True}, "b@test.com": {"id": "ub1", "email": "b@test.com", "password": "secret123", "confirmed": True}, "s@test.com": {"id": "us1", "email": "s@test.com", "password": "secret123", "confirmed": True}},
      "profiles": {"ua1": {"id": "ua1", "username": "alice", "display_name": "Alice A"}, "ub1": {"id": "ub1", "username": "chellyoance", "display_name": "Verse Queen", "verified": True}, "us1": {"id": "us1", "username": "staffy", "display_name": "Staff S"}},
      "files": {}, "mod": {"us1": {"role": "admin"}}, "news": [{"id": 1, "title": "Big drop tonight", "body": "Three new songs at 9", "kind": "news", "audience": "all", "url": "/?u=alice"}]}
A = "SONGS[0]"
S = [  # (name, js, root selector or None=auto, needs) needs: 'admin' | 'out' (signed out)
 ('page-home', "navigate('library')", '#view', ''), ('page-icons', "navigate('artists')", '#view', ''), ('page-studios', "navigate('studios')", '#view', ''), ('page-game', "navigate('game')", '#view', ''),
 ('page-artist', "navigate('artist', ARTISTS[0].id)", '#view', ''),
 ('set-appearance', "state.settingsTab='appearance'; navigate('settings')", '#view', ''), ('set-audio', "state.settingsTab='audio'; navigate('settings')", '#view', ''),
 ('set-voice', "state.settingsTab='voice'; navigate('settings')", '#view', ''), ('set-account', "state.settingsTab='account'; navigate('settings')", '#view', ''), ('set-system', "state.settingsTab='system'; navigate('settings')", '#view', ''),
 ('search', "openSearch()", None, ''),
 ('search-users', "openSearch(); setTimeout(()=>{ const b=document.querySelector('[data-testid=\"search-filter-users\"]'); b&&b.click(); },500)", None, ''),
 ('search-users-q', "openSearch(); setTimeout(()=>{ const b=document.querySelector('[data-testid=\"search-filter-users\"]'); b&&b.click(); setTimeout(()=>{ const i=document.querySelector('#searchlay input'); if(i){ i.value='ch'; i.dispatchEvent(new Event('input',{bubbles:true})); } },400); },500)", None, ''),
 ('search-q', "openSearch(); setTimeout(()=>{ const i=document.querySelector('#searchlay input'); if(i){ i.value='a'; i.dispatchEvent(new Event('input',{bubbles:true})); } },500)", None, ''),
 ('urias', "voiceOpen()", None, ''),
 ('edit-track', f"openMetadata({A}.id)", None, ''),
 ('edit-track-details', f"openMetadata({A}.id); setTimeout(()=>{{ const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Details'); b&&b.click(); }},600)", None, ''),
 ('edit-track-lyrics', f"openMetadata({A}.id); setTimeout(()=>{{ const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Lyrics'); b&&b.click(); }},600)", None, ''),
 ('edit-track-timing', f"openMetadata({A}.id); setTimeout(()=>{{ const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Timing'); b&&b.click(); }},600)", None, ''),
 ('song-menu', f"openSongMenu({A}.id)", None, ''), ('add-to-playlist', f"openAddToPlaylist({A}.id)", None, ''), ('song-facts', f"openSongFacts({A}.title,{A}.id)", None, ''),
 ('find-lyrics', f"openFindLyrics({A}.id)", None, ''), ('lyric-studio', f"openLyricStudio({A}.id)", None, ''), ('lyric-sync', f"openLyricSync({A}.id)", None, ''),
 ('image-studio', "openImageStudioFree()", None, ''), ('equalizer', "openEqualizer()", None, ''), ('backdrops', "openBackdrops()", None, ''), ('perf-menu', f"openPerfMenu({A}.title,{A}.id)", None, ''),
 ('a11y-quick', "openA11yQuick()", None, ''), ('lock-setup', "openLockSetup()", None, ''), ('profile', "openProfile()", None, ''), ('friend-profile', "sxOpenProfile('chellyoance')", None, ''),
 ('confirm', "openConfirm('Delete this playlist?','This can\\u2019t be undone.',()=>{})", None, ''), ('prompt', "openPrompt('Rename playlist','Road trip',()=>{})", None, ''),
 ('music-manager', "openMusicManager()", None, ''), ('add-music', "openAddMusic()", None, ''), ('whats-new', "wnOpen()", None, ''), ('nps', "npsOpen()", None, ''), ('pv', "pvOpen()", None, ''),
 ('support-form', "tsOpen('support')", None, ''), ('feedback-form', "tsOpen('feedback')", None, ''), ('lyt', "lytOpen()", None, ''), ('bd', "bdOpen()", None, ''), ('zh', "zhOpen()", None, ''),
 ('mad', "madOpen()", None, ''), ('mod', "modOpen()", None, ''), ('instrum', "instrumOpenModal()", None, ''), ('nav-more', "openNavMore()", None, ''),
 ('now-playing', f"playSong({A},SONGS); state.npOpen=true; renderNP()", None, ''), ('np-lyrics', f"playSong({A},SONGS); state.npOpen=true; state.showLyrics=true; renderNP()", None, ''),
 ('queue', f"playSong({A},SONGS); state.queueOpen=true; renderQueue()", None, ''), ('mini-player', f"playSong({A},SONGS)", '#mini', ''),
 ('notif-center', "ntcOpen()", None, ''), ('notif-prefs', "ntcOpen(); setTimeout(()=>{ const b=document.querySelector('[data-testid=\"notifications-preferences-btn\"]'); b&&b.click(); },600)", None, ''),
 ('nt-banner', "__mockAs('ub1','send_friend_request',{target:'ua1'})", '#ntb-root', ''),
 ('auth', "sbAuthOpen('signin')", None, 'out'), ('auth-signup', "sbAuthOpen('signup')", None, 'out'),
 ('admin', "admOpen()", None, 'admin'), ('admin-announce', "admOpen(); setTimeout(()=>{ const b=document.querySelector('[data-testid=\"admin-nav-announce\"]'); b&&b.click(); },900)", None, 'admin'),
 ('magic-markup', "mkStart()", None, ''), ('push-prompt', "puAskShow()", '#pu-ask', ''), ('version-banner', "_ver.next={v:'x',notes:'Push notifications are here'}; verShow()", '#vb-root', ''),
 ('te-cover', f"umEditOpen({A}.id)", None, ''), ('te-details', f"state._teTab='details'; umEditOpen({A}.id)", None, ''),
 ('te-lyrics', f"state._teTab='lyrics'; umEditOpen({A}.id)", None, ''), ('te-timing', f"state._teTab='timing'; umEditOpen({A}.id)", None, ''),
 ('search-games', "openSearch(); setTimeout(()=>{ const b=document.querySelector('[data-testid=\"search-filter-games\"]'); b&&b.click(); },500)", None, ''),
 ('search-settings', "openSearch(); setTimeout(()=>{ const b=document.querySelector('[data-testid=\"search-filter-settings\"]'); b&&b.click(); },500)", None, ''),
 ('page-profile', "navigate('profile')", '#view', ''), ('page-playlist', "navigate('library')", '#view', ''),
 ('toast', "toast('Saved to favorites','Find it in Home')", '#toast', ''), ('app-lock', "openAppLock()", None, ''),
]
async def main():
    SAT = '--sat' in sys.argv; av = [a for a in sys.argv if a != '--sat']
    vp = av[1] if len(av) > 1 else 'm'; flt = av[2] if len(av) > 2 else ''
    out = f'/app/.audit/{"sat" if SAT else "light"}_audit/{vp}'; os.makedirs(out, exist_ok=True); results = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        for need in ['', 'admin', 'out']:
            todo = [s for s in S if s[3] == need and flt in s[0]]
            if not todo: continue
            opts = dict(p.devices['iPhone 13']) if vp == 'm' else {'viewport': {'width': 1400, 'height': 860}}
            ctx = await b.new_context(**opts)
            sess = None if need == 'out' else {"access_token": "tok_us1" if need == 'admin' else "tok_ua1", "refresh_token": "r", "user": {"id": "us1" if need == 'admin' else "ua1", "email": "x@test.com"}}
            seed = "localStorage.setItem('treesh_theme','\"light\"'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_push',JSON.stringify({asked:true})); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s);" % json.dumps(json.dumps(DB))
            if sess: seed += "localStorage.setItem('__mock_sb_session',%s);" % json.dumps(json.dumps(sess))
            await ctx.add_init_script("if(!sessionStorage.getItem('__seeded')){ sessionStorage.setItem('__seeded','1'); localStorage.clear(); %s }" % seed)
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
            if SAT: await ctx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{ document.documentElement.style.setProperty('--sat','47px'); const d=document.createElement('div'); d.style.cssText='position:fixed;left:0;right:0;top:0;height:47px;z-index:2147483647;pointer-events:none;background:repeating-linear-gradient(90deg,rgba(255,0,0,.28) 0 6px,rgba(255,0,0,.12) 6px 12px)'; document.body.appendChild(d); })")
            await pg.goto('http://localhost:3000/' + ('_sattest.html' if SAT else '_sbtest.html')); await pg.wait_for_timeout(3500)
            for name, js, root, _ in todo:
                errs.clear()
                try:
                    await pg.reload(); await pg.wait_for_timeout(2600)
                    light = await pg.evaluate("()=>document.documentElement.classList.contains('theme-light')")
                    await pg.evaluate("()=>{ try{ %s }catch(e){ window.__openErr=String(e); } }" % js); await pg.wait_for_timeout(1700)
                    oe = await pg.evaluate("()=>window.__openErr||null")
                    await pg.screenshot(path=f'{out}/{name}.jpg', quality=45, type='jpeg')
                    await pg.evaluate(SCAN); r = await pg.evaluate("(s)=>scanLight(s)", root)
                    r['light'] = light; r['openErr'] = oe; r['pageErrors'] = errs[:3]; results[name] = r
                    print(f"{name:20s} light={light} issues={len(r['issues']):3d} dark={len(r['dark']):2d} root={r['root'][:60]} {('ERR '+oe) if oe else ''}", flush=True)
                except Exception as e:
                    results[name] = {'error': str(e)[:200]}; print(name, 'FAILED', str(e)[:150], flush=True)
            await ctx.close()
        await b.close()
    old = json.load(open(f'{out}/results.json')) if flt and os.path.exists(f'{out}/results.json') else {}
    old.update(results); json.dump(old, open(f'{out}/results.json', 'w'), indent=1)
if __name__ == '__main__': asyncio.run(main())
