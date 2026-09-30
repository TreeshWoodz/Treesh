import sys
P = "/app/single_html/index.html"
s = open(P, encoding="utf-8").read()
orig_len = len(s)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        print("MISMATCH", n, "for:", old[:120]); sys.exit(1)
    s = s.replace(old, new)

# 1. IDB: add assets store + helpers
rep('const IDB_NAME="treesh_media", IDB_VER=1, IDB_STORE="tracks";',
    'const IDB_NAME="treesh_media", IDB_VER=2, IDB_STORE="tracks", IDB_ASSETS="assets";')
rep('rq.onupgradeneeded=e=>{ const db=e.target.result; if(!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE,{keyPath:"id"}); };\n    rq.onsuccess=e=>res(e.target.result);',
    'rq.onupgradeneeded=e=>{ const db=e.target.result; if(!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE,{keyPath:"id"}); if(!db.objectStoreNames.contains(IDB_ASSETS)) db.createObjectStore(IDB_ASSETS,{keyPath:"id"}); };\n    rq.onsuccess=e=>{ const db=e.target.result; db.onversionchange=()=>{ try{ db.close(); }catch(_){} _idbPromise=null; }; res(db); };')
rep('function idbGet(id){ return idbTx("readonly")',
    '''/* Device asset store (custom fonts, backdrop images): lives in IndexedDB so it uses real device space, not the ~5 MB localStorage cap. */
function assetTx(mode){ return idbOpen().then(db=>db.transaction(IDB_ASSETS, mode)); }
function assetPut(id,value){ return assetTx("readwrite").then(tx=>new Promise((res,rej)=>{ tx.objectStore(IDB_ASSETS).put({id,value,at:Date.now()}); tx.oncomplete=()=>res(true); tx.onerror=()=>rej(tx.error); tx.onabort=()=>rej(tx.error); })); }
function assetGet(id){ return assetTx("readonly").then(tx=>new Promise((res,rej)=>{ const r=tx.objectStore(IDB_ASSETS).get(id); r.onsuccess=()=>res(r.result?r.result.value:null); r.onerror=()=>rej(r.error); })); }
function assetDel(id){ return assetTx("readwrite").then(tx=>new Promise((res)=>{ tx.objectStore(IDB_ASSETS).delete(id); tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); })); }
function assetAll(){ return assetTx("readonly").then(tx=>new Promise((res,rej)=>{ const r=tx.objectStore(IDB_ASSETS).getAll(); r.onsuccess=()=>res(r.result||[]); r.onerror=()=>rej(r.error); })); }
function assetClear(){ return assetTx("readwrite").then(tx=>new Promise((res)=>{ tx.objectStore(IDB_ASSETS).clear(); tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); })).catch(()=>false); }
function assetBytes(v){ if(v==null) return 0; if(typeof v==="string") return v.length; if(typeof v==="object"){ if(Array.isArray(v)) return v.reduce((a,x)=>a+assetBytes(x),0); return Object.keys(v).reduce((a,k)=>a+assetBytes(v[k]),0); } return 8; }
function idbGet(id){ return idbTx("readonly")''')

# 2. bgSaveImages -> IndexedDB for image data, localStorage only for small index/meta
rep('''  try{
    localStorage.setItem("treesh_bg_images", JSON.stringify(state.bgImages));
    localStorage.setItem("treesh_bg_index", JSON.stringify(state.bgIndex));
    localStorage.setItem("treesh_bg_meta", JSON.stringify(state.bgMeta));
    /* keep legacy single-image key in sync (small) for backward compatibility */
    localStorage.setItem("treesh_bg_image", JSON.stringify(state.bgImage));
    return true;
  }catch(e){ return false; }
}''', '''  _bgTouched=true;
  const snap=state.bgImages.slice();
  _assetsBoot.then(()=>assetPut("bg_images", snap)).then(()=>{ try{ localStorage.removeItem("treesh_bg_images"); localStorage.removeItem("treesh_bg_image"); }catch(e){} }).catch(()=>toast("Couldn\\u2019t save backdrop","Your device storage may be full"));
  try{
    localStorage.setItem("treesh_bg_index", JSON.stringify(state.bgIndex));
    localStorage.setItem("treesh_bg_meta", JSON.stringify(state.bgMeta));
  }catch(e){ if(isQuotaError(e)) notifyStorageFull(); }
  return true;
}
/* Boot: load backdrops + custom font from IndexedDB; migrate any legacy localStorage copies once, then free that space. */
let _bgTouched=false;
const _assetsBoot=(async()=>{
  try{
    let imgs=null; try{ imgs=await assetGet("bg_images"); }catch(e){ return; }
    const legacy=LS.get("treesh_bg_images",null), legacy1=LS.get("treesh_bg_image","");
    const legacyArr=Array.isArray(legacy)?legacy.filter(Boolean):(legacy1?[legacy1]:[]);
    if(legacyArr.length){ imgs=legacyArr.slice(0,9); await assetPut("bg_images", imgs); }
    try{ localStorage.removeItem("treesh_bg_images"); localStorage.removeItem("treesh_bg_image"); }catch(e){}
    if(!_bgTouched && Array.isArray(imgs)){
      state.bgImages=imgs.filter(Boolean).slice(0,9);
      if(state.bgIndex>Math.max(0,state.bgImages.length-1)) state.bgIndex=0;
      state.bgImage=state.bgImages[state.bgIndex]||"";
      try{ renderBackground(); if(state.view==="settings") renderView(); }catch(e){}
    }
    const cf=LS.get("treesh_custom_font",null);
    if(cf && cf.data){ await assetPut("custom_font",{data:cf.data,name:cf.name||"Custom"}); LS.set("treesh_custom_font",{name:cf.name||"Custom",idb:true}); if(state.customFont&&state.customFont.data) state.customFont.idb=true; }
    else if(cf && cf.idb){ const v=await assetGet("custom_font"); if(v&&v.data&&state.customFont&&state.customFont.idb&&!state.customFont.data){ state.customFont={data:v.data,name:v.name||cf.name,idb:true}; _customFontLoaded=false; try{ applyUiFont(); }catch(e){} } }
  }catch(e){ console.warn("Asset load failed", e); }
})();''')

