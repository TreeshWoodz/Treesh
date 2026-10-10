import re, json, shutil, sys
P='/app/single_html/index.html'; M='/app/memory/'
DRY='--dry' in sys.argv
s=open(M+'index.before_p9.html',encoding='utf-8').read()
errs=[]
def rep(old,new,cnt=1,tag=''):
    global s
    n=s.count(old)
    if n!=cnt: errs.append(f'[{tag}] expected {cnt} got {n}: {old[:90]!r}'); return
    s=s.replace(old,new)
def rrep(pat,new,cnt=1,tag=''):
    global s
    n=len(re.findall(pat,s))
    if n!=cnt: errs.append(f'[{tag}] regex expected {cnt} got {n}'); return
    s=re.sub(pat,lambda m:new,s)

# ---- icons: built in, CDN only as a lazy fallback
rrep(r'<script src="https://unpkg\.com/lucide@latest/dist/umd/lucide\.js"[^>]*></script>\n','',1,'lucidetag')
ICONLINE="const icons = () => { try { if (window.lucide) lucide.createIcons(); } catch(e){} try { if (typeof pmEnhance==='function') pmEnhance(); } catch(e){} };\n"
ico=open(M+'p9_icons.js',encoding='utf-8').read().replace('__ICO__',open(M+'p9_icons_data.json',encoding='utf-8').read())
rep(ICONLINE,"const icons = () => { try { icoRender(); } catch(e){} try { if (typeof pmEnhance==='function') pmEnhance(); } catch(e){} };\n"+ico,1,'icons')
rep("if(window.lucide && document.querySelector('i[data-lucide]')) icons();","if(document.querySelector('i[data-lucide]')) icons();",1,'schedicons')
rep("\n  lucide.createIcons();\n","\n  icons();\n",1,'lucidecall')

# ---- sharp logo + new avatars
TUMBLR="https://64.media.tumblr.com/c3a9171b66dff3f4d1b204629d553f62/f0962fce333cd090-3d/s250x400/9cc28d33e0d7075a9d5122424756269c6a0e617c.png"
rep('const LOGO="'+TUMBLR+'";','const LOGO=TREESH_LOGO;',1,'logo1')
rep('src="'+TUMBLR+'"','src="${TREESH_LOGO}"',2,'logo2')
rrep(r'const PRESETS=\["https://static\.tumblr\.com/9leohrr/04Hspf8x9/icon-crazy\.png"[^\]]*\];','const PRESETS=OB_AVATARS;',1,'presets')

# ---- hero upload + backup buttons
rep('<i data-lucide="shuffle" style="width:16px;height:16px"></i> Shuffle all</button></div></div></section>',
    '<i data-lucide="shuffle" style="width:16px;height:16px"></i> Shuffle all</button><button data-act="add-music-open" data-testid="hero-upload-music" class="p9-hero-up press"><i data-lucide="upload" style="width:16px;height:16px"></i> Upload music</button></div></div></section>',1,'heroup')
rep('<button data-act="lyrics-export" data-testid="lyrics-export-button" class="press inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold transition-colors hover:bg-white/10">',
    '<button data-act="lyrics-export" data-testid="lyrics-export-button" class="press p9-btn">',1,'lyexp')
rep('<label class="press inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold transition-colors hover:bg-white/10"><i data-lucide="upload" style="width:16px;height:16px"></i>Import backup',
    '<label data-testid="lyrics-import-button" class="press p9-btn is-ghost"><i data-lucide="upload" style="width:16px;height:16px"></i>Import backup',1,'lyimp')
rep('<button data-act="export-all-data" data-testid="export-all-data" class="press inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--treesh-purple)] py-2.5 text-sm font-semibold text-white glow-purple">',
    '<button data-act="export-all-data" data-testid="export-all-data" class="press p9-btn">',1,'trexp')
rep('<label class="press inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"><i data-lucide="upload" style="width:15px;height:15px"></i>Import backup',
    '<label data-testid="transfer-import-button" class="press p9-btn is-ghost"><i data-lucide="upload" style="width:15px;height:15px"></i>Import backup',1,'trimp')

# ---- legal pages in the window viewer
for tid,key,ic,label in [('link-privacy','legal-privacy','shield-check','Privacy Policy'),('link-terms','legal-terms','scroll-text','Terms of Use')]:
    rep(f'<a href="https://treesh.app" target="_blank" rel="noopener" data-testid="{tid}" class="press flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-white/5"><span class="flex items-center gap-3 text-sm font-semibold"><i data-lucide="{ic}" class="text-white/60" style="width:17px;height:17px"></i>{label}</span><i data-lucide="external-link" class="text-white/40" style="width:16px;height:16px"></i></a>',
        f'<button type="button" data-act="legal-open" data-val="{key}" data-testid="{tid}" class="press flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5"><span class="flex items-center gap-3 text-sm font-semibold"><i data-lucide="{ic}" class="text-white/60" style="width:17px;height:17px"></i>{label}</span><i data-lucide="chevron-right" class="text-white/40" style="width:16px;height:16px"></i></button>',1,'legal-'+key)

