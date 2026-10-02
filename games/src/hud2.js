/* ===================== FREA! PLUS — HUD v2 =====================
   • portrait standings (faces, live score bars, YOU tag, status roster for survival-style modes)
   • goal meter (top-center) tailored to every mode + leader tick
   • timer progress bar + FINAL 10 pulse
   • big alerts (FINAL 10 / FINAL TWO / LAST STAND / ON FIRE …)
   • live event feed (every flash() also lands here)
   • active power-up chips + ability button (Hide & Seek radar/taunt)
   • results: podium (top 3), your placing, fun awards */
var FreaHud2=(function(){
  function el(id){return document.getElementById(id);}
  function T(){return Date.now();}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function live(){return (STATE==='play'||STATE==='countdown')&&!!player&&gameMode!=='zen'&&gameMode!=='tutorial';}
  function XS(){try{return FreaModes.state()||{};}catch(e){return {};}}
  function info(){try{return FreaHud.info(gameMode);}catch(e){return {col:'#2de2ff',name:gameMode,ico:'◎'};}}

  /* ---------------- portraits ---------------- */
  var PC={};
  function portrait(f){if(!f)return '';var k=(f.name||'')+'|'+(f.col||'')+'|'+(f.hat||'')+'|'+(f.shape||'');if(PC[k])return PC[k];
    try{var c=document.createElement('canvas');c.width=84;c.height=84;drawFleaStatic(c,specOf(f));PC[k]=c.toDataURL('image/png');}catch(e){PC[k]='';}return PC[k];}
  var ROSTER=[],OUT=[];
  function byName(n){n=String(n||'').replace(/\s*♔\s*$/,'').trim();for(var i=0;i<ROSTER.length;i++)if(ROSTER[i].name===n)return ROSTER[i];for(var j=0;j<fleas.length;j++)if(fleas[j].name===n)return fleas[j];return null;}

  /* ---------------- DOM ---------------- */
  function mk(tag,id,cls,html){var d=document.createElement(tag);if(id)d.id=id;if(cls)d.className=cls;if(html)d.innerHTML=html;d.setAttribute('data-testid',id||cls);document.body.appendChild(d);return d;}
  var meter=mk('div','hud-meter','', '<div class="hm-top"><span class="hm-lbl" data-testid="hud-meter-label"></span><span class="hm-val" data-testid="hud-meter-value"></span></div><div class="hm-bar"><i class="hm-fill"></i><b class="hm-lead"></b></div><div class="hm-sub" data-testid="hud-meter-sub"></div>');
  var chips=mk('div','hud-chips');
  var feedBox=mk('div','hud-feed');
  var alertBox=mk('div','hud-alert','','<div class="ha-t"></div><div class="ha-s"></div>');
  var abil=mk('button','hud-ability','','<span class="ab-ring"></span><img class="ab-ico" alt=""><span class="ab-lbl"></span><span class="ab-key">Q</span>');
  abil.addEventListener('click',function(e){e.stopPropagation();try{FreaPlus.useAbility();}catch(_){}});
  abil.addEventListener('pointerdown',function(e){e.stopPropagation();});
  var tb=el('tbox');var tprog=null;if(tb){tprog=document.createElement('div');tprog.className='tb-prog';tprog.innerHTML='<i></i>';tb.appendChild(tprog);}

  /* glyph images (canvas → png) */
  var GC={};
  function glyphImg(k,col){var key=k+col;if(GC[key])return GC[key];var c=document.createElement('canvas');c.width=c.height=48;var x=c.getContext('2d');
    x.fillStyle=col;x.beginPath();x.arc(24,24,22,0,7);x.fill();x.fillStyle='rgba(6,10,26,.3)';x.beginPath();x.arc(24,24,15,0,7);x.fill();x.translate(24,24);
    try{if(k==='fire'){x.fillStyle='#fff';x.beginPath();x.moveTo(0,-13);x.quadraticCurveTo(11,-2,7,8);x.quadraticCurveTo(0,15,-7,8);x.quadraticCurveTo(-10,-1,-3,-5);x.quadraticCurveTo(-1,-9,0,-13);x.fill();}
      else if(k==='radar'){x.strokeStyle='#fff';x.lineWidth=3;x.lineCap='round';[5,10,15].forEach(function(r){x.beginPath();x.arc(0,0,r,-2.4,-0.7);x.stroke();});x.fillStyle='#fff';x.beginPath();x.arc(0,0,3,0,7);x.fill();}
      else if(k==='taunt'){x.fillStyle='#fff';x.font="900 24px 'Baloo 2',sans-serif";x.textAlign='center';x.textBaseline='middle';x.fillText('♪',0,2);}
      else FreaPlus.glyph(x,k,14);}catch(e){}
    GC[key]=c.toDataURL();return GC[key];}

  /* ---------------- alerts + feed ---------------- */
  var AQ=[],aBusy=false;
  function alert(t,col,sub){AQ.push({t:t,col:col||'#ffd23d',sub:sub||''});if(AQ.length>3)AQ.shift();if(!aBusy)nextAlert();feed(t+(sub?' · '+sub:''),col);}
  function nextAlert(){var a=AQ.shift();if(!a){aBusy=false;return;}aBusy=true;alertBox.style.setProperty('--ac',a.col);alertBox.querySelector('.ha-t').textContent=a.t;var s=alertBox.querySelector('.ha-s');s.textContent=a.sub;s.style.display=a.sub?'':'none';
    alertBox.classList.remove('show');void alertBox.offsetWidth;alertBox.classList.add('show');setTimeout(function(){alertBox.classList.remove('show');setTimeout(nextAlert,220);},1500);}
  var lastFeed='',lastFeedT=0;
  function feed(t,col){if(!live()&&STATE!=='play')return;t=String(t||'').trim();if(!t||/RISING IN|GREEN LIGHT|YELLOW —|RED LIGHT —|^\d+$/i.test(t))return;var now=T();if(t===lastFeed&&now-lastFeedT<1500)return;lastFeed=t;lastFeedT=now;
    var d=document.createElement('div');d.className='hf-row';d.style.setProperty('--fc',col||'#2de2ff');d.setAttribute('data-testid','hud-feed-row');d.innerHTML='<i></i><span>'+esc(t.charAt(0)+t.slice(1).toLowerCase().replace(/\byou\b/g,'You'))+'</span>';
    feedBox.appendChild(d);while(feedBox.children.length>4)feedBox.removeChild(feedBox.firstChild);setTimeout(function(){d.classList.add('out');setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);},400);},4600);}
  var _fl=flash;flash=function(txt,col){var r=_fl.apply(this,arguments);try{if(STATE==='play'||STATE==='countdown')feed(txt,col);}catch(e){}return r;};

  /* ---------------- standings decoration ---------------- */
  function status(f){if(OUT.indexOf(f)>=0||(fleas.indexOf(f)<0&&ROSTER.indexOf(f)>=0))return 'out';if(gameMode==='tag'&&f.infected)return 'inf';if(gameMode==='freeze'){if(f.iced)return 'ice';if(f.it)return 'it';}if(gameMode==='survival'&&f.hasOrb)return 'hot';if(gameMode==='hns'&&f.found)return 'out';return '';}
  function decorate(){var box=scoresEl;if(!box||gameMode==='zen'||gameMode==='tutorial')return;box.classList.add('v2');
    var sl=box.querySelectorAll('.score-line');if(sl.length){var h='<div class="sb-title">Points</div><div class="sb-grid">';[].forEach.call(sl,function(r){var n=r.querySelector('.sl-name'),pt=r.querySelector('.sl-pts'),rk=r.querySelector('.sl-rank');h+='<div class="srow'+(r.classList.contains('me')?' me':'')+'"><span class="pos">'+(rk?rk.textContent:'')+'</span><span class="dot"></span><span class="nm">'+esc(n?n.textContent:'')+'</span><span class="pts">'+(pt?pt.textContent:'0')+'</span></div>';});box.innerHTML=h+'</div>';}
    var rows=box.querySelectorAll('.srow'),mx=0,vals=[];
    [].forEach.call(rows,function(r){var p=r.querySelector('.pts');var v=p?parseFloat(p.textContent):NaN;vals.push(v);if(!isNaN(v)&&v>mx)mx=v;});
    [].forEach.call(rows,function(r,i){var n=r.querySelector('.nm');if(!n)return;var f=byName(n.textContent);if(f&&!r.querySelector('.pt')){var im=document.createElement('img');im.className='pt';im.alt='';im.src=portrait(f);im.style.setProperty('--fc',f.col||'#fff');var dot=r.querySelector('.dot');if(dot)dot.replaceWith(im);else r.insertBefore(im,n);}
      if(r.classList.contains('me')&&!r.querySelector('.you')){var y=document.createElement('span');y.className='you';y.textContent='YOU';n.after(y);}
      if(!isNaN(vals[i])&&mx>0){var b=document.createElement('i');b.className='sbar';b.style.width=Math.max(3,vals[i]/mx*100)+'%';if(f)b.style.background=f.col;r.appendChild(b);}
      if(f){var st=status(f);if(st)r.classList.add('st-'+st);}});
    /* pill-only modes get a live roster strip */
    if(!rows.length&&box.querySelector('.sb-pills')&&ROSTER.length&&ROSTER.length<=16){var strip=document.createElement('div');strip.className='sb-roster';
      ROSTER.forEach(function(f){var st=status(f);var d=document.createElement('span');d.className='rf '+(st?'st-'+st:'')+(f.isP?' me':'');d.title=f.name;d.innerHTML='<img alt="" src="'+portrait(f)+'"><em>'+esc(f.isP?'You':f.name)+'</em>';strip.appendChild(d);});box.appendChild(strip);}}
  var _us=updScore;updScore=function(){var r=_us.apply(this,arguments);try{decorate();}catch(e){}return r;};

  /* ---------------- goal meter ---------------- */
  function lead(key){var b=null;fleas.forEach(function(f){if(!b||(f[key]||0)>(b[key]||0))b=f;});return b;}
  function meterData(){var p=player,m=gameMode,S=XS(),FP=window.FreaPlus,R=FP?FP.state():{};if(!p)return null;
    function ld(key,max){var l=lead(key);return l&&l!==p&&(l[key]||0)>0?{v:(l[key]||0)/max,col:l.col,n:l.name}:null;}
    if(m==='classic')return {l:orbHolder===p?'Holding the orb!':'Your ring',v:(p.capture||0)/100,t:Math.floor(p.capture||0)+'%',s:(FP&&FP.overcharged()&&orbHolder===p?'OVERCHARGED · ':'')+'Match pts '+(p.matchPoints||0)+(orbHolder&&orbHolder!==p?' · '+orbHolder.name+' has the orb':''),ld:ld('capture',100),col:'#2de2ff'};
    if(m==='race')return {l:'Climb to the orb',v:R.raceProg||0,t:Math.round((R.raceProg||0)*100)+'%',s:'Checkpoint '+(R.cpHit||0)+'/3'+(R.splits&&R.splits.length?' · last split '+R.splits[R.splits.length-1].toFixed(1)+'s':''),col:'#c6ff3d'};
    if(m==='survival'){var mul=FP?FP.fmul():1;return {l:orbHolder===p?'HOT ORB! PASS IT!':(orbHolder?orbHolder.name+' has the orb':'Fuse'),v:Math.max(0,fuse/fuseMax),t:(fuse/1000).toFixed(1)+'s',s:'Fuse speed ×'+mul.toFixed(2)+' · '+fleas.length+' alive',col:orbHolder===p?'#ff3b5c':'#ff7a1a',warn:orbHolder===p};}
    if(m==='tag'){var safe=fleas.filter(function(f){return !f.infected;}).length;return {l:p.infected?'You are infected: tag them!':'Stay safe',v:safe/Math.max(1,fleas.length),t:safe+' safe',s:tagSeeded?(fleas.length-safe)+' infected':'Infection incoming…',col:p.infected?'#39ff7a':'#2de2ff'};}
    if(m==='hns'){if(hnsSeeker===p)return {l:'Hiders found',v:hnsFound/Math.max(1,hnsTotal),t:hnsFound+'/'+hnsTotal,s:'Wrong guesses '+hnsWrong+'/5 · Radar on Q',col:'#9b6bff'};
      return {l:hnsPhase==='hide'?'Find a hiding spot':'Survive the seek clock',v:hnsPhase==='hide'?Math.max(0,hnsHideLeft/HNS_HIDE_MS):Math.max(0,hnsSeekLeft/(seekTime*1000)),t:Math.ceil((hnsPhase==='hide'?hnsHideLeft:hnsSeekLeft)/1000)+'s',s:p.found?'You were found!':(hnsPhase==='seek'?'Taunt on Q: −3s, but risky':'Move, then stay still'),col:'#9b6bff'};}
    if(m==='hoops'){var lh=lead('matchPoints'),mx=Math.max(10,(lh&&lh.matchPoints)||0);return {l:p._fireUntil>T()?'ON FIRE!':'Your points',v:(p.matchPoints||0)/mx,t:(p.matchPoints||0)+' pts',s:'Streak '+(p._hstreak||0)+(p._hstreak>=2&&p._fireUntil<T()?' · 1 more for ON FIRE':''),ld:lh&&lh!==p?{v:(lh.matchPoints||0)/mx,col:lh.col}:null,col:'#ff7a1a'};}
    if(m==='koth'){var z=S.zone;return {l:z&&z.contested?'CONTESTED!':(R.golden?'GOLDEN HILL ×2':'Your hill'),v:(p.hill||0)/100,t:Math.floor(p.hill||0)+'%',s:z?(z.owner===p?'You own the hill':(z.owner?z.owner.name+' owns the hill':'Hill is open'))+' · moves in '+Math.ceil(Math.max(0,S.move||0)/1000)+'s':'',ld:ld('hill',100),col:R.golden?'#ffd23d':'#ffd23d',warn:z&&z.contested};}
    if(m==='lava'){var h=Math.max(0,Math.round(((S.lava||WORLD_H)-(p.y+p.h))/10));return {l:S.grace>0?'Climb! Lava soon':'Height above lava',v:Math.min(1,h/60),t:h+'m',s:fleas.length+' alive · geysers erupt randomly',col:h<12?'#ff3b5c':'#ff7a1a',warn:h<12&&S.grace<=0};}
    if(m==='stars'){var ls=lead('starPts'),ms=Math.max(10,(ls&&ls.starPts)||0);return {l:R.shower>0?'STAR SHOWER!':'Your stars',v:(p.starPts||0)/ms,t:(p.starPts||0)+' ★',s:'Combo x'+((T()-(p._comboT||0)<1600)?(p._combo||0):0)+' · 5-chains give +2',ld:ls&&ls!==p?{v:(ls.starPts||0)/ms,col:ls.col}:null,col:'#c6ff3d'};}
    if(m==='redlight')return {l:S.ph==='red'?'RED: FREEZE!':(S.ph==='yellow'?'YELLOW: get ready':'GREEN: GO GO GO'),v:(p.rlProg||0)/100,t:Math.floor(p.rlProg||0)+'%',s:'Caught '+(p._caught||0)+'× · green pads boost you',ld:ld('rlProg',100),col:S.ph==='red'?'#ff3b5c':(S.ph==='yellow'?'#ffd23d':'#39ff7a'),warn:S.ph==='red'};
    if(m==='freeze'){var rn=fleas.filter(function(f){return !f.it;}),ic=rn.filter(function(f){return f.iced;}).length;if(p.it)return {l:'Freeze them all',v:ic/Math.max(1,rn.length),t:ic+'/'+rn.length,s:'Ice pickups freeze everyone nearby',col:'#8fe8ff'};
      return {l:p.iced?'Frozen! Wait for help':'Stay free · rescue friends',v:(rn.length-ic)/Math.max(1,rn.length),t:(rn.length-ic)+' free',s:'Your rescues '+(p.rescues||0),col:p.iced?'#8fe8ff':'#c6ff3d',warn:p.iced};}
    return null;}
  function renderMeter(){var d=live()?meterData():null;if(!d){meter.classList.remove('show');return;}meter.classList.add('show');meter.style.setProperty('--mc',d.col);meter.classList.toggle('warn',!!d.warn);
    meter.querySelector('.hm-lbl').textContent=d.l;meter.querySelector('.hm-val').textContent=d.t;meter.querySelector('.hm-sub').textContent=d.s||'';
    meter.querySelector('.hm-fill').style.transform='scaleX('+Math.max(0,Math.min(1,d.v||0))+')';var lb=meter.querySelector('.hm-lead');
    if(d.ld){lb.style.display='';lb.style.left=(Math.max(0,Math.min(1,d.ld.v))*100)+'%';lb.style.background=d.ld.col||'#fff';}else lb.style.display='none';}

  /* ---------------- chips + ability ---------------- */
  var chipKey='';
  function renderChips(){var list=[];try{if(live())list=FreaPlus.activeList(player);}catch(e){}var key=list.map(function(c){return c.k+c.name;}).join(',');
    if(key!==chipKey){chipKey=key;chips.innerHTML=list.map(function(c){return '<div class="hc" data-testid="hud-chip-'+c.k+'" style="--cc:'+c.col+'"><img alt="" src="'+glyphImg(c.k,c.col)+'"><b>'+esc(c.name)+'</b><i><u></u></i></div>';}).join('');}
    [].forEach.call(chips.children,function(n,i){var c=list[i];if(!c)return;var u=n.querySelector('u');if(u)u.style.transform='scaleX('+(c.perm?1:Math.max(0,c.left/c.max))+')';});
    chips.classList.toggle('show',list.length>0);}
  function renderAbility(){var a=null;try{a=FreaPlus.ability();}catch(e){}if(!a){abil.classList.remove('show');return;}abil.classList.add('show');abil.classList.toggle('ready',a.ready);abil.style.setProperty('--ac',a.col);
    abil.querySelector('.ab-lbl').textContent=a.ready?a.label:Math.ceil(a.cd/1000)+'s';var im=abil.querySelector('.ab-ico'),src=glyphImg(a.id,a.col);if(im.getAttribute('src')!==src)im.src=src;
    abil.style.setProperty('--cd',(a.ready?0:a.cd/a.max*360)+'deg');abil.setAttribute('data-testid','hud-ability-'+a.id);}

  /* ---------------- timer bar + final alerts ---------------- */
  var tMax=0,tLbl='',f10=false,lastAlive=-1,wasLive=false;
  function renderTimer(){if(!tb||!tprog)return;var lb=(el('timer-lbl')||{}).textContent||'',v=parseFloat((el('tval')||{}).textContent);
    if(!live()||isNaN(v)){tprog.style.display='none';return;}
    if(lb!==tLbl){tLbl=lb;tMax=v;f10=false;}if(v>tMax)tMax=v;var timed=/time|lava|seek|fuse|hide|infect/i.test(lb);tprog.style.display=timed&&tMax>0?'':'none';
    tprog.firstChild.style.transform='scaleX('+(tMax>0?Math.max(0,v/tMax):0)+')';tb.classList.toggle('t-low',timed&&v<=10&&!/fuse/i.test(lb));
    if(STATE==='play'&&/time|lava|seek/i.test(lb)&&tMax>14&&v<=10&&v>0&&!f10){f10=true;alert('FINAL 10!','#ff3db5','Make it count');}}
  function survivalAlerts(){if(STATE!=='play')return;var n=fleas.length;if((gameMode==='survival'||gameMode==='lava')&&n===2&&lastAlive>2)alert('FINAL TWO!','#ff3db5',fleas.map(function(f){return f.isP?'You':f.name;}).join(' vs '));lastAlive=n;
    ROSTER.forEach(function(f){if(fleas.indexOf(f)<0&&OUT.indexOf(f)<0)OUT.push(f);});}

  /* ---------------- thick floor: bottom HUD sits centered inside the ground band ---------------- */
  /* real bottom safe-area (iOS home-screen web app / notch phones): HUD floats above it, so the ground must too */
  var _sbP=null,_sbV=0,_sbT=0;function safeBot(){var n=Date.now();if(n-_sbT<1000)return _sbV;_sbT=n;try{if(!_sbP){_sbP=document.createElement('div');_sbP.style.cssText='position:fixed;left:0;bottom:0;width:1px;height:0;padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none';document.body.appendChild(_sbP);}_sbV=_sbP.offsetHeight||0;
      var sa=(navigator.standalone===true)||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);if(sa&&_sbV<20&&/iPhone|iPad|iPod/.test(navigator.userAgent))_sbV=Math.max(_sbV,20);document.documentElement.classList.toggle('frea-standalone',!!sa);}catch(e){}return _sbV;}
  function floorFit(){var on=(STATE==='play'||STATE==='countdown'||STATE==='gameover')&&gameMode!=='tutorial';if(!on){FLOOR_PAD=0;return;}
    var ih=innerHeight,top=ih,bot=0,sb=safeBot();['emote-fab','zen-fab','hud-ability','mode-banner','hud-meter'].forEach(function(id){var e=el(id);if(!e)return;var cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<0.2)return;
      var r=e.getBoundingClientRect();if(r.height<4||r.bottom<ih-40-sb-24||r.top<ih*0.5)return;top=Math.min(top,r.top);bot=Math.max(bot,r.bottom);});
    if(gameMode==='redlight'){top=Math.min(top,ih-sb-62*VZ_UI);bot=Math.max(bot,ih-sb-10*VZ_UI);}
    if(top>=ih){FLOOR_PAD=0;return;}var gap=Math.max(8,ih-bot-sb),F=(ih-top)+gap+6;var pad=Math.max(0,Math.round(F/VZ_UI-60));if(Math.abs(pad-FLOOR_PAD)>1)FLOOR_PAD=pad;}
  var _dfx2=drawFX;drawFX=function(){var r=_dfx2.apply(this,arguments);try{if(FLOOR_PAD>0&&STATE!=='title'){var f=platforms&&platforms[0],y=WORLD_H-camera.y;if(y<H&&!(f&&f._arenaMat)){var g=ctx.createLinearGradient(0,y,0,H);g.addColorStop(0,'rgba(12,12,34,.96)');g.addColorStop(1,'rgba(6,6,18,1)');ctx.fillStyle=g;ctx.fillRect(0,y,W,H-y+2);}}}catch(e){}return r;};
  setInterval(function(){try{var L=live();if(L!==wasLive){wasLive=L;document.body.classList.toggle('hud2-live',L);if(!L){feedBox.innerHTML='';chips.innerHTML='';chipKey='';}}
    renderMeter();renderChips();renderAbility();renderTimer();survivalAlerts();floorFit();}catch(e){}},150);

  /* ---------------- round lifecycle ---------------- */
  var _sg=startGame;startGame=function(){var r=_sg.apply(this,arguments);try{ROSTER=fleas.slice();OUT=[];lastAlive=fleas.length;tLbl='';f10=false;AQ=[];feedBox.innerHTML='';ROSTER.forEach(portrait);decorate();}catch(e){}return r;};

  /* ---------------- results screen v3 (hero + standings + awards + rewards) ---------------- */
  var ev=el('end-view'),pod=document.createElement('div');pod.id='end-podium';pod.setAttribute('data-testid','end-standings');
  (function restructure(){if(!ev)return;ev.classList.add('ev3');
    var grid=document.createElement('div');grid.className='ev3-grid';var hero=document.createElement('div');hero.className='ev3-hero';var side=document.createElement('div');side.className='ev3-side';
    var glow=document.createElement('div');glow.className='ev3-glow';glow.innerHTML='<i></i>';ev.insertBefore(glow,ev.firstElementChild);
    var kick=document.createElement('div');kick.className='ev3-kicker';
    var et=el('end-title'),es=el('end-sub'),ws=ev.querySelector('.win-stage'),ch=el('end-chips'),sr=el('star-reward'),act=ev.querySelector('.end-actions');
    ev.insertBefore(grid,et);grid.appendChild(hero);grid.appendChild(side);
    if(ch)kick.appendChild(ch);hero.appendChild(kick);if(et)hero.appendChild(et);if(es)hero.appendChild(es);
    if(ws){var ped=document.createElement('div');ped.className='ev3-pedestal';var cv=el('win-canvas');if(cv){ws.insertBefore(ped,cv);ped.appendChild(cv);}hero.appendChild(ws);}
    side.appendChild(pod);if(sr)side.appendChild(sr);if(act)side.appendChild(act);else{var a=el('again-btn'),m=el('menu-btn');if(a)side.appendChild(a);if(m)side.appendChild(m);}})();
  function val(f){var m=gameMode;if(m==='classic')return (f.matchPoints||0)*1000+(f.capture||0);if(m==='hoops')return f.matchPoints||0;if(m==='koth')return f.hill||0;if(m==='stars')return f.starPts||0;if(m==='redlight')return f.rlProg||0;
    if(m==='race')return -(f.cy||0);if(m==='freeze')return (f.iced?0:1000)+(f.rescues||0)*10;if(m==='tag')return f.infected?0:1;if(m==='survival'||m==='lava'){var oi=OUT.indexOf(f);return oi<0?1000-(f.y||0)/1000:oi;}return 0;}
  function bar(f,rk){var m=gameMode,v,mx;if(m==='classic'||m==='hoops'){v=f.matchPoints||0;mx=rk[0].matchPoints||0;}else if(m==='koth'){v=f.hill||0;mx=100;}else if(m==='stars'){v=f.starPts||0;mx=rk[0].starPts||0;}else if(m==='redlight'){v=f.rlProg||0;mx=100;}
    else{var i=rk.indexOf(f);return 1-i/Math.max(1,rk.length);}return mx>0?Math.max(0.04,v/mx):0.04;}
  function statTxt(f){var m=gameMode;if(m==='classic'||m==='hoops')return (f.matchPoints||0)+' pts';if(m==='koth')return Math.floor(f.hill||0)+'% hill';if(m==='stars')return (f.starPts||0)+' stars';if(m==='redlight')return Math.floor(f.rlProg||0)+'% course';
    if(m==='freeze')return f.it?'Was IT':((f.rescues||0)+' rescues');if(m==='tag')return f.infected?'Infected':'Stayed safe';if(m==='survival'||m==='lava')return OUT.indexOf(f)>=0?'Knocked out':'Survived';if(m==='race')return f.hasOrb?'Reached the orb':'Climbing';return '';}
  function awards(rk){var A=[];function best(fn,min){var b=null,bv=-1;rk.forEach(function(f){var v=fn(f)||0;if(v>bv){bv=v;b=f;}});return bv>=(min||1)?{f:b,v:bv}:null;}
    function add(t,ic,col,o,txt){if(!o||A.length>=3)return;A.push({t:t,ic:ic,col:col,f:o.f,txt:txt.replace('#',o.v)});}
    add('MVP','star','#ffd23d',{f:rk[0],v:0},statTxt(rk[0])||'Top flea');var m=gameMode;
    if(m==='classic')add('Orb Thief','speed','#ff3db5',best(function(f){return f._steals;}),'# steals');
    if(m==='freeze')add('Hero','cure','#c6ff3d',best(function(f){return f.rescues;}),'# rescues');
    if(m==='hoops')add('Sharpshooter','fire','#ff7a1a',best(function(f){return f._swish;}),'# swishes');
    if(m==='redlight')add('Daredevil','speed','#ff3b5c',best(function(f){return f._caught;}),'caught # times');
    add('Power Player','shield','#2de2ff',best(function(f){return f._pk;}),'# power-ups');
    add('Hop Machine','speed','#c6ff3d',best(function(f){return f._hops;},3),'# hops');
    return A;}
  function ordinal(n){return n+(n===1?'st':n===2?'nd':n===3?'rd':'th');}
  function buildResults(winner){pod.innerHTML='';var md=info();ev.style.setProperty('--evm',md.col||'#2de2ff');
    var ok=ROSTER.length>1&&gameMode!=='zen'&&gameMode!=='tutorial'&&gameMode!=='hns'&&!(gameMode==='hoops'&&typeof hoopsEndInfo!=='undefined'&&hoopsEndInfo&&hoopsEndInfo.team);
    ev.classList.toggle('has-podium',ok);if(!ok)return;
    var rk=ROSTER.slice().sort(function(a,b){return val(b)-val(a);});if(winner&&rk.indexOf(winner)>0){rk.splice(rk.indexOf(winner),1);rk.unshift(winner);}
    var me=rk.indexOf(player),show=rk.slice(0,Math.min(rk.length,me>5?5:6));
    function row(f,i){return '<div class="sr3'+(f===player?' me':'')+(i<3?' top t'+(i+1):'')+'" data-testid="end-rank-'+(i+1)+'" style="--fc:'+f.col+';--d:'+(i*60)+'ms"><span class="rk">'+(i+1)+'</span><img alt="" src="'+portrait(f)+'"><span class="nm">'+esc(f.isP?'You':f.name)+'</span><span class="st">'+esc(statTxt(f))+'</span><i class="br"><u style="transform:scaleX('+bar(f,rk).toFixed(3)+')"></u></i></div>';}
    var h='<div class="ev3-h"><span>Standings</span><b data-testid="end-your-place">'+(me>=0?'You placed '+ordinal(me+1)+' of '+rk.length:'')+'</b></div><div class="ev3-list">'+show.map(row).join('');
    if(me>=show.length)h+='<div class="sr3-gap"></div>'+row(player,me);h+='</div>';
    var A=awards(rk);if(A.length)h+='<div class="ev3-h"><span>Awards</span></div><div class="ev3-aw">'+A.map(function(a,i){return '<div class="aw3" style="--ac:'+a.col+';--d:'+(300+i*90)+'ms" data-testid="end-award"><div class="aw3-top"><img alt="" src="'+glyphImg(a.ic,a.col)+'"><b>'+esc(a.t)+'</b></div><div class="aw3-who"><img alt="" src="'+portrait(a.f)+'"><span><em>'+esc(a.f.isP?'You':a.f.name)+'</em>'+esc(a.txt)+'</span></div></div>';}).join('')+'</div>';
    pod.innerHTML=h;}
  var _eg=endGame;endGame=function(w){var was=(STATE==='play'||STATE==='countdown');var r=_eg.apply(this,arguments);
    if(was){try{ROSTER.forEach(function(f){if(fleas.indexOf(f)<0&&OUT.indexOf(f)<0)OUT.push(f);});buildResults(w);
      var won=w&&w.isP,et=el('end-title');ev.classList.toggle('ev3-win',!!won);ev.classList.toggle('ev3-lose',!won&&gameMode!=='zen');
      if(et&&et.textContent==='DEFEAT')et.textContent='SO CLOSE!';var wr=el('winner-role');if(wr&&!won&&gameMode!=='zen')wr.textContent='Winner';}catch(e){console.warn('results',e);}}
    meter.classList.remove('show');chips.classList.remove('show');abil.classList.remove('show');return r;};
  var _tl=toLobby;toLobby=function(){meter.classList.remove('show');chips.classList.remove('show');abil.classList.remove('show');feedBox.innerHTML='';return _tl.apply(this,arguments);};
  return {endNow:function(w){endGame(w===undefined?player:w);},alert:alert,feed:feed,portrait:portrait,roster:function(){return ROSTER;}};
})();
window.FreaHud2=FreaHud2;
