/* ===== Events + boot ===== */
const ACT={
  'home':()=>{ if(currentScreen==='bingo'&&BG&&BG.active) return bingoPause(); if(currentScreen==='game'&&G&&G.active) return pauseGame(); closeModal(); renderMenu(); },
  'open-profile':el=>openProfile(el.dataset.tab||null),
  'close-profile':()=>closeProfile(),
  'pf-tab':el=>{ pfTab=el.dataset.tab; $$('[data-act="pf-tab"]').forEach(b=>b.classList.toggle('on',b.dataset.tab===pfTab)); $('#pf-content').innerHTML=pfContent(); icons(); },
  'seed-demo':()=>{ Treesh.seedDemo(); renderTopbar(); renderProfile(); if(currentScreen==='menu') renderMenu(); toast('Demo Treesh profile loaded','Only shown outside treesh.app'); },
  'quick-play':()=>{ const m=MODE_BY_ID[S.lastMode]; const id=m&&!['puzzle','daily','pass','custom','mirror','bingo'].includes(m.id)?m.id:'classic'; startMatch(buildConfig(id)); },
  'help':()=>openHelp(),
  'mode':el=>openModeSheet(el.dataset.mode),
  'sheet-set':el=>sheetSet(el.dataset.k,el.dataset.v),
  'sheet-toggle':el=>sheetToggle(el.dataset.k),
  'start-mode':()=>startFromSheet(),
  'unlock-mode':el=>{ if(buyItem('modes',el.dataset.mode)){ renderModeSheet(); if(currentScreen==='menu') renderMenu(); } },
  'close-modal':()=>closeModal(),
  'shop':()=>openShop(),
  'shop-tab':el=>{ shopTab=el.dataset.tab; renderShop(true); },
  'buy':el=>{ if(buyItem(el.dataset.kind,el.dataset.id)){ renderShop(true); if(currentScreen==='menu') renderMenu(); } },
  'equip':el=>{ if(el.dataset.kind==='themes') S.equipped.theme=el.dataset.id; else S.equipped.pack=el.dataset.id; saveNects(); applyTheme(); renderShop(true); toast('Equipped'); },
  'settings':()=>openSettings(),
  'setting-toggle':el=>{ const k=el.dataset.k; S.settings[k]=!S.settings[k]; saveNects(); el.classList.toggle('on',S.settings[k]); applyTheme(); },
  'reset-data':()=>confirmBox('Reset Nects progress?','Stats, unlocks, badges and history for Nects will be erased on this device. Your Treesh Starlites are not touched.','Reset',()=>{ S=defaultSave(); S.migrated=true; saveNects(); applyTheme(); renderMenu(); toast('Nects progress reset'); },true),
  'pause':()=>currentScreen==='bingo'?bingoPause():pauseGame(),
  'bingo-shout':()=>bingoShout(),
  'resume':()=>closeModal(),
  'restart':()=>{ if(currentScreen==='bingo'){ modalOnClose=null; closeModal(); return startBingo(BG.cfg); } const cfg=G.cfg; modalOnClose=null; closeModal(); startMatch(cfg); },
  'quit':()=>{ modalOnClose=null; closeModal(); if(currentScreen==='bingo') return bingoMatchEnd(true); if(G.cfg.zen||G.cfg.survival||G.cfg.pass) endMatch(false); else endMatch(true); },
  'zen-finish':()=>endMatch(false),
  'pu':el=>usePU(el.dataset.id),
  'again':()=>{ if(currentScreen==='bingo'){ closeModal(); return startBingo(BG.cfg); } const cfg=G.cfg; modalOnClose=null; closeModal(); startMatch(cfg); },
  'menu':()=>{ modalOnClose=null; closeModal(); renderMenu(); },
  'pz-card':el=>playCard(+el.dataset.i),
  'pz-retry':()=>{ closeModal(); startPuzzle(PZ.L); },
  'pz-next':()=>{ closeModal(); startPuzzle(PZ.L+1); }
};
document.addEventListener('click',e=>{
  const bd=e.target.classList&&e.target.classList.contains('backdrop')?e.target:null;
  if(bd){ if(bd.dataset.backdrop!=='lock') closeModal(); return; }
  const el=e.target.closest('[data-act]'); if(!el) return;
  const fn=ACT[el.dataset.act]; if(fn){ Sound.tone(700,.03,'sine',.02); fn(el,e); }
});
document.addEventListener('pointerdown',e=>{
  const t=e.target.closest('[data-tap]'); if(!t) return;
  e.preventDefault(); if(t.dataset.tap==='b') return bingoTap(+t.dataset.idx); onTap(t.dataset.tap,+t.dataset.idx);
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ if($('#profile-root .pf-panel')) return closeProfile(); if(modalOpen()){ const b=$('#modal-root .backdrop'); if(b&&b.dataset.backdrop!=='lock') closeModal(); return; } if(currentScreen==='game') pauseGame(); if(currentScreen==='bingo') bingoPause(); }
});
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) return; if(currentScreen==='game'&&G&&G.active&&!G.paused) pauseGame(); if(currentScreen==='bingo'&&BG&&BG.active&&!BG.paused) bingoPause(); });
window.addEventListener('storage',e=>{
  if(e.key==='treesh_stars') updateStarUI(true);
  if(e.key==='treesh_profile'){ renderTopbar(); if(currentScreen==='menu'&&!modalOpen()) renderMenu(); if($('#profile-root .pf-panel')) renderProfile(); }
  if(e.key==='treesh_accent'||e.key===NECTS_KEY&&false) applyTheme();
});
window.addEventListener('message',e=>{ if(e.origin!==location.origin) return; const d=e.data||{}; if(d.source==='treesh'&&d.type==='refresh'){ applyTheme(); renderTopbar(); } });

(function boot(){
  applyTheme(); renderTopbar();
  const moved=migrateOld();
  renderMenu();
  setTimeout(()=>{ $('#splash').classList.add('hide'); },450);
  if(moved>0) setTimeout(()=>toast('Welcome to the new Nects',`Your old balance became ${moved} Treesh Starlites`,'star'),900);
  else if(!S.settings.seenHelp) setTimeout(()=>{ if(!modalOpen()) openHelp(); },800);
})();
