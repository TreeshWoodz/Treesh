/* ===================== FREA! PLUS — SETTINGS 2.0 =====================
   One clear structure instead of a long accordion:
     🎮 Game    : pick a mode, see what it is, then only that mode's rules (Match · mode rules · Rivals · Gameplay)
     🏗 Arena   : layout, platform count/shapes/motion, platform style previews
     🖥 Display : performance, accessibility, themed/basic graphics
     🎨 Theme   : accent colour
   Mode gear buttons jump straight to Game for that mode.
   Also adds global Gameplay options (all modes): Power-ups, Jump Power, Gravity, Screen Shake. */
var FreaGameplay=(function(){
  var K='frea_gameplay',D={pu:'normal',jump:'normal',grav:'normal',shake:'on'};
  function load(){var o={};try{o=JSON.parse(localStorage.getItem(K)||'{}')||{};}catch(e){}var r={};Object.keys(D).forEach(function(k){r[k]=o[k]||D[k];});return r;}
  var C=load();function get(k){return C[k];}function set(k,v){C[k]=v;try{localStorage.setItem(K,JSON.stringify(C));}catch(e){}}
  var BASE={grav:GRAV,sling:SLING_POWER,pmax:PLAYER_MAX};
  function apply(){var j=C.jump==='soft'?0.88:C.jump==='super'?1.15:1,g=C.grav==='moon'?0.72:C.grav==='heavy'?1.25:1;
    GRAV=BASE.grav*g;SLING_POWER=BASE.sling*j*Math.sqrt(g);PLAYER_MAX=BASE.pmax*j*Math.sqrt(g);}
  /* screen shake toggle without touching every shake call */
  try{var sh=camera.shake||0;Object.defineProperty(camera,'shake',{configurable:true,get:function(){return sh;},set:function(v){sh=C.shake==='off'?0:v;}});}catch(e){}
  var _sg=startGame;startGame=function(){try{apply();}catch(e){}return _sg.apply(this,arguments);};
  return {get:get,set:set,apply:apply,puRate:function(){return C.pu==='off'?0:C.pu==='lots'?0.5:C.pu==='few'?1.8:1;},defaults:D};
})();
window.FreaGameplay=FreaGameplay;

