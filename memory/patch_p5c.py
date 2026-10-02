P='/app/single_html/index.html'; M='/app/memory/'
s=open(P,encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    c=s.count(old)
    assert c==cnt, ('COUNT',c,old[:120])
    s=s.replace(old,new)
rep("</style>\n</head>", open(M+'p5_ob.css',encoding='utf-8').read()+"</style>\n</head>")
a=s.index('function renderOnboarding(){'); b=s.index('\n/* ---------- Auto lyrics finder',a)
s=s[:a]+open(M+'p5_ob.js',encoding='utf-8').read().rstrip()+'\n'+s[b:]
rep("    case 'mk-qs-eq': qsEq(val); break;","""    case 'mk-qs-eq': qsEq(val); break;
    case 'mk-ob-theme': { const t=GL_THEMES.find(x=>x.id===val); if(!t) break; LS.set('treesh_gl_theme',val); if(t.accent){ state.accent=t.accent; LS.set('treesh_accent',t.accent); applyAccent(t.accent); } glApply(); renderOnboarding(); break; }
    case 'mk-ob-nick': onboard.nick=val; renderOnboarding(); break;""")
rep('case "ob-finish": { state.profile={nickname:onboard.nick.trim()||"Treesh Fan",birthday:onboard.bday,zodiac:zodiac(onboard.bday),avatar:onboard.avatar};','case "ob-finish": { state.profile=Object.assign({},state.profile||{},{nickname:onboard.nick.trim()||"Treesh Fan",birthday:onboard.bday,zodiac:zodiac(onboard.bday),avatar:onboard.avatar}); if(!state.profile.joined) state.profile.joined=Date.now();')
open(P,'w',encoding='utf-8').write(s); print('ok')
