/* ---------- P9zzw: duets in parentheses. In a section tagged with two artists the (parentheses) belong to the 2nd artist: the pill switches to them, every lyric theme tints their part and Text Messages sends it as their own text ---------- */
const lyNk=n=>normKey(n||'').replace(/[^a-z0-9]/g,'');
function lyDL(a,b){ const m=a.length, n=b.length; if(Math.abs(m-n)>2) return 9; const d=[]; for(let i=0;i<=m;i++) d[i]=[i]; for(let j=0;j<=n;j++) d[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++){ const c=a[i-1]===b[j-1]?0:1; d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c); if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1); }
  return d[m][n]; }
function lyNear(a,b){ a=lyNk(a); b=lyNk(b); if(!a||!b) return false; if(a===b) return true; if(a.length<4||b.length<4) return false;
  if(a[0]===b[0]&&[...a].sort().join('')===[...b].sort().join('')) return true; return lyDL(a,b)<=(Math.min(a.length,b.length)>=8?2:1); }
function lyFace(s,name){ const k=lyNk(name), mainId=wcMainId(s), main=mainId&&ARTIST_BY_ID[mainId];
  const a=(ARTISTS||[]).find(x=>lyNk(x.name)===k);
  if(a) return {name:a.name,id:a.id||null,img:a.image||null,main:!!((a.id&&a.id===mainId)||lyNk(a.name)===lyNk(s.artist))};
  if(lyNear(name,s.artist)) return {name:s.artist,id:mainId||null,img:(main&&main.image)||null,main:true};
  const c=wcCredit(s).map(x=>x._by).find(x=>lyNear(name,x.n)); if(c) return {name:c.n,id:c.id||null,img:c.img||null,main:false};
  return {name:String(name||'').trim(),id:null,img:null,main:false}; }
/* the section label "Chorus 1: A & B" -> ordered faces, null when only one performer */
const _lyDuoC=new Map();
function lyDuo(s,sec){ if(!s||!sec) return null; const key=s.id+'|'+sec; if(_lyDuoC.has(key)) return _lyDuoC.get(key); let r=null;
  const ci=sec.indexOf(':'), who=ci>0?sec.slice(ci+1).trim():'';
  const whole=x=>{ const k=lyNk(x); return (ARTISTS||[]).some(a=>lyNk(a.name)===k); };
  if(who&&!whole(who)){ const groups=[]; who.replace(/[\(\[]([^\)\]]*)[\)\]]/g,(m,g)=>{ if(g.trim()) groups.push(g.trim()); return ''; });
    const outside=who.replace(/[\(\[][^\)\]]*[\)\]]/g,' ').replace(/\s+/g,' ').trim();
    const split=x=>!x?[]:whole(x)?[x]:x.split(WC_SPLIT).map(y=>y.trim()).filter(Boolean);
    const seen=new Set(), names=[...split(outside),...groups.flatMap(split)].filter(n=>{ const k=lyNk(n); if(!k||seen.has(k)) return false; seen.add(k); return true; });
    if(names.length>=2){ const a=lyFace(s,names[0]), b=lyFace(s,names[1]); if(lyNk(a.name)!==lyNk(b.name)) r={role:sec.slice(0,ci).trim(),a,b}; } }
  _lyDuoC.set(key,r); return r; }
