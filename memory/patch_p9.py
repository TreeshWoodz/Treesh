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
# ---- boot
rep("  mkRenderChrome(); p7Init(); p8Init(); }\n","  mkRenderChrome(); p7Init(); p8Init(); p9Init(); }\n",1,'init')

if errs:
    print('\n'.join(errs)); sys.exit(1)

A=json.load(open(M+'p9_assets.json',encoding='utf-8'))
avs=[v for k,v in A.items() if not k.startswith('_')]
js='\n'.join(open(M+f,encoding='utf-8').read() for f in ['p9a.js','p9b.js','p9c.js','p9d.js','p9e.js','p9g.js','p9h.js','p9i.js','p9j.js'])
js=js.replace('__P9_LOGO__',A['_logo']).replace('__P9_AVATARS__',json.dumps(avs))
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
css='\n'.join(open(M+f,encoding='utf-8').read() for f in ['p9a.css','p9b.css','p9e.css','p9g.css','p9h.css','p9j.css']).replace('__LSX_LIGHT_OVERRIDES__',lsx_light())
hook='/* ---------- boot hook (called from init) ---------- */'
if s.count(hook)!=1: print('hook count',s.count(hook)); sys.exit(1)
s=s.replace(hook,js+'\n'+hook)
if s.count('</style>\n</head>')!=1: print('style end count',s.count('</style>\n</head>')); sys.exit(1)
s=s.replace('</style>\n</head>','\n'+css+'\n</style>\n</head>')
for ph in ['__P9_','__ICO__','__LSX_']:
    if ph in s: print('placeholder left',ph); sys.exit(1)
out='/tmp/index.p9.html' if DRY else P
open(out,'w',encoding='utf-8').write(s); print('ok', out, len(s))