# ---- zodiac badge opens the hub, stars card, top artist
rep('<span class="inline-flex items-center gap-1 rounded-full border border-[color:var(--treesh-gold)]/40 bg-[color:var(--treesh-gold)]/10 px-2.5 py-1 text-xs font-semibold text-[color:var(--treesh-gold)]" data-testid="settings-profile-zodiac"><i data-lucide="sparkle" style="width:12px;height:12px"></i>${esc(z)}</span>',
    '<button type="button" data-act="zh-open" title="Open your stars" class="press inline-flex items-center gap-1 rounded-full border border-[color:var(--treesh-gold)]/40 bg-[color:var(--treesh-gold)]/10 px-2.5 py-1 text-xs font-semibold text-[color:var(--treesh-gold)]" data-testid="settings-profile-zodiac"><i data-lucide="${ZH_IC[ZH_SIGNS.findIndex(x=>x[1]===z)]||\'sparkle\'}" style="width:12px;height:12px"></i>${esc(z)}<i data-lucide="chevron-right" style="width:12px;height:12px;opacity:.6"></i></button>',1,'zbadge')
rep("S.topCount+' play'+(S.topCount!==1?'s':'')):''}</div>`:''}","S.topCount+' play'+(S.topCount!==1?'s':'')):''}</div>`:''}${zhProfileCard(z)}",1,'zcard')
rep("topArtist:ta?(ta.indexOf('n:')===0?{name:ta.slice(2)}:ARTIST_BY_ID[ta]||null):null","topArtist:ta?pfTopArtist(ta):null",1,'pfta')
rep("ta?topCard('Top artist','profile-top-artist',ta.id?`data-act=\"artist-open\" data-id=\"${ta.id}\"`:'',`<span class=\"h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5\">${ta.image?img(ta.image,'h-full w-full object-cover'):''}</span>`",
    "ta?topCard('Top artist','profile-top-artist',ta.id?`data-act=\"artist-open\" data-id=\"${ta.id}\"`:`data-act=\"p9-search\" data-val=\"${esc(ta.name||'')}\"`,`<span class=\"grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/5\" data-testid=\"profile-top-artist-img\">${ta.image?img(ta.image,'h-full w-full object-cover'):'<i data-lucide=\"mic-vocal\" style=\"width:18px;height:18px\"></i>'}</span>`",1,'pftacard')

# ---- bold / italic lyric markup survives into the player
rep("    const line={ t:+t, text, sec:curSec };\n","    const line={ t:+t, text, sec:curSec }; const _raw=(it.text||'').trim(); if(_raw!==text) line.md=_raw;\n",1,'lymd')
rep("items.push({type:'line', t:(typeof l.t==='number'?l.t:null), text:l.text, explain:","items.push({type:'line', t:(typeof l.t==='number'?l.t:null), text:lyMd(l)?l.md:l.text, explain:",1,'lyback')
rep('${_da.style?` style="${_da.style}"`:""}>${esc(l.text)}${inds}</button>','${_da.style?` style="${_da.style}"`:""}>${lyFmt(l)}${inds}</button>',1,'lyplayer')

# ---- swipe down: voice + stars sheets too
rep("const HEAD='.pm-grab,.pf-grab,.pm-head,.pm-song,.st-head,.te-head,.te-tabs,.mk-sheet-head,.mk-sheet-grab,.um-head-top,[data-sheet-drag]';",
    "const HEAD='.pm-grab,.pf-grab,.pm-head,.pm-song,.st-head,.te-head,.te-tabs,.mk-sheet-head,.mk-sheet-grab,.um-head-top,.vx-grab,.vx-head,.zh-grab,[data-sheet-drag]';",1,'swhead')
rep("const p=t.closest('.pm-panel,#profile-panel,.mk-sheet,.um-panel'); if(!p) return;","const p=t.closest('.pm-panel,#profile-panel,.mk-sheet,.um-panel,[data-voice-panel],.zh-sheet'); if(!p) return;",1,'swpanel')
rep("function sheetClose(p){ if(p.id==='profile-panel'){ closeProfile(true); return; }",
    "function sheetClose(p){ if(p.id==='profile-panel'){ closeProfile(true); return; } if(p.classList.contains('zh-sheet')){ zhClose(); return; } if(p.hasAttribute('data-voice-panel')){ const b=document.querySelector('#voice-ov [data-act=\"voice-cancel\"]'); if(b) b.click(); return; }",1,'swclose')

# ---- swipe down: tablets via the handle, no entrance replay, reorder handles left alone
rep("S=null; if(window.innerWidth>=1024||e.touches.length!==1) return;","S=null; if(e.touches.length!==1) return;",1,'swgate')
rep("if(!head&&t.closest('input,textarea,select,[contenteditable=\"true\"],canvas,.st-frame,[data-no-swipe]')) return;","if(window.innerWidth>=1024&&!head) return; if(!head&&t.closest('input,textarea,select,[contenteditable=\"true\"],canvas,.st-frame,[data-no-swipe],[data-rhandle]')) return;",1,'swexcl')
rep("S.on=true; S.y0=tc.clientY; S.t0=performance.now(); S.p.classList.add('pm-dragging');","S.on=true; S.y0=tc.clientY; S.t0=performance.now(); S.p.classList.remove('panel-in'); S.p.classList.add('pm-dragging');",1,'swreplay')

