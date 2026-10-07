/* =====================================================================
   SPECTATOR MODE — all modes
   · when you are knocked out / disqualified / found, the camera follows a living flea
   · ‹ › buttons, ← → or Q / E keys, or tap a flea to swap who you watch
   · "Results" skips straight to the end screen
   ===================================================================== */
var FreaSpectate=(function(){
  var idx=0,tgt=null,bar=null,lastOn=false,TAU=Math.PI*2;
  function out(f){return !f||f.hidden&&!(gameMode==='hns'&&f._disguised)||f._out||f._ccOut||f.found&&gameMode==='hns';}
  function lost(){if(STATE!=='play'||!player)return false;if(gameMode==='zen')return false;
    if(playerDead)return true;if(gameMode==='hns'&&player.found&&hnsSeeker!==player)return true;
    if(player._out||player._ccOut)return true;return false;}
  function list(){var a=fleas.filter(function(f){return f!==player&&!out(f);});
    if(gameMode==='hns'&&hnsSeeker&&a.indexOf(hnsSeeker)<0&&hnsSeeker!==player)a.unshift(hnsSeeker);return a;}
  function pickDefault(a){if(gameMode==='hns'&&hnsSeeker&&a.indexOf(hnsSeeker)>=0)return a.indexOf(hnsSeeker);
    if(gameMode==='survival'&&orbHolder&&a.indexOf(orbHolder)>=0)return a.indexOf(orbHolder);return 0;}
  function cur(){if(!lost())return null;var a=list();if(!a.length)return null;
    if(!tgt||a.indexOf(tgt)<0){idx=Math.min(idx,a.length-1);if(!tgt)idx=pickDefault(a);tgt=a[idx];}else idx=a.indexOf(tgt);return tgt;}
  function step(d){var a=list();if(!a.length)return;idx=((a.indexOf(tgt)+d)%a.length+a.length)%a.length;tgt=a[idx];paint();try{jpfx(tgt.cx,tgt.cy,tgt.col);}catch(e){}}
  specTarget=function(){return cur();};
  function nm(f){return f?String(f.name||'Flea'):'—';}
  function why(){if(gameMode==='hns')return 'You were found';if(player&&player._ccOut)return 'Disqualified';if(gameMode==='lava')return 'You melted';return 'Knocked out';}
  function mount(){if(bar)return bar;bar=document.createElement('div');bar.id='spec-bar';bar.setAttribute('data-testid','spectator-bar');
    bar.innerHTML='<div class="spec-tag" data-testid="spectator-reason"><span class="spec-eye"></span><span class="spec-why"></span></div>'+
      '<div class="spec-main"><button class="spec-arrow" data-d="-1" data-testid="spectator-prev-btn" aria-label="Previous flea">‹</button>'+
      '<div class="spec-who"><canvas class="spec-ava" width="56" height="56" data-testid="spectator-avatar"></canvas><div class="spec-txt"><small>SPECTATING</small><b data-testid="spectator-target-name"></b><em data-testid="spectator-count"></em></div></div>'+
      '<button class="spec-arrow" data-d="1" data-testid="spectator-next-btn" aria-label="Next flea">›</button></div>'+
      '<button class="spec-skip" data-testid="spectator-skip-btn">Results ››</button><div class="spec-keys">← → or Q / E to switch · tap a flea</div>';
    document.body.appendChild(bar);
    bar.addEventListener('pointerdown',function(e){e.stopPropagation();});
    bar.addEventListener('click',function(e){e.stopPropagation();var b=e.target.closest('[data-d]');if(b){step(+b.dataset.d);return;}if(e.target.closest('.spec-skip'))skip();});
    return bar;}
  function skip(){if(STATE!=='play')return;var a=list();try{
    if(gameMode==='hns'){hnsEnd(hnsFound>=hnsTotal);return;}
    if(gameMode==='survival'){endGame(survLeader());return;}
    if(gameMode==='lava'){var b=null;fleas.forEach(function(f){if(f!==player&&(!b||f.y<b.y))b=f;});endGame(b);return;}
    endGame(a[0]||null);}catch(e){try{endGame(a[0]||null);}catch(e2){}}}
  function ava(f){var cv=bar.querySelector('.spec-ava');if(!cv||!f)return;var c=cv.getContext('2d');c.clearRect(0,0,56,56);
    var g=c.createRadialGradient(28,24,4,28,28,28);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,56,56);
    try{drawFleaStatic(cv,specOf(f));return;}catch(e){}
    c.fillStyle=f.col||'#2de2ff';c.beginPath();c.ellipse(28,32,16,14,0,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(22,29,4.5,0,TAU);c.arc(34,29,4.5,0,TAU);c.fill();c.fillStyle='#14102a';c.beginPath();c.arc(23,30,2.4,0,TAU);c.arc(35,30,2.4,0,TAU);c.fill();}
  var painted=null;
  function paint(){if(!bar)return;var t=cur(),a=list();bar.querySelector('.spec-why').textContent=why();bar.querySelector('[data-testid="spectator-target-name"]').textContent=nm(t)+(t&&gameMode==='hns'&&t===hnsSeeker?' · Seeker':'');
    bar.querySelector('[data-testid="spectator-count"]').textContent=a.length+' still in';bar.style.setProperty('--sc',(t&&t.col)||'#2de2ff');if(painted!==t){painted=t;ava(t);}
    bar.querySelector('.spec-skip').style.display=(gameMode==='copycat')?'none':'';}
  function loop(){var on=lost()&&list().length>0;if(on!==lastOn){lastOn=on;mount();bar.classList.toggle('show',on);document.body.classList.toggle('spectating',on);if(on){tgt=null;idx=0;try{flash('SPECTATING — use ‹ › to switch fleas','#7af0ff');}catch(e){}}}
    if(on)paint();requestAnimationFrame(loop);}
  requestAnimationFrame(loop);
  document.addEventListener('keydown',function(e){if(!lastOn)return;var k=e.key;if(k==='ArrowLeft'||k==='q'||k==='Q'){step(-1);e.preventDefault();e.stopImmediatePropagation();}else if(k==='ArrowRight'||k==='e'||k==='E'){step(1);e.preventDefault();e.stopImmediatePropagation();}},true);
  /* tap a flea in the world to watch it */
  document.addEventListener('pointerdown',function(e){if(!lastOn||e.target.id!=='c'&&e.target.tagName!=='CANVAS')return;if(e.target.closest&&e.target.closest('#spec-bar'))return;
    var r=e.target.getBoundingClientRect(),sx=(e.clientX-r.left)*(W/r.width),sy=(e.clientY-r.top)*(H/r.height),wx=sx+camera.x,wy=sy+camera.y,a=list(),best=null,bd=60;
    a.forEach(function(f){var d=Math.hypot(f.cx-wx,f.cy-wy);if(d<bd){bd=d;best=f;}});if(best&&best!==tgt){tgt=best;paint();try{jpfx(best.cx,best.cy,best.col);}catch(e2){}}},true);
  /* in-world marker over the watched flea */
  var _de=drawEmotes;drawEmotes=function(){var r=_de.apply(this,arguments);if(lastOn&&tgt&&!(gameMode==='hns'&&tgt.hidden)){var t=performance.now()/1000,x=tgt.cx-camera.x,y=tgt.y-camera.y-30-Math.sin(t*4)*3;ctx.save();ctx.fillStyle=tgt.col||'#7af0ff';ctx.strokeStyle='rgba(10,8,22,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x-7,y-3);ctx.lineTo(x+7,y-3);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.globalAlpha=.55+Math.sin(t*5)*.25;ctx.strokeStyle=tgt.col||'#7af0ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(tgt.cx-camera.x,tgt.y+tgt.h-camera.y+1,tgt.w*.75,5,0,0,TAU);ctx.stroke();ctx.restore();}return r;};
  return {target:function(){return cur();},next:function(){step(1);},prev:function(){step(-1);},active:function(){return lastOn;}};
})();
window.FreaSpectate=FreaSpectate;
