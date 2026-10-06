/* Treesh accounts (Supabase). The publishable key is browser-safe; Row Level Security protects each profile. */
const SB_URL='https://oslzgpirzyrlwplejnqg.supabase.co';
const SB_KEY='YOUR_SB_PUBLISHABLE_KEY';
const SB_CB=(function(){ const h=location.hash.replace(/^#\/?/,''); if(!/(^|&)(access_token|error_description|error_code)=/.test(h)) return null; const p={}; new URLSearchParams(h).forEach(function(v,k){ p[k]=v; }); try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){} return p; })();
const sb=(function(){ try{ if(!window.supabase||!SB_KEY||SB_KEY==='YOUR_SB_PUBLISHABLE_KEY') return null; return window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}); }catch(e){ console.warn('Supabase',e); return null; } })();
