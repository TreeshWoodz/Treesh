/* ---------- P9zm: Bronze Blitz, Sonoko + Ebonics get real bios, ages, logos and banners (Hoop too); their stats land on your profile; What's New catches up ---------- */
const P9ZM_ART=(A=>{ const o={}; for(const k in A){ try{ const b=atob(A[k].split(',')[1]), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); o[k]=URL.createObjectURL(new Blob([u],{type:'image/webp'})); }catch(e){ o[k]=A[k]; } } return o; })(__P9ZM_ART__);
[['bronze-blitz',{name:'Bronze Blitz',url:'https://treesh.app/games/bronze-blitz',mono:'B',a:'#E08F3C',b:'#7a4512',age:'All',desc:'Match the culture. Swap vinyl, golden crowns, afro picks, fresh kicks and djembes, set off Blitz Bombs and Starlite Discos, and clear the Kente across 30 levels in 3 chapters, from The Block Party to Afrofuture. Five ways to play: Classic Levels, Timed Blitz, Moves Challenge, the Daily Challenge and Endless Zen.'}],
 ['sonoku',{name:'Sonoko',url:'https://treesh.app/games/sonoku',mono:'S',a:'#27b5c9',b:'#0b4a63',age:'6+',desc:'Sudoku logic meets card-game chaos. Match the top card by color or number, drop it in its one correct cell on the 6\u00d76 grid and chain combos up to x5. Down to one card? Call SONOKO! Play the hybrid, Classic Sudoku, card battles against bots, Versus against Ivy or the Daily Challenge, and fill your trophy cabinet.'}],
 ['ebonics',{name:'Ebonics',url:'https://treesh.app/games/ebonics',mono:'E',a:'#FFC72C',b:'#8B5CF6',age:'13+',desc:'The language. The culture. The game. Decode real AAVE in Say Less, finish iconic phrases, call Real or Cap, and flip English into AAVE with an AI judge. Seven modes, including the 60s Speed Run and the Daily Cookout, plus a 50-term Lexicon and ranks from Lil Cousin to Living Legend.'}],
 ['hoop',{}],['nects',{}],['chainz',{}]].forEach(([k,o])=>{ const g=GAME_BY_KEY[k]; if(!g) return; Object.assign(g,o,{logo:P9ZM_ART[k+'_logo']||g.logo,banner:P9ZM_ART[k+'_banner']||g.banner}); if(!['hoop','nects','chainz'].includes(k)) g.updated='October 8, 2026'; });

/* arcade stats on your profile (and your public Arcade tab) */
const EB_RANKS=[['Lil Cousin',0],['Cuzzo',300],['Day One',900],['Unc / Auntie',2000],['OG',4000],['Living Legend',8000]];
function bbSave(){ return _gdJson('bronze_save_v1',{})||{}; }
function snkSum(){ return (_gdJson('treesh_sonoku_v1',{})||{}).summary||{}; }
function ebSave(){ return _gdJson('ebonics_save_v1',{})||{}; }
GAME_DATA_SOURCES.push(
  { key:'bronze-blitz', name:'Bronze Blitz', mono:'B', a:'#E08F3C', b:'#7a4512',
    hasData:()=>_gdRaw('bronze_save_v1')!=null,
    starlites:()=>gdNum((bbSave().stats||{}).earned),
    stats:()=>{ const s=bbSave(), st=s.stats||{}, ls=Object.values(s.levelStars||{}).map(Number).filter(n=>n>0);
      return [['Levels cleared',ls.length+'/30'],['Level stars',fmtNum(ls.reduce((a,b)=>a+b,0))],['Trophies',(Array.isArray(s.claimed)?s.claimed.length:0)+'/20'],['Best combo','x'+gdNum(st.maxCombo)],['Games',fmtNum(gdNum(st.games))],['Tiles matched',fmtNum(gdNum(st.tiles))]]; } },
  { key:'sonoku', name:'Sonoko', mono:'S', a:'#27b5c9', b:'#0b4a63',
    hasData:()=>_gdRaw('treesh_sonoku_v1')!=null,
    starlites:()=>gdNum(snkSum().starlites),
    chip:()=>{ const s=snkSum(); return ['trophy',gdNum(s.unlocked)+'/'+(gdNum(s.total)||24)+' trophies']; },
    stats:()=>{ const s=snkSum(), t=s.tiers||{};
      return [['Level',fmtNum(gdNum(s.level)||1)],['Wins',fmtNum(gdNum(s.winsTotal))],['Best score',fmtNum(gdNum(s.best))],['Played',fmtNum(gdNum(s.played))],['Daily streak',fmtNum(gdNum(s.streak))],['Trophies',gdNum(t.gold)+'G '+gdNum(t.silver)+'S '+gdNum(t.bronze)+'B']]; } },
  { key:'ebonics', name:'Ebonics', mono:'E', a:'#FFC72C', b:'#8B5CF6',
    hasData:()=>_gdRaw('ebonics_save_v1')!=null,
    starlites:()=>_gdInt('ebonics_starlites')||gdNum(ebSave().totalEarned),
    chip:()=>{ const xp=gdNum(ebSave().xp); let r=EB_RANKS[0][0]; EB_RANKS.forEach(([n,x])=>{ if(xp>=x) r=n; }); return ['crown',r]; },
    stats:()=>{ const s=ebSave();
      return [['Games',fmtNum(gdNum(s.gamesPlayed))],['Correct',fmtNum(gdNum(s.totalCorrect))],['Best combo',gdNum(s.bestCombo)+'x'],['Day streak',fmtNum(gdNum((s.streak||{}).count))],['Trophies',Object.keys(s.achievements||{}).length+'/19'],['Terms learned',(Array.isArray(s.learned)?s.learned.length:0)+'/50']]; } });

