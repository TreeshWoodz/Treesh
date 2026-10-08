import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/lib/chromium/chromium', args=['--autoplay-policy=no-user-gesture-required'])
        pg=await b.new_page(viewport={'width':1440,'height':900})
        await pg.add_init_script("localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-03-14'}));")
        await pg.goto('http://localhost:3000/'); await pg.wait_for_timeout(4000)
        r=await pg.evaluate("""()=>{ const S=SONGS.filter(s=>!s._user); const s=S[0]; const keys=Object.keys(s); const withLy=S.filter(x=>x.lyrics&&x.lyrics.length).length; const lk=S.find(x=>x.lyrics&&x.lyrics.length); return {n:S.length, keys, withLy, sample: lk?{id:lk.id,title:lk.title,ly:JSON.stringify(lk.lyrics).slice(0,300)}:null, ids:S.slice(0,14).map(x=>x.id)}; }""")
        print(json.dumps(r,indent=1))
        await pg.screenshot(path='/tmp/probe.png')
        await b.close()
asyncio.run(main())
