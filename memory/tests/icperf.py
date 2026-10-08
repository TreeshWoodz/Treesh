import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"); pg=await b.new_page(viewport={'width':390,'height':844})
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_function("()=>!!window.lucide",timeout=20000); await pg.wait_for_timeout(1500)
        print(await pg.evaluate("""()=>{ try{ const all=[...document.querySelectorAll('[data-lucide]')]; const svg=all.filter(e=>e.tagName.toLowerCase()==='svg').length; let t=performance.now(); for(let i=0;i<10;i++) lucide.createIcons(); const dt=(performance.now()-t)/10; t=performance.now(); for(let i=0;i<10;i++) icons(); const dt2=(performance.now()-t)/10; return {n:all.length, svg, createIcons_ms:dt.toFixed(2), icons_ms:dt2.toFixed(2), dom:document.getElementsByTagName('*').length, v:(window.lucide&&lucide.version)||'' }; }catch(e){ return 'ERR '+e.message+' lucide='+typeof window.lucide; } }"""))
        await b.close()
asyncio.run(main())
