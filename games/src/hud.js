/* ===================== FREA! PLUS — UNIFIED HUD =====================
   One consistent HUD for every mode: mode banner (icon · name · one-line goal · party round),
   a "How to play" card on the intro splash, and a cleaner results screen. */
var Hud=(function(){
  var TAP='Tap to hop · drag back & release to fling';
  var INFO={
    classic:{ico:'◎',name:'Capture',goal:'Hold the orb to fill your ring first',col:'#2de2ff',how:['Grab the glowing orb','Keep it away from rivals until your ring hits 100%']},
    race:{ico:'🏁',name:'Race',goal:'First to the orb at the top wins',col:'#c6ff3d',how:['Climb the tower of platforms','Touch the orb at the very top to win']},
    survival:{ico:'🔥',name:'Burning Orb',goal:'Pass the hot orb before it blows',col:'#ff7a1a',how:['Whoever holds the orb has a 10s fuse','Bump into a rival to pass it on. Last flea left wins']},
    tag:{ico:'🦠',name:'Infectious',goal:'Last safe flea wins',col:'#39ff7a',how:['After 10s one flea gets infected','Infected? Tag others. Still safe? Run!']},
    hns:{ico:'🫣',name:'Hide & Seek',goal:'Hide as a prop or find every hider',col:'#9b6bff',how:['Hider: move to a spot and you become a prop','Seeker: bump into props to unmask hiders']},
    hoops:{ico:'🏀',name:'Hoops',goal:'Jump through the hoop. A swish is worth 3',col:'#ff7a1a',how:['Fling up and drop through the hoop from above','A clean swish scores 3 points. Most points wins']},
    zen:{ico:'🧘',name:'Zen',goal:'No rules. Just vibes',col:'#9b6bff',how:['Add fleas, props and worlds from the dock','No timer. Relax and play']},
    koth:{how:['Stand inside the glowing zone','Alone it fills fast, shared it fills slowly. The zone moves every 13s']},
    lava:{how:['The lava starts rising after 3 seconds','Flashing platforms crumble, so keep hopping higher']},
    stars:{how:['Gold star +1, green mega star +5','Pink spiky stars sting you: −3 and a short stun']},
    redlight:{how:['Move toward FINISH while the light is green','Freeze on red. Moving sends you back!']},
    freeze:{how:['IT (blue ring) freezes anyone it touches','Touch frozen friends to set them free']}
  };
  try{var X=window.FreaModes&&FreaModes.info;if(X)Object.keys(X).forEach(function(k){var d=X[k];INFO[k]=Object.assign({ico:d.ico,name:d.name,goal:d.desc,col:d.mc},INFO[k]||{});});}catch(e){}
  function info(k){return INFO[k]||{ico:'◎',name:k,goal:'',col:'#2de2ff',how:[]};}
  function el(id){return document.getElementById(id);}
  function party(){try{return window.FreaParty&&FreaParty.status();}catch(e){return null;}}
  function goalNow(){var d=info(gameMode);
    if(gameMode==='hns'&&player){return hnsSeeker===player?'You are the SEEKER: bump props to find hiders':'You are a HIDER: pick a spot and stay hidden';}
    if(gameMode==='freeze'&&player){return player.it?'You are IT: freeze every flea':'Run from IT. Rescue frozen friends';}
    return d.goal;}

  /* ---------- mode banner ---------- */
  var bn=document.createElement('div');bn.id='mode-banner';bn.setAttribute('data-testid','mode-banner');
  bn.innerHTML='<span class="mb-ico" data-testid="mode-banner-icon"></span><span class="mb-txt"><b class="mb-name" data-testid="mode-banner-name"></b><small class="mb-goal" data-testid="mode-banner-goal"></small></span><span class="mb-round" data-testid="mode-banner-round"></span>';
  document.body.appendChild(bn);
  var compactT=null;
  function showBanner(){if(gameMode==='tutorial'){bn.classList.remove('show');return;}var d=info(gameMode),p=party();
    bn.style.setProperty('--mb',d.col);bn.querySelector('.mb-ico').textContent=d.ico;bn.querySelector('.mb-name').textContent=d.name;bn.querySelector('.mb-goal').textContent=goalNow();
    var r=bn.querySelector('.mb-round');if(p){r.textContent='Round '+(p.idx+1)+'/'+p.rounds;r.style.display='';}else r.style.display='none';
    bn.classList.remove('compact');bn.classList.add('show');clearTimeout(compactT);compactT=setTimeout(function(){bn.classList.add('compact');},7000);}
  function hideBanner(){bn.classList.remove('show');clearTimeout(compactT);}
  bn.addEventListener('pointerdown',function(){bn.classList.toggle('compact');});

  /* ---------- how-to card on the intro splash ---------- */
  var inner=document.querySelector('#mode-intro .mi-inner');
  if(inner){var how=document.createElement('div');how.id='mi-how';how.setAttribute('data-testid','mode-intro-howto');
    var sub=el('mi-sub');if(sub&&sub.nextSibling)inner.insertBefore(how,sub.nextSibling);else inner.appendChild(how);
    var pb=document.createElement('div');pb.id='mi-party';pb.setAttribute('data-testid','mode-intro-party');var nm=el('mi-name');inner.insertBefore(pb,nm);}
  MI_MS=5200;
  var _smi=showModeIntro;showModeIntro=function(cb){
    var d=info(gameMode),h=el('mi-how'),p=party(),pb=el('mi-party');
    if(h){var steps=[TAP].concat(d.how||[]);h.innerHTML='<div class="mh-t">How to play</div>'+steps.map(function(s,i){return '<div class="mh-s"><b style="--mb:'+d.col+'">'+(i+1)+'</b><span>'+s+'</span></div>';}).join('');}
    if(pb){if(p){pb.style.display='';pb.innerHTML='<span>PARTY</span> Round '+(p.idx+1)+' of '+p.rounds;}else pb.style.display='none';}
    var go=document.querySelector('#mode-intro .mi-go');if(go)go.textContent='TAP ANYWHERE TO START';
    return _smi.apply(this,arguments);};

  /* ---------- hooks ---------- */
  var _sg=startGame;startGame=function(){var r=_sg.apply(this,arguments);showBanner();return r;};
  var _tl=toLobby;toLobby=function(){hideBanner();return _tl.apply(this,arguments);};
  /* goal line follows role changes (HnS seeker/hider, Freeze Tag IT) */
  setInterval(function(){var live=(STATE==='play'||STATE==='countdown')&&!!player;if(!bn.classList.contains('show')){if(live&&gameMode!=='tutorial'&&document.getElementById('hud').style.display!=='none')showBanner();return;}if(!live){hideBanner();return;}var g=bn.querySelector('.mb-goal'),t=goalNow();if(g.textContent!==t)g.textContent=t;},600);

  /* ---------- cleaner results screen ---------- */
  var ev=el('end-view');var chips=document.createElement('div');chips.id='end-chips';chips.setAttribute('data-testid','end-chips');
  var es=el('end-sub');if(ev&&es)es.parentNode.insertBefore(chips,es.nextSibling);
  var again=el('again-btn'),menu=el('menu-btn');if(again&&menu){var row=document.createElement('div');row.className='end-actions';again.parentNode.insertBefore(row,again);row.appendChild(again);row.appendChild(menu);again.setAttribute('data-testid','end-play-again-btn');menu.setAttribute('data-testid','end-lobby-btn');}
  var t0=0;var _sg2=startGame;startGame=function(){t0=Date.now();return _sg2.apply(this,arguments);};
  function stat(){var p=player;if(!p)return '';var m=gameMode;
    if(m==='classic'||m==='hoops')return (p.matchPoints||0)+' pts';
    if(m==='koth')return Math.floor(p.hill||0)+'% hill';if(m==='stars')return (p.starPts||0)+' stars';
    if(m==='redlight')return Math.floor(p.rlProg||0)+'% of the course';if(m==='freeze')return p.it?'Played IT':((p.rescues||0)+' rescues');
    if(m==='lava'||m==='survival')return playerDead?'Knocked out':'Survived';if(m==='tag')return p.infected?'Got infected':'Stayed safe';
    if(m==='hns')return hnsSeeker===p?'Seeker · '+hnsFound+'/'+hnsTotal+' found':(p.found?'Found!':'Stayed hidden');return '';}
  var _eg=endGame;endGame=function(w){var live=(STATE==='play'||STATE==='countdown')&&!!player;var d=info(gameMode),st=live?stat():'',dur=Math.max(0,Math.round((Date.now()-t0)/1000));
    hideBanner();var r=_eg.apply(this,arguments);
    if(live&&gameMode!=='zen'){chips.innerHTML='<span class="ec" style="--mb:'+d.col+'"><i>'+d.ico+'</i>'+d.name+'</span><span class="ec"><i>⏱</i>'+Math.floor(dur/60)+':'+('0'+dur%60).slice(-2)+'</span>'+(st?'<span class="ec me"><i>★</i>'+st+'</span>':'');chips.style.display='';}
    else chips.style.display='none';return r;};
  return {info:info,all:INFO,show:showBanner,hide:hideBanner};
})();
window.FreaHud=Hud;
