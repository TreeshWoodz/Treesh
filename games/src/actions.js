/* =====================================================================
   ACTIONS 2.0 — real choreography for every flea action.
   Fleas now grow little jelly arms while acting, and each move is a
   multi-phase routine with anticipation, follow-through and FX:
   dance (4-beat groove + spin move + notes) · spin (wind-up, 3 turns,
   dizzy wobble) · wave (arm waving from the shoulder) · cheer (arm pumps
   + confetti) · backflip (crouch → full flip → land squash) · jump (star
   jump) · karate (punch combo) · headbang (air guitar) · moonwalk · bow ·
   stomp (dust) · peek (hands over eyes) · lie (snoozing Z's) · sit.
   Also exposes window.__fleaHeadHook(flea) drawn in the flea's local,
   face-flipped space (used by Zen items worn on heads).
   ===================================================================== */
(function(){
  if(typeof Flea==='undefined')return;
  var P=Flea.prototype,TAU=Math.PI*2;
  function cl(v,a,b){return v<a?a:(v>b?b:v);}
  function ease(t){t=cl(t,0,1);return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
  function sn(x){return Math.sin(x);}
  var NOTE_COLS=['#ff3db5','#2de2ff','#ffd23d','#c6ff3d','#9b6bff'];

  /* ---------- pose: body transform + arm angles (0 = down, PI = up) ---------- */
  function pose(f){
    var a=f.action,t=(f.actionT||0)/1000,o={x:0,y:0,rot:0,sx:1,sy:1,aL:.35,aR:.35,bL:0,bR:0,lenL:1,lenR:1,fx:'',arms:!!a};
    if(!a){
      if(f.carry&&(f.carryMode==='juggle'||f.carryMode==='sway')){o.arms=true;var w=sn((f.carryT||0)*.006);o.aL=2.75+w*.12;o.aR=2.75-w*.12;o.bL=o.bR=.35;}
      else if(f.carry&&(f.carryMode==='push'||f.carryMode==='roll')){o.arms=true;o.aL=o.aR=1.45;o.rot=.12*(f.carrySide>0?-1:1)*(f.face||1);}
      return o;}
    switch(a){
      case 'dance':{var b=t*2.3,ph=b%4,beat=Math.abs(sn(b*Math.PI));
        o.y=-beat*6;o.x=sn(b*Math.PI*.5)*5;o.rot=sn(b*Math.PI*.5)*.22;o.sx=1+beat*.06;o.sy=1-beat*.08;
        o.aL=2.3+sn(b*Math.PI)*.8;o.aR=2.3-sn(b*Math.PI)*.8;o.bL=o.bR=-.4;
        if(ph>3.3){var s=(ph-3.3)/.7;o.rot=ease(s)*TAU;o.aL=o.aR=1.6;o.y=-sn(s*Math.PI)*10;}
        o.fx='notes';break;}
      case 'spin':{var c=t%2.6;
        if(c<.3){var k=c/.3;o.rot=-.35*ease(k);o.sy=1-.18*k;o.sx=1+.1*k;o.aL=o.aR=.2;}
        else if(c<2){var k2=(c-.3)/1.7;o.rot=-.35+ease(k2)*TAU*3;o.aL=o.aR=1.57;o.lenL=o.lenR=1.15;o.sx=1-.08*sn(k2*Math.PI);o.y=-sn(k2*Math.PI)*6;o.fx='whirl';}
        else{var k3=(c-2)/.6;o.rot=sn(k3*18)*.14*(1-k3);o.x=sn(k3*9)*2;o.aL=.9+sn(k3*14)*.4;o.aR=.9-sn(k3*14)*.4;o.fx='dizzy';}
        break;}
      case 'wave':{var ww=sn(t*9);o.aR=2.55+ww*.45;o.bR=-.25+ww*.2;o.lenR=1.1;o.aL=.45;o.bL=.5;o.rot=-.06+ww*.04;o.y=-Math.abs(sn(t*4.5))*2;o.fx='wave';break;}
      case 'cheer':{var cb=Math.abs(sn(t*7));o.y=-cb*14;o.sy=1+cb*.08;o.sx=1-cb*.05;o.aL=o.aR=2.6+cb*.4;o.bL=o.bR=-.2;o.rot=sn(t*7)*.08;o.fx='confetti';break;}
      case 'flip':{var fc=t%1.5,dir=-1;
        if(fc<.28){var q=fc/.28;o.sy=1-.25*ease(q);o.sx=1+.14*ease(q);o.y=3*q;o.aL=o.aR=.2+q*.4;}
        else if(fc<1.05){var q2=(fc-.28)/.77;o.rot=dir*ease(q2)*TAU;o.y=-sn(q2*Math.PI)*30;o.aL=o.aR=q2<.8?2.4:1.2;o.bL=o.bR=-.8;o.sx=o.sy=1-.08*sn(q2*Math.PI);o.fx='trail';}
        else{var q3=(fc-1.05)/.45;var sq=sn(q3*Math.PI)*(1-q3);o.sy=1-.22*sq;o.sx=1+.16*sq;o.aL=o.aR=1.3+q3*1.2;o.fx=q3<.3?'land':'';}
        break;}
      case 'jump':{var jc=t%1.1,jq=jc/1.1,h=sn(jq*Math.PI);
        if(jq<.15){o.sy=1-.2*(jq/.15);o.sx=1+.12*(jq/.15);o.aL=o.aR=.3;}
        else{o.y=-h*22;o.aL=o.aR=.4+h*2.2;o.lenL=o.lenR=1+h*.15;o.sy=1+h*.1;o.sx=1-h*.06;}
        break;}
      case 'squish':{o.aL=o.aR=1.5;o.lenL=o.lenR=1.2;break;}
      case 'lie':{var lk=Math.min(1,t*2.4);o.rot=-(Math.PI*.5)*ease(lk);o.y=4*lk;o.aL=.2;o.aR=1.2+sn(t*1.4)*.1;o.sy=1+sn(t*1.8)*.03;o.fx='zzz';break;}
      case 'sit':{var sk=Math.min(1,t*3);o.y=7*sk;o.sy=1-.1*sk;o.sx=1+.06*sk;o.aL=o.aR=.9;o.bL=o.bR=.6;o.rot=sn(t*1.2)*.03;break;}
      case 'wiggle':{var wg=sn(t*14);o.sx=1+wg*.14;o.sy=1-wg*.1;o.x=wg*2;o.aL=1.3+wg*.7;o.aR=1.3-wg*.7;o.rot=wg*.08;break;}
      case 'headbang':{var hb=sn(t*15);o.rot=.18+hb*.32;o.y=Math.abs(hb)*3;o.aL=1.1;o.bL=-1.1;o.aR=.9+Math.abs(sn(t*15))*.7;o.bR=.8;o.fx='notes';break;}
      case 'karate':{var kc=t%1.2,kk=Math.floor(t/1.2)%3,pk=kc<.35?ease(kc/.35):(kc<.6?1:1-ease((kc-.6)/.6));
        if(kk<2){var right=kk===0;o.x=pk*6;o.rot=pk*.12;if(right){o.aR=1.57;o.lenR=1+pk*.5;o.aL=2.3;o.bL=-.9;}else{o.aL=1.57;o.lenL=1+pk*.5;o.aR=2.3;o.bR=-.9;}}
        else{o.rot=-pk*.5;o.y=-pk*8;o.aL=o.aR=2.2;o.bL=o.bR=-.6;}
        o.fx=pk>.85?'whoosh':'';break;}
      case 'moonwalk':{o.x=-((t*22)%26)+13;o.y=sn(t*10)*1.5;o.rot=.14;o.aL=.5+sn(t*5)*.4;o.aR=.5-sn(t*5)*.4;break;}
      case 'bow':{var bk=cl(t*1.8,0,1),hold=t>1.4?ease(cl((t-1.4)*2,0,1)):0,d=ease(bk)*(1-hold);o.rot=d*.55;o.y=d*3;o.aR=1.2*d+.2;o.bR=1.2*d;o.aL=.3+1.4*d;break;}
      case 'stomp':{var st=t%.8,sq2=st/.8;if(sq2<.55){o.y=-sn(sq2/.55*Math.PI*.5)*14;o.aL=o.aR=2.4;o.sy=1.08;}else{var l2=(sq2-.55)/.45;o.y=-14*(1-ease(cl(l2*4,0,1)));o.sy=l2<.25?1:1-.18*sn((l2-.25)/.75*Math.PI);o.sx=2-o.sy;o.aL=o.aR=1;o.fx=l2>.25&&l2<.5?'dust':'';}break;}
      case 'peek':{var pc=t%2.4,open=pc>1.4&&pc<2.1;o.aL=o.aR=open?2.3:3.55;o.bL=o.bR=open?.3:.5;o.lenL=o.lenR=open?1.05:.8;o.sx=o.sy=.92;o.x=open?sn(t*10)*2:0;break;}
      /* ----- Actions 3.0 (negative arm angle = reach inward / across the body) ----- */
      case 'clap':{var cp=sn(t*12);o.aL=o.aR=-1.15+cp*.38;o.bL=o.bR=.3;o.lenL=o.lenR=.95;o.y=-Math.abs(sn(t*6))*2;o.fx=cp<-.85?'clap':'';break;}
      case 'flex':{var fp=Math.abs(sn(t*3.2));o.aL=o.aR=2.05;o.bL=o.bR=-1.7;o.lenL=o.lenR=.9;o.sx=1+fp*.1;o.sy=1+fp*.05;o.y=-fp*2;o.rot=sn(t*1.6)*.06;o.fx='shine';break;}
      case 'laugh':{var lb=Math.abs(sn(t*13));o.y=-lb*4;o.rot=sn(t*2.2)*.16+(lb*.05);o.sx=1+lb*.05;o.aL=o.aR=-.55;o.bL=o.bR=.5;o.lenL=o.lenR=.85;o.fx='haha';break;}
      case 'cry':{var cr=sn(t*16);o.aL=o.aR=-2.55+cr*.06;o.bL=o.bR=.6;o.lenL=o.lenR=.82;o.sy=.94;o.sx=1.04;o.y=2;o.x=cr*.8;o.fx='tears';break;}
      case 'sneeze':{var zc=t%2.2;if(zc<1.2){var zk=zc/1.2;o.rot=-.28*ease(zk);o.sy=1+.1*zk;o.sx=1-.04*zk;o.aL=o.aR=.4;}else if(zc<1.55){var zq=(zc-1.2)/.35;o.rot=-.28+.6*ease(zq);o.x=5*zq;o.sy=.9;o.sx=1.1;o.aL=o.aR=.9;o.fx='sneeze';}else{var zr=(zc-1.55)/.65;o.rot=.32*(1-ease(zr));o.x=5*(1-zr);o.aL=o.aR=.4;}break;}
      case 'shrug':{var sp2=Math.abs(sn(t*2.6));o.aL=o.aR=1.75;o.bL=o.bR=1.1;o.lenL=o.lenR=.95;o.y=-sp2*4;o.rot=sn(t*1.3)*.12;o.sy=1+sp2*.04;break;}
      case 'heart':{o.aL=o.aR=-2.75;o.bL=o.bR=-.5;o.lenL=o.lenR=.9;o.y=-Math.abs(sn(t*3))*3;o.rot=sn(t*2)*.08;o.fx='hearts';break;}
      case 'twirl':{var tw=t%1.8,twk=tw<1.3?ease(tw/1.3):1;o.rot=twk*TAU;o.aL=o.aR=2.95;o.bL=o.bR=-.3;o.lenL=o.lenR=1.1;o.y=-sn(twk*Math.PI)*8;o.sx=1-.1*sn(twk*Math.PI);o.fx='sparkle';break;}
      case 'yoga':{o.y=-10-sn(t*1.6)*3;o.aL=o.aR=1.25;o.bL=o.bR=1.3;o.lenL=o.lenR=.95;o.sy=.95;o.sx=1.03;o.fx='om';break;}
      case 'tantrum':{var tt=sn(t*19);o.y=-Math.abs(tt)*6;o.rot=sn(t*23)*.16;o.aL=2.2+sn(t*21)*.9;o.aR=2.2-sn(t*21)*.9;o.bL=o.bR=-.4;o.sx=1+Math.abs(tt)*.06;o.fx='steam';break;}
      case 'facepalm':{var fk=Math.min(1,t*3);o.aR=-2.2-.5*ease(fk);o.bR=.7;o.lenR=.8;o.aL=.35;o.rot=.16*ease(fk)+sn(t*1.5)*.03;o.sy=.97;o.fx=t>.4?'sweat':'';break;}
      case 'salute':{var sk2=Math.min(1,t*4);o.aR=-1.2-1.65*ease(sk2);o.bR=.55;o.lenR=.86;o.aL=.15;o.sy=1.05;o.sx=.97;o.rot=-.03;break;}
      case 'sing':{var sg=sn(t*3);o.aR=-1.25;o.bR=.8;o.lenR=.8;o.aL=2.2+sg*.35;o.bL=-.3;o.lenL=1.1;o.rot=sg*.1;o.y=-Math.abs(sn(t*6))*2;o.fx='notes';break;}
      case 'faint':{if(t<.6){o.rot=sn(t*20)*.15*(t/.6);o.x=sn(t*12)*2;o.aL=o.aR=1.4;o.fx='dizzy';}else{var fn=ease(Math.min(1,(t-.6)*2.5));o.rot=(Math.PI*.5)*fn;o.y=4*fn;o.aL=o.aR=.2+1.2*fn;o.fx='dizzy';}break;}
      case 'hug':{var hk=t%2.4,hc=hk<.9?0:(hk<1.5?ease((hk-.9)/.6):1-ease((hk-1.5)/.9));o.aL=o.aR=1.95-hc*2.6;o.bL=o.bR=-.2+hc*.6;o.lenL=o.lenR=1.2-hc*.25;o.sy=1-hc*.05;o.sx=1+hc*.06;o.fx=hc>.6?'hearts':'';break;}
      case 'magic':{var mg=sn(t*7);o.aR=2.5+mg*.4;o.bR=-.3;o.lenR=1.15;o.aL=.5;o.y=-Math.abs(sn(t*3.5))*3;o.rot=-.05+mg*.04;o.fx='magic';break;}
      default:{o.aL=o.aR=.6+Math.abs(sn(t*6))*.6;}
    }
    return o;
  }

  /* ---------- little jelly arms ---------- */
  function arm(f,side,ang,bend,len){
    var sh=SHAPES[f.shape]||SHAPES.round,sx=side*(sh.rx*.86),sy=0.5,L=13.5*len;
    var dx=side*Math.sin(ang),dy=Math.cos(ang),hx=sx+dx*L,hy=sy+dy*L;
    var mx=(sx+hx)/2-dy*side*bend*4,my=(sy+hy)/2+dx*side*bend*4;
    var base=f.infected?'#2aa85a':f.col,g=ctx.createLinearGradient(sx,sy,hx,hy);
    try{g.addColorStop(0,lighten(base,.12));g.addColorStop(1,darken(base,.22));}catch(e){g=base;}
    ctx.lineCap='round';ctx.strokeStyle='rgba(28,14,48,.6)';ctx.lineWidth=5.8;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(mx,my,hx,hy);ctx.stroke();
    ctx.strokeStyle=g;ctx.lineWidth=4.2;ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(sx,sy-.6);ctx.quadraticCurveTo(mx,my-.6,hx,hy-.6);ctx.stroke();
    var hg=ctx.createRadialGradient(hx-1.2,hy-1.2,.3,hx,hy,4.2);hg.addColorStop(0,'#ffffff');hg.addColorStop(.6,'#f1f3fb');hg.addColorStop(1,'#b9c1dc');
    ctx.fillStyle=hg;ctx.beginPath();ctx.arc(hx,hy,3.8,0,TAU);ctx.fill();ctx.strokeStyle='rgba(28,14,48,.4)';ctx.lineWidth=.6;ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.arc(hx-.9,hy-1,.8,0,TAU);ctx.fill();
    return {x:hx,y:hy};
  }

  /* ---------- screen-space FX around the flea ---------- */
  function noteGlyph(x,y,c,s){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,3*s,2.2*s,-.4,0,TAU);ctx.fill();ctx.fillRect(x+2.2*s,y-9*s,1.3*s,9*s);ctx.beginPath();ctx.moveTo(x+3.5*s,y-9*s);ctx.quadraticCurveTo(x+8*s,y-7*s,x+6*s,y-3.5*s);ctx.lineWidth=1.3*s;ctx.strokeStyle=c;ctx.stroke();}
  function starG(x,y,R,c){ctx.fillStyle=c;ctx.beginPath();for(var i=0;i<10;i++){var a=i*Math.PI/5-Math.PI/2,r=i%2?R*.45:R;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();ctx.fill();}
  function drawFx(f,o,rx,ry){if(!o.fx)return;var t=(f.actionT||0)/1000,s=f.sf||1;ctx.save();
    if(o.fx==='notes'){for(var i=0;i<3;i++){var k=((t*.9+i/3)%1),x=rx+(i-1)*12*s+sn(k*6+i)*5,y=ry-14*s-k*30;ctx.globalAlpha=1-k;noteGlyph(x,y,NOTE_COLS[(i+Math.floor(t))%5],.9);}}
    else if(o.fx==='whirl'){ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;for(var j=0;j<3;j++){var aa=t*14+j*2.1;ctx.globalAlpha=.55-j*.14;ctx.beginPath();ctx.ellipse(rx,ry+2,22*s,7*s,0,aa,aa+1.6);ctx.stroke();}}
    else if(o.fx==='dizzy'){for(var d=0;d<3;d++){var a2=t*7+d*2.1;starG(rx+Math.cos(a2)*11*s,ry-17*s+Math.sin(a2)*3,3.2,'#ffd23d');}}
    else if(o.fx==='wave'){var side=(f.face||1);ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;ctx.lineCap='round';for(var w=0;w<2;w++){var r2=(6+w*5)*s;ctx.globalAlpha=.4+.4*Math.abs(sn(t*9));ctx.beginPath();ctx.arc(rx+side*16*s,ry-18*s,r2,side>0?-1.1:Math.PI+.1,side>0?-.1:Math.PI+1.1);ctx.stroke();}}
    else if(o.fx==='confetti'){for(var c=0;c<8;c++){var k2=((t*.8+c/8)%1),cx2=rx+sn(c*2.3)*22*s,cy2=ry-26*s-k2*10+k2*k2*40;ctx.globalAlpha=1-k2;ctx.fillStyle=NOTE_COLS[c%5];ctx.save();ctx.translate(cx2,cy2);ctx.rotate(t*8+c);ctx.fillRect(-2,-1,4,2.2);ctx.restore();}}
    else if(o.fx==='trail'){ctx.strokeStyle='rgba(155,230,255,.5)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(rx,ry+o.y*.5,16*s,0,TAU);ctx.stroke();}
    else if(o.fx==='land'||o.fx==='dust'){for(var u=0;u<6;u++){var dx=(u-2.5)*6*s,k3=(t*4+u*.2)%1;ctx.globalAlpha=.55*(1-k3);ctx.fillStyle='#e8e0ff';ctx.beginPath();ctx.arc(rx+dx*(1+k3),ry+11*s-k3*4,(2+k3*3)*s,0,TAU);ctx.fill();}}
    else if(o.fx==='zzz'){ctx.fillStyle='#bcd0ff';ctx.font='bold 11px Chakra Petch';for(var z=0;z<3;z++){var kz=((t*.5+z/3)%1);ctx.globalAlpha=1-kz;ctx.font='bold '+(8+z*2)+'px Chakra Petch';ctx.fillText('z',rx+10*s+kz*10,ry-14*s-kz*22);}}
    else if(o.fx==='clap'){ctx.strokeStyle='rgba(255,246,200,.9)';ctx.lineWidth=1.6;ctx.lineCap='round';for(var cl2=0;cl2<5;cl2++){var ca=-Math.PI/2+(cl2-2)*.5;ctx.beginPath();ctx.moveTo(rx+Math.cos(ca)*8*s,ry+2+Math.sin(ca)*8*s);ctx.lineTo(rx+Math.cos(ca)*14*s,ry+2+Math.sin(ca)*14*s);ctx.stroke();}}
    else if(o.fx==='shine'){var sh2=(Math.sin(t*5)+1)/2;ctx.globalAlpha=.4+.6*sh2;starG(rx-16*s,ry-14*s,3+sh2*2.5,'#fff7c0');starG(rx+16*s,ry-14*s,2+(1-sh2)*2.5,'#fff7c0');}
    else if(o.fx==='haha'){ctx.font="900 "+Math.round(10*s+2)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';for(var hh=0;hh<2;hh++){var kh=((t*.9+hh*.5)%1);ctx.globalAlpha=1-kh;ctx.fillStyle=hh?'#ffd23d':'#ff9ad1';ctx.fillText('HA',rx+(hh?14:-14)*s+sn(kh*9)*3,ry-18*s-kh*20);}}
    else if(o.fx==='tears'){ctx.fillStyle='#7ad0ff';for(var tr=0;tr<4;tr++){var kt=((t*1.6+tr/4)%1),sd2=tr%2?1:-1;ctx.globalAlpha=1-kt*.6;ctx.beginPath();ctx.ellipse(rx+sd2*(7+kt*6)*s,ry-4*s+kt*18,1.6,2.4,0,0,TAU);ctx.fill();}}
    else if(o.fx==='sneeze'){var fd2=f.face||1;ctx.fillStyle='rgba(200,255,200,.8)';for(var sz=0;sz<9;sz++){var ks=((t*3+sz*.11)%1);ctx.globalAlpha=.8*(1-ks);ctx.beginPath();ctx.arc(rx+fd2*(14+ks*34)*s,ry-2+(sz-4)*ks*3,1.4+ks*1.8,0,TAU);ctx.fill();}}
    else if(o.fx==='hearts'){for(var ht=0;ht<3;ht++){var kk2=((t*.7+ht/3)%1),hx2=rx+(ht-1)*11*s+sn(kk2*7+ht)*4,hy2=ry-18*s-kk2*28,hs=(3+ht%2)*(1-kk2*.4);ctx.globalAlpha=1-kk2;ctx.fillStyle=ht%2?'#ff6ab0':'#ff3d7a';ctx.beginPath();ctx.moveTo(hx2,hy2+hs);ctx.bezierCurveTo(hx2-hs*1.6,hy2-hs*.2,hx2-hs*.6,hy2-hs*1.5,hx2,hy2-hs*.5);ctx.bezierCurveTo(hx2+hs*.6,hy2-hs*1.5,hx2+hs*1.6,hy2-hs*.2,hx2,hy2+hs);ctx.fill();}}
    else if(o.fx==='sparkle'||o.fx==='magic'){var n3=o.fx==='magic'?7:5;for(var mk=0;mk<n3;mk++){var km=((t*.8+mk/n3)%1),ma=mk*1.3+t*2,mr=(o.fx==='magic'?10:16)*s+km*14;var bx2=o.fx==='magic'?rx+(f.face||1)*14*s:rx,by2=o.fx==='magic'?ry-20*s:ry-6*s;ctx.globalAlpha=1-km;starG(bx2+Math.cos(ma)*mr,by2+Math.sin(ma)*mr*.7,2+(1-km)*2,NOTE_COLS[mk%5]);}}
    else if(o.fx==='om'){var ko=(Math.sin(t*1.6)+1)/2;ctx.strokeStyle='rgba(185,140,255,.6)';ctx.lineWidth=2;ctx.globalAlpha=.4+.4*ko;ctx.beginPath();ctx.ellipse(rx,ry+14*s,18*s+ko*4,4.5*s,0,0,TAU);ctx.stroke();ctx.globalAlpha=.5+.3*ko;ctx.beginPath();ctx.arc(rx,ry-2,22*s+ko*3,Math.PI*1.1,Math.PI*1.9);ctx.stroke();}
    else if(o.fx==='steam'){ctx.fillStyle='rgba(235,235,245,.75)';for(var stm=0;stm<4;stm++){var kst=((t*1.4+stm/4)%1),sd3=stm%2?1:-1;ctx.globalAlpha=.75*(1-kst);ctx.beginPath();ctx.arc(rx+sd3*(8+kst*8)*s,ry-18*s-kst*18,(2.5+kst*4)*s,0,TAU);ctx.fill();}}
    else if(o.fx==='sweat'){var kw=(t*.8)%1;ctx.globalAlpha=1-kw;ctx.fillStyle='#8fd8ff';ctx.beginPath();ctx.moveTo(rx-12*s,ry-16*s+kw*8);ctx.quadraticCurveTo(rx-16*s,ry-9*s+kw*8,rx-12*s,ry-8*s+kw*8);ctx.quadraticCurveTo(rx-8*s,ry-9*s+kw*8,rx-12*s,ry-16*s+kw*8);ctx.fill();}
    else if(o.fx==='whoosh'){var sd=f.face||1;ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=1.6;for(var q=0;q<3;q++){ctx.beginPath();ctx.moveTo(rx+sd*(18+q*3)*s,ry-6+q*5);ctx.lineTo(rx+sd*(30+q*4)*s,ry-6+q*5);ctx.stroke();}}
    ctx.restore();}

  /* ---------- keep legs stepping during rhythmic moves ---------- */
  var _upd=P.update;
  P.update=function(dt){_upd.call(this,dt);if(this.action==='dance'||this.action==='moonwalk'||this.action==='karate'||this.action==='wiggle'){if(this.stuck){this.walkT=Date.now()+80;}}};

  /* ---------- full draw with the new choreography ---------- */
  P.draw=function(cx,cy){
    if(this.hidden||this.isBall)return;
    var rx=this.cx-cx,ry=this.cy-cy;
    if(rx<-90||rx>W+90||ry<-90||ry>H+90)return;
    var o=pose(this);
    if(this.stuck&&this.onG){ctx.save();var lift=cl(-o.y/30,0,.7);ctx.globalAlpha=.32*(1-lift);ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(rx+o.x,this.y+this.h-cy+3,this.w*.5*(1-lift*.4),4.5*this.sf,0,0,7);ctx.fill();ctx.restore();}
    ctx.save();ctx.translate(rx,ry);
    if(this.stuck)ctx.rotate(this.angle);
    else if(this.ragUntil&&Date.now()<this.ragUntil)ctx.rotate(this.ragAngle||0);
    var fd=this.face<0?-1:1;
    ctx.translate(o.x*fd,o.y);
    if(this.action==='lie')ctx.rotate(o.rot*fd);else ctx.rotate(o.rot*fd);
    ctx.scale(o.sx,o.sy);
    if(this.face<0)ctx.scale(-1,1);
    ctx.scale((2-this.sq)*this.sf,this.sq*this.sf);
    this.drawAura();this.drawCape();this.drawWings();this.drawLegs();this.drawBody();this.drawHair();this.drawAccessory();this.drawEyes();this.drawBrows();this.drawGlasses();this.drawMouth();
    if(o.arms){ctx.save();arm(this,-1,o.aL,o.bL,o.lenL);arm(this,1,o.aR,o.bR,o.lenR);ctx.restore();}
    this.drawAntenna();this.drawHat();
    if(window.__fleaHeadHook){try{window.__fleaHeadHook(this);}catch(e){}}
    ctx.restore();
    ctx.fillStyle=this.isP?'#7af0ff':(this.infected?'#9bffc4':'rgba(255,255,255,.9)');
    ctx.font='bold 11px Chakra Petch';ctx.textAlign='center';ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=4;
    var headExtra=this._wornItem?(this._wornH||18):0;
    if(!this.hideName)ctx.fillText(this.name,rx,ry-this.h/2-(this.ant==='none'?11:21*this.sf)-headExtra);ctx.shadowBlur=0;
    drawFx(this,o,rx+o.x*fd,ry);
    if(this.bubble)this.drawBubble(rx,ry-headExtra);
    if(this.emoteT>0&&this.emoteEmoji)this.drawEmoteBubble(rx,ry-headExtra);
    if(this.carry&&typeof drawCarriedObject==='function')drawCarriedObject(this);
    if(this.action&&(this.actionT||0)<1400&&typeof ACTION_EMOJI!=='undefined'){var _ae=ACTION_EMOJI[this.action];if(_ae){ctx.save();ctx.globalAlpha=.95*(1-(this.actionT||0)/1400);ctx.font='15px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(_ae,rx,ry-this.h/2-30-headExtra-(this.actionT||0)*.01);ctx.restore();}}
  };
  window.FreaActions={pose:pose};
})();
