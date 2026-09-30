/* =====================================================================
   POLISH — Treesh profile in-game, Trophy Room tab, lobby trophy button,
   richer stats, test hooks.
   ===================================================================== */
MODE_LABEL.hns='Hide & Seek';MODE_LABEL.hoops='Hoops';MODE_LABEL.tutorial='Tutorial';
MODE_EMOJI.hns='🫥';MODE_EMOJI.hoops='🏀';
['pointsByMode','matchesByMode','winsByMode'].forEach(function(k){if(STATS[k]){if(STATS[k].hns==null)STATS[k].hns=0;if(STATS[k].hoops==null)STATS[k].hoops=0;}});

var FreaProfile=(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function avatarHTML(cls){var a=Treesh.avatar();if(a)return '<img class="'+cls+'" src="'+esc(a)+'" alt="" referrerpolicy="no-referrer" onerror="this.style.visibility=\'hidden\'">';var n=Treesh.nickname()||'?';return '<span class="'+cls+' tp-initial">'+esc(n.charAt(0).toUpperCase())+'</span>';}
  function lobby(){
    var nick=Treesh.nickname(),nm=document.getElementById('ltop-name');if(nm&&nick)nm.textContent=nick;
    var pa=document.querySelector('.pc-ava');if(pa){var img=pa.querySelector('.tp-ava');var a=Treesh.avatar();
      if(a){if(!img){img=document.createElement('img');img.className='tp-ava';img.alt='';img.referrerPolicy='no-referrer';img.onerror=function(){this.remove();pa.classList.remove('has-treesh');};pa.appendChild(img);}if(img.getAttribute('src')!==a)img.setAttribute('src',a);pa.classList.add('has-treesh');}
      else if(img){img.remove();pa.classList.remove('has-treesh');}}
    var lv=document.getElementById('ltop-lvlval');if(lv)lv.textContent=Treesh.fmt(Treesh.points());
    var lvl=Treesh.level(),badge=document.getElementById('ltop-lvbadge');var pl=document.querySelector('.pc-lvl');
    if(pl&&!badge){badge=document.createElement('span');badge.id='ltop-lvbadge';badge.className='pc-lvbadge';pl.insertBefore(badge,pl.firstChild);}
    if(badge)badge.textContent='Lv '+lvl.lvl;
    var tn=document.getElementById('ltop-trophy-n');if(tn)tn.textContent=Object.keys(Trophies.unlocked()).length;
  }
  function header(){
    var p=Treesh.profile(),lvl=Treesh.level(),st=Treesh.stars(),nick=Treesh.nickname()||'Guest Flea';
    var mine=(st.log||[]).filter(function(e){return e&&e.src==='frea';}).slice(0,5);
    var got=Object.keys(Trophies.unlocked()).length;
    return '<div class="tp-card" data-testid="treesh-profile-card"><div class="tp-row">'+avatarHTML('tp-big')+
      '<div class="tp-info"><div class="tp-nick" data-testid="treesh-profile-name">'+esc(nick)+(Treesh.isBirthday()?' 🎂':'')+'</div>'+
      '<div class="tp-sub">'+(p?(p.zodiac?esc(p.zodiac)+' · ':'')+'Treesh profile':'Play inside Treesh to sync your profile')+'</div>'+
      '<div class="tp-lvl"><b>Lv '+lvl.lvl+'</b><div class="tp-bar"><i style="width:'+Math.round(lvl.pct*100)+'%"></i></div><small>'+lvl.xp+' / '+lvl.next+' XP</small></div></div></div>'+
      '<div class="tp-chips"><span data-testid="profile-starlites"><b>✦ '+Treesh.fmt(st.points)+'</b><small>Starlites</small></span><span><b>🏆 '+got+'/'+Trophies.list.length+'</b><small>Trophies</small></span><span><b>📅 '+Treesh.streak()+'</b><small>Day streak</small></span><span><b>🪙 '+Treesh.fmt(Treesh.earned())+'</b><small>Earned in FREA!</small></span></div>'+
      (mine.length?'<div class="tp-log"><div class="tp-lt">Recent Starlites</div>'+mine.map(function(e){return '<div class="tp-le"><span>'+esc(String(e.r||'').replace(/^FREA! · /,''))+'</span><b class="'+(e.a<0?'neg':'')+'">'+(e.a>0?'+':'')+e.a+'</b></div>';}).join('')+'</div>':'')+
      '<div class="tp-how"><b>How to earn ✦</b> Play matches (+10) · Win (+40) · First win per mode each day (+25) · Mode bonuses · Trophies (+25–250) · Daily streak · Happy Flea House</div></div>';
  }
  var _rs=renderStats;
  renderStats=function(){_rs();var b=document.getElementById('stats-body');if(!b)return;
    var extra='<div class="stat-section">Hide &amp; Seek · Hoops</div>';
    ['hns','hoops'].forEach(function(m){extra+='<div class="mode-stat-row"><span class="msn">'+MODE_EMOJI[m]+' '+MODE_LABEL[m]+'</span><span class="msv">'+((STATS.matchesByMode||{})[m]||0)+' played · '+((STATS.winsByMode||{})[m]||0)+' wins</span></div>';});
    extra+='<div class="mode-stat-row"><span class="msn">🏀 Hoops scored</span><span class="msv">'+(STATS.hoopsScored||0)+' · '+(STATS.hoopsSwishes||0)+' swishes</span></div><div class="mode-stat-row"><span class="msn">🔎 Hiders found</span><span class="msv">'+(STATS.hnsFinds||0)+'</span></div>';
    b.innerHTML=header()+b.innerHTML+extra;};
  function addTrophyTab(){
    var tabs=document.querySelector('#profile-modal .pm-tabs');if(!tabs||document.querySelector('#profile-modal .pm-tab[data-section="trophies"]'))return;
    var t=document.createElement('button');t.className='pm-tab';t.setAttribute('data-section','trophies');t.setAttribute('data-testid','pm-tab-trophies');t.textContent='🏆 Trophies';tabs.insertBefore(t,tabs.children[1]||null);
    var sec=document.createElement('div');sec.className='pm-section';sec.setAttribute('data-section','trophies');sec.innerHTML='<div class="m-body" id="trophy-body" data-testid="trophy-room"></div><div class="cust-done-wrap"><button class="btn" id="trophy-done" data-testid="trophy-done">Done</button></div>';
    var first=document.querySelector('#profile-modal .pm-section');first.parentNode.insertBefore(sec,first.nextSibling);
    t.addEventListener('click',function(){pmShow('trophies');});
    document.getElementById('trophy-done').addEventListener('click',closeCust);
  }
  var _pm=pmShow;pmShow=function(sec){_pm(sec);if(sec==='trophies')Trophies.render();};
  function lobbyTrophyBtn(){
    var host=document.querySelector('.ltop-right');if(!host||document.getElementById('ltop-trophy'))return;
    var b=document.createElement('button');b.className='ltop-trophy';b.id='ltop-trophy';b.setAttribute('data-testid','ltop-trophies');b.title='Trophy Room';
    b.innerHTML='<span>🏆</span><b id="ltop-trophy-n">'+Object.keys(Trophies.unlocked()).length+'</b>';host.insertBefore(b,host.firstChild);
    b.addEventListener('click',function(){custModal.classList.add('open');pmShow('trophies');});
  }
  if(typeof updateLobbyProfile==='function'){var _ulp=updateLobbyProfile;updateLobbyProfile=function(){_ulp.apply(this,arguments);lobby();};}
  function refresh(){try{lobby();Treesh.paint();}catch(e){}}
  addTrophyTab();lobbyTrophyBtn();setTimeout(refresh,50);Treesh.onChange(function(){refresh();});setInterval(refresh,8000);
  return {refresh:refresh};
})();
window.FreaProfile=FreaProfile;

/* ===== debug / test hooks ===== */
window.__frea={Flea:Flea,makeAI:function(n,x,y){return makeAI(n,x,y);},cast:function(){return window.FREA_CAST;},withCtx:function(c,fn){var s=ctx;ctx=c;try{fn();}finally{ctx=s;}},
  state:function(){return {STATE:STATE,mode:gameMode,stars:Treesh.points(),fleas:fleas.length,trophies:Object.keys(Trophies.unlocked()).length};},names:function(){return AI_NAMES.slice();},
  Furni:Furni,House:House,Trophies:Trophies,Treesh:Treesh,setMode:function(m){gameMode=m;try{syncModeChips();}catch(e){}},endMatch:function(win){endGame(win?player:(fleas.find(function(f){return !f.isP;})||null));},start:function(){startGame();}};
