/* ---------- P9zzg: "new version" banner (version.json, written by the build), Treesh news in the notification center, Moderation → Announcements ---------- */
const TREESH_VER='__TREESH_VER__';
const _ver={next:null,at:0,busy:false,tag:null};
// version.json alone isn't trusted: if the page file itself hasn't changed since this tab loaded, a mismatch just means version.json is out of sync
async function verTag(){ try{ const r=await fetch(location.pathname+'?vt='+Date.now(),{method:'HEAD',cache:'no-store'}); return r.ok?(r.headers.get('etag')||r.headers.get('last-modified')||''):''; }catch(e){ return ''; } }
function verSkip(){ try{ return localStorage.getItem('treesh_ver_skip')||''; }catch(e){ return ''; } }
async function verCheck(force){ if(/^__/.test(TREESH_VER)||_ver.busy||navigator.onLine===false) return; if(!force&&Date.now()-_ver.at<6e4) return; _ver.busy=true; _ver.at=Date.now();
  try{ if(_ver.tag==null) _ver.tag=await _ver.tag0;
    const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'}); if(!r.ok) return; const j=await r.json(); if(!j||!j.v||j.v===TREESH_VER||j.v===verSkip()) return;
    if(_ver.tag){ const now=await verTag(); if(now&&now===_ver.tag) return; }
    _ver.next=j; verShow(); }catch(e){} finally{ _ver.busy=false; } }
function verShow(){ const j=_ver.next; if(!j) return; let later=''; try{ later=sessionStorage.getItem('treesh_ver_later')||''; }catch(e){} if(later===j.v) return;
  let el=document.getElementById('vb-root'); if(el&&el.dataset.v===j.v) return; if(el) el.remove();
  el=document.createElement('div'); el.id='vb-root'; el.className='vb is-in'; el.dataset.v=j.v; el.dataset.testid='update-banner'; el.setAttribute('role','status');
  el.innerHTML=`<span class="vb-ic"><img src="icons/icon-192.png" alt="" width="38" height="38" decoding="async" data-testid="update-banner-logo"></span><span class="vb-tx"><b data-testid="update-banner-title">A new version of Treesh is ready</b>${j.notes?`<small data-testid="update-banner-notes">${esc(String(j.notes).slice(0,140))}</small>`:''}</span><button type="button" data-act="vb-refresh" class="vb-go press" data-testid="update-banner-refresh"><i data-lucide="refresh-cw"></i>Refresh</button><button type="button" data-act="vb-later" class="vb-x press" aria-label="Later" title="Later" data-testid="update-banner-dismiss"><i data-lucide="x"></i></button>`;
  document.body.appendChild(el); icons(); requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove('is-in'))); }
function verLater(){ const el=document.getElementById('vb-root'); try{ sessionStorage.setItem('treesh_ver_later',(_ver.next&&_ver.next.v)||''); }catch(e){} if(el){ el.classList.add('is-out'); setTimeout(()=>el.remove(),320); } }
function verGo(){ const q=new URLSearchParams(location.search); q.set('v',(_ver.next&&_ver.next.v)||Date.now().toString(36)); try{ resSave(true); }catch(e){} location.replace(location.pathname+'?'+q+location.hash); }
function verBoot(){ _ver.tag0=verTag(); try{ const q=new URLSearchParams(location.search), v=q.get('v'); if(v==null) return; q.delete('v'); history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:'')+location.hash);
  if(v===TREESH_VER) setTimeout(()=>toast('Treesh is up to date','You\u2019re on the newest version'),1800);
  else if(!/^__/.test(TREESH_VER)) try{ localStorage.setItem('treesh_ver_skip',v); }catch(e){} }catch(e){} }

/* ---- Treesh news + update alerts (announcements table, read through treesh_news) ---- */
NT_KIND.news=['megaphone','is-staff','Treesh news','Announcements from the Treesh team']; NT_KIND.update=['sparkles','is-ok','App updates','When a new version of Treesh is live'];
NT_ON.push('news');
const _nav9zzg=ntAvHtml; ntAvHtml=function(it,cls){ if(it&&!it.actor&&(it.kind==='update'||it.kind==='news')) return `<span class="nt-av is-sys is-logo ${cls||''}"><img src="icons/icon-192.png" alt="Treesh" draggable="false"></span>`; return _nav9zzg.apply(this,arguments); };
const _nw={busy:false,at:0,off:false};
async function newsFetch(force){ if(typeof sb==='undefined'||!sb||_nw.off||_nw.busy||navigator.onLine===false) return; if(!force&&Date.now()-_nw.at<3e5) return; _nw.busy=true; _nw.at=Date.now();
  try{ const last=LS.get('treesh_news_last',null), {data,error}=await sb.rpc('treesh_news',{after_id:+last||0});
    if(error){ if(error.code==='PGRST202'||error.code==='42883'||/Could not find the function/i.test(error.message||'')) _nw.off=true; return; }
    newsIngest(Array.isArray(data)?data:[],last==null); }catch(e){} finally{ _nw.busy=false; } }
