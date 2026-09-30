/* =====================================================================
   TROPHIES + STARLITE REWARDS
   - 55 trophies across every mode (bronze/silver/gold/platinum)
   - each unlock pays Starlites into the shared Treesh wallet (once)
   - end-of-match reward breakdown on the results screen
   ===================================================================== */
var Trophies=(function(){
  var UK='frea_trophies_v1',CK='frea_trophy_c_v1',DK='frea_earn_day_v1';
  var U=Treesh.get(UK,{}),C=Treesh.get(CK,{});
  function saveU(){Treesh.set(UK,U);}function saveC(){Treesh.set(CK,C);}
  var TIER={bronze:{c:'#e39a5b',s:25,n:'Bronze'},silver:{c:'#cfd8e6',s:50,n:'Silver'},gold:{c:'#ffd23d',s:100,n:'Gold'},platinum:{c:'#9fe8ff',s:250,n:'Platinum'}};
  function S(k){return (typeof STATS!=='undefined'&&STATS[k])||0;}
  function W(m){return (STATS.winsByMode&&STATS.winsByMode[m])||0;}
  function c(k){return C[k]||0;}
  var MODES=[['all','All','🏆'],['general','General','⭐'],['classic','Capture','◎'],['race','Race','🏁'],['survival','Burning Orb','🔥'],['tag','Infectious','🦠'],['hns','Hide & Seek','🫥'],['hoops','Hoops','🏀'],['zen','Zen Sandbox','🧘'],['house','Flea House','🏠']];
  var LIST=[
    /* general */
    ['first_hop','general','bronze','👣','First Hop','Play your first match',function(){return [S('matchesPlayed'),1];}],
    ['regular','general','silver','🎮','Regular','Play 25 matches',function(){return [S('matchesPlayed'),25];}],
    ['veteran','general','gold','🎖️','Veteran Flea','Play 100 matches',function(){return [S('matchesPlayed'),100];}],
    ['slinger','general','silver','🏹','Slingshot Pro','Launch 500 times',function(){return [S('totalLaunches'),500];}],
    ['family','general','bronze','👪','Flea Family','Create 5 custom fleas',function(){return [(typeof saved!=='undefined'?saved.length:0),5];}],
    ['grad','general','bronze','🎓','Graduate','Finish the tutorial',function(){return [S('tutorialsDone'),1];}],
    ['marathon','general','gold','⏳','Marathon','Play for 1 hour in total',function(){return [Math.floor(S('playMs')/60000),60];}],
    ['streak7','general','gold','📅','Week Streak','Play FREA! 7 days in a row',function(){return [Math.max(c('bestStreak'),Treesh.streak()),7];}],
    ['allround','general','platinum','👑','All-Rounder','Win in all 6 competitive modes',function(){return [['classic','race','survival','tag','hns','hoops'].filter(function(m){return W(m)>0;}).length,6];}],
    /* capture */
    ['cap_1','classic','bronze','◎','Orb Grabber','Win a Capture match',function(){return [W('classic'),1];}],
    ['cap_5','classic','silver','💠','Orb Hoarder','Win 5 Capture matches',function(){return [W('classic'),5];}],
    ['cap_orbs','classic','silver','🔮','Orb Magnet','Grab 100 orbs',function(){return [S('orbsCaptured'),100];}],
    ['cap_rounds','classic','gold','🌀','Ring Master','Win 25 rounds',function(){return [S('roundsWon'),25];}],
    ['cap_hat','classic','gold','🎩','Hat Trick','Win 3 rounds in one match',function(){return [c('capBestRounds'),3];}],
    /* race */
    ['race_1','race','bronze','🏁','Off the Line','Win a Race',function(){return [W('race'),1];}],
    ['race_5','race','silver','🧗','Tower Climber','Win 5 Races',function(){return [W('race'),5];}],
    ['race_fast','race','gold','⚡','Speed Demon','Win a Race in under 30s',function(){return [c('raceFast30'),1];}],
    ['race_20','race','platinum','🚀','Sky Sprinter','Win 20 Races',function(){return [W('race'),20];}],
    /* burning orb */
    ['surv_1','survival','bronze','🔥','Fireproof','Win Burning Orb',function(){return [W('survival'),1];}],
    ['surv_5','survival','silver','🧯','Cool Under Fire','Win 5 Burning Orb matches',function(){return [W('survival'),5];}],
    ['surv_50','survival','gold','💥','Hot Potato','Outlast 50 burns',function(){return [S('survivalEliminations'),50];}],
    ['surv_crowd','survival','gold','🏟️','Last Flea Standing','Win vs 8+ opponents',function(){return [c('survCrowd'),1];}],
    /* infectious */
    ['tag_1','tag','bronze','🦠','Immune','Win an Infectious match',function(){return [W('tag'),1];}],
    ['tag_pz','tag','silver','🧪','Patient Zero','Infect 5 fleas in one match',function(){return [c('tagBest'),5];}],
    ['tag_100','tag','gold','☣️','Outbreak','Infect 100 fleas',function(){return [S('lifetimeInfected'),100];}],
    ['tag_5','tag','silver','🛡️','Untouchable','Win 5 Infectious matches',function(){return [W('tag'),5];}],
    /* hide & seek */
    ['hns_1','hns','bronze','🫥','Now You See Me','Win a Hide & Seek match',function(){return [W('hns'),1];}],
    ['hns_seek','hns','silver','🔎','Sharp Eyes','Find 25 hiders',function(){return [S('hnsFinds'),25];}],
    ['hns_ghost','hns','gold','👻','Ghost','Escape as a hider 3 times',function(){return [c('hnsHiderWins'),3];}],
    ['hns_sweep','hns','gold','🧹','Clean Sweep','Win as the seeker',function(){return [c('hnsSeekerWins'),1];}],
    /* hoops */
    ['hoop_1','hoops','bronze','🏀','Nothing But Net','Score your first hoop',function(){return [S('hoopsScored'),1];}],
    ['hoop_50','hoops','silver','🔥','Heating Up','Score 50 hoops',function(){return [S('hoopsScored'),50];}],
    ['hoop_swish','hoops','gold','💫','Swish Collector','Land 10 swishes',function(){return [S('hoopsSwishes'),10];}],
    ['hoop_win','hoops','silver','🏆','Court Champ','Win a Hoops match',function(){return [W('hoops'),1];}],
    /* zen sandbox */
    ['zen_spawn','zen','bronze','🐣','Flea Farmer','Spawn 10 Zen fleas',function(){return [S('fleasSpawnedZen'),10];}],
    ['zen_build','zen','silver','🧱','Architect','Place 50 Zen objects',function(){return [S('objectsPlaced'),50];}],
    ['zen_party','zen','gold','🎉','Block Party','Have 15 fleas in Zen at once',function(){return [S('peakZenFleas'),15];}],
    ['zen_emote','zen','silver','💬','Chatterbug','Send 50 emotes',function(){return [S('emoteInteractions'),50];}],
    /* flea house */
    ['h_move','house','bronze','🛋️','Moving In','Place your first furniture',function(){return [c('h_placed'),1];}],
    ['h_decor','house','silver','🖼️','Interior Designer','Place 40 furniture items',function(){return [c('h_placed'),40];}],
    ['h_shop','house','bronze','🛍️','Shopaholic','Buy 10 items with Starlites',function(){return [c('h_bought'),10];}],
    ['h_paint','house','bronze','🎨','Fresh Coat','Repaint walls or floors 5 times',function(){return [c('h_paint'),5];}],
    ['h_snack','house','bronze','🍓','Snack Time','Fleas eat 20 snacks',function(){return [c('h_eat'),20];}],
    ['h_nap','house','silver','😴','Sweet Dreams','Fleas take 15 naps',function(){return [c('h_sleep'),15];}],
    ['h_happy','house','gold','💖','Happy Home','Every resident above 80% mood',function(){return [c('h_happy'),1];}],
    ['h_rooms','house','gold','🏡','Dream Home','Furnish every room (3+ items each)',function(){return [c('h_rooms'),1];}],
    ['h_upstairs','house','silver','🪜','Moving On Up','Unlock the upstairs floor',function(){return [c('h_upstairs'),1];}],
    ['h_party','house','platinum','🪩','House Party','Have 6 residents hang out together',function(){return [c('h_party'),1];}],
    /* backyard garden + seasonal packs */
    ['h_green','house','bronze','🌱','Green Thumb','Harvest your first crop',function(){return [c('h_harvest'),1];}],
    ['h_farmer','house','gold','🧺','Master Gardener','Harvest 50 crops',function(){return [c('h_harvest'),50];}],
    ['h_rain','house','silver','💧','Rain Maker','Water plants 40 times',function(){return [c('h_water'),40];}],
    ['h_gourd','house','silver','🎃','Giant Gourd','Harvest a Moon Pumpkin',function(){return [c('h_pumpkin'),1];}],
    ['h_bloom','house','silver','🌻','Full Bloom','Grow crops in all 5 garden beds at once',function(){return [c('h_fullbed'),1];}],
    ['h_season','house','silver','✨','In Season','Buy 5 seasonal items',function(){return [c('h_seasonal'),5];}],
    ['h_allyear','house','gold','📅','All Year Round','Own items from 3 different seasonal packs',function(){return [c('h_packs'),3];}]
  ].map(function(a){return {id:a[0],mode:a[1],tier:a[2],ico:a[3],name:a[4],desc:a[5],fn:a[6]};});
  var BY={};LIST.forEach(function(t){BY[t.id]=t;});
  function prog(t){try{var r=t.fn();return [Math.min(r[0]||0,r[1]),r[1]];}catch(e){return [0,1];}}
  var queue=[],showing=false;
  function banner(t){
    queue.push(t);if(showing)return;showing=true;
    (function next(){var x=queue.shift();if(!x){showing=false;return;}
      var el=document.createElement('div');el.className='trophy-pop';el.setAttribute('data-testid','trophy-unlock-toast');
      var ti=TIER[x.tier];el.style.setProperty('--tc',ti.c);
      el.innerHTML='<div class="tp-medal"><span>'+x.ico+'</span></div><div class="tp-body"><div class="tp-k">'+ti.n+' Trophy Unlocked</div><div class="tp-n">'+x.name+'</div><div class="tp-d">'+x.desc+'</div></div><div class="tp-star">+'+ti.s+'<small>✦</small></div>';
      document.body.appendChild(el);requestAnimationFrame(function(){el.classList.add('in');});
      try{if(typeof sfx==='function')sfx('win');}catch(e){}
      setTimeout(function(){el.classList.remove('in');el.classList.add('out');setTimeout(function(){el.remove();next();},520);},3400);
    })();
  }
  var chkT=null;
  function check(){
    if(chkT)return;chkT=setTimeout(function(){chkT=null;
      var st=Treesh.streak();if(st>c('bestStreak')){C.bestStreak=st;saveC();}
      LIST.forEach(function(t){if(U[t.id])return;var p=prog(t);if(p[0]>=p[1]){U[t.id]=Date.now();saveU();Treesh.award(TIER[t.tier].s,'Trophy: '+t.name,{silent:true,kind:'trophy',icon:t.ico});banner(t);}});
      var b=document.getElementById('ltop-trophy-n');if(b)b.textContent=Object.keys(U).length;
    },250);
  }
  function count(k,a){C[k]=(C[k]||0)+(a==null?1:a);saveC();check();}
  function best(k,v){if(v>(C[k]||0)){C[k]=v;saveC();check();}}
  function flag(k){if(!C[k]){C[k]=1;saveC();check();}}

  /* ---------------- per-match tracking hooks ---------------- */
  var M=null;
  var _start=startGame;
  startGame=function(){_start.apply(this,arguments);M={mode:gameMode,t0:Date.now(),infects:0,burns:0,finds:0,hoop:0,rounds:0,opp:Math.max(0,fleas.length-1)};check();};
  var _inf=infect;infect=function(s,by){if(M&&by&&by.isP)M.infects++;return _inf.apply(this,arguments);};
  var _elim=eliminate;eliminate=function(f){if(M&&f!==player&&!playerDead)M.burns++;return _elim.apply(this,arguments);};
  var _er=endRound;endRound=function(w){if(M&&w&&w.isP)M.rounds++;return _er.apply(this,arguments);};
  var _bump=bump;bump=function(k,a){_bump(k,a);if(M){if(k==='hnsFinds')M.finds++;if(k==='hoopsScored')M.hoop++;}check();};
  var _bm=bumpMode;bumpMode=function(o,m,a){_bm(o,m,a);check();};

  function dayEarned(add){var d=Treesh.get(DK,{k:'',v:0,fw:{}});var tk=Treesh.dayKey();if(d.k!==tk)d={k:tk,v:0,fw:{}};if(add){d.v+=add;}Treesh.set(DK,d);return d;}
  var DAY_CAP=700;
  function result(winner){
    var mode=gameMode,won=!!(winner&&winner.isP);
    if(mode==='hns'&&hnsEndInfo){won=(hnsSeeker===player)?!!hnsEndInfo.seekerWon:(!hnsEndInfo.seekerWon&&!player.found);}
    if(mode==='hoops'&&hoopsEndInfo&&hoopsEndInfo.team)won=!!hoopsEndInfo.playerWon;
    var dur=M?Date.now()-M.t0:0;
    return {mode:mode,won:won,dur:dur,m:M||{},role:(mode==='hns'?(hnsSeeker===player?'seeker':'hider'):''),pts:player?(player.matchPoints||0):0,
      place:(function(){if(mode!=='classic'||!fleas.length)return 0;var r=fleas.slice().sort(function(a,b){return (b.matchPoints||0)-(a.matchPoints||0);});return r.indexOf(player)+1;})()};
  }
  function payout(R){
    var lines=[],add=function(n,l){n=Math.round(n);if(n>0)lines.push([n,l]);};
    if(R.mode==='zen'){var mins=Math.floor(R.dur/60000);var zd=Treesh.get('frea_zen_day_v1',{k:'',v:0});if(zd.k!==Treesh.dayKey())zd={k:Treesh.dayKey(),v:0};var z=Math.min(30-zd.v,Math.floor(mins/5)*5);if(z>0){zd.v+=z;Treesh.set('frea_zen_day_v1',zd);add(z,'Chill time ('+mins+' min)');}return lines;}
    if(R.mode==='tutorial')return lines;
    if(R.dur>=12000)add(10,'Match played');
    if(R.won){add(40,'Victory');var d=dayEarned(0);if(!d.fw[R.mode]){d.fw[R.mode]=1;Treesh.set(DK,d);add(25,'First win today');}}
    else if(R.place===2||R.place===3)add(15,'Podium finish (#'+R.place+')');
    var m=R.m;
    if(R.mode==='classic')add(Math.min(30,R.pts*2),'Match points');
    if(R.mode==='survival')add(Math.min(30,(m.burns||0)*3),'Burns survived');
    if(R.mode==='tag')add(Math.min(30,(m.infects||0)*4),'Fleas infected');
    if(R.mode==='hns')add(Math.min(30,(m.finds||0)*4),'Hiders found');
    if(R.mode==='hoops')add(Math.min(30,(m.hoop||0)*3),'Buckets');
    if(R.mode==='race'&&R.won&&R.dur<45000)add(15,'Speed bonus');
    var tot=lines.reduce(function(a,l){return a+l[0];},0),d2=dayEarned(0),room=Math.max(0,DAY_CAP-d2.v);
    if(tot>room){lines=room>0?[[room,'Daily cap reached']]:[];tot=room;}
    dayEarned(tot);return lines;
  }
  function stats(R){
    var m=R.m;
    if(R.mode==='hns'&&R.won){if(hnsEndInfo&&!hnsEndInfo.seekerWon)bumpMode('winsByMode','hns');if(R.role==='hider')count('hnsHiderWins');else count('hnsSeekerWins');}
    if(R.mode==='hoops'&&R.won&&hoopsEndInfo&&hoopsEndInfo.team)bumpMode('winsByMode','hoops');
    if(R.mode==='hoops'&&!(hoopsEndInfo&&hoopsEndInfo.team)&&R.won&&STATS.winsByMode&&!STATS.winsByMode.hoops){/* solo counted by base */}
    if(R.mode==='classic')best('capBestRounds',m.rounds||0);
    if(R.mode==='race'&&R.won&&R.dur<33000)flag('raceFast30');
    if(R.mode==='survival'&&R.won&&(m.opp||0)>=8)flag('survCrowd');
    if(R.mode==='tag')best('tagBest',m.infects||0);
  }
  var _end=endGame;
  endGame=function(winner){
    var live=(STATE==='play'||STATE==='countdown')&&!!player;var R=live?result(winner):null;
    _end.apply(this,arguments);
    if(!R)return;M=null;stats(R);
    var lines=payout(R),tot=lines.reduce(function(a,l){return a+l[0];},0);
    if(tot>0)Treesh.award(tot,(MODE_LABEL[R.mode]||R.mode)+(R.won?' victory':' match'),{silent:true,game:true});
    check();
    var tries=0;(function show(){var ev=document.getElementById('end-view');if(!ev||getComputedStyle(ev).display==='none'){if(++tries<40)setTimeout(show,120);return;}
      var sr=document.getElementById('star-reward');if(!sr)return;
      if(!tot){sr.style.display='none';return;}
      sr.innerHTML='<div class="sr-head"><span class="star-ico">✦</span> +'+tot+' Starlites</div><div class="sr-lines">'+lines.map(function(l){return '<span><i>'+l[1]+'</i><b>+'+l[0]+'</b></span>';}).join('')+'</div><div class="sr-bal">Treesh balance · '+Treesh.fmt(Treesh.points())+' ✦</div>';
      sr.style.display='flex';sr.classList.remove('pop');void sr.offsetWidth;sr.classList.add('pop');})();
  };

  /* ---------------- Trophy Room UI ---------------- */
  var filter='all';
  function render(host){
    host=host||document.getElementById('trophy-body');if(!host)return;
    var got=Object.keys(U).length,earned=LIST.reduce(function(a,t){return a+(U[t.id]?TIER[t.tier].s:0);},0);
    var h='<div class="tr-summary"><div class="trs-ring" style="--p:'+(got/LIST.length*100)+'%"><b>'+got+'</b><small>/'+LIST.length+'</small></div><div class="trs-info"><div class="trs-t">Trophy Room</div><div class="trs-s">'+earned.toLocaleString()+' ✦ earned from trophies</div><div class="trs-tiers">'+['bronze','silver','gold','platinum'].map(function(k){var n=LIST.filter(function(t){return t.tier===k;}),g=n.filter(function(t){return U[t.id];}).length;return '<span style="--tc:'+TIER[k].c+'"><i></i>'+g+'/'+n.length+'</span>';}).join('')+'</div></div></div>';
    h+='<div class="tr-chips">'+MODES.map(function(m){return '<button class="tr-chip'+(filter===m[0]?' on':'')+'" data-trf="'+m[0]+'" data-testid="trophy-filter-'+m[0]+'">'+m[2]+' '+m[1]+'</button>';}).join('')+'</div><div class="tr-grid">';
    LIST.filter(function(t){return filter==='all'||t.mode===filter;}).forEach(function(t){
      var p=prog(t),ok=!!U[t.id],ti=TIER[t.tier];
      h+='<div class="tr-card'+(ok?' got':'')+'" style="--tc:'+ti.c+'" data-testid="trophy-'+t.id+'"><div class="trc-medal"><span>'+t.ico+'</span></div><div class="trc-body"><div class="trc-n">'+t.name+'</div><div class="trc-d">'+t.desc+'</div>'+(ok?'<div class="trc-done">✓ Unlocked '+new Date(U[t.id]).toLocaleDateString(undefined,{month:'short',day:'numeric'})+'</div>':'<div class="trc-bar"><i style="width:'+(p[0]/p[1]*100)+'%"></i></div><div class="trc-p">'+p[0]+' / '+p[1]+'</div>')+'</div><div class="trc-r">'+ti.n+'<b>+'+ti.s+' ✦</b></div></div>';
    });
    host.innerHTML=h+'</div>';
    [].forEach.call(host.querySelectorAll('[data-trf]'),function(b){b.addEventListener('click',function(){filter=b.dataset.trf;render(host);});});
  }
  setTimeout(check,2500);
  return {list:LIST,unlocked:function(){return U;},check:check,count:count,best:best,flag:flag,render:render,tiers:TIER,modes:MODES,reset:function(){U={};C={};saveU();saveC();}};
})();
window.FreaTrophies=Trophies;
