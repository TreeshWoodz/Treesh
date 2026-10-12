import asyncio, sys, json, os
from playwright.async_api import async_playwright
# Horizontal overflow probe: python3 hscroll.py m|d [theme] [only]  -> which containers scroll sideways and which elements stick out
sys.path.insert(0, '/app/memory/tests')
from light_audit import DB, EXE  # noqa

LONG = "Superlongunbrokenwordthatkeepsgoingandgoingwithoutanyspaces_" * 2
SPACE = {"about": "Hi! I make music and love late night sessions. Find me at https://example.com/a/really/long/link/that/does/not/break/anywhere/at/all " + LONG,
         "meet": "Producers, singers and anyone who " + LONG, "blocks": [{"id": "b1", "t": "Favorite things " + LONG, "x": "Coffee, beats, " + LONG}],
         "top8": [{"u": "alice", "n": "Alice A with a very long display name"}, {"u": "staffy", "n": "Staff S"}, {"u": "chellyoance", "n": "Verse Queen"}, {"u": "bobby_b", "n": "Bob"}, {"u": "carla_c", "n": "Carla"}],
         "mood": {"k": "happy", "t": "Feeling amazing today " + LONG[:30]}, "layout": "left"}
DB2 = json.loads(json.dumps(DB))
DB2["profiles"]["ub1"].update({"bio": "Bio with a link https://example.com/" + LONG, "public_data": {"nickname": "Verse Queen", "talents": ["Singer", "Rapper", "Producer", "Songwriter", "Dancer", "Engineer"], "space": SPACE,
    "listening": {"top": [], "plays": 1234}, "badges": [], "favorites": [], "lyrics": [], "playlists": []}, "privacy": {}})
OWN = {"nickname": "Tester " + LONG[:40], "birthday": "2000-01-01", "bio": "My bio " + LONG, "talents": ["Singer", "Rapper", "Producer", "Songwriter", "Dancer"], "space": SPACE}

PROBE = """()=>{ const out={}; const W=document.documentElement.clientWidth;
  const conts=[['doc',document.scrollingElement],['pf',document.getElementById('profile-scroll')],['sx',document.getElementById('sx-scroll')],['view',document.getElementById('view')]];
  for(const [k,c] of conts){ if(!c) continue; const cs=getComputedStyle(c); const ov=c.scrollWidth-c.clientWidth;
    const cr=k==='doc'?{left:0,right:W}:c.getBoundingClientRect(); const bad=[];
    c.querySelectorAll('*').forEach(e=>{ const r=e.getBoundingClientRect(); if(r.width<1||r.height<1) return; if(!(r.right>cr.right+1.5||r.left<cr.left-1.5)) return;
      if(e.closest('svg')&&e.tagName.toLowerCase()!=='svg') return;
      let p=e.parentElement, inside=false; while(p&&p!==c&&p!==document.body){ const s=getComputedStyle(p); if(/(auto|scroll|hidden|clip)/.test(s.overflowX)){ inside=true; break; } if(s.position==='fixed'){ inside=true; break; } p=p.parentElement; }
      if(inside||getComputedStyle(e).position==='fixed') return;
      bad.push((e.getAttribute('data-testid')||'')+' <'+e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+'.'+[...e.classList].slice(0,4).join('.')+'> '+Math.round(r.left)+'..'+Math.round(r.right)+' (box '+Math.round(cr.left)+'..'+Math.round(cr.right)+')'); });
    if(ov>1||bad.length) out[k]={ov, ox:cs.overflowX, bad:bad.slice(0,12), n:bad.length}; }
  return out; }"""

async def main():
    vp = sys.argv[1]; theme = sys.argv[2] if len(sys.argv) > 2 else 'dark'; only = sys.argv[3] if len(sys.argv) > 3 else ''
    os.makedirs('/tmp/hscroll', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**(dict(p.devices['iPhone 13']) if vp == 'm' else {'viewport': {'width': 1400, 'height': 860}}))
        sess = {"access_token": "tok_ua1", "refresh_token": "r", "user": {"id": "ua1", "email": "x@test.com"}}
        seed = "localStorage.setItem('treesh_theme','\"%s\"'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_push',JSON.stringify({asked:true})); localStorage.setItem('treesh_profile',%s); localStorage.setItem('__mock_sb_db',%s); localStorage.setItem('__mock_sb_session',%s);" % (theme, json.dumps(json.dumps(OWN)), json.dumps(json.dumps(DB2)), json.dumps(json.dumps(sess)))
        await ctx.add_init_script("if(!sessionStorage.getItem('__seeded')){ sessionStorage.setItem('__seeded','1'); localStorage.clear(); %s }" % seed)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(3000)
        await pg.reload(); await pg.wait_for_timeout(2500)
        T = lambda t: "document.querySelector('[data-testid=\"%s\"]')?.click()" % t
        steps = [('own', "openProfile()"), ('own_max', T('profile-fullscreen-toggle')), ('own_stats', T('profile-page-stats')), ('own_act', T('profile-page-activity')),
                 ('own_close', "closeProfile(true)"), ('them', "sxOpenProfile('chellyoance')"), ('them_max', T('uprof-fullscreen-toggle')), ('them_stats', T('uprof-page-stats')),
                 ('them_act', T('uprof-page-activity')), ('them_close', "sxClose()"),
                 ('home', "navigate('library')"), ('icons', "navigate('artists')"), ('studios', "navigate('studios')"), ('game', "navigate('game')"), ('artist', "navigate('artist', ARTISTS[0].id)"),
                 ('set-app', "state.settingsTab='appearance'; navigate('settings')"), ('set-audio', "state.settingsTab='audio'; navigate('settings')"), ('set-voice', "state.settingsTab='voice'; navigate('settings')"),
                 ('set-account', "state.settingsTab='account'; navigate('settings')"), ('set-system', "state.settingsTab='system'; navigate('settings')"), ('set-lyrics', "state.settingsTab='lyrics'; navigate('settings')")]
        for name, js in steps:
            if only and only not in name: continue
            await pg.evaluate("()=>{ %s }" % js); await pg.wait_for_timeout(1400)
            r = await pg.evaluate(PROBE)
            print(name, json.dumps(r, indent=None) if r else 'ok')
            if r and not name.endswith('close'): await pg.screenshot(path=f'/tmp/hscroll/{vp}_{name}.jpg', quality=40)
        print('errors', errs[:5])
        await b.close()
asyncio.run(main())
