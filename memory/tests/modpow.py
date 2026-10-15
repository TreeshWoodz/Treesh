import asyncio, json, sys, time
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv)>1 and sys.argv[1]=='m'
U=lambda i,e:{"id":i,"email":e,"password":"secret123","confirmed":True}
now=int(time.time()*1000)
iso=lambda ms:time.strftime('%Y-%m-%dT%H:%M:%S.000Z',time.gmtime(ms/1000))
PD={"nickname":"Alice A","zodiac":"Capricorn","bday":"01-05","talents":["singer","producer"],"favs":{"movies":["a"]},"favorites":[{"id":"x","t":"Song","a":"A","c":""}],"playlists":[{"id":"pl_x","name":"Late Night","songs":[]},{"id":"pl_y","name":"Gym","songs":[]}],"lyrics":[{"id":"s1","t":"Cherry","a":"Marq C","c":"","lines":["I got a point to prove"]}],"custom":{"deep":{"T:a":{"c":"#fff"}}},"space":{"bg":{"img":""}},"accent":"#ff0000","badges":["b1"],"stats":{"plays":3}}
def db(extra_mod=None):
    d={"users":{"a@test.com":U("ua1","a@test.com"),"s@test.com":U("us1","s@test.com"),"i@test.com":U("ic1","i@test.com")},
       "profiles":{"ua1":{"id":"ua1","username":"alice","display_name":"Alice A","created_at":iso(now-2*864e5),"public_data":PD},"us1":{"id":"us1","username":"staffy","display_name":"Staff S","created_at":iso(now-90*864e5)},"ic1":{"id":"ic1","username":"chelly","display_name":"Chelly","created_at":iso(now-9*864e5)}},
       "files":{},"mod":{"us1":{"role":"admin"},"ic1":{"verified":True,"verified_icon":"11"}}}
    if extra_mod: d["mod"].update(extra_mod)
    return d
def init(dbv, uid, email, prof, extra=''):
    sess={"access_token":"tok_"+uid,"refresh_token":"ref_"+uid,"user":{"id":uid,"email":email}}
    return "if(!localStorage.getItem('__mock_seeded')){ localStorage.setItem('__mock_seeded','1'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_push',JSON.stringify({asked:true})); localStorage.setItem('treesh_profile',JSON.stringify(%s)); localStorage.setItem('__mock_sb_db',JSON.stringify(%s)); localStorage.setItem('__mock_sb_session',JSON.stringify(%s)); %s }" % (json.dumps(prof), json.dumps(dbv), json.dumps(sess), extra)
ok=0; bad=0
def chk(n,c,x=''):
    global ok,bad
    if c: ok+=1; print('PASS',n,x)
    else: bad+=1; print('FAIL',n,x)
