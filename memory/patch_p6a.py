P='/app/single_html/index.html'; M='/app/memory/'
s=open(P,encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    c=s.count(old)
    assert c==cnt, ('COUNT',c,old[:140])
    s=s.replace(old,new)
def rd(n): return open(M+n,encoding='utf-8').read()

# ---------- 1. scroll jump: renderShell wipes #view so the page collapses to the top ----------
rep("function renderShell(){\n  const p=state.profile||{};","function renderShell(){\n  if(state._keepY==null){ state._keepY=window.scrollY||window.pageYOffset||0; setTimeout(()=>{ state._keepY=null; },0); }\n  const p=state.profile||{};")
rep("const _prevY=(typeof window!=='undefined')?(window.scrollY||window.pageYOffset||0):0;","const _prevY=(state._keepY!=null)?state._keepY:(window.scrollY||window.pageYOffset||0); state._keepY=null;")

# ---------- 2. tagline + no @ handles ----------
rep('content="Treesh 3.0. Stream the underground. Music to Live For."','content="Treesh 3.0. Welcome to the Woodz. Sing, write, make beats, design and play."',3)
rep('content="Treesh \u2014 Music to Live For"','content="Treesh \u2014 Welcome to the Woodz"',2)
rep('<div class="splash-sub">Music to Live For</div>','<div class="splash-sub">Welcome to the Woodz</div>')
rep('description:"Music to Live For. Stream the underground."','description:"Welcome to the Woodz. Sing, write, make beats, design and play."')
rep('text-[color:var(--treesh-gold)]">Music to Live For</p></div>','text-[color:var(--treesh-gold)]">Welcome to the Woodz</p></div>')
rep('">Music to <span class="shimmer">Live For</span></h1><p class="mt-2 max-w-md text-sm text-white/60">Stream the underground. ${vis(SONGS).filter(s=>!s._user).length} tracks from the Icons, ready to play.</p>','">Welcome to the <span class="shimmer">Woodz</span></h1><p class="mt-2 max-w-md text-sm text-white/60">Sing, write, make beats, design and play. ${vis(SONGS).filter(s=>!s._user).length} tracks from the Icons, ready when you are.</p>')
rep('const feats=[["radio","Stream the underground","An indie catalog of Icons, always fresh."],["mic-vocal","Sing &amp; learn","Karaoke, lyric meanings &amp; games."],["sliders-horizontal","Make beats","Produce in Instrum, your pocket studio."]];','const feats=[["mic-vocal","Sing &amp; perform","Karaoke, lyric meanings &amp; games."],["pen-line","Write &amp; design","Lyrics, lyric cards and pages you style yourself."],["sliders-horizontal","Make beats","Produce in Instrum, your pocket studio."]];')
rep('const words=["Music","to","Live"]','const words=["Welcome","to","the"]')
rep('<p class="obx-kicker">Welcome to Treesh</p>','<p class="obx-kicker">Treesh 3.0</p>')
rep('style="--d:3">For.</span>','style="--d:3">Woodz.</span>')
rep('<p class="obx-sub">Stream the underground, sing every line and make your own beats. No signup, everything stays on this device.</p>','<p class="obx-sub">Sing, write, make beats, design and play. No signup, everything stays on this device.</p>')
rep('<i data-lucide="at-sign" style="width:20px;height:20px" class="shrink-0 text-white/40"></i>','<i data-lucide="user-round" style="width:20px;height:20px" class="shrink-0 text-white/40"></i>')
rep(r'This is how you\u2019ll show up across Treesh. No @ needed.',r'This is how you\u2019ll show up across Treesh.')
rep("  const handle=(shown.toLowerCase().replace(/[^a-z0-9]+/g,'')||'treeshfan');\n","")
rep(r"""<p class="mt-0.5 text-sm text-white/50" data-testid="settings-profile-handle">@${esc(handle)}${joined?' \u00b7 Joined '+esc(joined):''}</p>""",r"""${joined?`<p class="mt-0.5 text-sm text-white/50" data-testid="settings-profile-joined">Joined ${esc(joined)}</p>`:''}""")

# ---------- 3. quick settings: out of Settings, into a Magic Markup widget ----------
rep("const hero=settingsProfileHtml(editing)+qsStripHtml();","const hero=settingsProfileHtml(editing);")
a=s.index('function mkWQuick(){'); b=s.index('\nfunction mkWGame(){',a)
s=s[:a]+"""function mkWQuick(){ return qsStripHtml().replace('<section class="qs-card" data-testid="quick-settings">','<section class="qs-card h-full" data-mk-widget="quick" data-testid="mk-widget-quick">'); }"""+s[b:]
rep("quick:{label:'Quick Settings',ic:'sliders-horizontal',from:'Settings'}","quick:{label:'Quick Settings',ic:'zap',from:'Settings',w:'full'}")
rep("map[w.id]={id:w.id,kind:'widget',type:w.type,w:'half',html:mkWidgetHtml(w.type)};","map[w.id]={id:w.id,kind:'widget',type:w.type,w:MK_WIDGETS[w.type].w||'half',html:mkWidgetHtml(w.type,w)};")
rep("""    _sGo('go-quick','Quick settings','Mode, accent, performance, EQ and sleep in one place','quick settings shortcuts fast common favorite','zap','appearance','[data-testid="quick-settings"]'),""","""    {id:'go-quick',label:'Quick Settings widget',desc:'Add mode, accent, EQ, sleep and glass controls to any page',kw:'quick settings shortcuts fast common favorite widget',ic:'zap',type:'action',go:()=>{ closeSearch(); setTimeout(()=>{ mkStart(); state.mkSheet='add'; mkRenderSheet(); },220); }},""")

# ---------- 4. menus, popups, dropdowns ----------
rep("""function modalWrap(inner, testid, size){ const mw=size==="studio"?"max-w-5xl st-modal":size==="lg"?"max-w-lg":size==="xl"?"max-w-xl":size==="4xl"?"max-w-4xl":"max-w-md"; return `<div data-act="modal-backdrop" class="fixed inset-0 z-[210] grid place-items-center bg-black/60 p-4 backdrop-blur-sm backdrop-in"${testid?` data-testid="${testid}"`:""}><div data-act="modal-stop" class="gl-modal glass-strong panel-in relative w-full min-w-0 ${mw} rounded-2xl border-white/15 p-5 text-white">${inner}</div></div>`; }""",
"""function modalWrap(inner, testid, size){ const mw=size==="studio"?"max-w-5xl st-modal":size==="lg"?"max-w-lg":size==="xl"?"max-w-xl":size==="4xl"?"max-w-4xl":size==="sm"?"max-w-sm":"max-w-md"; return `<div data-act="modal-backdrop" class="pm-bd fixed inset-0 z-[210] grid place-items-center p-4 backdrop-in"${testid?` data-testid="${testid}"`:""}><div data-act="modal-stop" class="gl-modal glass-strong pm-panel panel-in relative w-full min-w-0 ${mw} rounded-2xl border-white/15 p-5 text-white"><span class="pm-grab" aria-hidden="true" data-testid="sheet-grab"></span>${inner}</div></div>`; }""")
rep("""return `<div data-act="modal2-backdrop" class="fixed inset-0 z-[240] grid place-items-center bg-black/70 p-4 backdrop-blur-md backdrop-in"${testid?` data-testid="${testid}"`:""}><div data-act="modal2-stop" class="gl-modal glass-strong panel-in relative max-h-[calc(100dvh-2rem)] w-full ${mw} overflow-y-auto overflow-x-hidden overscroll-contain soft-scroll rounded-2xl border-white/15 p-5 text-white">${inner}</div></div>`; }""",
"""return `<div data-act="modal2-backdrop" class="pm-bd fixed inset-0 z-[240] grid place-items-center p-4 backdrop-in"${testid?` data-testid="${testid}"`:""}><div data-act="modal2-stop" class="gl-modal glass-strong pm-panel panel-in relative max-h-[calc(100dvh-2rem)] w-full ${mw} overflow-y-auto overflow-x-hidden overscroll-contain soft-scroll rounded-2xl border-white/15 p-5 text-white"><span class="pm-grab" aria-hidden="true"></span>${inner}</div></div>`; }""")
rep("""data-testid="backdrops-modal" class="fixed inset-0 z-[210] grid place-items-center bg-black/60 p-2 backdrop-blur-sm backdrop-in sm:p-4"><div data-act="modal-stop" class="gl-modal st-modal glass-strong panel-in""","""data-testid="backdrops-modal" class="pm-bd fixed inset-0 z-[210] grid place-items-center p-2 backdrop-in sm:p-4"><div data-act="modal-stop" class="gl-modal st-modal glass-strong pm-panel panel-in""")
rep('">${head}${body}</div></div>`;','"><span class="pm-grab" aria-hidden="true"></span>${head}${body}</div></div>`;')
rep("""data-testid="cover-studio" class="fixed inset-0 z-[240] flex items-center justify-center bg-black/70 p-2 backdrop-blur-md backdrop-in sm:p-4"><div data-act="modal2-stop" class="gl-modal st-modal glass-strong panel-in""","""data-testid="cover-studio" class="pm-bd fixed inset-0 z-[240] flex items-center justify-center p-2 backdrop-in sm:p-4"><div data-act="modal2-stop" class="gl-modal st-modal glass-strong pm-panel panel-in""")
rep('sm:max-h-[calc(100dvh-2rem)]">${header}<div class="st-scroll','sm:max-h-[calc(100dvh-2rem)]"><span class="pm-grab" aria-hidden="true"></span>${header}<div class="st-scroll')

a=s.index('function openSongMenu(id){'); b=s.index('function openPrompt(title, value, onOk){',a)
s=s[:a]+rd('p6_songmenu.js')+s[b:]
a=s.index('function openPrompt(title, value, onOk){'); b=s.index('\n',a)
s=s[:a]+r"""function openPrompt(title, value, onOk){ state._promptCb=onOk; const inner=`${pmHead('pencil-line','Edit',esc(title),'prompt-close')}<input id="prompt-input" data-testid="prompt-input" value="${esc(value||'')}" autocomplete="off" class="st-input pm-input-lg"><div class="pm-actions"><button type="button" data-act="modal-close" data-testid="prompt-cancel" class="st-btn lg">Cancel</button><button type="button" data-act="prompt-ok" data-testid="prompt-ok" class="st-btn lg primary">Save</button></div>`; $("#modal").innerHTML=modalWrap(inner,"prompt-dialog","sm"); icons(); const inp=$("#prompt-input"); inp.focus(); inp.select(); inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ const v=inp.value.trim(); if(v){ onOk(v); closeModal(); } } }); }"""+s[b:]
a=s.index('function openConfirm(title, desc, onOk){'); b=s.index('\n',a)
s=s[:a]+r"""function openConfirm(title, desc, onOk){ state._confirmCb=onOk; const inner=`<div class="pm-alert"><span class="pm-alert-ic"><i data-lucide="triangle-alert"></i></span><h3 class="pm-title" data-testid="confirm-title">${esc(title)}</h3><p class="pm-desc">${esc(desc)}</p></div><div class="pm-actions"><button type="button" data-act="modal-close" data-testid="confirm-cancel" class="st-btn lg">Cancel</button><button type="button" data-act="confirm-ok" data-testid="confirm-ok" class="st-btn lg danger-solid">Confirm</button></div>`; $("#modal").innerHTML=modalWrap(inner,"confirm-dialog","sm"); icons(); }"""+s[b:]
a=s.index('function openPerfMenu(name,id){'); mk='$("#modal").innerHTML=modalWrap(inner,"performer-menu"); icons();\n}\n'; b=s.index(mk,a)+len(mk)
s=s[:a]+rd('p6_perf.js')+s[b:]

# lyric line + lyric tools popovers
rep("""class="press flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/85 hover:bg-white/10 ${extra||''}"><i data-lucide="${ic}" style="width:16px;height:16px"></i>${label}</button>`;""","""class="pm-item sm press${extra?' on':''}"><span class="pm-item-ic"><i data-lucide="${ic}"></i></span><span class="pm-item-t"><span class="pm-item-l">${label}</span></span></button>`;""")
rep("""pop.className="dark-surface fixed z-[220] min-w-[200px] rounded-2xl border border-white/12 bg-[#141418]/95 p-1.5 shadow-[var(--treesh-shadow)] backdrop-blur-xl lyric-pop-in";""","""pop.className="pm-pop pm-sheetable dark-surface fixed z-[220] min-w-[230px]";""")
rep("""${item('pop-card','wand-sparkles','Make lyric card')}<div class="my-1 h-px bg-white/10"></div>${item('pop-select'""","""${item('pop-card','wand-sparkles','Make lyric card')}<div class="pm-sep"></div>${item('pop-select'""")
rep("""class="press flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/85 hover:bg-white/10"><i data-lucide="${ic}" style="width:16px;height:16px"></i><span class="flex-1">${label}</span>${extra||''}</button>`;""","""class="pm-item sm press"><span class="pm-item-ic"><i data-lucide="${ic}"></i></span><span class="pm-item-t"><span class="pm-item-l">${label}</span></span>${extra||''}</button>`;""")
rep("""html+=`<div class="my-1 h-px bg-white/10"></div>`;""","""html+=`<div class="pm-sep"></div>`;""")
rep("""pop.className="dark-surface fixed z-[220] min-w-[220px] rounded-2xl border border-white/12 bg-[#141418]/95 p-1.5 shadow-[var(--treesh-shadow)] backdrop-blur-xl lyric-pop-in";""","""pop.className="pm-pop pm-sheetable dark-surface fixed z-[220] min-w-[250px]";""")

# instrum file menu
rep("""class="press flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.06] ${extra||''}"><span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/8 text-white/70"><i data-lucide="${ic}" style="width:15px;height:15px"></i></span><span class="min-w-0"><span class="block text-sm font-semibold text-white">${title}</span>${desc?`<span class="block text-[11px] text-white/45">${desc}</span>`:''}</span></button>`;""","""class="pm-item sm press ${extra||''}"><span class="pm-item-ic"><i data-lucide="${ic}"></i></span><span class="pm-item-t"><span class="pm-item-l">${title}</span>${desc?`<span class="pm-item-d">${desc}</span>`:''}</span></button>`;""")
rep("""class="imenu-surface fixed z-[240] w-60 overflow-hidden rounded-2xl border border-white/12 py-1 shadow-[var(--treesh-shadow)] backdrop-blur-2xl tr-fade-in" data-testid="instrum-file-dropdown">""","""class="pm-pop pm-sheetable dark-surface fixed z-[240] w-64" data-testid="instrum-file-dropdown">""")
rep('<div class="my-1 h-px bg-white/8"></div>','<div class="pm-sep"></div>',2)

# toast
rep("""el.className="gl-toast glass-strong flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-white shadow-[var(--treesh-shadow)] toast-in"; const ic=opts.star?'<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--treesh-gold)]/20 text-[color:var(--treesh-gold)]"><i data-lucide="sparkles" style="width:15px;height:15px"></i></span>':'';""","""el.className="pm-toast"+(sub?" has-sub":"")+" toast-in"; el.setAttribute("data-testid","toast"); const ic=opts.star?'<span class="pm-toast-dot is-star"><i data-lucide="sparkles" style="width:15px;height:15px"></i></span>':'<span class="pm-toast-dot"></span>';""")

# custom dropdowns hook into every icon pass
rep("const icons = () => { try { if (window.lucide) lucide.createIcons(); } catch(e){} };","const icons = () => { try { if (window.lucide) lucide.createIcons(); } catch(e){} try { if (typeof pmEnhance==='function') pmEnhance(); } catch(e){} };")

# kit JS + CSS
rep("/* ---------- boot hook (called from init) ---------- */",rd('p6_menus.js')+"\n/* ---------- boot hook (called from init) ---------- */")
rep("</style>\n</head>", rd('p6_menus.css')+"</style>\n</head>")
open(P,'w',encoding='utf-8').write(s); print('ok')