# ---- Magic Markup: phone widths, hints
rep("${cfg.tint?' mk-tinted':''}${hid?' mk-is-hidden':''}","${cfg.tint?' mk-tinted':''}${cfg.mw?' mk-mw-'+cfg.mw:''}${hid?' mk-is-hidden':''}",1,'mkmw')
rep("const w=cfg.w||((blk.className.match(/mk-w-(\\w+)/)||[])[1])||'full'; const inner=blk.querySelector(':scope > .mk-inner'); const curH=",
    "const w=window.innerWidth<640?(cfg.mw||'full'):(cfg.w||((blk.className.match(/mk-w-(\\w+)/)||[])[1])||'full'); const inner=blk.querySelector(':scope > .mk-inner'); const curH=",1,'mksheetw')
rep('<p class="mk-hint sm:hidden">Phones show every section full width.</p>','<p class="mk-hint sm:hidden">Your phone layout is saved on its own, bigger screens keep theirs.</p>',1,'mkhint')
rep("    case 'mk-w': mkCfgSet({w:val}); break;","    case 'mk-w': mkCfgSet(window.innerWidth<640?{mw:val==='full'?'':val}:{w:val}); break;",1,'mkwact')
rep("Drag, resize and restyle anything. Tap Done when finished.'","Hold any section to move it. Drag the purple corner dot to resize.'",1,'mktoast')

# ---- playlists: stacked covers
rrep(r"\$\{cover\?img\(cover\.coverArt,'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'\):`<div class=\"grid h-full w-full place-items-center bg-\[color:var\(--treesh-purple\)\]/15 text-\[color:var\(--treesh-purple\)\]\"><i data-lucide=\"list-music\" style=\"width:3\dpx;height:3\dpx\"></i></div>`\}","${plCardArt(pl)}",2,'plcard')
rrep(r"<span class=\"h-10 w-10 shrink-0 overflow-hidden rounded-lg[^\"]*\">\$\{cover\?img\(cover\.coverArt,'h-full w-full object-cover'\):`<span class=\"grid h-full w-full place-items-center text-\[color:var\(--treesh-purple\)\]\"><i data-lucide=\"list-music\" style=\"width:16px;height:16px\"></i></span>`\}</span>","<span class=\"block h-10 w-10 shrink-0\">${plStackHtml(pl,'pls-sm')}</span>",2,'plrow')
rep('<div class="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-white/10 bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><i data-lucide="list-music" style="width:22px;height:22px"></i></div>','<span class="block h-14 w-14 shrink-0">${plStackHtml(pl,\'pls-sm\')}</span>',1,'pllist')
rrep(r"<span class=\"grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md \$\{cover\?'':'bg-\[color:var\(--treesh-purple\)\]/15 text-\[color:var\(--treesh-purple\)\]'\}\">\$\{cover\?img\(cover\.coverArt,'h-full w-full object-cover'\):'[^']*'\}</span>","<span class=\"block h-9 w-9 shrink-0\">${plStackHtml(pl,'pls-xs')}</span>",1,'plside')
rep('<div class="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-white/10 bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><i data-lucide="list-music" style="width:40px;height:40px"></i></div>','<div class="h-28 w-28 shrink-0" data-testid="playlist-detail-cover">${plStackHtml(pl,\'pls-hero\')}</div>',1,'plhero')

# ---- P9g: Treesh accounts (Supabase)
SBCFG=open(M+'p9g_config.js',encoding='utf-8').read()
rep('<script src="https://cdn.tailwindcss.com"></script>\n','<script src="https://cdn.tailwindcss.com"></script>\n<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n<script>\n'+SBCFG+'</script>\n',1,'sbcdn')
rep('   ${glThemesHtml(tab)}\n   ${npSettingsHtml(tab)}','   ${sbAccountCardHtml(tab)}\n   ${glThemesHtml(tab)}\n   ${npSettingsHtml(tab)}',1,'sbcard')
rep('      </div>\n    </footer>\n  </div>`;\n  obMount(shell);','      </div>\n      ${sbObRow()}\n    </footer>\n  </div>`;\n  obMount(shell);',1,'sbob')
rep('if(n||b) state._pfDraft={nick:n?n.value:null, bio:b?b.value:null, bday:d?d.value:null}; }',"const u=document.getElementById('set-uname'); if(n||b) state._pfDraft={nick:n?n.value:null, bio:b?b.value:null, bday:d?d.value:null, uname:u?u.value:null}; }",1,'sbdraft')
rep("const bio=dr.bio!=null?dr.bio:(p.bio||'');","const bio=dr.bio!=null?dr.bio:(p.bio||''); const uname=(dr.uname!=null?dr.uname:p.username)||'';",1,'sbuname')
rep('maxlength="40" class="h-11 w-full rounded-2xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[color:var(--treesh-purple)]"></div>','maxlength="40" class="h-11 w-full rounded-2xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[color:var(--treesh-purple)]"></div>${sbUnameField(uname)}',1,'sbufield')
rep('data-testid="settings-profile-name">${esc(shown)}</h1>','data-testid="settings-profile-name">${esc(shown)}</h1>${p.username?`<p class="pf-uname" data-testid="settings-profile-username">@${esc(p.username)}</p>`:\'\'}',1,'sbushow')
rep('case "save-profile": { const nick=$("#set-nick").value.trim()||"Treesh Fan";','case "save-profile": { const _un=sbUname(($("#set-uname")||{}).value, state.profile&&state.profile.username); if(_un===false) break; const nick=$("#set-nick").value.trim()||"Treesh Fan";',1,'sbsave1')
rep('bio:((($("#set-bio")||{}).value)||"").trim().slice(0,160)}); state._pfDraft=null;','bio:((($("#set-bio")||{}).value)||"").trim().slice(0,160),username:_un}); state._pfDraft=null;',1,'sbsave2')
rep('state.settingsEditProfile=false; toast("Profile saved"); renderShell(); renderView(); renderSidebarLibrary(); if(state.profileOpen) renderProfile(); break; }','state.settingsEditProfile=false; toast("Profile saved",sbUser()?"Syncing to your Treesh account":""); renderShell(); renderView(); renderSidebarLibrary(); if(state.profileOpen) renderProfile(); sbQueuePush(); break; }',1,'sbsave3')
rep('LS.set("treesh_profile",state.profile); if(onboard.bday){','LS.set("treesh_profile",state.profile); sbQueuePush(); if(onboard.bday){',1,'sbobfin')

