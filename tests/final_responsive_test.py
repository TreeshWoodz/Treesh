import asyncio
import sys
import json
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
    
    critical_elements = [
        "now-playing-close-button",
        "now-playing-seek-slider",
        "now-playing-play-pause-button",
        "now-playing-prev-button",
        "now-playing-next-button",
        "now-playing-shuffle-button",
        "now-playing-repeat-button",
        "now-playing-like-button",
        "now-playing-lyrics-toggle",
        "now-playing-vinyl-toggle",
        "now-playing-queue-button",
        "now-playing-add-button",
        "now-playing-share-button",
    ]
    
    test_results = {"viewport_tests": [], "text_overflow": {}, "lyrics": {}, "vinyl": {}, "regression": {}}
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            print("RESPONSIVE LAYOUT TEST - NOW PLAYING VIEW")
            print("=" * 60)
            
            await page.set_viewport_size({"width": 1440, "height": 900})
            await page.goto("https://melody-boost-3.preview.emergentagent.com", wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(2000)
            print("Page loaded\n")
            
            try:
                skip_btn = await page.wait_for_selector("text=Skip for now", timeout=3000)
                if skip_btn:
                    await skip_btn.click()
                    await page.wait_for_timeout(500)
            except:
                pass
            
            await page.wait_for_selector("[data-testid*='play-button']", timeout=10000)
            play_buttons = await page.query_selector_all("[data-testid*='play-button']")
            if len(play_buttons) > 0:
                await play_buttons[0].click()
                await page.wait_for_timeout(1500)
            
            expand_btn = await page.wait_for_selector("[data-testid='mini-player-expand-button']", timeout=5000)
            await expand_btn.click()
            await page.wait_for_timeout(1500)
            
            await page.wait_for_selector("[data-testid='now-playing']", timeout=5000)
            print("Now Playing opened\n")
            
            # Test all viewports
            print("VIEWPORT TESTS")
            print("-" * 60)
            for vp in viewports:
                print("Testing " + vp["name"] + " (" + str(vp["width"]) + "x" + str(vp["height"]) + ")")
                
                await page.set_viewport_size({"width": vp["width"], "height": vp["height"]})
                await page.wait_for_timeout(800)
                
                vp_result = {"viewport": vp["name"], "width": vp["width"], "height": vp["height"], "elements": []}
                all_pass = True
                
                for elem_id in critical_elements:
                    try:
                        elem = await page.wait_for_selector("[data-testid='" + elem_id + "']", timeout=2000)
                        if elem:
                            box = await elem.bounding_box()
                            if box:
                                bottom = box['y'] + box['height']
                                visible = bottom <= vp["height"]
                                vp_result["elements"].append({"id": elem_id, "visible": visible, "bottom": round(bottom, 1)})
                                if not visible:
                                    print("  FAIL: " + elem_id + " clipped (bottom=" + str(round(bottom, 1)) + ")")
                                    all_pass = False
                    except:
                        vp_result["elements"].append({"id": elem_id, "visible": False})
                        all_pass = False
                
                vp_result["all_visible"] = all_pass
                test_results["viewport_tests"].append(vp_result)
                
                if all_pass:
                    print("  PASS: All " + str(len(critical_elements)) + " elements visible")
                
                await page.screenshot(path=".screenshots/final_" + vp["name"] + ".jpg", type="jpeg", quality=40)
            
            # Text overflow
            print("\nTEXT OVERFLOW TEST (320x568)")
            print("-" * 60)
            await page.set_viewport_size({"width": 320, "height": 568})
            await page.wait_for_timeout(500)
            
            title = await page.query_selector("[data-testid='now-playing'] h1")
            if title:
                box = await title.bounding_box()
                if box:
                    right = box['x'] + box['width']
                    no_overflow = right <= 320
                    test_results["text_overflow"] = {"passed": no_overflow, "right_edge": round(right, 1)}
                    print("PASS: Title no overflow" if no_overflow else "FAIL: Title overflows")
            
            # Lyrics
            print("\nLYRICS VIEW TEST (812x375)")
            print("-" * 60)
            await page.set_viewport_size({"width": 812, "height": 375})
            await page.wait_for_timeout(500)
            
            lyrics_toggle = await page.wait_for_selector("[data-testid='now-playing-lyrics-toggle']", timeout=3000)
            await lyrics_toggle.click()
            await page.wait_for_timeout(1000)
            
            play_btn = await page.query_selector("[data-testid='now-playing-play-pause-button']")
            if play_btn:
                box = await play_btn.bounding_box()
                if box:
                    visible = box['y'] + box['height'] <= 375
                    test_results["lyrics"] = {"passed": visible}
                    print("PASS: Controls visible" if visible else "FAIL: Controls clipped")
            
            await page.screenshot(path=".screenshots/final_lyrics.jpg", type="jpeg", quality=40)
            await lyrics_toggle.click()
            await page.wait_for_timeout(500)
            
            # Vinyl
            print("\nVINYL MODE TEST (812x375)")
            print("-" * 60)
            vinyl_toggle = await page.wait_for_selector("[data-testid='now-playing-vinyl-toggle']", timeout=3000)
            await vinyl_toggle.click()
            await page.wait_for_timeout(1000)
            
            play_btn = await page.query_selector("[data-testid='now-playing-play-pause-button']")
            if play_btn:
                box = await play_btn.bounding_box()
                if box:
                    visible = box['y'] + box['height'] <= 375
                    test_results["vinyl"] = {"passed": visible}
                    print("PASS: Controls visible" if visible else "FAIL: Controls clipped")
            
            await page.screenshot(path=".screenshots/final_vinyl.jpg", type="jpeg", quality=40)
            
            # Regression
            print("\nREGRESSION TEST (1440x900)")
            print("-" * 60)
            await page.set_viewport_size({"width": 1440, "height": 900})
            await page.wait_for_timeout(500)
            
            artwork = await page.query_selector("[data-testid='now-playing-artwork']")
            volume = await page.query_selector("[data-testid='now-playing-volume-slider']")
            
            artwork_ok = artwork is not None
            volume_ok = volume is not None
            test_results["regression"] = {"passed": artwork_ok and volume_ok}
            
            if artwork_ok and volume_ok:
                print("PASS: Artwork and volume slider visible")
            else:
                print("FAIL: Missing elements")
            
            await page.screenshot(path=".screenshots/final_regression.jpg", type="jpeg", quality=40)
            
            # Summary
            print("\n" + "=" * 60)
            print("SUMMARY")
            print("=" * 60)
            
            vp_pass = sum(1 for v in test_results["viewport_tests"] if v.get("all_visible"))
            vp_total = len(test_results["viewport_tests"])
            print("Viewport tests: " + str(vp_pass) + "/" + str(vp_total) + " passed")
            
            for v in test_results["viewport_tests"]:
                status = "PASS" if v.get("all_visible") else "FAIL"
                print("  " + status + ": " + v["viewport"])
            
            print("\nText overflow: " + ("PASS" if test_results.get("text_overflow", {}).get("passed") else "FAIL"))
            print("Lyrics view: " + ("PASS" if test_results.get("lyrics", {}).get("passed") else "FAIL"))
            print("Vinyl mode: " + ("PASS" if test_results.get("vinyl", {}).get("passed") else "FAIL"))
            print("Regression: " + ("PASS" if test_results.get("regression", {}).get("passed") else "FAIL"))
            
            with open("/app/test_reports/responsive_results.json", "w") as f:
                json.dump(test_results, f, indent=2)
            
            print("\nResults saved to: /app/test_reports/responsive_results.json")
            
        except Exception as e:
            print("ERROR: " + str(e))
            sys.exit(1)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
