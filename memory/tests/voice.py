import asyncio, sys
from playwright.async_api import async_playwright
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
FAKE = """
window.__sr={starts:0,stops:0,aborts:0,inst:0,live:null};
class FakeSR{ constructor(){ __sr.inst++; this.continuous=false; this.interimResults=true; __sr.live=this; this._on=false; }
  start(){ if(this._on){ const e=new Error('already'); e.name='InvalidStateError'; throw e; } this._on=true; __sr.starts++; setTimeout(()=>this.onstart&&this.onstart(),10); }
  stop(){ __sr.stops++; if(this._on){ this._on=false; setTimeout(()=>this.onend&&this.onend(),10); } }
  abort(){ __sr.aborts++; if(this._on){ this._on=false; setTimeout(()=>{ this.onerror&&this.onerror({error:'aborted'}); this.onend&&this.onend(); },10); } }
  _say(t,fin){ const r=[{0:{transcript:t},isFinal:!!fin,length:1}]; this.onresult&&this.onresult({results:r,resultIndex:0}); }
  _silence(){ this._on=false; this.onerror&&this.onerror({error:'no-speech'}); this.onend&&this.onend(); } }
window.SpeechRecognition=FakeSR; window.webkitSpeechRecognition=FakeSR;
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=EXE)
        ctx = await b.new_context(**p.devices['iPhone 13'])
        await ctx.add_init_script(FAKE)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://localhost:3000/'); await pg.evaluate("()=>{localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_eco_ask','1'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}"); await pg.reload(); await pg.wait_for_timeout(3000)
        S = "()=>({mode:_voiceMode, listening, ov:!!document.getElementById('voice-ov'), mini:!!document.querySelector('#voice-ov.is-mini'), recog:recog===null?'null':typeof recog, sr:Object.assign({},__sr,{live:undefined})})"
        await pg.evaluate("()=>voiceOpen()"); await pg.wait_for_timeout(400); print('open', await pg.evaluate(S))
        await pg.evaluate("()=>__sr.live._say('dark mode',true)"); await pg.wait_for_timeout(1500); print('after final cmd', await pg.evaluate(S))
        await pg.wait_for_timeout(2000); print('2s later (no restart)', await pg.evaluate(S))
        await pg.evaluate("()=>{ const v=document.getElementById('voice-ov'); if(v&&v.classList.contains('is-mini')) vx3Mini(false); }")
        await pg.locator('[data-testid="voice-listening-orb"]').click(force=True); await pg.wait_for_timeout(300); print('orb tap', await pg.evaluate(S))
        await pg.evaluate("()=>__sr.live._say('pause',false)"); await pg.wait_for_timeout(2200); print('interim + silence', await pg.evaluate(S))
        await pg.locator('[data-testid="voice-listening-orb"]').click(force=True); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>__sr.live._silence()"); await pg.wait_for_timeout(1500); print('no-speech', await pg.evaluate(S))
        await pg.locator('[data-testid="voice-close-button"]').click(force=True); await pg.wait_for_timeout(500); print('closed', await pg.evaluate(S))
        await pg.evaluate("()=>voiceOpen()"); await pg.wait_for_timeout(400); print('reopen', await pg.evaluate(S))
        await pg.evaluate("()=>{ Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}); document.dispatchEvent(new Event('visibilitychange')); }"); await pg.wait_for_timeout(500)
        print('hidden', await pg.evaluate(S))
        await pg.evaluate("()=>{ Object.defineProperty(document,'hidden',{configurable:true,get:()=>false}); }")
        await pg.evaluate("()=>voiceOpen()"); await pg.wait_for_timeout(400)
        await pg.evaluate("()=>__sr.live._say('next song',true)"); await pg.wait_for_timeout(1200); print('cmd -> mini?', await pg.evaluate(S))
        await pg.wait_for_timeout(8500); print('pill auto close', await pg.evaluate(S))
        await b.close()
asyncio.run(main())
