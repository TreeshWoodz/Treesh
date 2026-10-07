import os,asyncio,json
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/root/pw'
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[];pg.on('console',lambda m: errs.append(m.text) if m.type in ('error','warning') else None);pg.on('pageerror',lambda e: errs.append('PE '+str(e)+' '+str(e.stack)[:600]))
        await pg.add_init_script("window.addEventListener('error',function(e){console.error('STK '+(e.error&&e.error.stack))})")
        await pg.goto('http://localhost:3000/games/frea.html');await pg.wait_for_timeout(2500)
        await pg.evaluate("FreaModeSettings.set('hoops','format','timed');FreaModes.start('hoops')");await pg.wait_for_timeout(1400)
        await pg.mouse.click(640,360);await pg.wait_for_timeout(4000)
        r=await pg.evaluate("""new Promise(res=>{var cv=document.getElementById('c'),o=document.createElement('canvas');o.width=64;o.height=36;var x=o.getContext('2d'),out=[],n=0;
          function f(){x.drawImage(cv,0,0,64,36);var d=x.getImageData(0,0,64,36).data,s=0;for(var i=0;i<d.length;i+=4)s+=d[i]+d[i+1]+d[i+2];out.push(Math.round(s/(d.length/4)));
          if(out.length>1&&out[out.length-2]-out[out.length-1]>25&&!window._fl){window._fl=cv.toDataURL('image/jpeg',.5);window._flp=window._prev;}window._prev=cv.toDataURL('image/jpeg',.4);if(++n<300&&!window._fl)requestAnimationFrame(f);else res(out);}requestAnimationFrame(f);})""")
        import base64
        a=await pg.evaluate("[window._fl,window._flp]")
        for i,u in enumerate(a):
            if u:open('fl%d.jpg'%i,'wb').write(base64.b64decode(u.split(',')[1]))
        print(len(r));print('\n'.join(errs[:15]))
        # list big jumps
        j=[(i,r[i-1],r[i]) for i in range(1,len(r)) if abs(r[i]-r[i-1])>25]
        print('jumps',j[:30])
        await b.close()
asyncio.run(main())
