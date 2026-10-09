/* ---------- P9zzc: Moderation → Icon edits. Admins approve (merge) or reject (close) what Treesh Icons send from M.A.D. (netlify/functions/icon.mjs) ---------- */
const IE_API=window.TREESH_ICON_API||'/api/icon';
const IE_KIND={songs:['Songs','music'],lyrics:['Lyrics','mic-vocal'],icons:['Icon profile','user-round']};
const IE_ST={open:['Waiting','clock','is-amber'],merged:['Approved','circle-check','is-cyan'],closed:['Rejected','x','is-rose']};
const IE_CH={add:['New','plus','is-cyan'],edit:['Edited','pencil','is-violet'],remove:['Removed','trash-2','is-rose']};
const IE_IMG=new Set(['data-coverart','data-bg','photo']);
const ieCan=()=>stRole()==='admin';
const ieHttps=v=>/^https:\/\/[^\s"'<>]+$/i.test(String(v||''));
async function ieTok(){ try{ const r=sb&&await sb.auth.getSession(); return (r&&r.data&&r.data.session&&r.data.session.access_token)||''; }catch(e){ return ''; } }
async function ieCall(path,body){ const tok=await ieTok(); let r, d=null;
  try{ r=await fetch(IE_API+path,{method:body?'POST':'GET',cache:'no-store',headers:Object.assign({Authorization:'Bearer '+tok},body?{'Content-Type':'application/json'}:{}),body:body?JSON.stringify(body):undefined}); }
  catch(e){ throw new Error(navigator.onLine?'Couldn\u2019t reach Icon edits. Try again.':'You\u2019re offline. Connect to the internet and try again.'); }
  try{ d=await r.json(); }catch(e){}
  if(!r.ok||!d||typeof d!=='object') throw Object.assign(new Error(d&&d.message?d.message:(r.ok||r.status===404)?'Icon edits aren\u2019t switched on for this site yet.':'Icon edits error '+r.status+'.'),{status:r.status,code:d&&d.code});
  return d; }
function ieNew(){ return {tab:'open',lists:{open:null,closed:null},err:{},busy:{},seq:{open:0,closed:0},sel:null,det:null,detErr:null,act:null,reason:'',working:false}; }
async function ieLoad(tab,quiet){ const A=_adm; if(!A||!A.ie) return; const I=A.ie, seq=++I.seq[tab]; I.busy[tab]=true; I.err[tab]=null; if(!quiet) admPaint();
  try{ const d=await ieCall('/edits'+(tab==='closed'?'?state=closed':'')); if(_adm!==A||seq!==I.seq[tab]) return; I.lists[tab]=Array.isArray(d.items)?d.items:[]; }
  catch(e){ if(_adm!==A||seq!==I.seq[tab]) return; I.err[tab]=e; }
  I.busy[tab]=false; admPaint(); }

/* ----- list ----- */
function ieAv(ic,cls){ const n=(ic&&ic.name)||'?'; return `<span class="ie-av ${cls||''}">${ic&&ieHttps(ic.image)?`<img src="${esc(ic.image)}" alt="" loading="lazy">`:`<b>${esc(n.charAt(0).toUpperCase())}</b>`}</span>`; }
function ieTitle(x){ const nm=(x.icon&&x.icon.name)||''; let t=String(x.title||'').trim(); if(nm&&t.toLowerCase().indexOf(nm.toLowerCase()+':')===0) t=t.slice(nm.length+1).trim(); return t||'Update'; }
function ieWhen(x){ const ts=Date.parse(x.state==='open'?x.created_at:(x.merged_at||x.closed_at||x.updated_at)); return ts?swAgo(ts):''; }
function iePill(st,tid){ const S=IE_ST[st]||IE_ST.open; return `<span class="adm-pill ${S[2]}" data-testid="${tid}"><i data-lucide="${S[1]}"></i>${S[0]}</span>`; }
function ieKinds(files){ return [...new Set((files||[]).map(f=>f.kind||'other'))].map(k=>{ const K=IE_KIND[k]||['Other file','file']; return `<span class="ie-kind"><i data-lucide="${K[1]}"></i>${K[0]}</span>`; }).join(''); }
function ieRow(x,i){ const on=_adm&&_adm.ie&&_adm.ie.sel===x.number, w=ieWhen(x);
  return `<button type="button" data-act="adm-ie-open" data-n="${x.number}" data-testid="icon-edit-row-${x.number}" class="ie-row press${on?' on':''}" style="--d:${Math.min(i,10)*30}ms">${ieAv(x.icon)}<span class="min-w-0 flex-1"><b class="clamp-1" data-testid="icon-edit-title-${x.number}">${esc(ieTitle(x))}</b><small class="clamp-1">${esc((x.icon&&x.icon.name)||'Icon')} \u00b7 #${x.number}${w?' \u00b7 '+(x.state==='open'?'Sent ':'')+esc(w):''}</small>${x.files&&x.files.length?`<span class="ie-kinds">${ieKinds(x.files)}</span>`:''}</span>${iePill(x.state,'icon-edit-state-'+x.number)}<i data-lucide="chevron-right" class="adm-chev"></i></button>`; }
function ieMainHtml(){ const I=_adm.ie, t=I.tab, L=I.lists[t], open=I.lists.open;
  const head=admHead(`Icon edits${open?` <span class="adm-h-n" data-testid="icon-edits-count">${open.length}</span>`:''}`,'Changes Treesh Icons sent from M.A.D. for their own songs, lyrics and profile. Approve to publish them on Treesh, or reject with a note.');
  const seg=`<div class="adm-chips ie-seg no-scrollbar" role="tablist" aria-label="Icon edits" data-testid="icon-edits-tabs">${[['open','Waiting',open?open.length:null],['closed','Reviewed',null]].map(([k,l,c])=>`<button type="button" role="tab" aria-selected="${t===k}" data-act="adm-ie-tab" data-val="${k}" data-testid="icon-edits-tab-${k}" class="adm-chip press${t===k?' on':''}">${l}${c!=null?`<b>${c}</b>`:''}</button>`).join('')}</div>`;
  let body;
  if(I.err[t]&&!L) body=sxEmpty('triangle-alert','Couldn\u2019t load Icon edits',esc(I.err[t].message),`<button type="button" data-act="adm-ie-retry" data-testid="icon-edits-retry" class="sba-btn press mt-4"><i data-lucide="refresh-cw"></i>Try again</button>`);
  else if(!L) body=`<div class="sx-load" data-testid="icon-edits-loading"><span class="sx-spin"></span><p>Loading\u2026</p></div>`;
  else if(!L.length) body=sxEmpty(t==='open'?'inbox':'history',t==='open'?'All caught up':'Nothing reviewed yet',t==='open'?'When an Icon sends a change from M.A.D., it waits here for you.':'Approved and rejected Icon edits show up here.');
  else body=`<div class="ie-list" data-testid="icon-edits-list-${t}">${L.map(ieRow).join('')}</div>`;
  return head+seg+body; }

/* ----- one edit (right pane on computers, full screen on phones) ----- */
function ieNote(body){ return String(body||'').split(/\n+---\nSent by Treesh Icon/)[0].replace(/<img[^>]*>/gi,'').replace(/_Submitted with Treesh M\.A\.D\._/g,'').split('\n').filter(l=>!/^\s*\|/.test(l)).join('\n').replace(/\*\*|`/g,'').replace(/\n{3,}/g,'\n\n').trim().slice(0,600); }
function ieVal(x,v){ if(!v) return '<em class="ie-none">empty</em>';
  if(IE_IMG.has(x.key)&&ieHttps(v)) return `<a href="${esc(v)}" target="_blank" rel="noopener" class="ie-img"><img src="${esc(v)}" alt="" loading="lazy"></a>`;
  if(ieHttps(v)) return `<a href="${esc(v)}" target="_blank" rel="noopener" class="ie-url">${esc(v.replace(/^https:\/\//i,''))}</a>`;
  return `<span class="ie-txt">${esc(v.length>500?v.slice(0,500)+'\u2026':v)}</span>`; }
function ieFieldHtml(x,ch,k){ return `<div class="ie-f" data-testid="icon-edit-field-${k}"><dt>${esc(x.label)}</dt><dd>${ch==='add'?'':`<span class="ie-old">${ieVal(x,x.old)}</span><i data-lucide="arrow-down" class="ie-arr"></i>`}<span class="ie-new">${ieVal(x,x.new)}</span></dd></div>`; }
function ieChangeHtml(kind,c,k){ const C=IE_CH[c.change]||IE_CH.edit;
  const head=`<div class="ie-ch-h">${ieHttps(c.cover)?`<img class="ie-cov${kind==='icons'?' is-round':''}" src="${esc(c.cover)}" alt="" loading="lazy">`:`<span class="ie-cov is-ph"><i data-lucide="${(IE_KIND[kind]||['','music'])[1]}"></i></span>`}<span class="min-w-0 flex-1"><b class="clamp-1">${esc(c.title||'Untitled')}</b>${c.artist&&kind!=='icons'?`<small class="clamp-1">${esc(c.artist)}</small>`:''}</span><span class="adm-pill ${C[2]}"><i data-lucide="${C[1]}"></i>${C[0]}</span></div>`;
  let det='';
  if(kind==='lyrics'&&c.change!=='remove'){ const a=c.added||[], r=c.removed||[], pl=n=>n+' line'+(n===1?'':'s');
    det=`<p class="ie-lc" data-testid="icon-edit-lyrics-count-${k}">${[a.length?'+'+pl(a.length):'',r.length?'\u2212'+pl(r.length):''].filter(Boolean).join(' \u00b7 ')||'Only the order changed'}${c.lines?` \u00b7 ${c.lines} in total`:''}</p>${a.length||r.length?`<div class="ie-diff soft-scroll" data-testid="icon-edit-lyrics-diff-${k}">${r.map(l=>`<p class="is-rm">${esc(l)}</p>`).join('')}${a.map(l=>`<p class="is-add">${esc(l)}</p>`).join('')}</div>`:''}`; }
  else { const F=(c.fields||[]).filter(x=>c.change!=='add'||x.new); if(F.length) det=`<dl class="ie-fields">${F.map((x,j)=>ieFieldHtml(x,c.change,k+'-'+j)).join('')}</dl>`; }
  return `<div class="ie-ch" data-testid="icon-edit-change-${k}">${head}${det}</div>`; }
function ieFileHtml(f,i){ const K=IE_KIND[f.kind]||['Other file','file'], ch=f.changes||[];
  return `<section class="ie-file" data-testid="icon-edit-file-${i}"><div class="ie-file-h"><span class="ie-kind is-lg"><i data-lucide="${K[1]}"></i>${K[0]}</span><small>${ch.length} change${ch.length===1?'':'s'}</small>${f.ok?'':`<span class="adm-pill is-rose" data-testid="icon-edit-file-flag-${i}"><i data-lucide="triangle-alert"></i>Check</span>`}</div>${!f.ok&&f.message?`<p class="ie-flag">${esc(f.message)}</p>`:''}${ch.length?ch.map((c,j)=>ieChangeHtml(f.kind,c,i+'-'+j)).join(''):`<p class="adm-none">No readable changes in ${esc(f.file||'this file')}.</p>`}</section>`; }
function ieDetHtml(d){ const ic=d.icon||{}, files=d.files||[], bad=files.find(f=>!f.ok), nm=esc(ic.name||'this Icon');
  const st=d.state==='open'?'Sent '+ieWhen(d):(d.state==='merged'?'Approved ':'Rejected ')+ieWhen(d);
  const hero=`<div class="ie-hero">${ieAv(ic,'is-lg')}<div class="min-w-0 flex-1"><p class="ie-eyebrow" data-testid="icon-edit-detail-icon">${esc(ic.name||'Icon')}</p><h3 class="ie-h" data-testid="icon-edit-detail-title">${esc(ieTitle(d))}</h3><p class="ie-meta">${iePill(d.state,'icon-edit-detail-state')}<span>${esc(st)}</span></p></div></div>`;
  let check='';
  if(d.state==='open') check=d.ok?`<div class="mq-status is-ok" data-testid="icon-edit-check"><i data-lucide="shield-check"></i><span><b>Passes the Icon checks</b><small>Only changes ${nm}\u2019s own songs, lyrics or profile.</small></span></div>`
    :`<div class="mq-status is-err" data-testid="icon-edit-check"><i data-lucide="triangle-alert"></i><span><b>Doesn\u2019t pass the Icon checks</b><small>${esc((bad&&bad.message)||'Nothing in this request can be checked.')}</small></span></div>`;
  if(d.state==='open'&&d.mergeable===false) check+=`<div class="mq-status is-warn" data-testid="icon-edit-conflict"><i data-lucide="git-merge"></i><span><b>Can\u2019t merge cleanly</b><small>Treesh changed since this was sent. Reject it and ask ${nm} to send it again.</small></span></div>`;
  const note=ieNote(d.body);
  return hero+check+files.map(ieFileHtml).join('')+(note?`<div class="ie-note" data-testid="icon-edit-note"><p class="mq-lbl">Summary</p><p>${esc(note).replace(/\n/g,'<br>')}</p></div>`:''); }
function ieFootHtml(d){ const I=_adm.ie, w=I.working?' disabled':'', nm=esc((d.icon&&d.icon.name)||'the Icon');
  const cancel=`<button type="button" data-act="adm-ie-cancel" data-testid="icon-edit-cancel" class="sba-btn lg press"${w}>Cancel</button>`, spin='<i data-lucide="loader-circle" class="sba-spin"></i>';
  if(I.act==='reject') return `<div class="ie-foot" data-testid="icon-edit-reject-box"><label class="sba-f"><span>Note for ${nm} <i class="tsf-opt">optional</i></span><textarea id="ie-reason" rows="3" maxlength="1000" class="tsf-ta" placeholder="What should they change before sending it again?" data-testid="icon-edit-reject-reason"${w}>${esc(I.reason)}</textarea></label><div class="ie-btns">${cancel}<button type="button" data-act="adm-ie-go" data-val="close" data-testid="icon-edit-reject-confirm" class="sba-btn is-danger lg press${I.working?' is-busy':''}"${w}>${spin}${I.working?'Rejecting\u2026':'<i data-lucide="x"></i>Reject edit'}</button></div></div>`;
  if(I.act==='approve') return `<div class="ie-foot" data-testid="icon-edit-approve-box"><p class="ie-q"><b>${d.ok?'Publish this on Treesh?':'Approve it anyway?'}</b><small>${d.ok?'It merges into Treesh and goes live after Netlify redeploys, usually within a minute.':'It didn\u2019t pass the Icon checks. Only approve it if you\u2019ve checked every change yourself.'}</small></p><div class="ie-btns">${cancel}<button type="button" data-act="adm-ie-go" data-val="merge" data-testid="icon-edit-approve-confirm" class="sba-btn ${d.ok?'is-primary':'is-danger'} lg press${I.working?' is-busy':''}"${w}>${spin}${I.working?'Publishing\u2026':'<i data-lucide="check"></i>Approve &amp; publish'}</button></div></div>`;
  return `<div class="ie-foot" data-testid="icon-edit-actions"><div class="ie-btns"><button type="button" data-act="adm-ie-reject" data-testid="icon-edit-reject" class="sba-btn lg press"><i data-lucide="x"></i>Reject</button><button type="button" data-act="adm-ie-approve" data-testid="icon-edit-approve" class="sba-btn lg press ${d.ok?'is-primary':'ie-warn'}"><i data-lucide="check"></i>${d.ok?'Approve':'Approve anyway'}</button></div></div>`; }
function iePanePaint(fresh){ const A=_adm, p=document.getElementById('adm-pane'); if(!A||!p||!A.ie||A.ie.sel==null) return; const I=A.ie, d=I.det;
  const top=`<div class="adm-pane-top"><button type="button" data-act="adm-ie-close" aria-label="Back" data-testid="icon-edit-back" class="adm-ic press"><i data-lucide="${admMob()?'arrow-left':'x'}"></i></button><span class="adm-pane-t">Icon edit #${I.sel}</span>${d&&/^https:\/\/github\.com\//.test(d.url||'')?`<a href="${esc(d.url)}" target="_blank" rel="noopener" data-testid="icon-edit-github-link" class="adm-qbtn press"><i data-lucide="arrow-up-right"></i>GitHub</a>`:''}</div>`;
  let body, foot='';
  if(!d&&!I.detErr) body=`<div class="sx-load" data-testid="icon-edit-loading"><span class="sx-spin"></span></div>`;
  else if(!d) body=sxEmpty('triangle-alert','Couldn\u2019t open this edit',esc(I.detErr.message),`<button type="button" data-act="adm-ie-reload" data-testid="icon-edit-retry" class="sba-btn press mt-4"><i data-lucide="refresh-cw"></i>Try again</button>`);
  else { body=ieDetHtml(d); if(d.state==='open') foot=ieFootHtml(d); }
  const prev=p.querySelector('.ie-pbody'), y=prev&&!fresh?prev.scrollTop:0;
  p.innerHTML=`<div class="adm-pane-in" data-testid="icon-edit-pane">${top}<div class="ie-pbody soft-scroll" data-testid="icon-edit-body">${body}</div>${foot}</div>`;
  const nb=p.querySelector('.ie-pbody'); if(nb&&y) nb.scrollTop=y;
  if(!p.classList.contains('is-open')) requestAnimationFrame(()=>p.classList.add('is-open')); icons(); }
async function ieOpen(n){ const A=_adm; if(!A||!A.ie||!n) return; const I=A.ie;
  if(A.sel){ A.sel=null; A.selD=null; } I.sel=n; I.det=null; I.detErr=null; I.act=null; I.reason=''; I.working=false; iePanePaint(true); admPaint();
  try{ const d=await ieCall('/edits/'+n); if(_adm!==A||I.sel!==n) return; I.det=d; }catch(e){ if(_adm!==A||I.sel!==n) return; I.detErr=e; }
  iePanePaint(); }
function iePaneClose(){ const A=_adm; if(!A||!A.ie) return; const I=A.ie; I.sel=null; I.det=null; I.act=null; I.working=false; const p=document.getElementById('adm-pane'); if(p) p.classList.remove('is-open'); admPaint();
  setTimeout(()=>{ if(_adm&&!_adm.sel&&_adm.ie&&_adm.ie.sel==null&&p) p.innerHTML=''; },340); }
async function ieGo(kind){ const A=_adm; if(!A||!A.ie||!A.ie.det||A.ie.working) return; const I=A.ie, d=I.det, n=d.number;
  if(kind==='close'){ const ta=document.getElementById('ie-reason'); if(ta) I.reason=ta.value; }
  I.working=true; iePanePaint();
  try{ await ieCall('/edits/'+n+'/'+kind,kind==='merge'?{force:!d.ok}:{reason:I.reason.trim()}); if(_adm!==A) return;
    toast(kind==='merge'?'Approved':'Rejected',kind==='merge'?'\u201c'+ieTitle(d)+'\u201d goes live on Treesh in a minute or two':'Nothing from it was published');
    I.lists.open=(I.lists.open||[]).filter(x=>x.number!==n); I.lists.closed=null; iePaneClose(); ieLoad('open',true); if(I.tab==='closed') ieLoad('closed',true); }
  catch(e){ if(_adm!==A) return; I.working=false; toast(kind==='merge'?'Couldn\u2019t approve':'Couldn\u2019t reject',e.message); if(e.status===409&&e.code==='state'){ ieLoad('open',true); ieOpen(n); } else iePanePaint(); } }

/* ----- hooks into the dashboard ----- */
function ieRail(){ const A=_adm, rail=document.getElementById('adm-rail'); if(!A||!A.ie||!rail) return; const on=!A.q&&A.sec==='icons', L=A.ie.lists.open;
  const h=`<p class="adm-rail-h">Treesh Icons</p><button type="button" data-act="adm-sec" data-val="icons" data-testid="admin-nav-icons" aria-current="${on?'page':'false'}" class="adm-nav press${on?' on':''}"><i data-lucide="git-pull-request"></i><span class="adm-nl">Icon edits</span>${L?`<b data-testid="admin-nav-count-icons"${L.length?' class="ie-hot"':''}>${L.length}</b>`:''}</button>`;
  let box=rail.querySelector(':scope > .ie-rail'); if(!box){ box=document.createElement('div'); box.className='ie-rail'; rail.insertBefore(box,rail.querySelector(':scope > .adm-rail-h')); }
  if(box._h!==h){ box._h=h; box.innerHTML=h; icons(); } }
const _admOpen9zzc=admOpen; admOpen=function(){ const r=_admOpen9zzc.apply(this,arguments); if(_adm&&ieCan()){ _adm.ie=ieNew(); ieRail(); ieLoad('open',true); } return r; };
const _admPaint9zzc=admPaint; admPaint=function(){ const r=_admPaint9zzc.apply(this,arguments); ieRail(); return r; };
const _admMain9zzc=admMainHtml; admMainHtml=function(){ const A=_adm; if(A&&A.ie&&!A.q&&A.sec==='icons') return ieMainHtml(); return _admMain9zzc.apply(this,arguments); };
const _admOv9zzc=admOverviewHtml; admOverviewHtml=function(){ const h=_admOv9zzc.apply(this,arguments), L=_adm&&_adm.ie&&_adm.ie.lists.open; if(!L||!L.length) return h;
  const card=`<section class="adm-card ie-ov" data-testid="admin-icon-edits-card"><div class="adm-card-h"><span><b>Icon edits waiting</b><small>${L.length} change${L.length===1?'':'s'} from Treesh Icons ${L.length===1?'needs':'need'} a review</small></span><button type="button" data-act="adm-sec" data-val="icons" data-testid="admin-icon-edits-review-all" class="adm-link press">Review</button></div><div class="ie-list">${L.slice(0,3).map(ieRow).join('')}</div></section>`;
  return h.replace('<div class="adm-grid2">',card+'<div class="adm-grid2">'); };
const _admSel9zzc=admSelect; admSelect=function(u){ if(_adm&&_adm.ie&&u) _adm.ie.sel=null; return _admSel9zzc.apply(this,arguments); };
const _admPC9zzc=admPaneClose; admPaneClose=function(){ const A=_adm; if(A&&A.ie&&A.ie.sel!=null&&!A.sel){ iePaneClose(); return; } return _admPC9zzc.apply(this,arguments); };
const _admClose9zzc=admClose; admClose=function(){ const A=_adm, ev=window.event; if(A&&A.ie&&A.ie.sel!=null&&ev&&ev.type==='keydown'){ if(!A.ie.working) iePaneClose(); return; } return _admClose9zzc.apply(this,arguments); };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t||!_adm||!_adm.ie) return; const a=t.dataset.act, I=_adm.ie;
  switch(a){
    case 'adm-sec': if(t.dataset.val==='icons'&&!I.lists[I.tab]&&!I.busy[I.tab]) ieLoad(I.tab,true); break;
    case 'adm-refresh': ieLoad('open',true); if(I.tab==='closed') ieLoad('closed',true); if(I.sel!=null&&!I.working) ieOpen(I.sel); break;
    case 'adm-ie-tab': I.tab=t.dataset.val==='closed'?'closed':'open'; if(!I.lists[I.tab]&&!I.busy[I.tab]) ieLoad(I.tab,true); admPaint(); break;
    case 'adm-ie-retry': ieLoad(I.tab); break;
    case 'adm-ie-open': ieOpen(+t.dataset.n); break;
    case 'adm-ie-close': if(!I.working) iePaneClose(); break;
    case 'adm-ie-reload': if(I.sel!=null) ieOpen(I.sel); break;
    case 'adm-ie-approve': I.act='approve'; iePanePaint(); break;
    case 'adm-ie-reject': I.act='reject'; iePanePaint(); setTimeout(()=>{ const x=document.getElementById('ie-reason'); if(x) try{ x.focus({preventScroll:true}); }catch(_){} },60); break;
    case 'adm-ie-cancel': if(!I.working){ I.act=null; iePanePaint(); } break;
    case 'adm-ie-go': ieGo(t.dataset.val); break; } });
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='ie-reason'&&_adm&&_adm.ie) _adm.ie.reason=e.target.value; });
