"""Comprehensive Lyric Themes + Lyric Card styles test for Treesh single-file SPA."""
import asyncio, sys, json
from playwright.async_api import async_playwright

EXE = "/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOBILE = len(sys.argv) > 1 and sys.argv[1] == 'm'
THEMES = ['classic', 'chat', 'neon', 'type', 'note', 'term', 'comic', 'pola']
RESULTS = {}
ERRORS = []

async def seed_and_open(pg):
    await pg.goto('http://localhost:3000/')
    await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_seen','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.removeItem('treesh_lyt'); localStorage.removeItem('treesh_lyt_song');}")
    await pg.reload()
    await pg.wait_for_timeout(3500)
    await pg.evaluate("""()=>{ const s=SONG_BY_ID['chelly-banqz-shake-it-some-mo']; playSong(s,[s]); state.npOpen=true; state.showLyrics=true; renderNP(); }""")
    await pg.wait_for_timeout(2000)
    await pg.evaluate("()=>{ audio.currentTime=40; }")
    await pg.wait_for_timeout(1200)

async def test_toolbar_button(pg):
    tid = 'lyt-open-button' if MOBILE else 'lyt-open-button-d'
    other = 'lyt-open-button-d' if MOBILE else 'lyt-open-button'
    v = await pg.locator(f'[data-testid="{tid}"]').is_visible()
    v2 = await pg.locator(f'[data-testid="{other}"]').count()
    RESULTS['toolbar_button_visible'] = f"PASS ({tid} visible={v})" if v else f"FAIL - {tid} not visible"

async def test_sheet_open_close(pg):
    tid = 'lyt-open-button' if MOBILE else 'lyt-open-button-d'
    await pg.locator(f'[data-testid="{tid}"]').click(force=True)
    await pg.wait_for_timeout(600)
    sheet = await pg.locator('[data-testid="lyt-sheet"]').is_visible()
    tiles = await pg.locator('[data-testid^="lyt-opt-"]').count()
    classic_has_default = await pg.evaluate("()=>{const el=document.querySelector('[data-testid=\"lyt-opt-classic\"]'); return el?/default/i.test(el.textContent):false;}")
    selected_initially = await pg.evaluate("()=>{const el=document.querySelector('[data-testid=\"lyt-opt-classic\"]'); return el?el.className:'';}")
    RESULTS['sheet_open'] = f"sheet_visible={sheet}, tiles={tiles}, classic_has_default={classic_has_default}, classic_cls={'selected' in selected_initially or 'is-sel' in selected_initially or 'active' in selected_initially}"
    # Close via backdrop
    await pg.evaluate("()=>{const b=document.querySelector('[data-testid=\"lyt-backdrop\"]'); if(b) b.click();}")
    await pg.wait_for_timeout(500)
    sheet2 = await pg.locator('[data-testid="lyt-sheet"]').count()
    sheet2_vis = await pg.locator('[data-testid="lyt-sheet"]').is_visible() if sheet2 else False
    RESULTS['sheet_close_backdrop'] = f"after_backdrop count={sheet2} visible={sheet2_vis}"
    # Also test lyt-close
    if sheet2_vis:
        try:
            await pg.locator('[data-testid="lyt-close"]').click(force=True)
            await pg.wait_for_timeout(400)
            cnt = await pg.locator('[data-testid="lyt-sheet"]').count()
            RESULTS['sheet_close_x'] = f"after_x_count={cnt}"
        except Exception as e:
            RESULTS['sheet_close_x'] = f"ERR {e}"

async def test_each_theme(pg):
    for t in THEMES:
        # Set global via lytSet
        await pg.evaluate(f"()=>{{ lytSet('{t}', true); }}")
        await pg.wait_for_timeout(1500)
        info = await pg.evaluate("""()=>{
            const c=document.getElementById('np-lyrics');
            const bodyW=document.documentElement.clientWidth;
            const scrollW=c?c.scrollWidth:0;
            return {
                lyt:c&&c.dataset.lyt,
                has_lyt_on:c&&c.classList.contains('lyt-on'),
                overflow: scrollW > bodyW + 2,
                ls: localStorage.getItem('treesh_lyt'),
                visible_lines: c? [...c.querySelectorAll('[data-line-wrap]')].filter(x=>x.offsetParent).length:0,
                total_lines: c? c.querySelectorAll('[data-line-wrap]').length:0,
            };
        }""")
        RESULTS[f'theme_{t}'] = info
        if info.get('overflow'):
            ERRORS.append(f"theme {t} horizontal overflow")
        if t == 'classic' and info.get('has_lyt_on'):
            ERRORS.append(f"classic should NOT have lyt-on class")
        if t != 'classic' and not info.get('has_lyt_on'):
            ERRORS.append(f"theme {t} missing lyt-on class")
        if info.get('ls') != f'"{t}"':
            ERRORS.append(f"theme {t} localStorage mismatch: {info.get('ls')}")

