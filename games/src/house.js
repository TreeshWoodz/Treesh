/* =====================================================================
   FLEA HOUSE — the new Zen "life-sim" (Sims-style) mode
   Build/Buy furniture with Starlites · drag / flip / recolor / stack / snap
   · paint walls & floors per room · unlock upstairs · fleas with needs
   (hunger, energy, fun, social) who live autonomously and use furniture
   · day/night clock · autosave + 3 save slots.
   ===================================================================== */
var House=(function(){
  var SK='frea_house_v1',HW=1440,FH=270,SLAB=14,FS=1.75,STAIR_X=1320;
  var ROOMS=[
    {id:'living',name:'Living Room',f:0,x0:0,x1:620},{id:'kitchen',name:'Kitchen',f:0,x0:620,x1:980},{id:'bedroom',name:'Bedroom',f:0,x0:980,x1:1320},
    {id:'bath',name:'Bathroom',f:1,x0:0,x1:500},{id:'play',name:'Playroom',f:1,x0:500,x1:1320}];
  var UPSTAIRS_COST=400;
  /* catalog: [type,name,cat,price,w,h,place,use] ; place: floor|wall|any ; use:[need,gain,dur,act,verb,emoji,seat] */
  var CAT={},CATS=[['seat','Seating','🛋️'],['bed','Beds','🛏️'],['kitchen','Kitchen','🍳'],['fun','Fun','🎮'],['surf','Surfaces','🪵'],['light','Lights','💡'],['plant','Plants','🪴'],['decor','Decor','🖼️'],['bath','Bath','🛁']];
  [['couch','Cloud Couch','seat',120,140,62,'floor',['energy',25,14,'sit','Nap','💤',26]],
   ['armchair','Comfy Armchair','seat',70,70,62,'floor',['fun',20,10,'sit','Relax','😌',26]],
   ['beanbag','Jelly Beanbag','seat',45,64,48,'floor',['fun',25,10,'sit','Chill','🫧',20]],
   ['chair','Wood Chair','seat',25,42,58,'floor',['energy',8,6,'sit','Sit','🪑',30]],
   ['bed','Dreamy Bed','bed',150,150,60,'floor',['energy',100,40,'lie','Sleep','😴',30]],
   ['fridge','Snack Fridge','kitchen',110,62,116,'floor',['hunger',45,8,'wiggle','Grab a snack','🍓',0]],
   ['stove','Neon Stove','kitchen',130,66,70,'floor',['hunger',80,16,'dance','Cook a meal','🍳',0]],
   ['counter','Counter','kitchen',60,90,66,'floor',null],
   ['table','Dining Table','surf',55,90,50,'floor',['social',15,8,'wiggle','Hang out','🍽️',0]],
   ['desk','Desk','surf',60,100,56,'floor',null],
   ['dresser','Dresser','surf',65,70,70,'floor',null],
   ['nightstand','Nightstand','surf',30,42,46,'floor',null],
   ['tv','Hyper TV','fun',140,80,60,'any',['fun',45,14,'wiggle','Watch TV','📺',0]],
   ['computer','Laptop','fun',95,40,34,'any',['fun',40,12,'wiggle','Browse','💻',0]],
   ['arcade','FREA Arcade','fun',180,56,110,'floor',['fun',70,14,'dance','Play arcade','🕹️',0]],
   ['piano','Grand Piano','fun',220,120,76,'floor',['fun',55,12,'dance','Play piano','🎹',0]],
   ['speaker','Party Speaker','fun',80,38,70,'any',['social',30,10,'dance','Dance','🪩',0]],
   ['trampoline','Trampoline','fun',90,100,40,'floor',['fun',50,10,'jump','Bounce','🤸',14]],
   ['easel','Paint Easel','fun',60,54,86,'floor',['fun',35,12,'wiggle','Paint','🎨',0]],
   ['bookshelf','Bookshelf','fun',85,74,120,'floor',['fun',30,12,'wiggle','Read','📖',0]],
   ['aquarium','Aquarium','fun',120,70,56,'any',['fun',25,8,'wiggle','Watch fish','🐠',0]],
   ['lamp','Table Lamp','light',25,26,46,'any',null],['floorlamp','Floor Lamp','light',40,34,110,'floor',null],
   ['fireplace','Fireplace','light',160,100,90,'floor',['energy',20,10,'sit','Get cozy','🔥',0]],
   ['plant','Potted Fern','plant',20,38,54,'any',null],['bigplant','Tall Monstera','plant',45,60,110,'floor',null],['mushroom','Glow Shroom','plant',25,44,42,'any',null],
   ['rug','Round Rug','decor',35,130,18,'rug',null],['gift','Gift Box','decor',15,40,40,'any',null],['crate','Toy Crate','decor',20,46,46,'any',null],
   ['painting','Painting','decor',40,70,50,'wall',null],['window','Window','decor',50,70,70,'wall',null],['clock','Wall Clock','decor',30,36,36,'wall',null],['mirror','Mirror','decor',45,40,64,'wall',null],['shelf','Wall Shelf','decor',35,80,34,'wall',null],
   ['bathtub','Bubble Tub','bath',160,120,64,'floor',['energy',30,12,'lie','Bubble bath','🛁',18]]
  ].forEach(function(r){CAT[r[0]]={type:r[0],name:r[1],cat:r[2],price:r[3],w:r[4],h:r[5],place:r[6],use:r[7]?{need:r[7][0],gain:r[7][1],dur:r[7][2],act:r[7][3],verb:r[7][4],emo:r[7][5],seat:r[7][6]}:null};Furni.sizes[r[0]]=[r[4],r[5]];});
  var SURF={table:1,desk:1,counter:1,dresser:1,nightstand:1};
  var TOGGLE={tv:1,computer:1,lamp:1,floorlamp:1,fireplace:1,arcade:1,speaker:1,stove:1};
  var PALETTE=['#ff7ab8','#8a5cff','#2de2ff','#39ff7a','#ffd23d','#ff7a3d','#f4efff','#2a2a3e','#b77a44','#ff4d6d'];
  var WALLS=['#3b2a5c','#ffe6f1','#dff4ff','#e9ffe6','#fff3d6','#2a3b5c','#5c2a4a','#1d1b2e','#ffd9c2','#cfc2ff'];
  var PATTERNS=['plain','stripes','dots','hearts','stars','waves','check'];
  var FLOORS=[['wood','Oak'],['dark','Walnut'],['tile','Tiles'],['carpet','Carpet'],['neon','Neon Grid'],['marble','Marble']];
  var NEEDS=[['hunger','Hunger','🍓','#ff7a3d'],['energy','Energy','⚡','#ffd23d'],['fun','Fun','🎉','#ff3db5'],['social','Social','💬','#2de2ff']];

  var S=null,cv=null,c=null,root=null,open=false,raf=0,lastT=0,cam={x:620,y:-150,z:1},mode='live',sel=null,selItem=null,ghost=null,drag=null,paintRoom=null,buyCat='seat',speed=1,residents=[],pointers={},uid=1,dirty=0,happyStreak=0;
  function nid(){return 'i'+(Date.now().toString(36))+(uid++);}
  function starter(){
    var it=[],p=function(t,f,x,o){var r={id:nid(),type:t,floor:f,x:x,col:null,flip:false,on:true};Object.assign(r,o||{});it.push(r);return r;};
    p('bookshelf',0,50);p('tv',0,140);p('rug',0,270);p('couch',0,270);p('floorlamp',0,370);p('bigplant',0,450);
    p('window',0,270,{wy:130});p('painting',0,140,{wy:150});
    p('fridge',0,665);p('stove',0,745);var tb=p('table',0,850);p('plant',0,850,{par:tb.id});p('chair',0,920,{flip:true});
    p('window',0,745,{wy:140});p('clock',0,890,{wy:170});
    p('bed',0,1090);var ns=p('nightstand',0,1200);p('lamp',0,1200,{par:ns.id});p('window',0,1090,{wy:130});
    return it;
  }
  function blank(){return {v:1,items:starter(),rooms:{living:{wall:'#3b2a5c',pat:'stripes',floor:'wood'},kitchen:{wall:'#dff4ff',pat:'check',floor:'tile'},bedroom:{wall:'#cfc2ff',pat:'stars',floor:'carpet'},bath:{wall:'#e9ffe6',pat:'waves',floor:'marble'},play:{wall:'#2a3b5c',pat:'dots',floor:'neon'}},upstairs:false,min:8*60,day:1,res:null,happyDay:{k:'',v:0}};}
  function load(){var d=Treesh.get(SK,null);if(!d||!d.items)d=blank();Object.keys(blank().rooms).forEach(function(k){if(!d.rooms[k])d.rooms[k]=blank().rooms[k];});return d;}
  function save(){if(!S)return;S.res=residents.map(function(r){return {key:r.key,needs:r.needs,x:r.x,floor:r.floor};});Treesh.set(SK,S);}
  function floorY(f){return -f*FH;}
  function roomAt(f,x){for(var i=0;i<ROOMS.length;i++){var r=ROOMS[i];if(r.f===f&&x>=r.x0&&x<r.x1)return r;}return null;}
  function byId(id){for(var i=0;i<S.items.length;i++)if(S.items[i].id===id)return S.items[i];return null;}
  function cat(it){return CAT[it.type]||{w:40,h:40,place:'floor'};}
  function baseY(it){/* world y of the item's bottom */var ct=cat(it);if(ct.place==='wall')return floorY(it.floor)-SLAB-(it.wy||120);var p=it.par&&byId(it.par);if(p)return baseY(p)-cat(p).h;return floorY(it.floor)-SLAB+(ct.place==='rug'?6:0);}
  function bounds(it){var ct=cat(it),by=baseY(it);return {x0:it.x-ct.w/2,x1:it.x+ct.w/2,y0:by-ct.h,y1:by};}
  function valid(it){
    var ct=cat(it),b=bounds(it),rm=roomAt(it.floor,it.x);if(!rm)return false;if(it.floor===1&&!S.upstairs)return false;
    if(b.x0<rm.x0+8||b.x1>rm.x1-8)return false;
    if(ct.place==='wall'){var ceil=floorY(it.floor)-FH;if(b.y0<ceil+12||b.y1>floorY(it.floor)-SLAB-40)return false;}
    for(var i=0;i<S.items.length;i++){var o=S.items[i];if(o===it||o.id===it.id||o.floor!==it.floor)continue;var oc=cat(o);
      if(ct.place==='wall'||oc.place==='wall'){if(ct.place!==oc.place)continue;var ob=bounds(o);if(b.x0<ob.x1&&b.x1>ob.x0&&b.y0<ob.y1&&b.y1>ob.y0)return false;continue;}
      if(ct.place==='rug'||oc.place==='rug'){if(ct.place===oc.place&&b.x0<o.x+oc.w/2&&b.x1>o.x-oc.w/2)return false;continue;}
      if(it.par||o.par){if(it.par&&o.par===it.par){var ob2=bounds(o);if(b.x0<ob2.x1&&b.x1>ob2.x0)return false;}continue;}
      if(o.id===it.par)continue;
      if(b.x0<o.x+oc.w/2-2&&b.x1>o.x-oc.w/2+2)return false;}
    if(it.par){var p=byId(it.par);if(!p)return false;var pc=cat(p);if(b.x0<p.x-pc.w/2-4||b.x1>p.x+pc.w/2+4)return false;}
    return true;
  }
  /* ---------------- residents ---------------- */
  function residentSpecs(){
    var list=[];(typeof saved!=='undefined'?saved:[]).slice(0,4).forEach(function(f){list.push({key:'me:'+f.id,name:f.name,spec:f,mine:true});});
    var extra=(S.guests||['Lulu','Momo']);extra.forEach(function(n){if(window.FREA_CAST[n])list.push({key:'cast:'+n,name:n,spec:Object.assign({size:'normal',legStyle:'default',legShape:'default',eyeColor:'#101018',hat:'none',trail:'none',aura:'none'},window.FREA_CAST[n])});});
    return list.slice(0,8);
  }
  function buildResidents(){
    var prev={};(S.res||[]).forEach(function(r){prev[r.key]=r;});
    residents=residentSpecs().map(function(d,i){var f=new Flea(0,0,!!d.mine&&i===0,d.name,d.spec);f.stuck=true;f.onG=true;var p=prev[d.key]||{};
      return {key:d.key,name:d.name,f:f,mine:!!d.mine,x:p.x!=null?p.x:120+i*110,floor:(p.floor===1&&S.upstairs)?1:0,y:0,needs:p.needs||{hunger:60+Math.random()*30,energy:55+Math.random()*35,fun:45+Math.random()*40,social:50+Math.random()*40},act:null,think:0,bub:null,dir:1,climb:null,idleT:1+Math.random()*3};});
  }
  function mood(r){var n=r.needs;return (n.hunger+n.energy+n.fun+n.social)/4;}
  function say(r,emo,t){r.bub={e:emo,t:t||2.4};}
  function useItem(r,it){var ct=cat(it),u=ct.use;if(!u)return false;if(it.busy&&it.busy!==r.key){say(r,'⏳');return false;}
    var SIDE={tv:1,aquarium:1,easel:1},tx=it.x;if(SIDE[it.type]){var rm=roomAt(it.floor,it.x)||{x0:0,x1:HW},off=ct.w/2+30,sd=(r.x>it.x?1:-1);if(it.x+sd*off>rm.x1-20||it.x+sd*off<rm.x0+20)sd=-sd;tx=it.x+sd*off;}
    goTo(r,it.floor,tx,function(){if(it.busy&&it.busy!==r.key){say(r,'😕');return;}it.busy=r.key;r.dir=it.x>r.x?1:(it.x<r.x?-1:r.dir);if(TOGGLE[it.type])it.on=true;
      r.act={k:'use',it:it,left:u.dur,u:u};r.f.action=u.act==='wiggle'?'':u.act;r.f.actionT=0;say(r,u.emo,u.dur);
      if(u.need==='hunger')Trophies.count('h_eat');if(u.act==='lie'&&it.type==='bed')Trophies.count('h_sleep');});return true;}
  function goTo(r,f,x,then){stop(r);r.act={k:'walk',f:f,x:x,then:then};}
  function stop(r){if(r.act&&r.act.it&&r.act.it.busy===r.key)r.act.it.busy=null;if(r.act&&r.act.k==='chat'&&r.act.w&&r.act.w.act&&r.act.w.act.k==='chat'){r.act.w.act=null;r.act.w.f.action='';}r.act=null;r.f.action='';r.climb=null;}
  function chat(r,w){if(!w||w===r)return;stop(w);goTo(r,w.floor,w.x+(w.x>r.x?-46:46),function(){if(w.act&&w.act.k!=='idle'&&w.act.k!=='chat'){say(r,'🤷');return;}r.act={k:'chat',w:w,left:7};w.act={k:'chat',w:r,left:7};r.dir=w.x>r.x?1:-1;w.dir=-r.dir;});}
  function autonomous(r){
    var n=r.needs,low=NEEDS.map(function(k){return [k[0],n[k[0]]];}).sort(function(a,b){return a[1]-b[1];})[0];
    if(low[1]<68){
      if(low[0]==='social'){var others=residents.filter(function(o){return o!==r&&(!o.act||o.act.k==='walk'&&!o.act.then)&&!(o.climb);});if(others.length){chat(r,others[(Math.random()*others.length)|0]);return;}}
      var cands=S.items.filter(function(it){var u=cat(it).use;return u&&u.need===low[0]&&!it.busy&&(it.floor===0||S.upstairs);});
      if(low[0]==='energy'&&n.energy>30){var nb=cands.filter(function(it){return it.type!=='bed';});if(nb.length)cands=nb;}
      if(cands.length){cands.sort(function(a,b){return (Math.abs(a.x-r.x)+(a.floor!==r.floor?600:0))-(Math.abs(b.x-r.x)+(b.floor!==r.floor?600:0));});useItem(r,cands[Math.random()<.75?0:(Math.random()*cands.length)|0]);return;}
      say(r,{hunger:'🍽️❗',energy:'🛏️❗',fun:'🎈❗',social:'💬❗'}[low[0]],3);
    }
    /* wander / idle flavor */
    var rm=ROOMS.filter(function(q){return q.f===0||S.upstairs;});var dst=rm[(Math.random()*rm.length)|0];
    if(Math.random()<.6)goTo(r,dst.f,dst.x0+40+Math.random()*(dst.x1-dst.x0-80),null);else{r.act={k:'idle',left:2+Math.random()*3};if(Math.random()<.5){r.f.action=['wave','dance','wiggle','cheer','jump'][(Math.random()*5)|0];r.f.actionT=0;}}
  }
  function simStep(r,dt,gm){
    var n=r.needs,sleeping=r.act&&r.act.k==='use'&&r.act.u.act==='lie';
    n.hunger=Math.max(0,n.hunger-0.11*gm);n.energy=Math.max(0,n.energy-(sleeping?0:0.075)*gm);n.fun=Math.max(0,n.fun-0.13*gm);n.social=Math.max(0,n.social-(r.act&&r.act.k==='chat'?0:0.09)*gm);
    var f=r.f;f.la+=dt*6;f.ea+=dt*3;if(f.action)f.actionT+=dt*1000;
    if(r.bub){r.bub.t-=dt;if(r.bub.t<=0)r.bub=null;}
    if(r.climb){r.climb.t+=dt/1.4;if(r.climb.t>=1){r.floor=r.climb.to;r.climb=null;}return;}
    var a=r.act;if(!a){r.idleT-=dt;if(r.idleT<=0){r.idleT=1.5+Math.random()*2.5;if(r.auto!==false)autonomous(r);}return;}
    if(a.k==='walk'){
      var tf=a.f;if(tf===1&&!S.upstairs)tf=0;
      var tx=(tf!==r.floor)?STAIR_X+60:a.x,dx=tx-r.x,sp=95*Math.min(gm*2+.5,2.5);
      if(Math.abs(dx)<4){if(tf!==r.floor){r.climb={t:0,from:r.floor,to:tf};return;}var th=a.then;r.act=null;if(th)th();else{r.act={k:'idle',left:.6};}return;}
      r.dir=dx>0?1:-1;r.x+=Math.sign(dx)*Math.min(Math.abs(dx),sp*dt);f.walkT=Date.now()+120;f.gaitPhase+=dt*14;return;
    }
    if(a.k==='use'){var u=a.u;a.left-=dt*Math.max(1,gm*.8);n[u.need]=Math.min(100,n[u.need]+u.gain/u.dur*dt*Math.max(1,gm*.8));if(u.need!=='fun'&&u.act!=='sit')n.fun=Math.min(100,n.fun+dt*.6);
      if(u.act==='dance'||u.act==='jump'){if(Math.random()<dt*.6)say(r,['🎵','✨','💖','🎶'][(Math.random()*4)|0],1.2);}
      if(a.left<=0||n[u.need]>=99.5){var it=a.it;it.busy=null;if(it.type==='stove'||it.type==='tv'||it.type==='arcade'||it.type==='computer')it.on=(it.type==='tv'||it.type==='computer')?it.on:false;r.act=null;f.action='';say(r,'😊',1.4);dirty=1;}return;}
    if(a.k==='chat'){a.left-=dt;n.social=Math.min(100,n.social+dt*6);n.fun=Math.min(100,n.fun+dt*1.2);if(Math.random()<dt*1.1)say(r,['💬','😂','💖','🤝','✨','🎵','👀','🍓'][(Math.random()*8)|0],1.4);f.action=Math.random()<dt*.2?'wave':f.action;
      if(a.left<=0){r.act=null;f.action='';}return;}
    if(a.k==='idle'){a.left-=dt;if(a.left<=0){r.act=null;f.action='';}}
  }
  function resY(r){var fy=floorY(r.floor)-SLAB;if(r.climb){var t=r.climb.t,a=floorY(r.climb.from)-SLAB,b=floorY(r.climb.to)-SLAB;fy=a+(b-a)*t;}
    var a2=r.act;if(a2&&a2.k==='use'){var u=a2.u,it=a2.it;return baseY(it)-(u.seat||0)*(it.type==='bed'||it.type==='bathtub'?1:.9);}return fy;}

  /* ---------------- rendering ---------------- */
  function hourOf(){return (S.min/60)%24;}
  function skyCols(h){if(h<5||h>=21)return ['#070a24','#1a1140'];if(h<7)return ['#3a2a6a','#ff8a6a'];if(h<17)return ['#5cc8ff','#c9ecff'];if(h<19)return ['#ff7a8a','#ffc27a'];return ['#2a1a5a','#ff6a8a'];}
  function isNight(){var h=hourOf();return h<6.5||h>=19.5;}
  var patCache={};
  function wallPat(col,pat){var k=col+pat;if(patCache[k])return patCache[k];var p=document.createElement('canvas');p.width=p.height=40;var q=p.getContext('2d');q.fillStyle=col;q.fillRect(0,0,40,40);var ink=Furni.shade(col,/^#(f|e|d|c)/i.test(col)?-.12:.14);q.fillStyle=ink;q.strokeStyle=ink;q.lineWidth=3;
    if(pat==='stripes'){q.fillRect(0,0,10,40);q.fillRect(20,0,4,40);}else if(pat==='dots'){[[10,10],[30,30]].forEach(function(d){q.beginPath();q.arc(d[0],d[1],4,0,7);q.fill();});}
    else if(pat==='hearts'){[[10,12],[30,32]].forEach(function(d){q.beginPath();q.moveTo(d[0],d[1]+4);q.bezierCurveTo(d[0]-7,d[1]-2,d[0]-2,d[1]-7,d[0],d[1]-2);q.bezierCurveTo(d[0]+2,d[1]-7,d[0]+7,d[1]-2,d[0],d[1]+4);q.fill();});}
    else if(pat==='stars'){[[10,10],[30,28]].forEach(function(d){q.beginPath();for(var i=0;i<10;i++){var a=i*Math.PI/5-Math.PI/2,r=i%2?2:5;q.lineTo(d[0]+Math.cos(a)*r,d[1]+Math.sin(a)*r);}q.fill();});}
    else if(pat==='waves'){q.beginPath();for(var x=0;x<=40;x+=2)q.lineTo(x,20+Math.sin(x/40*Math.PI*2)*5);q.stroke();}
    else if(pat==='check'){q.fillRect(0,0,20,20);q.fillRect(20,20,20,20);}
    return (patCache[k]=c.createPattern(p,'repeat'));}
  function drawFloorStrip(x0,x1,y,st){var h=SLAB;var g;
    if(st==='wood'||st==='dark'){c.fillStyle=st==='wood'?'#c98a4f':'#6a3f24';c.fillRect(x0,y,x1-x0,h);c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=1;for(var x=x0;x<x1;x+=38){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+h);c.stroke();}}
    else if(st==='tile'){c.fillStyle='#e8f0ff';c.fillRect(x0,y,x1-x0,h);c.fillStyle='#b8c8e8';for(var x2=x0;x2<x1;x2+=28)c.fillRect(x2,y,1.5,h);}
    else if(st==='carpet'){c.fillStyle='#ff9ac8';c.fillRect(x0,y,x1-x0,h);}
    else if(st==='neon'){c.fillStyle='#120a2a';c.fillRect(x0,y,x1-x0,h);c.fillStyle='#2de2ff';c.fillRect(x0,y,x1-x0,2);for(var x3=x0;x3<x1;x3+=30)c.fillRect(x3,y,1.5,h);}
    else{g=c.createLinearGradient(x0,y,x1,y);g.addColorStop(0,'#f4f4fa');g.addColorStop(.5,'#dcdcec');g.addColorStop(1,'#f4f4fa');c.fillStyle=g;c.fillRect(x0,y,x1-x0,h);}
    c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x0,y,x1-x0,1.5);}
  function drawHouse(t){
    var night=isNight();
    /* roof */
    var top=floorY(2)-6;c.fillStyle='#2a1a4a';c.beginPath();c.moveTo(-50,top+4);c.lineTo(HW/2,top-150);c.lineTo(HW+50,top+4);c.closePath();c.fill();
    c.strokeStyle='#ff3db5';c.lineWidth=5;c.shadowColor='#ff3db5';c.shadowBlur=14;c.stroke();c.shadowBlur=0;
    c.fillStyle='#3a2a6a';c.fillRect(HW*0.74,top-120,46,80);
    c.fillStyle='#ffd23d';c.font='bold 30px Orbitron, sans-serif';c.textAlign='center';c.shadowColor='#ffd23d';c.shadowBlur=12;c.fillText('FREA! HOUSE',HW/2,top-40);c.shadowBlur=0;c.textAlign='left';
    /* walls & floors */
    for(var f=0;f<2;f++){var fy=floorY(f),cy=fy-FH;
      ROOMS.filter(function(r){return r.f===f&&(f===0||S.upstairs);}).forEach(function(r){var st=S.rooms[r.id];
        c.fillStyle=wallPat(st.wall,st.pat);c.save();c.translate(0,0);c.fillRect(r.x0,cy,r.x1-r.x0,FH-SLAB);c.restore();
        var sg=c.createLinearGradient(0,cy,0,fy);sg.addColorStop(0,'rgba(0,0,0,.18)');sg.addColorStop(.25,'rgba(0,0,0,0)');sg.addColorStop(1,'rgba(0,0,0,.12)');c.fillStyle=sg;c.fillRect(r.x0,cy,r.x1-r.x0,FH-SLAB);
        c.fillStyle='rgba(255,255,255,.55)';c.fillRect(r.x0,fy-SLAB-8,r.x1-r.x0,8);
        drawFloorStrip(r.x0,r.x1,fy-SLAB,st.floor);
        if(mode==='paint'&&paintRoom===r.id){c.strokeStyle='#ffd23d';c.lineWidth=4;c.setLineDash([10,6]);c.strokeRect(r.x0+3,cy+3,r.x1-r.x0-6,FH-SLAB-6);c.setLineDash([]);}
        c.fillStyle='rgba(255,255,255,.55)';c.font='600 13px Fredoka, sans-serif';c.fillText(r.name.toUpperCase(),r.x0+12,cy+22);
      });
      /* interior walls with doorways */
      ROOMS.filter(function(r){return r.f===f&&r.x0>0;}).forEach(function(r){c.fillStyle='#e9e2ff';c.fillRect(r.x0-5,cy,10,FH-SLAB-150);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(r.x0-5,cy+FH-SLAB-150,10,4);c.strokeStyle='#e9e2ff';c.lineWidth=3;c.strokeRect(r.x0-5,cy+FH-SLAB-150,10,150);});
      /* stairwell */
      c.fillStyle=f===0?'#2e2450':'#3a2e60';c.fillRect(STAIR_X,cy,HW-STAIR_X,FH-SLAB);drawFloorStrip(STAIR_X,HW,fy-SLAB,'dark');
      if(f===0){for(var s=0;s<10;s++){var sx=STAIR_X+8+s*11,sy=fy-SLAB-(s+1)*(FH/10);c.fillStyle=s%2?'#b77a44':'#c98a4f';c.fillRect(sx,sy,HW-sx-6,FH/10);}c.strokeStyle='#ffd23d';c.lineWidth=3;c.beginPath();c.moveTo(STAIR_X+8,fy-SLAB-40);c.lineTo(HW-10,fy-FH-30);c.stroke();}
      else{c.fillStyle='rgba(255,255,255,.4)';for(var k=0;k<5;k++)c.fillRect(STAIR_X+10+k*22,fy-SLAB-40,3,40);c.fillRect(STAIR_X+6,fy-SLAB-42,HW-STAIR_X-12,4);}
      /* slab */
      c.fillStyle='#1d1433';c.fillRect(-14,fy,HW+28,f===0?24:10);
    }
    c.fillStyle='#1d1433';c.fillRect(-14,floorY(2)-10,HW+28,12);c.fillRect(-14,floorY(2)-10,14,2*FH+34);c.fillRect(HW,floorY(2)-10,14,2*FH+34);
    if(!S.upstairs){var ly=floorY(1)-FH;c.fillStyle='rgba(8,6,20,.78)';c.fillRect(0,ly,HW,FH);c.strokeStyle='#ffd23d';c.lineWidth=3;c.setLineDash([14,10]);c.strokeRect(10,ly+10,HW-20,FH-20);c.setLineDash([]);
      c.textAlign='center';c.fillStyle='#fff';c.font='bold 28px Fredoka, sans-serif';c.fillText('🔒 Upstairs — Bathroom & Playroom',HW/2,ly+FH/2-12);c.fillStyle='#ffd23d';c.font='600 18px Fredoka, sans-serif';c.fillText('Tap here to unlock for '+UPSTAIRS_COST+' ✦ Starlites',HW/2,ly+FH/2+20);c.textAlign='left';}
    if(night){ROOMS.forEach(function(r){if(r.f===1&&!S.upstairs)return;var cy2=floorY(r.f)-FH;c.fillStyle='rgba(10,8,40,.34)';c.fillRect(r.x0,cy2,r.x1-r.x0,FH);});}
  }
  function drawItem(it,t,alpha,bad){var ct=cat(it),b=bounds(it);c.save();if(alpha!=null)c.globalAlpha=alpha;
    var o={t:t,on:it.on!==false,col:it.col||undefined,flip:it.flip};
    if(it.type==='window'){o.sky=skyCols(hourOf());o.night=isNight();}
    if(it.type==='clock'){var d=new Date();d.setHours(Math.floor(hourOf()),Math.floor(S.min%60));o.clock=d;}
    Furni.draw(c,it.type,b.x0,b.y0,ct.w,ct.h,o);
    if(bad){c.fillStyle='rgba(255,40,80,.35)';c.fillRect(b.x0,b.y0,ct.w,ct.h);}
    if(selItem===it){c.strokeStyle='#ffd23d';c.lineWidth=2.5;c.setLineDash([6,4]);c.strokeRect(b.x0-4,b.y0-4,ct.w+8,ct.h+8);c.setLineDash([]);}
    c.restore();}
  function lightGlow(){if(!isNight())return;c.save();c.globalCompositeOperation='lighter';S.items.forEach(function(it){if(it.on===false)return;var L={lamp:[110,'#ffcf7a'],floorlamp:[170,'#ffd98a'],fireplace:[180,'#ff8a3a'],tv:[110,'#6ad0ff'],arcade:[110,'#ff3db5'],aquarium:[90,'#2de2ff']}[it.type];if(!L)return;var b=bounds(it),g=c.createRadialGradient(it.x,b.y0+20,4,it.x,b.y0+20,L[0]);g.addColorStop(0,Furni.alpha(L[1],.28));g.addColorStop(1,Furni.alpha(L[1],0));c.fillStyle=g;c.beginPath();c.arc(it.x,b.y0+20,L[0],0,7);c.fill();});c.restore();}
  function drawRes(r){
    var f=r.f,y=resY(r);f.face=r.dir;var lying=r.act&&r.act.k==='use'&&r.act.u.act==='lie';
    var X=r.x,Y=y-16*FS;if(r.climb){X=STAIR_X+60+(r.climb.to>r.climb.from?1:-1)*0;}
    /* declutter name tags: when fleas bunch up, only one label shows (the selected flea wins) */
    var ri=residents.indexOf(r);f.hideName=r!==sel&&residents.some(function(o,oi){return o!==r&&Math.abs(o.x-r.x)<58&&Math.abs(resY(o)-y)<40&&(o===sel||oi<ri);});
    var s=ctx;ctx=c;c.save();c.translate(X,lying?y-10:Y);c.scale(FS,FS);try{f.draw(f.cx,f.cy);}catch(e){}c.restore();ctx=s;
    /* mood plumbob */
    var m=mood(r),col=m>70?'#39ff7a':m>40?'#ffd23d':'#ff4d6d',py=Y-46*FS+Math.sin(performance.now()/300+X)*3,sp=performance.now()/500;
    c.save();c.translate(X,py);c.scale(Math.cos(sp)*.6+.4*Math.sign(Math.cos(sp)||1),1);c.fillStyle=col;c.shadowColor=col;c.shadowBlur=sel===r?16:8;c.beginPath();c.moveTo(0,-9);c.lineTo(6,0);c.lineTo(0,10);c.lineTo(-6,0);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.moveTo(0,-9);c.lineTo(3,-1);c.lineTo(0,2);c.closePath();c.fill();c.restore();
    if(r.bub){c.save();var bx=X+16*FS,by=Y-36*FS;c.fillStyle='rgba(255,255,255,.95)';c.beginPath();c.ellipse(bx,by,18,14,0,0,7);c.fill();c.beginPath();c.arc(bx-12,by+14,4,0,7);c.fill();c.beginPath();c.arc(bx-17,by+20,2.2,0,7);c.fill();c.font='16px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(r.bub.e,bx,by+1);c.restore();}
    if(lying&&r.act.it.type==='bed'){c.fillStyle='rgba(255,255,255,.85)';c.font='bold 14px Fredoka, sans-serif';var zt=performance.now()/600;for(var i=0;i<3;i++){c.globalAlpha=((zt+i/3)%1);c.fillText('z',X+10+i*8,Y-20-((zt+i/3)%1)*24);}c.globalAlpha=1;}
    if(sel===r){c.strokeStyle='#ffd23d';c.lineWidth=3;c.beginPath();c.ellipse(X,y+4,24,6,0,0,7);c.stroke();}
  }
  var bgCache=null;
  function drawBG(W2,H2){var h=hourOf(),sk=skyCols(h),g=c.createLinearGradient(0,0,0,H2);g.addColorStop(0,sk[0]);g.addColorStop(1,sk[1]);c.fillStyle=g;c.fillRect(0,0,W2,H2);
    if(isNight()){c.fillStyle='#fff';for(var i=0;i<60;i++){c.globalAlpha=.3+((i*37)%7)/10;c.fillRect((i*137)%W2,(i*71)%(H2*.6),1.6,1.6);}c.globalAlpha=1;}
    var sunA=(h-6)/14*Math.PI,sx=W2*.1+W2*.8*((h-6)/14),sy=H2*.55-Math.sin(sunA)*H2*.4;if(h>=6&&h<=20){c.fillStyle=h<7||h>18?'#ff9a6a':'#fff3b0';c.shadowColor=c.fillStyle;c.shadowBlur=40;c.beginPath();c.arc(sx,sy,26,0,7);c.fill();c.shadowBlur=0;}
    else{c.fillStyle='#f4f0ff';c.shadowColor='#c9b8ff';c.shadowBlur=30;c.beginPath();c.arc(W2*.82,H2*.16,20,0,7);c.fill();c.shadowBlur=0;}
    c.fillStyle=isNight()?'#140c30':'rgba(60,40,120,.35)';for(var b=0;b<W2;b+=46){var bh=60+((b*13)%90);c.fillRect(b,H2*.72-bh,40,bh+H2);}
  }
  function frame(ts){
    if(!open)return;raf=requestAnimationFrame(frame);var dt=Math.min(.05,(ts-(lastT||ts))/1000);lastT=ts;var t=ts/1000;
    var gm=speed*dt*1.0;/* game minutes per frame: 1 real sec = 1 game min at 1x */
    if(speed>0){S.min+=gm;if(S.min>=24*60){S.min-=24*60;S.day=(S.day||1)+1;}residents.forEach(function(r){simStep(r,dt,gm);});hourTick();}
    var W2=cv.width,H2=cv.height,dpr=cv._dpr||1;c.setTransform(1,0,0,1,0,0);drawBG(W2,H2);
    var V=view();c.setTransform(cam.z*dpr,0,0,cam.z*dpr,(V.cx-cam.x*cam.z)*dpr,(V.cy-cam.y*cam.z)*dpr);
    c.fillStyle='#1f7a4a';c.fillRect(-3000,10,HW+6000,3000);c.fillStyle='#39ff7a';c.fillRect(-2000,10,HW+4000,4);
    drawHouse(t);
    var order=S.items.slice().sort(function(a,b){var la=cat(a).place==='wall'?0:cat(a).place==='rug'?1:a.par?3:2,lb=cat(b).place==='wall'?0:cat(b).place==='rug'?1:b.par?3:2;return la-lb;});
    order.forEach(function(it){if(it.floor===1&&!S.upstairs)return;if(drag&&drag.it===it)return;drawItem(it,t);});
    residents.slice().sort(function(a,b){return (sel===a)-(sel===b);}).forEach(function(r){drawRes(r);});
    lightGlow();
    if(drag&&drag.it){drawItem(drag.it,t,.85,!valid(drag.it));}
    if(ghost&&ghost.it){drawItem(ghost.it,t,.7,!valid(ghost.it)||!Treesh.canAfford(cat(ghost.it).price));}
    if(sel)paintFleaPanel();
    if(dirty){dirty=0;save();}
  }
  var lastHour=-1;
  function hourTick(){var h=Math.floor(hourOf());if(h===lastHour)return;lastHour=h;
    document.getElementById('hs-clock').textContent='Day '+(S.day||1)+' · '+((h%12)||12)+':'+('0'+Math.floor(S.min%60)).slice(-2)+' '+(h<12?'AM':'PM');
    var avg=residents.reduce(function(a,r){return a+mood(r);},0)/Math.max(1,residents.length);
    if(residents.length&&residents.every(function(r){return mood(r)>80;}))Trophies.flag('h_happy');
    ROOMS.forEach(function(rm){var inRoom=residents.filter(function(r){return r.floor===rm.f&&r.x>=rm.x0&&r.x<rm.x1;});if(inRoom.length>=6)Trophies.flag('h_party');});
    if(avg>72){happyStreak++;if(happyStreak>=3){happyStreak=0;var hd=S.happyDay||{k:'',v:0};if(hd.k!==Treesh.dayKey())hd={k:Treesh.dayKey(),v:0};if(hd.v<40){hd.v+=5;S.happyDay=hd;Treesh.award(5,'Happy household',{icon:'🏠'});}}}else happyStreak=0;
    save();}
  function checkRooms(){var ok=ROOMS.every(function(rm){return S.items.filter(function(it){return it.floor===rm.f&&it.x>=rm.x0&&it.x<rm.x1;}).length>=3;});if(ok&&S.upstairs)Trophies.flag('h_rooms');}

  /* ---------------- input ---------------- */
  function insets(){var top=64,bot=(mode==='buy'||mode==='paint')?(el('hs-'+mode)?el('hs-'+mode).offsetHeight+80:260):84;return {top:top,bot:bot};}
  function view(){var r=cv.getBoundingClientRect(),i=insets();return {w:r.width,h:Math.max(120,r.height-i.top-i.bot),cx:r.width/2,cy:i.top+(r.height-i.top-i.bot)/2,left:r.left,top:r.top};}
  function toWorld(px,py){var v=view();return {x:(px-v.left-v.cx)/cam.z+cam.x,y:(py-v.top-v.cy)/cam.z+cam.y};}
  function floorAtY(y){if(y>floorY(1)-4)return 0;return 1;}
  function hitItem(w){var best=null;for(var i=S.items.length-1;i>=0;i--){var it=S.items[i];if(it.floor===1&&!S.upstairs)continue;var b=bounds(it);if(w.x>=b.x0-4&&w.x<=b.x1+4&&w.y>=b.y0-4&&w.y<=b.y1+4){var pri=it.par?3:(cat(it).place==='rug'?0:cat(it).place==='wall'?1:2);if(!best||pri>best.p)best={it:it,p:pri};}}return best&&best.it;}
  function hitRes(w){for(var i=0;i<residents.length;i++){var r=residents[i],y=resY(r)-16*FS;if(Math.abs(w.x-r.x)<24*FS/1.4&&Math.abs(w.y-y)<24*FS/1.2)return r;}return null;}
  function placeAt(it,w){var ct=cat(it);it.floor=floorAtY(w.y);it.x=Math.round(w.x/10)*10;delete it.par;
    if(ct.place==='wall'){it.wy=Math.max(40,Math.round((floorY(it.floor)-SLAB-(w.y+ct.h/2))/10)*10);return;}
    if(ct.place==='any'){var fy=floorY(it.floor)-SLAB;for(var i=0;i<S.items.length;i++){var p=S.items[i];if(p===it||!SURF[p.type]||p.floor!==it.floor||p.par)continue;var pc=cat(p);if(Math.abs(w.x-p.x)<pc.w/2+6&&w.y<fy-pc.h*0.45){it.par=p.id;it.x=Math.max(p.x-pc.w/2+ct.w/2,Math.min(p.x+pc.w/2-ct.w/2,it.x));break;}}}}
  function onDown(e){cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);pointers[e.pointerId]={x:e.clientX,y:e.clientY};
    if(Object.keys(pointers).length===2){drag={pinch:true,d0:pdist(),z0:cam.z};return;}
    var w=toWorld(e.clientX,e.clientY);
    if(!S.upstairs&&w.y<floorY(1)&&w.y>floorY(2)&&w.x>0&&w.x<HW){askUnlock();return;}
    if(ghost){ghost.it=ghost.it||{id:'ghost',type:ghost.type,col:ghost.col,flip:false,on:true};placeAt(ghost.it,w);ghost.down=true;return;}
    if(mode==='buy'){var it=hitItem(w);if(it){selectItem(it);drag={it:it,orig:JSON.parse(JSON.stringify(it)),kids:S.items.filter(function(k){return k.par===it.id;}).map(function(k){return [k,k.x,k.floor];}),moved:false,sx:e.clientX,sy:e.clientY};return;}selectItem(null);}
    if(mode==='paint'){var rm=roomAt(floorAtY(w.y),w.x);if(rm&&(rm.f===0||S.upstairs)){paintRoom=rm.id;renderPaint();}return;}
    if(mode==='live'){var r=hitRes(w);if(r){selectRes(r);return;}var it2=hitItem(w);if(it2&&sel&&cat(it2).use){sel.auto=false;useItem(sel,it2);setTimeout(function(){if(sel)sel.auto=true;},(cat(it2).use.dur+8)*1000);tip(sel.name+' → '+cat(it2).use.verb);return;}
      if(it2&&TOGGLE[it2.type]&&!sel){it2.on=it2.on===false;dirty=1;return;}
      if(sel&&Math.abs(w.y-(floorY(floorAtY(w.y))-40))<120){var fl=floorAtY(w.y);if(fl===0||S.upstairs){sel.auto=false;goTo(sel,fl,Math.max(20,Math.min(STAIR_X-20,w.x)),function(){if(sel)sel.auto=true;});}}}
    drag={pan:true,sx:e.clientX,sy:e.clientY,cx:cam.x,cy:cam.y};}
  function pdist(){var p=Object.values(pointers);return Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1;}
  function onMove(e){if(pointers[e.pointerId])pointers[e.pointerId]={x:e.clientX,y:e.clientY};var w=toWorld(e.clientX,e.clientY);
    if(drag&&drag.pinch&&Object.keys(pointers).length===2){cam.z=clampZ(drag.z0*pdist()/drag.d0);return;}
    if(ghost){ghost.it=ghost.it||{id:'ghost',type:ghost.type,col:ghost.col,flip:false,on:true};placeAt(ghost.it,w);return;}
    if(!drag)return;
    if(drag.it){if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>6)drag.moved=true;if(drag.moved){var kids=S.items.filter(function(k){return k.par===drag.it.id;}),ox=drag.it.x;placeAt(drag.it,w);kids.forEach(function(k){k.x+=drag.it.x-ox;k.floor=drag.it.floor;});}return;}
    if(drag.pan){cam.x=drag.cx-(e.clientX-drag.sx)/cam.z;cam.y=drag.cy-(e.clientY-drag.sy)/cam.z;clampCam();}}
  function onUp(e){delete pointers[e.pointerId];
    if(ghost&&ghost.it&&ghost.down){ghost.down=false;var it=ghost.it,ct=cat(it);if(!valid(it)){tip('Can\'t place there — try another spot',1);return;}
      if(!Treesh.spend(ct.price,'Bought '+ct.name)){tip('Need '+(ct.price-Treesh.points())+' more ✦ — win matches to earn Starlites!',1);return;}
      var n=JSON.parse(JSON.stringify(it));n.id=nid();S.items.push(n);Trophies.count('h_placed');Trophies.count('h_bought');chime(660);dirty=1;checkRooms();tip(ct.name+' placed! −'+ct.price+' ✦');
      if(!e.shiftKey){/* keep ghost for multi-place; */}renderBuy();return;}
    if(drag&&drag.it){var d=drag;drag=null;if(d.moved){if(!valid(d.it)){Object.assign(d.it,d.orig);if(!d.orig.par)delete d.it.par;d.kids.forEach(function(k){k[0].x=k[1];k[0].floor=k[2];});tip('Invalid spot — moved back',1);}else{Trophies.count('h_placed');dirty=1;checkRooms();chime(520);}}return;}
    if(Object.keys(pointers).length<2)drag=null;}
  function clampZ(z){return Math.max(.25,Math.min(2.4,z));}
  function clampCam(){if(!cv)return;var v=view(),hw=v.w/(2*cam.z),hh=v.h/(2*cam.z),x0=-60,x1=HW+60,y0=floorY(2)-190,y1=50;
    cam.x=(x1-x0<=2*hw)?(x0+x1)/2:Math.max(x0+hw,Math.min(x1-hw,cam.x));cam.y=(y1-y0<=2*hh)?(y0+y1)/2:Math.max(y0+hh,Math.min(y1-hh,cam.y));}
  function onWheel(e){e.preventDefault();var w0=toWorld(e.clientX,e.clientY);cam.z=clampZ(cam.z*(e.deltaY<0?1.1:0.9));var w1=toWorld(e.clientX,e.clientY);cam.x+=w0.x-w1.x;cam.y+=w0.y-w1.y;clampCam();}
  function fit(keep){var r=root.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);cv.width=r.width*dpr;cv.height=r.height*dpr;cv._dpr=dpr;var v=view();
    var zAll=Math.min(v.w/(HW+140),v.h/(2*FH+250)),zFloor=Math.min(v.w/(HW+140),v.h/(FH+40));
    if(zAll>=0.5){cam.z=zAll;cam.x=HW/2;cam.y=floorY(1)-100;}
    else if(zFloor>=0.5){cam.z=zFloor;cam.x=HW/2;cam.y=floorY(0)-FH/2+10;}
    else{cam.z=clampZ(Math.max(.5,Math.min(1,v.h/(FH+60))));if(!keep){cam.x=0;}cam.y=floorY(0)-FH/2+10;}clampCam();}

  /* ---------------- UI ---------------- */
  function el(id){return document.getElementById(id);}
  var tipT=0;function tip(msg,bad){var t=el('hs-tip');t.textContent=msg;t.className='hs-tip show'+(bad?' bad':'');clearTimeout(tipT);tipT=setTimeout(function(){t.className='hs-tip';},2200);}
  var AC=null;function chime(f){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;g.gain.value=.06;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.25);o.stop(AC.currentTime+.26);}catch(e){}}
  function build(){
    root=document.createElement('div');root.id='house';root.setAttribute('data-testid','flea-house');
    root.innerHTML='<canvas id="house-cv" data-testid="house-canvas"></canvas>'+
      '<div class="hs-top"><button class="hs-ib" id="hs-back" data-testid="house-back" aria-label="Back to lobby">‹</button><div class="hs-title"><b>Flea House</b><span id="hs-clock">Day 1 · 8:00 AM</span></div>'+
      '<div class="hs-speed" role="group" aria-label="Game speed"><button data-sp="0" data-testid="house-speed-0">⏸</button><button data-sp="1" class="on" data-testid="house-speed-1">▶</button><button data-sp="3" data-testid="house-speed-3">⏩</button></div>'+
      '<div class="hs-stars" data-testid="house-stars">✦ <b data-star-count>0</b></div><button class="hs-ib" id="hs-savebtn" data-testid="house-save-menu" aria-label="Save and load">💾</button></div>'+
      '<div class="hs-res" id="hs-res" data-testid="house-residents"></div>'+
      '<div class="hs-panel" id="hs-flea" data-testid="house-flea-panel"></div>'+
      '<div class="hs-itembar" id="hs-item" data-testid="house-item-toolbar"></div>'+
      '<div class="hs-drawer" id="hs-buy" data-testid="house-buy-drawer"></div>'+
      '<div class="hs-drawer" id="hs-paint" data-testid="house-paint-drawer"></div>'+
      '<div class="hs-tabs"><button data-mode="live" class="on" data-testid="house-tab-live"><i>👁️</i>Live</button><button data-mode="buy" data-testid="house-tab-buy"><i>🛒</i>Buy</button><button data-mode="paint" data-testid="house-tab-paint"><i>🎨</i>Paint</button><button data-mode="sandbox" data-testid="house-tab-sandbox"><i>🌌</i>Sandbox</button></div>'+
      '<div class="hs-tip" id="hs-tip"></div><div class="hs-modal" id="hs-modal"></div>';
    document.body.appendChild(root);cv=el('house-cv');c=cv.getContext('2d');
    cv.addEventListener('pointerdown',onDown);cv.addEventListener('pointermove',onMove);window.addEventListener('pointerup',function(e){if(open)onUp(e);});cv.addEventListener('pointercancel',function(e){delete pointers[e.pointerId];drag=null;});cv.addEventListener('wheel',onWheel,{passive:false});
    window.addEventListener('resize',function(){if(open)fit();});
    el('hs-back').onclick=close;el('hs-savebtn').onclick=saveMenu;
    [].forEach.call(root.querySelectorAll('[data-sp]'),function(b){b.onclick=function(){speed=+b.dataset.sp;[].forEach.call(root.querySelectorAll('[data-sp]'),function(x){x.classList.toggle('on',x===b);});};});
    [].forEach.call(root.querySelectorAll('.hs-tabs [data-mode]'),function(b){b.onclick=function(){setMode(b.dataset.mode);};});
    window.addEventListener('keydown',function(e){if(!open)return;if(e.key==='Escape'){if(ghost){ghost=null;renderBuy();}else if(selItem)selectItem(null);else if(sel)selectRes(null);}if((e.key==='r'||e.key==='R')&&selItem){selItem.flip=!selItem.flip;dirty=1;}if(e.key==='Delete'&&selItem)sellItem(selItem);});
  }
  function setMode(m){if(m==='sandbox'){close();try{window.__zenSandbox=true;startGame();}finally{window.__zenSandbox=false;}return;}
    mode=m;ghost=null;selectItem(null);if(m!=='live')selectRes(null);paintRoom=m==='paint'?(paintRoom||'living'):null;
    [].forEach.call(root.querySelectorAll('.hs-tabs [data-mode]'),function(x){x.classList.toggle('on',x.dataset.mode===m);});
    el('hs-buy').classList.toggle('show',m==='buy');el('hs-paint').classList.toggle('show',m==='paint');if(m==='buy')renderBuy();if(m==='paint')renderPaint();fit(true);
    tip({live:'Live mode · tap a flea to see their needs & give commands',buy:'Buy mode · pick an item, then tap the house to place · drag items to move',paint:'Paint mode · tap a room, then choose wallpaper & floors'}[m]);}
  function thumbFor(r){var cvs=document.createElement('canvas');cvs.width=cvs.height=64;var q=cvs.getContext('2d'),s=ctx;ctx=q;q.save();q.translate(32,38);q.scale(1.5,1.5);var f=r.f,a=f.action;f.action='';try{f.draw(f.cx,f.cy);}catch(e){}f.action=a;q.restore();ctx=s;return cvs;}
  function renderRes(){var h=el('hs-res');h.innerHTML='';residents.forEach(function(r){var b=document.createElement('button');b.className='hs-av'+(sel===r?' on':'');b.setAttribute('data-testid','house-resident-'+r.name.toLowerCase());b.title=r.name;b.appendChild(thumbFor(r));var m=document.createElement('i');m.style.background=mood(r)>70?'#39ff7a':mood(r)>40?'#ffd23d':'#ff4d6d';b.appendChild(m);b.onclick=function(){selectRes(sel===r?null:r);if(sel){cam.x=r.x;cam.y=floorY(r.floor)-FH/2;clampCam();}};h.appendChild(b);});
    if(residents.length<8){var add=document.createElement('button');add.className='hs-av add';add.textContent='＋';add.title='Invite a roommate';add.setAttribute('data-testid','house-invite');add.onclick=inviteMenu;h.appendChild(add);}}
  function selectRes(r){sel=r;if(r){selectItem(null);}renderRes();el('hs-flea').classList.toggle('show',!!r);if(r)paintFleaPanel(true);}
  var lastPanel=0;
  function paintFleaPanel(force){var now=performance.now();if(!force&&now-lastPanel<400)return;lastPanel=now;var r=sel,p=el('hs-flea');if(!r)return;
    if(!force&&p._r===r){var dt2=p.querySelector('.hf-head span');if(dt2)dt2.textContent=r.act?(r.act.k==='use'?r.act.u.verb:r.act.k==='chat'?'Chatting with '+r.act.w.name:r.act.k==='walk'?'Walking':'Chilling'):'Deciding…';NEEDS.forEach(function(n){var v=Math.round(r.needs[n[0]]),q=p.querySelector('[data-testid="need-'+n[0]+'"]');if(q){q.querySelector('i').style.width=v+'%';q.querySelector('i').style.background=v>60?n[3]:v>30?'#ffd23d':'#ff4d6d';q.querySelector('b').textContent=v;}});return;}
    p._r=r;
    var doing=r.act?(r.act.k==='use'?r.act.u.verb:r.act.k==='chat'?'Chatting with '+r.act.w.name:r.act.k==='walk'?'Walking':'Chilling'):'Deciding…';
    var html='<div class="hf-head"><b>'+r.name+'</b><span>'+doing+'</span><button class="hs-x" data-testid="house-flea-close" aria-label="Close">✕</button></div><div class="hf-needs">'+NEEDS.map(function(n){var v=Math.round(r.needs[n[0]]);return '<div class="hf-need" data-testid="need-'+n[0]+'"><span>'+n[2]+' '+n[1]+'</span><div class="hf-bar"><i style="width:'+v+'%;background:'+(v>60?n[3]:v>30?'#ffd23d':'#ff4d6d')+'"></i></div><b>'+v+'</b></div>';}).join('')+'</div>'+
      '<div class="hf-acts">'+[['hunger','🍓 Eat'],['energy','😴 Rest'],['fun','🎉 Play'],['social','💬 Chat'],['dance','🕺 Dance']].map(function(a){return '<button data-act="'+a[0]+'" data-testid="house-act-'+a[0]+'">'+a[1]+'</button>';}).join('')+'</div>'+
      (r.mine?'':'<button class="hf-out" data-testid="house-move-out">Move out</button>');
    p.innerHTML=html;p.querySelector('.hs-x').onclick=function(){selectRes(null);};
    [].forEach.call(p.querySelectorAll('[data-act]'),function(b){b.onclick=function(){var k=b.dataset.act;r.auto=false;setTimeout(function(){r.auto=true;},25000);
      if(k==='dance'){stop(r);r.act={k:'idle',left:6};r.f.action='dance';r.f.actionT=0;r.needs.fun=Math.min(100,r.needs.fun+8);say(r,'🕺',3);return;}
      if(k==='social'){var o=residents.filter(function(x){return x!==r;});if(o.length){chat(r,o.sort(function(a,b){return Math.abs(a.x-r.x)-Math.abs(b.x-r.x);})[0]);}else tip('Invite a roommate to chat with!',1);return;}
      var its=S.items.filter(function(it){var u=cat(it).use;return u&&u.need===k&&!it.busy&&(it.floor===0||S.upstairs);});if(!its.length){tip('No free furniture for that — visit Buy mode!',1);return;}its.sort(function(a,b){return Math.abs(a.x-r.x)+(a.floor!==r.floor?600:0)-(Math.abs(b.x-r.x)+(b.floor!==r.floor?600:0));});useItem(r,its[0]);};});
    var mo=p.querySelector('.hf-out');if(mo)mo.onclick=function(){var n=r.key.split(':')[1];S.guests=(S.guests||['Lulu','Momo']).filter(function(g){return g!==n;});stop(r);residents.splice(residents.indexOf(r),1);selectRes(null);save();tip(n+' moved out 👋');};}
  function selectItem(it){selItem=it;var b=el('hs-item');if(!b)return;if(!it){b.classList.remove('show');return;}var ct=cat(it);
    b.innerHTML='<b>'+ct.name+'</b><button data-ia="flip" data-testid="house-item-flip">⇋ Flip</button>'+(TOGGLE[it.type]?'<button data-ia="toggle" data-testid="house-item-toggle">'+(it.on===false?'💡 On':'🌙 Off')+'</button>':'')+'<span class="hi-sw">'+PALETTE.map(function(p){return '<i data-col="'+p+'" style="background:'+p+'"></i>';}).join('')+'</span><button data-ia="sell" class="bad" data-testid="house-item-sell">Sell +'+Math.floor(ct.price/2)+'✦</button><button data-ia="done" data-testid="house-item-done">✓</button>';
    b.classList.add('show');b.style.bottom=(insets().bot+8)+'px';
    [].forEach.call(b.querySelectorAll('[data-ia]'),function(x){x.onclick=function(){var a=x.dataset.ia;if(a==='flip'){it.flip=!it.flip;chime(440);}if(a==='toggle'){it.on=it.on===false;selectItem(it);}if(a==='sell'){sellItem(it);return;}if(a==='done'){selectItem(null);}dirty=1;};});
    [].forEach.call(b.querySelectorAll('[data-col]'),function(x){x.onclick=function(){it.col=x.dataset.col;dirty=1;chime(700);};});}
  function sellItem(it){var ct=cat(it);S.items.filter(function(k){return k.par===it.id;}).forEach(function(k){delete k.par;if(!valid(k)){S.items.splice(S.items.indexOf(k),1);Treesh.award(Math.floor(cat(k).price/2),'Sold '+cat(k).name,{silent:true});}});
    residents.forEach(function(r){if(r.act&&r.act.it===it)stop(r);});S.items.splice(S.items.indexOf(it),1);var back=Math.floor(ct.price/2);if(back)Treesh.award(back,'Sold '+ct.name,{silent:true});selectItem(null);dirty=1;tip('Sold '+ct.name+' +'+back+' ✦');}
  function renderBuy(){var h=el('hs-buy');var html='<div class="hb-cats">'+CATS.map(function(k){return '<button data-cat="'+k[0]+'" class="'+(buyCat===k[0]?'on':'')+'" data-testid="house-cat-'+k[0]+'">'+k[2]+' '+k[1]+'</button>';}).join('')+'</div><div class="hb-row">';
    Object.keys(CAT).filter(function(t){return CAT[t].cat===buyCat;}).forEach(function(t){var ct=CAT[t],can=Treesh.canAfford(ct.price);html+='<button class="hb-card'+(ghost&&ghost.type===t?' on':'')+(can?'':' poor')+'" data-type="'+t+'" data-testid="house-buy-'+t+'"><span class="hb-th" data-th="'+t+'"></span><b>'+ct.name+'</b><small>✦ '+ct.price+(ct.use?' · '+ct.use.emo:'')+'</small></button>';});
    h.innerHTML=html+'</div>'+(ghost?'<div class="hb-hint">Placing <b>'+CAT[ghost.type].name+'</b> — tap/drag in the house · <button data-testid="house-buy-cancel" id="hb-cancel">Cancel</button></div>':'');
    [].forEach.call(h.querySelectorAll('[data-th]'),function(s){s.appendChild(Furni.thumb(s.dataset.th,30));});
    [].forEach.call(h.querySelectorAll('[data-cat]'),function(b){b.onclick=function(){buyCat=b.dataset.cat;renderBuy();};});
    [].forEach.call(h.querySelectorAll('[data-type]'),function(b){b.onclick=function(){var t=b.dataset.type;ghost=(ghost&&ghost.type===t)?null:{type:t,it:null};selectItem(null);renderBuy();if(ghost)tip('Tap inside a room to place the '+CAT[t].name);};});
    var cc=el('hb-cancel');if(cc)cc.onclick=function(){ghost=null;renderBuy();};}
  function renderPaint(){var h=el('hs-paint'),rm=ROOMS.find(function(r){return r.id===paintRoom;})||ROOMS[0],st=S.rooms[rm.id];
    h.innerHTML='<div class="hp-room">'+ROOMS.map(function(r){return '<button data-room="'+r.id+'" class="'+(r.id===rm.id?'on':'')+'" '+(r.f===1&&!S.upstairs?'disabled':'')+' data-testid="house-room-'+r.id+'">'+r.name+'</button>';}).join('')+'</div>'+
      '<div class="hp-lbl">Wallpaper</div><div class="hp-sw">'+WALLS.map(function(w){return '<i data-wall="'+w+'" class="'+(st.wall===w?'on':'')+'" style="background:'+w+'"></i>';}).join('')+'</div>'+
      '<div class="hp-pat">'+PATTERNS.map(function(p){return '<button data-pat="'+p+'" class="'+(st.pat===p?'on':'')+'" data-testid="house-pat-'+p+'">'+p+'</button>';}).join('')+'</div>'+
      '<div class="hp-lbl">Floor</div><div class="hp-pat">'+FLOORS.map(function(f){return '<button data-floor="'+f[0]+'" class="'+(st.floor===f[0]?'on':'')+'" data-testid="house-floor-'+f[0]+'">'+f[1]+'</button>';}).join('')+'</div>';
    [].forEach.call(h.querySelectorAll('[data-room]'),function(b){b.onclick=function(){paintRoom=b.dataset.room;renderPaint();};});
    function ch(k,v){st[k]=v;Trophies.count('h_paint');dirty=1;chime(600);renderPaint();}
    [].forEach.call(h.querySelectorAll('[data-wall]'),function(b){b.onclick=function(){ch('wall',b.dataset.wall);};});
    [].forEach.call(h.querySelectorAll('[data-pat]'),function(b){b.onclick=function(){ch('pat',b.dataset.pat);};});
    [].forEach.call(h.querySelectorAll('[data-floor]'),function(b){b.onclick=function(){ch('floor',b.dataset.floor);};});}
  function modal(html){var m=el('hs-modal');m.innerHTML='<div class="hm-card">'+html+'</div>';m.classList.add('show');m.onclick=function(e){if(e.target===m)m.classList.remove('show');};var x=m.querySelector('[data-close]');if(x)x.onclick=function(){m.classList.remove('show');};return m;}
  function askUnlock(){var can=Treesh.canAfford(UPSTAIRS_COST);var m=modal('<div class="hm-t">🪜 Unlock Upstairs</div><p>Add a Bathroom & a huge Playroom to your Flea House.</p><div class="hm-price">✦ '+UPSTAIRS_COST+'</div>'+(can?'':'<p class="hm-warn">You have '+Treesh.points()+' ✦. Win matches, earn trophies & keep your fleas happy to earn more!</p>')+'<div class="hm-row"><button data-close>Not now</button><button class="go" id="hm-unlock" data-testid="house-unlock-confirm" '+(can?'':'disabled')+'>Unlock</button></div>');
    var u=el('hm-unlock');if(u)u.onclick=function(){if(Treesh.spend(UPSTAIRS_COST,'Unlocked Flea House upstairs')){S.upstairs=true;Trophies.flag('h_upstairs');save();chime(880);m.classList.remove('show');tip('Upstairs unlocked! 🎉');if(mode==='paint')renderPaint();}};}
  function inviteMenu(){var have={};residents.forEach(function(r){have[r.name]=1;});var free=Object.keys(window.FREA_CAST).filter(function(n){return !have[n]&&n!=='Frea';});
    var m=modal('<div class="hm-t">Invite a roommate</div><div class="hm-grid">'+free.map(function(n){return '<button data-inv="'+n+'" data-testid="house-invite-'+n.toLowerCase()+'">'+n+'</button>';}).join('')+'</div><div class="hm-row"><button data-close>Close</button></div>');
    [].forEach.call(m.querySelectorAll('[data-inv]'),function(b){b.onclick=function(){S.guests=(S.guests||['Lulu','Momo']).concat([b.dataset.inv]);save();buildResidents();renderRes();m.classList.remove('show');tip(b.dataset.inv+' moved in! 🏠');chime(760);};});}
  function saveMenu(){var slots=[1,2,3].map(function(i){var d=Treesh.get('frea_house_slot_'+i,null);return '<div class="hm-slot"><b>Slot '+i+'</b><small>'+(d?new Date(d.ts).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' · '+d.data.items.length+' items':'Empty')+'</small><button data-sv="'+i+'" data-testid="house-save-slot-'+i+'">Save</button><button data-ld="'+i+'" '+(d?'':'disabled')+' data-testid="house-load-slot-'+i+'">Load</button></div>';}).join('');
    var m=modal('<div class="hm-t">💾 Save &amp; Load</div><p>Your house autosaves. Use slots to keep different designs.</p>'+slots+'<div class="hm-row"><button id="hm-reset" class="bad" data-testid="house-reset">Reset to starter home</button><button data-close>Close</button></div>');
    [].forEach.call(m.querySelectorAll('[data-sv]'),function(b){b.onclick=function(){save();Treesh.set('frea_house_slot_'+b.dataset.sv,{ts:Date.now(),data:S});tip('Saved to slot '+b.dataset.sv);saveMenu();};});
    [].forEach.call(m.querySelectorAll('[data-ld]'),function(b){b.onclick=function(){var d=Treesh.get('frea_house_slot_'+b.dataset.ld,null);if(!d)return;var up=S.upstairs;S=JSON.parse(JSON.stringify(d.data));S.upstairs=S.upstairs||up;buildResidents();renderRes();save();m.classList.remove('show');tip('Loaded slot '+b.dataset.ld);};});
    el('hm-reset').onclick=function(){if(!confirm('Reset your Flea House to the starter home? (Upstairs stays unlocked)'))return;var up=S.upstairs,g=S.guests;S=blank();S.upstairs=up;S.guests=g;buildResidents();renderRes();save();m.classList.remove('show');};}
  function openHouse(){
    if(!root)build();S=load();buildResidents();open=true;root.classList.add('show');isPaused=true;
    try{document.getElementById('overlay').classList.add('gone');}catch(e){}
    fit();setMode('live');renderRes();Treesh.paint();lastT=0;lastHour=-1;raf=requestAnimationFrame(frame);bump('matchesPlayed');bumpMode('matchesByMode','zen');
    if(!Treesh.get('frea_house_seen',0)){Treesh.set('frea_house_seen',1);setTimeout(function(){modal('<div class="hm-t">🏠 Welcome to your Flea House!</div><ul class="hm-list"><li>👁️ <b>Live</b> — tap a flea to see needs & send them to eat, rest, play or chat</li><li>🛒 <b>Buy</b> — spend ✦ Starlites on furniture, drag to rearrange, flip & recolor, stack small items on tables</li><li>🎨 <b>Paint</b> — wallpaper & floors for every room</li><li>💖 Happy fleas earn you bonus Starlites & trophies</li></ul><div class="hm-row"><button class="go" data-close data-testid="house-welcome-ok">Let\'s go!</button></div>');},500);}
  }
  function close(){open=false;cancelAnimationFrame(raf);save();if(root)root.classList.remove('show');isPaused=false;residents.forEach(function(r){stop(r);});S.items.forEach(function(i){i.busy=null;});
    try{toLobby();}catch(e){try{document.getElementById('overlay').classList.remove('gone');}catch(x){}}}
  /* ---------------- Zen entry: choose House or Sandbox ---------------- */
  var _sg=startGame;
  startGame=function(){if(gameMode==='zen'&&!window.__zenSandbox){chooser();return;}return _sg.apply(this,arguments);};
  function chooser(){var d=document.getElementById('zen-choose');if(!d){d=document.createElement('div');d.id='zen-choose';d.setAttribute('data-testid','zen-chooser');document.body.appendChild(d);}
    d.innerHTML='<div class="zc-card"><div class="zc-t">Zen <span>Mode</span></div><div class="zc-s">How do you want to vibe?</div><div class="zc-opts"><button id="zc-house" data-testid="zen-choose-house"><span class="zc-ico">🏠</span><b>Flea House</b><small>Life-sim: build, decorate & care for your fleas</small><em>NEW</em></button><button id="zc-sand" data-testid="zen-choose-sandbox"><span class="zc-ico">🌌</span><b>Sandbox</b><small>Physics playground with worlds & props</small></button></div><button class="zc-back" id="zc-back" data-testid="zen-choose-back">Back to lobby</button></div>';
    d.classList.add('show');
    el('zc-house').onclick=function(){d.classList.remove('show');openHouse();};
    el('zc-sand').onclick=function(){d.classList.remove('show');window.__zenSandbox=true;try{_sg();}finally{window.__zenSandbox=false;}};
    el('zc-back').onclick=function(){d.classList.remove('show');try{toLobby();}catch(e){}};}
  return {w2s:function(x,y){var v=view();return {x:v.left+v.cx+(x-cam.x)*cam.z,y:v.top+v.cy+(y-cam.y)*cam.z};},open:openHouse,close:close,state:function(){return S;},residents:function(){return residents;},cat:CAT,isOpen:function(){return open;},_setSpeed:function(s){speed=s;}};
})();
window.FreaHouse=House;
