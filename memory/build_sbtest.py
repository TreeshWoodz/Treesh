s=open('/app/single_html/index.html',encoding='utf-8').read()
m=open('/app/memory/sb_mock.js',encoding='utf-8').read()
tag='<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
import re
assert s.count(tag)==1 and len(re.findall(r"const SB_KEY='[^']*';",s))==1
s=s.replace(tag,'<script>'+m+'</script>'); s=re.sub(r"const SB_KEY='[^']*';","const SB_KEY='sb_publishable_TEST';",s)
open('/app/single_html/_sbtest.html','w',encoding='utf-8').write(s); print('built')
