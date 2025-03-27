 $(document).ready(function() {
       var artistData = {
  "1": {
    name: "London Llaflare",
    state: "illinois",
    youtube: "@LondonLlaflare",
    instagram: "London.Llaflare",
    threads: "London.Llaflare",
    skill: "music artist",
    quote: "",
    website: "",
    websitePic: "",
    tumblr: "",
    snapchat: "",
    tiktok: "",
    soundcloud: "",
    cashapp: "",
    class: "member londonllaflare og"
  },
  "3": {
    name: "SAVIONCE",
    state: "georgia",
    youtube: "@SAVIONCE",
    instagram: "SAVIONCE",
    threads: "SAVIONCE",
    website: "https://savionce.love/",
    websitePic: "https://static.tumblr.com/9leohrr/GL1s28826/savionce.png",
    tumblr: "YVLL",
    snapchat: "SavionceLove",
    skill: "multimedia & founder",
    quote: "Sin to live and live to sin. Ma propre création.",
    tiktok: "",
    cashapp: "SAVIONCE",
    soundcloud: "",
    class: "member savionce og"
  },
  "5": {
    name: "ZuuBandz",
    state: "florida",
    youtube: "@Perfektenz",
    instagram: "ZuuBandz",
    threads: "",
    skill: "music artist",
    quote: "They be spreading legs, they be spreading hate.",
    website: "",
    websitePic: "",
    tumblr: "",
    snapchat: "",
    tiktok: "",
    cashapp: "",
    soundcloud: "",
    class: "member zuly"
  },
  "6": {
    name: "Pretty Boy Quen",
    state: "georgia",
    youtube: "@quentaviousaikens",
    instagram: "PrettyBoyQuen",
    threads: "PrettyBoyQuen",
    website: "https://sokucouture.bigcartel.com",
    websitePic: "https://static.tumblr.com/9leohrr/Lfvs287vt/soku.png",
    skill: "music artist",
    quote: "We still gettin' money, what bank it's gone be?",
    tumblr: "",
    snapchat: "",
    tiktok: "",
    cashapp: "",
    soundcloud: "",
    class: "member quen"
  },
  "7": {
    name: "Black Barbie",
    state: "california",
    youtube: "@Perfektenz",
    instagram: "ItsBlackFuckingBarbie",
    threads: "",
    skill: "music artist",
    quote: "Who gone do me sumn?",
    website: "",
    websitePic: "",
    tumblr: "",
    snapchat: "",
    tiktok: "",
    cashapp: "",
    soundcloud: "",
    class: "member barbie"
  },
  "9": {
    name: "Pio Milano",
    state: "north carolina",
    youtube: "channel/UC2T5INv-Bfg7UMS8IgkTI9Q",
    instagram: "popstarpio",
    threads: "popstarpio",
    skill: "music artist",
    quote: "MAYBE I'M JUST DRUNK / LAST TEENAGER II.",
    website: "",
    websitePic: "",
    tumblr: "",
    snapchat: "",
    tiktok: "",
    cashapp: "",
    soundcloud: "",
    class: "member pio"
  },
  "11": {
    name: "Chelly Banqz",
    state: "illinois",
    youtube: "@chellybanqz3694",
    instagram: "chellybanqz",
    threads: "chellybanqz",
    skill: "music artist",
    quote: "It is what it is.",
    website: "",
    websitePic: "",
    tumblr: "",
    snapchat: "",
    tiktok: "",
    cashapp: "ChellyBanqz",
    soundcloud: "",
    class: "member chelly"
  },
  "12": {
    name: "Reez",
    state: "florida",
    instagram: "r9ee7z",
    soundcloud: "norfsidereezy",
    threads: "r9ee7z",
    skill: "music artist",
    quote: "My OWN worst enemy.",
    youtube: "",
    website: "",
    websitePic: "",
    tumblr: "",
    snapchat: "",
    tiktok: "",
    cashapp: "",
    class: "member reez"
  },
  "13": {
    name: "Samar Amani",
    state: "illinois",
    instagram: "Samaramanii",
    threads: "Samaramanii",
    skill: "music artist",
    soundcloud: "samaramanii",
    quote: "Happiness over everything.",
    youtube: "",
    website: "",
    websitePic: "",
    tumblr: "",
    snapchat: "",
    tiktok: "",
    cashapp: "",
    class: "member samar"
  },
  "14": {
    name: "Palo",
    state: "texas",
    youtube: "@PrincePalo",
    instagram: "princepalo",
    tiktok: "princepalo",
    threads: "prvncepalo",
    skill: "music artist",
    quote: "New haircut, new fit, new Nikes ♎️",
    website: "",
    websitePic: "",
    tumblr: "",
    snapchat: "",
    soundcloud: "",
    cashapp: "",
    class: "member palo"
  },
  "15": {
    name: "OzMozes",
    state: "South Carolina",
    youtube: "@OZ-MOZES",
    twitch: "ozmozesgaming",
    instagram: "the.official.ozmozes",
    threads: "the.official.ozmozes",
    tiktok: "OZMOZES",
    skill: "music artist",
    quote: "I’m not an alien 👽 and it’s not Opposite Day.",
    website: "",
    websitePic: "",
    tumblr: "",
    snapchat: "",
    soundcloud: "",
    cashapp: "",
    class: "member mozes"
  },
  "17": {
    name: "Que",
    state: "north carolina",
    youtube: "@WHEREHEBEEN",
    instagram: "WHEREHEBEEN",
    tiktok: "WHEREHEBEEN",
    threads: "WHEREHEBEEN",
    snapchat: "ticktickboombih",
    skill: "brand ambassador",
    quote: "One thing someone gone do is make me relevant 😤",
    website: "",
    websitePic: "",
    tumblr: "",
    soundcloud: "",
    cashapp: "",
    class: "member quami nomusic"
  },
  "16": {
    name: "Unique Carter",
    state: "north carolina",
    youtube: "",
    instagram: "IAMUNIQUE.C",
    tiktok: "",
    threads: "IAMUNIQUE.C",
    snapchat: "",
    skill: "music artist",
    quote: "I AM UNIQUE🔥🎀💕🦄",
    website: "",
    websitePic: "",
    tumblr: "",
    cashapp: "",
    soundcloud: "uniquecarter",
    class: "member unique"
  }
};

$.each(artistData, function(artistId, data) {
  var memberHtml = $('<div class="member"></div>');
  memberHtml.addClass(data.class);
  memberHtml.attr("data-artist-id", artistId);
  memberHtml.attr("data-name", data.name);
  memberHtml.attr("data-state", data.state);
  memberHtml.attr("data-youtube", data.youtube);
  memberHtml.attr("data-instagram", data.instagram);
  memberHtml.attr("data-threads", data.threads);
  memberHtml.attr("data-skill", data.skill);
  memberHtml.attr("data-quote", data.quote);
  memberHtml.attr("data-website", data.website);
  memberHtml.attr("data-website-pic", data.websitePic);
  memberHtml.attr("data-tumblr", data.tumblr);
  memberHtml.attr("data-snapchat", data.snapchat);
  memberHtml.attr("data-tiktok", data.tiktok);
  memberHtml.attr("data-soundcloud", data.soundcloud);
  memberHtml.attr("data-cashapp", data.cashapp);
  $('#icons .members').append(memberHtml);
});


$("#icons .members .member").each(function() {
  const $this = $(this);
  const data = $this.data();

  const name = data.name;
  const skill = data.skill;
  const quote = data.quote;
  const artistID = data.artistId;
  const capName = name.charAt(0).toUpperCase() + name.slice(1);
  const socials = [
    { key: "youtube", url: "https://www.youtube.com/", img: "https://static.tumblr.com/9leohrr/2wjrzk9ja/youtube.png" },
    { key: "instagram", url: "https://www.instagram.com/", img: "https://static.tumblr.com/9leohrr/qqgs287ao/instagram.png" },
    { key: "threads", url: "https://www.threads.net/@", img: "https://static.tumblr.com/9leohrr/piws28hib/threads.png" },
    { key: "tumblr", url: "https://" + data.tumblr + ".tumblr.com/", img: "https://static.tumblr.com/9leohrr/o73s285p0/tumblr.png" },
    { key: "snapchat", url: "https://snapchat.com/add/", img: "https://static.tumblr.com/9leohrr/T5Ds286b4/snapchat.png" },
    { key: "tiktok", url: "https://www.tiktok.com/@", img: "https://static.tumblr.com/9leohrr/odFs286y5/tiktok.png" },
    { key: "reddit", url: "https://www.reddit.com/user/", img: "https://static.tumblr.com/9leohrr/Zw7s285wf/reddit.png" },
    { key: "discord", url: "https://www.discord.com/", img: "https://static.tumblr.com/9leohrr/wZZs2865i/discord.png" }
];


  let socialHtml = "";
$.each(socials, function(_, social) {
  const socialValue = data[social.key];
  if (socialValue) {
    socialHtml += '<a href="' + social.url + socialValue + '" target="_blank">' +
                  '<img src="' + social.img + '" class="' + social.key + '" title="' + name + '\'s ' + social.key.charAt(0).toUpperCase() + social.key.slice(1) + '" name="' + name + ' ' + social.key.charAt(0).toUpperCase() + social.key.slice(1) + '" />' +
                  '</a>';
  }
});

$this.append(
  '<ul>' +
    '<h1>' + name + '<small>' + skill + '</small></h1>' +
    '<li class="socials">' + socialHtml + '</li>' +
  '</ul>'
);

if (data.website) 
  $this.find(".socials").prepend(
    '<a href="' + data.website + '" target="_blank">' +
      '<img src="' + data.websitePic + '" class="youtube" title="' + name + ' Official Website" name="' + name + ' Official Website" />' +
    '</a>'
  );

if (artistID && !$(this).hasClass("nomusic")) 
  $this.find(".socials").prepend(
    '<a href="#" class="music_link" data-artist-id="' + artistID + '">' +
      '<img src="' + logoMusic + '" class="music_logo" title="' + capName + ' Music" name="' + capName + ' MUSIC" />' +
    '</a>'
  );


  $this.append(
    '<span class="location">' + data.state + '</span>'
  );

  $this.attr("data-pos", $this.offset().top);
});


  $(document).on("click", "#icons .member", function() {
    var $this = $(this);
    var info = $this.find("ul");
    $this.find(".socials").scrollLeft(0);
    info.toggleClass("go");
    $this.siblings().find("ul").removeClass("go");
  });

  $document.on(
    "click",
    "#icons .member a.music_link[data-artist-id]",
    function(e) {
      const $this = $(this);
      var artistID = $(this).attr("data-artist-id");
      pickMemberName = $this.parents(".member").attr("data-name");

      $musicArtists.find("[data-artist-id='" + artistID + "']").click();

      /*
    window.history.replaceState(null, "TREESH Music | ", "/music/" + pickMemberName.replace(/\s/g, ''));
*/

      e.preventDefault();
    }
  );
 
    });
