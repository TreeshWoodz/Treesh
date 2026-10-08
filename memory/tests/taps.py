import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
SEED="()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"
SYN="""(sel)=>{ const el=document.querySelector(sel); if(!el) return 'missing'; const r=el.getBoundingClientRect(); const x=r.left+r.width/2, y=r.top+r.height/2;
  const t=new Touch({identifier:7,target:el,clientX:x,clientY:y}); el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[t],targetTouches:[t],changedTouches:[t]}));
  el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],targetTouches:[],changedTouches:[t]})); return 'ok'; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(**p.devices['iPhone 13'])
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate(SEED); await pg.reload(); await pg.wait_for_timeout(3500)
        # 1 swallowed tap gets rescued
        await pg.evaluate("()=>openGameInfo('chainz')"); await pg.wait_for_timeout(700)
        print('syn', await pg.evaluate(SYN, '[data-testid="game-info-close"]'))
        await pg.wait_for_timeout(250); print('modal at 250ms (should still be open):', await pg.evaluate("()=>document.getElementById('modal').childElementCount"))
        await pg.wait_for_timeout(400); print('modal at 650ms (rescued -> 0):', await pg.evaluate("()=>document.getElementById('modal').childElementCount"))
        # 2 real tap fires exactly once
        await pg.evaluate("()=>{ const s=SONG_BY_ID['chelly-banqz-shake-it-some-mo']; playSong(s,[s]); }"); await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{ window.__n=0; document.addEventListener('click',e=>{ if(e.target.closest('[data-act=\"toggle-play\"]')) window.__n++; }); }")
        p0 = await pg.evaluate("()=>audio.paused")
        await pg.locator('#mini [data-act="toggle-play"]').tap(); await pg.wait_for_timeout(1000)
        print('real tap clicks:', await pg.evaluate("()=>window.__n"), 'paused before/after', p0, await pg.evaluate("()=>audio.paused"))
        # 3 scroll lock: open + close a modal by tap, body unlocks
        await pg.locator('[data-testid="nav-mobile-game"]').tap(); await pg.wait_for_timeout(1200)
        await pg.locator('[data-testid="game-open-chainz"]').tap(); await pg.wait_for_timeout(900)
        print('game info open (tap 1):', await pg.evaluate("()=>document.getElementById('modal').childElementCount"), 'locked', await pg.evaluate("()=>document.body.style.position"))
        await pg.locator('[data-testid="game-info-close"]').tap(); await pg.wait_for_timeout(900)
        print('closed (tap 1):', await pg.evaluate("()=>document.getElementById('modal').childElementCount"), 'body pos', repr(await pg.evaluate("()=>document.body.style.position")))
        # 4 game frame open+close
        await pg.evaluate("()=>openGameFrame('chainz')"); await pg.wait_for_timeout(1200)
        print('frame locked', repr(await pg.evaluate("()=>document.body.style.position")))
        await pg.locator('[data-testid="game-frame-close"]').tap(); await pg.wait_for_timeout(900)
        print('frame closed', await pg.evaluate("()=>!state.gameFrame"), 'body pos', repr(await pg.evaluate("()=>document.body.style.position")))
        # 5 stuck lock self-heals without a touch
        await pg.evaluate("()=>{ _locked=true; document.body.style.position='fixed'; }"); await pg.wait_for_timeout(1200)
        print('stuck lock healed', repr(await pg.evaluate("()=>document.body.style.position")))
        # 6 profile sheet origin on phone
        await pg.locator('[data-testid="nav-mobile-profile"]').tap(); await pg.wait_for_timeout(60)
        print('profile', await pg.evaluate("()=>{ const p=document.getElementById('profile-panel'); if(!p) return 'none'; const cs=getComputedStyle(p); const b=document.querySelector('[data-testid=\"nav-mobile-profile\"]').getBoundingClientRect(); return {origin:cs.transformOrigin, anim:cs.animationName, panelTop:p.offsetTop, panelLeft:p.offsetLeft, btn:[b.left+b.width/2,b.top+b.height/2]}; }"))
        await pg.wait_for_timeout(120); await pg.screenshot(path='/tmp/pf_mid.png')
        await b.close()
asyncio.run(main())
