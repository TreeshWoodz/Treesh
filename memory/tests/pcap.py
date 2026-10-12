import asyncio, sys, json, os
from playwright.async_api import async_playwright
sys.path.insert(0, '/app/memory/tests')
from light_audit import EXE  # noqa
# python3 pcap.py m|d light|dark -> /tmp/pcap/<vp>_<theme>_<pane>.jpg  (Photocap editor panes on a blank canvas)
VP = sys.argv[1] if len(sys.argv) > 1 else 'm'; TH = sys.argv[2] if len(sys.argv) > 2 else 'light'
OUT = '/tmp/pcap'; os.makedirs(OUT, exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**(dict(p.devices['iPhone 13']) if VP == 'm' else {'viewport': {'width': 1400, 'height': 860}}))
        await ctx.add_init_script("localStorage.setItem('treesh_theme',JSON.stringify('%s')); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_icon_note_7255','true'); localStorage.setItem('treesh_push',JSON.stringify({asked:true})); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));" % TH)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(3000)
        await pg.evaluate("openCoverStudio(SONGS[2].coverArt,'Photocap',true,{aspect:1,out:[1024,1024],q:.92,title:'Photocap',onApply:()=>{}})"); await pg.wait_for_timeout(1800)
        print('root', await pg.evaluate("(()=>{const r=document.querySelector('.ps-root'); return r?[r.className, getComputedStyle(r).backgroundColor]:null})()"))
        for t in ['crop', 'adjust', 'filters', 'text', 'stickers', 'draw', 'layers']:
            await pg.evaluate(f"psTool('{t}')"); await pg.wait_for_timeout(700)
            if t == 'text':
                await pg.evaluate("(()=>{ const b=document.querySelector('#cv-layer-panel [data-act=\"cv-add-text\"], #cv-layer-panel button'); if(b) b.click(); })()"); await pg.wait_for_timeout(600)
            info = await pg.evaluate("""(()=>{ const rows=[...document.querySelectorAll('#ps-panel .ps-inks, #ps-panel [class*="cols"], #ps-panel [class*="swatch"]')].map(r=>{ const kids=[...r.children]; const tops=new Set(kids.map(k=>Math.round(k.getBoundingClientRect().top))); return r.className.split(' ')[0]+':'+kids.length+'items/'+tops.size+'rows'; }); return rows; })()""")
            print(t, info)
            await pg.screenshot(path=f'{OUT}/{VP}_{TH}_{t}.jpg', quality=45)
        print('errors', errs[:4])
        await b.close()
asyncio.run(main())