rep('if(!state.profile){ onboard={step:0,nick:"",bday:"",avatar:""}; setTimeout(renderOnboarding,400); }','if(!state.profile){ onboard={step:0,nick:"",bday:"",avatar:""}; setTimeout(()=>{ if(!state.profile) renderOnboarding(); },400); }',1,'sbobboot')
rep('No signup, everything stays on this device.','No signup needed, everything stays on this device.',1,'sbobcopy')
rep('Everything in Treesh is saved only on this device.','Everything in Treesh is saved on this device. Signed in? Your profile also syncs to your account.',1,'sbstorecopy')

# ---- P9h: welcome screen = Create account / Sign in / guest
rep("swap('[data-testid=\"onboarding-progress\"]'); const foot=swap('.obx-foot');","swap('[data-testid=\"onboarding-progress\"]'); const foot=swap('.obx-foot'); { const x=root.querySelector('[data-testid=\"onboarding-account-row\"]'), y=nw.querySelector('[data-testid=\"onboarding-account-row\"]'), f=root.querySelector('[data-testid=\"onboarding-footer\"]'); if(x&&y) x.replaceWith(y); else if(x) x.remove(); else if(y&&f) f.appendChild(y); }",1,'obrowswap')
rep('        ${onboard.step<4?`<button data-act="ob-next" data-testid="onboarding-next"','        ${(intro&&!sbUser()&&!state.profile)?sbWelcomeCta():onboard.step<4?`<button data-act="ob-next" data-testid="onboarding-next"',1,'obwelcome')
# ---- P9h: Magic Markup "Select" (element edits) button
rep("tb('layers','layers','Layers','mk-layers-button')","tb('layers','layers','Layers','mk-layers-button')+mkdTbBtn()",1,'mkdtb')
# ---- P9h: sheets close on a quick flick (recent velocity, lower bar)
rep("const d=Math.max(0,tc.clientY-S.y0); S.dy=d; S.p.style.transform=","const d=Math.max(0,tc.clientY-S.y0); S.dy=d; { const _n=performance.now(); (S.pts=S.pts||[]).push([_n,tc.clientY]); while(S.pts.length>2&&_n-S.pts[0][0]>90) S.pts.shift(); } S.p.style.transform=",1,'flick1')
rep("const v=s.dy/Math.max(1,performance.now()-s.t0);\n    if(s.dy>110||(v>.5&&s.dy>40)){ p.style.transition='transform .22s cubic-bezier(.4,0,1,1)';",
    "const _pa=s.pts&&s.pts[0], _pb=s.pts&&s.pts[s.pts.length-1]; const v=Math.max(s.dy/Math.max(1,performance.now()-s.t0),(_pa&&_pb&&_pb[0]>_pa[0])?(_pb[1]-_pa[1])/(_pb[0]-_pa[0]):0);\n    if(s.dy>100||(v>.35&&s.dy>22)){ p.style.transition='transform .18s cubic-bezier(.4,0,1,1)';",1,'flick2')

