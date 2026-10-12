import asyncio, sys
from playwright.async_api import async_playwright
# Voice mic regression: mock SpeechRecognition that (like iOS/Android) hangs when an instance is reused; Type/Tips clickable over the orb.
EXE="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
MOCK = r"""
window.__sr={made:0,starts:0,live:null};
class FakeSR{ constructor(){ this.used=false; this.on=false; __sr.made++; }
  start(){ if(this.on) { const e=new Error('already'); e.name='InvalidStateError'; throw e; } this.on=true; __sr.starts++; const reuse=this.used; this.used=true; __sr.live=this;
    setTimeout(()=>{ this.onstart&&this.onstart({}); if(!reuse) setTimeout(()=>{ this.onaudiostart&&this.onaudiostart({}); },50); },40); }
  abort(){ if(!this.on) return; this.on=false; setTimeout(()=>{ this.onerror&&this.onerror({error:'aborted'}); this.onend&&this.onend({}); },20); }
  stop(){ this.abort(); }
  say(t){ const r=[{0:{transcript:t},isFinal:true,length:1}]; this.onresult&&this.onresult({results:r}); }
}
FakeSR.prototype.onaudiostart=null;
window.webkitSpeechRecognition=FakeSR; window.SpeechRecognition=FakeSR;
"""
async def main():
  vp=sys.argv[1] if len(sys.argv)>1 else 'm'; fails=0
  def ck(n,c,info=''):
    nonlocal fails; print(('PASS ' if c else 'FAIL ')+n,info); fails+=0 if c else 1
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=EXE)
    W,H=(1440,900) if vp=='d' else (390,844)
    ctx=await b.new_context(viewport={'width':W,'height':H},has_touch=(vp=='m'),is_mobile=(vp=='m'))
    await ctx.add_init_script("if(!sessionStorage.getItem('__s')){sessionStorage.setItem('__s','1');localStorage.clear();localStorage.setItem('treesh_whatsnew_off','true');localStorage.setItem('treesh_eco_ask','1');localStorage.setItem('treesh_push',JSON.stringify({asked:true}));localStorage.setItem('treesh_profile',JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}));}")
    await ctx.add_init_script(MOCK)
    pg=await ctx.new_page(); await pg.goto('http://localhost:3000/_sbtest.html'); await pg.wait_for_timeout(3000)
    await pg.click('[data-testid=voice-mic-button]'); await pg.wait_for_timeout(1300)
    for tid in ['voice-type-toggle','voice-tips-toggle']:
      hit=await pg.evaluate("(t)=>{ const b=document.querySelector('[data-testid='+t+']'); if(!b) return 'missing'; const r=b.getBoundingClientRect(); const top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); return b.contains(top)?'ok':(top&&top.className)+''; }",tid)
      ck(tid+' not covered by orb',hit=='ok',hit)
    await pg.click('[data-testid=voice-tips-toggle]'); await pg.wait_for_timeout(500)
    ck('tips opens',await pg.evaluate("_vxTips===true"))
    await pg.click('[data-testid=voice-tips-toggle]'); await pg.wait_for_timeout(400)
    await pg.click('[data-testid=voice-type-toggle]'); await pg.wait_for_timeout(500)
    ck('keyboard opens type row',await pg.evaluate("!!document.querySelector('#voice-input')"))
    await pg.click('[data-testid=voice-type-toggle]'); await pg.wait_for_timeout(400)
    ck('listening on open',await pg.evaluate("listening&&_voiceMode==='listening'&&__sr.live&&__sr.live.on"))
    await pg.evaluate("__sr.live.say('volume down')"); await pg.wait_for_timeout(1200)
    ck('command handled',await pg.evaluate("(_voiceLast&&_voiceLast.user||'').indexOf('volume')>=0"), await pg.evaluate("JSON.stringify(_voiceLast)"))
    ck('mic off after command',await pg.evaluate("!listening"))
    for i in range(3):
      made=await pg.evaluate("__sr.made")
      orb=await pg.query_selector('#voice-ov .vx3-orbwrap') if await pg.evaluate("document.getElementById('voice-ov').classList.contains('is-mini')") else await pg.query_selector('[data-testid=voice-listening-orb]')
      await orb.click(); await pg.wait_for_timeout(700)
      ok=await pg.evaluate("listening&&_voiceMode==='listening'&&__sr.live&&__sr.live.on&&!!__sr.live.onaudiostart")
      ck(f'tap #{i+1} listens again on a fresh recognizer',ok and await pg.evaluate("__sr.made")>made, await pg.evaluate("JSON.stringify({m:__sr.made,s:__sr.starts,mode:_voiceMode,l:listening})"))
      await pg.evaluate("__sr.live.say('next song')"); await pg.wait_for_timeout(1200)
      ck(f'command #{i+2} handled',await pg.evaluate("(_voiceLast&&_voiceLast.user||'')==='next song'"))
    # hang watchdog: reused-instance style hang (onstart but no audio) recovers via retry
    await pg.evaluate("""()=>{ const P=webkitSpeechRecognition.prototype, st=P.start; let n=0; P.start=function(){ n++; if(n===1){ this.used=true; } return st.call(this); }; }""")
    orb=await pg.query_selector('#voice-ov .vx3-orbwrap') if await pg.evaluate("document.getElementById('voice-ov').classList.contains('is-mini')") else await pg.query_selector('[data-testid=voice-listening-orb]')
    s0=await pg.evaluate("__sr.starts"); await orb.click(); await pg.wait_for_timeout(3600)
    ck('hung start is retried and recovers',await pg.evaluate("__sr.starts")>=s0+2 and await pg.evaluate("listening&&__sr.live.on"), await pg.evaluate("JSON.stringify({s:__sr.starts,mode:_voiceMode,l:listening})"))
    await pg.click('[data-testid=voice-close-button]'); await pg.wait_for_timeout(500)
    ck('close turns mic off',await pg.evaluate("!listening&&!document.getElementById('voice-ov')&&recog===null"))
    await pg.click('[data-testid=voice-mic-button]'); await pg.wait_for_timeout(900)
    ck('reopen listens',await pg.evaluate("listening&&__sr.live&&__sr.live.on"))
    await pg.screenshot(path=f'/tmp/is/vxmic_{vp}.jpg',quality=40,type='jpeg')
    await b.close()
  print('FAILS',fails)
asyncio.run(main())
