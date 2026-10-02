"""
Playwright test for Song Coder — Artist Copy Code + Bulk Song Import.
Run inside browser automation harness (page object injected).
Keeps a reference of the exact selectors / flows exercised in iteration 5.
"""

import asyncio, httpx, re, json

API = "https://music-catalog-sync.preview.emergentagent.com/api/mockgh"
URL = "https://music-catalog-sync.preview.emergentagent.com/songcoder.html"
CFG = {
    "token": "testtoken", "apiBase": API, "mode": "live",
    "owner": "TreeshWoodz", "repo": "Treesh", "branch": "main",
    "songsPath": "content/songs.html",
    "iconsPath": "content/icons.html",
    "lyricsPath": "content/lyrics.html",
}
FILES = [
    "/app/tests/assets/track1.mp3",   # Night Drive / SAVIONCE feat Palo / rap / artwork
    "/app/tests/assets/track2.mp3",   # Sunrise Flow / Black Barbie / R&B
    "/app/tests/assets/track3.mp3",   # Third One / Unknown Kid / artwork
]


async def seed(page, mode="live"):
    httpx.post(f"{API}/reset", timeout=30)
    cfg = {**CFG, "mode": mode}
    await page.goto(URL, wait_until="domcontentloaded")
    await page.evaluate(
        f"() => localStorage.setItem('treesh_songcoder_cfg_v2', {json.dumps(json.dumps(cfg))})"
    )
    await page.reload(wait_until="networkidle")
    await page.wait_for_timeout(1500)


async def test_artist_copy_code(page):
    await page.click('[data-testid="tab-artists"]')
    await page.wait_for_selector('[data-testid="artist-card-11"]')
    await page.click('[data-testid="artist-card-11"] [data-testid="artist-edit-btn"]')
    await page.wait_for_selector('[data-testid="artist-code-panel"]')
    assert "#11" in (await page.text_content("#a-id"))
    await page.click('[data-testid="artist-code-toggle"]')
    code = await page.text_content('[data-testid="artist-generated-code"]')
    assert 'data-artist-id="11"' in code and "data-cashapp=" in code
    was_open = await page.evaluate(
        'document.querySelector("#a-code-panel").classList.contains("open")'
    )
    await page.click('[data-testid="artist-copy-code-btn"]', force=True)
    toast = await page.evaluate(
        '() => Array.from(document.querySelectorAll(\'[class*="toast"]\')).map(e=>e.textContent).join("|")'
    )
    assert "Artist code copied" in toast
    still_open = await page.evaluate(
        'document.querySelector("#a-code-panel").classList.contains("open")'
    )
    assert was_open == still_open, "copy must NOT toggle panel"


async def test_bulk_compose_flow(page):
    # multi-select on audio-file-input opens bulk drawer
    await page.click('[data-testid="tab-compose"]')
    await page.set_input_files('[data-testid="audio-file-input"]', FILES)
    await page.wait_for_selector('[data-testid="bulk-drawer"]')
    await page.wait_for_timeout(2500)
    assert await page.locator('[data-testid="queue-item"]').count() == 3
    titles = await page.evaluate(
        'Array.from(document.querySelectorAll(\'[data-testid="queue-input-title"]\')).map(e=>e.value)'
    )
    assert titles == ["Night Drive", "Sunrise Flow", "Third One"]


async def test_bulk_live_upload(page):
    await seed(page, "live")
    await page.click('[data-testid="open-bulk-import-btn"]', force=True)
    await page.set_input_files('[data-testid="bulk-file-input"]', FILES)
    await page.wait_for_timeout(2500)
    for i in range(3):
        await page.locator('[data-testid="queue-input-mp3"]').nth(i).fill(f"https://ex.com/a{i}.mp3")
        await page.locator('[data-testid="queue-input-cover"]').nth(i).fill(f"https://ex.com/a{i}.jpg")
    await page.locator('[data-testid="queue-input-genre"]').nth(2).fill("rap")
    await page.wait_for_timeout(500)
    await page.click('[data-testid="bulk-upload-btn"]', force=True)
    await page.wait_for_timeout(4000)
    raw = httpx.get(f"{API}/raw/content/songs.html?branch=main", timeout=20).text
    tracks = re.findall(r'data-track="([^"]+)"', raw)
    assert tracks[:3] == ["Night Drive", "Sunrise Flow", "Third One"]
    nd_line = next(l for l in raw.split("\n") if 'data-track="Night Drive"' in l)
    assert 'data-artist-id="3,14"' in nd_line
    assert 'data-featuring="Palo"' in nd_line


# Run harness drives these async funcs directly in iteration 5 — not pytest.
