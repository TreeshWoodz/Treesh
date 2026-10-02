"""Playwright tests for Song Coder: Bulk Credits + Projects (Albums)."""
import asyncio
import os
import re
from playwright.async_api import async_playwright

URL = "https://music-catalog-sync.preview.emergentagent.com/songcoder.html"
API = "https://music-catalog-sync.preview.emergentagent.com/api/mockgh"
ASSETS = "/app/tests/assets"

INIT_SCRIPT = """
(() => {
  localStorage.setItem('treesh_songcoder_cfg_v2', JSON.stringify({
    token: 'testtoken',
    apiBase: 'https://music-catalog-sync.preview.emergentagent.com/api/mockgh',
    mode: 'live'
  }));
})();
"""

results = {}

def log(k, v):
    results[k] = v
    print(f"[{k}] {v}")

async def reset_mock(page):
    await page.evaluate(f"fetch('{API}/reset', {{method:'POST'}}).then(r=>r.text())")

async def goto(page):
    await page.goto(URL)
    await page.evaluate(INIT_SCRIPT)
    await page.reload()
    await page.wait_for_load_state("networkidle")

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await ctx.new_page()
        page.on("console", lambda m: print(f"CONSOLE[{m.type}]:", m.text) if m.type in ("error", "warning") else None)

        try:
            await reset_mock(page)
            await goto(page)

            # ===== BULK CREDITS =====
            print("\n=== BULK CREDITS ===")
            await page.click('[data-view="compose"]')
            await page.wait_for_timeout(300)
            await page.click('[data-testid="open-bulk-import-btn"]')
            await page.wait_for_selector('[data-testid="bulk-dropzone"]', timeout=5000)
            await page.set_input_files('[data-testid="bulk-file-input"]',
                                       [f"{ASSETS}/track1.mp3", f"{ASSETS}/track2.mp3"])
            await page.wait_for_timeout(1500)
            qcount = await page.locator('[data-testid="queue-item"]').count()
            log("bulk_queue_items", qcount)

            # Shared credits
            await page.fill('[data-testid="bulk-shared-written-by"]', "SharedWriter")
            await page.fill('[data-testid="bulk-shared-producer"]', "SharedProducer")
            await page.fill('[data-testid="bulk-shared-mixer"]', "SharedMixer")
            await page.click('[data-testid="bulk-apply-all-btn"]')
            await page.wait_for_timeout(500)

            # Verify each queue item has credits filled
            writers = await page.locator('[data-testid="queue-input-writtenBy"]').evaluate_all("els => els.map(e=>e.value)")
            producers = await page.locator('[data-testid="queue-input-producer"]').evaluate_all("els => els.map(e=>e.value)")
            mixers = await page.locator('[data-testid="queue-input-mixer"]').evaluate_all("els => els.map(e=>e.value)")
            log("bulk_apply_writers", writers)
            log("bulk_apply_producers", producers)
            log("bulk_apply_mixers", mixers)
            assert all(w == "SharedWriter" for w in writers), "writers not applied"
            assert all(w == "SharedProducer" for w in producers), "producers not applied"
            assert all(w == "SharedMixer" for w in mixers), "mixers not applied"

            # Per-item override
            await page.locator('[data-testid="queue-input-producer"]').first.fill("OverrideProducer")
            await page.wait_for_timeout(200)
            overridden = await page.locator('[data-testid="queue-input-producer"]').first.input_value()
            log("per_item_override_producer", overridden)
            assert overridden == "OverrideProducer"

            # queue-compose-btn carries credits
            # Fill a title/artist first so compose will accept
            await page.locator('[data-testid="queue-input-title"]').first.fill("TEST Compose Carry")
            await page.locator('[data-testid="queue-input-artist"]').first.fill("TEST Artist CC")
            await page.wait_for_timeout(200)
            await page.locator('[data-testid="queue-compose-btn"]').first.click()
            await page.wait_for_timeout(600)
            cw = await page.input_value('[data-testid="input-written-by"]')
            cp = await page.input_value('[data-testid="input-producer"]')
            cm = await page.input_value('[data-testid="input-mixer"]')
            log("compose_credits_from_queue", {"w": cw, "p": cp, "m": cm})
            assert cw == "SharedWriter"
            assert cp == "OverrideProducer"
            assert cm == "SharedMixer"

            # ===== PROJECTS TAB =====
            print("\n=== PROJECTS TAB ===")
            await page.click('[data-testid="tab-projects"]')
            await page.wait_for_selector('[data-testid="projects-view"]', timeout=5000)
            await page.wait_for_timeout(600)
            card_titles = await page.locator('[data-testid="project-card-title"]').evaluate_all("els => els.map(e=>e.textContent)")
            card_counts = await page.locator('[data-testid="project-card-count"]').evaluate_all("els => els.map(e=>e.textContent)")
            log("project_cards", list(zip(card_titles, card_counts)))
            assert "LOVE: the ExPerience" in card_titles
            assert "The Last Teenager" in card_titles

            # Click LOVE
            idx_love = card_titles.index("LOVE: the ExPerience")
            await page.locator('[data-testid="project-card"]').nth(idx_love).click()
            await page.wait_for_selector('[data-testid="project-editor"]:not([hidden])', timeout=5000)
            await page.wait_for_timeout(800)

            title_v = await page.input_value('[data-testid="project-title-input"]')
            artist_v = await page.input_value('[data-testid="project-artist-input"]')
            cover_v = await page.input_value('[data-testid="project-cover-input"]')
            slug_v = await page.input_value('[data-testid="project-slug-input"]')
            url_text = await page.text_content('[data-testid="project-url"]')
            status_text = await page.text_content('[data-testid="project-status"]')
            log("love_project_fields", {
                "title": title_v, "artist": artist_v, "cover": cover_v[:60], "slug": slug_v,
                "url": url_text, "status": status_text
            })
            assert title_v == "LOVE: the ExPerience"
            assert artist_v == "SAVIONCE"
            assert slug_v == "love-the-experience"
            assert cover_v, "cover should default to first track cover"
            assert "treesh.app/projects/love-the-experience" in url_text
            assert "Not published" in status_text or "Published" in status_text

            # Preview iframe content
            frame = page.frame_locator('[data-testid="project-preview-frame"]')
            await page.wait_for_timeout(600)
            # Count li in iframe
            track_rows = await frame.locator("ol#list li").count()
            play_all = await frame.locator("button#all").is_visible()
            h1 = await frame.locator("h1").text_content()
            log("preview_iframe", {"tracks": track_rows, "play_all": play_all, "h1": h1})
            assert track_rows == 2
            assert play_all

            # Update title triggers preview debounce
            await page.fill('[data-testid="project-title-input"]', "LOVE: the ExPerience")
            await page.locator('[data-testid="project-title-input"]').evaluate("el=>el.value='LOVE: the EDITED'")
            await page.locator('[data-testid="project-title-input"]').type(" ")
            await page.wait_for_timeout(600)
            # Just check it eventually updates - actually the input handler reads e.target.value already
            await page.fill('[data-testid="project-title-input"]', "LOVE: the EDITED")
            await page.wait_for_timeout(600)
            h1b = await frame.locator("h1").text_content()
            log("preview_after_edit_h1", h1b)
            # Restore
            await page.fill('[data-testid="project-title-input"]', "LOVE: the ExPerience")
            await page.wait_for_timeout(500)

            # Tracklist reorder
            titles_before = await frame.locator("ol#list li b").evaluate_all("els => els.map(e=>e.textContent)")
            log("tracks_before_reorder", titles_before)
            # Click down on first track
            await page.locator('[data-testid="project-track-down-btn"]').first.click()
            await page.wait_for_timeout(500)
            titles_after = await frame.locator("ol#list li b").evaluate_all("els => els.map(e=>e.textContent)")
            log("tracks_after_down", titles_after)
            assert titles_after != titles_before

            # Remove a track
            await page.locator('[data-testid="project-track-remove-btn"]').first.click()
            await page.wait_for_timeout(400)
            row_count = await page.locator('[data-testid="project-track-row"]').count()
            log("rows_after_remove", row_count)
            assert row_count == 1

            # Reset tracks
            await page.click('[data-testid="project-reset-tracks-btn"]')
            await page.wait_for_timeout(400)
            row_count2 = await page.locator('[data-testid="project-track-row"]').count()
            log("rows_after_reset", row_count2)
            assert row_count2 == 2

            # Slug normalization
            await page.locator('[data-testid="project-slug-input"]').fill("My Cool Page!")
            await page.locator('[data-testid="project-slug-input"]').press("Tab")
            await page.wait_for_timeout(500)
            slug_after = await page.input_value('[data-testid="project-slug-input"]')
            log("slug_normalized", slug_after)
            assert slug_after == "my-cool-page"

            # Validation: empty cover + bad slug
            # Make slug bad by filling with just symbols after normalize gives empty
            await page.locator('[data-testid="project-cover-input"]').fill("")
            await page.locator('[data-testid="project-cover-input"]').evaluate("el=>el.dispatchEvent(new Event('input',{bubbles:true}))")
            await page.locator('[data-testid="project-slug-input"]').fill("")
            await page.locator('[data-testid="project-slug-input"]').evaluate("el=>el.dispatchEvent(new Event('input',{bubbles:true}))")
            await page.wait_for_timeout(300)
            await page.click('[data-testid="project-publish-btn"]')
            await page.wait_for_timeout(800)
            toast_text = await page.evaluate("""() => {
                const els = Array.from(document.querySelectorAll('.toast,[class*=toast]'));
                return els.map(e=>e.textContent).join(' | ');
            }""")
            log("validation_toast", toast_text)
            assert "cover" in toast_text.lower() or "address" in toast_text.lower() or "page address" in toast_text.lower()
            # Modal should NOT be success
            success_modal_visible = await page.locator('[data-testid="publish-success-modal"]').is_visible()
            log("validation_blocks_commit", not success_modal_visible)
            assert not success_modal_visible

            # Restore good values and publish
            await page.locator('[data-testid="project-cover-input"]').fill("https://ik.imagekit.io/treesh/cover.jpg")
            await page.locator('[data-testid="project-cover-input"]').evaluate("el=>el.dispatchEvent(new Event('input',{bubbles:true}))")
            await page.locator('[data-testid="project-slug-input"]').fill("love-the-experience")
            await page.locator('[data-testid="project-slug-input"]').evaluate("el=>el.dispatchEvent(new Event('input',{bubbles:true}))")
            await page.locator('[data-testid="project-slug-input"]').evaluate("el=>el.dispatchEvent(new Event('change',{bubbles:true}))")
            await page.wait_for_timeout(500)

            # Publish (Go live)
            await page.click('[data-testid="project-publish-btn"]')
            await page.wait_for_selector('[data-testid="publish-success-modal"]', timeout=10000)
            modal_title = await page.text_content('[data-testid="publish-success-modal"] h3, [data-testid="publish-success-modal"] .title, [data-testid="publish-success-modal"]')
            open_link_href = await page.get_attribute('[data-testid="success-open-page-link"]', "href")
            log("publish_live_modal_text_snippet", (modal_title or "")[:120])
            log("open_page_link", open_link_href)
            assert open_link_href and "treesh.app/projects/love-the-experience" in open_link_href

            # Close modal
            await page.click('[data-testid="success-close-btn"]')
            await page.wait_for_timeout(500)

            # Check status now Published and button label 'Update page'
            status_now = await page.text_content('[data-testid="project-status"]')
            btn_label = await page.text_content('#proj-save-label')
            log("after_publish_status", status_now)
            log("after_publish_btn_label", btn_label)
            assert "Published" in status_now
            assert "Update" in btn_label

            # Verify raw file exists via mock GH
            raw_html = await page.evaluate(f"""async () => {{
                const r = await fetch('{API}/raw/projects/love-the-experience.html?branch=main');
                return r.ok ? await r.text() : 'ERR:'+r.status;
            }}""")
            has_og_title = 'property="og:title"' in raw_html
            has_og_image = 'property="og:image"' in raw_html
            has_li = raw_html.count("<li") >= 2
            has_data_script = "D = " in raw_html and '"tracks"' in raw_html
            log("raw_file_markers", {
                "og_title": has_og_title, "og_image": has_og_image, "li_entries>=2": has_li,
                "inline_json": has_data_script
            })
            assert has_og_title and has_og_image and has_li and has_data_script

            # Re-publish updates
            await page.click('[data-testid="project-publish-btn"]')
            await page.wait_for_selector('[data-testid="publish-success-modal"]', timeout=10000)
            await page.click('[data-testid="success-close-btn"]')
            await page.wait_for_timeout(500)
            # Check commits
            commits = await page.evaluate(f"""async () => {{
                const r = await fetch('{API}/repos/TreeshWoodz/Treesh/commits?sha=main&per_page=10');
                return await r.json();
            }}""")
            msgs = [c.get("commit", {}).get("message", "") for c in (commits if isinstance(commits, list) else [])]
            log("recent_commits", msgs[:5])
            has_update = any(m.startswith("Update project page") for m in msgs)
            log("has_update_commit", has_update)
            assert has_update

            # Copy code button
            await page.evaluate("""() => {
              window.__copied = null;
              navigator.clipboard = { writeText: (t) => { window.__copied = t; return Promise.resolve(); } };
            }""")
            await page.click('[data-testid="project-copy-code-btn"]')
            await page.wait_for_timeout(400)
            toast_copy = await page.evaluate("""() => Array.from(document.querySelectorAll('.toast,[class*=toast]')).map(e=>e.textContent).join(' | ')""")
            log("copy_toast", toast_copy)
            assert "copied" in toast_copy.lower()

            # ===== REVIEW MODE PR =====
            print("\n=== REVIEW MODE ===")
            await page.click('[data-testid="project-mode-pr-btn"]')
            await page.wait_for_timeout(300)
            # Modify title to force a different commit
            await page.fill('[data-testid="project-title-input"]', "LOVE: the ExPerience")
            await page.wait_for_timeout(300)
            # Change slug to a new one so new branch
            await page.locator('[data-testid="project-slug-input"]').fill("love-the-experience")
            await page.locator('[data-testid="project-slug-input"]').evaluate("el=>el.dispatchEvent(new Event('change',{bubbles:true}))")
            await page.wait_for_timeout(400)
            await page.click('[data-testid="project-publish-btn"]')
            await page.wait_for_selector('[data-testid="publish-success-modal"]', timeout=10000)
            await page.wait_for_timeout(400)
            # Check branches
            branches = await page.evaluate(f"""async () => {{
                const r = await fetch('{API}/repos/TreeshWoodz/Treesh/branches');
                return await r.json();
            }}""")
            branch_names = [b.get("name") for b in (branches if isinstance(branches, list) else [])]
            log("branches", branch_names)
            pr_branches = [n for n in branch_names if n and n.startswith("songcoder/project-")]
            log("pr_branches", pr_branches)
            assert len(pr_branches) >= 1
            await page.click('[data-testid="success-close-btn"]')
            await page.wait_for_timeout(300)

            # ===== SETTINGS projects dir default =====
            print("\n=== SETTINGS ===")
            await page.click('[data-testid="open-settings-btn"]') if await page.locator('[data-testid="open-settings-btn"]').count() else None
            # Fallback: try different selectors
            # Look for the settings drawer input directly
            # First try to open via header icon
            try:
                await page.locator('button:has-text("Settings"), [data-testid*="settings"]').first.click(timeout=2000)
            except Exception:
                pass
            await page.wait_for_timeout(500)
            projects_dir = await page.evaluate("""() => {
                const el = document.querySelector('[data-testid="settings-projects-dir-input"]');
                return el ? el.value : null;
            }""")
            log("settings_projects_dir_default", projects_dir)
            assert projects_dir == "projects"

            # ===== REGRESSION: Lyrics + Artists =====
            print("\n=== REGRESSION ===")
            await page.click('[data-testid="tab-lyrics"]')
            await page.wait_for_timeout(400)
            lyrics_visible = await page.locator('#view-lyrics').is_visible()
            log("lyrics_tab_loads", lyrics_visible)

            await page.click('[data-testid="tab-artists"]')
            await page.wait_for_timeout(400)
            artists_visible = await page.locator('#view-artists').is_visible()
            log("artists_tab_loads", artists_visible)

            # ===== MOBILE 390x844 =====
            print("\n=== MOBILE ===")
            mpage = await ctx.new_page()
            await mpage.set_viewport_size({"width": 390, "height": 844})
            await mpage.goto(URL)
            await mpage.evaluate(INIT_SCRIPT)
            await mpage.reload()
            await mpage.wait_for_load_state("networkidle")
            await mpage.wait_for_timeout(500)

            # 5 tabs
            tabs_count = await mpage.locator('.tab[data-view]').count()
            log("mobile_tabs_count", tabs_count)
            # no horizontal overflow
            body_overflow = await mpage.evaluate("() => ({sw: document.body.scrollWidth, cw: document.body.clientWidth})")
            log("mobile_body_overflow", body_overflow)
            assert body_overflow["sw"] <= body_overflow["cw"] + 2

            # Go to projects
            await mpage.click('[data-testid="tab-projects"]')
            await mpage.wait_for_timeout(600)
            # Click first project card
            await mpage.locator('[data-testid="project-card"]').first.click()
            await mpage.wait_for_timeout(800)
            # Form & preview stack
            form_box = await mpage.locator('.proj-form').bounding_box()
            prev_box = await mpage.locator('.proj-prev').bounding_box()
            log("mobile_form_prev_boxes", {"form_y": form_box["y"] if form_box else None,
                                            "prev_y": prev_box["y"] if prev_box else None})
            if form_box and prev_box:
                assert prev_box["y"] > form_box["y"], "preview should stack below form"

            # Footer buttons fit
            foot = await mpage.locator('.proj-foot').bounding_box()
            log("mobile_proj_foot_width", foot["width"] if foot else None)
            assert foot and foot["width"] <= 390

            # Mobile bulk credits stack
            await mpage.click('[data-testid="project-back-btn"]')
            await mpage.wait_for_timeout(400)
            await mpage.click('[data-view="compose"]')
            await mpage.wait_for_timeout(300)
            await mpage.click('[data-testid="open-bulk-import-btn"]')
            await mpage.wait_for_timeout(400)
            m_body_overflow = await mpage.evaluate("() => ({sw: document.body.scrollWidth, cw: document.body.clientWidth})")
            log("mobile_bulk_overflow", m_body_overflow)
            assert m_body_overflow["sw"] <= m_body_overflow["cw"] + 2

            # Tab labels no counts on mobile? verify
            mobile_tab_text = await mpage.locator('[data-testid="tab-projects"]').inner_text()
            log("mobile_projects_tab_text", mobile_tab_text)

            print("\n=== ALL CHECKS PASSED ===")
        except AssertionError as e:
            print(f"\nASSERT FAIL: {e}")
            await page.screenshot(path="/app/test_reports/fail.png", quality=40, full_page=False)
        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback; traceback.print_exc()
            try:
                await page.screenshot(path="/app/test_reports/err.png", quality=40, full_page=False)
            except Exception:
                pass
        finally:
            print("\n=== RESULTS SUMMARY ===")
            for k, v in results.items():
                print(f"  {k}: {v}")
            await browser.close()

asyncio.run(run())
