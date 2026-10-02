/* apply the gpt-image-1 mode art everywhere a mode image is shown */
(function(){var T=window.FREA_ART||{};
  function apply(){Object.keys(T).forEach(function(k){if(k==='party')return;
      try{if(window.FREA_TILES)window.FREA_TILES[k]=T[k];if(window.FREA_TILES_T)window.FREA_TILES_T[k]=T[k];}catch(e){}
      try{if(typeof MODE_INTRO!=='undefined'&&MODE_INTRO[k])MODE_INTRO[k].img=T[k];}catch(e){}
      document.querySelectorAll('.mode-card[data-mode="'+k+'"] .mc-art img, img[data-tile="'+k+'"]').forEach(function(im){if(im.getAttribute('src')!==T[k])im.setAttribute('src',T[k]);});});
    var pc=document.querySelector('.mode-card.party-card');if(pc&&T.party&&!pc.style.getPropertyValue('--pt-photo')){pc.style.setProperty('--pt-photo','url('+T.party+')');pc.classList.add('has-photo');}}
  apply();setTimeout(apply,250);setTimeout(apply,1200);
  try{var m=document.getElementById('modes');if(m)new MutationObserver(function(){apply();}).observe(m,{childList:true});}catch(e){}
  window.FreaArt={apply:apply,keys:Object.keys(T)};
})();
