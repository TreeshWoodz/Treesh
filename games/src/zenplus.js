/* =====================================================================
   ZEN SANDBOX+ — polished build dock + two new tabs:
   • Worlds  : visual scene picker with live-painted thumbnails
   • Magic   : weather overlay, time of day, gravity, party mode,
               group emotes, flea rain, photo mode
   Also fixes the dock overlapping the emote button on desktop and gives
   the new worlds themed props.
   ===================================================================== */
(function(){
  if(typeof buildZenItems!=='function')return;
  var ZS={weather:'none',tod:'day',grav:'normal',party:false};
  try{Object.assign(ZS,JSON.parse(localStorage.getItem('frea_zenplus')||'{}'));ZS.party=false;}catch(e){}
  function save(){try{localStorage.setItem('frea_zenplus',JSON.stringify(ZS));}catch(e){}}
  var BASE_GRAV=GRAV,GRAVS={moon:.16,normal:BASE_GRAV,heavy:.7};
  function toast(m,c){try{flash(m,c||'#9b6bff');}catch(e){}}
  function el(id){return document.getElementById(id);}

  /* ---------- new tabs ---------- */
  var tabs=el('zen-cat-tabs');
  [['worlds','🌍 Worlds'],['magic','✨ Magic']].forEach(function(t){if(!tabs||tabs.querySelector('[data-cat="'+t[0]+'"]'))return;var b=document.createElement('button');b.className='zen-seg__btn zp-tab';b.dataset.cat=t[0];b.setAttribute('data-testid','zen-category-'+t[0]);b.textContent=t[1];
    b.addEventListener('click',function(){zenCat=t[0];[].forEach.call(tabs.querySelectorAll('.zen-seg__btn'),function(x){x.classList.toggle('active',x===b);});buildZenItems();});tabs.appendChild(b);});
  var _build=buildZenItems;
  buildZenItems=function(){var host=el('zen-items');if(host)host.classList.toggle('zp-wide',zenCat==='worlds'||zenCat==='magic');if(zenCat==='worlds')return renderWorlds(host);if(zenCat==='magic')return renderMagic(host);_build();};

  /* ---------- Worlds: painted thumbnails ---------- */
  var thumbs={};
  function thumb(k){if(thumbs[k])return thumbs[k];var cv=document.createElement('canvas');cv.width=200;cv.height=120;var q=cv.getContext('2d');
    var sW=W,sH=H,sC=ctx,sCam={x:camera.x,y:camera.y},sPal=pal,sEnv=zenEnv,sPlat=platforms;
    try{W=200;H=120;ctx=q;camera.x=0;camera.y=WORLD_H-60-102;platforms=[];zenEnv=k;var A=window.FreaArenas;if(A&&A.scenes[k])A.paint(k);else if(typeof drawZenEnv==='function')drawZenEnv();}catch(e){}
    finally{W=sW;H=sH;ctx=sC;camera.x=sCam.x;camera.y=sCam.y;pal=sPal;zenEnv=sEnv;platforms=sPlat;}
    thumbs[k]=cv;return cv;}
  function renderWorlds(host){host.innerHTML='';var grid=document.createElement('div');grid.className='zp-worlds';
    var NEW=['sakura','clouds','aurora','shrooms','autumn','lagoon'];
    Object.keys(ENV).forEach(function(k){var b=document.createElement('button');b.className='zp-world'+(k===zenEnv?' on':'');b.setAttribute('data-testid','zen-world-'+k);b.setAttribute('aria-label',(ENV_NAME[k]||k)+' world');
      var c=thumb(k);var img=document.createElement('img');img.alt='';img.src=c.toDataURL('image/jpeg',.8);b.appendChild(img);
      var lab=document.createElement('span');lab.innerHTML=(ENV_ICON[k]||'')+' '+(ENV_NAME[k]||k)+(NEW.indexOf(k)>=0?' <em>NEW</em>':'');b.appendChild(lab);
      b.addEventListener('click',function(){setZenEnv(k);renderWorlds(host);});grid.appendChild(b);});
    host.appendChild(grid);}

  /* ---------- Magic: sandbox toys ---------- */
  function seg(label,key,opts,testid){var w=document.createElement('div');w.className='zp-row';w.innerHTML='<b>'+label+'</b>';var g=document.createElement('div');g.className='zp-seg';
    opts.forEach(function(o){var b=document.createElement('button');b.textContent=o[1];b.className=ZS[key]===o[0]?'on':'';b.setAttribute('data-testid','zen-magic-'+testid+'-'+o[0]);b.addEventListener('click',function(){ZS[key]=o[0];save();apply();[].forEach.call(g.children,function(x){x.classList.toggle('on',x===b);});});g.appendChild(b);});
    w.appendChild(g);return w;}
  function act(icon,label,testid,fn){var b=document.createElement('button');b.className='zp-act';b.setAttribute('data-testid','zen-magic-'+testid);b.innerHTML='<i>'+icon+'</i><span>'+label+'</span>';b.addEventListener('click',fn);return b;}
  function renderMagic(host){host.innerHTML='';var box=document.createElement('div');box.className='zp-magic';
    box.appendChild(seg('Weather','weather',[['none','☀ Clear'],['rain','🌧 Rain'],['snow','❄ Snow'],['petals','🌸 Petals'],['confetti','🎉 Confetti'],['fireflies','✨ Fireflies']],'weather'));
    box.appendChild(seg('Time of day','tod',[['day','🌤 Day'],['sunset','🌇 Sunset'],['night','🌙 Night']],'tod'));
    box.appendChild(seg('Gravity','grav',[['moon','🌙 Moon'],['normal','🌍 Normal'],['heavy','🪨 Heavy']],'grav'));
    var acts=document.createElement('div');acts.className='zp-acts';
    acts.appendChild(act(ZS.party?'🪩':'🎶',ZS.party?'Stop party':'Party mode','party',function(){ZS.party=!ZS.party;apply();renderMagic(host);toast(ZS.party?'Party time! 🪩':'Party over','#ff3db5');}));
    acts.appendChild(act('💃','All dance','dance',function(){everyone('dance');}));
    acts.appendChild(act('👋','All wave','wave',function(){everyone('wave');}));
    acts.appendChild(act('🤸','All flip','flip',function(){everyone('flip');}));
    acts.appendChild(act('🌧','Flea rain','flea-rain',fleaRain));
    acts.appendChild(act('📸','Photo','photo',photo));
    box.appendChild(acts);host.appendChild(box);}
  function everyone(a){(fleas||[]).forEach(function(f,i){setTimeout(function(){if(!f||f.hidden)return;f.action=a;f.actionT=0;f.actionUntil=Date.now()+2600;},i*90);});}
  function fleaRain(){var add=el('add-flea-btn');var n=0;(function go(){if(!add||n>=4)return;add.click();n++;var f=fleas[fleas.length-1];if(f&&!f.isP){f.x=camera.x+80+Math.random()*(W-160);f.y=camera.y+10;f.vy=2;f.vx=(Math.random()-.5)*4;f.stuck=false;}setTimeout(go,160);})();toast('It\u2019s raining fleas!','#2de2ff');}
  function photo(){var cv=el('c');if(!cv)return;document.body.classList.add('zp-photo');setTimeout(function(){try{var a=document.createElement('a');a.download='frea-zen-'+Date.now()+'.png';a.href=cv.toDataURL('image/png');a.click();}catch(e){}var fl=document.createElement('div');fl.className='zp-flash';document.body.appendChild(fl);setTimeout(function(){fl.remove();document.body.classList.remove('zp-photo');},450);toast('Snapshot saved 📸','#ffd23d');},120);}
  function apply(){if(gameMode==='zen')GRAV=GRAVS[ZS.grav]||BASE_GRAV;}

  /* ---------- overlay: weather + time of day + party (drawn with the scene) ---------- */
  var _bg=drawBG;
  drawBG=function(){_bg();if(gameMode!=='zen'||STATE==='title'){if(GRAV!==BASE_GRAV)GRAV=BASE_GRAV;return;}
    if(GRAV!==(GRAVS[ZS.grav]||BASE_GRAV))GRAV=GRAVS[ZS.grav]||BASE_GRAV;
    var A=window.FreaArenas,t=performance.now()*.001,s=Math.max(.62,Math.min(1.25,H/760)),cx=camera.x||0;
    if(ZS.tod!=='day'){ctx.save();ctx.globalCompositeOperation='multiply';ctx.fillStyle=ZS.tod==='night'?'#4a4a90':'#ffb890';ctx.fillRect(0,0,W,H);ctx.restore();
      if(ZS.tod==='night'){ctx.fillStyle='#fff';for(var i=0;i<80;i++){ctx.globalAlpha=.3+.7*Math.abs(Math.sin(t+i));ctx.fillRect((i*.618%1)*W,(i*.7548%1)*H*.55,1.4,1.4);}ctx.globalAlpha=1;}
      else{var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(255,90,120,.18)');g.addColorStop(1,'rgba(255,190,90,.12)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}}
    if(A&&ZS.weather!=='none'){var F={rain:{p:'rain',n:120,col:'#a8d0ff'},snow:{p:'snow',n:80},petals:{p:'petals',n:36},confetti:{p:'confetti',n:40},fireflies:{p:'fireflies',n:30,col:'#e8ff7a'}}[ZS.weather];if(F&&A.fx[F.p])A.fx[F.p](F,t,s,cx,!!perfMode);}
    if(ZS.party&&A){A.front.lights({},t,s,cx);ctx.save();ctx.globalCompositeOperation='lighter';['#ff3db5','#2de2ff','#c6ff3d','#ffd23d'].forEach(function(c,k){var a=Math.sin(t*1.3+k*1.6)*.6,x0=W*(.15+k*.23);var g=ctx.createLinearGradient(x0,0,x0+Math.sin(a)*H,H);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=c;ctx.globalAlpha=.1;ctx.beginPath();ctx.moveTo(x0-6,0);ctx.lineTo(x0+6,0);ctx.lineTo(x0+Math.sin(a)*H+90,H);ctx.lineTo(x0+Math.sin(a)*H-90,H);ctx.closePath();ctx.fill();});ctx.restore();
      var bx=W/2-cx*.1,by=46*s,br=16*s;ctx.save();ctx.translate(bx,by);ctx.rotate(t);for(var q=0;q<24;q++){ctx.fillStyle=['#fff','#c8d0ff','#8af0ff','#ff9ac8'][q%4];var a2=q/24*6.283;ctx.fillRect(Math.cos(a2)*br*.6-2,Math.sin(a2)*br*.6-2,4,4);}ctx.restore();ctx.strokeStyle='#888';ctx.beginPath();ctx.moveTo(bx,0);ctx.lineTo(bx,by-br*.6);ctx.stroke();
      if(!ZS._pt||Date.now()-ZS._pt>3200){ZS._pt=Date.now();everyone(['dance','wiggle','headbang','cheer'][(Math.random()*4)|0]);}}
  };

  /* ---------- themed props for the new worlds ---------- */
  if(typeof spawnEnvProps==='function'){var _sep=spawnEnvProps;spawnEnvProps=function(){var m={sakura:'forest',autumn:'forest',shrooms:'forest',clouds:'candy',aurora:'snow',lagoon:'beach'}[zenEnv];if(!m)return _sep();var o=zenEnv;zenEnv=m;try{_sep();}finally{zenEnv=o;}};}
  /* keep Worlds tab in sync when env changes elsewhere */
  var _sze=setZenEnv;setZenEnv=function(k,fromSync){_sze(k,fromSync);if(zenCat==='worlds')renderWorlds(el('zen-items'));};
  window.FreaZenPlus={state:ZS};
})();
