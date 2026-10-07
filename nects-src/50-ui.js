/* ===== UI helpers ===== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>{ n=Math.round(n||0); return n>=100000?(n/1000).toFixed(0)+'k':n.toLocaleString('en-US'); };
const ic=(name,size=18,cls='')=>`<i data-lucide="${name}" class="${cls}" style="width:${size}px;height:${size}px"></i>`;
function icons(){ try{ window.lucide&&lucide.createIcons(); }catch(e){} }
function fmtDur(ms){ const s=Math.round((ms||0)/1000); const h=Math.floor(s/3600), m=Math.floor(s%3600/60); return h?`${h}h ${m}m`:m?`${m}m`:`${s}s`; }
function ago(t){ const d=(Date.now()-t)/1000; if(d<60) return 'just now'; if(d<3600) return Math.floor(d/60)+'m ago'; if(d<86400) return Math.floor(d/3600)+'h ago'; return Math.floor(d/86400)+'d ago'; }

/* Sound + haptics */
const Sound={ ctx:null,
  tone(f,d=.12,type='sine',vol=.07,delay=0){ if(!S.settings.sound) return; try{ this.ctx=this.ctx||new (window.AudioContext||window.webkitAudioContext)(); const c=this.ctx, t=c.currentTime+delay, o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(g).connect(c.destination); o.start(t); o.stop(t+d+.02); }catch(e){} },
  call(){ this.tone(520,.07,'triangle',.05); },
  claim(){ this.tone(880,.08,'sine',.07); this.tone(1320,.09,'sine',.05,.06); },
  opp(){ this.tone(300,.1,'triangle',.05); },
  wrong(){ this.tone(170,.16,'sawtooth',.035); },
  coin(){ this.tone(1180,.06,'square',.03); this.tone(1580,.1,'square',.03,.06); },
  win(){ [523,659,784,1046].forEach((f,i)=>this.tone(f,.2,'triangle',.06,i*.09)); },
  lose(){ [392,330,262].forEach((f,i)=>this.tone(f,.22,'triangle',.05,i*.12)); },
  event(){ [660,880,660].forEach((f,i)=>this.tone(f,.08,'square',.025,i*.07)); }
};
function buzz(ms=10){ if(S.settings.haptics&&navigator.vibrate) try{ navigator.vibrate(ms); }catch(e){} }

/* Toasts */
function toast(title,sub,kind='info'){
  const box=$('#toasts'); const el=document.createElement('div');
  const icn=kind==='star'?'sparkles':kind==='warn'?'alert-triangle':kind==='badge'?'award':'info';
  el.className='toast '+(kind==='badge'?'star':kind); el.setAttribute('data-testid','toast');
  el.innerHTML=`<span class="ti">${ic(icn,16)}</span><span><b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span>`;
  box.appendChild(el); icons();
  while(box.children.length>3) box.firstChild.remove();
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),300); },2600);
}

/* Modal system */
let modalOnClose=null;
function openModal(html,{wide=false,sheet=true,testid='modal',onClose=null,lock=false}={}){
  const root=$('#modal-root');
  root.innerHTML=`<div class="backdrop ${sheet?'sheet-mode':''}" data-backdrop="${lock?'lock':'1'}" data-testid="${testid}-backdrop"><div class="modal soft-scroll ${wide?'wide':''}" role="dialog" data-testid="${testid}">${html}</div></div>`;
  modalOnClose=onClose; icons();
}
function closeModal(){
  const b=$('#modal-root .backdrop'); if(!b) return;
  const cb=modalOnClose; modalOnClose=null;
  b.classList.add('closing'); setTimeout(()=>{ if(b.parentNode) b.remove(); },190);
  if(cb) cb();
}
function modalOpen(){ return !!$('#modal-root .backdrop:not(.closing)'); }
function confirmBox(title,text,okLabel,onOk,danger){
  openModal(`<h2>${esc(title)}</h2><p class="text2" style="margin-top:10px;font-size:14px;line-height:1.5">${esc(text)}</p>
    <div style="display:flex;gap:10px;margin-top:22px;justify-content:flex-end"><button class="btn btn-ghost" data-act="close-modal" data-testid="confirm-cancel">Cancel</button><button class="btn ${danger?'btn-danger':'btn-primary'}" id="confirm-ok" data-testid="confirm-ok">${esc(okLabel)}</button></div>`,{testid:'confirm-modal'});
  $('#confirm-ok').onclick=()=>{ closeModal(); onOk(); };
}

