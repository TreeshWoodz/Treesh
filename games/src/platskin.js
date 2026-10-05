/* ===================== FREA! PLUS — THEMED PLATFORMS + BASIC GRAPHICS =====================
   Platforms now match the arena they live in (grassy soil in the meadow/forest, crystal shards in the
   Crystal Kingdom, castle brick, basalt with glowing magma cracks, mossy logs in the swamp, snow-capped
   ice, frosted cake in Candyland, coral, clouds, neon glass, hazard-striped steel…).
   Each platform's skin is rendered ONCE into a cached sprite (re-made only when the scene or size
   changes), so themed platforms cost about the same as the old ones per frame.
   Settings → Display:  Platforms  Themed | Basic   ·   Background  Scenic | Basic
   Basic platforms = flat colour blocks; Basic background = plain sky colour + flat floor (fastest). */
var FreaSkin=(function(){
  var PK='frea_plat_style',BK='frea_bg_style';
  function ld(k,d,ok){try{var v=localStorage.getItem(k);if(ok.indexOf(v)>=0)return v;}catch(e){}return d;}
  var plat=ld(PK,'themed',['themed','basic']),bg=ld(BK,'scenic',['scenic','basic']);
  function el(id){return document.getElementById(id);}
  function A(){return window.FreaArenas||null;}
  function sceneNow(){try{var a=A();if(!a)return 'meadow';if(STATE==='title')return a.modeScene.title||'meadow';
      if(gameMode==='zen')return a.scenes[zenEnv]?zenEnv:'meadow';if(gameMode==='hoops')return 'rooftop';
      var eq=window.FreaShop&&FreaShop.equip&&FreaShop.equip();if(eq&&eq.arena&&eq.arena!=='auto'&&gameMode!=='tutorial'&&a.scenes[eq.arena])return eq.arena;
      return a.modeScene[gameMode]||'meadow';}catch(e){return 'meadow';}}
  /* ---------- materials ---------- */
  var M={
    meadow:{t:'stone',b:['#6a4fa0','#3a2a66'],top:'grass',tc:['#6ff09a','#2fb06a']},
    forest:{t:'soil',b:['#94603a','#5e3c22'],top:'grass',tc:['#8ae05a','#3f9a2a']},
    autumn:{t:'wood',b:['#b0703e','#74421f'],top:'leaves',tc:['#ff9a3d','#e0582a','#ffd23d']},
    sakura:{t:'wood',b:['#8e5c4c','#5a362a'],top:'grass',tc:['#a6e884','#5fae4a'],pet:'#ffb0d0'},
    shrooms:{t:'stone',b:['#3e2c60','#20143a'],top:'moss',tc:['#8a6aff','#4a2aa0'],shr:'#d0a8ff'},
    crystal:{t:'crystal',b:['#8ae4ff','#6a4aff'],edge:'#efffff'},
    castle:{t:'brick',b:['#727296','#45455e'],mo:'#2a2a40',top:'cap',tc:['#9a9ab8','#5a5a78']},
    grove:{t:'wood',b:['#55436a','#2c2240'],top:'moss',tc:['#6ab08a','#2f6a50']},
    ember:{t:'basalt',b:['#3e2c2c','#1a1010'],top:'magma',tc:['#ff7a1a','#ffd23d']},
    volcano:{t:'basalt',b:['#3e2c2c','#1a1010'],top:'magma',tc:['#ff5a1a','#ffb03d']},
    swamp:{t:'wood',b:['#4e3e26','#2a2014'],top:'moss',tc:['#7aff7a','#2a9a3a'],drip:'#8aff6a'},
    speedway:{t:'metal',b:['#615a84','#2c2644'],top:'hazard',tc:['#ffd23d','#1e1a30']},
    rooftop:{t:'brick',b:['#a24e3c','#6a2a22'],mo:'#3a1a18',top:'cap',tc:['#c4ccdc','#6a7080']},
    city:{t:'brick',b:['#a24e3c','#6a2a22'],mo:'#3a1a18',top:'cap',tc:['#c4ccdc','#6a7080']},
    beach:{t:'sand',b:['#f4d892','#c8a060'],top:'shell',tc:['#fff4d0','#e8c88a']},
    desert:{t:'sand',b:['#e8a864','#a8683a'],top:'strata',tc:['#f6c88a','#c47a44']},
    snow:{t:'ice',b:['#c4e8ff','#7aa8d8'],top:'snow',tc:['#ffffff','#dcecff']},
    aurora:{t:'ice',b:['#7ab8d8','#2a5a8a'],top:'snow',tc:['#f4fbff','#c8e0f4']},
    underwater:{t:'coral',b:['#ff829e','#c04a6a'],top:'weed',tc:['#3affb0','#1a9a6a']},
    candy:{t:'cake',b:['#f6c48a','#d8945a'],top:'frost',tc:['#ff8ad1','#ffe0f2']},
    rain:{t:'stone',b:['#5e687c','#363c4c'],top:'wet',tc:['#9ab0d0','#5e687c']},
    cyber:{t:'neon',b:['#160c2e','#0a0618'],nc:'#2de2ff'},neon:{t:'neon',b:['#1a0a30','#0a0618'],nc:'#ff3db5'},
    space:{t:'rock',b:['#70707e','#3a3a48'],top:'tech',tc:['#9b6bff','#2de2ff']},
    living:{t:'wood',b:['#dca474','#a86a40'],top:'polish',tc:['#f6d0a8','#c88a5a']},
    clouds:{t:'cloud',b:['#ffffff','#d6e4ff']},lagoon:{t:'bamboo',b:['#a6d872','#5a9a3a']}};
  function mat(id){return M[id]||M.meadow;}
  function rng(seed){var s=seed>>>0||1;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return ((s>>>0)%10000)/10000;};}
  /* ---------- shape path in world coords ---------- */
  function path(o,p){o.beginPath();if(p.kind==='rect'){o.roundRect(p.x,p.y,p.w,p.h,Math.min(8,p.h/2));}else if(p.kind==='circle'){o.arc(p.x,p.y,p.r,0,7);}else{p.pts.forEach(function(q,i){if(i)o.lineTo(q[0],q[1]);else o.moveTo(q[0],q[1]);});o.closePath();}}
  function texture(o,p,m,R){var x=p.bx,y=p.by,w=p.bw,h=p.bh,i,n;
    switch(m.t){
      case 'stone':case 'rock':case 'basalt':for(i=0,n=Math.ceil(w*h/140);i<n;i++){o.fillStyle=R()<.5?'rgba(255,255,255,.08)':'rgba(0,0,0,.16)';o.beginPath();o.ellipse(x+R()*w,y+R()*h,2+R()*6,1.5+R()*3.5,R()*3,0,7);o.fill();}
        if(m.t==='rock')for(i=0;i<Math.max(1,w/50|0);i++){var cx=x+R()*w,cy=y+h*.3+R()*h*.5,cr=2+R()*4;o.fillStyle='rgba(0,0,0,.25)';o.beginPath();o.arc(cx,cy,cr,0,7);o.fill();o.strokeStyle='rgba(255,255,255,.18)';o.lineWidth=1;o.beginPath();o.arc(cx,cy,cr,3.6,5.6);o.stroke();}
        if(m.t==='basalt'){o.strokeStyle=m.tc[0];o.lineWidth=1.6;o.globalAlpha=.85;for(i=0;i<Math.max(1,w/45|0);i++){var sx=x+R()*w;o.beginPath();o.moveTo(sx,y+3);o.lineTo(sx+(R()-.5)*10,y+h*.5);o.lineTo(sx+(R()-.5)*14,y+h-2);o.stroke();}o.globalAlpha=1;}break;
      case 'soil':for(i=0,n=Math.ceil(w*h/90);i<n;i++){o.fillStyle=R()<.5?'rgba(255,220,180,.12)':'rgba(40,20,5,.22)';o.fillRect(x+R()*w,y+R()*h,2,2);}break;
      case 'wood':o.strokeStyle='rgba(40,20,8,.28)';o.lineWidth=1;for(i=0;i<Math.max(2,h/5|0);i++){var gy=y+3+i*5+R()*2;o.beginPath();o.moveTo(x,gy);for(var gx=0;gx<=w;gx+=12)o.lineTo(x+gx,gy+Math.sin(gx*.08+i)*1.2);o.stroke();}
        for(i=40;i<w;i+=44+R()*20){o.fillStyle='rgba(30,14,4,.35)';o.fillRect(x+i,y,1.5,h);}for(i=0;i<w/70;i++){o.fillStyle='rgba(30,14,4,.3)';o.beginPath();o.ellipse(x+R()*w,y+h*.55,3,1.8,0,0,7);o.fill();}break;
      case 'brick':o.fillStyle=m.mo;var bh=7,row=0;for(var by=y+3;by<y+h;by+=bh,row++){o.fillRect(x,by,w,1.2);for(var bx=x+(row%2?0:9);bx<x+w;bx+=18)o.fillRect(bx,by,1.2,bh);}break;
      case 'metal':o.fillStyle='rgba(255,255,255,.07)';for(i=0;i<h;i+=4)o.fillRect(x,y+i,w,1);o.fillStyle='rgba(220,220,240,.55)';for(i=8;i<w;i+=26){o.beginPath();o.arc(x+i,y+h*.62,1.4,0,7);o.fill();}break;
      case 'sand':for(i=0,n=Math.ceil(w*h/60);i<n;i++){o.fillStyle=R()<.5?'rgba(255,255,255,.22)':'rgba(140,90,40,.18)';o.fillRect(x+R()*w,y+R()*h,1.5,1.5);}break;
      case 'ice':o.strokeStyle='rgba(255,255,255,.45)';o.lineWidth=1;for(i=0;i<w/30;i++){var ix=x+R()*w;o.beginPath();o.moveTo(ix,y+h*.4);o.lineTo(ix+6,y+h*.9);o.stroke();}break;
      case 'crystal':o.strokeStyle='rgba(255,255,255,.55)';o.lineWidth=1.2;for(i=-h;i<w;i+=16+R()*10){o.beginPath();o.moveTo(x+i,y+h);o.lineTo(x+i+h*.8,y);o.stroke();}o.fillStyle='rgba(255,255,255,.75)';for(i=0;i<w/40;i++){var px=x+R()*w,py=y+R()*h*.6;o.fillRect(px-.6,py-3,1.2,6);o.fillRect(px-3,py-.6,6,1.2);}break;
      case 'coral':for(i=0,n=Math.ceil(w*h/70);i<n;i++){o.fillStyle='rgba(120,20,50,.3)';o.beginPath();o.arc(x+R()*w,y+R()*h,1+R()*2,0,7);o.fill();}break;
      case 'cake':o.fillStyle='rgba(255,255,255,.18)';o.fillRect(x,y+h*.55,w,2);o.fillStyle='rgba(140,60,30,.25)';for(i=0;i<w*h/50;i++)o.fillRect(x+R()*w,y+h*.3+R()*h*.7,1.5,1.5);break;
      case 'bamboo':o.fillStyle='rgba(40,80,20,.45)';for(i=14;i<w;i+=26){o.fillRect(x+i,y,2,h);}o.fillStyle='rgba(255,255,255,.25)';o.fillRect(x,y+2,w,2);break;
      case 'neon':o.strokeStyle=m.nc;o.globalAlpha=.25;o.lineWidth=1;for(i=0;i<w;i+=12){o.beginPath();o.moveTo(x+i,y);o.lineTo(x+i,y+h);o.stroke();}o.globalAlpha=1;break;}}
  /* top decoration: only for rects (full), others get a tinted top band */
  function topDeco(o,p,m,R){var x=p.x,y=p.y,w=p.w,h=p.h,i,c=m.tc||[];if(!m.top)return;
    if(p.kind!=='rect'){/* upper edges get the themed trim (grass / snow / frosting / neon…) */var tcol=m.top==='hazard'?c[0]:(m.top==='snow'||m.top==='frost'?c[0]:c[0]);
      o.save();o.beginPath();o.rect(p.bx-4,p.by-6,p.bw+8,p.bh*.42+6);o.clip();o.lineJoin='round';o.strokeStyle=m.top==='moss'||m.top==='grass'||m.top==='weed'?c[1]:tcol;o.lineWidth=m.top==='snow'||m.top==='frost'?7:5;path(o,p);o.stroke();
      o.strokeStyle=tcol;o.lineWidth=2.4;path(o,p);o.stroke();o.restore();return;}
    var r=Math.min(8,h/2);o.save();
    switch(m.top){
      case 'grass':case 'moss':case 'weed':o.fillStyle=c[1];o.beginPath();o.roundRect(x,y-1,w,Math.min(7,h*.5),[r,r,2,2]);o.fill();o.fillStyle=c[0];o.fillRect(x+2,y-1,w-4,2.5);
        var bl=m.top==='moss'?0:(m.top==='weed'?w/14:w/5);for(i=0;i<bl;i++){var gx=x+3+R()*(w-6),gh=(m.top==='weed'?6:3)+R()*(m.top==='weed'?9:5);o.strokeStyle=R()<.5?c[0]:c[1];o.lineWidth=m.top==='weed'?2:1.4;o.lineCap='round';o.beginPath();o.moveTo(gx,y+1);o.quadraticCurveTo(gx+(R()-.5)*6,y-gh*.6,gx+(R()-.5)*4,y-gh);o.stroke();}
        if(m.top==='moss')for(i=0;i<w/16;i++){o.fillStyle=c[R()<.5?0:1];o.beginPath();o.ellipse(x+4+R()*(w-8),y+5+R()*2,3,1.6+R()*2.4,0,0,7);o.fill();}
        if(m.pet)for(i=0;i<w/30;i++){o.fillStyle=m.pet;o.beginPath();o.ellipse(x+R()*w,y+1+R()*2,2.2,1.3,R()*3,0,7);o.fill();}
        if(m.shr)for(i=0;i<Math.max(1,w/90|0);i++){var mx=x+10+R()*(w-20);o.fillStyle='#f4e8ff';o.fillRect(mx-1,y-5,2,6);o.fillStyle=m.shr;o.beginPath();o.ellipse(mx,y-5,4.5,3,0,Math.PI,0);o.fill();}
        if(m.drip)for(i=0;i<w/40;i++){var dx=x+6+R()*(w-12),dl=3+R()*7;o.fillStyle=m.drip;o.globalAlpha=.8;o.beginPath();o.moveTo(dx-2,y+h-1);o.quadraticCurveTo(dx,y+h+dl,dx+2,y+h-1);o.fill();o.beginPath();o.arc(dx,y+h+dl-1,1.6,0,7);o.fill();o.globalAlpha=1;}break;
      case 'leaves':for(i=0;i<w/6;i++){o.fillStyle=c[i%3];o.beginPath();o.ellipse(x+R()*w,y+R()*3,3.4,2,R()*3,0,7);o.fill();}break;
      case 'snow':o.fillStyle=c[0];o.beginPath();o.moveTo(x,y+4);for(var sx=0;sx<=w;sx+=10)o.quadraticCurveTo(x+sx+5,y-4-R()*3,x+Math.min(w,sx+10),y+2);o.lineTo(x+w,y+5);o.lineTo(x,y+5);o.closePath();o.fill();
        o.fillStyle='rgba(225,245,255,.9)';for(i=0;i<w/22;i++){var ix=x+6+R()*(w-12),il=4+R()*8;o.beginPath();o.moveTo(ix-2.5,y+h-1);o.lineTo(ix,y+h+il);o.lineTo(ix+2.5,y+h-1);o.fill();}break;
      case 'frost':o.fillStyle=c[0];o.beginPath();o.roundRect(x,y-1,w,6,[r,r,2,2]);o.fill();for(i=0;i<w/12;i++){var fx=x+4+R()*(w-8),fl=3+R()*6;o.beginPath();o.moveTo(fx-3,y+4);o.quadraticCurveTo(fx,y+5+fl*2,fx+3,y+4);o.fill();}
        var SP=['#ffd23d','#2de2ff','#c6ff3d','#ffffff','#9b6bff'];for(i=0;i<w/7;i++){o.fillStyle=SP[i%5];o.save();o.translate(x+R()*w,y+R()*3);o.rotate(R()*3);o.fillRect(-1.6,-.6,3.2,1.3);o.restore();}break;
      case 'magma':var g=o.createLinearGradient(0,y,0,y+5);g.addColorStop(0,c[1]);g.addColorStop(1,c[0]);o.fillStyle=g;o.globalAlpha=.9;o.fillRect(x+3,y+1,w-6,2.4);o.globalAlpha=1;break;
      case 'hazard':o.beginPath();o.rect(x,y,w,5);o.clip();o.fillStyle=c[0];o.fillRect(x,y,w,5);o.fillStyle=c[1];for(i=-10;i<w;i+=12){o.beginPath();o.moveTo(x+i,y+5);o.lineTo(x+i+6,y);o.lineTo(x+i+12,y);o.lineTo(x+i+6,y+5);o.fill();}break;
      case 'cap':o.fillStyle=c[1];o.fillRect(x-2,y-1,w+4,5);o.fillStyle=c[0];o.fillRect(x-2,y-1,w+4,2);break;
      case 'shell':for(i=0;i<w/60;i++){var shx=x+8+R()*(w-16);o.fillStyle=R()<.5?'#ffd0e0':'#fff4e0';o.beginPath();o.arc(shx,y+2,3,Math.PI,0);o.fill();}o.fillStyle=c[0];o.globalAlpha=.6;o.fillRect(x+2,y,w-4,2);o.globalAlpha=1;break;
      case 'strata':o.fillStyle='rgba(120,60,20,.28)';o.fillRect(x,y+h*.38,w,2);o.fillRect(x,y+h*.7,w,1.5);o.fillStyle=c[0];o.globalAlpha=.7;o.fillRect(x+2,y,w-4,2);o.globalAlpha=1;break;
      case 'wet':o.fillStyle='rgba(180,210,255,.45)';o.fillRect(x+3,y,w-6,2);for(i=0;i<w/50;i++){o.fillStyle='rgba(200,225,255,.35)';o.beginPath();o.ellipse(x+10+R()*(w-20),y+1.5,6+R()*8,1.3,0,0,7);o.fill();}break;
      case 'tech':o.fillStyle=c[0];o.globalAlpha=.85;o.fillRect(x+4,y+1,w-8,2);o.fillStyle=c[1];for(i=10;i<w-6;i+=24)o.fillRect(x+i,y+1,6,2);o.globalAlpha=1;break;
      case 'polish':o.fillStyle='rgba(255,255,255,.35)';o.fillRect(x+3,y+1,w-6,2);break;}
    o.restore();}
  function paintSkin(o,p,id){var m=mat(id),R=rng(((p.bx*73)|0)+((p.by*31)|0)+(p.bw|0)*7);
    if(m.t==='cloud'){o.fillStyle=m.b[1];path(o,p);o.fill();var cx0=p.bx,cy0=p.by,w=p.bw,h=p.bh;o.fillStyle=m.b[0];for(var i=0;i<w/14+1;i++){var px=cx0+6+i*(w-12)/Math.max(1,w/14),rr=h*.55+R()*h*.4;o.beginPath();o.arc(px,cy0+h*.35,rr,0,7);o.fill();}
      o.fillStyle='rgba(170,190,230,.35)';o.fillRect(cx0+4,cy0+h*.8,w-8,h*.2);return;}
    var g=o.createLinearGradient(0,p.by,0,p.by+p.bh);g.addColorStop(0,m.b[0]);g.addColorStop(1,m.b[1]);
    o.save();if(m.t==='crystal')o.globalAlpha=.88;o.fillStyle=g;path(o,p);o.fill();o.restore();
    o.save();path(o,p);o.clip();texture(o,p,m,R);
    var hl=o.createLinearGradient(0,p.by,0,p.by+p.bh*.5);hl.addColorStop(0,'rgba(255,255,255,.22)');hl.addColorStop(1,'rgba(255,255,255,0)');o.fillStyle=hl;o.fillRect(p.bx,p.by,p.bw,p.bh*.5);
    var sh=o.createLinearGradient(0,p.by+p.bh*.5,0,p.by+p.bh);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.28)');o.fillStyle=sh;o.fillRect(p.bx,p.by+p.bh*.5,p.bw,p.bh*.5);o.restore();
    if(m.t==='neon'){o.strokeStyle=m.nc;o.globalAlpha=.3;o.lineWidth=5;path(o,p);o.stroke();o.globalAlpha=1;o.lineWidth=1.8;path(o,p);o.stroke();o.strokeStyle='rgba(255,255,255,.8)';o.lineWidth=.7;path(o,p);o.stroke();}
    else{o.strokeStyle=m.edge?m.edge:'rgba(10,6,20,.55)';o.lineWidth=m.edge?1.4:1.2;path(o,p);o.stroke();}
    topDeco(o,p,m,R);}
  var PAD=18;
  function skin(p,id){var key=id+'|'+p.kind+'|'+(p.kind==='poly'?p.pts.length:(Math.round(p.bw)+'x'+Math.round(p.bh)))+'|'+(perfMode?1:2);
    if(p._skin&&p._skin.key===key)return p._skin;
    var sc=perfMode?1:Math.min(2,window.devicePixelRatio||1),cw=Math.ceil(p.bw+PAD*2),ch=Math.ceil(p.bh+PAD*2),cv=document.createElement('canvas');cv.width=Math.ceil(cw*sc);cv.height=Math.ceil(ch*sc);
    var o=cv.getContext('2d');o.scale(sc,sc);o.translate(PAD-p.bx,PAD-p.by);try{paintSkin(o,p,id);}catch(e){}
    p._skin={key:key,cv:cv,cw:cw,ch:ch,ox:p.cenx-(p.bx-PAD),oy:p.ceny-(p.by-PAD),a0:p.spinA||0};return p._skin;}
  function isBound(p){return p===platforms[0]||p===platforms[1]||p===platforms[2];}
  function basic(p,cx,cy){var c=p.matBase||PTYPE_COL[p.ptype]||(pal&&pal.a)||'#5a4a9a';ctx.save();ctx.translate(-cx,-cy);ctx.fillStyle=c;path(ctx,p);ctx.fill();
    if(p.kind==='rect'){ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(p.x+3,p.y+1,p.w-6,2);}ctx.restore();}
  var _pd=Platform.prototype.draw;
  Platform.prototype.draw=function(cx,cy){
    if(this.deco||this.wall||this._dirt||this.kind==='dirt'||isBound(this))return _pd.apply(this,arguments);
    if(this.bx+this.bw<cx-PAD||this.bx>cx+W+PAD||this.by+this.bh<cy-PAD||this.by>cy+H+PAD)return;
    if(plat==='basic'){basic(this,cx,cy);return;}
    if(this.matBase||(this.ptype&&this.ptype!=='normal'))return _pd.apply(this,arguments);
    var s=skin(this,sceneNow());ctx.save();ctx.translate(this.cenx-cx,this.ceny-cy);if(this.kind!=='rect'&&this.spinA!==s.a0)ctx.rotate((this.spinA||0)-s.a0);
    ctx.drawImage(s.cv,-s.ox,-s.oy,s.cw,s.ch);ctx.restore();
    if(this.mv){ctx.save();ctx.globalAlpha=.5;ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.arc(this.cenx-cx,this.ceny-cy,2.5,0,7);ctx.fill();ctx.restore();}};
  /* ---------- basic (blank) background ---------- */
  var _bg=drawBG;
  drawBG=function(){if(bg!=='basic')return _bg.apply(this,arguments);var a=A(),sc=a&&a.scenes[sceneNow()],sky=(sc&&sc.sky)||['#0b0d22','#14183a','#1e2450'];
    ctx.fillStyle=sky[0];ctx.fillRect(0,0,W,H);if(STATE==='title')return;
    var fy=WORLD_H-60-(camera.y||0);if(fy<H){ctx.fillStyle=(sc&&sc.floor)||'#1c1834';ctx.fillRect(0,fy,W,H-fy);ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(0,fy,W,2);}};
  /* ---------- settings UI (Display group) ---------- */
  function row(id,label,sub,opts,cur,cb){return '<div class="setting-row xm-row skin-row" id="'+id+'"><div class="section-label"><span>'+label+'</span><small class="xm-sub">'+sub+'</small></div><div class="layout-row" style="flex-wrap:wrap">'+
      opts.map(function(p){var on=p[0]===cur;return '<button class="lbtn'+(on?' active':'')+'" data-'+cb+'="'+p[0]+'" data-testid="'+cb+'-'+p[0]+'" aria-pressed="'+on+'">'+p[1]+'</button>';}).join('')+'</div></div>';}
  function render(){var g=document.querySelector('#sg-display .sgroup-b');if(!g)return;var box=el('skin-settings');
    if(!box){box=document.createElement('div');box.id='skin-settings';box.setAttribute('data-testid','graphics-settings');g.appendChild(box);
      box.addEventListener('click',function(e){var b=e.target.closest('[data-plat-style],[data-bg-style]');if(!b)return;
        if(b.dataset.platStyle){plat=b.dataset.platStyle;try{localStorage.setItem(PK,plat);}catch(x){}flash(plat==='basic'?'Basic platforms':'Themed platforms','#c6ff3d');}
        else{bg=b.dataset.bgStyle;try{localStorage.setItem(BK,bg);}catch(x){}flash(bg==='basic'?'Basic background':'Scenic background','#c6ff3d');}render();});}
    box.innerHTML=row('plat-style-row','Platforms','Themed to match each arena, or plain blocks (faster)',[['themed','Themed'],['basic','Basic']],plat,'plat-style')+
      row('bg-style-row','Background','Full scenery, or a plain blank backdrop (fastest)',[['scenic','Scenic'],['basic','Basic']],bg,'bg-style');}
  setTimeout(render,90);setTimeout(render,900);
  return {scene:sceneNow,plat:function(){return plat;},bg:function(){return bg;},set:function(k,v){if(k==='plat')plat=v;else bg=v;render();},materials:M};
})();
window.FreaSkin=FreaSkin;
