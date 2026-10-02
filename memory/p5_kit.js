/* ---------- glass themes ---------- */
const GL_THEMES=[
  {id:'bubble',name:'Bubble Glass',desc:'Frosted floating bubbles',accent:'#9328ff',sw:['#9328ff','#22d3ee','#120f1c']},
  {id:'aurora',name:'Aurora',desc:'Northern lights & mint glass',accent:'#2dd4bf',sw:['#34d399','#8b5cf6','#06161c']},
  {id:'candy',name:'Candy Pop',desc:'Sweet, round & extra bubbly',accent:'#ff4fa3',sw:['#ff6fb5','#ffb347','#2a0c24']},
  {id:'neon',name:'Neon Tokyo',desc:'Midnight glass, neon rims',accent:'#ff2d78',sw:['#ff2d78','#22d3ee','#08061a']},
  {id:'frost',name:'Frostbite',desc:'Icy, milky & crystal clear',accent:'#60a5fa',sw:['#93c5fd','#e0f2fe','#0f1a2a']},
  {id:'sunset',name:'Sunset Lagoon',desc:'Warm coral over deep water',accent:'#fb7185',sw:['#fb923c','#0ea5e9','#22101a']},
  {id:'gold',name:'Midnight Gold',desc:'Smoked glass, golden edges',accent:'#d4af37',sw:['#d4af37','#6b5b2e','#0a0a0c']},
  {id:'classic',name:'Classic',desc:'The original Treesh look',accent:null,sw:['#9328ff','#3a0d6b','#121212']}
];
const GL_STRENGTHS=[['light','Light'],['medium','Medium'],['strong','Strong'],['solid','Solid']];
function glTheme(){ const t=LS.get('treesh_gl_theme','bubble'); return GL_THEMES.some(x=>x.id===t)?t:'bubble'; }
function glStrength(){ const s=LS.get('treesh_gl_strength','medium'); return GL_STRENGTHS.some(x=>x[0]===s)?s:'medium'; }
function glOrbsOn(){ return LS.get('treesh_gl_orbs',true)!==false; }
function glApply(){ const c=document.documentElement.classList, t=glTheme(), s=glStrength();
  GL_THEMES.forEach(x=>c.toggle('glt-'+x.id,x.id===t)); GL_STRENGTHS.forEach(x=>c.toggle('gls-'+x[0],x[0]===s));
  c.toggle('gl-on',t!=='classic'); c.toggle('gl-orbs-on',t!=='classic'&&glOrbsOn());
  if(document.body&&!document.getElementById('gl-orbs')){ const d=document.createElement('div'); d.id='gl-orbs'; d.setAttribute('aria-hidden','true'); d.innerHTML='<span></span><span></span><span></span>'; document.body.insertBefore(d,document.body.firstChild); } }
function glRefresh(){ glApply(); renderShell(); renderView(); try{ renderMini(); }catch(e){} }
function glSetTheme(id){ const t=GL_THEMES.find(x=>x.id===id); if(!t) return; LS.set('treesh_gl_theme',id); if(t.accent){ state.accent=t.accent; LS.set('treesh_accent',t.accent); applyAccent(t.accent); } glRefresh(); toast(t.name+' theme on', t.accent?'Accent matched. Pick any accent you like':'Back to the original look'); }
function glThemesHtml(tab){ const cur=glTheme(), s=glStrength(), off=cur==='classic'?'pointer-events-none opacity-40':'';
  const cards=GL_THEMES.map(t=>{ const on=cur===t.id; return `<button data-act="mk-gl-theme" data-val="${t.id}" data-testid="glass-theme-${t.id}" aria-pressed="${on}" class="gl-tcard press${on?' on':''}" style="--a:${t.sw[0]};--b:${t.sw[1]};--c:${t.sw[2]};--r:${t.id==='neon'||t.id==='gold'?'7px':t.id==='candy'?'18px':'12px'}"><span class="gl-tprev"><span class="o1"></span><span class="o2"></span><span class="pc"></span><span class="pd"></span><span class="pp"></span></span><span class="gl-tname">${t.name}</span><span class="gl-tdesc">${t.desc}</span>${on?'<span class="gl-tcheck"><i data-lucide="check"></i></span>':''}</button>`; }).join('');
  return `<section data-testid="settings-glass" class="${tab==='appearance'?'':'hidden'} rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
   <div class="mb-1 flex items-center gap-2.5"><span class="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><i data-lucide="gem" style="width:18px;height:18px"></i></span><h2 class="text-lg font-bold">Glass themes</h2></div>
   <p class="mb-4 pl-11 text-sm text-white/50">Give Treesh a whole new mood. Each theme brings its own glass, glow and accent.</p>
   <div class="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="glass-theme-grid">${cards}</div>
   <div class="mt-5 ${off}"><p class="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Glass strength</p>${pseg('mk-gl-strength',s,GL_STRENGTHS)}<p class="mt-2 text-[11px] text-white/40">Light keeps it clear, Strong goes milky and heavy, Solid switches blur off.</p></div>
   <div class="mt-4 ${off}">${toggleCard('mk-gl-orbs','glass-orbs-toggle',glOrbsOn(),'orbit','Ambient light orbs','Soft colored light drifting behind the glass')}</div>
  </section>`; }

