/* ---------- P9zzm: tap a notification to open what it's about ---------- */
const _ntLog9zzm=ntLogApp; ntLogApp=function(){ const r=_ntLog9zzm.apply(this,arguments); try{ const it=ntAll()[0]; if(it&&it.src==='app'&&!it.v) it.v=state.view; }catch(e){} return r; };
function ntGo(id){ const it=ntFind(id); if(!it) return false; const close=fn=>{ ntMarkRead([id],true); ntbDismiss(id); if(state.ntOpen){ ntcClose(); setTimeout(fn,220); } else fn(); return true; };
  if(it.actor&&it.actor.u){ ntViewActor(id); return true; }
  if(it.kind==='news'&&it.url){ newsOpen(id); return true; }
  if(it.kind==='update') return close(()=>{ if(_ver.next) verGo(); else toast('Treesh is up to date','You\u2019re on the newest version'); });
  if(it.kind==='star') return close(()=>openProfile('stats'));
  if(it.kind==='staff') return close(()=>openProfile());
  if(it.src==='app'&&it.v&&it.v!==state.view&&typeof navigate==='function') return close(()=>navigate(it.v));
  return false; }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="ntb-open"],[data-act="nt-row"]'); if(!t) return; const id=t.dataset.id; if(!id||String(id).indexOf('sum')===0||e.target.closest('[data-act]')!==t) return;
  if(t.dataset.act==='nt-row'){ const w=t.closest('.nt-row-wrap'); if(w&&w.classList.contains('is-drag')) return; if(e.target.closest('.nt-acts,.nt-quick,[data-act="nt-menu"]')) return; }
  if(ntGo(id)){ e.preventDefault(); e.stopImmediatePropagation(); if(t.dataset.act==='ntb-open') ntbDismiss(id,'right'); } },true);