const LY_REP=/^\s*(?:x|\u00d7)\s*\d+\s*$/i;
function lyParts(text){ const out=[], re=/\(([^()]*)\)/g; let m; while((m=re.exec(text||''))){ if(!m[1].trim()||LY_REP.test(m[1])) continue; out.push([m.index,m.index+m[0].length]); } return out; }
function lyDuoLine(s,l){ if(!l||l.secOnly||!l.text) return null; const d=lyDuo(s,l.sec); return d?{d,parts:lyParts(l.text)}:null; }
const lyCol=f=>performerColor(f&&f.name);
/* line html with the 2nd artist's part wrapped (keeps bold / italic / underline / strike) */
function lySplitHtml(runs,parts,b){ const cuts=new Set(); parts.forEach(([a,e])=>{ cuts.add(a); cuts.add(a+1); cuts.add(e-1); cuts.add(e); });
  const pieces=[]; let pos=0; runs.forEach(r=>{ let st=0; for(let j=1;j<=r.t.length;j++){ if(j===r.t.length||cuts.has(pos+j)){ pieces.push(Object.assign({},r,{t:r.t.slice(st,j),p0:pos+st})); st=j; } } pos+=r.t.length; });
  let out='', cur=null;
  pieces.forEach(pc=>{ const pi=parts.findIndex(([a,e])=>pc.p0>=a&&pc.p0<e), h=rtRunsHtml([pc],true);
    if(pi<0){ if(cur!=null){ out+='</span>'; cur=null; } out+=h; return; }
    if(cur!==pi){ if(cur!=null) out+='</span>'; out+=`<span class="ly-alt" data-ly-who="${esc(b.name)}" style="--ac:${lyCol(b)}">`; cur=pi; }
    const [a,e]=parts[pi]; out+=(pc.t.length===1&&(pc.p0===a||pc.p0===e-1))?`<span class="ly-p">${h}</span>`:h; });
  if(cur!=null) out+='</span>'; return out; }
lyLineHtml=function(s,l){ const x=lyDuoLine(s,l); if(!x||!x.parts.length) return lyFmt(l); return lySplitHtml(rtRuns(lyMdOf(l)),x.parts,x.d.b); };
/* when each (part) is sung: word timings if the line has them, else its share of the line's time */
const _lyPTC=new WeakMap();
function lyPT(s,L,idx){ const l=L[idx]; if(!l) return null; if(_lyPTC.has(l)) return _lyPTC.get(l); const x=lyDuoLine(s,l); let r=null;
  if(x&&x.parts.length){ const N=Math.max(1,l.text.length), T0=+l.t||0; let T1=null; for(let j=idx+1;j<L.length;j++){ const u=L[j]; if(u&&typeof u.t==='number'&&u.t>T0+0.05){ T1=u.t; break; } }
    if(T1==null||T1-T0>14) T1=T0+Math.min(8,Math.max(1.6,N*0.075));
    const W=l.words&&l.words.length?l.words:null, tk=[]; if(W){ const re=/\S+/g; let m; while((m=re.exec(l.text))) tk.push(m.index); }
    const at=(c,end)=>{ if(W){ if(end){ const k=tk.findIndex(p=>p>=c); return k>=0&&W[k]!=null?+W[k]:T1; } let wi=-1; for(let k=0;k<tk.length;k++){ if(tk[k]<=c) wi=k; else break; } if(wi>=0&&W[wi]!=null) return +W[wi]; } return T0+(T1-T0)*(c/N); };
    r=x.parts.map(([a,e])=>[at(a,false), e>=N?T1:at(e,true)]); }
  _lyPTC.set(l,r); return r; }
function lyIdx(L,t){ let idx=-1; for(let i=0;i<L.length;i++){ if(L[i].t<=t+0.15) idx=i; else break; } return idx; }
function lyWhoAt(s,L,idx,t){ const p=lyPT(s,L,idx); return p&&p.some(([a,e])=>t>=a&&t<e)?1:0; }

/* close spellings in a section label ("Marc Q") use the song's own artist ("Marq C") */
const _ps9zzw=parseSection; parseSection=function(sec,song){ const r=_ps9zzw.apply(this,arguments); if(!r||!r.desc||!song) return r;
  const keep=[]; r.desc.split(/\s*,\s*/).forEach(n=>{ const f=lyFace(song,n); if(n&&(f.main||f.id||lyNk(f.name)!==lyNk(n))){ if(!r.artists.some(a=>lyNk(a.name)===lyNk(f.name))) r.artists.push({name:f.name,image:f.img,id:f.id}); } else if(n) keep.push(n); });
  r.desc=keep.join(', '); return r; };
