/* ===================== FREA! PLUS — MODE DEPTH =====================
   Power-up pickups + per-mode twists that make every mode richer.
   Pickups: Turbo (speed), Shield, Magnet (Star Rush), Cure (Infectious), Ice Burst (Freeze Tag)
   Capture   · OVERCHARGE after 6s of holding + steal-bump knockback
   Race      · boost pads + checkpoints with split times
   Burning   · fuse burns faster with every pass, shield blocks the hot orb
   Infectious· cure pickups + LAST STAND sprint for the final 2 safe fleas
   Hide&Seek · seeker RADAR pulse (Q) · hider TAUNT (Q) shaves 3s off the seek clock
   Hoops     · score streak → ON FIRE (+1 bonus per bucket)
   KOTH      · hill shrinks over time · GOLDEN HILL final 15s (double) · contested alerts
   Lava      · lava geysers erupt, crumble platforms and blast fleas
   Star Rush · STAR SHOWERS + combo chains (+2 bonus on 5-chains) + magnet
   Red Light · boost pads on the track + FAKE-OUT yellows
   Freeze    · ice burst pickups (IT: freeze blast · runners: thaw blast) + rescue streaks
   Exposes window.FreaPlus for the HUD (power-up chips, ability button, meter extras). */
var FreaPlus=(function(){
  var TAU=Math.PI*2;
  function T(){return Date.now();}
  function el(id){return document.getElementById(id);}
  function XS(){try{return FreaModes.state()||{};}catch(e){return {};}}
  function burstAt(x,y,c,n){for(var i=0;i<(n||14);i++){var a=Math.random()*TAU,s=2+Math.random()*5;parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.5,l:1,r:2+Math.random()*3,c:c});}}
  function alert(txt,col,sub){try{if(window.FreaHud2)FreaHud2.alert(txt,col,sub);else flash(txt,col);}catch(e){}}
  function feed(txt,col,ico){try{if(window.FreaHud2)FreaHud2.feed(txt,col,ico);}catch(e){}}
  function nm(f){return f.isP?'YOU':String(f.name||'').toUpperCase();}

  /* ---------------- power-up catalogue ---------------- */
  var PU={
    speed:{name:'Turbo',col:'#ffd23d',ms:6500,desc:'Faster hops'},
    shield:{name:'Shield',col:'#2de2ff',ms:8000,desc:'Blocks the bad stuff'},
    magnet:{name:'Magnet',col:'#ff3db5',ms:7000,desc:'Pulls stars to you'},
    cure:{name:'Cure',col:'#39ff7a',ms:6000,desc:'Cures infection'},
    ice:{name:'Ice Burst',col:'#8fe8ff',ms:0,desc:'Freeze or thaw nearby'}
  };
  var MODE_PU={classic:['speed','shield'],race:['speed','speed','shield'],survival:['speed','shield'],tag:['speed','cure','cure'],stars:['speed','magnet'],
    freeze:['speed','ice','ice'],koth:['speed','shield'],lava:['speed','shield'],redlight:['speed']};
  var R={}; /* per-round state */
  function reset(){R={pick:[],spawnT:4200,mode:gameMode,t0:T(),pads:[],geysers:[],gT:6000,passes:0,lastHolder:null,holdT:0,ocFlash:false,
    cps:[0.25,0.5,0.75],cpHit:0,startY:null,radarCD:0,tauntCD:0,radar:null,shower:0,showerT:16000,lastStand:false,contestT:0,golden:false,fakeOut:false,splits:[],stats:{}};
    (fleas||[]).forEach(function(f){f._pu={};f._combo=0;f._comboT=0;f._hstreak=0;f._fireUntil=0;f._rstreak=0;f._pk=0;f._taunts=0;f._steals=0;});
    if(gameMode==='race')setupRacePads();if(gameMode==='redlight')setupRLPads();}
  function active(f,k){return !!(f&&f._pu&&f._pu[k]&&f._pu[k]>T());}
  function give(f,k){if(!f._pu)f._pu={};var d=PU[k];f._pu[k]=T()+d.ms;f._pk=(f._pk||0)+1;}
  function platsOK(){return platforms.filter(function(p,i){return i>=3&&!p.deco&&!p.wall&&!p.gone&&!p.sinking&&!p.crumbT&&!p._hnsHider&&!p._hnsReal&&p.kind==='rect';});}
  function spawnPU(){var pool=MODE_PU[gameMode];if(!pool)return;var k=pool[Math.random()*pool.length|0],x,y;
    var ps=platsOK();if(gameMode==='lava'){var S=XS();ps=ps.filter(function(p){return p.y<(S.lava||WORLD_H)-160;});}
    if(gameMode==='redlight'){x=Math.min(WORLD_W-300,Math.max(400,(player?player.cx:400)+300+Math.random()*900));y=WORLD_H-60-60-Math.random()*90;}
    else if(ps.length&&(Math.random()<0.75||gameMode==='lava')){var p=ps[Math.random()*ps.length|0];x=p.x+p.w*(0.2+Math.random()*0.6);y=p.y-26;}
    else if(gameMode!=='lava'){x=60+Math.random()*(WORLD_W-120);y=WORLD_H-60-28;}
    else return;
    R.pick.push({k:k,x:x,y:y,born:T(),ph:Math.random()*6});}
  function pickup(f,p){var k=p.k,d=PU[k];burstAt(p.x,p.y,d.col,18);
    if(k==='cure'){if(f.infected){f.infected=false;give(f,'shield');f._pu.shield=T()+3000;alert(f.isP?'CURED!':nm(f)+' GOT CURED!','#39ff7a');try{updScore();}catch(e){}}else{give(f,'shield');f._pu.shield=T()+5000;}f._pk++;}
    else if(k==='ice'){iceBurst(f);f._pk++;}
    else give(f,k);
    if(!f.isP)feed((f.isP?'You':f.name)+' grabbed '+d.name,d.col,k);
    if(f.isP&&k!=='ice'&&k!=='cure')flash(d.name.toUpperCase()+'! '+d.desc,d.col);}
  function iceBurst(f){var r=200,n=0;burstAt(f.cx,f.cy,'#8fe8ff',30);R.rings=(R.rings||[]);R.rings.push({x:f.cx,y:f.cy,t:T(),col:'#8fe8ff',r:r});
    fleas.forEach(function(o){if(o===f)return;var d=Math.hypot(o.cx-f.cx,o.cy-f.cy);if(d>r)return;
      if(f.it&&!o.it&&!o.iced&&!active(o,'shield')&&T()>(o.immune||0)){o.iced=true;o.frozen=T()+1e9;o.vx=0;o.vy=0;n++;}
      else if(!f.it&&o.iced){o.iced=false;o.frozen=0;o.immune=T()+1600;o.stuck=false;o.vy=-4;f.rescues=(f.rescues||0)+1;n++;}});
    if(f.it)alert(n?(f.isP?'FREEZE BLAST! ':'ICE BLAST! ')+n+' FROZEN':'ICE BLAST MISSED!','#8fe8ff');
    else alert(n?(f.isP?'THAW BLAST! ':nm(f)+' THAWED ')+n+(f.isP?' FREED':''):'THAW BLAST!','#c6ff3d');
    try{updScore();}catch(e){}}

  /* ---------------- speed: wrap launch ---------------- */
  var _launch=Flea.prototype.launch;
  Flea.prototype.launch=function(vx,vy){var r=_launch.apply(this,arguments);if(STATE==='play'){this._hops=(this._hops||0)+1;
      if(active(this,'speed')){this.vx*=1.3;this.vy*=1.12;}if(this._lastStand){this.vx*=1.18;}}return r;};

  /* ---------------- shield: infect / steal / sting / lava ---------------- */
  var _inf=infect;infect=function(s,by){if(active(s,'shield')&&gameMode==='tag'){if(by){by.vx=(by.cx<s.cx?-8:8);by.vy=-6;by.stuck=false;by.platform=null;}burstAt(s.cx,s.cy,'#2de2ff',10);return;}return _inf.apply(this,arguments);};
  checkSteal=function(){if(!orbHolder||!orb)return;
    if(gameMode==='classic'&&active(orbHolder,'shield'))return;
    for(var i=0;i<fleas.length;i++){var f=fleas[i];if(f===orbHolder)continue;
      if(gameMode==='survival'&&active(f,'shield'))continue;
      if(Math.hypot(f.cx-orb.x,f.cy-orb.y)<f.w/2+orb.r+5){var prev=orbHolder;prev.hasOrb=false;orbHolder=f;f.hasOrb=true;capTimer=0;ofx(orb.x,orb.y);
        flash(f.name.toUpperCase()+(gameMode==='survival'?' GOT THE HOT ORB!':' STOLE THE ORB!'),'#ff3db5');camera.shake=6;if(f.isP)bump('orbsCaptured');
        f._steals=(f._steals||0)+1;
        if(gameMode==='classic'){/* steal-bump: the old holder gets knocked away */prev.vx=(prev.cx<f.cx?-9:9);prev.vy=-7;prev.stuck=false;prev.platform=null;prev.onG=false;burstAt(prev.cx,prev.cy,'#ffd23d',10);}
        if(!f.isP)maybeSay(f,EVENT_LINES.grabOrb[Math.random()*EVENT_LINES.grabOrb.length|0],1600);break;}}};
  function wrapModes(){var X=EXTRA_MODES;
    if(X.stars&&!X.stars._mp){X.stars._mp=1;var _h=X.stars.hit;X.stars.hit=function(f,s){
      if(s.k==='spike'&&active(f,'shield')){burstAt(s.x,s.y,'#2de2ff',12);return;}
      var r=_h.apply(this,arguments);
      if(s.k!=='spike'){var t=T();f._combo=(t-(f._comboT||0)<1600)?(f._combo||0)+1:1;f._comboT=t;
        if(f._combo>=5&&f._combo%5===0){f.starPts=(f.starPts||0)+2;if(f.isP)alert('COMBO x'+f._combo+'! +2','#ffd23d');else feed(f.name+' combo x'+f._combo,'#ffd23d','star');}}
      else f._combo=0;return r;};
      var _st=X.stars.tick;X.stars.tick=function(dt){var S=XS();
        R.showerT-=dt;if(R.showerT<=0&&!R.shower){R.shower=4200;R.showerT=17000+Math.random()*6000;alert('STAR SHOWER!','#ffd23d','Grab as many as you can');}
        if(R.shower>0){R.shower-=dt;if(R.shower<=0)R.shower=0;if(Math.random()<dt/90&&S.stars&&S.stars.length<60){X.stars.add();var s=S.stars[S.stars.length-1];if(s.k==='spike'){s.k='gold';s.r=11;}}}
        /* magnet: pull non-spiky stars toward the holder */
        if(S.stars)fleas.forEach(function(f){if(!active(f,'magnet'))return;S.stars.forEach(function(s){if(s.k==='spike')return;var dx=f.cx-s.x,dy=f.cy-s.y,d=Math.hypot(dx,dy);if(d<280&&d>1){var k=Math.min(d,(dt/16)*7);s.x+=dx/d*k;s.y+=dy/d*k;s.land=0;}});});
        return _st.apply(this,arguments);};}
    if(X.redlight&&!X.redlight._mp){X.redlight._mp=1;var _set=X.redlight.set;X.redlight.set=function(ph){var S=XS();
        if(ph==='red'&&R.fakeOut){R.fakeOut=false;_set.call(this,'green');flash('FAKE OUT! KEEP GOING!','#39ff7a');feed('Fake out! Still green','#39ff7a','light');return;}
        var r=_set.apply(this,arguments);
        if(ph==='yellow'&&Math.random()<0.25){R.fakeOut=true;}
        return r;};
      var _ct=X.redlight.caught;X.redlight.caught=function(f){if(active(f,'shield')){f._snap={x:f.x,y:f.y};f._pu.shield=0;burstAt(f.cx,f.cy,'#2de2ff',14);if(f.isP)alert('SHIELD SAVED YOU!','#2de2ff');return;}
        f._caught=(f._caught||0)+1;var r=_ct.apply(this,arguments);if(!f.isP)feed(f.name+' got caught moving','#ff3b5c','light');return r;};}
    if(X.lava&&!X.lava._mp){X.lava._mp=1;var _lt=X.lava.tick;X.lava.tick=function(dt){var S=XS();
        /* shields bounce you out of the lava once */
        fleas.forEach(function(f){if(f.y+f.h>S.lava+2&&active(f,'shield')){f._pu.shield=0;f.y=S.lava-f.h-10;f.vy=-19;f.vx=(Math.random()-.5)*8;f.stuck=false;f.platform=null;f.onG=false;burstAt(f.cx,S.lava,'#2de2ff',20);if(f.isP)alert('SHIELD BOUNCE!','#2de2ff');}});
        lavaGeysers(dt,S);return _lt.apply(this,arguments);};}
    if(X.koth&&!X.koth._mp){X.koth._mp=1;var _kt=X.koth.tick;X.koth.tick=function(dt){var S=XS(),z=S.zone;if(z){if(!z._r0)z._r0=z.r;var frac=Math.max(0,Math.min(1,(S.left||0)/Math.max(1,FreaModes.round())));z.r=z._r0*(0.58+0.42*frac);}
        var r=_kt.apply(this,arguments);if(STATE!=='play'||!S.zone)return r;z=S.zone;if(!z._r0)z._r0=z.r;
        var ins=fleas.filter(function(f){return Math.hypot(f.cx-z.x,f.cy-z.y)<z.r;});
        if(!R.golden&&S.left<=15&&S.left>0){R.golden=true;alert('GOLDEN HILL!','#ffd23d','Double points for the last 15s');}
        for(var i=0;i<ins.length;i++){var f=ins[i],extra=0;if(R.golden)extra+=ins.length===1?dt/110:dt/330;if(ins.length>1&&active(f,'shield'))extra+=dt/110-dt/330;
          if(extra){f.hill=Math.min(100,(f.hill||0)+extra);if(f.hill>=100){endGame(f);return r;}}}
        if(z.contested&&ins.indexOf(player)>=0&&T()-R.contestT>4500){R.contestT=T();feed('Hill contested! Push them out','#ff3db5','sword');}
        return r;};}
    if(X.freeze&&!X.freeze._mp){X.freeze._mp=1;var _ft=X.freeze.tick;X.freeze.tick=function(dt){var before={};fleas.forEach(function(f,i){before[i]=f.rescues||0;});var r=_ft.apply(this,arguments);
        fleas.forEach(function(f,i){if((f.rescues||0)>before[i]){f._rstreak=(f._rstreak||0)+1;if(f._rstreak===3){if(f.isP)alert('HERO! 3 RESCUES','#c6ff3d');else feed(f.name+' is a hero (3 rescues)','#c6ff3d','heart');}}});return r;};}
  }

  /* ---------------- race: boost pads + checkpoints ---------------- */
  function setupRacePads(){var ps=platsOK().filter(function(p){return p.w>=70&&p.w<WORLD_W*0.5;});ps.sort(function(){return Math.random()-.5;});
    var n=Math.max(2,Math.round(ps.length*0.22));for(var i=0;i<n&&i<ps.length;i++){ps[i]._boost=true;R.pads.push(ps[i]);}}
  function raceTick(){if(!orb)return;if(R.startY==null&&player)R.startY=WORLD_H-60;
    fleas.forEach(function(f){if(f.stuck&&f.platform&&f.platform._boost&&f._padP!==f.platform){f._padP=f.platform;f.launch((orb.x>f.cx?3:-3),-21);burstAt(f.cx,f.y+f.h,'#c6ff3d',16);if(f.isP)feed('Boost pad!','#c6ff3d','bolt');}
      if(f.stuck&&f.platform&&!f.platform._boost)f._padP=null;});
    if(player&&R.startY!=null){var prog=(R.startY-player.cy)/Math.max(1,R.startY-orb.y);R.raceProg=Math.max(0,Math.min(1,prog));
      while(R.cpHit<R.cps.length&&prog>=R.cps[R.cpHit]){var s=(T()-R.t0)/1000;R.splits.push(s);R.cpHit++;alert('CHECKPOINT '+R.cpHit+'/3',"#c6ff3d",'Split '+s.toFixed(1)+'s');}}}
  function drawRacePads(cx,cy){var t=T()/1000;R.pads.forEach(function(p){if(platforms.indexOf(p)<0)return;var x=p.x-cx,y=p.y-cy;if(x<-p.w-20||x>W+20||y<-40||y>H+40)return;ctx.save();
    ctx.fillStyle='rgba(198,255,61,.22)';ctx.shadowColor='#c6ff3d';ctx.shadowBlur=perfMode?0:14;ctx.beginPath();ctx.roundRect(x+4,y-6,p.w-8,8,4);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='#c6ff3d';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';var mx=x+p.w/2;for(var k=0;k<3;k++){var yy=y-12-k*9-((t*30)%9);ctx.globalAlpha=0.9-k*0.25;ctx.beginPath();ctx.moveTo(mx-9,yy+5);ctx.lineTo(mx,yy-3);ctx.lineTo(mx+9,yy+5);ctx.stroke();}ctx.restore();});}

  /* ---------------- red light: boost pads on the track ---------------- */
  function setupRLPads(){for(var x=900;x<WORLD_W-700;x+=1100+Math.random()*700)R.pads.push({x:x,w:110,rl:true});}
  function rlTick(){var S=XS();fleas.forEach(function(f){R.pads.forEach(function(p){if(!p.rl)return;if(f.stuck&&f.y+f.h>WORLD_H-70&&f.cx>p.x&&f.cx<p.x+p.w&&f._rlPad!==p&&S.ph==='green'){f._rlPad=p;f.launch(15,-8);f.face=1;burstAt(f.cx,f.y+f.h,'#39ff7a',16);if(f.isP)feed('Speed pad! Zoom','#39ff7a','bolt');}});});}
  function drawRLPads(cx,cy){var t=T()/1000,gy=WORLD_H-60-cy;R.pads.forEach(function(p){var x=p.x-cx;if(x<-p.w-20||x>W+20)return;ctx.save();ctx.fillStyle='rgba(57,255,122,.18)';ctx.shadowColor='#39ff7a';ctx.shadowBlur=perfMode?0:16;ctx.beginPath();ctx.roundRect(x,gy-8,p.w,10,5);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='#39ff7a';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';for(var k=0;k<3;k++){var xx=x+20+k*28+((t*40)%28);ctx.globalAlpha=0.35+0.2*k;ctx.beginPath();ctx.moveTo(xx-5,gy-20);ctx.lineTo(xx+5,gy-13);ctx.lineTo(xx-5,gy-6);ctx.stroke();}ctx.restore();});}

  /* ---------------- lava geysers ---------------- */
  function lavaGeysers(dt,S){if(S.grace>0||STATE!=='play')return;R.gT-=dt;
    if(R.gT<=0){R.gT=4200+Math.random()*3600;var x=60+Math.random()*(WORLD_W-120);if(player&&Math.random()<0.45)x=Math.max(60,Math.min(WORLD_W-60,player.cx+(Math.random()-.5)*360));R.geysers.push({x:x,w:46,t:0,warn:1300,live:1300});}
    for(var i=R.geysers.length-1;i>=0;i--){var g=R.geysers[i];g.t+=dt;if(g.t>g.warn+g.live){R.geysers.splice(i,1);continue;}
      if(g.t>g.warn){var top=S.lava-Math.min(1,(g.t-g.warn)/250)*420;
        fleas.forEach(function(f){if(Math.abs(f.cx-g.x)<g.w/2+f.w/2&&f.y+f.h>top&&f._gy!==g){f._gy=g;f.launch((f.cx<g.x?-1:1)*(7+Math.random()*4),-15);burstAt(f.cx,f.cy,'#ff7a1a',16);if(f.isP){camera.shake=10;alert('GEYSER!','#ff7a1a');}}});
        platforms.forEach(function(p,j){if(j<3||p.deco||p.sinking||p.crumbT)return;if(p.x<g.x+g.w/2&&p.x+p.w>g.x-g.w/2&&p.y+p.h>top){p.crumbT=500;p._mb=p.matBase;}});}}}
  function drawGeysers(cx,cy){var S=XS(),t=T()/1000;R.geysers.forEach(function(g){var x=g.x-cx,ly=S.lava-cy;ctx.save();
    if(g.t<g.warn){var a=0.35+0.35*Math.sin(t*22);ctx.fillStyle='rgba(255,210,61,'+a+')';ctx.beginPath();ctx.ellipse(x,ly+2,g.w*.8,8,0,0,TAU);ctx.fill();ctx.font="900 13px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.fillStyle='#ffd23d';ctx.fillText('!',x,ly-14);}
    else{var h=Math.min(1,(g.t-g.warn)/250)*420*(1-Math.max(0,(g.t-g.warn-g.live+300)/300));var gr=ctx.createLinearGradient(0,ly-h,0,ly);gr.addColorStop(0,'rgba(255,210,61,.0)');gr.addColorStop(.2,'#ffd23d');gr.addColorStop(.6,'#ff7a1a');gr.addColorStop(1,'#e8321a');
      ctx.fillStyle=gr;ctx.shadowColor='#ff5a1e';ctx.shadowBlur=perfMode?0:26;ctx.beginPath();ctx.moveTo(x-g.w/2,ly);for(var k=0;k<=8;k++){var yy=ly-h*k/8;ctx.lineTo(x-g.w/2+Math.sin(t*14+k)*5*(k/8),yy);}for(var k2=8;k2>=0;k2--){var y2=ly-h*k2/8;ctx.lineTo(x+g.w/2+Math.cos(t*13+k2)*5*(k2/8),y2);}ctx.closePath();ctx.fill();
      if(Math.random()<0.5)parts.push({x:g.x+(Math.random()-.5)*g.w,y:S.lava-h*Math.random(),vx:(Math.random()-.5)*4,vy:-2-Math.random()*3,l:1,r:2+Math.random()*3,c:'#ffb03d'});}
    ctx.restore();});}

  /* ---------------- burning orb: fuse accelerates ---------------- */
  function survTick(dt){if(orbHolder!==R.lastHolder){if(R.lastHolder&&orbHolder){R.passes++;if(R.passes%4===0)feed('Fuse burning faster ×'+fmul().toFixed(1),'#ff7a1a','fire');}R.lastHolder=orbHolder;}
    if(orbHolder){fuse-=dt*(fmul()-1);if(fuse<0)fuse=0.01;}}
  function fmul(){return Math.min(2.2,1+(R.passes||0)*0.07);}

  /* ---------------- capture: overcharge ---------------- */
  function capTick(dt){if(orbHolder!==R.lastHolder){R.lastHolder=orbHolder;R.holdT=0;R.ocFlash=false;}if(!orbHolder)return;R.holdT+=dt;
    if(R.holdT>6000){if(!R.ocFlash){R.ocFlash=true;if(orbHolder.isP)alert('OVERCHARGE!','#ffd23d','Your ring fills faster');else feed(orbHolder.name+' is OVERCHARGED','#ffd23d','bolt');}
      R.ocAcc=(R.ocAcc||0)+dt;while(R.ocAcc>=600){R.ocAcc-=600;orbHolder.capture=Math.min(100,orbHolder.capture+1);if(orbHolder.capture>=100){endRound(orbHolder);return;}}}}
  function overcharged(){return gameMode==='classic'&&orbHolder&&R.holdT>6000;}

  /* ---------------- infectious: last stand ---------------- */
  function tagTick2(){if(!tagSeeded||R.lastStand)return;var safe=fleas.filter(function(f){return !f.infected;});if(safe.length===2){R.lastStand=true;safe.forEach(function(f){f._lastStand=true;});alert('LAST STAND!','#2de2ff','The final two get a speed boost');}}

  /* ---------------- hide & seek: radar + taunt ---------------- */
  function hnsAbility(){if(gameMode!=='hns'||STATE!=='play'||!player)return;var t=T();
    if(hnsSeeker===player){if(hnsPhase!=='seek'||t<R.radarCD)return;R.radarCD=t+12000;R.radar={x:player.cx,y:player.cy,t:t,r:340};var n=0;
      platforms.forEach(function(p){if(p._hnsHider&&!p._hnsHider.found){var c=propCenter(p);if(Math.hypot(c.x-player.cx,c.y-player.cy)<340){p._ping=t;n++;}}});
      alert(n?'RADAR: '+n+' NEARBY':'RADAR: NOTHING CLOSE',n?'#ffd23d':'#9b6bff');}
    else{if(t<R.tauntCD||!player.hidden)return;R.tauntCD=t+8000;player._taunts=(player._taunts||0)+1;hnsSeekLeft=Math.max(1000,hnsSeekLeft-3000);
      var pr=null;platforms.forEach(function(p){if(p._hnsHider===player)pr=p;});if(pr){pr._taunt=t;var c=propCenter(pr);burstAt(c.x,c.y,'#ff3db5',16);
        if(hnsSeeker&&!hnsSeeker.isP&&Math.hypot(hnsSeeker.cx-c.x,hnsSeeker.cy-c.y)<520&&Math.random()<0.5)hnsSeeker._seekTarget={p:pr};}
      alert('TAUNT! −3s','#ff3db5','The seeker might have heard that');}}
  function abilityState(){if(gameMode!=='hns'||!player||STATE!=='play')return null;var t=T();
    if(hnsSeeker===player)return {id:'radar',label:'Radar',key:'Q',ready:hnsPhase==='seek'&&t>=R.radarCD,cd:Math.max(0,R.radarCD-t),max:12000,col:'#ffd23d'};
    if(hnsPhase==='seek'&&player.hidden)return {id:'taunt',label:'Taunt',key:'Q',ready:t>=R.tauntCD,cd:Math.max(0,R.tauntCD-t),max:8000,col:'#ff3db5'};return null;}
  document.addEventListener('keydown',function(e){if(e.code==='KeyQ')hnsAbility();});
  function hnsAI(){if(!player||hnsPhase!=='seek'||!hnsSeeker||hnsSeeker.isP)return;var t=T();if(t<R.radarCD)return;R.radarCD=t+16000;var s=hnsSeeker;R.radar={x:s.cx,y:s.cy,t:t,r:340,ai:true};
    platforms.forEach(function(p){if(p._hnsHider===player&&!player.found){var c=propCenter(p);if(Math.hypot(c.x-s.cx,c.y-s.cy)<340&&Math.random()<0.35)s._seekTarget={p:p};}});
    if(Math.hypot(player.cx-s.cx,player.cy-s.cy)<340)feed(s.name+' pinged radar nearby!','#ffd23d','radar');}
  function drawHns(cx,cy){var t=T();if(R.radar){var a=(t-R.radar.t)/900;if(a<1){ctx.save();ctx.strokeStyle=R.radar.ai?'rgba(255,61,181,'+(1-a)+')':'rgba(255,210,61,'+(1-a)+')';ctx.lineWidth=4;ctx.beginPath();ctx.arc(R.radar.x-cx,R.radar.y-cy,R.radar.r*a,0,TAU);ctx.stroke();ctx.restore();}}
    platforms.forEach(function(p){if(p._ping&&t-p._ping<1600&&p._hnsHider&&!p._hnsHider.found){var c=propCenter(p),k=1-(t-p._ping)/1600;ctx.save();ctx.strokeStyle='rgba(255,210,61,'+k+')';ctx.setLineDash([6,6]);ctx.lineWidth=3;ctx.beginPath();ctx.arc(c.x-cx,c.y-cy,34+Math.sin(t/80)*3,0,TAU);ctx.stroke();ctx.restore();}
      if(p._taunt&&t-p._taunt<1400){var c2=propCenter(p),k2=(t-p._taunt)/1400;ctx.save();ctx.globalAlpha=1-k2;ctx.font="900 20px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.fillStyle='#ff3db5';ctx.fillText('♪',c2.x-cx-14,c2.y-cy-30-k2*30);ctx.fillText('♫',c2.x-cx+14,c2.y-cy-40-k2*26);ctx.restore();}});}

  /* ---------------- hoops: ON FIRE ---------------- */
  var _ha=hoopApply;hoopApply=function(f,h,dx){var b=f.matchPoints||0;var r=_ha.apply(this,arguments);var d=(f.matchPoints||0)-b,t=T();
    if(d>0){f._hstreak=(t-(f._hLast||0)<9000)?(f._hstreak||0)+1:1;f._hLast=t;
      if(f._hstreak>=3){f._fireUntil=t+9000;f.matchPoints+=1;if(f.team){if(f.team==='home')hoopScore.home+=1;else hoopScore.away+=1;}
        if(f._hstreak===3){if(f.isP)alert("YOU'RE ON FIRE!",'#ff7a1a','+1 bonus on every bucket');else feed(f.name+' is ON FIRE','#ff7a1a','fire');}}}
    else if(d<0){f._hstreak=0;f._fireUntil=0;}return r;};

  /* ---------------- pickups: draw ---------------- */
  function glyph(c,k,s){c.save();c.strokeStyle='#fff';c.fillStyle='#fff';c.lineWidth=2.4*s/10;c.lineCap='round';c.lineJoin='round';
    if(k==='speed'){c.beginPath();c.moveTo(2*s/10,-9*s/10);c.lineTo(-5*s/10,1*s/10);c.lineTo(0,1*s/10);c.lineTo(-2*s/10,9*s/10);c.lineTo(5*s/10,-1*s/10);c.lineTo(0,-1*s/10);c.closePath();c.fill();}
    else if(k==='shield'){c.beginPath();c.moveTo(0,-8*s/10);c.lineTo(7*s/10,-5*s/10);c.quadraticCurveTo(7*s/10,5*s/10,0,9*s/10);c.quadraticCurveTo(-7*s/10,5*s/10,-7*s/10,-5*s/10);c.closePath();c.stroke();}
    else if(k==='magnet'){c.lineWidth=3.4*s/10;c.beginPath();c.arc(0,0,5.5*s/10,Math.PI,0,true);c.stroke();c.beginPath();c.moveTo(-5.5*s/10,0);c.lineTo(-5.5*s/10,-6*s/10);c.moveTo(5.5*s/10,0);c.lineTo(5.5*s/10,-6*s/10);c.stroke();}
    else if(k==='cure'){c.lineWidth=3.6*s/10;c.beginPath();c.moveTo(0,-6*s/10);c.lineTo(0,6*s/10);c.moveTo(-6*s/10,0);c.lineTo(6*s/10,0);c.stroke();}
    else if(k==='ice'){for(var i=0;i<3;i++){c.save();c.rotate(i*Math.PI/3);c.beginPath();c.moveTo(0,-8*s/10);c.lineTo(0,8*s/10);c.moveTo(-3*s/10,-6*s/10);c.lineTo(0,-3.5*s/10);c.lineTo(3*s/10,-6*s/10);c.moveTo(-3*s/10,6*s/10);c.lineTo(0,3.5*s/10);c.lineTo(3*s/10,6*s/10);c.stroke();c.restore();}}
    c.restore();}
  function drawPick(cx,cy){var t=T();R.pick.forEach(function(p){var x=p.x-cx,y=p.y-cy+Math.sin(t/300+p.ph)*4;if(x<-30||x>W+30||y<-30||y>H+30)return;var d=PU[p.k],age=t-p.born,blink=age>13000?(Math.floor(t/120)%2?0.35:1):1;
    ctx.save();ctx.globalAlpha=blink;ctx.translate(x,y);var g=ctx.createRadialGradient(-4,-5,2,0,0,17);g.addColorStop(0,'#fff');g.addColorStop(.35,d.col);g.addColorStop(1,rgbaOf(d.col,.55));
    ctx.shadowColor=d.col;ctx.shadowBlur=perfMode?0:22;ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,15,0,TAU);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.lineDashOffset=-t/40;ctx.beginPath();ctx.arc(0,0,20,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(6,10,26,.38)';ctx.beginPath();ctx.arc(0,0,10.5,0,TAU);ctx.fill();glyph(ctx,p.k,10);ctx.restore();});}
  function drawAuras(cx,cy){var t=T();fleas.forEach(function(f){if(f.hidden)return;var x=f.cx-cx,y=f.cy-cy;if(x<-60||x>W+60||y<-60||y>H+60)return;ctx.save();
    if(active(f,'shield')){ctx.strokeStyle='rgba(45,226,255,.85)';ctx.fillStyle='rgba(45,226,255,.10)';ctx.lineWidth=2.5;ctx.shadowColor='#2de2ff';ctx.shadowBlur=perfMode?0:14;ctx.beginPath();ctx.arc(x,y,f.w*0.95+Math.sin(t/160)*1.5,0,TAU);ctx.fill();ctx.stroke();ctx.shadowBlur=0;}
    if(active(f,'speed')&&!f.stuck&&Math.random()<0.6)parts.push({x:f.cx-f.vx*1.5,y:f.cy-f.vy*1.5,vx:-f.vx*.1,vy:-f.vy*.1,l:0.8,r:2+Math.random()*2.5,c:'#ffd23d'});
    if(active(f,'magnet')){ctx.strokeStyle='rgba(255,61,181,.45)';ctx.lineWidth=2;ctx.setLineDash([4,7]);ctx.lineDashOffset=t/30;ctx.beginPath();ctx.arc(x,y,60+((t/12)%40),0,TAU);ctx.stroke();ctx.setLineDash([]);}
    if(f._fireUntil>t){for(var k=0;k<(perfMode?1:3);k++)parts.push({x:f.cx+(Math.random()-.5)*f.w,y:f.y+f.h*0.3,vx:(Math.random()-.5)*1.2,vy:-1.5-Math.random()*2,l:0.9,r:2+Math.random()*3,c:Math.random()<.5?'#ff7a1a':'#ffd23d'});}
    if(f._lastStand&&!f.infected&&Math.random()<0.3)parts.push({x:f.cx,y:f.cy,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,l:0.7,r:2,c:'#2de2ff'});
    ctx.restore();});
    (R.rings||[]).forEach(function(r){var a=(t-r.t)/600;if(a>1)return;ctx.save();ctx.strokeStyle=rgbaOf(r.col,1-a);ctx.lineWidth=5*(1-a)+1;ctx.beginPath();ctx.arc(r.x-cx,r.y-cy,r.r*a,0,TAU);ctx.stroke();ctx.restore();});}

  /* ---------------- per-frame hook (runs at end of the world draw) ---------------- */
  var _dfx=drawFX;drawFX=function(){
    try{if(STATE==='play'&&!editMode&&R.mode===gameMode&&gameMode!=='zen'&&gameMode!=='tutorial'){var dt=Math.min(50,T()-(R._lt||T()));R._lt=T();if(isPaused)dt=0;
        /* pickups */
        if(MODE_PU[gameMode]){R.spawnT-=dt;var cap=gameMode==='redlight'?3:Math.min(4,2+Math.floor(fleas.length/4));if(R.spawnT<=0){var _pr=window.FreaGameplay?FreaGameplay.puRate():1;R.spawnT=(7000+Math.random()*5000)*(_pr||1);if(_pr&&R.pick.length<cap)spawnPU();}
          for(var i=R.pick.length-1;i>=0;i--){var p=R.pick[i];if(T()-p.born>15000){R.pick.splice(i,1);continue;}
            if(gameMode==='lava'){var S=XS();if(p.y>S.lava-10){R.pick.splice(i,1);continue;}}
            for(var j=0;j<fleas.length;j++){var f=fleas[j];if(f.hidden||f.iced)continue;if(Math.hypot(f.cx-p.x,f.cy-p.y)<f.w/2+17){R.pick.splice(i,1);pickup(f,p);break;}}}}
        if(gameMode==='race')raceTick();else if(gameMode==='redlight')rlTick();else if(gameMode==='survival')survTick(dt);else if(gameMode==='classic')capTick(dt);else if(gameMode==='tag')tagTick2();else if(gameMode==='hns')hnsAI();}
      if((STATE==='play'||STATE==='gameover')&&R.mode===gameMode&&gameMode!=='zen'){var cx=camera.x,cy=camera.y;
        if(gameMode==='race')drawRacePads(cx,cy);if(gameMode==='redlight')drawRLPads(cx,cy);if(gameMode==='lava')drawGeysers(cx,cy);if(gameMode==='hns')drawHns(cx,cy);
        drawPick(cx,cy);drawAuras(cx,cy);}}catch(e){if(!R._err){R._err=1;console.warn('modeplus',e);}}
    return _dfx.apply(this,arguments);};

  var _sg=startGame;startGame=function(){var r=_sg.apply(this,arguments);try{wrapModes();reset();}catch(e){console.warn('modeplus reset',e);}return r;};

  /* active power-ups for the HUD chips */
  function activeList(f){f=f||player;var out=[],t=T();if(!f||!f._pu)return out;Object.keys(f._pu).forEach(function(k){var u=f._pu[k];if(u>t&&PU[k])out.push({k:k,name:PU[k].name,col:PU[k].col,left:u-t,max:PU[k].ms||1});});
    if(f._fireUntil>t)out.push({k:'fire',name:'On Fire',col:'#ff7a1a',left:f._fireUntil-t,max:9000});
    if(f._lastStand&&!f.infected)out.push({k:'speed',name:'Last Stand',col:'#2de2ff',left:1,max:1,perm:true});
    if(overcharged()&&orbHolder===f)out.push({k:'speed',name:'Overcharge',col:'#ffd23d',left:1,max:1,perm:true});
    return out;}
  return {state:function(){return R;},active:active,activeList:activeList,ability:abilityState,useAbility:hnsAbility,glyph:glyph,PU:PU,fmul:fmul,overcharged:overcharged,
    spawn:function(k,x,y){R.pick.push({k:k,x:x!=null?x:(player?player.cx+60:WORLD_W/2),y:y!=null?y:(player?player.cy:WORLD_H/2),born:T(),ph:0});}};
})();
window.FreaPlus=FreaPlus;
