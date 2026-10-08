/* ===================== FREA! PLUS — PERFORMANCE ENGINE =====================
   3 levels:  Auto (default) · Lite · High
   - Lite: DPR 1, canvas shadowBlur hard-disabled (all 60+ call sites), particle cap,
           no sparks, CSS backdrop-filter off, renders at 30 FPS (sim still 60 steps/s).
   - High: full effects, 60 FPS.
   - Auto: Lite on phones / low-core / low-memory devices; High elsewhere, with a frame-time
           watchdog that drops to Lite if the device can't hold ~45 FPS in a match.
   Also normalises the simulation to a fixed 60 steps/sec on every screen (120/144Hz screens
   no longer run the game faster), because physics in base.html is per-frame, not dt-scaled. */
var FreaPerf=(function(){
  var KEY='frea_perf_lvl',STEP=1000/60;
  function el(id){return document.getElementById(id);}
  function load(){try{var v=localStorage.getItem(KEY);if(v==='auto'||v==='lite'||v==='high')return v;
      /* migrate the old on/off toggle */var o=localStorage.getItem('frea_perf');if(o==='1')return 'lite';}catch(e){}return 'auto';}
  var level=load(),autoLite=null,watchDropped=false;
  /* ---------- device heuristic for Auto ---------- */
  function weakDevice(){try{
      var ua=navigator.userAgent||'',touch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
      var sw=Math.min(screen.width||innerWidth,screen.height||innerHeight);
      var phone=/iPhone|iPod|Android.+Mobile|Mobile Safari/i.test(ua)||(touch&&sw<=520);
      var cores=navigator.hardwareConcurrency||8,mem=navigator.deviceMemory||8;
      return phone||cores<=4||mem<=4;}catch(e){return false;}}
  function resolved(){if(level==='auto'){if(autoLite==null)autoLite=weakDevice();return (autoLite||watchDropped)?'lite':'high';}return level;}
  function isLite(){return resolved()==='lite';}

  /* ---------- shadowBlur kill-switch on the real canvas context ---------- */
  var realCtx=ctx,shadowKilled=false;
  function killShadows(on){try{
      if(on&&!shadowKilled){realCtx.shadowBlur=0;Object.defineProperty(realCtx,'shadowBlur',{configurable:true,get:function(){return 0;},set:function(){}});shadowKilled=true;}
      else if(!on&&shadowKilled){delete realCtx.shadowBlur;realCtx.shadowBlur=0;shadowKilled=false;}}catch(e){}}

  function apply(silent){var lite=isLite();perfMode=lite;killShadows(lite);
    try{document.body.classList.toggle('frea-lite',lite);}catch(e){}
    try{rsz();if(STATE==='play'||STATE==='countdown')worldBounds();}catch(e){}
    if(lite){parts.length=Math.min(parts.length,PCAP);sparks.length=0;}
    renderUI();}

  /* ---------- fixed-step loop wrapper (sim 60/s, render 60 or 30) ---------- */
  var dctx=null;try{var dc=document.createElement('canvas');dc.width=dc.height=1;dctx=dc.getContext('2d');}catch(e){}
  var PCAP=70,acc=0,lastTs=0,_loop=loop;
  /* frame-time watchdog (Auto → High only) */
  var wSum=0,wN=0,wStart=0;
  function watch(dtReal){if(level!=='auto'||resolved()!=='high'||STATE!=='play'||isPaused)return;var now=performance.now();if(!wStart)wStart=now;
    if(now-wStart<2500)return;/* ignore warm-up */wSum+=dtReal;wN++;
    if(wN>=180){var avg=wSum/wN;wSum=0;wN=0;if(avg>22){watchDropped=true;apply();try{flash('Switched to Lite graphics for smoother play','#c6ff3d');}catch(e){}}}}
  function step(ts,draw){lt=ts-STEP;var saved=ctx;if(!draw&&dctx)ctx=dctx;
    try{_loop(ts);}finally{ctx=saved;}if(fid){cancelAnimationFrame(fid);fid=null;}}
  loop=function(ts){
    if(!lastTs||ts-lastTs>250){lastTs=ts;acc=STEP;}/* first frame / resumed tab */
    var d=ts-lastTs;lastTs=ts;acc+=d;
    var lite=isLite(),need=lite?2:1,n=Math.floor((acc+2)/STEP);
    if(n<need&&!(isPaused)){fid=requestAnimationFrame(loop);return;}
    if(isPaused){acc=0;n=1;}
    if(n>4){n=4;acc=4*STEP;}
    watch(d);
    var simTs=ts-(n-1)*STEP;
    for(var i=0;i<n;i++){step(simTs+i*STEP,i===n-1);acc-=STEP;}
    if(lite&&parts.length>PCAP)parts.splice(0,parts.length-PCAP);
    if(lite&&sparks.length)sparks.length=0;
    fid=requestAnimationFrame(loop);};

  /* ---------- settings UI: Auto / Lite / High ---------- */
  function renderUI(){var sw=el('sw-perf');if(!sw)return;var row=sw.closest('.toggle-row');
    var box=el('perf-levels');
    if(!box){sw.style.display='none';box=document.createElement('div');box.id='perf-levels';box.className='layout-row perf-levels';box.setAttribute('data-testid','perf-levels');
      if(row&&row.parentNode)row.parentNode.insertBefore(box,row.nextSibling);
      box.addEventListener('click',function(e){var b=e.target.closest('[data-perf]');if(!b)return;set(b.dataset.perf);});}
    var lbl=row&&row.querySelector('.tsub');
    var r=resolved();if(lbl)lbl.textContent=level==='auto'?('Auto: using '+(r==='lite'?'Lite':'High')+' on this device'+(watchDropped?' (low frame rate detected)':'')):
      (level==='lite'?'Lite: 30 FPS, no glow/blur. Cooler & smoother on phones':'High: full glow, blur & particles');
    box.innerHTML=[['auto','Auto'],['lite','Lite'],['high','High']].map(function(p){var on=p[0]===level;return '<button class="lbtn'+(on?' active':'')+'" data-perf="'+p[0]+'" data-testid="perf-mode-'+p[0]+'" aria-pressed="'+on+'">'+p[1]+'</button>';}).join('');}
  function set(v){if(v!=='auto'&&v!=='lite'&&v!=='high')return;level=v;watchDropped=false;wSum=wN=0;wStart=0;try{localStorage.setItem(KEY,v);localStorage.setItem('frea_perf',resolved()==='lite'?'1':'0');}catch(e){}apply();
    try{flash('Graphics: '+(v==='auto'?'Auto ('+(isLite()?'Lite':'High')+')':v==='lite'?'Lite':'High'),'#c6ff3d');}catch(e){}}
  /* pause rendering entirely while the tab/app is hidden (saves battery & heat) */
  document.addEventListener('visibilitychange',function(){lastTs=0;});
  apply(true);setTimeout(renderUI,80);setTimeout(renderUI,800);
  return {level:function(){return level;},resolved:resolved,set:set,isLite:isLite};
})();
window.FreaPerf=FreaPerf;
/* ---- DOM thrash guards (big win on phones, esp. Hoops): skip no-op text writes and
   coalesce scoreboard rebuilds to ≤ 5/sec (it was rebuilding + re-animating every frame) ---- */
(function(){try{var d=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');if(d&&d.set){Object.defineProperty(Node.prototype,'textContent',{configurable:true,enumerable:d.enumerable,get:d.get,set:function(v){v=v==null?'':String(v);var fc=this.firstChild;if(this.nodeType===1&&fc&&fc===this.lastChild&&fc.nodeType===3&&fc.data===v)return;d.set.call(this,v);}});}}catch(e){}
  try{if(typeof updScore==='function'){var _us=updScore,last=0,pend=0,sig='';updScore=function(){var n=performance.now();
      var k='';try{k=gameMode+'|'+STATE+'|'+fleas.map(function(f){return (f.score|0)+':'+(f.matchPoints|0)+':'+(f.infected?1:0)+':'+(f.hidden?1:0);}).join(',')+'|'+(typeof hoopScore!=='undefined'?hoopScore.home+'-'+hoopScore.away:'');}catch(e){k=String(n);}
      if(k===sig&&n-last<1000)return;if(n-last>=200){last=n;sig=k;return _us.apply(this,arguments);}
      if(!pend)pend=setTimeout(function(){pend=0;last=performance.now();try{sig='';_us();}catch(e){}},200-(n-last));};}}catch(e){}})();
