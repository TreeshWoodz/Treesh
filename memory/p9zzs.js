/* ---------- P9zzs: moderation with more power. Edit or delete a birthday, delete anything on a profile, hide any section ---------- */
const MQC_SECS={zodiac:'Zodiac & birthday',badges:'Badges & stats',favorites:'Liked songs',lyrics:'Saved lyrics',disliked:'Disliked songs',playlists:'Playlists',listening:'Top listening'};
function mqcMd(md){ const m=/^(\d{2})-(\d{2})$/.exec(md||''); if(!m) return ''; return new Date(2000,+m[1]-1,+m[2]).toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
function mqcTalents(t){ if(!t) return []; if(Array.isArray(t)) return t.map(x=>typeof x==='string'?x:(x&&(x.label||x.name||x.id))||'').filter(Boolean); if(typeof t==='object') return (t.list||t.items||Object.keys(t)).map(x=>typeof x==='string'?x:(x&&(x.label||x.name))||'').filter(Boolean); return [String(t)]; }
function mqcHtml(d){ const D=d.data||{}, busy=_mod.busy?' disabled':'', pv=d.privacy||{};
  const row=(ic,title,sub,btns,tid,extra)=>`<div class="mqc-row" data-testid="${tid}"><span class="mqc-ic"><i data-lucide="${ic}"></i></span><span class="mqc-tx"><b>${title}</b><small>${sub}</small></span><span class="mqc-b">${btns}</span>${extra||''}</div>`;
  const del=(k,l)=>`<button type="button" data-act="mod-c-rm" data-k="${k}" data-testid="mod-c-rm-${k}" class="sba-btn is-danger press"${busy}><i data-lucide="trash-2"></i>${l||'Delete'}</button>`;
  const hide=k=>`<button type="button" data-act="mod-c-hide" data-k="${k}" data-testid="mod-c-hide-${k}" title="Only they can see it" class="sba-btn press"${busy}><i data-lucide="eye-off"></i>Hide</button>`;
  const none='<em class="mqc-none">Nothing here</em>';
  const pls=Array.isArray(D.playlists)?D.playlists:[], lys=Array.isArray(D.lyrics)?D.lyrics:[], tl=mqcTalents(D.talents), favN=Array.isArray(D.favorites)?D.favorites.length:0, disN=Array.isArray(D.disliked)?D.disliked.length:0, lis=D.listening||{}, lisN=((lis.songs||[]).length)+((lis.artists||[]).length);
  const items=[
    row('cake','Birthday',D.zodiac||D.bday?esc([D.zodiac,mqcMd(D.bday)].filter(Boolean).join(' \u00b7 ')):'Not shown',(D.zodiac||D.bday)?`<button type="button" data-act="mod-tab" data-val="profile" data-testid="mod-c-edit-birthday" class="sba-btn press"${busy}><i data-lucide="pencil"></i>Edit</button>${del('birthday')}`:none,'mod-c-birthday'),
    row('sparkles','Talents',tl.length?esc(tl.slice(0,6).join(', ')):'None',tl.length?del('talents'):none,'mod-c-talents'),
    row('star','Favorites showcase',D.favs&&Object.keys(D.favs).length?Object.keys(D.favs).length+' picked':'None',D.favs&&Object.keys(D.favs).length?del('favs'):none,'mod-c-favs'),
    row('heart','Liked songs',favN+' song'+(favN!==1?'s':''),favN?hide('favorites'):none,'mod-c-favorites'),
    row('heart-crack','Disliked songs',disN+' song'+(disN!==1?'s':''),disN?hide('disliked'):none,'mod-c-disliked'),
    row('chart-no-axes-column','Top listening',lisN?lisN+' items':'Nothing yet',lisN?hide('listening'):none,'mod-c-listening'),
    row('award','Badges & stats',(D.badges||[]).length+' badges',D.stats||(D.badges||[]).length?hide('badges'):none,'mod-c-badges'),
    row('list-music','Playlists',pls.length+' public',pls.length?hide('playlists'):none,'mod-c-playlists',pls.length?`<div class="mqc-sub">${pls.map((p,i)=>`<div class="mqc-it" data-testid="mod-c-pl-${i}"><span class="clamp-1">${esc(p.name||'Playlist')}<small>${(p.songs||[]).length} songs</small></span><button type="button" data-act="mod-c-pl" data-id="${esc(p.id)}" data-name="${esc(p.name||'Playlist')}" data-testid="mod-c-pl-del-${i}" aria-label="Delete ${esc(p.name||'playlist')}" class="mqc-x press"${busy}><i data-lucide="trash-2"></i></button></div>`).join('')}</div>`:''),
    row('quote','Saved lyrics',lys.length+' song'+(lys.length!==1?'s':''),lys.length?hide('lyrics'):none,'mod-c-lyrics',lys.length?`<div class="mqc-sub">${lys.map((g,i)=>`<div class="mqc-it" data-testid="mod-c-ly-${i}"><span class="clamp-1">${esc(g.t||'Song')}<small>${esc((g.lines||[])[0]||'')}</small></span><button type="button" data-act="mod-c-ly" data-id="${esc(g.id)}" data-name="${esc(g.t||'these lyrics')}" data-testid="mod-c-ly-del-${i}" aria-label="Delete saved lyrics" class="mqc-x press"${busy}><i data-lucide="trash-2"></i></button></div>`).join('')}</div>`:''),
    row('wand-sparkles','Page design','Magic Markup changes on their profile',D.custom&&D.custom.deep&&Object.keys(D.custom.deep).length?del('custom','Remove'):none,'mod-c-custom'),
    row('image','Space background',D.space?'Custom Space look':'Default',D.space?del('space','Remove'):none,'mod-c-space'),
    row('palette','Accent & theme',D.accent?esc(D.accent):'Default',D.accent||D.theme?del('accent','Reset'):none,'mod-c-accent')];
  return `<div class="mq-ph"><span class="mq-tile-ic is-violet"><i data-lucide="layers"></i></span><span class="min-w-0"><b>Everything on their profile</b><small>Delete it, or hide a section so only they can see it. They get a notice listing what changed.</small></span></div><div class="mqc-list" data-testid="mod-content-list">${items.join('')}</div>`; }
function mqcBday(d){ const D=d.data||{}, busy=_mod.busy?' disabled':''; const cur=D.zodiac||D.bday?esc([D.zodiac,mqcMd(D.bday)].filter(Boolean).join(' \u00b7 ')):'Not shown';
  return `<div class="mq-sub" data-testid="mod-birthday-section"><p class="mq-lbl">Birthday <i class="tsf-opt">now: ${cur}</i></p><div class="umx-lrow"><input id="mod-bday" type="date" max="${new Date().toISOString().slice(0,10)}" class="umx-in" data-testid="mod-birthday-input"><button type="button" data-act="mod-bday-save" data-testid="mod-birthday-save" class="sba-btn is-primary press"${busy}>Save</button></div><div class="mod-row"><button type="button" data-act="mod-c-rm" data-k="birthday" data-testid="mod-birthday-delete" class="sba-btn press"${busy}${D.zodiac||D.bday?'':' disabled'}><i data-lucide="trash-2"></i>Delete birthday</button></div></div>`; }
const _mh9zzs=modHtml; modHtml=function(){ let h=_mh9zzs.apply(this,arguments); const d=modT(); if(!d||!_mod) return h; const ok=modCan('edit'), busy=_mod.busy?' disabled':'';
  const tile=`<button type="button" role="tab" aria-selected="${_mod.tab==='content'}" data-act="mod-tab" data-val="content" data-testid="mod-quick-action-content" class="mq-tile is-violet press${_mod.tab==='content'?' on':''}${ok?'':' is-locked'}" style="--d:150ms"><span class="mq-tile-ic"><i data-lucide="layers"></i></span><b>Content</b><small>Delete anything</small>${ok?'':'<i data-lucide="lock" class="mq-lock"></i>'}</button>`;
  h=h.replace('<button type="button" role="tab" aria-selected="'+(_mod.tab==='badges')+'" data-act="mod-tab" data-val="badges"',tile+'<button type="button" role="tab" aria-selected="'+(_mod.tab==='badges')+'" data-act="mod-tab" data-val="badges"');
  if(_mod.ask) return h;
  if(_mod.tab==='content') h=h.replace('<section class="mq-panel" data-testid="mod-panel-content"></section>',`<section class="mq-panel" data-testid="mod-panel-content">${ok?mqcHtml(d):'<p class="mod-lock" data-testid="mod-locked-note"><i data-lucide="lock"></i>Moderators can\u2019t act on admins.</p>'}</section>`);
  if(_mod.tab==='profile'&&ok) h=h.replace('<div class="mq-sub"><p class="mq-lbl">Photos</p>',mqcBday(d)+'<div class="mq-sub"><p class="mq-lbl">Photos</p>');
  return h; };
async function mqcRun(changes,ok){ const d=modT(); if(!d) return; const r=await modRun('staff_edit_profile',{target:d.id,changes},ok); if(r) modReload(); }
const MQC_RM={birthday:[{birthday:null,pd_remove:['zodiac','bday']},'Delete their birthday?','Birthday deleted'],talents:[{remove_talents:true,pd_remove:['talents']},'Delete their talents?','Talents deleted'],favs:[{remove_favs:true,pd_remove:['favs']},'Delete their favorites showcase?','Favorites showcase deleted'],
  custom:[{remove_custom:true,pd_remove:['custom']},'Remove their page design?','Page design removed'],space:[{remove_space:true,pd_remove:['space']},'Remove their Space background?','Space background removed'],accent:[{reset_accent:true,pd_remove:['accent','theme']},'Reset their accent and theme?','Accent and theme reset']};
const _ma9zzs=modAct; modAct=function(a,t){ const d=modT(); if(!d) return _ma9zzs.apply(this,arguments); const u='@'+d.username;
  if(a==='mod-tab'&&t.dataset.testid==='mod-c-edit-birthday'){ const r=_ma9zzs.apply(this,arguments); setTimeout(()=>{ const i=document.getElementById('mod-bday'); if(i){ i.scrollIntoView({block:'center',behavior:'smooth'}); try{ i.focus({preventScroll:true}); }catch(e){} } },60); return r; }
  if(a==='mod-bday-save'){ const v=((document.getElementById('mod-bday')||{}).value||'').trim(); if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Date.parse(v)>Date.now()){ toast('Pick a real date'); return; }
    mqcRun({birthday:v,pd_set:{zodiac:zodiac(v)||'',bday:bdMd(v)}},['Birthday changed',zodiac(v)?u+' is a '+zodiac(v)+' now':'']); return; }
  if(a==='mod-c-rm'){ const R=MQC_RM[t.dataset.k]; if(!R) return; modAsk(R[1],'It\u2019s removed from '+u+'\u2019s profile and their devices.','Delete',()=>mqcRun(R[0],[R[2]])); return; }
  if(a==='mod-c-hide'){ const k=t.dataset.k; mqcRun({hide:[k]},['Hidden: '+(MQC_SECS[k]||k),'Only '+u+' can see it now']); return; }
  if(a==='mod-c-pl'){ const id=t.dataset.id, n=t.dataset.name; modAsk('Delete \u201c'+n+'\u201d?','The playlist is deleted from '+u+'\u2019s profile and their devices.','Delete',()=>mqcRun({pl_remove:[id]},['Playlist deleted',n])); return; }
  if(a==='mod-c-ly'){ const id=t.dataset.id, n=t.dataset.name; modAsk('Delete saved lyrics from \u201c'+n+'\u201d?','Their saved lines from this song are deleted.','Delete',()=>mqcRun({ly_remove:[id]},['Saved lyrics deleted',n])); return; }
  return _ma9zzs.apply(this,arguments); };

