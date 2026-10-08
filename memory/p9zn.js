/* ---------- P9zn: Library is now Home; nav reads Game, Studios, Home, Icons, Profile; the profile sheet grows out of its tab on phones ---------- */
NAV.splice(0,NAV.length,['game','Game','gamepad-2'],['studios','Studios','layout-grid'],['library','Home','house'],['artists','Icons','sparkles'],['profile','Profile','circle-user-round']);
MK_NAV.splice(0,MK_NAV.length,['game','Game','gamepad-2'],['studios','Studios','layout-grid'],['library','Home','house'],['artists','Icons','sparkles'],['settings','Settings','settings']);
MK_PAGE_LABEL.library='Home';
{ const L=LOCK_PAGES.find(p=>p[0]==='library'); if(L){ L[1]='Home'; L[2]='house'; } }
if(WHATS_NEW.library) WHATS_NEW.library.title='Home';
WHATS_NEW.library&&WHATS_NEW.library.items.unshift({icon:'house',title:'Library is now Home',desc:'Your songs, playlists and the What\u2019s New carousel live on Home, right in the middle of the bottom bar. Profile sits at the far right.'});
/* the new default order wins once, then your own Magic Markup order is kept */
{ const m=mkS(); if(m.navV!==2){ m.navV=2; delete m.navOrder; mkSave(); } }

/* phones: the profile sheet grows from (and shrinks back into) the Profile tab; desktop keeps its own entrance */
function pfOriginSync(){ const p=document.getElementById('profile-panel'); if(!p) return; const b=document.querySelector('[data-testid="nav-mobile-profile"]'), r=b&&b.getBoundingClientRect();
  if(innerWidth>=1024||!r||!r.width){ p.style.transformOrigin=''; return; }
  p.style.transformOrigin=Math.round(r.left+r.width/2-p.offsetLeft)+'px '+Math.round(r.top+r.height/2-p.offsetTop)+'px'; }
const _rPf9zn=renderProfile; renderProfile=function(){ const r=_rPf9zn.apply(this,arguments); pfOriginSync(); return r; };
const _cPf9zn=closeProfile; closeProfile=function(){ pfOriginSync(); return _cPf9zn.apply(this,arguments); };
