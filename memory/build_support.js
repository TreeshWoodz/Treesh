const L=require('/app/memory/lucide_src.js'); const fs=require('fs');
const toP=s=>s.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join('');
const src=fs.readFileSync('/app/memory/support.src.html','utf8');
const names=new Set(['circle-check','triangle-alert']); let m; const re=/data-i="([a-z0-9-]+)"/g; while((m=re.exec(src))) names.add(m[1]);
const map={}, miss=[]; names.forEach(n=>{ const ic=L.icons[toP(n)]; if(!ic){ miss.push(n); return; } map[n]=ic.map(([t,a])=>'<'+t+Object.keys(a).map(k=>' '+k+'="'+a[k]+'"').join('')+'/>').join(''); });
if(miss.length) console.log('missing icons:',miss.join(', '));
fs.writeFileSync('/app/single_html/support.html',src.replace('__ICONS__',JSON.stringify(map)));
console.log('support.html icons',Object.keys(map).length);
