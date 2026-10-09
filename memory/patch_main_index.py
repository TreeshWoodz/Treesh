import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8', newline='').read()
BN = r'''/* Banner focal point: phone (<640px) vs desktop value. Legacy px offsets become a clamped % so the photo always fills the frame. */
function bnPosPct(raw,iw,ih,cw,ch){
  const KW={left:0,top:0,center:50,right:100,bottom:100}, t=String(raw||'center').trim().toLowerCase().split(/\s+/).slice(0,2), out=[50,50], taken=[false,false];
  const s=(iw&&ih&&cw&&ch)?Math.max(cw/iw,ch/ih):0, over=[iw*s-cw, ih*s-ch];
  const val=(k,ax)=>{ let v=50; if(k in KW) v=KW[k]; else if(/%$/.test(k)) v=parseFloat(k); else if(/px$/.test(k)){ const o=over[ax]; v=o>0.5?(-parseFloat(k)/o*100):50; } return Math.max(0,Math.min(100,isNaN(v)?50:v)); };
  t.forEach(k=>{ const ax=(k==='top'||k==='bottom')?1:(k==='left'||k==='right')?0:-1; if(ax>=0){ out[ax]=val(k,ax); taken[ax]=true; } });
  t.forEach(k=>{ if(k==='top'||k==='bottom'||k==='left'||k==='right') return; const ax=taken[0]?1:0; if(taken[ax]) return; out[ax]=val(k,ax); taken[ax]=true; });
  return +out[0].toFixed(1)+'% '+(+out[1].toFixed(1))+'%';
}
const bnRaw=(d,m)=>(window.matchMedia&&matchMedia('(max-width:639px)').matches&&m)||d||'';
function bnPosFit(im){ try{ const raw=bnRaw(im.dataset.posD,im.dataset.posM); if(raw) im.style.objectPosition=bnPosPct(raw,im.naturalWidth,im.naturalHeight,im.clientWidth,im.clientHeight); }catch(e){} }
function bnAttrs(d,m){ if(!d&&!m) return ''; return `data-pos-d="${esc(d||'')}" data-pos-m="${esc(m||'')}" style="object-position:${bnPosPct(bnRaw(d,m))}" onload="bnPosFit(this)"`; }
window.addEventListener('resize',()=>{ document.querySelectorAll('img[data-pos-d]').forEach(bnPosFit); });

function parseArtists(doc){'''
reps = [
    ("""  try{ const rm=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && k.indexOf("treesh")===0) rm.push(k); } rm.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} }); }catch(e){}
  try{ localStorage.clear(); }catch(e){}
  try{ sessionStorage.clear(); }catch(e){}
""", """  [localStorage, sessionStorage].forEach(st=>{ try{ const rm=[]; for(let i=0;i<st.length;i++){ const k=st.key(i); if(k && TRANSFER_PREFIXES.some(p=>k.indexOf(p)===0)) rm.push(k); } rm.forEach(k=>{ try{ st.removeItem(k); }catch(e){} }); }catch(e){} });
"""),
    ("""function closeModal(){
""", """function closeModal(){
  state._confirmCb=null;
"""),
    ("""(function injectManifest(){""", """(function persistStorage(){ try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p=>{ if(!p) return navigator.storage.persist(); }).catch(()=>{}); }catch(e){} })();
(function injectManifest(){"""),
    ("""/* Full factory reset: erase ALL local data (localStorage + sessionStorage +
   IndexedDB)""", """/* Full factory reset: erase Treesh-owned local data (prefixed keys + IndexedDB)"""),
    ("""function parseArtists(doc){""", BN),
    ("""background: bg, bgPos: attr(el,"data-bg-pos") || "center",""", """background: bg, bgPos: attr(el,"data-bg-pos") || "center", bgPosM: attr(el,"data-bg-pos-mobile"),"""),
    ("""${img(a.background||a.image,'h-full w-full object-cover',`style="object-position:${esc(a.bgPos||'center')}"`)}""", """${img(a.background||a.image,'h-full w-full object-cover',bnAttrs(a.bgPos||'center',a.bgPosM))}"""),
    ("""m.backdrop=mdUrl(d.backdropPic||'');""", """m.backdrop=mdUrl(d.backdropPic||d.bg||'');"""),
    ("""function mdPhoto(src,name,cls){""", """function mdPhoto(src,name,cls,extra){"""),
    ("""${src?`<img src="${esc(src)}" alt="${esc(name||'')}" loading="lazy" """, """${src?`<img src="${esc(src)}" alt="${esc(name||'')}" ${extra||''} loading="lazy" """),
    ("""${mdPhoto(m.backdrop||m.pic,m.display,'md-hero-bg')}""", """${mdPhoto(m.backdrop||m.pic,m.display,'md-hero-bg',bnAttrs(m.bgPos,m.bgPosMobile))}"""),
]
for a, b in reps:
    if s.count(a) != 1 and s.count(a.replace('\n', '\r\n')) == 1:
        a, b = a.replace('\n', '\r\n'), b.replace('\n', '\r\n')
    n = s.count(a)
    assert n == 1, (a[:70], n)
    s = s.replace(a, b)
loader = open('/app/memory/wn_loader.js', encoding='utf-8').read()
if '__treeshWN' not in s:
    i = s.rfind('</body>')
    assert i > 0
    nl = '\r\n' if '\r\n' in s[:2000] else '\n'
    s = s[:i] + loader.replace('\n', nl) + s[i:]
notify = open('/app/memory/icon_notify.js', encoding='utf-8').read()
if 'treesh_icon_review_seen' not in s:
    i = s.rfind('</body>')
    assert i > 0
    nl = '\r\n' if '\r\n' in s[:2000] else '\n'
    s = s[:i] + notify.replace('\n', nl) + s[i:]
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('ok', len(s))
