/* ---------- P9zzh: desktop sidebar reads Home, Icons, Studios, Game (phones keep Game, Studios, Home, Icons, Profile). A custom order from Magic Markup still wins ---------- */
const NAV_DESK=['library','artists','studios','game','profile'];
function mkNavDesk(){ const list=mkNav(NAV), o=mkS().navOrder; if(Array.isArray(o)&&o.length) return list;
  return list.slice().sort((a,b)=>NAV_DESK.indexOf(a[0])-NAV_DESK.indexOf(b[0])); }
/* Magic Markup's reorder list shows the order you actually see: desktop order on computers */
const _noo9zzh=navOrderOf; navOrderOf=function(list){ const r=_noo9zzh.apply(this,arguments), o=mkS().navOrder;
  if(list!==NAV||(Array.isArray(o)&&o.length)||!matchMedia('(min-width:1024px)').matches) return r;
  return r.slice().sort((a,b)=>NAV_DESK.indexOf(a[0])-NAV_DESK.indexOf(b[0])); };