/* their saves ride along with backups + account sync */
['bronze_','ebonics_'].forEach(p=>{ if(!TRANSFER_PREFIXES.includes(p)) TRANSFER_PREFIXES.push(p); });
try{ const G=STORAGE_GROUPS.find(g=>g.id==='gamedata'); if(G){ ['bronze_','ebonics_'].forEach(p=>{ if(!G.prefixes.includes(p)) G.prefixes.push(p); }); if(!(G.keys||[]).includes('treesh_sonoku_v1')) G.keys=(G.keys||[]).concat('treesh_sonoku_v1'); G.desc='Saves, stats & Starlites from Bronze Blitz, Sonoko, Ebonics, Chainz, FREA!, Vocotap & other Treesh games'; } }catch(e){}
window.addEventListener('storage',e=>{ const k=e.key||''; if(!/^(bronze_|ebonics_|treesh_sonoku_)/.test(k)) return; try{ if(sbUser()) sxPublishSoon(); }catch(_){} if(state.profileOpen&&state.profileTab==='stats'&&!state.settingsEditProfile){ clearTimeout(window._gdRT); window._gdRT=setTimeout(()=>{ try{ renderProfileBody(); }catch(_){} },400); } });
/* one Starlites wallet: the games write treesh_stars from their own frame, so read it fresh instead of overwriting it */
window.addEventListener('storage',e=>{ if(e.key!=='treesh_stars'||!e.newValue) return; try{ state.stars=JSON.parse(e.newValue)||state.stars; updateStarDisplays(); }catch(_){} });
window.addEventListener('message',e=>{ if(e.origin!==location.origin||!e.data||e.data.type!=='treesh:starlites') return; state.stars=LS.get('treesh_stars',state.stars)||state.stars; updateStarDisplays(); });
const _aws9zm=awardStars; awardStars=function(){ try{ state.stars=LS.get('treesh_stars',state.stars)||state.stars; }catch(e){} return _aws9zm.apply(this,arguments); };

