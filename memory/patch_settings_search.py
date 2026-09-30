import sys
P = "/app/single_html/index.html"
s = open(P, encoding="utf-8").read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        print("MISMATCH", n, "for:", old[:140]); sys.exit(1)
    s = s.replace(old, new)

# CSS flash for jumped-to settings card
rep("  @keyframes splashSpin{ to{ transform:rotate(360deg); } }",
    "  @keyframes splashSpin{ to{ transform:rotate(360deg); } }\n  @keyframes settingFlash{ 0%,55%{ box-shadow:0 0 0 2px var(--treesh-purple), 0 0 36px var(--treesh-purple-soft); } 100%{ box-shadow:0 0 0 0 transparent; } }\n  .setting-flash{ animation:settingFlash 2s ease-out; }")

# Extra settings entries + helpers
rep("function searchSettingsList(q){ q=(q||'').trim(); if(!q) return SETTINGS_INDEX.slice();",
'''function settingsRunAct(act, data){ const b=document.createElement("button"); b.dataset.act=act; Object.keys(data||{}).forEach(k=>{ b.dataset[k]=data[k]; }); b.style.display="none"; document.body.appendChild(b); try{ b.click(); }finally{ b.remove(); } }
function goSettingSection(tab, target){ state.settingsTab=tab; closeSearch(); setTimeout(()=>{ try{ if(state.view==='settings') renderView(); else navigate('settings'); }catch(e){}
  setTimeout(()=>{ let box=null; if(target.charAt(0)==='['){ box=document.querySelector('#view '+target); } else { const h=[...document.querySelectorAll('#view h2')].find(x=>x.textContent.trim().toLowerCase()===target.toLowerCase()); box=h&&(h.closest('.rounded-3xl')||h.closest('section')); }
    if(box){ box.scrollIntoView({behavior:'smooth',block:'start'}); box.classList.remove('setting-flash'); void box.offsetWidth; box.classList.add('setting-flash'); setTimeout(()=>box.classList.remove('setting-flash'),2100); } },320); },210); }
const _sGo=(id,label,desc,kw,ic,tab,target,extra)=>Object.assign({ id, label, desc, kw, ic, type:'action', go:()=>goSettingSection(tab,target) }, extra||{});
SETTINGS_INDEX.push(
  { id:'notif-nav', label:'Notifications in the bar', desc:'Pop alerts into the top bar instead of the screen', kw:'notifications alerts toast bar top navigation popup', ic:'bell', type:'toggle', get:()=>!!state.notifInNav, toggle:()=>settingsRunAct('toggle-notif-nav') },
  { id:'whatsnew', label:"What's New popups", desc:'Recap new features the first time you open a page', kw:'whats new popups tips features onboarding recap', ic:'party-popper', type:'toggle', get:()=>!state.whatsNewOff, toggle:()=>settingsRunAct('toggle-whatsnew') },
  { id:'bg-overlay', label:'Backdrop dim overlay', desc:'Darken backdrop images so text stays readable', kw:'backdrop wallpaper dim darken overlay background image readable', ic:'contrast', type:'toggle', get:()=>!!state.bgOverlay, toggle:()=>settingsRunAct('toggle-bg-overlay') },
  _sGo('go-accent','Accent color','Pick an accent or dial in your own','accent color colour tint highlight purple pink blue green theme','palette','display','Accent color'),
  _sGo('go-textsize','Text size','Small, medium or large text','text size font size bigger smaller large zoom scale','a-large-small','display','Display'),
  _sGo('go-background','Background','Choose the app background','background wallpaper theme mono space gradient','image','display','Display'),
  _sGo('go-font','Font','Typeface, Google fonts or upload your own','font typeface typography google custom upload letters','type','display','Font'),
  _sGo('go-surface','Surface colors','Colors for the nav, top bar and rows','surface colors nav bar top bar rows custom colour','paintbrush','display','Surface colors'),
  _sGo('go-fontcolor','Font color','Change the text color across the app','font color text colour ink','type','display','Font color'),
  _sGo('go-labels','Card labels','Label color, border and shadow on cards','card labels tags badge border shadow','tag','display','Card labels'),
  _sGo('go-verse','Verse performer','How performer names show on lyrics','verse performer singer lyrics names featured artist','mic-vocal','display','Verse performer'),
  _sGo('go-sleep-settings','Sleep timer settings','Default sleep timer length','sleep timer settings bedtime minutes default','moon-star','sleep','Sleep timer'),
  _sGo('go-a11y','Accessibility','Contrast, motion and more','accessibility a11y contrast motion vision','accessibility','access','Accessibility'),
  _sGo('go-reading','Reading','Readable font, bolder text & spacing','reading readable dyslexia bold spacing letters','book-open','access','Reading'),
  _sGo('go-colorvision','Color vision','Color-blind friendly palettes','color vision colorblind colour blind deuteranopia protanopia tritanopia','eye','access','Color vision'),
  _sGo('go-navigation','Navigation','Sidebar and bottom bar options','navigation sidebar nav bar menu tabs bottom','panel-left','access','Navigation'),
  _sGo('go-applock','App Lock','Protect Treesh with a PIN or password','app lock pin password passcode security privacy protect','lock','privacy','App Lock'),
  _sGo('go-pagelocks','Page Locks','Lock individual pages','page lock lock pages private hide security','lock-keyhole','privacy','Page Locks'),
  _sGo('go-parental','Parental Controls','Parent PIN and explicit content rules','parental controls parent pin kids child family explicit restrict','shield','account','Parental Controls'),
  _sGo('go-storage','Storage & data','See what\\u2019s saved and free up space','storage space data clear cache delete free up memory full','hard-drive','account','Storage & data'),
  _sGo('go-transfer','Transfer to another device','Export or import a full backup file','transfer backup export import move new phone device restore sync','arrow-left-right','account','[data-testid="transfer-data"]'),
  _sGo('go-lyricsbackup','Lyrics backup','Export or import your saved lyrics','lyrics backup export import saved synced','save','lyrics','Lyrics backup'),
  _sGo('go-groups','Artist groups','Create custom artist groups','artist groups duo band members custom','users','lyrics','Artist groups'),
  _sGo('go-about','About Treesh','Version, install & app info','about version info install home screen app update','info','about','About'),
  _sGo('go-erase','Erase all data','Reset Treesh on this device','erase reset delete all data factory wipe start over','trash-2','account','[data-testid="settings-danger"]'),
  { id:'go-profile', label:'Edit profile', desc:'Nickname, birthday & avatar', kw:'profile edit nickname name birthday avatar photo picture', ic:'user', type:'action', go:()=>{ state.settingsEditProfile=true; goSettingSection('account','Edit profile'); } }
);
SETTINGS_INDEX.forEach(it=>{ if(it.id==='voice-speak'||it.id==='go-voice') it.voice=true; });
function settingsQuickHtml(q){ const n=normStr(q||''); if(n.length<3) return ''; const hits=SETTINGS_INDEX.filter(it=>(!it.voice||VOICE_OK) && normStr(it.label+' '+(it.kw||'')).includes(n)).slice(0,2); if(!hits.length) return '';
  return `<div class="mb-3" data-testid="search-settings-quick"><div class="mb-1.5 flex items-center justify-between px-0.5"><p class="text-[11px] font-semibold uppercase tracking-widest text-white/40">Settings</p><button data-act="search-tab" data-tab="settings" data-testid="search-settings-see-all" class="text-[11px] font-semibold text-[color:var(--treesh-purple)] hover:underline">See all</button></div><div class="space-y-1.5">${hits.map(settingsResultRow).join("")}</div></div>`; }
function searchSettingsList(q){ q=(q||'').trim(); if(!q) return SETTINGS_INDEX.filter(it=>!it.voice||VOICE_OK);''')
rep("scored.sort((a,b)=>b.score-a.score); return scored.map(x=>x.it); }\nfunction settingsResultRow",
    "scored.sort((a,b)=>b.score-a.score); return scored.map(x=>x.it).filter(it=>!it.voice||VOICE_OK); }\nfunction settingsResultRow")

