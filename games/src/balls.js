/* ===================== FREA! PLUS — BALL & HOOP STUDIO =====================
   · 14 ball designs (Classic, Neon, Beach, Galaxy, Lava, Ice, Chrome, Gold, Watermelon, Soccer, Eight, Rainbow, Pixel, Solid)
   · Hoop look (style + rim colour) lives here with the ball — not in Settings
   · choices persist (frea_ball / frea_hoop_look) and the studio opens from the Hoops gear or before Ball-mode games
   · zen / H&S beach balls redrawn with the new beach design */
var FreaBalls=(function(){
  var TAU=Math.PI*2;
  function ld(k,d){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v||d;}catch(e){return d;}}
  function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  var BALL=ld('frea_ball',{color:'#e8752b',style:'classic'}),LOOK=ld('frea_hoop_look',{style:'pro',rim:'auto'});
  var STY=[['classic','Classic'],['neon','Neon'],['beach','Beach'],['galaxy','Galaxy'],['lava','Lava'],['ice','Ice'],['chrome','Chrome'],['gold','Gold'],['melon','Melon'],['soccer','Soccer'],['eight','8-Ball'],['rainbow','Rainbow'],['pixel','Pixel'],['glow','Glow'],['solid','Solid']];
  var COLS=['#e8752b','#ff3db5','#2de2ff','#c6ff3d','#ffd23d','#9b6bff','#ffffff','#39ff7a','#ff4d4d','#1e1e2e'];
  function sphere(c,x,y,r,a,b,d){var g=c.createRadialGradient(x-r*.35,y-r*.4,r*.06,x+r*.08,y+r*.1,r*1.06);g.addColorStop(0,a);g.addColorStop(.5,b);g.addColorStop(1,d);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
  function gloss(c,x,y,r,k){k=k||1;var sh=c.createRadialGradient(x-r*.3,y-r*.35,r*.55,x,y,r*1.02);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,10,'+(.42*k)+')');c.fillStyle=sh;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
    var sp=c.createRadialGradient(x-r*.38,y-r*.42,0,x-r*.38,y-r*.42,r*.42);sp.addColorStop(0,'rgba(255,255,255,'+(.7*k)+')');sp.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=sp;c.beginPath();c.arc(x-r*.38,y-r*.42,r*.42,0,TAU);c.fill();
    c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=Math.max(1,r*.05);c.beginPath();c.arc(x,y,r*.92,Math.PI*.15,Math.PI*.62);c.stroke();}
  function seams(c,r,col,w){c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(-r,0);c.quadraticCurveTo(0,r*.08,r,0);c.stroke();c.beginPath();c.moveTo(0,-r);c.lineTo(0,r);c.stroke();
    c.beginPath();c.ellipse(-r*1.12,0,r*.8,r*1.1,0,-Math.PI*.44,Math.PI*.44);c.stroke();c.beginPath();c.ellipse(r*1.12,0,r*.8,r*1.1,0,Math.PI*.56,Math.PI*1.44);c.stroke();}
  function now(){return performance.now()/1000;}
  var _base=drawBasketball;
  function draw(c,x,y,r,rot,color,style){color=color||'#e8752b';style=style||'classic';rot=rot||0;var t=now();
    if(style==='classic'||style==='glow'||style==='solid')return _base(c,x,y,r,rot,color,style);
    c.save();
    if(style==='neon'){var hue=color==='#e8752b'?'#2de2ff':color,alt=hue==='#ff3db5'?'#2de2ff':'#ff3db5';c.shadowColor=hue;c.shadowBlur=22;sphere(c,x,y,r,'#2a2a4a','#12122a','#05050e');c.shadowBlur=0;
      c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.translate(x,y);c.rotate(rot);var pulse=.75+Math.sin(t*5)*.25;c.shadowColor=hue;c.shadowBlur=12*pulse;seams(c,r,hue,Math.max(1.6,r*.09));c.shadowColor=alt;c.globalAlpha=.55;seams(c,r*.98,alt,Math.max(.8,r*.035));c.restore();
      c.globalAlpha=1;c.strokeStyle=hue;c.lineWidth=Math.max(1.4,r*.07);c.shadowColor=hue;c.shadowBlur=16*pulse;c.beginPath();c.arc(x,y,r-1,0,TAU);c.stroke();c.shadowBlur=0;gloss(c,x,y,r,.6);}
    else if(style==='beach'){var P=['#ff3d5a','#ffd23d','#2d8aff','#ffffff','#39d36a','#ffffff'];c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.translate(x,y);c.rotate(rot);
      for(var s=0;s<6;s++){var a0=s/6*TAU,a1=(s+1)/6*TAU;c.fillStyle=P[s];c.beginPath();c.moveTo(0,0);for(var q=0;q<=8;q++){var a=a0+(a1-a0)*q/8;c.lineTo(Math.cos(a)*r*1.02,Math.sin(a)*r*1.02);}c.closePath();c.fill();}
      c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=1;for(var s2=0;s2<6;s2++){var a2=s2/6*TAU;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(Math.cos(a2+.2)*r*.6,Math.sin(a2+.2)*r*.6,Math.cos(a2)*r,Math.sin(a2)*r);c.stroke();}
      c.fillStyle='#ffffff';c.beginPath();c.arc(0,0,r*.2,0,TAU);c.fill();c.strokeStyle='rgba(0,0,0,.18)';c.beginPath();c.arc(0,0,r*.2,0,TAU);c.stroke();c.fillStyle='#e8e8f0';c.beginPath();c.arc(0,0,r*.08,0,TAU);c.fill();c.restore();gloss(c,x,y,r,.9);}
    else if(style==='galaxy'){sphere(c,x,y,r,'#6a3ad8','#2a1060','#0a0420');c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.translate(x,y);c.rotate(rot*.5);
      var ng=c.createRadialGradient(r*.2,-r*.1,0,r*.2,-r*.1,r*.8);ng.addColorStop(0,'rgba(255,61,181,.55)');ng.addColorStop(1,'rgba(255,61,181,0)');c.fillStyle=ng;c.fillRect(-r,-r,2*r,2*r);var ng2=c.createRadialGradient(-r*.3,r*.3,0,-r*.3,r*.3,r*.7);ng2.addColorStop(0,'rgba(45,226,255,.45)');ng2.addColorStop(1,'rgba(45,226,255,0)');c.fillStyle=ng2;c.fillRect(-r,-r,2*r,2*r);
      for(var i=0;i<26;i++){var a3=i*2.39996,rr=Math.sqrt((i+.5)/26)*r,tw=.5+.5*Math.sin(t*3+i);c.fillStyle='rgba(255,255,255,'+(.4+tw*.6)+')';c.beginPath();c.arc(Math.cos(a3)*rr,Math.sin(a3)*rr,Math.max(.5,r*.035*(i%4?1:1.8)),0,TAU);c.fill();}
      c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=Math.max(1,r*.04);seams(c,r,'rgba(255,255,255,.22)',Math.max(1,r*.04));c.restore();gloss(c,x,y,r,.7);}
    else if(style==='lava'){c.shadowColor='#ff5a1a';c.shadowBlur=18;sphere(c,x,y,r,'#5a2a1a','#2a1008','#100402');c.shadowBlur=0;c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.translate(x,y);c.rotate(rot);
      var fl=.7+Math.sin(t*6)*.3;c.strokeStyle='rgba(255,'+(140+fl*60|0)+',40,.95)';c.lineWidth=Math.max(1.4,r*.09);c.shadowColor='#ff7a1a';c.shadowBlur=10;c.lineJoin='round';
      [[-.9,-.2,-.3,.1,.2,-.15,.6,.3],[-.4,-.9,-.2,-.4,.1,-.2],[0,.5,.3,.7,.7,.6],[-.7,.5,-.3,.4]].forEach(function(L){c.beginPath();c.moveTo(L[0]*r,L[1]*r);for(var k=2;k<L.length;k+=2)c.lineTo(L[k]*r,L[k+1]*r);c.stroke();});c.restore();gloss(c,x,y,r,.6);}
    else if(style==='ice'){sphere(c,x,y,r,'#ffffff','#a8e8ff','#3a8ad0');c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.translate(x,y);c.rotate(rot);c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=Math.max(1,r*.04);
      for(var f=0;f<6;f++){var a4=f/6*TAU;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a4)*r*.7,Math.sin(a4)*r*.7);c.stroke();c.beginPath();c.moveTo(Math.cos(a4)*r*.4,Math.sin(a4)*r*.4);c.lineTo(Math.cos(a4+.4)*r*.55,Math.sin(a4+.4)*r*.55);c.moveTo(Math.cos(a4)*r*.4,Math.sin(a4)*r*.4);c.lineTo(Math.cos(a4-.4)*r*.55,Math.sin(a4-.4)*r*.55);c.stroke();}
      c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.moveTo(-r,-r*.2);c.lineTo(-r*.2,-r);c.lineTo(0,-r);c.lineTo(-r,0);c.closePath();c.fill();c.restore();gloss(c,x,y,r,1.1);}
    else if(style==='chrome'){var cg=c.createLinearGradient(x,y-r,x,y+r);cg.addColorStop(0,'#ffffff');cg.addColorStop(.45,'#9aa2b6');cg.addColorStop(.5,'#3a3e4c');cg.addColorStop(.62,'#c8d0e0');cg.addColorStop(1,'#5a6070');c.fillStyle=cg;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
      c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.translate(x,y);c.rotate(rot);seams(c,r,'rgba(30,34,46,.7)',Math.max(1.2,r*.06));c.restore();gloss(c,x,y,r,1.2);}
    else if(style==='gold'){c.shadowColor='#ffd23d';c.shadowBlur=14;sphere(c,x,y,r,'#fff6c8','#ffc23d','#8a5a00');c.shadowBlur=0;c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.translate(x,y);c.rotate(rot);seams(c,r,'rgba(110,70,0,.8)',Math.max(1.4,r*.075));c.restore();gloss(c,x,y,r,1.1);
      var sp=(t*1.4)%3;if(sp<1){var sx=x+Math.cos(sp*6)*r*.5,sy=y-r*.5;c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.moveTo(sx,sy-r*.18);c.lineTo(sx+r*.05,sy);c.lineTo(sx,sy+r*.18);c.lineTo(sx-r*.05,sy);c.closePath();c.fill();}}
    else if(style==='melon'){sphere(c,x,y,r,'#9ae86a','#3aa83a','#1a5a1a');c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.translate(x,y);c.rotate(rot);c.strokeStyle='#1a5a1a';c.lineWidth=Math.max(2,r*.14);
      for(var m=-3;m<=3;m++){c.beginPath();c.moveTo(m*r*.32,-r);for(var yy=-r;yy<=r;yy+=r*.2)c.lineTo(m*r*.32+Math.sin(yy/r*5+m)*r*.06,yy);c.stroke();}c.restore();gloss(c,x,y,r,.8);}
    else if(style==='soccer'){sphere(c,x,y,r,'#ffffff','#f0f0f4','#9aa0b0');c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.translate(x,y);c.rotate(rot);function pent(px,py,s){c.fillStyle='#1e1e2e';c.beginPath();for(var k=0;k<5;k++){var a5=k/5*TAU-Math.PI/2;c.lineTo(px+Math.cos(a5)*s,py+Math.sin(a5)*s);}c.closePath();c.fill();}
      pent(0,0,r*.3);for(var k2=0;k2<5;k2++){var a6=k2/5*TAU-Math.PI/2;pent(Math.cos(a6)*r*.82,Math.sin(a6)*r*.82,r*.26);c.strokeStyle='rgba(30,30,46,.5)';c.lineWidth=1;c.beginPath();c.moveTo(Math.cos(a6)*r*.3,Math.sin(a6)*r*.3);c.lineTo(Math.cos(a6)*r*.6,Math.sin(a6)*r*.6);c.stroke();}c.restore();gloss(c,x,y,r,.9);}
    else if(style==='eight'){sphere(c,x,y,r,'#4a4a5a','#16161e','#000000');c.save();c.translate(x,y);c.rotate(rot*.3);c.fillStyle='#ffffff';c.beginPath();c.arc(r*.12,-r*.1,r*.42,0,TAU);c.fill();c.fillStyle='#16161e';c.font='900 '+Math.round(r*.55)+"px 'Orbitron',sans-serif";c.textAlign='center';c.textBaseline='middle';c.fillText('8',r*.12,-r*.07);c.restore();gloss(c,x,y,r,1.1);}
    else if(style==='rainbow'){c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.translate(x,y);c.rotate(rot+t*.4);var R=['#ff3d5a','#ff9a3d','#ffd23d','#39d36a','#2de2ff','#7a6bff','#ff3db5'];for(var b=0;b<7;b++){c.fillStyle=R[b];c.fillRect(-r,-r+b*2*r/7,2*r,2*r/7+1);}c.restore();
      c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.translate(x,y);c.rotate(rot);seams(c,r,'rgba(255,255,255,.55)',Math.max(1.2,r*.06));c.restore();gloss(c,x,y,r,1);}
    else if(style==='pixel'){c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();var px2=Math.max(2,r/4.5);for(var gx=x-r;gx<x+r;gx+=px2)for(var gy=y-r;gy<y+r;gy+=px2){var dx=(gx+px2/2-x)/r,dy=(gy+px2/2-y)/r,d=dx*dx+dy*dy;if(d>1)continue;var l=1-(dx+.4)*(dy+.4)*.35-d*.3;c.fillStyle=l>.95?shadeCol(color,.4):l>.75?color:darkCol(color,.35);c.fillRect(gx,gy,px2+.5,px2+.5);}
      c.restore();c.fillStyle='rgba(255,255,255,.75)';c.fillRect(x-r*.5,y-r*.55,px2*1.6,px2*1.6);}
    else{c.restore();return _base(c,x,y,r,rot,color,'classic');}
    c.strokeStyle='rgba(8,6,20,.45)';c.lineWidth=Math.max(1,r*.04);c.beginPath();c.arc(x,y,r-.5,0,TAU);c.stroke();
    c.restore();}
  drawBasketball=draw;

  /* zen / hns beach balls use the new design */
  var _dd=drawDeco;drawDeco=function(p,cx,cy){if(p&&p.deco==='beachball'&&p.kind==='circle'){var rot=(p._rot=(p._rot||0)+(p.vx||0)/Math.max(8,p.r));draw(ctx,p.x-cx,p.y-cy,p.r,rot,'#ff3d5a','beach');return;}return _dd.apply(this,arguments);};

  /* ---------- hoop look (read by hoops3) ---------- */
  function look(){return LOOK;}
  /* remember the player's ball across games/reloads (player is re-created every match) */
  function applySaved(){if(player){player._ball={color:BALL.color,style:BALL.style};}}
  var _sgB=startGame;startGame=function(){var r=_sgB.apply(this,arguments);applySaved();return r;};

  /* ---------- studio modal (Ball tab + Hoop tab) ---------- */
  function el(id){return document.getElementById(id);}
  var raf=0,tab='ball';
  function ensureBall(){if(player){if(!player._ball||(player._ball.style==='classic'&&player._ball.color==='#e8752b'&&(BALL.style!=='classic'||BALL.color!=='#e8752b')))player._ball={color:BALL.color,style:BALL.style};return player._ball;}return BALL;}
  function thumb(st,col){var cv=document.createElement('canvas');cv.width=cv.height=56;draw(cv.getContext('2d'),28,28,22,-.35,col,st);return cv.toDataURL();}
  function build(){var m=el('bball-modal');if(!m||m._v2)return;m._v2=1;var card=m.querySelector('.m-card');card.style.maxWidth='';card.classList.add('bs-card');
    card.innerHTML='<div class="m-title">Ball &amp; Hoop <span>Studio</span></div><div class="bs-tabs" role="tablist"><button class="bs-tab on" data-tab="ball" data-testid="studio-tab-ball">Ball</button><button class="bs-tab" data-tab="hoop" data-testid="studio-tab-hoop">Hoop &amp; Rim</button></div>'+
      '<div class="m-body bs-body"><div class="bs-stage"><canvas id="bball-preview" width="300" height="230" data-testid="studio-preview"></canvas><div class="bs-name" id="bs-name" data-testid="studio-current-name"></div></div>'+
      '<div class="bs-pane" id="bs-ball"><div class="section-label"><span>Design</span></div><div class="bs-grid" id="bball-styles"></div><div class="section-label"><span>Colour</span></div><div class="bs-cols" id="bball-colors"></div></div>'+
      '<div class="bs-pane" id="bs-hoop" hidden><div class="section-label"><span>Hoop Style</span></div><div class="bs-grid bs-grid-h" id="bs-hoops"></div><div class="section-label"><span>Rim Colour</span></div><div class="bs-cols" id="bs-rims"></div></div></div>'+
      '<div class="cust-done-wrap"><button class="btn" id="bball-start" data-testid="bball-start">Done</button></div>';
    card.querySelectorAll('.bs-tab').forEach(function(b){b.onclick=function(){tab=b.dataset.tab;card.querySelectorAll('.bs-tab').forEach(function(x){x.classList.toggle('on',x===b);});el('bs-ball').hidden=tab!=='ball';el('bs-hoop').hidden=tab!=='hoop';};});
    el('bball-start').addEventListener('click',function(){close();});
    m.addEventListener('click',function(e){if(e.target===m)close();});}
  function close(){var m=el('bball-modal');m.classList.remove('open');cancelAnimationFrame(raf);raf=0;if(m._gate){m._gate=false;try{hoopsReleaseGate();}catch(e){}}}
  function fill(){var b=ensureBall();var g=el('bball-styles');g.innerHTML='';STY.forEach(function(s){var x=document.createElement('button');x.className='bs-opt'+(b.style===s[0]?' on':'');x.setAttribute('data-testid','ball-style-'+s[0]);x.innerHTML='<img alt="" src="'+thumb(s[0],b.color)+'"><span>'+s[1]+'</span>';x.onclick=function(){b.style=s[0];BALL.style=s[0];sv('frea_ball',BALL);fill();};g.appendChild(x);});
    var cw=el('bball-colors');cw.innerHTML='';COLS.forEach(function(c){var x=document.createElement('button');x.className='bball-sw'+(b.color===c?' active':'');x.style.background=c;x.setAttribute('data-c',c);x.setAttribute('data-testid','ball-color-'+c.slice(1));x.setAttribute('aria-label','Colour '+c);x.onclick=function(){b.color=c;BALL.color=c;sv('frea_ball',BALL);fill();};cw.appendChild(x);});
    var H=(window.FreaHoops3&&FreaHoops3.styles)||{},hg=el('bs-hoops');hg.innerHTML='';Object.keys(H).forEach(function(k){var x=document.createElement('button');x.className='bs-opt bs-hopt'+(LOOK.style===k?' on':'');x.setAttribute('data-testid','hoop-style-'+k);x.innerHTML='<i style="--a:'+H[k].frame+';--b:'+H[k].rim+'"></i><span>'+H[k].name+'</span>';x.onclick=function(){LOOK.style=k;sv('frea_hoop_look',LOOK);fill();};hg.appendChild(x);});
    var RC=[['auto','#888'],['orange','#ff6a1f'],['red','#e8322a'],['blue','#2d8aff'],['pink','#ff3db5'],['lime','#9be22d'],['white','#f4f6fb'],['black','#2a2a36']],rw=el('bs-rims');rw.innerHTML='';RC.forEach(function(r){var x=document.createElement('button');x.className='bball-sw'+(LOOK.rim===r[0]?' active':'');x.style.background=r[0]==='auto'?'conic-gradient(#ff6a1f,#2de2ff,#ffd23d,#ff6a1f)':r[1];x.title=r[0]==='auto'?'Match style':r[0];x.setAttribute('data-testid','rim-color-'+r[0]);x.onclick=function(){LOOK.rim=r[0];sv('frea_hoop_look',LOOK);fill();};rw.appendChild(x);});
    var nm=STY.filter(function(s){return s[0]===b.style;})[0];el('bs-name').textContent=(nm?nm[1]:'Classic')+' ball · '+((H[LOOK.style]||{}).name||'Pro Glass')+' hoop';}
  function preview(){var cv=el('bball-preview');if(!cv){raf=0;return;}var c=cv.getContext('2d'),t=now(),b=ensureBall();c.clearRect(0,0,cv.width,cv.height);
    /* mini hoop on the right, ball bouncing on the left */
    var S=(window.FreaHoops3&&FreaHoops3.styles||{})[LOOK.style]||{frame:'#fff',rim:'#ff6a1f',sq:'#ff4d3d',net:'rgba(255,255,255,'};var RCM={orange:'#ff6a1f',red:'#e8322a',blue:'#2d8aff',pink:'#ff3db5',lime:'#9be22d',white:'#f4f6fb',black:'#2a2a36'},rc=RCM[LOOK.rim]||S.rim;
    var hx=212,hy=86,hr=34;c.fillStyle='rgba(255,255,255,.06)';c.strokeStyle=S.frame;c.lineWidth=3;c.beginPath();c.roundRect(hx-52,hy-58,104,66,6);c.fill();c.stroke();c.strokeStyle=S.sq;c.lineWidth=2;c.strokeRect(hx-20,hy-30,40,28);
    c.strokeStyle=S.net+'.8)';c.lineWidth=1.4;for(var i=0;i<=6;i++){var nx=hx-hr+i*hr/3,bx2=hx-hr*.55+i*hr*.55/3;c.beginPath();c.moveTo(nx,hy);c.lineTo(bx2+Math.sin(t*3+i)*1.5,hy+44);c.stroke();}for(var j=1;j<4;j++){var w2=hr*(1-j*.15);c.beginPath();c.moveTo(hx-w2,hy+j*11);c.lineTo(hx+w2,hy+j*11);c.stroke();}
    c.strokeStyle=rc;c.lineWidth=4.5;c.beginPath();c.ellipse(hx,hy,hr,hr*.3,0,0,TAU);c.stroke();c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=1.2;c.beginPath();c.ellipse(hx,hy-1,hr*.98,hr*.28,0,Math.PI*.15,Math.PI*.85);c.stroke();
    var ph=(t*1.6)%1,by=196-Math.abs(Math.sin(ph*Math.PI))*110,sq=by>186?.88:1;c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(82,214,40*(1-(196-by)/260),7,0,0,TAU);c.fill();
    c.save();c.translate(82,by);c.scale(1/sq,sq);draw(c,0,0,36,t*2.2,b.color,b.style);c.restore();raf=requestAnimationFrame(preview);}
  function open(gate){build();var m=el('bball-modal');m._gate=!!gate;fill();m.classList.add('open');if(!raf)raf=requestAnimationFrame(preview);}
  showBballModal=function(){open(true);};
  drawBballPreview=function(){};
  /* entry point: a "Ball & Hoop Studio" button inside the Hoops mode settings */
  function addEntry(){try{var SCH=FreaModeSettings.schemas,list=SCH.hoops||[];list=list.filter(function(r){return !(r&&(r.k==='hoopstyle'||r.k==='rimcol'||r.head==='Hoop Look'));});SCH.hoops=list;}catch(e){}
    var _r=FreaModeSettings.render;FreaModeSettings.render=function(){var r=_r.apply(this,arguments);try{var b=document.getElementById('xm-settings');if(b&&gameMode==='hoops'&&!b.querySelector('.bs-entry')){var d=document.createElement('button');d.className='bs-entry';d.setAttribute('data-testid','open-ball-hoop-studio');d.innerHTML='<b>Ball &amp; Hoop Studio</b><small>Ball design, hoop style and rim colour</small>';d.onclick=function(ev){ev.stopPropagation();open(false);};b.insertBefore(d,b.firstChild);b.style.display='';}}catch(e){}return r;};
    try{FreaModeSettings.render();}catch(e){}}
  setTimeout(addEntry,800);
  return {open:open,look:look,ball:function(){return BALL;},styles:STY,draw:draw};
})();
window.FreaBalls=FreaBalls;
