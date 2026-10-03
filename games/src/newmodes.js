/* ===================== FREA! PLUS — NEW MODES =====================
   Musical Platforms · Sumo Ring · Treasure Dig  (register into EXTRA_MODES like modes.js) */
var FreaNewModes=(function(){
  var S={};
  function T(){return Date.now();}
  function el(id){return document.getElementById(id);}
  function G(m,k){try{return FreaModeSettings.get(m,k);}catch(e){return null;}}
  function party(){try{return !!(window.FreaParty&&FreaParty.status());}catch(e){return false;}}
  function setT(l,v){var a=el('timer-lbl'),b=el('tval');if(a)a.textContent=l;if(b)b.textContent=v;}
  function round(){try{return FreaModes.round();}catch(e){return 60;}}
  function alert(t,c,s){try{if(window.FreaHud2)FreaHud2.alert(t,c,s);else flash(t,c);}catch(e){}}
  function feed(t,c){try{if(window.FreaHud2)FreaHud2.feed(t,c);}catch(e){}}
  function nm(f){return f.isP?'You':f.name;}
  function burst(x,y,c,n){for(var i=0;i<(n||14);i++){var a=Math.random()*7,s=2+Math.random()*5;parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,l:1,r:2+Math.random()*3,c:c});}}
  function alive(){return fleas.filter(function(f){return !f._out;});}
  function out(f,col,msg){if(f._out)return;f._out=true;S.outN=(S.outN||0)+1;f._outAt=S.outN;burst(f.cx,f.cy,col,22);camera.shake=Math.max(camera.shake,f.isP?14:5);
    alert(f.isP?'YOU ARE OUT!':String(f.name).toUpperCase()+' '+msg,col,alive().length+' left');f.hidden=true;if(f.isP)playerDead=true;try{updScore();}catch(e){}}
  function elimRank(f){return f._out?(f._outAt||0):1000;}
  function plats(){return platforms.slice(3).filter(function(p){return !p.deco&&!p.wall&&!p.sinking;});}
  function hold(f){return {x:f.cx,y:f.cy};}
  function skillMul(){var s='normal';try{s=FreaModeSettings.skill();}catch(e){}return s==='pro'?1.25:(s==='easy'?0.7:1);}
  function lives(f,n,cx,cy){var x=f.cx-cx,y=f.y-cy-(f.ant==='none'?26:36)*f.sf-12;ctx.font='11px serif';ctx.textAlign='center';ctx.textBaseline='middle';for(var i=0;i<n;i++){ctx.globalAlpha=i<f._lives?1:0.25;ctx.fillText(i<f._lives?'❤️':'🖤',x+(i-(n-1)/2)*12,y);}ctx.globalAlpha=1;}
  /* bump knockback shared by Sumo + Treasure: returns [hitter,victim] pairs this frame */
  function bumps(minSp,cb){var now=T();for(var i=0;i<fleas.length;i++){var a=fleas[i];if(a.hidden)continue;for(var j=i+1;j<fleas.length;j++){var b=fleas[j];if(b.hidden)continue;
    if(Math.hypot(a.cx-b.cx,a.cy-b.cy)>(a.w+b.w)*0.58)continue;var sa=Math.hypot(a.vx,a.vy),sb=Math.hypot(b.vx,b.vy),h=sa>=sb?a:b,v=h===a?b:a,sp=Math.max(sa,sb);
    if(sp<minSp||(v._bumpT&&now<v._bumpT))continue;v._bumpT=now+450;cb(h,v,sp);}}}

  /* ======================= MUSICAL PLATFORMS ======================= */
  var MP={layout:'box',still:true,maxAi:12,
    bounds:function(bw,bh){return [Math.max(bw*1.1,720),Math.max(bh*1.05,600)];},
    build:function(){var n=10,tries=0,list=[];while(list.length<n&&tries<400){tries++;var w=96+Math.random()*44,x=40+Math.random()*(WORLD_W-80-w),y=150+Math.random()*(WORLD_H-330);
        if(list.some(function(q){return x<q.x+q.w+50&&x+w+50>q.x&&y<q.y+90&&y+90>q.y;}))continue;list.push({x:x,y:y,w:w});}
      list.forEach(function(q){var p=new Platform({kind:'rect',x:q.x,y:q.y,w:q.w,h:18});p._kind='rect';p._mp=true;p.matBase='#3a2c6a';platforms.push(p);});return true;},
    musicMs:function(){var v=party()?1:(G('musical','music')||1);return (7000+Math.random()*6000)*v;},
    setup:function(){S={ph:'music',t:MP.musicMs(),grab:(party()?5:(G('musical','grab')||5))*1000,rnd:1,outN:0,notes:0};fleas.forEach(function(f){f._out=false;f.hidden=false;});setT('Music','♪');},
    go:function(){alert('MUSIC IS PLAYING!','#ff5ea8','When it stops, grab a glowing platform');},
    lit:function(){return platforms.filter(function(p){return p._lit;});},
    stop:function(){var a=alive(),k=Math.max(1,a.length-1),ps=platforms.filter(function(p){return p._mp;}).sort(function(){return Math.random()-.5;});
      ps.forEach(function(p){p._lit=false;p._claim=null;});ps.slice(0,k).forEach(function(p){p._lit=true;});S.ph='stop';S.t=S.grab;
      fleas.forEach(function(f){if(f.action==='dance')f.action='';});alert('THE MUSIC STOPPED!','#ffd23d',k+' platform'+(k>1?'s':'')+' for '+a.length+' fleas');},
    tick:function(dt){var now=T();S.t-=dt;
      if(S.ph==='music'){if(Math.random()<dt/120){var f0=fleas[Math.random()*fleas.length|0];if(f0&&!f0.hidden)parts.push({x:f0.cx,y:f0.y,vx:(Math.random()-.5)*1.5,vy:-1.6,l:1,r:3,c:['#ff5ea8','#2de2ff','#ffd23d','#c6ff3d'][Math.random()*4|0]});}
        if(S.t<=0)MP.stop();setT('Music','♪');}
      else if(S.ph==='stop'){var lit=MP.lit();
        lit.forEach(function(p){var c=p._claim;if(c&&(c.hidden||!(c.stuck&&c.platform===p)))p._claim=null;});
        alive().forEach(function(f){var p=f.stuck&&f.platform;if(!p||!p._lit)return;if(!p._claim){p._claim=f;burst(f.cx,f.y+f.h,f.col,10);if(f.isP)flash('SAFE! HOLD YOUR SPOT','#39ff7a');}
          else if(p._claim!==f){var d=f.cx<p.bx+p.bw/2?-1:1;f.launch(d*8,-9);if(f.isP)flash('TAKEN! FIND ANOTHER','#ff3b5c');}});
        setT('Grab',Math.max(0,Math.ceil(S.t/1000)));
        if(S.t<=0){var safe=lit.map(function(p){return p._claim;}).filter(Boolean),losers=alive().filter(function(f){return safe.indexOf(f)<0;});
          if(losers.length===alive().length){/* nobody made it: keep one at random */losers.splice(Math.random()*losers.length|0,1);}
          losers.forEach(function(f){out(f,'#ff5ea8','MISSED THE MUSIC!');});
          var a=alive();if(a.length<=1){S.ph='done';setTimeout(function(){if(STATE==='play'&&gameMode==='musical')endGame(a[0]||null);},900);return;}
          S.ph='gap';S.t=1500;}}
      else if(S.ph==='gap'&&S.t<=0){platforms.forEach(function(p){p._lit=false;p._claim=null;});S.rnd++;S.ph='music';S.t=MP.musicMs();alert('ROUND '+S.rnd,'#ff5ea8','Music is back on!');}},
    ai:function(f){if(S.ph==='stop'){var mine=MP.lit().filter(function(p){return p._claim===f;})[0];if(mine)return hold(f);
        var best=null,bs=1e9;MP.lit().forEach(function(p){if(p._claim)return;var tp=p.topPoint(),d=Math.hypot(tp.x-f.cx,tp.y-f.cy);var rival=alive().some(function(o){return o!==f&&Math.hypot(tp.x-o.cx,tp.y-o.cy)<d*0.6;});d+=rival?260:0;if(d<bs){bs=d;best=tp;}});
        if(best)return {x:best.x,y:best.y-12,chase:true,grab:true};return wanderTarget(f);}
      /* music: drift around the middle so you are close to many platforms */
      if(!f._mpW||Math.random()<0.01){var ps=platforms.filter(function(p){return p._mp;});var p=ps[Math.random()*ps.length|0];f._mpW=p?p.topPoint():{x:WORLD_W/2,y:WORLD_H-80};}return {x:f._mpW.x,y:f._mpW.y-12};},
    aiHold:function(f){if(S.ph==='stop')return MP.lit().some(function(p){return p._claim===f;})||Math.random()>0.55*skillMul()+0.3;
      if(S.ph==='music'){if(f.stuck&&!f.action&&Math.random()<0.004){f.action='dance';f.actionT=0;f.actionUntil=T()+1800;}return Math.random()<0.75;}return true;},
    drawBack:function(cx,cy){var t=T()/1000;platforms.forEach(function(p){if(!p._mp)return;var x=p.bx-cx,y=p.by-cy;if(x<-p.bw-40||x>W+40||y<-80||y>H+40)return;ctx.save();
      if(p._lit){var c=p._claim?(p._claim.col||'#39ff7a'):'#ffd23d';var g=ctx.createLinearGradient(0,y-160,0,y);g.addColorStop(0,rgbaOf(c,0));g.addColorStop(1,rgbaOf(c,.32));ctx.fillStyle=g;ctx.fillRect(x+4,y-160,p.bw-8,160);
        ctx.strokeStyle=c;ctx.lineWidth=3;ctx.shadowColor=c;ctx.shadowBlur=perfMode?0:20;ctx.beginPath();ctx.roundRect(x-3,y-3,p.bw+6,p.bh+6,9);ctx.stroke();ctx.shadowBlur=0;
        if(!p._claim){ctx.font="900 14px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.fillStyle=c;ctx.fillText('FREE!',x+p.bw/2,y-12+Math.sin(t*6)*2);}}
      else if(S.ph==='stop'){ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x,y,p.bw,p.bh);}
      ctx.restore();});},
    drawFront:function(){if(S.ph!=='music')return;var t=T()/1000;ctx.save();ctx.font="900 22px 'Baloo 2',sans-serif";ctx.textAlign='center';for(var i=0;i<6;i++){var k=(t*0.35+i/6)%1;ctx.globalAlpha=0.5*(1-k);ctx.fillStyle=['#ff5ea8','#2de2ff','#ffd23d'][i%3];ctx.fillText(i%2?'♪':'♫',W*(0.1+0.16*i),H*0.85-k*H*0.6);}ctx.restore();},
    score:function(c,U){U.title(S.ph==='stop'?'GRAB A GLOWING PLATFORM!':'Musical Platforms · Round '+S.rnd);var a=alive();U.pills([{v:a.length,l:'Left',c:'#ff5ea8'},{v:S.ph==='stop'?MP.lit().length:'♪',l:S.ph==='stop'?'Spots':'Music',c:'#ffd23d'}]);},
    status:function(f){return f._out?'out':'';},rankVal:elimRank,statTxt:function(f){return f._out?'Out in round '+(f._outRnd||'?'):'Never missed a spot';},
    meter:function(p){if(S.ph==='stop'){var mine=MP.lit().some(function(q){return q._claim===p;});return {l:mine?'SAFE: stay put!':'GRAB A GLOWING SPOT!',v:Math.max(0,S.t/S.grab),t:Math.ceil(Math.max(0,S.t)/1000)+'s',s:MP.lit().filter(function(q){return !q._claim;}).length+' free spots',col:mine?'#39ff7a':'#ffd23d',warn:!mine};}
      return {l:'Music is playing…',v:1,t:'♪',s:alive().length+' fleas · round '+S.rnd,col:'#ff5ea8'};},
    endSub:function(won){return won?'You never missed a beat!':'The music beat you';}};

  /* ======================= SUMO RING ======================= */
  var SU={layout:'box',still:true,maxAi:8,
    bounds:function(bw,bh){return [Math.max(bw*1.1,760),Math.max(bh*1.1,600)];},
    build:function(){var n=9,sw=Math.min(84,(WORLD_W*0.78)/n),x0=WORLD_W/2-n*sw/2,y=WORLD_H*0.56;S.segs=[];
      for(var i=0;i<n;i++){var p=new Platform({kind:'rect',x:x0+i*sw,y:y+Math.abs(i-(n-1)/2)*3,w:sw+1,h:22});p._kind='rect';p._sumo=i;p.matBase=i%2?'#5a3a2a':'#6a4630';p.matGlow='#ffb547';platforms.push(p);S.segs.push(p);}return true;},
    setup:function(){var segs=S.segs;S={left:round(),segs:segs,lives:party()?1:(G('sumo','lives')||1),shrinkMs:(party()?14:(G('sumo','shrink')||14))*1000,st:0,outN:0};S.st=S.shrinkMs;
      var ring=SU.span();fleas.forEach(function(f,i){f._out=false;f.hidden=false;f._lives=S.lives;f._pushes=0;var x=ring[0]+20+(ring[1]-ring[0]-40)*(i+0.5)/fleas.length;f.x=x-f.w/2;f.y=segs[0].by-f.h-6;f.vx=f.vy=0;f.stuck=false;});setT('Time',S.left);},
    go:function(){alert('BUMP THEM OFF THE RING!','#ffb547','Fling into rivals. Stay on the ring!');},
    span:function(){var s=S.segs.filter(function(p){return platforms.indexOf(p)>=0&&!p.sinking;});if(!s.length)return [WORLD_W/2-40,WORLD_W/2+40,WORLD_H*0.56];return [s[0].bx,s[s.length-1].bx+s[s.length-1].bw,s[0].by];},
    respawn:function(f){var r=SU.span(),now=T();f.x=(r[0]+r[1])/2-f.w/2+(Math.random()-.5)*30;f.y=r[2]-f.h-40;f.vx=0;f.vy=0;f.stuck=false;f.angle=0;f._imm=now+1600;},
    tick:function(dt){var now=T(),cxr=WORLD_W/2;
      S.st-=dt;var live=S.segs.filter(function(p){return platforms.indexOf(p)>=0&&!p.sinking&&!p.crumbT;});
      if(S.st<=0&&live.length>3){S.st=S.shrinkMs;[live[0],live[live.length-1]].forEach(function(p){p.crumbT=1100;p._mb=p.matBase;});alert('THE RING SHRINKS!','#ff7a1a');}
      for(var i=platforms.length-1;i>=3;i--){var p=platforms[i];if(p._sumo==null)continue;
        if(p.crumbT){p.crumbT-=dt;p.matBase=(Math.floor(now/90)%2)?'#ff5a1e':p._mb;if(p.crumbT<=0){p.crumbT=0;p.sinking=true;p.sv=1;}}
        if(p.sinking){p.sv=Math.min(9,p.sv+0.02*dt);var d=p.sv*dt/16;p._shift(0,d);fleas.forEach(function(f){if(f.platform===p&&f.stuck){f.stuck=false;f.platform=null;}});if(p.by>WORLD_H+40)platforms.splice(i,1);}}
      bumps(4.2,function(h,v,sp){if(v._imm&&now<v._imm)return;var dx=v.cx-h.cx||((Math.random()-.5)),k=(6.5+sp*0.85)*(h.isP?1.15:1)*(v.isP?1:1);v.launch(Math.sign(dx)*k,-5.5-sp*0.25);v.ragUntil=now+500;v.ragSpin=0.02*Math.sign(dx);h.vx*=0.35;h._pushes=(h._pushes||0)+1;v._lastHit=h;burst((h.cx+v.cx)/2,(h.cy+v.cy)/2,'#ffb547',12);if(h.isP||v.isP)camera.shake=9;});
      alive().forEach(function(f){if(f.stuck&&f.angle&&!f.platform){f.stuck=false;f.angle=0;f.vy=1.5;}
        if(f.y+f.h>WORLD_H-66){f._lives--;burst(f.cx,WORLD_H-60,'#ff3b5c',18);if(f._lastHit&&f._lastHit!==f){f._lastHit._kos=(f._lastHit._kos||0)+1;feed(nm(f._lastHit)+' bumped '+nm(f)+' out','#ffb547');}f._lastHit=null;
          if(f._lives<=0)out(f,'#ff3b5c','FELL OFF THE RING!');else{SU.respawn(f);if(f.isP)flash('RING OUT! '+f._lives+' ♥ LEFT','#ff3b5c');}}});
      var a=alive();if(a.length<=1&&STATE==='play'&&!S.done){S.done=1;setTimeout(function(){if(STATE==='play'&&gameMode==='sumo')endGame(a[0]||null);},900);}},
    second:function(){S.left--;setT('Time',Math.max(0,S.left));if(S.left<=10){var tb=el('tbox');if(tb)tb.classList.add('danger');}
      if(S.left<=0){var r=SU.span(),mid=(r[0]+r[1])/2;var a=alive().sort(function(x,y){return (y._lives-x._lives)||(Math.abs(x.cx-mid)-Math.abs(y.cx-mid));});endGame(a[0]||null);}},
    ai:function(f){var r=SU.span(),mid=(r[0]+r[1])/2,half=(r[1]-r[0])/2;
      if(Math.abs(f.cx-mid)>half-34||f.y>r[2])return {x:mid+(Math.random()-.5)*20,y:r[2]-14,chase:true};
      var n=nearestOther(f,function(o){return !o._out&&!o.hidden;});if(!n.flea)return {x:mid,y:r[2]-14};
      /* line up so the push sends them outward, not you */var o=n.flea,side=o.cx<mid?1:-1;if(Math.abs(o.cx-mid)<20)side=f.cx<o.cx?1:-1;
      if((f.cx-o.cx)*side<0&&n.dist>60)return {x:Math.max(r[0]+20,Math.min(r[1]-20,o.cx+side*44)),y:r[2]-14};
      return {x:o.cx-side*4,y:o.cy,chase:true};},
    aiHold:function(f){return Math.random()<0.35/skillMul();},
    drawBack:function(cx,cy){var r=SU.span(),t=T()/1000;ctx.save();var y=WORLD_H-60-cy;var g=ctx.createLinearGradient(0,y-120,0,y);g.addColorStop(0,'rgba(255,59,92,0)');g.addColorStop(1,'rgba(255,59,92,.28)');ctx.fillStyle=g;ctx.fillRect(0,y-120,W,120);
      ctx.font="900 13px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.fillStyle='rgba(255,120,140,.75)';ctx.fillText('▼ RING OUT ▼',W/2,y-10);
      ctx.strokeStyle='rgba(255,181,71,.55)';ctx.lineWidth=2;ctx.setLineDash([8,8]);ctx.lineDashOffset=-t*20;ctx.beginPath();ctx.ellipse((r[0]+r[1])/2-cx,r[2]+11-cy,(r[1]-r[0])/2+10,26,0,0,7);ctx.stroke();ctx.setLineDash([]);ctx.restore();},
    drawFront:function(cx,cy){ctx.save();alive().forEach(function(f){if(f.hidden)return;lives(f,S.lives,cx,cy);if(f._imm&&T()<f._imm){ctx.strokeStyle='rgba(45,226,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.cx-cx,f.cy-cy,f.w*0.9,0,7);ctx.stroke();}});ctx.restore();},
    score:function(c,U){U.title('Sumo Ring');U.list(fleas.slice().sort(function(a,b){return elimRank(b)-elimRank(a)||(b._lives-a._lives);}).map(function(f){return {n:f.name,c:f.col,me:f.isP,lead:false,pts:f._out?'OUT':new Array(Math.max(0,f._lives)+1).join('♥')};}),{pos:true});},
    status:function(f){return f._out?'out':'';},rankVal:function(f){return elimRank(f)*10+(f._lives||0);},statTxt:function(f){return (f._kos||0)+' ring-outs'+(f._out?'':' · survived');},
    meter:function(p){var r=SU.span();return {l:'Stay on the ring',v:Math.max(0,p._lives)/S.lives,t:p._lives+' ♥',s:alive().length+' left · ring shrinks every '+Math.round(S.shrinkMs/1000)+'s',col:'#ffb547',warn:p._lives<=1&&S.lives>1};},
    endSub:function(won){return won?'Yokozuna! Last flea on the ring':'Bumped out of the ring';}};

  /* Treasure Dig lives in dig.js (real diggable dirt) */

  /* ---------------- register ---------------- */
  EXTRA_MODES.musical=MP;EXTRA_MODES.sumo=SU;
  var INFO={
    musical:{ico:'🎵',name:'Musical Platforms',short:'Musical',desc:'Music stops? Grab a glowing platform!',sub:'When the music stops, jump onto a glowing platform. There is always one too few. Last flea standing wins!',col:['#2a0e2a','#ff5ea8'],scene:'crystal',mc:'#ff5ea8',m:['#2a0e3a','#ff5ea8']},
    sumo:{ico:'🥋',name:'Sumo Ring',short:'Sumo',desc:'Bump rivals off a shrinking ring',sub:'Fling yourself into rivals to knock them off the floating ring. The ring shrinks over time. Last flea on it wins!',col:['#2a1408','#ffb547'],scene:'ember',mc:'#ffb547',m:['#2a160a','#ffb547']},
    treasure:{ico:'💰',name:'Treasure Dig',short:'Treasure',desc:'Tunnel through dirt for buried treasure',sub:'Tap the dirt to tunnel through it, or fling hard to drill a crater. Coins sit near the top, gems deeper, crowns deepest. Bump rivals to steal coins. Richest flea wins!',col:['#2a2008','#ffd23d'],scene:'grove',mc:'#ffd23d',m:['#1a1a0a','#ffd23d']}};
  Object.keys(INFO).forEach(function(k){var d=INFO[k];try{FreaModes.info[k]=d;}catch(e){}MODE_INTRO[k]={ico:d.ico,name:d.name,sub:d.sub,col:d.col};try{MODE_LABEL[k]=d.name;}catch(e){}try{if(window.FreaArenas)FreaArenas.modeScene[k]=d.scene;}catch(e){}});
  var TIME=[[45,'45s'],[60,'60s'],[90,'90s'],[120,'2 min']];
  try{
    FreaModeSettings.register('musical',[{k:'grab',l:'Grab Time',sub:'Seconds to reach a glowing platform',opts:[[3,'3s'],[5,'5s'],[7,'7s']],def:5},{k:'music',l:'Music Length',opts:[[0.6,'Short'],[1,'Normal'],[1.5,'Long']],def:1}]);
    FreaModeSettings.register('sumo',[{k:'time',l:'Round Length',opts:TIME,def:90},{k:'lives',l:'Lives',opts:[[1,'1 ♥'],[2,'2 ♥'],[3,'3 ♥']],def:1},{k:'shrink',l:'Ring Shrinks Every',opts:[[8,'8s'],[14,'14s'],[22,'22s']],def:14}]);
    FreaModeSettings.register('treasure',[{k:'time',l:'Round Length',opts:TIME,def:60},{k:'spots',l:'Buried Treasure',sub:'How much treasure is hidden in the dirt',opts:[[2,'Few'],[4,'Normal'],[7,'Lots']],def:4},{k:'steal',l:'Bump to Steal',opts:[['on','On'],['off','Off']],def:'on'}]);
  }catch(e){console.warn('newmodes settings',e);}
  return {state:function(){return S;}};
})();
window.FreaNewModes=FreaNewModes;
