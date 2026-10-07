/* ===================== UNSTICK — no more wedged fleas =====================
   1. Clean launches: when a flea leaps, the surfaces it is touching at take-off are ignored
      for a moment (only while moving AWAY from them) so it can't instantly re-stick to the
      neighbouring platform / object it was squeezed against.
   2. Embedded rescue: any flea that ends up INSIDE a platform or object (spawned there,
      a moving platform / zen object pushed into it, round-start overlap) is popped out to
      the nearest free spot (searching upward first) and drops onto a surface.
   3. Round start settle: right after every round/match starts all fleas are checked.
   4. CPU awareness: CPU fleas that make no progress pick the most open escape direction
      (ray-tested, prefers up and toward their goal) and leap out; after repeated fails they
      hop to a free spot. */
var FreaUnstick=(function(){
  var SKIP_CPU={zen:1,hns:1,cards:1,flappy:1,tutorial:1,hoops:1,copycat:1};
  var stats={rescued:0,escapes:0,ignored:0};
  function now(){return Date.now();}
  function solid(p){return p&&!p._heldBy&&!(p.deco&&p.carriedBy)&&!p.gone&&!p.noCollide&&p.ptype!=='lava'&&p.ptype!=='pool'&&!p._hnsHider&&!(p.deco&&p.kind==='circle'&&p.r<16);}
  /* does point (x,y) sit inside platform p (with inset m for rects) */
  function ptIn(p,x,y){if(p.kind==='rect')return x>p.x&&x<p.x+p.w&&y>p.y&&y<p.y+p.h;if(p.kind==='circle')return Math.hypot(x-p.x,y-p.y)<p.r;if(x<p.bx||x>p.bx+p.bw||y<p.by||y>p.by+p.bh)return false;try{return pointInPoly(x,y,p.pts);}catch(e){return false;}}
  /* how many of the flea's 9 sample points are inside p (inset keeps touching != overlapping) */
  function hits(p,x,y,w,h,inset){var i=inset,xs=[x+i,x+w/2,x+w-i],ys=[y+i,y+h/2,y+h-i],n=0;if(x+w<p.bx-1||x>p.bx+p.bw+1||y+h<p.by-1||y>p.by+p.bh+1)return 0;for(var a=0;a<3;a++)for(var b=0;b<3;b++)if(ptIn(p,xs[a],ys[b]))n++;return n;}
  function freeAt(x,y,w,h,ign){if(x<6||y<6||x+w>WORLD_W-6||y+h>WORLD_H-6)return false;for(var i=0;i<platforms.length;i++){var p=platforms[i];if(p===ign||!solid(p))continue;if(hits(p,x,y,w,h,1))return false;}return true;}
  function embedded(f){var worst=0;for(var i=0;i<platforms.length;i++){var p=platforms[i];if(!solid(p))continue;var n=hits(p,f.x,f.y,f.w,f.h,Math.min(7,f.w*.22));if(n>worst)worst=n;}return worst;}
  function excused(f){if(!f||f.hidden||f.isBall||f._disguised||f._objProp||f._objType||f._mn||f._zenSeat||f.carriedBy||f._heldBy||f.frozen>now())return true;if(gameMode==='zen'&&f.action)return true;if(gameMode==='cards')return true;if(STATE!=='play'&&STATE!=='countdown')return true;return false;}
  function findFree(f){var w=f.w,h=f.h,ox=f.x,oy=f.y;var dirs=[[0,-1],[-.7,-.7],[.7,-.7],[-1,0],[1,0],[-.7,.7],[.7,.7],[0,1]];
    for(var r=8;r<=420;r+=10){for(var d=0;d<dirs.length;d++){var x=ox+dirs[d][0]*r,y=oy+dirs[d][1]*r;if(freeAt(x,y,w,h))return {x:x,y:y};}}
    return null;}
  function rescue(f,why){var s=findFree(f);if(!s)return false;f.x=s.x;f.y=s.y;f.vx=0;f.vy=.6;f.stuck=false;f.platform=null;f.onG=false;f.angle=0;f._embedN=0;stats.rescued++;
    try{jpfx(f.cx,f.cy,f.col||'#fff');}catch(e){}f.lastStuckPos={x:f.x,y:f.y,t:now()};return true;}

  /* ---- 1. clean launches ---- */
  var _launch=Flea.prototype.launch;
  Flea.prototype.launch=function(vx,vy){var touch=[];try{for(var i=0;i<platforms.length;i++){var p=platforms[i];if(!solid(p))continue;if(this.x+this.w+4>p.bx&&this.x-4<p.bx+p.bw&&this.y+this.h+4>p.by&&this.y-4<p.by+p.bh)touch.push(p);}}catch(e){}
    var r=_launch.apply(this,arguments);this._lt=now();this._ltouch=touch;this._lmoved=0;return r;};
  var _col=Platform.prototype.collide;
  Platform.prototype.collide=function(f){
    if(f&&f._ltouch&&f._ltouch.length&&now()-f._lt<140&&f._ltouch.indexOf(this)>=0){
      var fcx=f.x+f.w/2,fcy=f.y+f.h/2,nx,ny;
      if(this.kind==='rect'){var px=Math.max(this.x,Math.min(this.x+this.w,fcx)),py=Math.max(this.y,Math.min(this.y+this.h,fcy));nx=fcx-px;ny=fcy-py;if(Math.abs(nx)+Math.abs(ny)<.5){nx=fcx-(this.x+this.w/2);ny=fcy-(this.y+this.h/2);}}
      else{nx=fcx-this.cenx;ny=fcy-this.ceny;}
      if((f.vx||0)*nx+(f.vy||0)*ny>0){stats.ignored++;return false;}}
    return _col.call(this,f);};

  /* ---- 2/4. watchdog ---- */
  function escape(f){var best=null,bs=-1e9,t=null;try{t=aiTarget(f);}catch(e){}var w=f.w,h=f.h;
    for(var k=0;k<24;k++){var a=k/24*Math.PI*2,dx=Math.cos(a),dy=Math.sin(a),free=0;
      for(var s=1;s<=10;s++){var x=f.x+dx*s*12,y=f.y+dy*s*12;if(!freeAt(x,y,w,h))break;free=s;}
      if(free<3)continue;var sc=free*10-dy*30;if(t){var tx=t.x-f.cx,ty=t.y-f.cy,tl=Math.hypot(tx,ty)||1;sc+=((tx/tl)*dx+(ty/tl)*dy)*25;}sc+=Math.random()*8;
      if(sc>bs){bs=sc;best={dx:dx,dy:dy,free:free};}}
    if(!best)return false;var sp=8+best.free*.5;f.launch(best.dx*sp,best.dy*sp-3.5);f.face=best.dx>=0?1:-1;stats.escapes++;return true;}
  function watch(){if(typeof fleas==='undefined'||!fleas||(STATE!=='play'&&STATE!=='countdown'))return;var t=now();
    for(var i=0;i<fleas.length;i++){var f=fleas[i];if(excused(f))continue;
      /* embedded: must persist across 2 checks (avoid false alarms mid-collision) */
      if(embedded(f)>=4){f._embedN=(f._embedN||0)+1;if(f._embedN>=2){rescue(f,'embedded');continue;}}else f._embedN=0;
      if(f.isP||STATE!=='play'||SKIP_CPU[gameMode])continue;
      try{if(XM()&&XM().aiHold&&XM().aiHold(f))continue;}catch(e){}
      if(f.action)continue;
      var lp=f._uw||(f._uw={x:f.x,y:f.y,t:t,n:0});if(Math.hypot(f.x-lp.x,f.y-lp.y)>16){f._uw={x:f.x,y:f.y,t:t,n:0};continue;}
      if(!f.stuck)continue;
      if(t-lp.t>2600){lp.n++;lp.t=t;if(lp.n>=3){rescue(f,'stall');lp.n=0;}else escape(f);}}}
  setInterval(function(){try{watch();}catch(e){}},240);

  /* ---- 3. settle every flea right after a round starts ---- */
  function settle(){if(typeof fleas==='undefined')return;for(var i=0;i<fleas.length;i++){var f=fleas[i];if(excused(f))continue;f._uw=null;if(embedded(f)>=3)rescue(f,'start');}}
  if(typeof startGame==='function'){var _sg=startGame;startGame=function(){var r=_sg.apply(this,arguments);setTimeout(settle,60);setTimeout(settle,500);setTimeout(settle,1500);return r;};}

  return {stats:function(){return stats;},embedded:function(f){return embedded(f||player);},free:freeAt,rescue:function(f){return rescue(f||player,'manual');},settle:settle};
})();
window.FreaUnstick=FreaUnstick;