exec(open('/app/memory/patch_p9j_reps.txt',encoding='utf-8').read())
# ---- P9l: badges move to the Stats tab (with games + Starlites)
rrep(r'\n    <div class="mt-6 pf-bdg\$\{pfBdgOpen\(\)\?\' is-open\':\'\'\}" data-testid="profile-badges-section">[^\n]*?</div></div>\n   </div></section>`; \}','\n   </div></section>`; }',1,'pfbdgmove')
# ---- P9m: Users tab in search
rep("${searchTabBtn('lyrics','Lyrics')}${searchTabBtn('settings','Settings')}</div>","${searchTabBtn('lyrics','Lyrics')}${searchTabBtn('users','Users')}${searchTabBtn('settings','Settings')}</div>",1,'srchusers')
rep('function updateSearchTabs(){ ["songs","artists","lyrics","settings"].forEach(','function updateSearchTabs(){ ["songs","artists","lyrics","users","settings"].forEach(',1,'srchusers2')
# ---- P9l: Support + Feedback in System & About
rep('     </div>\n     <div class="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">\n       <div class="flex items-center gap-2 text-sm font-semibold"><i data-lucide="copyright"','     </div>\n     ${tsAboutRows()}\n     <div class="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">\n       <div class="flex items-center gap-2 text-sm font-semibold"><i data-lucide="copyright"',1,'tsabout')
rep('<p class="mb-4 pl-11 text-sm text-white/50">Legal &amp; app information.</p>','<p class="mb-4 pl-11 text-sm text-white/50">Help, legal &amp; app information.</p>',1,'tsaboutsub')
# ---- nicer cover placeholder (missing / broken art)
rrep(r'const FALLBACK = "data:image/svg\+xml;utf8," \+ encodeURIComponent\("[^\n]*?"\);', open(M+'p9q_fallback.txt',encoding='utf-8').read().strip(), 1, 'fallback')
# ---- boot
rep("  mkRenderChrome(); p7Init(); p8Init(); }\n","  mkRenderChrome(); p7Init(); p8Init(); p9Init(); }\n",1,'init')

# ---- P9t: Instrum one timeline (zoomable px/sec) + Studios card copy
rep("const IDAW_PPS=44, IDAW_TRACK_H=76, IDAW_RULER_H=20, IDAW_STRIP_W=134;","let IDAW_PPS=44; const IDAW_TRACK_H=76, IDAW_RULER_H=20, IDAW_STRIP_W=134;",1,'ixpps')
rep("desc:'Layer drums, 808s, leads and pads on a step sequencer. Play it live, then save or export to WAV.',chips:['10 instruments','Presets & swing','Metronome','Export WAV',",
    "desc:'Drums and vocals on one timeline. Program beats, record over them, mix every track and export the whole song.',chips:['Drums + vocals','Mixer','Arrange bars','Export WAV',",1,'ixcard')

# ---- P9z: loading screen uses the accent colour (set before first paint)
rep('background:radial-gradient(130% 120% at 50% 28%, #16101f 0%, #0b0a0e 55%, #08080a 100%);','background:radial-gradient(130% 120% at 50% 28%, var(--sp-bg,#16101f) 0%, #0b0a0e 55%, #08080a 100%);',1,'spbg')
rep('border-radius:50%; border:2px solid rgba(147,40,255,0.18); }','border-radius:50%; border:2px solid rgba(var(--sp-rgb,147,40,255),0.18); }',1,'spring1')
rep('border-top-color:#9328ff; animation:splashSpin 1s linear infinite; box-shadow:0 0 26px rgba(147,40,255,0.32); }','border-top-color:var(--sp-a,#9328ff); animation:splashSpin 1s linear infinite; box-shadow:0 0 26px rgba(var(--sp-rgb,147,40,255),0.32); }',1,'spring2')
rep('background:linear-gradient(180deg,#c39bff,#9328ff); box-shadow:0 0 14px rgba(147,40,255,0.55); animation:splashEq','background:linear-gradient(180deg,var(--sp-a2,#c39bff),var(--sp-a,#9328ff)); box-shadow:0 0 14px rgba(var(--sp-rgb,147,40,255),0.55); animation:splashEq',1,'speq')
rep('      <div class="splash-sub">Welcome to the Woodz</div>\n    </div>\n  </div>\n','      <div class="splash-sub">Welcome to the Woodz</div>\n    </div>\n  </div>\n  <script>(function(){try{var h=JSON.parse(localStorage.getItem("treesh_accent")||"null");if(typeof h!=="string"||!/^#[0-9a-f]{6}$/i.test(h))return;var n=parseInt(h.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255,s=document.getElementById("app-splash").style,m=function(c){return Math.round(c+(255-c)*.45)};s.setProperty("--sp-a",h);s.setProperty("--sp-rgb",r+","+g+","+b);s.setProperty("--sp-a2","rgb("+m(r)+","+m(g)+","+m(b)+")");s.setProperty("--sp-bg","rgb("+Math.round(11+r*.07)+","+Math.round(10+g*.07)+","+Math.round(14+b*.07)+")");document.documentElement.style.setProperty("--treesh-purple",h);}catch(e){}})();</script>\n',1,'spjs')
# ---- P9z: remember the original lyrics before edits replace them (revert in the player)
rep("if(SONG_BY_ID[id] && Array.isArray(ed[id])) SONG_BY_ID[id].lyrics=ed[id];","if(SONG_BY_ID[id] && Array.isArray(ed[id])){ const _s=SONG_BY_ID[id]; if(!_s._ly0&&_s.lyrics!==ed[id]) _s._ly0=_s.lyrics; _s.lyrics=ed[id]; }",1,'ly0')

