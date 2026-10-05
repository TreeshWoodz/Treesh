/* ===================== FREA! PLUS — MUSICAL CHAIRS (option for Musical Platforms) =====================
   Setting "Seats: Platforms | Chairs". In Chairs mode a row of real chairs stands mid-stage.
   While the music plays every flea marches in a loop around the chairs (front lane walks right,
   back lane walks left behind the chairs). When it stops: race to hop onto a seat! There is always
   one chair too few, and one chair is taken away every round. Last flea seated wins.
   Wraps EXTRA_MODES.musical (newmodes.js) — the Platforms variant is untouched. */
(function(){
  var MP=EXTRA_MODES.musical;if(!MP)return;
  var SP=46,GAP=84,SEAT_H=34;
  function T(){return Date.now();}
  function S(){try{return FreaNewModes.state()||{};}catch(e){return {};}}
  function party(){try{return !!(window.FreaParty&&FreaParty.status());}catch(e){return false;}}
  function on(){try{return !party()&&FreaModeSettings.get('musical','style')==='chairs';}catch(e){return false;}}
  function chairsLive(){return gameMode==='musical'&&S().chairs;}
  function alive(){return fleas.filter(function(f){return !f._out;});}
  function floorY(){return WORLD_H-60;}
  function chairs(){return platforms.filter(function(p){return p._chair;});}
  function burst(x,y,c,n){for(var i=0;i<(n||14);i++){var a=Math.random()*7,s=2+Math.random()*4;parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,l:1,r:2+Math.random()*3,c:c});}}
  function makeChairs(n){var old=chairs();n=Math.max(1,n);
    /* keep the survivors' layout: remove one chair (the poof) instead of reshuffling everything */
    if(old.length===n+1){var gone=old[Math.random()*old.length|0];burst(gone.bx+gone.bw/2,gone.by,'#ff5ea8',24);platforms.splice(platforms.indexOf(gone),1);}
    else{old.forEach(function(p){platforms.splice(platforms.indexOf(p),1);});}
    var cs=chairs();if(cs.length!==n){cs.forEach(function(p){platforms.splice(platforms.indexOf(p),1);});cs=[];
      var w=n*SP+(n-1)*(GAP-SP),x0=WORLD_W/2-w/2;for(var i=0;i<n;i++){var p=new Platform({kind:'rect',x:x0+i*GAP,y:floorY()-SEAT_H,w:SP,h:9});p._kind='rect';p._mp=true;p._chair=true;p._face=i%2?1:-1;p.draw=function(){};platforms.push(p);cs.push(p);}}
    /* re-centre the row smoothly after a removal */
    cs.sort(function(a,b){return a.bx-b.bx;});var w2=cs.length*SP+(cs.length-1)*(GAP-SP),xs=WORLD_W/2-w2/2;cs.forEach(function(p,i){p._tx=xs+i*GAP;p._face=i%2?1:-1;});}
  function lane(){var cs=chairs();if(!cs.length)return [WORLD_W/2-120,WORLD_W/2+120];var a=Math.min.apply(null,cs.map(function(p){return p._tx!=null?p._tx:p.bx;})),b=Math.max.apply(null,cs.map(function(p){return (p._tx!=null?p._tx:p.bx)+p.bw;}));return [a-70,b+70];}
  function marchInit(){var a=alive().slice().sort(function(x,y){return x.cx-y.cx;}),n=a.length;a.forEach(function(f,i){f._u=2*i/n;f._behind=false;f.action='';});}
  function marchTick(dt){var L=lane(),len=L[1]-L[0],now=T(),sp=dt/1000*(0.32+0.05*Math.min(4,(S().rnd||1)-1));
    alive().forEach(function(f){if(f._u==null)f._u=Math.random()*2;f._u=(f._u+sp)%2;var u=f._u,back=u>=1,k=back?u-1:u;
      var x=back?L[1]-len*k:L[0]+len*k;f.x=x-f.w/2;f.y=floorY()-f.h-(back?16:0);f.vx=f.vy=0;f.stuck=true;f.platform=platforms[0];f.angle=0;f.onG=true;f.face=back?-1:1;f.walkT=now+120;f._behind=back;f.hidden=false;
      if(f.action&&f.action!=='dance')f.action='';});}
  function drop(){alive().forEach(function(f){f._behind=false;f.y=floorY()-f.h-0.5;f.stuck=true;f.platform=platforms[0];f.angle=0;});}

  /* ---------- wrap the Musical mode ---------- */
  var o={bounds:MP.bounds,build:MP.build,setup:MP.setup,go:MP.go,stop:MP.stop,tick:MP.tick,ai:MP.ai,aiHold:MP.aiHold,drawBack:MP.drawBack,score:MP.score,meter:MP.meter,endSub:MP.endSub};
  MP.bounds=function(bw,bh){if(on())return [Math.round(Math.max(bw*1.1,1100)),Math.round(Math.max(bh,480))];return o.bounds.apply(this,arguments);};
  MP.build=function(){if(on())return true;return o.build.apply(this,arguments);};
  MP.setup=function(){var r=o.setup.apply(this,arguments),s=S();s.chairs=on();if(s.chairs){makeChairs(alive().length-1);chairs().forEach(function(p){if(p._tx!=null){p._shift(p._tx-p.bx,0);}});marchInit();}else fleas.forEach(function(f){f._behind=false;});return r;};
  MP.go=function(){if(chairsLive()){try{FreaHud2.alert('MUSIC IS PLAYING!','#ff5ea8','March around the chairs. When it stops, grab a seat!');}catch(e){flash('MUSIC IS PLAYING!','#ff5ea8');}return;}return o.go.apply(this,arguments);};
  MP.stop=function(){if(chairsLive())drop();var r=o.stop.apply(this,arguments);if(chairsLive()){try{FreaHud2.alert('THE MUSIC STOPPED!','#ffd23d',chairs().length+' chair'+(chairs().length>1?'s':'')+' for '+alive().length+' fleas. SIT!');}catch(e){}}return r;};
  MP.tick=function(dt){var s=S();if(!s.chairs)return o.tick.apply(this,arguments);var ph=s.ph;
    if(ph==='music')marchTick(dt);
    /* glide chairs to their slots after one is removed */
    chairs().forEach(function(p){if(p._tx==null)return;var d=p._tx-p.bx;if(Math.abs(d)>0.5){var m=d*0.12;p._shift(m,0);fleas.forEach(function(f){if(f.platform===p&&f.stuck)f.x+=m;});}});
    var r=o.tick.apply(this,arguments);s=S();
    if(ph==='gap'&&s.ph==='music'){fleas.forEach(function(f){if(f.action==='sit')f.action='';});makeChairs(alive().length-1);marchInit();}
    if(s.ph==='stop'||s.ph==='gap'||s.ph==='done'){chairs().forEach(function(p){var c=p._claim;if(!c)return;c.y=p.by-c.h;c.x=Math.max(p.bx-4,Math.min(p.bx+p.bw-c.w+4,c.x));c.angle=0;c.onG=true;if(c.action!=='sit'){c.action='sit';c.actionT=0;}c.actionUntil=T()+2500;c.face=p._face;});}
    return r;};
  MP.ai=function(f){var s=S();if(s.chairs&&s.ph!=='stop')return {x:f.cx,y:f.cy};return o.ai.apply(this,arguments);};
  MP.aiHold=function(f){var s=S();if(s.chairs&&s.ph!=='stop')return true;return o.aiHold.apply(this,arguments);};
  MP.endSub=function(won){if(chairsLive())return won?'Last flea sitting. Musical Chairs champ!':'Someone took your seat';return o.endSub.apply(this,arguments);};
  MP.score=function(c,U){var r;if(!chairsLive())return o.score.apply(this,arguments);var s=S();var t0=U.title;U.title=function(x){return t0.call(U,s.ph==='stop'?'SIT ON A CHAIR!':'Musical Chairs · Round '+s.rnd);};try{r=o.score.apply(this,arguments);}finally{U.title=t0;}return r;};
  MP.meter=function(p){var m=o.meter.apply(this,arguments);if(!chairsLive()||!m)return m;var s=S();
    if(s.ph==='stop'){var mine=chairs().some(function(q){return q._claim===p;});m.l=mine?'SEATED: stay put!':'GRAB A CHAIR!';m.s=chairs().filter(function(q){return !q._claim;}).length+' free chairs';}
    else{m.l='March around the chairs…';m.s=alive().length+' fleas · '+chairs().length+' chairs · round '+(s.rnd||1);}return m;};
  /* ---------- drawing ---------- */
  var drawingBehind=false;
  var _fd=Flea.prototype.draw;Flea.prototype.draw=function(cx,cy){if(this._behind&&gameMode==='musical'&&!drawingBehind)return;return _fd.apply(this,arguments);};
  function drawChair(p,cx,cy,t,s){var x=p.bx-cx,y=p.by-cy,w=p.bw,fy=floorY()-cy;if(x<-80||x>W+80)return;var stop=s.ph==='stop',c=p._claim,col=c?(c.col||'#39ff7a'):'#ffd23d';
    ctx.save();
    if(stop&&p._lit){var g=ctx.createLinearGradient(0,y-120,0,y);g.addColorStop(0,rgbaOf(col,0));g.addColorStop(1,rgbaOf(col,.28));ctx.fillStyle=g;ctx.fillRect(x-6,y-120,w+12,120);}
    /* legs */ctx.fillStyle='#6a3a22';ctx.fillRect(x+4,y+6,5,fy-y-6);ctx.fillRect(x+w-9,y+6,5,fy-y-6);
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x+w/2,fy+2,w*0.62,5,0,0,7);ctx.fill();
    /* backrest */var bx=p._face>0?x+2:x+w-9;ctx.fillStyle='#7a4428';ctx.fillRect(bx,y-38,7,44);ctx.fillStyle='#b8693a';ctx.beginPath();ctx.roundRect(p._face>0?x-2:x+w-20,y-44,22,12,5);ctx.fill();
    ctx.fillStyle='#ff5ea8';ctx.fillRect(p._face>0?x+1:x+w-17,y-40,15,3);
    /* seat */var sg=ctx.createLinearGradient(0,y,0,y+10);sg.addColorStop(0,'#e0904e');sg.addColorStop(1,'#9a5a30');ctx.fillStyle=sg;ctx.beginPath();ctx.roundRect(x-3,y,w+6,10,4);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x,y+1,w,2);
    if(stop&&p._lit){ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.shadowColor=col;ctx.shadowBlur=perfMode?0:16;ctx.beginPath();ctx.roundRect(x-6,y-3,w+12,16,7);ctx.stroke();ctx.shadowBlur=0;
      if(!c){ctx.font="900 13px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.fillStyle=col;ctx.fillText('FREE!',x+w/2,y-52+Math.sin(t*6)*2);}}
    ctx.restore();}
  var _db=MP.drawBack;MP.drawBack=function(cx,cy){var s=S();if(!s.chairs)return _db.apply(this,arguments);var t=T()/1000;
    /* the ring rug */var L=lane(),fy=floorY()-cy,mx=(L[0]+L[1])/2-cx,rw=(L[1]-L[0])/2+20;ctx.save();ctx.fillStyle='rgba(255,94,168,.10)';ctx.strokeStyle='rgba(255,94,168,.45)';ctx.lineWidth=2;ctx.setLineDash([10,8]);ctx.lineDashOffset=s.ph==='music'?-t*40:0;
    ctx.beginPath();ctx.ellipse(mx,fy-6,rw,20,0,0,7);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.restore();
    /* back-lane fleas (smaller, behind the chairs) */
    if(s.ph==='music'){drawingBehind=true;try{fleas.forEach(function(f){if(!f._behind||f.hidden)return;var fx=f.cx-cx,fyy=f.y+f.h-cy;ctx.save();ctx.globalAlpha=0.82;ctx.translate(fx,fyy);ctx.scale(0.84,0.84);ctx.translate(-fx,-fyy);f.draw(cx,cy);ctx.restore();});}finally{drawingBehind=false;}}
    chairs().slice().sort(function(a,b){return a.bx-b.bx;}).forEach(function(p){drawChair(p,cx,cy,t,s);});};
  /* clean-up so no flea stays invisible after the match */
  var _eg=endGame;endGame=function(){fleas.forEach(function(f){f._behind=false;});return _eg.apply(this,arguments);};
  /* ---------- labels: "Musical Chairs" when the Chairs option is on ---------- */
  var BASE={name:(MODE_INTRO.musical||{}).name,sub:(MODE_INTRO.musical||{}).sub};
  function syncLabels(){if(gameMode!=='musical')return;var c=on(),mi=MODE_INTRO.musical;if(mi){mi.name=c?'Musical Chairs':BASE.name;mi.sub=c?'March around the chairs while the music plays. When it stops, hop onto a chair! There is always one too few, and one chair goes every round.':BASE.sub;}}
  function bannerFix(){if(!chairsLive())return;var n=document.querySelector('#mode-banner .mb-name'),g=document.querySelector('#mode-banner .mb-goal');if(n)n.textContent='Musical Chairs';if(g)g.textContent='Music stops? Grab a chair!';}
  window.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#play-btn'))syncLabels();},true);
  var _su=MP.setup;MP.setup=function(){syncLabels();var r=_su.apply(this,arguments);setTimeout(bannerFix,60);setTimeout(bannerFix,400);return r;};
  var _go=MP.go;MP.go=function(){bannerFix();return _go.apply(this,arguments);};
  /* the base stop() fires its own "platforms" alert — mute it in Chairs mode (ours follows) */
  var _st=MP.stop;MP.stop=function(){if(!chairsLive())return _st.apply(this,arguments);var H2=window.FreaHud2,a=H2&&H2.alert,fl=flash;if(H2)H2.alert=function(){};
    try{var first=true;H2&&(H2.alert=function(t,c,s){if(first&&/STOPPED/.test(t)){first=false;return;}return a.apply(H2,arguments);});return _st.apply(this,arguments);}finally{if(H2)H2.alert=a;}};
  var _sc=MP.score;MP.score=function(c,U){if(!chairsLive())return _sc.apply(this,arguments);var p0=U.pills;U.pills=function(arr){(arr||[]).forEach(function(x){if(x&&x.l==='Spots')x.l='Chairs';});return p0.apply(U,arguments);};try{return _sc.apply(this,arguments);}finally{U.pills=p0;}};
  /* ---------- setting ---------- */
  try{var sch=FreaModeSettings.schemas.musical||[];if(!sch.some(function(r){return r.k==='style';})){sch.unshift({k:'style',l:'Seats',sub:'Glowing platforms, or real chairs in a ring',opts:[['platforms','Platforms'],['chairs','Chairs']],def:'platforms'});}FreaModeSettings.render();}catch(e){console.warn('chairs setting',e);}
  window.FreaChairs={chairs:chairs,on:on};
})();