/* What's New: the new games lead the home carousel, every page's notes catch up */
WNU.unshift(
  {id:'bronze-blitz',art:'bronze-blitz_main',k:'New game',t:'Bronze Blitz',d:'A match-3 that celebrates the culture. 30 levels, 5 modes and Blitz Bombs.',chips:['Match-3','30 levels','All ages'],cta:'Play now',ic:'zap',a:'#E08F3C',b:'#7a4512',go:'game:bronze-blitz'},
  {id:'sonoku',art:'sonoku_main',k:'New game',t:'Sonoko',d:'Sudoku logic meets card-game chaos. Call SONOKO! on your last card.',chips:['Sudoku','Cards','Daily'],cta:'Play now',ic:'layout-grid',a:'#27b5c9',b:'#0b4a63',go:'game:sonoku'},
  {id:'ebonics',art:'ebonics_main',k:'New game',t:'Ebonics',d:'Decode AAVE, call Real or Cap and flip phrases with an AI judge.',chips:['7 modes','Lexicon','13+'],cta:'Play now',ic:'message-circle-more',a:'#FFC72C',b:'#8B5CF6',go:'game:ebonics'});
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act="wnu-go"]'); const v=t&&t.dataset.val; if(v&&v.indexOf('game:')===0) openGameInfo(v.slice(5)); });
(function(){ const D='October 8, 2026', add=(k,sub,items,keep)=>{ const W=WHATS_NEW[k]; if(!W) return; W.v=(W.v||0)+1; W.date=D; if(sub) W.sub=sub; W.items=items.concat((W.items||[]).slice(0,keep)); };
  add('game','Three new games just dropped.',[
    {icon:'zap',title:'Bronze Blitz is live',desc:'A match-3 that celebrates the culture. Swap vinyl, crowns, kicks and djembes across 30 levels and 5 modes, from Timed Blitz to Endless Zen. Rated for all ages.'},
    {icon:'layout-grid',title:'Sonoko is live',desc:'Sudoku logic meets card-game chaos. Match color or number, drop each card in its correct cell and call SONOKO! on your last one. Ages 6+.'},
    {icon:'message-circle-more',title:'Ebonics is live',desc:'Decode AAVE, finish iconic phrases, call Real or Cap and flip phrases with an AI judge. 7 modes and a 50-term Lexicon. Ages 13+.'},
    {icon:'image',title:'Fresh game art',desc:'Bronze Blitz, Sonoko, Ebonics, Hoop, Nects and Chainz each have a new logo and banner, and the floating 3D art for Bronze Blitz, Sonoko, Ebonics, Vocotap, Nects and Chainz now matches each game. Tap any game to see its full bio, age rating and update date.'},
    {icon:'bar-chart-3',title:'Arcade stats on your profile',desc:'Levels, wins, trophies, best combos and Starlites from Bronze Blitz, Sonoko and Ebonics show up in Profile, Stats, Arcade games.'},
    {icon:'shield-alert',title:'What\u2019s Next reminder',desc:'A small badge stays on screen while you play to remind you the chat is part of the game, not real people texting.'}],2);
  add('library','A new way around Treesh.',[
    {icon:'panel-bottom',title:'New bottom bar',desc:'The bar now reads Icons, Library, Profile, Studios and Games. Settings moved to the gear at the top of the screen.'},
    {icon:'arrow-up-down',title:'Reorder your tabs',desc:'Open Magic Markup, then Pages, to move tabs up or down or hide the ones you don\u2019t use. Profile always stays.'},
    {icon:'quote',title:'Quote widget',desc:'Add a quote widget in Magic Markup with bars from Treesh songs, then tap shuffle for another one.'},
    {icon:'sparkles',title:'What\u2019s New, just for Treesh',desc:'The What\u2019s New carousel shows app updates and new Icon releases. Your own uploads never show up there.'},
    {icon:'lock',title:'Your uploads stay private',desc:'Music you add never leaves this device and only shows for the account that added it.'}],2);
  add('player','',[
    {icon:'chevron-down',title:'Swipe the mini player away',desc:'Swipe the mini player down to close it. It stays closed the next time you open Treesh, until you play something.'},
    {icon:'paintbrush',title:'Restyle the mini player',desc:'In Magic Markup, pick a glass, solid or accent look, choose which controls show and move it to the top, bottom or sides.'}],3);
  add('settings','',[
    {icon:'leaf',title:'Eco mode',desc:'Same Treesh look with lighter work. Floating 3D art holds still and heavy effects pause, so older phones stay smooth. It can turn on by itself on older phones.'},
    {icon:'sparkles',title:'Meet Urias',desc:'Your voice assistant has a name. Say \u201cHey Urias\u201d before a command, or rename it in Settings, Voice. Tips stay tucked behind the tip button.'},
    {icon:'refresh-cw',title:'Pull to refresh',desc:'On your phone, pull down at the top of a page to reload Treesh. You can turn it off in Settings.'},
    {icon:'baseline',title:'Font and color together',desc:'Your typeface and text color now live in one card under Appearance.'},
    {icon:'log-out',title:'A clean sign out',desc:'Signing out clears your profile, settings, playlists, favorites and stats from this device. Your own music stays put.'}],2);
  add('artists','',[
    {icon:'quote',title:'Icons only',desc:'Quotes and voice tips now only feature Treesh Icons and their songs.'}],2); })();
