function obPassHtml(z){ const nm=(onboard.nick||'').trim(); const th=GL_THEMES.find(x=>x.id===glTheme())||GL_THEMES[0];
  return `<div class="obx-pass" data-testid="onboarding-pass">
    <span class="obx-pass-shine"></span>
    <div class="obx-pass-top hidden md:flex"><span class="obx-pass-brand">Treesh Pass</span><span class="obx-pass-no">No. ${String((Date.now()%9000)+1000)}</span></div>
    <div class="obx-pass-av">${onboard.avatar?img(onboard.avatar,'h-full w-full object-cover'):`<i data-lucide="user" style="width:26px;height:26px"></i>`}</div>
    <div class="min-w-0 flex-1 md:flex-none">
      <p class="obx-pass-lbl">Listener</p>
      <p class="obx-pass-name clamp-1" id="obx-pass-name">${esc(nm||'Your name')}</p>
      <p class="obx-pass-z" id="obx-pass-z">${z?esc(z):'Zodiac unlocks with your birthday'}</p>
    </div>
    <div class="obx-pass-foot hidden md:flex"><span class="obx-pass-chip"><span style="background:radial-gradient(circle at 30% 30%,${th.sw[0]},transparent 70%),${th.sw[2]}"></span>${esc(th.name)}</span><span class="obx-pass-bars">${Array.from({length:14},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</span></div>
  </div>`; }
