/* =====================================================================
   COSMETICS 3.0 — every hair style redrawn (soft, layered, detailed, with
   gentle motion) and head-wear refitted so it CONFORMS to the flea's body:
   · hair is built from the flea's own body ellipse (rx/ry per shape) so it
     wraps the head like a real hairline instead of floating on top
   · long hair / locs / tails are drawn BEHIND the body (back layer) and
     peek out around the silhouette
   · hats are scaled to the head width, sit on top of the hair volume and
     the beanie / cap / beret / propeller / headphones / ears are redrawn
     to hug the head curve
   · hair sways with movement, bounces on landing and idles softly
   ===================================================================== */
(function(){
  if(typeof Flea==='undefined')return;
  var P=Flea.prototype,CY=-1,PI=Math.PI,INK='rgba(28,14,48,.5)',EL=-2.6,ER=6.4,EY=-3.4;
  function L(c,a){try{return lighten(c,a);}catch(e){return c;}}
  function D(c,a){try{return darken(c,a);}catch(e){return c;}}
  function A(c,a){try{return rgbaOf(c,a);}catch(e){return c;}}
  function acc(f){var s=f.secondary||'#ff3db5';return /^#[0-9a-f]{6}$/i.test(s)?s:'#ff3db5';}
  function geo(f){var s=SHAPES[f.shape]||SHAPES.round;return {rx:s.rx,ry:s.ry,top:CY-s.ry,hl:Math.min(CY-s.ry*.7,-9.2)};}
  function E(g,a,d){return [Math.cos(a)*(g.rx+d),CY+Math.sin(a)*(g.ry+d)];}
  function hash(n){var x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
  function ink(w,c){ctx.strokeStyle=c||INK;ctx.lineWidth=w||.7;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
  function clamp(v,a,b){return v<a?a:v>b?b:v;}
  function pal(f){var c=f.hairColor||'#2a1a2a';if(!/^#[0-9a-f]{6}$/i.test(c))c='#2a1a2a';return {c:c,hi:L(c,.4),hi2:L(c,.72),lo:D(c,.3),lo2:D(c,.55)};}

  /* ---------- motion: sway with speed, spring-bounce on vertical changes, idle breathing ---------- */
  function motion(f){var now=performance.now(),m=f._hm||(f._hm={sw:0,b:0,vb:0,t:now,seed:Math.random()*100});
    var dt=Math.min(50,now-m.t)/16.7;m.t=now;var fd=f.face<0?-1:1,vx=(f.vx||0)*fd,vy=f.vy||0;
    var tgt=clamp(-vx*.05,-.45,.45)+Math.sin(now*.0018+m.seed)*.05;m.sw+=(tgt-m.sw)*Math.min(1,.12*dt);
    var tb=clamp(vy*.06,-1,1);m.vb+=((tb-m.b)*.18-m.vb*.22)*dt;m.b=clamp(m.b+m.vb*dt,-1.2,1.2);
    m.idle=Math.sin(now*.0024+m.seed);return m;}

  /* ---------- shared painters ---------- */
  function vgrad(g,p,y0,y1){var gr=ctx.createLinearGradient(-g.rx*.3,y0,g.rx*.2,y1);gr.addColorStop(0,p.hi);gr.addColorStop(.45,p.c);gr.addColorStop(1,p.lo);return gr;}
  /* hair mass that wraps the head: outer shell (body ellipse + d) from the back to the front temple, closed by a hairline */
  function mass(g,d,back,front,o){o=o||{};var a0=-PI-back,a1=-front,p0=E(g,a0,d),p1=E(g,a1,d),hl=g.hl+(o.hl||0);
    ctx.beginPath();ctx.moveTo(p0[0],p0[1]);ctx.ellipse(0,CY,g.rx+d,g.ry+d,0,a0,a1,false);
    ctx.quadraticCurveTo(p1[0]-1.2,hl+1.4,g.rx*.3,hl);ctx.quadraticCurveTo(-g.rx*.35,hl-1.2,-g.rx*.78,p0[1]-1.5);ctx.closePath();}
  function sheen(g,d,al,cx){al=al||.3;ctx.save();ctx.lineCap='round';var x=cx==null?-.6:cx;
    ctx.strokeStyle='rgba(255,255,255,'+al+')';ctx.lineWidth=2.1;ctx.beginPath();ctx.ellipse(x,CY+.6,(g.rx+d)*.82,(g.ry+d)*.82,0,-PI*.86,-PI*.6);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,'+Math.min(.9,al+.28)+')';ctx.lineWidth=.75;ctx.beginPath();ctx.ellipse(x,CY+.6,(g.rx+d)*.82,(g.ry+d)*.82,0,-PI*.8,-PI*.68);ctx.stroke();ctx.restore();}
  function stipple(g,p,seed,n){for(var i=0;i<(n||46);i++){var x=(hash(seed+i)-.5)*g.rx*2.2,y=g.top-2+hash(seed+i*1.7)*g.ry*1.2;ctx.fillStyle=A(i%2?p.hi2:p.lo2,i%2?.35:.4);ctx.beginPath();ctx.arc(x,y,.38,0,7);ctx.fill();}}
  function paintMass(g,p,d,back,front,o){o=o||{};var n=o.n==null?11:o.n;
    if(o.alpha)ctx.globalAlpha=o.alpha;
    mass(g,d,back,front,o);ctx.fillStyle=vgrad(g,p,g.top-d,g.top+g.ry*1.1);ctx.fill();
    ctx.save();mass(g,d,back,front,o);ctx.clip();
    /* soft shadow along the hairline so the hair reads as layered on top of the head */
    ctx.strokeStyle=A(p.lo2,.35);ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-g.rx*.78,E(g,-PI-back,d)[1]-1.5);ctx.quadraticCurveTo(-g.rx*.35,g.hl-1.2+(o.hl||0),g.rx*.3,g.hl+(o.hl||0));ctx.stroke();
    var cx=o.cx==null?-g.rx*.18:o.cx,cy=o.cy==null?g.top-d*.4+1.2:o.cy;ctx.lineCap='round';
    for(var i=0;i<n;i++){var a=-PI-back+(PI-front+back)*(i+.5)/n,q=E(g,a,d+1),mx=(cx+q[0])/2+Math.cos(a)*2.2,my=(cy+q[1])/2+Math.sin(a)*2.2;
      ctx.strokeStyle=A(p.lo2,.38);ctx.lineWidth=.85;ctx.beginPath();ctx.moveTo(cx,cy);ctx.quadraticCurveTo(mx,my,q[0],q[1]);ctx.stroke();
      ctx.strokeStyle=A(p.hi2,.24);ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(cx+.6,cy+.3);ctx.quadraticCurveTo(mx+.7,my+.5,q[0]*.93,q[1]+.6);ctx.stroke();}
    if(o.tex)o.tex();
    if(!o.noSheen)sheen(g,d,o.sheen);
    ctx.restore();mass(g,d,back,front,o);ink(.7);if(o.alpha)ctx.globalAlpha=1;}
  /* tapered tress / lock / braid / twist along a quadratic curve */
  function tress(x0,y0,len,w,ang,bend,p,style,tip){var N=12,pts=[],ex=x0+Math.sin(ang)*len,ey=y0+Math.cos(ang)*len,mx=(x0+ex)/2+Math.cos(ang)*bend,my=(y0+ey)/2-Math.sin(ang)*bend;
    for(var i=0;i<=N;i++){var t=i/N,u=1-t,x=u*u*x0+2*u*t*mx+t*t*ex,y=u*u*y0+2*u*t*my+t*t*ey,dx=2*u*(mx-x0)+2*t*(ex-mx),dy=2*u*(my-y0)+2*t*(ey-my),l=Math.hypot(dx,dy)||1;pts.push([x,y,-dy/l,dx/l,t]);}
    var keep=style==='strand'?.22:style==='curl'?.3:.78;function W(q){return w*(1-q[4]*(1-keep))*.5;}
    ctx.beginPath();pts.forEach(function(q,i){var ww=W(q);if(i)ctx.lineTo(q[0]+q[2]*ww,q[1]+q[3]*ww);else ctx.moveTo(q[0]+q[2]*ww,q[1]+q[3]*ww);});
    for(var j=N;j>=0;j--){var q=pts[j],ww=W(q);ctx.lineTo(q[0]-q[2]*ww,q[1]-q[3]*ww);}ctx.closePath();
    var gr=ctx.createLinearGradient(x0,y0,ex,ey);gr.addColorStop(0,p.lo);gr.addColorStop(.35,p.c);gr.addColorStop(1,style==='strand'?p.hi:p.c);ctx.fillStyle=gr;ctx.fill();ink(.55);
    ctx.lineCap='round';
    for(var k=1;k<N;k++){var a=pts[k],b=pts[k+1],wa=W(a),wb=W(b);
      if(style==='loc'){ctx.strokeStyle=A(p.lo2,.5);ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(a[0]+a[2]*wa*.9,a[1]+a[3]*wa*.9);ctx.quadraticCurveTo(a[0]+a[3]*1.2,a[1]-a[2]*1.2,a[0]-a[2]*wa*.9,a[1]-a[3]*wa*.9);ctx.stroke();}
      else if(style==='braid'){if(k%2)continue;ctx.strokeStyle=A(p.lo2,.6);ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(a[0]+a[2]*wa,a[1]+a[3]*wa);ctx.lineTo(b[0],b[1]);ctx.lineTo(a[0]-a[2]*wa,a[1]-a[3]*wa);ctx.stroke();}
      else if(style==='twist'){ctx.strokeStyle=A(p.lo2,.55);ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(a[0]+a[2]*wa,a[1]+a[3]*wa);ctx.lineTo(b[0]-b[2]*wb,b[1]-b[3]*wb);ctx.stroke();}}
    /* highlight down the lit side */
    ctx.strokeStyle=A(p.hi2,.42);ctx.lineWidth=Math.max(.45,w*.16);ctx.beginPath();for(var h=1;h<N*.8;h++){var q2=pts[h],ww2=W(q2)*.45;if(h===1)ctx.moveTo(q2[0]+q2[2]*ww2,q2[1]+q2[3]*ww2);else ctx.lineTo(q2[0]+q2[2]*ww2,q2[1]+q2[3]*ww2);}ctx.stroke();
    if(style==='strand'){ctx.strokeStyle=A(p.lo2,.35);ctx.lineWidth=.45;[-.3,.25].forEach(function(o){ctx.beginPath();pts.forEach(function(q,i){var ww=W(q)*o*2;if(i)ctx.lineTo(q[0]+q[2]*ww,q[1]+q[3]*ww);else ctx.moveTo(q[0]+q[2]*ww,q[1]+q[3]*ww);});ctx.stroke();});}
    var e=pts[N];if(tip==='ball'){ctx.fillStyle=p.lo;ctx.beginPath();ctx.arc(e[0],e[1],w*keep*.55,0,7);ctx.fill();}
    else if(tip&&tip.charAt(0)==='#'){var c=pts[N-2],cw=W(c)+.5;ctx.fillStyle=tip;ctx.beginPath();ctx.moveTo(c[0]+c[2]*cw,c[1]+c[3]*cw);ctx.lineTo(c[0]-c[2]*cw,c[1]-c[3]*cw);ctx.lineTo(e[0]-e[2]*cw,e[1]-e[3]*cw);ctx.lineTo(e[0]+e[2]*cw,e[1]+e[3]*cw);ctx.closePath();ctx.fill();ink(.4);}
    return e;}
  function cloudPath(cx,cy,rx,ry,seed,n){n=n||14;ctx.beginPath();for(var i=0;i<=n;i++){var a=i/n*PI*2,b=1+.06*Math.sin(i*2.3+seed),x=cx+Math.cos(a)*rx*b,y=cy+Math.sin(a)*ry*b;if(!i)ctx.moveTo(x,y);else{var am=(i-.5)/n*PI*2;ctx.quadraticCurveTo(cx+Math.cos(am)*rx*1.13,cy+Math.sin(am)*ry*1.13,x,y);}}ctx.closePath();}
  function cloud(cx,cy,rx,ry,p,seed,n,coils){cloudPath(cx,cy,rx,ry,seed,n);var gr=ctx.createRadialGradient(cx-rx*.35,cy-ry*.4,.5,cx,cy,Math.max(rx,ry)*1.1);gr.addColorStop(0,p.hi);gr.addColorStop(.55,p.c);gr.addColorStop(1,p.lo);ctx.fillStyle=gr;ctx.fill();
    ctx.save();cloudPath(cx,cy,rx,ry,seed,n);ctx.clip();ctx.lineWidth=.55;ctx.lineCap='round';var cn=coils||Math.round(rx*ry*.16);
    for(var i=0;i<cn;i++){var a=hash(seed+i)*PI*2,r=Math.sqrt(hash(seed+i*3.1))*.92,x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;ctx.strokeStyle=A(i%3?p.lo2:p.hi2,i%3?.42:.4);ctx.beginPath();ctx.arc(x,y,.8+hash(i+seed*2)*.9,a,a+PI*1.35);ctx.stroke();}
    ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.ellipse(cx-rx*.32,cy-ry*.45,rx*.42,ry*.22,-.35,0,7);ctx.fill();ctx.restore();cloudPath(cx,cy,rx,ry,seed,n);ink(.6);}
  function coil(x,y,r,p){var gr=ctx.createRadialGradient(x-r*.4,y-r*.4,.2,x,y,r);gr.addColorStop(0,p.hi);gr.addColorStop(.6,p.c);gr.addColorStop(1,p.lo);ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ink(.5);
    ctx.strokeStyle=A(p.lo2,.6);ctx.lineWidth=.5;ctx.beginPath();for(var k=0;k<=18;k++){var a=k*.62,rr=r*.85*(k/18);ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.stroke();ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.ellipse(x-r*.35,y-r*.4,r*.32,r*.2,-.5,0,7);ctx.fill();}
  function spike(g,a,d,h,w,lean,p,tipC){var b=E(g,a,d-1.4),nx=Math.cos(a)*g.ry,ny=Math.sin(a)*g.rx,nl=Math.hypot(nx,ny);nx/=nl;ny/=nl;var tx=-ny,ty=nx,c=Math.cos(lean),s=Math.sin(lean),vx=nx*c-ny*s,vy=nx*s+ny*c,tip=[b[0]+vx*h,b[1]+vy*h];
    ctx.beginPath();ctx.moveTo(b[0]-tx*w,b[1]-ty*w);ctx.quadraticCurveTo(b[0]+vx*h*.55-tx*w*.3,b[1]+vy*h*.55-ty*w*.3,tip[0],tip[1]);ctx.quadraticCurveTo(b[0]+vx*h*.5+tx*w*.5,b[1]+vy*h*.5+ty*w*.5,b[0]+tx*w,b[1]+ty*w);ctx.closePath();
    var gr=ctx.createLinearGradient(b[0],b[1],tip[0],tip[1]);gr.addColorStop(0,p.lo);gr.addColorStop(.55,p.c);gr.addColorStop(1,tipC||p.hi);ctx.fillStyle=gr;ctx.fill();ink(.5);
    ctx.strokeStyle=A(p.hi2,.5);ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(b[0]-tx*w*.25,b[1]-ty*w*.25);ctx.quadraticCurveTo(b[0]+vx*h*.5-tx*w*.35,b[1]+vy*h*.5-ty*w*.35,tip[0]-vx*1.2,tip[1]-vy*1.2);ctx.stroke();}
  function tie(x,y,ang,c){ctx.save();ctx.translate(x,y);ctx.rotate(ang);var gr=ctx.createLinearGradient(0,-2,0,2);gr.addColorStop(0,L(c,.4));gr.addColorStop(1,D(c,.25));ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(0,0,1.6,2.6,0,0,7);ctx.fill();ink(.5);ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(-.5,-1,.45,.9,0,0,7);ctx.fill();ctx.restore();}
  /* region the hair may occupy (above the forehead, can drop lower at the back) */
  function hairZone(g,frontY){ctx.beginPath();ctx.moveTo(-60,-80);ctx.lineTo(60,-80);ctx.lineTo(60,frontY);ctx.lineTo(g.rx+1,frontY);ctx.quadraticCurveTo(g.rx*.85,g.hl+1.5,g.rx*.25,g.hl);ctx.quadraticCurveTo(-g.rx*.4,g.hl-1,-g.rx*.85,CY+g.ry*.2);ctx.lineTo(-60,CY+g.ry*.2);ctx.closePath();}

  /* ============================ HAIR STYLES ============================ */
  var LOCROOTS=[-PI-.22,-PI+.22,-PI+.66,-PI+1.1,-1.57,-1.12,-.7,-.32];
  function locsBack(f,g,p,m,len,w,style,tipC){LOCROOTS.forEach(function(a,i){var r=E(g,a,-.3),side=Math.cos(a)<0?-1:1,l=len*(.78+.32*hash(i*7.3)),ang=side*(.12+Math.abs(Math.cos(a))*.22)+m.sw*.9+m.idle*.03*side;
      tress(r[0],r[1],l,w,ang,side*1.1+m.b*1.6,p,style,tipC||(style==='loc'?'ball':null));});}
  function locsFront(f,g,p,m,len,w,style,tipC){[-2.55,-2.15,-1.78].forEach(function(a,i){var r=E(g,a,.6);tress(r[0],r[1],len*(.55+.15*i),w,-.55-i*.12+m.sw*.7,-1+m.b*1.2,p,style,tipC||(style==='loc'?'ball':null));});}
  var HAIR={
    buzz:{lift:.5,front:function(f,g,p){paintMass(g,p,.55,.12,.62,{n:0,sheen:.18,tex:function(){stipple(g,p,3,60);}});}},
    fringe:{lift:1.4,front:function(f,g,p,m){paintMass(g,p,1.3,.25,.55,{n:10});
      var y0=g.hl-2.6,xs=[-g.rx*.22,g.rx*.08,g.rx*.36,g.rx*.6,g.rx*.84],sw=m.sw*1.2;ctx.beginPath();ctx.moveTo(-g.rx*.4,y0+1);ctx.quadraticCurveTo(g.rx*.3,y0-2.2,g.rx*.98,y0+1.6);
      for(var i=xs.length-1;i>=0;i--){var tx=xs[i]+.6+sw,ty=-8.1+(i%2)*.7;ctx.quadraticCurveTo(xs[i]+2.2,y0+3,tx,ty);ctx.quadraticCurveTo(xs[i]-.4,y0+2.6,xs[i]-1.6,y0+1.4);}ctx.closePath();
      ctx.fillStyle=vgrad(g,p,y0-2,-8);ctx.fill();ink(.6);ctx.strokeStyle=A(p.hi2,.35);ctx.lineWidth=.45;xs.forEach(function(x){ctx.beginPath();ctx.moveTo(x-.6,y0);ctx.quadraticCurveTo(x+.6,y0+2,x+.4+sw,-8.6);ctx.stroke();});}},
    afro:{lift:7,front:function(f,g,p,m){ctx.save();hairZone(g,CY-g.ry*.15);ctx.clip();cloud(-.8,g.top-.8-m.b*.4,g.rx+5.6,(g.ry*.62+5.6)*(1+m.b*.03),p,4,18);ctx.restore();}},
    curls:{lift:2,front:function(f,g,p,m){paintMass(g,p,1,.3,.55,{n:7});for(var i=0;i<10;i++){var a=-PI-.32+i*(PI-.25)/9,q=E(g,a,1.5);coil(q[0],q[1]+(i<3?m.b*.6:0),2.5+hash(i)*.7,p);}}},
    afropuffs:{lift:2,front:function(f,g,p,m){paintMass(g,p,.8,.1,.6,{n:9});var s2=acc(f);[[-PI+.62,0],[-.58,1]].forEach(function(q){var c=E(g,q[0],3.4),r=g.rx*.5;cloud(c[0],c[1]-m.b*.6,r*1.05,r*(1+m.b*.04),p,q[1]*9+2,12,14);var t=[c[0]*.62,CY+(c[1]-CY)*.7];tie(t[0],t[1],q[0]+PI/2,s2);});}},
    hightop:{lift:11,front:function(f,g,p,m){paintMass(g,p,.6,.15,.6,{n:0,sheen:.15,tex:function(){stipple(g,p,7,50);}});var bl=E(g,-PI+.64,.6),br=E(g,-.64,.6),k=m.sw*2.2,h=12.5+m.b*.5;
      ctx.beginPath();ctx.moveTo(bl[0],bl[1]);ctx.lineTo(-g.rx*.84+k,g.top-h+2.5);ctx.quadraticCurveTo(-g.rx*.82+k,g.top-h,-g.rx*.56+k,g.top-h);ctx.lineTo(g.rx*.6+k,g.top-h+.3);ctx.quadraticCurveTo(g.rx*.88+k,g.top-h+.4,g.rx*.86+k,g.top-h+2.8);ctx.lineTo(br[0],br[1]);ctx.ellipse(0,CY,g.rx+.6,g.ry+.6,0,-.64,-PI+.64,true);ctx.closePath();
      ctx.fillStyle=vgrad(g,p,g.top-h,g.top+2);ctx.fill();ctx.save();ctx.clip();stipple({rx:g.rx,top:g.top-h+1,ry:h},p,11,70);ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(-g.rx+k,g.top-h,g.rx*2,1.6);ctx.fillStyle=A(p.lo2,.3);ctx.fillRect(-g.rx*1.2,g.top-1.2,g.rx*2.4,2.4);ctx.restore();
      ctx.beginPath();ctx.moveTo(bl[0],bl[1]);ctx.lineTo(-g.rx*.84+k,g.top-h+2.5);ctx.quadraticCurveTo(-g.rx*.82+k,g.top-h,-g.rx*.56+k,g.top-h);ctx.lineTo(g.rx*.6+k,g.top-h+.3);ctx.quadraticCurveTo(g.rx*.88+k,g.top-h+.4,g.rx*.86+k,g.top-h+2.8);ctx.lineTo(br[0],br[1]);ink(.65);}},
    bun:{lift:3,front:function(f,g,p,m){var b=E(g,-1.95,1+g.rx*.3);b[1]+=m.b*.7;paintMass(g,p,1,.25,.6,{n:13,cx:b[0],cy:b[1]+2});var t=E(g,-1.95,1.4);tie(t[0],t[1],-1.95+PI/2,acc(f));cloud(b[0],b[1],g.rx*.4,g.rx*.38,p,5,9,10);}},
    spacebuns:{lift:3,front:function(f,g,p,m){paintMass(g,p,.9,.15,.6,{n:10});[-2.45,-.95].forEach(function(a,i){var b=E(g,a,1+g.rx*.26);b[1]+=m.b*.6;var t=E(g,a,1.3);tie(t[0],t[1],a+PI/2,acc(f));cloud(b[0],b[1],g.rx*.34,g.rx*.33,p,i*3+8,9,9);});}},
    bantu:{lift:3,front:function(f,g,p){paintMass(g,p,.6,.2,.6,{n:0,tex:function(){ctx.strokeStyle=A(p.lo2,.5);ctx.lineWidth=.6;[-2.6,-2.1,-1.6,-1.1].forEach(function(a){var q=E(g,a,.6);ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(q[0]*.6,g.hl+1.5);ctx.stroke();});}});[-2.85,-2.35,-1.85,-1.35,-.85].forEach(function(a,i){var q=E(g,a,1.9);coil(q[0],q[1],2.6+(i===2?.4:0),p);});}},
    cornrows:{lift:.6,back:function(f,g,p,m){[-PI-.18,-PI+.1].forEach(function(a,i){var r=E(g,a,-.2);tress(r[0],r[1],9+i*2,2.2,-.25+m.sw*.8,-.6+m.b,p,'braid',acc(f));});},
      front:function(f,g,p){paintMass(g,p,.5,.3,.6,{n:0,noSheen:1,tex:function(){for(var s=1;s>.3;s-=.12){ctx.strokeStyle=p.lo;ctx.lineWidth=1.9;ctx.beginPath();ctx.ellipse(-g.rx*.08,CY+1,(g.rx+.5)*s,(g.ry+.5)*s,0,-PI-.4,-.5);ctx.stroke();ctx.strokeStyle=A(p.hi2,.55);ctx.lineWidth=.9;ctx.setLineDash([1.1,1.3]);ctx.stroke();ctx.setLineDash([]);}sheen(g,.5,.18);}});}},
    dreads:{lift:1.4,back:function(f,g,p,m){locsBack(f,g,p,m,13,3.1,'loc');},front:function(f,g,p,m){paintMass(g,p,1.4,.3,.58,{n:8});locsFront(f,g,p,m,11,3,'loc');}},
    dreadsLong:{lift:1.4,back:function(f,g,p,m){locsBack(f,g,p,m,24,3,'loc');},front:function(f,g,p,m){paintMass(g,p,1.4,.3,.58,{n:8});locsFront(f,g,p,m,15,2.9,'loc');}},
    boxbraids:{lift:1.3,back:function(f,g,p,m){locsBack(f,g,p,m,25,2.6,'braid',acc(f));},front:function(f,g,p,m){paintMass(g,p,1.2,.3,.58,{n:12,tex:function(){ctx.strokeStyle=A(p.lo2,.45);ctx.lineWidth=.5;for(var i=0;i<6;i++){var q=E(g,-PI+.3+i*.48,.6);ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(q[0]*.7,(q[1]+g.hl)/2);ctx.stroke();}}});locsFront(f,g,p,m,16,2.5,'braid',acc(f));}},
    twists:{lift:2.6,back:function(f,g,p,m){locsBack(f,g,p,m,10,2.8,'twist');},front:function(f,g,p,m){paintMass(g,p,1.2,.3,.58,{n:8});for(var i=0;i<7;i++){var a=-PI+.25+i*.42,r=E(g,a,.4);tress(r[0],r[1],5.5+hash(i)*2,2.6,(Math.cos(a)<0?-.5:.4)+m.sw*.6,-.8,p,'twist');}}},
    ponytail:{lift:1.2,back:function(f,g,p,m){var t=E(g,-2.75,1.2);tress(t[0],t[1],17+m.b*1.2,6.4,-1.05+m.sw*.9+m.idle*.06,-3.2+m.b*2.2,p,'strand');},front:function(f,g,p){var t=E(g,-2.75,1.2);paintMass(g,p,1.1,.2,.6,{n:13,cx:t[0],cy:t[1]});tie(t[0],t[1],-2.75+PI/2,acc(f));}},
    pigtails:{lift:1,back:function(f,g,p,m){[[-2.7,-1],[-.6,1]].forEach(function(q){var t=E(g,q[0],1);tress(t[0],t[1],13+m.b,5.2,q[1]*.55+m.sw*.8,q[1]*-2.2+m.b*1.6,p,'strand');});},front:function(f,g,p){paintMass(g,p,1,.15,.6,{n:10,tex:function(){ctx.strokeStyle=A(p.lo2,.55);ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-g.rx*.1,g.top-1);ctx.quadraticCurveTo(0,g.top+2,g.rx*.15,g.hl);ctx.stroke();}});var s2=acc(f);[[-2.7],[-.6]].forEach(function(q){var t=E(g,q[0],1);tie(t[0],t[1],q[0]+PI/2,s2);});}},
    bob:{lift:2.2,front:function(f,g,p,m){var d=2.2,sw=m.sw*1.6,yB=CY+g.ry*.4+m.b*.4,yF=CY+g.ry*.06+m.b*.3;
      function path(){ctx.beginPath();ctx.moveTo(-g.rx-d+.6+sw,yB);ctx.lineTo(-(g.rx+d),CY);ctx.ellipse(0,CY,g.rx+d,g.ry+d,0,-PI,0,false);ctx.lineTo(g.rx+d-.6+sw,yF);ctx.quadraticCurveTo(g.rx-.6,yF+1.4,g.rx-2.2,yF-.8);ctx.lineTo(g.rx-1.8,g.hl+2);ctx.quadraticCurveTo(g.rx*.5,g.hl-.8,g.rx*.1,g.hl+.2);ctx.quadraticCurveTo(-g.rx*.4,g.hl+1.2,-g.rx+1.8,CY-2);ctx.lineTo(-g.rx+1.6,yB-1);ctx.quadraticCurveTo(-g.rx,yB+1.6,-g.rx-d+.6+sw,yB);ctx.closePath();}
      path();ctx.fillStyle=vgrad(g,p,g.top-d,yB);ctx.fill();ctx.save();path();ctx.clip();ctx.lineCap='round';for(var i=0;i<12;i++){var x=-g.rx-d+i*(g.rx+d)*2/11;ctx.strokeStyle=A(i%2?p.hi2:p.lo2,i%2?.25:.4);ctx.lineWidth=i%2?.5:.8;ctx.beginPath();ctx.moveTo(x*.4,g.top-d);ctx.quadraticCurveTo(x*1.05,g.top+3,x+sw,yB+2);ctx.stroke();}sheen(g,d,.32);ctx.restore();path();ink(.7);}},
    long:{lift:1.7,back:function(f,g,p,m){curtain(f,g,p,m,false);},front:function(f,g,p,m){paintMass(g,p,1.7,.35,.5,{n:12});var r=E(g,-.6,1);tress(r[0],r[1],g.ry*.95,3.6,.2+m.sw*.4,-1.4+m.b,p,'strand');}},
    wavy:{lift:1.9,back:function(f,g,p,m){curtain(f,g,p,m,true);},front:function(f,g,p,m){paintMass(g,p,1.9,.35,.5,{n:12});var r=E(g,-.6,1);tress(r[0],r[1],g.ry*.95,3.8,.24+m.sw*.4,-2.4+m.b+Math.sin(performance.now()*.002)*.4,p,'strand');}},
    sweep:{lift:1.6,front:function(f,g,p,m){paintMass(g,p,1.4,.3,.55,{n:11});var y0=g.hl-2.4,sw=m.sw;ctx.beginPath();ctx.moveTo(-g.rx*.5,y0+.5);ctx.bezierCurveTo(-g.rx*.1,y0-3.2,g.rx*.7,y0-2.5,g.rx+1.6+sw,-6.5);ctx.quadraticCurveTo(g.rx*.9,-7.6,g.rx*.5,-8.2);ctx.quadraticCurveTo(g.rx*.1,y0+2.6,-g.rx*.5,y0+.5);ctx.closePath();ctx.fillStyle=vgrad(g,p,y0-3,-7);ctx.fill();ink(.6);ctx.strokeStyle=A(p.hi2,.45);ctx.lineWidth=.55;[0,.8,1.6].forEach(function(o){ctx.beginPath();ctx.moveTo(-g.rx*.35,y0+o*.4);ctx.bezierCurveTo(0,y0-2+o,g.rx*.6,y0-1.6+o,g.rx+.6+sw,-7+o*.2);ctx.stroke();});}},
    mohawk:{lift:4.5,front:function(f,g,p,m){paintMass(g,p,.3,.05,.65,{n:0,alpha:.55,noSheen:1,tex:function(){stipple(g,p,13,60);}});ctx.strokeStyle=p.c;ctx.lineWidth=3.4;ctx.lineCap='round';ctx.beginPath();ctx.ellipse(0,CY,g.rx+.4,g.ry+.4,0,-2.75,-.78);ctx.stroke();
      var n=8;for(var i=0;i<n;i++){var t=i/(n-1),a=-2.75+t*1.97;spike(g,a,.8,4.6+Math.sin(t*PI)*4.4,2.1,-.28+m.sw*.6+m.idle*.03,p,L(acc(f),.15));}}},
    spiky:{lift:4,front:function(f,g,p,m){paintMass(g,p,1.2,.25,.58,{n:8});for(var i=0;i<7;i++){var a=-2.95+i*.37;spike(g,a,1.2,5.4+hash(i*5.1)*2.6,2.5,-.38+m.sw*.6,p);}}},
    pompadour:{lift:4.5,front:function(f,g,p,m){paintMass(g,p,1,.25,.6,{n:12,cx:g.rx*.4,cy:g.top-1});var b=m.b*.6,fr=E(g,-.62,1);
      function q(){ctx.beginPath();ctx.moveTo(-g.rx*.05,g.hl+.4);ctx.bezierCurveTo(-g.rx*.15,g.top-6,g.rx*.6,g.top-9.5+b,g.rx+2.6,g.top-4.6+b);ctx.quadraticCurveTo(g.rx+3.8,g.top-1.4,fr[0]+.6,fr[1]);ctx.quadraticCurveTo(g.rx*.6,g.hl+1.4,-g.rx*.05,g.hl+.4);ctx.closePath();}
      q();ctx.fillStyle=vgrad(g,p,g.top-9,g.hl);ctx.fill();ctx.save();q();ctx.clip();ctx.lineCap='round';for(var i=0;i<6;i++){ctx.strokeStyle=A(i%2?p.hi2:p.lo2,i%2?.4:.45);ctx.lineWidth=i%2?.5:.8;ctx.beginPath();ctx.moveTo(-g.rx*.05+i*.6,g.hl+.4);ctx.bezierCurveTo(-g.rx*.1+i,g.top-5+i*.6,g.rx*.6,g.top-8.6+i*.9+b,g.rx+2.4,g.top-4+i*.7+b);ctx.stroke();}ctx.restore();q();ink(.65);}}
  };
  function curtain(f,g,p,m,wavy){var sw=m.sw*4,yb=CY+g.ry+6+m.b*.8,t=performance.now()*.002;function path(){var a=E(g,-.25,1.8),b=E(g,-PI+.25,1.8);ctx.beginPath();ctx.moveTo(b[0],b[1]);
      ctx.quadraticCurveTo(-(g.rx+4),CY+g.ry*.4,-(g.rx+2.8)+sw,yb);var n=6;for(var i=1;i<=n;i++){var x=-(g.rx+2.8)+sw+(g.rx*2+5.4)*i/n,y=yb-(i/n)*1.6+(wavy?Math.sin(i*1.7+t)*1.4:0);ctx.quadraticCurveTo(x-(g.rx*2+5.4)/n/2,y+(wavy?2.2:1.2),x,y);}
      ctx.quadraticCurveTo(g.rx+4,CY+g.ry*.4,a[0],a[1]);ctx.ellipse(0,CY,g.rx+1.8,g.ry+1.8,0,-.25,-PI+.25,true);ctx.closePath();}
    path();var gr=ctx.createLinearGradient(0,g.top,0,yb);gr.addColorStop(0,p.c);gr.addColorStop(1,p.lo);ctx.fillStyle=gr;ctx.fill();ctx.save();path();ctx.clip();ctx.lineCap='round';
    for(var i=0;i<16;i++){var x=-(g.rx+3)+i*(g.rx*2+6)/15;ctx.strokeStyle=A(i%2?p.hi2:p.lo2,i%2?.22:.4);ctx.lineWidth=i%2?.5:.8;ctx.beginPath();ctx.moveTo(x*.7,g.top);if(wavy)ctx.bezierCurveTo(x+2.5,CY,x-2.5,CY+g.ry*.6,x+sw,yb+2);else ctx.quadraticCurveTo(x*1.08,CY+g.ry*.3,x+sw,yb+2);ctx.stroke();}ctx.restore();path();ink(.7);}
  var HAIR_LIFT={};Object.keys(HAIR).forEach(function(k){HAIR_LIFT[k]=HAIR[k].lift||0;});
  window.FreaHairStyles=HAIR;

  P.drawHair=function(){var h=HAIR[this.hair];if(!h||!h.front)return;var g=geo(this),p=pal(this),m=motion(this);ctx.save();ctx.lineJoin='round';ctx.lineCap='round';try{h.front(this,g,p,m);}catch(e){}ctx.restore();};
  /* back layer: drawn BEFORE the body so long hair / locs / tails peek out around the silhouette */
  var _body=P.drawBody;
  P.drawBody=function(){var h=HAIR[this.hair];if(h&&h.back){var g=geo(this),p=pal(this),m=motion(this);ctx.save();ctx.lineJoin='round';try{h.back(this,g,p,m);}catch(e){}ctx.restore();}return _body.apply(this,arguments);};

  /* ============================ HATS (fit to the head) ============================ */
  function dome(g,d,lift,aB,aF,sag){var gx=g.rx+d,gy=g.ry+d+lift,pB=[Math.cos(aB)*gx,CY+Math.sin(aB)*gy],pF=[Math.cos(aF)*gx,CY+Math.sin(aF)*gy];
    ctx.beginPath();ctx.moveTo(pB[0],pB[1]);ctx.ellipse(0,CY,gx,gy,0,aB,aF,false);ctx.quadraticCurveTo((pB[0]+pF[0])/2+1,Math.max(pB[1],pF[1])+sag,pB[0],pB[1]);ctx.closePath();return {b:pB,f:pF,gx:gx,gy:gy,c:[(pB[0]+pF[0])/2+1,Math.max(pB[1],pF[1])+sag]};}
  function vg(y0,y1,c){var g=ctx.createLinearGradient(0,y0,0,y1);g.addColorStop(0,L(c,.45));g.addColorStop(.45,c);g.addColorStop(1,D(c,.32));return g;}
  function contact(g,y,w){ctx.save();ctx.beginPath();ctx.ellipse(0,CY,g.rx+3,g.ry+3,0,0,7);ctx.clip();var gr=ctx.createRadialGradient(0,y,1,0,y,w);gr.addColorStop(0,'rgba(10,6,24,.28)');gr.addColorStop(1,'rgba(10,6,24,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(0,y,w,3.6,0,0,7);ctx.fill();ctx.restore();}
  function band(dm,h,col,ribs){var b=dm.b,f=dm.f,c=dm.c;ctx.beginPath();ctx.moveTo(b[0],b[1]);ctx.quadraticCurveTo(c[0],c[1],f[0],f[1]);ctx.lineTo(f[0]+.4,f[1]-h);ctx.quadraticCurveTo(c[0],c[1]-h*1.1,b[0]-.4,b[1]-h);ctx.closePath();ctx.fillStyle=vg(c[1]-h,c[1],col);ctx.fill();
    if(ribs){ctx.save();ctx.clip();ctx.strokeStyle='rgba(0,0,0,.16)';ctx.lineWidth=.7;for(var t=.04;t<1;t+=.075){var u=1-t,x=u*u*b[0]+2*u*t*c[0]+t*t*f[0],y=u*u*b[1]+2*u*t*c[1]+t*t*f[1];ctx.beginPath();ctx.moveTo(x,y+1);ctx.lineTo(x,y-h-1);ctx.stroke();}ctx.restore();}
    ctx.beginPath();ctx.moveTo(b[0],b[1]);ctx.quadraticCurveTo(c[0],c[1],f[0],f[1]);ctx.lineTo(f[0]+.4,f[1]-h);ctx.quadraticCurveTo(c[0],c[1]-h*1.1,b[0]-.4,b[1]-h);ctx.closePath();ink(.6);}
  function meridians(dm,crown,n,col){ctx.strokeStyle=col;ctx.lineWidth=.7;for(var i=1;i<n;i++){var t=i/n,u=1-t,x=u*u*dm.b[0]+2*u*t*dm.c[0]+t*t*dm.f[0],y=u*u*dm.b[1]+2*u*t*dm.c[1]+t*t*dm.f[1];ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x*1.08+(crown[0]-x)*.3,(y+crown[1])/2-1,crown[0],crown[1]);ctx.stroke();}}
  function ball(x,y,r,c){var gr=ctx.createRadialGradient(x-r*.4,y-r*.4,r*.1,x,y,r);gr.addColorStop(0,L(c,.6));gr.addColorStop(.6,c);gr.addColorStop(1,D(c,.35));ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ink(.5);ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.ellipse(x-r*.35,y-r*.4,r*.3,r*.2,-.5,0,7);ctx.fill();}
  var HATS={
    beanie:function(f,g,lift,s2,m){var dm=dome(g,1.6,lift,-PI+.42,-.5,2.4),crown=[-1.2,CY-dm.gy+.6];ctx.fillStyle=vg(crown[1],dm.c[1],s2);ctx.fill();ink(.75);
      ctx.save();dome(g,1.6,lift,-PI+.42,-.5,2.4);ctx.clip();meridians(dm,crown,9,'rgba(0,0,0,.15)');ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(-1,CY+1,dm.gx*.82,dm.gy*.82,0,-PI*.85,-PI*.62);ctx.stroke();ctx.restore();
      band(dm,4,L(s2,.18),true);var pb=crown[1]-2.2+m.b*.8;cloud(crown[0]-.4,pb,3.3,3.1,{c:'#f2f3fb',hi:'#ffffff',hi2:'#ffffff',lo:'#c9cde4',lo2:'#aab0cc'},3,10,12);},
    cap:function(f,g,lift,s2){var dm=dome(g,1.1,lift,-PI+.5,-.45,1.6),crown=[-.4,CY-dm.gy+.5];ctx.fillStyle=vg(crown[1],dm.c[1],s2);ctx.fill();ink(.75);
      ctx.save();dome(g,1.1,lift,-PI+.5,-.45,1.6);ctx.clip();meridians(dm,crown,3,'rgba(255,255,255,.32)');ctx.fillStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.ellipse(-g.rx*.4,crown[1]+3.5,g.rx*.45,2.4,-.3,0,7);ctx.fill();ctx.restore();
      var F=dm.f;ctx.beginPath();ctx.moveTo(F[0]-3.4,F[1]+.6);ctx.quadraticCurveTo(F[0]+6,F[1]-1.8,F[0]+10.5,F[1]+2.4);ctx.quadraticCurveTo(F[0]+5,F[1]+3.6,F[0]-2.6,F[1]+2.3);ctx.closePath();ctx.fillStyle=vg(F[1]-2,F[1]+3,D(s2,.18));ctx.fill();ink(.7);
      ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(F[0]-1.5,F[1]+.6);ctx.quadraticCurveTo(F[0]+5,F[1]-.9,F[0]+9,F[1]+2);ctx.stroke();ball(crown[0],crown[1]-.2,1.3,D(s2,.15));
      ctx.fillStyle='#fff';var sx=F[0]-4.2,sy=F[1]-2.6;ctx.beginPath();for(var i=0;i<10;i++){var a=i*PI/5-PI/2,r=i%2?.7:1.6;ctx.lineTo(sx+Math.cos(a)*r,sy+Math.sin(a)*r);}ctx.closePath();ctx.fill();},
    propeller:function(f,g,lift,s2){var dm=dome(g,1.1,lift,-PI+.5,-.5,1.6),crown=[-.4,CY-dm.gy+.5];ctx.fillStyle=vg(crown[1],dm.c[1],'#ffd23d');ctx.fill();
      ctx.save();dome(g,1.1,lift,-PI+.5,-.5,1.6);ctx.clip();[s2,'#2de2ff','#ff3db5','#39ff7a'].forEach(function(c,i){var x0=-g.rx-3+i*(g.rx*2+6)/4;ctx.fillStyle=A(c,.85);ctx.beginPath();ctx.moveTo(crown[0],crown[1]);ctx.lineTo(x0,CY+2);ctx.lineTo(x0+(g.rx*2+6)/8,CY+2);ctx.closePath();ctx.fill();});ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.ellipse(-g.rx*.4,crown[1]+3.5,g.rx*.45,2.2,-.3,0,7);ctx.fill();ctx.restore();
      dome(g,1.1,lift,-PI+.5,-.5,1.6);ink(.75);band(dm,1.8,'#ffd23d',false);var t=performance.now()*.001;ctx.strokeStyle='#555a70';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(crown[0],crown[1]);ctx.lineTo(crown[0],crown[1]-3.6);ctx.stroke();var pw=Math.cos(t*18)*9;ctx.fillStyle='rgba(255,61,181,.85)';ctx.beginPath();ctx.ellipse(crown[0],crown[1]-4,Math.abs(pw)+.5,1.3,0,0,7);ctx.fill();ink(.4);ball(crown[0],crown[1]-4,1.2,'#ffffff');},
    beret:function(f,g,lift,s2){var cy=g.top-lift*.85+.6;ctx.strokeStyle=D(s2,.3);ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.ellipse(0,CY,g.rx+.8,g.ry+.8+lift*.85,0,-PI+.62,-.72);ctx.stroke();
      ctx.save();ctx.translate(-g.rx*.14,cy);ctx.rotate(-.16);ctx.beginPath();ctx.ellipse(0,0,g.rx*1.08,4.4,0,0,7);var gr=ctx.createRadialGradient(-g.rx*.4,-2,.5,0,0,g.rx*1.1);gr.addColorStop(0,L(s2,.4));gr.addColorStop(.6,s2);gr.addColorStop(1,D(s2,.35));ctx.fillStyle=gr;ctx.fill();ink(.75);
      ctx.strokeStyle='rgba(0,0,0,.16)';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(1,1.2,g.rx*.8,2.4,0,.15,PI-.15);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.ellipse(-g.rx*.45,-1.8,g.rx*.38,1.1,0,0,7);ctx.fill();ctx.strokeStyle='#23233a';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(0,-4.2);ctx.quadraticCurveTo(.6,-6.2,1.6,-6.6);ctx.stroke();ctx.restore();},
    headphones:function(f,g,lift,s2){var gx=g.rx+2.6,gy=g.ry+2.6+lift;ctx.lineCap='round';ctx.strokeStyle='#23233a';ctx.lineWidth=3.6;ctx.beginPath();ctx.ellipse(0,CY,gx,gy,0,-PI+.22,-.22);ctx.stroke();ctx.strokeStyle=L(s2,.15);ctx.lineWidth=1.5;ctx.stroke();
      ctx.strokeStyle='#3a3a58';ctx.lineWidth=4.4;ctx.beginPath();ctx.ellipse(0,CY,gx,gy,0,-PI*.66,-PI*.38);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;ctx.stroke();
      [-PI+.12,-.12].forEach(function(a){var x=Math.cos(a)*(g.rx+1.6),y=CY+Math.sin(a)*(g.ry+1.6);ctx.save();ctx.translate(x,y);ctx.rotate(a+PI/2);ctx.fillStyle='#23233a';ctx.beginPath();ctx.roundRect(-4.2,-3.4,8.4,5.4,2.6);ctx.fill();ink(.6);ctx.fillStyle=vg(-5,3,s2);ctx.beginPath();ctx.roundRect(-3.6,-5.8,7.2,4.6,2.3);ctx.fill();ink(.6);ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.ellipse(-1.4,-4.6,1.6,.6,0,0,7);ctx.fill();ctx.restore();});},
    bunny:function(f,g,lift,s2,m){ears(f,g,lift,m,true);},
    cat:function(f,g,lift,s2,m){ears(f,g,lift,m,false);}
  };
  function ears(f,g,lift,m,bunny){var col=f.col||'#2de2ff',inner=bunny?'#ffb8d0':'#ff9ac0',t=performance.now()*.001;[-2.08,-1.12].forEach(function(a,i){var b=E(g,a,lift*.85-.8),nx=Math.cos(a)*g.ry,ny=Math.sin(a)*g.rx,ang=Math.atan2(ny,nx)+PI/2;
      ctx.save();ctx.translate(b[0],b[1]);ctx.rotate(ang+(bunny?(i?.12:-.12)+m.sw*.5+Math.sin(t*2+i)*.05:0));
      if(bunny){var flop=clamp(m.b*.25,-.25,.25)+(i?.08:0);ctx.beginPath();ctx.moveTo(-3.2,1);ctx.bezierCurveTo(-4.4,-8,-2.6+flop*8,-17,0+flop*10,-18);ctx.bezierCurveTo(2.8+flop*10,-17,4.2,-8,3.2,1);ctx.closePath();ctx.fillStyle=vg(-18,1,col);ctx.fill();ink(.7);
        ctx.beginPath();ctx.moveTo(-1.5,-.5);ctx.bezierCurveTo(-2.2,-7,-1+flop*6,-14.5,flop*9,-15.5);ctx.bezierCurveTo(1.4+flop*8,-14.5,2.2,-7,1.5,-.5);ctx.closePath();ctx.fillStyle=inner;ctx.fill();ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.ellipse(-2,-9,.7,3.6,-.1,0,7);ctx.fill();}
      else{ctx.beginPath();ctx.moveTo(-4.6,1.2);ctx.quadraticCurveTo(-2.6,-6,0,-9.5);ctx.quadraticCurveTo(2.6,-6,4.6,1.2);ctx.closePath();ctx.fillStyle=vg(-10,1,col);ctx.fill();ink(.7);ctx.beginPath();ctx.moveTo(-2.4,.4);ctx.quadraticCurveTo(-1.3,-4,0,-6.2);ctx.quadraticCurveTo(1.3,-4,2.4,.4);ctx.closePath();ctx.fillStyle=inner;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=.5;[-1,0,1].forEach(function(o){ctx.beginPath();ctx.moveTo(o*.8,-.2);ctx.lineTo(o*1.4,-3.2);ctx.stroke();});}
      ctx.restore();});}
  var _hat=P.drawHat,BRIMLESS={halo:1,flower:1,bow:1,horns:1,antlers:1};
  P.drawHat=function(){var h=this.hat;if(!h||h==='none')return;var g=geo(this),lift=HAIR_LIFT[this.hair]||0,s2=acc(this),m=this._hm||motion(this);
    ctx.save();ctx.lineJoin='round';
    try{if(HATS[h]){if(h!=='bunny'&&h!=='cat'&&h!=='headphones')contact(g,g.top+3.2-lift*.4,g.rx*.9);HATS[h](this,g,lift,s2,m);}
      else{var k=g.rx/12.5,ty=g.top-lift*.85+1.3;if(!BRIMLESS[h])contact(g,ty+2,g.rx*.75);
        var sv=this.shape,hv=this.hair;this.shape='round';this.hair='none';
        try{ctx.translate(0,ty);ctx.rotate(-.05);ctx.scale(k,(1+k)/2);ctx.translate(0,13);_hat.call(this);}finally{this.shape=sv;this.hair=hv;}}}
    catch(e){}
    ctx.restore();};

  /* ============================ OTHER WEARABLES: fit to body width ============================ */
  var _cape=P.drawCape;P.drawCape=function(){if(!this.cape||this.cape==='none')return;var g=geo(this),k=g.rx/12.5;ctx.save();ctx.scale(k,1);try{_cape.apply(this,arguments);}finally{ctx.restore();}};
  var _gl=P.drawGlasses,ARM={round:'#c89a3a',nerd:'#1a1026',shades:'#0c0c16',stars:'#ffd23d',heart:'#ff3db5',vr:'#34345a',goggles:'#8a5a2b'};
  P.drawGlasses=function(){var gl=this.glasses;_gl.apply(this,arguments);if(!ARM[gl])return;var g=geo(this);ctx.save();ctx.lineCap='round';ctx.strokeStyle=ARM[gl];ctx.lineWidth=gl==='vr'||gl==='goggles'?2.2:1.2;
    ctx.beginPath();ctx.moveTo(EL-8.6,EY-1.8);ctx.quadraticCurveTo(-g.rx+.8,EY-2.4,-g.rx+.3,EY-.6);ctx.stroke();ctx.fillStyle=ARM[gl];ctx.beginPath();ctx.arc(-g.rx+.3,EY-.6,.8,0,7);ctx.fill();ctx.restore();};

  /* preview helper (used by QA + anywhere a quick flea portrait is needed) */
  window.FreaPaintFlea=function(cv,spec,zoom){var q=cv.getContext('2d'),W=cv.width,H=cv.height;q.clearRect(0,0,W,H);var f=new Flea(0,0,true,'',spec||{});f.stuck=true;f.face=1;f.angle=0;f.hideName=true;
    var Z=zoom===2?W/40:W/62,oy=zoom===2?H*.72:H*.58;var s=ctx;ctx=q;q.save();q.translate(W/2,oy);q.scale(Z,Z);try{f.draw(f.cx,f.cy);}catch(e){console.error(e);}q.restore();ctx=s;};
  /* ---------- new hair options ---------- */
  function addOpts(){var s=document.getElementById('edit-hair');[['spacebuns','Space Buns'],['sweep','Side Sweep']].forEach(function(o){if(s&&!s.querySelector('option[value="'+o[0]+'"]')){var op=document.createElement('option');op.value=o[0];op.textContent=o[1];s.appendChild(op);}try{if(OPT.hair.indexOf(o[0])<0)OPT.hair.push(o[0]);}catch(e){}});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addOpts);else addOpts();
})();
