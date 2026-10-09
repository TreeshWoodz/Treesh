/* =====================================================================
   ARENAS — layered "neon-cozy" parallax environments
   • Every arcade mode gets ONE hand-themed arena (sky, parallax layers,
     particles, matching platform palette + floor material).
   • Zen mode gets a pickable set of redesigned scenes (+2 brand-new ones:
     Sakura Garden & Cloud Kingdom). Legacy Neon / Deep Space / Cozy Home
     keep their original renderer.
   Layers are painted ONCE into seamless offscreen strips and then blitted
   with parallax, so the cost per frame is a handful of drawImage calls.
   ===================================================================== */
var Arenas=(function(){
  var TW=1600;               /* strip tile width (seamless wrap) */
  var cache={};              /* strip / sprite cache */
  /* ---------- colour helpers ---------- */
  function h2r(h){h=String(h).replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');var n=parseInt(h,16);return [n>>16&255,n>>8&255,n&255];}
  function rgba(h,a){var c=h2r(h);return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';}
  function mix(a,b,t){var x=h2r(a),y=h2r(b);return 'rgb('+Math.round(x[0]+(y[0]-x[0])*t)+','+Math.round(x[1]+(y[1]-x[1])*t)+','+Math.round(x[2]+(y[2]-x[2])*t)+')';}
  function tint(h,t){return t>0?mix(h,'#ffffff',t):mix(h,'#000000',-t);}
  function rng(seed){var s=(seed*2654435761)>>>0||7;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
  function pick(R,a){return a[(R()*a.length)|0];}
  function fr(x){return x-Math.floor(x);}
  function mk(w,h){var c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c;}

  /* =================== LAYER PAINTERS (baseline = bottom of strip) =================== */
  var P={};
  function vgrad(c,y0,y1,a,b){var g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
  /* low-poly mountains with facets, rim light, optional snowcaps */
  P.mountains=function(c,L,R,w,h){
    var N=L.n||7,PK=[],VL=[],i;
    for(i=0;i<N;i++)PK.push({x:(i+.5+(R()-.5)*.55)*w/N,y:h-h*((L.lo||.5)+R()*((L.hi||1)-(L.lo||.5)))});
    for(i=0;i<N;i++){var a=PK[i],b=i<N-1?PK[i+1]:{x:PK[0].x+w,y:PK[0].y};VL.push({x:a.x+(b.x-a.x)*(.35+R()*.3),y:Math.max(a.y,b.y)+(h-Math.max(a.y,b.y))*(.25+R()*.35)});}
    function ridge(o){c.moveTo(o+PK[0].x,h);for(var k=0;k<N;k++){c.lineTo(o+PK[k].x,PK[k].y);c.lineTo(o+VL[k].x,VL[k].y);}c.lineTo(o+PK[0].x+w,PK[0].y);c.lineTo(o+PK[0].x+w,h);c.closePath();}
    var top=Math.min.apply(null,PK.map(function(p){return p.y;}));
    c.fillStyle=vgrad(c,top,h,L.top||tint(L.col,.18),L.col);
    [-w,0].forEach(function(o){c.beginPath();ridge(o);c.fill();});
    /* shadow facets (right side of every peak) */
    c.fillStyle='rgba(0,0,0,'+(L.facet||.2)+')';
    [-w,0,w].forEach(function(o){for(var k=0;k<N;k++){var p=PK[k],v=VL[k];c.beginPath();c.moveTo(o+p.x,p.y);c.lineTo(o+v.x,v.y);c.lineTo(o+p.x+(v.x-p.x)*.25,h);c.lineTo(o+p.x,h);c.closePath();c.fill();}});
    if(L.snow){c.fillStyle=L.snow;[-w,0,w].forEach(function(o){for(var k=0;k<N;k++){var p=PK[k],v=VL[k],pv=VL[(k-1+N)%N],pvx=k===0?pv.x-w:pv.x,d=.22+R()*.08;
      var lx=p.x+(pvx-p.x)*d,ly=p.y+(pv.y-p.y)*d,rx=p.x+(v.x-p.x)*d,ry=p.y+(v.y-p.y)*d;
      c.beginPath();c.moveTo(o+p.x,p.y);c.lineTo(o+rx,ry);c.lineTo(o+(p.x+rx)/2+3,(p.y+ry)/2+10);c.lineTo(o+p.x,ry-2);c.lineTo(o+(p.x+lx)/2-2,(p.y+ly)/2+12);c.lineTo(o+lx,ly);c.closePath();c.fill();}});}
    if(L.rim){c.strokeStyle=rgba(L.rim,L.rimA||.55);c.lineWidth=2;c.lineJoin='round';[-w,0].forEach(function(o){c.beginPath();c.moveTo(o+PK[0].x,PK[0].y);for(var k=0;k<N;k++){c.lineTo(o+PK[k].x,PK[k].y);c.lineTo(o+VL[k].x,VL[k].y);}c.lineTo(o+PK[0].x+w,PK[0].y);c.stroke();});}
  };
  /* smooth rolling hills (periodic sine sum) + optional flowers / grass */
  P.hills=function(c,L,R,w,h){
    var ks=[1+((R()*2)|0),3+((R()*2)|0),6+((R()*3)|0)],am=[.5,.3,.12],ph=ks.map(function(){return R()*6.283;});
    function y(x){var s=0;for(var i=0;i<3;i++)s+=am[i]*Math.sin(6.283*ks[i]*x/w+ph[i]);return h-(h*(L.base||.5)+s*h*(L.amp||.32));}
    c.beginPath();c.moveTo(0,h);for(var x=0;x<=w;x+=8)c.lineTo(x,y(x));c.lineTo(w,h);c.closePath();
    c.fillStyle=vgrad(c,h*(1-(L.base||.5)-(L.amp||.32)),h,L.top||tint(L.col,.2),L.col);c.fill();
    if(L.rim){c.save();c.strokeStyle=rgba(L.rim,.12);c.lineWidth=12;c.beginPath();for(x=0;x<=w;x+=8)c.lineTo(x,y(x)+6);c.stroke();c.strokeStyle=rgba(L.rim,L.rimA||.6);c.lineWidth=2.4;c.beginPath();for(x=0;x<=w;x+=8)c.lineTo(x,y(x)+1);c.stroke();c.restore();}
    if(L.ripples){c.strokeStyle=rgba(L.ripples,.18);c.lineWidth=1.5;for(var r=0;r<26;r++){var rx=R()*w,ry=y(rx)+10+R()*h*.3;c.beginPath();c.moveTo(rx-30,ry);c.quadraticCurveTo(rx,ry-6,rx+30,ry);c.stroke();}}
    if(L.dots){for(var d=0;d<(L.dotN||60);d++){var dx=R()*w,dy=y(dx)+4+R()*14;c.fillStyle=pick(R,L.dots);c.beginPath();c.arc(dx,dy,1.6+R()*2.2,0,7);c.fill();}}
    if(L.grass){c.strokeStyle=L.grass;c.lineWidth=2;c.lineCap='round';for(var g=0;g<140;g++){var gx=R()*w,gy=y(gx)+2;c.beginPath();c.moveTo(gx,gy);c.lineTo(gx-3+R()*2,gy-5-R()*6);c.moveTo(gx+2,gy);c.lineTo(gx+4+R()*2,gy-4-R()*5);c.stroke();}}
  };
  /* city skyline with windows, antennas, water tanks, neon signs */
  P.city=function(c,L,R,w,h){
    var x=0;while(x<w){var bw=Math.min(w-x,(L.bw0||40)+R()*(L.bw1||80));if(w-x-bw<34)bw=w-x;var bh=h*((L.lo||.35)+R()*((L.hi||.95)-(L.lo||.35))),by=h-bh;
      c.fillStyle=vgrad(c,by,h,tint(L.col,.1),L.col);c.fillRect(x,by,bw-2,bh);
      if(R()<.35){c.fillRect(x+bw*.2,by-10,bw*.5,10);by-=10;}
      c.fillStyle=rgba(L.rim||'#ffffff',.14);c.fillRect(x,by,bw-2,2);
      var cols=Math.max(1,Math.floor((bw-10)/(L.ww||11))),rows=Math.floor((bh-14)/(L.wh||14));
      for(var r=0;r<rows;r++)for(var k=0;k<cols;k++){if(R()<(L.lit||.34)){c.fillStyle=pick(R,L.win||['#ffd27a']);c.globalAlpha=.55+R()*.45;c.fillRect(x+6+k*(L.ww||11),by+10+r*(L.wh||14),5,7);c.globalAlpha=1;}}
      if(R()<.3){c.strokeStyle=L.col;c.lineWidth=2;c.beginPath();c.moveTo(x+bw*.5,by);c.lineTo(x+bw*.5,by-18-R()*20);c.stroke();c.fillStyle=L.beacon||'#ff5a7a';c.beginPath();c.arc(x+bw*.5,by-20-R()*16,2.4,0,7);c.fill();}
      if(L.neon&&R()<.28&&bh>h*.4){var nc=pick(R,L.neon),sx=x+bw*.25,sy=by+18;c.save();c.shadowColor=nc;c.shadowBlur=14;c.strokeStyle=nc;c.lineWidth=3;c.beginPath();c.roundRect(sx,sy,Math.max(10,bw*.45),22+R()*30,5);c.stroke();c.fillStyle=rgba(nc.charAt(0)==='#'?nc:'#ffffff',.25);c.fill();c.restore();}
      x+=bw;}
  };
  function blob(c,x,y,r,col,top,shade){var g=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);g.addColorStop(0,top);g.addColorStop(.6,col);g.addColorStop(1,shade);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}
  function wrapEach(w,n,R,fn){var items=[];for(var i=0;i<n;i++)items.push({x:R()*w,s:R(),t:R(),u:R()});items.sort(function(a,b){return a.s-b.s;});items.forEach(function(it){[-w,0,w].forEach(function(o){fn(it.x+o,it);});});}
  /* puffy round-canopy trees */
  P.trees=function(c,L,R,w,h){var col=L.col,top=L.top||tint(col,.35),sh=tint(col,-.35);
    wrapEach(w,L.n||Math.round(w/70),R,function(x,it){var th=h*((L.lo||.45)+it.s*((L.hi||.9)-(L.lo||.45))),r=th*.28;
      c.fillStyle=L.trunk||tint(col,-.5);c.beginPath();c.roundRect(x-r*.14,h-th*.55,r*.28,th*.55,3);c.fill();
      var cy=h-th+r;blob(c,x-r*.6,cy+r*.35,r*.72,col,top,sh);blob(c,x+r*.6,cy+r*.35,r*.72,col,top,sh);blob(c,x,cy,r,col,top,sh);
      if(L.fruit&&it.t<.5){c.fillStyle=L.fruit;for(var f=0;f<4;f++){c.beginPath();c.arc(x+(it.u-.5)*r*1.4+f*6-9,cy+r*.2+(f%2)*8,2.6,0,7);c.fill();}}
      if(L.vines){c.strokeStyle=L.vines;c.lineWidth=2;for(var v=0;v<4;v++){var vx=x-r*.8+v*r*.5;c.beginPath();c.moveTo(vx,cy+r*.4);c.quadraticCurveTo(vx+4,cy+r*.9,vx-2,cy+r*(1.1+it.u*.6));c.stroke();}}});};
  /* stacked pine trees (optional snow) */
  P.pines=function(c,L,R,w,h){var col=L.col;
    wrapEach(w,L.n||Math.round(w/46),R,function(x,it){var th=h*((L.lo||.4)+it.s*((L.hi||.95)-(L.lo||.4))),bw=th*.42;
      c.fillStyle=L.trunk||tint(col,-.4);c.fillRect(x-3,h-th*.18,6,th*.18);
      for(var t=0;t<3;t++){var ty=h-th*.15-t*th*.27,tw=bw*(1-t*.24),tt=ty-th*.42;c.fillStyle=vgrad(c,tt,ty,tint(col,.18+t*.05),tint(col,-.12));c.beginPath();c.moveTo(x,tt);c.lineTo(x+tw/2,ty);c.lineTo(x-tw/2,ty);c.closePath();c.fill();
        c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.moveTo(x,tt);c.lineTo(x+tw/2,ty);c.lineTo(x+tw*.1,ty);c.closePath();c.fill();
        if(L.snow){c.fillStyle=L.snow;c.beginPath();c.moveTo(x,tt);c.lineTo(x+tw*.18,tt+th*.12);c.lineTo(x+tw*.05,tt+th*.1);c.lineTo(x-tw*.06,tt+th*.13);c.lineTo(x-tw*.18,tt+th*.11);c.closePath();c.fill();}}});};
  /* glossy crystal clusters */
  P.crystals=function(c,L,R,w,h){
    wrapEach(w,L.n||Math.round(w/120),R,function(x,it){var n=3+((it.t*3)|0),base=h*((L.lo||.25)+it.s*((L.hi||.7)-(L.lo||.25)));var col=L.cols[(it.u*L.cols.length)|0];
      for(var i=0;i<n;i++){var off=(i-(n-1)/2)*base*.16,sh=base*(i===((n/2)|0)?1:.45+((i*37+it.u*100)%50)/100),sw=base*.18,lean=off*.35;
        c.save();c.shadowColor=col;c.shadowBlur=L.glow||16;
        var g=c.createLinearGradient(x+off-sw/2,0,x+off+sw/2,0);g.addColorStop(0,tint(col,.55));g.addColorStop(.5,col);g.addColorStop(1,tint(col,-.35));c.fillStyle=g;
        c.beginPath();c.moveTo(x+off-sw/2,h);c.lineTo(x+off-sw/2,h-sh*.78);c.lineTo(x+off+lean,h-sh);c.lineTo(x+off+sw/2,h-sh*.78);c.lineTo(x+off+sw/2,h);c.closePath();c.fill();c.restore();
        c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1.4;c.beginPath();c.moveTo(x+off+lean,h-sh);c.lineTo(x+off-sw*.08,h);c.stroke();
        c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.moveTo(x+off-sw*.38,h-sh*.7);c.lineTo(x+off-sw*.2,h-sh*.74);c.lineTo(x+off-sw*.2,h-sh*.2);c.lineTo(x+off-sw*.38,h-sh*.16);c.closePath();c.fill();}});};
  /* fairy-tale castle silhouette with lit windows */
  P.castle=function(c,L,R,w,h){var col=L.col,roof=L.roof||tint(col,.15),win=L.win||'#ffd27a';
    function tower(x,tw,th,cone){c.fillStyle=vgrad(c,h-th,h,tint(col,.12),col);c.fillRect(x-tw/2,h-th,tw,th);
      if(cone){c.fillStyle=roof;c.beginPath();c.moveTo(x-tw/2-5,h-th);c.lineTo(x,h-th-tw*1.3);c.lineTo(x+tw/2+5,h-th);c.closePath();c.fill();c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.moveTo(x,h-th-tw*1.3);c.lineTo(x,h-th-tw*1.3-14);c.stroke();c.fillStyle=L.flag||'#ff3db5';c.beginPath();c.moveTo(x,h-th-tw*1.3-14);c.lineTo(x+12,h-th-tw*1.3-10);c.lineTo(x,h-th-tw*1.3-6);c.fill();}
      else{c.fillStyle=col;for(var b=0;b<tw;b+=10)c.fillRect(x-tw/2+b,h-th-7,6,7);}
      c.save();c.shadowColor=win;c.shadowBlur=10;c.fillStyle=win;for(var r=0;r<Math.floor(th/40);r++){if(R()<.7){c.beginPath();c.roundRect(x-3,h-th+18+r*40,6,11,[3,3,0,0]);c.fill();}}c.restore();}
    [w*.5,w*.08].forEach(function(cx,idx){var s=idx?0.6:1;c.fillStyle=col;c.fillRect(cx-150*s,h-h*.42*s,300*s,h*.42*s);for(var b=0;b<300*s;b+=14)c.fillRect(cx-150*s+b,h-h*.42*s-8,8,8);
      tower(cx-150*s,46*s,h*.62*s,true);tower(cx+150*s,46*s,h*.62*s,true);tower(cx-62*s,40*s,h*.78*s,true);tower(cx+62*s,40*s,h*.72*s,true);tower(cx,58*s,h*.95*s,true);
      c.fillStyle=tint(col,-.4);c.beginPath();c.roundRect(cx-18*s,h-44*s,36*s,44*s,[18*s,18*s,0,0]);c.fill();});};
  /* volcanoes with glowing craters + lava streaks */
  P.volcano=function(c,L,R,w,h){P.hills(c,{col:tint(L.col,-.2),base:.18,amp:.12},R,w,h);
    [[w*.3,1],[w*.78,.66]].forEach(function(v){var x=v[0],s=v[1],vh=h*.95*s,tw=34*s,bw=w*.2*s;
      c.fillStyle=vgrad(c,h-vh,h,tint(L.col,.12),L.col);c.beginPath();c.moveTo(x-bw,h);c.lineTo(x-tw,h-vh);c.quadraticCurveTo(x,h-vh+10,x+tw,h-vh);c.lineTo(x+bw,h);c.closePath();c.fill();
      c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.moveTo(x+tw,h-vh);c.lineTo(x+bw,h);c.lineTo(x+bw*.3,h);c.closePath();c.fill();
      c.save();c.shadowColor=L.glow;c.shadowBlur=30;c.fillStyle=L.glow;c.beginPath();c.ellipse(x,h-vh+2,tw*.95,7*s,0,0,7);c.fill();
      c.strokeStyle=L.glow;c.lineCap='round';for(var k=0;k<4;k++){c.lineWidth=(4-k*.6)*s;c.globalAlpha=.85-k*.12;var sx=x-tw*.6+k*tw*.4;c.beginPath();c.moveTo(sx,h-vh+4);c.bezierCurveTo(sx+(k-1.5)*14,h-vh*.7,sx+(k-1.5)*30,h-vh*.4,sx+(k-1.5)*42*s,h-vh*(.15+k*.05));c.stroke();}c.restore();});};
  /* glowing swamp mushrooms */
  P.mushrooms=function(c,L,R,w,h){
    wrapEach(w,L.n||Math.round(w/60),R,function(x,it){var mh=h*((L.lo||.25)+it.s*((L.hi||.8)-(L.lo||.25))),cw=mh*.55,col=L.cols[(it.u*L.cols.length)|0],bend=(it.t-.5)*18;
      c.strokeStyle=L.stem||'#d8e8d0';c.lineWidth=Math.max(4,cw*.18);c.lineCap='round';c.beginPath();c.moveTo(x,h);c.quadraticCurveTo(x+bend,h-mh*.5,x+bend*.4,h-mh*.86);c.stroke();
      c.save();c.shadowColor=col;c.shadowBlur=22;var g=c.createLinearGradient(0,h-mh-cw*.4,0,h-mh*.8);g.addColorStop(0,tint(col,.45));g.addColorStop(1,tint(col,-.2));c.fillStyle=g;
      c.beginPath();c.ellipse(x+bend*.4,h-mh*.84,cw/2,cw*.36,0,Math.PI,0);c.closePath();c.fill();c.restore();
      c.fillStyle='rgba(255,255,255,.75)';for(var s=0;s<4;s++){c.beginPath();c.arc(x+bend*.4-cw*.28+s*cw*.18,h-mh*.84-cw*(.1+(s%2)*.12),1.6+cw*.03,0,7);c.fill();}});};
  /* candy: lollipops, candy canes, gumdrops */
  P.candy=function(c,L,R,w,h){var cols=L.cols;
    wrapEach(w,L.n||Math.round(w/80),R,function(x,it){var k=it.t,sz=h*((L.lo||.35)+it.s*((L.hi||.9)-(L.lo||.35)));
      if(k<.45){var r=sz*.2,cx=x,cy=h-sz+r;c.strokeStyle='#fff6f0';c.lineWidth=Math.max(4,r*.18);c.beginPath();c.moveTo(cx,cy);c.lineTo(cx,h);c.stroke();
        var col=cols[(it.u*cols.length)|0];blob(c,cx,cy,r,col,tint(col,.5),tint(col,-.25));c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=r*.16;c.beginPath();for(var a=0;a<12;a+=.2){var rr=r*.85*(a/12);c.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}c.stroke();}
      else if(k<.72){var ch=sz*.8,cw=ch*.2;c.lineCap='round';c.lineWidth=Math.max(6,cw*.55);c.strokeStyle='#fff6f0';c.beginPath();c.moveTo(x,h);c.lineTo(x,h-ch+cw);c.arc(x+cw,h-ch+cw,cw,Math.PI,0);c.stroke();c.setLineDash([7,7]);c.strokeStyle=L.stripe||'#ff4d7a';c.stroke();c.setLineDash([]);}
      else{var gr=sz*.26,gc=cols[((it.u*7)|0)%cols.length];c.fillStyle=vgrad(c,h-gr*1.3,h,tint(gc,.35),tint(gc,-.15));c.beginPath();c.moveTo(x-gr,h);c.quadraticCurveTo(x-gr,h-gr*1.4,x,h-gr*1.4);c.quadraticCurveTo(x+gr,h-gr*1.4,x+gr,h);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.6)';for(var s=0;s<7;s++){c.beginPath();c.arc(x-gr*.6+((s*29)%10)/10*gr*1.2,h-gr*.3-((s*17)%10)/10*gr*.9,1.6,0,7);c.fill();}c.fillStyle='rgba(255,255,255,.45)';c.beginPath();c.ellipse(x-gr*.35,h-gr*.95,gr*.18,gr*.28,-.5,0,7);c.fill();}});};
  /* coral reef: seaweed, branch coral, rocks */
  P.coral=function(c,L,R,w,h){var cols=L.cols;
    wrapEach(w,L.n||Math.round(w/55),R,function(x,it){var sz=h*((L.lo||.3)+it.s*((L.hi||.9)-(L.lo||.3)));
      if(it.t<.4){c.strokeStyle=it.u<.5?'#1faa7a':'#12806a';c.lineCap='round';for(var s=0;s<3;s++){c.lineWidth=5-s;c.beginPath();c.moveTo(x+s*6,h);c.bezierCurveTo(x+s*6+14,h-sz*.3,x+s*6-14,h-sz*.6,x+s*6+6,h-sz*(.8+s*.07));c.stroke();}}
      else if(it.t<.75){var col=cols[(it.u*cols.length)|0];c.strokeStyle=col;c.lineCap='round';(function br(bx,by,a,len,d){if(d>4||len<5)return;var ex=bx+Math.cos(a)*len,ey=by+Math.sin(a)*len;c.lineWidth=Math.max(2,7-d*1.4);c.beginPath();c.moveTo(bx,by);c.lineTo(ex,ey);c.stroke();br(ex,ey,a-.45-R()*.2,len*.72,d+1);br(ex,ey,a+.45+R()*.2,len*.72,d+1);})(x,h,-Math.PI/2,sz*.34,0);}
      else{var col2=cols[((it.u*5)|0)%cols.length];blob(c,x,h-sz*.12,sz*.22,tint(col2,-.1),tint(col2,.4),tint(col2,-.4));c.strokeStyle='rgba(0,0,0,.2)';c.lineWidth=1.5;for(var q=0;q<3;q++){c.beginPath();c.arc(x,h-sz*.12,sz*(.06+q*.05),Math.PI*1.1,Math.PI*1.9);c.stroke();}}});};
  /* sakura trees */
  P.sakura=function(c,L,R,w,h){
    wrapEach(w,L.n||Math.round(w/150),R,function(x,it){var th=h*((L.lo||.55)+it.s*((L.hi||.95)-(L.lo||.55)));
      c.strokeStyle=L.trunk||'#4a2a34';c.lineCap='round';(function br(bx,by,a,len,d){if(d>3)return;var ex=bx+Math.cos(a)*len,ey=by+Math.sin(a)*len;c.lineWidth=Math.max(2,10-d*2.6);c.beginPath();c.moveTo(bx,by);c.lineTo(ex,ey);c.stroke();br(ex,ey,a-.5,len*.7,d+1);br(ex,ey,a+.45,len*.66,d+1);})(x,h,-Math.PI/2+(it.t-.5)*.3,th*.34,0);
      var cy=h-th*.72;for(var b=0;b<26;b++){var ang=R()*6.283,rad=R()*th*.3,bx=x+Math.cos(ang)*rad*1.3,by=cy+Math.sin(ang)*rad*.75;blob(c,bx,by,th*.07+R()*th*.06,pick(R,L.cols),'#fff0f6',tint(L.cols[0],-.25));}});};
  /* palm trees */
  P.palms=function(c,L,R,w,h){
    wrapEach(w,L.n||Math.round(w/200),R,function(x,it){var th=h*((L.lo||.6)+it.s*((L.hi||1)-(L.lo||.6))),lean=(it.t-.5)*th*.5,tx=x+lean,ty=h-th;
      c.strokeStyle=L.trunk||'#6a4a2a';c.lineCap='round';c.lineWidth=9;c.beginPath();c.moveTo(x,h);c.quadraticCurveTo(x+lean*.2,h-th*.5,tx,ty);c.stroke();
      c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=2;for(var s=1;s<9;s++){var q=s/9,sx=(1-q)*(1-q)*x+2*(1-q)*q*(x+lean*.2)+q*q*tx,sy=(1-q)*(1-q)*h+2*(1-q)*q*(h-th*.5)+q*q*ty;c.beginPath();c.moveTo(sx-4,sy);c.lineTo(sx+4,sy-1);c.stroke();}
      for(var f=0;f<7;f++){var a=-Math.PI+f*(Math.PI/6)+(it.u-.5)*.3,len=th*.38;var ex=tx+Math.cos(a)*len,ey=ty+Math.sin(a)*len*.55+len*.25;c.fillStyle=f%2?L.col:tint(L.col,.18);c.beginPath();c.moveTo(tx,ty);c.quadraticCurveTo((tx+ex)/2,ty-len*.3+(Math.abs(Math.cos(a))*len*.1),ex,ey);c.quadraticCurveTo((tx+ex)/2,ty-len*.05,tx,ty);c.fill();}
      c.fillStyle='#5a3a1a';c.beginPath();c.arc(tx-4,ty+5,4,0,7);c.arc(tx+4,ty+6,4,0,7);c.fill();});};
  /* saguaro cactus */
  P.cactus=function(c,L,R,w,h){
    wrapEach(w,L.n||Math.round(w/180),R,function(x,it){var th=h*((L.lo||.4)+it.s*((L.hi||.9)-(L.lo||.4))),tw=Math.max(10,th*.14),col=L.col;
      function arm(ax,ay,dir,len){c.fillStyle=col;c.beginPath();c.roundRect(Math.min(ax,ax+dir*tw*1.2),ay-tw*.35,tw*1.2,tw*.7,tw*.35);c.fill();c.beginPath();c.roundRect(ax+dir*tw*1.2-(dir>0?tw*.7:0),ay-len,tw*.7,len,tw*.35);c.fill();}
      if(it.t>.3)arm(x+tw*.5,h-th*.5,1,th*.3);if(it.u>.35)arm(x-tw*.5,h-th*.42,-1,th*.22);
      c.fillStyle=vgrad(c,h-th,h,tint(col,.15),col);c.beginPath();c.roundRect(x-tw/2,h-th,tw,th,[tw/2,tw/2,0,0]);c.fill();
      c.strokeStyle='rgba(0,0,0,.2)';c.lineWidth=1.4;c.beginPath();c.moveTo(x-tw*.15,h-th+tw*.4);c.lineTo(x-tw*.15,h);c.moveTo(x+tw*.18,h-th+tw*.4);c.lineTo(x+tw*.18,h);c.stroke();
      c.strokeStyle=rgba(L.rim||'#ffd08a',.45);c.lineWidth=2;c.beginPath();c.moveTo(x-tw/2+1,h);c.lineTo(x-tw/2+1,h-th+tw/2);c.stroke();});};
  /* fluffy cloud bank (floor for Cloud Kingdom) */
  P.cloudbank=function(c,L,R,w,h){var col=L.col||'#ffffff',sh=L.shade||'#c8d0ff';
    for(var i=0;i<Math.round(w/34);i++){var x=i*34+R()*20,r=h*(.18+R()*.22),y=h-r*.55-R()*h*.15;[-w,0,w].forEach(function(o){blob(c,x+o,y,r,col,'#ffffff',sh);});}
    c.fillStyle=col;c.fillRect(0,h-h*.18,w,h*.18);};
  /* flat sea with shimmering highlights */
  P.sea=function(c,L,R,w,h){c.fillStyle=vgrad(c,0,h,L.top||tint(L.col,.2),L.col);c.fillRect(0,0,w,h);
    c.fillStyle=rgba('#ffffff',.5);c.fillRect(0,0,w,1.5);
    for(var i=0;i<160;i++){var y=Math.pow(R(),1.6)*h,x=R()*w,len=6+y*.25;c.fillStyle=rgba(L.shine||'#ffffff',.08+.25*(1-y/h));c.fillRect(x,y,len,1.4);}};
  /* race-day grandstand with crowd + flags */
  P.stands=function(c,L,R,w,h){var col=L.col;
    for(var s=0;s<w;s+=420){var sw=340,sx=s+40,rows=6,rh=h*.09;
      for(var r=0;r<rows;r++){var ry=h-(r+1)*rh;c.fillStyle=r%2?tint(col,.06):col;c.fillRect(sx+r*8,ry,sw-r*16,rh);
        for(var p=sx+r*8+6;p<sx+sw-r*8-6;p+=9){c.fillStyle=pick(R,L.crowd);c.beginPath();c.arc(p+R()*2,ry+rh*.35,3.3,0,7);c.fill();}}
      var roofY=h-rows*rh-26;c.fillStyle=L.roof||'#ff3db5';c.beginPath();c.moveTo(sx-12,roofY+16);c.lineTo(sx+sw+12,roofY+16);c.lineTo(sx+sw-12,roofY);c.lineTo(sx+12,roofY);c.closePath();c.fill();
      for(var st=0;st<sw;st+=24){c.fillStyle=(st/24)%2?'#ffffff':(L.roof||'#ff3db5');c.fillRect(sx+st,roofY+16,24,7);}
      c.strokeStyle=tint(col,-.3);c.lineWidth=3;[sx,sx+sw].forEach(function(px){c.beginPath();c.moveTo(px,roofY+16);c.lineTo(px,h);c.stroke();});
      [sx+60,sx+sw-60,sx+sw/2].forEach(function(fx,i){c.strokeStyle='#e8e8f0';c.lineWidth=2;c.beginPath();c.moveTo(fx,roofY);c.lineTo(fx,roofY-44);c.stroke();
        if(i===2){for(var cy=0;cy<3;cy++)for(var cx=0;cx<4;cx++){c.fillStyle=(cx+cy)%2?'#111':'#fff';c.fillRect(fx+cx*6,roofY-44+cy*6,6,6);}}else{c.fillStyle=pick(R,L.flags);c.beginPath();c.moveTo(fx,roofY-44);c.lineTo(fx+22,roofY-37);c.lineTo(fx,roofY-30);c.fill();}});}};

  /* =================== SCENES =================== */
  var S={
    /* ---------- arcade (one per mode) ---------- */
    meadow:{name:'Neon Meadow',sky:['#1a1448','#3c2a7c','#ff8fb8'],sun:{x:.5,y:.62,r:.16,c:['#ffe27a','#ff5e9a'],stripes:1},stars:70,haze:'#ff7ab0',
      clouds:{n:4,col:'#ffb3d1',y:[.12,.3],a:.35},
      layers:[{t:'mountains',col:'#3b2c80',rim:'#ff9ac8',par:.08,h:260,n:8,mist:'#ff8fb8',mistA:.35},{t:'hills',col:'#2a2168',rim:'#8af0ff',par:.2,h:200,base:.45,dots:['#ff9ac8','#ffd23d','#8af0ff'],mist:'#6a3a9a',mistA:.3},{t:'trees',col:'#1f3a6a',top:'#3a8ab8',par:.36,h:190,lo:.5,hi:.9}],
      fx:[{p:'fireflies',n:26,col:'#d8ff7a'}],pal:{p:'#08303a',a:'#2de2ff',glow:'#2de2ff',bg:'#1a1448'},floor:'#3a2d80',lip:'#8af0ff'},
    crystal:{name:'Crystal Kingdom',sky:['#0b0828','#24185a','#5a3aa0'],moon:{x:.82,y:.17,r:.06,c:'#f2ecff'},stars:130,haze:'#9b6bff',
      layers:[{t:'mountains',col:'#1e1850',snow:'rgba(215,200,255,.85)',rim:'#b69bff',par:.06,h:300,n:6,mist:'#5a3aa0',mistA:.45},{t:'castle',col:'#150f36',roof:'#241a5a',win:'#ffd27a',flag:'#2de2ff',par:.15,h:300,mist:'#3a2a7a',mistA:.35},{t:'crystals',cols:['#2de2ff','#9b6bff','#8af0ff'],par:.32,h:220,glow:18},{t:'crystals',cols:['#ff3db5','#b98cff','#2de2ff'],par:.5,h:170,n:9,lo:.35,hi:.9,glow:22}],
      fx:[{p:'sparkles',n:36,col:'#8af0ff'}],pal:{p:'#10324a',a:'#2de2ff',glow:'#2de2ff',bg:'#0b0828'},floor:'#2a2070',floorGlow:'#9b6bff'},
    speedway:{name:'Sunset Speedway',sky:['#2a1a5e','#ff5e7e','#ffc36b'],sun:{x:.5,y:.6,r:.2,c:['#fff0a0','#ff6a8a'],stripes:1},stars:0,haze:'#ffd08a',
      clouds:{n:6,col:'#ffd0c0',y:[.08,.32],a:.55,streak:1},
      layers:[{t:'mountains',col:'#7a2e72',rim:'#ffc36b',par:.07,h:250,n:7,mist:'#ff8a7a',mistA:.5},{t:'hills',col:'#4a1f62',rim:'#ffb38a',par:.16,h:190,base:.4,mist:'#c04a7a',mistA:.3},{t:'stands',col:'#2e1a52',roof:'#ff3db5',crowd:['#ffd23d','#2de2ff','#ff3db5','#c6ff3d','#ffffff','#ff9a3d'],flags:['#c6ff3d','#2de2ff','#ffd23d'],par:.32,h:230},{t:'hills',col:'#23143e',rim:'#c6ff3d',rimA:.5,par:.5,h:90,base:.35,amp:.18,grass:'rgba(198,255,61,.35)'}],
      fx:[{p:'speed',n:18,col:'#ffffff'},{p:'confetti',n:22}],extras:['bunting'],pal:{p:'#2c2a0c',a:'#ffd23d',glow:'#ff9a3d',bg:'#2a1a5e'},floor:'#3a1f5a',lip:'#7ad84a',tufts:1},
    ember:{name:'Ember Peaks',sky:['#12030a','#4a0e12','#b8401a'],stars:0,haze:'#ff5a1a',glowBand:1,
      layers:[{t:'mountains',col:'#2a0a10',rim:'#ff7a3d',rimA:.35,par:.06,h:280,n:8,mist:'#8a2012',mistA:.5},{t:'volcano',col:'#1c0709',glow:'#ff6a1a',par:.16,h:300},{t:'mountains',col:'#120406',rim:'#ff5a1a',rimA:.7,par:.36,h:170,n:11,lo:.3,hi:.9,facet:.35}],
      fx:[{p:'embers',n:60,col:'#ff9a3d'},{p:'ash',n:24,col:'#c8a0a0'}],pal:{p:'#3a1208',a:'#ff7a1a',glow:'#ff5a1a',bg:'#12030a'},floor:'#3a1410',floorGlow:'#ff5a1a'},
    swamp:{name:'Slime Swamp',sky:['#03110c','#0a2a20','#1f5a3c'],moon:{x:.2,y:.2,r:.07,c:'#d8ffd0',tint:'#7aff9a'},stars:50,haze:'#39ff7a',
      layers:[{t:'hills',col:'#0c2a22',rim:'#39ff7a',rimA:.2,par:.07,h:200,base:.55,mist:'#1f5a3c',mistA:.5},{t:'trees',col:'#0e3024',top:'#1f6a44',trunk:'#07170f',vines:'rgba(57,255,122,.35)',par:.2,h:280,lo:.6,hi:1,mist:'#14402c',mistA:.45},{t:'mushrooms',cols:['#39ff7a','#c6ff3d','#2de2ff','#b98cff'],par:.42,h:150,n:18}],
      fx:[{p:'bubbles',n:22,col:'#7affb0'},{p:'spores',n:30,col:'#b8ff5a'}],pal:{p:'#0c2a14',a:'#39ff7a',glow:'#39ff7a',bg:'#03110c'},floor:'#123a26',lip:'#2f7a4a',floorGlow:'#39ff7a',tufts:1},
    grove:{name:'Moonlit Grove',sky:['#040716','#0f1942','#28336e'],moon:{x:.24,y:.18,r:.085,c:'#fff6dc'},stars:150,haze:'#6a7aff',
      layers:[{t:'mountains',col:'#161e48',rim:'#9aa8ff',rimA:.35,par:.05,h:260,n:7,mist:'#28336e',mistA:.45},{t:'pines',col:'#101a3c',par:.16,h:250,mist:'#232e66',mistA:.5},{t:'pines',col:'#0b1230',par:.3,h:230,lo:.5,hi:1,mist:'#1a2350',mistA:.35},{t:'trees',col:'#0a1026',top:'#1c2a5a',trunk:'#05081a',par:.5,h:200,n:12}],
      fx:[{p:'fireflies',n:34,col:'#ffe27a'}],pal:{p:'#241048',a:'#9b6bff',glow:'#9b6bff',bg:'#040716'},floor:'#1e1a4a',floorGlow:'#9b6bff'},
    rooftop:{name:'Rooftop Court',sky:['#130b32','#3e1f7a','#ff7a8a'],sun:{x:.78,y:.7,r:.1,c:['#ffe0a0','#ff6a7a']},stars:40,haze:'#ff8a8a',
      layers:[{t:'city',col:'#2c1f5e',win:['#ffd27a','#ff9ac8'],lit:.25,par:.06,h:300,mist:'#8a3a8a',mistA:.4},{t:'city',col:'#1a1040',win:['#ffd27a','#2de2ff','#ff9ac8'],neon:['#2de2ff','#ff3db5','#c6ff3d'],lit:.4,par:.16,h:260,lo:.4,hi:1}],
      fx:[],extras:['lights'],pal:{p:'#3a1a08',a:'#ff9a3d',glow:'#ff7a1a',bg:'#130b32'}},
    /* ---------- zen scene set ---------- */
    forest:{name:'Sunny Forest',sky:['#6ec6ff','#b8ecff','#fff2cc'],sun:{x:.76,y:.16,r:.07,c:['#fffbe0','#ffe07a']},stars:0,haze:'#fff2c0',clouds:{n:6,col:'#ffffff',y:[.06,.3],a:.9},
      layers:[{t:'mountains',col:'#86b8b0',rim:'#ffffff',rimA:.4,par:.05,h:260,n:6,mist:'#cfeef0',mistA:.55},{t:'pines',col:'#3f8a64',par:.15,h:230,mist:'#9ad8c0',mistA:.4},{t:'trees',col:'#3aa05a',top:'#8ae07a',trunk:'#6a4a2a',fruit:'#ff6a6a',par:.3,h:230},{t:'hills',col:'#4ab85a',top:'#8ae06a',rim:'#d8ff9a',par:.46,h:90,base:.35,amp:.2,dots:['#ffffff','#ffd23d','#ff9ac8'],dotN:90}],
      fx:[{p:'leaves',n:14},{p:'butterflies',n:6}],extras:['rays'],pal:{p:'#142c10',a:'#8ae06a',glow:'#c6ff3d',bg:'#6ec6ff'},floor:'#6a4a2e',lip:'#6ac84a',tufts:1},
    beach:{name:'Tropical Beach',sky:['#3eb8ff','#9be4ff','#fff0c8'],sun:{x:.7,y:.2,r:.07,c:['#fffbe0','#ffd07a']},stars:0,haze:'#fff0c0',clouds:{n:5,col:'#ffffff',y:[.06,.28],a:.9},
      layers:[{t:'sea',col:'#0f7ab8',top:'#5ad0f0',par:.04,h:210},{t:'hills',col:'#f0d49a',top:'#fff0c8',par:.2,h:70,base:.3,amp:.15,ripples:'#c8a060'},{t:'palms',col:'#2fa86a',trunk:'#8a6a3a',par:.34,h:280}],
      fx:[{p:'sparkles',n:20,col:'#ffffff',low:1}],extras:['gulls'],pal:{p:'#08303a',a:'#2de2ff',glow:'#8af0ff',bg:'#3eb8ff'},floor:'#e8c888',lip:'#fff0c8'},
    desert:{name:'Desert Sunset',sky:['#3a1a5c','#ff7a5a','#ffd07a'],sun:{x:.34,y:.58,r:.13,c:['#fff0a0','#ff7a5a'],stripes:1},stars:20,haze:'#ffb070',
      layers:[{t:'mountains',col:'#8a3a52',rim:'#ffd07a',par:.06,h:220,n:5,lo:.55,hi:.8,facet:.28,mist:'#ff9a6a',mistA:.5},{t:'hills',col:'#c0604a',top:'#f0906a',rim:'#ffe0a0',par:.15,h:150,base:.45,ripples:'#ffd0a0'},{t:'hills',col:'#8a3c38',top:'#c05a4a',par:.28,h:110,base:.4},{t:'cactus',col:'#2f5a42',rim:'#ffd08a',par:.42,h:200}],
      fx:[{p:'dust',n:30,col:'#ffd8a8'}],pal:{p:'#2c2a0c',a:'#ffb03d',glow:'#ff7a3d',bg:'#3a1a5c'},floor:'#b8683e'},
    snow:{name:'Snowy Night',sky:['#070c28','#18285a','#3a5a90'],moon:{x:.8,y:.16,r:.05,c:'#f6f8ff'},stars:120,haze:'#8ab8ff',
      layers:[{t:'mountains',col:'#7a90c8',snow:'#f4f8ff',rim:'#ffffff',rimA:.5,par:.05,h:300,n:6,mist:'#3a5a90',mistA:.4},{t:'pines',col:'#1c2c52',snow:'#e8f0ff',par:.18,h:240,mist:'#2a4070',mistA:.35},{t:'hills',col:'#c8d8f4',top:'#f4f8ff',rim:'#ffffff',par:.34,h:110,base:.35,amp:.2},{t:'pines',col:'#14203e',snow:'#ffffff',par:.5,h:180,n:14}],
      fx:[{p:'snow',n:80}],extras:['aurora'],pal:{p:'#08303a',a:'#8af0ff',glow:'#8af0ff',bg:'#070c28'},floor:'#b8c8e8',lip:'#ffffff'},
    underwater:{name:'Coral Reef',sky:['#0a9ab8','#05587a','#022038'],stars:0,haze:'#2de2ff',
      layers:[{t:'hills',col:'#07405a',par:.06,h:220,base:.5,mist:'#05587a',mistA:.5},{t:'coral',cols:['#ff6a9a','#ffb03d','#b98cff','#ff8a6a'],par:.22,h:220,mist:'#064a66',mistA:.45},{t:'coral',cols:['#ff3db5','#ffd23d','#2de2ff','#ff7a5a'],par:.42,h:170,n:22}],
      fx:[{p:'bubbles',n:34,col:'#bff8ff'},{p:'fish',n:7}],extras:['rays'],pal:{p:'#08303a',a:'#2de2ff',glow:'#2de2ff',bg:'#022038'},floor:'#d8c08a'},
    city:{name:'City Rooftop',sky:['#1a1042','#3e2278','#ff8a7a'],sun:{x:.25,y:.72,r:.09,c:['#ffe0a0','#ff6a7a']},stars:50,haze:'#ff9a8a',
      layers:[{t:'city',col:'#3a2a6a',win:['#ffd27a'],lit:.2,par:.05,h:320,mist:'#9a4a8a',mistA:.45},{t:'city',col:'#241848',win:['#ffd27a','#ffe8b0'],lit:.35,par:.15,h:280,lo:.4},{t:'city',col:'#140c30',win:['#ffd27a','#8af0ff','#ff9ac8'],neon:['#ff3db5','#2de2ff'],lit:.45,par:.3,h:230,lo:.45,hi:1}],
      fx:[],extras:['lights','planes'],pal:{p:'#241048',a:'#ff9ac8',glow:'#ff3db5',bg:'#1a1042'},floor:'#2a2048'},
    candy:{name:'Candyland',sky:['#ffaedc','#e4b8ff','#b8f0ff'],sun:{x:.8,y:.18,r:.06,c:['#fffbe0','#ffd0e8']},stars:0,haze:'#ffffff',clouds:{n:7,col:'#fff0f8',y:[.05,.32],a:.95},
      layers:[{t:'hills',col:'#f08ac0',top:'#ffc0e0',rim:'#ffffff',par:.07,h:230,base:.55,mist:'#ffd0ec',mistA:.4},{t:'candy',cols:['#ff5d93','#8df0ff','#ffd23d','#b98cff','#7affb0'],par:.24,h:240},{t:'hills',col:'#b98cff',top:'#e0c8ff',rim:'#ffffff',par:.4,h:90,base:.35,amp:.2,dots:['#ffffff','#ff5d93','#ffd23d','#8df0ff'],dotN:120}],
      fx:[{p:'confetti',n:26}],pal:{p:'#3a1040',a:'#ff6fb5',glow:'#ff9ac8',bg:'#ffaedc'},floor:'#c86aa0',lip:'#fff0f8'},
    volcano:{name:'Volcano',sky:['#12030a','#4a0e12','#b8401a'],stars:0,haze:'#ff5a1a',glowBand:1,
      layers:[{t:'mountains',col:'#2a0a10',rim:'#ff7a3d',rimA:.35,par:.06,h:280,n:8,mist:'#8a2012',mistA:.5},{t:'volcano',col:'#1c0709',glow:'#ff6a1a',par:.18,h:320},{t:'mountains',col:'#120406',rim:'#ff5a1a',rimA:.7,par:.38,h:150,n:12,lo:.3,hi:.9,facet:.35}],
      fx:[{p:'embers',n:60,col:'#ff9a3d'},{p:'ash',n:20,col:'#c8a0a0'}],pal:{p:'#3a1208',a:'#ff7a1a',glow:'#ff5a1a',bg:'#12030a'},floor:'#3a1410'},
    rain:{name:'Rainy Night',sky:['#0b1020','#18223a','#2c3a56'],stars:0,haze:'#6a8aff',clouds:{n:6,col:'#3a4660',y:[.02,.2],a:.9},
      layers:[{t:'city',col:'#1c2640',win:['#ffd27a'],lit:.22,par:.06,h:300,mist:'#2c3a56',mistA:.5},{t:'city',col:'#111828',win:['#ffd27a','#ffe8b0','#8af0ff'],lit:.38,par:.2,h:260,lo:.45,hi:1}],
      fx:[{p:'rain',n:110,col:'#a8d0ff'}],extras:['lightning'],pal:{p:'#08303a',a:'#8ab8ff',glow:'#6a8aff',bg:'#0b1020'},floor:'#27324a'},
    castle:{name:'Moonlit Castle',sky:['#0c1030','#283460','#5a5a98'],moon:{x:.78,y:.16,r:.08,c:'#fff6dc'},stars:120,haze:'#b8a8ff',
      layers:[{t:'mountains',col:'#262e5a',snow:'rgba(230,230,255,.8)',par:.05,h:260,n:6,mist:'#4a4a88',mistA:.45},{t:'castle',col:'#12163a',roof:'#2a2a6a',win:'#ffd27a',par:.14,h:360},{t:'pines',col:'#0c1230',par:.34,h:200,n:24}],
      fx:[{p:'fireflies',n:20,col:'#ffe27a'}],extras:['bats'],pal:{p:'#241048',a:'#b98cff',glow:'#9b6bff',bg:'#0c1030'},floor:'#2a2a5a'},
    cyber:{name:'Cyber Alley',sky:['#04010e','#150a34','#3a0a5a'],stars:30,haze:'#ff3db5',
      layers:[{t:'city',col:'#120a30',win:['#2de2ff','#ff3db5'],lit:.3,par:.06,h:320,mist:'#3a0a5a',mistA:.45},{t:'city',col:'#0a0620',win:['#2de2ff','#c6ff3d','#ff3db5'],neon:['#2de2ff','#ff3db5','#c6ff3d','#ffd23d'],lit:.42,par:.2,h:280,lo:.45,hi:1}],
      fx:[{p:'rain',n:70,col:'#ff7ad8'},{p:'motes',n:24,col:'#2de2ff'}],extras:['scan'],pal:{p:'#08303a',a:'#2de2ff',glow:'#2de2ff',bg:'#04010e'},floor:'#1a1040'},
    neon:{name:'Neon',sky:['#0a0620','#2a0c4a','#ff3db5'],sun:{x:.5,y:.6,r:.17,c:['#ffd23d','#ff3db5'],stripes:1},stars:90,haze:'#ff3db5',
      layers:[{t:'mountains',col:'#1a0a3a',rim:'#ff3db5',rimA:.9,par:.05,h:220,n:9,facet:.3},{t:'city',col:'#0e0626',win:['#2de2ff','#ff3db5'],neon:['#2de2ff','#ff3db5','#c6ff3d'],lit:.3,par:.14,h:200,lo:.3,hi:.9}],
      fx:[{p:'motes',n:20,col:'#2de2ff'}],extras:['grid'],pal:{p:'#2a1850',a:'#ff3db5',glow:'#ff3db5',bg:'#0a0620'},floor:'#140a30',lip:'#2de2ff',floorGlow:'#ff3db5'},
    space:{name:'Deep Space',sky:['#02030c','#0a0d2e','#1a0f3a'],stars:220,haze:'#6a4aff',
      layers:[{t:'hills',col:'#3a3656',top:'#6a6690',rim:'#b8b0ff',par:.1,h:140,base:.35,amp:.25,dots:['rgba(0,0,0,.25)'],dotN:40},{t:'crystals',cols:['#9b6bff','#2de2ff'],par:.3,h:120,n:6,lo:.3,hi:.8}],
      fx:[{p:'sparkles',n:24,col:'#c6d8ff'}],extras:['nebula','planet','shooting'],pal:{p:'#241048',a:'#9b6bff',glow:'#9b6bff',bg:'#02030c'},floor:'#4a4668',lip:'#8a86b0'},
    living:{name:'Cozy Home',sky:['#f6d8c0','#eec0a8','#d89a88'],stars:0,
      layers:[],extras:['room'],fx:[{p:'dust',n:14,col:'#fff2d8'}],pal:{p:'#3a1a08',a:'#ffb03d',glow:'#ffd27a',bg:'#f6d8c0'},floor:'#9a6a44',lip:'#c89060'},
    aurora:{name:'Northern Lights',sky:['#020a1a','#0a2440','#1a4a5a'],stars:160,haze:'#39ff7a',
      layers:[{t:'mountains',col:'#1a3048',snow:'#e8f4ff',rim:'#7affd0',rimA:.4,par:.05,h:280,n:6,mist:'#1a4a5a',mistA:.4},{t:'pines',col:'#0a1a28',snow:'#dff0ff',par:.2,h:220},{t:'hills',col:'#b8d0e8',top:'#eef6ff',rim:'#ffffff',par:.4,h:80,base:.35,amp:.15}],
      fx:[{p:'snow',n:30}],extras:['aurora'],pal:{p:'#08303a',a:'#7affd0',glow:'#39ff7a',bg:'#020a1a'},floor:'#a8c0dc',lip:'#ffffff'},
    shrooms:{name:'Glow Shroom Forest',sky:['#0a0420','#200a40','#3a1a5a'],stars:60,haze:'#b98cff',
      layers:[{t:'hills',col:'#1a0e3a',rim:'#b98cff',rimA:.3,par:.06,h:200,base:.5,mist:'#3a1a5a',mistA:.5},{t:'mushrooms',cols:['#b98cff','#2de2ff','#ff3db5'],par:.2,h:280,n:10,lo:.5,hi:1,mist:'#2a1450',mistA:.35},{t:'mushrooms',cols:['#c6ff3d','#ff9ac8','#2de2ff','#ffd23d'],par:.42,h:130,n:20}],
      fx:[{p:'spores',n:40,col:'#d8b8ff'},{p:'fireflies',n:14,col:'#8af0ff'}],pal:{p:'#241048',a:'#b98cff',glow:'#b98cff',bg:'#0a0420'},floor:'#241446',lip:'#6a3aa0',floorGlow:'#b98cff',tufts:1},
    autumn:{name:'Autumn Park',sky:['#ffb38a','#ffd8a8','#fff0d0'],sun:{x:.2,y:.28,r:.08,c:['#fff8e0','#ffc070']},stars:0,haze:'#ffe0b0',clouds:{n:5,col:'#fff4e8',y:[.06,.3],a:.8},
      layers:[{t:'hills',col:'#d8906a',top:'#f0b890',par:.06,h:200,base:.5,mist:'#ffd8b0',mistA:.45},{t:'trees',col:'#e8702a',top:'#ffb04a',trunk:'#5a3a24',par:.18,h:240,mist:'#ffc890',mistA:.3},{t:'trees',col:'#c8402a',top:'#ff8a4a',trunk:'#4a2a1a',par:.34,h:210,n:14},{t:'hills',col:'#a86a3a',top:'#d8904a',par:.48,h:70,base:.35,amp:.15,dots:['#ff7a2a','#ffc04a','#c8402a'],dotN:140}],
      fx:[{p:'leaves',n:26}],pal:{p:'#3a1a08',a:'#ff9a3d',glow:'#ffb03d',bg:'#ffb38a'},floor:'#6a4a2e',lip:'#c87a3a',tufts:1},
    lagoon:{name:'Neon Lagoon',sky:['#1a0a4a','#8a2a8a','#ff9a6a'],sun:{x:.62,y:.55,r:.14,c:['#fff0a0','#ff5a9a'],stripes:1},stars:40,haze:'#ff8aa8',
      layers:[{t:'sea',col:'#2a1a6a',top:'#ff7aa8',shine:'#ffd0a0',par:.04,h:200},{t:'palms',col:'#1a0e3a',trunk:'#120a28',par:.3,h:300,n:6}],
      fx:[{p:'sparkles',n:20,col:'#ffe0f0',low:1}],extras:['gulls'],pal:{p:'#2a1850',a:'#ff6fb5',glow:'#ff3db5',bg:'#1a0a4a'},floor:'#3a1a5a',lip:'#ff9ac8',floorGlow:'#ff3db5'},
    /* NEW */
    sakura:{name:'Sakura Garden',sky:['#ffc8de','#ffe2d4','#fff4e0'],sun:{x:.72,y:.22,r:.08,c:['#fffaf0','#ffd8c8']},stars:0,haze:'#ffffff',clouds:{n:4,col:'#ffffff',y:[.08,.3],a:.7},
      layers:[{t:'mountains',col:'#a88ac0',snow:'#ffffff',rim:'#ffffff',par:.04,h:300,n:3,lo:.7,hi:1,facet:.12,mist:'#ffd8e8',mistA:.55},{t:'hills',col:'#8ac09a',top:'#b8e0b0',rim:'#ffffff',par:.14,h:150,base:.45,mist:'#e8f0e0',mistA:.35},{t:'sakura',cols:['#ffb8d0','#ff9ac0','#ffd0e0'],par:.3,h:260},{t:'hills',col:'#6aa878',top:'#9ad098',par:.46,h:70,base:.35,amp:.15,dots:['#ffb8d0','#ffffff'],dotN:120}],
      fx:[{p:'petals',n:34}],pal:{p:'#3a1030',a:'#ff9ac0',glow:'#ffb8d0',bg:'#ffc8de'},floor:'#6a4a3a',lip:'#8ad08a',tufts:1},
    clouds:{name:'Cloud Kingdom',sky:['#6aaeff','#b0d4ff','#ffe4f2'],sun:{x:.2,y:.2,r:.08,c:['#fffbe8','#ffe0a0']},stars:0,haze:'#ffffff',rainbow:1,
      layers:[{t:'cloudbank',col:'#f4f0ff',shade:'#b8c4f0',par:.05,h:200},{t:'castle',col:'#e8e0ff',roof:'#ff9ac8',win:'#ffd27a',flag:'#ffd23d',par:.12,h:300},{t:'cloudbank',col:'#ffffff',shade:'#c8d0ff',par:.3,h:130}],
      fx:[{p:'sparkles',n:26,col:'#ffffff'}],extras:['birds'],pal:{p:'#241048',a:'#b98cff',glow:'#ffffff',bg:'#6aaeff'},floor:'#d8d8f8',lip:'#ffffff'}
  };
  var MODE={classic:'crystal',race:'speedway',survival:'ember',tag:'swamp',hns:'grove',hoops:'rooftop',tutorial:'meadow',title:'meadow'};
  var ZEN_NEW=['sakura','clouds','aurora','shrooms','autumn','lagoon'];

  /* =================== CACHED RESOURCES =================== */
  function scaleOf(){return Math.max(.62,Math.min(1.25,H/760));}
  function strip(id,i,L){var k=id+':'+i;if(cache[k])return cache[k];var cv=mk(TW,L.h),c=cv.getContext('2d');try{P[L.t](c,L,rng(i*977+id.length*131+id.charCodeAt(0)),TW,L.h);}catch(e){}
    if(L.mist){c.globalCompositeOperation='source-atop';c.fillStyle=vgrad(c,L.h*(1-(L.mistH||.6)),L.h,rgba(L.mist,0),rgba(L.mist,L.mistA||.5));c.fillRect(0,0,TW,L.h);c.globalCompositeOperation='source-over';}
    cache[k]=cv;return cv;}
  function cloudSprite(sc,i){var k='cl:'+sc.name+i;if(cache[k])return cache[k];var cl=sc.clouds,R=rng(i*31+7),w=180+R()*140,h=w*.42,cv=mk(w,h+10),c=cv.getContext('2d');
    if(cl.streak){c.fillStyle=vgrad(c,0,h,rgba(cl.col,.9),rgba(cl.col,.2));for(var s=0;s<4;s++){c.beginPath();c.roundRect(R()*w*.3,h*.3+s*h*.14,w*(.5+R()*.5),h*.1,h*.05);c.fill();}}
    else{for(var b=0;b<6;b++){var bx=w*.15+b*w*.14,r=h*(.25+R()*.22),by=h-r*.9;var g=c.createRadialGradient(bx-r*.3,by-r*.4,r*.1,bx,by,r);g.addColorStop(0,'#ffffff');g.addColorStop(.75,cl.col);g.addColorStop(1,rgba(cl.col,.85));c.fillStyle=g;c.beginPath();c.arc(bx,by,r,0,7);c.fill();}
      c.fillStyle=cl.col;c.beginPath();c.roundRect(w*.1,h*.6,w*.8,h*.35,h*.17);c.fill();}
    cache[k]=cv;return cv;}

  /* ---------- Cozy Home wall module (fixed spacing → never overlaps on narrow phones) ---------- */
  var _paper=null;function roomPaper(){if(_paper)return _paper;var cv=mk(64,64),c=cv.getContext('2d');c.fillStyle='#f1d6c4';c.fillRect(0,0,64,64);c.fillStyle='#ecccb8';c.fillRect(0,0,22,64);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(22,0,2,64);
    c.fillStyle='rgba(200,120,110,.22)';[[43,16],[43,48]].forEach(function(q){c.beginPath();c.moveTo(q[0],q[1]-7);c.quadraticCurveTo(q[0]+5,q[1],q[0],q[1]+7);c.quadraticCurveTo(q[0]-5,q[1],q[0],q[1]-7);c.fill();c.beginPath();c.arc(q[0],q[1]-10,1.6,0,7);c.fill();});_paper=ctx.createPattern(cv,'repeat');return _paper;}
  var _mod={};function roomModule(k){k=Math.round(k*20)/20;if(_mod[k])return _mod[k];var MW=Math.round(820*k),MH=Math.round(430*k),cv=mk(MW,MH),c=cv.getContext('2d'),fy=MH,wain=74*k;
    function R(x,y,w,h,r,col){c.fillStyle=col;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
    /* wainscot + chair rail + baseboard */
    c.fillStyle=vgrad(c,fy-wain,fy,'#b9805e','#93593c');c.fillRect(0,fy-wain,MW,wain);for(var px=12*k;px<MW-40*k;px+=82*k){c.strokeStyle='rgba(60,30,18,.28)';c.lineWidth=2;c.strokeRect(px,fy-wain+14*k,66*k,wain-26*k);c.strokeStyle='rgba(255,230,200,.18)';c.lineWidth=1;c.strokeRect(px+3*k,fy-wain+17*k,60*k,wain-32*k);}
    R(0,fy-wain-7*k,MW,9*k,3,'#d8a27a');c.fillStyle='rgba(255,255,255,.35)';c.fillRect(0,fy-wain-7*k,MW,2);c.fillStyle='#6a3e28';c.fillRect(0,fy-8*k,MW,8*k);
    /* WINDOW with curtains, sill and potted plant */
    var wx=46*k,ww=200*k,wh=168*k,wy=fy-wain-34*k-wh;R(wx-12*k,wy-12*k,ww+24*k,wh+24*k,10*k,'#fff4e8');var sg=c.createLinearGradient(0,wy,0,wy+wh);sg.addColorStop(0,'#7ec4ff');sg.addColorStop(.7,'#cfe8ff');sg.addColorStop(1,'#ffe2c8');c.fillStyle=sg;c.fillRect(wx,wy,ww,wh);
    c.fillStyle='#9ad08a';c.beginPath();c.moveTo(wx,wy+wh);for(var hx=0;hx<=ww;hx+=10*k)c.lineTo(wx+hx,wy+wh-18*k-Math.sin(hx/ww*6)*8*k);c.lineTo(wx+ww,wy+wh);c.fill();c.fillStyle='#6aa86a';for(var tr=0;tr<3;tr++){var tx=wx+ww*(.2+tr*.3);c.beginPath();c.arc(tx,wy+wh-26*k,10*k,0,7);c.fill();}
    c.fillStyle='#fff4e8';c.fillRect(wx+ww/2-3*k,wy,6*k,wh);c.fillRect(wx,wy+wh*.48-3*k,ww,6*k);c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.moveTo(wx+8*k,wy);c.lineTo(wx+40*k,wy);c.lineTo(wx+8*k,wy+60*k);c.closePath();c.fill();
    R(wx-22*k,wy+wh+8*k,ww+44*k,10*k,3,'#f6e6d4');c.fillStyle='rgba(0,0,0,.12)';c.fillRect(wx-22*k,wy+wh+16*k,ww+44*k,3*k);
    R(wx+ww-46*k,wy+wh-12*k,26*k,20*k,4,'#d8785a');c.fillStyle='#4aa85a';[[-8,-14,9],[0,-22,10],[8,-14,9]].forEach(function(q){c.beginPath();c.ellipse(wx+ww-33*k+q[0]*k,wy+wh-12*k+q[1]*k,q[2]*k*.55,q[2]*k,q[0]*.08,0,7);c.fill();});
    c.fillStyle='#d0607a';c.fillRect(wx-40*k,wy-26*k,ww+80*k,8*k);[-1,1].forEach(function(d){var ex=d<0?wx-34*k:wx+ww+34*k;c.fillStyle='#e8788e';c.beginPath();c.moveTo(ex,wy-20*k);c.lineTo(ex-d*36*k,wy-20*k);c.quadraticCurveTo(ex-d*12*k,wy+wh*.45,ex-d*26*k,wy+wh+18*k);c.lineTo(ex,wy+wh+18*k);c.closePath();c.fill();c.strokeStyle='rgba(120,30,50,.25)';c.lineWidth=1.4;for(var f=1;f<4;f++){c.beginPath();c.moveTo(ex-d*f*9*k,wy-18*k);c.quadraticCurveTo(ex-d*f*5*k,wy+wh*.5,ex-d*f*7*k,wy+wh+16*k);c.stroke();}c.fillStyle='#ffd23d';c.fillRect(ex-d*30*k-4*k,wy+wh*.5,8*k,5*k);});
    /* SCONCE */
    var scx=300*k,scy=fy-wain-130*k;R(scx-6*k,scy+6*k,12*k,22*k,3,'#c8963a');c.fillStyle='#ffe6b0';c.beginPath();c.moveTo(scx-14*k,scy+8*k);c.lineTo(scx+14*k,scy+8*k);c.lineTo(scx+9*k,scy-14*k);c.lineTo(scx-9*k,scy-14*k);c.closePath();c.fill();
    /* BOOKSHELF (wall unit) */
    var bx=350*k,bw=190*k,bt=fy-wain-196*k,rows=3,rh=52*k;R(bx-6*k,bt-8*k,bw+12*k,10*k,3,'#6a3e28');c.fillStyle='#5a3220';c.fillRect(bx,bt,bw,rows*rh);c.fillStyle='#3a2014';c.fillRect(bx+6*k,bt+2*k,bw-12*k,rows*rh-4*k);
    var bc=['#d8506a','#3a7ad8','#e8b03a','#3aa86a','#8a5ad8','#e8784a','#f4f0e8'];for(var r=0;r<rows;r++){var sy=bt+(r+1)*rh;c.fillStyle='#7a4a30';c.fillRect(bx,sy-5*k,bw,5*k);var bxx=bx+10*k,n=0;while(bxx<bx+bw-14*k){var w=(8+((r*7+n*5)%6))*k,h=(30+((r*11+n*7)%14))*k;if(r===1&&n===5){c.fillStyle='#9ad0e8';c.beginPath();c.arc(bxx+12*k,sy-14*k,10*k,0,7);c.fill();c.fillStyle='#ffb03d';c.beginPath();c.ellipse(bxx+12*k,sy-14*k,4*k,2.4*k,0,0,7);c.fill();bxx+=28*k;n++;continue;}
        if(r===2&&n===3){R(bxx,sy-18*k,22*k,13*k,3,'#d8785a');c.fillStyle='#4aa85a';c.beginPath();c.arc(bxx+11*k,sy-22*k,9*k,0,7);c.fill();bxx+=28*k;n++;continue;}
        var tilt=(n%7===4)?.18:0;c.save();c.translate(bxx,sy-5*k);c.rotate(tilt);c.fillStyle=bc[(r*3+n)%bc.length];c.fillRect(0,-h,w-1.4,h);c.fillStyle='rgba(255,230,160,.6)';c.fillRect(1,-h+5*k,w-3.4,2*k);c.fillRect(1,-8*k,w-3.4,1.5*k);c.restore();bxx+=w+(tilt?4*k:0);n++;}}
    c.strokeStyle='#8a5a3a';c.lineWidth=2;c.strokeRect(bx,bt,bw,rows*rh);
    /* FRAMED ART + CLOCK */
    var fx=590*k,fw=120*k,fh=92*k,fyy=fy-wain-176*k;R(fx-8*k,fyy-8*k,fw+16*k,fh+16*k,4,'#c8963a');c.fillStyle='#fff6e8';c.fillRect(fx,fyy,fw,fh);var ag=c.createLinearGradient(0,fyy,0,fyy+fh);ag.addColorStop(0,'#ffd0a8');ag.addColorStop(1,'#ff9aa8');c.fillStyle=ag;c.fillRect(fx+8*k,fyy+8*k,fw-16*k,fh-16*k);c.fillStyle='#fff3c8';c.beginPath();c.arc(fx+fw*.68,fyy+fh*.38,12*k,0,7);c.fill();c.fillStyle='#a86a8a';c.beginPath();c.moveTo(fx+8*k,fyy+fh-8*k);c.lineTo(fx+fw*.38,fyy+fh*.42);c.lineTo(fx+fw*.6,fyy+fh*.7);c.lineTo(fx+fw*.78,fyy+fh*.52);c.lineTo(fx+fw-8*k,fyy+fh-8*k);c.closePath();c.fill();
    var clx=fx+fw/2,cly=fyy-58*k,cr=22*k;c.fillStyle='#6a3e28';c.beginPath();c.arc(clx,cly,cr+5*k,0,7);c.fill();c.fillStyle='#fff8ec';c.beginPath();c.arc(clx,cly,cr,0,7);c.fill();c.fillStyle='#6a3e28';for(var q=0;q<12;q++){var a=q/12*6.283;c.fillRect(clx+Math.cos(a)*cr*.82-1,cly+Math.sin(a)*cr*.82-1,2,2);}
    /* small side table + vase near the end of the module */
    var tx2=750*k;R(tx2-26*k,fy-wain-6*k-40*k,52*k,6*k,2,'#7a4a30');c.fillStyle='#6a3e28';c.fillRect(tx2-20*k,fy-wain-34*k,4*k,34*k-6*k+wain*0);
    cv._win={x:wx,y:wy,w:ww,h:wh};cv._sc={x:scx,y:scy};cv._lamp=Math.round(470*k);cv._clk={x:clx,y:cly,r:cr};_mod[k]=cv;return cv;}

  /* ---------- per-scene ground detail strip ---------- */
  var GKIND={forest:'flowers',beach:'shells',desert:'rocks',snow:'snow',underwater:'shells',city:'roof',candy:'puffs',rain:'reeds',castle:'flowers',cyber:'neon',crystal:'crystal',ember:'ember',volcano:'ember',swamp:'reeds',grove:'flowers',meadow:'flowers',speedway:'track',rooftop:'roof',neon:'neon',space:'rocks',living:'rug',aurora:'snow',shrooms:'shroom',autumn:'leaves',lagoon:'shells',sakura:'petals',clouds:'puffs'};
  function groundStrip(id,sc,s){var k='gs:'+id+':'+Math.round(s*20);if(cache[k])return cache[k];var w=Math.round(TW*s),top=Math.round(40*s),h=top+Math.round(70*s),cv=mk(w,h),c=cv.getContext('2d'),R=rng(id.length*71+id.charCodeAt(0)*13),lip=sc.lip||tint(sc.floor,.35),fl=sc.floor,kind=GKIND[id]||'flowers',a=(sc.pal&&sc.pal.a)||'#ffffff',i;
    var gy=top;/* lip band highlight + soil speckle in the ground band */
    c.fillStyle='rgba(0,0,0,.16)';for(i=0;i<160;i++){var px=R()*w,py=gy+10*s+R()*56*s;c.beginPath();c.ellipse(px,py,(1+R()*3)*s,(0.8+R()*1.6)*s,0,0,7);c.fill();}
    c.fillStyle='rgba(255,255,255,.08)';for(i=0;i<90;i++){c.fillRect(R()*w,gy+12*s+R()*50*s,2*s,1.2*s);}
    for(i=0;i<34;i++){var x=R()*w,r=(4+R()*7)*s;c.fillStyle=tint(fl,-.2+R()*.3);c.beginPath();c.ellipse(x,gy+(2+R()*4)*s,r,r*.55,0,0,7);c.fill();c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.ellipse(x-r*.3,gy+1*s,r*.4,r*.2,0,0,7);c.fill();}
    function tuft(x,col,hh){c.strokeStyle=col;c.lineWidth=1.6*s;c.lineCap='round';for(var b=-2;b<=2;b++){c.beginPath();c.moveTo(x+b*1.6*s,gy+2*s);c.quadraticCurveTo(x+b*2.4*s,gy-hh*.5,x+b*3.6*s+(R()-.5)*3*s,gy-hh*(.6+R()*.4));c.stroke();}}
    var n=Math.round(w/(36*s));for(i=0;i<n;i++){var x2=(i+R()*.8)*w/n;
      if(kind==='flowers'||kind==='petals'){tuft(x2,tint(lip,-.15),(10+R()*10)*s);if(R()<.55){var fc=pick(R,['#ffd23d','#ff7ab0','#ffffff','#b98cff','#8af0ff']),fh=(8+R()*12)*s;c.strokeStyle='#4a8a3a';c.lineWidth=1.2*s;c.beginPath();c.moveTo(x2+6*s,gy+2*s);c.lineTo(x2+6*s,gy-fh);c.stroke();c.fillStyle=fc;for(var pe=0;pe<5;pe++){var an=pe/5*6.283;c.beginPath();c.arc(x2+6*s+Math.cos(an)*2.6*s,gy-fh+Math.sin(an)*2.6*s,2.2*s,0,7);c.fill();}c.fillStyle='#ffb03d';c.beginPath();c.arc(x2+6*s,gy-fh,1.6*s,0,7);c.fill();}}
      else if(kind==='crystal'||kind==='neon'){if(R()<.6){var ch=(8+R()*18)*s,cw=(4+R()*5)*s,cc=pick(R,[a,'#2de2ff','#b98cff','#ff9ad8']);c.fillStyle=cc;c.globalAlpha=.85;c.beginPath();c.moveTo(x2-cw,gy+3*s);c.lineTo(x2-cw*.6,gy-ch*.6);c.lineTo(x2,gy-ch);c.lineTo(x2+cw*.6,gy-ch*.55);c.lineTo(x2+cw,gy+3*s);c.closePath();c.fill();c.globalAlpha=1;c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.moveTo(x2-cw*.3,gy);c.lineTo(x2,gy-ch*.9);c.lineTo(x2,gy);c.closePath();c.fill();}else tuft(x2,rgba(a,.5),8*s);}
      else if(kind==='ember'){c.fillStyle=tint(fl,-.35);c.beginPath();c.ellipse(x2,gy+1*s,(6+R()*8)*s,(3+R()*3)*s,0,Math.PI,0);c.fill();if(R()<.5){c.fillStyle='rgba(255,140,40,.85)';c.beginPath();c.arc(x2+(R()-.5)*8*s,gy-1*s,(1.2+R()*1.8)*s,0,7);c.fill();c.fillStyle='rgba(255,90,20,.35)';c.fillRect(x2-10*s,gy+3*s,20*s,1.4*s);}}
      else if(kind==='reeds'){c.strokeStyle=tint(lip,-.25);c.lineWidth=1.8*s;var rh=(16+R()*22)*s;c.beginPath();c.moveTo(x2,gy+2*s);c.quadraticCurveTo(x2+3*s,gy-rh*.5,x2+(R()-.5)*6*s,gy-rh);c.stroke();if(R()<.5){c.fillStyle='#6a4a2a';c.beginPath();c.ellipse(x2+1*s,gy-rh*.8,2*s,5*s,0,0,7);c.fill();}tuft(x2+10*s,tint(lip,-.1),9*s);}
      else if(kind==='snow'){c.fillStyle='#ffffff';c.beginPath();c.ellipse(x2,gy+1*s,(8+R()*12)*s,(3+R()*3)*s,0,Math.PI,0);c.fill();if(R()<.3){c.fillStyle='#2a5a3a';c.beginPath();c.moveTo(x2+12*s,gy+2*s);c.lineTo(x2+17*s,gy-14*s);c.lineTo(x2+22*s,gy+2*s);c.fill();c.fillStyle='#fff';c.beginPath();c.moveTo(x2+14*s,gy-6*s);c.lineTo(x2+17*s,gy-14*s);c.lineTo(x2+20*s,gy-6*s);c.fill();}}
      else if(kind==='shroom'){if(R()<.5){var mh=(6+R()*10)*s,mc=pick(R,['#b98cff','#2de2ff','#ff3db5','#c6ff3d']);c.fillStyle='#e8e0f8';c.fillRect(x2-1.2*s,gy-mh,2.4*s,mh+2*s);c.fillStyle=mc;c.beginPath();c.ellipse(x2,gy-mh,5*s,3.4*s,0,Math.PI,0);c.fill();c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.arc(x2-1.5*s,gy-mh-1.4*s,.9*s,0,7);c.fill();}else tuft(x2,tint(lip,-.1),8*s);}
      else if(kind==='leaves'){c.fillStyle=pick(R,['#e8702a','#ffb04a','#c8402a','#ffd23d']);c.save();c.translate(x2,gy+1*s);c.rotate(R()*3);c.beginPath();c.ellipse(0,0,4.5*s,2.2*s,0,0,7);c.fill();c.restore();tuft(x2+9*s,'#8a8a3a',7*s);}
      else if(kind==='shells'){if(R()<.4){c.fillStyle=pick(R,['#ffd0e0','#fff0d0','#ffb0a0']);c.beginPath();c.arc(x2,gy+1*s,3.6*s,Math.PI,0);c.fill();c.strokeStyle='rgba(0,0,0,.2)';c.lineWidth=.8;for(var sh=-2;sh<=2;sh++){c.beginPath();c.moveTo(x2,gy+1*s);c.lineTo(x2+sh*1.6*s,gy-2.6*s);c.stroke();}}else tuft(x2,tint(lip,-.2),10*s);}
      else if(kind==='track'){c.fillStyle=i%2?'#ffffff':'#ff3db5';c.fillRect(x2,gy+4*s,18*s,4*s);}
      else if(kind==='roof'){c.fillStyle='rgba(255,255,255,.12)';c.fillRect(x2,gy+6*s,26*s,2*s);if(R()<.15){c.fillStyle='#3a3a52';c.fillRect(x2,gy-12*s,16*s,14*s);c.fillStyle='rgba(45,226,255,.6)';c.fillRect(x2+3*s,gy-9*s,10*s,2*s);}}
      else if(kind==='rocks'){c.fillStyle=tint(fl,-.25+R()*.2);c.beginPath();c.ellipse(x2,gy+1*s,(3+R()*6)*s,(2+R()*3)*s,0,Math.PI,0);c.fill();}
      else if(kind==='puffs'){c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.arc(x2,gy,(5+R()*6)*s,Math.PI,0);c.fill();}
      else if(kind==='rug'){}}
    cv._top=top;cache[k]=cv;return cv;}
  var vig=null,grain=null;
  function vignette(){if(vig&&vig.width===W&&vig.height===H)return vig;vig=mk(W,H);var c=vig.getContext('2d'),g=c.createRadialGradient(W/2,H*.45,Math.min(W,H)*.35,W/2,H*.5,Math.max(W,H)*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(8,4,24,.42)');c.fillStyle=g;c.fillRect(0,0,W,H);return vig;}
  function grainPat(){if(grain)return grain;var cv=mk(128,128),c=cv.getContext('2d'),id=c.createImageData(128,128);for(var i=0;i<id.data.length;i+=4){var v=Math.random()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255;}c.putImageData(id,0,0);grain=ctx.createPattern(cv,'repeat');return grain;}

  /* =================== PER-FRAME PAINT =================== */
  /* PERF: the sky + haze + glow band + sun/moon are composited ONCE into an offscreen canvas and blitted
     (1 fill instead of 4-6 full-screen gradient fills per frame). Rebuilt only when the scene/size/sun-parallax
     changes, or a few times a second for scenes with a pulsing glow band. Stars twinkle live on top (cheap). */
  var SKY={cv:null,key:''};
  function skyBlit(id,sc,t,s,cx){var q=Math.max(.5,Math.min(2,(typeof VZ!=='undefined'&&VZ)||1)),pw=Math.round(W*q),ph=Math.round(H*q),key=id+'|'+pw+'|'+ph+'|'+Math.round(cx*.02)+'|'+(sc.glowBand?Math.floor(t*5):0);
    if(SKY.key!==key||!SKY.cv){if(!SKY.cv)SKY.cv=mk(pw,ph);var cv=SKY.cv;if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;}
      var keep=ctx;ctx=cv.getContext('2d');try{ctx.setTransform(q,0,0,q,0,0);ctx.clearRect(0,0,W,H);skyLayers(sc,t,s,cx);}finally{ctx=keep;}SKY.key=key;}
    ctx.drawImage(SKY.cv,0,0,W,H);}
  function skyLayers(sc,t,s,cx){
    var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,sc.sky[0]);g.addColorStop(.55,sc.sky[1]);g.addColorStop(1,sc.sky[2]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    if(sc.haze){var hz=ctx.createLinearGradient(0,H*.45,0,H);hz.addColorStop(0,rgba(sc.haze,0));hz.addColorStop(1,rgba(sc.haze,.22));ctx.fillStyle=hz;ctx.fillRect(0,H*.45,W,H*.55);}
    if(sc.glowBand){var gb=ctx.createRadialGradient(W*.4,H*.95,10,W*.4,H*.95,Math.max(W,H)*.7);gb.addColorStop(0,'rgba(255,120,40,'+(.32+Math.sin(t*1.3)*.05)+')');gb.addColorStop(1,'rgba(255,60,20,0)');ctx.fillStyle=gb;ctx.fillRect(0,0,W,H);}
    if(sc.rainbow){ctx.save();ctx.globalAlpha=.28;ctx.lineWidth=14*s;['#ff5a7a','#ffb03d','#ffe27a','#7affb0','#8af0ff','#b98cff'].forEach(function(col,k){ctx.strokeStyle=col;ctx.beginPath();ctx.arc(W*.62-cx*.02,H*.95,H*.62-k*14*s,Math.PI*1.05,Math.PI*1.95);ctx.stroke();});ctx.restore();}
    if(sc.sun){var su=sc.sun,sxp=W*su.x-cx*.02,syp=H*su.y,sr=Math.min(W,H)*su.r;var sg=ctx.createRadialGradient(sxp,syp,sr*.5,sxp,syp,sr*3.2);sg.addColorStop(0,rgba(su.c[0],.45));sg.addColorStop(1,rgba(su.c[0],0));ctx.fillStyle=sg;ctx.fillRect(sxp-sr*3.2,syp-sr*3.2,sr*6.4,sr*6.4);
      var sf=ctx.createLinearGradient(0,syp-sr,0,syp+sr);sf.addColorStop(0,su.c[0]);sf.addColorStop(1,su.c[1]);ctx.fillStyle=sf;ctx.beginPath();ctx.arc(sxp,syp,sr,0,7);ctx.fill();
      if(su.stripes){ctx.save();ctx.beginPath();ctx.arc(sxp,syp,sr+1,0,7);ctx.clip();ctx.fillStyle=g;for(var k=0;k<6;k++){var yy=syp+sr*(.12+k*.15),hh=2+k*1.6;ctx.fillRect(sxp-sr-2,yy,sr*2+4,hh);}ctx.restore();}}
    if(sc.moon){var mo=sc.moon,mx=W*mo.x-cx*.02,my=H*mo.y,mr=Math.min(W,H)*mo.r;var mg=ctx.createRadialGradient(mx,my,mr*.6,mx,my,mr*3.5);mg.addColorStop(0,rgba(mo.tint||mo.c,.3));mg.addColorStop(1,rgba(mo.tint||mo.c,0));ctx.fillStyle=mg;ctx.fillRect(mx-mr*3.5,my-mr*3.5,mr*7,mr*7);
      var mf=ctx.createRadialGradient(mx-mr*.3,my-mr*.3,mr*.1,mx,my,mr);mf.addColorStop(0,'#ffffff');mf.addColorStop(1,mo.c);ctx.fillStyle=mf;ctx.beginPath();ctx.arc(mx,my,mr,0,7);ctx.fill();
      ctx.fillStyle='rgba(120,110,160,.18)';[[.3,-.2,.22],[-.35,.25,.16],[.1,.4,.12]].forEach(function(q){ctx.beginPath();ctx.arc(mx+q[0]*mr,my+q[1]*mr,q[2]*mr,0,7);ctx.fill();});}}
  function paint(id,opt){var sc=S[id]||S.meadow,t=performance.now()*.001,s=scaleOf(),cx=camera.x||0,floorY=WORLD_H-60-(camera.y||0),i,n;
    var fast=!!(opt&&opt.fast),lite=!!perfMode||fast;
    skyBlit(id,sc,t,s,cx);
    /* stars (live twinkle, drawn over the cached sky; skipped where the sun/moon disc sits) */
    if(sc.stars){n=lite?sc.stars*.4|0:sc.stars;ctx.fillStyle='#ffffff';for(i=0;i<n;i++){var sx=fr(i*.6180339+.13)*W,sy=fr(i*.7548776+.29)*H*.62;ctx.globalAlpha=.25+.75*Math.abs(Math.sin(t*(.6+fr(i*.37))+i));var sz=i%9===0?2.2:(i%3===0?1.5:1);ctx.fillRect(sx-cx*.01%W,sy,sz,sz);}ctx.globalAlpha=1;}
    /* extras behind layers */
    (sc.extras||[]).forEach(function(e){if(BACK[e])BACK[e](sc,t,s,cx);});
    /* clouds */
    if(sc.clouds){var cl=sc.clouds;for(i=0;i<cl.n;i++){var sp=cloudSprite(sc,i%4),cw=sp.width*s,span=W+cw*2;var x=((fr(i*.381+.2)*span+t*(6+i*2)-cx*.04)%span+span)%span-cw,y=H*(cl.y[0]+fr(i*.618)*(cl.y[1]-cl.y[0]));ctx.globalAlpha=cl.a;ctx.drawImage(sp,x,y,cw,sp.height*s);}ctx.globalAlpha=1;}
    /* parallax strips */
    sc.layers.forEach(function(L,li){var cv=strip(id,li,L),tw=TW*s,th=L.h*s,base=H*.995+(floorY-H*.995)*Math.min(1,L.par*1.6)+(L.dy||0)*s;if(base-th>H)return;var off=-((cx*L.par)%tw);if(off>0)off-=tw;for(var x=off;x<W;x+=tw)ctx.drawImage(cv,x,base-th,tw,th);});
    /* themed ground band (replaces the flat glossy floor slab) */
    if(floorY<H+4&&sc.floor){var gt=sc.floor,lip=sc.lip||tint(gt,.35),gy=floorY;var gg=ctx.createLinearGradient(0,gy,0,Math.min(H,gy+120));gg.addColorStop(0,tint(gt,.06));gg.addColorStop(1,tint(gt,-.5));ctx.fillStyle=gg;ctx.fillRect(0,gy,W,H-gy+2);
      var sR=rng(7),gw=TW*s,go=-((cx)%gw);if(go>0)go-=gw;ctx.fillStyle='rgba(0,0,0,.14)';for(var d=0;d<70;d++){var dx=sR()*gw,dy=gy+14+sR()*50,dr=(1.5+sR()*3)*s;for(var ox=go;ox<W;ox+=gw){ctx.beginPath();ctx.ellipse(ox+dx,dy,dr*1.6,dr,0,0,7);ctx.fill();}}
      ctx.fillStyle=lip;ctx.fillRect(0,gy,W,7*s);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,gy,W,1.5);
      if(sc.floorGlow){ctx.save();ctx.shadowColor=sc.floorGlow;ctx.shadowBlur=14;ctx.fillStyle=rgba(sc.floorGlow,.7);ctx.fillRect(0,gy+7*s,W,2);ctx.restore();}
      if(sc.tufts){ctx.fillStyle=lip;for(var tx=go;tx<W+gw;tx+=18*s){ctx.beginPath();ctx.moveTo(tx,gy+6*s);ctx.lineTo(tx+4*s,gy-3*s-((tx*7|0)%5));ctx.lineTo(tx+8*s,gy+6*s);ctx.fill();}}}
    /* NEW: world-locked ground detail strip (pebbles, tufts, flowers, crystals, embers…) so every floor reads as a real place */
    if(floorY<H+4&&sc.floor&&!sc._noDetail){var gs=groundStrip(id,sc,s),gw2=gs.width,go2=-((cx)%gw2);if(go2>0)go2-=gw2;for(var gx2=go2;gx2<W;gx2+=gw2)ctx.drawImage(gs,gx2,floorY-gs._top);}
    /* extras in front of layers + particles */
    (sc.extras||[]).forEach(function(e){if(FRONT[e])FRONT[e](sc,t,s,cx);});
    (sc.fx||[]).forEach(function(f){if(FX[f.p])FX[f.p](f,t,s,cx,lite);});
    /* finish: vignette + subtle grain */
    if(!fast)ctx.drawImage(vignette(),0,0);
    if(!lite){ctx.save();ctx.globalAlpha=.035;ctx.fillStyle=grainPat();ctx.translate((t*37|0)%128,(t*53|0)%128);ctx.fillRect(-128,-128,W+256,H+256);ctx.restore();}
    applyPalette(sc);}
  function applyPalette(sc){if(sc.pal)pal=sc.pal;var f=platforms&&platforms[0];if(f&&f.kind==='rect'&&!f.deco&&f.w>=WORLD_W-2&&f.y>=WORLD_H-61&&(!f.ptype||f.ptype==='normal')&&sc.floor&&(!f.matBase||f._arenaMat)){f.wall=true;f._arenaMat=1;}}

  /* ---------- extras ---------- */
  var BACK={
    nebula:function(sc,t,s,cx){ctx.save();ctx.globalCompositeOperation='lighter';[['#9b6bff',.25,.3,260],['#ff3db5',.7,.22,220],['#2de2ff',.5,.45,200]].forEach(function(n){var x=W*n[1]-cx*.03,y=H*n[2],r=n[3]*s;var g=ctx.createRadialGradient(x,y,4,x,y,r);g.addColorStop(0,rgba(n[0],.22));g.addColorStop(1,rgba(n[0],0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);});ctx.restore();},
    planet:function(sc,t,s,cx){var x=W*.78-cx*.04,y=H*.24,r=Math.min(W,H)*.09;var g=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);g.addColorStop(0,'#ffd0f0');g.addColorStop(.5,'#b98cff');g.addColorStop(1,'#3a1a6a');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.clip();ctx.fillStyle='rgba(255,255,255,.12)';for(var b=0;b<4;b++)ctx.fillRect(x-r,y-r*.6+b*r*.35,r*2,r*.12);ctx.restore();ctx.strokeStyle='rgba(255,210,140,.75)';ctx.lineWidth=5*s;ctx.beginPath();ctx.ellipse(x,y,r*1.7,r*.42,.3,Math.PI*.05,Math.PI*.95+Math.PI);ctx.stroke();var mx=W*.2-cx*.02,my=H*.16,mr=r*.35;ctx.fillStyle='#d8d4f0';ctx.beginPath();ctx.arc(mx,my,mr,0,7);ctx.fill();ctx.fillStyle='rgba(100,90,140,.35)';ctx.beginPath();ctx.arc(mx+mr*.3,my-mr*.2,mr*.3,0,7);ctx.fill();},
    shooting:function(sc,t,s){for(var k=0;k<2;k++){var ph=(t*.25+k*.5)%1;if(ph>.12)continue;var x=W*(.2+k*.4)+ph*W*3,y=H*.08+ph*H*1.5;var g=ctx.createLinearGradient(x,y,x-90*s,y-45*s);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.strokeStyle=g;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-90*s,y-45*s);ctx.stroke();}},
    room:function(sc,t,s,cx){var fy=WORLD_H-60-(camera.y||0),k=Math.max(.55,Math.min(1,s*(Math.min(W,900)/900)*1.15)),M=roomModule(k),mw=M.width,ox=-((cx*.3)%mw);if(ox>0)ox-=mw;
      /* wallpaper: soft stripes + tiny damask, painted once as a pattern */
      ctx.fillStyle=roomPaper();ctx.save();ctx.translate(-(cx*.3)%64,0);ctx.fillRect(-64,0,W+128,fy);ctx.restore();
      var top=fy-M.height;for(var x=ox;x<W;x+=mw)ctx.drawImage(M,x,top);
      /* tall (portrait) walls: picture rail + fairy-light garland + floating shelves fill the empty upper wall */
      if(top>150*k){var ry=Math.max(70*k,top-110*k);ctx.fillStyle='#d8a27a';ctx.fillRect(0,ry,W,7*k);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,ry,W,2);ctx.fillStyle='rgba(80,40,20,.18)';ctx.fillRect(0,ry+7*k,W,3*k);
        var seg=mw/4,gx0=ox;ctx.strokeStyle='rgba(70,50,40,.55)';ctx.lineWidth=1.4;for(var gx=gx0;gx<W+seg;gx+=seg){ctx.beginPath();ctx.moveTo(gx,ry+8*k);ctx.quadraticCurveTo(gx+seg/2,ry+60*k,gx+seg,ry+8*k);ctx.stroke();
          for(var b=1;b<6;b++){var u=b/6,bx2=gx+seg*u,by2=ry+8*k+(1-Math.pow(2*u-1,2))*26*k+4*k,on=.55+.45*Math.sin(t*2.4+b*1.7+gx*.01),bc2=['#ffd23d','#ff7ab0','#8af0ff','#c6ff3d','#ffb03d'][(b+Math.round(gx/seg))%5];
            var lg2=ctx.createRadialGradient(bx2,by2,0,bx2,by2,12*k);lg2.addColorStop(0,rgba(bc2,.55*on));lg2.addColorStop(1,rgba(bc2,0));ctx.fillStyle=lg2;ctx.fillRect(bx2-12*k,by2-12*k,24*k,24*k);ctx.fillStyle=bc2;ctx.beginPath();ctx.ellipse(bx2,by2,3*k,4.2*k,0,0,7);ctx.fill();}}
        if(ry>260*k)for(var x3=ox;x3<W;x3+=mw){var shx=x3+mw*.36,shy=ry-120*k;ctx.fillStyle='#7a4a30';ctx.beginPath();ctx.roundRect(shx,shy,150*k,8*k,2);ctx.fill();ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(shx+6*k,shy+8*k,138*k,4*k);
          ctx.fillStyle='#d8785a';ctx.beginPath();ctx.roundRect(shx+14*k,shy-18*k,22*k,18*k,3);ctx.fill();ctx.fillStyle='#4aa85a';for(var lv=0;lv<5;lv++){ctx.beginPath();ctx.ellipse(shx+25*k+(lv-2)*5*k,shy-22*k-Math.abs(lv-2)*-2*k,4*k,9*k,(lv-2)*.35,0,7);ctx.fill();}
          ctx.strokeStyle='#4aa85a';ctx.lineWidth=2*k;ctx.beginPath();ctx.moveTo(shx+30*k,shy+4*k);ctx.quadraticCurveTo(shx+38*k,shy+30*k,shx+28*k,shy+52*k);ctx.stroke();
          ['#3a7ad8','#e8b03a','#d8506a'].forEach(function(bcol,bi){ctx.fillStyle=bcol;ctx.fillRect(shx+56*k+bi*10*k,shy-(30-bi*3)*k,8*k,(30-bi*3)*k);});
          var fl2=.75+.25*Math.sin(t*9+x3);ctx.fillStyle='#fff3e0';ctx.fillRect(shx+108*k,shy-20*k,10*k,20*k);var cg=ctx.createRadialGradient(shx+113*k,shy-26*k,0,shx+113*k,shy-26*k,26*k);cg.addColorStop(0,'rgba(255,200,110,'+(.5*fl2)+')');cg.addColorStop(1,'rgba(255,200,110,0)');ctx.fillStyle=cg;ctx.fillRect(shx+87*k,shy-52*k,52*k,52*k);ctx.fillStyle='#ffb03d';ctx.beginPath();ctx.ellipse(shx+113*k,shy-26*k,2.6*k,5*k*fl2,0,0,7);ctx.fill();}}
      /* live bits: drifting clouds in every window + glowing sconces + pendant lamps */
      for(var x2=ox;x2<W;x2+=mw){var wx=x2+M._win.x,wy=top+M._win.y,ww=M._win.w,wh=M._win.h;ctx.save();ctx.beginPath();ctx.rect(wx,wy,ww,wh);ctx.clip();ctx.fillStyle='rgba(255,255,255,.85)';
          for(var c=0;c<3;c++){var clx=wx+((c*ww*.45+t*9)%(ww+60))-30,cly=wy+wh*(.2+c*.22);ctx.beginPath();ctx.arc(clx,cly,10*k,0,7);ctx.arc(clx+13*k,cly+2,8*k,0,7);ctx.arc(clx-11*k,cly+3,7*k,0,7);ctx.fill();}ctx.restore();
        var sx=x2+M._sc.x,sy=top+M._sc.y,gl=ctx.createRadialGradient(sx,sy,2,sx,sy,90*k);gl.addColorStop(0,'rgba(255,214,140,'+(.42+Math.sin(t*2)*.03)+')');gl.addColorStop(1,'rgba(255,214,140,0)');ctx.fillStyle=gl;ctx.fillRect(sx-90*k,sy-90*k,180*k,180*k);
        var lx=x2+M._lamp,lg=ctx.createRadialGradient(lx,46*k,4,lx,46*k,220*k);lg.addColorStop(0,'rgba(255,230,170,.38)');lg.addColorStop(1,'rgba(255,230,170,0)');ctx.fillStyle=lg;ctx.fillRect(lx-220*k,0,440*k,300*k);
        ctx.strokeStyle='#4a2e22';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(lx,0);ctx.lineTo(lx,30*k);ctx.stroke();ctx.fillStyle='#e89a3a';ctx.beginPath();ctx.moveTo(lx-20*k,48*k);ctx.quadraticCurveTo(lx,22*k,lx+20*k,48*k);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(lx-12*k,40*k,8*k,3*k);ctx.fillStyle='#fff6d0';ctx.beginPath();ctx.arc(lx,50*k,5*k,0,7);ctx.fill();
        /* clock hands tick with real time */
        var ck=M._clk,cxk=x2+ck.x,cyk=top+ck.y,d=new Date(),hA=((d.getHours()%12)+d.getMinutes()/60)/12*6.283-1.571,mA=d.getMinutes()/60*6.283-1.571;ctx.strokeStyle='#2a1a14';ctx.lineCap='round';ctx.lineWidth=2.4*k;ctx.beginPath();ctx.moveTo(cxk,cyk);ctx.lineTo(cxk+Math.cos(hA)*ck.r*.5,cyk+Math.sin(hA)*ck.r*.5);ctx.stroke();ctx.lineWidth=1.6*k;ctx.beginPath();ctx.moveTo(cxk,cyk);ctx.lineTo(cxk+Math.cos(mA)*ck.r*.78,cyk+Math.sin(mA)*ck.r*.78);ctx.stroke();}},
    aurora:function(sc,t,s){ctx.save();ctx.globalCompositeOperation='lighter';[['#39ff7a',.18],['#2de2ff',.24],['#b98cff',.3]].forEach(function(a,k){var y0=H*a[1];var g=ctx.createLinearGradient(0,y0-20,0,y0+90*s);g.addColorStop(0,rgba(a[0],0));g.addColorStop(.3,rgba(a[0],.22));g.addColorStop(1,rgba(a[0],0));ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,y0+90*s);for(var x=0;x<=W;x+=20)ctx.lineTo(x,y0+Math.sin(x*.004+t*.4+k*1.7)*28*s+Math.sin(x*.011+t*.9)*10);ctx.lineTo(W,y0+90*s);ctx.closePath();ctx.fill();});ctx.restore();},
    gulls:function(sc,t,s){ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;for(var i=0;i<4;i++){var x=((i*380+t*(40+i*6))%(W+100))-50,y=H*(.14+i*.05)+Math.sin(t*2+i)*6,f=Math.sin(t*6+i)*4;ctx.beginPath();ctx.moveTo(x-9,y-f);ctx.quadraticCurveTo(x-4,y-5,x,y);ctx.quadraticCurveTo(x+4,y-5,x+9,y-f);ctx.stroke();}},
    birds:function(sc,t,s){BACK.gulls(sc,t,s);},
    bats:function(sc,t,s){ctx.fillStyle='#070a1c';for(var i=0;i<5;i++){var x=((i*300+t*(55+i*8))%(W+80))-40,y=H*(.16+i*.06)+Math.sin(t*3+i)*14,f=Math.sin(t*14+i)*6;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-8,y-6-f,x-15,y-f);ctx.quadraticCurveTo(x-8,y+2,x,y+3);ctx.quadraticCurveTo(x+8,y+2,x+15,y-f);ctx.quadraticCurveTo(x+8,y-6-f,x,y);ctx.fill();}},
    planes:function(sc,t,s){var x=((t*30)%(W+200))-100,y=H*.12;ctx.fillStyle=Math.sin(t*6)>0?'#ff5a7a':'#ffffff';ctx.beginPath();ctx.arc(x,y,2,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(x-6,y,1.4,0,7);ctx.fill();}
  };
  var FRONT={
    grid:function(sc,t,s,cx){var fy=WORLD_H-60-(camera.y||0);if(fy>H)return;var hy=Math.max(fy-50*s,H*.55);ctx.save();ctx.beginPath();ctx.rect(0,hy,W,H-hy);ctx.clip();ctx.fillStyle='rgba(10,4,30,.55)';ctx.fillRect(0,hy,W,H-hy);ctx.strokeStyle='rgba(255,61,181,.55)';ctx.lineWidth=1.2;var vp=W/2-cx*.2%80;for(var g=-30;g<=30;g++){var bx=W/2+g*40*s-((cx*.6)%(40*s));ctx.beginPath();ctx.moveTo(vp+(bx-vp)*.15,hy);ctx.lineTo(bx+(bx-vp)*3,H+60);ctx.stroke();}for(var r=0;r<12;r++){var q=((r+(t*.6)%1)/12),yy=hy+Math.pow(q,2)*(H-hy+40);ctx.globalAlpha=.2+.6*q;ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(W,yy);ctx.stroke();}ctx.restore();},
    rays:function(sc,t,s,cx){ctx.save();ctx.globalCompositeOperation='lighter';for(var i=0;i<5;i++){var x=W*(.1+i*.2)+Math.sin(t*.3+i)*30-cx*.05%W,w=40+i%3*30;var g=ctx.createLinearGradient(0,0,0,H*.85);g.addColorStop(0,'rgba(255,255,230,.14)');g.addColorStop(1,'rgba(255,255,230,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+w,0);ctx.lineTo(x+w-120,H*.85);ctx.lineTo(x-160,H*.85);ctx.closePath();ctx.fill();}ctx.restore();},
    lights:function(sc,t,s,cx){var cols=['#ffd23d','#ff3db5','#2de2ff','#c6ff3d','#ff9a3d'];for(var r=0;r<2;r++){var y0=H*(.06+r*.07),sag=40*s,span=W/2,off=-(cx*.3%span);for(var seg=-1;seg<3;seg++){var x0=off+seg*span;ctx.strokeStyle='rgba(20,10,40,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(x0+span/2,y0+sag*2,x0+span,y0);ctx.stroke();
      for(var b=1;b<12;b++){var q=b/12,bx=x0+span*q,by=y0+sag*2*2*q*(1-q),col=cols[(b+r+seg*3+99)%cols.length],on=.6+.4*Math.sin(t*3+b+r);ctx.save();ctx.globalAlpha=on;ctx.shadowColor=col;ctx.shadowBlur=12;ctx.fillStyle=col;ctx.beginPath();ctx.arc(bx,by+4,3.4*s,0,7);ctx.fill();ctx.restore();}}}},
    bunting:function(sc,t,s,cx){var cols=['#c6ff3d','#ff3db5','#2de2ff','#ffd23d','#ffffff'],span=W/1.5,y0=H*.04,off=-(cx*.35%span);for(var seg=-1;seg<3;seg++){var x0=off+seg*span;ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(x0+span/2,y0+70*s,x0+span,y0);ctx.stroke();for(var b=1;b<16;b++){var q=b/16,bx=x0+span*q,by=y0+70*s*2*q*(1-q),sw=Math.sin(t*3+b)*2;ctx.fillStyle=cols[(b+seg*2+50)%cols.length];ctx.beginPath();ctx.moveTo(bx-8*s,by);ctx.lineTo(bx+8*s,by);ctx.lineTo(bx+sw,by+18*s);ctx.closePath();ctx.fill();}}},
    lightning:function(sc,t){var ph=t%9;if(ph<.35){ctx.fillStyle='rgba(200,220,255,'+(ph<.08||(ph>.18&&ph<.24)?.32:.08)+')';ctx.fillRect(0,0,W,H);}},
    scan:function(sc,t){ctx.fillStyle='rgba(45,226,255,.035)';for(var y=(t*40)%4;y<H;y+=4)ctx.fillRect(0,y,W,1);}
  };
  /* ---------- particles (stateless, time-driven) ---------- */
  function N(f,lite){return lite?Math.ceil(f.n*.4):f.n;}
  var FX={
    fireflies:function(f,t,s,cx,lite){ctx.save();ctx.globalCompositeOperation='lighter';for(var i=0,n=N(f,lite);i<n;i++){var x=((fr(i*.618+.1)*W+Math.sin(t*.3+i)*50-cx*.25)%W+W)%W,y=H*(.3+.62*fr(i*.382+.5))+Math.sin(t*.8+i*1.3)*22,a=.35+.65*Math.abs(Math.sin(t*2+i));var g=ctx.createRadialGradient(x,y,0,x,y,8*s);g.addColorStop(0,rgba(f.col,a));g.addColorStop(1,rgba(f.col,0));ctx.fillStyle=g;ctx.fillRect(x-8*s,y-8*s,16*s,16*s);}ctx.restore();},
    sparkles:function(f,t,s,cx,lite){ctx.fillStyle=f.col;for(var i=0,n=N(f,lite);i<n;i++){var x=((fr(i*.618+.3)*W-cx*.2)%W+W)%W,y=f.low?H*(.55+.4*fr(i*.382)):H*fr(i*.382+.2)*.8,a=Math.max(0,Math.sin(t*1.7+i*2.3)),r=(1.5+2.5*a)*s;if(a<.05)continue;ctx.globalAlpha=a;ctx.beginPath();ctx.moveTo(x,y-r*2);ctx.lineTo(x+r*.4,y-r*.4);ctx.lineTo(x+r*2,y);ctx.lineTo(x+r*.4,y+r*.4);ctx.lineTo(x,y+r*2);ctx.lineTo(x-r*.4,y+r*.4);ctx.lineTo(x-r*2,y);ctx.lineTo(x-r*.4,y-r*.4);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;},
    embers:function(f,t,s,cx,lite){ctx.save();ctx.globalCompositeOperation='lighter';for(var i=0,n=N(f,lite);i<n;i++){var sp=30+fr(i*.77)*60,y=H-((t*sp+fr(i*.618)*H*1.2)%(H*1.2)),x=((fr(i*.382)*W+Math.sin(t*1.2+i)*24-cx*.3)%W+W)%W,a=Math.min(1,y/H+.2);ctx.fillStyle=i%3?rgba(f.col,a*.9):rgba('#ffe27a',a);ctx.fillRect(x,y,2.2*s,3.4*s);}ctx.restore();},
    ash:function(f,t,s,cx,lite){ctx.fillStyle=rgba(f.col,.4);for(var i=0,n=N(f,lite);i<n;i++){var y=((t*14+fr(i*.618)*H)%H),x=((fr(i*.41)*W+Math.sin(t*.6+i)*30-cx*.2)%W+W)%W;ctx.fillRect(x,y,2,2);}},
    snow:function(f,t,s,cx,lite){ctx.fillStyle='#ffffff';for(var i=0,n=N(f,lite);i<n;i++){var sp=24+fr(i*.77)*40,y=((t*sp+fr(i*.618)*H)%(H+20))-10,x=((fr(i*.382)*W+Math.sin(t*.7+i)*26-cx*(.1+fr(i*.3)*.3))%W+W)%W,r=(1+fr(i*.53)*2.4)*s;ctx.globalAlpha=.5+.5*fr(i*.29);ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();}ctx.globalAlpha=1;},
    petals:function(f,t,s,cx,lite){for(var i=0,n=N(f,lite);i<n;i++){var sp=20+fr(i*.77)*30,y=((t*sp+fr(i*.618)*H)%(H+20))-10,x=((fr(i*.382)*W+Math.sin(t*.9+i)*40-t*18-cx*.25)%W+W)%W;ctx.save();ctx.translate(x,y);ctx.rotate(t*1.5+i);ctx.scale(1,.55+.45*Math.sin(t*3+i));ctx.fillStyle=i%3?'#ffb8d0':'#ffe0ec';ctx.beginPath();ctx.ellipse(0,0,4.5*s,2.6*s,0,0,7);ctx.fill();ctx.restore();}},
    leaves:function(f,t,s,cx,lite){var cols=['#6ac84a','#a8e05a','#ffc04a'];for(var i=0,n=N(f,lite);i<n;i++){var sp=18+fr(i*.77)*24,y=((t*sp+fr(i*.618)*H)%(H+20))-10,x=((fr(i*.382)*W+Math.sin(t*.8+i)*50-cx*.25)%W+W)%W;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2+i)*1.2);ctx.fillStyle=cols[i%3];ctx.beginPath();ctx.ellipse(0,0,5*s,2.4*s,0,0,7);ctx.fill();ctx.restore();}},
    butterflies:function(f,t,s,cx,lite){var cols=['#ff9ac8','#ffd23d','#8af0ff','#b98cff'];for(var i=0;i<f.n;i++){var x=((fr(i*.618)*W+t*(14+i*3)+Math.sin(t*.7+i)*60-cx*.35)%W+W)%W,y=H*(.45+.35*fr(i*.382))+Math.sin(t*1.6+i)*30,fl=Math.abs(Math.sin(t*12+i));ctx.fillStyle=cols[i%4];ctx.beginPath();ctx.ellipse(x-3*s,y,4*s*fl+1,3*s,-.4,0,7);ctx.ellipse(x+3*s,y,4*s*fl+1,3*s,.4,0,7);ctx.fill();}},
    bubbles:function(f,t,s,cx,lite){ctx.strokeStyle=rgba(f.col,.55);ctx.lineWidth=1.3;for(var i=0,n=N(f,lite);i<n;i++){var sp=20+fr(i*.77)*40,y=H-((t*sp+fr(i*.618)*H)%(H+20)),x=((fr(i*.382)*W+Math.sin(t*1.4+i)*12-cx*.3)%W+W)%W,r=(2+fr(i*.53)*5)*s;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.arc(x-r*.35,y-r*.35,r*.25,0,7);ctx.fill();}},
    spores:function(f,t,s,cx,lite){ctx.save();ctx.globalCompositeOperation='lighter';for(var i=0,n=N(f,lite);i<n;i++){var y=H-((t*(8+fr(i*.7)*12)+fr(i*.618)*H)%H),x=((fr(i*.382)*W+Math.sin(t*.5+i)*30-cx*.3)%W+W)%W;ctx.fillStyle=rgba(f.col,.35+.4*Math.abs(Math.sin(t+i)));ctx.beginPath();ctx.arc(x,y,1.8*s,0,7);ctx.fill();}ctx.restore();},
    motes:function(f,t,s,cx,lite){FX.spores(f,t,s,cx,lite);},
    rain:function(f,t,s,cx,lite){ctx.strokeStyle=rgba(f.col,.38);ctx.lineWidth=1.2;ctx.beginPath();for(var i=0,n=N(f,lite);i<n;i++){var y=((t*(520+fr(i*.7)*200)+fr(i*.618)*H)%(H+30))-30,x=((fr(i*.382)*W-t*60-cx*.4)%W+W)%W;ctx.moveTo(x,y);ctx.lineTo(x-4*s,y+16*s);}ctx.stroke();},
    dust:function(f,t,s,cx,lite){ctx.fillStyle=rgba(f.col,.45);for(var i=0,n=N(f,lite);i<n;i++){var x=((fr(i*.382)*W+t*(30+fr(i*.7)*40)-cx*.4)%W+W)%W,y=H*(.4+.55*fr(i*.618))+Math.sin(t+i)*10;ctx.fillRect(x,y,2*s,1.4*s);}},
    confetti:function(f,t,s,cx,lite){var cols=['#ff3db5','#2de2ff','#ffd23d','#c6ff3d','#b98cff','#ffffff'];for(var i=0,n=N(f,lite);i<n;i++){var y=((t*(40+fr(i*.7)*40)+fr(i*.618)*H)%(H+20))-10,x=((fr(i*.382)*W+Math.sin(t+i)*30-cx*.3)%W+W)%W;ctx.save();ctx.translate(x,y);ctx.rotate(t*3+i);ctx.fillStyle=cols[i%6];ctx.fillRect(-3*s,-1.5*s,6*s,3*s*Math.abs(Math.cos(t*4+i)));ctx.restore();}},
    speed:function(f,t,s,cx,lite){for(var i=0,n=N(f,lite);i<n;i++){var len=60+fr(i*.7)*120,x=W-((t*(500+fr(i*.3)*300)+fr(i*.618)*W*2)%(W*2)),y=H*(.1+.8*fr(i*.382));var g=ctx.createLinearGradient(x,0,x+len,0);g.addColorStop(0,rgba(f.col,.22));g.addColorStop(1,rgba(f.col,0));ctx.fillStyle=g;ctx.fillRect(x,y,len,1.6);}},
    fish:function(f,t,s,cx,lite){var cols=['#ffb03d','#ff5a7a','#ffd23d','#8af0ff','#b98cff'];for(var i=0;i<f.n;i++){var dir=i%2?1:-1,sp=20+fr(i*.7)*30,span=W+80,x=dir>0?((t*sp+fr(i*.618)*span-cx*.2)%span+span)%span-40:W-(((t*sp+fr(i*.618)*span+cx*.2)%span+span)%span)+40,y=H*(.2+.5*fr(i*.382))+Math.sin(t*1.5+i)*10,r=(6+fr(i*.53)*5)*s;ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.fillStyle=cols[i%5];ctx.beginPath();ctx.ellipse(0,0,r,r*.55,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(-r*.8,0);ctx.lineTo(-r*1.6,-r*.55+Math.sin(t*10+i)*2);ctx.lineTo(-r*1.6,r*.55+Math.sin(t*10+i)*2);ctx.closePath();ctx.fill();ctx.fillStyle='#101018';ctx.beginPath();ctx.arc(r*.45,-r*.1,r*.14,0,7);ctx.fill();ctx.restore();}}
  };

  /* =================== HOOPS: court floor on top of the rooftop scene =================== */
  function hoopsCourt(){paint('rooftop');var cx=camera.x,floorTop=WORLD_H-60-camera.y;if(floorTop>H)return;
    var fg=ctx.createLinearGradient(0,floorTop,0,H);fg.addColorStop(0,'#d8914a');fg.addColorStop(1,'#8a531f');ctx.fillStyle=fg;ctx.fillRect(0,floorTop,W,H-floorTop);
    for(var px=-(cx%46),k=Math.floor(cx/46);px<W;px+=46,k++){ctx.fillStyle=k%2?'rgba(0,0,0,.05)':'rgba(255,255,255,.04)';ctx.fillRect(px,floorTop,46,H-floorTop);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(px,floorTop,1,H-floorTop);}
    var sh=ctx.createLinearGradient(0,floorTop,0,floorTop+30);sh.addColorStop(0,'rgba(255,240,210,.35)');sh.addColorStop(1,'rgba(255,240,210,0)');ctx.fillStyle=sh;ctx.fillRect(0,floorTop,W,30);
    ctx.strokeStyle='rgba(255,246,225,.7)';ctx.lineWidth=3;var midX=WORLD_W/2-cx;ctx.beginPath();ctx.moveTo(midX,floorTop);ctx.lineTo(midX,H);ctx.stroke();
    ctx.save();ctx.shadowColor='#ff7a1a';ctx.shadowBlur=14;ctx.beginPath();ctx.ellipse(midX,floorTop+(H-floorTop)*.5,52,Math.max(8,(H-floorTop)*.28),0,0,7);ctx.stroke();ctx.restore();
    ctx.strokeRect(2-cx,floorTop+4,WORLD_W-4,H);}

  /* =================== HOOK INTO THE GAME =================== */
  var legacyDrawBG=drawBG;
  drawBG=function(){
    try{
      if(STATE==='title'){paint(MODE.title);return;}
      if(gameMode==='zen'){if(S[zenEnv]){paint(zenEnv);return;}return legacyDrawBG();}
      if(gameMode==='hoops'){hoopsCourt();return;}
      paint(MODE[gameMode]||'meadow');
    }catch(e){try{legacyDrawBG();}catch(x){}}
  };
  /* ---- zen: register brand-new scenes + nicer names ---- */
  ZEN_NEW.forEach(function(k){ENV[k]={sky:[S[k].sky[0],S[k].sky[2]],name:S[k].name};});
  ENV_ICON.sakura='🌸';ENV_ICON.clouds='☁';ENV_ICON.aurora='🌠';ENV_ICON.shrooms='🍄';ENV_ICON.autumn='🍂';ENV_ICON.lagoon='🌴';ZEN_NEW.forEach(function(k){ENV_NAME[k]=S[k].name;});ENV_NAME.forest='Sunny Forest';ENV_NAME.beach='Tropical Beach';ENV_NAME.underwater='Coral Reef';
  function addMenus(){var menu=document.getElementById('zen-env-menu');
    if(menu){[].forEach.call(menu.querySelectorAll('button[data-env]'),function(b){var k=b.dataset.env;b.innerHTML='<span>'+(ENV_ICON[k]||'')+'</span> '+(ENV_NAME[k]||k)+(ZEN_NEW.indexOf(k)>=0?' <em class="env-new">NEW</em>':'');});
      ZEN_NEW.forEach(function(k){if(menu.querySelector('[data-env="'+k+'"]'))return;var b=document.createElement('button');b.dataset.env=k;b.setAttribute('role','menuitem');b.setAttribute('data-testid','zen-env-'+k);b.innerHTML='<span>'+ENV_ICON[k]+'</span> '+ENV_NAME[k]+' <em class="env-new">NEW</em>';b.addEventListener('click',function(e){e.stopPropagation();setZenEnv(k);closeEnvMenu();});menu.insertBefore(b,menu.firstChild);});}
    var row=document.getElementById('env-row');
    if(row)ZEN_NEW.forEach(function(k){if(row.querySelector('[data-env="'+k+'"]'))return;var b=document.createElement('button');b.className='lbtn';b.dataset.env=k;b.setAttribute('data-testid','env-row-'+k);b.textContent=ENV_ICON[k]+' '+ENV_NAME[k];b.addEventListener('click',function(){setZenEnv(k);});row.appendChild(b);});
    try{syncEnvButtons();}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addMenus);else addMenus();
  window.addEventListener('resize',function(){vig=null;});
  return {start:function(m,env){if(env){try{setZenEnv(env,true);}catch(e){}}setMode(m);startGame();},scenes:S,modeScene:MODE,paint:paint,fx:FX,front:FRONT,legacy:function(){return legacyDrawBG();},sceneFor:function(m){return MODE[m];}};
})();
window.FreaArenas=Arenas;
