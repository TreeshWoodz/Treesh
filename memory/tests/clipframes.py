import asyncio, base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"); pg=await b.new_page()
        await pg.goto('http://localhost:3000/terms.html', wait_until='domcontentloaded')
        await pg.evaluate("()=>{ document.body.innerHTML='<video id=v src=\"/_clip_test.mp4\" muted preload=auto></video><canvas id=c width=1080 height=1920></canvas>'; }")
        await pg.wait_for_function("()=>document.getElementById('v').readyState>=2", timeout=10000)
        await pg.evaluate("()=>{ const v=document.getElementById('v'); v.play(); }")
        for t in [2,7,13]:
            await pg.wait_for_function(f"()=>document.getElementById('v').currentTime>={t}", timeout=20000)
            d = await pg.evaluate("""()=>{ const v=document.getElementById('v'); const c=document.getElementById('c'); c.getContext('2d').drawImage(v,0,0,1080,1920); return c.toDataURL('image/jpeg',.6); }""")
            open(f'/tmp/clipf_{t}.jpg','wb').write(base64.b64decode(d.split(',')[1]))
        print(await pg.evaluate("()=>{const v=document.getElementById('v'); return [v.duration, v.videoWidth, v.videoHeight, v.mozHasAudio, v.webkitAudioDecodedByteCount]}"))
        await b.close()
asyncio.run(main())
