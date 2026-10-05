/* ---------- P9: built-in icons (draw instantly, work offline, no CDN wait) ---------- */
const ICO=__ICO__;
const _icoT={}; let _icoCdn=0;
function icoPascal(s){ return String(s).replace(/(^|[-_\s]+)([a-z0-9])/g,(m,a,c)=>c.toUpperCase()); }
function icoInner(n){ let v=ICO[n]; if(v!=null) return v; const L=window.lucide, node=L&&L.icons&&L.icons[icoPascal(n)]; if(!node) return null; v=node.map(([t,a])=>'<'+t+Object.keys(a).map(k=>' '+k+'="'+a[k]+'"').join('')+'/>').join(''); ICO[n]=v; return v; }
function icoTpl(n){ let t=_icoT[n]; if(t) return t; const inner=icoInner(n); if(inner==null) return null; t=document.createElementNS('http://www.w3.org/2000/svg','svg'); [['xmlns','http://www.w3.org/2000/svg'],['width','24'],['height','24'],['viewBox','0 0 24 24'],['fill','none'],['stroke','currentColor'],['stroke-width','2'],['stroke-linecap','round'],['stroke-linejoin','round']].forEach(a=>t.setAttribute(a[0],a[1])); t.innerHTML=inner; return (_icoT[n]=t); }
function icoRender(root){ const list=(root||document).querySelectorAll('i[data-lucide]'); let miss=0;
  for(let i=0;i<list.length;i++){ const el=list[i], n=el.getAttribute('data-lucide'); const t=n&&icoTpl(n); if(!t){ miss++; continue; }
    const svg=t.cloneNode(true), at=el.attributes; let a11y=false;
    for(let k=0;k<at.length;k++){ const nm=at[k].name; if(nm==='class') continue; if(nm.indexOf('aria-')===0||nm==='role'||nm==='title') a11y=true; svg.setAttribute(nm,at[k].value); }
    if(!a11y) svg.setAttribute('aria-hidden','true'); svg.setAttribute('class',('lucide lucide-'+n+' '+(el.getAttribute('class')||'')).trim());
    if(el.parentNode) el.parentNode.replaceChild(svg,el); }
  if(miss) icoCdn(); }
function icoCdn(){ if(_icoCdn||window.lucide||navigator.onLine===false) return; _icoCdn=1;
  const add=(u,next)=>{ const s=document.createElement('script'); s.src=u; s.async=true; s.onload=()=>{ try{ icoRender(); }catch(e){} }; s.onerror=()=>{ if(next) next(); else _icoCdn=0; }; document.head.appendChild(s); };
  add('https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',()=>add('https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js')); }
