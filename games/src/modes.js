/* ===================== FREA! PLUS — EXTRA GAME MODES =====================
   King of the Hill · Floor is Lava · Star Rush · Red Light Green Light · Freeze Tag
   Each mode registers into EXTRA_MODES (base.html dispatches setup/tick/draw/ai/score). */
var Modes=(function(){
  var ROUND=60; /* seconds per round (party can override) */
  var S={}; /* per-round state */
  function el(id){return document.getElementById(id);}
  function setT(l,v){var a=el('timer-lbl'),b=el('tval');if(a)a.textContent=l;if(b)b.textContent=v;}
  function clock(){S.left--;setT('Time',Math.max(0,S.left));if(S.left<=10)el('tbox').classList.add('danger');return S.left<=0;}
  function now(){return performance.now();}
  function d2(f,x,y){return Math.hypot(f.cx-x,f.cy-y);}
  function top(key){var a=fleas.slice().sort(function(a,b){return (b[key]||0)-(a[key]||0);});return a[0]||null;}
  function rankList(U,key,fmt,title){U.title(title);var a=fleas.slice().sort(function(a,b){return (b[key]||0)-(a[key]||0);});var hi=a.length?(a[0][key]||0):0;
    U.list(a.map(function(f){var v=f[key]||0;return {n:f.name,c:f.col,me:f.isP,lead:v===hi&&hi>0,pts:fmt?fmt(v,f):Math.floor(v)};}),{pos:true});}
  function holdPos(f){return {x:f.cx,y:f.cy};}
  function plats(){return platforms.slice(3).filter(function(p){return !p.deco&&!p.wall&&!p.gone;});}
  function star(c,x,y,r,rot,n,inner){c.beginPath();for(var i=0;i<n*2;i++){var a=rot+i*Math.PI/n,rr=i%2?r*(inner||.48):r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();}
  function burst(x,y,col,n){for(var i=0;i<(n||14);i++){var a=Math.random()*7,s=2+Math.random()*5;parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,l:1,r:2+Math.random()*3,c:col});}}
  function offArrow(x,y,col,label){var sx=x-camera.x,sy=y-camera.y;if(sx>20&&sx<W-20&&sy>70&&sy<H-20)return;var cx=W/2,cy=H/2,a=Math.atan2(sy-cy,sx-cx),m=46;
    var ex=Math.max(m,Math.min(W-m,cx+Math.cos(a)*W)),ey=Math.max(m+60,Math.min(H-m,cy+Math.sin(a)*H));
    ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-8,-11);ctx.lineTo(-3,0);ctx.lineTo(-8,11);ctx.closePath();ctx.fill();ctx.restore();
    if(label){ctx.save();ctx.font="800 11px 'Baloo 2',sans-serif";ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(label,ex-Math.cos(a)*24,ey-Math.sin(a)*24+4);ctx.restore();}}
  function kill(f,col){ /* remove a flea from the round (lava) */
    var i=fleas.indexOf(f);if(i<0)return;fleas.splice(i,1);burst(f.cx,f.cy,col||'#ff7a1a',20);camera.shake=Math.max(camera.shake,f.isP?14:6);
    flash(f.name.toUpperCase()+(f.isP?' — YOU MELTED!':' MELTED!'),'#ff7a1a');if(f.isP)playerDead=true;updScore();}

  /* ======================= KING OF THE HILL ======================= */
  var KOTH={layout:'horiz',maxAi:10,
    bounds:function(bw,bh){return [bw*1.8,Math.max(bh*1.15,560)];},
    setup:function(){S={left:ROUND,zone:null,move:0};fleas.forEach(function(f){f.hill=0;});KOTH.relocate(true);setT('Time',ROUND);},
    relocate:function(first){var ps=plats().filter(function(p){return !p.sp&&p.bw>=56;});var cur=S.zone&&S.zone.p;
      var pool=ps.filter(function(p){return p!==cur;});var p=pool.length?pool[Math.random()*pool.length|0]:platforms[0];
      S.zone={p:p,r:first?78:70,x:0,y:0,owner:null,contested:false};S.move=13000;KOTH.follow();
      if(!first){flash('THE HILL MOVED!','#ffd23d');}},
    follow:function(){var z=S.zone;if(!z)return;var tp=z.p===platforms[0]?{x:WORLD_W/2,y:WORLD_H-60}:z.p.topPoint();z.x=tp.x;z.y=tp.y-26;},
    tick:function(dt){var z=S.zone;if(!z)return;KOTH.follow();S.move-=dt;if(S.move<=0)KOTH.relocate();
      var ins=fleas.filter(function(f){return d2(f,z.x,z.y)<z.r;});z.contested=ins.length>1;z.owner=ins.length===1?ins[0]:null;
      var rate=ins.length===1?dt/110:dt/330;
      for(var i=0;i<ins.length;i++){var f=ins[i];f.hill=Math.min(100,(f.hill||0)+rate);if(f.hill>=100){endGame(f);return;}}
      if(z.owner&&z.owner.isP&&Math.random()<0.02)jpfx(z.x+(Math.random()-.5)*z.r,z.y+(Math.random()-.5)*z.r*.6,'#ffd23d');},
    second:function(){if(clock())endGame(top('hill'));},
    ai:function(f){var z=S.zone;if(!z)return null;if(d2(f,z.x,z.y)<z.r*.8)return holdPos(f);return stepTarget(f,z.x,z.y);},
    aiHold:function(f){var z=S.zone;return !!(z&&d2(f,z.x,z.y)<z.r*.75&&Math.random()>0.015);},
    drawBack:function(cx,cy){var z=S.zone;if(!z)return;var x=z.x-cx,y=z.y-cy,t=now()/1000,col=z.contested?'#ff3db5':(z.owner?(z.owner.col||'#ffd23d'):'#ffd23d');
      ctx.save();var bg=ctx.createLinearGradient(0,y-420,0,y);bg.addColorStop(0,rgbaOf(col,0));bg.addColorStop(1,rgbaOf(col,.22));ctx.fillStyle=bg;ctx.fillRect(x-z.r*.45,y-420,z.r*.9,420);
      var g=ctx.createRadialGradient(x,y,z.r*.2,x,y,z.r);g.addColorStop(0,rgbaOf(col,.05));g.addColorStop(.75,rgbaOf(col,.18));g.addColorStop(1,rgbaOf(col,.42));
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,z.r,0,7);ctx.fill();
      ctx.lineWidth=3;ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=perfMode?0:18;ctx.setLineDash([14,10]);ctx.lineDashOffset=-t*30;ctx.beginPath();ctx.arc(x,y,z.r,0,7);ctx.stroke();ctx.setLineDash([]);
      /* relocation timer ring */ctx.lineWidth=5;ctx.globalAlpha=.85;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(x,y,z.r+8,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,S.move/13000));ctx.stroke();
      ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.font="900 26px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.fillStyle=rgbaOf('#ffffff',.9);ctx.fillText(z.contested?'⚔':'♛',x,y-z.r-16+Math.sin(t*3)*3);ctx.restore();},
    drawFront:function(cx,cy){var z=S.zone;if(!z)return;offArrow(z.x,z.y,'#ffd23d','HILL');
      fleas.forEach(function(f){if(!f.hill)return;var x=f.cx-cx,y=f.y-cy-14;if(x<-30||x>W+30||y<-30||y>H+30)return;ctx.save();ctx.lineWidth=3.2;ctx.strokeStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(x,y,8,0,7);ctx.stroke();ctx.strokeStyle=f.isP?'#ffd23d':(f.col||'#fff');ctx.beginPath();ctx.arc(x,y,8,-Math.PI/2,-Math.PI/2+Math.PI*2*f.hill/100);ctx.stroke();ctx.restore();});},
    score:function(c,U){rankList(U,'hill',function(v){return Math.floor(v)+'%';},'Hill Control');},
    endSub:function(won){return won?'You ruled the hill!':'Crowned on the hill';}};

  /* ======================= FLOOR IS LAVA ======================= */
  var LAVA={layout:'box',still:true,maxAi:10,
    bounds:function(bw,bh){return [Math.max(bw*1.25,700),Math.max(bh*1.9,900)];},
    build:function(){var rowH=112,y=WORLD_H-170,row=0;
      while(y>120){var n=2+(Math.random()*3|0),slots=[],sw=(WORLD_W-80)/n;
        for(var i=0;i<n;i++){var w=86+Math.random()*70,x=40+sw*i+Math.random()*Math.max(4,sw-w-10);var p=new Platform({kind:'rect',x:x,y:y+(Math.random()*24-12),w:w,h:18});p._kind='rect';p.matBase=row%2?'#6b4a86':'#5a4a7a';p.matGlow='#ff7a3d';platforms.push(p);}
        y-=rowH;row++;}
      return true;},
    setup:function(){S={left:ROUND,lava:WORLD_H+30,grace:3500,crumble:2600,dead:0,end:0};setT('Lava',ROUND);},
    tick:function(dt){
      if(S.grace>0){S.grace-=dt;var g=Math.ceil(S.grace/1000);if(g!==S._g){S._g=g;if(g>0)flash('LAVA RISING IN '+g+'…','#ff7a1a');else flash('THE FLOOR IS LAVA!','#ff3b00');}}
      else{var spd=(WORLD_H*0.78)/(64000)*(1+(ROUND-S.left)/ROUND*0.8);S.lava-=spd*dt;}
      S.lava=Math.max(WORLD_H*0.16,S.lava);
      /* crumble a random platform every so often */
      S.crumble-=dt;if(S.crumble<=0&&S.grace<=0){S.crumble=1700+Math.random()*1300;var ps=plats().filter(function(p){return !p.crumbT&&!p.sinking&&p.by<S.lava-40;});
        if(ps.length>3){var p=ps[Math.random()*ps.length|0];p.crumbT=950;p._mb=p.matBase;}}
      for(var i=platforms.length-1;i>=3;i--){var p=platforms[i];
        if(p.crumbT){p.crumbT-=dt;p.matBase=(Math.floor(now()/90)%2)?'#ff5a1e':(p._mb||'#5a4a7a');if(p.crumbT<=0){p.crumbT=0;p.sinking=true;p.sv=0.6;p.matBase='#8a3a2a';}}
        if(!p.sinking&&p.by+p.bh>S.lava+6){p.sinking=true;p.sv=0.3;p.matBase='#8a3a2a';}
        if(p.sinking){p.sv=Math.min(7,p.sv+0.012*dt);var d=p.sv*dt/16;p._shift(0,d);
          for(var k=0;k<fleas.length;k++){var f=fleas[k];if(f.stuck&&f.platform===p){f.y+=d;}}
          if(Math.random()<0.25)parts.push({x:p.bx+Math.random()*p.bw,y:p.by,vx:(Math.random()-.5)*2,vy:-1-Math.random()*2,l:1,r:2+Math.random()*2,c:'#ff9a3d'});
          if(p.by>S.lava+80){platforms.splice(i,1);fleas.forEach(function(f){if(f.platform===p){f.platform=null;f.stuck=false;f.onG=false;}});}}}
      /* molten check */
      for(var j=fleas.length-1;j>=0;j--){var f2=fleas[j];if(f2.y+f2.h>S.lava+6)kill(f2);}
      if(STATE!=='play')return;
      if(fleas.length<=1){endGame(fleas[0]||null);return;}
      },
    highest:function(){var b=null;fleas.forEach(function(f){if(!b||f.y<b.y)b=f;});return b;},
    second:function(){if(S.grace>0)return;S.left--;setT('Lava',Math.max(0,S.left));if(S.left<=10)el('tbox').classList.add('danger');if(S.left<=0)endGame(LAVA.highest());},
    ai:function(f){var best=null,bs=-1e9,ps=plats();for(var i=0;i<ps.length;i++){var p=ps[i];if(p.sinking||p.crumbT)continue;var tp=p.topPoint();var safe=S.lava-tp.y;if(safe<60)continue;
        var sc=safe*0.6-Math.abs(tp.x-f.cx)*0.5-Math.max(0,f.cy-tp.y-260)*1.2-Math.max(0,tp.y-f.cy)*0.8;if(sc>bs){bs=sc;best=tp;}}
      var danger=(f.platform&&(f.platform.sinking||f.platform.crumbT))||(S.lava-f.cy<200);
      if(!best)return {x:f.cx,y:f.cy-200,flee:true};return {x:best.x,y:best.y-12,chase:danger};},
    aiHold:function(f){var p=f.platform;if(!p||p.sinking||p.crumbT)return false;return (S.lava-f.cy>300)&&Math.random()>0.03;},
    drawFront:function(cx,cy){var y=S.lava-cy;if(y>H+10)return;var t=now()/1000;ctx.save();
      var g=ctx.createLinearGradient(0,y,0,Math.min(H,y+260));g.addColorStop(0,'#ffd23d');g.addColorStop(.12,'#ff7a1a');g.addColorStop(.5,'#e8321a');g.addColorStop(1,'#6a0e10');
      ctx.fillStyle=g;ctx.shadowColor='#ff5a1e';ctx.shadowBlur=perfMode?0:30;ctx.beginPath();ctx.moveTo(0,H+5);
      for(var x=0;x<=W+20;x+=18){ctx.lineTo(x,y+Math.sin(t*2.2+(x+cx)*0.02)*6+Math.sin(t*3.1+(x+cx)*0.045)*3);}ctx.lineTo(W+20,H+5);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,230,140,.75)';for(var i=0;i<14;i++){var bx=((i*97.3+t*20)%(W+40))-20,ph=(t*1.3+i*.37)%1,by=y+10+(1-ph)*50,r=2+ph*5;ctx.globalAlpha=1-ph;ctx.beginPath();ctx.arc(bx,by,r,0,7);ctx.fill();}
      ctx.globalAlpha=1;var hg=ctx.createLinearGradient(0,y-90,0,y);hg.addColorStop(0,'rgba(255,90,30,0)');hg.addColorStop(1,'rgba(255,90,30,.22)');ctx.fillStyle=hg;ctx.fillRect(0,y-90,W,90);ctx.restore();},
    score:function(c,U){U.title(S.grace>0?'Get high — lava soon!':'Floor is Lava');var h=Math.max(0,Math.round((WORLD_H-60-S.lava)/10));U.pills([{v:fleas.length,l:'Alive',c:'#ff7a1a'},{v:h+'m',l:'Lava',c:'#ffd23d'}]);},
    endSub:function(won){return won?'Last flea above the lava!':'The lava got you';}};

  /* ======================= STAR RUSH ======================= */
  var STARS={layout:'horiz',maxAi:10,
    bounds:function(bw,bh){return [bw*1.7,Math.max(bh*1.25,600)];},
    setup:function(){S={left:ROUND,stars:[],spawn:0};fleas.forEach(function(f){f.starPts=0;});for(var i=0;i<12;i++){STARS.add();var s=S.stars[i];s.y=40+Math.random()*(WORLD_H-200);}setT('Time',ROUND);},
    add:function(){var r=Math.random(),k=r<0.08?'big':(r<0.32?'spike':'gold');S.stars.push({x:40+Math.random()*(WORLD_W-80),y:-20,vy:1.8+Math.random()*1.6,vx:(Math.random()-.5)*0.4,k:k,r:k==='big'?17:(k==='spike'?14:11),rot:Math.random()*6,land:0,life:0});},
    tick:function(dt){S.spawn-=dt;if(S.spawn<=0){S.spawn=340+Math.random()*260;if(S.stars.length<30)STARS.add();}
      for(var i=S.stars.length-1;i>=0;i--){var s=S.stars[i];s.rot+=dt*(s.k==='spike'?0.004:0.002);
        if(!s.land){s.y+=s.vy*dt/16;s.x+=s.vx*dt/16;for(var p=0;p<platforms.length;p++){var pl=platforms[p];if(pl.wall&&p>0)continue;if(pl.contains(s.x,s.y+s.r,0)){s.land=1;break;}}if(s.y>WORLD_H-60-s.r){s.y=WORLD_H-60-s.r;s.land=1;}}
        else{s.life+=dt;if(s.life>6000){S.stars.splice(i,1);continue;}}
        for(var j=0;j<fleas.length;j++){var f=fleas[j];if(f.frozen&&Date.now()<f.frozen)continue;if(d2(f,s.x,s.y)<f.w/2+s.r){STARS.hit(f,s);S.stars.splice(i,1);break;}}}},
    hit:function(f,s){if(s.k==='spike'){f.starPts=Math.max(0,(f.starPts||0)-3);f.frozen=Date.now()+1000;burst(s.x,s.y,'#ff3db5',16);if(f.isP){camera.shake=10;flash('OUCH! −3','#ff3db5');}else maybeSay(f,'Ouch!',900);}
      else{var v=s.k==='big'?5:1;f.starPts=(f.starPts||0)+v;burst(s.x,s.y,s.k==='big'?'#c6ff3d':'#ffd23d',s.k==='big'?22:10);if(f.isP&&v>1)flash('MEGA STAR +5!','#c6ff3d');}updScore();},
    second:function(){if(clock())endGame(top('starPts'));},
    ai:function(f){var best=null,bs=1e9;for(var i=0;i<S.stars.length;i++){var s=S.stars[i];var d=d2(f,s.x,s.y);
        if(s.k==='spike'){if(d<90&&s.y<f.cy)return fleeTarget(f,{cx:s.x,cy:s.y},240);continue;}
        var c=d*(s.k==='big'?0.45:1)+(s.land?0:Math.max(0,f.cy-s.y)*0.4);if(c<bs){bs=c;best=s;}}
      return best?stepTarget(f,best.x,best.y+(best.land?0:60)):null;},
    drawBack:function(cx,cy){var t=now()/1000;for(var i=0;i<S.stars.length;i++){var s=S.stars[i],x=s.x-cx,y=s.y-cy;if(x<-30||x>W+30||y<-30||y>H+30)continue;
      var fade=s.life>4800?Math.max(0,1-(s.life-4800)/1200)*(0.5+0.5*Math.sin(t*20)):1;ctx.save();ctx.globalAlpha=fade;
      if(s.k==='spike'){ctx.fillStyle='#ff3db5';ctx.shadowColor='#ff3db5';ctx.shadowBlur=perfMode?0:14;star(ctx,x,y,s.r,s.rot,8,.55);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#2a0a24';ctx.beginPath();ctx.arc(x,y,s.r*.42,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-4,y-2,2.5,2.5);ctx.fillRect(x+2,y-2,2.5,2.5);}
      else{var col=s.k==='big'?'#c6ff3d':'#ffd23d';if(!s.land){ctx.strokeStyle=rgbaOf(col,.35);ctx.lineWidth=s.r*.7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y-s.r*.6);ctx.lineTo(x-s.vx*20,y-s.r*3.2);ctx.stroke();}
        ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=perfMode?0:18;star(ctx,x,y,s.r*(1+Math.sin(t*6+i)*.06),s.rot,5);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.arc(x-s.r*.25,y-s.r*.25,s.r*.2,0,7);ctx.fill();}
      ctx.restore();}},
    score:function(c,U){rankList(U,'starPts',null,'Star Points');},
    endSub:function(won){return won?'Star collector supreme!':'Out-starred this time';}};

  /* ======================= RED LIGHT, GREEN LIGHT ======================= */
  var RL={layout:'horiz',still:true,maxAi:10,START:240,
    /* a LONG straight course: ~9-16k world units so a round is a real race */
    bounds:function(bw,bh){return [Math.round(Math.min(16000,Math.max(9000,bw*8))),Math.max(bh,520)];},
    build:function(){var x=520;while(x<WORLD_W-420){var w=90+Math.random()*110,y=WORLD_H-150-Math.random()*Math.min(170,WORLD_H-320);var p=new Platform({kind:'rect',x:x,y:y,w:w,h:18});p._kind='rect';platforms.push(p);x+=w+160+Math.random()*220;}return true;},
    lineUp:function(){/* everyone starts together behind the start line */var n=fleas.length,gap=Math.min(44,(RL.START-30)/Math.max(1,n));
      var order=fleas.slice().sort(function(a,b){return a.isP?-1:(b.isP?1:0);});
      order.forEach(function(f,i){f.x=RL.START-6-f.w-i*gap;f.y=WORLD_H-60-f.h-2;f.vx=0;f.vy=0;f.stuck=true;f.platform=null;f.onG=true;f.angle=0;f.frozen=0;f._snap=null;f.rlProg=0;f.face=1;});
      try{camera.x=0;}catch(e){}},
    setup:function(){S={left:Math.round(ROUND*2),ph:'green',pt:3000,fin:WORLD_W-220,grace:0,cd:0};setT('Time',S.left);RL.lineUp();},
    go:function(){RL.lineUp();RL.set('green');},
    set:function(ph){S.ph=ph;if(ph==='green'){S.pt=2600+Math.random()*2600;flash('GREEN LIGHT — GO!','#39ff7a');}
      else if(ph==='yellow'){S.pt=1100;flash('YELLOW — GET READY TO STOP','#ffd23d');}
      else{S.pt=1800+Math.random()*1600;S.grace=650;fleas.forEach(function(f){f._snap=null;f._risk=Math.random()<0.18;});flash('RED LIGHT — FREEZE!','#ff3b5c');}},
    tick:function(dt){S.pt-=dt;if(S.pt<=0)RL.set(S.ph==='green'?'yellow':(S.ph==='yellow'?'red':'green'));
      if(S.ph==='red'){if(S.grace>0)S.grace-=dt;
        else for(var i=0;i<fleas.length;i++){var f=fleas[i];if(f.frozen&&Date.now()<f.frozen)continue;
          /* airborne fleas are allowed to land first — the snapshot is taken on touchdown */
          if(!f._snap){if(f.stuck)f._snap={x:f.x,y:f.y};continue;}
          if(Math.hypot(f.x-f._snap.x,f.y-f._snap.y)>10||!f.stuck)RL.caught(f);}}
      for(var k=0;k<fleas.length;k++){var q=fleas[k];q.rlProg=Math.max(0,Math.min(100,(q.cx-RL.START)/(S.fin-RL.START)*100));if(q.cx>=S.fin){endGame(q);return;}}},
    caught:function(f){var back=Math.min(900,Math.max(500,WORLD_W*.06)),nx=Math.max(20,f.x-back);burst(f.cx,f.cy,'#ff3b5c',16);f.x=nx;f.y=WORLD_H-60-f.h-2;f.vx=0;f.vy=0;f.stuck=true;f.platform=null;f.angle=0;f.frozen=Date.now()+900;
      f._snap={x:f.x,y:f.y};if(f.isP){camera.shake=12;flash('CAUGHT MOVING! BACK YOU GO','#ff3b5c');}else maybeSay(f,'Nooo!',1000);},
    second:function(){if(clock())endGame(top('rlProg'));},
    ai:function(f){return stepTarget(f,Math.min(WORLD_W-40,f.cx+260+Math.random()*120),WORLD_H-100);},
    aiHold:function(f){if(S.ph==='green'){if(f._hes&&Date.now()<f._hes)return true;if(Math.random()<0.03)f._hes=Date.now()+500+Math.random()*900;return false;}if(S.ph==='red'&&f._risk&&Math.random()<0.015)return false;return true;},
    drawBack:function(cx,cy){var fx=S.fin-cx,t=now()/1000;if(fx>-60&&fx<W+60){ctx.save();for(var y=0;y<WORLD_H;y+=20){var yy=y-cy;if(yy<-20||yy>H)continue;ctx.fillStyle=((y/20)%2)?'#fff':'#15152a';ctx.fillRect(fx,yy,10,20);ctx.fillStyle=((y/20)%2)?'#15152a':'#fff';ctx.fillRect(fx+10,yy,10,20);}
        ctx.fillStyle='rgba(57,255,122,.12)';ctx.fillRect(fx+20,0,W,H);ctx.font="900 28px 'Baloo 2',sans-serif";ctx.fillStyle='#39ff7a';ctx.textAlign='left';ctx.fillText('FINISH',fx+30,WORLD_H-110-cy+Math.sin(t*3)*4);ctx.restore();}
      var sx=RL.START-cx;if(sx>-10&&sx<W+10){ctx.save();ctx.strokeStyle='rgba(255,255,255,.45)';ctx.setLineDash([10,8]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx,0);ctx.lineTo(sx,H);ctx.stroke();ctx.font="900 18px 'Baloo 2',sans-serif";ctx.fillStyle='rgba(255,255,255,.7)';ctx.textAlign='left';ctx.fillText('START',sx+8,WORLD_H-150-cy);ctx.restore();}
      /* distance markers every 1000 units */ctx.save();ctx.font="800 13px 'Baloo 2',sans-serif";ctx.textAlign='center';for(var m=1000;m<S.fin;m+=1000){var mx=m-cx;if(mx<-40||mx>W+40)continue;var pct=Math.round((m-RL.START)/(S.fin-RL.START)*100);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(mx-1,WORLD_H-60-cy-46,2,46);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillText(pct+'%',mx,WORLD_H-60-cy-52);}ctx.restore();},
    drawFront:function(){var ph=S.ph,cols={green:'#39ff7a',yellow:'#ffd23d',red:'#ff3b5c'},c=cols[ph]||'#39ff7a';ctx.save();
      /* edge glow */var eg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.45,W/2,H/2,Math.max(W,H)*.75);eg.addColorStop(0,rgbaOf(c,0));eg.addColorStop(1,rgbaOf(c,ph==='red'?.38:.16));ctx.fillStyle=eg;ctx.fillRect(0,0,W,H);
      /* traffic light pod (top-right, under the timer) */var pw=46,ph2=132,x=W-pw-14,y=78;ctx.fillStyle='rgba(8,10,26,.78)';ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x,y,pw,ph2,23);ctx.fill();ctx.stroke();
      ['red','yellow','green'].forEach(function(k,i){var lx=x+pw/2,ly=y+26+i*40,on=k===ph;ctx.beginPath();ctx.arc(lx,ly,14,0,7);ctx.fillStyle=on?cols[k]:'rgba(255,255,255,.08)';ctx.shadowColor=cols[k];ctx.shadowBlur=on&&!perfMode?22:0;ctx.fill();});
      ctx.shadowBlur=0;
      /* race track: everyone's progress at a glance */var tw=Math.min(560,W*.46),tx=W/2-tw/2,ty=Math.max(H-70,Math.min(H-24,(WORLD_H-60-camera.y+H)/2));ctx.fillStyle='rgba(8,10,26,.72)';ctx.strokeStyle='rgba(255,255,255,.16)';ctx.beginPath();ctx.roundRect(tx-16,ty-14,tw+32,28,14);ctx.fill();ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(tx,ty-1.5,tw,3);ctx.fillStyle='#39ff7a';ctx.fillRect(tx+tw-3,ty-8,3,16);
      fleas.slice().sort(function(a,b){return a.isP?1:(b.isP?-1:0);}).forEach(function(f){var px=tx+tw*(f.rlProg||0)/100;ctx.beginPath();ctx.arc(px,ty,f.isP?7:5,0,7);ctx.fillStyle=f.col;ctx.fill();if(f.isP){ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();}});
      ctx.restore();},
    score:function(c,U){rankList(U,'rlProg',function(v){return Math.floor(v)+'%';},S.ph==='red'?'RED — don\u2019t move!':(S.ph==='yellow'?'Yellow — stop soon!':'Green — go go go!'));},
    endSub:function(won){return won?'First across the finish!':'Someone crossed first';}};

  /* ======================= FREEZE TAG ======================= */
  var FRZ={layout:'box',maxAi:12,
    bounds:function(bw,bh){return [bw*1.9,bh*1.6];},
    setup:function(){S={left:ROUND};var n=fleas.length>=8?2:1;fleas.forEach(function(f){f.it=false;f.iced=false;f.rescues=0;f.immune=0;});
      var cands=fleas.filter(function(f){return !f.isP;}).sort(function(){return Math.random()-.5;});
      if(!cands.length||Math.random()<0.3){player.it=true;n--;}
      for(var i=0;i<n&&i<cands.length-(player.it?1:0);i++)cands[i].it=true;
      setT('Time',ROUND);},
    go:function(){flash(player.it?'YOU ARE IT! FREEZE EVERYONE!':'RUN! DON\u2019T GET FROZEN!','#8fe8ff');},
    runners:function(){return fleas.filter(function(f){return !f.it;});},
    tick:function(dt){var t=Date.now();
      for(var i=0;i<fleas.length;i++){var a=fleas[i];
        for(var j=0;j<fleas.length;j++){var b=fleas[j];if(a===b)continue;var close=Math.hypot(a.cx-b.cx,a.cy-b.cy)<(a.w+b.w)*0.5+3;if(!close)continue;
          if(a.it&&!b.it&&!b.iced&&t>b.immune){b.iced=true;b.frozen=t+1e9;b.vx=0;b.vy=0;burst(b.cx,b.cy,'#8fe8ff',14);flash(b.isP?'YOU GOT FROZEN! WAIT FOR A RESCUE':b.name.toUpperCase()+' FROZEN!','#8fe8ff');if(!b.isP)maybeSay(b,'Brrr!',1200);updScore();}
          else if(!a.it&&!a.iced&&b.iced){b.iced=false;b.frozen=0;b.immune=t+1600;b.stuck=false;b.vy=-4;a.rescues=(a.rescues||0)+1;burst(b.cx,b.cy,'#c6ff3d',14);flash((a.isP?'YOU':a.name.toUpperCase())+' RESCUED '+(b.isP?'YOU':b.name.toUpperCase())+'!','#c6ff3d');updScore();}}}
      var r=FRZ.runners();if(r.length&&r.every(function(f){return f.iced;})){var its=fleas.filter(function(f){return f.it;});endGame(its.indexOf(player)>=0?player:its[0]);}},
    second:function(){if(!clock())return;var r=FRZ.runners().filter(function(f){return !f.iced;});if(r.indexOf(player)>=0){endGame(player);return;}r.sort(function(a,b){return (b.rescues||0)-(a.rescues||0);});endGame(r[0]||null);},
    ai:function(f){if(f.it){var n=nearestOther(f,function(o){return !o.it&&!o.iced&&Date.now()>o.immune;});return n.flea?{x:n.flea.cx,y:n.flea.cy,chase:true}:wanderTarget(f);}
      var it=nearestOther(f,function(o){return o.it;}),fr=nearestOther(f,function(o){return o.iced;});
      if(fr.flea&&(!it.flea||it.dist>260)&&fr.dist<700)return {x:fr.flea.cx,y:fr.flea.cy,chase:true};
      return it.flea&&it.dist<520?fleeTarget(f,it.flea,480):wanderTarget(f);},
    drawFront:function(cx,cy){var t=now()/1000;fleas.forEach(function(f){var x=f.cx-cx,y=f.cy-cy;if(x<-40||x>W+40||y<-40||y>H+40)return;ctx.save();
      if(f.it){ctx.strokeStyle='#8fe8ff';ctx.lineWidth=2.5;ctx.shadowColor='#8fe8ff';ctx.shadowBlur=perfMode?0:14;ctx.beginPath();ctx.arc(x,y,f.w*.9+Math.sin(t*5)*2,0,7);ctx.stroke();ctx.shadowBlur=0;ctx.font="900 12px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.fillStyle='#8fe8ff';ctx.fillText('IT',x,y-f.h-12);}
      else if(Date.now()<f.immune){ctx.globalAlpha=.6;ctx.strokeStyle='#c6ff3d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,f.w*.8,0,7);ctx.stroke();}
      ctx.restore();});
      if(player&&!player.it){var n=nearestOther(player,function(o){return o.iced;});if(n.flea&&!player.iced)offArrow(n.flea.cx,n.flea.cy,'#c6ff3d','HELP');}},
    score:function(c,U){var r=FRZ.runners(),ic=r.filter(function(f){return f.iced;}).length;U.title(player&&player.it?'You are IT — freeze them all!':(player&&player.iced?'Frozen! Wait for a rescue':'Run & rescue frozen friends'));
      U.pills([{v:r.length-ic,l:'Free',c:'#c6ff3d'},{v:ic,l:'Frozen',c:'#8fe8ff'}]);},
    endSub:function(won,w){if(w&&w.it)return won?'You froze everyone!':'Everyone got frozen!';return won?'You stayed free!':'The runners survived';}};

  /* ---------- register ---------- */
  EXTRA_MODES.koth=KOTH;EXTRA_MODES.lava=LAVA;EXTRA_MODES.stars=STARS;EXTRA_MODES.redlight=RL;EXTRA_MODES.freeze=FRZ;
  var INFO={
    koth:{ico:'♛',name:'King of the Hill',short:'Hill',desc:'Hold the glowing zone to score',sub:'Stand inside the glowing zone to fill your crown. Share it and it fills slowly. First to 100% wins!',col:['#2a2008','#ffd23d'],scene:'crystal',mc:'#ffd23d',m:['#3a2a8a','#ffd23d']},
    lava:{ico:'🌋',name:'Floor is Lava',short:'Lava',desc:'Platforms sink. Stay above the lava!',sub:'The lava is rising and platforms crumble. Keep hopping higher. Last flea standing wins!',col:['#3a0e08','#ff7a1a'],scene:'volcano',mc:'#ff7a1a',m:['#4a0e12','#ff7a1a']},
    stars:{ico:'⭐',name:'Star Rush',short:'Stars',desc:'Grab falling stars, dodge the spiky ones',sub:'Collect gold stars (+1) and mega stars (+5). Pink spiky stars sting you (−3). Most points wins!',col:['#101a3a','#c6ff3d'],scene:'space',mc:'#c6ff3d',m:['#0a0d2e','#ffd23d']},
    redlight:{ico:'🚦',name:'Red Light, Green Light',short:'Red Light',desc:'Move on green. Freeze on red!',sub:'Race to the finish line, but only move on green. Get caught moving on red and you get sent back!',col:['#0e2a18','#39ff7a'],scene:'speedway',mc:'#39ff7a',m:['#2a1a5e','#39ff7a']},
    freeze:{ico:'❄',name:'Freeze Tag',short:'Freeze',desc:'IT freezes, friends rescue',sub:'IT freezes everyone they touch. Touch a frozen friend to set them free. Survive until time runs out!',col:['#0a2238','#8fe8ff'],scene:'snow',mc:'#8fe8ff',m:['#07203a','#8fe8ff']}
  };
  Object.keys(INFO).forEach(function(k){var d=INFO[k];MODE_INTRO[k]={ico:d.ico,name:d.name,sub:d.sub,col:d.col};try{MODE_LABEL[k]=d.name;}catch(e){}
    try{if(window.FreaArenas)FreaArenas.modeScene[k]=d.scene;}catch(e){}});

  /* ---------- tile art (procedural) ---------- */
  function tileArt(k){var d=INFO[k],c=document.createElement('canvas');c.width=300;c.height=372;var x=c.getContext('2d');
    var g=x.createLinearGradient(0,0,0,372);g.addColorStop(0,d.m[0]);g.addColorStop(1,'#05060f');x.fillStyle=g;x.fillRect(0,0,300,372);
    var rg=x.createRadialGradient(150,150,10,150,150,190);rg.addColorStop(0,rgbaOf(d.m[1],.45));rg.addColorStop(1,rgbaOf(d.m[1],0));x.fillStyle=rg;x.fillRect(0,0,300,372);
    x.save();x.globalAlpha=.9;
    if(k==='koth'){x.fillStyle='#4a3aa0';x.beginPath();x.roundRect(60,230,180,22,11);x.fill();x.strokeStyle='#ffd23d';x.lineWidth=5;x.shadowColor='#ffd23d';x.shadowBlur=24;x.setLineDash([16,10]);x.beginPath();x.arc(150,190,70,0,7);x.stroke();x.setLineDash([]);x.font='900 54px serif';x.textAlign='center';x.fillStyle='#ffd23d';x.fillText('♛',150,95);}
    if(k==='lava'){x.fillStyle='#6b4a86';[[30,150,90],[180,110,90],[100,210,100]].forEach(function(p){x.beginPath();x.roundRect(p[0],p[1],p[2],18,9);x.fill();});var lg=x.createLinearGradient(0,250,0,372);lg.addColorStop(0,'#ffd23d');lg.addColorStop(.2,'#ff7a1a');lg.addColorStop(1,'#6a0e10');x.fillStyle=lg;x.shadowColor='#ff5a1e';x.shadowBlur=30;x.beginPath();x.moveTo(0,372);for(var i=0;i<=300;i+=15)x.lineTo(i,262+Math.sin(i*.05)*8);x.lineTo(300,372);x.fill();}
    if(k==='stars'){[[60,60,16,'#ffd23d'],[230,80,12,'#ffd23d'],[110,130,24,'#c6ff3d'],[210,170,14,'#ff3db5'],[50,200,11,'#ffd23d']].forEach(function(s){x.fillStyle=s[3];x.shadowColor=s[3];x.shadowBlur=18;star(x,s[0],s[1],s[2],.3,s[3]==='#ff3db5'?8:5,s[3]==='#ff3db5'?.55:.48);x.fill();});}
    if(k==='redlight'){x.fillStyle='rgba(8,10,26,.85)';x.beginPath();x.roundRect(110,30,80,190,40);x.fill();['#ff3b5c','#ffd23d','#39ff7a'].forEach(function(cc,i){x.fillStyle=i===2?cc:rgbaOf(cc,.25);x.shadowColor=cc;x.shadowBlur=i===2?30:0;x.beginPath();x.arc(150,70+i*55,20,0,7);x.fill();});x.shadowBlur=0;for(var y=230;y<372;y+=16){x.fillStyle=((y/16)%2)?'#fff':'#15152a';x.fillRect(250,y,12,16);x.fillStyle=((y/16)%2)?'#15152a':'#fff';x.fillRect(262,y,12,16);}}
    if(k==='freeze'){x.strokeStyle='#dff8ff';x.lineWidth=5;x.shadowColor='#8fe8ff';x.shadowBlur=22;for(var a=0;a<6;a++){var an=a*Math.PI/3;x.beginPath();x.moveTo(150,110);x.lineTo(150+Math.cos(an)*62,110+Math.sin(an)*62);x.stroke();x.beginPath();x.moveTo(150+Math.cos(an)*38,110+Math.sin(an)*38);x.lineTo(150+Math.cos(an+.5)*52,110+Math.sin(an+.5)*52);x.stroke();}x.fillStyle='rgba(170,230,255,.3)';x.strokeStyle='rgba(220,248,255,.9)';x.lineWidth=2;x.beginPath();x.roundRect(60,190,70,80,10);x.fill();x.stroke();}
    x.restore();
    try{var fc=document.createElement('canvas');fc.width=150;fc.height=150;var me=(saved.find(function(f){return f.id===activeId;})||saved[0]);drawFleaStatic(fc,k==='freeze'?Object.assign({},me,{color:'#8fe8ff'}):me);x.drawImage(fc,k==='lava'?120:(k==='koth'?75:80),k==='lava'?100:(k==='koth'?115:170),150,150);}catch(e){}
    return c.toDataURL('image/jpeg',.82);}

  /* ---------- lobby tiles ---------- */
  function mountTiles(){var grid=el('modes');if(!grid||grid.querySelector('[data-mode="koth"]'))return;var zen=grid.querySelector('[data-mode="zen"]');
    Object.keys(INFO).forEach(function(k){var d=INFO[k],art='';try{art=tileArt(k);}catch(e){}MODE_INTRO[k].img=art;
      var n=document.createElement('div');n.className='mode-chip mode-card xm-card';n.dataset.mode=k;n.style.setProperty('--mc',d.mc);n.setAttribute('data-testid','mode-card-'+k);
      n.innerHTML='<div class="mc-art"><img alt="" src="'+art+'"></div><div class="mc-info"><div class="mc-title">'+d.name+'</div><div class="mc-desc">'+d.desc+'</div></div><span class="mc-check">✓</span><span class="mc-new">NEW</span>';
      n.addEventListener('click',function(){setMode(k);});grid.insertBefore(n,zen);});
    modeChips=document.querySelectorAll('.mode-chip');
    try{var gm=localStorage.getItem('frea_gamemode');if(gm&&INFO[gm])setMode(gm);else syncModeChips();}catch(e){}}
  var _ssu=syncSettingsUI;syncSettingsUI=function(){_ssu();if(!EXTRA_MODES[gameMode])return;var s=el('sg-mode-sub');if(s)s.textContent=INFO[gameMode].name;
    var lw=el('layout-row-wrap');if(lw)lw.style.display='none';var ai=el('ai-slider');if(ai){ai.max=EXTRA_MODES[gameMode].maxAi||10;if(+ai.value>+ai.max)ai.value=ai.max;el('ai-val').textContent=ai.value;configAi=+ai.value;}var al=el('ai-label');if(al)al.textContent='Rival Fleas';};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountTiles);else setTimeout(mountTiles,0);
  return {info:INFO,state:function(){return S;},setRound:function(s){ROUND=s;},round:function(){return ROUND;},start:function(m){setMode(m);startGame();},dbg:function(){return {fleas:fleas,platforms:platforms,W:WORLD_W,H:WORLD_H,player:player,state:STATE,mode:gameMode};}};
})();
window.FreaModes=Modes;
