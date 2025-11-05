$(document).ready(function() {
var fortunes = [
    "A pleasant surprise is waiting for you.",
    "You will find success in unexpected places.",
    "Your hard work will pay off soon.",
    "Adventure is on the horizon.",
    "Good things come to those who wait.",
    "A new opportunity will arise.",
    "Stay positive, and good things will happen.",
    "You have the power to make a difference.",
    "A special someone is about to enter your life.",
    "Financial prosperity is in your future.",
    "Believe in yourself, and you will succeed.",
    "Your creativity will lead to great achievements.",
    "New friendships will bring joy to your life.",
    "A journey of a thousand miles begins with a single step.",
    "You are stronger than you think.",
    "A hidden talent will soon be revealed.",
    "The best is yet to come.",
    "Embrace change; it will lead to growth.",
    "You will be surrounded by love and happiness.",
    "Luck is on your side.",
    "Dream big, and you will achieve greatness.",
    "A positive attitude will open many doors.",
    "Cherish the people who are close to your heart.",
    "Your determination will overcome any obstacle.",
    "A secret admirer has their eye on you.",
    "Unexpected opportunities will lead to success.",
    "Trust your instincts; they will not steer you wrong.",
    "Happiness is a journey, not a destination.",
    "Your kindness will be rewarded tenfold.",
    "The future is bright with promise.",
    "Keep your eyes open; a big surprise is coming.",
    "Life is full of beautiful moments waiting to be discovered.",
    "Success is the sum of small efforts repeated day in and day out.",
    "The key to happiness is gratitude.",
    "You are the architect of your own destiny.",
    "Your greatest strength is your positive attitude.",
    "The universe is conspiring in your favor.",
    "Good things come to those who believe in themselves.",
    "Your potential is limitless; never stop striving for greatness.",
    "Adventure and excitement await you around every corner.",
    "A change in perspective can lead to profound insights.",
    "Today is a gift; that's why it's called the present.",
    "Your kindness will inspire others to be better.",
    "The path to success is paved with determination and persistence.",
    "Your optimism is a magnet for good fortune.",
    "The best is yet to come; keep moving forward with hope.",
    "A true friend is about to enter your life.",
    "Wisdom is the greatest treasure; seek it always.",
    "Your generosity will be repaid in unexpected ways.",
    "The power to change your life is within you.",
    "Your dreams hold the key to your future.",
    "Love and laughter will fill your days.",
    "A stroke of luck is heading your way soon.",
    "Believe in yourself, and others will too.",
    "Your positive energy is contagious; share it with the world.",
    "The journey may be long, but the destination is worth it.",
    "A wave of inspiration will lead to great accomplishments.",
    "Your heart's desires are within reach; reach for them.",
    "The sun always shines after the storm.",
    "A wise decision will bring you closer to your goals.",
    "Your intuition will guide you to success.",
    "An exciting opportunity will knock on your door.",
    "Trust in the process, and all will be well.",
    "Your potential for happiness is limitless.",
    "Embrace the unknown; it holds the keys to your future.",
    "You are a beacon of light in the lives of others.",
    "A moment of reflection will reveal your true path.",
    "Your dreams will lead you to places you've never imagined.",
    "Luck favors the bold; take a leap of faith.",
    "The world is full of beauty; take time to appreciate it.",
    "Your hard work will be recognized and rewarded.",
    "A new chapter in your life is about to begin.",
    "A kind gesture will have a ripple effect of positivity.",
    "Your perseverance will lead to triumph.",
    "Believe in the magic of new beginnings.",
    "Your inner strength will carry you through any challenge.",
    "In every end, there is a new beginning.",
    "The universe is aligning to bring you good fortune.",
    "Your kindness will be remembered by those you touch.",
    "You will achieve your goals through determination.",
    "Your smile will brighten someone's day.",
    "A thrilling adventure awaits you in the near future.",
    "Luck is simply preparation meeting opportunity.",
    "Your dreams will take you to extraordinary places.",
    "The best way to predict the future is to create it.",
    "Your positive actions will lead to positive outcomes.",
    "A great idea will bring you success and recognition.",
    "Happiness is found in the simplest of moments.",
    "You have the power to make a difference in the world.",
    "Your life will be a story worth telling.",
    "Believe in yourself, and others will believe in you too.",
    "Good things come to those who stay true to themselves.",
    "Your talents will open doors you never thought possible.",
    "A thrilling journey is about to begin.",
    "Success is the result of hard work and perseverance.",
    "Your greatest adventures are still ahead of you.",
    "The best way to predict your future is to create it.",
    "A wonderful surprise is coming your way soon.",
    "Your unique qualities make you exceptional.",
    "The world is full of beauty; take time to explore it.",
    "Your compassion will touch the lives of many.",
    "Every obstacle is an opportunity in disguise.",
    "A fulfilling career is in your future.",
    "Your wisdom will guide you to make the right decisions.",
    "A joyful event will bring you and your loved ones together.",
    "Your determination will overcome any challenge.",
    "Embrace change, and you'll find new opportunities.",
    "Your intuition will lead you to great discoveries.",
    "A positive outlook will attract positive outcomes.",
    "Adventure and excitement await you around every corner.",
    "Your generosity knows no bounds.",
    "A stroke of good luck will come when you least expect it.",
    "Your dreams will lead you to a brighter future.",
    "Your energy and enthusiasm are contagious.",
    "A new phase of life is about to unfold for you.",
    "Believe in yourself, and you will inspire others.",
    "You are capable of achieving greatness in all you do."
  ];

  var currentDay = new Date().getDate();
  var sameDay = localStorage.getItem("sameDay");
  var fortune = localStorage.getItem("fortune");

  if (!sameDay || sameDay != currentDay) {
    var num = Math.floor(Math.random() * fortunes.length);
    fortune = fortunes[num];
    localStorage.setItem("sameDay", currentDay);
    localStorage.setItem("fortune", fortune);
  }

	
    var controls = [
      { id: 'Favorite Artists', icon: 'fa-user', label: 'Fave Icons' },
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


	$(".about_you .about_you-item").click(function() {
		gsap.to($(".mm-menu .profile"), {
        height: 0,
        duration: 0.6,
    ease: "expo.out",
    onComplete: function() {
      $(".mm-menu .profile").removeClass("go");
    }
    });
		
  if ($(this).hasClass("your_join_date")) {
    $notificationIconBody = '<i class="fa-solid fa-star"></i>';
    $notificationBodyText = "<h1>Thank you, " + nickname + "!</h1> <p>We appreciate you for joining and supporting our <b>Icons</b>!</p> <p>You've visited <b>"+ visits +"</b> times and your longest time listening to music is <b>"+ storedTime +" minutes</b>!</p>";
  }
  else if ($(this).hasClass("your_birthday")) {
    $notificationIconBody = '<i class="fa-solid fa-cake-candles"></i>';
    $notificationBodyText = "<h1>Only " + daysLeft + " days to go!</h1> <p>Sure, your age adds up but you're only getting younger, <b>" + nickname + "</b>! Let's party soon!</p>";
  }
  else if ($(this).hasClass("your_zodiac")) {
    $notificationIconBody = '<i class="fa-solid fa-scale-balanced"></i>';
    $notificationBodyText = "<h1>Fortune of the Day</h1> <p>" + fortune + "</p>";
  }
  
  setNotificationOptions = true;
  $notificationCloseBtnText = "Close";
  $notificationStatus = "you";
  
  setTimeout(function() {
	  if ( $(".mm-menu .notification").hasClass("go") ) {
      closeNotification();
      
      setTimeout(function() {
          openNotification();
      }, 600);
  } else {
      openNotification();
  }
  }, 600);
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
			gsap.to($(".mm-menu .my_activity .options button.remove-btn"), {
        opacity: 0.6,
        duration: 0.3,
    ease: "expo.out"
    });
			
                                         }
                                     }, 400);
                                 }
                             });
                             
                             $(".mm-menu .my_activity .options").on("click", "button.cancel-btn", function() {
                                 var $this = $(this);
                                 $(".mm-menu .my_activity .fun_music-content .active ol").removeClass("select").removeClass("selected");
                                 
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
                                     $(this).toggleClass("select").toggleClass("selected");
                                     
                                     if ( $(".mm-menu .my_activity .fun_music-content .active ol:not(.select)").length ) {
                                    $(".mm-menu .my_activity .options button.remove-btn").css("opacity", "1");
                                } else {
                                    $(".mm-menu .my_activity .options button.remove-btn").css("opacity", "0.6");
                                }
                                 }
                             });
                             
    
  });
