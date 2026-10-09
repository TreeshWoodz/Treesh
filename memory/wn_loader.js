<script>
/* ---------- M.A.D. What's New loader: content/whatsnew.json can take over the per-page popups and the Home carousel slides ---------- */
(function(){
  if(typeof WHATS_NEW!=='object'||typeof WNU==='undefined') return;
  const KEY='treesh_wn_content', clone=o=>JSON.parse(JSON.stringify(o));
  const BASE={ popups:clone(WHATS_NEW), slides:WNU.map(x=>Object.assign({},x)) };
  window.__treeshWN={ builtin:BASE, loader:2 };
  const E=s=>esc(String(s==null?'':s)), slugId=s=>String(s||'').replace(/[^\w-]/g,'');
  const color=(c,d)=>/^#[0-9a-f]{3,8}$/i.test(String(c||''))?c:d;
  const inWindow=x=>{ const n=Date.now(), f=x.from?Date.parse(x.from):NaN, u=x.until?Date.parse(x.until)+86400000:NaN; return !(n<f)&&!(n>=u); };
  function apply(c){
    c=c&&typeof c==='object'?c:{};
    Object.keys(WHATS_NEW).forEach(k=>{ delete WHATS_NEW[k]; });
    Object.entries(clone(BASE.popups)).forEach(([k,v])=>{ WHATS_NEW[k]=v; });
    Object.entries(c.popups||{}).forEach(([k,p])=>{ k=slugId(k); if(!k||!p||p.mode==='code') return;
      if(p.enabled===false||!inWindow(p)){ delete WHATS_NEW[k]; return; }
      WHATS_NEW[k]={ v:Math.max(1,+p.v||1), date:String(p.date||''), title:String(p.title||k), sub:String(p.sub||''), items:(Array.isArray(p.items)?p.items:[]).map(i=>({ icon:slugId(i&&i.icon)||'sparkles', title:String((i&&i.title)||''), desc:String((i&&i.desc)||'') })) }; });
    state._wnMadOff=!!(c.settings&&c.settings.autoPopups===false);
    const S=c.slides; WNU.length=0;
    if(S&&(S.mode==='managed'||S.mode==='locked')&&Array.isArray(S.list)){
      S.list.filter(s=>s&&s.enabled!==false&&inWindow(s)).forEach((s,i)=>{ let art=String(s.art||'');
        if(/^https:\/\//.test(art)){ art=art.replace(/["'<>\s]/g,encodeURIComponent); ST3_ART[art]=art; } else if(art&&!ST3_ART[art]) art='';
        WNU.push({ id:slugId(s.id)||('slide-'+i), art, k:E(s.k), t:E(s.t), d:E(s.d), chips:(Array.isArray(s.chips)?s.chips:[]).slice(0,4).map(E), cta:E(s.cta||'Open'), ic:slugId(s.ic)||'sparkles', a:color(s.a,'#9328ff'), b:color(s.b,'#ff3d9a'), go:String(s.go||'').replace(/["'<>]/g,'') }); });
    } else BASE.slides.forEach(x=>WNU.push(Object.assign({},x)));
    state._wnBuilt=null;
  }
  const _wma=wnMaybeAuto; wnMaybeAuto=function(){ if(state._wnMadOff) return; return _wma.apply(this,arguments); };
  document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act="wnu-go"]'); const v=t&&t.dataset.val||'';
    if(v.indexOf('page:')===0){ stopWN(); navigate(v.slice(5)); } else if(/^url:https:\/\//.test(v)){ stopWN(); window.open(v.slice(4),'_blank','noopener'); } });
  let last=null; try{ last=localStorage.getItem(KEY); if(last) apply(JSON.parse(last)); }catch(e){ last=null; }
  const rerender=()=>{ try{ wnRefreshBadges(); if(state.view===mkHome()&&!document.querySelector('#modal > *')) renderView(); }catch(e){} };
  fetch('/content/whatsnew.json?t='+Math.floor(Date.now()/60000),{cache:'no-store'}).then(r=>r.ok?r.text():'').then(t=>{
    let c=null; try{ c=t?JSON.parse(t):null; }catch(e){ return; }
    const s=c?JSON.stringify(c):null; if(s===last) return;
    try{ if(s) localStorage.setItem(KEY,s); else localStorage.removeItem(KEY); }catch(e){}
    apply(c); rerender();
  }).catch(()=>{});
  const pv=new URLSearchParams(location.search).get('wn-preview');
  if(pv&&WHATS_NEW) setTimeout(()=>{ if(WHATS_NEW[pv]){ try{ closeModal(); }catch(e){} wnOpen(pv); } },1800);
})();
</script>
