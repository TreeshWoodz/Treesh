/* ===================== FREA! PLUS — PARTY MODE =====================
   Pick a playlist of modes (Zen excluded). Every round rotates to the next mode.
   Stable rival roster, party points (1st 3 · 2nd 2 · 3rd 1), next-up card, final podium. */
var Party=(function(){
  var ALL=['classic','race','survival','tag','hns','hoops','koth','lava','stars','redlight','freeze'];
  var KEY='frea_party_v1',SELK='frea_party_sel';
  function load(){try{var o=JSON.parse(localStorage.getItem(KEY)||'null');if(o&&Array.isArray(o.modes))return o;}catch(e){}return {modes:ALL.slice(),rounds:5,order:'shuffle',rivals:5};}
  var CFG=load();CFG.modes=CFG.modes.filter(function(m){return ALL.indexOf(m)>=0;});if(!CFG.modes.length)CFG.modes=ALL.slice();
  function save(){try{localStorage.setItem(KEY,JSON.stringify(CFG));}catch(e){}}
  var P=null,selected=false,autoIv=null,mounted=false;
  try{selected=localStorage.getItem(SELK)==='1';}catch(e){}
  function el(id){return document.getElementById(id);}
  function info(k){return window.FreaHud?FreaHud.info(k):{ico:'◎',name:k,goal:'',col:'#2de2ff'};}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  /* ---------------- lobby tile ---------------- */
  var tile=document.createElement('div');tile.className='mode-chip mode-card party-card';tile.dataset.mode='party';tile.setAttribute('data-testid','mode-card-party');tile.style.setProperty('--mc','#ff3db5');
  function tileHTML(){return '<div class="pc-glow"></div><div class="pt-body"><div class="pt-kicker">NEW · MIXED MODES</div><div class="pt-title">PARTY MODE</div><div class="pt-desc">A new game every round</div>'
    +'<div class="pt-icons" data-testid="party-tile-icons">'+CFG.modes.map(function(m){return '<span title="'+esc(info(m).name)+'">'+info(m).ico+'</span>';}).join('')+'</div></div>'
    +'<div class="pt-side"><span class="pt-rounds"><b>'+CFG.rounds+'</b>rounds</span><button class="pt-setup" data-testid="party-setup-open" aria-label="Party setup">⚙ Setup</button></div><span class="mc-check">✓</span>';}
  function renderTile(){tile.innerHTML=tileHTML();tile.classList.toggle('active',selected);var b=tile.querySelector('.pt-setup');if(b)b.addEventListener('click',function(e){e.stopPropagation();select(true);openSetup();});}
  function select(on){selected=on;try{localStorage.setItem(SELK,on?'1':'0');}catch(e){}tile.classList.toggle('active',on);
    if(on)document.querySelectorAll('#modes .mode-chip').forEach(function(c){if(c!==tile)c.classList.remove('active');});else syncModeChips();
    var pl=document.querySelector('#play-btn .pb-label');if(pl)pl.textContent=on?'START PARTY':'PLAY NOW';}
  tile.addEventListener('click',function(){if(selected)openSetup();else select(true);});
  function mount(){var g=el('modes');mounted=true;if(!g||g.contains(tile))return;g.insertBefore(tile,g.firstChild);renderTile();if(selected)select(true);}
  var _sm=setMode;setMode=function(m){_sm.apply(this,arguments);if(selected&&mounted)select(false);};
  var _smc=syncModeChips;syncModeChips=function(){_smc.apply(this,arguments);if(selected&&!P)select(true);};
  /* intercept PLAY while party is selected */
  document.addEventListener('click',function(e){if(!selected||P)return;var t=e.target.closest&&e.target.closest('#play-btn');if(!t)return;e.stopPropagation();e.preventDefault();openSetup();},true);

  /* ---------------- setup modal ---------------- */
  var ov=document.createElement('div');ov.id='party-setup';ov.setAttribute('data-testid','party-setup-modal');ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');document.body.appendChild(ov);
  function seg(name,vals,cur,lbl){return '<div class="ps-opt"><div class="ps-lbl">'+name+'</div><div class="ps-seg" role="radiogroup">'+vals.map(function(v,i){return '<button class="'+(String(v)===String(cur)?'on':'')+'" data-opt="'+name.toLowerCase()+'" data-v="'+v+'" data-testid="party-opt-'+name.toLowerCase()+'-'+v+'" role="radio" aria-checked="'+(String(v)===String(cur))+'">'+(lbl?lbl[i]:v)+'</button>';}).join('')+'</div></div>';}
  function renderSetup(){var n=CFG.modes.length;
    ov.innerHTML='<div class="ps-card"><button class="ps-close" data-testid="party-setup-close" aria-label="Close">✕</button>'
      +'<div class="ps-head"><div class="ps-kicker">PARTY MODE</div><div class="ps-title">Build your playlist</div><div class="ps-sub">Pick the games you want. Each round switches to the next one.</div></div>'
      +'<div class="ps-tools"><span class="ps-count" data-testid="party-selected-count"><b>'+n+'</b> of '+ALL.length+' games</span><span class="ps-tb"><button data-act="all" data-testid="party-select-all">Select all</button><button data-act="none" data-testid="party-select-none">Clear</button></span></div>'
      +'<div class="ps-grid">'+ALL.map(function(m){var d=info(m),on=CFG.modes.indexOf(m)>=0;return '<button class="ps-mode'+(on?' on':'')+'" style="--mb:'+d.col+'" data-k="'+m+'" aria-pressed="'+on+'" data-testid="party-mode-toggle-'+m+'"><span class="pm-ico">'+d.ico+'</span><span class="pm-txt"><b>'+esc(d.name)+'</b><small>'+esc(d.goal)+'</small></span><span class="pm-chk">✓</span></button>';}).join('')+'</div>'
      +'<div class="ps-opts">'+seg('Rounds',[3,5,8,12],CFG.rounds)+seg('Order',['shuffle','inorder'],CFG.order,['Shuffle','In order'])+seg('Rivals',[2,4,6,8],CFG.rivals)+'</div>'
      +'<div class="ps-warn" data-testid="party-setup-warning">'+(n<2?'Pick at least 2 games to start a party':'')+'</div>'
      +'<button class="btn play-btn ps-start" data-testid="party-start-btn" '+(n<2?'disabled':'')+'><span class="pb-label">Start Party · '+CFG.rounds+' rounds</span></button></div>';
    ov.querySelector('.ps-close').onclick=closeSetup;
    [].forEach.call(ov.querySelectorAll('.ps-mode'),function(b){b.onclick=function(){var k=b.dataset.k,i=CFG.modes.indexOf(k);if(i>=0)CFG.modes.splice(i,1);else CFG.modes.push(k);CFG.modes.sort(function(a,b){return ALL.indexOf(a)-ALL.indexOf(b);});save();renderSetup();renderTile();};});
    [].forEach.call(ov.querySelectorAll('[data-act]'),function(b){b.onclick=function(){CFG.modes=b.dataset.act==='all'?ALL.slice():[];save();renderSetup();renderTile();};});
    [].forEach.call(ov.querySelectorAll('[data-opt]'),function(b){b.onclick=function(){var o=b.dataset.opt,v=b.dataset.v;CFG[o]=(o==='order')?v:+v;save();renderSetup();renderTile();};});
    ov.querySelector('.ps-start').onclick=function(){if(CFG.modes.length<2)return;closeSetup();begin();};}
  function openSetup(){renderSetup();ov.classList.add('show');}
  function closeSetup(){ov.classList.remove('show');}
  ov.addEventListener('click',function(e){if(e.target===ov)closeSetup();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ov.classList.contains('show'))closeSetup();});

  /* ---------------- playlist + overrides ---------------- */
  function playlist(){var src=CFG.modes.slice(),out=[];
    if(CFG.order==='inorder'){for(var i=0;i<CFG.rounds;i++)out.push(src[i%src.length]);return out;}
    var bag=[];while(out.length<CFG.rounds){if(!bag.length){bag=src.slice().sort(function(){return Math.random()-.5;});if(bag.length>1&&bag[0]===out[out.length-1])bag.push(bag.shift());}out.push(bag.shift());}return out;}
  var ORIG=null;
  function saveOrig(){ORIG={configAi:configAi,matchTime:matchTime,seekTime:seekTime,hide:HNS_HIDE_MS,hoops:Object.assign({},HOOPS_CFG),mode:gameMode,round:window.FreaModes?FreaModes.round():60};}
  function restore(){if(!ORIG)return;configAi=ORIG.configAi;matchTime=ORIG.matchTime;seekTime=ORIG.seekTime;HNS_HIDE_MS=ORIG.hide;Object.assign(HOOPS_CFG,ORIG.hoops);if(window.FreaModes)FreaModes.setRound(ORIG.round);gameMode=ORIG.mode;ORIG=null;}
  function override(m){configAi=P.rivals;matchTime=60;if(window.FreaModes)FreaModes.setRound(50);
    if(m==='hns'){seekTime=60;HNS_HIDE_MS=12000;}else if(ORIG){seekTime=ORIG.seekTime;HNS_HIDE_MS=ORIG.hide;}
    if(m==='hoops'){HOOPS_CFG.teamSize=0;HOOPS_CFG.ball=0;HOOPS_CFG.time=45;}}

  /* ---------------- run ---------------- */
  function begin(){saveOrig();P={list:playlist(),rounds:CFG.rounds,idx:0,rivals:CFG.rivals,pts:{},roster:{},results:[],cur:[]};round();}
  function round(){clearInterval(autoIv);var ev=el('end-view');if(ev)ev.classList.remove('party');var pp=el('party-panel');if(pp)pp.remove();
    var m=P.list[P.idx];gameMode=m;override(m);try{syncModeChips();}catch(e){}playWithIntro();}
  /* same rival looks every round */
  var _mk=makeAI;makeAI=function(name,x,y){if(!P)return _mk.apply(this,arguments);var sp=P.roster[name];if(sp)return new Flea(x,y,false,name,sp);var f=_mk.apply(this,arguments);P.roster[name]=specOf(f);return f;};
  var _sg=startGame;startGame=function(){var r=_sg.apply(this,arguments);if(P){P.cur=fleas.slice();P.cur.forEach(function(f){if(!P.pts[f.name])P.pts[f.name]={n:f.name,col:f.col,isP:f.isP,pts:0,wins:0,spec:specOf(f)};});}return r;};
  function playerWon(w){if(gameMode==='hns'&&hnsEndInfo)return (hnsSeeker===player)?!!hnsEndInfo.seekerWon:(!hnsEndInfo.seekerWon&&!player.found);
    if(gameMode==='hoops'&&hoopsEndInfo&&hoopsEndInfo.team)return !!hoopsEndInfo.playerWon;return !!(w&&w.isP);}
  function ranking(w){var m=gameMode,order=[];var pw=playerWon(w);if(pw)order.push(player);if(w&&order.indexOf(w)<0&&!(pw&&m==='hns'))order.push(w);
    var key={classic:'matchPoints',hoops:'matchPoints',koth:'hill',stars:'starPts',redlight:'rlProg',freeze:'rescues'}[m];
    var rest=P.cur.filter(function(f){return order.indexOf(f)<0;});
    if(key)rest.filter(function(f){return (f[key]||0)>0;}).sort(function(a,b){return (b[key]||0)-(a[key]||0);}).forEach(function(f){order.push(f);});
    else if(m==='lava'||m==='survival'||m==='tag')rest.filter(function(f){return fleas.indexOf(f)>=0&&!f.infected;}).sort(function(a,b){return a.y-b.y;}).forEach(function(f){order.push(f);});
    return order.slice(0,3);}
  var _eg=endGame;endGame=function(w){var live=P&&(STATE==='play'||STATE==='countdown');var top3=null;
    if(live){top3=ranking(w);var gain={};[3,2,1].forEach(function(v,i){var f=top3[i];if(!f)return;var e=P.pts[f.name];if(!e)return;e.pts+=v;gain[f.name]=v;if(i===0)e.wins++;});
      P.results.push({mode:gameMode,winner:top3[0]?top3[0].name:'—',gain:gain});}
    var r=_eg.apply(this,arguments);if(live)waitEnd(function(){panel(P.results[P.results.length-1]);});return r;};
  function waitEnd(cb){var n=0;(function f(){var ev=el('end-view');if(ev&&getComputedStyle(ev).display!=='none'){cb();return;}if(++n<60)setTimeout(f,100);})();}
  function standings(){return Object.keys(P.pts).map(function(k){return P.pts[k];}).sort(function(a,b){return b.pts-a.pts||b.wins-a.wins||(b.isP?1:0)-(a.isP?1:0);});}
  function panel(res){if(!P)return;var ev=el('end-view');if(!ev)return;ev.classList.add('party');var old=el('party-panel');if(old)old.remove();
    var last=P.idx>=P.rounds-1,st=standings(),rows=st.slice(0,5);var me=st.filter(function(e){return e.isP;})[0];if(me&&rows.indexOf(me)<0)rows.push(me);
    var nx=last?null:info(P.list[P.idx+1]);
    var h='<div class="pp-head"><span class="pp-chip" data-testid="party-round-chip">PARTY · ROUND '+(P.idx+1)+' / '+P.rounds+'</span></div>'
      +'<div class="pp-rows" data-testid="party-standings">'+rows.map(function(e){var g=res.gain[e.n];return '<div class="pp-row'+(e.isP?' me':'')+'"><span class="pp-rk">'+(st.indexOf(e)+1)+'</span><i style="background:'+e.col+'"></i><span class="pp-nm">'+esc(e.n)+(e.isP?' (you)':'')+'</span>'+(g?'<em>+'+g+'</em>':'')+'<b>'+e.pts+'</b></div>';}).join('')+'</div>'
      +(nx?'<div class="pp-next" style="--mb:'+nx.col+'" data-testid="party-next-up"><span class="pn-k">NEXT UP</span><span class="pn-ico">'+nx.ico+'</span><span class="pn-t"><b>'+esc(nx.name)+'</b><small>'+esc(nx.goal)+'</small></span></div>':'<div class="pp-next final" data-testid="party-next-up"><span class="pn-k">FINAL ROUND DONE</span><span class="pn-t"><b>Who takes the crown?</b></span></div>')
      +'<div class="pp-actions"><button class="btn gold" id="pp-next-btn" data-testid="party-next-round-btn">'+(last?'See Final Results':'Next Round')+'</button><button class="btn ghost" id="pp-end-btn" data-testid="party-end-btn">'+(last?'Back to Lobby':'End Party')+'</button></div>';
    var d=document.createElement('div');d.id='party-panel';d.innerHTML=h;var stage=ev.querySelector('.end-actions')||el('again-btn');ev.insertBefore(d,stage);
    var nb=el('pp-next-btn'),left=last?0:12;
    function lbl(){nb.textContent=last?'See Final Results':('Next Round ('+left+')');}
    if(!last){lbl();autoIv=setInterval(function(){if(!P||STATE!=='gameover'){clearInterval(autoIv);return;}left--;lbl();if(left<=0){clearInterval(autoIv);next();}},1000);}
    nb.onclick=function(){clearInterval(autoIv);if(last)final();else next();};
    el('pp-end-btn').onclick=function(){clearInterval(autoIv);if(last){quit();toLobby();}else final();};}
  function next(){if(!P)return;P.idx++;if(P.idx>=P.rounds){final();return;}round();}

  /* ---------------- final podium ---------------- */
  var fin=document.createElement('div');fin.id='party-final';fin.setAttribute('data-testid','party-final');document.body.appendChild(fin);
  function final(){if(!P)return;clearInterval(autoIv);var st=standings(),played=P.results.slice(),meI=-1;st.forEach(function(e,i){if(e.isP)meI=i;});
    var reward=[60,30,15][meI]||0;try{if(reward&&typeof Treesh!=='undefined')Treesh.award(reward,'Party Mode '+(meI===0?'champion':'podium'),{game:true});}catch(e){}
    var podium=[st[1],st[0],st[2]];
    fin.innerHTML='<div class="pf-card"><div id="pf-confetti"></div><div class="pf-kicker">PARTY OVER · '+played.length+' ROUNDS</div><div class="pf-title">'+(meI===0?'You are the Party Champion!':esc((st[0]||{n:'—'}).n)+' wins the party!')+'</div>'
      +'<div class="pf-podium">'+podium.map(function(e,i){if(!e)return '<div class="pf-col empty"></div>';var place=[2,1,3][i];return '<div class="pf-col p'+place+(e.isP?' me':'')+'" data-testid="party-podium-'+place+'"><canvas width="120" height="120"></canvas><div class="pf-nm">'+esc(e.n)+'</div><div class="pf-pts">'+e.pts+' pts</div><div class="pf-step"><b>'+place+'</b></div></div>';}).join('')+'</div>'
      +'<div class="pf-rounds" data-testid="party-round-history">'+played.map(function(r,i){var d=info(r.mode);return '<span style="--mb:'+d.col+'" title="'+esc(d.name)+'"><i>'+d.ico+'</i>R'+(i+1)+' · '+esc(r.winner)+'</span>';}).join('')+'</div>'
      +(reward?'<div class="pf-reward" data-testid="party-reward"><span class="star-ico">✦</span> +'+reward+' Starlites party bonus</div>':'')
      +'<div class="pf-actions"><button class="btn gold" id="pf-again" data-testid="party-again-btn">Party Again</button><button class="btn ghost" id="pf-lobby" data-testid="party-lobby-btn">Back to Lobby</button></div></div>';
    fin.classList.add('show');
    [].forEach.call(fin.querySelectorAll('.pf-col canvas'),function(cv,i){var e=podium[i];if(e&&e.spec)try{drawFleaStatic(cv,e.spec);}catch(x){}});
    if(meI>=0&&meI<3)try{var box=el('pf-confetti'),cols=['#2de2ff','#ff3db5','#c6ff3d','#ffd23d','#9b6bff'];for(var i=0;i<60;i++){var c=document.createElement('i');c.style.left=Math.random()*100+'%';c.style.background=cols[i%5];c.style.animationDelay=Math.random()*.8+'s';c.style.animationDuration=(1.8+Math.random()*1.6)+'s';box.appendChild(c);}}catch(e){}
    el('pf-again').onclick=function(){fin.classList.remove('show');quit();toLobby();setTimeout(function(){select(true);begin();},80);};
    el('pf-lobby').onclick=function(){fin.classList.remove('show');quit();toLobby();};
    var ev=el('end-view');if(ev)ev.style.display='none';}
  function quit(){clearInterval(autoIv);if(!P)return;P=null;restore();var ev=el('end-view');if(ev)ev.classList.remove('party');var pp=el('party-panel');if(pp)pp.remove();try{syncModeChips();}catch(e){}}
  var _tl=toLobby;toLobby=function(){if(P)quit();fin.classList.remove('show');return _tl.apply(this,arguments);};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else setTimeout(mount,30);
  return {status:function(){return P?{idx:P.idx,rounds:P.rounds,mode:P.list[P.idx],list:P.list.slice(),pts:standings()}:null;},config:function(){return CFG;},open:openSetup,select:select,begin:begin,next:next,final:final,quit:quit,isSelected:function(){return selected;}};
})();
window.FreaParty=Party;
