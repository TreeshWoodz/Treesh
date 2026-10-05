/* ---------- text markup tools (blog + lyrics) ---------- */
function taInsert(ta, text, selFrom, selTo){
  ta.focus();
  const ok = document.queryCommandSupported && document.queryCommandSupported('insertText') && document.execCommand('insertText', false, text);
  if (!ok){ ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input', { bubbles:true })); }
  if (selFrom != null) ta.setSelectionRange(selFrom, selTo);
}
function taWrap(ta, before, after, ph){
  const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value, sel = v.slice(s, e);
  if (sel && v.slice(s - before.length, s) === before && v.slice(e, e + after.length) === after){
    ta.setSelectionRange(s - before.length, e + after.length); return taInsert(ta, sel, s - before.length, e - before.length);
  }
  const inner = sel || ph; taInsert(ta, before + inner + after, s + before.length, s + before.length + inner.length);
}
function taLines(ta, fn){
  const v = ta.value, a = v.lastIndexOf('\n', ta.selectionStart - 1) + 1, z0 = v.indexOf('\n', ta.selectionEnd), z = z0 < 0 ? v.length : z0;
  const out = fn(v.slice(a, z).split('\n')).join('\n');
  ta.setSelectionRange(a, z); taInsert(ta, out, a, a + out.length);
}
const taPrefix = (ta, p, rx) => taLines(ta, ls => { const all = ls.every(l => rx.test(l)); return ls.map((l, i) => all ? l.replace(rx, '') : (typeof p === 'function' ? p(i) : p) + l.replace(rx, '')); });

const MD_TOOLS = [
  ['bold','bold','Bold (⌘B)'],['italic','italic','Italic (⌘I)'],['underline','underline','Underline (⌘U)'],['strike','strikethrough','Strikethrough'],['mark','highlighter','Highlight'],['code','code','Inline code (⌘E)'],'|',
  ['h2','heading-2','Section heading (new card)'],['h3','heading-3','Subheading'],['h4','heading-4','Small heading'],['quote','quote','Quote'],['callout','message-square-warning','Callout box'],'|',
  ['ul','list','Bullet list'],['ol','list-ordered','Numbered list'],['check','list-checks','Checklist'],'|',
  ['link','link','Link (⌘K)'],['button','mouse-pointer-click','Button link'],['img','image','Image by link'],['upload','image-up','Upload image'],['yt','youtube','YouTube video'],'|',
  ['badge','tag','Badge on this section'],['more','chevrons-down','Read more break'],['hr','minus','Divider'],['pre','square-code','Code block'],'|',['undo','undo-2','Undo'],['redo','redo-2','Redo']
];
const toolbar = (tools, kind) => `<div class="md-bar" role="toolbar" data-bar="${kind}" data-testid="${kind}-toolbar">${tools.map(t => t === '|' ? '<span class="md-sep"></span>' : `<button type="button" data-tool="${t[0]}" title="${esc(t[2])}" aria-label="${esc(t[2])}" data-testid="${kind}-tool-${t[0]}">${t[3] === 'txt' ? esc(t[1]) : icon(t[1])}</button>`).join('')}</div>`;
function mdTool(ta, k, onUpload){
  const ask = (q, d) => { const r = prompt(q, d); return r == null ? null : r.trim(); };
  const block = s => { const v = ta.value, at = ta.selectionStart, pre = at && v[at - 1] !== '\n' ? '\n\n' : (at > 1 && v[at - 2] !== '\n' ? '\n' : ''); taInsert(ta, pre + s + '\n'); };
  ({
    bold: () => taWrap(ta, '**', '**', 'bold text'), italic: () => taWrap(ta, '*', '*', 'italic text'), underline: () => taWrap(ta, '++', '++', 'underlined'),
    strike: () => taWrap(ta, '~~', '~~', 'struck'), mark: () => taWrap(ta, '==', '==', 'highlighted'), code: () => taWrap(ta, '`', '`', 'code'),
    h2: () => taPrefix(ta, '## ', /^#{1,6}\s+/), h3: () => taPrefix(ta, '### ', /^#{1,6}\s+/), h4: () => taPrefix(ta, '#### ', /^#{1,6}\s+/),
    quote: () => taPrefix(ta, '> ', /^>\s?/), callout: () => taPrefix(ta, i => i ? '> ' : '> [!tip] ', /^>\s?(\[!\w+\]\s*)?/),
    ul: () => taPrefix(ta, '- ', /^\s*[-*]\s+(\[[ x]\]\s+)?/), ol: () => taPrefix(ta, i => `${i + 1}. `, /^\s*\d+[.)]\s+/), check: () => taPrefix(ta, '- [ ] ', /^\s*[-*]\s+\[[ x]\]\s+/),
    link: () => { const u = ask('Link address', 'https://'); if (u) taWrap(ta, '[', `](${u})`, 'link text'); },
    button: () => { const u = ask('Button link', 'https://treesh.app'); if (u) taWrap(ta, '[[', `]](${u})`, 'Listen now'); },
    img: () => { const u = ask('Image link', 'https://'); if (!u) return; const c = ask('Caption (optional)', ''); block(`![${c || ''}](${u}${c ? ` "${c.replace(/"/g, '')}"` : ''})`); },
    upload: () => onUpload && onUpload(url => block(`![](${url})`)),
    yt: () => { const u = ask('YouTube link', 'https://youtu.be/'); if (u) block(`@youtube(${u})`); },
    badge: () => { const b = ask('Badge text (gold:NEW for a gold badge, accent for a purple edge)', 'NEW'); if (!b) return; const v = ta.value, h0 = v.lastIndexOf('\n## ', ta.selectionStart - 1), h = h0 >= 0 ? h0 + 1 : v.startsWith('## ') ? 0 : -1; if (h < 0) return toast('Put the cursor inside a “## Section” first.', 'info'); const e = v.indexOf('\n', h), z = e < 0 ? v.length : e; ta.setSelectionRange(z, z); taInsert(ta, ` {${b}}`); },
    more: () => block('\n+++\n'), hr: () => block('---'), pre: () => { const s = ta.selectionStart; block('```\ncode\n```'); ta.setSelectionRange(ta.value.indexOf('code', s), ta.value.indexOf('code', s) + 4); },
    undo: () => { ta.focus(); document.execCommand('undo'); }, redo: () => { ta.focus(); document.execCommand('redo'); }
  }[k] || (() => {}))();
}
function mdKeys(e, ta, run){
  if (!(e.metaKey || e.ctrlKey)) return;
  const k = { b:'bold', i:'italic', u:'underline', k:'link', e:'code' }[e.key.toLowerCase()];
  if (k){ e.preventDefault(); run(k); }
}

const LYR_TOOLS = [['Intro','[Intro]','Intro tag','txt'],['Verse','[Verse]','Verse tag (auto-numbered)','txt'],['Pre','[Pre-Chorus]','Pre-Chorus tag','txt'],['Chorus','[Chorus]','Chorus tag','txt'],['Hook','[Hook]','Hook tag','txt'],['Bridge','[Bridge]','Bridge tag','txt'],['Outro','[Outro]','Outro tag','txt'],'|',
  ['adlib','(ad-lib)','Wrap in parentheses (ad-lib)','txt'],['repeat','repeat','Repeat last chorus'],['dup','copy-plus','Duplicate line'],['cap','case-sensitive','Capitalize each line'],['upper','case-upper','UPPERCASE / lowercase'],['clean','sparkles','Clean up spacing'],'|',['undo','undo-2','Undo'],['redo','redo-2','Redo']];
function lyrTool(ta, k){
  const tag = t => { const v = ta.value, at = ta.selectionStart, pre = at && v[at - 1] !== '\n' ? '\n\n' : (at > 1 && v[at - 2] !== '\n' && v.trim() ? '\n' : ''); taInsert(ta, `${pre}${t}\n`); };
  if (['Intro','Pre','Chorus','Hook','Bridge','Outro'].includes(k)) return tag({ Pre:'[Pre-Chorus]' }[k] || `[${k}]`);
  if (k === 'Verse') return tag(`[Verse ${(ta.value.match(/^\[Verse\b/gim) || []).length + 1}]`);
  ({
    adlib: () => taWrap(ta, '(', ')', 'yeah'),
    repeat: () => { const v = ta.value, m = [...v.matchAll(/^\[(Chorus|Hook)[^\]]*\][^\n]*\n([\s\S]*?)(?=\n\s*\n|\n\[|$)/gim)].pop(); if (!m) return toast('Add a [Chorus] first.', 'info'); tag(m[0].trim()); },
    dup: () => taLines(ta, ls => [...ls, ...ls]),
    cap: () => taLines(ta, ls => ls.map(l => isHdr(l) ? l : l.replace(/^(\s*\(?)(\p{L})/u, (m, a, b) => a + b.toUpperCase()))),
    upper: () => taLines(ta, ls => { const up = ls.join('') === ls.join('').toUpperCase(); return ls.map(l => isHdr(l) ? l : up ? l.toLowerCase() : l.toUpperCase()); }),
    clean: () => { ta.setSelectionRange(0, ta.value.length); taInsert(ta, ta.value.replace(/[ \t]+$/gm, '').replace(/^[ \t]+/gm, '').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim() + '\n'); toast('Cleaned up spacing.', 'ok'); },
    undo: () => { ta.focus(); document.execCommand('undo'); }, redo: () => { ta.focus(); document.execCommand('redo'); }
  }[k] || (() => {}))();
}
const lyrStats = v => { const ls = v.split('\n'), sec = ls.filter(isHdr).length, lines = ls.filter(l => l.trim() && !isHdr(l)).length, words = (v.replace(/\[[^\]]*\]/g, '').match(/\S+/g) || []).length; return `${lines} lines · ${sec} sections · ${words} words`; };

/* ---------- markdown -> Treesh blog html ---------- */
const attrUrl = u => (/^(https?:|mailto:|\/|#)/i.test(u) ? u : '#').replace(/"/g, '&quot;');
function mdInline(s){
  s = escText(s); const codes = [];
  s = s.replace(/`([^`]+)`/g, (m, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (m, a, u) => `<img src="${attrUrl(u)}" alt="${a.replace(/"/g, '&quot;')}" loading="lazy">`);
  s = s.replace(/\[\[([^\]]+)\]\]\(([^)\s]+)\)/g, (m, t, u) => `<a class="post-btn" href="${attrUrl(u)}">${t}</a>`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${attrUrl(u)}"${/^https?:/i.test(u) && !/treesh\.app/i.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\+\+(.+?)\+\+/g, '<u>$1</u>').replace(/==(.+?)==/g, '<mark>$1</mark>').replace(/~~(.+?)~~/g, '<del>$1</del>').replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${codes[i]}</code>`);
}
function mdBlocks(md){
  const L = md.split('\n'), out = []; let i = 0, m;
  const list = (rx, tag) => { const buf = []; while (i < L.length && rx.test(L[i])){ const t = L[i++].replace(rx, ''), c = tag === 'ul' && t.match(/^\[( |x)\]\s+/i); buf.push(c ? `<li class="check${c[1].trim() ? ' done' : ''}">${mdInline(t.slice(c[0].length))}</li>` : `<li>${mdInline(t)}</li>`); } out.push(`<${tag}>${buf.join('')}</${tag}>`); };
  while (i < L.length){
    const l = L[i];
    if (/^```/.test(l)){ const buf = []; i++; while (i < L.length && !/^```/.test(L[i])) buf.push(L[i++]); i++; out.push(`<pre><code>${escText(buf.join('\n'))}</code></pre>`); continue; }
    if (!l.trim()){ i++; continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)){ out.push('<hr>'); i++; continue; }
    if ((m = l.match(/^(#{3,4})\s+(.*)$/))){ out.push(`<h${m[1].length}>${mdInline(m[2])}</h${m[1].length}>`); i++; continue; }
    if ((m = l.match(/^@youtube\((.+)\)\s*$/))){ out.push(`<div class="post-video"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId(m[1]))}" title="YouTube video" loading="lazy" allowfullscreen></iframe></div>`); i++; continue; }
    if ((m = l.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/))){ out.push(`<figure><img src="${attrUrl(m[2])}" alt="${escText(m[1]).replace(/"/g, '&quot;')}" loading="lazy">${m[3] ? `<figcaption>${mdInline(m[3])}</figcaption>` : ''}</figure>`); i++; continue; }
    if (/^>\s?/.test(l)){ const buf = []; while (i < L.length && /^>\s?/.test(L[i])) buf.push(L[i++].replace(/^>\s?/, '')); const c = buf[0].match(/^\[!(note|tip|warning)\]\s*/i); if (c) buf[0] = buf[0].slice(c[0].length); out.push(c ? `<div class="callout ${c[1].toLowerCase()}">${mdInline(buf.join(' '))}</div>` : `<blockquote>${mdInline(buf.join(' '))}</blockquote>`); continue; }
    if (/^\s*[-*]\s+/.test(l)){ list(/^\s*[-*]\s+/, 'ul'); continue; }
    if (/^\s*\d+[.)]\s+/.test(l)){ list(/^\s*\d+[.)]\s+/, 'ol'); continue; }
    const buf = [l]; i++;
    while (i < L.length && L[i].trim() && !/^(#{3,4}\s|>|\s*[-*]\s|\s*\d+[.)]\s|```|\s*-{3,}\s*$|@youtube\(|!\[)/.test(L[i])) buf.push(L[i++]);
    out.push(`<p>${buf.map(mdInline).join('<br>')}</p>`);
  }
  return out.join('\n');
}
const tocLabel = (badges, title) => (badges.find(b => !/^(gold:|accent$)/i.test(b)) || title.split(/[:(—–]/)[0].trim().split(/\s+/).slice(0, 3).join(' '));
function renderPostBody(md){
  const chunks = [{ head:null, lines:[] }]; let more = -1;
  md.replace(/\r/g, '').split('\n').forEach(l => {
    if (/^##\s+/.test(l)) chunks.push({ head: l.replace(/^##\s+/, ''), lines: [] });
    else if (/^\+\+\+\s*$/.test(l)){ if (more < 0) more = chunks.length; chunks.push({ head:null, lines:[] }); }
    else chunks[chunks.length - 1].lines.push(l);
  });
  const used = {}, toc = [];
  const html = chunks.map((c, n) => {
    const body = mdBlocks(c.lines.join('\n'));
    if (!c.head) return body.trim() ? `<div class="glass${n ? '' : ' post-intro'}">${body}</div>` : '';
    const badges = [], title = c.head.replace(/\s*\{([^}]+)\}/g, (m, b) => { badges.push(b.trim()); return ''; }).trim();
    let id = 'section-' + slug(title).slice(0, 40); while (used[id]) id += '-2'; used[id] = 1;
    toc.push(`<a href="#${id}" class="toc-link">${escText(tocLabel(badges, title))}</a>`);
    const bh = badges.filter(b => !/^accent$/i.test(b)).map(b => `<span class="badge${/^gold:/i.test(b) ? ' gold' : ''}">${escText(b.replace(/^gold:/i, ''))}</span>`).join('');
    return `<div class="${toc.length % 2 ? 'glass-strong' : 'glass'}${badges.some(b => /^accent$/i.test(b)) ? ' accent' : ''}" id="${id}">${bh ? `<div class="post-badges">${bh}</div>` : ''}<h2>${mdInline(title)}</h2>${body}</div>`;
  });
  const rest = html.slice(1), k = more < 0 ? rest.length : more - 1, extra = rest.slice(k).join('\n');
  return `${html[0]}${toc.length > 1 ? `<div class="glass legend-toc"><div class="legend-title">Jump to</div><div class="toc-grid">${toc.join('')}</div></div>` : ''}<div id="postContent">${rest.slice(0, k).join('\n')}${extra.trim() ? `<div class="read-more-wrap" id="readMoreWrap">${extra}</div><button class="read-more-toggle" id="readMoreToggle" aria-expanded="false">Read more</button>` : ''}</div>`;
}
const readMins = md => Math.max(1, Math.round((md.match(/\S+/g) || []).length / 220));
const POST_CSS = `:root{--p:#9328ff;--p2:#b77aff;--ps:rgba(147,40,255,.22);--gold:#c3ab69;--t:#f0f0f5;--d:rgba(255,255,255,.62);--b:rgba(255,255,255,.1)}*{box-sizing:border-box}body{margin:0;background:#0a0a0b;color:var(--t);font-family:Manrope,system-ui,sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}.wrap{max-width:820px;margin:0 auto;padding:2rem 1.2rem 3rem}.cat{display:flex;align-items:center;gap:.6rem;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.35)}.cat i{width:8px;height:8px;border-radius:50%;background:var(--p);box-shadow:0 0 12px var(--p)}h1{font-family:'Special Gothic Expanded One',Manrope,sans-serif;font-weight:400;font-size:clamp(2rem,6vw,3rem);line-height:1.1;margin:1rem 0 .4rem}h1 small{display:block;font-family:Manrope,sans-serif;font-size:1rem;font-weight:500;color:var(--d);margin-top:.6rem}.hl{background:linear-gradient(135deg,var(--p),var(--p2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}.divider{width:60px;height:3px;border-radius:9px;background:linear-gradient(90deg,var(--p),transparent);margin:1rem 0}.byline{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:space-between;padding:.6rem 0;margin-bottom:1.2rem;border-bottom:1px solid var(--b);font-size:.82rem;color:var(--d)}.hero{width:100%;border-radius:22px;margin:0 0 1.2rem;border:1px solid var(--b)}.glass,.glass-strong{background:rgba(255,255,255,.045);border:1px solid var(--b);border-radius:24px;padding:1.5rem 1.7rem;margin:1.1rem 0}.glass-strong{background:rgba(255,255,255,.07)}.accent{border-left:3px solid var(--p)}.post-intro p:first-child{font-size:1.1rem;font-weight:500;color:rgba(255,255,255,.9)}.legend-title{font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--d);margin-bottom:.6rem}.toc-grid{display:flex;flex-wrap:wrap;gap:.5rem}.toc-link{padding:.35rem .85rem;border-radius:100px;background:var(--ps);color:var(--p2);font-size:.8rem;font-weight:700;text-decoration:none}.post-badges{display:flex;gap:.6rem;flex-wrap:wrap}.badge{display:inline-block;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:.22rem .7rem;border-radius:100px;background:var(--ps);color:var(--p2);border:1px solid rgba(147,40,255,.3)}.badge.gold{background:rgba(195,171,105,.15);color:var(--gold);border-color:rgba(195,171,105,.35)}h2{font-size:1.5rem;margin:.3rem 0 .4rem;line-height:1.25}h3{font-size:1.15rem;margin:1.2rem 0 .3rem}h4{font-size:1rem;margin:1rem 0 .2rem}p,li{color:var(--d);margin:.55rem 0}a{color:var(--p2);font-weight:600}ul,ol{padding-left:1.3rem}li.check{list-style:none;margin-left:-1.3rem}li.check::before{content:"☐ ";color:var(--p2)}li.check.done::before{content:"☑ "}blockquote{border-left:3px solid var(--p);background:rgba(147,40,255,.06);padding:.8rem 1.1rem;border-radius:0 14px 14px 0;margin:1rem 0;font-style:italic;color:var(--d)}.callout{padding:.9rem 1.1rem;border-radius:14px;margin:1rem 0;background:rgba(61,220,151,.08);border:1px solid rgba(61,220,151,.3);color:#c9f5e2}.callout.note{background:rgba(147,40,255,.08);border-color:rgba(147,40,255,.35);color:#e6d6ff}.callout.warning{background:rgba(255,181,71,.08);border-color:rgba(255,181,71,.35);color:#ffe2b0}mark{background:rgba(147,40,255,.35);color:#fff;padding:0 .2em;border-radius:4px}figure{margin:1rem 0}img{max-width:100%;border-radius:18px;border:1px solid var(--b)}figcaption{font-size:.8rem;color:var(--d);text-align:center;margin-top:.4rem}code{background:rgba(255,255,255,.06);padding:.15rem .4rem;border-radius:6px;color:#e0c7ff}pre{background:#0f0f13;border:1px solid var(--b);border-radius:14px;padding:1rem;overflow:auto}pre code{background:none;padding:0}hr{border:0;height:1px;background:var(--b);margin:1.6rem 0}.post-btn{display:inline-block;padding:.65rem 1.3rem;border-radius:100px;background:var(--p);color:#fff;text-decoration:none;box-shadow:0 8px 24px rgba(147,40,255,.35)}.post-video{position:relative;aspect-ratio:16/9;margin:1rem 0}.post-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:18px}.read-more-wrap{border-top:1px dashed var(--b);margin-top:1rem;padding-top:.4rem}.read-more-wrap::before{content:"Read more ↓";display:block;font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--p2)}.read-more-toggle{display:none}`;
function postPreviewDoc(p){
  const t = (p.title || 'Untitled post').trim().split(' '), last = t.length > 1 ? t.pop() : '';
  const d = p.date ? new Date(p.date) : null;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Special+Gothic+Expanded+One&display=swap" rel="stylesheet"><style>${POST_CSS}</style></head><body><div class="wrap"><div class="cat"><i></i>${escText(p.category || 'Blog')}</div><h1>${escText(t.join(' '))}${last ? ` <span class="hl">${escText(last)}</span>` : ''}${p.subtitle ? `<small>${escText(p.subtitle)}</small>` : ''}</h1><div class="divider"></div><div class="byline"><span>${d && !isNaN(d) ? d.toLocaleString('en-US', { month:'long', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' }) : ''}${p.author ? ' · ' + escText(p.author) : ''}</span><span>${p.tags.map(x => `<span class="badge">${escText(x)}</span>`).join(' ')}</span></div>${isUrl(p.hero) ? `<img class="hero" src="${attrUrl(p.hero)}" alt="">` : ''}${renderPostBody(p.md || '') || '<p>Start writing to see your post…</p>'}</div></body></html>`;
}
