s=open('/app/single_html/index.html',encoding='utf-8').read()
m=open('/app/memory/sb_mock.js',encoding='utf-8').read()
tag='<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
assert s.count(tag)==1 and s.count("const SB_KEY='YOUR_SB_PUBLISHABLE_KEY';")==1
s=s.replace(tag,'<script>'+m+'</script>').replace("const SB_KEY='YOUR_SB_PUBLISHABLE_KEY';","const SB_KEY='sb_publishable_TEST';")
open('/app/single_html/_sbtest.html','w',encoding='utf-8').write(s); print('built')
