'use strict';
/* Per-mode cinematic stories. shot: [img, title, line, camera] */
const STORIES = {
  classic: { name: 'Nightfall', who: 'Mr. Hush', shots: [
    ['st_n1', 'You don\u2019t remember the drive.', 'Headlights. Rain. Glass. Then nothing at all.', 'push'],
    ['st_n2', '{n}. Wake up. Quietly.', 'A house that smells like wet wood and pennies. Someone is standing at the end of the hall.', 'pull'],
    ['st_n3', 'This is Mr. Hush.', 'He has one rule, and he lets his guests learn it the hard way: <b>he only kills what he sees.</b>', 'pushf'],
    ['st_n4', 'So work while he isn\u2019t looking.', 'Pick the locks. Call for help. When he turns, <b>freeze</b>. Survive until dawn.', 'panl']] },
  hush: { name: 'Dead Silent', who: 'Mr. Hush', shots: [
    ['st_s1', 'Mr. Hush is tired of looking.', 'Tonight he closes his eyes. Tonight he just\u2026 listens.', 'pushf'],
    ['st_s2', 'The house is recording.', 'Your microphone is live. Every floorboard, every breath, every whimper.', 'panr'],
    ['st_s3', 'Don\u2019t make a sound.', 'Not a cough. Not a gasp. <b>If he hears you, he finds you.</b>', 'push'],
    ['st_s4', 'He\u2019s closer than you think.', 'Stay quiet, {n}. Stay quiet until dawn.', 'pull']] },
  lullaby: { name: 'Lullaby', who: 'The Hollow Bride', shots: [
    ['st_l1', 'She was married in this house.', 'The guests left. The groom left. <b>She never did.</b>', 'panl'],
    ['st_l2', 'The Hollow Bride cannot see.', 'Her eyes are gone. But she still sings, and she still listens.', 'pushf'],
    ['st_l3', 'Hum her lullaby.', 'Match her note when she shifts it. Your voice is the only thing keeping you hidden.', 'push'],
    ['st_l4', 'Never stop while she\u2019s listening.', 'Go quiet at the wrong moment and <b>she will find your throat.</b>', 'pull']] },
  bestie: { name: 'Bestie', who: 'Bestie', shots: [
    ['st_b1', '3:07 AM.', 'Your phone lights up the whole room. It\u2019s Bestie. It\u2019s always Bestie.', 'push'],
    ['st_b2', '\u201cHEYYY bestie!! quick favor?\u201d', 'Answer texts. Like the posts. Keep the group chat alive. Tiny things. Easy things.', 'pushf'],
    ['st_b3', 'Your friends are all on the call.', 'Eight faces, laughing, sleepy, safe. <b>For now.</b>', 'panr'],
    ['st_b4', 'Don\u2019t leave him on read.', 'Do what he asks, fast. Or Bestie takes them. <b>One. By. One.</b>', 'shake']] },
  detention: { name: 'Detention', who: 'Miss Florence', shots: [
    ['st_d1', 'Detention. 3:15 PM.', 'Everyone else went home. The rain didn\u2019t. The clock hasn\u2019t moved in an hour.', 'panl'],
    ['st_d2', 'Miss Florence is so glad you stayed.', '\u201cWe\u2019re going to have <i>such</i> a productive afternoon, {n}.\u201d', 'pushf'],
    ['st_d3', 'Do your work while she writes.', 'Every answer counts. Every glance away from the board is a gift.', 'push'],
    ['st_d4', 'Get caught slacking\u2026', '<b>and Miss Florence grades you.</b> In red.', 'shake']] },
  babysit: { name: 'Babysitter', who: 'Baby', shots: [
    ['st_y1', '11:58 PM. The parents are leaving.', 'They paid in cash. They didn\u2019t leave a phone number.', 'pull'],
    ['st_y2', 'Baby is awake.', 'Baby is always awake. Baby has been waiting for you.', 'pushf'],
    ['st_y3', 'It crawls.', 'Down the hall. Up the walls. Across the ceiling. <b>Never lose sight of it for long.</b>', 'panr'],
    ['st_y4', 'Six hours until they\u2019re home.', 'Stop whatever it\u2019s doing. Keep it safe until 6 AM. <b>Don\u2019t lose the baby.</b>', 'push']] },
  thane: { name: 'The Grand Illusion', who: 'Thane', shots: [
    ['st_t1', 'An invitation. No return address.', 'One ticket. Front row. Tonight only. The envelope is warm, and it\u2019s humming.', 'push'],
    ['st_t2', 'Every seat is empty but yours.', 'Thane takes a slow bow. He has been waiting a very long time for a volunteer.', 'pull'],
    ['st_t3', 'Every trick has a secret.', 'Follow the cup. Remember the card. Find the real him. <b>See through it, or his Reach takes you.</b>', 'pushf'],
    ['st_t4', 'And when the tricks run out\u2026', 'the magician takes off his face. <b>Survive the Last Trick.</b>', 'shake']] },
  lash: { name: 'The Function', who: 'Big Eyelash', shots: [
    ['be_idle', '3:07 AM. The bass is shaking the windows.', 'You followed the music. You did NOT get an invite.', 'push'],
    ['be_face', 'This is Big Eyelash.', 'Loud. Dramatic. Cursed. Her lashes see EVERYTHING.', 'pushf'],
    ['be_hex', 'Every round is a test.', 'Twerk on beat. Clap back. Pay her cut. <b>Never insult the lashes.</b>', 'panr'],
    ['be_rage', 'Get her PRESSED\u2026', '<b>and her girls pull up.</b> Survive PRESSED MODE.', 'shake']] },
  impress: { name: 'Impressions', who: 'Mr. Hush', shots: [
    ['st_i1', 'Mr. Hush is bored.', 'Dangerously, murderously bored.', 'pushf'],
    ['st_i2', 'Tonight, you\u2019re the entertainment.', 'One spotlight. One microphone. One very tough crowd.', 'push'],
    ['st_i3', 'Sound like a pig. A car engine. A kazoo.', 'Use your real voice. He\u2019s scoring every snort.', 'panl'],
    ['st_i4', 'Impress him.', '<b>Or else.</b>', 'shake']] }
};
const SHOT_MS = 6800;
const storyOf = id => STORIES[id] || STORIES.classic;

