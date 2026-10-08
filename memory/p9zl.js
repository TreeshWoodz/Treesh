/* ---------- P9zl: Urias, the voice assistant. Tips stay tucked away; your words dissolve into Urias's reply ---------- */
let _vxTips=false, _vxLive='', _vxOut='', _vxAt=0;
function vxName(){ const n=String(LS.get('treesh_vx_name','')||'').replace(/\s+/g,' ').trim().slice(0,24); return n||'Urias'; }
function vxWordsKey(){ const m=_voiceMode; if(m==='denied'||m==='unsupported') return 'off:'+m; if(_vxLive) return 'live'; if(_voiceLast.reply) return 'r:'+_vxAt; return 'p:'+(m==='listening'?'l':'i'); }
function vxWordsHtml(){ const m=_voiceMode;
  if(m==='denied'||m==='unsupported') return `<p data-testid="voice-live-transcript" class="vx-said is-dim">${m==='denied'?'Allow microphone access in your browser, or type a command.':'This browser can\u2019t hear you, but you can type or tap a command.'}</p>`;
  if(_vxLive) return `<p id="voice-utext" data-testid="voice-live-transcript" class="vx-said is-live">${esc(_vxLive)}</p>`;
  const r=_voiceLast.reply;
  if(r){ const fresh=performance.now()-_vxAt<1600; let i=0;
    const words=String(r).split(/(\s+)/).map(w=>/^\s*$/.test(w)?w:`<span class="vx-w" style="--i:${Math.min(i++,36)}">${esc(w)}</span>`).join('');
    return `${fresh&&_vxOut?`<p class="vx-said vx-gone" aria-hidden="true" data-testid="voice-said-out">${esc(_vxOut)}</p>`:''}<div class="vx-say${fresh?' is-new':''}" data-testid="voice-reply" role="status"><span class="vx-say-k"><i data-lucide="sparkles"></i><b data-testid="voice-reply-name">${esc(vxName())}</b></span><p class="vx-say-t">${words}</p></div>`; }
  return m==='listening'?`<p id="voice-utext" data-testid="voice-live-transcript" class="vx-said is-dim">Go ahead, I\u2019m listening\u2026</p>`:`<p data-testid="voice-live-transcript" class="vx-said is-dim">What can I do for you?</p>`; }

/* tips: only a keyboard and a Tips button until you ask for more */
vx3Chips=function(){ const kb=`<button type="button" data-act="vx3-type" data-testid="voice-type-toggle" aria-pressed="${_vx3Type}" class="vx3-chip is-ic press${_vx3Type?' on':''}" aria-label="Type a command"><i data-lucide="keyboard"></i></button>`;
  const tip=`<button type="button" data-act="vx-tips" data-testid="voice-tips-toggle" aria-pressed="${_vxTips}" aria-label="${_vxTips?'Hide tips':'Show tips'}" class="vx3-chip is-tip press${_vxTips?' on':''}"><i data-lucide="${_vxTips?'x':'lightbulb'}"></i>${_vxTips?'Hide tips':'Tips'}</button>`;
  if(!_vxTips) return `<div class="vx3-chips is-tucked" data-testid="voice-chips">${kb}${tip}</div>`;
  const s=SONGS.find(x=>x&&!x._user&&!umIsUserId(x.id)&&x.title&&!QUOTE_BAD.test(x.title));
  const q=[...(s?[['play '+s.title.toLowerCase(),'Play '+s.title]]:[]),["play my favorites","Play favorites"],["pause","Pause"],["next song","Next"],["shuffle","Shuffle"],["what's playing","What\u2019s playing"],["change theme to blue","Theme blue"],["dark mode","Dark mode"],["open studios","Studios"]];
  const macs=(_voiceMacros||[]).slice(0,6).map(mm=>`<button type="button" data-act="voice-run-macro" data-id="${mm.id}" class="vx3-chip is-mac press"><i data-lucide="wand-2"></i>${esc(mm.phrase)}</button>`).join('');
  let n=0; const st=()=>` style="--n:${n++}"`;
  return `<div class="vx3-chips no-scrollbar is-open" data-testid="voice-chips">${kb}${tip}<button type="button" data-act="voice-help-toggle" data-testid="voice-help-toggle" class="vx3-chip is-ic is-pop press${_voiceHelp?' on':''}"${st()} aria-label="All commands"><i data-lucide="list"></i></button>${q.map(x=>`<button type="button" data-act="voice-run" data-cmd="${esc(x[0])}" data-testid="voice-tip-chip" class="vx3-chip is-pop press"${st()}>${esc(x[1])}</button>`).join('')}${macs}</div>`; };
