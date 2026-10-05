/* ===================== FREA! PLUS — PLATFORM STYLE PREVIEWS =====================
   Settings → Arena & Platforms → "Platform Styles": a large live preview of the selected arena
   (sky, sun or moon, skyline, floor and sample platforms painted by the same themed-skin code used
   in-game), which modes use it, and a scrollable strip of every arena to browse.
   Defaults to the arena of the currently selected mode. */
(function(){
  function A(){return window.FreaArenas||null;}
  function S(){return window.FreaSkin||null;}
  function el(id){return document.getElementById(id);}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  var ZEN_ENVS=['neon','forest','beach','living','space'];
  function modeName(k){try{if(window.FreaHud&&FreaHud.info){var i=FreaHud.info(k);if(i&&i.name)return i.name;}}catch(e){}return k.charAt(0).toUpperCase()+k.slice(1);}
  function usedBy(id){var a=A(),out=[];if(!a)return out;var ms=a.modeScene||{};
    Object.keys(ms).forEach(function(m){if(m==='title'||m==='tutorial')return;if(ms[m]===id)out.push(modeName(m));});
    if(ms.hoops===undefined&&id==='rooftop')out.push(modeName('hoops'));
    if(ZEN_ENVS.indexOf(id)>=0)out.push('Zen');return out;}
  function currentId(){var a=A();if(!a)return 'meadow';try{
      if(typeof gameMode!=='undefined'){if(gameMode==='zen')return a.scenes[zenEnv]?zenEnv:'neon';if(gameMode==='hoops')return 'rooftop';
        var eq=window.FreaShop&&FreaShop.equip&&FreaShop.equip();if(eq&&eq.arena&&eq.arena!=='auto'&&a.scenes[eq.arena])return eq.arena;
        return a.modeScene[gameMode]||'meadow';}}catch(e){}return 'meadow';}
  function ids(){var a=A();if(!a)return [];var all=Object.keys(a.scenes),ms=a.modeScene||{},first=[];
    Object.keys(ms).forEach(function(m){var s=ms[m];if(m!=='title'&&s&&first.indexOf(s)<0&&all.indexOf(s)>=0)first.push(s);});
    return first.concat(all.filter(function(s){return first.indexOf(s)<0;}));}
  function rng(seed){var s=seed>>>0||7;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return ((s>>>0)%10000)/10000;};}
  function hash(str){var h=2166136261;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

  /* ---- fake platforms in a virtual space ---- */
  function rect(x,y,w,h){return {kind:'rect',x:x,y:y,w:w,h:h,bx:x,by:y,bw:w,bh:h};}
  function poly(cx,cy,r,n,rot){var pts=[],i,minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;for(i=0;i<n;i++){var a=rot+i*Math.PI*2/n,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;pts.push([x,y]);minx=Math.min(minx,x);miny=Math.min(miny,y);maxx=Math.max(maxx,x);maxy=Math.max(maxy,y);}
    return {kind:'poly',pts:pts,bx:minx,by:miny,bw:maxx-minx,bh:maxy-miny,x:minx,y:miny,w:maxx-minx,h:maxy-miny};}

  function drawScene(cv,id,big){var a=A(),sk=S();if(!a||!cv)return;var sc=a.scenes[id]||a.scenes.meadow;
    var dpr=Math.min(2,window.devicePixelRatio||1),w=cv.clientWidth||cv.width,h=cv.clientHeight||cv.height;if(!w||!h)return;
    cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);var o=cv.getContext('2d');o.setTransform(dpr,0,0,dpr,0,0);
    var R=rng(hash(id)),sky=sc.sky||['#0b0d22','#14183a','#1e2450'],g=o.createLinearGradient(0,0,0,h);g.addColorStop(0,sky[0]);g.addColorStop(.6,sky[1]||sky[0]);g.addColorStop(1,sky[2]||sky[1]||sky[0]);o.fillStyle=g;o.fillRect(0,0,w,h);
    var i,n;if(sc.stars){n=Math.min(60,Math.round(sc.stars*(big?.4:.18)));o.fillStyle='rgba(255,255,255,.75)';for(i=0;i<n;i++){var sz=R()<.15?1.6:1;o.fillRect(R()*w,R()*h*.6,sz,sz);}}
    if(sc.sun){var su=sc.sun,sx=su.x*w,sy=su.y*h,sr=Math.max(8,(su.r||.15)*h*1.15),sg=o.createLinearGradient(0,sy-sr,0,sy+sr),c=su.c||['#ffe27a','#ff5e9a'];sg.addColorStop(0,c[0]);sg.addColorStop(1,c[1]||c[0]);
      o.save();o.globalAlpha=.25;o.fillStyle=c[0];o.beginPath();o.arc(sx,sy,sr*1.6,0,7);o.fill();o.restore();o.fillStyle=sg;o.beginPath();o.arc(sx,sy,sr,0,7);o.fill();
      if(su.stripes){o.fillStyle=sky[2]||sky[1];for(i=1;i<5;i++)o.fillRect(sx-sr,sy+sr*(i*.18),sr*2,Math.max(1,sr*.05*i));}}
    if(sc.moon){var mo=sc.moon,mx=mo.x*w,my=mo.y*h,mr=Math.max(5,(mo.r||.06)*h*1.6);o.save();o.globalAlpha=.22;o.fillStyle=mo.tint||mo.c||'#fff';o.beginPath();o.arc(mx,my,mr*2,0,7);o.fill();o.restore();o.fillStyle=mo.c||'#f2ecff';o.beginPath();o.arc(mx,my,mr,0,7);o.fill();}
    var L=sc.layers||[],floorY=h*.86;
    [[L[0],.5,.74,7],[L[1],.64,.8,11]].forEach(function(q,qi){var ly=q[0];if(!ly)return;var col=ly.col||(ly.cols&&ly.cols[0])||'#1a1440',top=h*q[1],base=h*q[2],seg=q[3];
      o.fillStyle=col;o.beginPath();o.moveTo(0,floorY);for(var k=0;k<=seg;k++){var x=k*w/seg,y=(k%2?top+R()*(base-top)*.5:base-R()*(base-top)*.4);if(ly.t==='hills'||qi===1)y=base-(Math.sin(k*1.3+R())*.5+.5)*(base-top);o.lineTo(x,y);}o.lineTo(w,floorY);o.closePath();o.fill();
      if(ly.rim){o.strokeStyle=ly.rim;o.globalAlpha=.35;o.lineWidth=1;o.stroke();o.globalAlpha=1;}});
    o.fillStyle=sc.floor||'#1c1834';o.fillRect(0,floorY,w,h-floorY);o.fillStyle=sc.lip||sc.floorGlow||'rgba(255,255,255,.35)';o.globalAlpha=.8;o.fillRect(0,floorY,w,1.5);o.globalAlpha=1;
    /* sample platforms (virtual space scaled to the canvas height) */
    if(!sk||!sk.paint)return;var VH=big?165:185,k2=h/VH,VW=w/k2;o.save();o.scale(k2,k2);
    var P=[rect(VW*.07,VH*.5,VW*.34,16),poly(VW*.62,VH*.36,big?26:30,6,Math.PI/6)];
    if(big)P.push(rect(VW*.74,VH*.66,VW*.2,14),poly(VW*.3,VH*.2,20,4,0));
    P.forEach(function(p){sk.paint(o,p,id);});o.restore();}

  var built=false,sel=null;
  function build(){var g=document.querySelector('#sg-arena .sgroup-b');if(!g||!A())return false;if(el('plat-preview'))return true;
    var box=document.createElement('div');box.className='setting-row pp-wrap';box.id='plat-preview';box.setAttribute('data-testid','plat-preview');
    var list=ids();
    box.innerHTML='<div class="section-label"><span>Platform Styles</span><small class="xm-sub">See how platforms look in every arena</small></div>'
      +'<div class="pp-stage"><canvas class="pp-big" id="pp-big" data-testid="pp-big" aria-label="Arena platform preview" role="img"></canvas>'
      +'<div class="pp-cap"><div class="pp-name" id="pp-name" data-testid="pp-name"></div></div>'
      +'<span class="pp-now" id="pp-now" data-testid="pp-now" hidden>This mode</span></div>'
      +'<div class="pp-usedrow"><span class="pp-usedlbl">Used in</span><div class="pp-used" id="pp-used" data-testid="pp-used"></div></div>'
      +'<div class="pp-note" id="pp-note" data-testid="pp-basic-note" hidden><span>Basic platforms are on, so matches show plain blocks. Switch it in Display &amp; Accessibility.</span><button class="pp-note-btn" id="pp-themed" data-testid="pp-use-themed">Use themed</button></div>'
      +'<div class="pp-strip" id="pp-strip" role="listbox" aria-label="Arenas" data-testid="pp-strip">'
      +list.map(function(id){var sc=A().scenes[id];return '<button class="pp-thumb" role="option" aria-selected="false" data-pp="'+id+'" data-testid="pp-thumb-'+id+'"><canvas aria-hidden="true"></canvas><span>'+esc(sc.name||id)+'</span></button>';}).join('')+'</div>';
    g.insertBefore(box,g.firstChild);
    box.querySelector('#pp-strip').addEventListener('click',function(e){var b=e.target.closest('.pp-thumb');if(b)select(b.dataset.pp,true);});
    box.querySelector('#pp-strip').addEventListener('keydown',function(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;var bs=[].slice.call(box.querySelectorAll('.pp-thumb')),i=bs.indexOf(document.activeElement);if(i<0)return;e.preventDefault();var nb=bs[Math.max(0,Math.min(bs.length-1,i+(e.key==='ArrowRight'?1:-1)))];nb.focus();select(nb.dataset.pp,false);});
    box.querySelector('#pp-themed').addEventListener('click',function(e){e.stopPropagation();try{FreaSkin.set('plat','themed');localStorage.setItem('frea_plat_style','themed');}catch(x){}note();});
    built=true;return true;}
  function thumbs(){document.querySelectorAll('#pp-strip .pp-thumb').forEach(function(b){var c=b.querySelector('canvas');if(c&&!c._done){drawScene(c,b.dataset.pp,false);if(c.clientWidth)c._done=1;}});}
  function select(id,scroll){sel=id;var a=A();if(!a)return;var sc=a.scenes[id]||{};
    drawScene(el('pp-big'),id,true);el('pp-name').textContent=sc.name||id;
    var u=usedBy(id);el('pp-used').innerHTML=u.length?u.map(function(m){return '<span class="pp-chip">'+esc(m)+'</span>';}).join(''):'<span class="pp-chip pp-chip--shop">Pick it as a match backdrop in the Shop</span>';
    el('pp-now').hidden=id!==currentId();
    document.querySelectorAll('#pp-strip .pp-thumb').forEach(function(b){var on=b.dataset.pp===id;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');if(on&&scroll)try{b.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});}catch(x){}});}
  function note(){var n=el('pp-note');if(!n)return;var basic=S()&&S().plat&&S().plat()==='basic';n.hidden=!basic;}
  function refresh(){if(!build())return;var g=el('sg-arena');if(!g||!g.classList.contains('open'))return;
    requestAnimationFrame(function(){thumbs();var c=currentId();select(c,true);el('pp-big')._shown=1;note();});}
  /* render when the Arena group opens or the settings modal opens on it */
  document.addEventListener('click',function(e){
    if(e.target.closest&&e.target.closest('[data-testid="sgroup-arena"],#ltop-gear,.mc-gear'))setTimeout(refresh,60);
    if(e.target.closest&&e.target.closest('[data-plat-style]'))setTimeout(note,30);});
  window.addEventListener('resize',function(){var b=el('pp-big');if(b&&b._shown){document.querySelectorAll('#pp-strip canvas').forEach(function(c){c._done=0;});refresh();}});
  setTimeout(build,1000);
  window.FreaPlatPreview={refresh:refresh,select:select,current:currentId,ids:ids};
})();
