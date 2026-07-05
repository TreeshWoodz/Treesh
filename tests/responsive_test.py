import asyncio
import sys
from playwright.async_api import async_playwright

async def main():
    viewports = [
        {"name": "812x375", "width": 812, "height": 375},
        {"name": "900x420", "width": 900, "height": 420},
        {"name": "320x568", "width": 320, "height": 568},
        {"name": "390x844", "width": 390, "height": 844},
        {"name": "1280x620", "width": 1280, "height": 620},
        {"name": "1440x900", "width": 1440, "height": 900},
    ]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            print("Starting responsive layout tests")
            
            await page.set_viewport_size({"width": 1440, "height": 900})
            await page.goto("https://melody-boost-3.preview.emergentagent.com", wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(2000)
            print("Page loaded")
            
            # Dismiss onboarding
            try:
                skip_btn = await page.wait_for_selector("text=Skip for now", timeout=3000)
                if skip_btn:
                    await skip_btn.click()
                    await page.wait_for_timeout(500)
                    print("Dismissed onboarding")
            except:
                print("No onboarding modal")
            
            # Play first song
            await page.wait_for_selector("[data-testid*='play-button']", timeout=10000)
            play_buttons = await page.query_selector_all("[data-testid*='play-button']")
            if len(play_buttons) > 0:
                await play_buttons[0].click()
                await page.wait_for_timeout(1000)
                print("Played first song")
            
            # Expand to Now Playing
            expand_btn = await page.wait_for_selector("[data-testid='mini-player-expand-button']", timeout=5000)
            await expand_btn.click()
            await page.wait_for_timeout(1000)
            
            now_playing = await page.wait_for_selector("[data-testid='now-playing']", timeout=5000)
            if now_playing:
                print("Now Playing opened")
            
            # Test each viewport
            for vp in viewports:
                vp_name = vp["name"]
                vp_width = vp["width"]
                vp_height = vp["height"]
                print("Testing " + vp_name)
                
                await page.set_viewport_size({"width": vp_width, "height": vp_height})
                await page.wait_for_timeout(500)
                
                elements = [
                    "now-playing-close-button",
                    "now-playing-play-pause-button",
                    "now-playing-share-button"
                ]
                
                for elem_id in elements:
                    try:
                        selector = "[data-testid='" + elem_id + "']"
                        elem = await page.wait_for_selector(selector, timeout=2000)
                        if elem:
                            box = await elem.bounding_box()
                            if box:
                                bottom = box['y'] + box['height']
                                if bottom <= vp_height:
                                    print("  PASS " + elem_id)
                                else:
                                    print("  FAIL " + elem_id + " clipped")
                    except Exception as e:
                        print("  ERROR " + elem_id)
                
                screenshot_path = ".screenshots/vp_" + vp_name + ".jpg"
                await page.screenshot(path=screenshot_path, type="jpeg", quality=40, full_page=False)
            
            # Text overflow test
            print("Text overflow test at 320x568")
            await page.set_viewport_size({"width": 320, "height": 568})
            await page.wait_for_timeout(500)
            
            title = await page.query_selector("[data-testid='now-playing'] h1")
            if title:
                box = await title.bounding_box()
                if box:
                    right_edge = box['x'] + box['width']
                    if right_edge <= 320:
                        print("  PASS Title no overflow")
                    else:
                        print("  FAIL Title overflows")
            
            await page.screenshot(path=".screenshots/text_overflow.jpg", type="jpeg", quality=40, full_page=False)
            
            # Lyrics view test
            print("Lyrics view test at 812x375")
            await page.set_viewport_size({"width": 812, "height": 375})
            await page.wait_for_timeout(500)
            
            lyrics_toggle = await page.wait_for_selector("[data-testid='now-playing-lyrics-toggle']", timeout=3000)
            await lyrics_toggle.click()
            await page.wait_for_timeout(1000)
            
            lyrics_view = await page.query_selector("[data-testid='lyrics-view']")
            if lyrics_view:
                print("  Lyrics opened")
                
                play_btn = await page.query_selector("[data-testid='now-playing-play-pause-button']")
                if play_btn:
                    box = await play_btn.bounding_box()
                    if box:
                        bottom = box['y'] + box['height']
                        if bottom <= 375:
                            print("  PASS Controls visible in lyrics")
                        else:
                            print("  FAIL Controls clipped in lyrics")
                
                await page.screenshot(path=".screenshots/lyrics_view.jpg", type="jpeg", quality=40, full_page=False)
                await lyrics_toggle.click()
                await page.wait_for_timeout(500)
            
            # Vinyl mode test
            print("Vinyl mode test at 812x375")
            vinyl_toggle = await page.wait_for_selector("[data-testid='now-playing-vinyl-toggle']", timeout=3000)
            await vinyl_toggle.click()
            await page.wait_for_timeout(1000)
            
            vinyl = await page.query_selector("[data-testid='now-playing-vinyl']")
            if vinyl:
                print("  Vinyl activated")
                
                play_btn = await page.query_selector("[data-testid='now-playing-play-pause-button']")
                if play_btn:
                    box = await play_btn.bounding_box()
                    if box:
                        bottom = box['y'] + box['height']
                        if bottom <= 375:
                            print("  PASS Controls visible in vinyl")
                        else:
                            print("  FAIL Controls clipped in vinyl")
                
                await page.screenshot(path=".screenshots/vinyl_mode.jpg", type="jpeg", quality=40, full_page=False)
            
            # Regression test
            print("Regression test at 1440x900")
            await page.set_viewport_size({"width": 1440, "height": 900})
            await page.wait_for_timeout(500)
            
            artwork = await page.query_selector("[data-testid='now-playing-artwork']")
            if artwork:
                box = await artwork.bounding_box()
                if box:
                    width_str = str(round(box['width'], 1))
                    print("  PASS Artwork visible width=" + width_str)
            
            volume = await page.query_selector("[data-testid='now-playing-volume-slider']")
            if volume:
                print("  PASS Volume slider visible")
            
            await page.screenshot(path=".screenshots/regression.jpg", type="jpeg", quality=40, full_page=False)
            
            print("All tests completed successfully")
            
        except Exception as e:
            print("ERROR: " + str(e))
            await page.screenshot(path=".screenshots/error.jpg", type="jpeg", quality=40, full_page=False)
            sys.exit(1)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
