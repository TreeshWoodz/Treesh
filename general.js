 // GLOBAL VARIABLES ---------------------

// NO ZOOM ON MOBILE

if ("ontouchstart" in window) {
  var lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    function (event) {
      var now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    false
  );
}

$("img.word_logo").attr("src", "https://static.tumblr.com/9leohrr/oRMsrlfx5/treesh-word-mark-white.png");

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

if (isIOS) {
  document.body.classList.add("ios");
}

// VARIABLES
var currentURL = window.location.href;
var homepageURL = "https://treesh.life/";
var testPage =
  "https://assets.txmblr.com/customize_preview_receiver.html?b17b86dedb0b8377fd41ca40aa553ff8";

const $window = $(window);
const $document = $(document);
const $body = $("body");
const $icons = $("#icons");
const $members = $("#icons .members");
const $member = $("#icons .member");
let numOfMembers = $member.length;
let $memberSocials;
const $site = $("#site");
const $wave = $("#wave");
const $waveLogo = $("#wave #logo .logo");
const $siteSection = $(".site_section");
const $membersLocation = $("#icons .member .location");
const $footer = $("#footer");

let currentSong;
let songName;
let songArtist;
let thumbnail;
let playing = false;
var song;
var theSong;
const $playPause = $("#playpause");
const $playPauseBtn = $(".mm-menu .playpause-btn");
const $repeatBtn = $("#repeat");
var songPlaying;
var nowPlayingScreen = true;

var birthMonth;
var birthDay;
var birthYear;
var birthMonthName;
var wholeBday;

let isClickable = true;

const $musicBtn = $(".mm-menu .music_player-btn");
const $music = $("#music");
const $musicContent = $("#music .content");
const $musicArtists = $("#music .artists");
const $musicArtistsContain = $("#music .artists .contain");
const $musicArtist = $("#music .artists .artist");
const $musicArtistsNameTitle = $("#music .artists .artist p:first");
const $musicHeader = $("#music .header");
const $musicGrid = $("#music .tracks .grid");
const $musicGridSongs = $("#music .tracks .grid .song");
const $musicArtistsItems = $("#music .artists .artist");
const $marquee = $(".mm-menu .music_info.go.is-selected .sub_section.title ul");
const $tracks = $("#music .tracks");
const $tracksItems = $("#music .tracks .grid .song");
const $navBarMenu = $(".mm-menu .menu");
const $navBarMenuInfo = $(".mm-menu .menu_info");
const $musicBarInfo = $(".mm-menu .music_info");
const $musicBarInfoArtist = $(".music_info .music_info_artist");
const $musicBarInfoTrack = $(".music_info .music_info_track");
const $musicBar = $(".mm-menu #music_bar");
const $nowPlaying = $("#now_playing");
const $nowPlayingSongData = $("#now_playing .song_data");
const $nowPlayingSongDataTitle = $("#now_playing .song_data h1");
const $nowPlayingSongDataArtist = $("#now_playing .song_data h2");
const $musicControls = $(".mm-menu #music_bar .music-controls");
const $musicScrubber = $(".mm-menu #scrubber");
const $musicScrub = $(".mm-menu #scrub");
const $musicRecordPlayer = $("#now_playing #record_player");
const $musicRecordPlayerVinyl = $("#now_playing #record_player .record_player");
const $playBtn = $(".mm-menu #music_bar #playpause");
const $nextBtn = $(".mm-menu #music_bar #nextbtn");
const $prevBtn = $(".mm-menu #music_bar #prevbtn");
const $navBarSearchMusic = $(".mm-menu .search-music");
const $travelBtn = $(".mm-menu #music_bar #travel");
const $currentlyPlayingInfo = $(".mm-menu #music_bar .currentlyPlaying");
const $currentlyPlayingInfoSongName = $(
  ".mm-menu #music_bar .currentlyPlaying .songName"
);
const $currentlyPlayingInfoSongArtist = $(
  ".mm-menu #music_bar .currentlyPlaying .songArtist"
);
const $musicInfoLabel = $(".mm-menu .music_info .label");
let labelText;
let randomSong;
let pickMemberName;
let randomTitle;
let prevSongTitle = null;
let nextSongTitle = null;
const $musicSearch = $(".mm-menu [data-music-search]");
const $musicLyrics = $("#now_playing #lyrics");
const $musicHiddenLyrics = $("#now_playing #lyrics .all_lyrics .lyric");
const $musicLyricsLyrics = $("#now_playing #lyrics .lyrics");
const $musicLyricsContainer = $("#lyrics .lyrics .body");
const $musicPlaylist = $("#music .playlist");
const $musicLyricsBody = $("#now_playing #lyrics .lyrics .body");
const $musicLyricsBtn = $(".mm-menu .lyrics-btn");
const $musicSearchBtn = $(".mm-menu .search-btn");
const $musicGenres = $("#music .genres");
const $lyricExplained = $("#now_playing #lyrics .lyrics [data-explain]");
let currentLyricTop = null;
let $musicArtistsFaveHrt = $("#music .artists .fave-hrt");
const $musicArtistsHeading = $("#music .artists .heading");
const $aboutSong = $("#now_playing #about_song");
const $musicPlaylistControlsBtn = $(".mm-menu #music_filters button");
const $faveHrt = $(".fave-hrt");
var musicInfoGo;
var firstLyricLineOffsetTop;
var closePlaylist;
let $tracksPos = $("#music .tracks").position().top;

const $navBar = $(".mm-menu");
const $navBarItem = $(".mm-menu a.mm-item");
const $notification = $(".mm-menu .notification");
const $notificationBody = $(".mm-menu .notification .body");
var $notificationIconBody = '<i class="fa-solid fa-circle-info"></i>';
var $notificationIcon = $(".mm-menu .notification .icon").html(
  $notificationIconBody
);
var $notificationStatus = "fun";
var savedAttributes;
const $notificationOptions = $(".mm-menu .notification .options");
let $notificationButtons;
var $notificationMoreOptions = $(".mm-menu .notification .options .more").html(
  $notificationButtons
);
let $notificationOptionsCloseBtn = $(
  ".mm-menu .notification .options button[data-close]"
);
let $notificationOptionsCloseBtnSpan = $(
  ".mm-menu .notification .options button[data-close] span"
);
let setNotificationOptions = true;
const $notificationBodyContain = $(".mm-menu .notification .body_contain");
var $notificationBodyText =
  "<h1>Welcome to <b>TREESH</b>!</h1><p>Discover up-and-coming talents from across the globe. <b>Everyone</b> Deserves An Audience™!</p>";
const $notificationCloseBtn = $(
  ".mm-menu .notification [data-close], #notif [data-close]"
);
const $notificationCloseBtnSpan = $(".mm-menu .notification [data-close] span");
var $notificationCloseBtnText = "Thanks!";
var notificationTimer = 6000;
var notificationTimeout;
var pressTimer;

const $menu = $(".mm-menu .menu, .mm-menu .modal");
const $menuDeleteBtn = $(".mm-menu .menu .delete-btn");
const menuContain = ".mm-menu .menu .contain, .mm-menu .modal .contain";
const $menuButtons = $(".mm-menu .menu button");
const $menuButtonsA = $(".mm-menu .menu a");
var removeLabelTime;

const $funBtn = $(".mm-menu .fun-btn");
const $fun = $("#fun");
const $funSection = $("#fun .current .current_section");
const $funIsotopeSection = $("#fun .current .isotope_section");
const $funContain = $("#fun .account");
const $funAccount = $("#fun .account");
var accountScroll = $funAccount.position().top - 60;
const $funPFPImg = $("#fun .pfp img");
const $funNickname = $("#fun #you #nickname");
const $funBirthday = $("#fun #you #birthday");
const $funSettings = $("#fun .settings");
const $funSettingsBtn = $("#welcomeInfo .settings-btn");
const $saveSettingsBtn = $("#welcomeInfo #save_settings");
const $cancelSettingsBtn = $("#welcomeInfo #cancel_settings");
const $homeSettingsBtn = $("#welcomeInfo #home_settings");
const $funCurrent = $("#fun .current");
const $funFaveHrtPicker = $("#fun .faveHrtPicker");
const $funFaveHrtPickerContain = $funFaveHrtPicker.find(".content");
const $funFaveHrtChoices = $(".mm-menu .emoji_contain favehrt-tag");
var $funFaveHrtPicked = $(".mm-menu .emoji_contain favehrt-tag.picked");
var $funFaveHrtPickedSymbol = $funFaveHrtPicked.find("span").text();
var appendHrt =
  '<div class="fave-hrt"><x>' + $funFaveHrtPickedSymbol + "</x></div>";
var funCurrentPos = $("#fun .current").offset().top;

function dataPos() {
  $("#fun .current_section ul").each(function () {
    $(this).attr("data-pos", $(this).offset().top);
  });
}

const $deleteDataBtn = $("#fun .settings #delete_data-btn");
const $dataBirthMonth = $("#fun [data-birth-month]");
const $dataBirthDay = $("#fun [data-birth-day]");
const $dataNickname = $("[data-nickname]");
const $dataJoinDate = $("#fun [data-join-date]");
const $dataFavoriteArtist = $("#fun [data-favorite-artist]");
const $dataFavoriteSong = $("#fun [data-favorite-song]");
const $dataDeletedSong = $("#fun [data-deleted-song]");
const $dataPreviousSong = $("#fun [data-previous-song]");
const $dataZodiac = $("#fun [data-zodiac]");
let zodiac;
const $dataTillBday = $("#fun [data-days-till-bday]");
const $dataFortune = $("#fun [data-fortune]");
const $dataLastPlayedSong = $("#fun [data-last-played-song]");
const $dataSkippedSong = $("#fun [data-last-skipped]");
const $dataFavoriteModel = $("#fun [data-favorite-model]");
const $dataFavoritePhoto = $("#fun [data-favorite-photo]");
const $dataDeletedPhoto = $("#fun [data-deleted-photo]");
var daysLeft;

var selectedItemMenu;
var scrollPosition = 0;
var scrollEnabled = true;

var buttonAppended = false;

let animationRunning = true;

function disableWindowScroll() {
  $("body").addClass("overflow");
  scrollPosition = $window.scrollTop();
  scrollEnabled = false;
}

var defaultAvAItar = "https://static.tumblr.com/9leohrr/cjGsriehu/red-afro.png";
var theAvAItar = defaultAvAItar;

function enableWindowScroll() {
  $("body").removeClass("overflow");
  scrollEnabled = true;
}

var currentDate = new Date();

let startTime = Date.now();
let storedTime = Number(localStorage.getItem("maxTimeSpent")) || 0;

function updateTime() {
    let currentTime = Math.floor((Date.now() - startTime) / 60000);

    if (currentTime > storedTime) {
        localStorage.setItem("maxTimeSpent", currentTime);
        storedTime = currentTime;
    }
}

setInterval(updateTime, 60000);
updateTime();

var visits = localStorage.getItem('visitCount');
  visits = visits ? parseInt(visits) : 0;
  visits++;
  localStorage.setItem('visitCount', visits);
                

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function birthDayTransform() {
  let birthDayDisplay = birthDay;

  let dayNumber = parseInt(birthDay, 10);

  if (dayNumber < 10) {
    birthDayDisplay = dayNumber.toString().replace(/^0+/, "");
  }

  var suffix = "th";

  if (dayNumber === 1 || dayNumber === 21 || dayNumber === 31) {
    suffix = "st";
  } else if (dayNumber === 2 || dayNumber === 22) {
    suffix = "nd";
  } else if (dayNumber === 3 || dayNumber === 23) {
    suffix = "rd";
  } else if (dayNumber >= 11 && dayNumber <= 13) {
    suffix = "th";
  }

  birthDayDisplay += suffix;

  $("#fun [data-birth-day]")
    .attr("data-day-num", birthDay)
    .text(birthDayDisplay);
}

function daysLeftFunc() {
  const birthdayText = $("#fun [data-birthday]").text();
  const birthdayParts = birthdayText.split(" ");

  const monthName = birthdayParts[0];
  const day = parseInt(birthdayParts[1].replace(/th|rd|nd|st/, ""));

  let birthDate = new Date(
    new Date().getFullYear(),
    getMonthIndex(monthName),
    day
  );
  let today = new Date();

  if (birthDate < today) {
    birthDate.setFullYear(birthDate.getFullYear() + 1);
  }

  const timeDiff = birthDate.getTime() - today.getTime();
  daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

  $dataTillBday.text(daysLeft);

  function getMonthIndex(monthName) {
    return months.indexOf(monthName);
  }
}

var month = months[currentDate.getMonth()];
var day = currentDate.getDate();
var year = currentDate.getFullYear();
var formattedDate = month + " " + (day < 10 ? "0" : "") + day + ", " + year;
$("[data-current-date]").text(formattedDate);

var nickname = "Friend";
var newBackdropPos;

function menuModalOpen($this) {
  var ifDeactivateTime;
  var pressTimerTime = 1000;
  var ifMenuOpenAlready = 0;

  var dateCreated = currentDate;

  pressTimer = setTimeout(function () {
    if ($this.hasClass("selected-menu")) {
      menuModalClose();
    } else {
      $this.addClass("selected-menu").siblings().removeClass("selected-menu");

      if ($this.hasClass("song")) {
      }

      if ($this.hasClass("image")) {
        $(".mm-menu .share-btn, .mm-menu .playlist-btn").hide();
      } else {
        $(".mm-menu .share-btn, .mm-menu .playlist-btn").show();
      }

      setTimeout(function () {
        if ($menu.height() > 0) {
          ifMenuOpenAlready = 600;
          $(".mm-menu .menu").outerHeight(0).removeClass("go");
        }

        setTimeout(function () {
          $(".mm-menu .menu")
            .outerHeight($(".mm-menu .menu").children().outerHeight())
            .addClass("go");
        }, ifMenuOpenAlready);
      }, ifDeactivateTime);

      $menuButtons
        .each(function () {
          const $this = $(this);
          const $text = $this.find("span");

          if ($this.hasClass("like-btn")) {
            $text.html(
              selectedItemMenu.find(".fave-hrt").length
                ? '<i class="fa-solid fa-heart-crack"></i>'
                : '<i class="fa-solid fa-heart"></i>'
            );
          }
        })
        .click(function () {
          const $this = $(this);
          const $text = $this.find("span");

          if ($this.hasClass("like-btn")) {
            $text.html(
              $text.html() === "Like"
                ? '<i class="fa-solid fa-heart-crack"></i>'
                : '<i class="fa-solid fa-heart"></i>'
            );
          }
        });
    }
  }, pressTimerTime);
}

function menuModalClose() {
  $menu.outerHeight(0).removeClass("go");
  $(".selected-menu").removeClass("selected-menu");
}

function openNotification() {
  clearTimeout(notificationTimeout);
  $notificationIcon.html($notificationIconBody);
  $notificationBody.html($notificationBodyText);
  $notificationCloseBtnSpan.text($notificationCloseBtnText);
  $notificationMoreOptions.html($notificationButtons);
  var ifDeactivateTime;

  if (!setNotificationOptions) {
      isClickable = true;
    $notificationOptions.hide();

    if ($navBar.hasClass("deactivate")) {
      ifDeactivateTime = 600;
      $navBar.removeClass("deactivate");
    } else {
      ifDeactivateTime = 0;
    }

    setTimeout(function () {
      $notification
        .height($notificationBodyContain.innerHeight())
        .addClass("go");

      notificationTimeout = setTimeout(function () {
        closeNotification();
      }, notificationTimer);
    }, ifDeactivateTime);
  } else {
    $notification
      .height(
        $notificationBodyContain.innerHeight() +
          $notificationOptions.innerHeight()
      )
      .addClass("go");
      isClickable = false;
  }
  
  $(".mm-menu .notification .section.body").scrollTop(0);
}

function closeNotification() {
    isClickable = true;
    $notificationStatus === false;
	
  $notification.removeClass("go").height(0);
  setNotificationOptions = true;

  if (setNotificationOptions) {
    $notificationOptions.show();
  }

  if ($("#flickSite").hasClass("no-form")) {
    $("#flickSite").removeClass("no-form");
  }
}

// EVERYTHING LOADED --------------------------

const logoHomeSrc =
  "https://static.tumblr.com/9leohrr/VS4srlih8/treesh-icon-black-background.png";
const logoMusic = logoHomeSrc;
var logoSrc = logoHomeSrc;
var newLogoSrc;
function changeLogo() {
  if ($music.hasClass("go")) {
    logoSrc = logoMusic;
    $waveLogo.addClass("music_logo");
  } else {
    logoSrc = logoHomeSrc;
    $waveLogo.removeClass("music_logo");
  }
  $waveLogo.attr("src", logoSrc);

  newLogoSrc = logoSrc;
  if (newLogoSrc !== logoSrc) {
    $wave.addClass("music_ani");
  }

  setTimeout(function () {
    $waveLogo.attr("src", logoSrc);
    $wave.removeClass("music-ani").removeClass("off-screen");
  }, 300);
}

changeLogo();

// Welcome Info Flick

const $welcomeInfo = $("#welcomeInfo .contain").flickity({
  cellSelector: ".main_section",
  cellAlign: "center",
  prevNextButtons: false,
  pageDots: false,
  groupCells: false,
  wrapAround: false,
  draggable: false,
  adaptiveHeight: true
});

const $welcomeIntro = $("#intro .item_flick").flickity({
  cellSelector: ".item_flick_item",
  cellAlign: "center",
  prevNextButtons: false,
  pageDots: false,
  groupCells: false,
  wrapAround: false,
  draggable: true,
  adaptiveHeight: true
});

const $getStarted = $("#get_started .get_started-flick").flickity({
  cellSelector: "#get_started .get_started-flick .item",
  cellAlign: "center",
  prevNextButtons: false,
  pageDots: false,
  groupCells: true,
  wrapAround: false,
  draggable: false
});

$("#intro .bottom_options .options button").click(function () {
  const backdropPicker = $("#get_started #backdrop_picker");
  const backdropContainer = $(
    ".mm-menu .backdrops_container[data-category='Colorful']"
  );

  $("#get_started #color_picker")
    .empty()
    .append(
      $(".mm-menu .colors_container")
        .children()
        .clone()
        .css({ height: "30vw", width: "30vw" })
    );

  $("#get_started #color_picker color-item").each(function () {
    var bgColor = $(this).css("background-color");

    if (bgColor) {
      var boxShadowValue =
        "0 0 5px " +
        bgColor +
        ", 0 0 10px " +
        bgColor +
        ", 0 0 15px " +
        bgColor +
        ", 0 0 20px " +
        bgColor +
        ", 0 0 25px " +
        bgColor +
        ", 0 0 30px " +
        bgColor;
      $(this).css("box-shadow", boxShadowValue);
    }
  });

  backdropPicker.empty().append(backdropContainer.children().clone());

  $("#get_started .backdrop_item").removeAttr("data-color");
  
  $("#get_started .backdrop_item").each(function() {
     $(this).css("background-image", "url("+ $(this).attr("data-src") +")"); 
  });

  $("#intro").addClass("go_away");
  setTimeout(() => $("#get_started").addClass("go"), 600);
});

$("#get_started .item_nav").on("click", ".next-btn", function () {
  if (!$(this).hasClass("inactive")) {
    $getStarted.flickity("next");
  }
});

$("#get_started .item_nav").on("click", ".prev-btn", function () {
  $getStarted.flickity("previous");
});

$("#get_started .item_nav").on("click", ".cancel-btn", function () {
  $("#get_started").removeClass("go");
  $("#intro").removeClass("go_away");
});

$("#get_started .item_nav").on("click", ".recheck-btn", function () {
  $getStarted.flickity("select", 0);
});

$("#get_started input").on("input keyup keydown", function (e) {
  if ($(this).val() !== "" && $(this).val().trim() !== "") {
    $(this)
      .parents(".item")
      .find(".item_nav .next-btn")
      .removeClass("inactive");

    if (e.key === "Enter" || e.keyCode === 13) {
      $("#get_started .next-btn:not(.inactive)").click();
    }
  } else {
    $(this).parents(".item").find(".item_nav .next-btn").addClass("inactive");
  }
});

$("#get_started input[type='date']").on("input keyup keydown", function (e) {
  wholeBday = $(this).val();
  let dateParts = wholeBday ? wholeBday.split("-") : [];

  if (dateParts.length === 3) {
    birthYear = dateParts[0];
    birthMonth = dateParts[1];
    birthDay = dateParts[2];
    var birthMonthZ = parseInt(birthMonth, 10) - 1;
    var birthDayZ = parseInt(birthDay, 10);

    function getMonthName(monthNumber) {
      const monthIndex = monthNumber - 1;

      if (monthIndex >= 0 && monthIndex < months.length) {
        return months[monthIndex];
      } else {
        return undefined;
      }
    }

    birthMonthName = getMonthName(birthMonth);

    var zodiacSigns = [
      {
        sign: "Capricorn",
        startMonth: 0,
        startDay: 1,
        endMonth: 0,
        endDay: 19
      }, // Jan 1-19
      {
        sign: "Aquarius",
        startMonth: 0,
        startDay: 20,
        endMonth: 1,
        endDay: 18
      }, // Jan 20-Feb 18
      { sign: "Pisces", startMonth: 1, startDay: 19, endMonth: 2, endDay: 20 }, // Feb 19-Mar 20
      { sign: "Aries", startMonth: 2, startDay: 21, endMonth: 3, endDay: 19 }, // Mar 21-Apr 19
      { sign: "Taurus", startMonth: 3, startDay: 20, endMonth: 4, endDay: 20 }, // Apr 20-May 20
      { sign: "Gemini", startMonth: 4, startDay: 21, endMonth: 5, endDay: 20 }, // May 21-Jun 20
      { sign: "Cancer", startMonth: 5, startDay: 21, endMonth: 6, endDay: 22 }, // Jun 21-Jul 22
      { sign: "Leo", startMonth: 6, startDay: 23, endMonth: 7, endDay: 22 }, // Jul 23-Aug 22
      { sign: "Virgo", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 }, // Aug 23-Sep 22
      { sign: "Libra", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 }, // Sep 23-Oct 22
      {
        sign: "Scorpio",
        startMonth: 9,
        startDay: 23,
        endMonth: 10,
        endDay: 21
      }, // Oct 23-Nov 21
      {
        sign: "Sagittarius",
        startMonth: 10,
        startDay: 22,
        endMonth: 11,
        endDay: 21
      }, // Nov 22-Dec 21
      {
        sign: "Capricorn",
        startMonth: 11,
        startDay: 22,
        endMonth: 11,
        endDay: 31
      }
    ];

    let zodiacSign = "";
    for (let i = 0; i < zodiacSigns.length; i++) {
      const sign = zodiacSigns[i];
      if (
        (birthMonthZ === sign.startMonth && birthDayZ >= sign.startDay) ||
        (birthMonthZ === sign.endMonth && birthDayZ <= sign.endDay) ||
        (sign.startMonth > sign.endMonth &&
          birthMonthZ === sign.startMonth &&
          birthDayZ >= sign.startDay) ||
        (birthMonthZ === sign.endMonth && birthDayZ <= sign.endDay) ||
        (sign.startMonth > sign.endMonth &&
          (birthMonthZ === sign.startMonth || birthMonthZ === sign.endMonth))
      ) {
        zodiacSign = sign.sign;
        break;
      }
    }

    zodiac = zodiacSign;

    const zodiacTextMap = {
      Capricorn:
        "<span data-zodiac>Capicorn</span>... Nice to start off the new year!",
      Aquarius: "Well, look at you, fellow <span data-zodiac>Aquarius</span>!",
      Aries:
        "Competitive and passionate signs, you <span data-zodiac>Aries</span>!",
      Cancer:
        "It's time to get lit all <span data-zodiac>Cancer</span> season!",
      Sagittarius:
        "Care to have some enlightened fun, <span data-zodiac>Sagittarius</span>?",
      Scorpio:
        "One thing about them <span data-zodiac>Scorpio</span>s, they sure are brave!",
      Libra: "Bow down to the royal <span data-zodiac>Libra</span>!",
      Gemini:
        "Heart made of fire but the love burns with <span data-zodiac>Gemini</span>!",
      Pisces: "The <span data-zodiac>Pisces</span>... so gentle and artsy!",
      Leo:
        "The confidence of a <span data-zodiac>Leo</span> makes them natural leaders!",
      Taurus:
        "Patiently waiting to party with a <span data-zodiac>Taurus</span>!"
    };

    let theZodiacText = zodiacTextMap[zodiac] || "";

    $("#get_started .zodiac_text").html(theZodiacText).show();
  } else {
    $("#get_started .zodiac_text").hide();
  }
});

