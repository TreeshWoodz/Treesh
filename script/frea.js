(function(){
'use strict';

/* ---------- Splash (min 3s visible) ---------- */
(function(){
  var pt=document.getElementById('ptxt');
  var msgs=['Warming up neon','Spawning fleas','Charging slingshot','Polishing the orb','Tuning antennae','Ready'];
  var i=0,p=0,start=Date.now(),done=false;
  var iv=setInterval(function(){
    p+=3+Math.random()*7;if(p>100)p=100;
    if(i<msgs.length-1 && p>(i+1)*(100/msgs.length))i++;
    pt.textContent=msgs[i]+' · '+Math.round(p)+'%';
    if(p>=100&&!done){done=true;clearInterval(iv);
      var elapsed=Date.now()-start;var wait=Math.max(400,3000-elapsed);
      setTimeout(hideSplash,wait);}
  },85);
  function hideSplash(){var s=document.getElementById('splash');if(!s)return;s.classList.add('gone');setTimeout(function(){s.style.display='none';},900);}
})();

/* ---------- Canvas / globals ---------- */
var C=document.getElementById('c'),ctx=C.getContext('2d');
var W,H,WORLD_W,WORLD_H;
function rsz(){W=C.width=innerWidth;H=C.height=innerHeight;}
rsz();

var GRAV=0.4, MAX_DRAG=120, SLING_POWER=1.25, PLAYER_MAX=48, AI_MAX=34, AI_LEAP_CAP=20;
var FAST_SPIN=0.0042, FLING_SPEED=14;
var STATE='title', gameMode='classic', arenaLayout='random', activeLayout='horiz';
var configAi=3, matchTime=90, fuseMax=10000, fuse=fuseMax;
var allowMoving=true, allowSpinning=true;
var isPaused=false, playerDead=false, countdown=3.0, lastCd=3;

var parts=[],sparks=[],platforms=[],fleas=[],ambient=[],player=null,orb=null;
var emotePops=[];
var orbHolder=null,capTimer=0,orbAng=0,orbPulse=0,roundNum=1,hudT=0;
var tagTimer=0,tagSeeded=false;
var hnsPhase='',hnsSeekLeft=0,hnsFound=0,hnsTotal=0,hnsHideLeft=0,seekTime=90,hnsDecoyMsgCD=0,hnsTheme='forest',HNS_HIDE_MS=20000,hnsSeeker=null,hnsWrong=0;
var hnsEndInfo=null;
var HNS_EMOJI={crate:'📦',rock:'🪨',plant:'🪴',mushroom:'🍄',tv:'📺',couch:'🛋️',lamp:'💡',balloon:'🎈',beachball:'🏐'};
var camera={x:0,y:0,shake:0};
var aim={on:false,dragging:false,x:0,y:0,sx:0,sy:0,st:0};
var tapMarker=null,touchRipple=null;
var chatterTimer=0,lastSpeaker=null,proxTimer=0;
var timerIv=null,winIv=null,prevIv=null;
/* edit/creative mode + zen dock state */
var editMode=false, editTool='move', grabbed=null, grabKind=null, grabOff={x:0,y:0}, editHover=null, dockOpen=true, zenCat='orbs';
var editPan={on:false,lx:0,ly:0};
/* performance mode (reduced glow/particles) */
var perfMode=false; try{perfMode=localStorage.getItem('frea_perf')==='1';}catch(e){}

var LC=[
  {p:'#2a1850',a:'#ff3db5',glow:'#ff3db5',bg:'#0c0720'},
  {p:'#08303a',a:'#2de2ff',glow:'#2de2ff',bg:'#04141a'},
  {p:'#2c2a0c',a:'#ffd23d',glow:'#ffd23d',bg:'#14110a'},
  {p:'#142c10',a:'#c6ff3d',glow:'#c6ff3d',bg:'#0a1206'},
  {p:'#241048',a:'#9b6bff',glow:'#9b6bff',bg:'#0e0820'}
];
var pal=LC[0];
var AURA={cyan:'#2de2ff',pink:'#ff3db5',gold:'#ffd23d',violet:'#9b6bff',lime:'#c6ff3d',ember:'#ff7a1a',white:'#ffffff',toxic:'#39ff7a'};
var SHAPES={round:{rx:12.5,ry:12},oval:{rx:15,ry:10},chubby:{rx:15.5,ry:13.5},slim:{rx:11,ry:12.5},egg:{rx:12,ry:14},blob:{rx:14,ry:11.5},bean:{rx:13,ry:12.5},tall:{rx:10.5,ry:15}};

/* ===== contextual flea speech — per mode + events ===== */
var SPEECH={
  zen:["Catch me if you can!","Bouncing high!","Love this room!","Whoa, nice jump!","Up here!","Wheee!","Flinging is fun!","Just chilling.","Nice colors today!","Let's stick together!","Great view up here!","Bounce bounce!","Huge sandbox!","Check this spin!","I'm basically flying!","Boing boing boing!","My legs are tiny but mighty.","Vibing in neon.","Wanna be friends?","Spin me right round!","Did someone say snacks?","I licked a platform. Tasty.","Gravity is just a suggestion.","Look ma, no hands!","I'm the bounciest!","Zoooom!","This view never gets old.","Why walk when you can fling?","I found a secret corner!","Beep boop, I'm a flea bot.","Five stars, would bounce again.","Whoopsie, wrong platform.","I'm just here for the glow.","Is that a couch? Cozy!","Ooh, a balloon!","So peaceful here.","Decorate this place!","I'm an interior designer now.","Plants make me happy.","Let's redecorate!"],
  classic:["The orb is MINE!","Gimme that orb!","So close to capturing!","My ring's almost full!","Don't you dare steal it!","I'm charging up!","Capture incoming!","Back off, it's mine!","Just a little more!","Orb hog, that's me!","Catch the orb if you can!","I see the orb, I want the orb!","Ring filling nicely...","Victory is glowing!","Hands off my orb!","I'll grab it first!","Almost there, almost there!","This round is mine!","Tick tock, charging up!","Nobody out-captures me!"],
  race:["To the top!","Out of my way!","I'm winning this!","Climb climb climb!","First place, baby!","Eat my dust!","Almost at the orb!","Catch up if you can!","The summit is mine!","Higher and higher!","I'm so close to the top!","Move it, slowpoke!","Race you up there!","Last one up is rotten!","Going up!","Don't trip me!","Top of the tower!","I'm a climbing machine!","Watch me speedrun this!","Gotta go fast!"],
  survival:["HOT HOT HOT!","Take it, take it!","Get it away from me!","I don't want the orb!","Burning up here!","Somebody grab this!","No no no not me!","Pass it quick!","My fuse is running out!","Too spicy!","Get away or you're it!","Don't touch me!","I'll explode!","Hot potato, anyone?","Tick... tick... yikes!","Quick, somebody!","I can't hold this!","Save yourselves!","This thing is on fire!","Why is it always me?!"],
  tag:{
    infectedChase:["You're next!","Come heeere!","Gotta tag 'em all!","No escape!","Spreading the love!","You can't run forever!","Tag, you're it!","Infection time!","I'm coming for you!","Resistance is futile!","Hold still, friend!","One of us, one of us!","Catch you soon!","Greenify everyone!","You look healthy... not for long!"],
    safeFlee:["Stay away!","Don't touch me!","Run run run!","Not today, zombie!","Eek, infected!","Keep your distance!","Too close!","I'm still clean!","Last one standing!","Nope nope nope!","Save me!","Healthy and proud!","Can't catch me!","Outta here!","Social distancing!"]
  }
};
var EVENT_LINES={
  nearPlayer:["Hey, watch it!","You again?","Personal space!","Oh hi there!","Back off, buddy!","Heeey neighbor!","Sup, friend!","Move over!","You smell like neon."],
  bumped:["Oof!","Hey!","Watch where you're flinging!","Rude!","That's a foul!","Excuse you!","Bonk!","Ow, my antennae!","Whoa, careful!"],
  grabOrb:["Mine now!","Gotcha orb!","Ooh shiny!","Snagged it!","Finders keepers!"],
  gotInfected:["Aw, no...","I got got!","Welp, I'm green now.","Traitor!","Ugh, infected!"],
  fling:["Wheeee!","To the moon!","Yeeeet!","Hold my snacks!","Bombs away!"],
  emoteLove:["Aww, hi friend!","I like you too!","Bestie!","Let's hang out!","Following you!","Yay, a pal!","Ooh, come here!","Wholesome!","Group hug!","You're my fave!"],
  emoteScared:["Eeek!","Stay back!","Nooo, run!","Scary!","Don't hurt me!","Yikes, bye!","Too spooky!","Help!","Not the knife!","Fleeing!"],
  hnsFound:["You found me!","Aw, caught!","Dang, spotted!","Rats!","Good eye!","How'd you see me?!","Busted!","No fair!"]
};
function modePhrase(f){
  if(gameMode==='tag'){
    if(!tagSeeded)return SPEECH.zen[Math.random()*SPEECH.zen.length|0];
    var pool=f.infected?SPEECH.tag.infectedChase:SPEECH.tag.safeFlee;
    return pool[Math.random()*pool.length|0];
  }
  var arr=SPEECH[gameMode]||SPEECH.zen;return arr[Math.random()*arr.length|0];
}
function say(f,txt,ms){if(!f||f.isP)return;f.bubble=txt;f.bubbleT=ms||2000;f._sayCD=Date.now()+2600;}
function maybeSay(f,txt,ms){if(!f||f.isP)return;if(f._sayCD&&Date.now()<f._sayCD)return;if(Math.random()<0.6)say(f,txt,ms);}
var phrases=SPEECH.zen;

var OPT={
  shape:['round','oval','chubby','slim','egg','blob','bean','tall'],
  pattern:['none','spots','stripes','glitter','scales','galaxy','checker','gradient','hearts','rings','polka','camo','flames','circuit','zebra'],
  eyes:['cute','normal','cool','sleepy','angry','heart','star','wink','swirl','robo','ghost','dizzy','kawaii'],
  ant:['curly','long','bulbous','heart','star','bolt','horns','spring','ribbon','none'],
  legs:['matching','accent','pink','yellow','pastel','rainbow','shadow','neon','chrome','aqua','magma','mint','gold','candy','ink'],
  legStyle:['default','boots','socks','fuzzy','striped'],
  legShape:['default','spider','stubby','noodle','zigzag','paws','tentacle','bird','spring','hover'],
  hair:['none','buzz','fringe','afro','curls','afropuffs','hightop','bun','bantu','cornrows','dreads','dreadsLong','boxbraids','twists','ponytail','pigtails','bob','long','wavy','mohawk','spiky','pompadour'],
  hat:['none','crown','party','bow','halo','cap','flower','tophat','beanie','wizard','horns','antlers','cowboy','pirate','chef'],
  wings:['none','fairy','bee','butterfly','dragon','angel','tech'],
  trail:['none','sparkle','fire','bubbles','rainbow','stars','snow','smoke','lightning','hearts'],
  aura:['none','cyan','pink','gold','violet','lime','rainbow','ember','white','toxic','fire','ice'],
  mouth:['none','smile','open','tongue','fangs','kiss','smirk','tiny','grin','frown'],
  brows:['none','raised','angry','worried','evil','thick'],
  glasses:['none','round','shades','stars','monocle','vr','heart','eyepatch'],
  cape:['none','hero','vampire','royal','ghost'],
  accessory:['none','scarf','tie','earrings','necklace','backpack','shield'],
  cheek:['on','off','freckles','swirls'],
  size:['tiny','small','normal','large','huge']
};
function pick(a){return a[Math.random()*a.length|0];}
function randHex(){return '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');}
function hexA(hex,a){hex=hex||'#000000';var h=String(hex).replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];var n=parseInt(h,16)||0;return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';}
function lerpColor(c1,c2,t){function p(c){c=c.replace('#','');return [parseInt(c.substr(0,2),16),parseInt(c.substr(2,2),16),parseInt(c.substr(4,2),16)];}var a=p(c1),b=p(c2);return 'rgb('+Math.round(a[0]+(b[0]-a[0])*t)+','+Math.round(a[1]+(b[1]-a[1])*t)+','+Math.round(a[2]+(b[2]-a[2])*t)+')';}

/* ---------- Platform shapes settings ---------- */
var SHAPE_KINDS=[
  {k:'rect',l:'Slab',icon:'rect'},{k:'long',l:'Long',icon:'long'},{k:'tall',l:'Tall',icon:'tall'},
  {k:'box',l:'Box',icon:'box'},{k:'circle',l:'Circle',icon:'circle'},{k:'triUp',l:'Tri ▲',icon:'triUp'},
  {k:'triDown',l:'Tri ▼',icon:'triDown'},{k:'diamond',l:'Diamond',icon:'diamond'},{k:'hexagon',l:'Hex',icon:'hexagon'},
  {k:'pentagon',l:'Penta',icon:'pentagon'},{k:'trapezoid',l:'Trapez',icon:'trapezoid'},{k:'parallelogram',l:'Para',icon:'parallelogram'},
  {k:'octagon',l:'Octa',icon:'octagon'},{k:'heptagon',l:'Hepta',icon:'heptagon'},{k:'kite',l:'Kite',icon:'kite'},{k:'gem',l:'Gem',icon:'gem'}
];
var enabledShapes={};
SHAPE_KINDS.forEach(function(s){enabledShapes[s.k]=true;});
try{var _sd=localStorage.getItem('frea_shapes_v3');if(_sd){var _p=JSON.parse(_sd);Object.keys(_p).forEach(function(k){if(k in enabledShapes)enabledShapes[k]=_p[k];});}}catch(e){}
function saveShapes(){try{localStorage.setItem('frea_shapes_v3',JSON.stringify(enabledShapes));}catch(e){}}
try{var _dp=localStorage.getItem('frea_dyn_v1');if(_dp){var _d=JSON.parse(_dp);if('mv' in _d)allowMoving=!!_d.mv;if('sp' in _d)allowSpinning=!!_d.sp;}}catch(e){}
function saveDyn(){try{localStorage.setItem('frea_dyn_v1',JSON.stringify({mv:allowMoving,sp:allowSpinning}));}catch(e){}}

function shapeGlyphSVG(kind){
  var m='<svg width="26" height="20" viewBox="0 0 26 20">';
  if(kind==='rect')return m+'<rect x="3" y="7" width="20" height="6" rx="2" fill="currentColor"/></svg>';
  if(kind==='long')return m+'<rect x="1" y="8" width="24" height="4" rx="1.5" fill="currentColor"/></svg>';
  if(kind==='tall')return m+'<rect x="11" y="2" width="4" height="16" rx="1.5" fill="currentColor"/></svg>';
  if(kind==='box')return m+'<rect x="7" y="3" width="13" height="13" rx="2" fill="currentColor"/></svg>';
  if(kind==='circle')return m+'<circle cx="13" cy="10" r="7" fill="currentColor"/></svg>';
  if(kind==='triUp')return m+'<polygon points="13,3 22,17 4,17" fill="currentColor"/></svg>';
  if(kind==='triDown')return m+'<polygon points="4,3 22,3 13,17" fill="currentColor"/></svg>';
  if(kind==='diamond')return m+'<polygon points="13,3 22,10 13,17 4,10" fill="currentColor"/></svg>';
  if(kind==='hexagon')return m+'<polygon points="9,4 17,4 22,10 17,16 9,16 4,10" fill="currentColor"/></svg>';
  if(kind==='pentagon')return m+'<polygon points="13,3 22,9 18,17 8,17 4,9" fill="currentColor"/></svg>';
  if(kind==='trapezoid')return m+'<polygon points="7,5 19,5 23,16 3,16" fill="currentColor"/></svg>';
  if(kind==='parallelogram')return m+'<polygon points="8,5 23,5 18,16 3,16" fill="currentColor"/></svg>';
  if(kind==='octagon')return m+'<polygon points="9,3 17,3 22,8 22,12 17,17 9,17 4,12 4,8" fill="currentColor"/></svg>';
  if(kind==='heptagon')return m+'<polygon points="13,3 20,7 18,15 8,15 6,7" fill="currentColor"/></svg>';
  if(kind==='kite')return m+'<polygon points="13,3 20,9 13,17 6,9" fill="currentColor"/></svg>';
  if(kind==='gem')return m+'<polygon points="8,5 18,5 23,10 13,17 3,10" fill="currentColor"/></svg>';
  return '';
}
function buildShapeGrid(){
  var g=document.getElementById('shape-grid');g.innerHTML='';
  SHAPE_KINDS.forEach(function(s){
    var d=document.createElement('div');d.className='shape-check'+(enabledShapes[s.k]?' on':'');d.dataset.k=s.k;
    d.innerHTML='<div class="tick">✓</div><div class="glyph">'+shapeGlyphSVG(s.icon)+'</div><div class="lbl">'+s.l+'</div>';
    d.addEventListener('click',function(){
      var any=Object.values(enabledShapes).filter(Boolean).length;
      if(enabledShapes[s.k]&&any<=1)return;
      enabledShapes[s.k]=!enabledShapes[s.k];d.classList.toggle('on',enabledShapes[s.k]);saveShapes();
    });
    g.appendChild(d);
  });
}
buildShapeGrid();
document.getElementById('shape-all').addEventListener('click',function(){Object.keys(enabledShapes).forEach(function(k){enabledShapes[k]=true;});buildShapeGrid();saveShapes();});
document.getElementById('shape-none').addEventListener('click',function(){var keys=Object.keys(enabledShapes);keys.forEach(function(k,i){enabledShapes[k]=i===0;});buildShapeGrid();saveShapes();});

/* dynamic platform toggles */
var swM=document.getElementById('sw-moving'),swS=document.getElementById('sw-spin');
function syncDynUI(){swM.classList.toggle('on',allowMoving);swS.classList.toggle('on',allowSpinning);}
swM.addEventListener('click',function(){allowMoving=!allowMoving;syncDynUI();saveDyn();});
swS.addEventListener('click',function(){allowSpinning=!allowSpinning;syncDynUI();saveDyn();});
syncDynUI();
/* performance mode toggle */
var swP=document.getElementById('sw-perf');
function syncPerfUI(){if(swP)swP.classList.toggle('on',perfMode);}
if(swP)swP.addEventListener('click',function(){perfMode=!perfMode;syncPerfUI();try{localStorage.setItem('frea_perf',perfMode?'1':'0');}catch(e){}flash(perfMode?'Performance Mode ON':'Performance Mode OFF','#c6ff3d');});
syncPerfUI();
/* SpotMe accessibility toggle */
var spotMe=false;try{spotMe=localStorage.getItem('frea_spotme')==='1';}catch(e){}
var swSM=document.getElementById('sw-spotme');
function syncSpotMeUI(){if(swSM)swSM.classList.toggle('on',spotMe);var pm=document.getElementById('sw-spotme-pause');if(pm)pm.classList.toggle('on',spotMe);}
function toggleSpotMe(){spotMe=!spotMe;syncSpotMeUI();try{localStorage.setItem('frea_spotme',spotMe?'1':'0');}catch(e){}flash(spotMe?'SpotMe ON — you are spotlighted':'SpotMe OFF','#2de2ff');}
if(swSM)swSM.addEventListener('click',toggleSpotMe);
syncSpotMeUI();

/* ---------- Custom Frea storage ---------- */
var saved=[], activeId='';
var FIELDS={name:'Frea',color:'#2de2ff',eyeColor:'#101018',shape:'round',size:'normal',pattern:'none',eyes:'cute',ant:'curly',legs:'matching',legStyle:'default',legShape:'default',hat:'none',wings:'none',trail:'none',aura:'none',cheek:'on',mouth:'smile',brows:'none',glasses:'none',cape:'none',accessory:'none',secondary:'#ff3db5',hair:'none',hairColor:'#2a1a2a'};
function normalize(f){var o=Object.assign({},FIELDS,f);if(!o.id)o.id='f_'+Math.random().toString(36).slice(2);return o;}
var presets=[
  {id:'f1',name:'Frea',color:'#2de2ff',eyeColor:'#101018',shape:'round',size:'normal',pattern:'glitter',eyes:'cute',ant:'curly',legs:'pink',hat:'none',wings:'fairy',trail:'sparkle',aura:'cyan',mouth:'smile',cheek:'on',secondary:'#ff3db5'},
  {id:'f2',name:'Bubbles',color:'#ff3db5',eyeColor:'#2a0030',shape:'chubby',size:'normal',pattern:'spots',eyes:'heart',ant:'heart',legs:'matching',hat:'bow',wings:'none',trail:'bubbles',aura:'pink',mouth:'kiss',glasses:'heart',cheek:'on',secondary:'#ffd23d'},
  {id:'f3',name:'Slash',color:'#c6ff3d',eyeColor:'#101018',shape:'slim',size:'large',pattern:'stripes',eyes:'cool',ant:'bolt',legs:'yellow',hat:'cap',wings:'bee',trail:'fire',aura:'lime',mouth:'smirk',brows:'evil',glasses:'shades',cape:'hero',accessory:'tie',cheek:'off',secondary:'#ff3db5'}
];
function loadFreas(){
  try{
    var s=localStorage.getItem('frea_v4'),a=localStorage.getItem('frea_v4_active');
    var raw=s?JSON.parse(s):JSON.parse(JSON.stringify(presets));
    saved=raw.map(normalize);
    activeId=(a&&saved.some(function(f){return f.id===a;}))?a:saved[0].id;
  }catch(e){saved=presets.map(normalize);activeId=saved[0].id;}
  saveFreas();repopulate();applyToUI();
}
function saveFreas(){try{localStorage.setItem('frea_v4',JSON.stringify(saved));localStorage.setItem('frea_v4_active',activeId);}catch(e){}}
function repopulate(){var s=document.getElementById('flea-select');s.innerHTML='';saved.forEach(function(f){var o=document.createElement('option');o.value=f.id;o.textContent=f.name;if(f.id===activeId)o.selected=true;s.appendChild(o);});}
function gv(id){return document.getElementById(id).value;}
function sv(id,v){var e=document.getElementById(id);if(e)e.value=v;}

var EDIT_INP=['edit-name','edit-color','edit-eyecolor','edit-secondary','edit-haircolor'];
var EDIT_SEL=['edit-shape','edit-size','edit-pattern','edit-eyes','edit-ant','edit-legs','edit-legstyle','edit-legshape','edit-hat','edit-wings','edit-trail','edit-aura','edit-cheek','edit-mouth','edit-brows','edit-glasses','edit-cape','edit-accessory','edit-hair'];

function applyToUI(){
  var c=saved.find(function(f){return f.id===activeId;});if(!c)return;
  sv('edit-name',c.name);sv('edit-color',c.color);sv('edit-eyecolor',c.eyeColor);sv('edit-secondary',c.secondary||'#ff3db5');
  sv('edit-shape',c.shape);sv('edit-size',c.size);sv('edit-pattern',c.pattern);
  sv('edit-eyes',c.eyes);sv('edit-ant',c.ant);sv('edit-legs',c.legs);sv('edit-legstyle',c.legStyle||'default');sv('edit-legshape',c.legShape||'default');
  sv('edit-hat',c.hat);sv('edit-wings',c.wings);sv('edit-trail',c.trail);sv('edit-aura',c.aura);
  sv('edit-cheek',c.cheek||'on');sv('edit-mouth',c.mouth||'smile');sv('edit-brows',c.brows||'none');
  sv('edit-glasses',c.glasses||'none');sv('edit-cape',c.cape||'none');sv('edit-accessory',c.accessory||'none');
  sv('edit-hair',c.hair||'none');sv('edit-haircolor',c.hairColor||'#2a1a2a');
  document.getElementById('color-hex').textContent=c.color;
  document.getElementById('sec-hex').textContent=c.secondary||'#ff3db5';
  drawPreview();
}
function updateFromUI(){
  var c=saved.find(function(f){return f.id===activeId;});if(!c)return;
  c.name=(gv('edit-name')||'').trim()||'Frea';
  c.color=gv('edit-color');c.eyeColor=gv('edit-eyecolor');c.secondary=gv('edit-secondary');
  c.shape=gv('edit-shape');c.size=gv('edit-size');c.pattern=gv('edit-pattern');
  c.eyes=gv('edit-eyes');c.ant=gv('edit-ant');c.legs=gv('edit-legs');c.legStyle=gv('edit-legstyle');c.legShape=gv('edit-legshape');
  c.hat=gv('edit-hat');c.wings=gv('edit-wings');c.trail=gv('edit-trail');c.aura=gv('edit-aura');
  c.cheek=gv('edit-cheek');c.mouth=gv('edit-mouth');c.brows=gv('edit-brows');
  c.glasses=gv('edit-glasses');c.cape=gv('edit-cape');c.accessory=gv('edit-accessory');
  c.hair=gv('edit-hair');c.hairColor=gv('edit-haircolor');
  document.getElementById('color-hex').textContent=c.color;
  document.getElementById('sec-hex').textContent=c.secondary;
  var o=document.querySelector('#flea-select option[value="'+activeId+'"]');if(o)o.textContent=c.name;
  saveFreas();drawPreview();
}
EDIT_INP.forEach(function(id){var e=document.getElementById(id);if(e)e.addEventListener('input',updateFromUI);});
EDIT_SEL.forEach(function(id){var e=document.getElementById(id);if(e)e.addEventListener('change',updateFromUI);});
document.getElementById('flea-select').addEventListener('change',function(e){activeId=e.target.value;saveFreas();applyToUI();});
document.getElementById('flea-new').addEventListener('click',function(){var id='f_'+Date.now();saved.push(normalize({id:id,name:'Neo '+(saved.length+1),color:randHex(),secondary:randHex()}));activeId=id;saveFreas();repopulate();applyToUI();});
document.getElementById('flea-del').addEventListener('click',function(){if(saved.length<=1){flash('Need at least one Frea!','#ff3db5');return;}if(!confirm('Delete this Frea?'))return;saved=saved.filter(function(f){return f.id!==activeId;});activeId=saved[0].id;saveFreas();repopulate();applyToUI();});
document.getElementById('flea-rand').addEventListener('click',function(){
  var c=saved.find(function(f){return f.id===activeId;});if(!c)return;
  c.color=randHex();c.secondary=randHex();c.eyeColor=Math.random()<0.5?'#101018':randHex();
  c.shape=pick(OPT.shape);c.size=pick(OPT.size);c.pattern=pick(OPT.pattern);c.eyes=pick(OPT.eyes);
  c.ant=pick(OPT.ant);c.legs=pick(OPT.legs);c.legStyle=pick(OPT.legStyle);c.legShape=pick(OPT.legShape);c.hat=pick(OPT.hat);c.wings=pick(OPT.wings);
  c.trail=pick(OPT.trail);c.aura=pick(OPT.aura);c.cheek=pick(OPT.cheek);
  c.mouth=pick(OPT.mouth);c.brows=pick(OPT.brows);c.glasses=pick(OPT.glasses);
  c.cape=pick(OPT.cape);c.accessory=pick(OPT.accessory);
  c.hair=pick(OPT.hair);c.hairColor=Math.random()<0.5?pick(['#2a1a2a','#3a2418','#1a1a22','#5a3a1a','#7a4a2a']):randHex();
  saveFreas();applyToUI();
});
document.querySelectorAll('.cust-tab').forEach(function(b){
  b.addEventListener('click',function(){
    document.querySelectorAll('.cust-tab').forEach(function(x){x.classList.remove('active');});
    document.querySelectorAll('.tab-pane').forEach(function(x){x.classList.remove('active');});
    b.classList.add('active');
    document.querySelector('.tab-pane[data-pane="'+b.dataset.tab+'"]').classList.add('active');
  });
});

/* ---------- Modals ---------- */
var custModal=document.getElementById('cust-modal'),setModal=document.getElementById('settings-modal');
function openCust(){custModal.classList.add('open');applyToUI();drawPreview();}
function closeCust(){custModal.classList.remove('open');if(prevIv)clearInterval(prevIv);}
function openSettings(){syncSettingsUI();setModal.classList.add('open');}
function closeSettings(){setModal.classList.remove('open');}
document.getElementById('cust-toggle').addEventListener('click',openCust);
document.getElementById('settings-toggle').addEventListener('click',openSettings);
document.getElementById('cust-close').addEventListener('click',closeCust);
document.getElementById('cust-done').addEventListener('click',closeCust);
document.getElementById('settings-close').addEventListener('click',closeSettings);
document.getElementById('settings-done').addEventListener('click',closeSettings);
custModal.addEventListener('click',function(e){if(e.target===custModal)closeCust();});
setModal.addEventListener('click',function(e){if(e.target===setModal)closeSettings();});

/* ---------- Mode/settings UI ---------- */
var modeChips=document.querySelectorAll('.mode-chip');
var settingsTabs=document.querySelectorAll('#settings-tabs .seg-tab');
var zenEnv='neon';
try{var _ze=localStorage.getItem('frea_zenenv');if(_ze)zenEnv=_ze;}catch(e){}
function setMode(mode){
  gameMode=mode;
  modeChips.forEach(function(c){c.classList.toggle('active',c.dataset.mode===mode);});
  settingsTabs.forEach(function(t){t.classList.toggle('active',t.dataset.mode===mode);});
  syncSettingsUI();
}
modeChips.forEach(function(chip){chip.addEventListener('click',function(){setMode(chip.dataset.mode);});});
settingsTabs.forEach(function(tab){tab.addEventListener('click',function(){setMode(tab.dataset.mode);});});
function syncSettingsUI(){
  var aiSlider=document.getElementById('ai-slider');
  document.getElementById('timer-row').style.display=(gameMode==='classic')?'flex':'none';
  document.getElementById('layout-row-wrap').style.display=(gameMode==='race'||gameMode==='zen'||gameMode==='hns')?'none':'flex';
  document.getElementById('zen-env-row').style.display=(gameMode==='zen')?'flex':'none';
  var seekRow=document.getElementById('seek-row');if(seekRow)seekRow.style.display=(gameMode==='hns')?'flex':'none';
  var max,lbl;
  if(gameMode==='zen'||gameMode==='tag'){max=30;lbl=gameMode==='zen'?'Passive Fleas':'Total Rivals';}
  else if(gameMode==='classic'){max=20;lbl='Opponent Fleas';}
  else if(gameMode==='hns'){max=20;lbl='Fleas';}
  else{max=8;lbl=gameMode==='race'?'Rival Fleas':'Opponent Fleas';}
  aiSlider.max=max;if(+aiSlider.value>max)aiSlider.value=max;
  document.getElementById('ai-label').textContent=lbl;
  document.getElementById('ai-val').textContent=aiSlider.value;configAi=+aiSlider.value;
  document.getElementById('again-btn').textContent=gameMode==='zen'?'New Room':'Play Again';
  document.getElementById('prestart-btn').textContent=gameMode==='zen'?'New Room':'Restart';
}
document.getElementById('timer-slider').addEventListener('input',function(){matchTime=+this.value;document.getElementById('timer-val').textContent=matchTime+'s';});
document.getElementById('ai-slider').addEventListener('input',function(){configAi=+this.value;document.getElementById('ai-val').textContent=this.value;});
(function(){var ss=document.getElementById('seek-slider');if(ss)ss.addEventListener('input',function(){seekTime=+this.value;document.getElementById('seek-val').textContent=seekTime+'s';});})();
document.querySelectorAll('#layout-row .lbtn').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('#layout-row .lbtn').forEach(function(x){x.classList.remove('active');});this.classList.add('active');arenaLayout=this.dataset.layout;});});
document.querySelectorAll('#env-row .lbtn').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('#env-row .lbtn').forEach(function(x){x.classList.remove('active');});this.classList.add('active');zenEnv=this.dataset.env;try{localStorage.setItem('frea_zenenv',zenEnv);}catch(e){}syncEnvButtons();});});
function syncEnvButtons(){
  document.querySelectorAll('#env-row .lbtn').forEach(function(x){x.classList.toggle('active',x.dataset.env===zenEnv);});
  var lbl=document.getElementById('zen-env-label');if(lbl)lbl.textContent=(ENV_ICON[zenEnv]||'')+' '+(ENV_NAME[zenEnv]||zenEnv);
  document.querySelectorAll('#zen-env-menu button').forEach(function(x){x.classList.toggle('active',x.dataset.env===zenEnv);});
}
var ENV_ICON={neon:'🌌',forest:'🌲',beach:'🏖',living:'🛋',space:'🪐'};
var ENV_NAME={neon:'Neon',forest:'Forest',beach:'Beach',living:'Room',space:'Space'};

/* ---------- Scoreboard visibility ---------- */
var scoresEl=document.getElementById('player-scores'),scoreToggle=document.getElementById('score-toggle');
var scoreState=0;
try{var _ss=localStorage.getItem('frea_scorestate');if(_ss!==null)scoreState=Math.max(0,Math.min(2,+_ss));}catch(e){}
function applyScoresVis(){
  scoresEl.classList.toggle('hidden',scoreState===2);
  scoresEl.classList.toggle('compact',scoreState===1);
  scoreToggle.textContent=scoreState===0?'▦':(scoreState===1?'▪':'☰');
  scoreToggle.title=scoreState===0?'Shrink scoreboard':(scoreState===1?'Hide scoreboard':'Show scoreboard');
}
scoreToggle.addEventListener('click',function(){scoreState=(scoreState+1)%3;applyScoresVis();try{localStorage.setItem('frea_scorestate',scoreState);}catch(e){}});