/* Theme */
function applyTheme(){
  const acc=Treesh.accent(); const r=document.documentElement.style;
  r.setProperty('--accent',acc); r.setProperty('--accent-rgb',hexRgb(acc));
  const th=THEMES.find(t=>t.id===S.equipped.theme)||THEMES[0];
  r.setProperty('--claim-a',th.a==='accent'?acc:th.a); r.setProperty('--claim-b',th.b);
  document.documentElement.classList.toggle('reduce-motion',!!S.settings.reduceMotion);
}

/* Avatar */
function avatarHtml(cls=''){
  const p=Treesh.profile(); const src=Treesh.avatarSrc(p); const name=Treesh.name();
  const init=(name.trim()[0]||'?').toUpperCase();
  return `<span class="avatar ${cls}">${src?`<img src="${esc(src)}" alt="${esc(name)}" onerror="this.remove()">`:esc(init)}</span>`;
}

/* Top bar */
function renderTopbar(){
  $('#topbar').innerHTML=`
    <button class="brand press" data-act="home" data-testid="nects-home-button" aria-label="Nects home">
      <img src="${NECTS_LOGO}" alt="Nects"><span style="text-align:left"><b>Nects</b><small>Treesh Games</small></span>
    </button>
    <span class="spacer"></span>
    <button class="star-pill press" data-act="open-profile" data-tab="rewards" data-testid="starlites-balance-pill" aria-label="Starlites">
      ${ic('sparkles',18)}<span><span class="lbl">Starlites</span><span class="num" data-star-count data-testid="starlites-balance-counter">${fmt(Treesh.balance())}</span></span>
    </button>
    <button class="press" data-act="open-profile" data-testid="treesh-profile-pill" aria-label="Profile">${avatarHtml()}</button>`;
  icons();
}
function updateStarUI(bump){
  const v=fmt(Treesh.balance());
  $$('[data-star-count]').forEach(el=>{ el.textContent=v; });
  if(bump){ const p=$('.star-pill'); if(p){ p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); } }
}