$("#get_started .item_nav").on("click", ".confirm-btn", function () {
  nickname = $("#get_started .nickname_text").text();
  localStorage.setItem("nickname", nickname);
  $dataNickname.add("#wave .nickname").text(nickname);
  $funNickname.attr("placeholder", nickname).val("");
  
  $('<button type="button" id="delete_data-btn" value="Delete Profile" class="hide" data-for="Profile">Delete Profile</button>').insertAfter("#fun .site_settings #edit_profile-btn");

  $("#fun .avaitar").each(function() {
    for (var key in savedAttributes) {
        $(this).attr(key, savedAttributes[key]);
    }
});

  $("#fun .contain .account, #fun, #flickSite").removeClass("noScroll");
  
  $("#delete_data-btn, [data-for='Profile']").show();

  localStorage.setItem("month", birthMonth);
  localStorage.setItem("day", birthDay);
  localStorage.setItem("monthName", birthMonthName);
  localStorage.setItem("wholeBday", wholeBday);
  $("#fun [data-birth-month]")
    .attr("data-month-num", birthMonth)
    .text(birthMonthName);
  $("#fun [data-birth-year]")
    .attr("data-year-num", birthYear)
    .text(birthYear)
    .hide();
  $("#fun [data-birthday]").attr("data-birthday", wholeBday);
  $("#fun [data-zodiac]").text(zodiac);
  localStorage.setItem("zodiac", zodiac);

  birthDayTransform();
  daysLeftFunc();

  $("#intro").addClass("confirm");
  $("#get_started").removeClass("go");

  setTimeout(function () {
    $("#intro .cancel_intro-btn").click();

    setTimeout(function () {
      $("#get_started").remove();

      setTimeout(function () {
        $("#intro").remove();
      }, 600);
    }, 300);
  }, 600);

  let currentDate = new Date();
  localStorage.setItem(
    "dateCreated",
    months[currentDate.getMonth()] +
      " " +
      currentDate.getDate() +
      ", " +
      currentDate.getFullYear()
  );

  $("#fun [data-join-date]").text(
    months[currentDate.getMonth()] +
      " " +
      currentDate.getDate() +
      ", " +
      currentDate.getFullYear()
  );
});


$("#get_started").on("click", "color-item", function () {
  $("#get_started .color_text").text($(this).attr("data-name"));
  $(this).css("opacity", "1").siblings().css("opacity", "0.5");
  $(this).parents(".item").find(".item_nav button").removeClass("inactive");

  $(":root")[0].style.setProperty("--pink", $(this).css("background-color"));
  localStorage.setItem("favColor", $(this).css("background-color"));
});

$("#get_started").on("click", ".backdrop_item", function () {
    $(this).addClass("clicked").siblings().removeClass("clicked");
  $(this).css("opacity", "1").siblings().css("opacity", "0.5");
  $(this).parents(".item").find(".item_nav button").removeClass("inactive");
});

$(document).on("click", "#get_started #avaitar_picker .avaitar img", function () {
    var img = $(this);
var attributes = {};

$.each(img[0].attributes, function() {
    attributes[this.name] = this.value;
});

localStorage.setItem("theSavedAttributes", JSON.stringify(attributes));
savedAttributes = JSON.parse(localStorage.getItem("theSavedAttributes"));

    $(this).removeClass("fade").parent().siblings().find("img").addClass("fade");
  $(this).parents(".item").find(".item_nav button").removeClass("inactive");
});

$("#get_started .item_nav .next-btn").addClass("inactive");