vx3TypeRow=function(){ return _vx3Type?`<div class="vx3-type"><input id="voice-input" data-testid="voice-type-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Ask ${esc(vxName())}\u2026" value="${esc(_voiceTyped||'')}"><button type="button" data-act="voice-send" data-testid="voice-send-button" aria-label="Run command" class="press"><i data-lucide="arrow-up"></i></button></div>`:''; };
voiceBodyHtml=function(){ try{ vxTipsSync(); }catch(e){} const off=_voiceMode==='denied'||_voiceMode==='unsupported';
  return `<div class="vx3-head"><button type="button" data-act="voice-speak" data-testid="voice-speak-toggle" aria-label="Toggle spoken replies" class="vx-ic press${_voiceSpeak?' is-on':''}"><i data-lucide="${_voiceSpeak?'volume-2':'volume-x'}"></i></button><span class="vx3-brand" data-testid="voice-assistant-name">${esc(vxName())}</span><button type="button" data-act="voice-cancel" aria-label="Close" data-testid="voice-close-button" class="vx-ic press"><i data-lucide="x"></i></button></div>
  <div class="vx3-words" data-k="${vxWordsKey()}">${vxWordsHtml()}</div>
  <div class="vx3-dock">${_voiceHelp?`<div class="vx3-help no-scrollbar" data-testid="voice-help">${voiceHelpPanel()}</div>`:''}${vx3TypeRow()}${vx3Chips()}${off?`<button type="button" data-act="voice-retry" data-testid="voice-retry" class="vx3-retry press"><i data-lucide="rotate-ccw"></i>Try again</button>`:''}</div>`; };

/* re-renders only swap the parts that changed, so a reply keeps animating and typing keeps focus */
const _vxR9zl=voiceRender; voiceRender=function(){ const el=$("#voice-ov"); if(!el||!el.classList.contains('vx3')) return _vxR9zl.apply(this,arguments);
  const body=el.querySelector('[data-voice-body]'); if(!body) return; el.dataset.mode=_voiceMode||'idle';
  const tpl=document.createElement('div'); tpl.innerHTML=voiceBodyHtml();
  if(!body.querySelector(':scope > .vx3-head')) body.innerHTML=tpl.innerHTML;
  else ['.vx3-head','.vx3-words','.vx3-dock'].forEach(sel=>{ const a=body.querySelector(':scope > '+sel), b=tpl.querySelector(':scope > '+sel); if(!a||!b) return; if(sel==='.vx3-words'&&a.dataset.k===b.dataset.k) return; if(a.outerHTML!==b.outerHTML) a.replaceWith(b); });
  if(!body._st) body._st=setTimeout(()=>body.classList.add('is-settled'),900);
  const o=el.querySelector('.vx-orb'); if(o){ o.className='vx-orb press is-'+vx3Mode(); const core=o.querySelector('.vx-core'); if(core&&core.dataset.ic!==vx3Icon()){ core.dataset.ic=vx3Icon(); core.innerHTML=`<i data-lucide="${vx3Icon()}"></i>`; } }
  const stt=el.querySelector('#vx3-status'); if(stt) stt.textContent=vx3Status(); icons(); };
voiceLiveTranscript=function(t){ t=String(t||'').trim(); if(!t&&!_vxLive) return; _vxLive=t; const w=document.querySelector('#voice-ov .vx3-words'); if(!w) return;
  if(w.dataset.k===vxWordsKey()){ const u=document.getElementById('voice-utext'); if(u&&t){ u.textContent=t; return; } }
  voiceRender(); };

