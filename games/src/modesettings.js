/* ===================== FREA! PLUS — PER-MODE SETTINGS =====================
   Every mode gets a gear button on its lobby card + its own tab in Game Settings.
   Mode modules register a schema:  FreaModeSettings.register(mode,[{k,l,sub,opts:[[val,label],...],def,show()}],apply)
   Values persist in localStorage (frea_xm_<mode>). get(mode,key) returns the typed value.
   Also hosts the global "CPU Skill" row (Easy / Normal / Pro) used by navai.js. */
var FreaModeSettings=(function(){
  var SCH={},APPLY={},KP='frea_xm_';
  function el(id){return document.getElementById(id);}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function load(m){try{return JSON.parse(localStorage.getItem(KP+m)||'{}')||{};}catch(e){return {};}}
  function save(m,o){try{localStorage.setItem(KP+m,JSON.stringify(o));}catch(e){}}
  function row(m,k){return (SCH[m]||[]).filter(function(r){return r.k===k;})[0];}
  function get(m,k){var o=load(m),r=row(m,k);if(o[k]!=null&&r&&r.opts.some(function(p){return p[0]===o[k];}))return o[k];return r?r.def:undefined;}
  function set(m,k,v){var o=load(m);o[k]=v;save(m,o);render();}
  function info(m){var d=null;try{d=(window.FreaModes&&FreaModes.info[m])||null;}catch(e){}if(!d&&typeof MODE_INTRO!=='undefined')d=MODE_INTRO[m];return d||{ico:'◎',name:m};}
  function register(m,rows,apply){SCH[m]=rows;if(apply)APPLY[m]=apply;mountTab(m);render();}
  /* ---------- global CPU skill ---------- */
  var SKILL_K='frea_cpu_skill';
  function skill(){try{var v=localStorage.getItem(SKILL_K);if(v==='easy'||v==='normal'||v==='pro')return v;}catch(e){}return 'normal';}
  /* ---------- settings tabs ---------- */
  function mountTab(m){var tabs=el('settings-tabs');if(!tabs||tabs.querySelector('.seg-tab[data-mode="'+m+'"]'))return;var d=info(m);
    var b=document.createElement('button');b.className='seg-tab';b.dataset.mode=m;b.setAttribute('data-testid','settings-tab-'+m);
    b.innerHTML='<span class="se">'+d.ico+'</span>'+esc(d.short||d.name);b.addEventListener('click',function(){setMode(m);});
    var zen=tabs.querySelector('.seg-tab[data-mode="zen"]');tabs.insertBefore(b,zen||null);}
  function syncTabs(){var bar=el('settings-tabs');document.querySelectorAll('#settings-tabs .seg-tab').forEach(function(t){var on=t.dataset.mode===gameMode;t.classList.toggle('active',on);if(on&&bar){setTimeout(function(){try{bar.scrollLeft=Math.max(0,t.offsetLeft-(bar.clientWidth-t.offsetWidth)/2);}catch(e){}},30);}});}
  var _os=openSettings;openSettings=function(){var r=_os.apply(this,arguments);try{syncTabs();}catch(e){}return r;};
  /* ---------- rows ---------- */
  var box=null;
  function host(){if(box&&box.isConnected)return box;var g=document.querySelector('#sg-mode .sgroup-b');if(!g)return null;box=document.createElement('div');box.id='xm-settings';box.setAttribute('data-testid','mode-settings-rows');
    var hw=el('hoops-wrap');g.insertBefore(box,hw||null);
    box.addEventListener('click',function(e){var b=e.target.closest('.lbtn[data-xk]');if(!b)return;var m=b.dataset.xm,k=b.dataset.xk,r=row(m,k);if(!r)return;var v=r.opts[+b.dataset.xi][0];set(m,k,v);});return box;}
  function rowHtml(m,r){var cur=get(m,r.k);return '<div class="setting-row xm-row"><div class="section-label"><span>'+esc(r.l)+'</span>'+(r.sub?'<small class="xm-sub">'+esc(r.sub)+'</small>':'')+'</div><div class="layout-row" style="flex-wrap:wrap">'+
      r.opts.map(function(p,i){return '<button class="lbtn'+(p[0]===cur?' active':'')+'" data-xm="'+m+'" data-xk="'+r.k+'" data-xi="'+i+'" data-testid="xm-'+m+'-'+r.k+'-'+String(p[0])+'" aria-pressed="'+(p[0]===cur)+'">'+esc(p[1])+'</button>';}).join('')+'</div></div>';}
  function render(){var b=host();if(!b)return;var m=gameMode,rows=SCH[m]||[],h='';
    rows.forEach(function(r){if(r.show&&!r.show())return;if(r.head){h+='<div class="xm-head" data-testid="xm-head-'+esc(r.head).toLowerCase().replace(/[^a-z]+/g,'-')+'">'+esc(r.head)+'</div>';return;}h+=rowHtml(m,r);});
    if(m!=='zen'&&m!=='tutorial'){var sk=skill();h+='<div class="xm-head">Rivals</div><div class="setting-row xm-row"><div class="section-label"><span>CPU Skill</span><small class="xm-sub">How clever rival fleas are</small></div><div class="layout-row" id="cpu-skill-row">'+
      [['easy','Easy'],['normal','Normal'],['pro','Pro']].map(function(p){return '<button class="lbtn'+(p[0]===sk?' active':'')+'" data-skill="'+p[0]+'" data-testid="cpu-skill-'+p[0]+'">'+p[1]+'</button>';}).join('')+'</div></div>';}
    b.innerHTML=h;b.style.display=h?'':'none';
    b.querySelectorAll('[data-skill]').forEach(function(x){x.addEventListener('click',function(){try{localStorage.setItem(SKILL_K,x.dataset.skill);}catch(e){}render();});});}
  /* ---------- gear buttons on every lobby card ---------- */
  function mountGears(){document.querySelectorAll('#modes .mode-chip[data-mode]').forEach(function(c){var m=c.dataset.mode;if(m==='party'||c.classList.contains('party-card')||c.querySelector('.mc-gear'))return;
    var g=document.createElement('button');g.className='mc-gear';g.dataset.gear=m;g.setAttribute('data-testid','mode-gear-'+m);g.title=info(m).name+' settings';g.setAttribute('aria-label',info(m).name+' settings');g.textContent='⚙';
    g.addEventListener('click',function(e){e.stopPropagation();openModeSettings(m);});c.appendChild(g);});}
  function mountAll(){mountGears();Object.keys(SCH).forEach(mountTab);syncTabs();render();}
  setTimeout(mountAll,60);setTimeout(mountAll,700);
  try{var mg=el('modes');if(mg)new MutationObserver(function(){mountGears();}).observe(mg,{childList:true});}catch(e){}
  var _ss=syncSettingsUI;syncSettingsUI=function(){var r=_ss.apply(this,arguments);try{syncTabs();render();}catch(e){}return r;};
  /* ---------- apply before a match starts (party keeps its own fixed rules) ---------- */
  function party(){try{return !!(window.FreaParty&&FreaParty.status());}catch(e){return false;}}
  var _sg=startGame;startGame=function(){try{var m=gameMode;if(row(m,'time')&&!party()&&window.FreaModes)FreaModes.setRound(get(m,'time'));if(APPLY[m])APPLY[m](party());}catch(e){console.warn('modesettings',e);}return _sg.apply(this,arguments);};

  /* ======================= built-in extra mode schemas ======================= */
  var TIME=[[45,'45s'],[60,'60s'],[90,'90s'],[120,'2 min']];
  function X(k){return EXTRA_MODES[k];}
  function S(){try{return FreaModes.state()||{};}catch(e){return {};}}
  /* King of the Hill */
  register('koth',[{k:'time',l:'Round Length',opts:TIME,def:60},{k:'move',l:'Hill Moves Every',opts:[[8,'8s'],[13,'13s'],[20,'20s']],def:13}]);
  (function(){var K=X('koth');if(!K)return;var _r=K.relocate;K.relocate=function(){var r=_r.apply(this,arguments);if(!party())S().move=get('koth','move')*1000;return r;};})();
  /* Floor is Lava */
  register('lava',[{k:'time',l:'Round Length',opts:TIME,def:60},{k:'speed',l:'Lava Speed',opts:[[0.7,'Slow'],[1,'Normal'],[1.4,'Fast']],def:1}]);
  (function(){var L=X('lava');if(!L)return;var _t=L.tick;L.tick=function(dt){var s=S(),b=s.lava;var r=_t.apply(this,arguments);var m=party()?1:get('lava','speed');if(b!=null&&s.lava<b&&m!==1)s.lava=Math.max(WORLD_H*0.16,b-(b-s.lava)*m);return r;};})();
  /* Star Rush */
  register('stars',[{k:'time',l:'Round Length',opts:TIME,def:60},{k:'spikes',l:'Spiky Stars',opts:[['none','None'],['some','Some'],['lots','Lots']],def:'some'}]);
  (function(){var A=X('stars');if(!A)return;var _a=A.add;A.add=function(){var r=_a.apply(this,arguments);var st=S().stars,s=st&&st[st.length-1],v=party()?'some':get('stars','spikes');if(s){if(v==='none'&&s.k==='spike'){s.k='gold';s.r=11;}else if(v==='lots'&&s.k==='gold'&&Math.random()<0.3){s.k='spike';s.r=14;}}return r;};})();
  /* Red Light, Green Light */
  register('redlight',[{k:'time',l:'Time Limit',sub:'Doubled for the long course',opts:TIME,def:60},{k:'track',l:'Track Length',opts:[[0.6,'Short'],[1,'Normal'],[1.5,'Long']],def:1}]);
  (function(){var R=X('redlight');if(!R)return;var _b=R.bounds;R.bounds=function(bw,bh){var b=_b.apply(this,arguments),m=party()?1:get('redlight','track');return [Math.round(Math.max(4000,b[0]*m)),b[1]];};})();
  /* Freeze Tag */
  register('freeze',[{k:'time',l:'Round Length',opts:TIME,def:60},{k:'its',l:'Taggers (IT)',opts:[[0,'Auto'],[1,'1'],[2,'2'],[3,'3']],def:0}]);
  (function(){var F=X('freeze');if(!F)return;var _s=F.setup;F.setup=function(){var r=_s.apply(this,arguments);var n=party()?0:get('freeze','its');if(n>0&&fleas.length>n){var keepP=player&&player.it;fleas.forEach(function(f){f.it=false;});var c=fleas.filter(function(f){return !f.isP;}).sort(function(){return Math.random()-.5;});
      if(keepP){player.it=true;n--;}for(var i=0;i<n&&i<c.length;i++)c[i].it=true;}return r;};})();

  return {register:register,get:get,set:set,skill:skill,render:render,schemas:SCH,mount:mountAll};
})();
window.FreaModeSettings=FreaModeSettings;