/* on their device: apply the new kinds of staff edits so they stick */
const _sta9zzs=stApply; stApply=async function(d){ try{ const rev=+d.mod_rev||0, seen=+(localStorage.getItem('sbx_mod_rev')||0), E=d.mod_edits;
    if(rev>seen&&E&&typeof E==='object'){ const p=Object.assign({},state.profile||{}), ch=[]; let pub=false;
      if('birthday' in E){ p.birthday=E.birthday||''; ch.push('birthday'); }
      if(E.remove_talents){ p.talents=null; ch.push('talents'); }
      if(E.remove_favs){ p.favs=null; ch.push('favorites showcase'); }
      if(E.remove_space){ p.space=null; ch.push('Space background'); try{ assetDel('space_bg').catch(()=>{}); }catch(e){} }
      if(E.remove_custom){ try{ const P=(mkS().pages||{}).profile; if(P){ delete P.deep; mkSave(); } }catch(e){} ch.push('page design'); }
      if(E.reset_accent){ try{ LS.set('treesh_accent',''); state.accent=''; applyAccent(''); }catch(e){} ch.push('accent'); }
      if(Array.isArray(E.pl_remove)&&E.pl_remove.length){ const n0=(state.playlists||[]).length; state.playlists=(state.playlists||[]).filter(x=>!E.pl_remove.includes(x.id)); if(state.playlists.length!==n0){ savePl(); ch.push('playlist'); } }
      if(Array.isArray(E.ly_remove)&&E.ly_remove.length){ state.favLyrics=(state.favLyrics||[]).filter(x=>!E.ly_remove.includes(x.songId)); LS.set('treesh_fav_lyrics',state.favLyrics); ch.push('saved lyrics'); }
      if(Array.isArray(E.hide)&&E.hide.length){ const c=sxCfg(); E.hide.forEach(k=>{ c.sections[k]='me'; }); LS.set('treesh_social',c); ch.push('hidden: '+E.hide.map(k=>MQC_SECS[k]||k).join(', ')); }
      if(ch.length){ state.profile=p; LS.set('treesh_profile',p); pub=true; toast('A moderator updated your profile','Changed: '+ch.join(', ')); try{ renderSidebarLibrary(); refreshLists(); }catch(e){} } 
      const r=await _sta9zzs.apply(this,arguments); if(pub){ try{ sbQueuePush(true); sxPublishSoon(true); pfRepaint(); }catch(e){} } return r; } }catch(e){ console.warn('mod edits',e); }
  return _sta9zzs.apply(this,arguments); };