function newsIngest(rows,first){ const A=ntAll(), have=new Set(A.map(x=>x.id)); let max=+LS.get('treesh_news_last',0)||0; const fresh=[];
  rows.slice().sort((a,b)=>a.id-b.id).forEach((r,i,all)=>{ if(!r||r.id==null) return; max=Math.max(max,+r.id); const id='n'+r.id; if(have.has(id)||(first&&i<all.length-3)) return;
    const it={id,src:'online',kind:r.kind==='update'?'update':'news',t:Date.parse(r.created_at)||Date.now(),read:false,title:String(r.title||'Treesh').slice(0,120),body:String(r.body||'').slice(0,300),url:/^(https:\/\/|\/)[^\s"'<>]*$/i.test(r.url||'')?r.url:''};
    A.unshift(it); have.add(id); fresh.push(it); });
  LS.set('treesh_news_last',max); if(!fresh.length) return; ntPrune(); ntSave(true);
  const P=ntP(); if(!fresh.some(x=>!P.mute[x.kind])) return; ntBellRing(); if(ntDnd()||state.ntOpen) return;
  fresh.filter(x=>x.kind==='news'&&!P.mute.news&&Date.now()-x.t<864e5).slice(-2).forEach(x=>ntBanner(x)); }
const _nah9zzg=ntActsHtml; ntActsHtml=function(it,pre){ const T=pre||'notification', sfx=pre?'':'-'+it.id;
  if(it.kind==='news'&&it.url) return `<div class="nt-acts"><button type="button" data-act="nt-news-link" data-id="${it.id}" data-testid="${T}-action-link${sfx}" class="nt-btn is-primary press"><i data-lucide="arrow-up-right"></i>Open</button></div>`;
  if(it.kind==='update'&&_ver.next) return `<div class="nt-acts"><button type="button" data-act="nt-ver-refresh" data-id="${it.id}" data-testid="${T}-action-update${sfx}" class="nt-btn is-primary press"><i data-lucide="refresh-cw"></i>Refresh to update</button></div>`;
  return _nah9zzg.apply(this,arguments); };
function newsOpen(id){ const it=ntFind(id); if(!it||!it.url) return; ntMarkRead([id],true); ntbDismiss(id);
  if(/^https:\/\//i.test(it.url)&&new URL(it.url).origin!==location.origin){ window.open(it.url,'_blank','noopener'); return; }
  if(state.ntOpen) ntcClose(); setTimeout(()=>puOpen(it.url),state.ntOpen?220:0); }

const _p9Init9zzg=p9Init; p9Init=function(){ const r=_p9Init9zzg.apply(this,arguments); verBoot(); setTimeout(()=>{ verCheck(true); newsFetch(true); },5000); return r; };
document.addEventListener('visibilitychange',()=>{ if(document.hidden) return; verCheck(); newsFetch(); });
setInterval(()=>{ if(document.hidden) return; verCheck(true); newsFetch(); },6e5);

/* ---- Moderation → Announcements (Treesh admins). /api/push/announce checks the role again ---- */
const anCan=()=>stRole()==='admin';
const AN_AUD=[['all','Everyone'],['members','Signed-in members']];
function anNew(){ return {title:'',body:'',url:'',aud:'all',step:'edit',working:false,res:null,err:null,list:null}; }
async function anLoad(){ const A=_adm; if(!A||!A.an||!sb) return; try{ const {data,error}=await sb.rpc('treesh_news',{after_id:0}); if(_adm!==A) return; A.an.list=error?[]:(data||[]); }catch(e){ if(_adm===A) A.an.list=[]; } if(_adm===A) admPaint(); }
function anRail(){ const A=_adm, rail=document.getElementById('adm-rail'); if(!A||!A.an||!rail) return; const on=!A.q&&A.sec==='announce';
  const h=`<p class="adm-rail-h">Treesh</p><button type="button" data-act="adm-sec" data-val="announce" data-testid="admin-nav-announce" aria-current="${on?'page':'false'}" class="adm-nav press${on?' on':''}"><i data-lucide="megaphone"></i><span class="adm-nl">Announcements</span></button>`;
  let box=rail.querySelector(':scope > .an-rail'); if(!box){ box=document.createElement('div'); box.className='an-rail'; rail.insertBefore(box,rail.querySelector(':scope > .adm-rail-h')); }
  if(box._h!==h){ box._h=h; box.innerHTML=h; icons(); } }
function anFootHtml(){ const N=_adm.an, w=N.working, R=N.res;
  let h=R?`<div class="mq-status is-ok" data-testid="announce-result"><i data-lucide="circle-check"></i><span><b>Sent to ${R.sent} device${R.sent===1?'':'s'}</b><small>${R.devices} with alerts on${R.failed?' \u00b7 '+R.failed+' didn\u2019t go through':''}${R.removed?' \u00b7 '+R.removed+' expired and were removed':''}</small></span></div>`:'';
  if(N.err) h+=`<div class="mq-status is-err" role="alert" data-testid="announce-error"><i data-lucide="triangle-alert"></i><span><b>Not sent</b><small>${esc(N.err)}</small></span></div>`;
  if(N.step==='confirm') return h+`<div class="an-foot" data-testid="announce-confirm-box"><p class="ie-q"><b>Send it to ${N.aud==='all'?'every device':'every signed-in member\u2019s device'}?</b><small>Notifications can\u2019t be taken back once they\u2019re out.</small></p><div class="ie-btns"><button type="button" data-act="an-cancel" data-testid="announce-cancel" class="sba-btn lg press"${w?' disabled':''}>Cancel</button><button type="button" data-act="an-send" data-testid="announce-send-confirm" class="sba-btn is-primary lg press${w?' is-busy':''}"${w?' disabled':''}><i data-lucide="loader-circle" class="sba-spin"></i>${w?'Sending\u2026':'<i data-lucide="send"></i>Send now'}</button></div></div>`;
  return h+`<div class="an-foot"><button type="button" data-act="an-review" data-testid="announce-review" class="sba-btn is-primary lg press"${N.title.trim()?'':' disabled'}><i data-lucide="send"></i>Review &amp; send</button></div>`; }
function anMainHtml(){ const N=_adm.an, w=N.working?' disabled':'', L=N.list;
  const head=admHead('Announcements','Send a notification to every device with Treesh alerts on. It also lands in everyone\u2019s notification center.');
  const form=`<div class="an-form" data-testid="announce-form">
    <label class="sba-f"><span>Title</span><input id="an-title" type="text" maxlength="80" autocomplete="off" placeholder="New songs just dropped" value="${esc(N.title)}" data-testid="announce-title-input"${w}><small class="an-cnt" data-an-cnt="title" data-testid="announce-title-count">${N.title.length}/80</small></label>
    <label class="sba-f"><span>Message <i class="tsf-opt">optional</i></span><textarea id="an-body" rows="3" maxlength="300" class="tsf-ta" placeholder="Tell everyone what\u2019s new" data-testid="announce-body-input"${w}>${esc(N.body)}</textarea><small class="an-cnt" data-an-cnt="body" data-testid="announce-body-count">${N.body.length}/300</small></label>
    <label class="sba-f"><span>Link <i class="tsf-opt">optional</i></span><input id="an-url" type="text" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="https://\u2026 or /?u=username" value="${esc(N.url)}" data-testid="announce-url-input"${w}></label>
    <div><p class="mq-lbl">Who gets it</p><div class="adm-chips an-aud" role="radiogroup" aria-label="Who gets it" data-testid="announce-audience">${AN_AUD.map(([k,l])=>`<button type="button" role="radio" aria-checked="${N.aud===k}" data-act="an-aud" data-val="${k}" data-testid="announce-audience-${k}" class="adm-chip press${N.aud===k?' on':''}"${w}>${l}</button>`).join('')}</div></div>
    ${anFootHtml()}</div>`;
  const prev=`<aside class="an-prev" aria-label="Preview" data-testid="announce-preview"><p class="mq-lbl">Preview</p><div class="an-phone"><p class="an-clock">9:41</p><div class="an-note"><img src="icons/icon-192.png" alt=""><div class="min-w-0 flex-1"><p class="an-note-h"><b>Treesh</b><span>now</span></p><p class="an-note-t" data-an-prev="title" data-testid="announce-preview-title">${esc(N.title||'Your title')}</p><p class="an-note-b" data-an-prev="body" data-testid="announce-preview-body">${esc(N.body||'Your message')}</p></div></div></div></aside>`;
  const list=!L?`<div class="sx-load"><span class="sx-spin"></span></div>`:!L.length?`<p class="adm-none" data-testid="announce-recent-empty">Nothing sent in the last 30 days.</p>`:`<div class="an-list">${L.map((x,i)=>`<div class="an-item" data-testid="announce-recent-${i}"><span class="an-item-ic${x.kind==='update'?' is-up':''}"><i data-lucide="${x.kind==='update'?'sparkles':'megaphone'}"></i></span><span class="min-w-0 flex-1"><b class="clamp-1">${esc(x.title)}</b>${x.body?`<small class="clamp-2">${esc(x.body)}</small>`:''}</span><time>${esc(swAgo(Date.parse(x.created_at)))}</time></div>`).join('')}</div>`;
  return head+`<div class="an-grid">${form}${prev}</div><section class="adm-card an-recent" data-testid="announce-recent"><div class="adm-card-h"><span><b>Recent</b><small>Announcements and update alerts from the last 30 days</small></span></div>${list}</section>`; }
async function anSend(){ const A=_adm, N=A&&A.an; if(!N||N.working) return; N.working=true; N.err=null; admPaint();
  try{ const d=await puCall('/announce',{title:N.title.trim(),body:N.body.trim(),url:N.url.trim(),audience:N.aud},true); if(_adm!==A) return;
    Object.assign(N,{res:d,step:'edit',title:'',body:'',url:''}); toast('Announcement sent',d.sent+' device'+(d.sent===1?'':'s')); anLoad(); newsFetch(true); }
  catch(e){ if(_adm!==A) return; N.err=e.message; N.step='edit'; }
  N.working=false; admPaint(); }
const _admOpen9zzg=admOpen; admOpen=function(){ const r=_admOpen9zzg.apply(this,arguments); if(_adm&&anCan()){ _adm.an=anNew(); anRail(); } return r; };
const _admPaint9zzg=admPaint; admPaint=function(){ const ae=document.activeElement, fid=ae&&/^an-(title|body|url)$/.test(ae.id||'')?ae.id:null, ss=fid?[ae.selectionStart,ae.selectionEnd]:null;
  const r=_admPaint9zzg.apply(this,arguments); anRail();
  if(fid){ const x=document.getElementById(fid); if(x&&x!==document.activeElement&&!x.disabled) try{ x.focus({preventScroll:true}); x.setSelectionRange(ss[0],ss[1]); }catch(e){} } return r; };
const _admMain9zzg=admMainHtml; admMainHtml=function(){ const A=_adm; if(A&&A.an&&!A.q&&A.sec==='announce') return anMainHtml(); return _admMain9zzg.apply(this,arguments); };
document.addEventListener('input',e=>{ const t=e.target; if(!t||!_adm||!_adm.an||!/^an-(title|body|url)$/.test(t.id||'')) return; const N=_adm.an, k=t.id.slice(3); N[k]=t.value;
  const c=document.querySelector(`[data-an-cnt="${k}"]`); if(c) c.textContent=t.value.length+'/'+(k==='title'?80:300);
  const p=document.querySelector(`[data-an-prev="${k}"]`); if(p) p.textContent=t.value||(k==='title'?'Your title':'Your message');
  const b=document.querySelector('[data-act="an-review"]'); if(b) b.disabled=!N.title.trim(); });

document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act;
  switch(a){
    case 'vb-refresh': case 'nt-ver-refresh': verGo(); return;
    case 'vb-later': verLater(); return;
    case 'nt-news-link': newsOpen(t.dataset.id); return; }
  if(!_adm||!_adm.an) return; const N=_adm.an;
  switch(a){
    case 'adm-sec': if(t.dataset.val==='announce'&&!N.list) anLoad(); break;
    case 'adm-refresh': if(_adm.sec==='announce'){ N.list=null; anLoad(); } break;
    case 'an-aud': N.aud=t.dataset.val==='members'?'members':'all'; admPaint(); break;
    case 'an-review': { const u=N.url.trim(); N.res=null;
      if(!N.title.trim()) N.err='Give it a title.'; else if(u&&!(/^https:\/\/[^\s"'<>]+$/i.test(u)||/^\/[^\s"'<>]*$/.test(u))) N.err='Links must start with https:// or / (a page in Treesh).'; else { N.err=null; N.step='confirm'; }
      admPaint(); break; }
    case 'an-cancel': if(!N.working){ N.step='edit'; admPaint(); } break;
    case 'an-send': anSend(); break; } });
(function(){ const W=WHATS_NEW.settings; if(!W) return; W.v=(W.v||0)+1; W.date='October 10, 2026'; W.sub='Treesh can reach you now, even when it\u2019s closed.';
  W.items=[{icon:'bell-ring',title:'Push notifications',desc:'Turn them on in Settings, Notifications to get friend requests, account updates and Treesh news on your lock screen. On iPhone and iPad, add Treesh to your Home Screen first.'},{icon:'sparkles',title:'Know when there\u2019s a new version',desc:'A banner lets you know the moment a fresh Treesh is live. Tap Refresh to get it.'}].concat((W.items||[]).slice(0,3)); })();
