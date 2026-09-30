/* =====================================================================
   TREESH BRIDGE — shared Starlites wallet + Treesh profile
   FREA! lives at treesh.app/games/frea (same origin as the parent app),
   so it reads/writes the parent's real localStorage keys:
     treesh_stars   {points, log:[{t,a,r}], ...}   (parent schema, preserved)
     treesh_profile {nickname, birthday, zodiac, avatar}
   Every FREA! award is also journaled in frea_star_ledger_v1 so that, if the
   parent app later overwrites treesh_stars from stale memory, FREA! re-applies
   the missing entries exactly once (idempotent by entry id).
   ===================================================================== */
(function(){
  var TS = window.Treesh = {};
  var LK = 'frea_star_ledger_v1';
  function get(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
  function set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
  TS.get=get;TS.set=set;
  function blank(){return {points:0,lastDaily:null,streak:0,newSongs:{},minToday:0,min30Date:null,secAccum:0,totalMin:0,games:0,beats:0,log:[]};}
  TS.stars=function(){var s=get('treesh_stars',null);if(!s||typeof s!=='object')s=blank();s.points=Math.max(0,+s.points||0);if(!Array.isArray(s.log))s.log=[];return s;};
  TS.points=function(){return TS.stars().points;};
  function ledger(){var l=get(LK,[]);return Array.isArray(l)?l:[];}
  TS.ledger=ledger;
  TS.earned=function(){return ledger().reduce(function(a,e){return a+(e.a>0?e.a:0);},0);};
  TS.spent=function(){return ledger().reduce(function(a,e){return a+(e.a<0?-e.a:0);},0);};
  function writeEntry(st,e){
    st.points=Math.max(0,(st.points||0)+e.a);
    st.log.unshift({t:e.t,a:e.a,r:e.r,src:'frea',id:e.id});
    st.log.sort(function(x,y){return (y.t||0)-(x.t||0);});
    if(st.log.length>50)st.log.length=50;
    if(e.a>0&&e.game){st.games=(st.games||0)+1;}
  }
  var listeners=[];
  TS.onChange=function(fn){listeners.push(fn);};
  function emit(e){var p=TS.points();listeners.forEach(function(fn){try{fn(p,e);}catch(x){}});
    try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'treesh:stars',source:'frea',points:p,entry:e||null},'*');}catch(x){}}
  TS.award=function(amount,reason,opts){
    opts=opts||{};amount=Math.round(+amount||0);if(!amount)return 0;
    var e={id:'fr_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),t:Date.now(),a:amount,r:'FREA! · '+(reason||'Reward'),game:!!opts.game};
    var st=TS.stars();writeEntry(st,e);set('treesh_stars',st);
    var L=ledger();L.push(e);if(L.length>400)L.splice(0,L.length-400);set(LK,L);
    if(!opts.silent&&amount>0)TS.toast('+'+amount,reason||'Reward',opts.icon);
    emit(e);return amount;
  };
  TS.canAfford=function(c){return TS.points()>=c;};
  TS.spend=function(cost,reason){cost=Math.round(cost);if(cost<=0)return true;if(TS.points()<cost)return false;TS.award(-cost,reason||'Purchase',{silent:true});return true;};
  /* Re-apply FREA! entries the parent app may have clobbered. */
  TS.reconcile=function(){
    var raw=get('treesh_stars',null),L=ledger();if(!L.length)return 0;
    if(!raw){ /* parent wiped its data (reset) — respect it, drop our journal */ set(LK,[]);return 0; }
    var st=TS.stars(),have={};st.log.forEach(function(x){if(x&&x.id)have[x.id]=1;});
    var oldest=st.log.length?Math.min.apply(null,st.log.map(function(x){return x.t||0;})):0,full=st.log.length>=50;
    var fixed=0,marks=get('frea_star_ok_v1',{});
    L.forEach(function(e){
      if(have[e.id]||marks[e.id])return;
      if(full&&e.t<oldest){marks[e.id]=1;return;} /* legitimately truncated from the 50-entry log */
      writeEntry(st,e);fixed++;
    });
    /* entries confirmed present can be marked so truncation later never re-applies them */
    L.forEach(function(e){if(have[e.id])marks[e.id]=1;});
    var km=Object.keys(marks);if(km.length>600){km.slice(0,km.length-600).forEach(function(k){delete marks[k];});}
    set('frea_star_ok_v1',marks);
    if(fixed){set('treesh_stars',st);emit(null);}
    return fixed;
  };
  /* ---------- profile ---------- */
  TS.profile=function(){var p=get('treesh_profile',null);if(!p||typeof p!=='object')return null;return p;};
  TS.nickname=function(){var p=TS.profile();return (p&&p.nickname)?String(p.nickname).slice(0,18):'';};
  /* only image-like values (URL / data URI / relative path) are used as avatars; anything else falls back to the initial */
  TS.avatar=function(){var p=TS.profile();var a=(p&&typeof p.avatar==='string')?p.avatar.trim():'';return /^(https?:|data:image\/|blob:|\/|\.\.?\/)/i.test(a)?a:'';};
  TS.isBirthday=function(){var p=TS.profile();if(!p||!p.birthday)return false;var d=new Date(p.birthday+'T00:00:00');if(isNaN(d))return false;var n=new Date();return d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();};
  TS.level=function(){var xp=TS.earned();var lvl=Math.floor(Math.sqrt(xp/40))+1;var cur=Math.pow(lvl-1,2)*40,nxt=Math.pow(lvl,2)*40;return {lvl:lvl,xp:xp,pct:Math.min(1,(xp-cur)/Math.max(1,nxt-cur)),next:nxt};};
  TS.dayKey=function(d){d=d||new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};
  TS.fmt=function(n){n=n||0;return n>=10000?(n/1000).toFixed(n%1000===0?0:1)+'k':n.toLocaleString();};

  /* ---------- toast stack ---------- */
  var host=null;
  function ensureHost(){if(host)return host;host=document.createElement('div');host.id='tr-toasts';host.setAttribute('aria-live','polite');document.body.appendChild(host);return host;}
  TS.toast=function(big,small,icon,kind){
    var h=ensureHost(),t=document.createElement('div');t.className='tr-toast'+(kind?' '+kind:'');t.setAttribute('data-testid','starlite-toast');
    t.innerHTML='<span class="trt-ico">'+(icon||'✦')+'</span><span class="trt-txt"><b>'+big+(kind?'':' Starlites')+'</b><small>'+String(small||'').replace(/</g,'&lt;')+'</small></span>';
    h.appendChild(t);requestAnimationFrame(function(){t.classList.add('in');});
    setTimeout(function(){t.classList.remove('in');t.classList.add('out');setTimeout(function(){t.remove();},500);},kind==='trophy'?4200:2800);
  };

  /* ---------- hook into the game's existing Starlites UI ---------- */
  function migrateLocal(){
    /* one-time: bring the old FREA-only wallet into the shared Treesh wallet */
    try{if(localStorage.getItem('frea_stars_migrated'))return;var old=parseInt(localStorage.getItem('frea_starlites'),10)||0;localStorage.setItem('frea_stars_migrated','1');if(old>0)TS.award(old,'Transferred FREA! Starlites',{silent:true});}catch(e){}
  }
  function paint(){
    var p=TS.points();try{starlites=p;}catch(e){}
    ['star-val','ltop-coinval','ltop-lvlval'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=TS.fmt(p);});
    document.querySelectorAll('[data-star-count]').forEach(function(el){el.textContent=TS.fmt(p);});
  }
  TS.paint=paint;
  TS.onChange(function(){paint();});
  renderStarlites=paint;
  saveStarlites=function(){};
  addStarlites=function(n,reason){TS.award(n,reason||'Reward');};

  /* ---------- daily bonus + birthday gift ---------- */
  TS.daily=function(){
    var d=get('frea_daily_v1',{last:null,streak:0,bday:null}),tk=TS.dayKey();
    if(d.last!==tk){var y=new Date();y.setDate(y.getDate()-1);d.streak=(d.last===TS.dayKey(y))?(d.streak||0)+1:1;d.last=tk;set('frea_daily_v1',d);
      var amt=20+Math.min(d.streak-1,6)*5;
      setTimeout(function(){TS.award(amt,d.streak>1?(d.streak+'-day FREA! streak'):'Daily FREA! bonus',{icon:'📅'});},1600);}
    if(TS.isBirthday()){var yr=new Date().getFullYear();if(d.bday!==yr){d.bday=yr;set('frea_daily_v1',d);setTimeout(function(){TS.award(150,'Happy birthday from the fleas!',{icon:'🎂'});},3400);}}
    return d;
  };
  TS.streak=function(){return get('frea_daily_v1',{streak:0}).streak||0;};

  function boot(){
    migrateLocal();TS.reconcile();paint();TS.daily();
    setInterval(function(){TS.reconcile();paint();},15000);
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'){TS.reconcile();paint();}});
    window.addEventListener('storage',function(ev){if(ev.key==='treesh_stars'||ev.key==='treesh_profile'){paint();if(window.FreaProfile)window.FreaProfile.refresh();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