# 3. Backdrops: sharper images now that there's room
rep('r.onload=()=>{ compressImageDataUrl(r.result, 1280, 0.72).then(small=>{\n    state.bgImages=(state.bgImages||[]).filter(Boolean);',
    'r.onload=()=>{ compressImageDataUrl(r.result, 1920, 0.85).then(small=>{\n    state.bgImages=(state.bgImages||[]).filter(Boolean);')
rep('if((state.bgImages||[]).length>=3){ toast("Limit reached","You can save up to 3 images"); return; } const r=new FileReader(); r.onload=()=>{ compressImageDataUrl(r.result, 1600, 0.82)',
    'if((state.bgImages||[]).length>=9){ toast("Limit reached","You can save up to 9 images"); return; } const r=new FileReader(); r.onload=()=>{ compressImageDataUrl(r.result, 1920, 0.85)')

# 4. Font upload -> IndexedDB
rep('''if(f.size>3*1024*1024){ toast("Font too large","Use one under 3 MB"); return; } const r=new FileReader(); r.onload=()=>{ try{ const prev=state.customFont; state.customFont={data:r.result, name:(f.name||'Custom').replace(/\\.[^.]+$/,'')}; state.uiFont=""; _customFontLoaded=false; const ok=LS.set("treesh_custom_font",state.customFont); if(!ok){ state.customFont=prev; _customFontLoaded=false; applyUiFont(); renderView(); toast("Storage full","Not enough room to save this font. Free up space in Settings \\u2192 Storage, then try again."); return; } applyUiFont(); renderView(); toast("Custom font applied", state.customFont.name); }catch(err){ toast("Couldn\\u2019t load font"); } }; r.readAsDataURL(f);''',
    '''if(f.size>15*1024*1024){ toast("Font too large","Use one under 15 MB"); return; } const r=new FileReader(); r.onload=()=>{ const name=(f.name||'Custom').replace(/\\.[^.]+$/,''); const data=r.result; assetPut("custom_font",{data,name}).then(()=>{ state.customFont={data,name,idb:true}; state.uiFont=""; _customFontLoaded=false; LS.set("treesh_custom_font",{name,idb:true}); applyUiFont(); renderView(); toast("Custom font applied", name); }).catch(()=>toast("Couldn\\u2019t save font","Your device storage may be full")); }; r.readAsDataURL(f);''')
rep('${state.customFont&&state.customFont.data?`<p class="mt-2 text-xs text-emerald-300">Custom uploaded font active.</p>`:\'\'}',
    '${state.customFont&&(state.customFont.data||state.customFont.idb)?`<p class="mt-2 text-xs text-emerald-300" data-testid="custom-font-active">Custom uploaded font active \\u00b7 saved on device storage.</p>`:\'\'}')
rep('case "set-font": { state.uiFont=t.dataset.val; state.customFont=null; LS.set("treesh_font",state.uiFont); LS.set("treesh_custom_font",null);',
    'case "set-font": { state.uiFont=t.dataset.val; state.customFont=null; LS.set("treesh_font",state.uiFont); LS.set("treesh_custom_font",null); assetDel("custom_font").catch(()=>{});')
rep('case "clear-custom-font": { state.customFont=null; LS.set("treesh_custom_font",null);',
    'case "clear-custom-font": { state.customFont=null; LS.set("treesh_custom_font",null); assetDel("custom_font").catch(()=>{});')
