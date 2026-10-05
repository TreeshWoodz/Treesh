/* ===================== FREA! PLUS — MORE ACTIONS + FLEA REACTIONS =====================
   16 new action emotes (poses/FX live in actions.js) and a social layer: when any flea starts an
   action, nearby CPU fleas notice and react (wave back, join the dance, clap for a backflip, comfort
   a crying flea, back away from a sneeze, swoon at a heart…).
   · Zen: full reactions (matching action + follow / back off / come closer) and CPU→CPU chains.
   · Competitive modes: quick reaction (emote + short action, only when idle) so gameplay isn't hurt.
   · Copycat / Hide & Seek / Tutorial / Red Light: emote bubble only. */
(function(){
  if(typeof ACTIONS==='undefined'||typeof Flea==='undefined')return;
  var NEW=[
    {e:'👏',k:'clap',l:'Clap'},{e:'💪',k:'flex',l:'Flex'},{e:'😂',k:'laugh',l:'Laugh'},{e:'😭',k:'cry',l:'Cry'},
    {e:'🤧',k:'sneeze',l:'Sneeze'},{e:'🤷',k:'shrug',l:'Shrug'},{e:'🫶',k:'heart',l:'Heart Hands'},{e:'💃',k:'twirl',l:'Twirl'},
    {e:'🧘',k:'yoga',l:'Meditate'},{e:'😤',k:'tantrum',l:'Tantrum'},{e:'🤦',k:'facepalm',l:'Facepalm'},{e:'🫡',k:'salute',l:'Salute'},
    {e:'🎤',k:'sing',l:'Sing'},{e:'😵',k:'faint',l:'Faint'},{e:'🤗',k:'hug',l:'Hug'},{e:'🪄',k:'magic',l:'Magic'}];
  NEW.forEach(function(a){if(ACTION_KEYS.indexOf(a.k)>=0)return;ACTIONS.push(a);ACTION_KEYS.push(a.k);ACTION_EMOJI[a.k]=a.e;});
  try{buildEmoteBar();}catch(e){}

  /* source action → how others react */
  var R={
    dance:{a:'dance',e:'🎶',s:['Dance party!','Let\'s groove!','Ooh, I love this song!']},headbang:{a:'headbang',e:'🤘',s:['Rock on!','Shred it!']},
    sing:{a:'clap',e:'🎶',s:['Encore!','What a voice!']},moonwalk:{a:'clap',e:'😎',s:['Smooth moves!','Teach me that!']},
    wave:{a:'wave',e:'👋',s:['Hiii!','Hey there!','Hello friend!']},salute:{a:'salute',e:'🫡',s:['Yes captain!','Reporting in!']},bow:{a:'bow',e:'🙇',s:['After you!','So polite!']},
    cheer:{a:'cheer',e:'🎉',s:['Woohoo!','Yay!']},clap:{a:'clap',e:'👏',s:['Bravo!','Yeah!']},flip:{a:'clap',e:'😮',s:['Whoa, a backflip!','Ten out of ten!']},
    jump:{a:'jump',e:'😄',s:['Jump with me!','Boing!']},twirl:{a:'clap',e:'✨',s:['So graceful!','Pretty!']},magic:{a:'cheer',e:'🤩',s:['It\'s magic!','How did you do that?!']},
    karate:{a:'peek',e:'😨',m:'flee',s:['Eek! Not the face!','Okay okay, you win!']},stomp:{a:null,e:'😬',s:['Earthquake!','Easy there!']},
    tantrum:{a:'facepalm',e:'😬',s:['Someone\'s grumpy…','Deep breaths!']},flex:{a:'flex',e:'💪',s:['Check MY muscles!','Gym buddies!']},
    cry:{a:'hug',e:'🥺',m:'approach',s:['Aww, don\'t cry!','Group hug?','I\'m here for you!']},laugh:{a:'laugh',e:'😂',s:['Hahaha!','Your laugh is contagious!']},
    sneeze:{a:null,e:'🤢',m:'flee',s:['Bless you! …ew','Cover your mouth!','Gesundheit!']},heart:{a:'heart',e:'🥰',m:'follow',s:['Love you too!','Besties!']},
    hug:{a:'hug',e:'🤗',m:'approach',s:['Hugs!','Squeeeze!']},faint:{a:'peek',e:'😱',m:'approach',s:['Are you okay?!','Someone get help!']},
    lie:{a:'lie',e:'🥱',s:['Nap time…','So sleepy…']},yoga:{a:'yoga',e:'😌',s:['Ommm…','So peaceful.']},peek:{a:'peek',e:'👀',s:['I see you!','Peekaboo!']},
    shrug:{a:'shrug',e:'🤷',s:['Beats me!','Who knows?']},facepalm:{a:'laugh',e:'😅',s:['Oops!','It happens!']},
    spin:{a:'spin',e:'😵‍💫',s:['I\'m dizzy just watching!','Spin spin spin!']},wiggle:{a:'wiggle',e:'😆',s:['Wiggle wiggle!']},squish:{a:null,e:'😂',s:['Squishy!']}};
  var EMOTE_ONLY={copycat:1,hns:1,tutorial:1,redlight:1,musical:1};
  function T(){return Date.now();}
  function pick(a){return a[Math.random()*a.length|0];}
  function zen(){return gameMode==='zen';}
  function emit(src,a){var r=R[a];if(!r||STATE!=='play')return;var now=T();if(src._emitT&&now<src._emitT)return;src._emitT=now+1100;
    var rad=zen()?430:(src.isP?560:300),pr=src.isP?0.9:(zen()?0.45:0.25),n=0;
    fleas.forEach(function(f){if(f===src||f.isP||f.hidden||f._out||f._ccOut)return;var d=Math.hypot(f.cx-src.cx,f.cy-src.cy);if(d>rad||Math.random()>pr)return;if(n>=5)return;n++;
      f._rq={at:now+220+Math.random()*520+n*90,src:src,a:a,d:d};});}
  function react(f,q){var r=R[q.a],now=T(),src=q.src;if(!r)return;
    f.reactEmote=r.e;f.reactEmoteT=1700;
    if(Math.random()<(src.isP?0.6:0.3)){try{f._sayCD=0;maybeSay(f,pick(r.s),1600);}catch(e){}}
    if(EMOTE_ONLY[gameMode])return;
    var full=zen();
    if(r.a&&f.stuck&&(full||(!f.hasOrb&&!f.it&&!f.infected&&!f.frozen))&&(!f.action||full)){f.action=r.a;f.actionT=0;f.actionUntil=now+(full?2200+Math.random()*1200:1200);f._reactAct=true;f.vx=0;f.vy=0;f.face=src.cx>f.cx?1:-1;}
    if(full&&src.isP&&r.m){if(r.m==='flee'){f.fleeUntil=now+3200;f.followUntil=0;}else{f.followUntil=now+(r.m==='follow'?5200:3000);f.fleeUntil=0;}}}
  /* detect action starts on every flea + run queued reactions */
  var _up=Flea.prototype.update;
  Flea.prototype.update=function(dt){_up.call(this,dt);var a=this.action||'';
    if(a!==this._lastAct){if(a&&!this._reactAct)emit(this,a);if(!a)this._reactAct=false;else if(this._lastAct&&this._reactAct&&a!==this._lastAct)this._reactAct=false;this._lastAct=a;}
    var q=this._rq;if(q&&T()>=q.at){this._rq=null;if(!this.hidden&&STATE==='play')react(this,q);}};
  window.FreaReact={map:R,emit:emit,list:NEW,state:function(){return {action:player?player.action:null,reacting:fleas.filter(function(f){return !f.isP&&(f.reactEmoteT>0||f._rq);}).length};}};
})();
