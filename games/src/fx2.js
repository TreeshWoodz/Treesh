/* ===================== FX 2 — juicier motion for every mode =====================
   · landing dust puffs + squash scaled by impact speed
   · speed streaks behind fast-flung fleas
   · soft impact ring when two fleas bonk into each other */
var FreaFx2=(function(){
  var TAU=Math.PI*2,rings=[];
  function lite(){return typeof perfMode!=='undefined'&&perfMode;}
  var _up=Flea.prototype.update;
  Flea.prototype.update=function(dt){var was=this.stuck,sp=Math.hypot(this.vx||0,this.vy||0);var r=_up.apply(this,arguments);
    if(!was&&this.stuck&&!this.hidden&&sp>3.2&&STATE==='play'){var k=Math.min(1,(sp-3)/12),n=lite()?3:Math.round(5+k*9),a=this.angle||0,fx=this.cx-Math.sin(a)*this.h*.5,fy=this.cy+Math.cos(a)*this.h*.5;
      for(var i=0;i<n;i++){var side=i%2?1:-1,ang=a+(side>0?0:Math.PI)+(Math.random()-.5)*.6,v=1+Math.random()*2.6*k+.6;parts.push({x:fx,y:fy,vx:Math.cos(ang)*v,vy:Math.sin(ang)*v*.4-Math.random()*1.2,l:.7+Math.random()*.3,r:2+Math.random()*3*(1+k),c:i%3?'rgba(255,255,255,.55)':'rgba(220,214,255,.5)'});}
      this.sq=Math.min(this.sq||1,1-.28*k);}
    return r;};
  var _de=drawEmotes;drawEmotes=function(){var r=_de.apply(this,arguments);if(STATE!=='play'&&STATE!=='countdown')return r;try{
      if(!lite())for(var i=0;i<fleas.length;i++){var f=fleas[i];if(f.hidden||f.stuck)continue;var sp=Math.hypot(f.vx||0,f.vy||0);if(sp<8.5)continue;var ux=f.vx/sp,uy=f.vy/sp,x=f.cx-camera.x,y=f.cy-camera.y,al=Math.min(.5,(sp-8)/14);
        ctx.save();ctx.lineCap='round';for(var s=-1;s<=1;s++){var ox=-uy*s*f.w*.32,oy=ux*s*f.w*.32,len=f.w*(1.2+Math.min(2,sp/10))*(s?0.7:1);var g=ctx.createLinearGradient(x+ox-ux*f.w*.5,y+oy-uy*f.w*.5,x+ox-ux*len,y+oy-uy*len);g.addColorStop(0,'rgba(255,255,255,'+al+')');g.addColorStop(1,'rgba(255,255,255,0)');ctx.strokeStyle=g;ctx.lineWidth=s?1.6:2.4;ctx.beginPath();ctx.moveTo(x+ox-ux*f.w*.5,y+oy-uy*f.w*.5);ctx.lineTo(x+ox-ux*len,y+oy-uy*len);ctx.stroke();}ctx.restore();}
      /* flea-on-flea bonk rings */
      if(Math.random()<.5)for(var a=0;a<fleas.length;a++)for(var b=a+1;b<fleas.length;b++){var A=fleas[a],B=fleas[b];if(A.hidden||B.hidden)continue;var d=Math.hypot(A.cx-B.cx,A.cy-B.cy);if(d<(A.w+B.w)*.42&&Math.hypot((A.vx||0)-(B.vx||0),(A.vy||0)-(B.vy||0))>7&&!(A._bonk>performance.now())){A._bonk=B._bonk=performance.now()+500;rings.push({x:(A.cx+B.cx)/2,y:(A.cy+B.cy)/2,t:performance.now(),c:A.col||'#fff'});}}
      rings=rings.filter(function(q){var k=(performance.now()-q.t)/380;if(k>=1)return false;ctx.save();ctx.globalAlpha=(1-k)*.8;ctx.strokeStyle=q.c;ctx.lineWidth=3*(1-k)+1;ctx.beginPath();ctx.arc(q.x-camera.x,q.y-camera.y,8+k*34,0,TAU);ctx.stroke();ctx.restore();return true;});
    }catch(e){}return r;};
  return {rings:function(){return rings.length;}};
})();
window.FreaFx2=FreaFx2;
