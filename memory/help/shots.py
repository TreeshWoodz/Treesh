"""Capture real Treesh screenshots for the Help Center (support.html).
Run: python3 /app/memory/help/shots.py [name ...]   (writes /app/single_html/content/help/{d,m}/<name>.webp)"""
import asyncio, io, sys, os
from playwright.async_api import async_playwright
from PIL import Image

BASE = 'http://localhost:3000/'
OUT = '/app/single_html/content/help'
IDS = ["black-barbie-bankrupt-freestyle","perfektenz-rippin-and-runnin","unique-carter-pink-sides","chelly-banqz-shake-it-some-mo","savionce-never-rock-version","chelly-banqz-prettywise","london-llaflare-heart-of-the-hood","unique-carter-pink-feds","unique-carter-it-s-unique-hoe","unique-carter-traphouse","chelly-banqz-12-56-1-02","chelly-banqz-monster","chelly-banqz-coffin-freestyle","palo-big-facts"]

SEED = r"""(()=>{ const ids=%s; const L=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const day=o=>{ const x=new Date(); x.setDate(x.getDate()-o); return x; }, pad=o=>{ const x=day(o); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); }, raw=o=>{ const x=day(o); return x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate(); };
  if(location.search.indexOf('noprof')>=0){ const keep=localStorage.getItem('__seeded'); localStorage.clear(); L('treesh_whatsnew_off',true); return; }
  L('treesh_whatsnew_off',true);
  L('treesh_profile',{nickname:'Tester',username:'tester',bio:'Beat maker, late-night lyric writer and Treesh Arcade regular.',birthday:'2000-03-14',joined:Date.now()-86400e3*120,
    talents:{main:'producer',more:['songwriter','dj']},favs:{music:['Neo-soul','Trap','Afrobeats'],games:['Vocotap','Chainz']},
    space:{theme:'synth',bg:{type:'gradient',g1:'#3b0764',g2:'#f97316',angle:170,dim:30},card:{style:'glass',tint:'#1a0b2e',op:52,blur:18,radius:24},font:{h:'Syne',b:'Manrope'},col:{text:'#fff1f2',head:'#ffffff',link:'#ffb38a',accent:'#ff5500'},
      song:{id:ids[1],auto:false},mood:{k:'creative',t:'Cooking up a new beat'},about:'Producer from the Woodz. I make beats in Instrum Studio and write hooks in Lyric Studio.',meet:'Singers, rappers and anyone who wants to collab.',layout:'left'}});
  L('treesh_favorites',ids.slice(0,8)); L('treesh_dislikes',[ids[13]]);
  L('treesh_playlists',[{id:'pl_demo',name:'Late Night Drive',songIds:ids.slice(2,12),created:Date.now()-86400e3*9},{id:'pl_gym',name:'Gym Mode',songIds:ids.slice(0,6),created:Date.now()-86400e3*3}]);
  const pc={}; ids.forEach((id,i)=>pc[id]=Math.max(1,30-i*2)); L('treesh_plays',pc);
  L('treesh_stars',{points:1250,lastDaily:raw(0),streak:4,newSongs:{a:1,b:1,c:1,d:1,e:1,f:1,g:1,h:1,i:1},minToday:12,totalMin:184,games:6,beats:3,log:[]});
  L('treesh_game_stats',{games:9,totalScore:5400,bestScore:980,rounds:60,correct:47,bestStreak:12,perfects:5,lastPlayed:Date.now()-3600e3,bestSong:ids[3],recent:[]});
  L('frea_stats_v1',{matchesPlayed:14,roundsWon:22,playMs:11520000}); localStorage.setItem('frea_starlites','320');
  L('chainz_save_v2',{stats:{bestScore:4200,bestChain:31,perfectRuns:3,starlitesEarned:340}});
  L('treesh_hoop_stats',{sessions:18,minutes:540,drillsDone:{a:6,b:9,c:4},games:11,shots:64,bestShot:91,activeDays:[pad(0),pad(1),pad(2),pad(3),pad(6),pad(8),pad(11),pad(13),pad(16),pad(20),pad(23)]});
  L('treesh_hoop_game_log',[{gameId:'horse',winner:'Tester',players:['Tester','Sam'],at:new Date(Date.now()-3600e3*3).toISOString()},{gameId:'around-the-world',winner:'Tester',at:new Date(Date.now()-86400e3).toISOString()},{gameId:'twenty-one',winner:'Jordan',at:new Date(Date.now()-86400e3*3).toISOString()}]);
  L('treesh_hoop_favorites',[{id:1},{id:2},{id:3}]);
  L('vocotap_scores',[{songId:'a',score:120345,accuracy:96.42,maxCombo:233,stars:4,miss:2,totalNotes:300},{songId:'b',score:90000,accuracy:88,maxCombo:120,stars:3,miss:10,totalNotes:200},{songId:'c',score:64000,accuracy:91,maxCombo:98,stars:3,miss:6,totalNotes:180}]);
  L('vocotap_progress',{xp:2600}); L('vocotap_daily_history',[raw(0),raw(1),raw(2),raw(3),raw(4)]);
})();""" % (str(IDS).replace("'", '"'))