async def test_chat_specifics(pg):
    await pg.evaluate("()=>{ lytSet('chat', true); }")
    await pg.wait_for_timeout(1800)
    await pg.evaluate("()=>{ audio.currentTime=40; }")
    await pg.wait_for_timeout(2000)
    info = await pg.evaluate("""()=>{
        const c=document.getElementById('np-lyrics');
        const start=document.querySelector('[data-testid=\"lyt-chat-start\"]');
        const read=document.querySelector('[data-testid=\"lyt-read\"]');
        const typing=document.querySelector('[data-testid=\"lyt-typing\"]');
        const fut=c?c.querySelectorAll('.lyt-fut'):[];
        let futHidden=true;
        for(const f of fut){ if(getComputedStyle(f).display!=='none'){ futHidden=false; break; } }
        const bubbles=c?c.querySelectorAll('.wc-row.is-a, .wc-b').length:0;
        const avatars=c?c.querySelectorAll('.wc-row .wc-av, [data-testid=\"lyt-chat-start\"] img, [data-testid=\"lyt-chat-start\"] .wc-av').length:0;
        return {
            has_start: !!start,
            has_read: !!read,
            read_text: read?read.textContent:'',
            has_typing_eventually: !!typing,
            future_hidden: futHidden,
            bubbles: bubbles,
            avatars: avatars,
        };
    }""")
    RESULTS['chat_specifics'] = info
    # Wait a bit more for typing
    for _ in range(10):
        has_typing = await pg.locator('[data-testid="lyt-typing"]').count()
        if has_typing:
            RESULTS['chat_typing_seen'] = True
            break
        await pg.wait_for_timeout(300)
    else:
        RESULTS['chat_typing_seen'] = False

async def _ensure_sheet_closed(pg):
    for _ in range(3):
        n = await pg.locator('#nps-root [data-testid="lyt-sheet"]').count()
        if not n: return
        try:
            await pg.locator('[data-testid="lyt-close"]').click(timeout=1500, force=True)
        except Exception:
            await pg.evaluate("()=>{const r=document.getElementById('nps-root'); if(r) r.innerHTML='';}")
        await pg.wait_for_timeout(400)

async def test_pin(pg):
    await _ensure_sheet_closed(pg)
    # reset
    await pg.evaluate("()=>{ localStorage.removeItem('treesh_lyt_song'); lytSet('classic',true); }")
    await pg.wait_for_timeout(600)
    # open sheet, pick chat, turn on pin
    tid = 'lyt-open-button' if MOBILE else 'lyt-open-button-d'
    await pg.locator(f'[data-testid="{tid}"]').click(force=True)
    await pg.wait_for_timeout(700)
    sheet_open = await pg.locator('[data-testid="lyt-sheet"]').count()
    if not sheet_open:
        # retry
        await pg.evaluate(f"()=>{{const b=document.querySelector('[data-testid=\"{tid}\"]'); if(b) b.click();}}")
        await pg.wait_for_timeout(700)
    await pg.locator('[data-testid="lyt-opt-chat"]').click(force=True)
    await pg.wait_for_timeout(600)
    await pg.locator('[data-testid="lyt-pin-toggle"]').click(force=True)
    await pg.wait_for_timeout(500)
    # pick neon while pinned -> only song pin updates
    await pg.locator('[data-testid="lyt-opt-neon"]').click(force=True)
    await pg.wait_for_timeout(600)
    after = await pg.evaluate("""()=>({
        global: localStorage.getItem('treesh_lyt'),
        pins: localStorage.getItem('treesh_lyt_song'),
        cur: document.getElementById('np-lyrics').dataset.lyt
    })""")
    RESULTS['pin_global_unchanged_pins_set'] = after
    # toggle pin off
    await pg.locator('[data-testid="lyt-pin-toggle"]').click(force=True)
    await pg.wait_for_timeout(500)
    after2 = await pg.evaluate("""()=>({
        global: localStorage.getItem('treesh_lyt'),
        pins: localStorage.getItem('treesh_lyt_song'),
        cur: document.getElementById('np-lyrics').dataset.lyt
    })""")
    RESULTS['pin_removed'] = after2
    try:
        await pg.locator('[data-testid="lyt-close"]').click(force=True)
    except Exception: pass
    await pg.wait_for_timeout(400)