/* ---------- Settings: 5 groups + quick settings strip ---------- */
const SET_TABS=[["appearance","Appearance","palette"],["audio","Audio & Playback","audio-lines"],["voice","Voice & Controls","mic"],["account","Account & Data","shield-check"],["system","System & About","settings-2"]];
const SET_TAB_ALIAS={display:'appearance',personalize:'appearance',layout:'appearance',motion:'appearance',access:'system',sleep:'system',about:'system',lyrics:'audio',privacy:'account'};
function setTabNorm(t){ t=SET_TAB_ALIAS[t]||t; return SET_TABS.some(x=>x[0]===t)?t:'appearance'; }
const QS_ACC=['#9328ff','#3b82f6','#22d3ee','#34d399','#f59e0b','#ff2d78'];
function qsEq(v){ if(!state.eq) return; if(v==='off'){ state.eq.enabled=false; try{ eqApply(); }catch(e){} saveEq(); toast('Equalizer off'); }
  else { state.eq.enabled=true; try{ eqEnsure(); eqApplyPreset(v); }catch(e){ saveEq(); } toast('Equalizer: '+(((EQ_PRESETS.find(p=>p.id===v)||{}).name)||v)); }
  renderView(); }
function qsStripHtml(){ const light=state.theme==='light', acc=(state.accent||'#9328ff').toLowerCase(), eq=state.eq||{}, eqP=eq.enabled?(eq.preset||'custom'):'off', sl=state.sleepMin||0, th=glTheme(), custom=!QS_ACC.includes(acc);
  const seg=(act,cur,opts,tid)=>`<div class="qs-seg" data-testid="${tid}">${opts.map(([v,l,ic])=>{ const on=String(cur)===String(v); return `<button data-act="${act}" data-val="${v}" data-testid="${tid}-${v}" aria-pressed="${on}" class="press${on?' on':''}">${ic?`<i data-lucide="${ic}"></i>`:''}${l}</button>`; }).join('')}</div>`;
  const eqOpts=[['off','Off'],['bass','Bass'],['pop','Pop'],['vocal','Vocal'],['acoustic','Acoustic']]; if(eq.enabled&&!eqOpts.some(o=>o[0]===eqP)) eqOpts.push([eqP,((EQ_PRESETS.find(p=>p.id===eqP)||{}).name)||'Custom']);
  return `<section class="qs-card" data-testid="quick-settings">
   <div class="qs-head"><span class="qs-bolt"><i data-lucide="zap"></i></span><div class="min-w-0 flex-1"><p class="qs-kicker">Quick settings</p><h2 class="text-base font-bold leading-tight">The things you change most</h2></div><button data-act="open-eq" data-testid="quick-open-eq" class="press inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/10"><i data-lucide="sliders-vertical" style="width:13px;height:13px"></i><span class="hidden sm:inline">Full equalizer</span><span class="sm:hidden">EQ</span></button></div>
   <div class="qs-grid">
    <div class="qs-cell"><p class="qs-lbl">Mode</p>${seg('set-theme',light?'light':'dark',[['dark','Dark','moon'],['light','Light','sun']],'quick-mode')}</div>
    <div class="qs-cell"><p class="qs-lbl">Performance</p><button data-act="perf-mode-toggle" data-testid="quick-perf-toggle" role="switch" aria-checked="${!!state.perfMode}" class="qs-switch press${state.perfMode?' on':''}"><span class="qs-switch-ic"><i data-lucide="gauge"></i></span><span class="min-w-0 flex-1 text-left text-sm font-semibold">${state.perfMode?'On':'Off'}</span><span class="qs-knob"></span></button></div>
    <div class="qs-cell qs-wide"><p class="qs-lbl">Accent</p><div class="flex flex-wrap items-center gap-2">${QS_ACC.map(h=>`<button data-act="accent" data-hex="${h}" data-testid="quick-accent-${h.slice(1)}" aria-label="Accent ${h}" class="qs-dot${acc===h?' on':''}" style="background:${h}"></button>`).join('')}<label class="qs-dot qs-dot-custom${custom?' on':''}" title="Custom accent" style="${custom?`background:${acc}`:''}"><input type="color" id="qs-accent-color" value="${acc}" data-testid="quick-accent-custom" aria-label="Custom accent"></label></div></div>
    <div class="qs-cell qs-wide"><p class="qs-lbl">Equalizer</p>${seg('mk-qs-eq',eqP,eqOpts,'quick-eq')}</div>
    <div class="qs-cell qs-wide"><p class="qs-lbl">Sleep timer</p>${seg('set-sleep',sl,[[0,'Off'],[15,'15m'],[30,'30m'],[60,'1h']],'quick-sleep')}</div>
    <div class="qs-cell qs-full"><p class="qs-lbl">Glass theme</p><div class="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">${GL_THEMES.map(t=>`<button data-act="mk-gl-theme" data-val="${t.id}" data-testid="quick-glass-${t.id}" aria-pressed="${th===t.id}" class="qs-th press${th===t.id?' on':''}" style="--a:${t.sw[0]};--b:${t.sw[1]};--c:${t.sw[2]}"><span></span>${t.name}</button>`).join('')}</div></div>
   </div></section>`; }

