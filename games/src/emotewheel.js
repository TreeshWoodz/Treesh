/* ===================== FREA! PLUS — EMOTE WHEEL =====================
   The emote button now opens a radial wheel with 8 quick slots:
   pinned favourites first, then recently used, then friendly defaults.
   · Tap a slot to fire it. Hold or right-click a slot to pin or unpin it (★).
   · The centre "All" button opens the full emote + action list (pin from there too).
   · Keyboard: F opens or closes the wheel, 1-8 fire a slot, Esc closes it.
   Saved in localStorage: frea_emote_fav, frea_emote_recent. */
(function(){
  if(typeof EMOTES==='undefined'||typeof ACTIONS==='undefined')return;
  var FK='frea_emote_fav',RK='frea_emote_recent',N=8,MAXF=8,MAXR=12;
  var DEF=['a:wave','a:dance','e:happy','e:love','a:clap','a:cheer','a:heart','e:laugh'];
  function ld(k){try{var v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
  function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  var fav=ld(FK),rec=ld(RK);
  function item(id){var t=id.slice(0,1),k=id.slice(2),L=t==='a'?ACTIONS:EMOTES;for(var i=0;i<L.length;i++)if(L[i].k===k)return {id:id,t:t,it:L[i],e:L[i].e,l:t==='a'?L[i].l:(k.charAt(0).toUpperCase()+k.slice(1))};return null;}
  function slots(){var out=[],seen={};function add(id){if(out.length>=N||seen[id])return;var x=item(id);if(!x)return;seen[id]=1;x.pin=fav.indexOf(id)>=0;out.push(x);}
    fav.forEach(add);rec.forEach(add);DEF.forEach(add);return out;}
  function record(id){rec=rec.filter(function(x){return x!==id;});rec.unshift(id);if(rec.length>MAXR)rec.length=MAXR;sv(RK,rec);}
  function isFav(id){return fav.indexOf(id)>=0;}
  function toggleFav(id){var x=item(id);if(!x)return;
    if(isFav(id)){fav=fav.filter(function(f){return f!==id;});try{flash('Unpinned '+x.e,'#c6ff3d');}catch(e){}}
    else{if(fav.length>=MAXF){try{flash('Wheel is full: unpin one first','#ff3db5');}catch(e){}return;}fav.push(id);try{flash('★ Pinned '+x.e+' '+x.l,'#ffd23d');}catch(e){}}
    sv(FK,fav);markBar();if(open)render();}

  /* ---- record recents (wrap by name so Copycat's doAction wrapper is preserved) ---- */
  var _se=sendEmote;sendEmote=function(it){if(STATE==='play'&&player&&it&&it.k)record('e:'+it.k);return _se.apply(this,arguments);};
  var _da=doAction;doAction=function(it){if(STATE==='play'&&player&&it&&it.k)record('a:'+it.k);return _da.apply(this,arguments);};

  /* ---- DOM ---- */
  var wheel=document.createElement('div');wheel.id='emote-wheel';wheel.setAttribute('data-testid','emote-wheel');wheel.setAttribute('role','menu');wheel.setAttribute('aria-label','Emote wheel');
  document.body.appendChild(wheel);
  var open=false,keyHint=window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches;
  function fire(x){if(!x)return;close();if(x.t==='a')doAction(x.it);else sendEmote(x.it);}
  function render(){var S=slots(),R=wheel.offsetWidth?wheel.offsetWidth/2-34:88;
    var h='<div class="ew-ring" aria-hidden="true"></div>';
    S.forEach(function(x,i){var a=-Math.PI/2+i*(Math.PI*2/N),dx=Math.cos(a)*R,dy=Math.sin(a)*R;
      h+='<button class="ew-slot'+(x.t==='a'?' is-action':'')+(x.pin?' is-pin':'')+'" role="menuitem" data-ew="'+x.id+'" data-testid="ew-slot-'+i+'" aria-label="'+x.l+(x.pin?' (pinned)':'')+'" style="--dx:'+dx.toFixed(1)+'px;--dy:'+dy.toFixed(1)+'px;--i:'+i+'">'
        +'<span class="ew-e">'+x.e+'</span>'+(x.pin?'<span class="ew-star" aria-hidden="true">★</span>':'')+(keyHint?'<span class="ew-key" aria-hidden="true">'+(i+1)+'</span>':'')+'</button>';});
    h+='<button class="ew-center" data-testid="ew-all" aria-label="Show all emotes"><span class="ew-c-ico">▦</span><span class="ew-c-lbl" id="ew-lbl">All</span></button>';
    h+='<div class="ew-hint" data-testid="ew-hint">'+(keyHint?'Hold or right-click to pin · F · 1-8':'Hold a slot to pin ★')+'</div>';
    wheel.innerHTML=h;}
  function setOpen(v){open=v;wheel.classList.toggle('show',v);var fab=document.getElementById('emote-fab');if(fab)fab.classList.toggle('open',v||emoteOpen);
    if(v){try{if(emoteOpen)setEmoteOpen(false);}catch(e){}render();var d=document.getElementById('zen-dock'),zf=document.getElementById('zen-fab');if(d&&d.classList.contains('show')){try{dockOpen=false;}catch(e){}d.classList.add('collapsed');if(zf)zf.classList.remove('open');}}}
  function close(){if(open)setOpen(false);}
  function label(t){var l=document.getElementById('ew-lbl');if(l)l.textContent=t||'All';}

  /* ---- long-press / right-click pinning (wheel + full bar) ---- */
  var lp=null,suppress=false;
  function idOf(b){if(!b)return null;if(b.dataset.ew)return b.dataset.ew;if(b.dataset.action)return 'a:'+b.dataset.action;if(b.dataset.emote)return 'e:'+b.dataset.emote;return null;}
  function bindPin(host,sel){
    host.addEventListener('pointerdown',function(e){var b=e.target.closest(sel);if(!b)return;var id=idOf(b);if(!id)return;clearTimeout(lp);suppress=false;b.classList.add('ew-pressing');
      lp=setTimeout(function(){suppress=true;b.classList.remove('ew-pressing');toggleFav(id);try{navigator.vibrate&&navigator.vibrate(18);}catch(x){}},480);});
    ['pointerup','pointerleave','pointercancel'].forEach(function(ev){host.addEventListener(ev,function(e){clearTimeout(lp);var b=e.target.closest&&e.target.closest(sel);if(b)b.classList.remove('ew-pressing');},true);});
    host.addEventListener('contextmenu',function(e){var b=e.target.closest(sel);if(!b)return;var id=idOf(b);if(!id)return;e.preventDefault();e.stopPropagation();clearTimeout(lp);suppress=false;b.classList.remove('ew-pressing');toggleFav(id);});
    host.addEventListener('click',function(e){if(suppress&&e.target.closest(sel)){suppress=false;e.stopPropagation();e.preventDefault();}},true);}
  bindPin(wheel,'.ew-slot');
  var bar=document.getElementById('emote-bar');if(bar)bindPin(bar,'.emote-btn');

  wheel.addEventListener('click',function(e){e.stopPropagation();
    var c=e.target.closest('.ew-center');if(c){close();try{setEmoteOpen(true);}catch(x){}return;}
    var b=e.target.closest('.ew-slot');if(b)fire(item(b.dataset.ew));});
  wheel.addEventListener('pointerover',function(e){var b=e.target.closest('.ew-slot');if(b){var x=item(b.dataset.ew);label(x?x.l:'');}else if(e.target.closest('.ew-center'))label('All');});
  wheel.addEventListener('pointerleave',function(){label('All');});

  /* the emote button opens the wheel (capture phase beats the old full-bar toggle) */
  document.addEventListener('click',function(e){var fab=e.target.closest&&e.target.closest('#emote-fab');
    if(fab){e.stopPropagation();e.preventDefault();if(emoteOpen){setEmoteOpen(false);setOpen(false);return;}setOpen(!open);return;}
    if(open&&!wheel.contains(e.target))close();},true);

  /* full bar: star badges + hint */
  function markBar(){var b=document.getElementById('emote-bar');if(!b)return;
    b.querySelectorAll('.emote-btn').forEach(function(x){var id=idOf(x);x.classList.toggle('ew-fav',!!id&&isFav(id));});
    if(!b.querySelector('.ew-bar-hint')){var h=document.createElement('div');h.className='ew-bar-hint';h.setAttribute('data-testid','ew-bar-hint');h.textContent='Hold or right-click to pin ★ to your wheel';b.insertBefore(h,b.firstChild);}}
  var _bb=buildEmoteBar;buildEmoteBar=function(){var r=_bb.apply(this,arguments);markBar();return r;};
  markBar();

  /* hide with the rest of the emote UI */
  var _sh=showEmoteUI;showEmoteUI=function(v){var r=_sh.apply(this,arguments);if(!v)close();return r;};

  /* keyboard */
  window.addEventListener('keydown',function(e){var tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT'||(e.target&&e.target.isContentEditable))return;
    if(open&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
    if(STATE!=='play'||isPaused||!player)return;
    var fab=document.getElementById('emote-fab');if(!fab||!fab.classList.contains('show')||document.body.classList.contains('cc-live'))return;
    if(e.code==='KeyF'&&!e.repeat&&!e.ctrlKey&&!e.metaKey){e.preventDefault();setOpen(!open);return;}
    if(open&&/^Digit[1-8]$/.test(e.code)){e.preventDefault();e.stopImmediatePropagation();var S=slots(),x=S[+e.code.slice(5)-1];if(x)fire(x);}},true);
  window.addEventListener('resize',function(){if(open)render();});

  window.FreaWheel={open:function(){setOpen(true);},close:close,isOpen:function(){return open;},slots:slots,fav:function(){return fav.slice();},recent:function(){return rec.slice();},toggleFav:toggleFav};
})();
