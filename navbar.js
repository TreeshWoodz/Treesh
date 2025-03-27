$(document).ready(function() {
        /* BACKDROP OBSERVER */
  var $backdropItems = $(".backdrops .backdrop_item");

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var $item = $(entry.target);
        var imageUrl = $item.attr("data-sm");

        if (entry.isIntersecting) {
          if (imageUrl) {
            $item.css("background-image", "url('" + imageUrl + "')");
          }
        } else {
          $item.css("background-image", "none");
        }
      });
    },
    {
      root: $(".contain .contain")[0],
      rootMargin: "0px",
      threshold: 0.1,
    }
  );

  $backdropItems.each(function () {
    observer.observe(this);
  });
  
  
  
  /* CHANGE NICKNAME */
  $(".mm-menu .change_input .confirmation_text").height($(".mm-menu .change_input form input").outerHeight());
               
             $(".mm-menu .change_input form input").on("keyup keydown keypress change", function(event) {
    var $this = $(this);
    var value = $this.val();
    var $parent = $this.parents("form");
    var $confirmBtn = $parent.find(".input_controls .confirm_input-btn");
    var $confirmationText = $parent.find(".confirmation_text");
    var $confirmationTextSpan = $parent.find(".confirmation_text span");
    
    if (value.trim() !== "") {
        $confirmBtn.addClass("activate");
        
        if (event.key === "Enter") {
            event.preventDefault();
            $confirmBtn.removeClass("activate");

            confirmNickname(value);
            
            $confirmationTextSpan.html("Howdy, <b>" + value + "</b>!").parent().addClass("go");
            $this.val("");
            
            setTimeout(function() {
                $confirmationText.removeClass("go");
                
                setTimeout(function() {
                    $(".mm-menu .change_input .close_input-btn").click();
                }, 600);
            }, 2000);
        }
    } else {
       $confirmBtn.removeClass("activate");
    }
});

function confirmNickname(value) {
    nickname = value;
     localStorage.setItem("nickname", value);
  $dataNickname.add("#wave .nickname").text(value);
  $funNickname.attr("placeholder", value).val("");
}


$("#wave .nickname_handle, #fun [data-nickname]").click(function() {
     if ( $(".mm-menu .change_input").hasClass("go") ) {
         $(".mm-menu .change_input").outerHeight(0).removeClass("go");
     } else {
         $(".mm-menu .change_input").outerHeight($(".mm-menu .change_input").children().outerHeight()).addClass("go");
     }
});


$(".mm-menu .change_input .close_input-btn").click(function() {
   $(".mm-menu .change_input").height(0).removeClass("go"); 
});
  
    });