function lyAllAlt(l){ const P=lyParts(l&&l.text); if(!P.length) return false; let r=l.text; for(let k=P.length-1;k>=0;k--) r=r.slice(0,P[k][0])+r.slice(P[k][1]); return !r.trim(); }
const _wclb9zzw=wcLineBy; wcLineBy=function(s,L,i){ const l=L&&L[i], d=l&&lyDuo(s,l.sec); if(d){ const f=lyAllAlt(l)?d.b:d.a; return f.main?null:{n:f.name,id:f.id||null,img:f.img||null}; } return _wclb9zzw.apply(this,arguments); };
const _ic9zzw=indexCatalog; indexCatalog=function(){ _lyDuoC.clear(); return _ic9zzw.apply(this,arguments); };

/* performer pill: both artists, the one singing right now lights up */
const _upf9zzw=updatePerformer; updatePerformer=function(sec){ const s=curSong(), d=s&&sec?lyDuo(s,sec):null, box=document.getElementById('np-performer');
  if(!d||!box){ if(box) box.dataset.duo=''; return _upf9zzw.apply(this,arguments); }
  const o=perfOpts(), key='duo|'+sec+'|'+JSON.stringify(o); if(_perfKey===key){ lySpeakSync(); return; } _perfKey=key;
  box.className='pointer-events-none absolute inset-x-0 z-20 flex justify-center px-2 '+(o.pos==='bottom'?'bottom-1 pb-1':'top-0 pt-1');
  if(!o.show){ box.innerHTML=''; box.dataset.duo=''; return; }
  box.innerHTML=buildPerformerHtml({role:d.role,artists:[d.a,d.b].map(f=>({name:f.name,image:f.img,id:f.id}))},o); box.dataset.duo='1'; box._who=null; icons(); lySpeakSync(); };
function lySpeakSync(){ const box=document.getElementById('np-performer'); if(!box||box.dataset.duo!=='1') return; const s=curSong(); if(!s) return;
  const L=s.lyrics||[], t=state.currentTime||0, idx=lyIdx(L,t); if(idx<0) return; const who=lyWhoAt(s,L,idx,t); if(box._who===who) return; box._who=who;
  box.querySelectorAll('[data-act="perf-artist"]').forEach((p,k)=>{ p.classList.toggle('ly-speak',k===who); p.classList.toggle('ly-quiet',k!==who); p.setAttribute('aria-current',k===who?'true':'false'); });
  box.dataset.who=who?'b':'a'; }
const _ulh9zzw=updateLyricHighlight; updateLyricHighlight=function(){ const r=_ulh9zzw.apply(this,arguments); try{ lySpeakSync(); }catch(e){} return r; };
const _uk9zzw=updateKaraoke; updateKaraoke=function(){ const r=_uk9zzw.apply(this,arguments); try{ lySpeakSync(); }catch(e){} return r; };

