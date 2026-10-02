/* =====================================================================
   SMART AI — sharper CPU fleas for every mode
   • Trajectory planner: samples ~75 launches and scores the WHOLE flight
     (closest approach to a moving target, landing quality, danger, walls)
     instead of only the landing point → fleas grab orbs/stars mid-air and
     actually catch (or dodge) other fleas.
   • Target prediction: chasers lead moving fleas by their velocity.
   • Escape planner: fleeing fleas pick the safest reachable platform
     (far from every threat, away from corners) instead of running into walls.
   • Pack logic: infected / IT fleas spread out over different victims.
   • Faster reactions while chasing/fleeing; calmer idle behaviour.
   ===================================================================== */
(function(){
  if(typeof aiLeap!=='function'||typeof Flea==='undefined')return;
  var now=function(){return Date.now();};
  function vel(o){return {vx:(o.vx||0),vy:(o.vy||0)};}
  function lead(o,frames){var v=vel(o);if(o.stuck)return {x:o.cx,y:o.cy};return {x:o.cx+v.vx*frames,y:o.cy+v.vy*frames*.6};}
  function tops(){var out=[];for(var i=3;i<platforms.length;i++){var p=platforms[i];if(!p||p.deco||!p.topPoint)continue;try{var t=p.topPoint();if(t&&isFinite(t.x)&&isFinite(t.y))out.push({x:t.x,y:t.y-12,p:p});}catch(e){}}return out;}
  /* ---------- full-flight simulation ---------- */
  function sim(sx,sy,vx,vy,steps,goal,gv,threats){
    var x=sx,y=sy,minG=1e9,minT=1e9,hitAt=-1;
    for(var i=0;i<steps;i++){
      vx*=0.985;vy+=GRAV;var sp=Math.hypot(vx,vy);if(sp>AI_MAX){vx=vx/sp*AI_MAX;vy=vy/sp*AI_MAX;}
      x+=vx;y+=vy;
      if(goal){var gx=goal.x+(gv?gv.vx*i:0),gy=goal.y+(gv?gv.vy*i*.6:0),dg=Math.hypot(x-gx,y-gy);if(dg<minG){minG=dg;if(dg<30&&hitAt<0)hitAt=i;}}
      if(threats&&(i%4===0))for(var k=0;k<threats.length;k++){var th=threats[k],tx=th.cx+(th.stuck?0:(th.vx||0)*i*.5),ty=th.cy+(th.stuck?0:(th.vy||0)*i*.3),dt=Math.hypot(x-tx,y-ty);if(dt<minT)minT=dt;}
      if(x<10)return {x:10,y:y,landed:false,wall:true,minG:minG,minT:minT,hitAt:hitAt,t:i};
      if(x>WORLD_W-10)return {x:WORLD_W-10,y:y,landed:false,wall:true,minG:minG,minT:minT,hitAt:hitAt,t:i};
      if(y>WORLD_H-60)return {x:x,y:WORLD_H-60,landed:true,onFloor:true,minG:minG,minT:minT,hitAt:hitAt,t:i};
      for(var k2=0;k2<platforms.length;k2++){var p=platforms[k2];if(x<p.bx-6||x>p.bx+p.bw+6||y<p.by-6||y>p.by+p.bh+6)continue;if(p.contains(x,y,4))return {x:x,y:y,landed:true,plat:p,minG:minG,minT:minT,hitAt:hitAt,t:i};}
    }
    return {x:x,y:y,landed:false,minG:minG,minT:minT,hitAt:hitAt,t:steps};
  }
  function threatsFor(f,t){if(t.threats)return t.threats;if(!t.flee)return null;var n=nearestOther(f);return n.flea?[n.flea]:null;}
  var _leap=aiLeap;
  aiLeap=function(f,t){
    try{
      if(!t||!isFinite(t.x)||!isFinite(t.y))return _leap(f,t);
      var dx0=t.x-f.cx,dy0=t.y-f.cy,base=Math.atan2(dy0,dx0),best=null,bs=-1e9,thr=threatsFor(f,t),gv=t.v||null,grab=t.chase||t.grab;
      if(t.flee&&thr&&thr.length){var ax=0,ay=0;thr.forEach(function(o){var d=Math.max(40,Math.hypot(f.cx-o.cx,f.cy-o.cy));ax+=(f.cx-o.cx)/(d*d);ay+=(f.cy-o.cy)/(d*d);});var away=Math.atan2(ay,ax);base=Math.atan2(Math.sin(base)+Math.sin(away)*.8,Math.cos(base)+Math.cos(away)*.8);}
      for(var a=-1.1;a<=1.11;a+=0.2){
        for(var pi=0;pi<5;pi++){var pow=[0.42,0.58,0.74,0.88,1][pi];
          var ang=base+a,spd=AI_LEAP_CAP*pow,vx=Math.cos(ang)*spd,vy=Math.sin(ang)*spd-2.6;
          var r=sim(f.cx,f.cy,vx,vy,120,t.flee?null:{x:t.x,y:t.y},gv,thr);
          var dEnd=Math.hypot(r.x-t.x,r.y-t.y),dFrom=Math.hypot(r.x-f.cx,r.y-f.cy),sc;
          if(t.flee){var dEndT=1e9;(thr||[]).forEach(function(o){var p2=lead(o,30);dEndT=Math.min(dEndT,Math.hypot(r.x-p2.x,r.y-p2.y));});
            sc=Math.min(dEndT,900)*0.9+Math.min(r.minT,600)*0.5-dEnd*0.35+(r.landed?120:-40)+(r.plat?35:0);
            if(r.x<90||r.x>WORLD_W-90)sc-=170;if(r.wall)sc-=120;if(r.minT<45)sc-=400;}
          else if(grab){sc=-r.minG*1.5-dEnd*0.25+(r.hitAt>=0?260-r.hitAt*1.2:0)+(r.landed?40:0);}
          else{sc=-dEnd+(r.landed?140:0)+(r.plat?55:0)+(r.minG<30?160:0);if(t.y<f.cy-20&&r.y<f.cy-10)sc+=45;}
          if(dFrom<30)sc-=140;
          if(t.avoidY!=null&&r.y>t.avoidY-30)sc-=500; /* e.g. lava line */
          if(sc>bs){bs=sc;best={vx:vx,vy:vy};}
        }
      }
      if(!best)return _leap(f,t);
      best.vx+=(Math.random()-.5)*0.25;best.vy+=-0.5;
      f.launch(best.vx,best.vy);f.face=best.vx>0?1:-1;f._lastLeap=now();
      if(Math.random()<0.05)try{maybeSay(f,EVENT_LINES.fling[Math.random()*EVENT_LINES.fling.length|0],1300);}catch(e){}
    }catch(e){return _leap(f,t);}
  };
  /* ---------- escape planner: safest reachable platform ---------- */
  function escape(f,threats){
    if(f._esc&&now()<f._escT)return f._esc;
    var cands=tops(),best=null,bs=-1e9;
    cands.push({x:WORLD_W*.5,y:WORLD_H-90});
    for(var i=0;i<cands.length;i++){var c=cands[i],mt=1e9;
      for(var k=0;k<threats.length;k++){var p=lead(threats[k],40);mt=Math.min(mt,Math.hypot(c.x-p.x,c.y-p.y));}
      var travel=Math.hypot(c.x-f.cx,c.y-f.cy),sc=Math.min(mt,1100)-travel*0.18-(c.x<120||c.x>WORLD_W-120?220:0);
      /* don't run THROUGH the threat */
      for(var k2=0;k2<threats.length;k2++){var o=threats[k2],tx=c.x-f.cx,ty=c.y-f.cy,ox=o.cx-f.cx,oy=o.cy-f.cy,tl=Math.hypot(tx,ty)||1,proj=(tx*ox+ty*oy)/tl;if(proj>0&&proj<tl){var perp=Math.abs(tx*oy-ty*ox)/tl;if(perp<120)sc-=260;}}
      if(sc>bs){bs=sc;best=c;}}
    f._esc={x:best.x,y:best.y,flee:true,threats:threats};f._escT=now()+650+Math.random()*350;return f._esc;}
  /* ---------- pack hunting: spread chasers over different victims ---------- */
  function hunt(f,isPrey,isHunter){
    var prey=fleas.filter(function(o){return o!==f&&isPrey(o);});if(!prey.length)return null;
    var claimed={};fleas.forEach(function(o){if(o!==f&&isHunter(o)&&o._prey)claimed[fleas.indexOf(o._prey)]=(claimed[fleas.indexOf(o._prey)]||0)+1;});
    var best=null,bs=1e9;prey.forEach(function(o){var d=Math.hypot(o.cx-f.cx,o.cy-f.cy),c=d+(claimed[fleas.indexOf(o)]||0)*260+(o.isP?-60:0)+(o===f._prey?-120:0);if(c<bs){bs=c;best=o;}});
    f._prey=best;var dd=Math.hypot(best.cx-f.cx,best.cy-f.cy),p=lead(best,Math.min(40,dd/14));
    return {x:p.x,y:p.y,chase:true,v:best.stuck?null:vel(best)};}
  /* ---------- mode targets ---------- */
  var _target=aiTarget;
  aiTarget=function(f){
    try{
      var xm=XM&&XM();
      if(xm&&xm.ai){var xt=xm.ai(f);if(xt){
        /* sharpen extension modes: freeze tag IT hunts as a pack, others flee smartly */
        if(gameMode==='freeze'){if(f.it){var h=hunt(f,function(o){return !o.it&&!o.iced&&(!o.immune||now()>o.immune);},function(o){return o.it;});if(h)return h;}
          else if(!f.iced){var its=fleas.filter(function(o){return o.it;});var near=its.filter(function(o){return Math.hypot(o.cx-f.cx,o.cy-f.cy)<520;});if(near.length)return escape(f,near);}}
        if(gameMode==='stars'&&xt&&!xt.flee)xt.grab=true;
        return xt;}}
      if(gameMode==='tag'&&tagSeeded){
        if(f.infected){var h2=hunt(f,function(o){return !o.infected;},function(o){return o.infected;});if(h2)return h2;}
        else{var inf=fleas.filter(function(o){return o.infected&&Math.hypot(o.cx-f.cx,o.cy-f.cy)<620;});if(inf.length)return escape(f,inf);}
      }
      if(gameMode==='survival'&&orbHolder){
        if(f===orbHolder){var h3=hunt(f,function(o){return o!==f&&!o.dead&&!o.eliminated;},function(){return false;});if(h3)return h3;}
        else if(Math.hypot(orbHolder.cx-f.cx,orbHolder.cy-f.cy)<700)return escape(f,[orbHolder]);
        else return wanderTarget(f);
      }
      if(gameMode==='classic'){
        if(f.hasOrb){var ch=fleas.filter(function(o){return o!==f&&Math.hypot(o.cx-f.cx,o.cy-f.cy)<560;});if(ch.length)return escape(f,ch);return {x:f.cx,y:f.cy};}
        var holder=fleas.filter(function(o){return o.hasOrb;})[0];
        if(holder&&holder!==f){var dd=Math.hypot(holder.cx-f.cx,holder.cy-f.cy),p=lead(holder,Math.min(40,dd/14));return {x:p.x,y:p.y,chase:true,v:holder.stuck?null:vel(holder)};}
        if(orb){var dd2=Math.hypot(orb.x-f.cx,orb.y-f.cy);if(dd2<520)return {x:orb.x,y:orb.y,grab:true,v:{vx:orb.vx||0,vy:orb.vy||0}};}
      }
      if(gameMode==='race'&&orb){var t0=_target(f);if(Math.hypot(orb.x-f.cx,orb.y-f.cy)<300){t0.grab=true;}return t0;}
    }catch(e){}
    return _target(f);
  };
  /* ---------- quicker reactions ---------- */
  var _upd=Flea.prototype.aiUpdate;
  Flea.prototype.aiUpdate=function(dt){
    var before=this.ait;_upd.call(this,dt);
    if(this.isP||gameMode==='zen'||STATE!=='play')return;
    if(this.ait>before){ /* a new decision timer was just set */
      var t=this._lastT||{};var cap=(t.flee||t.chase||t.grab)?(12+Math.random()*10|0):(22+Math.random()*14|0);
      if(this.ait>cap)this.ait=cap;}
  };
  /* remember last target for cadence decisions */
  var _t2=aiTarget;aiTarget=function(f){var t=_t2(f);f._lastT=t;return t;};
  window.FreaSmartAI={version:1};
})();
