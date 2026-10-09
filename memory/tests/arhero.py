import asyncio, sys, json
from playwright.async_api import async_playwright
EXE='/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell'
MOB=len(sys.argv)>1 and sys.argv[1]=='m'
S='''() => { const h=document.querySelector('[data-testid="artist-hero"]'); if(!h) return 'no hero'; const bg=h.querySelector('.ar-hero-bg'), im=bg&&bg.querySelector('.ar-hero-photo'); const r=e=>{const b=e.getBoundingClientRect(); return [Math.round(b.left),Math.round(b.top),Math.round(b.width),Math.round(b.height)];};
 const cs=im?getComputedStyle(im):null; return {hero:r(h),bg:r(bg),img:im?r(im):null,nat:im?[im.naturalWidth,im.naturalHeight]:null,pos:cs&&cs.objectPosition,fit:cs&&cs.objectFit,h:cs&&cs.height,tr:cs&&cs.transform,bgtr:getComputedStyle(bg).transform,cls:h.className,fit2:bg.dataset.fit,shown:bg.dataset.shown,pm:bg.dataset.posM,src:im&&im.currentSrc.slice(0,90)}; }'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=EXE,args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':390,'height':664} if MOB else {'width':1400,'height':850},device_scale_factor=1,has_touch=MOB,is_mobile=MOB)
        pg=await ctx.new_page()
        await pg.add_init_script("localStorage.setItem('treesh_whatsnew_off','true');localStorage.setItem('treesh_eco_ask','1');localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));")
        await pg.goto('http://localhost:3000/',wait_until='domcontentloaded'); await pg.wait_for_timeout(5000)
        arts=await pg.evaluate("()=>(ARTISTS||[]).map(a=>[a.id,a.bgPos,!!a.background,(a.background||'').slice(0,60)])")
        print(len(arts)); [print(a) for a in arts[:40]]
        ids=[a[0] for a in arts if a[2]][:6] if len(sys.argv)<3 else [sys.argv[2]]
        for i in ids:
            await pg.evaluate(f"()=>navigate('artist','{i}')"); await pg.wait_for_timeout(1800)
            print(i, json.dumps(await pg.evaluate(S)))
            await pg.screenshot(path=f'/app/memory/tests/arhero_{i}_{"m" if MOB else "d"}.jpg',quality=40,type='jpeg')
        await b.close()
asyncio.run(main())
