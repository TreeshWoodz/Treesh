import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            print("Testing 1440x900 viewport specifically")
            
            await page.set_viewport_size({"width": 1440, "height": 900})
            await page.goto("https://melody-boost-3.preview.emergentagent.com", wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(2000)
            
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
            await page.wait_for_timeout(2000)
            
            await page.wait_for_selector("[data-testid='now-playing']", timeout=5000)
            print("Now Playing opened at 1440x900")
            
            # Make sure we're in normal mode (not vinyl)
            await page.wait_for_timeout(1000)
            
            # Check all elements
            elements = [
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
            
            all_pass = True
            for elem_id in elements:
                try:
                    elem = await page.wait_for_selector("[data-testid='" + elem_id + "']", timeout=3000)
                    if elem:
                        box = await elem.bounding_box()
                        if box:
                            bottom = box['y'] + box['height']
                            visible = bottom <= 900
                            if visible:
                                print("  PASS: " + elem_id)
                            else:
                                print("  FAIL: " + elem_id + " clipped")
                                all_pass = False
                        else:
                            print("  ERROR: " + elem_id + " no box")
                            all_pass = False
                    else:
                        print("  ERROR: " + elem_id + " not found")
                        all_pass = False
                except Exception as e:
                    print("  ERROR: " + elem_id + " - " + str(e))
                    all_pass = False
            
            # Check artwork and volume
            artwork = await page.query_selector("[data-testid='now-playing-artwork']")
            volume = await page.query_selector("[data-testid='now-playing-volume-slider']")
            
            if artwork:
                box = await artwork.bounding_box()
                if box:
                    print("  PASS: Artwork visible (width=" + str(round(box['width'], 1)) + "px)")
                else:
                    print("  ERROR: Artwork no box")
            else:
                print("  ERROR: Artwork not found")
            
            if volume:
                print("  PASS: Volume slider visible")
            else:
                print("  ERROR: Volume slider not found")
            
            await page.screenshot(path=".screenshots/verify_1440x900.jpg", type="jpeg", quality=40)
            
            if all_pass and artwork and volume:
                print("\nRESULT: 1440x900 PASS - All elements visible")
            else:
                print("\nRESULT: 1440x900 FAIL - Some elements missing")
            
        except Exception as e:
            print("ERROR: " + str(e))
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