async def test_lyric_seek(pg):
    results = {}
    for t in ['classic', 'chat', 'neon', 'type', 'note', 'term', 'comic', 'pola']:
        await pg.evaluate(f"()=>{{ lytSet('{t}', true); audio.currentTime=40; }}")
        await pg.wait_for_timeout(1200)
        seeked = await pg.evaluate("""async ()=>{
            const nodes=[...document.querySelectorAll('#np-lyrics [data-act=\"lyric-seek\"]')].filter(x=>x.offsetParent);
            if(!nodes.length) return {ok:false, reason:'no-visible'};
            const target = nodes[Math.min(2, nodes.length-1)];
            const t = parseFloat(target.getAttribute('data-t')||'0');
            const before = audio.currentTime;
            target.click();
            await new Promise(r=>setTimeout(r,500));
            return {ok: Math.abs(audio.currentTime - t) < 1.5, t_target:t, before, after:audio.currentTime};
        }""")
        results[t] = seeked
    RESULTS['lyric_seek_per_theme'] = results

async def test_karaoke_edit_force_classic(pg):
    await pg.evaluate("()=>{ lytSet('neon', true); }")
    await pg.wait_for_timeout(800)
    try:
        await pg.evaluate("()=>{ document.querySelector('[data-act=\"toggle-karaoke\"]').click(); }")
        await pg.wait_for_timeout(1200)
        kinfo = await pg.evaluate("""()=>({
            np_lyt: (document.getElementById('np-lyrics')||{}).dataset?.lyt,
            region_lyt: (document.getElementById('np-lyric-region')||{}).dataset?.lyt,
            karaoke_state: !!state.karaoke
        })""")
        RESULTS['karaoke_forces_classic'] = kinfo
        await pg.evaluate("()=>{ document.querySelector('[data-act=\"toggle-karaoke\"]').click(); }")
        await pg.wait_for_timeout(1000)
    except Exception as e:
        RESULTS['karaoke_forces_classic'] = f"ERR {e}"

async def test_options_menu(pg):
    try:
        await pg.evaluate("()=>{ const b=document.querySelector('[data-act=\"lyrics-tools-menu\"]'); if(b) b.click(); }")
        await pg.wait_for_timeout(500)
        has = await pg.locator('[data-testid="lyrictool-lyt-open"]').count()
        RESULTS['options_menu_has_lyt'] = bool(has)
        if has:
            await pg.locator('[data-testid="lyrictool-lyt-open"]').click()
            await pg.wait_for_timeout(600)
            opened = await pg.locator('[data-testid="lyt-sheet"]').is_visible()
            RESULTS['options_menu_opens_sheet'] = opened
            if opened:
                await pg.locator('[data-testid="lyt-close"]').click()
                await pg.wait_for_timeout(400)
    except Exception as e:
        RESULTS['options_menu_has_lyt'] = f"ERR {e}"

async def test_settings_section(pg):
    try:
        await _ensure_sheet_closed(pg)
        await pg.evaluate("()=>{ state.settingsTab='appearance'; try{navigate('settings');}catch(e){} }")
        await pg.wait_for_timeout(900)
        sec = await pg.locator('[data-testid="settings-lyric-theme"]').count()
        tiles = await pg.locator('[data-testid^="settings-lyt-"]').count()
        RESULTS['settings_section'] = {'present': bool(sec), 'tiles': tiles}
        if tiles:
            await pg.evaluate("()=>{const b=document.querySelector('[data-testid=\"settings-lyt-neon\"]'); if(b){b.scrollIntoView({block:'center'}); b.click();}}")
            await pg.wait_for_timeout(600)
            ls = await pg.evaluate("()=>localStorage.getItem('treesh_lyt')")
            RESULTS['settings_section']['neon_set'] = ls
    except Exception as e:
        RESULTS['settings_section'] = f"ERR {e}"

