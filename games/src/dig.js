/* ===================== FREA! PLUS — TREASURE DIG (real dirt) =====================
   The stage is a big block of diggable dirt. Treasure (coins, gems, crowns) is buried at different
   depths: the deeper, the richer. Dirt is a grid; dug cells are really removed (tunnels persist).
   Controls: TAP any dirt and your flea tunnels its way there · FLING hard into dirt to drill a crater
   · tap open air to hop like normal. Deep clay takes 2 hits, grey boulders can't be dug.
   CPU fleas pick treasure by value/distance and tunnel to it with the same digging rules.
   Bump into rivals (setting) to steal coins. Richest flea when time runs out wins. */
var FreaDig=(function(){
  var CELL=22,DIG_SP=6.6,S={},D=null;
  function T(){return Date.now();}
  function el(id){return document.getElementById(id);}
  function G(k){try{return FreaModeSettings.get('treasure',k);}catch(e){return null;}}
  function party(){try{return !!(window.FreaParty&&FreaParty.status());}catch(e){return false;}}
  function setT(l,v){var a=el('timer-lbl'),b=el('tval');if(a)a.textContent=l;if(b)b.textContent=v;}
  function round(){try{return FreaModes.round();}catch(e){return 60;}}
  function alert(t,c,s){try{if(window.FreaHud2)FreaHud2.alert(t,c,s);else flash(t,c);}catch(e){}}
  function feed(t,c){try{if(window.FreaHud2)FreaHud2.feed(t,c);}catch(e){}}
  function skill(){try{return FreaModeSettings.skill();}catch(e){return 'normal';}}
  function burst(x,y,c,n){for(var i=0;i<(n||14);i++){var a=Math.random()*7,s=2+Math.random()*5;parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,l:1,r:2+Math.random()*3,c:c});}}
  function live(){return STATE==='play'&&gameMode==='treasure'&&D;}
  /* cell types: 0 air · 1 topsoil · 2 soil · 3 deep clay (2 hits) · 4 boulder (solid) */
  var PAL={1:['#a8743f','#c08a52','#86592f'],2:['#8a5830','#a06a3e','#6d4524'],3:['#6e4a3a','#86604e','#55372a'],4:['#7d8595','#a6aebd','#585f6d']};
  var HP={1:1,2:1,3:2,4:255};
  var KIND={coin:{e:'🪙',v:[2,4],c:'#ffd23d',l:'coins'},gem:{e:'💎',v:[6,9],c:'#5ee7ff',l:'gem'},crown:{e:'👑',v:[14,20],c:'#ff9a3d',l:'crown'}};

  /* ======================= the dirt block (acts like one platform) ======================= */
  function Dirt(){var gx=15,gy=Math.round(Math.max(170,Math.min(250,H*0.36))),gw=WORLD_W-30,gh=WORLD_H-60-gy;
    var cols=Math.ceil(gw/CELL),rows=Math.ceil(gh/CELL);
    this.kind='dirt';this._kind='dirt';this._dirt=true;this.gx=gx;this.gy=gy;this.cols=cols;this.rows=rows;this.gw=cols*CELL;this.gh=rows*CELL;
    this.x=this.bx=gx;this.y=this.by=gy;this.w=this.bw=this.gw;this.h=this.bh=this.gh;this.cenx=gx+this.gw/2;this.ceny=gy+this.gh/2;
    this.pdx=0;this.pdy=0;this.drot=0;this.t=new Uint8Array(cols*rows);this.hp=new Uint8Array(cols*rows);this.tr={};
    for(var r=0;r<rows;r++){var d=r/rows;for(var c=0;c<cols;c++){var edge=0.46+Math.sin(c*0.35)*0.04+Math.sin(c*0.11+1)*0.03,k=r<2?1:(d<edge?2:3);this.t[r*cols+c]=k;this.hp[r*cols+c]=HP[k];}}
    /* boulders (never in the top rows, never in the spawn strip) */
    var nb=Math.round(cols*rows/260);for(var b=0;b<nb;b++){var bc=2+Math.random()*(cols-4)|0,br=4+Math.random()*(rows-6)|0,rad=Math.random()<0.6?1:1.6;
      for(var rr=-2;rr<=2;rr++)for(var cc=-2;cc<=2;cc++){if(Math.hypot(rr,cc)>rad)continue;var R=br+rr,Cc=bc+cc;if(R<3||R>=rows||Cc<0||Cc>=cols)continue;this.t[R*cols+Cc]=4;this.hp[R*cols+Cc]=HP[4];}}
    this.off=document.createElement('canvas');this.off.width=this.gw;this.off.height=this.gh;this.oc=this.off.getContext('2d');this.redrawAll();}
  var DP=Dirt.prototype;
  DP.update=function(){this.pdx=0;this.pdy=0;this.drot=0;};
  DP._shift=function(){};DP._rotate=function(){};DP._computeBBox=function(){};
  DP.topPoint=function(){return {x:this.gx+this.gw/2,y:this.gy};};
  DP.solid=function(c,r){if(c<0||c>=this.cols||r<0||r>=this.rows)return false;return this.t[r*this.cols+c]>0;};
  DP.type=function(c,r){if(c<0||c>=this.cols||r<0||r>=this.rows)return 0;return this.t[r*this.cols+c];};
  DP.cellOf=function(x,y){return [Math.floor((x-this.gx)/CELL),Math.floor((y-this.gy)/CELL)];};
  DP.solidAt=function(x,y){var q=this.cellOf(x,y);return this.solid(q[0],q[1]);};
  DP.contains=function(x,y,pad){return this.solidAt(x,y)||(pad?this.solidAt(x,y+pad):false);};
  /* list solid cells overlapping a box */
  DP.cellsIn=function(x0,y0,x1,y1){var out=[],c0=Math.max(0,Math.floor((x0-this.gx)/CELL)),c1=Math.min(this.cols-1,Math.floor((x1-this.gx)/CELL)),r0=Math.max(0,Math.floor((y0-this.gy)/CELL)),r1=Math.min(this.rows-1,Math.floor((y1-this.gy)/CELL));
    for(var r=r0;r<=r1;r++)for(var c=c0;c<=c1;c++)if(this.t[r*this.cols+c])out.push([c,r]);return out;};
  /* ---------- offscreen art ---------- */
  DP.redrawAll=function(){this.oc.clearRect(0,0,this.gw,this.gh);for(var r=0;r<this.rows;r++)for(var c=0;c<this.cols;c++)this.drawCell(c,r);};
  DP.drawCell=function(c,r){if(c<0||c>=this.cols||r<0||r>=this.rows)return;var o=this.oc,x=c*CELL,y=r*CELL,i=r*this.cols+c,k=this.t[i];o.clearRect(x,y,CELL,CELL);if(!k)return;
    var p=PAL[k],h=((c*73856093)^(r*19349663))>>>0;
    if(k===4){o.fillStyle=p[2];o.fillRect(x,y,CELL,CELL);o.fillStyle=p[0];o.beginPath();o.roundRect(x+1,y+1,CELL-2,CELL-2,6);o.fill();o.fillStyle=p[1];o.beginPath();o.ellipse(x+8,y+7,5,3,-0.5,0,7);o.fill();}
    else{o.fillStyle=p[0];o.fillRect(x,y,CELL,CELL);
      for(var s=0;s<4;s++){var hx=(h>>(s*6))&31,hy=(h>>(s*6+3))&31;o.fillStyle=s%2?p[1]:p[2];o.fillRect(x+hx%(CELL-3),y+hy%(CELL-3),s===3?3:2,2);}
      if(this.hp[i]<HP[k]){o.strokeStyle='rgba(20,10,4,.65)';o.lineWidth=1.4;o.beginPath();o.moveTo(x+4,y+5);o.lineTo(x+11,y+11);o.lineTo(x+8,y+17);o.moveTo(x+11,y+11);o.lineTo(x+18,y+9);o.stroke();}}
    /* edge shading toward dug-out air */
    var up=this.solid(c,r-1),dn=this.solid(c,r+1),lf=this.solid(c-1,r),rt=this.solid(c+1,r);
    if(!up){if(r===0&&k!==4){o.fillStyle='#4fbf4a';o.fillRect(x,y,CELL,5);o.fillStyle='#7de36a';o.fillRect(x,y,CELL,2);o.fillStyle='#3c9a3a';o.fillRect(x+(h%16),y-0,2,7);}else{o.fillStyle='rgba(255,230,190,.16)';o.fillRect(x,y,CELL,2);}}
    o.fillStyle='rgba(12,6,2,.42)';if(!dn)o.fillRect(x,y+CELL-3,CELL,3);if(!lf)o.fillRect(x,y,2,CELL);if(!rt)o.fillRect(x+CELL-2,y,2,CELL);
    var tr=this.tr[i];if(tr&&!tr.found){var kd=KIND[tr.k],mx=x+CELL/2,my=y+CELL/2;var rg=o.createRadialGradient(mx,my,2,mx,my,CELL*0.62);rg.addColorStop(0,rgbaOf(kd.c,.55));rg.addColorStop(1,rgbaOf(kd.c,0));o.fillStyle=rg;o.fillRect(x-3,y-3,CELL+6,CELL+6);
      o.strokeStyle=rgbaOf(kd.c,.8);o.lineWidth=1.5;o.beginPath();o.arc(mx,my+1,9.5,0,7);o.stroke();
      o.font=(tr.k==='crown'?18:16)+'px serif';o.textAlign='center';o.textBaseline='middle';o.fillText(kd.e,x+CELL/2,y+CELL/2+1);}};
  DP.draw=function(cx,cy){var x0=Math.max(this.gx,cx),x1=Math.min(this.gx+this.gw,cx+W),y0=Math.max(this.gy,cy),y1=Math.min(this.gy+this.gh,cy+H);if(x1<=x0||y1<=y0)return;
    var g=ctx.createLinearGradient(0,this.gy-cy,0,this.gy+this.gh-cy);g.addColorStop(0,'#2a1a10');g.addColorStop(1,'#120a06');ctx.fillStyle=g;ctx.fillRect(x0-cx,y0-cy,x1-x0,y1-y0);
    ctx.drawImage(this.off,x0-this.gx,y0-this.gy,x1-x0,y1-y0,x0-cx,y0-cy,x1-x0,y1-y0);};
  /* ---------- digging ---------- */
  DP.dig=function(c,r,f){if(c<0||c>=this.cols||r<0||r>=this.rows)return 0;var i=r*this.cols+c,k=this.t[i];if(!k||k===4)return 0;
    this.hp[i]--;var cx=this.gx+c*CELL+CELL/2,cy=this.gy+r*CELL+CELL/2,p=PAL[k];
    for(var n=0;n<(perfMode?1:3);n++)parts.push({x:cx+(Math.random()-.5)*14,y:cy+(Math.random()-.5)*10,vx:(Math.random()-.5)*3,vy:-1-Math.random()*2.5,l:.8,r:2+Math.random()*2,c:p[n%3]});
    if(this.hp[i]>0){this.drawCell(c,r);return 1;}
    this.t[i]=0;var tr=this.tr[i];if(tr&&!tr.found){tr.found=true;delete this.tr[i];collect(tr,f,cx,cy);}
    this.drawCell(c,r);this.drawCell(c,r-1);this.drawCell(c,r+1);this.drawCell(c-1,r);this.drawCell(c+1,r);if(f){f._dug=(f._dug||0)+1;}S.dugN=(S.dugN||0)+1;return 1;};
  /* fast impact = crater */
  DP.impact=function(f,sp,ivx,ivy){var R=CELL*(0.55+Math.min(1.5,(sp-DIG_SP)/9)),px=f.cx+ivx/sp*f.w*0.5,py=f.cy+ivy/sp*f.h*0.5,n=0;
    var q=this.cellOf(px,py),k=Math.ceil(R/CELL)+1;for(var r=q[1]-k;r<=q[1]+k;r++)for(var c=q[0]-k;c<=q[0]+k;c++){var ccx=this.gx+c*CELL+CELL/2,ccy=this.gy+r*CELL+CELL/2;if(Math.hypot(ccx-px,ccy-py)<=R)n+=this.dig(c,r,f);}
    if(n){if(f.isP)camera.shake=Math.max(camera.shake,4+Math.min(8,sp*0.3));}return n;};
  DP.collide=function(f){var x0=f.x,y0=f.y,x1=x0+f.w,y1=y0+f.h;if(x1<=this.gx||x0>=this.gx+this.gw||y1<=this.gy||y0>=this.gy+this.gh)return false;
    var cells=this.cellsIn(x0,y0,x1-0.01,y1-0.01);if(!cells.length)return false;
    var ivx=f.vx,ivy=f.vy,sp=Math.hypot(ivx,ivy);
    if(sp>=DIG_SP&&this.impact(f,sp,ivx,ivy)){cells=this.cellsIn(x0,y0,x1-0.01,y1-0.01);if(!cells.length){f.vx*=0.6;f.vy*=0.6;return false;}}
    var best=null,self=this;
    cells.forEach(function(q){var c=q[0],r=q[1],cx0=self.gx+c*CELL,cy0=self.gy+r*CELL;
      var F=[['up',!self.solid(c,r-1),y1-cy0,ivy<-0.5],['down',!self.solid(c,r+1),cy0+CELL-y0,ivy>0.5],['left',!self.solid(c-1,r),x1-cx0,ivx<-0.5],['right',!self.solid(c+1,r),cx0+CELL-x0,ivx>0.5]];
      F.forEach(function(e){if(!e[1]||e[2]<=0)return;var s=e[2]+(e[3]?8:0);if(!best||s<best.s)best={s:s,f:e[0],cx0:cx0,cy0:cy0};});});
    if(!best){/* fully embedded: pop up out of the top */var top=cells.reduce(function(a,q){return Math.min(a,q[1]);},1e9);best={f:'up',cy0:self.gy+top*CELL,cx0:0};}
    if(best.f==='up'){f.y=best.cy0-f.h;f.angle=0;f.onG=true;}else if(best.f==='down'){f.y=best.cy0+CELL;f.angle=Math.PI;f.onG=false;}
    else if(best.f==='left'){f.x=best.cx0-f.w;f.angle=-Math.PI/2;f.onG=false;}else{f.x=best.cx0+CELL;f.angle=Math.PI/2;f.onG=false;}
    f.vx=0;f.vy=0;f.stuck=true;f.platform=this;f.stickTime=T();if(f.sq<0.75)f.sq=0.65;return true;};
  /* support band around a flea (m px) */
  DP.band=function(f,side,m){var x0=f.x+3,x1=f.x+f.w-3,y0=f.y+3,y1=f.y+f.h-3;
    if(side==='down')return this.cellsIn(x0,f.y+f.h+0.5,x1,f.y+f.h+m).length>0;if(side==='up')return this.cellsIn(x0,f.y-m,x1,f.y-0.5).length>0;
    if(side==='left')return this.cellsIn(f.x-m,y0,f.x-0.5,y1).length>0;return this.cellsIn(f.x+f.w+0.5,y0,f.x+f.w+m,y1).length>0;};
  function onFloor(f){return f.y+f.h>=WORLD_H-62;}

  /* ======================= treasure ======================= */
  function addTreasure(){if(!D)return false;for(var tries=0;tries<60;tries++){var r=1+Math.floor(Math.pow(Math.random(),0.8)*(D.rows-2)),c=Math.random()*D.cols|0,i=r*D.cols+c;
      if(!D.t[i]||D.t[i]===4||D.tr[i])continue;var cx=D.gx+c*CELL+CELL/2,cy=D.gy+r*CELL+CELL/2;
      if(fleas.some(function(f){return Math.hypot(f.cx-cx,f.cy-cy)<CELL*3;}))continue;
      if(Object.keys(D.tr).some(function(k){var t=D.tr[k];return Math.hypot(t.x-cx,t.y-cy)<CELL*2.5;}))continue;
      var d=r/D.rows,roll=Math.random(),k=d>0.62?(roll<0.45?'crown':(roll<0.85?'gem':'coin')):(d>0.3?(roll<0.5?'gem':(roll<0.95?'coin':'crown')):(roll<0.85?'coin':'gem'));
      var kd=KIND[k],v=kd.v[0]+Math.round(Math.random()*(kd.v[1]-kd.v[0]));D.tr[i]={i:i,c:c,r:r,x:cx,y:cy,k:k,v:v,found:false,ph:Math.random()*6};D.drawCell(c,r);return true;}return false;}
  function treasures(){return D?Object.keys(D.tr).map(function(k){return D.tr[k];}).filter(function(t){return !t.found;}):[];}
  function collect(tr,f,x,y){if(!f){burst(x,y,KIND[tr.k].c,10);return;}var kd=KIND[tr.k];f.coins=(f.coins||0)+tr.v;f['_td_'+tr.k]=(f['_td_'+tr.k]||0)+1;
    burst(x,y,kd.c,tr.k==='coin'?12:26);S.pops.push({x:x,y:y,t:T(),e:kd.e,txt:'+'+tr.v,c:kd.c});
    if(f.isP){flash((tr.k==='crown'?'ROYAL CROWN! +':(tr.k==='gem'?'GEM! +':'+'))+tr.v+' COINS','#ffd23d');if(tr.k!=='coin')camera.shake=Math.max(camera.shake,7);}
    else if(tr.k==='crown')feed(f.name+' dug up a crown (+'+tr.v+')','#ff9a3d');try{updScore();}catch(e){}}

  /* ======================= dig-walk (tunnel toward a point) ======================= */
  function digMul(f){if(f.isP)return 1;var s=skill();return s==='pro'?1.08:(s==='easy'?0.72:0.9);}
  function digWalk(f,now){var g=f._digTo,dx=g.x-f.cx,dy=g.y-f.cy;
    if(Math.abs(dx)<CELL*0.55&&Math.abs(dy)<CELL*0.55){f._digTo=null;return;}
    if(f._digCd&&now<f._digCd){f.walkT=now+90;return;}
    if(!f._digAx||(f._digAx==='x'&&Math.abs(dx)<3)||(f._digAx==='y'&&Math.abs(dy)<3))f._digAx=Math.abs(dy)>Math.abs(dx)?'y':'x';
    var ax=f._digAx,sx=ax==='x'?Math.sign(dx):0,sy=ax==='y'?Math.sign(dy):0,step=Math.min(2.2*digMul(f),Math.abs(ax==='x'?dx:dy));
    var nx=f.x+sx*step,ny=f.y+sy*step,cells=D.cellsIn(nx+1,ny+1,nx+f.w-1,ny+f.h-1);
    if(ny+f.h>WORLD_H-61){f._digTo=null;return;}
    if(cells.length){if(cells.some(function(q){return D.type(q[0],q[1])===4;})){f._digAx=ax==='x'?'y':'x';f._digBlock=(f._digBlock||0)+1;if(f._digBlock>30){f._digTo=null;f._digBlock=0;if(f.isP)flash('BOULDER! Dig around it','#a6aebd');}return;}
      var hard=cells.some(function(q){return D.type(q[0],q[1])===3;});cells.forEach(function(q){D.dig(q[0],q[1],f);});f._digBlock=0;
      f._digCd=now+Math.round((hard?190:105)/digMul(f));f.walkT=now+160;f.sq=Math.min(f.sq,0.82);if(sx)f.face=sx;return;}
    f.x=nx;f.y=ny;f.angle=0;f.onG=true;if(sx)f.face=sx;f.walkT=now+120;
    var sup=onFloor(f)||D.band(f,'down',CELL)||D.band(f,'up',CELL*0.9)||D.band(f,'left',CELL)||D.band(f,'right',CELL);
    if(!sup){f.stuck=false;f.platform=null;f.vy=0.4;}}
  /* stuck on dirt but the dirt under it is gone → fall */
  function support(f){if(onFloor(f))return true;var a=f.angle||0;
    if(Math.abs(a)<0.1)return D.band(f,'down',3);if(Math.abs(a-Math.PI)<0.1||Math.abs(a+Math.PI)<0.1)return D.band(f,'up',3);
    if(a<0)return D.band(f,'right',3);return D.band(f,'left',3);}
  function unstick(f){f.stuck=false;f.platform=null;f.angle=0;f.onG=false;f.vy=0.6;}

  /* ======================= CPU brains ======================= */
  function pickTarget(f){var best=null,bs=-1;treasures().forEach(function(t){var d=Math.hypot(t.x-f.cx,(t.y-f.cy)*1.15);var s=t.v/(d+140);
      if(fleas.some(function(o){return o!==f&&o._tgt===t;}))s*=0.35;if(s>bs){bs=s;best=t;}});return best;}
  function cpu(f,now){if(f._aiT&&now<f._aiT)return;
    if(S.steal==='on'&&(f._thief||skill()==='pro')){var rich=null,rd=1e9;fleas.forEach(function(o){if(o===f||o.hidden||(o.coins||0)<Math.max(6,(f.coins||0)+3))return;var d=Math.hypot(o.cx-f.cx,o.cy-f.cy);if(d<rd){rd=d;rich=o;}});
      if(rich&&rd<300&&Math.random()<0.6){f._digTo=null;aiLeap(f,{x:rich.cx,y:rich.cy,chase:true});f._aiT=now+900+Math.random()*500;return;}}
    var t=f._tgt&&!f._tgt.found?f._tgt:pickTarget(f);f._tgt=t;
    if(!t){f._digTo={x:Math.max(D.gx+30,Math.min(D.gx+D.gw-30,f.cx+(Math.random()-.5)*300)),y:Math.min(WORLD_H-90,f.cy+60+Math.random()*120)};f._aiT=now+1500;return;}
    /* far away on the surface: hop over first, then dig straight down */
    if(f.y+f.h<=D.gy+4&&Math.abs(t.x-f.cx)>260){aiLeap(f,{x:t.x,y:D.gy-14});f._aiT=now+800;return;}
    f._digTo={x:t.x,y:t.y};f._aiT=now+400;}

  /* ======================= mode ======================= */
  var TD={layout:'box',still:true,maxAi:10,
    bounds:function(bw,bh){return [Math.round(Math.max(bw*1.3,900)),Math.round(Math.max(bh*1.85,1050))];},
    build:function(){D=new Dirt();platforms.push(D);return true;},
    setup:function(){S={left:round(),n:party()?4:(G('spots')||4),steal:party()?'on':(G('steal')||'on'),pops:[],dugN:0,addT:0};
      var want=Math.round(S.n*5.5);for(var i=0;i<want;i++)addTreasure();S.want=want;
      fleas.forEach(function(f,i){f.coins=0;f._dug=0;f._stole=0;f._thief=Math.random()<0.3;f._digTo=null;f._tgt=null;f._aiT=0;f._digCd=0;
        f.x=D.gx+30+(D.gw-60)*(i+0.5)/fleas.length-f.w/2;f.y=D.gy-f.h-0.5;f.vx=f.vy=0;f.stuck=true;f.platform=D;f.angle=0;f.onG=true;f._px=f.x;f._py=f.y;});
      setT('Time',S.left);},
    go:function(){alert('DIG FOR TREASURE!','#ffd23d','Tap the dirt to tunnel. Deeper = richer!');},
    tick:function(dt){if(!D)return;var now=T();
      fleas.forEach(function(f){if(f.hidden)return;
        if(!f.stuck||(f.frozen&&now<f.frozen)){f._px=f.x;f._py=f.y;return;}
        if(f.platform!==D&&!onFloor(f)&&f.platform!==null&&f.platform!==platforms[0]){f._px=f.x;f._py=f.y;return;}
        if(!f.isP&&!f._digTo)cpu(f,now);
        if(f._digTo&&f.stuck){digWalk(f,now);}
        else if(f.stuck&&f.platform===D&&!support(f))unstick(f);
        /* shoved into dirt by a bump while standing: pop back out */
        if(f.stuck&&!f._digTo){var ov=D.cellsIn(f.x+3,f.y+3,f.x+f.w-3,f.y+f.h-3);if(ov.length){f.x=f._px;f.y=f._py;}}
        /* CPU watchdog: no progress → hop out */
        if(!f.isP&&f.stuck){if(Math.hypot(f.x-(f._wx||0),f.y-(f._wy||0))>6){f._wx=f.x;f._wy=f.y;f._wt=now;}else if(now-(f._wt||now)>2600){f._wt=now;f._digTo=null;f._tgt=null;f.launch((Math.random()-.5)*10,-12);}}
        f._px=f.x;f._py=f.y;});
      if(treasures().length<S.want&&now>S.addT){S.addT=now+900;addTreasure();}
      S.pops=S.pops.filter(function(p){return now-p.t<1200;});
      if(S.steal==='on')bumps(6.2,function(h,v){if(!v.coins)return;var n=Math.min(v.coins,2+Math.floor(v.coins*0.12));v.coins-=n;h.coins+=n;h._stole+=n;v.launch(Math.sign(v.cx-h.cx||1)*6,-6);burst(v.cx,v.cy,'#ffd23d',10);
        if(h.isP)flash('STOLE '+n+' COINS!','#ffd23d');else if(v.isP){flash(h.name.toUpperCase()+' STOLE '+n+'!','#ff3b5c');camera.shake=8;}try{updScore();}catch(e){}});},
    second:function(){S.left--;setT('Time',Math.max(0,S.left));if(S.left<=10){var tb=el('tbox');if(tb)tb.classList.add('danger');}if(S.left<=0){var a=fleas.slice().sort(function(x,y){return (y.coins||0)-(x.coins||0);});endGame(a[0]||null);}},
    ai:function(f){return {x:f.cx,y:f.cy};},aiHold:function(){return true;},
    drawBack:function(){},
    drawFront:function(cx,cy){if(!D)return;var t=T()/1000,now=T();ctx.save();
      /* twinkles on visible treasure */
      treasures().forEach(function(q){var x=q.x-cx,y=q.y-cy;if(x<-20||x>W+20||y<-20||y>H+20)return;var k=(Math.sin(t*2.4+q.ph)+1)/2;if(k<0.75)return;ctx.globalAlpha=(k-0.75)*4;ctx.fillStyle='#fff';
        var sx=x+7,sy=y-7,s=2+3*(k-0.75)*4;ctx.beginPath();ctx.moveTo(sx,sy-s);ctx.lineTo(sx+1,sy-1);ctx.lineTo(sx+s,sy);ctx.lineTo(sx+1,sy+1);ctx.lineTo(sx,sy+s);ctx.lineTo(sx-1,sy+1);ctx.lineTo(sx-s,sy);ctx.lineTo(sx-1,sy-1);ctx.closePath();ctx.fill();});
      ctx.globalAlpha=1;
      /* your dig target */
      var me=player;if(me&&me._digTo){var gx=me._digTo.x-cx,gy=me._digTo.y-cy;ctx.strokeStyle='rgba(255,210,61,.55)';ctx.lineWidth=2;ctx.setLineDash([5,6]);ctx.lineDashOffset=-t*24;ctx.beginPath();ctx.moveTo(me.cx-cx,me.cy-cy);ctx.lineTo(gx,gy);ctx.stroke();ctx.setLineDash([]);
        ctx.font='16px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('⛏️',gx,gy+Math.sin(t*8)*2);}
      /* coin counts */
      ctx.font="800 11px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';fleas.forEach(function(f){if(f.hidden||!f.coins)return;var x=f.cx-cx,y=f.y-cy-(f.ant==='none'?26:36)*f.sf-10;if(x<-30||x>W+30||y<-30||y>H+30)return;ctx.fillStyle='#ffd23d';ctx.fillText('🪙 '+f.coins,x,y);});
      S.pops.forEach(function(p){var k=(now-p.t)/1200,x=p.x-cx,y=p.y-cy-k*34;ctx.globalAlpha=1-k;ctx.font='20px serif';ctx.fillText(p.e,x,y);ctx.font="900 13px 'Baloo 2',sans-serif";ctx.fillStyle=p.c;ctx.fillText(p.txt,x,y+18);});ctx.globalAlpha=1;
      /* arrow to the nearest treasure when none is on screen */
      if(me){var vis=treasures().some(function(q){var x=q.x-cx,y=q.y-cy;return x>0&&x<W&&y>0&&y<H;});if(!vis){var n=treasures().reduce(function(b,q){var d=Math.hypot(q.x-me.cx,q.y-me.cy);return !b||d<b.d?{q:q,d:d}:b;},null);
        if(n){var sx=n.q.x-cx,sy=n.q.y-cy,a=Math.atan2(sy-H/2,sx-W/2),ex=Math.max(46,Math.min(W-46,W/2+Math.cos(a)*W)),ey=Math.max(106,Math.min(H-46,H/2+Math.sin(a)*H));ctx.translate(ex,ey);ctx.rotate(a);ctx.fillStyle='#ffd23d';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-7,-10);ctx.lineTo(-7,10);ctx.closePath();ctx.fill();}}}
      ctx.restore();},
    score:function(c,U){U.title('Treasure Coins');var a=fleas.slice().sort(function(x,y){return (y.coins||0)-(x.coins||0);}),hi=a.length?(a[0].coins||0):0;U.list(a.map(function(f){return {n:f.name,c:f.col,me:f.isP,lead:(f.coins||0)===hi&&hi>0,pts:f.coins||0};}),{pos:true});},
    rankVal:function(f){return f.coins||0;},statTxt:function(f){return (f.coins||0)+' coins · '+(f._dug||0)+' dirt dug'+(f._stole?' · '+f._stole+' stolen':'');},
    meter:function(p){var a=fleas.slice().sort(function(x,y){return (y.coins||0)-(x.coins||0);}),top=a[0],mx=Math.max(20,top?(top.coins||0):0),depth=D?Math.max(0,Math.round((p.y+p.h-D.gy)/CELL)):0;
      return {l:p._digTo?'Digging…':'Your coins',v:(p.coins||0)/mx,t:(p.coins||0)+' coins',s:'Depth '+depth+'m · '+(top&&top!==p?top.name+' leads with '+(top.coins||0):'You are in the lead!'),ld:top&&top!==p?{v:(top.coins||0)/mx,col:top.col}:null,col:'#ffd23d'};},
    endSub:function(won){return won?'Richest flea under the ground!':'Out-dug this time';}};
  function bumps(minSp,cb){var now=T();for(var i=0;i<fleas.length;i++){var a=fleas[i];if(a.hidden)continue;for(var j=i+1;j<fleas.length;j++){var b=fleas[j];if(b.hidden)continue;
    if(Math.hypot(a.cx-b.cx,a.cy-b.cy)>(a.w+b.w)*0.58)continue;var sa=Math.hypot(a.vx,a.vy),sb=Math.hypot(b.vx,b.vy),h=sa>=sb?a:b,v=h===a?b:a,sp=Math.max(sa,sb);
    if(sp<minSp||(v._bumpT&&now<v._bumpT))continue;v._bumpT=now+450;cb(h,v,sp);}}}

  /* ---------- player input: tap dirt = tunnel there, tap air = hop ---------- */
  var _tm=tapMove;tapMove=function(sx,sy){if(live()&&player&&!playerDead){var wx=sx+camera.x,wy=sy+camera.y;
      if(D.solidAt(wx,wy)&&wy<WORLD_H-62){if(!player.stuck){flash('Land first, then dig','#ffd23d');return;}player._digTo={x:wx,y:wy};player._digAx=null;tapMarker=null;return;}
      player._digTo=null;}
    return _tm.apply(this,arguments);};
  var _ln=Flea.prototype.launch;Flea.prototype.launch=function(){if(gameMode==='treasure')this._digTo=null;return _ln.apply(this,arguments);};

  EXTRA_MODES.treasure=TD;
  return {state:function(){return S;},dirt:function(){return D;},CELL:CELL,
    /* test hooks */tapWorld:function(wx,wy){tapMove(wx-camera.x,wy-camera.y);},player:function(){return player;}};
})();
window.FreaDig=FreaDig;
