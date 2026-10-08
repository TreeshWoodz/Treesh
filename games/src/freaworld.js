/* ===================== FREA WORLD (Zen) =====================
   A Club-Penguin-style curated region of six lands, reached from the Zen chooser.
   · World map overlay → pick a land → travel (each land = its own scene, layout, climate & activity)
   · Walk to a land's edge signpost to hop to the neighbouring land
   · Every land: 3 hidden Frea Gems + a signature activity; Passport collects 3 stamps per land
   Lands: Xccitia (neon city) · Zandland (desert) · Mazi (jungle) · Yana (snow) · Lucille (sky gardens) · Muma (lagoon) */
var FreaWorld=(function(){
  var TAU=Math.PI*2,SK='frea_world_v1';
  var ORDER=['xccitia','zandland','mazi','yana','lucille','muma'];
  var M=function(a,b){return {mat:[a,b]};};
  var LANDS={
    xccitia:{name:'Xccitia',tag:'The Neon Megacity',col:'#ff3db5',col2:'#2de2ff',climate:{i:'🌧',l:'Neon drizzle',t:'24°C'},
      desc:'A city that never sleeps. Rooftop hops, a maglev tram and the hottest dance floor in Frea World.',
      act:{k:'dance',n:'Dance Fever',v:'Light up dance tiles',goal:12,i:'💃'},
      plats:[[.07,150,180,M('#1a1040','#ff3db5')],[.19,260,140,M('#1a1040','#2de2ff')],[.29,170,120,M('#1a1040','#ff3db5')],[.62,220,150,{mv:['x',240,.0009],mat:['#2a1a5a','#2de2ff']}],[.75,330,150,M('#1a1040','#c6ff3d')],[.87,180,170,M('#1a1040','#ff3db5')],[.5,420,90,M('#2a1a5a','#ffd23d')]],
      props:[['jukebox',.37,0],['lavalamp',.08,150],['radio',.3,170],['cone',.6,0],['skateboard',.67,0],['block',.93,0]],
      gems:[[.2,320],[.5,480],[.76,390]],
      lines:['The lights here never sleep!','Have you tried the dance floor?','Next tram in 3… 2… 1…','I love the drizzle, it sparkles.','Neon is my favourite colour.']},
    zandland:{name:'Zandland',tag:'Sun-baked Dunes',col:'#ffb03d',col2:'#ff7a3d',climate:{i:'☀',l:'Scorching · sandstorms',t:'41°C'},
      desc:'Endless dunes, ancient pyramids and buried relics. Watch out — the sandstorms push you around!',
      act:{k:'dig',n:'Relic Hunter',v:'Dig up buried relics',goal:4,i:'🏺'},
      plats:[[.12,140,200,M('#c0704a','#ffd07a')],[.3,240,150,M('#b0603a','#ffd07a')],[.48,160,180,M('#c0704a','#ffd07a')],[.64,300,130,M('#b0603a','#ffe0a0')],[.8,190,200,M('#c0704a','#ffd07a')]],
      props:[['cactus',.05,0],['boulder',.34,0],['bone',.55,0],['campfire',.7,0],['umbrella',.84,190],['bucket',.5,160],['tire',.96,0]],
      gems:[[.3,300],[.64,360],[.82,250]],digs:[.22,.42,.6,.9],
      lines:['So… hot…','I found a bone once!','Sandstorm! Hold on to your antennae!','The pyramids are older than fleas.','Dig where the X is!']},
    mazi:{name:'Mazi',tag:'Jungle of the Old Temple',col:'#7ae05a',col2:'#ffd23d',climate:{i:'🌦',l:'Humid · tropical showers',t:'31°C'},
      desc:'Vines, waterfalls and bouncy mushrooms around a glowing temple. The jungle is full of fruit.',
      act:{k:'fruit',n:'Forager',v:'Gather jungle fruit',goal:8,i:'🥭'},
      plats:[[.1,160,160,M('#4a6a4a','#9aff7a')],[.24,280,140,M('#4a6a4a','#9aff7a')],[.36,90,90,{pt:'bouncy'}],[.46,220,170,M('#5a6a4a','#ffd23d')],[.6,340,120,M('#4a6a4a','#9aff7a')],[.7,90,90,{pt:'bouncy'}],[.8,200,180,M('#4a6a4a','#9aff7a')],[.92,320,120,M('#5a6a4a','#ffd23d')]],
      props:[['palm',.04,0],['bush',.18,0],['flower',.3,0],['log',.55,0],['drum',.86,0],['mushroom',.42,0]],
      gems:[[.6,430],[.92,410],[.36,260]],fruit:[[.1,195],[.24,315],[.46,255],[.6,375],[.8,235],[.92,355],[.28,40],[.66,40]],
      lines:['Did you hear that? A parrot!','The mushrooms are SO bouncy.','Rain again! I love it.','The temple glows at night…','Mangoes taste like sunshine.']},
    yana:{name:'Yana',tag:'Snowy Mountain Village',col:'#8af0ff',col2:'#ffffff',climate:{i:'❄',l:'Freezing · snowfall',t:'-8°C'},
      desc:'Igloos, a toasty ski lodge and slippery ice ledges. Grab a snowball — a fight is always on.',
      act:{k:'snow',n:'Snowball Champ',v:'Hit fleas with snowballs',goal:5,i:'❄'},
      plats:[[.14,150,170,{pt:'icy'}],[.3,250,150,{pt:'icy'}],[.46,140,160,{pt:'icy'}],[.62,260,150,{pt:'icy'}],[.78,170,180,{pt:'icy'}],[.9,120,200,M('#6a4a3a','#ffd27a')]],
      props:[['snowman',.08,0],['snowman',.55,0],['campfire',.86,0],['present',.4,0],['log',.7,0],['tree',.2,0]],
      gems:[[.3,330],[.62,340],[.92,200]],
      lines:['Brrr! Snowball fight?','The lodge has hot cocoa.','Careful, the ice is slippery!','I built that snowman myself.','Look, the igloo has a door!']},
    lucille:{name:'Lucille',tag:'Floating Sky Gardens',col:'#ff9ac0',col2:'#ffd23d',climate:{i:'🌸',l:'Breezy · petal winds · low gravity',t:'18°C'},
      desc:'Gardens drifting above the clouds at golden hour. Gravity is gentle here — float and catch the sky lanterns.',
      act:{k:'lantern',n:'Lantern Keeper',v:'Catch floating lanterns',goal:6,i:'🏮'},
      plats:[[.1,170,150,{pt:'cloud'}],[.22,300,130,{pt:'cloud'}],[.36,200,140,{pt:'cloud'}],[.5,230,110,{mv:['y',90,.0011],mat:['#c87a5a','#ffd23d'],balloon:'#ff7ab0'}],[.64,330,110,{mv:['y',110,.0009],mat:['#c87a5a','#ffd23d'],balloon:'#8af0ff'}],[.78,240,150,{pt:'cloud'}],[.9,360,130,{pt:'cloud'}]],
      props:[['flower',.05,0],['sunflower',.3,0],['umbrella',.7,0],['telescope',.92,360],['flower',.44,0]],
      gems:[[.22,380],[.64,480],[.9,440]],
      lines:['Wheee, I feel so light!','The lanterns carry wishes.','Don\'t look down!','Sunset lasts forever here.','Petals everywhere!']},
    muma:{name:'Muma',tag:'Lagoon of Rolling Tides',col:'#2de2ff',col2:'#ffd23d',climate:{i:'🌊',l:'Sunny · rolling tides',t:'29°C'},
      desc:'White sand, a warm lagoon and an old lighthouse. The tide rolls in and out — swim, float and beachcomb.',
      act:{k:'shell',n:'Beachcomber',v:'Collect sea shells',goal:6,i:'🐚'},
      plats:[[.56,40,320,M('#8a5a34','#ffd07a')],[.71,120,90,M('#6a6a7a','#c8e8ff')],[.83,180,90,M('#6a6a7a','#c8e8ff')],[.3,170,120,M('#e8e0d0','#ff5a5a')],[.14,130,140,M('#8a5a34','#ffd07a')],[.92,30,120,{mv:['x',110,.0008],mat:['#a87a44','#ffe0a0']}]],
      props:[['palm',.05,0],['umbrella',.2,0],['beachball',.26,0],['bucket',.38,0],['watermelon',.44,0],['icecream',.48,0],['duck',.6,40]],
      gems:[[.83,260],[.3,250],[.98,220]],shells:[.09,.17,.24,.33,.41,.5],
      lines:['The water is so warm!','Tide\'s coming in!','The lighthouse keeper is a flea too.','I found a shiny shell!','Ice cream on the beach, perfect.']}
  };
  /* ---------- arena scenes (registered into the shared Arenas painter) ---------- */
  var SCN={
    xccitia:{name:'Xccitia',sky:['#04021a','#170a40','#5a1a7a'],moon:{x:.82,y:.15,r:.05,c:'#f2e8ff'},stars:70,haze:'#ff3db5',
      layers:[{t:'city',col:'#1c1048',win:['#ff9ac8','#2de2ff'],lit:.3,par:.05,h:340,mist:'#5a1a7a',mistA:.5},{t:'city',col:'#120a32',win:['#2de2ff','#ff3db5','#c6ff3d'],neon:['#2de2ff','#ff3db5','#c6ff3d','#ffd23d'],lit:.45,par:.16,h:300,lo:.5,hi:1},{t:'city',col:'#0a0620',win:['#ffd23d','#ff3db5'],neon:['#ff3db5','#2de2ff'],lit:.5,par:.3,h:200,lo:.4,hi:.95}],
      fx:[{p:'rain',n:80,col:'#ff9ad8'},{p:'motes',n:20,col:'#2de2ff'}],extras:['planes','scan'],pal:{p:'#08303a',a:'#2de2ff',glow:'#ff3db5',bg:'#04021a'},floor:'#140a34',lip:'#2de2ff',floorGlow:'#ff3db5'},
    zandland:{name:'Zandland',sky:['#ff9a5a','#ffc87a','#fff0c0'],sun:{x:.7,y:.2,r:.09,c:['#fffbe0','#ffd07a']},stars:0,haze:'#ffd8a0',clouds:{n:2,col:'#fff4e0',y:[.06,.2],a:.6},
      layers:[{t:'mountains',col:'#c0704a',rim:'#ffe0a0',par:.05,h:240,n:5,lo:.5,hi:.85,facet:.25,mist:'#ffc890',mistA:.5},{t:'hills',col:'#e0a060',top:'#f8d090',rim:'#fff0c0',par:.14,h:160,base:.45,ripples:'#c88a50'},{t:'cactus',col:'#3a7a4a',rim:'#ffe0a0',par:.34,h:190},{t:'hills',col:'#d89050',top:'#f0c080',par:.48,h:70,base:.3,amp:.15,ripples:'#b8783a'}],
      fx:[{p:'dust',n:40,col:'#fff0d0'}],extras:['rays'],pal:{p:'#3a2008',a:'#ffb03d',glow:'#ff7a3d',bg:'#ff9a5a'},floor:'#d8a060',lip:'#f8d898'},
    mazi:{name:'Mazi',sky:['#1a5a4a','#3a8a6a','#c8e8a0'],sun:{x:.3,y:.18,r:.06,c:['#fffbe0','#e8ffb0']},stars:0,haze:'#c8ffb0',clouds:{n:4,col:'#e8fff0',y:[.04,.2],a:.5},
      layers:[{t:'mountains',col:'#2a6a5a',rim:'#c8ffd0',rimA:.3,par:.05,h:280,n:6,mist:'#6ab89a',mistA:.5},{t:'trees',col:'#1f6a3a',top:'#5ac85a',trunk:'#3a2a1a',vines:'rgba(120,220,100,.5)',fruit:'#ffb03d',par:.18,h:300,lo:.6,hi:1,mist:'#3a8a5a',mistA:.4},{t:'palms',col:'#1a5a2a',trunk:'#5a4a2a',par:.32,h:260,n:7},{t:'mushrooms',cols:['#ff6a5a','#ffd23d','#ff9ac8'],par:.46,h:110,n:16}],
      fx:[{p:'fireflies',n:22,col:'#e8ff7a'},{p:'butterflies',n:6}],extras:['rays'],pal:{p:'#0c2a14',a:'#7ae05a',glow:'#c6ff3d',bg:'#1a5a4a'},floor:'#4a3a24',lip:'#5ab84a',tufts:1},
    yana:{name:'Yana',sky:['#6a8ad8','#a8c8f0','#f0f6ff'],sun:{x:.78,y:.2,r:.05,c:['#ffffff','#e0ecff']},stars:0,haze:'#ffffff',clouds:{n:5,col:'#ffffff',y:[.05,.28],a:.8},
      layers:[{t:'mountains',col:'#8aa0d0',snow:'#ffffff',rim:'#ffffff',rimA:.6,par:.04,h:320,n:5,mist:'#c8d8f0',mistA:.5},{t:'pines',col:'#2a4a6a',snow:'#f4f8ff',par:.16,h:240,mist:'#a8c0e0',mistA:.4},{t:'hills',col:'#dce8f8',top:'#ffffff',rim:'#ffffff',par:.32,h:120,base:.4,amp:.2},{t:'pines',col:'#1a3450',snow:'#ffffff',par:.48,h:170,n:12}],
      fx:[{p:'snow',n:90}],pal:{p:'#08303a',a:'#8af0ff',glow:'#8af0ff',bg:'#6a8ad8'},floor:'#e8f0fc',lip:'#ffffff'},
    lucille:{name:'Lucille',sky:['#ff8ab8','#ffb8a0','#ffe8c0'],sun:{x:.5,y:.62,r:.15,c:['#fff4c0','#ff8aa8'],stripes:1},stars:10,haze:'#ffd0e0',rainbow:1,clouds:{n:7,col:'#fff0f6',y:[.08,.5],a:.85},
      layers:[{t:'cloudbank',col:'#ffe0f0',shade:'#e8a8c8',par:.05,h:200},{t:'sakura',cols:['#ffb8d0','#ffd0e8','#fff0f6'],par:.2,h:220},{t:'cloudbank',col:'#fff6fa',shade:'#f0c0d8',par:.36,h:120}],
      fx:[{p:'petals',n:30},{p:'sparkles',n:14,col:'#ffffff'}],extras:['birds'],pal:{p:'#3a1030',a:'#ff9ac0',glow:'#ffb8d0',bg:'#ff8ab8'},floor:'#f4e0ff',lip:'#ffffff'},
    muma:{name:'Muma',sky:['#2aa8f0','#8ad8ff','#fff0d0'],sun:{x:.25,y:.18,r:.07,c:['#fffbe0','#ffe07a']},stars:0,haze:'#fff4d0',clouds:{n:5,col:'#ffffff',y:[.05,.26],a:.9},
      layers:[{t:'sea',col:'#0a7ab0',top:'#4ad8e8',par:.04,h:220},{t:'palms',col:'#1f9a5a',trunk:'#8a6a3a',par:.3,h:280,n:6}],
      fx:[{p:'sparkles',n:24,col:'#ffffff',low:1}],extras:['gulls'],pal:{p:'#08303a',a:'#2de2ff',glow:'#8af0ff',bg:'#2aa8f0'},floor:'#f0d8a0',lip:'#fff4d8'}
  };
  var ICON={xccitia:'🌆',zandland:'🏜',mazi:'🌴',yana:'🏔',lucille:'🌸',muma:'🌊'};
  ORDER.forEach(function(k){LANDS[k].icon=ICON[k];});
  function register(){if(!window.FreaArenas||!FreaArenas.scenes)return setTimeout(register,300);ORDER.forEach(function(k){FreaArenas.scenes['fw_'+k]=SCN[k];try{ENV['fw_'+k]={sky:[SCN[k].sky[0],SCN[k].sky[2]],name:LANDS[k].name};ENV_NAME['fw_'+k]='Frea World · '+LANDS[k].name;ENV_ICON['fw_'+k]=ICON[k];}catch(e){}});}
  register();

  /* ---------- save data ---------- */
  function load(){try{var o=JSON.parse(localStorage.getItem(SK)||'{}');o.v=o.v||{};o.g=o.g||{};o.a=o.a||{};o.s=o.s||{};return o;}catch(e){return {v:{},g:{},a:{},s:{}};}}
  var D=load();function save(){try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}}
  function stamps(k){var s=D.s[k]||{};return (s.visit?1:0)+(s.gems?1:0)+(s.act?1:0);}
  function totalStamps(){return ORDER.reduce(function(a,k){return a+stamps(k);},0);}
  function gemsOf(k){return (D.g[k]||[]).length;}
  function award(k,which,label){D.s[k]=D.s[k]||{};if(D.s[k][which])return;D.s[k][which]=1;save();showStamp(LANDS[k],label);try{if(typeof bump==='function')bump('freaWorldStamps');}catch(e){}}

  /* ---------- runtime ---------- */
  var FW={land:null};window.__fwLand=null;
  function L(){return FW.land?LANDS[FW.land]:null;}
  function on(){return !!FW.land&&gameMode==='zen'&&(STATE==='play'||STATE==='countdown');}
  function floorY(){return WORLD_H-60;}
  function now(){return performance.now();}
  function rnd(a){return a[(Math.random()*a.length)|0];}
  var _wb=worldBounds;worldBounds=function(){_wb.apply(this,arguments);if(FW.land&&gameMode==='zen'){WORLD_W=Math.max(2400,W*2.2);WORLD_H=Math.max(H,600);}};
  var _bl=buildLevel;buildLevel=function(){_bl.apply(this,arguments);if(!(FW.land&&gameMode==='zen'))return;platforms=platforms.slice(0,3);var fy=floorY(),d=L();
    d.plats.forEach(function(q){var o=q[3]||{},p=new Platform({kind:'rect',x:q[0]*WORLD_W-q[2]/2,y:fy-q[1],w:q[2],h:18,ptype:o.pt||''});p._fw=1;if(o.mat){p.matBase=o.mat[0];p.matGlow=o.mat[1];}if(o.mv){p.mv={axis:o.mv[0],range:o.mv[1],speed:o.mv[2]};p.mph=Math.random()*TAU;}if(o.balloon)p._balloon=o.balloon;platforms.push(p);});};
  var _sep=spawnEnvProps;spawnEnvProps=function(){if(!(FW.land&&gameMode==='zen'))return _sep.apply(this,arguments);var fy=floorY();
    L().props.forEach(function(q){var t=q[0],cfg=zenCatalogSize(t),w=cfg.w||48,h=cfg.h||44,cx=q[1]*WORLD_W,p;
      if(t==='beachball'||t==='balloon'){p=new Platform({kind:'circle',x:cx,y:fy-q[2]-26,r:cfg.r||22});}else p=new Platform({kind:'rect',x:cx-w/2,y:fy-q[2]-h-2,w:w,h:h});
      p.deco=t;p.decoCol='hsl('+(Math.random()*360|0)+',75%,60%)';p._envprop=true;if(DECO_PHYS[t]){p.phys=DECO_PHYS[t];p.vx=0;p.vy=0;}platforms.push(p);});};

  function setupRuntime(){var d=L(),t=now();FW.t0=t;FW.prog=D.a[FW.land]||0;FW.gemsHere=(D.g[FW.land]||[]).slice();FW.tiles={};FW.lastTile=-1;FW.digs=(d.digs||[]).map(function(x,i){return {x:x*WORLD_W,i:i,done:false,hold:0};});
    FW.fruit=(d.fruit||[]).map(function(q,i){return {x:q[0]*WORLD_W,y:floorY()-q[1],i:i,e:rnd(['🥭','🍌','🍍','🥥','🍇']),got:false};});
    FW.shells=(d.shells||[]).map(function(x,i){return {x:x*WORLD_W,i:i,e:rnd(['🐚','🐚','⭐','🦀']),got:false};});
    FW.lanterns=[];FW.snow=[];FW.lastLan=0;FW.storm=0;FW.shower=0;FW.chat=t+4000;FW.edgeT=0;FW.cpuThrow=t+4000;
    if(!D.v[FW.land]){D.v[FW.land]=1;save();setTimeout(function(){award(FW.land,'visit','Visited '+d.name);},1600);}}

  function go(k,from){if(!LANDS[k])return false;closeMap();var prevEnv=null;try{prevEnv=localStorage.getItem('frea_zenenv');}catch(e){}if(!FW.land)FW.prevEnv=prevEnv;
    splash(LANDS[k],function(){FW.land=k;window.__fwLand=k;try{setMode('zen');}catch(e){}window.__zenSandbox=true;try{FreaArenas.start('zen','fw_'+k);}catch(e){console.warn('fw start',e);}finally{window.__zenSandbox=false;}
      setupRuntime();document.body.classList.add('fw-on');var dk=document.getElementById('zen-dock');if(dk)dk.classList.add('collapsed');mountHud();
      if(from){var fromLeft=ORDER.indexOf(from)===(ORDER.indexOf(k)+1)%ORDER.length;if(player){player.x=fromLeft?WORLD_W-260:200;}}
      try{flash(LANDS[k].name+' · '+LANDS[k].climate.l,LANDS[k].col);}catch(e){}});return true;}
  function leave(){if(!FW.land)return;FW.land=null;window.__fwLand=null;document.body.classList.remove('fw-on');unmountHud();try{if(FW.prevEnv)localStorage.setItem('frea_zenenv',FW.prevEnv);}catch(e){}}
  var _tl=toLobby;toLobby=function(){leave();closeMap();return _tl.apply(this,arguments);};
  var _sze=setZenEnv;setZenEnv=function(k){if(FW.land&&String(k).indexOf('fw_')!==0)leave();return _sze.apply(this,arguments);};

  /* ---------- per-frame land logic ---------- */
  function grounded(f){return f.stuck||f.onG||Math.abs(f.vy)<.3&&f.y+f.h>=floorY()-3;}
  function near(f,x,y,r){return Math.hypot(f.cx-x,f.cy-y)<r;}
  function progress(n){FW.prog=(FW.prog||0)+n;D.a[FW.land]=FW.prog;save();var a=L().act;if(FW.prog>=a.goal)award(FW.land,'act',a.n);updHud();}
  function anim(f,a,ms,e){if(!f)return;f.action=a;f.actionT=0;f.actionUntil=now()+(ms||900);if(e){f.emoteEmoji=e;f.emoteT=1100;}}
  function pop(x,y,e,big){emotePops.push({x:x,y:y,vy:-1.4,l:1.2,e:e,big:big});}
  function tick(dt){if(!on()||STATE!=='play'||!player)return;var d=L(),t=now(),fy=floorY(),k=FW.land;
    /* gems */
    d.gems.forEach(function(g,i){if(FW.gemsHere.indexOf(i)>=0)return;var gx=g[0]*WORLD_W,gy=fy-g[1];if(near(player,gx,gy,36)){FW.gemsHere.push(i);D.g[k]=FW.gemsHere.slice();save();anim(player,'cheer',1200,'💎');pop(gx,gy-10,'💎',true);try{jpfx(gx,gy,'#8af0ff');}catch(e){}flash('Frea Gem '+FW.gemsHere.length+'/3','#8af0ff');if(FW.gemsHere.length>=3)award(k,'gems','All gems of '+d.name);updHud();}});
    /* chatter */
    if(t>FW.chat){FW.chat=t+6000+Math.random()*6000;var cpu=fleas.filter(function(f){return f&&!f.isP&&!f.hidden;});if(cpu.length){try{say(rnd(cpu),rnd(d.lines),2400);}catch(e){}}}
    /* edge travel prompt */
    var edge=player.cx<170?-1:player.cx>WORLD_W-170?1:0;showEdge(edge);
    if(k==='xccitia'){var x0=WORLD_W*.4,x1=WORLD_W*.56,tw=(x1-x0)/8;fleas.forEach(function(f){if(!f||f.hidden)return;if(f.cx>x0&&f.cx<x1&&f.y+f.h>fy-6){var ti=Math.floor((f.cx-x0)/tw);FW.tiles[ti]=t;if(f===player&&grounded(f)&&ti!==FW.lastTile){FW.lastTile=ti;progress(1);pop(f.cx,f.y-8,rnd(['🎶','✨','💃']));anim(player,'dance',700);}if(!f.isP&&!f.action&&Math.random()<.01){f.action='dance';f.actionT=0;f.actionUntil=t+2500;}}});if(!(player.cx>x0&&player.cx<x1))FW.lastTile=-1;}
    else if(k==='zandland'){var ph=((t-FW.t0)/1000)%30;var storm=ph>22;if(storm&&!FW.storm){FW.storm=1;flash('Sandstorm! Hold on!','#ffb03d');}if(!storm)FW.storm=0;
      if(storm)fleas.forEach(function(f){if(f&&!f.stuck&&!f.hidden){f.vx+=.09*(dt/16.7);}});
      FW.digs.forEach(function(g){if(g.done)return;if(Math.abs(player.cx-g.x)<30&&player.y+player.h>fy-8&&grounded(player)){g.hold+=dt;if(player.action!=='stomp'){anim(player,'stomp',600);}if(Math.random()<.3)parts.push({x:g.x+(Math.random()-.5)*16,y:fy-4,vx:(Math.random()-.5)*3,vy:-1.5-Math.random()*2,l:.6,r:1.8,c:'#e8b070'});if(g.hold>550){g.done=true;var r=rnd(['🏺','💰','🦴','🪲','👑','🗿']);pop(g.x,fy-60,r,true);try{jpfx(g.x,fy-10,'#ffd07a');for(var s=0;s<14;s++)parts.push({x:g.x,y:fy-4,vx:(Math.random()-.5)*5,vy:-2-Math.random()*4,l:1,r:2+Math.random()*2,c:'#e8b070'});}catch(e){}flash('You dug up a relic! '+r,'#ffd07a');progress(1);anim(player,'cheer',1300,r);}}else g.hold=0;});
      if(FW.digs.every(function(g){return g.done;})&&!FW.digReset){FW.digReset=t+12000;}if(FW.digReset&&t>FW.digReset){FW.digReset=0;FW.digs.forEach(function(g){g.done=false;g.hold=0;});}}
    else if(k==='mazi'){var ph2=((t-FW.t0)/1000)%26;var sh=ph2>17;if(sh&&!FW.shower){FW.shower=1;flash('Tropical shower!','#7ae05a');}if(!sh)FW.shower=0;
      FW.fruit.forEach(function(fr){if(fr.got){if(t>fr.back){fr.got=false;}return;}if(near(player,fr.x,fr.y,34)){fr.got=true;fr.back=t+20000;pop(fr.x,fr.y-10,fr.e);progress(1);anim(player,'wiggle',1100,'😋');}});}
    else if(k==='yana'){FW.snow=FW.snow.filter(function(s){s.vy+=.22*(dt/16.7);s.x+=s.vx*(dt/16.7);s.y+=s.vy*(dt/16.7);if(s.y>fy){splat(s);return false;}
        for(var i=0;i<platforms.length;i++){var p=platforms[i];if(i>2&&p.kind==='rect'&&s.x>p.x&&s.x<p.x+p.w&&s.y>p.y&&s.y<p.y+p.h){splat(s);return false;}}
        for(var j=0;j<fleas.length;j++){var f=fleas[j];if(!f||f===s.from||f.hidden)continue;if(s.x>f.x-4&&s.x<f.x+f.w+4&&s.y>f.y-4&&s.y<f.y+f.h+4){f.stuck=false;f.vx+=s.vx>0?4.5:-4.5;f.vy=-4;f.emoteEmoji=rnd(['🥶','😆','❄']);f.emoteT=1200;splat(s);if(s.from===player)progress(1);else if(f===player)flash('Got you! Throw one back!','#8af0ff');return false;}}
        return s.x>0&&s.x<WORLD_W;});
      if(t>FW.cpuThrow){FW.cpuThrow=t+2600+Math.random()*3200;var thr=fleas.filter(function(f){return f&&!f.isP&&!f.hidden&&Math.abs(f.cx-player.cx)<620;});if(thr.length){var a=rnd(thr);throwBall(a,player.cx,player.cy);}}}
    else if(k==='lucille'){fleas.forEach(function(f){if(f&&!f.stuck&&!f.hidden)f.vy-=GRAV*.42*(dt/16.7);});
      if(t-FW.lastLan>2000&&FW.lanterns.length<8){FW.lastLan=t;FW.lanterns.push({x:camera.x+80+Math.random()*(W-160),y:camera.y+H+30,ph:Math.random()*6,c:rnd(['#ffb03d','#ff7ab0','#ffd23d','#ff9a6a'])});}
      FW.lanterns=FW.lanterns.filter(function(l){l.y-=.7*(dt/16.7);l.x+=Math.sin(t/700+l.ph)*.4;if(near(player,l.x,l.y,34)){pop(l.x,l.y,'🏮');try{jpfx(l.x,l.y,l.c);}catch(e){}progress(1);anim(player,'heart',1000);return false;}return l.y>camera.y-60;});}
    else if(k==='muma'){var tide=tideY(t),wx=WORLD_W*.53;fleas.forEach(function(f){if(!f||f.hidden)return;if(f.cx>wx&&f.y+f.h*.6>tide){f.stuck=false;f.vy=f.vy*.9-.62*(dt/16.7);f.vx*=.97;if(!f._swim||t-f._swim>900){f._swim=t;if(Math.random()<.3)try{parts.push({x:f.cx,y:tide,vx:(Math.random()-.5)*2,vy:-1.5,l:.7,r:2,c:'#e0faff'});}catch(e){}}}});
      FW.shells.forEach(function(s){if(s.got){if(t>s.back)s.got=false;return;}if(Math.abs(player.cx-s.x)<30&&player.y+player.h>fy-30){s.got=true;s.back=t+25000;pop(s.x,fy-40,s.e);progress(1);anim(player,'bow',800,'🐚');}});}}
  function tideY(t){return floorY()-(28+50*(.5+.5*Math.sin((t||now())/1000*TAU/24)));}
  function throwBall(f,tx,ty){if(!f)return;anim(f,'karate',500);var dx=tx-f.cx,dir=dx>=0?1:-1,dist=Math.min(520,Math.abs(dx));FW.snow.push({x:f.cx+dir*f.w*.5,y:f.y+4,vx:dir*(5+dist/90),vy:-6.2-Math.max(0,(f.cy-ty))/70,from:f});f.face=dir;}
  function splat(s){try{for(var i=0;i<8;i++)parts.push({x:s.x,y:s.y,vx:(Math.random()-.5)*4,vy:-Math.random()*3,l:.6,r:2.2,c:'#ffffff'});}catch(e){}}
  function snowball(){if(!on()||FW.land!=='yana'||!player)return;anim(player,'karate',500);var dir=player.face||1;FW.snow.push({x:player.cx+dir*player.w*.5,y:player.y+2,vx:dir*8.5+(player.vx||0)*.4,vy:-6,from:player});}
  window.addEventListener('keydown',function(e){if(FW.land==='yana'&&(e.key==='f'||e.key==='F')&&on()&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||'')){snowball();}});
  var _uzc=updateZenCarry;updateZenCarry=function(dt){_uzc(dt);try{tick(dt||16.7);}catch(e){console.warn('fw tick',e);}};

  /* ---------- drawing ---------- */
  function sx(x){return x-camera.x;}function sy(y){return y-camera.y;}
  function back(){var k=FW.land,t=now()/1000,fy=sy(floorY());ctx.save();
    if(k==='xccitia'){/* billboard tower + hanging disco ball over the dance floor */var bx=sx(WORLD_W*.47);ctx.strokeStyle='rgba(200,200,255,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx,fy-430);ctx.lineTo(bx,fy-330);ctx.stroke();var dg=ctx.createRadialGradient(bx-6,fy-322,2,bx,fy-312,22);dg.addColorStop(0,'#ffffff');dg.addColorStop(1,'#8a8aa8');ctx.fillStyle=dg;ctx.beginPath();ctx.arc(bx,fy-312,20,0,TAU);ctx.fill();
      ctx.globalCompositeOperation='lighter';for(var r=0;r<6;r++){var a=t*.8+r*1.05,c=['#ff3db5','#2de2ff','#c6ff3d','#ffd23d'][r%4];var g=ctx.createLinearGradient(bx,fy-312,bx+Math.cos(a)*360,fy-312+Math.abs(Math.sin(a))*300+60);g.addColorStop(0,c+'55');g.addColorStop(1,c+'00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(bx,fy-312);ctx.lineTo(bx+Math.cos(a)*360-30,fy);ctx.lineTo(bx+Math.cos(a)*360+30,fy);ctx.closePath();ctx.fill();}ctx.globalCompositeOperation='source-over';
      var bb=sx(WORLD_W*.25);ctx.fillStyle='#0c0624';ctx.fillRect(bb-110,fy-560,220,120);ctx.strokeStyle='#ff3db5';ctx.shadowColor='#ff3db5';ctx.shadowBlur=16;ctx.lineWidth=3;ctx.strokeRect(bb-110,fy-560,220,120);ctx.shadowBlur=0;ctx.fillStyle=Math.sin(t*3)>-.6?'#2de2ff':'#ff3db5';ctx.font="900 30px 'Orbitron',sans-serif";ctx.textAlign='center';ctx.fillText('XCCITIA',bb,fy-492);ctx.fillStyle='#ffd23d';ctx.font="700 13px 'Chakra Petch',sans-serif";ctx.fillText('CITY OF LIGHTS · EST. 2077',bb,fy-466);ctx.fillStyle='#1a1040';ctx.fillRect(bb-6,fy-440,12,440-330);}
    else if(k==='zandland'){[[.38,320],[.72,240],[.18,180]].forEach(function(q){var px=sx(q[0]*WORLD_W),w=q[1];ctx.fillStyle='#e8b070';ctx.beginPath();ctx.moveTo(px-w/2,fy);ctx.lineTo(px,fy-w*.62);ctx.lineTo(px+w/2,fy);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(120,60,20,.25)';ctx.beginPath();ctx.moveTo(px,fy-w*.62);ctx.lineTo(px+w/2,fy);ctx.lineTo(px+w*.08,fy);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(150,90,40,.25)';ctx.lineWidth=1;for(var r=1;r<7;r++){var yy=fy-r*w*.62/7,hw=w/2*(1-r/7);ctx.beginPath();ctx.moveTo(px-hw,yy);ctx.lineTo(px+hw,yy);ctx.stroke();}ctx.fillStyle='#3a2010';ctx.fillRect(px-9,fy-26,18,26);});
      var hz=ctx.createLinearGradient(0,fy-80,0,fy);hz.addColorStop(0,'rgba(255,240,200,0)');hz.addColorStop(1,'rgba(255,240,200,'+(.18+.06*Math.sin(t*2))+')');ctx.fillStyle=hz;ctx.fillRect(0,fy-80,W,80);}
    else if(k==='mazi'){var tx=sx(WORLD_W*.52);for(var s=0;s<5;s++){var w2=420-s*70,h2=46;ctx.fillStyle=s%2?'#5a6a50':'#6a7a5a';ctx.fillRect(tx-w2/2,fy-(s+1)*h2,w2,h2);ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(tx-w2/2,fy-(s+1)*h2+h2-6,w2,6);}
      ctx.fillStyle='#2a3a28';ctx.fillRect(tx-22,fy-60,44,60);var gl=.5+.5*Math.sin(t*2);ctx.shadowColor='#c6ff3d';ctx.shadowBlur=18*gl;ctx.fillStyle='rgba(198,255,61,'+(.5+.4*gl)+')';ctx.font="900 22px 'Orbitron',sans-serif";ctx.textAlign='center';ctx.fillText('◈ ✦ ◈',tx,fy-5*46+30);ctx.shadowBlur=0;
      var wf=sx(WORLD_W*.15);ctx.fillStyle='#4a5a48';ctx.fillRect(wf-70,fy-380,140,30);var wg=ctx.createLinearGradient(0,fy-350,0,fy);wg.addColorStop(0,'rgba(170,230,255,.85)');wg.addColorStop(1,'rgba(220,250,255,.5)');ctx.fillStyle=wg;ctx.fillRect(wf-40,fy-350,80,350);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;for(var l=0;l<6;l++){var ly=((t*160+l*60)%350);ctx.beginPath();ctx.moveTo(wf-34+l*13,fy-350+ly);ctx.lineTo(wf-34+l*13,fy-350+ly+26);ctx.stroke();}ctx.fillStyle='rgba(255,255,255,.5)';for(var m=0;m<7;m++){ctx.beginPath();ctx.arc(wf-40+m*13,fy-6+Math.sin(t*6+m)*3,8,0,TAU);ctx.fill();}}
    else if(k==='yana'){[[.25,1],[.6,.85]].forEach(function(q){var ix=sx(q[0]*WORLD_W),r=90*q[1];ctx.fillStyle='#f4f8ff';ctx.beginPath();ctx.arc(ix,fy,r,Math.PI,0);ctx.fill();ctx.strokeStyle='rgba(120,150,200,.35)';ctx.lineWidth=1.5;for(var b=1;b<4;b++){ctx.beginPath();ctx.arc(ix,fy,r,Math.PI+.0,0);ctx.stroke();ctx.beginPath();ctx.moveTo(ix-r*Math.cos(b*.4),fy-r*Math.sin(b*.4));ctx.lineTo(ix+r*Math.cos(b*.4),fy-r*Math.sin(b*.4));ctx.stroke();}ctx.fillStyle='#3a4a6a';ctx.beginPath();ctx.arc(ix+r*.45,fy,r*.3,Math.PI,0);ctx.fill();});
      var lx=sx(WORLD_W*.9);ctx.fillStyle='#7a4a2e';ctx.fillRect(lx-150,fy-230,300,110);ctx.fillStyle='#5a3220';for(var lg=0;lg<6;lg++)ctx.fillRect(lx-150,fy-230+lg*18,300,3);ctx.fillStyle='#f4f8ff';ctx.beginPath();ctx.moveTo(lx-175,fy-228);ctx.lineTo(lx,fy-320);ctx.lineTo(lx+175,fy-228);ctx.closePath();ctx.fill();ctx.fillStyle='#ffd27a';ctx.shadowColor='#ffb03d';ctx.shadowBlur=14;ctx.fillRect(lx-100,fy-205,46,36);ctx.fillRect(lx+54,fy-205,46,36);ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.font="800 14px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.fillText('YANA SKI LODGE',lx,fy-245);
      ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.arc(lx-60,fy-340-(t*30%60),10+(t*30%60)/6,0,TAU);ctx.fill();}
    else if(k==='lucille'){[[.3,.62],[.75,.5]].forEach(function(q,i){var ix=sx(q[0]*WORLD_W)-camera.x*0,iy=sy(floorY()*q[1])+Math.sin(t*.6+i)*10;ctx.fillStyle='#8a5a6a';ctx.beginPath();ctx.moveTo(ix-130,iy);ctx.lineTo(ix+130,iy);ctx.lineTo(ix+40,iy+110);ctx.lineTo(ix-20,iy+140);ctx.closePath();ctx.fill();ctx.fillStyle='#8ad08a';ctx.beginPath();ctx.ellipse(ix,iy,134,16,0,0,TAU);ctx.fill();ctx.fillStyle='#ffb8d0';for(var b2=0;b2<5;b2++){ctx.beginPath();ctx.arc(ix-90+b2*45,iy-22,18,0,TAU);ctx.fill();}
        ctx.fillStyle='rgba(200,240,255,.7)';ctx.fillRect(ix+70,iy+4,10,160+Math.sin(t*4)*4);});
      platforms.forEach(function(p){if(!p._balloon)return;var bx2=sx(p.x+p.w/2),by2=sy(p.y);ctx.strokeStyle='rgba(80,40,30,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sx(p.x)+8,by2);ctx.lineTo(bx2-30,by2-70);ctx.moveTo(sx(p.x+p.w)-8,by2);ctx.lineTo(bx2+30,by2-70);ctx.stroke();var bg=ctx.createRadialGradient(bx2-14,by2-120,6,bx2,by2-104,52);bg.addColorStop(0,'#ffffff');bg.addColorStop(.3,p._balloon);bg.addColorStop(1,'#8a3a6a');ctx.fillStyle=bg;ctx.beginPath();ctx.ellipse(bx2,by2-108,46,52,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.ellipse(bx2,by2-108,18,52,0,0,TAU);ctx.stroke();});}
    else if(k==='muma'){var lh=sx(WORLD_W*.965);ctx.fillStyle='#6a6a7a';ctx.beginPath();ctx.ellipse(lh,fy,90,24,0,Math.PI,0);ctx.fill();for(var s3=0;s3<6;s3++){ctx.fillStyle=s3%2?'#ff5a5a':'#ffffff';ctx.beginPath();var y0=fy-s3*55,y1=fy-(s3+1)*55,w0=34-s3*2.4,w1=34-(s3+1)*2.4;ctx.moveTo(lh-w0,y0);ctx.lineTo(lh-w1,y1);ctx.lineTo(lh+w1,y1);ctx.lineTo(lh+w0,y0);ctx.closePath();ctx.fill();}
      ctx.fillStyle='#2a2a3a';ctx.fillRect(lh-26,fy-360,52,30);ctx.fillStyle='#ffe07a';ctx.fillRect(lh-18,fy-356,36,22);ctx.globalCompositeOperation='lighter';var ba=t*.9,bgr=ctx.createLinearGradient(lh,fy-345,lh+Math.cos(ba)*600,fy-345);bgr.addColorStop(0,'rgba(255,240,170,.45)');bgr.addColorStop(1,'rgba(255,240,170,0)');ctx.fillStyle=bgr;ctx.beginPath();ctx.moveTo(lh,fy-345);ctx.lineTo(lh+Math.cos(ba)*700,fy-345-60*Math.abs(Math.cos(ba)));ctx.lineTo(lh+Math.cos(ba)*700,fy-345+60*Math.abs(Math.cos(ba)));ctx.closePath();ctx.fill();ctx.globalCompositeOperation='source-over';
      ctx.fillStyle='#f6ecd0';ctx.font="800 13px 'Chakra Petch',sans-serif";ctx.textAlign='center';[[.66,'⛵'],[.8,'⛵']].forEach(function(b3,i){ctx.font='28px serif';ctx.fillText(b3[1],sx(b3[0]*WORLD_W)+Math.sin(t*.3+i)*40,fy-130+Math.sin(t*1.5+i)*4);});}
    /* edge signposts (all lands) */
    var i0=ORDER.indexOf(k);[[-1,90],[1,WORLD_W-90]].forEach(function(q){var nb=LANDS[ORDER[(i0+q[0]+ORDER.length)%ORDER.length]],px=sx(q[1]);ctx.fillStyle='#6a4422';ctx.fillRect(px-4,fy-90,8,90);ctx.fillStyle='#a8743a';ctx.beginPath();var dir=q[0];ctx.moveTo(px-58*(dir<0?1:.8),fy-98);ctx.lineTo(px+58*(dir>0?1:.8),fy-98);ctx.lineTo(px+(dir>0?72:58),fy-82);ctx.lineTo(px+58*(dir>0?1:.8),fy-66);ctx.lineTo(px-58*(dir<0?1:.8),fy-66);ctx.lineTo(px-(dir<0?72:58),fy-82);ctx.closePath();ctx.fill();ctx.fillStyle='#fff6e0';ctx.font="800 12px 'Chakra Petch',sans-serif";ctx.textAlign='center';ctx.fillText((dir<0?'‹ ':'')+nb.name.toUpperCase()+(dir>0?' ›':''),px,fy-78);});
    ctx.restore();}
  function mid(){var k=FW.land,t=now()/1000,fy=sy(floorY()),d=L();ctx.save();
    if(k==='xccitia'){var x0=WORLD_W*.4,x1=WORLD_W*.56,tw=(x1-x0)/8,cols=['#ff3db5','#2de2ff','#c6ff3d','#ffd23d','#9b6bff'];for(var i=0;i<8;i++){var lit=FW.tiles[i]?Math.max(0,1-(now()-FW.tiles[i])/700):0,beat=.25+.15*Math.sin(t*6+i);ctx.fillStyle=cols[i%5];ctx.globalAlpha=Math.min(1,beat+lit*.75);ctx.fillRect(sx(x0+i*tw)+2,fy-6,tw-4,10);if(lit>0){var g=ctx.createLinearGradient(0,fy-80,0,fy);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,cols[i%5]);ctx.globalAlpha=lit*.45;ctx.fillStyle=g;ctx.fillRect(sx(x0+i*tw)+2,fy-80,tw-4,80);}}ctx.globalAlpha=1;}
    if(k==='zandland')FW.digs.forEach(function(g){if(g.done)return;var x=sx(g.x),y=fy-4,p=Math.min(1,g.hold/550);ctx.strokeStyle='#8a2a1a';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-12,y-8);ctx.lineTo(x+12,y+4);ctx.moveTo(x+12,y-8);ctx.lineTo(x-12,y+4);ctx.stroke();if(p>0){ctx.strokeStyle='#ffd07a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y-24,12,-Math.PI/2,-Math.PI/2+p*TAU);ctx.stroke();}});
    if(k==='mazi')FW.fruit.forEach(function(fr){if(fr.got)return;var x=sx(fr.x),y=sy(fr.y)+Math.sin(t*2+fr.i)*3;ctx.strokeStyle='#3a6a2a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y-30);ctx.lineTo(x,y-12);ctx.stroke();ctx.font='22px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(fr.e,x,y);});
    if(k==='muma')FW.shells.forEach(function(s){if(s.got)return;var x=sx(s.x),y=fy-10;ctx.font='20px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalAlpha=.75+.25*Math.sin(t*3+s.i);ctx.fillText(s.e,x,y);ctx.globalAlpha=1;});
    if(k==='lucille')FW.lanterns.forEach(function(l){var x=sx(l.x),y=sy(l.y),g=ctx.createRadialGradient(x,y,2,x,y,30);g.addColorStop(0,l.c);g.addColorStop(1,'rgba(255,200,120,0)');ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(x-30,y-30,60,60);ctx.globalCompositeOperation='source-over';ctx.fillStyle=l.c;ctx.beginPath();ctx.roundRect(x-9,y-12,18,22,6);ctx.fill();ctx.fillStyle='#8a3a1a';ctx.fillRect(x-7,y-14,14,3);ctx.fillRect(x-7,y+9,14,3);});
    if(k==='yana')FW.snow.forEach(function(s){ctx.fillStyle='#ffffff';ctx.strokeStyle='rgba(120,160,220,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx(s.x),sy(s.y),6,0,TAU);ctx.fill();ctx.stroke();});
    /* gems */
    d.gems.forEach(function(g,i){if(FW.gemsHere.indexOf(i)>=0)return;var x=sx(g[0]*WORLD_W),y=sy(floorY()-g[1])+Math.sin(t*2.4+i)*5,s=11;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t+i)*.2);var gg=ctx.createRadialGradient(0,0,2,0,0,28);gg.addColorStop(0,'rgba(138,240,255,.55)');gg.addColorStop(1,'rgba(138,240,255,0)');ctx.fillStyle=gg;ctx.fillRect(-28,-28,56,56);ctx.fillStyle='#8af0ff';ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s*.8,-s*.2);ctx.lineTo(0,s*1.1);ctx.lineTo(-s*.8,-s*.2);ctx.closePath();ctx.fill();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s*.3,-s*.2);ctx.lineTo(0,s*.4);ctx.lineTo(-s*.3,-s*.2);ctx.closePath();ctx.fill();ctx.restore();});
    ctx.restore();}
  function front(){var k=FW.land,t=now()/1000,fy=sy(floorY());ctx.save();
    if(k==='muma'){var ty=sy(tideY()),x0=sx(WORLD_W*.53);if(x0<W){var g=ctx.createLinearGradient(0,ty,0,fy+60);g.addColorStop(0,'rgba(60,200,230,.55)');g.addColorStop(1,'rgba(10,90,150,.7)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(Math.max(-10,x0-60),fy+60);ctx.lineTo(Math.max(-10,x0-60),fy);ctx.quadraticCurveTo(x0,ty,x0+40,ty);for(var x=x0+40;x<=W+20;x+=20)ctx.lineTo(x,ty+Math.sin(x*.03+t*2.2)*4);ctx.lineTo(W+20,fy+60);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.beginPath();for(var x2=x0+40;x2<=W+20;x2+=20){var yy=ty+Math.sin(x2*.03+t*2.2)*4;if(x2===x0+40)ctx.moveTo(x2,yy);else ctx.lineTo(x2,yy);}ctx.stroke();}}
    if(k==='zandland'&&FW.storm){var ph=((now()-FW.t0)/1000)%30-22,a=Math.min(1,ph/1.2,(8-ph)/1.2)*.32;ctx.fillStyle='rgba(230,170,100,'+a+')';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(255,230,180,'+(a*1.6)+')';ctx.lineWidth=1.4;ctx.beginPath();for(var i=0;i<60;i++){var x3=((i*97+t*900)%(W+200))-100,y3=(i*53.7)%H;ctx.moveTo(x3,y3);ctx.lineTo(x3+40,y3+3);}ctx.stroke();}
    if(k==='mazi'&&FW.shower){ctx.fillStyle='rgba(20,60,50,.18)';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(200,240,255,.45)';ctx.lineWidth=1.2;ctx.beginPath();for(var r=0;r<120;r++){var rx=((r*71.3-t*80)%W+W)%W,ry=((r*37+t*700)%(H+40))-40;ctx.moveTo(rx,ry);ctx.lineTo(rx-4,ry+16);}ctx.stroke();}
    if(k==='yana'){var vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.4,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(200,230,255,0)');vg.addColorStop(1,'rgba(200,230,255,.28)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);}
    if(k==='xccitia'){ctx.globalCompositeOperation='lighter';var pg=ctx.createLinearGradient(0,fy-20,0,fy+40);pg.addColorStop(0,'rgba(255,61,181,0)');pg.addColorStop(1,'rgba(45,226,255,.12)');ctx.fillStyle=pg;ctx.fillRect(0,fy-20,W,60);}
    ctx.restore();}
  var _dbg=drawBG;drawBG=function(){var r=_dbg.apply(this,arguments);if(on()){try{back();}catch(e){console.warn('fw back',e);}}return r;};
  var _dft=drawFleaTargets;drawFleaTargets=function(){var r=_dft.apply(this,arguments);if(on()){try{mid();}catch(e){console.warn('fw mid',e);}}return r;};
  var _de=drawEmotes;drawEmotes=function(){if(on()){try{front();}catch(e){}}return _de.apply(this,arguments);};

  /* ---------- HUD ---------- */
  var hud=null;
  function mountHud(){unmountHud();var d=L();hud=document.createElement('div');hud.id='fw-hud';hud.setAttribute('data-testid','fw-hud');hud.style.setProperty('--fw',d.col);
    hud.innerHTML='<div class="fw-chip"><span class="fw-ico">'+ICON[FW.land]+'</span><div><b data-testid="fw-land-name">'+d.name+'</b><small data-testid="fw-climate">'+d.climate.i+' '+d.climate.l+' · '+d.climate.t+'</small></div></div>'+
      '<div class="fw-goals"><span data-testid="fw-activity">'+d.act.i+' <em></em></span><span data-testid="fw-gems">💎 <em></em></span></div>'+
      '<div class="fw-btns"><button data-testid="fw-map-btn" class="fw-b" aria-label="Open Frea World map">🗺 Map</button><button data-testid="fw-passport-btn" class="fw-b" aria-label="Open passport">🛂 Passport</button>'+(FW.land==='yana'?'<button data-testid="fw-snowball-btn" class="fw-b fw-act" aria-label="Throw a snowball">❄ Throw <kbd>F</kbd></button>':'')+'</div>'+
      '<button class="fw-edge" data-testid="fw-edge-travel" hidden></button>';
    document.body.appendChild(hud);hud.addEventListener('pointerdown',function(e){e.stopPropagation();});
    hud.querySelector('[data-testid=fw-map-btn]').onclick=function(){openMap();};hud.querySelector('[data-testid=fw-passport-btn]').onclick=function(){openPass();};
    var sb=hud.querySelector('[data-testid=fw-snowball-btn]');if(sb)sb.onclick=function(){snowball();};updHud();}
  function updHud(){if(!hud||!FW.land)return;var d=L();var a=hud.querySelector('[data-testid=fw-activity] em');if(a)a.textContent=d.act.v+' '+Math.min(FW.prog||0,d.act.goal)+'/'+d.act.goal;var g=hud.querySelector('[data-testid=fw-gems] em');if(g)g.textContent='Gems '+FW.gemsHere.length+'/3';}
  function unmountHud(){var o=document.getElementById('fw-hud');if(o)o.remove();hud=null;}
  function showEdge(dir){if(!hud)return;var b=hud.querySelector('.fw-edge');if(!dir){if(!b.hidden)b.hidden=true;return;}var i0=ORDER.indexOf(FW.land),nk=ORDER[(i0+dir+ORDER.length)%ORDER.length];if(b.hidden||b.dataset.k!==nk){b.dataset.k=nk;b.textContent=(dir<0?'‹ ':'')+'Travel to '+LANDS[nk].name+(dir>0?' ›':'');b.hidden=false;b.onclick=function(){if(player){player.stuck=false;player.launch(dir*9,-9);player.face=dir;anim(player,'wave',600,'👋');}setTimeout(function(){go(nk,FW.land);},380);};}}
  function splash(d,cb){var s=document.createElement('div');s.id='fw-splash';s.setAttribute('data-testid','fw-splash');s.style.setProperty('--fw',d.col);s.innerHTML='<div><small>FREA WORLD</small><b>'+d.name+'</b><span>'+d.tag+'</span></div>';document.body.appendChild(s);requestAnimationFrame(function(){s.classList.add('in');});setTimeout(function(){try{cb();}catch(e){console.warn(e);}setTimeout(function(){s.classList.add('out');setTimeout(function(){s.remove();},420);},350);},520);}
  function showStamp(d,label){var s=document.createElement('div');s.className='fw-stamp';s.setAttribute('data-testid','fw-stamp-toast');s.style.setProperty('--fw',d.col);s.innerHTML='<i>'+(d.icon||'🛂')+'</i><div><small>STAMP EARNED</small><b>'+label+'</b></div>';document.body.appendChild(s);setTimeout(function(){s.classList.add('out');setTimeout(function(){s.remove();},400);},2600);}

  /* ---------- world map ---------- */
  var POS={xccitia:[23,30],zandland:[51,19],mazi:[79,31],yana:[78,71],lucille:[50,77],muma:[21,70]};
  var mapEl=null,mapRaf=0,sel='xccitia',fromChooser=false;
  function openMap(fromCh){fromChooser=!!fromCh;closeMap();mapEl=document.createElement('div');mapEl.id='fw-map';mapEl.setAttribute('data-testid','fw-map');
    mapEl.innerHTML='<div class="fwm-head"><div><div class="fwm-t">FREA <span>WORLD</span></div><div class="fwm-s">Six lands to explore · '+totalStamps()+'/18 stamps</div></div><div class="fwm-hb"><button class="fwm-pass" data-testid="fw-map-passport">🛂 Passport</button><button class="fwm-x" data-testid="fw-map-close" aria-label="Close map">✕</button></div></div>'+
      '<div class="fwm-body"><div class="fwm-stage"><canvas class="fwm-cv" aria-hidden="true"></canvas>'+ORDER.map(function(k){var d=LANDS[k],p=POS[k];return '<button class="fwm-pin'+(D.v[k]?' seen':'')+'" data-k="'+k+'" data-testid="fw-pin-'+k+'" style="left:'+p[0]+'%;top:'+p[1]+'%;--fw:'+d.col+'"><i>'+ICON[k]+'</i><b>'+d.name+'</b>'+(FW.land===k?'<em>YOU ARE HERE</em>':'')+'</button>';}).join('')+'</div>'+
      '<aside class="fwm-card" data-testid="fw-land-card"></aside></div>';
    document.body.appendChild(mapEl);mapEl.addEventListener('pointerdown',function(e){e.stopPropagation();});
    mapEl.querySelector('.fwm-x').onclick=function(){closeMap();if(fromChooser&&!FW.land){try{toLobby();}catch(e){}}};mapEl.querySelector('.fwm-pass').onclick=function(){openPass();};
    [].forEach.call(mapEl.querySelectorAll('.fwm-pin'),function(b){b.onclick=function(){sel=b.dataset.k;card();};b.ondblclick=function(){go(b.dataset.k);};});
    if(FW.land)sel=FW.land;card();requestAnimationFrame(function(){mapEl.classList.add('show');});drawMapLoop();
    try{isPaused=true;}catch(e){}}
  function card(){if(!mapEl)return;var d=LANDS[sel],s=D.s[sel]||{},c=mapEl.querySelector('.fwm-card');c.style.setProperty('--fw',d.col);[].forEach.call(mapEl.querySelectorAll('.fwm-pin'),function(b){b.classList.toggle('on',b.dataset.k===sel);});
    c.innerHTML='<div class="fwc-top"><i>'+ICON[sel]+'</i><div><b data-testid="fw-card-name">'+d.name+'</b><small>'+d.tag+'</small></div></div><div class="fwc-cl" data-testid="fw-card-climate">'+d.climate.i+' '+d.climate.l+'<span>'+d.climate.t+'</span></div><p>'+d.desc+'</p>'+
      '<ul class="fwc-st"><li class="'+(s.visit?'got':'')+'">📍 Visit</li><li class="'+(s.act?'got':'')+'">'+d.act.i+' '+d.act.n+' <small>'+Math.min(D.a[sel]||0,d.act.goal)+'/'+d.act.goal+'</small></li><li class="'+(s.gems?'got':'')+'">💎 Gems <small>'+gemsOf(sel)+'/3</small></li></ul>'+
      '<button class="fwc-go" data-testid="fw-travel-btn">'+(FW.land===sel?'You are here · Close map':'Travel to '+d.name+' ›')+'</button>';
    c.querySelector('.fwc-go').onclick=function(){if(FW.land===sel){closeMap();return;}go(sel,null);};}
  function closeMap(){if(mapRaf)cancelAnimationFrame(mapRaf);mapRaf=0;if(mapEl){mapEl.remove();mapEl=null;try{isPaused=false;}catch(e){}}}
  function blobPath(c,cx,cy,r,seed,amp){c.beginPath();for(var i=0;i<=40;i++){var a=i/40*TAU,rr=r*(1+amp*(Math.sin(a*3+seed)*.5+Math.sin(a*5+seed*2.3)*.3+Math.sin(a*7+seed*.7)*.2));var x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.78;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.closePath();}
  function drawMapLoop(){if(!mapEl)return;var cv=mapEl.querySelector('.fwm-cv'),st=mapEl.querySelector('.fwm-stage');var dpr=Math.min(2,window.devicePixelRatio||1),w=st.clientWidth,h=st.clientHeight;if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
    var c=cv.getContext('2d'),t=now()/1000;c.setTransform(dpr,0,0,dpr,0,0);
    var g=c.createRadialGradient(w/2,h/2,10,w/2,h/2,Math.max(w,h)*.7);g.addColorStop(0,'#1a6aa8');g.addColorStop(.6,'#0e3f78');g.addColorStop(1,'#071c40');c.fillStyle=g;c.fillRect(0,0,w,h);
    c.strokeStyle='rgba(255,255,255,.05)';c.lineWidth=1;for(var gx=0;gx<w;gx+=60){c.beginPath();c.moveTo(gx,0);c.lineTo(gx,h);c.stroke();}for(var gy=0;gy<h;gy+=60){c.beginPath();c.moveTo(0,gy);c.lineTo(w,gy);c.stroke();}
    c.strokeStyle='rgba(180,230,255,.18)';c.lineWidth=1.4;for(var wv=0;wv<36;wv++){var wx=(wv*137.3+t*8)%(w+40)-20,wy=(wv*83.1)%h;c.beginPath();c.arc(wx,wy,8,Math.PI*1.1,Math.PI*1.9);c.stroke();c.beginPath();c.arc(wx+14,wy,8,Math.PI*1.1,Math.PI*1.9);c.stroke();}
    /* routes */
    c.setLineDash([3,7]);c.strokeStyle='rgba(255,246,220,.55)';c.lineWidth=2;ORDER.forEach(function(k,i){var a=POS[k],b=POS[ORDER[(i+1)%ORDER.length]],ax=a[0]/100*w,ay=a[1]/100*h,bx=b[0]/100*w,by=b[1]/100*h,mx=(ax+bx)/2+(by-ay)*.12,my=(ay+by)/2-(bx-ax)*.12;c.beginPath();c.moveTo(ax,ay);c.quadraticCurveTo(mx,my,bx,by);c.stroke();});c.setLineDash([]);
    var R=Math.min(w,h)*.13;
    ORDER.forEach(function(k,i){var p=POS[k],x=p[0]/100*w,y=p[1]/100*h,d=LANDS[k],r=R*(k===sel?1.06:1);c.save();
      if(k==='lucille'){c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(x,y+r*.9,r*.8,r*.18,0,0,TAU);c.fill();y-=r*.25+Math.sin(t*1.2)*4;}
      else{c.fillStyle='rgba(120,220,255,.25)';blobPath(c,x,y,r*1.18,i*2.1,.12);c.fill();c.fillStyle='#f4e0a8';blobPath(c,x,y,r*1.03,i*2.1,.12);c.fill();}
      var base={xccitia:['#3a2a6a','#1a1040'],zandland:['#f0c070','#d89050'],mazi:['#3aa04a','#1f6a3a'],yana:['#ffffff','#c8d8f0'],lucille:['#ffd0e8','#ff9ac0'],muma:['#5ac87a','#2fa85a']}[k];var lg=c.createLinearGradient(x,y-r,x,y+r);lg.addColorStop(0,base[0]);lg.addColorStop(1,base[1]);c.fillStyle=lg;blobPath(c,x,y,r*.9,i*2.1+.5,.1);c.fill();
      if(k==='lucille'){c.fillStyle='#8a5a6a';c.beginPath();c.moveTo(x-r*.7,y+r*.3);c.lineTo(x+r*.7,y+r*.3);c.lineTo(x+r*.1,y+r*1.0);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.9)';[[-.9,.1],[.95,0],[-.5,.55],[.6,.5]].forEach(function(q){c.beginPath();c.arc(x+q[0]*r,y+q[1]*r,r*.18,0,TAU);c.arc(x+q[0]*r+r*.15,y+q[1]*r+2,r*.14,0,TAU);c.fill();});c.fillStyle='#ffb8d0';for(var f=0;f<5;f++){c.beginPath();c.arc(x-r*.5+f*r*.25,y-r*.2,r*.12,0,TAU);c.fill();}}
      if(k==='xccitia'){for(var b=0;b<7;b++){var bh=r*(.35+((b*37)%10)/14),bx=x-r*.6+b*r*.18;c.fillStyle=b%2?'#120a32':'#24185a';c.fillRect(bx,y+r*.3-bh,r*.15,bh);c.fillStyle=['#ff3db5','#2de2ff','#ffd23d'][b%3];for(var wn=0;wn<4;wn++)if((b+wn)%2)c.fillRect(bx+r*.04,y+r*.3-bh+6+wn*8,3,3);}c.shadowColor='#ff3db5';c.shadowBlur=14;c.strokeStyle='#ff3db5';c.lineWidth=2;c.beginPath();c.moveTo(x-r*.7,y+r*.34);c.lineTo(x+r*.7,y+r*.34);c.stroke();c.shadowBlur=0;}
      if(k==='zandland'){[[-.3,.55],[.25,.7],[.55,.4]].forEach(function(q){var px=x+q[0]*r,s=r*q[1];c.fillStyle='#e8a860';c.beginPath();c.moveTo(px-s*.5,y+r*.25);c.lineTo(px,y+r*.25-s*.6);c.lineTo(px+s*.5,y+r*.25);c.closePath();c.fill();c.fillStyle='rgba(120,60,20,.25)';c.beginPath();c.moveTo(px,y+r*.25-s*.6);c.lineTo(px+s*.5,y+r*.25);c.lineTo(px+s*.1,y+r*.25);c.closePath();c.fill();});c.fillStyle='#2f7a4a';c.fillRect(x-r*.65,y-r*.05,4,r*.28);}
      if(k==='mazi'){for(var tr=0;tr<9;tr++){var tx=x-r*.65+(tr%5)*r*.32,ty=y-r*.25+Math.floor(tr/5)*r*.42;c.fillStyle=tr%2?'#2a8a3a':'#5ac85a';c.beginPath();c.arc(tx,ty,r*.16,0,TAU);c.fill();}c.fillStyle='#7a8a6a';for(var s2=0;s2<3;s2++)c.fillRect(x-r*(.22-s2*.07),y+r*.05-s2*r*.12,r*(.44-s2*.14),r*.12);c.fillStyle='rgba(198,255,61,'+(.5+.5*Math.sin(t*2))+')';c.beginPath();c.arc(x,y-r*.35,3,0,TAU);c.fill();}
      if(k==='yana'){[[-.35,.75],[.15,1],[.5,.65]].forEach(function(q){var px=x+q[0]*r,s=r*q[1]*.7;c.fillStyle='#8aa0d0';c.beginPath();c.moveTo(px-s*.6,y+r*.2);c.lineTo(px,y+r*.2-s);c.lineTo(px+s*.6,y+r*.2);c.closePath();c.fill();c.fillStyle='#ffffff';c.beginPath();c.moveTo(px-s*.22,y+r*.2-s*.62);c.lineTo(px,y+r*.2-s);c.lineTo(px+s*.22,y+r*.2-s*.62);c.closePath();c.fill();});c.fillStyle='#f4f8ff';c.beginPath();c.arc(x-r*.45,y+r*.45,r*.16,Math.PI,0);c.fill();c.strokeStyle='#a8c0e0';c.lineWidth=1;c.stroke();}
      if(k==='muma'){c.fillStyle='#4ad8e8';c.beginPath();c.ellipse(x+r*.05,y+r*.05,r*.42,r*.3,0,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(x-r*.05,y-r*.02,r*.2,r*.07,0,0,TAU);c.fill();[[-.6,-.1],[.55,-.35],[.6,.4]].forEach(function(q){var px=x+q[0]*r,py=y+q[1]*r;c.strokeStyle='#8a6a3a';c.lineWidth=2;c.beginPath();c.moveTo(px,py+r*.18);c.lineTo(px+2,py);c.stroke();c.fillStyle='#1f9a5a';for(var lf=0;lf<5;lf++){c.beginPath();c.ellipse(px+Math.cos(lf*1.25)*r*.1,py+Math.sin(lf*1.25)*r*.05-2,r*.11,r*.04,lf*1.25,0,TAU);c.fill();}});c.fillStyle='#ff5a5a';c.fillRect(x+r*.72,y-r*.3,5,r*.4);c.fillStyle='#ffe07a';c.fillRect(x+r*.72,y-r*.36,5,5);}
      c.restore();});
    /* compass */
    var cx=w*.5,cy=h*.47,cr=Math.min(w,h)*.07;c.save();c.translate(cx,cy);c.rotate(Math.sin(t*.3)*.05);c.fillStyle='rgba(255,246,220,.12)';c.beginPath();c.arc(0,0,cr*1.25,0,TAU);c.fill();c.strokeStyle='rgba(255,246,220,.5)';c.lineWidth=1.5;c.beginPath();c.arc(0,0,cr,0,TAU);c.stroke();
    for(var q=0;q<4;q++){c.rotate(Math.PI/2);c.fillStyle=q%2?'#fff6dc':'#ffd23d';c.beginPath();c.moveTo(0,-cr*1.1);c.lineTo(cr*.18,0);c.lineTo(-cr*.18,0);c.closePath();c.fill();}c.restore();c.fillStyle='rgba(255,246,220,.85)';c.font="800 "+Math.max(10,cr*.32|0)+"px 'Chakra Petch',sans-serif";c.textAlign='center';c.fillText('N',cx,cy-cr*1.3);
    mapRaf=requestAnimationFrame(drawMapLoop);}

  /* ---------- passport ---------- */
  function openPass(){var o=document.getElementById('fw-pass');if(o)o.remove();o=document.createElement('div');o.id='fw-pass';o.setAttribute('data-testid','fw-passport');
    o.innerHTML='<div class="fwp-card"><div class="fwp-head"><div><b>FREA WORLD PASSPORT</b><small>'+totalStamps()+' / 18 stamps collected</small></div><button class="fwm-x" data-testid="fw-passport-close" aria-label="Close passport">✕</button></div><div class="fwp-grid">'+
      ORDER.map(function(k){var d=LANDS[k],s=D.s[k]||{};return '<div class="fwp-land" style="--fw:'+d.col+'" data-testid="fw-pass-'+k+'"><div class="fwp-n"><i>'+ICON[k]+'</i><b>'+d.name+'</b><small>'+d.climate.t+'</small></div><div class="fwp-st"><span class="'+(s.visit?'got':'')+'" title="Visit">📍</span><span class="'+(s.act?'got':'')+'" title="'+d.act.n+'">'+d.act.i+'</span><span class="'+(s.gems?'got':'')+'" title="All gems">💎</span></div><small class="fwp-p">'+d.act.n+' '+Math.min(D.a[k]||0,d.act.goal)+'/'+d.act.goal+' · Gems '+gemsOf(k)+'/3</small></div>';}).join('')+'</div></div>';
    document.body.appendChild(o);o.addEventListener('pointerdown',function(e){e.stopPropagation();});o.querySelector('.fwm-x').onclick=function(){o.remove();};o.onclick=function(e){if(e.target===o)o.remove();};}

  /* ---------- Zen chooser entry card ---------- */
  function hookChooser(){var d=document.getElementById('zen-choose');if(!d||!d.classList.contains('show'))return;var opts=d.querySelector('.zc-opts');if(!opts||opts.querySelector('#zc-fw'))return;
    var b=document.createElement('button');b.id='zc-fw';b.className='zc-opt zc-fw';b.setAttribute('data-testid','zen-choose-frea-world');
    b.innerHTML='<div class="zc-art fw-art"><canvas aria-hidden="true"></canvas><em>NEW · EXPLORE</em></div><div class="zc-body"><b>Frea World</b><small>'+totalStamps()+'/18 stamps · 6 lands</small><ul><li>Travel a world map to six unique lands</li><li>Climates, weather &amp; a signature activity each</li><li>Hunt hidden gems &amp; fill your passport</li></ul><span class="zc-go">Open map ›</span></div>';
    opts.appendChild(b);b.onclick=function(){d.classList.remove('show');openMap(true);};
    var cv=b.querySelector('canvas'),c=cv.getContext('2d');cv.width=320;cv.height=150;var g=c.createLinearGradient(0,0,0,150);g.addColorStop(0,'#1a6aa8');g.addColorStop(1,'#0a2a5a');c.fillStyle=g;c.fillRect(0,0,320,150);
    ORDER.forEach(function(k,i){var p=POS[k],x=p[0]*3.2,y=p[1]*1.5,col=LANDS[k].col;c.fillStyle='#f4e0a8';blobPath(c,x,y,24,i*2.1,.12);c.fill();c.fillStyle=col;blobPath(c,x,y,19,i*2.1+.5,.1);c.fill();c.font='16px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(ICON[k],x,y);});}
  new MutationObserver(function(){hookChooser();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

  return {open:function(){openMap(false);},go:function(k){return go(k,null);},leave:leave,land:function(){return FW.land;},state:function(){return {land:FW.land,prog:FW.prog,gems:FW.gemsHere,stamps:totalStamps(),data:D,tide:FW.land==='muma'?tideY():null,storm:FW.storm,lanterns:(FW.lanterns||[]).length,snow:(FW.snow||[]).length};},lands:LANDS,order:ORDER,snowball:snowball,passport:openPass,
    _reset:function(){D={v:{},g:{},a:{},s:{}};save();}};
})();
window.FreaWorld=FreaWorld;