rep('<div id="app-splash" role="status"','<div id="app-splash" role="status"',1,'splashchk')
rep('      <div class="splash-sub">Welcome to the Woodz</div>\n    </div>\n  </div>\n','      <div class="splash-sub">Welcome to the Woodz</div>\n    </div>\n  </div>\n  <script>try{if(JSON.parse(localStorage.getItem("treesh_theme")||\'"dark"\')==="light")document.getElementById("app-splash").classList.add("is-light")}catch(e){}</script>\n',1,'splashlight')

# ---- P9zf: library grid cards (genre ellipsis, no play counts in the studio grid)
rep('<span class="ml-auto flex items-center gap-1.5">${mp?`','<span class="sc-tail ml-auto flex min-w-0 items-center gap-1.5">${mp?`',1,'sctail')
rep('${s.genre?`<span class="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">${esc(s.genre)}</span>`:""}',
    '${s.genre?`<span class="sc-genre rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50" title="${esc(s.genre)}">${esc(s.genre)}</span>`:""}',1,'scgenre')
rep("[d?fmt(d):'',s.genre||'',pc[s.id]?fmtNum(pc[s.id])+' plays':'']","[d?fmt(d):'',s.genre||'']",1,'umplays')
# ---- P9zf: library section menus open as sheets; empty My Music shows a plus on phones
rrep(r'const mobileMenu = `<details class="mm-menu relative sm:hidden">[\s\S]*?</details>`;',
    'const mobileMenu = count?`<button type="button" data-act="mm-menu-open" data-testid="my-music-menu" aria-label="More options" class="press grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/5 text-white/80 sm:hidden"><i data-lucide="more-vertical" style="width:16px;height:16px"></i></button>`:`<button type="button" data-act="add-music-open" data-testid="my-music-add-mobile" aria-label="Add music" class="press grid h-9 w-9 place-items-center rounded-full bg-[color:var(--treesh-purple)] text-white glow-purple sm:hidden"><i data-lucide="plus" style="width:16px;height:16px"></i></button>`;',1,'mmmenu')
rrep(r"const menu = \(pls\.length && !selMode && !reMode\)\?`<details class=\"libpl-menu relative\">[\s\S]*?</details>`:'';",
    "const menu = (pls.length && !selMode && !reMode)?`<button type=\"button\" data-act=\"libpl-menu-open\" data-testid=\"lib-playlists-menu\" aria-label=\"Playlist options\" class=\"press grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/5 text-white/80\"><i data-lucide=\"more-vertical\" style=\"width:16px;height:16px\"></i></button>`:'';",1,'plmenu')
# ---- P9zf: playlist page shuffle + add songs, empty playlists pick tracks right there
rep('<div class="flex items-center gap-3"><button data-act="playall-context" data-ctx="pl:${pl.id}" class="inline-flex items-center gap-2 rounded-full bg-[color:var(--treesh-purple)] px-5 py-2.5 text-sm font-semibold hover:opacity-90 glow-purple"><i data-lucide="play" style="width:16px;height:16px"></i> Play</button></div>',
    '<div class="flex items-center gap-2.5" data-testid="playlist-actions"><button data-act="playall-context" data-ctx="pl:${pl.id}" data-testid="playlist-play" class="press inline-flex items-center gap-2 rounded-full bg-[color:var(--treesh-purple)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 glow-purple"><i data-lucide="play" class="fill-current" style="width:16px;height:16px"></i> Play</button><button data-act="pl-shuffle" data-id="${pl.id}" data-testid="playlist-shuffle" class="press inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"><i data-lucide="shuffle" style="width:16px;height:16px"></i> Shuffle</button><button data-act="pl-add-songs" data-id="${pl.id}" data-testid="playlist-add-songs" aria-label="Add songs" title="Add songs" class="press ml-auto grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10"><i data-lucide="list-plus" style="width:17px;height:17px"></i></button></div>',1,'plactions')
rep('<p class="text-sm text-white/50">Add songs using the \\u2022\\u2022\\u2022 menu on any track.</p><button data-act="nav" data-view="library" class="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">Browse Library</button>',
    '<p class="text-sm text-white/50">Pick a few tracks to get it going.</p><button data-act="pl-add-songs" data-id="${pl.id}" data-testid="playlist-empty-add" class="press inline-flex items-center gap-2 rounded-full bg-[color:var(--treesh-purple)] px-5 py-2.5 text-sm font-semibold text-white glow-purple"><i data-lucide="list-plus" style="width:16px;height:16px"></i>Add songs</button>',1,'plempty')