$getStarted.on("change.flickity", function (event, index) {
  var birthdayValue = $("#get_started #birthday").val();

  if (birthdayValue) {
    var date = new Date(birthdayValue);
    var formattedBirthday =
      (date.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      date.getDate().toString().padStart(2, "0") +
      "-" +
      date.getFullYear();
    $("#get_started .birthday_text").text(formattedBirthday);
  } else {
    $("#get_started .birthday_text").text(
      "Please go back and set your birthday"
    );
  }

  if (
    $("#get_started #nickname").val() === "" ||
    $("#get_started #nickname").val() === " "
  ) {
    $("#get_started .nickname_text").text("Friend");
  } else {
    $("#get_started .nickname_text").text($("#get_started #nickname").val());
  }
});

// Isotope initialization
const $flickSite = $("#flickSite").flickity({
  cellSelector: ".site_page",
  cellAlign: "center",
  prevNextButtons: false,
  pageDots: false,
  groupCells: false,
  wrapAround: false,
  freeScroll: false,
  draggable: true,
  adaptiveHeight: false,
  dragThreshold: 100,
  friction: 1,
  selectedAttraction: 0.3
});

$flickSite.flickity("selectCell", 1);

$("#music .artists .contain, #music .featured_videos .featured_videos_contain, #music .genres .contain, #fun .fun_music-content, #icons .socials").on("mouseenter touchstart", function () {
    $flickSite.flickity("unbindDrag");
}).on("mouseleave touchend", function () {
    $flickSite.flickity("bindDrag");
});

$flickSite.on("change.flickity", function (event, index) {
  let selectedIndex = $(this).find(".is-selected").index();
  
  menuModalClose();
  
  if ( $("#widgets .widgets_options").hasClass("opened") ) {
      $("#widgets .open_widgets_options-btn").click();
  }
  
  if ( $("#fun #widgets .resize_widgets-btn").text() === "Cancel Resize" ) {
      $("#fun #widgets .resize_widgets-btn").click();
  }
  
  $(".mm-menu .mm-item").removeClass("clicked").eq(selectedIndex).addClass("clicked");
  
  if ( $("#music").hasClass("is-selected") ) {
      $(".mm-menu .open_music_controls-btn").addClass("go");
  } else {
      $(".mm-menu .open_music_controls-btn").removeClass("go").removeClass("opened");
  }
  
  if ( $("#fun").hasClass("is-selected") ) {
      $("#welcomeInfo")
              .outerHeight($("#welcomeInfo").children().outerHeight())
              .addClass("go");
              
              $(".pfp_backdrop.image-upload").removeClass("go-modal");
              $("#flickSite").removeClass("go-modal");
  } else {
      
      if ( $("#flickSite").hasClass("go-settings") ) {
      $cancelSettingsBtn.click();
      }
      
      $("#welcomeInfo")
              .outerHeight(0)
              .removeClass("go");
              
              $(".pfp_backdrop.image-upload").addClass("go-modal");
  }
  
  $travelBtn.find("i").removeClass().addClass($(".mm-menu .mm-item.clicked").find("i").attr("class"));
  $travelBtn.find(".audio_ani").addClass("go");
      $travelBtn.find("i").addClass("fadeOut");
});

$flickSite.on("settle.flickity", function (event, index) {
  $(".mm-menu .page_title .title span").text($(this).find(".is-selected").attr("data-title"));
});



const $grid = $musicGrid.isotope({
  itemSelector: "ul",
  gutter: 0,
  percentPosition: true
});

const $artistTracksGrid = $("#about_artist .trackss").isotope({
  itemSelector: ".song",
  gutter: 0,
  percentPosition: true
});

// Flickity initialization for menu
let $menuFlick = $navBarMenuInfo.flickity({
  cellSelector: ".section",
  pageDots: false,
  groupCells: true,
  wrapAround: true,
  dragThreshold: 10,
  draggable: false,
  contain: true,
  prevNextButtons: false
});

// Theme Flickity

// Flickity initialization for now playing

const $nowPlayingFlick = $nowPlaying.find("#flick-now_playing").flickity({
  pageDots: false,
  prevNextButtons: false,
  dragThreshold: 100,
  contain: true,
  wrapAround: true,
  groupCells: true,
  autoPlay: false
});

// Flickity initialization for Music What's New

const $musicWhatsNewFlick = $("#music .whats_new .whats_new_flick").flickity({
  cellSelector: ".item",
  pageDots: true,
  prevNextButtons: false,
  dragThreshold: 100,
  contain: true,
  wrapAround: true,
  groupCells: false,
  autoPlay: false
});

$musicWhatsNewFlick.on("mouseenter touchstart", function () {
    $flickSite.flickity("unbindDrag");
}).on("mouseleave touchend", function () {
    $flickSite.flickity("bindDrag");
});


var $funYouFlick = $("#fun #you");

dataPos();

$window.on("load", function () {
  changeLogo();

  // Remove Tumblr classes
  $("body").removeClass(
    "tmblr-iframe-compact tmblr-iframe-themed tmblr-iframe-overlay"
  );
  $("#ga_target").remove();
});

function loadSite() {
  var openThisModal = "#welcomeInfo";

  $(".radiate, #welcome").css("opacity", 1);

  $(".radiate.main").addClass("go");

  setTimeout(function () {
    $("#welcome").css("opacity", "0").css("transition-delay", "0s");
    $(".pfp_backdrop.image-upload")
      .css("opacity", 1)
      .css("transform", "scale(1)");
  }, 4000);

  setTimeout(function () {
      $("#flickSite").removeClass("unload");
    $navBar.add("#wave").removeClass("deactivate");

    if ($("#fun").hasClass("is-selected")) {
      setTimeout(function () {
        $(openThisModal)
          .outerHeight($(openThisModal).children().outerHeight())
          .addClass("go");
      }, 600);
    } else {
      $(".page_title span").text(
        $(".site_page.is-selected").attr("data-title")
      );

      if ($("#music").hasClass("is-selected")) {
        openThisModal = ".mm-menu #music_filters";
      }

      $(".mm-menu .home_nav")
        .find("[for='" + $(".site_page.is-selected").attr("for") + "']")
        .addClass("clicked")
        .siblings()
        .removeClass("clicked");

      setTimeout(function () {
        $(openThisModal)
          .outerHeight($(openThisModal).children().outerHeight())
          .addClass("go");

        if (
          $("#music").hasClass("go-about_artist") &&
          $("#music").hasClass("is-selected")
        ) {
          $(".mm-menu #music_filters").height(0).removeClass("go");
        }
      }, 600);
    }

    setTimeout(function () {
      $("#welcome").remove();
      
      if ( $("#widgets .widget").hasClass("go") ) {
         $("#widgets").addClass("go");
     } else {
         $("#widgets").removeClass("go");
     }
      
      
      if ( $notificationStatus === "fun" && !localStorage.getItem("learnedHub") && !$("#flickSite").hasClass("go-settings") && !localStorage.getItem("learnedTreesh") ) {
          $notificationIconBody = '<i class="fa-regular fa-face-laugh-squint"></i>';
      $notificationBodyText =
        "<h1>Welcome to Treesh!</h1><p>Discover new up-and-coming artists passionate in the art of <b>Music</b>. Watch them as they grow and become the next big <b>Icons</b>!</p>";
        setNotificationOptions = true;
        if ( localStorage.getItem("dateCreated") ) {
    $notificationCloseBtnText = "Next";
        } else {
            $notificationCloseBtnText = "Duly noted";
        }
      openNotification();
      }
      
      setTimeout(function() {
            $("#fun .chevron_container").fadeIn(600);
        }, 6000);
      
    }, 1000);
  }, 4200);
}

if (localStorage.getItem("dateCreated")) {
  $("#intro, #get_started").remove();
  $("#flickSite").removeClass("noScroll");
} else {
  $("#delete_data-btn, [data-for='Profile']").hide();
}

$(document).ready(function () {
  var today = new Date();
    var month = today.getMonth();
    var day = today.getDate();
    var year = today.getFullYear();

    var greetings = {
        newYears: [
            "Happy Holidays", "Happy New Year", "Merry New Year", "Happy 2026", "Merry 2026", 
            "Cheers to 2026", "It's New Years", "It's 2026", "2026 your year", "Welcome to 2026"
        ],
        valentines: [
            "Happy Valentine's", "Be my Valentine", "I <3 U", "My heart smiles", "I love you", 
            "You're everything", "Heart's yours", "Forever my Valentine", "Love you more", 
            "Heart beats for you", "Endless love", "Every day love", "You're sweet", "Be mine", 
            "Treat yourself"
        ],
        halloween: [
            "Happy Halloween", "It's Spooky Season", "Mwahahaha", "Trick or treat", 
            "Share some candy", "Nice costume"
        ],
        memorialDay: [
        "Remember and Honor", "Saluting the brave", "Memorial Day Remembrance", "Honoring heroes", "Never forget"
    ],
    mothersDay: [
        "Happy Mother's Day", "Celebrating Mom", "You're the best, Mom", "Thanks, Mom", "Love you, Mom"
    ],
    juneteenth: [
        "Happy Juneteenth", "Celebrate Freedom", "Emancipation Day", "Let Freedom Ring", "Honoring the past", "It's Juneteenth", "Celebrate Blackness", "Freedom, Freedom", "Thank you", "Unapologetically Black", "We wear Black"
    ],
    laborDay: [
        "Happy Labor Day", "Cheers to the Workers", "Relax and Enjoy", "Thanks for all you do", "Celebrate Work and Rest"
    ],
    thanksgiving: [
        "Happy Thanksgiving", "Give Thanks", "Grateful Hearts", "A Day to Give Thanks", "Wishing you a Happy Thanksgiving"
    ],
    christmas: [
        "Merry Christmas", "Happy Holidays", "Season's Greetings", "Have a Joyous Christmas", "Warm Wishes for Christmas"
    ],
    default: [
        "Welcome back", "Bonjour", "Glad you're back", "You're back", "Hello", "Hi", "Hey", 
        "Sup", "Hola", "Welcome", "Greetings", "Salutations", "Party hard", "Dance away", 
        "Lookin' good"
    ]
    };

    var specialGreeting;

    if (month === 0 && day >= 30 && day <= 5) {  // New Year's (December 30 - January 5)
    specialGreeting = greetings.newYears[Math.floor(Math.random() * greetings.newYears.length)];
} else if (month === 1 && day >= 10 && day <= 15) {  // Valentine's Day (February 10 - 20)
    specialGreeting = greetings.valentines[Math.floor(Math.random() * greetings.valentines.length)];
} else if (month === 4 && day >= 25 && day <= 31) {  // Memorial Day (Last Monday of May)
    specialGreeting = greetings.memorialDay[Math.floor(Math.random() * greetings.memorialDay.length)];
} else if (month === 5 && day >= 14 && day <= 20) {  // Juneteenth (June 14 - 20)
    specialGreeting = greetings.juneteenth[Math.floor(Math.random() * greetings.juneteenth.length)];
} else if (month === 6 && day >= 1 && day <= 7) {  // Mother's Day (First Sunday of May)
    specialGreeting = greetings.mothersDay[Math.floor(Math.random() * greetings.mothersDay.length)];
} else if (month === 8 && day >= 1 && day <= 7) {  // Labor Day (First Monday in September)
    specialGreeting = greetings.laborDay[Math.floor(Math.random() * greetings.laborDay.length)];
} else if (month === 9 && day >= 20 && day <= 31) {  // Halloween (October 20 - 31)
    specialGreeting = greetings.halloween[Math.floor(Math.random() * greetings.halloween.length)];
} else if (month === 10 && day >= 23 && day <= 31) {  // Thanksgiving (Last Thursday of November)
    specialGreeting = greetings.thanksgiving[Math.floor(Math.random() * greetings.thanksgiving.length)];
} else if (month === 11 && day >= 20 && day <= 27) {  // Christmas (December 20 - 27)
    specialGreeting = greetings.christmas[Math.floor(Math.random() * greetings.christmas.length)];
} else {
    specialGreeting = greetings.default[Math.floor(Math.random() * greetings.default.length)];
}



    $("#welcome h2 small").text(specialGreeting + ",");
    

  if (localStorage.getItem("dateCreated")) {
    $("#intro, #get_started").remove();

    birthDay = localStorage.getItem("day");
    birthMonth = localStorage.getItem("month");
    birthYear = localStorage.getItem("year");
    wholeBday = localStorage.getItem("wholeBday");
    monthName = localStorage.getItem("monthName");
    zodiac = localStorage.getItem("zodiac");
    const dateCreated = localStorage.getItem("dateCreated");
    savedAttributes = JSON.parse(localStorage.getItem("theSavedAttributes"));

$("#fun .avaitar").each(function() {
    // Remove all attributes
    var element = $(this);
    $.each(this.attributes, function() {
        element.removeAttr(this.name);
    });

    // Add the saved attributes
    for (var key in savedAttributes) {
        element.attr(key, savedAttributes[key]);
    }
});

    nickname = localStorage.getItem("nickname");
    $dataNickname.add("#wave .nickname").text(nickname);
    $funNickname.val("").attr("placeholder", nickname);

    $fun.find("[data-join-date]").text(dateCreated);

    $fun
      .find("[data-birth-month]")
      .attr("data-month-num", birthMonth)
      .text(monthName);

    birthDayTransform();

    $fun
      .find("[data-birth-year]")
      .attr("data-year-num", birthYear)
      .text(birthYear)
      .hide();

    $dataZodiac.text(zodiac);

    daysLeftFunc();

    loadSite();
    
    if ($("#fun .avaitar").attr("src") === null || $("#fun .avaitar").attr("src") === "undefined" || $("#fun .avaitar").attr("src") === "https://treesh.life/nothing.png") {
    $("#fun .avaitar").attr("src", defaultAvAItar);
}
  } else {
    $("#intro").addClass("go");
  }

  $("#intro .ani").each(function (i) {
    var $this = $(this);
    var transitionDelay = 1;

    $this.css("transition-delay", (transitionDelay + "." + i) / 1.2 + "s");
  });

  $(".cancel_intro-btn").click(function () {
    $("#intro .ani").css("transition-delay", "0s");
    $("#intro").css("opacity", 0).removeClass("go");

    setTimeout(function () {
      $("#intro").remove();
    }, 3000);

    setTimeout(function () {
      loadSite();
    }, 1000);
  });

  $(".remove").remove();

  $("img").on("contextmenu", function (e) {
    return false;
  });

  // Check if user's visited before

  // Check if favorite color is in local storage and set CSS variable
  if (localStorage.getItem("favColor")) {
    $(":root")[0].style.setProperty("--pink", localStorage.getItem("favColor"));

    if (localStorage.getItem("newColor")) {
      $(".mm-menu .colors .colors_container").html(
        localStorage.getItem("newColor")
      );
    }

    $(".mm-menu .colors color-item").each(function () {
      if (
        rgbToHex($(this).css("background-color")) ===
        localStorage.getItem("favColor")
      ) {
        $(this).addClass("clicked").siblings().removeClass("clicked");

        if (!$(this).hasClass("permanent")) {
          $("#fun .main_color button").removeClass("inactive");
          $("#fun .main_color [data-action='save color']")
            .attr("data-action", "delete color")
            .html('<i class="fa-solid fa-minus"></i> Delete Color');
        }
      }

      if (
        $(this).css("background-color") === "rgb(224, 41, 107)" &&
        !$(".mm-menu .colors color-item.clicked").length
      ) {
        $(this).addClass("clicked");
      }
    });
  }

  // Set profile picture if pfp is in local storage
  if (localStorage.getItem("pfp")) {
    $funPFPImg.attr("src", localStorage.getItem("pfp"));
    $("#fun .settings .pfp").attr("src", localStorage.getItem("pfp"));

    setTimeout(function () {
      if (parseInt($funPFPImg.outerHeight()) >= 201) {
        $funPFPImg.addClass("border_size-small");
        $("#fun .settings .pfp").addClass("border_size-small");
      } else {
        $funPFPImg.removeClass("border_size-small");
        $("#fun .settings .pfp").removeClass("border_size-small");
      }

      pfpBackdropHeight();
    }, 200);
  }

  if (localStorage.getItem("pfpBackdrop")) {
    $(".pfp_backdrop").css({
      "background-image": "url(" + localStorage.getItem("pfpBackdrop") + ")"
    });

    $(".mm-menu .backdrop_filters .filter_item").css(
      "background-image",
      "url('" + localStorage.getItem("pfpBackdrop") + "')"
    );

    $('.backdrops [data-category="Uploads"]').show();

    let storedImages = JSON.parse(localStorage.getItem("uploadedImages")) || [];

    if (storedImages.length > 0) {
      storedImages.forEach((imageUrls) => {
        $('.backdrops .backdrops_container[data-category="Uploads"]').prepend(
          '<div class="backdrop_item custom_item" data-src="' +
            imageUrls +
            '" style="background-image:url(' +
            imageUrls +
            '); background-size:cover; background-position:center;"></div>'
        );
      });
    }
  } else {
    $('.backdrops [data-category="Uploads"]').hide();
  }

  if (localStorage.getItem("backdrop") === "false") {
    $(".pfp_backdrop").addClass("solid");

    $(".mm-menu .solid_backdrop-btn").html('<i class="fa-solid fa-image">');
    $(
      ".mm-menu .reposition_backdrop-btn, .mm-menu .backdrop_filters-btn"
    ).hide();
  } else {
    $(".pfp_backdrop").removeClass("solid");

    if (localStorage.getItem("backdropFilter")) {
      if ( localStorage.getItem("backdropFilter") === "colorize" ) {
        $("#flickSite, .pfp_backdrop").addClass("colorize");
    } else {
        $("#flickSite, .pfp_backdrop").removeClass("colorize");
    $(".pfp_backdrop").addClass(localStorage.getItem("backdropFilter"));
    }
    
    }
  }

  if (localStorage.getItem("hidePFP") === "true") {
    $("#fun .account .pfp").addClass("invisible");
  } else {
    $("#fun .account .pfp").removeClass("invisible");
  }

  if (localStorage.getItem("coverBackdrop") === "false") {
    $(".pfp_backdrop").css("background-size", "auto");
  } else {
    $(".pfp_backdrop").css("background-size", "cover");
  }

  if (localStorage.getItem("saveBackdropPos")) {
    $(".pfp_backdrop").css(
      "background-position",
      localStorage.getItem("saveBackdropPos")
    );
  }

  $(".mm-menu .backdrops .backdrop_category")
    .each(function (index, element) {
      var $this = $(this);
      var catName = $this.attr("data-name");
      var catTag = $this.attr("data-category");

      if ($this.attr("data-category") !== undefined) {
        $(
          '<button type="button" class="reg_button" data-category="' +
            catTag +
            '">' +
            catTag +
            "</button>"
        ).appendTo(".backdrops .backdrops_menu");
      }

      $(
        '<button type="button" data-action="open backdrops menu">View More <i class="fa-solid fa-caret-right"></i></button>'
      ).appendTo($this);
    })
    .promise()
    .done(function () {
      $(".mm-menu .backdrops .backdrops_menu button.reg_button:first").addClass(
        "clicked"
      );
    });

  $(".backdrops .backdrop_category").click(function () {
    $(".backdrops").toggleClass("go-menu");
  });

  $(document).on(
    "click",
    ".mm-menu .backdrops .backdrops_menu button.reg_button",
    function () {
      var $this = $(this);
      var catTag = $this.attr("data-category");
      var $findCat = $(
        ".mm-menu .backdrops .backdrop_category[data-category='" + catTag + "']"
      );
      var $scrollContainer = $(".mm-menu .backdrops .contain .contain");

      $this.addClass("clicked").siblings().removeClass("clicked");

      if (catTag === "all") {
        $(".backdrops .contain .contain [data-category]").show();
      } else {
        if ($findCat.length) {
          $(".backdrops .contain .contain [data-category]").each(function () {
            if ($(this).attr("data-category") === catTag) {
              $(this).show();
            } else {
              $(this).hide();
            }
          });
        }
      }

      $(".backdrops .contain .contain").scrollLeft(0);
    }
  );

  const initialBDContainScrollLeft = $(
    ".backdrops .contain .contain"
  ).scrollLeft();
  const scrollBDContainThreshold = 200;

  $(".backdrops .contain .contain").on("scroll", function () {
    const currentScrollLeft = $(this).scrollLeft();
    const scrollDelta = Math.abs(
      currentScrollLeft - initialBDContainScrollLeft
    );

    if (
      scrollDelta > scrollBDContainThreshold &&
      $(".backdrops").hasClass("go-menu")
    ) {
      $(".backdrops").removeClass("go-menu");
      $(".mm-menu .backdrops_menu").scrollTop(0);
    }
  });

  $(".mm-menu .backdrops .backdrop_item, #get_started .backdrop_item").each(
    function () {
      var $this = $(this);
      var backdropBG = $this.attr("data-src");
      var backdropSMBG = "https://res.cloudinary.com/treesh/image/fetch/w_200/" + backdropBG;

      $this.css({
        "background-image": "url('" + backdropSMBG + "')",
        "background-size": "cover",
        "background-position": "center",
        "background-repeat": "no-repeat"
      }).attr("data-sm", backdropSMBG);
    });

  setTimeout(function () {
    var backgroundImageUrl = $(".pfp_backdrop.image-upload").css(
      "background-image"
    );
    if (backgroundImageUrl && backgroundImageUrl.indexOf("url(") >= 0) {
      backgroundImageUrl = backgroundImageUrl
        .replace("url(", "")
        .replace(")", "")
        .replace(/"/g, "");
    }

    $(".mm-menu .backdrop_filters .filter_item").css({
      "background-image": "url('" + backgroundImageUrl + "')",
      "background-size": "cover",
      "background-position": "center",
      "background-repeat": "no-repeat"
    });
  }, 1000);

  // Set points

  var clickedPings = localStorage.getItem("clickedPingspp");
  if (clickedPings) {
    clickedPings = JSON.parse(clickedPings);
    clickedPings.forEach(function (index) {
      $(".mm-menu .mm-item").eq(index).removeClass("ping");
    });
  }

  // MUSIC

  if (localStorage.getItem("musicView") == "list") {
    $musicGridSongs.addClass("list_view");
    $grid.isotope("layout");
    $(".mm-menu .list_view-btn i")
      .removeClass()
      .addClass("fa-solid fa-border-all");
  } else {
    $musicGridSongs.removeClass("list_view");

    $tracksItems.each(function () {
      var $this = $(this);
      $this.find(".coverart").height($this.find(".coverart").width());
    });

    $grid.isotope("layout");
    $(".mm-menu .list_view-btn i").removeClass().addClass("fa-solid fa-list");
  }

  // Set favorite artists and remove duplicates
  if (localStorage.getItem("favArtist")) {
    $dataFavoriteArtist.html(localStorage.getItem("favArtist"));
    const seenValues = {};

    $dataFavoriteArtist.find("[data-artist]").each(function () {
      const $this = $(this);
      const value = $this.attr("data-artist");
      const theName = $this.text();

      if (seenValues[value] || seenValues[theName]) {
        $this.remove();
      } else {
        seenValues[value] = true;
        seenValues[theName] = true;
      }
    });
  }

  // Set favorite songs and remove duplicates
  if (localStorage.getItem("favSong")) {
    $dataFavoriteSong.html(localStorage.getItem("favSong"));
    
    const seenValues = {};

    $dataFavoriteSong.find("[data-song]").each(function () {
      const $this = $(this);
      const value = $this.attr("data-song");
      const theName = $this.text();

      if (seenValues[value] || seenValues[theName]) {
        $this.remove();
      } else {
        seenValues[value] = true;
        seenValues[theName] = true;
      }
    });
  }

  // Set deleted songs and remove duplicates
  if (localStorage.getItem("deletedSong")) {
    $dataDeletedSong.html(localStorage.getItem("deletedSong"));
    const seenValues = {};

    $dataDeletedSong.find("[data-song]").each(function () {
      const $this = $(this);
      const value = $this.attr("data-song");
      const theName = $this.text();

      if (seenValues[value] || seenValues[theName]) {
        $this.remove();
      } else {
        seenValues[value] = true;
        seenValues[theName] = true;
      }
    });
  }

  // MISC

  if (localStorage.getItem("faveHrtPicked")) {
    $funFaveHrtPickedSymbol = localStorage.getItem("faveHrtPicked");
    appendHrt =
      '<div class="fave-hrt"><x>' + $funFaveHrtPickedSymbol + "</x></div>";

    $("#fun .settings .emoji_preview span").text($funFaveHrtPickedSymbol);

    $funFaveHrtChoices
      .filter(":contains('" + $funFaveHrtPickedSymbol + "')")
      .addClass("picked")
      .siblings()
      .removeClass("picked");
    $funFaveHrtPickedSymbol = $funFaveHrtPicked;
  }

  function applyStylesToNewElements() {
    $("#fun [data-favorite-photo] img, #fun [data-deleted-photo] img").css({
      "border-radius": "5px",
      height: "auto"
    });
  }
  applyStylesToNewElements();

  // NOTIFICATION

  $notificationCloseBtn.click(function () {
    const $this = $(this);

    $lyricExplained.removeClass("hover");

    if ($notification.hasClass("go")) {
      closeNotification();
    } else {
      $this.parents(".modal").removeClass("go");
    }
    
    if ($this.text() == "Duly noted") {
        localStorage.setItem("learnedTreesh", true);
    }
    
    if ( $notificationStatus === "fun" && localStorage.getItem("dateCreated") && !$("#flickSite").hasClass("go-settings") ) {
        setTimeout(function() {
        $notificationIconBody = '<i class="fa fa-globe"></i>';
      $notificationBodyText =
        "<h1>Treesh Hub</h1><p>This is your starting home - <b>Treesh Hub</b>. Here, you can personalize your experience and change settings. Scroll down to view your <b>profile</b> and <b>activities</b>!</p>";
        setNotificationOptions = true;
    $notificationCloseBtnText = "Nice!";
    $notificationStatus = "complete";
      openNotification();
        }, 600);
    }
    
    if ( $this.text() === "Nice!" ) {
    localStorage.setItem("learnedHub", true);
    }

    if ($this.text() == "Explore") {
        localStorage.setItem("learnedMusic", true);
    }
    
    if ($this.text() == "View Icons") {
        localStorage.setItem("learnedIcons", true);
    }

    if ($this.text() == "Let me think") {
      $deleteDataBtn.text("Yes, Delete").removeClass("fade");
    }
    
    if ( $this.text() === "Next" && $notificationStatus === "nowPlaying" ) {
	    $nowPlayingFlick.flickity("selectCell", 0);
        $notificationStatus = "music";
            $notificationIconBody = '<i class="fa-regular fa-music"></i>';
      $notificationBodyText =
        "<h1>Swipe the Nav Bar</h1><p>While playing music, you can <b>Swipe Left</b> or <b>Right</b> on the <b>Nav Bar</b> to personalize your listening experience!</p>";
        setNotificationOptions = true;
    $notificationCloseBtnText = "Gotcha!";
      openNotification();
      
      setTimeout(function() {
          $menuFlick.flickity("next");
          $("#now_playing").addClass("tip");
      $(".mm-menu").removeClass("tip");
          
          setTimeout(function() {
             $menuFlick.flickity("next");
             
             setTimeout(function() {
                 $menuFlick.flickity("next");
             }, 600);
          }, 600);
      }, 1200);
    }
    
    if ( $this.text() === "Gotcha!" ) {
    localStorage.setItem("learnedNowPlaying", true);
    $("#now_playing").removeClass("tip");
    }
  });
    
    var deletingInProgress;
  $deleteDataBtn.click(function () {
    const $this = $(this);

    $notificationIconBody = '<i class="fa-solid fa-skull-crossbones"></i>';
    $notificationBodyText =
      "<h1>Are you absolutely sure?</h1> <p>Confirm by pressing the button again. All of your data will be erased and you cannot retrieve it.</p>";
    setNotificationOptions = true;
    $notificationCloseBtnText = "Let me think";
    openNotification();

    if ($this.text() == "Yes, Delete") {
      $deleteDataBtn.text("WAIT! I change my mind!");
      $("#welcomeInfo").outerHeight(0).removeClass("go");
      
      $notificationIconBody = '<i class="fa-regular fa-thumbs-up"></i>';
      $notificationBodyText = "That's okay. It's nice to start over.";
      setNotificationOptions = false;
      notificationTimer = 5000;
      openNotification();

      deletingInProgress = setTimeout(function () {
        $notificationIconBody = '<i class="fa-solid fa-power-off"></i>';
        $notificationBodyText = "Let's reset everything then.";
        setNotificationOptions = false;
        notificationTimer = 5000;
        openNotification();
        $("#flickSite").removeClass("go");

        deletingInProgress = setTimeout(function () {
          $notificationIconBody = '<i class="fa-solid fa-stopwatch-20"></i>';
          $notificationBodyText = "<h1>5...</h1>";
          setNotificationOptions = false;
          notificationTimer = 1000;
          openNotification();

          deletingInProgress = setTimeout(function () {
            $notificationIconBody = '<i class="fa-solid fa-stopwatch-20"></i>';
            $notificationBodyText = "<h1>4...</h1>";
            setNotificationOptions = false;
            notificationTimer = 1000;
            openNotification();

            deletingInProgress = setTimeout(function () {
              $notificationIconBody =
                '<i class="fa-solid fa-stopwatch-20"></i>';
              $notificationBodyText =
                "<h1>3...</h1>";
              setNotificationOptions = false;
              notificationTimer = 1000;
              openNotification();

              deletingInProgress = setTimeout(function () {
                $notificationIconBody =
                  '<i class="fa-solid fa-stopwatch-20"></i>';
                $notificationBodyText =
                  "<h1>2...</h1>";
                setNotificationOptions = false;
                notificationTimer = 1000;
                openNotification();

                deletingInProgress = setTimeout(function () {
                  $notificationIconBody =
                    '<i class="fa-solid fa-stopwatch-20"></i>';
                  $notificationBodyText =
                    "<h1>1...</h1>";
                  setNotificationOptions = false;
                  notificationTimer = 1000;
                  openNotification();

                  deletingInProgress = setTimeout(function () {
                    $notificationIconBody =
                      '<i class="fa-regular fa-face-kiss-wink-heart"></i>';
                    $notificationBodyText =
                      "See ya later, <b>" + nickname + "</b>!";
                    setNotificationOptions = false;
                    notificationTimer = 3000;
                    openNotification();

                    deletingInProgress = setTimeout(function () {
                      $("#content").addClass("fade");
                      localStorage.clear();
                    }, 2000);

                    deletingInProgress = setTimeout(function () {
                      location.reload();
                    }, 3600);
                  }, 1600);
                }, 1600);
              }, 1600);
            }, 1600);
          }, 1600);
        }, 1600);
      }, 3600);
    } else if ( $this.text() == "WAIT! I change my mind!" ) {
        clearTimeout(deletingInProgress);
        
        $notificationIconBody = '<i class="fa-solid fa-face-grin-squint-tears"></i>';
        $notificationBodyText = "Whew! You had us worried. We'll keep everything for you. Was this a sick joke?!";
        setNotificationOptions = false;
        notificationTimer = 5000;
        openNotification();
        
      $("#welcomeInfo").outerHeight($("#welcomeInfo").children().outerHeight()).addClass("go");
        
        setTimeout(function() {
        $("#flickSite").addClass("go");
        }, 5000);
        
        $this.text("Delete Profile");
    }
  });

  // FLICKITY ---------------------

  // Initialize Flickity for TREESH Navigation Menu
  $menuFlick.flickity();

  // Initialize Isotope for Music Module Tracks
  $grid.isotope();

  // Initialize Flickity for Now Playing
  $nowPlayingFlick.flickity();

  // SITE SCROLLING

  /*
$window.scroll(function(e) {
    if (($window.scrollTop() >= 20 || $(".module").hasClass("go")) && $window.scrollTop() >= $("#error").outerHeight() || $("#flickSite").hasClass("go") ) {
        $navBar.removeClass("deactivate");
    } else {
        $navBar.addClass("deactivate");
    }

    $("#icons .member, .site_section .scrollAni").each(function() {
        const $this = $(this);

        if ($this.offset().top - $window.height() / 1 <= $window.scrollTop()) {
            $this.addClass("go");
        } else {
            $this.removeClass("go");
        }
    });

    $("#about, .ani").each(function() {
        const $this = $(this);

        if ($this.offset().top - $window.height() / 1.3 <= $window.scrollTop()) {
            $this.addClass("go");
        } else {
            $this.removeClass("go");
        }
    });


    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        if (!scrollEnabled) {
            e.preventDefault();
            window.scrollTo(0, scrollPosition);
        }
    }
});
*/

  // NAVIGATION ---------------------------

  // NAVIGATION - ACTIONS AND NAV BAR - CLOSE BUTTON
  $(document).on("click", "#music .genres .contain button", function () {
    const $this = $(this);
    const $genrePicked = $this.attr("data-genre").toLowerCase();
    const $genreBio = $this.attr("data-bio");

    $this.addClass("picked").siblings().removeClass("picked");

    $(".mm-menu .mm-item").removeClass("inactive").removeClass("shrink");
    $navBarSearchMusic.height(0).removeClass("go");

    $("#music [data-trackGenreBio] span:last").html(
      "<b>" + $genrePicked + "</b> Music"
    );

    if (
      $genrePicked === "all" ||
      $genrePicked === "featured" ||
      $genrePicked === "exclusive"
    ) {
      $music.removeClass("noScroll");

      if ($genrePicked === "all") {
        $grid.isotope({ filter: "*" });
        $("#music [data-trackGenreBio] span:first").text(
          "Top tracks from the Icons"
        );
      }

      if ($genrePicked === "featured") {
        $grid.isotope({ filter: $musicGrid.find("[data-featuring]") });
        $("#music [data-trackGenreBio] span:first").text(
          "Artists create with artists"
        );
      }

      if ($genrePicked === "exclusive") {
        $grid.isotope({ filter: $musicGrid.find("[data-exclusive]") });
        $("#music [data-trackGenreBio] span:first").text(
          "Top Treesh Exclusive tracks"
        );
      }
    } else {
      $grid.isotope({
        filter: $musicGrid.find("[data-genre='" + $genrePicked + "']")
      });

      if ($genrePicked === "hip pop") {
        $("#music [data-trackGenreBio] span:first").text(
          "Pop your hips with these"
        );
      }

      if ($genrePicked === "rap") {
        $("#music [data-trackGenreBio] span:first").text("Drop them bars");
      }

      if ($genrePicked === "r&b") {
        $("#music [data-trackGenreBio] span:first").text("Rhythm & b-yous");
      }

      if ($genrePicked === "contemporary pop") {
        $("#music [data-trackGenreBio] span:first").text(
          "Non-genre conforming"
        );
      }

      if ($genrePicked === "pop") {
        $("#music [data-trackGenreBio] span:first").text(
          "These tracks are POPular"
        );
      }

      if ($genrePicked === "contemporary pop") {
        $("#music [data-trackGenreBio] span:first").text(
          "Non-genre conforming"
        );
      }

      if ($genrePicked === "hip hop") {
        $("#music [data-trackGenreBio] span:first").text("Get ready to humble");
      }

      if ($genrePicked === "alternative") {
        $("#music [data-trackGenreBio] span:first").text(
          "Staying in your own lane"
        );
      }

      if ($genrePicked === "rock") {
        $("#music [data-trackGenreBio] span:first").text(
          "We will, we will, jam, too!"
        );
      }
      if ($genrePicked === "storytelling") {
        $("#music [data-trackGenreBio] span:first").text(
          "A path on every track"
        );
      }
    }
  });

  $musicArtist.click(function () {
    var $this = $(this);
    var theName = $this.find(".artist__label p:first").text();
    var shortName = theName.replace(/[^a-z0-9]/g, "").toLowerCase();
    var theBG = $this.attr("data-bg");
    var theLocation = $("#icons .member[data-name='"+ theName +"']").find(".location").text();
    var $matchingMember = $("#icons .members").find(".member").filter(function () {
        return (
          $(this)
            .attr("data-name")
            .replace(/[^a-z0-9]/g, "")
            .toLowerCase() === shortName
        );
      })
      .first();

    $(".mm-menu .open_music_controls-btn")
      .removeClass("go")
      .removeClass("opened");
      
      $this.addClass("clicked").siblings().removeClass("clicked");

    $("#about_artist").scrollTop(0);

    if ($matchingMember.length) {
      var theBio = $this.data("bio");
      
      if (!theBio || !theBio.trim()) {
        theBio = $matchingMember.data("quote");
      }

      $("#music").addClass("go-about_artist");
      $("#about_artist h1").text(theName);
      $("#about_artist h4").text(theLocation);
      $("#about_artist .donate-btn").attr("data-cashapp", $this.attr("data-cashapp"));
      
      if ( !$this.is("[data-cashapp]") ) {
          $("#about_artist .donate-btn").hide();
      } else {
          $("#about_artist .donate-btn").show();
      }
      
      if ( $this.hasClass("liked") ) {
          $("#about_artist .favorite-btn").addClass("clicked").find("p").text("Favorited");
      } else {
          $("#about_artist .favorite-btn").removeClass("clicked").find("p").text("Favorite");
      }

      if ($this.hasClass("hyphenate_name")) {
        $("#about_artist h1").addClass("hyphenate");
      } else {
        $("#about_artist h1").removeClass("hyphenate");
      }

      $("#about_artist .desc p").text(theBio);
      $("#about_artist .artist__blur, #about_artist .artist__image").attr(
        "src",
        theBG
      );

      $matchingMember
        .find(".socials a:not('.music_link')")
        .clone()
        .appendTo("#about_artist .artist_socials-contain");
    } else {
      console.log("No matching member found for:", theName);
    }

    $("#about_artist").addClass("go");
  });

  $document.on("click", "#about_song .artist_name_font", function () {
    var theName = $(this).text();

    var $matchingArtist = $("#music .artists .artist").filter(function () {
      return $(this).find("p:first").text() === theName;
    });

    if ($matchingArtist.length) {
      $travelBtn.click();

      setTimeout(function () {
        $matchingArtist.click();
      }, 600);
    }
  });

  $("#about_artist .close-about_artists-btn").click(function () {
    $("#about_artist").removeClass("go");
    $("#music").removeClass("go-about_artist");
    
    if ( $("#fun").hasClass("is-selected") ) {
        $("#welcomeInfo")
              .outerHeight($("#welcomeInfo").children().outerHeight())
              .addClass("go");
    } else {
        if ( $("#music").hasClass("is-selected") && !$("#music").hasClass("go-now_playing") ) {
            $(".mm-menu .open_music_controls-btn").addClass("go");
        }
    }

    setTimeout(function () {
      $("#about_artist .artist_socials-contain").empty();
      $("#about_artist").scrollTop(0);
    }, 300);
  });

  $musicLyricsBtn.click(function () {
    if (!$(this).hasClass("inactive")) {
      if (!$(this).hasClass("clicked")) {
        $grid.isotope({ filter: $("[data-lyrics]") });
        $("#music [data-trackGenreBio] span:first").text(
          "Go along with the flow"
        );
      } else {
        $grid.isotope({ filter: $("*") });
        $("#music [data-trackGenreBio] span:first").text(
          "Top tracks from the Icons"
        );
      }

      navBarMusicBtn();

      $(this).toggleClass("clicked");
    }
  });

  $musicSearchBtn.click(function () {
    if (!$(this).hasClass("inactive") && !$(this).hasClass("shrink")) {
      if (!$navBarSearchMusic.hasClass("go")) {
        $navBarSearchMusic
          .height($navBarSearchMusic.children().outerHeight())
          .addClass("go");
        $(this).addClass("clicked");
      } else {
        $navBarSearchMusic.height(0).removeClass("go");
        if ($musicGridSongs.is(":visible").length == 0) {
          $grid.isotope({ filter: $tracksItems });
        }
        $(this).removeClass("clicked");
      }

      navBarMusicBtn();
    }
  });

  var searchTimeout;
  $musicSearch.on("input keyup change keydown", function (e) {
    var $this = $(this);
    var keyword = $this
      .val()
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "");
    clearTimeout(searchTimeout);

    if (keyword === "") {
      $grid.isotope({ filter: "*" });
      $("#music [data-trackGenreBio] span:last").html(
        "<p style='letter-spacing:0px; text-transform:none;'>Ah. Can't find anything if you don't type.</p>"
      );

      searchTimeout = setTimeout(function () {
        $("#music [data-trackGenreBio] span:first").text(
          "Top tracks from the Icons"
        );
        $("#music [data-trackGenreBio] span:last").text("All Music");
      }, 6000);
      return;
    }

    $("#music [data-trackGenreBio] span:first").html(
      "Searching for... <b>" + $this.val() + "</b>"
    );

    var filteredItems = $tracksItems.filter(function () {
      if ($(".mm-menu .search_artists-btn").hasClass("clicked")) {
        return $(this).attr("data-track").includes(keyword);
      } else {
        return $(this).find("h3").text().toLowerCase().includes(keyword);
      }
    });

    $grid.isotope({ filter: filteredItems });

    var message = $musicGridSongs.is(":visible")
      ? "<p style='letter-spacing:0px; text-transform:none;'>Looky, looky. We've found some tracks you are looking for.</p>"
      : "<p style='letter-spacing:0px; text-transform:none;'>Hmm... Still can't quite find that. Do you think it exists here?</p>";
    $("#music [data-trackGenreBio] span:last").html(message);

    searchTimeout = setTimeout(function () {
      $("#music [data-trackGenreBio] span:first").text(
        "Top tracks from the Icons"
      );
      $("#music [data-trackGenreBio] span:last").text("All Music");
      $grid.isotope({ filter: "*" });
    }, 6000);
    return;

    if (e.keyCode === 13) {
      e.preventDefault();
      $this.blur();
    }
  });

  $musicSearch
    .focus(function () {
      enableWindowScroll();
    })
    .blur(function () {
      disableWindowScroll();
      if ($musicGridSongs.is(":visible").length == 0) {
        $grid.isotope({ filter: $tracksItems });
      }
      $(this).val("");
    })
    .click(function () {
      $(this).focus();
    })
    .keyup(function (e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        $(this).blur();
      }
    })
    .keypress(function (event) {
      if (event.which === 13) {
        event.preventDefault();
      }
    });

  var musicSearchPlaceholder = $(".mm-menu .search").attr("placeholder");
  $(".mm-menu .search-music button").click(function () {
    $(this).addClass("clicked").siblings().removeClass("clicked");

    $(".mm-menu .search").val("");

    if ($(this).hasClass("search_artists-btn")) {
      $(".mm-menu .search")
        .attr("placeholder", musicSearchPlaceholder)
        .attr("data-music-search", "tracks");
    } else {
      $(".mm-menu .search")
        .attr("placeholder", "Search artist on tracks")
        .attr("data-music-search", "artists");
    }
  });

  // TREESH MAIN - HEADER

  let openMusicLinkTime = 0;
  $document.on("click", "button[data-music-open]", function () {
    const $this = $(this);
    var musicLink = $this
      .attr("data-music-open")
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "");

    setTimeout(function () {
      openMusicLink($this, musicLink);
    }, openMusicLinkTime);
  });

  function openMusicLink($this, musicLink) {
    setTimeout(function () {
      $musicBtn.click();
    }, 300);

    $(
      "#music .playlist .tracks .grid ul[data-track='" + musicLink + "']"
    ).click();
  }

  $(".mm-menu .section[for='music']").hide();

  if (
    $(
      "#music .featured_videos .featured_videos_contain .featured_videos_load"
    ).is(":empty")
  ) {
    $musicGridSongs.each(function () {
    var $this = $(this);
    var trackName = $this.find("h2").text().trim();
    var trackArtist = $this.find("h3").text().trim();
    var videoId = $this.attr("data-video");

    if (videoId) {
        /*
        var iframeHTML =
            '<iframe class="video" src="https://www.youtube.com/embed/' +
            videoId +
            '" title="' +
            trackName +
            ' from ' +
            trackArtist +
            '" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
            */

        var theDIV =
            "<div class='featured_video' data-video='"+ videoId +"'>" +
            "<div class='thumbnail' style='background:url(https://img.youtube.com/vi/" + videoId + "/0.jpg);'></div><div class='featured_video-contain'>" +
            "<h2>" + trackName + "</h2>" +
            "<h3>" + trackArtist + "</h3>" +
            "</div></div>";

        $(".featured_videos .featured_videos_contain").append(theDIV);
    }
});

  }
  
  $(".featured_videos").on("click", ".featured_video", function() {
      var $this = $(this);
      var title = $this.find("h2").text();
      var artist = $this.find("h3").text();
      var videoId = $this.attr("data-video");
      
      if ( !$(".mm-menu #playpause").hasClass("paused") ) {
          pauseSong();
      }
     
     $("#video_viewer iframe").attr("src", "https://www.youtube.com/embed/" + videoId);
     $("#video_viewer h1").text(title);
     $("#video_viewer h2").text(artist);
     
     $("#video_viewer").addClass("go");
     $(".mm-menu, #wave").addClass("deactivate");
  });
  
  $(document).on("click", "#video_viewer .close_video-btn", function() {
      var $this = $(this);
      
      $("#video_viewer").removeClass("go");
      $(".mm-menu, #wave").removeClass("deactivate");
  });

  function loadMusicPlayer() {
    $musicGridSongs.each(function () {
      var $this = $(this);
      if (!$(this).find("audio").length) {
        var audioUrl = $this.data("mp3");
        song = new Audio(audioUrl);
        song.preload = "auto";

        var comb = "<div class='dfwmh' data-try='okdwQOWKeokwdkp3kpdo-oqwkdpqokdoqowDOKokd3okdwdwd-pqwokdqpwijdeiwjedWEOJerer-ei3ejijdeij3iejE3934jriejr-39429843jdEDIJED-orekrwok'></div> ";
        $this.append("<div class='tita' data-try='iej39j0d3-20e3je04j039-3e93ejdj039dj32-e30jee039dj2e90i-r39r94ri0-3r932e09i-39i39ri9i'><div class='spkis' data-try='329i30rj20d3d-dj3d0jidjejr-3irj3ijdoijd039jd-eeji3je9jd3ije93-e3ej3dij3d'><div class='oebws' data-try='j3idj3idj3d30d3idjffoiwejoweijr0909rn3-fjfjeifjdi3ej3jfiejrie3d-eifjfeij3iejijdefoej-3eijiejdijfjiufejiwe'><div class='aiagtft'><div class='owisamot' data-try='p3eok3d3d3-doekdeokd3oej3ekoe3d3-deodkeffowfjweoid3d-edwofiwjeoidj3d-deodiwjoiedj3doijd'>" + comb + "</div></div></div></div></div>").find(".dfwmh").append(song);
      }
      
    const $coverArt = $this.find(".coverart");
  const coverArtSrc = $coverArt.attr("src");
  $coverArt.attr("data-coverart", coverArtSrc).attr("src", "https://res.cloudinary.com/treesh/image/fetch/w_300/" + coverArtSrc);
    });

    $faveHrt.css("transition-duration", "0.3s");

    $grid.isotope({ filter: $("*") });

    setTimeout(function () {
      var $newSong = $musicGridSongs.eq(0);
      var $treeshChoiceSong = $("#music .grid [data-treeshChoice]").eq(
        Math.floor(Math.random() * $("#music .grid [data-treeshChoice]").length)
      );
      var $treeshExclusiveSong = $("#music .grid [data-exclusive]").eq(
        Math.floor(Math.random() * $("#music .grid [data-exclusive]").length)
      );
      var $songWithLyrics = $("#music .grid [data-lyrics]").eq(
        Math.floor(Math.random() * $("#music .grid [data-lyrics]").length)
      );
      var $songWithVideo = $("#music .grid [data-video]").eq(
        Math.floor(Math.random() * $("#music .grid [data-video]").length)
      );
      var $likedSongsSong = $("#music .tracks .song.liked");
      $likedSongsSong = $likedSongsSong.eq(
        Math.floor(Math.random() * $likedSongsSong.length)
      );

      $("#music .whats_new .item").each(function () {
        var $this = $(this);
        var theType = $(this).attr("data-type");
        var theSongToFind;

        if (theType === "new") {
          theSongToFind = $newSong;
        }

        if (theType === "treesh choice") {
          theSongToFind = $treeshChoiceSong;
        }

        if (theType === "treesh exclusive") {
          theSongToFind = $treeshExclusiveSong;
        }

        if (theType === "know the lyrics") {
          theSongToFind = $songWithLyrics;
        }

        if (theType === "your faves") {
          theSongToFind = $likedSongsSong;
        }

        $this.find(".titles title-tag").text(
          theSongToFind
            .find("h2")
            .text()
            .replace(/\([^)]*\)/g, "")
        );
        $this.find("artists-tag").text(
          theSongToFind
            .find("h3")
            .text()
            .replace(/\([^)]*\)/g, "")
        );
        $this
          .find(".coverart img")
          .attr("src", theSongToFind.find(".coverart").attr("data-coverart"));
      });

      setTimeout(function () {
        if ($("#music .tracks .song.liked").length <= 1) {
          $musicWhatsNewFlick.flickity(
            "remove",
            $(
              "#music .whats_new .whats_new_flick .item[data-type='your faves']"
            )
          );
          $(
            "#music .whats_new .whats_new_flick .item[data-type='your faves'"
          ).remove();
        }
      }, 200);

      $grid.isotope();
    }, 400);

    setTimeout(function () {
      $("#music .whats_new .whats_new_bg").attr(
        "style",
        "background-image:url('" +
          $(
            "#music .whats_new .whats_new_flick .item.is-selected .coverart img"
          ).attr("src") +
          "') !important;"
      );

      $("#music .whats_new .play-btn").attr(
        "data-track",
        $(
          "#music .whats_new .whats_new_flick .item.is-selected title-tag"
        ).text()
      );
    }, 1000);

    if ($music.hasClass("go-now_playing") && !$music.hasClass("go")) {
      $menuFlick.flickity("selectCell", ".music_bar");
      $wave.addClass("scroll");
    }

    setTimeout(changeLogo, 300);

    $musicArtists.find(".contain").scrollLeft(0);

    $grid.isotope();

    if ($("#now_playing").hasClass("go")) {
      $travelBtn.find(".audio_ani").removeClass("go");
      $travelBtn.find("i").removeClass("fadeOut");
      $musicRecordPlayerVinyl.removeClass("stopspin");
    }

    if (localStorage.getItem("favArtist")) {
        setTimeout(function() {
            $("#fun [data-favorite-artist] [data-artist]").each(function() {
               $("#music .artists .artist[data-name='"+ $(this).attr("data-artist") +"']").addClass("liked").append(appendHrt);

            setTimeout(function () {
              $("#music .artists .artist").find(".fave-hrt").addClass("go");
            }, 800);
            });
            
            
        }, 7000);
    }

    if (localStorage.getItem("favSong")) {
        setTimeout(function() {
      $dataFavoriteSong.find("[data-song]").each(function(index) {
        var $this = $(this);
        var songName = $this.attr("data-song");

        $tracksItems.each(function () {
          var $trackItem = $(this);
          var trackName = $trackItem.attr("data-track");

          if (songName === trackName && !$trackItem.find(".fave-hrt").length) {
            $trackItem.addClass("liked").append(appendHrt);

            setTimeout(function () {
              $trackItem.find(".fave-hrt").addClass("go");
            }, 800);
          }
        });
      });
        }, 1000);
    }

    if (localStorage.getItem("deletedSong")) {
      $tracksItems.each(function () {
        let $this = $(this);
        $dataDeletedSong.find("[data-song]").each(function () {
          if ($this.find("h2").text() == $(this).text()) {
            $this.remove();
            $grid.isotope("remove", $this).isotope("layout");
          }
        });
      });
    }
            $musicArtistsContain.children().each(function () {
        $musicArtistsContain.append($(this).detach());
      });

      var shuffledChildren = $musicArtistsContain
        .children()
        .toArray()
        .sort(function () {
          return 0.5 - Math.random();
        });

      $musicArtistsContain.append(shuffledChildren).scrollLeft("-15px");
      
      
          $grid.isotope("shuffle");
  }
  
  loadMusicPlayer();
  
  $menuFlick.on("change.flickity", function () {
    if (
      ($(".mm-menu .music_bar").hasClass("is-selected") &&
        $musicScrub.hasClass("go")) ||
      ($(
        "#fun .site_settings [data-setting='show scrubber'] .btn-toggle"
      ).hasClass("active") &&
        $(".mm-menu .music_bar").hasClass("is-selected"))
    ) {
      $musicScrub.height($musicScrub.find(".contain").innerHeight());
    } else {
      $musicScrub.height(0);
    }
  });

  // MUSIC MODULE ---------------------

  // MUSIC WHAT'S NEW

	$nowPlayingFlick.on("change.flickity", function () {
    $(".slide.is-selected").siblings().scrollTop();
    
    if ( $(this).find("#lyrics").hasClass("is-selected") ) {
    $("#now_playing #lyrics .nolyrics").css("opacity", "1");
    }
  });

  $musicWhatsNewFlick.on("change.flickity", function (event, index) {
    var $this = $(this);
    $("#music .whats_new .whats_new_bg").addClass("go");

    setTimeout(function () {
      $("#music .whats_new .play-btn").attr(
        "data-track",
        $("#music .whats_new .whats_new_flick .item.is-selected")
          .find("title-tag")
          .text()
      );
    }, 300);

    setTimeout(function () {
      $("#music .whats_new .whats_new_bg").attr(
        "style",
        "background-image:url('" +
          $this.find(".is-selected .coverart img").attr("src") +
          "') !important;"
      );

      setTimeout(function () {
        $("#music .whats_new .whats_new_bg").attr(
          "style",
          "background-image:url('" +
            $this.find(".is-selected .coverart img").attr("src") +
            "') !important;"
        );
        $("#music .whats_new .whats_new_bg").removeClass("go");
      }, 300);
    }, 600);
  });

  // MUSIC MODULE - TRACKS LIST

  let clickTimeout;

  $musicPlaylistControlsBtn.click(function () {
    const $this = $(this);

    if ($this.hasClass("inactive")) return;

    if (
      $this.hasClass("shuffle_playlist-btn") ||
      $this.hasClass("list_view-btn") ||
      $this.hasClass("surprise-btn")
    ) {
      clearTimeout(clickTimeout);
      $this.addClass("clicked");
      clickTimeout = setTimeout(() => $this.removeClass("clicked"), 300);
    }

    if ($this.hasClass("surprise-btn")) {
      const randomIndex = Math.floor(
        Math.random() * $("#music .grid .song").length
      );
      $("#music .grid .song").eq(randomIndex).click();
    } else if ($this.hasClass("shuffle_playlist-btn")) {
      $grid.isotope("shuffle");
    } else if ($this.hasClass("list_view-btn")) {
      const $btnIcon = $this.find("i");

      if ($btnIcon.hasClass("fa-list")) {
        $musicGridSongs.addClass("list_view");
        $btnIcon.removeClass("fa-list").addClass("fa-border-all");
        localStorage.setItem("musicView", "list");
      } else {
        $musicGridSongs.removeClass("list_view");
        $tracksItems.each(function () {
          $(this).find(".coverart").height($(this).width());
        });
        $grid.isotope("layout");
        $btnIcon.removeClass("fa-border-all").addClass("fa-list");
        localStorage.setItem("musicView", "grid");
      }
      $grid.isotope("layout");
    }
  });

  // MUSIC MODULE - TRACKS - ARTIST LIST
 
  $musicArtistsItems.each(function () {
    const $this = $(this);
    var artistName = $this.find(".artist__label p:first").text();
    $this.attr("data-name", artistName);
  });

  $musicArtistsItems.click(function (event) {
    const $this = $(this);
    var artistID = $this.attr("data-artist-id");

    pickMemberName = $(
      "#icons .members"
    ).find(".member[data-artist-id='" + $this.attr("data-artist-id") + "']").attr("data-name");

    menuModalClose();

    // Remove previously appended isotope items
    $artistTracksGrid.isotope("remove", $("#about_artist .trackss").children());

    // Empty the container (can be removed as isotope removes all items)
    $("#about_artist .trackss").empty();

    $tracksItems.each(function () {
      const $this = $(this);

      var trackArtistIDs = $(this).attr("data-artist-id").split(",");

      if (artistID && trackArtistIDs.includes(artistID)) {
        // Check if artistID exists in the array
        var clonedDiv = $(this).clone();
        $("#about_artist .trackss").append(clonedDiv);

        clonedDiv.find(".coverart").attr("src", $this.attr("data-coverart")).height(clonedDiv.find(".coverart").width());
        $artistTracksGrid.isotope("appended", clonedDiv);
      }
    });

    $artistTracksGrid.isotope("layout");

    setTimeout(function () {
      $artistTracksGrid.isotope("layout");
    }, 600);

    event.preventDefault();
  });

  $(document).on("click", "#about_artist .trackss .song", function () {
    var theTrackName = $(this).attr("data-track");
    
    $("#music .grid .song[data-track='"+ theTrackName +"']").click();
  });
  
  $("#about_artist .top_artist_options").on("click", "button", function() {
                      var $this = $(this);
                      var cashApp = $this.attr("data-cashapp");
                      
                      if ( $("#music .artists .artist").hasClass("clicked") ) {
                      if ( $this.hasClass("donate-btn") && cashApp !== "Treesh" && cashApp !== "treesh" && cashApp !== "TREESH" ) {
                          window.open("https://cash.app/$" + cashApp, "_blank");
                      }
                      
                      if ( $this.hasClass("favorite-btn") ) {
                          favoriteArtist($("#music .artists .artist.clicked"));
                          if ( $("#music .artists .artist.clicked").hasClass("liked") ) {
                              $this.removeClass("clicked").find("p").text("Favorite");
                          } else {
                              $this.addClass("clicked").find("p").text("Favorited");
                          }
                      }
                      }
                  });

  $musicArtistsItems
    .on("mousedown touchstart", function () {
      favoriteArtist($(this));
    })
    .on("mouseup touchend", function () {
      clearTimeout(pressTimer);
    });

  function favoriteArtist($this) {
    var artistName = $this.find("p:first").text();
    var artistPic = $this.find(".artist__image").attr("src");
    var artistID = $this.attr("data-artist-id");

    pressTimer = setTimeout(function () {
      if (
        !$dataFavoriteArtist.find("[data-artist='" + artistName + "']").length
      ) {
        if (!$dataFavoriteArtist.find("ol").length) {
          $dataFavoriteArtist.empty();
        }

        $dataFavoriteArtist.append(
          '<ol data-artist="' +
            artistName +
            '"><li><img src="' +
            artistPic +
            '" /></li><li>' +
            artistName +
            "</li></ol>"
        );
        localStorage.setItem("favArtist", $dataFavoriteArtist.html());

        $this.find(".artist__thumbnail").append(appendHrt);

        setTimeout(function () {
          $this.find(".fave-hrt").addClass("go");
        }, 100);

        $notificationIconBody = '<i class="fa fa-music"></i>';
        $notificationBodyText = "You've favorited <b>" + artistName + "</b>!";
        $this.addClass("liked");
      } else {
        $this.find(".fave-hrt").removeClass("go");

        setTimeout(function () {
          $this.find(".fave-hrt").remove();
        }, 300);
        
        $this.removeClass("liked");

        $notificationIconBody = '<i class="fa fa-music"></i>';
        $notificationBodyText =
          "You've taken away <b>" + artistName + "</b>'s heart.";
        $dataFavoriteArtist.find("[data-artist='" + artistName + "']").remove();

        if ($dataFavoriteArtist.is(":empty")) {
          $dataFavoriteArtist.text("Nobody");
        }

        localStorage.setItem("favArtist", $dataFavoriteArtist.html());
      }

      setNotificationOptions = false;
      notificationTimer = 6000;
      openNotification();
    }, 1000);
  }

  function concatValues(obj) {
    var value = "";
    for (var prop in obj) {
      value += obj[prop];
    }
    return value;
  }

  function splitTextIntoLines(text, maxCharacters) {
    var lines = [];
    while (text.length > maxCharacters) {
      var line = text.substring(0, maxCharacters);
      var lastSpace = line.lastIndexOf(" ");
      line = line.substring(0, lastSpace);
      lines.push(line);
      text = text.substring(lastSpace + 1);
    }
    lines.push(text);
    return lines;
  }

  // MUSIC MODULE - TRACK LIST - TRACKS ----------

  // MUSIC MODULE - TRACK LIST - TRACKS ON CLICK

  var attributes = [];

  $tracksItems.each(function () {
    let $this = $(this);
    var trackName = $this.attr("data-track");
    var genre = $this.attr("data-genre");
    var trackNameSimplified = trackName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "")
      .replace(/[_\s]/g, "-");
    $this.data("pos", $this.position().top);

    $this.attr("data-genre", genre.toLowerCase());

    $this
      .attr("data-track", trackNameSimplified)
      .attr(
        "data-href",
        "https://treesh.life/music/track/" +
          trackName.replace(/[^\w\s]/gi, "").replace(/ /g, "")
      );
    $this.find(".coverart").height($this.find(".coverart").width());

    setTimeout(function () {
      if (
        $this.attr("data-exclusive") !== undefined ||
        $this.attr("data-treeshChoice") !== undefined ||
        $this.attr("data-explicit") !== undefined ||
        $this.attr("data-lyrics") !== undefined
      ) {
        $(
          '<song-info-tag class="tags"><song-details-tag></song-details-tag></song-info-tag>'
        ).appendTo($this.find("section:last"));
      }

      let songDetails = $this.find("song-details-tag");

      if ($this.attr("data-exclusive") !== undefined) {
        $("<tag><h4 class='exclusive'>Exclusive</h4></tag>").appendTo(
          songDetails
        );
      }

      if ($this.attr("data-treeshChoice") !== undefined) {
        $("<tag><h4 class='treesh_choice'>Treesh Choice</h4></tag>").appendTo(
          songDetails
        );
      }

      if ($this.data("video")) {
        $("<tag><h4 class='video-tag'>Video</h4></tag>").appendTo(songDetails);
      }

      if ($this.attr("data-lyrics") !== undefined) {
        $("<tag><h4 class='lyrics-tag'>Lyrics</h4></tag>").appendTo(
          songDetails
        );
      }

      if ($this.attr("data-explicit") !== undefined) {
        $("<tag><explicit-tag>E</explicit-tag><tag>").prependTo(songDetails);
      }
    }, 100);

    // Check if the genre is not already in the attributes array
    if (attributes.indexOf(genre) === -1) {
      attributes.push(genre);

      // Append a new option to the select element
      function capitalizeWords(str) {
        return str
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());
      }

      $("#music .genres .contain").append(
        $(
          "<button type='button' data-genre='" +
            capitalizeWords(genre) +
            "'>" +
            "<span>" +
            capitalizeWords(genre) +
            "</span></button>"
        )
      );
    }
  });

  $(".mm-menu .music_bar .playpause").append(
    '<div class="music_loader music_loader-2"><svg class="music_loader-star" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"><polygon points="29.8 0.3 22.8 21.8 0 21.8 18.5 35.2 11.5 56.7 29.8 43.4 48.2 56.7 41.2 35.1 59.6 21.8 36.8 21.8 " /></svg><div class="music_loader-circles"></div></div>'
  );

  $musicGridSongs.click(function () {
    let $this = $(this);
$notificationStatus = "nowPlaying";

    if (!$this.hasClass("selected-menu")) {
      let currentSong = $this;
      let $coverart = currentSong.find(".coverart");
      let $h2 = currentSong.find("h2");
      let $h3 = currentSong.find("h3");
      theSong = $this.find("audio")[0];
      let $track = currentSong.attr("data-track");
      songPlaying = currentSong;
      theSong.src = $this.attr("data-mp3");
      thumbnail = $coverart.attr("data-coverart");
      songName = $h2.html();
      songArtist = $h3.text();

      $("#now_playing").attr("data-track", $track);
      $("#now_playing .bg").css("background", "url(" + thumbnail + ")");

      var trackBio = $this.attr("data-bio");
      var artist = $this.attr("data-artist");
      var trackFeaturing = $this.attr("data-featuring");
      var trackMixer = $this.attr("data-mixer");
      var trackCreationDate = $this.attr("data-creation-date");
      var trackWrittenBy = $this.attr("data-written-by");
      var trackProducer = $this.attr("data-producer");
      var mixtape = $this.attr("data-mixtape");
      
      $("#widgets .music_widget .music_track").text(songName);
      $("#widgets .music_widget .music_artist").text(songArtist);
      $("#widgets .music_widget .coverart").attr("src", thumbnail);
      
      if ( !$("#fun #widgets .music_widget").hasClass("enlarge") ) {
          $("#widgets .music_widget").css("background-image", "url(https://res.cloudinary.com/treesh/image/fetch/w_50/"+ thumbnail +")");
      }
    
    $("#fun #widgets").find(".audio_ani").removeClass("go");

      hideOrShow("[data-song-bio]", trackBio);
      hideOrShow("[data-song-artist]", artist);
      hideOrShow("[data-song-featuring]", trackFeaturing);
      hideOrShow("[data-song-producer]", trackProducer);
      hideOrShow("[data-song-mixer]", trackMixer);
      hideOrShow("[data-song-creation-date]", trackCreationDate);
      hideOrShow("[data-song-written-by]", trackWrittenBy);
      hideOrShow("[data-song-mixtape]", mixtape);

      $("audio").each(function () {
        this.pause();
      });
      
      if ( !$("#fun").hasClass("is-selected") ) {
      if ( $("#music").hasClass("go") || $("#music").hasClass("is-selected") || $("#now_playing").hasClass("go") ) {
          menuModalClose();
      }
      }

      function resizeImage(src, newWidth, newHeight, callback) {
        var img = new Image();

        img.crossOrigin = "Anonymous";
        img.onload = function () {
          var canvas = document.createElement("canvas");
          var ctx = canvas.getContext("2d");

          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          var resizedImageURL = canvas.toDataURL("image/jpeg");

          callback(resizedImageURL);
        };

        img.src = src;
      }

      if ("mediaSession" in navigator) {
        var sizes = [
          "96x96",
          "128x128",
          "256x256",
          "400x400",
          "512x512",
          "800x800",
          "1024x1024",
          "1440x1440",
          "2000x2000"
        ];
        var artworkArray = [];

        sizes.forEach(function (size) {
          var dimensions = size.split("x");
          var width = parseInt(dimensions[0]);
          var height = parseInt(dimensions[1]);

          resizeImage(thumbnail, width, height, function (resizedURL) {
            artworkArray.push({
              src: resizedURL,
              sizes: size,
              type: "image/jpeg"
            });

            if (artworkArray.length === sizes.length) {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: songName,
                artist: songArtist,
                artwork: artworkArray
              });
            }
          });
        });
      }

      $(".mm-menu .music_bar .playpause").addClass("loading");
      $(".mm-menu .open_music_controls-btn")
        .removeClass("go")
        .removeClass("opened");

      /*
window.history.replaceState(null, 'Now Playing - TREESH Music', ("/music/track/" + songName.replace(/\s/g, '')));
*/

      if ($navBar.hasClass("deactivate")) {
        $navBar.removeClass("deactivate");
      }
      
      if ( $this.find(".fave-hrt").length ) {
          $("#about_song #toggle-heart").prop('checked', true);
          $("#now_playing #about_song #toggle-heart").parent().find("p").text("Favorited");
      } else {
          $("#about_song #toggle-heart").prop('checked', false);
          $("#now_playing #about_song #toggle-heart").parent().find("p").text("Favorite");
      }

      $(".mm-menu .section[for='music']").show();
      $menuFlick.flickity();
      $menuFlick.data("flickity").options.draggable = true;
      $menuFlick.data("flickity").updateDraggable();

      if ($musicLyricsBtn.hasClass("clicked")) {
        $musicLyricsBtn.click();
      }

      function hideOrShow(selector, data) {
        var element = $(selector);
        if (data === undefined || data === "") {
          element.parent().hide();
        } else {
          element.text(data).parent().show();
        }
      }

      $nowPlayingFlick.flickity("selectCell", 0);

      if (!$dataLastPlayedSong.find('[data-song="' + $track + '"]').length) {
        if (!$dataLastPlayedSong.find("ol").length) {
          $dataLastPlayedSong.empty();
        }

        $dataLastPlayedSong.prepend(
          '<ol data-song="' +
            $track +
            '"><li><img src="' +
            thumbnail +
            '" /></li><li class="quote">' +
              songName +
              "</li><li>"+ songArtist +"</li></ol>"
        );
        
        if ($dataLastPlayedSong.find("[data-song]").length >= 10) {
          $dataLastPlayedSong.find("[data-song]").slice(10).remove();
        }
      } else {
        $dataLastPlayedSong
          .find("[data-song='" + $track + "']")
          .prependTo($dataLastPlayedSong);
      }

      if ($navBarSearchMusic.hasClass("go")) {
        $musicSearchBtn.click();
      }

      $musicLyricsLyrics.scrollTop(0);
      $nowPlayingSongData.css("max-height", $("#now_playing").height() / 2.2);
      clearTimeout(musicInfoGo);
      clearTimeout(removeLabelTime);
      $musicBarInfo.removeClass("go-upNext").removeClass("go-label");
      $musicBarInfoArtist.text(songArtist);
      $musicBarInfoTrack.text(songName);
      $musicBarInfo.addClass("go");

      if ( $("#music").hasClass("is-selected") || $("#now_playing").hasClass("go") ) {
          $menuFlick.flickity("selectCell", 1);
      } else {
          $menuFlick.flickity("selectCell", 2);
      }

      $playPauseBtn.removeClass("fa-pause").addClass("fa-play");

      if (
        $this.attr("data-exclusive") !== undefined ||
        $this.attr("data-treeshChoice") !== undefined
      ) {
        labelText =
          $this.attr("data-treeshChoice") !== undefined
            ? "TREESH CHOICE"
            : "EXCLUSIVE";
      } else {
        labelText = "TREESH MUSIC";
      }

      $musicInfoLabel.text(labelText);

      if (nowPlayingScreen === true && $("#music").hasClass("is-selected") ) {
        $music.addClass("go-now_playing");
        setTimeout(function () {
            $menuFlick.flickity("selectCell", ".music_bar");
          $("#now_playing").addClass("go");
          $musicRecordPlayer.addClass("nodelaytransition");
        }, 300);
      } else {
          $music.removeClass("go-now_playing");
      }
      
      

      $currentlyPlayingInfoSongName.text($h2.text());
      $currentlyPlayingInfoSongArtist.text(songArtist);
      $travelBtn.find("i").removeClass().addClass($(".mm-menu .mm-item.clicked").find("i").attr("class"));
      $travelBtn.find(".audio_ani").removeClass("go");
      $travelBtn.find("i").removeClass("fadeOut");

      let recordTime = 600;

      $nowPlayingSongDataTitle.html(songName);
      $nowPlayingSongDataArtist.text(songArtist);
      $musicRecordPlayerVinyl.addClass("stopspin");

      setTimeout(function () {
        $musicRecordPlayerVinyl.attr("src", thumbnail);
      }, recordTime);

      theSong.play();
      playing = true;

      $musicScrubber.val(0).attr("max", "0");

      theSong.addEventListener("loadeddata", function () {
        $playPauseBtn.removeClass("fa-play").addClass("fa-pause");
        $navBar.addClass("go_music-player");
        $this.addClass("play");
        $this.siblings().removeClass("play");
        $musicScrubber.attr("max", theSong.duration);
        $("#fun #widgets .music_widget").addClass("playing");
        
        setTimeout(function() {
            $("#fun #widgets .music_widget p").each(function () {
        let $this = $(this);
            let textWidth = $this[0].scrollWidth;
            let containerWidth = $this.parent().width();
            
            if (textWidth > containerWidth) {
                $this.addClass("marquee");
            } else {
                $this.removeClass("marquee");
            }
        });
        }, 2000);
        
        $("#fun #widgets").find(".audio_ani").addClass("go");

        $(".mm-menu .music_bar .playpause").removeClass("loading");

        setTimeout(function () {
          $("#now_playing .song_data, #now_playing #lyrics").removeClass(
            "fade"
          );
          $musicRecordPlayer.removeClass("stopspin2");
          $musicRecordPlayerVinyl.removeClass("stopspin");
        }, recordTime);

        playRandomSong();
        musicInfo();
        
        
        setTimeout(function() {
            if ( $("#now_playing").hasClass("go") && !localStorage.getItem("learnedNowPlaying") ) {
            $notificationIconBody = '<i class="fa-regular fa-music"></i>';
      $notificationBodyText =
        "<h1>Swiiipe to the Left!</h1><p>You've picked a track. Now learn more about it! <b>Swipe LEFT</b> or <b>RIGHT</b> to view lyrics or more information about the song.</p>";
        setNotificationOptions = true;
    $notificationCloseBtnText = "Next";
      openNotification();
      
      setTimeout(function() {
          $nowPlayingFlick.flickity("previous");
          (".mm-menu").addClass("tip");
      }, 600);
        }
        }, 3000);
        
        if ( !$("#music").hasClass("go") && !$("#now_playing").hasClass("go") ) {
    $travelBtn.find(".audio_ani").addClass("go");
      $travelBtn.find("i").addClass("fadeOut");
        } else {
    $travelBtn.find(".audio_ani").removeClass("go");
      $travelBtn.find("i").removeClass("fadeOut");
        }
      });
      
      
      theSong.addEventListener("error", function () { 
   $notificationIconBody = '<i class="fa-solid fa-bug"></i>';
      $notificationBodyText =
        "<h1>Uh oh...</h1><p>There appears to be an error loading <b>'"+ $track +"'</b> by <b>"+ songArtist +"</b>!</p><p>It could be the following reasons:</p><p><li>Wi-Fi connection has been disconnected,</li><li>The app may not have loaded fully,</li><li>The song does not exist anymore,</li><li>Another audio source is currently playing,</li><li>Using private or masked connections such as VPN,</li><li>JavaScript is disabled in settings.</li></p><p>Click or tap <b>'Try Again'</b> to reload the track. Check your connection and refresh the app if error continues.</p>";
        setNotificationOptions = true;
            $notificationCloseBtnText = "Try again";
      openNotification();
});
      

      theSong.addEventListener("ended", function () {
        if (!$repeatBtn.hasClass("color")) {
          randomSong.click();

          theSong.removeEventListener("ended", arguments.callee);
        } else {
          theSong.currentTime = 0;
          $musicBarInfo.removeClass("go-upNext").removeClass("go-label");

          setTimeout(function () {
            theSong.play();
            musicInfo();
          }, 100);
        }
      });

      theSong.addEventListener("timeupdate", function () {
        let currentTime = theSong.currentTime;
        let audioDuration = theSong.duration;
        let remainingTime = audioDuration - currentTime;
        let targetTime;
        var minutes = Math.floor(currentTime / 60);
        var seconds = Math.floor(currentTime % 60);
        seconds = seconds < 10 ? "0" + seconds : seconds;
        var formattedTime = minutes + ":" + seconds;
        var minutess = Math.floor(audioDuration / 60);
        var secondss = Math.floor(audioDuration % 60);
        secondss = secondss < 10 ? "0" + secondss : secondss;
        var formattedDuration = minutess + ":" + secondss;

        $("#lyrics .all_lyrics .lyric[data-go-lyrics='animate'].go p").each(
          function () {
            const $this = $(this);
            if ($this.attr("data-seconds") == parseInt(currentTime)) {
              $("#lyrics h1").text($this.text());
            }
          }
        );

        if (parseInt(remainingTime) === 30) {
          clearTimeout(musicInfoGo);
          clearTimeout(removeLabelTime);
          $musicBarInfo.addClass("go-upNext").addClass("go-label");
        }

        $musicScrubber.val(currentTime);
        $("#scrub .scrubTime").text(formattedTime);
        $("#scrub .scrubDuration").text(formattedDuration);
      });

      let sanitizedTrack = $track.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");

      $musicHiddenLyrics.each(function () {
        let $this = $(this);
        let trackAttr = $this.attr("data-track");

        if (trackAttr) {
          let sanitizedTrackAttr = trackAttr
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, "");

          if (sanitizedTrackAttr === sanitizedTrack) {
            $this.addClass("go").siblings().removeClass("go");
		  $("#now_playing #lyrics .nolyrics").remove();

            if ($this.attr("data-go-lyrics") == "animate") {
              $musicLyricsContainer.empty().hide();
              $("#now_playing #lyrics .heading h1").text("Intro...");
              $("#now_playing").removeClass("go_lyrics").addClass("no_lyrics");
            } else {
              $musicLyricsContainer.html($this.html()).show();
              firstLyricLineOffsetTop = $musicLyricsContainer
                .find("p:first")
                .offset().top;

              $("#now_playing #lyrics .heading h1").text("Lyrics");
              $("#now_playing").addClass("go_lyrics").removeClass("no_lyrics");

              setTimeout(function () {
                $("#lyrics .body").find("p:first").addClass("current");
              }, 4000);
            }

            return false;
          } else {
            $musicLyricsContainer.empty().hide();

            $("#now_playing #lyrics").append('<div class="nolyrics">No lyrics, yet!</div>');
            $("#now_playing #lyrics .nolyrics").css("opacity", "0");
            $("#now_playing").removeClass("go_lyrics").addClass("no_lyrics");
          }
        }
      });

      $musicLyricsLyrics.find("br").each(function () {
        const $this = $(this);
        $this.prev("p").addClass("break");
      });

      $musicLyrics.scrollTop(0);
    }

    const artistLookup = {};
    $("#music .artists .artist").each(function () {
      const artistName = $(this).find("p:first").text().trim();
      artistLookup[artistName] = true;
    });

    $(
      "#about_song [data-song-artist], #about_song [data-song-written-by], #about_song [data-song-producer], #about_song [data-song-featuring], #about_song [data-song-mixer], #about_song [data-song-mixtape]"
    ).each(function () {
      const $this = $(this);
      const text = $this.text().trim();

      let newText = text;
      for (const artistName in artistLookup) {
        const escapedArtistName = artistName.replace(
          /[-\/\\^$*+?.()|[\]{}]/g,
          "\\$&"
        );
        const regex = new RegExp("\\b" + escapedArtistName + "\\b", "gi");
        newText = newText.replace(
          regex,
          '<span class="artist_name_font">' + artistName + "</span>"
        );
      }

      $this.html(newText);
    });
    
    if ( $("#fun").hasClass("is-selected") ) {
            $("#welcomeInfo")
              .outerHeight($("#welcomeInfo").children().outerHeight())
              .addClass("go");
      }
  });

  function playRandomSong() {
    const songs = $tracksItems
      .filter(":visible")
      .toArray()
      .filter((theSong) => !$(theSong).hasClass("play"));
    const randomIndex = Math.floor(Math.random() * songs.length);
    randomSong = songs[randomIndex];
    randomTitle = $(randomSong).attr("data-track");
    const oneMinuteBeforeEnd = theSong.duration - 30;
    theSong.triggeredFunction = false;

    $(".music_info .upNext").text($(randomSong).find("h2").text());
  }

  $musicGridSongs
    .on("mousedown touchstart", function () {
      favoriteSong($(this));
      menuModalOpen($(this));
    })
    .on("mouseup touchend", function () {
      clearTimeout(pressTimer);
    });

  function favoriteSong($this) {
    selectedItemMenu = $this;
  }

  $musicBar
    .on("mousedown touchstart dblclick", function () {
      scrubberFunc();
    })
    .on("mouseup touchend", function () {
      clearTimeout(pressTimer);
    });

  function scrubberFunc() {
    var pressTimerTime = 1000;

    pressTimer = setTimeout(function () {
      if ($musicScrub.hasClass("go")) {
        $musicScrub.height(0).removeClass("go");
      } else {
        $musicScrub
          .height($musicScrub.find(".contain").innerHeight())
          .addClass("go");
      }
    }, pressTimerTime);
  }

  $musicScrubber.on("input", function () {
    theSong.currentTime = $(this).val();
    clearTimeout(pressTimer);
  });
  
  document.querySelector('#scrubber').addEventListener('input', e => {
    const _t = e.target;
    document.querySelector('body').style.setProperty('--val', `${+_t.value}`);
});

  // MUSIC MODULE - SCROLLING --------------

  // MUSIC MODULE - TRACKS SCROLLING

