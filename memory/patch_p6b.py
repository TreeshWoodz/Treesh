P='/app/single_html/index.html'; M='/app/memory/'
s=open(P,encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    c=s.count(old)
    assert c==cnt, ('COUNT',c,old[:140])
    s=s.replace(old,new)

# ---------- welcome: persistent shell + direction-aware swaps ----------
rep("No. ${String((Date.now()%9000)+1000)}","No. ${String(onboard.no||(onboard.no=(Date.now()%9000)+1000))}")
rep("""data-testid="onboarding" class="obx dark-surface fixed inset-0 z-[120] flex flex-col overflow-hidden bg-[#07060b] ${existed?'':'np-entering'}">""","""data-testid="onboarding" data-step="${onboard.step}" style="--ob-k:${onboard.step}" class="obx dark-surface fixed inset-0 z-[120] flex flex-col overflow-hidden bg-[#07060b] np-entering">""")
rep("""<div class="${existed?'obx-swap':''}">${content}</div>""","""<div class="obx-stage">${content}</div>""")
rep("""<div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 ${intro?'sm:justify-center':''}">""","""<div class="obx-foot mx-auto flex w-full max-w-5xl items-center justify-between gap-3 ${intro?'sm:justify-center':''}">""")
a=s.index('function renderOnboarding(){'); t0=s.index('  $("#modal").innerHTML=shell; icons();\n',a); w0=t0+len('  $("#modal").innerHTML=shell; icons();\n'); t1=s.index('  syncScrollLock();\n}\n',w0)
wire=s[w0:t1]
s=s[:t0]+"  obMount(shell);\n}\n"+"""let _obSwap=null;
function obFinishSwap(){ const p=_obSwap; if(!p) return; _obSwap=null; clearTimeout(p.t); if(p.oldEl.isConnected) p.oldEl.replaceWith(p.newEl); p.newEl.classList.add('obx-enter'); icons(); obWire(); }
function obMount(shell){ obFinishSwap(); const root=document.querySelector('#modal [data-ob-shell]');
  if(!root){ $("#modal").innerHTML=shell; icons(); obWire(); syncScrollLock(); return; }
  const tmp=document.createElement('div'); tmp.innerHTML=shell; const nw=tmp.firstElementChild;
  const prev=+root.dataset.step, step=onboard.step, dir=step>=prev?1:-1;
  root.dataset.step=String(step); root.style.setProperty('--ob-k',step);
  const swap=sel=>{ const x=root.querySelector(sel), y=nw.querySelector(sel); if(x&&y) x.replaceWith(y); return y; };
  swap('[data-testid="onboarding-progress"]'); const foot=swap('.obx-foot');
  const oldStage=root.querySelector('.obx-stage'), newStage=nw.querySelector('.obx-stage');
  if(!oldStage||!newStage){ $("#modal").innerHTML=shell; icons(); obWire(); return; }
  if(prev===step){ newStage.classList.add('obx-still'); oldStage.replaceWith(newStage); icons(); obWire(); return; }
  if(foot) foot.classList.add('obx-foot-in');
  const op=oldStage.querySelector('.obx-step-pass'), np=newStage.querySelector('.obx-step-pass');
  let oldEl=oldStage, newEl=newStage;
  if(op&&np){ op.classList.add('obx-keep'); op.innerHTML=np.innerHTML; oldEl=oldStage.querySelector('.obx-step'); newEl=newStage.querySelector('.obx-step'); }
  else if(np) np.classList.add('obx-pass-enter');
  if(oldEl===oldStage&&oldStage.querySelector('.obx-intro')) oldEl.classList.add('obx-zoom');
  oldEl.style.setProperty('--dir',dir); newEl.style.setProperty('--dir',dir); oldEl.classList.add('obx-leave');
  const sc=root.querySelector('[data-ob-root]');
  _obSwap={oldEl,newEl,t:setTimeout(()=>{ obFinishSwap(); if(sc) sc.scrollTop=0; },220)};
  icons(); }
function obWire(){
"""+wire+"}\n"+s[t1+len('  syncScrollLock();\n}\n'):]

# ---------- draggable Magic Markup wand ----------
rep("""title="${edit?'Done editing':'Magic Markup'}" class="mk-fab-btn press${edit?' is-on':''}"><i data-lucide="${edit?'check':'wand-sparkles'}" style="width:22px;height:22px"></i></button>`:'';""","""title="${edit?'Done editing':'Magic Markup \u00b7 drag to move'}" class="mk-fab-btn press${edit?' is-on':''}"><i data-lucide="${edit?'check':'wand-sparkles'}" style="width:22px;height:22px"></i></button>`:''; mkFabPlace();""")
rep("""mkSwitch('mk-fab-toggle','','mk-fab-toggle-sheet',m.fab!==false,'wand-sparkles','Floating wand button','If hidden, open Magic Markup from Settings \\u2192 Layout')}</div>""","""mkSwitch('mk-fab-toggle','','mk-fab-toggle-sheet',m.fab!==false,'wand-sparkles','Floating wand button','Drag it anywhere. If hidden, open Magic Markup from Settings')}${m.fabPos?'<button type="button" data-act="mk-fab-reset" data-testid="mk-fab-reset" class="mk-btn mt-2 w-full"><i data-lucide="locate-fixed"></i>Put the wand back in the corner</button>':''}</div>""")
rep("""'Floating wand button','Keep the Magic Markup button on screen')}""","""'Floating wand button','Keep the Magic Markup button on screen. Drag it anywhere')}""")
rep("""    case 'mk-xf-toggle': xfToggle(); renderView(); break;""","""    case 'mk-xf-toggle': xfToggle(); renderView(); break;
    case 'mk-fab-reset': delete mkS().fabPos; mkSave(); mkFabPlace(); mkRenderSheet(); toast('Wand moved back'); break;""")
rep("/* ---------- boot hook (called from init) ---------- */","""function mkFabPlace(){ const f=document.getElementById('mk-fab'); if(!f) return; const p=mkS().fabPos; if(!p){ f.classList.remove('is-placed'); f.style.left=''; f.style.top=''; return; } const W=window.innerWidth, H=window.innerHeight, z=52, g=8; f.classList.add('is-placed'); f.style.left=Math.round(g+p.x*Math.max(0,W-z-2*g))+'px'; f.style.top=Math.round(g+p.y*Math.max(0,H-z-2*g))+'px'; }
document.addEventListener('pointerdown',e=>{ const b=e.target&&e.target.closest&&e.target.closest('#mk-fab .mk-fab-btn'); if(!b||(e.button&&e.button>0)) return; const f=document.getElementById('mk-fab'); const r=f.getBoundingClientRect(); const ox=e.clientX-r.left, oy=e.clientY-r.top, sx=e.clientX, sy=e.clientY; let drag=false;
  const mv=ev=>{ if(!drag&&Math.hypot(ev.clientX-sx,ev.clientY-sy)>6){ drag=true; f.classList.add('is-dragging','is-placed'); } if(!drag) return; ev.preventDefault(); const x=Math.max(8,Math.min(innerWidth-60,ev.clientX-ox)), y=Math.max(8,Math.min(innerHeight-60,ev.clientY-oy)); f.style.left=x+'px'; f.style.top=y+'px'; };
  const up=()=>{ document.removeEventListener('pointermove',mv); document.removeEventListener('pointerup',up); document.removeEventListener('pointercancel',up); if(!drag) return; f.classList.remove('is-dragging'); const z=52, g=8; const x=parseFloat(f.style.left)||0, y=parseFloat(f.style.top)||0; mkS().fabPos={x:Math.max(0,Math.min(1,(x-g)/Math.max(1,innerWidth-z-2*g))), y:Math.max(0,Math.min(1,(y-g)/Math.max(1,innerHeight-z-2*g)))}; mkSave(); const sw=ce=>{ ce.stopPropagation(); ce.preventDefault(); window.removeEventListener('click',sw,true); }; window.addEventListener('click',sw,true); setTimeout(()=>window.removeEventListener('click',sw,true),400); };
  document.addEventListener('pointermove',mv,{passive:false}); document.addEventListener('pointerup',up); document.addEventListener('pointercancel',up); },true);
window.addEventListener('resize',()=>mkFabPlace());

/* ---------- boot hook (called from init) ---------- */""")

# ---------- play counts: off the song cards, into song info ----------
rep("""<i data-lucide="flame" style="width:11px;height:11px"></i>${playCount(s.id)}</span>""","""<i data-lucide="flame" style="width:11px;height:11px"></i></span>""",2)
a=s.index('function openMetadata(songId){'); x0=s.index('  const inner=`<div class="mb-2 flex items-center justify-between gap-3">',a); x1=s.index('    <div class="mt-1 max-h-[68vh] overflow-y-auto no-scrollbar pr-1">',x0)
s=s[:x0]+r"""  const pc=playCount(s.id);
  const inner=`${pmSongHead(s)}
    <div class="pm-stats" data-testid="metadata-stats"><div class="pm-stat" data-testid="metadata-plays"><b>${fmtNum(pc)}</b><span>Play${pc!==1?'s':''}</span></div><div class="pm-stat" data-testid="metadata-length"><b>${esc(dur||'\u2013')}</b><span>Length</span></div><div class="pm-stat" data-testid="metadata-liked"><b>${isFav(s.id)?'Yes':'No'}</b><span>Liked</span></div></div>
"""+s[x1:]

# ---------- what's new ----------
a=s.index('function wnOpen(id){'); x0=s.index('  const rows=(w.items||[]).map(',a); mk='$("#modal").innerHTML=modalWrap(inner,"whats-new-modal","lg"); icons();'; x1=s.index(mk,x0)
s=s[:x0]+r"""  const rows=(w.items||[]).map(it=>`<div class="wn-row"><span class="wn-row-ic"><i data-lucide="${it.icon}"></i></span><div class="min-w-0"><p class="text-[15px] font-bold leading-snug">${esc(it.title)}</p><p class="mt-0.5 text-sm leading-relaxed text-white/60">${esc(it.desc)}</p></div></div>`).join("");
  const inner=`<div class="wn-hero"><span class="wn-ic"><i data-lucide="sparkles"></i></span>
     <p class="st-eyebrow mt-4">What's new${w.date?` \u00b7 ${esc(w.date)}`:''}</p>
     <h3 class="pm-title mt-1 text-2xl">${esc(w.title)}</h3>
     ${w.sub?`<p class="pm-desc mt-1">${esc(w.sub)}</p>`:''}</div>
   <div class="mt-5 max-h-[46vh] space-y-2 overflow-y-auto no-scrollbar pr-1">${rows}</div>
   <div class="pm-actions"><button type="button" data-act="wn-ack" data-testid="wn-ack" class="st-btn lg primary">Got it</button></div>
   <button type="button" data-act="wn-disable" data-testid="wn-disable" class="press mx-auto mt-2 block rounded-full px-3 py-1.5 text-xs font-semibold text-white/40 hover:text-white/70">Turn off update notes</button>`;
  """+s[x1:]

# ---------- now playing control dock ----------
rep("""<div class="mx-auto w-full max-w-3xl shrink-0 pt-2">${controls}</div>""","""<div class="np-dock mx-auto w-full max-w-3xl shrink-0" data-testid="np-dock">${controls}</div>""")

rep("</style>\n</head>", open(M+'p6b.css',encoding='utf-8').read()+"  .obx-keep .obx-pass{ animation:none !important; }\n</style>\n</head>")
open(P,'w',encoding='utf-8').write(s); print('ok')
