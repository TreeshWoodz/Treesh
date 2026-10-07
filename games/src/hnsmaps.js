/* =====================================================================
   HIDE & SEEK 2.0 — themed hiding worlds + real transformations
   Worlds: Grand Mansion · Haunted House · Moonlit Graveyard · Chef's Kitchen · Toy Room · Grand Library
   · full painted interiors / exteriors (cached, world-aligned)
   · platforms become fixtures that belong in the room (wall shelves, sconces, stone ledges, toy shelves…)
   · every hideable object belongs to the world and is sized relative to a flea (26px)
   · big furniture only on the floor; small objects on shelves
   · hiders transform inside a magic smoke cloud and can keep moving as the object until SEEK starts
   ===================================================================== */
var FreaHnsMaps=(function(){
  var K='frea_hns_map',TAU=Math.PI*2;
  var TH={
    mansion:{name:'Grand Mansion',ico:'🏰',big:['couch','armchair','bookshelf','floorlamp','clock','piano','bigplant','dresser','table','chair','mirror','fireplace'],small:['lamp','plant','vase','candelabra','bookstack','fishbowl','gift']},
    haunted:{name:'Haunted House',ico:'👻',big:['sheetchair','coffin','clock','bookshelf','armchair','mirror','cauldron','piano','sheetchair'],small:['candelabra','pumpkin','skull','bookstack','candle','vase']},
    graveyard:{name:'Moonlit Graveyard',ico:'🪦',big:['tombstone','cross','crypt','deadtree','angel','coffin','tombstone','cross'],small:['pumpkin','lantern','skull','candle']},
    kitchen:{name:"Chef's Kitchen",ico:'🍳',big:['fridge','stove','counter','table','chair','barrel'],small:['pot','jar','plant','cake','fishbowl']},
    toyroom:{name:'Toy Room',ico:'🧸',big:['bed','beanbag','arcade','trampoline','teddy','blocks','easel'],small:['gift','blocks','ball','teddy','fishbowl']},
    library:{name:'Grand Library',ico:'📚',big:['bookshelf','desk','armchair','floorlamp','clock','globe','table','chair'],small:['bookstack','lamp','globe','candle','plant']}
  };
  var KEYS=Object.keys(TH);
  /* sizes in world px (a flea is ~26 x 24) */
  var SZ={couch:[112,48],armchair:[56,54],bookshelf:[64,104],floorlamp:[28,88],clock:[34,96],piano:[100,70],bigplant:[48,82],dresser:[74,58],table:[78,42],chair:[34,54],mirror:[42,84],fireplace:[96,84],
    lamp:[22,34],plant:[30,40],vase:[20,32],candelabra:[30,38],bookstack:[30,26],fishbowl:[28,26],gift:[30,30],sheetchair:[58,62],coffin:[44,100],cauldron:[56,46],pumpkin:[30,26],skull:[22,20],candle:[12,26],
    tombstone:[48,62],cross:[40,74],crypt:[96,106],deadtree:[70,120],angel:[44,92],lantern:[22,40],fridge:[56,102],stove:[60,60],counter:[78,56],barrel:[44,52],pot:[34,22],jar:[18,26],cake:[34,30],
    bed:[116,54],beanbag:[56,40],arcade:[52,90],trampoline:[74,28],teddy:[42,48],blocks:[44,40],easel:[48,80],ball:[28,28],globe:[34,46],desk:[86,54]};
  var EMO={vase:'🏺',candelabra:'🕯️',bookstack:'📚',sheetchair:'👻',coffin:'⚰️',cauldron:'🧪',pumpkin:'🎃',skull:'💀',candle:'🕯️',tombstone:'🪦',cross:'✝️',crypt:'🏛️',deadtree:'🌳',angel:'🗿',lantern:'🏮',
    barrel:'🛢️',pot:'🍲',jar:'🫙',cake:'🎂',teddy:'🧸',blocks:'🧱',ball:'⚽',globe:'🌐',couch:'🛋️',armchair:'💺',bookshelf:'📚',floorlamp:'💡',clock:'🕰️',piano:'🎹',bigplant:'🌿',dresser:'🗄️',table:'🪑',chair:'🪑',
    mirror:'🪞',fireplace:'🔥',fridge:'🧊',stove:'🍳',counter:'🍽️',bed:'🛏️',beanbag:'🫘',arcade:'🕹️',trampoline:'🤸',easel:'🎨',desk:'🖥️',fishbowl:'🐠',gift:'🎁',lamp:'💡',plant:'🪴'};
  try{Object.keys(EMO).forEach(function(k){HNS_EMOJI[k]=EMO[k];});}catch(e){}
  var cur='mansion';
  function pref(){try{var v=localStorage.getItem(K);if(v==='random'||TH[v])return v;}catch(e){}return 'random';}
  function setPref(v){try{localStorage.setItem(K,v);}catch(e){}}
  function on(){return gameMode==='hns'&&STATE!=='title';}
  function hsh(n){var x=Math.sin(n*91.7+17.3)*43758.5453;return x-Math.floor(x);}
  function L(c,a){try{return lighten(c,a);}catch(e){return c;}}function Dk(c,a){try{return darken(c,a);}catch(e){return c;}}
  function vg(c,y0,y1,a,b){var g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
  function rr(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
  function ink(c,w){c.strokeStyle='rgba(20,10,30,.55)';c.lineWidth=w||1.2;c.lineJoin='round';c.stroke();}

  /* ====================== setup hooks ====================== */
  var _setup=setupHideSeek;
  setupHideSeek=function(){var p=pref();cur=p==='random'?KEYS[Math.random()*KEYS.length|0]:p;var t=TH[cur],pool=t.big.concat(t.big,t.small);
    var keep={};Object.keys(HNS_SETS).forEach(function(k){keep[k]=HNS_SETS[k];HNS_SETS[k]=pool;});
    try{_setup.apply(this,arguments);}finally{Object.keys(keep).forEach(function(k){HNS_SETS[k]=keep[k];});}
    hnsTheme=cur;hnsPool=pool;bgCache=null;
    fleas.forEach(function(f){f._objType=null;f._objProp=null;f._morphing=false;});
    try{flash(t.ico+'  '+t.name,'#ffd23d');}catch(e){}};
  var _mp=makeProp;
  makeProp=function(type,cx,gy){if(gameMode!=='hns'||!TH[cur])return _mp(type,cx,gy);var t=TH[cur],floor=gy>=WORLD_H-90;
    if(!SZ[type])type=t.big[0];
    if(!floor&&t.small.indexOf(type)<0)type=t.small[(Math.abs(cx|0)+(gy|0))%t.small.length];
    var d=SZ[type],j=.92+hsh(cx+gy)*.16,w=Math.round(d[0]*j),h=Math.round(d[1]*j);
    var p=new Platform({kind:'rect',x:cx-w/2,y:gy-h,w:w,h:h});p.deco=type;p.decoCol='hsl('+(Math.random()*360|0)+',62%,56%)';return p;};

  /* ====================== custom object art (bottom-anchored in box x,y,w,h) ====================== */
  var C={
    vase:function(c,x,y,w,h,col){c.beginPath();c.moveTo(x+w*.35,y);c.lineTo(x+w*.65,y);c.quadraticCurveTo(x+w*.55,y+h*.18,x+w*.62,y+h*.25);c.quadraticCurveTo(x+w*1.05,y+h*.55,x+w*.7,y+h);c.lineTo(x+w*.3,y+h);c.quadraticCurveTo(x-w*.05,y+h*.55,x+w*.38,y+h*.25);c.quadraticCurveTo(x+w*.45,y+h*.18,x+w*.35,y);c.closePath();c.fillStyle=vg(c,y,y+h,L(col,.35),Dk(col,.35));c.fill();ink(c);c.strokeStyle='rgba(255,215,120,.9)';c.lineWidth=1.4;c.beginPath();c.moveTo(x+w*.12,y+h*.55);c.lineTo(x+w*.88,y+h*.55);c.stroke();c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(x+w*.33,y+h*.5,w*.07,h*.18,0,0,TAU);c.fill();},
    candle:function(c,x,y,w,h,col,t){c.fillStyle=vg(c,y+h*.3,y+h,'#fff6e2','#d9c7a4');rr(c,x+w*.2,y+h*.3,w*.6,h*.7,2);c.fill();ink(c,1);c.fillStyle='#f4e6c8';c.beginPath();c.ellipse(x+w*.75,y+h*.45,1.4,3,0,0,TAU);c.fill();flame(c,x+w/2,y+h*.26,3.2,t);},
    candelabra:function(c,x,y,w,h,col,t){var g='#d8a936';c.fillStyle=g;rr(c,x+w*.3,y+h*.86,w*.4,h*.14,2);c.fill();c.fillRect(x+w*.47,y+h*.45,w*.06,h*.42);c.strokeStyle=g;c.lineWidth=2.4;c.beginPath();c.moveTo(x+w*.12,y+h*.36);c.quadraticCurveTo(x+w*.15,y+h*.6,x+w*.5,y+h*.58);c.quadraticCurveTo(x+w*.85,y+h*.6,x+w*.88,y+h*.36);c.stroke();
      [.12,.5,.88].forEach(function(k,i){var cx=x+w*k,ty=y+h*(i===1?.16:.24);c.fillStyle='#f6ecd6';c.fillRect(cx-2,ty,4,y+h*.38-ty);flame(c,cx,ty-1,2.6,t+i);});},
    bookstack:function(c,x,y,w,h){var cols=['#b8324a','#2f6db0','#d8a936','#3a8a5a','#7a4ab0'],n=4,bh=h/n;for(var i=0;i<n;i++){var o=(i%2?2:-2),bw=w*(.8+((i*37)%5)*.04);c.fillStyle=cols[i%5];rr(c,x+(w-bw)/2+o,y+h-(i+1)*bh,bw,bh-.6,1.5);c.fill();ink(c,.8);c.fillStyle='rgba(255,255,255,.75)';c.fillRect(x+(w-bw)/2+o+bw-4,y+h-(i+1)*bh+1.5,2.5,bh-3.5);c.fillStyle='rgba(255,215,120,.85)';c.fillRect(x+(w-bw)/2+o+3,y+h-(i+.5)*bh-.6,bw*.4,1.2);}},
    sheetchair:function(c,x,y,w,h,col,t){var wv=Math.sin(t*2)*1.5;c.beginPath();c.moveTo(x+w*.2,y+h*.2);c.quadraticCurveTo(x+w*.25,y-h*.02,x+w*.5,y);c.quadraticCurveTo(x+w*.78,y,x+w*.8,y+h*.3);c.lineTo(x+w*.98,y+h*.5);c.quadraticCurveTo(x+w*1.02,y+h*.8,x+w*.96+wv,y+h);for(var i=5;i>=0;i--)c.lineTo(x+w*i/5+(i%2?wv:0),y+h-(i%2?4:0));c.quadraticCurveTo(x-w*.02,y+h*.6,x+w*.2,y+h*.2);c.closePath();c.fillStyle=vg(c,y,y+h,'#f4f2fb','#b9b4cf');c.fill();ink(c);
      c.strokeStyle='rgba(120,110,160,.45)';c.lineWidth=1;[.3,.55,.75].forEach(function(k){c.beginPath();c.moveTo(x+w*k,y+h*.25);c.quadraticCurveTo(x+w*(k+.05),y+h*.6,x+w*k+wv,y+h-3);c.stroke();});},
    coffin:function(c,x,y,w,h){c.beginPath();c.moveTo(x+w*.3,y);c.lineTo(x+w*.7,y);c.lineTo(x+w,y+h*.25);c.lineTo(x+w*.78,y+h);c.lineTo(x+w*.22,y+h);c.lineTo(x,y+h*.25);c.closePath();c.fillStyle=vg(c,y,y+h,'#7a4a2c','#3a2014');c.fill();ink(c,1.4);c.strokeStyle='rgba(255,220,170,.25)';c.lineWidth=1;c.beginPath();c.moveTo(x+w*.33,y+4);c.lineTo(x+w*.67,y+4);c.lineTo(x+w*.92,y+h*.26);c.lineTo(x+w*.73,y+h-4);c.lineTo(x+w*.27,y+h-4);c.lineTo(x+w*.08,y+h*.26);c.closePath();c.stroke();
      c.fillStyle='#d8a936';c.fillRect(x+w*.46,y+h*.2,w*.08,h*.32);c.fillRect(x+w*.34,y+h*.29,w*.32,h*.06);},
    cauldron:function(c,x,y,w,h,col,t){c.fillStyle='#25202e';c.fillRect(x+w*.18,y+h*.82,4,h*.18);c.fillRect(x+w*.78,y+h*.82,4,h*.18);c.beginPath();c.ellipse(x+w/2,y+h*.55,w*.48,h*.38,0,0,TAU);c.fillStyle=vg(c,y+h*.2,y+h,'#4a4458','#141018');c.fill();ink(c);
      c.fillStyle='#39ff7a';c.beginPath();c.ellipse(x+w/2,y+h*.26,w*.4,h*.1,0,0,TAU);c.fill();c.fillStyle='#2a2634';rr(c,x+w*.06,y+h*.2,w*.88,h*.1,4);c.fill();ink(c,1);
      for(var i=0;i<3;i++){var k=(t*.6+i/3)%1;c.globalAlpha=1-k;c.fillStyle='#8affb4';c.beginPath();c.arc(x+w*(.35+i*.15),y+h*.2-k*16,2+k*3,0,TAU);c.fill();}c.globalAlpha=1;},
    pumpkin:function(c,x,y,w,h,col,t){c.fillStyle='#3a8a3a';c.fillRect(x+w*.46,y,w*.1,h*.22);[[.26,.24],[.5,.3],[.74,.24]].forEach(function(q){c.beginPath();c.ellipse(x+w*q[0],y+h*.6,w*q[1],h*.4,0,0,TAU);c.fillStyle=vg(c,y+h*.2,y+h,'#ffad3a','#d0600e');c.fill();ink(c,1);});
      var gl=.6+Math.sin(t*5)*.3;c.fillStyle='rgba(255,230,120,'+gl+')';c.beginPath();c.moveTo(x+w*.3,y+h*.5);c.lineTo(x+w*.38,y+h*.4);c.lineTo(x+w*.44,y+h*.52);c.closePath();c.moveTo(x+w*.56,y+h*.52);c.lineTo(x+w*.62,y+h*.4);c.lineTo(x+w*.7,y+h*.5);c.closePath();c.fill();c.fillRect(x+w*.34,y+h*.7,w*.32,h*.08);},
    skull:function(c,x,y,w,h){c.beginPath();c.ellipse(x+w/2,y+h*.42,w*.48,h*.42,0,0,TAU);c.fillStyle=vg(c,y,y+h,'#fbf6ea','#cfc6b0');c.fill();ink(c,1);rr(c,x+w*.28,y+h*.68,w*.44,h*.32,2);c.fill();ink(c,1);c.fillStyle='#2a1a22';c.beginPath();c.ellipse(x+w*.32,y+h*.42,w*.12,h*.13,0,0,TAU);c.ellipse(x+w*.68,y+h*.42,w*.12,h*.13,0,0,TAU);c.fill();c.fillRect(x+w*.38,y+h*.82,1,h*.18);c.fillRect(x+w*.5,y+h*.82,1,h*.18);c.fillRect(x+w*.62,y+h*.82,1,h*.18);},
    tombstone:function(c,x,y,w,h){c.beginPath();c.moveTo(x+w*.06,y+h);c.lineTo(x+w*.06,y+w*.46);c.arc(x+w/2,y+w*.46,w*.44,Math.PI,0);c.lineTo(x+w*.94,y+h);c.closePath();c.fillStyle=vg(c,y,y+h,'#a8acc0','#5e6278');c.fill();ink(c,1.4);
      c.fillStyle='rgba(30,30,50,.55)';c.font='bold '+Math.round(w*.2)+'px serif';c.textAlign='center';c.fillText('R.I.P',x+w/2,y+h*.48);c.fillRect(x+w*.25,y+h*.58,w*.5,2);c.fillRect(x+w*.3,y+h*.66,w*.4,2);
      c.fillStyle='#4f8a3a';for(var i=0;i<6;i++){c.beginPath();c.ellipse(x+w*(.1+i*.16),y+h-2,4,3,0,0,TAU);c.fill();}c.strokeStyle='rgba(20,20,30,.4)';c.lineWidth=1;c.beginPath();c.moveTo(x+w*.7,y+h*.2);c.lineTo(x+w*.62,y+h*.34);c.lineTo(x+w*.7,y+h*.42);c.stroke();},
    cross:function(c,x,y,w,h){c.fillStyle=vg(c,y,y+h,'#b4b8cc','#62667c');rr(c,x+w*.38,y,w*.24,h*.86,3);c.fill();ink(c,1.2);rr(c,x+w*.08,y+h*.2,w*.84,h*.16,3);c.fill();ink(c,1.2);c.fillStyle='#4a4e64';rr(c,x+w*.2,y+h*.84,w*.6,h*.16,3);c.fill();ink(c,1);c.fillStyle='#5a9a44';c.beginPath();c.ellipse(x+w*.45,y+h*.5,3,6,.3,0,TAU);c.fill();},
    crypt:function(c,x,y,w,h){c.fillStyle=vg(c,y,y+h,'#9da2b8','#4e5268');c.fillRect(x+w*.08,y+h*.34,w*.84,h*.66);ink(c,1.4);c.beginPath();c.moveTo(x,y+h*.36);c.lineTo(x+w/2,y+h*.06);c.lineTo(x+w,y+h*.36);c.closePath();c.fillStyle='#6e7288';c.fill();ink(c,1.4);
      [.16,.78].forEach(function(k){c.fillStyle='#c4c8da';c.fillRect(x+w*k,y+h*.38,w*.08,h*.62);});c.fillStyle='#14121e';c.beginPath();c.moveTo(x+w*.34,y+h);c.lineTo(x+w*.34,y+h*.6);c.arc(x+w/2,y+h*.6,w*.16,Math.PI,0);c.lineTo(x+w*.66,y+h);c.closePath();c.fill();c.fillStyle='#d8a936';c.fillRect(x+w*.47,y+h*.16,w*.06,h*.12);c.fillRect(x+w*.44,y+h*.19,w*.12,h*.03);},
    deadtree:function(c,x,y,w,h){c.strokeStyle='#2a1c18';c.lineCap='round';function br(x0,y0,a,l,wd,d){if(d>4||l<4)return;var x1=x0+Math.cos(a)*l,y1=y0+Math.sin(a)*l;c.lineWidth=wd;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();br(x1,y1,a-.5,l*.7,wd*.65,d+1);br(x1,y1,a+.45,l*.62,wd*.6,d+1);}
      c.fillStyle=vg(c,y+h*.3,y+h,'#4a3428','#22160f');c.beginPath();c.moveTo(x+w*.4,y+h);c.quadraticCurveTo(x+w*.44,y+h*.6,x+w*.46,y+h*.35);c.lineTo(x+w*.56,y+h*.35);c.quadraticCurveTo(x+w*.58,y+h*.6,x+w*.64,y+h);c.closePath();c.fill();ink(c,1.2);br(x+w*.51,y+h*.38,-Math.PI/2,h*.24,5,0);},
    angel:function(c,x,y,w,h){var s='#b8bccd';c.fillStyle='#6e7288';rr(c,x+w*.18,y+h*.82,w*.64,h*.18,3);c.fill();ink(c,1);c.fillStyle=vg(c,y,y+h,'#d8dcec',s);[-1,1].forEach(function(d){c.beginPath();c.ellipse(x+w*(.5+d*.28),y+h*.36,w*.26,h*.17,d*.5,0,TAU);c.fill();ink(c,1);});
      c.beginPath();c.moveTo(x+w*.36,y+h*.82);c.quadraticCurveTo(x+w*.3,y+h*.4,x+w*.5,y+h*.26);c.quadraticCurveTo(x+w*.7,y+h*.4,x+w*.64,y+h*.82);c.closePath();c.fill();ink(c,1);c.beginPath();c.arc(x+w/2,y+h*.18,w*.14,0,TAU);c.fill();ink(c,1);c.strokeStyle='rgba(255,230,140,.7)';c.lineWidth=1.4;c.beginPath();c.ellipse(x+w/2,y+h*.04,w*.14,2.4,0,0,TAU);c.stroke();},
    lantern:function(c,x,y,w,h,col,t){c.strokeStyle='#2a2830';c.lineWidth=1.5;c.beginPath();c.arc(x+w/2,y+4,4,Math.PI,0);c.stroke();c.fillStyle='#2a2830';rr(c,x+w*.1,y+h*.16,w*.8,h*.1,2);c.fill();rr(c,x+w*.1,y+h*.86,w*.8,h*.14,2);c.fill();
      var gl=.75+Math.sin(t*7)*.15;c.fillStyle='rgba(255,196,90,'+gl+')';rr(c,x+w*.2,y+h*.26,w*.6,h*.6,2);c.fill();c.strokeStyle='#2a2830';c.lineWidth=1.2;c.strokeRect(x+w*.2,y+h*.26,w*.6,h*.6);c.beginPath();c.moveTo(x+w/2,y+h*.26);c.lineTo(x+w/2,y+h*.86);c.stroke();c.save();c.shadowColor='#ffb84a';c.shadowBlur=14;flame(c,x+w/2,y+h*.62,3,t);c.restore();},
    barrel:function(c,x,y,w,h){c.beginPath();c.moveTo(x+w*.1,y);c.quadraticCurveTo(x-w*.04,y+h/2,x+w*.1,y+h);c.lineTo(x+w*.9,y+h);c.quadraticCurveTo(x+w*1.04,y+h/2,x+w*.9,y);c.closePath();c.fillStyle=vg(c,y,y+h,'#b0743e','#6a3e1c');c.fill();ink(c,1.2);c.strokeStyle='#3a3a44';c.lineWidth=2.2;[.18,.82].forEach(function(k){c.beginPath();c.moveTo(x+w*.04,y+h*k);c.lineTo(x+w*.96,y+h*k);c.stroke();});c.strokeStyle='rgba(40,20,10,.35)';c.lineWidth=1;[.3,.5,.7].forEach(function(k){c.beginPath();c.moveTo(x+w*k,y+1);c.lineTo(x+w*k,y+h-1);c.stroke();});},
    pot:function(c,x,y,w,h){c.fillStyle=vg(c,y,y+h,'#c8ccd8','#6a6e80');rr(c,x+w*.1,y+h*.25,w*.8,h*.75,4);c.fill();ink(c,1);c.fillStyle='#4a4e60';rr(c,x+w*.04,y+h*.12,w*.92,h*.16,3);c.fill();c.fillRect(x+w*.44,y,w*.12,h*.14);c.fillRect(x-2,y+h*.4,w*.12,3);c.fillRect(x+w*.9,y+h*.4,w*.12,3);c.fillStyle='rgba(255,255,255,.4)';c.fillRect(x+w*.2,y+h*.35,w*.08,h*.5);},
    jar:function(c,x,y,w,h,col){c.fillStyle='rgba(210,235,255,.55)';rr(c,x+1,y+h*.2,w-2,h*.8,4);c.fill();ink(c,1);c.fillStyle=col;rr(c,x+3,y+h*.45,w-6,h*.5,3);c.fill();c.fillStyle='#d8a936';rr(c,x+2,y+h*.06,w-4,h*.16,2);c.fill();ink(c,.8);c.fillStyle='rgba(255,255,255,.6)';c.fillRect(x+4,y+h*.3,2,h*.5);},
    cake:function(c,x,y,w,h,col,t){c.fillStyle=vg(c,y+h*.4,y+h,'#ffe6f0','#f0b4cc');rr(c,x+w*.06,y+h*.4,w*.88,h*.6,4);c.fill();ink(c,1);c.fillStyle='#ff5f9a';c.beginPath();c.moveTo(x+w*.06,y+h*.48);for(var i=0;i<=8;i++)c.quadraticCurveTo(x+w*(.06+i*.11-.055),y+h*.62,x+w*(.06+i*.11),y+h*.48);c.lineTo(x+w*.94,y+h*.4);c.lineTo(x+w*.06,y+h*.4);c.closePath();c.fill();c.fillStyle='#fff';c.fillRect(x+w*.46,y+h*.14,w*.08,h*.26);flame(c,x+w/2,y+h*.12,2.6,t);},
    teddy:function(c,x,y,w,h){var b='#c4884e',d='#8a5a2c';function e(cx,cy,rx,ry,col){c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,TAU);c.fillStyle=col;c.fill();ink(c,1);}e(x+w*.22,y+h*.16,w*.13,w*.13,b);e(x+w*.78,y+h*.16,w*.13,w*.13,b);e(x+w*.5,y+h*.72,w*.4,h*.28,b);e(x+w*.5,y+h*.32,w*.32,h*.26,b);e(x+w*.5,y+h*.4,w*.13,h*.09,'#f0d0a8');
      c.fillStyle='#1a1018';c.beginPath();c.arc(x+w*.38,y+h*.28,1.8,0,TAU);c.arc(x+w*.62,y+h*.28,1.8,0,TAU);c.fill();c.beginPath();c.ellipse(x+w*.5,y+h*.37,2.2,1.5,0,0,TAU);c.fill();c.fillStyle='#ff5f9a';c.beginPath();c.moveTo(x+w*.5,y+h*.52);c.lineTo(x+w*.36,y+h*.46);c.lineTo(x+w*.36,y+h*.58);c.closePath();c.moveTo(x+w*.5,y+h*.52);c.lineTo(x+w*.64,y+h*.46);c.lineTo(x+w*.64,y+h*.58);c.closePath();c.fill();e(x+w*.22,y+h*.9,w*.14,h*.09,d);e(x+w*.78,y+h*.9,w*.14,h*.09,d);},
    blocks:function(c,x,y,w,h){var cols=['#ff4d6a','#2de2ff','#ffd23d','#39d36a'],L2=['A','B','C','D'],s=Math.min(w/2,h/2);[[0,h-s],[s,h-s],[s*.5,h-2*s]].forEach(function(q,i){c.fillStyle=vg(c,y+q[1],y+q[1]+s,L(cols[i],.25),Dk(cols[i],.2));rr(c,x+q[0]+1,y+q[1]+1,s-2,s-2,3);c.fill();ink(c,1);c.fillStyle='#fff';c.font='bold '+Math.round(s*.55)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(L2[i],x+q[0]+s/2,y+q[1]+s/2+1);});},
    ball:function(c,x,y,w,h){var r=Math.min(w,h)/2,cx=x+w/2,cy=y+h-r;var g=c.createRadialGradient(cx-r*.4,cy-r*.4,1,cx,cy,r);g.addColorStop(0,'#fff');g.addColorStop(1,'#d8dce8');c.fillStyle=g;c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();ink(c,1);c.fillStyle='#ff3d6a';c.beginPath();c.arc(cx,cy,r,-.6,.6);c.lineTo(cx,cy);c.fill();c.fillStyle='#2d8aff';c.beginPath();c.arc(cx,cy,r,2.5,3.7);c.lineTo(cx,cy);c.fill();c.beginPath();c.arc(cx,cy,r,0,TAU);ink(c,1);},
    globe:function(c,x,y,w,h){c.fillStyle='#6a4a2c';rr(c,x+w*.2,y+h*.88,w*.6,h*.12,3);c.fill();c.fillRect(x+w*.47,y+h*.68,w*.06,h*.22);var r=w*.4,cx=x+w/2,cy=y+h*.4;var g=c.createRadialGradient(cx-r*.4,cy-r*.4,1,cx,cy,r);g.addColorStop(0,'#8ad8ff');g.addColorStop(1,'#2a6ab0');c.fillStyle=g;c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();
      c.fillStyle='#5ac86a';c.beginPath();c.ellipse(cx-r*.3,cy-r*.2,r*.32,r*.22,.5,0,TAU);c.ellipse(cx+r*.3,cy+r*.3,r*.25,r*.3,-.3,0,TAU);c.fill();c.beginPath();c.arc(cx,cy,r,0,TAU);ink(c,1);c.strokeStyle='#d8a936';c.lineWidth=1.6;c.beginPath();c.arc(cx,cy,r+2.5,-2.2,1.2);c.stroke();}
  };
  function flame(c,x,y,s,t){var f=1+Math.sin((t||0)*14+x)*.12;c.save();c.translate(x,y);c.scale(1,f);var g=c.createRadialGradient(0,-s*.3,.2,0,0,s*1.6);g.addColorStop(0,'#fffbe0');g.addColorStop(.5,'#ffc23d');g.addColorStop(1,'rgba(255,120,30,0)');c.fillStyle=g;c.beginPath();c.moveTo(0,-s*1.8);c.quadraticCurveTo(s,-s*.2,0,s*.5);c.quadraticCurveTo(-s,-s*.2,0,-s*1.8);c.fill();c.restore();}
  function web(c,x,y,s,flip){c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.strokeStyle='rgba(230,230,250,.45)';c.lineWidth=.7;for(var a=0;a<=4;a++){var an=a/4*Math.PI/2;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(an)*s,Math.sin(an)*s);c.stroke();}for(var r=.3;r<=1;r+=.23){c.beginPath();for(var b=0;b<=4;b++){var an2=b/4*Math.PI/2,px=Math.cos(an2)*s*r,py=Math.sin(an2)*s*r;if(!b)c.moveTo(px,py);else c.quadraticCurveTo(Math.cos(an2-.2)*s*r*.85,Math.sin(an2-.2)*s*r*.85,px,py);}c.stroke();}c.restore();}
  var _dd=drawDeco;
  drawDeco=function(p,cx,cy){if(p&&C[p.deco]){var t=performance.now()/1000;ctx.save();ctx.lineJoin='round';
      ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(p.bx-cx+p.bw/2,p.by-cy+p.bh,p.bw*.5,3,0,0,TAU);ctx.fill();
      try{C[p.deco](ctx,p.bx-cx,p.by-cy,p.bw,p.bh,/^#/.test(p.decoCol||'')?p.decoCol:'#c05a8a',t);}catch(e){}ctx.restore();return;}
    _dd.apply(this,arguments);
    if(p&&gameMode==='hns'&&cur==='haunted'&&p.deco&&p.bh>40){ctx.save();web(ctx,p.bx-cx+p.bw-1,p.by-cy+1,Math.min(16,p.bw*.4),true);ctx.restore();}};
  /* HSL decoCol → hex-ish fallback for custom art */
  var _mp2=makeProp;makeProp=function(){var p=_mp2.apply(this,arguments);if(p&&C[p.deco]){var hue=Math.random()*360|0;p.decoCol=hslHex(hue,.6,.55);}return p;};
  function hslHex(h,s,l){var k=function(n){return (n+h/30)%12;},a=s*Math.min(l,1-l),f=function(n){return l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));};return '#'+[f(0),f(8),f(4)].map(function(v){return ('0'+Math.round(v*255).toString(16)).slice(-2);}).join('');}

  /* ====================== world background (cached, world-aligned) ====================== */
  var bgCache=null,SC=.5;
  var BGPAL={mansion:{wall:'#5a2238',wall2:'#7a2e4a',pat:'rgba(255,210,140,.10)',wood:'#4a2a1a',trim:'#d8a936',glow:'rgba(255,200,120,.20)'},
    haunted:{wall:'#2a2238',wall2:'#3a2e4a',pat:'rgba(200,190,255,.07)',wood:'#2a1e22',trim:'#6a5a7a',glow:'rgba(140,255,200,.10)'},
    kitchen:{wall:'#e8eef4',wall2:'#cfdbe6',pat:'rgba(120,150,180,.25)',wood:'#8a5a34',trim:'#ffffff',glow:'rgba(255,240,200,.25)'},
    toyroom:{wall:'#ffd6e8',wall2:'#c8e4ff',pat:'rgba(255,255,255,.5)',wood:'#ff9ac8',trim:'#ffffff',glow:'rgba(255,255,220,.2)'},
    library:{wall:'#3a2418',wall2:'#4a3020',pat:'rgba(255,210,140,.08)',wood:'#2a170e',trim:'#c89a3a',glow:'rgba(255,200,120,.18)'}};
  function buildBG(){var Wd=WORLD_W,Hd=WORLD_H,cv=document.createElement('canvas');cv.width=Math.ceil(Wd*SC);cv.height=Math.ceil(Hd*SC);var c=cv.getContext('2d');c.scale(SC,SC);var fy=Hd-60;
    if(cur==='graveyard'){c.fillStyle=vg(c,0,fy,'#0a0c24','#2a2a52');c.fillRect(0,0,Wd,Hd);for(var i=0;i<220;i++){c.fillStyle='rgba(255,255,255,'+(.3+hsh(i)*.6)+')';c.fillRect(hsh(i*3)*Wd,hsh(i*7)*fy*.7,1.6,1.6);}
      var mx=Wd*.72,my=fy*.22;var mg=c.createRadialGradient(mx,my,10,mx,my,220);mg.addColorStop(0,'rgba(220,230,255,.35)');mg.addColorStop(1,'rgba(220,230,255,0)');c.fillStyle=mg;c.fillRect(mx-240,my-240,480,480);c.fillStyle='#eef0ff';c.beginPath();c.arc(mx,my,70,0,TAU);c.fill();c.fillStyle='rgba(180,190,220,.5)';[[-20,-15,14],[22,10,10],[-5,28,8]].forEach(function(q){c.beginPath();c.arc(mx+q[0],my+q[1],q[2],0,TAU);c.fill();});
      [[.62,'#1a1a3a',220],[.78,'#14142c',140]].forEach(function(l,li){c.fillStyle=l[1];c.beginPath();c.moveTo(0,fy);for(var x=0;x<=Wd;x+=40)c.lineTo(x,fy-l[2]*(.5+.5*Math.sin(x*.004+li*2))*.6-40);c.lineTo(Wd,fy);c.closePath();c.fill();});
      c.fillStyle='#10102a';var chx=Wd*.3;c.fillRect(chx,fy-330,160,330);c.beginPath();c.moveTo(chx-10,fy-330);c.lineTo(chx+80,fy-420);c.lineTo(chx+170,fy-330);c.fill();c.fillRect(chx+60,fy-560,40,160);c.beginPath();c.moveTo(chx+50,fy-560);c.lineTo(chx+80,fy-620);c.lineTo(chx+110,fy-560);c.fill();c.fillStyle='rgba(255,200,90,.6)';c.fillRect(chx+70,fy-260,20,40);
      for(var t=0;t<7;t++){var tx=hsh(t+40)*Wd,th=180+hsh(t)*160;c.strokeStyle='#0c0c20';c.lineCap='round';(function br(x0,y0,a,l,w,d){if(d>5)return;var x1=x0+Math.cos(a)*l,y1=y0+Math.sin(a)*l;c.lineWidth=w;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();br(x1,y1,a-.45,l*.68,w*.62,d+1);br(x1,y1,a+.5,l*.6,w*.6,d+1);})(tx,fy,-Math.PI/2,th*.45,14,0);}
      c.strokeStyle='#08081a';c.lineWidth=4;for(var fx=0;fx<Wd;fx+=26){c.beginPath();c.moveTo(fx,fy);c.lineTo(fx,fy-70);c.stroke();c.fillStyle='#08081a';c.beginPath();c.moveTo(fx-5,fy-70);c.lineTo(fx,fy-82);c.lineTo(fx+5,fy-70);c.fill();}c.fillRect(0,fy-58,Wd,5);c.fillRect(0,fy-22,Wd,5);
      return cv;}
    var P=BGPAL[cur]||BGPAL.mansion,wainH=Math.min(170,fy*.22);
    c.fillStyle=vg(c,0,fy,P.wall2,P.wall);c.fillRect(0,0,Wd,Hd);
    if(cur==='kitchen'){c.strokeStyle=P.pat;c.lineWidth=2;for(var y=fy-wainH-260;y<fy;y+=22){c.beginPath();c.moveTo(0,y);c.lineTo(Wd,y);c.stroke();for(var x=((y/22)%2)*24;x<Wd;x+=48){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+22);c.stroke();}}}
    else if(cur==='toyroom'){for(var s=0;s<160;s++){var sx=hsh(s)*Wd,sy=hsh(s*5)*(fy-wainH);c.fillStyle=['rgba(255,255,255,.55)','rgba(255,210,61,.45)','rgba(45,226,255,.35)'][s%3];c.save();c.translate(sx,sy);c.rotate(s);c.beginPath();for(var k=0;k<10;k++){var a=k*Math.PI/5,r=k%2?5:12;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.fill();c.restore();}
      var rx=Wd*.5,ry=fy-wainH-40;['#ff4d6a','#ffad3a','#ffd23d','#39d36a','#2de2ff','#9b6bff'].forEach(function(col,i){c.strokeStyle=col;c.globalAlpha=.35;c.lineWidth=26;c.beginPath();c.arc(rx,ry,420-i*26,Math.PI,0);c.stroke();});c.globalAlpha=1;}
    else if(cur==='library'){var sw=150;for(var bx=40;bx<Wd-sw;bx+=sw+40){c.fillStyle='#24140a';c.fillRect(bx,120,sw,fy-wainH-120);for(var sy2=140;sy2<fy-wainH-30;sy2+=64){c.fillStyle='#3a2414';c.fillRect(bx,sy2+52,sw,8);for(var b=bx+6;b<bx+sw-8;){var bw=7+hsh(b+sy2)*9,bh=34+hsh(b*3+sy2)*16;c.fillStyle=['#8a2a3a','#2a4a8a','#c89a3a','#2a6a4a','#5a3a7a','#a4542a'][(b*7+sy2|0)%6];c.fillRect(b,sy2+52-bh,bw-1.4,bh);c.fillStyle='rgba(255,215,120,.5)';c.fillRect(b+1,sy2+52-bh+6,bw-3.4,2);b+=bw;}}c.strokeStyle=P.trim;c.lineWidth=3;c.strokeRect(bx,120,sw,fy-wainH-120);}}
    else{for(var py=30;py<fy-wainH;py+=70)for(var px=((py/70)%2)*45;px<Wd;px+=90){c.fillStyle=P.pat;c.save();c.translate(px,py);c.beginPath();c.moveTo(0,-18);c.quadraticCurveTo(12,-6,0,18);c.quadraticCurveTo(-12,-6,0,-18);c.fill();c.beginPath();c.arc(0,-24,4,0,TAU);c.fill();c.restore();}
      if(cur==='haunted'){for(var tp=0;tp<14;tp++){var tx2=hsh(tp+9)*Wd,ty2=hsh(tp+3)*(fy-wainH-160)+60;c.fillStyle='rgba(10,8,16,.35)';c.beginPath();c.moveTo(tx2,ty2);for(var q=0;q<7;q++)c.lineTo(tx2+30+hsh(q+tp)*60*(q%2?1:.6),ty2+q*14);c.lineTo(tx2,ty2+100);c.fill();}}}
    /* crown molding */
    c.fillStyle=P.wood;c.fillRect(0,0,Wd,26);c.fillStyle=P.trim;c.fillRect(0,26,Wd,4);
    /* windows / paintings / chandeliers along the wall */
    var step=Math.max(520,Wd/6);for(var wx=step*.5;wx<Wd-80;wx+=step){var i2=Math.round(wx/step),top=fy-wainH-360;
      if(i2%2===0&&cur!=='library'){var ww=120,wh=Math.min(300,fy-wainH-140);top=fy-wainH-wh-60;c.fillStyle=cur==='kitchen'||cur==='toyroom'?vg(c,top,top+wh,'#8ad0ff','#d8f0ff'):vg(c,top,top+wh,'#0c1030','#2a2a5a');c.fillRect(wx-ww/2,top,ww,wh);
        if(cur==='haunted'||cur==='mansion'||cur==='library'){c.fillStyle='rgba(235,240,255,.85)';c.beginPath();c.arc(wx+20,top+50,18,0,TAU);c.fill();}
        c.strokeStyle=P.trim;c.lineWidth=6;c.strokeRect(wx-ww/2,top,ww,wh);c.lineWidth=3;c.beginPath();c.moveTo(wx,top);c.lineTo(wx,top+wh);c.moveTo(wx-ww/2,top+wh*.45);c.lineTo(wx+ww/2,top+wh*.45);c.stroke();
        if(cur==='haunted'){c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=1;c.beginPath();c.moveTo(wx-30,top+20);c.lineTo(wx-10,top+60);c.lineTo(wx-36,top+90);c.stroke();}
        var cc=cur==='toyroom'?'#9b6bff':cur==='kitchen'?'#ff8a5a':cur==='haunted'?'#3a2a4a':'#8a1a2a';c.fillStyle=cc;[-1,1].forEach(function(d){c.beginPath();c.moveTo(wx+d*(ww/2+30),top-20);c.quadraticCurveTo(wx+d*(ww/2-6),top+wh*.5,wx+d*(ww/2+18),top+wh+20);c.lineTo(wx+d*(ww/2+42),top+wh+20);c.lineTo(wx+d*(ww/2+42),top-20);c.closePath();c.fill();});c.fillStyle=P.trim;c.fillRect(wx-ww/2-50,top-26,ww+100,8);}
      else if(cur!=='kitchen'){var fw=110,fh=140,fy2=fy-wainH-fh-90;c.fillStyle=P.trim;c.fillRect(wx-fw/2-8,fy2-8,fw+16,fh+16);c.fillStyle=cur==='toyroom'?'#fff':'#2a2030';c.fillRect(wx-fw/2,fy2,fw,fh);
        c.fillStyle=cur==='toyroom'?'#ffd23d':'#d8b890';c.beginPath();c.ellipse(wx,fy2+fh*.42,fw*.24,fh*.26,0,0,TAU);c.fill();c.fillStyle=cur==='toyroom'?'#ff4d6a':'#3a2a2a';c.fillRect(wx-fw*.32,fy2+fh*.68,fw*.64,fh*.32);if(cur==='haunted'){c.fillStyle='#8affb4';c.fillRect(wx-12,fy2+fh*.38,6,3);c.fillRect(wx+6,fy2+fh*.38,6,3);}}
      if(cur==='mansion'||cur==='haunted'||cur==='library'){var chx2=wx+step/2;if(chx2<Wd-60){c.strokeStyle=P.trim;c.lineWidth=2;c.beginPath();c.moveTo(chx2,30);c.lineTo(chx2,110);c.stroke();c.beginPath();c.ellipse(chx2,118,60,14,0,0,Math.PI);c.stroke();for(var k2=-2;k2<=2;k2++){c.fillStyle='#f4ead6';c.fillRect(chx2+k2*26-2,104,4,12);var g2=c.createRadialGradient(chx2+k2*26,100,1,chx2+k2*26,100,cur==='haunted'?18:36);g2.addColorStop(0,cur==='haunted'?'rgba(140,255,200,.6)':'rgba(255,220,140,.7)');g2.addColorStop(1,'rgba(255,220,140,0)');c.fillStyle=g2;c.fillRect(chx2+k2*26-40,60,80,80);}
        var g3=c.createRadialGradient(chx2,140,10,chx2,140,320);g3.addColorStop(0,P.glow);g3.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g3;c.fillRect(chx2-320,0,640,520);}}}
    /* wainscot paneling */
    var wy=fy-wainH;c.fillStyle=cur==='kitchen'?'#7a8ea4':cur==='toyroom'?'#ffffff':P.wood;c.fillRect(0,wy,Wd,wainH);c.fillStyle=P.trim;c.fillRect(0,wy-6,Wd,8);
    for(var pnx=20;pnx<Wd-60;pnx+=110){c.strokeStyle=cur==='toyroom'?'rgba(255,154,200,.5)':'rgba(0,0,0,.28)';c.lineWidth=3;c.strokeRect(pnx,wy+20,90,wainH-40);c.strokeStyle='rgba(255,255,255,.08)';c.lineWidth=1;c.strokeRect(pnx+4,wy+24,82,wainH-48);}
    if(cur==='haunted'){[[0,30,1],[Wd,30,-1]].forEach(function(q){web(c,q[0],q[1],140,q[2]<0);});}
    var vg2=c.createRadialGradient(Wd/2,fy/2,fy*.3,Wd/2,fy/2,Wd*.7);vg2.addColorStop(0,'rgba(0,0,0,0)');vg2.addColorStop(1,cur==='toyroom'||cur==='kitchen'?'rgba(80,40,80,.12)':'rgba(0,0,0,.4)');c.fillStyle=vg2;c.fillRect(0,0,Wd,Hd);
    return cv;}
  var _bg=drawBG;
  drawBG=function(){if(!on())return _bg.apply(this,arguments);if(!bgCache||bgCache._t!==cur||bgCache._w!==WORLD_W||bgCache._h!==WORLD_H){bgCache=buildBG();bgCache._t=cur;bgCache._w=WORLD_W;bgCache._h=WORLD_H;}
    ctx.fillStyle='#0a0a18';ctx.fillRect(0,0,W,H);ctx.drawImage(bgCache,camera.x*SC,camera.y*SC,W*SC,H*SC,0,0,W,H);
    var t=performance.now()/1000;if(cur==='haunted'||cur==='graveyard'){ctx.save();for(var i=0;i<4;i++){var fx=((t*14*(i%2?1:-1)+i*400)%(W+600))-300;var g=ctx.createRadialGradient(fx,WORLD_H-90-camera.y,10,fx,WORLD_H-90-camera.y,320);g.addColorStop(0,cur==='graveyard'?'rgba(170,190,230,.22)':'rgba(150,255,210,.12)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(fx-320,WORLD_H-420-camera.y,640,420);}ctx.restore();}
    else{ctx.save();for(var d=0;d<26;d++){var x=(hsh(d)*W+t*6*(d%3+1))%W,y=(hsh(d*4)*H+Math.sin(t+d)*12);ctx.fillStyle='rgba(255,240,200,'+(.12+.1*Math.sin(t*2+d))+')';ctx.beginPath();ctx.arc(x,y,1.3,0,TAU);ctx.fill();}ctx.restore();}};

  /* ====================== platforms → fixtures that belong in the room ====================== */
  var FIX={mansion:{top:'#6a3a22',face:'#4a2614',trim:'#d8a936'},haunted:{top:'#4a3a40',face:'#2a2026',trim:'#7a6a8a'},graveyard:{top:'#8a8ea4',face:'#5a5e74',trim:'#4f8a3a'},kitchen:{top:'#ffffff',face:'#c8d4e0',trim:'#8a5a34'},toyroom:{top:'#ffd23d',face:'#ff9ac8',trim:'#2de2ff'},library:{top:'#5a3a22',face:'#3a2414',trim:'#c89a3a'}};
  function fixSprite(p){var key=cur+':'+p.kind+':'+(p.bw|0)+'x'+(p.bh|0);if(p._fx&&p._fx.k===key)return p._fx;var pad=40,cw=Math.ceil(p.bw+pad*2),ch=Math.ceil(p.bh+pad*2+30),cv=document.createElement('canvas');cv.width=cw;cv.height=ch;var c=cv.getContext('2d'),F=FIX[cur]||FIX.mansion,x=pad,y=pad,w=p.bw,h=p.bh,seed=(p.bw*7+p.bh*13)|0;
    if(p.kind==='circle'){var r=p.r||w/2,cx=x+w/2,cy=y+h/2;if(cur==='graveyard'){c.fillStyle=vg(c,cy-r,cy+r,'#a0a4b8','#4e5268');c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();ink(c,1.4);c.strokeStyle='rgba(30,30,50,.5)';c.lineWidth=Math.max(2,r*.12);c.beginPath();c.arc(cx,cy,r*.62,0,TAU);c.stroke();c.lineWidth=Math.max(2,r*.16);c.beginPath();c.moveTo(cx,cy-r*.92);c.lineTo(cx,cy+r*.92);c.moveTo(cx-r*.92,cy);c.lineTo(cx+r*.92,cy);c.stroke();c.fillStyle='rgba(200,205,225,.35)';c.beginPath();c.arc(cx-r*.35,cy-r*.4,r*.18,0,TAU);c.fill();c.fillStyle='#4f8a3a';for(var mm=0;mm<5;mm++){c.beginPath();c.ellipse(cx+Math.cos(1+mm*.4)*r*.92,cy+Math.sin(1+mm*.4)*r*.92,4,2.6,mm,0,TAU);c.fill();}}
      else{c.fillStyle=F.trim;c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();c.fillStyle=cur==='haunted'?vg(c,cy-r,cy+r,'#d8d0b8','#9a9078'):'#f6f0e2';c.beginPath();c.arc(cx,cy,r*.84,0,TAU);c.fill();ink(c,1.2);if(cur==='haunted'){c.strokeStyle='rgba(40,30,30,.45)';c.lineWidth=1;c.beginPath();c.moveTo(cx-r*.5,cy-r*.3);c.lineTo(cx-r*.1,cy+r*.1);c.lineTo(cx-r*.3,cy+r*.5);c.stroke();}c.strokeStyle='#2a1a1a';c.lineWidth=2;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx,cy-r*.6);c.moveTo(cx,cy);c.lineTo(cx+r*.4,cy+r*.1);c.stroke();for(var k=0;k<12;k++){var a=k/12*TAU;c.fillStyle='#2a1a1a';c.fillRect(cx+Math.cos(a)*r*.7-1,cy+Math.sin(a)*r*.7-1,2,2);}}}
    else if(w<70&&h>=34){if(cur==='graveyard')cabinet(c,x,y,w,h,F,seed);else pillar(c,x,y,w,h,F,seed);}
    else if(w<70){/* wall sconce / lantern bracket: the platform is its cap */
      c.fillStyle=vg(c,y,y+h,L(F.trim,.3),Dk(F.trim,.3));rr(c,x,y,w,h,Math.min(6,h/2));c.fill();ink(c,1.2);c.fillStyle=Dk(F.trim,.35);c.beginPath();c.moveTo(x+w*.3,y+h);c.quadraticCurveTo(x+w/2,y+h+26,x+w*.7,y+h);c.closePath();c.fill();
      if(cur==='toyroom'||cur==='kitchen'){c.fillStyle=F.face;rr(c,x+3,y+h,w-6,10,3);c.fill();}else{c.fillStyle='rgba(255,215,140,.6)';c.beginPath();c.arc(x+w/2,y+h+16,4,0,TAU);c.fill();}}
    else if(h>=34){cabinet(c,x,y,w,h,F,seed);}
    else{/* wall shelf */
      c.fillStyle=F.face;rr(c,x,y+h*.35,w,h*.65,3);c.fill();c.fillStyle=vg(c,y,y+h*.45,L(F.top,.25),F.top);rr(c,x-2,y,w+4,h*.45,3);c.fill();rr(c,x-2,y,w+4,h,3);ink(c,1.2);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(x+3,y+1.5,w-6,1.6);
      if(cur==='graveyard'){c.fillStyle='rgba(79,138,58,.8)';for(var m=0;m<w;m+=9){c.beginPath();c.ellipse(x+m,y+1,5,3,0,0,TAU);c.fill();}c.strokeStyle='rgba(20,20,30,.35)';c.lineWidth=1;for(var s2=1;s2<w/40;s2++){c.beginPath();c.moveTo(x+s2*40,y+2);c.lineTo(x+s2*40,y+h-1);c.stroke();}}
      else{c.fillStyle=F.trim;[x+10,x+w-14].forEach(function(bx){c.beginPath();c.moveTo(bx,y+h);c.lineTo(bx+4,y+h);c.lineTo(bx+4,y+h+16);c.quadraticCurveTo(bx+2,y+h+4,bx-8,y+h+2);c.closePath();c.fill();});
        if(cur==='kitchen'){for(var mg=x+26;mg<x+w-30;mg+=22){c.strokeStyle='#8a5a34';c.lineWidth=1;c.beginPath();c.moveTo(mg,y+h);c.lineTo(mg,y+h+5);c.stroke();c.fillStyle=['#ff6a5a','#2de2ff','#ffd23d'][(mg/22|0)%3];rr(c,mg-5,y+h+5,10,10,2);c.fill();ink(c,.8);}}
        if(cur==='haunted'){web(c,x+w,y+h,22,true);c.fillStyle='rgba(240,236,220,.85)';c.fillRect(x+w*.4,y+h,3,6+(seed%5));c.fillRect(x+w*.62,y+h,2,4);}
        if(cur==='toyroom'){for(var d2=x+8;d2<x+w-8;d2+=14){c.fillStyle=['#ff4d6a','#2de2ff','#39d36a'][(d2/14|0)%3];c.beginPath();c.arc(d2,y+h*.7,2.4,0,TAU);c.fill();}}
        if(cur==='library'||cur==='mansion'){c.strokeStyle='rgba(255,215,140,.35)';c.lineWidth=1;c.beginPath();c.moveTo(x+4,y+h*.72);c.lineTo(x+w-4,y+h*.72);c.stroke();}}}
    p._fx={k:key,cv:cv,ox:pad,oy:pad};return p._fx;}
  /* tall platforms become wall cabinets / display cases / crypt walls that belong to the room */
  function cabinet(c,x,y,w,h,F,seed){var R=function(n){return hsh(seed+n);};
    if(cur==='graveyard'){c.fillStyle=vg(c,y,y+h,'#8a8ea4','#4a4e62');rr(c,x,y,w,h,4);c.fill();ink(c,1.4);
      c.strokeStyle='rgba(20,20,36,.35)';c.lineWidth=1;for(var by=y+12,row=0;by<y+h;by+=12,row++){c.beginPath();c.moveTo(x+2,by);c.lineTo(x+w-2,by);c.stroke();for(var bx=x+(row%2?14:0);bx<x+w;bx+=28){c.beginPath();c.moveTo(bx,by-12);c.lineTo(bx,by);c.stroke();}}
      c.fillStyle='#2a2a3e';c.beginPath();c.moveTo(x+w/2-12,y+h);c.lineTo(x+w/2-12,y+h*.45);c.arc(x+w/2,y+h*.45,12,Math.PI,0);c.lineTo(x+w/2+12,y+h);c.closePath();c.fill();
      c.fillStyle='rgba(255,196,90,.55)';c.beginPath();c.arc(x+w/2,y+h*.62,3,0,TAU);c.fill();
      c.fillStyle='#4f8a3a';for(var m=0;m<w;m+=8){c.beginPath();c.ellipse(x+m+4,y+1,5,3,0,0,TAU);c.fill();}
      c.strokeStyle='#3e7a2e';c.lineWidth=1.4;for(var v=0;v<3;v++){var vx=x+w*(.15+R(v)*.7);c.beginPath();c.moveTo(vx,y);c.quadraticCurveTo(vx+6,y+h*.3,vx-2,y+h*(.4+R(v+5)*.4));c.stroke();c.fillStyle='#5a9a44';c.beginPath();c.ellipse(vx+2,y+h*.25,2.5,1.6,.5,0,TAU);c.fill();}
      return;}
    var wood=F.face,top=F.top,trim=F.trim;
    if(cur==='kitchen'){wood='#f4f6fa';trim='#b8c4d4';}if(cur==='toyroom'){wood='#ffffff';}
    /* crown + body */
    c.fillStyle=vg(c,y,y+h,L(wood,.12),Dk(wood,.18));rr(c,x+2,y+6,w-4,h-6,3);c.fill();ink(c,1.2);
    c.fillStyle=vg(c,y,y+8,L(top,.3),top);rr(c,x-3,y,w+6,8,3);c.fill();ink(c,1);c.fillStyle=trim;c.fillRect(x-1,y+7,w+2,1.6);
    var inX=x+7,inY=y+12,inW=w-14,inH=h-20;
    if(cur==='toyroom'){var cols=Math.max(2,Math.round(inW/34)),cw=inW/cols,rows=Math.max(1,Math.round(inH/30)),rh=inH/rows,pal=['#ff4d6a','#2de2ff','#ffd23d','#39d36a','#9b6bff','#ff9ac8'];
      for(var r=0;r<rows;r++)for(var k=0;k<cols;k++){var bx2=inX+k*cw+1.5,by2=inY+r*rh+1.5;c.fillStyle=pal[(r*cols+k+seed)%6];rr(c,bx2,by2+rh*.25,cw-3,rh*.75-3,4);c.fill();ink(c,.8);c.fillStyle='rgba(255,255,255,.7)';rr(c,bx2+cw*.3,by2+rh*.42,cw*.4-3,3,1.5);c.fill();}
      return;}
    if(cur==='kitchen'){var dn=Math.max(2,Math.round(inW/40)),dw=inW/dn;for(var d=0;d<dn;d++){var dx=inX+d*dw;c.fillStyle=vg(c,inY,inY+inH,'#ffffff','#e2e8f0');rr(c,dx+1,inY,dw-2,inH,3);c.fill();ink(c,.8);c.strokeStyle='rgba(120,140,170,.35)';c.lineWidth=1;c.strokeRect(dx+5,inY+4,dw-10,inH-8);c.fillStyle='#8a96a8';rr(c,dx+(d%2?6:dw-9),inY+inH*.4,3,inH*.22,1.5);c.fill();}return;}
    /* glass-front display cabinet (mansion / haunted / library) */
    var doors=Math.max(1,Math.round(inW/46)),dW=inW/doors,shelves=Math.max(1,Math.round(inH/26));
    for(var dd=0;dd<doors;dd++){var gx=inX+dd*dW;c.fillStyle=cur==='haunted'?'rgba(30,26,46,.95)':'rgba(40,22,18,.92)';c.fillRect(gx+1,inY,dW-2,inH);
      for(var sh=0;sh<shelves;sh++){var sy=inY+(sh+1)*inH/shelves;c.fillStyle=Dk(wood,.3);c.fillRect(gx+1,sy-2.5,dW-2,2.5);var it=gx+4;
        while(it<gx+dW-6){var kind=(hsh(it*3+sy+seed)*4)|0,iw;
          if(cur==='library'||kind<2){iw=4+hsh(it+sy)*4;var bh=inH/shelves*(.55+hsh(it*7+sy)*.3);c.fillStyle=['#8a2a3a','#2a4a8a','#c89a3a','#2a6a4a','#5a3a7a'][(it*5+sy|0)%5];if(cur==='haunted')c.fillStyle=Dk(c.fillStyle,.35);c.fillRect(it,sy-2.5-bh,iw-.8,bh);c.fillStyle='rgba(255,215,120,.5)';c.fillRect(it+.6,sy-2.5-bh+3,iw-2,1);}
          else if(kind===2){iw=12;c.fillStyle=cur==='haunted'?'#cfc8b4':'#f4f0f8';c.beginPath();c.ellipse(it+6,sy-2.5-inH/shelves*.3,5,inH/shelves*.3,0,0,TAU);c.fill();c.strokeStyle=cur==='haunted'?'#6a6a5a':'#2f6db0';c.lineWidth=1;c.beginPath();c.ellipse(it+6,sy-2.5-inH/shelves*.3,3,inH/shelves*.18,0,0,TAU);c.stroke();}
          else{iw=10;var vh=inH/shelves*.6;c.fillStyle=cur==='haunted'?'#4a8a6a':'#c05a8a';c.beginPath();c.moveTo(it+3,sy-2.5-vh);c.lineTo(it+7,sy-2.5-vh);c.quadraticCurveTo(it+11,sy-2.5-vh*.4,it+8,sy-2.5);c.lineTo(it+2,sy-2.5);c.quadraticCurveTo(it-1,sy-2.5-vh*.4,it+3,sy-2.5-vh);c.fill();}
          it+=iw+1.5;}}
      /* glass sheen + frame */
      c.fillStyle='rgba(255,255,255,.08)';c.beginPath();c.moveTo(gx+dW*.2,inY);c.lineTo(gx+dW*.45,inY);c.lineTo(gx+dW*.15,inY+inH);c.lineTo(gx+1,inY+inH);c.lineTo(gx+1,inY+inH*.7);c.closePath();c.fill();
      c.strokeStyle=trim;c.lineWidth=1.6;c.strokeRect(gx+1,inY,dW-2,inH);c.fillStyle=trim;c.beginPath();c.arc(gx+(dd%2?4.5:dW-4.5),inY+inH/2,1.8,0,TAU);c.fill();
      if(cur==='haunted'){c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=.8;c.beginPath();c.moveTo(gx+dW*.6,inY+2);c.lineTo(gx+dW*.5,inY+inH*.35);c.lineTo(gx+dW*.7,inY+inH*.55);c.stroke();
        if(hsh(seed+dd)>.5){c.fillStyle='rgba(140,255,200,.85)';c.fillRect(gx+dW*.3,inY+inH*.3,2.5,2);c.fillRect(gx+dW*.3+6,inY+inH*.3,2.5,2);}}}
    /* carved base + feet */
    c.fillStyle=Dk(wood,.25);c.fillRect(x+2,y+h-8,w-4,8);c.fillStyle=trim;c.fillRect(x+2,y+h-8,w-4,1.4);
    if(cur==='haunted'){web(c,x+w-2,y+8,Math.min(22,w*.3),true);web(c,x+2,y+8,14,false);}
    if(cur==='mansion'){c.fillStyle=trim;c.beginPath();c.moveTo(x+w/2-8,y);c.quadraticCurveTo(x+w/2,y-7,x+w/2+8,y);c.fill();}}
  /* narrow tall platforms → fluted columns / grandfather-clock cases topped with a flat capital you can stand on */
  function pillar(c,x,y,w,h,F,seed){var stone=cur==='haunted'?['#8a8296','#4a4456']:cur==='kitchen'?['#ffffff','#d4dce6']:cur==='toyroom'?['#ff9ac8','#e86aa8']:cur==='library'?['#7a4a2a','#4a2a14']:['#f2e8dc','#c8b8a4'];
    c.fillStyle=vg(c,y,y+10,L(F.trim,.3),F.trim);rr(c,x-3,y,w+6,10,3);c.fill();ink(c,1);
    c.fillStyle=vg(c,y,y+16,stone[0],stone[1]);c.fillRect(x+2,y+10,w-4,6);
    var g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,stone[1]);g.addColorStop(.35,stone[0]);g.addColorStop(1,Dk(stone[1],.15));c.fillStyle=g;c.fillRect(x+5,y+16,w-10,h-26);ink(c,1);
    c.strokeStyle='rgba(0,0,0,.14)';c.lineWidth=1.2;for(var fx=x+9;fx<x+w-8;fx+=5){c.beginPath();c.moveTo(fx,y+18);c.lineTo(fx,y+h-12);c.stroke();}
    if(cur==='library'||cur==='mansion'&&w>40){c.fillStyle='rgba(20,10,10,.8)';var fr=Math.min((w-10)*.4,14);c.beginPath();c.arc(x+w/2,y+h*.35,fr,0,TAU);c.fill();c.fillStyle='#f6f0e2';c.beginPath();c.arc(x+w/2,y+h*.35,fr-2,0,TAU);c.fill();c.strokeStyle='#2a1a1a';c.lineWidth=1.4;c.beginPath();c.moveTo(x+w/2,y+h*.35);c.lineTo(x+w/2,y+h*.35-fr*.6);c.moveTo(x+w/2,y+h*.35);c.lineTo(x+w/2+fr*.4,y+h*.35);c.stroke();}
    if(cur==='haunted'){c.strokeStyle='#3e7a5e';c.lineWidth=1.4;c.beginPath();c.moveTo(x+w*.3,y+16);for(var v=0;v<6;v++)c.quadraticCurveTo(x+(v%2?w*.85:w*.15),y+16+(v+.5)*(h-26)/6,x+w*.5,y+16+(v+1)*(h-26)/6);c.stroke();web(c,x+w-4,y+12,Math.min(16,w*.5),true);}
    if(cur==='toyroom'){['#ffd23d','#2de2ff','#39d36a'].forEach(function(col,i){c.fillStyle=col;c.fillRect(x+5,y+16+(h-26)*(.2+i*.28),w-10,4);});}
    c.fillStyle=vg(c,y+h-12,y+h,stone[0],Dk(stone[1],.2));rr(c,x-1,y+h-12,w+2,12,2);c.fill();ink(c,1);c.fillStyle=F.trim;c.fillRect(x-1,y+h-12,w+2,1.6);}
  function floorDraw(p,cx,cy){var x=p.bx-cx,y=p.by-cy,w=p.bw,h=p.bh;if(x>W||x+w<0||y>H||y+h<0)return;ctx.save();
    if(cur==='graveyard'){ctx.fillStyle=vg(ctx,y,y+h,'#2a3a22','#120c08');ctx.fillRect(x,y,w,h);ctx.fillStyle='#3e6a2e';for(var gx=-((cx|0)%8);gx<W;gx+=8){ctx.beginPath();ctx.moveTo(gx,y+2);ctx.lineTo(gx+3,y-5-((gx+cx)%3));ctx.lineTo(gx+6,y+2);ctx.fill();}}
    else if(cur==='kitchen'){var s=30;for(var tx=Math.floor(cx/s)*s;tx<cx+W;tx+=s)for(var ty=0;ty<h;ty+=s){ctx.fillStyle=((tx/s+ty/s)&1)?'#2a2a3a':'#f0f0f6';ctx.fillRect(tx-cx,y+ty,s,s);}ctx.fillStyle='rgba(0,0,0,.2)';ctx.fillRect(x,y,w,4);}
    else if(cur==='toyroom'){ctx.fillStyle=vg(ctx,y,y+h,'#8ad0ff','#5a9ae0');ctx.fillRect(x,y,w,h);ctx.fillStyle='rgba(255,255,255,.25)';for(var px=Math.floor(cx/60)*60;px<cx+W;px+=60){ctx.beginPath();ctx.arc(px-cx+30,y+30,10,0,TAU);ctx.fill();}}
    else{var col=cur==='haunted'?['#3a2a26','#2e201c']:cur==='library'?['#5a3418','#4a2a12']:['#8a5230','#74421f'];var pw=90;for(var bx=Math.floor(cx/pw)*pw;bx<cx+W;bx+=pw)for(var r=0;r<3;r++){ctx.fillStyle=col[((bx/pw|0)+r)&1];ctx.fillRect(bx-cx+(r%2)*45,y+r*20,pw,20);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(bx-cx+(r%2)*45,y+r*20,1.5,20);}
      if(cur==='mansion'){ctx.fillStyle='rgba(138,26,42,.85)';ctx.fillRect(x+w*.15,y+2,w*.7,6);ctx.fillStyle='#d8a936';ctx.fillRect(x+w*.15,y+2,w*.7,1.5);}}
    ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x,y,w,2);ctx.restore();}
  var _pd=Platform.prototype.draw;
  Platform.prototype.draw=function(cx,cy){if(!on()||this.deco)return _pd.apply(this,arguments);
    if(this===platforms[0]){floorDraw(this,cx,cy);return;}
    if(this===platforms[1]||this===platforms[2]){var F=FIX[cur]||FIX.mansion;ctx.fillStyle=cur==='graveyard'?'#2a2a3a':F.face;ctx.fillRect(this.bx-cx,this.by-cy,this.bw,this.bh);return;}
    if(this.ptype&&this.ptype!=='normal')return _pd.apply(this,arguments);
    if(this.bx+this.bw<cx-60||this.bx>cx+W+60||this.by+this.bh<cy-60||this.by>cy+H+60)return;
    var s=fixSprite(this);ctx.drawImage(s.cv,this.bx-cx-s.ox,this.by-cy-s.oy);};

  /* ====================== transform with magic smoke ====================== */
  var puffs=[];
  function smoke(f){var x=f.cx,y=f.cy,R=Math.max(f.w,f.h);for(var i=0;i<30;i++){var a=Math.random()*TAU,d=Math.random()*R*.6;puffs.push({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d*.8,r:R*(.35+Math.random()*.45),vx:Math.cos(a)*(.3+Math.random()*.9),vy:Math.sin(a)*.6-.5-Math.random()*.6,t:0,life:800+Math.random()*500,c:Math.random()<.25?'#d9c8ff':Math.random()<.5?'#ffffff':'#e8f0ff'});}
    for(var s=0;s<12;s++){var a2=Math.random()*TAU;puffs.push({star:1,x:x,y:y,vx:Math.cos(a2)*3,vy:Math.sin(a2)*3-1,t:0,life:700,r:2+Math.random()*2.5,c:['#ffd23d','#ff3db5','#2de2ff'][s%3]});}
    try{sfx&&sfx('pop');}catch(e){}}
  function drawPuffs(dt){if(!puffs.length)return;ctx.save();for(var i=puffs.length-1;i>=0;i--){var p=puffs[i];p.t+=dt;if(p.t>=p.life){puffs.splice(i,1);continue;}var k=p.t/p.life;p.x+=p.vx*dt/16;p.y+=p.vy*dt/16;p.vx*=.97;p.vy*=.97;var sx=p.x-camera.x,sy=p.y-camera.y;
      if(p.star){ctx.globalAlpha=1-k;ctx.fillStyle=p.c;ctx.beginPath();for(var q=0;q<8;q++){var a=q*Math.PI/4,rr2=q%2?p.r*.4:p.r*1.4;ctx.lineTo(sx+Math.cos(a)*rr2,sy+Math.sin(a)*rr2);}ctx.fill();continue;}
      var al=k<.25?Math.min(1,k*5):1-(k-.25)/.75,r=p.r*(.6+k*.8);var g=ctx.createRadialGradient(sx-r*.3,sy-r*.3,r*.1,sx,sy,r);g.addColorStop(0,p.c);g.addColorStop(.6,p.c);g.addColorStop(1,'rgba(200,190,255,0)');ctx.globalAlpha=al*.95;ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,TAU);ctx.fill();}ctx.restore();}
  var _lastT=performance.now();
  var _de=drawEmotes;drawEmotes=function(){var r=_de.apply(this,arguments);var n=performance.now(),dt=Math.min(50,n-_lastT);_lastT=n;drawPuffs(dt);return r;};
  function morph(f,type){if(!type)return;smoke(f);f._morphing=true;setTimeout(function(){f._morphing=false;if(gameMode!=='hns'||f.found||f.hidden)return;f._objType=type;f._objProp=null;},230);}
  var _dis=disguiseHider;
  disguiseHider=function(f,spot){if(!f||f.hidden||f.found)return;
    if(hnsPhase==='hide'&&hnsHideLeft>0){if(f.isP){if(!f._objType&&!f._morphing)morph(f,f.hideType||hnsPool[0]);return;}
      if(f._morphing)return;f._morphing=true;smoke(f);setTimeout(function(){f._morphing=false;if(STATE==='play'&&gameMode==='hns'&&!f.hidden&&!f.found){if(f._objType)f.hideType=f._objType;f._objType=null;f._objProp=null;_dis(f,spot);}},260);return;}
    var was=!!f._objType;if(f._objType){f.hideType=f._objType;}f._objType=null;f._objProp=null;f._morphing=false;if(!was)smoke(f);_dis(f,spot);};
  var _pick=hnsPlayerPickDisguise;
  hnsPlayerPickDisguise=function(wx,wy){var r=_pick.apply(this,arguments);if(r&&player&&hnsPhase==='hide'&&!player.hidden){if(player._objType!==player.hideType)morph(player,player.hideType);}return r;};
  var _prev=drawHnsHidePreview;drawHnsHidePreview=function(){if(player&&(player._objType||player._morphing))return;return _prev.apply(this,arguments);};
  /* draw a mobile object-flea as the real object */
  var _fd=Flea.prototype.draw;
  Flea.prototype.draw=function(cx,cy){if(this._objType&&!this.hidden&&gameMode==='hns'){var p=this._objProp;if(!p||p._want!==this._objType){p=this._objProp=makeProp(this._objType,this.cx,WORLD_H-60);p._want=this._objType;}
      var d=SZ[p.deco]||[p.bw,p.bh],nx=this.cx-p.bw/2,ny=this.y+this.h-p.bh;if(p._shift)p._shift(nx-p.bx,ny-p.by);else{p.bx=nx;p.by=ny;p.x=nx;p.y=ny;}
      var sq=this.stuck?1:1+Math.min(.06,Math.abs(this.vy||0)*.01);ctx.save();var ax=this.cx-cx,ay=this.y+this.h-cy;ctx.translate(ax,ay);ctx.scale(1/sq,sq);ctx.translate(-ax,-ay);drawDeco(p,cx,cy);ctx.restore();
      if(this.isP){ctx.save();ctx.font='700 10px Chakra Petch';ctx.textAlign='center';ctx.fillStyle='rgba(122,240,255,.95)';ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=4;ctx.fillText('YOU',this.cx-cx,p.by-cy-6);ctx.restore();}
      return;}
    return _fd.apply(this,arguments);};
  /* hide phase: everyone (player + AI hiders) poofs into their object shortly after GO and scurries around as it */
  var _ht=hnsTick;hnsTick=function(dt){if(hnsPhase==='hide'&&STATE==='play'&&hnsHideLeft<HNS_HIDE_MS-900){for(var i=0;i<fleas.length;i++){var f=fleas[i];if(f===hnsSeeker||f.hidden||f.found||f._objType||f._morphing)continue;
      if(f.isP||hnsHideLeft<HNS_HIDE_MS-1400-(i*170)%1600)morph(f,f.hideType||hnsPool[0]);}}
    return _ht.apply(this,arguments);};
  /* map picker in Settings → Game (Hide & Seek) */
  function row(){var host=document.getElementById('seek-row');if(!host||document.getElementById('hns-map-row'))return;var d=document.createElement('div');d.className='setting-row';d.id='hns-map-row';d.setAttribute('data-testid','hns-map-row');
    function paint(){var v=pref();d.innerHTML='<div class="section-label"><span>Hiding World</span><small class="xm-sub">Where the fleas hide</small></div><div class="layout-row" style="flex-wrap:wrap">'+[['random','🎲 Random']].concat(KEYS.map(function(k){return [k,TH[k].ico+' '+TH[k].name];})).map(function(o){return '<button class="lbtn'+(o[0]===v?' active':'')+'" data-hm="'+o[0]+'" data-testid="hns-map-'+o[0]+'">'+o[1]+'</button>';}).join('')+'</div>';}
    paint();d.addEventListener('click',function(e){var b=e.target.closest('[data-hm]');if(!b)return;setPref(b.dataset.hm);paint();});host.parentNode.insertBefore(d,host.nextSibling);d.style.display=host.style.display;}
  var _sync=syncSettingsUI;syncSettingsUI=function(){var r=_sync.apply(this,arguments);row();var m=document.getElementById('hns-map-row');if(m)m.style.display=gameMode==='hns'?'':'none';return r;};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',row);else row();
  return {themes:TH,current:function(){return cur;},set:setPref,pref:pref,sizes:SZ};
})();
window.FreaHnsMaps=FreaHnsMaps;