async def test_global_search(pg):
    try:
        found = await pg.evaluate("""()=>{
            const idx = (typeof SETTINGS_INDEX!=='undefined')?SETTINGS_INDEX:[];
            const match = idx.filter(x=>/lyric theme/i.test((x.label||'')+' '+(x.kw||'')));
            return {indexed: match.length, labels: match.map(x=>x.label)};
        }""")
        RESULTS['global_search_lyric_theme'] = found
    except Exception as e:
        RESULTS['global_search_lyric_theme'] = f"ERR {e}"

async def test_lyric_card_studio(pg):
    try:
        await pg.evaluate("""()=>{ const id='chelly-banqz-shake-it-some-mo'; openLyricStudio(id); state.studio.picked=[10,11,12,13].map(i=>studioPickEntry(id,i)); openLyricStudio(id); }""")
        await pg.wait_for_timeout(1500)
        card = await pg.locator('[data-testid="lyric-card-style-card"]').count()
        style_tiles = await pg.locator('[data-testid^="card-style-"]').count()
        RESULTS['card_studio_present'] = {'card': bool(card), 'tiles': style_tiles}
        if style_tiles:
            style_results = {}
            for t in THEMES:
                tile = pg.locator(f'[data-testid="card-style-{t}"]')
                if not await tile.count():
                    style_results[t] = 'missing'
                    continue
                await tile.click(force=True)
                await pg.wait_for_timeout(1500)
                data = await pg.evaluate("""()=>({
                    styleName: (document.querySelector('[data-testid=\"lyric-card-style-name\"]')||{}).textContent||'',
                    bgHidden: (document.querySelector('[data-testid=\"lyric-card-bg-card\"]')||{}).classList?.contains('hidden'),
                    typeHidden: (document.querySelector('[data-testid=\"lyric-card-type-card\"]')||{}).classList?.contains('hidden'),
                    badgeHidden: (document.querySelector('[data-testid=\"lyric-card-badge-card\"]')||{}).classList?.contains('hidden'),
                    canvasSize: (()=>{const c=document.getElementById('lyric-canvas'); return c?[c.width,c.height]:null;})(),
                })""")
                style_results[t] = data
            RESULTS['card_studio_styles'] = style_results
    except Exception as e:
        RESULTS['card_studio_present'] = f"ERR {e}"

async def test_regression_controls(pg):
    try:
        state_before = await pg.evaluate("()=>({paused:audio.paused, t:audio.currentTime})")
        await pg.evaluate("()=>{ const b=document.querySelector('#np [data-act=\"toggle-play\"]'); if(b) b.click(); }")
        await pg.wait_for_timeout(600)
        state_after = await pg.evaluate("()=>({paused:audio.paused, t:audio.currentTime})")
        RESULTS['play_pause_toggle'] = {'before': state_before, 'after': state_after}
    except Exception as e:
        RESULTS['play_pause_toggle'] = f"ERR {e}"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**(p.devices['iPhone 13'] if MOBILE else {'viewport': {'width': 1400, 'height': 850}}))
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: (ERRORS.append(f"PAGEERR: {e}"), print('PAGEERR', e)))
        pg.on('console', lambda m: ERRORS.append(f"CONSOLE {m.type}: {m.text}") if m.type == 'error' and 'tailwind' not in m.text.lower() else None)

        await seed_and_open(pg)
        await test_toolbar_button(pg)
        await test_sheet_open_close(pg)
        await test_each_theme(pg)
        await test_chat_specifics(pg)
        await test_pin(pg)
        await test_lyric_seek(pg)
        await test_karaoke_edit_force_classic(pg)
        await test_options_menu(pg)
        await test_settings_section(pg)
        await test_global_search(pg)
        await test_lyric_card_studio(pg)
        await test_regression_controls(pg)

        print("=" * 70)
        print(f"MOBILE={MOBILE}")
        print(json.dumps(RESULTS, indent=2, default=str))
        print("ERRORS:", len(ERRORS))
        for e in ERRORS[:30]:
            print(" -", e)
        await b.close()

asyncio.run(main())