# Results rendering
rep('''  const q=(state.searchQuery||"").trim();
  if(!q){
    return `<div class="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 text-center text-white/45"><div class="grid h-16 w-16 place-items-center rounded-2xl bg-white/5"><i data-lucide="search" style="width:30px;height:30px"></i></div><p class="text-sm">Search songs, artists &amp; lyrics</p></div>`;
  }
  const tab=state.searchTab;''',
'''  const q=(state.searchQuery||"").trim();
  const tab=state.searchTab;
  if(tab==="settings"){
    const list=searchSettingsList(q); if(!list.length) return searchEmpty(q);
    return `<div class="space-y-2 pb-2" data-testid="search-settings-results">${q?'':`<p class="px-0.5 pb-1 text-[11px] font-semibold uppercase tracking-widest text-white/40">All settings</p>`}${list.map(settingsResultRow).join("")}</div>`;
  }
  if(!q){
    return `<div class="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 text-center text-white/45"><div class="grid h-16 w-16 place-items-center rounded-2xl bg-white/5"><i data-lucide="search" style="width:30px;height:30px"></i></div><p class="text-sm">Search songs, artists, lyrics &amp; settings</p></div>`;
  }''')
rep('''  if(!list.length) return searchEmpty(q);
  return `<div class="space-y-1 pb-2">${list.map(s=>{const fav=isFav(s.id);''',
'''  const sq=settingsQuickHtml(q);
  if(!list.length) return sq || searchEmpty(q);
  return sq+`<div class="space-y-1 pb-2">${list.map(s=>{const fav=isFav(s.id);''')

# Tabs
rep('''<div class="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/5 p-1" data-testid="search-segmented">${searchTabBtn('songs','Songs')}${searchTabBtn('artists','Artists')}${searchTabBtn('lyrics','Lyrics')}</div>''',
    '''<div class="grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-white/5 p-1" data-testid="search-segmented">${searchTabBtn('songs','Songs')}${searchTabBtn('artists','Artists')}${searchTabBtn('lyrics','Lyrics')}${searchTabBtn('settings','Settings')}</div>''')
rep('function updateSearchTabs(){ ["songs","artists","lyrics"].forEach(', 'function updateSearchTabs(){ ["songs","artists","lyrics","settings"].forEach(')
rep('function searchPlaceholder(){ return state.searchTab==="artists"?"Search artists\\u2026":',
    'function searchPlaceholder(){ return state.searchTab==="settings"?"Search settings\\u2026":state.searchTab==="artists"?"Search artists\\u2026":')

# Handlers
rep('''    case "search-tab": { state.searchTab=t.dataset.tab; updateSearchTabs(); refreshSearchResults(); break; }''',
    '''    case "search-tab": { state.searchTab=t.dataset.tab; updateSearchTabs(); refreshSearchResults(); break; }
    case "settings-search-toggle": { const it=SETTINGS_INDEX.find(x=>x.id===t.dataset.sid); if(it&&it.toggle){ try{ it.toggle(); }catch(e){ console.warn(e); } setTimeout(()=>{ if(state.searchOpen) refreshSearchResults(); },40); } break; }
    case "settings-search-go": { const it=SETTINGS_INDEX.find(x=>x.id===t.dataset.sid); if(it&&it.go) it.go(); break; }''')

open(P, "w", encoding="utf-8").write(s)
print("OK")
