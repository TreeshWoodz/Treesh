/* =====================================================================
   ZEN PLAY — fully interactive Zen Sandbox items.
   • every item renders with the glossy Furni art (zenart.js) + 30 new items
   • multi-action context menu per item (TV: power, channel, watch, volume…)
   • pick up / carry / throw / drop / kick / push / place ON TOP of things
   • put items on ANY flea's head (hat!) — stays on until taken off; the
     player's hat is saved and comes back next session
   • stacking physics (AABB rest-on-top), conveyor carry, fan wind
   • proximity highlight "TAP" chip + carry bar (Drop / Throw / Wear /
     Place on… / Give) for desktop + mobile, key E = interact, G = drop
   • AI fleas play with items on their own (wear hats, kick balls, sit,
     jam on instruments, fetch bones)
   ===================================================================== */
(function(){
  if(typeof ZEN_OBJECT_CATALOG==='undefined'||typeof Furni==='undefined')return;
  var TAU=Math.PI*2,PAL=['#ff3db5','#2de2ff','#ffd23d','#39ff7a','#9b6bff','#ff7a3d','#ff5a7a','#4a8aff'];
  function now(){return Date.now();}
  function rnd(a){return a[(Math.random()*a.length)|0];}
  function cap(s){return String(s||'').replace(/\b\w/g,function(v){return v.toUpperCase();});}
  function el(id){return document.getElementById(id);}

  /* ---------------- catalog: new items ---------------- */
  var NEW={radio:{w:46,h:34,weight:'light'},jukebox:{w:60,h:96,weight:'heavy'},fan:{w:40,h:60,weight:'light'},telescope:{w:60,h:60,weight:'light'},discoball:{r:18,weight:'float'},lavalamp:{w:22,h:50,weight:'light'},globe:{w:36,h:48,weight:'light'},gumball:{w:36,h:60,weight:'light'},piggybank:{w:44,h:34,weight:'light'},
    teddy:{w:40,h:46,weight:'light'},toycar:{w:56,h:30,weight:'light'},skateboard:{w:60,h:18,weight:'light'},duck:{w:30,h:28,weight:'light'},cone:{w:30,h:40,weight:'light'},umbrella:{w:44,h:70,weight:'light'},bucket:{w:32,h:32,weight:'light'},wateringcan:{w:44,h:34,weight:'light'},snowman:{w:50,h:80,weight:'heavy'},campfire:{w:60,h:44,weight:'heavy'},
    cake:{w:46,h:40,weight:'light'},pizza:{w:44,h:44,weight:'light'},icecream:{w:24,h:44,weight:'light'},watermelon:{w:48,h:34,weight:'light'},partyhat:{w:28,h:34,weight:'light'},crown:{w:32,h:24,weight:'light'},soccer:{r:16,weight:'light'},
    arcade:{w:56,h:96,weight:'heavy'},computer:{w:56,h:44,weight:'light'},aquarium:{w:80,h:56,weight:'heavy'},speaker:{w:36,h:60,weight:'light'},beanbag:{w:60,h:42,weight:'light',seats:1},armchair:{w:60,h:52,weight:'heavy',seats:1},floorlamp:{w:26,h:96,weight:'light'},stove:{w:60,h:62,weight:'heavy'}};
  Object.keys(NEW).forEach(function(k){ZEN_OBJECT_CATALOG[k]=NEW[k];});
  var DEFPHYS={g:.42,b:.12,fr:.84,air:.99},BALL={g:.34,b:.7,fr:.985,air:.995};
  var PHX={soccer:BALL,discoball:{g:.38,b:.3,fr:.9,air:.995},toycar:{g:.4,b:.1,fr:.985,air:.995},skateboard:{g:.4,b:.1,fr:.985,air:.995},duck:{g:.3,b:.45,fr:.95,air:.995}};
  function physFor(t){return PHX[t]||DECO_PHYS[t]||DEFPHYS;}
  var CIRCLE={soccer:1,discoball:1};
  var TINT={couch:1,chair:1,armchair:1,beanbag:1,bed:1,rug:1,lamp:1,floorlamp:1,balloon:1,block:1,crystal:1,drum:1,gift:1,radio:1,fan:1,gumball:1,skateboard:1,toycar:1,umbrella:1,bucket:1,partyhat:1,speaker:1};
  var ROLL={beachball:1,soccer:1,tire:1,toycar:1,skateboard:1,rock:1};
  var NOWEAR={orb:1,burning:1,rug:1,conveyor:1,trampoline:1};
  function heavy(p){return zenCatalogSize(p.deco||'').weight==='heavy';}
  function wearable(p){return p&&p.deco&&!heavy(p)&&!NOWEAR[p.deco];}
  var NAMES={tv:'TV',partyhat:'Party Hat',wateringcan:'Watering Can',toycar:'Toy Car',discoball:'Disco Ball',lavalamp:'Lava Lamp',piggybank:'Piggy Bank',icecream:'Ice Cream',beachball:'Beach Ball',floorlamp:'Floor Lamp',armchair:'Armchair',present:'Bow',soccer:'Soccer Ball',gumball:'Gumball Machine'};
  function nm(p){return NAMES[p.deco]||cap(p.deco);}

  /* ---------------- build dock: new tabs + painted thumbnails ---------------- */
  ZEN_CATS.furniture=ZEN_CATS.furniture.concat([{t:'armchair',l:'Armchair'},{t:'beanbag',l:'Beanbag'},{t:'floorlamp',l:'Floor Lamp'},{t:'stove',l:'Stove'}]);
  ZEN_CATS.gadgets=[{t:'radio',l:'Radio'},{t:'jukebox',l:'Jukebox'},{t:'arcade',l:'Arcade'},{t:'computer',l:'Computer'},{t:'speaker',l:'Speaker'},{t:'fan',l:'Fan'},{t:'aquarium',l:'Aquarium'},{t:'telescope',l:'Telescope'},{t:'discoball',l:'Disco'},{t:'lavalamp',l:'Lava Lamp'},{t:'globe',l:'Globe'},{t:'gumball',l:'Gumball'},{t:'piggybank',l:'Piggy'}];
  ZEN_CATS.toys=[{t:'soccer',l:'Soccer'},{t:'teddy',l:'Teddy'},{t:'toycar',l:'Toy Car'},{t:'skateboard',l:'Skate'},{t:'duck',l:'Duck'},{t:'cone',l:'Cone'},{t:'umbrella',l:'Umbrella'},{t:'bucket',l:'Bucket'},{t:'wateringcan',l:'Water Can'},{t:'snowman',l:'Snowman'},{t:'campfire',l:'Campfire'}];
  ZEN_CATS.treats=[{t:'cake',l:'Cake'},{t:'pizza',l:'Pizza'},{t:'icecream',l:'Ice Cream'},{t:'watermelon',l:'Melon'},{t:'partyhat',l:'Party Hat'},{t:'crown',l:'Crown'}];
  (function tabs(){var host=el('zen-cat-tabs');if(!host)return;var before=host.querySelector('[data-cat="worlds"]');
    [['gadgets','Gadgets'],['toys','Toys'],['treats','Treats']].forEach(function(t){if(host.querySelector('[data-cat="'+t[0]+'"]'))return;var b=document.createElement('button');b.className='zen-seg__btn';b.dataset.cat=t[0];b.setAttribute('data-testid','zen-category-'+t[0]);b.textContent=t[1];
      b.addEventListener('click',function(){zenCat=t[0];[].forEach.call(host.querySelectorAll('.zen-seg__btn'),function(x){x.classList.toggle('active',x===b);});buildZenItems();});if(before)host.insertBefore(b,before);else host.appendChild(b);});})();
  var TH={};
  function thumbURL(t){if(TH[t])return TH[t];var s=zenCatalogSize(t),w=s.w||(s.r*2)||40,h=s.h||(s.r*2)||40,cv=document.createElement('canvas');cv.width=cv.height=72;var q=cv.getContext('2d'),k=Math.min(56/w,56/h);q.translate(36,38);q.scale(k,k);try{if(!Furni.draw(q,t,-w/2,-h/2,w,h,{t:1.2,s:{on:true,open:false}}))return null;}catch(e){return null;}TH[t]=cv.toDataURL();return TH[t];}
  var _bzi=buildZenItems;
  buildZenItems=function(){_bzi();var host=el('zen-items');if(!host)return;[].forEach.call(host.querySelectorAll('.zen-item'),function(b){var t=b.dataset.spawn;if(!t||t==='orb'||t==='burning'||!Furni.has(t))return;var u=thumbURL(t);if(!u)return;var gi=b.querySelector('.gi');if(gi){gi.innerHTML='<img alt="" src="'+u+'" class="zi-thumb">';}if(NEW[t]&&!b.querySelector('.zi-new')){var n=document.createElement('em');n.className='zi-new';n.textContent='NEW';b.appendChild(n);}});};
  try{buildZenItems();}catch(e){}

  /* ---------------- spawning ---------------- */
  var _spawn=spawnZen;
  spawnZen=function(type){
    if(CIRCLE[type]&&STATE==='play'&&gameMode==='zen'){var cfg=zenCatalogSize(type),px=camera.x+W/2+(Math.random()-.5)*120,py=camera.y+H*.28;if(player&&!player.hidden){px=Math.max(40,Math.min(WORLD_W-40,player.cx+(player.face||1)*(player.w*.5+46)));py=Math.max(30,player.y-34);}var p=new Platform({kind:'circle',x:px,y:py,r:cfg.r});p.deco=type;p.bob=Math.random()*6;p.decoCol=rnd(PAL);p.phys=physFor(type);p.vx=(Math.random()-.5)*2;p.vy=0;platforms.push(p);zenEnsureId(p);zenSyncSpawn(p);try{bump('objectsPlaced');}catch(e){}ofx(px,py);flash('Placed '+nm(p)+'!','#2de2ff');return p;}
    var n0=platforms.length;_spawn(type);var q=platforms[platforms.length-1];
    if(platforms.length>n0&&q&&q.deco===type){q.decoCol=TINT[type]?rnd(PAL):undefined;if(!q.phys)q.phys=physFor(type);else if(PHX[type])q.phys=PHX[type];q.vx=q.vx||0;q.vy=q.vy||0;q.zenState=q.zenState||{};}
    return q;};
  function spawnAt(type,x,y){var p=spawnZen(type);if(p&&p.deco===type){var c=propCenter(p);p._shift(x-c.x,y-c.y);p.vy=-4;p.vx=(Math.random()-.5)*4;zenSyncTransform(p,false);}return p;}

  /* ---------------- held / worn bookkeeping ---------------- */
  var _col=Platform.prototype.collide;
  Platform.prototype.collide=function(f){if(this._heldBy||(this.deco&&this.carriedBy))return false;return _col.call(this,f);};
  function heldByPlayer(p){return player&&player.carry===p;}
  function isHeld(p){return !!(p._heldBy||heldByPlayer(p)||p.carriedBy);}
  function releaseCarry(silent){if(!player||!player.carry)return null;var p=player.carry;p.carriedBy=null;if(p.zenId)zenSend(player.carryMode==='push'||player.carryMode==='roll'?'release':'carry',p.zenId,{active:false});player.carry=null;player.carryMode=null;player.carryHeavy=false;return p;}
  function headTop(f){var s=SHAPES[f.shape]||SHAPES.round;return (s.ry||12);}
  function wearScale(p){return Math.min(1,26/(p.bw||30),30/(p.bh||30));}
  function saveHat(){try{var w=player&&player._wornItem;localStorage.setItem('frea_zen_worn',w?JSON.stringify({type:w.deco,col:w.decoCol||null,state:w.zenState||{}}):'');}catch(e){}}
  function wear(p,f){if(!p||!f||!wearable(p))return false;
    if(p._heldBy&&p._heldBy!==f)unwear(p._heldBy,true);
    if(f._wornItem&&f._wornItem!==p)unwear(f,true);
    if(heldByPlayer(p))releaseCarry(true);
    if(f===player&&player.carry)releaseCarry(true);
    p._heldBy=f;f._wornItem=p;f._wornH=(p.bh*wearScale(p)*(f.sf||1))*.9;p.vx=p.vy=0;
    p.zenState=p.zenState||{};p.zenState.wornBy=f.name;zsync(p,'wear');
    jpfx(f.cx,f.cy-14,'#ffd23d');
    if(f===player){saveHat();flash(nm(p)+' on your head!','#c6ff3d');}else{f.emoteEmoji='😎';f.emoteT=1600;}
    return true;}
  function unwear(f,quiet){var p=f&&f._wornItem;if(!p)return null;f._wornItem=null;f._wornH=0;p._heldBy=null;if(p.zenState)delete p.zenState.wornBy;
    var c=propCenter(p);p._shift(f.cx+(f.face||1)*22-c.x,f.cy-18-c.y);p.vx=(f.face||1)*2;p.vy=-3;zsync(p,'unwear');
    if(f===player){saveHat();if(!quiet)flash('Took off the '+nm(p),'#ffd23d');}return p;}
  /* draw hats in the flea's local space (hooked from actions.js) */
  window.__fleaHeadHook=function(f){var p=f._wornItem;if(!p)return;if(platforms.indexOf(p)<0){f._wornItem=null;return;}
    var k=wearScale(p),w=p.bw,h=p.bh,top=-headTop(f)+3,flipY=(p.deco==='bucket');ctx.save();ctx.translate(0,top);ctx.scale(k,k);
    if(flipY){ctx.translate(0,-h/2);ctx.scale(1,-1);ctx.translate(0,h/2);}
    drawArt(p,-w/2,-h,w,h);ctx.restore();};

  /* ---------------- rendering ---------------- */
  var _dd=drawDeco,DRAWHELD=false;
  function drawArt(p,x,y,w,h){var zs=p.zenState||{},o={t:performance.now()/1000,on:zs.on,col:TINT[p.deco]&&/^#/.test(p.decoCol||'')?p.decoCol:undefined,s:zs,rot:p._rot||0};
    if(p.deco==='lamp'||p.deco==='floorlamp'||p.deco==='tv'||p.deco==='fireplace'||p.deco==='computer'||p.deco==='arcade'||p.deco==='stove'||p.deco==='speaker')o.on=zs.on!==false&&!(p.deco==='stove'&&!zs.on);
    return Furni.draw(ctx,p.deco,x,y,w,h,o);}
  function animXf(p,x,y,w,h){var zs=p.zenState||{},za=zs.animation||'',age=zs.interactionAt?(now()-(+new Date(zs.interactionAt)||+zs.interactionAt||0)):9999;
    if(za&&age>=0&&age<1600){var t=age/1000,cx=x+w/2,cy=y+h,d=1-age/1600;ctx.translate(cx,cy);
      if(/spin|reverse|time|riff|beat|play|kick/.test(za))ctx.rotate(Math.sin(t*16)*.12*d);
      if(/shake|rustle|poke|flex|open|alarm|splash/.test(za))ctx.translate(Math.sin(t*40)*4*d,0);
      if(/pulse|glow|charge|shine|wish|bloom|sparkle|grow|water|love/.test(za)){var s=1+Math.sin(t*12)*.08*d;ctx.scale(s,s);}
      if(/bounce|hop|bop|float|wave|turn|wear|power|toggle|light|channel/.test(za)){ctx.translate(0,-Math.abs(Math.sin(t*9))*7*d);ctx.scale(1+Math.sin(t*18)*.04*d,1-Math.sin(t*18)*.04*d);}
      ctx.translate(-cx,-cy);}
    var g=zs.grow||1;if(g!==1){ctx.translate(x+w/2,y+h);ctx.scale(g,g);ctx.translate(-(x+w/2),-(y+h));}}
  function noteFx(p,x,y,w){var t=performance.now()/1000;ctx.save();for(var i=0;i<3;i++){var k=((t*.7+i/3)%1),nx=x+w/2+(i-1)*w*.3+Math.sin(k*6+i)*6,ny=y-4-k*34;ctx.globalAlpha=1-k;ctx.fillStyle=PAL[(i+Math.floor(t))%5];ctx.beginPath();ctx.ellipse(nx,ny,3,2.2,-.4,0,TAU);ctx.fill();ctx.fillRect(nx+2.2,ny-9,1.3,9);}ctx.restore();}
  function drawChip(txt,x,y,col){ctx.save();ctx.font='700 10px Chakra Petch';var tw=ctx.measureText(txt).width+14;ctx.fillStyle='rgba(11,14,32,.86)';ctx.strokeStyle=col||'#2de2ff';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(x-tw/2,y-9,tw,18,9);ctx.fill();ctx.stroke();ctx.fillStyle='#eef4ff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,x,y+.5);ctx.restore();}
  drawDeco=function(p,cx,cy){
    if(!p||!p.deco)return _dd(p,cx,cy);
    if(p._heldBy&&!DRAWHELD)return;
    if(p.deco==='orb'||p.deco==='burning'||!Furni.has(p.deco))return _dd(p,cx,cy);
    var x=p.bx-cx,y=p.by-cy,w=p.bw,h=p.bh;
    if(gameMode==='zen'&&!DRAWHELD&&(p===Z.near||p===Z.surface)){var t=performance.now()/1000;ctx.save();ctx.strokeStyle=p===Z.surface?'rgba(198,255,61,.8)':'rgba(45,226,255,.75)';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.lineDashOffset=-t*20;ctx.beginPath();ctx.roundRect(x-5,y-5,w+10,h+10,10);ctx.stroke();ctx.restore();}
    ctx.save();animXf(p,x,y,w,h);drawArt(p,x,y,w,h);ctx.restore();
    var zs=p.zenState||{};if((zs.on&&/radio|jukebox|speaker/.test(p.deco))||(zs.playing&&now()<(zs.playUntil||0))||now()<(p._notesUntil||0))noteFx(p,x,y,w);
    if(gameMode==='zen'&&!DRAWHELD){if(p===Z.near&&!(player&&player.carry))drawChip('TAP · '+nm(p).toUpperCase(),x+w/2,y-16,'#2de2ff');else if(p===Z.surface)drawChip('PLACE ON '+nm(p).toUpperCase(),x+w/2,y-16,'#c6ff3d');}
  };
  var _dco=drawCarriedObject;
  drawCarriedObject=function(f){if(!f.carry)return;if(f.carryMode==='push'||f.carryMode==='roll')return _dco(f);var p=f.carry;DRAWHELD=true;try{if(p.deco==='orb'||p.deco==='burning'||!Furni.has(p.deco))_dd(p,camera.x,camera.y);else{ctx.save();drawArt(p,p.bx-camera.x,p.by-camera.y,p.bw,p.bh);ctx.restore();}}finally{DRAWHELD=false;}};

  /* ---------------- physics: stacking + held sync + gadgets ---------------- */
  var Z={near:null,surface:null,lastAI:0,lastBar:'',restored:false};
  function weightOf(p){var w=zenCatalogSize(p.deco||'').weight;return w==='heavy'?4:(w==='float'?.4:1);}
  function syncHeld(){
    if(player&&player.carry&&(player.carryMode==='juggle'||player.carryMode==='sway')){var p=player.carry,c=propCenter(p),bob=Math.abs(Math.sin((player.carryT||0)*.006))*3;var tx=player.cx,ty=player.y-(p.bh/2)-8-bob-(player._wornH||0);p._shift(tx-c.x,ty-c.y);p.vx=p.vy=0;}
    (fleas||[]).forEach(function(f){var q=f._wornItem;if(!q)return;if(platforms.indexOf(q)<0||f.hidden){f._wornItem=null;q._heldBy=null;return;}var c=propCenter(q),k=wearScale(q)*(f.sf||1);q._shift(f.cx-c.x,(f.y-q.bh*k/2)-c.y);q.vx=q.vy=0;});}
  updateDecoPhysics=function(dt){
    syncHeld();
    var dyn=[];
    for(var i=3;i<platforms.length;i++){var p=platforms[i];if(!p.deco)continue;if(!p.phys){p.phys=physFor(p.deco);p.vx=p.vx||0;p.vy=p.vy||0;}
      if(isHeld(p)||grabbed===p){p.vx=0;p.vy=0;p.pdx=0;p.pdy=0;continue;}
      dyn.push(p);var ph=p.phys,s0=p.cenx,s1=p.ceny;
      p.vy+=ph.g;p.vx*=ph.air;p.vy*=ph.air;if(p._restOn){p.vx*=ph.fr;}
      if(p._restOn&&p._restOn.deco==='conveyor'){var rs=p._restOn.zenState||{};p.vx+=((rs.reverse?-1:1)*(rs.fast?3.2:1.6)-p.vx)*.2;}
      var sp=Math.hypot(p.vx,p.vy);if(sp>16){p.vx=p.vx/sp*16;p.vy=p.vy/sp*16;}
      var steps=Math.max(1,Math.ceil(Math.max(Math.abs(p.vx),Math.abs(p.vy))/4));for(var s=0;s<steps;s++){p._shift(p.vx/steps,p.vy/steps);resolveDecoBounds(p,ph);}
      p._restOn=null;p.pdx=p.cenx-s0;p.pdy=p.ceny-s1;if(ROLL[p.deco])p._rot=(p._rot||0)+p.pdx/Math.max(8,(p.r||p.bh/2));}
    for(var it=0;it<2;it++)for(var a=0;a<dyn.length;a++)for(var b=a+1;b<dyn.length;b++){var A=dyn[a],B=dyn[b],hA=decoHalf(A),hB=decoHalf(B),dx=B.cenx-A.cenx,dy=B.ceny-A.ceny,ox=hA.hw+hB.hw-Math.abs(dx),oy=hA.hh+hB.hh-Math.abs(dy);
      if(ox<=0||oy<=0)continue;
      if(oy<ox){var up=dy>0?A:B,lo=up===A?B:A;up._shift(0,-oy);if(up.vy>0){up.vy=-up.vy*(up.phys.b||0)*.3;if(Math.abs(up.vy)<.8)up.vy=0;}up._restOn=lo;up.vx+=(lo.pdx-up.vx)*.15;}
      else{var wa=weightOf(A),wb=weightOf(B),tot=wa+wb,sg=dx>0?1:-1;A._shift(-sg*ox*wb/tot,0);B._shift(sg*ox*wa/tot,0);var rel=A.vx-B.vx;if(rel*sg>0){var imp=rel*.6;A.vx-=imp*wb/tot*2;B.vx+=imp*wa/tot*2;}}}
    gadgets(dt);
  };
  function gadgets(dt){var t=now();
    for(var i=3;i<platforms.length;i++){var p=platforms[i];if(!p.deco||!p.zenState)continue;var zs=p.zenState;
      if(p.deco==='fan'&&zs.on&&!isHeld(p)){var pw=(zs.speed||1)*.12,c=propCenter(p);for(var j=3;j<platforms.length;j++){var q=platforms[j];if(q===p||!q.deco||isHeld(q)||heavy(q))continue;var d=q.cenx-c.x;if(d>0&&d<260&&Math.abs(q.ceny-c.y)<70){q.vx+=pw*(1-d/260)*(weightOf(q)<1?2:1);}}
        (fleas||[]).forEach(function(f){var d=f.cx-c.x;if(d>0&&d<200&&Math.abs(f.cy-c.y)<60&&!f.stuck){f.vx+=pw*.5;}});}
      if(p.deco==='toycar'&&zs.drive&&t<zs.drive){p.vx=(zs.dir||1)*5;}
      if(p.deco==='globe'&&zs.spin&&t>(zs.spinUntil||0))zs.spin=0;
      if(p.deco==='stove'&&zs.on&&zs.offAt&&t>zs.offAt){zs.on=false;zs.offAt=0;}}}

  /* ---------------- helpers for actions ---------------- */
  function zsync(p,anim){p.zenState=p.zenState||{};if(anim){p.zenState.animation=anim;p.zenState.interactionAt=now();}try{zenSend('interact',zenEnsureId(p),{animation:anim||'',state:p.zenState});}catch(e){}}
  function S(p){return (p.zenState=p.zenState||{});}
  function F(a,ms){if(!player)return;player.action=a;player.actionT=0;player.actionUntil=now()+(ms||2200);}
  function fx(p,col){var c=propCenter(p);jpfx(c.x,c.y,col||'#c6ff3d');}
  function sayP(txt){try{say(player,txt,2200);}catch(e){}}
  /* ---- staging: put the flea where the interaction physically happens + give it a prop to hold ---- */
  function stage(p,where,prop,ms){stageF(player,p,where,prop,ms);}
  function stageF(f,p,where,prop,ms){if(!f||!p)return;var c=propCenter(p),side=f.cx<c.x?-1:1;
    if(where==='on'){f.x=c.x-f.w/2;f.y=p.by-f.h-1;}
    else if(where==='watch'){var d=Math.max(70,p.bw*.9);f.x=c.x+side*d-f.w/2;f.y=p.by+p.bh-f.h-2;f.face=-side;}
    else{f.x=c.x+side*(p.bw/2+f.w*.55+4)-f.w/2;f.y=p.by+p.bh-f.h-2;f.face=-side;}
    f.x=Math.max(20,Math.min(WORLD_W-f.w-20,f.x));f.vx=0;f.vy=0;f.stuck=false;f.onG=false;f.angle=0;
    f._lookAt=where==='on'?null:{p:p,until:now()+(ms||3000)};if(prop)f._prop={k:prop,until:now()+(ms||3000),t0:now()};try{jpfx(f.cx,f.cy,f.col);}catch(e){}}
  var _fdraw=Flea.prototype.draw;Flea.prototype.draw=function(){var r=_fdraw.apply(this,arguments);try{if(!this.hidden&&gameMode==='zen'&&(this._prop||this._lookAt))drawProp(this);}catch(e){}return r;};
  function drawProp(f){var pr=f._prop,lk=f._lookAt,t=now();if(lk&&t<lk.until&&lk.p.deco==='tv'&&(lk.p.zenState||{}).on!==false){var c=propCenter(lk.p),x1=c.x-camera.x,y1=c.y-camera.y,x2=f.cx-camera.x,y2=f.cy-camera.y;ctx.save();ctx.globalAlpha=.16+Math.sin(t/120)*.05;var g=ctx.createLinearGradient(x1,y1,x2,y2);g.addColorStop(0,'#9ae8ff');g.addColorStop(1,'rgba(154,232,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x1,y1-lk.p.bh*.3);ctx.lineTo(x2,y2-f.h*.7);ctx.lineTo(x2,y2+f.h*.6);ctx.lineTo(x1,y1+lk.p.bh*.3);ctx.closePath();ctx.fill();ctx.restore();
      var chc=['#ffd23d','#2de2ff','#39ff7a','#ff3db5','#c8ccd8'][(lk.p.zenState||{}).channel||0];ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.10+.08*Math.abs(Math.sin(t/90+f.x));ctx.fillStyle=chc;ctx.beginPath();ctx.ellipse(x2,y2,f.w*.55,f.h*.55,0,0,TAU);ctx.fill();ctx.restore();
      if(!f._tvR||t>f._tvR){f._tvR=t+1400+Math.random()*1600;if(Math.random()<.55){f.emoteEmoji=rnd(['😂','😮','😍','🤣','😱','👀','🍿']);f.emoteT=1100;}}}
    if(lk&&t>=lk.until)f._lookAt=null;
    if(!pr||t>pr.until){f._prop=null;return;}
    if((pr.k==='snack'||pr.k==='popcorn')&&Math.random()<.08){parts.push({x:f.cx+(f.face||1)*f.w*.3,y:f.cy,vx:(Math.random()-.5)*1.6,vy:-.4-Math.random(),l:.8,r:1.6+Math.random()*1.4,c:pr.k==='snack'?'#ffb03d':'#fff6d0'});f.sq=.93;}var x=f.cx-camera.x+(f.face||1)*f.w*.42,y=f.cy-camera.y+f.h*.05,k=(t-pr.t0)/1000;ctx.save();ctx.translate(x,y);
    if(pr.k==='book'){ctx.rotate(-.1*(f.face||1));ctx.fillStyle='#8a2a3a';ctx.fillRect(-12,-9,24,16);ctx.fillStyle='#fff8ec';ctx.beginPath();ctx.moveTo(0,-8);ctx.quadraticCurveTo(-6,-11,-11,-8);ctx.lineTo(-11,6);ctx.quadraticCurveTo(-6,3,0,6);ctx.quadraticCurveTo(6,3,11,6);ctx.lineTo(11,-8);ctx.quadraticCurveTo(6,-11,0,-8);ctx.fill();ctx.strokeStyle='rgba(60,40,40,.4)';ctx.lineWidth=.8;for(var l=0;l<3;l++){ctx.beginPath();ctx.moveTo(-9,-4+l*3);ctx.lineTo(-2,-4+l*3);ctx.moveTo(2,-4+l*3);ctx.lineTo(9,-4+l*3);ctx.stroke();}if(Math.floor(k*1.2)%2){ctx.fillStyle='rgba(255,248,236,.9)';ctx.beginPath();ctx.moveTo(0,-8);ctx.quadraticCurveTo(5*Math.cos(k*6),-14,8*Math.cos(k*6),-8);ctx.lineTo(8*Math.cos(k*6),5);ctx.lineTo(0,6);ctx.fill();}}
    else if(pr.k==='popcorn'){ctx.fillStyle='#e8322a';ctx.beginPath();ctx.moveTo(-8,-6);ctx.lineTo(8,-6);ctx.lineTo(6,10);ctx.lineTo(-6,10);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-3,-6,3,16);ctx.fillStyle='#fff6d0';for(var q=0;q<6;q++){ctx.beginPath();ctx.arc(-6+q*2.4,-7-Math.abs(Math.sin(q*1.7))*3,2.6,0,7);ctx.fill();}if(Math.sin(k*5)>.92){ctx.fillStyle='#fff6d0';ctx.beginPath();ctx.arc(-(f.face||1)*10,-16-(k*40%14),2.4,0,7);ctx.fill();}}
    else if(pr.k==='snack'){ctx.fillStyle='#ffd23d';ctx.beginPath();ctx.moveTo(-9,4);ctx.lineTo(9,4);ctx.lineTo(0,-10);ctx.closePath();ctx.fill();ctx.fillStyle='#ff9a3d';ctx.beginPath();ctx.arc(-2,0,1.8,0,7);ctx.arc(3,-3,1.5,0,7);ctx.fill();var bite=Math.min(3,Math.floor(k*1.5));ctx.fillStyle='rgba(0,0,0,0)';ctx.globalCompositeOperation='destination-out';for(var b=0;b<bite;b++){ctx.beginPath();ctx.arc(-6+b*5,-9+b*4,3.4,0,7);ctx.fill();}ctx.globalCompositeOperation='source-over';}
    else if(pr.k==='zzz'){ctx.fillStyle='rgba(255,255,255,.85)';ctx.font="800 12px 'Chakra Petch',sans-serif";for(var z=0;z<3;z++){var zk=(k*0.7+z/3)%1;ctx.globalAlpha=1-zk;ctx.fillText('z',-(f.face||1)*4+zk*14,-f.h*.6-zk*26);}}
    else if(pr.k==='mic'){ctx.fillStyle='#3a3a52';ctx.fillRect(-1.5,-2,3,12);ctx.fillStyle='#c8ccd8';ctx.beginPath();ctx.arc(0,-5,4.5,0,7);ctx.fill();}
    ctx.restore();}

  function others(p,r){var c=propCenter(p);return (fleas||[]).filter(function(f){return f&&!f.hidden&&f!==player&&Math.hypot(f.cx-c.x,f.cy-c.y)<(r||240);});}
  function crowd(p,a,ms,emo){others(p,260).forEach(function(f,i){setTimeout(function(){f.action=a;f.actionT=0;f.actionUntil=now()+(ms||2600);if(emo){f.emoteEmoji=emo;f.emoteT=1400;}},i*120);});}
  function nearestFlea(p,r){var best=null,bd=r||260,c=p?propCenter(p):{x:player.cx,y:player.cy};(fleas||[]).forEach(function(f){if(!f||f.hidden||f===player)return;var d=Math.hypot(f.cx-c.x,f.cy-c.y);if(d<bd){bd=d;best=f;}});return best;}
  function notes(p,ms){p._notesUntil=now()+(ms||3000);}
  function kick(p,dir,pow){if(isHeld(p)){if(heldByPlayer(p))releaseCarry(true);else if(p._heldBy)unwear(p._heldBy,true);}p.vx=dir*(pow||10);p.vy=-(pow||10)*.65;zenSyncTransform(p,false);fx(p,'#2de2ff');}
  function dirTo(p){return propCenter(p).x>=player.cx?1:-1;}
  function tog(p,k,def){var s=S(p);var cur=s[k]===undefined?def:s[k];s[k]=!cur;return s[k];}
  function sitOn(p){var s=S(p),occ=s.occupants||[],sitting=occ.indexOf(zenNet.client)>=0;s.occupants=sitting?occ.filter(function(x){return x!==zenNet.client;}):occ.concat(zenNet.client);zenApplySeat(p,!sitting);}
  function surprise(p){var c=propCenter(p);var t=rnd(['star','heart','diamond','balloon','crown','partyhat','duck','soccer','teddy','cake','gift','icecream']);spawnAt(t,c.x,c.y-p.bh/2-20);flash('Surprise! A '+(NAMES[t]||cap(t))+'!','#ffd23d');ofx(c.x,c.y);}
  function grow(p,d){var s=S(p);s.grow=Math.max(.7,Math.min(1.5,(s.grow||1)+d));}
  function drops(p,col){var c=propCenter(p);for(var i=0;i<10;i++)parts.push({x:c.x+(Math.random()-.5)*p.bw,y:p.by-10,vx:(Math.random()-.5)*1.5,vy:1+Math.random()*2,l:1,r:2,c:col||'#6ad0ff'});}
  function ZP(){return (window.FreaZenPlus&&window.FreaZenPlus.state)||{};}
  var STORIES=['Once upon a time a flea jumped over the moon!','The Great Couch Quest began at dawn...','A tiny flea found a giant crown.','"The End." What a twist!'];
  var WISHES=['I wish for infinite snacks!','I wish to fly higher!','I wish everyone had a hat!','Wish granted! ✨'];
  var PLACES=['Found it: Flea Island!','Spinning to... Jellyville!','Next trip: Mount Hop!','That\u2019s where the Treesh grow!'];

  /* ---------------- per-item action tables: [id,label,fn] ---------------- */
  var SEAT=[['sit','Sit / Hop off',function(p){sitOn(p);}],['bounce','Bounce on it',function(p){zsync(p,'bounce');if(player.stuck)player.launch(0,-16);}]];
  var PLANT=[['water','Water',function(p){grow(p,.12);drops(p);zsync(p,'water');flash(nm(p)+' is growing!','#39ff7a');}],['trim','Trim',function(p){grow(p,-.12);zsync(p,'shake');}],['smell','Smell',function(p){F('wiggle',1600);sayP('Mmm, fresh!');fx(p,'#ff9ac8');zsync(p,'bloom');}]];
  var LAMP=[['power','Light on / off',function(p){var v=tog(p,'on',true);zsync(p,'toggle');flash(v?'Light on':'Light off','#ffd23d');}],['color','Change color',function(p){var i=PAL.indexOf(p.decoCol);p.decoCol=PAL[(i+1)%PAL.length];S(p).color=((S(p).color||0)+1)%5;zsync(p,'glow');}]];
  var MUSIC=function(verb,a){return [['play',verb,function(p){stage(p,'front',null,3200);var s=S(p);s.playing=true;s.playUntil=now()+3200;notes(p,3200);F(a,3200);zsync(p,'play');}],['band','Start a band',function(p){notes(p,4200);F(a,4200);crowd(p,'headbang',4000,'🎸');zsync(p,'play');flash('Band practice!','#ff3db5');}]];};
  var BALLS=[['kick','Kick',function(p){kick(p,dirTo(p),11);F('karate',700);}],['header','Header',function(p){kick(p,0,0);p.vy=-13;p.vx=(Math.random()-.5)*3;F('jump',800);}],['pass','Pass to a flea',function(p){var f=nearestFlea(p,500);if(!f){flash('No flea nearby to pass to','#ff3db5');return;}var c=propCenter(p);kick(p,f.cx>c.x?1:-1,Math.min(14,5+Math.abs(f.cx-c.x)/40));f.emoteEmoji='⚽';f.emoteT=1500;}]];
  var ZA={
    tv:[['power','Turn on / off',function(p){var v=tog(p,'on',true);zsync(p,'power');flash(v?'TV on':'TV off','#2de2ff');}],['channel','Change channel',function(p){var s=S(p);s.on=true;s.channel=((s.channel||0)+1)%5;zsync(p,'channel');flash(['Cartoons','Flea News','Sports','Music TV','Static!'][s.channel],'#2de2ff');}],['watch','Watch & chill',function(p){S(p).on=true;stage(p,'watch','popcorn',4200);F('sit',4200);sayP(rnd(['Ha! Classic!','Ooh, this part!','One more episode...']));zsync(p,'channel');}],['volume','Volume up',function(p){S(p).on=true;notes(p,2500);zsync(p,'shake');crowd(p,'dance',2500);}]],
    radio:[['power','Play / Stop',function(p){var v=tog(p,'on',false);zsync(p,'power');if(v)crowd(p,'dance',2600);flash(v?'Radio on':'Radio off','#ff3db5');}],['station','Next station',function(p){var s=S(p);s.on=true;s.station=((s.station||0)+1)%4;zsync(p,'channel');flash(['Pop Hits','Flea Funk','Lo-fi Beats','Space Jazz'][s.station],'#ff3db5');}],['party','Dance party',function(p){S(p).on=true;F('dance',4000);crowd(p,'dance',4000,'🎶');zsync(p,'play');}]],
    jukebox:[['power','Play song / Stop',function(p){var v=tog(p,'on',false);zsync(p,'power');if(v){F('dance',3000);crowd(p,'dance',3000);}}],['lights','Party lights',function(p){var z=ZP();z.party=!z.party;S(p).on=true;zsync(p,'glow');flash(z.party?'Party lights!':'Lights off','#ff3db5');}]],
    speaker:[['power','Power',function(p){var v=tog(p,'on',true);zsync(p,'power');}],['bass','Bass boost',function(p){S(p).on=true;notes(p,3000);crowd(p,'headbang',3000,'🔊');F('headbang',3000);zsync(p,'shake');}]],
    lamp:LAMP,floorlamp:LAMP,lavalamp:LAMP,
    couch:SEAT,chair:SEAT,armchair:SEAT,beanbag:SEAT.concat([['flop','Flop in',function(p){sitOn(p);F('squish',1800);}]]),log:SEAT,
    bed:[['nap','Take a nap',function(p){stage(p,'on','zzz',4400);F('lie',4400);sayP('Zzz...');zsync(p,'float');}],['bounce','Bounce!',function(p){if(player.stuck)player.launch(0,-20);zsync(p,'bounce');}],['make','Make the bed',function(p){fx(p,'#fff');zsync(p,'sparkle');flash('So tidy!','#c6ff3d');}],['pillow','Pillow fight!',function(p){F('karate',2400);crowd(p,'karate',2400,'🪶');zsync(p,'shake');}]],
    table:[['set','Set the table',function(p){fx(p,'#ffd23d');zsync(p,'sparkle');}],['drum','Drum on it',function(p){notes(p,2200);F('headbang',2200);zsync(p,'beat');}]],
    bookshelf:[['read','Read a story',function(p){stage(p,'front','book',3800);F('sit',3800);sayP(rnd(STORIES));zsync(p,'open');}],['sort','Rearrange books',function(p){fx(p,'#9b6bff');zsync(p,'shake');}]],
    fridge:[['door','Open / close',function(p){tog(p,'open',false);zsync(p,'open');}],['snack','Grab a snack',function(p){var s0=S(p);s0.open=true;setTimeout(function(){s0.open=false;},1200);stage(p,'front','snack',2600);F('wiggle',2600);sayP(rnd(['Nom nom!','Cheese!','Jelly snack!']));zsync(p,'open');}],['chill','Chill out',function(p){F('squish',1800);sayP('Brrr!');}]],
    piano:MUSIC('Play a tune','dance'),drum:MUSIC('Drum solo','headbang'),guitar:MUSIC('Rock out','headbang'),
    clock:[['time','Check time',function(p){var d=new Date();sayP('It\u2019s '+d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}));zsync(p,'bounce');}],['warp','Time warp',function(p){var z=ZP(),o=['day','sunset','night'];z.tod=o[(o.indexOf(z.tod||'day')+1)%3];zsync(p,'time');flash('Time warp: '+cap(z.tod),'#9b6bff');}],['alarm','Ring alarm',function(p){zsync(p,'alarm');crowd(p,'jump',1500,'⏰');F('jump',1500);}]],
    mirror:[['pose','Strike a pose',function(p){stage(p,'watch',null,1800);F(rnd(['bow','wave','cheer']),1800);fx(p,'#fff');zsync(p,'shine');}],['admire','Admire myself',function(p){sayP('Looking good!');if(player){player.emoteEmoji='😍';player.emoteT=1500;}zsync(p,'shine');}]],
    fireplace:[['fire','Light / put out',function(p){var v=tog(p,'on',true);zsync(p,'light');}],['warm','Warm up',function(p){S(p).on=true;F('sit',3000);sayP('Toasty!');}]],
    campfire:[['fire','Light / put out',function(p){tog(p,'on',true);zsync(p,'light');}],['roast','Roast marshmallow',function(p){S(p).on=true;F('sit',2600);sayP('Golden brown!');}],['sing','Campfire song',function(p){S(p).on=true;notes(p,4000);F('dance',4000);crowd(p,'dance',4000,'🎵');}]],
    plant:PLANT,flower:PLANT,sunflower:[PLANT[0],PLANT[1],['sun','Face the sun',function(p){S(p).turn=S(p).turn?0:.5;zsync(p,'turn');}]],bush:[PLANT[0],['rustle','Rustle',function(p){S(p).rustle=true;setTimeout(function(){S(p).rustle=false;},900);zsync(p,'rustle');}],['hide','Hide inside',function(p){F('peek',3000);sayP('You can\u2019t see me!');}],['berries','Pick berries',function(p){tog(p,'berries',true);sayP('Yum, berries!');}]],
    tree:[PLANT[0],['shake','Shake for apples',function(p){var s=S(p);s.apples=s.apples==null?4:s.apples;zsync(p,'shake');if(s.apples>0){s.apples--;drops(p,'#ff4d5e');sayP('Crunch! Apple!');}else{s.apples=4;sayP('Apples grew back!');}}],['climb','Climb',function(p){player.launch(0,-18);}]],
    cactus:[PLANT[0],['poke','Poke (ouch!)',function(p){zsync(p,'poke');player.launch(-dirTo(p)*8,-8);sayP('OUCH!');}],['bloom','Make it bloom',function(p){tog(p,'bloom',false);zsync(p,'bloom');}]],
    pumpkin:[['carve','Carve a face',function(p){var s=S(p);s.face=((s.face||0)+1)%4;zsync(p,'shake');}],['glow','Light up',function(p){tog(p,'on',false);zsync(p,'glow');}]],
    palm:[['coconut','Drop coconut',function(p){var s=S(p);s.coconuts=s.coconuts==null?3:s.coconuts;zsync(p,'shake');if(s.coconuts>0){s.coconuts--;var c=propCenter(p);spawnAt('soccer',c.x,p.by+20);}else{s.coconuts=3;}}],['relax','Relax in shade',function(p){F('lie',3500);}]],
    rock:[['skip','Skip it',function(p){kick(p,dirTo(p),9);}],['flex','Strong pose',function(p){F('cheer',1600);zsync(p,'flex');}]],
    boulder:[['flex','Lift it (try!)',function(p){F('stomp',2000);zsync(p,'flex');sayP('Hnnngh!');}],['sit','Sit on top',function(p){sitOn(p);}]],
    balloon:[['hold','Hold string',function(p){zenStartCarry(p,{mode:'sway'});}],['inflate','Inflate',function(p){var s=S(p);s.inflate=(s.inflate||0)+1;zsync(p,'pulse');if(s.inflate>3){pop(p);}}],['pop','Pop!',function(p){pop(p);}]],
    beachball:BALLS,soccer:BALLS,
    star:[['wish','Make a wish',function(p){sayP(rnd(WISHES));fx(p,'#ffd23d');zsync(p,'wish');}]],
    heart:[['love','Share the love',function(p){var f=nearestFlea(p,400);if(f){f.emoteEmoji='💖';f.emoteT=2000;f.action='cheer';f.actionT=0;f.actionUntil=now()+1600;}fx(p,'#ff3db5');zsync(p,'love');}]],
    diamond:[['polish','Polish',function(p){F('wiggle',1400);fx(p,'#7af0ff');zsync(p,'shine');}]],
    bone:[['fetch','Throw for fetch',function(p){kick(p,dirTo(p)||1,13);var f=nearestFlea(p,700);if(f&&typeof aiLeap==='function'){setTimeout(function(){var c=propCenter(p);if(f.stuck)aiLeap(f,{x:c.x,y:c.y-10});f.emoteEmoji='🐶';f.emoteT=1600;},600);}}]],
    tire:[['spin','Spin it',function(p){p._rot=(p._rot||0);var n=0,iv=setInterval(function(){p._rot+=.5;if(++n>30)clearInterval(iv);},30);zsync(p,'spin');}],['roll','Roll',function(p){kick(p,dirTo(p),7);p.vy=-1;}]],
    crate:[['open','Open / close',function(p){var v=tog(p,'open',false);zsync(p,'open');if(v&&!S(p).looted){S(p).looted=true;surprise(p);}}]],
    gift:[['open','Open gift',function(p){if(S(p).open){S(p).open=false;zsync(p,'bounce');flash('Re-wrapped!','#ff3db5');return;}S(p).open=true;zsync(p,'open');surprise(p);}]],
    present:[['untie','Untie bow',function(p){fx(p,'#ff3db5');zsync(p,'bop');}]],
    candle:[['light','Light / blow out',function(p){var v=tog(p,'on',true);zsync(p,'toggle');}],['wish','Make a wish',function(p){S(p).on=false;sayP(rnd(WISHES));fx(p,'#ffd23d');}]],
    block:[['letter','Change letter',function(p){var L=['F','R','E','A','!','★'],s=S(p);s.letter=L[(L.indexOf(s.letter||'F')+1)%L.length];zsync(p,'bounce');}],['color','Change color',function(p){var i=PAL.indexOf(p.decoCol);p.decoCol=PAL[(i+1)%PAL.length];zsync(p,'glow');}]],
    crystal:[['charge','Charge up',function(p){var s=S(p);s.charge=Math.min(3,(s.charge||0)+1);zsync(p,'charge');}],['zap','Release energy',function(p){S(p).charge=0;crowd(p,'jump',1400,'⚡');fx(p,'#b06aff');ofx(propCenter(p).x,propCenter(p).y);}]],
    trampoline:[['bounce','Bounce',function(p){if(player.stuck)player.launch(0,-22);zsync(p,'bounce');}],['mega','MEGA bounce',function(p){if(player.stuck)player.launch(0,-32);zsync(p,'bounce');flash('Sky high!','#c6ff3d');}]],
    conveyor:[['reverse','Reverse belt',function(p){tog(p,'reverse',false);zsync(p,'reverse');}],['speed','Fast / slow',function(p){tog(p,'fast',false);zsync(p,'spin');}]],
    spinner:[['fast','Spin faster / slower',function(p){tog(p,'fast',false);zsync(p,'spin');}]],
    mushroom:[['boing','Boing!',function(p){if(player.stuck)player.launch(0,-20);zsync(p,'bounce');}],['grow','Grow',function(p){grow(p,.15);zsync(p,'grow');}]],
    rug:[['ride','Magic carpet',function(p){zsync(p,'wave');F('jump',1600);}]],
    arcade:[['play','Play a game',function(p){S(p).on=true;stage(p,'front',null,2600);F('cheer',2400);sayP('High score: '+(1000+(Math.random()*9000|0))+'!');zsync(p,'play');}],['power','Power',function(p){tog(p,'on',true);zsync(p,'power');}]],
    computer:[['type','Type away',function(p){S(p).on=true;stage(p,'front',null,2400);F('wiggle',2200);sayP(rnd(['Tap tap tap...','Posting to FleaGram','Coding a game!']));zsync(p,'shake');}],['power','Power',function(p){tog(p,'on',true);zsync(p,'power');}]],
    aquarium:[['feed','Feed fish',function(p){drops(p,'#ffd23d');sayP('Blub blub!');zsync(p,'bounce');}],['tap','Tap the glass',function(p){zsync(p,'shake');sayP('Hi fishies!');}]],
    stove:[['cook','Cook pancakes',function(p){var s=S(p);s.on=true;s.offAt=now()+4500;F('wiggle',2500);sayP('Flip!');zsync(p,'shake');}],['off','Turn off',function(p){S(p).on=false;zsync(p,'power');}]],
    fan:[['power','On / off',function(p){var v=tog(p,'on',false);zsync(p,'power');flash(v?'Whoosh! (blows light things away)':'Fan off','#2de2ff');}],['speed','Speed',function(p){var s=S(p);s.on=true;s.speed=((s.speed||1)%3)+1;zsync(p,'spin');flash('Fan speed '+s.speed,'#2de2ff');}]],
    telescope:[['gaze','Stargaze',function(p){ZP().tod='night';F('peek',2600);sayP('A shooting star!');zsync(p,'turn');}],['aim','Aim',function(p){var s=S(p);s.aim=((s.aim||0)+.3)%.9;zsync(p,'turn');}]],
    discoball:[['party','Party!',function(p){var z=ZP();z.party=!z.party;tog(p,'on',true);S(p).on=true;crowd(p,'dance',4000,'🪩');F('dance',4000);zsync(p,'spin');}],['lights','Lights on / off',function(p){tog(p,'on',true);zsync(p,'toggle');}]],
    globe:[['spin','Spin the globe',function(p){var s=S(p);s.spin=1;s.spinUntil=now()+3000;zsync(p,'spin');}],['find','Find a place',function(p){var s=S(p);s.spin=1;s.spinUntil=now()+1500;sayP(rnd(PLACES));}]],
    gumball:[['get','Get a gumball',function(p){var s=S(p);s.left=s.left==null?14:s.left;if(s.left<=0){sayP('Empty!');return;}s.left--;F('wiggle',1400);sayP('Chewy!');zsync(p,'shake');}],['refill','Refill',function(p){S(p).left=14;zsync(p,'bounce');}]],
    piggybank:[['coin','Deposit coin',function(p){var s=S(p);s.coins=(s.coins||0)+1;ofx(propCenter(p).x,p.by);zsync(p,'bounce');}],['shake','Shake it',function(p){zsync(p,'shake');sayP('Clink clink!');}]],
    teddy:[['hug','Hug',function(p){F('wiggle',1800);if(player){player.emoteEmoji='🤗';player.emoteT=1600;}fx(p,'#ff9ac8');zsync(p,'love');}],['cuddle','Cuddle nap',function(p){F('lie',3500);sayP('Zzz...');}]],
    toycar:[['vroom','Vroom!',function(p){var s=S(p);s.drive=now()+1600;s.dir=player.face||1;zsync(p,'bounce');sayP('Vroom vroom!');}],['honk','Honk',function(p){sayP('Beep beep!');zsync(p,'shake');}]],
    skateboard:[['ride','Kickflip!',function(p){F('flip',1500);p.vx=(player.face||1)*6;p._rot=(p._rot||0)+TAU;zsync(p,'bounce');}],['push','Push it',function(p){kick(p,dirTo(p),7);p.vy=-1;}]],
    duck:[['squeak','Squeak',function(p){S(p).squeak=now();sayP('SQUEAK!');zsync(p,'bounce');}],['float','Float',function(p){p.vy=-6;zsync(p,'float');}]],
    cone:[['shout','Megaphone',function(p){sayP('HELLO FLEAS!');crowd(p,'jump',1200,'📣');}]],
    umbrella:[['open','Open / close',function(p){tog(p,'open',true);zsync(p,'bounce');}]],
    bucket:[['fill','Fill / empty',function(p){var v=tog(p,'full',false);if(!v)drops(p);zsync(p,'bounce');}],['splash','Splash!',function(p){S(p).full=false;drops(p);crowd(p,'squish',1400,'💦');zsync(p,'splash');}]],
    wateringcan:[['water','Water nearby plants',function(p){var c=propCenter(p),n=0;platforms.forEach(function(q){if(q.deco&&/plant|flower|sunflower|tree|bush|cactus|mushroom|palm/.test(q.deco)&&Math.hypot(propCenter(q).x-c.x,propCenter(q).y-c.y)<260){grow(q,.12);drops(q);zsync(q,'water');n++;}});flash(n?('Watered '+n+' plant'+(n>1?'s':'')+'!'):'No plants nearby','#39ff7a');drops(p);}]],
    snowman:[['hat','Add / remove hat',function(p){tog(p,'hat',false);zsync(p,'bounce');}],['scarf','Scarf',function(p){tog(p,'scarf',true);zsync(p,'bounce');}],['snowball','Snowball fight',function(p){F('karate',2400);crowd(p,'karate',2400,'❄');}]],
    cake:[['blow','Blow candles',function(p){S(p).on=false;F('cheer',2000);crowd(p,'cheer',2000,'🎉');flash('Happy FREA day!','#ff3db5');zsync(p,'bounce');}],['eat','Eat a slice',function(p){var s=S(p);s.slices=s.slices==null?6:s.slices;if(s.slices<=0){s.slices=6;s.on=true;sayP('Fresh cake!');}else{s.slices--;sayP('Yum!');F('wiggle',1200);}zsync(p,'shake');}],['light','Light candles',function(p){S(p).on=true;zsync(p,'glow');}]],
    pizza:[['eat','Eat a slice',function(p){var s=S(p);s.slices=s.slices==null?8:s.slices;if(s.slices<=0){s.slices=8;sayP('Another pizza!');}else{s.slices--;sayP('Cheesy!');F('wiggle',1200);}zsync(p,'shake');}],['share','Share',function(p){crowd(p,'cheer',1600,'🍕');}]],
    icecream:[['lick','Lick',function(p){var s=S(p);s.scoops=s.scoops==null?2:s.scoops;if(s.scoops<=0)s.scoops=2;else s.scoops--;sayP('Brain freeze!');zsync(p,'shake');}],['flavor','New flavor',function(p){S(p).flavor=((S(p).flavor||0)+1)%5;zsync(p,'bounce');}]],
    watermelon:[['slice','Slice / eat',function(p){var v=tog(p,'cut',false);sayP(v?'Juicy!':'Whole again?!');zsync(p,'shake');}]],
    partyhat:[['horn','Party horn',function(p){sayP('TOOT TOOT!');crowd(p,'cheer',1600,'🎉');}]],
    crown:[['royal','Royal wave',function(p){F('wave',2400);sayP('Greetings, subjects!');crowd(p,'bow',2000,'👑');}]]
  };
  function pop(p){var c=propCenter(p);for(var i=0;i<16;i++){var a=Math.random()*TAU,s=2+Math.random()*4;parts.push({x:c.x,y:c.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,r:2+Math.random()*2,c:rnd(PAL)});}if(heldByPlayer(p))releaseCarry(true);if(p._heldBy)unwear(p._heldBy,true);var i2=platforms.indexOf(p);if(i2>=0)platforms.splice(i2,1);try{if(p.zenId)zenSend('delete',p.zenId,{});}catch(e){}flash('POP!','#ff3db5');}

  /* ---------------- generic moves ---------------- */
  function throwIt(){var p=releaseCarry(true);if(!p)return;var d=player.face||1;p.vx=d*9;p.vy=-7;zenSyncTransform(p,false);F('karate',500);flash('Yeet!','#2de2ff');}
  function dropIt(){if(!player||!player.carry)return;var p=player.carry;zenDropCarry();p.vy=0;}
  function placeOn(s){var p=releaseCarry(true);if(!p||!s)return;var c=propCenter(p);p._shift(s.cenx-c.x+(Math.random()-.5)*6,(s.by-p.bh/2-1)-c.y);p.vx=0;p.vy=0;zenSyncTransform(p,false);fx(p,'#c6ff3d');flash('Placed on the '+nm(s),'#c6ff3d');}
  function giveTo(f){var p=player&&player.carry;if(!p||!f)return;releaseCarry(true);if(wearable(p))wear(p,f);else{var c=propCenter(p);p._shift(f.cx-c.x,f.y-40-c.y);}flash('Gave '+nm(p)+' to '+f.name,'#ffd23d');}
  window.zenPlay={wear:wear,unwear:unwear,throwIt:throwIt,dropIt:dropIt,placeOn:placeOn,giveTo:giveTo,actions:ZA};

  /* ---------------- context menu ---------------- */
  function btn(id,label,fn,cls){var b=document.createElement('button');b.type='button';b.setAttribute('data-testid','zen-action-'+id);b.setAttribute('role','menuitem');b.textContent=label;if(cls)b.className=cls;b.addEventListener('click',function(e){e.stopPropagation();closeZenContext();try{fn();}catch(err){console.warn(err);}});return b;}
  openZenContext=function(p,sx,sy){var m=el('zen-context-menu');if(!m)return;var vz=(typeof VZ_UI!=='undefined'?VZ_UI:1);sx*=vz;sy*=vz;zenContext.object=p;m.innerHTML='';
    var hd=document.createElement('div');hd.className='zcm-title';hd.id='zcm-title';hd.textContent=nm(p)+(p._heldBy?' · on '+(p._heldBy===player?'your':p._heldBy.name+'\u2019s')+' head':'');m.appendChild(hd);
    var main=document.createElement('div');main.className='zcm-group';var gen=document.createElement('div');gen.className='zcm-group zcm-gen';
    var carrying=player&&player.carry&&player.carry!==p&&(player.carryMode==='juggle'||player.carryMode==='sway');
    if(p._heldBy){gen.appendChild(btn('takeoff',p._heldBy===player?'Take it off':'Take it off '+p._heldBy.name,function(){var f=p._heldBy;unwear(f);if(f!==player){f.emoteEmoji='😮';f.emoteT=1200;}}));if(p._heldBy!==player)gen.appendChild(btn('steal','Put it on MY head',function(){wear(p,player);}));}
    else if(heldByPlayer(p)){gen.appendChild(btn('drop','Drop',dropIt));gen.appendChild(btn('throw','Throw',throwIt));if(wearable(p))gen.appendChild(btn('wear','Put on my head',function(){wear(p,player);}));var nf=nearestFlea(null,260);if(nf)gen.appendChild(btn('give','Give to '+nf.name,function(){giveTo(nf);}));if(Z.surface)gen.appendChild(btn('place','Place on '+nm(Z.surface),function(){placeOn(Z.surface);}));}
    else{
      if(carrying&&p.kind!=='circle'){var cn=nm(player.carry);gen.appendChild(btn('placeon','Put '+cn+' on top',function(){placeOn(p);},'zcm-hi'));}
      if(heavy(p))gen.appendChild(btn('move','Push left / right',function(){zenStartPush(p,{mode:'push',heavy:true});}));
      else{gen.appendChild(btn('move','Pick up',function(){zenStartCarry(p,{mode:p.deco==='balloon'?'sway':'juggle'});}));
        if(wearable(p)){gen.appendChild(btn('wear','Put on my head',function(){wear(p,player);}));var f2=nearestFlea(p,260);if(f2)gen.appendChild(btn('wear-flea','Put on '+f2.name+'\u2019s head',function(){wear(p,f2);}));}
        if(ZA[p.deco]!==BALLS)gen.appendChild(btn('kickit','Kick',function(){kick(p,dirTo(p),heavy(p)?4:8);F('karate',600);}));}}
    var acts=ZA[p.deco]||[['inspect','Inspect',function(q){zsync(q,'bounce');fx(q);}]];
    acts.forEach(function(a,i){main.appendChild(btn(i===0?'interact':('act-'+a[0]),a[1],function(){a[2](p);if(i===0&&typeof bump==='function'){try{bump('zenInteractions');}catch(e){}}},'zcm-act'));});
    m.appendChild(main);if(gen.children.length){var sep=document.createElement('div');sep.className='zcm-sep';sep.textContent='Move';m.appendChild(sep);m.appendChild(gen);}
    m.appendChild(btn('close','Close',function(){},'zcm-close'));
    m.classList.add('show');var r=m.getBoundingClientRect(),mw=r.width||260,mh=r.height||200;m.style.left=Math.max(10,Math.min(innerWidth-mw-10,sx+14))+'px';m.style.top=Math.max(64,Math.min(innerHeight-mh-10,sy-40))+'px';};

  /* ---------------- carry bar (always-visible controls while holding/wearing) ---------------- */
  var bar=document.createElement('div');bar.id='zen-carry-bar';bar.setAttribute('data-testid','zen-carry-bar');bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Item controls');document.body.appendChild(bar);
  function bb(id,label,fn,hi){var b=document.createElement('button');b.type='button';b.setAttribute('data-testid','zen-carry-'+id);b.textContent=label;if(hi)b.className='hi';b.addEventListener('click',function(e){e.stopPropagation();fn();refreshBar(true);});return b;}
  function refreshBar(force){if(gameMode!=='zen'||STATE!=='play'||!player){bar.classList.remove('show');Z.lastBar='';return;}
    var c=player.carry,holding=c&&(c.carryMode!=='push'),w=player._wornItem,nf=holding?nearestFlea(null,260):null;
    var key=[c&&c.zenId,player.carryMode,w&&w.zenId,Z.surface&&Z.surface.zenId,nf&&nf.name].join('|');if(!force&&key===Z.lastBar)return;Z.lastBar=key;
    bar.innerHTML='';if(!c&&!w){bar.classList.remove('show');return;}
    if(c){var lab=document.createElement('span');lab.className='zcb-lab';lab.textContent=(player.carryMode==='push'||player.carryMode==='roll'?'Pushing ':'Holding ')+nm(c);bar.appendChild(lab);
      if(player.carryMode==='push'||player.carryMode==='roll')bar.appendChild(bb('release','Let go',function(){zenDropCarry();}));
      else{bar.appendChild(bb('drop','Drop',dropIt));bar.appendChild(bb('throw','Throw',throwIt));if(wearable(c))bar.appendChild(bb('wear','Wear',function(){wear(c,player);}));if(Z.surface)bar.appendChild(bb('place','Place on '+nm(Z.surface),function(){placeOn(Z.surface);},true));if(nf)bar.appendChild(bb('give','Give '+nf.name,function(){giveTo(nf);}));}}
    if(w){var l2=document.createElement('span');l2.className='zcb-lab';l2.textContent='Wearing '+nm(w);bar.appendChild(l2);bar.appendChild(bb('takeoff','Take off',function(){unwear(player);}));}
    bar.classList.add('show');}

  /* ---------------- proximity + AI + restore (runs every frame via loop hook) ---------------- */
  function findNear(){Z.near=null;Z.surface=null;if(gameMode!=='zen'||!player||STATE!=='play')return;var best=null,bd=110,bs=null,bsd=150,holding=player.carry&&player.carryMode!=='push'&&player.carryMode!=='roll';
    for(var i=3;i<platforms.length;i++){var p=platforms[i];if(!p.deco||p._heldBy||heldByPlayer(p))continue;var dx=Math.max(p.bx-player.cx,0,player.cx-(p.bx+p.bw)),dy=Math.max(p.by-player.cy,0,player.cy-(p.by+p.bh)),d=Math.hypot(dx,dy);
      if(holding){if(p.kind!=='circle'&&p.bw>=30&&d<bsd&&!(p.phys&&p.phys.float)){bsd=d;bs=p;}}else if(d<bd){bd=d;best=p;}}
    Z.near=best;Z.surface=bs;}
  function aiTick(){var t=now();if(t-Z.lastAI<900)return;Z.lastAI=t;
    (fleas||[]).forEach(function(f){if(!f||f.isP||f===player||f.hidden||f.infected)return;if(Math.random()>.12)return;
      if(f._wornItem&&Math.random()<.12){unwear(f,true);f.emoteEmoji='🙃';f.emoteT=1200;return;}
      var cand=[];for(var i=3;i<platforms.length;i++){var p=platforms[i];if(!p.deco||isHeld(p))continue;var c=propCenter(p);if(Math.hypot(c.x-f.cx,c.y-f.cy)<170)cand.push(p);}if(!cand.length)return;var p2=rnd(cand),ty=p2.deco;
      if(ROLL[ty]&&ty!=='rock'){kick(p2,propCenter(p2).x>f.cx?1:-1,8);f.action='karate';f.actionT=0;f.actionUntil=t+700;return;}
      if(ty==='bed'&&f.stuck){stageF(f,p2,'on','zzz',6000);f.action='lie';f.actionT=0;f.actionUntil=t+6000;f.emoteEmoji='😴';f.emoteT=1400;return;}
      if(/couch|chair|beanbag|armchair|log/.test(ty)&&f.stuck){var c2=propCenter(p2);f.x=c2.x-f.w/2+(Math.random()-.5)*p2.bw*.4;f.y=p2.by-f.h*.9;f.vx=f.vy=0;f.action='sit';f.actionT=0;f.actionUntil=t+4000;var tv=null;for(var q=3;q<platforms.length;q++){if(platforms[q].deco==='tv'&&Math.abs(propCenter(platforms[q]).x-c2.x)<420){tv=platforms[q];break;}}if(tv){S(tv).on=true;f._lookAt={p:tv,until:t+4000};f._prop={k:'popcorn',until:t+4000,t0:t};f.face=propCenter(tv).x>f.cx?1:-1;}return;}
      if(ty==='bookshelf'&&f.stuck){stageF(f,p2,'front','book',4800);f.action='sit';f.actionT=0;f.actionUntil=t+4800;f.emoteEmoji='📖';f.emoteT=1200;return;}
      if(/fridge|stove|cake|table|icecream|gumball/.test(ty)&&f.stuck){stageF(f,p2,'front','snack',3600);f.action='wiggle';f.actionT=0;f.actionUntil=t+3600;f.emoteEmoji=rnd(['😋','🍓','🍪']);f.emoteT=1200;if(ty==='fridge'){S(p2).open=true;setTimeout(function(){S(p2).open=false;},900);}return;}
      if(/plant|flower|sunflower|bigplant|cactus/.test(ty)&&f.stuck){stageF(f,p2,'front',null,2200);drops(p2);grow(p2,.05);f.action='wiggle';f.actionT=0;f.actionUntil=t+2000;f.emoteEmoji='🌱';f.emoteT=1200;return;}
      if(/microphone|karaoke/.test(ty)&&f.stuck){stageF(f,p2,'front','mic',3600);notes(p2,3600);f.action='sing';f.actionT=0;f.actionUntil=t+3600;return;}
      if(/piano|drum|guitar|radio|jukebox|speaker/.test(ty)){notes(p2,2600);f.action=ty==='piano'?'dance':'headbang';f.actionT=0;f.actionUntil=t+2600;if(/radio|jukebox|speaker/.test(ty))S(p2).on=true;return;}
      if((ty==='trampoline'||ty==='mushroom')&&f.stuck){f.launch((Math.random()-.5)*4,-20);return;}
      if(wearable(p2)&&!f._wornItem&&Math.random()<.5){wear(p2,f);return;}
      if(/tv|arcade|computer/.test(ty)&&f.stuck){S(p2).on=true;stageF(f,p2,'watch',ty==='tv'?'popcorn':null,5000);f.action='sit';f.actionT=0;f.actionUntil=t+5000;return;}
      f.emoteEmoji=rnd(['👀','✨','🤔','😄']);f.emoteT=1200;});}
  function restoreHat(){if(Z.restored||gameMode!=='zen'||STATE!=='play'||!player)return;Z.restored=true;var d=null;try{d=JSON.parse(localStorage.getItem('frea_zen_worn')||'null');}catch(e){}if(!d||!d.type||!ZEN_OBJECT_CATALOG[d.type])return;setTimeout(function(){if(gameMode!=='zen'||!player)return;var p=spawnZen(d.type);if(p&&p.deco===d.type){if(d.col)p.decoCol=d.col;p.zenState=Object.assign({},d.state||{});wear(p,player);}},400);}
  var _uzc=updateZenCarry;
  updateZenCarry=function(dt){_uzc(dt);findNear();aiTick();restoreHat();refreshBar(false);};
  /* reset between sessions */
  setInterval(function(){if(gameMode!=='zen'||STATE!=='play'){if(Z.restored){Z.restored=false;}if(bar.classList.contains('show'))refreshBar(true);}},700);

  /* ---------------- keyboard: E = interact nearest, G = drop, T = throw ---------------- */
  document.addEventListener('keydown',function(e){if(gameMode!=='zen'||STATE!=='play'||!player)return;var tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA')return;var k=(e.key||'').toLowerCase();
    if(k==='e'){var p=Z.near||(player.carry&&Z.surface)||player.carry||player._wornItem;if(p){var c=propCenter(p);openZenContext(p,c.x-camera.x,c.y-camera.y);e.preventDefault();}}
    else if(k==='g'&&player.carry){dropIt();refreshBar(true);}
    else if(k==='t'&&player.carry){throwIt();refreshBar(true);}});

  /* ---------------- test hook ---------------- */
  window.__zenPlay=function(){return {near:Z.near&&Z.near.deco,surface:Z.surface&&Z.surface.deco,carry:player&&player.carry&&player.carry.deco,carryMode:player&&player.carryMode,worn:(fleas||[]).filter(function(f){return f._wornItem;}).map(function(f){return {flea:f.name,isPlayer:f===player,item:f._wornItem.deco};}),
    objects:platforms.filter(function(p){return p.deco;}).map(function(p){return {id:p.zenId,type:p.deco,x:Math.round(p.cenx),y:Math.round(p.ceny),state:p.zenState||{},held:isHeld(p)};}),actionsFor:function(t){return (ZA[t]||[]).map(function(a){return a[1];});},types:Object.keys(ZEN_OBJECT_CATALOG)};};
  window.__zenPlayApi={screenOf:function(o){var x=o.cx!=null?o.cx:o.cenx,y=o.cy!=null?o.cy:o.ceny;return {x:(x-camera.x)*VZ_UI,y:(y-camera.y)*VZ_UI};},fleas:function(){return fleas;},player:function(){return player;},spawn:function(t){return spawnZen(t);},open:function(p){var c=propCenter(p);openZenContext(p,c.x-camera.x,c.y-camera.y);},find:function(t){for(var i=platforms.length-1;i>=3;i--)if(platforms[i].deco===t)return platforms[i];return null;},teleportNear:function(p){if(!p||!player)return;var c=propCenter(p);player.x=c.x-60-player.w/2;player.y=p.by+p.bh-player.h;player.vx=player.vy=0;}};
})();