# ---- P9zf: the floating wand is gone, so is its setting
rep("""<div class="mt-4">${mkSwitch('mk-fab-toggle','','mk-fab-toggle-sheet',m.fab!==false,'wand-sparkles','Floating wand button','Drag it anywhere. If hidden, open Magic Markup from Settings')}${m.fabPos?'<button type="button" data-act="mk-fab-reset" data-testid="mk-fab-reset" class="mk-btn mt-2 w-full"><i data-lucide="locate-fixed"></i>Put the wand back in the corner</button>':''}</div>""",'',1,'nofab1')
rep("""<div class="mt-4">${tog('mk-fab-toggle','','layout-fab-toggle',m.fab!==false,'wand-sparkles','Floating wand button','Keep the Magic Markup button on screen. Drag it anywhere')}${m.fabPos?'<button data-act="mk-fab-reset" data-testid="layout-fab-reset" class="press mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"><i data-lucide="locate-fixed" style="width:15px;height:15px"></i>Put the wand back in the corner</button>':''}</div>""",'',1,'nofab2')
rep("""    {id:'mk-fab',label:'Magic Markup button',desc:'Show the floating wand button',kw:'magic markup wand button floating',ic:'wand-sparkles',type:'toggle',get:()=>mkS().fab!==false,toggle:()=>{ const m=mkS(); m.fab=(m.fab===false); mkSave(); mkRenderChrome(); }},\n""",'',1,'nofab3')
# ---- P9zf: Font + Font color live in one card
rrep(r'\n    <div class="rounded-3xl border border-white/10 bg-white/\[0\.04\] p-5 sm:p-6">\n      <div class="mb-1 flex items-center justify-between gap-2"><div class="flex items-center gap-2\.5"><span [^\n]*?<h2 class="text-lg font-bold">Font color</h2>[^\n]*\n[^\n]*\n      <div class="space-y-2\.5">\n[^\n]*\n      </div>\n    </div>\n','\n',1,'fontcolorcut')
rep("saved on device storage.</p>`:''}\n      </div>\n    </div>\n",
    "saved on device storage.</p>`:''}\n      </div>\n      <div class=\"mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5\" data-testid=\"settings-font-color\"><div class=\"mb-1 flex items-center justify-between gap-2\"><p class=\"flex items-center gap-2 text-sm font-semibold\"><i data-lucide=\"baseline\" style=\"width:15px;height:15px\" class=\"text-[color:var(--treesh-purple)]\"></i>Font color</p>${state.inkColor?`<button data-act=\"reset-ink-color\" data-testid=\"reset-ink-color\" class=\"press rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10\">Reset</button>`:''}</div><p class=\"mb-3 text-xs text-white/50\">Tint the main text across the app. Pick a shade that stays readable with your theme.</p>${colorRow('set-ink-color','reset-ink-color',state.inkColor,'baseline','Text color','Headings &amp; primary text')}</div>\n    </div>\n",1,'fontcolorin')
rep('<p class="mb-4 pl-11 text-sm text-white/50">Choose a typeface for the whole app.</p>','<p class="mb-4 pl-11 text-sm text-white/50">Choose a typeface and text color for the whole app.</p>',1,'fontsub')
rep("'font color text colour ink','type','display','Font color'),","'font color text colour ink','type','display','Font'),",1,'fontgo')
# ---- P9zf: "Glass themes" is just "Themes"; pull to refresh toggle
rep("Glass themes</h2></div>","Themes</h2></div>",1,'themes1')
rep("_sGo('go-glass','Glass themes',","_sGo('go-glass','Themes',",1,'themes2')
rep("'appearance','Glass themes')","'appearance','Themes')",1,'themes3')
rep("      ${toggleCard('toggle-whatsnew','settings-toggle-whatsnew'","      ${toggleCard('toggle-ptr','settings-toggle-ptr',ptrOn(),'refresh-cw','Pull to refresh','On phones, pull down at the top of a page to reload Treesh')}\n      ${toggleCard('toggle-whatsnew','settings-toggle-whatsnew'",1,'ptrtoggle')

rep("document.addEventListener('touchmove',e=>{ if(!S||S.dead) return; const tc=e.touches[0]; const dx=tc.clientX-S.x0, dy=tc.clientY-S.y0;","sheetMoveBind(e=>{ if(!S||S.dead) return; const tc=e.touches[0]; const dx=tc.clientX-S.x0, dy=tc.clientY-S.y0;",1,'shmv1')
rep("S.bd.style.opacity=String(Math.max(.2,1-d/650)); },{passive:false,capture:true});","S.bd.style.opacity=String(Math.max(.2,1-d/650)); });",1,'shmv2')
rep("  function draw(){ ctx.clearRect(0,0,w,h); const g=ctx.createRadialGradient(w/2,h*0.35","  function draw(){ if(ecoSkip('stars')){ raf=requestAnimationFrame(draw); return; } ctx.clearRect(0,0,w,h); const g=ctx.createRadialGradient(w/2,h*0.35",1,'eco1')
rep("const dpr=Math.min(window.devicePixelRatio||1,2); let w,h,stars=[],shoot=null","const dpr=ecoOn()?1:Math.min(window.devicePixelRatio||1,2); let w,h,stars=[],shoot=null",1,'eco2')
rep("function vizTick(){ _vizRAF=requestAnimationFrame(vizTick); if(!_vizCanvases.length){ return; }","function vizTick(){ _vizRAF=requestAnimationFrame(vizTick); if(!_vizCanvases.length||ecoSkip('viz')){ return; }",1,'eco3')
rep('return "Opening your library.";','return "Opening Home.";',2,'vxhome')
if errs:
    print('\n'.join(errs)); sys.exit(1)