/*
  $musicContent.scroll(function () {});
  */

  $document.on("click", "#now_playing #about_song .video", function () {
    theSong.pause();
  });

  // MUSIC LYRICS

  $musicHiddenLyrics.each(function () {
    var $this = $(this);
    var trackAttr = $this.attr("data-track");

    $musicGridSongs.each(function () {
      var $this = $(this);
      var trackData = $this
        .attr("data-track")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "");

      if (trackData == trackAttr.toLowerCase().replace(/[^a-zA-Z0-9]/g, "")) {
        $this.attr("data-lyrics", true);
      }
    });
  });

  var lyricsTitleSize = parseInt(
    $("#now_playing #lyrics .heading h1").css("font-size")
  );

  $(document).on(
    "click",
    "#now_playing #lyrics .lyrics [data-explain]",
    function () {
      var $this = $(this);
      $this.addClass("hover").siblings().removeClass("hover");
      var dataExplainValue = $this.data("explain");

      if (dataExplainValue === undefined || dataExplainValue === "") {
        // If the current paragraph doesn't have a value, find the previous one with a value
        var prevParagraphWithVal = $this
          .prevAll("p[data-explain]")
          .filter(function () {
            return (
              $(this).data("explain") !== undefined &&
              $(this).data("explain") !== ""
            );
          })
          .first();

        if (prevParagraphWithVal.length > 0) {
          $notificationIconBody = '<i class="fa-solid fa-music"></i>';
          $notificationBodyText = prevParagraphWithVal.attr("data-explain");
          setNotificationOptions = true;
          $notificationCloseBtnText = "Close";
          openNotification();
        }
      } else {
        $notificationIconBody = '<i class="fa-solid fa-music"></i>';
        $notificationBodyText = $this.attr("data-explain");
        setNotificationOptions = true;
        $notificationCloseBtnText = "Close";
        openNotification();
      }
    }
  );

  $("#now_playing #lyrics .lyrics").scroll(function () {
    var $this = $(this);
    var scrollTop = $this.scrollTop();
    var lyricsHalfHeight = $this.height() / 2; // Calculate half the height

    $this.find(".body p").each(function () {
      var $p = $(this);
      var pTop = $p.position().top;

      // Check if the paragraph's top edge is at or above the halfway point
      if (pTop + $p.outerHeight() <= scrollTop + lyricsHalfHeight) {
        $p.addClass("current");
      } else {
        $p.removeClass("current");
      }
    });
  });

  // MUSIC MODULE - WHATS NEW

  $("#music .whats_new .play-btn").click(function () {
    var $this = $(this);
    var theTrack = $this.attr("data-track");

    $(
      "#music .grid .song[data-track='" +
        theTrack.toLowerCase().replace(/[^a-zA-Z0-9]/g, "") +
        "']"
    ).click();
  });

  //MUSIC MODULE PLAYLISTS

  // MUSIC MODULE - NAVIGATION - TRAVEL BUTTON
  var recordPlayerTimeout;
  $travelBtn.click(function () {
    menuModalClose();
    const $audioAni = $travelBtn.find(".audio_ani");
    clearTimeout(recordPlayerTimeout);
    
    $musicRecordPlayer.removeClass("nodelaytransition");
    
    if ( $(this).find(".audio_ani").hasClass("go") ) {
        $("#flickSite").addClass("go-modal");
        $nowPlayingFlick.flickity("selectCell", 0);
        $("#music").addClass("go-now_playing");
        $("#now_playing").addClass("go");
          $musicRecordPlayer.removeClass("stopspin2");
        $musicRecordPlayerVinyl.removeClass("stopspin");
        $(".mm-menu .open_music_controls-btn").removeClass("go").removeClass("opened");
    } else {
        if ( $("#fun").hasClass("is-selected") ) {
            $("#flickSite").removeClass("go-modal");
            $("#welcomeInfo")
              .outerHeight($("#welcomeInfo").children().outerHeight())
              .addClass("go");
        }
        
        $travelBtn.find("i").removeClass().addClass($(".mm-menu .mm-item.clicked").find("i").attr("class"));
        $("#now_playing").removeClass("go");
        
        if ( $("#music").hasClass("is-selected") ) {
            $("#music").removeClass("go-now_playing");
        $(".mm-menu .open_music_controls-btn").addClass("go");
        }
        
        recordPlayerTimeout = setTimeout(function () {
          $musicRecordPlayerVinyl.addClass("stopspin");
        }, 1000);
    }

    $travelBtn.find("i").toggleClass("fadeOut");
    $travelBtn.find(".audio_ani").toggleClass("go");

    resetLyricsScroll();
  });

  function toggleVinylSpin(isPlaying) {
    const $vinyl = $musicRecordPlayerVinyl;
    $vinyl.addClass("stopspin");
    if (!isPlaying) {
        $musicRecordPlayer.removeClass("stopspin2");
      $vinyl.removeClass("stopspin");
    }
  }

  function resetLyricsScroll() {
    if ($musicLyricsLyrics.scrollTop() > 0) {
      setTimeout(function () {
        $musicLyricsLyrics.scrollTop(0);
      }, 600);
    }
  }

  // FUN MODULE --------------------

  $("#fun .current_section ul h3").each(function () {
    $(this).html("<span>" + $(this).html() + "</span>");
  });

  $("#fun #you .shadow_pfp")
    .height($("#fun .user_info .pfp img").height())
    .width($("#fun .user_info .pfp img").width());

  var startLeft = 0;
  var startTop = 0;
  var startX = 0;
  var startY = 0;
  var initialBackgroundPos = ""; // To store the initial background position

  $fun.on("mousedown touchstart", function (e) {
    var $this = $(this);

    if ($("#flickSite").hasClass("backdrop_reposition")) {
      initialBackgroundPos = $(".pfp_backdrop").css("background-position");
      var bgPos = initialBackgroundPos.split(" "); // Split initial position values

      startLeft = parseInt(bgPos[0], 10); // Extract X position
      startTop = parseInt(bgPos[1], 10); // Extract Y position

      startX =
        e.type === "mousedown" ? e.pageX : e.originalEvent.touches[0].pageX;
      startY =
        e.type === "mousedown" ? e.pageY : e.originalEvent.touches[0].pageY;

      $this.css("cursor", "grabbing");

      $document
        .on("mousemove touchmove", function (event) {
          event.preventDefault();

          var pageX =
            event.type === "mousemove"
              ? event.pageX
              : event.originalEvent.touches[0].pageX;
          var pageY =
            event.type === "mousemove"
              ? event.pageY
              : event.originalEvent.touches[0].pageY;

          var deltaX = pageX - startX;
          var deltaY = pageY - startY;

          // Update background position without affecting the draggable element's position
          $(".pfp_backdrop").css({
            "background-position":
              startLeft + deltaX + "px " + (startTop + deltaY) + "px"
          });
          newBackdropPos =
            startLeft + deltaX + "px " + (startTop + deltaY) + "px";

          $(".mm-menu .pfp_options .reposition_backdrop-btn").html(
            '<i class="fa-solid fa-check"></i> <span>Save</span>'
          );
        })
        .on("mouseup touchend", function () {
          $this.css("cursor", "grab");
          $document.off("mousemove touchmove");
        });
    }
  });

  $(".mm-menu .page_title").click(function () {
    if ($(".open_music_controls-btn").hasClass("go")) {
      if (
        $("#music").hasClass("is-selected") &&
        !$("#now_playing, #about_artist").hasClass("go")
      ) {
        if ($(".open_music_controls-btn").hasClass("opened")) {
          $(".open_music_controls-btn").removeClass("opened");
          $(".mm-menu .search-music").height(0).removeClass("go");
          $("#music_filters").height(0).removeClass("go");
          $("#music_filters button").removeClass("clicked");
          if ($(".mm-menu .lyrics-btn").hasClass("clicked")) {
            $(".mm-menu .lyrics-btn").click();
          }
        } else {
          $(".open_music_controls-btn").addClass("opened");
          $("#music_filters")
            .height($("#music_filters").children().outerHeight())
            .addClass("go");
        }
      }
    }
  });

  $("#fun #you .menu button").click(function () {
    const $this = $(this);
    const title = $this.attr("data-title");

    $("#fun .title h1").text($this.attr("data-title"));
    $fun.attr("data-title", $(this).attr("data-title"));

    if ($(this).attr("data-no-slide") === undefined) {
      $("#fun #you .item[data-title='" + $(this).attr("data-title") + "']")
        .addClass("is-selected")
        .siblings()
        .removeClass("is-selected");
      $("#fun #you .menu").addClass("go_away");
    } else {
      $("#fun #you .menu").removeClass("go_away");
      $("#flickSite").addClass("go-site_settings");
      $("#fun #you .site_settings").scrollTop(0);
    }

    $(this).addClass("picked").siblings().removeClass("picked");
    $(".page_title span").text("Customize > " + $(this).attr("data-title"));

    if ($(this).text() == "Global Settings") {
      $(
        '<button type="button" id="home_settings" style="width:6em;"><i class="fas fa-arrow-left"></i></button>'
      ).insertAfter(".settings-options #cancel_settings");
      setTimeout(function () {
        $("#home_settings").addClass("go");
      }, 100);
    } else {
      if ($("#fun #you .is-selected").attr("data-title") === "Theme") {
        $("#flickSite, .pfp_backdrop.image-upload").addClass("go-pfp");
        $("#fun.go.go-settings .settings .form_option").addClass("dropdown");

        $(".mm-menu .pfp_options")
          .height($(".mm-menu .pfp_options").find(".contain").outerHeight())
          .addClass("go");
      } else {
        $(".mm-menu .pfp_options").height(0).removeClass("go");

        setTimeout(function () {
          $(".mm-menu .pfp_options").scrollLeft(0);
        }, 300);

        $("#flickSite, .pfp_backdrop.image-upload").removeClass("go-pfp go-widgets backdrop_reposition");
        $("#fun .user_info .pfp, .pfp_backdrop.image-upload").removeClass(
          "selected"
        );
        $("#fun.go.go-settings .settings .form_option").removeClass("dropdown");
      }

      $(
        '<button type="button" id="home_settings" style="width:6em;"><i class="fa-solid fa-id-card"></i></button>'
      ).insertAfter(".settings-options #cancel_settings");
      setTimeout(function () {
        $("#home_settings").addClass("go");
      }, 100);
    }
  });

  var file, render;

  const uploadButton = document.getElementById("upload_button");
  const backgroundInput = document.getElementById("background_input");
  const uploadButtonn = document.getElementById("upload_buttonn");
  const backgroundInputt = document.getElementById("background_inputt");

  uploadButton.addEventListener(
    "click",
    () => {
      backgroundInput.click();
      uploadButton.classList.add("active");
      uploadButtonn.classList.remove("active");
    },
    false
  );

  uploadButtonn.addEventListener(
    "click",
    () => {
      backgroundInputt.click();
      uploadButtonn.classList.add("active");
      uploadButton.classList.remove("active");
    },
    false
  );

  function handleFile(file) {
    if (!file.type.match("image.*")) {
      alert("This file isn't an image or it's an unsupported format");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener(
      "load",
      (e) => {
        setTimeout(function () {
          if (uploadButton.classList.contains("active")) {
            $funPFPImg.attr("src", e.target.result);
            $("#fun .settings .pfp").attr("src", e.target.result);
            localStorage.setItem("pfp", e.target.result);

            $("#save_settings").val("Saved!");
            setTimeout(function () {
              $("#save_settings").val("Save");
            }, 600);

            setTimeout(function () {
              if (parseInt($funPFPImg.outerHeight()) >= 201) {
                $funPFPImg.addClass("border_size-small");
              } else {
                $funPFPImg.removeClass("border_size-small");
              }
              setTimeout(function () {
                pfpBackdropHeight();
              }, 200);
            }, 200);
          }

          if (uploadButtonn.classList.contains("active")) {
            $(".pfp_backdrop, .fun_bg").css({
              "background-image": "url(" + e.target.result + ")",
              "background-size": "cover",
              "background-position": "center"
            });

            localStorage.setItem("pfpBackdrop", e.target.result);
            $(".mm-menu .backdrop_filters .filter_item").attr(
              "src",
              e.target.result
            );
            localStorage.setItem("backdrop", true);

            $('.backdrops [data-category="Uploads"]').show();

            $('.backdrops .backdrops_container[data-category="Uploads"]').each(
              function () {
                const imageUrls = e.target.result;
                const existingItem = $(this).find(
                  '.custom_item[data-src="' + imageUrls + '"]'
                );

                if (existingItem.length === 0) {
                  $(this).prepend(
                    '<div class="backdrop_item custom_item" data-src="' +
                      imageUrls +
                      '" style="background-image:url(' +
                      imageUrls +
                      '); background-size:cover; background-position:center;"></div>'
                  );

                  let storedImages =
                    JSON.parse(localStorage.getItem("uploadedImages")) || [];
                  storedImages.push(imageUrls);
                  localStorage.setItem(
                    "uploadedImages",
                    JSON.stringify(storedImages)
                  );
                }
              }
            );

            $("#save_settings").val("Saved!");
            setTimeout(function () {
              $("#save_settings").val("Save");
            }, 600);

            if (
              $(".mm-menu .solid_backdrop-btn span")
                .text()
                .toLowerCase()
                .includes("show")
            ) {
              $(".mm-menu .solid_backdrop-btn").click();
            }
          }
        }, 100);
      },
      false
    );

    reader.readAsDataURL(file);
  }

  document.body.addEventListener(
    "drop",
    (ev) => {
      const droppedFile = ev.dataTransfer.files[0];
      handleFile(droppedFile);
    },
    false
  );

  backgroundInput.addEventListener(
    "change",
    (ev) => {
      const selectedFile = ev.target.files[0];
      handleFile(selectedFile);
    },
    false
  );

  backgroundInputt.addEventListener(
    "change",
    (ev) => {
      const selectedFile = ev.target.files[0];
      handleFile(selectedFile);
    },
    false
  );

  $("#fun .settings .pfp").attr("src", $("#fun .account .pfp img").attr("src"));

  $(".pfp_backdrop")
    .css(
      "background-image",
      $(".pfp_backdrop").css("background-image")
    )
    .outerHeight($("#fun .settings .pfp").outerHeight());

  $document.on(
    "click",
    ".mm-menu .pfp_options [data-action='change pfp']",
    function () {
      uploadButton.click();
    }
  );

  $document.on(
    "click",
    ".mm-menu .pfp_options [data-action='select backdrop']",
    function () {
      if (!$(".mm-menu .backdrops").hasClass("go")) {
        $(".mm-menu .backdrop_filters, .mm-menu .pfp_options")
          .height(0)
          .removeClass("go");

        setTimeout(function () {
          $(".mm-menu .backdrops")
            .outerHeight($(".mm-menu .backdrops").children().outerHeight())
            .addClass("go");
        }, 400);
        $(".mm-menu #home_settings").html('<i class="fas fa-arrow-down"></i>');
      } else {
        $(".mm-menu .backdrops, .mm-menu .backdrop_filters")
          .height(0)
          .removeClass("go");
      }
    }
  );
  
  $document.on(
    "click",
    ".mm-menu .pfp_options [data-action='select widget']",
    function () {
      if (!$(".mm-menu .widgets").hasClass("go")) {
        $(".mm-menu .backdrop_filters, .mm-menu .backdrops, .mm-menu .pfp_options")
          .height(0)
          .removeClass("go");
          
          $("#flickSite").addClass("go-widgets");

        setTimeout(function () {
          $(".mm-menu .widgets")
            .outerHeight($(".mm-menu .widgets").children().height())
            .addClass("go");
        }, 400);
        $(".mm-menu #home_settings").html('<i class="fas fa-arrow-down"></i>');
      } else {
        $(".mm-menu .backdrops, .mm-menu .backdrop_filters, .mm-menu .pfp_options")
          .height(0)
          .removeClass("go");
          
          $("#flickSite").removeClass("go-widgets");
      }
    }
  );

  $document.on(
    "click",
    ".mm-menu .pfp_options [data-action='emojis']",
    function () {
      if (!$(".mm-menu .backdrops").hasClass("go")) {
        $(".mm-menu .sub_sub_modal, .mm-menu .pfp_options")
          .height(0)
          .removeClass("go");

        setTimeout(function () {
          $(".mm-menu .emoji_contain")
            .outerHeight($(".mm-menu .emoji_contain").children().outerHeight())
            .addClass("go");
        }, 400);
        $(".mm-menu #home_settings").html('<i class="fas fa-arrow-down"></i>');
      } else {
        $(
          ".mm-menu .backdrops, .mm-menu .backdrop_filters, .mm-menu .emoji_contain"
        )
          .height(0)
          .removeClass("go");
      }
    }
  );

  $document.on(
    "click",
    ".mm-menu [data-action='change backdrop']",
    function () {
      uploadButtonn.click();
    }
  );

  $document.on("click", ".mm-menu .backdrop_filters .filter_item", function () {
    var filterValue = $(this).attr("data-filterType");
    var $pfpBackdrop = $(".pfp_backdrop.image-upload, .fun_bg");
    
    var classesToRemove = $pfpBackdrop
      .attr("class")
      .split(" ")
      .filter(function (c) {
        return c !== "pfp_backdrop" && c !== "image-upload";
      })
      .join(" ");
      
      $pfpBackdrop.removeClass(classesToRemove);

    if ( $(this).attr("data-filterType") === "colorize" ) {
        $("#flickSite, .pfp_backdrop").addClass("colorize");
    } else {
        $("#flickSite, .pfp_backdrop").removeClass("colorize");
    $pfpBackdrop.addClass(filterValue);
    }

    localStorage.setItem("backdropFilter", filterValue);
  });
  
  $document.on("click", ".mm-menu .widgets button", function() {
      setTimeout(function() {
     if ( $("#widgets .widget").hasClass("go") ) {
         $("#widgets").addClass("go");
     } else {
         $("#widgets").removeClass("go");
     }
      }, 600);
  });
  
  $document.on("click", ".music_widget-btn", function() {
     $(this).find("span:last").text(function(_, text) {
        return text === "Show Music Widget" ? "Hide Music Widget" : "Show Music Widget";
    });
    
    if ( $(this).find("span:last").text() === "Show Music Widget" ) {
        $("#fun .music_widget").removeClass("go");
        localStorage.setItem("show music widget", "false");
    } else {
        $("#fun .music_widget").addClass("go");
        localStorage.setItem("show music widget", "true");
    }
  });

  $("input").on("input change keyup keydown", function (e) {
    if (e.which === 13) {
      e.preventDefault();
      return false;
    }
  });

  $("#nickname").on("input change keyup keydown", function (e) {
    var $this = $(this);
    var letters = /^[A-Za-z\u00C0-\u017F\s'’]+$/;
    var inputValue = $(this).val();

    if (!inputValue.match(letters)) {
      $(this).val(inputValue.replace(/[^A-Za-z\u00C0-\u017F\s'’]/g, ""));
    }

    if (e.which === 13) {
      $this.blur().trigger("blur");

      if ($("#fun #you .item[data-title='Birthday']").length === 0) {
        $("#save_settings").removeClass("deactivate").click();
      } else {
        $funYouFlick.flickity(
          "selectCell",
          "#fun #you .item[data-title='Birthday']"
        );
      }
    }
  });

  $(".birthday_section").on("change", function () {
    if ($("#month").val() !== "Month" && $("#day").val() !== "Day") {
      if (localStorage.getItem("nickname")) {
        $("#save_settings")
          .addClass("active")
          .removeClass("deactivate")
          .val("Save");
      } else {
        if ($("#nickname").val() !== "" && $("#nickname").val() !== " ") {
          $("#save_settings")
            .addClass("active")
            .removeClass("deactivate")
            .val("Save");
        }
      }
    } else {
      $("#save_settings")
        .removeClass("active")
        .addClass("deactivate")
        .val("Saved");
    }
  });

  const funCurrentTop = $funContain.innerHeight() * 3.1;
  $funContain.scroll(function () {
    const $this = $(this);
    var scrollTop = $(this).scrollTop();

    var opacity = 1 - scrollTop / funCurrentPos;

    var scale = 1 - scrollTop / funCurrentPos;
    scale = Math.min(Math.max(scale, 0), 1);

    var theBlur = 0 + scrollTop / funCurrentPos;
    theBlur = Math.min(Math.max(theBlur, 0), 1.5);

    var downward = 30 - scrollTop;

    /*
  $("#fun .current_section ul").each(function() {
      const ulPos = $(this).offset().top;
      $(this).attr("data-pos", ulPos);
  });
  */

    if (scrollTop >= 10) {
      $("#fun .current").css("opacity", 1);
      $("#fun #widgets").addClass("move");
      $("#fun .chevron_container").fadeOut(1000);
      clearTimeout(chevronTime);
    } else {
      $("#fun .current").css("opacity", 0);
      $("#fun #widgets").removeClass("move");
      var chevronTime = setTimeout(function() {
          $("#fun .chevron_container").fadeOut(1000);
      }, 120000);
    }

    $("#fun .user_info").css({
      opacity: opacity,
      transition: "none",
      "transition-delay": "0s"
    });

    if (scrollTop >= funCurrentPos - $("#fun .user_info").height() / 1.6) {
      
      $(".page_title span").text(
        "The Hub"
      );
    } else {
      $welcomeInfo.flickity("selectCell", 0);
      $(".page_title span").text("Home");
    }

    $("#fun .account .pfp button").css({
      transform: "scale(" + scale + ")",
      opacity: opacity
    });

    if (scrollTop < 1) {
      $("#fun .user_info").css({
        opacity: 1
      });

      $("#fun .account .pfp button").css({
        transform: "scale(1)",
        opacity: 1
      });
    }

    $(".pfp_backdrop .blur").css({
      "filter": "blur(" + theBlur + "em)",
      "-webkit-filter": "blur(" + theBlur + "em)",
      "backdrop-filter": "blur(" + theBlur + "em)",
      "-webkit-backdrop-filter": "blur(" + theBlur + "em)"
    });
  });

  $("#fun ul").on("mousewheel", function (event) {
    event.stopPropagation();
  });

  $funSettingsBtn.click(function () {
      closeNotification();
    $("#flickSite, .pfp_backdrop.image-upload").addClass("go-settings");
      $welcomeInfo.flickity("selectCell", 1);

    $(".page_title span, #fun .title h1").text("Customize");
    if ($("#flickSite").hasClass("go-settings")) {
      $funSettings.find("ul").scrollTop(0);
    }
  });

  $saveSettingsBtn.click(function (e) {});

  $notificationOptionsCloseBtn.click(function () {
    if ($(this).text().trim() == "Let me check") {
      $saveSettingsBtn.removeClass("deactivate");
    }
  });

  $cancelSettingsBtn.click(function () {
    $("#home_settings").removeClass("go");
    setTimeout(function () {
      $("#home_settings").remove();
    }, 300);
    $(".pfp_backdrop").css("transition-delay", "0s");
    $("#flickSite, .pfp_backdrop.image-upload").removeClass("go-settings go-site_settings go-sub_modal go-pfp go-widgets");
    $(".mm-menu .backdrops").removeClass("go-menu");
    $(".mm-menu .backdrops_menu").scrollTop(0);
    $("#fun #you .item").removeClass("is-selected");
    $("#fun #you .menu").removeClass("go_away");
    $(".mm-menu .pfp_options").height(0).removeClass("go");
    $welcomeInfo.flickity("selectCell", 0);
    $(".page_title span").text("Home");
    $(".mm-menu #home_settings").html('<i class="fa-solid fa-id-card"></i>');
    $(
      ".mm-menu .backdrop_filters, .mm-menu .backdrops, .mm-menu .sub_sub_modal, .mm-menu .sub_modal, .mm-menu .colors_contain, .mm-menu .emoji_contain"
    )
      .height(0)
      .removeClass("go");
    $(".mm-menu .sub_sub_mmodal").scrollTop(0).scrollLeft(0);
    closeNotification();
    $("#delete_data-btn").text("Delete Profile");
  });

  $document.on("click", "#home_settings", function () {
    var $this = $(this);
    var isActive = $this.html() == '<i class="fa-solid fa-id-card"></i>';
    
    if (isActive) {
        $(".pfp_backdrop.image-upload").removeClass("go-pfp");
      $(".mm-menu .sub_modal").height(0).removeClass("go").scrollTop(0);
      $("#fun #you .item").removeClass("is-selected");
      $("#fun #you .menu").removeClass("go_away");
      $("#flickSite").removeClass("go-site_settings go-sub_modal go-pfp go-widgets");
      $(".page_title span, #fun .title h1").text("Customize");
      $(".mm-menu .sub_modal").flickity("selectCell", 0);
      $(".mm-menu .sub_modal.go *, .mm-menu .pfp_options .contain").scrollLeft(
        0
      );
      
      if ( $("#delete_data-btn").text() !== "Delete Profile" ) {
          $("#delete_data-btn").text("Delete Profile");
          closeNotification();
      }

      removeHomeSettingsBtn();
    } else {
      if ($("#flickSite").hasClass("go-site_settings")) {
        $("#flickSite").removeClass("go-site_settings");
        removeHomeSettingsBtn();
      } else {
        $this.html('<i class="fa-solid fa-id-card"></i>');

        if ($(".mm-menu .sub_sub_modal").hasClass("go")) {
          $(".mm-menu .sub_sub_modal").height(0).removeClass("go");
          $(".mm-menu .pfp_options")
            .height($(".mm-menu .pfp_options").find(".contain").outerHeight())
            .addClass("go");
        }
      }
      
      $("#flickSite").removeClass("go-widgets");
    }
  });

  function removeHomeSettingsBtn() {
    var $homeSettings = $("#home_settings");
    $homeSettings.removeClass("go");
    setTimeout(function () {
      $homeSettings.remove();
    }, 300);
  }


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

  $dataFortune.text(fortune);

  $funFaveHrtChoices.click(function () {
    var $this = $(this);
    $funFaveHrtPicked = $this;
    $funFaveHrtPickedSymbol = $this.find("span").text();
    appendHrt =
      '<div class="fave-hrt"><x>' + $funFaveHrtPickedSymbol + "</x></div>";

    $this.append(
      '<div class="button_effect button_effect-2"><div class="button_effect-circles"></div></div>'
    );

    $("#save_settings").val("Saved!");

    setTimeout(function () {
      $this.addClass("picked").siblings().removeClass("picked");
      setTimeout(function () {
        $this.find(".button_effect").addClass("transition");
        setTimeout(function () {
          $("#save_settings").val("Save");
          $this.find(".button_effect").remove();
        }, 100);
      }, 600);
    }, 100);

    $(".fave-hrt").each(function () {
      $(this).find("x").text($funFaveHrtPickedSymbol);
    });

    $("#fun .settings .emoji_preview").addClass("go");

    setTimeout(function () {
      $("#fun .settings .emoji_preview span").text($funFaveHrtPickedSymbol);

      setTimeout(function () {
        $("#fun .settings .emoji_preview").removeClass("go");
      }, 300);
    }, 300);

    localStorage.setItem("faveHrtPicked", $funFaveHrtPickedSymbol);
  });

  $fun.click(function () {
    if (!$menu.hasClass("go")) {
      $("#fun .settings").removeClass("new_user");
    }
  });

  $("#fun .site_settings [data-options='toggle']").append(
    '<split-section><button type="button" class="btn btn-sm btn-toggle" data-toggle="button" aria-pressed="false" autocomplete="off"><div class="handle"></div></button></split-section>'
  );

  $document.on("click", "#fun .site_settings .btn-toggle", function () {
    let dataSetting = $(this).parents("section").attr("data-setting");
    const shuffleMembers = dataSetting === "shuffle members";
    const shuffleArtists = dataSetting === "shuffle artists";
    const autoShowScrubber = dataSetting === "show scrubber";
    const showBackdrop = dataSetting === "show backdrop";
    const openMusicApp = dataSetting === "open music";
    const openHubApp = dataSetting === "open hub";
    const showMenuNames = dataSetting === "show menu names";

    if ($(this).hasClass("active")) {
      if (openMusicApp) {
        $musicBtn.click();
        localStorage.setItem("openMusicApp", "true");
      }

      if (shuffleMembers) {
        setTimeout(updateSettings, 100);
        localStorage.setItem("shuffleMembers", "true");
      }

      if (shuffleArtists) {
        setTimeout(updateSettings, 100);
        localStorage.setItem("shuffleArtists", "true");
      }

      if (autoShowScrubber) {
        setTimeout(updateSettings, 100);
        localStorage.setItem("autoShowMusicScrubber", "true");
      }

      if (showMenuNames) {
        setTimeout(updateSettings, 100);
        localStorage.setItem("showMenuNames", "true");
      }

      if (showBackdrop) {
        setTimeout(updateSettings, 100);
        localStorage.setItem("showBackdrop", "true");
      }
    } else {
      if (openMusicApp) {
        localStorage.setItem("openMusicApp", "false");
      }

      if (shuffleMembers) {
        localStorage.setItem("shuffleMembers", "false");
      }

      if (shuffleArtists) {
        localStorage.setItem("shuffleArtists", "false");
      }

      if (autoShowScrubber) {
        localStorage.setItem("autoShowMusicScrubber", "false");
      }

      if (showMenuNames) {
        $(".mm-menu").removeClass("title-tag-active");
        localStorage.setItem("showMenuNames", "false");
      }
    }
  });

  if (localStorage.getItem("shuffleMembers") === "true") {
    $("#fun .site_settings [data-setting='shuffle members'] .btn-toggle")
      .attr("aria-pressed", "true")
      .addClass("active");
  } else {
    $("#fun .site_settings [data-setting='shuffle members'] .btn-toggle")
      .attr("aria-pressed", "false")
      .removeClass("active");
  }

  if (localStorage.getItem("shuffleArtists") === "true") {
    $("#fun .site_settings [data-setting='shuffle artists'] .btn-toggle")
      .attr("aria-pressed", "true")
      .addClass("active");
  } else {
    $("#fun .site_settings [data-setting='shuffle artists'] .btn-toggle")
      .attr("aria-pressed", "false")
      .removeClass("active");
  }

  if (localStorage.getItem("autoShowMusicScrubber") === "true") {
    $("#fun .site_settings [data-setting='show scrubber'] .btn-toggle")
      .attr("aria-pressed", "true")
      .addClass("active");
  } else {
    $("#fun .site_settings [data-setting='show scrubber'] .btn-toggle")
      .attr("aria-pressed", "false")
      .removeClass("active");
  }

  if (localStorage.getItem("showBackdrop") === "true") {
    $("#fun .site_settings [data-setting='show backdrop'] .btn-toggle")
      .attr("aria-pressed", "true")
      .addClass("active");
  } else {
    $("#fun .site_settings [data-setting='show backdrop'] .btn-toggle")
      .attr("aria-pressed", "false")
      .removeClass("active");
  }

  if (localStorage.getItem("openMusicApp") === "true") {
    $("#fun .site_settings [data-setting='open music'] .btn-toggle")
      .attr("aria-pressed", "true")
      .addClass("active");
  } else {
    $("#fun .site_settings [data-setting='open music'] .btn-toggle")
      .attr("aria-pressed", "false")
      .removeClass("active");
  }

  if (localStorage.getItem("showMenuNames") === "true") {
    $("#fun .site_settings [data-setting='show menu names'] .btn-toggle")
      .attr("aria-pressed", "true")
      .addClass("active");
  } else {
    $("#fun .site_settings [data-setting='show menu names'] .btn-toggle")
      .attr("aria-pressed", "false")
      .removeClass("active");
  }

  function updateSettings() {
    if (
      localStorage.getItem("glowingPFP") === "true" ||
      $("#fun .pfp img").hasClass("glow")
    ) {
      $("#fun .pfp img").addClass("glow");
    } else {
      $("#fun .pfp img").removeClass("glow");
    }

    if (
      localStorage.getItem("roundedPFP") === "true" ||
      $("#fun .pfp img").hasClass("rounded")
    ) {
      $("#fun .pfp img").addClass("rounded");
    } else {
      $("#fun .pfp img").removeClass("rounded");
    }

    if (
      $("#fun .site_settings [data-setting='open music'] .btn-toggle").hasClass(
        "active"
      )
    ) {
        setTimeout(function() {
      $musicBtn.click();
        }, 4000);
    }

    if (
      $(
        "#fun .site_settings [data-setting='show scrubber'] .btn-toggle"
      ).hasClass("active")
    ) {
      if ($(".mm-menu .music_bar").hasClass("is-selected")) {
        $musicScrub
          .height($musicScrub.find(".contain").innerHeight())
          .addClass("go");
      } else {
        $(".mm-menu #scrub").height(0).addClass("go");
      }
    } else {
      $(".mm-menu #scrub").height(0).removeClass("go");
    }

    if (
      $(
        "#fun .site_settings [data-setting='show menu names'] .btn-toggle"
      ).hasClass("active")
    ) {
      $(".mm-menu").addClass("title-tag-active");
    } else {
      $(".mm-menu").removeClass("title-tag-active");
    }
  }

  setTimeout(updateSettings, 100);

  /*
$("#fun .shadow_pfp").click(function() {
       $("#flickSite").removeClass("backdrop_reposition");

    setTimeout(function() {
    $(".mm-menu .pfp_options .edit_pfp-btn").attr("data-action", "change pfp").find("span").text("Avatar");
       $(".mm-menu .pfp_options [for='pfp'], .mm-menu .pfp_options .edit_pfp-btn").show();
    $(".mm-menu .pfp_options [for='backdrop']").hide();

    if (localStorage.getItem("hidePFP") === "true") {
    $(".mm-menu .pfp_options .hide_pfp-btn").html('<i class="fa-solid fa-eye"></i> <span>Show</span>');
    $(".mm-menu .pfp_options [for='pfp'], .mm-menu .pfp_options .edit_pfp-btn").not(".mm-menu .pfp_options .hide_pfp-btn").hide();
}
    }, 250);
});

$("#fun .shadow_backdrop").click(function() {
    setTimeout(function() {
    $(".mm-menu .pfp_options .edit_pfp-btn").attr("data-action", "change backdrop").find("span").text("Wallpaper");
    $(".mm-menu .pfp_options [for='backdrop'], .mm-menu .pfp_options .edit_pfp-btn").not("reposition_backdrop-btn").show();
    $(".mm-menu .pfp_options [for='pfp']").hide();

if (localStorage.getItem("backdrop") === "false") {
    $(".mm-menu .pfp_options .solid_backdrop-btn").html('<i class="fa-solid fa-image"></i> <span>Image</span>');
    $(".mm-menu .pfp_options .reposition_backdrop-btn, .mm-menu .pfp_options .cover_backdrop-btn").hide();
} else {
    if (localStorage.getItem("coverBackdrop") === "true") {
   $(".mm-menu .pfp_options .cover_backdrop-btn").html('<i class="fa-solid fa-arrows-to-dot"></i> <span>Auto</span>');
   $(".mm-menu .pfp_options .reposition_backdrop-btn").hide();
} else {
    $(".mm-menu .pfp_options .cover_backdrop-btn").html('<i class="fa-solid fa-maximize"></i> <span>Cover</span>');
   $(".mm-menu .pfp_options .reposition_backdrop-btn").show();
}
}
    }, 250);
});
*/

  $document.on(
    "click",
    ".mm-menu [data-action]:not(.edit_pfp-btn)",
    function () {
      const $this = $(this);
      const action = $this.data("action");
      const which = $this.find("span").text();
      const $pfpImg = $("#fun .user_info .pfp img");
      const $pfpOptions = $(".mm-menu .pfp_options");
      const $backdrops = $(".mm-menu .backdrops");
      const $backdropFilters = $(".mm-menu .backdrop_filters");
      const $backdropImg = $(".pfp_backdrop.image-upload");
      const $buttons = $(
        ".mm-menu .reposition_backdrop-btn, .mm-menu .backdrop_filters-btn"
      );
      const $homeSettings = $(".mm-menu #home_settings");

      switch (action) {
        case "colors":
          if (!$(".mm-menu .colors_contain").hasClass("go")) {
            $(".mm-menu .sub_sub_modal, .mm-menu .pfp_options")
              .height(0)
              .removeClass("go");

            setTimeout(function () {
              $(".mm-menu .colors_contain")
                .outerHeight(
                  $(".mm-menu .colors_contain").children().outerHeight()
                )
                .addClass("go");
            }, 400);
            $(".mm-menu #home_settings").html(
              '<i class="fas fa-arrow-down"></i>'
            );
          }

          $("#flickSite").addClass("go-sub_modal");
          $(".mm-menu .colors_contain").addClass("go");
          $homeSettings.html('<i class="fas fa-arrow-down"></i>');
          break;

        case "glowing pfp":
          const isGlowing = which === "Glow";
          $pfpImg.toggleClass("glow", isGlowing);
          localStorage.setItem("glowingPFP", isGlowing);
          $(".mm-menu .pfp_options .glow_pfp-btn").html(
            isGlowing
              ? '<i class="fa-solid fa-circle"></i> <span>Plain</span>'
              : '<i class="fa-solid fa-splotch"></i> <span>Glow</span>'
          );
          break;

        case "rounded pfp":
          const isRounded = which === "Round";
          $pfpImg.toggleClass("rounded", isRounded);
          localStorage.setItem("roundedPFP", isRounded);
          $(".mm-menu .pfp_options .rounded_pfp-btn").html(
            isRounded
              ? '<i class="fa-solid fa-square-full"></i> <span>Corners</span>'
              : '<i class="fa-solid fa-circle-user"></i> <span>Round</span>'
          );
          break;

        case "solid backdrop":
          const isShowing = $this.html() !== '<i class="fa-solid fa-fill"></i>';

          setTimeout(() => {
            $backdropImg.toggleClass("solid", !isShowing);
          }, 300);

          $this.html(
            isShowing
              ? '<i class="fa-solid fa-fill"></i>'
              : '<i class="fa-solid fa-image"></i>'
          );
          $buttons.toggle(isShowing);
          localStorage.setItem("backdrop", isShowing);

          setTimeout(() => {
            $backdrops
              .outerHeight($backdrops.children().outerHeight())
              .addClass("go");
          }, 900);
          break;

        case "filter backdrop":
          $("#flickSite").addClass("go-sub_modal");
          $pfpOptions.height(0).removeClass("go");

          setTimeout(() => {
            $backdropFilters
              .outerHeight($backdropFilters.children().outerHeight())
              .addClass("go");
          }, 400);

          $homeSettings.html('<i class="fas fa-arrow-down"></i>');
          break;

        case "repo backdrop":
          $("#flickSite").addClass("go-sub_modal");
          $pfpOptions.height(0).removeClass("go");

          setTimeout(() => {
            $(".mm-menu .backdrop_position-settings")
              .outerHeight(
                $(".mm-menu .backdrop_position-settings")
                  .children()
                  .outerHeight()
              )
              .addClass("go");
          }, 400);

          $homeSettings.html('<i class="fas fa-arrow-down"></i>');
          break;

        case "hide pfp":
          const isHidden = which === "Hide";
          $(
            ".mm-menu .pfp_options [for='pfp'], .mm-menu .pfp_options .edit_pfp-btn"
          )
            .not($this)
            .toggle(!isHidden);
          $("#fun .account .pfp").toggleClass("invisible", isHidden);
          localStorage.setItem("hidePFP", isHidden);
          $(".mm-menu .pfp_options .hide_pfp-btn").html(
            isHidden
              ? '<i class="fa-solid fa-eye"></i> <span>Show</span>'
              : '<i class="fa-solid fa-eye-slash"></i> <span>Hide</span>'
          );
          break;
      }

      if ($backdrops.hasClass("go") && action !== "select backdrop") {
        $backdrops.add($backdropFilters).height(0).removeClass("go");
        $welcomeInfo
          .outerHeight($welcomeInfo.children().outerHeight())
          .addClass("go");
        $(".mm-menu .pfp_options [data-action='select backdrop']").html(
          '<i class="fa-regular fa-image"></i> <span>Backdrops</span>'
        );
      }
    }
  );

  $(document).on(
    "click",
    ".mm-menu .backdrop_item, #get_started .backdrop_item",
    function () {
      var srcc = $(this).attr("data-src");
      var color = $(this).attr("data-color");

      if (!$(this).hasClass("picked")) {
        $(".backdrops").removeClass("go-menu");
        $(".mm-menu .backdrops_menu").scrollTop(0);

        $(this).addClass("picked").siblings().removeClass("picked");

        if (
          $(".mm-menu .pfp_options .solid_backdrop-btn span")
            .text()
            .toLowerCase()
            .includes("show")
        ) {
          $(".mm-menu .pfp_options .solid_backdrop-btn").click();

          setTimeout(function () {
            $(".mm-menu .backdrops")
              .outerHeight($(".mm-menu .backdrops").children().outerHeight())
              .addClass("go");
          }, 2300);
        }

        if ($(this).data("color") !== undefined) {
          $(":root")[0].style.setProperty("--pink", color);
          localStorage.setItem("favColor", color);
        }

        $(".pfp_backdrop, .mm-menu").addClass("change");

        setTimeout(function () {
          $(".pfp_backdrop").css({
            "background-image": "url(" + srcc + ")"
          });
          localStorage.setItem("pfpBackdrop", srcc);

          $(".mm-menu .backdrop_filters .filter_item").css(
            "background-image",
            "url('" + "https://res.cloudinary.com/treesh/image/fetch/w_200/" + srcc + "')"
          );

          setTimeout(function () {
            $(".pfp_backdrop").removeClass("change");

            setTimeout(function () {
              $(".mm-menu").removeClass("change");
            }, 1000);
          }, 300);
        }, 300);
      }
    }
  );

  $(".mm-menu .mm-item.ping").click(function () {
    var clickedIndex = $(this).index();
    $(this).removeClass("ping");

    var clickedPings = localStorage.getItem("clickedPingspp");
    if (!clickedPings) {
      clickedPings = [];
    } else {
      clickedPings = JSON.parse(clickedPings);
    }
    clickedPings.push(clickedIndex);
    localStorage.setItem("clickedPingspp", JSON.stringify(clickedPings));
  });

  // GLOBAL FUNCTIONS -------------------------------------

  // MENU BAR
  
  var iconClickTime = 0;
  var funClickTime = 0;
  var musicClickTime = 0;
  var pageTime = 0;
  
  $navBarItem.click(function (e) {
    e.preventDefault();
    let $this = $(this);
    let forThis = $this.attr("for");
    var ifMenuOpenAlready = 0;

    if (isClickable) {
      if (!$this.hasClass("clicked")) {
          if ( $("#fun .fun_music .options").hasClass("opened") ) {
              $("#fun .fun_music .options .options-btn").click();
          }
          
          $travelBtn.find("i").removeClass().addClass($(this).find("i").attr("class"));
          
          if ( $("#about_artist").hasClass("go") ) {
              $("#about_artist .close-about_artists-btn").click();
              pageTime = 300;
          }
          
        $(".page_title span").text($this.attr("data-title"));

        isClickable = false;

        $this.addClass("clicked").siblings().removeClass("clicked");

        setTimeout(function () {
          isClickable = true;
        }, 1000);

/*
        if ($(".site_page").hasClass("is-selected")) {
          $(".site_page").removeClass("is-selected");

          setTimeout(function () {
            $(".site_page .content, .site_page .contain, .site_page").scrollTop(0);
          }, 300);
        }
        */

        $travelBtn.find("i").addClass("fadeOut");
        $travelBtn.find(".audio_ani").addClass("go");

        // Go to this page
     
    $flickSite.flickity("selectCell", $this.index());


        // If Fun button
setTimeout(function() {
        if ($this.hasClass("fun-btn")) {
            $notificationStatus = "fun";
          // If Fun is Open and Settings Open

          if ($("#fun").hasClass("is-selected") && !$("#flickSite").hasClass("go-settings")) {
            $(".page_title span").text($this.attr("data-title"));
          } else if (
            $("#fun").hasClass("is-selected") &&
            $("#flickSite").hasClass("go-settings")
          ) {
            $(".page_title span").text(
              "Customize > " + $("#fun #you .menu .picked").attr("data-title")
            );
          }
          
          
          
          /*
          $("#flickSite").removeClass("go-modal");
          
          
          $(".site_page").removeClass("is-selected").removeClass("go");
          */

          $menu.outerHeight(0).removeClass("go");

          setTimeout(function () {
            $("#welcomeInfo")
              .outerHeight($("#welcomeInfo").children().outerHeight())
              .addClass("go");
          }, 1000);
        } else {
          if ($("#welcomeInfo").hasClass("go")) {
            $("#welcomeInfo").outerHeight(0).removeClass("go");
          }
          $(".mm-menu .sub_modal").outerHeight(0).removeClass("go");
          $welcomeInfo.flickity("selectCell", 0);

          if ($("#flickSite").hasClass("go-settings")) {
            $cancelSettingsBtn.click();
          }

/*
          $("#flickSite").addClass("go-modal");
          */

          setTimeout(function () {
            if ($("#welcomeInfo").hasClass("go")) {
              $("#welcomeInfo").removeClass("go");
            }
          }, 600);
        }

        // If Music button
$("#now_playing").removeClass("go");

        if ($this.hasClass("music_player-btn")) {
      
            if (!localStorage.getItem("learnedMusic")) {
      $notificationIconBody = '<i class="fa fa-music"></i>';
      $notificationBodyText =
        "<h1>Welcome to <b>Treesh Music</b>!</h1> <p>Discover the hottest new, up-and-coming music artists from around the globe. Learn new lyrics, view music videos and explore new territory.</p>";
      setNotificationOptions = true;
      $notificationCloseBtnText = "Explore";

                $notificationStatus = "music";
      setTimeout(function () {
        openNotification();
      }, 1000);
    }
            
          nowPlayingScreen = true;
          
          var openMusicPlayerApp = function() {
    $("#music").addClass("is-selected").addClass("go");
    $(".mm-menu .open_music_controls-btn").addClass("go");
};

if ( $("#fun").hasClass("is-selected") ) {
    setTimeout(function() {
        openMusicPlayerApp();
    }, 600);
} else {
    openMusicPlayerApp();
}
          
          setTimeout(function() {
      $("#music").removeClass("go-now_playing");
      }, 1000);

        } else {

          $(".mm-menu .open_music_controls-btn")
            .removeClass("go")
            .removeClass("opened");
        }

        // If Icons button

        if ($this.hasClass("members-btn")) {
            if ( iconClickTime === 0 ) {
            $members
        .children()
        .not(".og")
        .each(function () {
          $members.append($(this).detach());
        });

      var shuffledMembers = $members
        .children()
        .not(".og")
        .toArray()
        .sort(function () {
          return 0.5 - Math.random();
        });

      $members.append(shuffledMembers);
      iconClickTime = 1;
            }
      
      
            if (!localStorage.getItem("learnedIcons")) {
      $notificationIconBody = '<i class="fa fa-people-group"></i>';
      $notificationBodyText =
        "<h1>Welcome our <b>Treesh Icons</b>!</h1> <p>View our amazing <b>Icons</b> who are part of the <b>Treesh</b> greatness! Follow them on their respective social medias and learn more about them!</p>";
      setNotificationOptions = true;
      $notificationCloseBtnText = "View Icons";

                $notificationStatus = "icons";
      setTimeout(function () {
        openNotification();
      }, 1000);
    }

          $(".mm-menu .modal.go").outerHeight(0).removeClass("go");
        }
        pageTime = 0;
    }, pageTime);

        /*
   // If Music is currently playing, change view
   if ( $music.hasClass("go-now_playing") ) {
       $music.removeClass("go-now_playing");
       $("#now_playing").removeClass("go");
   }
   */
      }
    } else {
      return;
    }
  });

  var btnTransDelay = parseInt($menuButtons.css("transition-delay"));

  $menuButtons.each(function (index) {
      const $this = $(this);
      var transitionDelay = index * 10;
      $this.css("transition-delay", "0." + transitionDelay + "s !important;");
    }).click(function () {
      if ($(this).hasClass("like-btn")) {
        if ($music.hasClass("go")) {
          likeTrack();
        }
      }

      if ($(this).hasClass("delete-btn")) {
        if ($music.hasClass("go")) {
          deleteTrack();
        }
      }
    });

  function likeTrack() {
    menuModalClose();

    var $selectedItem = selectedItemMenu;
    var faveTrackName = $selectedItem.attr("data-track");
    var trackWholeName = $selectedItem.find("h2").text();
    var songPic = $selectedItem.attr("data-coverart");
    var songArtist = $selectedItem.find("song-info-tag h3").text();
    
    if (!$dataFavoriteSong.find("[data-song='" + faveTrackName + "']").length) {
      $selectedItem.addClass("liked").append(appendHrt);

      if (!$dataFavoriteSong.find("ol").length) {
        $dataFavoriteSong.empty();
      }

      setTimeout(function () {
        $selectedItem.find(".fave-hrt").addClass("go");

        if (
          !$dataFavoriteSong.find("[data-song='" + faveTrackName + "']").length
        ) {
          $dataFavoriteSong.prepend(
            '<ol data-song="' +
              faveTrackName +
              '"><li><img src="' +
              songPic +
              '" /></li><li class="quote">' +
              trackWholeName +
              "</li><li>"+ songArtist +"</li></ol>"
          );
        }
      }, 100);

      $notificationIconBody = '<i class="fa fa-music"></i>';
      $notificationBodyText =
        "You've picked '<b>" + trackWholeName + "</b>' by <b>"+ songArtist +"</b> as your new favorite!";
    } else {
      $selectedItem.find(".fave-hrt").removeClass("go");
      setTimeout(function () {
        $selectedItem.find(".fave-hrt").remove();
      }, 300);

      $notificationIconBody = '<i class="fa fa-music"></i>';
      $notificationBodyText =
        "Seems you feel different about '<b>" + trackWholeName + "</b>'!";
      $dataFavoriteSong.find("[data-song='" + faveTrackName + "']").remove();
    }

    setTimeout(function () {
      localStorage.setItem("favSong", $dataFavoriteSong.html());
    }, 101);

    setNotificationOptions = false;
    notificationTimer = 6000;
    openNotification();
  }
  
  
                $("#about_song #toggle-heart").change(function() {
    var $this = $(this);
    selectedItemMenu = $("#music .grid .song[data-track='"+ $("#now_playing").attr("data-track") +"']");
    var likeText = $("#about_song .song_options ul:first p");
    
    if ($this.is(":checked")) {
        likeText.text("Favorited");
    } else {
        likeText.text("Favorite");
    }
    
    
    likeTrack();
});


  function deleteTrack() {
    var $selectedItem = selectedItemMenu;
    var deletedTrackName = $selectedItem.attr("data-track");
    var trackWholeName = $selectedItem.find("h2").text();
    var songPic = $selectedItem.find(".coverart").attr("src");
    var songArtist = $selectedItem.find("song-info-tag h3").text();

    $selectedItem.addClass("delete");
    $(".mm-menu .menu").outerHeight(0).removeClass("go");

    setTimeout(function () {
      $selectedItem.remove();

      setTimeout(function () {
        $grid.isotope("remove", $selectedItem).isotope("layout");

        if (
          !$dataDeletedSong.find("[data-song='" + deletedTrackName + "']")
            .length
        ) {
          $dataDeletedSong.prepend(
            '<ol data-song="' +
              deletedTrackName +
              '"><li><img src="' +
              songPic +
              '" /></li><li class="quote">' +
              trackWholeName +
              "</li><li>"+ songArtist +"</li></ol>"
          );
        }

        localStorage.setItem("deletedSong", $dataDeletedSong.html());
      }, 100);
    }, 600);

    $notificationIconBody = '<i class="fa fa-music"></i>';
    $notificationBodyText =
      "Aww. You've deleted <b>\"" + trackWholeName + '"</b> by <b>'+ songArtist +'</b> from your music.';
    setNotificationOptions = false;
    notificationTimer = 6000;
    openNotification();

    if ($dataDeletedSong.find(".nothing_here").length) {
      $dataDeletedSong.empty();
    }
  }

  $(".mm-menu .share-btn").click(function () {
    $(".mm-menu .main-menu")
      .addClass("deactivate")
      .removeClass("go")
      .siblings()
      .removeClass("deactivate")
      .addClass("go");
  });

  $(".mm-menu .share-back-btn").click(function () {
    $(".mm-menu .share-links")
      .addClass("deactivate")
      .removeClass("go")
      .siblings()
      .removeClass("deactivate")
      .addClass("go");
  });

  var theLink = "https://treesh.life/";
  $(".mm-menu .share_link").on("click", function () {
    var $this = $(this);
    if ($this.attr("for") === "copy") {
      var textToCopy = $("#music .grid .selected-menu").attr("data-href");
      var textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      document.execCommand("copy");
      document.body.removeChild(textArea);
      $notificationIconBody = '<i class="fa fa-music"></i>';
      $notificationBodyText =
        "The link has been copied. Go share it with others!";
      setNotificationOptions = false;
      notificationTimer = 6000;
      openNotification();
    } else {
      if ($this.attr("for") === "message") {
        theLink =
          'sms:?body=I just listened to the hottest track called "' +
          encodeURIComponent(
            $("#music .grid .selected-menu").find("h2").text()
          ) +
          '" by ' +
          encodeURIComponent(
            $("#music .grid .selected-menu").find("h3").text()
          ) +
          ". Check it out - " +
          encodeURIComponent(
            $("#music .grid .selected-menu").attr("data-href")
          );
      }
      if ($this.attr("for") === "email") {
        theLink =
          "mailto:?subject=Check%20out%20this%20track&body=I%20just%20listened%20to%20the%20hottest%20track%20called%20%22" +
          encodeURIComponent(
            $("#music .grid .selected-menu").find("h2").text()
          ) +
          "%22%20by%20" +
          encodeURIComponent(
            $("#music .grid .selected-menu").find("h3").text()
          ) +
          ".%20Check%20it%20out%20-%20" +
          encodeURIComponent(
            $("#music .grid .selected-menu").attr("data-href")
          );
      }

      window.open(theLink, "_blank");
    }
  });

  /*
     $("#icons #header [data-href]").click(function() {
         var theLink = $(this).attr("data-href");
         window.open(theLink, '_blank');
     });
     */
  
  
  $document.on("click", "[data-favorite-artist] [data-artist]", function () {
    var $this = $(this);
    var artistName = $this.find("li").text();
    
    if ( !$("#fun .fun_music").find(".cancel-btn").length ) {
    $("#music .artists .artist").each(function() {
       if ( $(this).find(".artist__label p:first").text() === artistName ) {
           $(this).click();
       } 
    });
    }
  });
  
  $document.on("click", "[data-for]:not([data-favorite-artist]) ol", function () {
    var $this = $(this);
    var songName = $this.attr("data-song");

if ( !$("#fun .fun_music").find(".cancel-btn").length ) {
    $("#music .grid .song[data-track='"+ songName +"']").click();
}
  });
  
  $("#fun .fun_music .options").on("click", ".remove-btn", function() {
      var numOfRemoved = $("#fun .fun_music .fun_music-content").find(".active .delete").length;
      var nameOfContent = $("#fun .fun_music .title .active").text();
      
      if ( $("#fun .fun_music .fun_music-content .active ol.delete").length ) {
          if ( $("#fun .fun_music .fun_music-content [data-for='Deleted Songs']").hasClass("active") ) {
              $notificationBodyText =
      "You've removed <b>" + numOfRemoved + "</b> items from your "+ nameOfContent + ". <b>Restart the app</b> to view them in the <b>Music</b> app again.";
          } else {
              $notificationBodyText =
      "You've removed <b>" + numOfRemoved + "</b> items from your "+ nameOfContent + ".";
          }
          
          $("#fun .fun_music .fun_music-content .active .delete:not([data-artist])").each(function() {
    var trackName = $(this).attr("data-song"); 
    $("#music .grid .song[data-track='" + trackName + "']").removeClass("liked").find(".fave-hrt").remove();
});

$("#fun .fun_music .fun_music-content [data-favorite-artist].active .delete").each(function() {
    var artistName = $(this).attr("data-artist"); 
    $("#music .artists .artist[data-name='" + artistName + "']").removeClass("liked").find(".fave-hrt").remove();
});

          
     $notificationIconBody = '<i class="fa fa-music"></i>';
    setNotificationOptions = false;
    notificationTimer = 6000;
    openNotification();
      }
  });


  // GLOBAL FUNCTIONS - MUSIC MODULE - AUDIO CONTROLS

  // repeat song

  function repeat() {
    $repeatBtn.toggleClass("color");
    var $mostRepeatedSong = $musicGrid.find("ul.play");
    var songTrack = $mostRepeatedSong.attr("data-track");
    var songCoverArt = $mostRepeatedSong.find(".coverart").attr("src");
    var songName = $mostRepeatedSong.find("h2").text();
  }

  // previous song
  var currentIndex = 0;

  function prevSong() {
    var $trackPlaying = $("#music .grid .song.play");
    var trackPlayingName = $nowPlaying.attr("data-track");
    var inLastPlayedList = "[data-song='" + trackPlayingName + "']";
    var secondInLastPlayedListName = $dataLastPlayedSong
      .find("[data-song]")
      .eq(1)
      .attr("data-song");
    var $selectPrevSong = $musicGrid.find(
      "ul[data-track='" + secondInLastPlayedListName + "']"
    );
    var songArtist = $("#now_playing .song_data h2").text();
    
    $("#fun #widgets").find(".audio_ani").removeClass("go");

    if ($("#music").hasClass("go")) {
      nowPlayingScreen = true;
    } else {
      nowPlayingScreen = false;
    }

    if (theSong.currentTime <= 10 && !$("#repeat").hasClass("color")) {
        if ( $("#now_playing").hasClass("go") ) {
            $("#now_playing.go .song_data").addClass("fade");
            
            setTimeout(function() {
                $("#now_playing.go .song_data").removeClass("fade");
            }, 600);
        }
        
      if (!$dataPreviousSong.find("ol").length) {
        $dataPreviousSong.empty();
      }

      if (
        $dataPreviousSong.find("[data-song='" + trackPlayingName + "']").length
      ) {
        $dataPreviousSong.prepend(
          $dataPreviousSong.find("[data-song='" + trackPlayingName + "']")
        );
      } else {
        $dataPreviousSong.prepend(
          '<ol data-song="' +
            trackPlayingName +
            '"><li><img src="' +
            thumbnail +
            '" /></li><li class="quote">' +
              songName +
              "</li><li>"+ songArtist +"</li></ol>"
        );
      }

      if (!$dataLastPlayedSong.find("ol").length) {
        $dataLastPlayedSong.html("<span class='nothing_here'>Nothing here!</span>");
      } else {
        $dataLastPlayedSong
          .find(inLastPlayedList)
          .appendTo($dataLastPlayedSong);
        $selectPrevSong.click();

        if (!$dataLastPlayedSong.find("ol").length) {
          $dataLastPlayedSong.html("<span class='nothing_here'>Nothing here!</span>");
        }
      }

    } else {
      theSong.currentTime = 0;
    }
  }

  // next song

  function nextSong() {
    var $trackPlaying = $("#music .grid .song.play");
    var trackPlayingName = $nowPlaying.attr("data-track");
    var inPrevSongList = "[data-song='" + trackPlayingName + "']";
    var firstInPrevSongListName = $dataPreviousSong
      .find("[data-song]")
      .eq(0)
      .attr("data-song");
    var $selectNextSong;
    
    $("#fun #widgets").find(".audio_ani").removeClass("go");

    if ($("#music").hasClass("go")) {
      nowPlayingScreen = true;
    } else {
      nowPlayingScreen = false;
    }

    if (!$("#repeat").hasClass("color")) {
        
        if ( $("#now_playing").hasClass("go") ) {
            $("#now_playing.go .song_data").addClass("fade");
            
            setTimeout(function() {
                $("#now_playing.go .song_data").removeClass("fade");
            }, 600);
        }
        
      if ($dataPreviousSong.find("[data-song]").length === 0) {
        $selectNextSong = randomSong;
        $dataPreviousSong.html("<span class='nothing_here'>Nothing here!</span>");
      } else {
        $selectNextSong = $musicGrid.find(
          "ul[data-track='" + firstInPrevSongListName + "']"
        );
        $dataPreviousSong.find("[data-song]:first").remove();

        if ($dataPreviousSong.find("[data-song]").length === 0) {
          $dataPreviousSong.empty().text("None");
        }
      }

      $selectNextSong.click();
    } else {
      theSong.currentTime = 0;
    }
  }

  // song play/pause function

  function playSong() {
    playing = true;
    $playPauseBtn.removeClass("fa-play").addClass("fa-pause");
    theSong.play();
    $playPause.addClass("playing").removeClass("paused");
    $musicBarInfo.addClass("go");
    $musicRecordPlayer.removeClass("stopspin2");
    $musicRecordPlayerVinyl.removeClass("stopspin");
    
    $("#fun #widgets").find(".audio_ani").addClass("go");
    
    $("#fun #widgets .music_widget").addClass("playing");

    if (!$music.hasClass("go")) {
      $travelBtn.find(".audio_ani").addClass("go");
      $travelBtn.find("i").addClass("fadeOut");
    }
  }

  function pauseSong() {
    playing = false;
    $playPause.addClass("paused").removeClass("playing");
    $playPauseBtn.removeClass("fa-pause").addClass("fa-play");
    theSong.pause();
    $musicBarInfo.removeClass("go");
    $musicRecordPlayerVinyl.addClass("stopspin");
    
    $("#fun #widgets .music_widget").removeClass("playing");
    $("#fun #widgets").find(".audio_ani").removeClass("go");

    if (!$music.hasClass("go")) {
      $travelBtn.find(".audio_ani").removeClass("go");
      $travelBtn.find("i").removeClass("fadeOut");
    }
  }

  function musicInfo() {
    var seenValues = {};

    $dataLastPlayedSong.find("[data-song]").each(function () {
      const $this = $(this);
      var value = $this.attr("data-song");
      var theName = $this.text();

      if (seenValues[value] || seenValues[theName]) {
        $this.remove();
      } else {
        seenValues[value] = true;
        seenValues[theName] = true;
      }
    });

    musicInfoGo = setTimeout(function () {
      $musicBarInfo.addClass("go-label");

      removeLabelTime = setTimeout(function () {
        $musicBarInfo.removeClass("go-label");
        musicInfo();
      }, 6000);
    }, 12000);
  }

  var resizeWindow = true;

  $window.resize(function () {
    resizeWindow = true;
    windowResize();
  });

  function windowResize() {
    clearTimeout(windowResizeTimeout);

    waveHeight = $wave.outerHeight();
    tracksHeight = $("#music .tracks").outerHeight();
    $("#music .artists .contain").height($("#music .artists .artist").height());
    artistsContainHeight = $("#music .artists .contain").outerHeight();
    artistsUlWidth = $("#music .artists .artist").outerWidth();
    artistsUlHeight = $("#music .artists .artist").outerHeight();
    musicHeaderPos = $musicHeader.outerHeight();
    $musicArtistsHeadingHeight = $musicArtistsHeading.outerHeight();
    $musicArtistPFPWidth = $("#music .artists .artists_pfp").outerWidth();
    $musicArtistPFPHeight = $("#music .artists .artists_pfp").outerHeight();
    $windowHeight = $(window).height();

    $welcomeIntro.outerHeight($welcomeIntro.children().height());

    /*
$flickSite.css("height", $windowHeight);
*/

    $(".mm-menu .emoji_contain favehrt-tag").height(
      $(".mm-menu .emoji_contain favehrt-tag").width()
    );
    $(".mm-menu .colors color-item").height(
      $(".mm-menu .colors color-item").width()
    );

    $(
      "#fun #you .item, #fun .site_settings, #fun .settings .color_item_contain, #fun #you .faveHrtPicker"
    ).height($("#fun").height());

    $tracksItems.add("#about_artist .trackss .song").each(function () {
      var $this = $(this);
      $this.find(".coverart").height($this.find(".coverart").width());
    });

    $grid.isotope("layout");

    $musicRecordPlayer.height($musicRecordPlayer.width());

    $musicLyricsBody.css("padding-top", $window.height() / 4);

    var nowPlayingMaxHeight = $nowPlaying.height() / 2.2;
    $nowPlayingSongData.css("max-height", nowPlayingMaxHeight);

    dataPos();

    var windowResizeTimeout = setTimeout(function () {
      if (resizeWindow === true) {
        resizeWindow = false;
        windowResize();
      }
    }, 1000);
  }
  windowResize();

  $playPause.click(function () {
    playing ? pauseSong() : playSong();
  });
  $prevBtn.click(function () {
    $musicRecordPlayer.addClass("stopspin2");
    prevSong();
  });
  $nextBtn.click(function () {
    $musicRecordPlayer.addClass("stopspin2");
    nextSong();
  });
  $repeatBtn.click(function () {
    repeat();
  });

  function navBarMusicBtn() {
    $music.addClass("go").removeClass("go-now_playing");
    $("#now_playing").removeClass("go");
  }

  // STYLING

  $(".mm-menu .colors color-item").each(function () {
    $(this).css("border-color", $(this).css("background-color"));
  });

  // MISC

  $(".custom_color-btn").on("blur", function () {
    var $this = $(this);
    var color = $this.val();

    var existingItem = $(
      ".mm-menu .colors .colors_container color-item"
    ).filter(function () {
      return $(this).css("background-color") === color;
    });

    if (existingItem.length === 0) {
      $(".mm-menu .colors .colors_container .custom_color").each(function () {
        var bgColor = $(this).css("background-color");

        if (rgbToHex(bgColor) === color) {
          $(this).remove();
        }
      });

      $(".mm-menu .colors color-item").removeClass("new_custom_color");

      $(".mm-menu .colors .colors_container").prepend(
        '<color-item class="clicked custom_color new_custom_color" style="background:' +
          color +
          "; border-color:" +
          color +
          ';"></color-item>'
      );

      $(":root")[0].style.setProperty("--pink", color);
      localStorage.setItem("favColor", color);

      $(".mm-menu .colors")
        .find(".new_custom_color")
        .addClass("clicked")
        .siblings()
        .removeClass("clicked new_custom_color");

      localStorage.setItem(
        "newColor",
        $(".mm-menu .colors .colors_container").html()
      );
    } else {
      $(".mm-menu .colors color-item").each(function () {
        var bgColor = $(this).css("background-color");

        if (bgColor === color) {
          $(this).addClass("clicked").siblings().removeClass("clicked");
        }
      });
    }
  });

  $(document).on("click", ".mm-menu .colors color-item", function () {
    var $this = $(this);
    var color = $this.css("background-color");

    if (!$this.hasClass("clicked")) {
      $this.addClass("clicked").siblings().removeClass("clicked");
      $(":root")[0].style.setProperty("--pink", rgbToHex(color));
      localStorage.setItem("favColor", rgbToHex(color));
    } else {
      var clickCount = $this.data("clickCount") || 0;
      $this.data("clickCount", ++clickCount);

      if (clickCount === 3 && $this.hasClass("clicked")) {
        afterThreeClicks($this);
        $this.data("clickCount", 0);
      }
    }
  });

  function afterThreeClicks(element) {
    var siblings = element.siblings();

    element.removeClass("clicked").css({
      transform: "scale(0) !important",
      opacity: "0",
      transitionDelay: "0s !important"
    });

    setTimeout(function () {
      var nextSibling = element.next();
      if (!nextSibling.length) {
        nextSibling = element.prev();
      }
      if (nextSibling.length) {
        nextSibling.click();
      }

      element.remove();

      localStorage.setItem(
        "newColor",
        $(".mm-menu .colors .colors_container").html()
      );
    }, 600);
  }

  function rgbToHex(rgb) {
    var hex = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hexify(x) {
      return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hexify(hex[1]) + hexify(hex[2]) + hexify(hex[3]);
  }

  function updateNumMembers() {
    numOfMembers = numOfMembers;
    $document.find("[data-number-of-members]").each(function () {
      $(this).text(numOfMembers);
    });
  }
  updateNumMembers();

  const storageKeys = {
    zoom: "backdropZoom",
    yAxis: "backdropYAxis",
    xAxis: "backdropXAxis",
    rotate: "backdropRotate",
    radius: "backdropRadius",
    position: "backdropPosition",
    repeat: "backdropRepeat"
  };

  let backdropSettings = {
    zoom: localStorage.getItem(storageKeys.zoom) || 100,
    yAxis: localStorage.getItem(storageKeys.yAxis) || 50,
    xAxis: localStorage.getItem(storageKeys.xAxis) || 50,
    rotate: localStorage.getItem(storageKeys.rotate) || 0,
    radius: localStorage.getItem(storageKeys.radius) || 0,
    position: localStorage.getItem(storageKeys.position) || "cover",
    repeat: localStorage.getItem(storageKeys.repeat) || "repeat"
  };

  const $backdrop = $(".pfp_backdrop.image-upload");
  let originalTransition = $backdrop.css("transition");

  if (originalTransition === "none" || originalTransition === undefined) {
    originalTransition = "all 0.3s ease"; // Default transition
  }

  let transitionTimeout;

  updateBackdrop();
  updateInputs();

  function updateBackdrop(disableTransition) {
    if (disableTransition) {
      $backdrop.css("transition", "none");
    }

    $backdrop.css({
      transform: "rotate(" + backdropSettings.rotate + "deg) scale(1.4)",
      borderRadius: backdropSettings.radius + "%",
      backgroundSize: backdropSettings.position,
      backgroundRepeat: backdropSettings.repeat,
      backgroundPosition:
        backdropSettings.xAxis + "% " + backdropSettings.yAxis + "%"
    });

    clearTimeout(transitionTimeout);
    transitionTimeout = setTimeout(() => {
      $backdrop.css("transition", originalTransition);
    }, 0);
  }

  function updateInputs() {
    $(".zoom_level").val(backdropSettings.zoom).parent()
          .find("label span:last")
          .text($(".zoom_level").val() + "%");
    $(".yaxis_level").val(backdropSettings.yAxis).parent()
          .find("label span:last")
          .text($(".yaxis_level").val() + "%");
    $(".xaxis_level").val(backdropSettings.xAxis).parent()
          .find("label span:last")
          .text($(".xaxis_level").val() + "%");
    $(".rotate_level").val(backdropSettings.rotate).parent()
          .find("label span:last")
          .text($(".rotate_level").val() + " deg");
          $(".radius_level").val(backdropSettings.radius).parent()
          .find("label span:last")
          .text($(".radius_level").val() + "%");

    $(".backdrop_position-settings .options button").removeClass("clicked");
    if (backdropSettings.position === "cover") {
      $("[data-action='cover backdrop']").addClass("clicked");
    } else if (backdropSettings.position.includes("%")) {
      $("[data-action='auto backdrop']").addClass("clicked");
    }

    $(".backdrop_repeat-settings .options button").removeClass("clicked");
    if (backdropSettings.repeat === "repeat") {
      $("[data-action='repeat backdrop']").addClass("clicked");
    } else {
      $("[data-action='norepeat backdrop']").addClass("clicked");
    }
  }

  $(".mm-menu .backdrop_position-settings .options button").click(function () {
    let action = $(this).data("action");
    $(this).addClass("clicked").siblings().removeClass("clicked");

    if (action === "auto backdrop") {
      backdropSettings.position = $(".zoom_level").val() + "%";
    } else if (action === "cover backdrop") {
      backdropSettings.position = "cover";
    }

    localStorage.setItem(storageKeys.position, backdropSettings.position);
    updateBackdrop(true);
  });

  $(".mm-menu .backdrop_repeat-settings .options button").click(function () {
    let action = $(this).data("action");
    $(this).addClass("clicked").siblings().removeClass("clicked");

    if (action === "repeat backdrop") {
      backdropSettings.repeat = "repeat";
    } else if (action === "norepeat backdrop") {
      backdropSettings.repeat = "no-repeat";
    }

    localStorage.setItem(storageKeys.repeat, backdropSettings.repeat);
    updateBackdrop(true);
  });

  $(".mm-menu .backdrop_position-settings .backdrop_positions input").on(
    "input change",
    function () {
      let $this = $(this);
      let level = parseInt($this.val());

      if ($this.hasClass("zoom_level")) {
        backdropSettings.zoom = level;
        backdropSettings.position = level + "%";
        localStorage.setItem(storageKeys.zoom, level);
        localStorage.setItem(storageKeys.position, backdropSettings.position);
        $this
          .parent()
          .find("label span:last")
          .text(level + "%");
      } else if ($this.hasClass("yaxis_level")) {
        backdropSettings.yAxis = level;
        localStorage.setItem(storageKeys.yAxis, level);
        $this
          .parent()
          .find("label span:last")
          .text(level + "%");
      } else if ($this.hasClass("xaxis_level")) {
        backdropSettings.xAxis = level;
        localStorage.setItem(storageKeys.xAxis, level);
        $this
          .parent()
          .find("label span:last")
          .text(level + "%");
      } else if ($this.hasClass("rotate_level")) {
        backdropSettings.rotate = level;
        $this
          .parent()
          .find("label span:last")
          .text(level + " deg");
        localStorage.setItem(storageKeys.rotate, level);
      } else if ($this.hasClass("radius_level")) {
        backdropSettings.radius = level;
        localStorage.setItem(storageKeys.radius, level);
        $this
          .parent()
          .find("label span:last")
          .text(level + "%");
      }

      updateBackdrop(true);
    }
  );

  $(
    '.mm-menu .backdrop_position-settings button[data-action="reset backdrop positions"]'
  ).click(function () {
    $(".zoom_level").val("100");
    $(".yaxis_level").val("50");
    $(".xaxis_level").val("50");
    $(".rotate_level").val("0");
    $(".radius_level").val("0");

    $(".mm-menu .backdrop_position-settings button").removeClass("clicked");
    $(".mm-menu .backdrop_position-settings button.default").addClass(
      "clicked"
    );

    $backdrop.css({
      transform: "rotate(" + 0 + "deg) scale(1)",
      borderRadius: "0%",
      backgroundSize: "cover",
      backgroundRepeat: "repeat",
      backgroundPosition: "center"
    });

    setTimeout(function () {
      for (const key in storageKeys) {
        localStorage.removeItem(storageKeys[key]);
      }
    }, 600);
  });
  
  // END LOADING STUFF
  
  $("#fun .fun_music").find("ol").removeClass("select");
  
  $("#fun .fun_music .fun_music-content [data-for]").each(function() {
      if ( $(this).is(':empty') ) {
          $(this).html("<span class='nothing_here'>Nothing here!</span>");
      } else {
          $(".nothing_here").remove();
          
          var theContent = $(this).find("ol");
          $(this).empty().append(theContent);
      }
  });
  
  $("#fun .fun_music .fun_music-content").find(".active").each(function() {
                                         if (!$(this).find("ol").length) {
                                             $("#fun .fun_music .cancel-btn").click();
          $(this).html("<span class='nothing_here'>Nothing here!</span>");
        }
                                         });

$("#fun .fun_music .fun_music-content [data-song]").each(function() {
    var $ol = $(this); 
    var songName = $ol.attr("data-song");

    if (!$ol.find("li:eq(2)").length) {
        var $song = $("#music .grid .song[data-track='" + songName + "']");

        if ($song.length) {
            var songInfo = $song.find("song-info-tag h3").text();
            $("<li>").text(songInfo).insertAfter($ol.find(".quote"));
        }
    }
});

});
