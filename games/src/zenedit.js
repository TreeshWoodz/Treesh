/* =====================================================================
   ZEN EDITOR 2.0 — select-first, direct-manipulation editing
   • Tap anything to select it. Drag it to move.
   • Pull the round corner handle to resize, side handles to stretch platforms.
   • A floating action chip appears next to the selection:
       Duplicate · Type (platforms) · Bring to front · Delete
   • Undo (Ctrl/Cmd+Z), grid snap, arrow-key nudge, Delete key, Esc.
   • Contextual hint that always tells you what you can do next.
   ===================================================================== */
(function(){
  if(typeof editDown!=='function')return;
  var sel=null,drag=null,undoStack=[],snap=false,GRID=20,HR=11;
  function $(id){return document.getElementById(id);}
  /* ---------- geometry helpers ---------- */
  function bb(ent){var o=ent.obj;if(ent.kind==='flea'){var r=Math.max(o.w,o.h)*.75;return {x:o.cx-r,y:o.cy-r,w:r*2,h:r*2};}return {x:o.bx,y:o.by,w:o.bw,h:o.bh};}
  function isPlat(ent){return ent&&ent.kind==='platform'&&!ent.obj.deco;}
  function handles(ent){if(!ent||ent.kind==='flea')return [];var b=bb(ent),h=[{k:'corner',x:b.x+b.w,y:b.y+b.h}];
    if(isPlat(ent)&&ent.obj.kind!=='circle'){h.push({k:'ew',x:b.x+b.w,y:b.y+b.h/2});h.push({k:'ns',x:b.x+b.w/2,y:b.y+b.h});}return h;}
  function hitHandle(wx,wy){var hs=handles(sel);for(var i=0;i<hs.length;i++){if(Math.hypot(wx-hs[i].x,wy-hs[i].y)<HR+8)return hs[i];}return null;}
  function snapV(v){return snap?Math.round(v/GRID)*GRID:v;}
  function snapT(o){var pts=o.pts?o.pts.map(function(p){return [p[0],p[1]];}):null;return {x:o.x,y:o.y,w:o.w,h:o.h,r:o.r,cenx:o.cenx,ceny:o.ceny,pts:pts,ptype:o.ptype};}
  function restoreT(o,s){o.x=s.x;o.y=s.y;o.w=s.w;o.h=s.h;o.r=s.r;o.cenx=s.cenx;o.ceny=s.ceny;o.ptype=s.ptype;if(s.pts)o.pts=s.pts.map(function(p){return [p[0],p[1]];});if(o._computeBBox)o._computeBBox();try{zenSyncTransform(o,true);}catch(e){}}
  function pushUndo(e){undoStack.push(e);if(undoStack.length>40)undoStack.shift();paintBar();}
  function undo(){var e=undoStack.pop();if(!e){flash('Nothing to undo','#9b6bff');return;}
    if(e.t==='tf'){restoreT(e.o,e.s);}
    else if(e.t==='del'){platforms.splice(Math.min(e.i,platforms.length),0,e.o);try{zenSyncSpawn(e.o);}catch(x){}}
    else if(e.t==='add'){var i=platforms.indexOf(e.o);if(i>=3){platforms.splice(i,1);try{if(e.o.zenId)zenSend('delete',e.o.zenId,{});}catch(x){}}if(sel&&sel.obj===e.o)select(null);}
    flash('Undone','#2de2ff');paintBar();place();}
  /* ---------- scaling ---------- */
  function scaleObj(o,s0,sx,sy){o.cenx=s0.cenx;o.ceny=s0.ceny;
    if(o.kind==='circle'){o.r=Math.max(8,s0.r*Math.max(sx,sy));o.x=s0.x;o.y=s0.y;}
    else if(o.kind==='rect'){var nw=Math.max(12,s0.w*sx),nh=Math.max(12,s0.h*sy);o.w=nw;o.h=nh;o.x=s0.cenx-nw/2;o.y=s0.ceny-nh/2;}
    else if(s0.pts){o.pts=s0.pts.map(function(p){return [s0.cenx+(p[0]-s0.cenx)*sx,s0.ceny+(p[1]-s0.ceny)*sy];});}
    o._computeBBox();}
  /* ---------- selection ---------- */
  function select(ent){sel=ent;place();hint();}
  function label(ent){if(!ent)return '';if(ent.kind==='flea')return ent.obj.name||'Flea';var o=ent.obj;if(o.deco){var c=(typeof ZEN_OBJECT_CATALOG!=='undefined'&&ZEN_OBJECT_CATALOG[o.deco])||null;return (c&&(c.name||c.label))||String(o.deco).replace(/[-_]/g,' ');}return 'Platform'+(o.ptype&&o.ptype!=='normal'?' · '+o.ptype:'');}
  function hint(t){var h=$('edit-hint');if(!h)return;
    if(t){h.innerHTML=t;return;}
    if(!sel)h.innerHTML='<b>Tap</b> any object to select it · <b>drag</b> empty space to look around';
    else if(sel.kind==='flea')h.innerHTML='<b>'+esc(label(sel))+'</b> · drag to move · tap empty space to deselect';
    else h.innerHTML='<b>'+esc(label(sel))+'</b> · drag to move · pull <i class="ze-dot"></i> to resize'+(isPlat(sel)&&sel.obj.kind!=='circle'?' · side handles stretch':'');}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  /* floating chip next to the selection */
  var chip=null;
  function buildChip(){chip=document.createElement('div');chip.id='ze-chip';chip.setAttribute('data-testid','zen-edit-selection-chip');chip.setAttribute('role','toolbar');chip.setAttribute('aria-label','Selected object actions');document.body.appendChild(chip);
    chip.addEventListener('pointerdown',function(e){e.stopPropagation();});
    chip.addEventListener('click',function(e){var b=e.target.closest('[data-za]');if(!b)return;e.stopPropagation();act(b.dataset.za);});}
  function chipHTML(){if(!sel)return '';var p=isPlat(sel),f=sel.kind==='flea';
    return '<span class="ze-name" data-testid="zen-edit-selected-name">'+esc(label(sel))+'</span>'+
      (f?'':'<button data-za="dup" data-testid="zen-edit-duplicate" title="Duplicate (D)"><i>⧉</i><span>Copy</span></button>')+
      (p?'<button data-za="type" data-testid="zen-edit-type" title="Change platform type (T)"><i>✦</i><span>'+esc(sel.obj.ptype||'normal')+'</span></button>':'')+
      (f?'':'<button data-za="front" data-testid="zen-edit-front" title="Bring to front"><i>⇡</i><span>Front</span></button>')+
      '<button data-za="del" class="danger" data-testid="zen-edit-delete" title="Delete (Del)"><i>🗑</i><span>Delete</span></button>';}
  function place(){if(!chip)buildChip();if(!sel||!editMode||(sel.kind==='flea'&&fleas.indexOf(sel.obj)<0)||(sel.kind!=='flea'&&platforms.indexOf(sel.obj)<0)){chip.classList.remove('show');if(sel&&editMode&&((sel.kind==='flea'&&fleas.indexOf(sel.obj)<0)||(sel.kind!=='flea'&&platforms.indexOf(sel.obj)<0))){sel=null;hint();}return;}
    var html=chipHTML();if(chip._h!==html){chip.innerHTML=html;chip._h=html;}
    var b=bb(sel),z=VZ_UI||1,cx=(b.x+b.w/2-camera.x)*z,top=(b.y-camera.y)*z-12,bot=(b.y+b.h-camera.y)*z+16;
    chip.classList.add('show');var cw=chip.offsetWidth||260,chh=chip.offsetHeight||44;var y=top-chh;if(y<70)y=Math.min(innerHeight-chh-90,bot);
    chip.style.transform='translate('+Math.round(Math.max(8,Math.min(innerWidth-cw-8,cx-cw/2)))+'px,'+Math.round(Math.max(64,y))+'px)';}
  function act(a){if(!sel)return;var o=sel.obj;
    if(a==='del'){var i=platforms.indexOf(o);deleteEntity(sel);if(sel.kind!=='flea'&&i>=3&&platforms.indexOf(o)<0)pushUndo({t:'del',o:o,i:i});select(null);}
    else if(a==='dup'){var n=clone(o);if(!n)return;platforms.push(n);try{zenSyncSpawn(n);}catch(e){}pushUndo({t:'add',o:n});select({kind:'platform',obj:n});flash('Duplicated','#c6ff3d');try{Trophies.count&&STATS&&bump('objectsPlaced');}catch(e){}}
    else if(a==='type'){pushUndo({t:'tf',o:o,s:snapT(o)});cyclePType(o);place();hint();}
    else if(a==='front'){var j=platforms.indexOf(o);if(j>=3){platforms.splice(j,1);platforms.push(o);flash('Brought to front','#2de2ff');}}
    try{if(typeof sfx==='function')sfx('pick');}catch(e){}}
  function clone(o){try{var d={};Object.keys(o).forEach(function(k){if(k.charAt(0)==='_'||k==='zenId'||typeof o[k]==='function')return;var v=o[k];d[k]=(v&&typeof v==='object')?JSON.parse(JSON.stringify(v)):v;});var n=new Platform(d);n._shift(snap?GRID*2:34,snap?-GRID*2:-34);return n;}catch(e){return null;}}
  /* ---------- pointer pipeline (replaces the old tool-mode editor) ---------- */
  editDown=function(x,y){var wx=x+camera.x,wy=y+camera.y;
    var h=sel&&hitHandle(wx,wy);
    if(h){var o=sel.obj;drag={mode:'resize',h:h.k,o:o,s:snapT(o),bw:o.bw,bh:o.bh,px:wx,py:wy,uni:!!o.deco||h.k==='corner'&&o.kind==='circle'};hint('<b>Resizing</b> · release to finish');return;}
    var ent=pickEntity(wx,wy);
    if(ent){if(!sel||sel.obj!==ent.obj)select(ent);var r=entityRef(ent);drag={mode:'move',ent:ent,ox:wx-r.x,oy:wy-r.y,s:ent.kind==='flea'?null:snapT(ent.obj),moved:false,sx:wx,sy:wy};ent.obj.vx=0;ent.obj.vy=0;return;}
    if(sel)select(null);drag={mode:'pan',lx:x,ly:y};};
  editMoveTo=function(x,y){var wx=x+camera.x,wy=y+camera.y;
    if(!drag){editHover=pickEntity(wx,wy);var hh=sel&&hitHandle(wx,wy);try{C.style.cursor=hh?(hh.k==='ew'?'ew-resize':hh.k==='ns'?'ns-resize':'nwse-resize'):editHover?'grab':'default';}catch(e){}return;}
    if(drag.mode==='pan'){camera.x-=(x-drag.lx);camera.y-=(y-drag.ly);drag.lx=x;drag.ly=y;camera.x=Math.max(0,Math.min(WORLD_W-W,camera.x));camera.y=Math.max(0,Math.min(WORLD_H-H+FLOOR_PAD,camera.y));place();return;}
    if(drag.mode==='move'){var o=drag.ent.obj;if(!drag.moved&&Math.hypot(wx-drag.sx,wy-drag.sy)<4)return;drag.moved=true;try{C.style.cursor='grabbing';}catch(e){}
      if(drag.ent.kind==='flea'){o.x=wx-drag.ox-o.w/2;o.y=wy-drag.oy-o.h/2;o.vx=0;o.vy=0;}
      else{var tx=snapV(wx-drag.ox),ty=snapV(wy-drag.oy);o._shift(tx-o.cenx,ty-o.ceny);o.vx=0;o.vy=0;try{zenSyncTransform(o,false);}catch(e){}}
      place();return;}
    if(drag.mode==='resize'){var s=drag.s,dx=wx-drag.px,dy=wy-drag.py,sx=1,sy=1,bw=Math.max(1,drag.bw),bh=Math.max(1,drag.bh);
      if(drag.h==='ew')sx=Math.max(.15,(bw+dx*2)/bw);else if(drag.h==='ns')sy=Math.max(.15,(bh+dy*2)/bh);
      else{sx=Math.max(.15,(bw+dx*2)/bw);sy=Math.max(.15,(bh+dy*2)/bh);if(drag.uni||drag.o.deco){var k=Math.max(sx,sy);sx=sy=k;}}
      if(snap&&drag.o.kind==='rect'){var nw=Math.max(GRID,Math.round(s.w*sx/GRID)*GRID),nh=Math.max(GRID,Math.round(s.h*sy/GRID)*GRID);sx=nw/s.w;sy=nh/s.h;}
      scaleObj(drag.o,s,sx,sy);try{zenSyncTransform(drag.o,false);}catch(e){}place();}};
  editUp=function(){var d=drag;drag=null;try{C.style.cursor='default';}catch(e){}if(!d)return;
    if(d.mode==='move'){var o=d.ent.obj;if(d.ent.kind==='flea'){o.stuck=false;o.onG=false;o.vx=0;o.vy=0;}else if(d.moved){try{zenSyncTransform(o,true);}catch(e){}pushUndo({t:'tf',o:o,s:d.s});}}
    if(d.mode==='resize'){try{zenSyncTransform(d.o,true);}catch(e){}pushUndo({t:'tf',o:d.o,s:d.s});}
    hint();place();};
  /* ---------- canvas overlay: hover, selection box, handles, grid ---------- */
  drawEditOverlay=function(){
    if(snap){ctx.save();ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;ctx.beginPath();for(var gx=-(camera.x%GRID);gx<W;gx+=GRID){ctx.moveTo(gx,0);ctx.lineTo(gx,H);}for(var gy=-(camera.y%GRID);gy<H;gy+=GRID){ctx.moveTo(0,gy);ctx.lineTo(W,gy);}ctx.stroke();ctx.restore();}
    if(editHover&&(!sel||editHover.obj!==sel.obj)&&!drag)entityOutline(editHover.obj,editHover.kind,'rgba(45,226,255,.75)');
    if(!sel)return;var b=bb(sel),x=b.x-camera.x,y=b.y-camera.y;
    ctx.save();ctx.strokeStyle='#c6ff3d';ctx.lineWidth=1.6;ctx.setLineDash([6,5]);ctx.lineDashOffset=-(performance.now()/40)%11;ctx.beginPath();ctx.roundRect(x-6,y-6,b.w+12,b.h+12,10);ctx.stroke();ctx.setLineDash([]);
    handles(sel).forEach(function(h){var hx=h.x-camera.x+(h.k==='ns'?0:6),hy=h.y-camera.y+(h.k==='ew'?0:6);ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=8;ctx.fillStyle=h.k==='corner'?'#c6ff3d':'#2de2ff';ctx.beginPath();if(h.k==='corner')ctx.arc(hx,hy,HR*.85,0,7);else ctx.roundRect(hx-(h.k==='ew'?5:HR),hy-(h.k==='ns'?5:HR),h.k==='ew'?10:HR*2,h.k==='ns'?10:HR*2,5);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#0b0d20';ctx.lineWidth=2;ctx.stroke();
      if(h.k==='corner'){ctx.strokeStyle='#0b0d20';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(hx-3.5,hy+3.5);ctx.lineTo(hx+3.5,hy-3.5);ctx.moveTo(hx+.5,hy-3.5);ctx.lineTo(hx+3.5,hy-3.5);ctx.lineTo(hx+3.5,hy-.5);ctx.moveTo(hx-.5,hy+3.5);ctx.lineTo(hx-3.5,hy+3.5);ctx.lineTo(hx-3.5,hy+.5);ctx.stroke();}});
    ctx.restore();
    if(!drag&&chip&&chip.classList.contains('show'))place();};
  /* fix: handles are drawn offset by 6px; keep hit-test consistent */
  var _hh=hitHandle;hitHandle=function(wx,wy){var hs=handles(sel);for(var i=0;i<hs.length;i++){var hx=hs[i].x+(hs[i].k==='ns'?0:6),hy=hs[i].y+(hs[i].k==='ew'?0:6);if(Math.hypot(wx-hx,wy-hy)<HR+8)return hs[i];}return null;};
  /* ---------- toolbar ---------- */
  function paintBar(){var u=$('ze-undo');if(u)u.disabled=!undoStack.length;var s=$('ze-snap');if(s){s.classList.toggle('on',snap);s.setAttribute('aria-pressed',snap);}}
  function buildBar(){var bar=$('edit-bar');if(!bar)return;
    bar.innerHTML='<span class="edit-title" data-testid="edit-mode-title"><i class="ze-live"></i>EDITING</span>'+
      '<button class="tool-btn" id="ze-undo" data-testid="edit-undo" title="Undo (Ctrl+Z)" disabled>↶ <span>Undo</span></button>'+
      '<button class="tool-btn" id="ze-snap" data-testid="edit-snap-toggle" title="Snap to grid (G)" aria-pressed="false">▦ <span>Snap</span></button>'+
      '<button class="tool-btn" id="ze-add" data-testid="edit-add-objects" title="Add more objects">＋ <span>Add</span></button>'+
      '<button class="tool-btn primary" id="ze-done" data-testid="edit-done">✓ Done</button>';
    $('ze-undo').onclick=undo;
    $('ze-snap').onclick=function(){snap=!snap;paintBar();flash(snap?'Grid snap on':'Grid snap off','#2de2ff');};
    $('ze-add').onclick=function(){exitEdit();};
    $('ze-done').onclick=function(){exitEdit();};
    paintBar();}
  buildBar();
  var _enter=enterEdit,_exit=exitEdit;
  enterEdit=function(){_enter.apply(this,arguments);if(!editMode)return;sel=null;drag=null;buildBar();hint();document.body.classList.add('ze-editing');};
  exitEdit=function(){sel=null;drag=null;if(chip)chip.classList.remove('show');document.body.classList.remove('ze-editing');try{C.style.cursor='';}catch(e){}_exit.apply(this,arguments);};
  /* keep undo honest when objects are removed by other paths */
  var _del=deleteEntity;deleteEntity=function(ent){_del(ent);if(sel&&ent&&sel.obj===ent.obj)select(null);};
  /* ---------- keyboard ---------- */
  document.addEventListener('keydown',function(e){if(!editMode)return;var tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA')return;
    var k=e.key;
    if((e.ctrlKey||e.metaKey)&&(k==='z'||k==='Z')){e.preventDefault();undo();return;}
    if(k==='Escape'){e.preventDefault();if(sel)select(null);else exitEdit();return;}
    if(k==='g'||k==='G'){$('ze-snap').click();return;}
    if(!sel)return;
    if(k==='Delete'||k==='Backspace'){e.preventDefault();act('del');return;}
    if(k==='d'||k==='D'){e.preventDefault();act('dup');return;}
    if((k==='t'||k==='T')&&isPlat(sel)){act('type');return;}
    var mv={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];
    if(mv&&sel.kind!=='flea'){e.preventDefault();var st=e.shiftKey?10:(snap?GRID:2),o=sel.obj;pushUndo({t:'tf',o:o,s:snapT(o)});o._shift(mv[0]*st,mv[1]*st);try{zenSyncTransform(o,true);}catch(x){}place();}
  },true);
  window.addEventListener('resize',function(){if(editMode)place();});
  window.FreaZenEdit={select:function(){return sel;},undo:undo,snap:function(){return snap;}};
})();
