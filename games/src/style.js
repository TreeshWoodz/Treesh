/* =====================================================================
   FREA! CHARACTER STYLE 2.0 — matches the official reference art:
   glossy jelly body · huge glossy eyes w/ twin catch-lights · soft blush
   · open "D" smile w/ tongue · thick white antennae w/ glossy ball tips
   · big translucent glass wings · glossy dangling legs w/ ball feet
   ===================================================================== */
(function(){
  if(typeof Flea==='undefined')return;
  var P=Flea.prototype;
  var _eyes=P.drawEyes,_mouth=P.drawMouth,_ant=P.drawAntenna,_wings=P.drawWings,_body=P.drawBody,_foot=P._legFoot;
  function blinkK(f){var t=(performance.now()+(f._blinkSeed||(f._blinkSeed=Math.random()*4000)))%4200;return t<110?Math.max(0.12,Math.abs(t-55)/55):1;}
  /* ---- big glossy eyes ---- */
  function bigEye(ex,ey,R,ec,look,bk){
    ctx.save();ctx.translate(ex,ey);ctx.scale(1,bk);
    ctx.fillStyle='rgba(20,16,40,.28)';ctx.beginPath();ctx.ellipse(0,0.5,R+0.7,R*1.1+0.7,0,0,7);ctx.fill();
    var sg=ctx.createRadialGradient(-R*0.35,-R*0.45,R*0.1,0,0,R*1.1);sg.addColorStop(0,'#ffffff');sg.addColorStop(0.75,'#f2f6ff');sg.addColorStop(1,'#c9d3ec');
    ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(0,0,R,R*1.1,0,0,7);ctx.fill();
    var pr=R*0.72,px=look*R*0.16,py=R*0.12;
    var custom=ec&&ec.toLowerCase()!=='#101018';
    if(custom){var ig=ctx.createRadialGradient(px-pr*.3,py-pr*.3,pr*.1,px,py,pr);ig.addColorStop(0,lighten(ec,.45));ig.addColorStop(.7,ec);ig.addColorStop(1,darken(ec,.45));ctx.fillStyle=ig;ctx.beginPath();ctx.arc(px,py,pr,0,7);ctx.fill();ctx.fillStyle='#0a0814';ctx.beginPath();ctx.arc(px,py,pr*.55,0,7);ctx.fill();}
    else{var pg=ctx.createRadialGradient(px-pr*.3,py-pr*.35,pr*.1,px,py,pr);pg.addColorStop(0,'#3a3350');pg.addColorStop(.55,'#12101c');pg.addColorStop(1,'#050409');ctx.fillStyle=pg;ctx.beginPath();ctx.arc(px,py,pr,0,7);ctx.fill();}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(px-pr*0.36,py-pr*0.42,pr*0.4,pr*0.36,-0.4,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(px+pr*0.38,py+pr*0.36,pr*0.17,0,7);ctx.fill();
    ctx.restore();
  }
  P.drawEyes=function(){
    if(this.infected||(this.eyes!=='cute'&&this.eyes!=='normal'))return _eyes.call(this);
    var look=Math.sin((this.ea||0)*.6)*0.8+0.4,bk=blinkK(this),R=this.eyes==='normal'?3.9:4.5;
    bigEye(-2.6,-3.4,R,this.eyeColor,look,bk);bigEye(6.4,-3.4,R,this.eyeColor,look,bk);
  };
  /* ---- soft blush that sits under the new eyes ---- */
  P.drawBody=function(){
    var c=this.cheek;if(c==='on')this.cheek='off';
    _body.call(this);
    this.cheek=c;
    if(c==='on'&&!this.infected){[[-6.2,2.6],[10.4,2.6]].forEach(function(p){var g=ctx.createRadialGradient(p[0],p[1],0.2,p[0],p[1],3.6);g.addColorStop(0,'rgba(255,120,175,.85)');g.addColorStop(1,'rgba(255,120,175,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(p[0],p[1],3.8,2.6,0,0,7);ctx.fill();});}
  };
  /* ---- open "D" smile with tongue ---- */
  P.drawMouth=function(){
    if(this.infected||this.mouth!=='smile')return _mouth.call(this);
    ctx.save();var x=2,y=3.2;
    ctx.fillStyle='#3a0f24';ctx.beginPath();ctx.moveTo(x-3.4,y);ctx.quadraticCurveTo(x,y-0.8,x+3.4,y);ctx.quadraticCurveTo(x+3.1,y+4.6,x,y+4.8);ctx.quadraticCurveTo(x-3.1,y+4.6,x-3.4,y);ctx.fill();
    ctx.save();ctx.clip();ctx.fillStyle='#ff5f8f';ctx.beginPath();ctx.ellipse(x+0.2,y+4.4,2.4,1.9,0,0,7);ctx.fill();ctx.restore();
    ctx.strokeStyle='rgba(20,6,14,.55)';ctx.lineWidth=0.6;ctx.stroke();
    ctx.restore();
  };
  /* ---- thick glossy white antennae with ball tips ---- */
  function tube(x0,y0,cx,cy,x1,y1){
    ctx.lineCap='round';
    ctx.strokeStyle='#c9cfe6';ctx.lineWidth=3.6;ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(cx,cy,x1,y1);ctx.stroke();
    ctx.strokeStyle='#ffffff';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(cx,cy,x1,y1);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(x0-0.6,y0);ctx.quadraticCurveTo(cx-0.6,cy,x1-0.6,y1);ctx.stroke();
  }
  function ball(x,y,r){var g=ctx.createRadialGradient(x-r*.4,y-r*.45,r*.1,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.6,'#f1f3fb');g.addColorStop(1,'#b9c1dc');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.arc(x-r*.35,y-r*.4,r*.32,0,7);ctx.fill();}
  P.drawAntenna=function(){
    if(this.ant!=='curly')return _ant.call(this);
    var aL=Math.sin((this.la||0)*1.2)*2.2;
    ctx.save();
    tube(-3,-10,-7.5,-19,-8+aL,-26);tube(4,-10,9,-19,10-aL,-26);
    ball(-8+aL,-26.5,3.4);ball(10-aL,-26.5,3.4);
    ctx.restore();
  };
  /* ---- big translucent glass wings ---- */
  P.drawWings=function(){
    if(this.wings!=='fairy')return _wings.call(this);
    var fl=Math.sin((this.la||0)*4),flap=this.stuck?0.08:0.22;
    ctx.save();
    [-1,1].forEach(function(s){
      ctx.save();ctx.translate(s*8,-6);ctx.rotate(s*(0.3+fl*flap));ctx.scale(1,1-Math.abs(fl)*flap*0.6);
      var g=ctx.createLinearGradient(0,-16,s*14,10);g.addColorStop(0,'rgba(170,215,255,.62)');g.addColorStop(.55,'rgba(110,160,255,.42)');g.addColorStop(1,'rgba(140,110,255,.35)');
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(s*9,-4,9.5,14,s*0.12,0,7);ctx.fill();
      ctx.strokeStyle='rgba(225,240,255,.85)';ctx.lineWidth=1.1;ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=0.7;ctx.beginPath();ctx.ellipse(s*9,-4,6.5,10.5,s*0.12,-2.4,-0.6);ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(s*6,-11,2.2,4,s*0.3,0,7);ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  };
  /* ---- glossy ball feet + chunkier default legs ---- */
  if(typeof LEG_SHAPES!=='undefined'){LEG_SHAPES.default.thick=1.25;LEG_SHAPES.default.len=1.05;}
  P._legFoot=function(foot,style,col,ax,tipx,tipy){
    if(foot!=='dot'||style!=='default')return _foot.call(this,foot,style,col,ax,tipx,tipy);
    var r=2.5,g=ctx.createRadialGradient(tipx-r*.4,tipy-r*.45,r*.1,tipx,tipy,r);g.addColorStop(0,lighten(col,.6));g.addColorStop(.6,lighten(col,.12));g.addColorStop(1,darken(col,.3));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(tipx,tipy,r,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.arc(tipx-r*.35,tipy-r*.4,r*.3,0,7);ctx.fill();
  };

  /* ---- the official cast from the reference sheet ---- */
  var CAST={
    Frea:{color:'#5cc8ff',secondary:'#ff3db5',shape:'round',pattern:'none',eyes:'cute',ant:'curly',legs:'pink',wings:'fairy',mouth:'smile',cheek:'on'},
    Lulu:{color:'#ff7ad9',secondary:'#ffffff',shape:'round',pattern:'glitter',eyes:'cute',ant:'curly',legs:'pastel',wings:'fairy',mouth:'tiny',cheek:'on',hat:'bow'},
    Momo:{color:'#f6e36b',secondary:'#39b8ff',shape:'oval',pattern:'stripes',eyes:'cute',ant:'curly',legs:'magma',wings:'none',mouth:'smirk',cheek:'on',accessory:'backpack'},
    Taro:{color:'#ff8a7a',secondary:'#8a5a2b',shape:'chubby',pattern:'spots',eyes:'cute',ant:'curly',legs:'chrome',wings:'bee',mouth:'grin',cheek:'on',hat:'cowboy'},
    Haru:{color:'#ffe27a',secondary:'#c48a2a',shape:'round',pattern:'none',eyes:'kawaii',ant:'bulbous',legs:'gold',wings:'angel',mouth:'smile',cheek:'on'},
    Mochi:{color:'#fff2a8',secondary:'#c9a200',shape:'egg',pattern:'stripes',eyes:'cute',ant:'curly',legs:'gold',wings:'fairy',mouth:'smile',cheek:'on',glasses:'none'},
    Koko:{color:'#ffb347',secondary:'#8a3a00',shape:'round',pattern:'polka',eyes:'wink',ant:'curly',legs:'chrome',wings:'none',mouth:'tongue',cheek:'on',hat:'flower'},
    Rina:{color:'#ff6f6f',secondary:'#2a0a14',shape:'oval',pattern:'spots',eyes:'cute',ant:'long',legs:'chrome',legShape:'spider',wings:'none',mouth:'tiny',cheek:'on'},
    Mimi:{color:'#ffc48a',secondary:'#ff5fa0',shape:'round',pattern:'polka',eyes:'cute',ant:'heart',legs:'candy',wings:'none',mouth:'smile',cheek:'on',hat:'flower'},
    Rana:{color:'#e6ff5a',secondary:'#1a1a2a',shape:'chubby',pattern:'polka',eyes:'normal',ant:'curly',legs:'aqua',legShape:'tentacle',wings:'none',mouth:'open',brows:'thick',cheek:'off'},
    Kira:{color:'#ff3d6e',secondary:'#9b6bff',shape:'egg',pattern:'circuit',eyes:'robo',ant:'bolt',legs:'ink',wings:'tech',mouth:'smirk',cheek:'off',glasses:'none',aura:'violet'},
    Chibi:{color:'#ffd0dc',secondary:'#8affd0',shape:'round',pattern:'glitter',eyes:'cute',ant:'curly',legs:'aqua',wings:'butterfly',mouth:'smile',cheek:'on'}
  };
  window.FREA_CAST=CAST;
  if(typeof AI_NAMES!=='undefined'){var castN=Object.keys(CAST).filter(function(n){return n!=='Frea';});var rest=AI_NAMES.filter(function(n){return castN.indexOf(n)<0;});AI_NAMES.length=0;castN.concat(rest).forEach(function(n){AI_NAMES.push(n);});}
  if(typeof makeAI==='function'){
    var _mk=makeAI;
    window.makeAI=makeAI=function(name,x,y){
      var c=CAST[name];if(!c)return _mk(name,x,y);
      var spec=Object.assign({size:'normal',legStyle:'default',legShape:'default',eyeColor:'#101018',hat:'none',trail:'none',aura:'none',brows:'none',glasses:'none',cape:'none',accessory:'none'},c);
      if(Math.random()<.35)spec.trail=pick(OPT.trail);
      return new Flea(x,y,false,name,spec);
    };
  }
  if(typeof FIELDS!=='undefined'){FIELDS.color=FIELDS.color||'#5cc8ff';}
})();