/* ===== Profile panel (Treesh profile) ===== */
let pfTab='stats';
function openProfile(tab){ if(tab) pfTab=tab; renderProfile(); }
function closeProfile(){
  const panel=$('#profile-root .pf-panel'); if(!panel) return;
  panel.classList.add('out'); const bd=$('#profile-root .pf-backdrop'); if(bd) bd.style.opacity='0';
  setTimeout(()=>{ $('#profile-root').innerHTML=''; },230);
}
function renderProfile(){
  const p=Treesh.profile(); const st=S.stats; const earnedBadges=BADGES.filter(b=>S.badges[b.id]).length;
  const joined=p&&p.joined?new Date(p.joined).toLocaleDateString('en-US',{month:'short',year:'numeric'}):null;
  const chips=[ p&&p.zodiac?`<span class="tag">${ic('moon-star',12)}${esc(p.zodiac)}</span>`:'', joined?`<span class="tag">${ic('calendar',12)}Joined ${joined}</span>`:'',
    `<span class="tag gold">${ic('award',12)}${earnedBadges}/${BADGES.length} badges</span>` ].join('');
  $('#profile-root').innerHTML=`
  <div class="pf-backdrop" data-act="close-profile" data-testid="profile-backdrop"></div>
  <aside class="pf-panel soft-scroll" data-testid="profile-panel">
    <div class="pf-hero">
      <button class="btn btn-ghost btn-icon modal-x" data-act="close-profile" data-testid="profile-panel-close" aria-label="Close">${ic('x',18)}</button>
      <div class="row">${avatarHtml('xl')}<div style="min-width:0;padding-bottom:4px">
        <h2 data-testid="profile-nickname">${esc(Treesh.name())}</h2>
        <p class="handle" data-testid="profile-username">${p&&p.username?'@'+esc(p.username):p?'Treesh member':'Not signed in to Treesh'}</p></div></div>
      <div class="pf-chips">${chips}</div>
      <div class="pf-stars" data-testid="profile-starlites"><span class="ic">${ic('sparkles',22)}</span>
        <div style="flex:1"><p class="eyebrow" style="letter-spacing:.14em">Starlites</p><p class="num" data-star-count>${fmt(Treesh.balance())}</p></div>
        <small class="muted" style="max-width:120px;text-align:right;font-size:11px">Shared wallet with your Treesh account</small></div>
      ${!p?`<div class="list-row" style="margin-top:12px" data-testid="profile-guest-note">${ic('user-round-plus',18)}<div class="grow"><b>Playing as a guest</b><small>Open Treesh to set up your nickname and avatar. They show up here automatically.</small></div>
        ${!Treesh.isHosted()?`<button class="btn btn-sm btn-ghost" data-act="seed-demo" data-testid="seed-demo-profile">Demo</button>`:''}</div>`:''}
    </div>
    <div class="pf-body">
      <div class="tabs no-scrollbar" data-testid="profile-tabs">
        ${[['stats','Stats'],['badges','Badges'],['history','History'],['rewards','Rewards']].map(([id,l])=>`<button class="${pfTab===id?'on':''}" data-act="pf-tab" data-tab="${id}" data-testid="profile-tab-${id}">${l}</button>`).join('')}
      </div>
      <div id="pf-content" data-testid="profile-tab-content">${pfContent()}</div>
    </div>
  </aside>`;
  icons();
}
function pfContent(){
  const st=S.stats;
  if(pfTab==='badges') return `<div class="badge-grid">${BADGES.map(b=>`<div class="badge ${S.badges[b.id]?'on':''}" data-testid="badge-${b.id}"><span class="bi">${b.icon}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join('')}</div>`;
  if(pfTab==='history'){
    if(!S.history.length) return `<p class="muted" style="text-align:center;padding:30px 0;font-size:13px" data-testid="history-empty">No matches yet. Go play one.</p>`;
    return S.history.map((h,i)=>{ const m=MODE_BY_ID[h.mode]||{name:h.mode,hue:'#999',icon:'gamepad-2'};
      return `<div class="list-row" data-testid="history-row-${i}"><span class="mode-ic" style="--hue:${m.hue};width:36px;height:36px;border-radius:12px">${ic(m.icon,16)}</span>
      <div class="grow"><b>${esc(m.name)}${h.sub?` · ${esc(h.sub)}`:''}</b><small>${esc(h.detail||'')} · ${ago(h.t)}</small></div>
      ${h.stars?`<span class="tag gold">+${h.stars}</span>`:''}<span class="res ${h.result==='win'?'win':h.result==='loss'?'loss':'done'}">${h.result==='win'?'WIN':h.result==='loss'?'LOSS':'DONE'}</span></div>`; }).join('');
  }
  if(pfTab==='rewards'){
    const log=Treesh.stars().log.slice(0,10);
    return `<p class="field-label">Recent Treesh rewards</p>${log.length?log.map(e=>`<div class="list-row"><span class="mode-ic" style="--hue:#c3ab69;width:32px;height:32px;border-radius:10px">${ic('sparkles',14)}</span><div class="grow"><b>${esc(e.r||'Reward')}</b><small>${e.t?ago(e.t):''}</small></div><span class="tag gold">+${fmt(e.a)}</span></div>`).join(''):`<p class="muted" style="font-size:13px">Nothing yet.</p>`}
      ${S.spent.length?`<p class="field-label">Spent in Nects</p>${S.spent.slice(0,6).map(e=>`<div class="list-row"><div class="grow"><b>${esc(e.r)}</b><small>${ago(e.t)}</small></div><span class="tag">-${fmt(e.a)}</span></div>`).join('')}`:''}`;
  }
  const wr=st.matches?Math.round(st.wins/Math.max(1,st.wins+st.losses)*100):0;
  const avg=st.taps?Math.round(st.tapMs/st.taps):0;
  const kv=(v,l,id)=>`<div class="kv" data-testid="stat-${id}"><span class="num">${v}</span><small>${l}</small></div>`;
  const modes=MODES.filter(m=>(st.byMode[m.id]||{}).played);
  return `<div class="kv-grid">${kv(fmt(st.matches),'Matches','matches')}${kv(fmt(st.wins),'Wins','wins')}${kv(wr+'%','Win rate','winrate')}
    ${kv(fmt(st.roundsWon),'Rounds won','rounds')}${kv(fmt(st.bestStreak),'Best streak','streak')}${kv(st.fastestMs?(st.fastestMs/1000).toFixed(2)+'s':'-','Fastest tap','fastest')}
    ${kv(avg?(avg/1000).toFixed(2)+'s':'-','Avg tap','avg')}${kv(fmtDur(st.playMs),'Play time','time')}${kv(fmt(st.starsEarned),'Starlites won','earned')}</div>
    <p class="field-label">By mode</p>${modes.length?modes.map(m=>{ const b=st.byMode[m.id]; return `<div class="list-row"><span class="mode-ic" style="--hue:${m.hue};width:32px;height:32px;border-radius:10px">${ic(m.icon,14)}</span><div class="grow"><b>${m.name}</b><small>${b.played} played · ${b.wins||0} won${b.best?` · best ${b.best}`:''}</small></div></div>`; }).join(''):`<p class="muted" style="font-size:13px">Play a mode to see it here.</p>`}`;
}
