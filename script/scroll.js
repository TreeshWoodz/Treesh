$(document).ready(function() {
        
 function setupLazyLoader(lazyItemSelector, getImg, setImg, clearImg, dataAttr, observerOptions) {
  var $items = $(lazyItemSelector);

  // Store the original value in the element's data attribute
  $items.each(function() {
    var $this = $(this);
    var originalValue = getImg($this);
    $this.attr(dataAttr, originalValue);
  });

  // Create an IntersectionObserver
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var $item = $(entry.target);
      var value = $item.attr(dataAttr);
      if (entry.isIntersecting) {
        setImg($item, value);
      } else {
        clearImg($item);
      }
    });
  }, observerOptions);

  // Observe each item
  $items.each(function() {
    observer.observe(this);
  });
}

// MUSIC ARTISTS
setupLazyLoader(
  "#music .artists .artist",
  function($el) { return $el.find(".artist__image").attr("src"); },
  function($el, value) { $el.find(".artist__image, .artist__blur").attr("src", value); },
  function($el) { $el.find(".artist__image, .artist__blur").attr("src", ""); },
  "data-thumbnail",
  { root: $(".artists .contain")[0], rootMargin: "0px", threshold: 0.1 }
);

// FEATURED VIDEOS
setupLazyLoader(
  "#music .featured_videos .featured_video",
  function($el) { return $el.find(".thumbnail").css("background-image"); },
  function($el, value) { $el.find(".thumbnail").css("background-image", value); },
  function($el) { $el.find(".thumbnail").css("background-image", "none"); },
  "data-thumbnail",
  { root: $(".featured_videos .featured_videos_contain")[0], rootMargin: "0px", threshold: 0.1 }
);

// SONG GRID
setupLazyLoader(
  "#music .grid .song",
  function($el) { return $el.find(".coverart").attr("src"); },
  function($el, value) { $el.find(".coverart").attr("src", value); },
  function($el) { $el.find(".coverart").attr("src", ""); },
  "data-coverart",
  { root: $("#music .content")[0], rootMargin: "0px", threshold: 0.1 }
);

// ICONS - LAZY LOAD
setupLazyLoader(
  "#icons .member",
  function($el) { return $el.css("background-image"); },
  function($el, value) { $el.css("background-image", value); },
  function($el) { $el.css("background-image", "none"); },
  "data-thumbnail",
  { root: $("#icons")[0], rootMargin: "0px", threshold: 0.1 }
);

  
  
    });