(function(){
  var modal=document.getElementById('settings-modal');if(!modal)return;
  var sec=modal.querySelector('.pm-section[data-ssec="settings"]'),body=sec&&sec.querySelector('.m-body');if(!body)return;
  function el(id){return document.getElementById(id);}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  modal.classList.add('sm-v2');
  var TABS=[['game','🎮','Game','sg-mode'],['arena','🏗','Arena','sg-arena'],['display','🖥','Display','sg-display'],['theme','🎨','Theme','sg-theme']];
  var cur='game';try{cur=sessionStorage.getItem('frea_sm_tab')||'game';}catch(e){}
  var nav=document.createElement('div');nav.className='sm-nav';nav.id='sm-nav';nav.setAttribute('role','tablist');nav.setAttribute('data-testid','settings-nav');
  nav.innerHTML=TABS.map(function(t){return '<button class="sm-nav-b" role="tab" data-smtab="'+t[0]+'" data-testid="settings-nav-'+t[0]+'"><span class="sm-nav-i" aria-hidden="true">'+t[1]+'</span><span>'+t[2]+'</span></button>';}).join('');
  body.insertBefore(nav,body.firstChild);
  var title=sec.querySelector('.m-title');if(title)title.innerHTML='Game <span>Settings</span>';
  /* mode picker + hero belong to the Game tab */
  var tabs=el('settings-tabs'),hero=document.createElement('div');hero.className='sm-hero';hero.id='sm-hero';hero.setAttribute('data-testid','settings-mode-hero');
  var pick=document.createElement('div');pick.className='sm-pick';pick.id='sm-pick';pick.innerHTML='<div class="sm-cap">Choose a mode</div>';
  if(tabs){tabs.parentNode.insertBefore(pick,tabs);pick.appendChild(tabs);}
  pick.parentNode.insertBefore(hero,pick.nextSibling);
  function info(m){var d={};try{d=(window.FreaHud&&FreaHud.info(m))||{};}catch(e){}var mi=(typeof MODE_INTRO!=='undefined'&&MODE_INTRO[m])||{};
    var img=(window.FREA_ART&&FREA_ART[m])||mi.img||'';return {name:mi.name||d.name||m,sub:mi.sub||d.goal||'',ico:d.ico||mi.ico||'◎',img:img,col:d.col||'#2de2ff'};}
  function renderHero(){var m=typeof gameMode!=='undefined'?gameMode:'classic',d=info(m);
    hero.style.setProperty('--hc',d.col);
    hero.innerHTML=(d.img?'<img class="sm-hero-img" alt="" src="'+d.img+'">':'<div class="sm-hero-img sm-hero-ico">'+d.ico+'</div>')+
      '<div class="sm-hero-t"><div class="sm-hero-k">Now editing</div><div class="sm-hero-n" data-testid="settings-mode-name">'+esc(d.name)+'</div><div class="sm-hero-s">'+esc(d.sub)+'</div></div>'+
      '<button class="sm-reset" data-testid="settings-reset-mode" title="Reset this mode to default rules">↺ Defaults</button>';}
  hero.addEventListener('click',function(e){if(!e.target.closest('.sm-reset'))return;var m=gameMode;try{localStorage.removeItem('frea_xm_'+m);}catch(x){}try{FreaModeSettings.render();}catch(x){}try{flash(info(m).name+' rules reset','#c6ff3d');}catch(x){}});
  /* headings inside the Game group */
  var gb=document.querySelector('#sg-mode .sgroup-b');
  if(gb&&!gb.querySelector('.sm-match-h')){var mh=document.createElement('div');mh.className='xm-head sm-match-h';mh.textContent='Match';gb.insertBefore(mh,gb.firstChild);}
  /* global gameplay block */
  var GP=[{k:'pu',l:'Power-ups',sub:'How often pickups appear in modes that have them',o:[['off','Off'],['few','Few'],['normal','Normal'],['lots','Lots']]},
    {k:'jump',l:'Jump Power',sub:'Slingshot strength for every flea',o:[['soft','Soft'],['normal','Normal'],['super','Super']]},
    {k:'grav',l:'Gravity',sub:'Moon = floaty, long hang time',o:[['moon','Moon'],['normal','Normal'],['heavy','Heavy']]},
    {k:'shake',l:'Screen Shake',o:[['on','On'],['off','Off']]}];
  var gp=document.createElement('div');gp.id='sm-gameplay';gp.setAttribute('data-testid','settings-gameplay');
  function renderGP(){gp.innerHTML='<div class="xm-head">Gameplay · all modes</div>'+GP.map(function(r){var v=FreaGameplay.get(r.k);return '<div class="setting-row xm-row"><div class="section-label"><span>'+r.l+'</span>'+(r.sub?'<small class="xm-sub">'+r.sub+'</small>':'')+'</div><div class="layout-row" style="flex-wrap:wrap">'+
    r.o.map(function(p){var on=p[0]===v;return '<button class="lbtn'+(on?' active':'')+'" data-gp="'+r.k+'" data-gv="'+p[0]+'" data-testid="gp-'+r.k+'-'+p[0]+'" aria-pressed="'+on+'">'+p[1]+'</button>';}).join('')+'</div></div>';}).join('');}
  gp.addEventListener('click',function(e){var b=e.target.closest('[data-gp]');if(!b)return;FreaGameplay.set(b.dataset.gp,b.dataset.gv);renderGP();});
  if(gb){gb.appendChild(gp);renderGP();}
  function keepGPLast(){if(gb&&gp.parentNode===gb&&gb.lastChild!==gp)gb.appendChild(gp);}
  /* tab switching */
  function show(t){cur=t;try{sessionStorage.setItem('frea_sm_tab',t);}catch(e){}
    nav.querySelectorAll('.sm-nav-b').forEach(function(b){var on=b.dataset.smtab===t;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});
    TABS.forEach(function(x){var g=el(x[3]);if(!g)return;var on=x[0]===t;g.classList.toggle('sm-on',on);if(on)g.classList.add('open');});
    pick.style.display=hero.style.display=t==='game'?'':'none';
    if(t==='game'){renderHero();keepGPLast();}
    if(t==='arena'){try{FreaPlatPreview.refresh();}catch(e){}}
    body.scrollTop=0;}
  nav.addEventListener('click',function(e){var b=e.target.closest('.sm-nav-b');if(b)show(b.dataset.smtab);});
  nav.addEventListener('keydown',function(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;var i=TABS.map(function(t){return t[0];}).indexOf(cur),n=TABS[(i+(e.key==='ArrowRight'?1:TABS.length-1))%TABS.length][0];show(n);var b=nav.querySelector('[data-smtab="'+n+'"]');if(b)b.focus();});
  var _os=openSettings;openSettings=function(s){var r=_os.apply(this,arguments);show(cur);return r;};
  var _om=openModeSettings;openModeSettings=function(m){cur='game';var r=_om.apply(this,arguments);show('game');return r;};
  var _ss=syncSettingsUI;syncSettingsUI=function(){var r=_ss.apply(this,arguments);try{if(cur==='game')renderHero();keepGPLast();
      /* extra modes own their Round Length row: hide the duplicate Capture slider */
      var tr=el('timer-row');if(tr&&FreaModeSettings.schemas[gameMode]&&FreaModeSettings.schemas[gameMode].some(function(x){return x.k==='time';}))tr.style.display='none';}catch(e){}return r;};
  show(cur);
  window.FreaSettingsUI={show:show,tab:function(){return cur;}};
})();
