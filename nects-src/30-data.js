/* ===== Nects data ===== */
const NECTS_LOGO='https://64.media.tumblr.com/1262b7cc04c787803b22c81af52e91a7/f03bc58006e10b13-94/s1280x1920/3f25f6b1f824f57464f60a2220db75167ad18e21.png';
const PACKS={
  mixed:{name:'Mixed',icon:'🎲',price:0,desc:'Every emoji from every pack, all mixed together.'},
  smileys:{name:'Smileys',icon:'😀',price:120,list:'😀 😃 😄 😁 😆 😅 🤣 😂 🙂 😉 😊 😇 🥰 😍 🤩 😘 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😏 😒 🙄 😬 😌 😔 😴 😷 🤒 🤢 🥵 🥶 🥴 🤯 🤠 🥳 😎 🤓 🧐'},
  animals:{name:'Animals',icon:'🐶',price:120,list:'🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐢 🐍 🦎 🐙 🦑 🦀 🐡 🐠 🐬 🐳 🦈 🐊 🦓 🦒 🦘 🦔'},
  food:{name:'Food',icon:'🍕',price:120,list:'🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🌽 🥕 🥐 🥯 🍞 🥨 🧀 🥚 🍳 🥞 🧇 🥓 🍔 🍟 🍕 🌭 🥪 🌮 🌯 🍿 🍩 🍪 🎂 🍰 🧁 🍫 🍬 🍭'},
  sports:{name:'Sports',icon:'⚽',price:120,list:'⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🏓 🏸 🏒 🏑 🥍 🏏 🥅 ⛳ 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🥌 🎿 🏂 🪂 🤸 🤺 🏇 🧘 🏄 🏊 🚣 🧗 🚴 🏆 🥇 🥈 🥉 🏅 🎯 🎳 🎮 🎲'},
  travel:{name:'Travel',icon:'🚀',price:120,list:'🚗 🚕 🚙 🚌 🚎 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🛵 🚲 🛴 🚨 🚔 🚍 🚘 🚖 🚀 🛸 🚁 ⛵ 🚤 🚢 ⚓ 🗽 🗼 🏰 🏯 🎡 🎢 🎠 ⛲ 🌋 🗻 🚂 🚃 🚄 🚅 🚆 🚇 🚈 🚉 🚞 🚟'},
  objects:{name:'Objects',icon:'💎',price:120,list:'⌚ 📱 💻 💽 💾 📀 📷 📸 📹 🎥 📞 📺 📻 ⏰ 🔋 🔌 💡 🔦 💸 💵 💰 💎 🔧 🔨 🔩 🧲 💣 🧨 🔪 🔮 🧿 💈 🔭 🔬 🎁 🎈 🎀 🪄 🧸 📦 📫 📌 📎 🔑 🔒 🧭 🧪 🧯'},
  nature:{name:'Nature',icon:'🌸',price:120,list:'🌵 🎄 🌲 🌳 🌴 🌱 🌿 🍀 🎍 🎋 🍃 🍂 🍁 🍄 🐚 🌾 💐 🌷 🌹 🥀 🌺 🌸 🌼 🌻 🌞 🌝 🌛 🌜 🌚 🌕 🌖 🌗 🌘 🌑 🌒 🌓 🌔 🌙 🌎 🌍 🌏 🪐 💫 ⭐ 🌟 ✨ ⚡ 💥 🔥 🌈 🌊'}
};
Object.values(PACKS).forEach(p=>{ if(p.list) p.e=p.list.split(' ').filter(Boolean); });
const ALL_EMOJIS=[...new Set(Object.values(PACKS).flatMap(p=>p.e||[]))];

const DIFFS={
  easy:{name:'Easy',mult:1,base:2800,range:1400,maxPU:3,botPU:.04,blitz:5,color:'#34d399'},
  normal:{name:'Normal',mult:1.5,base:2400,range:1200,maxPU:3,botPU:.06,blitz:4,color:'#60a5fa'},
  hard:{name:'Hard',mult:2.5,base:1150,range:450,maxPU:2,botPU:.09,blitz:3,color:'#f59e0b'},
  insane:{name:'Insane',mult:4,base:900,range:260,maxPU:1,botPU:.12,blitz:2.5,color:'#fb7185'},
  abysmal:{name:'Abysmal',mult:6,base:760,range:200,maxPU:0,botPU:.16,blitz:2,color:'#ff2d78'}
};
const GRIDS=['3x3','4x4','5x5','6x6'];
const GRID_MULT={9:1,16:1.3,25:1.6,36:2};
const BOT_NAMES={
  easy:['Lovely','Shenarrah','Vince','Ganga','Snowflake','Pempsi','Violet','Winston','Urias'],
  normal:['Lovely','Shenarrah','Vince','Ganga','Snowflake','Pempsi','Violet','Winston','Urias'],
  hard:['Evilton','Xccit','Succulence','Faragomo','Manifesio','Lockeye','Lucifer','Daemon'],
  insane:['Thane','Dark X','Adam','Yehsiah','Zeus','Plato','Skorn','Malishus','Nefarius'],
  abysmal:['Connex','Nectar','Excite','Rue']
};