/* Text Messages: the (part) is its own text from the 2nd artist */
const _lcb9zzw=lytChatBuild; lytChatBuild=function(c,s){ const r=_lcb9zzw.apply(this,arguments); try{ lyChatSplit(c,s); }catch(e){ console.warn('duo chat',e); } state.lyricLines=(state.lyricLines||[]).filter(el=>!el.closest('.ly-alt-row')); return r; };
function lyChatSplit(c,s){ const L=s.lyrics||[];
  c.querySelectorAll('.wc-row[data-line-wrap]:not([data-duo]):not(.ly-alt-row)').forEach(w=>{ w.dataset.duo='1'; const i=+w.dataset.lineWrap, x=lyDuoLine(s,L[i]); if(!x||!x.parts.length) return;
    const b=w.querySelector('.np-line'); if(!b) return; const alts=[...b.querySelectorAll('.ly-alt')]; if(!alts.length) return;
    const inner=alts.map(a=>{ const cl=a.cloneNode(true); cl.querySelectorAll('.ly-p').forEach(p=>p.remove()); return cl.innerHTML.trim(); });
    alts.forEach(a=>{ const p=a.previousSibling; if(p&&p.nodeType===3) p.data=p.data.replace(/\s+$/,''); a.remove(); });
    const main=(b.textContent||'').trim(), face=x.d.b.main?s:wcByFace({n:x.d.b.name,id:x.d.b.id,img:x.d.b.img},s), pt=lyPT(s,L,i)||[];
    const html=inner.map((h,k)=>!h?'':`<div class="wc-row is-a ly-alt-row" data-line-wrap="${i}" data-ly-t="${pt[k]?pt[k][0].toFixed(2):L[i].t}" data-who="${esc(wcWho(face))}" data-testid="lyt-chat-alt-${i}-${k}">${wnAv(false,face)}<div class="relative wc-col"><span class="wc-name">${esc(face.artist||'Artist')}</span><button type="button" data-act="lyric-seek" data-t="${pt[k]?pt[k][0].toFixed(2):L[i].t}" data-i="${i}" class="np-line wc-b">${h}</button></div></div>`).join('');
    w.insertAdjacentHTML('afterend',html); if(!main) w.classList.add('ly-gone'); let n=w.nextElementSibling; while(n&&n.classList.contains('ly-alt-row')){ const nb=n.querySelector('.np-line'); if(nb) try{ wireLyricLine(nb); }catch(e){} n=n.nextElementSibling; } });
  lytRegroup(c); }
function lyAltTick(){ const c=document.getElementById('np-lyrics'); if(!c||c.dataset.lyt!=='chat') return; const s=curSong(); if(!s) return; const t=state.currentTime||0, idx=lyIdx(s.lyrics||[],t);
  let moved=false, last=null;
  c.querySelectorAll('.ly-alt-row').forEach(w=>{ const i=+w.dataset.lineWrap; if(i!==idx){ w._on=i<idx; return; }
    const on=t>=parseFloat(w.dataset.lyT||0)-0.15; w.classList.toggle('lyt-fut',!on); w.classList.toggle('lyt-act',on); w.classList.remove('lyt-past');
    if(on&&w._on===false){ moved=true; w.classList.add('wc-in'); setTimeout(()=>w.classList.remove('wc-in'),700); } w._on=on; if(on) last=w; });
  if(last){ const bb=last.querySelector('.wc-b'); if(bb) bb.classList.add('is-live'); const rr=c.querySelector('.lyt-rr'), col=last.querySelector('.wc-col'); if(rr&&col&&rr.parentElement!==col) col.appendChild(rr); }
  if(moved){ lytRegroup(c); if(c.classList.contains('lyt-progressive')) lytScrollEnd(c); } }
const _lt9zzw=lytTick; lytTick=function(){ const r=_lt9zzw.apply(this,arguments); try{ lyAltTick(); }catch(e){} return r; };
const _rll9zzw=refreshLyricLine; refreshLyricLine=function(i){ document.querySelectorAll('#np-lyrics .ly-alt-row[data-line-wrap="'+i+'"]').forEach(x=>x.remove()); return _rll9zzw.apply(this,arguments); };
/* Text Messages / Terminal follow the newest message themselves: the player's "center the active line" scroll used to pull the chat back up
   to the 1st artist's bubble every tick (and to the very top when that bubble is hidden because the whole line is the 2nd artist's) */
function lyOwnScroll(){ const c=document.getElementById('np-lyrics'); if(!c||!c.classList.contains('lyt-progressive')) return false; lytFollow(c); return true; }
function lytFollow(c){ if(c.scrollHeight-c.clientHeight-c.scrollTop<=2) return; const now=Date.now(); if(c._lytFH===c.scrollHeight&&now-(c._lytF||0)<450) return; c._lytF=now; c._lytFH=c.scrollHeight; c.scrollTo({top:c.scrollHeight,behavior:state.perfMode?'auto':'smooth'}); }
