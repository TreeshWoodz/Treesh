/* =====================================================================
   SEASONAL — rotating holiday / seasonal furniture packs for the Flea House
   Packs switch automatically with the real calendar (northern hemisphere).
   Items can only be BOUGHT while their pack is in season, but anything you
   own stays in your house forever.
   Debug / preview: localStorage.frea_debug_date = '2026-10-20'  (or ?freadate=2026-10-20)
   Catalog rows use the same shape as house.js:
     [type,name,cat,price,w,h,place,use]   use:[need,gain,dur,act,verb,emoji,seat]
   ===================================================================== */
var Seasons=(function(){
  var F=Furni,H=F.h;
  function heart(c,cx,cy,s,fill){c.fillStyle=fill;c.beginPath();c.moveTo(cx,cy+s*.9);c.bezierCurveTo(cx-s*1.25,cy+s*.05,cx-s*.62,cy-s*.95,cx,cy-s*.32);c.bezierCurveTo(cx+s*.62,cy-s*.95,cx+s*1.25,cy+s*.05,cx,cy+s*.9);c.closePath();c.fill();}
  function flame(c,x,y,s,t){var f=1+Math.sin(t*14)*.08;H.glow(c,x,y-s*.4,s*2.2,'#ffb347',.45);c.fillStyle=H.lg(c,x,y-s*1.4*f,x,y,[[0,'#fff6c2'],[.45,'#ffd23d'],[1,'#ff6a2a']]);c.beginPath();c.moveTo(x,y-s*1.5*f);c.quadraticCurveTo(x+s*.75,y-s*.4,x,y);c.quadraticCurveTo(x-s*.75,y-s*.4,x,y-s*1.5*f);c.fill();}
  function leaf(c,x,y,r,rot,col){c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=col;c.beginPath();c.ellipse(0,0,r,r*.45,0,0,7);c.fill();c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=.8;c.beginPath();c.moveTo(-r,0);c.lineTo(r,0);c.stroke();c.restore();}

  /* ---------------- 💝 Sweetheart ---------------- */
  F.add('loveseat',function(c,x,y,w,h,o,col){var fy=y+h;H.shadow(c,x,fy,w);
    heart(c,x+w/2,y+h*.3,w*.36,H.lg(c,x,y,x,y+h*.7,[[0,H.sh(col,.35)],[1,H.sh(col,-.15)]]));
    c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.ellipse(x+w*.36,y+h*.12,w*.07,h*.06,-.5,0,7);c.fill();
    H.box(c,x+w*.06,y+h*.52,w*.88,h*.3,12,H.sh(col,-.08));H.box(c,x,y+h*.42,w*.13,h*.42,10,col);H.box(c,x+w*.87,y+h*.42,w*.13,h*.42,10,col);
    H.leg(c,x+w*.1,fy-h*.16,h*.16,'#6a2a4a');H.leg(c,x+w*.86,fy-h*.16,h*.16,'#6a2a4a');},'#ff5a9a');
  F.add('heartballoon',function(c,x,y,w,h,o,col){var b=Math.sin((o.t||0)*2)*3,cx=x+w/2,hy=y+h*.26+b;c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1.2;c.beginPath();c.moveTo(cx,y+h-6);c.quadraticCurveTo(cx+7,y+h*.72,cx,hy+w*.42);c.stroke();
    heart(c,cx,hy,w*.46,H.lg(c,cx,hy-w*.5,cx,hy+w*.5,[[0,H.sh(col,.35)],[1,H.sh(col,-.25)]]));c.fillStyle='rgba(255,255,255,.45)';c.beginPath();c.ellipse(cx-w*.14,hy-w*.12,w*.07,w*.11,-.6,0,7);c.fill();
    H.box(c,cx-6,y+h-8,12,8,3,'#8a5cff');},'#ff3d7a');
  F.add('rosevase',function(c,x,y,w,h,o,col){var cx=x+w/2;c.strokeStyle='#2f9a4a';c.lineWidth=2;[[-.22,.08],[0,0],[.22,.1]].forEach(function(p){c.beginPath();c.moveTo(cx,y+h*.6);c.lineTo(cx+w*p[0],y+h*(.18+p[1]));c.stroke();leaf(c,cx+w*p[0]*.6,y+h*.42,5,p[0]*4+.6,'#39c86a');});
    [[-.22,.08],[0,0],[.22,.1]].forEach(function(p){H.ball(c,cx+w*p[0],y+h*(.16+p[1]),w*.15,col);c.strokeStyle='rgba(120,0,40,.5)';c.lineWidth=1;c.beginPath();c.arc(cx+w*p[0],y+h*(.16+p[1]),w*.07,0,5);c.stroke();});
    c.fillStyle='rgba(200,235,255,.35)';H.rr(c,x+w*.24,y+h*.5,w*.52,h*.5,8);c.fill();c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1.2;c.stroke();c.fillStyle='rgba(120,200,255,.35)';H.rr(c,x+w*.27,y+h*.72,w*.46,h*.26,6);c.fill();},'#ff2d5a');

  /* ---------------- 🌸 Spring Bloom ---------------- */
  F.add('cherrytree',function(c,x,y,w,h,o,col){var fy=y+h,t=o.t||0;H.shadow(c,x,fy,w);
    c.fillStyle=H.lg(c,x+w*.44,0,x+w*.56,0,[[0,'#8a5a3a'],[1,'#5a3620']]);c.beginPath();c.moveTo(x+w*.42,fy);c.lineTo(x+w*.46,y+h*.45);c.lineTo(x+w*.3,y+h*.3);c.lineTo(x+w*.34,y+h*.28);c.lineTo(x+w*.5,y+h*.4);c.lineTo(x+w*.66,y+h*.26);c.lineTo(x+w*.7,y+h*.29);c.lineTo(x+w*.55,y+h*.46);c.lineTo(x+w*.58,fy);c.closePath();c.fill();
    [[.3,.22,.2],[.5,.12,.24],[.72,.22,.2],[.2,.36,.15],[.82,.36,.15],[.5,.3,.22],[.38,.4,.14],[.64,.4,.14]].forEach(function(b){H.ball(c,x+w*b[0],y+h*b[1],w*b[2],b[2]>.2?col:H.sh(col,.18));});
    c.fillStyle='#fff';for(var i=0;i<14;i++){c.globalAlpha=.8;c.beginPath();c.arc(x+w*(.1+((i*37)%80)/100),y+h*(.05+((i*53)%40)/100),1.6,0,7);c.fill();}
    c.fillStyle=H.sh(col,.3);for(var k=0;k<5;k++){var ph=((t*.18+k*.21)%1);c.globalAlpha=1-ph;leaf(c,x+w*(.15+k*.17)+Math.sin(t*2+k)*6,y+h*(.4+ph*.58),3,t*2+k,H.sh(col,.25));}c.globalAlpha=1;},'#ffa8cc');
  F.add('tulips',function(c,x,y,w,h,o,col){var cx=x+w/2,cols=[col,'#ffd23d','#ff7ab8'];[-.25,0,.25].forEach(function(dx,i){c.strokeStyle='#2f9a4a';c.lineWidth=2;c.beginPath();c.moveTo(cx+w*dx*.4,y+h*.62);c.lineTo(cx+w*dx,y+h*.2);c.stroke();leaf(c,cx+w*dx*.7,y+h*.46,6,dx*3-.9,'#39c86a');
      var tx=cx+w*dx,ty=y+h*.16;c.fillStyle=H.lg(c,tx,ty-8,tx,ty+8,[[0,H.sh(cols[i],.3)],[1,H.sh(cols[i],-.2)]]);c.beginPath();c.moveTo(tx-6,ty-6);c.lineTo(tx-3,ty-1);c.lineTo(tx,ty-7);c.lineTo(tx+3,ty-1);c.lineTo(tx+6,ty-6);c.quadraticCurveTo(tx+7,ty+8,tx,ty+8);c.quadraticCurveTo(tx-7,ty+8,tx-6,ty-6);c.fill();});
    H.box(c,x+w*.18,y+h*.6,w*.64,h*.4,6,'#c86a4a');H.box(c,x+w*.12,y+h*.58,w*.76,h*.1,4,'#e08a5a');},'#ff4d6d');
  F.add('birdhouse',function(c,x,y,w,h,o,col){var t=o.t||0;H.box(c,x+w*.16,y+h*.34,w*.68,h*.56,6,col);c.fillStyle='#8a5cff';c.beginPath();c.moveTo(x+w*.04,y+h*.4);c.lineTo(x+w/2,y+h*.06);c.lineTo(x+w*.96,y+h*.4);c.closePath();c.fill();
    c.fillStyle='#2a1a3a';c.beginPath();c.arc(x+w/2,y+h*.56,w*.12,0,7);c.fill();H.box(c,x+w*.4,y+h*.72,w*.2,h*.05,2,'#8a5a3a');
    var by=y+h*.02+Math.abs(Math.sin(t*3))*-3;H.ball(c,x+w*.64,by+h*.02,w*.1,'#2de2ff');c.fillStyle='#ffd23d';c.beginPath();c.moveTo(x+w*.72,by);c.lineTo(x+w*.8,by+2);c.lineTo(x+w*.72,by+4);c.fill();c.fillStyle='#101018';c.beginPath();c.arc(x+w*.67,by-1,1.3,0,7);c.fill();},'#ffe08a');
  F.add('eggbasket',function(c,x,y,w,h,o,col){var fy=y+h;H.shadow(c,x,fy,w);[['#ff7ab8',.3],['#2de2ff',.5],['#ffd23d',.7],['#39ff7a',.4],['#9b6bff',.6]].forEach(function(e,i){H.ball(c,x+w*e[1],y+h*(i<3?.34:.28),w*.12,e[0]);c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=1.2;c.beginPath();c.moveTo(x+w*e[1]-w*.1,y+h*(i<3?.34:.28));c.lineTo(x+w*e[1]+w*.1,y+h*(i<3?.34:.28));c.stroke();});
    H.box(c,x+w*.08,y+h*.42,w*.84,h*.58,10,col);c.strokeStyle='rgba(90,50,20,.35)';c.lineWidth=1.2;for(var i=1;i<4;i++){c.beginPath();c.moveTo(x+w*.1,y+h*(.42+i*.14));c.lineTo(x+w*.9,y+h*(.42+i*.14));c.stroke();}
    c.strokeStyle=H.sh(col,-.2);c.lineWidth=3;c.beginPath();c.arc(x+w/2,y+h*.44,w*.34,Math.PI,0);c.stroke();},'#d9a45a');
  F.add('swing',function(c,x,y,w,h,o,col){var fy=y+h,t=o.t||0,sw=Math.sin(t*2.2)*.22;H.shadow(c,x,fy,w);
    c.strokeStyle='#8a5a3a';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(x+w*.06,fy);c.lineTo(x+w*.2,y+4);c.lineTo(x+w*.8,y+4);c.lineTo(x+w*.94,fy);c.stroke();c.lineCap='butt';
    c.save();c.translate(x+w/2,y+6);c.rotate(sw);c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.5;c.beginPath();c.moveTo(-w*.16,0);c.lineTo(-w*.16,h*.72);c.moveTo(w*.16,0);c.lineTo(w*.16,h*.72);c.stroke();H.box(c,-w*.22,h*.7,w*.44,h*.08,4,col);c.restore();},'#ff7ab8');

  /* ---------------- 🏖️ Summer Splash ---------------- */
  F.add('kiddiepool',function(c,x,y,w,h,o,col){var fy=y+h,t=o.t||0;H.shadow(c,x,fy,w);H.box(c,x,y+h*.25,w,h*.75,h*.38,col);
    c.fillStyle=H.lg(c,x,y,x,y+h*.5,[[0,'#8af0ff'],[1,'#2db8e2']]);c.beginPath();c.ellipse(x+w/2,y+h*.34,w*.44,h*.2,0,0,7);c.fill();
    c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=1.2;for(var i=0;i<2;i++){var r=((t*.6+i*.5)%1);c.globalAlpha=1-r;c.beginPath();c.ellipse(x+w*.5,y+h*.34,w*.4*r,h*.16*r,0,0,7);c.stroke();}c.globalAlpha=1;
    c.fillStyle='rgba(255,255,255,.85)';for(var k=0;k<6;k++){c.fillRect(x+w*(.08+k*.16),y+h*.55,w*.06,h*.3);}
    H.ball(c,x+w*.72,y+h*.26+Math.sin(t*3)*1.5,h*.2,'#ffd23d');},'#2d8aff');
  F.add('beachchair',function(c,x,y,w,h,o,col){var fy=y+h;H.shadow(c,x,fy,w);c.strokeStyle='#c9a06a';c.lineWidth=4;c.beginPath();c.moveTo(x+w*.1,fy);c.lineTo(x+w*.72,y+h*.2);c.moveTo(x+w*.3,fy);c.lineTo(x+w*.9,y+h*.62);c.stroke();
    c.save();c.beginPath();c.moveTo(x+w*.14,y+h*.66);c.lineTo(x+w*.7,y+h*.1);c.lineTo(x+w*.86,y+h*.22);c.lineTo(x+w*.36,y+h*.8);c.closePath();c.clip();for(var i=0;i<8;i++){c.fillStyle=i%2?'#fff':col;c.fillRect(x+i*w*.12,y,w*.12,h);}c.restore();
    H.box(c,x+w*.12,y+h*.62,w*.6,h*.1,3,'#c9a06a');},'#ff7a3d');
  F.add('icecream',function(c,x,y,w,h,o,col){var fy=y+h,t=o.t||0;H.shadow(c,x,fy,w);c.strokeStyle='#e8e2f0';c.lineWidth=3;c.beginPath();c.moveTo(x+w*.5,y+h*.18);c.lineTo(x+w*.5,y+h*.5);c.stroke();
    c.fillStyle=H.lg(c,x,y,x,y+h*.2,[[0,'#ff9ac8'],[1,'#ff5a9a']]);c.beginPath();c.moveTo(x+w*.06,y+h*.22);c.quadraticCurveTo(x+w*.5,y-h*.06,x+w*.94,y+h*.22);c.closePath();c.fill();for(var s=0;s<4;s++){c.fillStyle=s%2?'#fff':'#ff5a9a';c.beginPath();c.arc(x+w*(.17+s*.22),y+h*.22,w*.055,0,Math.PI);c.fill();}
    H.box(c,x+w*.1,y+h*.5,w*.8,h*.36,8,col);c.fillStyle='rgba(255,255,255,.9)';c.font='bold '+Math.round(h*.13)+'px sans-serif';c.textAlign='center';c.fillText('🍦',x+w*.5,y+h*.74);c.textAlign='left';
    [['#ff7ab8',.28],['#9b6bff',.5],['#ffd23d',.72]].forEach(function(b){H.ball(c,x+w*b[1],y+h*.46,w*.06,b[0]);});
    [.26,.74].forEach(function(p){c.fillStyle='#2a1a3a';c.beginPath();c.arc(x+w*p,fy-h*.07,h*.07,0,7);c.fill();c.fillStyle='#8a8aa8';c.beginPath();c.arc(x+w*p,fy-h*.07,h*.03,0,7);c.fill();});},'#8ae8ff');
  F.add('tikitorch',function(c,x,y,w,h,o,col){var fy=y+h;H.shadow(c,x,fy,w*1.6);c.fillStyle=H.lg(c,x+w*.4,0,x+w*.6,0,[[0,'#d9b27a'],[1,'#9a6a3a']]);H.rr(c,x+w*.38,y+h*.22,w*.24,h*.78,3);c.fill();c.strokeStyle='rgba(90,50,20,.5)';c.lineWidth=1;for(var i=1;i<5;i++){c.beginPath();c.moveTo(x+w*.38,y+h*(.22+i*.15));c.lineTo(x+w*.62,y+h*(.22+i*.15));c.stroke();}
    H.box(c,x+w*.14,y+h*.12,w*.72,h*.13,4,col);if(o.on!==false)flame(c,x+w/2,y+h*.13,w*.34,o.t||0);},'#c98a4f');
  F.add('surfboard',function(c,x,y,w,h,o,col){var fy=y+h;H.shadow(c,x,fy,w*1.4);c.save();c.translate(x+w/2,fy);c.rotate(-.12);c.fillStyle=H.lg(c,-w/2,0,w/2,0,[[0,H.sh(col,.3)],[.5,col],[1,H.sh(col,-.25)]]);c.beginPath();c.ellipse(0,-h/2,w*.42,h/2,0,0,7);c.fill();
    c.fillStyle='#fff';c.fillRect(-w*.05,-h*.95,w*.1,h*.9);c.fillStyle='#ffd23d';c.beginPath();c.arc(0,-h*.62,w*.14,0,7);c.fill();c.restore();},'#2de2ff');

  /* ---------------- 🍂 Harvest Moon + 🎃 Spooky ---------------- */
  F.add('leafpile',function(c,x,y,w,h,o,col){var fy=y+h,t=o.t||0;H.shadow(c,x,fy,w);var cs=[col,'#ffb347','#c8421e','#ffd23d','#a0521e'];c.fillStyle=H.sh(col,-.25);c.beginPath();c.ellipse(x+w/2,fy-h*.35,w*.48,h*.4,0,Math.PI,0);c.fill();
    for(var i=0;i<22;i++){leaf(c,x+w*(.08+((i*41)%84)/100),fy-h*(.1+((i*29)%60)/100)*(1-Math.abs(((i*41)%84)/100-.42)),5+(i%3),i*1.7,cs[i%5]);}
    var ph=(t*.5)%1;leaf(c,x+w*.7+Math.sin(t*3)*5,fy-h*(1+ph*1.2),4,t*3,cs[1]);},'#ff7a2a');
  F.add('scarecrow',function(c,x,y,w,h,o,col){var fy=y+h,t=o.t||0,sw=Math.sin(t*1.5)*.03;H.shadow(c,x,fy,w*.6);c.save();c.translate(x+w/2,fy);c.rotate(sw);
    c.fillStyle='#8a5a3a';c.fillRect(-3,-h,6,h);c.fillRect(-w*.46,-h*.64,w*.92,6);
    c.fillStyle=col;H.rr(c,-w*.24,-h*.7,w*.48,h*.36,6);c.fill();c.fillStyle='rgba(0,0,0,.18)';c.fillRect(-w*.24,-h*.56,w*.48,3);c.fillRect(-w*.02,-h*.7,3,h*.36);
    c.fillStyle='#ffd23d';[[-.48,-.62],[.42,-.62]].forEach(function(p){c.beginPath();c.moveTo(w*p[0],-h*.6);c.lineTo(w*p[0]+(p[0]<0?-6:10),-h*.66);c.lineTo(w*p[0]+(p[0]<0?-4:12),-h*.56);c.fill();});
    c.fillStyle='#f4dca0';c.beginPath();c.arc(0,-h*.8,w*.17,0,7);c.fill();c.fillStyle='#2a1a1a';c.beginPath();c.arc(-w*.06,-h*.82,2,0,7);c.arc(w*.06,-h*.82,2,0,7);c.fill();c.strokeStyle='#2a1a1a';c.lineWidth=1.3;c.beginPath();c.arc(0,-h*.79,w*.07,.3,Math.PI-.3);c.stroke();
    c.fillStyle='#c98a4f';c.beginPath();c.ellipse(0,-h*.9,w*.32,h*.04,0,0,7);c.fill();H.rr(c,-w*.14,-h*1.0,w*.28,h*.1,4);c.fill();c.restore();},'#4a7ae8');
  F.add('cauldron',function(c,x,y,w,h,o,col){var fy=y+h,t=o.t||0;H.shadow(c,x,fy,w);if(o.on!==false){flame(c,x+w*.36,fy-2,w*.1,t);flame(c,x+w*.64,fy-2,w*.1,t+1);}
    var g=c.createRadialGradient(x+w*.4,y+h*.4,2,x+w/2,y+h*.55,w*.5);g.addColorStop(0,'#4a4a60');g.addColorStop(1,'#141420');c.fillStyle=g;c.beginPath();c.ellipse(x+w/2,y+h*.56,w*.46,h*.36,0,0,7);c.fill();
    c.fillStyle='#2a2a3a';c.beginPath();c.ellipse(x+w/2,y+h*.26,w*.44,h*.1,0,0,7);c.fill();c.fillStyle=col;c.beginPath();c.ellipse(x+w/2,y+h*.27,w*.38,h*.07,0,0,7);c.fill();
    for(var i=0;i<3;i++){var ph=((t*.8+i*.33)%1);c.globalAlpha=1-ph;c.strokeStyle=H.sh(col,.4);c.lineWidth=1.5;c.beginPath();c.arc(x+w*(.35+i*.15),y+h*(.22-ph*.3),3+ph*3,0,7);c.stroke();}c.globalAlpha=1;},'#6aff5a');
  F.add('jackolantern',function(c,x,y,w,h,o,col){var fy=y+h,on=o.on!==false,fl=.8+Math.sin((o.t||0)*9)*.12;H.shadow(c,x,fy,w);if(on)H.glow(c,x+w/2,y+h*.55,w*.9,'#ffb347',.35*fl);
    [[.3,.24],[.7,.24],[.5,.3]].forEach(function(p){var g=c.createRadialGradient(x+w*p[0]-3,y+h*.45,2,x+w*p[0],y+h*.6,w*p[1]*1.6);g.addColorStop(0,H.sh(col,.3));g.addColorStop(1,H.sh(col,-.3));c.fillStyle=g;c.beginPath();c.ellipse(x+w*p[0],y+h*.6,w*p[1],h*.38,0,0,7);c.fill();});
    c.fillStyle='#3a8a3a';H.rr(c,x+w*.45,y+h*.12,w*.1,h*.14,2);c.fill();
    c.fillStyle=on?'rgba(255,230,120,'+fl+')':'#3a1a0a';c.beginPath();c.moveTo(x+w*.28,y+h*.54);c.lineTo(x+w*.38,y+h*.42);c.lineTo(x+w*.44,y+h*.56);c.closePath();c.moveTo(x+w*.72,y+h*.54);c.lineTo(x+w*.62,y+h*.42);c.lineTo(x+w*.56,y+h*.56);c.closePath();c.fill();
    c.beginPath();c.moveTo(x+w*.26,y+h*.68);c.lineTo(x+w*.36,y+h*.74);c.lineTo(x+w*.44,y+h*.68);c.lineTo(x+w*.5,y+h*.76);c.lineTo(x+w*.56,y+h*.68);c.lineTo(x+w*.64,y+h*.74);c.lineTo(x+w*.74,y+h*.68);c.quadraticCurveTo(x+w*.5,y+h*.94,x+w*.26,y+h*.68);c.fill();},'#ff8a2a');
  F.add('candles',function(c,x,y,w,h,o,col){var fy=y+h;H.shadow(c,x,fy,w);[[.24,.55],[.5,.8],[.76,.45]].forEach(function(p,i){var ch=h*p[1]*.7,cx=x+w*p[0];H.box(c,cx-w*.09,fy-ch,w*.18,ch,3,col);c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(cx,fy-ch+1,w*.08,2,0,0,7);c.fill();
      if(o.on!==false)flame(c,cx,fy-ch-1,w*.08,(o.t||0)+i*.7);});},'#fff2dc');
  F.add('ghostlamp',function(c,x,y,w,h,o,col){var t=o.t||0,b=Math.sin(t*2)*2,on=o.on!==false,cx=x+w/2;if(on)H.glow(c,cx,y+h*.45,w*.95,'#b8f0ff',.4);
    c.fillStyle=on?'rgba(244,250,255,.96)':'rgba(220,226,240,.85)';c.beginPath();c.moveTo(x+w*.1,y+h*.9+b);c.lineTo(x+w*.1,y+h*.42+b);c.arc(cx,y+h*.42+b,w*.4,Math.PI,0);c.lineTo(x+w*.9,y+h*.9+b);for(var i=0;i<4;i++){c.quadraticCurveTo(x+w*(.9-i*.2-.1),y+h*(i%2?.98:.82)+b,x+w*(.9-(i+1)*.2),y+h*.9+b);}c.fill();
    c.fillStyle='#1d1b2e';c.beginPath();c.ellipse(cx-w*.14,y+h*.42+b,w*.07,h*.08,0,0,7);c.ellipse(cx+w*.14,y+h*.42+b,w*.07,h*.08,0,0,7);c.fill();c.fillStyle='#ff9ac8';c.beginPath();c.ellipse(cx,y+h*.58+b,w*.07,h*.05,0,0,7);c.fill();},'#f4faff');
  F.add('spiderweb',function(c,x,y,w,h,o,col){var t=o.t||0,cx=x+w*.5,cy=y+h*.45;c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1;for(var i=0;i<8;i++){var a=i*Math.PI/4;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*w*.5,cy+Math.sin(a)*h*.5);c.stroke();}
    for(var r=1;r<=4;r++){c.beginPath();for(var j=0;j<=8;j++){var a2=j*Math.PI/4;var px=cx+Math.cos(a2)*w*.12*r,py=cy+Math.sin(a2)*h*.12*r;if(j)c.quadraticCurveTo(cx+Math.cos(a2-Math.PI/8)*w*.1*r,cy+Math.sin(a2-Math.PI/8)*h*.1*r,px,py);else c.moveTo(px,py);}c.stroke();}
    var sy=cy+h*.1+Math.sin(t*1.5)*h*.12;c.beginPath();c.moveTo(cx+w*.2,y);c.lineTo(cx+w*.2,sy);c.stroke();H.ball(c,cx+w*.2,sy+4,5,col);c.fillStyle='#fff';c.beginPath();c.arc(cx+w*.2-2,sy+3,1.4,0,7);c.arc(cx+w*.2+2,sy+3,1.4,0,7);c.fill();},'#2a1a3a');

  /* ---------------- ❄️ Winter Wonderland ---------------- */
  F.add('xmastree',function(c,x,y,w,h,o,col){var fy=y+h,t=o.t||0,on=o.on!==false;H.shadow(c,x,fy,w);H.box(c,x+w*.42,fy-h*.12,w*.16,h*.12,2,'#8a5a3a');H.box(c,x+w*.32,fy-h*.08,w*.36,h*.08,3,'#ff3db5');
    [[.88,.5,.3],[.66,.4,.26],[.44,.3,.22]].forEach(function(l){c.fillStyle=H.lg(c,x,y+h*(l[0]-.32),x,y+h*l[0],[[0,H.sh(col,.25)],[1,H.sh(col,-.25)]]);c.beginPath();c.moveTo(x+w/2,y+h*(l[0]-l[2]-.12));c.lineTo(x+w*(.5+l[1]),y+h*l[0]);c.lineTo(x+w*(.5-l[1]),y+h*l[0]);c.closePath();c.fill();});
    var bc=['#ff3d7a','#ffd23d','#2de2ff','#fff','#9b6bff'];for(var i=0;i<14;i++){var row=i%3,px=x+w*(.5+(((i*37)%70)/100-.35)*(.5+row*.35)),py=y+h*(.34+row*.2+((i*13)%10)/100);var lit=on&&((Math.floor(t*3)+i)%3!==0);if(lit)H.glow(c,px,py,7,bc[i%5],.5);H.ball(c,px,py,3.2,lit?bc[i%5]:H.sh(bc[i%5],-.4));}
    c.fillStyle='#ffd23d';if(on)H.glow(c,x+w/2,y+h*.04,16,'#ffd23d',.6);c.beginPath();for(var k=0;k<10;k++){var a=k*Math.PI/5-Math.PI/2,r=k%2?4:9;c.lineTo(x+w/2+Math.cos(a)*r,y+h*.05+Math.sin(a)*r);}c.fill();},'#2fbf6a');
  F.add('snowman',function(c,x,y,w,h,o,col){var fy=y+h;H.shadow(c,x,fy,w);H.ball(c,x+w/2,fy-h*.2,w*.4,col);H.ball(c,x+w/2,y+h*.46,w*.3,col);H.ball(c,x+w/2,y+h*.22,w*.22,col);
    c.fillStyle='#1d1b2e';[.5,.6].forEach(function(p){c.beginPath();c.arc(x+w/2,y+h*p,2.4,0,7);c.fill();});c.beginPath();c.arc(x+w*.44,y+h*.2,2,0,7);c.arc(x+w*.56,y+h*.2,2,0,7);c.fill();
    c.fillStyle='#ff8a2a';c.beginPath();c.moveTo(x+w/2,y+h*.23);c.lineTo(x+w*.72,y+h*.25);c.lineTo(x+w/2,y+h*.27);c.fill();
    c.fillStyle='#ff3d7a';H.rr(c,x+w*.26,y+h*.31,w*.48,h*.06,3);c.fill();H.rr(c,x+w*.6,y+h*.33,w*.1,h*.14,3);c.fill();
    c.fillStyle='#1d1b2e';H.rr(c,x+w*.3,y+h*.02,w*.4,h*.04,2);c.fill();H.rr(c,x+w*.36,y-h*.08,w*.28,h*.12,3);c.fill();
    c.strokeStyle='#8a5a3a';c.lineWidth=2.5;c.beginPath();c.moveTo(x+w*.22,y+h*.46);c.lineTo(x-w*.02,y+h*.34);c.moveTo(x+w*.78,y+h*.46);c.lineTo(x+w*1.0,y+h*.32);c.stroke();},'#f4f8ff');
  F.add('cocoa',function(c,x,y,w,h,o,col){var t=o.t||0,fy=y+h;H.shadow(c,x,fy,w);c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1.6;for(var i=0;i<2;i++){c.beginPath();var sx=x+w*(.38+i*.2);for(var k=0;k<8;k++){c.lineTo(sx+Math.sin(t*3+k*.8+i)*2.5,y+h*.3-k*2.4);}c.stroke();}
    H.box(c,x+w*.18,y+h*.36,w*.56,h*.64,8,col);c.strokeStyle=col;c.lineWidth=4;c.beginPath();c.arc(x+w*.78,y+h*.62,w*.12,-1.3,1.3);c.stroke();
    c.fillStyle='#6a3a24';c.beginPath();c.ellipse(x+w*.46,y+h*.39,w*.25,h*.05,0,0,7);c.fill();c.fillStyle='#fff';[[.38,.37],[.52,.36],[.46,.4]].forEach(function(p){H.rr(c,x+w*p[0]-3,y+h*p[1]-3,6,6,2);c.fill();});
    c.fillStyle='rgba(255,255,255,.9)';heart(c,x+w*.46,y+h*.68,w*.08,'#fff');},'#ff5a7a');
  F.add('stringlights',function(c,x,y,w,h,o,col){var t=o.t||0,on=o.on!==false,cs=['#ff3d7a','#ffd23d','#39ff7a','#2de2ff','#9b6bff'];c.strokeStyle='#2a3a2a';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y+2);c.quadraticCurveTo(x+w/2,y+h*1.1,x+w,y+2);c.stroke();
    for(var i=0;i<9;i++){var u=(i+.5)/9,px=x+w*u,py=y+2+(1-Math.pow(2*u-1,2))*h*.52+4,lit=on&&((Math.floor(t*2.5)+i)%4!==0);if(lit)H.glow(c,px,py+3,10,cs[i%5],.55);c.fillStyle=lit?cs[i%5]:H.sh(cs[i%5],-.5);c.beginPath();c.ellipse(px,py+4,3,5,0,0,7);c.fill();c.fillStyle='#2a3a2a';c.fillRect(px-2,py-2,4,3);}},'#2a3a2a');
  F.add('snowglobe',function(c,x,y,w,h,o,col){var t=o.t||0,cx=x+w/2,cy=y+h*.42,r=w*.42;H.shadow(c,x,y+h,w);H.box(c,x+w*.14,y+h*.74,w*.72,h*.26,5,col);
    c.save();c.beginPath();c.arc(cx,cy,r,0,7);c.clip();c.fillStyle=H.lg(c,cx,cy-r,cx,cy+r,[[0,'#bfe8ff'],[1,'#6aa8ff']]);c.fillRect(cx-r,cy-r,r*2,r*2);c.fillStyle='#fff';c.beginPath();c.ellipse(cx,cy+r*.8,r,r*.35,0,0,7);c.fill();
    c.fillStyle='#2fbf6a';c.beginPath();c.moveTo(cx,cy-r*.45);c.lineTo(cx+r*.3,cy+r*.45);c.lineTo(cx-r*.3,cy+r*.45);c.fill();
    c.fillStyle='#fff';for(var i=0;i<12;i++){var ph=((t*.25+i*.083)%1);c.beginPath();c.arc(cx+Math.sin(i*2.1+t)*r*.7,cy-r+ph*r*2,1.3,0,7);c.fill();}c.restore();
    c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=1.5;c.beginPath();c.arc(cx,cy,r,0,7);c.stroke();c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(cx-r*.4,cy-r*.4,r*.14,r*.24,-.6,0,7);c.fill();},'#8a5cff');

  /* ---------------- packs (month/day ranges, inclusive; wrap across new year) ---------------- */
  var PACKS=[
    {id:'winter',name:'Winter Wonderland',emo:'❄️',from:[12,1],to:[2,28],items:[
      ['xmastree','Twinkle Tree','fun',180,100,150,'floor',['fun',40,12,'dance','Decorate tree','🎄',0]],
      ['snowman','Snow Buddy','decor',70,70,110,'floor',['fun',25,8,'wiggle','Hug snowman','⛄',0]],
      ['cocoa','Cocoa Mug','kitchen',30,40,40,'any',['hunger',30,8,'wiggle','Sip cocoa','☕',0]],
      ['stringlights','Fairy Lights','light',45,140,30,'wall',null],
      ['snowglobe','Snow Globe','decor',40,40,46,'any',['fun',15,6,'wiggle','Shake globe','❄️',0]]]},
    {id:'valentine',name:'Sweetheart',emo:'💝',from:[2,1],to:[2,16],items:[
      ['loveseat','Heart Loveseat','seat',140,130,66,'floor',['social',30,10,'sit','Cuddle','💞',24]],
      ['heartballoon','Heart Balloon','decor',20,40,90,'any',null],
      ['rosevase','Rose Vase','plant',35,36,56,'any',null]]},
    {id:'spring',name:'Spring Bloom',emo:'🌸',from:[3,1],to:[5,31],items:[
      ['cherrytree','Cherry Blossom','plant',160,120,150,'floor',['fun',15,8,'wiggle','Watch petals','🌸',0]],
      ['tulips','Tulip Pot','plant',25,40,50,'any',null],
      ['birdhouse','Birdhouse','decor',40,46,60,'wall',null],
      ['eggbasket','Egg Basket','decor',35,50,40,'any',['fun',25,8,'jump','Egg hunt','🥚',0]],
      ['swing','Garden Swing','fun',120,80,110,'floor',['fun',45,12,'sit','Swing','🎐',34]]]},
    {id:'summer',name:'Summer Splash',emo:'🏖️',from:[6,1],to:[8,31],items:[
      ['kiddiepool','Splash Pool','fun',130,130,34,'floor',['fun',50,12,'jump','Splash','💦',8]],
      ['beachchair','Beach Chair','seat',60,70,60,'floor',['energy',25,12,'sit','Sunbathe','😎',22]],
      ['icecream','Ice Cream Cart','kitchen',150,90,100,'floor',['hunger',40,8,'wiggle','Get ice cream','🍦',0]],
      ['tikitorch','Tiki Torch','light',35,26,110,'floor',null],
      ['surfboard','Surfboard','decor',50,40,110,'floor',null]]},
    {id:'autumn',name:'Harvest Moon',emo:'🍂',from:[9,1],to:[11,30],items:[
      ['leafpile','Leaf Pile','fun',40,100,36,'floor',['fun',45,10,'jump','Leap in leaves','🍂',6]],
      ['scarecrow','Scarecrow','decor',60,70,120,'floor',null],
      ['cauldron','Soup Cauldron','kitchen',120,70,64,'floor',['hunger',60,14,'dance','Brew soup','🍲',0]],
      ['candles','Cozy Candles','light',25,40,40,'any',null]]},
    {id:'spooky',name:'Spooky Night',emo:'🎃',from:[10,10],to:[11,2],items:[
      ['jackolantern','Jack-o\'-Lantern','light',30,46,42,'any',null],
      ['ghostlamp','Ghost Lamp','light',45,38,50,'any',null],
      ['spiderweb','Cobweb','decor',15,70,70,'wall',null]]}
  ];
  var BY={},ITEM_PACK={};PACKS.forEach(function(p){BY[p.id]=p;p.items.forEach(function(r){ITEM_PACK[r[0]]=p.id;});});
  var LIGHTS={xmastree:[150,'#ffd23d'],stringlights:[120,'#ff9ac8'],tikitorch:[150,'#ffb347'],cauldron:[110,'#6aff5a'],jackolantern:[120,'#ffb347'],candles:[100,'#ffcf7a'],ghostlamp:[110,'#b8f0ff']};
  var TOGGLES={xmastree:1,stringlights:1,tikitorch:1,cauldron:1,jackolantern:1,candles:1,ghostlamp:1};

  function now(){
    try{var q=(location.search.match(/[?&]freadate=(\d{4}-\d{2}-\d{2})/)||[])[1]||localStorage.getItem('frea_debug_date');if(q){var d=new Date(q+'T12:00:00');if(!isNaN(d))return d;}}catch(e){}
    return new Date();}
  function md(m,d){return m*100+d;}
  function inPack(p,d){var v=md(d.getMonth()+1,d.getDate()),a=md(p.from[0],p.from[1]),b=md(p.to[0],p.to[1]==28&&p.to[0]==2?29:p.to[1]);return a<=b?(v>=a&&v<=b):(v>=a||v<=b);}
  function nextDate(m,d,ref){var y=ref.getFullYear(),dt=new Date(y,m-1,d,12);if(dt<new Date(ref.getFullYear(),ref.getMonth(),ref.getDate(),0))dt=new Date(y+1,m-1,d,12);return dt;}
  function dayDiff(a,b){return Math.round((new Date(b.getFullYear(),b.getMonth(),b.getDate())-new Date(a.getFullYear(),a.getMonth(),a.getDate()))/864e5);}
  function daysLeft(p,d){d=d||now();var end=nextDate(p.to[0],p.to[1],d);if(p.to[0]===2&&p.to[1]===28){var ly=new Date(end.getFullYear(),1,29);if(ly.getMonth()===1)end=ly;}return Math.max(0,dayDiff(d,end));}
  function startsIn(p,d){d=d||now();return dayDiff(d,nextDate(p.from[0],p.from[1],d));}
  function active(d){d=d||now();return PACKS.filter(function(p){return inPack(p,d);});}
  function upcoming(d){d=d||now();var act={};active(d).forEach(function(p){act[p.id]=1;});return PACKS.filter(function(p){return !act[p.id];}).sort(function(a,b){return startsIn(a,d)-startsIn(b,d);});}
  function isActive(id,d){var p=BY[id];return !!p&&inPack(p,d||now());}
  return {packs:PACKS,byId:BY,packOf:function(t){return ITEM_PACK[t]||null;},active:active,upcoming:upcoming,isActive:isActive,daysLeft:daysLeft,startsIn:startsIn,now:now,lights:LIGHTS,toggles:TOGGLES};
})();
window.FreaSeasons=Seasons;