const MODES=[
  {id:'classic',name:'Classic',hue:'#9328ff',icon:'swords',tag:'Race the bot',feature:true,setup:['diff','grid','rounds'],desc:'The original Nects. An emoji is called, and whoever taps it first claims it. Finish a full row, column or diagonal to take the round.',rules:['First to tap the called emoji claims it.','Complete any full line to win the round.','Harder bots pay more Starlites.']},
  {id:'blitz',name:'Blitz',hue:'#f59e0b',icon:'zap',tag:'Timed turns',setup:['diff','grid','rounds'],desc:'Every call has a fuse. If you don\u2019t tap it before the timer runs out, the bot takes it.',rules:['Each call gets a few seconds, scaled by board size.','Miss the timer and the call goes to the bot.','Pays 1.25x Starlites.']},
  {id:'daily',name:'Daily Challenge',hue:'#c3ab69',icon:'calendar-days',tag:'Same board for everyone',setup:[],desc:'One seeded 4x4 board and call order per day. Beat the Daily Rival for a once-a-day bonus.',rules:['Board, calls and rival are the same for everyone today.','First to 2 rounds wins.','+25 Starlites for your first win each day.']},
  {id:'survival',name:'Survival',hue:'#fb7185',icon:'heart-pulse',tag:'Endless waves',setup:['grid'],desc:'Three lives against an endless stream of bots that get faster every wave.',rules:['Win a round to clear a wave. Bots speed up each time.','Losing a round costs a life.','Starlites grow with every wave.']},
  {id:'gravity',name:'Gravity',hue:'#60a5fa',icon:'arrow-down-to-line',tag:'Pieces drop',setup:['diff','grid','rounds'],desc:'Claimed tiles fall to the lowest open spot in their column, like four-in-a-row. Plan your lines from the floor up.',rules:['Tap the called emoji and your claim drops down its column.','Lines still win, but you build them from the bottom.','Pays 1.15x Starlites.']},
  {id:'fog',name:'Fog of War',hue:'#b58cff',icon:'cloud-fog',tag:'Memory + speed',setup:['diff','grid','rounds'],desc:'You see your board for a moment, then the fog rolls in. Remember where everything is.',rules:['The board shows briefly at the start of each round.','Tapping a hidden tile peeks at it. A wrong peek costs half a second.','The fog lifts for a moment every 5 calls. Pays 1.3x.']},
  {id:'chaos',name:'Chaos',hue:'#ff2d78',icon:'tornado',tag:'Random events',setup:['diff','grid','rounds'],desc:'Quakes, naps, flips and free tiles go off between calls. Anything can happen.',rules:['A random event fires every few calls.','Events can help you or the bot.','Pays 1.2x Starlites.']},
  {id:'pass',name:'Pass & Play',hue:'#2dd4bf',icon:'users',tag:'2 players, 1 device',setup:['grid','rounds','p2'],desc:'Face to face on one screen. Both players race to tap the same call on their own boards.',rules:['Player 2\u2019s board is flipped so you can sit across from each other.','A wrong tap locks you out briefly.','Just for fun. No Starlites.']},
  {id:'puzzle',name:'Puzzle',hue:'#34d399',icon:'puzzle',tag:'Win in N moves',setup:['level'],desc:'Each level gives you a half-built board and a hand of call cards. Complete a line before you run out of moves.',rules:['Each card you play claims that emoji if it\u2019s on the board.','Some cards are decoys.','Solve faster for up to 3 stars.']},
  {id:'zen',name:'Zen',hue:'#22d3ee',icon:'leaf',tag:'No opponent',setup:['grid'],desc:'No bot and no timer. Just you, the calls and a calm board. If you get stuck, a hint lights up.',rules:['Calls wait for you.','Every line clears the board.','1 Starlite per line, up to 15 a day.']},
  {id:'custom',name:'Custom',hue:'#6366f1',icon:'sliders-horizontal',tag:'Your rules',price:300,setup:['custom'],desc:'Choose the board, bot speed, which lines count, powerups and more.',rules:['Mix and match every rule.','Pays 0.75x Starlites.']},
  {id:'mirror',name:'Mirror',hue:'#7a2cff',icon:'flip-horizontal-2',tag:'Fight yourself',price:600,setup:['grid','rounds'],desc:'The bot copies your reaction speed and gets every powerup you own.',rules:['The bot learns your average tap speed as you play.','It uses the powerups you own.','Pays 1.3x Starlites.']}
];
const MODE_BY_ID=Object.fromEntries(MODES.map(m=>[m.id,m]));

