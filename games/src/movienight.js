/* ===================== FLEA MOVIE NIGHT (Zen) =====================
   · start from the TV / couch menu (or FreaMovie.start())
   · the flea family gathers on the couch (+ floor cushions), popcorn in hand
   · lights fade down, lamps switch off, a projector screen unrolls above the TV
   · a short film plays in "beats" (comedy / scary / action / romance / sad / space / finale)
     and every flea reacts together (staggered) — laughs, hides eyes, cheers, cries, claps
   · lights come back up at the end, everyone rates the movie */
var FreaMovie=(function(){
  var TAU=Math.PI*2,M=null,off=null,octx=null,bar=null;
  var FILMS=[
    {n:'Fleas in Space',beats:['space','action','comedy','space','romance','action','finale']},
    {n:'Attack of the Giant Sock',beats:['comedy','scary','action','scary','comedy','sad','finale']},
    {n:'The Haunted Hairbrush',beats:['scary','comedy','scary','scary','sad','romance','finale']},
    {n:'Love Bug',beats:['romance','comedy','sad','romance','action','romance','finale']},
    {n:'Hop Hard 3',beats:['action','action','comedy','scary','action','sad','finale']}];
  var MOOD={
    comedy:{c:'#ffd23d',e:['😂','🤣','😆'],a:'laugh',l:'Comedy'},
    scary:{c:'#9b6bff',e:['😱','😨','🙈'],a:'peek',shake:7,l:'Spooky'},
    action:{c:'#ff7a3d',e:['😮','🔥','💥'],a:'cheer',shake:4,l:'Action'},
    romance:{c:'#ff7ab0',e:['🥰','💕','😍'],a:'heart',l:'Romance'},
    sad:{c:'#4a8aff',e:['😢','🥺','😭'],a:'cry',l:'Drama'},
    space:{c:'#2de2ff',e:['🤩','✨','🚀'],a:'wave',l:'Sci-fi'},
    finale:{c:'#ffd23d',e:['👏','🎉','⭐'],a:'clap',l:'The End'}};
  var INTRO=2600,BEAT=4300,OUTRO=2600;
  function now(){return performance.now();}
  function rnd(a){return a[(Math.random()*a.length)|0];}
  function pc(p){return propCenter(p);}
  function find(type,near){var best=null,bd=1e9;for(var i=3;i<platforms.length;i++){var p=platforms[i];if(p.deco!==type||p.carriedBy)continue;var c=pc(p),d=near?Math.abs(c.x-near.x)+Math.abs(c.y-near.y)*.6:0;if(d<bd){bd=d;best=p;}}return best;}
  function spawn(type){var n=platforms.length;try{spawnZen(type);}catch(e){}return platforms.length>n?platforms[platforms.length-1]:find(type,player?{x:player.cx,y:player.cy}:null);}
  function S(p){return (p.zenState=p.zenState||{});}
  function ease(k){k=Math.max(0,Math.min(1,k));return k*k*(3-2*k);}
  function el(id){return document.getElementById(id);}

  function start(fromProp){
    if(gameMode!=='zen'||STATE!=='play'||!player)return false;if(M){stop(false);return false;}
    var me={x:player.cx,y:player.cy};
    var tv=(fromProp&&fromProp.deco==='tv')?fromProp:find('tv',me);if(!tv)tv=spawn('tv');if(!tv){flash('Need a TV for movie night','#ff3db5');return false;}
    var tc=pc(tv);var couch=(fromProp&&fromProp.deco==='couch')?fromProp:find('couch',tc);
    if(!couch||Math.abs(pc(couch).x-tc.x)>700){couch=spawn('couch');}
    if(couch){var side=tc.x<WORLD_W*.5?1:-1,cc=pc(couch);if(Math.abs(cc.x-tc.x)<150||Math.abs(cc.x-tc.x)>520){var tx=Math.max(couch.bw/2+30,Math.min(WORLD_W-couch.bw/2-30,tc.x+side*250));couch._shift(tx-cc.x,0);if(couch.vy!=null)couch.vy=0;}}
    S(tv).on=true;S(tv).channel=0;
    var film=rnd(FILMS),fam=fleas.filter(function(f){return f&&!f.hidden&&!f.infected;});
    /* player in the middle seat */
    var others=fam.filter(function(f){return f!==player;});var order=others.slice(0,1).concat([player],others.slice(1));
    var lamps=[];platforms.forEach(function(p){if(p.deco&&/lamp|candle|lantern|chandelier/.test(p.deco)){lamps.push({p:p,on:S(p).on});}});
    M={t0:now(),tv:tv,couch:couch,film:film,fam:order,lamps:lamps,beat:-1,peak:-1,done:false,pops:[],flash:0,lit:1};
    order.forEach(function(f){f._mn={seat:0};f._prop={k:'popcorn',until:now()+INTRO+BEAT*film.beats.length+OUTRO,t0:now()};});
    mountBar();flash('Movie night: '+film.n,'#ffd23d');try{say(player,rnd(['Movie time!','Who has the popcorn?','Lights off!']),1800);}catch(e){}
    return true;}
  function stop(natural){if(!M)return;var fam=M.fam;M.lamps.forEach(function(l){S(l.p).on=l.on===undefined?true:l.on;});
    fam.forEach(function(f){f._mn=null;f._prop=null;f._lookAt=null;f.action=null;f.actionUntil=0;});
    if(natural){var stars=3+(Math.random()<.6?1:0)+(Math.random()<.3?1:0);flash(M.film.n+' · '+'★★★★★'.slice(0,stars)+'☆☆☆☆☆'.slice(0,5-stars),'#ffd23d');
      fam.forEach(function(f,i){setTimeout(function(){if(!f)return;f.emoteEmoji=rnd(['👏','🍿','⭐','😄','🎬']);f.emoteT=1600;try{if(!f.isP&&i<4)say(f,rnd(['Best movie ever!','I cried a little.','Sequel when?','Popcorn refill?','Ten out of ten!','I was NOT scared.']),2000);}catch(e){}},i*220);});}
    M=null;unmountBar();}

  /* ---------- seating (recomputed every frame so a pushed couch carries everyone) ---------- */
  function seats(){var c=M.couch,tc=pc(M.tv),n=M.fam.length,out=[];var dir=1;
    if(c){var cc=pc(c);dir=tc.x>cc.x?1:-1;var onC=Math.min(n,3);for(var i=0;i<onC;i++){var u=(i+.5)/onC;out.push({x:c.bx+c.bw*(.16+.68*u),y:c.by-2,couch:true});}
      for(var j=onC;j<n;j++){var k=j-onC,row=k%2;out.push({x:cc.x+dir*(c.bw/2+40+Math.floor(k/2)*46)+(row?dir*-8:0),y:WORLD_H-60-(row?0:0),cush:true,ofs:row});}}
    else{for(var q=0;q<n;q++)out.push({x:tc.x-(q+1)*56*(tc.x>WORLD_W/2?1:-1),y:WORLD_H-60,cush:true});}
    return out;}

  /* ---------- per-frame: timeline + pin fleas ---------- */
  function tick(){if(!M)return;if(gameMode!=='zen'||STATE!=='play'){stop(false);return;}
    if(platforms.indexOf(M.tv)<0){stop(false);return;}if(M.couch&&platforms.indexOf(M.couch)<0)M.couch=null;
    var t=now(),el2=t-M.t0,nb=M.film.beats.length,total=INTRO+BEAT*nb+OUTRO;
    /* lighting curve */
    var dim=el2<INTRO?ease(el2/(INTRO*.7)):(el2>INTRO+BEAT*nb?1-ease((el2-INTRO-BEAT*nb)/(OUTRO*.8)):1);M.lit=dim;
    if(el2>600&&!M.lampsOff){M.lampsOff=true;M.lamps.forEach(function(l){S(l.p).on=false;});}
    if(el2>INTRO+BEAT*nb+300&&!M.lampsOn){M.lampsOn=true;M.lamps.forEach(function(l){S(l.p).on=l.on===undefined?true:l.on;});}
    var b=Math.floor((el2-INTRO)/BEAT);if(el2>=INTRO&&b<nb&&b!==M.beat){M.beat=b;M.bt0=M.t0+INTRO+b*BEAT;updBar();}
    if(M.beat>=0&&M.beat<nb&&M.peak!==M.beat&&t-M.bt0>BEAT*.52){M.peak=M.beat;react(M.film.beats[M.beat]);}
    if(el2>total){stop(true);return;}
    var tvC=pc(M.tv),S2=seats();
    M.fam.forEach(function(f,i){if(!f||!f._mn)return;var s=S2[i];if(!s)return;
      if(f===player&&(Math.abs(f.vx)>2.6||f.vy<-2.6||f.carry)){f._mn=null;f._prop=null;flash('You left the couch — tap the TV to rejoin','#2de2ff');return;}
      var hop=f._mnHop?Math.max(0,1-(t-f._mnHop)/420):0;
      f.x=s.x-f.w/2;f.y=(s.couch?s.y-f.h*.62:s.y-f.h)-Math.sin(hop*Math.PI)*16;f.vx=0;f.vy=0;f.angle=0;f.stuck=false;f.onG=false;
      f.face=tvC.x>f.cx?1:-1;f._lookAt={p:M.tv,until:t+400};if(f._prop)f._prop.until=t+600;
      var act=(f._mnAct&&t<f._mnAct.until)?f._mnAct.a:'sit';if(f.action!==act){f.action=act;f.actionT=0;}f.actionUntil=t+400;
      if(!f._tvR||f._tvR<t+3000)f._tvR=t+5000;/* suppress random TV reactions — we coordinate them */});}
  function react(mood){var m=MOOD[mood]||MOOD.comedy;if(m.shake)camera.shake=Math.max(camera.shake||0,m.shake);M.flash=now();M.flashC=m.c;
    M.fam.forEach(function(f,i){var d=60+i*90+Math.random()*160;setTimeout(function(){if(!M||!f||!f._mn)return;f.emoteEmoji=rnd(m.e);f.emoteT=1700;f._mnAct={a:m.a,until:now()+1500};if(mood==='scary'||mood==='action'||mood==='finale')f._mnHop=now();
      if(mood==='romance'||mood==='finale'||mood==='space'){for(var k=0;k<2;k++)emotePops.push({x:f.cx+(Math.random()-.5)*20,y:f.y-10,vy:-1.2-Math.random(),l:1,e:mood==='romance'?'💕':mood==='space'?'✨':'🎉'});}
      if(i===0&&mood!=='finale'){try{if(Math.random()<.5)say(f,rnd({comedy:['HAHA!','Classic!'],scary:['Don\'t open the door!','Nope nope nope'],action:['Whoa!','Go go go!'],romance:['Awww','So cute!'],sad:['*sniff*','Not the dog!'],space:['Space!','To the stars!']}[mood]||['Wow']),1500);}catch(e){}}},d);});}

  /* ---------- drawing ---------- */
  function scr(){var c=pc(M.tv),w=Math.min(360,Math.max(240,W*.28)),h=w*.56,bottom=M.tv.by-26,top=Math.max(26,bottom-h);return {x:c.x-w/2-camera.x,y:top-camera.y,w:w,h:bottom-top};}
  function flea(c,x,y,s,col,flip){c.fillStyle=col;c.beginPath();c.ellipse(x,y,s*.55,s*.42,0,0,TAU);c.fill();c.beginPath();c.arc(x+(flip?-1:1)*s*.45,y-s*.38,s*.3,0,TAU);c.fill();c.strokeStyle=col;c.lineWidth=Math.max(1,s*.07);c.beginPath();c.moveTo(x+(flip?-1:1)*s*.5,y-s*.62);c.lineTo(x+(flip?-1:1)*s*.72,y-s*.95);c.moveTo(x+(flip?-1:1)*s*.38,y-s*.64);c.lineTo(x+(flip?-1:1)*s*.4,y-s);c.stroke();
    c.lineWidth=Math.max(1,s*.08);c.beginPath();c.moveTo(x-s*.3,y+s*.3);c.lineTo(x-s*.45,y+s*.62);c.moveTo(x+s*.25,y+s*.3);c.lineTo(x+s*.4,y+s*.62);c.stroke();}
  function film(c,R,mood,k,t){var x=R.x,y=R.y,w=R.w,h=R.h,pk=k>.52&&k<.8?1-Math.abs(k-.62)/.18:0;
    if(mood==='intro'){c.fillStyle='#d8d0b8';c.fillRect(x,y,w,h);var n=3-Math.floor(k*3);c.strokeStyle='#3a3428';c.lineWidth=2;c.beginPath();c.arc(x+w/2,y+h/2,h*.36,0,TAU);c.stroke();c.beginPath();c.moveTo(x,y+h/2);c.lineTo(x+w,y+h/2);c.moveTo(x+w/2,y);c.lineTo(x+w/2,y+h);c.stroke();
      c.fillStyle='rgba(58,52,40,.35)';c.beginPath();c.moveTo(x+w/2,y+h/2);c.arc(x+w/2,y+h/2,h*.36,-Math.PI/2,-Math.PI/2+((k*3)%1)*TAU);c.closePath();c.fill();c.fillStyle='#2a2418';c.font="900 "+Math.round(h*.4)+"px 'Orbitron',sans-serif";c.textAlign='center';c.textBaseline='middle';c.fillText(String(Math.max(1,n)),x+w/2,y+h/2+2);return;}
    if(mood==='space'){c.fillStyle='#05061a';c.fillRect(x,y,w,h);for(var i=0;i<40;i++){var sx=x+((i*97.3-t*(20+i%3*25))%w+w)%w,sy=y+(i*53.7)%h;c.fillStyle='rgba(255,255,255,'+(.4+(i%3)*.2)+')';c.fillRect(sx,sy,1.6,1.6);}
      c.fillStyle='#ff7a3d';c.beginPath();c.arc(x+w*.78,y+h*.32,h*.2,0,TAU);c.fill();c.strokeStyle='rgba(255,210,61,.7)';c.lineWidth=3;c.beginPath();c.ellipse(x+w*.78,y+h*.32,h*.32,h*.07,-.3,0,TAU);c.stroke();
      var rx=x+w*(.1+k*.6),ry=y+h*.62-Math.sin(k*6)*h*.06;c.save();c.translate(rx,ry);c.rotate(-.2);c.fillStyle='#e8ecff';c.beginPath();c.ellipse(0,0,h*.16,h*.07,0,0,TAU);c.fill();c.fillStyle='#2de2ff';c.beginPath();c.arc(h*.05,0,h*.03,0,TAU);c.fill();c.fillStyle='rgba(255,170,60,'+(.6+Math.random()*.4)+')';c.beginPath();c.moveTo(-h*.16,-h*.04);c.lineTo(-h*.3-Math.random()*h*.08,0);c.lineTo(-h*.16,h*.04);c.fill();c.restore();
      if(pk){c.fillStyle='rgba(45,226,255,'+pk*.5+')';c.beginPath();c.arc(x+w*.78,y+h*.32,h*.2+pk*h*.3,0,TAU);c.fill();}return;}
    if(mood==='comedy'){var g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#ffe58a');g.addColorStop(1,'#ffc23d');c.fillStyle=g;c.fillRect(x,y,w,h);c.fillStyle='#e8a02a';c.fillRect(x,y+h*.8,w,h*.2);
      var bx=x+w*.28,by=y+h*.66-Math.abs(Math.sin(t*7))*h*.12;flea(c,bx,by,h*.16,'#3a2a14',false);var vx=x+w*.7;flea(c,vx,y+h*.66,h*.16,'#3a2a14',true);
      var pf=Math.min(1,Math.max(0,(k-.3)/.25));if(k<.56){c.fillStyle='#fff6e0';c.beginPath();c.arc(vx-(vx-bx)*pf,y+h*.5-Math.sin(pf*Math.PI)*h*.2,h*.07,0,TAU);c.fill();}
      else{c.fillStyle='#fff6e0';for(var s2=0;s2<7;s2++){var a=s2/7*TAU;c.beginPath();c.arc(bx+h*.07+Math.cos(a)*h*.08*(1+pk),by-h*.06+Math.sin(a)*h*.06*(1+pk),h*.04,0,TAU);c.fill();}c.fillStyle='#3a2a14';c.font="900 "+Math.round(h*.16)+"px 'Orbitron',sans-serif";c.textAlign='center';c.fillText('SPLAT!',x+w/2,y+h*.24);}return;}
    if(mood==='scary'){c.fillStyle='#120a24';c.fillRect(x,y,w,h);c.fillStyle='#e8e4ff';c.beginPath();c.arc(x+w*.8,y+h*.24,h*.12,0,TAU);c.fill();c.fillStyle='#120a24';c.beginPath();c.arc(x+w*.84,y+h*.21,h*.11,0,TAU);c.fill();
      c.fillStyle='#05030c';c.fillRect(x,y+h*.82,w,h*.18);for(var tr=0;tr<3;tr++){var tx2=x+w*(.12+tr*.3);c.fillRect(tx2,y+h*.38,4,h*.46);c.strokeStyle='#05030c';c.lineWidth=2;c.beginPath();c.moveTo(tx2+2,y+h*.5);c.lineTo(tx2-14,y+h*.38);c.moveTo(tx2+2,y+h*.55);c.lineTo(tx2+18,y+h*.42);c.stroke();}
      flea(c,x+w*.5,y+h*.76,h*.11,'#05030c',false);var gy=y+h*.9-ease((k-.4)/.2)*h*.55;if(k>.4){c.fillStyle='rgba(240,240,255,.92)';c.beginPath();c.arc(x+w*.62,gy,h*.13,Math.PI,0);c.lineTo(x+w*.62+h*.13,gy+h*.2);for(var z=0;z<4;z++)c.lineTo(x+w*.62+h*.13-(z+.5)*h*.065,gy+h*.2-(z%2?0:h*.05));c.lineTo(x+w*.62-h*.13,gy+h*.2);c.closePath();c.fill();c.fillStyle='#120a24';c.beginPath();c.arc(x+w*.6,gy-h*.02,h*.025,0,TAU);c.arc(x+w*.66,gy-h*.02,h*.025,0,TAU);c.fill();}
      if(pk>.88&&Math.random()<.7){c.fillStyle='rgba(255,255,255,'+(pk-.88)*6+')';c.fillRect(x,y,w,h);}return;}
    if(mood==='action'){var g2=c.createLinearGradient(x,y,x,y+h);g2.addColorStop(0,'#ff9a3d');g2.addColorStop(1,'#ff3d5a');c.fillStyle=g2;c.fillRect(x,y,w,h);c.fillStyle='#2a0a14';c.fillRect(x,y+h*.78,w,h*.22);
      c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=1.5;for(var l=0;l<9;l++){var lx=x+((l*61-t*420)%w+w)%w,ly=y+h*(.15+l*.07);c.beginPath();c.moveTo(lx,ly);c.lineTo(lx+30,ly);c.stroke();}
      var car=function(cx2,col){c.fillStyle=col;c.beginPath();c.roundRect(cx2-h*.18,y+h*.64,h*.36,h*.1,4);c.fill();c.beginPath();c.roundRect(cx2-h*.1,y+h*.56,h*.18,h*.09,4);c.fill();c.fillStyle='#120a08';c.beginPath();c.arc(cx2-h*.1,y+h*.75,h*.04,0,TAU);c.arc(cx2+h*.1,y+h*.75,h*.04,0,TAU);c.fill();};
      car(x+w*(.2+k*.45),'#2a1a3a');car(x+w*(.05+k*.42),'#3a1a1a');if(pk){c.fillStyle='rgba(255,230,120,'+pk+')';c.beginPath();c.arc(x+w*.75,y+h*.6,h*.1+pk*h*.3,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,'+pk*.8+')';c.beginPath();c.arc(x+w*.75,y+h*.6,h*.05+pk*h*.15,0,TAU);c.fill();}return;}
    if(mood==='romance'){var g3=c.createLinearGradient(x,y,x,y+h);g3.addColorStop(0,'#ff9ac8');g3.addColorStop(.6,'#ffc28a');g3.addColorStop(1,'#7a3a6a');c.fillStyle=g3;c.fillRect(x,y,w,h);c.fillStyle='rgba(255,240,180,.9)';c.beginPath();c.arc(x+w/2,y+h*.7,h*.18,Math.PI,0);c.fill();c.fillStyle='#4a1a3a';c.fillRect(x,y+h*.7,w,h*.3);
      var gap=Math.max(.06,.28-k*.3);flea(c,x+w*(.5-gap),y+h*.66,h*.13,'#2a0a1a',false);flea(c,x+w*(.5+gap),y+h*.66,h*.13,'#2a0a1a',true);if(k>.5){var hs=h*(.05+pk*.06);c.fillStyle='#ff3d7a';c.beginPath();c.moveTo(x+w/2,y+h*.42+hs);c.bezierCurveTo(x+w/2-hs*1.6,y+h*.42,x+w/2-hs*.6,y+h*.42-hs*1.2,x+w/2,y+h*.42-hs*.3);c.bezierCurveTo(x+w/2+hs*.6,y+h*.42-hs*1.2,x+w/2+hs*1.6,y+h*.42,x+w/2,y+h*.42+hs);c.fill();}return;}
    if(mood==='sad'){c.fillStyle='#1a2a4a';c.fillRect(x,y,w,h);c.fillStyle='#0e1a30';c.fillRect(x,y+h*.8,w,h*.2);c.strokeStyle='rgba(160,200,255,.45)';c.lineWidth=1;for(var r=0;r<34;r++){var rx2=x+(r*37.1)%w,ry2=y+((r*53+t*260)%h);c.beginPath();c.moveTo(rx2,ry2);c.lineTo(rx2-3,ry2+9);c.stroke();}
      flea(c,x+w*.45,y+h*.72,h*.13,'#0a1424',false);c.strokeStyle='#0a1424';c.lineWidth=2;c.beginPath();c.moveTo(x+w*.45+h*.1,y+h*.5);c.lineTo(x+w*.45+h*.1,y+h*.3);c.stroke();c.fillStyle='#0a1424';c.beginPath();c.arc(x+w*.45+h*.1,y+h*.3,h*.1,Math.PI,0);c.fill();if(pk){c.fillStyle='rgba(160,200,255,'+pk+')';c.beginPath();c.arc(x+w*.45+h*.06,y+h*.6+pk*h*.08,h*.018,0,TAU);c.fill();}return;}
    if(mood==='finale'){c.fillStyle='#08060e';c.fillRect(x,y,w,h);c.fillStyle='#ffd23d';c.font="900 "+Math.round(h*.2)+"px 'Orbitron',sans-serif";c.textAlign='center';c.textBaseline='middle';c.globalAlpha=ease(k/.3);c.fillText('THE END',x+w/2,y+h*.38);c.globalAlpha=1;
      c.fillStyle='rgba(255,255,255,.7)';c.font="700 "+Math.round(h*.075)+"px 'Chakra Petch',sans-serif";var cr=['Directed by '+(player?player.name:'Frea'),'Popcorn by The Fridge','Starring the whole flea family','No socks were harmed'];cr.forEach(function(s3,i){var yy=y+h*.62+i*h*.12-Math.max(0,k-.35)*h*.5;if(yy>y+h*.5&&yy<y+h)c.fillText(s3,x+w/2,yy);});return;}}

  function drawScreen(){var t=now(),el2=t-M.t0,R=scr(),nb=M.film.beats.length,unroll=ease((el2-300)/900)*(el2>INTRO+BEAT*nb+OUTRO*.5?1-ease((el2-INTRO-BEAT*nb-OUTRO*.5)/(OUTRO*.45)):1);if(unroll<=0.01)return R;
    var h=R.h*unroll;ctx.save();
    /* roller bar + screen cloth */
    ctx.fillStyle='#2a2a3a';ctx.beginPath();ctx.roundRect(R.x-12,R.y-10,R.w+24,12,6);ctx.fill();ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(R.x-10,R.y-9,R.w+20,2);
    ctx.fillStyle='#e8e8f0';ctx.fillRect(R.x-4,R.y,R.w+8,h+6);ctx.fillStyle='#14141e';ctx.fillRect(R.x-4,R.y+h+4,R.w+8,4);
    ctx.save();ctx.beginPath();ctx.rect(R.x,R.y+2,R.w,h-2);ctx.clip();
    if(el2<INTRO)film(ctx,{x:R.x,y:R.y+2,w:R.w,h:R.h-2},'intro',Math.max(0,(el2-900)/(INTRO-900)),t/1000);
    else if(M.beat>=0&&M.beat<nb)film(ctx,{x:R.x,y:R.y+2,w:R.w,h:R.h-2},M.film.beats[M.beat],(t-M.bt0)/BEAT,t/1000);
    else film(ctx,{x:R.x,y:R.y+2,w:R.w,h:R.h-2},'finale',1,t/1000);
    /* film grain + scanline flicker */
    ctx.fillStyle='rgba(255,255,255,'+(.03+Math.random()*.03)+')';for(var g=0;g<14;g++)ctx.fillRect(R.x+Math.random()*R.w,R.y+Math.random()*h,1.5,1.5);ctx.fillStyle='rgba(0,0,0,.06)';ctx.fillRect(R.x+((t*.13)%R.w),R.y,1,h);
    if(el2<INTRO&&el2>300){ctx.fillStyle='rgba(10,8,22,.75)';ctx.fillRect(R.x,R.y+R.h-26,R.w,24);ctx.fillStyle='#ffd23d';ctx.font="800 12px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('FREA! PICTURES PRESENTS · '+M.film.n.toUpperCase(),R.x+R.w/2,R.y+R.h-14);}
    ctx.restore();ctx.restore();return R;}
  function moodCol(){if(!M||M.beat<0||M.beat>=M.film.beats.length)return '#fff2d8';return (MOOD[M.film.beats[M.beat]]||MOOD.comedy).c;}
  function drawDark(R){var a=.8*M.lit;if(a<.01)return;if(!off){off=document.createElement('canvas');octx=off.getContext('2d');}
    var w=Math.ceil(W),h=Math.ceil(H);if(off.width!==w||off.height!==h){off.width=w;off.height=h;}var o=octx;o.globalCompositeOperation='source-over';o.clearRect(0,0,w,h);o.fillStyle='rgba(6,4,20,'+a+')';o.fillRect(0,0,w,h);
    o.globalCompositeOperation='destination-out';var fl=.85+Math.random()*.15,cx=R.x+R.w/2,cy=R.y+R.h/2;
    var g=o.createRadialGradient(cx,cy,R.w*.15,cx,cy+R.h*.4,R.w*1.05);g.addColorStop(0,'rgba(0,0,0,'+(.8*fl)+')');g.addColorStop(.55,'rgba(0,0,0,'+(.35*fl)+')');g.addColorStop(1,'rgba(0,0,0,0)');o.fillStyle=g;o.fillRect(0,0,w,h);
    var tv=pc(M.tv),tx=tv.x-camera.x,ty=tv.y-camera.y,g2=o.createRadialGradient(tx,ty,4,tx,ty,140);g2.addColorStop(0,'rgba(0,0,0,.7)');g2.addColorStop(1,'rgba(0,0,0,0)');o.fillStyle=g2;o.fillRect(tx-140,ty-140,280,280);
    o.globalCompositeOperation='source-over';ctx.drawImage(off,0,0,W,H);
    /* coloured spill from the screen */
    ctx.save();ctx.globalCompositeOperation='lighter';var mc=moodCol(),fk=M.flash?Math.max(0,1-(now()-M.flash)/500):0;ctx.globalAlpha=(.10+fk*.25)*M.lit;var g3=ctx.createRadialGradient(cx,cy+R.h*.6,10,cx,cy+R.h*.8,R.w*1.3);g3.addColorStop(0,mc);g3.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g3;ctx.fillRect(cx-R.w*1.4,cy-R.h,R.w*2.8,R.h*3.5);ctx.restore();}
  function drawCushions(){if(!M||!M.couch)return;var S2=seats();S2.forEach(function(s,i){if(!s.cush||!M.fam[i])return;var x=s.x-camera.x,y=s.y-camera.y;ctx.fillStyle=['#ff7ab0','#2de2ff','#ffd23d','#9b6bff','#39ff7a'][i%5];ctx.beginPath();ctx.ellipse(x,y-6,22,8,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(x-5,y-9,10,3,0,0,TAU);ctx.fill();});}
  var _dft=drawFleaTargets;drawFleaTargets=function(){var r=_dft.apply(this,arguments);if(M&&gameMode==='zen'&&STATE==='play'){try{var R=scr();drawDark(R);drawScreen();drawCushions();}catch(e){console.warn('movie',e);}}return r;};
  var _de=drawEmotes;drawEmotes=function(){var r=_de.apply(this,arguments);if(M&&gameMode==='zen'){try{var fk=M.flash&&M.film.beats[M.peak]==='scary'?Math.max(0,1-(now()-M.flash)/260):0;if(fk>0){ctx.save();ctx.fillStyle='rgba(235,230,255,'+fk*.35+')';ctx.fillRect(0,0,W,H);ctx.restore();}}catch(e){}}return r;};
  var _uzc=updateZenCarry;updateZenCarry=function(dt){_uzc(dt);try{tick();}catch(e){console.warn('movie tick',e);}};

  /* ---------- DOM bar ---------- */
  function mountBar(){unmountBar();bar=document.createElement('div');bar.id='mn-bar';bar.setAttribute('data-testid','movie-night-bar');
    bar.innerHTML='<span class="mn-ico" aria-hidden="true">🎬</span><div class="mn-txt"><b data-testid="movie-night-title"></b><small data-testid="movie-night-scene">Lights down…</small><i class="mn-prog"><u></u></i></div><button class="mn-end" data-testid="movie-night-end-btn" aria-label="End movie night">End</button>';
    bar.querySelector('b').textContent=M.film.n;bar.addEventListener('pointerdown',function(e){e.stopPropagation();});bar.querySelector('.mn-end').onclick=function(){stop(false);flash('Lights on!','#ffd23d');};document.body.appendChild(bar);
    clearInterval(bar._iv);bar._iv=setInterval(function(){if(!M||!bar)return;var el2=now()-M.t0,tot=INTRO+BEAT*M.film.beats.length+OUTRO;var u=bar.querySelector('.mn-prog u');if(u)u.style.transform='scaleX('+Math.min(1,el2/tot)+')';},200);}
  function updBar(){if(!bar||!M)return;var m=MOOD[M.film.beats[M.beat]]||MOOD.comedy;var s=bar.querySelector('small');s.textContent='Scene '+(M.beat+1)+'/'+M.film.beats.length+' · '+m.l;bar.style.setProperty('--mn',m.c);}
  function unmountBar(){var o=el('mn-bar');if(o){clearInterval(o._iv);o.remove();}bar=null;}

  /* ---------- menu hooks: TV + couch get a "Movie night" action ---------- */
  function hook(){var A=window.__zenPlayApi;if(!A||!A.za)return setTimeout(hook,500);var act=['movie','Movie night',function(p){start(p);}];
    if(A.za.tv&&!A.za.tv.some(function(a){return a[0]==='movie';}))A.za.tv.push(act);
    if(A.za.couch&&!A.za.couch.some(function(a){return a[0]==='movie';}))A.za.couch=A.za.couch.concat([act]);}
  hook();
  return {start:function(p){return start(p);},stop:function(){stop(false);},active:function(){return !!M;},state:function(){return M?{film:M.film.n,beat:M.beat,lit:M.lit,fam:M.fam.length,seated:M.fam.filter(function(f){return f&&f._mn;}).length}:null;}};
})();
window.FreaMovie=FreaMovie;
