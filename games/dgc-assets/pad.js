'use strict';
/* Don't Get Caught: gamepad support (menus, rooms, rumble) */
const Pad = {
  idx: null, prev: [], rep: {}, stickX: 0,
  gp() { const l = navigator.getGamepads ? navigator.getGamepads() : []; return this.idx != null ? l[this.idx] : null; },
  rumble(ms, s = 0.6) {
    const g = this.gp(), a = g && g.vibrationActuator; if (!a || !S.set.haptic) return;
    try { a.playEffect('dual-rumble', { duration: Math.min(ms, 1500), strongMagnitude: clamp(s, 0, 1), weakMagnitude: clamp(s + 0.2, 0, 1) }); } catch (e) {}
  }
};
const padKey = (type, key, code) => document.dispatchEvent(new KeyboardEvent(type, { key, code: code || key, bubbles: true }));
function padFocusables() {
  const scope = !$('#modal').hidden ? $('#modal') : (Run.active && R && R.mini && ['dial', 'bestie'].includes(R.mini.id) && R.started && !R.done) ? $('#act-stage') : $('.scr.on');
  if (!scope) return [];
  return $$('button, input, a[data-act], .lo-who[data-act], [data-p]', scope).filter(el => !el.disabled && el.offsetParent !== null && !el.closest('[hidden]') && el.id !== 'act-btn');
}
function padMove(d) {
  const f = padFocusables(); if (!f.length) return;
  const cur = $('.pad-focus'); let i = f.indexOf(cur); i = i < 0 ? 0 : (i + d + f.length) % f.length;
  if (cur) cur.classList.remove('pad-focus'); f[i].classList.add('pad-focus'); f[i].focus({ preventScroll: true }); f[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); Sfx.tick();
}
function padPress() {
  const f = $('.pad-focus');
  if (f && f.isConnected && f.offsetParent !== null) {
    if (f.classList.contains('dk') || f.classList.contains('tip-foot')) { f.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => f.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })), 90); return; }
    if (f.type === 'checkbox') { f.checked = !f.checked; f.dispatchEvent(new Event('input')); return; }
    f.click(); return;
  }
  padKey('keydown', ' ', 'Space'); setTimeout(() => padKey('keyup', ' ', 'Space'), 60);
}
window.addEventListener('gamepadconnected', e => { Pad.idx = e.gamepad.index; document.body.classList.add('has-pad'); toast('Controller connected', 'A select \u00b7 B back \u00b7 Start pause'); Pad.rumble(200, 0.5); });
window.addEventListener('gamepaddisconnected', e => { if (Pad.idx === e.gamepad.index) { Pad.idx = null; document.body.classList.remove('has-pad'); } });
document.addEventListener('mousemove', () => { const f = $('.pad-focus'); if (f) f.classList.remove('pad-focus'); });

function padLoop() {
  requestAnimationFrame(padLoop);
  const g = Pad.gp(); if (!g) return;
  const b = i => !!(g.buttons[i] && g.buttons[i].pressed), ax = g.axes[0] || 0, ay = g.axes[1] || 0;
  const cur = [b(0), b(1), b(2), b(3), b(4), b(5), b(6), b(7), b(8), b(9), false, false, b(12) || ay < -0.6, b(13) || ay > 0.6, b(14) || ax < -0.6, b(15) || ax > 0.6];
  const down = i => cur[i] && !Pad.prev[i], up = i => !cur[i] && Pad.prev[i];
  const t = performance.now(), repeat = i => { if (down(i)) { Pad.rep[i] = t + 380; return true; } if (cur[i] && t > (Pad.rep[i] || 0)) { Pad.rep[i] = t + 120; return true; } return false; };
  const title = $('#scr-title').classList.contains('on') && $('#modal').hidden, modal = !$('#modal').hidden;
  const inRoom = Run.active && R && R.started && !R.done && !Run.paused && !modal;
  if (!UI.splashed && title) { if (cur.some((v, i) => v && !Pad.prev[i])) dismissSplash(); Pad.prev = cur; return; }
  if (title) {
    if (repeat(12)) padKey('keydown', 'ArrowUp'); if (repeat(13)) padKey('keydown', 'ArrowDown');
    if (repeat(14)) padKey('keydown', 'ArrowLeft'); if (repeat(15)) padKey('keydown', 'ArrowRight');
    if (down(0) || down(9)) padKey('keydown', 'Enter');
  } else if (inRoom) {
    const id = R.mini.id;
    if (id === 'dial') { if (repeat(12) || repeat(14)) padMove(-1); if (repeat(13) || repeat(15)) padMove(1); if (down(0)) padPress(); }
    else if (id === 'bestie') { if (repeat(12) || repeat(14)) padMove(-1); if (repeat(13) || repeat(15)) padMove(1); const f = $('.pad-focus'); if (down(0) && f) f.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); if (up(0) && f) f.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); if (down(1)) { const h = $('[data-testid="bestie-home-btn"]'); if (h) h.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); } }
    else {
      [[14, 'ArrowLeft'], [15, 'ArrowRight']].forEach(([i, k]) => { if (down(i)) padKey('keydown', k); if (up(i)) padKey('keyup', k); });
      if (id === 'scrub') { const sx = ax < -0.5 ? -1 : ax > 0.5 ? 1 : 0; if (sx && sx !== Pad.stickX) padKey('keydown', sx < 0 ? 'a' : 'd'); Pad.stickX = sx; }
      if (down(0) || down(7)) padKey('keydown', ' ', 'Space'); if ((up(0) && !cur[7]) || (up(7) && !cur[0])) padKey('keyup', ' ', 'Space');
    }
    if (down(2)) padKey('keydown', '1'); if (down(3)) padKey('keydown', '2'); if (down(5)) padKey('keydown', '3');
    if (down(9) || (down(1) && id !== 'bestie')) padKey('keydown', 'Escape');
  } else {
    if (repeat(12) || repeat(14)) padMove(-1); if (repeat(13) || repeat(15)) padMove(1);
    if (down(0)) padPress();
    if (down(9) && Run.active && !modal) padKey('keydown', 'Escape');
    if (down(1)) { if (modal) closeModal(); else { const bk = $('.scr.on [data-testid="back-btn"]'); if (bk) bk.click(); else if (!Run.active) go('title'); } }
  }
  Pad.prev = cur;
}
requestAnimationFrame(padLoop);
