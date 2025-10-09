$(document).ready(function() {
    var controls = [
      { id: 'Favorite Artists', icon: 'fa-user', label: 'Fave Artists' },
      { id: 'Favorite Songs', icon: 'fa-music', label: 'Fave Songs' },
      { id: 'Recently Played Songs', icon: 'fa-play', label: 'Last Played' },
      // { id: 'Skipped Songs', icon: 'fa-forward', label: 'Skipped' },
      // { id: 'Previously Played Songs', icon: 'fa-arrow-rotate-left', label: 'Previously Played' },
      { id: 'Deleted Songs', icon: 'fa-trash-can', label: 'Deleted' }
    ];

    controls.forEach(function(control) {
      $(".fun_music-controls").append(
        '<button type="button" data-for="' + control.id + '">' +
          '<span><i class="fa-solid ' + control.icon + '"></i></span> <span>' + control.label + 
        '</span></button>'
      );
    });
    
    $(".fun_music-controls button:first").addClass("active");

    $(".fun_music-controls").on("click", "button", function() {
    let $this = $(this),
        containerID = $this.attr("data-for"),
        $funMusic = $(".mm-menu .my_activity");

    if (["Favorite Artists", "Favorite Songs", "Deleted Songs"].includes(containerID)) {

        if (containerID === "Favorite Songs") {
            $("[data-favorite-song] [data-song]").each(function() {
                let $song = $(this),
                    songData = $("#music .grid .song[data-track='" + $song.attr("data-song") + "']"),
                    newCover = songData.attr("data-coverart"),
                    img = $song.find("img");

                if (img.attr("src") !== newCover) img.attr("src", newCover);
            });
        }
    } 

    let $cancelBtn = $funMusic.find(".cancel-btn");
    if ($cancelBtn.length) {
        $cancelBtn.click();
        $funMusic.find(".remove-btn").css("opacity", "1");
    }

    $this.addClass("active").siblings().removeClass("active");
    $funMusic.find(".fun_music-content .active").removeClass("active");
    $funMusic.find("[data-for='" + containerID + "']").addClass("active");

    $content.find(".active").each(function() {
        if (!$(this).find("ol").length) {
            $(this).html("<span class='nothing_here'>Nothing here!</span>");
        }
    });
});


	$(".about_you .about_you-item:not(.your_zodiac)").click(function() {
  if ($(this).hasClass("your_join_date")) {
    $notificationIconBody = '<i class="fa-solid fa-star"></i>';
    $notificationBodyText = "<h1>Thank you, " + nickname + "!</h1> <p>We appreciate you for joining and supporting our <b>Icons</b>!</p> <p>You've visited <b>"+ visits +"</b> times and your longest time listening to music is <b>"+ storedTime +" minutes</b>!</p>";
  }
  else if ($(this).hasClass("your_birthday")) {
    $notificationIconBody = '<i class="fa-solid fa-cake-candles"></i>';
    $notificationBodyText = "<h1>Only " + daysLeft + " days to go!</h1> <p>Sure, your age adds up but you're only getting younger, <b>" + nickname + "</b>! Let's party soon!</p>";
  }
  
  setNotificationOptions = true;
  $notificationCloseBtnText = "Close";
  $notificationStatus = "you";
  
  if ( $(".mm-menu .notification").hasClass("go") ) {
      closeNotification();
      
      setTimeout(function() {
          openNotification();
      }, 600);
  } else {
      openNotification();
  }
    });

                              
                              
                             $(".mm-menu .my_activity .options button.remove-btn").click(function() {
                                 if ( $(this).attr("data-type") === "select" ) {
                                     $(this).html('<i class="fa-solid fa-eraser"></i> <span>Remove</span>').attr("data-type", "remove").css("opacity", "0.6");
                                 $(".mm-menu .my_activity .fun_music-content .active ol").addClass("select");
                                 
                                 if ( !$(".mm-menu .my_activity .options .cancel-btn").length ) {
                                 $('<button type="button" class="cancel-btn"><i class="fa-solid fa-xmark"></i> <span>Cancel</span></button>').appendTo(".mm-menu .my_activity .options .container");
                                 
                                 }
                                 } else {
                                     $(".mm-menu .my_activity .fun_music-content .active ol:not(.select)").addClass("delete");
                                     setTimeout(function() {
                                         $(".mm-menu .my_activity .fun_music-content .active ol:not(.select)").remove();
                                         
                                         $(".mm-menu .my_activity .fun_music-content").find(".active").each(function() {
                                         if (!$(this).find("ol").length) {
                                             $(".mm-menu .my_activity .cancel-btn").click();
          $(this).html("<span class='nothing_here'>Nothing here!</span>");
        }
                                         });
        
        localStorage.setItem("deletedSong", $dataDeletedSong.html());
        localStorage.setItem("favArtist", $dataFavoriteArtist.html());
        localStorage.setItem("favSong", $dataFavoriteSong.html());
        
        
        if ( !$(".mm-menu .my_activity .fun_music-content .active ol:not(.select)").length ) {
                                             $(".mm-menu .my_activity .options button.remove-btn").css("opacity", "0.6");
                                         }
                                     }, 400);
                                 }
                             });
                             
                             $(".mm-menu .my_activity .options").on("click", "button.cancel-btn", function() {
                                 var $this = $(this);
                                 $(".mm-menu .my_activity .fun_music-content .active ol").removeClass("select");
                                 
                                  $(".mm-menu .my_activity .options button.remove-btn").attr("data-type", "select").html('<i class="fa-regular fa-hand-pointer"></i> <span>Options</span>').css("opacity", "1");
                                 $this.remove();
                                 
                                 setTimeout(function() {
                                      $(".mm-menu .my_activity .options button.remove-btn").css("opacity", "1");
                                 }, 300);
                             });
                             
                             $(".mm-menu .my_activity .fun_music-content").on("click", ".active ol.select", function() {
                                
                                if ( $(".mm-menu .my_activity .fun_music-content .active ol.select").length >= 0 ) {
                                    $(".mm-menu .my_activity .options button.remove-btn").css("opacity", "1");
                                }
                             });
                             
                             $(".mm-menu .my_activity .fun_music-content").on("click", ".active ol", function() {
                                 if ( $(".mm-menu .my_activity .options .cancel-btn").length ) {
                                     $(this).toggleClass("select");
                                     
                                     if ( $(".mm-menu .my_activity .fun_music-content .active ol:not(.select)").length ) {
                                    $(".mm-menu .my_activity .options button.remove-btn").css("opacity", "1");
                                } else {
                                    $(".mm-menu .my_activity .options button.remove-btn").css("opacity", "0.6");
                                }
                                 }
                             });
                             
          
          
          $("#fun #widgets").find(".draggable").each(function () {
    let $this = $(this);
    let id = $this.attr("id");
    let savedPos = localStorage.getItem(id);

    if (savedPos) {
        let pos = JSON.parse(savedPos);
        $this.css({ top: pos.top, left: pos.left });
    }

    $this.draggable({
        containment: "#widgets",
        stop: function (event, ui) {
            let position = { top: ui.position.top, left: ui.position.left };
            localStorage.setItem(id, JSON.stringify(position));
        }
    });


function toggleDraggable() {
        if ($("#widgets .widgets_options .reposition_widgets-btn").hasClass("active")) {
            $this.draggable("enable");
        } else {
            $this.draggable("disable");
        }
}

toggleDraggable();

    let observer = new MutationObserver(toggleDraggable);
    observer.observe(document.querySelector("#widgets .widgets_options .reposition_widgets-btn"), { attributes: true, attributeFilter: ["class"] });
    
    
    $this.find('p').each(function () {
                let $p = $(this);
                let textWidth = $p[0].scrollWidth;
                let containerWidth = $p.parent().width();

                if (textWidth > containerWidth) {
                    $p.addClass("marquee");
                }
            });
});


        
        $("#fun #widgets .draggable").on("mouseenter touchstart", function () {
            if ( $("#widgets .widgets_options .reposition_widgets-btn").hasClass("active") ) {
    $("#widgets .widgets_options").css("opacity", "0.3");
            }
}).on("mouseleave touchend", function () {
    if ( !$("#widgets .widgets_options .reposition_widgets-btn").hasClass("active") ) {
    } else {
        $("#widgets .widgets_options").css("opacity", "1");
    }
});
                
$("#widgets .widgets_options .reposition_widgets-btn").click(function() {
                    if ( $("#widgets .widgets_options").hasClass("opened") && !$(this).hasClass("inactive") ) {
                        if ( !$(this).hasClass("active") ) {
                            $("#widgets .widget").addClass("jiggle");
                            $(this).addClass("active");
                            $flickSite.flickity("unbindDrag");
                        $(this).find("span").text("Cancel Reposition");
                        } else {
                            $("#widgets .widget").removeClass("jiggle");
                            $(this).removeClass("active");
    $flickSite.flickity("bindDrag");
                            $(this).find("span").text("Reposition Widgets");
                        }
                    }
                });
                
                $("#widgets .widgets_options button").click(function() {
                   if ( !$(this).hasClass("inactive") ) {
                       $(this).siblings().not(".hide_widgets-btn").toggleClass("inactive");
                   }
                });


 $("#widgets .widgets_options .hide_widgets-btn").click(function() {
     if ( $("#widgets .widgets_options").hasClass("opened") ) {
         $("#widgets .widgets_options").find("button.active").click();
         $("#widgets .widgets_options button").removeClass("inactive");
                    $(this).find("span").text(function(_, text) {
        return text === "Hide Widgets" ? "Show Widgets" : "Hide Widgets";
    });
                   $("#widgets .widget").toggleClass("go"); 
                   $(this).siblings().toggle();
     }
                });


            
            if (localStorage.getItem("show music widget") === "true") {
    $("#widgets .music_widget").addClass("go");
    $(".mm-menu .music_widget-btn span:last").text("Hide Music Widget");

    $("#fun #widgets").find(".draggable").each(function () {
        let $this = $(this);

        $this.find('p').each(function () {
            let $p = $(this);
            let textWidth = $p[0].scrollWidth;
            let containerWidth = $this.width();
            if (textWidth > containerWidth) {
                $p.addClass("marquee");
            }
        });
    });
} else {
    $("#widgets .music_widget").removeClass("go");
    $(".mm-menu .music_widget-btn span:last").text("Show Music Widget");
}

$("#widgets .music_widget").click(function() {
   if ( $(this).find(".audio_ani").hasClass("go") && !$("#widgets .widgets_options").hasClass("opened") ) {
       $travelBtn.click();
       $menuFlick.flickity("selectCell", ".music_bar");
   } else {
       $("#now_playing").removeClass("go");
   }
});

$("#fun #widgets .resize_widgets-btn").click(function() {
    if ( $("#widgets .widgets_options").hasClass("opened") && !$(this).hasClass("inactive") ) {
        
        if ( !$(this).hasClass("active") ) {
            $(this).addClass("active");
        } else {
            $(this).removeClass("active");
        }
        
    if (!$("#fun #widgets").hasClass("resize-active")) {
        $("#fun #widgets .widget").append('<div class="special-btns"><button type="button" class="resize-btn"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></button></div>');
        $("#fun #widgets").addClass("resize-active");
        $(this).find("span").text("Cancel Resize");
        
        $("#fun #widgets .widget").each(function() {
            if ($(this).hasClass("enlarge")) {
                $(this).find(".special-btns .resize-btn").addClass("enlarged");
                $(this).find(".special-btns .resize-btn i").removeClass("fa-up-right-and-down-left-from-center").addClass("fa-down-left-and-up-right-to-center");
            } else {
                $(this).find(".special-btns .resize-btn").removeClass("enlarged");
                $(this).find(".special-btns .resize-btn i").removeClass("fa-down-left-and-up-right-to-center").addClass("fa-up-right-and-down-left-from-center");
            }
        });
    } else {
        $("#fun #widgets .widget .special-btns").remove();
        $("#fun #widgets").removeClass("resize-active");
        $(this).find("span").text("Resize Widgets");
    }
    }
});
                   
$("#widgets").on("click", ".special-btns button", function() {
    if ($(this).hasClass("resize-btn")) {
        if (!$(this).hasClass("enlarged")) {
            $(this).parents(".widget").addClass("enlarge");
            $(this).find("i").removeClass("fa-up-right-and-down-left-from-center").addClass("fa-down-left-and-up-right-to-center");
            $(this).addClass("enlarged");
        } else {
            $(this).parents(".widget").removeClass("enlarge");
            $(this).removeClass("enlarged");
            $(this).find("i").removeClass("fa-down-left-and-up-right-to-center").addClass("fa-up-right-and-down-left-from-center");
        }
    }
    
    setTimeout(function(){
        localStorage.setItem("enlargedWidgets", $("#fun #widgets .widget.enlarge").map(function(){
            return $(this).index();
        }).get().join(","));
    }, 0);
});
                    
                    
                    $.each((localStorage.getItem("enlargedWidgets") || "").split(","), function(i, idx){
        if(idx !== ""){
            $("#fun #widgets .widget").eq(idx).addClass("enlarge");
        } else {
            $("#fun #widgets .widget").eq(idx).removeClass("enlarge");
        }
    });
    
  });