PREP = r"""()=>{ window.__act=(act,ds)=>{ const b=document.createElement('button'); b.dataset.act=act; Object.assign(b.dataset,ds||{}); b.style.display='none'; document.body.appendChild(b); b.click(); b.remove(); };
  window.__song=()=>SONGS.find(x=>!x._user&&!x.explicit&&x.audioUrl&&Array.isArray(x.lyrics)&&x.lyrics.filter(l=>typeof l.t==='number').length>12)||SONGS.find(x=>!x._user&&x.audioUrl);
  window.__np=async(sec)=>{ const s=__song(); playSong(s,[s]); state.npOpen=true; renderNP(); await new Promise(r=>setTimeout(r,1500)); try{ audio.currentTime=sec||38; }catch(e){} try{ audio.play().catch(()=>{}); }catch(e){} };
  window.__into=(sel,blk)=>{ const e=document.querySelector(sel); if(e) e.scrollIntoView({block:blk||'start'}); };
  try{ if(state.profile&&typeof OB_AVATARS!=='undefined'&&OB_AVATARS.length){ state.profile.avatar=OB_AVATARS[Math.min(4,OB_AVATARS.length-1)]; LS.set('treesh_profile',state.profile); renderShell(); } }catch(e){}
  document.querySelectorAll('#toast,.toast-wrap').forEach(t=>t.style.display='none'); }"""

# name: (setup js (async arrow body), wait ms, query)
SHOTS = {
 'welcome':      ("", 2500, '?noprof=1'),
 'nav':          ("navigate('library');", 1500, ''),
 'search':       ("openSearch(); await new Promise(r=>setTimeout(r,500)); const i=document.getElementById('search-input'); if(i){ i.value='pink'; i.dispatchEvent(new Event('input',{bubbles:true})); }", 1800, ''),
 'voice':        ("voiceOpen(); await new Promise(r=>setTimeout(r,800)); __act('voice-help-toggle');", 1600, ''),
 'whatsnew':     ("wnOpen('library');", 1200, ''),
 'library':      ("navigate('library'); await new Promise(r=>setTimeout(r,800)); window.scrollTo(0,640);", 1500, ''),
 'favorites':    ("openProfile('favorites'); await new Promise(r=>setTimeout(r,600)); __into('#profile-tabs','start');", 1200, ''),
 'playlist':     ("__act('pl-open',{id:'pl_demo'});", 1800, ''),
 'upload':       ("openMusicManager();", 1500, ''),
 'icons':        ("navigate('artists');", 2000, ''),
 'np-lyrics':    ("await __np(38);", 2500, ''),
 'np-karaoke':   ("await __np(52); __act('toggle-karaoke');", 2500, ''),
 'np-eq':        ("await __np(30); openEqualizer();", 1500, ''),
 'np-vinyl':     ("__act('toggle-vinyl'); await __np(20);", 2500, ''),
 'lyric-studio': ("openLyricSync(__song().id); await new Promise(r=>setTimeout(r,1800)); lsSetMode('write');", 1800, ''),
 'lyric-card':   ("openLyricStudio(__song().id);", 2500, ''),
 'lyric-find':   ("openFindLyrics(__song().id);", 3500, ''),
 'lyric-sync':   ("openLyricSync(__song().id); await new Promise(r=>setTimeout(r,1800)); lsSetMode('sync');", 1800, ''),
 'instrum':      ("navigate('instrum'); await new Promise(r=>setTimeout(r,600)); instrumStart();", 2200, ''),
 'image-studio': ("openCoverStudio(__song().coverArt, __song().title, false);", 2600, ''),
 'backdrops':    ("openBackdrops();", 2000, ''),
 'markup':       ("navigate('library'); await new Promise(r=>setTimeout(r,500)); mkStart();", 2000, ''),
 'whatsnext':    ("navigate('game'); await new Promise(r=>setTimeout(r,600)); startGame(__song().id);", 3000, ''),
 'tot':          ("navigate('game'); await new Promise(r=>setTimeout(r,600)); startTot();", 2500, ''),
 'arcade':       ("navigate('game'); await new Promise(r=>setTimeout(r,800)); __into('[data-testid=games-arcade]','center');", 1500, ''),
 'soon':         ("navigate('game'); await new Promise(r=>setTimeout(r,800)); openGameInfo('bronze-blitz');", 1300, ''),
 'starlites':    ("openProfile('stats'); await new Promise(r=>setTimeout(r,800)); __into('[data-testid=stats-starlites]','start');", 1300, ''),
 'arcade-stats': ("openProfile('stats'); await new Promise(r=>setTimeout(r,800)); __into('[data-testid=stats-arcade-games]','start');", 1300, ''),
 'hoop':         ("openProfile('stats'); await new Promise(r=>setTimeout(r,800)); __into('[data-testid=stats-treesh-active]','start');", 1500, ''),
 'profile':      ("openProfile('favorites');", 2200, ''),
 'profile-edit': ("openProfile(); await new Promise(r=>setTimeout(r,500)); state.settingsEditProfile=true; renderProfile();", 1500, ''),
 'style':        ("openProfile(); await new Promise(r=>setTimeout(r,600)); spEdOpen('themes');", 1800, ''),
 'song-mood':    ("openProfile(); await new Promise(r=>setTimeout(r,600)); spEdOpen('song');", 1800, ''),
 'sections':     ("openProfile(); await new Promise(r=>setTimeout(r,600)); spEdOpen('sections');", 1800, ''),
 'talents':      ("openProfile(); await new Promise(r=>setTimeout(r,500)); tlPickOpen();", 1500, ''),
 'birthday':     ("bdOpen();", 2200, ''),
 'stars':        ("zhOpen();", 1800, ''),
 'people':       ("state.searchTab='users'; openSearch();", 1500, ''),
 'privacy':      ("sxPrivacyOpen();", 1200, ''),
 'signup':       ("sbAuthOpen('signup');", 1300, ''),
 'account':      ("navigate('settings'); await new Promise(r=>setTimeout(r,500)); __act('set-settings-tab',{val:'account'});", 1500, ''),
 'appearance':   ("navigate('settings'); await new Promise(r=>setTimeout(r,500)); __act('set-settings-tab',{val:'appearance'});", 1500, ''),
 'a11y':         ("navigate('settings'); await new Promise(r=>setTimeout(r,500)); __act('a11y-quick-open');", 1500, ''),
 'transfer':     ("navigate('settings'); await new Promise(r=>setTimeout(r,500)); __act('set-settings-tab',{val:'account'}); await new Promise(r=>setTimeout(r,700)); __into('[data-testid=export-all-data]','center');", 1300, ''),
}
DEV = {'d': dict(viewport={'width':1440,'height':900}, device_scale_factor=1),
       'm': dict(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)}