/* ---------- studio kit (Lyric Card, Backdrops, Image Studio) ---------- */
function stCard(ic,title,sub,body,right,tid){ return `<section class="st-card"${tid?` data-testid="${tid}"`:''}><div class="st-card-h"><span class="st-ic"><i data-lucide="${ic}"></i></span><div class="min-w-0"><p class="st-card-t">${title}</p>${sub?`<p class="st-card-s">${sub}</p>`:''}</div>${right?`<div class="st-card-r">${right}</div>`:''}</div>${body}</section>`; }
function stRange(o){ const fill=(o.max>o.min)?((o.val-o.min)/(o.max-o.min)*100):0; return `<div class="st-slider"><span class="st-slider-l">${o.ic?`<i data-lucide="${o.ic}"></i>`:''}${o.label}</span><input type="range"${o.id?` id="${o.id}"`:''} min="${o.min}" max="${o.max}" step="${o.step||1}" value="${o.val}" ${o.attrs||''}${o.tid?` data-testid="${o.tid}"`:''} aria-label="${o.label}" class="tr" style="--fill:${fill}%"><span${o.vid?` id="${o.vid}"`:''} class="st-val" ${o.vattrs||''}>${o.txt}</span></div>`; }
function stToggle(act,tid,on,ic,title,sub,attrs){ return `<button data-act="${act}" data-testid="${tid}" role="switch" aria-checked="${!!on}" aria-pressed="${!!on}" ${attrs||''} class="st-toggle press"><span class="st-ic"><i data-lucide="${ic}"></i></span><span class="min-w-0 flex-1"><span class="st-card-t block">${title}</span>${sub?`<span class="st-card-s block">${sub}</span>`:''}</span><span class="st-switch${on?' on':''}"></span></button>`; }
