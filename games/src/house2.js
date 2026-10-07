/* ===================== FLEA HOUSE 2 — more life-sim features =====================
   🎯 Daily goals (3 per in-game day, ✦ rewards) · 🎉 House party (disco lights, confetti, everyone dances)
   🐾 Pet slime you can adopt, name-free & cute (wanders, hops, gets petted) · 📸 Photo mode (saves a PNG)
   ⭐ House rating (1-5 stars from décor, variety, upstairs, garden, happiness) · 📬 Random life events */
var FreaHouse2=(function(){
  if(typeof House==='undefined')return null;
  var TAU=Math.PI*2,FH=270,SLAB=14,PK='frea_house2_v1';
  function el(id){return document.getElementById(id);}
  function ld(){try{return JSON.parse(localStorage.getItem(PK)||'{}')||{};}catch(e){return {};}}
  var X=ld();X.goals=X.goals||{};X.pet=X.pet||null;
  function sv(){try{localStorage.setItem(PK,JSON.stringify(X));}catch(e){}}
  function S(){return House.state()||{};}
  function R(){return House.residents()||[];}
  function mood(r){var n=r.needs||{};return ((n.hunger||0)+(n.energy||0)+(n.fun||0)+(n.social||0))/4;}
  function toast(msg,ico){var t=el('h2-toast');if(!t)return;t.innerHTML='<i>'+(ico||'✦')+'</i><span>'+msg+'</span>';t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(t._tm);t._tm=setTimeout(function(){t.classList.remove('show');},2800);}
  function award(n,why,ico){try{Treesh.award(n,why,{icon:ico||'🎯'});}catch(e){}}
  function boost(k,v){R().forEach(function(r){if(r.needs&&r.needs[k]!=null)r.needs[k]=Math.min(100,r.needs[k]+v);});}

  /* ---------------- house rating ---------------- */
  function rating(){var s=S(),items=s.items||[],cats={};items.forEach(function(it){var c=House.cat[it.type];if(c)cats[c.cat||c[2]]=1;});var nC=Object.keys(cats).length,happy=R().length?R().reduce(function(a,r){return a+mood(r);},0)/R().length:0;
    var sc=Math.min(1.6,items.length/18)+Math.min(1.2,nC/5)+(s.upstairs?.6:0)+Math.min(.8,happy/100*.8)+(s.garden&&s.garden.plots?.4:0)+(X.pet?.4:0);return Math.max(1,Math.min(5,Math.round(sc)));}

  /* ---------------- daily goals ---------------- */
  var POOL=[
    {id:'happy',t:'Get every flea above 70% mood',ico:'😊',r:20,chk:function(){return R().length&&R().every(function(r){return mood(r)>=70;});}},
    {id:'items',t:'Own 12+ pieces of furniture',ico:'🛋️',r:15,chk:function(){return (S().items||[]).length>=12;}},
    {id:'party',t:'Throw a house party',ico:'🎉',r:15,chk:function(){return !!X.goals._party;}},
    {id:'photo',t:'Snap a house photo',ico:'📸',r:10,chk:function(){return !!X.goals._photo;}},
    {id:'pet',t:'Pet your slime 5 times',ico:'🐾',r:12,chk:function(){return (X.goals._pets||0)>=5;}},
    {id:'rate',t:'Reach a ★★★ house rating',ico:'⭐',r:20,chk:function(){return rating()>=3;}},
    {id:'fed',t:'Keep everyone fed (hunger 60%+)',ico:'🍓',r:12,chk:function(){return R().length&&R().every(function(r){return (r.needs||{}).hunger>=60;});}},
    {id:'rested',t:'Everyone well rested (energy 60%+)',ico:'😴',r:12,chk:function(){return R().length&&R().every(function(r){return (r.needs||{}).energy>=60;});}},
    {id:'crowd',t:'Have 4+ residents',ico:'🏠',r:18,chk:function(){return R().length>=4;}}];
  function today(){var d=S().day||1;if(X.goals.day!==d){var seed=d*7919,ids=[],pool=POOL.filter(function(q){try{return !q.chk();}catch(e){return true;}});if(pool.length<3)pool=POOL.slice();while(ids.length<3&&pool.length){seed=(seed*16807)%2147483647;ids.push(pool.splice(seed%pool.length,1)[0].id);}X.goals={day:d,ids:ids,done:{}};sv();}return X.goals;}
  function checkGoals(){var g=today();g.ids.forEach(function(id){if(g.done[id])return;var q=POOL.filter(function(p){return p.id===id;})[0];if(q&&q.chk()){g.done[id]=1;sv();award(q.r,'Goal: '+q.t,q.ico);toast('Goal complete · '+q.t+' · +'+q.r+' ✦',q.ico);renderGoals();}});}
  function renderGoals(){var d=el('h2-goals');if(!d)return;var g=today(),n=g.ids.filter(function(i){return g.done[i];}).length;
    d.innerHTML='<div class="h2-dh"><b>Day '+(S().day||1)+' goals</b><span>'+n+'/3 done</span><button class="h2-x" data-testid="house-goals-close" aria-label="Close goals">✕</button></div>'+g.ids.map(function(id){var q=POOL.filter(function(p){return p.id===id;})[0];if(!q)return '';var ok=!!g.done[id];return '<div class="h2-goal'+(ok?' ok':'')+'" data-testid="house-goal-'+id+'"><i>'+q.ico+'</i><span>'+q.t+'</span><em>'+(ok?'✓':'+'+q.r+' ✦')+'</em></div>';}).join('')+
      '<div class="h2-rate" data-testid="house-rating-detail">House rating '+'★★★★★'.slice(0,rating())+'<s>'+'★★★★★'.slice(rating())+'</s></div>';
    d.querySelector('.h2-x').onclick=function(){d.classList.remove('show');};var b=el('h2-goal-btn');if(b)b.dataset.n=3-n;}

  /* ---------------- party ---------------- */
  var party=0,conf=[];
  function throwParty(){if(party>performance.now())return;party=performance.now()+16000;X.goals._party=1;sv();toast('PARTY TIME! Everyone dance!','🎉');
    R().forEach(function(r,i){try{r.f.action=['dance','headbang','cheer','wiggle'][i%4];r.f.actionT=0;r.f.actionUntil=Date.now()+15000;r.bub={e:['🎶','🕺','🎉','💃'][i%4],t:3};}catch(e){}});boost('fun',35);boost('social',40);
    for(var k=0;k<140;k++)conf.push({x:Math.random()*innerWidth,y:-Math.random()*innerHeight*.6,vx:(Math.random()-.5)*1.4,vy:1.2+Math.random()*2.2,r:Math.random()*6,c:['#ff3db5','#2de2ff','#ffd23d','#c6ff3d','#9b6bff'][k%5],s:3+Math.random()*4});}

  /* ---------------- pet ---------------- */
  var PCOL=['#7af0c8','#ff9ad8','#ffd23d','#9b8cff','#7ac8ff'];
  function adopt(){if(X.pet){toast('You already have a pet slime!','🐾');return;}try{if(!Treesh.canAfford(60)){toast('Need 60 ✦ to adopt a pet','🐾');return;}Treesh.spend(60,'Adopted a pet slime');}catch(e){}X.pet={c:PCOL[Math.random()*PCOL.length|0],x:300,floor:0,tx:300,hop:0,love:0};sv();toast('Welcome home, little slime!','🐾');renderTop();}
  function petTick(dt){var p=X.pet;if(!p)return;if(Math.abs(p.tx-p.x)<4){if(Math.random()<.006)p.tx=60+Math.random()*1240;}else{p.x+=Math.sign(p.tx-p.x)*Math.min(Math.abs(p.tx-p.x),dt*46);p.hop+=dt*9;}}
  function petScreen(){var p=X.pet;if(!p)return null;var y=-p.floor*FH-SLAB,s=House.w2s(p.x,y);return s;}
  /* ---------------- events ---------------- */
  var EV=[
    {t:'Pizza delivery! Everyone grabs a slice',ico:'🍕',fx:function(){boost('hunger',40);}},
    {t:'A neighbour flea pops by to say hi',ico:'👋',fx:function(){boost('social',30);}},
    {t:'Movie night! Fleas cuddle up',ico:'🍿',fx:function(){boost('fun',25);boost('social',15);}},
    {t:'Spa day — bubble baths for all',ico:'🛁',fx:function(){boost('energy',25);}},
    {t:'You found ✦10 under the couch!',ico:'🪙',fx:function(){award(10,'Found under the couch','🪙');}},
    {t:'Dance-off in the living room!',ico:'🕺',fx:function(){boost('fun',30);R().forEach(function(r){try{r.f.action='dance';r.f.actionUntil=Date.now()+5000;}catch(e){}});}}];
  var lastHour=-1;function evTick(){var s=S(),h=Math.floor((s.min||0)/60);if(h===lastHour)return;lastHour=h;if(Math.random()<.22){var e=EV[Math.random()*EV.length|0];e.fx();toast(e.t,e.ico);}}

  /* ---------------- photo ---------------- */
  function photo(){var cv=el('house-cv');if(!cv)return;try{var o=document.createElement('canvas');o.width=cv.width;o.height=cv.height+Math.round(cv.height*.08);var q=o.getContext('2d');q.fillStyle='#fff';q.fillRect(0,0,o.width,o.height);q.drawImage(cv,0,0);q.fillStyle='#1e1a3a';q.font='800 '+Math.round(o.height*.035)+"px 'Chakra Petch',sans-serif";q.textAlign='left';q.fillText('Flea House · Day '+(S().day||1)+'  '+'★★★★★'.slice(0,rating()),o.width*.03,cv.height+o.height*.055);
      var a=document.createElement('a');a.download='flea-house-day'+(S().day||1)+'.png';a.href=o.toDataURL('image/png');a.click();}catch(e){}
    var fl=el('h2-flash');if(fl){fl.classList.remove('go');void fl.offsetWidth;fl.classList.add('go');}X.goals._photo=1;sv();toast('Photo saved!','📸');}

  /* ---------------- overlay render ---------------- */
  var ov=null,oc=null,lastT=0;
  function loop(ts){requestAnimationFrame(loop);if(!House.isOpen()){if(ov)ov.style.display='none';return;}mount();ov.style.display='';var dt=Math.min(.05,(ts-(lastT||ts))/1000);lastT=ts;var t=ts/1000;
    if(ov.width!==innerWidth||ov.height!==innerHeight){ov.width=innerWidth;ov.height=innerHeight;}oc.clearRect(0,0,ov.width,ov.height);
    petTick(dt);var ps=petScreen();if(ps){var p=X.pet,z=1.2,bob=Math.abs(Math.sin(p.hop))*8,sq=1+Math.sin(p.hop*2)*.06,x=ps.x,y=ps.y-bob;oc.save();oc.fillStyle='rgba(0,0,0,.2)';oc.beginPath();oc.ellipse(ps.x,ps.y,14*z,4*z,0,0,TAU);oc.fill();
      var g=oc.createRadialGradient(x-5,y-16,2,x,y-10,18*z);g.addColorStop(0,'#ffffff');g.addColorStop(.35,p.c);g.addColorStop(1,'rgba(0,0,0,.25)');oc.fillStyle=g;oc.beginPath();oc.ellipse(x,y-11*z/sq,15*z*sq,12*z/sq,0,0,TAU);oc.fill();
      var dir=Math.sign(p.tx-p.x)||1;oc.fillStyle='#14102a';oc.beginPath();oc.arc(x-4+dir*2,y-13,2.4,0,TAU);oc.arc(x+5+dir*2,y-13,2.4,0,TAU);oc.fill();oc.fillStyle='#fff';oc.beginPath();oc.arc(x-3.4+dir*2,y-14,.9,0,TAU);oc.arc(x+5.6+dir*2,y-14,.9,0,TAU);oc.fill();
      oc.strokeStyle='#14102a';oc.lineWidth=1.4;oc.beginPath();oc.arc(x+dir*2,y-9,2.6,.2,Math.PI-.2);oc.stroke();if(p._love&&ts<p._love){oc.fillStyle='#ff3db5';oc.font='14px serif';oc.textAlign='center';oc.fillText('♥',x+Math.sin(t*6)*6,y-34-(p._love-ts)/100);}oc.restore();ps.r=20;X._ps=ps;}
    if(party>performance.now()){var k=(party-performance.now())/16000;oc.save();oc.globalCompositeOperation='lighter';for(var i=0;i<4;i++){var a=t*1.3+i*1.6,cx=ov.width*(.2+.2*i),g2=oc.createRadialGradient(cx+Math.sin(a)*120,ov.height*.45+Math.cos(a*1.3)*80,10,cx,ov.height*.45,ov.width*.3);g2.addColorStop(0,['rgba(255,61,181,.22)','rgba(45,226,255,.22)','rgba(255,210,61,.2)','rgba(155,107,255,.22)'][i]);g2.addColorStop(1,'rgba(0,0,0,0)');oc.fillStyle=g2;oc.fillRect(0,0,ov.width,ov.height);}oc.restore();
      var bx=ov.width/2,by=96;oc.strokeStyle='rgba(255,255,255,.4)';oc.beginPath();oc.moveTo(bx,60);oc.lineTo(bx,by-14);oc.stroke();var dg=oc.createRadialGradient(bx-4,by-4,2,bx,by,16);dg.addColorStop(0,'#fff');dg.addColorStop(1,'#8a8aa8');oc.fillStyle=dg;oc.beginPath();oc.arc(bx,by,15,0,TAU);oc.fill();oc.fillStyle='rgba(255,255,255,.8)';for(var m=0;m<10;m++){var ma=t*2+m*.63;oc.fillRect(bx+Math.cos(ma)*10-1.5,by+Math.sin(m)*10-1.5,3,3);}}
    if(conf.length){conf=conf.filter(function(c){c.x+=c.vx;c.y+=c.vy;c.r+=.08;return c.y<ov.height+20;});conf.forEach(function(c){oc.save();oc.translate(c.x,c.y);oc.rotate(c.r);oc.fillStyle=c.c;oc.fillRect(-c.s/2,-c.s/4,c.s,c.s/2);oc.restore();});}
    if(Math.floor(t)%2===0&&!loop._c){loop._c=1;checkGoals();evTick();renderTop();}else if(Math.floor(t)%2)loop._c=0;}
  function mount(){var root=el('house');if(!root)return;if(!ov||!ov.isConnected){ov=document.createElement('canvas');ov.id='h2-ov';ov.setAttribute('aria-hidden','true');root.appendChild(ov);oc=ov.getContext('2d');}
    if(!el('h2-bar')){var b=document.createElement('div');b.id='h2-bar';b.setAttribute('data-testid','house-feature-bar');
      b.innerHTML='<button id="h2-goal-btn" data-testid="house-goals-btn" title="Daily goals"><i>🎯</i><span>Goals</span></button><button id="h2-party-btn" data-testid="house-party-btn" title="Throw a party"><i>🎉</i><span>Party</span></button><button id="h2-pet-btn" data-testid="house-pet-btn" title="Pet"><i>🐾</i><span>Pet</span></button><button id="h2-photo-btn" data-testid="house-photo-btn" title="Photo"><i>📸</i><span>Photo</span></button><div class="h2-stars" id="h2-stars" data-testid="house-rating">★</div>';
      root.appendChild(b);var g=document.createElement('div');g.id='h2-goals';g.className='h2-drawer';g.setAttribute('data-testid','house-goals-drawer');root.appendChild(g);
      var t=document.createElement('div');t.id='h2-toast';t.setAttribute('data-testid','house-event-toast');root.appendChild(t);var f=document.createElement('div');f.id='h2-flash';root.appendChild(f);
      el('h2-goal-btn').onclick=function(){renderGoals();g.classList.toggle('show');};el('h2-party-btn').onclick=throwParty;el('h2-photo-btn').onclick=photo;
      el('h2-pet-btn').onclick=function(){if(!X.pet){adopt();return;}X.pet._love=performance.now()/1000+1.6;X.pet.tx=X.pet.x+(Math.random()-.5)*300;X.goals._pets=(X.goals._pets||0)+1;sv();boost('fun',6);toast('Your slime wiggles happily','🐾');};
      el('house-cv').addEventListener('pointerdown',function(e){var ps=X._ps;if(ps&&Math.hypot(e.clientX-ps.x,e.clientY-(ps.y-12))<26){el('h2-pet-btn').onclick();}},true);renderTop();}}
  function renderTop(){var s=el('h2-stars');if(s){var r=rating();s.innerHTML='★★★★★'.slice(0,r)+'<s>'+'★★★★★'.slice(r)+'</s>';s.title='House rating '+r+'/5';}var pb=el('h2-pet-btn');if(pb)pb.querySelector('span').textContent=X.pet?'Pet':'Adopt · 60✦';var g=today(),gb=el('h2-goal-btn');if(gb)gb.dataset.n=g.ids.filter(function(i){return !g.done[i];}).length;}
  requestAnimationFrame(loop);
  return {rating:rating,party:throwParty,photo:photo,adopt:adopt,goals:function(){return today();}};
})();
window.FreaHouse2=FreaHouse2;