async def newpage(b,p,script):
    ctx = await (b.new_context(**p.devices['iPhone 13']) if MOBILE else b.new_context(viewport={'width':1400,'height':850}))
    await ctx.add_init_script(script); pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
    await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(5000); return ctx, pg
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        # ---- admin
        ctx, pg = await newpage(b,p,init(db(),'us1','s@test.com',{"nickname":"Staff S","username":"staffy","usernameSynced":"staffy","birthday":"1990-01-01"}))
        chk('admin role', await pg.evaluate("()=>stRole()")=='admin')
        await pg.evaluate("()=>sxOpenProfile('alice')"); await pg.wait_for_timeout(2000)
        chk('edit button on a person\u2019s profile', await pg.locator('[data-testid=user-profile-edit]').count()==1)
        await pg.locator('[data-testid=user-profile-edit]').click(); await pg.wait_for_timeout(900)
        chk('edit opens the profile panel', await pg.locator('#modal2 [data-testid=mod-panel-profile]').count()==1 and await pg.locator('[data-testid=mod-birthday-section]').count()==1)
        await pg.fill('[data-testid=mod-birthday-input]','1999-07-04'); await pg.locator('[data-testid=mod-birthday-save]').click(); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("()=>{ const d=JSON.parse(localStorage.getItem('__mock_sb_db')); return [d.profiles.ua1.public_data.zodiac, d.profiles.ua1.public_data.bday, (d.mod.ua1||{}).mod_edits]; }")
        chk('birthday changed publicly + sent to their device', r[0]=='Cancer' and r[1]=='07-04' and r[2] and r[2].get('birthday')=='1999-07-04', r)
        await pg.screenshot(path=f'/tmp/modpow_{"m" if MOBILE else "d"}_profile.png')
        await pg.locator('[data-testid=mod-quick-action-content]').click(); await pg.wait_for_timeout(600)
        chk('content tab lists everything', await pg.locator('[data-testid=mod-content-list] .mqc-row').count()>=10)
        await pg.screenshot(path=f'/tmp/modpow_{"m" if MOBILE else "d"}_content.png')
        await pg.locator('[data-testid=mod-c-pl-del-0]').click(); await pg.wait_for_timeout(300)
        await pg.locator('[data-testid=moderation-confirm-ok]').click(); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("()=>{ const d=JSON.parse(localStorage.getItem('__mock_sb_db')); return [d.profiles.ua1.public_data.playlists.map(x=>x.id), d.mod.ua1.mod_edits.pl_remove]; }")
        chk('delete one playlist', r[0]==['pl_y'] and r[1]==['pl_x'], r)
        chk('list repaints with one playlist', await pg.locator('[data-testid^=mod-c-pl-del-]').count()==1)
        await pg.locator('[data-testid=mod-c-hide-favorites]').click(); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("()=>{ const d=JSON.parse(localStorage.getItem('__mock_sb_db')); return [(d.profiles.ua1.privacy||{}).favorites, d.mod.ua1.mod_edits.hide]; }")
        chk('hide liked songs section', r[0]=='me' and r[1]==['favorites'], r)
        await pg.locator('[data-testid=mod-c-rm-talents]').click(); await pg.wait_for_timeout(300); await pg.locator('[data-testid=moderation-confirm-ok]').click(); await pg.wait_for_timeout(1500)
        await pg.locator('[data-testid=mod-c-rm-birthday]').click(); await pg.wait_for_timeout(300); await pg.locator('[data-testid=moderation-confirm-ok]').click(); await pg.wait_for_timeout(1500)
        await pg.locator('[data-testid=mod-c-ly-del-0]').click(); await pg.wait_for_timeout(300); await pg.locator('[data-testid=moderation-confirm-ok]').click(); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("()=>{ const d=JSON.parse(localStorage.getItem('__mock_sb_db')); const pd=d.profiles.ua1.public_data; return ['talents' in pd, 'zodiac' in pd, 'bday' in pd, pd.lyrics.length, d.mod.ua1.mod_edits]; }")
        chk('delete talents, birthday, saved lyrics', r[0] is False and r[1] is False and r[2] is False and r[3]==0 and r[4].get('remove_talents') and r[4].get('birthday') is None and r[4].get('ly_remove')==['s1'], r)
        await pg.evaluate("()=>{ closeModal2(); sxClose(); }"); await pg.wait_for_timeout(500)
        # admin: edit buttons on any Icon page and song
        await pg.evaluate("()=>navigate('artist','3')"); await pg.wait_for_timeout(900)
        chk('admin sees Edit on any Icon page', await pg.locator('[data-testid=artist-edit-mad]').count()==1)
        sid = await pg.evaluate("()=>SONGS.find(s=>(s.artistIds||[]).length)&&SONGS.find(s=>(s.artistIds||[]).length).id")
        await pg.evaluate("(id)=>sgpOpen(id)", sid); await pg.wait_for_timeout(900)
        chk('admin sees Edit on any song page', await pg.locator('[data-testid=song-page-edit]').count()==1)
        chk('Play the vibe button', await pg.locator('[data-testid=song-page-play-vibe]').count()==1)
        await pg.locator('[data-testid=song-page-play-vibe]').click(); await pg.wait_for_timeout(600)
        r = await pg.evaluate("(id)=>{ const q=(state.queue||[]).map(x=>x.id||x); const c=curSong(); return [c&&c.id, q.length, sgpSimilar(SONG_BY_ID[id]).length]; }", sid)
        chk('Play the vibe starts with this song and queues the vibe', r[0]==sid and r[1]>=min(2,r[2]+1), r)
        await pg.locator('[data-testid=song-page-more]').click(); await pg.wait_for_timeout(500)
        chk('song menu has Edit in M.A.D. and View song page', await pg.locator('[data-testid=song-menu-edit-mad]').count()==1)
        await pg.locator('[data-testid=song-menu-edit-mad]').click(); await pg.wait_for_timeout(1200)
        r = await pg.evaluate("()=>{ const f=document.getElementById('gf-frame'), h=document.querySelector('#game-frame .gf-head'); return [state.gameFrame&&state.gameFrame.key, f&&f.getAttribute('src'), h&&getComputedStyle(h).paddingTop, document.querySelector('#game-frame .gf-shell').getBoundingClientRect().bottom, innerHeight]; }")
        chk('M.A.D. opens in the window', r[0]=='mad' and 'tools/mad' in (r[1] or ''), r)
        chk('window head clears status bar + fills screen', r[2]=='10px' and abs(r[3]-r[4])<1, r)
        await pg.screenshot(path=f'/tmp/modpow_{"m" if MOBILE else "d"}_mad.png')
        await ctx.close()
        # ---- icon account
        ctx, pg = await newpage(b,p,init(db(),'ic1','i@test.com',{"nickname":"Chelly","username":"chelly","usernameSynced":"chelly","birthday":"1995-02-02"}))
        await pg.evaluate("()=>stLoad(true)"); await pg.wait_for_timeout(800)
        chk('icon is verified with icon 11', await pg.evaluate("()=>madIconId()")=='11')
        await pg.evaluate("()=>{ state.settingsTab='account'; navigate('settings'); }"); await pg.wait_for_timeout(1200)
        chk('settings shows the icon M.A.D. card', await pg.locator('[data-testid=icon-open-mad]').count()==1)
        await pg.screenshot(path=f'/tmp/modpow_{"m" if MOBILE else "d"}_iconcard.png')
        await pg.evaluate("()=>navigate('artist','11')"); await pg.wait_for_timeout(900)
        chk('icon sees Edit on own page', await pg.locator('[data-testid=artist-edit-mad]').count()==1)
        await pg.evaluate("()=>navigate('artist','3')"); await pg.wait_for_timeout(900)
        chk('icon has no Edit on someone else\u2019s page', await pg.locator('[data-testid=artist-edit-mad]').count()==0)
        r = await pg.evaluate("()=>{ const mine=SONGS.find(s=>(s.artistIds||[]).includes('11')), other=SONGS.find(s=>(s.artistIds||[]).length&&!(s.artistIds||[]).includes('11')); return [mine&&mine.id, other&&other.id]; }")
        await pg.evaluate("(id)=>sgpOpen(id)", r[0]); await pg.wait_for_timeout(900)
        chk('icon sees Edit on own song', await pg.locator('[data-testid=song-page-edit]').count()==1)
        await pg.evaluate("(id)=>sgpOpen(id)", r[1]); await pg.wait_for_timeout(900)
        chk('icon has no Edit on other songs', await pg.locator('[data-testid=song-page-edit]').count()==0)
        await ctx.close()
        # ---- their device applies the edits
        E={"birthday":"1999-07-04","pl_remove":["pl_x"],"ly_remove":["s1"],"hide":["favorites"],"remove_talents":True,"remove_space":True}
        extra="localStorage.setItem('treesh_playlists',JSON.stringify([{id:'pl_x',name:'Late Night',songIds:[]},{id:'pl_y',name:'Gym',songIds:[]}])); localStorage.setItem('treesh_fav_lyrics',JSON.stringify([{songId:'s1',idx:0},{songId:'s2',idx:1}]));"
        ctx, pg = await newpage(b,p,init(db({"ua1":{"mod_rev":1,"mod_edits":E}}),'ua1','a@test.com',{"nickname":"Alice A","username":"alice","usernameSynced":"alice","birthday":"2000-01-05","talents":["singer"],"space":{"theme":"x"}},extra))
        await pg.evaluate("()=>stLoad(true)"); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("()=>[state.profile.birthday, (state.playlists||[]).map(x=>x.id), (state.favLyrics||[]).map(x=>x.songId), (LS.get('treesh_social',{}).sections||{}).favorites, state.profile.talents, state.profile.space, localStorage.getItem('sbx_mod_rev')]")
        chk('their device applies all edits', r[0]=='1999-07-04' and r[1]==['pl_y'] and r[2]==['s2'] and r[3]=='me' and r[4] is None and r[5] is None and r[6]=='1', r)
        await ctx.close(); await b.close()
    print('RESULT',ok,'pass',bad,'fail')
asyncio.run(main())