function playStory(id, done, fromMenu) {
  const st = storyOf(id), n = esc(Treesh.name()), fill = s => s.replace(/\{n\}/g, n);
  st.shots.forEach(s => { new Image().src = img(s[0]); });
  const el = document.createElement('div'); el.className = 'cine'; el.dataset.testid = 'story-cinematic'; el.dataset.story = id;
  el.innerHTML = `<div class="cn-stage" id="cn-stage"></div><i class="cn-grain"></i><i class="cn-bar t"></i><i class="cn-bar b"></i>
    <div class="cn-pips" data-testid="story-pips">${st.shots.map((_, i) => `<i data-i="${i}"><b></b></i>`).join('')}</div>
    <button class="cn-skip" data-cn="skip" data-testid="story-skip-btn">Skip<i data-lucide="skip-forward"></i></button>
    <div class="cn-cap" id="cn-cap" data-testid="story-caption"></div>`;
  document.body.appendChild(el); icons(); Sfx.menuMusic(false);
  let i = -1, timer = 0, over = false;
  const stage = $('#cn-stage', el), cap = $('#cn-cap', el);
  const end = () => { if (over) return; over = true; clearTimeout(timer); window.removeEventListener('keydown', key, true); el.classList.add('out'); Sfx.thump(0.4); setTimeout(() => { el.remove(); done && done(); }, 650); };
  const shot = k => {
    clearTimeout(timer); if (k >= st.shots.length) return end(); i = k;
    const [src, title, line, cam] = st.shots[k], last = k === st.shots.length - 1;
    const old = $$('.cn-shot', stage); old.forEach(o => { o.classList.add('gone'); setTimeout(() => o.remove(), 1200); });
    const sh = document.createElement('div'); sh.className = `cn-shot cam-${cam}`; sh.style.setProperty('--img', `url(${img(src)})`); sh.dataset.testid = 'story-shot-' + k;
    sh.innerHTML = '<i class="cn-img"></i><i class="cn-vig"></i>'; stage.appendChild(sh);
    el.classList.remove('cut'); void el.offsetWidth; el.classList.add('cut');
    cap.innerHTML = `<small class="cn-kick">${esc(st.name)} &middot; ${esc(st.who)} &middot; ${k + 1}/${st.shots.length}</small><h2 class="cn-title" data-testid="story-title" style="--ch:${title.length}">${fill(title)}</h2><p class="cn-line" data-testid="story-line">${fill(line)}</p>${last ? `<button class="btn btn-acc btn-xl cn-go" data-cn="done" data-testid="story-continue-btn"><i data-lucide="skull"></i>${fromMenu ? 'Back to stories' : 'I understand'}</button>` : '<small class="cn-tap">tap to continue</small>'}`;
    icons();
    $$('.cn-pips i', el).forEach((p, j) => { p.className = j < k ? 'done' : j === k ? 'on' : ''; });
    Sfx.thump(k ? 0.5 : 0.8); Sfx.tone(k === st.shots.length - 1 ? 46 : 58 + k * 6, 2.4, 'sine', 0.12, 40); if (cam === 'shake') { Sfx.whisper(0.07); shake(1); } else if (k % 2) Sfx.whisper(0.04);
    if (!last) timer = setTimeout(() => shot(k + 1), SHOT_MS);
  };
  const next = () => { if (over) return; if (i === st.shots.length - 1) return end(); shot(i + 1); };
  function key(e) { if (over) return; if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); next(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(); } }
  window.addEventListener('keydown', key, true);
  el.addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('[data-cn]'); Sfx.ctx(); if (b && b.dataset.cn === 'skip') return end(); if (b && b.dataset.cn === 'done') return end(); next(); });
  setTimeout(() => shot(0), 350);
}

function renderStory() {
  const order = ['classic', 'hush', 'lullaby', 'bestie', 'detention', 'babysit', 'thane', 'lash', 'impress'], seen = S.seenStories || {};
  $('#scr-story').innerHTML = `${subTop('The Stories')}<div class="story-pick" data-testid="story-picker"><p class="story-sub">Every killer in this house has a story. Pick one.</p><div class="story-grid">${order.map((id, k) => { const st = STORIES[id]; return `<button class="story-card" style="--img:url(${img(st.shots[0][0])});--i:${k}" data-act="story-play" data-id="${id}" data-testid="story-card-${id}"><i class="sc-img"></i><span><small>${esc(st.who)}</small><b>${esc(st.name)}</b>${seen[id] ? '<em>Watched</em>' : '<em class="new">New</em>'}</span><i class="sc-play" data-lucide="play"></i></button>`; }).join('')}</div></div>`;
  icons();
}

function storyGate(mode, then) {
  S.seenStories = S.seenStories || {};
  if (S.seenStories[mode]) return then();
  playStory(mode, () => { S.seenStories[mode] = true; save(); then(); });
}
