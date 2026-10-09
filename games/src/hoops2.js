/* ===================== FREA! PLUS — HOOPS 2.0 =====================
   Formats: Timed · First to X · H-O-R-S-E called-shot challenge · 3-Point Contest
   Feel: combo meter (Heating up → ON FIRE → UNSTOPPABLE ×3), Perfect Swish bonus, buzzer-beater slow-mo,
         backboard shatter on dunks, Golden Ball (next bucket ×3).
   Court: indoor arena with light rigs, sweeping spotlights, a bouncing crowd that reacts to buckets and a
          jumbotron scoreboard.  Settings: format, win score, hoop movement, rim size, ball type, golden ball, crowd. */
var FreaHoops2=(function(){
  if(typeof hoopsSetup==='undefined')return null;
  var S={hype:0,shards:[],gold:null,goldT:0,buzzer:0,buzzDone:false,slowUntil:0,horse:null,tele:0,made3:{}};
  function T(){return Date.now();}
  function G(k){try{return FreaModeSettings.get('hoops',k);}catch(e){return null;}}
  function party(){try{return !!(window.FreaParty&&FreaParty.status());}catch(e){return false;}}
  function fmt(){if(party())return 'timed';return G('format')||'timed';}
  function threeDist(){return Math.max(220,WORLD_W*0.26);}
  function add(f,n){f.matchPoints=(f.matchPoints||0)+n;if(f.team&&HOOPS_CFG.teamSize>0){if(f.team==='home')hoopScore.home+=n;else hoopScore.away+=n;}}
  function feed(t,c){try{FreaHud2.feed(t,c);}catch(e){}}
  function alertP(t,c,s){try{FreaHud2.alert(t,c,s);}catch(e){flash(t,c);}}
  function hype(n){S.hype=Math.min(1,S.hype+n);}
  var CALLS=[{k:'any',l:'ANY BUCKET',w:2},{k:'swish',l:'SWISH ONLY',w:3},{k:'down',l:'FROM DOWNTOWN',w:2},{k:'rim',l:'OFF THE RIM',w:2},{k:'dunk',l:'DUNK IT',w:2}];
  function pickCall(prev){var pool=[];CALLS.forEach(function(c){if(prev&&c.k===prev)return;for(var i=0;i<c.w;i++)pool.push(c);});return pool[Math.random()*pool.length|0];}
  var LET='HORSE';

  /* ---- rim size ---- */
  var _hr=hoopRadius;hoopRadius=function(){var r=_hr.apply(this,arguments);if(gameMode!=='hoops'||party())return r;var m=G('rim');return r*(m==='small'?0.78:m==='big'?1.28:1);};
  /* ---- float / teleport bookkeeping ---- */
  var _rh=respawnHoop;respawnHoop=function(h){var r=_rh.apply(this,arguments);h._by=h.y;h._tele=T()+7000;return r;};

  /* ---- setup ---- */
  var _hs=hoopsSetup;hoopsSetup=function(){S._rArena=null;
    var mo=party()?null:G('motion');if(mo){HOOPS_CFG.move=(mo==='slide'||mo==='float')?1:0;}
    var r=_hs.apply(this,arguments),now=T(),F=fmt();
    S.hype=0.15;S.shards=[];S.gold=null;S.goldT=now+14000;S.buzzer=0;S.buzzDone=false;S.slowUntil=0;S.horse=null;S.made3={};
    hoops.forEach(function(h){h._by=h.y;h._tele=now+7000;h.vx=HOOPS_CFG.move?(Math.random()<.5?-1:1)*(0.7+Math.random()*0.9):0;});
    fleas.forEach(function(f){f._gold=0;f._letters=0;f._hOut=false;f._hDone=false;f._sacc=0;});
    if(F==='to21'||F==='horse')hoopTimeLeft=Infinity;
    if(F==='three')hoopTimeLeft=(HOOPS_CFG.time>0?HOOPS_CFG.time:60)*1000;
    if(F==='horse'){fleas.forEach(function(f){f.matchPoints=5;});S.horse={round:0,call:null,until:0,start:now+2600};}
    return r;};

  /* ---- scoring ---- */
  var _ha=hoopApply;hoopApply=function(f,h,dx){
    var now=T(),s=f._shot,b=f.matchPoints||0,hx=h.x,hy=h.y,bad=h.bad,F=fmt();
    var under=!!(s&&Math.abs(s.x-hx)<h.r*1.6&&s.y>hy&&s.y-hy<230&&now-s.t<1400);
    var down=!!(s&&Math.abs(s.x-hx)>threeDist()&&now-s.t<2600);
    var rim=!!(f._rimT&&now-f._rimT<900),clean=dx<(h.r-f.w*0.55-4);
    var r=_ha.apply(this,arguments),d=(f.matchPoints||0)-b;
    if(bad){S.hype=Math.max(0,S.hype-0.1);return r;}
    if(d<=0)return r;
    hype(clean?0.32:0.2);
    if(under&&G('tricks')!=='off'){shatter(hx,hy,h.r);}
    if(F==='horse'){add(f,-d);if(f._hOut||!S.horse||!S.horse.call)return r;var c=S.horse.call.k;
      var ok=c==='any'||(c==='swish'&&clean)||(c==='down'&&down)||(c==='rim'&&rim)||(c==='dunk'&&under);
      if(ok&&!f._hDone){f._hDone=true;hoopNote(hx,hy-34,'MATCHED ✓','#c6ff3d',true);if(f.isP)flash('Shot matched! You are safe this round','#c6ff3d');else feed(f.name+' matched the shot','#c6ff3d');}
      else if(!ok&&f.isP)hoopNote(hx,hy-34,'Wrong shot: need '+S.horse.call.l,'#ff8a3d',false);
      return r;}
    if(F==='three'){if(!down){add(f,-d);hoopNote(hx,hy-34,'INSIDE = 0 · shoot from behind the line','#ff8a3d',false);return r;}
      add(f,3-d+(clean?1:0));var n=S.made3[f._hid]=(S.made3[f._hid]||0)+1;
      if(n%5===0){add(f,2);hoopNote(hx,hy-52,'MONEY BALL +2','#ffd23d',true);}}
    if(clean&&!rim&&dx<h.r*0.24){add(f,1);hoopNote(hx,hy-50,'PERFECT SWISH +1','#ffffff',true);}
    if((f._hstreak||0)>=6){add(f,1);if(f._hstreak===6){if(f.isP)alertP('UNSTOPPABLE!','#ff3db5','×3 combo · +2 bonus every bucket');else feed(f.name+' is UNSTOPPABLE','#ff3db5');}}
    if(f._gold>now){var g=(f.matchPoints||0)-b;add(f,g*2);f._gold=0;hoopNote(hx,hy-66,'GOLDEN BALL ×3','#ffd23d',true);hype(0.4);camera.shake=Math.max(camera.shake,10);}
    if(S.buzzer&&now<S.buzzer){add(f,2);hoopNote(hx,hy-80,'BUZZER BEATER! +2','#ff3db5',true);hype(1);if(f.isP)alertP('BUZZER BEATER!','#ff3db5','At the horn!');S.slowUntil=now+900;}
    return r;};

  /* ---- backboard shatter ---- */
  function shatter(x,y,r){var n=perfMode?10:26;for(var i=0;i<n;i++)S.shards.push({x:x+(Math.random()-.5)*r*1.6,y:y-r*0.9-Math.random()*r*0.9,vx:(Math.random()-.5)*9,vy:-2-Math.random()*6,a:Math.random()*6,va:(Math.random()-.5)*0.4,s:3+Math.random()*7,l:1});
    camera.shake=Math.max(camera.shake,14);hoopNote(x,y-r-20,'💥 SHATTERED!','#8af0ff',true);hype(0.6);}

  /* ---- slow-mo: fleas step less often ---- */
  var _fu=Flea.prototype.update;Flea.prototype.update=function(dt){if(gameMode==='hoops'&&S.slowUntil>T()){this._sacc=(this._sacc||0)+0.4;if(this._sacc<1)return;this._sacc-=1;}return _fu.apply(this,arguments);};
  /* ---- ball types ---- */
  var _rc=hoopRimCollide;hoopRimCollide=function(f,h){var vx=f.vx,vy=f.vy;var r=_rc.apply(this,arguments);if((vx!==f.vx||vy!==f.vy)&&!party()&&G('balltype')==='bouncy'){f.vx*=1.18;f.vy*=1.18;}return r;};

  /* ---- buzzer beater ---- */
  var _he=hoopsEnd;hoopsEnd=function(){var now=T();
    if(fmt()==='timed'&&!party()&&!S.buzzDone&&!S.buzzer){var air=fleas.some(function(f){if(f.stuck||f._hOut)return false;return hoops.some(function(h){return !h.bad&&Math.hypot(f.cx-h.x,f.cy-h.y)<460&&f.cy<h.y+20;});});
      if(air){S.buzzer=now+1900;S.slowUntil=now+1900;hoopTimeLeft=Infinity;flash('⏰ THE HORN! Ball in the air…','#ff3db5');return;}}
    S.buzzer=0;return _he.apply(this,arguments);};

  /* ---- per-frame ---- */
  var _ht=hoopsTick;hoopsTick=function(dt){var now=T(),F=fmt();
    if(S.buzzer&&now>=S.buzzer&&!S.buzzDone){S.buzzDone=true;S.buzzer=0;hoopTimeLeft=0.001;}
    if(hoopTimeLeft!==Infinity&&hoopTimeLeft>5000&&S.buzzDone){S.buzzDone=false;}
    var r=_ht.apply(this,arguments);if(STATE!=='play'||gameMode!=='hoops')return r;
    var tv=document.getElementById('tval');if(S.buzzer&&tv)tv.textContent='0';
    if(F==='to21'&&tv)tv.textContent=(G('win')||21);
    S.hype=Math.max(0,S.hype-dt*0.00007);
    /* hoop movement */
    var mo=party()?null:G('motion');
    hoops.forEach(function(h){if(mo==='float'){if(h._by==null)h._by=h.y;h.y=Math.max(h.r+70,Math.min(hoopFloorY()-h.r-40,h._by+Math.sin(h.t*1.1)*70));}
      if(mo==='teleport'&&h._tele&&now>h._tele){respawnHoop(h);hoopNote(h.x,h.y-40,'HOOP MOVED!','#9b6bff',false);}});
    /* ball weight */
    var bt=party()?'classic':G('balltype');if(bt==='floaty'||bt==='heavy')fleas.forEach(function(f){if(!f.stuck&&!f.isBall)f.vy+=bt==='floaty'?-GRAV*0.28:GRAV*0.22;});
    /* first to X */
    if(F==='to21'){var win=G('win')||21,hit=false;if(HOOPS_CFG.teamSize>0&&!HOOPS_CFG.ball)hit=hoopScore.home>=win||hoopScore.away>=win;else hit=fleas.some(function(f){return (f.matchPoints||0)>=win;});if(hit){hoopsEnd();return r;}}
    /* HORSE rounds */
    if(F==='horse'&&S.horse)horseTick(now);
    /* golden ball */
    if(G('gold')!=='off'&&!party()){if(!S.gold&&now>S.goldT){S.gold={x:90+Math.random()*(WORLD_W-180),y:hoopFloorY()-60-Math.random()*Math.max(80,WORLD_H*0.32),born:now};feed('A Golden Ball appeared!','#ffd23d');}
      if(S.gold){var g=S.gold;if(now-g.born>13000){S.gold=null;S.goldT=now+16000;}else for(var i=0;i<fleas.length;i++){var f=fleas[i];if(Math.hypot(f.cx-g.x,f.cy-g.y)<f.w/2+20){f._gold=now+12000;S.gold=null;S.goldT=now+22000+Math.random()*8000;jpfx(g.x,g.y,'#ffd23d');
        if(f.isP)flash('GOLDEN BALL! Next bucket ×3 (12s)','#ffd23d');else feed(f.name+' has the Golden Ball','#ffd23d');break;}}}}
    /* shards */
    for(var k=S.shards.length-1;k>=0;k--){var p=S.shards[k];p.vy+=0.35;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;p.l-=dt*0.0009;if(p.l<=0||p.y>hoopFloorY()+40)S.shards.splice(k,1);}
    return r;};
  function horseTick(now){var H=S.horse;if(now<H.start)return;
    var alive=fleas.filter(function(f){return !f._hOut;});
    if(!H.call){H.round++;H.call=pickCall(H.prev);H.prev=H.call.k;H.until=now+16000;alive.forEach(function(f){f._hDone=false;});alertP('CALLED SHOT: '+H.call.l,'#ffd23d','Round '+H.round+' · make it in 16s or earn a letter');return;}
    var allDone=alive.every(function(f){return f._hDone;});
    if(now<H.until&&!allDone)return;
    var done=alive.filter(function(f){return f._hDone;});
    if(done.length&&done.length<alive.length){alive.forEach(function(f){if(f._hDone)return;f._letters++;f.matchPoints=5-f._letters;hoopNote(f.cx,f.cy-50,LET.slice(0,f._letters),'#ff3b5c',true);
        if(f._letters>=5){f._hOut=true;feed(f.name+' is OUT (H-O-R-S-E)','#ff3b5c');if(f.isP)flash('H-O-R-S-E! You are out','#ff3b5c');}else if(f.isP)flash('Letter! You have '+LET.slice(0,f._letters),'#ff8a3d');});}
    else if(!done.length)flash('Nobody made it, no letters this round','#9b6bff');
    alive=fleas.filter(function(f){return !f._hOut;});
    if(alive.length<=1||(player&&player._hOut)){hoopsEnd();return;}
    H.call=null;H.start=now+1600;}

  /* ---- drawing: world-space extras (after hoops) ---- */
  var _dh=drawHoops;drawHoops=function(cx,cy){var r=_dh.apply(this,arguments);if(gameMode!=='hoops')return r;var now=T(),t=now/1000,F=fmt();ctx.save();
    S.shards.forEach(function(p){ctx.save();ctx.globalAlpha=Math.max(0,p.l);ctx.translate(p.x-cx,p.y-cy);ctx.rotate(p.a);ctx.fillStyle='rgba(200,245,255,.75)';ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-p.s,-p.s*.4);ctx.lineTo(p.s*.8,-p.s*.6);ctx.lineTo(p.s*.3,p.s*.7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();});
    if(S.gold){var g=S.gold,x=g.x-cx,y=g.y-cy+Math.sin(t*3)*5;ctx.shadowColor='#ffd23d';ctx.shadowBlur=perfMode?0:26;var gg=ctx.createRadialGradient(x-5,y-6,2,x,y,19);gg.addColorStop(0,'#fff6c0');gg.addColorStop(.5,'#ffd23d');gg.addColorStop(1,'#c88a10');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(x,y,18,0,7);ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle='rgba(120,70,0,.7)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x-18,y);ctx.lineTo(x+18,y);ctx.moveTo(x,y-18);ctx.lineTo(x,y+18);ctx.stroke();ctx.beginPath();ctx.arc(x-26,y,20,-0.7,0.7);ctx.stroke();ctx.beginPath();ctx.arc(x+26,y,20,Math.PI-0.7,Math.PI+0.7);ctx.stroke();
      ctx.font="900 10px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.fillStyle='#ffd23d';ctx.fillText('×3',x,y-26);}
    fleas.forEach(function(f){var x=f.cx-cx,y=f.cy-cy;
      if(f._gold>now){ctx.strokeStyle='rgba(255,210,61,'+(0.5+0.3*Math.sin(t*8))+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,f.w*0.95,0,7);ctx.stroke();if(Math.random()<0.4)parts.push({x:f.cx,y:f.cy,vx:(Math.random()-.5),vy:-1-Math.random(),l:.7,r:2,c:'#ffd23d'});}
      if(F==='horse'){var L=f._hOut?'OUT':LET.slice(0,f._letters||0);if(L){ctx.font="900 12px 'Orbitron',sans-serif";ctx.textAlign='center';ctx.fillStyle=f._hOut?'#ff3b5c':'#ff8a3d';ctx.fillText(L,x,f.y-cy-34);}
        if(f._hDone&&!f._hOut){ctx.font='14px serif';ctx.fillText('✅',x+f.w*0.6,f.y-cy-8);}}});
    /* combo meter above the player */
    if(player&&!player.isBall){var st=player._hstreak||0,left=9000-(now-(player._hLast||0));if(st>=2&&left>0){var lv=st>=6?['UNSTOPPABLE ×3','#ff3db5']:st>=3?['ON FIRE ×2','#ff7a1a']:['HEATING UP','#ffd23d'],px=player.cx-cx,py=player.y-cy-58,w=96;
      ctx.fillStyle='rgba(8,10,26,.78)';ctx.beginPath();ctx.roundRect(px-w/2,py-14,w,22,11);ctx.fill();ctx.strokeStyle=lv[1];ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle=lv[1];ctx.fillRect(px-w/2+6,py+3,(w-12)*Math.max(0,left/9000),2.5);ctx.font="900 10px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.fillText((st>=3?'🔥 ':'')+lv[0]+' · '+st,px,py+0.5);}}
    ctx.restore();
    /* screen-space: called shot banner + slow-mo vignette */
    if(F==='horse'&&S.horse&&S.horse.call&&!S.jumbo){var lft=Math.max(0,Math.ceil((S.horse.until-now)/1000)),bw=Math.min(W-40,360),bx=W/2-bw/2,by=Math.min(150,H*0.2);ctx.save();ctx.fillStyle='rgba(8,10,26,.8)';ctx.beginPath();ctx.roundRect(bx,by,bw,40,14);ctx.fill();ctx.strokeStyle='rgba(255,210,61,.6)';ctx.lineWidth=1.5;ctx.stroke();
      ctx.font="900 14px 'Orbitron',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffd23d';ctx.fillText('CALLED: '+S.horse.call.l,W/2,by+15);ctx.font="700 10px 'Chakra Petch',sans-serif";ctx.fillStyle='rgba(234,246,255,.8)';ctx.fillText((player&&player._hDone?'✓ You matched it · ':'')+lft+'s left · Round '+S.horse.round,W/2,by+31);ctx.restore();}
    if(F==='three'&&!S.jumbo){ctx.save();ctx.font="800 11px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.fillStyle='rgba(255,210,61,.85)';ctx.fillText('3-POINT CONTEST · only shots from behind the line count',W/2,Math.min(150,H*0.2));ctx.restore();}
    if(S.slowUntil>now){ctx.save();var vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.7);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(40,0,30,.45)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);ctx.font="900 18px 'Orbitron',sans-serif";ctx.textAlign='center';ctx.fillStyle='rgba(255,61,181,.9)';ctx.fillText('SLOW-MO',W/2,H*0.32);ctx.restore();}
    return r;};

  /* ---- arena court background ---- */
  var CROWD=null;function crowd(){if(CROWD)return CROWD;var cols=['#ff3db5','#2de2ff','#ffd23d','#c6ff3d','#9b6bff','#ff7a1a','#ffffff','#7aa8ff'],a=[];for(var i=0;i<900;i++)a.push({c:cols[i*7%cols.length],p:(i*2.399)%6.28,s:0.8+((i*37)%10)/10,h:((i*53)%10)/10});return CROWD=a;}
  function arena(){var cx=camera.x||0,cy=camera.y||0,t=T()/1000,fy=WORLD_H-60-cy,hy=S.hype,lite=perfMode;
    var g=ctx.createLinearGradient(0,0,0,Math.max(1,fy));g.addColorStop(0,'#070a1e');g.addColorStop(.55,'#0d1236');g.addColorStop(1,'#1a1240');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    /* rafters + light rig */
    var rigY=Math.max(18,fy-WORLD_H+40)*0.4+18;ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(0,rigY,W,6);
    var lx0=-((cx*0.3)%120);for(var x=lx0;x<W+120;x+=120){ctx.fillStyle='#1c2048';ctx.fillRect(x+44,rigY-4,32,12);ctx.fillStyle='rgba(255,246,214,'+(0.7+0.3*hy)+')';ctx.beginPath();ctx.arc(x+52,rigY+10,4,0,7);ctx.arc(x+68,rigY+10,4,0,7);ctx.fill();}
    /* spotlights */
    if(!lite){ctx.save();ctx.globalCompositeOperation='lighter';for(var i=0;i<4;i++){var sx=W*(0.15+i*0.23),sw=Math.sin(t*(0.35+i*0.07)+i*1.7)*(0.25+hy*0.35),bx=sx+Math.sin(sw)*fy*0.9,a=0.05+hy*0.08;
      var sg=ctx.createLinearGradient(sx,rigY,bx,fy);sg.addColorStop(0,'rgba(255,240,200,'+(a*1.8)+')');sg.addColorStop(1,'rgba(255,240,200,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.moveTo(sx-6,rigY+10);ctx.lineTo(sx+6,rigY+10);ctx.lineTo(bx+90,fy);ctx.lineTo(bx-90,fy);ctx.closePath();ctx.fill();}ctx.restore();}
    /* jumbotron */
    var jw=Math.min(300,W*0.4),jh=86,jx=WORLD_W/2-cx*0.5-(WORLD_W/2)*0.5+W*0.25-jw/2+ (W/2-W*0.25),jy=Math.max(rigY+30,Math.min(150,H*0.19));jx=Math.max(10,Math.min(W-jw-10,W/2-jw/2-(cx-(WORLD_W-W)/2)*0.25));
    var fyS=WORLD_H-60-(camera.by!=null?camera.by:cy),jOn=S._jOn?(jy+jh<fyS-150):(jy+jh<fyS-190);S._jOn=jOn;S.jumbo=false;if(jOn){S.jumbo=true;ctx.fillStyle='#05060f';ctx.beginPath();ctx.roundRect(jx,jy,jw,jh,12);ctx.fill();ctx.strokeStyle='rgba(45,226,255,.45)';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#1c2048';ctx.fillRect(jx+jw/2-2,rigY,4,jy-rigY);
      ctx.textAlign='center';ctx.textBaseline='middle';var F=fmt(),lbl=F==='to21'?'FIRST TO '+(G('win')||21):F==='horse'?'H-O-R-S-E':F==='three'?'3-PT CONTEST':'HOOPS';ctx.font="900 10px 'Orbitron',sans-serif";ctx.fillStyle='rgba(255,210,61,.9)';ctx.fillText(lbl,jx+jw/2,jy+14);
      var line='';if(F==='horse'&&S.horse&&S.horse.call){lbl='H-O-R-S-E · ROUND '+S.horse.round;ctx.font="900 10px 'Orbitron',sans-serif";ctx.fillStyle='#05060f';ctx.fillRect(jx+4,jy+5,jw-8,16);ctx.fillStyle='rgba(255,210,61,.9)';ctx.fillText(lbl,jx+jw/2,jy+14);line='CALLED: '+S.horse.call.l;}else if(HOOPS_CFG.teamSize>0&&!HOOPS_CFG.ball)line='HOME '+hoopScore.home+'  ·  '+hoopScore.away+' AWAY';else{var top=leader();line=(player?'YOU '+(player.matchPoints||0):'')+(top&&top!==player?'   ·   '+top.name.toUpperCase()+' '+(top.matchPoints||0):'');}
      ctx.font="900 "+(line.length>20?13:17)+"px 'Orbitron',sans-serif";ctx.fillStyle=F==='horse'?'#ffd23d':'#ffffff';ctx.fillText(line,jx+jw/2,jy+40);
      var tl=hoopTimeLeft===Infinity?(F==='horse'&&S.horse&&S.horse.call?Math.max(0,Math.ceil((S.horse.until-T())/1000))+'s':'∞'):Math.ceil(hoopTimeLeft/1000)+'s';ctx.font="800 12px 'Orbitron',sans-serif";ctx.fillStyle=hoopTimeLeft<10000?'#ff3b5c':'#2de2ff';ctx.fillText(tl,jx+jw/2,jy+66);
      ctx.fillStyle='rgba(45,226,255,.06)';for(var sy=jy+4;sy<jy+jh;sy+=3)ctx.fillRect(jx+3,sy,jw-6,1);}
    /* stands + crowd */
    var on=G('crowd')!=='off'||party(),st0=fy-Math.min(150,H*0.2);ctx.fillStyle='#120d2e';ctx.fillRect(0,st0,W,fy-st0);
    var rows=lite?2:4,step=lite?22:13,rh=(fy-st0)/(rows+0.6),C=crowd(),off=-((cx*0.6)%step),ci=0;
    for(var rr=0;rr<rows;rr++){var ry=st0+rh*(rr+0.7);ctx.fillStyle=rr%2?'#1a1440':'#161038';ctx.fillRect(0,ry+rh*0.25,W,rh*0.75);
      if(!on)continue;var base=Math.floor(cx*0.6/step),body={},arms={},bw=rh*0.32,cheer=hy>0.55;
      for(var x2=off,j=0;x2<W+step;x2+=step,j++){var c=C[((((base+j)*5+rr*31)%C.length)+C.length)%C.length];var bob=Math.abs(Math.sin(t*(2+c.s*2)+c.p))*(2+hy*9)*(c.h<0.3+hy*0.7?1:0.25);var hx2=x2+(rr%2?step/2:0),hy2=ry-bob;
        var bp=body[c.c]||(body[c.c]=new Path2D());bp.rect(hx2-3,hy2+2,6,bw);bp.moveTo(hx2+3,hy2);bp.arc(hx2,hy2,3,0,7);
        if(cheer&&c.h<hy-0.3){var ap=arms[c.c]||(arms[c.c]=new Path2D());ap.moveTo(hx2-3,hy2+3);ap.lineTo(hx2-5,hy2-4-bob*0.3);ap.moveTo(hx2+3,hy2+3);ap.lineTo(hx2+5,hy2-4-bob*0.3);}}
      ctx.globalAlpha=0.22+rr*0.07;for(var bk in body){ctx.fillStyle=bk;ctx.fill(body[bk]);}ctx.lineWidth=1.6;for(var ak in arms){ctx.strokeStyle=ak;ctx.stroke(arms[ak]);}
      ctx.globalAlpha=1;}
    ctx.fillStyle='rgba(45,226,255,.5)';ctx.fillRect(0,st0-2,W,2);
    /* LED ad board */
    var ab=fy-16;ctx.fillStyle='#05060f';ctx.fillRect(0,ab,W,16);ctx.font="900 10px 'Orbitron',sans-serif";ctx.textBaseline='middle';ctx.textAlign='left';var msg=hy>0.6?'  🔥 MAKE SOME NOISE!  🔥  ':'  FREA! ARENA  ·  TREESH GAMES  ·  ';var mw=ctx.measureText(msg).width||200,mo=-((t*60+cx*0.8)%mw);ctx.fillStyle=hy>0.6?'#ff3db5':'#2de2ff';for(var mx=mo;mx<W;mx+=mw)ctx.fillText(msg,mx,ab+8.5);
    /* court floor */
    if(fy<H){var fg=ctx.createLinearGradient(0,fy,0,H);fg.addColorStop(0,'#c98a42');fg.addColorStop(.3,'#a8692c');fg.addColorStop(1,'#7a4a1a');ctx.fillStyle=fg;ctx.fillRect(0,fy,W,H-fy);
      ctx.strokeStyle='rgba(0,0,0,.1)';ctx.lineWidth=1;for(var px=-(cx%40);px<W;px+=40){ctx.beginPath();ctx.moveTo(px,fy);ctx.lineTo(px,H);ctx.stroke();}
      if(!lite){var rg=ctx.createLinearGradient(0,fy,0,fy+40);rg.addColorStop(0,'rgba(255,240,210,.22)');rg.addColorStop(1,'rgba(255,240,210,0)');ctx.fillStyle=rg;ctx.fillRect(0,fy,W,40);}
      ctx.strokeStyle='rgba(255,246,230,.7)';ctx.lineWidth=3;ctx.strokeRect(4-cx,fy+5,WORLD_W-8,H);var mid=WORLD_W/2-cx;ctx.beginPath();ctx.moveTo(mid,fy+5);ctx.lineTo(mid,H);ctx.stroke();
      ctx.beginPath();ctx.ellipse(mid,fy+30,70,20,0,0,7);ctx.stroke();ctx.font="900 16px 'Orbitron',sans-serif";ctx.textAlign='center';ctx.fillStyle='rgba(255,61,181,.75)';ctx.fillText('FREA!',mid,fy+31);
      hoops.forEach(function(h){if(h.bad)return;var kx=h.x-cx;ctx.fillStyle='rgba(155,107,255,.28)';ctx.fillRect(kx-h.r*1.1,fy+5,h.r*2.2,24);ctx.strokeStyle='rgba(255,246,230,.55)';ctx.strokeRect(kx-h.r*1.1,fy+5,h.r*2.2,24);});}
  }
  var _pd=Platform.prototype.draw;Platform.prototype.draw=function(cx,cy){if(gameMode==='hoops'&&STATE!=='title'&&this.kind==='rect'&&this.w>WORLD_W*0.8&&this.y>=WORLD_H-80){var basic=false;try{basic=FreaSkin.bg()==='basic';}catch(e){}if(!basic)return;}return _pd.apply(this,arguments);};
  /* ---- outdoor / themed arenas: shared scene painter + a themed court floor ---- */
  var COURTS={rooftop:{sc:'rooftop',f:['#3a3f4a','#2a2e38','#1c1f28'],ln:'rgba(255,255,255,.75)',key:'rgba(255,61,90,.35)',txt:'#ffd23d',plank:0,tag:'ROOFTOP RUN'},
    beach:{sc:'beach',f:['#f4dca0','#e8c47a','#c8a05a'],ln:'rgba(255,255,255,.85)',key:'rgba(45,180,255,.3)',txt:'#ff7a3d',plank:0,grain:'rgba(160,110,50,.18)',tag:'BEACH BALLIN'},
    street:{sc:'cyber',f:['#1a1030','#120a24','#08040f'],ln:'#2de2ff',key:'rgba(255,61,181,.35)',txt:'#ff3db5',plank:0,neon:1,tag:'NEON STREETS'},
    snow:{sc:'snow',f:['#dfe9f8','#c8d8f0','#a8bcd8'],ln:'rgba(40,90,170,.7)',key:'rgba(45,138,255,.28)',txt:'#2d8aff',plank:0,ice:1,tag:'ICE COURT'},
    space:{sc:'space',f:['#2a2e48','#1a1d33','#0e1020'],ln:'#9b6bff',key:'rgba(155,107,255,.3)',txt:'#c6ff3d',plank:0,neon:1,panel:1,tag:'ZERO-G DOME'},
    sakura:{sc:'sakura',f:['#d8a070','#b87a48','#8a5a30'],ln:'rgba(255,240,245,.85)',key:'rgba(255,122,176,.35)',txt:'#ff7ab0',plank:1,tag:'BLOSSOM COURT'},
    volcano:{sc:'volcano',f:['#3a2a28','#2a1c1a','#1a0e0c'],ln:'#ff7a3d',key:'rgba(255,90,40,.35)',txt:'#ffb03d',plank:0,neon:1,tag:'LAVA LEAGUE'},
    xccitia:{sc:'fw_xccitia',f:['#1c1048','#120a32','#05021a'],ln:'#ff3db5',key:'rgba(45,226,255,.3)',txt:'#2de2ff',plank:0,neon:1,tag:'XCCITIA NIGHTS'}};
  function court(th){var cx=camera.x||0,cy=camera.y||0,fy=WORLD_H-60-cy;try{FreaArenas.paint(th.sc,{fast:1});}catch(e){ctx.fillStyle='#0d1236';ctx.fillRect(0,0,W,H);}if(fy>=H)return;
    var fg=ctx.createLinearGradient(0,fy,0,H);fg.addColorStop(0,th.f[0]);fg.addColorStop(.35,th.f[1]);fg.addColorStop(1,th.f[2]);ctx.fillStyle=fg;ctx.fillRect(0,fy,W,H-fy);
    if(th.plank){ctx.strokeStyle='rgba(0,0,0,.12)';ctx.lineWidth=1;for(var px=-(cx%40);px<W;px+=40){ctx.beginPath();ctx.moveTo(px,fy);ctx.lineTo(px,H);ctx.stroke();}}
    if(th.grain){ctx.fillStyle=th.grain;for(var g=0;g<70;g++){ctx.fillRect(((g*97-cx)%W+W)%W,fy+6+(g*37)%Math.max(8,H-fy-6),2,2);}}
    if(th.panel){ctx.strokeStyle='rgba(155,107,255,.18)';ctx.lineWidth=1;for(var pp=-(cx%80);pp<W;pp+=80){ctx.strokeRect(pp,fy+4,80,H-fy);}}
    if(th.ice){var ig=ctx.createLinearGradient(0,fy,0,fy+30);ig.addColorStop(0,'rgba(255,255,255,.6)');ig.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=ig;ctx.fillRect(0,fy,W,30);}
    ctx.save();if(th.neon&&!perfMode){ctx.shadowColor=th.ln;ctx.shadowBlur=10;}ctx.strokeStyle=th.ln;ctx.lineWidth=3;ctx.strokeRect(4-cx,fy+5,WORLD_W-8,H);var mid=WORLD_W/2-cx;ctx.beginPath();ctx.moveTo(mid,fy+5);ctx.lineTo(mid,H);ctx.stroke();ctx.beginPath();ctx.ellipse(mid,fy+30,70,20,0,0,7);ctx.stroke();ctx.restore();
    ctx.font="900 15px 'Orbitron',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=th.txt;ctx.fillText(th.tag,mid,fy+31);
    hoops.forEach(function(h){if(h.bad)return;var kx=h.x-cx;ctx.fillStyle=th.key;ctx.fillRect(kx-h.r*1.1,fy+5,h.r*2.2,24);ctx.strokeStyle=th.ln;ctx.lineWidth=2;ctx.strokeRect(kx-h.r*1.1,fy+5,h.r*2.2,24);});
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(0,fy,W,3);}
  function arenaKey(){var a=party()?'frea':(G('arena')||'frea');if(a==='random'){if(!S._rArena){var ks=Object.keys(COURTS).concat(['frea']);S._rArena=ks[(Math.random()*ks.length)|0];}a=S._rArena;}return a;}
  var _bg=drawBG;drawBG=function(){if(gameMode==='hoops'&&STATE!=='title'){var basic=false;try{basic=FreaSkin.bg()==='basic';}catch(e){}if(!basic){var ak=arenaKey();if(COURTS[ak])court(COURTS[ak]);else arena();return;}}return _bg.apply(this,arguments);};
  window.FreaHoopArenas={list:function(){return ['frea'].concat(Object.keys(COURTS));},current:arenaKey};

  /* ---- settings (merged + grouped with the Hoops+ rows) ---- */
  try{var SCH=FreaModeSettings.schemas,old=SCH.hoops||[],by={};old.forEach(function(r){if(r.k)by[r.k]=r;});
    function o(k){return by[k]||null;}
    var rows=[{head:'Format'},
      {k:'format',l:'Game Format',sub:'Timed match · race to a score · called-shot H-O-R-S-E · 3-point contest',opts:[['timed','Timed'],['to21','First to X'],['horse','H-O-R-S-E'],['three','3-Pt Contest']],def:'timed'},
      {k:'win',l:'Win Score',opts:[[11,'11'],[21,'21'],[31,'31']],def:21,show:function(){return G('format')==='to21';}},
      o('series'),o('overtime'),o('shotclock'),
      {head:'Court'},
      {k:'motion',l:'Hoop Movement',opts:[['still','Still'],['slide','Slide'],['float','Float'],['teleport','Teleport']],def:HOOPS_CFG.move?'slide':'still'},
      o('hoopsN'),
      {k:'rim',l:'Rim Size',opts:[['small','Small'],['normal','Normal'],['big','Big']],def:'normal'},
      {k:'balltype',l:'Ball Type',sub:'How your flea flies and bounces off the rim',opts:[['classic','Classic'],['bouncy','Bouncy'],['floaty','Floaty'],['heavy','Heavy']],def:'classic'},
      {head:'Scoring & Power-ups'},
      o('tricks'),o('three'),o('power'),
      {k:'gold',l:'Golden Ball',sub:'Grab it: your next bucket is worth ×3',opts:[['on','On'],['off','Off']],def:'on'},
      {k:'arena',l:'Arena',sub:'Where the game is played',opts:[['frea','Frea! Arena'],['rooftop','Rooftop'],['beach','Beach'],['street','Neon Street'],['snow','Ice Court'],['space','Space Dome'],['sakura','Sakura'],['volcano','Volcano'],['xccitia','Xccitia'],['random','Random']],def:'frea'},
      {k:'crowd',l:'Arena Crowd',sub:'Cheering fans in the stands (turn off for speed)',opts:[['on','On'],['off','Off']],def:'on'}].filter(Boolean);
    SCH.hoops=rows;FreaModeSettings.render();}catch(e){console.warn('hoops2 settings',e);}
  /* the old "Hoop Motion" row is replaced by Hoop Movement */
  function tidy(){var w=document.getElementById('hoops-wrap');if(!w)return;var mv=w.querySelector('[data-hoops="move"]');if(mv&&mv.closest('.setting-row'))mv.closest('.setting-row').style.display='none';
    if(!w.querySelector('.xm-head')){var hd=document.createElement('div');hd.className='xm-head';hd.textContent='Match Setup';w.insertBefore(hd,w.firstChild);}}
  tidy();setTimeout(tidy,800);
  return {state:function(){return S;},format:fmt};
})();
window.FreaHoops2=FreaHoops2;
