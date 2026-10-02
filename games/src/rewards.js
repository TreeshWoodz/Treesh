/* =====================================================================
   REWARDS — Starlite Shop · Daily Quests · Trophy Showcase
   Shop tabs: Cosmetics (locks premium Studio items) · Arenas (match backdrop)
              · Themes (UI accent + lobby backdrop) · Furniture (bundles → storage)
              · Earn (daily quests, streak, how to earn)
   Showcase: 3 pinned favourites + Rarest/Recent rows + full grid, shown on the
             in-game Treesh profile card, the lobby profile chip, and published
             to localStorage 'treesh_trophies' for the Treesh parent profile.
   ===================================================================== */
var FreaShop=(function(){
  var OK='frea_owned_v1',EK='frea_equip_v1',PK='frea_trophy_pins_v1',QK='frea_quests_v1',SK='frea_house_stash_v1';
  var owned=Treesh.get(OK,{}),eq=Treesh.get(EK,{arena:'auto',theme:'neon'});
  function saveO(){Treesh.set(OK,owned);}function saveE(){Treesh.set(EK,eq);}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function toast(a,b,ic){try{Treesh.toast(a,b,ic||'✦','info');}catch(e){}}
  /* ---------------- catalogue ---------------- */
  var COS=[ /* [field,value,label,price] */
    ['hat','crown','Royal Crown',300],['hat','halo','Halo',250],['hat','wizard','Wizard Hat',220],['hat','tiara','Tiara',260],['hat','headphones','Headphones',180],['hat','propeller','Propeller Cap',160],
    ['wings','dragon','Dragon Wings',420],['wings','angel','Angel Wings',380],['wings','crystal','Crystal Wings',480],['wings','tech','Tech Wings',320],['wings','bat','Bat Wings',300],
    ['cape','royal','Royal Cape',320],['cape','star','Starry Cape',360],['cape','vampire','Vampire Cape',260],
    ['aura','rainbow','Rainbow Aura',450],['aura','gold','Gold Aura',260],['aura','fire','Fire Aura',300],['aura','ice','Ice Aura',300],
    ['trail','rainbow','Rainbow Trail',340],['trail','lightning','Lightning Trail',280],['trail','stars','Star Trail',220],['trail','hearts','Heart Trail',180],
    ['pattern','galaxy','Galaxy Skin',320],['pattern','glitter','Glitter Skin',240],['pattern','flames','Flame Skin',220],['pattern','circuit','Circuit Skin',200],
    ['glasses','vr','VR Visor',160],['glasses','heart','Heart Shades',120],['eyes','sparkle','Sparkle Lashes',150],['eyes','star','Star Eyes',120]];
  var COSMAP={};COS.forEach(function(c){COSMAP[c[0]+':'+c[1]]=c;});
  var ARENAS=[['candy',400],['space',500],['cyber',450],['castle',450],['aurora',500],['sakura',400],['lagoon',450],['volcano',400],['underwater',450],['clouds',400],['snow',350],['desert',350],['city',350]];
  var THEMES=[ /* id,name,cyan,pink,scene,price */
    ['neon','Neon Night','#2de2ff','#ff3db5','meadow',0],['sunset','Sunset Drive','#ffb03d','#ff5a7a','desert',300],['ocean','Deep Ocean','#3dd6ff','#5a7aff','underwater',300],
    ['forest','Moon Forest','#39ff7a','#c6ff3d','grove',300],['candy','Candy Pop','#ff9ac8','#b98cff','candy',350],['aurora','Aurora','#7affd8','#9b6bff','aurora',400],
    ['royal','Royal Gold','#ffd23d','#9b6bff','castle',400],['cyber','Cyberpunk','#ff3db5','#2de2ff','cyber',350]];
  var BUNDLES=[ /* id,name,icon,items */
    ['cozy','Cozy Living Room','🛋️',['couch','armchair','lamp','plant','table']],['game','Game Room','🕹️',['tv','arcade','speaker','beanbag']],
    ['chef','Chef\'s Kitchen','🍳',['fridge','stove','counter','table']],['dream','Dream Bedroom','🛏️',['bed','nightstand','dresser','floorlamp']],
    ['jungle','Indoor Jungle','🪴',['bigplant','plant','mushroom','aquarium']],['studio','Artist Studio','🎨',['easel','bookshelf','piano','lamp']]];
  function cat(){try{return (window.FreaHouse&&FreaHouse.cat)||{};}catch(e){return {};}}
  function bundleItems(b){var C=cat();return b[3].filter(function(t){return C[t];});}
  function bundleFull(b){var C=cat();return bundleItems(b).reduce(function(a,t){return a+(C[t].price||0);},0);}
  function bundlePrice(b){return Math.round(bundleFull(b)*0.7/5)*5;}
  /* ---------------- ownership ---------------- */
  function has(id){return !!owned[id];}
  function grant(id){owned[id]=Date.now();saveO();}
  function buy(id,price,name,after){if(has(id))return true;if(!Treesh.spend(price,'Shop: '+name)){toast('Need '+(price-Treesh.points())+' more ✦',"Win matches & finish daily quests to earn more",'🔒');return false;}
    grant(id);try{if(typeof sfx==='function')sfx('win');}catch(e){}toast('Unlocked!',name,'🛍️');try{Trophies.count('shopBuys');}catch(e){}if(after)after();return true;}
  /* grandfather: anything already worn by a saved flea stays free forever */
  (function migrate(){if(owned._mig)return;try{(saved||[]).forEach(function(f){COS.forEach(function(c){if(f[c[0]]===c[1])owned['cos:'+c[0]+':'+c[1]]=1;});});}catch(e){}owned._mig=1;saveO();})();
  function locked(field,val){var c=COSMAP[field+':'+val];return !!(c&&!has('cos:'+field+':'+val));}
  function price(field,val){var c=COSMAP[field+':'+val];return c?c[3]:0;}
  /* Studio calls this when a locked tile is tapped */
  function offer(field,val,onOk){var c=COSMAP[field+':'+val];if(!c)return onOk&&onOk();
    confirmBox('<div class="sh-cf-ico">🔒</div><b>'+esc(c[2])+'</b><p>Unlock this look for every flea you create.</p>','Unlock · ✦ '+c[3],function(){buy('cos:'+field+':'+val,c[3],c[2],onOk);});}
  function confirmBox(html,label,ok){document.querySelectorAll('.sh-confirm').forEach(function(o){o.remove();});var m=document.createElement('div');m.className='sh-confirm';m.setAttribute('data-testid','shop-confirm');
    var can=true;m.innerHTML='<div class="sh-cf-card">'+html+'<div class="sh-cf-bal">Balance · ✦ '+Treesh.fmt(Treesh.points())+'</div><div class="sh-cf-row"><button class="sh-btn ghost" data-x data-testid="shop-confirm-cancel">Not now</button><button class="sh-btn gold" data-ok data-testid="shop-confirm-buy">'+label+'</button></div></div>';
    document.body.appendChild(m);requestAnimationFrame(function(){m.classList.add('show');});
    var done=false;function close(){if(done)return;done=true;m.classList.remove('show');m.classList.add('closing');setTimeout(function(){m.remove();},200);}
    m.addEventListener('click',function(e){if(done)return;if(e.target===m||e.target.closest('[data-x]'))close();else if(e.target.closest('[data-ok]')){close();ok();}});
    m.addEventListener('keydown',function(e){if(e.key==='Escape'){e.stopPropagation();close();}});
    setTimeout(function(){try{m.querySelector('[data-x]').focus();}catch(e){}},30);}
  /* ---------------- equip: arenas + themes ---------------- */
  function applyTheme(){var t=THEMES.filter(function(x){return x[0]===eq.theme;})[0]||THEMES[0];var r=document.documentElement.style;
    function rgb(h){var n=parseInt(h.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255].join(',');}
    r.setProperty('--cyan',t[2]);r.setProperty('--cyan-rgb',rgb(t[2]));r.setProperty('--pink',t[3]);
    try{if(window.FreaArenas||typeof Arenas!=='undefined'){(window.FreaArenas||Arenas).modeScene.title=t[4];}}catch(e){}
    document.documentElement.setAttribute('data-frea-theme',t[0]);}
  try{var _dbg=drawBG;drawBG=function(){try{if(eq.arena&&eq.arena!=='auto'&&STATE!=='title'&&gameMode!=='zen'&&gameMode!=='hoops'&&gameMode!=='tutorial'&&typeof Arenas!=='undefined'&&Arenas.scenes[eq.arena]){Arenas.paint(eq.arena);return;}}catch(e){}return _dbg.apply(this,arguments);};}catch(e){}
  applyTheme();
  /* ---------------- furniture storage (consumed by the Flea House) ---------------- */
  function stash(){return Treesh.get(SK,{});}
  function stashTake(t){var s=stash();if(!s[t])return false;s[t]--;if(!s[t])delete s[t];Treesh.set(SK,s);return true;}
  function stashAdd(list){var s=stash();list.forEach(function(t){s[t]=(s[t]||0)+1;});Treesh.set(SK,s);}
  /* ---------------- daily quests ---------------- */
  var QPOOL=[['play3','Play 3 matches',25,function(b){return [d(b,'matchesPlayed'),3];}],['win1','Win a match',30,function(b){return [wins()-(b._wins||0),1];}],
    ['win2','Win 2 matches',45,function(b){return [wins()-(b._wins||0),2];}],['launch','Launch 60 times',15,function(b){return [d(b,'totalLaunches'),60];}],
    ['orbs','Grab 12 orbs in Capture',20,function(b){return [d(b,'orbsCaptured'),12];}],['hoops','Score 5 hoops',20,function(b){return [d(b,'hoopsScored'),5];}],
    ['emote','Send 5 emotes in Zen',15,function(b){return [d(b,'emoteInteractions'),5];}],['zenobj','Place 8 Zen objects',15,function(b){return [d(b,'objectsPlaced'),8];}],
    ['infect','Infect 6 fleas',20,function(b){return [d(b,'lifetimeInfected'),6];}]];
  function d(b,k){return Math.max(0,((typeof STATS!=='undefined'&&STATS[k])||0)-(b[k]||0));}
  function wins(){var w=(typeof STATS!=='undefined'&&STATS.winsByMode)||{};return Object.keys(w).reduce(function(a,k){return a+(+w[k]||0);},0);}
  function quests(){var q=Treesh.get(QK,null),tk=Treesh.dayKey();
    if(!q||q.k!==tk){var b={};['matchesPlayed','totalLaunches','orbsCaptured','hoopsScored','emoteInteractions','objectsPlaced','lifetimeInfected'].forEach(function(k){b[k]=(typeof STATS!=='undefined'&&STATS[k])||0;});b._wins=wins();
      var seed=0;for(var i=0;i<tk.length;i++)seed=(seed*31+tk.charCodeAt(i))>>>0;var pool=QPOOL.slice(),pick=[];while(pick.length<3&&pool.length){seed=(seed*1664525+1013904223)>>>0;var j=seed%pool.length;var x=pool.splice(j,1)[0];if(pick.some(function(p){return p.indexOf('win')===0;})&&x[0].indexOf('win')===0)continue;pick.push(x[0]);}
      q={k:tk,ids:pick,base:b,claimed:{},bonus:false};Treesh.set(QK,q);}return q;}
  function qinfo(q,id){var Q=QPOOL.filter(function(x){return x[0]===id;})[0];var p=Q[3](q.base);return {id:id,name:Q[1],rew:Q[2],cur:Math.min(p[0],p[1]),goal:p[1],done:p[0]>=p[1],claimed:!!q.claimed[id]};}
  function claim(id){var q=quests(),i=qinfo(q,id);if(!i.done||i.claimed)return;q.claimed[id]=1;Treesh.set(QK,q);Treesh.award(i.rew,'Quest: '+i.name,{icon:'🎯',kind:'quest'});
    if(q.ids.every(function(x){return q.claimed[x];})&&!q.bonus){q.bonus=true;Treesh.set(QK,q);setTimeout(function(){Treesh.award(30,'All daily quests done',{icon:'🏅'});},900);}render();badge();}
  function questsReady(){var q=quests();return q.ids.filter(function(id){var i=qinfo(q,id);return i.done&&!i.claimed;}).length;}
  /* ---------------- trophy showcase ---------------- */
  var TR={platinum:4,gold:3,silver:2,bronze:1};
  function U(){return Trophies.unlocked();}
  function pins(){var u=U();return Treesh.get(PK,[]).filter(function(id){return u[id];}).slice(0,3);}
  function setPins(p){Treesh.set(PK,p.slice(0,3));publish();}
  function togglePin(id){var p=pins(),i=p.indexOf(id);if(i>=0)p.splice(i,1);else{if(p.length>=3){toast('Showcase is full','Unpin one first (max 3)','📌');return;}p.push(id);}setPins(p);}
  function byId(id){return Trophies.list.filter(function(t){return t.id===id;})[0];}
  function rarest(){var u=U();return Trophies.list.filter(function(t){return u[t.id];}).sort(function(a,b){return (TR[b.tier]-TR[a.tier])||(u[b.id]-u[a.id]);});}
  function recent(){var u=U();return Trophies.list.filter(function(t){return u[t.id];}).sort(function(a,b){return u[b.id]-u[a.id];});}
  function featured(){var p=pins().map(byId).filter(Boolean),auto=rarest().filter(function(t){return p.indexOf(t)<0;});var out=p.map(function(t){return {t:t,pin:true};});while(out.length<3&&auto.length)out.push({t:auto.shift(),pin:false});return out;}
  function medal(t,cls,extra){var c=Trophies.tiers[t.tier].c;return '<span class="sc-medal '+(cls||'')+'" style="--tc:'+c+'" title="'+esc(t.name+' · '+Trophies.tiers[t.tier].n)+'" '+(extra||'')+'><i>'+t.ico+'</i></span>';}
  var scSort='rarest';
  function showcaseHTML(compact){var f=featured(),got=Object.keys(U()).length,tot=Trophies.list.length;
    var h='<div class="sc-wrap" data-testid="trophy-showcase"><div class="sc-head"><b>Trophy Showcase</b><small>'+got+' / '+tot+' unlocked</small><button class="sc-all" data-sc-all data-testid="showcase-view-all">View all ›</button></div><div class="sc-feat">';
    for(var i=0;i<3;i++){var x=f[i];h+=x?'<div class="sc-slot got" data-testid="showcase-slot-'+i+'">'+medal(x.t,'big')+'<b>'+esc(x.t.name)+'</b><small>'+Trophies.tiers[x.t.tier].n+(x.pin?' · 📌':'')+'</small></div>':'<div class="sc-slot" data-testid="showcase-slot-'+i+'"><span class="sc-medal big empty"><i>?</i></span><b>Empty slot</b><small>Unlock a trophy</small></div>';}
    h+='</div>';if(compact)return h+'</div>';
    var row=(scSort==='rarest'?rarest():recent()).slice(0,8);
    h+='<div class="sc-tabs" role="tablist"><button class="'+(scSort==='rarest'?'on':'')+'" data-sc-sort="rarest" data-testid="showcase-sort-rarest">Rarest</button><button class="'+(scSort==='recent'?'on':'')+'" data-sc-sort="recent" data-testid="showcase-sort-recent">Recent</button></div>';
    h+='<div class="sc-row" data-testid="showcase-row">'+(row.length?row.map(function(t){return medal(t,'');}).join(''):'<span class="sc-none">Play any mode to earn your first trophy!</span>')+'</div>';
    return h+'<div class="sc-tip">Tip: pin up to 3 favourites with 📌 in the Trophy Room.</div></div>';}
  function wireShowcase(host){if(!host)return;[].forEach.call(host.querySelectorAll('[data-sc-sort]'),function(b){b.onclick=function(e){e.stopPropagation();scSort=b.dataset.scSort;var w=host.querySelector('.sc-wrap');if(w){w.outerHTML=showcaseHTML(false);wireShowcase(host);}};});
    [].forEach.call(host.querySelectorAll('[data-sc-all]'),function(b){b.onclick=function(e){e.stopPropagation();try{custModal.classList.add('open');pmShow('trophies');}catch(x){}};});}
  /* inject into the in-game Treesh profile card */
  try{var _rs=renderStats;renderStats=function(){_rs.apply(this,arguments);var card=document.querySelector('#stats-body .tp-card');if(!card||card.querySelector('.sc-wrap'))return;var ch=card.querySelector('.tp-chips');var div=document.createElement('div');div.innerHTML=showcaseHTML(false);var n=div.firstChild;if(ch&&ch.nextSibling)card.insertBefore(n,ch.nextSibling);else card.appendChild(n);wireShowcase(card);};}catch(e){}
  /* pin buttons + showcase strip inside the Trophy Room */
  function decorateRoom(){var host=document.getElementById('trophy-body');if(!host||host._dec)return;host._dec=1;var p=pins(),u=U();
    if(!host.querySelector('.sc-wrap')){var d=document.createElement('div');d.innerHTML=showcaseHTML(true);var s=host.querySelector('.tr-summary');if(s&&s.nextSibling)host.insertBefore(d.firstChild,s.nextSibling);wireShowcase(host);var all=host.querySelector('[data-sc-all]');if(all)all.remove();}
    [].forEach.call(host.querySelectorAll('.tr-card.got'),function(c){var id=(c.getAttribute('data-testid')||'').replace('trophy-','');if(!u[id]||c.querySelector('.tr-pin'))return;var b=document.createElement('button');b.className='tr-pin'+(p.indexOf(id)>=0?' on':'');b.setAttribute('data-testid','trophy-pin-'+id);b.title=p.indexOf(id)>=0?'Unpin from showcase':'Pin to showcase';b.setAttribute('aria-pressed',p.indexOf(id)>=0);b.textContent='📌';
      b.onclick=function(e){e.stopPropagation();togglePin(id);host._dec=0;host.querySelectorAll('.tr-pin').forEach(function(x){x.remove();});var w=host.querySelector('.sc-wrap');if(w)w.remove();decorateRoom();};c.appendChild(b);});}
  try{new MutationObserver(function(){var h=document.getElementById('trophy-body');if(h){h._dec=0;decorateRoom();}}).observe(document.getElementById('profile-modal')||document.body,{childList:true,subtree:true});}catch(e){}
  /* tiny medals on the lobby profile chip */
  function lobbyMedals(){var pc=document.getElementById('stats-toggle');if(!pc)return;var m=pc.querySelector('.pc-medals');if(!m){m=document.createElement('span');m.className='pc-medals';m.setAttribute('data-testid','lobby-showcase-medals');pc.appendChild(m);}
    var f=featured();m.innerHTML=f.map(function(x){return medal(x.t,'mini');}).join('');m.style.display=f.length?'':'none';}
  /* publish for the Treesh parent app profile */
  function publish(){try{var u=U(),p=pins();var data={v:1,updated:Date.now(),got:Object.keys(u).length,total:Trophies.list.length,pins:p,
      list:Trophies.list.map(function(t){var pr=[0,1];try{var r=t.fn();pr=[Math.min(r[0]||0,r[1]),r[1]];}catch(e){}return {id:t.id,ico:t.ico,name:t.name,desc:t.desc,tier:t.tier,color:Trophies.tiers[t.tier].c,mode:t.mode,at:u[t.id]||0,cur:pr[0],goal:pr[1]};})};
      var old=localStorage.getItem('treesh_trophies'),nw=JSON.stringify(data);if(old&&old.replace(/"updated":\d+,/,'')===nw.replace(/"updated":\d+,/,''))return;localStorage.setItem('treesh_trophies',nw);
      if(window.parent&&window.parent!==window)window.parent.postMessage({type:'treesh:trophies',v:1,source:'frea'},'*');}catch(e){}lobbyMedals();}
  try{var _ck=Trophies.check;Trophies.check=function(){_ck.apply(this,arguments);setTimeout(publish,400);};}catch(e){}
  /* ---------------- shop UI ---------------- */
  var root=null,tab='cosmetics',cosF='hat';
  function build(){root=document.createElement('div');root.id='frea-shop';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Starlite Shop');root.setAttribute('data-testid','starlite-shop');
    root.innerHTML='<div class="sh-card"><header class="sh-top"><div class="sh-title"><span class="star-ico">✦</span> Starlite <span>Shop</span></div><div class="sh-bal" data-testid="shop-balance"><span class="star-ico">✦</span><b data-star-count>0</b></div><button class="sh-x" data-testid="shop-close" aria-label="Close">✕</button></header>'+
      '<nav class="sh-tabs" role="tablist"></nav><div class="sh-body" id="sh-body"></div></div>';
    document.body.appendChild(root);root.addEventListener('click',function(e){if(e.target===root)close();});root.querySelector('.sh-x').onclick=close;
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&root.classList.contains('show'))close();});}
  var TABS=[['cosmetics','Cosmetics','🎩'],['arenas','Arenas','🏟️'],['themes','Themes','🎨'],['furniture','Furniture','🛋️'],['earn','Earn','🎯']];
  function render(){if(!root||!root.classList.contains('show'))return;var nr=questsReady();
    root.querySelector('.sh-tabs').innerHTML=TABS.map(function(t){return '<button role="tab" aria-selected="'+(t[0]===tab)+'" class="'+(t[0]===tab?'on':'')+'" data-tab="'+t[0]+'" data-testid="shop-tab-'+t[0]+'"><i>'+t[2]+'</i><span>'+t[1]+'</span>'+(t[0]==='earn'&&nr?'<em>'+nr+'</em>':'')+'</button>';}).join('');
    [].forEach.call(root.querySelectorAll('[data-tab]'),function(b){b.onclick=function(){tab=b.dataset.tab;render();root.querySelector('.sh-body').scrollTop=0;};});
    var b=root.querySelector('.sh-body');b.innerHTML=({cosmetics:rCos,arenas:rArenas,themes:rThemes,furniture:rFurn,earn:rEarn})[tab]();
    Treesh.paint();wire(b);}
  function priceTag(p,own,on){return own?(on?'<span class="sh-tag on">Equipped</span>':'<span class="sh-tag own">Owned</span>'):'<span class="sh-tag'+(Treesh.canAfford(p)?'':' poor')+'">✦ '+p+'</span>';}
  function rCos(){var F=[['hat','Hats'],['wings','Wings'],['cape','Capes'],['aura','Auras'],['trail','Trails'],['pattern','Skins'],['glasses','Glasses'],['eyes','Eyes']];
    var h='<p class="sh-lead">Premium looks for your fleas. Unlock once, wear on every flea in the Character Studio.</p><div class="sh-chips">'+F.map(function(f){return '<button class="'+(cosF===f[0]?'on':'')+'" data-cf="'+f[0]+'" data-testid="shop-cos-filter-'+f[0]+'">'+f[1]+'</button>';}).join('')+'</div><div class="sh-grid">';
    COS.filter(function(c){return c[0]===cosF;}).forEach(function(c){var id='cos:'+c[0]+':'+c[1],own=has(id);h+='<button class="sh-item'+(own?' own':'')+'" data-buy-cos="'+c[0]+':'+c[1]+'" data-testid="shop-item-'+c[0]+'-'+c[1]+'"><canvas width="120" height="120" data-prev="'+c[0]+':'+c[1]+'"></canvas><b>'+esc(c[2])+'</b>'+priceTag(c[3],own)+'</button>';});
    return h+'</div><div class="sh-foot"><button class="sh-btn" data-open-studio data-testid="shop-open-studio">Open Character Studio ›</button></div>';}
  function sky(k){var s=(Arenas.scenes||{})[k];return s||{sky:['#111','#222','#333'],name:k};}
  function rArenas(){var h='<p class="sh-lead">Pick the arena for your matches. Your choice replaces each mode\'s default backdrop (Hoops and Zen keep their own).</p><div class="sh-grid wide">';
    h+='<button class="sh-arena'+(eq.arena==='auto'?' on':'')+'" data-arena="auto" data-testid="shop-arena-auto"><canvas width="240" height="130" data-sky="auto"></canvas><b>Signature arenas</b>'+priceTag(0,true,eq.arena==='auto')+'</button>';
    ARENAS.forEach(function(a){if(!Arenas.scenes||!Arenas.scenes[a[0]])return;var own=has('arena:'+a[0]);h+='<button class="sh-arena'+(eq.arena===a[0]?' on':'')+'" data-arena="'+a[0]+'" data-price="'+a[1]+'" data-testid="shop-arena-'+a[0]+'"><canvas width="240" height="130" data-sky="'+a[0]+'"></canvas><b>'+esc(sky(a[0]).name)+'</b>'+priceTag(a[1],own,eq.arena===a[0])+'</button>';});
    return h+'</div>';}
  function rThemes(){var h='<p class="sh-lead">Themes recolour the menus & HUD and change the lobby backdrop.</p><div class="sh-grid wide">';
    THEMES.forEach(function(t){var own=t[5]===0||has('theme:'+t[0]);h+='<button class="sh-theme'+(eq.theme===t[0]?' on':'')+'" data-theme="'+t[0]+'" data-testid="shop-theme-'+t[0]+'" style="--a:'+t[2]+';--b:'+t[3]+'"><canvas width="240" height="130" data-sky="'+t[4]+'"></canvas><span class="sh-sw"><i></i><i></i></span><b>'+esc(t[1])+'</b>'+priceTag(t[5],own,eq.theme===t[0])+'</button>';});
    return h+'</div>';}
  function rFurn(){var C=cat(),s=stash(),h='<p class="sh-lead">Furniture bundles at 30% off. Items go to your Flea House storage and place for free from the Buy menu.</p><div class="sh-grid wide">';
    BUNDLES.forEach(function(b){var it=bundleItems(b);if(!it.length)return;var pr=bundlePrice(b);h+='<div class="sh-bundle" data-testid="shop-bundle-'+b[0]+'"><div class="sh-bh"><i>'+b[2]+'</i><b>'+esc(b[1])+'</b></div><div class="sh-bitems">'+it.map(function(t){return '<span title="'+esc(C[t].name)+'" data-fth="'+t+'"></span>';}).join('')+'</div><div class="sh-brow"><s>✦ '+bundleFull(b)+'</s><button class="sh-btn gold" data-bundle="'+b[0]+'" data-testid="shop-bundle-buy-'+b[0]+'"'+(Treesh.canAfford(pr)?'':' disabled')+'>Buy · ✦ '+pr+'</button></div></div>';});
    var keys=Object.keys(s);h+='</div><div class="sh-stash" data-testid="shop-storage"><b>📦 In storage</b>'+(keys.length?keys.map(function(t){return '<span>'+esc((C[t]||{}).name||t)+' ×'+s[t]+'</span>';}).join(''):'<small>Empty. Buy a bundle to fill it up!</small>')+'</div>';
    return h+'<div class="sh-foot"><button class="sh-btn" data-open-house data-testid="shop-open-house">Go to Flea House ›</button></div>';}
  function rEarn(){var q=quests(),st=Treesh.streak(),h='<div class="sh-sec"><div class="sh-st"><b>Daily Quests</b><small>Resets at midnight · finish all 3 for +30 bonus</small></div>';
    q.ids.forEach(function(id){var i=qinfo(q,id);h+='<div class="sh-q'+(i.done?' done':'')+(i.claimed?' claimed':'')+'" data-testid="quest-'+id+'"><div class="sh-qi"><b>'+esc(i.name)+'</b><div class="sh-qbar"><i style="width:'+(i.cur/i.goal*100)+'%"></i></div><small>'+i.cur+' / '+i.goal+'</small></div>'+(i.claimed?'<span class="sh-tag own">Claimed</span>':'<button class="sh-btn gold" data-claim="'+id+'" data-testid="quest-claim-'+id+'"'+(i.done?'':' disabled')+'>+'+i.rew+' ✦</button>')+'</div>';});
    h+='</div><div class="sh-sec"><div class="sh-st"><b>Daily Streak</b><small>Come back every day. Bonus grows up to +50</small></div><div class="sh-streak" data-testid="shop-streak">';
    for(var k=1;k<=7;k++){var amt=20+Math.min(k-1,6)*5,on=((st-1)%7)+1>=k&&st>0;h+='<span class="'+(on?'on':'')+'"><b>Day '+k+'</b><small>+'+amt+'</small></span>';}
    h+='</div></div><div class="sh-sec"><div class="sh-st"><b>Ways to earn ✦</b></div><div class="sh-ways"><span>🎮 Play a match <b>+10</b></span><span>🏆 Win <b>+40</b></span><span>☀️ First win per mode daily <b>+25</b></span><span>🎖️ Trophies <b>+25–250</b></span><span>🌱 Garden harvests</span><span>🧘 Zen chill time</span></div></div>';
    return h;}
  function paintSky(cv,k){var x=cv.getContext('2d'),w=cv.width,h=cv.height,s=k==='auto'?{sky:['#1a1448','#3c2a7c','#ff8fb8'],sun:{x:.5,y:.62,r:.16,c:['#ffe27a','#ff5e9a']},stars:40}:sky(k);
    var g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,s.sky[0]);g.addColorStop(.6,s.sky[1]);g.addColorStop(1,s.sky[2]||s.sky[1]);x.fillStyle=g;x.fillRect(0,0,w,h);
    var R=function(i){return ((Math.sin(i*99.13)*43758.5)%1+1)%1;};x.fillStyle='rgba(255,255,255,.8)';for(var i=0;i<Math.min(60,(s.stars||0)/2);i++)x.fillRect(R(i)*w,R(i+7)*h*.6,1.3,1.3);
    var o=s.sun||s.moon;if(o){var c=Array.isArray(o.c)?o.c:[o.c,o.c],r=o.r*h*1.4,gg=x.createLinearGradient(0,o.y*h-r,0,o.y*h+r);gg.addColorStop(0,c[0]);gg.addColorStop(1,c[1]);x.fillStyle=gg;x.beginPath();x.arc(o.x*w,o.y*h,r,0,7);x.fill();}
    if(s.haze){var hz=x.createLinearGradient(0,h*.55,0,h);hz.addColorStop(0,'rgba(0,0,0,0)');hz.addColorStop(1,s.haze+'66');x.fillStyle=hz;x.fillRect(0,h*.55,w,h*.45);}
    x.fillStyle='rgba(8,6,22,.85)';x.beginPath();x.moveTo(0,h);for(var X=0;X<=w;X+=8)x.lineTo(X,h*.8-Math.sin(X*.03+(k.length))*h*.07-Math.sin(X*.011)*h*.06);x.lineTo(w,h);x.fill();}
  function wire(b){
    [].forEach.call(b.querySelectorAll('[data-cf]'),function(x){x.onclick=function(){cosF=x.dataset.cf;render();};});
    [].forEach.call(b.querySelectorAll('canvas[data-sky]'),function(cv){paintSky(cv,cv.dataset.sky);});
    var cvs=[].slice.call(b.querySelectorAll('canvas[data-prev]'));(function step(){var n=0;while(cvs.length&&n<4){var cv=cvs.shift(),kv=cv.dataset.prev.split(':');try{var rec=Object.assign({},saved.find(function(f){return f.id===activeId;})||saved[0]);rec[kv[0]]=kv[1];previewFlea(cv,rec);}catch(e){}n++;}if(cvs.length)requestAnimationFrame(step);})();
    [].forEach.call(b.querySelectorAll('[data-fth]'),function(s){try{s.appendChild(Furni.thumb(s.dataset.fth,30));}catch(e){}});
    [].forEach.call(b.querySelectorAll('[data-buy-cos]'),function(x){x.onclick=function(){var kv=x.dataset.buyCos.split(':');if(has('cos:'+kv[0]+':'+kv[1])){wearNow(kv[0],kv[1]);return;}offer(kv[0],kv[1],function(){render();});};});
    [].forEach.call(b.querySelectorAll('[data-arena]'),function(x){x.onclick=function(){var k=x.dataset.arena,p=+x.dataset.price||0;var go=function(){eq.arena=k;saveE();toast('Arena equipped',k==='auto'?'Signature arenas':sky(k).name,'🏟️');render();};
      if(k==='auto'||has('arena:'+k))return go();confirmBox('<div class="sh-cf-ico">🏟️</div><b>'+esc(sky(k).name)+'</b><p>Play every match in this arena.</p>','Unlock · ✦ '+p,function(){buy('arena:'+k,p,sky(k).name+' arena',go);});};});
    [].forEach.call(b.querySelectorAll('[data-theme]'),function(x){x.onclick=function(){var t=THEMES.filter(function(y){return y[0]===x.dataset.theme;})[0];var go=function(){eq.theme=t[0];saveE();applyTheme();toast('Theme applied',t[1],'🎨');render();};
      if(!t[5]||has('theme:'+t[0]))return go();confirmBox('<div class="sh-cf-ico">🎨</div><b>'+esc(t[1])+'</b><p>New colours for menus, HUD and the lobby.</p>','Unlock · ✦ '+t[5],function(){buy('theme:'+t[0],t[5],t[1]+' theme',go);});};});
    [].forEach.call(b.querySelectorAll('[data-bundle]'),function(x){x.onclick=function(){var bd=BUNDLES.filter(function(y){return y[0]===x.dataset.bundle;})[0],pr=bundlePrice(bd);
      confirmBox('<div class="sh-cf-ico">'+bd[2]+'</div><b>'+esc(bd[1])+'</b><p>'+bundleItems(bd).length+' items sent to your Flea House storage.</p>','Buy · ✦ '+pr,function(){if(!Treesh.spend(pr,'Bundle: '+bd[1])){toast('Not enough ✦','Earn more in matches','🔒');return;}stashAdd(bundleItems(bd));toast('Bundle delivered!',bd[1]+' is in storage','📦');render();});};});
    [].forEach.call(b.querySelectorAll('[data-claim]'),function(x){x.onclick=function(){claim(x.dataset.claim);};});
    var oh=b.querySelector('[data-open-house]');if(oh)oh.onclick=function(){close();try{setMode('zen');}catch(e){}toast('Open Zen → Flea House','Then tap Buy to place your storage items','🏠');};
  }
  function previewFlea(cv,rec){var q=cv.getContext('2d'),W2=cv.width,H2=cv.height;q.clearRect(0,0,W2,H2);var f=new Flea(0,0,true,'',specOf(rec));f.stuck=true;f.face=1;f.angle=0;f.hideName=true;
    var head=/hat|glasses|eyes/.test(cosF),Z=W2/(head?44:62),oy=head?H2*.86:H2*.58;var s=ctx;ctx=q;q.save();q.translate(W2/2,oy);q.scale(Z,Z);try{f.draw(f.cx,f.cy);}catch(e){}q.restore();ctx=s;}
  function wearNow(k,v){try{var c=saved.find(function(f){return f.id===activeId;})||saved[0];c[k]=v;saveFreas();try{repopulate();applyToUI();updateLobbyProfile();}catch(e){}toast('Equipped on '+c.name,'',"✨");}catch(e){}}
  function open(t){if(!root)build();if(t&&['cosmetics','arenas','themes','furniture','earn'].indexOf(t)>=0)tab=t;root.classList.add('show');document.body.classList.add('shop-open');render();setTimeout(function(){try{root.querySelector('.sh-x').focus();}catch(e){}},40);}
  function close(){if(!root)return;root.classList.remove('show');document.body.classList.remove('shop-open');}
  function badge(){var b=document.getElementById('ltop-coins');if(!b)return;var n=questsReady();b.classList.toggle('has-quest',n>0);b.setAttribute('data-quests',n);}
  /* lobby entry points: Starlites pill → shop */
  function wireLobby(){var c=document.getElementById('ltop-coins');if(c&&!c._shop){var nc=c.cloneNode(true);c.parentNode.replaceChild(nc,c);nc._shop=1;nc.title='Starlite Shop';nc.setAttribute('aria-label','Open Starlite Shop');nc.addEventListener('click',function(e){e.preventDefault();open();});}
    var host=document.querySelector('.ltop-right');if(host&&!document.getElementById('ltop-shop')){var s=document.createElement('button');s.id='ltop-shop';s.className='ltop-shop';s.setAttribute('data-testid','ltop-shop');s.title='Starlite Shop';s.innerHTML='<span>🛍️</span><b>Shop</b>';s.onclick=function(){open();};var gear=document.getElementById('ltop-gear');host.insertBefore(s,gear||null);}
    badge();lobbyMedals();Treesh.paint();}
  wireLobby();setTimeout(wireLobby,600);setInterval(function(){badge();if(root&&root.classList.contains('show')&&tab==='earn')render();},6000);
  Treesh.onChange(function(){if(root&&root.classList.contains('show')){Treesh.paint();}});
  setTimeout(publish,1200);
  return {open:open,close:close,locked:locked,price:price,offer:offer,has:has,stash:stash,stashTake:stashTake,stashAdd:stashAdd,quests:quests,claim:claim,pins:pins,togglePin:togglePin,publish:publish,equip:function(){return eq;}};
})();
window.FreaShop=FreaShop;