function renderOnboarding(){
  const steps=[["Welcome to Treesh",""],["Pick your vibe","Choose a glass theme, then tune the accent that glows across the app."],["What should we call you?","Pick a nickname that\u2019s all you."],["When\u2019s your birthday?","We\u2019ll reveal your zodiac and keep things age-appropriate."],["Add a profile picture","Choose an Icon or upload your own."]];
  const z=zodiac(onboard.bday);
  const PRESETS=["https://static.tumblr.com/9leohrr/04Hspf8x9/icon-crazy.png","https://static.tumblr.com/9leohrr/BCJspf9yo/londonllafareartist.png","https://static.tumblr.com/9leohrr/7eVspf9iu/chelly_banqz.jpg","https://static.tumblr.com/9leohrr/7L3spf9lt/pio_milano.jpg"];
  const LOGO="https://64.media.tumblr.com/c3a9171b66dff3f4d1b204629d553f62/f0962fce333cd090-3d/s250x400/9cc28d33e0d7075a9d5122424756269c6a0e617c.png";
  let body="";
  if(onboard.step===0){
    const feats=[["radio","Stream the underground","An indie catalog of Icons, always fresh."],["mic-vocal","Sing &amp; learn","Karaoke, lyric meanings &amp; games."],["sliders-horizontal","Make beats","Produce in Instrum, your pocket studio."]];
    const words=["Music","to","Live"].map((w,i)=>`<span class="obx-w" style="--d:${i}">${w}</span>`).join(' ');
    body=`<div class="obx-intro" data-testid="onboarding-intro">
      <div class="obx-logo-wrap"><span class="obx-ring"></span><span class="obx-ring" style="animation-delay:1s"></span><span class="obx-ring" style="animation-delay:2s"></span><span class="obx-logo-glow"></span><img src="${LOGO}" alt="Treesh" draggable="false" class="obx-logo" onerror="this.style.display='none'"></div>
      <p class="obx-kicker">Welcome to Treesh</p>
      <h1 class="obx-title" data-testid="onboarding-title">${words} <span class="obx-w obx-grad" style="--d:3">For.</span></h1>
      <p class="obx-sub">Stream the underground, sing every line and make your own beats. No signup, everything stays on this device.</p>
      <div class="obx-eq" aria-hidden="true">${Array.from({length:32},(_,i)=>`<i style="--i:${i};--h:${(30+((i*37)%70))}%"></i>`).join('')}</div>
      <div class="obx-feats">${feats.map(([ic,t,d],i)=>`<div class="obx-feat" style="--d:${i}"><span class="obx-feat-ic"><i data-lucide="${ic}" style="width:18px;height:18px"></i></span><span class="min-w-0"><span class="block text-sm font-bold">${t}</span><span class="block text-xs text-white/55">${d}</span></span></div>`).join('')}</div>
      ${installHintHtml()?`<div class="obx-install">${installHintHtml()}</div>`:''}
    </div>`;
  }
  else if(onboard.step===1){ const accCur=(state.accent||"#9328ff").toLowerCase(); const th=glTheme();
    body=`<div class="space-y-6"><div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4" data-testid="onboarding-themes">${GL_THEMES.map(t=>{ const on=th===t.id; return `<button data-act="mk-ob-theme" data-val="${t.id}" data-testid="ob-theme-${t.id}" aria-pressed="${on}" class="obx-theme press${on?' on':''}" style="--a:${t.sw[0]};--b:${t.sw[1]};--c:${t.sw[2]}"><span class="obx-theme-sw"></span><span class="block text-[13px] font-bold leading-tight">${t.name}</span><span class="block text-[10.5px] leading-tight text-white/50">${t.desc}</span>${on?'<span class="obx-theme-ok"><i data-lucide="check" style="width:12px;height:12px"></i></span>':''}</button>`; }).join('')}</div>
      <div><p class="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Accent</p><div class="flex flex-wrap items-center gap-2.5">${ACCENTS.map(([hex,name])=>{ const on=accCur===hex.toLowerCase(); return `<button data-act="ob-accent" data-hex="${hex}" title="${name}" aria-label="${name}" data-testid="ob-accent-${hex.replace('#','')}" class="press relative grid h-10 w-10 place-items-center rounded-full transition-transform hover:scale-110" style="background:${hex};box-shadow:${on?`0 0 0 3px #fff,0 0 22px ${hex}`:`0 0 0 1px rgba(255,255,255,0.18)`}">${on?`<i data-lucide="check" class="text-white" style="width:16px;height:16px"></i>`:''}</button>`; }).join("")}</div></div></div>`; }
  else if(onboard.step===2){ const ideas=["Night Owl","Bass Head","Verse Queen","Loop Kid","Hook Hunter"];
    body=`<div><div class="obx-field"><i data-lucide="at-sign" style="width:20px;height:20px" class="shrink-0 text-white/40"></i><input id="ob-nick" data-testid="onboarding-nickname" value="${esc(onboard.nick)}" placeholder="Your nickname" maxlength="24" autocomplete="off" class="min-w-0 flex-1 bg-transparent text-xl font-bold text-white outline-none placeholder:text-white/30"></div><p class="mt-2 pl-1 text-xs text-white/40">This is how you\u2019ll show up across Treesh. No @ needed.</p><div class="mt-5 flex flex-wrap gap-2"><span class="self-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">Need ideas?</span>${ideas.map(n=>`<button data-act="mk-ob-nick" data-val="${n}" data-testid="ob-nick-idea-${n.replace(/\s/g,'-').toLowerCase()}" class="obx-chip press">${n}</button>`).join('')}</div></div>`; }
  else if(onboard.step===3){ body=`<div class="space-y-4">${dateFieldHTML({id:'ob-bday',value:onboard.bday,testid:'onboarding-birthday',center:true,placeholder:'Select your birthday',boxClass:'h-14 rounded-2xl border border-white/15 bg-white/[0.06] text-base font-semibold'})}<div id="ob-zodiac-wrap">${obZodiacHtml(z)}</div></div>`; }
  else{ body=`<div class="flex flex-col items-center gap-6"><div class="obx-av-big"><span class="obx-av-spin"></span><div class="relative h-full w-full overflow-hidden rounded-full border-2 border-white/20 bg-[#0d0b14]">${onboard.avatar?img(onboard.avatar,'h-full w-full object-cover'):`<div class="grid h-full w-full place-items-center text-white/40"><i data-lucide="user" style="width:40px;height:40px"></i></div>`}</div></div><div class="flex flex-wrap items-center justify-center gap-3">${PRESETS.map((a,i)=>`<button data-act="ob-preset" data-src="${a}" data-testid="ob-preset-${i}" class="press h-14 w-14 overflow-hidden rounded-full border-2 transition ${onboard.avatar===a?'scale-110 border-[color:var(--treesh-purple)] shadow-[0_0_18px_var(--treesh-purple)]':'border-white/10 hover:border-white/30'}">${img(a,'h-full w-full object-cover')}</button>`).join("")}<label class="press grid h-14 w-14 cursor-pointer place-items-center rounded-full border border-dashed border-white/30 text-white/60 hover:bg-white/5" data-testid="ob-upload"><i data-lucide="upload" style="width:18px;height:18px"></i><input type="file" accept="image/*" class="hidden" id="ob-file"></label></div><p class="text-center text-xs text-white/40">You can change this anytime in your profile.</p></div>`; }
  const canNext = onboard.step===0 || onboard.step===1 || (onboard.step===2&&onboard.nick.trim()) || (onboard.step===3&&onboard.bday) || onboard.step===4;
  const prog=[1,2,3,4].map(i=>`<span class="obx-seg${i<onboard.step?' done':i===onboard.step?' on':''}"></span>`).join("");
  const existed = !!$("#modal [data-ob-shell]");
  const intro=onboard.step===0;
  const content = intro ? body : `<div class="grid w-full items-center gap-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:gap-14">
      <div class="obx-step-pass">${obPassHtml(z)}</div>
      <div class="obx-step min-w-0" data-testid="onboarding-step-${onboard.step}">
        <p class="font-display text-[11px] uppercase tracking-[0.32em] text-[color:var(--treesh-gold)]">Step ${onboard.step} of 4</p>
        <h1 class="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">${steps[onboard.step][0]}</h1>
        <p class="mt-2 text-white/60">${steps[onboard.step][1]}</p>
        <div class="mt-7">${body}</div>
      </div></div>`;
  const shell=`<div data-ob-shell data-testid="onboarding" class="obx dark-surface fixed inset-0 z-[120] flex flex-col overflow-hidden bg-[#07060b] ${existed?'':'np-entering'}">
    <div class="obx-bg" aria-hidden="true"><span class="ob-blob ob-blob-1"></span><span class="ob-blob ob-blob-2"></span><span class="ob-blob ob-blob-3"></span><span class="obx-stars"></span><span class="obx-floor"></span><span class="obx-horizon"></span><span class="obx-vignette"></span></div>
    <header class="relative z-10 flex shrink-0 items-center gap-4 px-5 pt-[calc(env(safe-area-inset-top)+16px)] sm:px-8">
      <div class="flex shrink-0 items-center gap-2"><img src="${LOGO}" alt="Treesh" draggable="false" class="h-8 w-auto select-none object-contain" onerror="brandFallback(this)"><span class="brand-fallback font-display text-lg uppercase tracking-[0.12em] text-white" style="display:none">Treesh</span></div>
      <div class="mx-auto flex w-full max-w-xs items-center gap-1.5 ${intro?'invisible':''}" data-testid="onboarding-progress">${prog}</div>
      <button data-act="ob-skip" data-testid="onboarding-skip" class="shrink-0 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/60 backdrop-blur hover:bg-white/10 hover:text-white">Skip</button>
    </header>
    <main class="obx-main relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain" data-ob-root>
      <div class="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-5 py-6 sm:px-8"><div class="${existed?'obx-swap':''}">${content}</div></div>
    </main>
    <footer class="relative z-10 shrink-0 px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-3 sm:px-8" data-testid="onboarding-footer">
      <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 ${intro?'sm:justify-center':''}">
        ${onboard.step>0?`<button data-act="ob-back" data-testid="onboarding-back" class="press inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 backdrop-blur hover:bg-white/10"><i data-lucide="arrow-left" style="width:16px;height:16px"></i>Back</button>`:''}
        ${onboard.step<4?`<button data-act="ob-next" data-testid="onboarding-next" ${canNext?'':'disabled'} class="obx-cta press ${intro?'obx-cta-xl w-full sm:w-auto':'ml-auto'} ${canNext?'':'opacity-40'}">${intro?'Begin the journey':'Continue'} <i data-lucide="arrow-right" style="width:18px;height:18px"></i></button>`:`<button data-act="ob-finish" data-testid="onboarding-finish" class="obx-cta press ml-auto"><i data-lucide="sparkles" style="width:17px;height:17px"></i>Start listening</button>`}
      </div>
    </footer>
  </div>`;
  $("#modal").innerHTML=shell; icons();
  const nick=$("#ob-nick"); if(nick){ nick.focus(); nick.addEventListener("input",()=>{ onboard.nick=nick.value; const pn=$("#obx-pass-name"); if(pn) pn.textContent=onboard.nick.trim()||'Your name'; const nb=$("#modal [data-act='ob-next']"); if(nb){ const ok=!!onboard.nick.trim(); nb.disabled=!ok; nb.classList.toggle("opacity-40",!ok); } }); nick.addEventListener("keydown",e=>{ if(e.key==="Enter"&&onboard.nick.trim()){ onboard.step=3; renderOnboarding(); } }); }
  const bday=$("#ob-bday"); if(bday){ const updBday=()=>{ onboard.bday=bday.value; syncDateField(bday); const z2=zodiac(onboard.bday); const zw=$("#ob-zodiac-wrap"); if(zw){ zw.innerHTML=obZodiacHtml(z2); icons(); } const pz=$("#obx-pass-z"); if(pz) pz.textContent=z2||'Zodiac unlocks with your birthday'; const nb=$("#modal [data-act='ob-next']"); if(nb){ const ok=!!onboard.bday; nb.disabled=!ok; nb.classList.toggle("opacity-40",!ok); } }; bday.addEventListener("input",updBday); bday.addEventListener("change",updBday); }
  const file=$("#ob-file"); if(file) file.addEventListener("change",e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ onboard.avatar=r.result; renderOnboarding(); }; r.readAsDataURL(f); });
  syncScrollLock();
}