/* ===== PLAYER STATS (localStorage) ===== */
function defaultStats(){return {pointsByMode:{classic:0,race:0,survival:0,tag:0,zen:0},matchesByMode:{classic:0,race:0,survival:0,tag:0,zen:0},winsByMode:{classic:0,race:0,survival:0,tag:0,zen:0},lifetimeInfected:0,timesInfected:0,totalLaunches:0,orbsCaptured:0,roundsWon:0,fleasSpawnedZen:0,peakZenFleas:0,survivalEliminations:0,objectsPlaced:0,playMs:0,matchesPlayed:0,emoteInteractions:0,lavaDeaths:0,hnsFinds:0};}
var STATS=(function(){try{var s=localStorage.getItem('frea_stats_v1');var base=defaultStats();if(s){var p=JSON.parse(s);Object.keys(base).forEach(function(k){if(base[k]&&typeof base[k]==='object'){base[k]=Object.assign(base[k],p[k]||{});}else if(p[k]!=null)base[k]=p[k];});}return base;}catch(e){return defaultStats();}})();
function saveStats(){try{localStorage.setItem('frea_stats_v1',JSON.stringify(STATS));}catch(e){}}
function bump(k,a){STATS[k]=(STATS[k]||0)+(a==null?1:a);saveStats();}
function bumpMode(o,m,a){if(!STATS[o])STATS[o]={};STATS[o][m]=(STATS[o][m]||0)+(a==null?1:a);saveStats();}
var MODE_LABEL={classic:'Capture the Orb',race:'Race',survival:'Burning Orb',tag:'Infectious',zen:'Zen'};
var MODE_EMOJI={classic:'◎',race:'🏁',survival:'🔥',tag:'🦠',zen:'🧘'};
function fmtTime(ms){var s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;if(h)return h+'h '+m+'m';if(m)return m+'m '+ss+'s';return ss+'s';}
function renderStats(){
  var b=document.getElementById('stats-body');if(!b)return;
  var totalPts=Object.keys(STATS.pointsByMode).reduce(function(a,k){return a+(STATS.pointsByMode[k]||0);},0);
  var totalWins=Object.keys(STATS.winsByMode).reduce(function(a,k){return a+(STATS.winsByMode[k]||0);},0);
  var cards=[
    {v:totalPts,l:'Total Points'},{v:totalWins,l:'Total Wins'},
    {v:saved.length,l:'Fleas Created'},{v:STATS.matchesPlayed,l:'Matches Played'},
    {v:STATS.lifetimeInfected,l:'Fleas You Infected'},{v:STATS.timesInfected,l:'Times Infected'},
    {v:STATS.orbsCaptured,l:'Orbs Grabbed'},{v:STATS.roundsWon,l:'Rounds Won'},
    {v:STATS.totalLaunches,l:'Slingshot Launches'},{v:STATS.survivalEliminations,l:'Burns Survived'},
    {v:STATS.fleasSpawnedZen,l:'Zen Fleas Spawned'},{v:STATS.objectsPlaced,l:'Zen Objects Placed'},
    {v:STATS.peakZenFleas,l:'Peak Zen Fleas'},{v:STATS.emoteInteractions,l:'Emotes Sent'},
    {v:fmtTime(STATS.playMs),l:'Time Played'}
  ];
  var html='<div class="stat-grid">';
  cards.forEach(function(c,i){html+='<div class="stat-card" style="animation-delay:'+(i*0.025)+'s"><div class="stat-v">'+c.v+'</div><div class="stat-l">'+c.l+'</div></div>';});
  html+='</div><div class="stat-section">Points · Wins by Mode</div>';
  ['classic','race','survival','tag','zen'].forEach(function(m){
    html+='<div class="mode-stat-row"><span class="msn">'+MODE_EMOJI[m]+' '+MODE_LABEL[m]+'</span><span class="msv">'+(STATS.pointsByMode[m]||0)+' pts · '+(STATS.winsByMode[m]||0)+' wins</span></div>';
  });
  b.innerHTML=html;
}
document.getElementById('stats-toggle').addEventListener('click',function(){renderStats();document.getElementById('stats-modal').classList.add('open');});
document.getElementById('stats-close').addEventListener('click',function(){document.getElementById('stats-modal').classList.remove('open');});
document.getElementById('stats-done').addEventListener('click',function(){document.getElementById('stats-modal').classList.remove('open');});
document.getElementById('stats-reset').addEventListener('click',function(){if(confirm('Reset all stats?')){STATS=defaultStats();saveStats();renderStats();}});
document.getElementById('stats-modal').addEventListener('click',function(e){if(e.target.id==='stats-modal')document.getElementById('stats-modal').classList.remove('open');});

/* ===== ZEN OBJECTS + ENVIRONMENTS ===== */
var ENV={
  neon:{sky:['#0c0720','#05060f'],name:'Neon'},
  forest:{sky:['#16361f','#08160d'],name:'Forest'},
  beach:{sky:['#2a4a6a','#0e2236'],name:'Beach'},
  living:{sky:['#3a2a3a','#1a1018'],name:'Room'},
  space:{sky:['#1a1040','#03030a'],name:'Space'}
};
/* special platform types */
var PTYPES=['bouncy','lava','slippery','icy','pool','cloud'];
var PTYPE_COL={bouncy:'#39ff7a',lava:'#ff5a2a',slippery:'#7ad9ff',icy:'#cdefff',pool:'#2aa8ff',cloud:'#e8f0ff'};
var PTYPE_GLOW={bouncy:'#39ff7a',lava:'#ff8a2a',slippery:'#7ad9ff',icy:'#cdefff',pool:'#2aa8ff',cloud:'#cfe0ff'};
function respawnFlea(f){
  var cands=[];for(var i=0;i<platforms.length;i++){var p=platforms[i];if(!p.deco&&!p.wall&&p.ptype!=='lava'&&i>=3)cands.push(p);}
  if(cands.length){var p=cands[(Math.random()*cands.length)|0],tp=p.topPoint();f.x=tp.x-f.w/2;f.y=tp.y-f.h-2;}
  else {f.x=WORLD_W/2-f.w/2;f.y=120;}
  f.vx=0;f.vy=0;f.stuck=true;f.platform=null;f.onG=false;f.angle=0;f.frozen=0;f.stickTime=Date.now();
}
function lavaHit(f){
  ofx(f.cx,f.cy);for(var i=0;i<10;i++){var a=Math.random()*7,s=2+Math.random()*4;parts.push({x:f.cx,y:f.cy,vx:Math.cos(a)*s,vy:-Math.abs(Math.sin(a))*s-3,l:1,r:2+Math.random()*3,c:i%2?'#ff5a2a':'#ffd23d'});}
  camera.shake=Math.max(camera.shake,8);bump('lavaDeaths');
  respawnFlea(f);if(f.isP)flash('Ouch! Lava!','#ff5a2a');
}
/* dynamic-object physics profiles (g=gravity, b=bounce, fr=ground friction, air=drag; float=buoyant) */
var DECO_PHYS={
  balloon:{g:-0.05,b:0.55,fr:0.99,air:0.992,float:true},
  beachball:{g:0.34,b:0.72,fr:0.985,air:0.995},
  crate:{g:0.42,b:0.12,fr:0.84,air:0.995},
  mushroom:{g:0.4,b:0.5,fr:0.9,air:0.995},
  rock:{g:0.55,b:0.08,fr:0.78,air:0.995},
  couch:{g:0.4,b:0.05,fr:0.8,air:0.99},
  tv:{g:0.4,b:0.05,fr:0.82,air:0.99},
  lamp:{g:0.4,b:0.05,fr:0.82,air:0.99},
  plant:{g:0.4,b:0.1,fr:0.82,air:0.99}
};
function spawnZen(type){
  if(STATE!=='play'||gameMode!=='zen')return;
  if(type==='clear'){platforms=platforms.filter(function(p){return !p.deco;});flash('Objects cleared','#9b6bff');return;}
  if(type==='clearplats'){var keep=platforms.slice(0,3),decos=platforms.filter(function(p){return p.deco;});platforms=keep.concat(decos);flash('Platforms cleared','#ff3db5');return;}
  var px=camera.x+W/2+(Math.random()-.5)*120, py=camera.y+H*0.28;
  if(type==='normalplat'||PTYPES.indexOf(type)>=0){var ptt=(type==='normalplat')?'normal':type,pw=90,ph=18,pyp=camera.y+H*(0.18+Math.random()*0.5),pp=new Platform({kind:'rect',x:px-pw/2,y:pyp,w:pw,h:ph,ptype:ptt});pp._userplat=true;platforms.push(pp);bump('objectsPlaced');ofx(px,pyp);flash('Placed '+ptt+' platform!','#2de2ff');return;}
  var p;
  if(type==='orb'||type==='burning'||type==='balloon'||type==='beachball'){
    var r=type==='balloon'?16:(type==='beachball'?22:18);
    p=new Platform({kind:'circle',x:px,y:py,r:r});p.deco=type;p.bob=Math.random()*6;
  }else if(type==='rock'){
    var rr=22+Math.random()*8;p=new Platform({kind:'circle',x:px,y:py,r:rr});p.deco='rock';
  }else{
    var dims={couch:[86,34],lamp:[16,52],plant:[34,46],tv:[64,42],crate:[40,40],mushroom:[40,38]}[type]||[44,40];
    p=new Platform({kind:'rect',x:px-dims[0]/2,y:py,w:dims[0],h:dims[1]});p.deco=type;
  }
  p.decoCol='hsl('+(Math.random()*360|0)+',75%,60%)';
  if(DECO_PHYS[type]){p.phys=DECO_PHYS[type];p.vx=(Math.random()-.5)*2;p.vy=0;}
  platforms.push(p);bump('objectsPlaced');ofx(px,py);flash('Placed '+type+'!','#2de2ff');
}
/* ----- dynamic object physics (zen) ----- */
function decoHalf(p){if(p.kind==='circle')return {hw:p.r,hh:p.r};if(p.kind==='rect')return {hw:p.w/2,hh:p.h/2};return {hw:p.bw/2,hh:p.bh/2};}
function resolveDecoBounds(p,ph){
  var h=decoHalf(p),hw=h.hw,hh=h.hh,floorY=WORLD_H-60;
  if(p.ceny+hh>floorY){p._shift(0,floorY-(p.ceny+hh));if(p.vy>0)p.vy=-p.vy*ph.b;if(Math.abs(p.vy)<0.6)p.vy=0;p.vx*=ph.fr;}
  if(p.ceny-hh<6){p._shift(0,6-(p.ceny-hh));if(p.vy<0)p.vy=-p.vy*ph.b*0.5;if(ph.float&&Math.abs(p.vy)<0.35)p.vy=0;}
  if(p.cenx-hw<15){p._shift(15-(p.cenx-hw),0);if(p.vx<0)p.vx=-p.vx*ph.b;}
  if(p.cenx+hw>WORLD_W-15){p._shift((WORLD_W-15)-(p.cenx+hw),0);if(p.vx>0)p.vx=-p.vx*ph.b;}
  for(var i=3;i<platforms.length;i++){var q=platforms[i];if(q===p||q.deco||q.wall)continue;
    var px=p.cenx-hw,py=p.ceny-hh,pw=hw*2,phh=hh*2;
    if(px<q.bx+q.bw&&px+pw>q.bx&&py<q.by+q.bh&&py+phh>q.by){
      var ox=Math.min(px+pw-q.bx,q.bx+q.bw-px),oy=Math.min(py+phh-q.by,q.by+q.bh-py);
      if(ox<oy){if(p.cenx<q.bx+q.bw/2)p._shift(-ox,0);else p._shift(ox,0);p.vx=-p.vx*ph.b;}
      else{if(p.ceny<q.by+q.bh/2){p._shift(0,-oy);if(p.vy>0)p.vy=-p.vy*ph.b;if(Math.abs(p.vy)<0.6)p.vy=0;p.vx*=ph.fr;}else{p._shift(0,oy);if(p.vy<0)p.vy=-p.vy*ph.b;}}
    }
  }
}
function updateDecoPhysics(dt){
  var dyn=[];
  for(var i=0;i<platforms.length;i++){var p=platforms[i];if(!p.deco||!p.phys)continue;
    if(grabbed===p){p.vx=0;p.vy=0;p.pdx=0;p.pdy=0;dyn.push(p);continue;}
    dyn.push(p);
    var ph=p.phys,sc0=p.cenx,sc1=p.ceny;
    p.vy+=ph.g;p.vx*=ph.air;p.vy*=ph.air;
    var sp=Math.hypot(p.vx,p.vy),maxv=15;if(sp>maxv){p.vx=p.vx/sp*maxv;p.vy=p.vy/sp*maxv;}
    var steps=Math.max(1,Math.ceil(Math.max(Math.abs(p.vx),Math.abs(p.vy))/4));
    for(var s=0;s<steps;s++){p._shift(p.vx/steps,p.vy/steps);resolveDecoBounds(p,ph);}
    p.pdx=p.cenx-sc0;p.pdy=p.ceny-sc1;
  }
  for(var a=0;a<dyn.length;a++)for(var b=a+1;b<dyn.length;b++){
    var A=dyn[a],B=dyn[b],hA=decoHalf(A),hB=decoHalf(B);
    var ra=Math.max(hA.hw,hA.hh),rb=Math.max(hB.hw,hB.hh);
    var dx=B.cenx-A.cenx,dy=B.ceny-A.ceny,d=Math.hypot(dx,dy),md=ra+rb;
    if(d<md&&d>0.001){var nx=dx/d,ny=dy/d,ov=(md-d)*0.5;
      if(grabbed!==A)A._shift(-nx*ov,-ny*ov);if(grabbed!==B)B._shift(nx*ov,ny*ov);
      var rel=(A.vx-B.vx)*nx+(A.vy-B.vy)*ny;if(rel>0){var imp=rel*0.5;A.vx-=imp*nx;A.vy-=imp*ny;B.vx+=imp*nx;B.vy+=imp*ny;}
    }
  }
}
function drawDeco(p,cx,cy){
  var x=p.bx-cx,y=p.by-cy,w=p.bw,h=p.bh,t=p.deco;ctx.save();
  if(t==='orb'||t==='burning'){var ox=p.x-cx,oy=p.y-cy+Math.sin((p.bob||0)+orbPulse)*3;var hot=t==='burning';
    var ag=ctx.createRadialGradient(ox,oy,2,ox,oy,p.r*3);ag.addColorStop(0,hot?'rgba(255,90,30,.6)':'rgba(255,210,80,.5)');ag.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ag;ctx.beginPath();ctx.arc(ox,oy,p.r*3,0,7);ctx.fill();
    var cg=ctx.createRadialGradient(ox-4,oy-4,2,ox,oy,p.r);if(hot){cg.addColorStop(0,'#fff');cg.addColorStop(.4,'#ffd23d');cg.addColorStop(.8,'#ff3b00');cg.addColorStop(1,'#7a1500');}else{cg.addColorStop(0,'#fff');cg.addColorStop(.4,'#fff2b0');cg.addColorStop(1,'#ffaa00');}ctx.fillStyle=cg;ctx.shadowColor=hot?'#ff3b00':'#ffd23d';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(ox,oy,p.r,0,7);ctx.fill();
    if(hot){for(var i=0;i<5;i++){var a=orbPulse*2+i*1.3;ctx.fillStyle=i%2?'#ff7a1a':'#ffd23d';ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(ox+Math.cos(a)*p.r*0.7,oy-p.r*0.8-Math.abs(Math.sin(a))*6,2.5,5,0,0,7);ctx.fill();}ctx.globalAlpha=1;}
    ctx.restore();return;}
  if(t==='balloon'){var ox=p.x-cx,oy=p.y-cy+Math.sin((p.bob||0)+orbPulse)*4;ctx.fillStyle=p.decoCol;ctx.strokeStyle='rgba(255,255,255,.3)';ctx.shadowColor=p.decoCol;ctx.shadowBlur=12;ctx.beginPath();ctx.ellipse(ox,oy,p.r*0.85,p.r,0,0,7);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.ellipse(ox-4,oy-5,3,4,0,0,7);ctx.fill();ctx.strokeStyle=p.decoCol;ctx.beginPath();ctx.moveTo(ox,oy+p.r);ctx.lineTo(ox+2,oy+p.r+12);ctx.stroke();ctx.restore();return;}
  if(t==='beachball'){var ox=p.x-cx,oy=p.y-cy;var cols=['#ff3db5','#ffd23d','#2de2ff','#c6ff3d'];for(var i=0;i<4;i++){ctx.fillStyle=cols[i];ctx.beginPath();ctx.moveTo(ox,oy);ctx.arc(ox,oy,p.r,i*Math.PI/2+orbPulse*0.2,(i+1)*Math.PI/2+orbPulse*0.2);ctx.closePath();ctx.fill();}ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.arc(ox-p.r*0.3,oy-p.r*0.3,p.r*0.25,0,7);ctx.fill();ctx.restore();return;}
  if(t==='rock'){var ox=p.x-cx,oy=p.y-cy;var rg=ctx.createRadialGradient(ox-p.r*0.4,oy-p.r*0.4,2,ox,oy,p.r);rg.addColorStop(0,'#8a8f9c');rg.addColorStop(.6,'#5c606c');rg.addColorStop(1,'#33363f');ctx.fillStyle=rg;ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(ox,oy,p.r,0,7);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.arc(ox+p.r*0.3,oy+p.r*0.25,p.r*0.16,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.ellipse(ox-p.r*0.35,oy-p.r*0.4,p.r*0.22,p.r*0.13,-0.5,0,7);ctx.fill();ctx.restore();return;}
  if(t==='couch'){ctx.fillStyle='#8a4a8a';ctx.strokeStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.roundRect(x,y,w,h,7);ctx.fill();ctx.fillStyle='#a85ca8';ctx.beginPath();ctx.roundRect(x+4,y-10,w-8,16,6);ctx.fill();ctx.fillStyle='#9b4f9b';ctx.fillRect(x+2,y+4,8,h-8);ctx.fillRect(x+w-10,y+4,8,h-8);}
  else if(t==='lamp'){ctx.strokeStyle='#888';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+w/2,y+h);ctx.lineTo(x+w/2,y+12);ctx.stroke();ctx.fillStyle='#ffd23d';ctx.shadowColor='#ffd23d';ctx.shadowBlur=20;ctx.beginPath();ctx.moveTo(x-6,y+12);ctx.lineTo(x+w+6,y+12);ctx.lineTo(x+w/2,y-6);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#555';ctx.fillRect(x+w/2-7,y+h-3,14,4);}
  else if(t==='plant'){ctx.fillStyle='#a0623a';ctx.beginPath();ctx.moveTo(x+4,y+h);ctx.lineTo(x+w-4,y+h);ctx.lineTo(x+w-7,y+h-14);ctx.lineTo(x+7,y+h-14);ctx.closePath();ctx.fill();ctx.fillStyle='#3fbf5f';for(var i=0;i<5;i++){var a=-Math.PI/2+(i-2)*0.5;ctx.save();ctx.translate(x+w/2,y+h-14);ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,-13,5,15,0,0,7);ctx.fill();ctx.restore();}}
  else if(t==='tv'){ctx.fillStyle='#15151f';ctx.beginPath();ctx.roundRect(x,y,w,h,5);ctx.fill();ctx.fillStyle='#0a2a3a';ctx.fillRect(x+4,y+4,w-8,h-12);var sg=ctx.createLinearGradient(x,y,x+w,y+h);sg.addColorStop(0,'rgba(45,226,255,.5)');sg.addColorStop(1,'rgba(155,107,255,.3)');ctx.fillStyle=sg;ctx.fillRect(x+4,y+4,w-8,h-12);ctx.fillStyle='#333';ctx.fillRect(x+w/2-8,y+h-6,16,5);}
  else if(t==='crate'){ctx.fillStyle='#a0703a';ctx.strokeStyle='#5a3a1a';ctx.lineWidth=2;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y+h);ctx.moveTo(x+w,y);ctx.lineTo(x,y+h);ctx.stroke();}
  else if(t==='mushroom'){ctx.fillStyle='#f0e6d0';ctx.fillRect(x+w/2-5,y+12,10,h-12);ctx.fillStyle='#e0402a';ctx.beginPath();ctx.ellipse(x+w/2,y+14,w/2,16,0,Math.PI,0);ctx.fill();ctx.fillStyle='rgba(255,255,255,.8)';[[-8,8],[6,6],[0,3]].forEach(function(d){ctx.beginPath();ctx.arc(x+w/2+d[0],y+10+d[1],2.5,0,7);ctx.fill();});}
  ctx.restore();
}

function chooseLayout(){
  if(gameMode==='race'){activeLayout='vert';return;}
  if(gameMode==='tag'||gameMode==='hns'){activeLayout='box';return;}
  if(gameMode==='tutorial'){activeLayout='box';return;}
  activeLayout=arenaLayout==='random'?['horiz','vert','box'][Math.random()*3|0]:arenaLayout;
}
function worldBounds(){
  var bw=Math.max(W,560),bh=Math.max(H,460);
  if(gameMode==='tutorial'){WORLD_W=Math.max(W,560);WORLD_H=Math.max(H,460);return;}
  if(gameMode==='tag'){WORLD_W=bw*2.8;WORLD_H=bh*2.2;return;}
  if(gameMode==='hns'){WORLD_W=bw*1.95;WORLD_H=bh*1.7;return;}
  if(activeLayout==='horiz'){WORLD_W=bw*2.6;WORLD_H=bh;}
  else if(activeLayout==='vert'){WORLD_W=bw;WORLD_H=bh*2.8;}
  else{WORLD_W=bw*2;WORLD_H=bh*2;}
}

/* ===== Geometry helpers ===== */
function sign(px,py,ax,ay,bx,by){return (px-bx)*(ay-by)-(ax-bx)*(py-by);}
function pointInPoly(px,py,pts){
  var neg=false,pos=false;
  for(var i=0;i<pts.length;i++){var a=pts[i],b=pts[(i+1)%pts.length];
    var d=(px-b[0])*(a[1]-b[1])-(a[0]-b[0])*(py-b[1]);
    if(d<0)neg=true;if(d>0)pos=true;if(neg&&pos)return false;}
  return true;
}
function closestOnSeg(px,py,ax,ay,bx,by,cen){
  var abx=bx-ax,aby=by-ay;var t=Math.max(0,Math.min(1,((px-ax)*abx+(py-ay)*aby)/(abx*abx+aby*aby||1)));
  var cx=ax+abx*t,cy=ay+aby*t,d=Math.hypot(px-cx,py-cy);
  var nx=-aby,ny=abx;var len=Math.hypot(nx,ny)||1;nx/=len;ny/=len;
  if(((cen[0]-cx)*nx+(cen[1]-cy)*ny)>0){nx=-nx;ny=-ny;}
  return [cx,cy,d,nx,ny];
}

/* ===== PLATFORMS — multi-shape + moving/spinning ===== */
function Platform(opts){
  Object.assign(this,opts);
  this.pdx=0;this.pdy=0;this.drot=0;this.mvOff=0;this.mph=Math.random()*6.28;this.spinA=0;
  if(this.kind==='rect'){this.cenx=this.x+this.w/2;this.ceny=this.y+this.h/2;}
  else if(this.kind==='circle'){this.cenx=this.x;this.ceny=this.y;}
  else{this._centroid();}
  this._computeBBox();
}
Platform.prototype._centroid=function(){var sx=0,sy=0;for(var i=0;i<this.pts.length;i++){sx+=this.pts[i][0];sy+=this.pts[i][1];}this.cenx=sx/this.pts.length;this.ceny=sy/this.pts.length;};
Platform.prototype._computeBBox=function(){
  if(this.kind==='rect'){this.bx=this.x;this.by=this.y;this.bw=this.w;this.bh=this.h;}
  else if(this.kind==='circle'){this.bx=this.x-this.r;this.by=this.y-this.r;this.bw=this.r*2;this.bh=this.r*2;}
  else{var xs=this.pts.map(function(p){return p[0];}),ys=this.pts.map(function(p){return p[1];});this.bx=Math.min.apply(null,xs);this.by=Math.min.apply(null,ys);this.bw=Math.max.apply(null,xs)-this.bx;this.bh=Math.max.apply(null,ys)-this.by;}
};
Platform.prototype._shift=function(dx,dy){
  this.cenx+=dx;this.ceny+=dy;
  if(this.kind==='rect'||this.kind==='circle'){this.x+=dx;this.y+=dy;}
  else{for(var i=0;i<this.pts.length;i++){this.pts[i][0]+=dx;this.pts[i][1]+=dy;}}
  this._computeBBox();
};
Platform.prototype._rotate=function(dr){
  if(this.kind==='poly'){var c=Math.cos(dr),s=Math.sin(dr),cx=this.cenx,cy=this.ceny;
    for(var i=0;i<this.pts.length;i++){var rx=this.pts[i][0]-cx,ry=this.pts[i][1]-cy;this.pts[i][0]=cx+rx*c-ry*s;this.pts[i][1]=cy+rx*s+ry*c;}
    this._computeBBox();}
  this.spinA+=dr;
};
Platform.prototype.update=function(dt){
  this.pdx=0;this.pdy=0;this.drot=0;
  if(STATE!=='play')return;
  if(this.mv){
    this.mph+=this.mv.speed*dt;
    var off=Math.sin(this.mph)*this.mv.range;var d=off-this.mvOff;this.mvOff=off;
    if(this.mv.axis==='x'){this.pdx=d;this._shift(d,0);}else{this.pdy=d;this._shift(0,d);}
  }
  if(this.sp){var dr=this.sp.av*dt;this.drot=dr;this._rotate(dr);}
};
Platform.prototype.draw=function(cx,cy){
  if(this.bx+this.bw<cx||this.bx>cx+W||this.by+this.bh<cy||this.by>cy+H)return;
  if(this.deco){drawDeco(this,cx,cy);return;}
  if(this.wall)return; /* invisible bounds */
  ctx.save();
  var base=this.matBase||PTYPE_COL[this.ptype]||pal.a, glow=this.matGlow||PTYPE_GLOW[this.ptype]||pal.glow;
  var hi=lighten(base,0.62),mid=lighten(base,0.12),lo=darken(base,0.30),edge=lighten(base,0.8);
  if(this.kind==='rect'){
    var x=this.x-cx,y=this.y-cy,w=this.w,h=this.h,r=Math.min(10,h/2);
    if(!perfMode){ctx.save();ctx.globalAlpha=.32;ctx.fillStyle='#000';ctx.beginPath();ctx.roundRect(x+2,y+5,w,h,r);ctx.fill();ctx.restore();}
    var g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,hi);g.addColorStop(.5,mid);g.addColorStop(1,lo);
    ctx.shadowColor=glow;ctx.shadowBlur=perfMode?0:15;ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();ctx.shadowBlur=0;
    ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.clip();
    var sg=ctx.createLinearGradient(0,y,0,y+h*0.58);sg.addColorStop(0,'rgba(255,255,255,.6)');sg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sg;ctx.fillRect(x,y,w,h*0.58);
    var bg2=ctx.createLinearGradient(0,y+h*0.5,0,y+h);bg2.addColorStop(0,'rgba(0,0,0,0)');bg2.addColorStop(1,'rgba(0,0,0,.3)');ctx.fillStyle=bg2;ctx.fillRect(x,y+h*0.5,w,h*0.5);
    ctx.restore();
    ctx.strokeStyle=rgbaOf(edge,.9);ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x+1.1,y+1.1,w-2.2,h-2.2,Math.max(1,r-1));ctx.stroke();
  }else if(this.kind==='circle'){
    var x2=this.x-cx,y2=this.y-cy,rr=this.r;
    if(!perfMode){ctx.save();ctx.globalAlpha=.3;ctx.fillStyle='#000';ctx.beginPath();ctx.arc(x2+2,y2+5,rr,0,7);ctx.fill();ctx.restore();}
    var rg=ctx.createRadialGradient(x2-rr*0.4,y2-rr*0.45,rr*0.15,x2,y2,rr);rg.addColorStop(0,hi);rg.addColorStop(.55,mid);rg.addColorStop(1,lo);
    ctx.shadowColor=glow;ctx.shadowBlur=perfMode?0:15;ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x2,y2,rr,0,7);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle=rgbaOf(edge,.85);ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(x2,y2,rr-1,0,7);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.78)';ctx.beginPath();ctx.ellipse(x2-rr*.34,y2-rr*.42,rr*.26,rr*.16,-0.5,0,7);ctx.fill();
    if(this.sp){ctx.globalAlpha=.5;ctx.strokeStyle=rgbaOf(edge,.7);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2+Math.cos(this.spinA)*rr*.8,y2+Math.sin(this.spinA)*rr*.8);ctx.stroke();ctx.globalAlpha=1;}
  }else{
    var pts=this.pts,bxc=this.bx,bwc=this.bw;
    function trace(ox,oy){ctx.beginPath();pts.forEach(function(p,i){var px=p[0]-cx+ox,py=p[1]-cy+oy;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();}
    var ys=pts.map(function(p){return p[1];}),top=Math.min.apply(null,ys),bot=Math.max.apply(null,ys);
    if(!perfMode){ctx.save();ctx.globalAlpha=.3;ctx.fillStyle='#000';trace(2,5);ctx.fill();ctx.restore();}
    var pg=ctx.createLinearGradient(0,top-cy,0,bot-cy);pg.addColorStop(0,hi);pg.addColorStop(.5,mid);pg.addColorStop(1,lo);
    ctx.shadowColor=glow;ctx.shadowBlur=perfMode?0:15;ctx.fillStyle=pg;trace(0,0);ctx.fill();ctx.shadowBlur=0;
    ctx.save();trace(0,0);ctx.clip();var sg2=ctx.createLinearGradient(0,top-cy,0,top-cy+(bot-top)*0.58);sg2.addColorStop(0,'rgba(255,255,255,.52)');sg2.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sg2;ctx.fillRect(bxc-cx,top-cy,bwc,(bot-top)*0.62);ctx.restore();
    ctx.strokeStyle=rgbaOf(edge,.85);ctx.lineWidth=1.6;trace(0,0);ctx.stroke();
  }
  if(this.sp&&this.kind!=='circle'){ctx.globalAlpha=.6;ctx.strokeStyle=rgbaOf(edge,.7);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(this.cenx-cx,this.ceny-cy,5,0,7);ctx.stroke();ctx.fillStyle=rgbaOf(edge,.8);ctx.beginPath();ctx.arc(this.cenx-cx,this.ceny-cy,1.6,0,7);ctx.fill();}
  if(this.mv){ctx.globalAlpha=.55;ctx.fillStyle=rgbaOf(lighten(base,0.3),.8);ctx.beginPath();ctx.arc(this.cenx-cx,this.ceny-cy,2.5,0,7);ctx.fill();}
  if(this.ptype&&this.ptype!=='normal')drawPlatFX(this,cx,cy);
  ctx.globalAlpha=1;ctx.restore();
};
function drawPlatFX(p,cx,cy){
  var t=performance.now()/1000,x=p.bx-cx,y=p.by-cy,w=p.bw,h=p.bh,pt=p.ptype;
  ctx.save();
  if(pt==='lava'){
    ctx.fillStyle='rgba(255,120,40,.9)';for(var i=0;i<Math.max(2,w/26|0);i++){var bx=x+8+i*24+Math.sin(t*2+i)*4,by=y+h*0.5-Math.abs(Math.sin(t*1.5+i*1.3))*(h*0.4),r=2+Math.abs(Math.sin(t*2+i))*2.5;ctx.beginPath();ctx.arc(bx,by,r,0,7);ctx.fill();}
    ctx.strokeStyle='rgba(255,220,120,.9)';ctx.lineWidth=2;ctx.beginPath();for(var xx=0;xx<=w;xx+=6){var yy=y+3+Math.sin(t*4+xx*0.15)*2;if(xx===0)ctx.moveTo(x+xx,yy);else ctx.lineTo(x+xx,yy);}ctx.stroke();
  }else if(pt==='pool'){
    ctx.strokeStyle='rgba(220,245,255,.8)';ctx.lineWidth=2;ctx.beginPath();for(var xx2=0;xx2<=w;xx2+=6){var yy2=y+4+Math.sin(t*3+xx2*0.2)*2.5;if(xx2===0)ctx.moveTo(x+xx2,yy2);else ctx.lineTo(x+xx2,yy2);}ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.35)';for(var i2=0;i2<3;i2++){var rr=(t*20+i2*40)% (Math.max(20,w));ctx.beginPath();ctx.arc(x+rr,y+h*0.5,3+i2,0,7);ctx.stroke?0:0;ctx.globalAlpha=.3;ctx.stroke();}ctx.globalAlpha=1;
  }else if(pt==='icy'){
    ctx.fillStyle='rgba(255,255,255,.7)';for(var i3=0;i3<Math.max(3,w/22|0);i3++){var sx=x+6+i3*20+Math.sin(t+i3)*2,sy=y+4+((i3*13)%Math.max(6,h-6));ctx.save();ctx.translate(sx,sy);ctx.rotate(t*0.5+i3);ctx.fillRect(-0.7,-3,1.4,6);ctx.fillRect(-3,-0.7,6,1.4);ctx.restore();}
  }else if(pt==='bouncy'){
    ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;var bo=Math.abs(Math.sin(t*4))*3;for(var i4=0;i4<Math.max(2,w/30|0);i4++){var cxp=x+16+i4*30;ctx.beginPath();ctx.moveTo(cxp-6,y+h*0.55-bo);ctx.lineTo(cxp,y+h*0.3-bo);ctx.lineTo(cxp+6,y+h*0.55-bo);ctx.stroke();}
  }else if(pt==='slippery'){
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.6;for(var i5=0;i5<3;i5++){var yy5=y+4+i5*4;ctx.beginPath();ctx.moveTo(x+8+((t*30+i5*20)%Math.max(10,w-16)),yy5);ctx.lineTo(x+8+((t*30+i5*20)%Math.max(10,w-16))+10,yy5);ctx.stroke();}
  }else if(pt==='cloud'){
    ctx.fillStyle='rgba(255,255,255,.5)';for(var i6=0;i6<Math.max(3,w/24|0);i6++){var pxp=x+10+i6*22,pyp=y+4+Math.sin(t*2+i6)*2;ctx.beginPath();ctx.arc(pxp,pyp,6,0,7);ctx.fill();}
  }
  ctx.restore();
}
Platform.prototype._land=function(f,ivx,ivy,nx,ny){
  var pt=this.ptype;
  if(!pt||pt==='normal'){f.vx=0;f.vy=0;f.stuck=true;f.platform=this;f.stickTime=Date.now();if(f.sq<0.75)f.sq=0.65;return true;}
  if(pt==='lava'){lavaHit(f);return true;}
  if(pt==='bouncy'){var dot=ivx*nx+ivy*ny,rvx=ivx-1.9*dot*nx,rvy=ivy-1.9*dot*ny,sp=Math.hypot(rvx,rvy),mb=11;if(sp<mb){rvx+=nx*mb;rvy+=ny*mb;}f.vx=rvx;f.vy=rvy;f.stuck=false;f.platform=null;f.onG=false;f.sq=0.5;jpfx(f.cx,f.cy,'#39ff7a');return true;}
  if(pt==='slippery'){var dot2=ivx*nx+ivy*ny,rvx2=ivx-1.05*dot2*nx,rvy2=ivy-1.05*dot2*ny,tx=-ny,ty=nx,td=rvx2*tx+rvy2*ty;if(Math.abs(td)<2){var s=(Math.random()>.5?1:-1)*4;rvx2+=tx*s;rvy2+=ty*s;}f.vx=rvx2*1.02;f.vy=rvy2*1.02;f.stuck=false;f.platform=null;f.onG=false;return true;}
  if(pt==='icy'){f.vx=0;f.vy=0;f.stuck=true;f.platform=this;f.stickTime=Date.now();f.frozen=Date.now()+5000;if(f.sq<0.75)f.sq=0.65;jpfx(f.cx,f.cy,'#cdefff');return true;}
  if(pt==='cloud'){var pow=9;f.vx=nx*pow+(Math.random()-.5)*6;f.vy=ny*pow-4;f.stuck=false;f.platform=null;f.onG=false;jpfx(f.cx,f.cy,'#e8f0ff');return true;}
  if(pt==='pool'){f.vx*=0.3;f.vy=0;f.stuck=true;f.platform=this;f.stickTime=Date.now();f._pool=Date.now();if(f.sq<0.8)f.sq=0.7;return true;}
  f.vx=0;f.vy=0;f.stuck=true;f.platform=this;return true;
};
Platform.prototype.collide=function(f){
  var ivx=f.vx,ivy=f.vy;
  var fx=f.x,fy=f.y,fw=f.w,fh=f.h,fcx=fx+fw/2,fcy=fy+fh/2;
  if(this.kind==='rect'){
    if(!(fx+fw>this.x&&fx<this.x+this.w&&fy+fh>this.y&&fy<this.y+this.h))return false;
    var ox=Math.min(fx+fw-this.x,this.x+this.w-fx),oy=Math.min(fy+fh-this.y,this.y+this.h-fy);
    var nx=0,ny=0;
    if(ox<oy){if(fcx<this.x+this.w/2){f.x=this.x-fw;f.angle=Math.PI/2;nx=-1;}else{f.x=this.x+this.w;f.angle=-Math.PI/2;nx=1;}}
    else{if(fcy<this.y+this.h/2){f.y=this.y-fh;f.onG=true;f.angle=0;ny=-1;}else{f.y=this.y+this.h;f.angle=Math.PI;ny=1;}}
    return this._land(f,ivx,ivy,nx,ny);
  }
  if(this.kind==='circle'){
    var dx=fcx-this.x,dy=fcy-this.y,d=Math.hypot(dx,dy),fr=Math.max(fw,fh)/2-1;
    if(d>this.r+fr)return false;
    var nx=d>.01?dx/d:0,ny=d>.01?dy/d:-1;var push=this.r+fr-d;
    f.x+=nx*push;f.y+=ny*push;
    f.angle=Math.atan2(nx,-ny);f.onG=ny<-0.3;
    return this._land(f,ivx,ivy,nx,ny);
  }
  if(!(fx+fw>this.bx&&fx<this.bx+this.bw&&fy+fh>this.by&&fy<this.by+this.bh))return false;
  var pts=this.pts;var inside=pointInPoly(fcx,fcy,pts);
  var cen=[this.cenx,this.ceny];
  var best={d:1e9,nx:0,ny:-1,px:fcx,py:fcy-1};
  for(var i=0;i<pts.length;i++){var r=closestOnSeg(fcx,fcy,pts[i][0],pts[i][1],pts[(i+1)%pts.length][0],pts[(i+1)%pts.length][1],cen);if(r[2]<best.d){best.d=r[2];best.nx=r[3];best.ny=r[4];best.px=r[0];best.py=r[1];}}
  var fr2=Math.min(fw,fh)/2-1;
  if(!inside&&best.d>fr2)return false;
  var push2=inside?(best.d+fr2):(fr2-best.d);
  f.x+=best.nx*push2;f.y+=best.ny*push2;
  f.angle=Math.atan2(best.nx,-best.ny);f.onG=best.ny<-0.3;
  return this._land(f,ivx,ivy,best.nx,best.ny);
};
Platform.prototype.contains=function(x,y,pad){pad=pad||0;
  if(this.kind==='rect')return x>this.x-pad&&x<this.x+this.w+pad&&y>this.y-pad&&y<this.y+this.h+pad;
  if(this.kind==='circle')return Math.hypot(x-this.x,y-this.y)<this.r+pad;
  return pointInPoly(x,y,this.pts);
};
Platform.prototype.topPoint=function(){
  if(this.kind==='rect')return {x:this.x+this.w/2,y:this.y};
  if(this.kind==='circle')return {x:this.x,y:this.y-this.r};
  var top=this.pts[0];for(var i=1;i<this.pts.length;i++)if(this.pts[i][1]<top[1])top=this.pts[i];
  return {x:top[0],y:top[1]};
};

