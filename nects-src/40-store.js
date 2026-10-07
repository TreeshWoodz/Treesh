/* ===== Storage + Treesh bridge ===== */
const LS={
  get(k,d){ try{ const v=localStorage.getItem(k); return v!=null?JSON.parse(v):d; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ return false; } }
};
const STAR_DEFAULT={points:0,lastDaily:null,streak:0,newSongs:{},minToday:0,min30Date:null,secAccum:0,totalMin:0,games:0,beats:0,log:[]};
const NECTS_KEY='nects_save_v4';

const Treesh={
  profile(){ const p=LS.get('treesh_profile',null); return (p&&typeof p==='object')?p:null; },
  name(){ const p=this.profile(); return (p&&p.nickname)||'Guest'; },
  avatarSrc(p){ p=p||this.profile(); const a=p&&(p.avatar||p.avatarUrl); return (a&&/^(data:image|https?:|blob:)/.test(a))?a:''; },
  accent(){ const a=LS.get('treesh_accent','#9328ff'); return (typeof a==='string'&&/^#[0-9a-f]{6}$/i.test(a))?a:'#9328ff'; },
  stars(){ const st=LS.get('treesh_stars',null); return Object.assign({},STAR_DEFAULT,(st&&typeof st==='object')?st:{}); },
  balance(){ return Math.max(0,Math.floor(this.stars().points||0)); },
  /* mergeKey: one Treesh activity-log entry per match, updated as rounds are won */
  earn(amount,reason,mergeKey){
    amount=Math.round(amount); if(!(amount>0)) return 0;
    const st=this.stars(); st.points=(st.points||0)+amount; st.log=Array.isArray(st.log)?st.log:[];
    const top=st.log[0];
    if(mergeKey&&top&&top.t===mergeKey){ top.a+=amount; top.r=reason; }
    else { st.log.unshift({t:mergeKey||Date.now(),a:amount,r:reason}); if(st.log.length>50) st.log.length=50; }
    LS.set('treesh_stars',st);
    S.stats.starsEarned+=amount; saveNects(); this.ping(true); return amount;
  },
  spend(amount,reason){
    const st=this.stars(); if((st.points||0)<amount) return false;
    st.points-=amount; LS.set('treesh_stars',st);
    S.spent.unshift({t:Date.now(),a:amount,r:reason}); if(S.spent.length>40) S.spent.length=40;
    S.stats.starsSpent+=amount; saveNects(); this.ping(); return true;
  },
  ping(bump){
    updateStarUI(bump);
    try{ if(window.parent&&window.parent!==window) window.parent.postMessage({source:'nects',type:'treesh-stars-updated',points:this.balance()},'*'); }catch(e){}
  },
  isHosted(){ return /(^|\.)treesh\.app$/i.test(location.hostname); },
  seedDemo(){
    LS.set('treesh_profile',{nickname:'Treesh Fan',username:'treeshfan',zodiac:'Leo',joined:Date.now()-86400000*40,avatar:''});
    const st=this.stars(); if(!st.points){ st.points=1500; st.log.unshift({t:Date.now(),a:1500,r:'Demo Starlites'}); LS.set('treesh_stars',st); }
  }
};

function defaultSave(){
  return { v:4,
    owned:{powerups:['shuffle','free'],themes:['treesh'],packs:['mixed'],modes:[]},
    equipped:{theme:'treesh',pack:'mixed'},
    settings:{sound:true,haptics:true,reduceMotion:false,rounds:3,diff:'normal',grid:'3x3',rotateP2:true,p2name:'Player 2',seenHelp:false},
    custom:{grid:'4x4',diff:'normal',speed:'normal',h:true,v:true,d:true,rounds:3,powerups:true,botPU:true},
    stats:{matches:0,wins:0,losses:0,roundsWon:0,roundsLost:0,bestStreak:0,fastestMs:0,taps:0,tapMs:0,misses:0,playMs:0,starsEarned:0,starsSpent:0,zenLines:0,byMode:{}},
    flags:{}, history:[], spent:[], badges:{}, daily:{}, puzzle:{}, survivalBest:0,
    zenDay:{date:'',earned:0}, firstWinDay:'', lastMode:'classic', migrated:false
  };
}
function deepMerge(base,over){ if(!over||typeof over!=='object') return base; for(const k in over){ const v=over[k]; if(v&&typeof v==='object'&&!Array.isArray(v)&&base[k]&&typeof base[k]==='object'&&!Array.isArray(base[k])) base[k]=deepMerge(base[k],v); else base[k]=v; } return base; }
let S=deepMerge(defaultSave(),LS.get(NECTS_KEY,null));
function saveNects(){ LS.set(NECTS_KEY,S); }

/* One-time import from the old Nects (v3) save */
function migrateOld(){
  if(S.migrated) return null;
  S.migrated=true;
  const old=LS.get('nects_player_data_v3',null);
  if(!old){ saveNects(); return null; }
  const packMap={'Smileys & Emotion':'smileys','Animals & Nature':'animals','Food & Drink':'food','Activities & Sports':'sports'};
  (old.ownedCheats||[]).forEach(id=>{ if(POWERUPS[id]&&!S.owned.powerups.includes(id)) S.owned.powerups.push(id); });
  (old.ownedEmojiThemes||[]).forEach(id=>{ const p=packMap[id]; if(p&&!S.owned.packs.includes(p)) S.owned.packs.push(p); });
  if((old.ownedThemes||[]).length>1&&!S.owned.themes.includes('cosmic')) S.owned.themes.push('cosmic');
  if(old.customModeUnlocked) S.owned.modes.push('custom');
  if(old.mirrorModeUnlocked) S.owned.modes.push('mirror');
  const g=old.globalStats||{};
  S.stats.wins+=+g.totalWins||0; S.stats.losses+=+g.totalLosses||0; S.stats.roundsWon+=+g.totalWins||0; S.stats.roundsLost+=+g.totalLosses||0;
  saveNects();
  const moved=Math.floor((+old.starlites||0)/10);
  if(moved>0) Treesh.earn(moved,'Nects: old balance moved to Treesh');
  return moved;
}

function todayKey(d){ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,rng){ rng=rng||Math.random; const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function hexRgb(h){ const n=parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255].join(','); }
function packEmojis(packId,rng){
  if(packId&&packId!=='mixed'&&PACKS[packId]) return PACKS[packId].e;
  return ALL_EMOJIS;
}
