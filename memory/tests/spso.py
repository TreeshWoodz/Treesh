import asyncio, json, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
DB={"users":{"a@test.com":{"id":"ua1","email":"a@test.com","password":"secret123","confirmed":True}},"profiles":{"ua1":{"id":"ua1","username":"alice","display_name":"Alice A"}},"files":{}}
SESS={"access_token":"tok_ua1","refresh_token":"ref_ua1","user":{"id":"ua1","email":"a@test.com"}}
SNAP="()=>{ const p=state.profile||{}; const S=spNorm(p.space); return {nick:p.nickname, theme:S.theme, about:S.about, mood:S.mood.k, layout:S.layout, bg:S.bg.type+'/'+S.bg.local, card:S.card.style, blocks:S.blocks.length, hide:Object.keys(S.hide), font:S.font.h, spaceBg:(state.spaceBg||'').slice(0,22), lsProf:!!localStorage.getItem('treesh_profile'), user:!!sbUser()}; }"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**p.devices['iPhone 13'])
        await ctx.add_init_script("if(!localStorage.getItem('__mock_seeded')){ localStorage.setItem('__mock_seeded','1'); localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'})); localStorage.setItem('__mock_sb_db',%s); localStorage.setItem('__mock_sb_session',%s); }"%(json.dumps(json.dumps(DB)),json.dumps(json.dumps(SESS))))
        pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(5000)
        print('boot', await pg.evaluate(SNAP))
        await pg.evaluate("""async()=>{ const c=document.createElement('canvas'); c.width=40; c.height=30; const g=c.getContext('2d'); g.fillStyle='#f0a'; g.fillRect(0,0,40,30);
          state._spDraft=spNorm({theme:'',bg:{type:'image',local:true},card:{style:'neon'},font:{h:'Lobster'},mood:{k:'happy',t:'great day'},about:'Hello from my space',blocks:[{id:'b1',t:'Hi',x:'block text'}],hide:{meet:true},layout:'center'});
          state._spBgDraft=c.toDataURL('image/jpeg',.8); await spSave(); }""")
        await pg.wait_for_timeout(1500)
        print('saved', await pg.evaluate(SNAP))
        await pg.evaluate("()=>{ sbFlush(); }"); await pg.wait_for_timeout(4000)
        print('cloud', await pg.evaluate("()=>{ const d=JSON.parse(localStorage.getItem('__mock_sb_db')); const ud=(d.user_data||{}); const row=ud.ua1||Object.values(ud)[0]; const pr=row&&row.data&&row.data.localStorage&&row.data.localStorage.treesh_profile; let sp=null; try{ sp=JSON.parse(pr).space; }catch(e){} return {hasRow:!!row, assetsPath:row&&row.data&&row.data.assetsPath, about:sp&&sp.about, files:Object.keys(d.files||{}), meta:sbMeta()}; }"))
        await pg.evaluate("()=>sbSignOut()"); await pg.wait_for_timeout(6000)
        print('signed out', await pg.evaluate(SNAP))
        await pg.evaluate("()=>{ try{ closeModal(); }catch(e){} _sbJustAuthed=true; return sb.auth.signInWithPassword({email:'a@test.com',password:'secret123'}); }")
        await pg.wait_for_timeout(8000)
        print('signed in', await pg.evaluate(SNAP))
        await pg.screenshot(path='/app/memory/tests/spso_after.jpg', quality=30)
        print('errors', errs[:4])
        await b.close()
asyncio.run(main())
