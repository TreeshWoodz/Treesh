import re, shutil
P='/app/single_html/index.html'; M='/app/memory/'
shutil.copy(P, M+'index.before_p5.html')
s=open(P,encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    c=s.count(old)
    assert c==cnt, ('COUNT',c,old[:120])
    s=s.replace(old,new)
def cut(start_marker,end_marker,new,keep_end=True):
    global s
    a=s.index(start_marker); b=s.index(end_marker,a)
    s=s[:a]+new+(s[b:] if keep_end else s[b+len(end_marker):])

# ---------- mk script assembly ----------
mk=open(M+'mk_script.js',encoding='utf-8').read()
kit=open(M+'p5_kit.js',encoding='utf-8').read()
def mrep(old,new,cnt=1):
    global mk
    c=mk.count(old); assert c==cnt, ('MK',c,old[:120]); mk=mk.replace(old,new)
a=mk.index('/* ---------- glass intensity ---------- */'); b=mk.index('/* ---------- Settings: Layout tab ---------- */')
mk=mk[:a]+kit+'\n'+mk[b:]
mrep("class=\"${tab==='layout'?'':'hidden'} space-y-5\">","class=\"${tab==='appearance'?'':'hidden'} space-y-5\">")
mrep("    case 'mk-glass': { LS.set('treesh_glass',val); applyGlass(); renderView(); toast('Glass: '+({auto:'Auto',strong:'Strong',medium:'Medium',solid:'Solid'}[val]||val)); break; }",
"""    case 'mk-gl-theme': glSetTheme(val); break;
    case 'mk-gl-strength': LS.set('treesh_gl_strength',val); glRefresh(); toast('Glass strength: '+(((GL_STRENGTHS.find(x=>x[0]===val))||[])[1]||val)); break;
    case 'mk-gl-orbs': LS.set('treesh_gl_orbs',!glOrbsOn()); glApply(); renderView(); toast(glOrbsOn()?'Light orbs on':'Light orbs off'); break;
    case 'mk-qs-eq': qsEq(val); break;""")
mrep("Open Magic Markup from Settings \\u2192 Layout","Open Magic Markup from Settings \\u2192 Appearance")
mrep("function mkInit(){ applyGlass(); mkS();","function mkInit(){ glApply(); mkS();")
mrep("'house','layout','Homepage')","'house','appearance','Homepage')")
mrep("'panels-top-left','layout','Pages')","'panels-top-left','appearance','Pages')")
mrep("_sGo('go-glass','Glass intensity','How frosted the floating bubbles look','glass blur frosted bubble translucent transparency intensity','droplets','display','Glass'),",
"_sGo('go-glass','Glass themes','Bubble, Aurora, Candy Pop, Neon Tokyo and more','glass theme themes skin look style bubble aurora candy neon frost sunset gold classic blur frosted strength intensity orbs','gem','appearance','Glass themes'),\n    _sGo('go-quick','Quick settings','Mode, accent, performance, EQ and sleep in one place','quick settings shortcuts fast common favorite','zap','appearance','[data-testid=\"quick-settings\"]'),\n    ...GL_THEMES.map(t=>({id:'glt-'+t.id,label:t.name+' theme',desc:t.desc,kw:'theme glass look skin '+t.name.toLowerCase(),ic:'palette',type:'action',go:()=>{ closeSearch(); glSetTheme(t.id); }})),")
mrep("'sparkles','motion','Motion & effects')","'sparkles','appearance','Motion & effects')")
mrep("  ); }\n  try{ audio.addEventListener('timeupdate'","  ); }\n  try{ const pg=STORAGE_GROUPS.find(g=>g.id==='personalize'); if(pg&&!pg.keys.includes('treesh_mk')) pg.keys.push('treesh_mk','treesh_gl_theme','treesh_gl_strength','treesh_gl_orbs'); }catch(e){}\n  try{ audio.addEventListener('timeupdate'")
mrep("""  const ist=(h&&!hid)?`height:${h}px;${isCv?'':'overflow:auto;'}`:'';
  return `<div class="mk-block mk-w-${w} mk-s-${surf}${isCv?' mk-cv':''}${cfg.tint?' mk-tinted':''}""",
"""  const ist=(h&&!hid)?`height:${h}px;${isCv?'':'overflow:auto;'}`:'';
  const card=b.kind==='widget'||isCv||MK_CARDS.includes(b.id);
  return `<div class="mk-block mk-w-${w} mk-s-${surf}${card?' mk-card':' mk-bare'}${cfg.radius!=null?' mk-has-r':''}${isCv?' mk-cv':''}${cfg.tint?' mk-tinted':''}""")
mrep("const MK_TINTS=","const MK_CARDS=['hero','studio-instrum','studio-lyric'];\nconst MK_TINTS=")
mrep("document.addEventListener('input',e=>{ const el=e.target; if(!el||!el.dataset) return;\n",
"document.addEventListener('input',e=>{ const el=e.target; if(!el||!el.dataset) return;\n  if(el.type==='range'&&el.classList&&el.classList.contains('tr')){ try{ fillSlider(el); }catch(_){} }\n  if(el.id==='qs-accent-color'){ const hex=(el.value||'').toLowerCase(); state.accent=hex; LS.set('treesh_accent',hex); applyAccent(hex); const l=el.closest('label'); if(l){ l.style.background=hex; l.classList.add('on'); } return; }\n")
mrep("  else if(t.id==='set-banner-input'){","  else if(t.id==='qs-accent-color'){ toast('Accent updated'); renderView(); }\n  else if(t.id==='set-banner-input'){")
mrep("  mkRenderChrome(); }\n</script>","  mkRenderChrome(); }\nglApply();\n</script>")
assert 'applyGlass' not in mk and 'mkGlassSettingsHtml' not in mk

css=open(M+'p5_css.css',encoding='utf-8').read()+"  .qs-full{ grid-column:1/-1; }\n"
rep("</style>\n</head>", css+"</style>\n</head>")
rep("</script>\n</body>\n</html>", "</script>\n"+mk.strip()+"\n</body>\n</html>")

# ---------- shell ----------
rep("${NAV.map(n=>navItem(","${mkNav(NAV).map(n=>navItem(",2)
rep('<div class="relative z-10 lg:ml-[240px]">','<div class="gl-main relative z-10 lg:ml-[240px]">')
rep('data-testid="nav-mobile-${v}" aria-label="${label}" title="${label}" class="flex flex-1','data-testid="nav-mobile-${v}" aria-label="${label}" title="${label}" ${active?\'aria-current="page"\':\'\'} class="gl-bnav-item ${active?\'is-active \':\'\'}flex flex-1')
rep('data-testid="nav-${v}" aria-label="${label}" title="${label}" class="flex items-center gap-3 rounded-xl','data-testid="nav-${v}" aria-label="${label}" title="${label}" ${active?\'aria-current="page"\':\'\'} class="gl-nav-item ${active?\'is-active \':\'\'}flex items-center gap-3 rounded-xl')
rep('if(n && getComputedStyle(n).display!=="none") h=n.offsetHeight;','if(n && getComputedStyle(n).display!=="none") h=Math.max(n.offsetHeight, Math.round(window.innerHeight - n.getBoundingClientRect().top));')
rep('<div class="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06] backdrop-blur-2xl shadow-[var(--treesh-shadow)]">','<div class="gl-mini mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06] backdrop-blur-2xl shadow-[var(--treesh-shadow)]">')
rep('function modalWrap(inner, testid, size){ const mw=size==="lg"?"max-w-lg":size==="xl"?"max-w-xl":size==="4xl"?"max-w-4xl":"max-w-md";','function modalWrap(inner, testid, size){ const mw=size==="studio"?"max-w-5xl st-modal":size==="lg"?"max-w-lg":size==="xl"?"max-w-xl":size==="4xl"?"max-w-4xl":"max-w-md";')
rep('<div data-act="modal-stop" class="glass-strong panel-in relative w-full min-w-0 ${mw} rounded-2xl border-white/15 p-5 text-white">${inner}</div></div>`; }','<div data-act="modal-stop" class="gl-modal glass-strong panel-in relative w-full min-w-0 ${mw} rounded-2xl border-white/15 p-5 text-white">${inner}</div></div>`; }')
rep('<div data-act="modal2-stop" class="glass-strong panel-in relative max-h-[calc(100dvh-2rem)]','<div data-act="modal2-stop" class="gl-modal glass-strong panel-in relative max-h-[calc(100dvh-2rem)]')
rep('el.className="glass-strong flex items-center gap-2.5 rounded-xl px-4','el.className="gl-toast glass-strong flex items-center gap-2.5 rounded-xl px-4')

# ---------- editable pages ----------
rep('if(browse){ html+=`<section class="relative overflow-hidden rounded-3xl','if(browse){ html+=`<!--mk:hero--><section class="relative overflow-hidden rounded-3xl')
rep('if(state.genre==="all"){ html+=whatsNewSection(); html+=picksSection(); html+=weeklyTopSection(); html+=libraryPlaylistsSection(); html+=myMusicSection(); } }',
    'if(state.genre==="all"){ html+=\'<!--mk:whatsnew-->\'+whatsNewSection(); html+=\'<!--mk:picks-->\'+picksSection(); html+=\'<!--mk:weekly-->\'+weeklyTopSection(); html+=\'<!--mk:playlists-->\'+libraryPlaylistsSection(); html+=\'<!--mk:mymusic-->\'+myMusicSection(); } }')
rep('  if(state.query){ html+=`<div class="flex items-center gap-2 text-sm text-white/60">','  html+=\'<!--mk:all--><div class="space-y-4">\';\n  if(state.query){ html+=`<div class="flex items-center gap-2 text-sm text-white/60">')
rep('  html+=`</section>`;\n  html+=`</div>`;\n  return html;\n}\n\nfunction viewArtists(){','  html+=`</section></div>`;\n  html+=`</div>`;\n  return mkFromMarkers(\'library\', html, {});\n}\n\nfunction viewArtists(){')
# ---------- Icons / Studios / Game pages ----------
rep('function viewArtists(){\n  return `<div class="space-y-6"><div><p class="font-display text-xs uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">The Collective</p>',
    'function viewArtists(){\n  return mkFromMarkers(\'artists\', `<div class="space-y-6"><!--mk:icons-head--><div><p class="font-display text-xs uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">The Collective</p>')
rep('<p class="mt-1 text-sm text-white/55">Meet the artists behind the sound.</p></div>\n  <div class="grid grid-cols-3 gap-x-4','<p class="mt-1 text-sm text-white/55">Meet the artists behind the sound.</p></div>\n  <!--mk:icons-grid--><div class="grid grid-cols-3 gap-x-4')
rep('''      <div class="text-center"><p class="clamp-1 max-w-[120px] text-sm font-semibold">${esc(a.name)}</p><p class="clamp-1 text-[10px] uppercase tracking-wide text-white/45">${esc(a.role||'Music Artist')}</p></div>
    </button>`).join("")}</div></div>`;
}''','''      <div class="text-center"><p class="clamp-1 max-w-[120px] text-sm font-semibold">${esc(a.name)}</p><p class="clamp-1 text-[10px] uppercase tracking-wide text-white/45">${esc(a.role||'Music Artist')}</p></div>
    </button>`).join("")}</div></div>`, {});
}''')
rep('''  return `<div class="space-y-7" data-testid="studios-view">
    <div class="flex items-end justify-between gap-4">''','''  return mkFromMarkers('studios', `<div class="space-y-7" data-testid="studios-view">
    <!--mk:studios-head--><div class="flex items-end justify-between gap-4">''')
rep('''    <div class="grid gap-4 sm:grid-cols-2">
      ${card({act:'nav',view:'instrum',testid:'studios-open-instrum',''','''    <!--mk:studio-instrum-->${card({act:'nav',view:'instrum',testid:'studios-open-instrum',''')
a=s.index("testid:'studios-open-instrum'"); b=s.index("      ${card({act:'ls-picker',view:'',testid:'studios-open-lyric'",a)
s=s[:b]+"<!--mk:studio-lyric-->"+s[b+6:]
a=s.index("<!--mk:studio-lyric-->${card({act:'ls-picker'"); b=s.index("\n    </div>\n  </div>`;\n}",a)
s=s[:b]+"\n  </div>`, {tid:'studios-view', w:{'studio-instrum':'half','studio-lyric':'half'}});\n}"+s[b+len("\n    </div>\n  </div>`;\n}"):]
rep('''  return `<div class="space-y-6">
    <div class="flex items-start justify-between gap-3">
      <div><p class="font-display text-[11px] uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">Treesh</p><h1 class="mt-1 text-3xl font-bold sm:text-4xl">Games &amp; Things</h1></div>''','''  return mkFromMarkers('game', `<div class="space-y-6">
    <!--mk:game-head--><div class="space-y-4"><div class="flex items-start justify-between gap-3">
      <div><p class="font-display text-[11px] uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">Treesh</p><h1 class="mt-1 text-3xl font-bold sm:text-4xl">Games &amp; Things</h1></div>''')
rep('''data-testid="game-stats-panel">${profileStatsHtml()}</div>`:''}
    ${(tab==='lyrics'||tab==='tot')?gameSubBackHtml():gameTabBar()}''','''data-testid="game-stats-panel">${profileStatsHtml()}</div>`:''}</div>
    <!--mk:game-main--><div>${(tab==='lyrics'||tab==='tot')?gameSubBackHtml():gameTabBar()}''')
rep('''tab==='things'?gameThingsHtml():gameGamesHtml()}</div>
  </div>`; }''','''tab==='things'?gameThingsHtml():gameGamesHtml()}</div></div>
  </div>`, {}); }''')
rep('''  if(state.view==="settings" && (state.settingsTab||"display")==="account"){ updateStorageEstimate(); updateCustomMusicStorage(); }\n}''','''  if(state.view==="settings" && state.settingsTab==="account"){ updateStorageEstimate(); updateCustomMusicStorage(); }\n  mkAfterRender();\n}''')
rep('if(!h) return {view:"library"};','if(!h) return {view:mkHome()};')
rep('  applyUiFont(); applyCustomColors(); applyLabelStyle();\n  renderShell();','  applyUiFont(); applyCustomColors(); applyLabelStyle(); mkInit();\n  renderShell();')

# ---------- Settings: 5 groups, profile, quick settings ----------
rep('''  if(state.settingsTab==='voice' && !VOICE_OK) state.settingsTab='display';
  if(state.settingsTab==='personalize') state.settingsTab='display';
  const tab=state.settingsTab||"display";''','''  state.settingsTab=setTabNorm(state.settingsTab);
  const tab=state.settingsTab;''')
a=s.index('  let TABS=[["display","Appearance","palette"]'); b=s.index('\n',s.index("if(!VOICE_OK){ TABS=TABS.filter(t=>t[0]!=='voice'); }",a))
s=s[:a]+'  const TABS=SET_TABS;'+s[b:]
a=s.index('  const hero=`<div class="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.04] p-6 sm:p-8">'); b=s.index('  const tabBar=`<div class="settings-tabs-bar',a)
s=s[:a]+'  const hero=settingsProfileHtml(editing)+qsStripHtml();\n'+s[b:]
rep('''   <section data-testid="settings-appearance" class="${tab==='display'?'':'hidden'}''','''   ${glThemesHtml(tab)}
   <section data-testid="settings-appearance" class="${tab==='appearance'?'':'hidden'}''')
rep('''<section data-testid="settings-display" class="${tab==='display'?'':'hidden'}''','''<section data-testid="settings-display" class="${tab==='appearance'?'':'hidden'}''')
rep('''<section data-testid="settings-lyrics" class="${tab==='display'?'':'hidden'}''','''<section data-testid="settings-lyrics" class="${tab==='appearance'?'':'hidden'}''')
rep('''<section data-testid="settings-audio" class="${tab==='display'?'':'hidden'}''','''<section data-testid="settings-audio" class="${tab==='audio'?'':'hidden'}''')
rep('''<section data-testid="settings-personalize" class="${tab==='display'?'':'hidden'}''','''<section data-testid="settings-personalize" class="${tab==='appearance'?'':'hidden'}''')
rep('''  </section>\n\n  <section data-testid="settings-sleep" class="${tab==='sleep'?'':'hidden'}''','''  </section>\n  ${mkSettingsHtml(tab)}\n\n  <section data-testid="settings-sleep" class="${tab==='system'?'':'hidden'}''')
rep('''<section data-testid="settings-voice" class="${tab==='voice'?'':'hidden'}''','''<section data-testid="settings-voice" class="${tab==='voice'&&VOICE_OK?'':'hidden'}''')
rep('''<section data-testid="settings-accessibility" class="${tab==='access'?'':'hidden'}''','''<section data-testid="settings-accessibility" class="${tab==='system'?'':'hidden'}''')
i=s.index('<i data-lucide="panel-left" style="width:18px;height:18px"></i>'); a=s.rindex('     <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">',0,i)
endm='   </section>\n\n   ${lyricsSettingsSection(tab)}'; b=s.index(endm,i)
navcard=s[a:b]; s=s[:a]+s[b:]
navsec='''   <section data-testid="settings-navigation" class="${tab==='voice'?'':'hidden'} space-y-5">
     ${VOICE_OK?'':`<div class="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6" data-testid="voice-unsupported"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white/60"><i data-lucide="mic-off" style="width:18px;height:18px"></i></span><div><h2 class="text-lg font-bold">Voice control</h2><p class="text-sm text-white/50">Voice commands aren\\u2019t supported in this browser. Try Chrome or Edge for hands-free control.</p></div></div>`}
'''+navcard+'''   </section>

   <section data-testid="settings-accessibility"'''
rep('   <section data-testid="settings-accessibility"',navsec)
dm='   <section data-testid="settings-danger" class="${tab===\'account\'?\'\':\'hidden\'}'
a=s.index(dm); b=s.index('   <section data-testid="settings-about"',a); danger=s[a:b].replace("${tab==='account'?'':'hidden'}","${tab==='system'?'':'hidden'}"); s=s[:a]+s[b:]
rep('''<section data-testid="settings-about" class="${tab==='about'?'':'hidden'}''','''<section data-testid="settings-about" class="${tab==='system'?'':'hidden'}''')
a=s.index('<section data-testid="settings-about"'); b=s.index('   </section>\n   </div>\n  </div>`;\n}',a)+len('   </section>\n')
s=s[:b]+'\n'+danger.rstrip()+'\n'+s[b:]
rep("  if(tab!=='privacy') return `<section data-testid=\"settings-privacy\" class=\"hidden\"></section>`;","  if(tab!=='account') return `<section data-testid=\"settings-privacy\" class=\"hidden\"></section>`;")
rep("  if(tab!=='lyrics') return `<section data-testid=\"settings-lyrics\" class=\"hidden\"></section>`;","  if(tab!=='audio'&&tab!=='system') return `<section data-testid=\"settings-lyrics\" class=\"hidden\"></section>`;")
rep('''  return `<section data-testid="settings-lyrics" class="space-y-5">
    <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">''','''  return `<section data-testid="settings-lyrics" class="space-y-5">
    <div class="${tab==='audio'?'':'hidden'} rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">''')
i=s.index('<i data-lucide="save" style="width:18px;height:18px"></i></span><h2'); a=s.rindex('    <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">',0,i)
s=s[:a]+'''    <div class="${tab==='system'?'':'hidden'} rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">'''+s[a+len('    <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">'):]
rep("state.settingsTab=tab; closeSearch();","state.settingsTab=setTabNorm(tab); closeSearch();")
rep("'panel-left','access','Navigation')","'panel-left','voice','Navigation')")
rep("'display','Sound')","'audio','Sound')")
rep("'account','[data-testid=\"settings-danger\"]')","'system','[data-testid=\"settings-danger\"]')")
rep("'lyrics','Lyrics backup')","'system','Lyrics backup')")
rep('''state.profile={nickname:nick,birthday:bday,zodiac:zodiac(bday),avatar};''','''state.profile=Object.assign({},state.profile||{},{nickname:nick,birthday:bday,zodiac:zodiac(bday),avatar,bio:((($("#set-bio")||{}).value)||"").trim().slice(0,160)}); state._pfDraft=null;''')
rep('''case "settings-edit-profile": { state.settingsEditProfile=(t.dataset.val==='on');''','''case "settings-edit-profile": { state.settingsEditProfile=(t.dataset.val==='on'); state._pfDraft=null;''')
rep('desc:"Custom fonts & backdrop images, saved on device storage"','desc:"Custom fonts, backdrops, layout stickers & profile banner, saved on device storage"')

# ---------- studios: lyric card, backdrops, image studio, layer panel ----------
a=s.index('  const modeBtn=(m,label,ic,active)=>`<button data-act="card-bg-mode"'); end='  $("#modal").innerHTML=modalWrap(inner,"lyric-studio","4xl"); icons();\n'; b=s.index(end,a)+len(end)
s=s[:a]+open(M+'p5_lc.js',encoding='utf-8').read()+s[b:]
a=s.index('function bdModalHtml(){'); b=s.index('\n/* Downscale + recompress',a)
s=s[:a]+open(M+'p5_bd.js',encoding='utf-8').read().rstrip()+'\n'+s[b:]
rep('function refreshBackdrops(){ const m=document.getElementById("modal"); if(!m) return; m.innerHTML=bdModalHtml(); icons(); bdBindInputs(); bdBindPreview(); }',
'''function refreshBackdrops(){ const m=document.getElementById("modal"); if(!m) return; const prev=m.querySelector('[data-testid="bd-body"]'); const sc=prev?prev.scrollTop:0; m.innerHTML=bdModalHtml();
  if(prev){ const w=m.querySelector('[data-act="modal-backdrop"]'); if(w) w.classList.remove('backdrop-in'); const p=m.querySelector('[data-act="modal-stop"]'); if(p) p.classList.remove('panel-in'); const nb=m.querySelector('[data-testid="bd-body"]'); if(nb) nb.scrollTop=sc; }
  const src=(state.bgImages||[])[bdFocusIdx()]; if(src) m.querySelectorAll('[data-bd-thumb]').forEach(im=>{ im.src=src; });
  icons(); bdBindInputs(); bdBindPreview(); }''')
rep('''  const lv=document.getElementById("bd-size-val"); if(lv) lv.textContent=Math.round(L.size);''','''  [sx,sy,ss,sr].forEach(el=>{ if(el) fillSlider(el); }); const xv=document.getElementById("bd-x-val"); if(xv) xv.textContent=Math.round(L.x)+"%"; const yv=document.getElementById("bd-y-val"); if(yv) yv.textContent=Math.round(L.y)+"%";
  const lv=document.getElementById("bd-size-val"); if(lv) lv.textContent=Math.round(L.size);''')
a=s.index('function cvSliderHtml(id,icon,label,min,max,step,val,valTxt){'); b=s.index('function cvWire(){',a)
s=s[:a]+open(M+'p5_cv.js',encoding='utf-8').read()+s[b:]
rep("""root.querySelectorAll('[data-cv-filter]').forEach(x=>{ const on=x===b; x.classList.toggle('border-[color:var(--treesh-purple)]',on); x.classList.toggle('bg-[color:var(--treesh-purple)]/20',on); x.classList.toggle('text-white',on); x.classList.toggle('border-white/12',!on); x.classList.toggle('bg-white/5',!on); x.classList.toggle('text-white/60',!on); }); cvDraw(); }));""",
"""root.querySelectorAll('[data-cv-filter]').forEach(x=>x.classList.toggle('on',x===b)); cvDraw(); }));""")
rep("""fl.classList.toggle('bg-[color:var(--treesh-purple)]/20',_cv.flip); fl.classList.toggle('text-white',_cv.flip); fl.classList.toggle('text-white/75',!_cv.flip); cvDraw(); });""","""fl.classList.toggle('on',_cv.flip); cvDraw(); });""")
rep("""root.querySelectorAll('[data-cv-tab]').forEach(x=>{ const on=x===b; x.classList.toggle('bg-[color:var(--treesh-purple)]',on); x.classList.toggle('text-white',on); x.classList.toggle('text-white/60',!on); });""","""root.querySelectorAll('[data-cv-tab]').forEach(x=>x.classList.toggle('on',x===b));""")
rep("""  const fl=document.getElementById('cv-flip'); if(fl){ fl.classList.remove('bg-[color:var(--treesh-purple)]/20','text-white'); fl.classList.add('text-white/75'); }
  const root=document.getElementById('modal2'); if(root) root.querySelectorAll('[data-cv-filter]').forEach(x=>{ const on=x.getAttribute('data-cv-filter')==='none'; x.classList.toggle('border-[color:var(--treesh-purple)]',on); x.classList.toggle('bg-[color:var(--treesh-purple)]/20',on); x.classList.toggle('text-white',on); x.classList.toggle('border-white/12',!on); x.classList.toggle('bg-white/5',!on); x.classList.toggle('text-white/60',!on); });""",
"""  const fl=document.getElementById('cv-flip'); if(fl) fl.classList.remove('on');
  const root=document.getElementById('modal2'); if(root) root.querySelectorAll('[data-cv-filter]').forEach(x=>x.classList.toggle('on',x.getAttribute('data-cv-filter')==='none'));""")
a=s.index('function cvRenderLayerPanel(){'); b=s.index('function cvAddLayer(L){',a)
s=s[:a]+open(M+'p5_lp.js',encoding='utf-8').read()+s[b:]
rep("function cvSyncLayerCtl(L){ const set=(id,v)=>{ const el=document.getElementById(id); if(el&&document.activeElement!==el) el.value=v; };","function cvSyncLayerCtl(L){ const set=(id,v)=>{ const el=document.getElementById(id); if(el&&document.activeElement!==el){ el.value=v; fillSlider(el); } };")
rep("  else if(t.id==='cv-l-color'){ L.color=t.value; cvStyleLayer(L); }","  else if(t.id==='cv-l-color'){ L.color=t.value; cvStyleLayer(L); const lb=t.closest('label'); if(lb) lb.style.background=t.value; }")
open(P,'w',encoding='utf-8').write(s)
print('ALL OK', len(s))