rep('state.customFont={google:name.replace(/\\s+/g,\'+\'), name}; state.uiFont=""; LS.set("treesh_custom_font",state.customFont);',
    'state.customFont={google:name.replace(/\\s+/g,\'+\'), name}; state.uiFont=""; LS.set("treesh_custom_font",state.customFont); assetDel("custom_font").catch(()=>{});')

# 5. Storage groups: new "Fonts & backgrounds" group (IndexedDB-backed)
rep('"treesh_bg","treesh_bg_image","treesh_bg_overlay",', '"treesh_bg","treesh_bg_overlay",')
rep('"treesh_font","treesh_custom_font","treesh_label",', '"treesh_font","treesh_label",')
rep('''  { id:"cache", label:"Cache", icon:"database",''',
    '''  { id:"assets", label:"Fonts & backgrounds", icon:"image", desc:"Custom fonts & backdrop images, saved on device storage", keys:["treesh_custom_font","treesh_bg_meta","treesh_bg_index","treesh_bg_slide","treesh_bg_dim","treesh_bg_text_style","treesh_bg_images","treesh_bg_image"], assets:true },
  { id:"cache", label:"Cache", icon:"database",''')
rep('function groupBytes(g){ let t=(g.keys||[]).reduce((a,k)=>a+lsBytes(k),0);',
    'function groupBytes(g){ let t=(g.keys||[]).reduce((a,k)=>a+lsBytes(k),0); if(g.assets) t+=state._assetBytes||0;')
rep('''if(g.idb&&g.idb.length){ g.idb.forEach(db=>{ try{ indexedDB.deleteDatabase(db); }catch(e){} }); } location.reload(); }); break; }''',
    '''if(g.idb&&g.idb.length){ g.idb.forEach(db=>{ try{ indexedDB.deleteDatabase(db); }catch(e){} }); } if(g.assets){ assetClear().then(()=>location.reload()); } else location.reload(); }); break; }''')
rep('''rm.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} }); }catch(e){} location.reload(); }); break; }''',
    '''rm.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} }); }catch(e){} assetClear().then(()=>location.reload()); }); break; }''')
rep('<p class="mt-0.5 text-[11px] text-white/40">Uploaded music &amp; recordings</p>',
    '<p class="mt-0.5 text-[11px] text-white/40">Uploaded music, recordings, fonts &amp; backdrops</p>')
rep('''    state._idbBytes=idb;
    if(totalEl) totalEl.textContent=fmtBytes(idb);''',
    '''    return assetAll().catch(()=>[]).then(as=>{ const ab=(as||[]).reduce((a,r)=>a+assetBytes(r.value),0); state._assetBytes=ab; idb+=ab;
    const g=STORAGE_GROUPS.find(x=>x.id==="assets"); const szEl=document.getElementById("storage-size-assets"); if(g&&szEl){ const b=groupBytes(g); szEl.textContent=fmtBytes(b); const cb=document.querySelector('[data-testid="storage-clear-assets"]'); if(cb){ cb.classList.toggle("pointer-events-none", b<=0); cb.classList.toggle("opacity-30", b<=0); } }
    state._idbBytes=idb;
    if(totalEl) totalEl.textContent=fmtBytes(idb);''')
rep('''    if(navigator.storage && navigator.storage.estimate){
      navigator.storage.estimate().then(est=>paint((est&&est.quota)||0,(est&&est.usage)||0)).catch(()=>paint(0,0));
    } else { paint(0,0); }
  }).catch(''',
    '''    if(navigator.storage && navigator.storage.estimate){
      navigator.storage.estimate().then(est=>paint((est&&est.quota)||0,(est&&est.usage)||0)).catch(()=>paint(0,0));
    } else { paint(0,0); }
    });
  }).catch(''')

# 6. Transfer: include device assets
rep('''    const payload={ app:"treesh", type:"treesh-backup", v:1, exportedAt:new Date().toISOString(), localStorage:ls, media };''',
    '''    let assets=[]; try{ assets=(await assetAll()).map(r=>({id:r.id, value:r.value})); }catch(e){}
    const payload={ app:"treesh", type:"treesh-backup", v:2, exportedAt:new Date().toISOString(), localStorage:ls, media, assets };''')
rep('''try{ await idbPut(rec); }catch(e){} } }
        toast("Restoring\\u2026"''',
    '''try{ await idbPut(rec); }catch(e){} } }
        await assetClear(); if(Array.isArray(data.assets)){ for(const a of data.assets){ if(a&&a.id) try{ await assetPut(a.id, a.value); }catch(e){} } }
        toast("Restoring\\u2026"''')
rep('Includes your profile, playlists, settings, game saves and uploaded music.',
    'Includes your profile, playlists, settings, game saves, fonts, backdrops and uploaded music.')

open(P, "w", encoding="utf-8").write(s)
print("OK", orig_len, "->", len(s))
