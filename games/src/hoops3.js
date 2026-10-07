/* ===================== FREA! PLUS — HOOPS 3 (look + proportions) =====================
   · rim & board sized from the flea (real-ball proportions: rim ≈ 1.9× ball) on every screen size
   · detailed hoops with 5 styles (Pro Glass · Neon Arcade · Street Chain · Golden · Retro Wood) + rim colour
   · detailed basketball renderer (pebbled leather, inked seams, rim light, contact shadow)
   loaded BEFORE hoops2.js so its rim-size multiplier + extras stack on top. */
var FreaHoops3=(function(){
  if(typeof hoopsSetup==='undefined')return null;
  var TAU=Math.PI*2;
  function G(k){try{return FreaModeSettings.get('hoops',k);}catch(e){return null;}}
  function party(){try{return !!(window.FreaParty&&FreaParty.status());}catch(e){return false;}}
  /* ---------- proportions ---------- */
  function fleaW(){var w=26;try{if(player&&player.w)w=player.w;else if(fleas&&fleas[0])w=fleas[0].w;}catch(e){}return w;}
  hoopRadius=function(){var fw=fleaW();return Math.round(Math.max(34,Math.min(54,fw*1.55)));};
  var _hb=drawHoopBall;drawHoopBall=function(camX,camY){if(!HOOPS_CFG.ball||!player||!player.isBall)return;var bs=player._ball||{color:'#e8752b',style:'classic'};
    var x=player.cx-camX,y=player.cy-camY,r=player.w*0.66;
    ctx.save();ctx.fillStyle='rgba(0,0,0,.28)';var gy=hoopFloorY()-camY,d=Math.max(0,Math.min(1,(gy-y)/260));ctx.beginPath();ctx.ellipse(x,gy+2,r*(1.1-d*.5),r*.22*(1-d*.6),0,0,TAU);ctx.fill();ctx.restore();
    drawBasketball(ctx,x,y,r,player._ballRot||0,bs.color,bs.style);};

  /* ---------- detailed basketball ---------- */
  var _bb=drawBasketball;
  drawBasketball=function(c,x,y,r,rot,color,style){color=color||'#e8752b';style=style||'classic';
    if(style==='beach'||style==='solid')return _bb.apply(this,arguments);
    c.save();if(style==='glow'){c.shadowColor=color;c.shadowBlur=26;}
    var g=c.createRadialGradient(x-r*.35,y-r*.4,r*.08,x+r*.1,y+r*.12,r*1.08);g.addColorStop(0,shadeCol(color,.38));g.addColorStop(.45,color);g.addColorStop(.85,darkCol(color,.3));g.addColorStop(1,darkCol(color,.55));
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.shadowBlur=0;
    c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
    /* pebble grain */
    if(typeof perfMode==='undefined'||!perfMode){var n=Math.round(r*r*.9);for(var i=0;i<n;i++){var a=i*2.39996,rr=Math.sqrt((i+.5)/n)*r,px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;c.fillStyle=i%3?'rgba(0,0,0,.10)':'rgba(255,255,255,.07)';c.fillRect(px,py,Math.max(.8,r*.045),Math.max(.8,r*.045));}}
    /* seams (rotate with roll) */
    c.translate(x,y);c.rotate(rot||0);var sw=Math.max(1.4,r*.075);c.lineCap='round';
    function seams(col,w,off){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(-r,off);c.quadraticCurveTo(0,off+r*.08,r,off);c.stroke();c.beginPath();c.moveTo(off,-r);c.lineTo(off,r);c.stroke();
      c.beginPath();c.ellipse(-r*1.12+off,0,r*.8,r*1.1,0,-Math.PI*.44,Math.PI*.44);c.stroke();c.beginPath();c.ellipse(r*1.12+off,0,r*.8,r*1.1,0,Math.PI*.56,Math.PI*1.44);c.stroke();}
    seams('rgba(255,210,170,.18)',sw*.6,sw*.5);seams('rgba(22,10,4,.92)',sw,0);
    c.restore();
    /* terminator shadow + rim light */
    var sh=c.createRadialGradient(x-r*.3,y-r*.35,r*.6,x,y,r*1.02);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(10,4,0,.45)');c.fillStyle=sh;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
    c.strokeStyle='rgba(255,220,180,.35)';c.lineWidth=Math.max(1,r*.06);c.beginPath();c.arc(x,y,r*.93,Math.PI*.15,Math.PI*.65);c.stroke();
    c.strokeStyle='rgba(20,8,2,.6)';c.lineWidth=Math.max(1.2,r*.05);c.beginPath();c.arc(x,y,r-c.lineWidth*.5,0,TAU);c.stroke();
    /* specular */
    var sp=c.createRadialGradient(x-r*.38,y-r*.42,0,x-r*.38,y-r*.42,r*.38);sp.addColorStop(0,'rgba(255,255,255,.55)');sp.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=sp;c.beginPath();c.arc(x-r*.38,y-r*.42,r*.38,0,TAU);c.fill();
    if(style==='glow'){c.strokeStyle=shadeCol(color,.5);c.lineWidth=2;c.globalAlpha=.7;c.beginPath();c.arc(x,y,r+3,0,TAU);c.stroke();}
    c.restore();};

  /* ---------- hoop styles ---------- */
  var STY={
    pro:{name:'Pro Glass',board:'glass',frame:'#f4f6fb',sq:'#ff4d3d',rim:'#ff6a1f',net:'rgba(250,250,255,',netW:1.5,pole:'#3a4058'},
    neon:{name:'Neon Arcade',board:'neon',frame:'#2de2ff',sq:'#ffd23d',rim:'#ff8a3d',net:'rgba(210,246,255,',netW:1.5,pole:'#2de2ff'},
    street:{name:'Street Chain',board:'steel',frame:'#8a93a8',sq:'#f4f6fb',rim:'#c8ccd8',net:'rgba(200,206,220,',netW:2.2,chain:1,pole:'#2a2e3a'},
    gold:{name:'Golden',board:'onyx',frame:'#ffd23d',sq:'#ffd23d',rim:'#ffc23d',net:'rgba(255,226,140,',netW:1.8,chain:1,pole:'#ffd23d'},
    retro:{name:'Retro Wood',board:'wood',frame:'#f6e7c8',sq:'#c8321e',rim:'#d8321e',net:'rgba(246,234,210,',netW:2,pole:'#5a3a22'}};
  var RIMC={auto:null,orange:'#ff6a1f',red:'#e8322a',blue:'#2d8aff',pink:'#ff3db5',lime:'#9be22d',white:'#f4f6fb',black:'#2a2a36'};
  function LK(){try{return (window.FreaBalls&&FreaBalls.look())||{};}catch(e){return {};}}
  function style(){var k=party()?'pro':(LK().style||'pro');return STY[k]||STY.pro;}
  function rimCol(S){var k=party()?'auto':(LK().rim||'auto');return RIMC[k]||S.rim;}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function board(h,x,y,r,S,blur){var bw=r*3.0,bh=r*1.85,bx=x-bw/2,by=y-bh+r*.32;
    /* pole + arm (from the top so it reads as a hanging arena hoop) */
    ctx.strokeStyle=S.pole;ctx.lineWidth=Math.max(3,r*.12);ctx.beginPath();ctx.moveTo(x,by-6);ctx.lineTo(x,by-Math.max(30,r*1.2));ctx.stroke();
    ctx.lineWidth=Math.max(2,r*.06);ctx.beginPath();ctx.moveTo(x-bw*.3,by);ctx.lineTo(x,by-Math.max(22,r*.9));ctx.lineTo(x+bw*.3,by);ctx.stroke();
    if(S.board==='glass'){ctx.fillStyle='rgba(190,225,255,.16)';rr(bx,by,bw,bh,6);ctx.fill();var sg=ctx.createLinearGradient(bx,by,bx+bw,by+bh);sg.addColorStop(0,'rgba(255,255,255,.22)');sg.addColorStop(.35,'rgba(255,255,255,0)');sg.addColorStop(.6,'rgba(255,255,255,.08)');sg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sg;ctx.fill();
      ctx.lineWidth=Math.max(3,r*.11);ctx.strokeStyle=S.frame;rr(bx,by,bw,bh,6);ctx.stroke();ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;rr(bx+3,by+3,bw-6,bh-6,4);ctx.stroke();}
    else if(S.board==='neon'){ctx.fillStyle='rgba(10,16,38,.78)';rr(bx,by,bw,bh,10);ctx.fill();ctx.strokeStyle='rgba(45,226,255,.1)';ctx.lineWidth=1;for(var gy=by+5;gy<by+bh;gy+=6){ctx.beginPath();ctx.moveTo(bx+3,gy);ctx.lineTo(bx+bw-3,gy);ctx.stroke();}
      ctx.lineWidth=2.6;ctx.strokeStyle=S.frame;ctx.shadowColor=S.frame;ctx.shadowBlur=blur*(14+h.flash*18);rr(bx,by,bw,bh,10);ctx.stroke();ctx.shadowBlur=0;}
    else if(S.board==='steel'){var mg=ctx.createLinearGradient(bx,by,bx,by+bh);mg.addColorStop(0,'#9aa2b6');mg.addColorStop(1,'#5e6478');ctx.fillStyle=mg;rr(bx,by,bw,bh,3);ctx.fill();ctx.fillStyle='rgba(0,0,0,.25)';for(var hx=bx+8;hx<bx+bw-4;hx+=10)for(var hy=by+8;hy<by+bh-4;hy+=10){ctx.beginPath();ctx.arc(hx,hy,1.6,0,TAU);ctx.fill();}
      ctx.strokeStyle='#3a3e4c';ctx.lineWidth=2.5;rr(bx,by,bw,bh,3);ctx.stroke();ctx.fillStyle='rgba(255,61,181,.55)';ctx.font='900 '+Math.round(r*.32)+"px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.fillText('FREA!',x+bw*.28,by+bh*.24);}
    else if(S.board==='onyx'){var og=ctx.createLinearGradient(bx,by,bx+bw,by+bh);og.addColorStop(0,'#1a1626');og.addColorStop(1,'#07060c');ctx.fillStyle=og;rr(bx,by,bw,bh,8);ctx.fill();ctx.lineWidth=Math.max(3,r*.1);ctx.strokeStyle=S.frame;ctx.shadowColor=S.frame;ctx.shadowBlur=blur*(10+h.flash*16);rr(bx,by,bw,bh,8);ctx.stroke();ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,210,61,.9)';ctx.font=Math.round(r*.36)+'px serif';ctx.textAlign='center';ctx.fillText('♛',x,by+bh*.26);}
    else{var wg=ctx.createLinearGradient(bx,by,bx,by+bh);wg.addColorStop(0,'#b07a46');wg.addColorStop(1,'#7a4a24');ctx.fillStyle=wg;rr(bx,by,bw,bh,4);ctx.fill();ctx.strokeStyle='rgba(60,30,10,.4)';ctx.lineWidth=1;for(var pl=by+bh/5;pl<by+bh;pl+=bh/5){ctx.beginPath();ctx.moveTo(bx,pl);ctx.lineTo(bx+bw,pl);ctx.stroke();}
      ctx.strokeStyle=S.frame;ctx.lineWidth=Math.max(2.5,r*.09);rr(bx+3,by+3,bw-6,bh-6,3);ctx.stroke();[[bx+6,by+6],[bx+bw-6,by+6],[bx+6,by+bh-6],[bx+bw-6,by+bh-6]].forEach(function(p){ctx.fillStyle='#3a2a1a';ctx.beginPath();ctx.arc(p[0],p[1],2,0,TAU);ctx.fill();});}
    /* shooter's square */
    var sw2=r*1.15,sh2=r*.85;ctx.lineWidth=Math.max(2.2,r*.075);ctx.strokeStyle=S.sq;if(S.board==='neon'){ctx.shadowColor=S.sq;ctx.shadowBlur=blur*10;}ctx.strokeRect(x-sw2/2,y-sh2+r*.06,sw2,sh2);ctx.shadowBlur=0;
    /* bracket from board to rim */
    ctx.fillStyle=S.board==='wood'?'#3a2a1a':'#4a5068';ctx.beginPath();ctx.moveTo(x-r*.28,y+r*.02);ctx.lineTo(x+r*.28,y+r*.02);ctx.lineTo(x+r*.16,y+r*.28);ctx.lineTo(x-r*.16,y+r*.28);ctx.closePath();ctx.fill();
    return {bx:bx,by:by,bw:bw,bh:bh};}
  function net(h,camX,camY,S,blur){if(!h.net)return;var nc=h.bad?'rgba(255,130,130,':S.net;ctx.lineCap='round';
    for(var s=0;s<h.net.length-1;s++){var A=h.net[s],B=h.net[s+1];for(var k=0;k<NET_SEGS;k++){var al=(.85-k*.1).toFixed(2);ctx.strokeStyle=nc+al+')';ctx.lineWidth=S.netW*(1-k*.08);
        if(S.chain){ctx.setLineDash([2.4,1.6]);}
        ctx.beginPath();ctx.moveTo(A[k].x-camX,A[k].y-camY);ctx.lineTo(B[k+1].x-camX,B[k+1].y-camY);ctx.stroke();ctx.beginPath();ctx.moveTo(B[k].x-camX,B[k].y-camY);ctx.lineTo(A[k+1].x-camX,A[k+1].y-camY);ctx.stroke();ctx.setLineDash([]);}}
    ctx.strokeStyle=nc+'.5)';ctx.lineWidth=S.netW;ctx.beginPath();for(var s3=0;s3<h.net.length;s3++){var nn=h.net[s3][NET_SEGS];if(!s3)ctx.moveTo(nn.x-camX,nn.y-camY);else ctx.lineTo(nn.x-camX,nn.y-camY);}ctx.stroke();
    /* net hooks under the rim */
    ctx.fillStyle=nc+'.9)';for(var s4=0;s4<h.net.length;s4++){var a=h.net[s4][0];ctx.beginPath();ctx.arc(a.x-camX,a.y-camY+1,1.3,0,TAU);ctx.fill();}}
  drawHoops=function(camX,camY){var S=style(),blur=perfMode?0:1;
    for(var i=0;i<hoops.length;i++){var h=hoops[i],x=h.x-camX,y=h.y-camY,r=h.r,RC=h.bad?'#ff3b3b':rimCol(S);ctx.save();ctx.lineJoin='round';
      var b=board(h,x,y,r,h.bad?STY.neon:S,blur);if(h.bad){ctx.strokeStyle='#ff3b3b';ctx.lineWidth=2.6;ctx.shadowColor='#ff3b3b';ctx.shadowBlur=blur*14;rr(b.bx,b.by,b.bw,b.bh,10);ctx.stroke();ctx.shadowBlur=0;}
      /* back half of the rim */
      var rt=Math.max(3.2,r*.11);ctx.strokeStyle=darkCol(RC.length===7?RC:'#ff6a1f',.35);ctx.lineWidth=rt;ctx.beginPath();ctx.ellipse(x,y,r,r*.3,0,Math.PI,TAU);ctx.stroke();
      net(h,camX,camY,S,blur);
      /* front half: tube with highlight */
      if(S.board==='neon'||h.bad){ctx.shadowColor=RC;ctx.shadowBlur=blur*(14+h.flash*24);}
      ctx.strokeStyle=RC;ctx.lineWidth=rt;ctx.beginPath();ctx.ellipse(x,y,r,r*.3,0,0,Math.PI);ctx.stroke();ctx.shadowBlur=0;
      ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=Math.max(1,rt*.3);ctx.beginPath();ctx.ellipse(x,y-rt*.2,r*.98,r*.28,0,Math.PI*.15,Math.PI*.85);ctx.stroke();
      ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+rt*.35,r,r*.3,0,Math.PI*.1,Math.PI*.9);ctx.stroke();
      /* rim-end knobs = physical bounce points (subtle) */
      for(var sd=-1;sd<=1;sd+=2){ctx.fillStyle=RC;ctx.beginPath();ctx.arc(x+sd*r,y,rt*.62,0,TAU);ctx.fill();}
      if(h.flash>.02){ctx.globalAlpha=h.flash*.8;ctx.lineWidth=2.5;ctx.strokeStyle=h.bad?'#ff6a6a':'#ffd23d';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=blur*16;ctx.beginPath();ctx.ellipse(x,y,r+(1-h.flash)*22,(r+(1-h.flash)*22)*.3,0,0,TAU);ctx.stroke();ctx.globalAlpha=1;ctx.shadowBlur=0;}
      if(h.bad){ctx.fillStyle='#ff3b3b';ctx.font="900 13px 'Orbitron',sans-serif";ctx.textAlign='center';ctx.fillText('✖ BAD',x,b.by-8);}
      ctx.restore();}};
  /* ---------- settings rows (appended after Hoops 2 rebuilds the schema) ---------- */
  function rows(){try{var SCH=FreaModeSettings.schemas,list=SCH.hoops||[];if(list.some(function(r){return r&&r.k==='hoopstyle';}))return;
      var at=list.findIndex(function(r){return r&&r.k==='balltype';});var add=[{head:'Hoop Look'},{k:'hoopstyle',l:'Hoop Style',sub:'Backboard, rim and net design',opts:Object.keys(STY).map(function(k){return [k,STY[k].name];}),def:'pro'},
        {k:'rimcol',l:'Rim Colour',opts:[['auto','Style'],['orange','Orange'],['red','Red'],['blue','Blue'],['pink','Pink'],['lime','Lime'],['white','White'],['black','Black']],def:'auto'}];
      if(at<0)list.push.apply(list,add);else list.splice.apply(list,[at+1,0].concat(add));SCH.hoops=list;FreaModeSettings.render();}catch(e){console.warn('hoops3 rows',e);}}
  return {styles:STY,style:style};
})();
window.FreaHoops3=FreaHoops3;
