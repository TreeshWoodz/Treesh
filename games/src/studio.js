/* =====================================================================
   CHARACTER STUDIO — standalone, visual character creator (own modal)
   Replaces the old form-style "Customize" tab. Every option is a tile that
   shows YOUR flea wearing it. Works directly on the game's `saved` roster
   (frea_v4) and keeps the legacy form in sync via applyToUI().
   ===================================================================== */
var Studio=(function(){
  var SW=['#2de2ff','#39ff7a','#c6ff3d','#ffd23d','#ff9a3d','#ff5a5a','#ff3db5','#ff9ac8','#b98cff','#8a5cff','#5a7aff','#8af0ff','#f4efff','#9aa4c0','#3a3a52','#1a1a28','#b77a44','#6a3f24'];
  var EYE_SW=['#101018','#2a0030','#1d3b8a','#0f6a4a','#6a2a10','#8a0a3a','#5a2a9a','#e8f4ff'];
  var HAIR_SW=['#2a1a2a','#6a3f24','#b77a44','#ffd23d','#ff7a3d','#ff3db5','#9b6bff','#2de2ff','#39ff7a','#f4efff'];
  /* sections: [id,label,icon,[fields]]  field: [key,label,kind(sel|col),legacyId,zoom] */
  var SECTIONS=[
    ['body','Body','🫧',[['color','Body color','col','edit-color',0,SW],['secondary','Accent color','col','edit-secondary',0,SW],['shape','Shape','sel','edit-shape',1],['size','Size','sel','edit-size',1],['pattern','Pattern','sel','edit-pattern',1]]],
    ['face','Face','😊',[['eyes','Eyes','sel','edit-eyes',2],['eyeColor','Eye color','col','edit-eyecolor',0,EYE_SW],['mouth','Mouth','sel','edit-mouth',2],['brows','Brows','sel','edit-brows',2],['cheek','Cheeks','sel','edit-cheek',2],['glasses','Glasses','sel','edit-glasses',2]]],
    ['hair','Hair','💇',[['hair','Hair style','sel','edit-hair',2],['hairColor','Hair color','col','edit-haircolor',0,HAIR_SW]]],
    ['head','Hats','🎩',[['hat','Hat','sel','edit-hat',2],['ant','Antennae','sel','edit-ant',2]]],
    ['back','Wings','🦋',[['wings','Wings','sel','edit-wings',1],['cape','Cape','sel','edit-cape',1]]],
    ['legs','Legs','🦵',[['legShape','Leg shape','sel','edit-legshape',3],['legStyle','Leg style','sel','edit-legstyle',3],['legs','Leg color','sel','edit-legs',3]]],
    ['extra','Extras','🧣',[['accessory','Accessory','sel','edit-accessory',1]]],
    ['fx','Effects','✨',[['aura','Aura glow','sel','edit-aura',1],['trail','Trail','sel','edit-trail',1]]]
  ];
  var root=null,sec='body',raf=0,prev=null,undo=[],open=false;
  function el(id){return document.getElementById(id);}
  function cur(){return saved.find(function(f){return f.id===activeId;})||saved[0];}
  function opts(legacyId){var s=el(legacyId);if(!s||!s.options)return [];return [].map.call(s.options,function(o){return [o.value,o.textContent];});}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  /* ---------- rendering a flea into any canvas ---------- */
  function paint(cv,rec,zoom,frame){var q=cv.getContext('2d'),W=cv.width,H=cv.height;q.clearRect(0,0,W,H);
    var f=new Flea(0,0,true,'',specOf(rec));f.stuck=true;f.face=1;f.angle=0;f.hideName=true;
    if(frame!=null){f.la=frame;f.ea=frame*.4;f.sq=1+Math.sin(frame*.7)*.06;}
    /* zoom: 0/1 whole body · 2 head close-up · 3 legs */
    var Z=zoom===2?W/34:zoom===3?W/44:W/62,oy=zoom===2?H*.74:zoom===3?H*.22:H*.58;
    var s=ctx;ctx=q;q.save();q.translate(W/2,oy);q.scale(Z,Z);try{f.draw(f.cx,f.cy);}catch(e){}q.restore();ctx=s;}
  function loop(){if(!open)return;raf=requestAnimationFrame(loop);var cv=el('st-stage');if(!cv)return;prev=(prev||0)+0.12;paint(cv,cur(),1,prev);}
  /* ---------- state changes ---------- */
  function commit(){saveFreas();try{repopulate();applyToUI();}catch(e){}try{updateLobbyProfile();}catch(e){}try{if(window.FreaProfile)window.FreaProfile.refresh();}catch(e){}}
  function snapshot(){undo.push(JSON.stringify(cur()));if(undo.length>30)undo.shift();el('st-undo').disabled=false;}
  function setVal(key,val){var c=cur();if(c[key]===val)return;snapshot();c[key]=val;commit();renderSection();renderRoster();bounce();}
  function bounce(){var s=el('st-stage-wrap');if(!s)return;s.classList.remove('pop');void s.offsetWidth;s.classList.add('pop');try{if(typeof sfx==='function')sfx('pick');}catch(e){}}
  function randomize(){snapshot();var c=cur();SECTIONS.forEach(function(S){S[3].forEach(function(fd){if(fd[2]==='col'){var p=fd[5];c[fd[0]]=p[(Math.random()*p.length)|0];}else{var o=opts(fd[3]);if(o.length)c[fd[0]]=o[(Math.random()*o.length)|0][0];}});});
    /* keep it cute: fewer "everything on" combos */ if(Math.random()<.5)c.cape='none';if(Math.random()<.5)c.glasses='none';if(Math.random()<.4)c.hat='none';
    commit();render();bounce();}
  /* ---------- UI ---------- */
  function build(){root=document.createElement('div');root.id='studio';root.setAttribute('data-testid','character-studio');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Character Studio');
    root.innerHTML='<div class="st-card">'+
      '<header class="st-top"><div class="st-title">Character <span>Studio</span></div><div class="st-top-acts"><button class="st-ib" id="st-undo" data-testid="studio-undo" title="Undo" aria-label="Undo" disabled>↶</button><button class="st-ib" id="st-rand" data-testid="studio-randomize" title="Surprise me" aria-label="Randomize">🎲</button><button class="st-close" id="st-close" data-testid="studio-close" aria-label="Close">✕</button></div></header>'+
      '<div class="st-body">'+
        '<aside class="st-left"><div class="st-stage-wrap" id="st-stage-wrap"><div class="st-glow"></div><canvas id="st-stage" width="360" height="360" data-testid="studio-preview"></canvas><div class="st-floor"></div></div>'+
          '<label class="st-name"><span>Name</span><input id="st-name" maxlength="14" placeholder="Name your Frea" data-testid="studio-name-input"></label>'+
          '<div class="st-roster-h"><b>Your fleas</b><small id="st-count"></small></div><div class="st-roster" id="st-roster" data-testid="studio-roster"></div></aside>'+
        '<section class="st-right"><nav class="st-tabs" id="st-tabs" role="tablist"></nav><div class="st-pane" id="st-pane"></div></section>'+
      '</div>'+
      '<footer class="st-foot"><span class="st-hint">Tap any tile to try it on. Changes save automatically.</span><button class="st-done" id="st-done" data-testid="studio-done">Looks great!</button></footer>'+
    '</div>';
    document.body.appendChild(root);
    root.addEventListener('click',function(e){if(e.target===root)close();});
    el('st-close').onclick=close;el('st-done').onclick=close;el('st-rand').onclick=randomize;
    el('st-undo').onclick=function(){var s=undo.pop();if(!s)return;var o=JSON.parse(s),c=cur();Object.keys(o).forEach(function(k){c[k]=o[k];});commit();render();el('st-undo').disabled=!undo.length;};
    el('st-name').addEventListener('input',function(e){var c=cur();c.name=(e.target.value||'').trim()||'Frea';commit();renderRoster();});
    document.addEventListener('keydown',function(e){if(!open)return;if(e.key==='Escape')close();if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();el('st-undo').click();}});}
  function renderTabs(){el('st-tabs').innerHTML=SECTIONS.map(function(S){return '<button role="tab" aria-selected="'+(S[0]===sec)+'" class="'+(S[0]===sec?'on':'')+'" data-sec="'+S[0]+'" data-testid="studio-tab-'+S[0]+'"><i>'+S[2]+'</i><span>'+S[1]+'</span></button>';}).join('');
    [].forEach.call(el('st-tabs').querySelectorAll('[data-sec]'),function(b){b.onclick=function(){sec=b.dataset.sec;renderTabs();renderSection();el('st-pane').scrollTop=0;};});}
  function renderSection(){var S=SECTIONS.filter(function(x){return x[0]===sec;})[0],c=cur(),pane=el('st-pane'),h='';
    S[3].forEach(function(fd){var key=fd[0];h+='<div class="st-field"><div class="st-fh"><b>'+fd[1]+'</b><small>'+esc(fd[2]==='col'?c[key]:(opts(fd[3]).filter(function(o){return o[0]===c[key];})[0]||['',''])[1])+'</small></div>';
      if(fd[2]==='col'){h+='<div class="st-swatches">'+fd[5].map(function(col){return '<button class="st-sw'+(String(c[key]).toLowerCase()===col?' on':'')+'" style="--c:'+col+'" data-k="'+key+'" data-v="'+col+'" aria-label="'+fd[1]+' '+col+'" data-testid="studio-swatch-'+key+'-'+col.slice(1)+'"></button>';}).join('')+
        '<label class="st-sw custom" title="Custom color" data-testid="studio-custom-'+key+'"><input type="color" data-k="'+key+'" value="'+(c[key]||'#ffffff')+'"><span>＋</span></label></div>';}
      else{h+='<div class="st-tiles">'+opts(fd[3]).map(function(o){return '<button class="st-tile'+(c[key]===o[0]?' on':'')+'" data-k="'+key+'" data-v="'+esc(o[0])+'" data-z="'+fd[4]+'" data-testid="studio-opt-'+key+'-'+esc(o[0])+'"><canvas width="96" height="96"></canvas><span>'+esc(o[1])+'</span></button>';}).join('')+'</div>';}
      h+='</div>';});
    pane.innerHTML=h;
    /* draw tile previews progressively (keeps the modal snappy) */
    var tiles=[].slice.call(pane.querySelectorAll('.st-tile')),i=0;(function step(){var n=0;while(i<tiles.length&&n<6){var t=tiles[i++],rec=Object.assign({},c);rec[t.dataset.k]=t.dataset.v;paint(t.querySelector('canvas'),rec,+t.dataset.z,2);n++;}if(i<tiles.length)requestAnimationFrame(step);})();
    [].forEach.call(pane.querySelectorAll('[data-k][data-v]'),function(b){b.onclick=function(){setVal(b.dataset.k,b.dataset.v);};});
    [].forEach.call(pane.querySelectorAll('input[type=color]'),function(inp){inp.onchange=function(){setVal(inp.dataset.k,inp.value);};inp.oninput=function(){var cc=cur();cc[inp.dataset.k]=inp.value;};});}
  function renderRoster(){var r=el('st-roster');if(!r)return;r.innerHTML='';
    saved.forEach(function(f){var b=document.createElement('button');b.className='st-mini'+(f.id===activeId?' on':'');b.title=f.name;b.setAttribute('data-testid','studio-flea-'+f.id);var cv=document.createElement('canvas');cv.width=cv.height=112;paint(cv,f,1,2);b.appendChild(cv);var s=document.createElement('span');s.textContent=f.name;b.appendChild(s);
      b.onclick=function(){if(f.id===activeId)return;activeId=f.id;undo=[];el('st-undo').disabled=true;commit();render();bounce();};r.appendChild(b);});
    var add=document.createElement('button');add.className='st-mini add';add.setAttribute('data-testid','studio-new-flea');add.innerHTML='<b>＋</b><span>New</span>';add.onclick=function(){if(saved.length>=8){tipMsg('You can keep up to 8 fleas');return;}var id='f_'+Date.now();saved.push(normalize({id:id,name:'Neo '+(saved.length+1),color:SW[(Math.random()*SW.length)|0],secondary:SW[(Math.random()*SW.length)|0]}));activeId=id;undo=[];commit();render();bounce();};r.appendChild(add);
    el('st-count').innerHTML=saved.length+' / 8'+(saved.length>1?' · <button id="st-del" data-testid="studio-delete-flea">Delete '+esc(cur().name)+'</button>':'');
    var d=el('st-del');if(d)d.onclick=function(){if(!confirm('Delete '+cur().name+'?'))return;saved=saved.filter(function(f){return f.id!==activeId;});activeId=saved[0].id;undo=[];commit();render();};
    el('st-name').value=cur().name;}
  function tipMsg(m){var h=el('st-hint-tmp');if(!h){h=document.createElement('div');h.id='st-hint-tmp';h.className='st-toast';root.appendChild(h);}h.textContent=m;h.classList.add('show');setTimeout(function(){h.classList.remove('show');},1800);}
  function render(){renderTabs();renderSection();renderRoster();}
  function openStudio(){if(!root)build();open=true;undo=[];el('st-undo').disabled=true;render();root.classList.add('show');document.body.classList.add('studio-open');cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);setTimeout(function(){try{el('st-done').focus();}catch(e){}},50);}
  function close(){if(!open)return;open=false;cancelAnimationFrame(raf);root.classList.remove('show');document.body.classList.remove('studio-open');commit();}
  /* ---------- take over every "Customize" entry point ---------- */
  function wire(){var b=el('cust-toggle');if(b){var nb=b.cloneNode(true);b.parentNode.replaceChild(nb,b);nb.addEventListener('click',function(e){e.preventDefault();openStudio();});}
    var tab=document.querySelector('[data-testid="pm-tab-customize"]');if(tab)tab.style.display='none';
    document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-open-studio]');if(t){e.preventDefault();try{custModal.classList.remove('open');}catch(x){}openStudio();}});}
  openCust=function(){try{custModal.classList.remove('open');}catch(e){}openStudio();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  return {open:openStudio,close:close,isOpen:function(){return open;}};
})();
window.FreaStudio=Studio;