/* ===== FLEA ===== */
function Flea(x,y,isP,name,spec){
  spec=spec||{};
  this.x=x;this.y=y;this.vx=0;this.vy=0;this.isP=isP;this.name=name;
  this.col=spec.color||'#2de2ff';this.eyeColor=spec.eyeColor||'#101018';this.secondary=spec.secondary||'#ff3db5';
  this.shape=spec.shape||'round';this.size=spec.size||'normal';this.pattern=spec.pattern||'none';
  this.eyes=spec.eyes||'normal';this.ant=spec.ant||'curly';this.legs=spec.legs||'matching';
  this.hat=spec.hat||'none';this.wings=spec.wings||'none';this.trail=spec.trail||'none';this.aura=spec.aura||'none';
  this.cheek=spec.cheek||'on';this.mouth=spec.mouth||'smile';this.brows=spec.brows||'none';
  this.glasses=spec.glasses||'none';this.cape=spec.cape||'none';this.accessory=spec.accessory||'none';
  this.hair=spec.hair||'none';this.hairColor=spec.hairColor||'#2a1a2a';
  var sm={tiny:.7,small:.82,normal:1,large:1.28,huge:1.5};
  this.sf=sm[this.size]||1;
  this.stuck=true;this.onG=true;this.face=isP?1:(Math.random()>.5?1:-1);
  this.w=Math.round(26*this.sf);this.h=Math.round(24*this.sf);
  this.score=0;this.capture=0;this.matchPoints=0;this.infected=false;
  this.la=Math.random()*100;this.ea=Math.random()*100;this.sq=1;
  this.hasOrb=false;this.ait=20+Math.random()*40|0;this.stickTime=Date.now();
  this.crawlDir=Math.random()>.5?1:-1;this.angle=0;this.crawlT=0;this._tt=0;
  this.bubble='';this.bubbleT=0;this._wander=null;this.platform=null;this._unstuckTries=0;
  this.legStyle=spec.legStyle||'default';this.legShape=spec.legShape||'default';
  this.walkT=0;this.gaitPhase=Math.random()*6;this.reactEmote='';this.reactEmoteT=0;this.emoteEmoji='';this.emoteT=0;
  this.action='';this.actionT=0;this.actionUntil=0;
  this.hnsRole='';this.hidden=false;this.found=false;
  this.lastStuckPos={x:x,y:y,t:Date.now()};
}
Object.defineProperty(Flea.prototype,'cx',{get:function(){return this.x+this.w/2;}});
Object.defineProperty(Flea.prototype,'cy',{get:function(){return this.y+this.h/2;}});
Flea.prototype.update=function(dt){
  if(this.hidden)return;
  this.la+=dt*0.012;this.ea+=dt*0.005;this.sq+=(1-this.sq)*0.15;
  if(this.action){
    this.actionT+=dt;
    if(this.action==='squish')this.sq=0.42+Math.abs(Math.sin(this.actionT*0.006))*0.13;
    if(this.actionUntil&&Date.now()>this.actionUntil){this.action='';this.actionT=0;this.sq=1;}
  }
  if(this.reactEmoteT>0){this.reactEmoteT-=dt;if(this.reactEmoteT<=0)this.reactEmote='';}
  if(this.emoteT>0){this.emoteT-=dt;if(this.emoteT<=0)this.emoteEmoji='';}
  if(this.stuck&&Date.now()<this.walkT)this.gaitPhase+=dt*0.024;
  if(this.bubbleT>0){this.bubbleT-=dt;if(this.bubbleT<=0)this.bubble='';}
  if(STATE==='countdown'){this.vx=0;this.vy=0;return;}
  if(this.frozen&&Date.now()<this.frozen){this.vx=0;this.vy=0;return;}
  if(!this.stuck){
    this.platform=null;
    this.vy+=GRAV;
    var MAX=this.isP?PLAYER_MAX:AI_MAX,spd=Math.hypot(this.vx,this.vy);
    if(spd>MAX){this.vx=this.vx/spd*MAX;this.vy=this.vy/spd*MAX;}
    var steps=Math.ceil(Math.max(Math.abs(this.vx),Math.abs(this.vy))/3)||1;
    for(var s=0;s<steps;s++){this.x+=this.vx/steps;this.y+=this.vy/steps;if(this.collide())break;}
    this.vx*=0.985;this.vy*=0.985;this.bounds();
    if(this.trail!=='none'){this._tt+=dt;if(this._tt>34){this._tt=0;emitTrail(this);}}
  }else{this.vx=0;this.vy=0;}
};
Flea.prototype.crawl=function(a){this.walkT=Date.now()+170;if(this.angle===0||this.angle===Math.PI){this.x+=this.crawlDir*a;this.face=this.crawlDir;}else{this.y+=this.crawlDir*a;}this.bounds();};
Flea.prototype.collide=function(){this.onG=false;for(var i=0;i<platforms.length;i++){if(platforms[i].collide(this))return true;}return false;};
Flea.prototype.bounds=function(){var pad=4,hit=false;
  if(this.x<pad){this.x=pad;this.vx=0;this.stuck=true;this.platform=null;this.angle=-Math.PI/2;hit=true;}
  if(this.x+this.w>WORLD_W-pad){this.x=WORLD_W-this.w-pad;this.vx=0;this.stuck=true;this.platform=null;this.angle=Math.PI/2;hit=true;}
  if(this.y<pad){this.y=pad;this.vy=0;this.stuck=true;this.platform=null;this.angle=Math.PI;hit=true;}
  if(this.y+this.h>WORLD_H-pad){this.y=WORLD_H-this.h-pad;this.vy=0;this.vx=0;this.stuck=true;this.platform=null;this.angle=0;hit=true;}
  if(hit)this.stickTime=Date.now();
};
Flea.prototype.launch=function(vx,vy){this.action='';this.actionT=0;this.vx=vx;this.vy=vy;this.stuck=false;this.platform=null;this.onG=false;this.sq=0.5;this.angle=0;jpfx(this.cx,this.cy,this.col);};
function solveLaunch(sx,sy,tx,ty){var dx=tx-sx,dy=ty-sy,dist=Math.hypot(dx,dy);var T=Math.max(16,Math.min(52,dist/12));return {vx:dx/T,vy:(dy-0.5*GRAV*T*T)/T};}

/* carry fleas on moving/spinning platforms */
function carryStuckFleas(){
  for(var i=0;i<fleas.length;i++){
    var f=fleas[i];if(!f.stuck||!f.platform)continue;var p=f.platform;
    if(p.pdx||p.pdy){f.x+=p.pdx;f.y+=p.pdy;}
    if(p.drot){
      var cx=p.cenx,cy=p.ceny,rx=f.cx-cx,ry=f.cy-cy,rdist=Math.hypot(rx,ry);
      var av=p.sp?p.sp.av:0;
      if(Math.abs(av)>=FAST_SPIN&&rdist>4){
        var tx=-ry/(rdist||1),ty=rx/(rdist||1),dir=av>0?1:-1;
        f.launch(tx*dir*FLING_SPEED,ty*dir*FLING_SPEED-3);f.face=f.vx>0?1:-1;
        if(f.isP)camera.shake=8;continue;
      }
      var c=Math.cos(p.drot),s=Math.sin(p.drot);
      var nrx=rx*c-ry*s,nry=rx*s+ry*c;
      f.x+=(nrx-rx);f.y+=(nry-ry);f.angle+=p.drot;
    }
    if(f.collide())continue;
  }
}

/* ===== AI ===== */
function nearestOther(f,filter){var best=null,bd=1e9;for(var i=0;i<fleas.length;i++){var o=fleas[i];if(o===f)continue;if(filter&&!filter(o))continue;var d=Math.hypot(o.cx-f.cx,o.cy-f.cy);if(d<bd){bd=d;best=o;}}return {flea:best,dist:bd};}
function resolveCollisions(){
  for(var i=0;i<fleas.length;i++)for(var j=i+1;j<fleas.length;j++){
    var a=fleas[i],b=fleas[j];if(a.hidden||b.hidden)continue;var dx=b.cx-a.cx,dy=b.cy-a.cy,d=Math.hypot(dx,dy),md=(a.w+b.w)*0.45;
    if(d<md){if(d===0){dx=1;dy=0;d=1;}var ov=md-d,nx=dx/d,ny=dy/d;
      a.x-=nx*ov*.5;a.y-=ny*ov*.5;b.x+=nx*ov*.5;b.y+=ny*ov*.5;
      var pp=nx*(a.vx-b.vx)+ny*(a.vy-b.vy);
      if(pp>0){a.vx-=pp*nx;a.vy-=pp*ny;b.vx+=pp*nx;b.vy+=pp*ny;}
      if(Math.abs(a.vx)+Math.abs(a.vy)+Math.abs(b.vx)+Math.abs(b.vy)>2){if(a.stuck){a.stuck=false;a.platform=null;a.onG=false;}if(b.stuck){b.stuck=false;b.platform=null;b.onG=false;}}
      /* bump speech: a fast-moving flea hits another */
      var sa=Math.hypot(a.vx,a.vy),sb=Math.hypot(b.vx,b.vy);
      if(sa>9||sb>9){var hitter=sa>sb?a:b,victim=sa>sb?b:a;if(!victim.isP)maybeSay(victim,EVENT_LINES.bumped[Math.random()*EVENT_LINES.bumped.length|0],1500);}
    }
  }
}
function simulateLaunch(sx,sy,vx,vy,steps){
  var x=sx,y=sy;
  for(var i=0;i<steps;i++){
    vx*=0.985;vy+=GRAV;var sp=Math.hypot(vx,vy);if(sp>AI_MAX){vx=vx/sp*AI_MAX;vy=vy/sp*AI_MAX;}
    x+=vx;y+=vy;
    if(x<10)return {x:10,y:y,landed:false};
    if(x>WORLD_W-10)return {x:WORLD_W-10,y:y,landed:false};
    if(y>WORLD_H-60)return {x:x,y:WORLD_H-60,landed:true,onFloor:true};
    for(var k=0;k<platforms.length;k++){var p=platforms[k];
      if(x<p.bx-6||x>p.bx+p.bw+6||y<p.by-6||y>p.by+p.bh+6)continue;
      if(p.contains(x,y,4))return {x:x,y:y,landed:true,plat:p};
    }
  }
  return {x:x,y:y,landed:false};
}
function reachStep(f,x,y){var dx=x-f.cx,dy=y-f.cy;return Math.abs(dx)<380&&dy>-340&&Math.hypot(dx,dy)<480;}
function stepTarget(f,gx,gy){
  var curD=Math.hypot(gx-f.cx,gy-f.cy);
  if(curD<210)return {x:gx,y:gy};
  var best=null,bestCost=1e9;
  for(var i=3;i<platforms.length;i++){var p=platforms[i];
    if(p.bw>=WORLD_W*0.6)continue;
    var tp=p.topPoint();var tx=tp.x,ty=tp.y-14;
    var dGoal=Math.hypot(gx-tx,gy-ty);
    if(dGoal>=curD-24)continue;
    if(!reachStep(f,tx,ty))continue;
    var cost=dGoal+Math.hypot(tx-f.cx,ty-f.cy)*0.35;
    if(cost<bestCost){bestCost=cost;best={x:tx,y:ty};}
  }
  return best||{x:gx,y:gy};
}
function fleeTarget(f,threat,dist){
  var bx=f.cx-threat.cx,by=f.cy-threat.cy,bm=Math.hypot(bx,by)||1;
  return {x:Math.max(40,Math.min(WORLD_W-40,f.cx+bx/bm*(dist||560))),y:Math.max(40,Math.min(WORLD_H-100,f.cy+by/bm*(dist?dist*0.6:320))),flee:true};
}
function aiTarget(f){
  if(gameMode==='hns'){
    if(f===hnsSeeker){
      if(hnsPhase!=='seek')return {x:f.cx,y:f.cy};
      if(f._seekTarget)return {x:f._seekTarget.c.x,y:f._seekTarget.c.y,chase:true};
      return wanderTarget(f);
    }
    if(hnsPhase==='hide'&&!f.hidden&&f.hideSpot)return {x:f.hideSpot.x,y:f.hideSpot.y};
    return {x:f.cx,y:f.cy};
  }
  if(gameMode==='tag'){
    if(!tagSeeded)return f._wander||wanderTarget(f);
    if(f.infected){var n=nearestOther(f,function(o){return !o.infected;});return n.flea?{x:n.flea.cx,y:n.flea.cy,chase:true}:wanderTarget(f);}
    var inf=nearestOther(f,function(o){return o.infected;});return inf.flea?fleeTarget(f,inf.flea,520):wanderTarget(f);
  }
  if(gameMode==='survival'&&orbHolder){
    if(f===orbHolder){var n0=nearestOther(f);if(n0.flea)return {x:n0.flea.cx,y:n0.flea.cy};return orb?{x:orb.x,y:orb.y}:(f._wander||{x:f.cx,y:f.cy});}
    return fleeTarget(f,orbHolder,560);
  }
  if(f.hasOrb&&(gameMode==='classic')){var n=nearestOther(f);if(n.flea)return fleeTarget(f,n.flea,520);}
  if((gameMode==='classic'||gameMode==='survival'||gameMode==='race')&&orb){return stepTarget(f,orb.x,orb.y);}
  return wanderTarget(f);
}
function wanderTarget(f){
  if(!f._wander||Math.random()<0.01){var rp=platforms[3+(Math.random()*Math.max(1,platforms.length-3)|0)]||platforms[0];var tp=rp.topPoint();f._wander={x:tp.x+(Math.random()-.5)*40,y:tp.y-12};}
  return f._wander;
}
function aiLeap(f,t){
  var dx0=t.x-f.cx,dy0=t.y-f.cy;var baseAng=Math.atan2(dy0,dx0);
  var best=null,bestScore=-1e9;
  for(var aOff=-0.7;aOff<=0.71;aOff+=0.2){
    for(var pow=0.55;pow<=1.001;pow+=0.225){
      var ang=baseAng+aOff;var speed=AI_LEAP_CAP*pow;
      var vx=Math.cos(ang)*speed;var vy=Math.sin(ang)*speed-2.6;
      var sim=simulateLaunch(f.cx,f.cy,vx,vy,110);
      var dGoal=Math.hypot(sim.x-t.x,sim.y-t.y);
      var dFrom=Math.hypot(sim.x-f.cx,sim.y-f.cy);
      var score=-dGoal;
      if(sim.landed)score+=140;
      if(sim.plat)score+=55;
      if(t.y<f.cy-20&&sim.y<f.cy-10)score+=45;
      if(dFrom<30)score-=120;
      if(t.flee){var n=nearestOther(f);if(n.flea)score+=Math.hypot(sim.x-n.flea.cx,sim.y-n.flea.cy)*0.4;}
      if(score>bestScore){bestScore=score;best={vx:vx,vy:vy};}
    }
  }
  if(!best){var sol=solveLaunch(f.cx,f.cy,t.x,t.y);var sp=Math.hypot(sol.vx,sol.vy);if(sp>AI_LEAP_CAP){sol.vx=sol.vx/sp*AI_LEAP_CAP;sol.vy=sol.vy/sp*AI_LEAP_CAP;}best=sol;}
  best.vx+=(Math.random()-.5)*0.6;best.vy+=-0.6;
  f.launch(best.vx,best.vy);f.face=best.vx>0?1:-1;
  if(Math.random()<0.06)maybeSay(f,EVENT_LINES.fling[Math.random()*EVENT_LINES.fling.length|0],1300);
}
Flea.prototype.aiUpdate=function(dt){
  if(this.hidden)return;
  if(STATE!=='play'||this.isP||!this.stuck)return;
  if(this.frozen&&Date.now()<this.frozen)return;
  if(this.action){this.ait--;return;} /* busy performing an action */
  if(gameMode==='zen'&&Math.random()<0.004){this.action=pick(ACTION_KEYS);this.actionT=0;this.actionUntil=Date.now()+2200+Math.random()*2600;return;}
  var zen=gameMode==='zen',t=aiTarget(this);
  var horiz=(this.angle===0||this.angle===Math.PI);
  this.crawlDir=horiz?(t.x>this.cx?1:-1):(t.y>this.cy?1:-1);
  if(zen||(gameMode==='tag'&&!tagSeeded)){
    var _now=Date.now();
    if(player&&this.followUntil>_now){this.ait--;if(this.ait<=0){this.ait=45+Math.random()*45|0;aiLeap(this,{x:player.cx+(Math.random()-.5)*50,y:player.cy-18});}return;}
    if(player&&this.fleeUntil>_now){this.ait--;if(this.ait<=0){this.ait=35+Math.random()*35|0;var _away=this.cx<player.cx?-1:1;aiLeap(this,{x:this.cx+_away*(150+Math.random()*80),y:this.cy-30});}return;}
    if(Math.random()<0.02)this.crawl((Math.random()>.5?1:-1)*0.5);
    this.ait--;if(this.ait>0)return;
    this.ait=120+Math.random()*220|0;
    if(Math.random()<0.2){var rp=platforms[3+(Math.random()*Math.max(1,platforms.length-3)|0)]||platforms[0];var tp=rp.topPoint();aiLeap(this,{x:tp.x,y:tp.y-12});}
    return;
  }
  /* stuck detection via progress */
  var moved=Math.hypot(this.x-this.lastStuckPos.x,this.y-this.lastStuckPos.y);
  if(moved>20){this.lastStuckPos={x:this.x,y:this.y,t:Date.now()};this._unstuckTries=0;}
  var idleMs=Date.now()-this.lastStuckPos.t;
  var nearLeft=this.x<48,nearRight=this.x+this.w>WORLD_W-48,nearFloor=this.y+this.h>WORLD_H-130;
  /* unstuck: pinned in corner/wall */
  if((nearLeft||nearRight)&&(nearFloor||idleMs>550)){
    var inward=nearLeft?1:(nearRight?-1:(this.cx<WORLD_W/2?1:-1));
    this.launch(inward*(9+Math.random()*3),-(13+Math.random()*3));
    this.lastStuckPos={x:this.x,y:this.y,t:Date.now()};this.crawlT=0;this.ait=22;return;
  }
  /* unstuck: no progress -> escalate */
  if(idleMs>1000){
    this._unstuckTries++;
    if(this._unstuckTries%3===2){this.crawlDir*=-1;}
    var alt=t;
    if(this._unstuckTries>=3){var rp2=platforms[3+(Math.random()*Math.max(1,platforms.length-3)|0)]||platforms[0];var tp2=rp2.topPoint();alt={x:tp2.x,y:tp2.y-12};}
    aiLeap(this,alt);this.lastStuckPos={x:this.x,y:this.y,t:Date.now()};this.crawlT=0;this.ait=22;return;
  }
  var diff=horiz?(t.x-this.cx):(t.y-this.cy);
  if(Math.abs(diff)>20)this.crawl(this.crawlDir*((t.flee||t.chase)?1.0:0.7));
  this.crawlT+=dt;
  this.ait--;if(this.ait>0)return;
  this.ait=(t.flee||t.chase)?(22+Math.random()*16|0):(32+Math.random()*28|0);
  var aligned=Math.abs(t.x-this.cx)<110;
  var chance=t.flee?0.95:(t.chase?0.9:(aligned?0.88:(this.crawlT>800?0.72:0.4)));
  if(Math.random()<chance){aiLeap(this,t);this.crawlT=0;}
};

/* ===== FLEA RENDERING (glossy 3D look) ===== */
function parseRGB(c){
  if(!c)return [128,128,128];
  if(c[0]==='#'){var h=c.slice(1);if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];var n=parseInt(h,16)||0;return [(n>>16)&255,(n>>8)&255,n&255];}
  var m=c.match(/hsl\(\s*([\d.]+)[, ]+([\d.]+)%[, ]+([\d.]+)%/);
  if(m){return hslToRgb(+m[1],+m[2]/100,+m[3]/100);}
  var r=c.match(/rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/);
  if(r){return [+r[1],+r[2],+r[3]];}
  return [128,128,128];
}
function hslToRgb(h,s,l){h=(h%360)/360;var a=s*Math.min(l,1-l);function f(n){var k=(n+h*12)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))));}return [f(0),f(8),f(4)];}
function mix(c,t,b){var a=parseRGB(c);return 'rgb('+Math.round(a[0]+(b[0]-a[0])*t)+','+Math.round(a[1]+(b[1]-a[1])*t)+','+Math.round(a[2]+(b[2]-a[2])*t)+')';}
function lighten(c,t){return mix(c,t,[255,255,255]);}
function darken(c,t){return mix(c,t,[10,8,22]);}
function rgbaOf(c,a){var p=parseRGB(c);return 'rgba('+p[0]+','+p[1]+','+p[2]+','+a+')';}
function legColor(f,i){
  if(f.legs==='accent')return f.secondary||f.col;
  if(f.legs==='pink')return '#ff3db5';if(f.legs==='yellow')return '#ffd23d';
  if(f.legs==='pastel')return '#c6b3ff';if(f.legs==='rainbow')return 'hsl('+((i*60+f.la*30)%360)+',100%,65%)';
  if(f.legs==='shadow')return '#1a1a2a';if(f.legs==='neon')return '#2de2ff';if(f.legs==='chrome')return '#c8d5e0';
  if(f.legs==='aqua')return '#39ffd0';if(f.legs==='magma')return '#ff5a2a';if(f.legs==='mint')return '#8effb0';
  if(f.legs==='gold')return '#ffcf4d';if(f.legs==='candy')return '#ff8ad1';if(f.legs==='ink')return '#3a2a5a';
  return f.col;
}
function auraGlow(f){if(f.infected)return '#39ff7a';if(f.aura==='none')return f.col;if(f.aura==='rainbow')return 'hsl('+((f.la*40)%360)+',100%,62%)';if(f.aura==='fire')return '#ff7a1a';if(f.aura==='ice')return '#9be6ff';return AURA[f.aura]||f.col;}
function star(cx2,cy2,R,r,n){ctx.beginPath();for(var i=0;i<n*2;i++){var ang=Math.PI/n*i-Math.PI/2,rad=i%2?r:R;ctx.lineTo(cx2+Math.cos(ang)*rad,cy2+Math.sin(ang)*rad);}ctx.closePath();}
function tipHeart(x,y){var s=3;ctx.beginPath();ctx.moveTo(x,y+s*.8);ctx.bezierCurveTo(x,y,x-s,y-s*.5,x-s,y-s*1.2);ctx.bezierCurveTo(x-s,y-s*1.9,x,y-s*1.6,x,y-s*.7);ctx.bezierCurveTo(x,y-s*1.6,x+s,y-s*1.9,x+s,y-s*1.2);ctx.bezierCurveTo(x+s,y-s*.5,x,y,x,y+s*.8);ctx.fill();}

