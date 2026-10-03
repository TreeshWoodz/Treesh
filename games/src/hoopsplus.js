/* ===================== FREA! PLUS — HOOPS EXPANSION =====================
   Trick shots: DUNK (+2, launched right under the rim) · ALLEY-OOP (+2, bumped mid-air before scoring)
   · OFF THE RIM bank shot (+1) · 3-POINT LINE (+1 from downtown).
   Game options: shot clock (violation −1), overtime on ties, 1-3 hoops, power-up balls
   (Fire Ball = double points, Giant Ball = wider scoring window), Best-of-3 playoff series. */
var FreaHoopsPlus=(function(){
  var S={pu:[],spawn:6000,ot:0,series:null};
  function T(){return Date.now();}
  function G(k){try{return FreaModeSettings.get('hoops',k);}catch(e){return null;}}
  function party(){try{return !!(window.FreaParty&&FreaParty.status());}catch(e){return false;}}
  function on(k){if(party())return k==='tricks'||k==='three';return G(k)==='on';}
  function act(f,k){return f&&f._hp&&f._hp[k]>T();}
  function teamAdd(f,n){if(f.team){if(f.team==='home')hoopScore.home+=n;else hoopScore.away+=n;}}
  function bonus(f,h,n,txt,col){f.matchPoints=(f.matchPoints||0)+n;teamAdd(f,n);hoopNote(h.x,h.y-30-Math.random()*16,txt,col,true);if(f.isP)camera.shake=Math.max(camera.shake,7);try{if(window.FreaHud2&&!f.isP)FreaHud2.feed(f.name+': '+txt,col);}catch(e){}}
  function threeDist(){return Math.max(220,WORLD_W*0.26);}
  /* remember where every shot started */
  var _ln=Flea.prototype.launch;Flea.prototype.launch=function(){var r=_ln.apply(this,arguments);if(gameMode==='hoops'){this._shot={x:this.cx,y:this.cy,t:T()};}return r;};
  var _rc=hoopRimCollide;hoopRimCollide=function(f,h){var vx=f.vx,vy=f.vy;var r=_rc.apply(this,arguments);if(vx!==f.vx||vy!==f.vy)f._rimT=T();return r;};
  var _ha=hoopApply;hoopApply=function(f,h,dx){var b=f.matchPoints||0,r=_ha.apply(this,arguments),d=(f.matchPoints||0)-b,now=T();if(h.bad||d<=0||HOOPS_CFG.ball&&false)return r;
    f._clock=now;var s=f._shot;
    if(on('tricks')&&s){var under=Math.abs(s.x-h.x)<h.r*1.6&&s.y>h.y&&s.y-h.y<230&&now-s.t<1400;
      if(under)bonus(f,h,2,'DUNK! +2','#ff3db5');else if(f._oopT&&now-f._oopT<1300)bonus(f,h,2,'ALLEY-OOP! +2','#c6ff3d');else if(f._rimT&&now-f._rimT<900)bonus(f,h,1,'OFF THE RIM +1','#2de2ff');}
    if(on('three')&&s&&Math.abs(s.x-h.x)>threeDist()&&now-s.t<2600)bonus(f,h,1,'FROM DOWNTOWN! +1','#ffd23d');
    if(act(f,'fire')){var g=(f.matchPoints||0)-b;bonus(f,h,g,'FIRE BALL ×2','#ff7a1a');}
    return r;};
  var _hs=hoopsSetup;hoopsSetup=function(){var r=_hs.apply(this,arguments);S.pu=[];S.spawn=6000;S.ot=0;S.lt=0;var now=T();fleas.forEach(function(f){f._clock=now;f._hp={};f._shot=null;f._oopT=0;f._rimT=0;});
    var n=party()?1:(G('hoopsN')||1);if(!HOOPS_CFG.ball&&n>1){var main=hoops[0];var spots=[[0.2,-120],[0.8,-60]];for(var i=0;i<n-1;i++){var h=makeHoop(false);h.x=Math.max(h.r+52,Math.min(WORLD_W-h.r-52,WORLD_W*spots[i][0]));h.y=Math.max(h.r+80,Math.min(hoopFloorY()-h.r-40,main.y+spots[i][1]));hoops.push(h);}}
    return r;};
  var _he=hoopsEnd;hoopsEnd=function(){
    if(on('overtime')&&S.ot<2&&!HOOPS_CFG.ball){var tie=false;if(HOOPS_CFG.teamSize>0)tie=hoopScore.home===hoopScore.away;else{var a=fleas.slice().sort(function(x,y){return (y.matchPoints||0)-(x.matchPoints||0);});tie=a.length>1&&(a[0].matchPoints||0)===(a[1].matchPoints||0);}
      if(tie){S.ot++;hoopTimeLeft=20000;try{FreaHud2.alert('OVERTIME'+(S.ot>1?' '+S.ot:'')+'!','#ffd23d','+20 seconds. Next bucket matters!');}catch(e){flash('OVERTIME!','#ffd23d');}return;}}
    var r=_he.apply(this,arguments);
    if(G('series')==='on'&&!party()){try{series();}catch(e){}}return r;};
  function series(){var won=false;if(hoopsEndInfo&&hoopsEndInfo.team)won=hoopsEndInfo.playerWon;else{var a=fleas.slice().sort(function(x,y){return (y.matchPoints||0)-(x.matchPoints||0);});won=a[0]===player;}
    var s=S.series;if(!s||s.done)s=S.series={you:0,them:0,game:0,done:false};s.game++;if(won)s.you++;else s.them++;
    var es=document.getElementById('end-sub'),txt;if(s.you>=2||s.them>=2){s.done=true;txt=s.you>=2?'🏆 PLAYOFF CHAMPIONS! Series won '+s.you+'–'+s.them:'Eliminated from the playoffs '+s.you+'–'+s.them;}else txt='PLAYOFFS · Game '+s.game+' of 3 · Series '+s.you+'–'+s.them+' · Play Again for game '+(s.game+1);
    if(es)setTimeout(function(){es.textContent=txt;},60);}
  /* per-frame: shot clock, alley-oop contacts, power balls, giant-ball scoring */
  var _ht=hoopsTick;hoopsTick=function(dt){var r=_ht.apply(this,arguments);if(STATE!=='play')return r;var now=T();var gap=S.lt?now-S.lt:1e9;S.lt=now;if(gap>400)fleas.forEach(function(f){f._clock=gap>1e8?now:(f._clock||now)+gap;});
    var sc=party()?0:(G('shotclock')||0);if(sc>0)fleas.forEach(function(f){if(now-(f._clock||now)>sc*1000){f._clock=now;f.matchPoints=Math.max(0,(f.matchPoints||0)-1);teamAdd(f,-1);hoopNote(f.cx,f.cy-30,'SHOT CLOCK −1','#ff3b5c',false);if(f.isP){flash('SHOT CLOCK VIOLATION! −1','#ff3b5c');camera.shake=6;}}});
    for(var i=0;i<fleas.length;i++){var a=fleas[i];for(var j=i+1;j<fleas.length;j++){var b=fleas[j];if(a.stuck&&b.stuck)continue;if(Math.hypot(a.cx-b.cx,a.cy-b.cy)<(a.w+b.w)*0.62){if(!a.stuck)a._oopT=now;if(!b.stuck)b._oopT=now;}}}
    if(on('power')&&!HOOPS_CFG.ball){S.spawn-=dt;if(S.spawn<=0&&S.pu.length<2){S.spawn=8000+Math.random()*5000;S.pu.push({k:Math.random()<0.5?'fire':'giant',x:80+Math.random()*(WORLD_W-160),y:hoopFloorY()-40-Math.random()*Math.max(60,WORLD_H*0.35),born:now});}
      for(var k=S.pu.length-1;k>=0;k--){var p=S.pu[k];if(now-p.born>14000){S.pu.splice(k,1);continue;}for(var q=0;q<fleas.length;q++){var f=fleas[q];if(Math.hypot(f.cx-p.x,f.cy-p.y)<f.w/2+18){f._hp=f._hp||{};f._hp[p.k]=now+9000;S.pu.splice(k,1);jpfx(p.x,p.y,p.k==='fire'?'#ff7a1a':'#2de2ff');
        if(f.isP)flash(p.k==='fire'?'FIRE BALL! Double points 9s':'GIANT BALL! Wider rim 9s',p.k==='fire'?'#ff7a1a':'#2de2ff');else try{FreaHud2.feed(f.name+' grabbed a '+(p.k==='fire'?'Fire':'Giant')+' Ball','#ff7a1a');}catch(e){}break;}}}}
    fleas.forEach(function(f){if(!act(f,'giant'))return;var pc=f._gpy==null?f.cy:f._gpy;hoops.forEach(function(h){if(h.bad)return;var dx=Math.abs(f.cx-h.x);if(pc<h.y&&f.cy>=h.y&&f.vy>0&&dx>=h.r-RIM_KNOB&&dx<h.r+26)hoopApply(f,h,h.r-RIM_KNOB-1);});f._gpy=f.cy;});
    return r;};
  var _dh=drawHoops;drawHoops=function(cx,cy){var r=_dh.apply(this,arguments);if(gameMode!=='hoops')return r;var t=T()/1000,fy=hoopFloorY()-cy;ctx.save();
    if(on('three')&&!HOOPS_CFG.ball)hoops.forEach(function(h){if(h.bad)return;[-1,1].forEach(function(s){var x=h.x+s*threeDist()-cx;if(x<-20||x>W+20)return;ctx.strokeStyle='rgba(255,210,61,.55)';ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(x,fy);ctx.lineTo(x,fy-70);ctx.stroke();ctx.setLineDash([]);ctx.font="900 11px 'Chakra Petch',sans-serif";ctx.fillStyle='rgba(255,210,61,.8)';ctx.textAlign='center';ctx.fillText('3PT',x,fy-78);});});
    S.pu.forEach(function(p){var x=p.x-cx,y=p.y-cy+Math.sin(t*3+p.x)*4,c=p.k==='fire'?'#ff7a1a':'#2de2ff';ctx.shadowColor=c;ctx.shadowBlur=perfMode?0:20;ctx.fillStyle=rgbaOf(c,.3);ctx.beginPath();ctx.arc(x,y,17,0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.font='18px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.k==='fire'?'🔥':'🏀',x,y);});
    fleas.forEach(function(f){var x=f.cx-cx,y=f.cy-cy;if(act(f,'fire')&&Math.random()<0.5)parts.push({x:f.cx,y:f.cy,vx:(Math.random()-.5)*1.5,vy:-1.5-Math.random()*1.5,l:.8,r:2+Math.random()*2,c:Math.random()<.5?'#ff7a1a':'#ffd23d'});
      if(act(f,'giant')){ctx.strokeStyle='rgba(45,226,255,.6)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,f.w*1.05+Math.sin(t*6)*2,0,7);ctx.stroke();}});
    var sc=party()?0:(G('shotclock')||0);if(sc>0&&player&&!HOOPS_CFG.ball){var left=Math.max(0,sc-(T()-(player._clock||T()))/1000);var x=player.cx-cx,y=player.y-cy-40;ctx.font="800 11px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.fillStyle=left<4?'#ff3b5c':'rgba(255,255,255,.8)';ctx.fillText('⏱ '+Math.ceil(left),x,y);}
    ctx.restore();return r;};
  try{FreaModeSettings.register('hoops',[
    {k:'tricks',l:'Trick Shots',sub:'Dunk +2 · Alley-oop +2 · Off the rim +1',opts:[['on','On'],['off','Off']],def:'on'},
    {k:'three',l:'3-Point Line',sub:'+1 for shots from behind the line',opts:[['on','On'],['off','Off']],def:'on'},
    {k:'shotclock',l:'Shot Clock',sub:'Score in time or lose a point',opts:[[0,'Off'],[10,'10s'],[15,'15s']],def:0},
    {k:'overtime',l:'Overtime on Ties',opts:[['on','On'],['off','Off']],def:'on'},
    {k:'hoopsN',l:'Hoops on Court',opts:[[1,'1'],[2,'2'],[3,'3']],def:1},
    {k:'power',l:'Power-up Balls',sub:'Fire Ball ×2 · Giant Ball wider rim',opts:[['on','On'],['off','Off']],def:'on'},
    {k:'series',l:'Playoff Series',sub:'Best of 3 matches vs the same rivals',opts:[['off','Off'],['on','Best of 3']],def:'off'}]);}catch(e){console.warn('hoopsplus settings',e);}
  return {state:function(){return S;}};
})();
window.FreaHoopsPlus=FreaHoopsPlus;