const POWERUPS={
  shuffle:{name:'Shuffle',icon:'🔀',price:0,desc:'Rearrange the unclaimed tiles on your board.'},
  free:{name:'Free Spot',icon:'✴️',price:0,desc:'Mark one of your tiles. It gets claimed on the next call.',target:'own'},
  swap:{name:'Swap',icon:'🔄',price:250,desc:'Swap two unclaimed tiles on your board.',target:'own2'},
  shake:{name:'Shake',icon:'🤛',price:300,desc:'Scramble the bot\u2019s unclaimed tiles.'},
  splat:{name:'Splat',icon:'💥',price:350,desc:'Blind the bot for 5 seconds.'},
  steal:{name:'Steal',icon:'🫳',price:400,desc:'Take one of the bot\u2019s claimed tiles for yourself.',target:'opp'},
  switch:{name:'Switch',icon:'↔️',price:450,desc:'Trade your entire board and claims with the bot.'},
  weaken:{name:'Weaken',icon:'⚡',price:300,desc:'Turn off the bot\u2019s powerups for 30 seconds.'},
  shine:{name:'Starlite Shine',icon:'✨',price:400,desc:'Make a tile a Starlite bonus. Win with it in your line for 2x Starlites (3 per match).',target:'own'}
};
const BOT_PU_BY_DIFF={easy:['shake','free'],normal:['shake','free'],hard:['shake','free','splat'],insane:['shake','free','splat','steal'],abysmal:['shake','free','splat','steal']};

const THEMES=[
  {id:'treesh',name:'Treesh',price:0,a:'accent',b:'#2a0b52'},
  {id:'gold',name:'Signature Gold',price:150,a:'#c3ab69',b:'#5e4a17'},
  {id:'ocean',name:'Ocean',price:150,a:'#22d3ee',b:'#0b3d63'},
  {id:'forest',name:'Forest',price:150,a:'#34d399',b:'#0f4d34'},
  {id:'sunset',name:'Sunset',price:150,a:'#fb923c',b:'#9f1239'},
  {id:'neon',name:'Hot Neon',price:150,a:'#ff2d78',b:'#4c1d95'},
  {id:'mono',name:'Mono',price:150,a:'#e5e5e5',b:'#3f3f46'},
  {id:'cosmic',name:'Cosmic Classic',price:200,a:'#b24bf3',b:'#0e6f7a'}
];

const BADGES=[
  {id:'first',icon:'🏁',name:'First Nect',desc:'Win your first match',test:s=>s.stats.wins>=1},
  {id:'hat',icon:'🎩',name:'Hat Trick',desc:'Win 3 rounds in a row',test:s=>s.stats.bestStreak>=3},
  {id:'unstop',icon:'🔥',name:'Unstoppable',desc:'Win 10 rounds in a row',test:s=>s.stats.bestStreak>=10},
  {id:'speed',icon:'⚡',name:'Speed Demon',desc:'Tap a call in under 0.5s',test:s=>s.stats.fastestMs>0&&s.stats.fastestMs<500},
  {id:'explorer',icon:'🧭',name:'Explorer',desc:'Play 6 different modes',test:s=>modesPlayed(s)>=6},
  {id:'complete',icon:'🌐',name:'Completionist',desc:'Play all 12 modes',test:s=>modesPlayed(s)>=12},
  {id:'abyss',icon:'🕳️',name:'Abyss Walker',desc:'Beat an Abysmal bot',test:s=>!!s.flags.abyss},
  {id:'big',icon:'🧱',name:'Big Board',desc:'Win a match on 6x6',test:s=>!!s.flags.big},
  {id:'survivor',icon:'💗',name:'Survivor',desc:'Reach wave 10 in Survival',test:s=>s.survivalBest>=10},
  {id:'daily',icon:'📅',name:'Daily Devotee',desc:'Win 3 Daily Challenges',test:s=>Object.values(s.daily).filter(d=>d.won).length>=3},
  {id:'puzzler',icon:'🧩',name:'Puzzle Master',desc:'Clear 10 puzzles',test:s=>Object.keys(s.puzzle).length>=10},
  {id:'zen',icon:'🍃',name:'Zen Master',desc:'Complete 50 Zen lines',test:s=>s.stats.zenLines>=50},
  {id:'fog',icon:'🌫️',name:'Fog Walker',desc:'Win a Fog of War match',test:s=>!!s.flags.fog},
  {id:'gravity',icon:'🪂',name:'Gravity Guru',desc:'Win a Gravity match',test:s=>!!s.flags.gravity},
  {id:'chaos',icon:'🌪️',name:'Chaos Tamer',desc:'Win a Chaos match',test:s=>!!s.flags.chaos},
  {id:'duel',icon:'🤝',name:'Duelist',desc:'Finish 5 Pass & Play matches',test:s=>((s.stats.byMode.pass||{}).played||0)>=5},
  {id:'collector',icon:'🎒',name:'Collector',desc:'Own 6 powerups',test:s=>s.owned.powerups.length>=6},
  {id:'hunter',icon:'🌟',name:'Starlite Hunter',desc:'Earn 500 Starlites in Nects',test:s=>s.stats.starsEarned>=500}
];
function modesPlayed(s){ return Object.values(s.stats.byMode||{}).filter(m=>m.played>0).length; }