MAXW = {'d':1280, 'm':560}

async def one(browser, dev, name, spec):
    js, wait, q = spec
    ctx = await browser.new_context(**DEV[dev], color_scheme='dark')
    await ctx.add_init_script(SEED)
    pg = await ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    try:
        await pg.goto(BASE + q, wait_until='domcontentloaded')
        await pg.wait_for_function("typeof navigate==='function' && typeof SONGS!=='undefined' && SONGS.length>0", timeout=20000)
        await pg.wait_for_timeout(1800)
        await pg.evaluate(PREP)
        if js:
            await pg.evaluate("async()=>{ " + js + " }")
        await pg.wait_for_timeout(wait)
        await pg.evaluate("()=>document.querySelectorAll('[data-testid=toast],#toasts,.toast,.tst').forEach(t=>t.style.visibility='hidden')")
        png = await pg.screenshot(type='png')
        im = Image.open(io.BytesIO(png)).convert('RGB')
        if im.width > MAXW[dev]:
            im = im.resize((MAXW[dev], round(im.height * MAXW[dev] / im.width)), Image.LANCZOS)
        os.makedirs(f'{OUT}/{dev}', exist_ok=True)
        im.save(f'{OUT}/{dev}/{name}.webp', 'WEBP', quality=62, method=6)
        print('ok', dev, name, im.size, ('ERR ' + ' | '.join(errs[:2])) if errs else '', flush=True)
    except Exception as e:
        print('fail', dev, name, str(e)[:200], flush=True)
    finally:
        await ctx.close()

async def main():
    names = [n for n in sys.argv[1:] if not n.startswith('-')] or list(SHOTS)
    devs = ['m'] if '-m' in sys.argv else ['d'] if '-d' in sys.argv else ['d', 'm']
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/lib/chromium/chromium', args=['--autoplay-policy=no-user-gesture-required', '--mute-audio'])
        for n in names:
            for d in devs:
                await one(b, d, n, SHOTS[n])
        await b.close()

if __name__=="__main__": asyncio.run(main())
