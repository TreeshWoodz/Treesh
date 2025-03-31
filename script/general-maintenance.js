function loadSite() {
    $("#flickSite").remove();

  $(".radiate, #welcome").css("opacity", 1);

  $(".radiate.main").addClass("go");
  
  setTimeout(function() {
      $("#welcome h2").css("opacity", 0);
      
      setTimeout(function() {
          $("#welcome h2").html("<small>We're doin' some work on the backend.</small>");
          
          $("#welcome h2").css("opacity", 1);
          
          setTimeout(function() {
      $("#welcome h2").css("opacity", 0);
              setTimeout(function() {
          $("#welcome h2").html("<small>Don't worry. We'll try to make this quick.</small>");
          
          $("#welcome h2").css("opacity", 1);
          
           setTimeout(function() {
      $("#welcome h2").css("opacity", 0);
              setTimeout(function() {
          $("#welcome h2").html("<small>#TreeshLife</small>");
          
          $("#welcome h2").css("opacity", 1);
      }, 600);
          }, 5000);
      }, 600);
          }, 5000);
      }, 600);
  }, 5000);
}

$("#flickSite, #intro, script.script1").remove();
$(document).ready(function() {
   loadSite(); 
});
