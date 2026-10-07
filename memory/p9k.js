/* ---------- P9k: Lyric Studio, bold/italic show as real formatting (no stars in the editor) ---------- */
const LS_MB='\u200B', LS_MI='\uFEFF';
const LS_BOLD_RE=/(^|[\s(\[{"'\u201C\u2018\/-])\*\*(?=[^\s*])([^*\n]*?[^\s*])\*\*(?=$|[\s)\]}"'\u201D\u2019.,!?;:\/-])/g;
const LS_ITAL_RE=/(^|[\s(\[{"'\u201C\u2018\/-])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?=$|[\s)\]}"'\u201D\u2019.,!?;:\/-])/g;
function lsMdConv(s,b,i){ return String(s||'').replace(LS_BOLD_RE,(m,p,x)=>p+b[0]+x+b[1]).replace(LS_ITAL_RE,(m,p,x)=>p+i[0]+x+i[1]); }
function lsMdToTa(s){ return lsMdConv(String(s||'').replace(/[\u200B\uFEFF]/g,''),[LS_MB,LS_MB],[LS_MI,LS_MI]); }
function lsTaToMd(s){ return String(s||'').replace(/\u200B([^\u200B\n]*)\u200B/g,(m,x)=>x.trim()?'**'+x+'**':x).replace(/\uFEFF([^\uFEFF\n]*)\uFEFF/g,(m,x)=>x.trim()?'*'+x+'*':x).replace(/[\u200B\uFEFF]/g,''); }
lsInlineFmt=function(text){ const s=lsMdConv(lsTaToMd(text),['\u0001','\u0002'],['\u0003','\u0004']); return esc(s).replace(/\u0001/g,'<strong>').replace(/\u0002/g,'</strong>').replace(/\u0003/g,'<em>').replace(/\u0004/g,'</em>'); };
lsStripFmt=function(text){ return lsMdConv(lsTaToMd(text),['',''],['','']); };
const _lpw9k=lsParseWriteText; lsParseWriteText=function(text,prev){ return _lpw9k.call(this,lsTaToMd(text),prev); };
function lsMarkToggle(M){ const ta=$("#ls-write"); if(!ta) return; const v=ta.value; let s=ta.selectionStart||0, e=ta.selectionEnd||s;
  const set=(nv,a,b)=>{ ta.value=nv; ta.focus(); try{ ta.setSelectionRange(a,b); }catch(_){} ta.dispatchEvent(new Event('input',{bubbles:true})); };
  if(s===e){ if(v[s-1]===M&&v[s]===M){ set(v.slice(0,s-1)+v.slice(s+1),s-1,s-1); return; } set(v.slice(0,s)+M+M+v.slice(s),s+1,s+1); return; }
  if(v[s-1]===M&&v[e]===M){ set(v.slice(0,s-1)+v.slice(s,e)+v.slice(e+1),s-1,e-1); return; }
  const sel=v.slice(s,e); if(sel[0]===M&&sel[sel.length-1]===M&&sel.length>1){ const inner=sel.slice(1,-1); set(v.slice(0,s)+inner+v.slice(e),s,s+inner.length); return; }
  const lead=sel.match(/^\s*/)[0].length, trail=sel.match(/\s*$/)[0].length; const core=sel.slice(lead,sel.length-trail).split(M).join(''); if(!core){ return; }
  const nv=v.slice(0,s+lead)+M+core+M+v.slice(e-trail); set(nv,s+lead+1,s+lead+1+core.length); }
const _lsMk9k=lsMarkup; lsMarkup=function(type){ if(type==='bold') return lsMarkToggle(LS_MB); if(type==='italic') return lsMarkToggle(LS_MI); return _lsMk9k.apply(this,arguments); };
document.addEventListener('input',e=>{ const ta=e.target; if(!ta||ta.id!=='ls-write'||e.isComposing) return; const v=ta.value; if(v.indexOf('*')<0) return;
  const c=ta.selectionStart||0, L=lsMdToTaKeep(v.slice(0,c)), R=lsMdToTaKeep(v.slice(c)); if(L+R===v) return; ta.value=L+R; try{ ta.setSelectionRange(L.length,L.length); }catch(_){} },true);
function lsMdToTaKeep(s){ return lsMdConv(s,[LS_MB,LS_MB],[LS_MI,LS_MI]); }
document.addEventListener('paste',e=>{ const ta=e.target; if(!ta||ta.id!=='ls-write'||!e.clipboardData) return; const t=e.clipboardData.getData('text/plain'); if(!t) return; e.preventDefault();
  const clean=lsMdToTa(t.replace(/\r\n?/g,'\n')); const s=ta.selectionStart||0, en=ta.selectionEnd||s; ta.value=ta.value.slice(0,s)+clean+ta.value.slice(en); const c=s+clean.length; try{ ta.setSelectionRange(c,c); }catch(_){} ta.dispatchEvent(new Event('input',{bubbles:true})); },true);
['copy','cut'].forEach(ev=>document.addEventListener(ev,e=>{ const ta=e.target; if(!ta||ta.id!=='ls-write'||!e.clipboardData) return; const s=ta.selectionStart||0, en=ta.selectionEnd||s; if(s===en) return; e.preventDefault(); e.clipboardData.setData('text/plain',lsTaToMd(ta.value.slice(s,en)));
  if(ev==='cut'){ ta.value=ta.value.slice(0,s)+ta.value.slice(en); try{ ta.setSelectionRange(s,s); }catch(_){} ta.dispatchEvent(new Event('input',{bubbles:true})); } },true));
function lsSyncFmtViews(){ document.querySelectorAll('#ls-lines .ls-line input[data-ls-text]').forEach(inp=>{ let v=inp.parentElement.querySelector(':scope > .ls-fmt-view'); const has=/\*/.test(inp.value)&&lsStripFmt(inp.value)!==inp.value;
    if(!has){ if(v) v.remove(); inp.classList.remove('ls-fmt-in'); return; }
    if(!v){ v=document.createElement('span'); v.className='ls-fmt-view'; v.setAttribute('aria-hidden','true'); inp.insertAdjacentElement('afterend',v); }
    v.innerHTML=lsInlineFmt(inp.value); inp.classList.add('ls-fmt-in'); const p=inp.parentElement; if(getComputedStyle(p).position==='static') p.style.position='relative';
    v.style.left=inp.offsetLeft+'px'; v.style.top=inp.offsetTop+'px'; v.style.width=inp.offsetWidth+'px'; v.style.height=inp.offsetHeight+'px'; }); }
window.addEventListener('resize',()=>{ if(state.lsOpen&&state.ls&&state.ls.mode==='sync') try{ lsSyncFmtViews(); }catch(e){} });
const _lsRB9k=lsRenderBody; lsRenderBody=function(){ const r=_lsRB9k.apply(this,arguments); try{ lsSyncFmtViews(); }catch(e){} return r; };
document.addEventListener('focusout',e=>{ if(e.target&&e.target.matches&&e.target.matches('#ls-lines input[data-ls-text]')) setTimeout(lsSyncFmtViews,0); });
const _lsSA9k=lsSetActive; lsSetActive=function(){ const r=_lsSA9k.apply(this,arguments); const st=document.getElementById('ls-next-label'); if(st&&/\*/.test(st.textContent)) st.textContent=lsStripFmt(st.textContent); return r; };

/* ---------- P9k: voice, the app stays visible; after a command the orb shrinks to a pill so you see the change ---------- */
function vxSnap(){ let cs=null; try{ cs=curSong(); }catch(e){} const m=document.getElementById('modal'), m2=document.getElementById('modal2');
  return JSON.stringify([state.view,state.param,cs&&cs.id,audio.paused,state.theme,state.accent,state.npOpen,state.queueOpen,state.profileOpen,state.searchOpen,state.lsOpen,state.umOpen,state.shuffle,state.repeat,Math.round((audio.volume||0)*100),audio.muted,m&&m.childElementCount,m2&&m2.childElementCount,(document.documentElement.className||'').replace(/\bmkd-on\b/,''),state.settingsTab,state.favorites&&state.favorites.size,(state.queue||[]).length,state.mkEdit]); }
function vx3Mini(on){ const v=document.getElementById('voice-ov'); if(!v||!v.classList.contains('vx3')) return; on=!!on; if(v.classList.contains('is-mini')===on) return; v.classList.toggle('is-mini',on);
  const o=v.querySelector('.vx-orb'); if(o){ o.setAttribute('aria-label',on?'Show voice assistant':'Toggle microphone'); o.setAttribute('data-testid',on?'voice-mini-orb':'voice-listening-orb'); }
  const w=v.querySelector('.vx3-orbwrap'); if(w) w.setAttribute('data-testid',on?'voice-mini-pill':'voice-orb-wrap'); try{ syncScrollLock(); }catch(e){} }
const _vxApply9k=voiceApply; voiceApply=function(text){ const before=vxSnap(); const r=_vxApply9k.apply(this,arguments); const v=document.getElementById('voice-ov');
  if(v&&v.classList.contains('vx3')&&!v.classList.contains('tr-fade-out')){ setTimeout(()=>{ const now=vxSnap(); if(now!==before) vx3Mini(true); else if(v.classList.contains('is-mini')&&_voiceLast&&_voiceLast.reply) vx3Mini(false); },260); } return r; };
const _ovo9k=overlaysOpen; overlaysOpen=function(){ const v=document.getElementById('voice-ov'); if(!(v&&v.classList.contains('is-mini'))) return _ovo9k.apply(this,arguments);
  const L=listening; v.removeAttribute('id'); listening=false; try{ return _ovo9k.apply(this,arguments); } finally{ v.id='voice-ov'; listening=L; } };
window.addEventListener('click',e=>{ const v=document.getElementById('voice-ov'); if(!v||!v.classList.contains('is-mini')) return; const w=e.target&&e.target.closest&&e.target.closest('#voice-ov .vx3-orbwrap'); if(!w) return; e.preventDefault(); e.stopImmediatePropagation(); vx3Mini(false); },true);

/* ---------- P9k: Music Manager, songs and covers from a link ---------- */
let _umSrc='file';
function umHost(u){ try{ return new URL(u).hostname.replace(/^www\./,''); }catch(e){ return 'link'; } }
function umLinkName(u){ try{ const p=decodeURIComponent(new URL(u).pathname.split('/').filter(Boolean).pop()||''); return p||umHost(u); }catch(e){ return u; } }
function umNormLink(raw){ let u=String(raw||'').trim(); if(!u) return ''; if(!/^[a-z][a-z0-9+.-]*:/i.test(u)) u='https://'+u.replace(/^\/+/,''); let x; try{ x=new URL(u); }catch(e){ return ''; } if(!/^https?:$/.test(x.protocol)) return '';
  if(/(^|\.)dropbox\.com$/i.test(x.hostname)&&!/dropboxusercontent/i.test(x.hostname)){ x.hostname='dl.dropboxusercontent.com'; x.searchParams.delete('dl'); x.searchParams.delete('raw'); }
  const gd=/^\/file\/d\/([^/]+)/.exec(x.pathname); if(/drive\.google\.com$/i.test(x.hostname)&&gd) return 'https://drive.google.com/uc?export=download&id='+gd[1];
  if(/^github\.com$/i.test(x.hostname)){ const m=/^\/([^/]+)\/([^/]+)\/blob\/(.+)$/.exec(x.pathname); if(m) return 'https://raw.githubusercontent.com/'+m[1]+'/'+m[2]+'/'+m[3]; }
  return x.toString(); }
function umProbeAudio(url,cors){ return new Promise(res=>{ const a=new Audio(); let done=false; const fin=r=>{ if(done) return; done=true; clearTimeout(t); try{ a.removeAttribute('src'); a.load(); }catch(e){} res(r); };
  const t=setTimeout(()=>fin({ok:false,timeout:true}),14000); if(cors) a.crossOrigin='anonymous'; a.preload='metadata';
  a.addEventListener('loadedmetadata',()=>fin({ok:true,dur:isFinite(a.duration)?a.duration:0})); a.addEventListener('error',()=>fin({ok:false})); a.src=url; try{ a.load(); }catch(e){} }); }
async function umCheckLink(url){ const a=await umProbeAudio(url,true); if(a.ok) return {ok:true,dur:a.dur}; if(a.timeout) return {ok:true,dur:0,unsure:true};
  const b=await umProbeAudio(url,false); return b.ok?{ok:false,why:'cors'}:{ok:false,why:b.timeout?'slow':'bad'}; }
function umSrcTabs(){ const b=(k,ic,l)=>`<button type="button" role="tab" aria-selected="${_umSrc===k}" data-act="um-src" data-val="${k}" data-testid="um-src-${k}" class="umx-seg-b${_umSrc===k?' on':''}"><i data-lucide="${ic}"></i>${l}</button>`;
  return `<div class="umx-seg umx-src" role="tablist" aria-label="How to add songs" data-testid="um-source-tabs">${b('file','upload','Upload file')}${b('link','link-2','Paste link')}</div>`; }
function umLinkForm(n){ return `<form class="umx-lform" data-um-link novalidate data-testid="um-link-form"><span class="umx-drop-ic"><i data-lucide="link-2"></i></span><div class="min-w-0 flex-1"><b>${n?'Add another song from a link':'Add a song from a link'}</b><small>Paste a direct link to an audio file (MP3, M4A, WAV, OGG). Dropbox and GitHub share links work too.</small>
  <div class="umx-lrow"><input id="um-link-in" type="url" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="https://example.com/song.mp3" class="umx-in" data-testid="um-link-input"><button type="submit" class="um-pill is-primary press" data-testid="um-link-add"><i data-lucide="plus"></i><span>Add</span></button></div><p id="um-link-msg" class="umx-lmsg" role="status" aria-live="polite" data-testid="um-link-msg"></p></div></form>`; }
function umCovPanel(it,i){ const t=it.covTab||'file';
  return `<div class="umx-cov" data-testid="um-queue-cover-panel-${i}"><div class="umx-seg" role="tablist"><button type="button" role="tab" data-act="um-cov-tab" data-qid="${it.qid}" data-val="file" data-testid="um-cover-tab-file-${i}" class="umx-seg-b${t==='file'?' on':''}"><i data-lucide="upload"></i>Upload file</button><button type="button" role="tab" data-act="um-cov-tab" data-qid="${it.qid}" data-val="link" data-testid="um-cover-tab-link-${i}" class="umx-seg-b${t==='link'?' on':''}"><i data-lucide="link-2"></i>Paste link</button></div>
   ${t==='file'?`<button type="button" data-act="um-q-cover" data-qid="${it.qid}" data-testid="um-cover-choose-${i}" class="umx-cov-pick press"><i data-lucide="image-plus"></i>Choose an image</button>`:`<div class="umx-lrow"><input id="umq-cl-${it.qid}" type="url" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(it.coverLink||'')}" placeholder="https://example.com/cover.jpg" class="umx-in" data-testid="um-cover-link-input-${i}"><button type="button" data-act="um-cov-link" data-qid="${it.qid}" data-testid="um-cover-link-apply-${i}" class="um-pill is-primary press">Use</button></div>`}
   ${it.coverUrl?`<button type="button" data-act="um-cov-rm" data-qid="${it.qid}" data-testid="um-cover-remove-${i}" class="umx-link press">Remove cover</button>`:''}</div>`; }
function umImgOk(url){ return new Promise(res=>{ const im=new Image(); const t=setTimeout(()=>res(false),12000); im.onload=()=>{ clearTimeout(t); res((im.naturalWidth||0)>0); }; im.onerror=()=>{ clearTimeout(t); res(false); }; im.src=url; }); }
async function umLinkAdd(){ const inp=document.getElementById('um-link-in'), msg=document.getElementById('um-link-msg'), btn=document.querySelector('[data-testid="um-link-add"]'); if(!inp) return;
  const say=(k,t)=>{ if(msg){ msg.textContent=t||''; msg.className='umx-lmsg'+(k?' is-'+k:''); } };
  const url=umNormLink(inp.value); if(!url){ say('err','Paste a full link that starts with https://'); inp.focus(); return; }
  if(_umQ.some(x=>x.url===url)){ say('err','That link is already in your list.'); return; }
  if(!navigator.onLine){ say('err','You\u2019re offline. Connect to the internet to add a link.'); return; }
  if(btn){ btn.disabled=true; btn.classList.add('is-busy'); } say('','Checking the link\u2026');
  const r=await umCheckLink(url); if(btn){ btn.disabled=false; btn.classList.remove('is-busy'); }
  if(!r.ok){ say('err',r.why==='cors'?'That site won\u2019t let other apps stream its audio. Try a Dropbox, GitHub or direct file link, or download the song and upload it.':r.why==='slow'?'That link took too long to answer. Check it and try again.':'Couldn\u2019t play that link. Make sure it points straight to an audio file.'); return; }
  umQSync(); const nm=umLinkName(url).replace(/\.[a-z0-9]{2,5}$/i,'').replace(/[_+]+/g,' ').trim();
  _umQ.push({qid:'q'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),file:null,url,title:(nm&&nm!==umHost(url)?nm:'New song').slice(0,120),artist:'You',genre:'',cover:null,coverUrl:'',coverLink:'',dur:r.dur||0});
  umUpRender(); setTimeout(()=>{ const m=document.getElementById('um-link-msg'); if(m){ m.textContent=r.unsure?'Added. We couldn\u2019t fully check it here, so give it a test play.':'Added. Give it a title, then save.'; m.className='umx-lmsg is-ok'; } },0); }
async function umCovLink(qid){ const it=_umQ.find(x=>x.qid===qid); const inp=document.getElementById('umq-cl-'+qid); if(!it||!inp) return; const url=umNormLink(inp.value); if(!url){ toast('Paste a full image link','It should start with https://'); inp.focus(); return; }
  const b=document.querySelector('[data-act="um-cov-link"][data-qid="'+qid+'"]'); if(b){ b.disabled=true; b.textContent='Checking\u2026'; }
  const ok=await umImgOk(url); if(b){ b.disabled=false; b.textContent='Use'; } if(!ok){ toast('That image didn\u2019t load','Use a direct link to a JPG, PNG or WebP'); return; }
  umQSync(); if(/^blob:/.test(it.coverUrl||'')){ try{ URL.revokeObjectURL(it.coverUrl); }catch(e){} } it.cover=null; it.coverLink=url; it.coverUrl=url; it.covOpen=false; umUpRender(); toast('Cover added'); }
const _urts9k=userRecToSong; userRecToSong=function(rec){ const s=_urts9k.apply(this,arguments); if(s&&rec){ if(!rec.audioBlob&&rec.audioLink) s.audioUrl=rec.audioLink; if(!rec.coverBlob&&rec.coverLink) s.coverArt=rec.coverLink; if(rec.audioLink&&!rec.audioBlob) s.isLink=true; } return s; };
document.addEventListener('submit',e=>{ const f=e.target; if(f&&f.matches&&f.matches('form[data-um-link]')){ e.preventDefault(); umLinkAdd(); } });
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const q=t.dataset.qid, it=q&&_umQ.find(x=>x.qid===q);
  switch(t.dataset.act){
    case 'um-src': umQSync(); _umSrc=t.dataset.val==='link'?'link':'file'; umUpRender(); if(_umSrc==='link') setTimeout(()=>{ const i=document.getElementById('um-link-in'); if(i&&window.innerWidth>=640) i.focus(); },40); break;
    case 'um-q-cov-open': if(!it) break; umQSync(); it.covOpen=!it.covOpen; umUpRender(); break;
    case 'um-cov-tab': if(!it) break; umQSync(); it.covTab=t.dataset.val; umUpRender(); if(it.covTab==='link') setTimeout(()=>{ const i=document.getElementById('umq-cl-'+q); if(i) i.focus(); },40); break;
    case 'um-cov-link': umCovLink(q); break;
    case 'um-cov-rm': if(!it) break; umQSync(); if(/^blob:/.test(it.coverUrl||'')){ try{ URL.revokeObjectURL(it.coverUrl); }catch(_){} } it.cover=null; it.coverLink=''; it.coverUrl=''; umUpRender(); break;
    case 'am-cover-link': amCoverLinkApply(); break;
    case 'am-audio-link': amAudioLinkApply(); break;
  } });
document.addEventListener('keydown',e=>{ const t=e.target; if(e.key!=='Enter'||!t||!t.id) return; if(/^umq-cl-/.test(t.id)){ e.preventDefault(); umCovLink(t.id.slice(7)); } else if(t.id==='am-cover-link'){ e.preventDefault(); amCoverLinkApply(); } else if(t.id==='am-audio-link'){ e.preventDefault(); amAudioLinkApply(); } });
/* track editor: cover + audio from a link */
let _amCoverLink9='', _amAudioLink9='', _amAudioDur9=0;
const _umEO9k=umEditOpen; umEditOpen=function(id){ _amCoverLink9=''; _amAudioLink9=''; _amAudioDur9=0; const r=_umEO9k.apply(this,arguments);
  try{ const up=document.querySelector('#um-edit [data-testid="te-cover-upload"]'); const row=up&&up.parentElement; if(row&&!document.getElementById('am-cover-link')) row.insertAdjacentHTML('afterend',`<div class="umx-lrow mt-3" data-testid="te-cover-link-row"><input id="am-cover-link" type="url" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Or paste an image link" class="umx-in" data-testid="te-cover-link-input"><button type="button" data-act="am-cover-link" data-testid="te-cover-link-apply" class="te-btn press"><i data-lucide="link-2"></i>Use link</button></div>`);
    const ai=document.getElementById('am-audio'); if(ai&&!document.getElementById('am-audio-link')) ai.insertAdjacentHTML('afterend',`<div class="umx-lrow mt-2.5" data-testid="te-audio-link-row"><input id="am-audio-link" type="url" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Or paste an audio link" class="umx-in" data-testid="te-audio-link-input"><button type="button" data-act="am-audio-link" data-testid="te-audio-link-apply" class="te-btn press"><i data-lucide="link-2"></i>Use link</button></div><p id="am-audio-link-msg" class="umx-lmsg" data-testid="te-audio-link-msg"></p>`);
    icons(); }catch(e){ console.warn('editor links',e); } return r; };
async function amCoverLinkApply(){ const inp=document.getElementById('am-cover-link'); if(!inp) return; const url=umNormLink(inp.value); if(!url){ toast('Paste a full image link','It should start with https://'); inp.focus(); return; }
  const b=document.querySelector('[data-testid="te-cover-link-apply"]'); if(b) b.disabled=true; const ok=await umImgOk(url); if(b) b.disabled=false; if(!ok){ toast('That image didn\u2019t load','Use a direct link to a JPG, PNG or WebP'); return; }
  _amCoverLink9=url; _amCoverBlob=null; const pv=document.getElementById('am-cover-preview'), ph=document.getElementById('am-cover-ph'); if(pv){ pv.src=url; pv.style.display='block'; } if(ph) ph.style.display='none';
  document.querySelectorAll('#um-edit .te-thumb,#um-edit .te-hero-bg').forEach(el=>{ el.innerHTML='<img src="'+esc(url)+'" alt="">'; }); state._teDirty=true; toast('Cover link ready','Tap Save to keep it'); }
async function amAudioLinkApply(){ const inp=document.getElementById('am-audio-link'), m=document.getElementById('am-audio-link-msg'); if(!inp) return; const say=(k,t)=>{ if(m){ m.textContent=t||''; m.className='umx-lmsg'+(k?' is-'+k:''); } };
  const url=umNormLink(inp.value); if(!url){ say('err','Paste a full link that starts with https://'); inp.focus(); return; } say('','Checking the link\u2026');
  const r=await umCheckLink(url); if(!r.ok){ say('err',r.why==='cors'?'That site blocks streaming in other apps. Try a Dropbox, GitHub or direct file link.':'Couldn\u2019t play that link. It should point straight to an audio file.'); return; }
  _amAudioLink9=url; _amAudioDur9=r.dur||0; const nm=document.getElementById('am-audio-name'); if(nm) nm.textContent=umLinkName(url); try{ amSetPreview(url,true,umLinkName(url)); }catch(_){} state._teDirty=true; say('ok','Link ready. Tap Save to switch the audio.'); }
const _sct9k=saveCustomTrack; saveCustomTrack=async function(){ const id=_amEditId; if(id&&(_amCoverLink9||_amAudioLink9)&&String(_amVal('am-title')||'').trim()){ try{ const rec=await idbGet(id); if(rec){
      if(_amCoverLink9&&!_amCoverBlob){ rec.coverLink=_amCoverLink9; rec.coverBlob=null; rec.coverType=''; }
      const af=document.getElementById('am-audio'); if(_amAudioLink9&&!(af&&af.files&&af.files[0])){ rec.audioLink=_amAudioLink9; rec.audioBlob=null; rec.audioType=''; rec.duration=_amAudioDur9||rec.duration||0; }
      await idbPut(rec); } }catch(e){ console.warn('link save',e); } _amCoverLink9=''; _amAudioLink9=''; }
  return _sct9k.apply(this,arguments); };

/* ---------- P9k: Magic Markup on your profile ---------- */
function pfMkKeys(){ const P=(mkS().pages||{}).profile; return (P&&P.deep&&typeof P.deep==='object')?P.deep:null; }
function pfMkApply(){ const D=pfMkKeys(); if(!D||!document.getElementById('profile-scroll')) return; const was=_mkd.prof; _mkd.prof=true; const edit=!!(_mkd.on&&was);
  try{ Object.keys(D).forEach(k=>{ const el=mkdFind(k); if(el) mkdApplyEl(el,D[k],edit); }); }finally{ _mkd.prof=was; } }
function pfMkStart(){ if(!state.profileOpen) openProfile(); if(state.settingsEditProfile){ state.settingsEditProfile=false; renderProfile(); } if(_mkd.on&&!_mkd.prof) mkdOff(true);
  _mkd.on=true; _mkd.prof=true; _mkd.key=null; _mkd.el=null; _mkd.page='profile'; mkPage('profile'); document.documentElement.classList.add('mkd-on','mkd-prof'); pfMkApply(); mkdPanel(); mkdBoxLoop();
  toast('Tap anything on your profile','Move, resize, hide or restyle it. Tap the check when you\u2019re done'); }
const _mkdOff9k=mkdOff; mkdOff=function(){ document.documentElement.classList.remove('mkd-prof'); return _mkdOff9k.apply(this,arguments); };
const _rpf9k=renderProfile; renderProfile=function(){ const r=_rpf9k.apply(this,arguments); try{ pfMkApply(); }catch(e){ console.warn('profile markup',e); } return r; };
const _sph9k=settingsProfileHtml; settingsProfileHtml=function(editing){ const h=_sph9k.apply(this,arguments); if(editing) return h;
  return h.replace('<button data-act="settings-edit-profile" data-val="on" data-testid="hero-edit-profile"','<button type="button" data-act="pf-mk" data-testid="hero-customize-profile" aria-label="Customize your profile with Magic Markup" title="Customize with Magic Markup" class="pf-bubble press grid h-10 w-10 place-items-center rounded-full"><i data-lucide="wand-sparkles" style="width:17px;height:17px"></i></button><button data-act="settings-edit-profile" data-val="on" data-testid="hero-edit-profile"'); };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="pf-mk"]'); if(!t) return; if(_mkd.on&&_mkd.prof){ mkdOff(); return; } pfMkStart(); });