Flea.prototype.draw=function(cx,cy){
  if(this.hidden)return;
  var rx=this.cx-cx,ry=this.cy-cy;
  if(rx<-90||rx>W+90||ry<-90||ry>H+90)return;
  /* soft contact shadow on ground when resting on a top surface */
  if(this.stuck&&this.onG){ctx.save();ctx.globalAlpha=.32;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(rx,this.y+this.h-cy+3,this.w*0.5,4.5*this.sf,0,0,7);ctx.fill();ctx.restore();}
  ctx.save();ctx.translate(rx,ry);
  if(this.stuck)ctx.rotate(this.angle);
  if(this.action){
    var aph=this.actionT*0.001;
    if(this.action==='spin'){ctx.rotate(this.actionT*0.012);}
    else if(this.action==='dance'){ctx.rotate(Math.sin(aph*8)*0.4);ctx.translate(Math.sin(aph*8)*3,-Math.abs(Math.sin(aph*4))*4);}
    else if(this.action==='jump'){ctx.translate(0,-Math.abs(Math.sin(aph*5.5))*18);}
    else if(this.action==='lie'){ctx.rotate((this.face<0?1:-1)*(Math.PI*0.5)*Math.min(1,aph*2.4));}
  }
  if(this.face<0)ctx.scale(-1,1);
  ctx.scale((2-this.sq)*this.sf,this.sq*this.sf);
  this.drawAura();this.drawCape();this.drawWings();this.drawLegs();this.drawBody();this.drawHair();this.drawAccessory();this.drawEyes();this.drawBrows();this.drawGlasses();this.drawMouth();this.drawAntenna();this.drawHat();
  ctx.restore();
  ctx.fillStyle=this.isP?'#7af0ff':(this.infected?'#9bffc4':'rgba(255,255,255,.9)');
  ctx.font='bold 11px Chakra Petch';ctx.textAlign='center';ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=4;
  ctx.fillText(this.name,rx,ry-this.h/2-11);ctx.shadowBlur=0;
  if(this.bubble)this.drawBubble(rx,ry);
  if(this.emoteT>0&&this.emoteEmoji)this.drawEmoteBubble(rx,ry);
  if(this.action){var _ae=ACTION_EMOJI[this.action];if(_ae){ctx.save();ctx.globalAlpha=.95;ctx.font='16px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=5;ctx.fillText(_ae,rx,ry-this.h/2-26);ctx.restore();}}
};
Flea.prototype.drawAura=function(){
  var glow=auraGlow(this),intens=this.infected?1.0:(this.hasOrb?1.0:(this.aura!=='none'?0.85:0.45));
  var r=22;var g=ctx.createRadialGradient(0,0,2,0,0,r);
  g.addColorStop(0,rgbaOf(glow,0.5*intens));g.addColorStop(0.5,rgbaOf(glow,0.18*intens));g.addColorStop(1,rgbaOf(glow,0));
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,-1,r,0,7);ctx.fill();
};
Flea.prototype.drawBody=function(){
  var sh=SHAPES[this.shape]||SHAPES.round,rx=sh.rx,ry=sh.ry;
  var base=this.infected?mix(this.col,0.55,[40,210,90]):this.col;
  /* main 3D body: radial gradient lit from top-left */
  var g=ctx.createRadialGradient(-rx*0.42,-ry*0.55,rx*0.15,0,ry*0.2,rx*1.5);
  g.addColorStop(0,lighten(base,0.55));g.addColorStop(0.32,lighten(base,0.18));g.addColorStop(0.7,base);g.addColorStop(1,darken(base,0.42));
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,-1,rx,ry,0,0,7);ctx.fill();
  /* pattern */
  if(this.pattern!=='none'){
    ctx.save();ctx.beginPath();ctx.ellipse(0,-1,rx,ry,0,0,7);ctx.clip();
    if(this.pattern==='spots'){ctx.fillStyle=hexA(this.secondary,.5);var sp=[[-6,-3],[5,1],[-2,4],[7,-4],[0,-5]];for(var i=0;i<sp.length;i++){ctx.beginPath();ctx.arc(sp[i][0],sp[i][1],2.4,0,7);ctx.fill();}}
    else if(this.pattern==='stripes'){ctx.fillStyle=hexA(this.secondary,.42);for(var x=-rx;x<rx;x+=5){ctx.fillRect(x,-ry,2.2,ry*2);}}
    else if(this.pattern==='glitter'){for(var i=0;i<7;i++){ctx.globalAlpha=.4+Math.random()*.5;ctx.fillStyle=i%2?'#fff':'#ffe9a8';ctx.beginPath();ctx.arc((Math.random()-.5)*rx*1.6,(Math.random()-.5)*ry*1.6,.9+Math.random(),0,7);ctx.fill();}ctx.globalAlpha=1;}
    else if(this.pattern==='scales'){ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=1;for(var y=-ry;y<ry;y+=4)for(var x=-rx;x<rx;x+=4){ctx.beginPath();ctx.arc(x,y,2.2,Math.PI,0);ctx.stroke();}}
    else if(this.pattern==='galaxy'){var g2=ctx.createRadialGradient(0,0,2,0,0,rx);g2.addColorStop(0,'rgba(255,255,255,.55)');g2.addColorStop(.4,'rgba(155,107,255,.35)');g2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g2;ctx.fillRect(-rx,-ry,rx*2,ry*2);for(var i=0;i<12;i++){ctx.fillStyle='#fff';ctx.globalAlpha=.4+Math.random()*.6;ctx.beginPath();ctx.arc((Math.random()-.5)*rx*1.5,(Math.random()-.5)*ry*1.5,.6+Math.random(),0,7);ctx.fill();}ctx.globalAlpha=1;}
    else if(this.pattern==='checker'){var s=4;for(var y=-ry;y<ry;y+=s)for(var x=-rx;x<rx;x+=s)if(((x+y)/s)&1){ctx.fillStyle=hexA(this.secondary,.4);ctx.fillRect(x,y,s,s);}}
    else if(this.pattern==='gradient'){var g3=ctx.createLinearGradient(0,-ry,0,ry);g3.addColorStop(0,'rgba(255,255,255,.3)');g3.addColorStop(1,this.secondary||'rgba(0,0,0,.3)');ctx.fillStyle=g3;ctx.fillRect(-rx,-ry,rx*2,ry*2);}
    else if(this.pattern==='hearts'){ctx.fillStyle=hexA(this.secondary,.6);for(var hy2=-ry+2;hy2<ry;hy2+=6)for(var hx2=-rx+2;hx2<rx;hx2+=7){tipHeart(hx2,hy2);}}
    else if(this.pattern==='rings'){ctx.strokeStyle=hexA(this.secondary,.55);ctx.lineWidth=1.4;for(var rr=3;rr<rx+ry;rr+=4){ctx.beginPath();ctx.arc(0,-1,rr,0,7);ctx.stroke();}}
    else if(this.pattern==='polka'){ctx.fillStyle=hexA(this.secondary,.55);for(var py=-ry;py<ry;py+=5)for(var px=-rx;px<rx;px+=5){ctx.beginPath();ctx.arc(px+((py/5)&1?2.5:0),py,1.5,0,7);ctx.fill();}}
    else if(this.pattern==='camo'){var cc=[hexA(this.secondary,.5),'rgba(0,0,0,.2)','rgba(255,255,255,.15)'];for(var i=0;i<8;i++){ctx.fillStyle=cc[i%3];ctx.beginPath();ctx.ellipse((Math.random()-.5)*rx*1.4,(Math.random()-.5)*ry*1.4,2+Math.random()*3,2+Math.random()*2,Math.random()*6,0,7);ctx.fill();}}
    else if(this.pattern==='flames'){var fg=ctx.createLinearGradient(0,ry,0,-ry);fg.addColorStop(0,hexA('#ff7a1a',.7));fg.addColorStop(.5,hexA('#ffd23d',.5));fg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=fg;for(var x=-rx;x<rx;x+=4){ctx.beginPath();ctx.moveTo(x,ry);ctx.quadraticCurveTo(x+2,0,x,-ry*.3);ctx.quadraticCurveTo(x-2,0,x,ry);ctx.fill();}}
    else if(this.pattern==='circuit'){ctx.strokeStyle=hexA(this.secondary,.6);ctx.lineWidth=1;for(var y=-ry+2;y<ry;y+=5){ctx.beginPath();ctx.moveTo(-rx,y);ctx.lineTo(rx,y);ctx.stroke();}for(var x=-rx+2;x<rx;x+=6){ctx.beginPath();ctx.arc(x,(x%2?-2:2),1.2,0,7);ctx.fillStyle=hexA(this.secondary,.7);ctx.fill();}}
    else if(this.pattern==='zebra'){ctx.fillStyle='rgba(15,12,20,.55)';for(var i=0;i<6;i++){ctx.save();ctx.translate((i-3)*4,0);ctx.rotate(.3);ctx.fillRect(-1.4,-ry,2.6,ry*2);ctx.restore();}}
    ctx.restore();
  }
  /* rim light (lower-right) */
  ctx.save();ctx.beginPath();ctx.ellipse(0,-1,rx,ry,0,0,7);ctx.clip();
  ctx.strokeStyle=rgbaOf(lighten(base,0.5),0.5);ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(1.5,0.5,rx-1,ry-1,0,0.15*Math.PI,0.85*Math.PI);ctx.stroke();
  ctx.restore();
  /* glossy specular highlight (top-left) */
  var hg=ctx.createRadialGradient(-rx*0.42,-ry*0.52,0.4,-rx*0.42,-ry*0.52,rx*0.62);
  hg.addColorStop(0,'rgba(255,255,255,.92)');hg.addColorStop(0.5,'rgba(255,255,255,.28)');hg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=hg;ctx.beginPath();ctx.ellipse(-rx*0.4,-ry*0.5,rx*0.5,ry*0.42,-0.5,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(rx*0.32,-ry*0.28,rx*0.12,ry*0.16,-0.4,0,7);ctx.fill();
  if(this.infected){
    ctx.fillStyle='rgba(20,120,60,.5)';[[-6,2],[5,-3],[2,5],[-3,-5]].forEach(function(p){ctx.beginPath();ctx.arc(p[0],p[1],2.2,0,7);ctx.fill();});
    ctx.strokeStyle='rgba(255,61,181,.85)';ctx.lineWidth=1.4;[[-7,-4,5],[6,3,4],[-2,6,4]].forEach(function(p){ctx.save();ctx.translate(p[0],p[1]);ctx.beginPath();ctx.moveTo(-p[2],-p[2]);ctx.lineTo(p[2],p[2]);ctx.moveTo(p[2],-p[2]);ctx.lineTo(-p[2],p[2]);ctx.stroke();ctx.restore();});
  }
  if(this.hasOrb&&!this.infected){ctx.save();ctx.strokeStyle=gameMode==='survival'?'#ff6a3d':'#ffd23d';ctx.lineWidth=2.6;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,-1,rx+7,0,7);ctx.stroke();ctx.restore();}
  if(this.cheek==='on'){ctx.fillStyle='rgba(255,120,170,.55)';ctx.beginPath();ctx.ellipse(-7,2,2.6,1.8,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(9,2,2.6,1.8,0,0,7);ctx.fill();}
  else if(this.cheek==='freckles'){ctx.fillStyle='rgba(70,40,20,.7)';[[-7,1],[-5,3],[-9,3],[9,1],[7,3],[11,3]].forEach(function(p){ctx.beginPath();ctx.arc(p[0],p[1],.7,0,7);ctx.fill();});}
  else if(this.cheek==='swirls'){ctx.strokeStyle='rgba(255,120,170,.6)';ctx.lineWidth=1.2;[-1,1].forEach(function(s){ctx.beginPath();ctx.arc(s*8,2,2,0,Math.PI*1.6);ctx.stroke();});}
};
Flea.prototype.drawHair=function(){
  var Hs=this.hair;if(!Hs||Hs==='none')return;
  var sh=SHAPES[this.shape]||SHAPES.round,rx=sh.rx,ry=sh.ry;
  var hc=this.hairColor||'#2a1a2a',hi=lighten(hc,.42),lo=darken(hc,.34),top=-ry-1;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  function puff(x,y,r){var g=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.15,x,y,r);g.addColorStop(0,hi);g.addColorStop(.6,hc);g.addColorStop(1,lo);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();}
  function loc(x,y,len,w){var side=x<0?-1:1;ctx.strokeStyle=hc;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+side*1.5,y+len*.5,x+side*2,y+len);ctx.stroke();ctx.fillStyle=lo;ctx.beginPath();ctx.arc(x+side*2,y+len,w*.55,0,7);ctx.fill();}
  function cap(){ctx.fillStyle=hc;ctx.beginPath();ctx.ellipse(0,top+2,rx*0.98,ry*0.55,0,Math.PI,0);ctx.fill();}
  if(Hs==='buzz'){cap();ctx.fillStyle=hexA(hi,.55);for(var i=0;i<22;i++){ctx.beginPath();ctx.arc((Math.random()-.5)*rx*1.6,top+2-Math.random()*4,.5,0,7);ctx.fill();}ctx.restore();return;}
  if(Hs==='fringe'){cap();ctx.fillStyle=hc;for(var b=-rx;b<rx;b+=3.4){ctx.beginPath();ctx.moveTo(b,top+3);ctx.quadraticCurveTo(b+1,top+7,b+1.6,top+9);ctx.lineTo(b+3.4,top+6);ctx.lineTo(b+3.4,top+3);ctx.closePath();ctx.fill();}ctx.restore();return;}
  if(Hs==='afro'){puff(0,top-3,rx*1.18);puff(-rx*0.72,top-1,rx*0.62);puff(rx*0.72,top-1,rx*0.62);puff(-rx*0.5,top-rx*0.72,rx*0.56);puff(rx*0.5,top-rx*0.72,rx*0.56);puff(0,top-rx*0.95,rx*0.6);ctx.restore();return;}
  if(Hs==='curls'){for(var i=0;i<9;i++){var a=Math.PI+i/8*Math.PI;puff(Math.cos(a)*rx*0.98,top+2+Math.sin(a)*ry*0.5,rx*0.33);}ctx.restore();return;}
  if(Hs==='afropuffs'){cap();puff(-rx*0.98,top-rx*0.4,rx*0.64);puff(rx*0.98,top-rx*0.4,rx*0.64);ctx.restore();return;}
  if(Hs==='hightop'){ctx.fillStyle=hc;ctx.beginPath();ctx.roundRect(-rx*0.82,top-rx*1.15,rx*1.64,rx*1.25,4);ctx.fill();ctx.fillStyle=hi;ctx.fillRect(-rx*0.82,top-rx*1.15,rx*1.64,2.5);ctx.restore();return;}
  if(Hs==='bun'){cap();puff(0,top-rx*0.55,rx*0.5);ctx.restore();return;}
  if(Hs==='bantu'){cap();[[-rx*0.6,top-1],[0,top-3],[rx*0.6,top-1],[-rx*0.3,top-rx*0.5],[rx*0.3,top-rx*0.5]].forEach(function(p){puff(p[0],p[1],rx*0.27);});ctx.restore();return;}
  if(Hs==='cornrows'){cap();ctx.strokeStyle=lo;ctx.lineWidth=1.1;for(var b=-rx*0.8;b<=rx*0.8;b+=3){ctx.beginPath();ctx.moveTo(b,top+3);ctx.quadraticCurveTo(b*0.6,top-ry*0.45,b*0.5,top-ry*0.55);ctx.stroke();}ctx.restore();return;}
  if(Hs==='dreads'||Hs==='dreadsLong'){var len=Hs==='dreadsLong'?20:12;cap();for(var i=0;i<5;i++){var lx=(-1+i/4*2)*rx*0.85;loc(lx,top+1,len+Math.random()*4,2.6);}loc(-rx*0.98,top+3,len*0.7,2.6);loc(rx*0.98,top+3,len*0.7,2.6);ctx.restore();return;}
  if(Hs==='boxbraids'){cap();[-rx*0.95,-rx*0.45,rx*0.45,rx*0.95].forEach(function(lx){var side=lx<0?-1:1;ctx.strokeStyle=hc;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(lx,top+2);ctx.lineTo(lx+side*2,top+16);ctx.stroke();for(var s=0;s<3;s++){ctx.fillStyle=s%2?hi:lo;ctx.beginPath();ctx.arc(lx+side*(1+s*0.6),top+5+s*4,1.6,0,7);ctx.fill();}});ctx.restore();return;}
  if(Hs==='twists'){cap();[-rx*0.9,-rx*0.35,rx*0.35,rx*0.9].forEach(function(lx){var side=lx<0?-1:1;ctx.strokeStyle=hc;ctx.lineWidth=2.6;ctx.beginPath();for(var t=0;t<=12;t++){var yy=top+2+t,xx=lx+side*Math.sin(t*0.9)*1.6;if(t===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.stroke();});ctx.restore();return;}
  if(Hs==='ponytail'){cap();ctx.strokeStyle=hc;ctx.lineWidth=4.2;ctx.beginPath();ctx.moveTo(rx*0.8,top);ctx.quadraticCurveTo(rx*1.7,top+4,rx*1.4,top+16);ctx.stroke();ctx.restore();return;}
  if(Hs==='pigtails'){cap();[-1,1].forEach(function(s){ctx.strokeStyle=hc;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(s*rx*0.85,top+1);ctx.quadraticCurveTo(s*rx*1.6,top+6,s*rx*1.3,top+16);ctx.stroke();puff(s*rx*0.9,top+1,rx*0.28);});ctx.restore();return;}
  if(Hs==='bob'){ctx.fillStyle=hc;ctx.beginPath();ctx.moveTo(-rx*1.05,top+ry*0.9);ctx.quadraticCurveTo(-rx*1.15,top-ry*0.6,0,top-ry*0.7);ctx.quadraticCurveTo(rx*1.15,top-ry*0.6,rx*1.05,top+ry*0.9);ctx.lineTo(rx*0.5,top+ry*0.4);ctx.lineTo(rx*0.5,top+2);ctx.lineTo(-rx*0.5,top+2);ctx.lineTo(-rx*0.5,top+ry*0.4);ctx.closePath();ctx.fill();ctx.restore();return;}
  if(Hs==='long'||Hs==='wavy'){cap();[-1,1].forEach(function(s){ctx.fillStyle=hc;ctx.beginPath();ctx.moveTo(s*rx*1.0,top+2);if(Hs==='wavy'){ctx.quadraticCurveTo(s*rx*1.4,top+8,s*rx*1.0,top+14);ctx.quadraticCurveTo(s*rx*0.7,top+20,s*rx*1.0,top+24);}else{ctx.quadraticCurveTo(s*rx*1.25,top+14,s*rx*0.95,top+24);}ctx.lineTo(s*rx*0.55,top+24);ctx.quadraticCurveTo(s*rx*0.5,top+10,s*rx*0.5,top+2);ctx.closePath();ctx.fill();});ctx.restore();return;}
  if(Hs==='mohawk'){ctx.fillStyle=hc;ctx.beginPath();ctx.moveTo(-2.5,top+3);for(var i=0;i<=6;i++){var t=i/6;ctx.lineTo((-1+t*2)*2.5,top-6-Math.sin(t*Math.PI)*10);}ctx.lineTo(2.5,top+3);ctx.closePath();ctx.fill();ctx.strokeStyle=hi;ctx.lineWidth=1;for(var i=0;i<5;i++){ctx.beginPath();ctx.moveTo((-1+i/4*2)*2,top-2);ctx.lineTo((-1+i/4*2)*2,top-11);ctx.stroke();}ctx.restore();return;}
  if(Hs==='spiky'){ctx.fillStyle=hc;for(var i=0;i<7;i++){var sx=(-1+i/6*2)*rx*0.9;ctx.beginPath();ctx.moveTo(sx-2.5,top+3);ctx.lineTo(sx,top-7-Math.random()*3);ctx.lineTo(sx+2.5,top+3);ctx.closePath();ctx.fill();}ctx.restore();return;}
  if(Hs==='pompadour'){ctx.fillStyle=hc;ctx.beginPath();ctx.moveTo(-rx*0.8,top+3);ctx.quadraticCurveTo(-rx*0.6,top-rx*1.1,rx*0.2,top-rx*0.9);ctx.quadraticCurveTo(rx*1.0,top-rx*0.7,rx*0.8,top+3);ctx.quadraticCurveTo(0,top-1,-rx*0.8,top+3);ctx.closePath();ctx.fill();ctx.strokeStyle=hi;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-rx*0.4,top-2);ctx.quadraticCurveTo(0,top-rx*0.9,rx*0.3,top-rx*0.5);ctx.stroke();ctx.restore();return;}
  ctx.restore();
};
Flea.prototype.drawEyes=function(){
  var ec=this.eyeColor;
  if(this.infected){ctx.strokeStyle='#0e3a1c';ctx.lineWidth=1.8;ctx.lineCap='round';[[3,-3],[9,-3]].forEach(function(c){ctx.beginPath();ctx.moveTo(c[0]-2,c[1]-2);ctx.lineTo(c[0]+2,c[1]+2);ctx.moveTo(c[0]+2,c[1]-2);ctx.lineTo(c[0]-2,c[1]+2);ctx.stroke();});return;}
  var self=this;
  function glossyEye(ex,ey,R,pupil){
    var sg=ctx.createRadialGradient(ex-R*0.3,ey-R*0.4,R*0.1,ex,ey,R);
    sg.addColorStop(0,'#ffffff');sg.addColorStop(0.7,'#eef4ff');sg.addColorStop(1,'#cbd6ea');
    ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(ex,ey,R,R*1.06,0,0,7);ctx.fill();
    var ep=Math.sin(self.ea*.6)*1.0;
    var pg=ctx.createRadialGradient(ex+ep-pupil*0.3,ey-pupil*0.3,pupil*0.1,ex+ep,ey,pupil);
    pg.addColorStop(0,lighten(ec,0.35));pg.addColorStop(1,darken(ec,0.2));
    ctx.fillStyle=pg;ctx.beginPath();ctx.arc(ex+ep,ey,pupil,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.arc(ex+ep-pupil*0.35,ey-pupil*0.45,pupil*0.42,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(ex+ep+pupil*0.3,ey+pupil*0.35,pupil*0.2,0,7);ctx.fill();
  }
  if(this.eyes==='cool'){ctx.fillStyle='#0a0a14';ctx.beginPath();ctx.roundRect(0,-7,13,7,2.5);ctx.fill();var lg=ctx.createLinearGradient(0,-7,13,0);lg.addColorStop(0,'rgba(120,230,255,.6)');lg.addColorStop(1,'rgba(120,230,255,.05)');ctx.fillStyle=lg;ctx.fillRect(1,-6,11,5);return;}
  if(this.eyes==='sleepy'){ctx.strokeStyle='#2a2a3a';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.arc(4,-3,3.4,0,Math.PI,true);ctx.stroke();ctx.beginPath();ctx.arc(10,-3,3.4,0,Math.PI,true);ctx.stroke();return;}
  if(this.eyes==='wink'){glossyEye(3.5,-3,3.6,2.1);ctx.strokeStyle='#2a2a3a';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.beginPath();ctx.arc(10,-3,3.4,0.1*Math.PI,0.9*Math.PI,false);ctx.stroke();return;}
  if(this.eyes==='angry'){glossyEye(4,-2,3.6,2);glossyEye(10,-2,3.6,2);ctx.strokeStyle='#2a2a3a';ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(7,-4);ctx.moveTo(14,-7);ctx.lineTo(7,-4);ctx.stroke();return;}
  if(this.eyes==='heart'){ctx.fillStyle=ec==='#101018'?'#ff3db5':ec;[[3.5,-3],[10,-3]].forEach(function(c){var hx=c[0],hy=c[1];ctx.beginPath();ctx.moveTo(hx,hy+2.4);ctx.bezierCurveTo(hx,hy+.6,hx-2.6,hy-.4,hx-2.6,hy-1.6);ctx.bezierCurveTo(hx-2.6,hy-3,hx,hy-2.6,hx,hy-1);ctx.bezierCurveTo(hx,hy-2.6,hx+2.6,hy-3,hx+2.6,hy-1.6);ctx.bezierCurveTo(hx+2.6,hy-.4,hx,hy+.6,hx,hy+2.4);ctx.fill();});return;}
  if(this.eyes==='star'){ctx.fillStyle=ec==='#101018'?'#ffd23d':ec;ctx.shadowColor='#ffd23d';ctx.shadowBlur=5;star(3.5,-3,3.4,1.5,5);ctx.fill();star(10,-3,3.4,1.5,5);ctx.fill();ctx.shadowBlur=0;return;}
  if(this.eyes==='swirl'){glossyEye(3.5,-3,3.8,1.8);ctx.strokeStyle='#101018';ctx.lineWidth=1.2;ctx.beginPath();for(var i=0;i<13;i++){var a=i*.5+this.la*.1,r=i*.25;ctx.lineTo(10+Math.cos(a)*r,-3+Math.sin(a)*r);}ctx.stroke();return;}
  if(this.eyes==='robo'){ctx.fillStyle='#0a0a14';ctx.beginPath();ctx.roundRect(0,-7,13,7,2);ctx.fill();ctx.fillStyle=ec==='#101018'?'#2de2ff':ec;ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=7;ctx.fillRect(2,-5,9,2);ctx.shadowBlur=0;return;}
  if(this.eyes==='ghost'){ctx.fillStyle='rgba(190,225,255,.9)';ctx.beginPath();ctx.ellipse(3.5,-3,3.6,3.8,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(10,-3,3.6,3.8,0,0,7);ctx.fill();return;}
  if(this.eyes==='dizzy'){ctx.strokeStyle='#2a2a3a';ctx.lineWidth=1.6;var laa=this.la;[3.5,10].forEach(function(ex){ctx.beginPath();for(var i=0;i<11;i++){var a=i*.6+laa*.15,r=i*.3;ctx.lineTo(ex+Math.cos(a)*r,-3+Math.sin(a)*r);}ctx.stroke();});return;}
  if(this.eyes==='kawaii'){ctx.strokeStyle='#101018';ctx.lineWidth=2.4;ctx.lineCap='round';[3.5,10].forEach(function(ex){ctx.beginPath();ctx.arc(ex,-2,3.2,1.15*Math.PI,1.85*Math.PI);ctx.stroke();});return;}
  /* default 'cute'/'normal' — big glossy 3D eyes (matches reference art) */
  glossyEye(1.5,-3,3.9,2.3);glossyEye(8,-3,3.9,2.3);
};
Flea.prototype.drawBrows=function(){if(!this.brows||this.brows==='none')return;ctx.save();ctx.strokeStyle='#2a1a2a';ctx.lineWidth=1.6;ctx.lineCap='round';
  if(this.brows==='raised'){ctx.beginPath();ctx.arc(5,-8,3,0.1*Math.PI,0.9*Math.PI);ctx.stroke();}
  else if(this.brows==='angry'){ctx.beginPath();ctx.moveTo(1,-8);ctx.lineTo(9,-6);ctx.stroke();}
  else if(this.brows==='worried'){ctx.beginPath();ctx.moveTo(1,-6);ctx.lineTo(9,-8);ctx.stroke();}
  else if(this.brows==='evil'){ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(4,-7);ctx.lineTo(8,-8);ctx.stroke();}
  else if(this.brows==='thick'){ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(1,-7);ctx.lineTo(9,-7);ctx.stroke();}
  ctx.restore();
};
Flea.prototype.drawGlasses=function(){if(!this.glasses||this.glasses==='none')return;ctx.save();
  if(this.glasses==='round'){ctx.strokeStyle='#1a1a26';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(5,-3,4.2,0,7);ctx.stroke();}
  else if(this.glasses==='shades'){ctx.fillStyle='#0a0a14';ctx.beginPath();ctx.roundRect(0,-6,13,5.5,2);ctx.fill();ctx.fillStyle='rgba(45,226,255,.45)';ctx.fillRect(1.5,-5.5,4.5,4);ctx.fillRect(7,-5.5,4.5,4);}
  else if(this.glasses==='stars'){ctx.fillStyle='#ffd23d';ctx.shadowColor='#ffd23d';ctx.shadowBlur=6;star(5,-3,3.5,1.6,5);ctx.fill();}
  else if(this.glasses==='monocle'){ctx.strokeStyle='#ffd23d';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(5,-3,4,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(5,1);ctx.lineTo(8,6);ctx.stroke();}
  else if(this.glasses==='vr'){ctx.fillStyle='#1a1a30';ctx.beginPath();ctx.roundRect(-2,-7,17,8,3);ctx.fill();ctx.fillStyle='#2de2ff';ctx.shadowColor='#2de2ff';ctx.shadowBlur=8;ctx.fillRect(0,-5,5,4);ctx.fillRect(8,-5,5,4);}
  else if(this.glasses==='heart'){ctx.fillStyle='#ff3db5';ctx.shadowColor='#ff3db5';ctx.shadowBlur=6;tipHeart(2,-3);tipHeart(8,-3);}
  else if(this.glasses==='eyepatch'){ctx.fillStyle='#10101a';ctx.beginPath();ctx.ellipse(5,-3,4,4.4,0,0,7);ctx.fill();ctx.strokeStyle='#10101a';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-3,-8);ctx.lineTo(13,-4);ctx.stroke();}
  ctx.restore();
};
Flea.prototype.drawMouth=function(){if(!this.mouth||this.mouth==='none')return;ctx.save();ctx.strokeStyle='#2a1620';ctx.lineWidth=1.4;ctx.lineCap='round';
  if(this.infected){ctx.fillStyle='#1a5a30';ctx.beginPath();ctx.ellipse(2.5,5,2.6,1.8,0,0,7);ctx.fill();ctx.fillStyle='#39ff7a';ctx.beginPath();ctx.ellipse(2.5,6.4,1.1,1.4,0,0,7);ctx.fill();ctx.restore();return;}
  if(this.mouth==='smile'){ctx.beginPath();ctx.arc(2.5,4.5,3,0.1*Math.PI,0.9*Math.PI);ctx.stroke();}
  else if(this.mouth==='open'){ctx.fillStyle='#2a1228';ctx.beginPath();ctx.ellipse(2.5,5,2.5,1.8,0,0,7);ctx.fill();}
  else if(this.mouth==='tongue'){ctx.beginPath();ctx.arc(2.5,4.5,3,0.1*Math.PI,0.9*Math.PI);ctx.stroke();ctx.fillStyle='#ff5577';ctx.beginPath();ctx.ellipse(2.5,6.2,1.3,1.6,0,0,7);ctx.fill();}
  else if(this.mouth==='fangs'){ctx.beginPath();ctx.moveTo(0.5,4);ctx.lineTo(5,4);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(1.5,4);ctx.lineTo(2.5,6.5);ctx.lineTo(2.8,4);ctx.fill();ctx.beginPath();ctx.moveTo(3.5,4);ctx.lineTo(4,6.5);ctx.lineTo(4.5,4);ctx.fill();}
  else if(this.mouth==='kiss'){ctx.fillStyle='#ff3db5';ctx.beginPath();ctx.ellipse(2.5,4.5,1.4,1.8,0,0,7);ctx.fill();}
  else if(this.mouth==='smirk'){ctx.beginPath();ctx.arc(3,4.5,3,0.1*Math.PI,0.5*Math.PI);ctx.stroke();}
  else if(this.mouth==='tiny'){ctx.beginPath();ctx.arc(2.5,4.5,1.2,0,Math.PI);ctx.stroke();}
  else if(this.mouth==='grin'){ctx.fillStyle='#2a1228';ctx.beginPath();ctx.arc(2.5,3.5,3.4,0.05*Math.PI,0.95*Math.PI);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-0.6,3.4,6.2,1.1);}
  else if(this.mouth==='frown'){ctx.beginPath();ctx.arc(2.5,7,3,1.1*Math.PI,1.9*Math.PI);ctx.stroke();}
  ctx.restore();
};
var LEG_SHAPES={
  default:{n:6,len:1.0,thick:1.0,spread:1.0,foot:'dot'},
  spider:{n:8,len:1.75,thick:0.7,spread:1.18,jointed:true,foot:'point'},
  stubby:{n:4,len:0.34,thick:1.15,spread:0.9,foot:'round'},
  noodle:{n:6,len:1.3,thick:0.95,spread:1.0,wavy:true,foot:'dot'},
  zigzag:{n:6,len:1.15,thick:0.95,spread:1.05,jointed:true,foot:'point'},
  paws:{n:4,len:0.72,thick:2.3,spread:0.9,foot:'paw'},
  tentacle:{n:6,len:1.25,thick:2.2,spread:1.0,taper:true,foot:'none'},
  bird:{n:2,len:1.5,thick:1.1,spread:0.5,foot:'claw'},
  spring:{n:4,len:1.15,thick:1.0,spread:0.95,spring:true,foot:'dot'},
  hover:{n:0,hover:true}
};
Flea.prototype._legPath=function(cfg,ax,ay0,ctrlx,ctrly,tipx,tipy,i,now){
  ctx.beginPath();ctx.moveTo(ax,ay0);
  if(cfg.jointed){var kx=(ax+tipx)/2+(ax<0?-2.4:2.4),ky=(ay0+tipy)/2-3.2;ctx.lineTo(kx,ky);ctx.lineTo(tipx,tipy);}
  else if(cfg.wavy){var S=5;for(var s=1;s<=S;s++){var tt=s/S;ctx.lineTo(ax+(tipx-ax)*tt+Math.sin(tt*6.28+now*4+i)*2.2*(1-tt*0.3),ay0+(tipy-ay0)*tt);}}
  else if(cfg.spring){var Sp=11;for(var s2=1;s2<=Sp;s2++){var t2=s2/Sp;ctx.lineTo(ax+(tipx-ax)*t2+Math.cos(t2*Math.PI*6)*2.5*(1-t2*0.2),ay0+(tipy-ay0)*t2);}}
  else{ctx.quadraticCurveTo(ctrlx,ctrly,tipx,tipy);}
};
Flea.prototype._legFoot=function(foot,style,col,ax,tipx,tipy){
  if(style==='boots'){ctx.fillStyle=darken(col,0.5);ctx.beginPath();ctx.ellipse(tipx+(ax<0?-0.7:0.7),tipy+0.4,2.7,1.7,0,0,7);ctx.fill();return;}
  if(style==='socks'){ctx.fillStyle=lighten(col,0.6);ctx.beginPath();ctx.arc(tipx,tipy-1.5,1.9,0,7);ctx.fill();ctx.fillStyle=lighten(col,0.28);ctx.beginPath();ctx.arc(tipx,tipy,1.7,0,7);ctx.fill();return;}
  if(foot==='none'||foot==='point')return;
  if(foot==='round'){ctx.fillStyle=lighten(col,0.16);ctx.beginPath();ctx.arc(tipx,tipy,1.7,0,7);ctx.fill();return;}
  if(foot==='paw'){ctx.fillStyle=lighten(col,0.12);ctx.beginPath();ctx.ellipse(tipx,tipy,3,2.1,0,0,7);ctx.fill();ctx.fillStyle=darken(col,0.22);[-1.2,0,1.2].forEach(function(o){ctx.beginPath();ctx.arc(tipx+o,tipy-1.4,0.7,0,7);ctx.fill();});return;}
  if(foot==='claw'){ctx.strokeStyle=darken(col,0.2);ctx.lineWidth=1.3;ctx.lineCap='round';[-1.7,0,1.7].forEach(function(o){ctx.beginPath();ctx.moveTo(tipx,tipy-1);ctx.lineTo(tipx+o,tipy+2.4);ctx.stroke();});return;}
  ctx.fillStyle=lighten(col,0.18);ctx.beginPath();ctx.arc(tipx,tipy,1.5,0,7);ctx.fill();
};
Flea.prototype.drawLegs=function(){
  var sh=SHAPES[this.shape]||SHAPES.round, ay=sh.ry-3, rx0=sh.rx, ay0=ay-2;
  var baseCol=this.infected?'#2aa85a':(this.legs==='matching'?darken(this.col,0.34):legColor(this,0));
  var stuck=this.stuck, walking=stuck&&Date.now()<this.walkT;
  var rising=!stuck&&this.vy<-0.5, falling=!stuck&&this.vy>0.6;
  var now=performance.now()/1000, style=this.legStyle||'default', shape=this.legShape||'default';
  var cfg=LEG_SHAPES[shape]||LEG_SHAPES.default;
  if(cfg.hover){
    var hc=this.legs==='rainbow'?legColor(this,0):baseCol, bobH=rising?-2:(falling?2.4:Math.sin(now*3)*0.8);
    for(var h=0;h<3;h++){var hx=(-1+h)*rx0*0.5, hy=ay+3+bobH+Math.sin(now*6+h)*0.6;
      var hg=ctx.createRadialGradient(hx,hy,0.5,hx,hy,6.5);hg.addColorStop(0,rgbaOf(lighten(hc,0.4),0.9));hg.addColorStop(1,rgbaOf(hc,0));
      ctx.fillStyle=hg;ctx.beginPath();ctx.arc(hx,hy,6.5,0,7);ctx.fill();
      ctx.fillStyle=rgbaOf(lighten(hc,0.65),0.95);ctx.beginPath();ctx.arc(hx,hy,1.8,0,7);ctx.fill();}
    return;
  }
  var n=cfg.n, spread=cfg.spread||1;
  for(var i=0;i<n;i++){
    var t=n>1?i/(n-1):0.5, ax=(-1+t*2)*(rx0*0.72*spread), len=(10+Math.sin(i*1.3)*2)*(cfg.len||1);
    var tipx,tipy,ctrlx,ctrly;
    if(walking){var ph=this.gaitPhase+i*1.05, lift=Math.max(0,Math.sin(ph))*3.4, step=Math.cos(ph)*3.6;
      tipx=ax*1.12+step; tipy=ay+len-lift; ctrlx=ax+step*0.5; ctrly=ay+len*0.5-lift*0.5;
    }else if(rising){tipx=ax*0.7; tipy=ay+len*0.48; ctrlx=ax*0.55; ctrly=ay+len*0.1;
    }else if(falling){tipx=ax*1.42; tipy=ay+len*1.18; ctrlx=ax*1.16; ctrly=ay+len*0.7;
    }else{var breathe=Math.sin(now*1.6+i*0.7)*0.7; tipx=ax*1.12+breathe; tipy=ay+len; ctrlx=ax+breathe*0.5; ctrly=ay+len*0.55;}
    var col=this.legs==='rainbow'?legColor(this,i):baseCol;
    var lw=(3.1-Math.abs(t-0.5)*1.3)*(cfg.thick||1);
    if(style==='fuzzy'&&!cfg.taper){ctx.save();ctx.strokeStyle=rgbaOf(lighten(col,0.15),0.5);ctx.lineCap='round';ctx.lineWidth=lw+2.6;this._legPath(cfg,ax,ay0,ctrlx,ctrly,tipx,tipy,i,now);ctx.stroke();ctx.restore();}
    var grad=ctx.createLinearGradient(ax,ay0,tipx,tipy);grad.addColorStop(0,lighten(col,0.1));grad.addColorStop(1,darken(col,0.32));
    if(cfg.taper){var w0=lw*1.5;ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(ax-w0/2,ay0);ctx.quadraticCurveTo(ctrlx-1,ctrly,tipx,tipy);ctx.quadraticCurveTo(ctrlx+1,ctrly,ax+w0/2,ay0);ctx.closePath();ctx.fill();}
    else{ctx.strokeStyle=grad;ctx.lineCap='round';ctx.lineWidth=lw;this._legPath(cfg,ax,ay0,ctrlx,ctrly,tipx,tipy,i,now);ctx.stroke();}
    if(style==='striped'&&!cfg.taper){ctx.save();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1;for(var b=0.32;b<0.9;b+=0.22){var bx=ax+(tipx-ax)*b,by=ay0+(tipy-ay0)*b;ctx.beginPath();ctx.moveTo(bx-1.4,by);ctx.lineTo(bx+1.4,by);ctx.stroke();}ctx.restore();}
    this._legFoot(cfg.foot,style,col,ax,tipx,tipy);
  }
};
Flea.prototype.drawAntenna=function(){
  if(this.ant==='none')return;
  ctx.lineWidth=2.4;ctx.lineCap='round';var aL=Math.sin(this.la*1.2)*5;
  function whiteGloss(){var g=ctx.createLinearGradient(0,-26,0,-11);g.addColorStop(0,'#ffffff');g.addColorStop(1,'rgba(255,255,255,.55)');return g;}
  if(this.ant==='long'){ctx.strokeStyle=whiteGloss();ctx.beginPath();ctx.moveTo(-2,-11);ctx.lineTo(-12,-26+aL);ctx.stroke();ctx.beginPath();ctx.moveTo(2,-11);ctx.lineTo(12,-26-aL);ctx.stroke();return;}
  if(this.ant==='bolt'){ctx.strokeStyle='#ffd23d';ctx.shadowColor='#ffd23d';ctx.shadowBlur=5;ctx.beginPath();ctx.moveTo(-2,-11);ctx.lineTo(-7,-17);ctx.lineTo(-3,-19);ctx.lineTo(-8,-26+aL);ctx.stroke();ctx.beginPath();ctx.moveTo(2,-11);ctx.lineTo(7,-17);ctx.lineTo(3,-19);ctx.lineTo(8,-26-aL);ctx.stroke();ctx.shadowBlur=0;return;}
  if(this.ant==='heart'){ctx.strokeStyle=whiteGloss();ctx.beginPath();ctx.moveTo(-2,-11);ctx.quadraticCurveTo(-9,-19+aL,-6,-23);ctx.stroke();ctx.beginPath();ctx.moveTo(2,-11);ctx.quadraticCurveTo(9,-19-aL,6,-23);ctx.stroke();ctx.fillStyle=this.secondary;tipHeart(-6,-24);tipHeart(6,-24);return;}
  if(this.ant==='star'){ctx.strokeStyle=whiteGloss();ctx.beginPath();ctx.moveTo(-2,-11);ctx.quadraticCurveTo(-9,-19+aL,-6,-23);ctx.stroke();ctx.beginPath();ctx.moveTo(2,-11);ctx.quadraticCurveTo(9,-19-aL,6,-23);ctx.stroke();ctx.fillStyle=this.secondary;star(-6,-25,3,1.4,5);ctx.fill();star(6,-25,3,1.4,5);ctx.fill();return;}
  if(this.ant==='bulbous'){ctx.strokeStyle=whiteGloss();ctx.beginPath();ctx.moveTo(-2,-11);ctx.quadraticCurveTo(-8,-18+aL,-5,-23);ctx.stroke();ctx.beginPath();ctx.moveTo(2,-11);ctx.quadraticCurveTo(8,-18-aL,5,-23);ctx.stroke();ctx.fillStyle=this.secondary;ctx.beginPath();ctx.arc(-5,-23,3,0,7);ctx.fill();ctx.beginPath();ctx.arc(5,-23,3,0,7);ctx.fill();return;}
  if(this.ant==='horns'){ctx.fillStyle='#fff';ctx.strokeStyle='#1a1a26';ctx.lineWidth=1;[[-7,-12,-10,-20],[7,-12,10,-20]].forEach(function(arr){ctx.beginPath();ctx.moveTo(arr[0],arr[1]);ctx.quadraticCurveTo((arr[0]+arr[2])/2,arr[1]-3,arr[2],arr[3]);ctx.lineTo(arr[2]+(arr[2]>0?-1:1),arr[3]+2);ctx.closePath();ctx.fill();ctx.stroke();});return;}
  if(this.ant==='spring'){ctx.strokeStyle=this.secondary;for(var s=-1;s<=1;s+=2){ctx.beginPath();for(var t=0;t<Math.PI*2.4;t+=0.3){var x=s*4+s*Math.cos(t)*1.6,y=-12-t*2+aL*0.4*s;if(t===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}return;}
  if(this.ant==='ribbon'){ctx.strokeStyle=this.secondary;ctx.lineWidth=1.8;for(var s=-1;s<=1;s+=2){ctx.beginPath();ctx.moveTo(s*2,-11);ctx.bezierCurveTo(s*8+aL*s,-16,s*4,-22+aL*0.5,s*9,-26+aL*s);ctx.stroke();}return;}
  /* default 'curly' — glossy WHITE antennae with rounded bulb tips (reference look) */
  ctx.strokeStyle=whiteGloss();ctx.lineWidth=2.8;
  ctx.beginPath();ctx.moveTo(-2.5,-10);ctx.quadraticCurveTo(-11,-20+aL,-7,-26);ctx.stroke();
  ctx.beginPath();ctx.moveTo(2.5,-10);ctx.quadraticCurveTo(11,-20-aL,7,-26);ctx.stroke();
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(-7,-26,2.4,0,7);ctx.fill();ctx.beginPath();ctx.arc(7,-26,2.4,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.arc(-7.8,-26.8,0.9,0,7);ctx.fill();ctx.beginPath();ctx.arc(6.2,-26.8,0.9,0,7);ctx.fill();
};
Flea.prototype.drawHat=function(){
  var h=this.hat;if(!h||h==='none')return;ctx.save();
  if(h==='crown'){ctx.fillStyle='#ffd23d';ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.shadowColor='#ffd23d';ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(-9,-14);ctx.lineTo(-11,-22);ctx.lineTo(-4,-17);ctx.lineTo(0,-24);ctx.lineTo(4,-17);ctx.lineTo(11,-22);ctx.lineTo(9,-14);ctx.closePath();ctx.fill();ctx.stroke();}
  else if(h==='party'){ctx.fillStyle='#ff3db5';ctx.beginPath();ctx.moveTo(-8,-14);ctx.lineTo(8,-14);ctx.lineTo(0,-30);ctx.closePath();ctx.fill();ctx.fillStyle='#ffd23d';ctx.beginPath();ctx.arc(0,-30,2.4,0,7);ctx.fill();}
  else if(h==='bow'){ctx.fillStyle='#ff3db5';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(-8,-19);ctx.lineTo(-8,-9);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(8,-19);ctx.lineTo(8,-9);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-14,2,0,7);ctx.fill();}
  else if(h==='halo'){ctx.strokeStyle='#ffe98a';ctx.lineWidth=2.5;ctx.shadowColor='#ffd23d';ctx.shadowBlur=12;ctx.beginPath();ctx.ellipse(0,-22,8,3,0,0,7);ctx.stroke();}
  else if(h==='cap'){ctx.fillStyle='#2de2ff';ctx.beginPath();ctx.arc(0,-13,9,Math.PI,0);ctx.fill();ctx.fillRect(0,-14,14,3);}
  else if(h==='flower'){ctx.fillStyle='#ff7ab8';for(var i=0;i<5;i++){var a=i/5*7;ctx.beginPath();ctx.arc(-6+Math.cos(a)*4,-18+Math.sin(a)*4,2.6,0,7);ctx.fill();}ctx.fillStyle='#ffd23d';ctx.beginPath();ctx.arc(-6,-18,2.2,0,7);ctx.fill();}
  else if(h==='tophat'){ctx.fillStyle='#15151f';ctx.fillRect(-9,-15,18,2.5);ctx.fillRect(-6,-27,12,12);ctx.fillStyle='#ff3db5';ctx.fillRect(-6,-19,12,2.5);}
  else if(h==='beanie'){ctx.fillStyle='#9b6bff';ctx.beginPath();ctx.ellipse(0,-16,10,8,0,Math.PI,0);ctx.fill();ctx.fillStyle='#ffd23d';ctx.beginPath();ctx.arc(0,-24,2.6,0,7);ctx.fill();}
  else if(h==='wizard'){ctx.fillStyle='#241048';ctx.beginPath();ctx.moveTo(-10,-14);ctx.lineTo(10,-14);ctx.lineTo(1,-34);ctx.closePath();ctx.fill();ctx.fillStyle='#ffd23d';ctx.shadowColor='#ffd23d';ctx.shadowBlur=6;star(-3,-22,1.6,.7,5);ctx.fill();star(4,-26,1.4,.6,5);ctx.fill();}
  else if(h==='horns'){ctx.fillStyle='#1a1a2a';[-1,1].forEach(function(s){ctx.beginPath();ctx.moveTo(s*6,-13);ctx.lineTo(s*9,-22);ctx.lineTo(s*4,-15);ctx.closePath();ctx.fill();});}
  else if(h==='antlers'){ctx.strokeStyle='#c47a3a';ctx.lineWidth=1.8;[-1,1].forEach(function(s){ctx.beginPath();ctx.moveTo(s*4,-13);ctx.lineTo(s*7,-22);ctx.moveTo(s*6,-18);ctx.lineTo(s*11,-19);ctx.moveTo(s*7,-22);ctx.lineTo(s*11,-25);ctx.stroke();});}
  else if(h==='cowboy'){ctx.fillStyle='#8a5a2b';ctx.strokeStyle='#5a3a1a';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,-13,13,3.4,0,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-6,-13);ctx.quadraticCurveTo(-5,-22,0,-22);ctx.quadraticCurveTo(5,-22,6,-13);ctx.fill();ctx.stroke();ctx.strokeStyle='#ffd23d';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-6,-15);ctx.lineTo(6,-15);ctx.stroke();}
  else if(h==='pirate'){ctx.fillStyle='#15151f';ctx.beginPath();ctx.moveTo(-11,-14);ctx.quadraticCurveTo(0,-26,11,-14);ctx.quadraticCurveTo(0,-19,-11,-14);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-17,1.6,0,7);ctx.fill();ctx.fillRect(-0.6,-18.5,1.2,3);ctx.fillRect(-1.5,-17.6,3,1.2);}
  else if(h==='chef'){ctx.fillStyle='#fff';ctx.fillRect(-7,-16,14,4);ctx.beginPath();ctx.arc(-4,-19,4,0,7);ctx.arc(0,-21,4.5,0,7);ctx.arc(4,-19,4,0,7);ctx.fill();}
  ctx.restore();
};
Flea.prototype.drawWings=function(){
  if(!this.wings||this.wings==='none')return;var fl=Math.sin(this.la*4)*2;ctx.save();
  if(this.wings==='fairy'){ctx.globalAlpha=.5;ctx.fillStyle='#bdecff';ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1;[-1,1].forEach(function(s){ctx.beginPath();ctx.ellipse(s*16,-2-fl*s,9,13,s*0.5,0,7);ctx.fill();ctx.stroke();});}
  else if(this.wings==='bee'){ctx.globalAlpha=.55;ctx.fillStyle='rgba(230,245,255,.9)';[-1,1].forEach(function(s){ctx.beginPath();ctx.ellipse(s*13,-5,7,4,s*0.6,0,7);ctx.fill();});}
  else if(this.wings==='butterfly'){ctx.globalAlpha=.78;[[-1,'#ff8ad1'],[1,'#8ad1ff']].forEach(function(arr){var s=arr[0];ctx.fillStyle=arr[1];ctx.beginPath();ctx.ellipse(s*16,-6-fl*s,8,9,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(s*15,6,7,7,0,0,7);ctx.fill();});}
  else if(this.wings==='dragon'){ctx.globalAlpha=.85;ctx.fillStyle='#9b6bff';ctx.strokeStyle='#3a1a5a';ctx.lineWidth=1;[-1,1].forEach(function(s){ctx.beginPath();ctx.moveTo(s*4,-4);ctx.lineTo(s*18,-10-fl*s);ctx.lineTo(s*14,-2+fl*s);ctx.lineTo(s*18,2);ctx.lineTo(s*10,4);ctx.closePath();ctx.fill();ctx.stroke();});}
  else if(this.wings==='angel'){ctx.globalAlpha=.9;ctx.fillStyle='#fff';ctx.shadowColor='#fff';ctx.shadowBlur=6;[-1,1].forEach(function(s){ctx.beginPath();ctx.ellipse(s*14,-2-fl*s,10,6,s*0.3,0,7);ctx.fill();});}
  else if(this.wings==='tech'){ctx.globalAlpha=.8;ctx.strokeStyle='#2de2ff';ctx.shadowColor='#2de2ff';ctx.shadowBlur=8;ctx.lineWidth=2;[-1,1].forEach(function(s){ctx.beginPath();ctx.moveTo(s*4,-4);ctx.lineTo(s*16,-8-fl*s);ctx.moveTo(s*4,-2);ctx.lineTo(s*18,-2);ctx.moveTo(s*4,0);ctx.lineTo(s*16,4+fl*s);ctx.stroke();});}
  ctx.restore();
};
Flea.prototype.drawCape=function(){
  if(!this.cape||this.cape==='none')return;ctx.save();
  var sway=Math.sin(this.la*1.5)*2;
  var col={hero:'#ff3030',vampire:'#1a0010',royal:'#5d2c8a',ghost:'rgba(220,230,255,.55)'}[this.cape]||'#444';
  ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=this.cape==='ghost'?14:0;
  ctx.beginPath();ctx.moveTo(-10,-7);ctx.lineTo(10,-7);ctx.lineTo(12+sway,12);ctx.lineTo(sway*.5,16);ctx.lineTo(-12+sway,12);ctx.closePath();ctx.fill();
  ctx.restore();
};
Flea.prototype.drawAccessory=function(){
  if(!this.accessory||this.accessory==='none')return;ctx.save();
  if(this.accessory==='scarf'){ctx.fillStyle='#ff3db5';ctx.fillRect(-10,4,20,3);ctx.fillRect(-2,6,4,8);}
  else if(this.accessory==='tie'){ctx.fillStyle='#9b6bff';ctx.beginPath();ctx.moveTo(-2.5,3);ctx.lineTo(2.5,3);ctx.lineTo(2,5);ctx.lineTo(3,12);ctx.lineTo(-3,12);ctx.lineTo(-2,5);ctx.closePath();ctx.fill();}
  else if(this.accessory==='earrings'){ctx.fillStyle='#ffd23d';ctx.shadowColor='#ffd23d';ctx.shadowBlur=6;ctx.beginPath();ctx.arc(-12,-2,1.6,0,7);ctx.fill();ctx.beginPath();ctx.arc(12,-2,1.6,0,7);ctx.fill();}
  else if(this.accessory==='necklace'){ctx.strokeStyle='#ffd23d';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,4,8,0.1*Math.PI,0.9*Math.PI);ctx.stroke();ctx.fillStyle='#ff3db5';ctx.beginPath();ctx.arc(0,12,2,0,7);ctx.fill();}
  else if(this.accessory==='backpack'){ctx.fillStyle='#3a1a5a';ctx.beginPath();ctx.roundRect(-13,-6,5,12,1.5);ctx.fill();ctx.fillStyle='#9b6bff';ctx.fillRect(-12,-4,3,2);}
  else if(this.accessory==='shield'){ctx.fillStyle='#2de2ff';ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.shadowColor='#2de2ff';ctx.shadowBlur=6;ctx.beginPath();ctx.moveTo(-15,-4);ctx.quadraticCurveTo(-13,6,-10,8);ctx.quadraticCurveTo(-13,6,-16,4);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.restore();
};
Flea.prototype.drawBubble=function(rx,ry){
  var by=ry-this.h/2-22;ctx.save();ctx.font='bold 10px Chakra Petch';
  var tw=ctx.measureText(this.bubble).width,bw=tw+16,bh=18;
  ctx.fillStyle='rgba(8,10,26,.95)';ctx.strokeStyle='#2de2ff';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(rx-bw/2,by-bh,bw,bh,6);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(rx-4,by);ctx.lineTo(rx+4,by);ctx.lineTo(rx,by+4);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(this.bubble,rx,by-bh/2+3);ctx.restore();
};
Flea.prototype.drawEmoteBubble=function(rx,ry){
  var pop=Math.min(1,(2000-this.emoteT)/160),fade=Math.min(1,this.emoteT/300);
  var scale=0.7+0.3*pop, fs=Math.round(26*scale);
  var by=ry-this.h/2-24;ctx.save();ctx.globalAlpha=fade;ctx.font=fs+'px serif';ctx.textBaseline='alphabetic';
  var tw=ctx.measureText(this.emoteEmoji).width,bw=tw+20,bh=fs+14;
  ctx.fillStyle='rgba(8,10,26,.95)';ctx.strokeStyle='#ffd23d';ctx.lineWidth=1.8;ctx.shadowColor='rgba(255,210,61,.5)';ctx.shadowBlur=10;
  ctx.beginPath();ctx.roundRect(rx-bw/2,by-bh,bw,bh,10);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(rx-5,by);ctx.lineTo(rx+5,by);ctx.lineTo(rx,by+5);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.shadowBlur=0;ctx.textAlign='center';ctx.fillText(this.emoteEmoji,rx,by-bh/2+fs*0.36);ctx.restore();
};

/* ===== ORB ===== */
function Orb(x,y){this.x=x;this.y=y;this.vx=(Math.random()-.5)*4;this.vy=-6;this.r=18;this.an=0;this.pu=0;ofx(x,y);}
Orb.prototype.update=function(dt){
  this.an+=dt*0.005;this.pu+=dt*0.01;orbAng+=dt*0.004;orbPulse+=dt*0.008;
  if(orbHolder||gameMode==='race')return;
  this.vy+=GRAV*0.6;this.x+=this.vx;this.y+=this.vy;this.vx*=0.98;
  for(var i=0;i<platforms.length;i++){var p=platforms[i];
    if(p.kind==='rect'){
      if(this.x+this.r>p.x&&this.x-this.r<p.x+p.w){
        var prevY=this.y-this.vy;
        if(prevY+this.r<=p.y+2&&this.y+this.r>=p.y&&this.vy>=0){this.y=p.y-this.r;this.vy*=-0.5;this.vx*=0.7;if(Math.abs(this.vy)<0.5)this.vy=0;}
        if(this.y-this.r<p.y+p.h&&this.y+this.r>p.y&&this.vy<0){this.y=p.y+p.h+this.r;this.vy=Math.abs(this.vy)*0.3;}
      }
    }else if(p.kind==='circle'){
      var dx=this.x-p.x,dy=this.y-p.y,d=Math.hypot(dx,dy),md=p.r+this.r;
      if(d<md){var nx=dx/(d||1),ny=dy/(d||1);this.x=p.x+nx*md;this.y=p.y+ny*md;this.vx=nx*Math.abs(this.vx)*0.7;this.vy=ny*Math.abs(this.vy)*0.6;}
    }else{
      if(this.x+this.r>p.bx&&this.x-this.r<p.bx+p.bw&&this.y+this.r>p.by&&this.y-this.r<p.by+p.bh){
        if(p.contains(this.x,this.y+this.r)&&this.vy>0){this.y=p.by-this.r;this.vy*=-0.5;}
      }
    }
  }
  if(this.x-this.r<0){this.x=this.r;this.vx=Math.abs(this.vx);}
  if(this.x+this.r>WORLD_W){this.x=WORLD_W-this.r;this.vx=-Math.abs(this.vx);}
  if(this.y+this.r>WORLD_H-60)this.respawn();
};
Orb.prototype.respawn=function(){
  var cands=[];
  for(var i=3;i<platforms.length;i++){var p=platforms[i];if(p.by<WORLD_H*0.12)continue;if(p.bw>WORLD_W*0.6)continue;cands.push(p);}
  var tp;
  if(cands.length){tp=cands[Math.random()*cands.length|0].topPoint();}else{tp={x:WORLD_W/2,y:WORLD_H*0.5};}
  this.x=Math.max(this.r+24,Math.min(WORLD_W-this.r-24,tp.x));
  this.y=tp.y-this.r-12;this.vy=-3;this.vx=(Math.random()-.5)*2;ofx(this.x,this.y);
};
Orb.prototype.draw=function(){
  var rx=this.x-camera.x,ry=this.y-camera.y;
  var hot=(gameMode==='survival'&&orbHolder);
  var r=this.r+Math.sin(this.pu)*2.6;var t=orbAng;
  ctx.save();
  var auraG=ctx.createRadialGradient(rx,ry,r*0.4,rx,ry,r*4.8);
  if(hot){auraG.addColorStop(0,'rgba(255,80,160,0.65)');auraG.addColorStop(0.5,'rgba(255,40,110,0.18)');auraG.addColorStop(1,'rgba(255,40,110,0)');}
  else{auraG.addColorStop(0,'rgba(255,220,80,0.55)');auraG.addColorStop(0.5,'rgba(255,140,40,0.16)');auraG.addColorStop(1,'rgba(255,140,40,0)');}
  ctx.fillStyle=auraG;ctx.beginPath();ctx.arc(rx,ry,r*4.8,0,7);ctx.fill();
  if(hot){
    /* fiery flame tongues */
    for(var fi=0;fi<14;fi++){var fa=(fi/14)*Math.PI*2;var wob=Math.sin(orbPulse*3+fi*1.7)*0.35;var fl=r*(1.6+Math.abs(Math.sin(orbPulse*2.4+fi))*1.1);
      var fx0=rx+Math.cos(fa)*r*0.8,fy0=ry+Math.sin(fa)*r*0.8;var fx1=rx+Math.cos(fa+wob)*fl,fy1=ry+Math.sin(fa+wob)*fl-r*0.4;
      var fg=ctx.createLinearGradient(fx0,fy0,fx1,fy1);fg.addColorStop(0,'rgba(255,230,120,.9)');fg.addColorStop(.5,'rgba(255,120,20,.8)');fg.addColorStop(1,'rgba(255,40,0,0)');
      ctx.fillStyle=fg;ctx.beginPath();ctx.moveTo(rx+Math.cos(fa-0.18)*r*0.8,ry+Math.sin(fa-0.18)*r*0.8);ctx.quadraticCurveTo(fx1,fy1,rx+Math.cos(fa+0.18)*r*0.8,ry+Math.sin(fa+0.18)*r*0.8);ctx.closePath();ctx.fill();}
    if(Math.random()<0.6)parts.push({x:this.x+(Math.random()-.5)*r,y:this.y-r,vx:(Math.random()-.5)*1.5,vy:-1.5-Math.random()*2,l:1,r:2+Math.random()*3,c:Math.random()<.5?'#ff7a1a':'#ffd23d'});
  }
  ctx.strokeStyle=hot?'rgba(255,90,170,0.9)':'rgba(255,220,80,0.85)';ctx.lineWidth=2;
  ctx.shadowColor=hot?'#ff3db5':'#ffd23d';ctx.shadowBlur=14;
  ctx.beginPath();ctx.ellipse(rx,ry,r*2.0,r*0.66,t*0.7,0,7);ctx.stroke();
  ctx.beginPath();ctx.ellipse(rx,ry,r*2.0,r*0.66,-t*0.7+0.8,0,7);ctx.stroke();
  for(var i=0;i<6;i++){var a=t*1.6+(i/6)*Math.PI*2;var ox=rx+Math.cos(a)*r*2.0;var oy=ry+Math.sin(a)*r*0.66;
    ctx.fillStyle=hot?'#ffb0d8':'#fff5b0';ctx.shadowColor=hot?'#ff3db5':'#ffd23d';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(ox,oy,2.3,0,7);ctx.fill();}
  ctx.shadowColor=hot?'#ff2d6f':'#ffd23d';ctx.shadowBlur=32+Math.sin(this.pu)*12;
  var core=ctx.createRadialGradient(rx-r*0.3,ry-r*0.35,r*0.1,rx,ry,r);
  if(hot){core.addColorStop(0,'#ffffff');core.addColorStop(.3,'#ffd0e6');core.addColorStop(.7,'#ff3db5');core.addColorStop(1,'#7a0033');}
  else{core.addColorStop(0,'#ffffff');core.addColorStop(.25,'#fff2b0');core.addColorStop(.6,'#ffd23d');core.addColorStop(1,'#a83a00');}
  ctx.fillStyle=core;ctx.beginPath();ctx.arc(rx,ry,r,0,7);ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(rx-r*0.4,ry-r*0.45,r*0.18,0,7);ctx.fill();
  var pp=(orbPulse%1.0);ctx.globalAlpha=(1-pp)*0.6;ctx.strokeStyle=hot?'#ff3db5':'#ffd23d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(rx,ry,r+pp*22,0,7);ctx.stroke();
  ctx.restore();
};

/* ---------- FX ---------- */
function jpfx(x,y,c){var N=perfMode?3:8;for(var i=0;i<N;i++){var a=Math.random()*7,s=1+Math.random()*4;parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,r:2+Math.random()*3,c:c});}}
function ofx(x,y){var N=perfMode?7:18;for(var i=0;i<N;i++){var a=Math.random()*7,s=2+Math.random()*5;parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,l:1,r:3+Math.random()*3,c:'#ffd23d'});if(!perfMode)sparks.push({x:x,y:y,vx:Math.cos(a)*s*1.2,vy:Math.sin(a)*s*1.2-2,l:1});}}
function gfx(x,y){for(var i=0;i<16;i++){var a=Math.random()*7,s=2+Math.random()*4;parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,l:1,r:2+Math.random()*3,c:'#39ff7a'});}}
function emitTrail(f){
  var x=f.cx,y=f.cy,t=f.trail;
  if(t==='sparkle')parts.push({x:x,y:y,vx:(Math.random()-.5),vy:(Math.random()-.5),l:1,r:1.5+Math.random()*2,c:Math.random()<.5?'#fff':'#ffe9a8'});
  else if(t==='fire')parts.push({x:x,y:y,vx:(Math.random()-.5)*1.5,vy:-0.5-Math.random(),l:1,r:2+Math.random()*3,c:Math.random()<.5?'#ff7a1a':'#ff3b00'});
  else if(t==='bubbles')parts.push({x:x,y:y,vx:(Math.random()-.5),vy:-0.4-Math.random(),l:1,r:2+Math.random()*3,c:'rgba(120,230,255,.8)'});
  else if(t==='rainbow')parts.push({x:x,y:y,vx:(Math.random()-.5),vy:(Math.random()-.5),l:1,r:2+Math.random()*2,c:'hsl('+((f.la*50)%360)+',100%,62%)'});
  else if(t==='stars')parts.push({x:x,y:y,vx:(Math.random()-.5)*0.6,vy:0.3+Math.random()*0.8,l:1,r:1.6+Math.random()*1.5,c:'#ffd23d'});
  else if(t==='snow')parts.push({x:x,y:y,vx:(Math.random()-.5)*0.8,vy:0.4+Math.random()*0.6,l:1,r:1.4+Math.random()*1.6,c:'#e6f5ff'});
  else if(t==='smoke')parts.push({x:x,y:y,vx:(Math.random()-.5)*0.4,vy:-0.4-Math.random()*0.6,l:1,r:3+Math.random()*3,c:'rgba(160,170,200,.45)'});
  else if(t==='lightning')parts.push({x:x,y:y,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,l:1,r:1.4,c:'#2de2ff'});
  else if(t==='hearts')parts.push({x:x,y:y,vx:(Math.random()-.5)*0.6,vy:-0.3-Math.random()*0.6,l:1,r:2+Math.random()*1.5,c:'#ff6ab0',heart:true});
}
function drawFX(){
  for(var i=parts.length-1;i>=0;i--){var p=parts[i];ctx.save();ctx.globalAlpha=Math.max(0,p.l);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x-camera.x,p.y-camera.y,p.r*p.l,0,7);ctx.fill();ctx.restore();p.x+=p.vx;p.y+=p.vy;p.vy+=.1;p.l-=.035;if(p.l<=0)parts.splice(i,1);}
  for(var i=sparks.length-1;i>=0;i--){var s=sparks[i];ctx.save();ctx.globalAlpha=Math.max(0,s.l);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x-camera.x,s.y-camera.y,2.5*s.l,0,7);ctx.fill();ctx.restore();s.x+=s.vx;s.y+=s.vy;s.vy+=.08;s.vx*=.94;s.l-=.025;if(s.l<=0)sparks.splice(i,1);}
}
function drawTapMarker(dt){
  if(!tapMarker)return;tapMarker.t+=dt;var k=tapMarker.t/900;if(k>=1){tapMarker=null;return;}
  var x=tapMarker.x-camera.x,y=tapMarker.y-camera.y;ctx.save();
  for(var i=0;i<3;i++){var kk=(k+i*0.33)%1;ctx.globalAlpha=(1-kk)*0.9;ctx.strokeStyle='#2de2ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,6+kk*24,0,7);ctx.stroke();}
  ctx.globalAlpha=1-k;ctx.fillStyle='#2de2ff';ctx.shadowColor='#2de2ff';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(x,y,3.5,0,7);ctx.fill();
  ctx.strokeStyle='rgba(45,226,255,'+(1-k)+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-11,y);ctx.lineTo(x-5,y);ctx.moveTo(x+5,y);ctx.lineTo(x+11,y);ctx.moveTo(x,y-11);ctx.lineTo(x,y-5);ctx.moveTo(x,y+5);ctx.lineTo(x,y+11);ctx.stroke();ctx.restore();
}
function drawTouchRipple(dt){
  if(!touchRipple)return;touchRipple.t+=dt;var k=touchRipple.t/650;if(k>=1){touchRipple=null;return;}
  ctx.save();var x=touchRipple.x,y=touchRipple.y;
  for(var i=0;i<2;i++){var kk=Math.min(1,k+i*0.3);ctx.globalAlpha=(1-kk)*0.85;ctx.strokeStyle='#ffd23d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,8+kk*38,0,7);ctx.stroke();}
  ctx.globalAlpha=(1-k)*0.9;ctx.fillStyle='#ffd23d';ctx.shadowColor='#ffd23d';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();ctx.restore();
}
/* capture rings (classic) + infected aura (tag) drawn in world space */
function drawIndicators(){
  if(gameMode==='classic'){
    for(var i=0;i<fleas.length;i++){var f=fleas[i];if(f.capture<=0)continue;
      var rx=f.cx-camera.x,ry=f.cy-camera.y,rad=f.w*0.85+8;
      ctx.save();
      ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(rx,ry,rad,0,7);ctx.stroke();
      var col=lerpColor('#ffd23d','#39ff7a',f.capture/100);
      ctx.strokeStyle=col;ctx.lineWidth=3.5;ctx.lineCap='round';ctx.shadowColor=col;ctx.shadowBlur=10;
      ctx.beginPath();ctx.arc(rx,ry,rad,-Math.PI/2,-Math.PI/2+(f.capture/100)*Math.PI*2);ctx.stroke();
      ctx.restore();
    }
  }
  if(gameMode==='tag'){
    for(var i=0;i<fleas.length;i++){var f=fleas[i];if(!f.infected)continue;
      var rx=f.cx-camera.x,ry=f.cy-camera.y;var pr=18+Math.sin(orbPulse*2+i)*4;
      ctx.save();var g=ctx.createRadialGradient(rx,ry,4,rx,ry,f.w+pr);
      g.addColorStop(0,'rgba(57,255,122,.35)');g.addColorStop(.6,'rgba(57,255,122,.12)');g.addColorStop(1,'rgba(57,255,122,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(rx,ry,f.w+pr,0,7);ctx.fill();ctx.restore();
    }
  }
}
/* off-screen orb tracking arrow (classic / survival / race) */
function drawOrbIndicator(){
  if(!orb||!(gameMode==='classic'||gameMode==='survival'||gameMode==='race'))return;
  if(STATE!=='play'&&STATE!=='countdown')return;
  var ox=orb.x-camera.x, oy=orb.y-camera.y, mgn=18;
  if(ox>=mgn&&ox<=W-mgn&&oy>=mgn&&oy<=H-mgn)return; /* orb visible */
  var cxs=W/2, cys=H/2, dx=ox-cxs, dy=oy-cys, ang=Math.atan2(dy,dx);
  var hw=W/2-52, hh=H/2-52;
  var scale=Math.min(hw/Math.max(0.001,Math.abs(dx)), hh/Math.max(0.001,Math.abs(dy)));
  var tx=cxs+dx*scale, ty=cys+dy*scale;
  var hot=(gameMode==='survival'&&orbHolder), col=hot?'#ff5a1e':'#ffd23d';
  var ref=player&&!playerDead?player:{cx:cxs+camera.x,cy:cys+camera.y};
  var dist=Math.max(1,Math.round(Math.hypot(orb.x-ref.cx,orb.y-ref.cy)/28));
  var pulse=1+Math.sin(orbPulse*3)*0.08;
  ctx.save();
  /* orb mini icon (pulled slightly toward center) */
  var bx=tx-Math.cos(ang)*22, by=ty-Math.sin(ang)*22;
  var g=ctx.createRadialGradient(bx-2,by-2,1,bx,by,11*pulse);
  if(hot){g.addColorStop(0,'#fff');g.addColorStop(.5,'#ffd23d');g.addColorStop(1,'#ff3b00');}
  else{g.addColorStop(0,'#fff');g.addColorStop(.5,'#fff2b0');g.addColorStop(1,'#ffaa00');}
  ctx.fillStyle=g;ctx.shadowColor=col;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(bx,by,10*pulse,0,7);ctx.fill();
  /* arrow pointing outward toward orb */
  ctx.shadowBlur=10;ctx.translate(tx,ty);ctx.rotate(ang);
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(1,-9);ctx.lineTo(1,9);ctx.closePath();ctx.fill();
  ctx.restore();
  /* distance label toward center */
  var lx=bx-Math.cos(ang)*20, ly=by-Math.sin(ang)*20;
  ctx.save();ctx.fillStyle='rgba(8,10,26,.85)';ctx.strokeStyle=col;ctx.lineWidth=1;
  ctx.font='bold 10px Chakra Petch';var tw=ctx.measureText(dist+'m').width;
  ctx.beginPath();ctx.roundRect(lx-tw/2-5,ly-8,tw+10,16,8);ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(dist+'m',lx,ly+1);ctx.restore();
}
/* Hide & Seek fog-of-war: black screen except a spotlight tracking the seeker */
function drawHnsFog(){
  if(gameMode!=='hns'||hnsPhase!=='seek'||!hnsSeeker)return;
  var px=hnsSeeker.cx-camera.x, py=hnsSeeker.cy-camera.y;
  var R=hnsSpotR();
  var breathe=R*(1+Math.sin(orbPulse*1.5)*0.015);
  ctx.save();
  var g=ctx.createRadialGradient(px,py,breathe*0.62,px,py,breathe);
  g.addColorStop(0,'rgba(2,3,9,0)');
  g.addColorStop(0.72,'rgba(2,3,9,0)');
  g.addColorStop(1,'rgba(2,3,9,1)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  /* soft flashlight rim */
  ctx.strokeStyle='rgba(45,226,255,0.18)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,breathe*0.86,0,7);ctx.stroke();
  ctx.restore();
}
/* Hide & Seek: show the player-hider which object they'll turn into (live preview during HIDE) */
function drawHnsHidePreview(){
  if(gameMode!=='hns'||hnsPhase!=='hide'||!player||hnsSeeker===player||player.hidden||player.found)return;
  var type=player._previewDisguise||player.hideType;if(!type)return;
  var em=HNS_EMOJI[type]||'📦';
  var sx=player.cx-camera.x, sy=player.cy-camera.y-player.h*0.9-30;
  var bob=Math.sin(orbPulse*2)*3;sy+=bob;
  ctx.save();
  /* bubble */
  var r=22;
  ctx.beginPath();ctx.arc(sx,sy,r,0,7);
  ctx.fillStyle='rgba(8,14,26,0.82)';ctx.fill();
  ctx.lineWidth=2;ctx.strokeStyle='rgba(57,255,122,0.85)';ctx.stroke();
  /* pointer */
  ctx.beginPath();ctx.moveTo(sx-6,sy+r-2);ctx.lineTo(sx+6,sy+r-2);ctx.lineTo(sx,sy+r+9);ctx.closePath();
  ctx.fillStyle='rgba(8,14,26,0.82)';ctx.fill();
  ctx.font='24px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(em,sx,sy+1);
  ctx.restore();
}


/* ===== LEVEL — multi-shape procedural generation + motion ===== */
function makePoly(cx,cy,verts){return new Platform({kind:'poly',pts:verts});}
function makeShape(kind,x,y){
  if(kind==='rect'){var w=110+Math.random()*100;return new Platform({kind:'rect',x:x,y:y,w:w,h:18});}
  if(kind==='long'){var w=200+Math.random()*160;return new Platform({kind:'rect',x:x,y:y,w:w,h:18});}
  if(kind==='tall'){var h=90+Math.random()*120;return new Platform({kind:'rect',x:x,y:y,w:24,h:h});}
  if(kind==='circle'){var r=28+Math.random()*24;return new Platform({kind:'circle',x:x+r,y:y+r,r:r});}
  if(kind==='box'){var s=46+Math.random()*30;return makePoly(0,0,[[x,y],[x+s,y],[x+s,y+s],[x,y+s]]);}
  if(kind==='triUp'){var w=80+Math.random()*70,h=60+Math.random()*50;return makePoly(0,0,[[x,y+h],[x+w/2,y],[x+w,y+h]]);}
  if(kind==='triDown'){var w=80+Math.random()*70,h=60+Math.random()*50;return makePoly(0,0,[[x,y],[x+w,y],[x+w/2,y+h]]);}
  if(kind==='diamond'){var w=70+Math.random()*50,h=70+Math.random()*50;return makePoly(0,0,[[x+w/2,y],[x+w,y+h/2],[x+w/2,y+h],[x,y+h/2]]);}
  if(kind==='hexagon'){var r=40+Math.random()*22,pts=[];for(var i=0;i<6;i++){var a=Math.PI/3*i-Math.PI/6;pts.push([x+r+Math.cos(a)*r,y+r+Math.sin(a)*r]);}return makePoly(0,0,pts);}
  if(kind==='pentagon'){var r=42+Math.random()*22,pts=[];for(var i=0;i<5;i++){var a=Math.PI*2/5*i-Math.PI/2;pts.push([x+r+Math.cos(a)*r,y+r+Math.sin(a)*r]);}return makePoly(0,0,pts);}
  if(kind==='trapezoid'){var w=110+Math.random()*70,h=54+Math.random()*36,t=w*0.5;return makePoly(0,0,[[x+(w-t)/2,y],[x+(w-t)/2+t,y],[x+w,y+h],[x,y+h]]);}
  if(kind==='parallelogram'){var w=110+Math.random()*70,h=50+Math.random()*30,sk=26;return makePoly(0,0,[[x+sk,y],[x+w,y],[x+w-sk,y+h],[x,y+h]]);}
  if(kind==='octagon'){var r=40+Math.random()*22,pts=[];for(var i=0;i<8;i++){var a=Math.PI/4*i-Math.PI/8;pts.push([x+r+Math.cos(a)*r,y+r+Math.sin(a)*r]);}return makePoly(0,0,pts);}
  if(kind==='heptagon'){var r=42+Math.random()*20,pts=[];for(var i=0;i<7;i++){var a=Math.PI*2/7*i-Math.PI/2;pts.push([x+r+Math.cos(a)*r,y+r+Math.sin(a)*r]);}return makePoly(0,0,pts);}
  if(kind==='kite'){var w=64+Math.random()*40,h=84+Math.random()*40;return makePoly(0,0,[[x+w/2,y],[x+w,y+h*0.38],[x+w/2,y+h],[x,y+h*0.38]]);}
  if(kind==='gem'){var w=96+Math.random()*50,h=74+Math.random()*30;return makePoly(0,0,[[x+w*0.22,y],[x+w*0.78,y],[x+w,y+h*0.42],[x+w/2,y+h],[x,y+h*0.42]]);}
  var ww=110+Math.random()*100;return new Platform({kind:'rect',x:x,y:y,w:ww,h:18});
}
var SPINNABLE={box:1,triUp:1,triDown:1,diamond:1,hexagon:1,pentagon:1,circle:1,octagon:1,heptagon:1,kite:1,gem:1};
function buildLevel(){
  platforms=[];pal=LC[Math.random()*LC.length|0];
  platforms.push(new Platform({kind:'rect',x:0,y:WORLD_H-60,w:WORLD_W,h:60}));
  platforms.push(new Platform({kind:'rect',x:0,y:0,w:15,h:WORLD_H}));
  platforms.push(new Platform({kind:'rect',x:WORLD_W-15,y:0,w:15,h:WORLD_H}));
  if(gameMode==='tutorial')return; /* tutorial steps add their own platforms */
  var pool=Object.keys(enabledShapes).filter(function(k){return enabledShapes[k];});
  if(!pool.length)pool=['rect'];
  function overlaps(a){for(var i=3;i<platforms.length;i++){var p=platforms[i];if(a.bx<p.bx+p.bw+14&&a.bx+a.bw+14>p.bx&&a.by<p.by+p.bh+14&&a.by+a.bh+14>p.by)return true;}return false;}
  function tryAdd(p,kind){if(p.bx<24||p.bx+p.bw>WORLD_W-24)return false;if(p.by<60||p.by+p.bh>WORLD_H-90)return false;if(overlaps(p))return false;p._kind=kind;platforms.push(p);return true;}
  var target;
  if(gameMode==='tag')target=Math.ceil((WORLD_W/220)*(WORLD_H/190));
  else if(activeLayout==='vert')target=Math.floor(WORLD_H/130)+4;
  else if(activeLayout==='horiz')target=Math.floor(WORLD_W/240)+4;
  else target=Math.ceil((WORLD_W/240)*(WORLD_H/200));
  target=Math.min(gameMode==='tag'?60:48,Math.max(8,target));
  var attempts=0,added=0;
  while(added<target&&attempts<target*16){
    attempts++;
    var kind=pool[Math.random()*pool.length|0];
    var x,y;
    if(activeLayout==='vert'){var k=1+Math.floor(Math.random()*Math.floor((WORLD_H-200)/120));y=WORLD_H-80-k*120+(Math.random()*30-15);x=30+Math.random()*(WORLD_W-220);}
    else if(activeLayout==='horiz'){x=80+Math.random()*(WORLD_W-220);y=100+Math.random()*(WORLD_H-260);}
    else{x=60+Math.random()*(WORLD_W-220);y=80+Math.random()*(WORLD_H-220);}
    var plat=makeShape(kind,x,y);
    if(tryAdd(plat,kind))added++;
  }
  /* assign motion */
  for(var i=3;i<platforms.length;i++){var p=platforms[i],kind=p._kind;
    if(gameMode==='hns')continue; /* Hide & Seek: no moving/spinning platforms */
    var roll=Math.random();
    if(allowSpinning&&SPINNABLE[kind]&&roll<0.28){
      var fast=Math.random()<0.32;
      var spd=fast?(0.0048+Math.random()*0.0028):(0.0012+Math.random()*0.0022);
      p.sp={av:(Math.random()<0.5?1:-1)*spd};
    } else if(allowMoving&&roll<0.5){
      var axis=Math.random()<(activeLayout==='vert'?0.4:0.6)?'x':'y';
      var range=axis==='x'?(60+Math.random()*120):(40+Math.random()*90);
      /* keep within bounds */
      if(axis==='x'){range=Math.min(range,Math.max(20,(WORLD_W-40-p.bw)/2-p.cenx+p.cenx));range=Math.min(range,(WORLD_W-p.bx-p.bw-30));range=Math.min(range,p.bx-30);}
      else{range=Math.min(range,(WORLD_H-90-p.by-p.bh));range=Math.min(range,p.by-70);}
      if(range>18)p.mv={axis:axis,range:range,speed:(0.0009+Math.random()*0.0016)};
    }
  }
}

function flash(txt,color){var el=document.getElementById('orbtxt');el.textContent=txt;el.style.color=color||'#ffd23d';el.style.textShadow='0 0 22px '+(color||'#ffd23d');el.style.transition='none';el.style.opacity='1';el.style.transform='translateX(-50%) translateY(0)';setTimeout(function(){el.style.transition='all .9s var(--ease)';el.style.opacity='0';el.style.transform='translateX(-50%) translateY(-26px)';},700);}

/* ===== MODE LOGIC ===== */
function checkPickup(){
  if(!orb||orbHolder)return;
  for(var i=0;i<fleas.length;i++){var f=fleas[i];if(Math.hypot(f.cx-orb.x,f.cy-orb.y)<f.w/2+orb.r){
    if(f.isP)bump('orbsCaptured');
    if(gameMode==='race'){f.hasOrb=true;ofx(orb.x,orb.y);camera.shake=12;endGame(f);return;}
    orbHolder=f;f.hasOrb=true;capTimer=0;ofx(orb.x,orb.y);flash(f.name.toUpperCase()+' GRABBED THE ORB!',gameMode==='survival'?'#ff3db5':'#ffd23d');camera.shake=6;
    if(!f.isP)maybeSay(f,EVENT_LINES.grabOrb[Math.random()*EVENT_LINES.grabOrb.length|0],1600);break;
  }}
}
function checkSteal(){
  if(!orbHolder||!orb)return;
  for(var i=0;i<fleas.length;i++){var f=fleas[i];if(f===orbHolder)continue;
    if(Math.hypot(f.cx-orb.x,f.cy-orb.y)<f.w/2+orb.r+5){orbHolder.hasOrb=false;orbHolder=f;f.hasOrb=true;capTimer=0;ofx(orb.x,orb.y);flash(f.name.toUpperCase()+(gameMode==='survival'?' GOT THE HOT ORB!':' STOLE THE ORB!'),'#ff3db5');camera.shake=6;if(f.isP)bump('orbsCaptured');if(!f.isP)maybeSay(f,EVENT_LINES.grabOrb[Math.random()*EVENT_LINES.grabOrb.length|0],1600);break;}
  }
}
function holdTick(dt){
  if(!orbHolder||!orb)return;orb.x=orbHolder.cx;orb.y=orbHolder.y-orb.r-4;
  if(gameMode==='classic'){capTimer+=dt;while(capTimer>=300){capTimer-=300;orbHolder.capture=Math.min(100,orbHolder.capture+1);if(orbHolder.capture>=100){endRound(orbHolder);return;}}}
  if(gameMode==='survival'){fuse-=dt;updFuse();if(fuse<=0)eliminate(orbHolder);}
}
function endRound(winFlea){
  var ranked=fleas.slice().sort(function(a,b){return b.capture-a.capture;});
  var pts=[10,5,1];
  for(var i=0;i<ranked.length&&i<3;i++)ranked[i].matchPoints=(ranked[i].matchPoints||0)+pts[i];
  flash(winFlea.name.toUpperCase()+' WON ROUND '+roundNum+'! +10','#39ff7a');camera.shake=10;ofx(winFlea.cx,winFlea.cy);
  fleas.forEach(function(f){f.capture=0;f.hasOrb=false;});
  orbHolder=null;capTimer=0;roundNum++;
  if(winFlea.isP)bump('roundsWon');
  if(orb)orb.respawn();
  updScore();
}
function assignOrbToRandom(){
  if(!orb||!fleas.length)return;
  var choice=fleas[Math.random()*fleas.length|0];
  orbHolder=choice;choice.hasOrb=true;orb.x=choice.cx;orb.y=choice.y-orb.r-4;
  fuse=fuseMax;ofx(choice.cx,choice.cy);
  flash(choice.name.toUpperCase()+' HAS THE HOT ORB!','#ff3db5');
}
function eliminate(f){
  camera.shake=14;ofx(f.cx,f.cy);for(var k=0;k<3;k++)jpfx(f.cx,f.cy,'#ff3db5');
  f.hasOrb=false;orbHolder=null;fuse=fuseMax;
  var idx=fleas.indexOf(f);if(idx>=0)fleas.splice(idx,1);
  flash(f.name.toUpperCase()+' ELIMINATED!','#ff3db5');
  if(f===player)playerDead=true;
  else if(!playerDead)bump('survivalEliminations');
  updScore();
  if(fleas.length<=1){endGame(fleas[0]||null);return;}
  assignOrbToRandom();
  if(playerDead){setTimeout(function(){if(STATE==='play')endGame(survLeader());},1400);}
}
function survLeader(){if(!fleas.length)return null;return fleas[0];}
function leader(){if(!fleas.length)return null;var w=fleas[0];for(var i=1;i<fleas.length;i++)if((fleas[i].matchPoints||0)>(w.matchPoints||0))w=fleas[i];return w;}

/* TAG mode */
function seedInfection(){
  if(!fleas.length)return;
  var c=fleas[Math.random()*fleas.length|0];c.infected=true;tagSeeded=true;
  gfx(c.cx,c.cy);camera.shake=10;flash(c.name.toUpperCase()+' IS INFECTED! RUN!','#39ff7a');
  if(c===player)flash('YOU ARE IT! GO TAG SOMEONE!','#39ff7a');
  updScore();
}
function infect(s,by){
  s.infected=true;gfx(s.cx,s.cy);camera.shake=6;flash(s.name.toUpperCase()+' GOT INFECTED!','#39ff7a');
  if(by&&by.isP)bump('lifetimeInfected');
  if(s.isP)bump('timesInfected');
  if(!s.isP)maybeSay(s,EVENT_LINES.gotInfected[Math.random()*EVENT_LINES.gotInfected.length|0],1700);
  updScore();
}
function tagTick(dt){
  if(!tagSeeded){tagTimer+=dt;
    var rem=Math.ceil((10000-tagTimer)/1000);
    document.getElementById('tval').textContent=rem>0?rem:0;
    if(tagTimer>=10000)seedInfection();
    return;
  }
  document.getElementById('timer-lbl').textContent='Safe';
  var safe=fleas.filter(function(f){return !f.infected;});
  document.getElementById('tval').textContent=safe.length;
  for(var i=0;i<fleas.length;i++){var inf=fleas[i];if(!inf.infected)continue;
    for(var j=0;j<fleas.length;j++){var s=fleas[j];if(s.infected)continue;
      if(Math.hypot(inf.cx-s.cx,inf.cy-s.cy)<(inf.w+s.w)*0.5+2){infect(s,inf);}
    }
  }
  safe=fleas.filter(function(f){return !f.infected;});
  if(safe.length<=1)endGame(safe[0]||null);
}

/* ===== SCOREBOARD ===== */
function updScore(){
  var c=scoresEl;c.innerHTML='';
  if(gameMode==='tutorial')return;
  function pillRow(items){var w=document.createElement('div');w.className='sb-pills';items.forEach(function(it){var d=document.createElement('div');d.className='pill';d.innerHTML='<span class="pv" style="color:'+it.c+'">'+it.v+'</span><span class="pl">'+it.l+'</span>';w.appendChild(d);});c.appendChild(w);}
  function title(t){var d=document.createElement('div');d.className='sb-title';d.textContent=t;c.appendChild(d);}
  function listRows(arr,opts){
    opts=opts||{};
    var grid=document.createElement('div');grid.className='sb-grid'+(arr.length>16?' rows10':'');
    arr.forEach(function(it,idx){
      var r=document.createElement('div');r.className='srow'+(it.lead?' lead':'')+(it.me?' me':'');
      var html='';
      if(opts.pos)html+='<span class="pos">'+(idx+1)+'</span>';
      html+='<span class="dot" style="background:'+it.c+'"></span><span class="nm">'+it.n+'</span>';
      if(it.pts!=null)html+='<span class="pts">'+it.pts+'</span>';
      r.innerHTML=html;grid.appendChild(r);
    });
    c.appendChild(grid);
  }
  if(gameMode==='zen'){title('Zen Sandbox');pillRow([{v:fleas.length,l:'Fleas',c:'#9b6bff'}]);return;}
  if(gameMode==='hns'){
    var pIsS=(hnsSeeker===player);
    var ttl=hnsPhase==='hide'?(pIsS?'Eyes closed — counting!':'Hide! Pick a spot'):(pIsS?'You are seeking':((hnsSeeker?hnsSeeker.name:'Seeker')+' is seeking'));
    title(ttl);
    pillRow([{v:hnsFound+'/'+hnsTotal,l:'Found',c:'#39ff7a'},{v:hnsWrong+'/5',l:'Wrong',c:'#ff3db5'}]);
    return;
  }
  if(gameMode==='tag'){
    var inf=fleas.filter(function(f){return f.infected;}).length;
    title(tagSeeded?'Tag!':'Tag · starting…');
    pillRow([{v:fleas.length-inf,l:'Safe',c:'#2de2ff'},{v:inf,l:'Infected',c:'#39ff7a'}]);
    return;
  }
  if(gameMode==='survival'){title('Survival');pillRow([{v:fleas.length,l:'Alive',c:'#ff3db5'}]);return;}
  if(gameMode==='race'){
    title('Race · Live Placement');
    /* chain placement: nearest to orb = 1st, nearest to 1st = 2nd ... */
    var remaining=fleas.slice(),chain=[];
    var anchor=orb?{cx:orb.x,cy:orb.y}:(remaining[0]||null);
    while(remaining.length&&anchor){
      var bi=0,bd=1e9;
      for(var i=0;i<remaining.length;i++){var d=Math.hypot(remaining[i].cx-anchor.cx,remaining[i].cy-anchor.cy);if(d<bd){bd=d;bi=i;}}
      var nx=remaining.splice(bi,1)[0];chain.push(nx);anchor=nx;
    }
    listRows(chain.map(function(f,i){return {n:f.name,c:f.col,me:f.isP,lead:i===0};}),{pos:true});
    return;
  }
  /* classic: match points */
  title('Match Points');
  var sorted=fleas.slice().sort(function(a,b){return (b.matchPoints||0)-(a.matchPoints||0);});
  var topPts=sorted.length?(sorted[0].matchPoints||0):0;
  listRows(sorted.map(function(f){return {n:f.name+(f.hasOrb?' ♔':''),c:f.col,me:f.isP,lead:(f.matchPoints||0)===topPts&&topPts>0,pts:(f.matchPoints||0)};}),{pos:true});
}
function updFuse(){var t=document.getElementById('tbox');document.getElementById('timer-lbl').textContent='Fuse';if(orbHolder){document.getElementById('tval').textContent=(fuse/1000).toFixed(1);t.classList.add('danger');}else{document.getElementById('tval').textContent='—';t.classList.remove('danger');}}

function drawBG(){
  if(gameMode==='zen'&&STATE!=='title'){drawZenEnv();return;}
  ctx.fillStyle=pal.bg;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=pal.a+'14';ctx.lineWidth=1;
  var sx=-camera.x%60,sy=-camera.y%60;
  for(var x=sx;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(var y=sy;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
}
function drawZenEnv(){
  var e=ENV[zenEnv]||ENV.neon;
  var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,e.sky[0]);g.addColorStop(1,e.sky[1]);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  var t=lt*0.001;
  if(zenEnv==='neon'){ctx.strokeStyle='rgba(155,107,255,.10)';ctx.lineWidth=1;var sx=-camera.x%60,sy=-camera.y%60;for(var x=sx;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(var y=sy;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}}
  else if(zenEnv==='forest'){
    /* far trees parallax */
    var floorY=WORLD_H-60-camera.y;
    for(var i=0;i<14;i++){var tx=((i*180-camera.x*0.4)%(W+200))-100;if(tx<-100)tx+=W+200;var th=90+(i%3)*40;
      ctx.fillStyle='rgba(20,60,30,.55)';ctx.fillRect(tx-7,floorY-th,14,th);
      ctx.fillStyle='rgba(40,120,55,.6)';ctx.beginPath();ctx.arc(tx,floorY-th,34,0,7);ctx.arc(tx-18,floorY-th+14,24,0,7);ctx.arc(tx+18,floorY-th+14,24,0,7);ctx.fill();}
    /* birds */
    for(var b=0;b<4;b++){var bx=((b*260+t*40)%(W+120))-60,by=70+b*40+Math.sin(t*2+b)*8;ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx-6,by);ctx.quadraticCurveTo(bx,by-4,bx+6,by);ctx.stroke();}
    /* sun */
    ctx.fillStyle='rgba(255,240,180,.25)';ctx.beginPath();ctx.arc(W*0.8,90,46,0,7);ctx.fill();
  }
  else if(zenEnv==='beach'){
    ctx.fillStyle='rgba(255,225,150,.25)';ctx.beginPath();ctx.arc(W*0.75,80,52,0,7);ctx.fill();
    /* sea */
    var seaY=H*0.5;ctx.fillStyle='rgba(40,150,200,.35)';ctx.fillRect(0,seaY,W,H-seaY);
    ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=2;for(var w2=0;w2<5;w2++){var wy=seaY+20+w2*30;ctx.beginPath();for(var x=0;x<W;x+=20){ctx.lineTo(x,wy+Math.sin(x*0.05+t*2+w2)*4);}ctx.stroke();}
    /* sand */
    var sandY=WORLD_H-60-camera.y;ctx.fillStyle='rgba(240,215,150,.5)';ctx.fillRect(0,sandY-40,W,300);
  }
  else if(zenEnv==='living'){
    /* wall + floor */
    var floorY=WORLD_H-60-camera.y;
    ctx.fillStyle='rgba(80,60,80,.5)';ctx.fillRect(0,0,W,floorY);
    ctx.fillStyle='rgba(120,80,60,.5)';ctx.fillRect(0,floorY-10,W,300);
    /* window */
    var wx=120-camera.x*0.3;ctx.fillStyle='rgba(120,180,255,.25)';ctx.fillRect(wx,80,140,100);ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=4;ctx.strokeRect(wx,80,140,100);ctx.beginPath();ctx.moveTo(wx+70,80);ctx.lineTo(wx+70,180);ctx.moveTo(wx,130);ctx.lineTo(wx+140,130);ctx.stroke();
    /* picture frame */
    ctx.fillStyle='rgba(255,210,120,.3)';ctx.fillRect(W-220-camera.x*0.3,100,80,60);
  }
  else if(zenEnv==='space'){
    for(var s=0;s<80;s++){var sxp=((s*97-camera.x*0.2)%W+W)%W,syp=((s*53)%H);ctx.globalAlpha=0.3+0.6*Math.abs(Math.sin(t+s));ctx.fillStyle=s%5?'#fff':'#9be6ff';ctx.fillRect(sxp,syp,1.6,1.6);}ctx.globalAlpha=1;
    var pgx=W*0.78-camera.x*0.15,pgy=110;ctx.fillStyle='rgba(155,107,255,.5)';ctx.beginPath();ctx.arc(pgx,pgy,40,0,7);ctx.fill();ctx.strokeStyle='rgba(255,210,120,.6)';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(pgx,pgy,62,18,0.4,0,7);ctx.stroke();
  }
}

/* ===== TITLE AMBIENT FLEAS ===== */
function initAmbient(){
  ambient=[];var n=6+Math.random()*2|0;
  for(var i=0;i<n;i++){var f=new Flea(40+Math.random()*Math.max(60,W-120),H-80-Math.random()*60,false,'',randSpec());f.stuck=true;f.onG=true;f.angle=0;f.crawlDir=Math.random()>.5?1:-1;ambient.push(f);}
}
function updateAmbient(dt){
  var groundY=H-58;
  for(var i=0;i<ambient.length;i++){var f=ambient[i];
    if(f.stuck){
      if(Math.random()<0.012)f.crawlDir*=-1;
      f.x+=f.crawlDir*0.55;f.face=f.crawlDir;
      if(f.x<16){f.x=16;f.crawlDir=1;}if(f.x>W-44){f.x=W-44;f.crawlDir=-1;}
      if(Math.random()<0.009){f.vx=f.crawlDir*(4+Math.random()*3);f.vy=-(9+Math.random()*4);f.stuck=false;f.onG=false;f.angle=0;f.sq=0.5;}
      f.la+=dt*0.012;
    }else{
      f.vy+=GRAV*0.6;f.x+=f.vx;f.y+=f.vy;f.vx*=0.99;
      if(f.x<16){f.x=16;f.vx=Math.abs(f.vx);}if(f.x>W-44){f.x=W-44;f.vx=-Math.abs(f.vx);}
      if(f.y+f.h>=groundY){f.y=groundY-f.h;f.vy=0;f.vx=0;f.stuck=true;f.onG=true;f.angle=0;f.sq=0.7;}
      f.la+=dt*0.02;
    }
    f.sq+=(1-f.sq)*0.15;
  }
}
function drawAmbient(){for(var i=0;i<ambient.length;i++)ambient[i].draw(0,0);}

/* ===== CONTROLS ===== */
function getLaunchVec(){
  var px=player.cx-camera.x,py=player.cy-camera.y;
  var dx=aim.x-px,dy=aim.y-py;var d=Math.hypot(dx,dy);var cl=Math.min(d,MAX_DRAG);
  if(d>0){dx=dx/d*cl;dy=dy/d*cl;}
  return {vx:-dx*SLING_POWER,vy:-dy*SLING_POWER,pow:cl/MAX_DRAG};
}
function drawAim(){
  if(!aim.on||!aim.dragging||!player)return;
  var px=player.cx-camera.x,py=player.cy-camera.y;var v=getLaunchVec();
  ctx.save();ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=3;ctx.setLineDash([5,6]);
  ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(aim.x,aim.y);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle=v.pow>.7?'rgba(255,61,181,.9)':'rgba(45,226,255,.85)';ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(px,py,18+v.pow*10,0,7*v.pow);ctx.stroke();
  var tx=player.cx,ty=player.cy,tvx=v.vx,tvy=v.vy;
  for(var i=0;i<32;i++){tvx*=0.985;tvy+=GRAV;var sp=Math.hypot(tvx,tvy);if(sp>PLAYER_MAX){tvx=tvx/sp*PLAYER_MAX;tvy=tvy/sp*PLAYER_MAX;}tx+=tvx;ty+=tvy;var t=i/32,al=0.85*(1-t),dr=5*(1-t*0.5);
    ctx.fillStyle=v.pow>.7?'rgba(255,61,181,'+al+')':'rgba(45,226,255,'+al+')';
    ctx.beginPath();ctx.arc(tx-camera.x,ty-camera.y,dr,0,7);ctx.fill();
    if(tx<0||tx>WORLD_W||ty>WORLD_H)break;}
  ctx.restore();
}
function predictLanding(vx,vy){
  var x=player.cx,y=player.cy;
  for(var i=0;i<260;i++){
    vx*=0.985;vy+=GRAV;var sp=Math.hypot(vx,vy);if(sp>PLAYER_MAX){vx=vx/sp*PLAYER_MAX;vy=vy/sp*PLAYER_MAX;}
    x+=vx;y+=vy;
    if(x<10)return {x:10,y:y};if(x>WORLD_W-10)return {x:WORLD_W-10,y:y};
    if(y<10)return {x:x,y:10};if(y>WORLD_H-60)return {x:x,y:WORLD_H-60};
    for(var k=0;k<platforms.length;k++){var p=platforms[k];if(p.contains(x,y,2))return {x:x,y:(p.kind==='rect'?p.y:y)};}
  }
  return {x:x,y:y};
}
function hnsBlockInput(){if(gameMode!=='hns')return false;if(hnsPhase==='hide')return hnsSeeker===player;if(hnsPhase==='seek')return hnsSeeker!==player;return true;}
function pointerDown(x,y){
  if(editMode){editDown(x,y);return;}
  if(STATE!=='play'||isPaused||!player||playerDead)return;
  if(hnsBlockInput())return;
  if(player.frozen&&Date.now()<player.frozen){flash('Frozen!','#bfefff');return;}
  aim.on=true;aim.dragging=false;aim.x=x;aim.y=y;aim.sx=x;aim.sy=y;aim.st=Date.now();
  touchRipple={x:x,y:y,t:0};
}
function pointerMove(x,y){if(editMode){editMoveTo(x,y);return;}if(!aim.on)return;aim.x=x;aim.y=y;if(Math.hypot(x-aim.sx,y-aim.sy)>14)aim.dragging=true;}
function pointerUp(){
  if(editMode){editUp();return;}
  if(!aim.on||!player){aim.on=false;return;}
  var moved=Math.hypot(aim.x-aim.sx,aim.y-aim.sy),dur=Date.now()-aim.st;
  if(!aim.dragging&&moved<14&&dur<400){
    /* Hide & Seek: seeker taps objects to inspect them */
    if(gameMode==='hns'&&hnsPhase==='seek'&&hnsSeeker===player){
      var wx=aim.x+camera.x,wy=aim.y+camera.y;
      if(hnsInspect(wx,wy)){aim.on=false;aim.dragging=false;return;}
    }
    /* Hide & Seek: player-hider taps a prop during HIDE to preview/change disguise */
    if(gameMode==='hns'&&hnsPhase==='hide'&&hnsSeeker!==player){
      var wxh=aim.x+camera.x,wyh=aim.y+camera.y;
      if(hnsPlayerPickDisguise(wxh,wyh)){aim.on=false;aim.dragging=false;return;}
    }
    tapMove(aim.x,aim.y);
    if(gameMode==='tutorial')tutProgress('tap');
  }
  else if(aim.dragging){var v=getLaunchVec();if(v.pow>0.05){player.launch(v.vx,v.vy);player.face=v.vx>0?1:-1;bump('totalLaunches');if(gameMode==='tutorial')tutProgress('fling');}}
  aim.on=false;aim.dragging=false;
}
function tapMove(sx,sy){
  if(!player.stuck)return;
  var tx=sx+camera.x,ty=sy+camera.y;
  if(Math.hypot(tx-player.cx,ty-player.cy)<12)return;
  var sol=solveLaunch(player.cx,player.cy,tx,ty);
  var sp=Math.hypot(sol.vx,sol.vy),MX=34;if(sp>MX){sol.vx=sol.vx/sp*MX;sol.vy=sol.vy/sp*MX;}
  var land=predictLanding(sol.vx,sol.vy);
  tapMarker={x:land.x,y:land.y,t:0};
  player.launch(sol.vx,sol.vy);player.face=sol.vx>0?1:-1;bump('totalLaunches');
}

/* ===== EDIT / CREATIVE MODE ===== */
function pickEntity(wx,wy){
  for(var i=fleas.length-1;i>=0;i--){var f=fleas[i];var rr=Math.max(f.w,f.h)*0.75;if(Math.hypot(wx-f.cx,wy-f.cy)<rr)return {kind:'flea',obj:f};}
  for(var j=platforms.length-1;j>=3;j--){var p=platforms[j];if(p.contains(wx,wy,6))return {kind:'platform',obj:p};}
  return null;
}
function entityRef(ent){if(ent.kind==='flea')return {x:ent.obj.cx,y:ent.obj.cy};return {x:ent.obj.cenx,y:ent.obj.ceny};}
function deleteEntity(ent){
  if(ent.kind==='flea'){if(ent.obj.isP){flash("Can't delete your Frea!",'#ff3db5');return;}var idx=fleas.indexOf(ent.obj);if(idx>=0){jpfx(ent.obj.cx,ent.obj.cy,ent.obj.col);fleas.splice(idx,1);updScore();flash('Flea removed','#ff3db5');}return;}
  var pi=platforms.indexOf(ent.obj);
  if(pi<3){flash('Walls are locked','#ff3db5');return;}
  ofx(ent.obj.cenx,ent.obj.ceny);platforms.splice(pi,1);
  for(var k=0;k<fleas.length;k++){if(fleas[k].platform===ent.obj){fleas[k].platform=null;fleas[k].stuck=false;fleas[k].onG=false;}}
  flash('Removed','#ff3db5');
}
function editDown(x,y){
  var wx=x+camera.x,wy=y+camera.y,ent=pickEntity(wx,wy);
  if(editTool==='delete'){if(ent)deleteEntity(ent);grabbed=null;grabKind=null;editHover=null;return;}
  if(editTool==='type'){if(ent&&ent.kind==='platform'&&!ent.obj.deco)cyclePType(ent.obj);else if(ent&&ent.obj&&ent.obj.deco)flash('Only platforms have types','#ff3db5');grabbed=null;grabKind=null;return;}
  if(ent){grabbed=ent.obj;grabKind=ent.kind;var r=entityRef(ent);grabOff.x=wx-r.x;grabOff.y=wy-r.y;grabbed.vx=0;grabbed.vy=0;if(grabKind==='flea'){grabbed.stuck=true;grabbed.platform=null;}}
  else{editPan.on=true;editPan.lx=x;editPan.ly=y;}
}
function editMoveTo(x,y){
  var wx=x+camera.x,wy=y+camera.y;
  if(grabbed){
    if(grabKind==='flea'){grabbed.x=wx-grabOff.x-grabbed.w/2;grabbed.y=wy-grabOff.y-grabbed.h/2;grabbed.vx=0;grabbed.vy=0;}
    else{grabbed._shift((wx-grabOff.x)-grabbed.cenx,(wy-grabOff.y)-grabbed.ceny);grabbed.vx=0;grabbed.vy=0;}
  }else if(editPan.on){camera.x-=(x-editPan.lx);camera.y-=(y-editPan.ly);editPan.lx=x;editPan.ly=y;camera.x=Math.max(0,Math.min(WORLD_W-W,camera.x));camera.y=Math.max(0,Math.min(WORLD_H-H,camera.y));}
  else{editHover=pickEntity(wx,wy);}
}
function editUp(){
  editPan.on=false;
  if(grabbed){if(grabKind==='flea'){grabbed.stuck=false;grabbed.onG=false;}grabbed.vx=0;grabbed.vy=0;}
  grabbed=null;grabKind=null;
}
function entityOutline(obj,kind,col){
  ctx.save();ctx.strokeStyle=col;ctx.lineWidth=2.4;ctx.shadowColor=col;ctx.shadowBlur=12;ctx.globalAlpha=.95;ctx.lineCap='round';
  if(kind==='flea'){ctx.beginPath();ctx.arc(obj.cx-camera.x,obj.cy-camera.y,Math.max(obj.w,obj.h)*0.74,0,7);ctx.stroke();}
  else{var p=obj;if(p.kind==='rect'){ctx.beginPath();ctx.roundRect(p.x-camera.x-3,p.y-camera.y-3,p.w+6,p.h+6,8);ctx.stroke();}
    else if(p.kind==='circle'){ctx.beginPath();ctx.arc(p.x-camera.x,p.y-camera.y,p.r+4,0,7);ctx.stroke();}
    else{ctx.beginPath();p.pts.forEach(function(pt,i){var px=pt[0]-camera.x,py=pt[1]-camera.y;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();ctx.stroke();}}
  ctx.restore();
}
function drawStatusFX(){
  for(var i=0;i<fleas.length;i++){var f=fleas[i];
    if(f.frozen&&Date.now()<f.frozen){var x=f.cx-camera.x,y=f.cy-camera.y,s=Math.max(f.w,f.h)*0.95;
      ctx.save();ctx.fillStyle='rgba(180,240,255,.28)';ctx.strokeStyle='rgba(220,250,255,.85)';ctx.lineWidth=2;
      ctx.beginPath();ctx.roundRect(x-s,y-s,s*2,s*2,6);ctx.fill();ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-s*0.4,y-s);ctx.lineTo(x-s*0.4,y+s);ctx.moveTo(x-s,y-s*0.3);ctx.lineTo(x+s,y-s*0.3);ctx.stroke();
      ctx.restore();}
  }
}
function drawEditOverlay(){
  if(editHover&&!grabbed){entityOutline(editHover.obj,editHover.kind,editTool==='delete'?'#ff3db5':'#2de2ff');}
  if(grabbed){entityOutline(grabbed,grabKind,'#c6ff3d');}
}
function setEditTool(t){editTool=t;['move','type','delete'].forEach(function(k){var b=document.getElementById('tool-'+k);if(b)b.classList.toggle('active',t===k);});editHover=null;}
function cyclePType(p){var pi=platforms.indexOf(p);if(pi<3){flash('Walls are locked','#ff3db5');return;}var seq=['normal'].concat(PTYPES),cur=p.ptype||'normal',idx=(seq.indexOf(cur)+1)%seq.length;p.ptype=seq[idx];ofx(p.cenx,p.ceny);flash('Type: '+p.ptype,'#c6ff3d');}
function enterEdit(){
  if(STATE!=='play'||gameMode!=='zen')return;
  editMode=true;grabbed=null;grabKind=null;editHover=null;setEditTool('move');
  document.getElementById('zen-dock').classList.remove('show');
  document.getElementById('zen-fab').classList.remove('show');
  showEmoteUI(false);
  document.getElementById('edit-bar').classList.add('show');
  document.getElementById('edit-hint').classList.add('show');
  flash('Edit Mode — game paused','#2de2ff');
}
function exitEdit(){
  editMode=false;grabbed=null;grabKind=null;editHover=null;
  document.getElementById('edit-bar').classList.remove('show');
  document.getElementById('edit-hint').classList.remove('show');
  if(STATE==='play'&&gameMode==='zen'){document.getElementById('zen-fab').classList.add('show');if(dockOpen)document.getElementById('zen-dock').classList.add('show');showEmoteUI(true);}
  flash('Resumed','#c6ff3d');
}
C.addEventListener('touchstart',function(e){e.preventDefault();var t=e.changedTouches[0];pointerDown(t.clientX,t.clientY);},{passive:false});
C.addEventListener('touchmove',function(e){e.preventDefault();var t=e.changedTouches[0];pointerMove(t.clientX,t.clientY);},{passive:false});
C.addEventListener('touchend',function(e){e.preventDefault();pointerUp();},{passive:false});
C.addEventListener('mousedown',function(e){if(e.target.closest('#hud'))return;pointerDown(e.clientX,e.clientY);});
window.addEventListener('mousemove',function(e){pointerMove(e.clientX,e.clientY);});
window.addEventListener('mouseup',pointerUp);
document.addEventListener('keydown',function(e){
  if(editMode){if(e.code==='Escape')exitEdit();else if(e.code==='KeyV')setEditTool('move');else if(e.code==='KeyX')setEditTool('delete');return;}
  if(STATE!=='play'||isPaused||!player||playerDead)return;
  if(e.code==='ArrowLeft'||e.code==='KeyA'){player.launch(-13,-5);player.face=-1;}
  if(e.code==='ArrowRight'||e.code==='KeyD'){player.launch(13,-5);player.face=1;}
  if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'){player.launch(player.stuck?0:player.vx,-17);e.preventDefault();}
  if(e.code==='Escape')togglePause();
});
window.addEventListener('resize',function(){rsz();if(STATE==='play'||STATE==='countdown')worldBounds();if(STATE==='title')initAmbient();});

/* ===== LOOP ===== */
var lt=0,fid=null;
function loop(ts){
  var dt=Math.min(ts-lt,50);lt=ts;
  fid=requestAnimationFrame(loop);
  if(isPaused)return;
  if(STATE==='countdown'){
    countdown-=dt/1000;var ci=Math.ceil(countdown);var cd=document.getElementById('countdown');
    if(ci!==lastCd){lastCd=ci;if(ci>0)cd.innerHTML='<span class="cd-num">'+ci+'</span>';}
    if(countdown<=0){
      STATE='play';cd.innerHTML='<span class="cd-num go">GO!</span>';
      setTimeout(function(){if(STATE!=='countdown')cd.style.display='none';},700);
      if(gameMode==='survival')assignOrbToRandom();
      if(gameMode==='hns'){
        if(hnsSeeker===player){var ov=document.getElementById('hns-overlay');if(ov)ov.classList.add('show');}
        else{var em=HNS_EMOJI[player.hideType]||'📦';flash('You are a HIDER! Move & hide — you become '+em,'#39ff7a');}
      }
    }
  }
  ctx.clearRect(0,0,W,H);
  if(STATE==='title'){
    pal=LC[1];drawBG();updateAmbient(dt);drawAmbient();return;
  }
  var camF=(gameMode==='hns'&&hnsPhase==='seek'&&hnsSeeker)?hnsSeeker:player;
  if(camF&&!editMode){camera.x+=(camF.cx-W/2-camera.x)*0.1;camera.y+=(camF.cy-H/2-camera.y)*0.1;
    camera.x=Math.max(0,Math.min(WORLD_W-W,camera.x));camera.y=Math.max(0,Math.min(WORLD_H-H,camera.y));}
  if(camera.shake>0){camera.x+=(Math.random()-.5)*camera.shake;camera.y+=(Math.random()-.5)*camera.shake;camera.shake*=0.85;if(camera.shake<.3)camera.shake=0;}
  drawBG();
  if(STATE==='play'&&!editMode){for(var i=0;i<platforms.length;i++)platforms[i].update(dt);if(gameMode==='zen')updateDecoPhysics(dt);carryStuckFleas();}
  for(var i=0;i<platforms.length;i++)platforms[i].draw(camera.x,camera.y);
  if(STATE==='play'&&!editMode){
    STATS.playMs+=dt;
    chatterTimer+=dt;
    if(chatterTimer>2600+Math.random()*2600){chatterTimer=0;var cand=fleas.filter(function(f){return !f.isP&&!f.hidden&&f!==lastSpeaker&&(!f._sayCD||Date.now()>f._sayCD);});if(cand.length){var sp=cand[Math.random()*cand.length|0];lastSpeaker=sp;say(sp,modePhrase(sp),2200);}}
    /* proximity chatter: AI reacts when player is close */
    if(player&&!playerDead){proxTimer=(proxTimer||0)+dt;if(proxTimer>900){proxTimer=0;for(var pi=0;pi<fleas.length;pi++){var pf=fleas[pi];if(pf.isP||pf.hidden)continue;if(pf._sayCD&&Date.now()<pf._sayCD)continue;if(Math.hypot(pf.cx-player.cx,pf.cy-player.cy)<70&&Math.random()<0.5){maybeSay(pf,EVENT_LINES.nearPlayer[Math.random()*EVENT_LINES.nearPlayer.length|0],1700);break;}}}}
    for(var i=0;i<fleas.length;i++){if(!fleas[i].isP)fleas[i].aiUpdate(dt);fleas[i].update(dt);}
    resolveCollisions();
    if(gameMode==='classic'||gameMode==='survival'||gameMode==='race'){if(orb)orb.update(dt);holdTick(dt);checkPickup();checkSteal();}
    else if(gameMode==='tag'){tagTick(dt);}
    else if(gameMode==='hns'){hnsTick(dt);}
    else if(gameMode==='tutorial'){tutorialTick(dt);}
    hudT+=dt;if(hudT>240){hudT=0;if(gameMode==='race'||gameMode==='classic'||gameMode==='tag'||gameMode==='hns')updScore();}
  }else if(!editMode){
    for(var i=0;i<fleas.length;i++)fleas[i].update(dt);
  }
  if(orb&&(gameMode==='classic'||gameMode==='survival'||gameMode==='race'||gameMode==='tutorial'))orb.draw();
  drawIndicators();
  drawOrbIndicator();
  drawTapMarker(dt);drawTouchRipple(dt);drawAim();
  if(spotMe&&player&&!editMode&&gameMode!=='hns'){
    for(var i=0;i<fleas.length;i++){if(fleas[i]!==player)fleas[i].draw(camera.x,camera.y);}
    drawSpotScrim();drawSpotRing();
    player.draw(camera.x,camera.y);
  }else{
    for(var i=0;i<fleas.length;i++)fleas[i].draw(camera.x,camera.y);
  }
  updateEmotes(dt);drawEmotes();
  drawStatusFX();
  if(editMode)drawEditOverlay();
  drawFX();
  drawHnsHidePreview();
  drawHnsFog();
}

/* ===== START / FLOW ===== */
function specOf(f){return {color:f.color||f.col,eyeColor:f.eyeColor,shape:f.shape,size:f.size,pattern:f.pattern,eyes:f.eyes,ant:f.ant,legs:f.legs,legStyle:f.legStyle,legShape:f.legShape,hat:f.hat,wings:f.wings,trail:f.trail,aura:f.aura,cheek:f.cheek||'on',mouth:f.mouth,brows:f.brows,glasses:f.glasses,cape:f.cape,accessory:f.accessory,secondary:f.secondary,hair:f.hair,hairColor:f.hairColor};}
function makeAI(name,x,y){
  return new Flea(x,y,false,name,{
    color:'hsl('+(Math.random()*360|0)+',90%,66%)',eyeColor:Math.random()<.5?'#101018':randHex(),
    shape:pick(OPT.shape),size:pick(OPT.size),pattern:pick(OPT.pattern),eyes:pick(OPT.eyes),
    ant:pick(OPT.ant),legs:pick(OPT.legs),legStyle:Math.random()<.5?'default':pick(OPT.legStyle),legShape:Math.random()<.55?'default':pick(OPT.legShape),
    hat:Math.random()<.5?'none':pick(OPT.hat),wings:Math.random()<.5?'none':pick(OPT.wings),
    trail:Math.random()<.4?pick(OPT.trail):'none',aura:Math.random()<.4?pick(OPT.aura):'none',
    mouth:pick(OPT.mouth),brows:Math.random()<.4?pick(OPT.brows):'none',
    glasses:Math.random()<.2?pick(OPT.glasses):'none',cape:Math.random()<.15?pick(OPT.cape):'none',
    accessory:Math.random()<.3?pick(OPT.accessory):'none',cheek:pick(OPT.cheek),secondary:randHex()
  });
}
var AI_NAMES=["Pochi","Tama","Mochi","Koko","Lulu","Mimi","Piko","Yuki","Chibi","Rini","Hana","Kira","Taro","Jiro","Sora","Haru","Minto","Momo","Niko","Uni","Bao","Pix","Zuzu","Dot","Fizz","Goro","Hopi","Iro","Juju","Kibo"];
function clearTimers(){if(timerIv){clearInterval(timerIv);timerIv=null;}if(winIv){clearInterval(winIv);winIv=null;}if(prevIv){clearInterval(prevIv);prevIv=null;}}
/* ===== TUTORIAL MODE ===== */
var TUT_STEPS=[
 {ico:'👆',ttl:'Tap to Hop',txt:'Tap anywhere and your Frea hops there. Try a few taps!',goal:'tap',need:3,setup:function(){tutClearProps();}},
 {ico:'🎯',ttl:'Drag to Fling',txt:'Press near your Frea, drag back, then release to slingshot it far!',goal:'fling',need:2,setup:function(){tutClearProps();}},
 {ico:'✨',ttl:'Catch the Orb',txt:'Reach the glowing orb to grab it. Tap or fling your way over!',goal:'orb',need:1,setup:function(){tutClearProps();tutAddOrb(WORLD_W*0.72,WORLD_H-150);}},
 {ico:'🧱',ttl:'Use Platforms',txt:'Leap up onto the floating platform to reach the orb high above!',goal:'orb',need:1,setup:function(){tutClearProps();tutAddPlat(WORLD_W*0.56-95,WORLD_H*0.58,190,0);tutAddOrb(WORLD_W*0.56,WORLD_H*0.58-44);}},
 {ico:'🌀',ttl:'Moving Platforms',txt:'Some platforms slide around — hop onto one and ride it up to the orb!',goal:'orb',need:1,setup:function(){tutClearProps();tutAddPlat(WORLD_W*0.5-85,WORLD_H*0.64,170,150);tutAddOrb(WORLD_W*0.5,WORLD_H*0.42);}}
];
var tut={step:0,prog:0},tutPrevMode='classic';
function syncModeChips(){document.querySelectorAll('.mode-chip').forEach(function(c){c.classList.toggle('active',c.dataset.mode===gameMode);});}
function tutClearProps(){orb=null;orbHolder=null;if(platforms.length>3)platforms.length=3;}
function tutAddPlat(x,y,w,mvRange){var p=new Platform({kind:'rect',x:x,y:y,w:w,h:18});p._kind='rect';if(mvRange){p.mv={axis:'x',range:mvRange,speed:0.0016};}platforms.push(p);return p;}
function tutAddOrb(x,y){orb=new Orb(x,y);orb.x=x;orb.y=y;orb.vx=0;orb.vy=0;}
function tutResetPlayer(){if(!player)return;player.x=WORLD_W*0.3-player.w/2;player.y=WORLD_H-60-player.h-2;player.vx=0;player.vy=0;player.stuck=true;player.hasOrb=false;player.angle=0;player.platform=platforms[0]||null;player.onG=true;camera.x=0;camera.y=0;}
function tutBegin(){tut.step=0;tutLoadStep(0);}
function tutLoadStep(i){
  tut.step=i;tut.prog=0;var s=TUT_STEPS[i];if(!s)return;
  s.setup();tutResetPlayer();
  var dots='';for(var d=0;d<TUT_STEPS.length;d++){dots+='<i class="'+(d<i?'done':(d===i?'on':''))+'"></i>';}
  var de=document.getElementById('tut-dots');if(de)de.innerHTML=dots;
  document.getElementById('tut-ico').textContent=s.ico;
  document.getElementById('tut-ttl').textContent=s.ttl;
  document.getElementById('tut-txt').textContent=s.txt;
  document.getElementById('tut-panel').classList.add('show');
  document.getElementById('tval').textContent=(i+1)+'/'+TUT_STEPS.length;
}
function tutProgress(kind){
  if(gameMode!=='tutorial'||STATE!=='play')return;
  var s=TUT_STEPS[tut.step];if(!s||s.goal!==kind)return;
  tut.prog++;
  if((s.goal==='tap'||s.goal==='fling')&&tut.prog<s.need){var left=s.need-tut.prog;document.getElementById('tut-txt').textContent=s.txt+'  ('+left+' more)';}
  if(tut.prog>=s.need)tutAdvance();
}
function tutAdvance(){
  flash(pick(['Nice!','Great!','Perfect!','You got it!']),'#39ff7a');camera.shake=4;
  if(player)jpfx(player.cx,player.cy-20,'#39ff7a');
  if(tut.step>=TUT_STEPS.length-1){tutFinish();return;}
  var nx=tut.step+1;document.getElementById('tut-panel').classList.remove('show');
  setTimeout(function(){if(gameMode==='tutorial'&&STATE==='play')tutLoadStep(nx);},700);
}
function tutFinish(){
  document.getElementById('tut-panel').classList.remove('show');
  bump('tutorialsDone');
  document.getElementById('tut-done').classList.add('show');
  tutConfetti();
}
function tutConfetti(){var box=document.getElementById('tut-done-confetti');if(!box)return;box.innerHTML='';var cols=['#2de2ff','#ff3db5','#c6ff3d','#ffd23d','#9b6bff','#39ff7a'];for(var i=0;i<80;i++){var d=document.createElement('div');d.className='confetti-piece';d.style.left=(Math.random()*100)+'%';d.style.background=cols[i%cols.length];d.style.width=(6+Math.random()*6)+'px';d.style.height=(10+Math.random()*9)+'px';d.style.animationDuration=(1.8+Math.random()*1.8)+'s';d.style.animationDelay=(Math.random()*0.5)+'s';box.appendChild(d);}setTimeout(function(){if(box)box.innerHTML='';},4600);}
function tutorialTick(dt){
  if(orb){orb.an+=dt*0.005;orb.pu+=dt*0.01;orbAng+=dt*0.004;orbPulse+=dt*0.008;
    if(player&&!player.hidden&&Math.hypot(player.cx-orb.x,player.cy-orb.y)<player.w/2+orb.r+8){
      ofx(orb.x,orb.y);camera.shake=6;jpfx(orb.x,orb.y,'#ffd23d');bump('orbsCaptured');orb=null;tutProgress('orb');
    }
  }
}
function startTutorial(){closeSettings();closeCust();tutPrevMode=(gameMode!=='tutorial')?gameMode:tutPrevMode;gameMode='tutorial';startGame();}

function startGame(){
  closeSettings();closeCust();clearTimers();
  isPaused=false;playerDead=false;tagSeeded=false;tagTimer=0;roundNum=1;hudT=0;capTimer=0;
  chooseLayout();worldBounds();buildLevel();
  fleas=[];parts=[];sparks=[];orbHolder=null;fuse=fuseMax;aim.on=false;aim.dragging=false;tapMarker=null;touchRipple=null;
  countdown=3.0;lastCd=3;camera.shake=0;
  var maxOpp=(gameMode==='tutorial')?0:((gameMode==='zen'||gameMode==='tag')?Math.min(configAi,29):configAi);
  var total=1+maxOpp,bottomY=WORLD_H-60,seg=WORLD_W/(total+1);
  var me=saved.find(function(f){return f.id===activeId;})||saved[0];
  player=new Flea(seg-13,bottomY-30,true,me.name,me);fleas.push(player);
  for(var i=0;i<maxOpp;i++)fleas.push(makeAI(AI_NAMES[i%AI_NAMES.length],seg*(i+2)-13,bottomY-30));
  var tb=document.getElementById('tbox');tb.classList.remove('danger');
  var showAdd=(gameMode==='zen');
  editMode=false;dockOpen=true;
  document.getElementById('edit-bar').classList.remove('show');
  document.getElementById('edit-hint').classList.remove('show');
  document.getElementById('add-flea-btn').style.display=showAdd?'flex':'none';
  document.getElementById('remove-flea-btn').style.display=showAdd?'flex':'none';
  var zfab=document.getElementById('zen-fab'),zdock=document.getElementById('zen-dock');
  zfab.classList.toggle('show',showAdd);zfab.classList.toggle('open',showAdd);
  zdock.classList.toggle('show',showAdd);zdock.classList.remove('collapsed');
  emotePops=[];showEmoteUI(showAdd);
  if(showAdd){syncEnvButtons();spawnEnvProps();STATS.peakZenFleas=Math.max(STATS.peakZenFleas,fleas.length);saveStats();}
  bump('matchesPlayed');bumpMode('matchesByMode',gameMode);
  if(gameMode==='classic'){orb=new Orb(WORLD_W/2,100);orb.respawn();document.getElementById('timer-lbl').textContent='Time';document.getElementById('tval').textContent=matchTime;}
  else if(gameMode==='race'){orb=new Orb(WORLD_W/2,80);var hiP=null;for(var pi=3;pi<platforms.length;pi++){if(platforms[pi].bw>=WORLD_W*0.6)continue;if(!hiP||platforms[pi].by<hiP.by)hiP=platforms[pi];}if(hiP){var htp=hiP.topPoint();orb.x=Math.max(orb.r+24,Math.min(WORLD_W-orb.r-24,htp.x));orb.y=htp.y-orb.r-16;}else{orb.x=WORLD_W/2;orb.y=100;}orb.vy=0;orb.vx=0;document.getElementById('timer-lbl').textContent='Race';document.getElementById('tval').textContent='▲';}
  else if(gameMode==='survival'){orb=new Orb(WORLD_W/2,100);orb.respawn();document.getElementById('timer-lbl').textContent='Fuse';document.getElementById('tval').textContent='—';}
  else if(gameMode==='tag'){orb=null;document.getElementById('timer-lbl').textContent='Infect In';document.getElementById('tval').textContent='10';}
  else if(gameMode==='hns'){orb=null;setupHideSeek();hnsSeekLeft=seekTime*1000;document.getElementById('timer-lbl').textContent='Hide';document.getElementById('tval').textContent=Math.ceil(HNS_HIDE_MS/1000);var hcEl=document.getElementById('hns-count');if(hcEl)hcEl.textContent=Math.ceil(HNS_HIDE_MS/1000);}
  else if(gameMode==='tutorial'){orb=null;document.getElementById('timer-lbl').textContent='Step';document.getElementById('tval').textContent='1/'+TUT_STEPS.length;}
  else{orb=null;document.getElementById('timer-lbl').textContent='Zen';document.getElementById('tval').textContent='∞';}
  document.getElementById('overlay').classList.add('gone');
  document.getElementById('pause-overlay').classList.remove('show');
  document.getElementById('end-view').style.display='none';
  document.getElementById('title-view').style.display='flex';
  document.getElementById('hud').style.display='flex';
  var _hl=document.querySelector('.hud-left');if(_hl)_hl.style.display=(gameMode==='tutorial')?'none':'flex';
  applyScoresVis();
  var cd=document.getElementById('countdown');
  if(gameMode==='zen'||gameMode==='tutorial'){cd.style.display='none';STATE='play';updScore();}
  else{cd.style.display='block';cd.innerHTML='<span class="cd-num">3</span>';STATE='countdown';updScore();}
  if(gameMode==='tutorial')tutBegin();
  var left=matchTime;
  timerIv=setInterval(function(){
    if(STATE!=='play'||isPaused)return;
    if(gameMode==='classic'){left--;document.getElementById('tval').textContent=left;if(left<=10)document.getElementById('tbox').classList.add('danger');if(left<=0)endGame(leader());}
  },1000);
  lt=performance.now();if(fid)cancelAnimationFrame(fid);fid=requestAnimationFrame(loop);
}

function spawnEnvProps(){
  /* a few themed collidable props per environment */
  var sets={
    forest:['plant','mushroom','plant','crate','mushroom'],
    beach:['beachball','crate','beachball'],
    living:['couch','tv','lamp','plant'],
    space:['crate','crate','balloon'],
    neon:[]
  };
  var list=sets[zenEnv]||[];
  for(var i=0;i<list.length;i++){
    var t=list[i];var px=120+Math.random()*(WORLD_W-240),py=WORLD_H-120-Math.random()*120;
    var p;
    if(t==='beachball'||t==='balloon'){p=new Platform({kind:'circle',x:px,y:py,r:t==='balloon'?16:22});p.deco=t;p.bob=Math.random()*6;}
    else{var dims={couch:[86,34],lamp:[16,52],plant:[34,46],tv:[64,42],crate:[40,40],mushroom:[40,38]}[t]||[44,40];p=new Platform({kind:'rect',x:px-dims[0]/2,y:py,w:dims[0],h:dims[1]});p.deco=t;}
    p.decoCol='hsl('+(Math.random()*360|0)+',75%,60%)';p._envprop=true;
    if(DECO_PHYS[t]){p.phys=DECO_PHYS[t];p.vx=(Math.random()-.5)*1.5;p.vy=0;}
    platforms.push(p);
  }
}
/* ===== HIDE & SEEK MODE ===== */
var HNS_SETS={
  forest:['crate','mushroom','plant','rock','mushroom','plant','crate','rock'],
  beach:['crate','rock','beachball','plant','rock','beachball','crate'],
  living:['couch','tv','lamp','plant','crate','couch','tv','lamp'],
  space:['crate','rock','balloon','crate','rock','balloon','lamp']
};
var hnsPool=HNS_SETS.forest;
function makeProp(type,cx,gy){
  var p;
  if(type==='rock'){var rr=20+Math.random()*8;p=new Platform({kind:'circle',x:cx,y:gy-rr,r:rr});p.deco='rock';}
  else if(type==='balloon'||type==='beachball'){var r=type==='balloon'?16:22;p=new Platform({kind:'circle',x:cx,y:gy-r,r:r});p.deco=type;p.bob=Math.random()*6;}
  else{var dims={couch:[86,34],lamp:[16,52],plant:[34,46],tv:[64,42],crate:[40,40],mushroom:[40,38]}[type]||[44,40];p=new Platform({kind:'rect',x:cx-dims[0]/2,y:gy-dims[1],w:dims[0],h:dims[1]});p.deco=type;}
  p.decoCol='hsl('+(Math.random()*360|0)+',72%,58%)';
  return p;
}
function propCenter(p){if(p.kind==='circle')return {x:p.x,y:p.y};return {x:p.bx+p.bw/2,y:p.by+p.bh/2};}
function overlapsProp(f,p){var pad=f.w*0.5+9;return f.cx>p.bx-pad&&f.cx<p.bx+p.bw+pad&&f.cy>p.by-pad&&f.cy<p.by+p.bh+pad;}
function hnsSpotR(){return Math.max(150,Math.min(250,Math.min(W,H)*0.3));}
function hnsSpots(){
  var spots=[];
  for(var i=3;i<platforms.length;i++){var p=platforms[i];if(p.deco||p.wall||p.ptype==='lava')continue;var tp=p.topPoint();if(tp.y<80||tp.y>WORLD_H-40)continue;spots.push({x:Math.max(60,Math.min(WORLD_W-60,tp.x)),y:tp.y});}
  var rows=[WORLD_H-60,WORLD_H-60];for(var rr=0;rr<rows.length;rr++)for(var g=0;g<26;g++)spots.push({x:90+Math.random()*(WORLD_W-180),y:rows[rr]});
  for(var s=spots.length-1;s>0;s--){var r=Math.random()*(s+1)|0;var tmp=spots[s];spots[s]=spots[r];spots[r]=tmp;}
  return spots;
}
var _hnsSpots=[],_hnsUsed=[];
function hnsTakeSpot(minD){for(var i=0;i<_hnsSpots.length;i++){var ok=true;for(var u=0;u<_hnsUsed.length;u++){if(Math.hypot(_hnsUsed[u].x-_hnsSpots[i].x,_hnsUsed[u].y-_hnsSpots[i].y)<minD){ok=false;break;}}if(ok){var sp=_hnsSpots.splice(i,1)[0];_hnsUsed.push(sp);return sp;}}var f=_hnsSpots.length?_hnsSpots.shift():{x:90+Math.random()*(WORLD_W-180),y:WORLD_H-60};_hnsUsed.push(f);return f;}
/* nearest reachable hide spot to a flea (used for anti-stuck relocation during HIDE) */
function hnsNearestSpot(f){var sp=hnsSpots(),best=null,bd=1e9;for(var i=0;i<sp.length;i++){var dd=Math.hypot(sp[i].x-f.cx,sp[i].y-f.cy);if(dd>60&&dd<bd){bd=dd;best=sp[i];}}return best;}
function disguiseHider(f,spot){
  if(f.hidden||f.found)return;
  var type=f.hideType||hnsPool[Math.random()*hnsPool.length|0];
  var gx,gy;
  if(spot){gx=spot.x;gy=spot.y;}else{gx=f.cx;gy=f.y+f.h;}
  var prop=makeProp(type,gx,gy);prop._hnsHider=f;
  var c=propCenter(prop);
  f.hidden=true;f.stuck=true;f.vx=0;f.vy=0;f.x=c.x-f.w/2;f.y=c.y-f.h/2;
  platforms.push(prop);f._disguised=true;
  jpfx(c.x,c.y,f.col);
}
function setupHideSeek(){
  hnsPhase='hide';hnsHideLeft=HNS_HIDE_MS;hnsFound=0;hnsWrong=0;hnsDecoyMsgCD=0;
  var _sq=(location.search.match(/[?&]hnsseek=(\d+)/)||[])[1];if(_sq)seekTime=+_sq;
  hnsTheme=['forest','beach','living','space'][Math.random()*4|0];
  hnsPool=HNS_SETS[hnsTheme]||HNS_SETS.forest;
  /* choose seeker: ~50% player, else a random AI (debug override via ?hnsrole=) */
  var ais=fleas.filter(function(f){return !f.isP;});
  var _hnsForce=(location.search.match(/[?&]hnsrole=(seeker|hider)/)||[])[1];
  if(_hnsForce==='seeker'||(!ais.length)){hnsSeeker=player;}
  else if(_hnsForce==='hider'){hnsSeeker=ais[Math.random()*ais.length|0];}
  else if(Math.random()<0.5){hnsSeeker=player;}else{hnsSeeker=ais[Math.random()*ais.length|0];}
  var hiders=fleas.filter(function(f){return f!==hnsSeeker;});
  hnsTotal=hiders.length;
  _hnsSpots=hnsSpots();_hnsUsed=[];
  /* assign each hider a spot + object; AI hiders will scurry there, player picks their own */
  for(var h=0;h<hiders.length;h++){
    var f=hiders[h];f.hnsRole='hider';f.found=false;f.hidden=false;f._disguised=false;f.followUntil=0;f.fleeUntil=0;f._seekTarget=null;
    f.hideType=hnsPool[Math.random()*hnsPool.length|0];f._previewDisguise=f.hideType;
    f.lastStuckPos={x:f.x,y:f.y,t:Date.now()};
    f.hideSpot=hnsTakeSpot(120);
  }
  /* park the seeker in a corner */
  hnsSeeker.hnsRole='seeker';hnsSeeker.found=false;hnsSeeker.hidden=false;hnsSeeker._seekTarget=null;
  hnsSeeker.x=WORLD_W/2-hnsSeeker.w/2;hnsSeeker.y=WORLD_H-60-hnsSeeker.h-4;hnsSeeker.vx=0;hnsSeeker.vy=0;hnsSeeker.stuck=true;
  /* scatter plentiful decoy props */
  var decoys=Math.min(30,hiders.length*2+12);
  for(var d=0;d<decoys;d++){
    var sp2=hnsTakeSpot(90),type2=hnsPool[Math.random()*hnsPool.length|0];
    var prop2=makeProp(type2,sp2.x,sp2.y);prop2._hnsReal=true;
    platforms.push(prop2);
  }
}
function updHnsHUD(){
  var tv=document.getElementById('tval'),tb=document.getElementById('tbox'),lb=document.getElementById('timer-lbl');
  if(hnsPhase==='seek'){lb.textContent='Seek';var s=Math.max(0,Math.ceil(hnsSeekLeft/1000));tv.textContent=s;tb.classList.toggle('danger',s<=10);}
  else{lb.textContent='Hide';tv.textContent=Math.max(0,Math.ceil(hnsHideLeft/1000));tb.classList.remove('danger');}
}
function revealHider(p){
  var f=p._hnsHider;if(!f||f.found)return;
  var c=propCenter(p);
  f.x=c.x-f.w/2;f.y=c.y-f.h/2;f.hidden=false;f._disguised=false;f.stuck=true;f.vx=0;f.vy=0;
  f.found=true;
  var idx=platforms.indexOf(p);if(idx>=0)platforms.splice(idx,1);
  jpfx(c.x,c.y,f.col);jpfx(c.x,c.y,'#39ff7a');camera.shake=6;
  hnsFound++;if(hnsSeeker&&hnsSeeker.isP)bump('hnsFinds');
  var who=(hnsSeeker&&hnsSeeker.isP)?'You found':(hnsSeeker.name+' found');
  flash(who+' '+f.name+'!  ('+hnsFound+'/'+hnsTotal+')','#39ff7a');
  maybeSay(f,pick(EVENT_LINES.hnsFound),1600);
  updHnsHUD();updScore();
  if(hnsFound>=hnsTotal){flash('ALL HIDERS FOUND!','#39ff7a');hnsEnd(true);}
}
function wrongGuess(p){
  if(p)p._inspected=true;
  hnsWrong++;camera.shake=8;
  var who=(hnsSeeker&&hnsSeeker.isP)?'You':(hnsSeeker?hnsSeeker.name:'Seeker');
  flash(who+' guessed wrong!  ('+hnsWrong+'/5)','#ff3db5');
  updScore();
  if(hnsWrong>=5){flash('5 wrong guesses — hiders win!','#ff3db5');hnsEnd(false);}
}
function bestHider(){for(var i=0;i<fleas.length;i++){if(fleas[i]!==hnsSeeker&&(fleas[i].hidden||!fleas[i].found))return fleas[i];}return fleas.find(function(f){return f!==hnsSeeker;})||player;}
function hnsEnd(seekerWon){
  if(STATE!=='play')return;
  var playerIsSeeker=(hnsSeeker===player);
  var escaped=fleas.filter(function(f){return f!==hnsSeeker&&!f.found;});
  hnsEndInfo={seekerWon:seekerWon,escaped:escaped};
  var winner=seekerWon?hnsSeeker:(playerIsSeeker?bestHider():player);
  endGame(winner);
}
function hnsInspect(wx,wy){
  for(var j=platforms.length-1;j>=3;j--){var p=platforms[j];if(!p.deco)continue;
    if(p.contains(wx,wy,10)){
      var c=propCenter(p),dSeek=Math.hypot(c.x-hnsSeeker.cx,c.y-hnsSeeker.cy);
      if(dSeek>hnsSpotR()+30)return false; /* too far — let it move toward instead */
      if(p._hnsHider){revealHider(p);}
      else if(p._hnsReal){wrongGuess(p);}
      return true;
    }
  }
  return false;
}
/* Player-hider: tap any prop during HIDE to adopt that object as your disguise.
   You keep moving freely and can re-tap other props to change it until seek begins. */
function hnsPlayerPickDisguise(wx,wy){
  var picked=null;
  for(var j=platforms.length-1;j>=3;j--){var p=platforms[j];if(!p.deco)continue;
    if(p.contains(wx,wy,16)){picked=p.deco;break;}
  }
  if(!picked)return false;
  player.hideType=picked;player._previewDisguise=picked;
  var em=HNS_EMOJI[picked]||'📦';
  flash('Disguise set: '+em+'  (tap another to change)','#39ff7a');
  jpfx(player.cx,player.cy,'#39ff7a');
  return true;
}
function pickSeekTarget(f){
  var hiders=[],all=[];
  for(var i=3;i<platforms.length;i++){var p=platforms[i];if(!p.deco||p._inspected)continue;var c=propCenter(p);var d=Math.hypot(c.x-f.cx,c.y-f.cy);var e={p:p,c:c,d:d};all.push(e);if(p._hnsHider)hiders.push(e);}
  if(!all.length)return null;
  var arr=(hiders.length&&Math.random()<0.6)?hiders:all;
  arr.sort(function(a,b){return a.d-b.d;});
  return arr[0];
}
function hnsTick(dt){
  var playerIsSeeker=(hnsSeeker===player);
  if(hnsPhase==='hide'){
    hnsHideLeft-=dt;updHnsHUD();
    if(playerIsSeeker){var num=document.getElementById('hns-count');if(num)num.textContent=Math.max(0,Math.ceil(hnsHideLeft/1000));}
    /* settle AI hiders that reached their spot or are running out of time */
    var force=hnsHideLeft<6000;
    for(var i=0;i<fleas.length;i++){var f=fleas[i];if(f===hnsSeeker||f.isP||f.hidden||f.found)continue;
      if(!f.hideSpot)f.hideSpot=hnsTakeSpot(90);
      var near=Math.hypot(f.cx-f.hideSpot.x,f.cy-f.hideSpot.y)<58;
      /* anti-stuck liveness: if flailing far from its spot too long, adopt a nearer reachable spot so it keeps searching */
      if(!near&&!force){
        var idle=Date.now()-((f.lastStuckPos&&f.lastStuckPos.t)||Date.now());
        if(idle>1900){var ns=hnsNearestSpot(f);if(ns){f.hideSpot=ns;f.lastStuckPos={x:f.x,y:f.y,t:Date.now()};}}
      }
      /* always snap to the assigned spot when disguising so hiders spread out cleanly */
      if((near&&f.stuck)||force)disguiseHider(f,f.hideSpot);
    }
    if(hnsHideLeft<=0){
      /* fallback: any remaining hider becomes an object at its spot immediately */
      for(var k=0;k<fleas.length;k++){var g=fleas[k];if(g===hnsSeeker||g.hidden||g.found)continue;disguiseHider(g,g.isP?null:g.hideSpot);}
      hnsPhase='seek';hnsSeekLeft=seekTime*1000;
      var ov=document.getElementById('hns-overlay');if(ov)ov.classList.remove('show');
      flash(playerIsSeeker?'SEEK THEM OUT!':(hnsSeeker.name+' is seeking — stay hidden!'),'#ffd23d');
      updHnsHUD();updScore();
    }
    return;
  }
  if(hnsPhase!=='seek')return;
  hnsSeekLeft-=dt;updHnsHUD();
  /* AI seeker inspects objects it reaches */
  if(hnsSeeker&&!hnsSeeker.isP){
    var s=hnsSeeker;
    if(!s._seekTarget||s._seekTarget.p._inspected||platforms.indexOf(s._seekTarget.p)<0)s._seekTarget=pickSeekTarget(s);
    if(s._seekTarget&&overlapsProp(s,s._seekTarget.p)){
      var tp=s._seekTarget.p;tp._inspected=true;
      if(tp._hnsHider)revealHider(tp);else if(tp._hnsReal)wrongGuess(tp);
      s._seekTarget=null;
    }
  }
  if(STATE==='play'&&hnsSeekLeft<=0){flash('Time up — hiders win!','#ff3db5');hnsEnd(false);}
}

/* ===== ZEN BUILD DOCK WIRING ===== */
var ZEN_CATS={
  orbs:[{t:'orb',e:'◎',l:'Orb'},{t:'burning',e:'🔥',l:'Burning'}],
  platforms:[{t:'normalplat',e:'▬',l:'Platform'},{t:'bouncy',e:'🟢',l:'Bouncy'},{t:'lava',e:'🌋',l:'Lava'},{t:'icy',e:'🧊',l:'Icy'},{t:'slippery',e:'💧',l:'Slippery'},{t:'pool',e:'🏊',l:'Pool'},{t:'cloud',e:'☁️',l:'Cloud'}],
  furniture:[{t:'couch',e:'🛋',l:'Couch'},{t:'lamp',e:'💡',l:'Lamp'},{t:'tv',e:'📺',l:'TV'},{t:'plant',e:'🪴',l:'Plant'}],
  nature:[{t:'mushroom',e:'🍄',l:'Shroom'},{t:'plant',e:'🌿',l:'Fern'},{t:'rock',e:'🪨',l:'Rock'}],
  fun:[{t:'balloon',e:'🎈',l:'Balloon'},{t:'beachball',e:'🏐',l:'Ball'},{t:'crate',e:'📦',l:'Crate'}]
};
function buildZenItems(){
  var host=document.getElementById('zen-items');if(!host)return;host.innerHTML='';
  (ZEN_CATS[zenCat]||[]).forEach(function(it){
    var b=document.createElement('button');b.className='zen-item';b.dataset.spawn=it.t;
    b.setAttribute('data-testid','zen-spawn-'+it.t);b.setAttribute('aria-label','Spawn '+it.l);
    b.innerHTML='<span class="gi">'+it.e+'</span><span class="li">'+it.l+'</span>';
    b.addEventListener('click',function(){spawnZen(it.t);});
    host.appendChild(b);
  });
}
document.querySelectorAll('#zen-cat-tabs .zen-seg__btn').forEach(function(tab){
  tab.addEventListener('click',function(){zenCat=tab.dataset.cat;document.querySelectorAll('#zen-cat-tabs .zen-seg__btn').forEach(function(x){x.classList.toggle('active',x===tab);});buildZenItems();});
});
buildZenItems();

/* env chip + pop menu */
(function buildZenEnvMenu(){
  var menu=document.getElementById('zen-env-menu');if(!menu)return;menu.innerHTML='';
  Object.keys(ENV).forEach(function(k){var b=document.createElement('button');b.dataset.env=k;b.setAttribute('role','menuitem');b.setAttribute('data-testid','zen-env-'+k);
    b.innerHTML='<span>'+(ENV_ICON[k]||'')+'</span> '+(ENV_NAME[k]||ENV[k].name);
    b.addEventListener('click',function(){setZenEnv(k);closeEnvMenu();});menu.appendChild(b);});
})();
function openEnvMenu(){document.getElementById('zen-env-menu').classList.add('open');document.getElementById('zen-env-chip').setAttribute('aria-expanded','true');}
function closeEnvMenu(){var m=document.getElementById('zen-env-menu');if(m)m.classList.remove('open');var c=document.getElementById('zen-env-chip');if(c)c.setAttribute('aria-expanded','false');}
document.getElementById('zen-env-chip').addEventListener('click',function(e){e.stopPropagation();var m=document.getElementById('zen-env-menu');if(m.classList.contains('open'))closeEnvMenu();else openEnvMenu();});
document.addEventListener('click',function(e){var env=document.getElementById('zen-env');if(env&&!env.contains(e.target))closeEnvMenu();});
function setZenEnv(k){zenEnv=k;try{localStorage.setItem('frea_zenenv',zenEnv);}catch(e){}syncEnvButtons();flash((ENV_NAME[k]||k)+' environment!','#9b6bff');
  if(STATE==='play'&&gameMode==='zen'){platforms=platforms.filter(function(p){return !(p.deco&&p._envprop);});spawnEnvProps();}
}

/* FAB show/hide dock */
document.getElementById('zen-fab').addEventListener('click',function(){
  dockOpen=!dockOpen;
  var fab=document.getElementById('zen-fab'),dock=document.getElementById('zen-dock');
  fab.classList.toggle('open',dockOpen);
  if(dockOpen)dock.classList.add('show');
  dock.classList.toggle('collapsed',!dockOpen);
  closeEnvMenu();
});

/* edit / creative mode controls */
document.getElementById('zen-edit-btn').addEventListener('click',enterEdit);
document.getElementById('edit-done').addEventListener('click',exitEdit);
document.getElementById('tool-move').addEventListener('click',function(){setEditTool('move');});
document.getElementById('tool-delete').addEventListener('click',function(){setEditTool('delete');});
var _tt=document.getElementById('tool-type');if(_tt)_tt.addEventListener('click',function(){setEditTool('type');});
document.getElementById('zen-clear-btn').addEventListener('click',function(){spawnZen('clear');});
var _cp=document.getElementById('zen-clearplats-btn');if(_cp)_cp.addEventListener('click',function(){spawnZen('clearplats');});

document.getElementById('add-flea-btn').addEventListener('click',function(){
  if(STATE!=='play'||gameMode!=='zen'||fleas.length>=30){if(fleas.length>=30)flash('Max 30 fleas!','#ff3db5');return;}
  var names=["Bouncy","Zippy","Dodo","Jumper","Luna","Twinkle","Noodle","Pip","Wobble","Sparky","Mochi","Bean","Fuzz","Pip","Coco","Gizmo"];
  var p=platforms[3+(Math.random()*Math.max(1,platforms.length-3)|0)]||platforms[0];var tp=p.topPoint();
  var f=makeAI(names[Math.random()*names.length|0],tp.x-13,tp.y-40);
  f.bubble="Hey, I'm here!";f.bubbleT=2000;fleas.push(f);
  bump('fleasSpawnedZen');STATS.peakZenFleas=Math.max(STATS.peakZenFleas,fleas.length);saveStats();
  updScore();
});
document.getElementById('remove-flea-btn').addEventListener('click',function(){
  if(STATE!=='play'||gameMode!=='zen')return;
  var idx=-1;for(var i=fleas.length-1;i>=0;i--){if(!fleas[i].isP){idx=i;break;}}
  if(idx<0){flash('No fleas to remove!','#ff3db5');return;}
  var f=fleas[idx];jpfx(f.cx,f.cy,f.col);fleas.splice(idx,1);updScore();
});

/* ===== ZEN EMOTE INTERACTIONS ===== */
var EMOTES=[
  {e:'😊',k:'happy',m:'good'},{e:'❤️',k:'love',m:'good'},{e:'😂',k:'laugh',m:'good'},
  {e:'👋',k:'wave',m:'good'},{e:'🍎',k:'food',m:'good'},{e:'🎉',k:'party',m:'good'},
  {e:'😢',k:'sad',m:'bad'},{e:'😠',k:'angry',m:'bad'},{e:'🔪',k:'knife',m:'bad'},
  {e:'💀',k:'skull',m:'bad'},{e:'👻',k:'ghost',m:'bad'},{e:'😱',k:'scream',m:'bad'}
];
var ACTIONS=[
  {e:'🕺',k:'dance',l:'Dance'},{e:'🤸',k:'jump',l:'Jump'},{e:'🫓',k:'squish',l:'Squish'},
  {e:'🌀',k:'spin',l:'Spin'},{e:'🛌',k:'lie',l:'Lie Down'}
];
var ACTION_KEYS=['dance','jump','squish','spin','lie'];
var ACTION_EMOJI={dance:'🕺',jump:'🤸',squish:'🫓',spin:'🌀',lie:'🛌'};
var emoteOpen=false;
function buildEmoteBar(){
  var host=document.getElementById('emote-bar');if(!host)return;host.innerHTML='';
  var head=document.createElement('div');head.className='emote-title';head.textContent='React';host.appendChild(head);
  EMOTES.forEach(function(it){
    var b=document.createElement('button');b.className='emote-btn';b.dataset.mood=it.m;b.dataset.emote=it.k;
    b.setAttribute('data-testid','emote-'+it.k);b.setAttribute('aria-label','Send '+it.k+' emote');
    b.textContent=it.e;
    b.addEventListener('click',function(ev){ev.stopPropagation();sendEmote(it);});
    host.appendChild(b);
  });
  var ah=document.createElement('div');ah.className='emote-title';ah.textContent='Actions';host.appendChild(ah);
  ACTIONS.forEach(function(it){
    var b=document.createElement('button');b.className='emote-btn action';b.dataset.action=it.k;
    b.setAttribute('data-testid','action-'+it.k);b.setAttribute('aria-label',it.l);b.title=it.l;
    b.textContent=it.e;
    b.addEventListener('click',function(ev){ev.stopPropagation();doAction(it);});
    host.appendChild(b);
  });
}
function doAction(it){
  if(STATE!=='play'||!player)return;
  if(player.action===it.k){player.action='';player.actionT=0;player.sq=1;flash('Stopped','#c6ff3d');}
  else{player.action=it.k;player.actionT=0;player.actionUntil=0;player.stuck=true;player.vx=0;player.vy=0;flash(it.e+' '+it.l+'!','#c6ff3d');}
  setEmoteOpen(false);
}
function setEmoteOpen(v){
  emoteOpen=v;
  var fab=document.getElementById('emote-fab'),bar=document.getElementById('emote-bar');
  if(fab)fab.classList.toggle('open',v);
  if(bar)bar.classList.toggle('show',v);
}
function showEmoteUI(v){
  var fab=document.getElementById('emote-fab');if(fab)fab.classList.toggle('show',v);
  if(!v)setEmoteOpen(false);
}
function sendEmote(it){
  if(STATE!=='play'||gameMode!=='zen'||!player)return;
  var good=it.m==='good',now=Date.now();
  player.emoteEmoji=it.e;player.emoteT=2000;
  for(var i=0;i<fleas.length;i++){var f=fleas[i];if(f.isP)continue;
    var sx=f.cx-camera.x, sy=f.cy-camera.y;
    var onScreen=sx>-60&&sx<W+60&&sy>-60&&sy<H+60;
    var d=Math.hypot(f.cx-player.cx,f.cy-player.cy);
    if(onScreen||d<480){
      if(good){f.followUntil=now+5200;f.fleeUntil=0;}
      else{f.fleeUntil=now+5200;f.followUntil=0;}
      f.reactEmote=good?(d<220?'❤️':'😊'):((it.k==='knife'||it.k==='skull')?'😱':'😨');
      f.reactEmoteT=1600;f._sayCD=0;
      maybeSay(f,pick(good?EVENT_LINES.emoteLove:EVENT_LINES.emoteScared),1600);
    }
  }
  bump('emoteInteractions');
  setEmoteOpen(false);
}
function updateEmotes(dt){
  for(var i=emotePops.length-1;i>=0;i--){var p=emotePops[i];p.y+=p.vy*(dt/16);p.vy*=0.98;p.l-=dt/1400;if(p.l<=0)emotePops.splice(i,1);}
}
function drawEmotes(){
  for(var i=0;i<emotePops.length;i++){var p=emotePops[i];var x=p.x-camera.x,y=p.y-camera.y;
    ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,p.l));ctx.font=(p.big?26:20)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=6;ctx.fillText(p.e,x,y);ctx.restore();}
  for(var j=0;j<fleas.length;j++){var f=fleas[j];if(!f.reactEmote||f.reactEmoteT<=0)continue;
    var rx=f.cx-camera.x,ry=f.cy-camera.y-f.h/2-24;if(rx<-40||rx>W+40||ry<-40||ry>H+40)continue;
    var a=Math.min(1,f.reactEmoteT/500);
    ctx.save();ctx.globalAlpha=a;ctx.font='18px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=5;ctx.fillText(f.reactEmote,rx,ry-(1-a)*8);ctx.restore();}
}
buildEmoteBar();
(function(){var ef=document.getElementById('emote-fab');if(ef)ef.addEventListener('click',function(e){e.stopPropagation();setEmoteOpen(!emoteOpen);});
document.addEventListener('click',function(e){var bar=document.getElementById('emote-bar'),fab=document.getElementById('emote-fab');if(emoteOpen&&bar&&fab&&!bar.contains(e.target)&&!fab.contains(e.target))setEmoteOpen(false);});})();

/* MODE INTRO SPLASH */
var MODE_INTRO={
  classic:{ico:'◎',name:'Capture the Orb',sub:'Grab the orb and hold it to fill your capture ring. Fill it first to win the round!',col:['#0a2540','#2de2ff']},
  race:{ico:'🏁',name:'Race',sub:'Scramble up the neon tower. First flea to reach the orb at the top wins!',col:['#1a3a10','#c6ff3d']},
  survival:{ico:'🔥',name:'Burning Orb',sub:'The orb is on fire! 10-second fuse. Pass it fast — hold too long and you go BOOM!',col:['#3a0e10','#ff3b00']},
  tag:{ico:'🦠',name:'Infectious',sub:'One flea turns infected after 10s. Flee the green! Last safe flea wins!',col:['#0e2a18','#39ff7a']},
  hns:{ico:'🫣',name:'Hide & Seek',sub:'You are the seeker! Fleas disguise as objects. Bump into props to unmask every hider before time runs out!',col:['#1a2440','#39ff7a']},
  zen:{ico:'🧘',name:'Zen',sub:'No rules. Add fleas, drop orbs & furniture, switch worlds. Just vibe.',col:['#1a1040','#9b6bff']}
};
var introTimer=null;
function showModeIntro(cb){
  var mi=document.getElementById('mode-intro');var d=MODE_INTRO[gameMode]||MODE_INTRO.classic;
  document.getElementById('mi-ico').textContent=d.ico;document.getElementById('mi-ico').style.color=d.col[1];
  document.getElementById('mi-name').textContent=d.name;document.getElementById('mi-name').style.color=d.col[1];
  document.getElementById('mi-sub').textContent=d.sub;
  document.getElementById('mi-bg').style.background='radial-gradient(120% 90% at 50% 40%,'+d.col[0]+' 0%,#05060f 80%)';
  /* restart bar animation */
  var bar=mi.querySelector('.mi-bar i');bar.style.animation='none';void bar.offsetWidth;bar.style.animation='miBar 3s linear forwards';
  mi.classList.remove('out');mi.classList.add('show');
  var done=false;
  var cancelBtn=document.getElementById('mi-cancel');
  function cleanup(){clearTimeout(introTimer);mi.removeEventListener('click',finish);if(cancelBtn)cancelBtn.removeEventListener('click',onCancel);}
  function finish(){if(done)return;done=true;cleanup();mi.classList.add('out');setTimeout(function(){mi.classList.remove('show','out');cb();},420);}
  function onCancel(e){if(e)e.stopPropagation();if(done)return;done=true;cleanup();mi.classList.add('out');setTimeout(function(){mi.classList.remove('show','out');toLobby();},420);}
  introTimer=setTimeout(finish,3000);
  mi.addEventListener('click',finish);
  if(cancelBtn)cancelBtn.addEventListener('click',onCancel);
}
function playWithIntro(){closeSettings();closeCust();showModeIntro(startGame);}

function togglePause(){if(STATE!=='play')return;isPaused=!isPaused;document.getElementById('pause-overlay').classList.toggle('show',isPaused);}
document.getElementById('pause-btn').addEventListener('click',togglePause);
var swSMp=document.getElementById('sw-spotme-pause');if(swSMp)swSMp.addEventListener('click',toggleSpotMe);
document.getElementById('resume-btn').addEventListener('click',function(){isPaused=false;document.getElementById('pause-overlay').classList.remove('show');});
document.getElementById('prestart-btn').addEventListener('click',function(){document.getElementById('pause-overlay').classList.remove('show');startGame();});
document.getElementById('plobby-btn').addEventListener('click',function(){toLobby();});

function toLobby(){
  isPaused=false;STATE='title';clearTimers();saveStats();
  editMode=false;var _zd=document.getElementById('zen-dock'),_zf=document.getElementById('zen-fab');if(_zd)_zd.classList.remove('show','collapsed');if(_zf)_zf.classList.remove('show','open');document.getElementById('edit-bar').classList.remove('show');document.getElementById('edit-hint').classList.remove('show');closeEnvMenu();showEmoteUI(false);
  hnsPhase='';var _ho=document.getElementById('hns-overlay');if(_ho)_ho.classList.remove('show');
  var _tp=document.getElementById('tut-panel');if(_tp)_tp.classList.remove('show');
  var _td=document.getElementById('tut-done');if(_td)_td.classList.remove('show');
  var _hl2=document.querySelector('.hud-left');if(_hl2)_hl2.style.display='flex';
  document.getElementById('add-flea-btn').style.display='none';document.getElementById('remove-flea-btn').style.display='none';
  fleas=[];orb=null;orbHolder=null;player=null;parts=[];sparks=[];playerDead=false;
  aim.on=false;aim.dragging=false;tapMarker=null;touchRipple=null;camera.x=0;camera.y=0;camera.shake=0;
  document.getElementById('hud').style.display='none';
  document.getElementById('end-view').style.display='none';
  document.getElementById('pause-overlay').classList.remove('show');
  var cd=document.getElementById('countdown');cd.style.display='none';cd.innerHTML='<span class="cd-num">3</span>';
  document.getElementById('tbox').classList.remove('danger');
  document.getElementById('flash').classList.remove('on');
  var ev=document.getElementById('end-view');ev.classList.remove('win','lose','view-anim');
  var tv=document.getElementById('title-view');tv.style.display='flex';tv.classList.remove('view-anim');void tv.offsetWidth;tv.classList.add('view-anim');
  document.getElementById('overlay').classList.remove('gone');
  initAmbient();
}

function endGame(winner){
  if(STATE!=='play'&&STATE!=='countdown')return;
  STATE='gameover';clearTimers();saveStats();
  hnsPhase='';var _ho2=document.getElementById('hns-overlay');if(_ho2)_ho2.classList.remove('show');
  editMode=false;var _zd=document.getElementById('zen-dock'),_zf=document.getElementById('zen-fab');if(_zd)_zd.classList.remove('show','collapsed');if(_zf)_zf.classList.remove('show','open');document.getElementById('edit-bar').classList.remove('show');document.getElementById('edit-hint').classList.remove('show');closeEnvMenu();showEmoteUI(false);
  document.getElementById('add-flea-btn').style.display='none';document.getElementById('remove-flea-btn').style.display='none';
  document.getElementById('hud').style.display='none';document.getElementById('title-view').style.display='none';
  var cd=document.getElementById('countdown');cd.style.display='none';
  var ev=document.getElementById('end-view');
  var et=document.getElementById('end-title'),es=document.getElementById('end-sub'),wn=document.getElementById('winner-name'),wr=document.getElementById('winner-role');
  var won=winner&&winner.isP;
  /* reset single-winner stage (may have been hidden by a prior HnS multi-winner screen) */
  var _wcv=document.getElementById('win-canvas');if(_wcv)_wcv.style.display='';if(wn)wn.style.display='';
  var _hgrid=document.getElementById('hns-winners');if(_hgrid)_hgrid.style.display='none';
  ev.classList.remove('win','lose','view-anim');
  function reveal(){
    void ev.offsetWidth;ev.style.display='flex';document.getElementById('overlay').classList.remove('gone');
    if(gameMode==='zen'){ev.classList.add('view-anim');}
    else if(won){ev.classList.add('win');confetti();}
    else{ev.classList.add('lose');flashRed();}
    drawWinner(winner||player);
  }
  if(gameMode==='zen'){et.textContent='ZEN OVER';et.style.color='#9b6bff';es.textContent='Sandbox Session Ended';wr.textContent='Your Frea';wn.textContent=player?player.name:'Frea';reveal();return;}
  /* Hide & Seek hider victory → multi-winner grid */
  if(gameMode==='hns'&&hnsEndInfo&&!hnsEndInfo.seekerWon){playStinger(showHnsHiderWin);return;}
  /* record stats */
  if(gameMode==='classic'&&player)bumpMode('pointsByMode','classic',player.matchPoints||0);
  if(won){bumpMode('winsByMode',gameMode);if(gameMode!=='classic')bumpMode('pointsByMode',gameMode);}
  es.textContent={classic:'Match Complete',race:'Race Finished',survival:'Last Flea Standing',tag:'Last Safe Flea',hns:won?'You unmasked everyone!':'The hiders escaped!'}[gameMode]||'Round Complete';
  if(won){et.textContent='VICTORY!';et.style.color='#ffd23d';wr.textContent='Champion';}
  else{et.textContent='DEFEAT';et.style.color='#ff3db5';wr.textContent='Winner';}
  wn.textContent=winner?winner.name:'—';
  playStinger(reveal);
}
function playStinger(cb){
  var st=document.getElementById('round-stinger');if(!st){cb();return;}
  st.classList.remove('out');st.classList.add('show');
  setTimeout(function(){st.classList.add('out');setTimeout(function(){st.classList.remove('show','out');cb();},320);},820);
}
function confetti(){var box=document.getElementById('confetti');box.innerHTML='';var cols=['#2de2ff','#ff3db5','#c6ff3d','#ffd23d','#9b6bff','#fff'];for(var i=0;i<90;i++){var d=document.createElement('div');d.className='confetti-piece';d.style.left=(Math.random()*100)+'%';d.style.background=cols[i%cols.length];d.style.width=(6+Math.random()*6)+'px';d.style.height=(10+Math.random()*9)+'px';d.style.animationDuration=(1.8+Math.random()*1.8)+'s';d.style.animationDelay=(Math.random()*0.5)+'s';d.style.transform='rotate('+(Math.random()*360)+'deg)';box.appendChild(d);}setTimeout(function(){box.innerHTML='';},4400);}
function flashRed(){var f=document.getElementById('flash');f.classList.remove('on');void f.offsetWidth;f.classList.add('on');}

/* ===== WINNER / PREVIEW CANVAS ===== */
function drawFleaCentered(targetCanvas,spec){
  var wx=targetCanvas.getContext('2d');
  var t=new Flea(0,0,spec.isP||false,'',spec);t.stuck=true;t.face=1;t.angle=0;
  var pad=10,headroom=32,bodyW=42,bodyH=58;
  var maxScale=Math.min((targetCanvas.width-pad*2)/bodyW,(targetCanvas.height-pad*2-headroom*0.4)/bodyH);
  var Z=Math.max(1.5,Math.min(3.4,maxScale*1.4));
  if(winIv)clearInterval(winIv);var fc=0;
  winIv=setInterval(function(){
    wx.clearRect(0,0,targetCanvas.width,targetCanvas.height);
    fc+=0.15;t.la=fc;t.ea=fc*0.4;t.sq=1+Math.sin(fc*0.7)*0.07;
    var sctx=ctx;ctx=wx;wx.save();wx.translate(targetCanvas.width/2,targetCanvas.height/2+headroom*0.35);wx.scale(Z,Z);t.draw(t.cx,t.cy);wx.restore();ctx=sctx;
  },42);
}
function drawSpotScrim(){
  if(!player)return;
  var px=player.cx-camera.x,py=player.cy-camera.y,R=Math.max(130,player.h*2.4);
  var g=ctx.createRadialGradient(px,py,R*0.45,px,py,R*1.9);
  g.addColorStop(0,'rgba(3,5,14,0)');g.addColorStop(0.55,'rgba(3,5,14,0.34)');g.addColorStop(1,'rgba(3,5,14,0.64)');
  ctx.save();ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore();
}
function drawSpotRing(){
  if(!player)return;
  var px=player.cx-camera.x,py=player.cy-camera.y,R=player.h*1.05+16+Math.sin(orbPulse*2)*3;
  ctx.save();ctx.strokeStyle='rgba(45,226,255,0.9)';ctx.lineWidth=3;ctx.shadowColor='#2de2ff';ctx.shadowBlur=perfMode?0:14;
  ctx.beginPath();ctx.arc(px,py,R,0,7);ctx.stroke();
  ctx.globalAlpha=.4;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(px,py,R+7,0,7);ctx.stroke();
  ctx.restore();
}
function drawWinner(f){if(!f)return;var cv=document.getElementById('win-canvas');drawFleaCentered(cv,specOf(f));}
/* static single-frame flea render (no interval) — used for multi-winner grids */
function drawFleaStatic(targetCanvas,spec){
  var px=targetCanvas.getContext('2d');
  var t=new Flea(0,0,true,'',spec);t.stuck=true;t.face=1;t.angle=0;t.la=2.2;t.ea=1;t.sq=1.02;
  var pad=8,headroom=26,bodyW=42,bodyH=58;
  var maxScale=Math.min((targetCanvas.width-pad*2)/bodyW,(targetCanvas.height-pad*2-headroom*0.4)/bodyH);
  var Z=Math.max(1.1,Math.min(2.4,maxScale*1.3));
  px.clearRect(0,0,targetCanvas.width,targetCanvas.height);
  var sctx=ctx;ctx=px;px.save();px.translate(targetCanvas.width/2,targetCanvas.height/2+headroom*0.35);px.scale(Z,Z);t.draw(t.cx,t.cy);px.restore();ctx=sctx;
}
/* Hide & Seek: hiders-win screen showing every flea that stayed hidden */
function showHnsHiderWin(){
  var ev=document.getElementById('end-view');
  var et=document.getElementById('end-title'),es=document.getElementById('end-sub'),wr=document.getElementById('winner-role'),wn=document.getElementById('winner-name');
  var winners=(hnsEndInfo&&hnsEndInfo.escaped)||[];
  var playerWon=winners.indexOf(player)>=0;
  if(winIv){clearInterval(winIv);winIv=null;}
  /* hide the single-winner canvas + name, show the grid instead */
  var wcv=document.getElementById('win-canvas');if(wcv)wcv.style.display='none';if(wn)wn.style.display='none';
  et.textContent='HIDERS ESCAPED!';et.style.color='#39ff7a';
  es.textContent=playerWon?'You stayed hidden the whole time!':(hnsSeeker?hnsSeeker.name:'The seeker')+' ran out of guesses!';
  wr.textContent=winners.length+' hider'+(winners.length!==1?'s':'')+' got away';
  if(playerWon)bumpMode('winsByMode','hns');
  var grid=document.getElementById('hns-winners');
  if(grid){grid.style.display='flex';grid.innerHTML='';
    winners.slice(0,12).forEach(function(f){
      var cell=document.createElement('div');cell.className='hns-win-cell';if(f===player)cell.classList.add('me');
      cell.setAttribute('data-testid','hns-winner-'+(f.isP?'you':f.name));
      var cv=document.createElement('canvas');cv.width=120;cv.height=120;cv.className='hns-win-cv';cell.appendChild(cv);
      var nm=document.createElement('div');nm.className='hns-win-nm';nm.textContent=f.isP?(f.name+' (You)'):f.name;cell.appendChild(nm);
      grid.appendChild(cell);drawFleaStatic(cv,specOf(f));
    });
  }
  ev.classList.remove('win','lose','view-anim');
  void ev.offsetWidth;ev.style.display='flex';document.getElementById('overlay').classList.remove('gone');
  if(playerWon){ev.classList.add('win');confetti();}else{ev.classList.add('lose');flashRed();}
}
function drawPreview(){
  var cv=document.getElementById('cust-preview');if(!cv||cv.offsetParent===null)return;
  var c=saved.find(function(f){return f.id===activeId;});if(!c)return;
  drawFleaCenteredOnce(cv,specOf(c));
}
function drawFleaCenteredOnce(targetCanvas,spec){
  var px=targetCanvas.getContext('2d');
  var t=new Flea(0,0,true,'',spec);t.stuck=true;t.face=1;t.angle=0;
  var pad=10,headroom=32,bodyW=42,bodyH=58;
  var maxScale=Math.min((targetCanvas.width-pad*2)/bodyW,(targetCanvas.height-pad*2-headroom*0.4)/bodyH);
  var Z=Math.max(1.4,Math.min(3.0,maxScale*1.35));
  if(prevIv)clearInterval(prevIv);var fc=0;
  prevIv=setInterval(function(){
    if(targetCanvas.offsetParent===null){clearInterval(prevIv);prevIv=null;return;}
    px.clearRect(0,0,targetCanvas.width,targetCanvas.height);
    fc+=0.12;t.la=fc;t.ea=fc*0.4;t.sq=1+Math.sin(fc*0.7)*0.07;
    var sctx=ctx;ctx=px;px.save();px.translate(targetCanvas.width/2,targetCanvas.height/2+headroom*0.35);px.scale(Z,Z);t.draw(t.cx,t.cy);px.restore();ctx=sctx;
  },42);
}

function stars(){var el=document.getElementById('stars');for(var i=0;i<70;i++){var s=document.createElement('div');s.className='star';var sz=1+Math.random()*2.5;s.style.cssText='width:'+sz+'px;height:'+sz+'px;left:'+(Math.random()*100)+'%;top:'+(Math.random()*100)+'%;animation-duration:'+(2+Math.random()*3)+'s;animation-delay:'+(Math.random()*3)+'s';el.appendChild(s);}}
function randSpec(){return {color:'hsl('+(Math.random()*360|0)+',90%,66%)',secondary:randHex(),eyeColor:Math.random()<.5?'#101018':randHex(),shape:pick(OPT.shape),size:'normal',pattern:Math.random()<.6?pick(OPT.pattern):'none',eyes:pick(OPT.eyes),ant:pick(OPT.ant),legs:pick(OPT.legs),legStyle:Math.random()<.5?'default':pick(OPT.legStyle),legShape:Math.random()<.55?'default':pick(OPT.legShape),hat:Math.random()<.6?pick(OPT.hat):'none',wings:Math.random()<.5?pick(OPT.wings):'none',trail:'none',aura:Math.random()<.5?pick(OPT.aura):'none',mouth:pick(OPT.mouth),brows:Math.random()<.4?pick(OPT.brows):'none',glasses:Math.random()<.3?pick(OPT.glasses):'none',cape:Math.random()<.2?pick(OPT.cape):'none',accessory:Math.random()<.3?pick(OPT.accessory):'none',cheek:pick(OPT.cheek)};}
function initSplashFleas(){
  var host=document.getElementById('splash-fleas');if(!host)return;host.innerHTML='';
  var objs=[];
  for(var i=0;i<6;i++){var cv=document.createElement('canvas');cv.className='pf';cv.width=66;cv.height=80;host.appendChild(cv);var t=new Flea(0,0,true,'',randSpec());t.stuck=true;t.face=1;t.angle=0;objs.push({cv:cv,t:t});}
  var fc=Math.random()*10;
  var iv=setInterval(function(){
    var sp=document.getElementById('splash');
    if(!sp||sp.classList.contains('gone')||sp.style.display==='none'){clearInterval(iv);return;}
    fc+=0.14;
    for(var k=0;k<objs.length;k++){var o=objs[k],c=o.cv.getContext('2d');c.clearRect(0,0,o.cv.width,o.cv.height);o.t.la=fc+k;o.t.ea=fc*0.4+k;o.t.sq=1+Math.sin(fc*0.7+k)*0.06;var sctx=ctx;ctx=c;c.save();c.translate(o.cv.width/2,o.cv.height/2+12);c.scale(1.55,1.55);o.t.draw(o.t.cx,o.t.cy);c.restore();ctx=sctx;}
  },50);
}

stars();loadFreas();syncSettingsUI();applyScoresVis();initSplashFleas();initAmbient();
document.getElementById('play-btn').addEventListener('click',playWithIntro);
document.getElementById('again-btn').addEventListener('click',playWithIntro);
document.getElementById('menu-btn').addEventListener('click',toLobby);
/* Tutorial wiring */
document.getElementById('tutorial-toggle').addEventListener('click',startTutorial);
document.getElementById('tut-skip').addEventListener('click',function(){if(gameMode==='tutorial'&&STATE==='play')tutAdvance();});
document.getElementById('tut-exit').addEventListener('click',function(){document.getElementById('tut-panel').classList.remove('show');gameMode=tutPrevMode;syncModeChips();toLobby();});
document.getElementById('tut-lobby').addEventListener('click',function(){document.getElementById('tut-done').classList.remove('show');gameMode=tutPrevMode;syncModeChips();toLobby();});
document.getElementById('tut-play').addEventListener('click',function(){
  document.getElementById('tut-done').classList.remove('show');
  gameMode='classic';syncModeChips();startGame();
});
lt=performance.now();fid=requestAnimationFrame(loop);
})();