A=json.load(open(M+'p9_assets.json',encoding='utf-8'))
avs=[v for k,v in A.items() if not k.startswith('_')]
rep("body=`<p class=\"mk-lbl\">Show in navigation</p><div class=\"space-y-1.5\">${MK_NAV.map(([id,label,ic])=>mkSwitch('mk-page-toggle',id,'mk-page-toggle-'+id,id==='settings'||!m.hidden.includes(id),ic,label,'',id==='settings')).join('')}</div>","body=`${mkNavEditHtml()}",1,'mknavedit')
js='\n'.join(open(M+f,encoding='utf-8').read() for f in ['p9a.js','p9b.js','p9c.js','p9d.js','p9e.js','p9g.js','p9h.js','p9i.js','p9j.js','p9k.js','p9l.js','p9m.js','p9n.js','p9o.js','p9p.js','p9q.js','p9r.js','p9s.js','p9t.js','p9u.js','p9v.js','p9w.js','p9x.js','p9y.js','p9z.js','p9za.js','p9zb.js','p9zc.js','p9zd.js','p9ze.js','p9zf.js','p9zg.js','p9zh.js','p9zi.js','p9zj.js','p9zk.js','p9zl.js','p9zm.js','p9zn.js','p9zo.js','p9zp.js','p9zq.js','p9zr.js','p9zs.js','p9zt.js','p9zu.js','p9zv.js','p9zw.js','p9zx.js','p9zy.js','p9zz.js','p9zza.js','p9zzb.js','p9zzc.js','p9zzd.js','p9zze.js'])
js=js.replace('__P9W_ART__',open(M+'p9w_art.json',encoding='utf-8').read()).replace('__P9ZM_ART__',open(M+'p9zm_art.json',encoding='utf-8').read()).replace('__P9_LOGO__',A['_logo']).replace('__P9_AVATARS__',json.dumps(avs))
def lsx_light():
    ink='29,26,36'; out=[]
    keep=':not(.glow-purple):not([class*="treesh-purple)]"])'
    out.append(f'.lsx-light .text-white{keep}{{ color:rgb({ink}) !important; }}')
    for a in [90,85,80,75,70,65,60,55,50,45,40,35,30,25]:
        out.append(f'.lsx-light .text-white\\/{a}{keep}, .lsx-light .hover\\:text-white\\/{a}:hover{{ color:rgba({ink},{min(0.95,a/100+0.06):.2f}) !important; }}')
    out.append(f'.lsx-light .hover\\:text-white:hover{{ color:rgb({ink}) !important; }}')
    for a in ['5','8','10','12','15','20','\\[0\\.02\\]','\\[0\\.03\\]','\\[0\\.04\\]','\\[0\\.06\\]']:
        out.append(f'.lsx-light .bg-white\\/{a}, .lsx-light .hover\\:bg-white\\/{a}:hover{{ background-color:rgba({ink},.05) !important; }}')
    for a in ['8','10','12','15','20','25','30']:
        out.append(f'.lsx-light .border-white\\/{a}{{ border-color:rgba({ink},.12) !important; }}')
    out.append(f'.lsx-light .placeholder-white\\/30::placeholder{{ color:rgba({ink},.4) !important; }}')
    out.append(f'.lsx-light .bg-black\\/25{{ background-color:rgba({ink},.06) !important; }}')
    out.append('.lsx-light .np-line{ color:rgba(29,26,36,.42); } .lsx-light .np-line.is-active, .lsx-light .np-line.active{ color:#1d1a24; }')
    return '\n'.join(out)
css='\n'.join(open(M+f,encoding='utf-8').read() for f in ['p9a.css','p9b.css','p9e.css','p9g.css','p9h.css','p9j.css','p9k.css','p9l.css','p9m.css','p9n.css','p9o.css','p9p.css','p9q.css','p9r.css','p9s.css','p9t.css','p9u.css','p9v.css','p9w.css','p9x.css','p9y.css','p9z.css','p9za.css','p9zb.css','p9zc.css','p9zd.css','p9ze.css','p9zf.css','p9zg.css','p9zh.css','p9zi.css','p9zj.css','p9zk.css','p9zl.css','p9zo.css','p9zp.css','p9zr.css','p9zs.css','p9zt.css','p9zu.css','p9zv.css','p9zx.css','p9zz.css','p9zza.css','p9zzb.css','p9zzc.css','p9zze.css']).replace('__LSX_LIGHT_OVERRIDES__',lsx_light())
hook='/* ---------- boot hook (called from init) ---------- */'
if s.count(hook)!=1: print('hook count',s.count(hook)); sys.exit(1)
s=s.replace(hook,js+'\n'+hook)
if s.count('</style>\n</head>')!=1: print('style end count',s.count('</style>\n</head>')); sys.exit(1)
s=s.replace('</style>\n</head>','\n'+css+'\n</style>\n</head>')
sys.path.insert(0,M); from copy_p9 import apply_copy
s,_cm=apply_copy(s)
for x in _cm: print('copy miss',x)
for ph in ['__P9_','__P9W_','__P9ZM_','__ICO__','__LSX_']:
    if ph in s: print('placeholder left',ph); sys.exit(1)
out='/tmp/index.p9.html' if DRY else P
open(out,'w',encoding='utf-8').write(s); print('ok', out, len(s))
