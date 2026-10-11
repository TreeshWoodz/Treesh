import asyncio, json, sys
from playwright.async_api import async_playwright
# Collects every class (and id) used inside each dark-by-design panel, in dark mode, across its states -> /app/memory/light_classes.json
EXE = "/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
DB = {"users": {"a@test.com": {"id": "ua1", "email": "a@test.com", "password": "secret123", "confirmed": True}, "b@test.com": {"id": "ub1", "email": "b@test.com", "password": "secret123", "confirmed": True}, "s@test.com": {"id": "us1", "email": "s@test.com", "password": "secret123", "confirmed": True}},
      "profiles": {"ua1": {"id": "ua1", "username": "alice", "display_name": "Alice A"}, "ub1": {"id": "ub1", "username": "chellyoance", "display_name": "Verse Queen", "verified": True}, "us1": {"id": "us1", "username": "staffy", "display_name": "Staff S"}},
      "files": {}, "mod": {"us1": {"role": "admin"}}}
A = "SONGS[0]"
CLICK = "(t)=>{ const b=document.querySelector('[data-testid=\"'+t+'\"]'); if(b) b.click(); }"
G = {  # group: (root selector, [open js...], [testids to click after opening, each a separate state])
 'um': ('#um-root', ["openMusicManager()", f"umEditOpen({A}.id)", f"state._teTab='details'; umEditOpen({A}.id)", f"state._teTab='lyrics'; umEditOpen({A}.id)", f"state._teTab='timing'; umEditOpen({A}.id)", "openAddMusic()"]),
 'sx': ('#sx-root', ["sxOpenProfile('chellyoance')", "pvOpen()", "sxOpenProfile('alice')"]),
 'adm': ('#adm-root', ["admOpen()", "admOpen(); setTimeout(()=>{ const b=document.querySelector('[data-testid=\"admin-nav-announce\"]'); b&&b.click(); },700)", "admOpen(); setTimeout(()=>{ const b=document.querySelector('[data-testid=\"admin-nav-icons\"]'); b&&b.click(); },700)", "admOpen(); setTimeout(()=>{ const b=[...document.querySelectorAll('#adm-rail button')][2]; b&&b.click(); },700)", "admOpen(); setTimeout(()=>{ const b=[...document.querySelectorAll('#adm-rail button')][3]; b&&b.click(); },700)", "admOpen(); setTimeout(()=>{ const b=[...document.querySelectorAll('#adm-rail button')][5]; b&&b.click(); },700)"]),
 'zh': ('#zh-root', ["zhOpen()"]),
 'nps': ('#nps-root', ["npsOpen()", "lytOpen()"]),
 'np': ('#np', [f"LS.set('treesh_np_style','{st}'); playSong({A},SONGS); state.npOpen=true; state.showLyrics={ly}; renderNP()" for st in ['default','vinyl','full','glass','minimal'] for ly in ['false','true']] + [f"playSong({A},SONGS); state.npOpen=true; state.showLyrics=true; state.karaoke=true; renderNP()", f"playSong({A},SONGS); state.queueOpen=true; renderQueue()"]),
 'modal': ('#modal', ["openImageStudioFree()", "openEqualizer()", f"openLyricStudio({A}.id)", "instrumOpenModal()"]),
 'bd': ('#bd-ov', ["bdOpen()"]),
 'pf': ('#profile-panel', ["openProfile()"]),
 'vx': ('#voice-ov', ["voiceOpen()", "voiceOpen(); setTimeout(()=>{ const b=document.querySelector('[data-testid=\"voice-tips-toggle\"]'); b&&b.click(); },900)", "voiceOpen(); setTimeout(()=>{ const b=document.querySelector('[data-testid=\"voice-keyboard-toggle\"]')||document.querySelector('.vx3-chips button'); b&&b.click(); },900)"]),
}
async def main():
    only = sys.argv[1:] or list(G); out = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        for mode in ['m', 'd']:
            opts = dict(p.devices['iPhone 13']) if mode == 'm' else {'viewport': {'width': 1400, 'height': 860}}
            ctx = await b.new_context(**opts)
            seed = "localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_push',JSON.stringify({asked:true})); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s); localStorage.setItem('__mock_sb_session',%s);" % (json.dumps(json.dumps(DB)), json.dumps(json.dumps({"access_token": "tok_us1", "refresh_token": "r", "user": {"id": "us1", "email": "s@test.com"}})))
            await ctx.add_init_script("if(!sessionStorage.getItem('__seeded')){ sessionStorage.setItem('__seeded','1'); localStorage.clear(); %s }" % seed)
            pg = await ctx.new_page(); await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(3500)
            for g, (root, opens) in [(k, v) for k, v in G.items() if k in only]:
                for js in opens:
                    await pg.reload(); await pg.wait_for_timeout(2400)
                    await pg.evaluate("()=>{ try{ %s }catch(e){ console.log(e); } }" % js); await pg.wait_for_timeout(1800)
                    cls = await pg.evaluate("(r)=>{ const el=document.querySelector(r); if(!el) return null; const s=new Set(); [el,...el.querySelectorAll('*')].forEach(e=>{ (e.classList?[...e.classList]:[]).forEach(c=>s.add('.'+c)); if(e.id) s.add('#'+e.id); }); return [...s]; }", root)
                    out.setdefault(g, {'root': root, 'cls': set()})
                    if cls: out[g]['cls'].update(cls)
                    print(mode, g, js[:50], len(cls or []), flush=True)
            await ctx.close()
        await b.close()
    old = json.load(open('/app/memory/light_classes.json')); old.update({k: {'root': v['root'], 'cls': sorted(v['cls'])} for k, v in out.items()})
    json.dump(old, open('/app/memory/light_classes.json', 'w'), indent=0)
asyncio.run(main())
