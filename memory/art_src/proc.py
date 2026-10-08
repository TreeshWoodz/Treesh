import numpy as np, json, base64, sys
from PIL import Image, ImageDraw
exec(open('/app/memory/art_src/key.py').read().split('for n in')[0])
D='/app/memory/art_src/'
def logo(src,out):
    im=Image.open(D+src).convert('RGB'); a=np.asarray(im).astype(int)
    c=a[3,3]; diff=np.abs(a-c).sum(axis=2); mask=diff>60
    ys,xs=np.where(mask); x0,x1=np.percentile(xs,0.3),np.percentile(xs,99.7); y0,y1=np.percentile(ys,0.3),np.percentile(ys,99.7)
    box=(int(x0),int(y0),int(x1)+1,int(y1)+1)
    cr=im.crop(box); cw,ch=cr.size; S=4; m=Image.new('L',(cw*S,ch*S),0); ImageDraw.Draw(m).rounded_rectangle((0,0,cw*S,ch*S),radius=int(min(cw,ch)*0.2*S),fill=255)
    m=m.resize((cw,ch),Image.LANCZOS); cr=cr.convert('RGBA'); cr.putalpha(m)
    side=max(cw,ch); o=Image.new('RGBA',(side,side),(0,0,0,0)); o.paste(cr,((side-cw)//2,(side-ch)//2),cr)
    o=o.resize((256,256),Image.LANCZOS); o.save(D+out,'WEBP',quality=84,method=6); return o
def banner(s,o):
    im=Image.open(D+s).convert('RGB'); im.thumbnail((960,960),Image.LANCZOS); im.save(D+o,'WEBP',quality=74,method=6); return im
def obj(s,o):
    img=key(D+s); img.save(D+o,'WEBP',quality=86,method=6); return img
