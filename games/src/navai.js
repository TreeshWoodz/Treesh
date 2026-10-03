/* ===================== FREA! PLUS — NAV AI (route planning + CPU skill) =====================
   CPU fleas now plan multi-hop routes across platforms (Dijkstra over a hop graph built from
   platform tops + floor samples). Any far/unreachable target from any mode is converted into
   the next hop on the best route. CPU Skill (Easy/Normal/Pro, in every mode's settings) scales
   decision speed, aim error and route look-ahead. */
(function(){
  var G={t:0,n:-1,nodes:[]};
  var SKIP={hoops:1,hns:1,zen:1,tutorial:1,copycat:1,treasure:1};
  function skill(){try{return FreaModeSettings.skill();}catch(e){return 'normal';}}
  function graph(){var now=Date.now();if(now-G.t<450&&G.n===platforms.length)return G.nodes;var N=[];
    for(var x=50;x<WORLD_W-50;x+=200)N.push({x:x,y:WORLD_H-60-14,p:platforms[0],fl:1});
    for(var i=3;i<platforms.length;i++){var p=platforms[i];if(!p||p.wall||p.gone||p.sinking||p.crumbT||p._ccPerch||p.bw>=WORLD_W*0.6||p.bw<26)continue;if(p.deco&&p.kind==='circle')continue;
      var tp=p.topPoint();N.push({x:tp.x,y:tp.y-14,p:p});if(p.bw>150){N.push({x:p.bx+24,y:tp.y-14,p:p});N.push({x:p.bx+p.bw-24,y:tp.y-14,p:p});}}
    G={t:now,n:platforms.length,nodes:N};return N;}
  function reach(ax,ay,bx,by){var dx=Math.abs(bx-ax),dy=by-ay;return dx<390&&dy>-320&&Math.hypot(dx,dy)<500;}
  /* a straight hop is blocked if a platform sits squarely between (simple ceiling test) */
  function blocked(ax,ay,bx,by){if(by>ay-40)return false;var mx=(ax+bx)/2;for(var i=3;i<platforms.length;i++){var p=platforms[i];if(p.wall||p.deco)continue;if(mx>p.bx-6&&mx<p.bx+p.bw+6&&p.by<ay-30&&p.by+p.bh>by+20&&p.bw<WORLD_W*0.6)return true;}return false;}
  function route(f,gx,gy){var N=graph(),n=N.length;if(n<2)return null;var s=-1,sd=1e9,g=-1,gd=1e9;
    for(var i=0;i<n;i++){var a=N[i];var d=(f.platform&&a.p===f.platform)?Math.abs(a.x-f.cx)*0.2:Math.hypot(a.x-f.cx,a.y-f.cy);if(d<sd){sd=d;s=i;}var e=Math.hypot(a.x-gx,a.y-gy);if(e<gd){gd=e;g=i;}}
    if(s<0||g<0||s===g)return null;
    var dist=new Array(n),prev=new Array(n),done=new Array(n);for(i=0;i<n;i++){dist[i]=1e12;prev[i]=-1;done[i]=false;}dist[s]=0;
    for(var it=0;it<n;it++){var u=-1,ud=1e12;for(i=0;i<n;i++)if(!done[i]&&dist[i]<ud){ud=dist[i];u=i;}if(u<0||u===g)break;done[u]=true;var A=N[u];
      for(var v=0;v<n;v++){if(done[v]||v===u)continue;var B=N[v];var same=A.p===B.p;if(!same&&!reach(A.x,A.y,B.x,B.y))continue;if(!same&&blocked(A.x,A.y,B.x,B.y))continue;
        var c=Math.hypot(B.x-A.x,B.y-A.y)+(same?0:70)+Math.max(0,A.y-B.y)*0.4;if(ud+c<dist[v]){dist[v]=ud+c;prev[v]=u;}}}
    if(prev[g]<0)return null;var path=[g];while(path[0]!==s&&prev[path[0]]>=0)path.unshift(prev[path[0]]);
    /* look ahead: jump to the furthest node on the path we can reach directly */
    var look=skill()==='pro'?4:(skill()==='easy'?1:2),pick=path[1]!=null?path[1]:g;
    for(var k=Math.min(path.length-1,look);k>=1;k--){var P=N[path[k]];if(reach(f.cx,f.cy,P.x,P.y)&&!blocked(f.cx,f.cy,P.x,P.y)){pick=path[k];break;}}
    var q=N[pick];return {x:q.x,y:q.y,_route:true};}
  var _st=stepTarget;
  stepTarget=function(f,gx,gy){if(SKIP[gameMode])return _st(f,gx,gy);
    if(Math.hypot(gx-f.cx,gy-f.cy)<200||(reach(f.cx,f.cy,gx,gy)&&!blocked(f.cx,f.cy,gx,gy)))return {x:gx,y:gy};
    var r=null;try{r=route(f,gx,gy);}catch(e){}return r||_st(f,gx,gy);};
  /* upgrade raw far targets from every mode into routed hops */
  var _at=aiTarget;
  aiTarget=function(f){var t=_at(f);if(!t||SKIP[gameMode]||t.flee||t._route)return t;
    try{if(!(reach(f.cx,f.cy,t.x,t.y)&&!blocked(f.cx,f.cy,t.x,t.y))&&Math.hypot(t.x-f.cx,t.y-f.cy)>200){var r=route(f,t.x,t.y);if(r){r.chase=t.chase;r.grab=t.grab;f._lastT=r;return r;}}}catch(e){}
    if(skill()==='easy'&&Math.random()<0.18){t={x:t.x+(Math.random()-.5)*160,y:t.y+(Math.random()-.5)*60,chase:t.chase};}
    return t;};
  /* decision cadence by skill */
  var _up=Flea.prototype.aiUpdate;
  Flea.prototype.aiUpdate=function(dt){var b=this.ait;_up.call(this,dt);if(this.isP||gameMode==='zen'||STATE!=='play')return;
    if(this.ait>b){var s=skill();if(s==='easy')this.ait=Math.round(this.ait*1.7+8);else if(s==='pro')this.ait=Math.max(6,Math.round(this.ait*0.7));}};
  window.FreaNavAI={route:route,graph:graph};
})();
