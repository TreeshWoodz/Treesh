/* ===================== FREA! PLUS — DESKTOP LOBBY HERO ROW =====================
   On desktop (>=900px) the "What's New" carousel sits side-by-side with the Party Mode banner
   (both live in the first row of the mode grid) and the clock tucks into the What's New header,
   so there's no empty gap next to the carousel. On mobile everything goes back to the stacked layout. */
(function(){
  var mq=window.matchMedia('(min-width:900px)');
  var wn=document.getElementById('whatsnew'),clock=document.getElementById('home-clock'),modes=document.getElementById('modes');
  if(!wn||!modes)return;
  var home=wn.parentNode,head=wn.querySelector('.wn-head');
  function apply(){var desk=mq.matches;
    if(desk){if(wn.parentNode!==modes)modes.insertBefore(wn,modes.firstChild);
      if(clock&&head&&clock.parentNode!==head)head.appendChild(clock);}
    else{if(wn.parentNode!==home)home.insertBefore(wn,modes);
      if(clock&&clock.parentNode!==home)home.insertBefore(clock,wn);}
    document.body.classList.toggle('lobby-hero-row',desk);}
  apply();
  try{mq.addEventListener('change',apply);}catch(e){try{mq.addListener(apply);}catch(x){}}
  window.FreaLobbyRow={apply:apply};
})();
