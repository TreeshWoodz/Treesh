/* TEST ONLY: in-browser fake of supabase-js v2 used by _sbtest.html (never shipped) */
(function(){
  const DBK='__mock_sb_db', SK='__mock_sb_session';
  const db=()=>JSON.parse(localStorage.getItem(DBK)||'{"users":{},"profiles":{},"files":{}}');
  const save=d=>localStorage.setItem(DBK,JSON.stringify(d));
  const off=()=>!!window.__mockOffline;
  const NET={message:'TypeError: Failed to fetch'};
  const subs=[]; const emit=(ev,s)=>subs.forEach(cb=>{ try{ cb(ev,s); }catch(e){ console.error(e); } });
  const sess=()=>JSON.parse(localStorage.getItem(SK)||'null');
  const mk=u=>({access_token:'tok_'+u.id,refresh_token:'ref_'+u.id,user:{id:u.id,email:u.email}});
  window.__mockLog=[];
  const auth={
    onAuthStateChange(cb){ subs.push(cb); setTimeout(()=>cb('INITIAL_SESSION',sess()),0); return {data:{subscription:{unsubscribe(){}}}}; },
    async signInWithPassword({email,password}){ window.__mockLog.push('signin:'+email); if(off()) return {data:{},error:NET}; const u=db().users[email]; if(!u||u.password!==password) return {data:{},error:{message:'Invalid login credentials',status:400}}; if(!u.confirmed) return {data:{},error:{message:'Email not confirmed'}}; const s=mk(u); localStorage.setItem(SK,JSON.stringify(s)); setTimeout(()=>emit('SIGNED_IN',s),0); return {data:{session:s,user:s.user},error:null}; },
    async signUp({email,password,options}){ window.__mockLog.push('signup:'+email+':'+((options||{}).emailRedirectTo||'')); if(off()) return {data:{},error:NET}; const d=db(); if(d.users[email]) return {data:{user:{id:'x'},session:null},error:null}; const u={id:'u'+Math.random().toString(36).slice(2,10),email,password,confirmed:!!d.autoConfirm}; d.users[email]=u; save(d); if(!u.confirmed) return {data:{user:{id:u.id,email},session:null},error:null}; const s=mk(u); localStorage.setItem(SK,JSON.stringify(s)); setTimeout(()=>emit('SIGNED_IN',s),0); return {data:{user:s.user,session:s},error:null}; },
    async signOut(){ localStorage.removeItem(SK); setTimeout(()=>emit('SIGNED_OUT',null),0); return {error:null}; },
    async resetPasswordForEmail(email,o){ window.__mockLog.push('reset:'+email+':'+((o||{}).redirectTo||'')); return {data:{},error:null}; },
    async updateUser({password}){ const s=sess(); if(!s) return {error:{message:'Auth session missing!'}}; const d=db(); const u=Object.values(d.users).find(x=>x.id===s.user.id); u.password=password; save(d); return {data:{user:s.user},error:null}; },
    async setSession({access_token}){ const d=db(); const u=Object.values(d.users).find(x=>'tok_'+x.id===access_token); if(!u) return {error:{message:'Invalid token'}}; u.confirmed=true; save(d); const s=mk(u); localStorage.setItem(SK,JSON.stringify(s)); setTimeout(()=>emit('SIGNED_IN',s),0); return {data:{session:s},error:null}; },
    async getUser(){ const s=sess(); return {data:{user:s?s.user:null}}; }
  };
  const from=table=>({
    select(cols){ const q={ _k:null,_id:null, eq(k,v){ q._k=k; q._id=v; return q; }, async maybeSingle(){ window.__mockLog.push('select:'+table+':'+(cols||'*')+':'+q._id); if(off()) return {data:null,error:NET}; const s=sess(); if(!s||s.user.id!==q._id) return {data:null,error:null}; const d=db(); const row=table==='user_data'?((d.user_data||{})[q._id]||null):(d.profiles[q._id]||null); if(row&&table==='user_data'&&cols==='updated_at') return {data:{updated_at:row.updated_at},error:null}; return {data:row,error:null}; } }; return q; },
    async upsert(row){ if(table==='user_data'){ window.__mockLog.push('upsert:user_data:'+Object.keys((row.data&&row.data.localStorage)||{}).length+':'+((row.data&&row.data.media)?'media':'nomedia')); if(off()) return {error:NET}; const s=sess(); if(!s||s.user.id!==row.user_id) return {error:{code:'42501',message:'new row violates row-level security policy for table "user_data"'}}; const d=db(); d.user_data=d.user_data||{}; d.user_data[row.user_id]=row; save(d); return {error:null}; }
      window.__mockLog.push('upsert:'+JSON.stringify(Object.assign({},row,{avatar_url:row.avatar_url?String(row.avatar_url).slice(0,60):row.avatar_url}))); if(off()) return {error:NET}; const s=sess(); if(!s||s.user.id!==row.id) return {error:{code:'42501',message:'new row violates row-level security policy for table "profiles"'}}; const d=db();
      if(row.username&&Object.values(d.profiles).some(p=>p.id!==row.id&&p.username===row.username)) return {error:{code:'23505',message:'duplicate key value violates unique constraint "profiles_username_key"',details:'Key (username)=('+row.username+') already exists.'}};
      d.profiles[row.id]=Object.assign({created_at:(d.profiles[row.id]||{}).created_at||new Date().toISOString()},row); save(d); return {error:null}; }
  });
  const storage={ from:b=>({ async upload(path,blob,o){ window.__mockLog.push('upload:'+b+'/'+path+':'+((blob&&blob.type)||(o&&o.contentType))+':'+!!(o&&o.upsert)); if(off()) return {error:NET}; const d=db(); if(d.noBucket) return {error:{message:'Bucket not found'}}; d.files[path]=blob&&(blob.size||blob.byteLength); if(o&&o.contentType==='application/json'&&blob&&blob.byteLength!=null){ d.texts=d.texts||{}; d.texts[path]=new TextDecoder().decode(blob); } save(d); return {data:{path},error:null}; },
    async download(path){ window.__mockLog.push('download:'+b+'/'+path); if(off()) return {data:null,error:NET}; const d=db(); return {data:new Blob([(d.texts&&d.texts[path])||'[]'],{type:'application/json'}),error:null}; }, getPublicUrl(path){ return {data:{publicUrl:location.origin+'/treesh_logo.png#'+b+'/'+path}}; } }) };
  window.supabase={ createClient(url,key,opts){ window.__mockLog.push('create:'+url+':'+key+':'+JSON.stringify(opts||{})); return {auth,from,storage}; } };
})();
