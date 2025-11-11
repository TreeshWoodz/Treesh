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
      root: $(".contain .sub_contain")[0],
      rootMargin: "0px",
      threshold: 0.1,
    }
  );

  $backdropItems.each(function () {
    observer.observe(this);
  });
  
  
  
  /* CHANGE NICKNAME */

        gsap.to($(".mm-menu .change_input .confirmation_text"), {
        height: $(".mm-menu .change_input form input").outerHeight(),
        duration: 0.6,
    ease: "expo.out"
    });
               
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
  $dataNickname.add("#wave .nickname").add(".mm-menu #mm-nickname .nickname").add(".mm-menu .profile .profile_name").add("#fun #your_hub .nickname").text(value);
}

        $(".mm-menu .confirm_input-btn").click(function() {
                nickname = $(".mm-menu .change_input form input").val();
     localStorage.setItem("nickname", nickname);
  $dataNickname.add("#wave .nickname").add(".mm-menu #mm-nickname .nickname").add(".mm-menu .profile .profile_name").add("#fun #your_hub .nickname").text(nickname);

                $confirmationTextSpan.html("Howdy, <b>" + nickname + "</b>!").parent().addClass("go");
            $(".mm-menu .change_input form input").val("");
            
            setTimeout(function() {
                $confirmationText.removeClass("go");
                
                setTimeout(function() {
                    $(".mm-menu .change_input .close_input-btn").click();
                }, 600);
            }, 2000);
        });


        $("#wave .nickname_handle, #your_hub figure").click(function() {
                $(".mm-menu .profile-btn").click();
        });

$(".mm-menu .profile_name").click(function() {
     if ( $(".mm-menu .change_input").hasClass("go") ) {
             gsap.to($(".mm-menu .change_input"), {
        height: 0,
        duration: 0.3,
    ease: "expo.out",
        onComplete: function() {
                $(".mm-menu .change_input").removeClass("go");
        }
    });
     } else {
             gsap.to($(".mm-menu .change_input"), {
        height: $(".mm-menu .change_input").children().outerHeight(),
        duration: 0.3,
    ease: "expo.out",
        onComplete: function() {
                $(".mm-menu .change_input").addClass("go");
        }
    });
             
     }
});


$(".mm-menu .change_input .close_input-btn").click(function() {
        gsap.to($(".mm-menu .change_input"), {
        height: 0,
        duration: 0.6,
    ease: "expo.out",
        onComplete: function() {
                $(".mm-menu .change_input").removeClass("go");
        }
    });
});
  
    });
