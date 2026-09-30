import asyncio
import sys
import json
from playwright.async_api import async_playwright

async def main():
    viewports = [
        {"name": "short_landscape_812x375", "width": 812, "height": 375},
        {"name": "short_landscape_900x420", "width": 900, "height": 420},
        {"name": "small_narrow_phone_320x568", "width": 320, "height": 568},
        {"name": "normal_phone_390x844", "width": 390, "height": 844},
        {"name": "short_desktop_1280x620", "width": 1280, "height": 620},
        {"name": "desktop_1440x900", "width": 1440, "height": 900},
    ]
    
    # All elements that must be checked
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
    
    test_results = {
        "viewport_tests": [],
        "text_overflow_test": {},
        "lyrics_view_test": {},
        "vinyl_mode_test": {},
        "regression_test": {}
    }
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            print("=" * 70)
            print("COMPREHENSIVE RESPONSIVE LAYOUT TEST FOR NOW PLAYING VIEW")
            print("=" * 70)
            
            await page.set_viewport_size({"width": 1440, "height": 900})
            await page.goto("https://treesh-phase5.preview.emergentagent.com", wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(2000)
            print("Page loaded successfully")
            
            # Dismiss onboarding
            try:
                skip_btn = await page.wait_for_selector("text=Skip for now", timeout=3000)
                if skip_btn:
                    await skip_btn.click()
                    await page.wait_for_timeout(500)
                    print("Dismissed onboarding modal")
            except:
                print("No onboarding modal found")
            
            # Play first song
            await page.wait_for_selector("[data-testid*='play-button']", timeout=10000)
            play_buttons = await page.query_selector_all("[data-testid*='play-button']")
            if len(play_buttons) > 0:
                await play_buttons[0].click()
                await page.wait_for_timeout(1500)
                print("Started playing first song")
            
            # Expand to Now Playing
            expand_btn = await page.wait_for_selector("[data-testid='mini-player-expand-button']", timeout=5000)
            await expand_btn.click()
            await page.wait_for_timeout(1500)
            
            now_playing = await page.wait_for_selector("[data-testid='now-playing']", timeout=5000)
            if now_playing:
                print("Now Playing view opened successfully\n")
            
            # Test each viewport
            print("=" * 70)
            print("TESTING ALL VIEWPORT SIZES")
            print("=" * 70)
            
            for vp in viewports:
                vp_name = vp["name"]
                vp_width = vp["width"]
                vp_height = vp["height"]
                
                print("\n" + "-" * 70)
                print("Viewport: " + vp_name + " (" + str(vp_width) + "x" + str(vp_height) + ")")
                print("-" * 70)
                
                await page.set_viewport_size({"width": vp_width, "height": vp_height})
                await page.wait_for_timeout(800)
                
                vp_result = {
                    "viewport": vp_name,
                    "width": vp_width,
                    "height": vp_height,
                    "elements": []
                }
                
                all_visible = True
                
                for elem_id in critical_elements:
                    try:
                        selector = "[data-testid='" + elem_id + "']"
                        elem = await page.wait_for_selector(selector, timeout=3000)
                        if elem:
                            box = await elem.bounding_box()
                            if box:
                                top = box['y']
                                bottom = box['y'] + box['height']
                                is_visible = (bottom <= vp_height and top >= 0)
                                
                                elem_result = {
                                    "id": elem_id,
                                    "visible": is_visible,
                                    "top": round(top, 2),
                                    "bottom": round(bottom, 2)
                                }
                                vp_result["elements"].append(elem_result)
                                
                                if is_visible:
                                    print("  PASS " + elem_id + " (top=" + str(round(top, 1)) + ", bottom=" + str(round(bottom, 1)) + ")")
                                else:
                                    print("  FAIL " + elem_id + " CLIPPED (bottom=" + str(round(bottom, 1)) + " > viewport=" + str(vp_height) + ")")
                                    all_visible = False
                            else:
                                elem_result = {"id": elem_id, "visible": False, "error": "No bounding box"}
                                vp_result["elements"].append(elem_result)
                                print("  ERROR " + elem_id + " - No bounding box")
                                all_visible = False
                        else:
                            elem_result = {"id": elem_id, "visible": False, "error": "Element not found"}
                            vp_result["elements"].append(elem_result)
                            print("  ERROR " + elem_id + " - Not found")
                            all_visible = False
                    except Exception as e:
                        elem_result = {"id": elem_id, "visible": False, "error": str(e)}
                        vp_result["elements"].append(elem_result)
                        print("  ERROR " + elem_id + " - " + str(e))
                        all_visible = False
                
                vp_result["all_visible"] = all_visible
                test_results["viewport_tests"].append(vp_result)
                
                if all_visible:
                    print("\nRESULT: ALL ELEMENTS VISIBLE - PASS")
                else:
                    print("\nRESULT: SOME ELEMENTS CLIPPED - FAIL")
                
                screenshot_path = ".screenshots/comprehensive_" + vp_name + ".jpg"
                await page.screenshot(path=screenshot_path, type="jpeg", quality=40, full_page=False)
                print("Screenshot saved: " + screenshot_path)
            
            # Text overflow test at 320x568
            print("\n" + "=" * 70)
            print("TEXT OVERFLOW TEST (320x568)")
            print("=" * 70)
            
            await page.set_viewport_size({"width": 320, "height": 568})
            await page.wait_for_timeout(800)
            
            try:
                title = await page.query_selector("[data-testid='now-playing'] h1")
                if title:
                    box = await title.bounding_box()
                    if box:
                        right_edge = box['x'] + box['width']
                        viewport_width = 320
                        no_overflow = right_edge <= viewport_width
                        
                        test_results["text_overflow_test"] = {
                            "passed": no_overflow,
                            "right_edge": round(right_edge, 2),
                            "viewport_width": viewport_width
                        }
                        
                        if no_overflow:
                            print("PASS: Title does NOT overflow")
                            print("  Right edge: " + str(round(right_edge, 2)) + "px, Viewport: " + str(viewport_width) + "px")
                        else:
                            print("FAIL: Title OVERFLOWS")
                            print("  Right edge: " + str(round(right_edge, 2)) + "px > Viewport: " + str(viewport_width) + "px")
                    else:
                        test_results["text_overflow_test"] = {"passed": False, "error": "No bounding box"}
                        print("ERROR: Could not get title bounding box")
                else:
                    test_results["text_overflow_test"] = {"passed": False, "error": "Title not found"}
                    print("ERROR: Title element not found")
            except Exception as e:
                test_results["text_overflow_test"] = {"passed": False, "error": str(e)}
                print("ERROR: " + str(e))
            
            await page.screenshot(path=".screenshots/comprehensive_text_overflow.jpg", type="jpeg", quality=40, full_page=False)
            
            # Lyrics view test
            print("\n" + "=" * 70)
            print("LYRICS VIEW RESPONSIVENESS TEST (812x375 and 320x568)")
            print("=" * 70)
            
            for test_vp in [{"width": 812, "height": 375}, {"width": 320, "height": 568}]:
                vp_str = str(test_vp["width"]) + "x" + str(test_vp["height"])
                print("\nTesting lyrics view at " + vp_str)
                
                await page.set_viewport_size(test_vp)
                await page.wait_for_timeout(800)
                
                try:
                    lyrics_toggle = await page.wait_for_selector("[data-testid='now-playing-lyrics-toggle']", timeout=3000)
                    await lyrics_toggle.click()
                    await page.wait_for_timeout(1500)
                    
                    lyrics_view = await page.query_selector("[data-testid='lyrics-view']")
                    if lyrics_view:
                        print("  Lyrics view opened")
                        
                        # Check if play/pause button is still visible
                        play_btn = await page.query_selector("[data-testid='now-playing-play-pause-button']")
                        if play_btn:
                            box = await play_btn.bounding_box()
                            if box:
                                bottom = box['y'] + box['height']
                                is_visible = bottom <= test_vp["height"]
                                
                                if is_visible:
                                    print("  PASS: Play/pause button visible (bottom=" + str(round(bottom, 1)) + ")")
                                else:
                                    print("  FAIL: Play/pause button clipped (bottom=" + str(round(bottom, 1)) + " > " + str(test_vp["height"]) + ")")
                                
                                test_results["lyrics_view_test"][vp_str] = {
                                    "passed": is_visible,
                                    "viewport": vp_str
                                }
                        
                        await page.screenshot(path=".screenshots/comprehensive_lyrics_" + vp_str + ".jpg", type="jpeg", quality=40, full_page=False)
                        
                        # Close lyrics view
                        await lyrics_toggle.click()
                        await page.wait_for_timeout(500)
                    else:
                        print("  ERROR: Lyrics view did not open")
                        test_results["lyrics_view_test"][vp_str] = {"passed": False, "error": "Lyrics view not found"}
                except Exception as e:
                    print("  ERROR: " + str(e))
                    test_results["lyrics_view_test"][vp_str] = {"passed": False, "error": str(e)}
            
            # Vinyl mode test
            print("\n" + "=" * 70)
            print("VINYL MODE RESPONSIVENESS TEST (812x375)")
            print("=" * 70)
            
            await page.set_viewport_size({"width": 812, "height": 375})
            await page.wait_for_timeout(800)
            
            try:
                vinyl_toggle = await page.wait_for_selector("[data-testid='now-playing-vinyl-toggle']", timeout=3000)
                await vinyl_toggle.click()
                await page.wait_for_timeout(1500)
                
                vinyl = await page.query_selector("[data-testid='now-playing-vinyl']")
                if vinyl:
                    print("Vinyl mode activated")
                    
                    # Check if controls still fit
                    controls_visible = True
                    for ctrl_id in ["now-playing-play-pause-button", "now-playing-share-button"]:
                        ctrl = await page.query_selector("[data-testid='" + ctrl_id + "']")
                        if ctrl:
                            box = await ctrl.bounding_box()
                            if box:
                                bottom = box['y'] + box['height']
                                is_visible = bottom <= 375
                                
                                if is_visible:
                                    print("  PASS: " + ctrl_id + " visible")
                                else:
                                    print("  FAIL: " + ctrl_id + " clipped")
                                    controls_visible = False
                    
                    test_results["vinyl_mode_test"] = {
                        "passed": controls_visible,
                        "viewport": "812x375"
                    }
                    
                    await page.screenshot(path=".screenshots/comprehensive_vinyl_mode.jpg", type="jpeg", quality=40, full_page=False)
                else:
                    print("ERROR: Vinyl mode did not activate")
                    test_results["vinyl_mode_test"] = {"passed": False, "error": "Vinyl player not found"}
            except Exception as e:
                print("ERROR: " + str(e))
                test_results["vinyl_mode_test"] = {"passed": False, "error": str(e)}
            
            # Regression test at 1440x900
            print("\n" + "=" * 70)
            print("REGRESSION TEST (1440x900)")
            print("=" * 70)
            
            await page.set_viewport_size({"width": 1440, "height": 900})
            await page.wait_for_timeout(800)
            
            # Turn off vinyl mode first
            try:
                vinyl_toggle = await page.query_selector("[data-testid='now-playing-vinyl-toggle']")
                if vinyl_toggle:
                    await vinyl_toggle.click()
                    await page.wait_for_timeout(500)
            except:
                pass
            
            try:
                artwork = await page.query_selector("[data-testid='now-playing-artwork']")
                volume = await page.query_selector("[data-testid='now-playing-volume-slider']")
                
                artwork_ok = False
                volume_ok = False
                
                if artwork:
                    box = await artwork.bounding_box()
                    if box:
                        artwork_width = box['width']
                        artwork_ok = artwork_width > 300
                        print("PASS: Artwork visible (width=" + str(round(artwork_width, 1)) + "px)")
                    else:
                        print("ERROR: Could not get artwork bounding box")
                else:
                    print("ERROR: Artwork not found")
                
                if volume:
                    volume_ok = True
                    print("PASS: Volume slider visible")
                else:
                    print("ERROR: Volume slider not found")
                
                test_results["regression_test"] = {
                    "passed": artwork_ok and volume_ok,
                    "artwork_visible": artwork_ok,
                    "volume_visible": volume_ok
                }
                
                await page.screenshot(path=".screenshots/comprehensive_regression.jpg", type="jpeg", quality=40, full_page=False)
            except Exception as e:
                print("ERROR: " + str(e))
                test_results["regression_test"] = {"passed": False, "error": str(e)}
            
            # Final summary
            print("\n" + "=" * 70)
            print("FINAL TEST SUMMARY")
            print("=" * 70)
            
            total_viewports = len(test_results["viewport_tests"])
            passed_viewports = sum(1 for vp in test_results["viewport_tests"] if vp.get("all_visible", False))
            
            print("\nViewport Tests: " + str(passed_viewports) + "/" + str(total_viewports) + " PASSED")
            for vp in test_results["viewport_tests"]:
                status = "PASS" if vp.get("all_visible", False) else "FAIL"
                print("  " + status + ": " + vp["viewport"])
            
            text_overflow_pass = test_results.get("text_overflow_test", {}).get("passed", False)
            print("\nText Overflow Test: " + ("PASS" if text_overflow_pass else "FAIL"))
            
            lyrics_tests = test_results.get("lyrics_view_test", {})
            lyrics_pass = all(v.get("passed", False) for v in lyrics_tests.values())
            print("Lyrics View Test: " + ("PASS" if lyrics_pass else "FAIL"))
            
            vinyl_pass = test_results.get("vinyl_mode_test", {}).get("passed", False)
            print("Vinyl Mode Test: " + ("PASS" if vinyl_pass else "FAIL"))
            
            regression_pass = test_results.get("regression_test", {}).get("passed", False)
            print("Regression Test: " + ("PASS" if regression_pass else "FAIL"))
            
            overall_pass = (passed_viewports == total_viewports and text_overflow_pass and 
                          lyrics_pass and vinyl_pass and regression_pass)
            
            print("\n" + "=" * 70)
            if overall_pass:
                print("OVERALL RESULT: ALL TESTS PASSED")
            else:
                print("OVERALL RESULT: SOME TESTS FAILED")
            print("=" * 70)
            
            # Save results to JSON
            with open("/app/test_reports/responsive_test_results.json", "w") as f:
                json.dump(test_results, f, indent=2)
            print("\nDetailed results saved to: /app/test_reports/responsive_test_results.json")
            
        except Exception as e:
            print("\nCRITICAL ERROR: " + str(e))
            await page.screenshot(path=".screenshots/comprehensive_error.jpg", type="jpeg", quality=40, full_page=False)
            sys.exit(1)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
