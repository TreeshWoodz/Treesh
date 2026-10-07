/* ===================== FREA! PLUS — ARCADE 3 =====================
   FLAP DASH  · tap to flap through neon gates, last flea flying wins (Flappy-style)
   CRUMB RUN  · grab the giant crumb and race it back to the burrow; a Shaman flea builds planks (Transformice-style)
   FLEA CARDS · fleas sit around a table and play a colour/number shedding card game — shout FREA! on your last card */
var FreaArcade3=(function(){
  var TAU=Math.PI*2;
  function el(id){return document.getElementById(id);}
  function G(m,k){try{return FreaModeSettings.get(m,k);}catch(e){return null;}}
  function setT(l,v){var a=el('timer-lbl'),b=el('tval');if(a)a.textContent=l;if(b)b.textContent=v;}
  function alert(t,c,s){try{if(window.FreaHud2)FreaHud2.alert(t,c,s);else flash(t,c);}catch(e){}}
  function feed(t,c){try{if(window.FreaHud2)FreaHud2.feed(t,c);}catch(e){}}
  function burst(x,y,c,n){for(var i=0;i<(n||14);i++){var a=Math.random()*7,s=2+Math.random()*4;parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,l:1,r:2+Math.random()*3,c:c});}}
  function nm(f){return f.isP?'You':f.name;}
  function rr(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
  function rand(a,b){return a+Math.random()*(b-a);}

  /* ============================== FLAP DASH ============================== */
  var F={};
  var FLAP={layout:'box',maxAi:7,noPlats:true,
    bounds:function(bw,bh){return [240000,Math.max(560,Math.min(bh,900))];},
    build:function(){platforms.length=1;platforms[0].h=60;return true;},
    setup:function(){var sp=G('flappy','speed')||'normal';F={gates:[],t:0,speed:({chill:4.2,normal:5.2,turbo:6.6})[sp]||5.2,gap:({chill:240,normal:200,turbo:170})[sp]||200,nextX:900,score:{},alive:0,over:false,best:+(localStorage.getItem('frea_flap_best')||0)};
      fleas.forEach(function(f,i){f.x=260-i*26;f.y=WORLD_H*0.38+(i%3)*30;f.vx=0;f.vy=0;f.stuck=false;f.onG=false;f.platform=null;f.angle=0;f._out=false;f._fl=false;f.hidden=false;F.score[f.name]=0;f._err=rand(-38,38);f._react=rand(0,1);});
      for(var g=0;g<6;g++)gate();setT('Gates',0);alert('TAP TO FLAP!','#2de2ff','Fly through the neon gates');},
    tick:function(dt){if(F.over)return;F.t+=dt;var k=dt/16.67,alive=0;F.speed+=0.00012*dt;F.gap=Math.max(140,F.gap-0.0009*dt);
      var lead=0;fleas.forEach(function(f){if(f._out)return;alive++;f.x+=F.speed*k;f.vx=0;if(F.t<1400&&f.vy>0.6)f.vy=0.6;if(f.isP&&!f._fl&&F.t<2600)f.vy=Math.sin(F.t/160)*0.9;if(f.stuck){out(f,'hit the ground');return;}if(f.y<4){f.y=4;f.vy=Math.max(0,f.vy);}f.angle=Math.max(-.5,Math.min(1.1,f.vy*.08));lead=Math.max(lead,f.x);
        for(var i=0;i<F.gates.length;i++){var g=F.gates[i];if(f.x+f.w>g.x&&f.x<g.x+g.w){if(f.y<g.gy-g.gh/2||f.y+f.h>g.gy+g.gh/2){out(f,'bonked a gate');return;}}
          if(!g.passed[f.name]&&f.x>g.x+g.w){g.passed[f.name]=1;F.score[f.name]=(F.score[f.name]||0)+1;if(f.isP){setT('Gates',F.score[f.name]);burst(f.cx,f.cy,'#2de2ff',8);}}}
        if(!f.isP&&!f.hidden)aiFlap(f);});
      while(F.nextX<lead+2400)gate();F.gates=F.gates.filter(function(g){return g.x>lead-1600;});
      var left=fleas.filter(function(f){return !f._out;});if(!left.length||(fleas.length>1&&left.length===1&&F.t>1500)||(fleas.length===1&&!left.length)){finish(left[0]||null);}},
    aiHold:function(){return true;},
    ai:function(f){return {x:f.cx,y:f.cy};},
    drawBack:function(cx,cy){var t=performance.now()/1000;F.gates.forEach(function(g){var x=g.x-cx;if(x>W+80||x+g.w<-80)return;var top=g.gy-g.gh/2-cy,bot=g.gy+g.gh/2-cy;
        [[0,top],[bot,H-bot+cy]].forEach(function(seg,si){var y0=si?bot:-10,h=si?(WORLD_H-60-cy)-bot:top+10;if(h<=0)return;var gr=ctx.createLinearGradient(x,0,x+g.w,0);gr.addColorStop(0,'#1a2a6a');gr.addColorStop(.5,'#3a5ad8');gr.addColorStop(1,'#14205a');ctx.fillStyle=gr;ctx.fillRect(x,y0,g.w,h);
          ctx.fillStyle='rgba(255,255,255,.08)';for(var yy=y0+8;yy<y0+h;yy+=22)ctx.fillRect(x+6,yy,g.w-12,3);
          ctx.save();ctx.shadowColor=g.c;ctx.shadowBlur=18;ctx.fillStyle=g.c;var capY=si?bot:top-16;rr(ctx,x-8,capY,g.w+16,16,6);ctx.fill();ctx.restore();ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(x-4,capY+3,g.w+8,3);});
        if(!g.passed[player&&player.name]){ctx.globalAlpha=.25+Math.sin(t*4+g.x)*.12;ctx.strokeStyle=g.c;ctx.setLineDash([6,8]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+g.w/2,top+8);ctx.lineTo(x+g.w/2,bot-8);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}});},
    drawFront:function(){if(!player)return;var s=F.score[player.name]||0;ctx.save();ctx.font="900 56px 'Orbitron',sans-serif";ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.92)';ctx.shadowColor='#2de2ff';ctx.shadowBlur=20;ctx.fillText(s,W/2,H*0.2);ctx.shadowBlur=0;ctx.font="700 12px 'Chakra Petch',sans-serif";ctx.fillStyle='rgba(255,255,255,.6)';ctx.fillText('BEST '+Math.max(F.best,s),W/2,H*0.2+22);ctx.restore();},
    score:function(c,U){U.title('Flap Dash');var a=fleas.slice().sort(function(a,b){return (F.score[b.name]||0)-(F.score[a.name]||0);});U.list(a.map(function(f){return {n:f.name+(f._out?' ✖':''),c:f.col,me:f.isP,pts:F.score[f.name]||0};}),{pos:true});},
    endSub:function(){return 'Last flea flying!';}};
  function gate(){var cols=['#2de2ff','#ff3db5','#ffd23d','#c6ff3d','#9b6bff'],gh=F.gap,gy=rand(WORLD_H*0.22+gh/2*.3,WORLD_H-60-gh/2-40);gy=Math.max(gh/2+30,Math.min(WORLD_H-90-gh/2,gy));F.gates.push({x:F.nextX,w:74,gy:gy,gh:gh,c:cols[F.gates.length%5],passed:{}});F.nextX+=rand(360,460);}
  function flap(f){if(!f||f._out||STATE!=='play')return;f._fl=true;f.stuck=false;f.onG=false;f.vy=-8.6;f.sq=0.7;try{jpfx(f.cx,f.cy+f.h/2,f.col);}catch(e){}}
  function aiFlap(f){var g=null;for(var i=0;i<F.gates.length;i++){if(F.gates[i].x+F.gates[i].w>f.x-4){g=F.gates[i];break;}}var ty=(g?g.gy:WORLD_H*.45)+f._err*(0.5+F.t/90000);
    if(Math.random()<0.004)f._err=rand(-46,46);if(f.cy>ty+8&&f.vy>-1.5&&Math.random()<0.55+f._react*0.4)flap(f);}
  function out(f,why){if(f._out)return;f._out=true;burst(f.cx,f.cy,f.col,22);f.hidden=true;camera.shake=Math.max(camera.shake,f.isP?12:4);feed((f.isP?'You ':f.name+' ')+why+' · '+(F.score[f.name]||0)+' gates','#ff7a8a');
    if(f.isP){playerDead=true;var s=F.score[f.name]||0;if(s>F.best){F.best=s;try{localStorage.setItem('frea_flap_best',s);}catch(e){}alert('NEW BEST · '+s,'#ffd23d');}}}
  function finish(w){if(F.over)return;F.over=true;var best=null;fleas.forEach(function(f){if(!best||(F.score[f.name]||0)>(F.score[best.name]||0))best=f;});var win=w&&(F.score[w.name]||0)>=(F.score[best.name]||0)?w:best;
    fleas.forEach(function(f){f.matchPoints=F.score[f.name]||0;});setTimeout(function(){if(STATE==='play')endGame(win);},900);}

  /* ============================== CRUMB RUN ============================== */
  var C={};
  var MAPS=[
    {n:'The Gap',start:[90,.62,260],burrow:[.9,.62],crumb:[.5,.3],plats:[[0,.68,.32,.04],[.68,.68,.32,.04],[.44,.36,.12,.03],[.2,.48,.08,.03]],help:[[.34,.6,.14],[.52,.6,.14],[.4,.46,.1]]},
    {n:'Sky Shelf',start:[90,.8,240],burrow:[.12,.8],crumb:[.82,.18],plats:[[0,.86,.4,.04],[.3,.64,.14,.03],[.55,.46,.12,.03],[.72,.24,.2,.03]],help:[[.46,.56,.12],[.64,.36,.1],[.2,.72,.12]]},
    {n:'Twin Towers',start:[90,.7,220],burrow:[.5,.86],crumb:[.88,.2],plats:[[0,.76,.2,.03],[.4,.9,.2,.03],[.3,.5,.06,.4],[.64,.4,.06,.5],[.8,.26,.16,.03]],help:[[.2,.58,.1],[.5,.42,.12],[.72,.3,.08]]}];
  var CR={layout:'box',maxAi:7,
    bounds:function(bw,bh){return [Math.max(bw,1400),Math.max(bh,640)];},
    build:function(){C.map=MAPS[(C.round||0)%MAPS.length];var m=C.map;m.plats.forEach(function(q){var p=new Platform({kind:'rect',x:q[0]*WORLD_W,y:q[1]*WORLD_H,w:q[2]*WORLD_W,h:Math.max(18,q[3]*WORLD_H),ptype:'normal'});p._crumb=1;platforms.push(p);});return true;},
    setup:function(){var me=G('crumb','shaman')||'cpu';C=Object.assign(C,{round:C.round||0,t:0,left:+(G('crumb','time')||75),planks:[],max:+(G('crumb','planks')||5),pts:C.pts||{},saved:0,holders:[],done:false});var m=C.map;
      C.shaman=me==='me'?player:fleas.filter(function(f){return !f.isP;})[0]||player;C.crumb={x:m.crumb[0]*WORLD_W,y:m.crumb[1]*WORLD_H-34,taken:false};C.burrow={x:m.burrow[0]*WORLD_W,y:m.burrow[1]*WORLD_H};
      fleas.forEach(function(f,i){var sx=m.start[0]+i*28;f.x=sx;f.y=m.start[1]*WORLD_H-60;f.vx=0;f.vy=0;f.stuck=false;f._crumb=false;f._home=false;f.hidden=false;if(C.pts[f.name]==null)C.pts[f.name]=0;});
      if(C.shaman){C.shaman._shaman=true;C.shaman.x=m.start[0];}
      C.hi=0;setT('Time',C.left);alert('CRUMB RUN · '+m.n,'#ffd23d',C.shaman===player?'You are the SHAMAN: tap to build planks ('+C.max+')':'Grab the crumb, bring it to the burrow!');
      clearInterval(C.iv);C.iv=setInterval(function(){if(STATE!=='play'||gameMode!=='crumb'||isPaused)return;C.left--;setT('Time',Math.max(0,C.left));if(C.left<=0)endRound();},1000);},
    tick:function(dt){if(C.done)return;C.t+=dt;var cr=C.crumb;
      /* CPU shaman builds helper planks over time */
      if(C.shaman&&!C.shaman.isP&&C.planks.length<Math.min(C.max,C.map.help.length)&&C.t>2200+C.planks.length*2600){var h=C.map.help[C.planks.length];plank(h[0]*WORLD_W,h[1]*WORLD_H,h[2]*WORLD_W);}
      fleas.forEach(function(f){if(f.hidden||f._home||f===C.shaman)return;
        if(!f._crumb&&Math.hypot(f.cx-cr.x,f.cy-cr.y)<54){f._crumb=true;burst(cr.x,cr.y,'#ffd23d',12);if(!C.holders.length)feed(nm(f)+' grabbed the crumb!','#ffd23d');C.holders.push(f);}
        if(f._crumb&&Math.abs(f.cx-C.burrow.x)<46&&Math.abs(f.cy-(C.burrow.y-30))<60){f._home=true;f.hidden=true;C.saved++;var g=C.saved===1?3:1;C.pts[f.name]+=g;if(C.shaman)C.pts[C.shaman.name]+=1;burst(C.burrow.x,C.burrow.y-30,'#c6ff3d',20);
          feed((f.isP?'You':f.name)+' made it home! +'+g,'#c6ff3d');if(f.isP){alert('SAFE IN THE BURROW!','#c6ff3d','Spectate the others');playerDead=true;}}
        if(f.y>WORLD_H-62-f.h&&f.stuck&&C.map.n==='The Gap'&&f.cx>WORLD_W*.32&&f.cx<WORLD_W*.68){respawn(f);}});
      var runners=fleas.filter(function(f){return f!==C.shaman&&!f._home;});if(!runners.length)endRound();},
    ai:function(f){if(f===C.shaman)return {x:f.cx,y:f.cy};if(!f._crumb)return stepTarget(f,C.crumb.x,C.crumb.y);return stepTarget(f,C.burrow.x,C.burrow.y-30);},
    aiHold:function(f){return f===C.shaman||f._home;},
    drawBack:function(cx,cy){var t=performance.now()/1000,b=C.burrow;if(!b)return;var x=b.x-cx,y=b.y-cy;
      /* burrow: mound + glowing arch */
      ctx.save();ctx.fillStyle='#5a3a22';ctx.beginPath();ctx.ellipse(x,y,70,46,0,Math.PI,0);ctx.fill();ctx.fillStyle='#3a2414';ctx.beginPath();ctx.ellipse(x,y,38,34,0,Math.PI,0);ctx.fill();ctx.fillStyle='#120a06';ctx.beginPath();ctx.ellipse(x,y,28,26,0,Math.PI,0);ctx.fill();
      ctx.strokeStyle='#c6ff3d';ctx.lineWidth=3;ctx.shadowColor='#c6ff3d';ctx.shadowBlur=14+Math.sin(t*3)*6;ctx.beginPath();ctx.ellipse(x,y,40,36,0,Math.PI,0);ctx.stroke();ctx.restore();
      ctx.fillStyle='#4a8a3a';for(var g=0;g<7;g++){ctx.beginPath();ctx.ellipse(x-60+g*20,y-4-Math.abs(Math.sin(g))*30,5,3,g,0,TAU);ctx.fill();}
      C.planks.forEach(function(p){var px=p.x-cx,py=p.y-cy,a=Math.min(1,(performance.now()-p.t)/300);ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#b07a46';rr(ctx,px,py,p.w,16,4);ctx.fill();ctx.strokeStyle='#6a4422';ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='rgba(60,30,10,.4)';ctx.lineWidth=1;for(var k=px+20;k<px+p.w;k+=24){ctx.beginPath();ctx.moveTo(k,py+2);ctx.lineTo(k,py+14);ctx.stroke();}
        ctx.fillStyle='#4a2a14';ctx.beginPath();ctx.arc(px+8,py+8,2,0,TAU);ctx.arc(px+p.w-8,py+8,2,0,TAU);ctx.fill();ctx.restore();});},
    drawFront:function(cx,cy){var t=performance.now()/1000,cr=C.crumb;if(!cr)return;
      if(C.shaman&&!C.shaman.hidden){var s=C.shaman,sx=s.cx-cx,sy=s.y-cy-14;ctx.save();ctx.strokeStyle='#9b6bff';ctx.lineWidth=2;ctx.shadowColor='#9b6bff';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(s.cx-cx,s.cy-cy,s.w*.9+Math.sin(t*4)*2,0,TAU);ctx.stroke();ctx.fillStyle='#ffd23d';ctx.beginPath();ctx.moveTo(sx,sy-18);ctx.quadraticCurveTo(sx+10,sy-8,sx+2,sy);ctx.quadraticCurveTo(sx-6,sy-8,sx,sy-18);ctx.fill();ctx.restore();}
      /* crumb: big golden cookie (each carrier shows a mini crumb) */
      var bob=Math.sin(t*3)*4,x=cr.x-cx,y=cr.y-cy+bob;ctx.save();var gl=ctx.createRadialGradient(x,y,4,x,y,60);gl.addColorStop(0,'rgba(255,210,61,.45)');gl.addColorStop(1,'rgba(255,210,61,0)');ctx.fillStyle=gl;ctx.fillRect(x-60,y-60,120,120);cookie(x,y,22);ctx.restore();
      fleas.forEach(function(f){if(f._crumb&&!f.hidden){cookie(f.cx-cx+f.w*.45,f.y-cy+6,8);}});
      if(C.shaman===player&&STATE==='play'){ctx.save();ctx.font="800 13px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillText('SHAMAN · tap to place planks · '+(C.max-C.planks.length)+' left',W/2,H-24);ctx.restore();}},
    score:function(c,U){U.title('Crumb Run · '+(C.map?C.map.n:''));U.pills([{v:C.saved||0,l:'Home',c:'#c6ff3d'},{v:(C.max||0)-(C.planks?C.planks.length:0),l:'Planks',c:'#b07a46'}]);var a=fleas.slice().sort(function(a,b){return (C.pts[b.name]||0)-(C.pts[a.name]||0);});U.list(a.map(function(f){return {n:f.name+(f._shaman?' ✦':''),c:f.col,me:f.isP,pts:C.pts[f.name]||0};}),{pos:true});},
    endSub:function(){return 'Crumbs delivered!';}};
  function cookie(x,y,r){ctx.fillStyle='#e8a84a';ctx.beginPath();for(var i=0;i<14;i++){var a=i/14*TAU,rr2=r*(i%2?.92:1);ctx.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2);}ctx.closePath();ctx.fill();ctx.strokeStyle='#a8682a';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#5a2a14';[[-.4,-.3],[.3,-.4],[0,.2],[-.3,.45],[.45,.3]].forEach(function(q){ctx.beginPath();ctx.arc(x+q[0]*r,y+q[1]*r,r*.13,0,TAU);ctx.fill();});ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(x-r*.3,y-r*.5,r*.35,r*.15,-.3,0,TAU);ctx.fill();}
  function plank(x,y,w){if(C.planks.length>=C.max)return false;w=Math.max(80,Math.min(180,w||120));var p=new Platform({kind:'rect',x:x-w/2,y:y,w:w,h:16,ptype:'normal'});p._plank=1;p.invisible=true;platforms.push(p);C.planks.push({x:x-w/2,y:y,w:w,t:performance.now()});burst(x,y,'#9b6bff',10);return true;}
  function respawn(f){var m=C.map;f.x=m.start[0];f.y=m.start[1]*WORLD_H-60;f.vx=0;f.vy=0;f.stuck=false;f._crumb=false;burst(f.cx,f.cy,'#9b6bff',8);}
  function endRound(){if(C.done)return;C.done=true;clearInterval(C.iv);var rounds=+(G('crumb','rounds')||3);C.round++;
    if(C.round<rounds&&STATE==='play'){alert('ROUND '+C.round+' DONE','#ffd23d','Next map…');setTimeout(function(){if(STATE!=='play'||gameMode!=='crumb')return;try{startGame();}catch(e){}},1600);return;}
    var best=null;fleas.forEach(function(f){f.matchPoints=C.pts[f.name]||0;if(!best||f.matchPoints>best.matchPoints)best=f;});C.round=0;var pts=C.pts;C.pts={};setTimeout(function(){if(STATE==='play')endGame(best);},700);}
  /* planks are drawn by the mode (wood art) — skip the default platform renderer for them */
  var _pdraw=Platform.prototype.draw;Platform.prototype.draw=function(){if(this._plank)return;return _pdraw.apply(this,arguments);};

  /* ============================== FLEA CARDS ============================== */
  var K={};var CC=['#ff3d7a','#2de2ff','#9be22d','#ffc23d'],CN=['Pink','Cyan','Lime','Gold'];
  function deck(){var d=[];for(var c=0;c<4;c++){d.push({c:c,v:0});for(var v=1;v<=9;v++){d.push({c:c,v:v});d.push({c:c,v:v});}['skip','rev','+2'].forEach(function(a){d.push({c:c,v:a});d.push({c:c,v:a});});}for(var w=0;w<4;w++){d.push({c:-1,v:'wild'});d.push({c:-1,v:'+4'});}for(var i=d.length-1;i>0;i--){var j=Math.random()*(i+1)|0,t=d[i];d[i]=d[j];d[j]=t;}return d;}
  function lbl(cd){return cd.v==='skip'?'⊘':cd.v==='rev'?'⇄':cd.v==='wild'?'★':String(cd.v);}
  function canPlay(cd){var top=K.pile[K.pile.length-1];if(K.stack>0)return cd.v===K.stackV||(cd.v==='+4');return cd.c===-1||cd.c===K.color||cd.v===top.v;}
  var CARDS={layout:'box',maxAi:3,
    bounds:function(bw,bh){return [bw,bh];},
    build:function(){return true;},
    setup:function(){var hs=+(G('cards','hand')||7);K={deck:deck(),pile:[],hands:[],seats:fleas.slice(0,4),turn:0,dir:1,color:0,stack:0,stackV:null,busy:false,said:{},msg:'',anim:[],over:false,t0:performance.now()};
      K.seats.forEach(function(f){f.hidden=true;K.hands.push([]);});fleas.slice(4).forEach(function(f){f.hidden=true;});
      for(var n=0;n<hs;n++)K.hands.forEach(function(h){h.push(K.deck.pop());});var first;do{first=K.deck.pop();if(first.c===-1)K.deck.unshift(first);}while(first.c===-1);K.pile.push(first);K.color=first.c;
      K.turn=Math.random()*K.seats.length|0;mount();say(nm(K.seats[K.turn])+' start'+(K.seats[K.turn].isP?'':'s')+'!');setT('Cards',hs);setTimeout(function(){next(true);},60);},
    tick:function(){},
    aiHold:function(){return true;},ai:function(f){return {x:f.cx,y:f.cy};},
    drawFront:function(){drawTable();},
    score:function(c,U){U.title('Flea Cards');U.list(K.seats?K.seats.map(function(f,i){return {n:f.name,c:f.col,me:f.isP,lead:i===K.turn,pts:K.hands[i].length+' 🂠'};}):[],{pos:false});},
    endSub:function(){return 'Out of cards!';}};
  var spr={};function sprite(f){if(spr[f.name])return spr[f.name];var cv=document.createElement('canvas');cv.width=cv.height=150;try{drawFleaStatic(cv,specOf(f));}catch(e){}spr[f.name]=cv;return cv;}
  function seatPos(i,n){var me=K.seats.indexOf(player),rel=(i-me+n)%n,cx=W/2,cy=H*0.44,T=tdim(),rx=T.rx+Math.min(70,W*.07),ry=T.ry+Math.min(46,H*.06);var ang=Math.PI/2+rel*(TAU/n);return {x:cx+Math.cos(ang)*rx,y:cy+Math.sin(ang)*ry,rel:rel,ang:ang};}
  function card(c,x,y,w,cd,face,rot,glow){var h=w*1.45;c.save();c.translate(x,y);c.rotate(rot||0);c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=10;c.shadowOffsetY=4;c.fillStyle='#fff';rr(c,-w/2,-h/2,w,h,w*.14);c.fill();c.shadowColor='transparent';
    if(!face){var g=c.createLinearGradient(0,-h/2,0,h/2);g.addColorStop(0,'#2a1a5a');g.addColorStop(1,'#120a2e');c.fillStyle=g;rr(c,-w/2+3,-h/2+3,w-6,h-6,w*.11);c.fill();c.strokeStyle='#ff3db5';c.lineWidth=2;c.beginPath();c.ellipse(0,0,w*.32,h*.36,.5,0,TAU);c.stroke();c.fillStyle='#2de2ff';c.font='900 '+Math.round(w*.26)+"px 'Orbitron',sans-serif";c.textAlign='center';c.textBaseline='middle';c.fillText('F!',0,1);c.restore();return;}
    var col=cd.c<0?null:CC[cd.c];if(col){c.fillStyle=col;rr(c,-w/2+3,-h/2+3,w-6,h-6,w*.11);c.fill();}else{var cg=c.createConicGradient?c.createConicGradient(0,0,0):null;if(cg){CC.forEach(function(k,i){cg.addColorStop(i/4,k);cg.addColorStop((i+1)/4-.001,k);});cg.addColorStop(1,CC[0]);c.fillStyle=cg;}else c.fillStyle='#333';rr(c,-w/2+3,-h/2+3,w-6,h-6,w*.11);c.fill();}
    c.fillStyle='#fff';c.beginPath();c.ellipse(0,0,w*.34,h*.38,.5,0,TAU);c.fill();c.fillStyle=col||'#1e1e2e';c.font='900 '+Math.round(w*(String(cd.v).length>1?.34:.44))+"px 'Orbitron',sans-serif";c.textAlign='center';c.textBaseline='middle';c.fillText(lbl(cd),0,2);
    c.fillStyle='#fff';c.font='900 '+Math.round(w*.18)+"px 'Orbitron',sans-serif";c.fillText(lbl(cd),-w*.3,-h*.36);if(glow){c.strokeStyle='#fff';c.lineWidth=3;c.shadowColor='#fff';c.shadowBlur=16;rr(c,-w/2,-h/2,w,h,w*.14);c.stroke();}c.restore();}
  function drawTable(){var t=performance.now()/1000;ctx.save();
    var bg=ctx.createRadialGradient(W/2,H*.4,40,W/2,H*.5,Math.max(W,H));bg.addColorStop(0,'#3a2450');bg.addColorStop(1,'#0e0818');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    var lg=ctx.createRadialGradient(W/2,H*.3,10,W/2,H*.45,Math.min(W,H)*.7);lg.addColorStop(0,'rgba(255,214,140,.25)');lg.addColorStop(1,'rgba(255,214,140,0)');ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#4a2e22';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H*.08);ctx.stroke();ctx.fillStyle='#e89a3a';ctx.beginPath();ctx.moveTo(W/2-36,H*.08+26);ctx.quadraticCurveTo(W/2,H*.08-14,W/2+36,H*.08+26);ctx.closePath();ctx.fill();ctx.fillStyle='#fff6d0';ctx.beginPath();ctx.arc(W/2,H*.08+28,7,0,TAU);ctx.fill();
    var cx=W/2,cy=H*.44,T=tdim(),rx=T.rx,ry=T.ry;
    if(!K.seats)return ctx.restore();var n=K.seats.length;
    /* back-row fleas sit behind the table */
    function seatDraw(i,front){var p=seatPos(i,n),f=K.seats[i];if((p.y>cy)!==front)return;var sz=Math.min(130,W*.16),sp=sprite(f),bob=Math.sin(t*2+i)*2,turn=i===K.turn&&!K.over;
      if(turn){ctx.save();ctx.strokeStyle=f.col||'#2de2ff';ctx.lineWidth=3;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=18;ctx.beginPath();ctx.ellipse(p.x,p.y+sz*.28,sz*.5,sz*.14,0,0,TAU);ctx.stroke();ctx.restore();}
      ctx.drawImage(sp,p.x-sz/2,p.y-sz*.62+bob,sz,sz);
      /* fanned hand */
      var cnt=K.hands[i].length;if(!f.isP){var cw=Math.min(28,sz*.22);for(var k=0;k<Math.min(cnt,10);k++){var a=(k-(Math.min(cnt,10)-1)/2)*.16;card(ctx,p.x+Math.sin(a)*sz*.5,p.y+sz*.12-Math.cos(a)*8,cw,null,false,a);}}
      ctx.font="800 13px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(f.isP?'You':f.name,p.x,p.y+sz*.46);ctx.fillStyle='rgba(255,255,255,.6)';ctx.font="700 11px 'Chakra Petch',sans-serif";ctx.fillText(cnt+' card'+(cnt===1?'':'s')+(K.said[i]&&cnt===1?' · FREA!':''),p.x,p.y+sz*.46+15);}
    for(var i=0;i<n;i++)seatDraw(i,false);
    ctx.save();ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=30;ctx.shadowOffsetY=12;ctx.fillStyle='#6a3e22';ctx.beginPath();ctx.ellipse(cx,cy+14,rx+16,ry+16,0,0,TAU);ctx.fill();ctx.restore();
    var fg=ctx.createRadialGradient(cx,cy-ry*.3,10,cx,cy,rx);fg.addColorStop(0,'#2a8a5a');fg.addColorStop(1,'#145a36');ctx.fillStyle=fg;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,214,140,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy,rx-14,ry-12,0,0,TAU);ctx.stroke();
    /* draw pile + discard + colour ring */
    var cw2=Math.min(70,W*.09);for(var d=3;d>=0;d--)card(ctx,cx-cw2*.9-d*1.5,cy-d*1.5,cw2,null,false,0);
    var top=K.pile[K.pile.length-1];if(K.pile.length>1){var p2=K.pile[K.pile.length-2];card(ctx,cx+cw2*.85,cy,cw2,p2,true,-.18);}card(ctx,cx+cw2*.9,cy,cw2,top,true,.06+(K.pop?Math.sin(Math.min(1,(performance.now()-K.pop)/240)*Math.PI)*.1:0));
    ctx.save();ctx.strokeStyle=CC[K.color];ctx.lineWidth=5;ctx.shadowColor=CC[K.color];ctx.shadowBlur=20;ctx.beginPath();ctx.arc(cx+cw2*.9,cy,cw2*1.05,0,TAU);ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(cx,cy-ry*.62);ctx.fillStyle='rgba(255,255,255,.75)';ctx.font="900 20px 'Orbitron',sans-serif";ctx.textAlign='center';ctx.fillText(K.dir>0?'↻':'↺',0,0);ctx.restore();
    if(K.stack>0){ctx.font="900 18px 'Orbitron',sans-serif";ctx.textAlign='center';ctx.fillStyle='#ffd23d';ctx.fillText('+'+K.stack+' stacked!',cx,cy+ry*.62);}
    for(var j=0;j<n;j++)seatDraw(j,true);
    K.anim=K.anim.filter(function(a){var k=(performance.now()-a.t)/a.d;if(k>=1)return false;var e=1-Math.pow(1-k,3);card(ctx,a.x0+(a.x1-a.x0)*e,a.y0+(a.y1-a.y0)*e-Math.sin(k*Math.PI)*40,cw2*(.7+.3*e),a.cd,!!a.cd,k*TAU*.5);return true;});
    if(K.msg){ctx.font="800 16px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.fillStyle='rgba(10,8,22,.7)';var mw=ctx.measureText(K.msg).width+30,my=H*.44+tdim().ry*.42;rr(ctx,W/2-mw/2,my-20,mw,30,15);ctx.fill();ctx.fillStyle='#fff';ctx.fillText(K.msg,W/2,my);}
    ctx.restore();}
  function tdim(){return {rx:Math.min(W*.3,360),ry:Math.min(H*.2,150)};}
  function say(m){K.msg=m;}
  function fly(i,cd,toPile){var p=seatPos(i,K.seats.length),cx=W/2,cy=H*.44,cw2=Math.min(70,W*.09);K.anim.push(toPile?{x0:p.x,y0:p.y,x1:cx+cw2*.9,y1:cy,cd:cd,t:performance.now(),d:380}:{x0:cx-cw2*.9,y0:cy,x1:p.x,y1:p.y,cd:null,t:performance.now(),d:340});}
  function draw1(i){if(!K.deck.length){var top=K.pile.pop();K.deck=K.pile.sort(function(){return Math.random()-.5;});K.pile=[top];}var cd=K.deck.pop();if(cd){K.hands[i].push(cd);fly(i,null,false);}K.said[i]=false;return cd;}
  function adv(n){K.turn=(K.turn+K.dir*(n||1)+K.seats.length*4)%K.seats.length;}
  function play(i,idx,pickColor){var cd=K.hands[i][idx];if(!cd||!canPlay(cd))return false;K.hands[i].splice(idx,1);K.pile.push(cd);K.pop=performance.now();fly(i,cd,true);var f=K.seats[i];
    K.color=cd.c>=0?cd.c:(pickColor!=null?pickColor:bestColor(i));var n=K.seats.length;
    if(cd.v==='rev'){K.dir*=-1;say(nm(f)+' reversed!');if(n===2)adv(1);}
    else if(cd.v==='skip'){adv(1);say(nm(f)+' skipped '+nm(K.seats[(K.turn+K.dir*1+n)%n]===f?f:K.seats[K.turn])+'!');}
    else if(cd.v==='+2'){K.stack+=2;K.stackV='+2';say(nm(f)+' played +2!');}
    else if(cd.v==='+4'){K.stack+=4;K.stackV='+4';say(nm(f)+' played Wild +4 · '+CN[K.color]+'!');}
    else if(cd.v==='wild'){say(nm(f)+' picked '+CN[K.color]+'!');}
    else say(nm(f)+' played '+CN[cd.c]+' '+cd.v);
    if(K.hands[i].length===1&&!f.isP){if(Math.random()<.85){K.said[i]=true;feed(f.name+' shouts FREA!','#ff3db5');}}
    if(f.isP&&K.hands[i].length===1){K.waitFrea=performance.now();}
    if(!K.hands[i].length){win(i);return true;}
    adv(1);return true;}
  function bestColor(i){var c=[0,0,0,0];K.hands[i].forEach(function(cd){if(cd.c>=0)c[cd.c]++;});return c.indexOf(Math.max.apply(null,c));}
  function next(first){if(K.over||STATE==='gameover'||gameMode!=='cards')return;renderHand();var f=K.seats[K.turn];setT('Cards',K.hands[K.seats.indexOf(player)].length);
    /* missed FREA! call penalty */
    var me=K.seats.indexOf(player);if(K.waitFrea&&!K.said[me]&&K.hands[me].length===1&&K.turn!==me){K.waitFrea=0;draw1(me);draw1(me);feed('You forgot to shout FREA! · +2 cards','#ff7a8a');renderHand();}
    if(f.isP){if(K.stack>0&&!K.hands[me].some(canPlay)){setTimeout(function(){take(me);},700);return;}say(K.stack>0?'Stack or take '+K.stack+'!':'Your turn!');renderHand();return;}
    clearTimeout(K.tm);K.tm=setTimeout(function(){aiTurn(K.turn);},first?1400:900+Math.random()*700);}
  function take(i){var n=Math.max(1,K.stack);for(var k=0;k<n;k++)draw1(i);if(K.stack)say(nm(K.seats[i])+' took '+K.stack+'!');K.stack=0;K.stackV=null;adv(1);setTimeout(next,450);}
  function aiTurn(i){if(K.over||STATE!=='play'){if(!K.over&&STATE!=='gameover'){K.tm=setTimeout(function(){aiTurn(i);},500);}return;}var h=K.hands[i],opts=[];h.forEach(function(cd,k){if(canPlay(cd))opts.push(k);});
    if(!opts.length){if(K.stack>0){take(i);return;}var cd=draw1(i);say(nm(K.seats[i])+' drew a card');if(cd&&canPlay(cd)&&Math.random()<.8){setTimeout(function(){play(i,h.length-1);setTimeout(next,450);},500);return;}adv(1);setTimeout(next,450);return;}
    opts.sort(function(a,b){function sc(cd){return (cd.c===-1?-5:0)+(typeof cd.v==='number'?cd.v*.1:2);}return sc(h[b])-sc(h[a]);});play(i,opts[0]);if(!K.over)setTimeout(next,450);}
  function win(i){K.over=true;clearTimeout(K.tm);var f=K.seats[i];say((f.isP?'You win':f.name+' wins')+'!');burst(W/2,H/2,'#ffd23d',30);fleas.forEach(function(x){var s=K.seats.indexOf(x);x.matchPoints=s<0?0:Math.max(0,20-K.hands[s].length*2)+(s===i?10:0);});renderHand();setTimeout(function(){if(STATE==='play')endGame(f);},1500);}
  /* ---- DOM: your hand + FREA! button + colour picker ---- */
  var host=null;function mount(){unmount();host=document.createElement('div');host.id='fc-ui';host.setAttribute('data-testid','cards-ui');host.innerHTML='<div class="fc-hand" data-testid="cards-hand"></div><div class="fc-acts"><button class="fc-btn fc-draw" data-testid="cards-draw-btn">Draw</button><button class="fc-btn fc-frea" data-testid="cards-frea-btn">FREA!</button></div><div class="fc-pick" hidden data-testid="cards-color-picker"></div>';document.body.appendChild(host);
    host.addEventListener('pointerdown',function(e){e.stopPropagation();});
    host.querySelector('.fc-draw').onclick=function(){var me=K.seats.indexOf(player);if(K.turn!==me||K.over)return;if(K.stack>0){take(me);return;}var cd=draw1(me);renderHand();if(!(cd&&canPlay(cd))){adv(1);setTimeout(next,450);}else say('You drew a playable card — play it or tap Draw again to pass');K._drew=true;};
    host.querySelector('.fc-frea').onclick=function(){var me=K.seats.indexOf(player);if(K.hands[me].length<=2){K.said[me]=true;feed('You shout FREA!','#ff3db5');alert('FREA!','#ff3db5');}};}
  function unmount(){var o=el('fc-ui');if(o)o.remove();host=null;clearTimeout(K.tm);}
  function renderHand(){if(!host)return;var me=K.seats.indexOf(player),h=K.hands[me]||[],box=host.querySelector('.fc-hand'),my=K.turn===me&&!K.over;box.innerHTML='';host.classList.toggle('my-turn',my);
    h.forEach(function(cd,k){var b=document.createElement('button');var ok=my&&canPlay(cd);b.className='fc-card'+(ok?' ok':'');b.disabled=!my;b.setAttribute('data-testid','cards-hand-card-'+k);b.setAttribute('aria-label',(cd.c<0?'Wild':CN[cd.c])+' '+lbl(cd));var cv=document.createElement('canvas');cv.width=88;cv.height=124;card(cv.getContext('2d'),44,62,80,cd,true,0);b.appendChild(cv);
      b.style.setProperty('--r',((k-(h.length-1)/2)*Math.min(4,40/h.length))+'deg');b.onclick=function(){if(!my||!canPlay(cd))return;if(cd.c<0){pick(function(c){play(me,k,c);K._drew=false;if(!K.over)setTimeout(next,450);});return;}play(me,k);K._drew=false;if(!K.over)setTimeout(next,450);};box.appendChild(b);});
    host.querySelector('.fc-draw').textContent=K.stack>0?('Take +'+K.stack):(K._drew?'Pass':'Draw');host.querySelector('.fc-draw').disabled=!my;host.querySelector('.fc-frea').classList.toggle('hot',h.length<=2&&!K.said[me]);}
  function pick(cb){var p=host.querySelector('.fc-pick');p.hidden=false;p.innerHTML='<b>Pick a colour</b>'+CC.map(function(c,i){return '<button style="background:'+c+'" data-i="'+i+'" data-testid="cards-pick-'+CN[i].toLowerCase()+'" aria-label="'+CN[i]+'"></button>';}).join('');p.querySelectorAll('button').forEach(function(b){b.onclick=function(){p.hidden=true;cb(+b.dataset.i);};});}

  /* ---------------- shared input hooks ---------------- */
  var _pd=pointerDown;pointerDown=function(x,y){if(STATE==='play'&&gameMode==='flappy'){flap(player);return;}
    if(STATE==='play'&&gameMode==='cards')return;
    if(STATE==='play'&&gameMode==='crumb'&&C.shaman===player){var sx=x/VZ_UI,sy=y/VZ_UI;if(!plank(sx+camera.x,sy+camera.y,130))flash('No planks left!','#b07a46');return;}
    return _pd.apply(this,arguments);};
  document.addEventListener('keydown',function(e){if(STATE!=='play'||gameMode!=='flappy')return;if(e.code==='Space'||e.key==='ArrowUp'||e.key==='w'||e.key==='W'){flap(player);e.preventDefault();e.stopImmediatePropagation();}},true);
  var _eg=endGame;endGame=function(){unmount();clearInterval(C.iv);return _eg.apply(this,arguments);};
  var _tl=toLobby;toLobby=function(){unmount();clearInterval(C.iv);C.round=0;C.pts={};return _tl.apply(this,arguments);};
  var _sg=startGame;startGame=function(){if(gameMode!=='cards')unmount();if(gameMode!=='crumb'){C.round=0;C.pts={};clearInterval(C.iv);}return _sg.apply(this,arguments);};

  /* ---------------- register ---------------- */
  EXTRA_MODES.flappy=FLAP;EXTRA_MODES.crumb=CR;EXTRA_MODES.cards=CARDS;
  var INFO={
    flappy:{ico:'🪽',name:'Flap Dash',short:'Flap',desc:'Tap to flap through the neon gates',sub:'Tap (or Space) to flap. Squeeze through the gaps between neon gates — touch one and you are out. Last flea flying wins!',col:['#0a1a3a','#2de2ff'],scene:'clouds',mc:'#2de2ff',m:['#0a1a3a','#2de2ff']},
    crumb:{ico:'🍪',name:'Crumb Run',short:'Crumb',desc:'Grab the crumb, race it home',sub:'Grab the giant crumb and bring it back to the burrow. The Shaman flea builds planks to help everyone across. First home scores big!',col:['#2a1a08','#ffd23d'],scene:'grove',mc:'#ffd23d',m:['#2a1a08','#ffd23d']},
    cards:{ico:'🃏',name:'Flea Cards',short:'Cards',desc:'Match colour or number. Shout FREA!',sub:'Match the top card by colour or number. Skip, Reverse, +2 and Wild cards shake things up. Shout FREA! on your last card. First to empty their hand wins!',col:['#1a0a2a','#ff3db5'],scene:'living',mc:'#ff3db5',m:['#1a0a2a','#ff3db5']}};
  Object.keys(INFO).forEach(function(k){var d=INFO[k];try{FreaModes.info[k]=d;}catch(e){}MODE_INTRO[k]={ico:d.ico,name:d.name,sub:d.sub,col:d.col,img:(window.FREA_ART||{})[k]};try{MODE_LABEL[k]=d.name;}catch(e){}try{if(window.FreaArenas)FreaArenas.modeScene[k]=d.scene;}catch(e){}});
  try{FreaModeSettings.register('flappy',[{k:'speed',l:'Speed',opts:[['chill','Chill'],['normal','Normal'],['turbo','Turbo']],def:'normal'}]);
    FreaModeSettings.register('crumb',[{k:'shaman',l:'Shaman',sub:'The shaman builds planks instead of running',opts:[['cpu','CPU flea'],['me','Me']],def:'cpu'},{k:'planks',l:'Planks',opts:[[3,'3'],[5,'5'],[8,'8']],def:5},{k:'rounds',l:'Maps',opts:[[1,'1'],[3,'3']],def:3},{k:'time',l:'Time per map',opts:[[60,'60s'],[75,'75s'],[100,'100s']],def:75}]);
    FreaModeSettings.register('cards',[{k:'hand',l:'Starting Hand',opts:[[5,'5 cards'],[7,'7 cards']],def:7}]);}catch(e){console.warn('arcade3 settings',e);}
  return {flap:function(){flap(player);},state:function(){return {F:F,C:C,K:K};},play:function(i){var me=K.seats.indexOf(player);return play(me,i);}};
})();
window.FreaArcade3=FreaArcade3;
