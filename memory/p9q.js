/* ---------- P9q: quick fixes (Lyric Studio follows app theme, broken covers, admin MAD tools) ---------- */
const _apt9q=applyTheme; applyTheme=function(){ const r=_apt9q.apply(this,arguments); try{ const el=document.querySelector('[data-ls-root]'); if(el){ const lt=lsLight(); el.classList.toggle('lsx-light',lt); el.classList.toggle('lsx-dark',!lt); el.classList.toggle('dark-surface',!lt); el.setAttribute('data-ls-theme',lt?'light':'dark'); } }catch(e){} return r; };

/* any cover that fails to load gets the Treesh placeholder (avatars fall back to their initial) */
document.addEventListener('error',e=>{ const t=e.target; if(!t||t.tagName!=='IMG'||t.dataset.ph) return; t.dataset.ph='1';
  if(t.closest('.sx-av,[data-avatar],.pf-av')){ t.style.display='none'; return; }
  if(t.src!==FALLBACK) t.src=FALLBACK; },true);

/* admins: MAD tools in the games window */
const MAD_URL='https://treesh.app/tools/mad';
function madOpen(){ if(stRole()!=='admin'){ toast('MAD tools are for Treesh admins'); return; } state.gfMusic=false; state.gameFrame={key:'mad',name:'MAD tools',url:MAD_URL,min:false,a:'#38bdf8',b:'#1e3a8a',mono:'M'}; renderGameFrame(); syncScrollLock(); }
const _sac9q=sbAccountCardHtml; sbAccountCardHtml=function(tab){ const h=_sac9q.apply(this,arguments); if(!h||stRole()!=='admin') return h;
  return h.replace('<button type="button" data-act="mod-dash" data-testid="mod-open-dashboard" class="sba-btn is-primary press"><i data-lucide="gavel"></i>Open moderation</button>','<button type="button" data-act="mod-dash" data-testid="mod-open-dashboard" class="sba-btn is-primary press"><i data-lucide="gavel"></i>Open moderation</button><button type="button" data-act="mad-open" data-testid="admin-open-mad" class="sba-btn press"><i data-lucide="wrench"></i>Open MAD tools</button>'); };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="mad-open"]'); if(t) madOpen(); });
