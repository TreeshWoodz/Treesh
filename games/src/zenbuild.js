/* ===== Zen Build panel 2: header with search + object count + minimise; filter items live ===== */
var FreaZenBuild=(function(){
  function el(id){return document.getElementById(id);}
  var q='';
  function head(){var d=el('zen-dock');if(!d||d.querySelector('.zb-head'))return;var h=document.createElement('div');h.className='zb-head';
    h.innerHTML='<div class="zb-title"><b>BUILD</b><small>Tap an item · it drops in front of you</small></div><span class="zb-count" data-testid="zen-build-object-count">0 objects</span><button class="zb-min" data-testid="zen-build-minimise" aria-label="Hide build panel">\u2715</button>';
    var s=document.createElement('input');s.className='zb-search';s.type='search';s.placeholder='Search items\u2026';s.setAttribute('data-testid','zen-build-search');s.setAttribute('aria-label','Search build items');
    var row=document.createElement('div');row.className='zb-head';row.appendChild(s);
    d.insertBefore(row,d.firstChild);d.insertBefore(h,d.firstChild);
    s.addEventListener('input',function(){q=s.value.trim().toLowerCase();filter();});s.addEventListener('keydown',function(e){e.stopPropagation();});
    h.querySelector('.zb-min').onclick=function(){d.classList.add('collapsed');var f=el('zen-fab');if(f)f.classList.remove('open');};}
  function filter(){var host=el('zen-items');if(!host)return;var n=0;[].forEach.call(host.querySelectorAll('.zen-item'),function(b){var t=(b.textContent+' '+(b.dataset.spawn||'')).toLowerCase();var hide=q&&t.indexOf(q)<0;b.classList.toggle('zb-hide',!!hide);if(!hide)n++;});
    var e=host.querySelector('.zb-empty');if(!n&&q){if(!e){e=document.createElement('div');e.className='zb-empty';host.appendChild(e);}e.textContent='Nothing called \u201c'+q+'\u201d in this tab';}else if(e)e.remove();}
  var _b=buildZenItems;buildZenItems=function(){var r=_b.apply(this,arguments);try{head();filter();}catch(e){}return r;};
  setInterval(function(){var c=document.querySelector('#zen-dock .zb-count');if(!c||gameMode!=='zen')return;var n=platforms.filter(function(p){return p.deco;}).length;c.textContent=n+' object'+(n===1?'':'s');document.body.classList.toggle('zen-build-open',!!(el('zen-dock')&&el('zen-dock').classList.contains('show')&&!el('zen-dock').classList.contains('collapsed')));},700);
  try{head();}catch(e){}
  return {filter:filter};
})();