/* commands: "Hey Urias, next song" works, and Urias knows its own name */
function vxNameRe(nm){ return new RegExp('^(?:(?:hey|hi|hello|ok|okay|yo)[\\s,]+)?'+nm.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![a-z0-9])[\\s,.!?]*','i'); }
const _vxApply9zl=voiceApply; voiceApply=function(text){ const raw=String(text||'').trim(); if(!raw) return; const nm=vxName(), cmd=raw.replace(vxNameRe(nm),'').trim();
  _vxOut=_vxLive||raw; _vxLive=''; _vxAt=performance.now();
  if(cmd&&!/^(what'?s|what is) your name\??$|^who are you\??$|^what are you called\??$/i.test(cmd)) return _vxApply9zl.call(this,cmd);
  clearTimeout(_voiceRestartT); if(listening){ try{ if(recog) recog.abort(); }catch(e){} } listening=false; _voiceTyped='';
  _voiceLast={user:raw,reply:cmd?`I\u2019m ${nm}, your Treesh assistant. You can rename me in Settings.`:`Hey! I\u2019m ${nm}. What can I do for you?`};
  if(_voiceSpeak&&('speechSynthesis' in window)){ voiceSpeak(_voiceLast.reply,()=>{ _voiceSpeaking=false; voiceResumeListen(); }); }
  else { _voiceSpeaking=false; _voiceMode=(_voiceActive&&!_voicePaused&&!_voiceNoMic&&recog)?'listening':'idle'; voiceRender(); voiceResumeListen(); } };
const _vxOpen9zl=voiceOpen; voiceOpen=function(){ _vxLive=''; _vxOut=''; _vxAt=0; _vxTips=false; return _vxOpen9zl.apply(this,arguments); };

document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="vx-tips"],[data-act="vx-name-reset"]'); if(!t) return;
  if(t.dataset.act==='vx-tips'){ _vxTips=!_vxTips; if(!_vxTips) _voiceHelp=false; voiceRender(); return; }
  vxNameSet(''); const i=document.getElementById('vx-name-input'); if(i) i.value=vxName(); });

/* Settings > Voice: rename the assistant */
function vxNameSet(v){ v=String(v||'').replace(/\s+/g,' ').trim().slice(0,24); const before=vxName(); LS.set('treesh_vx_name',v); const now=vxName(); if(now!==before){ toast('Say hi to '+now,'Your voice assistant\u2019s new name'); try{ voiceRender(); }catch(e){} } }
function vxNameFieldHtml(){ const nm=vxName();
  return `<div class="vxn-field" data-testid="settings-voice-name-field"><label for="vx-name-input" class="vxn-l">Assistant name</label><div class="vxn-row"><span class="vxn-ic" aria-hidden="true"><i data-lucide="sparkles"></i></span><input id="vx-name-input" data-testid="settings-voice-name" maxlength="24" autocomplete="off" spellcheck="false" placeholder="Urias" value="${esc(nm)}" enterkeyhint="done"><button type="button" data-act="vx-name-reset" data-testid="settings-voice-name-reset" class="vxn-reset press"${nm==='Urias'?' disabled':''}>Reset</button></div><p class="vxn-h">Say \u201cHey ${esc(nm)}\u201d before a command, or just talk. The name shows on the assistant and its replies.</p></div>`; }
const _vSet9zl=viewSettings; viewSettings=function(){ const h=_vSet9zl.apply(this,arguments), k='<button data-act="voice-speak" data-testid="settings-toggle-voice-speak"'; return h.indexOf(k)<0?h:h.replace(k,vxNameFieldHtml()+k); };
document.addEventListener('change',e=>{ if(e.target&&e.target.id==='vx-name-input'){ vxNameSet(e.target.value); e.target.value=vxName(); const r=document.querySelector('[data-testid="settings-voice-name-reset"]'); if(r) r.disabled=vxName()==='Urias'; } });
document.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target&&e.target.id==='vx-name-input'){ e.preventDefault(); e.target.blur(); } });
if(typeof SETTINGS_INDEX!=='undefined') SETTINGS_INDEX.push({id:'vxname',label:'Assistant name',desc:'Rename Urias, your voice assistant',kw:'voice assistant name urias rename siri call',ic:'sparkles',type:'action',voice:true,go:()=>{ state.settingsTab='voice'; closeSearch(); setTimeout(()=>{ try{ navigate('settings'); }catch(e){} },210); }});
